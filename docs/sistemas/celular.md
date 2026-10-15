# Desaparecidos de Astra (el juego del celular encontrado)

Minijuego de detective del capítulo 6 de [`en-obra/pelicula-de-astra.md`](../en-obra/pelicula-de-astra.md). En la
**mesa de los perdidos de Vigilia**, Ulises (el cartógrafo) recibe teléfonos encontrados en distintos lugares de Astra.
El jugador abre cada teléfono, revisa todo lo que tiene adentro y deduce qué le pasó a su dueño y dónde está.

- **Ocho casos completos**, que se desbloquean en orden. No hay tutorial que indique qué revisar.
- Los teléfonos y conversaciones son ficticios. Ningún caso habla de la pareja; la edición de amigos usa los mismos datos.
- El teléfono ocupa la pantalla horizontal; «Libreta» abre o esconde las anotaciones escritas por quien investiga.

## Investigación manual (15 de octubre)

Los ocho teléfonos contienen **6.111 mensajes**, entre 708 y 785 por aparato, en nueve o diez conversaciones.
Cada uno conserva tres años anteriores al suceso: turnos, comida, arreglos, encargos, préstamos, reuniones cambiadas,
malentendidos aclarados después, conversaciones de grupo, citas de mensajes, reacciones, ediciones y mensajes
eliminados. Los historiales combinan escenas autorales cotidianas con lugares, objetos y pequeñas historias de cada
oficio; las fechas distinguen los planes antiguos del expediente actual. No son chats de personas reales.

WhatsApp permite buscar nombres, texto, fechas y transcripciones, también en conversaciones archivadas. Se puede
abrir una fecha del chat o cargar mensajes anteriores y posteriores. Solo se montan 80 burbujas por página.
Hay registros de llamadas antiguos, notas personales y eventos de calendario, además de las fotos y aplicaciones
anteriores. El teléfono conserva su aspecto propio y funciona como un archivo sin conexión.

**No se seleccionan ni anotan pistas al leer, mirar fotos, escuchar o transcribir audio.** No hay contador de datos
importantes, giros destacados, globos de Ulises, botón Ayuda, recordatorios de contraseña ni sugerencias de linterna.
Las conclusiones se abren cuando el jugador decide, sin exigir descubrir determinadas entradas. Las explicaciones
se reservan al cierre del caso; contestar una pregunta no revela la historia de la siguiente.

La libreta es un campo libre de hasta 30.000 caracteres por caso, con guardado al escribir. Seleccionar y copiar
texto es posible, pero nada lo transfiere automáticamente. No se importan las antiguas pistas a estas notas.
Se conservan los IDs, teléfonos, contraseñas, soluciones, candados abiertos, casos cerrados y estrellas ya ganadas.
Las penalizaciones por ayudas de partidas anteriores siguen contando; ya no es posible pedir ayudas nuevas.

Progreso en `localStorage['celular-astra-v1']`: por caso, recepción, candados, lecturas, **apuntes manuales**, errores,
estrellas y cierre; los campos antiguos se conservan por compatibilidad. Ante un fallo de almacenamiento, resultado
y notas siguen pendientes en la partida abierta. Mesa, salida y atrás requieren confirmar y el aviso permite
reintentar. Un reinicio fallido conserva el caso anterior. Un cierre forzado mientras el aparato rechaza toda
escritura sigue sin estar cubierto.

Las aplicaciones incluyen Fotos con álbum protegido, Notas, Grabadora, Teléfono, Mapa, correo o bitácora,
Calendario, Linterna y Señas de luz. Los candados siguen siendo PIN, patrón o contraseña, sin ayudas de interfaz.
Las respuestas finales conservan sus errores y estrellas. El cierre presenta la escena, las voces y el siguiente
caso. Atrás de Android o Esc cierra capas y apps antes de volver a la mesa o a la sala de origen.

## Los ocho casos (con su solución)

| # | Caso | Lugar | Candados | Giro | Solución |
|---|---|---|---|---|---|
| 1 | **La noche del pacto** | Valdemora (AV 301) → Vigilia | PIN `0301` (el año); notas privadas `celina` (la abuela, en el chat de mamá) | Marcela iba a cambiarse el nombre por el de su abuela | El Conde bebió ceniza en su copa vieja sin adornos (la de cuando comía en la cocina) y aceptó «una noche que no termina»; Marcela huyó por el túnel de la leña y vive en Vigilia como **Celina**, amasando en el comedor de Brígida. Final: su mamá salió con los últimos liberados. |
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
| Flujo: mesa, expediente, libreta manual, conclusiones y final | `src/celular/main.ts` |
| El teléfono y sus apps | `src/celular/telefono.ts` |
| Candados (PIN, patrón, palabra con teclado propio) | `src/celular/candado.ts` |
| Íconos SVG y colores de las apps | `src/celular/iconos.ts` |
| Voces, música y efectos | `src/celular/audio.ts` |
| Progreso | `src/celular/progreso.ts` |
| Tipos de los datos | `src/celular/tipos.ts` |
| Los ocho casos y sus historiales | `src/celular/casos/c1-pacto.ts` … `c8-estacion.ts` (+ `index.ts` y `src/celular/historiales.ts`) |
| Estilos | `src/celular/celular.css` |
| Fotos (106 JPG, 800×450 y retratos de 240×240) | `public/celular/fotos/` |
| Notas de voz (152, Opus) e índices | `public/audio/celular/` y `public/audio/celular/historial/` |
| Escenarios de las fotos | `scripts/celular/fotos-escenas.ts` (kits `granja_*.glb`, `sangre/bioma_*.glb`, dragón, muñecos de peluche) |
| Sacar las fotos | `node scripts/celular/fotos.mjs c1 [escenario]` (servidor de Vite en `PUERTO`, por defecto 5193; `SALIDA=` para probar) |
| Voces | `node scripts/celular/voces.mjs reparto` y `node scripts/celular/voces.mjs` (`SECO=1` cuenta sin gastar); reparto en `voces-guion/celular-reparto.json` |

**Voces de la trama**: 56 notas, **7.031 caracteres** de ElevenLabs (tope del juego: 9.000; el script no deja pasarlo), modelo
`eleven_v4` con acotaciones en inglés entre corchetes, una voz distinta de la biblioteca por personaje (latinas, nunca
las clonadas de la pareja). La transcripción de cada nota se ve con el botón «Aa» (y en Iridalia la transcripción
automática se equivoca a propósito).

**Audios cotidianos**: 96 notas adicionales con voces sintéticas en español, en `public/audio/celular/historial/`. Se generan por separado con `scripts/celular/historial-audio.mjs` y `historial-audio.py` (Python, `edge-tts`, ffmpeg); se reutilizan por huella de texto y voz. No usan las voces de la pareja ni créditos del reparto de la trama.

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
node scripts/probar-celular-historial.mjs # coherencia de fechas, chats y audios
node scripts/probar-celular-interfaz.mjs http://127.0.0.1:5176/ test-results/celular-interfaz
node scripts/probar-celular-guardado.mjs    # guardado fallido, recuperación y reinicio sin pérdida
CHROME_PATH=/usr/bin/chromium FALLOS=1 node scripts/probar-celular-recorrido.mjs http://127.0.0.1:4184/ test-results/celular-amigos
# Primera partida y retorno a casa en la compilación completa:
CHROME_PATH=/usr/bin/chromium AMIGO=0 HASTA=1 FALLOS=1 node scripts/probar-celular-recorrido.mjs http://127.0.0.1:4182/ test-results/celular-casa
```

La prueba de punta a punta corre Chromium sin `--use-angle=swiftshader` (el juego no usa WebGL; con swiftshader las
capturas salen con una franja duplicada que no existe en el teléfono). Las fotos sí necesitan swiftshader
(`scripts/celular/fotos.mjs` ya lo trae).

Ganchos: `window.__celular` (`abrir(id)`, `tel()`, `final(id)`, `desbloquearTodo()`, `borrar()`, `progreso`).
El recorrido nuevo solo usa los ganchos para leer casos y progreso. Abre las apps y sus candados por botones,
teclados y patrones con arrastre; consulta las transcripciones y adelanta las escenas mediante su botón normal.
Se verificaron los ocho casos desde cero en amigos, con 24 estrellas, recarga después de cada cierre y recuperación
del primer guardado fallido; también el primer caso y retorno a la casa en la compilación completa. Se mantienen
soluciones, contraseñas y fórmula de estrellas; se retiraron las ayudas por petición de Javier.

## Integración (hecha el 14 de octubre de 2026: casa y Sala de Juegos con su tema `celular`)

### Lo que se había propuesto

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

## Verificación de la investigación manual

`probar-celular-historial.mjs` comprueba cantidades, fechas, contactos, referencias y archivos de audio; con
`PROBAR_AUDIO=1` verifica las 96 duraciones con ffprobe. `probar-celular-interfaz.mjs` comprueba búsqueda, archivo,
fechas, paginación, notas, conclusiones sin contador y reproducción de una nota nueva a 4×; además decodifica los
152 audios en navegador y comprueba señal sonora. Las claves y respuestas se leen de los datos en las pruebas: no
se presentan esos recorridos como una deducción humana de los enigmas ni como pruebas en Android físico.

Pasaron los ocho casos en amigos, el primero con retorno a casa en la edición completa, notas y recarga por caso,
fallo de almacenamiento recuperado, ambas compilaciones, privacidad de amigos, motores, 48 suites de granja y las
seis comprobaciones de integración. Para rehacer los audios cotidianos: `python3 -m pip install edge-tts==7.3.1`
y `node scripts/celular/historial-audio.mjs` (ffmpeg y ffprobe instalados).
