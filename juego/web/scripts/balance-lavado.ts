// Balance de «Lavarse la cara»: juega partidas completas con el bot (sin dibujo, en Node) y dice hasta dónde
// llega con distintas tiendas de poderes. Uso: node scripts/balance-lavado.mjs [partidas] [escenario] [disfraces] [tiendas]
import { Motor, ajustarTarde } from '../src/casa/lavado/motor';
import { botPaso, inventario } from '../src/casa/lavado/bot';
import { PODERES } from '../src/casa/lavado/tienda';
import type { IdEscenario, Stat } from '../src/casa/lavado/tipos';

const partidas = Number(process.argv[2] ?? 4);
const escenario = (process.argv[3] ?? 'cara') as IdEscenario;
const disfraces = (process.argv[4] ?? 'el_panda,ella_pulga').split(',');
const soloTiendas = (process.argv[5] ?? 'nada,media,toda').split(',');

/** Tiendas: nada, la mitad (lo barato) y todo. */
const TIENDAS: Record<string, Partial<Record<Stat, number>>> = {
  nada: {},
  media: Object.fromEntries(PODERES.filter((p) => p.precio <= 450 && p.id !== 'maldicion').map((p) => [p.id, Math.ceil(p.max / 2)])),
  toda: Object.fromEntries(PODERES.filter((p) => p.id !== 'maldicion').map((p) => [p.id, p.max])),
};

// TARDE=vida,daño prueba otra subida de los bichos después del minuto 14
if (process.env.TARDE) {
  const [v, d] = process.env.TARDE.split(',').map(Number);
  ajustarTarde(v, d);
}
const DT = 1 / 30;
for (const [nombre, poderes] of Object.entries(TIENDAS).filter(([n]) => soloTiendas.includes(n))) {
  for (const disfraz of disfraces) {
    const filas: string[] = [];
    let suma = 0;
    for (let k = 0; k < partidas; k++) {
      const rol = disfraz.startsWith('ella') ? 'ella' : 'el';
      const m = new Motor({ escenario, apurado: false, semilla: 1000 + k * 7919, jugadores: [{ rol, disfraz, poderes, secretos: [] }] });
      const t0 = Date.now();
      let pasos = 0;
      while (!m.fin && m.t < 31 * 60 && pasos < 31 * 60 * 30 * 1.2) {
        botPaso(m);
        m.paso(DT);
        pasos++;
      }
      const ms = Date.now() - t0;
      const j = m.jug[0];
      suma += m.t;
      const mm = `${Math.floor(m.t / 60)}:${String(Math.floor(m.t % 60)).padStart(2, '0')}`;
      filas.push(`  ${mm} nv${m.nivel} bajas ${m.eliminados} oro ${m.oro} cofres ${m.cofres} evo [${m.evoluciones.join(',')}] (${(ms / 1000).toFixed(1)} s) · ${inventario(j).join(' · ')}`);
    }
    console.log(`${escenario} · tienda ${nombre} · ${disfraz}: promedio ${(suma / partidas / 60).toFixed(1)} min`);
    for (const f of filas) console.log(f);
  }
}
