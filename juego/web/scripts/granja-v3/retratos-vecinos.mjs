// Retratos de los vecinos (los peluches de Blender vestidos con su ropa): una foto de cara y hombros de cada uno,
// con fondo transparente, en public/granja/retratos/<id>.webp. Se corre con el servidor de Vite prendido:
//   node scripts/granja-v3/retratos-vecinos.mjs [http://127.0.0.1:5176] [ids,separados,por,comas]
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const base = process.argv[2] ?? 'http://127.0.0.1:5176';
const solo = process.argv[3]?.split(',').filter(Boolean);
const salida = fileURLToPath(new URL('../../public/granja/retratos/', import.meta.url));
mkdirSync(salida, { recursive: true });
const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch({ executablePath: existsSync(PRE) ? PRE : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await nav.newPage({ viewport: { width: 400, height: 400 } });
p.setDefaultTimeout(300000);
p.on('pageerror', (e) => console.log('ERR', String(e)));
await p.route(/_retratos\.html$/, (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html><body style="margin:0;background:#0000"><canvas id="c" width="320" height="320"></canvas><script type="module">
import * as THREE from 'three';
import { vecinoPeluche } from '/src/granja-v3/vecinos3d.ts';
import { NPC_ASTRA } from '/src/granja-v3/astra.ts';
import { NPCS_PUEBLO } from '/src/granja-v3/pueblo-datos.ts';
const r = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), alpha: true, antialias: true, preserveDrawingBuffer: true });
r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.AgXToneMapping; r.toneMappingExposure = 1.15; r.setClearColor(0, 0);
const escena = new THREE.Scene();
escena.add(new THREE.HemisphereLight('#fff8e5', '#8a9a70', 1.9));
const sol = new THREE.DirectionalLight('#fff0d7', 2.6); sol.position.set(1.5, 3, 4); escena.add(sol);
const relleno = new THREE.DirectionalLight('#cfe3ff', .9); relleno.position.set(-3, 1.5, 2); escena.add(relleno);
const cam = new THREE.PerspectiveCamera(26, 1, .05, 50);
window.ids = [...new Set([...NPCS_PUEBLO.map((n) => n.id), ...NPC_ASTRA.map((n) => n.id)])];
const mallas = (g) => { let n = 0; g.traverse((o) => { if (o.isMesh) n++; }); return n; };
window.foto = async (id, i) => {
  const g = vecinoPeluche(id, i); escena.add(g);
  // Espera a que lo vistan (las mallas dejan de cambiar)
  let antes = -1, igual = 0;
  for (let k = 0; k < 160 && igual < 6; k++) { await new Promise((ok) => setTimeout(ok, 120)); const n = mallas(g); igual = n === antes && n > 3 ? igual + 1 : 0; antes = n; }
  g.rotation.y = -0.32; g.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(g), alto = caja.max.y - caja.min.y, cx = (caja.max.x + caja.min.x) / 2;
  const mira = new THREE.Vector3(cx, caja.max.y - alto * 0.3, 0);
  cam.position.set(cx + alto * 0.35, mira.y + alto * 0.05, alto * 2.35); cam.lookAt(mira);
  r.render(escena, cam);
  const c = document.createElement('canvas'); c.width = c.height = 160; c.getContext('2d').drawImage(r.domElement, 0, 0, 160, 160);
  escena.remove(g);
  return c.toDataURL('image/webp', 0.88);
};
window.listo = true;
</script></body></html>` }));
await p.goto(`${base}/_retratos.html`);
await p.waitForFunction(() => window.listo, null, { timeout: 300000 });
const ids = solo ?? (await p.evaluate(() => window.ids));
let n = 0;
for (const [i, id] of ids.entries()) {
  const url = await p.evaluate(([id, i]) => window.foto(id, i), [id, i]);
  writeFileSync(salida + id + '.webp', Buffer.from(url.split(',')[1], 'base64'));
  n++; if (n % 20 === 0) console.log(n, 'de', ids.length);
}
console.log('retratos', n);
await nav.close();
