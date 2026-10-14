// El Escudo de las Hermanas para la versión de amigos: el mismo mito sin nombrar a nadie. Quien defiende el escudo es
// el muñeco del amigo que juega (con sus colores) y no hay constelación de la pareja. Reemplaza a src/escudo/pareja.ts
// (SUSTITUTOS en vite.config.ts).
import * as THREE from 'three';
import { amigoDelAparato } from '../../sueltos/comun';
import { actuar, animarMuneco, muneco } from '../../escudo/actores';
import type { Linea } from '../../escudo/guion';

export const CON_PAREJA = false;

export const VOCES_PAREJA: string = 'audio/escudo/';

export const LINEAS_PAREJA: Record<string, Linea> = {
  IN5: { id: 'IN5A', quien: 'narrador', texto: 'Los defensores llegaron al Borde. Sobre ellos, las estrellas de Astra volvieron a brillar.',
    d: '[warm, wonder] Los defensores llegaron al Borde. [pause] Sobre ellos, las estrellas de Astra volvieron a brillar.' },
  FI5: { id: 'FI5A', quien: 'narrador', texto: 'El escudo brilló entero. Esa estrella no sería de nadie: el mundo de Celia seguía en pie.',
    d: '[warm, slow] El escudo brilló entero. [pause] Esa estrella no sería de nadie... el mundo de Celia seguía en pie.' },
  LZ1: { id: 'LZ1A', quien: 'narrador', texto: 'La luz de Celia cubre el escudo: nada lo cruza.', d: '[awed, strong] La luz de Celia cubre el escudo: ¡nada lo cruza!' },
};

export const LAZO = { nombre: 'Celia', titulo: 'La luz de Celia', desc: 'La semidiosa cubre el escudo: por 9 s nada lo daña y todo pega 30 % más.' };

export const ESCENA_INICIO = ['IN1', 'IN5', 'IN2', 'IN3', 'IN4'];
export const ESCENA_FINAL = ['FI1', 'FI2', 'FI3', 'FI4', 'FI5'];

export interface Defensores {
  grupo: THREE.Group;
  estado(e: string): void;
  actualizar(dt: number, t: number): void;
  hablante(quien: string | null): void;
}

/** El muñeco del amigo, de pie junto al ancla del escudo. */
export async function defensores(fin: [number, number]): Promise<Defensores | null> {
  const a = amigoDelAparato();
  if (!a) return null;
  const m = await muneco(a.cuerpo, a.aspecto, 'jarras');
  const grupo = new THREE.Group();
  m.raiz.position.set(fin[0] - 0.2, 0, fin[1] - 3.7);
  m.raiz.rotation.y = -Math.PI / 2 + 0.35;
  grupo.add(m.raiz);
  return {
    grupo,
    estado(e) {
      if (e === 'lazo') actuar(m, 'senalar_arriba', 3);
      else if (e === 'gano' || e === 'mano') { actuar(m, 'celebrar', 4); m.p.cara('feliz'); }
      else if (e === 'perdio') { actuar(m, 'triste', 4); m.p.cara('triste'); }
    },
    actualizar(dt, t) { animarMuneco(m, dt, t); },
    hablante() { /* el amigo no habla */ },
  };
}

export function constelacion(): { grupo: THREE.Group; actualizar(t: number, fuerza: number): void } | null {
  return null;
}
