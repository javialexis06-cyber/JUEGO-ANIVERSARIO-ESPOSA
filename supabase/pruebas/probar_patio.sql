-- Base temporal con los roles anon/authenticated y patio-clasificacion.sql ya aplicado.
begin;
set local role anon;
do $$
declare
 hoy date := (now() at time zone 'America/Bogota')::date;
 juego text;
 cantidad integer;
 primero text;
begin
 juego := (array['parejas','simon','cuadricula','diferencias','buscar','stroop','calculo','sudoku','sopa','anagramas','deslizante','tangram','hanoi','laberinto','compras','nback'])[1+(((hoy-date '1970-01-01')%16+16)%16)];
 perform public.patio_publicar('00000000-0000-4000-8000-000000000001',repeat('a',64),'Sol',hoy,juego,8500,42000);
 perform public.patio_publicar('00000000-0000-4000-8000-000000000002',repeat('b',64),'Luna',hoy,juego,9500,51000);
 select count(*) into cantidad from public.patio_tabla(hoy);
 if cantidad <> 2 then raise exception 'Deben aparecer ambos jugadores'; end if;
 select nombre into primero from public.patio_tabla(hoy) limit 1;
 if primero <> 'Luna' then raise exception 'La puntuación mayor va primero'; end if;
 perform public.patio_publicar('00000000-0000-4000-8000-000000000001',repeat('a',64),'Sol',hoy,juego,2000,2000);
 if not exists(select 1 from public.patio_tabla(hoy) where nombre='Sol' and puntos=8500) then raise exception 'No degradar una marca mejor'; end if;
 perform public.patio_publicar('00000000-0000-4000-8000-000000000001',repeat('a',64),'Sol',hoy,juego,9500,41000);
 select nombre into primero from public.patio_tabla(hoy) limit 1;
 if primero <> 'Sol' then raise exception 'El menor tiempo desempata'; end if;
 begin
  perform public.patio_publicar('00000000-0000-4000-8000-000000000001',repeat('c',64),'Falso',hoy,juego,10000,1000);
  raise exception 'FALLO: token ajeno aceptado';
 exception when raise_exception then if sqlerrm like 'FALLO:%' then raise; end if; end;
 begin
  perform public.patio_publicar('00000000-0000-4000-8000-000000000001',repeat('a',64),'Sol',hoy-1,juego,10000,1000);
  raise exception 'FALLO: día anterior aceptado';
 exception when raise_exception then if sqlerrm like 'FALLO:%' then raise; end if; end;
 begin
  perform public.patio_publicar('00000000-0000-4000-8000-000000000001',repeat('a',64),'Sol',hoy,'inventado',10000,1000);
  raise exception 'FALLO: juego incorrecto aceptado';
 exception when raise_exception then if sqlerrm like 'FALLO:%' then raise; end if; end;
 begin
  perform public.patio_publicar('00000000-0000-4000-8000-000000000001',repeat('a',64),'Sol',hoy,juego,10001,1000);
  raise exception 'FALLO: puntuación fuera de rango aceptada';
 exception when raise_exception then if sqlerrm like 'FALLO:%' then raise; end if; end;
 begin
  perform * from public.patio_perfiles;
  raise exception 'FALLO: hashes de perfiles expuestos';
 exception when insufficient_privilege then null;end;
 begin
  update public.patio_marcas set puntos=10000;
  raise exception 'FALLO: escritura directa permitida';
 exception when insufficient_privilege then null;end;
 raise notice 'OK dos jugadores, mejores marcas, desempate, tokens privados, día, juego y rangos';
end;
$$;
rollback;
