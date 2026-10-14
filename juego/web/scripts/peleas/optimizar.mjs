// Comprime los modelos del torneo (modelos-crudos/peleas/*.glb → public/modelos/peleas/): meshopt, y las mallas de
// cada pieza juntas por material (lo quieto del escenario queda en muy pocas llamadas de dibujo).
// Uso: node scripts/peleas/optimizar.mjs [plaza,brasaviva,…]   (sin argumento: todos)
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CRUDOS = 'modelos-crudos/peleas';
const SOLO = process.argv[2]?.split(',');
for (const plano of [false]) {
  const destino = join('public', plano ? 'modelos-plano' : 'modelos', 'peleas');
  mkdirSync(destino, { recursive: true });
  for (const f of readdirSync(CRUDOS).filter((f) => f.endsWith('.glb') && (!SOLO || SOLO.includes(f.replace('.glb', ''))))) {
    execFileSync('npx', ['gltf-transform', 'optimize', join(CRUDOS, f), join(destino, f), '--compress', plano ? 'quantize' : 'meshopt', '--flatten', 'false', '--instance', 'false',
      '--palette', 'false', '--texture-compress', 'false', '--prune', 'false', '--simplify', process.env.SIMPLIFICAR === '0' ? 'false' : 'true', '--join', 'true', '--join-named', 'true', '--simplify-ratio', '0',
      '--simplify-error', process.env.ERROR ?? '0.00012'], { stdio: 'pipe' });
    console.log(plano ? 'plano' : 'ok', f, (statSync(join(destino, f)).size / 1e6).toFixed(2), 'MB');
  }
}
