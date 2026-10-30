/** Historia con Cocos real; piloto por ratón, sin soles gratuitos ni acelerar relojes.
 * CHROME_PATH=/usr/bin/chromium node scripts/probar-historia-nativa-navegador.mjs [URL] [salida]
 */
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const base = process.argv[2] ?? 'http://127.0.0.1:4196/', out = path.resolve(process.argv[3] ?? 'test-results/historia-nativa');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const viewport={width:640,height:360};
const ctx = await b.newContext({ viewport }), p = await ctx.newPage(), checks = [], errors = [], bad = [];
p.setDefaultTimeout(120000);
const dibujoPorCaptura = process.env.DIBUJO_POR_CAPTURA === '1';
if (dibujoPorCaptura) await ctx.addInitScript(() => {
    // Solo en la prueba: conservar los pasos de Cocos y dibujar al tomar una captura.
    // No modifica soles, entradas, oleadas, daño ni relojes de ninguna instancia.
    let buscando = false;
    const timer = setInterval(async () => {
        if (!window.System?.import || buscando) return;
        buscando = true;
        try {
            const cc = await System.import('cc'), root = cc.director.root;
            if (!root) { buscando = false; return; }
            const render = root.frameMove.bind(root);
            let primeros = 0;
            root.frameMove = dt => {
                const nivel=System.get('chunks:///_virtual/levelController.ts')?.LevelPlay?.component;
                const jugando=!!nivel?.gameStarted;
                if (!jugando || primeros<2 || dt===0 || window.__dibujarCapturaPvZ) render(dt);
                if(jugando) { primeros++; window.__capturaNativaLista=primeros>=2; }
            };
            clearInterval(timer);
        } catch { buscando = false; }
    }, 25);
});
async function captura(opciones) {
    if (dibujoPorCaptura) {
        await Promise.all(p.frames().filter(f=>f.url().includes('/motores/pvz2/'))
            .map(f=>f.evaluate(()=>{window.__dibujarCapturaPvZ=true;}).catch(()=>{})));
        await p.waitForTimeout(180);
    }
    await p.screenshot(opciones);
    if (dibujoPorCaptura) await Promise.all(p.frames().filter(f=>f.url().includes('/motores/pvz2/'))
        .map(f=>f.evaluate(()=>{window.__dibujarCapturaPvZ=false;}).catch(()=>{})));
}
p.on('pageerror', e => { errors.push(e.stack); console.log('ERROR PAGINA ' + e.stack); });
p.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico'))
    bad.push([r.status(), r.url()]); });
const ok = t => { checks.push(t); console.log('OK ' + t); };
const estado = () => p.evaluate(() => __historiaNativa.observar());
const tocar = async (x, y) => { await p.mouse.move(x, y); await p.waitForTimeout(80); await p.mouse.click(x, y); await p.waitForTimeout(80); };
async function frame(id) {
 await p.waitForFunction(id => {
  const o=__historiaNativa.observar();if(!o)return false;
  const i=__historiaNativa.instancias().get(id),a=o.ataques.find(a=>a.zona===id);
  return i?.lista&&(!a||i.ataque===a.id);
 },id,{timeout:180000});
 const sesion=await p.evaluate(id=>__historiaNativa.instancias().get(id).motor.sesion,id);
 const f=p.frames().find(f=>new URL(f.url()).searchParams.get('sesion')===sesion);
 if(dibujoPorCaptura&&await f.evaluate(()=>window.frameElement.dataset.visible==='true')) {
  if(await f.evaluate(()=>semillaHistoriaMotor.pausada))await p.evaluate(id=>__historiaNativa.instancias().get(id).motor.pasoHistoria(0,true),id);
  else await f.waitForFunction(()=>window.__capturaNativaLista,null,{polling:100,timeout:120000});
 }
 return f;
}
async function datos(f) {
    return f.evaluate(async () => {
        const cc = await System.import('cc'), m = n => System.get(`chunks:///_virtual/${n}.ts`), s = m('Square').Square, c = m('Cards').Cards.component, lp = m('levelController').LevelPlay.component;
        const cams = cc.director.getScene().getComponentsInChildren(cc.Camera).filter(c => c.enabledInHierarchy), canvas = cc.game.canvas, r = canvas.getBoundingClientRect();
        const proyectar = n => { const cam = cams.find(c => (c.visibility & n.layer) !== 0); if (!cam)
            return null; const q = cam.worldToScreen(n.worldPosition); return { x: r.left + q.x / canvas.width * r.width, y: r.top + (canvas.height - q.y) / canvas.height * r.height }; };
        return { t: lp.gamedTime, oleada: lp.currentWave, sol: m('SunCount').SunCount.Value, ganada: lp.gameWon, perdida: lp.gameLost,
            plantas: m('CharacterManager').PlantPool.pool().filter(x => x.node?.isValid && x.health > 0).map(x => ({ tipo: x.Plant_Type, fila: x.plantInLnC?.lIndex, col: x.plantInLnC?.cIndex, vida: x.health, id: x.node.uuid })),
            zombis: m('CharacterManager').ZombiePool.pool().filter(x => x.node?.isValid && x.health > 0).map(x => ({ fila: x.inLane?.LaneIndex ?? x.lIndex, x: x.worldPositionX, vida: x.health })),
            cartas: c.CFs.map((cf, i) => ({ tipo: cf.Type, cd: c.CUs[i]?.CD, precio: cf._SUNCOST, x: (510 + i * 110)*innerWidth/1280, y: 42*innerHeight/720 })),
            celdas: Array.from({ length: 5 }, (_, fila) => Array.from({ length: 9 }, (_, col) => ({ fila, col, p: proyectar(s.getLnC(fila, col).plantPoint) }))).flat(),
            soles: (m('Droppings').droppings.controller?.sunPool ?? []).filter(x => x.node?.isValid).map(x => proyectar(x.node)).filter(Boolean) };
    });
}
async function pilotar(f, filas) {
    const d = await datos(f);
    for (const s of d.soles)
        if (s.x > 0 && s.x < viewport.width && s.y > 0 && s.y < viewport.height) {
            await p.mouse.move(s.x, s.y);
            await p.waitForTimeout(100);
        }
    if (d.ganada || d.perdida)
        return d;
    const ocupada = (fila, col) => d.plantas.some(x => x.fila === fila && x.col === col), disparos = fila => d.plantas.filter(x => x.fila === fila && ['peashooter', 'repeater'].includes(x.tipo)).length;
    const orden = [...Array(filas).keys()].sort((a, b) => { const za = d.zombis.filter(x => x.fila === a), zb = d.zombis.filter(x => x.fila === b); return Number(!!zb.length) - Number(!!za.length) || disparos(a) - disparos(b) || a - b; });
    const elegir = tipo => d.cartas.find(c => c.tipo === tipo && c.cd <= 0 && d.sol >= c.precio);
    let c, fila, col;
    if (d.plantas.filter(x => x.tipo === 'sunflower').length < 2 && (c = elegir('sunflower'))) {
        fila = orden.find(r => !ocupada(r, 0));
        col = 0;
    }
    if (fila === undefined && (c = elegir(d.cartas.some(c => c.tipo === 'repeater') ? 'repeater' : 'peashooter'))) {
        fila = orden.find(r => !disparos(r) && !ocupada(r, 1));
        col = 1;
        if (fila === undefined) {
            fila = orden.find(r => !ocupada(r, 2));
            col = 2;
        }
    }
    if (fila === undefined && (c = elegir('potatomine'))) {
        fila = orden.find(r => !ocupada(r, 4));
        col = 4;
    }
    if (fila === undefined && (c = elegir('wallnut'))) {
        fila = orden.find(r => disparos(r) && !ocupada(r, 4));
        col = 4;
    }
    if (c && fila !== undefined) {
        const punto = d.celdas.find(x => x.fila === fila && x.col === col)?.p;
        if (punto) {
            await tocar(c.x, c.y);
            await tocar(punto.x, punto.y);
        }
    }
    return d;
}
const desdeSector=!!process.env.HISTORIA_DESDE_SECTOR;
const rutaPrevia=process.env.HISTORIA_DESDE_SECTOR??process.env.HISTORIA_DESDE_CASA;
const registroPrevio=rutaPrevia?JSON.parse(fs.readFileSync(rutaPrevia,'utf8')):null;
const previa=desdeSector?{...registroPrevio,casa:registroPrevio.final}:registroPrevio;
let casa = null, final = null, sesiones = null;
try {
    if (previa) {
        assert.ok(previa.casa?.zonas[0].punto && (desdeSector?previa.casa.zonas[1].capturada&&previa.checks.some(c=>c.startsWith('El contraataque')):previa.checks.some(c => c.startsWith('Victoria real'))));
        await ctx.addInitScript(s => { if (window === window.top && !localStorage.getItem('conquista-historia-nativa-v3')) localStorage.setItem('conquista-historia-nativa-v3', JSON.stringify(s)); }, previa.casa);
        console.log('CONTINUA desde el punto real ganado en la prueba anterior: ' + rutaPrevia);
    }
    await p.goto(new URL('jardin.html?modo=historia&prueba=1&rol=ella&local=1', base).href);
    await p.waitForFunction(() => window.__historiaNativa);
    await p.waitForFunction(() => __historiaNativa.instancias().size >= 2);
    sesiones=await p.evaluate(()=>[...__historiaNativa.instancias()].map(([id,i])=>[id,i.motor.sesion]));
    await p.evaluate(() => { localStorage.setItem('conquista-historia-v2', 'centinela-v2'); localStorage.setItem('semilla-pvz2-pareja:centinela', 'minijuego'); });
    let f, d, informe = 0;
    if(desdeSector){casa=registroPrevio.casa;await p.locator('[data-cq=retomar]').click();ok('Repite explícitamente el ataque pendiente desde el sector conquistado en el recorrido real anterior');}
    if (!previa) {
        await p.locator('[data-cq=iniciar]').click();
        f = await frame(8);
        await captura({path:path.join(out,'casa-inicio.png')});
        ok('Historia abre directamente la casa en el motor nativo con cinco carriles');
        const limite = Date.now() + 480000;
        let mapaComprobado = false;
        while (Date.now() < limite && (await estado()).inicioCasa) {
            d = await pilotar(f, 5);
            if (d.perdida)
                throw Error('El piloto perdió la casa: ' + JSON.stringify(d));
            if (!mapaComprobado && d.plantas.length) {
                const antes = d;
                await p.locator('[data-cq=mapa]').click();
                await p.waitForTimeout(1400);
                const despues = await datos(f);
                assert.ok(despues.t > antes.t + .4);
                assert.ok(antes.plantas.every(a => despues.plantas.some(b => b.id === a.id)));
                await p.locator('[data-cq=pausa]').click();
                const t = (await datos(f)).t;
                await p.waitForTimeout(1100);
                assert.equal((await datos(f)).t, t);
                await p.locator('.hn-capa [data-cq=pausa]').click();
                await p.locator('[data-hn-frente="8"]').click();
                mapaComprobado = true;
                ok('Mapa conserva la misma instancia y sus plantas; la pausa global congela su reloj');
            }
            if (Date.now() > informe) {
                console.log('CASA ' + JSON.stringify({ t: d.t, sol: d.sol, plantas: d.plantas.length, zombis: d.zombis.length, oleada: d.oleada }));
                informe = Date.now() + 15000;
            }
            await p.waitForTimeout(300);
        }
        casa = await estado();
        assert.equal(casa.inicioCasa, false);
        assert.ok(casa.zonas[0].punto);
        assert.equal(casa.perdida, false);
        await captura({ path: path.join(out, 'casa-conquistada.png') });
        ok('Victoria real de la casa confirma territorio y conserva su defensa sin tocar V2 ni el minijuego');
    }
    else if(!desdeSector) {
        casa = await estado();
        await p.waitForSelector('[data-hn-zona="9"]');
        ok('Continúa el punto real de la casa ganado mediante el piloto por ratón anterior');
    }
    if(!desdeSector){
    await p.locator('[data-hn-zona="9"]').click();
    await p.locator('[data-cq=equipo]').click();
    // Las plantas se compran con las monedas de la casa (300): Repetidora (200) y Patatapum (75).
    assert.equal((await estado()).monedas, 300);
    await p.locator('.hn-editor [data-cq=tienda]').click();
    await p.locator('[data-hn-comprar="repetidora"]').click();
    await p.locator('[data-hn-comprar="patatapum"]').click();
    assert.equal((await estado()).monedas, 25);
    await p.locator('.hn-tienda [data-cq=cerrar-modal]').click();
    await p.locator('[data-hn-semilla="repetidora"]').click();
    await p.locator('[data-hn-semilla="patatapum"]').click();
    await p.locator('[data-cq=guardar-equipo]').click();
    await p.locator('[data-cq=expedicion]').click();
    f = await frame(9);
    ok('Con las monedas de la casa se compran dos tipos en la tienda, se reserva la formación y se inicia la expedición de cuatro carriles');
    await captura({ path: path.join(out, 'expedicion-cuatro-carriles.png') });
    }
    const limite2 = Date.now() + 1200000;
    let simultaneos = desdeSector;
    informe = 0;
    while (Date.now() < limite2) {
        const e = await estado();
        if (e.perdida)
            throw Error('Cayó la casa durante la expedición');
        if (e.zonas[1].capturada && !e.ataques.length)
            break;
        const active = e.ataques.find(a => a.zona === 9) ? 9 : e.ataques[0]?.zona;
        if (active === undefined)
            break;
        if (e.ataques.length === 2 && !simultaneos) {
            const casaFrame = await frame(8), a = await datos(casaFrame);
            try { await p.waitForFunction(t => __historiaNativa.instancias().get(8)?.estado?.segundos > t + .3, a.t, { timeout: 30000, polling: 100 }); } catch(e) { console.log('DIAGNOSTICO '+JSON.stringify(await p.evaluate(()=>({mundo:__historiaNativa.observar(),pausada:__historiaNativa.mundo().pausada,control:__historiaNativa.control(),texto:document.querySelector('.hn-capa').innerText,noticia:document.querySelector('.hn-noticia').textContent,instancias:[...__historiaNativa.instancias()].map(([id,i])=>({id,lista:i.lista,estado:i.estado}))}))));throw e; }
            const b = await datos(casaFrame);
            assert.ok(b.t > a.t + .3, JSON.stringify({ antes: a.t, despues: b.t, mundo: await estado() }));
            simultaneos = true;
            ok('El contraataque de la casa avanza mientras se juega la expedición');
        }
        const vf = await frame(active);
        if (await vf.evaluate(() => window.frameElement.dataset.visible) !== 'true') {
            const boton=p.locator(`[data-hn-frente="${active}"]`);
            if(!await boton.isVisible())continue;
            try{await boton.click({timeout:120000});}catch(e){if(!(await estado()).ataques.some(a=>a.zona===active))continue;throw e;}
            await captura({path:path.join(out,`frente-${active}.png`)});
        }
        d = await pilotar(vf, active === 8 ? 5 : 4);
        if (Date.now() > informe) {
            console.log('FRENTE ' + active + ' ' + JSON.stringify({ t: d.t, sol: d.sol, plantas: d.plantas.length, zombis: d.zombis.length, oleada: d.oleada }));
            informe = Date.now() + 15000;
        }
        await p.waitForTimeout(300);
    }
    final = await estado();
    assert.equal(final.perdida, false);
    assert.ok(final.zonas[1].capturada);
    assert.equal(final.ataques.length, 0);
    // Las sesiones iniciales siguen intactas; al recuperar la estación se pueden precargar sus vecinas nuevas.
    const sesionesFinales=new Map(await p.evaluate(()=>[...__historiaNativa.instancias()].map(([id,i])=>[id,i.motor.sesion])));
    for(const [id,sesion] of sesiones) assert.equal(sesionesFinales.get(id),sesion,'sesión conservada de '+id);
    ok('Casa y estación conservan sus motores y sesiones durante expedición, defensas y nuevas preparaciones');
    assert.ok(simultaneos);
    await captura({ path: path.join(out, 'sector-conquistado.png') });
    assert.equal(await p.evaluate(() => localStorage.getItem('conquista-historia-v2')), 'centinela-v2');
    assert.equal(await p.evaluate(() => localStorage.getItem('semilla-pvz2-pareja:centinela')), 'minijuego');
    ok(desdeSector?'Primer sector completado recuperando el ataque pendiente; puntos reales y guardados anteriores intactos':'Primer sector completado con dos frentes reales y guardados anteriores intactos');
    await p.reload();
    await p.waitForFunction(() => window.__historiaNativa);
    await p.waitForFunction(() => document.querySelector('[data-hn-zona="8"]'));
    assert.deepEqual((await estado()).zonas, final.zonas);
    await p.locator('[data-hn-zona="8"]').click();
    await p.locator('[data-cq=ver]').click();
    f = await frame(8);
    const recuperadas = await datos(f);
    assert.deepEqual(recuperadas.plantas.map(x => [x.tipo, x.fila, x.col, x.vida]).sort(), final.zonas[0].punto.plantas.map(x => [x.tipo, x.fila, x.col, x.vida]).sort());
    ok('Recarga entre combates recupera las plantas y su vida exacta, sin anunciar una instantánea activa');
    assert.deepEqual(errors, []);
    assert.deepEqual(bad, []);
}
catch (e) {
    final=await estado().catch(()=>final);
    errors.push(String(e.stack));
    process.exitCode = 1;
    await captura({ path: path.join(out, 'fallo.png') }).catch(() => { });
}
finally {
    fs.writeFileSync(path.join(out, 'resultado.json'), JSON.stringify({ checks, casa, final, sesiones, errors, bad, continuacion: rutaPrevia ?? null, recuperacion:desdeSector, dibujoPorCaptura, limites: 'Piloto por ratón en el primer sector. No es restauración a mitad de combate ni prueba física de rendimiento.' }, null, 2));
    console.log(JSON.stringify({ checks: checks.length, errors, bad }));
    await b.close();
}
