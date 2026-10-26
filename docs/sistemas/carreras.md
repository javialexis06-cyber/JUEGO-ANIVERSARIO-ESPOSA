# La Carrera de las Tres Lunas (carreras tipo Mario Kart)

Carreras de ocho corredores por las regiones de Astra, en carros de madera y fieltro tirados por criaturas. Es un
juego casual (no toca la historia): se juega desde el Cuarto de Juegos de la casa y también en la Sala de Juegos de los
amigos. Página: `juego/web/carreras.html`; código: `juego/web/src/carreras/`.

## Cómo se juega

- **Modos** (menú de la portada):
  - **Gran Premio**: cuatro copas de cuatro pistas, puntos por puesto (15, 12, 10, 8, 6, 4, 2, 1), tabla después de cada
    carrera y podio de campeones al final. Ganarlo suma una copa por dificultad y una victoria en esa copa. Las copas
    anteriores se atribuyen a la clásica, conservando el total y las marcas.
  - **Carrera suelta**: una pista, 3 vueltas, resultados y podio.
  - **Contrarreloj**: solo, sin cajas, con tres chispas de turbo al salir. Guarda el récord de cada pista, la mejor
    vuelta y un **fantasma** de la mejor carrera, que corre transparente la próxima vez.
  - **En línea**: sala de hasta 4 (código corto), carrera suelta en cualquiera de los 16 circuitos o una de las cuatro
    copas o los cuatro desafíos; la máquina completa los ocho.
  - **Batallas y desafíos**: cuatro minijuegos locales o de sala, con rivales de la máquina hasta completar ocho; partidas de uno, dos o tres
    minutos, tabla y podio. Las marcas se guardan por modo, escenario, dificultad y duración. No dan monedas de la casa.
- **Quién corre**: en la versión de la pareja, Javier o Laura (quien juega) y el otro como rival de la máquina, más
  seis vecinos de Astra. Con amigos (o en la app de amigos), el muñeco de perfil del amigo y siete vecinos.
- **Garaje** («Mi carro y criatura»): criatura (cambia velocidad, aceleración, manejo y peso), carro y color. El carro
  da vueltas en su tapete a la derecha del menú.
- **Manejo**: acelerar solo (por defecto en el celular) o con botón; girar con el joystick transparente de abajo a la
  izquierda; **derrape** (botón grande a la derecha, o espacio) con mini-turbo según el tiempo derrapando (chispas
  blancas → azules → naranjas → rosadas de Aura); el mismo botón en el aire después de una rampa o de la pluma hace un
  **truco** que da turbo al aterrizar. **Rebufo**: ir pegado detrás de otro un segundo da un turbo corto. **Turbo de
  salida**: acelerar justo en el «¡dos!» de la cuenta regresiva. Teclado: flechas o WASD, espacio, X / E / Shift para el
  objeto, P para pausar.
- **Objetos** (cajas de felpa con el emblema de las tres lunas; los de atrás reciben mejores, `pesosObjeto` en
  `datos.ts`): Chispa de Aura (turbo), Tres chispas, Semilla de Celia (enredadera en la pista; atrás o lanzada adelante
  con el joystick arriba), Velo de Lara (invisible: nada te toca y el pasto no frena), Ceniza de Nath'Gora (charco
  resbaloso), Pluma de grifo (salto enorme), Lluvia de Celia (moja y frena a todos los de adelante), Lucero de Aurelia
  (persigue al de adelante) y Brasa de dragón (va derecho y rebota en las barandas; con el joystick abajo, hacia atrás).
- **Pistas** (≈ 30 s por vuelta): Camino del Pueblo del Sol (valle de Celia: trigales, girasoles, molino, casitas,
  río con puente, gradas con público), Hornos de Brasaviva (lava a la orilla: caerse es volver con un grifo; hornos,
  cristales, volcán), Pista de Nieveclara (pinos, muñecos de nieve, arcos de hielo y el lago que resbala) y Anillos de
  las Tres Lunas (cinta flotante entre Aurelia, Nocturna y Esmeralda, sin baranda en las rectas, anillos de turbo).
- **Voces**: un presentador (bienvenida, las cuatro pistas clásicas, «¡En sus marcas!», «¡A correr!», última vuelta, ganador,
  remontada, caídas, podio, campeón, récord) y cinco frases por corredor (al salir, al adelantar, al recibir un golpe,
  al lanzar un objeto y al ganar). Javier y Laura con sus voces clonadas (solo en la versión de la pareja; con amigos
  en la sala se callan). Todo sale también escrito en un globito abajo.
- Calidad que baja sola (mide el tiempo de cada cuadro), 30 cuadros por segundo, el contexto WebGL se suelta al salir.
  Música propia (26 de octubre de 2026): el garaje, una por circuito y el podio (`carreras-*`, ver `musica.md`).
- **Rocola** (botón 🎵 en la portada, `src/carreras/rocola.ts`): todas las canciones de la app (en la versión de la
  pareja, también las de amor) para oírlas en orden, al azar o desde una; mientras está encendida suenan en las
  carreras en vez de la música de cada circuito. Se recuerda en el aparato.

Los tiempos aún no logrados se recuperan como `Infinity` al leer el `null` que deja JSON: una vuelta previa ya no
bloquea el primer contrarreloj ni muestra un récord falso de cero. La marca válida, la mejor vuelta, el fantasma y
las copas anteriores se conservan. Si falla una escritura, la carrera mantiene la copia pendiente y permite
reintentar antes de avanzar, repetir o salir; el avance automático del podio también comprueba el guardado.
La capa transparente del mando no tapa el botón de pausa. Los fallos pendientes requieren mantener la partida
abierta: no está cubierto un cierre forzado mientras no se puede escribir.

## Circuitos y desafíos añadidos (15 de octubre de 2026)

Son **16 circuitos originales**, organizados así. Las cuatro pistas clásicas conservan sus modelos, recorridos,
objetos, tres vueltas y valores de dificultad. Ningún mapa ni recurso de Nintendo se descarga ni se distribuye.

| Copa | Circuitos |
|---|---|
| Tres Lunas (clásica) | Camino del Pueblo del Sol · Hornos de Brasaviva · Pista de Nieveclara · Anillos de las Tres Lunas |
| Senderos | Senderos de Brumaverde · Muelle de los Lirios · Jardines del Eco · Mercado de Vigilia |
| Horizontes | Dunas de Ambarina · Galerías de Piedralumbre · Pasarelas de Senda · Murallas de Valdemora |
| Firmamento | Espiras de Iridalia · Cornisas del Viento · Balizas de Nocturna · Órbita de Celia |

Hay curvas, cambios de altura, rampas, puentes y tramos flotantes; cada región trae utilería de Blender y postal
propia. Cornisas mantiene las montañas fuera del recorrido y la cámara; Piedralumbre incluye una galería techada.
Las arenas Plaza de los Molinos, Patio de los Hornos y Patio de Cristales tienen piso libre, valla y obstáculos reales;
el minimapa representa sus colisiones, en vez de dibujar un circuito ficticio.

- **Batalla de globos:** tres por corredor; los impactos de objetos los revientan. Se ordena por
  globos conservados y globos reventados a rivales; se acaba al agotarse el reloj o quedar uno. Quien pierde los tres
  pasa a observar a un corredor vivo. El kart eliminado no recoge cajas ni sigue chocando como participante activo.
- **Caza de monedas:** 36 monedas repartidas por la arena; vuelven a aparecer después de recogerse. Cada golpe suelta
  hasta tres de las acumuladas. Las monedas soltadas se pueden recuperar y caducan; no se reproducen indefinidamente.
- **Carrera de anillos:** 20 aros con distintos laterales por circuito. Cada corredor puede puntuar una vez por aro
  y vuelta; los de los demás permanecen disponibles. La prueba se rige por el reloj, sin detenerse a la tercera vuelta.
- **Festival de trucos:** tres puntos por truco aterrizado y el nivel de chispas al soltar un miniturbo. Sigue el
  reloj y conserva rampas y derrape reales; no puntúa por solo tocar el botón ni por recoger un turbo de pista.

Los bots buscan cajas, rivales y monedas, esquivan obstáculos de las arenas y apuntan a los aros en los circuitos.
Las reglas nuevas usan `Sim`, sus objetos y su movimiento; no hay un motor físico separado. Las marcas y copas se
mantienen pendientes ante un fallo de escritura, con reintento antes de repetir o salir.

Referencia de mecánicas: las [batallas de Mario Kart Tour](https://faq.mariokarttour.com/hc/en-us/articles/11021845024921-How-do-battles-work)
y su [clasificación](https://faq.mariokarttour.com/hc/en-us/articles/11035214624153-How-is-placement-decided-in-battles).
La competición por puntos, globos y pruebas de monedas/anillos/trucos se adapta a las criaturas, objetos y regiones
propias de Astra; no se anuncia paridad completa con Mario Kart.

## Archivos

| Archivo | Qué es |
|---|---|
| `src/carreras/main.ts` | Flujo: portada, garaje, pistas, la carrera (bucle a 60 pasos y dibujo a 30), resultados, podio, Gran Premio, contrarreloj, fotos del menú |
| `src/carreras/sim.ts` | La física y las reglas (sin three.js): carros, derrape, saltos, rebufo, choques, cajas, objetos, vueltas, puestos y la máquina |
| `src/carreras/minijuegos.ts` | Batallas, recogibles, clasificación, reloj y decisiones de la máquina en las arenas; comparte la física de `Sim` |
| `src/carreras/progreso.ts` | Lectura compatible de récords y copas, y confirmación de escrituras pendientes |
| `src/carreras/pista.ts` | El recorrido (una muestra por metro): dónde va cada carro, el lateral, la altura del piso |
| `src/carreras/vista.ts` | three.js: la pista juntada por material, el cielo, los carros, cajas y objetos, partículas, cámara, podio, garaje, fantasma |
| `src/carreras/kart3d.ts` | Un corredor en 3D: carro pintado con su color, criatura que galopa y el muñeco (`Personaje` + `Vestidor`) sentado con caras |
| `src/carreras/efectos.ts` | Partículas en una sola malla con instancias |
| `src/carreras/hud.ts`, `mando.ts` | El HUD (puesto, vuelta, tiempo, objeto con ruleta, minimapa, tabla, avisos, globito) y los controles |
| `src/carreras/sonidos.ts` | Efectos (sintetizados y `public/sfx`), galope y voces con su índice |
| `src/carreras/red.ts` | En línea por sala (ver abajo) |
| `src/carreras/datos.ts`, `frases.ts` | Criaturas, carros, vecinos, objetos, pistas, puntos y frases del presentador y los vecinos |
| `src/carreras/pareja.ts` | Javier y Laura como corredores y sus frases (versión vacía: `src/amigos/sin_pareja/carreras.ts`) |
| `personajes/blender/carreras_comun.py` | Herramientas (juntar por material, emblema de las tres lunas, letras) |
| `personajes/blender/carreras_cosas.py` | Carros (carreta, calesa, cesta, calabaza), zorro de Brasaviva, carnero de Nieveclara, cría, caja de objetos, objetos, turbo, rampa, podio, copa y tapete del garaje → `carreras_cosas.glb` |
| `personajes/blender/carreras_pistas.py` | Exportador de circuitos: curva → modelo (`carreras_<id>.glb`) y recorrido (`carreras_<id>.json`) |
| `personajes/blender/carreras_circuitos.py` | Doce recorridos nuevos y utilería de sus regiones: puestos, barcas, palmas, galerías, torres y observatorios |
| `personajes/blender/carreras_arenas.py` | Tres arenas con colisiones exportadas, globos, monedas y aros → `carreras_minijuegos.glb` |
| `personajes/blender/carreras_iconos.py` | Íconos de los objetos (`public/carreras/iconos/`) y hoja de revisión |
| `scripts/carreras/voces.mjs` | Las voces con ElevenLabs (`public/audio/carreras/`, las de la pareja en `public/audio/carreras-pareja/`) |
| `scripts/carreras/fotos.mjs` | Las fotos de las tarjetas del menú (`public/carreras/pistas/`, `public/carreras/criaturas/`) |

Las criaturas unicornio, grifo y dragón son las de la granja (`public/modelos/granja-v3/*_lod.glb`, con su animación
`caminar`); la cría, el zorro y el carnero salen de `carreras_cosas.glb` y el juego les mueve patas, cabeza y cola.

### Rehacer los modelos

```bash
cd personajes/blender
blender -b -P carreras_cosas.py -- ../../juego/web/modelos-crudos/carreras
blender -b --threads 2 --python-exit-code 1 -P carreras_pistas.py -- ../../juego/web/modelos-crudos/carreras puerto,mina,bosque,desierto,jardines,cristal,fortaleza,pantano,mercado,acantilado,observatorio,estacion --plano
blender -b --threads 2 --python-exit-code 1 -P carreras_arenas.py -- ../../juego/web/modelos-crudos/carreras
blender -b -P carreras_iconos.py -- iconos ../../juego/web/public/carreras/iconos
cd ../../juego/web
for f in modelos-crudos/carreras/*.glb; do npx gltf-transform optimize $f public/modelos/carreras/$(basename $f) --compress meshopt \
  --flatten false --instance false --palette false --texture-compress false --prune false --simplify true --join false \
  --simplify-ratio 0 --simplify-error 0.0008; done
cp modelos-crudos/carreras/carreras_*.json public/modelos/carreras/
```

(`--plano` dibuja el plano de cada pista en `_plano_<id>.png` para revisar curvas, cajas y turbos.)

### Voces

```bash
SECO=1 node scripts/carreras/voces.mjs     # cuenta lo que falta
node scripts/carreras/voces.mjs            # genera (TOPE=5000 caracteres)
```

Presentador: «Zabra» de la biblioteca (`voces-guion/carreras-reparto.json`); los vecinos usan su voz de la granja
(`astra-reparto.json`); Javier y Laura, las clonadas «EL» y «ELLA». Primera tanda: 64 líneas, **2.577 caracteres**.

## En línea (`red.ts`)

- Cada aparato mueve SU carro y manda cómo va 15 veces por segundo (`k`); el anfitrión mueve la máquina, las cajas y
  lo que hay en la pista y manda la foto (`f`).
- El anfitrión decide las cajas (`obj`), los golpes (`golpe`) y la lluvia (`moja`) y se los avisa al dueño del carro;
  quien usa un objeto se lo cuenta al anfitrión (`usa`), que lo lanza desde donde va ese carro.
- Antes de la salida todos esperan a que todos carguen (`cargado` → `arranca`, máximo 30 s).
- Meta: cada uno avisa su tiempo (`meta`); cuando llegan todas las personas, el anfitrión cierra (`fin`).
- Gran Premio en línea: el anfitrión escoge la copa en la sala y arma cada siguiente pista (`sig`). La victoria final
  registra esa copa para el ganador humano bajo la dificultad del anfitrión. Los ocho inscritos se conservan
  durante las cuatro carreras; si alguien se va, su carro lo maneja la máquina.
- Con amigos en la sala, la máquina corre solo con vecinos y no suena ninguna voz de la pareja.

## Cómo se prueba

- `carreras.html?rol=el` (o `ella`): el menú. `?pista=valle` entra directo a una carrera suelta (`&crono`: contrarreloj).
- `?bot=1`: la máquina maneja el carro de quien juega (la cámara lo sigue). `?vueltas=1`, `?rapido=4` (la física corre
  más rápido), `?sinprecalentar` (no compila los sombreadores antes: el Chromium de pruebas tarda mucho).
- `?mini=globos&pista=arena_plaza&duracion=120` (también `monedas`, `anillos`, `trucos`): entrada directa al desafío.
- `?podio`: muestra el podio. `?postal=<pista>` y `?retrato=<criatura>`: las fotos del menú.
- `?salas=local&sala` en dos pestañas (la segunda con `?salas=local&unirse=CÓDIGO`): en línea sin Supabase.
- Gancho: `window.__carreras` = `{ sim, vista, hud, mio }`.
- `window.__carreras.avanzar(n)` ejecuta el mismo cuadro del juego, con física, eventos, guardado de vueltas y
  muestras del fantasma; no entrega objetos ni fuerza resultados. Las pruebas desactivan el dibujo entre capturas.
- Versión para amigos: `npm run build:amigos` (incluye el filtro de contenido).

```sh
node scripts/probar-carreras-motor.mjs        # cuatro pistas, tres vueltas, puestos y puntos del Gran Premio
node scripts/probar-carreras-guardado.mjs     # ocho grupos: compatibilidad, fantasma, copa pendiente, campeonatos y desafíos
node scripts/probar-carreras-variedad.mjs    # 96 carreras y 38 desafíos completos, tiempos clásicos idénticos
CHROME_PATH=/usr/bin/chromium node scripts/probar-carreras-ampliacion.mjs http://127.0.0.1:4184/ test-results/carreras-ampliacion
CHROME_PATH=/usr/bin/chromium node scripts/probar-carreras-linea.mjs http://127.0.0.1:4182/ test-results/carreras-linea
CHROME_PATH=/usr/bin/chromium FALLOS=1 node scripts/probar-carreras-recorrido.mjs http://127.0.0.1:4184/ test-results/carreras-amigos
CHROME_PATH=/usr/bin/chromium AMIGO=0 GRAN_PREMIO=0 FALLOS=1 node scripts/probar-carreras-recorrido.mjs http://127.0.0.1:4182/ test-results/carreras-casa
```

Verificados desde progreso nuevo: carrera suelta, pausa por botón, contrarreloj después de recargar, fantasma con
muestras para su duración, y Gran Premio de cuatro pistas en «Carrera», con copa ganada, dos fallos de guardado
recuperados y recarga sin duplicar el premio. Carrera, contrarreloj, fallo de escritura y retorno a casa también
comprobados en la edición de pareja. Estas pruebas no certifican controles físicos ni la repetición visual del
fantasma; Javier descartó ampliar esa cobertura. La verificación de red se detalla abajo. Se conservan los valores
de dificultad y recompensas.

Comprobación de la ampliación: 96 carreras completas (16 circuitos × tres dificultades × dos semillas) y 38
minijuegos completos del motor. Los cuatro tiempos clásicos de referencia permanecen idénticos. El navegador de
amigos completa las tres copas nuevas y ocho desafíos con resultados, un fallo de guardado recuperado, podios y
recarga. Dos pestañas completan la Copa de los Senderos con la misma plantilla de ocho corredores, clasificaciones
idénticas en las cuatro carreras, el mismo podio y retorno a sala. Se usa el transporte local real de salas y el
reloj acelerado ×4; no se inyectan posiciones ni se fuerzan victorias. Capturas inspeccionadas de los doce circuitos
nuevos y los cuatro modos. La pareja completa los cuatro desafíos en el build final; se verifica teclado y joystick
por puntero en arena sin piloto automático. Se repiten carrera suelta y contrarreloj con escritura fallida recuperada
y fantasma conservado. Evidencia local: `test-results/carreras-ampliacion-2026-10-15/`.

## Integración

El cuarto de juegos usa `jugar-carreras` en `src/casa/main.ts` y el emblema propio descrito abajo. La tarjeta de
amigos está en `src/amigos/juegos.ts`, con arte `ARTE_CARRERAS`, tema `carreras` y accesos para crear o unirse a sala.

`carreras.html` está en el `input` de rollup, en `PAGINAS_AMIGOS`, `src/carreras/` en
`PERMITIDOS_AMIGOS`, la sustitución de `src/carreras/pareja.ts` en `SUSTITUTOS` y en `PUBLICOS_AMIGOS` los modelos
(`modelos/carreras/`, las tres criaturas de la granja), `carreras/` (íconos y fotos) y `audio/carreras/` (sin la
pareja). La música propia (`carreras-*`) va también en la de amigos, y su rocola solo lista lo que esa versión trae.

## Desafíos en sala e icono · 16 de octubre de 2026

En «En línea» → «Crear sala · Batallas y desafíos», el anfitrión elige Globos, Monedas, Anillos o Trucos,
escenario compatible y duración de uno, dos o tres minutos. Las opciones aparecen también en el invitado.
Las salas conservan de uno a cuatro jugadores y la máquina completa los ocho; las reglas y presupuestos de
los modos locales se conservan. El icono del cuarto usa `public/carreras/emblema.svg`, con carro, bandera y tres lunas.

El anfitrión confirma globos, puntos, monedas/aros disponibles y clasificación. El invitado conserva el mando
inmediato de su carro; sus aterrizajes y miniturbos se entregan una vez al anfitrión con las mismas reglas de puntos.
Fotos antiguas o de otra partida se descartan y el estado final viaja de forma fiable, con puntos, tiempos y orden juntos.
El cierre de las carreras clásicas también espera la confirmación final: el invitado ya no presenta tiempos
redondeados de una foto anterior mientras llega la clasificación definitiva.
Las marcas de sala usan el prefijo `sala:` y no sustituyen las locales; cada perfil conserva su puntuación y el
resultado espera la confirmación del guardado antes de seguir. No se añaden monedas de casa ni cambios de dificultad.

`probar-carreras-red.mjs` completa los cuatro modos con dos y cuatro jugadores, demora, pérdida de fotos y
reenvío de maniobras. Añade dos carreras clásicas de regresión y comprueba finales idénticos, puntos únicos y
retirada de receptores. El recorrido de interfaz está en `probar-carreras-desafios-linea.mjs`; usa contextos aislados
y Supabase simulado.

La compilación de amigos conserva arte propio (`ARTE_CARRERAS`) y excluye el contenido de pareja. Las pruebas
físicas y el servicio real permanecen fuera del encargo por decisión de Javier.
