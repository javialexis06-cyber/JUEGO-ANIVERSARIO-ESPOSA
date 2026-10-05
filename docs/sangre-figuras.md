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

## Los 22 enemigos

zombi, zombi_gordo (panza cosida con bilis verde), esqueleto (casco y espada), esqueleto_arquero (capucha, arco y
carcaj), cuervo, perro_huesos, ghoul (agachado, brazos largos, mandíbula), arana_cripta (8 patas: las 4 de cada lado
en `pierna_izq` / `pierna_der`; quelíceros en `mandibula`), espectro (translúcido, `sg_espectro`, flota),
minero_maldito (casco con vela, farol al cinto con marca `llama`, pico, cristales de sangre), rata_peste (cuadrúpeda,
cola), abominacion (tercer brazo `extra_brazo`, cuchilla en la mano derecha), lacayo_explosivo (barril de pólvora
con la mecha encendida: marca `llama`), monje_caido (vela en la mano: marca `llama`), gargola (alas y cola de
piedra), inquisidor_muerto (máscara de hierro, hierro de marcar al rojo: marca `llama`), nigromante (bastón con
calavera y llama verde: marca `llama`), vampiro (capa de cuello alto), novia_vampira (velo y rosa marchita),
hombre_lobo (mandíbula y cola), caballero_muerte (élite común, `elite: 1`, mandoble en la mano derecha).

## Jefes (`jefes.glb`)

- `jefe_golem_osarios` (3,2 m): gigante de tierra de tumba, huesos y calaveras con un alma verde en el pecho
  (marca `luz`); puños de calaveras; `mandibula`.
- `jefe_abadesa` (2,7 m, flota, `sg_espectro`): monja banshee con la boca abierta (`mandibula`), brazos larguísimos y
  `cola` de jirones.
- `jefe_gusano_sangre` (4 m, `sale_del_suelo: 1`): el `cuerpo` es el tramo que sale del cráter (con las rocas); la
  `cabeza` se dobla desde el cuello y la `mandibula` son los cinco pétalos de la boca (abrir = escalar o girar hacia
  afuera); `extra_tentaculo_izq/der`. Marca `luz` en la garganta.
- `jefe_obispo_hueco` (2,7 m): mitra dorada, casulla carmesí quemada, el pecho abierto con un corazón en llamas
  (marca `luz`) y el báculo encendido en la mano derecha.
- `jefe_conde` (2,8 m, `fases: 2`): señor vampiro con corona de púas, espada de sangre (marca `punta`),
  `extra_capa` (pivote en los hombros: mecerla) y `extra_alas` (alas de murciélago enormes): **escóndelas en la fase 1
  y muéstralas en la fase 2**.

## Cosas (`cosas.glb`)

- Recogibles (livianos): `c_alma_azul`, `c_alma_verde`, `c_alma_roja` (flotan; marca `luz`), `c_oro`, `c_hierro_negro`,
  `c_sangre_cristal`, `c_pierna_pollo`, `c_llave`.
- Cofres: `c_cofre` y `c_cofre_reliquia` con la tapa aparte (`extra_tapa`, pivote en la bisagra de atrás: abrir = girar
  en X hacia atrás).
- `c_campana_extraccion`: campana de bronce de 3,5 m con runas rojas; `extra_cadenas` (suben al cielo: bajarla todo
  junto) y `extra_badajo` (mecerlo al sonar). Marca `luz` adentro.
- `c_altar_sangre` (cristal de sangre clavado, velas y sangre), `c_carreta` (para los rieles, con
  `extra_rueda_del` y `extra_rueda_tras` que giran en X), `c_pozo_almas`, `c_forja` (marca `llama`).
- `c_prisionero_cadenas`: persona por piezas (cuerpo, cabeza, brazos, piernas) + `extra_poste` con las cadenas: al
  liberarlo se esconde el poste y camina detrás. `c_guardia_real`: caballero aliado del monarca, por piezas.
- Construcciones: `c_torreta_ballesta` (`extra_arco` gira en Z; marca `punta`), `c_trampa` (`extra_quijada_a/b`
  se cierran girando en X), `c_totem_maleficio`, `c_plataforma`; y `c_tumba_abierta` (sepulturero).
- Objetivos secundarios: `c_huevo_dragon`, `c_frasco_alquimia`; y además `c_espiga` (las espigas que curan del
  campesino) y `c_bengala`.

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

## Nombres que pide el juego (alias)

Para que el código de `src/sangre/` encuentre todo con sus propios nombres, algunos nodos vienen repetidos con otro
nombre (son **alias**: comparten la misma malla, no pesan más):

- Armas (`datos/armas.ts → modelo`): `arma_baston` = bastón de cuervos, `arma_libro` = grimorio; y además armas
  propias para `estandarte`, `honda`, `bola_hierro` (con `extra_bola`), `punos`, `lanza_justa`, `trabuco`,
  `linterna` (marca `llama`), `campana_mano`, `cruz`, `gancho`, `soga`, `vudu`, `flauta`, `tambor`, `sierra` y `hacha`.
- Proyectiles: `p_rayo` = rayo sagrado; y `alma`, `bola_hierro`, `bola_puas`, `bomba`, `cruz`, `daga`, `escudo`,
  `frasco_agua`, `frasco_fuego`, `frasco_hielo`, `gancho`, `guillotina`, `hacha`, `pagina`, `pico`, `piedra`,
  `sierra`, `yunque`.
- Cosas por piezas: `c_prisionero` = prisionero encadenado, `c_campana` = campana de extracción, `c_torreta` =
  torreta de ballesta, `c_totem` = tótem de maleficio, `c_aliado_caballero` = guardia real; y además
  `c_aliado_ballestero`, `c_santuario` (santa encapuchada, velas y runas violetas) y `c_cofre_maldito` (cadenas y ojo
  violeta, con `extra_tapa`).

## Íconos y retratos

- `public/sangre/iconos/<id>.webp` (128 px, transparentes): uno por cada id de arma de `datos/armas.ts` (68), hechos
  del modelo que mejor lo representa (los frascos con su color, la torreta, el yunque…), en diagonal si el arma es
  larga y con un halo suave del color del arma; las evoluciones llevan halo dorado con destellos.
  Se regeneran con `blender -b -P personajes/blender/sangre_iconos.py -- juego/web/public/sangre/iconos`.
- `public/sangre/retratos/<clase>_{el,ella}.webp` (384 × 480, transparentes): el muñeco con el traje, luz
  dramática y el arma inicial de la clase en la mano. Se hacen con
  `sangre_trajes.py -- <salida> ambos --retratos juego/web/public/sangre/retratos`.

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
