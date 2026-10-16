-- Reto diario del patio: seudónimo y mejor marca; no toca las tablas de la casa.
-- Aplicar como migración en el mismo proyecto Supabase de la aplicación.
-- Las partidas son una competición amistosa: el cliente comunica su resultado, sin premios económicos.
begin;
create table if not exists public.patio_perfiles (
 id uuid primary key,
 token_hash bytea not null,
 nombre text not null check (char_length(nombre) between 1 and 16)
);
create table if not exists public.patio_marcas (
 fecha date not null,
 perfil uuid not null references public.patio_perfiles(id),
 juego text not null,
 puntos integer not null check (puntos between 0 and 10000),
 milisegundos integer not null check (milisegundos between 1000 and 900000),
 creado timestamptz not null default now(),
 primary key (fecha, perfil)
);
alter table public.patio_perfiles enable row level security;
alter table public.patio_marcas enable row level security;
revoke all on public.patio_perfiles, public.patio_marcas from anon, authenticated;
create index if not exists patio_marcas_orden on public.patio_marcas(fecha, puntos desc, milisegundos, creado);

create or replace function public.patio_tabla(p_fecha date)
returns table (nombre text, puntos integer, milisegundos integer, juego text)
language sql stable security definer set search_path = pg_catalog, public
as $$
 select p.nombre, m.puntos, m.milisegundos, m.juego
 from public.patio_marcas m join public.patio_perfiles p on p.id = m.perfil
 where m.fecha = p_fecha and p_fecha between ((now() at time zone 'America/Bogota')::date - 90) and (now() at time zone 'America/Bogota')::date
 order by m.puntos desc, m.milisegundos, m.creado, m.perfil limit 100;
$$;

create or replace function public.patio_publicar(p_perfil uuid, p_token text, p_nombre text, p_fecha date, p_juego text, p_puntos integer, p_milisegundos integer)
returns boolean language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
 nombre_limpio text;
 esperado text;
 huella bytea;
 guardada bytea;
begin
 if p_fecha is distinct from (now() at time zone 'America/Bogota')::date then raise exception 'El reto ya cambió de día'; end if;
 esperado := (array['parejas','simon','cuadricula','diferencias','buscar','stroop','calculo','sudoku','sopa','anagramas','deslizante','tangram','hanoi','laberinto','compras','nback'])[1 + (((p_fecha - date '1970-01-01') % 16 + 16) % 16)];
 if p_juego is distinct from esperado then raise exception 'Ese juego no corresponde al reto de hoy'; end if;
 if p_perfil is null or p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'Perfil inválido'; end if;
 if p_puntos is null or p_puntos < 0 or p_puntos > 10000 or p_milisegundos is null or p_milisegundos < 1000 or p_milisegundos > 900000 then raise exception 'Marca inválida'; end if;
 nombre_limpio := left(trim(regexp_replace(coalesce(p_nombre,''), '[[:cntrl:]<>&"''`]', '', 'g')), 16);
 if char_length(nombre_limpio) = 0 then raise exception 'Elige un nombre para la clasificación'; end if;
 huella := sha256(convert_to(p_token, 'UTF8'));
 insert into public.patio_perfiles(id, token_hash, nombre) values(p_perfil, huella, nombre_limpio) on conflict(id) do nothing;
 select token_hash into guardada from public.patio_perfiles where id = p_perfil for update;
 if guardada is distinct from huella then raise exception 'Este perfil pertenece a otro dispositivo'; end if;
 update public.patio_perfiles set nombre = nombre_limpio where id = p_perfil;
 insert into public.patio_marcas(fecha,perfil,juego,puntos,milisegundos) values(p_fecha,p_perfil,p_juego,p_puntos,p_milisegundos)
 on conflict(fecha,perfil) do update set juego=excluded.juego,puntos=excluded.puntos,milisegundos=excluded.milisegundos,creado=now()
 where excluded.puntos > patio_marcas.puntos or (excluded.puntos = patio_marcas.puntos and excluded.milisegundos < patio_marcas.milisegundos);
 return true;
end;
$$;
revoke all on function public.patio_tabla(date) from public;
revoke all on function public.patio_publicar(uuid,text,text,date,text,integer,integer) from public;
grant execute on function public.patio_tabla(date) to anon, authenticated;
grant execute on function public.patio_publicar(uuid,text,text,date,text,integer,integer) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
