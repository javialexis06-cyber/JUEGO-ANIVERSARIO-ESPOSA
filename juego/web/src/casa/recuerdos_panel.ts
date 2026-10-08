// Recuerdos flotantes: mientras se bañan (o se quedan abrazados en la cama) sale una burbuja con un dibujito
// animado de los dos y lo que se dicen. En el baño son las cosas de todos los días del chat (la racha de Duolingo, la
// base de Minecraft, la fotito, la video silenciosa…) y discusiones bobas en las que nunca se ponen de acuerdo; en la
// cama, además, lo que sueñan para cuando vivan juntos. Los recuerdos grandes de la historia son de Cien Puertas y
// no se repiten aquí (cada juego cuenta cosas distintas: ver «Quién cuenta qué» en docs/la-pareja.md).
// Cada uno dura de 10 a 15 s y salen al azar.
import './recuerdos.css';
import type { Dicho } from '../puertas/historia';
import { ESCENAS, H, Movimiento, Pose, ponerReacciones, precargar, W } from './recuerdos_arte';
import { NOMBRE_ROL } from './modelo';
import { esc } from './ui_casa';

export type ModoRecuerdos = 'bano' | 'cama';

interface Vineta {
  titulo: string;
  sub?: string;
  dibujo: string;
  lineas: Dicho[];
}

/** Discusiones bobas de todos los días (las del chat y otras en las que nunca se ponen de acuerdo). */
const DISCUSIONES: Vineta[] = [
  { titulo: '¿Muak o betito?', dibujo: 'charla', lineas: [['el', 'Un muak no es lo mismo que un betito.'], ['ella', '¿Y cuál es la diferencia?'], ['el', 'El betito es en persona.'], ['ella', 'Entonces ven y dame uno.']] },
  { titulo: '¿Casi o se quemó?', dibujo: 'casa', lineas: [['el', 'La base de Minecraft casi se quema toda.'], ['ella', 'Se quemó.'], ['el', 'CASI.'], ['ella', 'Quedó un hueco negro, mor.']] },
  { titulo: '¿Y la racha?', dibujo: 'lapiz', lineas: [['ella', '¿Hiciste el Duolingo?'], ['el', 'Shi.'], ['ella', '¿Y la racha?'], ['el', '…mañana hago dos.']] },
  { titulo: '¿Fotito o no fotito?', dibujo: 'ojos', lineas: [['el', 'Mándame una fotito.'], ['ella', 'Ahorita no, estoy fea.'], ['el', 'Eso no existe.'], ['ella', '…bueno, una.']] },
  { titulo: '¿Para qué la video silenciosa?', dibujo: 'videollamada', lineas: [['ella', '¿Video silenciosa?'], ['el', '¿Y para qué, si no me hablas?'], ['ella', 'Para tenerte ahí.'], ['el', '…bueno, eso sí.']] },
  { titulo: '¿Te amo o te amodoro?', dibujo: 'charla', lineas: [['el', 'Te amodoro.'], ['ella', 'Eso no existe.'], ['el', 'Ahora sí: lo inventé para ti.'], ['ella', 'Ay deos… yo también te amodoro.']] },
  { titulo: '¿Quién cuelga primero?', dibujo: 'videollamada', lineas: [['ella', 'Cuelga tú.'], ['el', 'No, tú.'], ['ella', 'A la de tres: una, dos… tres.'], ['el', '…¿y por qué no colgaste?'], ['ella', '¿Y tú?']] },
  { titulo: '¿Ay deos o ay deoz?', dibujo: 'lapiz', lineas: [['el', 'Se escribe «ay deos».'], ['ella', 'Ay deoz. Con zeta.'], ['el', 'Eso no está en el diccionario.'], ['ella', 'Está en el nuestro.']] },
  { titulo: '¿Mor o amor?', dibujo: 'charla', lineas: [['el', '¿Por qué me dices «mor»?'], ['ella', 'Es «amor», pero con afán.'], ['el', 'Entonces dímelo despacito.'], ['ella', 'Amooor.'], ['el', 'Así sí.']] },
  { titulo: '¿Uwu o dos puntos tres?', dibujo: 'charla', lineas: [['el', 'Te mandé un uwu.'], ['ella', 'Eso es de niño chiquito.'], ['el', '¿Y el :3 qué?'], ['ella', 'El :3 es elegante.']] },
  { titulo: '¿Pera qué?', dibujo: 'ojos', lineas: [['ella', 'Pera.'], ['el', '¿Pera qué?'], ['ella', 'Pera, que ya casi.'], ['el', 'Llevo media hora con la pera.'], ['ella', '…pera.']] },
  { titulo: '¿Quién se durmió primero?', dibujo: 'estrellas', lineas: [['ella', 'Te dormiste en plena llamada.'], ['el', 'Tenía los ojos cerrados, pensando.'], ['ella', '¿Y el ronquido?'], ['el', 'Era el ventilador.']] },
  { titulo: '¿Quién apaga la luz?', dibujo: 'luces', lineas: [['el', 'Apágala tú, que estás más cerca.'], ['ella', 'Tú estás más cerca.'], ['el', 'Medio centímetro.'], ['ella', 'Medio centímetro es más cerca.']] },
  { titulo: '¿Cuántos días faltan?', dibujo: 'calendario', lineas: [['ella', '¿Cuántos días faltan para vernos?'], ['el', 'Doce.'], ['ella', 'Once y medio: hoy ya casi se acaba.'], ['el', 'Entonces once. Y contando.']] },
  { titulo: '¿Peli o serie?', dibujo: 'casa', lineas: [['el', 'Una peli.'], ['ella', 'Una serie.'], ['el', 'Una peli y un capítulo.'], ['ella', 'Trato. Pero yo escojo la peli.']] },
  { titulo: '¿Oki u okis?', dibujo: 'charla', lineas: [['el', 'Oki.'], ['ella', '¿Oki solito? ¿Así, seco?'], ['el', 'Okis, mi amor.'], ['ella', 'Eso. Okis es con cariño.']] },
];

/** Deseos a futuro (lo que sueñan para cuando vivan juntos). Lo de la niña es de Cien Puertas, lo de la comida de
 *  la cocina y los juegos de mesa de la mesa: aquí no se repiten. */
const DESEOS: Vineta[] = [
  { titulo: 'Algún día…', sub: 'Nuestra casita', dibujo: 'casa', lineas: [['el', 'Una casita propia, con jardín.'], ['ella', 'Y con un sofá grande para ver pelis.'], ['el', 'Y que siempre huela a desayuno.']] },
  { titulo: 'Algún día…', sub: 'La graduación', dibujo: 'birrete', lineas: [['el', 'Verte graduada de psicóloga.'], ['ella', 'Y tú en primera fila gritando mi nombre.'], ['el', 'Con pancarta y todo.']] },
  { titulo: 'Algún día…', sub: 'Sin distancia', dibujo: 'bus', lineas: [['ella', 'Que ya no haya que contar kilómetros.'], ['el', 'Que el único viaje sea de la cama a la cocina.'], ['ella', 'Juntos, todos los días.']] },
  { titulo: 'Algún día…', sub: 'Viejitos', dibujo: 'casa', lineas: [['ella', 'Viejitos, tomando tinto en el patio.'], ['el', 'Y yo contándote los mismos chistes.'], ['ella', 'Y yo riéndome igual que hoy.']] },
  { titulo: 'Algún día…', sub: 'Una boda con misterio', dibujo: 'lupa', lineas: [['ella', 'Que la boda tenga un juego: un crimen por mesa que los invitados tengan que resolver.'], ['el', '¿Y quién es el culpable?'], ['ella', 'Tú. Por robarme el corazón.']] },
  { titulo: 'Algún día…', sub: 'La lonchera', dibujo: 'casa', lineas: [['el', 'Cuando nos casemos te hago la lonchera todos los días.'], ['ella', '¿Y qué le vas a echar?'], ['el', 'Tu almuerzo favorito y una notica.']] },
  { titulo: 'Algún día…', sub: 'Almorzar en la casa', dibujo: 'casa', lineas: [['el', 'Cuando vivamos juntos voy a ir a la casa a almorzar.'], ['ella', 'Y yo te espero con la mesa puesta.'], ['el', 'Y betitos de postre.']] },
  { titulo: 'Algún día…', sub: 'La casa grande y vieja', dibujo: 'casa', lineas: [['el', 'Una casa grande y vieja, llena de cosas nuestras.'], ['ella', 'Con una hamaca en el patio.'], ['el', 'Para dos.']] },
  { titulo: 'Algún día…', sub: 'Todas las noches', dibujo: 'estrellas', lineas: [['el', 'Cuando vivamos juntitos: betitos todas las noches.'], ['ella', '¿Y en las mañanas?'], ['el', 'También. Y al mediodía.']] },
  { titulo: 'Algún día…', sub: 'Heladitos en el parque', dibujo: 'flor', lineas: [['el', 'Firmamos y nos vamos a comer heladitos al parque.'], ['ella', '¿Así no más?'], ['el', 'Así. Y después la fiesta, con todo.']] },
];

/** Cómo reacciona quien habla y quien escucha a una frase (por lo que dice). */
export function emocion(texto: string): { habla: Pose; oye: Pose | null; mov: Movimiento; movOye: Movimiento } {
  const t = texto.toLowerCase();
  if (/ja(ja)+|je(je)+|jaj|😂|🤣|cobarde|chiste|risa/.test(t)) return { habla: 'risa', oye: 'risa', mov: 'risa', movOye: 'risa' };
  if (/llor|triste|extrañ|😭|sniff|me doli|lejos|adiós|despedi/.test(t)) return { habla: 'llora', oye: 'abrazo', mov: 'temblor', movOye: 'vaiven' };
  if (/te amo|te quiero|beso|❤|💕|amor|mi vida|hermos|perfecta|bonita|lind|coraz|mi reina|mi princesa/.test(t)) return { habla: 'beso', oye: 'timido', mov: 'vaiven', movOye: 'vaiven' };
  if (/lo logr|ganamos|gané|¡sí|yay|🎉|increíble|por fin|feliz|graduad|campeon/.test(t)) return { habla: 'celebra', oye: 'celebra', mov: 'brinco', movOye: 'brinco' };
  if (/¡¿|¿¡|!!|en serio|no puede ser|wow|guau|qué\?|sorpresa|nunca/.test(t)) return { habla: 'sorpresa', oye: 'sorpresa', mov: 'asomo', movOye: 'asomo' };
  if (/bueno…|hmph|no es justo|ya verás|😤|insistente|me querías|¡tú nunca/.test(t)) return { habla: 'puchero', oye: 'guino', mov: 'temblor', movOye: 'vaiven' };
  if (/¿o no\?|obvio|claro que|yo sabía|te lo dije|persistente|los conté|funcionó|😎/.test(t)) return { habla: 'presume', oye: 'puchero', mov: 'vaiven', movOye: null };
  if (/\?$|creo|pienso|hmm|mmm|quizás|tal vez|me acuerdo|recuerdas/.test(t)) return { habla: 'piensa', oye: 'piensa', mov: 'vaiven', movOye: null };
  return { habla: 'habla', oye: null, mov: null, movOye: null };
}

/** Tiempos del panel (segundos). */
const NEBLINA = 1.1;
const PAUSA = 0.7;
const ANTES_DEL_TEXTO = 0.9;
const POR_LETRA = 0.045;
const LEER_POR_LETRA = 0.055;
const LEER_MIN = 2.4;
const ENTRE_FRASES = 0.45;

interface Frase {
  quien: 'el' | 'ella';
  texto: string;
  desde: number;
  escrita: number;
  hasta: number;
}

export class PanelRecuerdos {
  private raiz: HTMLElement;
  private lienzo: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private linea: HTMLElement;
  private niebla: HTMLElement;
  private modo: ModoRecuerdos | null = null;
  private actual: Vineta | null = null;
  private frases: Frase[] = [];
  private t0 = 0;
  /** Cuándo termina el recuerdo (después viene la neblina y la pausa). */
  private fin = 0;
  private recientes: string[] = [];
  private cuadro = 0;
  private cerrado = false;
  /** El fondo de la escena actual, pintado una sola vez. */
  private fondo: HTMLCanvasElement | null = null;
  private ultimoCuadro = 0;
  private escrito = '';

  constructor() {
    this.raiz = document.createElement('aside');
    this.raiz.className = 'recuerdo';
    this.raiz.hidden = true;
    this.raiz.innerHTML = `
      <button class="recuerdo-cerrar" aria-label="Cerrar">✕</button>
      <header><b class="recuerdo-titulo"></b><small class="recuerdo-sub"></small></header>
      <div class="recuerdo-lamina"><canvas width="640" height="340"></canvas><div class="recuerdo-niebla"></div></div>
      <p class="recuerdo-linea"></p>`;
    document.body.append(this.raiz);
    this.lienzo = this.raiz.querySelector('canvas')!;
    this.g = this.lienzo.getContext('2d')!;
    this.linea = this.raiz.querySelector('.recuerdo-linea')!;
    this.niebla = this.raiz.querySelector('.recuerdo-niebla')!;
    this.raiz.querySelector('.recuerdo-cerrar')!.addEventListener('click', () => {
      this.cerrado = true;
      this.ocultar();
    });
  }

  /** Empieza (o sigue) a pasar recuerdos. Si lo cerraron con la ✕, no vuelve hasta la próxima vez. */
  mostrar(modo: ModoRecuerdos) {
    if (this.modo === modo || this.cerrado) return;
    precargar();
    this.modo = modo;
    this.raiz.hidden = false;
    this.raiz.dataset.modo = modo;
    this.raiz.classList.remove('entra');
    void this.raiz.offsetWidth;
    this.raiz.classList.add('entra');
    this.siguiente(performance.now() / 1000);
    cancelAnimationFrame(this.cuadro);
    const bucle = (ms: number) => {
      if (!this.modo) return;
      this.cuadro = requestAnimationFrame(bucle);
      this.pintar(ms / 1000);
    };
    this.cuadro = requestAnimationFrame(bucle);
  }

  ocultar() {
    this.modo = null;
    this.raiz.hidden = true;
    ponerReacciones({});
    cancelAnimationFrame(this.cuadro);
  }

  /** Terminó el baño o se despertaron: la ✕ vale solo para esa vez. */
  reiniciar() {
    this.cerrado = false;
    this.ocultar();
  }

  get visible() {
    return !!this.modo;
  }

  /** El recuerdo siguiente: sus frases con el tiempo de escribirlas letra por letra y de leerlas con calma. */
  private siguiente(ahora: number) {
    const lista = this.modo === 'cama' ? [...DISCUSIONES, ...DESEOS, ...DESEOS] : DISCUSIONES;
    const libres = lista.filter((v) => !this.recientes.includes(v.titulo + (v.sub ?? '')));
    const v = (libres.length ? libres : lista)[Math.floor(Math.random() * (libres.length || lista.length))];
    this.recientes = [...this.recientes, v.titulo + (v.sub ?? '')].slice(-8);
    this.actual = v;
    this.fondo = null;
    // Unas 4 o 5 frases (las de más se dejan para otra vez)
    const n = Math.min(v.lineas.length, 5);
    const desde = v.lineas.length > n ? Math.floor(Math.random() * (v.lineas.length - n + 1)) : 0;
    this.t0 = ahora;
    let t = NEBLINA + ANTES_DEL_TEXTO;
    this.frases = v.lineas.slice(desde, desde + n).map(([quien, texto]) => {
      const txt = forma(texto, quien);
      const escrita = t + txt.length * POR_LETRA;
      const f = { quien, texto: txt, desde: t, escrita, hasta: escrita + Math.max(LEER_MIN, txt.length * LEER_POR_LETRA) };
      t = f.hasta + ENTRE_FRASES;
      return f;
    });
    this.fin = t;
    this.escrito = '';
    this.linea.innerHTML = '';
    const tipo = DISCUSIONES.includes(v) ? 'Discusión boba' : v.sub ?? '';
    this.raiz.querySelector('.recuerdo-titulo')!.textContent = v.titulo;
    this.raiz.querySelector('.recuerdo-sub')!.textContent = tipo;
  }

  private pintar(t: number) {
    const v = this.actual;
    if (!v) return;
    const k = t - this.t0;
    if (k > this.fin + NEBLINA + PAUSA) return this.siguiente(t);
    // Neblina: se despeja al empezar y vuelve a cubrir al terminar (como pasar de diapositiva)
    const entra = Math.max(0, 1 - k / NEBLINA);
    const sale = Math.min(1, Math.max(0, (k - this.fin) / NEBLINA));
    const niebla = Math.max(entra, sale);
    this.niebla.style.opacity = niebla.toFixed(3);
    this.lienzo.style.filter = niebla > 0.01 ? `blur(${(niebla * 6).toFixed(2)}px)` : '';
    // La frase de ahora, escribiéndose letra por letra
    const f = this.frases.find((x) => k >= x.desde && k < x.hasta + ENTRE_FRASES) ?? null;
    let html = '';
    if (f && k < this.fin) {
      const n = Math.min(f.texto.length, Math.floor((k - f.desde) / POR_LETRA));
      const escribiendo = n < f.texto.length;
      html = `<span class="quien-${f.quien}">${NOMBRE_ROL[f.quien === 'el' ? 'el' : 'ella']}</span>${esc(f.texto.slice(0, n))}${escribiendo ? '<i class="cursor"></i>' : ''}`;
      // Reacciones: quien habla y quien escucha, toda la frase
      const e = emocion(f.texto);
      const otro = f.quien === 'el' ? 'ella' : 'el';
      ponerReacciones({
        [f.quien]: { pose: e.habla, mov: e.mov, desde: f.desde },
        ...(e.oye ? { [otro]: { pose: e.oye, mov: e.movOye, desde: f.desde } } : {}),
      });
    } else ponerReacciones({});
    if (html !== this.escrito) {
      this.escrito = html;
      this.linea.innerHTML = html;
      this.linea.style.opacity = String(1 - sale);
    }
    // Unos 30 cuadros por segundo bastan (la casa se sigue dibujando detrás)
    if (t - this.ultimoCuadro < 1 / 30) return;
    this.ultimoCuadro = t;
    const escena = ESCENAS[v.dibujo] ?? ESCENAS.casa;
    const g = this.g;
    if (!this.fondo) {
      this.fondo = document.createElement('canvas');
      this.fondo.width = W * 2;
      this.fondo.height = H * 2;
      const gf = this.fondo.getContext('2d')!;
      gf.scale(2, 2);
      escena.fondo(gf);
    }
    g.drawImage(this.fondo, 0, 0);
    g.save();
    g.scale(2, 2);
    // (las escenas cuentan el tiempo desde que empezó el recuerdo)
    escena.frente(g, k, f && k < this.fin ? f.quien : null);
    g.restore();
  }
}

/** «orgullos{a|o}»: la primera forma cuando habla Ella, la segunda cuando habla Él. */
const forma = (texto: string, quien: 'el' | 'ella') => texto.replace(/\{([^|}]*)\|([^}]*)\}/g, (_, a, o) => (quien === 'ella' ? a : o));
