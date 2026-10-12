# Progresión ordinaria y entrega del motor

Bloque 7, 12 de octubre de 2026. Se incorporan los mapas, salidas anchas, retratos, obras e interiores
de Claude y sus avances de La Feria de las cremas. El motor sigue en granja-v3, con V5, IDs anteriores,
economía, genomas, puertas, calendarios y cuidados reales. No se producen gráficos o voces de pago.

## Progresión de la campaña

P05 también autoriza el sendero al bosque antiguo. El permiso anterior por linajes conserva su función;
no se añaden sus desbloqueos a la partida ni se dan por hechas las misiones de crianza. Así la
investigación principal puede continuar sin terminar primero diez linajes ajenos a su objetivo.

Cuatro planos civiles se aprenden únicamente al completar sus contratos reales. Se fabrican en el
banco, pagando materiales y esperando un minuto por unidad; se retiran de su salida y se emplazan
en terreno propio. Son enlaces con asentamientos: las expediciones avanzadas conservan sus portales,
nave, recetas, materiales y requisitos de herramienta. No sustituyen el combate ni conceden rangos.

| Plano | Contrato | Materiales | Huella |
|---|---|---|---|
| Paso acordado de Verdía | F04 | 12 madera, 8 fibra, 2 minerales de Piedralumbre | 2 × 1 |
| Paso acordado de Senda | P13 | 12 madera, 8 piedra, 8 fibra | 2 × 1 |
| Visita al perímetro de Nox | P15 | 12 madera, 12 piedra, 8 fibra | 2 × 1 |
| Nave de enlace con Celia | P16 | 20 madera, 12 fibra, 4 minerales y 6 maderas de Piedralumbre | 3 × 3 |

Sus IDs son nuevos: `paso_verdia`, `paso_senda`, `paso_nox`, `nave_ensayo`. Ningún dispositivo original
se reemplaza. Valor de venta cero, sin compra gratuita. Reciclaje proporcional a sus propios materiales.
El plan de nave abre el enlace con la estación; el ensayo orbital P17 sigue consumiendo una batería y
combustible reales antes de abrir los siguientes asentamientos. Las expediciones con oxígeno siguen
exigiendo la nave avanzada.

Rita mantiene su identidad y domicilio y atiende logística en su puesto durante su agenda pública.
Vende dos baterías y dos combustibles por semana, a sus precios ordinarios: **270 y 480 monedas**.
Conocerla, acercarse, esperar su turno, disponer de monedas y espacio son requisitos independientes.
El stock renueva por semanas dormidas; no por entrar, consultar o recargar. Sus voces y firma de texto
se conservan. Pan, piezas y suministros también pueden producirse con las cadenas anteriores.

El regreso comprueba la colisión real. Los portales conservan su llegada anterior cuando está libre.
Las naves desembarcan fuera de su huella de 3 × 3; antes la llegada podía quedar dentro. Si un lado
está ocupado se busca otro; si no hay salida transitable la operación se rechaza sin cambiar estado.
El menú permite colocar los dispositivos registrados y, al tocar un enlace civil, consultar sus rutas.

## Recorrido reproducible

`recorrer-campana-ordinaria.mjs` crea una partida nueva y ejecuta acciones públicas. No asigna monedas,
inventario, desbloqueos, contratos completados, HP o posiciones de NPC. Encuentra caminos transitables
y registra sus pasos con la API de movimiento, avanzando el reloj normal. Compra, pesca, tala en
terreno autorizado con herramienta suficiente, cultiva, riega, duerme, fabrica, recoge salidas, visita
puertas y consulta residentes en sus horarios. Cierres por festivales, descanso y cartas se respetan.

El recorrido base cerró **36 contratos, 1.491 acciones, 26 jornadas y 18.836 metros**, con saldo positivo
en todos los cierres y **68 monedas finales**. Conservó las dos gallinas iniciales, sus genomas, el
guardado y las viviendas. Se eligió la vía técnica de los desafíos y copia in situ en P19. Las otras
ramas y el combate cuentan con sus pruebas específicas; esta ruta no certifica todos los estilos
humanos, la dificultad percibida o una partida completa de Sangre y Ceniza.

Los hitos de Sangre se suministran como perfil externo de integración con la forma V1 real; el motor
solo los lee. No se escribe una partida de ese juego, ni se atribuye al recorrido haber jugado sus
puertas. Las acciones de granja e historia sí utilizan recursos propios y contratos reales.

`probar-balance.mjs` repite la ruta desde cero, verifica la reapertura de V5, permisos, costes, huellas,
desembarcos, stock de Rita y separación de destinos avanzados. Además prueba **42 combinaciones** de
las siete familias básicas frente a los seis mecanismos, con daños ordinarios y presupuestos de
100 energía/64 flechas. Esto mide impactos y costes, no evasión humana, FPS o batería de teléfonos.

```sh
cd juego/web
CAMPANA_MAX=36 CAMPANA_RESULTADO=/tmp/recorrido.json \
  node scripts/granja-v3/recorrer-campana-ordinaria.mjs
node scripts/granja-v3/probar-balance.mjs
node scripts/granja-v3/compilar-balance.mjs
```

## Alcance de la entrega

Los siete bloques de software de campaña, historias, premios, vida social, regiones y comunidad
están conectados. Claude puede sustituir kits y añadir presentación mediante el contrato de producción;
las cuatro piezas civiles reutilizan modelos existentes. Las voces mantienen sus IDs y subtítulos.

La matriz histórica de `PLAN-MOTOR-COMPLETO.md` pertenece a otra línea base: no es una certificación
de paridad total con Stardew, Expanded, Automate, Sun Haven o Terraria. Las ampliaciones de contenido,
animaciones cinematográficas, mediciones de rendimiento y pruebas de dispositivos físicos siguen
separadas de esta entrega. No hay teléfonos conectados en el entorno: ninguna prueba de navegador
o instalador se presenta como medición de memoria, batería o tiempos en Android real.
