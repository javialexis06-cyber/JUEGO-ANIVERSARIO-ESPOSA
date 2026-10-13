// Saca las fotos de «Desaparecidos de Astra» con el motor de cine de la granja (escenarios en fotos-escenas.ts).
//   node scripts/celular/fotos.mjs c1            → todas las fotos del caso 1
//   node scripts/celular/fotos.mjs c1 c1_cocina  → solo un escenario
//   SALIDA=<carpeta> para probar sin tocar public/celular/fotos
// Necesita el servidor de Vite (PUERTO, por defecto 5193), Chromium de Playwright y ffmpeg.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const [caso, solo] = process.argv.slice(2);
const PUERTO = process.env.PUERTO ?? '5193';
const SALIDA = process.env.SALIDA ?? 'public/celular/fotos';
mkdirSync(SALIDA, { recursive: true });
const W = 960, H = 540;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p0 = await b.newPage();
await p0.route(/_lista\.html/, (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><script type="module">import { SETS } from '/scripts/celular/fotos-escenas.ts'; window.__sets = Object.fromEntries(Object.entries(SETS).map(([k, v]) => [k, v.map((s) => s.id)]));</script>` }));
await p0.goto(`http://localhost:${PUERTO}/_lista.html`);
await p0.waitForFunction(() => window.__sets, null, { timeout: 120000 });
const sets = (await p0.evaluate(() => window.__sets))[caso] ?? [];
await p0.close();
for (const id of sets) {
  if (solo && !solo.split(',').includes(id)) continue;
  const p = await b.newPage({ viewport: { width: W, height: H } });
  p.on('pageerror', (e) => console.log('ERROR', id, e.message));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('  ', m.text().slice(0, 160)); });
  await p.route(/_foto\.html/, (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta charset="utf-8"><style>.cg-franja,.cg-sub,.cg-titulo,.cg-saltar{display:none!important}
  #marca{position:fixed;inset:0;z-index:99;pointer-events:none;font:700 22px monospace;color:#fff;display:none}
  #marca.on{display:block;background:repeating-linear-gradient(180deg,#0000 0 3px,#0002 3px 4px)}
  #marca b{position:absolute;left:24px;top:20px;text-shadow:0 0 4px #000}#marca i{position:absolute;right:28px;top:20px;color:#ff3a3a;font-style:normal}</style></head><body style="margin:0;background:#000"><div id="marca"><b></b><i>● REC</i></div>
<script type="module">
import { CineGranja } from '/src/granja-v3/cine-granja.ts';
import { SETS, guionDe } from '/scripts/celular/fotos-escenas.ts';
const s = SETS['${caso}'].find((x) => x.id === '${id}');
const g = guionDe(s);
const c = new CineGranja(g, {}, true);
await c.preparar();
window.__c = c; window.__tomas = s.tomas; window.__listo = true;
</script></body></html>` }));
  const t0 = Date.now();
  await p.goto(`http://localhost:${PUERTO}/_foto.html`);
  await p.waitForFunction(() => window.__listo, null, { timeout: 400000 });
  const tomas = await p.evaluate(() => window.__tomas.map((t, i) => ({ id: t.id, cuadrado: !!t.cuadrado, filtro: t.filtro ?? '', marca: t.marca ?? '', inicio: window.__c.linea[i].inicio })));
  let ahora = 0;
  for (const t of tomas) {
    const meta = t.inicio + 0.6;
    await p.evaluate((d) => window.__c.simular(d), meta - ahora);
    ahora = meta;
    await p.evaluate(({ filtro, marca }) => {
      const cv = document.querySelector('.cine-granja canvas');
      cv.style.filter = filtro === 'sepia' ? 'sepia(.85) contrast(1.05) brightness(1.05)' : filtro === 'camara' ? 'grayscale(1) contrast(1.35) brightness(.85)' : filtro === 'oscura' ? 'brightness(.85)' : '';
      const m = document.getElementById('marca');
      m.className = filtro === 'camara' ? 'on' : '';
      m.querySelector('b').textContent = marca;
    }, t);
    await p.waitForTimeout(150);
    const png = join(SALIDA, `_${t.id}.png`);
    if (t.cuadrado) await p.screenshot({ path: png, clip: { x: (W - H) / 2, y: 0, width: H, height: H } });
    else await p.screenshot({ path: png });
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', png, '-vf', t.cuadrado ? 'scale=240:240' : 'scale=800:450', '-q:v', '5', join(SALIDA, `${t.id}.jpg`)]);
    unlinkSync(png);
    console.log(`  ✓ ${t.id}`);
  }
  console.log(`${id}: ${tomas.length} fotos en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  await p.close();
}
await b.close();
