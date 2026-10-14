// La sala de cine de la granja (cine.html): todas las películas de la historia de Astra en un solo lugar, por actos,
// con su foto. Se ven sueltas o seguidas de punta a punta («La película completa»), y cada una se puede descargar en
// video (WebM con sonido, subtítulos, títulos y fundidos) grabándola en tiempo real en el computador.
import { CineGranja, cargarMediosCine, type MediosCine } from './cine-granja';
import { PELICULAS } from './cine-catalogo';
import { ACTOS, CAPITULOS } from './cine-capitulos';
import arreglarDuracion from 'fix-webm-duration';

const NOMBRE = new Map(CAPITULOS);
const NUMERO = new Map(CAPITULOS.map(([id], i) => [id, i]));
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const css = document.createElement('style');
css.textContent = `
:root{--fondo:#120f1c;--tarjeta:#1f1a2e;--texto:#f6efe2;--suave:#c9bfd9;--oro:#f2d98a}
*{box-sizing:border-box}html,body{margin:0;background:var(--fondo);color:var(--texto);font-family:system-ui,-apple-system,'Segoe UI',sans-serif}
.sala{max-width:1280px;margin:0 auto;padding:22px 20px 60px}
.cab{display:flex;flex-wrap:wrap;align-items:flex-end;gap:14px 22px;margin-bottom:18px}
.cab h1{font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:clamp(26px,4vw,42px);margin:0;letter-spacing:.03em}
.cab p{margin:4px 0 0;color:var(--suave);font-size:14px}
.acciones{margin-left:auto;display:flex;flex-wrap:wrap;gap:8px}
button{font:inherit;cursor:pointer;border-radius:999px;border:1px solid #fff3;background:#ffffff14;color:var(--texto);padding:8px 16px;font-size:14px}
button:hover{background:#ffffff26}button.principal{background:linear-gradient(180deg,#f6d27a,#d9a640);color:#2b1d0c;border:0;font-weight:700}
button:disabled{opacity:.45;cursor:default}
.acto{margin:26px 0 10px;font-family:Georgia,serif;color:var(--oro);font-size:18px;letter-spacing:.04em}
.rejilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.peli{background:var(--tarjeta);border-radius:14px;overflow:hidden;box-shadow:0 6px 18px #0006;display:flex;flex-direction:column}
.peli .foto{position:relative;aspect-ratio:480/216;background:#000 center/cover no-repeat;cursor:pointer}
.peli .foto::after{content:'▶';position:absolute;inset:0;display:grid;place-items:center;font-size:30px;color:#fff;opacity:0;background:#0006;transition:opacity .2s}
.peli .foto:hover::after{opacity:1}
.peli .num{position:absolute;left:8px;top:8px;background:#000a;border-radius:999px;padding:2px 9px;font-size:12px;color:var(--oro)}
.peli .info{padding:10px 12px 12px;display:flex;flex-direction:column;gap:8px;flex:1}
.peli h3{margin:0;font-size:15px;line-height:1.3;font-weight:600}
.peli .fila{display:flex;gap:6px;margin-top:auto}.peli .fila button{padding:5px 11px;font-size:12px}
.estado{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:#000c;border:1px solid #fff3;border-radius:999px;padding:8px 16px;
 font-size:13px;z-index:80;display:none}
.estado.visible{display:block}
.salir{position:fixed;top:14px;left:14px;z-index:80;display:none}.salir.visible{display:block}
.cargando{position:fixed;inset:0;z-index:70;display:none;place-items:center;background:#000;color:var(--suave);font-size:15px}
.cargando.visible{display:grid}
.nota{color:var(--suave);font-size:13px;line-height:1.5;margin-top:30px;max-width:820px}`;
document.head.append(css);

const app = document.getElementById('app')!;
app.innerHTML = `<div class="sala">
  <div class="cab"><div><h1>La película de Astra</h1><p>Las ${CAPITULOS.length} películas de la historia, de la llegada a la granja a la boda en Eterna.</p></div>
  <div class="acciones"><button class="principal" data-todo>▶ Ver la película completa</button><button data-bajar-todo>⬇ Descargar todas en video</button>
  <button data-volver>← Volver a la granja</button></div></div>
  ${ACTOS.map((a) => `<h2 class="acto">${esc(a.nombre)}</h2><div class="rejilla">${a.ids.map((id) => `<div class="peli">
    <div class="foto" data-ver="${id}" style="background-image:url(./granja/cine/fotos/${id}.jpg)"><span class="num">${NUMERO.get(id) === 0 ? 'Prólogo' : NUMERO.get(id)}</span></div>
    <div class="info"><h3>${esc(NOMBRE.get(id) ?? id)}</h3><div class="fila"><button data-ver="${id}">▶ Ver</button><button data-bajar="${id}">⬇ Video</button></div></div></div>`).join('')}</div>`).join('')}
  <p class="nota">En el computador las películas corren a 60 cuadros por segundo (o a lo que dé la pantalla) y la resolución se ajusta sola si
  el equipo se queda corto. «Video» graba la película mientras se reproduce (con sonido, subtítulos y títulos) y la descarga en WebM al
  terminar: deja la pestaña al frente mientras graba. Escape o «Saltar» terminan la película que se está viendo.</p>
</div>
<div class="cargando"><span>Preparando la película…</span></div>
<button class="salir">✕ Salir de la película completa</button><div class="estado"></div>`;

const cargando = app.querySelector<HTMLElement>('.cargando')!;
const estado = app.querySelector<HTMLElement>('.estado')!;
const salir = app.querySelector<HTMLButtonElement>('.salir')!;
const botones = () => app.querySelectorAll<HTMLButtonElement>('button[data-ver],button[data-bajar],button[data-todo],button[data-bajar-todo]');
let medios: Promise<MediosCine> | null = null;
let ocupado = false, cancelarTodo = false, actual: CineGranja | null = null;

function aviso(txt: string) { estado.textContent = txt; estado.classList.toggle('visible', !!txt); }

async function mediosCine() {
  medios ??= fetch('./granja/astra/medios.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
    .then((m: { musica?: Record<string, string> }) => cargarMediosCine(m.musica ?? {}));
  return medios;
}

/** Arma y reproduce una película; con `grabar`, la descarga en video al terminar. */
async function ver(id: string, grabar = false) {
  const crear = PELICULAS[id];
  if (!crear) return;
  cargando.classList.add('visible');
  const c = new CineGranja(await crear(), await mediosCine());
  actual = c;
  await c.preparar();
  cargando.classList.remove('visible');
  const grabador = grabar ? grabarVideo(c, id) : null;
  await c.reproducir();
  actual = null;
  if (grabador) await grabador.terminar();
}

// ---------------------------------------------------------------------------------------------------- grabar en video

/** Compone cada cuadro (la imagen 3D más las franjas, el subtítulo, el título y el fundido) en un lienzo de 1920×1080
 * y lo graba con el sonido de la película. */
function grabarVideo(c: CineGranja, id: string) {
  const W = 1920, H = 1080;
  const lienzo = document.createElement('canvas');
  lienzo.width = W;
  lienzo.height = H;
  const g = lienzo.getContext('2d')!;
  const gl = c.renderer.domElement;
  const ctx = new AudioContext();
  const destino = ctx.createMediaStreamDestination();
  c.alAudio = (a) => {
    try { const fuente = ctx.createMediaElementSource(a); fuente.connect(destino); fuente.connect(ctx.destination); } catch { /* ya conectado */ }
  };
  const envolver = (txt: string, ancho: number) => {
    const palabras = txt.split(' '), lineas: string[] = [];
    let l = '';
    for (const p of palabras) { const prueba = l ? l + ' ' + p : p; if (g.measureText(prueba).width > ancho && l) { lineas.push(l); l = p; } else l = prueba; }
    if (l) lineas.push(l);
    return lineas;
  };
  c.alDibujar = () => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
    // La imagen 3D, recortada para llenar 16:9
    const ar = gl.width / gl.height, dst = W / H;
    let sw = gl.width, sh = gl.height, sx = 0, sy = 0;
    if (ar > dst) { sw = gl.height * dst; sx = (gl.width - sw) / 2; } else { sh = gl.width / dst; sy = (gl.height - sh) / 2; }
    g.drawImage(gl, sx, sy, sw, sh, 0, 0, W, H);
    // Viñeta y franjas de cine
    const v = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
    v.addColorStop(0, 'rgba(8,4,16,0)');
    v.addColorStop(1, 'rgba(8,4,16,.55)');
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);
    const franja = Math.round(H * 0.105);
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, franja);
    g.fillRect(0, H - franja, W, franja);
    const k = c.capas;
    g.textAlign = 'center';
    if (k.titulo.op > 0.01 && k.titulo.grande) {
      g.globalAlpha = k.titulo.op;
      g.shadowColor = 'rgba(242,217,138,.6)';
      g.shadowBlur = 24;
      g.fillStyle = '#fff8e2';
      g.font = '600 92px Georgia, serif';
      g.fillText(k.titulo.grande, W / 2, H / 2 + 10);
      if (k.titulo.chico) { g.font = '500 26px system-ui, sans-serif'; g.fillStyle = '#f2d98a'; g.fillText(k.titulo.chico.toUpperCase().split('').join(' '), W / 2, H / 2 + 70); }
      g.globalAlpha = 1;
      g.shadowBlur = 0;
    }
    if (k.sub.visible && k.sub.texto) {
      g.shadowColor = '#000';
      g.shadowBlur = 8;
      g.font = '500 38px system-ui, sans-serif';
      const lineas = envolver(k.sub.texto, W * 0.78);
      const base = H - H * 0.125 - (lineas.length - 1) * 50;
      g.fillStyle = '#f2d98a';
      g.font = '700 24px system-ui, sans-serif';
      g.fillText(k.sub.nombre.toUpperCase().split('').join(' '), W / 2, base - 46);
      g.fillStyle = '#fffaf0';
      g.font = '500 38px system-ui, sans-serif';
      lineas.forEach((l, i) => g.fillText(l, W / 2, base + i * 50));
      g.shadowBlur = 0;
    }
    if (k.fundido.op > 0.001) { g.globalAlpha = k.fundido.op; g.fillStyle = k.fundido.color; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  };
  const flujo = lienzo.captureStream(60);
  for (const pista of destino.stream.getAudioTracks()) flujo.addTrack(pista);
  const tipo = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';
  const grabadora = new MediaRecorder(flujo, { mimeType: tipo, videoBitsPerSecond: 12_000_000 });
  const trozos: Blob[] = [];
  grabadora.ondataavailable = (e) => { if (e.data.size) trozos.push(e.data); };
  const t0 = performance.now();
  grabadora.start(1000);
  aviso(`● Grabando «${NOMBRE.get(id) ?? id}»… deja esta pestaña al frente`);
  return {
    async terminar() {
      await new Promise<void>((listo) => { grabadora.onstop = () => listo(); grabadora.stop(); });
      void ctx.close();
      const n = NUMERO.get(id) ?? 0;
      const nombre = `${String(n).padStart(2, '0')} - ${(NOMBRE.get(id) ?? id).replace(/[\\/:*?"<>|·]/g, '').replace(/\s+/g, ' ').trim()}.webm`;
      // El navegador no escribe la duración en el WebM: sin ella no se puede adelantar en el reproductor
      let video = new Blob(trozos, { type: 'video/webm' });
      try { video = await arreglarDuracion(video, performance.now() - t0, { logger: false }); } catch { /* queda sin duración */ }
      const url = URL.createObjectURL(video);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      aviso(`Listo: «${nombre}» quedó en tus descargas.`);
      window.setTimeout(() => aviso(''), 6000);
    },
  };
}

// ---------------------------------------------------------------------------------------------------- botones

async function serie(ids: string[], grabar: boolean) {
  if (ocupado) return;
  ocupado = true;
  cancelarTodo = false;
  for (const b of botones()) b.disabled = true;
  if (ids.length > 1) salir.classList.add('visible');
  try {
    for (const id of ids) {
      if (cancelarTodo) break;
      await ver(id, grabar);
    }
  } catch (e) {
    console.error(e);
    aviso('No se pudo reproducir esta película en este equipo.');
  } finally {
    ocupado = false;
    salir.classList.remove('visible');
    cargando.classList.remove('visible');
    for (const b of botones()) b.disabled = false;
  }
}

app.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-ver],[data-bajar],[data-todo],[data-bajar-todo],[data-volver]');
  if (!el) return;
  if (el.dataset.ver) void serie([el.dataset.ver], false);
  else if (el.dataset.bajar) void serie([el.dataset.bajar], true);
  else if (el.hasAttribute('data-todo')) void serie(CAPITULOS.map(([id]) => id), false);
  else if (el.hasAttribute('data-bajar-todo')) void serie(CAPITULOS.map(([id]) => id), true);
  else if (el.hasAttribute('data-volver')) location.href = './granja-v3.html';
});
salir.addEventListener('click', () => { cancelarTodo = true; actual?.acabar(); });

// Pruebas
(window as unknown as { __salaCine: unknown }).__salaCine = { ver, actual: () => actual };
