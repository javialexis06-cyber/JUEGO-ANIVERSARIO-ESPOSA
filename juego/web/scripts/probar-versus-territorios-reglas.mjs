/** Reglas del Versus por territorios (sin navegador): mapas de 3 a 9 zonas neutrales, vecinos, ataques, relojes,
 * guarnición, cerebros, captura de bases y final por tiempo. Los relojes se adelantan: son casos preparados que
 * comprueban reglas, no balance.
 *   node scripts/probar-versus-territorios-reglas.mjs */
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const r = await build({ stdin: { contents: "export * from './src/jardin/motores/versus-territorios';export {AREAS_CAMPANA} from './src/jardin/conquista/campana-datos';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', loader: { '.json': 'json' }, logLevel: 'silent' });
const M = await import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
const { crearEleccionVT, eleccionVTSegura, ReglasTerritorios, VT, AREAS_CAMPANA, GUARIDAS } = M;
const checks = [];
const probar = (n, fn) => { fn(); checks.push(n); console.log('OK ' + n); };
const mazo = ['girasol', 'lanzaguisantes', 'nuez', 'petacereza', 'patatapum', 'hielaguisantes'];
const eleccion = (neutrales, semilla = 7, semillas = mazo) => crearEleccionVT({ sesion: 'prueba-territorios', semilla, neutrales, duracion: 900, semillas });

probar('Mapas de 3, 5, 7 y 9 zonas neutrales: bases, vecinos simétricos, mundos distintos y camino de base a base', () => {
    for (const n of VT.neutrales) for (let s = 1; s <= 40; s++) {
        const e = eleccion(n, s);
        assert.ok(eleccionVTSegura(e, () => true), `elección válida ${n}/${s}`);
        assert.equal(e.zonas.length, n + 2);
        assert.equal(e.zonas[0].area, 8);
        assert.ok(GUARIDAS.includes(e.zonas.at(-1).area));
        const areas = e.zonas.map(z => z.area);
        assert.equal(new Set(areas).size, areas.length, 'sin áreas repetidas');
        const neutras = e.zonas.filter(z => !z.base);
        assert.equal(new Set(neutras.map(z => AREAS_CAMPANA[z.area].pais)).size, n, 'un mundo por zona');
        for (const z of neutras) { const a = AREAS_CAMPANA[z.area]; assert.ok(a.filas >= 4 && a.filas <= 6 && a.tipo !== 'fortaleza' && !a.heredada && !a.agua.length); }
        const vistos = new Set([0]), cola = [0];
        while (cola.length) for (const v of e.zonas[cola.shift()].vecinos) if (!vistos.has(v)) { vistos.add(v); cola.push(v); }
        assert.equal(vistos.size, e.zonas.length, 'todo conectado');
        assert.ok(!e.zonas[0].vecinos.includes(e.zonas.length - 1), 'las bases no son vecinas');
    }
});
probar('Con nenúfar en el mazo pueden salir zonas con agua; sin él, nunca', () => {
    let conAgua = 0;
    for (let s = 1; s <= 60; s++) conAgua += eleccion(9, s, [...mazo, 'nenufar']).zonas.some(z => AREAS_CAMPANA[z.area].agua.length) ? 1 : 0;
    assert.ok(conAgua > 0);
});
probar('Una elección manipulada se rechaza', () => {
    const e = eleccion(5);
    assert.equal(eleccionVTSegura({ ...e, duracion: 30 }, () => true), false);
    assert.equal(eleccionVTSegura({ ...e, semillas: [] }, () => true), false);
    const mala = structuredClone(e); mala.zonas[1].vecinos.push(99);
    assert.equal(eleccionVTSegura(mala, () => true), false);
    const sinBase = structuredClone(e); sinBase.zonas[0].base = null;
    assert.equal(eleccionVTSegura(sinBase, () => true), false);
    assert.equal(eleccionVTSegura(e, t => t !== 'nuez'), false);
});
probar('Cada bando ataca solo zonas vecinas de las suyas, con tope de batallas por bando y en total', () => {
    const e = eleccion(7), R = new ReglasTerritorios(e), guarida = e.zonas.length - 1;
    for (const z of e.zonas) {
        const p = R.impedimentoAtaque('plantas', z.id), q = R.impedimentoAtaque('zombis', z.id);
        assert.equal(p === null, z.base !== 'plantas' && e.zonas[0].vecinos.includes(z.id), 'plantas ' + z.id + ' ' + p);
        assert.equal(q === null, z.base !== 'zombis' && e.zonas[guarida].vecinos.includes(z.id), 'zombis ' + z.id + ' ' + q);
    }
    const [a, b] = e.zonas[0].vecinos;
    R.atacar('plantas', a); R.atacar('plantas', b);
    assert.match(R.impedimentoAtaque('plantas', a), /Ya hay una batalla/);
    const R2 = new ReglasTerritorios(e, { maxTotal: 2 });
    R2.atacar('plantas', a); R2.atacar('zombis', e.zonas[guarida].vecinos[0]);
    assert.match(R2.impedimentoAtaque('plantas', b), /demasiadas/);
});
probar('El reloj de una batalla corre solo con el tablero listo; al acabar, las plantas se quedan la zona y descansa', () => {
    const e = eleccion(5), R = new ReglasTerritorios(e), z = e.zonas[0].vecinos[0];
    R.atacar('plantas', z);
    assert.deepEqual(R.avanzar(30), []);
    assert.equal(R.batalla(z).t, 0, 'cargando: sin reloj');
    R.marcarLista(z);
    let ev = [];
    for (let i = 0; i < 130 && !ev.length; i++) ev = R.avanzar(1);
    assert.deepEqual(ev, [{ tipo: 'reloj', zona: z }]);
    assert.equal(R.batalla(z).fin, 'plantas');
    assert.equal(R.resolver(z, 'plantas'), false);
    assert.equal(R.estado.duenos[z], 'plantas');
    assert.match(R.impedimentoAtaque('zombis', z), /recuperando|vecina/);
    assert.equal(R.solesIniciales(), VT.solesBase + VT.solesPorZona);
});
probar('Una zona zombi tiene guarnición cuando las plantas la atacan; la guarida, más seguida y más dura', () => {
    const e = eleccion(3), R = new ReglasTerritorios(e), guarida = e.zonas.length - 1, z = e.zonas[guarida].vecinos[0];
    R.atacar('zombis', z); R.marcarLista(z); R.marcarFin(z, 'zombis'); R.resolver(z, 'zombis');
    assert.equal(R.estado.duenos[z], 'zombis');
    R.estado.espera[z] = 0;
    // Las plantas necesitan una zona vecina: se la dan por un caso preparado.
    for (const v of e.zonas[z].vecinos) if (!e.zonas[v].base) R.estado.duenos[v] = 'plantas';
    assert.equal(R.impedimentoAtaque('plantas', z), null);
    const b = R.atacar('plantas', z); R.marcarLista(z);
    assert.equal(b.guarnicion, VT.guarnicion);
    const g = [];
    for (let i = 0; i < 60; i++) g.push(...R.avanzar(1).filter(x => x.tipo === 'guarnicion'));
    assert.ok(g.length >= 5 && g.every(x => x.zona === z && ['tutorial', 'tutorial_armor1'].includes(x.zombi) && x.fila >= 0 && x.fila < R.area(z).filas), JSON.stringify(g));
    const R3 = new ReglasTerritorios(e);
    R3.estado.duenos[z] = 'plantas';
    const bg = R3.atacar('plantas', guarida);
    assert.equal(bg.guarnicion, VT.guarnicionGuarida);
    assert.equal(bg.duracion, VT.batallaGuarida);
});
probar('Cerebros: ingreso base, más por batalla abierta y por zona zombi; zombis por agua solo en agua', () => {
    const e = eleccion(5), R = new ReglasTerritorios(e), guarida = e.zonas.length - 1, z = e.zonas[guarida].vecinos[0];
    const c0 = R.estado.cerebros;
    for (let i = 0; i < VT.cadaSegundos; i++) R.avanzar(1);
    assert.equal(R.estado.cerebros, c0 + VT.ingresoBase);
    R.atacar('zombis', z); R.marcarLista(z);
    assert.equal(R.ingreso(), VT.ingresoBase + VT.ingresoPorBatalla);
    assert.equal(R.impedimentoZombi('tutorial', z, 0), null);
    assert.match(R.impedimentoZombi('duckytube', z, 0), /flotadores/);
    assert.match(R.impedimentoZombi('tutorial', z, 99), /carril/);
    R.gastar('tutorial');
    assert.match(R.impedimentoZombi('tutorial', z, 0), /recargando/);
    R.devolver('tutorial');
    assert.equal(R.impedimentoZombi('tutorial', z, 0), null);
    R.estado.cerebros = 10;
    assert.match(R.impedimentoZombi('tutorial', z, 0), /Faltan cerebros/);
    assert.match(R.impedimentoZombi('tutorial', e.zonas[0].id, 0), /no hay batalla/);
    assert.ok(!R.disponibles().some(x => x.agua), 'sin agua en el mapa no hay flotadores');
});
probar('Tomar la base rival gana al instante; al acabar el tiempo gana quien tenga más zonas', () => {
    const e = eleccion(3), R = new ReglasTerritorios(e), casa = 0;
    R.estado.duenos[e.zonas[0].vecinos[0]] = 'zombis';
    R.atacar('zombis', casa); R.marcarLista(casa); R.marcarFin(casa, 'zombis');
    assert.equal(R.resolver(casa, 'zombis'), true);
    assert.deepEqual([R.estado.ganador, R.estado.motivo], ['zombis', 'casa']);
    assert.match(R.impedimentoAtaque('plantas', 1), /terminó/);
    const T = new ReglasTerritorios(e);
    T.estado.duenos[1] = 'plantas';
    let ev = [];
    for (let i = 0; i < 1000 && !ev.some(x => x.tipo === 'fin'); i++) ev = T.avanzar(1);
    assert.deepEqual([T.estado.ganador, T.estado.motivo], ['plantas', 'tiempo']);
    const E = new ReglasTerritorios(e);
    E.avanzar(1); E.estado.t = e.duracion; E.avanzar(1);
    assert.equal(E.estado.ganador, 'empate');
});
probar('Batalla anulada no cambia de dueño y libera su cupo; una batalla decidida no se decide dos veces', () => {
    const e = eleccion(5), R = new ReglasTerritorios(e), z = e.zonas[0].vecinos[0];
    R.atacar('plantas', z); R.cancelar(z);
    assert.equal(R.estado.duenos[z], null);
    assert.equal(R.impedimentoAtaque('plantas', z), null);
    R.atacar('plantas', z); R.marcarLista(z);
    assert.equal(R.marcarFin(z, 'zombis'), true);
    assert.equal(R.marcarFin(z, 'plantas'), false);
    assert.equal(R.batalla(z).fin, 'zombis');
});
console.log(JSON.stringify({ checks: checks.length }));
