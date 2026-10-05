// El tutorial interactivo (la primera vez, y se puede repetir desde el título): una etapa corta en un mapa hecho a
// mano, sin horda ni reloj, con globos que piden una cosa a la vez y esperan a que se haga: moverse, que las armas
// atacan solas, recoger almas y escoger una mejora, la habilidad activa, excavar, el objetivo (hierro negro), la
// campana de extracción y, al salir, la Forja.
import { aparecerEnemigo } from './sim/enemigos_ia';
import { TIPO } from './sim/catalogo';
import { xpPara } from './sim/jugador';
import type { Partida } from './partida';
import type { Mando } from './ui/mando';

interface Paso {
  titulo: string;
  texto: (tactil: boolean) => string;
  /** Pausa el juego hasta tocar «Entendido». */
  leer?: boolean;
  alEntrar?: (p: Partida) => void;
  listo: (p: Partida) => boolean;
}

export class Tutorial {
  private k = -1;
  private globo: HTMLElement | null = null;
  private t = 0;
  private inicio = { x: 0, y: 0 };
  private oleadaT = 0;
  private atraidas = false;

  constructor(private mando: Mando) {}

  private pasos: Paso[] = [
    {
      titulo: 'La Noche Eterna',
      texto: () => 'Bajaste a las catacumbas. Aquí abajo hay que juntar lo que se pueda y salir viva por la campana. Vamos paso a paso.',
      leer: true,
      listo: () => true,
    },
    {
      titulo: 'Moverse',
      texto: (t) => (t ? 'Pon el dedo en la mitad izquierda de la pantalla y arrástralo: ahí aparece el joystick.' : 'Muévete con W A S D o con las flechas.'),
      listo: (p) => {
        const j = p.local!;
        return Math.hypot(j.x - this.inicio.x, j.y - this.inicio.y) > 3;
      },
    },
    {
      titulo: 'Tus armas atacan solas',
      texto: () => 'No hay botón de atacar: tus armas le pegan solas al más cercano. Acércate a esos muertos y pon a prueba tu acero.',
      alEntrar: (p) => {
        const j = p.local!;
        const sim = p.sim!;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI - Math.PI / 2;
          const x = j.x + 5 + Math.cos(a) * 1.5, y = j.y + Math.sin(a) * 1.5;
          if (sim.mapa.libre(Math.floor(x), Math.floor(y))) aparecerEnemigo(sim, TIPO.zombi, x, y, { vida: 0.5 });
        }
      },
      listo: (p) => p.sim!.E.vivos === 0,
    },
    {
      titulo: 'Almas y mejoras',
      texto: () => 'Los muertos sueltan almas: recógelas pasando cerca. Llenan la barra de arriba y al subir de nivel escoges una mejora (el color es su rareza).',
      listo: (p) => {
        const j = p.local!;
        const sim = p.sim!;
        // Si ya recogió todo y no le alcanzó, una ayudita
        if (j.nivel < 2 && this.t > 7 && !this.atraidas) {
          // Si se demora, las almas vuelan solas hacia ella (y se ve cómo se recogen)
          this.atraidas = true;
          sim.atraerTodo(j);
        }
        if (j.nivel < 2 && this.t > 12) sim.ganarXp(xpPara(j.nivel) - j.xp + 1);
        return j.nivel >= 2 && j.cola.length === 0;
      },
    },
    {
      titulo: 'La habilidad',
      texto: (t) => `Cada clase tiene una habilidad propia. Cuando esté lista, ${t ? 'toca el botón redondo de abajo a la derecha' : 'aprieta la barra espaciadora'}. Aquí vienen más.`,
      alEntrar: (p) => {
        const j = p.local!;
        const sim = p.sim!;
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * Math.PI * 2;
          const x = j.x + Math.cos(a) * 4.5, y = j.y + Math.sin(a) * 4.5;
          if (sim.mapa.libre(Math.floor(x), Math.floor(y))) aparecerEnemigo(sim, TIPO.esqueleto, x, y, { vida: 0.6 });
        }
        j.habT = 0;
      },
      listo: (p) => (p.local!.habT > 0 || p.local!.habActiva > 0) && p.sim!.E.vivos === 0,
    },
    {
      titulo: 'Excavar',
      texto: () => 'Las paredes se excavan caminando contra ellas (la roca dura tarda más; la del borde, nunca). Al oriente hay una pared blanda: ábrete paso.',
      listo: (p) => p.local!.resumen.excavadas >= 4 || p.local!.x > 34,
    },
    {
      titulo: 'El objetivo',
      texto: () => 'Cada etapa tiene un objetivo (arriba a la izquierda). Aquí es excavar las vetas de hierro negro que brillan al fondo. El hierro sirve también en la Forja.',
      listo: (p) => p.sim!.obj.hecho,
    },
    {
      titulo: 'La campana de extracción',
      texto: () => '¡Cumpliste! Baja la campana: llega a su luz antes de que acabe la cuenta. Lo que no salga por la campana, se pierde.',
      listo: () => false,
    },
  ];

  alEmpezar(p: Partida) {
    const j = p.local;
    if (!j) return;
    this.inicio = { x: j.x, y: j.y };
    this.ir(p, 0);
  }

  private ir(p: Partida, k: number) {
    this.k = k;
    this.t = 0;
    const paso = this.pasos[k];
    if (!paso) {
      this.quitarGlobo();
      return;
    }
    paso.alEntrar?.(p);
    this.mostrar(p, paso);
  }

  private mostrar(p: Partida, paso: Paso) {
    this.quitarGlobo();
    const g = document.createElement('div');
    g.className = 'globo-tutorial pergamino';
    g.innerHTML = `<b>${paso.titulo}</b>${paso.texto(this.mando.tactil)}${paso.leer ? '<div class="fila-botones"><button class="boton boton-sangre" data-a="ok">Entendido</button></div>' : ''}`;
    document.body.append(g);
    this.globo = g;
    if (paso.leer) {
      p.pausaExterna = true;
      p.o.mando.activo = false;
      g.querySelector('[data-a="ok"]')!.addEventListener('click', () => {
        p.pausaExterna = false;
        p.o.mando.activo = true;
        this.ir(p, this.k + 1);
      });
    }
  }

  cuadro(p: Partida, dt: number) {
    if (this.k < 0 || !p.sim || !p.local) return;
    const paso = this.pasos[this.k];
    if (!paso || paso.leer) return;
    this.t += dt;
    // El globo se aparta mientras escoge una carta
    if (this.globo) this.globo.classList.toggle('escondido', p.eleccion.abierta);
    // Durante la extracción salen unos cuantos para que se sienta el apuro
    if (this.k === this.pasos.length - 1) {
      this.oleadaT -= dt;
      const sim = p.sim;
      if (this.oleadaT <= 0 && sim.E.vivos < 14) {
        this.oleadaT = 2.5;
        const j = p.local;
        const a = Math.random() * Math.PI * 2;
        const x = j.x + Math.cos(a) * 9, y = j.y + Math.sin(a) * 9;
        if (sim.mapa.libre(Math.floor(x), Math.floor(y))) aparecerEnemigo(sim, TIPO.zombi, x, y, { vida: 0.5 });
      }
    }
    if (this.t > 0.6 && paso.listo(p)) this.ir(p, this.k + 1);
  }

  pistaForja() {
    return 'La Forja sale entre etapas: con oro compras armas y objetos al mercader, en el yunque subes de nivel un arma con hierro negro y en el altar de sangre le pones una sobrecarga. Te dejamos algo para probar; al terminar, toca el botón rojo.';
  }

  private quitarGlobo() {
    this.globo?.remove();
    this.globo = null;
  }

  cerrar() {
    this.quitarGlobo();
    this.k = -1;
  }
}
