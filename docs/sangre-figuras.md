# Sangre y Ceniza · las figuras (guía para el programador)

Todo lo de aquí se hace por código en Blender (`personajes/blender/sangre_*.py`) y sigue el «Contrato de arte» de
`docs/sangre-y-ceniza.md`. Esta guía dice cómo vienen los archivos por dentro para usarlos sin adivinar.

## Dónde está cada cosa

| Archivo | Qué trae |
|---|---|
| `public/modelos/sangre/enemigos.glb` + `enemigos.json` | `enemigo_<id>` |
| `public/modelos/sangre/jefes.glb` + `jefes.json` | `jefe_<id>` |
| `public/modelos/sangre/armas.glb` + `armas.json` | `arma_<id>` |
| `public/modelos/sangre/proyectiles.glb` + `proyectiles.json` | `p_<id>` |
| `public/modelos/sangre/cosas.glb` + `cosas.json` | `c_<id>` |
| `public/modelos/ropa/sangre_<clase>_{el,ella}.glb` | traje de la clase con el esqueleto de la ropa |
| `public/sangre/iconos/<id>.webp` | íconos de 128 px, fondo transparente |
| `public/sangre/retratos/<clase>_{el,ella}.webp` | retratos de cuerpo entero para escoger clase |

Los `.json` de cada grupo dicen, por figura: `altura`, `radio` (del cuerpo, para choques), `alcance` (hasta la punta
de brazos, alas o armas), `tris` (triángulos) y `piezas` con el `pivote` de cada una (coordenadas de Blender, metros,
z arriba) y sus triángulos. Algunas figuras traen datos extra: `bioma`, `vuela: 1` (está modelada a la altura de
vuelo, no hay que subirla), `cuadrupedo: 1`.

## Cómo vienen los nodos

- Cada figura es un vacío raíz (`enemigo_zombi`) en el origen, con los pies en el suelo, mirando hacia **+Y de
  Blender = −Z de three.js** (el exportador ya convierte a y-arriba, igual que `aTres`). Metros reales: el zombi mide
  1,13 m.
- Sus hijos directos son las piezas: `cuerpo`, `cabeza`, `brazo_izq`, `brazo_der`, `pierna_izq`, `pierna_der` y,
  según el bicho, `mandibula`, `ala_izq`, `ala_der`, `cola`, `extra_*`. Cada pieza tiene el **origen en su
  articulación** (cadera, cuello, hombro, bisagra de la mandíbula): basta girarla.
- **Ojo con los nombres en three.js**: el `GLTFLoader` no deja nombres repetidos y les agrega `_1`, `_2`… (la
  `cabeza` del esqueleto llega como `cabeza_1`). Por eso cada pieza trae también `userData.pieza` con su nombre limpio:
  búscalas por ahí (`o.userData.pieza === 'cabeza'`) o quitando el sufijo (`nombre.replace(/_\d+$/, '')`).
- La izquierda de la figura es −X (mira a +Y): `brazo_izq` está en x negativa.
- Una pieza con un solo material llega como `Mesh`; con varios (piel + hierro + ojos) llega como `Group` con un
  `Mesh` por material. Para dibujar cientos con instancias: un `InstancedMesh` por (figura, pieza, material).

## Materiales (pocos y compartidos)

El color, la mugre, el óxido, el musgo, la sangre seca y la sombra de contacto (oclusión) vienen **horneados en los
colores de los vértices** (`COLOR_0`); los materiales son blancos y solo cambian el brillo:

| Material | Qué es | Notas |
|---|---|---|
| `sg_base` | tela, carne, hueso, cuero, piedra, madera, pelo | `userData.fieltro = 1`: recibe el relieve de fieltro de `prepararMateriales` |
| `sg_metal` | hierro, oro viejo, acero | metálico 0,75; sin mapa de entorno se ve oscuro, súbele `envMap` o baja `metalness` si hace falta |
| `sg_brillo_<color>` | ojos, brasas, runas, velas | emisivo (`rojo`, `ambar`, `verde`, `azul`, `violeta`, `blanco`, `oro`, `fuego`); `userData.brillo` trae el color |
| `sg_espectro` | fantasmas y velos | semitransparente: `transparent`, `depthWrite = false` |

**Élite**: clona `sg_base` de esa figura y ponle un `color` de tinte (multiplica los colores de los vértices; p. ej.
`#ffb3a6` vampírico, `#b8d0ff` escudo, `#ffd27a` dorado), cambia el `emissive` de sus `sg_brillo_*` (dorado o
blanco) y agrándala 1,25×. Así cada élite se distingue de lejos sin otro modelo.

## Animación sugerida (por piezas)

- Caminar: `pierna_izq` y `pierna_der` giran alrededor del eje X local en contrafase (±25°); los brazos al revés
  de las piernas de su lado; el `cuerpo` sube y baja un poco y la `cabeza` se mece.
- Cuadrúpedos (`cuadrupedo: 1`, perro, rata, hombre lobo a cuatro patas…): `brazo_*` son las patas delanteras y
  `pierna_*` las traseras. Trote: `brazo_izq` en fase con `pierna_der`.
- `mandibula`: gira en X (abrir hacia abajo 15-25°) para morder o gritar.
- Alas (`ala_*`): aletear girando alrededor del eje Y de Blender (adelante-atrás de la figura; −Z en three.js),
  ±35°, la izquierda al revés de la derecha.
- `cola`: mecer alrededor del eje Z de Blender (Y de three.js).
- Morir: soltar las piezas (cada una ya tiene su pivote) o tumbar la raíz.

## Armas y proyectiles

- `arma_<id>`: la pieza `cuerpo` con el **origen en la empuñadura** (donde va la mano). El arma crece hacia **+Z
  de Blender (+Y de three.js)** y el filo o la cara mira a +Y de Blender; la ballesta y el arco apuntan a +Y (hacia
  adelante). Medidas para un muñeco de ≈1 m (la espada mide 0,74 m, la lanza 1,24 m).
- Lo que se mece va aparte: `extra_bola` del mangual (pivote en la punta del mango) y `extra_incensario` (cuelga
  del aro de la mano).
- Marcas (vacíos hijos de la raíz, con `userData.marca`): `punta` (de donde sale el golpe, el disparo o el
  chorro) y `llama` (antorcha, incensario, bomba: ahí va una `PointLight`). También están en `armas.json`.
- Hechas: espada_larga, horca, grillete, maza, escudo, ballesta, martillo, frasco, pala, incensario,
  hacha_verdugo, baston_cuervos, laud, guadana, antorcha, estaca, lanza, mangual, daga, arco, y además cetro, hoz,
  pico, bomba, agua_bendita, grimorio y cuchillo_carnicero.
- `p_<id>` (proyectiles): centrados en el origen y volando hacia +Y de Blender; muy livianos (56 a 360
  triángulos): virote, flecha, estaca, frasco_roto, nota_musical, pluma_cuervo, hueso, bola_fuego (marca
  `llama`), rayo_sagrado, cadena_eslabon.

## Trajes de las clases

`public/modelos/ropa/sangre_<clase>_{el,ella}.glb` traen el **mismo esqueleto que la ropa de la casa**: se cargan y
se amarran a los huesos del muñeco igual que `Vestuario.cargar` (`src/casa/ropa.ts`) o `ponerCasco` del retrete
(`src/casa/cohete.ts`): `cargarAnimado`, `SkeletonUtils.clone`, y `m.bind(...)` con los huesos del personaje por
nombre. Cada traje es un solo archivo con todo (camisa, pantalón o falda, botas, capa, corona o sombrero, grilletes…).

`public/modelos/sangre/trajes.json` dice, por clase, qué partes de fábrica **tapa** (`oculta`: `arriba`, `abajo`,
`pies`, `copete`, `medias`): son las claves de `TAPA` de `src/casa/ropa.ts`, así que basta juntar esos prefijos y
llamar `personaje.tapar(prefijos)`. También trae los triángulos de cada versión.

La mugre (oclusión, barro abajo, manchas y sangre seca según la clase) viene en los colores de los vértices y
multiplica el color de cada material; los materiales son los de la ropa (`userData.fieltro` para el relieve).

Hechos: monarca (corona abollada con una punta rota, manto raído con huecos, jubón de terciopelo con bordados y
cadena de mando; la reina con falda larga), campesino (sombrero de paja deshilachado, camisa de lino remangada,
chaleco remendado, polainas de tela; ella con falda y delantal) y prisionero (túnica de costal hecha jirones,
grilletes con la cadena rota, collar de hierro, pies vendados y la bola de hierro arrastrando del tobillo izquierdo).

## Cómo se regeneran

```bash
# figuras (uno a la vez: la máquina es compartida)
blender -b -P personajes/blender/sangre_exportar.py -- juego/web/modelos-crudos enemigos
blender -b -P personajes/blender/sangre_exportar.py -- juego/web/modelos-crudos enemigos zombi,cuervo --hoja /tmp/hoja.png --sin-glb   # revisar
blender -b -P personajes/blender/sangre_trajes.py -- juego/web/modelos-crudos ambos monarca,campesino --hoja /tmp/trajes.png
cd juego/web && node scripts/optimizar-sangre.mjs        # SOLO='enemigos' o SOLO='sangre_monarca' para uno
```

`optimizar-sangre.mjs` comprime con meshopt **sin juntar ni aplanar nodos** y no toca los JSON ni los íconos de
los demás (a diferencia de `optimizar-modelos.mjs`).
