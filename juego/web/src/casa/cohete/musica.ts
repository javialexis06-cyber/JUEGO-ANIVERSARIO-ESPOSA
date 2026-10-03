// Música del retrete espacial: una por tramo (alegre en el cielo del barrio, flotante en la órbita, soñadora en la
// Luna, tensa en Marte, con empuje en el cinturón, brillante en la nebulosa y romántica en la galaxia del amor).
// Sintetizada en vivo con las notas de sonido.ts, bajita para que no estorbe.
import { musica, nota, rumor } from '../../sonido';

interface Tema {
  bpm: number;
  /** Acordes (notas MIDI), uno por compás. */
  acordes: number[][];
  bajo: number[];
  /** Patrón del arpegio por corchea (índice en el acorde, -1 silencio). */
  arpegio: number[];
  tipoArpegio: OscillatorType;
  /** Melodía: [compás, corchea, nota] (se repite cada 4 compases). */
  melodia: [number, number, number][];
  bombo: number[];
  platillo: boolean;
}

const TEMAS: Tema[] = [
  // Cielo del barrio: do mayor saltarín (cumbiecita espacial)
  {
    bpm: 104, acordes: [[60, 64, 67], [57, 60, 64], [65, 69, 72], [67, 71, 74]], bajo: [36, 33, 41, 43],
    arpegio: [0, 1, 2, 1, 0, 2, 1, 2], tipoArpegio: 'triangle',
    melodia: [[0, 0, 76], [0, 3, 79], [0, 6, 76], [1, 0, 74], [1, 4, 72], [2, 0, 77], [2, 3, 81], [2, 6, 79], [3, 0, 79], [3, 4, 83]],
    bombo: [0, 4], platillo: true,
  },
  // Órbita: la menor flotante
  {
    bpm: 90, acordes: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]], bajo: [33, 29, 31, 28],
    arpegio: [0, 2, 3, 1, 2, 3, 1, 2], tipoArpegio: 'sine',
    melodia: [[0, 0, 76], [0, 4, 72], [1, 0, 77], [1, 6, 76], [2, 0, 74], [2, 4, 71], [3, 0, 72]],
    bombo: [0], platillo: false,
  },
  // La Luna: re mayor soñador
  {
    bpm: 84, acordes: [[62, 66, 69, 73], [59, 62, 66, 69], [67, 71, 74, 78], [64, 67, 71, 74]], bajo: [38, 35, 43, 40],
    arpegio: [0, 1, 2, 3, 2, 1, -1, 1], tipoArpegio: 'sine',
    melodia: [[0, 0, 78], [0, 6, 76], [1, 2, 74], [2, 0, 79], [2, 4, 81], [3, 0, 78]],
    bombo: [0], platillo: false,
  },
  // Marte: mi menor tenso
  {
    bpm: 100, acordes: [[52, 55, 59], [48, 52, 55], [50, 54, 57], [47, 50, 54]], bajo: [28, 24, 26, 23],
    arpegio: [0, 0, 1, 0, 2, 0, 1, 2], tipoArpegio: 'triangle',
    melodia: [[0, 0, 71], [0, 3, 74], [1, 0, 72], [1, 4, 67], [2, 0, 69], [2, 4, 74], [3, 0, 71]],
    bombo: [0, 3, 4], platillo: true,
  },
  // Cinturón: sol mayor con empuje
  {
    bpm: 112, acordes: [[55, 59, 62], [52, 55, 59], [60, 64, 67], [62, 66, 69]], bajo: [31, 28, 36, 38],
    arpegio: [0, 1, 2, 0, 1, 2, 0, 2], tipoArpegio: 'square',
    melodia: [[0, 0, 79], [0, 2, 78], [0, 4, 74], [1, 0, 76], [1, 4, 71], [2, 0, 72], [2, 2, 76], [2, 4, 79], [3, 0, 78]],
    bombo: [0, 2, 4, 6], platillo: true,
  },
  // Nebulosa: fa lidio brillante
  {
    bpm: 96, acordes: [[53, 57, 60, 64], [55, 59, 62, 67], [57, 60, 64, 69], [50, 53, 57, 60]], bajo: [29, 31, 33, 26],
    arpegio: [0, 1, 2, 3, 1, 2, 3, 2], tipoArpegio: 'sine',
    melodia: [[0, 0, 81], [0, 4, 79], [1, 0, 83], [1, 4, 81], [2, 0, 84], [3, 0, 79], [3, 4, 77]],
    bombo: [0, 4], platillo: true,
  },
  // Galaxia del amor: si bemol romántico
  {
    bpm: 88, acordes: [[58, 62, 65, 69], [55, 58, 62, 65], [51, 55, 58, 62], [53, 57, 60, 63]], bajo: [34, 31, 27, 29],
    arpegio: [0, 2, 1, 3, 2, 1, 2, 3], tipoArpegio: 'sine',
    melodia: [[0, 0, 77], [0, 3, 74], [0, 6, 77], [1, 0, 79], [1, 4, 74], [2, 0, 75], [2, 4, 77], [3, 0, 77]],
    bombo: [0], platillo: false,
  },
];

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class MusicaEspacial {
  private reloj: ReturnType<typeof setInterval> | null = null;
  private tema = 0;
  private siguienteTema = 0;
  private paso = 0;
  private proxima = 0;
  /** 1 normal; con el turbo va un poco más rápido. */
  prisa = 1;
  private parada = false;

  iniciar() {
    if (this.reloj) return;
    this.parada = false;
    this.proxima = performance.now() + 120;
    this.reloj = setInterval(() => this.programar(), 50);
  }

  /** Cambia de tramo (entra en el próximo compás). */
  tramo(i: number) {
    this.siguienteTema = Math.max(0, Math.min(TEMAS.length - 1, i));
  }

  pausar(si: boolean) {
    this.parada = si;
    if (!si) this.proxima = performance.now() + 80;
  }

  detener() {
    if (this.reloj) clearInterval(this.reloj);
    this.reloj = null;
  }

  private programar() {
    if (this.parada) return;
    const ahora = performance.now();
    // Si el reloj se atrasó (celular ocupado), se salta lo perdido
    if (this.proxima < ahora - 300) this.proxima = ahora + 40;
    while (this.proxima < ahora + 220) {
      const corchea = (60 / (TEMAS[this.tema].bpm * this.prisa) / 2) * 1000;
      if (!musica.apagada()) this.tocar(this.paso, (this.proxima - ahora) / 1000, corchea / 1000);
      this.proxima += corchea;
      this.paso = (this.paso + 1) % 32;
      if (this.paso % 8 === 0 && this.siguienteTema !== this.tema) {
        this.tema = this.siguienteTema;
        this.paso = 0;
      }
    }
  }

  private tocar(paso: number, cuando: number, corchea: number) {
    const t = TEMAS[this.tema];
    const compas = Math.floor(paso / 8), k = paso % 8;
    const ac = t.acordes[compas % t.acordes.length];
    // Bajo largo al empezar el compás y un toquecito a la mitad
    if (k === 0) nota(hz(t.bajo[compas % t.bajo.length]), corchea * 3.6, cuando, 'triangle', 0.075);
    if (k === 4) nota(hz(t.bajo[compas % t.bajo.length] + 7), corchea * 1.8, cuando, 'triangle', 0.05);
    // Colchón suave (acorde largo)
    if (k === 0) for (const n of ac) nota(hz(n), corchea * 7.5, cuando, 'sine', 0.012);
    // Arpegio
    const a = t.arpegio[k];
    if (a >= 0) nota(hz(ac[a % ac.length] + 12), corchea * 1.4, cuando, t.tipoArpegio, t.tipoArpegio === 'square' ? 0.008 : 0.02);
    // Melodía (con un eco suave dos octavas arriba)
    for (const [c, kk, n] of t.melodia) {
      if (c === compas && kk === k) {
        nota(hz(n), corchea * 2.6, cuando, 'sine', 0.032);
        nota(hz(n + 24), corchea * 0.6, cuando, 'sine', 0.006);
      }
    }
    // Percusión: bombo y platillo de escobilla
    if (t.bombo.includes(k)) nota(110, 0.16, cuando, 'sine', 0.09, 40);
    if (t.platillo && k % 2 === 1) rumor(0.05, 8500, 0.012, cuando, 1.2);
  }
}
