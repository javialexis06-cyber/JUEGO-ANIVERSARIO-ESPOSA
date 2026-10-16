# El Escudo de las Hermanas (tower defense del Borde de Astra)

La batalla del **Borde de Astra en la misión P23** de la granja («La estrella que no será nuestra casa»), que empalma con
la película **C09 «Una estrella sin dueño»** (`src/granja-v3/cine-acto4.ts`). Se juega también cuando se quiera desde el
**Cuarto de Juegos** de la casa y, sin nada de la pareja, en la **Sala de Juegos** de los amigos
(`docs/en-obra/pelicula-de-astra.md`, capítulo 6).

## Cómo se juega

- La ceniza de Nath'Gora sale por las grietas de la izquierda (el abismo de Astra) y camina hasta el **escudo de luz**
  de la derecha, donde están las Santas Eliana y Serena (y Javier y Laura en la versión de la pareja, con la
  **Constelación de los Amantes** encima). Cada enemigo que llega le quita corazones al escudo (20 al empezar).
- Se construye en los **círculos de piedra** junto al camino: tocar un círculo abre la fila de torres; el primer toque
  escoge (y muestra el alcance), el botón verde **✓** confirma. Igual para mejorar, escoger rama y vender (60 %).
- Moneda: **luz de estrellas** (✦). La deja cada enemigo vencido; los que caen dentro de la luz de Lara se van
  «acompañados» y dejan 50 % más. **¡Que venga!** adelanta la oleada y paga lo que faltaba de la cuenta.
- **Vista previa** de la próxima oleada (íconos y cantidades), **x2** de velocidad, **⤢** para ver todo el mapa,
  pausa. La cámara se arrastra con un dedo y se acerca con dos (o la rueda).
- **Habilidades** (abajo a la izquierda, con recarga): **Eliana** (Santa de Aura) hace caer una brasa del Alba en
  área (32 s); **Serena** (Santa de Lara) tiende su velo: casi congela a todos los del círculo (40 s); la tercera es
  **El Lazo Primordial** en la versión de la pareja y **La luz de Celia** en la de amigos: 9 s en que nada daña el
  escudo y todo pega 30 % más (90 s). Las dos primeras piden tocar el sitio y confirmar.
- **Estrellas**: 3 si quedan 18 corazones o más, 2 con 10 o más, 1 si se gana. Los niveles se abren en orden; el
  infinito se abre al ganar el III. Todo se guarda en el aparato (`escudo-progreso`; los amigos en
  `amigo-escudo-progreso`).

El resultado y el recibo de P23 permanecen pendientes si falla el almacenamiento. «Reintentar guardado» conserva
las estrellas y la fecha del recibo; continuar, ir a niveles o salir requiere confirmar la escritura. Mientras
termina la escena de victoria o derrota, atrás no desmonta la partida antes de mostrar el resultado. Si no hay
espacio para escribir, hay que mantener el juego abierto y liberarlo: un cierre forzado sigue fuera de la garantía.

## Torres (6, cada una con 3 niveles y una rama final a escoger)

| Torre | Qué hace | Rama A | Rama B |
|---|---|---|---|
| **Altar de Aura** | Bolas de fuego con estallido en área (no alcanza a los que vuelan) | Sol del Alba: estallido enorme que deja ardiendo | Lluvia de chispas: tres bolas a la vez |
| **Altar de Lara** | Pulsos que ralentizan a todos (también a los que vuelan); quien cae en su luz se va acompañado | Velo del Ocaso: las almas débiles (< 14 %) se van con la luz de una vez | Rosal de la Calma: las rosas enraízan a todos cada 6 s |
| **Nido del Dragón** | Llamarada en cono, corta y muy fuerte | Jade ancestral: atraviesa la armadura | Fuego de la mina: deja el camino ardiendo |
| **Percha del Grifo** | Plumas de oro a un blanco; prefiere y destroza a los voladores | Garra de tormenta: el rayo salta a cuatro más | Vigía de la frontera: alcance enorme y golpe tremendo |
| **Fuente del Unicornio** | Apoyo: +15/25/35 % de daño a las torres cercanas y cura un corazón del escudo cada tanto | Luz plateada: +50 %, más rápido y más lejos | Lágrimas de alegría: cura cada 9 s y quita la armadura a los gólems |
| **Pilar de Fuatia** | Cambia de elemento tocándolo: fuego quema, agua ralentiza, tierra rompe armaduras, aire tumba voladores | La Balanza: cambia sola en cada disparo, +40 % | Los Cuatro Núcleos: dispara los cuatro a la vez |

Las criaturas son las de la granja (`public/modelos/granja-v3/{dragon,grifo,unicornio}_lod.glb`, con su animación de
reposo); la criatura mira y se lanza hacia su blanco.

## Enemigos (la ceniza de Nath'Gora)

Mota de ceniza (muchas), Sombra veloz (corre el doble), Gólem de ceniza (blindado: la armadura le quita 55 %),
Polilla de ceniza (vuela: el fuego no le llega), Brasa partida (suelta tres motitas) y el jefe **la sombra de
Nath'Gora** (nivel VI y cada 10 oleadas del infinito): llama ceniza cada 9 s, apaga la torre más cercana 4,5 s y si
llega rompe el escudo.

## Niveles

| # | Nivel | Novedad | Oleadas |
|---|---|---|---|
| I | El Mirador de las Santas | Aura, Lara y dragón; un desvío al final | 8 |
| II | Los Arcos Rotos | Polillas y el grifo | 9 |
| III | La Cantera de Cristal | Dos grietas y tres rutas; el unicornio | 10 |
| IV | El Rosal de la Noche | Fuatia; rutas que se abren y se juntan dos veces | 10 |
| V | El Puente de las Brasas | El paso angosto sobre el abismo (islas que faltan) | 11 |
| VI · P23 | La Estrella sin Dueño | La batalla de la historia, con la sombra de Nath'Gora | 11 |
| VII | El Observatorio del Alba | Curvas que rodean el telescopio y comparten un regreso | 10 |
| VIII | Los Canales de Cristal | Tres entradas y cruces entre cristales | 10 |
| IX | El Jardín de las Luciérnagas | Dos jardines con pasos interiores compartidos | 10 |
| X | Las Terrazas del Ocaso | Dos entradas que rodean las terrazas | 10 |
| XI | La Ronda de los Braseros | Dos columnas que se cruzan en el campamento | 11 |
| XII | La Corona del Borde | Tres pasos y un eco final de Nath’Gora | 11 |
| ∞ | El Borde sin Fin | Oleadas que se arman solas y crecen | sin fin |

Los sitios para construir los escoge el motor (los que más camino ven, a 1,85-2,6 m del camino y separados 2,5 m).
La utilería de cada nivel (faroles, estandartes de Aura y Lara, cristales, ruinas, rosales, tiendas…) se reparte con
semilla: cada nivel se ve igual cada vez.

**Balance** (bot sin pantalla, `scripts/_escudo_balance.mjs`, 4-6 semillas): el bot que pone las torres en las
esquinas gana todo, casi siempre con 3 estrellas; el «torpe» (sitios al azar, sin habilidades) gana el I y pierde
desde el II. Retador pero pasable: hay que pensar dónde va cada torre y leer la vista previa (polillas → grifos).

## Escenas (≈ 30 s cada una, con el motor del propio juego)

- **La llegada al Borde**: la primera vez que se empieza la campaña (y en la misión P23). Narrador, Nath'Gora desde el
  abismo, Eliana y Serena; en la versión de la pareja, Javier y Laura llegan y la Constelación de los Amantes vuelve a
  brillar.
- **Una estrella sin dueño**: al ganar el nivel VI. Nath'Gora pierde el paso y vuelve al abismo; en la versión de la
  pareja, Javier toma la mano de Laura («esa estrella no sería su casa: su casa eran ellos dos»).
- Se vuelven a ver desde la portada; `escudo.html?escena=inicio|final` las abre sueltas. Se saltan con «Saltar» o
  atrás.

## Voces y música

33 líneas (2.443 caracteres de ElevenLabs) con las mismas voces de la granja: narrador (`cine-reparto.json`), Eliana y
Serena (las canalizadoras de `astra-reparto.json`) y Nath'Gora. Guion: `src/escudo/guion.ts` (el mito, lo oyen todos)
y `src/escudo/pareja.ts` (lo que nombra a la pareja) con su versión de amigos en `src/amigos/sin_pareja/escudo.ts`.
`node scripts/escudo/voces.mjs` (o `SECO=1` para contar) genera lo que falte: `public/audio/escudo/` (con su
`voces.json`) y `public/audio/escudo-pareja/` (que la versión de amigos no copia). Música de la granja: M16 en la
portada, **M19** (la de C09) en la batalla y M20 al ganar. Efectos sintetizados (`src/escudo/audio.ts`).

## Archivos

| Qué | Dónde |
|---|---|
| Página | `juego/web/escudo.html` (apta para amigos) |
| Datos (torres, enemigos, niveles, oleadas) | `src/escudo/datos.ts` |
| Simulación (paso fijo de 1/30 s, sin three.js) | `src/escudo/motor.ts` |
| Bot (`?bot=1` y el balance) | `src/escudo/bot.ts` |
| Escena 3D, cámara, efectos y calidad automática | `src/escudo/escena.ts` |
| Interfaz, menús, escenas y flujo | `src/escudo/main.ts`, `src/escudo/escudo.css` |
| Íconos (los modelos dibujados a imagen) | `src/escudo/iconos.ts` |
| Las Santas y los muñecos | `src/escudo/actores.ts` |
| Lo de la pareja / versión de amigos | `src/escudo/pareja.ts` / `src/amigos/sin_pareja/escudo.ts` |
| Progreso y recibo de P23 | `src/escudo/progreso.ts` |
| Modelos (Blender) | `personajes/blender/escudo_mapa.py`, `escudo_torres.py`, `escudo_enemigos.py` → `public/modelos/escudo_*.glb` |

Exportar: `blender -b -P personajes/blender/escudo_<kit>.py -- juego/web/modelos-crudos` y `cd juego/web &&
SOLO='^escudo_' node scripts/optimizar-modelos.mjs` (después `git checkout src/casa/ropa.json`). El optimizador junta
las mallas de cada pieza `m_<clave>` por material, como los kits de la granja.

Calidad: 30 cuadros por segundo; empieza con sombras y brillo (bloom); si los cuadros tardan, quita el brillo, baja la
resolución y luego las sombras. Al salir suelta el WebGL (`forceContextLoss`).

## Cómo se prueba

```bash
cd juego/web
npx tsc --noEmit -p . && npx vite build && npm run build:amigos && node scripts/verificar-amigos.mjs
node scripts/probar-escudo-motor.mjs                 # doce niveles, derrota, infinito y fallos de escritura
# Servir dist y dist-amigos en puertos distintos; los navegadores se ejecutan de a uno:
CHROME_PATH=/usr/bin/chromium AMIGO=0 FALLOS=1 node scripts/probar-escudo-recorrido.mjs http://127.0.0.1:4182/ test-results/escudo-pareja
CHROME_PATH=/usr/bin/chromium FALLOS=1 node scripts/probar-escudo-recorrido.mjs http://127.0.0.1:4184/ test-results/escudo-amigos
CHROME_PATH=/usr/bin/chromium node scripts/probar-escudo-mision.mjs http://127.0.0.1:4182/ test-results/escudo-p23
node scripts/_escudo_balance.mjs                     # balance (SEMILLAS=n, NIVEL=id, TORPE=1, F=multiplicador de vida)
```

- `escudo.html?nivel=grieta&bot=1&rapido=4`: el bot juega solo; `?vitrina=1`: todas las torres (niveles y ramas) y
  enemigos en fila. Ganchos: `window.__escudo` (`motor()`, `escena()`, `jugar(id)`, `saltar()`).
- Pruebas temporales: `scripts/_escudo_foto.mjs` (captura) y `scripts/_escudo_menu.mjs` (construir con
  confirmación, mejorar, oleada, habilidad).
- Los recorridos nuevos usan el piloto normal, los recursos del modo elegido y el paso fijo; las escenas se saltan.
  Los errores de almacenamiento son escrituras reales que rechazan. No certifican los controles físicos ni la campaña
  previa de la granja al entrar directamente al modo P23. No modifican el balance.

## Integración (hecha el 14 de octubre de 2026)

Quedó así: botón «El Escudo de las Hermanas» en el Cuarto de Juegos (`jugar('escudo')`), tarjeta en la Sala de Juegos
(tema `escudo`), y en la granja la batalla cuenta en el **último paso de P23 de la historia principal** (`historia.ts`:
el recibo `escudo-mision-P23` vale como la desactivación de la proyección de Nath'Gora; botones «Defender el Borde
(El Escudo)» y «Ya defendí el Borde» en `historia-ui.ts`; el recibo llega por `MotorGranja({escudo})`). El expediente
P23 de Astra (los relevos de la red) no se tocó: no es la batalla.

### Propuesta histórica · integración ya realizada

### 1. El Cuarto de Juegos de la casa (`src/casa/main.ts`)

En `JUEGOS` (cerca de la línea 1378) agregar:

```ts
  escudo: { punto: 'arcade', url: './escudo.html', nombre: 'El Escudo de las Hermanas' },
```

y un botón en el menú del Cuarto de Juegos igual a los de `sangre` / `granja` que llame `jugar('escudo')`. El juego
vuelve solo a `./index.html` al salir (en modo amigo, a `./amigos.html`).

### 2. La Sala de Juegos de amigos (`src/amigos/juegos.ts`)

`escudo.html` ya está en `PAGINAS_AMIGOS`, en `PERMITIDOS_AMIGOS` (`src/escudo/`), en `SUSTITUTOS`
(`src/escudo/pareja.ts` → `src/amigos/sin_pareja/escudo.ts`) y la versión de amigos copia sus modelos, sus voces
(`audio/escudo/`, nunca `audio/escudo-pareja/`), las tres criaturas y M16/M19/M20 (`vite.config.ts`;
`verificar-amigos.mjs` ya deja pasar esos audios). La propuesta pedía esta tarjeta en `JUEGOS`, ya integrada:

```ts
const ARTE_ESCUDO = `<svg viewBox="0 0 200 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="es" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2350"/><stop offset="1" stop-color="#0b0a1e"/></linearGradient></defs>
  <rect width="200" height="110" fill="url(#es)"/>
  ${Array.from({ length: 20 }, (_, k) => `<circle cx="${(k * 41) % 200}" cy="${(k * 23) % 60}" r="${k % 3 ? 0.9 : 1.6}" fill="#fff" opacity=".8"/>`).join('')}
  <path d="M10 92 Q60 70 100 84 T190 80 L190 110 L10 110z" fill="#5e8f86"/>
  <rect x="150" y="30" width="6" height="56" rx="3" fill="#ffe0a0"/><rect x="176" y="30" width="6" height="56" rx="3" fill="#d9c8ff"/>
  <rect x="156" y="32" width="20" height="52" fill="#9fd6ff" opacity=".35"/>
  <circle cx="60" cy="70" r="9" fill="#ffb040"/><circle cx="60" cy="70" r="4" fill="#fff0b0"/>
  ${[[24, 84], [36, 80], [46, 86]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#6a6372"/><circle cx="${x - 1.5}" cy="${y - 1}" r="1.2" fill="#fff"/>`).join('')}</svg>`;
// …y en JUEGOS, después de 'cocina':
  { id: 'escudo', nombre: 'El Escudo de las Hermanas', desc: 'Defiende el escudo de luz · torres y estrellas', arte: ARTE_ESCUDO, tema: 'escudo', url: './escudo.html' },
```

(Si `tema` necesita su color en el CSS de la sala, usar el de `sangre` o agregar `escudo` con fondo `#14123a`.)

### 3. La misión P23 de la granja (`src/granja-v3/`)

El juego ya hace su parte: `escudo.html?mision=P23` muestra la escena de la llegada, juega el nivel VI (con todas las
torres y 60 ✦ de más), y al ganar muestra la escena del final, guarda el recibo y vuelve a
`./granja-v3.html?escudo=P23`. Si pierde, puede reintentar o volver sin recibo. El recibo queda en `localStorage`:

```json
escudo-mision-P23 = {"v":1,"mision":"P23","ganada":true,"estrellas":2,"fecha":1760000000000}
```

La propuesta histórica de integración de granja indicaba lo siguiente; no es trabajo activo:

1. **Un paso nuevo en P23** (`astra-campana-datos.ts` / `astra-misiones-datos.ts`, o su generador), como primer paso
   real después de los testimonios:
   `{"id":"P23.escudo","tipo":"escudo","texto":"Defender el Borde de Astra: gana la batalla en El Escudo de las Hermanas."}`
2. **Comprobarlo** en `astra.ts`, junto a `st.tipo==='sangre'` (línea ~181):
   ```ts
   }else if(st.tipo==='escudo'){
    const r=recursos.escudo?.() as {v?:number;mision?:string;ganada?:boolean}|undefined;
    if(r?.v!==1||r.mision!=='P23'||r.ganada!==true)return mal('Defiende el Borde de Astra: abre «El Escudo de las Hermanas» desde este expediente.');
   ```
   con `escudo?:()=>unknown` en el tipo de `recursos` de `actuarAstra` y, en `main.ts` (donde se arma
   `new MotorGranja({… noche: …})`, línea ~112), pasar también
   `escudo:():unknown=>{try{return JSON.parse(localStorage.getItem('escudo-mision-P23')??'null');}catch{return null;}}`
   hasta `actuarAstra` (igual que `noche`).
3. **El botón**: en el panel del expediente (`astra-ui.ts`), cuando el paso actual sea `tipo:'escudo'`, un botón
   «Defender el Borde» que haga `location.href = './escudo.html?mision=P23'` (guardar la partida antes).
4. **Al volver** (`granja-v3.html?escudo=P23`): la granja carga normal; si está en el expediente P23, puede lanzar
   sola la acción `comprobar` para que el paso quede hecho y siga el giro (y después C09). El recibo es del aparato
   (no del personaje): si se quiere por personaje, guardar también `personaje` en el recibo y compararlo.

La película C09 sigue saliendo donde ya sale (el giro/cierre de P23): el Escudo es la batalla jugable de antes.

## Ampliación del 16 de octubre

Seis mapas nuevos, añadidos después del VI, con geometrías, entradas, rutas y ambientes propios. Conservan los
presupuestos y las oleadas de Cantera, Rosal, Puente y Grieta; no se alteran torres, enemigos, habilidades, costes,
recompensas, campaña anterior ni infinito. Una huella de regresión verifica ese contrato. Los IDs anteriores se
conservan; las estrellas del VI abren el VII sin repetir la campaña. La batalla P23 y su escena siguen en el VI.
Esta ampliación es del minijuego: no reanuda el desarrollo de granja.
