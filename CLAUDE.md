# CLAUDE.md · Nuestro Hogar (juego de aniversario)

Lee todo este archivo antes de tocar nada. Aquí está lo que otra sesión de Claude aprendió trabajando semanas con
el dueño del proyecto: qué es el juego, cómo le gustan las cosas, cómo se instala, cómo se prueba y qué falta.

## 1. Qué es

**Nuestro Hogar** es un regalo de aniversario que **Él** (el esposo, quien te escribe) le está haciendo a
**Ella** (su esposa). Es una casa tipo mascota virtual de pareja (Tamagotchi / Pou / Talking Tom) donde viven los
dos personajes, con muchos minijuegos adentro. Cada uno juega en su celular Android y la casa está siempre en
línea (Supabase): cada uno ve lo que hace el otro en vivo.

- La historia real de la pareja, sus recuerdos y chistes internos están en `docs/cien-puertas.md` («La historia» y
  «Los recuerdos») y en `docs/guion-voces.md`. Úsalos para que los textos se sientan de ellos.
- **Es una sorpresa.** Ella no debe enterarse del contenido antes de tiempo (por eso las voces se clonan con IA a
  partir de frases sueltas, ver `docs/voces-ia.md`).
- Todo en **español colombiano cálido**: textos del juego, comentarios del código, commits, documentación y lo que
  le respondes al usuario. Nada de español neutro de manual: cariñoso, con humor, con referencias colombianas
  (arepa, vueltiao, chiva…). Al usuario se le trata de tú.

## 2. Reglas de trabajo (no negociables)

- **Rama**: la APK y el instalador se compilan desde `claude/supermarket-mania-minigame-xn2it8` (Javier dio
  permiso explícito para subir ahí). Si la sesión te asigna otra rama, trabaja en ella y sube a las dos
  (`git push origin HEAD:claude/supermarket-mania-minigame-xn2it8`). No abras PR sin que él lo pida.
- **Varios frentes a la vez**: cuando él lo autoriza («haz en paralelo lo de la misma tarea»), cada agente trabaja en
  su propio worktree (`.wt/<frente>`, rama `trabajo/<frente>`, `node_modules` enlazado, puerto de Vite propio) y el
  coordinador junta las ramas, prueba todo junto y sube. Los límites de uso cortan a los agentes cada pocas horas:
  que hagan commit cada vez que algo compile y respalda las ramas `trabajo/*` en GitHub.
- **Instalador para computador**: el mismo workflow arma `NuestroHogar.exe` (Electron, `juego/escritorio/`) y lo
  sube a la misma versión que la APK:
  `https://github.com/javialexis06-cyber/juego-aniversario-esposa/releases/latest/download/NuestroHogar.exe`.
- **Commit y push al terminar cada cosa** (hay un hook que no deja cerrar con cambios sin subir). Cada push que
  toque `juego/web/` compila la APK en GitHub Actions (`.github/workflows/apk.yml`) y la publica en Releases.
  Él prueba **descargando la APK** en su celular:
  `https://github.com/javialexis06-cyber/juego-aniversario-esposa/releases/latest/download/NuestroHogar.apk`.
  Después de subir, revisa que la corrida «APK Android» salga en verde; si falla, arréglala.
- En los commits: título corto en español y cuerpo con viñetas de lo que cambia **para el jugador**. No pongas
  nombres ni versiones de modelos de IA en commits, código ni documentos.
- **Uno por uno**: él manda listas numeradas. Se hacen **en orden, terminando uno (probado y subido) antes de
  empezar el siguiente**. Si dice «pausa X» o «X para lo último», se respeta.
- **Secretos**:
  - En la app solo van la URL de Supabase y la **clave publicable** (`sb_publishable_…`, en `src/casa/servidor.ts`).
    Nunca la `service_role` / `sb_secret_…` ni la contraseña de la base de datos.
  - La clave de ElevenLabs va **solo** en la variable de entorno `ELEVENLABS_API_KEY`. Nunca se la pidas en el chat
    ni la escribas en archivos.
- Decide tú lo razonable y pregunta solo si de verdad cambia el resultado («si tienes dudas me preguntas»). Cuando
  él dice «continúa» después de un corte por límite de uso, sigue exactamente donde ibas.
- Cuando algo es muy visual (un personaje nuevo, un diseño grande), muéstrale capturas antes de seguir si él lo
  pidió. Para catálogos grandes (ropa, comida, decoración) dijo: «no hace falta que me los muestres, crea muchos y
  que sean comprables».
- Al final de cada ítem, explícale en 3-6 líneas qué cambió y cómo probarlo en el celular.
- Los scripts de prueba temporales se llaman `juego/web/scripts/_*.mjs` (están en `.git/info/exclude`, no se suben).
  Los scripts sin guion bajo sí son del repo.

## 3. Cómo le gustan las cosas (calidad)

Esto es lo más importante. Él compara con otras IAs y se queda con la que entregue más calidad.

**Personajes (Él y Ella)**
- Estilo chibi de peluche: **cabeza cuadradita redondeada** (no esfera), cuerpo **gordito**, manos y torso suaves
  (nada que se vea geométrico o facetado), textura de **fieltro/felpa** en ropa y pelo (le encantó). Los colores
  pueden variar; lo que importa es la forma y el diseño. Referencias en `personajes/renders/`.
- Caras exageradas y graciosas (berrinche, llanto, risa, asco, amor), poses bien marcadas.

**Detalle y «que no se vea vacío»**
- Todo con mucho detalle y empeño: productos, cajas con su emblema (un filete en la de carnes, un pan en la de
  panadería), tiendas grandes y llenas, cuartos con cosas, niveles de Cien Puertas con objetos que distraen.
- «Premium» significa **5-6 veces más detalle** que lo base: texturas, molduras, piezas pequeñas.
- Nada tapa lo importante: la puerta en Cien Puertas, la cara de arriba del dado, los textos flotantes contra los
  letreros de «Él / Ella», el tablero de los juegos de mesa.

**Ritmo**
- La jugabilidad debe ser ágil (los días del súper duran 1:30, personajes rápidos). Él se queja si algo se siente
  lento.
- Pero las **animaciones y reacciones se tienen que alcanzar a ver**: no muy rápidas, que la IA espere a que
  terminen, fichas y piedras que se muevan a una velocidad que se pueda seguir.

**Dificultad y economía**
- Retador pero pasable. Que haya que **comprar mejoras con estrategia** para avanzar (no se gana quedándose en la
  caja todo el día). Modo luna / legendario más difícil.
- Las monedas de la casa son escasas (se bajaron 4 veces); los mimos básicos entre ellos no dan monedas.

**Pantalla y controles (celular Android en horizontal)**
- El juego ocupa la mayor parte de la pantalla; los personajes a un lado; botones y casillas pequeños. Confirmar
  antes de jugadas de precisión (líneas de Puntos y Cajas). Joystick transparente abajo a la izquierda en el súper.
- Durante las animaciones, el HUD se pone semitransparente o el juego se encoge para dar espacio.
- Música de fondo suave y no invasiva; sonidos reales en los acertijos de sonido (el timbre suena de verdad).
- Rendimiento: celulares normales. Cuidar el calor y la batería (30 cuadros por segundo, bajar calidad sola,
  soltar los contextos WebGL al salir de un minijuego, no tener todos los cuartos cargados).

**Pareja y en línea**
- Todo se puede jugar solo o en pareja. En línea cada uno en su celular y todo sincronizado (se ve al otro caminar,
  las invitaciones llegan a la casa, pausa si se corta la conexión).

## 4. Entorno: qué instalar

Se trabaja en Linux (Ubuntu 24.04 en la nube de Claude Code). Lista de lo que hace falta:

| Qué | Para qué | Cómo |
|---|---|---|
| Node 22 + npm | el juego web | `cd juego/web && npm ci` |
| Chromium de Playwright | pruebas y capturas | ya viene en `/opt/pw-browsers` (no correr `playwright install`); ejecutable `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (o el que haya en esa carpeta) |
| Blender 4.x | modelar y exportar | `sudo apt-get install -y blender` (Ubuntu trae 4.0.2 con Python 3.12) |
| numpy, scikit-image, scipy para el Python de Blender | `sdf.py` (marching cubes) y las piezas | `python3.12 -m pip install --break-system-packages numpy scikit-image scipy` |
| (opcional) `bpy` como módulo | exportar con `python3.11` en vez de `blender -b` | `python3.11 -m pip install bpy==4.2.0` |
| Pillow | hojas de contacto de íconos y capturas | `pip install pillow` |
| JDK 21 + Android SDK | solo si se compila la APK a mano | normalmente no: la compila GitHub Actions |
| Supabase | la casa en línea | ya creado; la URL y la clave publicable están en `src/casa/servidor.ts`; el esquema en `supabase/esquema.sql`, notas en `docs/supabase.md` |
| ElevenLabs (pendiente) | voces clonadas | variable `ELEVENLABS_API_KEY` y permitir `api.elevenlabs.io` en la red del entorno (ver `docs/voces-ia.md`) |

**Si abres el proyecto desde otra cuenta de Claude (Claude Code en la web):**
- La cuenta necesita GitHub conectado con acceso al repositorio `javialexis06-cyber/juego-aniversario-esposa`
  (para clonar, subir a la rama y ver las corridas de la APK).
- La red del entorno debe dejar salir a npm, PyPI, los repositorios de Ubuntu (apt) y GitHub. Para las voces,
  además `api.elevenlabs.io`.
- El contenedor se borra entre sesiones: `npm ci` y Blender se vuelven a instalar en cada sesión nueva. Los
  modelos ya optimizados están en `juego/web/public/modelos/`, así que Blender solo hace falta para hacer o
  cambiar modelos.
- La APK usa las variables del repositorio `SUPABASE_URL` y `SUPABASE_ANON_KEY` (GitHub → Settings → Secrets and
  variables → Actions); si no están, usa las de `src/casa/servidor.ts`.

El Blender de Ubuntu no trae OpenImageDenoise: `personajes/blender/escena.py` ya tiene el respaldo (más muestras sin
denoiser). Los cambios en la base de Supabase (SQL) los tiene que aplicar él en el panel de Supabase (o tú con
control del computador si él lo abre), porque aquí no hay clave de servicio.

## 5. Mapa del repositorio

```
CLAUDE.md                 este archivo
docs/                     diseño y decisiones (léelos antes de tocar cada parte)
  nuestro-hogar.md        LA CASA: cuartos, acciones, economía, tienda, ampliación, trofeos, mascota, cocina…
  mecanicas.md            Súper Manía: reglas, balance, en línea
  niveles.md, logros.md   progresión del súper (100 niveles, estrellas, lunas, coleccionables)
  cien-puertas.md         Cien Puertas + la historia real de la pareja
  juegos-mesa.md          Dice Party, Mancala, Puntos y Cajas, Parchís (1 o 2 colores)
  reacciones.md           reacciones de los personajes en los juegos de mesa
  escenas-premium.md      escenas pagas (EN PAUSA) y su plan
  voces-ia.md, guion-voces.md   voces con IA (pendiente)
  supabase.md, viabilidad-cooperativo-en-linea.md, auditoria.md, diseno-juego.md
personajes/blender/       todo el modelado por código (Blender + Python)
  el.py, ella.py, cuerpo.py, sdf.py, rig.py, poses.py   personajes, esqueleto y poses
  ropa*.py                ropa, peinados, accesorios y disfraces (con esqueleto)
  casa.py                 los cuartos de la casa y casa.json (puntos, sitios, marcas)
  productos.py, vitrinas.py, tiendas.py, utileria.py, clientes.py   el súper
  regalos.py, comidas.py, deco_nueva.py, deco_conceptos.py         tienda de la casa
  perro.py                mascotas y patio
  exportar_glb.py, exportar_tienda_casa.py                         exportadores
personajes/renders, supermercado/renders, casa/renders             renders de referencia aprobados
supabase/esquema.sql      tablas, políticas y funciones de la pareja
juego/web/                el juego (Vite + TypeScript + three.js + Capacitor)
  index.html → src/casa/  Nuestro Hogar (juego principal)
  super.html → src/*.ts   Súper Manía (minijuego)
  puertas.html → src/puertas/   Cien Puertas
  mesa.html → src/mesa/   juegos de mesa (+ src/reacciones, src/escenas)
  src/casa/cocina/        cocina de chef (wafles, fresas, frappés, estilo Papa's)
  public/modelos/         GLB optimizados + íconos (se suben al repo)
  modelos-crudos/         GLB recién exportados (no se suben)
  scripts/                pruebas con Playwright, optimizador, sprites, voces
  android/                proyecto Capacitor (horizontal, pantalla completa)
```

Archivos clave de la casa: `modelo.ts` (datos compartidos y su normalización), `sincro.ts` (Supabase / local, en
vivo), `escena_casa.ts` (cuartos 3D, decoración, trofeos, pantallas), `mascota.ts` (Él y Ella: caminar, usar
muebles, caras), `catalogo.ts` (tienda, conceptos de decoración), `main.ts` (todo el flujo y la interfaz),
`ampliacion.ts` (plano, trofeos, pintura, bebé), `trofeos.ts` y `sala_trofeos.ts` (trofeos y títulos).

## 6. Cómo se trabaja con los modelos 3D

1. Los modelos se hacen **por código** en `personajes/blender/*.py` (primitivas, SDF + marching cubes,
   modificadores, materiales de «arcilla/fieltro» en `clay.py`).
2. Exportar:
   - Todo lo grande: `python3 personajes/blender/exportar_glb.py juego/web/modelos-crudos <partes>` (o
     `blender -b -P personajes/blender/exportar_glb.py -- juego/web/modelos-crudos <partes>`). Partes: `productos,
     vitrinas, letreros, utileria, tienda, iconos, animados, pareja, casa, regalos, reaccion…`. Para cuartos sueltos:
     `CASA_SOLO=trofeos,cuna python3 exportar_glb.py <salida> casa`.
   - Comida y decoración de la tienda: `blender -b -P personajes/blender/exportar_tienda_casa.py -- juego/web/modelos-crudos [claves]`.
3. Optimizar a `public/modelos/`: `cd juego/web && npm run optimizar`, o solo algunos:
   `SOLO='^deco_(florero|cuadro_corazon)\.glb$' node scripts/optimizar-modelos.mjs`.
   Ojo: el optimizador también copia a `public/` los JSON y los íconos de `modelos-crudos/` (salta `ropa_*.json`):
   revisa `git status` después para no subir cosas que no querías cambiar.
4. **Trampa conocida**: el origen de cada objeto queda en el origen del mundo. Para girar una pieza, constrúyela en
   el origen y muévela después (o usa los «shapers» tipo `girar_y`); si la giras ya movida, gira alrededor del
   centro de la escena y queda mal (pasó con techos, aros, aletas, telescopios).
5. Revisa siempre los íconos en una hoja de contacto (mira el PNG) antes de subir: formas raras, piezas
   atravesadas o ids repetidos.
6. Coordenadas: el juego usa las de Blender (x, y en el piso; z arriba) y `aTres(x, y, z)` las pasa a three.js
   (x, z, -y). Los cuartos miden 5.4 × 4.2 m; la cámara es isométrica (azimut 38°, elevación 38°) desde el frente a
   la derecha, así que la pared del fondo y la izquierda son las que se ven.

## 7. Cómo se prueba (siempre, antes de subir)

```bash
cd juego/web
npx tsc --noEmit -p .          # tipos
npx vite build                 # que compile
npm run dev                    # http://localhost:5173 (casa), /super.html, /puertas.html, /mesa.html
```

- Para pruebas largas conviene un servidor sin recarga automática (otro puerto, `server: { hmr: false }`), así
  editar archivos no reinicia la página a mitad de la prueba.
- Chromium sin pantalla necesita WebGL por software:
  `args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']`,
  viewport de celular horizontal **844×390**.
- Parámetros útiles:
  - Casa: `index.html?rol=el|ella&local=1` (entra directo, sin servidor) y `&rapido=N` (acelera).
  - Súper: `super.html?bot=…` (piloto automático, `?bot=caja` solo cobra), `?linea=local&rol=el|ella` (en línea
    entre dos pestañas).
  - Mesa: `mesa.html?juego=parchis2`, `?todas` (todas las escenas), `?escena=<id>`.
- Ganchos de prueba en `window`: `__listo`, `__casa()`, `__casa3d()`, `__mundo()`, `__mascotas()`, `__escena(rol)`,
  `__decorar(sitio)`, `__sitio(id)`, `__cocinaXp(…)`, `__hacer`, `__accion`, `__logros`, `__monedas`, `__nalgada`…
  (búscalos con `grep -rn "(window as any).__" src`).
- Scripts del repo: `probar-casa.mjs` (Él y Ella en dos pestañas: compras, mimos, regalo, nota, decorar, baño,
  dormir, sofá…), `probar-acciones.mjs`, `probar.mjs` (partida del súper), `probar-linea.mjs`,
  `probar-mesa-linea.mjs`, `estres-casa.mjs`, `estres-super.mjs`.
- **Mira las capturas** (lee los PNG). La mayoría de errores de este proyecto son visuales: cosas que se
  atraviesan, textos tapados, piezas giradas, algo que no se ve.
- Las pestañas en segundo plano de Chromium sin pantalla van lentas: si una prueba de dos pestañas falla por
  tiempos, puede ser la prueba y no el juego.

## 8. Cosas que ya se aprendieron (para no repetir errores)

- Los datos compartidos de la casa pasan por `normalizar…` en `modelo.ts`: todo campo nuevo necesita su
  normalización o se pierde al sincronizar.
- La decoración se guarda como `c.deco[sitio] = "item[:foto][#rrggbb]"`; lo que tiene «tinte» en el nombre del
  material se puede pintar.
- El movimiento en vivo del otro va en `actividad.pos` (fila de personajes en Supabase).
- Súper en línea: el anfitrión simula y manda una «foto» cada 100 ms; el invitado es un espejo con predicción de
  su joystick (`src/espejo.ts`, `src/linea_super.ts`).
- Parchís: un solo motor de reglas con `colores: 1 | 2` (el juego `parchis2` de la mesa). El número que salió va
  en la cara de ARRIBA del dado.
- Los minijuegos con su propio WebGL deben llamar `forceContextLoss()` al salir (si no, Android deja la casa en
  blanco después de varias veces).
- Filtros CSS sobre el lienzo hacen parpadear en Android: usar un velo (`#velo`) encima.

## 9. Estado actual y pendientes

Hecho, probado y subido (además de todo lo de antes: casa, súper, Cien Puertas, mesa, cocina, retrete, lavado…):
- **Auditoría** completa, segundo plano (la app se duerme y calla al salir), modelos comprimidos
  (`docs/auditoria.md`). `supabase/cambios-pendientes.sql` lo tiene que pegar Javier en el SQL Editor de Supabase.
- **Lavarse la cara** = Vampire Survivors completo (30 min, oleadas por minuto, evoluciones, cofres, tienda,
  disfraces, tres escenarios), hasta 4 jugadores con salas, ataque a mano o solito, tutorial, modo neutro con amigos.
- **Retrete espacial** con tramos, poderes, misiones, tienda, rojo/dorado, «Volar otra vez» y volar al sentarse.
- **Cocina** con gráficos renderizados y en pareja.
- **Salas de hasta 4** (`src/salas/`, `docs/salas.md`) y **modo amigo** básico (`amigos.html`): los amigos nunca
  ven la casa ni nada personal (`scripts/probar-amigos.mjs` lo verifica).
- **Sangre y Ceniza** (`sangre.html`, `src/sangre/`, `docs/sangre-y-ceniza.md`, `docs/sangre-figuras.md`): el
  survivors oscuro de expediciones estilo Deep Rock Galactic, 12 clases, 5 biomas, hasta 4 jugadores.
- **Versión de computador** (`juego/escritorio/`, Esc = atrás, F11 = pantalla completa).
- Los nombres son **Javier** y **Laura** (`NOMBRE_ROL`); apodos y anécdotas en `docs/la-pareja.md`.

**Pendientes**: la lista viva, en orden, está en **`docs/pedidos.md`** (lo siguiente: el creador de personajes y la
entrada como invitado para los amigos; luego la ronda 2 de arreglos, el sótano de terror, el juego de crímenes y lo
acumulado: Cien Puertas en obra en `.wt/puertas`, Show de Nosotros en obra en `.wt/show`, tele compartida, tocador
de Laura, escenas premium). Las voces con IA siguen esperando la clave de ElevenLabs.

Cuando termines algo nuevo, actualiza esta sección, `docs/pedidos.md` y el documento de `docs/` que corresponda.

## 10. Entrega al siguiente Claude (dónde quedó cada cosa)

Javier pidió parar después del frente de amigos y dejar todo apuntado. Así quedó:

**Ramas**
- `claude/compassionate-thompson-33ekiu` es la rama de integración y `claude/supermarket-mania-minigame-xn2it8` (la
  de la APK) va igual. Todo lo terminado está ahí.
- Hay dos frentes **a medias**, respaldados en GitHub y sin juntar con la principal:
  - `trabajo/puertas` — **Cien Puertas: arreglos y modo pareja**. Ya hecho: papelitos del piso legibles y con
    prioridad de toque, zonas protegidas (nada tapa la puerta ni lo importante; las estrellas de la puerta 8
    quedaron a la vista), revisión con rayos y `scripts/revisar-puertas.mjs` (las 100 puertas con semillas y
    `--revolver`), modo pareja completo (cada uno en su celular, anfitrión/invitado, invitación en la casa,
    acercamientos, brillos, pausa) con `scripts/probar-puertas-linea.mjs`. Falta: juntar la rama principal en
    ella (`git merge`), correr `revisar-puertas.mjs 1 100 --semillas=0,1,2 --revolver` y `probar-puertas-linea.mjs`,
    mirar fotos de varias puertas, juntar y subir. Todo está explicado en `docs/cien-puertas.md`.
  - `trabajo/show` — **El Show de Nosotros** (concurso de preguntas de pareja tipo programa de televisión, en la
    mesa: `mesa.html?juego=show`). Ya hecho: estudio 3D (`personajes/blender/show.py` → `show_estudio.glb`), luces,
    pantallas, público, presentador perrito, cámara con planos, seis tipos de preguntas, pregunta del día en la
    nevera, el libro de nosotros, en línea con su prueba. El último commit (`ab7d01a`, «avance en obra») guardó
    cambios que quedaron sin revisar cuando se pausó. Falta: revisar ese commit, correr `probar-show.mjs` y
    `probar-show-linea.mjs`, mirar capturas del estudio (que se vean Javier y Laura en la tarima, el texto de las
    pantallas al derecho), juntar con la principal y subir. Diseño en `docs/show.md`.
- Para retomar uno: `git fetch origin trabajo/<frente> && git worktree add .wt/<frente> trabajo/<frente>` y
  `ln -s "$PWD/juego/web/node_modules" .wt/<frente>/juego/web/node_modules`.
- Las demás ramas `trabajo/*` (auditoria, lavado, cocina, retrete2, salas, sangre, sangre-biomas, sangre-figuras,
  arreglos, cohete) ya están juntadas: se pueden borrar.

**Lo que sigue**, en orden: `docs/pedidos.md`. Lo primero que Javier marcó como prioridad alta son las **cuentas con
contraseña** (el mismo progreso desde cualquier aparato, un solo Javier y una sola Laura) y las **correcciones de
Sangre y Ceniza**; luego la ronda 2 de arreglos, el sótano de terror, el juego de crímenes y lo acumulado.

**Para Javier** (no lo puede hacer Claude): pegar `supabase/cambios-pendientes.sql` en el SQL Editor de Supabase y,
para las voces, poner `ELEVENLABS_API_KEY` en el entorno y permitir `api.elevenlabs.io`.
