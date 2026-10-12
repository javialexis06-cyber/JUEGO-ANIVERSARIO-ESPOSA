# El cine de la granja

Pequeñas películas de la historia principal de la granja, hechas dentro del juego (three.js) con los peluches y los
modelos de Blender: el prólogo es la primera. Javier pidió (12 de octubre de 2026) que fueran «tipo película, con
animación fluida» y que todo lo de las diosas sonara «armonioso y celestial»; si le gusta el prólogo, se hacen las demás
escenas grandes con el mismo estilo.

## El prólogo (`src/granja-v3/cine-prologo.ts`, ~125 s)

1. **Cosmos**: estrellas y nebulosa; una chispa crece, estalla y nace el planeta de Celia (mares, tierra, nubes y
   atmósfera aparecen desde un corazón de luz). Narrador.
2. **Aura** llega con su estela dorada y **Lara** con su estela violeta; cada una dice su línea en primer plano.
3. Las dos levantan los brazos y tejen el **Santuario**: un escudo de hexágonos que cierra desde Aura (oro) y desde Lara
   (violeta) hasta encontrarse en un destello. Narrador.
4. La cámara cae al planeta (fundido blanco) y amanece en el **valle**: la granja dormida entre la maleza. Narrador.
5. **Él y Ella** llegan por el sendero; cae una columna de luz, brotan flores y aparece **Celia** flotando entre
   pétalos. Sus cinco líneas en planos distintos (primer plano, contraplano sobre su hombro, plano general con las flores
   creciendo, plano medio con los brazos en alto).
6. Celia se despide subiendo en destellos y aparece el título «Nuestra granjita · El Vientre de Celia».

Mitología: `docs/mitologia.md` (Celia, las Diosas Hermanas y el Santuario Protegido). Las líneas están en
`src/granja-v3/cine-lineas.ts` (texto del subtítulo y cómo se dice para ElevenLabs).

## Cómo funciona

- **Motor** (`cine-granja.ts`): capa a pantalla completa con franjas de cine, viñeta, subtítulos con quien habla,
  títulos y fundidos; renderizador propio con bloom (UnrealBloom), sombras suaves y tono ACES. Cada toma tiene su
  escenario, su plano de cámara (de → a, con curva suave), su línea y su música. Si la voz de una línea ya existe, la
  toma dura lo que dure la voz. `simular(seg)` avanza cuadro a cuadro (grabar video y pruebas); `ContextoToma.desde(id)`
  da el tiempo desde cualquier toma, así lo que dura varias tomas es exacto en cada cuadro.
- **Actores** (`cine-actores.ts`): Él y Ella son sus peluches; las diosas son el muñeco de Ella vestido con la ropa
  exclusiva de `personajes/blender/ropa_diosas.py` (`vestido_diosa` en tres colores, `corona_hojas`, `corona_llamas`,
  `velo_lara`) y el clóset de siempre (peinado, alas, capa), con un halo y una luz propia por fuera (los materiales del
  muñeco se comparten con la Laura del juego y no se tocan).
- **Escenarios** (`cine-prologo.ts`): el cosmos con sombreadores propios (estrellas, nebulosa, planeta, nubes,
  atmósfera, escudo, estelas y flujos de energía) y el valle con los kits de Blender (`granja_monte.glb`, la cabaña, la
  cerca y la maleza de `granja-v2/`) instanciados, cielo de amanecer, polen, columna de luz, pétalos y flores que brotan.
- **En el juego** (`main.ts`, `verPrologo`): sale sola al empezar una partida nueva (paso «Llega Celia» de la guía) y
  se puede volver a ver en Ajustes («Ver el prólogo»). Mientras corre, la granja no se dibuja ni suena. Si falla (un
  teléfono sin WebGL suficiente), queda el prólogo escrito. Gancho de prueba: `__granjaV3.prologo()`.
- **Pruebas y video**: `node scripts/_cine.mjs cuadros <carpeta> t1,t2…` (fotos sueltas) y
  `node scripts/_cine.mjs video <carpeta> 24 [desde] [hasta]` (todos los cuadros; luego ffmpeg los junta con la
  música). Scripts temporales (`_*.mjs`).

## Voces y música (ElevenLabs)

- `node scripts/granja-v3/voces-cine.mjs reparto` busca voces etéreas en español para Celia, Aura y Lara (el narrador es
  el de la granja) y las deja en `voces-guion/cine-reparto.json`; `node scripts/granja-v3/voces-cine.mjs` genera las
  líneas. Las diosas pasan por un procesado celestial con ffmpeg (coro muy suave, ecos largos de catedral y brillo
  arriba); el narrador, por una sala cálida. Salen a `public/audio/cine/` y se declaran con su duración en
  `public/granja/cine/medios.json` (aparte de `granja/astra/medios.json`, que su script reescribe entero).
- Música: `cine-prologo-cosmos` y `cine-prologo-valle` en `musica-guion/guion.mjs` (orquesta celestial con coro sin
  letra, arpa y celesta; piano y flauta al amanecer). Mientras no existan suenan M12 («Heaven Theme Loop») y M13
  («First Light Particles») de la granja.
- **Pendiente para Javier**: esta sesión no tenía `ELEVENLABS_API_KEY` ni la red abierta a `api.elevenlabs.io`; con las
  dos, una sesión nueva corre `voces-cine.mjs reparto`, `voces-cine.mjs` y `SOLO=granja node scripts/musica-ia.mjs`.
