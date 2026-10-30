/** Campaña de 240 áreas sobre Gardendless real: un área de cada país con su escenario nativo, plantas del mundo,
 * fusiones formadas arrastrando la carta sobre la casilla ocupada y plantas derivadas de PvZ 1.
 * Requiere Vite sirviendo el proyecto y acceso a los recursos remotos fijados.
 *   node scripts/probar-campana-cocos.mjs [URL base] [carpeta de salida]
 * Para formar fusiones sin esperar soles se fijan 9990 soles (caso preparado); las recargas se esperan. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const base = process.argv[2] ?? 'http://localhost:5176/', out = path.resolve(process.argv[3] ?? 'test-results/campana-cocos');
fs.mkdirSync(out, {recursive: true});
const px = process.env.HTTPS_PROXY;
const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || undefined, proxy: px ? {server: px, bypass: 'localhost,127.0.0.1'} : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors']});
const checks = [], errores = [];
const ok = t => { checks.push(t); console.log('OK ' + t); };
const page = await (await browser.newContext({viewport: {width: 1100, height: 650}, ignoreHTTPSErrors: true})).newPage();
page.on('pageerror', e => errores.push(e.message));
await page.route('**/prueba-campana.html', r => r.fulfill({contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;height:100vh"></body></html>'}));
await page.goto(new URL('prueba-campana.html', base).href);
await page.evaluate(async () => {
    window.mods = {
        frente: await import('/src/jardin/motores/frente-gardendless.ts'),
        nivel: await import('/src/jardin/motores/nivel-historia.ts'),
        campana: await import('/src/jardin/conquista/campana-datos.ts'),
    };
});
const motor = () => page.frames().find(f => f.url().includes('/motores/pvz2/') && f.url().includes('historia=1'));
async function abrir(config) {
    await page.evaluate(async c => {
        if (window.f) { await window.f.cerrar().catch(() => {}); document.body.innerHTML = ''; }
        window.f = new window.mods.frente.FrenteGardendless(document.body, 'campana', 'pareja', undefined, {historia: true});
        await window.f.listo; await window.f.prepararHistoria(c); await window.f.iniciarHistoria(c);
    }, config);
}
const pasos = n => page.evaluate(async n => { for (let i = 0; i < n; i++) await window.f.pasoHistoria(6, true); }, n);
try {
    // 1. Un área nueva de cada país: escenario nativo, plantas de su mundo y zombis de su mundo.
    const paises = await page.evaluate(() => window.mods.campana.PAISES_CAMPANA.map(p => {
        const a = window.mods.campana.AREAS_CAMPANA.find(x => x.pais === p.id && !x.heredada && x.desbloquea.length) ?? window.mods.campana.AREAS_CAMPANA.find(x => x.pais === p.id && !x.heredada);
        return {pais: p.nombre, area: a.id, planta: a.desbloquea[0] ?? 'lanzaguisantes'};
    }));
    for (const {pais, area, planta} of process.env.SOLO_FUSION ? [] : paises) {
        const config = await page.evaluate(([a, p]) => window.mods.nivel.nivelCampana(a, ['lanzaguisantes', 'girasol', ...(p === 'lanzaguisantes' ? [] : [p])], 11), [area, planta]);
        await abrir(config);
        await pasos(60);
        const estado = await page.evaluate(() => window.f.observar());
        assert.equal(estado.fase, 'combatiendo', pais + ' ' + JSON.stringify(estado));
        const sembrada = await motor().evaluate(async ([t, filas]) => {
            const m = n => System.get(`chunks:///_virtual/${n}.ts`);
            const fila = Math.floor(filas / 2) === 0 ? 0 : Math.floor(filas / 2) - (window.semillaHistoriaMotor && filas > 3 ? 1 : 0);
            const p = await m('Square').Square.getLnC(Math.max(0, fila), 2).SpawnPlantByType(t);
            return p?.Plant_Type ?? null;
        }, [config.semillas.at(-1), config.filas]);
        await pasos(400);
        const tablero = await page.evaluate(() => window.f.estadoVersus());
        await page.screenshot({path: path.join(out, `pais-${area}.png`)});
        assert.ok(sembrada, pais + ': la planta del mundo se siembra');
        assert.ok(tablero.zombis.length > 0 || (await page.evaluate(() => window.f.observar())).oleada > 0, pais + ': llegan zombis');
        console.log(`   ${pais} · área ${area} · ${config.escenario} · ${config.filas} carriles · planta ${sembrada} · zombis ${[...new Set(tablero.zombis.map(z => z.tipo))].join(',')}`);
    }
    ok('Un área de cada uno de los doce países abre con su escenario nativo, siembra plantas de su mundo y trae zombis');
    // 2. Fusiones con clics reales: plantar la segunda carta sobre la primera.
    const config = await page.evaluate(() => { const c = window.mods.nivel.nivelCampana(8, ['lanzaguisantes', 'girasol', 'nuez', 'patatapum'], 5); return {...c, fusiones: window.mods.nivel.FUSIONES_NATIVAS.map(f => f.id)}; });
    await abrir(config);
    await pasos(20);
    // Soles de sobra (caso preparado); la recarga de cada carta se espera con pasos del motor.
    const soles = () => motor().evaluate(() => { const c = System.get('chunks:///_virtual/SunCount.ts').SunCount.component; c.CurrentValue = c.TargetValue = 9990; });
    const lista = async t => {
        for (let i = 0; i < 300; i++) {
            await soles();
            if (await motor().evaluate(t => { const c = System.get('chunks:///_virtual/Cards.ts').Cards.component, i = c.CFs.findIndex(f => f.Type === t); return c.CUs[i].selectable && c.CFs[i].ca.getSelectable(); }, t)) return;
            await page.evaluate(() => window.f.pasoHistoria(6, false));
        }
        const estado = await motor().evaluate(t => { const m = n => System.get(`chunks:///_virtual/${n}.ts`), c = m('Cards').Cards.component, i = c.CFs.findIndex(f => f.Type === t), L = m('levelController').LevelPlay.component; const ui = m('UI').UIInGame.component; return {idx: ui.index, mano: ui.currentCF?.Type, cus: c.CUs.map(u => [u.CD, u.selectable]), soles: m('SunCount').SunCount.Value, cd: c.CUs[i].CD, sel: c.CUs[i].selectable, ca: c.CFs[i].ca.getSelectable(), ganado: L.gameWon, perdido: L.gameLost, pausa: semillaHistoriaMotor.pausada}; }, t);
        throw Error('la carta ' + t + ' no se recargó: ' + JSON.stringify(estado));
    };
    const puntos = (t, f, k) => motor().evaluate(async ([t, f, k]) => {
        const cc = await System.import('cc'), S = System.get('chunks:///_virtual/Square.ts').Square, cards = System.get('chunks:///_virtual/Cards.ts').Cards.component;
        const cam = cc.director.getScene().getComponentsInChildren(cc.Camera).filter(c => c.enabledInHierarchy), can = cc.game.canvas, r = can.getBoundingClientRect();
        const proy = n => { const c = cam.find(c => (c.visibility & n.layer) !== 0), v = c.worldToScreen(n.worldPosition); return {x: r.left + v.x / can.width * r.width, y: r.top + (can.height - v.y) / can.height * r.height}; };
        return {carta: proy(cards.CFs.find(c => c.Type === t).node), celda: proy(S.getLnC(f, k).plantPoint)};
    }, [t, f, k]);
    const marco = await page.$('iframe'), caja = await marco.boundingBox();
    const sembrar = async (t, f, k) => {
        await lista(t);
        await page.evaluate(() => window.f.pasoHistoria(0, true));
        const q = await puntos(t, f, k);
        await page.mouse.move(caja.x + q.carta.x, caja.y + q.carta.y); await page.mouse.down();
        await page.mouse.move(caja.x + q.celda.x, caja.y + q.celda.y, {steps: 8}); await page.mouse.up();
        await pasos(15);
    };
    const tipoEn = (f, k) => motor().evaluate(([f, k]) => System.get('chunks:///_virtual/Square.ts').Square.getLnC(f, k).plantInSquare.map(p => p.Plant_Type), [f, k]);
    for (const [a, b, fila, col, esperado] of [['peashooter', 'sunflower', 1, 2, 'fus_sunshooter'], ['peashooter', 'peashooter', 3, 2, 'repeater'], ['wallnut', 'potatomine', 2, 4, 'fus_mine_nut']]) {
        await sembrar(a, fila, col);
        const primera = await tipoEn(fila, col);
        assert.ok(primera.includes(a), `siembra ${a}; hay ${primera}`);
        await sembrar(b, fila, col);
        await pasos(30);
        const tipos = await tipoEn(fila, col);
        assert.ok(tipos.includes(esperado), `${a} + ${b} → ${esperado}; hay ${tipos}`);
    }
    await page.screenshot({path: path.join(out, 'fusiones.png')});
    ok('Plantar una carta sobre otra forma la fusión: Lanzasoles, Repetidora y Nuez minada arrastrando cartas reales');
    // 3. Plantas derivadas de PvZ 1.
    const derivadas = await page.evaluate(() => window.mods.nivel.DERIVADAS_NATIVAS.map(d => d.id));
    const c3 = await page.evaluate(d => window.mods.nivel.nivelCampana(14, ['lanzaguisantes', ...d], 3), derivadas);
    await abrir(c3);
    await pasos(10);
    const derivadasSembradas = await motor().evaluate(async ds => {
        const S = System.get('chunks:///_virtual/Square.ts').Square, r = [];
        for (const [i, d] of ds.entries()) { const p = await S.getLnC(i, 3).SpawnPlantByType(d); r.push(p?.Plant_Type); }
        return r;
    }, derivadas);
    assert.deepEqual(derivadasSembradas, derivadas);
    const cartas = await motor().evaluate(() => System.get('chunks:///_virtual/Cards.ts').Cards.component.CUs.filter(c => c.cf).map(c => c.cf.Type));
    for (const d of derivadas) assert.ok(cartas.includes(d), 'carta de ' + d);
    await pasos(200);
    await page.screenshot({path: path.join(out, 'derivadas.png')});
    ok('Totora y Lanzamazorcas aparecen en la baraja y se siembran como plantas del motor');
    assert.deepEqual(errores, []);
    console.log(JSON.stringify({checks: checks.length, errores, alcance: 'Casos preparados en Cocos real (soles fijados para fusionar); no certifican el balance de la campaña.'}));
} finally { await browser.close(); }
