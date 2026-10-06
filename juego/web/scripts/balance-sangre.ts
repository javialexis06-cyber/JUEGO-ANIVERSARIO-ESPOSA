// Balance de Sangre y Ceniza: juega expediciones completas con el bot (sin dibujo, en Node) y dice hasta dónde llega
// cada clase. Uso: node scripts/balance-sangre.mjs [partidas] [clases|todas] [bioma] [peligro] [jugadores]
import { Expedicion } from '../src/sangre/expedicion';
import { NIVEL_BOT, botEscoger, botPaso } from '../src/sangre/bot';
import { CLASES } from '../src/sangre/datos/clases';
import { ARMAS_COMUNES } from '../src/sangre/datos/armas';
import { CLASES_ORDEN, type IdBioma, type IdClase, type PerfilJugador } from '../src/sangre/tipos';
import { S } from '../src/sangre/sim/estado';

const partidas = Number(process.argv[2] ?? 1);
const clases = (process.argv[3] ?? 'monarca').split(',').flatMap((c) => (c === 'todas' ? CLASES_ORDEN : [c as IdClase]));
const bioma = (process.argv[4] ?? 'cementerio') as IdBioma;
const peligro = Number(process.argv[5] ?? 2);
const jugadores = Number(process.argv[6] ?? 1);
const DT = 1 / 30;
// TORPE=1: juega como una persona que empieza (esquiva menos y en la Forja compra una cosa, sin yunque ni altar)
const torpe = !!process.env.TORPE;
// INFINITO=1: el modo infinito (los cinco biomas turnándose; se corta en la etapa 30)
const infinito = !!process.env.INFINITO;
if (torpe) NIVEL_BOT.miedo = 0.4;

function perfil(clase: IdClase, i: number): PerfilJugador {
  return {
    id: `bot${i}`, nombre: `Bot ${i + 1}`, puesto: i, clase, spec: i % 3, meta: {}, equipo: {}, arsenal: [...CLASES[clase].arsenal], comunes: [...ARMAS_COMUNES],
    tiradas: 1, vetos: 1, cuerpo: i % 2 ? 'ella' : 'el', tipo: 'amigo',
  };
}

for (const clase of clases) {
  const filas: string[] = [];
  for (let k = 0; k < partidas; k++) {
    const t0 = Date.now();
    const perfiles = Array.from({ length: jugadores }, (_, i) => perfil(i === 0 ? clase : CLASES_ORDEN[(CLASES_ORDEN.indexOf(clase) + i * 5) % 12], i));
    const exp = new Expedicion({ bioma, peligro, mutadores: [], semilla: 1000 + k * 77 + clase.length, ...(infinito ? { infinito: true, rotacion: ['cementerio', 'catacumbas', 'minas', 'abadia', 'castillo'] as IdBioma[] } : {}) }, perfiles);
    let pasos = 0, maxEnemigos = 0, msMax = 0;
    while (exp.fase !== 'fin' && exp.etapa < 30) {
      const sim = exp.iniciarEtapa();
      let seg = 0;
      // La curva de dificultad: daño recibido por minuto, la vida más baja y con cuánta vida empezó
      const danoMin: number[] = [];
      const vidaInicio = sim.J[0].hp / sim.J[0].hpMax;
      let vidaMin = vidaInicio;
      while (!sim.fin && seg < 900) {
        for (const j of sim.J) {
          if (j.cola.length) botEscoger(sim, j);
          botPaso(sim, j);
        }
        const a = performance.now();
        sim.paso(DT);
        const ms = performance.now() - a;
        if (ms > msMax) msMax = ms;
        seg += DT;
        pasos++;
        const d = sim.suc.d;
        for (let k = 0; k < sim.suc.n; k++) if (d[k * 7] === S.HERIDO && d[k * 7 + 1] === 0) danoMin[Math.floor(sim.t / 60)] = (danoMin[Math.floor(sim.t / 60)] ?? 0) + d[k * 7 + 2];
        if (sim.J[0].estado === 0) vidaMin = Math.min(vidaMin, sim.J[0].hp / sim.J[0].hpMax);
        if (sim.E.vivos > maxEnemigos) maxEnemigos = sim.E.vivos;
      }
      if (!sim.fin) sim.fin = { exito: false, extraidos: [], motivo: 'abandono', objetivo: false, secundario: 0, prisioneros: 0 };
      const j0 = sim.J[0];
      console.log(`  etapa ${exp.etapa} ${sim.bioma.id.slice(0, 5)}${sim.cfg.final ? '+jefe' : '     '} ${sim.obj.tipo.padEnd(11)} obj=${sim.obj.prog.toFixed(0)}/${sim.obj.meta} ${sim.fin.motivo.padEnd(10)} t=${sim.t.toFixed(0)}s nivel=${j0.nivel} vida=${Math.round(j0.hp)}/${j0.hpMax} muertes=${j0.resumen.muertes} armas=${j0.armas.map((a) => `${a.id}:${a.nivel}`).join(',')} oro=${Math.round(j0.oroSeguro + j0.oro)} hierro=${Math.round(j0.hierroSeguro + j0.hierro)} enemigos max=${maxEnemigos}`);
      console.log(`      daño/min=[${Array.from(danoMin, (x) => Math.round(x ?? 0)).join(',')}] vida al empezar=${Math.round(vidaInicio * 100)}% más baja=${Math.round(vidaMin * 100)}% excavadas=${j0.resumen.excavadas}`);
      exp.terminarEtapa();
      if (exp.fase === 'forja') {
        for (const j of exp.J) {
          const f = exp.forja.get(j.i)!;
          let compras = 0;
          for (const o of [...f.ofertas].sort((a, b) => (a.tipo === 'arma' ? -1 : 0) - (b.tipo === 'arma' ? -1 : 0))) if (j.oroSeguro >= o.precio && !(torpe && compras >= 1) && !exp.comprar(j, o.id)) compras++;
          if (!torpe)
            for (let r = 0; r < j.armas.length; r++) {
              while (!exp.yunque(j, r)) {}
              exp.altarSangre(j, r);
            }
          if (exp.sim) botEscoger(exp.sim, j);
        }
      }
    }
    const j0 = exp.J[0];
    const r = exp.recompensa(j0);
    filas.push(`${clase.padEnd(12)} #${k} ${exp.exito ? 'VICTORIA' : 'derrota '} etapas=${exp.resultados.length} nivel=${j0.nivel} muertes=${j0.resumen.muertes} élites=${j0.resumen.elites} ceniza=${r.ceniza} maestría=${r.maestria} (${((Date.now() - t0) / 1000).toFixed(0)} s reales, ${(pasos / ((Date.now() - t0) / 1000)).toFixed(0)} pasos/s, peor paso ${msMax.toFixed(1)} ms)`);
    console.log(filas[filas.length - 1]);
  }
}
