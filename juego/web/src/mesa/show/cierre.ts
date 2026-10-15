// El recibo acompaña al episodio. Monedas y victorias se aplican en la misma escritura de la casa.
import type { EpisodioShow, RolShow, ShowCasa } from '../../casa/show_casa';

export interface CierreShow {
  id: string;
  emisor: string;
  n: number;
  destino: string;
  rol: RolShow;
  monedas: number;
  victorias: number;
  episodio?: EpisodioShow;
}

export function cierreValido(v: unknown): v is CierreShow {
  if (!v || typeof v !== 'object') return false;
  const c = v as CierreShow;
  return typeof c.id === 'string' && c.id.length > 0 && c.id.length <= 40 && /^[a-f0-9-]{36}$/.test(c.emisor)
    && Number.isSafeInteger(c.n) && c.n > 0 && typeof c.destino === 'string' && c.destino.length <= 1000
    && (c.rol === 'el' || c.rol === 'ella') && Number.isInteger(c.monedas) && c.monedas >= 0 && c.monedas <= 4
    && Number.isInteger(c.victorias) && c.victorias >= 0 && c.victorias <= 2
    && (c.episodio === undefined || !!c.episodio && c.episodio.id === c.id && Number.isFinite(c.episodio.t)
      && Array.isArray(c.episodio.q) && c.episodio.q.length <= 40
      && c.episodio.q.every(q => typeof q === 'string' && /^[a-z][a-z0-9]{1,10}(:[ea])?$/.test(q))
      && ['solo', 'local', 'linea'].includes(c.episodio.m)
      && Number.isFinite(c.episodio.c) && c.episodio.c >= 0 && c.episodio.c <= 100
      && !!c.episodio.p && ['el', 'ella'].every(r => Number.isFinite(c.episodio!.p[r as RolShow]) && c.episodio!.p[r as RolShow] >= 0));
}

/** true: premio confirmado o ya cobrado. En el libro suelto queda reservado hasta abrir la casa. */
export function aplicarCierreShow(s: ShowCasa, casa: { monedas?: number }, c: CierreShow, soloPremio = false) {
  if (!soloPremio && c.episodio && !s.ep.some(e => e.id === c.id)) {
    s.ep.push(c.episodio);
    s.ep.sort((a, b) => a.t - b.t);
    s.ep = s.ep.slice(-60);
  }
  if (typeof casa.monedas !== 'number') return false;
  s.cobros ??= {};
  if ((s.cobros[c.emisor] ?? 0) >= c.n) return true;
  casa.monedas += c.monedas;
  s.victorias ??= { el: 0, ella: 0 };
  s.victorias[c.rol] += c.victorias;
  s.cobros[c.emisor] = c.n;
  return true;
}
