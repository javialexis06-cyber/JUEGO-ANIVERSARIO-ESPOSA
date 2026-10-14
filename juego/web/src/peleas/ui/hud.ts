// Lo que se ve encima de la pelea: las dos barras de vida (con el daño que se va borrando despacio), el retrato y el
// nombre de cada uno, las rondas ganadas, el reloj, la barra de la súper, el contador de combo, los anuncios grandes
// («Ronda 1», «¡A pelear!», «¡K.O.!»), lo que dicen (subtítulos) y el corte de la súper.
import { BARRA_MAX } from '../sim';
import type { DefLuchador } from '../tipos';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export class Hud {
  raiz: HTMLElement;
  private vida: HTMLElement[] = [];
  private dano: HTMLElement[] = [];
  private barra: HTMLElement[] = [];
  private barraTxt: HTMLElement[] = [];
  private rondas: HTMLElement[] = [];
  private caras: HTMLImageElement[] = [];
  private nombres: HTMLElement[] = [];
  private combos: HTMLElement[] = [];
  private reloj: HTMLElement;
  private anuncio: HTMLElement;
  private subt: HTMLElement;
  private corte: HTMLElement;
  private velo: HTMLElement;
  private danoVisto = [1, 1];
  private relojVisto = -1;
  private comboT = [0, 0];
  private anuncioT = 0;
  private subtT = 0;
  alPausa: () => void = () => undefined;

  constructor(contenedor: HTMLElement) {
    this.raiz = document.createElement('div');
    this.raiz.className = 'hud';
    const lado = (i: number) => `<div class="hud-lado hud-lado-${i}">
        <div class="hud-marco"><img class="hud-cara" alt=""></div>
        <div class="hud-info"><b class="hud-nombre"></b>
          <div class="hud-vida"><i class="hud-vida-dano"></i><i class="hud-vida-ok"></i><span class="hud-brillo"></span></div>
          <div class="hud-fila"><div class="hud-rondas"><i></i><i></i></div>
            <div class="hud-barra"><i></i><b>SÚPER</b></div></div>
        </div></div>
      <div class="hud-combo hud-combo-${i}"></div>`;
    this.raiz.innerHTML = `${lado(0)}<div class="hud-reloj"><b>60</b></div>${lado(1)}
      <button class="hud-pausa" type="button" aria-label="Pausa"><i></i><i></i></button>
      <div class="hud-anuncio" aria-live="polite"></div><div class="hud-subtitulo"></div><div class="hud-corte"></div><div class="hud-velo"></div>`;
    contenedor.append(this.raiz);
    for (let i = 0; i < 2; i++) {
      const l = this.raiz.querySelector<HTMLElement>(`.hud-lado-${i}`)!;
      this.vida.push(l.querySelector('.hud-vida-ok')!);
      this.dano.push(l.querySelector('.hud-vida-dano')!);
      this.barra.push(l.querySelector('.hud-barra i')!);
      this.barraTxt.push(l.querySelector('.hud-barra')!);
      this.rondas.push(l.querySelector('.hud-rondas')!);
      this.caras.push(l.querySelector('.hud-cara')!);
      this.nombres.push(l.querySelector('.hud-nombre')!);
      this.combos.push(this.raiz.querySelector(`.hud-combo-${i}`)!);
    }
    this.reloj = this.raiz.querySelector('.hud-reloj b')!;
    this.anuncio = this.raiz.querySelector('.hud-anuncio')!;
    this.subt = this.raiz.querySelector('.hud-subtitulo')!;
    this.corte = this.raiz.querySelector('.hud-corte')!;
    this.velo = this.raiz.querySelector('.hud-velo')!;
    this.raiz.querySelector('.hud-pausa')!.addEventListener('click', () => this.alPausa());
  }

  luchadores(defs: DefLuchador[], nombres: string[]) {
    defs.forEach((d, i) => {
      this.nombres[i].textContent = nombres[i] ?? d.nombre;
      this.raiz.querySelector<HTMLElement>(`.hud-lado-${i}`)!.style.setProperty('--color', d.color);
    });
  }

  cara(i: number, url: string) {
    if (url) this.caras[i].src = url;
  }

  mostrar(si: boolean) {
    this.raiz.hidden = !si;
  }

  sinReloj(si: boolean) {
    this.raiz.classList.toggle('sin-reloj', si);
  }

  actualizar(dt: number, L: { vida: number; barra: number; rondas?: number; def: DefLuchador }[], segundos: number, rondas: number[], paraGanar: number) {
    L.forEach((p, i) => {
      const k = Math.max(0, p.vida / p.def.vida);
      this.vida[i].style.transform = `scaleX(${k})`;
      this.vida[i].classList.toggle('poca', k < 0.25);
      // El daño se borra despacito (para que se vea cuánto quitó el combo)
      if (this.danoVisto[i] < k) this.danoVisto[i] = k;
      else this.danoVisto[i] = Math.max(k, this.danoVisto[i] - dt * 0.45);
      this.dano[i].style.transform = `scaleX(${this.danoVisto[i]})`;
      const b = Math.min(1, p.barra / BARRA_MAX);
      this.barra[i].style.transform = `scaleX(${b})`;
      this.barraTxt[i].classList.toggle('llena', b >= 1);
      const r = this.rondas[i];
      const htmlR = Array.from({ length: paraGanar }, (_, j) => `<i class="${j < rondas[i] ? 'ganada' : ''}"></i>`).join('');
      if (r.dataset.v !== htmlR) {
        r.innerHTML = htmlR;
        r.dataset.v = htmlR;
      }
      if (this.comboT[i] > 0) {
        this.comboT[i] -= dt;
        if (this.comboT[i] <= 0) this.combos[i].classList.remove('ver');
      }
    });
    if (segundos !== this.relojVisto) {
      this.relojVisto = segundos;
      this.reloj.textContent = String(segundos);
      this.reloj.parentElement!.classList.toggle('apuro', segundos <= 10);
    }
    if (this.anuncioT > 0) {
      this.anuncioT -= dt;
      if (this.anuncioT <= 0) this.anuncio.classList.remove('ver');
    }
    if (this.subtT > 0) {
      this.subtT -= dt;
      if (this.subtT <= 0) this.subt.classList.remove('ver');
    }
  }

  /** Reinicia lo que se borra despacio (ronda nueva). */
  reiniciar() {
    this.danoVisto = [1, 1];
  }

  /** «3 golpes» del lado de quien los da (i = quien recibe). */
  combo(i: number, n: number, dano: number) {
    if (n < 2) return;
    const el = this.combos[1 - i];
    el.innerHTML = `<b>${n}</b><span>golpes</span><small>${Math.round(dano)} de daño</small>`;
    el.classList.remove('ver');
    void el.offsetWidth;
    el.classList.add('ver');
    this.comboT[1 - i] = 1.4;
  }

  anunciar(texto: string, clase = '', dur = 1.3) {
    this.anuncio.className = `hud-anuncio ${clase}`;
    this.anuncio.innerHTML = texto;
    void this.anuncio.offsetWidth;
    this.anuncio.classList.add('ver');
    this.anuncioT = dur;
  }

  subtitulo(quien: string, texto: string, color: string, dur = 2.4) {
    this.subt.innerHTML = `<b style="color:${color}">${esc(quien)}</b> ${esc(texto)}`;
    this.subt.classList.add('ver');
    this.subtT = dur;
  }

  /** El corte de la súper: la franja con el nombre del golpe. */
  corteSuper(lado: number, nombre: string, golpe: string, color: string, cara: string) {
    this.corte.className = `hud-corte lado-${lado}`;
    this.corte.style.setProperty('--color', color);
    this.corte.innerHTML = `<div class="hud-corte-franja">${cara ? `<img src="${cara}" alt="">` : ''}<div><small>${esc(nombre)}</small><b>${esc(golpe)}</b></div></div>`;
    void this.corte.offsetWidth;
    this.corte.classList.add('ver');
    setTimeout(() => this.corte.classList.remove('ver'), 900);
  }

  /** Un destello de toda la pantalla (súper, K.O.). */
  destello(color = '#fff', fuerza = 0.7) {
    this.velo.style.background = color;
    this.velo.style.transition = 'none';
    this.velo.style.opacity = String(fuerza);
    void this.velo.offsetWidth;
    this.velo.style.transition = 'opacity .45s ease-out';
    this.velo.style.opacity = '0';
  }

  liberar() {
    this.raiz.remove();
  }
}
