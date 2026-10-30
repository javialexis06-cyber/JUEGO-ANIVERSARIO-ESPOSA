/** Prueba de balance en Gardendless real: un piloto automático juega cada área con la formación del plan
 * (scripts/balance/plan.mjs). Siembra por la misma ruta que la interfaz (carta, coste en soles, recarga y casilla
 * legal), recoge los soles que caen y decide por carril: girasoles atrás, atacantes, muros, minas e instantáneos.
 * No es un jugador humano: sirve para encontrar áreas imposibles o regaladas, no para certificar la experiencia.
 *   node scripts/balance/jugar.mjs [áreas: todas | 12-40 | 3,8,9] [--hilos 3] [--refuerzo N] [--salida carpeta]
 * Requiere Vite sirviendo el proyecto en 5176 y acceso a los recursos remotos de Gardendless. */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { papel } from './roles.mjs';
const args = process.argv.slice(2), opcion = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const salida = path.resolve(opcion('--salida', 'test-results/balance')), hilos = Number(opcion('--hilos', 3)), refuerzo = Number(opcion('--refuerzo', 0));
const base = opcion('--url', 'http://localhost:5176/');
fs.mkdirSync(salida, { recursive: true });
const plan = JSON.parse(fs.readFileSync(path.join(salida, 'plan.json'), 'utf8'));
const pedido = args[0] && !args[0].startsWith('--') ? args[0] : 'todas';
const ids = pedido === 'todas' ? plan.pasos.map(p => p.area) : pedido.includes('-') ? plan.pasos.map(p => p.area).filter(a => { const [x, y] = pedido.split('-').map(Number); return a >= x && a <= y; }) : pedido.split(',').map(Number);
const catalogo = JSON.parse(fs.readFileSync('public/jardin/motores/pvz2/catalogo-nativo.json', 'utf8'));
const fichas = new Map(catalogo.plantas.map(p => [p.id, p]));
for (const d of catalogo.derivadas) fichas.set(d.id, { ...fichas.get(d.base), id: d.id, coste: Number(d.props.SunCost) });
const asedioN = Number(opcion('--asedio', 0)), archivo = path.join(salida, asedioN ? `resultados-asedio${asedioN}.jsonl` : refuerzo ? `resultados-refuerzo${refuerzo}.jsonl` : 'resultados.jsonl');
const hechos = new Set(fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l).area) : []);
const cola = ids.filter(a => !hechos.has(a));
console.log(`${cola.length} áreas por jugar (${hechos.size} ya registradas) con ${hilos} hilos`);
const px = process.env.HTTPS_PROXY;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, proxy: px ? { server: px, bypass: 'localhost,127.0.0.1' } : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors'] });

/** Corre dentro de la página: prepara el área y la juega con el piloto hasta ganar, perder o agotar el tiempo. */
async function jugarEnPagina({ area, equipo, semilla, roles, refuerzo, limite, traza = false, asedio = 0 }) {
    const diario = [];
    const { nivelCampana } = window.mods.nivel;
    let c = nivelCampana(area, equipo, semilla, null, false, refuerzo, []);
    // Un motor nuevo por área: así un combate anterior sin terminar no contamina el siguiente.
    if (window.f) { try { await window.f.cerrar(); } catch { try { window.f.destruir(); } catch { } } document.body.innerHTML = ''; }
    window.f = new window.mods.frente.FrenteGardendless(document.body, 'balance-' + area, 'pareja', undefined, { historia: true }); await window.f.listo;
    const f = window.f;
    await f.prepararHistoria(c); await f.iniciarHistoria(c);
    const w = f.frame.contentWindow, m = n => w.System.get(`chunks:///_virtual/${n}.ts`);
    const S = m('Square').Square, cards = m('Cards').Cards.component, ui = m('UI').UIInGame.component, CM = m('CharacterManager');
    const colX = Array.from({ length: 9 }, (_, k) => S.getSquareWorldPosition(0, k).x), paso = (colX[8] - colX[0]) / 8;
    const colDe = x => Math.round((x - colX[0]) / paso);
    const agua = new Set(c.agua), tierra = [...Array(c.filas).keys()].filter(r => !agua.has(r));
    const cartas = () => cards.CFs.map((cf, i) => ({ cf, i, tipo: cf.Type, rol: roles[cf.Type] ?? 'otro', lista: cards.CUs[i]?.selectable && cf.ca?.getSelectable?.() }));
    const plantas = () => CM.PlantPool.pool().filter(p => p.node?.isValid && p.health > 0);
    const zombis = () => CM.ZombiePool.pool().filter(z => z.node?.isValid && z.health > 0).map(z => ({ fila: z.inLane?.LaneIndex ?? z.lIndex, col: colDe(z.worldPositionX), vida: z.health + (z.armorHealth ?? 0) + (z.shieldHealth ?? 0) }));
    const enCelda = (r, k) => plantas().filter(p => p.plantInLnC?.lIndex === r && p.plantInLnC?.cIndex === k);
    const ocupada = (r, k) => enCelda(r, k).some(p => p.Plant_Type !== 'lilypad');
    const nenufar = (r, k) => enCelda(r, k).some(p => p.Plant_Type === 'lilypad');
    function sembrar(carta, r, k) {
        if (r < 0 || r >= c.filas || k < 0 || k > 8) return false;
        const sq = S.getLnC(r, k);
        if (!sq || !carta.lista || !sq.putPlantTypeAvailable(false, carta.tipo, true, false)) return false;
        ui.index = carta.i; ui.currentCF = carta.cf; ui.willCostSun = carta.cf.SUNCOST;
        sq.PlaceUIPlant();
        ui.currentCF = null; ui.index = -1;
        return true;
    }
    /** En carriles de agua, primero el nenúfar. */
    function sembrarEn(carta, r, k, lista) {
        if (agua.has(r) && carta.rol !== 'agua' && !nenufar(r, k)) { const n = lista.find(x => x.rol === 'agua' && x.lista); return n ? sembrar(n, r, k) : false; }
        return sembrar(carta, r, k);
    }
    let segundos = 0, peor = 9, maxZombis = 0, siembras = 0, captura = null;
    const llegaron = new Set();
    const limiteFrames = limite * 60;
    for (let frame = 0; frame < limiteFrames; frame += 6) {
        const o = await f.pasoHistoria(6, false);
        segundos = o.segundos;
        if (o.fase === 'victoria' && asedio && !captura) {
            // Asedio: la misma zona, ahora nuestra, recibe un ataque reforzado con las plantas que quedaron.
            const punto = await f.puntoHistoria();
            captura = { segundos, plantas: punto.plantas.length };
            c = nivelCampana(area, equipo, (semilla * 7 + 13) >>> 0 || 1, punto, false, asedio, []);
            await f.prepararHistoria(c); await f.iniciarHistoria(c);
            frame = -6; peor = 9; maxZombis = 0; llegaron.clear();
            continue;
        }
        if (o.fase === 'victoria' || o.fase === 'derrota') {
            const punto = o.fase === 'victoria' ? await f.puntoHistoria() : null;
            const porCarril = [...Array(c.filas).keys()].map(r => ['sol', 'ataque', 'muro'].map(rol => plantas().filter(p => p.plantInLnC?.lIndex === r && roles[p.Plant_Type] === rol).length).join('/'));
            return { fase: asedio && !captura ? 'captura-perdida' : o.fase, captura, segundos, oleada: o.oleada, peor, maxZombis, siembras, llegaron: [...llegaron], porCarril, diario, plantas: punto?.plantas.length ?? 0, podadoras: punto ? punto.cortacespedes.filter((x, i) => i < c.filas && !x).length : null };
        }
        // Soles: se recogen al caer (un jugador atento los toca enseguida).
        for (const s of m('Droppings').droppings?.controller?.sunPool?.concat() ?? []) try { if (s.collectable?.()) s.collect(); } catch { }
        if (frame % 12) continue;
        const L = cartas(), Z = zombis(), P = plantas(), soles = m('SunCount').SunCount.Value;
        maxZombis = Math.max(maxZombis, Z.length);
        for (const z of Z) peor = Math.min(peor, Math.max(-1, z.col));
        for (const z of CM.ZombiePool.pool().filter(z => z.node?.isValid && z.health > 0 && colDe(z.worldPositionX) <= 0)) llegaron.add(String(z.Zombie_Type ?? z.ZombieType ?? '?').replace(/RTID\((\w+)@ZombieTypes\)/, '$1'));
        const deRol = r => L.filter(x => x.rol === r && x.lista);
        const barata = r => deRol(r).sort((a, b) => a.cf.SUNCOST - b.cf.SUNCOST)[0];
        // El más fuerte que se pueda pagar dejando margen; si no, el más barato.
        const fuerte = r => { const l = deRol(r).sort((a, b) => b.cf.SUNCOST - a.cf.SUNCOST); return l.find(x => soles >= x.cf.SUNCOST + 75) ?? l.at(-1); };
        const amenaza = r => Z.filter(z => z.fila === r).reduce((t, z) => t + z.vida * (z.col <= 8 ? (11 - Math.max(0, z.col)) / 6 : 0.4), 0);
        const filas = [...Array(c.filas).keys()].sort((a, b) => amenaza(b) - amenaza(a));
        const cuenta = (r, rol) => P.filter(p => p.plantInLnC?.lIndex === r && roles[p.Plant_Type] === rol).length;
        const productoras = P.filter(p => roles[p.Plant_Type] === 'sol').length;
        const enJuego = Z.length > 0 || segundos > 25;
        const meta = r => Math.min(5, (enJuego ? 2 : 1) + Math.floor(amenaza(r) / 1200) + (segundos > 120 ? 1 : 0));
        const poner = (carta, r, cols) => { if (!carta) return false; for (const k of cols) if (!ocupada(r, k) && sembrarEn(carta, r, k, L)) return true; return false; };
        let hecho = false;
        // Traza cada 5 s de juego: soles, plantas por papel, zombis, el más adelantado y setas dormidas.
        if (traza && segundos >= diario.length * 5 && diario.length < 120) diario.push({ t: Math.round(segundos), soles, roles: ['sol', 'ataque', 'muro', 'instante', 'mina'].map(r => P.filter(p => roles[p.Plant_Type] === r).length).join('/'), dormidas: P.filter(p => p.sleeping > 0 || p.asleep).length, z: Z.length, vidaZ: Math.round(Z.reduce((t, z) => t + z.vida, 0)), peor: Z.length ? Math.min(...Z.map(z => z.col)) : null, listas: L.filter(x => x.lista).map(x => x.tipo).join(',') });
        // 1) Emergencia: instantáneo sobre un grupo pesado o un zombi que ya está muy cerca.
        const inst = fuerte('instante');
        if (inst) for (const r of filas) { const cerca = Z.filter(z => z.fila === r && z.col <= 5); const vida = cerca.reduce((t, z) => t + z.vida, 0); if (cerca.length && (cerca.length >= 3 || vida >= 1600 || cerca.some(z => z.col <= 2 && z.vida >= 500) || cerca.some(z => z.col <= 1))) { const k = Math.max(0, Math.min(8, Math.round(cerca.reduce((t, z) => t + z.col, 0) / cerca.length))); if (sembrarEn(inst, r, k, L)) { hecho = true; break; } } }
        // 2) Ningún carril con zombis sin atacante. Si no se puede pagar, se guardan los soles para eso (como haría una
        // persona) en vez de gastarlos en más girasoles.
        const sinDefensa = filas.filter(r => amenaza(r) > 0 && !cuenta(r, 'ataque'));
        if (!hecho) for (const r of sinDefensa) if (poner(barata('ataque'), r, [2, 1, 3, 4, 0])) { hecho = true; break; }
        const apurado = sinDefensa.length > 0 || Z.some(z => z.col <= 3);
        // Apertura de PvZ: soles primero. Mientras ningún carril esté en aprietos (un zombi a menos de seis casillas con
        // menos de dos atacantes), las plantas de sol van antes que la defensa, hasta dos columnas.
        const aprieto = filas.some(r => Z.some(z => z.fila === r && z.col <= 3) && cuenta(r, 'ataque') < 2);
        const objetivoSol = (tierra.length + agua.size) * 2;
        // 3) Columnas de soles (primero la de atrás).
        if (!hecho && !apurado && !aprieto && productoras < objetivoSol) for (const r of [...tierra, ...agua]) if (cuenta(r, 'sol') < (productoras < tierra.length + agua.size ? 1 : 2) && poner(productoras < tierra.length + agua.size ? barata('sol') : fuerte('sol'), r, [0, 1])) { hecho = true; break; }
        // Si la planta de sol se está recargando, se esperan los soles en vez de gastarlos en carriles sin zombis.
        const ahorrar = !apurado && !aprieto && productoras < objetivoSol && soles < 200;
        // 4) Atacantes hasta la meta en los carriles con zombis (columnas 2–6); en los vacíos, uno cuando ya hay economía.
        // Con cada carril cubierto y sin zombis cerca, se ahorra para el atacante principal (el más caro de la baraja)
        // en vez de seguir sembrando el barato.
        const caro = deRol('ataque').concat(L.filter(x => x.rol === 'ataque' && !x.lista)).sort((a, b) => b.cf.SUNCOST - a.cf.SUNCOST)[0];
        const paraElCaro = caro && !apurado && !aprieto && filas.every(r => !amenaza(r) || cuenta(r, 'ataque') >= 1) && soles < caro.cf.SUNCOST;
        const atacante = () => paraElCaro ? null : caro && soles >= caro.cf.SUNCOST && caro.lista ? caro : fuerte('ataque');
        if (!hecho) for (const r of filas) if ((amenaza(r) > 0 ? cuenta(r, 'ataque') < meta(r) : !ahorrar && productoras >= objetivoSol && cuenta(r, 'ataque') < 1) && poner(atacante(), r, [2, 3, 4, 5, 1, 6])) { hecho = true; break; }
        // 5) Muro delante de carriles con dos atacantes y zombis.
        if (!hecho) for (const r of filas) if (cuenta(r, 'ataque') >= 2 && !cuenta(r, 'muro') && amenaza(r) > 0 && poner(fuerte('muro'), r, [7, 6, 8])) { hecho = true; break; }
        // 6) Minas por delante donde vienen zombis.
        if (!hecho) for (const r of filas) if (Z.some(z => z.fila === r && z.col >= 6) && !cuenta(r, 'mina') && poner(barata('mina'), r, [7, 6])) { hecho = true; break; }
        // 7) Sobra sol: un atacante más en el carril más débil.
        if (!hecho && !apurado && soles >= 300) for (const r of [...filas].sort((a, b) => cuenta(a, 'ataque') - cuenta(b, 'ataque'))) if (cuenta(r, 'ataque') < 6 && poner(fuerte('ataque'), r, [2, 3, 4, 5, 6, 1])) { hecho = true; break; }
        if (hecho) siembras++;
    }
    return { fase: 'tiempo', segundos, peor, maxZombis, siembras, diario };
}

async function trabajador(n) {
    const ctx = await browser.newContext({ viewport: { width: 800, height: 450 }, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    const errores = []; page.on('pageerror', e => errores.push(e.message.slice(0, 200)));
    await page.route('**/balance.html', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;height:100vh"></body></html>' }));
    await page.goto(new URL('balance.html', base).href);
    await page.evaluate(async () => { window.mods = { frente: await import('/src/jardin/motores/frente-gardendless.ts'), nivel: await import('/src/jardin/motores/nivel-historia.ts') }; });
    while (cola.length) {
        const area = cola.shift(), p = plan.pasos.find(x => x.area === area);
        const roles = Object.fromEntries(p.nativos.map(t => [t, papel(fichas.get(t))]));
        const t0 = Date.now();
        let r;
        try { r = await page.evaluate(jugarEnPagina, { area, equipo: p.equipo, semilla: p.semilla, roles, refuerzo, limite: Number(opcion('--limite', 1500)), traza: args.includes('--traza'), asedio: Number(opcion('--asedio', 0)) }); }
        catch (e) {
            r = { fase: 'error', error: String(e).slice(0, 300) };
            await page.evaluate(async () => { try { await window.f?.cerrar(); } catch { } document.body.innerHTML = ''; window.f = null; }).catch(() => { });
        }
        if (args.includes('--fotos') && r.fase !== 'victoria') { await page.evaluate(() => window.f?.pasoHistoria(0, true)).catch(() => { }); await page.screenshot({ path: path.join(salida, `area-${area}-${r.fase}.png`) }).catch(() => { }); }
        const fila = { area, nombre: p.nombre, pais: p.pais, tipo: p.tipo, filas: p.filas, agua: p.agua, noche: p.noche, cupo: p.cupo, equipo: p.nativos, refuerzo, ...r, pared: Math.round((Date.now() - t0) / 1000), errores: errores.splice(0) };
        fs.appendFileSync(archivo, JSON.stringify(fila) + '\n');
        console.log(`[${n}] ${area} ${p.nombre} · ${r.fase} · ${Math.round(r.segundos ?? 0)} s de juego · podadoras ${r.podadoras ?? '-'} · peor col ${r.peor ?? '-'} · ${fila.pared} s`);
    }
    await ctx.close();
}
await Promise.all(Array.from({ length: hilos }, (_, i) => trabajador(i)));
await browser.close();
