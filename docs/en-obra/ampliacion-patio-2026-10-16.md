# Ampliación de juegos y patio · 16 de octubre de 2026

## Encargo

Javier pidió más mapas de El Escudo, más casos de Desaparecidos y un catálogo de juegos mentales para el patio.
Eligió los dieciséis, añadió reto distinto por día y clasificación compartida, y encargó un juego de defensa por
carriles con plantas y zombis propios del estilo de peluche. Pidió que la habilitación del servidor la haga el agente.
La granja continúa pausada y no se generan voces nuevas. No cambian balance ni recompensas de juegos existentes.

## Contenido

- **El Escudo:** de seis a doce mapas de campaña; infinito y batalla P23 conservados. Seis recorridos propios,
  ambientes y utilería distintos, con presupuestos de oleadas existentes. Una huella SHA-256 comprueba que los
  seis niveles originales, torres, enemigos, habilidades e infinito permanecen idénticos.
- **Desaparecidos:** de ocho a doce casos. Los nuevos son La campana de las seis, La caja sin destinatario,
  La página que faltaba y La ruta del hilo violeta. Cada uno añade más de 690 mensajes, nueve chats y tres años
  anteriores. Doce retratos/documentos/fotografías nuevos; siete notas de voz cotidianas reutilizadas por teléfono,
  con texto idéntico. Los doce teléfonos suman 8.907 mensajes. Sin pistas automáticas ni ayudas de candados.
- **Un ratito en el patio:** dieciséis juegos con mecánicas propias, práctica libre, pausa, reanudación, errores y
  puntuación. Rotación diaria de los dieciséis a medianoche de Colombia; el mismo juego y semilla para todos.
  Seudónimo elegido al publicar, mejores marcas y desempate por tiempo. No se presentan como prevención de enfermedades.
- **Jardín de los Desvelados:** doce patios, ocho plantas y cinco zombis originales, siembra por carriles, luz,
  recargas, proyectiles, ralentización, áreas, barreras, reparación, faroles de un uso y campaña guardada.
- **Integración:** dos botones nuevos en el patio y dos tarjetas de amigos. Páginas en ambas compilaciones;
  regreso al patio conserva el rol y modo local. Las marcas y la identidad mental separan los perfiles del aparato.

## Verificación obtenida

- El Escudo: doce victorias de campaña desde cero, derrota natural e infinito hasta derrota; guardados y recibo
  P23 conservados. Las pruebas existentes siguen pasando; las de navegador incorporan los seis mapas nuevos.
- Desaparecidos: historial y archivos revisados en los doce teléfonos. Recorrido de los doce casos en amigos,
  36 estrellas, cero pistas automáticas, apuntes y candados tras recarga y primer guardado fallido recuperado.
- Juegos mentales: los dieciséis se completan con tres semillas, reanudación y final estable; acciones ilegales,
  medianoche de Colombia y rotación de dieciséis días. También pasan los dieciséis por controles de navegador.
  Dos contextos reciben el mismo reto y aparecen en la misma clasificación mediante PostgreSQL temporal.
  Un recorrido adicional recupera un guardado fallido del reto y conserva el seudónimo escrito al reintentar.
- Jardín: 36 victorias (doce patios × tres semillas), derrota sin defensa, costes, límites, recargas, pala y luz
  recogida una sola vez. En navegador, doce patios completados; siembra y recogida por toque sin piloto, pausa,
  recargas de página y guardado fallido recuperado.
- Accesos desde el patio y las tarjetas de amigos comprobados en ambas compilaciones. El retorno a casa
  conserva rol, modo local, monedas e inventario. La regresión integrada existente de granja pasa sus seis checks.
- Ambas compilaciones pasan; el filtro de amigos revisa 589 archivos sin contenido de pareja. Motores completos
  y 48 suites de regresión de granja sin fallos. La granja no recibe cambios de código ni arte.
- Figuras: trece raíces, una malla por personaje y un material de color por vértices; GLB cuantizado de unos 2,2 MB.

## Clasificación del servidor

[patio-clasificacion.sql](../../supabase/patio-clasificacion.sql) y
[pruebas de permisos](../../supabase/pruebas/probar_patio.sql) pasan en PostgreSQL 17 temporal, sin puertos ni red.
Se comprueban dos perfiles, mejora de marca, desempate, rechazo de token ajeno, fecha/juego/rangos y bloqueo de
lectura de hashes o escrituras directas. No se modifican tablas antiguas de la casa.

La consulta de solo lectura al Supabase real devuelve `404 / PGRST202`: faltan las funciones. El entorno solo tiene
la clave publicable. Javier pidió al agente hacerlo; se encontró y ofreció el plugin Supabase para disponer de
acceso administrativo mediante su cuenta. **Esperando esa conexión; no se ha desplegado la clasificación real.**
No pedirle que ejecute SQL ni que pegue claves privadas.

## Presentación y límites

El Jardín encuadra los tres, cuatro y cinco carriles con banco lateral en horizontal; los modelos optimizados
se comprobaron por captura. Se corrigieron la ráfaga de dos semillas y la reparación de plantas consumidas;
sus escenarios unitarios conservan el daño total y comprueban área, ralentización y curación sin resurrección.
La salida libera las figuras y sus recursos WebGL.

Los logs y capturas están en `juego/web/test-results/patio-2026-10-16/`. Las simulaciones, relojes acelerados y
dibujo por captura no certifican dispositivos físicos ni razonamiento humano de los expedientes. La única
dependencia externa pendiente es conectar la cuenta de Supabase para aplicar la clasificación real.
