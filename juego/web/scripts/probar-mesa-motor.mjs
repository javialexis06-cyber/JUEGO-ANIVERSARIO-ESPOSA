// Partidas completas de reglas e IA. No sustituye los recorridos de interfaz y red.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const web = fileURLToPath(new URL('../', import.meta.url));
const dir = await mkdtemp(join(tmpdir(), 'mesa-partidas-'));
let partidas = 0;
try {
  await symlink(join(web, 'node_modules'), join(dir, 'node_modules'), 'dir');
  for (const id of ['dados', 'mancala', 'cajas', 'parchis', 'parchis2', 'clue']) {
    const fuente = id === 'parchis2' ? 'parchis' : id;
    const archivo = join(dir, id + '.mjs');
    await build({
      stdin: { contents: `export * from './src/mesa/${fuente}/reglas.ts'; export { ${id === 'dados' ? 'iaDados' : 'ia'} as bot } from './src/mesa/${fuente}/ia.ts';`, resolveDir: web },
      outfile: archivo, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent',
    });
    const modulo = await import(pathToFileURL(archivo).href);
    const reglas = id === 'parchis2' ? modulo.reglas2 : modulo.reglas;
    for (const empieza of ['el', 'ella']) for (const nivel of ['facil', 'normal', 'dificil']) {
      let semilla = empieza === 'el' ? 12345 : 67890;
      const azar = () => { semilla = Math.imul(semilla, 1664525) + 1013904223; return (semilla >>> 0) / 4294967296; };
      let e = reglas.inicial(empieza), espejo = structuredClone(e), pasos = 0;
      while (!reglas.fin(e) && pasos < 10000) {
        const antes = structuredClone(e);
        const mov = modulo.bot(e, nivel, azar);
        assert.deepEqual(e, antes, `${id}: la IA modificó el estado`);
        if (id === 'clue') assert.ok(modulo.legal(e, mov), `${id}: movimiento ilegal`);
        else if (id === 'dados') assert.equal(modulo.problema(e, mov), null);
        else assert.ok(reglas.movimientos(e).some(x => JSON.stringify(x) === JSON.stringify(mov)), `${id}: movimiento ilegal`);
        const original = e;
        e = reglas.aplicar(e, mov);
        assert.deepEqual(original, antes, `${id}: aplicar modificó el estado anterior`);
        espejo = reglas.aplicar(espejo, JSON.parse(JSON.stringify(mov)));
        assert.deepEqual(e, espejo, `${id}: dos clientes divergen`);
        e = JSON.parse(JSON.stringify(e));
        if (id === 'mancala') assert.equal(e.c.reduce((n, x) => n + x, 0), 48, 'Conservación de semillas');
        pasos++;
      }
      assert.ok(reglas.fin(e), `${id} ${empieza} ${nivel}: no terminó en ${pasos} acciones`);
      const fin = reglas.fin(e);
      assert.ok([null, 'el', 'ella'].includes(fin.ganador));
      assert.ok(Object.values(fin.puntos).every(Number.isFinite));
      assert.deepEqual(fin, reglas.fin(espejo));
      partidas++;
      console.log(`OK ${id}: inicio → final, empieza ${empieza}, IA ${nivel}, ${pasos} acciones`);
    }
  }
  console.log(JSON.stringify({ partidas, fallos: 0, alcance: 'reglas, IA, conservación, serialización y repetición determinista' }));
} finally {
  await rm(dir, { recursive: true, force: true });
}
