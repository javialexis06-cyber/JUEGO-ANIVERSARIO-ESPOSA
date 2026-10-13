// Las presentaciones de cada lugar (docs/en-obra/pelicula-de-astra.md, capítulo 6 bis): la primera vez que se llega a un
// pueblo o a un mundo nuevo, la cámara del juego se aleja y recorre el lugar de verdad con franjas de cine, el nombre
// del lugar y el narrador (voces en granja/cine/medios.json: LUG.<mundo>.1-2 y LUG.<lugar>). Se salta con un toque o
// Escape y se vuelve a ver desde Ajustes. Lo visto se recuerda en este teléfono.
import { LLEGADAS, POSTALES } from './cine-lineas-lugares';
import type { LineaCine } from './cine-granja';

/** A qué llegada de mundo pertenece cada mundo de Astra (el valle de Celia ya tiene el prólogo). */
const MUNDO_LLEGADA: Record<string, string> = { frontera: 'frontera', verdia: 'verdia', senda: 'senda', nox: 'nox', astra: 'cielo', confluencia: 'confluencia' };
const CLAVE = 'granja-postales-vistas';

function vistas(): Set<string> { try { return new Set(JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as string[]); } catch { return new Set(); } }
function marcar(id: string) { try { const v = vistas(); v.add(id); localStorage.setItem(CLAVE, JSON.stringify([...v])); } catch { /* sin almacenamiento: se vuelve a ver */ } }

export interface CamaraPostal { camaraPostal(x: number, z: number, giro: number, zoom: number): void; postalActiva: boolean }
export interface PlanPostal { lugar: string; nombre: string; mundo?: string; lineas: LineaCine[] }

/** ¿Hay que presentar este lugar (o su mundo) al llegar? */
export function planPostal(lugar: string, nombre: string, mundo: string | undefined, forzar = false): PlanPostal | null {
  const v = vistas();
  const llegada = mundo ? MUNDO_LLEGADA[mundo] : undefined;
  const lineas: LineaCine[] = [];
  if (llegada && LLEGADAS[llegada] && (forzar || !v.has('mundo:' + llegada))) lineas.push(...LLEGADAS[llegada]);
  if (POSTALES[lugar] && (forzar || !v.has(lugar))) lineas.push(POSTALES[lugar]);
  return lineas.length ? { lugar, nombre, mundo: llegada, lineas } : null;
}

let estilo = false;
function ponerEstilo() {
  if (estilo) return;
  estilo = true;
  const css = document.createElement('style');
  css.textContent = `body.en-postal #app > :not(#canvas){visibility:hidden!important}
.postal-lugar{position:fixed;inset:0;z-index:55;pointer-events:auto;opacity:0;transition:opacity .5s}
.postal-lugar.visible{opacity:1}
.postal-lugar .pl-franja{position:absolute;left:0;right:0;height:10.5%;background:#000;transition:transform .7s}
.postal-lugar .pl-franja.arriba{top:0}.postal-lugar .pl-franja.abajo{bottom:0}
.postal-lugar .pl-nombre{position:absolute;left:0;right:0;top:16%;text-align:center;color:#fffaf0;font:600 clamp(22px,4.6vw,46px) Georgia,serif;
 letter-spacing:.04em;text-shadow:0 3px 14px #000c;opacity:0;transform:translateY(8px);transition:opacity 1.2s,transform 1.2s}
.postal-lugar .pl-nombre small{display:block;font:500 clamp(10px,1.5vw,14px) system-ui,sans-serif;letter-spacing:.28em;text-transform:uppercase;opacity:.85;margin-top:6px}
.postal-lugar .pl-nombre.visible{opacity:1;transform:none}
.postal-lugar .pl-sub{position:absolute;left:8%;right:8%;bottom:13%;text-align:center;color:#fffaf0;font-size:clamp(13px,2.1vw,20px);line-height:1.45;
 text-shadow:0 2px 6px #000,0 0 16px #0009;opacity:0;transition:opacity .45s}
.postal-lugar .pl-sub.visible{opacity:1}
.postal-lugar .pl-saltar{position:absolute;right:14px;top:calc(10.5% + 10px);background:#0006;color:#fff;border:1px solid #fff5;border-radius:999px;padding:5px 12px;font-size:12px}`;
  document.head.append(css);
}

const NOMBRE_MUNDO: Record<string, string> = { frontera: 'La Frontera', verdia: 'Verdia', senda: 'Senda', nox: 'Nox', cielo: 'El cielo de Astra', confluencia: 'Confluencia' };

/** Reproduce la presentación: la cámara se aleja girando sobre (x, z) y vuelve al avatar al terminar. */
export async function verPostal(plan: PlanPostal, vista: CamaraPostal, x: number, z: number, voz: (id: string) => { url: string; seg: number } | null) {
  ponerEstilo();
  const capa = document.createElement('div');
  capa.className = 'postal-lugar';
  capa.innerHTML = `<div class="pl-franja arriba"></div><div class="pl-franja abajo"></div><div class="pl-nombre"></div><p class="pl-sub"></p><button class="pl-saltar" type="button">Saltar ›</button>`;
  document.body.append(capa);
  const nombre = capa.querySelector<HTMLElement>('.pl-nombre')!, sub = capa.querySelector<HTMLElement>('.pl-sub')!;
  // Cada línea con su voz (o 4 s si no hay); el nombre del mundo y después el del lugar
  const tramos = plan.lineas.map((l) => ({ l, v: voz(l.id), dur: Math.max(4, (voz(l.id)?.seg ?? 3.4) + 1.2) }));
  const total = tramos.reduce((a, t) => a + t.dur, 0) + 2.2;
  let fin = false, audio: HTMLAudioElement | undefined, actual = -1;
  vista.postalActiva = true;
  document.body.classList.add('en-postal');
  requestAnimationFrame(() => capa.classList.add('visible'));
  await new Promise<void>((listo) => {
    const acabar = () => { if (fin) return; fin = true; audio?.pause(); listo(); };
    capa.querySelector('.pl-saltar')!.addEventListener('click', acabar);
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); acabar(); } };
    window.addEventListener('keydown', tecla, { once: false });
    const t0 = performance.now();
    const cuadro = (ahora: number) => {
      if (fin) { window.removeEventListener('keydown', tecla); return; }
      requestAnimationFrame(cuadro);
      const t = (ahora - t0) / 1000, u = Math.min(1, t / total), k = u * u * (3 - 2 * u);
      // Un paseo largo: de lejos y girado a un lado, hacia el lugar
      vista.camaraPostal(x - 9 * (1 - k), z - 7 * (1 - k), -0.55 + 0.75 * k, 0.5 + 0.42 * k);
      let acum = 1.2, i = -1;
      for (let j = 0; j < tramos.length; j++) { if (t >= acum) i = j; acum += tramos[j].dur; }
      if (i !== actual) {
        actual = i;
        audio?.pause();
        const tr = tramos[i];
        if (tr) {
          sub.innerHTML = '';
          sub.textContent = tr.l.texto;
          sub.classList.add('visible');
          const esMundo = tr.l.id.split('.').length === 3;
          nombre.innerHTML = esMundo && plan.mundo ? `${NOMBRE_MUNDO[plan.mundo] ?? ''}<small>Un mundo nuevo</small>` : `${plan.nombre}<small>${plan.mundo ? NOMBRE_MUNDO[plan.mundo] ?? '' : 'El valle de Celia'}</small>`;
          nombre.classList.add('visible');
          if (tr.v) { audio = new Audio(tr.v.url); audio.volume = 0.95; void audio.play().catch(() => undefined); }
        }
      }
      if (t >= total) acabar();
    };
    requestAnimationFrame(cuadro);
  });
  for (const l of plan.lineas) marcar(l.id.split('.').length === 3 ? 'mundo:' + l.id.split('.')[1] : plan.lugar);
  capa.classList.remove('visible');
  vista.postalActiva = false;
  document.body.classList.remove('en-postal');
  window.setTimeout(() => capa.remove(), 600);
}
