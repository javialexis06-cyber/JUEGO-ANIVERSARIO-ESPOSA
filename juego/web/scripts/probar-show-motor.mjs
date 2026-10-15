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
      export { crearCierreShow, guardarCierreShow } from './src/mesa/show/casa_show.ts';
      export { aplicarCierreShow, cierreValido } from './src/mesa/show/cierre.ts';
      export { asegurarDia, estadoDia } from './src/casa/pregunta_dia.ts';
      export { candidatasDelDia } from './src/mesa/show/motor.ts';
      export { armarPlan, calificar, conexion } from './src/mesa/show/motor.ts';
      export { BANCO, pregunta } from './src/mesa/show/preguntas';
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
        export const crearCierreShow = x => x; export const guardarCierreShow = async () => true;
        export const pagar = () => {}; export const vistas = () => [];
        export const musica = () => {}; export const SFX = {}; export const UI = class {};
        export const abrirLibro = () => {};
      `, loader: 'js' }));
    } }],
  });
  const { Show, casaReal, guardarRespuestasShow, crearCierreShow, guardarCierreShow, aplicarCierreShow, cierreValido, asegurarDia, estadoDia, candidatasDelDia, armarPlan, calificar, conexion, BANCO, pregunta, showVacio, normalizarShow, estadoDiaLigero, fechaHoy } =
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
  const cierre = crearCierreShow({ id: 'final-prueba', rol: 'el', monedas: 3, victorias: 1,
    episodio: { id: 'final-prueba', t: 1, m: 'local', p: { el: 100, ella: 50 }, c: 50, q: ['prueba'] } });
  assert.ok(cierreValido(cierre));
  assert.equal(cierreValido({ ...cierre, episodio: { id: cierre.id } }), false);
  const saldo = { monedas: 40 }, final = showVacio();
  assert.equal(aplicarCierreShow(final, saldo, cierre), true);
  assert.equal(aplicarCierreShow(final, saldo, cierre), true);
  assert.equal(saldo.monedas, 43);
  assert.equal(final.ep.length, 1);
  assert.equal(final.victorias.el, 1);
  const recarga = normalizarShow(JSON.parse(JSON.stringify(final)));
  aplicarCierreShow(recarga, saldo, cierre);
  assert.equal(saldo.monedas, 43);
  assert.equal(recarga.victorias.el, 1);
  console.log('OK Reintentos y respuestas perdidas conservan un episodio, un premio y una victoria tras recargar');
  sinEspacio = true;
  assert.equal(await guardarCierreShow(cierre), false);
  assert.ok([...disco.keys()].some(k => k.startsWith('show-cierre-pendiente:')));
  sinEspacio = false;
  assert.equal(await guardarCierreShow(cierre), true);
  assert.equal((await casaReal()).show.ep.length, 1);
  const nuevaCasa = showVacio(), nuevaCuenta = { monedas: 40 };
  aplicarCierreShow(nuevaCasa, nuevaCuenta, cierre, true);
  assert.equal(nuevaCuenta.monedas, 43);
  assert.equal(nuevaCasa.ep.length, 0);
  console.log('OK Cierre pendiente se recupera al liberar espacio; trasladar premio suelto no copia respuestas privadas');
  for (const modo of ['solo','local','linea']) for (const yo of ['el','ella']) for (let semilla=1;semilla<=30;semilla++) {
    let azar=semilla;
    const p=armarPlan({id:'prueba',modo,yo,empieza:yo,show:showVacio(),vistas:[],azar:()=>((azar=(azar*1664525+1013904223)>>>0)/4294967296),perro:{nombre:'Pelusa',pelaje:'caramelo',hembra:false}});
    const items=p.rondas.flatMap(r=>r.items);
    assert.equal(items.length,30); assert.equal(new Set(items.map(x=>x.id)).size,30);
    assert.ok(items.every(x=>pregunta(x.id)));
    assert.ok(p.rondas[2].items.filter(x=>!pregunta(x.id).o).length<=1);
    for(const r of p.rondas) assert.ok(r.items.every(x=>pregunta(x.id).tipo===r.tipo));
  }
  console.log('OK 180 planes completos de seis rondas, sin preguntas repetidas ni referencias rotas');
  const abierta={...BANCO.conoce[0],o:undefined}, item={id:abierta.id,s:'el'}, respuestas={el:{a:'pan'},ella:{g:'pan'}};
  assert.equal(calificar(abierta,item,respuestas).pendiente,true);
  assert.deepEqual(calificar(abierta,item,respuestas,'2').pts,{el:50,ella:100});
  assert.deepEqual(calificar(abierta,item,respuestas,'1').pts,{el:25,ella:50});
  assert.deepEqual(calificar(abierta,item,respuestas,'0').pts,{el:0,ella:0});
  assert.equal(calificar(BANCO.quien[0],{}, {el:{a:'e'}}).pendiente,true);
  assert.deepEqual(calificar(BANCO.zapato[0],{}, {el:{a:'e'},ella:{a:'e'}}).pts,{el:60,ella:60});
  assert.equal(conexion([calificar(BANCO.quien[0],{},{el:{a:'e'}})]),0);
  console.log('OK Abiertas exactas/casi/erróneas, sobre sin respuesta y relámpago conservan sus reglas');
  console.log('11 grupos de regresión del Show superados.');
} finally {
  delete globalThis.__guardarShow;
  delete globalThis.localStorage;
  await rm(dir, { recursive: true, force: true });
}
