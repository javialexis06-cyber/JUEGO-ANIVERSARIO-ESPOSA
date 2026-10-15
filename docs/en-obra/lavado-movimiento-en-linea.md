# Movimiento de compañeros en Lavado · 15 de octubre de 2026

Javier observó tirones al jugar Lavado con amigos. El anfitrión dibujaba al invitado directamente en cada posición
recibida, entre 80 y 300 ms; el invitado acercaba el dibujo a la última foto con un filtro que variaba su velocidad
entre mensajes. Los mandos rápidos no tenían secuencia y uno atrasado podía devolver al jugador a una posición vieja.

## Corrección

- `movimiento_remoto.ts` guarda una reserva visual de 160 ms por compañero e interpola usando el reloj del emisor.
  Los relojes de los dos aparatos pueden tener orígenes distintos. Si faltan mensajes, extrapola frenando durante
  un máximo de 120 ms; después permanece quieto. La corrección al recuperar una pérdida breve se disipa con un
  límite de velocidad para evitar saltos al ponerse al día.
- La reserva afecta solo al dibujo remoto. El personaje propio se mueve directamente con su mando. El anfitrión
  conserva las posiciones recibidas para impactos, recogidas y rescates; dibujar no modifica el motor.
- Modelo, sombra, barra, nombre, flecha y auras alrededor del compañero comparten la posición visual. Los
  proyectiles y sucesos del mundo siguen representando lo comunicado por el anfitrión.
- Los mandos llevan secuencia y tiempo; las fotos conservan su formato binario y añaden tiempo en el envoltorio.
  Mandos viejos o repetidos se descartan. Los campos nuevos son opcionales para aceptar aparatos anteriores.
  La frenada participa en la clave del mando, por lo que se comunica al ritmo de movimiento.
- Caída, rescate, salida, recolocación y regreso de un corte no arrastran una trayectoria anterior. La pausa
  usa la posición confirmada. La predicción visual respeta los límites del escenario.

Se mantienen velocidades del personaje, daño, vida, dificultad, recompensas e intervalos de envío. La vista
remota tiene la demora de red más su reserva visual; este cambio no elimina la latencia de la conexión.

## Pruebas puras reproducibles

`scripts/probar-lavado-movimiento.mjs`, incluido en `npm run probar:motores` y sus rutas de CI, ejecuta doce grupos:
anfitrión e invitado, cada uno a 30 y 60 cuadros, con demora fija y red irregular; mensajes inválidos, antiguos y
repetidos y compatibilidad; pérdida total y retorno; estados y lectura actual de vida/inventario; esquinas,
diagonal, vuelta y parada a 30/60/120 cuadros y límites del mapa. Usa `MandosRemotos`, `Espejo` y fotos binarias
reales, con un reloj controlado y una semilla de red fija. Verifica que el dibujo no mueve las posiciones del
combate y que las fotos no retrasan al personaje propio. Un caso de marcha rápida evita confundir una pérdida
breve con una recolocación.

En cuatro segundos de marcha a 180 unidades/s:

| Vista | Cuadros/s | Red | Cuadros sin cambio en posiciones recibidas | Cuadros sin avance visual | Mayor paso visual |
|---|---:|---|---:|---:|---:|
| Anfitrión | 30 | 35 ms fijos | 70/119 | 0/119 | 6 |
| Anfitrión | 30 | Variable, pérdida | 81/119 | 0/119 | 9,818 |
| Anfitrión | 60 | 35 ms fijos | 189/239 | 0/239 | 3 |
| Anfitrión | 60 | Variable, pérdida | 200/239 | 0/239 | 5,25 |
| Invitado | 30 | 35 ms fijos | 79/119 | 0/119 | 6 |
| Invitado | 30 | Variable, pérdida | 86/119 | 0/119 | 10,5 |
| Invitado | 60 | 35 ms fijos | 199/239 | 0/239 | 3 |
| Invitado | 60 | Variable, pérdida | 204/239 | 0/239 | 5,25 |

La red irregular demora entre 35 y 215 ms, permite reordenación y usa probabilidad de pérdida del 12 %.
Se pierden 16 de 101 mandos y 11 de 81 fotos en esas semillas. La columna de posiciones recibidas es una
referencia sin interpolar, no una medición del filtro anterior del invitado. Los números describen estos
recorridos controlados; no garantizan ausencia de tirones con cualquier conexión o carga gráfica.

## Integración y límites

`scripts/probar-lavado-fluidez.mjs` recorre la app compilada de amigos con dos perfiles aislados y sus modelos
3D, teclado real y Supabase simulado. Prepara tutorial visto, vida de prueba y nivel alto para aislar movimiento
y elecciones; el final se solicita con el gancho existente. Comprueba ambas direcciones de comunicación,
posición del modelo frente a la vista, avance entre mensajes, personaje propio directo, frenada, nombres,
corte y reconexión, resumen compartido y regreso a la sala. No equivale a una partida de treinta minutos.

La ejecución final con 8 % de pérdida prevista y demora adicional aleatoria de hasta 180 ms pasó sus siete
comprobaciones sin errores de página. El anfitrión registró avance visual entre mensajes en 44 de 222 cuadros
observados; el invitado, en 37 de 227. No son tasas de FPS: incluyen periodos quietos, capturas y control de
prueba. Se inspeccionaron las capturas de ambos lados con personajes, nombres y barras.

`scripts/probar-lavado-salas.mjs` conserva el recorrido de cuatro jugadores y admite `CHROME_PATH` para usar el
navegador instalado. Cubre elecciones, corte breve y largo, reingreso, caída/rescate y resultado preparado.
Su canal de recarga de Vite se atiende de forma local durante la prueba, sin recargar módulos ni abrir un
WebSocket de desarrollo bloqueado por el navegador. El transporte del juego sigue usando Supabase simulado
con pérdidas y demora; los errores del juego se siguen registrando.

La pasada final de cuatro completó 36 comprobaciones, con 6 % de pérdida prevista y hasta 220 ms de demora
adicional; intercambió 1.216 mensajes, sin fallas registradas. Usa `sin3d`, vida artificial y final solicitado
por el gancho: verifica flujo y sincronización, no apariencia final ni una campaña normal. Las capturas con
vida artificial pueden mostrar proporciones de barra fuera del rango normal entre inventario y foto.

Comandos desde `juego/web`:

```bash
node scripts/probar-lavado-movimiento.mjs
# Servir primero dist-amigos, sin recompilar durante la prueba.
CHROME_PATH=/usr/bin/chromium DIBUJO_POR_CAPTURA=1 node scripts/probar-lavado-fluidez.mjs http://127.0.0.1:4183 test-results/lavado-fluidez
# Servidor Vite de pruebas sin HMR para el recorrido de cuatro.
CHROME_PATH=/usr/bin/chromium PERDER=0.06 DEMORA=220 node scripts/probar-lavado-salas.mjs http://127.0.0.1:5176 test-results/lavado-salas
```

`DIBUJO_POR_CAPTURA=1` mantiene modelos, controles y sincronización activos y dibuja las capturas; evita saturar
la GPU virtual entre capturas. No certifica FPS de dispositivos. Continúan pendientes las mediciones en Android
físico y redes reales; tampoco se ha modificado la sincronización de los demás juegos.

En este cierre pasan `npm run build`, `npm run build:amigos` con filtro de contenido, `npm run probar:motores`,
las 48 suites de `npm run probar:granja` y las seis comprobaciones de `granja-v3/verificar-demo.mjs` sobre el
build completo en un contexto aislado. El recorrido de integración conserva posición, inventario, jornada y
lectura al volver entre casa y granja y al recargar, sin errores de página ni recursos fallidos.
