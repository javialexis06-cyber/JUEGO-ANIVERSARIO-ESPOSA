# Nuestro Hogar (con el minijuego Súper Manía) · web y Android

Dos páginas hechas con Three.js a partir de los modelos de Blender:

- **`index.html` → Nuestro Hogar**, el juego principal: la mascota de pareja (ver [`docs/nuestro-hogar.md`](../../docs/nuestro-hogar.md)).
  Código en `src/casa/`: `modelo.ts` (necesidades y datos), `catalogo.ts` (tienda), `sincro.ts` (Supabase o local),
  `escena_casa.ts` (cuartos y decoración), `mascota.ts` (Él y Ella: acciones, caras y mimos), `ui_casa.ts` y `main.ts`.
- **`super.html` → Súper Manía en Pareja**, el minijuego de la tiendita (25 días). Un tercio de la ganancia de cada día
  pasa a la casa como sueldo.

Del minijuego:

- Números de balance: `src/balance.ts` (capacidades, tiempos, clientes, mejoras, ayudas).
- Problemas del día: `src/problemas.ts` (ladrón, niña traviesa, basura, charcos, productos caídos).
- Ayudantes: `src/ayudantes.ts` (cajera, reponedor, aseo, guardia).
- Música y efectos sintetizados: `src/sonido.ts`.
- Noticias del Diario del Barrio y metas: `juego/datos/generar_niveles.py` → `public/datos/niveles.json`.

```bash
npm install
npm run dev                         # casa en http://localhost:5173 y súper en /super.html
npm run build                       # revisa tipos y arma dist/
node scripts/empaquetar-artefacto.mjs   # versión para publicar como enlace (artefacto/)
node scripts/probar.mjs [url/super.html] [nivel] [carpeta] [ancho]x[alto] [partida.json]   # partida automática del súper (usa ?bot)
node scripts/probar-casa.mjs [url] [carpeta] [ancho]x[alto]   # la casa con Él y Ella en dos pestañas (modo local)
node scripts/probar-acciones.mjs [url] [carpeta]              # comer, tele, sofá y clóset, con capturas
```

En la casa, `?rol=el|ella&local=1` entra directo sin la bienvenida y `&rapido=N` acelera los pasos (pruebas).


## Modelos

1. Exportar desde Blender: `python3 personajes/blender/exportar_glb.py juego/web/modelos-crudos animados,animados2,productos,vitrinas,letreros,utileria,utileria2,tienda,iconos`
   y para la casa `pareja,casa,regalos` (Él y Ella con las poses de mascota y sus caras, los cuatro cuartos con `casa.json`,
   regalos y decoración con sus íconos). Los personajes van con esqueleto y una animación por pose.
2. Optimizar: `npm run optimizar` → `public/modelos/` (meshopt, simplificación guiada por el error máximo, sin porcentaje fijo).
   `SOLO='^(casa_|regalo_|deco_)' npm run optimizar` optimiza solo esos archivos.
   `PLANO=1 npm run optimizar` genera `public/modelos-plano/`, la copia sin meshopt para navegadores que bloquean WebAssembly.

`modelos-crudos/` y `public/modelos-plano/` no se suben al repositorio (se regeneran).

## Aspecto

- Luz de ambiente (RoomEnvironment), sombras suaves y oclusión ambiental (N8AO) para acercarse a Cycles.
- Tono AgX + `saturate/contrast` en el lienzo para parecerse al «AgX Medium High Contrast» de los renders.
- El piso de baldosas se redibuja en el juego con los datos del material de Blender (`extras.baldosa`) y los colores medidos en el render.
- Si el celular no sostiene ~30 cuadros por segundo, se apaga la oclusión y se baja la resolución solo.

## App de Android (APK)

El proyecto de Android está en `android/` (Capacitor: el mismo juego web dentro de una app).
GitHub Actions (`.github/workflows/apk.yml`) compila la APK en cada cambio de `juego/web/` y la publica en
**Releases**; la más reciente siempre está en
`https://github.com/javialexis06-cyber/juego-aniversario-esposa/releases/latest/download/NuestroHogar.apk`.

- La app abre la casa; desde Menú → Minijuegos se entra al súper y el botón «atrás» del menú del súper vuelve a la casa.
- La app va en horizontal, a pantalla completa y sin apagar la pantalla; en el súper el botón «atrás» pausa el día.
- El servidor de la pareja (Supabase) se pone en `src/casa/servidor.ts`, en las variables del repositorio
  `SUPABASE_URL` y `SUPABASE_ANON_KEY` (las usa la compilación), o dentro de la app en Menú → Ajustes.
- Se firma con la clave de depuración estándar de Android (`android/app/debug.keystore`, pública por diseño) para que
  cada versión se instale encima de la anterior sin perder el progreso. Para Play Store se usaría otra clave, privada.
- Compilar a mano (con Android SDK): `npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`.
