// Progreso de «Lavarse la cara» desde cero: el piloto juega una partida tras otra, con lo que gana compra mejoras de
// la tienda (en un orden sensato) y se anota hasta qué minuto llega cada vez. Sirve para ver cuántas partidas hacen
// falta para pasar los 30 minutos. Uso: node scripts/progresion-lavado.mjs [partidas] [escenario] [disfraz] [semilla]
import { Motor, ajustarTarde } from '../src/casa/lavado/motor';
import { botPaso } from '../src/casa/lavado/bot';
import { PODER, precioPoder } from '../src/casa/lavado/tienda';
import type { IdEscenario, Stat } from '../src/casa/lavado/tipos';

const partidas = Number(process.argv[2] ?? 12);
const escenario = (process.argv[3] ?? 'cara') as IdEscenario;
const disfraz = process.argv[4] ?? 'el_panda';
const semilla = Number(process.argv[5] ?? 1);
// TARDE=vida,daño[,oro] prueba otra subida de los bichos después del minuto 14 (y otro rendimiento de las gotas)
if (process.env.TARDE) {
  const [v, d, o] = process.env.TARDE.split(',').map(Number);
  ajustarTarde(v, d, o);
}

/** Lo que compraría alguien que juega: primero sobrevivir y pegar más, después lo demás. */
const ORDEN: Stat[] = ['poder', 'vida', 'recuperacion', 'armadura', 'area', 'enfriamiento', 'iman', 'crecimiento', 'movimiento', 'duracion', 'velocidad', 'codicia', 'suerte', 'cantidad', 'revivir', 'tirar'];

const compras: Partial<Record<Stat, number>> = {};
let oro = 0;
const DT = 1 / 30;
for (let k = 1; k <= partidas; k++) {
  const rol = disfraz.startsWith('ella') ? 'ella' : 'el';
  const m = new Motor({ escenario, apurado: false, semilla: semilla * 7919 + k * 104729, jugadores: [{ rol, disfraz, poderes: { ...compras }, secretos: [] }] });
  let pasos = 0;
  while (!m.fin && m.t < 31 * 60 && pasos < 31 * 60 * 30 * 1.2) {
    botPaso(m);
    m.paso(DT);
    pasos++;
  }
  const r = m.resumen(0);
  oro += r.oro;
  // Compra en orden: lo primero que no esté completo y alcance; si lo primero no alcanza, ahorra para eso
  const compradas: string[] = [];
  for (let vueltas = 0; vueltas < 200; vueltas++) {
    const id = ORDEN.find((x) => (compras[x] ?? 0) < PODER[x].max);
    if (!id) break;
    const precio = precioPoder(id, compras);
    if (precio > oro) break;
    oro -= precio;
    compras[id] = (compras[id] ?? 0) + 1;
    compradas.push(id);
  }
  const mm = `${Math.floor(m.t / 60)}:${String(Math.floor(m.t % 60)).padStart(2, '0')}`;
  const rangos = Object.values(compras).reduce((a, b) => a + (b ?? 0), 0);
  console.log(`partida ${String(k).padStart(2)}: ${mm}${r.gano ? ' ¡ganó!' : ''} · gotas +${r.oro} (quedan ${oro}) · ${rangos} rangos · compró ${compradas.join(',') || 'nada'}`);
}
