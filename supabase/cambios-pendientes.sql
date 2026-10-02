-- Nuestro Hogar · cambios pendientes de la base de datos (auditoría).
-- Pégalo completo en Supabase → SQL Editor → New query → Run, DESPUÉS de esquema.sql. Se puede correr varias veces.
-- Nada de esto cambia cómo se juega: cierra puertas que la app nunca usa y que alguien podría usar mal.
--
-- Qué arregla (detalle en docs/auditoria.md, sección «Base de datos»):
--   1. Las funciones de la pareja quedaban abiertas a cualquiera (Postgres da permiso a «public» por defecto):
--      ahora solo las llaman celulares con sesión.
--   2. Cada personaje solo lo escribe su dueño: Ella no puede cambiar el personaje de Él ni al revés
--      (antes cualquiera de los dos podía escribir los dos).
--   3. Los eventos (besos, regalos, notas…) solo se mandan a nombre propio, y de un evento ya mandado solo se puede
--      cambiar «visto» (antes se podía reescribir lo que decía o borrarlo).
--   4. Los recuerdos se suben a nombre propio.
--   5. Adivinar códigos a la fuerza: más de 20 códigos equivocados en una hora y se bloquea un rato.
--   6. Nadie crea más de 5 casas (evita llenar la base de casas vacías).
--   7. La casa guardada no puede pasar de 1 MB (un error de la app no llena la base) y las fotos/audios de 5 MB.
--   8. Los eventos viejos ya vistos (más de 30 días) se borran solos: la tabla no crece para siempre.

-- ---------------------------------------------------------------------------------------------------------------
-- 1. Permisos de las funciones: solo sesiones (los celulares entran con sesión anónima, que es «authenticated»)
revoke execute on function public.crear_pareja(text) from public, anon;
revoke execute on function public.unirse_pareja(text, text, boolean) from public, anon;
revoke execute on function public.guardar_casa(uuid, jsonb, bigint) from public, anon;
revoke execute on function public.es_miembro(uuid) from public, anon;
revoke execute on function public.carpeta_de_mi_casa(text) from public, anon;
grant execute on function public.crear_pareja(text), public.unirse_pareja(text, text, boolean),
  public.guardar_casa(uuid, jsonb, bigint), public.es_miembro(uuid), public.carpeta_de_mi_casa(text) to authenticated;

-- ¿La sesión actual es este personaje (Él o Ella) de esta pareja?
create or replace function public.es_rol(p uuid, r text) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from miembros where pareja_id = p and rol = r and usuario = auth.uid());
$$;
revoke execute on function public.es_rol(uuid, text) from public, anon;
grant execute on function public.es_rol(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- 2. Personajes: los dos los ven; cada uno escribe solo el suyo
drop policy if exists "personajes: todo" on public.personajes;
drop policy if exists "personajes: ver" on public.personajes;
drop policy if exists "personajes: crear el mío" on public.personajes;
drop policy if exists "personajes: cambiar el mío" on public.personajes;
create policy "personajes: ver" on public.personajes for select using (es_miembro(pareja_id));
create policy "personajes: crear el mío" on public.personajes for insert with check (es_rol(pareja_id, rol));
create policy "personajes: cambiar el mío" on public.personajes for update using (es_rol(pareja_id, rol)) with check (es_rol(pareja_id, rol));
-- (borrar personajes: nadie; al borrar la pareja se van solos)

-- ---------------------------------------------------------------------------------------------------------------
-- 3. Eventos: se ven los de la casa, se mandan a nombre propio y de los mandados solo cambia «visto»
drop policy if exists "eventos: todo" on public.eventos;
drop policy if exists "eventos: ver" on public.eventos;
drop policy if exists "eventos: mandar" on public.eventos;
drop policy if exists "eventos: marcar visto" on public.eventos;
create policy "eventos: ver" on public.eventos for select using (es_miembro(pareja_id));
create policy "eventos: mandar" on public.eventos for insert with check (es_rol(pareja_id, de));
create policy "eventos: marcar visto" on public.eventos for update using (es_miembro(pareja_id)) with check (es_miembro(pareja_id));
revoke update on public.eventos from anon, authenticated;
grant update (visto) on public.eventos to authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- 4. Recuerdos: los dos los ven y los pueden quitar; se suben a nombre propio
drop policy if exists "recuerdos: todo" on public.recuerdos;
drop policy if exists "recuerdos: ver" on public.recuerdos;
drop policy if exists "recuerdos: subir" on public.recuerdos;
drop policy if exists "recuerdos: cambiar" on public.recuerdos;
drop policy if exists "recuerdos: quitar" on public.recuerdos;
create policy "recuerdos: ver" on public.recuerdos for select using (es_miembro(pareja_id));
create policy "recuerdos: subir" on public.recuerdos for insert with check (es_rol(pareja_id, autor));
create policy "recuerdos: cambiar" on public.recuerdos for update using (es_miembro(pareja_id)) with check (es_rol(pareja_id, autor));
create policy "recuerdos: quitar" on public.recuerdos for delete using (es_miembro(pareja_id));

-- ---------------------------------------------------------------------------------------------------------------
-- 5 y 6. Unirse y crear con límites (los mismos mensajes de siempre, más «Demasiados intentos»)
create table if not exists public.intentos_union (
  usuario uuid not null,
  t timestamptz not null default now()
);
create index if not exists intentos_union_usuario on public.intentos_union (usuario, t desc);
alter table public.intentos_union enable row level security;
-- (sin reglas: nadie la lee ni la escribe desde la app; solo las funciones de abajo)
revoke all on public.intentos_union from anon, authenticated;

create or replace function public.unirse_pareja(cod text, mi_rol text, reemplazar boolean default false) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  p uuid;
  actual uuid;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  if mi_rol not in ('el', 'ella') then raise exception 'Rol inválido'; end if;
  if (select count(*) from intentos_union where usuario = auth.uid() and t > now() - interval '1 hour') >= 20 then
    raise exception 'Demasiados intentos con códigos equivocados. Espera un rato y vuelve a intentar.';
  end if;
  select id into p from parejas where codigo = upper(trim(cod));
  if p is null then
    -- Código equivocado: se anota el intento y se devuelve vacío (con un error la anotación se desharía).
    -- La app (desde esta versión) lo muestra como «Ese código no existe».
    insert into intentos_union (usuario) values (auth.uid());
    delete from intentos_union where t < now() - interval '1 day';
    return null;
  end if;
  select usuario into actual from miembros where pareja_id = p and rol = mi_rol;
  if actual is not null and actual <> auth.uid() and not coalesce(reemplazar, false) then
    raise exception 'Personaje ocupado';
  end if;
  insert into miembros (pareja_id, rol, usuario) values (p, mi_rol, auth.uid())
  on conflict (pareja_id, rol) do update set usuario = excluded.usuario, unido = now();
  return p;
end $$;
revoke execute on function public.unirse_pareja(text, text, boolean) from public, anon;
grant execute on function public.unirse_pareja(text, text, boolean) to authenticated;

create or replace function public.crear_pareja(mi_rol text)
returns table (pareja uuid, codigo text)
language plpgsql security definer set search_path = public as $$
declare
  c text;
  p uuid;
  letras constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  if mi_rol not in ('el', 'ella') then raise exception 'Rol inválido'; end if;
  if (select count(*) from miembros where usuario = auth.uid()) >= 5 then
    raise exception 'Este celular ya tiene demasiadas casas. Entra con el código de la que ya tienen.';
  end if;
  loop
    c := '';
    for i in 1..6 loop
      c := c || substr(letras, 1 + floor(random() * length(letras))::int, 1);
    end loop;
    exit when not exists (select 1 from parejas where parejas.codigo = c);
  end loop;
  insert into parejas (codigo) values (c) returning id into p;
  insert into miembros (pareja_id, rol, usuario) values (p, mi_rol, auth.uid());
  return query select p, c;
end $$;
revoke execute on function public.crear_pareja(text) from public, anon;
grant execute on function public.crear_pareja(text) to authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- 7. Tamaños máximos
create or replace function public.guardar_casa(p uuid, nueva jsonb, version_leida bigint) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v bigint;
begin
  if not es_miembro(p) then raise exception 'No autorizado'; end if;
  if jsonb_typeof(nueva) <> 'object' then raise exception 'Casa inválida'; end if;
  if pg_column_size(nueva) > 1000000 then raise exception 'La casa quedó muy pesada para guardarla'; end if;
  update parejas set casa = nueva, version = version + 1
  where id = p and version = version_leida
  returning version into v;
  return coalesce(v, -1);
end $$;
revoke execute on function public.guardar_casa(uuid, jsonb, bigint) from public, anon;
grant execute on function public.guardar_casa(uuid, jsonb, bigint) to authenticated;

update storage.buckets set file_size_limit = 5242880 where id = 'recuerdos';

-- ---------------------------------------------------------------------------------------------------------------
-- 8. Eventos viejos ya vistos se borran solos (cada vez que llega uno nuevo a la casa; el índice lo hace barato)
create or replace function public.limpiar_eventos() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from eventos where pareja_id = new.pareja_id and visto and creado < now() - interval '30 days';
  return new;
end $$;
revoke execute on function public.limpiar_eventos() from public, anon, authenticated;
drop trigger if exists limpiar_eventos on public.eventos;
create trigger limpiar_eventos after insert on public.eventos for each row execute function public.limpiar_eventos();
