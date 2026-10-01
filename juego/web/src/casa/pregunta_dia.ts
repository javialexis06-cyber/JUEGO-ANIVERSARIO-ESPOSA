// La pregunta del día de «El Show de Nosotros», para cuando no pueden jugar al tiempo (viven en ciudades distintas):
// cada uno la contesta cuando pueda (en la nevera de la casa o en la cabina del show), sobre sí mismo y adivinando al
// otro. Cuando los dos contestaron, se revela con su animación y cada uno se gana una monedita (una sola vez).
// Vive en el estado compartido de la casa (casa.show.dia, normalizado en show_casa.ts).
import './pregunta_dia.css';
import { calificar, candidatasDelDia, preguntaDelDia } from '../mesa/show/motor';
import { armar, CATEGORIAS, NOMBRE, pregunta, type Pregunta } from '../mesa/show/preguntas';
import { fechaHoy, MAX_DIAS, type ShowCasa, showVacio } from './show_casa';

export { fechaHoy };

export type Rol = 'el' | 'ella';
const otro = (r: Rol): Rol => (r === 'el' ? 'ella' : 'el');
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Pone la pregunta de hoy si todavía no hay (la de ayer pasa al libro). Devuelve true si cambió algo. */
export function asegurarDia(s: ShowCasa, fecha = fechaHoy()): boolean {
  if (s.dia?.f === fecha) return false;
  if (s.dia && !s.dias.some((d) => d.f === s.dia!.f)) s.dias = [...s.dias, s.dia].slice(-MAX_DIAS);
  s.dia = { f: fecha, q: preguntaDelDia(s, fecha) };
  return true;
}

export interface Dia {
  p: Pregunta;
  fecha: string;
  mio: { a?: string; g?: string };
  suyo: { a?: string; g?: string };
  contestada: boolean;
  revelada: boolean;
  pagado: boolean;
}

export function estadoDia(s: ShowCasa | undefined | null, yo: Rol): Dia | null {
  if (!s?.dia) return null;
  const p = pregunta(s.dia.q);
  if (!p) return null;
  const o = otro(yo);
  const mio = { a: s.r[yo][p.id], g: s.g[yo][p.id] };
  const suyo = { a: s.r[o][p.id], g: s.g[o][p.id] };
  const contestada = mio.a !== undefined && mio.g !== undefined;
  return { p, fecha: s.dia.f, mio, suyo, contestada, revelada: contestada && suyo.a !== undefined && suyo.g !== undefined, pagado: !!s.dia.pagado?.[yo] };
}

interface Opciones {
  yo: Rol;
  /** Lee el show de la casa (ya normalizado). */
  leer(): Promise<ShowCasa | null>;
  /** Aplica un cambio al show (y a la casa, para la monedita) y lo guarda; devuelve el show guardado. */
  cambiar(fn: (s: ShowCasa, casa: { monedas?: number }) => void): Promise<ShowCasa | null>;
  /** Avisos cortos y la lluvia de corazones de quien lo muestra. */
  aviso?(texto: string): void;
  celebrar?(): void;
  /** Ir al libro de nosotros. */
  alLibro?(): void;
}

/** La pregunta del día dentro de `cont`: contestar en dos pasos y, cuando estén las dos, la revelación. */
export async function montarPreguntaDia(cont: HTMLElement, o: Opciones) {
  const { yo } = o;
  const ot = otro(yo);
  cont.classList.add('dia');
  cont.innerHTML = '<p class="dia-cargando">Abriendo la nevera…</p>';
  let s = (await o.leer()) ?? showVacio();
  if (!s.dia || s.dia.f !== fechaHoy()) s = (await o.cambiar((x) => void asegurarDia(x))) ?? s;
  const respuesta: { a?: string; g?: string } = {};

  const opciones = (p: Pregunta, sujeto: Rol, campo: 'a' | 'g') => {
    if (p.tipo === 'termo') {
      return `<div class="dia-termo"><output>5</output><input type="range" min="1" max="10" value="5" data-campo="${campo}">
        <span><small>1 · ${esc(armar(p.bajo, sujeto))}</small><small>${esc(armar(p.alto, sujeto))} · 10</small></span>
        <button class="dia-boton" data-listo="${campo}">Ese número</button></div>`;
    }
    const lista = p.tipo === 'prefiere' ? p.o : p.tipo === 'conoce' && p.o ? p.o.map((x) => armar(x, sujeto)) : [];
    return `<div class="dia-ops">${lista.map((t, k) => `<button class="dia-op" data-campo="${campo}" data-v="${k}"><i>${String.fromCharCode(65 + k)}</i>${esc(t)}</button>`).join('')}</div>`;
  };
  const textoDe = (p: Pregunta, sujeto: Rol) => (p.tipo === 'conoce' || p.tipo === 'termo' ? armar(p.t, sujeto) : p.t);
  const valor = (p: Pregunta, sujeto: Rol, v?: string) => {
    if (v === undefined) return '…';
    if (p.tipo === 'termo') return v;
    if (p.tipo === 'prefiere') return p.o[Number(v)] ?? v;
    if (p.tipo === 'conoce' && p.o) return armar(p.o[Number(v)] ?? v, sujeto);
    return v;
  };

  const pintar = (animarRevela = false, recienPagado = false) => {
    const d = estadoDia(s, yo);
    if (!d) {
      cont.innerHTML = '<p class="dia-cargando">No se pudo abrir la pregunta de hoy. Intenta en un ratico.</p>';
      return;
    }
    const { p } = d;
    const cat = CATEGORIAS[p.cat];
    const cabeza = `<header class="dia-cabeza" style="--cat:${cat.color}"><span>${cat.icono} ${cat.nombre}</span><small>Pregunta del día · ${esc(d.fecha.split('-').reverse().join('/'))}</small></header>`;
    if (!d.contestada) {
      const paso = respuesta.a === undefined ? 'a' : 'g';
      const sujeto = paso === 'a' ? yo : ot;
      const titulo = paso === 'a' ? (p.tipo === 'prefiere' ? '1. ¿Qué prefieres <b>tú</b>?' : '1. Sobre <b>ti</b>, con la verdad:') : `2. ¿Qué crees que contestó <b>${NOMBRE[ot]}</b>?`;
      cont.innerHTML = `${cabeza}<p class="dia-texto">${esc(textoDe(p, sujeto))}</p><p class="dia-paso">${titulo}</p>${opciones(p, sujeto, paso)}
        <p class="dia-pie">${d.suyo.a !== undefined ? `💌 ${NOMBRE[ot]} ya contestó: ¡apenas termines se revela!` : `${NOMBRE[ot]} todavía no la contesta.`}</p>`;
      return;
    }
    if (!d.revelada) {
      cont.innerHTML = `${cabeza}<p class="dia-texto">${esc(textoDe(p, yo))}</p>
        <div class="dia-espera"><i>✉️</i><b>¡Guardada en el sobre!</b><small>Se revela cuando ${NOMBRE[ot]} la conteste. Tú dijiste: <b>${esc(valor(p, yo, d.mio.a))}</b></small></div>
        ${o.alLibro ? '<button class="dia-boton dia-libro">📖 Ver el libro de nosotros</button>' : ''}`;
      return;
    }
    // Revelada: lo de cada uno y si se atinaron
    const r = { [yo]: { a: d.mio.a, g: d.mio.g }, [ot]: { a: d.suyo.a, g: d.suyo.g } } as Record<Rol, { a?: string; g?: string }>;
    const bloque = (sujeto: Rol) => {
      if (p.tipo === 'prefiere') return '';
      const res = calificar(p, { id: p.id, s: sujeto }, r);
      const a = res.atino[otro(sujeto)];
      return `<div class="dia-bloque" data-r="${sujeto}"><small>Sobre ${NOMBRE[sujeto]}</small>
        <p><b>${NOMBRE[sujeto]}</b> dijo <span>${esc(valor(p, sujeto, r[sujeto].a))}</span></p>
        <p><b>${NOMBRE[otro(sujeto)]}</b> adivinó <span>${esc(valor(p, sujeto, r[otro(sujeto)].g))}</span> <i class="ok-${a ?? 'no'}">${a === 'si' ? '✓' : a === 'casi' ? '≈' : '✗'}</i></p></div>`;
    };
    let cuerpo: string;
    let aciertos = 0;
    if (p.tipo === 'prefiere') {
      const res = calificar(p, { id: p.id }, r);
      aciertos = (['el', 'ella'] as Rol[]).filter((q) => res.atino[q] === 'si').length;
      cuerpo = (['el', 'ella'] as Rol[])
        .map((q) => `<div class="dia-bloque" data-r="${q}"><p><b>${NOMBRE[q]}</b> prefiere <span>${esc(valor(p, q, r[q].a))}</span></p>
          <p><small>Creía que ${NOMBRE[otro(q)]}: ${esc(valor(p, q, r[q].g))}</small> <i class="ok-${res.atino[q] ?? 'no'}">${res.atino[q] === 'si' ? '✓' : '✗'}</i></p></div>`)
        .join('');
    } else {
      for (const suj of ['el', 'ella'] as Rol[]) if (calificar(p, { id: p.id, s: suj }, r).atino[otro(suj)] === 'si') aciertos++;
      cuerpo = bloque('el') + bloque('ella');
    }
    const frase = aciertos === 2 ? '¡Se conocen de memoria! 💞' : aciertos === 1 ? '¡Uno de los dos atinó!' : '¡Ninguno atinó! Hay tema para la videollamada.';
    cont.innerHTML = `${cabeza}<p class="dia-texto">${esc(p.tipo === 'prefiere' ? p.t : textoDe(p, yo))}</p>
      <div class="dia-revela${animarRevela ? ' anima' : ''}">${cuerpo}</div><p class="dia-frase">${frase}</p>
      ${recienPagado ? '<p class="dia-premio">+1 moneda para la casa</p>' : ''}
      ${o.alLibro ? '<button class="dia-boton dia-libro">📖 Ver el libro de nosotros</button>' : ''}`;
  };

  const guardar = async () => {
    const id = s.dia?.q;
    if (!id) return;
    const nuevo = await o.cambiar((x) => {
      asegurarDia(x);
      if (x.dia?.q !== id) return;
      if (respuesta.a !== undefined) x.r[yo][id] = respuesta.a;
      if (respuesta.g !== undefined) x.g[yo][id] = respuesta.g;
    });
    if (!nuevo) {
      o.aviso?.('No se pudo guardar. Revisa la conexión.');
      return;
    }
    s = nuevo;
    const d = estadoDia(s, yo);
    if (d?.revelada) {
      pintar(true, await cobrar());
      o.celebrar?.();
    } else {
      pintar();
      o.aviso?.(`¡Listo! Cuando ${NOMBRE[ot]} conteste, se revela.`);
    }
  };

  /** La monedita de la revelación, una sola vez por persona. */
  const cobrar = async (): Promise<boolean> => {
    const d = estadoDia(s, yo);
    if (!d?.revelada || d.pagado) return false;
    let pago = false;
    const nuevo = await o.cambiar((x, casa) => {
      if (!x.dia || x.dia.q !== d.p.id || x.dia.pagado?.[yo]) return;
      x.dia.pagado = { ...x.dia.pagado, [yo]: 1 };
      casa.monedas = (casa.monedas ?? 0) + 1;
      pago = true;
    });
    if (nuevo) s = nuevo;
    return pago && !!nuevo;
  };

  cont.onclick = (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) return;
    if (b.classList.contains('dia-libro')) return o.alLibro?.();
    const campo = (b.dataset.campo ?? b.dataset.listo) as 'a' | 'g' | undefined;
    if (!campo) return;
    if (b.dataset.listo) {
      const inp = cont.querySelector<HTMLInputElement>('input[type=range]');
      respuesta[campo] = inp?.value ?? '5';
    } else respuesta[campo] = b.dataset.v;
    b.classList.add('elegida');
    setTimeout(() => {
      if (respuesta.g !== undefined) void guardar();
      else pintar();
    }, 220);
  };
  cont.oninput = (ev) => {
    const inp = ev.target as HTMLInputElement;
    if (inp.type === 'range') cont.querySelector('.dia-termo output')!.textContent = inp.value;
  };
  const d = estadoDia(s, yo);
  if (d?.revelada && !d.pagado) {
    pintar(true, await cobrar());
    o.celebrar?.();
  } else pintar();
}

/** Cuántas preguntas sirven para la pregunta del día (para las pruebas). */
export const cuantasDelDia = () => candidatasDelDia().length;
