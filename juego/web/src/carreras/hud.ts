// Lo que se ve encima de la carrera: el puesto grande, la vuelta y el tiempo, la casilla del objeto (con su ruleta),
// el minimapa, la cuenta regresiva, los avisos («¡Última vuelta!», «¡Rebufo!») y el globito de quien habla.
import { OBJETOS, type IdObjeto } from './datos';
import type { Pista } from './pista';
import type { Sim } from './sim';

const ICONOS: IdObjeto[] = ['chispa', 'semilla', 'velo', 'ceniza', 'pluma', 'lluvia', 'lucero', 'brasa'];
export const icono = (o: IdObjeto) => `./carreras/iconos/${o}.webp`;

export function tiempoTexto(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60), s = Math.floor(t % 60), c = Math.floor((t * 100) % 100);
  return `${m}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
}

const ORD = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º'];

export class Hud {
  raiz: HTMLElement;
  private puesto: HTMLElement;
  private vuelta: HTMLElement;
  private reloj: HTMLElement;
  private objeto: HTMLElement;
  private objImg: HTMLImageElement;
  private usos: HTMLElement;
  private mapa: HTMLCanvasElement;
  private fondoMapa: HTMLCanvasElement;
  private cuenta: HTMLElement;
  private aviso: HTMLElement;
  private globo: HTMLElement;
  private tabla: HTMLElement;
  private escala = 1;
  private cx = 0;
  private cz = 0;
  private ultPuesto = -1;
  private ruletaT = 0;
  private globoHasta = 0;
  private avisoHasta = 0;
  alPausa: () => void = () => undefined;

  constructor(contenedor: HTMLElement, private pista: Pista) {
    const r = (this.raiz = document.createElement('div'));
    r.className = 'car-hud';
    r.innerHTML = `
      <div class="car-obj"><img alt=""><span class="car-usos"></span></div>
      <div class="car-centro"><div class="car-vuelta"></div><div class="car-reloj"></div></div>
      <div class="car-puesto"></div>
      <button class="car-pausa" aria-label="Pausa">❚❚</button>
      <canvas class="car-mapa" width="150" height="120"></canvas>
      <ol class="car-tabla"></ol>
      <div class="car-cuenta"></div>
      <div class="car-aviso"></div>
      <div class="car-globo"><b></b><span></span></div>`;
    contenedor.append(r);
    const q = <T extends HTMLElement>(s: string) => r.querySelector(s) as T;
    this.puesto = q('.car-puesto');
    this.vuelta = q('.car-vuelta');
    this.reloj = q('.car-reloj');
    this.objeto = q('.car-obj');
    this.objImg = q<HTMLImageElement>('.car-obj img');
    this.usos = q('.car-usos');
    this.mapa = q<HTMLCanvasElement>('.car-mapa');
    this.cuenta = q('.car-cuenta');
    this.aviso = q('.car-aviso');
    this.globo = q('.car-globo');
    this.tabla = q('.car-tabla');
    q('.car-pausa').addEventListener('click', () => this.alPausa());
    // Precarga de los íconos (la ruleta no parpadea)
    for (const o of [...ICONOS, 'tres' as IdObjeto]) new Image().src = icono(o);
    this.fondoMapa = document.createElement('canvas');
    this.dibujarFondoMapa();
  }

  private dibujarFondoMapa() {
    const p = this.pista;
    const W = this.mapa.width, H = this.mapa.height;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let i = 0; i < p.n; i++) {
      x0 = Math.min(x0, p.x[i]);
      x1 = Math.max(x1, p.x[i]);
      z0 = Math.min(z0, p.z[i]);
      z1 = Math.max(z1, p.z[i]);
    }
    this.escala = Math.min((W - 16) / (x1 - x0), (H - 16) / (z1 - z0));
    this.cx = (x0 + x1) / 2;
    this.cz = (z0 + z1) / 2;
    const c = this.fondoMapa;
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    const camino = () => {
      g.beginPath();
      for (let i = 0; i <= p.n; i += 3) {
        const [x, y] = this.aMapa(p.x[i % p.n], p.z[i % p.n]);
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.closePath();
    };
    g.lineJoin = g.lineCap = 'round';
    camino();
    g.strokeStyle = 'rgba(40,24,30,0.55)';
    g.lineWidth = 9;
    g.stroke();
    camino();
    g.strokeStyle = 'rgba(255,246,230,0.95)';
    g.lineWidth = 5;
    g.stroke();
    // Meta
    const [mx, my] = this.aMapa(p.x[0], p.z[0]);
    g.fillStyle = '#2b2230';
    g.fillRect(mx - 4, my - 4, 8, 8);
    g.fillStyle = '#fff';
    g.fillRect(mx - 4, my - 4, 4, 4);
    g.fillRect(mx, my, 4, 4);
  }

  private aMapa(x: number, z: number): [number, number] {
    // (se ve desde arriba con el norte de la pista hacia arriba: z de three.js hacia abajo)
    return [this.mapa.width / 2 + (x - this.cx) * this.escala, this.mapa.height / 2 + (z - this.cz) * this.escala];
  }

  actualizar(sim: Sim, mio: number, dt: number) {
    const k = sim.karts[mio];
    if (!k) return;
    const n = sim.karts.length;
    // Puesto
    if (k.puesto !== this.ultPuesto) {
      this.ultPuesto = k.puesto;
      this.puesto.innerHTML = `<b>${k.puesto + 1}</b><small>${ORD[k.puesto]?.slice(-1) ?? 'º'}</small><i>/${n}</i>`;
      this.puesto.className = `car-puesto p${Math.min(k.puesto + 1, 4)}`;
      this.puesto.classList.remove('salta');
      void this.puesto.offsetWidth;
      this.puesto.classList.add('salta');
    }
    const v = Math.max(1, Math.min(sim.vueltasTotal, k.vuelta));
    this.vuelta.textContent = `Vuelta ${v}/${sim.vueltasTotal}`;
    this.reloj.textContent = tiempoTexto(k.terminado ? k.tiempo : Math.max(0, sim.t));
    // Objeto (con ruleta mientras sale)
    if (k.objeto) {
      this.objeto.classList.add('lleno');
      if (k.ruleta > 0) {
        this.ruletaT += dt;
        if (this.ruletaT > 0.08) {
          this.ruletaT = 0;
          this.objImg.src = icono(ICONOS[(Math.random() * ICONOS.length) | 0]);
        }
        this.objeto.classList.add('ruleta');
        this.usos.textContent = '';
      } else {
        this.objeto.classList.remove('ruleta');
        const src = icono(k.objeto === 'tres' && k.usos < 3 ? 'chispa' : k.objeto);
        if (!this.objImg.src.endsWith(src.slice(1))) this.objImg.src = src;
        this.usos.textContent = k.objeto === 'tres' ? `×${k.usos}` : '';
        this.objImg.alt = OBJETOS[k.objeto].nombre;
      }
    } else {
      this.objeto.classList.remove('lleno', 'ruleta');
      this.objImg.removeAttribute('src');
      this.usos.textContent = '';
    }
    // Minimapa
    const g = this.mapa.getContext('2d')!;
    g.clearRect(0, 0, this.mapa.width, this.mapa.height);
    g.drawImage(this.fondoMapa, 0, 0);
    for (const otro of [...sim.karts].sort((a, b) => (a.i === mio ? 1 : b.i === mio ? -1 : 0))) {
      if (otro.invisible > 0 && otro.i !== mio) continue;
      const [x, y] = this.aMapa(otro.x, otro.z);
      g.beginPath();
      g.arc(x, y, otro.i === mio ? 5.5 : 4, 0, Math.PI * 2);
      g.fillStyle = otro.c.color;
      g.fill();
      g.lineWidth = otro.i === mio ? 2.5 : 1.5;
      g.strokeStyle = otro.i === mio ? '#fff' : 'rgba(40,24,30,0.8)';
      g.stroke();
    }
    for (const c of sim.cosas) {
      if (c.tipo !== 'lucero' && c.tipo !== 'brasa') continue;
      const [x, y] = this.aMapa(c.x, c.z);
      g.fillStyle = c.tipo === 'lucero' ? '#ffd27a' : '#ff6a2a';
      g.fillRect(x - 2, y - 2, 4, 4);
    }
    // Tabla de puestos (cortica)
    const filas = sim.orden.map((i, idx) => {
      const x = sim.karts[i];
      return `<li class="${i === mio ? 'yo' : ''}"><i style="background:${x.c.color}"></i>${idx + 1}. ${escapar(x.c.nombre)}</li>`;
    });
    const html = filas.join('');
    if (this.tabla.innerHTML !== html) this.tabla.innerHTML = html;
    if (this.globoHasta && performance.now() > this.globoHasta) {
      this.globoHasta = 0;
      this.globo.classList.remove('visible');
    }
    if (this.avisoHasta && performance.now() > this.avisoHasta) {
      this.avisoHasta = 0;
      this.aviso.classList.remove('visible');
    }
  }

  /** «3», «2», «1», «¡YA!» */
  cuentaRegresiva(texto: string) {
    this.cuenta.textContent = texto;
    this.cuenta.classList.remove('pum');
    void this.cuenta.offsetWidth;
    this.cuenta.classList.toggle('pum', !!texto);
  }

  avisar(texto: string, clase = '', ms = 1600) {
    this.aviso.textContent = texto;
    this.aviso.className = `car-aviso visible ${clase}`;
    this.avisoHasta = performance.now() + ms;
  }

  decir(quien: string, texto: string, seg: number) {
    (this.globo.querySelector('b') as HTMLElement).textContent = quien;
    (this.globo.querySelector('span') as HTMLElement).textContent = texto;
    this.globo.classList.add('visible');
    this.globoHasta = performance.now() + Math.max(1800, seg * 1000 + 600);
  }

  mostrar(si: boolean) {
    this.raiz.hidden = !si;
  }

  liberar() {
    this.raiz.remove();
  }
}

export const escapar = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
