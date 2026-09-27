-- Pruebas de las reglas de esquema.sql con tres sesiones: A (Él), B (Ella) y C (un extraño).
-- Uso: psql -d <base con imitar_supabase.sql y esquema.sql> -f probar_reglas.sql
-- Cada línea dice OK o FALLA.
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

-- A crea la casa como Él
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select set_config('prueba.pareja', pareja::text, false), set_config('prueba.codigo', codigo, false) from crear_pareja('el');
select pg_temp.ver(length(current_setting('prueba.codigo')) = 6, 'crear_pareja devuelve un código de 6 letras');
select pg_temp.ver(count(*) = 1, 'A ve su casa') from parejas where id = current_setting('prueba.pareja')::uuid;

-- C no ve nada de esa casa
select pg_temp.como('00000000-0000-0000-0000-00000000000c');
select pg_temp.ver(count(*) = 0, 'C no ve la casa ajena') from parejas where id = current_setting('prueba.pareja')::uuid;
select pg_temp.ver(count(*) = 0, 'C no ve los miembros ajenos') from miembros where pareja_id = current_setting('prueba.pareja')::uuid;
do $$ begin
  perform guardar_casa(current_setting('prueba.pareja')::uuid, '{"monedas": 9999}', 0);
  raise notice 'FALLA C pudo guardar la casa ajena';
exception when others then raise notice 'OK    C no puede guardar la casa ajena (%)', sqlerrm;
end $$;
do $$ begin
  insert into eventos (pareja_id, de, tipo) values (current_setting('prueba.pareja')::uuid, 'el', 'beso');
  raise notice 'FALLA C pudo mandar un evento a la casa ajena';
exception when others then raise notice 'OK    C no puede mandar eventos a la casa ajena';
end $$;
do $$ begin
  insert into personajes (pareja_id, rol, estado) values (current_setting('prueba.pareja')::uuid, 'el', '{}');
  raise notice 'FALLA C pudo escribir un personaje ajeno';
exception when others then raise notice 'OK    C no puede escribir personajes ajenos';
end $$;
do $$ begin
  perform unirse_pareja('ZZZZZZ', 'ella');
  raise notice 'FALLA un código inventado dejó entrar';
exception when others then raise notice 'OK    un código inventado no deja entrar (%)', sqlerrm;
end $$;
do $$ begin
  perform unirse_pareja(current_setting('prueba.codigo'), 'otro');
  raise notice 'FALLA un rol inválido dejó entrar';
exception when others then raise notice 'OK    un rol inválido no deja entrar';
end $$;

-- B se une como Ella (código en minúsculas y con espacios)
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select pg_temp.ver(unirse_pareja('  ' || lower(current_setting('prueba.codigo')) || ' ', 'ella') = current_setting('prueba.pareja')::uuid,
  'B entra con el código aunque lo escriba en minúsculas');
select pg_temp.ver(count(*) = 2, 'B ve a los dos miembros') from miembros where pareja_id = current_setting('prueba.pareja')::uuid;

-- Guardar la casa con versiones (dos celulares a la vez)
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select pg_temp.ver(guardar_casa(current_setting('prueba.pareja')::uuid, '{"monedas": 100}', 0) = 1, 'A guarda la casa (versión 1)');
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select pg_temp.ver(guardar_casa(current_setting('prueba.pareja')::uuid, '{"monedas": 50}', 0) = -1, 'B con la versión vieja choca (-1) y no pisa a A');
select pg_temp.ver((casa->>'monedas')::int = 100, 'la casa sigue con lo de A') from parejas where id = current_setting('prueba.pareja')::uuid;
select pg_temp.ver(guardar_casa(current_setting('prueba.pareja')::uuid, '{"monedas": 60}', 1) = 2, 'B con la versión nueva guarda (versión 2)');

-- Nadie cambia la casa por fuera de guardar_casa
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
with c as (update parejas set casa = '{"monedas": 1000000}' where id = current_setting('prueba.pareja')::uuid returning 1)
select pg_temp.ver(count(*) = 0, 'A no puede cambiar la casa directo (sin versión)') from c;

-- Personajes y eventos entre los dos
insert into personajes (pareja_id, rol, estado) values (current_setting('prueba.pareja')::uuid, 'el', '{"hambre": 80}')
on conflict (pareja_id, rol) do update set estado = excluded.estado;
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select pg_temp.ver(count(*) = 1, 'B ve el personaje de A') from personajes where pareja_id = current_setting('prueba.pareja')::uuid;
insert into eventos (pareja_id, de, tipo, datos) values (current_setting('prueba.pareja')::uuid, 'ella', 'beso', '{}');
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
with e as (update eventos set visto = true where pareja_id = current_setting('prueba.pareja')::uuid and de = 'ella' returning 1)
select pg_temp.ver(count(*) = 1, 'A marca como visto el beso de B') from e;
do $$ begin
  insert into eventos (pareja_id, de, tipo) values (current_setting('prueba.pareja')::uuid, 'nadie', 'beso');
  raise notice 'FALLA se aceptó un evento de alguien que no es Él ni Ella';
exception when others then raise notice 'OK    los eventos solo pueden ser de Él o de Ella';
end $$;

-- Fotos: solo en la carpeta de su casa
insert into storage.objects (bucket_id, name) values ('recuerdos', current_setting('prueba.pareja') || '/foto1.jpg');
select pg_temp.ver(count(*) = 1, 'A sube una foto a la carpeta de su casa') from storage.objects where bucket_id = 'recuerdos';
select pg_temp.como('00000000-0000-0000-0000-00000000000c');
select pg_temp.ver(count(*) = 0, 'C no ve las fotos ajenas') from storage.objects where bucket_id = 'recuerdos';
do $$ begin
  insert into storage.objects (bucket_id, name) values ('recuerdos', current_setting('prueba.pareja') || '/intruso.jpg');
  raise notice 'FALLA C pudo subir una foto a la casa ajena';
exception when others then raise notice 'OK    C no puede subir fotos a la casa ajena';
end $$;
do $$ begin
  insert into storage.objects (bucket_id, name) values ('recuerdos', 'carpeta-rara/foto.jpg');
  raise notice 'FALLA se aceptó una foto fuera de una carpeta de casa';
exception when others then raise notice 'OK    no se aceptan fotos fuera de la carpeta de una casa';
end $$;

-- Cambiarse de personaje por error: B (Ella) toca «Soy Él» con el código
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
do $$ begin
  perform unirse_pareja(current_setting('prueba.codigo'), 'el');
  raise notice 'FALLA B sacó a A de su personaje sin confirmar';
exception when others then raise notice 'OK    no se puede tomar el personaje ocupado sin confirmar (%)', sqlerrm;
end $$;
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select pg_temp.ver(count(*) = 1, 'A sigue siendo Él') from miembros
where pareja_id = current_setting('prueba.pareja')::uuid and rol = 'el' and usuario = '00000000-0000-0000-0000-00000000000a';

-- Celular nuevo de A (otra sesión): con confirmación recupera su personaje
select pg_temp.como('00000000-0000-0000-0000-0000000000a2');
select pg_temp.ver(unirse_pareja(current_setting('prueba.codigo'), 'el', true) = current_setting('prueba.pareja')::uuid,
  'el celular nuevo de A recupera a Él confirmando');
select pg_temp.ver(count(*) = 1, 'el celular nuevo ve la casa') from parejas where id = current_setting('prueba.pareja')::uuid;
-- Volver a entrar con la misma sesión no pide confirmar
select pg_temp.ver(unirse_pareja(current_setting('prueba.codigo'), 'el') = current_setting('prueba.pareja')::uuid,
  'la misma sesión vuelve a entrar sin confirmar');
