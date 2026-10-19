// Director de oleadas al estilo de Plants vs. Zombies 1 (memoria del código del juego, verificada con las tablas de
// la wiki; ver investigación niveles-pvz1.json → sistema.oleadas).
//
// Plan: cada nivel tiene `oleadas` oleadas; cada décima (y la última) es enorme si el nivel tiene banderas. En la
// primera vuelta se usa la tabla de la wiki (zombis fijos + puntos que se gastan al azar). Si no hay tabla (o al
// repetir) se usa el algoritmo:
//   puntos = floor(i / 3) + 1 (primera vuelta) o floor(i · 2 / 5) + 1 (al repetir), con i desde 0, × multiplicador;
//   oleada enorme: min(puntos, 8) Zombis normales y 1 abanderado, y el presupuesto pasa a floor(puntos · 2,5);
//   última oleada: se añade uno de cada tipo permitido que falte; oleada de la mitad: el zombi nuevo del nivel;
//   el resto se gasta al azar, con probabilidad proporcional al peso, entre los tipos que caben en lo que queda y
//   cuya oleada mínima ya llegó (máximo 50 zombis por oleada).
//
// Tiempos: primera oleada a los 18 s; luego 25 + azar(0..6) s, o 45 s si la siguiente es enorme. Si pasaron más
// de 4 s y la vida de la última oleada baja del 50–65 % (azar) de la inicial, la cuenta salta a 2 s; antes de
// una oleada enorme solo salta cuando esa oleada muere del todo. Antes de cada bandera hay 7,5 s de aviso.
import { defZombi } from '../datos/zombis';
import type { IdZombi } from '../tipos';
import type { MotorPvZ } from './motor';
import * as R from './reglas';

export interface PlanOleada {
  /** Zombis en orden de salida (el abanderado primero). */
  zombis: IdZombi[];
  enorme: boolean;
  final: boolean;
  /** Uno de sus zombis lleva abono (brilla). */
  portador: boolean;
}

/** Estado del director (serializable). */
export interface EstadoDirector {
  /** Índice (0…) de la próxima oleada; igual al número de oleadas ya lanzadas. */
  siguiente: number;
  /** Segundos hasta la próxima oleada y la cuenta con la que empezó (para la barra de progreso). */
  cuenta: number;
  cuentaInicial: number;
  /** Segundos de aviso de oleada enorme que faltan (0 = sin aviso). */
  aviso: number;
  avisada: boolean;
  /** Segundos desde la última oleada. */
  desde: number;
  /** Vida total de la última oleada al salir y fracción a la que se adelanta la siguiente. */
  vidaInicial: number;
  umbral: number;
  /** Pesos para repartir los zombis entre filas sin repetir mucho la misma. */
  pesosFila: number[];
  /** 1-1: esperando a que siembren las plantas del tutorial. */
  esperando: boolean;
}

/** Tipos que pueden salir en el nivel (con su definición cargada). */
export function tiposDelNivel(m: MotorPvZ): IdZombi[] {
  const lista = [...m.nivel.zombis, ...(m.repeticion ? m.nivel.repeticion?.zombisExtra ?? [] : [])];
  if (m.banderas > 0 && !lista.includes('abanderado')) lista.push('abanderado');
  return lista.filter((t, i) => lista.indexOf(t) === i && !!defZombi(t));
}

function esEnorme(i: number, total: number, banderas: number): boolean {
  return banderas > 0 && ((i + 1) % 10 === 0 || i === total - 1);
}

/** Gasta `puntos` al azar en tipos que quepan (peso > 0, oleada mínima alcanzada). */
function gastar(m: MotorPvZ, lista: IdZombi[], puntos: number, tipos: IdZombi[], numero: number): void {
  while (puntos > 0 && lista.length < R.MAX_ZOMBIS_OLEADA) {
    const candidatos = tipos.filter((t) => {
      const d = defZombi(t)!;
      return d.peso > 0 && d.puntos <= puntos && d.oleadaMinima <= numero;
    });
    if (!candidatos.length) return;
    const i = m.azar.ponderado(candidatos.map((t) => defZombi(t)!.peso));
    const t = candidatos[i];
    lista.push(t);
    puntos -= defZombi(t)!.puntos;
  }
}

export function planificarOleadas(m: MotorPvZ): PlanOleada[] {
  const total = m.oleadasTotal;
  const tipos = tiposDelNivel(m);
  const tabla = m.repeticion ? undefined : m.nivel.tablaOleadas;
  const mult = m.nivel.multiplicadorPuntos ?? 1;
  const plan: PlanOleada[] = [];
  for (let i = 0; i < total; i++) {
    const enorme = esEnorme(i, total, m.banderas);
    const final = i === total - 1;
    const lista: IdZombi[] = [];
    const fila = tabla?.[i];
    if (fila) {
      // Primera vuelta: tabla de la wiki. El abanderado sale primero.
      const fijos = Object.entries(fila.fijos ?? {}) as [IdZombi, number][];
      fijos.sort((a, b) => (a[0] === 'abanderado' ? -1 : b[0] === 'abanderado' ? 1 : 0));
      for (const [t, n] of fijos) if (defZombi(t)) for (let k = 0; k < n; k++) lista.push(t);
      gastar(m, lista, fila.extra ?? 0, tipos, i + 1);
    } else {
      let puntos = (m.repeticion ? Math.floor((i * 2) / 5) + 1 : Math.floor(i / 3) + 1) * mult;
      if (enorme) {
        const normales = Math.min(puntos, 8);
        puntos = Math.floor(puntos * 2.5);
        if (tipos.includes('abanderado')) {
          lista.push('abanderado');
          puntos -= defZombi('abanderado')!.puntos;
        }
        for (let k = 0; k < normales; k++) lista.push('zombi');
        puntos -= normales * (defZombi('zombi')?.puntos ?? 1);
      }
      if (final) {
        for (const t of tipos) {
          if (t === 'abanderado' || lista.includes(t) || !(defZombi(t)!.peso > 0 || t === 'zombi')) continue;
          lista.push(t);
          puntos -= defZombi(t)!.puntos;
        }
      }
      const nuevo = m.nivel.zombiNuevo;
      if (nuevo && nuevo !== 'abanderado' && i === Math.floor(total / 2) && tipos.includes(nuevo)) {
        lista.push(nuevo);
        puntos -= defZombi(nuevo)!.puntos;
      }
      gastar(m, lista, puntos, tipos, i + 1);
    }
    plan.push({ zombis: lista, enorme, final, portador: false });
  }
  // Zombis brillantes con abono: unos 3 a 6 por nivel, nunca en la primera oleada (diseño PvZ 2 adaptado).
  if (m.abonoActivo && total > 1) {
    const k = Math.min(6, Math.max(3, Math.ceil(total / 2)), total - 1);
    const candidatas = Array.from({ length: total - 1 }, (_, i) => i + 1);
    for (let n = 0; n < k; n++) {
      const j = m.azar.entero(candidatas.length);
      plan[candidatas[j]].portador = true;
      candidatas.splice(j, 1);
    }
  }
  return plan;
}

export function crearDirector(m: MotorPvZ): EstadoDirector {
  return {
    siguiente: 0,
    cuenta: R.PRIMERA_OLEADA,
    cuentaInicial: R.PRIMERA_OLEADA,
    aviso: 0,
    avisada: false,
    desde: 0,
    vidaInicial: 0,
    umbral: R.UMBRAL_MIN,
    pesosFila: Array.from({ length: m.filas }, () => 1),
    esperando: !!m.nivel.esperaPlantas && !m.repeticion,
  };
}

/** Vida que le queda a una oleada (cuerpo vivo sin contar lo que se drena sin cabeza, más armaduras). */
export function vidaOleada(m: MotorPvZ, numero: number): number {
  let v = 0;
  for (const z of m.zombis) {
    if (z.vida <= 0 || z.oleada !== numero || z.hipnotizado || z.sinCabeza) continue;
    v += Math.max(0, z.vida - z.vidaMax / 3) + (z.casco?.vida ?? 0) + (z.escudo?.vida ?? 0);
  }
  return v;
}

export function pasoOleadas(m: MotorPvZ, dt: number): void {
  const d = m.director;
  if (m.sinOleadas || d.siguiente >= m.oleadasTotal) return;
  if (d.esperando) {
    const e = m.nivel.esperaPlantas!;
    if (m.plantas.filter((p) => p.vida > 0 && p.tipo === e.tipo).length < e.cantidad) return;
    d.esperando = false;
  }
  if (d.aviso > 0) {
    d.aviso -= dt;
    if (d.aviso <= 0) {
      d.aviso = 0;
      lanzarOleada(m, d.siguiente);
    }
    return;
  }
  d.cuenta -= dt;
  d.desde += dt;
  const proxima = m.plan[d.siguiente];
  if (d.siguiente > 0 && d.desde > R.ESPERA_MINIMA_UMBRAL && d.cuenta > R.CUENTA_ACELERADA) {
    const vida = vidaOleada(m, d.siguiente);
    if (proxima.enorme ? vida <= 0 : vida <= d.umbral * d.vidaInicial) d.cuenta = R.CUENTA_ACELERADA;
  }
  if (d.cuenta > 0) return;
  if (proxima.enorme && !d.avisada) {
    d.avisada = true;
    d.aviso = R.AVISO_BANDERA;
    m.emitir({ t: 'oleadaEnorme', n: d.siguiente + 1 });
    return;
  }
  lanzarOleada(m, d.siguiente);
}

/** Fila al azar entre las válidas, con menos probabilidad para las que acaban de recibir un zombi. */
function elegirFila(m: MotorPvZ, tipo: IdZombi): number {
  const def = defZombi(tipo)!;
  const agua = def.agua ?? 'no';
  const validas = m.filasActivas.filter((f) => {
    const esAgua = m.terreno[f][m.columnas - 1] === 'agua';
    return agua === 'tambien' || (agua === 'solo' ? esAgua : !esAgua);
  });
  const lista = validas.length ? validas : m.filasActivas;
  const pesos = m.director.pesosFila;
  const i = m.azar.ponderado(lista.map((f) => pesos[f]));
  const fila = lista[Math.max(0, i)];
  for (const f of lista) pesos[f] = f === fila ? 0.25 : Math.min(1, pesos[f] + 0.25);
  return fila;
}

export function lanzarOleada(m: MotorPvZ, i: number): void {
  const d = m.director;
  const o = m.plan[i];
  const numero = i + 1;
  const nuevos = o.zombis.map((tipo, k) => {
    const fila = elegirFila(m, tipo);
    // El abanderado encabeza la oleada; los demás salen un poco detrás, mezclados.
    const x = tipo === 'abanderado' && k === 0 ? R.X_APARICION : undefined;
    return m.aparecerZombi(tipo, fila, x, { oleada: numero });
  });
  if (o.portador) {
    const opciones = nuevos.filter((z) => z.tipo !== 'abanderado');
    const z = m.azar.elegir(opciones.length ? opciones : nuevos);
    if (z) z.brillante = true;
  }
  d.siguiente = numero;
  m.oleada = numero;
  d.vidaInicial = vidaOleada(m, numero);
  d.umbral = m.azar.rango(R.UMBRAL_MIN, R.UMBRAL_MAX);
  d.desde = 0;
  d.avisada = false;
  if (numero < m.oleadasTotal) {
    d.cuenta = m.plan[numero].enorme ? R.ESPERA_ANTES_DE_BANDERA : R.ESPERA_OLEADA + m.azar.rango(0, R.AZAR_OLEADA);
    d.cuentaInicial = d.cuenta;
  }
  m.emitir({ t: 'oleada', n: numero, total: m.oleadasTotal, enorme: o.enorme, final: o.final, zombis: nuevos.length });
  if (o.final) m.emitir({ t: 'ultimaOleada' });
}
