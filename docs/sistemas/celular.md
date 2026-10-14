# Desaparecidos de Astra (el juego del celular encontrado)

Minijuego de detective del capítulo 6 de [`en-obra/pelicula-de-astra.md`](../en-obra/pelicula-de-astra.md). En la
**mesa de los perdidos de Vigilia**, Ulises (el cartógrafo) recibe teléfonos encontrados en distintos lugares de Astra.
El jugador abre cada teléfono, revisa todo lo que tiene adentro y deduce qué le pasó a su dueño y dónde está.

- **Ocho casos completos**, que se desbloquean en orden; el primero es el tutorial (Ulises va guiando con globos).
- **Nunca la desaparecida es Laura** y ningún caso habla de la pareja: el juego es el mismo para la casa y para la
  Sala de Juegos de los amigos (`verificar-amigos` lo revisa).
- Se juega en horizontal: el teléfono grande a la izquierda (en horizontal, como en la mano) y la **libreta del
  detective** a la derecha, donde las pistas se anotan solas al encontrarlas.

## Cómo se juega

1. **La mesa**: ocho carpetas (foto del desaparecido, lugar, estado y estrellas). Al tocar una sale el **expediente**
   de Ulises (quién es, qué se sabe, dónde apareció el teléfono y la primera pista para abrirlo).
2. **El teléfono**: pantalla de bloqueo con sus avisos y un **candado** (PIN, patrón o palabra) con el recordatorio que
   dejó el dueño. Adentro, las apps: Mensajes (chats con varias personas, grupos, fotos y notas de voz), Fotos
   (galería con álbum con candado), Notas (algunas protegidas), Grabadora (las propias y las recibidas), Teléfono
   (llamadas perdidas y grabaciones de buzón), Mapa (lugares guardados de Astra), Correo/Bitácora, Calendario,
   **Linterna** (aclara las fotos tomadas a oscuras) y, en Iridalia, **Señas de luz**.
3. **Cada teléfono tiene personalidad**: carcasa (rota, antigolpes con tornillos, de flores, de cristal, de estrellas,
   de traje espacial), color de acento, tema claro u oscuro, letra propia, operador, batería y fondo de pantalla.
4. **Pistas**: al abrir un chat, una foto, una nota, un lugar del mapa o al oír una nota de voz se anota la pista en la
   libreta (un papelito vuela a la libreta; los **giros** salen destacados). Las importantes se cuentan arriba.
5. **Resolver**: con todas las pistas importantes, el botón se enciende y salen 2 o 3 preguntas de opción múltiple
   (qué pasó, dónde está, por qué). Una respuesta equivocada resta una estrella.
6. **Ayuda**: según la etapa (abrir el teléfono, abrir un candado de adentro o resolver), tres ayudas que se destapan
   de a una; la última da la respuesta y cuesta una estrella. Estrellas = 3 − errores − respuestas reveladas (mínimo 1).
7. **El final**: escena corta a pantalla completa con franjas de cine, tres fotos con movimiento, subtítulos y las
   voces de los personajes, el sello «Caso cerrado», las estrellas y el siguiente caso.

Progreso en el aparato (`localStorage['celular-astra-v1']`): por caso, si recibió el teléfono, candados abiertos,
pistas, ayudas, errores, estrellas y pasos del tutorial. Música: la pista de misterio `mesa-clue` (baja cuando habla
una voz); botón para apagarla en la mesa. Atrás de Android / Esc: cierra lo abierto, luego vuelve a la mesa y después
sale (a `amigos.html` en modo amigo o a la casa, con `volverALaSala` de `src/sueltos/comun.ts`).

## Los ocho casos (con su solución)

| # | Caso | Lugar | Candados | Giro | Solución |
|---|---|---|---|---|---|
| 1 | **La noche del pacto** (tutorial) | Valdemora (AV 301) → Vigilia | PIN `0301` (el año); notas privadas `celina` (la abuela, en el chat de mamá) | Marcela iba a cambiarse el nombre por el de su abuela | El Conde bebió ceniza en su copa vieja sin adornos (la de cuando comía en la cocina) y aceptó «una noche que no termina»; Marcela huyó por el túnel de la leña y vive en Vigilia como **Celina**, amasando en el comedor de Brígida. Final: su mamá salió con los últimos liberados. |
| 2 | **El faro que no encendió** | Puerto de los Lirios | Patrón `L` (1-4-7-8-9); bitácora `garza` (su barquita) | No lo prendió a propósito: la crecida corrió el banco de arena justo al haz de la luz | Don Abundio (tío de Julián) salió solo en La Garza con un farol a buscar la barca 7 de los Quintero; están en la **choza de las eras de sal de Genaro**. |
| 3 | **La cota tres** | Piedralumbre | Palabra `candela` (la brigada de su papá, AV 281); álbum PIN `3141` (los golpes por noche) | Los golpes eran de una dragona de Celia y su cría (foto oscura: con linterna se ve el ojo) | Rosalba se torció el tobillo y se le vino el techo detrás; está en la **cámara tibia del fondo**, cuidada por los dragones. |
| 4 | **La niña del Eco** | Jardines del Eco (Verdia) | Patrón `Z` (1-2-3-5-7-8-9); partitura `sol` (la campana de Casiano) | Sus mensajes, fotos y notas de voz son idénticos día tras día | El seto en zigzag es un **laberinto viejo de Vael'Thor** que repite la misma tarde; se rompe cantándole un final distinto de la canción para que Abril responda algo suyo. |
| 5 | **El astrónomo de Nocturna** | Vigía de Nocturna | PIN `1207` (su estrella); bitácora `andariega` (el nombre de los niños de Celestina) | La «estrella que camina» es una **astilla de estrella muerta** que suelta ceniza y mancha a Nocturna | Era noche de tránsito: Teófilo mandó el carro de vuelta y se quedó en el **refugio de la baliza 7**, prendiendo a mano las balizas para que las almas no se perdieran. |
| 6 | **La ruta del carro de agua** | Ambarina | PIN `0412` (su cupo); cuaderno `aljibe` (como lo llamaban los viejos, dice Kenzo) | El agua intacta quiere decir que **encontró otra agua** | Simón está en las **ruinas de la terraza 9** midiendo un aljibe antiguo; no avisó porque el pacto de Ambarina prohíbe prometer agua sin medir. |
| 7 | **Un concierto que se vea** | Iridalia | Patrón `N` (7-4-1-5-9-6-3); señas de luz `geoda` | La advertencia de Orin llegó en nota de voz y la transcripción le quitó el «no» (Ximena es sorda) | Ximena está en la **Gran Geoda** bajo el escenario, con la entrada cerrada; pidió ayuda prendiendo los cristales del valle con el código de Maia: verde-ámbar-azul-rojo-violeta = G-E-O-D-A. Se resuelve con lo que se ve. |
| 8 | **El último turno** | Estación sobre Celia | PIN `1607` (traje 16, sector 07); cámaras `308` (fundación de la estación) | Joaquín llenaba la bitácora **antes** de salir (todas dicen 03:12) | La esclusa del 7 se trabó; caminó por el casco hasta la **cúpula del invernadero**, sellada por fumigación y con las cámaras apagadas. Final: lo encuentran dormido entre las matas. |

Coherencia con el lore: el caso 1 es la noche de SC0 contada desde la cocina (la copa sin adornos de
`narrativa/02-campana.md`) y Marcela sobrevive en Vigilia (que recibió refugiados en AV 303); el 3 respeta que proteger
no es consumir (los dragones cuidan); el 4 usa la debilidad de Vael'Thor (respuestas libres desajustan sus moldes) y la
ruta deformada de AV 268; el 5, que Nocturna orienta el tránsito de Senda a Verdia y la luna manchada de ceniza; el 6, el
pacto de Ambarina; el 7, que Iridalia escucha de muchas maneras (Maia y sus señales de luz, Nahuel intérprete); el 8,
la estación de Helena (AV 308). Los vecinos que salen (Julián, Olga, Carmela, Genaro, Eloy, Úrsula, Petra, Amparo,
Hugo, Sora, Esteban, Casiano, Gregoria, Iria, Naim, Matea, Bernardo, Celestina, Gaspar, Ezequiel, Kenzo, Zora,
Samira, Rocío, Maia, Nahuel, Orin, Mauro, Calista, Helena, Boris, Valentina, Said, Rita y Ulises) son los de
`granja-v3/astra-mundo-datos.ts`, con su oficio. Los desaparecidos y su familia son personajes nuevos.

## Archivos

| Qué | Dónde |
|---|---|
| Página | `juego/web/celular.html` (`<meta name="apto-amigos" content="si">`) |
| Flujo: mesa, expediente, libreta, ayudas, resolver, final, tutorial | `src/celular/main.ts` |
| El teléfono y sus apps | `src/celular/telefono.ts` |
| Candados (PIN, patrón, palabra con teclado propio) | `src/celular/candado.ts` |
| Íconos SVG y colores de las apps | `src/celular/iconos.ts` |
| Voces, música y efectos | `src/celular/audio.ts` |
| Progreso | `src/celular/progreso.ts` |
| Tipos de los datos | `src/celular/tipos.ts` |
| Los ocho casos | `src/celular/casos/c1-pacto.ts` … `c8-estacion.ts` (+ `index.ts`) |
| Estilos | `src/celular/celular.css` |
| Fotos (106 JPG, 800×450 y retratos de 240×240) | `public/celular/fotos/` |
| Notas de voz (56, Opus) e índice | `public/audio/celular/*.ogg`, `public/audio/celular/voces.json` |
| Escenarios de las fotos | `scripts/celular/fotos-escenas.ts` (kits `granja_*.glb`, `sangre/bioma_*.glb`, dragón, muñecos de peluche) |
| Sacar las fotos | `node scripts/celular/fotos.mjs c1 [escenario]` (servidor de Vite en `PUERTO`, por defecto 5193; `SALIDA=` para probar) |
| Voces | `node scripts/celular/voces.mjs reparto` y `node scripts/celular/voces.mjs` (`SECO=1` cuenta sin gastar); reparto en `voces-guion/celular-reparto.json` |

**Voces**: 56 notas, **7.031 caracteres** de ElevenLabs (tope del juego: 9.000; el script no deja pasarlo), modelo
`eleven_v4` con acotaciones en inglés entre corchetes, una voz distinta de la biblioteca por personaje (latinas, nunca
las clonadas de la pareja). La transcripción de cada nota se ve con el botón «Aa» (y en Iridalia la transcripción
automática se equivoca a propósito).

**Fotos**: escenarios armados con el motor de cine de la granja (`cine-granja.ts`, `cine-kit.ts`, `cine-actores.ts`):
el castillo y la cocina de Valdemora, Vigilia, el puerto con el faro (de tarde y de noche), las eras de sal, la
bocamina y la galería de Piedralumbre, el nido de los dragones, los Jardines del Eco con el seto, Nocturna, el
desierto de Ambarina y el aljibe, la loma de Iridalia con los cristales del valle, la Estación y la cúpula. Filtros por
foto: sepia (foto vieja), cámara de seguridad (gris, rayas y hora) y oscura (para la linterna).

## Versión para amigos

`celular.html` está en `PAGINAS_AMIGOS`, `src/celular/` en `PERMITIDOS_AMIGOS` y `celular/` y `audio/celular/` en
`PUBLICOS_AMIGOS` (`vite.config.ts`). `scripts/verificar-amigos.mjs` deja pasar el audio de `audio/celular/` (son
voces de personajes de Astra, no de la pareja). La música (`mesa-clue`) ya iba con los amigos.

## Cómo se prueba

```bash
cd juego/web
npx tsc --noEmit -p . && npx vite build && npm run build:amigos && node scripts/verificar-amigos.mjs
node scripts/_celular_revisar.mjs          # coherencia de los datos (pistas alcanzables, voces, candados)
node scripts/_celular_todos.mjs <carpeta>  # recorre los 8 casos de punta a punta y saca capturas (servidor en 5193)
```

Ganchos: `window.__celular` (`abrir(id)`, `tel()`, `final(id)`, `desbloquearTodo()`, `borrar()`, `progreso`).

## Integración (para el coordinador)

**Casa** (`src/casa/main.ts`), en el cuarto de juegos:

```ts
// JUEGOS
celular: { punto: 'arcade', url: './celular.html', nombre: 'Desaparecidos de Astra' },
```

```ts
// case 'juegos': (botones)
{ id: 'jugar-celular', texto: 'Desaparecidos de Astra', icono: '<span class="ico ico-emoji">📱</span>' },
```

```ts
// acciones
case 'jugar-celular':
  return jugar('celular');
```

Y en `vite.config.ts` ya está `celular: resolve(raiz, 'celular.html')` en el `input` de la versión de la pareja.

**Sala de Juegos de los amigos** (`src/amigos/juegos.ts`), en la lista `JUEGOS` (con el tema `'mesa'` para no tocar
el CSS; si se quiere uno propio, agregar `'celular'` al tipo `tema` y su clase):

```ts
{ id: 'celular', nombre: 'Desaparecidos de Astra', desc: 'Revisa celulares encontrados y resuelve 8 casos', arte: ARTE_CELULAR, tema: 'mesa', url: './celular.html' },
```

con el dibujo:

```ts
const ARTE_CELULAR = `<svg viewBox="0 0 200 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <rect width="200" height="110" fill="#5a3620"/><rect width="200" height="110" fill="url(#cm)" opacity=".5"/>
  <defs><radialGradient id="cm" cx="50%" cy="20%" r="70%"><stop offset="0" stop-color="#ffcf8a"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
  <g transform="translate(38 22) rotate(-8)"><rect width="56" height="72" rx="3" fill="#f0cf8e"/><rect x="6" y="8" width="26" height="30" fill="#fff"/><rect x="9" y="11" width="20" height="22" fill="#7a8a9a"/>
    <rect x="6" y="46" width="40" height="4" rx="2" fill="#a97e3a"/><rect x="6" y="54" width="30" height="4" rx="2" fill="#a97e3a"/></g>
  <g transform="translate(96 30) rotate(6)"><rect width="78" height="46" rx="9" fill="#1d1d24"/><rect x="5" y="5" width="68" height="36" rx="5" fill="#2f6f9a"/>
    <path d="M40 8 L34 20 L42 26 L36 40" stroke="#fff" stroke-width="1.3" fill="none" opacity=".8"/><circle cx="20" cy="22" r="7" fill="#ffd23f"/></g>
  <circle cx="160" cy="84" r="12" fill="none" stroke="#fff3d6" stroke-width="4"/><path d="M168 92 l12 12" stroke="#fff3d6" stroke-width="5" stroke-linecap="round"/></svg>`;
```

`docs/la-pareja.md`, «Quién cuenta qué»: Desaparecidos de Astra no cuenta nada de la pareja (fila agregada).
