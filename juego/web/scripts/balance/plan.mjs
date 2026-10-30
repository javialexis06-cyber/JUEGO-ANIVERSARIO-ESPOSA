/** Jugador simulado para la prueba de balance de la campaña completa (economía y formaciones).
 * Recorre las 240 áreas en el orden en que se abren, cobra capturas y asedios, compra en la tienda con una regla
 * sensata (cubrir papeles: sol, ataque, muro, instantáneo, nenúfar si hay agua; mejorar el atacante) y arma la
 * formación de cada área con su cupo. Escribe test-results/balance/plan.json.
 *   node scripts/balance/plan.mjs [--sin-asedios] */
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { papel, valor } from './roles.mjs';

export async function cargarMotor() {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'balance-')), file = path.join(dir, 'm.mjs');
    await build({ stdin: { contents: "export * from './src/jardin/conquista/historia-nativa-motor';export * from './src/jardin/conquista/campana-datos';export * from './src/jardin/conquista/economia';export * from './src/jardin/motores/nivel-historia';", resolveDir: path.resolve(import.meta.dirname, '../..') }, outfile: file, bundle: true, platform: 'node', format: 'esm', logLevel: 'error' });
    const m = await import(pathToFileURL(file));
    await fs.rm(dir, { recursive: true, force: true });
    return m;
}

export function planificar(M, { asedios = true } = {}) {
    const { HistoriaNativa, AREAS_CAMPANA, PLANTAS_NATIVAS, DERIVADAS_NATIVAS, nativoDe, precio, cupo, PLANTAS_TIENDA } = M;
    const porId = new Map(PLANTAS_NATIVAS.map(p => [p.id, p]));
    for (const d of DERIVADAS_NATIVAS) { const b = porId.get(d.base); porId.set(d.id, { ...b, id: d.id, coste: Number(d.props.SunCost ?? b.coste) }); }
    const ficha = t => porId.get(nativoDe(t));
    const rol = t => papel(ficha(t));
    const punto = id => ({ version: 1, soles: 150, plantas: [], cortacespedes: Array.from({ length: Math.max(5, AREAS_CAMPANA[id].filas) }, (_, i) => i < AREAS_CAMPANA[id].filas), recargas: {} });
    const m = new HistoriaNativa();
    m.resultado(1, 'victoria', punto(8));
    const pasos = [], compras = [];
    const mejor = (lista, r) => lista.filter(t => rol(t) === r).sort((a, b) => valor(ficha(b), r) - valor(ficha(a), r))[0];
    /** Planta de soles barata para abrir: de día el girasol rinde más; de noche (50 soles iniciales) la seta solar. */
    const solBarato = (lista, noche = false) => lista.filter(t => rol(t) === 'sol' && ficha(t).coste <= 50).sort((a, b) => (noche ? ficha(a).coste - ficha(b).coste : ficha(b).coste - ficha(a).coste) || valor(ficha(b), 'sol') - valor(ficha(a), 'sol'))[0];
    /** Atacante para abrir cada carril: los caros no se alcanzan a pagar al comienzo del combate. */
    const barato = lista => lista.filter(t => rol(t) === 'ataque' && ficha(t).coste <= 125).sort((a, b) => ficha(b).coste - ficha(a).coste)[0];
    /** Tope de soles del atacante principal: con pocas semillas no hay economía para pagar uno muy caro. */
    const tope = area => 200 + 50 * Math.max(0, cupo(area.id) - 4);
    const principal = (lista, area) => lista.filter(t => rol(t) === 'ataque' && ficha(t).coste <= tope(area)).sort((a, b) => valor(ficha(b), 'ataque') - valor(ficha(a), 'ataque'))[0];
    // Lo que se puede llevar a esta área: sin vaciar la casa ni tocar zonas que estén combatiendo.
    const libresPara = area => m.estado.desbloqueadas.filter(t => { const z = m.propietaria(t); return z === null || z === area.id || (z !== 8 && !m.estado.ataques.some(a => a.zona === z)); });
    function comprarLoNecesario(area) {
        const tiene = () => libresPara(area);
        const venta = () => PLANTAS_TIENDA.filter(t => m.enVenta(t) && precio(t) <= m.estado.monedas && rol(t) !== 'otro');
        // 1) nenúfar si el área tiene agua
        if (area.agua.length && !tiene().some(t => rol(t) === 'agua')) { const t = venta().find(t => rol(t) === 'agua'); if (t) { m.comprar(t); compras.push({ area: area.id, t }); } }
        // 2) cubrir papeles que falten y mejorar el atacante principal, mientras alcance
        for (let vuelta = 0; vuelta < 12; vuelta++) {
            const opciones = venta();
            if (!opciones.length) break;
            // Primero lo básico con lo más barato de cada papel (así alcanza para cubrirlos todos); después se mejora.
            const faltan = ['sol', 'ataque', 'muro', 'instante'].filter(r => !tiene().some(t => rol(t) === r));
            const masBarato = (lista, r) => lista.filter(t => rol(t) === r).sort((a, b) => precio(a) - precio(b))[0];
            let elegida = null;
            for (const r of faltan) { elegida = r === 'sol' ? solBarato(opciones, area.noche) ?? masBarato(opciones, r) : r === 'ataque' ? barato(opciones) ?? masBarato(opciones, r) : masBarato(opciones, r); if (elegida) break; }
            if (!elegida && !barato(tiene())) elegida = barato(opciones) ?? null;
            if (!elegida && !solBarato(tiene(), area.noche)) elegida = solBarato(opciones, area.noche) ?? null;
            // Un atacante principal que esta área pueda pagar, si el que se tiene es claramente peor.
            if (!elegida) { const a1 = principal(opciones, area), a0 = principal(tiene(), area); if (a1 && valor(ficha(a1), 'ataque') > valor(ficha(a0), 'ataque') * 1.2) elegida = a1; }
            // Una planta de soles mejor que la que se puede llevar.
            if (!elegida) { const s1 = mejor(opciones, 'sol'), s0 = mejor(tiene(), 'sol'); if (s1 && valor(ficha(s1), 'sol') > valor(ficha(s0), 'sol')) elegida = s1; }
            // Como un jugador real: le atraen las plantas nuevas del país donde está (la mejor de cada papel).
            if (!elegida) elegida = opciones.filter(t => M.paisDePlanta(t) === area.pais && ['ataque', 'instante', 'muro'].includes(rol(t)) && !(rol(t) === 'ataque' && ficha(t).coste > tope(area))).sort((a, b) => valor(ficha(b), rol(b)) - valor(ficha(a), rol(a)))[0] ?? null;
            if (!elegida) {
                const actual = mejor(tiene(), 'ataque'), mas = mejor(opciones, 'ataque');
                const atacantes = tiene().filter(t => rol(t) === 'ataque').length;
                if (mas && (atacantes < cupo(area.id) - 2 || valor(ficha(mas), 'ataque') > valor(ficha(actual), 'ataque') * 1.2)) elegida = mas;
                else {
                    const muro = mejor(opciones, 'muro');
                    if (muro && valor(ficha(muro), 'muro') > valor(ficha(mejor(tiene(), 'muro')), 'muro') + 1) elegida = muro;
                }
            }
            if (!elegida) break;
            m.comprar(elegida); compras.push({ area: area.id, t: elegida });
        }
    }
    function formacion(area) {
        const k = cupo(area.id), libres = libresPara(area);
        const e = [];
        const poner = t => { if (t && !e.includes(t) && e.length < k) e.push(t); };
        if (area.agua.length) poner(mejor(libres, 'agua'));
        poner(solBarato(libres, area.noche) ?? mejor(libres, 'sol'));
        poner(barato(libres));
        poner(principal(libres, area));
        poner(mejor(libres, 'muro'));
        poner(mejor(libres, 'instante'));
        if (k >= 6) poner(mejor(libres, 'sol'));
        poner(mejor(libres, 'mina'));
        // Con cupo de sobra, un atacante caro para el final del combate y después los demás.
        poner(mejor(libres, 'ataque'));
        for (const t of libres.filter(t => rol(t) === 'ataque' && ficha(t).coste <= tope(area)).sort((a, b) => valor(ficha(b), 'ataque') - valor(ficha(a), 'ataque'))) poner(t);
        return e;
    }
    const hechas = new Set([8]);
    let avanzo = true;
    while (avanzo) {
        avanzo = false;
        for (const a of AREAS_CAMPANA) {
            if (hechas.has(a.id) || !m.puedeLlegar(a.id)) continue;
            if (a.id === 239 && hechas.size < 239) continue;
            m.explorar(a.id);
            comprarLoNecesario(a);
            const equipo = formacion(a);
            const monedasAntes = m.estado.monedas;
            if (!m.preparar(a.id, equipo.length ? equipo : ['lanzaguisantes'])) throw Error('No se pudo preparar ' + a.id);
            let exp = m.expedicion(a.id);
            // Si hay demasiados combates abiertos, se resuelven primero los asedios pendientes.
            while (!exp && m.estado.ataques.length) { const q = m.estado.ataques[0]; m.resultado(q.id, 'victoria', punto(q.zona)); exp = m.expedicion(a.id); }
            while (!exp) { m.paso(); exp = m.expedicion(a.id); }
            pasos.push({ area: a.id, nombre: a.nombre, pais: a.pais, tipo: a.tipo, filas: a.filas, agua: a.agua.length > 0, noche: a.noche, cupo: cupo(a.id), equipo: [...exp.equipo], nativos: exp.equipo.map(nativoDe), roles: exp.equipo.map(rol), semilla: exp.semilla, monedas: monedasAntes, poseidas: m.estado.desbloqueadas.length });
            m.resultado(exp.id, 'victoria', punto(a.id));
            hechas.add(a.id); avanzo = true;
            // Unos cuatro minutos de partida entre capturas: los asedios que lleguen se resisten (cobran su premio).
            if (asedios) for (let i = 0; i < 14400; i++) { const q = m.paso(); if (q) m.resultado(q.id, 'victoria', punto(q.zona)); }
            else m.estado.ataques.filter(q => q.zona !== a.id).forEach(q => m.resultado(q.id, 'victoria', punto(q.zona)));
            if (m.fin) break;
        }
    }
    const totalTienda = PLANTAS_TIENDA.reduce((t, x) => t + precio(x), 0);
    return { pasos, compras, final: { monedas: m.estado.monedas, premios: m.estado.premios, compradas: m.estado.compradas.length, poseidas: m.estado.desbloqueadas.length, totalTienda, tienda: PLANTAS_TIENDA.length, fin: m.fin } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const M = await cargarMotor();
    const plan = planificar(M, { asedios: !process.argv.includes('--sin-asedios') });
    const out = path.resolve('test-results/balance'); await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, 'plan.json'), JSON.stringify(plan, null, 1));
    const porPais = {};
    for (const p of plan.pasos) { const k = p.pais; porPais[k] ??= { areas: 0, monedasMin: Infinity, cupoMax: 0, sinSol: 0, sinAtaque: 0, sinMuro: 0, aguaSinNenufar: 0 }; const q = porPais[k]; q.areas++; q.monedasMin = Math.min(q.monedasMin, p.monedas); q.cupoMax = Math.max(q.cupoMax, p.cupo); if (!p.roles.includes('sol')) q.sinSol++; if (!p.roles.includes('ataque')) q.sinAtaque++; if (!p.roles.includes('muro')) q.sinMuro++; if (p.agua && !p.roles.includes('agua')) q.aguaSinNenufar++; }
    console.log(JSON.stringify(plan.final));
    console.table(porPais);
}
