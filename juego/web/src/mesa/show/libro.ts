// «El libro de nosotros»: el álbum donde quedan todas las respuestas del show y de la pregunta del día, para
// releerlas. Un libro abierto: a la izquierda la portada con sus números y las pestañas; a la derecha las fichas
// (cada pregunta con lo que dijo cada uno y si le atinaron), con su cinta de colores y su categoría.
import './libro.css';
import type { EpisodioShow, ShowCasa } from '../../casa/show_casa';
import { casaShow } from './casa_show';
import { calificar, esAbierta, type Item, nivelConexion, type Resp } from './motor';
import { armar, CATEGORIAS, NOMBRE, pregunta, type Pregunta, type Rol } from './preguntas';
import { textoValor } from './ui';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const otro = (r: Rol): Rol => (r === 'el' ? 'ella' : 'el');
const ROLES: Rol[] = ['el', 'ella'];
const TITULO_TIPO: Record<Pregunta['tipo'], string> = {
  quien: '¿Quién es más probable?',
  prefiere: '¿Qué prefieres?',
  conoce: '¿Cuánto me conoces?',
  termo: 'El termómetro',
  historia: 'Nuestra historia',
  zapato: 'Final relámpago',
};

type Pestaña = 'episodios' | 'dia' | 'sobre' | 'todas';

function fecha(t: number) {
  return new Date(t).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fechaDia(f: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }) : f;
}

/** Lo guardado de una pregunta (sobre `s` en las de conocer). */
function respuestas(show: ShowCasa, p: Pregunta, s?: Rol): Partial<Record<Rol, Resp>> {
  const r: Partial<Record<Rol, Resp>> = {};
  for (const q of ROLES) {
    const x: Resp = {};
    const a = show.r[q][p.id], g = show.g[q][p.id];
    if (p.tipo === 'conoce' || p.tipo === 'termo') {
      if (q === s && a !== undefined) x.a = a;
      if (q !== s && g !== undefined) x.g = g;
    } else {
      if (a !== undefined) x.a = a;
      if (g !== undefined) x.g = g;
    }
    if (x.a !== undefined || x.g !== undefined) r[q] = x;
  }
  return r;
}

function ficha(show: ShowCasa, p: Pregunta, s?: Rol, extra = ''): string {
  const cat = CATEGORIAS[p.cat];
  const item: Item = s ? { id: p.id, s } : { id: p.id };
  const r = respuestas(show, p, s);
  const nota = s ? show.c[otro(s)][p.id] : undefined;
  const res = calificar(p, item, r, nota);
  const marca = (q: Rol) => {
    const a = res.atino[q];
    return a ? `<i class="ok-${a}">${a === 'si' ? '✓' : a === 'casi' ? '≈' : '✗'}</i>` : '';
  };
  const v = (q: Rol, campo: 'a' | 'g') => {
    const x = r[q]?.[campo];
    return x === undefined ? '<em>✉️ todavía no</em>' : esc(textoValor(p, item, x, campo));
  };
  let cuerpo = '';
  switch (p.tipo) {
    case 'quien':
    case 'zapato':
      cuerpo = ROLES.map((q) => `<p data-r="${q}"><b>${NOMBRE[q]}</b> señaló a <span>${v(q, 'a')}</span></p>`).join('');
      break;
    case 'prefiere':
      cuerpo = ROLES.map((q) => `<p data-r="${q}"><b>${NOMBRE[q]}</b> prefiere <span>${v(q, 'a')}</span><small>Creía que ${NOMBRE[otro(q)]}: ${v(q, 'g')} ${marca(q)}</small></p>`).join('');
      break;
    case 'conoce':
    case 'termo': {
      const sujeto = s ?? 'el';
      cuerpo = `<p data-r="${sujeto}"><b>${NOMBRE[sujeto]}</b> dijo <span>${v(sujeto, 'a')}</span></p>
        <p data-r="${otro(sujeto)}"><b>${NOMBRE[otro(sujeto)]}</b> adivinó <span>${v(otro(sujeto), 'g')}</span> ${marca(otro(sujeto))}</p>`;
      break;
    }
    case 'historia':
      cuerpo = ROLES.map((q) => `<p data-r="${q}"><b>${NOMBRE[q]}</b> <span>${v(q, 'a')}</span> ${marca(q)}</p>`).join('') + `<p class="libro-correcta">✔ ${esc(p.o[p.ok])}</p>`;
      break;
  }
  const texto = p.tipo === 'conoce' || p.tipo === 'termo' ? armar(p.t, s ?? 'el') : p.t;
  const sello = res.pendiente && res.con === null ? '<span class="libro-sello sobre">en el sobre</span>' : res.tono === 'bien' ? '<span class="libro-sello bien">♥</span>' : '';
  return `<article class="libro-ficha${esAbierta(p) ? ' abierta' : ''}" style="--cat:${cat.color}">
    <header><span class="libro-chip">${cat.icono} ${cat.nombre}</span><small>${TITULO_TIPO[p.tipo]}</small>${sello}</header>
    <h4>${esc(texto)}</h4>${cuerpo}${extra}</article>`;
}

function episodio(show: ShowCasa, e: EpisodioShow, n: number): string {
  const nivel = nivelConexion(e.c);
  const fichas = e.q
    .map((x) => {
      const [id, suj] = x.split(':');
      const p = pregunta(id);
      return p ? ficha(show, p, suj === 'e' ? 'el' : suj === 'a' ? 'ella' : undefined) : '';
    })
    .join('');
  const modo = e.m === 'linea' ? 'cada uno en su celular' : e.m === 'local' ? 'en el mismo celular' : `${e.de ? NOMBRE[e.de] : 'Uno'} jugó solit${e.de === 'el' ? 'o' : 'a'}`;
  return `<section class="libro-episodio">
    <header class="libro-episodio-cabeza"><span class="libro-cinta">Episodio ${n}</span><b>${fecha(e.t)}</b><small>${modo}</small>
      <div class="libro-episodio-datos"><span data-r="el">Él ${e.p.el}</span><span data-r="ella">Ella ${e.p.ella}</span><span class="con">${e.c}% · ${esc(nivel.nombre)}</span></div></header>
    ${fichas}</section>`;
}

/** Preguntas donde uno ya contestó y el otro todavía no (quedan en el sobre). */
function enElSobre(show: ShowCasa): string[] {
  const html: string[] = [];
  const vistas = new Set<string>();
  for (const q of ROLES) {
    for (const id of [...Object.keys(show.r[q]), ...Object.keys(show.g[q])]) {
      if (vistas.has(id)) continue;
      vistas.add(id);
      const p = pregunta(id);
      if (!p) continue;
      if (p.tipo === 'conoce' || p.tipo === 'termo') {
        for (const s of ROLES) {
          const a = show.r[s][id], g = show.g[otro(s)][id];
          if ((a !== undefined) !== (g !== undefined)) html.push(ficha(show, p, s));
        }
      } else if (p.tipo !== 'historia') {
        const a = show.r.el[id] !== undefined, b = show.r.ella[id] !== undefined;
        if (a !== b) html.push(ficha(show, p));
      }
    }
  }
  return html;
}

export async function abrirLibro(yo: Rol) {
  document.querySelector('#libro')?.remove();
  const raiz = document.createElement('section');
  raiz.id = 'libro';
  raiz.className = 'libro';
  raiz.innerHTML = `<div class="libro-tapa"><div class="libro-cargando">Abriendo el libro…</div></div>`;
  document.body.append(raiz);
  const { show } = await casaShow();
  let pestaña: Pestaña = 'episodios';
  const total = ROLES.reduce((n, q) => n + Object.keys(show.r[q]).length + Object.keys(show.g[q]).length, 0);
  const mejor = show.ep.reduce((m, e) => Math.max(m, e.c), 0);
  const sobre = enElSobre(show);
  const dias = [...show.dias, ...(show.dia && !show.dias.some((d) => d.q === show.dia!.q) ? [show.dia] : [])].reverse();
  const pintar = () => {
    let derecha = '';
    if (pestaña === 'episodios') {
      derecha = show.ep.length
        ? [...show.ep].map((e, i) => ({ e, n: i + 1 })).reverse().map(({ e, n }) => episodio(show, e, n)).join('')
        : '<p class="libro-vacio">Todavía no hay episodios. ¡El primer show los está esperando!</p>';
    } else if (pestaña === 'dia') {
      derecha = dias.length
        ? dias
            .map((d) => {
              const p = pregunta(d.q);
              if (!p) return '';
              const cabeza = `<header class="libro-episodio-cabeza"><span class="libro-cinta dia">Pregunta del día</span><b>${fechaDia(d.f)}</b></header>`;
              if (p.tipo === 'prefiere') return `<section class="libro-episodio">${cabeza}${ficha(show, p)}</section>`;
              return `<section class="libro-episodio">${cabeza}${ficha(show, p, 'el')}${ficha(show, p, 'ella')}</section>`;
            })
            .join('')
        : '<p class="libro-vacio">Aquí van quedando las preguntas del día (están en la nevera de la casa).</p>';
    } else if (pestaña === 'sobre') {
      derecha = sobre.length
        ? `<p class="libro-nota">Lo que uno ya contestó y el otro todavía no: se revela cuando ${NOMBRE[otro(yo)]} juegue (o tú).</p>${sobre.join('')}`
        : '<p class="libro-vacio">El sobre está vacío: ¡todo revelado!</p>';
    } else {
      // Por categoría: todas las preguntas que tienen algo guardado
      const ids = new Set<string>();
      for (const q of ROLES) for (const id of [...Object.keys(show.r[q]), ...Object.keys(show.g[q])]) ids.add(id);
      const porCat = new Map<string, string[]>();
      for (const id of ids) {
        const p = pregunta(id);
        if (!p) continue;
        const lista = porCat.get(p.cat) ?? [];
        if (p.tipo === 'conoce' || p.tipo === 'termo') {
          for (const s of ROLES) if (show.r[s][id] !== undefined || show.g[otro(s)][id] !== undefined) lista.push(ficha(show, p, s));
        } else lista.push(ficha(show, p));
        porCat.set(p.cat, lista);
      }
      derecha = porCat.size
        ? [...porCat.entries()].map(([c, l]) => `<h3 class="libro-cat" style="--cat:${CATEGORIAS[c as keyof typeof CATEGORIAS].color}">${CATEGORIAS[c as keyof typeof CATEGORIAS].icono} ${CATEGORIAS[c as keyof typeof CATEGORIAS].nombre} <small>${l.length}</small></h3>${l.join('')}`).join('')
        : '<p class="libro-vacio">Todavía no hay respuestas guardadas.</p>';
    }
    const tab = (id: Pestaña, texto: string, n?: number) => `<button class="libro-tab" data-tab="${id}" aria-pressed="${pestaña === id}">${texto}${n ? ` <small>${n}</small>` : ''}</button>`;
    raiz.innerHTML = `<div class="libro-tapa">
      <div class="libro-pagina izq">
        <button class="libro-cerrar" aria-label="Cerrar el libro">×</button>
        <div class="libro-portada">
          <span class="libro-corazon"></span>
          <h2>El libro<br><span>de nosotros</span></h2>
          <p>Todo lo que se han contestado en El Show de Nosotros, para releerlo cuando quieran.</p>
          <dl class="libro-numeros"><div><dt>Shows</dt><dd>${show.ep.length}</dd></div><div><dt>Respuestas</dt><dd>${total}</dd></div><div><dt>Mejor conexión</dt><dd>${mejor}%</dd></div></dl>
        </div>
        <nav class="libro-tabs">${tab('episodios', '📺 Episodios', show.ep.length)}${tab('dia', '💌 Del día', dias.length)}${tab('todas', '🗂️ Por categoría')}${tab('sobre', '✉️ En el sobre', sobre.length)}</nav>
      </div>
      <div class="libro-pagina der"><div class="libro-hojas">${derecha}</div></div>
    </div>`;
    raiz.querySelector('.libro-hojas')?.classList.add('pasa');
  };
  pintar();
  raiz.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) return;
    if (b.classList.contains('libro-cerrar')) {
      raiz.classList.add('sale');
      setTimeout(() => raiz.remove(), 300);
    } else if (b.dataset.tab) {
      pestaña = b.dataset.tab as Pestaña;
      pintar();
    }
  });
}
