// Comprime las figuras de Sangre y Ceniza hechas en Blender (personajes/blender/sangre_*.py):
//   modelos-crudos/sangre/*.glb  → public/modelos/sangre/   (enemigos, jefes, armas, proyectiles, cosas + sus .json)
//   modelos-crudos/ropa/sangre_*.glb → public/modelos/ropa/  (los trajes de las clases, con el esqueleto)
// Sin juntar, aplanar ni instanciar: el juego busca cada pieza por nombre (cabeza, brazo_izq…) y la gira en su
// articulación. Tampoco toca los JSON ni los íconos de los demás (a diferencia de optimizar-modelos.mjs).
// SOLO=regex limita los archivos (p. ej. SOLO='enemigos|armas' o SOLO='sangre_monarca').
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SOLO = process.env.SOLO ? new RegExp(process.env.SOLO) : null;
const BASE = ['--compress', 'meshopt', '--flatten', 'false', '--instance', 'false', '--join', 'false', '--palette', 'false',
  '--texture-compress', 'false', '--prune', 'false', '--simplify', 'true', '--simplify-ratio', '0'];

function optimizar(origen, destino, error) {
  execFileSync('npx', ['gltf-transform', 'optimize', origen, destino, ...BASE, '--simplify-error', String(error)], { stdio: 'pipe' });
}

let n = 0;
const CRUDOS = join('modelos-crudos', 'sangre');
const DESTINO = join('public', 'modelos', 'sangre');
if (existsSync(CRUDOS)) {
  mkdirSync(DESTINO, { recursive: true });
  for (const f of readdirSync(CRUDOS)) {
    if (f.includes('_prueba') || (SOLO && !SOLO.test(f))) continue;
    if (f.endsWith('.glb')) {
      optimizar(join(CRUDOS, f), join(DESTINO, f), 0.0006);
      console.log('ok', f);
      n++;
    } else if (f.endsWith('.json')) {
      copyFileSync(join(CRUDOS, f), join(DESTINO, f));
    }
  }
}
const ROPA = join('modelos-crudos', 'ropa');
if (existsSync(ROPA)) {
  mkdirSync(join('public', 'modelos', 'ropa'), { recursive: true });
  for (const f of readdirSync(ROPA).filter((f) => f.startsWith('sangre_') && f.endsWith('.glb') && (!SOLO || SOLO.test(f)))) {
    optimizar(join(ROPA, f), join('public', 'modelos', 'ropa', f), 0.003);
    console.log('ok ropa/' + f);
    n++;
  }
}
console.log('listo:', n, 'modelos');
