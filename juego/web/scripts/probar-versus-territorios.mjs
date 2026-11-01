/** Versus por territorios sobre Gardendless real (`jardin.html?modo=versus`, modo Territorios). Requiere Vite
 * sirviendo el proyecto y los recursos remotos fijados de Gardendless. Las salas usan el modo local entre pestañas.
 *   node scripts/probar-versus-territorios.mjs [URL base] [carpeta de salida]
 * Siembra con el ratón y suelta zombis tocando carriles. Adelantar relojes, dar una zona vecina a un bando y
 * decidir la batalla de la base son casos preparados: comprueban reglas y motor, no el balance. */
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const base = process.argv[2] ?? 'http://localhost:5176/', out = path.resolve(process.argv[3] ?? 'test-results/versus-territorios');
fs.mkdirSync(out, {recursive: true});
const px = process.env.HTTPS_PROXY;
const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || undefined, proxy: px ? {server: px, bypass: 'localhost,127.0.0.1'} : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required']});
const checks = [], errores = [];
const ok = t => { checks.push(t); console.log('OK ' + t); };
const vigilar = (p, n) => p.on('pageerror', e => { errores.push(n + ': ' + e.message); console.log('ERROR DE PÁGINA', n, (e.stack ?? '').split('\n').slice(0, 6).join(' | ')); });
const url = q => new URL('jardin.html?modo=versus&prueba' + q, base).href;
const vt = (p, f, arg) => p.evaluate(f, arg);
const esperar = async (p, f, arg, ms = 240000) => {
    try { return await p.waitForFunction(f, arg, {timeout: ms, polling: 400}); }
    catch (e) {
        const estado = await p.evaluate(() => { const v = window.__vt; if (!v) return null; const R = v.reglas(); return { duenos: R.estado.duenos, batallas: R.estado.batallas.map(b => [b.zona, b.iniciador, b.lista, Math.round(b.t), b.duracion, b.fin]), tableros: [...v.tableros()].map(([z, t]) => [z, t.zombis.map(q => q.fila + ':' + q.x), t.cortacespedes]), vista: v.vista(), objetivo: v.objetivo(), aviso: document.querySelector('.vt-aviso')?.textContent }; }).catch(() => null);
        throw new Error('Esperando ' + String(f).slice(0, 120) + ' → ' + JSON.stringify(estado));
    }
};
async function preparar(p, neutrales) {
    await p.click('[data-vs-modo=territorios]');
    await p.click(`[data-vt-neutrales="${neutrales}"]`);
    await p.click('[data-vs=jugar]');
    await esperar(p, () => window.__vt, null, 30000);
}
/** Posición en la página de una carta y de una casilla del tablero nativo visible. */
async function puntos(p, tipo, fila, col) {
    const frames = p.frames().filter(f => f.url().includes('pvz2/index.html'));
    for (const f of frames) {
        const caja = await (await f.frameElement()).boundingBox();
        if (!caja || caja.width < 50) continue;
        const visible = await (await f.frameElement()).evaluate(e => getComputedStyle(e.parentElement).visibility !== 'hidden');
        if (!visible) continue;
        const d = await f.evaluate(([tipo, fila, col]) => {
            const m = n => System.get(`chunks:///_virtual/${n}.ts`), s = m('Square').Square, c = m('Cards').Cards.component, canvas = cc.game.canvas, r = canvas.getBoundingClientRect();
            const cams = cc.director.getScene().getComponentsInChildren(cc.Camera).filter(k => k.enabledInHierarchy);
            const proyectar = n => { const cam = cams.find(k => (k.visibility & n.layer) !== 0); const q = cam.worldToScreen(n.worldPosition); return { x: r.left + q.x / canvas.width * r.width, y: r.top + (canvas.height - q.y) / canvas.height * r.height }; };
            const i = c.CFs.findIndex(x => x.Type === tipo), cf = c.CFs[i];
            return { carta: proyectar(cf.node), celda: proyectar(s.getLnC(fila, col).plantPoint), sol: m('SunCount').SunCount.Value, lista: !!c.CUs[i]?.selectable };
        }, [tipo, fila, col]);
        return { carta: { x: caja.x + d.carta.x, y: caja.y + d.carta.y }, celda: { x: caja.x + d.celda.x, y: caja.y + d.celda.y }, sol: d.sol, lista: d.lista };
    }
    throw new Error('No hay un tablero nativo visible.');
}
try {
    {
        const ctx = await browser.newContext({viewport: {width: 1280, height: 720}}), p = await ctx.newPage();
        vigilar(p, 'local');
        await p.goto(url(''));
        await p.click('[data-vs=local]');
        await p.click('[data-vs-modo=territorios]');
        assert.equal(await p.locator('[data-vt-neutrales]').count(), 4);
        assert.equal(await p.locator('[data-zona]').count(), 0, 'en territorios no se elige un escenario');
        await p.screenshot({path: path.join(out, 'preparar.png')});
        await preparar(p, 3);
        const E = await vt(p, () => { const e = window.__vt.reglas().eleccion; return { zonas: e.zonas.map(z => ({ id: z.id, area: z.area, vecinos: z.vecinos, base: z.base })) }; });
        assert.equal(E.zonas.length, 5);
        assert.equal(await p.locator('.vt-pin').count(), 5);
        await p.screenshot({path: path.join(out, 'reglas.png')});
        await vt(p, () => window.__vt.empezar());
        await p.waitForTimeout(800);
        await p.screenshot({path: path.join(out, 'mapa.png')});
        ok('Prepara Territorios: zonas neutrales y duración elegibles; mapa con La casa, la guarida y zonas de mundos de la historia');

        // Plantas: expedición desde la ficha de la zona, siembra con el ratón y soles que se recogen solos.
        const A = 1;
        await p.click(`[data-vt-zona="${A}"]`);
        await p.click('[data-vt-atacar="plantas"]');
        await esperar(p, z => window.__vt.reglas().batalla(z)?.lista, A);
        await p.waitForTimeout(1500);
        // La carta empieza recargando (recarga inicial nativa de Gardendless).
        let q = await puntos(p, 'peashooter', 1, 1);
        for (let i = 0; i < 40 && !q.lista; i++) { await p.waitForTimeout(500); q = await puntos(p, 'peashooter', 1, 1); }
        assert.ok(q.lista, 'la carta del lanzaguisantes queda lista');
        await p.mouse.click(q.carta.x, q.carta.y); await p.waitForTimeout(250); await p.mouse.click(q.celda.x, q.celda.y);
        await esperar(p, z => window.__vt.tableros().get(z)?.plantas.some(x => x.tipo === 'peashooter' && x.fila === 1 && x.col === 1), A, 20000);
        await p.screenshot({path: path.join(out, 'plantas-siembran.png')});
        assert.equal(await vt(p, () => window.__vt.vista()), A, 'la expedición abre su tablero');
        ok('Expedición de las plantas: abre el tablero de la zona y se siembra con dos toques en el motor nativo');

        // Fin por reloj: la zona pasa a las plantas y su defensa queda guardada.
        await vt(p, () => window.__vt.adelantar(125));
        await esperar(p, z => window.__vt.reglas().estado.duenos[z] === 'plantas' && window.__vt.puntos().includes(z), A, 30000);
        assert.equal(await vt(p, () => window.__vt.vista()), 'mapa');
        ok('Al acabar el reloj sin que entre un zombi, la zona es de las plantas y conserva su defensa');

        // Caso preparado: los zombis ya tienen la zona vecina; atacan la de las plantas y la defensa vuelve a estar.
        await vt(p, ([a]) => { const R = window.__vt.reglas(); R.estado.duenos[2] = 'zombis'; R.estado.espera[a] = 0; }, [A]);
        await vt(p, z => window.__vt.atacar('zombis', z), A);
        await esperar(p, z => window.__vt.reglas().batalla(z)?.lista, A);
        await esperar(p, z => window.__vt.tableros().get(z)?.plantas.some(x => x.tipo === 'peashooter' && x.fila === 1 && x.col === 1), A, 20000);
        assert.equal(await vt(p, () => window.__vt.objetivo()), A, 'el tablero de los zombis sigue su ataque');
        ok('Al volver a atacar esa zona, el tablero restaura las plantas que la defendieron');

        // Zombis: dos zombis por un carril sin plantas; la podadora salva uno y el segundo entra a la casa.
        const mini = await p.$('.vt-mini'), bb = await mini.boundingBox(), filas = await vt(p, z => window.__vt.reglas().area(z).filas, A);
        const gm = await vt(p, () => window.__vt.geometria(document.querySelector('.vt-mini')));
        const yFila = f => bb.y + bb.height * (gm.y0 + (f + .5) * (gm.y1 - gm.y0) / filas);
        const c0 = await vt(p, () => window.__vt.reglas().estado.cerebros);
        await p.click('[data-vt-zombi="tutorial"]');
        await p.mouse.click(bb.x + bb.width * .7, yFila(0));
        await esperar(p, z => (window.__vt.tableros().get(z)?.zombis.length ?? 0) >= 1, A, 20000);
        assert.ok(await vt(p, () => window.__vt.reglas().estado.cerebros) < c0 + 60, 'el zombi cuesta cerebros');
        await p.screenshot({path: path.join(out, 'zombis-sueltan.png')});
        // La podadora barre todo su carril: el segundo zombi sale cuando ya se gastó. Caso preparado: el reloj de
        // esta batalla se alarga para que el paso real de los zombis no compita con él.
        await vt(p, z => { window.__vt.reglas().batalla(z).duracion = 900; }, A);
        await esperar(p, z => window.__vt.tableros().get(z)?.cortacespedes[0] === false, A, 240000);
        // Tras soltar, la carta recarga y se suelta la elección: se vuelve a elegir y se toca el carril.
        // La podadora recorre el carril unos segundos y se lleva a quien encuentre: se suelta después.
        await p.waitForTimeout(9000);
        await p.click('[data-vt-zombi="tutorial"]');
        await p.mouse.click(bb.x + bb.width * .7, yFila(0));
        await esperar(p, z => window.__vt.reglas().estado.duenos[z] === 'zombis', A, 240000);
        assert.equal(await vt(p, z => window.__vt.puntos().includes(z), A), false);
        ok('Los zombis sueltan por carril con cerebros y toman la zona cuando uno entra a la casa (tras la podadora)');

        // Guarnición: las plantas atacan la zona zombi y su guarnición suelta zombis sola.
        await vt(p, z => { window.__vt.reglas().estado.espera[z] = 0; }, A);
        await vt(p, z => window.__vt.atacar('plantas', z), A);
        await esperar(p, z => window.__vt.reglas().batalla(z)?.lista, A);
        assert.ok(await vt(p, z => window.__vt.reglas().batalla(z).guarnicion > 0, A));
        await vt(p, () => window.__vt.adelantar(13));
        await esperar(p, z => (window.__vt.tableros().get(z)?.zombis.length ?? 0) >= 1, A, 30000);
        ok('Una zona zombi atacada por las plantas tiene guarnición que suelta zombis');

        // Varias batallas a la vez y base: los zombis atacan La casa y, si la toman, ganan.
        await vt(p, () => window.__vt.atacar('zombis', 0));
        await esperar(p, () => window.__vt.reglas().estado.batallas.filter(b => b.lista).length >= 2);
        await p.click('[data-vt-ver="0"]');
        await p.waitForTimeout(1200);
        await p.screenshot({path: path.join(out, 'dos-batallas.png')});
        assert.equal(await p.locator('.vt-fila').count(), 2);
        await vt(p, () => window.__vt.decidir(0, 'zombis'));
        await p.waitForSelector('.vs-fin-zombis', {timeout: 20000});
        assert.match(await p.textContent('.vt-capa'), /Ganan los zombis/);
        await p.screenshot({path: path.join(out, 'zombis-ganan.png')});
        ok('Varias batallas a la vez; tomar La casa da la victoria a los zombis');
        await p.click('[data-vt=otra]');
        await p.waitForSelector('[data-vs-modo]', {timeout: 20000});
        assert.equal(await p.evaluate(() => document.querySelectorAll('iframe').length), 0, 'los tableros se cierran al salir');
        ok('Otra partida vuelve a preparar y libera los tableros');
        await ctx.close();
    }
    if (!process.env.SOLO_LOCAL) {
        const ctx = await browser.newContext({viewport: {width: 1100, height: 620}}), A = await ctx.newPage(), B = await ctx.newPage();
        vigilar(A, 'anfitrion'); vigilar(B, 'invitado');
        await A.goto(url('&salas=local&rol=el')); await B.goto(url('&salas=local&rol=ella'));
        await A.click('[data-vs=crear]');
        await A.waitForSelector('.se-codigo', {timeout: 30000});
        const codigo = (await A.textContent('.se-codigo')).replace(/\s/g, '');
        await B.fill('input[name=codigo]', codigo); await B.click('.vs-unirse button');
        await B.waitForSelector('[data-a=principal]', {timeout: 30000}); await B.waitForTimeout(800); await B.$eval('[data-a=principal]', e => e.click());
        await A.waitForFunction(() => !document.querySelector('[data-a=principal]')?.disabled); await A.$eval('[data-a=principal]', e => e.click());
        await A.waitForSelector('[data-vs-modo]', {timeout: 30000});
        await preparar(A, 3);
        await esperar(B, () => window.__vt, null, 30000);
        assert.deepEqual(await B.evaluate(() => window.__vt.reglas().eleccion.zonas.map(z => z.area)), await A.evaluate(() => window.__vt.reglas().eleccion.zonas.map(z => z.area)));
        assert.equal(await A.locator('[data-vt-zombi]').count(), 0, 'el anfitrión no lleva zombis');
        await A.evaluate(() => window.__vt.empezar()); await B.evaluate(() => window.__vt.empezar());
        const Z = await B.evaluate(() => window.__vt.reglas().eleccion.zonas.at(-1).vecinos[0]);
        await B.click(`[data-vt-zona="${Z}"]`);
        assert.equal(await B.locator('[data-vt-atacar="plantas"]').count(), 0, 'el invitado solo ataca con zombis');
        await B.click('[data-vt-atacar="zombis"]');
        await esperar(A, z => window.__vt.reglas().batalla(z)?.lista, Z);
        await esperar(B, z => window.__vt.vista() === z && window.__vt.reglas().batalla(z)?.lista, Z, 30000);
        await B.click('[data-vt-zombi="tutorial"]');
        const lb = await (await B.$('.vt-lienzo')).boundingBox(), fz = await B.evaluate(z => window.__vt.reglas().area(z).filas, Z);
        const gb = await B.evaluate(() => window.__vt.geometria(document.querySelector('.vt-lienzo')));
        await B.mouse.click(lb.x + lb.width * .7, lb.y + lb.height * (gb.y0 + .5 * (gb.y1 - gb.y0) / fz));
        await B.waitForTimeout(500);
        const avisoB = await B.evaluate(() => document.querySelector('.vt-aviso')?.textContent);
        if (!(await A.evaluate(z => (window.__vt.tableros().get(z)?.zombis.length ?? 0) >= 1, Z))) console.log('aviso del invitado:', avisoB, await B.evaluate(() => [window.__vt.pausa(), document.querySelector('.vt-capa')?.textContent.slice(0, 60)]));
        await esperar(A, z => (window.__vt.tableros().get(z)?.zombis.length ?? 0) >= 1, Z, 20000);
        await esperar(B, z => (window.__vt.tableros().get(z)?.zombis.length ?? 0) >= 1, Z, 20000);
        await B.waitForTimeout(1200);
        assert.equal(await B.evaluate(() => Math.floor(window.__vt.reglas().estado.cerebros)), await A.evaluate(() => Math.floor(window.__vt.reglas().estado.cerebros)));
        await A.screenshot({path: path.join(out, 'sala-anfitrion.png')}); await B.screenshot({path: path.join(out, 'sala-invitado.png')});
        ok('En sala: el invitado invade una zona, el anfitrión abre el tablero y los dos ven el mismo zombi y cerebros');
        await B.click('[data-vt=pausa]'); await A.waitForTimeout(900);
        assert.equal(await A.evaluate(() => window.__vt.pausa()), true);
        const t1 = await A.evaluate(() => window.__vt.reglas().estado.t); await A.waitForTimeout(1200);
        assert.equal(await A.evaluate(() => window.__vt.reglas().estado.t), t1);
        await B.click('.vt-capa [data-vt=pausa]'); await A.waitForTimeout(900);
        assert.equal(await A.evaluate(() => window.__vt.pausa()), false);
        ok('La pausa pedida por el invitado detiene la partida del anfitrión y se puede reanudar');
        await A.evaluate(() => window.__vt.adelantar(1000));
        await B.waitForSelector('.vt-capa .vs-fin', {timeout: 20000});
        const gA = await A.evaluate(() => window.__vt.reglas().estado.ganador), gB = await B.evaluate(() => window.__vt.reglas().estado.ganador);
        assert.ok(gA && gA === gB, `mismo final en los dos: ${gA} / ${gB}`);
        await A.click('[data-vt=otra]');
        await B.waitForSelector('.vs-carga', {timeout: 15000});
        ok('El final llega a los dos y la revancha devuelve al invitado a la espera');
        await ctx.close();
    }
    assert.deepEqual(errores, []);
    console.log(JSON.stringify({checks: checks.length, errores, alcance: 'Casos preparados con reglas y motor reales; no certifican el balance del versus.'}));
} finally { await browser.close(); }
