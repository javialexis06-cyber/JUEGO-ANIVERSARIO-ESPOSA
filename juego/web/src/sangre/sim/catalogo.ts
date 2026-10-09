// Todos los tipos de «enemigo» en un solo arreglo (los de los biomas, el altar de sangre y los jefes): así viven en la
// misma piscina, las armas les apuntan igual y el dibujo los pinta con el mismo sistema de instancias por piezas.
import { ENEMIGOS_LISTA, JEFES, type DefEnemigo } from '../datos/mundo';

export const JEFES_ORDEN = ['golem_osarios', 'abadesa', 'gusano_sangre', 'obispo_hueco', 'conde', 'madre_piedra'] as const;
export const TIPO_ALTAR = ENEMIGOS_LISTA.length;
export const TIPO_JEFE = TIPO_ALTAR + 1;

const ALTAR: DefEnemigo = {
  id: 'altar', nombre: 'Altar de sangre', vida: 500, vel: 0, dano: 0, radio: 0.8, xp: 12, conducta: 'quieto', masa: 1, alto: 1.6, vivo: true,
  color: ['#5a2a2a', '#c02a2a'],
};

export const TIPOS: DefEnemigo[] = [
  ...ENEMIGOS_LISTA,
  ALTAR,
  ...JEFES_ORDEN.map((id): DefEnemigo => {
    const j = JEFES[id];
    return { id, nombre: j.nombre, vida: j.vida, vel: j.vel, dano: j.dano, radio: j.radio, xp: 200, conducta: 'jefe', masa: 1, alto: j.alto, color: j.color };
  }),
];
export const TIPO: Record<string, number> = Object.fromEntries(TIPOS.map((t, i) => [t.id, i]));
export const esJefe = (t: number) => t >= TIPO_JEFE;
