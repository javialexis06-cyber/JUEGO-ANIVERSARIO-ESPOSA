// El piloto automático: se mueve esquivando, recoge gotitas y cofres, y escoge mejoras con sentido (sube lo que
// tiene, busca las pasivas que evolucionan sus armas). Sirve para medir el balance en Node y para las pruebas.
import { ARMAS, PASIVAS, maxNivelArma } from './armas';
import type { Jugador, Motor, Opcion } from './motor';
import type { IdArma, IdPasiva } from './tipos';

const VALOR_ARMA: Partial<Record<IdArma, number>> = {
  toalla: 6, burbujas: 8, cepillo: 6.5, champu: 6, peinilla: 6.5, esponjas: 7, secador: 6, espuma: 7.5, botellas: 7, jabon: 6, bombillo: 8,
  toallita: 3, patoAmarillo: 6.5, patoMorado: 6.5, ranitas: 5, ducha: 7, hilo: 5, perfume: 6, colonia: 6,
  chancletas: 6, maquina: 6.5, copito: 6, plancha: 7, vaporizador: 6, mariposas: 7, pistolaAgua: 4.5, brillantina: 6, cubitos: 6,
  cepilloEspalda: 6, mascarilla: 5, piedraPomez: 6, lucesLED: 6.5, letrasEspuma: 5,
  cortina: 5.5, neceser: 7, bolsillo: 6.5, pececitos: 6, confeti: 5.5, hueso: 5, bombaBano: 5, barquito: 4.5, talco: 4.5, bolitasGel: 5,
};
const VALOR_PASIVA: Partial<Record<IdPasiva, number>> = {
  jabonFuerte: 7, relojArena: 7, lupa: 6, espejoDoble: 8, crema: 6, cremaNoche: 5, gorro: 6, sales: 5, liga: 4, pantuflas: 5, iman: 5,
  trebol: 4, corona: 6, alcancia: 2, espejoRoto: 1, curita: 6, cajitaMusica: 6.5, bataGruesa: 5, velaAromatica: 4,
};

export function valorOpcion(j: Jugador, o: Opcion): number {
  if (o.tipo === 'arepa') return j.vida < j.vidaMax * 0.6 ? 6 : 2;
  if (o.tipo === 'oro') return 1;
  if (o.tipo === 'arma') {
    const id = o.id as IdArma;
    if (!o.nueva) return 9 + o.nivel * 0.3;
    // Si ya lleva muchas armas, prefiere subir las que tiene
    return (VALOR_ARMA[id] ?? 5) - j.armas.length * 0.4;
  }
  const id = o.id as IdPasiva;
  let v = VALOR_PASIVA[id] ?? 4;
  // ¿Evoluciona algo que ya tiene?
  for (const a of j.armas) if (ARMAS[a.id].evo?.pasiva === id || ARMAS[a.id].evo?.y === id) v += 4;
  // (la cajita de música: el nivel 9 trae maldición)
  if (id === 'cajitaMusica' && o.nivel >= PASIVAS.cajitaMusica.max) v -= 6;
  if (!o.nueva) v += 1.5;
  return v - (o.nueva ? j.pasivas.size * 0.3 : 0);
}

/** Escoge entre las cartas que tiene enfrente (con «volver a tirar» si todo está malo). */
export function botEscoger(m: Motor, j: Jugador) {
  if (j.cofre) {
    m.cerrarCofre(j.i);
    return;
  }
  if (j.cartaOpciones) {
    m.escogerCarta(j.i, j.cartaOpciones[0] ?? null);
    return;
  }
  if (!j.opciones) return;
  let mejor = 0, v = -1e9;
  j.opciones.forEach((o, k) => {
    const x = valorOpcion(j, o);
    if (x > v) {
      v = x;
      mejor = k;
    }
  });
  if (v < 4 && j.quedanTirar > 0) {
    m.tirarCartas(j.i);
    return;
  }
  m.escoger(j.i, mejor);
}

const DIRS = 20;
const cosD = Float32Array.from({ length: DIRS }, (_, k) => Math.cos((k / DIRS) * Math.PI * 2));
const sinD = Float32Array.from({ length: DIRS }, (_, k) => Math.sin((k / DIRS) * Math.PI * 2));
const peligro = new Float32Array(DIRS);

/** Hacia dónde caminar: la dirección con menos peligro, con premio por gotitas, cofres y arepas. */
export function botMover(m: Motor, j: Jugador) {
  if (j.caido) {
    j.mx = j.my = 0;
    return;
  }
  // En pareja: si el otro está caído, ir a levantarlo
  const caido = m.jug.find((o) => o !== j && o.caido);
  peligro.fill(0);
  const n = m.rej.circulo(j.x, j.y, 320);
  let cerca = 0;
  let masCerca = 1e9, ex = 0, ey = 0;
  for (let k = 0; k < n; k++) {
    const e = m.en[m.rej.fuera[k]];
    if (!e.vivo || e.luz) continue;
    const dx = e.x - j.x, dy = e.y - j.y;
    const d = Math.hypot(dx, dy);
    if (d > 320) continue;
    const libre = d - e.r - 12;
    if (libre < 45) cerca++;
    if (libre < masCerca) {
      masCerca = libre;
      ex = e.x;
      ey = e.y;
    }
    // Solo asustan los que están cerquita (como cuando uno juega: los deja acercarse para pegarles)
    const radioMiedo = e.jefe || e.elite ? 150 : 80;
    if (libre > radioMiedo) continue;
    const ux = dx / (d || 1), uy = dy / (d || 1);
    const w = (e.jefe ? 5 : e.elite ? 2.5 : 1) * (1 + e.def.dano / 20) * (1 / Math.max(5, libre)) ** 1.8 * 600;
    for (let q = 0; q < DIRS; q++) {
      const c = cosD[q] * ux + sinD[q] * uy;
      if (c > -0.2) peligro[q] += w * (c + 0.2) * (c + 0.2);
    }
  }
  // Premios: gotitas (si no está apretado), cofres siempre, arepas si le falta vida, y la velita más cercana
  const premio = (x: number, y: number, w: number) => {
    const dx = x - j.x, dy = y - j.y;
    const d = Math.hypot(dx, dy) || 1;
    for (let q = 0; q < DIRS; q++) {
      const c = cosD[q] * (dx / d) + sinD[q] * (dy / d);
      if (c > 0.3) peligro[q] -= (w * c * 20) / Math.max(40, d);
    }
  };
  if (cerca < 10) {
    // La mejor tanda de gotitas cerca (las que más dan por distancia)
    let mejorG = -1, vg = 0;
    for (let i = 0; i < m.gemas.length; i++) {
      const g = m.gemas[i];
      if (!g.vivo || g.jalada >= 0) continue;
      const d = Math.hypot(g.x - j.x, g.y - j.y);
      if (d > 380) continue;
      const v = (1 + Math.min(20, g.xp)) / (60 + d);
      if (v > vg) {
        vg = v;
        mejorG = i;
      }
    }
    if (mejorG >= 0) premio(m.gemas[mejorG].x, m.gemas[mejorG].y, 7);
  }
  for (const o of m.objs) {
    if (!o.vivo) continue;
    const w = o.tipo === 'cofre' ? 9 : o.tipo === 'arepa' ? (j.vida < j.vidaMax * 0.7 ? 6 : 0.5) : 2;
    if ((o.x - j.x) ** 2 + (o.y - j.y) ** 2 < 600 ** 2) premio(o.x, o.y, w);
  }
  // Si nadie está a tiro, ir por ellos (las armas pegan de cerca)
  if (masCerca > 70 && masCerca < 1e8) premio(ex, ey, 1.5);
  if (caido) premio(caido.x, caido.y, 14);
  else if (m.jug.length > 1) {
    // No alejarse mucho del otro
    const o = m.jug.find((x) => x !== j)!;
    if (Math.hypot(o.x - j.x, o.y - j.y) > 260) premio(o.x, o.y, 3);
  }
  // Velitas (gotas doradas y cosas)
  for (let k = 0; k < m.nVivos; k++) {
    const e = m.en[m.vivos[k]];
    if (e.luz && e.vivo && cerca < 4 && (e.x - j.x) ** 2 + (e.y - j.y) ** 2 < 400 ** 2) premio(e.x, e.y, 1.6);
  }
  // Las paredes del pasillo
  const lim = m.esc.limites;
  if (lim) {
    for (let q = 0; q < DIRS; q++) {
      if (sinD[q] < 0 && j.y - lim.yMin < 90) peligro[q] += 3 * -sinD[q];
      if (sinD[q] > 0 && lim.yMax - j.y < 90) peligro[q] += 3 * sinD[q];
    }
  }
  // Un poquito de inercia (que no tiemble)
  let mejor = 0, v = Infinity;
  const ang = Math.atan2(j.my, j.mx);
  for (let q = 0; q < DIRS; q++) {
    const inercia = j.mx || j.my ? -0.15 * Math.cos((q / DIRS) * Math.PI * 2 - ang) : 0;
    const x = peligro[q] + inercia;
    if (x < v) {
      v = x;
      mejor = q;
    }
  }
  const quieto = n === 0 && !m.objs.some((o) => o.vivo);
  if (quieto && v > -0.01) {
    // Nada que hacer: pasear en círculos amplios
    const a = m.tReal * 0.35 + j.i * Math.PI;
    j.mx = Math.cos(a);
    j.my = Math.sin(a);
    return;
  }
  j.mx = cosD[mejor];
  j.my = sinD[mejor];
}

/** Un paso completo con el bot: elige si está en pausa y se mueve. */
export function botPaso(m: Motor) {
  // (en línea, a los demás no se les escoge: escogen ellos en su celular)
  for (const j of m.jug) if (!j.remoto) botEscoger(m, j);
  for (const j of m.jug) if (!j.remoto) botMover(m, j);
}

/** Para las estadísticas: qué tan completo va el inventario. */
export function inventario(j: Jugador) {
  return [
    ...j.armas.map((a) => `${ARMAS[a.id].nombre} ${a.nivel}/${maxNivelArma(a.id)}`),
    ...[...j.pasivas].map(([id, nv]) => `${PASIVAS[id].nombre} ${nv}/${PASIVAS[id].max}`),
  ];
}
