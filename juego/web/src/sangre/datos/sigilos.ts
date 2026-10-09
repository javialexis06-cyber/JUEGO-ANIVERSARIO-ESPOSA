// Los sigilos: marcas de sangre que se dibujan en la mano antes de bajar (hasta dos a la vez). No son armas: son
// herramientas de exploración y de supervivencia (el mapa, la brújula, el zahorí…). Los dos primeros vienen dados;
// los demás se compran en el Pozo con ceniza. Los activos se usan con su botón (R y F en el computador).

export type IdSigilo = 'cartografo' | 'brujula' | 'zahori' | 'cuervo' | 'sangre_fria' | 'iman_tumba' | 'ultima_vela' | 'paso_sombra';

export interface DefSigilo {
  id: IdSigilo;
  nombre: string;
  desc: string;
  glifo: string;
  color: string;
  /** Precio en ceniza en el Pozo (0: viene dado). */
  precio: number;
  /** Los que se usan con un botón: cuánta vida cuestan (fracción de la vida que se tiene) y la recarga (s). */
  activo?: { vida: number; recarga: number };
}

const S = (id: IdSigilo, nombre: string, glifo: string, color: string, precio: number, desc: string, activo?: DefSigilo['activo']): DefSigilo =>
  ({ id, nombre, glifo, color, precio, desc, activo });

export const SIGILOS: Record<IdSigilo, DefSigilo> = {
  cartografo: S('cartografo', 'Sigilo del Cartógrafo', 'mapa', '#e0cc98', 0,
    'Un mapa en la esquina con el croquis de toda la etapa en sombra; lo que ya recorrieron se aclara. Tócalo para verlo grande.'),
  brujula: S('brujula', 'Brújula de sangre', 'brujula', '#ff4a4a', 0,
    'Pagas el 70 % de la vida que tienes y una flecha de sangre te señala por 15 s el objetivo pendiente más cercano, principal o secundario.',
    { vida: 0.7, recarga: 15 }),
  zahori: S('zahori', 'Sigilo del Zahorí', 'horqueta', '#8ad0ff', 400,
    'Las vetas a menos de 12 m brillan a través de la roca (y salen en el mapa del Cartógrafo).'),
  cuervo: S('cuervo', 'Ojo del cuervo', 'cuervo', '#c8b8ff', 500,
    'Los cofres, las llaves y los prisioneros a menos de 25 m se señalan con una flechita en el borde de la pantalla.'),
  sangre_fria: S('sangre_fria', 'Sangre fría', 'gota', '#9cc4ee', 350,
    'La visión astral cuesta la mitad de vida y dura un segundo más.'),
  iman_tumba: S('iman_tumba', 'Imán de tumba', 'iman', '#ffd060', 600,
    'Pagas el 15 % de tu vida y todo lo que hay tirado en la etapa vuela hacia ti: almas, oro, hierro, sangre y minerales.',
    { vida: 0.15, recarga: 60 }),
  ultima_vela: S('ultima_vela', 'La última vela', 'vela', '#ffb060', 800,
    'Una vez por etapa, el golpe que te iba a tumbar te deja con 1 de vida, 2 s intocable y una onda que empuja a todos.'),
  paso_sombra: S('paso_sombra', 'Paso de sombra', 'sombra', '#a890d0', 450,
    'Saltas 4 m hacia donde caminas, atravesando a los bichos (las paredes no). Es gratis.', { vida: 0, recarga: 10 }),
};

export const SIGILOS_ORDEN = Object.keys(SIGILOS) as IdSigilo[];
/** Los que vienen dados. */
export const SIGILOS_INICIALES: IdSigilo[] = ['cartografo', 'brujula'];
/** Cuántos se llevan a la vez. */
export const RANURAS_SIGILO = 2;
/** Teclas de los sigilos activos (en el orden en que se llevan). */
export const TECLAS_SIGILO = ['R', 'F'];
/** Hasta dónde ve el Zahorí y el Ojo del cuervo (m). */
export const RADIO_ZAHORI = 12;
export const RADIO_CUERVO = 25;
/** Lo que dura la flecha de la brújula (s). */
export const DURACION_BRUJULA = 15;
/** La ranura del n-ésimo sigilo activo que se lleva (las teclas y los botones van por los activos). */
export const ranuraActiva = (sigilos: readonly IdSigilo[], n: number) => sigilos.map((id, k) => (SIGILOS[id]?.activo ? k : -1)).filter((k) => k >= 0)[n] ?? -1;
export const esSigilo = (x: unknown): x is IdSigilo => typeof x === 'string' && x in SIGILOS;
