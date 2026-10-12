# Arreglos de la granja pedidos por Javier (12 de octubre de 2026)

> **Para el próximo Claude que siga con esto.** Javier mandó una lista grande de arreglos de la granja
> (`juego/web/src/granja-v3/`). ChatGPT, que llevaba el motor, se quedó sin uso: **Claude hace todo** (motor,
> interfaz, historia y gráficos), sin pedir permiso para cada parte. Antes de tocar nada, lee `CLAUDE.md` (regla de
> Blender: todo lo que se ve en la granja se modela en `personajes/blender/granja_*.py`) y
> [`granja-coordinacion.md`](granja-coordinacion.md). No se borra progreso guardado: el estado V5 es aditivo y los
> ids se conservan.

## Cómo trabajar esta lista

- Ve **tanda por tanda en el orden de abajo**. Cada tanda se termina completa: pruebas, capturas mirando los PNG,
  commit y push a las dos ramas (`claude/supermarket-mania-minigame-xn2it8` y la de la sesión, siempre con merge de
  origin antes y sin forzar). Revisa que «APK Android» y «Motor de la granja» salgan en verde. Al final, tacha lo
  hecho aquí con «**hecho**» y cuéntale a Javier en 3-6 líneas cómo probarlo.
- Pruebas que hay que correr siempre:
  - `cd juego/web && npx tsc --noEmit -p . && npx vite build && npm run build:amigos`
  - `npm run probar:granja` (36 suites, 0 fallos)
  - `node scripts/granja-v3/probar-astra.mjs` (21 comprobaciones)
  - `node scripts/granja-v3/verificar-medios-astra.mjs`
- Servidor de pruebas sin recarga:
  - Crea en el scratchpad un `vite-pruebas.config.mjs` con:
    `import base from '<repo>/juego/web/vite.config.ts'; export default { ...base, root: '<repo>/juego/web', server: { host: true, hmr: false } }`.
  - Arráncalo con `npx vite --config <eso> --port 5176`, en segundo plano.
  - Abre `http://localhost:5176/granja-v3.html`.
  - El gancho de prueba es `window.__granjaV3`, que trae `motor`, `vista`, `actuar`, `estado()`, `cargar(s)`, `panel(id)` y `settled()`.
- Para medir tirones usa `juego/web/scripts/_granja_tirones.mjs`. Es un script temporal: si no está, se rehace fácil.
  - Hace 14 labranzas, mueve la cámara entre celdas y anota cuánto CPU gasta cada `vista.sync`.
  - En SwiftShader los cuadros tardan más de 1 s de por sí, así que **mira el costo de `sync`, no los FPS**.
- `main.ts`, `vista.ts` y `motor.ts` tienen líneas larguísimas. Para editar, conviene parchear con Python, con
  reemplazos exactos y verificando que cada texto aparezca una sola vez.

## Decisiones ya tomadas con Javier

- **Fabricar (crafteo) en el menú y en la E: «Quitarlo del todo».** Las máquinas y los baúles siguen abriendo su
  panel de producción cuando se les da clic en el mundo.
- Lo demás queda a criterio de Claude, con el estilo de Stardew Valley como referencia: todo tiene un lugar físico al
  que se va, y la historia te lleva a descubrirlo.

## Tanda 1 · Rendimiento y gráficos altos en PC — **hecho** (este commit)

- `vista.sync` ya no reconstruye el mundo entero.
  - Había un `liberar(this.detalle)` que rehacía pasto (6.500 matas), estanques, parcelas y edificios en cada acción,
    al cruzar una celda de 12 m y cuando cambiaba un cultivo o un animal. Así se recompilaban sombreadores.
  - Ahora existe `pieza(clave, crear)`: cada parte se guarda con una clave de lo que la define y solo se rehace si
    cambió.
  - Resultado: de 180–300 ms por sincronización a 1–30 ms.
- Ya no se recorren por cuadro `animarObras` (solo corre si hay obras), `dependiente` y `guardian` (quedan guardados).
- Los modelos lejanos de la cámara no se animan.
- La biblioteca de modelos ya no bota tanto lo que no se usa (guarda 40 prototipos) y suelta las texturas.
- Guardado: lo repetitivo (labrar, regar, golpear…) se guarda 2,5 s después y junto, no en cada golpe.
- Al arrancar: `vista.precalentar()` compila los sombreadores con `compileAsync`.
- Calidad automática: respeta lo escogido en Ajustes, también si se escoge en plena partida (antes se leía solo al
  abrir). No juzga los primeros 12 s y solo baja tras 12 s seguidos por debajo de 20 FPS.
- **Queda pendiente de rendimiento** (si Javier sigue viendo tirones):
  1. En «alta» hay ~551 modelos cerca, cada uno con su `AnimationMixer` y sus sombras. Lo siguiente sería instanciar
     árboles y rocas: `InstancedMesh` por modelo con viento en sombreador.
  2. Una tercera calidad «ultra» solo para computador: pixel ratio 2, sombras 4096 y más radio. Javier quiere meter
     muchos más gráficos.
  3. `motor.actuar` hace `structuredClone` del estado entero en cada acción (`motor.ts:272`).
  4. El minimapa recorre los 1.212 obstáculos cada 200 ms (`hud.ts` `tic`). Se arregla solo con la tanda 4.
  5. Texturas de lienzo de los arcos de salida que no se liberan (`zonas-render.ts:274-277`).

## Tanda 2 · Menú de 3 rayitas, Escape, E y barra — **hecho** (12 de octubre)

Quedó así:
- **Menú de 3 rayitas** con solo seis pestañas: Mochila, Diario, Vecinos, Habilidades, Premios y Ajustes. Si había
  guardada una pestaña que ya no existe, abre la mochila (`hud.ts`).
- **Escape**: si hay algo abierto (panel, colocación, diseño, atlas o tarjeta) lo cierra; si no, abre el menú. El mapa
  grande se cierra con su propio Escape (`preventDefault` en `hud.ts`) y no abre el menú de paso.
- **E** abre solo la mochila, sin la tira de pestañas (clase `solo-mochila` en el body; se quita al abrir otro panel
  o cerrar).
- **Fabricar, Construir, Diseñar, Animales, Mascotas, Crianza, Explorar, Colecciones, Atlas, Terreno, Cultivos,
  Campaña y Astra** ya no son pestañas: se abren desde su lugar. Campaña y Astra, mientras llega la tanda 6, desde
  dos botones arriba del Diario.
- **Carpintería**: «Encargar obras y muebles» y «Mover edificios de mi granja». Si se pide desde el pueblo, sale del
  mostrador y el modo diseño se abre solo al llegar a la granja (`disenoPendiente` en `actualizarUI`).
- **Casa de los Animales**: adoptar animales de granja, mascotas y caballos, huevos e incubación, «Consultar a la
  cuidadora sobre crianza» y el libro de los habitantes (el atlas).
- **Clic en los edificios de la granja**: ya no sale tarjeta; entra directo a la casa, el refugio o el invernadero, o
  abre la caja de envíos. Mover y guardar se hacen en el modo diseño (botón «Guardar en mochila» en la barra de
  colocación). Lo del refugio (pasto, jardinero, habitantes) sigue dentro del refugio.
- **Barra**: las 12 casillas se encogen para caber siempre (sin barra movible), probado en 844×390 y 1366×768.
- `scripts/granja-v3/verificar-colecciones.mjs` abre las colecciones directo (ya no hay pestaña).


Lo pedido:

- «al dar escape debería mostrar el menú de las 3 rayitas».
- «quitar todo lo inútil del botón de las 3 rayitas».
- «del panel que abre la E que solo permita la mochila».
- «quita construir…», «quita diseñar…», «quita animales, mascotas y crianza».
- «al dar click a los edificios no quiero que salgan pestañas que digan qué hace».
- «de la barra de tareas encoge los ítems… que no toque usar una barra movible».
- «simplifica todos los paneles en general».

Dónde está:

- **Menú.**
  - Botón `#hud-menu` en `hud.ts:73-78`: abre la última pestaña guardada en `granja-hud-pestana`.
  - Pestañas: `nav.menu-pestanas` en la plantilla `main.ts:84-94` (línea `:90`). Sus `data-panel` son inventario,
    semillas, produccion, taller, diseno, animales, companeros, crianza, vecinos, premios, historia, astra, diario,
    habilidades, expediciones, colecciones, atlas, valle y ajustes.
  - La tira de pestañas solo se ve con `body.menu-abierto` (MutationObserver en `hud.ts:84-88`; CSS en `hud.css:100-105`).
- **Paneles.**
  - `mostrarPanel(id)` está en `main.ts` (cadena de `if` desde «`if(id==='premios')`»). `cerrarPanel()` está justo
    antes.
  - Los clics van por un solo `[data-do]` delegado (busca `data-do` en `main.ts`).
- **Teclado.**
  - Manejador en `window.addEventListener('keydown'` de `main.ts`. Hoy Escape cierra, Tab cambia de fila, 1-0 eligen
    casilla, F abre habilidades, G la rejilla, R gira, E/I abren la mochila.
  - `hud.ts:384-387`: M abre el mapa.
- **Clic en edificios.**
  - `usarCelda` → `inspeccionar()` → `contextHTML()` (tarjeta `section#context` con título, descripción y botones).
  - En el pueblo, `atender()` → `contenidoServicio()` (los mostradores).
- **Barra.** `renderBarra` (`barra-ui.ts`) y CSS `barra-ui.css:1` (`overflow-x:auto` y `flex-shrink:0`). También
  `estilo.css:13` (móvil) y el `max-width` de `.tools-wrap` en `hud.css:50,152,161`. `LARGO_BARRA=12`.

Plan:

1. **Escape:**
   - Si hay panel, mapa o colocación abiertos, los cierra. Si no hay nada abierto, abre el menú.
   - Ojo: no puede romper el cierre de `jornadaModal`, del mapa grande (`hud.ts`) ni de la rejilla de la mochila
     (`inventario-ui.ts:133`).
2. **Menú final, pocas pestañas:**
   - Se quedan Mochila, Diario, Vecinos, Habilidades, Premios (simplificado) y Ajustes. El mapa sigue en M y en el
     minimapa.
   - Salen produccion, taller, diseno, animales, companeros, crianza, expediciones, colecciones, atlas, valle, semillas
     e historia/astra como pestañas.
   - Los paneles siguen existiendo por dentro: se abren desde su lugar físico (tanda 6) o desde escenas.
   - Antes de quitar `semillas`, mira `renderCultivos` y `renderFrutales`: si solo es una guía, sale. Sembrar es con la
     semilla en la barra.
   - Cuida que `CLAVE_PESTANA` guardada con una pestaña que ya no existe vuelva a `inventario`.
3. **E = solo la mochila:**
   - Al abrir con E, no se muestra la tira de pestañas.
   - Puede ser con una clase `solo-mochila` en el body, o abriendo el panel sin `menu-abierto`.
4. **Construir y Diseñar en la carpintería** (Taller del Roble, `pueblo-datos.ts:12`, mostrador «carpinteria»):
   - El mostrador ofrece «Encargar obras» (el panel `taller`) y «Mover edificios de mi granja», como Robin en Stardew.
   - Este último lleva a la granja en modo diseño (`entrarDiseno` / `salirDiseno` en `main.ts`) y, al terminar, deja
     al jugador en la granja.
   - `emplazar_obra` (`motor.ts:557`) solo funciona afuera en la granja. Al encargar, ofrece «Elegir el lugar en la
     granja», que hace lo mismo.
   - Clic en una obra en 3D ya abre el taller (dejarlo).
5. **Animales, mascotas y crianza en la Casa de los Animales** (`pueblo-datos.ts:11`, la cuidadora en
   `pueblo-datos.ts:22`):
   - Hoy su mostrador solo abre la pestaña Animales.
   - Hacer un panel de tienda de animales con:
     - adoptar (granja y compañeros, `compania.ts:46`);
     - huevo fértil;
     - «Consultar a la cuidadora sobre crianza», que es el panel `crianza`: mamá, papá y probabilidades.
   - Cuidar, trasladar y montar se hacen con clic al animal en el mundo (`onObjetivoGanado`). Revisa que lo que hoy
     solo está en la pestaña Animales (ver estado, trasladar) quede en ese clic.
6. **Sin tarjetas al clic en edificios:**
   - Al clic, hacer directamente la acción principal: entrar a la casa, abrir el refugio o el mostrador. Ojo: dormir
     hoy está en esa tarjeta; dentro de la cabaña ya se duerme en la cama.
   - Lo secundario (mover, guardar, pasto) sale del modo diseño de la carpintería o de un clic sostenido.
   - Basta el nombre flotante de `#target-info` al pasar el mouse.
7. **Barra:**
   - Las 12 casillas caben siempre: casillas con `width: min(46px, calc((100vw - X) / 12))`, sin `overflow-x` ni
     `flex-shrink:0`.
   - Revisar en 844×390 (celular) y en 1366×768.

## Tanda 3 · Mochila estilo Minecraft y habilidades simples — **hecho** (12 de octubre)

Quedó así:
- **Mochila** (`renderMochila` en `inventario-ui.ts`): arriba, el retrato de cuerpo entero del personaje que juega
  con las ranuras de cabeza, cuerpo y pies a la izquierda y el arma a la derecha (tocar una ranura llena la quita);
  al lado, salud, energía, ataque y defensa (`motor.bonos()`); abajo, la rejilla. Al tocar un objeto, las barras se
  cambian por su detalle y los botones «Separar mitad» y «Soltar». Ya no salen «Elige un objeto», ampliar, «Tu
  partida» ni «Objetos de tu partida anterior».
- **Retratos**: `public/granja/retratos/el.webp` y `ella.webp`, renderizados en Blender con fondo transparente
  (toma `cuerpos` de `personajes/blender/renderizar.py`; el `.blend` se reconstruye con `construir.py` si el
  Blender instalado es más viejo que el del archivo).
- **Ajustes** tiene ahora «Tu partida» (`renderPartida`): exportar, importar y recuperar los objetos de la partida
  anterior (`recuperar-legado`). **Ampliar la mochila a 36** se compra en el mostrador de la tienda de semillas
  (`ampliar-mochila`, 250 monedas).
- **Habilidades** (`habilidades-ui.ts`): una fila por habilidad con su ícono grande, el número de nivel y los 10
  niveles; al pasar el mouse o tocar un nivel sale un globito con lo que da (menos energía de la herramienta,
  probabilidad de oro, precisión, ataque, profesión y recetas de ese nivel). La profesión o la especialización se
  elige en una tarjetica que solo aparece cuando toca; la elegida queda como etiqueta con su globito. Una lunita
  avisa que hay aprendizajes que se reconocen al dormir.
- Probado en 844×390 y 1366×768 (mochila con E, selección, Ajustes, globitos arriba y abajo, elegir profesión,
  ampliar en la tienda).


Lo pedido:

- «la sección de la mochila sea estilo el inventario de Minecraft, con el cuerpo del personaje mostrando sus posibles
  armaduras, su inventario».
- «quita lo de la sección tu partida de ahí y lo de elegir objeto y ampliar a x casillas también».
- «el panel de habilidades… simplifícalo que solo se vea los símbolos, qué nivel estás y si pones el ratón encima de
  x nivel te diga su mejora».

Dónde está:

- `renderMochila` y `conectarMochila` están en `inventario-ui.ts:83-135`. Todo cabe en la línea `:91`:
  - `.mochila-seleccion` («Elige un objeto»);
  - `data-mochila="ampliar"` (`ampliar_mochila`, que solo se activa en la tienda de semillas);
  - `equipo-grid`;
  - `<details>` «Objetos de tu partida anterior»;
  - «Tu partida»: exportar, importar, calidad y descansar, con sus manejadores en `main.ts` `case 'exportar'`,
    `'importar'`, `'calidad'` y `'descansar'`.
- El equipo ya existe: `equipar_objeto` y `desequipar_objeto`.
- `renderHabilidades` está en `habilidades-ui.ts:8-11`: 5 `hab-card` con pips, barra de experiencia, profesiones
  (`data-hab-profesion`) y recetas que vienen.

Plan:

1. **Mochila:**
   - A la izquierda, el cuerpo del personaje (Él o Ella, la del jugador) con casillas de cabeza, cuerpo, piernas,
     pies, accesorio y arma alrededor, como Minecraft.
   - Para el retrato, un render de Blender: los peluches ya están en `public/modelos/`. Se puede sacar una imagen PNG
     por personaje con `personajes/blender` y un PNG por cada pieza de ropa si hace falta.
   - A la derecha, la rejilla del inventario. Abajo, la barra.
   - Se quitan «Elige un objeto», «Ampliar», «Tu partida» y «Objetos de tu partida anterior».
2. Exportar e importar pasan a Ajustes. Descansar ya existe en la posada. Ampliar la mochila pasa al mostrador de la
   tienda de semillas (`contenidoServicio`, `service==='semillas'`).
3. **Habilidades:**
   - Una fila de símbolos (íconos grandes) con su número de nivel.
   - Al pasar el mouse por cada nivel (o mantenerlo en el celular), un `title` o tooltip propio con la mejora.
   - La profesión se elige en una tarjeta pequeña solo cuando toca.

## Tanda 4 · Minimapa y mapa grande

Lo pedido:

- «mejorar el minimapa, que muestre mucho mejor el mundo real, no solo cuadrados».
- «que diga los nombres de cada lugar».
- «que el mapa grande tenga mucho más detalle como una vista de arriba de la zona real».
- «marcadores para marcar puntos de interés… que te guíe».
- «que solo salga el mapa sin la opción de buscar a alguien; con que salga su ubicación en el mapa es suficiente».

Dónde está:

- Todo está en `hud.ts`, con Canvas 2D girado como la cámara:
  - `orientar`, `aPantalla` y `transformar` (`:130-143`);
  - `dibujarZona` (`:148-245`), `dibujarAstra`, `dibujarExpedicion` y `etiqueta`;
  - `pintarMini` (`:329`) y `pintarGrande` (`:344`);
  - un intervalo de 200 ms (`:438-447`).
- Buscador: `select#mapa-buscar`, que se llena con `NPC_ASTRA` (`:369-376`), y `guiaBuscado` (`:294-321`).
- Límites de zonas: `caminos-mundo.ts:16-21` `dentroDeZona`, con copias en `hud.ts:35-41` y `zonas-render.ts:12`.

Plan:

1. **Vista real:**
   - Por cada zona se renderiza **desde arriba** con una cámara ortográfica cenital, en un `WebGLRenderTarget` (o un
     renderer aparte) de unos 1024 px.
   - Se guarda como imagen y se rehace solo cuando cambian edificios o zona, como las `piezas` de la tanda 1.
   - El minimapa y el mapa grande dibujan esa imagen, más jugador, vecinos (puntitos con su nombre al pasar el
     mouse), salidas y edificios con su nombre.
   - Astra igual, por región, con su `plano`.
2. Etiquetas con los nombres de lugares: `DESTINOS` en `vista.ts:52`, `EDIFICIOS_PUEBLO`, `SALIDAS[].nombre` y los
   lugares de cada región.
3. **Marcadores:**
   - Clic en el mapa grande pone un marcador; se guarda en localStorage por zona.
   - El minimapa muestra una flecha al borde hacia el marcador y su distancia (reusar la idea de `guiaBuscado`).
   - Clic otra vez sobre el marcador lo quita.
4. Quitar `#mapa-buscar` y `#minimapa-buscando`. Los vecinos se ven siempre en el mapa.

## Tanda 5 · El mundo

Lo pedido:

- «hay casas que están atravesadas en medio de caminos».
- «que los caminos realmente estén conectados para ir de una zona a la otra».
- «que en el centro de los pueblos haya letreros que te guíen».
- «que sea más amplia la zona para tomar los caminos… solo 3 cuadraditos».
- «que los lagos se puedan expandir y cambiar a gusto, forma más bonita, no solo un óvalo».
- «el diseño de la mina que sea cuadradito como el interior».
- «al plantar semillas no se notan en suelo labrado».

Hallazgos con coordenadas:

- **Casas sobre caminos (Pueblo del Sol):**
  - La Casa de los Animales (58,3; 7×6) y la Forja del Arroyo (99,0; 7×7) tienen la vereda de su puerta pasando por
    dentro. Causa: la regla `pueblo-datos.ts:83` (`target=zz<12?-.1`). Las puertas están en la cara +z
    (`pueblo.ts:87 building()`).
  - La Casa de los Tejidos (`vivienda_15`, 78,31; 7×7) está encima de la calle norte–sur `[82.5,25,3,16]`.
  - Hay árboles en la calle en (56,1) y (68,25) (`ARBOLES_PUEBLO`, `pueblo-datos.ts:127`).
  - En Astra, revisa también con `docs/narrativa/herramientas/revisar` / `_plano_libre.mjs`.
- **Entrada del pueblo:**
  - El letrero está en (54,1.8), pero la salida real está en (55,12), sobre pasto y sin calle.
  - Al llegar de la granja se aparece en (58.5,12.5), **dentro del corral** (`VALLAS_CORRAL`, `pueblo.ts:223`).
- **Salidas:**
  - `SALIDAS` (`caminos-mundo.ts:3-15`) son puntos de una celda.
  - El cliente usa radio 1.3 en la granja y 0.85 fuera (`comprobarSendero` en `main.ts`), y el motor 1.2
    (`motor.ts:667`). En la granja, lo que cae entre 1.2 y 1.3 se rechaza y queda bloqueado 3 s.
  - Agrandar: radio 2.5–3 en los dos lados, iguales. Dibujar una «boca» de camino ancha en la salida.
  - Los «3 cuadraditos» son `señalesSalidas` (`paisaje-render.ts:42-51`), con la flecha siempre a +x. Hay que
    girarla hacia el destino.
- **Senderos que no conectan:**
  - `SENDEROS_PUBLICOS` (`vista.ts:40`):
    - En el lago, el sendero D llega a x≈28 y la salida está en (13,78).
    - En el bosque no hay camino de la salida (-59,3) al sendero A (x≈-74).
    - El sendero B del pueblo no lleva a ningún lado.
    - El sendero D de la granja pasa por tierra comprable (x 26.5-29.5, z 50.6-56) y no está en `esSenderoGranja`.
  - Hacer una red de caminos real: cada salida unida al centro de cada zona.
  - Letreros de Blender (el kit del pueblo ya tiene `letrero`) en las plazas y cruces, con los nombres de los
    destinos.
- **Lagos:**
  - El lago principal es `mallaAgua(13,10)` en (28,89) (`vista.ts:170`, `paisaje-render.ts:23`). Su orilla es
    `orillaLago` (`zonas-render.ts:116`) y su colisión `transito.ts:14`, que queda media celda corrida.
  - Los estanques de la granja son óvalos: `paisaje.ts:4-8`, con validación de radio ≤ 6 y ≤ 10 estanques.
  - Plan:
    1. Pasar a **forma por celdas**: cada estanque es un conjunto de casillas de agua, con borde suavizado tipo
       *marching squares* que deja esquinas redondeadas y orilla de piedras y juncos.
    2. Nueva acción «cavar estanque» con la pala o azadón sobre una casilla junto al agua, y «rellenar» para quitar.
    3. Agua, colisión y pesca leen esas casillas.
    4. Migración: convertir cada óvalo viejo a casillas dentro de `migrarEstado`.
- **Mina:**
  - La entrada `cuevaMina` (`zonas-render.ts:158-250`) tiene piso elíptico y muros de bolas en anillos, con la mitad
    recortada hacia la cámara. Por eso se ven los semicírculos.
  - Hacerla cuadrada, con muros de bloque como los pisos de la aventura (`mina-render.ts:92` `terrenoMina`), que es lo
    que a Javier le gusta.
  - Su caminable es el cuadrado [-10,10]×[-9,9].
  - En los pisos, `generarChunk` (`aventura.ts:170-212`) hace cavernas elípticas recortadas al borde del trozo. Mejor
    salas rectangulares.
- **Semillas:**
  - La fase 0 de los cultivos con `forma` es `brote()` (`cultivos-render.ts:60-62`), de 0.06 de alto y tapada por los
    surcos de 0.08 (`suelo.ts:105`).
  - Los 9 cultivos base cargan `<modelo>_0.glb` diminutos (`vista.ts`, `crop-…`).
  - Plan: para la fase 0, montoncito de tierra removida con 3-5 semillitas claras encima. Modelarlo en Blender
    (`granja_*.py`) y verse siempre, también regado (más oscuro).

## Tanda 6 · Historia natural y lugares físicos

Lo pedido:

- «la campaña, astra, misiones que tengan su desarrollo natural dentro del juego». Puede ser con mensajes del buzón
  como Stardew, o en una casa de aventureros. El primer paso puede ser que llegue una persona (Celia, las diosas o el
  prólogo) dando la introducción, y que llegue una carta con la misión principal de campaña. Cada paso (o pasos
  simultáneos) va abriendo lo siguiente.
- «que los primeros minutos de gameplay sea seguir la historia principal donde se explique todos los funcionamientos
  básicos».
- «las expediciones que inicien desde una casa o zona de mercenarios… un punto físico… que la propia historia te
  lleve a saber que ahí se hacen».
- «en general quiero que todo tenga su punto físico».
- «las colecciones… un lugar del mismo estilo [centro cívico de Stardew]… tipo museo o galería».
- «el atlas y terreno también… sus propios puntos físicos».
- «los vecinos… ponles la foto del Blender».
- «que la historia de los habitantes se entregue al completar misiones o iniciar misiones o al hablar con ellos,
  pero no que lo suelten todo de golpe». Con «continúa» se veía toda la historia de un vecino de una.

Dónde está:

- **Partida nueva:** `inicial()` en `motor.ts:82-98`. No hay introducción ni tutorial. Solo existe la cadena vieja
  `MISIONES` en `catalogo.ts:116-126` y el `quest-mini`.
- **Correo** (`correo.ts`):
  - `CARTAS` en `:9-23`; solo `bienvenida` en partida nueva.
  - `entregarCorreo()` corre **solo al dormir** (`motor.ts:714`).
  - Para leer hay que estar cerca del buzón (`buzon.ts:5-6`). Panel `renderCorreo`.
  - Para el prólogo, sembrar una carta en `crearCorreo` y en la migración (`motor.ts:836`).
  - Hay que crear un enlace correo → historia, porque hoy el correo solo llama `actuarEncargo`.
- **Campaña:**
  - `MISIONES_HISTORIA` (`historia-datos.ts`, generado; no editar a mano): 217 historias, 36 principales.
  - P01 «La semilla que no despierta» está en pueblo_sol, sin requisitos.
  - `aceptar` solo pide estar en la región (`historia.ts:85-89`). Se acepta desde la pestaña Campaña.
  - Los objetivos ya son físicos: un puesto, el vecino o algo de la granja.
  - Las expedientes de Astra (`CAMPANA_ASTRA`) repiten los mismos ids P/F en otra pestaña, lo que confunde: unificar.
- **Vecinos de Astra:**
  - `hablar` pone `VID_<id>_1` (`astra.ts:107-111`). El panel de biografía (`astra-ui.ts:15-16`, botón `astra-bio`)
    muestra **todo**: pasado, presente, las 3 memorias, cotidiano, arco y vínculos.
  - Repartir: al conocerlo, solo «presente». Cada charla de días distintos (máximo una por día) abre un trozo. Al
    aceptar su misión, el pasado. Al completarla, las memorias y el arco.
  - Guardar en `astra` un contador por vecino (aditivo en V5, con normalización).
- **Aldeanos del Pueblo del Sol:** `renderConversacion` (`aldeanos-ui.ts:19-24`) y «Escuchar su historia»
  (`astra-hablar`).
- **Retratos:**
  - Hoy son CSS (`aldeanos-ui.ts:10` `retrato()`).
  - Hacer PNG de Blender por vecino con un `render_retratos.py` que use `vecinos-astra.ts` (`FilaAstra`) y la ropa de
    `vecinos3d.ts`. Van a `public/granja/retratos/<id>.webp`, pequeños (128 px). Se usan en Vecinos, en la
    conversación y en la caja de diálogo.
- **Expediciones:**
  - `entrar_aventura` (`motor.ts:370-377`) ya pide estar en un lugar: la mina, el bosque ancestral, un portal o nave
    construida, o el punto de combate de Astra.
  - Falta un **Gremio de aventureros** en el Pueblo del Sol: edificio en Blender, con su mostrador. Ahí está el tablón
    de expediciones, que es la pestaña `expediciones` de hoy. La historia lo presenta (una carta o la escena de P01).
- **Colecciones:**
  - Hoy se usan en el «archivo» (Casa de los Oficios), con `puedeUsarArchivo` (`colecciones.ts:21`).
  - Hacer un **Museo / Galería**:
    - Un interior con vitrinas y lotes, cada uno con su placa (como el centro cívico).
    - Al entregar, el objeto aparece en su vitrina, en 3D con su modelo.
    - Los lotes completos traen su premio.
- **Atlas:** es la vista 3D de especies (`main.ts`, `verAtlas`). Va a una sala del museo: «Galería de especies».
- **Terreno:** comprar sectores (`{tipo:'sector'}`, `motor.ts:532`, que hoy no pide lugar). Pasa a la carpintería o a la
  Casa de los Oficios como «Oficina de tierras». Pedirlo en el motor con una comprobación de lugar.
- **Inicio guiado** (los primeros minutos). Cadena tutorial con pasos que se ven en el `quest-mini`:
  1. Llega Celia a la granja (escena con su voz si existe): presentación, mochila (E) y barra.
  2. Labrar, sembrar y regar 3 casillas.
  3. Revisar el buzón: llega la **carta de la campaña**, con el primer paso de P01.
  4. Ir al Pueblo del Sol por el camino, guiado por los letreros.
  5. Conocer la tienda, la carpintería, la Casa de los Animales, el gremio y el museo. Cada lugar se presenta la
     primera vez que se entra.
  6. Dormir. Cada paso nuevo de la campaña llega por carta o lo cuenta un vecino.
- **Diario:** una sola pestaña con lo activo de campaña, encargos, Astra y el paso siguiente. Es de solo lectura; se
  acepta en el mundo (carta, vecino o tablón).

## Datos útiles

- El Pueblo del Sol está en las coordenadas del mundo:
  - Entradas: animales (61.5,10.4); carpintería (95.5,-7.6), con la carpintera en (94.8,-5.1).
  - Ruta del Cruce: (108,29).
  - Zonas: pueblo [50,112]×[-43,44], bosque [-101,-57]×[-24,23], ancestral [-102,-55]×[52,100],
    lago [5,49]×[74,111], mina [-10,10]×[-9,9]. La granja es la unión de los `SECTORES` (x -50..50, z -40..56).
- Los nombres de las zonas están en `DESTINOS` (`vista.ts:52`) y `SALIDAS[].nombre`.
