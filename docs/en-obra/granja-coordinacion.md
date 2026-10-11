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

### Contrato del bloque de colecciones y lotes (motor)

El archivo existente registra seis lotes: cuatro de cultivos por estación, pesca y minerales/oficios.
Cada requisito acepta una pieza concreta o alternativas explícitas del catálogo, cantidad y calidad mínima.
Las entregas por casilla quedan reservadas y se pueden recuperar completas hasta cerrar el lote; el cierre
las convierte en donaciones permanentes y concede un premio único. Los cuatro lotes agrícolas abren una
reserva de sus semillas básicas durante todo el año al precio original; plantar conserva estación y clima.
Un cuaderno distingue reservas de donaciones efectivas y permanece separado del atlas de vista previa.
Se conservan V5, IDs, inventario, economía y recursos visuales. Solo se agregan paneles, botones y texto
al menú y al archivo; no se trabajan modelos, iconos, decoración ni gráficos finales.

### Contrato del bloque de encargos renovables (motor)

Se conservan los doce IDs originales y sus registros. El diario y el tablón existente integran dos ofertas
diarias, una semanal y un pedido especial semanal, con semilla persistida e ID por edición. Renovar ofertas
solo depende de las jornadas dormidas; no sustituye pedidos aceptados. Los especiales separan actividad y
entrega en etapas validadas y conceden objetos del catálogo existente al cierre. Se reutilizan los paneles
actuales; no se añaden modelos, iconos ni decoración. El guardado general sigue en V5.

### Contrato del bloque de correspondencia ramificada (motor)

Dos proyectos originales, de oficios y de salidas al valle, llegan por correo al dormir después de sus hitos.
Cada uno ofrece dos ramas excluyentes: elegir cerca del buzón abre el encargo elegido, respeta el máximo
compartido de cinco activos y persiste una decisión que no cambia al cancelar o vencer. El encargo tiene
dos etapas, entregas por casilla y calidad, devolución íntegra y una receta alternativa del catálogo como
consecuencia única del cierre. Retomar conserva la rama y reinicia su trabajo después de devolver reservas.
Confirmaciones y cierres llegan en noches posteriores; las cartas originales mantienen IDs y adjuntos.
Solo cambia la subversión de correo; el guardado general permanece V5. Se reutilizan los paneles existentes
con botones y texto; no se trabaja en modelos, iconos, decoración ni presentación final.

### Contrato del bloque de festivales (motor)

Se integran cuatro celebraciones estacionales en la plaza existente del Pueblo del Sol. El motor controla fecha,
invitaciones, acceso cercano, participantes y sus rutas, actividad, consumo de una muestra de cosecha, premio anual,
pausa del calendario, retorno y guardado V5. La interfaz usa paneles sencillos del menú actual. El arte, modelos,
decoración, animación y presentación final siguen a cargo del frente visual; no se crea otro escenario ni motor.

El catálogo integrado contiene 63 cultivos, ocho frutales, doce familias productivas y linajes fantásticos, 147 recetas, 458 objetos, 24 vecinos del primer pueblo, 17 viviendas y 24 dormitorios básicos. Hay calendario de 28 días, herramientas y habilidades, encargos, ocho encuentros sociales, correo, construcción y redes de producción. Consultar los documentos del módulo para reglas, API y límites de cada sistema.

La planificación propone 147 identidades en 19 núcleos: no son 147 NPC jugables ni 19 pueblos terminados. Los mundos de aventura tienen una primera base; faltan variedad regional, campaña, eventos comunitarios y muchas funciones de la auditoría. Los dormitorios comparten distribución. Cuatro festivales básicos del primer pueblo ya conectan calendario, invitaciones, seis participantes por evento, actividad, recompensa anual y guardado. Dos ofertas diarias, una semanal y un especial semanal ya conectan instancias persistidas, reservas, etapas y premios reales, conservando los doce pedidos permanentes. Dos propuestas de correspondencia ya conectan cuatro ramas excluyentes, encargos de dos etapas, recetas alternativas, recuperación y decisiones persistidas. Seis lotes del archivo ya conectan entregas por casilla/calidad, reservas recuperables, donación permanente, premios únicos y reserva de semillas todo el año. El atlas sigue como vista previa separada. Siguiente bloque: libros y pistas útiles (K07).

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
- Interiores (Claude): `adornosRefugio` (paja, farol que alumbra, ventanas, costales, escoba, aseladero). La cabaña
  y los cuartos del pueblo pasaron al kit de muebles de Blender (sección siguiente). Cámara a 2 de zoom en interiores y
  fondo oscuro cálido en lugar del verde del exterior.

## Regla: todo de la granja en Blender (Javier, 11 de octubre de 2026)

Javier pidió que **todo, absolutamente todo** lo que se ve en la granja se modele en Blender con la máxima calidad del
estilo del juego (peluche, fieltro, madera, plastilina; formas redondeadas y llenas de detalle). Las figuras sueltas
de three.js (cajas, cilindros) se van reemplazando por modelos de `personajes/blender/granja_*.py`, exportados a
`juego/web/public/modelos/` y cargados con `src/recursos.ts`. El motor no cambia: solo la presentación.

### Interiores con el kit de muebles de Blender (Claude, 11 de octubre de 2026)

- `personajes/blender/granja_muebles.py` modela 54 piezas (mostrador, estantes, ventanas, lámparas, tapete, matas,
  exhibidor de semillas, costales, fragua y yunque, banco de carpintero, vitrinas de frascos, camilla, barriles,
  chimenea, bibliotecas, escritorio, globo, altar y cristales de Aura y Lara, cama, armario, cocina, piso y pared por
  módulos de 1 m, marco y puertas…) y las exporta en un solo `public/modelos/granja_muebles.glb` con un vacío
  `m_<clave>` por pieza.
- `src/granja-v3/cuartos.ts` lo carga una vez y arma: `interiorCabana()` (8 × 8), `interiorLocal(servicio)` (9 × 8,
  los nueve servicios, también `archivo` y los dos altares), `interiorVivienda(colores, tema)` (12 × 10, con extras por
  tema) y `interiorDormitorio(color)` (8 × 8, cobija del color del vecino). `amueblar(g, puestos, tintes)` pone piezas
  `[clave, x, z, giro, escala, altura]`; `mosaico` repite piso y pared con instancias; los tintes se aplican por
  nombre de material (papel de pared, cobija, puerta del cuarto). Geometría y materiales del kit van marcados
  `compartido` y `liberar()` no los destruye.
- Las colisiones siguen siendo las del motor (`libreDormitorio`, `libreVivienda`/`SOLIDOS_VIVIENDA`, el rectángulo de
  los locales): los muebles van contra las paredes o encima de esos sólidos, y lo que queda en el lado abierto (derecha
  y frente, sin pared por la cámara) mira hacia la cámara. Si el motor mueve un sólido, se mueve el mueble aquí.
- Se retiraron `amoblarCabana` y `adornosServicio` (cajas de three.js) de `zonas-render.ts`.

### Decoración de los festivales (Claude, 11 de octubre de 2026)

- `personajes/blender/granja_festivales.py` → `public/modelos/granja_festivales.glb` (1,7 MB, mallas juntadas por
  material en cada pieza): para cada festival (`primavera`, `verano`, `otono`, `invierno`) un poste con cintas y remate
  (flor, sol, hojas con bellota, estrella), un tramo de guirnalda de 2 m (banderines, farolillos, hojas de arce,
  bombillos con estrellas), un arco con el emblema (brote, campana, calabaza, vela), lo principal (puesto de semillas
  con toldo, tarima de la ronda con tambor y campana, mesa de la cosecha, árbol de los recuerdos con marcos y regalos),
  un rincón (carretilla con plántulas, cojines y tambores, espantapájaros sobre pacas, muñeco de nieve) y la corona para
  la repisa de la fuente.
- `src/granja-v3/festejos-render.ts`: `decoracionFestival(dia)` arma la plaza solo cuando `festivalHoy(dia)` da un
  festival (todo ese día); cuatro postes alrededor de la plaza unidos por guirnaldas en catenaria, el arco en la calle
  del oeste (73, 0), lo principal al este (94,6; 2,6), el rincón al suroeste (75,8; 4) y la corona en la fuente.
  `celdasFestejo(dia)` son las celdas que ocupan esas piezas: `vista.libre()` no deja pisarlas (solo movimiento del
  personaje; las reglas del motor no cambian). El punto de inscripción (84, 10), la plaza, las calles y los seis
  puestos de los participantes quedan libres. `animarFestejo` mece las guirnaldas y hace titilar las luces.
- La clave de la vista del pueblo incluye el tema del festival de hoy, para que la plaza se rehaga si cambia el día
  estando allí. Si el motor mueve la plaza, la fuente o los puestos de los participantes, se ajustan las constantes de
  `festejos-render.ts`.

### El Pueblo del Sol en Blender: utilería, edificios y altares (Claude, 11 de octubre de 2026)

- `personajes/blender/granja_pueblo.py` → `public/modelos/granja_pueblo.glb` (0,7 MB): la fuente (pila con repisa,
  columna con anillos, tacita, un sol con cara y cuatro ranitas en el borde; mismas alturas del agua de
  `pueblo-adornos.ts`), banco de hierro forjado, farol con vidrio que alumbra, jardinera por módulos de 1 m con su
  bordillo, tramo y poste de valla, dos árboles (manzano y florecido), la rueda del molino, vaca, gallina, bebedero,
  rollo de heno, piedra del borde y el letrero de la entrada.
- `crearPueblo()` arma esa utilería en una arcilla aparte (`utileria-arcilla`); en el navegador, apenas carga el kit
  (se precarga con los muebles al abrir la granja) la cambia por `utileriaPueblo()`: las mismas posiciones, alturas y
  giros (`BANCOS_PUEBLO`, `ARBOLES_PUEBLO`, `PUENTES_PUEBLO`, `VALLAS_CORRAL`, `FAROLES_PUEBLO`, `JARDINERAS_PUEBLO`),
  juntadas por material con `fundir()` (`cuartos.ts`) para que sean pocas llamadas de dibujo. La rueda del kit va dentro
  del grupo `rueda` que ya animaba el pueblo. En Node (pruebas del motor) queda la arcilla.
- `liberarPueblo()` ya no destruye lo marcado `compartido` (geometrías, materiales y texturas de los kits).
- Edificios y altares (`personajes/blender/granja_edificios.py` → `public/modelos/granja_edificios.glb`, 0,9 MB): una
  pieza `edificio_<oficio>_<ancho>x<fondo>` por cada combinación de pueblo.ts (siete locales y cinco paletas de
  vivienda) con zócalo, entramado, puerta con arco de vidrio, ventanas con postigos y jardineras, techo de tejas en
  escama, frontón con ojo de buey y chimenea en el mismo sitio (el humo de la herrería sigue saliendo de la suya);
  `altar_aura` y `altar_lara`. La utilería propia de cada edificio está en `granja_pueblo.glb` (puestos del mercado,
  pila de troncos, banco de taller y barril, fragua, yunque y minerales, medallón y materas de la clínica, tablón y
  cajas del archivo, mesa de la posada, materas de la puerta teñidas con el color de la fachada).
- `building()` y `shrine()` dibujan todo en la arcilla reemplazable y anotan en una lista (`PuestoKit`) qué pieza va
  dónde; `utileriaPueblo()` las pone con esa misma lista. Si al kit le falta cualquier pieza (por ejemplo, un edificio
  de medidas nuevas que agregue el motor), se queda la arcilla completa: nada desaparece. Para un edificio nuevo, se
  agrega su `(oficio, ancho, fondo)` a `EDIFICIOS` en `granja_edificios.py` y se exporta.
- Lo único que sigue en arcilla en el pueblo: el piso de la plaza (debajo de la textura pintada), el pasto del corral y
  el canal del molino.

### El monte y las salidas en Blender (Claude, 11 de octubre de 2026)

- `personajes/blender/granja_monte.py` → `public/modelos/granja_monte.glb` (0,1 MB): `roble`, `pino`, `helecho`, `mata`,
  `hongo` y `tronco_caido` livianos (van por instancias, cientos de copias), y `arco_salida` y `senal_salida`.
- `monteZona()` (zonas-render.ts) sigue calculando los mismos sitios; `monteDeBlender()` cambia las instancias
  procedurales por las del kit (una por material de cada pieza), conservando posición, giro, escala y tinte por copia
  (copas y corteza). En el bosque ancestral los hongos del kit brillan como antes.
- `arcoSalida()` pone el arco de Blender y conserva el tablero con el nombre pintado (dos caras a ±0,046);
  `señalesSalidas()` (paisaje-render.ts) cambia el letrerito de flecha. Si el kit no carga, queda lo de figuras.
- Los árboles que se talan (obstáculos) siguen con sus modelos de la biblioteca; el adelanto de cada zona más allá de
  los arcos (`adelantoZona`) y la cueva de la mina quedan para la siguiente tanda.
