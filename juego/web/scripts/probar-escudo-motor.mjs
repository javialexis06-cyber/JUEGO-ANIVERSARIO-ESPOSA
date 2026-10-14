// Campaña desde progreso nuevo, derrota, infinito y escrituras fallidas. No cambia recursos ni balance.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const carpeta = await mkdtemp(join(tmpdir(), 'escudo-motor-'));
const disco = new Map(), escrituras = new Map();
let cortes = new Set();
globalThis.localStorage = {
  getItem: k => disco.get(k) ?? null,
  setItem(k, v) {
    if (cortes.has(k)) throw new DOMException('Almacenamiento lleno', 'QuotaExceededError');
    escrituras.set(k, (escrituras.get(k) ?? 0) + 1);
    disco.set(k, v);
  },
};
try {
  const archivo = join(carpeta, 'motor.mjs');
  await build({
    stdin: { contents: `export * from './src/escudo/motor'; export * from './src/escudo/bot';
      export * from './src/escudo/datos'; export * from './src/escudo/progreso';`, resolveDir: resolve(import.meta.dirname, '..') },
    bundle: true, platform: 'node', format: 'esm', outfile: archivo, logLevel: 'silent',
  });
  const { Motor, crearBot, NIVELES, INFINITO, leerProgreso, GuardadoEscudo, desbloqueado, CLAVE_MISION } = await import(pathToFileURL(archivo));
  const recorrer = (m, bot, maxSegundos = 1200) => {
    let finales = 0;
    for (let paso = 0; paso < 30 * maxSegundos && !m.terminado; paso++) {
      bot?.pensar(m); m.paso();
      finales += m.eventos.filter(e => e.k === 'fin').length;
      m.eventos.length = 0;
      assert.ok(Number.isFinite(m.luz) && m.luz >= 0, 'La luz nunca es negativa');
      assert.ok(m.torres.every(t => m.torresPermitidas.includes(t.tipo)), 'Solo torres desbloqueadas');
      assert.equal(new Set(m.torres.map(t => t.sitio)).size, m.torres.length, 'Una torre por sitio');
    }
    assert.ok(m.terminado, `Debe terminar dentro del tiempo de revisión: oleada ${m.oleada}, ${m.vidas} vidas, ${m.enemigos.length} enemigos, cuenta ${m.cuenta}`);
    assert.equal(finales, 1, 'Un único resultado por batalla');
    const fin = { resultado: m.terminado, vidas: m.vidas, luz: m.luz, oleada: m.oleada, estrellas: m.estrellas() };
    for (let k = 0; k < 60; k++) m.paso();
    assert.deepEqual({ resultado: m.terminado, vidas: m.vidas, luz: m.luz, oleada: m.oleada, estrellas: m.estrellas() }, fin);
    assert.equal(m.eventos.filter(e => e.k === 'fin').length, 0, 'No repetir el final');
    return fin;
  };

  let p = leerProgreso(false);
  assert.deepEqual(p.estrellas, {});
  for (let i = 0; i < NIVELES.length; i++) {
    assert.equal(desbloqueado(p, i), true);
    if (i < NIVELES.length - 1) assert.equal(desbloqueado(p, i + 1), false);
    const m = new Motor(NIVELES[i]);
    assert.equal(m.luz, NIVELES[i].luz);
    assert.deepEqual(m.torresPermitidas, NIVELES[i].torres);
    const fin = recorrer(m, crearBot(1));
    assert.equal(fin.resultado, 'gano');
    assert.equal(m.oleada, NIVELES[i].oleadas.length);
    p.estrellas[m.nivel.id] = fin.estrellas;
    assert.equal(new GuardadoEscudo(false, p).guardar(), true);
    assert.deepEqual(leerProgreso(false), p); p = leerProgreso(false);
    console.log(`✓ Campaña ${i + 1}/6: ${m.nivel.id}, ${fin.estrellas} estrellas, ${fin.vidas} vidas, avance conservado`);
  }
  const derrota = new Motor(NIVELES[0]);
  derrota.llamarOleada();
  assert.equal(recorrer(derrota, null).resultado, 'perdio');
  assert.equal(derrota.estrellas(), 0);
  console.log('✓ Derrota normal sin construir: cero estrellas y un solo final');
  const infinito = new Motor(INFINITO, { infinito: true });
  const marca = recorrer(infinito, crearBot(1), 7200);
  assert.equal(marca.resultado, 'perdio');
  assert.ok(marca.oleada > 1);
  p.infinito = Math.max(0, marca.oleada - 1);
  assert.equal(new GuardadoEscudo(false, p).guardar(), true);
  assert.equal(leerProgreso(false).infinito, p.infinito);
  console.log(`✓ Infinito hasta derrota natural y mejor marca guardada: ${p.infinito} oleadas`);

  const g = new GuardadoEscudo(false, p);
  const antes = leerProgreso(false);
  cortes = new Set(['escudo-progreso']);
  p.velocidad = 2;
  assert.equal(g.guardar(), false); assert.equal(g.pendiente, true);
  assert.deepEqual(leerProgreso(false), antes);
  p.finalVisto = true;
  cortes.clear();
  assert.equal(g.confirmar(), true); assert.equal(g.pendiente, false);
  assert.deepEqual(leerProgreso(false), p);
  console.log('✓ Almacenamiento lleno: conserva el progreso pendiente y reintenta con la copia actual');

  cortes = new Set([CLAVE_MISION]);
  g.registrarMision(3);
  const fechaAntes = Date.now();
  assert.equal(g.guardar(), false); assert.equal(g.pendiente, true);
  assert.equal(disco.has(CLAVE_MISION), false);
  assert.deepEqual(leerProgreso(false), p);
  g.registrarMision(1); // El reintento de la misma batalla conserva el recibo original.
  cortes.clear();
  assert.equal(g.confirmar(), true);
  const recibo = JSON.parse(disco.get(CLAVE_MISION));
  assert.equal(recibo.estrellas, 3); assert.equal(recibo.mision, 'P23'); assert.equal(recibo.ganada, true);
  assert.ok(recibo.fecha <= fechaAntes);
  const escritas = escrituras.get(CLAVE_MISION);
  assert.equal(g.confirmar(), true);
  assert.equal(escrituras.get(CLAVE_MISION), escritas);
  console.log('✓ El recibo P23 fallido se reintenta, conserva estrellas y fecha y no se repite después de confirmar');

  g.registrarMision(2);
  cortes = new Set(['escudo-progreso']);
  assert.equal(g.guardar(), false);
  const reciboConfirmado = disco.get(CLAVE_MISION), veces = escrituras.get(CLAVE_MISION);
  cortes.clear();
  assert.equal(g.confirmar(), true);
  assert.equal(disco.get(CLAVE_MISION), reciboConfirmado);
  assert.equal(escrituras.get(CLAVE_MISION), veces);
  console.log('✓ Si solo falla el progreso, no vuelve a emitir el recibo P23 ya confirmado');

  const amigo = leerProgreso(true), pareja = leerProgreso(false);
  assert.deepEqual(amigo.estrellas, {});
  amigo.estrellas.mirador = 1;
  assert.equal(new GuardadoEscudo(true, amigo).guardar(), true);
  assert.deepEqual(leerProgreso(false), pareja);
  assert.deepEqual(leerProgreso(true), amigo);
  console.log('✓ Amigos y pareja conservan sus progresos separados');
} finally { await rm(carpeta, { recursive: true, force: true }); }
