// Comprime los GLB exportados desde Blender (modelos-crudos/) hacia public/modelos/.
// meshopt + simplificación por tipo de modelo; se conservan los nodos vacíos (marcas de productos).
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// PLANO=1 genera una copia sin meshopt (solo cuantizada) para navegadores que bloquean WebAssembly.
const PLANO = process.env.PLANO === '1';
const CRUDOS = 'modelos-crudos';
const DESTINO = join('public', PLANO ? 'modelos-plano' : 'modelos');
mkdirSync(DESTINO, { recursive: true });

const BASE = ['--compress', PLANO ? 'quantize' : 'meshopt', '--flatten', 'false', '--instance', 'false', '--palette', 'false',
  '--texture-compress', 'false', '--prune', 'false', '--simplify', 'true'];
// Unir mallas reduce las llamadas de dibujo, pero borra los vacíos que marcan dónde van los productos:
// solo se une en productos (los personajes con esqueleto no se pueden unir).
const UNIR = ['--join', 'true', '--join-named', 'true'];
const SEPARAR = ['--join', 'false'];
const PERSONAJES = /^(el|ella|abuelita|mama|adolescente|nino|ejecutivo|deportista)\.glb$/;
// Mallas viejas de una pose por archivo: reemplazadas por el personaje animado
const POSES_VIEJAS = /^(el|ella|abuelita|mama|adolescente|nino|ejecutivo|deportista)_\w+\.glb$/;

// Simplificación guiada por el error máximo (fracción del tamaño del modelo), sin porcentaje fijo:
// solo se quitan triángulos que no cambian la forma (0,001 ≈ 3 mm en un personaje de 2,7 m).
function ajustes(nombre) {
  if (nombre === 'productos.glb') return [...UNIR, '--simplify-ratio', '0', '--simplify-error', '0.002'];
  if (nombre === 'el.glb' || nombre === 'ella.glb') return [...SEPARAR, '--simplify-ratio', '0', '--simplify-error', '0.001'];
  if (PERSONAJES.test(nombre)) return [...SEPARAR, '--simplify-ratio', '0', '--simplify-error', '0.0015'];
  return [...SEPARAR, '--simplify-ratio', '0', '--simplify-error', '0.001'];
}

// SOLO=regex optimiza solo esos archivos (p. ej. SOLO='^(casa_|regalo_|deco_)')
const SOLO = process.env.SOLO ? new RegExp(process.env.SOLO) : null;
const archivos = readdirSync(CRUDOS).filter((f) => f.endsWith('.glb') && !POSES_VIEJAS.test(f) && (!SOLO || SOLO.test(f)));
for (const f of archivos) {
  const salida = join(DESTINO, f);
  execFileSync('npx', ['gltf-transform', 'optimize', join(CRUDOS, f), salida, ...BASE, ...ajustes(f)], { stdio: 'pipe' });
  console.log('ok', f);
}
if (!PLANO) {
  for (const f of readdirSync(CRUDOS).filter((f) => f.endsWith('.json'))) cpSync(join(CRUDOS, f), join(DESTINO, f));
  // Íconos con guion bajo en vez de espacios (rutas limpias al publicar)
  if (existsSync(join(CRUDOS, 'iconos'))) {
    mkdirSync(join(DESTINO, 'iconos'), { recursive: true });
    for (const f of readdirSync(join(CRUDOS, 'iconos'))) cpSync(join(CRUDOS, 'iconos', f), join(DESTINO, 'iconos', f.replace(/ /g, '_')));
  }
}
console.log('listo:', archivos.length, 'modelos');
