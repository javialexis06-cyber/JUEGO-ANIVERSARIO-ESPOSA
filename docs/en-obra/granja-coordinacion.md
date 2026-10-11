# Coordinación de la granja con el proyecto principal

## Mensaje para Claude · 10 de octubre de 2026

Javier pidió integrar en este repositorio todo el trabajo de la granja y subir cada avance comprobado. Estamos desarrollando su motor y jugabilidad sobre el mismo juego de Three.js, con sistemas de agricultura, ganadería, genética, fabricación, automatización, pueblos y aventura inspirados en la amplitud de Stardew Valley, Expanded y Automate, más la mitología de Astra. El motor completo todavía está en desarrollo.

El reparto solicitado para el frente de la granja es:

- **Frente de motor:** reglas, controles, inventario/barra, calendario y guardado, economía, producción, genética/cuidados, colisiones y accesos, NPC y misiones, historia y progresión, integración y pruebas. Este frente continúa desde la conversación donde se creó la granja.
- **Claude:** gráficos, diseño y modelos de personajes/NPC, animales y plantas, edificios, paisajes, decoración, texturas, iconos, animaciones y presentación visual. Mantiene también la casa y los demás juegos según la cola de Javier. El diseño final de objetos o funciones especiales de la casa se coordina con él.

Antes de modificar un archivo compartido, revisar el último commit remoto y comunicar el contrato visual o funcional en este documento. No crear otro motor ni sustituir las reglas para renovar los gráficos. Evitar borrar trabajo paralelo: incorporar los cambios recientes antes de publicar, resolver conflictos y repetir las comprobaciones afectadas. Sin push forzado.

## Fuente única y acceso

La fuente de trabajo integrada está en `juego/web/src/granja-v3/`; la página sigue siendo `granja-v3.html`. Se agrega al build de la pareja y al cuarto de juegos de la casa como «Nuestra granjita». No se agrega a la app de amigos en esta etapa. La entrada de la casa real conserva su sesión/economía y ofrece retorno a la posición guardada de la granja.

`src/granja-v2/biblioteca.ts` es únicamente el cargador de recursos visuales reutilizado. `public/modelos/granja-v2/` y `granja-v3/` son catálogos de arte, no motores ni partidas adicionales. Los generadores correspondientes están en `scripts/granja-v2/` y `scripts/granja-v3/`. No se integran las demos o motores antiguos, ZIP de entregas, builds generados, copias del juego comercial ni partidas de pruebas.

## Contrato para renovar el arte

Conservar IDs de objetos, cultivos, animales, NPC, edificios, regiones y animaciones. Guardado V5, claves actuales y migraciones continúan vigentes. Cambiar un ID requiere una migración real que conserve el progreso. Los modelos deben respetar escala, origen, pivotes, huellas y puertas; la vista recibe los resultados del motor y los anima, sin conceder monedas/objetos ni modificar genomas por su cuenta.

`vista.ts`, `avatar.ts`, `*-render.ts`, `suelo.ts`, `clima-render.ts` y `estilo.css` son zonas de encuentro entre ambos frentes. Los recursos de granja utilizan `manifest.json`, modelos ligeros y detallados, clips y pivotes. Para cambiar ese formato, acordar el contrato primero y conservar un modo de sustitución compatible. Personajes `src/personaje.ts` y el loader `src/recursos.ts` pertenecen al proyecto compartido: esta integración usa sus versiones actuales.

Destinos: S21 FE y S24 Ultra. La granja puede probarse con teclado y mouse y controles móviles. La app principal mantiene su orientación horizontal. Los ensayos de viewport no certifican rendimiento físico; faltan medidas en ambos dispositivos. Mantener reuso de geometría/materiales, carga por zona y límites de partículas, luces y draw calls.

## Estado real e historia

### Contrato del bloque de encargos renovables (motor)

Se conservan los doce IDs originales y sus registros. El diario y el tablón existente integran dos ofertas
diarias, una semanal y un pedido especial semanal, con semilla persistida e ID por edición. Renovar ofertas
solo depende de las jornadas dormidas; no sustituye pedidos aceptados. Los especiales separan actividad y
entrega en etapas validadas y conceden objetos del catálogo existente al cierre. Se reutilizan los paneles
actuales; no se añaden modelos, iconos ni decoración. El guardado general sigue en V5.

### Contrato del bloque de festivales (motor)

Se integran cuatro celebraciones estacionales en la plaza existente del Pueblo del Sol. El motor controla fecha,
invitaciones, acceso cercano, participantes y sus rutas, actividad, consumo de una muestra de cosecha, premio anual,
pausa del calendario, retorno y guardado V5. La interfaz usa paneles sencillos del menú actual. El arte, modelos,
decoración, animación y presentación final siguen a cargo del frente visual; no se crea otro escenario ni motor.

El catálogo integrado contiene 63 cultivos, ocho frutales, doce familias productivas y linajes fantásticos, 101 recetas, 416 objetos, 24 vecinos del primer pueblo, 17 viviendas y 24 dormitorios básicos. Hay calendario de 28 días, herramientas y habilidades, encargos, ocho encuentros sociales, correo, construcción y redes de producción. Consultar los documentos del módulo para reglas, API y límites de cada sistema.

La planificación propone 147 identidades en 19 núcleos: no son 147 NPC jugables ni 19 pueblos terminados. Los mundos de aventura tienen una primera base; faltan variedad regional, campaña, eventos comunitarios y muchas funciones de la auditoría. Los dormitorios comparten distribución. Cuatro festivales básicos del primer pueblo ya conectan calendario, invitaciones, seis participantes por evento, actividad, recompensa anual y guardado. Dos ofertas diarias, una semanal y un especial semanal ya conectan instancias persistidas, reservas, etapas y premios reales, conservando los doce pedidos permanentes. Siguiente bloque: cartas ramificadas y decisiones con consecuencias persistentes.

El lore recibido está en `docs/mitologia.md`. La planificación específica está en `PLAN-PUEBLOS-MUNDOS.md`, `REPARTO-COMPLETO.md` y `REPARTO-MUNDOS.json`, dentro del módulo. Distinguir canon de nombres/episodios propuestos. Nox no es un refugio de almas inocentes ni un ciclo de reencarnación; no rehacer el canon por una necesidad de arte. La casa, la granja y Sangre y Ceniza se coordinan; los minijuegos casuales permanecen independientes. No declarar equivalencia completa con Stardew/Expanded/Automate.

Días, estaciones, crecimiento de cultivos, edad de crías y avances de obra solo progresan al dormir. Cuidado real, deterioro de cultivos inmaduros y ciertas producciones conservan sus reglas separadas. Los cultivos maduros permanecen para decoración. No alterar estas decisiones al renovar la presentación.

## Publicación y comprobación de cada avance

Trabajar sobre el último estado de `claude/supermarket-mania-minigame-xn2it8`, integrar cambios, probar, documentar, hacer commit y push a esa rama al cerrar cada avance. Si llega otro commit remoto durante el trabajo, incorporarlo antes de publicar y probar de nuevo. Esta es la instrucción de Javier para este frente; no hace falta preparar ZIP por cada bloque.

Desde `juego/web`:

```sh
npm ci
npm run probar:granja
npm run build
npm run build:amigos
```

El runner ejecuta las suites de `scripts/granja-v3/probar-*.mjs` una por una y falla ante errores. Las pruebas visuales/de integración usan un contexto de navegador aislado, nunca una partida del jugador. Verificar casa → granja → casa → granja, controles, guardado y recursos desde el build. El workflow existente «APK Android» compila las versiones de pareja y amigos e instaladores al subir; confirmar sus resultados para el commit publicado.

Plan de aceptación completo: [`../../juego/web/src/granja-v3/PLAN-MOTOR-COMPLETO.md`](../../juego/web/src/granja-v3/PLAN-MOTOR-COMPLETO.md). Documentación funcional resumida: [`../sistemas/granja.md`](../sistemas/granja.md).

## Interfaz nueva (Claude, 10 de octubre de 2026)

Javier pidió quitar las pestañas y textos de prueba y dejar una interfaz clara, con el estilo de los demás juegos.
Contrato para el frente de motor:

- `hud.ts` + `hud.css` son la cara del juego: reloj, monedas, energía y salud, minimapa con la zona real (lo que se
  construye, cultivos, recursos, salidas y vecinos), mapa grande (tecla M o tocar el minimapa) con buscador de
  vecinos, menú de pestañas y palanca táctil. Solo leen el estado; no cambian reglas.
- Los paneles de siempre (`mostrarPanel`) se abren en una ventana grande con pestañas (`.menu-pestana[data-panel]`).
  Para que un panel nuevo salga en el menú, agrega su pestaña en la plantilla de `main.ts`; los paneles que no son
  pestaña (correo, conversación, envíos…) salen en la misma ventana, sin pestañas.
- Los ids viejos siguen en el DOM dentro de `.hud-oculto` (`calendar`, `coins`, `character`, `quality`,
  `place-name`, `health`, `energy`, `quest-mini`…), así `actualizarUI` no cambia. No muestres texto nuevo fijo en
  pantalla: lo que el jugador necesita va en el panel que corresponde o en un aviso (`toast`).
- `ControlesGranja.eje` es la palanca analógica (x derecha, y arriba de la pantalla).
- Cambiar de casilla a mitad de un golpe ya no se pierde (`esperarLibre`), y tocar una casilla lejos hace caminar al
  personaje hasta al lado antes de trabajar (`vista.acercarse`), como Stardew en el celular.

## Escombros de la granja (Claude, 10 de octubre de 2026)

- Arte: `scripts/granja-v2/escombros.mjs` hace `maleza_hierba`, `maleza_flores`, `maleza_matorral`, `tocon`,
  `tocon_grande`, `piedra_chica`, `piedra`, `piedra_grande` y `mena_cobre/hierro/cristal` (fieltro por vértice, una
  malla por modelo). `SOLO='^(maleza_|tocon)' node scripts/granja-v2/exportar.mjs` exporta solo esos sin tocar el
  resto. `modeloEscombro` en `vista.ts` escoge el modelo por el id del recurso (siempre el mismo); no cambia tipos.
- Reglas que pidió Javier (en `motor.ts`): la maleza sale con cualquier herramienta (azada, guadaña, hacha, pico o
  espada), como en Stardew; cada noche brotan 3-6 malezas o piedras en terreno propio (`brotarMaleza`, tope de 40
  por terreno comprado); una partida nueva empieza enmontada (`monte_*`). El patio de enfrente de la cabaña
  (x -5..9, z -4..9) siempre queda limpio: ahí se empieza a sembrar y ahí trabajan las pruebas.

## Herramientas por calidad (Claude, 10 de octubre de 2026)

- `src/granja-v3/herramientas3d.ts` modela azada, regadera, hacha, pico, guadaña, caña y espada en las cinco
  calidades (`NIVELES_HERRAMIENTA`): la figura de la mano (`AvatarGranja.equipar`) y los íconos
  (`public/modelos/granja-v3/iconos/herr_<tipo>_<nivel>.webp`, que se rehacen con
  `node scripts/granja-v3/iconos-herramientas.mjs` con Vite andando en el 5300). La barra y la mochila escogen el
  ícono según `nivelesHerramienta`.
- Arreglo: la herramienta nunca salía en la mano (se buscaba el hueso `mano.R`, pero al cargar se llama `manoR`), y
  quedaba metida en los pies.

## Íconos de objetos (Claude, 10 de octubre de 2026)

`src/granja-v3/iconos3d.ts` es el estudio de fotos de los objetos (cosechas por forma y color del cultivo, frutas,
semillas en su sobre, plantones, minerales, lingotes, recursos, productos de animales, peces, comidas y armaduras).
`node scripts/granja-v3/iconos-objetos.mjs [url] [regex]` los fotografía a `public/modelos/granja-v3/iconos/obj_<id>.webp`
y reescribe `src/granja-v3/iconos-lista.ts`. Un objeto nuevo sin foto sigue usando su dibujo SVG: cuando agregues
objetos, avísame (o corre el script) para fotografiarlos. Construcciones y máquinas siguen con SVG por ahora.

## Vecinos de peluche (Claude, 10 de octubre de 2026)

`src/granja-v3/vecinos3d.ts`: los 24 vecinos son el muñeco de Javier o de Laura vestido con el clóset de los amigos
(`salas/vestir.ts`) según su oficio (`DISENOS`, por id de `NPCS_PUEBLO`). `pueblo.ts` llama `vecinoPeluche(id, índice)`
y `animarVecino` (caminar/quieto); los que están dentro de una casa se animan solos. No se destruyen al soltar el
pueblo (comparten modelos con los protagonistas: `sacarVecinos` y `liberar` los sacan antes). Un vecino nuevo en
`NPCS_PUEBLO` sin diseño toma uno prestado: avísame para darle el suyo.

### Pueblo del Sol: calles empedradas, plaza del sol y fuente viva (Claude)

- `src/granja-v3/pueblo-adornos.ts` pinta en lienzo el empedrado de piedras de río (color + relieve, coordenadas del
  mundo para que los cruces casen) y lo pone a la altura `.1155` que ya usa `alturaSueloPueblo`; bordillo de piedras
  boleadas solo donde la calle toca el pasto. Los rectángulos de `CAMINOS_PUEBLO` con ancho o fondo negativo se
  normalizan al dibujar (antes salían como franjas lisas).
- La plaza lleva un piso propio con anillos en abanico, un sol de piedra rojiza y lajas de borde; la fuente usa
  `mallaAgua` en sus dos tazas, cortinas de agua que caen y gotitas (`animarFuente` desde `updatePueblo`).
- Prados del pueblo con matas y flores (`cespedPueblo` decide dónde). Los senderos entre zonas son tierra
  apisonada con textura (`Suelos.sendero`) y el que cruzaba el pueblo ahora llega hasta la calle del sur.
- No cambia ninguna regla ni dato del motor.

### Zonas: cueva de la mina, monte espeso, orilla del lago y senderos (Claude)

- `src/granja-v3/zonas-render.ts` (solo decorado, no cambia por dónde se camina):
  - `cuevaMina(nivel)`: oscuridad alrededor, piso de roca con grietas y charquitos, paredes de roca con vetas (altas
    atrás, bajitas del lado de la cámara), estalagmitas, entibados con farol, luz cálida, rieles con vagoneta y
    racimos de cristal que brillan; el color del cristal cambia con `nivelMina` (vista cambia la cueva al bajar).
  - `monteZona(zona, senderos, obstaculos)`: robles y pinos instanciados afuera de los límites de bosque, bosque
    ancestral y lago (abiertos en senderos y salidas, más ralos del lado de la cámara); adentro helechos, matas,
    hongos (que brillan en el ancestral) y troncos caídos, lejos de lo que se recoge.
  - Lago: playita de arena, juncos, piedras de orilla y hojas de lirio.
  - `senderoTierra`: tierra apisonada con huellas de carreta y bordes que se pierden en el pasto.
- Las lomas de fondo ya no tapan la zona donde está el jugador. El minimapa de la mina es oscuro.

### Bosques espesos (Claude, pedido de Javier)

- `nodosExteriores()` agrega árboles talables en rejilla desordenada (unos 215 en el Bosque de los Susurros y 180 en
  el ancestral), dejando libres senderos, salidas, llegadas y el sitio del guardián. Los 12 + 8 árboles originales
  conservan id y lugar. `migrarEstado` (rama v5) añade a las partidas guardadas los árboles que no tengan, sin tocar
  los existentes; el límite de obstáculos del validador pasó de 1000 a 2000.
- Vista: los árboles a más de 8 m del jugador se dibujan con instancias livianas (`arbolesLejanos`); los cercanos
  siguen siendo el modelo completo que se sacude y cae.

### Minas de Celia al estilo Stardew (Claude, pedido de Javier)

Cambio de reglas pedido por Javier (frente de motor, avisado aquí):
- `aventura.ts`: `mina_celia` ya no tiene fondo (`niveles:100000`). Cada piso se genera al entrar o bajar con una semilla
  nueva (`visitasMina`) y solo se guarda el piso actual. Tipos por profundidad (`temaMina`): tierra 1-39, hielo
  40-79, lava 80-99, fondo 100 y caverna 101+, con variantes `hongos`/`cristal` y cofre en 10, 20 … 100
  (`cofresMina`, una sola vez). Minerales por tipo (`mineralesPorProfundidad`), más vetas, más mineral por veta, rocas
  más duras, monstruos por tipo y más fuertes al bajar; minas más grandes (hasta 4 regiones) y con cavernas redondas
  y pilares.
- La escalera se esconde: aparece al romper una veta (seguro con la última) o, a veces, al vencer un monstruo.
- Ascensor (`ascensor`): parada automática cada 5 pisos hasta el 100. Pasando el 100 se construye una estación
  cada 25 pisos (`construir_ascensor`, `costoEstacion`). `entrar_aventura` acepta `piso`.
- Motor: la mina del valle es solo la entrada (sin rocas ni monstruo); `descender` queda rechazado; la migración
  retira las rocas viejas de esa zona y deja lo que estaba en el suelo recogible. Cofres dan monedas y una pieza de
  equipo (`PREMIOS_COFRE`); `mineral` cuenta lo extraído en las expediciones (misión del dragón).
- Vista: `mina-render.ts` (piso, paredes, decorado, escaleras, cofre) y el minimapa dibuja el plano del piso.
- Gráficos de los pisos (estrategia de Stardew): la roca es una masa sólida con techo oscuro; detrás del piso se ve
  la cara del acantilado (hileras de piedras, grietas, vetas que brillan) y del lado de la cámara la roca baja a una
  repisa de 30 cm que no tapa al jugador (`terrenoMina`). Rocas sueltas al pie y sobre el canto, sombra de contacto
  en el piso, farol que lleva el personaje y luz ambiente del color del piso (`escena.userData.ambienteExpedicion`).
  Cámara: 1.9 de zoom en los pisos y 1.6 en la entrada.

### Minerales nuevos, bronce y mitrilo, máquinas de vapor y aspersor básico (Claude, pedido de Javier)

- Minas: estaño (desde el piso 5), geoda (8), amatista (10); en hielo topacio, aguamarina y geoda helada; en lava
  esmeralda y geoda de magma; en la caverna diamante (120), mitrilo (150) y geoda omni.
- `objetos.ts`: lingotes de bronce (horno: cobre + estaño) y mitrilo (fundidora); espadas y armaduras de bronce y
  mitrilo en la forja. Máquinas industriales (`EstacionProduccion`): alto horno (tandas grandes), trituradora (geodas
  → gemas, piedra → arena), taladro de vapor (carbón → mineral en la granja) y ensambladora (engranajes, baterías y
  circuitos en serie). Funcionan solas con la red de cofres que ya existía.
- `aspersor_basico` (cruz de 4 casillas, `aspersor.cruz`), como el de Stardew; `riegaAspersor` en motor.ts.
- Modelos de las máquinas en `escenas-produccion.ts` (con su animación) e íconos nuevos.

### Refugios con detalle de granja (Claude)

- `arte.ts`: techos de color vivo por especie (gallinero rojo, establo vino, pato verde agua…), cimiento de piedras,
  veleta (gallito en gallineros y patos), farol, pacas de heno y costal; gallineros con nidales de paja y rampa con
  puertica (`detallesRefugio`). `patioRefugio` llena el corral con caminito de tierra, paja, bebedero, comedero y maíz.

### Caminos de la granja y salidas en los bordes (Claude, pedido de Javier)

Cambio de reglas (frente de motor, avisado aquí):
- `caminos-mundo.ts`: `CAMINOS_GRANJA` (camino real este-oeste en z 12-13, ramal norte en x -13/-12, ramal sur en
  x 6/7 y caminito de la cabaña). `esSenderoGranja` cubre esos caminos: nada se construye, siembra ni brota encima.
- Las salidas de la granja pasaron a los bordes: pueblo (49,12), bosque (-50,12), mina (-13,-40) y lago (6,55), con
  sus llegadas desde las otras zonas. Se llega caminando por los caminos, cruzando terreno sin comprar (ya era
  transitable). En `main.ts` la salida se toma a 1.3 casillas para cubrir todo el ancho del camino.
- Terreno inicial más grande: `SECTORES_INICIALES=[0,1,2,3,4]` (la cabaña y sus vecinas en cruz). La migración se
  los da a las partidas guardadas y retira escombros que hayan quedado sobre los caminos. La misión «Una nueva
  familia» ahora se cumple comprando el sector 5 o cualquier otro.
- Vista: caminos de tierra, arcos de madera con letrero del destino y faroles en cada salida; el minimapa dibuja los
  caminos; el velo de los sectores sin comprar es más suave.

### Diseñar la granja, suelos de Stardew y bordes con adelanto de cada zona (Claude, pedido de Javier)

- Pestaña «Diseñar» (`renderDiseno`, `entrarDiseno` en main.ts): lista todas las construcciones, máquinas, cofres
  y obras encargadas con «Mover»/«Guardar»; «Diseñar en el mapa» aleja la cámara, muestra la rejilla y deja tocar
  cualquier cosa para moverla sin caminar hasta ella (usa las acciones `mover`, `mover_produccion` y `emplazar_obra`).
- Motor: `emplazar_obra` acepta cambiar de lugar una obra ya reservada, conservando su `colocadaDia`.
- 13 suelos nuevos (`catalogo.ts`, `Suelos.sueloPintado` con texturas pintadas): tablones, madera vieja, paja,
  lajas, adoquines, grava, piedras pasaderas, ladrillo, baldosas de barro, mosaico, astillas, cristal y sendero de
  cristal. Los suelos ya no se compran: se fabrican con materiales (madera, piedra, fibra, arcilla, cuarzo, vidrio),
  ×1 o ×10, y al colocarlos se gasta la pieza; al guardarlos vuelve a la mochila.
- Bordes: `monteZona('granja'|'pueblo')` rodea la granja y el pueblo con monte; cada salida sigue en camino más allá
  del arco hasta un adelanto del destino (`adelantoZona`: casitas del pueblo, pinar, montaña con la boca de la mina,
  orilla del lago con muelle).

### Recuperadora (Claude, pedido de Javier)

- `recuperadora.ts`: `materialesDe(articulo)` (receta del objeto, receta de `creacion_*`; sin receta: minerales →
  piedra, lo orgánico → abono; herramientas y recursos básicos no se reciclan) y `porcentajeRecuperacion(nivel,
  calidad)`: 40/60/80 % según nivel (cobre, hierro, astral) × 1/1.1/1.25/1.5 por calidad, tope 95 %.
- Es una máquina (`estacion:'recuperadora'`) de la red automática: con `recuperar_maquina` se elige qué objeto
  tomar de los cofres conectados; recicla una unidad cada 20/12/6 s, deja los materiales en su salida y los
  deposita en los cofres; las fracciones se acumulan en `resto` (nada se pierde). Validación en `errorProduccion`.
- A mano: acción de motor `recuperar` (junto a la máquina, desde una casilla de la mochila); redondea al azar.
- Panel propio en Fabricar › Taller, modelo animado y tres íconos.
- Interiores (Claude): `amoblarCabana` (cama doble, cocina, mesa, chimenea encendida, biblioteca, plantas y cuadros,
  todo contra las paredes) y `adornosRefugio` (paja, farol que alumbra, ventanas, costales, escoba, aseladero).
  Cámara a 2 de zoom en interiores y fondo oscuro cálido en lugar del verde del exterior.
