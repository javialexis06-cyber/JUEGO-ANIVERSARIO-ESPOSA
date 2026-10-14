// Regresiones del guardado y calendario del Show, sin alterar precios, dificultad ni recompensas.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const web = fileURLToPath(new URL('../', import.meta.url));
const dir = await mkdtemp(join(tmpdir(), 'show-regresion-'));
try {
  await symlink(join(web, 'node_modules'), join(dir, 'node_modules'), 'dir');
  await build({
    stdin: { contents: `
      export { Show } from './src/mesa/show/show.ts';
      export { casaShow as casaReal, guardarRespuestasShow } from './src/mesa/show/casa_show.ts';
      export { asegurarDia, estadoDia } from './src/casa/pregunta_dia.ts';
      export { candidatasDelDia } from './src/mesa/show/motor.ts';
      export { showVacio, normalizarShow, estadoDiaLigero, fechaHoy } from './src/casa/show_casa.ts';
    `, resolveDir: web },
    outfile: join(dir, 'motor.mjs'), bundle: true, packages: 'external',
    platform: 'node', format: 'esm', loader: { '.css': 'empty' }, logLevel: 'silent',
    plugins: [{ name: 'pantalla-y-red-de-prueba', setup(b) {
      b.onResolve({ filter: /^(\.\.\/\.\.\/sonido|\.\/casa_show|\.\/estudio|\.\/guion|\.\/sonidos|\.\/ui|\.\/libro)$/ },
        a => a.importer.endsWith('/show.ts') ? { path: a.path, namespace: 'doble' } : null);
      b.onLoad({ filter: /.*/, namespace: 'doble' }, () => ({ contents: `
        export const casaShow = fn => globalThis.__guardarShow(fn);
        export const guardarRespuestasShow = (id, cambios) => globalThis.__guardarShow(s => {
          for (const campo of ['r', 'g', 'c']) for (const rol of ['el', 'ella']) Object.assign(s[campo][rol], cambios[campo][rol]);
        });
        export const contarVictoria = () => {}; export const marcarVistas = () => {};
        export const pagar = () => {}; export const vistas = () => [];
        export const musica = () => {}; export const SFX = {}; export const UI = class {};
        export const abrirLibro = () => {};
      `, loader: 'js' }));
    } }],
  });
  const { Show, casaReal, guardarRespuestasShow, asegurarDia, estadoDia, candidatasDelDia, showVacio, normalizarShow, estadoDiaLigero, fechaHoy } =
    await import(pathToFileURL(join(dir, 'motor.mjs')).href);
  const fixture = () => Object.assign(Object.create(Show.prototype), {
    guardadas: new Set(), guardando: new Map(),
    pasos: [{ ronda: 0, item: { id: 'prueba' }, p: { tipo: 'quien' } }],
    modo: 'solo', yo: 'el', resp: new Map([[0, { el: { a: 'e' } }]]),
    notas: new Map(), show: showVacio(), ui: { aviso() {} }, o: { id: 'episodio-prueba' },
  });

  let intentos = 0;
  globalThis.__guardarShow = async fn => {
    const s = showVacio(); fn(s);
    return { guardado: ++intentos > 1, show: s };
  };
  const partida = fixture();
  await partida.guardar(0);
  assert.equal(partida.guardadas.size, 0);
  await partida.guardar(0);
  await partida.guardar(0);
  assert.equal(intentos, 2);
  assert.equal(partida.show.r.el.prueba, 'e');
  console.log('OK Fallo de guardado conserva la ronda pendiente; reintento guarda y no duplica');

  let resolver;
  intentos = 0;
  globalThis.__guardarShow = fn => new Promise(ok => {
    intentos++; resolver = () => { const s = showVacio(); fn(s); ok({ guardado: true, show: s }); };
  });
  const concurrente = fixture();
  const primero = concurrente.guardar(0), segundo = concurrente.guardar(0);
  resolver();
  await Promise.all([primero, segundo]);
  assert.equal(intentos, 1);
  assert.equal(concurrente.guardando.size, 0);
  console.log('OK Final espera un guardado en curso sin enviar otra escritura');

  const s = showVacio();
  for (const p of candidatasDelDia()) for (const r of ['el', 'ella']) { s.r[r][p.id] = '0'; s.g[r][p.id] = '0'; }
  const libro = structuredClone({ r: s.r, g: s.g });
  asegurarDia(s, fechaHoy());
  assert.equal(estadoDia(s, 'el').contestada, false);
  assert.equal(estadoDia(s, 'el').revelada, false);
  assert.equal(estadoDiaLigero(s, 'el').revelada, false);
  assert.deepEqual({ r: s.r, g: s.g }, libro);
  assert.equal(estadoDia(normalizarShow(s), 'el').contestada, false);
  console.log('OK Banco agotado abre una pregunta nueva sin borrar el libro ni cobrar por respuestas antiguas');

  s.dia.respuestas = { el: { a: '2', g: '3' }, ella: { a: '3', g: '2' } };
  assert.equal(estadoDia(s, 'el').revelada, true);
  const anterior = structuredClone(s.dia);
  asegurarDia(s, '2099-01-01');
  assert.deepEqual(s.dias.at(-1), anterior);
  assert.equal(estadoDia(s, 'el').contestada, false);
  s.r.el[anterior.q] = '8';
  assert.equal(normalizarShow(s).dias.at(-1).respuestas.el.a, '2');
  console.log('OK Respuestas y fechas archivadas sobreviven nuevas respuestas y recarga');

  const vieja = showVacio();
  vieja.dia = { f: fechaHoy(), q: anterior.q, pagado: { el: 1 } };
  vieja.r.el[anterior.q] = '2'; vieja.g.el[anterior.q] = '3';
  assert.equal(estadoDia(normalizarShow(vieja), 'el').contestada, true);
  assert.equal(estadoDia(normalizarShow(vieja), 'el').pagado, true);
  console.log('OK Partidas anteriores conservan respuestas y cobros de la pregunta en curso');

  globalThis.localStorage = { getItem: () => null, setItem: () => { throw new Error('Sin espacio'); } };
  const fallo = await casaReal(x => { x.r.el.prueba = 'e'; });
  assert.equal(fallo.guardado, false);
  assert.equal(fallo.show.r.el.prueba, undefined);
  console.log('OK Almacenamiento lleno no informa un guardado exitoso');

  const disco = new Map();
  let sinEspacio = true;
  globalThis.localStorage = {
    get length() { return disco.size; }, key: i => [...disco.keys()][i] ?? null,
    getItem: k => disco.get(k) ?? null, removeItem: k => disco.delete(k),
    setItem: (k, v) => { if (sinEspacio && k === 'show-libro-suelto') throw new Error('Sin espacio'); disco.set(k, v); },
  };
  const cambios = showVacio(); cambios.r.el.prueba = 'e';
  const guardandoReal = guardarRespuestasShow('episodio:el:0', cambios);
  assert.ok([...disco.keys()].some(k => k.startsWith('show-ronda-pendiente:')), 'La ronda debe estar en disco antes de esperar la red');
  assert.equal((await guardandoReal).guardado, false);
  assert.ok([...disco.keys()].some(k => k.startsWith('show-ronda-pendiente:')));
  sinEspacio = false;
  disco.set('nuestro-hogar-modo', JSON.stringify({ modo: 'linea', rol: 'el' }));
  const otraCasa = await casaReal();
  assert.equal(otraCasa.guardado, false);
  assert.equal(otraCasa.fuente, 'linea');
  assert.equal(otraCasa.show.r.el.prueba, undefined);
  assert.ok([...disco.keys()].some(k => k.startsWith('show-ronda-pendiente:')));
  disco.delete('nuestro-hogar-modo');
  const recuperado = await casaReal();
  assert.equal(recuperado.show.r.el.prueba, 'e');
  assert.equal([...disco.keys()].some(k => k.startsWith('show-ronda-pendiente:')), false);
  assert.equal((await casaReal()).show.r.el.prueba, 'e');
  console.log('OK Diario conserva la ronda, respeta la casa de origen y recupera sin duplicar premios');
  console.log('7 regresiones del Show superadas.');
} finally {
  delete globalThis.__guardarShow;
  delete globalThis.localStorage;
  await rm(dir, { recursive: true, force: true });
}
