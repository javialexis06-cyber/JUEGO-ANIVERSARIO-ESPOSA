// Un cupo muerto no vuelve a usarse mientras su índice siga en la lista del cuadro actual.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const carpeta = await mkdtemp(join(tmpdir(), 'lavado-enemigos-'));
try {
  const archivo = join(carpeta, 'motor.mjs');
  await build({ stdin: { contents: `export {Motor} from './src/casa/lavado/motor'; export {Rejilla} from './src/casa/lavado/rejilla'; export {botPaso} from './src/casa/lavado/bot'; export {Espejo,tomarFoto} from './src/casa/lavado/linea'; export {ESCONDIDAS,maxNivelArma} from './src/casa/lavado/armas';`, resolveDir: resolve(import.meta.dirname, '..') }, bundle: true, platform: 'node', format: 'esm', outfile: archivo, logLevel: 'silent' });
  const { Motor, Rejilla, botPaso, Espejo, tomarFoto, ESCONDIDAS, maxNivelArma } = await import(pathToFileURL(archivo));
  const motor = () => new Motor({ escenario: 'cara', apurado: false, semilla: 8919, jugadores: [{ rol: 'el', disfraz: 'el_panda', poderes: {}, secretos: [] }] });
  const unicos = m => {
    const indices = [...m.vivos.slice(0, m.nVivos)];
    assert.equal(new Set(indices).size, indices.length, 'Cada cupo debe figurar una sola vez en la lista');
    assert.ok(indices.every(i => i >= 0 && i < m.en.length));
  };
  // Escenarios de reglas preparados: comprobar acceso y receta sin fingir una campaña desbloqueada.
  for (const escenario of ['cara', 'lavamanos', 'banera', 'ducha']) {
    const crear = secretos => new Motor({ escenario, apurado: false, semilla: 8919, jugadores: [{ rol: 'el', disfraz: 'el_panda', poderes: {}, secretos }] });
    const ocultos = m => m.objs.filter(o => o.vivo && o.tipo === 'tesoro' && ESCONDIDAS[o.calidad].id.startsWith('aret'));
    assert.equal(ocultos(crear([])).length, 0, 'Los aretes no deben aparecer antes del desbloqueo');
    const m = crear(['cortina', 'aretIzq', 'aretDer']), j = m.jug[0], aretes = ocultos(m);
    assert.deepEqual(aretes.map(o => ESCONDIDAS[o.calidad].id).sort(), ['aretDer', 'aretIzq']);
    const recoger = (m, j, o) => { j.x = o.x; j.y = o.y; j.mx = j.my = 0; for (let k = 0; k < 10 && o.vivo; k++) m.paso(1 / 30); assert.equal(o.vivo, false); };
    for (const o of aretes) {
      j.x = o.x - 400; j.y = o.y; m.paso(1 / 30);
      assert.ok(m.en.some(e => e.vivo && e.elite && e.fijo && Math.hypot(e.x - o.x, e.y - o.y) < 100), 'Cada arete debe conservar su guardián');
      const cliente = crear([]), espejo = new Espejo(cliente, 0);
      espejo.aplicar(tomarFoto(m, 0, 1).b);
      assert.ok(cliente.objs.some(v => v.vivo && v.tipo === 'tesoro' && v.calidad === o.calidad), 'El invitado debe reconocer el hallazgo nuevo');
      recoger(m, j, o); assert.equal(j.pasivas.get(ESCONDIDAS[o.calidad].id), 1);
    }
    m.darArma(j, 'cortina', maxNivelArma('cortina'));
    m.t = 599; assert.equal(m.evolucionPosible(j), null, 'La receta sigue esperando al minuto 10');
    m.t = 600; m.abrirCofre(j, 2);
    assert.ok(j.armas.some(a => a.id === 'cortinaTerciopelo'), 'El cofre debe completar la receta con ambos aretes recogidos');
    const llena = crear(['aretIzq', 'aretDer']), jl = llena.jug[0];
    for (const id of ['jabonFuerte', 'relojArena', 'lupa', 'espejoDoble', 'crema', 'sales']) llena.darPasiva(jl, id);
    const o = ocultos(llena)[0], id = ESCONDIDAS[o.calidad].id, antes = jl.pasivas.size;
    recoger(llena, jl, o); assert.equal(jl.pasivas.has(id), false); assert.equal(jl.pasivas.size, antes, 'No se entregan ranuras extra');
    console.log(`✓ ${escenario}: desbloqueo, guardianes, foto de red, recogida, ranuras y evolución mediante cofre`);
  }
  {
    const m = motor(); while (m.crear('germen', [0, 0], m.jug[0])) {}
    unicos(m); const victima = m.en[m.vivos[0]], uid = victima.uid, indice = m.vivos[0];
    m.quitar(victima);
    assert.equal(m.crear('duchaHelada', [0, 0], m.jug[0]), null, 'Debe esperar a liberar el índice, sin revivirlo dentro de la lista');
    m.compactar();
    const nueva = m.crear('duchaHelada', [0, 0], m.jug[0]);
    assert.equal(nueva, victima); assert.notEqual(nueva.uid, uid); unicos(m);
    const rej = new Rejilla(m.en.length);
    for (const i of m.vivos.slice(0, m.nVivos)) rej.insertar(i, m.en[i].x, m.en[i].y);
    const n = rej.circulo(0, 0, 100);
    assert.equal([...rej.fuera.slice(0, n)].filter(i => i === indice).length, 1, 'La Muerte debe recibir un impacto por consulta');
    console.log('✓ Un cupo muerto espera a compactar y su reemplazo recibe un solo impacto por consulta');
  }
  {
    const m = motor();
    for (let k = 0; k < 200; k++) {
      const e = m.crear('germen', [k, 0], m.jug[0]); if (e) m.matar(e, 0, false);
      const otro = m.crear('mosquito', [0, k], m.jug[0]); if (otro) m.quitar(otro);
      unicos(m); if (k % 10 === 0) m.compactar();
    }
    m.compactar(); assert.equal(m.nVivos, 0); assert.equal(m.nComunes, 0);
    console.log('✓ Muertes, nuevas apariciones y limpieza sucesivas conservan una lista única y contadores correctos');
  }
  {
    const host = motor(), cliente = motor(), espejo = new Espejo(cliente, 0);
    for (let seq = 1; seq <= 20; seq++) {
      for (const e of host.en) if (e.vivo) host.quitar(e);
      host.compactar();
      for (let k = 0; k < 5; k++) host.crear(k === 0 ? 'duchaHelada' : 'germen', [k * 12, 0], host.jug[0]);
      espejo.aplicar(tomarFoto(host, 0, seq).b); unicos(host); unicos(cliente);
      const uids = m => [...m.vivos.slice(0, m.nVivos)].map(i => m.en[i].uid).sort((a, b) => a - b);
      assert.deepEqual(uids(cliente), uids(host), 'La foto debe conservar cinco identidades sin resucitar las anteriores');
    }
    console.log('✓ Veinte fotos de red conservan identidades y apariciones únicas tras reutilizar enemigos');
  }
  {
    const m = motor(); let pasos = 0;
    while (!m.fin && m.t < 10 * 60 && pasos++ < 10 * 60 * 30 * 1.2) { botPaso(m); m.paso(1 / 30); unicos(m); }
    assert.ok(m.fin || m.t >= 600);
    console.log('✓ Una partida con horda y piloto mantiene índices únicos en todos los cuadros hasta derrota o diez minutos');
  }
} finally { await rm(carpeta, { recursive: true, force: true }); }
