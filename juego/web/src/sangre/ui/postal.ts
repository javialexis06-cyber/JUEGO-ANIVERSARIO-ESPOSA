// La presentación de cada lugar de Sangre y Ceniza (docs/en-obra/pelicula-de-astra.md, capítulo 6 bis): la primera vez
// que se baja a un bioma, el mundo se detiene, la cámara se aleja girando sobre el mapa con franjas de cine, sale el
// nombre del lugar y el narrador lo presenta (la misma voz de las postales de la granja, LUG.<bioma>). Se salta con un
// toque, Escape o Espacio. Lo visto se recuerda en este teléfono. Las líneas no nombran a la pareja: también la ven los
// amigos.
import { POSTALES_SANGRE as POSTALES } from '../datos/postales';
import { CON_PAREJA } from '../historia_pareja';
import { BIOMAS } from '../datos/mundo';
import type { Escena3D } from '../vista/escena';

const CLAVE = 'sangre-postales-vistas';
function vistas(): Set<string> { try { return new Set(JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as string[]); } catch { return new Set(); } }
function marcar(id: string) { try { const v = vistas(); v.add(id); localStorage.setItem(CLAVE, JSON.stringify([...v])); } catch { /* sin almacenamiento */ } }

let voces: Promise<Record<string, { archivo: string; seg: number }>> | null = null;
let enCurso = false;

let estilo = false;
function ponerEstilo() {
  if (estilo) return;
  estilo = true;
  const css = document.createElement('style');
  css.textContent = `body.en-postal-sangre #hud,body.en-postal-sangre .mando,body.en-postal-sangre .joystick{visibility:hidden!important}
.postal-sangre{position:fixed;inset:0;z-index:60;pointer-events:auto;opacity:0;transition:opacity .6s}
.postal-sangre.visible{opacity:1}
.postal-sangre .ps-franja{position:absolute;left:0;right:0;height:11%;background:#000}
.postal-sangre .ps-franja.arriba{top:0}.postal-sangre .ps-franja.abajo{bottom:0}
.postal-sangre .ps-nombre{position:absolute;left:0;right:0;top:17%;text-align:center;color:#f6e7d2;font:600 clamp(22px,4.6vw,46px) Georgia,serif;
 letter-spacing:.05em;text-shadow:0 3px 16px #000,0 0 30px #5a0d0d;opacity:0;transform:translateY(8px);transition:opacity 1.4s,transform 1.4s}
.postal-sangre .ps-nombre small{display:block;font:500 clamp(10px,1.5vw,14px) system-ui,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#d98a7a;margin-top:6px}
.postal-sangre .ps-nombre.visible{opacity:1;transform:none}
.postal-sangre .ps-sub{position:absolute;left:8%;right:8%;bottom:14%;text-align:center;color:#fff4ea;font-size:clamp(13px,2.1vw,20px);line-height:1.45;
 text-shadow:0 2px 6px #000,0 0 16px #000c;opacity:0;transition:opacity .5s}
.postal-sangre .ps-sub.visible{opacity:1}
.postal-sangre .ps-saltar{position:absolute;right:14px;top:calc(11% + 10px);background:#0007;color:#fff;border:1px solid #fff5;border-radius:999px;padding:5px 12px;font-size:12px}`;
  document.head.append(css);
}

/** ¿Hay que presentar este bioma? */
export function postalPendiente(bioma: string) { return !!POSTALES[bioma] && !vistas().has(bioma) && !enCurso; }

/** Presenta el bioma: `pausar` detiene el mundo mientras dura (y lo suelta al final). */
export async function verPostalBioma(bioma: string, escena: Escena3D, pausar: (si: boolean) => void) {
  const linea = POSTALES[bioma];
  if (!linea || enCurso) return;
  enCurso = true;
  ponerEstilo();
  // Los amigos conservan las postales escritas sin solicitar medios de la granja excluidos de su paquete.
  voces ??= CON_PAREJA ? fetch('./granja/cine/medios.json').then((r) => (r.ok ? r.json() : {})).then((m: { voces?: Record<string, { archivo: string; seg: number }> }) => m.voces ?? {}).catch(() => ({})) : Promise.resolve({});
  const voz = (await voces)[linea.id];
  const capa = document.createElement('div');
  capa.className = 'postal-sangre';
  const nombre = BIOMAS[bioma as keyof typeof BIOMAS]?.nombre ?? linea.texto.split(':')[0];
  capa.innerHTML = `<div class="ps-franja arriba"></div><div class="ps-franja abajo"></div><div class="ps-nombre">${nombre}<small>Valdemora · la Noche Eterna</small></div><p class="ps-sub"></p><button class="ps-saltar" type="button">Saltar ›</button>`;
  capa.querySelector('.ps-sub')!.textContent = linea.texto;
  document.body.append(capa);
  document.body.classList.add('en-postal-sangre');
  pausar(true);
  escena.postal = { t0: performance.now() };
  requestAnimationFrame(() => capa.classList.add('visible'));
  const dur = Math.max(9, (voz?.seg ?? 5) + 5.5);
  let audio: HTMLAudioElement | undefined;
  await new Promise<void>((listo) => {
    let fin = false;
    const timers: number[] = [];
    const acabar = () => {
      if (fin) return;
      fin = true;
      for (const t of timers) clearTimeout(t);
      audio?.pause();
      window.removeEventListener('keydown', tecla, true);
      listo();
    };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); acabar(); } };
    window.addEventListener('keydown', tecla, true);
    capa.addEventListener('pointerdown', (e) => { e.preventDefault(); acabar(); });
    timers.push(window.setTimeout(() => capa.querySelector('.ps-nombre')!.classList.add('visible'), 900));
    timers.push(window.setTimeout(() => {
      capa.querySelector('.ps-sub')!.classList.add('visible');
      if (voz) { audio = new Audio(voz.archivo); audio.volume = 0.95; void audio.play().catch(() => undefined); }
    }, 2200));
    timers.push(window.setTimeout(acabar, dur * 1000));
  });
  marcar(bioma);
  capa.classList.remove('visible');
  escena.postal = null;
  document.body.classList.remove('en-postal-sangre');
  pausar(false);
  window.setTimeout(() => capa.remove(), 700);
  enCurso = false;
}
