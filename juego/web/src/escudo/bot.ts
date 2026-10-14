// El bot del Escudo (?bot=1 en la página, y el balance sin pantalla): juega como alguien que ya entendió el juego
// pero no es perfecto. Si el bot gana con 1-3 estrellas y pierde a veces en los últimos niveles, la dificultad está
// «retadora pero pasable».
import { ENEMIGOS, TORRES, type IdTorre, type Rama } from './datos';
import { enRuta, type Motor, type Torre } from './motor';

export interface Bot {
  pensar(m: Motor): void;
}

/** Cuánto camino ve cada sitio a 4 m (los sitios en las esquinas valen más). */
function cobertura(m: Motor) {
  const muestras: [number, number][] = [];
  for (const r of m.rutas) for (let s = 0; s < r.largo; s += 0.8) { const q = enRuta(r, s); muestras.push([q.x, q.z]); }
  return m.sitios.map(([x, z]) => muestras.filter(([a, b]) => Math.hypot(a - x, b - z) < 4).length);
}

/** `torpe`: escoge sitios al azar y no usa las habilidades (como alguien que juega por primera vez). */
export function crearBot(habilidad = 1, torpe = false): Bot {
  let cob: number[] | null = null;
  let reloj = 0;
  let turno = 0;
  return {
    pensar(m: Motor) {
      if (m.terminado) return;
      cob ??= torpe ? m.sitios.map((_, i) => ((i * 7919) % 13)) : cobertura(m);
      reloj -= 1 / 30;
      if (m.oleada === 0 && m.t > 1.5) m.llamarOleada();
      if (reloj > 0) return;
      reloj = 0.5 / habilidad;
      const quedan = m.infinito ? [m.oleadaSiguiente() ?? []] : m.nivel.oleadas.slice(Math.max(0, m.oleada - 1));
      const tipos = new Set(quedan.flat().map((g) => g.t));
      const hayAire = tipos.has('polilla');
      const hayGolem = tipos.has('golem') || tipos.has('jefe');
      // Habilidades: donde haya un montón junto
      for (const id of torpe ? [] : (['eliana', 'serena'] as const)) {
        if (!m.habilidadLista(id)) continue;
        let mejor: [number, number, number] | null = null;
        for (const e of m.enemigos) {
          if (id === 'eliana' && e.aereo) continue;
          const n = m.enemigos.filter((o) => Math.hypot(o.x - e.x, o.z - e.z) < 2.2).reduce((a, o) => a + (o.tipo === 'jefe' ? 8 : o.tipo === 'golem' ? 3 : 1), 0);
          if (!mejor || n > mejor[2]) mejor = [e.x, e.z, n];
        }
        if (mejor && mejor[2] >= 6) m.usarHabilidad(id, mejor[0], mejor[1]);
      }
      if (m.habilidadLista('lazo') && m.enemigos.some((e) => e.s / m.rutas[e.ruta].largo > 0.85) && m.vidas <= 14) m.usarHabilidad('lazo');
      // Fuatia: el elemento según lo que viene
      for (const t of m.torres) {
        if (t.tipo !== 'fuatia' || t.rama) continue;
        const aire = m.enemigos.filter((e) => e.aereo).length, golems = m.enemigos.filter((e) => e.tipo === 'golem' || e.tipo === 'jefe').length;
        m.cambiarElemento(t, aire > 3 ? 'aire' : golems > 0 ? 'tierra' : m.enemigos.length > 10 ? 'agua' : 'fuego');
      }
      // Construir o mejorar
      const libres = m.sitios.map((_, i) => i).filter((i) => !m.torreEn(i)).sort((a, b) => cob![b] - cob![a]);
      const cuenta = (tipo: IdTorre) => m.torres.filter((t) => t.tipo === tipo).length;
      const permitida = (t: IdTorre) => m.torresPermitidas.includes(t);
      let quiero: IdTorre | null = null;
      const aireYa = (m.oleadaSiguiente() ?? []).filter((g) => g.t === 'polilla').reduce((a, g) => a + g.n, 0);
      if (hayAire && permitida('grifo') && cuenta('grifo') < 1 + Math.floor(m.oleada / 4) + (aireYa >= 12 ? 1 : 0)) quiero = 'grifo';
      else if (permitida('lara') && cuenta('lara') < 1 + Math.floor(m.torres.length / 5)) quiero = 'lara';
      else if (permitida('unicornio') && m.torres.length >= 4 && cuenta('unicornio') < Math.floor(m.torres.length / 4)) quiero = 'unicornio';
      else if (permitida('fuatia') && hayGolem && cuenta('fuatia') < 1 + Math.floor(m.torres.length / 6)) quiero = 'fuatia';
      else {
        const rotacion: IdTorre[] = ['aura', 'dragon', 'aura', 'grifo', 'dragon'].filter((t) => permitida(t as IdTorre)) as IdTorre[];
        quiero = rotacion[m.torres.length % rotacion.length];
      }
      // ¿Mejor mejorar? Las torres que más ven primero; las ramas cuando ya hay varias en nivel 3
      const mejorable = m.torres.filter((t) => m.costoMejora(t) !== null || (t.nivel === 3 && !t.rama))
        .sort((a, b) => cob![b.sitio] - cob![a.sitio] + (a.nivel - b.nivel) * 6)[0] as Torre | undefined;
      const construirPrimero = libres.length > 0 && (m.torres.length < 4 || turno % 3 === 0);
      if (construirPrimero && quiero) {
        const sitio = quiero === 'unicornio'
          ? libres.sort((a, b) => vecinas(m, b) - vecinas(m, a))[0]
          : quiero === 'dragon' ? libres.find((i) => cob![i] >= 9) ?? libres[0] : libres[0];
        if (m.luz >= TORRES[quiero].etapas[0].costo) {
          m.construir(sitio, quiero);
          turno++;
        }
        return;
      }
      if (mejorable) {
        const c = m.costoMejora(mejorable);
        if (c !== null) {
          if (m.luz >= c) { m.mejorar(mejorable); turno++; }
        } else {
          const r: Rama = (mejorable.tipo === 'dragon' && hayGolem) || mejorable.tipo === 'unicornio' && !hayGolem ? 'a' : mejorable.sitio % 2 ? 'a' : 'b';
          if (m.luz >= TORRES[mejorable.tipo].ramas[r].costo) { m.escogerRama(mejorable, r); turno++; }
        }
        return;
      }
      if (quiero && libres.length && m.luz >= TORRES[quiero].etapas[0].costo) { m.construir(libres[0], quiero); turno++; }
      void ENEMIGOS;
    },
  };
}

function vecinas(m: Motor, sitio: number) {
  const [x, z] = m.sitios[sitio];
  return m.torres.filter((t) => Math.hypot(t.x - x, t.z - z) < 3.6).length;
}
