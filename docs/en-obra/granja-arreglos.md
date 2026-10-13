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

## Tanda 4 · Minimapa y mapa grande — **hecho** (12 de octubre)

Quedó así:
- **Vista de verdad:** como el mundo solo tiene cargado lo que está cerca (29 m en ligero, 46 en detalle), el mapa se
  va **fotografiando por cuadros de 16 m** a medida que uno recorre: `vista.fotoCenital()` saca una foto desde arriba
  (cámara ortográfica, sin personajes, animales, niebla ni lluvia, con luz de mediodía) de cada cuadro cercano que
  falte o tenga más de 45 s, una cada 380 ms como mucho (`mapa-real.ts`, `FotosMapa`). Las fotos se guardan en el
  celular (IndexedDB `granja-mapas`, una hoja WebP por zona y partida), así que al volver a abrir el juego el mapa
  sigue explorado. Funciona igual en las regiones de Astra.
- Lo que todavía no se ha recorrido se ve como un **plano dibujado** (árboles con sombra y brillo, techos, caminos con
  borde, agua con orilla), más pálido. Ese plano se pinta una vez en su lienzo y solo se rehace cuando cambia la
  partida, como mucho cada 2,5 s (antes se recorrían los 1.212 recursos cinco veces por segundo).
- **Nombres:** salidas (pastilla dorada con ➜ y el destino), edificios del pueblo, casas de los vecinos, la cabaña,
  los refugios, la caja de envíos y el hogar de la mascota, el lago y el muelle; en el minimapa se saltan los que se
  montan encima de otro. Los vecinos se ven siempre como puntitos; su nombre sale en el mapa grande o si están cerca.
- **Mapa grande:** ocupa toda la pantalla (Javier pidió quitar el panel del lado para que haya más espacio y los
  nombres no queden encimados); arriba a la izquierda, el nombre de la zona y el porcentaje explorado, y abajo una
  ayudita. Zoom con la rueda o pellizcando, y se arrastra. Un toque pone una **marca** que te guía; tocar otra marca
  la vuelve la guía y tocar la que guía la quita. Los nombres que chocan se corren un poquito arriba o abajo antes de
  saltarse, y los de los vecinos salen al acercar el mapa.
- **Minimapa:** muestra las marcas; la que guía tiene una flecha dorada en el borde y, abajo, «📍 Tu marca · 23 m».
  Si la marca está en otra zona, dice por cuál salida ir. Al llegar avisa «¡Llegaste a tu marca!» y la quita.
- Se quitó el buscador de vecinos (`#mapa-buscar`, `#minimapa-buscando`) y el mapita del valle del lado.
- De paso: `vista.precalentar()` ya no usa `compileAsync` de three.js, que reventaba si un material se liberaba
  mientras compilaba y dejaba la carga de la granja pegada para siempre; ahora espera a mano y como mucho 8 s.
- Las marcas se guardan en `localStorage` (`granja-mapa-marcas`) junto con la semilla de la partida.


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

## Tanda 5 · El mundo — **hecho** (12 de octubre)

Quedó así:
- **Salidas anchas:** se toman en un radio de 2,5 m (antes había que atinarle a una casilla: 0,85 m fuera de la
  granja y 1,3 m adentro; el motor acepta 2,9). Al llegar a una zona la salida de regreso no se dispara hasta que uno
  se aleja de ella (`salidaArmada` en `main.ts`), así que ya no hay rebotes. Llegadas corridas: a la mina (0.5, 3.5)
  y al lago (14.5, 82.5). En cada salida hay una **boca de camino** ancha y el letrerito de Blender gira la flecha
  hacia el destino (`salidasZona` en `zonas-render.ts`; se quitaron los «3 cuadraditos»).
- **Caminos que conectan** (`SENDEROS_ZONA` en `caminos-mundo.ts`): en el bosque, de la salida a la granja al sendero
  del bosque, al claro y a la salida del bosque ancestral; en el ancestral, de la salida al claro del guardián; en el
  lago, de la salida al muelle. Van por donde el monte no tiene árboles. Se quitaron los senderos sueltos que no
  llevaban a ningún lado (el del pueblo que atravesaba la Casa de los Oficios, el del sur y el que cruzaba tierra
  comprable de la granja). El lago perdió el roble que quedaba en medio de la llegada.
- **Pueblo:** la salida a la granja ahora es el final de la calle principal, junto al letrero de entrada (antes estaba
  sobre el pasto y uno aparecía dentro del corral). Las veredas de la Casa de los Animales y de la Forja ya no
  atraviesan sus edificios; la calle sur se corrió al hueco entre la Casa de los Tejidos y la del Observatorio; los dos
  árboles que había en la calle se quitaron.
- **Postes guía** (modelo de Blender `poste_guia` + `tabla_guia` en `granja_monte.glb`, con los nombres pintados en
  las dos caras): en la plaza del pueblo (granja, mercado, taller, forja, posada, Casa de los Oficios) y en los cruces
  del bosque, del ancestral y del lago.
- **Mina cuadradita:** la entrada usa el mismo `terrenoMina` de los pisos de adentro (losas y paredes de bloque) con un
  plano hecho a mano del cuarto [-10,10]×[-9,9] y la boca del túnel; entibados, cristales y piedritas siguen las
  paredes rectas. El pozo se corrió a (0, -6.6).
- **Semillas que se notan:** lo recién sembrado lleva un montoncito de tierra removida con semillitas (Blender,
  `semillas_tierra`), más oscuro cuando está regado.
- **Estanques por casillas:** `paisaje.agua` guarda las casillas de agua (las partidas viejas las sacan de sus óvalos
  al cargar). En el modo diseño hay dos botones, «💧 Cavar agua» y «🟫 Rellenar»: se toca (o se arrastra con el
  mouse) y la casilla se vuelve agua o tierra (2 y 1 de energía; hasta 320 casillas; no se cava sobre cultivos,
  edificios ni donde uno está parado). El agua se dibuja con orilla redondeada (máscara borrosa de las casillas),
  espuma en el borde y juncos y piedras de orilla de Blender; colisión, pesca y minimapa leen las mismas casillas.
- **Retratos de los vecinos** (adelanto de la tanda 6): `scripts/granja-v3/retratos-vecinos.mjs` fotografía a cada
  vecino (el peluche de Blender vestido con su ropa) y guarda `public/granja/retratos/<id>.webp`; salen en las tarjetas
  de Vecinos, en la conversación y en los vecinos de Astra (si falta la foto, queda el dibujito de antes).


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

## Tanda 6 · Historia natural y lugares físicos — **hecha** (12 de octubre)

Quedó así:
- **Gremio de Aventureros** (`gremio`, 9×7 en (67,2), puerta a la callecita de los animales) y **Museo del Valle**
  (`museo`, 9×7 en (86.8,-27), vereda propia a la calle norte–sur). Modelos `edificio_gremio_9x7` (sillares, entramado,
  techo vino tinto, torre redonda con banderín, puerta de arco con clavos, estandartes, antorchas, escudo con espadas,
  tablón y armero afuera) y `edificio_museo_9x7` (pórtico de cuatro columnas, frontón con medallón y laureles, cúpula
  verde cobre con linterna, ventanas de arco y matas podadas) en `granja_edificios.py`. Atienden la exploradora (gremio)
  y el vecino mayor (museo, 8:00–18:00 todos los días). Se quitaron el árbol (88,-26), la jardinera de (73,7) y se movió
  un farol; la jardinera de (88,-20) quedó corta.
- **Interiores** (`cuartos.ts` `interiorGremio` / `interiorMuseo`) con piezas nuevas de `granja_muebles.py`: tablón de
  misiones, mesa de mapas, armadura, cofre del tesoro, escudos, estandarte, vitrinas con vidrio transparente, pedestales,
  cordones, fósil del dragoncito, banco y cartelas. `museo-render.ts` expone en las **seis vitrinas** lo elegido en el
  museo comunitario (las seis piezas comunitarias son modelos de Blender `pieza_<id>`; peces, cosechas y minerales usan la
  figurita de los íconos) y cada **lote cerrado** pone su pieza en el pedestal de su cartela. La vista rehace el interior
  si cambia lo expuesto (`firmaMuseo`).
- **Mostradores**: el museo tiene lotes y reserva de semillas, donaciones y vitrinas y la galería de especies (el atlas,
  que salió de la Casa de los Animales); el gremio, el tablón de expediciones y la campaña; la Casa de los Oficios queda
  con encargos, biblioteca y obras comunitarias. `puedeUsarArchivo` acepta el archivo y el museo.
- **Terreno**: «Oficina de tierras · comprar terreno» en la carpintería; el motor (`case 'sector'`) solo compra estando
  en el Taller del Roble. El clic en un sector ajeno de la granja muestra dónde comprarlo.
- **Vecinos por partes** (`astra-ui.ts`): al conocerlo, lo que vive hoy; con charlas en días distintos (`astra.charlas`,
  5 puntos por día) se abren su vida cotidiana (2), cómo ve a Fuatia (3) y, si no tiene misión, su pasado (4), sus
  recuerdos (6) y lo que puede cambiar (8). Con misión: el pasado al aceptarla; recuerdos y arco al completarla. Se quitó
  el enlace a la biografía completa de la wiki.
- **Inicio guiado** (`guia.ts`, estado aditivo `guia` con normalización): prólogo de Celia (panel `prologo`, se abre solo
  en partida nueva), primer surco (3 labradas, sembradas y regadas), carta `carta_campana` de la Santa de Aura que llega
  al buzón apenas se termina el surco (no de noche), camino al pueblo, entrar a mercado, carpintería, Casa de los
  Animales, gremio y museo, aceptar P01 y dormir. Se ve en el recuadro de misión («Primeros pasos · n/7») y en «Lo que
  sigue» del Diario. Las partidas con progreso no repiten el inicio. Cada local se presenta la primera vez que se entra
  (`PRESENTACIONES`). Prueba: `scripts/granja-v3/probar-guia.mjs`.

- **Campaña por carta y por los vecinos** (`correo-campana.ts`): cada misión principal (P02–P24 y F01–F12) que se abre
  (`historiaDisponible`) y no se ha aceptado llega al buzón la noche siguiente, firmada por el primero de su reparto, con
  a quiénes buscar y dónde. Los vecinos del Pueblo del Sol que participan en una misión abierta la mencionan al
  conversar («Te cuenta»). Se sigue aceptando en el Diario, estando en la región.
- **Campaña y Astra unificadas**: el panel de Astra ya no repite los 36 expedientes P/F (salvo los que la partida ya
  tenía empezados, para no perder progreso); deja los expedientes propios de cada región y un botón a la campaña.
- **El prólogo en película** (12 de octubre, pedido de Javier): ver `docs/sistemas/cine-granja.md`. Reemplaza al
  prólogo escrito (que queda de respaldo si el teléfono no puede con la película).


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

## Además (gráficos)

- **Obras y refugios por dentro en Blender** **hecho** (12 de octubre): `granja_obras.glb` (`personajes/blender/granja_obras.py`)
  ya está en el juego. La obra (`construccion-render.ts`) usa sus postes con zapata, vigas, escalera, tablas con
  serrucho, cajón de herramientas, cartel con casco, estacas y el obrero de peluche con el brazo del martillo aparte
  (lo anima `animarObras`); el piso de la obra y la barra de avance siguen como estaban. Por dentro, los refugios
  (`arte.ts decorarInterior`) cambian piso, paredes, pesebres, corrales, bebedero y comedero de piedra, camas, percha
  con nidales, madriguera, cristales o pesebre alto por las piezas del modelo, y los adornos (`zonas-render.ts
  adornosRefugio`) ponen paja regada, farol, ventanas, costales, escoba y aseladero. Mientras carga el modelo se ve lo
  de siempre; todo queda fundido por material (pocas llamadas de dibujo).

- **Invernadero por dentro en Blender** **hecho** (13 de octubre): `granja_invernadero.glb`
  (`personajes/blender/granja_invernadero.py`). `huerto-render.ts interiorInvernadero` cambia las cajas por el piso de
  baldosas de barro con el caminito de lajas y musgo, las dos camas de madera con postes y estaquitas, las paredes de
  vidrio con murito de ladrillo y arcos de hierro, el termómetro, la puerta con letrero, faroles y tapete, y lo que le
  da vida (estantes con materas y semillero, mesa de trasplantar, regadera, costales, manguera, carretilla, matas
  colgadas y helechos). `riegoInvernadero` usa el tubo de cobre con aspersores y su llavecita roja. Todo fundido por
  material.

- **Nodos de las minas en Blender** **hecho** (13 de octubre): `granja_nodos.glb` (`personajes/blender/granja_nodos.py`).
  `escenas-aventura.ts rocaNodo` usa una de tres rocas redonditas con grietas y piedritas al pie y, encima, las
  pepitas de la veta (metales, carbón, piedra y geodas) o el racimo de cristales de seis caras (gemas), pintados con el
  color de cada mineral (`materialVeta`: un material compartido por mineral; los cristales brillan un poquito).

- **Caja de envíos y casita de los compañeros en Blender** **hecho** (13 de octubre): `granja_envio.glb`
  (`personajes/blender/granja_envio.py`). `envios-render.ts` usa el cajón con zunchos, etiqueta con sello y cuerda, la
  tapa (dentro del mismo grupo `tapa_envio`, que se sigue abriendo) y la banderita que sube con carga;
  `compania-render.ts hogarMascotaVista` la casita con techo de tejas, cojín con botones, cobijita y letrero con
  huella, y el cuenco de barro con huellitas (el agua aparte, solo si está lleno).
- **Herramientas en la mano en Blender** **hecho** (13 de octubre): `granja_herramientas.glb`
  (`personajes/blender/granja_herramientas.py`, 10 piezas `h_*`). `herramientas3d.ts vestirConKit` cambia las piezas
  hechas a mano por las del kit y les pone los materiales de la calidad (los nombres `h metal`, `h filo`, `h mango`,
  `h agarre`, `h adorno` del kit se reemplazan por los de `tono(nivel)`); `avatar.ts` hace lo mismo con el cubo de
  ordeño, las tijeras y la bolsa de semillas (pasto incluido). Mientras carga el kit se ve la versión de antes.
- **Monstruos de las aventuras en Blender** **hecho** (13 de octubre): `granja_monstruos.glb`
  (`personajes/blender/granja_monstruos.py`, 11 piezas `mon_<tipo>`: gelatina, escarabajo, murciélago, guardián, ascua,
  velo nocturno, centinela y los cuatro constructos). `escenas-aventura.ts figura` cambia el cuerpo por el del kit y
  toma las patas, brazos y alas de los vacíos `miembro_<k>` (se siguen meciendo). Si el jefe tiene su arte propio,
  ese gana (`userData.arteJefe`). Los reguladores y las formas sin pieza siguen con la figura de antes.
- **Íconos 3D** **hecho** (13 de octubre): las herramientas (las 7 en sus 5 calidades, el balde y las tijeras) se
  renderizan en Blender con `personajes/blender/granja_iconos_herramientas.py -- <carpeta>` y se pasan a webp con
  `node scripts/granja-v3/iconos-blender.mjs <carpeta>`. Las máquinas, cofres, aspersores, portales, refugios, la
  caja de envíos y la casita de los compañeros se vuelven a fotografiar con `scripts/granja-v3/iconos-objetos.mjs`,
  que ahora carga los kits de Blender antes de la foto (`precargarKit`, con el cargador del juego de `recursos.ts` y
  `<base href="/">`: antes el kit no cargaba y salía la figura vieja).
- **Refugios de los animales por fuera en Blender** **hecho** (13 de octubre): `granja_refugios.glb`
  (`personajes/blender/granja_refugios.py`). `arte.ts crearRefugio` cambia las cajitas por el cuerpo (cimiento de cantos,
  paredes con juntas de tablas, postes, ventanas con cruz y jardinera, farol, pacas y costal), el techo de tejas
  gorditas con caballete, la veleta (gallito en gallineros y patos, flecha en los demás), la carita de peluche de cada
  especie en el frontón (13) y los adornos (nidales con rampa, percha del grifo, cristales de techo o de los lados,
  enredadera, halo con nubes). Las partes «ref muro/techo/madera/oscuro/borde/piedra/vidrio/metal» toman los mismos
  colores de clima y especie de antes. Todo fundido por material. Los íconos de los refugios se volvieron a fotografiar.
- **Cercas, portón, corral y pérgola en Blender** **hecho** (13 de octubre): `granja_cercas.glb`
  (`personajes/blender/granja_cercas.py`). Con el ayudante `cambiarPorKit` (`cuartos.ts`): la cerca del patio de los
  refugios (`vista.ts valla`, postes y tramos estirados), las vallas del jugador (madera con clavos y veta, pilar de
  piedras con vigas y musgo, floral con enredadera y flores), el portón (cerrado, o abierto de par en par), la puerta
  del corral (`puertaGanadoVista`, tablas con bandas, remaches y herradura), el comedero vacío o con heno
  (`comederoVista`) y la pérgola de la enredadera con su banquito.
- **Patio de los refugios, nidos, incubadora, trufas y ampliación en Blender** **hecho** (13 de octubre):
  `granja_patio.glb` (`personajes/blender/granja_patio.py`). `patioRefugio` (lajas con tierra pisada, paja, bebedero de
  piedra con agua y comedero con paja, y el maíz de los gallineros), `detalleAmpliacion` (pilares con anillos y el
  letrero colgado con sus estrellas, dorado en el nivel 3), `incubadoraVista` (lámpara, rejillas, termómetro y el huevo
  aparte), `trufaVista` y `huevosRefugio` (nido de paja trenzada y huevitos del color de la especie).
- **Piezas que se mueven en las máquinas** **hecho** (13 de octubre): `granja_movimiento.glb`
  (`personajes/blender/granja_movimiento.py`), cada pieza armada alrededor de su bisagra: rotor de la nave, brazo del
  aspersor (cobre o hierro), rodillo dentado (trituradora y recuperadoras), fuelle del alto horno, broca en espiral,
  brazo mecánico con pinza y engranajes de la ensambladora (ahora parados, giran en z), volante de la prensa,
  manivela del molino y la rueda de la recicladora. `escenas-produccion.ts figura` las cuelga de cada `movil` (en los
  aros, escaladas al radio y con el aro escondido). Íconos de esas máquinas vueltos a fotografiar.
- **Guardián del bosque antiguo** **hecho** (13 de octubre): `vista.ts monstruo` usa el Guardián de piedra de
  `granja_monstruos.glb` (la barra de vida sigue aparte).

## Datos útiles

- El Pueblo del Sol está en las coordenadas del mundo:
  - Entradas: animales (61.5,10.4); carpintería (95.5,-7.6), con la carpintera en (94.8,-5.1).
  - Ruta del Cruce: (108,29).
  - Zonas: pueblo [50,112]×[-43,44], bosque [-101,-57]×[-24,23], ancestral [-102,-55]×[52,100],
    lago [5,49]×[74,111], mina [-10,10]×[-9,9]. La granja es la unión de los `SECTORES` (x -50..50, z -40..56).
- Los nombres de las zonas están en `DESTINOS` (`vista.ts:52`) y `SALIDAS[].nombre`.
