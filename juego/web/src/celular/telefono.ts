// El teléfono encontrado: la carcasa (cada uno con su personalidad), la pantalla de bloqueo, el inicio con sus apps y
// cada app por dentro (mensajes, fotos, notas, grabadora, llamadas, mapa, correo o bitácora, calendario, linterna y
// las señas de luz). Todo lo que se abre puede anotar una pista en la libreta.
import { efecto, hayVoz, pararVoz, segundosVoz, sonarVoz } from './audio';
import { candado } from './candado';
import { COLOR_APP, ICONO, NOMBRE_APP } from './iconos';
import type { ProgresoCaso } from './progreso';
import type { Candado, Caso, Contacto, Foto, IdApp, Voz } from './tipos';

export const foto = (id: string) => `./celular/fotos/${id}.jpg`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const br = (s: string) => esc(s).replace(/\n/g, '<br>');

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export interface Ganchos {
  /** Anota una pista (si no estaba). */
  anotar(id: string | undefined): void;
  /** Se abrió un candado. */
  abierto(id: string): void;
  /** Algo pasó (para el tutorial): 'despertar', 'desbloqueo', 'app:mensajes', 'voz', 'candado:x'… */
  evento(nombre: string): void;
  guardar(): void;
}

export class Telefono {
  readonly raiz: HTMLElement;
  private pantalla: HTMLElement;
  private capa: HTMLElement;
  private linterna = false;
  private app: IdApp | null = null;
  private pila: (() => void)[] = [];
  private reloj = 0;

  constructor(readonly caso: Caso, readonly p: ProgresoCaso, readonly g: Ganchos) {
    const t = caso.telefono;
    this.raiz = el('div', `cel-tel carcasa-${t.carcasa} ${t.oscuro ? 'oscuro' : 'claro'}`);
    this.raiz.style.setProperty('--acento', t.acento);
    if (t.letra) this.raiz.style.setProperty('--letra-tel', t.letra);
    this.raiz.innerHTML = `<div class="cel-tel-borde"><div class="cel-tel-camara"></div><div class="cel-tel-boton"></div></div><div class="cel-tel-vidrio"><div class="cel-pantalla"></div><div class="cel-tel-capa"></div><div class="cel-tel-reflejo"></div></div>`;
    this.pantalla = this.raiz.querySelector('.cel-pantalla')!;
    this.capa = this.raiz.querySelector('.cel-tel-capa')!;
    if (t.carcasa === 'roto') this.raiz.querySelector('.cel-tel-vidrio')!.insertAdjacentHTML('beforeend', '<svg class="cel-grieta" viewBox="0 0 100 60" preserveAspectRatio="none"><path d="M78 0 L72 14 L80 22 L70 34 L74 60 M72 14 L60 18 L52 12 M80 22 L92 26 L100 22 M70 34 L58 40 L50 52" /></svg>');
    if (this.p.abiertos.includes('bloqueo')) this.inicio(); else this.bloqueo();
  }

  // ------------------------------------------------------------------ partes comunes

  private barra(oscuraSobreFoto = false) {
    const t = this.caso.telefono;
    const b = el('div', `cel-barra ${oscuraSobreFoto ? 'sobre-foto' : ''}`);
    b.innerHTML = `<span class="op">${ICONO.senal}${esc(t.operador)}</span><span class="hora">${esc(t.hora)}</span><span class="bat ${t.bateria < 20 ? 'baja' : ''}">${t.bateria}%<i style="--b:${t.bateria}%"></i></span>`;
    return b;
  }

  private contacto(id: string): Contacto {
    return this.caso.contactos.find((c) => c.id === id) ?? { id, nombre: id === 'yo' ? this.caso.dueno : id, color: '#888' };
  }

  private avatar(c: Contacto, cls = '') {
    const a = el('span', `cel-avatar ${cls}`);
    if (c.foto) a.style.backgroundImage = `url(${foto(c.foto)})`;
    else { a.style.background = c.color; a.textContent = c.nombre.replace(/^(Doña|Don|Doctor)\s+/, '').charAt(0); }
    return a;
  }

  private abierto(id: string) {
    return id === '' || this.p.abiertos.includes(id);
  }

  private candadoDe(id: string): Candado | undefined {
    return this.caso.candados.find((c) => c.id === id);
  }

  /** Muestra un candado de adentro encima de la pantalla. */
  private pedir(id: string, luego: () => void) {
    const c = this.candadoDe(id);
    if (!c) return luego();
    this.g.evento('candado:' + id);
    const capa = el('div', 'cel-sobre');
    this.pantalla.append(capa);
    const cerrar = () => { capa.remove(); this.pila.pop(); };
    this.pila.push(() => capa.remove());
    candado(capa, c, {
      alAbrir: () => { cerrar(); this.g.abierto(c.id); this.g.anotar(c.pista); luego(); },
      alCancelar: cerrar,
    });
  }

  /** Para el botón «atrás»: true si cerró algo. */
  atras(): boolean {
    pararVoz();
    const f = this.pila.pop();
    if (f) { f(); return true; }
    if (this.app) { this.inicio(); return true; }
    return false;
  }

  // ------------------------------------------------------------------ pantalla de bloqueo

  private bloqueo() {
    const t = this.caso.telefono;
    this.app = null;
    this.pila = [];
    const s = el('div', 'cel-bloqueo');
    s.style.backgroundImage = `url(${foto(t.fondo)})`;
    s.append(this.barra(true));
    const reloj = el('div', 'cel-bloqueo-reloj', `<b>${esc(t.hora)}</b><span>${esc(t.fecha)}</span>`);
    const avisos = el('div', 'cel-bloqueo-avisos');
    for (const a of t.avisos) {
      const n = el('div', 'cel-aviso');
      n.innerHTML = `<i style="background:${COLOR_APP[a.app]}">${ICONO[a.app === 'correo' ? (t.nombreCorreo?.startsWith('Bit') ? 'bitacora' : 'correo') : a.app]}</i><div><b>${esc(a.titulo)}</b><span>${esc(a.texto)}</span></div><small>${esc(a.t)}</small>`;
      avisos.append(n);
    }
    const desliza = el('div', 'cel-bloqueo-abrir', `${ICONO.candado}<span>Toca para desbloquear</span>`);
    s.append(reloj, avisos, desliza);
    s.onclick = () => {
      if (s.querySelector('.cel-candado')) return;
      this.g.evento('despertar');
      s.classList.add('pidiendo');
      const c = candado(s, this.caso.bloqueo, {
        alAbrir: () => { this.g.abierto('bloqueo'); this.g.anotar(this.caso.bloqueo.pista); this.g.evento('desbloqueo'); this.inicio(); },
        alCancelar: () => { c.remove(); s.classList.remove('pidiendo'); this.pila.pop(); },
      });
      this.pila.push(() => { c.remove(); s.classList.remove('pidiendo'); });
    };
    this.pantalla.replaceChildren(s);
  }

  // ------------------------------------------------------------------ inicio

  private noLeidos(app: IdApp) {
    const v = this.p.vistos;
    if (app === 'mensajes') return this.caso.chats.filter((c) => !v.includes('chat:' + c.con)).length;
    if (app === 'llamadas') return v.includes('app:llamadas') ? 0 : this.caso.llamadas.filter((l) => l.tipo === 'perdida').length;
    if (app === 'fotos') return v.includes('app:fotos') ? 0 : 0;
    return 0;
  }

  inicio() {
    pararVoz();
    this.app = null;
    this.pila = [];
    const t = this.caso.telefono;
    const s = el('div', 'cel-inicio');
    s.style.backgroundImage = `url(${foto(t.fondo)})`;
    s.append(this.barra(true));
    const rejilla = el('div', 'cel-apps');
    for (const app of this.caso.apps) {
      const b = el('button', 'cel-app');
      b.dataset.app = app;
      const n = this.noLeidos(app);
      const nombre = app === 'correo' ? t.nombreCorreo ?? 'Correo' : NOMBRE_APP[app];
      const icono = app === 'correo' && t.nombreCorreo?.startsWith('Bit') ? ICONO.bitacora : ICONO[app];
      b.innerHTML = `<i style="background:${COLOR_APP[app]}" class="${app === 'linterna' && this.linterna ? 'prendida' : ''}">${icono}${n ? `<em>${n}</em>` : ''}</i><span>${esc(nombre)}</span>`;
      b.onclick = () => { efecto('pop', 0.25); this.abrir(app); };
      rejilla.append(b);
    }
    s.append(rejilla, el('div', 'cel-inicio-dueno', `<small>Teléfono de</small> ${esc(this.caso.dueno)} · <small>${esc(t.modelo)}</small>`));
    this.pantalla.replaceChildren(s);
    this.aplicarLinterna();
  }

  /** Marco de una app: barra de estado, encabezado con atrás y el cuerpo. */
  private marco(app: IdApp, titulo: string): HTMLElement {
    const s = el('div', `cel-app-vista app-${app}`);
    s.append(this.barra());
    const cab = el('div', 'cel-cab');
    const atras = el('button', 'cel-atras', ICONO.atras);
    atras.onclick = () => this.atras();
    const h = el('b', '', esc(titulo));
    cab.append(atras, h);
    const cuerpo = el('div', 'cel-cuerpo');
    s.append(cab, cuerpo);
    this.pantalla.replaceChildren(s);
    return cuerpo;
  }

  abrir(app: IdApp) {
    pararVoz();
    this.app = app;
    this.pila = [];
    this.g.evento('app:' + app);
    if (!this.p.vistos.includes('app:' + app)) { this.p.vistos.push('app:' + app); this.g.guardar(); }
    const t = this.caso.telefono;
    const titulo = app === 'correo' ? t.nombreCorreo ?? 'Correo' : NOMBRE_APP[app];
    const cuerpo = this.marco(app, titulo);
    ({
      mensajes: () => this.appMensajes(cuerpo),
      fotos: () => this.appFotos(cuerpo),
      notas: () => this.appNotas(cuerpo),
      grabadora: () => this.appGrabadora(cuerpo),
      llamadas: () => this.appLlamadas(cuerpo),
      mapa: () => this.appMapa(cuerpo),
      correo: () => this.appCorreo(cuerpo),
      calendario: () => this.appCalendario(cuerpo),
      linterna: () => this.appLinterna(cuerpo),
      senas: () => this.appSenas(cuerpo),
    })[app]();
    this.aplicarLinterna();
  }

  // ------------------------------------------------------------------ mensajes

  private appMensajes(cuerpo: HTMLElement) {
    cuerpo.classList.add('dos-paneles');
    const lista = el('div', 'cel-lista');
    const conv = el('div', 'cel-conv', '<div class="cel-vacio">Escoge una conversación</div>');
    const pintarLista = (activo?: string) => {
      lista.replaceChildren();
      for (const ch of this.caso.chats) {
        const c = this.contacto(ch.con);
        const ult = ch.mensajes[ch.mensajes.length - 1];
        const b = el('button', `cel-fila-chat ${activo === ch.con ? 'activo' : ''}`);
        b.dataset.chat = ch.con;
        const nuevo = !this.p.vistos.includes('chat:' + ch.con);
        b.append(this.avatar(c));
        b.insertAdjacentHTML('beforeend', `<div><b>${esc(ch.grupo ?? c.nombre)}</b><span>${ult.voz ? '🎤 Nota de voz' : ult.foto ? '📷 Foto' : esc(ult.texto ?? '')}</span></div><small>${esc(ult.t)}${nuevo && ch.noLeidos ? `<em>${ch.noLeidos}</em>` : ''}</small>`);
        b.onclick = () => { abrirChat(ch.con); };
        lista.append(b);
      }
    };
    const abrirChat = (id: string) => {
      const ch = this.caso.chats.find((x) => x.con === id)!;
      pararVoz();
      if (!this.p.vistos.includes('chat:' + id)) { this.p.vistos.push('chat:' + id); this.g.guardar(); }
      pintarLista(id);
      conv.replaceChildren();
      const c = this.contacto(ch.con);
      const cab = el('div', 'cel-conv-cab');
      cab.append(this.avatar(c, 'chico'));
      cab.insertAdjacentHTML('beforeend', `<div><b>${esc(ch.grupo ?? c.nombre)}</b><small>${esc(ch.grupo ? ch.mensajes.map((m) => m.de).filter((v, i, a) => v !== 'yo' && a.indexOf(v) === i).map((x) => this.contacto(x).nombre).join(', ') : c.rol ?? '')}</small></div>`);
      const hilo = el('div', 'cel-hilo');
      for (const m of ch.mensajes) {
        if (m.dia) hilo.append(el('div', 'cel-dia', esc(m.dia)));
        const mio = m.de === 'yo';
        const b = el('div', `cel-burbuja ${mio ? 'mia' : 'suya'}`);
        if (ch.grupo && !mio) b.append(el('b', 'quien', esc(this.contacto(m.de).nombre)));
        if (m.texto) b.append(el('p', '', br(m.texto)));
        if (m.foto) {
          const img = el('img', 'cel-burbuja-foto');
          img.src = foto(m.foto);
          img.alt = '';
          img.onclick = () => { const f = this.caso.fotos.find((x) => x.archivo === m.foto); this.verFoto(f ?? { id: m.foto!, archivo: m.foto!, fecha: m.t }); };
          b.append(img);
        }
        if (m.voz) b.append(this.reproductor(this.caso.voces.find((v) => v.id === m.voz)!));
        b.append(el('small', '', esc(m.t)));
        hilo.append(b);
        if (m.pista && !m.voz) this.g.anotar(m.pista);
      }
      conv.append(cab, hilo);
      requestAnimationFrame(() => { hilo.scrollTop = hilo.scrollHeight; });
      this.g.evento('chat:' + id);
    };
    pintarLista();
    cuerpo.append(lista, conv);
    (cuerpo as HTMLElement & { abrirChat?: (id: string) => void }).abrirChat = abrirChat;
  }

  /** El reproductor de una nota de voz (con su transcripción). Al terminar de oírla, anota su pista. */
  private reproductor(v: Voz): HTMLElement {
    const r = el('div', 'cel-voz');
    r.dataset.voz = v.id;
    const b = el('button', 'cel-voz-play', ICONO.play);
    const onda = el('div', 'cel-voz-onda');
    let semilla = [...v.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
    for (let i = 0; i < 26; i++) { semilla = (semilla * 9301 + 49297) % 233280; const barra = el('i'); barra.style.height = `${22 + (semilla / 233280) * 78}%`; onda.append(barra); }
    const seg = segundosVoz(v.id) || Math.max(3, v.texto.length / 14);
    const dur = el('small', '', `0:${String(Math.round(seg)).padStart(2, '0')}`);
    const tr = el('div', 'cel-voz-texto');
    tr.innerHTML = v.transcrita ? `<small>Transcripción automática</small>${esc(v.transcrita)}` : `<small>Transcripción</small>${esc(v.texto)}`;
    tr.hidden = true;
    const ver = el('button', 'cel-voz-ver', 'Aa');
    ver.title = 'Ver transcripción';
    ver.onclick = (e) => { e.stopPropagation(); tr.hidden = !tr.hidden; if (!tr.hidden) { this.g.anotar(v.pista); this.g.evento('voz'); } };
    const fila = el('div', 'cel-voz-fila');
    fila.append(b, onda, dur, ver);
    r.append(fila, tr);
    const barras = [...onda.children] as HTMLElement[];
    b.onclick = (e) => {
      e.stopPropagation();
      if (r.classList.contains('sonando')) { pararVoz(); return; }
      const sono = sonarVoz(v.id, () => { r.classList.remove('sonando'); b.innerHTML = ICONO.play; barras.forEach((x) => x.classList.remove('va')); }, (u) => {
        const k = Math.floor(u * barras.length);
        barras.forEach((x, i) => x.classList.toggle('va', i <= k));
      });
      this.g.anotar(v.pista);
      this.g.evento('voz');
      if (sono) { r.classList.add('sonando'); b.innerHTML = ICONO.pausa; }
      // sin audio todavía: se abre la transcripción
      else tr.hidden = false;
    };
    if (!hayVoz(v.id)) r.classList.add('sin-audio');
    return r;
  }

  // ------------------------------------------------------------------ fotos

  private appFotos(cuerpo: HTMLElement) {
    const rejilla = el('div', 'cel-galeria');
    const albumes = new Map<string, Foto[]>();
    for (const f of this.caso.fotos) {
      if (f.candado && !this.abierto(f.candado)) { albumes.set(f.candado, [...(albumes.get(f.candado) ?? []), f]); continue; }
      rejilla.append(this.miniatura(f));
    }
    for (const [id, fs] of albumes) {
      const c = this.candadoDe(id)!;
      const b = el('button', 'cel-mini album');
      b.dataset.candado = id;
      b.innerHTML = `<span class="tapa">${ICONO.candado}<b>${esc(c.titulo)}</b><small>${fs.length} fotos</small></span>`;
      b.onclick = () => this.pedir(id, () => this.abrir('fotos'));
      rejilla.append(b);
    }
    cuerpo.append(rejilla);
  }

  private miniatura(f: Foto) {
    const b = el('button', `cel-mini ${f.oscura ? 'oscura' : ''}`);
    b.dataset.foto = f.id;
    b.style.backgroundImage = `url(${foto(f.archivo)})`;
    b.innerHTML = `<small>${esc(f.fecha)}</small>`;
    b.onclick = () => this.verFoto(f);
    return b;
  }

  private verFoto(f: Foto) {
    const v = el('div', `cel-visor ${f.oscura ? 'oscura' : ''}`);
    v.dataset.foto = f.id;
    const img = el('div', 'cel-visor-img');
    img.style.backgroundImage = `url(${foto(f.archivo)})`;
    const info = el('div', 'cel-visor-info');
    info.innerHTML = `<b>${esc(f.lugar ?? '')}</b><small>${esc(f.fecha)}</small>${f.pie ? `<p>${esc(f.pie)}</p>` : ''}`;
    if (f.oscura) info.insertAdjacentHTML('beforeend', `<p class="cel-pista-linterna">${this.linterna ? 'La linterna alumbra la foto…' : 'Está muy oscura. ¿Y si prendes la linterna?'}</p>`);
    const x = el('button', 'cel-visor-cerrar', ICONO.atras);
    x.onclick = () => { v.remove(); this.pila.pop(); };
    v.append(img, info, x);
    this.pantalla.append(v);
    this.pila.push(() => v.remove());
    this.g.anotar(f.pista);
    if (f.oscura && this.linterna) this.g.anotar(f.pistaLinterna);
    this.g.evento('foto:' + f.id);
  }

  // ------------------------------------------------------------------ notas

  private appNotas(cuerpo: HTMLElement) {
    cuerpo.classList.add('dos-paneles');
    const lista = el('div', 'cel-lista notas');
    const hoja = el('div', 'cel-hoja', '<div class="cel-vacio">Escoge una nota</div>');
    const pintar = (activa?: string) => {
      lista.replaceChildren();
      for (const n of this.caso.notas) {
        const cerrada = n.candado && !this.abierto(n.candado);
        const b = el('button', `cel-fila-nota ${activa === n.id ? 'activo' : ''} ${cerrada ? 'cerrada' : ''}`);
        b.dataset.nota = n.id;
        b.innerHTML = `<b>${cerrada ? ICONO.candado : ''}${esc(n.titulo)}</b><small>${esc(n.fecha)}</small><span>${cerrada ? 'Nota protegida' : esc(n.texto.split('\n')[0])}</span>`;
        b.onclick = () => {
          if (cerrada) { this.pedir(n.candado!, () => { this.abrir('notas'); this.abrirNota(n.id); }); return; }
          pintar(n.id);
          hoja.innerHTML = `<h3>${esc(n.titulo)}</h3><small>${esc(n.fecha)}</small><p>${br(n.texto)}</p>`;
          this.g.anotar(n.pista);
          this.g.evento('nota:' + n.id);
        };
        lista.append(b);
      }
    };
    pintar();
    cuerpo.append(lista, hoja);
  }

  private abrirNota(id: string) {
    this.pantalla.querySelector<HTMLElement>(`[data-nota="${id}"]`)?.click();
  }

  // ------------------------------------------------------------------ grabadora

  private appGrabadora(cuerpo: HTMLElement) {
    const lista = el('div', 'cel-grabaciones');
    const propias = this.caso.voces.filter((v) => v.grabadora);
    // Las notas de voz que llegaron por chat también se guardan aquí (como en los teléfonos de verdad)
    const recibidas = this.caso.voces.filter((v) => !v.grabadora && this.caso.chats.some((c) => c.mensajes.some((m) => m.voz === v.id)));
    const fila = (v: Voz, titulo: string) => {
      const f = el('div', 'cel-grab');
      f.innerHTML = `<div class="cel-grab-cab"><b>${esc(titulo)}</b><small>${esc(v.fecha)}</small></div>`;
      f.append(this.reproductor(v));
      lista.append(f);
    };
    if (propias.length) lista.append(el('div', 'cel-seccion', 'Mis grabaciones'));
    for (const v of propias) fila(v, v.titulo ?? 'Grabación');
    if (recibidas.length) lista.append(el('div', 'cel-seccion', 'Notas de voz recibidas'));
    for (const v of recibidas) fila(v, v.nombre);
    cuerpo.append(lista);
  }

  // ------------------------------------------------------------------ llamadas

  private appLlamadas(cuerpo: HTMLElement) {
    const lista = el('div', 'cel-llamadas');
    const orden = [...this.caso.llamadas];
    for (const l of orden) {
      const c = this.contacto(l.quien);
      const f = el('div', `cel-llamada ${l.tipo}`);
      f.append(this.avatar(c, 'chico'));
      f.insertAdjacentHTML('beforeend', `<div><b>${esc(c.nombre)}</b><span><i>${ICONO[l.tipo]}</i>${l.tipo === 'perdida' ? 'Perdida' : l.tipo === 'entrante' ? 'Entrante' : 'Saliente'}${l.dur ? ` · ${esc(l.dur)}` : ''}</span></div><small>${esc(l.dia)}<br>${esc(l.t)}</small>`);
      if (l.voz) {
        const v = this.caso.voces.find((x) => x.id === l.voz)!;
        const buz = el('div', 'cel-buzon');
        buz.insertAdjacentHTML('beforeend', `<small>${ICONO.buzon} Grabación de la llamada</small>`);
        buz.append(this.reproductor(v));
        f.append(buz);
        f.classList.add('con-buzon');
      }
      lista.append(f);
      this.g.anotar(l.pista);
    }
    cuerpo.append(lista);
  }

  // ------------------------------------------------------------------ mapa

  private appMapa(cuerpo: HTMLElement) {
    const m = this.caso.mapa!;
    const caja = el('div', 'cel-mapa');
    caja.style.background = m.fondo;
    const pts = (d: string) => d.trim().split(/\s+/).map((p) => p.split(',').map(Number));
    let svg = '<svg viewBox="0 0 100 100" preserveAspectRatio="none">';
    for (const t of m.trazos) {
      const p = pts(t.d);
      const s = p.map((q) => q.join(',')).join(' ');
      if (t.tipo === 'agua') svg += `<polygon points="${s}" class="agua"/>`;
      else if (t.tipo === 'zona') svg += `<polygon points="${s}" fill="${t.color ?? '#0002'}" class="zona"/>`;
      else if (t.tipo === 'camino') svg += `<polyline points="${s}" class="camino"/><polyline points="${s}" class="camino-centro"/>`;
      else if (t.tipo === 'ruta') svg += `<polyline points="${s}" class="ruta" stroke="${t.color ?? '#e33'}"/>`;
    }
    svg += '</svg>';
    caja.innerHTML = svg;
    for (const t of m.trazos) if (t.tipo === 'texto') {
      const [x, y] = pts(t.d)[0];
      const e = el('span', 'cel-mapa-texto', esc(t.texto ?? ''));
      e.style.left = `${x}%`; e.style.top = `${y}%`;
      caja.append(e);
    }
    const ficha = el('div', 'cel-mapa-ficha', `<b>${esc(m.titulo)}</b><span>Toca un lugar</span>`);
    for (const l of m.lugares) {
      const b = el('button', `cel-mapa-pin ${l.pista ? 'guardado' : ''}`, `${ICONO[l.icono ?? 'pin']}`);
      b.dataset.lugar = l.id;
      b.style.left = `${l.x}%`; b.style.top = `${l.y}%`;
      b.onclick = () => {
        caja.querySelectorAll('.cel-mapa-pin.activo').forEach((x) => x.classList.remove('activo'));
        b.classList.add('activo');
        ficha.innerHTML = `<b>${esc(l.nombre)}</b>${l.nota ? `<span>${esc(l.nota)}</span>` : ''}`;
        this.g.anotar(l.pista);
      };
      const etiqueta = el('span', 'cel-mapa-nombre', esc(l.nombre));
      etiqueta.style.left = `${l.x}%`; etiqueta.style.top = `${l.y}%`;
      caja.append(etiqueta, b);
    }
    caja.append(ficha);
    cuerpo.append(caja);
  }

  // ------------------------------------------------------------------ correo / bitácora

  private appCorreo(cuerpo: HTMLElement) {
    cuerpo.classList.add('dos-paneles');
    const items = this.caso.correo ?? [];
    const lista = el('div', 'cel-lista');
    const hoja = el('div', 'cel-hoja correo', '<div class="cel-vacio">Escoge una entrada</div>');
    const cerradas = new Set(items.filter((x) => x.candado && !this.abierto(x.candado)).map((x) => x.candado!));
    if (cerradas.size) {
      for (const id of cerradas) {
        const c = this.candadoDe(id)!;
        const b = el('button', 'cel-protegido');
        b.dataset.candado = id;
        b.innerHTML = `${ICONO.candado}<b>${esc(c.titulo)}</b><span>Protegido con contraseña · toca para abrir</span>`;
        b.onclick = () => this.pedir(id, () => this.abrir('correo'));
        hoja.replaceChildren(b);
      }
    }
    for (const x of items) {
      const cerrada = x.candado && !this.abierto(x.candado);
      const b = el('button', `cel-fila-nota ${cerrada ? 'cerrada' : ''}`);
      b.dataset.correo = x.id;
      b.innerHTML = `<b>${cerrada ? ICONO.candado : ''}${esc(x.asunto)}</b><small>${esc(x.de)} · ${esc(x.fecha)}</small><span>${cerrada ? '••••••••••' : esc(x.texto.split('\n')[0])}</span>`;
      b.onclick = () => {
        if (cerrada) { this.pedir(x.candado!, () => this.abrir('correo')); return; }
        lista.querySelectorAll('.activo').forEach((e) => e.classList.remove('activo'));
        b.classList.add('activo');
        hoja.innerHTML = `<h3>${esc(x.asunto)}</h3><small>${esc(x.de)} · ${esc(x.fecha)}</small><p>${br(x.texto)}</p>${x.foto ? `<img src="${foto(x.foto)}" alt="">` : ''}`;
        this.g.anotar(x.pista);
        this.g.evento('correo:' + x.id);
      };
      lista.append(b);
    }
    cuerpo.append(lista, hoja);
  }

  // ------------------------------------------------------------------ calendario

  private appCalendario(cuerpo: HTMLElement) {
    const lista = el('div', 'cel-agenda');
    let dia = '';
    for (const e of this.caso.calendario) {
      if (e.dia !== dia) { dia = e.dia; lista.append(el('div', 'cel-agenda-dia', esc(dia))); }
      lista.append(el('div', 'cel-evento', `<i></i><small>${esc(e.t ?? 'Todo el día')}</small><b>${esc(e.texto)}</b>`));
      this.g.anotar(e.pista);
    }
    cuerpo.append(lista);
  }

  // ------------------------------------------------------------------ linterna

  private appLinterna(cuerpo: HTMLElement) {
    const b = el('button', `cel-linterna ${this.linterna ? 'prendida' : ''}`, `${ICONO.linterna}<span>${this.linterna ? 'Prendida' : 'Apagada'}</span>`);
    b.onclick = () => {
      this.linterna = !this.linterna;
      efecto('tic', 0.4);
      b.classList.toggle('prendida', this.linterna);
      b.querySelector('span')!.textContent = this.linterna ? 'Prendida' : 'Apagada';
      this.aplicarLinterna();
      this.g.evento(this.linterna ? 'linterna' : 'linterna-off');
    };
    cuerpo.append(b, el('p', 'cel-linterna-nota', 'La linterna alumbra lo que está muy oscuro (en las fotos, por ejemplo).'));
  }

  private aplicarLinterna() {
    this.raiz.classList.toggle('con-linterna', this.linterna);
    this.capa.classList.toggle('linterna', this.linterna);
  }

  // ------------------------------------------------------------------ señas de luz (Iridalia)

  private appSenas(cuerpo: HTMLElement) {
    const tabla = el('div', 'cel-senas');
    tabla.append(el('div', 'cel-senas-tit', '<b>Tabla de señas de luz</b><small>de Maia · cada color, una letra</small>'));
    const rej = el('div', 'cel-senas-rej');
    for (const s of this.caso.senas ?? []) rej.append(el('div', 'cel-sena', `<i style="background:${s.color};box-shadow:0 0 12px ${s.color}"></i><b>${esc(s.letra)}</b><small>${esc(s.nombre)}</small>`));
    tabla.append(rej);
    const id = 'senas';
    const msj = el('button', `cel-protegido ${this.abierto(id) ? 'leido' : ''}`);
    msj.dataset.candado = id;
    if (this.abierto(id)) msj.innerHTML = `${ICONO.abierto}<b>Mensaje leído: G·E·O·D·A</b><span>Las luces del valle dicen GEODA.</span>`;
    else msj.innerHTML = `${ICONO.candado}<b>Mensaje recibido sin leer</b><span>Escribe lo que dicen las luces</span>`;
    msj.onclick = () => { if (!this.abierto(id)) this.pedir(id, () => this.abrir('senas')); };
    cuerpo.append(tabla, msj);
    this.g.anotar('tabla');
  }

  destruir() {
    pararVoz();
    clearInterval(this.reloj);
  }
}
