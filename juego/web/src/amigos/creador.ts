// El creador de personajes de los amigos: el muñeco grande en su estudio (a la izquierda) y el vestidor con
// pestañas (a la derecha): cuerpo y piel, peinado y color de pelo, cara (ojos, cejas, rubor, medias), ropa de
// arriba, de abajo, zapatos, gorros, complementos (gafas, espalda, colitas), joyas y conjuntos completos. Cada
// prenda con sus colores, «al azar», deshacer, poses, zoom y la vista previa de cómo se verá en los juegos.
// Todo sale del clóset genérico (`src/salas/prendas.ts`): nada de la pareja.
import * as sonido from '../sonido';
import { caritaSvg } from '../salas/carita';
import {
  OJOS, PELOS, PIELES, PIELES_FANTASIA, ROPAS, RUBORES, guardarPerfilAmigo, limpiarNombre, aspectoDe, type PerfilAmigo,
} from '../salas/perfil';
import { ARETES, CLAVE, COLLARES, MODELO, MODELOS, piezaDe, valorPieza, type ModeloPrenda, type RanuraAmigo } from '../salas/prendas';
import { CONJUNTOS, alAzar, pintaDe, ponerConjunto } from './conjuntos';
import { Muneco, type Ambiente, type Encuadre } from './muneco';

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

type Pestana = 'cuerpo' | 'pelo' | 'cara' | 'arriba' | 'abajo' | 'pies' | 'cabeza' | 'complementos' | 'joyas' | 'conjuntos';
const PESTANAS: { id: Pestana; ico: string; n: string; enc: Encuadre }[] = [
  { id: 'cuerpo', ico: '🧍', n: 'Cuerpo', enc: 'cuerpo' },
  { id: 'pelo', ico: '💇', n: 'Peinado', enc: 'cara' },
  { id: 'cara', ico: '👀', n: 'Cara', enc: 'cara' },
  { id: 'arriba', ico: '👕', n: 'Arriba', enc: 'arriba' },
  { id: 'abajo', ico: '👖', n: 'Abajo', enc: 'abajo' },
  { id: 'pies', ico: '👟', n: 'Zapatos', enc: 'pies' },
  { id: 'cabeza', ico: '🎩', n: 'Gorros', enc: 'cara' },
  { id: 'complementos', ico: '🕶️', n: 'Más', enc: 'cuerpo' },
  { id: 'joyas', ico: '💎', n: 'Joyas', enc: 'cara' },
  { id: 'conjuntos', ico: '⭐', n: 'Conjuntos', enc: 'cuerpo' },
];

/** Nombres de los grupos dentro de cada categoría. */
const GRUPO: Record<string, string> = {
  corto: 'Cortos', rizado: 'Rizados', recogido: 'Recogidos', largo: 'Largos', gorros: 'Gorros', sombreros: 'Sombreros', brillos: 'Coronas y adornos',
  orejas: 'Orejitas', capuchas: 'Capuchas', gafas: 'Gafas', disfraz: 'Caritas', camisetas: 'Camisetas', abrigos: 'Abrigos', camisas: 'Camisas y sacos',
  oficios: 'Oficios', vestidos: 'Vestidos', enterizos: 'Enterizos', pantalones: 'Pantalones', cortos: 'Cortos', faldas: 'Faldas', zapatos: 'Zapatos',
  botas: 'Botas', pantuflas: 'Pantuflas', capas: 'Capas y mochilas', alas: 'Alas', colas: 'Colitas',
};
/** Cómo se llama cada parte que se pinta. */
const PAPEL: Record<string, string> = {
  principal: 'Color', visera: 'Visera', pompon: 'Pompón', rayas: 'Rayas', cinta: 'Cinta', borde: 'Borde', gemas: 'Gemas', petalos: 'Pétalos', centro: 'Centro',
  dentro: 'Por dentro', puas: 'Púas', crin: 'Crin', escamas: 'Escamas', bellota: 'Bellota', bigotes: 'Bigotes', cachetes: 'Cachetes', cachos: 'Cachos',
  lana: 'Lana', melena: 'Melena', marco: 'Marco', lente: 'Lentes', estampado: 'Estampado', emblema: 'Emblema', liga: 'Liga', lazo: 'Lazo', detalle: 'Detalle',
  botones: 'Botones', cuadros: 'Cuadros', costura: 'Costuras', cordones: 'Cordones', cordon: 'Cordón', suela: 'Suela', adorno: 'Adornos', cremallera: 'Cremallera',
  camisa: 'Camisa', corbata: 'Corbata', negro: 'Detalles', panza: 'Pancita', medias: 'Patitas', campana: 'Campana', alas: 'Alitas', franja: 'Franja',
  interior: 'Por dentro', almohadillas: 'Almohadillas', broche: 'Broche', garras: 'Garras', punta: 'Puntica', borla: 'Borla',
};
const ICONO_JOYA: Record<string, string> = {
  boton: '🔘', perla: '⚪', argolla: '⭕', argolla_grande: '🟡', corazon: '❤️', estrella: '⭐', luna: '🌙', gota: '💧', flor: '🌸', cereza: '🍒', rayo: '⚡',
  diamante: '💎', perlas: '📿', cadena: '⛓️', gema: '🔮', gargantilla: '🎀', flores: '🌺', medalla: '🏅', bolitas: '🔵',
};
const NOMBRE_VISTA: Record<Ambiente | 'sala', string> = { estudio: '📷 Estudio', sala: '👥 Salas', lavado: '🫧 Lavado', sangre: '🌙 Sangre' };

export interface OpcionesCreador {
  raiz: HTMLElement;
  perfil: PerfilAmigo;
  /** Ya tenía su muñeco (está editándolo): «Volver» deja todo como estaba. */
  yaEra: boolean;
  /** Se puede volver atrás la primera vez (en la versión de la pareja: a «¿Quién eres?»). */
  puedeVolver: boolean;
  alListo: (p: PerfilAmigo) => void;
  alVolver: () => void;
}

export interface Creador {
  liberar(): void;
  /** Para las pruebas. */
  perfil(): PerfilAmigo;
  muneco(): Muneco | null;
}

export function abrirCreador(o: OpcionesCreador): Creador {
  let perfil: PerfilAmigo = structuredClone(o.perfil);
  let pestana: Pestana = 'cuerpo';
  /** Sub-ranura de «Más» (gafas, espalda o colita) y grupo escogido en cada ranura. */
  let mas: RanuraAmigo = 'cara';
  const grupo: Partial<Record<RanuraAmigo, string>> = {};
  let vista: Ambiente | 'sala' = 'estudio';
  const deshacer: string[] = [];
  let muneco: Muneco | null = null;

  o.raiz.innerHTML = `<section class="am-creador">
    <div class="am-escenario">
      <canvas class="am-lienzo" aria-label="Tu muñeco: arrástralo para darle la vuelta"></canvas>
      <div class="am-vistas" role="tablist" aria-label="Vista previa">${(['estudio', 'sala', 'lavado', 'sangre'] as const)
        .map((v) => `<button type="button" role="tab" data-vista="${v}" class="${v === 'estudio' ? 'si' : ''}">${NOMBRE_VISTA[v]}</button>`).join('')}</div>
      <div class="am-tarjeta-sala" hidden></div>
      <p class="am-pie-vista" hidden></p>
      <div class="am-herr">
        <button type="button" data-h="azar" title="Al azar">🎲<span>Al azar</span></button>
        <button type="button" data-h="deshacer" title="Deshacer" aria-label="Deshacer" disabled>↶</button>
        <button type="button" data-h="pose" title="Una pose" aria-label="Una pose">💃</button>
        <button type="button" data-h="mas" title="Acercar">＋</button>
        <button type="button" data-h="menos" title="Alejar">－</button>
      </div>
    </div>
    <form class="am-panel" autocomplete="off">
      <div class="am-cabeza">
        ${o.yaEra || o.puedeVolver ? `<button type="button" class="am-volver" data-a="volver" aria-label="Volver">←</button>` : ''}
        <label class="am-nombre"><span>¿Cómo te llamas?</span>
          <input name="nombre" maxlength="16" placeholder="Tu nombre" value="${esc(perfil.nombre === 'Amigo' && !o.yaEra ? '' : perfil.nombre)}" enterkeyhint="done"></label>
        <button type="submit" class="boton boton-tomate am-listo">¡Listo!</button>
      </div>
      <p class="am-error" role="status"></p>
      <nav class="am-tabs" role="tablist">${PESTANAS.map((t) => `<button type="button" role="tab" data-tab="${t.id}" class="${t.id === pestana ? 'si' : ''}"><i>${t.ico}</i>${t.n}</button>`).join('')}</nav>
      <div class="am-contenido"></div>
    </form>
  </section>`;
  const sec = o.raiz.querySelector<HTMLElement>('.am-creador')!;
  const form = sec.querySelector('form')!;
  const contenido = sec.querySelector<HTMLElement>('.am-contenido')!;
  const input = form.querySelector<HTMLInputElement>('input[name="nombre"]')!;

  // ---------------------------------------------------------------------------------------- El muñeco
  const lienzo = sec.querySelector('canvas')!;
  try {
    muneco = new Muneco(lienzo);
    muneco.alTocar = () => muneco?.siguientePose();
    void muneco.poner(aspectoDe(perfil), false).catch((e) => console.error(e));
    muneco.arrancar();
  } catch (e) {
    console.error(e);
    lienzo.insertAdjacentHTML('afterend', `<div class="am-carita-grande">${caritaSvg(aspectoDe(perfil), 180, 'feliz')}</div>`);
  }
  const verMuneco = () => {
    void muneco?.poner(aspectoDe(perfil)).catch(() => undefined);
    const c = sec.querySelector('.am-carita-grande');
    if (c) c.innerHTML = caritaSvg(aspectoDe(perfil), 180, 'feliz');
    if (vista === 'sala') pintarTarjetaSala();
  };

  // ---------------------------------------------------------------------------------------- Cambios
  function cambiar(nuevo: PerfilAmigo, nota = 660) {
    deshacer.push(JSON.stringify(perfil));
    if (deshacer.length > 60) deshacer.shift();
    perfil = nuevo;
    sonido.activar();
    sonido.nota(nota, 0.07, 0, 'sine', 0.045);
    sec.querySelector<HTMLButtonElement>('[data-h="deshacer"]')!.disabled = false;
    verMuneco();
    pintar();
  }
  const conTraje = (cambios: Record<string, string | null>) => {
    const t = { ...perfil.traje };
    for (const [k, v] of Object.entries(cambios)) {
      if (v === null || v === '') delete t[k];
      else t[k] = v;
    }
    return { ...perfil, traje: t };
  };

  /** Pone (o quita, con '') una prenda; si es la misma, conserva sus colores. */
  function ponerPrenda(r: RanuraAmigo, m: string) {
    const k = CLAVE[r];
    if (!m) return cambiar(conTraje({ [k]: null }));
    const actual = perfil.traje[k]?.split('#')[0];
    if (actual === m) return;
    const d = MODELO[m];
    const cambios: Record<string, string | null> = { [k]: m };
    // Un vestido o un enterizo ocupa también abajo: se quita lo de abajo
    for (const otra of d.t ?? []) if (otra !== r) cambios[CLAVE[otra]] = null;
    // Y si arriba había un vestido y ahora se escoge algo de abajo, el vestido se va
    if (r === 'abajo') {
      const arriba = piezaDe(perfil.traje.arriba, 'arriba', perfil.cuerpo);
      if (arriba?.tambien.includes('abajo')) cambios.arriba = null;
    }
    cambiar(conTraje(cambios), 740);
  }

  /** Cambia un color: piel, pelo, de la ropa de fábrica, de una prenda (1 o 2), de la cara o de una joya. */
  function ponerColor(k: string, c: string) {
    if (k === 'piel' || k === 'pelo' || k === 'ropa' || k === 'ropa2' || k === 'zapatos') return cambiar({ ...perfil, [k]: c });
    const [que, clave] = k.split(':');
    if (que === 't') return cambiar(conTraje({ [clave]: c }));
    if (que === 'p1' || que === 'p2') {
      const [m, c1 = '', c2 = ''] = (perfil.traje[clave] ?? '').split('#');
      if (!m) return;
      const a = que === 'p1' ? c : c1 ? `#${c1}` : null;
      const b = que === 'p2' ? c : c2 ? `#${c2}` : null;
      return cambiar(conTraje({ [clave]: valorPieza(m, a, b) }));
    }
    if (que === 'j') {
      const tipo = (perfil.traje[clave] ?? '').split('#')[0];
      if (tipo) cambiar(conTraje({ [clave]: `${tipo}${c ? `#${c.slice(1)}` : ''}` }));
    }
  }

  // ---------------------------------------------------------------------------------------- Pintar el panel
  const muestras = (k: string, lista: string[], actual: string | undefined, titulo: string, extra = '') =>
    `<div class="am-fila" role="radiogroup" aria-label="${titulo}"><span>${titulo}</span><div class="am-muestras">${extra}${lista
      .map((c) => `<button type="button" class="am-muestra ${actual?.toLowerCase() === c ? 'si' : ''}" data-k="${k}" data-c="${c}" style="--m:${c}" role="radio" aria-checked="${actual?.toLowerCase() === c}" aria-label="${titulo} ${c}"></button>`)
      .join('')}<label class="am-otro" title="Otro color"><input type="color" data-k="${k}" value="${actual && /^#[0-9a-f]{6}$/i.test(actual) ? actual : '#ffffff'}"><span>🎨</span></label></div></div>`;
  const opcion = (k: string, v: string, texto: string, si: boolean) =>
    `<button type="button" class="am-opcion ${si ? 'si' : ''}" data-k="${k}" data-c="${v}">${texto}</button>`;

  /** La rejilla de prendas de una ranura (con sus grupos y los colores de la puesta). */
  function rejilla(r: RanuraAmigo, quitar: string, fabrica?: { k: 'ropa' | 'ropa2' | 'zapatos'; n: string }) {
    const lista = MODELOS.filter((m) => m.r === r && m.para.includes(perfil.cuerpo));
    const grupos = [...new Set(lista.map((m) => m.g))];
    const g = grupo[r] && grupos.includes(grupo[r]!) ? grupo[r]! : '';
    const puesta = piezaDe(perfil.traje[CLAVE[r]], r, perfil.cuerpo);
    // Si arriba hay un vestido o un enterizo, abajo no se ve
    const tapada = r === 'abajo' && !!piezaDe(perfil.traje.arriba, 'arriba', perfil.cuerpo)?.tambien.includes('abajo');
    const tarjeta = (m: ModeloPrenda) => `<button type="button" class="am-prenda ${puesta?.modelo === m.m ? 'si' : ''}" data-r="${r}" data-m="${m.m}" title="${m.n}">
      <img src="./modelos/iconos/ropa_${m.i}_${perfil.cuerpo}.webp" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><b>${m.n}</b></button>`;
    const base = `<button type="button" class="am-prenda nada ${puesta ? '' : 'si'}" data-r="${r}" data-m=""><span class="ico">${fabrica ? '✨' : '🚫'}</span><b>${fabrica ? fabrica.n : quitar}</b></button>`;
    const d = puesta ? MODELO[puesta.modelo] : null;
    let colores = '';
    if (d) {
      const pp = d.pp ?? [];
      const [, c1 = '', c2 = ''] = (perfil.traje[CLAVE[r]] ?? '').split('#');
      const presets = (d.mu ?? []).filter(([a, b]) => a || b);
      const presetsHtml = presets.length
        ? `<div class="am-fila"><span>Del clóset</span><div class="am-muestras">${presets
            .map(([a, b]) => `<button type="button" class="am-duo" data-r="${r}" data-duo="${a ?? ''}|${b ?? ''}" style="--a:${a ?? '#ddd'};--b:${b ?? a ?? '#ddd'}" aria-label="Combinación"></button>`)
            .join('')}</div></div>`
        : '';
      if (r === 'pelo') {
        colores = muestras('pelo', PELOS, perfil.pelo, 'Color del pelo') + (pp[1] ? muestras(`p2:${CLAVE[r]}`, ROPAS, c2 ? `#${c2}` : undefined, PAPEL[pp[1]] ?? pp[1]) : '');
      } else {
        colores = presetsHtml + (pp[0] ? muestras(`p1:${CLAVE[r]}`, ROPAS, c1 ? `#${c1}` : undefined, PAPEL[pp[0]] ?? 'Color') : '') +
          (pp[1] ? muestras(`p2:${CLAVE[r]}`, ROPAS, c2 ? `#${c2}` : undefined, PAPEL[pp[1]] ?? pp[1]) : '');
      }
    } else if (fabrica) colores = muestras(fabrica.k, ROPAS, perfil[fabrica.k], 'Color');
    else if (r === 'pelo') colores = muestras('pelo', PELOS, perfil.pelo, 'Color del pelo');
    return `${tapada ? '<p class="am-nota">👗 Con el vestido o el enterizo que tienes puesto, abajo no se ve. Si escoges algo aquí, se lo quitas.</p>' : ''}
      ${grupos.length > 1 ? `<div class="am-grupos">${['', ...grupos].map((x) => `<button type="button" data-g="${x}" data-r="${r}" class="${x === g ? 'si' : ''}">${x ? GRUPO[x] ?? x : 'Todo'}</button>`).join('')}</div>` : ''}
      <div class="am-rejilla">${base}${lista.filter((m) => !g || m.g === g).map(tarjeta).join('')}</div>
      <div class="am-colores">${colores}</div>`;
  }

  function pintar() {
    const arriba = contenido.scrollTop;
    let html = '';
    const t = perfil.traje;
    switch (pestana) {
      case 'cuerpo':
        html = `<div class="am-fila"><span>Molde</span><div class="am-cuerpos">
            ${(['el', 'ella'] as const).map((c) => `<button type="button" class="am-cuerpo ${perfil.cuerpo === c ? 'si' : ''}" data-cuerpo="${c}">${caritaSvg({ ...aspectoDe(perfil), cuerpo: c, detalles: {} }, 44)}<b>${c === 'el' ? 'Molde de Javier' : 'Molde de Laura'}</b><small>${c === 'el' ? 'Pelo corto, más grandote' : 'Pelo largo, con medias'}</small></button>`).join('')}
          </div></div>
          ${muestras('piel', PIELES, perfil.piel, 'Tono de piel')}
          ${muestras('piel', PIELES_FANTASIA, perfil.piel, 'De fantasía')}`;
        break;
      case 'pelo':
        html = rejilla('pelo', 'Como viene');
        break;
      case 'cara':
        html = `${muestras('t:ojos', OJOS, t.ojos, 'Ojos')}
          ${muestras('t:cejas', PELOS, t.cejas, 'Cejas', opcion('t:cejas', '', 'Como el pelo', !t.cejas) + opcion('t:cejas', 'no', 'Sin cejas', t.cejas === 'no'))}
          ${muestras('t:rubor', RUBORES, t.rubor, 'Cachetes', opcion('t:rubor', '', 'Normales', !t.rubor) + opcion('t:rubor', 'no', 'Sin rubor', t.rubor === 'no'))}
          ${perfil.cuerpo === 'ella' ? muestras('t:medias', ROPAS, t.medias, 'Medias', opcion('t:medias', '', 'Como el short', !t.medias) + opcion('t:medias', 'no', 'Sin medias', t.medias === 'no')) : ''}`;
        break;
      case 'arriba':
        html = rejilla('arriba', '', { k: 'ropa', n: 'Camiseta básica' });
        break;
      case 'abajo':
        html = rejilla('abajo', '', { k: 'ropa2', n: perfil.cuerpo === 'ella' ? 'Short básico' : 'Pantalón básico' });
        break;
      case 'pies':
        html = rejilla('pies', '', { k: 'zapatos', n: 'Tenis básicos' });
        break;
      case 'cabeza':
        html = rejilla('cabeza', 'Nada');
        break;
      case 'complementos':
        html = `<div class="am-grupos sub">${([['cara', '🕶️ Gafas y caritas'], ['espalda', '🪽 Espalda'], ['cola', '🐾 Colitas']] as const)
          .map(([r, n]) => `<button type="button" data-mas="${r}" class="${mas === r ? 'si' : ''}">${n}</button>`).join('')}</div>${rejilla(mas, 'Nada')}`;
        break;
      case 'joyas': {
        const joya = (k: 'aretes' | 'collar', lista: Record<string, { n: string; c: string }>, nada: string) => {
          const [tipo, c] = (t[k] ?? '').split('#');
          return `<div class="am-rejilla joyas"><button type="button" class="am-prenda nada ${tipo ? '' : 'si'}" data-joya="${k}" data-tipo=""><span class="ico">🚫</span><b>${nada}</b></button>
            ${Object.entries(lista).map(([id, j]) => `<button type="button" class="am-prenda ${tipo === id ? 'si' : ''}" data-joya="${k}" data-tipo="${id}"><span class="ico">${ICONO_JOYA[id] ?? '✨'}</span><b>${j.n}</b></button>`).join('')}</div>
            ${tipo ? muestras(`j:${k}`, ['#f2c14e', '#dfe6f2', '#e8b4a0', ...ROPAS.slice(0, 15)], c ? `#${c}` : lista[tipo]?.c, 'Color') : ''}`;
        };
        html = `<h3 class="am-sub">Aretes</h3>${joya('aretes', ARETES, 'Sin aretes')}<h3 class="am-sub">Collares</h3>${joya('collar', COLLARES, 'Sin collar')}`;
        break;
      }
      case 'conjuntos':
        html = `<p class="am-nota">Un toque y quedas vestido de pies a cabeza (después le cambias lo que quieras).</p>
          <div class="am-rejilla conjuntos">${CONJUNTOS.map((c) => `<button type="button" class="am-prenda conjunto" data-conjunto="${c.id}"><span class="ico">${c.ico}</span><b>${c.n}</b><small>${Object.keys(pintaDe(c, perfil.cuerpo)).filter((k) => !['aretes', 'collar'].includes(k)).length} prendas</small></button>`).join('')}</div>`;
        break;
    }
    contenido.innerHTML = html;
    contenido.scrollTop = arriba;
  }

  function irA(p: Pestana) {
    pestana = p;
    form.querySelectorAll<HTMLElement>('.am-tabs [data-tab]').forEach((b) => b.classList.toggle('si', b.dataset.tab === p));
    form.querySelector<HTMLElement>(`.am-tabs [data-tab="${p}"]`)?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    contenido.scrollTop = 0;
    enfocar();
    pintar();
  }
  function enfocar() {
    const t = PESTANAS.find((x) => x.id === pestana)!;
    muneco?.enfocar(pestana === 'complementos' && mas === 'cara' ? 'cara' : t.enc);
    // La espalda y la colita se ven de espaldas
    if (pestana === 'complementos' && mas !== 'cara') muneco?.mirarAtras();
  }

  // ---------------------------------------------------------------------------------------- Vista previa
  function pintarTarjetaSala() {
    const t = sec.querySelector<HTMLElement>('.am-tarjeta-sala')!;
    const nombre = esc(limpiarNombre(input.value) || 'Tú');
    t.innerHTML = `<div class="am-ts-puesto"><b class="num">2</b><span class="cara">${caritaSvg(aspectoDe(perfil), 64, 'feliz')}</span><span class="txt"><b>${nombre}</b><small>✔ ¡Listo!</small></span></div>
      <div class="am-ts-chips"><span class="chip">${caritaSvg(aspectoDe(perfil), 26, 'feliz')}<b>${nombre}</b></span><span class="chip">${caritaSvg(aspectoDe(perfil), 26, 'triste')}<b>¡${nombre} cayó!</b></span></div>`;
  }
  function verVista(v: Ambiente | 'sala') {
    vista = v;
    sec.querySelectorAll<HTMLElement>('.am-vistas [data-vista]').forEach((b) => b.classList.toggle('si', b.dataset.vista === v));
    const tarjeta = sec.querySelector<HTMLElement>('.am-tarjeta-sala')!;
    const pie = sec.querySelector<HTMLElement>('.am-pie-vista')!;
    tarjeta.hidden = v !== 'sala';
    if (v === 'sala') pintarTarjetaSala();
    muneco?.ambiente(v === 'sala' ? 'estudio' : v);
    pie.hidden = v === 'estudio' || v === 'sala';
    pie.textContent = v === 'lavado'
      ? 'Así te ves en Lavarse la cara: con el disfraz inicial vas con tu ropa; con los otros, tu cara y tu pelo con el disfraz.'
      : v === 'sangre' ? 'En Sangre y Ceniza llevas el traje de tu clase encima; tu cara, tu piel, tu pelo y tu peinado se quedan.' : '';
    sec.classList.toggle('vista-juego', v === 'lavado' || v === 'sangre');
  }

  // ---------------------------------------------------------------------------------------- Toques
  sec.addEventListener('click', (e) => {
    const x = e.target as HTMLElement;
    const b = <T extends HTMLElement = HTMLElement>(sel: string) => x.closest<T>(sel);
    sonido.activar();
    const tab = b('[data-tab]');
    if (tab) return irA(tab.dataset.tab as Pestana);
    const v = b('[data-vista]');
    if (v) return verVista(v.dataset.vista as Ambiente | 'sala');
    const h = b<HTMLButtonElement>('[data-h]');
    if (h) {
      if (h.dataset.h === 'azar') {
        cambiar(alAzar(perfil, true), 880);
        muneco?.siguientePose();
      } else if (h.dataset.h === 'deshacer' && deshacer.length) {
        perfil = JSON.parse(deshacer.pop()!);
        h.disabled = !deshacer.length;
        sonido.nota(440, 0.07, 0, 'sine', 0.04);
        verMuneco();
        pintar();
      } else if (h.dataset.h === 'pose') muneco?.siguientePose();
      else if (h.dataset.h === 'mas') muneco?.acercar(0.8);
      else if (h.dataset.h === 'menos') muneco?.acercar(1.25);
      return;
    }
    const cu = b('[data-cuerpo]');
    if (cu) {
      const c = cu.dataset.cuerpo as 'el' | 'ella';
      if (c === perfil.cuerpo) return;
      // Las prendas que no le sirven al otro molde se quitan (los peinados son de cada molde)
      const traje: Record<string, string> = {};
      for (const [k, val] of Object.entries(perfil.traje)) {
        const r = (Object.keys(CLAVE) as RanuraAmigo[]).find((ra) => CLAVE[ra] === k);
        if (!r || piezaDe(val, r, c)) traje[k] = val;
      }
      if (c === 'el') delete traje.medias;
      return cambiar({ ...perfil, cuerpo: c, traje }, 520);
    }
    const pr = b('[data-r][data-m]');
    if (pr) return ponerPrenda(pr.dataset.r as RanuraAmigo, pr.dataset.m ?? '');
    const g = b('[data-g]');
    if (g) {
      grupo[g.dataset.r as RanuraAmigo] = g.dataset.g ?? '';
      return pintar();
    }
    const ms = b('[data-mas]');
    if (ms) {
      mas = ms.dataset.mas as RanuraAmigo;
      enfocar();
      return pintar();
    }
    const duo = b('[data-duo]');
    if (duo) {
      const r = duo.dataset.r as RanuraAmigo;
      const [a, c2] = (duo.dataset.duo ?? '|').split('|');
      const m = (perfil.traje[CLAVE[r]] ?? '').split('#')[0];
      if (m) return cambiar(conTraje({ [CLAVE[r]]: valorPieza(m, a || null, c2 || null) }));
      return;
    }
    const col = b('[data-k][data-c]');
    if (col) {
      const k = col.dataset.k!;
      const c = col.dataset.c ?? '';
      if (k.startsWith('t:')) return cambiar(conTraje({ [k.slice(2)]: c || null }));
      return ponerColor(k, c);
    }
    const joya = b('[data-joya]');
    if (joya) return cambiar(conTraje({ [joya.dataset.joya!]: joya.dataset.tipo || null }), 990);
    const cj = b('[data-conjunto]');
    if (cj) {
      const c = CONJUNTOS.find((x) => x.id === cj.dataset.conjunto);
      if (c) {
        cambiar(ponerConjunto(perfil, c), 880);
        muneco?.hacer('presumir_a', 'presumir_b', 'presumido', 2);
      }
      return;
    }
    const a = b('[data-a]');
    if (a?.dataset.a === 'volver') o.alVolver();
  });
  // El selector de «otro color» (se aplica al soltarlo, para no llenar el deshacer)
  sec.addEventListener('change', (e) => {
    const i = e.target as HTMLInputElement;
    if (i.type === 'color' && i.dataset.k) ponerColor(i.dataset.k, i.value.toLowerCase());
  });
  input.addEventListener('input', () => {
    perfil.nombre = input.value;
    form.querySelector('.am-error')!.textContent = '';
    if (vista === 'sala') pintarTarjetaSala();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = limpiarNombre(input.value);
    if (!nombre) {
      form.querySelector('.am-error')!.textContent = '¿Cómo te llamas? Así te ven los demás en las salas.';
      input.focus();
      return;
    }
    perfil = { ...perfil, nombre, activo: true };
    guardarPerfilAmigo(perfil);
    sonido.nota(784, 0.12, 0, 'triangle', 0.06);
    o.alListo(perfil);
  });

  pintar();
  return {
    liberar() {
      muneco?.liberar();
      muneco = null;
    },
    perfil: () => perfil,
    muneco: () => muneco,
  };
}
