# Súper Manía en Pareja · jugable web

Jugable de la tiendita de barrio (25 días, en solitario con Él) hecho con Three.js a partir de los modelos de Blender.

- Números de balance: `src/balance.ts` (capacidades, tiempos, clientes, mejoras, ayudas).
- Problemas del día: `src/problemas.ts` (ladrón, niña traviesa, basura, charcos, productos caídos).
- Ayudantes: `src/ayudantes.ts` (cajera, reponedor, aseo, guardia).
- Música y efectos sintetizados: `src/sonido.ts`.
- Noticias del Diario del Barrio y metas: `juego/datos/generar_niveles.py` → `public/datos/niveles.json`.

```bash
npm install
npm run dev                         # juego en http://localhost:5173
npm run build                       # revisa tipos y arma dist/
node scripts/empaquetar-artefacto.mjs   # versión para publicar como enlace (artefacto/)
node scripts/probar.mjs [url] [nivel] [carpeta] [ancho]x[alto] [partida.json]   # partida automática con capturas (usa ?bot)
```

## Modelos

1. Exportar desde Blender: `python3 personajes/blender/exportar_glb.py juego/web/modelos-crudos animados,animados2,productos,vitrinas,letreros,utileria,utileria2,tienda,iconos`
   (los personajes van con esqueleto y una animación por pose).
2. Optimizar: `npm run optimizar` → `public/modelos/` (meshopt, simplificación guiada por el error máximo, sin porcentaje fijo).
   `PLANO=1 npm run optimizar` genera `public/modelos-plano/`, la copia sin meshopt para navegadores que bloquean WebAssembly.

`modelos-crudos/` y `public/modelos-plano/` no se suben al repositorio (se regeneran).

## Aspecto

- Luz de ambiente (RoomEnvironment), sombras suaves y oclusión ambiental (N8AO) para acercarse a Cycles.
- Tono AgX + `saturate/contrast` en el lienzo para parecerse al «AgX Medium High Contrast» de los renders.
- El piso de baldosas se redibuja en el juego con los datos del material de Blender (`extras.baldosa`) y los colores medidos en el render.
- Si el celular no sostiene ~30 cuadros por segundo, se apaga la oclusión y se baja la resolución solo.
