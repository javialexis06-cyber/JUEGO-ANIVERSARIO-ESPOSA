# CLAUDE.md · Nuestro Hogar (juego de aniversario)

Lee este archivo antes de tocar nada. Lo demás se consulta solo cuando se va a tocar esa parte: el índice está en
[`docs/README.md`](docs/README.md) y la cola de trabajo en [`docs/pedidos.md`](docs/pedidos.md).

## 1. Qué es

**Nuestro Hogar** es un regalo de aniversario que **Javier** (Él, quien te escribe) le hace a **Laura** (Ella, su
esposa): una casa tipo mascota virtual de pareja (Tamagotchi / Pou / Talking Tom) donde viven los dos, con muchos
minijuegos adentro. Cada uno juega en su celular Android y la casa está siempre en línea (Supabase).

- Textos de la pareja: apodos y anécdotas en `docs/la-pareja.md`; la historia y los recuerdos en
  `docs/sistemas/cien-puertas.md` («La historia» y «Los recuerdos»).
- **Mitología de Astra** (`docs/mitologia.md`): la trae Javier del juego de la granja (lo hace otra IA y se juega a la
  par). Une la casa, la granja y Sangre y Ceniza; Él y Ella son los protagonistas y el Lazo Primordial es su amor. Los
  demás juegos son independientes.
- **Es una sorpresa.** Ella no debe enterarse del contenido antes de tiempo (por eso las voces se clonan con IA a
  partir de frases sueltas: `docs/en-obra/voces-ia.md`).
- Todo en **español colombiano cálido**: juego, comentarios, commits, documentos y lo que le respondes. Al usuario se
  le trata de tú.
- **El repositorio es público.** No subas nada más personal de lo que ya hay (nada de chats, teléfonos, nombres
  completos, salud ni peleas). Javier ya está avisado.
- Hay una versión **para amigos** («Sala de Juegos», `npm run build:amigos`) que nunca lleva nada de la pareja:
  `scripts/verificar-amigos.mjs` y `scripts/palabras-pareja.mjs` lo revisan. Ver `docs/sistemas/salas.md`.

## 2. Reglas de trabajo (no negociables)

- **Rama**: la APK y el instalador se compilan desde `claude/supermarket-mania-minigame-xn2it8` (Javier dio permiso
  para subir ahí). Si la sesión te asigna otra rama, trabaja en ella y sube también a esa. No abras PR sin que él lo
  pida.
- **Commit y push al terminar cada cosa** (un hook no deja cerrar con cambios sin subir). Cada push que toque
  `juego/web/` corre `.github/workflows/apk.yml`, que publica en Releases `NuestroHogar.apk/.exe` (la pareja) y
  `NuestroHogar-Amigos.apk/.exe` (amigos). Revisa que la corrida «APK Android» salga en verde; si falla, arréglala.
  Él prueba descargando:
  `https://github.com/javialexis06-cyber/juego-aniversario-esposa/releases/latest/download/NuestroHogar.apk`.
- Commits: título corto en español y cuerpo con viñetas de lo que cambia **para el jugador**. Sin nombres ni versiones
  de modelos de IA en commits, código ni documentos.
- **Uno por uno**: él manda listas numeradas; se hacen en orden, terminando uno (probado y subido) antes del
  siguiente. «Pausa X» o «X para lo último» se respeta.
- **Varios frentes a la vez** (solo si él lo autoriza): cada agente en su worktree (`.wt/<frente>`, rama
  `trabajo/<frente>`, `node_modules` enlazado, puerto de Vite propio); commit cada vez que algo compile y respaldo
  de las ramas en GitHub; el coordinador junta, prueba todo y sube.
- **Secretos**: en la app solo la URL de Supabase y la clave publicable (`sb_publishable_…`, en
  `src/casa/servidor.ts`); nunca `service_role` / `sb_secret_…` ni la contraseña de la base. La clave de ElevenLabs
  va solo en la variable `ELEVENLABS_API_KEY`: nunca se pide en el chat ni se escribe en archivos.
- Decide tú lo razonable y pregunta solo si cambia el resultado. «Continúa» después de un corte = sigue donde ibas.
- Muéstrale capturas de lo muy visual si lo pidió; para catálogos grandes: «crea muchos y que sean comprables».
- Al final de cada ítem, explícale en 3-6 líneas qué cambió y cómo probarlo en el celular.
- Scripts de prueba temporales: `juego/web/scripts/_*.mjs` (excluidos en `.git/info/exclude`; los `_*.ts` no, bórralos).

## 3. Cómo le gustan las cosas (calidad)

Él compara con otras IAs y se queda con la que entregue más calidad.

- **Personajes**: chibi de peluche, cabeza cuadradita redondeada, cuerpo gordito, manos y torso suaves, textura de
  fieltro/felpa; caras exageradas y graciosas, poses bien marcadas. Referencias en `archivo/renders/personajes/`.
- **Detalle**: nada se ve vacío (tiendas llenas, cuartos con cosas, cajas con su emblema). «Premium» = 5-6 veces más
  detalle. Nada tapa lo importante (la puerta, el dado, el tablero, los textos).
- **Ritmo**: jugabilidad ágil (días del súper de 1:30, personajes rápidos), pero las animaciones y reacciones se
  tienen que alcanzar a ver (la IA espera a que terminen).
- **Dificultad y economía**: retador pero pasable; mejoras con estrategia; monedas de la casa escasas; los mimos no
  dan monedas.
- **Celular Android en horizontal**: el juego ocupa casi toda la pantalla, botones pequeños, confirmar jugadas de
  precisión, joystick transparente abajo a la izquierda. Música suave. 30 cuadros por segundo, calidad que baja
  sola, soltar los contextos WebGL al salir de un minijuego.
- **Pareja y en línea**: todo se juega solo o en pareja, cada uno en su celular, sincronizado, con pausa si se corta.

## 4. Entorno

| Qué | Cómo |
|---|---|
| Node 22 + npm | `cd juego/web && npm ci` |
| Chromium de Playwright | ya viene en `/opt/pw-browsers` (no correr `playwright install`) |
| Blender 4.x (solo para modelos) | `sudo apt-get install -y blender` y `python3.12 -m pip install --break-system-packages numpy scikit-image scipy` |
| Pillow | `pip install pillow` (hojas de contacto) |
| Supabase | URL y clave publicable en `src/casa/servidor.ts`; esquema en `supabase/esquema.sql`; los cambios de SQL los pega Javier en el SQL Editor |
| ElevenLabs (pendiente) | `ELEVENLABS_API_KEY` y permitir `api.elevenlabs.io` |

La APK la compila GitHub Actions (usa las variables `SUPABASE_URL` y `SUPABASE_ANON_KEY` del repositorio si están).
El contenedor se borra entre sesiones: `npm ci` en cada sesión nueva (los modelos optimizados ya están en
`public/modelos/`; Blender solo hace falta para hacer o cambiar modelos). El Blender de Ubuntu no trae
OpenImageDenoise: `personajes/blender/escena.py` ya tiene el respaldo. Desde otra cuenta de Claude: GitHub conectado con
acceso a `javialexis06-cyber/juego-aniversario-esposa` y la red abierta a npm, PyPI, apt y GitHub.

## 5. Mapa del repositorio

```
CLAUDE.md                este archivo
docs/                    README.md (índice), pedidos.md (la cola), la-pareja.md, mitologia.md
  sistemas/              cómo funciona lo terminado (casa, súper, mesa y su Clue, Cien Puertas, salas, Sangre y
                         Ceniza, Supabase)
  en-obra/               propuesta de Sangre y Ceniza 2, escenas premium, voces
  referencias/           wikis de otros juegos transcritas (Deep Rock Galactic: Survivor, Vampire Survivors)
  archivo/               estudios y decisiones viejas
archivo/renders/         renders aprobados de referencia (personajes, súper, casa)
personajes/blender/      todo el modelado por código (Blender + Python) y los exportadores
                         (clue.py renderiza el tablero, los sospechosos y las armas del Clue a public/modelos/clue/)
supabase/                esquema, cambios pendientes y pruebas SQL
juego/web/               el juego (Vite + TypeScript + three.js + Capacitor)
  index.html → src/casa/   la casa         super.html → src/*.ts   Súper Manía
  puertas.html → src/puertas/  mesa.html → src/mesa/   sangre.html → src/sangre/
  amigos.html → src/amigos/ (sala de amigos)   src/salas/ (salas de hasta 4)
  public/modelos/        GLB optimizados (se suben)   modelos-crudos/  recién exportados (no se suben)
  scripts/               pruebas con Playwright, optimizadores, sprites, voces
  android/, android-amigos/   Capacitor (pareja y amigos)
juego/escritorio/        instalador de computador (Electron)
```

Archivos clave de la casa: `modelo.ts` (datos compartidos y su normalización), `sincro.ts` (Supabase / local),
`escena_casa.ts`, `mascota.ts` (Él y Ella: caminar, muebles, mimos, caras), `mimos.ts` (las variantes de los
mimos), `catalogo.ts`, `main.ts` (flujo e interfaz), `ampliacion.ts`, `trofeos.ts`.

## 6. Modelos 3D

1. Se hacen por código en `personajes/blender/*.py` (primitivas, SDF + marching cubes, materiales de fieltro).
2. Exportar: `python3 personajes/blender/exportar_glb.py juego/web/modelos-crudos <partes>` (o con `blender -b -P`;
   partes: `productos, vitrinas, letreros, utileria, tienda, iconos, animados, pareja, casa, regalos…`; cuartos
   sueltos con `CASA_SOLO=trofeos,cuna`); comida y decoración: `exportar_tienda_casa.py`. El local del súper (4
   tamaños, los sitios con el mismo número en todos) vive en `local_super.py`; `revisar_local.py <carpeta>` dibuja los
   planos y revisa caminos antes de exportar (`tienda`, con `TIENDA_SOLO=2,3` para unos solos).
3. Optimizar: `cd juego/web && npm run optimizar` (o `SOLO='^deco_x\.glb$' node scripts/optimizar-modelos.mjs`).
   Revisa `git status` después: el optimizador también copia JSON e íconos.
4. **Trampa**: el origen de cada objeto queda en el origen del mundo; construye en el origen y mueve después.
5. Revisa siempre los íconos en una hoja de contacto (mira el PNG) antes de subir.
6. Coordenadas de Blender (x, y en el piso; z arriba); `aTres(x, y, z)` → three.js (x, z, -y). Cuartos de
   5.4 × 4.2 m; cámara isométrica (azimut 38°, elevación 38°).

## 7. Cómo se prueba (siempre, antes de subir)

```bash
cd juego/web
npx tsc --noEmit -p .          # tipos
npx vite build                 # que compile (y npm run build:amigos si tocaste algo que vean los amigos)
npm run dev                    # http://localhost:5173 (casa), /super.html, /puertas.html, /mesa.html, /sangre.html
```

- Para pruebas largas: servidor sin recarga automática (otro puerto, `server: { hmr: false }`) o `vite preview` de
  un build (mucho más rápido).
- Chromium sin pantalla: `args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist']`, viewport **844×390**. La máquina tiene 4 núcleos: corre las pruebas de a una.
- Parámetros: casa `index.html?rol=el|ella&local=1&rapido=N`; súper `?bot=…`, `?linea=local&rol=…`; mesa
  `?juego=parchis2`, `?todas`, `?escena=<id>`; Sangre `?prueba=1&clase=…&infinito=1`.
- Ganchos de prueba en `window`: búscalos con `grep -rn "(window as any).__" src`.
- Scripts del repo: `probar-casa`, `probar-acciones`, `probar`, `probar-linea`, `probar-mesa-linea`, `probar-salas`,
  `probar-super-salas`, `probar-mesa-salas`, `probar-amigos`, `probar-amigos-juegos`, `probar-cuentas`,
  `probar-cocina-linea`, `probar-sangre`, `estres-casa`, `estres-super`, `verificar-amigos`.
- **Mira las capturas** (lee los PNG): la mayoría de errores de este proyecto son visuales.
- Las pestañas en segundo plano van lentas: si una prueba de varias pestañas falla por tiempos, puede ser la prueba.
  Ej.: `probar-lavado-salas` a veces falla solo en «Javier ve caminar a los tres» (a Laura no le llega la primera
  tecla); se repite UNA vez y, si pasa, era la prueba.
- Servidor de pruebas sin recarga (en el scratchpad, se pierde entre sesiones): un `vite-pruebas.config.mjs` con
  `import base from '<repo>/juego/web/vite.config.ts'; export default { ...base, root: '<repo>/juego/web',
  server: { host: true, hmr: false } }` y `npx vite --config <ese archivo> --port 5176`. Amigos:
  `npm run build:amigos && npx vite preview --mode amigos --port 5181`.
- Para probar una pantalla suelta sin la casa: una página falsa con `p.route(/_x\.html/, …)` que importa el módulo
  (ver `scripts/_lavado_mochila.mjs`); escenas premium: `mesa.html?escena=<id>&rol=el&congelar` y
  `__mesa.cine().simular(segundos)`.
- Pruebas largas: la salida a un archivo de log (nunca `| tail`, que no muestra nada hasta el final) y en segundo
  plano. Nunca `pkill -f "<texto>"` con un texto que aparece en tu propio comando (te matas a ti mismo, sale 144):
  usa el truco del corchete, `pkill -f "_balanc[e]2"`.
- Esperar la APK sin mirar a cada rato (en segundo plano):
  `until s=$(gh api "repos/javialexis06-cyber/juego-aniversario-esposa/actions/runs?branch=claude/supermarket-mania-minigame-xn2it8&per_page=1" --jq '.workflow_runs[0] | "\(.head_sha[0:7]) \(.status) \(.conclusion)"'); echo "$s" | grep -q "^<sha> completed"; do sleep 30; done; echo "$s"`

## 8. Cosas que ya se aprendieron

- Los datos compartidos de la casa pasan por `normalizar…` en `modelo.ts`: todo campo nuevo necesita su
  normalización o se pierde al sincronizar.
- Decoración: `c.deco[sitio] = "item[:foto][#rrggbb]"`; lo que tiene «tinte» en el material se puede pintar.
- El movimiento en vivo del otro va en `actividad.pos`. Los eventos entre celulares llevan sus datos en `datos`
  (por ejemplo, qué variante de mimo salió).
- Súper en línea: el anfitrión simula y manda una «foto» cada 100 ms; el invitado es un espejo con predicción.
- Parchís: un solo motor con `colores: 1 | 2`; el número va en la cara de ARRIBA del dado.
- Los minijuegos con su propio WebGL llaman `forceContextLoss()` al salir.
- Filtros CSS y `mix-blend-mode` sobre el lienzo hacen parpadear (o ver negro) en Android: usar un velo encima.
- Sombreadores: todo lo que se crea en pleno juego (efectos, marcas) se precalienta antes de `compileAsync`, si no el
  primer uso congela el cuadro.
- Nada se pierde de lo guardado: si cambias el nombre o el contenido de algo comprable, deja el mismo `id` (con un
  comentario de por qué) o pon la equivalencia vieja → nueva (`cartasViejas`, `disfracesViejos` en
  `src/casa/lavado/pareja.ts`); los ids desconocidos se descartan sin romper.
- Lo romántico tiene dueño: antes de escribir un recuerdo, carta, mimo o frase, mira «Quién cuenta qué» en
  `docs/la-pareja.md`. Nunca se repite un recuerdo de otro juego; si se acaban las ideas, se le piden historias a
  Javier.
- Todo texto de la pareja en un juego que también ven los amigos va en un archivo aparte con su versión vacía en
  `src/amigos/sin_pareja/` (SUSTITUTOS en `vite.config.ts`), como `lavado/pareja.ts` o `recuerdos_super.ts`. Si
  `verificar-amigos` marca una frase que es común (p. ej. «La suerte»), va a `COMUNES` en ese script.

## 9. Estado

Lo hecho está descrito en `docs/sistemas/`; lo que falta, en orden, en **`docs/pedidos.md`** (arriba de todo,
«Por dónde seguir», dice cuál es el siguiente y qué espera a Javier). Frente a medias en
GitHub, sin juntar: `trabajo/show` (El Show de Nosotros). Para retomarlo:
`git fetch origin trabajo/show && git worktree add .wt/show trabajo/show` y
`ln -s "$PWD/juego/web/node_modules" .wt/show/juego/web/node_modules`; lo que falta está al final de su documento.

**Para Javier** (no lo puede hacer Claude): pegar `supabase/cambios-pendientes.sql` en el SQL Editor de Supabase y,
para las voces, poner `ELEVENLABS_API_KEY` en el entorno y permitir `api.elevenlabs.io`.

Cuando termines algo, actualiza `docs/pedidos.md` y el documento de `docs/sistemas/` que corresponda.

## 10. Cómo trabaja Javier (lo aprendido en las sesiones)

- «**Sigue con lo que haga falta en la lista**»: toma el siguiente punto de `docs/pedidos.md` en orden, saltando lo
  que espera algo de él (está marcado). Por cada punto: hacerlo completo, probarlo (capturas incluidas), commit, push,
  APK en verde, tacharlo en `pedidos.md` con «**hecho**» y una línea de qué quedó, actualizar `docs/sistemas/`,
  contarle en 3-6 líneas qué cambió y cómo probarlo en el celular, y seguir con el siguiente sin preguntar.
- «**Revisa todas las tareas que he dicho de X para que no apliques cambios 1 x 1**»: junta todo lo que ha pedido de
  ese juego (pedidos, docs, el chat) y hazlo en una sola tanda. Antes, pregúntale SOLO las decisiones que cambian el
  resultado, con opciones cortas y la recomendada primero (así decidió el súper: «Como el original», «Abarrotes 2,
  bebidas 1», «Todo de una vez»).
- «**Continúa**» (también después de que se le acaba el uso): sigue exactamente donde ibas, sin resumir.
- Mientras trabajas, cuéntale en una línea qué estás haciendo cada tanto (no le gusta el silencio largo), pero sin
  narrar cada paso.
- Quiere calidad de juego comercial: si algo se ve pobre en la captura, se arregla antes de subir (ver §3). Prefiere
  que propongas y decidas tú lo razonable; se queda con lo que mejor se vea y se juegue.
- Pide mucho «como el original» (Supermarket Mania, Vampire Survivors, Deep Rock Galactic: Survivor): estudia las
  wikis de `docs/referencias/` antes de inventar.
- Las anécdotas reales las cuenta él; lo inventado (cartas del súper, cartas de amor) se marca para cambiarlo cuando
  él cuente más.

