# CLAUDE.md · Nuestro Hogar (juego de aniversario)

Lee este archivo antes de tocar nada. Lo demás se consulta solo cuando se va a tocar esa parte: el índice está en
[`docs/README.md`](docs/README.md) y la cola de trabajo en [`docs/pedidos.md`](docs/pedidos.md).

## 1. Qué es

**Nuestro Hogar** es un regalo de aniversario que **Javier** (Él, quien te escribe) le hace a **Laura** (Ella, su
esposa): una casa tipo mascota virtual de pareja (Tamagotchi / Pou / Talking Tom) donde viven los dos, con muchos
minijuegos adentro. Cada uno juega en su celular Android y la casa está siempre en línea (Supabase).

- Textos de la pareja: apodos y anécdotas en `docs/la-pareja.md`; la historia y los recuerdos en
  `docs/sistemas/cien-puertas.md` («La historia» y «Los recuerdos»).
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
docs/                    README.md (índice), pedidos.md (la cola), la-pareja.md
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
   sueltos con `CASA_SOLO=trofeos,cuna`); comida y decoración: `exportar_tienda_casa.py`.
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

## 9. Estado

Lo hecho está descrito en `docs/sistemas/`; lo que falta, en orden, en **`docs/pedidos.md`**. Frente a medias en
GitHub, sin juntar: `trabajo/show` (El Show de Nosotros). Para retomarlo:
`git fetch origin trabajo/show && git worktree add .wt/show trabajo/show` y
`ln -s "$PWD/juego/web/node_modules" .wt/show/juego/web/node_modules`; lo que falta está al final de su documento.

**Para Javier** (no lo puede hacer Claude): pegar `supabase/cambios-pendientes.sql` en el SQL Editor de Supabase y,
para las voces, poner `ELEVENLABS_API_KEY` en el entorno y permitir `api.elevenlabs.io`.

Cuando termines algo, actualiza `docs/pedidos.md` y el documento de `docs/sistemas/` que corresponda.
