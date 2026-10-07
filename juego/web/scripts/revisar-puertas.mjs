// Revisión sistemática de Cien Puertas: recorre las puertas una por una con el desorden puesto (y con varias
// semillas, para que el reguero cambie), resuelve cada una con su prueba automática (toques y sensores simulados,
// como los haría alguien) y registra lo que falle:
//   - la prueba no pasa o se traba (no se puede tocar algo, el panel no abre, no responde);
//   - algo tapa la puerta o algo importante (lo que se toca, las pistas pintadas, los papelitos), revisado con
//     rayos desde la cámara en la vista general y en cada acercamiento que use el nivel;
//   - cosas del acertijo o del desorden que quedaron fuera del cuarto o con posiciones rotas;
//   - errores de la página.
// Con --revolver, antes de resolver se tira todo el desorden por el aire (como alguien que lo revuelve todo) y se
// revisa otra vez cuando se queda quieto. Con --fotos guarda una foto de cada puerta antes de resolverla y otra si
// falla.
//
// Uso (con el servidor de Vite andando):
//   PUERTO=5173 node scripts/revisar-puertas.mjs [desde] [hasta] [--semillas=0,1,2] [--revolver] [--fotos]
//                                                [--carpeta=test-results/puertas] [--tam=844x390]
// Termina con código 1 si algo falló; el informe completo queda en <carpeta>/informe.json.
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opcion = (k, d) => {
  const a = args.find((x) => x.startsWith(`--${k}=`));
  return a ? a.slice(k.length + 3) : d;
};
const bandera = (k) => args.includes(`--${k}`);
const numeros = args.filter((a) => !a.startsWith('--')).map(Number);
const desde = numeros[0] || 1;
const hasta = numeros[1] || desde;
const semillas = opcion('semillas', '0').split(',').map(Number);
const carpeta = opcion('carpeta', 'test-results/puertas');
const [ancho, alto] = opcion('tam', '844x390').split('x').map(Number);
const PUERTO = process.env.PUERTO ?? '5173';
const REVOLVER = bandera('revolver');
const FOTOS = bandera('fotos');
const ESPERA_PRUEBA = Number(opcion('espera', '150')) * 1000;
mkdirSync(carpeta, { recursive: true });

const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

const informe = [];
const fallas = [];
const anotar = (r, texto) => {
  r.fallas.push(texto);
  fallas.push(`puerta ${r.n} (semilla ${r.semilla}): ${texto}`);
  console.log(`  FALLA ${texto}`);
};
const resumenTapados = (lista) => lista.map((t) => `${t.que} ← ${t.por} (${t.n}/${t.de}, ${t.vista})`);

for (const semilla of semillas) {
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
  let errores = [];
  pagina.on('pageerror', (e) => errores.push(String(e.message ?? e)));
  pagina.on('console', (m) => m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text()) && errores.push(m.text()));
  // Sin fotos, la página corre sin dibujar (todo igual, pero mucho más rápido)
  await pagina.goto(`http://127.0.0.1:${PUERTO}/puertas.html?sinhistoria=1&rapido=3&una=1&semilla=${semilla}${FOTOS ? '' : '&revisar=1'}`, { timeout: 180000 });
  await pagina.waitForFunction(() => window.__listo, null, { timeout: 180000 });
  await pagina.evaluate(() => (window.__revisarVistas = true));
  for (let n = desde; n <= hasta; n++) {
    const r = { n, semilla, fallas: [], segundos: 0 };
    informe.push(r);
    errores = [];
    console.log(`Puerta ${n} · semilla ${semilla}`);
    const t0 = Date.now();
    try {
      await pagina.evaluate((n) => void window.__puertas.jugar(n), n);
      await pagina.waitForFunction((n) => window.__puertas.estado().jugando === n && window.__puertas.estado().listo, n, { timeout: 90000 });
      // (lo que todavía va rodando o saltando a un sitio libre no cuenta: se mira cuando todo queda quieto, y otra
      // vez después de medio segundo, porque el narrador al caminar a su esquina puede empujar algo)
      for (let k = 0; k < 2; k++) {
        await pagina.waitForFunction(() => window.__puertas.quieto(), null, { timeout: 30000, polling: 250 }).catch(() => {});
        await pagina.waitForTimeout(500);
      }
      await pagina.waitForFunction(() => window.__puertas.quieto(), null, { timeout: 30000, polling: 250 }).catch(() => {});
      const rev = await pagina.evaluate(() => window.__puertas.revision());
      r.revision = rev;
      for (const t of rev.puerta) anotar(r, `tapa la puerta: ${t.que} (${t.celdas} celdas)`);
      if (rev.puerta.length && process.env.DEPURAR) console.log((await pagina.evaluate(() => window.__puertas.desorden())).lista.join('\n'));
      for (const t of resumenTapados(rev.tapados)) anotar(r, `tapado: ${t}`);
      for (const f of rev.fuera) anotar(r, `fuera del cuarto: ${f}`);
      if (FOTOS) await pagina.screenshot({ path: `${carpeta}/p${String(n).padStart(3, '0')}-s${semilla}.png` });
      if (REVOLVER) {
        await pagina.evaluate((s) => window.__puertas.revolver(s + 1), semilla);
        await pagina
          .waitForFunction(() => window.__puertas.quieto(), null, { timeout: 60000, polling: 500 })
          .catch(async () => anotar(r, `el desorden no se queda quieto: ${(await pagina.evaluate(() => window.__puertas.despiertos())).join(' | ')}`));
        await pagina.waitForTimeout(300);
        const rev2 = await pagina.evaluate(() => window.__puertas.revision());
        r.revuelto = rev2;
        for (const t of rev2.puerta) anotar(r, `revuelto, tapa la puerta: ${t.que}`);
        if (rev2.puerta.length && process.env.DEPURAR) console.log((await pagina.evaluate(() => window.__puertas.desorden())).lista.join('\n'));
        for (const t of resumenTapados(rev2.tapados.filter((x) => /desorden/.test(x.por)))) anotar(r, `revuelto, tapado: ${t}`);
        for (const f of rev2.fuera) anotar(r, `revuelto, fuera del cuarto: ${f}`);
        if (FOTOS) await pagina.screenshot({ path: `${carpeta}/p${String(n).padStart(3, '0')}-s${semilla}-revuelto.png` });
      }
      const res = await pagina.evaluate(
        (ms) => Promise.race([window.__puertas.probar().then(() => 'ok', (e) => `error: ${e?.message ?? e}`), new Promise((r) => setTimeout(() => r('se trabó (no terminó a tiempo)'), ms))]),
        ESPERA_PRUEBA,
      );
      if (res !== 'ok') anotar(r, `la prueba no pasó: ${res}`);
      else {
        const abierta = await pagina
          .waitForFunction((n) => window.__puertas.estado().abierta || window.__puertas.estado().progreso.hasta >= n, n, { timeout: 60000 })
          .then(() => true, () => false);
        if (!abierta) anotar(r, 'la prueba terminó pero la puerta no se abrió');
      }
      const vistas = await pagina.evaluate(() => window.__puertas.revision().then((x) => x?.vistas ?? []));
      for (const t of resumenTapados(vistas)) anotar(r, `tapado en acercamiento: ${t}`);
    } catch (e) {
      anotar(r, `se trabó: ${String(e.message ?? e).split('\n')[0]}`);
    }
    for (const e of errores) anotar(r, `error de la página: ${e}`);
    r.segundos = Math.round((Date.now() - t0) / 100) / 10;
    if (r.fallas.length && FOTOS) await pagina.screenshot({ path: `${carpeta}/p${String(n).padStart(3, '0')}-s${semilla}-falla.png` }).catch(() => {});
    console.log(`  ${r.fallas.length ? `${r.fallas.length} fallas` : 'bien'} · ${r.segundos} s`);
  }
  await pagina.close();
}
await navegador.close();

writeFileSync(`${carpeta}/informe.json`, JSON.stringify(informe, null, 1));
console.log(`\n${informe.length} puertas revisadas, ${fallas.length} fallas`);
for (const f of fallas) console.log(` - ${f}`);
process.exit(fallas.length ? 1 : 0);
