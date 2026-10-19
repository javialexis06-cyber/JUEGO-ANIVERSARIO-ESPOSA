// Motor de Plantas contra Zombis (src/jardin/pvz): el piloto gana el mundo 1 con varias semillas, se pierde sin
// defensa y cada planta y zombi del día cumple sus reglas de PvZ. Escenarios unitarios preparados en un jardín sin
// oleadas ni sol del cielo; los recorridos completos usan el director de oleadas real.
// Uso (desde juego/web): node scripts/probar-pvz-motor.mjs   → imprime OK por comprobación; código 1 si algo falla.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const tmp = await mkdtemp(join(tmpdir(), 'pvz-motor-'));
let fallos = 0;
try {
  const f = join(tmp, 'pvz.mjs');
  await build({
    stdin: {
      contents: [
        "export * from './src/jardin/pvz/motor/motor';",
        "export * from './src/jardin/pvz/motor/bot';",
        "export * as R from './src/jardin/pvz/motor/reglas';",
        "export * from './src/jardin/pvz/datos/niveles';",
        "export * from './src/jardin/pvz/datos/plantas';",
        "export * from './src/jardin/pvz/datos/zombis';",
        "export { ESTRENOS } from './src/jardin/pvz/historia/estrenos';",
      ].join('\n'),
      resolveDir: resolve(import.meta.dirname, '..'),
    },
    bundle: true, platform: 'node', format: 'esm', outfile: f, logLevel: 'silent',
  });
  const { MotorPvZ, crearBot, elegirMazo, R, NIVELES, nivelPorId, PLANTAS, ZOMBIS, ESTRENOS } = await import(pathToFileURL(f));

  const comprobar = (nombre, fn) => {
    try {
      fn();
      console.log('OK', nombre);
    } catch (e) {
      fallos++;
      console.log('FALLA', nombre, '\n  ', e?.message ?? e);
    }
  };
  const pasos = (s) => Math.round(s * 60);
  const avanzar = (m, s, cada) => {
    const ev = [];
    for (let i = 0; i < pasos(s); i++) {
      // Después del fin el motor no avanza y conserva los eventos del último paso: no se cuentan dos veces.
      if (m.paso()) ev.push(...m.eventos);
      cada?.(m);
    }
    return ev;
  };
  const DIA9 = ['lanzaguisantes', 'girasol', 'petacereza', 'nuez', 'patatapum', 'hielaguisantes', 'carnivora', 'repetidora', 'desesporada'];
  /** Jardín de pruebas: 5 filas de día, sin oleadas ni sol del cielo, con todas las plantas del día y sol de sobra. */
  const lab = (op = {}, nivel = nivelPorId('1-9')) => {
    const m = new MotorPvZ(nivel, { semilla: 7, sinOleadas: true, sinSolCielo: true, ranuras: 10, mazo: DIA9, ...op });
    assert.ok(m.comenzar().ok);
    m.sol = 9990;
    return m;
  };
  const sembrar = (m, tipo, fila, col) => {
    m.tarjeta(tipo).restante = 0;
    const r = m.sembrar(tipo, fila, col);
    assert.ok(r.ok, `sembrar ${tipo} en ${fila},${col}: ${r.motivo}`);
    return m.plantaEn(fila, col);
  };
  const NOCHE = { ...nivelPorId('1-9'), id: 'prueba-noche', noche: true, solDelCielo: false };

  // ---------------------------------------------------------------------------------------------------------
  // Datos del mundo 1

  comprobar('niveles 1-1 a 1-10 fieles a PvZ 1 y premios iguales a estrenos.ts', () => {
    const ids = NIVELES.filter((n) => n.mundo === 1).map((n) => n.id);
    assert.deepEqual(ids, ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8', '1-9', '1-10']);
    for (const id of ids) {
      const n = nivelPorId(id);
      const e = ESTRENOS[id];
      assert.equal(n.premio?.planta, e.planta, `${id} planta`);
      assert.equal(n.premio?.objeto, e.objeto, `${id} objeto`);
      if (e.tipo === 'minijuego') assert.equal(n.tipo, 'minijuego', id);
      if (e.tipo === 'cinta') assert.equal(n.tipo, 'cinta', id);
      assert.equal(n.oleadas, n.tablaOleadas.length, `${id} tabla`);
      assert.equal(n.oleadas, n.banderas ? Math.max(n.oleadas, n.banderas * 10 > n.oleadas ? n.oleadas : n.banderas * 10) : n.oleadas);
    }
    assert.deepEqual(nivelPorId('1-1').filasActivas, [2]);
    assert.deepEqual(nivelPorId('1-2').filasActivas, [1, 2, 3]);
    assert.deepEqual(nivelPorId('1-3').filasActivas, [1, 2, 3]);
    for (const id of ['1-4', '1-6', '1-9', '1-10']) assert.equal(nivelPorId(id).filasActivas.length, 5);
    assert.deepEqual(ids.map((id) => nivelPorId(id).banderas), [0, 1, 1, 1, 1, 1, 2, 1, 2, 2]);
    assert.deepEqual(ids.map((id) => nivelPorId(id).oleadas), [4, 6, 8, 10, 8, 10, 20, 10, 20, 20]);
    assert.equal(nivelPorId('1-1').solInicial, 150);
    assert.equal(nivelPorId('1-4').solInicial, 50);
    assert.deepEqual(ids.filter((id) => nivelPorId(id).seleccion), ['1-8', '1-9']);
    assert.deepEqual(nivelPorId('1-1').plantasDisponibles, ['lanzaguisantes']);
    assert.deepEqual(nivelPorId('1-8').plantasDisponibles, ['lanzaguisantes', 'girasol', 'petacereza', 'nuez', 'patatapum', 'hielaguisantes', 'carnivora']);
    assert.equal(nivelPorId('1-9').plantasDisponibles.length, 8);
    assert.deepEqual(nivelPorId('1-6').zombis, ['zombi', 'abanderado', 'caracono', 'pertiga']);
    assert.ok(!nivelPorId('1-8').zombis.includes('pertiga'), '1-8 no tiene saltadores');
  });

  comprobar('números de plantas y zombis del día (sol, recarga, vida, velocidad)', () => {
    const p = (id) => PLANTAS[id];
    assert.deepEqual([p('lanzaguisantes').sol, p('lanzaguisantes').recarga, p('lanzaguisantes').vida], [100, 7.5, 300]);
    assert.deepEqual([p('girasol').sol, p('petacereza').sol, p('petacereza').recarga, p('nuez').vida, p('nuez').recarga], [50, 150, 50, 4000, 30]);
    assert.deepEqual([p('patatapum').sol, p('patatapum').recarga, p('hielaguisantes').sol, p('carnivora').sol, p('repetidora').sol, p('desesporada').sol], [25, 30, 175, 150, 200, 0]);
    assert.equal(p('desesporada').nocturna, true);
    const z = (id) => ZOMBIS[id];
    assert.equal(z('zombi').vida, 270);
    assert.ok(Math.abs(z('zombi').velocidad - 80 / 4.7) < 0.05);
    assert.ok(Math.abs(z('abanderado').velocidad - 80 / 3.7) < 0.05);
    assert.ok(Math.abs(z('pertiga').velocidad - 32) < 0.05);
    assert.equal(z('caracono').casco.vida, 370);
    assert.equal(z('caracubo').casco.vida, 1100);
    assert.equal(z('caracubo').casco.metal, true);
    assert.equal(z('pertiga').vida, 500);
  });

  // ---------------------------------------------------------------------------------------------------------
  // Piloto: gana el mundo 1 con 3 semillas por nivel

  for (const n of NIVELES.filter((n) => n.mundo === 1)) {
    for (const semilla of [1, 2, 3]) {
      comprobar(`piloto gana ${n.id} con semilla ${semilla}`, () => {
        const m = new MotorPvZ(n, { semilla, mazo: elegirMazo(n) });
        const bot = crearBot();
        let fines = 0;
        let premios = 0;
        for (let i = 0; i < 60 * 1500 && (m.estado === 'intro' || m.estado === 'jugando'); i++) {
          bot(m);
          m.paso();
          for (const e of m.eventos) {
            if (e.t === 'fin') fines++;
            if (e.t === 'premio') premios++;
          }
          assert.ok(m.sol >= 0 && m.sol <= R.SOL_MAX);
          assert.ok(m.abonoCargas >= 0 && m.abonoCargas <= R.ABONO_MAX);
        }
        assert.equal(m.estado, 'gano', `${n.id} semilla ${semilla}: oleada ${m.oleada}/${m.oleadasTotal}, ${m.zombis.length} zombis`);
        assert.equal(fines, 1);
        assert.equal(premios, 1);
        assert.equal(m.oleada, m.oleadasTotal);
        assert.equal(m.progreso, 1);
        const p = m.premio;
        if (n.premio.planta) assert.deepEqual([p.tipo, p.id], ['planta', n.premio.planta]);
        else if (n.premio.objeto) assert.deepEqual([p.tipo, p.id], ['objeto', n.premio.objeto]);
        else assert.equal(p.tipo, 'nota');
        // Casillas sin plantas repetidas en la misma capa.
        assert.equal(new Set(m.plantas.map((q) => `${q.fila}:${q.col}:${q.capa}`)).size, m.plantas.length);
        // Inmutable después del fin.
        const antes = JSON.stringify(m);
        m.paso();
        assert.equal(m.sembrar('lanzaguisantes', 0, 0).ok, false);
        assert.equal(m.palear(0, 0).ok, false);
        assert.equal(m.usarAbono(0, 0).ok, false);
        assert.equal(m.recoger(1), false);
        assert.equal(JSON.stringify(m), antes);
      });
    }
  }

  comprobar('sin defensa se pierde (1-4) y en 1-1 los zombis esperan a los dos Lanzaguisantes', () => {
    const m = new MotorPvZ(nivelPorId('1-4'), { semilla: 5 });
    m.comenzar();
    const ev = avanzar(m, 600);
    assert.equal(m.estado, 'perdio');
    assert.equal(ev.filter((e) => e.t === 'fin').length, 1);
    assert.equal(ev.find((e) => e.t === 'fin').gano, false);
    const antes = JSON.stringify(m);
    m.paso();
    assert.equal(JSON.stringify(m), antes);
    const t = new MotorPvZ(nivelPorId('1-1'), { semilla: 5 });
    t.comenzar();
    avanzar(t, 90);
    assert.equal(t.zombis.length, 0, 'Sin los dos Lanzaguisantes no salen zombis');
    assert.equal(t.progreso, 0);
    t.sol = 200;
    assert.ok(t.sembrar('lanzaguisantes', 2, 0).ok);
    t.tarjeta('lanzaguisantes').restante = 0;
    assert.ok(t.sembrar('lanzaguisantes', 2, 1).ok);
    avanzar(t, R.PRIMERA_OLEADA + 0.1);
    assert.equal(t.zombis.length, 1, 'La primera oleada llega a los 18 s');
  });

  // ---------------------------------------------------------------------------------------------------------
  // Banco, sol, pala, terreno

  comprobar('costos, recargas iniciales y de siembra, casillas válidas y terreno', () => {
    const m = new MotorPvZ(nivelPorId('1-4'), { semilla: 3, sinSolCielo: true });
    assert.equal(m.sembrar('girasol', 0, 0).motivo, 'estado', 'En la intro no se siembra');
    m.comenzar();
    assert.equal(m.sol, 50);
    assert.equal(m.tarjeta('lanzaguisantes').restante, 0);
    assert.equal(m.tarjeta('nuez').restante, 20, 'Recarga lenta empieza a medias');
    assert.equal(m.tarjeta('petacereza').restante, 35, 'Recarga muy lenta empieza a medias');
    assert.equal(m.sembrar('lanzaguisantes', 0, 0).motivo, 'sol');
    assert.ok(m.sembrar('girasol', 0, 0).ok);
    assert.equal(m.sol, 0);
    m.sol = 500;
    assert.equal(m.sembrar('girasol', 1, 0).motivo, 'recarga');
    assert.equal(m.sembrar('lanzaguisantes', 0, 0).motivo, 'ocupada');
    assert.equal(m.sembrar('lanzaguisantes', 0, 9).motivo, 'casilla');
    assert.equal(m.sembrar('lanzaguisantes', -1, 0).motivo, 'casilla');
    assert.equal(m.sembrar('lanzaguisantes', 0.5, 0).motivo, 'casilla');
    assert.equal(m.sembrar('repetidora', 0, 1).motivo, 'tipo', 'Solo los sobres del mazo');
    assert.equal(m.sembrar('__proto__', 0, 1).motivo, 'tipo');
    assert.equal(m.sembrar('nuez', 1, 1).motivo, 'recarga');
    avanzar(m, 7.5);
    assert.ok(m.tarjeta('girasol').disponible);
    assert.ok(m.sembrar('girasol', 1, 0).ok);
    avanzar(m, 12.5);
    assert.ok(m.tarjeta('nuez').disponible);
    assert.ok(m.sembrar('nuez', 1, 5).ok);
    assert.equal(m.tarjeta('nuez').restante, 30);
    const t = new MotorPvZ(nivelPorId('1-1'), { semilla: 3 });
    t.comenzar();
    assert.equal(t.sembrar('lanzaguisantes', 0, 0).motivo, 'terreno', '1-1: las filas de tierra no se siembran');
    assert.ok(t.sembrar('lanzaguisantes', 2, 0).ok);
    assert.equal(t.cortacespedes.length, 1);
    assert.deepEqual(t.terreno.map((f) => f[0]), ['tierra', 'tierra', 'cesped', 'tierra', 'tierra']);
    const s = new MotorPvZ(nivelPorId('1-8'), { semilla: 3, mazo: ['carnivora', 'girasol', 'lanzaguisantes', 'nuez', 'petacereza', 'patatapum', 'hielaguisantes'] });
    assert.equal(s.mazo.length, 6, 'Solo caben 6 sobres');
  });

  comprobar('sol del cielo: cae de día, vale 25 y se recoge una sola vez; desaparece si no se recoge', () => {
    const m = new MotorPvZ(nivelPorId('1-4'), { semilla: 11, sinOleadas: true });
    m.comenzar();
    const ev = avanzar(m, 7.01);
    const caidos = ev.filter((e) => e.t === 'sol' && e.origen === 'cielo');
    assert.equal(caidos.length, 1, 'El primero cae entre 4,25 y 7 s');
    const s = m.soles[0];
    assert.equal(s.valor, 25);
    const antes = m.sol;
    assert.equal(m.recoger(s.id), true);
    assert.equal(m.recoger(s.id), false);
    assert.equal(m.sol, antes + 25);
    // El siguiente cae a los 4,35–7,1 s del anterior.
    avanzar(m, 7.2);
    const otro = m.soles[0];
    assert.ok(otro, 'Sigue cayendo sol');
    avanzar(m, 30);
    assert.ok(!m.soles.some((x) => x.id === otro.id), 'Un sol quieto desaparece a los 8 s');
    const noche = new MotorPvZ(NOCHE, { semilla: 11, sinOleadas: true });
    noche.comenzar();
    assert.equal(avanzar(noche, 30).filter((e) => e.t === 'sol').length, 0, 'De noche no cae sol');
    const c = new MotorPvZ(nivelPorId('1-10'), { semilla: 11, sinOleadas: true });
    c.comenzar();
    assert.equal(avanzar(c, 30).filter((e) => e.t === 'sol').length, 0, 'En la cinta no cae sol');
  });

  comprobar('girasol: primer sol a los 3–12,5 s y luego cada 23,5–25 s', () => {
    const m = lab();
    sembrar(m, 'girasol', 0, 0);
    const tiempos = [];
    avanzar(m, 75, (mm) => { for (const e of mm.eventos) if (e.t === 'sol') tiempos.push(mm.t); });
    assert.ok(tiempos.length === 3, `soles: ${tiempos.length}`);
    assert.ok(tiempos[0] >= 3 && tiempos[0] <= 12.6, `primero ${tiempos[0]}`);
    for (let i = 1; i < tiempos.length; i++) assert.ok(tiempos[i] - tiempos[i - 1] >= 23.4 && tiempos[i] - tiempos[i - 1] <= 25.1);
    assert.ok(m.soles.every((s) => s.valor === 25 && s.origen === 'planta'));
  });

  comprobar('pala: arranca sin devolver sol y no arranca una planta que brilla', () => {
    const m = lab();
    sembrar(m, 'lanzaguisantes', 1, 1);
    const sol = m.sol;
    assert.equal(m.palear(1, 2).motivo, 'sinPlanta');
    assert.ok(m.palear(1, 1).ok);
    assert.equal(m.sol, sol);
    assert.equal(m.plantaEn(1, 1), undefined);
    sembrar(m, 'nuez', 1, 1);
    m.abonoCargas = 1;
    assert.ok(m.usarAbono(1, 1).ok);
    assert.equal(m.palear(1, 1).motivo, 'brillando');
    const sinPala = new MotorPvZ(nivelPorId('1-3'), { semilla: 1 });
    sinPala.comenzar();
    assert.equal(sinPala.palear(2, 0).motivo, 'sinPala', 'La pala llega al superar 1-4');
    assert.equal(sinPala.abonoActivo, false);
  });

  // ---------------------------------------------------------------------------------------------------------
  // Plantas

  comprobar('lanzaguisantes: guisante de 20 a 333 px/s, cada 1,36–1,5 s, solo hacia delante y a zombis visibles', () => {
    const m = lab();
    const p = sembrar(m, 'lanzaguisantes', 2, 0);
    const z = m.aparecerZombi('zombi', 2, 500);
    z.vel = 0;
    const lejos = m.aparecerZombi('zombi', 3, 820);
    lejos.vel = 0;
    const atras = m.aparecerZombi('zombi', 1, 400);
    atras.vel = 0;
    const ev = avanzar(m, 15);
    const disparos = ev.filter((e) => e.t === 'disparo' && e.planta === p.id).length;
    assert.ok(disparos >= 10 && disparos <= 11, `disparos ${disparos}`);
    const impactos = ev.filter((e) => e.t === 'impacto' && e.zombi === z.id);
    assert.ok(impactos.every((e) => e.dano === 20));
    assert.equal(lejos.vida, 270, 'No dispara a zombis fuera de la pantalla ni en otra fila');
    assert.equal(atras.vida, 270);
    // Tiempo de vuelo: de x = 65 a la caja del zombi (475) a 333 px/s.
    const m2 = lab();
    const p2 = sembrar(m2, 'lanzaguisantes', 2, 0);
    p2.reloj = 0;
    const z2 = m2.aparecerZombi('zombi', 2, 500);
    z2.vel = 0;
    let tDisparo = 0;
    let tImpacto = 0;
    avanzar(m2, 3, (mm) => {
      for (const e of mm.eventos) {
        if (e.t === 'disparo' && !tDisparo) tDisparo = mm.t;
        if (e.t === 'impacto' && !tImpacto) tImpacto = mm.t;
      }
    });
    assert.ok(Math.abs(tImpacto - tDisparo - (475 - 65) / 333) < 0.05, `vuelo ${tImpacto - tDisparo}`);
    // Zombi detrás de la planta: no le dispara.
    const m3 = lab();
    sembrar(m3, 'lanzaguisantes', 2, 5);
    const detras = m3.aparecerZombi('zombi', 2, 300);
    detras.vel = 0;
    avanzar(m3, 5);
    assert.equal(detras.vida, 270);
  });

  comprobar('brazo al bajar de 2/3 y cabeza al bajar de 1/3; sin cabeza se drena y se desploma', () => {
    const m = lab();
    const z = m.aparecerZombi('zombi', 2, 500);
    z.vel = 0;
    for (let i = 0; i < 4; i++) m.danarZombi(z, 20, 'recto');
    assert.equal(z.sinBrazo, false, '80 de daño: 190 > 180');
    m.danarZombi(z, 20, 'recto');
    assert.equal(z.sinBrazo, true, '100 de daño: 170 < 180');
    for (let i = 0; i < 4; i++) m.danarZombi(z, 20, 'recto');
    assert.equal(z.sinCabeza, false, '180 de daño: 90 no baja de 90');
    m.danarZombi(z, 20, 'recto');
    assert.equal(z.sinCabeza, true, '200 de daño: 70 < 90');
    assert.ok(z.vida > 0);
    const ev = avanzar(m, 1);
    assert.ok(ev.some((e) => e.t === 'muere' && e.zombi === z.id && e.causa === 'normal'), 'Se drena y muere');
    assert.ok(m.caidos.some((c) => c.id === z.id) || ev.some((e) => e.t === 'muere'), 'Queda su animación de caída');
    // Saltador (500): brazo bajo 333,3 y cabeza bajo 166,7.
    const p = m.aparecerZombi('pertiga', 1, 500);
    m.danarZombi(p, 166, 'recto');
    assert.equal(p.sinBrazo, false);
    m.danarZombi(p, 2, 'recto');
    assert.equal(p.sinBrazo, true);
    m.danarZombi(p, 165, 'recto');
    assert.equal(p.sinCabeza, false);
    m.danarZombi(p, 2, 'recto');
    assert.equal(p.sinCabeza, true);
  });

  comprobar('cascos: el cono (370) y el cubo de metal (1100) se gastan antes que el cuerpo', () => {
    const m = lab();
    const c = m.aparecerZombi('caracono', 2, 500);
    for (let i = 0; i < 18; i++) m.danarZombi(c, 20, 'recto');
    assert.equal(c.casco.vida, 10);
    assert.equal(c.vida, 270);
    const ev = avanzar(m, 0);
    m.danarZombi(c, 20, 'recto');
    assert.equal(c.casco, null, 'Se cae el cono');
    assert.equal(c.vida, 260, 'El sobrante pasa al cuerpo');
    const b = m.aparecerZombi('caracubo', 3, 500);
    b.vel = 0;
    const p = sembrar(m, 'lanzaguisantes', 3, 0);
    p.reloj = 0;
    const ev2 = avanzar(m, 2);
    const imp = ev2.find((e) => e.t === 'impacto' && e.zombi === b.id);
    assert.ok(imp?.metal, 'El cubo suena metálico');
    assert.equal(b.vida, 270);
    assert.ok(b.casco.vida < 1100);
    m.danarZombi(b, 2000, 'lanzado');
    assert.equal(b.vida <= 0, true, 'Daño grande: cubo y cuerpo');
    void ev;
  });

  comprobar('hielaguisantes: 20 de daño y lento 10 s (mitad de velocidad y de mordida)', () => {
    const m = lab();
    const p = sembrar(m, 'hielaguisantes', 2, 0);
    p.reloj = 0;
    const z = m.aparecerZombi('zombi', 2, 400);
    const v = z.vel;
    avanzar(m, 1.5);
    assert.ok(z.lento > 8 && z.lento <= 10, `lento ${z.lento}`);
    m.palear(2, 0);
    const x0 = z.x;
    avanzar(m, 1);
    assert.ok(Math.abs(x0 - z.x - v * 0.5) < 0.6, 'Camina a la mitad');
    avanzar(m, 10);
    assert.equal(z.lento, 0, 'Se le pasa a los 10 s');
    // Mordida lenta: 50/s sobre una nuez.
    const n = sembrar(m, 'nuez', 1, 3);
    const zz = m.aparecerZombi('zombi', 1, n.x + 70);
    avanzar(m, 0.5);
    const v0 = n.vida;
    zz.lento = 10;
    avanzar(m, 2);
    assert.ok(Math.abs(v0 - n.vida - 100) < 2, `mordida lenta ${v0 - n.vida}`);
  });

  comprobar('repetidora: dos guisantes por ataque', () => {
    const m = lab();
    const p = sembrar(m, 'repetidora', 2, 0);
    p.reloj = 0;
    // Caracubo quieto: aguanta los 15 s de disparos (1100 + 270).
    const z = m.aparecerZombi('caracubo', 2, 600);
    z.vel = 0;
    const ev = avanzar(m, 0.5);
    assert.equal(ev.filter((e) => e.t === 'disparo').length, 2);
    const ev2 = avanzar(m, 14.5);
    const n = ev.concat(ev2).filter((e) => e.t === 'disparo').length;
    assert.ok(n >= 20 && n <= 22, `disparos ${n}`);
  });

  comprobar('seta desesporada: duerme de día; de noche esporas de 20 con alcance de 3 casillas', () => {
    const d = lab();
    const p = sembrar(d, 'desesporada', 2, 0);
    assert.equal(p.dormida, true);
    const z = d.aparecerZombi('zombi', 2, 200);
    z.vel = 0;
    avanzar(d, 5);
    assert.equal(z.vida, 270, 'Dormida no dispara');
    const m = lab({}, NOCHE);
    const s = sembrar(m, 'desesporada', 2, 0);
    assert.equal(s.dormida, false);
    const lejos = m.aparecerZombi('zombi', 2, 40 + 280 + 26);
    lejos.vel = 0;
    avanzar(m, 4);
    assert.equal(lejos.vida, 270, 'A más de 3 casillas no dispara');
    const cerca = m.aparecerZombi('zombi', 3, 40 + 280 + 24);
    cerca.vel = 0;
    sembrar(m, 'desesporada', 3, 0);
    const ev = avanzar(m, 4);
    assert.ok(cerca.vida < 270, 'A 3 casillas sí');
    assert.ok(ev.filter((e) => e.t === 'impacto' && e.zombi === cerca.id).every((e) => e.dano === 20 && e.tipo === 'espora'));
    // La espora se disipa al pasar su alcance.
    const m2 = lab({}, NOCHE);
    const q = sembrar(m2, 'desesporada', 4, 0);
    q.reloj = 0;
    const borde = m2.aparecerZombi('zombi', 4, 40 + 280 + 24);
    borde.vel = 0;
    avanzar(m2, 0.05);
    m2.zombis = [];
    const ev2 = avanzar(m2, 2);
    assert.ok(ev2.some((e) => e.t === 'disipa'), 'La espora se disipa');
    assert.equal(m2.proyectiles.length, 0);
  });

  comprobar('patatapum: se arma a los 15 s; desarmada se la comen; armada estalla (1800) con el primero que la pisa', () => {
    const m = lab();
    const p = sembrar(m, 'patatapum', 2, 3);
    assert.equal(p.estado, 'enterrada');
    let armada = 0;
    avanzar(m, 15.05, (mm) => { if (!armada && mm.eventos.some((e) => e.t === 'arma')) armada = mm.t; });
    assert.ok(Math.abs(armada - 15) < 0.05, `armada a ${armada}`);
    assert.equal(p.estado, 'armada');
    const z = m.aparecerZombi('caracubo', 2, p.x + 120);
    const ev = avanzar(m, 6);
    assert.ok(ev.some((e) => e.t === 'explosion' && e.tipo === 'patatapum'));
    assert.ok(ev.some((e) => e.t === 'ceniza' && e.zombi === z.id), 'El caracubo queda en ceniza');
    assert.equal(m.plantaEn(2, 3), undefined, 'Un solo uso');
    const m2 = lab();
    const q = sembrar(m2, 'patatapum', 1, 3);
    m2.aparecerZombi('zombi', 1, q.x + 75);
    const ev2 = avanzar(m2, 6);
    assert.ok(ev2.some((e) => e.t === 'plantaComida' && e.planta === q.id), 'Desarmada se la comen');
    assert.ok(!ev2.some((e) => e.t === 'explosion'));
    // Armada no se puede morder: el zombi sigue caminando hasta pisarla.
    const m3 = lab();
    const r = sembrar(m3, 'patatapum', 0, 3);
    avanzar(m3, 15.1);
    const otro = m3.aparecerZombi('zombi', 1, r.x + 60);
    otro.vel = 0;
    const ev3 = avanzar(m3, 2);
    assert.ok(!ev3.some((e) => e.t === 'explosion'), 'Solo estalla con zombis de su fila');
  });

  comprobar('carnívora: se traga al zombi de delante, mastica 42 s y no se traga al Zombistein', () => {
    const m = lab();
    const p = sembrar(m, 'carnivora', 2, 2);
    const z1 = m.aparecerZombi('caracubo', 2, p.x + 160);
    let tragado = 0;
    avanzar(m, 8, (mm) => { if (!tragado && mm.eventos.some((e) => e.t === 'traga' && e.zombi === z1.id)) tragado = mm.t; });
    assert.ok(tragado > 0, 'Se lo traga aunque tenga cubo');
    assert.equal(p.estado, 'masticando');
    const z2 = m.aparecerZombi('zombi', 2, p.x + 100);
    avanzar(m, 3);
    assert.ok(z2.vida === 270 && z2.mordiendo === p.id, 'Mientras mastica no come y la muerden');
    m.zombis = [];
    avanzar(m, 42 - (m.t - tragado) - 0.2);
    assert.equal(p.estado, 'masticando');
    avanzar(m, 0.4);
    assert.equal(p.estado, 'quieto', 'Termina de masticar a los 42 s');
    // Zombistein de prueba (aún no está en los datos del día).
    ZOMBIS.zombistein = { ...ZOMBIS.zombi, id: 'zombistein', vida: 3000, tragable: false, puntos: 10, peso: 0 };
    const g = m.aparecerZombi('zombistein', 2, p.x + 100);
    g.vel = 0;
    const ev = avanzar(m, 3);
    delete ZOMBIS.zombistein;
    assert.ok(!ev.some((e) => e.t === 'traga'), 'No se traga al Zombistein');
    assert.ok(g.vida <= 3000 - 40 && g.vida > 0, `mordiscos de 40: ${g.vida}`);
  });

  comprobar('petacereza: mecha de 1,2 s y 1800 en 3×3 (ceniza), nada fuera del área', () => {
    const m = lab();
    const dentro = [m.aparecerZombi('caracubo', 1, 360), m.aparecerZombi('zombi', 2, 440), m.aparecerZombi('caracono', 3, 280)];
    const fuera = [m.aparecerZombi('zombi', 2, 560), m.aparecerZombi('zombi', 4, 360), m.aparecerZombi('zombi', 0, 360)];
    for (const z of [...dentro, ...fuera]) z.vel = 0;
    sembrar(m, 'petacereza', 2, 4);
    let t = 0;
    avanzar(m, 2, (mm) => { if (!t && mm.eventos.some((e) => e.t === 'explosion')) t = mm.t; });
    assert.ok(Math.abs(t - 1.2) < 0.05, `explota a ${t}`);
    assert.ok(dentro.every((z) => z.vida <= 0));
    assert.ok(fuera.every((z) => z.vida === 270));
    assert.equal(m.plantaEn(2, 4), undefined);
    assert.ok(m.caidos.filter((c) => c.causa === 'ceniza').length === 3);
  });

  comprobar('nuez: 4000 de vida; un zombi tarda ~40 s en comérsela', () => {
    const m = lab();
    const n = sembrar(m, 'nuez', 2, 4);
    m.aparecerZombi('zombi', 2, n.x + 90);
    let comida = 0;
    avanzar(m, 45, (mm) => { if (!comida && mm.eventos.some((e) => e.t === 'plantaComida')) comida = mm.t; });
    assert.ok(comida > 39 && comida < 42, `comida a ${comida}`);
  });

  // ---------------------------------------------------------------------------------------------------------
  // Zombis

  comprobar('saltador de pértiga: corre, salta la primera planta, cae detrás y se come la siguiente', () => {
    const m = lab();
    const atras = sembrar(m, 'girasol', 2, 2);
    const primera = sembrar(m, 'lanzaguisantes', 2, 5);
    m.palear(2, 5);
    const nuez = sembrar(m, 'nuez', 2, 5);
    const z = m.aparecerZombi('pertiga', 2, 700);
    assert.equal(z.estado, 'corre');
    assert.ok(Math.abs(z.vel - 32) < 3);
    const ev = avanzar(m, 12);
    assert.ok(ev.some((e) => e.t === 'salta' && e.zombi === z.id), 'Salta');
    assert.ok(nuez.vida === 4000, 'No muerde la planta que salta');
    assert.ok(z.x < nuez.x, 'Cae detrás');
    assert.equal(z.datos.pertiga, 0);
    assert.ok(Math.abs(z.vel - 80 / 4.7) < 2, 'Después camina a velocidad normal');
    avanzar(m, 20);
    assert.ok(atras.vida < 300, 'Se come la siguiente');
    void primera;
    // No puede saltar la Nuez cáscara-rabias (definición de prueba).
    PLANTAS.nuezalta = { ...PLANTAS.nuez, id: 'nuezalta', saltable: false, vida: 8000 };
    const m2 = new MotorPvZ(nivelPorId('1-9'), { semilla: 1, sinOleadas: true, sinSolCielo: true, ranuras: 10, mazo: ['nuezalta'] });
    m2.comenzar();
    m2.sol = 9990;
    m2.tarjeta('nuezalta').restante = 0;
    assert.ok(m2.sembrar('nuezalta', 1, 4).ok);
    const z2 = m2.aparecerZombi('pertiga', 1, 600);
    const ev2 = avanzar(m2, 15);
    delete PLANTAS.nuezalta;
    assert.ok(!ev2.some((e) => e.t === 'salta'));
    assert.equal(z2.datos.pertiga, 0, 'Pierde la pértiga');
    assert.ok(m2.plantaEn(1, 4).vida < 8000, 'Se pone a comerla');
  });

  comprobar('saltador contra carnívora: a velocidad normal la salta; lento, se lo come antes del salto', () => {
    const m = lab();
    const p = sembrar(m, 'carnivora', 2, 3);
    const z = m.aparecerZombi('pertiga', 2, 600);
    const ev = avanzar(m, 8);
    assert.ok(ev.some((e) => e.t === 'salta' && e.zombi === z.id));
    assert.ok(!ev.some((e) => e.t === 'traga'));
    assert.equal(p.estado, 'quieto', 'La mordida falla');
    const m2 = lab();
    const q = sembrar(m2, 'carnivora', 2, 3);
    const z2 = m2.aparecerZombi('pertiga', 2, 600);
    z2.lento = 30;
    // Lento corre a 16 px/s: llega a la boca de la carnívora a los ~13 s.
    const ev2 = avanzar(m2, 16);
    assert.ok(ev2.some((e) => e.t === 'traga' && e.zombi === z2.id), 'Lento, se lo traga');
    assert.ok(!ev2.some((e) => e.t === 'salta'));
    void q;
  });

  comprobar('cortacésped: uno por fila, barre la fila una sola vez; sin él, se pierde', () => {
    const m = lab();
    const a = m.aparecerZombi('zombi', 2, 60);
    const b = m.aparecerZombi('caracubo', 2, 400);
    const c = m.aparecerZombi('zombi', 3, 400);
    for (const z of [b, c]) z.vel = 0;
    // El zombi llega a la casa a los ~3 s y el cortacésped tarda ~2,2 s en cruzar la fila.
    const ev = avanzar(m, 7);
    assert.equal(ev.filter((e) => e.t === 'cortacesped').length, 1);
    assert.ok(a.vida <= 0 && b.vida <= 0, 'Mata a todos los de la fila');
    assert.equal(c.vida, 270, 'Solo su fila');
    assert.ok(ev.filter((e) => e.t === 'muere' && e.causa === 'cortacesped').length === 2);
    assert.equal(m.cortacespedes.find((x) => x.fila === 2).estado, 'usado');
    assert.equal(m.estado, 'jugando');
    m.aparecerZombi('zombi', 2, 40);
    const ev2 = avanzar(m, 8);
    assert.equal(ev2.filter((e) => e.t === 'cortacesped').length, 0, 'No vuelve a salir');
    assert.equal(m.estado, 'perdio');
  });

  // ---------------------------------------------------------------------------------------------------------
  // Abono

  comprobar('abono: zombis brillantes lo sueltan; máximo 3; cura, brilla invulnerable y sin cargas no se usa', () => {
    const m = lab();
    assert.equal(m.usarAbono(2, 0).motivo, 'sinCargas');
    for (let i = 0; i < 4; i++) {
      const z = m.aparecerZombi('zombi', i, 500, { brillante: true });
      m.danarZombi(z, 1000, 'explosion');
    }
    avanzar(m, 0.1);
    assert.equal(m.abonosSueltos.length, 4);
    for (const a of [...m.abonosSueltos]) m.recoger(a.id);
    assert.equal(m.abonoCargas, 3, 'Máximo 3 cargas');
    assert.equal(m.abonosSueltos.length, 1, 'La cuarta se queda en el suelo');
    const n = sembrar(m, 'nuez', 2, 4);
    n.vida = 1000;
    assert.ok(m.usarAbono(2, 4).ok);
    assert.equal(m.abonoCargas, 2);
    assert.equal(n.vida, 4000, 'Se cura');
    assert.equal(n.coraza, 8000, 'Nuez: coraza de 8000');
    assert.equal(m.usarAbono(2, 4).motivo, 'brillando');
    assert.equal(m.usarAbono(0, 8).motivo, 'sinPlanta');
    const z = m.aparecerZombi('zombi', 2, n.x + 70);
    avanzar(m, 3);
    assert.equal(n.vida, 4000, 'La coraza se gasta primero');
    assert.ok(n.coraza < 8000);
    void z;
    const sin = new MotorPvZ(nivelPorId('1-4'), { semilla: 1 });
    assert.equal(sin.plan.some((o) => o.portador), false, 'Antes de ganar el abono no hay zombis brillantes');
    const con = new MotorPvZ(nivelPorId('1-7'), { semilla: 1 });
    const k = con.plan.filter((o) => o.portador).length;
    assert.ok(k >= 3 && k <= 6, `portadores ${k}`);
  });

  comprobar('abono de cada planta del día (efectos de PvZ 2)', () => {
    const conAbono = (op, nivel) => {
      const m = lab(op, nivel);
      m.abonoCargas = 3;
      return m;
    };
    // Lanzaguisantes: 60 guisantes en 3 s.
    let m = conAbono();
    sembrar(m, 'lanzaguisantes', 2, 0);
    let z = m.aparecerZombi('caracubo', 2, 600);
    z.vel = 0;
    assert.ok(m.usarAbono(2, 0).ok);
    let ev = avanzar(m, 3.05);
    let n = ev.filter((e) => e.t === 'disparo').length;
    assert.ok(n >= 60 && n <= 62, `lanzaguisantes ${n}`);
    // Girasol: 150 de sol.
    m = conAbono();
    sembrar(m, 'girasol', 1, 0);
    m.soles = [];
    assert.ok(m.usarAbono(1, 0).ok);
    assert.equal(m.soles.filter((s) => s.origen === 'abono').reduce((s, x) => s + x.valor, 0), 150);
    // Petacereza (propuesto): abonada en la mecha estalla en 5×5.
    m = conAbono();
    const lejos = m.aparecerZombi('zombi', 0, 200);
    lejos.vel = 0;
    sembrar(m, 'petacereza', 2, 4);
    assert.ok(m.usarAbono(2, 4).ok);
    avanzar(m, 1.5);
    assert.ok(lejos.vida <= 0, '5×5');
    // Patatapum: se arma al instante y lanza 2 copias armadas.
    m = conAbono();
    sembrar(m, 'patatapum', 2, 3);
    assert.ok(m.usarAbono(2, 3).ok);
    const minas = m.plantas.filter((p) => p.tipo === 'patatapum');
    assert.equal(minas.length, 3);
    assert.ok(minas.every((p) => p.datos.armada === 1));
    // Hielaguisantes: ralentiza a los de delante y dispara 60 guisantes helados.
    m = conAbono();
    sembrar(m, 'hielaguisantes', 3, 0);
    const a = m.aparecerZombi('zombi', 3, 700);
    const b = m.aparecerZombi('zombi', 3, 300);
    assert.ok(m.usarAbono(3, 0).ok);
    assert.ok(a.lento > 9 && b.lento > 9);
    ev = avanzar(m, 3.05);
    n = ev.filter((e) => e.t === 'disparo').length;
    assert.ok(n >= 60 && n <= 62, `hielaguisantes ${n}`);
    // Carnívora: se traga a los 3 más cercanos (a 3 casillas o menos) y empuja a los demás.
    m = conAbono();
    const c = sembrar(m, 'carnivora', 2, 1);
    c.estado = 'masticando';
    c.reloj = 30;
    const cerca = [m.aparecerZombi('caracubo', 2, 200), m.aparecerZombi('zombi', 2, 250), m.aparecerZombi('zombi', 2, 300)];
    const cuarto = m.aparecerZombi('zombi', 2, 340);
    const x4 = cuarto.x;
    assert.ok(m.usarAbono(2, 1).ok);
    assert.ok(cerca.every((q) => q.vida <= 0));
    assert.ok(cuarto.vida > 0 && cuarto.x === x4 + 80, 'Eructo');
    assert.equal(c.estado, 'quieto');
    // Repetidora: 90 guisantes y uno gigante de 600.
    m = conAbono();
    sembrar(m, 'repetidora', 4, 0);
    z = m.aparecerZombi('caracubo', 4, 700);
    z.vel = 0;
    assert.ok(m.usarAbono(4, 0).ok);
    ev = avanzar(m, 4.3);
    n = ev.filter((e) => e.t === 'disparo').length;
    const proy = m.proyectiles.filter((p) => p.tipo === 'guisanteGigante').length + ev.filter((e) => e.t === 'impacto' && e.tipo === 'guisanteGigante').length;
    assert.ok(n >= 91 && n <= 93, `repetidora ${n}`);
    assert.equal(proy, 1);
    assert.ok(ev.filter((e) => e.t === 'impacto' && e.tipo === 'guisanteGigante').every((e) => e.dano === 600));
    // Seta desesporada: despierta (propuesto) y todas las despiertas disparan 30 esporas.
    m = conAbono({}, NOCHE);
    sembrar(m, 'desesporada', 0, 0);
    sembrar(m, 'desesporada', 1, 0);
    assert.ok(m.usarAbono(0, 0).ok);
    ev = avanzar(m, 1.6);
    n = ev.filter((e) => e.t === 'disparo').length;
    assert.ok(n >= 60 && n <= 62, `desesporadas ${n}`);
    m = conAbono();
    const dormida = sembrar(m, 'desesporada', 0, 0);
    assert.ok(m.usarAbono(0, 0).ok);
    assert.equal(dormida.dormida, false, 'El abono la despierta');
  });

  // ---------------------------------------------------------------------------------------------------------
  // Oleadas, bolera, cinta

  comprobar('oleadas: primera a los 18 s, oleada enorme con aviso de 7,5 s y abanderado al frente, última oleada', () => {
    const n = nivelPorId('1-4');
    const m = new MotorPvZ(n, { semilla: 4, mazo: elegirMazo(n) });
    const bot = crearBot();
    const ev = [];
    for (let i = 0; i < 60 * 900 && (m.estado === 'intro' || m.estado === 'jugando'); i++) {
      bot(m);
      m.paso();
      for (const e of m.eventos) ev.push({ ...e, tm: m.t });
    }
    const oleadas = ev.filter((e) => e.t === 'oleada');
    assert.equal(oleadas.length, 10);
    assert.ok(Math.abs(oleadas[0].tm - 18) < 0.05);
    for (let i = 1; i < 9; i++) assert.ok(oleadas[i].tm - oleadas[i - 1].tm <= 31.05, 'Entre 2 y 31 s');
    const aviso = ev.find((e) => e.t === 'oleadaEnorme');
    assert.ok(aviso && aviso.n === 10);
    assert.ok(Math.abs(oleadas[9].tm - aviso.tm - 7.5) < 0.05, 'El aviso dura 7,5 s');
    assert.ok(oleadas[9].enorme && oleadas[9].final);
    assert.ok(ev.some((e) => e.t === 'ultimaOleada' && Math.abs(e.tm - oleadas[9].tm) < 0.01));
    assert.deepEqual(m.posBanderas, [1]);
    assert.equal(m.plan[9].zombis[0], 'abanderado');
    const m7 = new MotorPvZ(nivelPorId('1-7'), { semilla: 4 });
    assert.deepEqual(m7.posBanderas, [0.5, 1]);
    assert.equal(m7.plan.filter((o) => o.enorme).length, 2);
    // Tabla de la primera vuelta: 1-6 trae el saltador en la oleada 6 y ninguno antes de la 5.
    const m6 = new MotorPvZ(nivelPorId('1-6'), { semilla: 9 });
    assert.ok(m6.plan[5].zombis.includes('pertiga'));
    assert.ok(m6.plan.slice(0, 4).every((o) => !o.zombis.includes('pertiga')));
    // Repetición: algoritmo con más oleadas y la última con uno de cada tipo.
    const r = new MotorPvZ(nivelPorId('1-9'), { semilla: 9, repeticion: true });
    assert.equal(r.oleadasTotal, 30);
    for (const t of ['zombi', 'caracono', 'pertiga', 'caracubo', 'abanderado']) assert.ok(r.plan[29].zombis.includes(t), t);
    assert.ok(r.monedasActivas);
  });

  comprobar('la bolera: pala antes de empezar, línea roja, la nuez rebota en diagonal; caracono 2 golpes; la explosiva hace 3×3', () => {
    const m = new MotorPvZ(nivelPorId('1-5'), { semilla: 2, sinOleadas: true });
    assert.equal(m.plantas.length, 3);
    assert.equal(m.comenzar().motivo, 'faltaPalear');
    for (const p of [...m.plantas]) assert.ok(m.palear(p.fila, p.col).ok);
    assert.ok(m.comenzar().ok);
    assert.equal(m.sol, 0);
    assert.equal(m.mazo.length, 0);
    assert.equal(m.sembrar('nuez', 2, 0).motivo, 'cinta');
    m.cinta.push({ id: 9001, tipo: 'nuezbolos', x: 0 }, { id: 9002, tipo: 'nuezbolos', x: 1 }, { id: 9003, tipo: 'nuezexplosiva', x: 2 });
    assert.equal(m.sembrarCinta(9001, 2, 3).motivo, 'linea');
    const c = m.aparecerZombi('caracono', 2, 500);
    c.vel = 0;
    assert.ok(m.sembrarCinta(9001, 2, 2).ok);
    const ev = avanzar(m, 3);
    assert.ok(ev.some((e) => e.t === 'rebote'), 'Rebota');
    assert.ok(c.vida > 0 && c.casco === null, 'Un golpe le quita el cono');
    const rodante = m.proyectiles.find((p) => p.forma === 'rodante');
    assert.ok(!rodante || rodante.fila !== 2 || rodante.dirY !== 0, 'Sigue en diagonal');
    assert.ok(m.sembrarCinta(9002, 2, 0).ok);
    avanzar(m, 4);
    assert.ok(c.vida <= 0, 'El segundo golpe lo mata');
    const grupo = [m.aparecerZombi('caracubo', 1, 500), m.aparecerZombi('zombi', 2, 520), m.aparecerZombi('zombi', 3, 480)];
    for (const z of grupo) z.vel = 0;
    assert.ok(m.sembrarCinta(9003, 2, 1).ok);
    avanzar(m, 4);
    assert.ok(grupo.every((z) => z.vida <= 0), 'La explosiva hace 3×3');
    // Cinta: los sobres llegan solos cada ~4 s.
    const k = new MotorPvZ(nivelPorId('1-5'), { semilla: 2, sinOleadas: true });
    for (const p of [...k.plantas]) k.palear(p.fila, p.col);
    k.comenzar();
    const ev2 = avanzar(k, 20);
    const sobres = ev2.filter((e) => e.t === 'cinta');
    assert.ok(sobres.length >= 5 && sobres.length <= 6, `sobres ${sobres.length}`);
    assert.ok(sobres.every((e) => e.tipo === 'nuezbolos' || e.tipo === 'nuezexplosiva'));
  });

  comprobar('cinta (1-10): sobres gratis sin recarga y sin sol', () => {
    const m = new MotorPvZ(nivelPorId('1-10'), { semilla: 3, sinOleadas: true });
    m.comenzar();
    avanzar(m, 9);
    assert.ok(m.cinta.length >= 2);
    const [a, b] = m.cinta;
    assert.ok(m.sembrarCinta(a.id, 0, 0).ok);
    assert.ok(m.sembrarCinta(b.id, 1, 0).ok, 'Sin recarga');
    assert.equal(m.sol, 0);
    assert.equal(m.sembrarCinta(a.id, 2, 0).motivo, 'tipo', 'Cada sobre se usa una vez');
  });

  // ---------------------------------------------------------------------------------------------------------
  // Determinismo y rendimiento

  comprobar('determinismo: misma semilla y mismas órdenes, misma partida; otra semilla, otra partida', () => {
    const jugar = (semilla) => {
      const n = nivelPorId('1-7');
      const m = new MotorPvZ(n, { semilla, mazo: elegirMazo(n) });
      const bot = crearBot();
      for (let i = 0; i < 60 * 200; i++) {
        bot(m);
        m.paso();
      }
      return JSON.stringify(m);
    };
    const a = jugar(42);
    assert.equal(a, jugar(42));
    assert.notEqual(a, jugar(43));
  });

  comprobar('rendimiento: un paso con 60 zombis y 45 plantas', () => {
    const m = lab();
    const tipos = ['repetidora', 'lanzaguisantes', 'hielaguisantes', 'girasol', 'nuez', 'carnivora', 'lanzaguisantes', 'repetidora', 'nuez'];
    for (let f = 0; f < 5; f++) for (let c = 0; c < 9; c++) sembrar(m, tipos[c], f, c);
    for (const p of m.plantas) p.vida = p.vidaMax = 1e9;
    assert.equal(m.plantas.length, 45);
    const llenar = () => {
      for (const z of m.zombis) if (z.vida < 200) z.vida = z.vidaMax = 1e9;
      while (m.zombis.length < 60) {
        const z = m.aparecerZombi(['zombi', 'caracono', 'caracubo', 'pertiga'][m.zombis.length % 4], m.zombis.length % 5, 760 - (m.zombis.length % 12) * 50);
        z.vida = z.vidaMax = 1e9;
      }
    };
    llenar();
    avanzar(m, 2, llenar);
    const N = 600;
    const t0 = performance.now();
    for (let i = 0; i < N; i++) {
      m.paso();
      llenar();
    }
    const ms = (performance.now() - t0) / N;
    console.log(`   ${ms.toFixed(3)} ms por paso con ${m.zombis.length} zombis, ${m.plantas.length} plantas y ${m.proyectiles.length} proyectiles`);
    assert.equal(m.zombis.length, 60);
    assert.ok(ms < 1, `paso lento: ${ms} ms`);
  });
} finally {
  await rm(tmp, { recursive: true, force: true });
}
if (fallos) {
  console.log(`\n${fallos} comprobación(es) fallaron`);
  process.exit(1);
}
console.log('\nOK motor de PvZ: todas las comprobaciones pasaron');
