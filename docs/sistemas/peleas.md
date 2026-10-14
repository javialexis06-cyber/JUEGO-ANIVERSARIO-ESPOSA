# El Torneo del Despertar Dorado (peleas)

Peleas uno contra uno tipo Street Fighter / Smash Bros con los muñecos de peluche del juego, en el torneo de la
Fiesta del Despertar Dorado (docs/en-obra/pelicula-de-astra.md, capítulo 6). Es casual: no mueve la historia de Astra.
Se juega desde el cuarto de juegos de la casa (Javier y Laura) y desde la Sala de Juegos (amigos, sin nada de la pareja).

Página: `juego/web/peleas.html` (`<meta name="apto-amigos" content="si">`), código en `juego/web/src/peleas/`.

## Cómo se juega

- **Moverse**: joystick transparente (aparece donde se toca, en la mitad izquierda) o flechas / WASD. Adelante y atrás
  caminan, arriba salta (Laura tiene doble salto), abajo se agacha.
- **Tapar**: mantener hacia atrás. De pie se tapa lo alto, lo medio y lo que viene saltando; agachado (atrás y abajo),
  lo bajo y lo medio. Los especiales y las súper quitan un poquito aunque los tapen.
- **Botones** (pequeños, abajo a la derecha): **Rápido** (J), **Fuerte** (K), **Especial** (L), **Agarre** (U) y
  **Súper** (I, se prende dorado con la barra llena).
  - Rápido ×3 es un combo (se encadena aunque no pegue). Con abajo: uno bajito.
  - Fuerte: con abajo, **barrida** que tumba; con arriba, **gancho** que manda a volar y corta los saltos.
  - En el aire: rápido (patada) y fuerte (martillazo que hunde).
  - Agarre: no se tapa; quien lo recibe se escapa apretando agarre a tiempo (los primeros cuadros).
  - Un golpe que pega se cancela en el siguiente: rápido → rápido → fuerte → especial → súper.
- **Barra súper**: se llena pegando (y un poco recibiendo y tapando). Al lanzarla, la cámara se acerca, sale el corte
  con el nombre del golpe y el luchador lo grita.
- **Retroceso estilo Smash**: con menos vida se vuela más lejos (y los livianos vuelan más). Rebote en la pared si
  sale disparado contra ella. Malabares con límite (después de 7 golpes en el aire ya no se puede seguir).
- **Mareo**: el aturdimiento se llena con los golpes seguidos; si pasa del aguante, sale con estrellitas y queda
  quieto un rato (el siguiente golpe lo despierta).
- **Rondas** de 60 segundos al mejor de 3. K.O. con cámara lenta, destello y la cámara encima de quien cae. Pose de
  victoria y de derrota, con su frase.

## Modos

| Modo | Qué es |
|---|---|
| Arcade | Escoge luchador y pelea contra una escalera de 6 rivales, cada uno más difícil (la máquina sube de nivel 1 a 6,5); los escenarios rotan. En la versión de la pareja, el otro de los dos sale de penúltimo y la Máscara de Vael’Thor es la pelea final. Al ganar las seis: pantalla de campeón. Si pierdes, revancha. |
| Contra la máquina | Escoge los dos, la dificultad (Tranquilo, Normal, Difícil, Maestro) y el escenario. |
| Dos en este aparato | Cada uno con su joystick y sus botones en su orilla (en el computador: jugador 1 WASD + F G H R T, jugador 2 flechas + J K L U I o el teclado numérico). |
| En línea | Sala con código (`src/salas/`), dos jugadores. El anfitrión escoge el escenario; cada uno su luchador. |
| Práctica | Sin reloj, la vida se recupera sola; el rival (nivel 1) casi no hace nada. |

## Luchadores

| Luchador | Estilo | Especial | Súper |
|---|---|---|---|
| **Javier** (pareja) | Equilibrado | Muak volador (corazón que vuela) | Abrazo de oso (ráfaga) |
| **Laura** (pareja) | Rápida, doble salto, menos vida | Patada voladora | Furia de guerrera (ráfaga) |
| **Eliana**, la Santa del Alba | A distancia | Chispa del alba (proyectil rápido) | Despertar Dorado (rayo de luz) |
| **Serena**, la Santa de la Calma | Contraataque | Velo de calma (si le pegan durante el velo, lo devuelve) | Lluvia de lirios |
| **Tarek**, el Toro de Brasaviva | Pesado: más vida, golpes con armadura | Embestida volcánica (con armadura) | Estampida de lava (ráfaga) |
| **Otto**, el Rescatista de Nieveclara | Control | Cuerda de rescate (agarre de lejos) | Avalancha (ola por el piso: hay que saltarla) |
| **Máscara del Conde** (un vecino disfrazado) | Tramposo, cada golpe le devuelve vida | Niebla de medianoche (aparece detrás) | Banquete de murciélagos (lluvia que roba vida) |
| **Máscara de Vael’Thor** (un vecino disfrazado) | Trampas | Jarrón de sombras (trampa en el piso que marea) | Laberinto de porcelana (lluvia que marea) |
| **El retador** (amigos) | El muñeco del amigo tal cual lo vistió; equilibrado | Estrella fugaz | Ráfaga estelar |
| **Dragón de Trapo** (amigos) | Un niño del pueblo con disfraz de dragón | Aliento de dragón (varios golpes) | Rugido de fuego (rayo) |

Versión de la pareja: Javier, Laura, Eliana, Serena, Tarek, Otto y las dos máscaras. Modo neutro (un amigo en el
aparato, un amigo en la sala o la versión para amigos): el retador, el Dragón de Trapo y los seis comunes.
Javier y Laura usan sus muñecos tal cual; los demás se visten con el clóset genérico (`src/salas/prendas.json`), así
también salen en la versión de amigos. Si los dos escogen al mismo, el de la derecha sale con la ropa de otro tono.

## Escenarios (Blender)

`personajes/blender/peleas_escenarios.py` arma los tres con piezas nuevas (tarima con faldón y banderines, gradas,
público de peluche, letrero del torneo con el sol, fogatas, columnas de basalto, pista de hielo, ovejas de cristal,
montañas y volcán) y con los kits de la granja (festivales, pueblo, edificios, casas de Astra, paisaje). Todo lo quieto
se funde en una malla con el color en los vértices (unas 100 llamadas de dibujo por escenario); lo vivo va en vacíos
`vivo_publico_*` (saltan con la emoción de la pelea), `vivo_llama_*` (tiemblan) y `vivo_vapor_*` (suben).

| Escenario | Lugar | Música |
|---|---|---|
| `plaza` | La Plaza del Pueblo del Sol, Fiesta del Despertar Dorado | `lavado-partida` |
| `brasaviva` | Las termas al pie del volcán | `lavado-intensa` |
| `nieveclara` | El lago helado de los rescatistas | `lavado-partida3` |

`personajes/blender/peleas_cosas.py`: lo que vuela (corazón, chispa, estrella, lirio, murciélago, porcelana, jarrón,
bola de nieve, llama, ola de nieve), un `m_<clave>` por cosa en `peleas/cosas.glb`.

```bash
blender -b -P personajes/blender/peleas_escenarios.py -- juego/web/modelos-crudos/peleas [plaza,brasaviva,nieveclara]
blender -b -P personajes/blender/peleas_cosas.py -- juego/web/modelos-crudos/peleas
cd juego/web && node scripts/peleas/optimizar.mjs      # → public/modelos/peleas/*.glb (no toca ropa.json)
```

## Voces

`node scripts/peleas/voces.mjs` (con `SECO=1` solo cuenta): el presentador (comentarista colombiano «El Faraon -
Energetic Commentator») y unas 8 frases por luchador con eleven_v4 (las emociones en inglés entre corchetes). Las de
Eliana, Serena, Tarek, Otto, el Conde y Vael’Thor usan la misma voz que en la granja; el Dragón de Trapo, la de un niño;
Javier y Laura, sus voces clonadas. Reparto en `voces-guion/peleas-reparto.json`. Salida:
`public/audio/peleas/comun/` (también va en la versión de amigos) y `public/audio/peleas/pareja/` (solo pareja), cada
una con su `lista.json`. Generadas: 90 líneas, **4.066 caracteres** (13 de octubre de 2026).

Las frases de Javier y Laura son de juego, con apodos y palabras del chat («esposa», «panda», «ay deoz», «hi baby»,
«muak», «nop», «sip»), sin ningún recuerdo (fila en `docs/la-pareja.md`, «Quién cuenta qué»).

## Archivos

| Archivo | Qué es |
|---|---|
| `tipos.ts` | Entrada (9 bits para la red), golpes, luchadores, escenarios |
| `golpes.ts` | Los normales de todos (ajustados por estilo) y los tipos de especial y súper |
| `luchadores.ts` | Los luchadores comunes, el retador, el elenco de cada versión y la escalera del arcade |
| `pareja.ts` | Javier y Laura (en la versión de amigos: `src/amigos/sin_pareja/peleas.ts`, vacío) |
| `presentador.ts` | Lo que dice el presentador |
| `sim.ts` | La pelea (60 pasos por segundo, sin three.js): estados, cajas de golpe, tapar, agarres, proyectiles, súper, rondas, eventos |
| `ia.ts` | La máquina (reflejos, tapar, castigar, combos, gancho contra saltos, escape de agarres, juego por estilo) |
| `poses.ts` | Las poses de pelea hueso por hueso (convención de `poses.py`) con brazos y piernas que se estiran |
| `vista/muneco.ts` | El muñeco de cada luchador (vestido, poses, caras, tumbado, vueltas, sacudidas) |
| `vista/escena.ts` | Renderizador, cámara lateral que sigue y hace zoom, luces y cielo de cada escenario, lo que flota |
| `vista/efectos.ts` | Chispas, letreros «¡PAF!», polvo, niebla, fuego, rayo, proyectiles (modelos de `cosas.glb`) |
| `vista/pelea.ts` | Une la pelea con lo que se ve y suena (eventos una sola vez) |
| `vista/retratos.ts` | Retratos de cada luchador dibujados una vez y guardados en el aparato |
| `ui/hud.ts`, `ui/mando.ts` | Barras, reloj, combos, anuncios, corte de la súper; joystick y botones |
| `red.ts` | En línea: el anfitrión simula y manda una foto cada 50 ms; el invitado manda su mando y ve un espejo suavizado |
| `sonidos.ts` | Golpes (almohadazos de `public/sfx`), voces del torneo |
| `main.ts` | Pantallas y flujo |

Se sale con «Volver» o atrás: a la casa (`./index.html`) o, en modo amigo, a `./amigos.html`. Al salir se suelta el
WebGL (`forceContextLoss`). Dibuja a 30 cuadros; la calidad baja sola si el celular no da (alta → media → baja: sin
sombras y menos resolución).

## Cómo se prueba

```bash
cd juego/web
npx tsc --noEmit -p . && npx vite build && npm run build:amigos      # (build:amigos corre verificar-amigos)
# Pelea de la máquina contra la máquina (capturas):
#   peleas.html?prueba=pelea&p1=el&p2=eliana&bot1=5&bot2=5&rol=el&sin-presentacion
# Poses una por una:  peleas.html?prueba=poses&p1=el   y   window.__pose('jab')
# En línea en dos pestañas: peleas.html?sala&salas=local&rol=el  y  peleas.html?unirse=CÓDIGO&salas=local&rol=ella
```

Ganchos: `__peleas()` (la simulación), `__peleasVista()`, `__peleasEscena()`, `__peleasFrases()`.

## Integración (para el coordinador)

**Casa** (`src/casa/main.ts`):

```ts
// en JUEGOS
peleas: { punto: 'arcade', url: './peleas.html', nombre: 'El Torneo del Despertar Dorado' },
// en case 'juegos' (botones)
{ id: 'jugar-peleas', texto: 'Torneo de peleas', icono: '<span class="ico ico-emoji">🥊</span>' },
```

y donde se atienden los botones `jugar-…` (el mismo patrón de `jugar-sangre`): `case 'jugar-peleas': return jugar('peleas');`.

**Sala de juegos de amigos** (`src/amigos/juegos.ts`): el tema `'peleas'` en `JuegoAmigos['tema']` (o reutilizar
`'super'`), y en `JUEGOS`:

```ts
{ id: 'peleas', nombre: 'Torneo de peleas', desc: 'Uno contra uno · contra la máquina, de a dos o en línea', arte: ARTE_PELEAS, tema: 'peleas',
  url: './peleas.html', sala: 'peleas' },
```

con su dibujo (por ejemplo):

```ts
const ARTE_PELEAS = `<svg viewBox="0 0 200 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="pf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb8ef"/><stop offset="1" stop-color="#ffe0a8"/></linearGradient></defs>
  <rect width="200" height="110" fill="url(#pf)"/><circle cx="100" cy="26" r="16" fill="#f6c445"/>
  <rect y="78" width="200" height="32" fill="#c99560"/><rect y="78" width="200" height="6" fill="#e9a92b"/>
  <g transform="translate(62 62)"><circle r="16" fill="#f3cfb3"/><rect x="-11" y="12" width="22" height="18" rx="7" fill="#4f8fe0"/><circle cx="20" cy="14" r="7" fill="#f3cfb3"/></g>
  <g transform="translate(138 62)"><circle r="16" fill="#e5b48f"/><rect x="-11" y="12" width="22" height="18" rx="7" fill="#e4574b"/><circle cx="-20" cy="10" r="7" fill="#e5b48f"/></g>
  <path d="M96 58 l8 -8 l-2 7 l7 1 l-9 9 l2 -7z" fill="#fff6a0" stroke="#c98a1a"/></svg>`;
```

«Unirme con un código» de la sala de amigos: si `averiguarJuego(código)` dice `peleas`, ir a
`./peleas.html?unirse=CÓDIGO` (y «Crear sala»: `./peleas.html?sala`, que ya es el valor por defecto de `urlCrear`).

Ya está hecho en esta rama: `peleas.html` en el `input` de `vite.config.ts`, en `PAGINAS_AMIGOS`, `src/peleas/` en
`PERMITIDOS_AMIGOS`, `modelos/peleas/` y `audio/peleas/comun/` en `PUBLICOS_AMIGOS`, el sustituto de `pareja.ts` en
`SUSTITUTOS`, y en `scripts/verificar-amigos.mjs` el permiso para los audios de `audio/peleas/comun/`.

## Pendiente o por mejorar

- Las poses de pelea se arman sobre el esqueleto en el juego (el muñeco no trae poses de pelea propias en Blender).
- En línea el invitado ve la pelea con el retraso de la red (no hay predicción de su propio muñeco).
