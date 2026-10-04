// Comprime los biomas de Sangre y Ceniza (modelos-crudos/sangre/bioma_*.glb) hacia public/modelos/sangre/.
// meshopt sin juntar ni aplanar: el juego busca cada pieza por su nombre (piso_*, pared_*, veta_*, deco_*, luz_*) y
// los vacíos `llama*`. Sin simplificar: las piezas ya salen de Blender con sus triángulos contados.
// Uso: node scripts/optimizar-biomas.mjs [cementerio,catacumbas,...]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CRUDOS = join('modelos-crudos', 'sangre');
const DESTINO = join('public', 'modelos', 'sangre');
mkdirSync(DESTINO, { recursive: true });
const solo = process.argv[2] ? process.argv[2].split(',') : null;
if (!existsSync(CRUDOS)) throw new Error(`No existe ${CRUDOS}: exporta primero con personajes/blender/sangre_biomas.py`);
const archivos = readdirSync(CRUDOS).filter((f) => /^bioma_\w+\.glb$/.test(f) && (!solo || solo.includes(f.slice(6, -4))));
for (const f of archivos) {
  const salida = join(DESTINO, f);
  execFileSync('npx', ['gltf-transform', 'optimize', join(CRUDOS, f), salida, '--compress', 'meshopt', '--flatten', 'false',
    '--instance', 'false', '--join', 'false', '--palette', 'false', '--texture-compress', 'false', '--prune', 'false',
    '--simplify', 'false'], { stdio: 'pipe' });
  console.log('ok', f, (statSync(join(CRUDOS, f)).size / 1e6).toFixed(2), '→', (statSync(salida).size / 1e6).toFixed(2), 'MB');
}
