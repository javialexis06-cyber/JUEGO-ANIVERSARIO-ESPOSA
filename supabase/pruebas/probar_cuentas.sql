-- Pruebas de las cuentas con contraseña (sección 9 de cambios-pendientes.sql).
-- Uso: psql -d <base> -f imitar_supabase.sql -f ../esquema.sql -f ../cambios-pendientes.sql -f probar_cuentas.sql
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
-- Corre algo que debe fallar y dice si falló con el mensaje esperado
create or replace function pg_temp.falla(sql text, espera text, texto text) returns text language plpgsql as $$
begin
  execute sql;
  return 'FALLA ' || texto || ' (no falló)';
exception when others then
  return case when sqlerrm ilike '%' || espera || '%' then 'OK    ' || texto else 'FALLA ' || texto || ' (' || sqlerrm || ')' end;
end $$;

-- Celulares: J1 (Javier, celular), L1 (Laura, celular), J2 (computador de Javier), X (un intruso)
\set J1 '00000000-0000-0000-0000-00000000000a'
\set L1 '00000000-0000-0000-0000-00000000000b'
\set J2 '00000000-0000-0000-0000-00000000000c'
\set X  '00000000-0000-0000-0000-00000000000d'

select pg_temp.como(:'J1');
select set_config('prueba.p', pareja::text, false), set_config('prueba.cod', codigo, false) from crear_pareja('el');
select pg_temp.como(:'L1');
select pg_temp.ver(unirse_pareja(current_setting('prueba.cod'), 'ella') = current_setting('prueba.p')::uuid, 'Laura entra con el código');

-- Javier se hace la cuenta
select pg_temp.como(:'J1');
select pg_temp.falla($$select crear_cuenta(current_setting('prueba.p')::uuid, 'el', 'ja', 'secreto1')$$, 'usuario', 'usuario muy corto no');
select pg_temp.falla($$select crear_cuenta(current_setting('prueba.p')::uuid, 'el', 'javier', '123')$$, 'contraseña', 'contraseña muy corta no');
select pg_temp.falla($$select crear_cuenta(current_setting('prueba.p')::uuid, 'ella', 'javier', 'secreto1')$$, 'autorizado', 'Javier no hace la cuenta de Laura');
select crear_cuenta(current_setting('prueba.p')::uuid, 'el', '  Javier ', 'secreto1');
select pg_temp.ver(true, 'Javier se hace la cuenta «javier»');
select pg_temp.falla($$select crear_cuenta(current_setting('prueba.p')::uuid, 'el', 'javier2', 'secreto1')$$, 'ya tiene cuenta', 'no se hace otra cuenta para Javier');
select pg_temp.ver((select count(*) from cuentas_de(current_setting('prueba.p')::uuid)) = 1, 'la casa ve que Javier tiene cuenta');

-- Laura no puede usar el mismo usuario
select pg_temp.como(:'L1');
select pg_temp.falla($$select crear_cuenta(current_setting('prueba.p')::uuid, 'ella', 'javier', 'otra123')$$, 'ya existe', 'el usuario es único');
select crear_cuenta(current_setting('prueba.p')::uuid, 'ella', 'laura', 'flores22');
select pg_temp.ver(true, 'Laura se hace la cuenta «laura»');

-- Nadie ve las contraseñas
select pg_temp.falla($$select * from cuentas$$, 'permission denied', 'la tabla de cuentas no se lee desde la app');
select pg_temp.falla($$select * from aparatos$$, 'permission denied', 'la tabla de aparatos no se lee desde la app');

-- El computador de Javier: con el código ya no se puede tomar a Javier
select pg_temp.como(:'J2');
select pg_temp.falla($$select unirse_pareja(current_setting('prueba.cod'), 'el', true)$$, 'cuenta requerida', 'con el código no se toma a un personaje con cuenta');
select pg_temp.falla($$select volver_a_casa(current_setting('prueba.cod'), 'el')$$, 'cuenta requerida', 'volver a la casa tampoco');
select pg_temp.ver((select count(*) from entrar_cuenta('javier', 'mala-clave')) = 0, 'contraseña equivocada: no entra');
select pg_temp.ver(not es_miembro(current_setting('prueba.p')::uuid), 'y no queda en la casa');
select pg_temp.ver((select papel = 'el' and pareja = current_setting('prueba.p')::uuid and codigo_casa = current_setting('prueba.cod')
  from entrar_cuenta('JAVIER', 'secreto1')), 'con usuario y contraseña entra como Javier (sin importar mayúsculas)');
select pg_temp.ver(es_rol(current_setting('prueba.p')::uuid, 'el'), 'el computador ya es Javier');
select pg_temp.ver(volver_a_casa(current_setting('prueba.cod'), 'el') = current_setting('prueba.p')::uuid, 'y al volver a abrir entra solo');
select pg_temp.ver((select count(*) from parejas where id = current_setting('prueba.p')::uuid) = 1, 'el computador lee la casa');
insert into personajes (pareja_id, rol, estado) values (current_setting('prueba.p')::uuid, 'el', '{"desde":"pc"}')
  on conflict (pareja_id, rol) do update set estado = excluded.estado;
select pg_temp.ver(true, 'el computador guarda el personaje de Javier');
select pg_temp.falla($$insert into personajes (pareja_id, rol, estado) values (current_setting('prueba.p')::uuid, 'ella', '{}')
  on conflict (pareja_id, rol) do update set estado = excluded.estado$$, 'row-level security', 'pero no el de Laura');

-- El celular de Javier sigue entrando a la vez (varios aparatos por persona)
select pg_temp.como(:'J1');
select pg_temp.ver(volver_a_casa(current_setting('prueba.cod'), 'el') = current_setting('prueba.p')::uuid, 'el celular de Javier sigue entrando');
select pg_temp.ver(guardar_casa(current_setting('prueba.p')::uuid, '{"monedas":5}', (select version from parejas where id = current_setting('prueba.p')::uuid)) > 0,
  'y guarda la casa');

-- El intruso con el código no se queda con nadie
select pg_temp.como(:'X');
select pg_temp.falla($$select unirse_pareja(current_setting('prueba.cod'), 'ella', true)$$, 'cuenta requerida', 'el intruso no se queda con Laura');
select pg_temp.ver((select count(*) from personajes where pareja_id = current_setting('prueba.p')::uuid) = 0, 'ni ve la casa');

-- Adivinar contraseñas: se bloquea
select pg_temp.ver((select count(*) from (select entrar_cuenta('laura', 'intento' || g) from generate_series(1, 8) g) t) = 0, '8 contraseñas inventadas no entran');
select pg_temp.falla($$select entrar_cuenta('laura', 'flores22')$$, 'demasiados intentos', 'después se bloquea un rato (aunque ahora acierte)');

-- Cambiar la contraseña desde un aparato que ya es Javier
select pg_temp.como(:'J2');
select cambiar_contrasena(current_setting('prueba.p')::uuid, 'el', 'nueva-clave');
select pg_temp.ver(true, 'Javier cambia su contraseña desde el computador');
select pg_temp.falla($$select cambiar_contrasena(current_setting('prueba.p')::uuid, 'ella', 'robada99')$$, 'autorizado', 'no puede cambiar la de Laura');

-- Cerrar sesión en el computador
select salir_de_casa(current_setting('prueba.p')::uuid);
select pg_temp.ver(not es_miembro(current_setting('prueba.p')::uuid), 'al cerrar sesión el computador ya no es de la casa');
select pg_temp.ver((select count(*) from entrar_cuenta('javier', 'secreto1')) = 0, 'la contraseña vieja ya no sirve');
select pg_temp.ver((select count(*) from entrar_cuenta('javier', 'nueva-clave')) = 1, 'la nueva sí');

-- Una casa sin cuentas sigue funcionando como antes
select pg_temp.como(:'X');
select set_config('prueba.p2', pareja::text, false), set_config('prueba.cod2', codigo, false) from crear_pareja('el');
select pg_temp.como(:'J2');
select pg_temp.falla($$select unirse_pareja(current_setting('prueba.cod2'), 'el')$$, 'ocupado', 'sin cuenta: el personaje ocupado pide confirmar');
select pg_temp.ver(unirse_pareja(current_setting('prueba.cod2'), 'el', true) = current_setting('prueba.p2')::uuid, 'y con la confirmación se queda con él (como antes)');
select pg_temp.ver(volver_a_casa('ZZZZZZ', 'el') is null, 'volver con un código que no existe vuelve vacío');
