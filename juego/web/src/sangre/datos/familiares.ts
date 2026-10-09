// El familiar (Sangre y Ceniza 2, L7, el Bosco de Deep Rock): un compañero que sigue al jugador y pelea solo. Va en
// una ranura nueva del equipo (con su calidad, que lo hace pegar más) y cae de los jefes. La campanita de plata no pega:
// suma dos etiquetas a la regla de las dos armas (como el «Support Chip»).
import type { Etiqueta } from '../tipos';

export interface DefFamiliar {
  id: string;
  nombre: string;
  desc: string;
  /** Vuela (va alto y atraviesa paredes) o camina detrás. */
  vuela: boolean;
}

export const FAMILIARES: DefFamiliar[] = [
  { id: 'cuervo', nombre: 'Cuervo', desc: 'Vuela a tu lado y picotea a los que se acercan (sombra).', vuela: true },
  { id: 'linterna', nombre: 'Linterna de ánimas', desc: 'Quema con su luz al más cercano (sombra) y te trae las almas de alrededor.', vuela: true },
  { id: 'sapo', nombre: 'Sapo de la bruja', desc: 'Escupe veneno que deja charcos en el piso.', vuela: false },
  { id: 'salamandra', nombre: 'Salamandra', desc: 'Tira brasas que dejan el piso ardiendo.', vuela: false },
  { id: 'lechuza', nombre: 'Lechuza de escarcha', desc: 'Suelta frascos helados que frenan y lastiman.', vuela: true },
  { id: 'perro', nombre: 'Perro de huesos', desc: 'Muerde a los que se acercan y excava la roca que le estorba.', vuela: false },
  { id: 'campanita', nombre: 'Campanita de plata', desc: 'No pelea: suma dos etiquetas a la regla de las dos armas.', vuela: true },
];
export const INDICE_FAMILIAR: Record<string, number> = Object.fromEntries(FAMILIARES.map((f, i) => [f.id, i]));

/** Las etiquetas que puede sumar la campanita, con su nombre para leer. */
const NOMBRE_ETQ: Partial<Record<Etiqueta, string>> = {
  fisico: 'físico', fuego: 'fuego', sagrado: 'sagrado', veneno: 'veneno', sangre: 'sangre', sombra: 'sombra', hielo: 'hielo', cuerpo: 'cuerpo a cuerpo',
  distancia: 'distancia', area: 'área', invocacion: 'invocación', construccion: 'construcción',
};
const BASE = Object.keys(NOMBRE_ETQ) as Etiqueta[];

/** Las dos etiquetas que suma la campanita (salen de la pieza: siempre las mismas para esa campanita). */
export function etiquetasCampanita(clave: string, etiquetas: readonly Etiqueta[] = BASE): Etiqueta[] {
  let h = 2166136261;
  for (let i = 0; i < clave.length; i++) h = Math.imul(h ^ clave.charCodeAt(i), 16777619) >>> 0;
  const a = h % etiquetas.length;
  let b = Math.floor(h / etiquetas.length) % etiquetas.length;
  if (b === a) b = (b + 1) % etiquetas.length;
  return [etiquetas[a], etiquetas[b]];
}

/** «fuego y hielo» (para la descripción de la campanita). */
export function textoCampanita(clave: string): string {
  return etiquetasCampanita(clave).map((e) => NOMBRE_ETQ[e] ?? e).join(' y ');
}
