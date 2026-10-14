# La Carrera de las Tres Lunas (carreras tipo Mario Kart)

Carreras de ocho corredores por las regiones de Astra, en carros de madera y fieltro tirados por criaturas. Es un
juego casual (no toca la historia): se juega desde el Cuarto de Juegos de la casa y también en la Sala de Juegos de los
amigos. Página: `juego/web/carreras.html`; código: `juego/web/src/carreras/`.

## Cómo se juega

- **Modos** (menú de la portada):
  - **Gran Premio**: las 4 pistas seguidas, puntos por puesto (15, 12, 10, 8, 6, 4, 2, 1), tabla después de cada
    carrera y podio de campeones al final. Ganarlo suma una copa por dificultad (se ve en la portada).
  - **Carrera suelta**: una pista, 3 vueltas, resultados y podio.
  - **Contrarreloj**: solo, sin cajas, con tres chispas de turbo al salir. Guarda el récord de cada pista, la mejor
    vuelta y un **fantasma** de la mejor carrera, que corre transparente la próxima vez.
  - **En línea**: sala de hasta 4 (código corto), carrera suelta o Gran Premio; la máquina completa los ocho.
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
- **Voces**: un presentador (bienvenida, cada pista, «¡En sus marcas!», «¡A correr!», última vuelta, ganador,
  remontada, caídas, podio, campeón, récord) y cinco frases por corredor (al salir, al adelantar, al recibir un golpe,
  al lanzar un objeto y al ganar). Javier y Laura con sus voces clonadas (solo en la versión de la pareja; con amigos
  en la sala se callan). Todo sale también escrito en un globito abajo.
- Calidad que baja sola (mide el tiempo de cada cuadro), 30 cuadros por segundo, el contexto WebGL se suelta al salir.
  Música de las pistas existentes (`PISTAS[...].musica` en `datos.ts`).

Los tiempos aún no logrados se recuperan como `Infinity` al leer el `null` que deja JSON: una vuelta previa ya no
bloquea el primer contrarreloj ni muestra un récord falso de cero. La marca válida, la mejor vuelta, el fantasma y
las copas anteriores se conservan. Si falla una escritura, la carrera mantiene la copia pendiente y permite
reintentar antes de avanzar, repetir o salir; el avance automático del podio también comprueba el guardado.
La capa transparente del mando no tapa el botón de pausa. Los fallos pendientes requieren mantener la partida
abierta: no está cubierto un cierre forzado mientras no se puede escribir.

## Archivos

| Archivo | Qué es |
|---|---|
| `src/carreras/main.ts` | Flujo: portada, garaje, pistas, la carrera (bucle a 60 pasos y dibujo a 30), resultados, podio, Gran Premio, contrarreloj, fotos del menú |
| `src/carreras/sim.ts` | La física y las reglas (sin three.js): carros, derrape, saltos, rebufo, choques, cajas, objetos, vueltas, puestos y la máquina |
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
| `personajes/blender/carreras_pistas.py` | Las 4 pistas: curva → modelo (`carreras_<id>.glb`) y recorrido (`carreras_<id>.json`) |
| `personajes/blender/carreras_iconos.py` | Íconos de los objetos (`public/carreras/iconos/`) y hoja de revisión |
| `scripts/carreras/voces.mjs` | Las voces con ElevenLabs (`public/audio/carreras/`, las de la pareja en `public/audio/carreras-pareja/`) |
| `scripts/carreras/fotos.mjs` | Las fotos de las tarjetas del menú (`public/carreras/pistas/`, `public/carreras/criaturas/`) |

Las criaturas unicornio, grifo y dragón son las de la granja (`public/modelos/granja-v3/*_lod.glb`, con su animación
`caminar`); la cría, el zorro y el carnero salen de `carreras_cosas.glb` y el juego les mueve patas, cabeza y cola.

### Rehacer los modelos

```bash
cd personajes/blender
blender -b -P carreras_cosas.py -- ../../juego/web/modelos-crudos/carreras
blender -b -P carreras_pistas.py -- ../../juego/web/modelos-crudos/carreras [valle,brasa,nieve,cielo] [--plano]
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
- Gran Premio en línea: el anfitrión arma la siguiente pista (`sig`). Si alguien se va, su carro lo maneja la máquina.
- Con amigos en la sala, la máquina corre solo con vecinos y no suena ninguna voz de la pareja.

## Cómo se prueba

- `carreras.html?rol=el` (o `ella`): el menú. `?pista=valle` entra directo a una carrera suelta (`&crono`: contrarreloj).
- `?bot=1`: la máquina maneja el carro de quien juega (la cámara lo sigue). `?vueltas=1`, `?rapido=4` (la física corre
  más rápido), `?sinprecalentar` (no compila los sombreadores antes: el Chromium de pruebas tarda mucho).
- `?podio`: muestra el podio. `?postal=<pista>` y `?retrato=<criatura>`: las fotos del menú.
- `?salas=local&sala` en dos pestañas (la segunda con `?salas=local&unirse=CÓDIGO`): en línea sin Supabase.
- Gancho: `window.__carreras` = `{ sim, vista, hud, mio }`.
- `window.__carreras.avanzar(n)` ejecuta el mismo cuadro del juego, con física, eventos, guardado de vueltas y
  muestras del fantasma; no entrega objetos ni fuerza resultados. Las pruebas desactivan el dibujo entre capturas.
- Versión para amigos: `npm run build:amigos && node scripts/verificar-amigos.mjs`.

```sh
node scripts/probar-carreras-motor.mjs        # cuatro pistas, tres vueltas, puestos y puntos del Gran Premio
node scripts/probar-carreras-guardado.mjs     # seis regresiones: null antiguo, récord, fantasma y copa pendiente
CHROME_PATH=/usr/bin/chromium FALLOS=1 node scripts/probar-carreras-recorrido.mjs http://127.0.0.1:4184/ test-results/carreras-amigos
CHROME_PATH=/usr/bin/chromium AMIGO=0 GRAN_PREMIO=0 FALLOS=1 node scripts/probar-carreras-recorrido.mjs http://127.0.0.1:4182/ test-results/carreras-casa
```

Verificados desde progreso nuevo: carrera suelta, pausa por botón, contrarreloj después de recargar, fantasma con
muestras para su duración, y Gran Premio de cuatro pistas en «Carrera», con copa ganada, dos fallos de guardado
recuperados y recarga sin duplicar el premio. Carrera, contrarreloj, fallo de escritura y retorno a casa también
comprobados en la edición de pareja. Siguen pendientes precisión física, repetición del fantasma en pantalla y
verificación propia de la red. Se conservan los valores de dificultad y recompensas.

## Integración (hecha el 14 de octubre de 2026: casa, Sala de Juegos con su arte y su tema `carreras`)

### Lo que se había propuesto

**Cuarto de juegos de la casa** (`src/casa/main.ts`):

```ts
// en JUEGOS
carreras: { punto: 'arcade', url: './carreras.html', nombre: 'La Carrera de las Tres Lunas' },
// en case 'juegos': (con los demás botones)
{ id: 'jugar-carreras', texto: 'Carrera de las Tres Lunas', icono: '<span class="ico ico-emoji">🏁</span>' },
```

y donde se atienden los `jugar-…` (junto a `jugar-sangre`): `case 'jugar-carreras': return jugar('carreras');`.

**Sala de juegos de amigos** (`src/amigos/juegos.ts`, en `JUEGOS`; el tema puede ser `'retrete'` mientras no haya uno
propio):

```ts
{ id: 'carreras', nombre: 'La Carrera de las Tres Lunas', desc: 'Carros y criaturas por Astra · de 1 a 4', arte: ARTE_RETRETE,
  tema: 'retrete', url: './carreras.html', sala: 'carreras',
  urlCrear: './carreras.html?sala', urlUnirse: (c) => `./carreras.html?unirse=${encodeURIComponent(c)}` },
```

Ya está hecho en esta rama: `carreras.html` en el `input` de rollup, en `PAGINAS_AMIGOS`, `src/carreras/` en
`PERMITIDOS_AMIGOS`, la sustitución de `src/carreras/pareja.ts` en `SUSTITUTOS` y en `PUBLICOS_AMIGOS` los modelos
(`modelos/carreras/`, las tres criaturas de la granja), `carreras/` (íconos y fotos) y `audio/carreras/` (sin la
pareja). La música usa pistas que la app de amigos ya trae (súper, lavado, retrete, mesa, cocina).

## Pendiente o por mejorar

- Una tarjeta propia para la sala de amigos (arte SVG de la carrera) y un ícono propio en el cuarto de juegos.
- Más pistas (Piedralumbre, Puerto de los Lirios) reutilizando `carreras_pistas.py`.
