/** Estado estratégico y puntos de descanso preparados. El recorrido de Cocos se comprueba aparte. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const temporal = await fs.mkdtemp(path.join(os.tmpdir(), 'historia-nativa-')), checks = [];
try {
    const salida = path.join(temporal, 'motor.mjs');
    await build({ stdin: { contents: "export * from './src/jardin/conquista/historia-nativa-motor';export * from './src/jardin/conquista/historia-nativa-guardado';export * from './src/jardin/motores/nivel-historia';", resolveDir: path.resolve(import.meta.dirname, '..') }, outfile: salida, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
    const { HistoriaNativa, GuardadoHistoriaNativa, nivelHistoriaNativa } = await import(pathToFileURL(salida));
    const punto = () => ({ version: 1, soles: 175, plantas: [{ tipo: 'peashooter', fila: 2, col: 0, vida: 77, temporales: { busy: 2 } }, { tipo: 'sunflower', fila: 2, col: 1, vida: 13, temporales: { busy: 11 } }], cortacespedes: [true, false, true, true, false], recargas: { peashooter: 3, sunflower: 1 } });
    const probar = (t, fn) => { fn(); checks.push(t); console.log('OK ' + t); };
    const abierta = () => { const m = new HistoriaNativa(); assert.ok(m.resultado(1, 'victoria', punto())); return m; };
    probar('La casa usa cinco carriles, cuatro tipos reservados y las seis oleadas existentes', () => {
        const m = new HistoriaNativa(), c = nivelHistoriaNativa(8, m.zona(8).equipo, 23);
        assert.equal(c.filas, 5);
        assert.equal(c.semillas.length, 4);
        assert.equal(c.oleadas.length, 6);
        assert.deepEqual(c.oleadas.map(x => x.length), [1, 1, 1, 2, 2, 5]);
        assert.equal(m.explorar(), false);
        assert.equal(m.expedicion(), null);
        for (let i = 0; i < 4000; i++)
            assert.equal(m.paso(), null);
        assert.equal(m.estado.ataques.length, 1);
        assert.deepEqual(HistoriaNativa.restaurar(m.exportar()).exportar(), m.exportar());
    });
    probar('La victoria confirma una vez y conserva vida dañada, recursos, recargas y cortacéspedes', () => {
        const m = abierta(), antes = m.exportar();
        assert.equal(m.estado.inicioCasa, false);
        assert.deepEqual(m.zona(8).punto, punto());
        assert.equal(m.resultado(1, 'victoria', punto()), false);
        assert.deepEqual(m.exportar(), antes);
        assert.deepEqual(HistoriaNativa.restaurar(antes).exportar(), antes);
    });
    probar('Explorar la estación desbloquea dos tipos una vez y prepara una expedición real de cuatro carriles', () => {
        const m = abierta();
        assert.ok(m.explorar());
        assert.equal(m.explorar(), false);
        assert.ok(m.preparar(9, ['repetidora', 'patatapum']));
        const a = m.expedicion();
        assert.equal(a.zona, 9);
        const c = nivelHistoriaNativa(9, a.equipo, a.semilla);
        assert.equal(c.filas, 4);
        assert.equal(c.oleadas.length, 8);
        assert.ok(c.oleadas.flat().every(z => z.fila < 4));
        assert.ok(c.oleadas.flat().some(z => z.tipo === 'tutorial_armor1'));
        assert.deepEqual(HistoriaNativa.restaurar(m.exportar()).exportar(), m.exportar());
    });
    probar('Reservar el tipo completo retira sus ejemplares del origen sin devolver soles', () => {
        const m = abierta();
        m.explorar();
        assert.ok(m.preparar(9, ['girasol', 'repetidora']));
        assert.equal(m.propietaria('girasol'), 9);
        assert.equal(m.zona(8).punto.soles, 175);
        assert.ok(m.zona(8).punto.plantas.every(p => p.tipo !== 'sunflower'));
        assert.ok(!('sunflower' in m.zona(8).punto.recargas));
        assert.ok(!m.preparar(9, ['girasol'], 0));
    });
    probar('La frontera ataca mientras se conquista la estación y la pausa detiene ambos frentes', () => {
        const m = abierta();
        m.explorar();
        m.preparar(9, ['repetidora', 'patatapum']);
        m.expedicion();
        for (let i = 0; i < 35 * 60 - 1; i++)
            assert.equal(m.paso(), null);
        const a = m.paso();
        assert.equal(a.zona, 8);
        assert.equal(m.estado.ataques.length, 2);
        assert.deepEqual(a.punto, punto());
        assert.equal(m.preparar(8, ['nuez']), false);
        m.pausada = true;
        const antes = m.exportar();
        for (let i = 0; i < 600; i++)
            m.paso();
        assert.deepEqual(m.exportar(), antes);
    });
    probar('Dejar la casa sin semillas no la vuelve inmune a los ataques', () => {
        const m = abierta();
        m.explorar();
        m.preparar(9, ['lanzaguisantes', 'girasol', 'nuez', 'petacereza']);
        assert.equal(m.zona(8).equipo.length, 0);
        for (let i = 0; i < 2100; i++)
            m.paso();
        assert.equal(m.estado.ataques[0].zona, 8);
        assert.equal(nivelHistoriaNativa(8, [], 23, m.zona(8).punto).semillas.length, 0);
    });
    probar('Futuros formatos, tipos duplicados y puntos falsos no sustituyen una historia válida', () => {
        const m = abierta();
        for (const cambiar of [s => s.version = 4, s => s.zonas[1].capturada = true, s => s.zonas[0].punto = null, s => s.zonas[1].equipo = ['girasol'], s => s.zonas[0].punto.plantas[0].vida = 9999, s => s.zonas[0].punto.plantas.push({ ...s.zonas[0].punto.plantas[0] }), s => s.zonas[0].punto.recargas.inventada = 1]) {
            const s = m.exportar();
            cambiar(s);
            assert.throws(() => HistoriaNativa.restaurar(s));
        }
        const datos = new Map([['conquista-historia-v2', 'intacta']]), almacen = { getItem: k => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, v) }, g = new GuardadoHistoriaNativa(almacen, 'nativa');
        assert.equal(g.leer(), null);
        assert.ok(g.guardar(m.exportar()));
        assert.equal(datos.get('conquista-historia-v2'), 'intacta');
        datos.set('nativa', 'otro archivo');
        assert.equal(g.guardar(m.exportar()), false);
        assert.equal(datos.get('nativa'), 'otro archivo');
        const h = new GuardadoHistoriaNativa(almacen, 'nativa');
        assert.equal(h.leer(), null);
        assert.equal(h.guardar(m.exportar()), false);
    });
    probar('Una defensa perdida termina la historia sin regalar la expedición que seguía activa', () => {
        const m = abierta();
        m.explorar();
        m.preparar(9, ['repetidora']);
        m.expedicion();
        for (let i = 0; i < 2100; i++)
            m.paso();
        const a = m.estado.ataques.find(a => a.zona === 8);
        assert.ok(m.resultado(a.id, 'derrota', null));
        assert.equal(m.estado.perdida, true);
        const antes = m.exportar();
        assert.equal(m.resultado(m.estado.ataques[0].id, 'victoria', punto()), false);
        assert.deepEqual(m.exportar(), antes);
        assert.ok(HistoriaNativa.restaurar(antes).estado.perdida);
    });
    console.log(JSON.stringify({ checks: checks.length, fallos: 0, alcance: 'Casos estratégicos preparados; no es guardado a mitad de combate ni victoria de Cocos.' }));
}
finally {
    await fs.rm(temporal, { recursive: true, force: true });
}
