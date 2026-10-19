// Cinta transportadora (1-10 y demás x-10, La bolera y otros minijuegos). Los sobres entran por la derecha y se
// deslizan a la izquierda hasta juntarse; caben unos 10. No cuestan sol ni tienen recarga: se toma uno, se planta
// y desaparece. Ritmo (memoria del código): un sobre cada 4 s; 4,25 s si hay más de 4; 5 s si más de 6; 10 s si
// más de 8. El tipo se elige con los pesos del nivel, menos probable cuantos más iguales haya ya en la cinta.
import type { IdPlanta } from '../tipos';
import type { MotorPvZ } from './motor';
import * as R from './reglas';

/** Elige el tipo del siguiente sobre. */
export function elegirSobre(m: MotorPvZ): IdPlanta | undefined {
  const def = m.nivel.cinta;
  if (!def || !m.cinta) return undefined;
  const pesos = def.plantas.map((p) => p.peso / (1 + m.cinta!.filter((it) => it.tipo === p.tipo).length));
  const i = m.azar.ponderado(pesos);
  return i >= 0 ? def.plantas[i].tipo : undefined;
}

export function pasoCinta(m: MotorPvZ, dt: number): void {
  const cinta = m.cinta;
  if (!cinta) return;
  // Deslizar: cada sobre avanza hasta tocar al de su izquierda.
  for (let i = 0; i < cinta.length; i++) {
    const tope = i === 0 ? 0 : cinta[i - 1].x + 1;
    cinta[i].x = Math.max(tope, cinta[i].x - R.VEL_CINTA * dt);
  }
  m.cintaReloj -= dt;
  if (m.cintaReloj > 0) return;
  if (cinta.length < R.CINTA_MAX) {
    const tipo = elegirSobre(m);
    if (tipo) {
      const ultimo = cinta[cinta.length - 1];
      const item = { id: m.nuevoId(), tipo, x: Math.max(R.CINTA_MAX, ultimo ? ultimo.x + 1 : 0) };
      cinta.push(item);
      m.emitir({ t: 'cinta', item: item.id, tipo });
    }
  }
  m.cintaReloj = R.esperaCinta(cinta.length);
}
