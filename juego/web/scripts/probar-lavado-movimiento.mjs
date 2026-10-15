// Red reproducible, con los mandos y las fotos binarios reales. Se mide el recorrido visible en ambos lados;
// las posiciones del combate y el jugador local se comprueban por separado.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const carpeta = await mkdtemp(join(tmpdir(), 'lavado-movimiento-'));
const relojReal = Object.getOwnPropertyDescriptor(performance, 'now');
let reloj = 0;
Object.defineProperty(performance, 'now', { configurable: true, value: () => reloj * 1000 });
try {
  const archivo = join(carpeta, 'motor.mjs');
  await build({ stdin: { contents: `export {Motor} from './src/casa/lavado/motor'; export {MandosRemotos,Espejo,tomarFoto} from './src/casa/lavado/linea'; export {MovimientoRemoto} from './src/casa/lavado/movimiento_remoto';`, resolveDir: resolve(import.meta.dirname, '..') }, bundle: true, platform: 'node', format: 'esm', outfile: archivo, logLevel: 'silent' });
  const { Motor, MandosRemotos, Espejo, tomarFoto, MovimientoRemoto } = await import(pathToFileURL(archivo));
  const motor = (escenario = 'cara') => {
    const m = new Motor({ escenario, apurado: false, semilla: 8919, jugadores: ['el', 'ella'].map(rol => ({ rol, disfraz: rol === 'el' ? 'el_panda' : 'ella_pulga', poderes: {}, secretos: [] })) });
    m.jug.forEach(j => { j.x = j.y = j.vx = j.vy = 0; });
    return m;
  };
  const mando = (n, t, x, vx = 180) => ({ n, t, x, y: 0, vx, vy: 0, w: 780, h: 360, ax: 1, ay: 0, man: false });
  const cerca = (a, b, margen = 1e-4) => assert.ok(Math.abs(a - b) < margen, `${a} debe estar cerca de ${b}`);

  function recorrido(lado, fps, irregular) {
    const m = motor(), remoto = lado === 'anfitrion' ? 1 : 0, yo = 1 - remoto;
    m.jug[yo].x = -777;
    const mandos = new MandosRemotos(), espejo = new Espejo(m, yo), emisor = motor();
    const vistas = lado === 'anfitrion' ? mandos.vistas : espejo.vistas;
    let azar = 8919;
    const aleatorio = () => { azar = (Math.imul(azar, 1664525) + 1013904223) >>> 0; return azar / 2 ** 32; };
    const eventos = [], cada = lado === 'anfitrion' ? 0.08 : 0.1;
    let enviados = 0, perdidos = 0;
    for (let n = 0; n * cada <= 8; n++) {
      const t = n * cada, x = 180 * Math.min(t, 5), vx = t < 5 ? 180 : 0;
      enviados++;
      if (irregular && n > 0 && aleatorio() < 0.12) { perdidos++; continue; }
      emisor.jug[remoto].x = x; emisor.jug[remoto].vx = vx;
      eventos.push({ llegada: 0.035 + t + (irregular && n > 0 ? aleatorio() * 0.18 : 0),
        t: 500 + t, n, x, vx, b: tomarFoto(emisor, 0, n).b });
    }
    eventos.sort((a, b) => a.llegada - b.llegada);
    let k = 0, anterior, anteriorReal, maxPaso = 0, parados = 0, realesParados = 0, medidas = 0;
    for (let cuadro = 0; cuadro <= 9 * fps; cuadro++) {
      const t = cuadro / fps;
      while (k < eventos.length && eventos[k].llegada <= t + 1e-9) {
        const e = eventos[k++]; reloj = 5000 + e.llegada;
        if (lado === 'anfitrion') mandos.aplicar(m, remoto, mando(e.n, e.t, e.x, e.vx), reloj);
        else espejo.aplicar(e.b, e.t);
      }
      reloj = 5000 + t;
      const posiciones = m.jug.map(j => [j.x, j.y, j.vx, j.vy]);
      const v = vistas.ver(m, yo, reloj, false);
      assert.deepEqual(m.jug.map(j => [j.x, j.y, j.vx, j.vy]), posiciones, 'Dibujar no puede mover las posiciones del combate');
      assert.equal(v[yo], m.jug[yo], 'El propio se dibuja directamente, sin reserva de red');
      assert.equal(m.jug[yo].x, -777, 'La foto del anfitrión no cambia el movimiento propio');
      if (t > 0.7 && t < 4.7) {
        const paso = v[remoto].x - anterior, real = m.jug[remoto].x - anteriorReal;
        assert.ok(paso >= -1e-4, 'Mensajes atrasados no deben hacer retroceder al compañero');
        maxPaso = Math.max(maxPaso, paso);
        if (paso < 0.01) parados++;
        if (real < 0.01) realesParados++;
        medidas++;
      }
      if (t > 5.5) cerca(v[remoto].x, 900, 0.05); // Corrección residual menor que una vigésima de píxel.
      anterior = v[remoto].x; anteriorReal = m.jug[remoto].x;
    }
    assert.ok(parados / medidas < (irregular ? 0.06 : 0.01), `Demasiados cuadros detenidos: ${parados}/${medidas}`);
    assert.ok(maxPaso < 180 / fps * (irregular ? 2 : 1.02), `Salto de ${maxPaso} a ${fps} cuadros/s`);
    return { lado, fps, red: irregular ? 'demora variable de hasta 215 ms y 12 % de pérdida prevista' : 'demora fija de 35 ms', enviados, perdidos,
      cuadrosDetenidosMotor: `${realesParados}/${medidas}`, cuadrosDetenidosVista: `${parados}/${medidas}`, maxPasoVisible: +maxPaso.toFixed(3) };
  }
  for (const lado of ['anfitrion', 'invitado']) for (const fps of [30, 60]) for (const irregular of [false, true]) {
    console.log('✓ Recorrido', JSON.stringify(recorrido(lado, fps, irregular)));
  }
  {
    const m = motor(), r = new MandosRemotos();
    assert.ok(r.aplicar(m, 1, mando(2, 20, 100), 500));
    assert.equal(r.aplicar(m, 1, mando(1, 19, 50), 500.02), false);
    assert.equal(r.aplicar(m, 1, mando(2, 20, 40), 500.03), false);
    assert.equal(m.jug[1].x, 100, 'Un mando viejo o repetido no cambia la posición ni la vista');
    assert.equal(r.aplicar(m, 1, mando(3, 21, NaN), 500.04), false);
    assert.ok(r.aplicar(m, 1, mando(3, 21, 110), 500.05), 'Un mensaje inválido no consume la secuencia');
    const antiguo = mando(0, 0, 120, 0); delete antiguo.n; delete antiguo.t;
    assert.ok(r.aplicar(m, 1, antiguo, 500.1));
    const e = new Espejo(motor(), 1), h = motor(); h.jug[0].x = 200;
    const f = tomarFoto(h, 0, 5).b; reloj = 500;
    e.aplicar(f); h.jug[0].x = 50; e.aplicar(tomarFoto(h, 0, 4).b); e.aplicar(f);
    assert.equal(e.m.jug[0].x, 200);
    cerca(e.vistas.ver(e.m, 1, 501, false)[0].x, 200);
    console.log('✓ Mandos/fotos viejos, repetidos e inválidos; compatibilidad con mensajes sin reloj ni secuencia');
  }
  {
    const r = new MovimientoRemoto();
    r.recibir({ x: 0, y: 0, vx: 180, vy: 0 }, 100, 0);
    r.recibir({ x: 18, y: 0, vx: 180, vy: 0 }, 100.1, 0.1);
    const detenido = r.ver(101);
    assert.ok(detenido.x <= 18 + 180 * 0.12, 'Durante un corte la predicción tiene alcance limitado');
    cerca(detenido.x, r.ver(105).x); assert.equal(detenido.vx, 0);
    r.recibir({ x: 70, y: 0, vx: 0, vy: 0 }, 106, 6); cerca(r.ver(106).x, 70);
    r.recibir({ x: 3000, y: -2000, vx: 0, vy: 0 }, 106.1, 6.1); cerca(r.ver(106.1).x, 3000);
    console.log('✓ Pérdida total: se frena, reconecta y recoloca sin arrastrar al jugador por el mapa');
  }
  {
    const m = motor(), r = new MandosRemotos(), j = m.jug[1];
    r.aplicar(m, 1, mando(0, 0, 10), 100);
    j.caido = true; j.x = 40;
    assert.equal(r.vistas.ver(m, 0, 100.05, false)[1], j, 'Al caer se usa inmediatamente la posición del motor');
    r.aplicar(m, 1, mando(1, 0.1, 200), 100.1); assert.equal(j.x, 40, 'El invitado no mueve su burbuja');
    j.caido = false; r.aplicar(m, 1, mando(2, 0.2, 50, 0), 100.2);
    cerca(r.vistas.ver(m, 0, 100.2, false)[1].x, 50);
    j.fuera = true; assert.equal(r.vistas.ver(m, 0, 100.3, false)[1], j);
    j.fuera = false; j.x = 1200; r.aplicar(m, 1, mando(3, 0.4, 1200, 0), 100.4);
    cerca(r.vistas.ver(m, 0, 100.4, false)[1].x, 1200);
    assert.equal(r.vistas.ver(m, 0, 100.5, true)[1], j, 'La pausa no extrapola movimiento');
    j.vida = 17; j.st.poder = 2; const v = r.vistas.ver(m, 0, 100.6, false)[1];
    assert.equal(v.vida, 17); assert.equal(v.st.poder, 2);
    console.log('✓ Caída, rescate, salida, retorno y pausa; vida e inventario siguen leyendo el estado real');
  }
  {
    const posiciones = [];
    for (const fps of [30, 60, 120]) {
      const r = new MovimientoRemoto(); let n = 0;
      for (let cuadro = 0; cuadro <= fps * 4; cuadro++) {
        const t = cuadro / fps;
        while (n * 0.1 <= t + 1e-9) {
          const s = n++ * 0.1;
          // Una esquina, marcha diagonal, vuelta en dirección contraria y parada.
          const x = s < 1 ? s * 180 : s < 2 ? 180 : s < 3 ? 180 - (s - 2) * 180 : 0;
          const y = s < 1 ? 0 : s < 2 ? (s - 1) * 180 : s < 3 ? 180 - (s - 2) * 180 : 0;
          r.recibir({ x, y, vx: s < 1 ? 180 : s >= 2 && s < 3 ? -180 : 0, vy: s >= 1 && s < 2 ? 180 : s >= 2 && s < 3 ? -180 : 0 }, s + 100, s);
        }
        const p = r.ver(t + 100);
        assert.ok(p.x >= -0.01 && p.x <= 180.01 && p.y >= -0.01 && p.y <= 180.01, 'Las esquinas no crean un arco fuera de la trayectoria');
        if (cuadro === fps * 2.5) posiciones.push([p.x, p.y]);
        if (cuadro === fps * 4) { cerca(p.x, 0); cerca(p.y, 0); }
      }
    }
    posiciones.forEach(p => { cerca(p[0], posiciones[0][0]); cerca(p[1], posiciones[0][1]); });
    const veloz = new MovimientoRemoto();
    veloz.recibir({ x: 0, y: 0, vx: 900, vy: 0 }, 100, 0);
    veloz.ver(100);
    veloz.recibir({ x: 360, y: 0, vx: 900, vy: 0 }, 100.4, 0.4);
    const recuperado = veloz.ver(100.4);
    assert.ok(recuperado.x > 0 && recuperado.x < 360, 'Marcha rápida y pérdida breve no se confunden con un teletransporte');
    for (const escenario of ['lavamanos', 'tobogan', 'jabonera']) {
      const m = motor(escenario), r = new MandosRemotos(), j = m.jug[1];
      const y = m.esc.limites ? m.esc.limites.yMax - 18 : 0;
      const x = m.esc.limitesX ? m.esc.limitesX.xMax - 18 : 0;
      r.aplicar(m, 1, { ...mando(0, 0, x, 180), y, vy: 180 }, 100);
      const v = r.vistas.ver(m, 0, 101, false)[1];
      if (m.esc.limites) assert.ok(v.y <= y, 'La predicción visual respeta el borde horizontal');
      if (m.esc.limitesX) assert.ok(v.x <= x, 'La predicción visual respeta el borde vertical');
      assert.equal(j.y, y, 'El dibujo no modifica la posición del motor');
    }
    console.log('✓ Esquinas, diagonal, giro y parada iguales a 30/60/120 cuadros; marcha rápida y límites conservados');
  }
} finally {
  if (relojReal) Object.defineProperty(performance, 'now', relojReal); else delete performance.now;
  await rm(carpeta, { recursive: true, force: true });
}
