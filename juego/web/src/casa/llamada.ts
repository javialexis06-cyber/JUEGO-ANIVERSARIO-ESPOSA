// Mensajes de voz de la casa, como una llamada: quien lo regala graba hasta 30 segundos; al otro le suena el
// teléfono (timbre y vibración), contesta y lo oye con la carita de quien llama; después queda en el buzón.
import * as sonido from '../sonido';
import { enPausa } from '../segundo_plano';
import type { Rol } from './modelo';
import { caraClase, esc } from './ui_casa';

/** Segundos máximos de un mensaje. */
export const MAX_VOZ = 30;
/** Lo que cuesta dejar un mensaje de voz (monedas de la casa). */
export const PRECIO_VOZ = 4;
/** Cariño que sube al oír un mensaje nuevo. */
export const CARINO_VOZ = 20;

export interface Grabacion {
  blob: Blob;
  dur: number;
}

const TIPOS = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

/** Graba del micrófono (con el volumen del momento, para dibujar la onda). */
export class Grabadora {
  private rec: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private partes: Blob[] = [];
  private t0 = 0;
  private ctx: AudioContext | null = null;
  private an: AnalyserNode | null = null;
  private datos = new Uint8Array(512);

  get grabando() {
    return !!this.rec;
  }
  get segundos() {
    return this.rec ? (performance.now() - this.t0) / 1000 : 0;
  }

  async empezar() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('Este celular no deja grabar audio aquí.');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch {
      throw new Error('Hay que darle permiso al micrófono para grabar el mensaje.');
    }
    const tipo = TIPOS.find((t) => MediaRecorder.isTypeSupported?.(t));
    this.rec = new MediaRecorder(this.stream, { ...(tipo ? { mimeType: tipo } : {}), audioBitsPerSecond: 32000 });
    this.partes = [];
    this.rec.ondataavailable = (e) => {
      if (e.data.size) this.partes.push(e.data);
    };
    this.rec.start(250);
    this.t0 = performance.now();
    try {
      this.ctx = new AudioContext();
      this.an = this.ctx.createAnalyser();
      this.an.fftSize = 512;
      this.ctx.createMediaStreamSource(this.stream).connect(this.an);
    } catch {
      this.an = null;
    }
  }

  /** Volumen actual de 0 a 1. */
  nivel() {
    if (!this.an) return this.rec ? 0.3 + Math.random() * 0.3 : 0;
    this.an.getByteTimeDomainData(this.datos);
    let s = 0;
    for (const v of this.datos) s += ((v - 128) / 128) ** 2;
    return Math.min(1, Math.sqrt(s / this.datos.length) * 5);
  }

  parar(): Promise<Grabacion> {
    const rec = this.rec;
    if (!rec) return Promise.reject(new Error('No se estaba grabando.'));
    const dur = Math.min(MAX_VOZ, this.segundos);
    return new Promise((ok) => {
      rec.onstop = () => {
        const blob = new Blob(this.partes, { type: rec.mimeType || 'audio/webm' });
        this.soltar();
        ok({ blob, dur });
      };
      rec.stop();
    });
  }

  cancelar() {
    try {
      if (this.rec?.state === 'recording') this.rec.stop();
    } catch {
      /* ya estaba parada */
    }
    this.soltar();
  }

  private soltar() {
    for (const t of this.stream?.getTracks() ?? []) t.stop();
    void this.ctx?.close().catch(() => {});
    this.rec = null;
    this.stream = null;
    this.ctx = null;
    this.an = null;
  }
}

// ---------------------------------------------------------------------------
// Timbre
// ---------------------------------------------------------------------------
let timbre = 0;
export function sonarTimbre() {
  pararTimbre();
  const uno = () => {
    // En segundo plano no timbra ni vibra (sigue al volver, si nadie ha contestado)
    if (enPausa()) return;
    // Marimba de celular: dos frases cortas y vibración
    [988, 784, 988, 1175, 988, 784].forEach((f, i) => sonido.nota(f, 0.11, i * 0.13, 'triangle', 0.1));
    navigator.vibrate?.([350, 180, 350]);
  };
  uno();
  timbre = window.setInterval(uno, 2300);
}
export function pararTimbre() {
  clearInterval(timbre);
  timbre = 0;
  navigator.vibrate?.(0);
}

// ---------------------------------------------------------------------------
// Pantallas
// ---------------------------------------------------------------------------
function capa(): HTMLElement {
  let el = document.getElementById('llamada');
  if (!el) {
    el = document.createElement('section');
    el.id = 'llamada';
    el.className = 'llamada';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.hidden = true;
    document.body.appendChild(el);
  }
  return el;
}

const reloj = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const barras = (n = 24) => `<div class="onda" aria-hidden="true">${'<i></i>'.repeat(n)}</div>`;

/** Mueve las barritas de la onda según el volumen. */
function moverOnda(el: HTMLElement, nivel: number) {
  const bs = el.querySelectorAll<HTMLElement>('.onda i');
  bs.forEach((b, i) => {
    const k = Math.max(0.08, Math.min(1, nivel * (0.55 + 0.45 * Math.sin(performance.now() / 90 + i * 1.7))));
    b.style.transform = `scaleY(${k.toFixed(2)})`;
  });
}

function cerrar() {
  const el = capa();
  el.hidden = true;
  el.innerHTML = '';
  el.className = 'llamada';
}

export interface OpGrabar {
  para: Rol;
  nombre: string;
  precio: number;
  monedas: number;
}

/** Pantalla para grabar el mensaje. Devuelve la grabación al tocar «Enviar» (o null si se cancela). */
export function grabarMensaje(op: OpGrabar): Promise<Grabacion | null> {
  const el = capa();
  const g = new Grabadora();
  let grabacion: Grabacion | null = null;
  let url = '';
  let audio: HTMLAudioElement | null = null;
  let anim = 0;
  el.className = 'llamada saliente';
  el.hidden = false;
  return new Promise((listo) => {
    const salir = (r: Grabacion | null) => {
      cancelAnimationFrame(anim);
      g.cancelar();
      audio?.pause();
      if (url) URL.revokeObjectURL(url);
      cerrar();
      listo(r);
    };
    const pintar = (estado: 'listo' | 'grabando' | 'grabado', aviso = '') => {
      const alcanza = op.monedas >= op.precio;
      el.innerHTML = `<div class="tel">
        <button class="boton-redondo boton-cerrar tel-x" data-tel="cancelar" aria-label="Cancelar"></button>
        <p class="tel-arriba">Mensaje de voz para</p>
        <span class="tel-cara chip-cara ${caraClase(op.para)}${estado === 'grabando' ? ' latiendo' : ''}"></span>
        <h2>${esc(op.nombre)}</h2>
        <p class="tel-estado">${
          estado === 'listo' ? `Toca el botón y háblale (hasta ${MAX_VOZ} segundos)` : estado === 'grabando' ? `<b class="tel-reloj">0:00</b> / ${reloj(MAX_VOZ)}` : `Listo: ${reloj(grabacion?.dur ?? 0)}`
        }</p>
        ${estado === 'grabando' ? barras() : '<div class="onda vacia"></div>'}
        ${aviso ? `<p class="tel-aviso">${esc(aviso)}</p>` : ''}
        <div class="tel-botones">${
          estado === 'listo'
            ? `<button class="tel-boton grabar" data-tel="grabar" aria-label="Grabar"><i></i></button>`
            : estado === 'grabando'
              ? `<button class="tel-boton parar" data-tel="parar" aria-label="Terminar"><i></i></button>`
              : `<button class="tel-boton chico otra" data-tel="otra"><i></i><span>Otra vez</span></button>
                 <button class="tel-boton chico oir" data-tel="oir"><i></i><span>Oír</span></button>
                 <button class="tel-boton enviar" data-tel="enviar" ${alcanza ? '' : 'disabled'}><i></i><span>Enviar · <i class="moneda"></i>${op.precio}</span></button>`
        }</div>
        ${estado === 'grabado' && !alcanza ? `<p class="tel-aviso">Faltan monedas: tienen ${op.monedas}.</p>` : ''}
      </div>`;
    };
    const cada = () => {
      if (g.grabando) {
        const t = g.segundos;
        const r = el.querySelector('.tel-reloj');
        if (r) r.textContent = reloj(t);
        moverOnda(el, g.nivel());
        if (t >= MAX_VOZ) void parar();
      }
      anim = requestAnimationFrame(cada);
    };
    const parar = async () => {
      if (!g.grabando) return;
      grabacion = await g.parar();
      sonido.toque();
      if (grabacion.dur < 0.8) {
        grabacion = null;
        return pintar('listo', 'Muy cortito. Mantén el mensaje un poquito más.');
      }
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(grabacion.blob);
      pintar('grabado');
    };
    el.onclick = async (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-tel]');
      if (!b) return;
      const que = b.dataset.tel;
      if (que === 'cancelar') return salir(null);
      if (que === 'grabar' || que === 'otra') {
        audio?.pause();
        try {
          await g.empezar();
          sonido.nota(880, 0.08, 0, 'sine', 0.06);
          pintar('grabando');
        } catch (err) {
          pintar('listo', err instanceof Error ? err.message : 'No se pudo grabar.');
        }
      } else if (que === 'parar') await parar();
      else if (que === 'oir' && url) {
        audio?.pause();
        audio = new Audio(url);
        void audio.play().catch(() => {});
      } else if (que === 'enviar' && grabacion) {
        const r = grabacion;
        grabacion = null;
        salir(r);
      }
    };
    pintar('listo');
    anim = requestAnimationFrame(cada);
  });
}

/** Llamada entrante: suena hasta que se conteste (true) o se deje para después (false). */
export function llamadaEntrante(op: { de: Rol; nombre: string; dur: number }): Promise<boolean> {
  const el = capa();
  el.className = 'llamada entrante';
  el.hidden = false;
  el.innerHTML = `<div class="tel">
      <p class="tel-arriba">Llamada de la casa</p>
      <span class="tel-cara chip-cara ${caraClase(op.de)} latiendo"></span>
      <h2>${esc(op.nombre)}</h2>
      <p class="tel-estado">te dejó un mensaje de voz · ${reloj(op.dur)}</p>
      <div class="tel-botones">
        <button class="tel-boton colgar" data-tel="despues"><i></i><span>Después</span></button>
        <button class="tel-boton contestar" data-tel="contestar"><i></i><span>Contestar</span></button>
      </div>
    </div>`;
  sonarTimbre();
  return new Promise((listo) => {
    const fin = (si: boolean) => {
      clearTimeout(t);
      pararTimbre();
      el.onclick = null;
      if (!si) cerrar();
      listo(si);
    };
    const t = setTimeout(() => fin(false), 30000);
    el.onclick = (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-tel]');
      if (b) fin(b.dataset.tel === 'contestar');
    };
  });
}

/** En la llamada: suena el mensaje con la carita de quien lo dejó. Devuelve si quiere responder. */
export function enLlamada(op: { de: Rol; nombre: string; url: string; dur: number; puedeResponder: boolean }): Promise<'colgar' | 'responder'> {
  const el = capa();
  el.className = 'llamada en-curso';
  el.hidden = false;
  const audio = new Audio(op.url);
  let anim = 0;
  let termino = false;
  const pintar = () => {
    el.innerHTML = `<div class="tel">
      <p class="tel-arriba">${termino ? 'Fin del mensaje' : 'En llamada'}</p>
      <span class="tel-cara chip-cara ${caraClase(op.de)}${termino ? '' : ' hablando'}"></span>
      <h2>${esc(op.nombre)}</h2>
      <p class="tel-estado"><b class="tel-reloj">0:00</b> / ${reloj(op.dur)}</p>
      ${barras()}
      <div class="tel-botones">
        ${termino ? `<button class="tel-boton chico oir" data-tel="otra"><i></i><span>Oír otra vez</span></button>` : ''}
        <button class="tel-boton colgar" data-tel="colgar"><i></i><span>Colgar</span></button>
        ${termino && op.puedeResponder ? `<button class="tel-boton contestar" data-tel="responder"><i></i><span>Responder</span></button>` : ''}
      </div>
    </div>`;
  };
  pintar();
  return new Promise((listo) => {
    const fin = (r: 'colgar' | 'responder') => {
      cancelAnimationFrame(anim);
      audio.pause();
      el.onclick = null;
      cerrar();
      listo(r);
    };
    const cada = () => {
      const r = el.querySelector('.tel-reloj');
      if (r) r.textContent = reloj(audio.currentTime || 0);
      moverOnda(el, termino || audio.paused ? 0 : 0.45 + Math.random() * 0.4);
      anim = requestAnimationFrame(cada);
    };
    audio.onended = () => {
      termino = true;
      pintar();
    };
    audio.onerror = () => {
      termino = true;
      pintar();
      const e = el.querySelector('.tel-estado');
      if (e) e.textContent = 'No se pudo oír el mensaje. Revisa el internet.';
    };
    el.onclick = (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-tel]');
      if (!b) return;
      if (b.dataset.tel === 'otra') {
        termino = false;
        pintar();
        audio.currentTime = 0;
        void audio.play().catch(() => {});
      } else fin(b.dataset.tel as 'colgar' | 'responder');
    };
    sonido.nota(660, 0.08, 0, 'sine', 0.05);
    void audio.play().catch(() => {
      termino = true;
      pintar();
    });
    anim = requestAnimationFrame(cada);
  });
}
