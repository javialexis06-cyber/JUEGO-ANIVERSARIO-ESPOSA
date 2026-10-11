# La música y los efectos (ElevenLabs)

Desde el 11 de octubre de 2026 cada juego tiene su música propia, hecha con **Eleven Music** (modelo `music_v2_5`), y
las escenas premium y las reacciones de la mesa tienen efectos de sonido de verdad (**Sound Effects**). Javier
aprobó la propuesta así: instrumentales para jugar, canciones con letra solo en la casa, Cien Puertas, el súper, el
cohete y la cocina; **rock electrónico pesado / metal sin letra** en Sangre y Ceniza y Lavarse la cara; en las escenas
premium **solo efectos** (sin voces ni videos con IA). La granja se musicaliza después, cuando esté más avanzada.

## Qué suena dónde

| Juego | Pistas (id) | Cuándo |
|---|---|---|
| La casa | `casa-cancion` («Nuestro Hogar», con letra, solo pareja) · `casa-dia` · `casa-noche` · `casa-patio` | La canción al escoger quién es en la bienvenida; después la de día, la de dormir de 8 p. m. a 6 a. m. y la del patio en el patio (`pistaCasa` en `src/casa/main.ts`) |
| Súper Manía | `super-cancion` («¡Súper Manía!», con letra) · `super-dia` · `super-legendario` · `super-dia100` (solo pareja) · remates `super-abrir`, `super-ganado`, `super-perdido`, `super-estrella` | La canción en el menú y luego la del día; cada día empieza su pista con el remate de abrir; se acelera (×1,07) en los últimos 25 s; el día 100 de la pareja tiene la suya (`pistaMenu`, `pistaDia` en `src/main.ts`) |
| Mesa de juegos | `mesa-menu` · `mesa-clue` · `mesa-parchis` · `mesa-mancala` · `mesa-dados` · `mesa-cajas` · remates `mesa-ganar`, `mesa-perder` | El menú y una por juego (`PISTA_JUEGO` en `src/mesa/main.ts`) |
| Cien Puertas | `puertas-menu` · `puertas-cap1` … `puertas-cap10` · `puertas-final` («Cien Puertas», con letra) · remates `puertas-abierta`, `puertas-recuerdo` (todas de la pareja) | Una por capítulo; la canción suena en la puerta 100 mientras se despiden y sigue la del capítulo 10 |
| Sangre y Ceniza | `sangre-menu` · `sangre-noche` · `sangre-batalla` · `sangre-horda` · `sangre-jefe` · `sangre-final` | Con tensión ≥ 0,75 la de la horda; con el jefe vivo la del jefe; al ganar la expedición, el final (`src/sangre/sonidos.ts`) |
| Lavarse la cara | `lavado-menu` · `lavado-partida` · `lavado-intensa` · `lavado-jefe` · remates `lavado-victoria`, `lavado-derrota` | Desde la intensidad 2, la intensa; con jefe, la del jefe (`src/casa/lavado/sonidos.ts`) |
| Retrete cohete | `cohete-cancion` («Del baño a la NASA», con letra) · `cohete-tramo0` … `cohete-tramo6` | La canción en el primer despegue; después una por tramo (si cambia de tramo mientras canta, espera a que termine); el turbo la acelera (`src/casa/cohete/musica.ts`) |
| Cocina de chef | `cocina-cancion` («Hecho con amor», con letra) · `cocina-wafles` · `cocina-fresas` · `cocina-frappes` · `cocina-pico` | La canción al entrar, la del restaurante al jugar y la de hora pico con 4 o más en la fila (`src/casa/cocina/motor.ts`) |
| Sala de amigos | `amigos-sala` | Desde el primer toque |

Efectos (`public/sfx/`): los 43 de `src/reacciones/sonidos.ts` con el mismo nombre (beso, carcajada, almohadazo,
splash, fanfarria, desmayo…), con tono de caricatura de peluche y sin palabras. `sonar()` los usa en cuanto cargan;
mientras tanto, o si faltan, suena el sintetizado de siempre.

## Cómo funciona

- `src/sonido.ts` → `musica.pista(id, { bucle, luego, reiniciar, oSino })`: carga la pista (las listas son
  `public/musica/lista.json` y `public/musica/pareja/lista.json`), la repite con un cruce de 2,5 s entre vueltas
  y, mientras suena, la música sintetizada se calla. Si no hay archivo, sigue la sintetizada (o la de `oSino`).
  `musica.prisa(v)` la acelera sin cortar; `musica.remate(id)` toca un remate corto encima y baja la música un
  momento. Respeta el botón de música, el silencio, la pausa y baja sola cuando hablan las voces.
- Los minijuegos con música propia (lavado, cohete, cocina) marcan `musica.enMinijuego` mientras juegan, para que
  la casa no les cambie la pista, y al terminar devuelven la que sonaba antes.
- **Amigos**: la app de amigos lleva solo las pistas de sus juegos (`super-`, `mesa-`, `lavado-`, `sangre-`,
  `cohete-`, `cocina-`, `amigos-`) y los efectos; nunca `musica/pareja/` ni las de la casa (lo copia
  `vite.config.ts` y lo revisa `verificar-amigos`). Las canciones de los juegos compartidos son neutras.
- Pruebas: `node scripts/probar-musica.mjs http://localhost:5176` (con un servidor del juego) revisa las listas y que
  cada juego suene con su pista. Gancho: `window.__musica()` → `{ pista, activa, velocidad }`.

## El guion y cómo se genera

- `juego/web/musica-guion/guion.mjs`: cada pista con su estilo (en inglés, como lo entiende Eleven Music) y, en las
  canciones, la letra por partes con quién canta. `EFECTOS`: duración y descripción de cada efecto.
- `SECO=1 node scripts/musica-ia.mjs` cuenta lo que falta y lo que cuesta; `node scripts/musica-ia.mjs` lo genera (3 a
  la vez; `SOLO=casa`, `SOLO=efectos` o `SOLO=<id>`). Las canciones salen en 2 tomas y se queda la que mejor se le
  entiende la letra (la transcribe con Scribe y compara); las demás, 1 toma (se descarta si sale muda o corta).
- Todo pasa a Opus con el volumen parejo (pistas a −16 LUFS, estéreo 64 kb/s; efectos a −18, mono 48 kb/s). El nombre
  del archivo lleva una huella del texto del guion: si se cambia, se rehace solo esa pista y la vieja se borra. Las
  tomas crudas quedan en `modelos-crudos/_musica/` (no se suben).
- Costo medido: unos **800 créditos por minuto** de música y 40 por segundo de efecto. Toda la primera tanda (60 pistas,
  81 min, más 43 efectos) gastó unos 74.000 créditos.
- Peso: ≈ 39 MB la música de la pareja, ≈ 24 MB la de los amigos, 0,4 MB los efectos.

## Pendiente

- La granja (cuando tenga todas sus zonas y personajes): música por estación y del pueblo, a coordinar con su frente.
- El Show de Nosotros (rama `trabajo/show`): cortina de concurso cuando se junte.
- Las escenas premium siguen en los cuartos de la casa; los escenarios grandes propios están en `en-obra/escenas-premium.md`.
