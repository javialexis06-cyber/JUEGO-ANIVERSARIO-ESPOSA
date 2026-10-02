-- Pruebas de cambios-pendientes.sql (después de esquema.sql y cambios-pendientes.sql): cada personaje lo escribe solo
-- su dueño, los eventos van a nombre propio y solo se les cambia «visto», límites de intentos, de casas y de tamaño.
-- Uso: psql -d <base> -f imitar_supabase.sql -f ../esquema.sql -f ../cambios-pendientes.sql -f probar_cambios.sql
\set QUIET on
\pset tuples_only on
\pset format unaligned
set client_min_messages = notice;

create or replace function pg_temp.como(u text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', u, false);
  execute 'set role authenticated';
end $$;
create or replace function pg_temp.ver(ok boolean, texto text) returns text language sql as $$
  select case when ok then 'OK    ' else 'FALLA ' end || texto
$$;

-- Él (A) crea la casa y Ella (B) se une
select pg_temp.como('00000000-0000-0000-0000-0000000000a1');
select set_config('prueba.pareja', pareja::text, false), set_config('prueba.codigo', codigo, false) from crear_pareja('el');
select pg_temp.como('00000000-0000-0000-0000-0000000000b1');
select pg_temp.ver(unirse_pareja(current_setting('prueba.codigo'), 'ella') = current_setting('prueba.pareja')::uuid, 'Ella entra con el código');

-- Personajes: cada uno el suyo
select pg_temp.como('00000000-0000-0000-0000-0000000000a1');
insert into personajes (pareja_id, rol, estado) values (current_setting('prueba.pareja')::uuid, 'el', '{"hambre": 80}')
on conflict (pareja_id, rol) do update set estado = excluded.estado;
select pg_temp.ver(count(*) = 1, 'Él guarda su personaje (upsert)') from personajes where pareja_id = current_setting('prueba.pareja')::uuid and rol = 'el';
insert into personajes (pareja_id, rol, estado) values (current_setting('prueba.pareja')::uuid, 'el', '{"hambre": 70}')
on conflict (pareja_id, rol) do update set estado = excluded.estado;
select pg_temp.ver((estado->>'hambre')::int = 70, 'Él vuelve a guardar el suyo (upsert sobre su fila)') from personajes where pareja_id = current_setting('prueba.pareja')::uuid and rol = 'el';
do $$ begin
  insert into personajes (pareja_id, rol, estado) values (current_setting('prueba.pareja')::uuid, 'ella', '{"hambre": 1}');
  raise notice 'FALLA Él pudo crear el personaje de Ella';
exception when others then raise notice 'OK    Él no puede crear el personaje de Ella';
end $$;
select pg_temp.como('00000000-0000-0000-0000-0000000000b1');
insert into personajes (pareja_id, rol, estado) values (current_setting('prueba.pareja')::uuid, 'ella', '{"hambre": 90}')
on conflict (pareja_id, rol) do update set estado = excluded.estado;
with u as (update personajes set estado = '{"hambre": 0}' where pareja_id = current_setting('prueba.pareja')::uuid and rol = 'el' returning 1)
select pg_temp.ver(count(*) = 0, 'Ella no puede cambiar el personaje de Él') from u;
select pg_temp.ver(count(*) = 2, 'Ella ve los dos personajes') from personajes where pareja_id = current_setting('prueba.pareja')::uuid;
with d as (delete from personajes where pareja_id = current_setting('prueba.pareja')::uuid returning 1)
select pg_temp.ver(count(*) = 0, 'nadie borra personajes') from d;

-- Eventos: a nombre propio; de los mandados solo cambia «visto»
insert into eventos (pareja_id, de, tipo, datos) values (current_setting('prueba.pareja')::uuid, 'ella', 'beso', '{}');
select pg_temp.ver(true, 'Ella manda un beso a su nombre');
do $$ begin
  insert into eventos (pareja_id, de, tipo, datos) values (current_setting('prueba.pareja')::uuid, 'el', 'nalgada', '{}');
  raise notice 'FALLA Ella pudo mandar un evento a nombre de Él';
exception when others then raise notice 'OK    Ella no puede mandar eventos a nombre de Él';
end $$;
select pg_temp.como('00000000-0000-0000-0000-0000000000a1');
with e as (update eventos set visto = true where pareja_id = current_setting('prueba.pareja')::uuid and de = 'ella' returning 1)
select pg_temp.ver(count(*) = 1, 'Él marca como visto el beso de Ella') from e;
do $$ begin
  update eventos set datos = '{"falso": true}' where pareja_id = current_setting('prueba.pareja')::uuid;
  raise notice 'FALLA se pudo reescribir lo que decía un evento';
exception when others then raise notice 'OK    no se puede reescribir lo que dice un evento';
end $$;
with d as (delete from eventos where pareja_id = current_setting('prueba.pareja')::uuid returning 1)
select pg_temp.ver(count(*) = 0, 'nadie borra eventos') from d;

-- Recuerdos a nombre propio
insert into recuerdos (pareja_id, autor, titulo) values (current_setting('prueba.pareja')::uuid, 'el', 'Medellín');
select pg_temp.ver(true, 'Él sube un recuerdo a su nombre');
do $$ begin
  insert into recuerdos (pareja_id, autor, titulo) values (current_setting('prueba.pareja')::uuid, 'ella', 'falso');
  raise notice 'FALLA Él pudo subir un recuerdo a nombre de Ella';
exception when others then raise notice 'OK    Él no puede subir recuerdos a nombre de Ella';
end $$;

-- La casa: tamaño máximo y solo objetos
do $$ begin
  perform guardar_casa(current_setting('prueba.pareja')::uuid, jsonb_build_object('relleno', repeat(md5(random()::text), 40000)), 0);
  raise notice 'FALLA se guardó una casa de más de 1 MB';
exception when others then raise notice 'OK    no se guarda una casa gigante (%)', sqlerrm;
end $$;
do $$ begin
  perform guardar_casa(current_setting('prueba.pareja')::uuid, '[1,2,3]', 0);
  raise notice 'FALLA se guardó una casa que no es un objeto';
exception when others then raise notice 'OK    la casa tiene que ser un objeto (%)', sqlerrm;
end $$;
select pg_temp.ver(guardar_casa(current_setting('prueba.pareja')::uuid, '{"monedas": 40}', 0) = 1, 'una casa normal se guarda');

-- Adivinar códigos: a los 20 equivocados se bloquea
select pg_temp.como('00000000-0000-0000-0000-0000000000c1');
select pg_temp.ver(bool_and(unirse_pareja('ZZZ' || lpad(i::text, 3, '0'), 'el') is null), '20 códigos inventados no dejan entrar') from generate_series(1, 20) i;
do $$ begin
  perform unirse_pareja(current_setting('prueba.codigo'), 'el', true);
  raise notice 'FALLA después de 20 intentos todavía deja probar códigos';
exception when others then raise notice 'OK    después de 20 intentos se bloquea un rato (%)', sqlerrm;
end $$;
select pg_temp.como('00000000-0000-0000-0000-0000000000a1');
select pg_temp.ver(count(*) = 1, 'el intruso no se quedó con Él') from miembros
where pareja_id = current_setting('prueba.pareja')::uuid and rol = 'el' and usuario = '00000000-0000-0000-0000-0000000000a1';
select pg_temp.ver(unirse_pareja(current_setting('prueba.codigo'), 'el') = current_setting('prueba.pareja')::uuid, 'Él sigue entrando normal');

-- Máximo 5 casas por celular
select pg_temp.como('00000000-0000-0000-0000-0000000000d1');
select count(*) from (select crear_pareja('el') from generate_series(1, 5)) x;
do $$ begin
  perform crear_pareja('el');
  raise notice 'FALLA un celular pudo crear más de 5 casas';
exception when others then raise notice 'OK    un celular no crea más de 5 casas (%)', sqlerrm;
end $$;

-- Un extraño sin sesión no llama las funciones
reset role;
set role anon;
do $$ begin
  perform crear_pareja('el');
  raise notice 'FALLA alguien sin sesión pudo llamar crear_pareja';
exception when others then raise notice 'OK    sin sesión no se llaman las funciones (%)', sqlerrm;
end $$;
reset role;
