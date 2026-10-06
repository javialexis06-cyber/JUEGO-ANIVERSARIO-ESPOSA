-- Nuestro Hogar · cambios pendientes de la base de datos (auditoría).
-- Pégalo completo en Supabase → SQL Editor → New query → Run, DESPUÉS de esquema.sql. Se puede correr varias veces.
-- Nada de esto cambia cómo se juega: cierra puertas que la app nunca usa y que alguien podría usar mal.
--
-- Qué arregla (detalle en docs/archivo/auditoria.md, sección «Base de datos»):
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

-- ===============================================================================================================
-- 9. CUENTAS CON CONTRASEÑA: el mismo Javier y la misma Laura desde cualquier aparato
-- ===============================================================================================================
-- Cada celular que ya está en la casa le crea solo su cuenta a su personaje (usuario «javier» o «laura», contraseña
-- de base TEAMO, que se puede cambiar en Ajustes). En otro celular o en el computador: «Soy Javier» o «Soy Laura» →
-- la contraseña → entra a la misma casa como el mismo personaje, con todo su progreso, y queda abierto para siempre.
-- Así los amigos que tengan la app no pueden entrar como ellos. Un personaje con cuenta ya no se puede tomar con el
-- código: solo con su contraseña. Cada persona puede tener varios aparatos a la vez (celular y computador). La
-- contraseña no distingue mayúsculas y se guarda cifrada (bcrypt): nadie la puede leer, ni desde la app ni desde aquí.
create extension if not exists pgcrypto;

create table if not exists public.cuentas (
  pareja_id uuid not null references public.parejas(id) on delete cascade,
  rol text not null check (rol in ('el', 'ella')),
  usuario text not null unique check (usuario ~ '^[a-z0-9_.-]{3,24}$'),
  clave text not null,
  creada timestamptz not null default now(),
  primary key (pareja_id, rol)
);
alter table public.cuentas enable row level security;
revoke all on public.cuentas from anon, authenticated;

-- Los aparatos donde cada uno entró con su cuenta (además del de `miembros`, el primero de cada personaje)
create table if not exists public.aparatos (
  pareja_id uuid not null references public.parejas(id) on delete cascade,
  rol text not null check (rol in ('el', 'ella')),
  usuario uuid not null,
  desde timestamptz not null default now(),
  visto timestamptz not null default now(),
  primary key (pareja_id, usuario)
);
create index if not exists aparatos_usuario on public.aparatos (usuario);
alter table public.aparatos enable row level security;
revoke all on public.aparatos from anon, authenticated;

-- Intentos de contraseña equivocados (por aparato y por usuario): frena a quien quiera adivinarla
create table if not exists public.intentos_cuenta (
  quien text not null,
  t timestamptz not null default now()
);
create index if not exists intentos_cuenta_quien on public.intentos_cuenta (quien, t desc);
alter table public.intentos_cuenta enable row level security;
revoke all on public.intentos_cuenta from anon, authenticated;

-- Ser de la casa (o ser tal personaje) ahora también es haber entrado con la cuenta en este aparato.
-- Todas las reglas de antes (casa, personajes, eventos, recuerdos, fotos) usan estas dos funciones.
create or replace function public.es_miembro(p uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from miembros where pareja_id = p and usuario = auth.uid())
      or exists (select 1 from aparatos where pareja_id = p and usuario = auth.uid());
$$;
create or replace function public.es_rol(p uuid, r text) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from miembros where pareja_id = p and rol = r and usuario = auth.uid())
      or exists (select 1 from aparatos where pareja_id = p and rol = r and usuario = auth.uid());
$$;

-- Unirse con el código: igual que antes, pero un personaje con cuenta solo se toma iniciando sesión
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
    insert into intentos_union (usuario) values (auth.uid());
    delete from intentos_union where t < now() - interval '1 day';
    return null;
  end if;
  -- Ya es este personaje en este aparato: entra sin tocar nada
  if es_rol(p, mi_rol) then return p; end if;
  if exists (select 1 from cuentas where pareja_id = p and rol = mi_rol) then
    raise exception 'Cuenta requerida: este personaje tiene usuario y contraseña';
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

-- Volver a la casa al abrir la app (o un minijuego). Si este aparato ya es ese personaje, entra. Si no (se borraron
-- los datos o se reinstaló) y el personaje no tiene cuenta, vuelve a quedarse con él como siempre; si tiene cuenta,
-- hay que iniciar sesión.
create or replace function public.volver_a_casa(cod text, mi_rol text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  p uuid;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  select id into p from parejas where codigo = upper(trim(cod));
  if p is not null and es_rol(p, mi_rol) then
    update aparatos set visto = now() where pareja_id = p and usuario = auth.uid();
    return p;
  end if;
  -- (un código que no existe también pasa por aquí: queda anotado el intento, como al unirse)
  return unirse_pareja(cod, mi_rol, true);
end $$;
revoke execute on function public.volver_a_casa(text, text) from public, anon;
grant execute on function public.volver_a_casa(text, text) to authenticated;

-- Hacerse la cuenta (desde un aparato que ya es ese personaje)
create or replace function public.crear_cuenta(p uuid, mi_rol text, nombre text, contrasena text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  u text := lower(trim(nombre));
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  if mi_rol not in ('el', 'ella') or not es_rol(p, mi_rol) then raise exception 'No autorizado'; end if;
  if u !~ '^[a-z0-9_.-]{3,24}$' then
    raise exception 'El usuario debe tener de 3 a 24 letras o números, sin espacios ni tildes';
  end if;
  if char_length(trim(coalesce(contrasena, ''))) < 4 or char_length(contrasena) > 72 then
    raise exception 'La contraseña debe tener al menos 4 caracteres';
  end if;
  if exists (select 1 from cuentas where pareja_id = p and rol = mi_rol) then
    raise exception 'Este personaje ya tiene cuenta';
  end if;
  if exists (select 1 from cuentas where usuario = u) then raise exception 'Ese usuario ya existe: escoge otro'; end if;
  insert into cuentas (pareja_id, rol, usuario, clave) values (p, mi_rol, u, crypt(lower(trim(contrasena)), gen_salt('bf', 10)));
  insert into aparatos (pareja_id, rol, usuario) values (p, mi_rol, auth.uid())
  on conflict (pareja_id, usuario) do update set rol = excluded.rol, visto = now();
end $$;
revoke execute on function public.crear_cuenta(uuid, text, text, text) from public, anon;
grant execute on function public.crear_cuenta(uuid, text, text, text) to authenticated;

-- Iniciar sesión en un aparato nuevo. Devuelve la casa y el personaje, o nada si la contraseña no es (con un error no
-- quedaría anotado el intento). Si el usuario todavía no existe, avisa «Cuenta no existe» (la app ofrece entonces
-- crear la casa o unirse con el código, como la primera vez). 10 errores por aparato en una hora o 8 por usuario en
-- 15 minutos bloquean un rato.
create or replace function public.entrar_cuenta(nombre text, contrasena text)
returns table (pareja uuid, papel text, codigo_casa text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  u text := lower(trim(nombre));
  c record;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  if (select count(*) from intentos_cuenta i where i.quien = auth.uid()::text and i.t > now() - interval '1 hour') >= 10
     or (select count(*) from intentos_cuenta i where i.quien = 'u:' || u and i.t > now() - interval '15 minutes') >= 8 then
    raise exception 'Demasiados intentos. Espera un rato y vuelve a intentar.';
  end if;
  select cu.pareja_id, cu.rol, cu.clave into c from cuentas cu where cu.usuario = u;
  if c.pareja_id is null then raise exception 'Cuenta no existe'; end if;
  if c.clave <> crypt(lower(trim(coalesce(contrasena, ''))), c.clave) then
    insert into intentos_cuenta (quien) values (auth.uid()::text), ('u:' || u);
    delete from intentos_cuenta i where i.t < now() - interval '1 day';
    return;
  end if;
  insert into aparatos (pareja_id, rol, usuario) values (c.pareja_id, c.rol, auth.uid())
  on conflict (pareja_id, usuario) do update set rol = excluded.rol, visto = now();
  return query select c.pareja_id, c.rol::text, pa.codigo from parejas pa where pa.id = c.pareja_id;
end $$;
revoke execute on function public.entrar_cuenta(text, text) from public, anon;
grant execute on function public.entrar_cuenta(text, text) to authenticated;

-- Cambiar la contraseña (desde cualquier aparato donde ya se entró como ese personaje: sirve si se olvidó)
create or replace function public.cambiar_contrasena(p uuid, mi_rol text, nueva text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  if mi_rol not in ('el', 'ella') or not es_rol(p, mi_rol) then raise exception 'No autorizado'; end if;
  if char_length(trim(coalesce(nueva, ''))) < 4 or char_length(nueva) > 72 then
    raise exception 'La contraseña debe tener al menos 4 caracteres';
  end if;
  update cuentas set clave = crypt(lower(trim(nueva)), gen_salt('bf', 10)) where pareja_id = p and rol = mi_rol;
  if not found then raise exception 'Este personaje todavía no tiene cuenta'; end if;
end $$;
revoke execute on function public.cambiar_contrasena(uuid, text, text) from public, anon;
grant execute on function public.cambiar_contrasena(uuid, text, text) to authenticated;

-- Quién de la casa ya tiene cuenta (y con qué usuario): para la hoja «Mi cuenta»
create or replace function public.cuentas_de(p uuid) returns table (papel text, usuario text)
language plpgsql security definer set search_path = public stable as $$
begin
  if not es_miembro(p) then raise exception 'No autorizado'; end if;
  return query select cu.rol::text, cu.usuario from cuentas cu where cu.pareja_id = p;
end $$;
revoke execute on function public.cuentas_de(uuid) from public, anon;
grant execute on function public.cuentas_de(uuid) to authenticated;

-- Cerrar la sesión en este aparato (la casa y la cuenta siguen; se vuelve a entrar con usuario y contraseña)
create or replace function public.salir_de_casa(p uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  delete from aparatos where pareja_id = p and usuario = auth.uid();
  -- El aparato titular de un personaje con cuenta también suelta su puesto (el personaje sigue siendo de la cuenta)
  delete from miembros m where m.pareja_id = p and m.usuario = auth.uid()
    and exists (select 1 from cuentas cu where cu.pareja_id = p and cu.rol = m.rol);
end $$;
revoke execute on function public.salir_de_casa(uuid) from public, anon;
grant execute on function public.salir_de_casa(uuid) to authenticated;

revoke execute on function public.es_miembro(uuid) from public, anon;
revoke execute on function public.es_rol(uuid, text) from public, anon;
grant execute on function public.es_miembro(uuid), public.es_rol(uuid, text) to authenticated;

-- ===============================================================================================================
-- 10. LATIDO: que el proyecto gratis no se pause por inactividad
-- ===============================================================================================================
-- Supabase pausa los proyectos gratis que pasan 7 días sin uso. El trabajo «Latido de Supabase» de GitHub Actions
-- (.github/workflows/latido-supabase.yml) llama esta función cada 3 días: es la consulta más pequeñita posible y
-- cuenta como uso. No lee ni cambia nada de la casa.
create or replace function public.latido() returns timestamptz
language sql stable set search_path = public as $$
  select now();
$$;
grant execute on function public.latido() to anon, authenticated;
