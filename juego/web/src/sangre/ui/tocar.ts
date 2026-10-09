// Tocar el mundo para recoger o abrir: busca qué hay donde se tocó (en la simulación, o en el espejo si es un
// invitado), marca el toque y manda al personaje a caminar hasta tenerlo al alcance de la mano.
import { buscarTocable } from '../sim/objetivos';
import type { Sim } from '../sim/sim';
import type { Escena3D } from '../vista/escena';
import type { Mando } from './mando';

export function engancharToque(mando: Mando, escena: Escena3D, estado: () => Pick<Sim, 'R' | 'ent'> | null) {
  const buscar = (px: number, py: number) => {
    const s = estado();
    const p = s ? escena.alPiso(px, py) : null;
    return s && p ? buscarTocable(s, p.x, p.y) : null;
  };
  mando.alTocar = (px, py) => {
    const b = buscar(px, py);
    if (!b) return;
    mando.ir(b.x, b.y);
    escena.marcarToque(b.x, b.y);
  };
  mando.alSobre = (px, py) => !!buscar(px, py);
}

/** Al terminar la partida: el mando (que es uno solo) deja de mirar esa simulación. */
export function soltarToque(mando: Mando) {
  mando.alTocar = () => undefined;
  mando.alSobre = () => false;
  mando.alAstral = () => undefined;
  mando.alSigilo = () => undefined;
  document.body.classList.remove('mano');
}
