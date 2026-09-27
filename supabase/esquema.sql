-- Nuestro Hogar · base de datos en Supabase.
-- Copia TODO este archivo en Supabase → SQL Editor → New query → Run. Se puede correr varias veces sin daño.
--
-- Qué guarda:
--   parejas     la pareja (código para unirse) y la casa compartida: monedas, inventario, decoración, notas y fechas.
--   miembros    quién es Él y quién es Ella en cada pareja (una sesión anónima por celular).
--   personajes  el estado de cada personaje: necesidades, qué está haciendo y en qué cuarto.
--   eventos     lo que uno le manda al otro: besos, abrazos, caricias, regalos y notas.
--   recuerdos   el álbum: fotos, títulos y fechas.
-- Solo los dos miembros de una pareja pueden leer o cambiar sus datos (reglas RLS al final).

create table if not exists public.parejas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  casa jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  creada timestamptz not null default now()
);

create table if not exists public.miembros (
  pareja_id uuid not null references public.parejas(id) on delete cascade,
  rol text not null check (rol in ('el', 'ella')),
  usuario uuid not null,
  unido timestamptz not null default now(),
  primary key (pareja_id, rol)
);
create index if not exists miembros_usuario on public.miembros (usuario);

create table if not exists public.personajes (
  pareja_id uuid not null references public.parejas(id) on delete cascade,
  rol text not null check (rol in ('el', 'ella')),
  estado jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now(),
  primary key (pareja_id, rol)
);

create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  pareja_id uuid not null references public.parejas(id) on delete cascade,
  de text not null check (de in ('el', 'ella')),
  tipo text not null,
  datos jsonb not null default '{}'::jsonb,
  creado timestamptz not null default now(),
  visto boolean not null default false
);
create index if not exists eventos_pareja on public.eventos (pareja_id, creado desc);

create table if not exists public.recuerdos (
  id bigint generated always as identity primary key,
  pareja_id uuid not null references public.parejas(id) on delete cascade,
  autor text not null check (autor in ('el', 'ella')),
  titulo text not null default '',
  fecha date,
  foto text,
  creado timestamptz not null default now()
);

-- ¿La sesión actual es Él o Ella de esta pareja?
create or replace function public.es_miembro(p uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from miembros where pareja_id = p and usuario = auth.uid());
$$;

-- Crear una pareja nueva quedando como Él o Ella. Devuelve el código de 6 letras para que el otro se una.
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

-- Unirse con el código. También sirve para volver a entrar después de reinstalar o desde otro celular.
create or replace function public.unirse_pareja(cod text, mi_rol text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  p uuid;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  if mi_rol not in ('el', 'ella') then raise exception 'Rol inválido'; end if;
  select id into p from parejas where codigo = upper(trim(cod));
  if p is null then raise exception 'Código no encontrado'; end if;
  insert into miembros (pareja_id, rol, usuario) values (p, mi_rol, auth.uid())
  on conflict (pareja_id, rol) do update set usuario = excluded.usuario, unido = now();
  return p;
end $$;

-- Guardar la casa sin pisar un cambio del otro: solo se guarda si nadie la cambió desde que se leyó.
-- Devuelve la versión nueva, o -1 si hubo choque (el celular vuelve a leer y reintenta).
create or replace function public.guardar_casa(p uuid, nueva jsonb, version_leida bigint) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v bigint;
begin
  if not es_miembro(p) then raise exception 'No autorizado'; end if;
  update parejas set casa = nueva, version = version + 1
  where id = p and version = version_leida
  returning version into v;
  return coalesce(v, -1);
end $$;

-- Reglas: cada pareja solo ve y cambia lo suyo
alter table public.parejas enable row level security;
alter table public.miembros enable row level security;
alter table public.personajes enable row level security;
alter table public.eventos enable row level security;
alter table public.recuerdos enable row level security;

drop policy if exists "pareja: ver" on public.parejas;
create policy "pareja: ver" on public.parejas for select using (es_miembro(id));
drop policy if exists "miembros: ver" on public.miembros;
create policy "miembros: ver" on public.miembros for select using (es_miembro(pareja_id));
drop policy if exists "personajes: todo" on public.personajes;
create policy "personajes: todo" on public.personajes for all using (es_miembro(pareja_id)) with check (es_miembro(pareja_id));
drop policy if exists "eventos: todo" on public.eventos;
create policy "eventos: todo" on public.eventos for all using (es_miembro(pareja_id)) with check (es_miembro(pareja_id));
drop policy if exists "recuerdos: todo" on public.recuerdos;
create policy "recuerdos: todo" on public.recuerdos for all using (es_miembro(pareja_id)) with check (es_miembro(pareja_id));

grant execute on function public.crear_pareja(text), public.unirse_pareja(text, text),
  public.guardar_casa(uuid, jsonb, bigint), public.es_miembro(uuid) to authenticated;

-- Tiempo real: el otro celular se entera al instante
do $$
declare t text;
begin
  foreach t in array array['parejas', 'personajes', 'eventos', 'recuerdos'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- Fotos del álbum: carpeta privada «recuerdos», una subcarpeta por pareja
insert into storage.buckets (id, name, public) values ('recuerdos', 'recuerdos', false)
on conflict (id) do nothing;
drop policy if exists "recuerdos: ver fotos" on storage.objects;
create policy "recuerdos: ver fotos" on storage.objects for select
  using (bucket_id = 'recuerdos' and public.es_miembro(((storage.foldername(name))[1])::uuid));
drop policy if exists "recuerdos: subir fotos" on storage.objects;
create policy "recuerdos: subir fotos" on storage.objects for insert
  with check (bucket_id = 'recuerdos' and public.es_miembro(((storage.foldername(name))[1])::uuid));
