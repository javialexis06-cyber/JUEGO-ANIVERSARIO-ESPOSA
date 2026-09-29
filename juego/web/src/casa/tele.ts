// La tele de la sala: videos de YouTube a pantalla completa con los dos en el sofá en un recuadro, una cola
// de videos que siguen solos (al acabarse uno empieza el siguiente) y, al levantarse, la tele sigue
// prendida en una ventanita que se sigue viendo y oyendo. Se apaga desde «Ver tele → Apagar la tele».
import './tele.css';
import { esc, toast } from './ui_casa';

export interface Video {
  id: string;
  titulo?: string;
}
export type EstadoTele = 'apagada' | 'grande' | 'mini';

interface Guardado {
  cola: Video[];
  actual: Video | null;
  seg: number;
  prendida: boolean;
}

const CLAVE = 'nuestro-hogar-tele';

/** El id de un enlace de YouTube (watch, youtu.be, shorts, embed, live, music) o de un id suelto. */
export function idDeYoutube(texto: string): string | null {
  const t = texto.trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = u.pathname.split('/')[1] ?? null;
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = u.searchParams.get('v');
    const partes = u.pathname.split('/').filter(Boolean);
    if (!id && ['shorts', 'embed', 'live', 'v'].includes(partes[0])) id = partes[1] ?? null;
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

// ------------------------------------------------------------------ Reproductor (YouTube o de prueba)
interface Reproductor {
  cargar(id: string, desde?: number): void;
  segundo(): number;
  titulo(): string;
  destruir(): void;
}
interface Avisos {
  alTerminar(): void;
  alError(codigo: number): void;
  alEmpezar(): void;
}

type YTPlayer = {
  loadVideoById(o: { videoId: string; startSeconds?: number }): void;
  getCurrentTime(): number;
  getVideoData(): { title?: string };
  destroy(): void;
};
type YTApi = { Player: new (el: HTMLElement, o: unknown) => YTPlayer; PlayerState: { ENDED: number; PLAYING: number } };

let cargaApi: Promise<YTApi> | null = null;
function apiYoutube(): Promise<YTApi> {
  const w = window as unknown as { YT?: YTApi & { loaded?: number }; onYouTubeIframeAPIReady?: () => void };
  cargaApi ??= new Promise((listo, falla) => {
    if (w.YT?.Player) return listo(w.YT);
    w.onYouTubeIframeAPIReady = () => listo(w.YT!);
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => {
      cargaApi = null;
      falla(new Error('sin internet'));
    };
    document.head.append(s);
  });
  return cargaApi;
}

async function reproductorYoutube(caja: HTMLElement, avisos: Avisos): Promise<Reproductor> {
  const YT = await apiYoutube();
  const div = document.createElement('div');
  caja.append(div);
  let listo: () => void;
  const hecho = new Promise<void>((r) => (listo = r));
  const p = new YT.Player(div, {
    width: '100%',
    height: '100%',
    playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, fs: 0, origin: location.origin },
    events: {
      onReady: () => listo(),
      onStateChange: (e: { data: number }) => {
        if (e.data === YT.PlayerState.ENDED) avisos.alTerminar();
        else if (e.data === YT.PlayerState.PLAYING) avisos.alEmpezar();
      },
      onError: (e: { data: number }) => avisos.alError(e.data),
    },
  });
  await hecho;
  return {
    cargar: (id, desde = 0) => p.loadVideoById({ videoId: id, startSeconds: desde }),
    segundo: () => p.getCurrentTime?.() ?? 0,
    titulo: () => p.getVideoData?.().title ?? '',
    destruir: () => p.destroy(),
  };
}

/** Pruebas sin internet (?tele-falsa): cada «video» dura 4 s y se pinta de un color. */
function reproductorFalso(caja: HTMLElement, avisos: Avisos): Reproductor {
  const el = document.createElement('div');
  el.className = 'tele-falsa';
  caja.append(el);
  let t0 = 0, desde = 0, id = '', timer = 0;
  return {
    cargar(nuevo, d = 0) {
      id = nuevo;
      desde = d;
      t0 = performance.now();
      el.textContent = `▶ ${nuevo}`;
      el.style.background = `hsl(${[...nuevo].reduce((a, c) => a + c.charCodeAt(0), 0) % 360} 60% 45%)`;
      clearTimeout(timer);
      if (nuevo === 'xxxxxxxxxxx') timer = window.setTimeout(() => avisos.alError(150), 300);
      else {
        avisos.alEmpezar();
        timer = window.setTimeout(() => avisos.alTerminar(), 4000);
      }
    },
    segundo: () => desde + (performance.now() - t0) / 1000,
    titulo: () => (id ? `Video de prueba ${id}` : ''),
    destruir: () => {
      clearTimeout(timer);
      el.remove();
    },
  };
}

// ------------------------------------------------------------------ La tele
export class Tele {
  estado: EstadoTele = 'apagada';
  cola: Video[] = [];
  actual: Video | null = null;
  /** Aquí la casa pone el recuadro con los dos sentados en el sofá. */
  readonly pip: HTMLElement;
  /** Cambió algo (prendida, video, cola): la casa actualiza la pantalla de la tele y el menú. */
  alCambiar: () => void = () => undefined;
  /** Tocaron la ventanita: la casa los vuelve a sentar a ver tele (por defecto solo se agranda). */
  alTocarMini: () => void = () => this.ver();

  private raiz: HTMLElement;
  private caja: HTMLElement;
  private rep: Reproductor | null = null;
  private creando: Promise<Reproductor> | null = null;
  private segGuardado = 0;
  /** El video que tiene cargado el reproductor (para no volver a empezarlo). */
  private cargado: string | null = null;
  private tGuardar = 0;
  private tOcultar = 0;
  private falsa = new URLSearchParams(location.search).has('tele-falsa');

  constructor() {
    this.raiz = document.createElement('section');
    this.raiz.className = 'tele';
    this.raiz.hidden = true;
    this.raiz.innerHTML = `
      <div class="tele-video"><div class="tele-tapa" hidden></div></div>
      <div class="tele-pip" aria-hidden="true"></div>
      <header class="tele-barra">
        <button class="tele-boton" data-tele="mini" aria-label="Levantarse del sofá">↙ Levantarse</button>
        <b class="tele-titulo"></b>
        <button class="tele-boton" data-tele="siguiente" aria-label="Siguiente video">⏭</button>
        <button class="tele-boton" data-tele="cola" aria-label="Cola de videos">☰ <span class="tele-n"></span></button>
        <button class="tele-boton tele-apagar" data-tele="apagar" aria-label="Apagar la tele">⏻</button>
      </header>
      <aside class="tele-cola" hidden>
        <h3>Cola de videos</h3>
        <form class="tele-agregar" novalidate>
          <input type="text" inputmode="url" enterkeyhint="done" autocomplete="off" placeholder="Pega el enlace de YouTube" aria-label="Enlace de YouTube">
          <button type="button" class="tele-boton" data-tele="pegar" aria-label="Pegar">📋</button>
          <button type="submit" class="tele-boton tele-mas">Agregar</button>
        </form>
        <ol class="tele-lista"></ol>
        <p class="tele-vacia">Pega uno o varios enlaces: cuando se acabe un video empieza el siguiente.</p>
      </aside>`;
    document.body.append(this.raiz);
    this.caja = this.raiz.querySelector('.tele-video')!;
    this.pip = this.raiz.querySelector('.tele-pip')!;
    this.raiz.addEventListener('click', (ev) => this.alClic(ev));
    this.raiz.querySelector('form')!.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const input = this.raiz.querySelector('input')!;
      if (this.agregarTexto(input.value)) input.value = '';
    });
    // Las opciones se esconden solas para ver el video limpio; un toque arriba las trae
    this.raiz.addEventListener('pointerdown', () => this.mostrarBarra());
    this.leer();
  }

  get prendida() {
    return this.estado !== 'apagada';
  }

  // ---------------------------------------------------------------- Lo que pide la casa
  /** Sentarse a ver tele: la prende (o la agranda) a pantalla completa. */
  ver() {
    this.estado = 'grande';
    this.pintar();
    if (this.actual) this.reproducir(this.segGuardado);
    else if (this.cola.length) this.siguiente();
    else this.abrirCola(true);
    this.mostrarBarra();
    this.cambio();
  }

  /** Se levantan del sofá: la tele sigue prendida en una ventanita. */
  levantarse() {
    if (this.estado === 'apagada') return;
    this.estado = 'mini';
    this.abrirCola(false);
    this.pintar();
    this.cambio();
  }

  apagar() {
    if (this.estado === 'apagada') return;
    this.guardarSegundo();
    this.estado = 'apagada';
    this.rep?.destruir();
    this.rep = null;
    this.creando = null;
    this.cargado = null;
    this.caja.querySelectorAll(':scope > :not(.tele-tapa)').forEach((n) => n.remove());
    this.abrirCola(false);
    this.pintar();
    this.cambio();
  }

  /** Agrega un enlace a la cola (si no hay nada sonando, empieza de una). */
  agregarTexto(texto: string): boolean {
    const id = idDeYoutube(texto);
    if (!id) {
      toast('Ese enlace no parece de YouTube.');
      return false;
    }
    const v: Video = { id };
    this.cola.push(v);
    void this.buscarTitulo(v);
    if (!this.actual && this.prendida) this.siguiente();
    else toast('Agregado a la cola.');
    this.cambio();
    return true;
  }

  siguiente() {
    this.actual = this.cola.shift() ?? null;
    this.segGuardado = 0;
    this.cargado = null;
    if (this.actual) this.reproducir(0);
    else if (this.estado === 'grande') this.abrirCola(true);
    this.cambio();
  }

  private reproducir(desde: number) {
    const id = this.actual?.id;
    if (!id) return;
    this.asegurarReproductor()
      .then((r) => {
        if (this.actual?.id !== id || this.cargado === id || !this.prendida) return;
        this.cargado = id;
        r.cargar(id, desde);
        this.pintar();
      })
      .catch(() => undefined);
  }

  // ---------------------------------------------------------------- Por dentro
  private async asegurarReproductor(): Promise<Reproductor> {
    if (this.rep) return this.rep;
    const avisos: Avisos = {
      alTerminar: () => this.siguiente(),
      alError: (c) => {
        toast(c === 101 || c === 150 || c === 153 ? 'Ese video no deja verse fuera de YouTube; sigue el próximo.' : 'Ese video no se pudo ver; sigue el próximo.', 3200);
        window.setTimeout(() => this.siguiente(), 1500);
      },
      alEmpezar: () => {
        const t = this.rep?.titulo();
        if (this.actual && t && !this.actual.titulo) {
          this.actual.titulo = t;
          this.cambio();
        }
      },
    };
    this.creando ??= this.falsa ? Promise.resolve(reproductorFalso(this.caja, avisos)) : reproductorYoutube(this.caja, avisos);
    try {
      this.rep = await this.creando;
    } catch {
      this.creando = null;
      toast('La tele necesita internet para ver YouTube.', 3200);
      throw new Error('sin reproductor');
    }
    return this.rep;
  }

  private alClic(ev: Event) {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-tele]');
    if (this.estado === 'mini' && !b?.closest('.tele-cola')) {
      // La ventanita: tocarla es volver al sofá
      if ((ev.target as HTMLElement).closest('.tele-tapa, .tele-video')) this.alTocarMini();
      return;
    }
    if (!b) return;
    const q = b.dataset.tele!;
    const i = Number(b.dataset.i);
    if (q === 'mini') this.levantarse();
    else if (q === 'siguiente') {
      if (this.cola.length) this.siguiente();
      else toast('No hay más videos en la cola.');
    } else if (q === 'cola') this.abrirCola(this.raiz.querySelector<HTMLElement>('.tele-cola')!.hidden);
    else if (q === 'apagar') this.apagar();
    else if (q === 'pegar') void this.pegar();
    else if (q === 'quitar') {
      this.cola.splice(i, 1);
      this.cambio();
    } else if (q === 'subir' && i > 0) {
      [this.cola[i - 1], this.cola[i]] = [this.cola[i], this.cola[i - 1]];
      this.cambio();
    } else if (q === 'ya') {
      const [v] = this.cola.splice(i, 1);
      this.cola.unshift(v);
      this.siguiente();
    }
  }

  private async pegar() {
    try {
      const t = await navigator.clipboard.readText();
      if (t && this.agregarTexto(t)) return;
    } catch {
      /* el celular no deja leer el portapapeles: se pega a mano en la cajita */
    }
    const input = this.raiz.querySelector('input')!;
    input.focus();
    toast('Mantén presionada la cajita y elige «Pegar».');
  }

  private abrirCola(si: boolean) {
    this.raiz.querySelector<HTMLElement>('.tele-cola')!.hidden = !si;
    this.raiz.classList.toggle('con-cola', si);
  }

  private mostrarBarra() {
    this.raiz.classList.remove('quieta');
    clearTimeout(this.tOcultar);
    this.tOcultar = window.setTimeout(() => {
      if (this.raiz.querySelector<HTMLElement>('.tele-cola')!.hidden) this.raiz.classList.add('quieta');
    }, 3500);
  }

  private async buscarTitulo(v: Video) {
    if (this.falsa) return;
    try {
      const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${v.id}`)}`);
      if (!r.ok) return;
      const d = (await r.json()) as { title?: string };
      if (d.title) {
        v.titulo = d.title;
        this.cambio();
      }
    } catch {
      /* sin título: se muestra la miniatura y el id */
    }
  }

  private cambio() {
    this.guardar();
    this.pintarCola();
    this.alCambiar();
  }

  private pintar() {
    this.raiz.hidden = this.estado === 'apagada';
    this.raiz.classList.toggle('mini', this.estado === 'mini');
    const tapa = this.raiz.querySelector<HTMLElement>('.tele-tapa')!;
    tapa.hidden = this.estado !== 'mini';
    // Al abrir la app con la tele prendida: la miniatura del video con ▶ (se sigue donde iba al tocarla)
    const enPausa = this.estado === 'mini' && !this.cargado && !!this.actual;
    tapa.classList.toggle('pausa', enPausa);
    tapa.style.backgroundImage = enPausa && !this.falsa ? `url(https://i.ytimg.com/vi/${this.actual!.id}/mqdefault.jpg)` : '';
  }

  private pintarCola() {
    const miniatura = (v: Video) => (this.falsa ? '' : `<img src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt="" loading="lazy">`);
    const nombre = (v: Video) => esc(v.titulo ?? `Video ${v.id}`);
    this.raiz.querySelector('.tele-titulo')!.textContent = this.actual ? (this.actual.titulo ?? '') : 'Nada en la tele';
    this.raiz.querySelector('.tele-n')!.textContent = this.cola.length ? String(this.cola.length) : '';
    const lista = this.raiz.querySelector('.tele-lista')!;
    lista.innerHTML =
      (this.actual ? `<li class="ahora">${miniatura(this.actual)}<span><small>Ahora</small>${nombre(this.actual)}</span></li>` : '') +
      this.cola
        .map(
          (v, i) => `<li>${miniatura(v)}<span>${nombre(v)}</span>
            <button class="tele-mini-boton" data-tele="ya" data-i="${i}" aria-label="Ver ya">▶</button>
            <button class="tele-mini-boton" data-tele="subir" data-i="${i}" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="tele-mini-boton" data-tele="quitar" data-i="${i}" aria-label="Quitar">✕</button></li>`,
        )
        .join('');
    this.raiz.querySelector<HTMLElement>('.tele-vacia')!.hidden = !!(this.actual || this.cola.length);
  }

  // ---------------------------------------------------------------- Guardar (sigue igual al volver a abrir la app)
  private guardarSegundo() {
    if (this.rep && this.actual && this.cargado === this.actual.id) this.segGuardado = Math.max(0, this.rep.segundo() - 2);
  }

  private guardar() {
    this.guardarSegundo();
    clearInterval(this.tGuardar);
    if (this.prendida) {
      this.tGuardar = window.setInterval(() => {
        this.guardarSegundo();
        this.escribir();
      }, 5000);
    }
    this.escribir();
  }

  private escribir() {
    const g: Guardado = { cola: this.cola, actual: this.actual, seg: this.segGuardado, prendida: this.prendida };
    try {
      localStorage.setItem(CLAVE, JSON.stringify(g));
    } catch {
      /* sin espacio: la cola se pierde al cerrar */
    }
  }

  private leer() {
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Guardado | null;
      if (!g) return;
      this.cola = (g.cola ?? []).filter((v) => /^[\w-]{11}$/.test(v?.id));
      this.actual = g.actual && /^[\w-]{11}$/.test(g.actual.id) ? g.actual : null;
      this.segGuardado = g.seg ?? 0;
      // Al abrir la app la tele queda prendida en la ventanita si estaba prendida (se reanuda al tocarla)
      if (g.prendida && (this.actual || this.cola.length)) {
        this.estado = 'mini';
        this.pintar();
      }
      this.pintarCola();
    } catch {
      /* guardado roto: tele apagada y sin cola */
    }
  }
}
