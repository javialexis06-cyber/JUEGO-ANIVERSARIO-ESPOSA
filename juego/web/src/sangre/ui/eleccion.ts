// Las cartas de pergamino para escoger: subir de nivel, sobrecargas, cofres, bendiciones y equipo. Con volver a tirar,
// descartar (vetar) y, en grupo, una cuenta regresiva (el juego no se detiene para los demás).
import { NOMBRE_RAREZA, type Eleccion, type Opcion } from '../tipos';
import { RAREZA_COLOR, glifo, icono, medalla } from './iconos';

const $ = (id: string) => document.getElementById(id)!;

const TIPO_TXT: Record<string, string> = {
  stat: 'Mejora', arma: 'Entrenar arma', nueva: 'Arma nueva', don: 'Don de la clase', oro: 'Oro', vida: 'Curación', sobrecarga: 'Sobrecarga', evolucion: 'Evolución',
  bendicion: 'Bendición', equipo: 'Equipo', reliquia: 'Reliquia',
};

export interface OpcionesEleccion {
  tiradas: number;
  vetos: number;
  /** Segundos que quedan para escoger (en grupo); null = sin apuro. */
  tiempo: number | null;
  alEscoger: (k: number) => void;
  alTirar: () => void;
  alVetar: (k: number) => void;
}

export class VistaEleccion {
  private el = $('eleccion');
  private actual: Eleccion | null = null;
  private vetando = false;
  private o: OpcionesEleccion | null = null;
  private clave = '';

  get abierta() {
    return !this.el.hidden;
  }

  mostrar(e: Eleccion, o: OpcionesEleccion) {
    const clave = JSON.stringify([e.titulo, e.opciones.map((x) => x.id + x.rareza), o.tiradas, o.vetos, this.vetando]);
    this.o = o;
    if (clave === this.clave && !this.el.hidden) {
      this.ponerTiempo(o.tiempo);
      return;
    }
    this.clave = clave;
    this.actual = e;
    const sub = e.motivo === 'nivel' ? 'Escoge una mejora' : e.motivo === 'sobrecarga' ? 'Cambia cómo funciona el arma' : e.motivo === 'bendicion' ? 'Un santo oscuro te escucha' : 'Escoge una';
    const cartas = e.opciones.map((op, k) => {
      const color = RAREZA_COLOR[op.rareza] ?? RAREZA_COLOR[0];
      const clases = op.rareza === 4 ? 'leg' : op.rareza === 3 ? 'epi' : '';
      const rareza = op.tipo === 'stat' || op.tipo === 'arma' || op.tipo === 'equipo' ? NOMBRE_RAREZA[op.rareza] : op.tipo === 'don' ? `Nivel ${op.nivel}` : '';
      return `<button class="carta pergamino ${clases}" data-k="${k}" style="--rareza:${color}">
        <span class="marco"></span>
        <span class="rareza">${rareza}</span>
        <span class="ico ico-carta">${op.icono ? icono(op.glifo, op.icono) : medallaDe(op)}</span>
        <h3>${op.nombre}</h3>
        <p>${op.desc}</p>
        <span class="tipo">${op.tipo === 'sobrecarga' && op.rareza === 4 ? 'Sobrecarga maldita' : TIPO_TXT[op.tipo] ?? ''}</span>
        ${this.vetando && e.motivo === 'nivel' && op.tipo !== 'oro' && op.tipo !== 'vida' ? `<span class="vetar">${glifo('tijeras')}</span>` : ''}
      </button>`;
    }).join('');
    const tirar = e.motivo !== 'sobrecarga' && o.tiradas > 0 ? `<button class="boton" data-a="tirar">${glifo('dado')}Volver a tirar (${o.tiradas})</button>` : '';
    const vetar = e.motivo === 'nivel' && o.vetos > 0 ? `<button class="boton${this.vetando ? ' boton-sangre' : ''}" data-a="vetar">${glifo('tijeras')}${this.vetando ? 'Toca la que sobra' : `Descartar (${o.vetos})`}</button>` : '';
    this.el.innerHTML = `<h2>${e.titulo}</h2><span class="sub">${sub}</span><div class="cartas">${cartas}</div><div class="eleccion-pie">${tirar}${vetar}<span class="tiempo" data-e="tiempo"></span></div>`;
    this.el.hidden = false;
    for (const b of this.el.querySelectorAll<HTMLElement>('.carta')) {
      b.addEventListener('click', () => {
        const k = Number(b.dataset.k);
        if (this.vetando) {
          this.vetando = false;
          this.o?.alVetar(k);
        } else this.o?.alEscoger(k);
      });
    }
    this.el.querySelector('[data-a="tirar"]')?.addEventListener('click', () => this.o?.alTirar());
    this.el.querySelector('[data-a="vetar"]')?.addEventListener('click', () => {
      this.vetando = !this.vetando;
      this.clave = '';
      if (this.actual && this.o) this.mostrar(this.actual, this.o);
    });
    this.ponerTiempo(o.tiempo);
  }

  private ponerTiempo(t: number | null) {
    const el = this.el.querySelector('[data-e="tiempo"]');
    if (el) el.textContent = t === null ? '' : `${Math.ceil(t)} s (el juego sigue)`;
  }

  /** Escoger con el teclado (1-4). */
  tecla(n: number) {
    if (this.el.hidden || !this.actual || n < 1 || n > this.actual.opciones.length) return;
    this.o?.alEscoger(n - 1);
  }

  cerrar() {
    this.el.hidden = true;
    this.actual = null;
    this.vetando = false;
    this.clave = '';
  }
}

/** La medalla de una carta: reliquias, equipo, objetos y lo demás (mejoras, dones, bendiciones) como mejora. */
function medallaDe(op: Opcion): string {
  if (op.tipo === 'reliquia') return medalla('reliquia', op.glifo);
  if (op.tipo === 'equipo') return medalla(op.id.startsWith('obj:') ? 'objeto' : 'equipo', op.glifo);
  if (op.tipo === 'arma' || op.tipo === 'nueva' || op.tipo === 'evolucion' || op.tipo === 'sobrecarga') return icono(op.glifo);
  return medalla('mejora', op.glifo);
}
