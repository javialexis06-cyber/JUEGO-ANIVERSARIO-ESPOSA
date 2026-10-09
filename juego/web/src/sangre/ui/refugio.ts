// El refugio (Sangre y Ceniza 2, J): tres minijuegos chiquitos para cuando se espera al otro en la sala o se quiere
// descansar entre expediciones. Patear el barril (puntería con rebote: mientras más rebota antes de tumbar, más
// vale), la taberna (veintiuno con dados contra el tabernero, con ceniza de mentiras) y la campana de práctica
// (esquivar sin fin). Cada uno guarda su récord y se compara con el del otro.
import { glifo } from './iconos';

export interface RecordsRefugio {
  barril: number;
  campana: number;
  taberna: number;
  /** La bolsa de ceniza de mentiras de la taberna (sigue entre visitas). */
  bolsa: number;
}

export interface OpcionesRefugio {
  contenedor: HTMLElement;
  records: RecordsRefugio;
  /** Los récords del otro (Él o Ella), si se pueden traer. */
  delOtro?: Promise<RecordsRefugio | null>;
  nombreOtro?: string | null;
  alGuardar: (r: RecordsRefugio) => void;
  alVolver: () => void;
  /** Al entrar a un minijuego (true) y al salir (false): para apagar el 3D de fondo mientras se juega. */
  alJugar?: (jugando: boolean) => void;
  sonar?: (que: 'boton' | 'golpe' | 'compra' | 'derrota' | 'victoria' | 'campana' | 'carta') => void;
  /** El retrato del jugador (su clase y su cuerpo): es el muñequito de la campana de práctica. */
  retrato?: string;
}

// ------------------------------------------------------------------------------------------------- Sprites
// Renders de Blender (personajes/blender/sangre_vinetas.py → public/sangre/vinetas/spr_*.webp y dado<n>.webp); mientras
// cargan (o si faltan) se dibuja lo de antes, a mano.
const SPRITES = new Map<string, HTMLImageElement>();
function sprite(nombre: string, ruta = `./sangre/vinetas/${nombre}.webp`) {
  let i = SPRITES.get(ruta);
  if (!i) {
    i = new Image();
    i.decoding = 'async';
    i.src = ruta;
    SPRITES.set(ruta, i);
  }
  return i.complete && i.naturalWidth > 0 ? i : null;
}
/** Dibuja un sprite centrado en (x, y), de `tam` de ancho, girado y con su transparencia; false si no ha cargado. */
function dibujar(c: CanvasRenderingContext2D, nombre: string, x: number, y: number, tam: number, rot = 0, alfa = 1) {
  const i = sprite(nombre);
  if (!i) return false;
  c.save();
  c.globalAlpha = alfa;
  c.translate(x, y);
  if (rot) c.rotate(rot);
  c.drawImage(i, -tam / 2, -tam / 2, tam, tam);
  c.restore();
  return true;
}

type Juego = 'barril' | 'taberna' | 'campana';

const JUEGOS: { id: Juego; nombre: string; desc: string; glifo: string; unidad: (v: number) => string }[] = [
  { id: 'barril', nombre: 'Patear el barril', desc: 'Apunta y suéltalo: tumba las calaveras. Cada rebote antes de pegar vale más.', glifo: 'barril', unidad: (v) => `${v} puntos` },
  { id: 'taberna', nombre: 'La taberna', desc: 'Veintiuno con dados contra el tabernero. Se apuesta ceniza de mentiras.', glifo: 'dado', unidad: (v) => `${v} de ceniza` },
  { id: 'campana', nombre: 'La campana de práctica', desc: 'Esquiva las campanas y las calaveras que ruedan. ¿Cuánto aguantas?', glifo: 'campana', unidad: (v) => `${v.toFixed(1).replace('.', ',')} s` },
];

export function mostrarRefugio(o: OpcionesRefugio) {
  const raiz = document.createElement('section');
  raiz.className = 'pantalla refugio con-fondo';
  o.contenedor.replaceChildren(raiz);
  const r = o.records;
  let otro: RecordsRefugio | null = null;
  let detener: (() => void) | null = null;
  const sonar = (q: Parameters<NonNullable<OpcionesRefugio['sonar']>>[0]) => o.sonar?.(q);

  const menu = () => {
    if (detener) {
      detener();
      o.alJugar?.(false);
    }
    detener = null;
    raiz.classList.remove('opaca');
    raiz.innerHTML = `<header class="cabeza"><button class="boton-redondo" data-a="atras" aria-label="Atrás">${glifo('atras')}</button><h2>El refugio</h2></header>
      <p class="sub-refugio">Junto al fuego, mientras se espera a los demás: tres juegos de taberna.</p>
      <div class="juegos-refugio">${JUEGOS.map((g) => `<button class="juego-refugio placa" data-j="${g.id}">
        <span class="aura-juego vineta-juego"><img src="./sangre/vinetas/${g.id}.webp" alt=""></span><b>${g.nombre}</b><small>${g.desc}</small>
        <span class="record">Tu récord: <b>${r[g.id] ? g.unidad(r[g.id]) : '—'}</b>${o.nombreOtro ? `<br>${o.nombreOtro}: <b>${otro ? (otro[g.id] ? g.unidad(otro[g.id]) : '—') : '…'}</b>` : ''}</span>
        <span class="boton boton-chico boton-sangre jugar-refugio">${glifo('mano')}Jugar</span>
      </button>`).join('')}</div>`;
  };
  void o.delOtro?.then((x) => {
    otro = x;
    if (!detener) menu();
  });

  const record = (k: Juego, v: number) => {
    if (v <= r[k]) return false;
    r[k] = v;
    o.alGuardar(r);
    return true;
  };

  raiz.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const a = t.closest<HTMLElement>('[data-a]')?.dataset.a;
    const j = t.closest<HTMLElement>('[data-j]')?.dataset.j as Juego | undefined;
    if (a === 'atras') {
      sonar('boton');
      if (detener) return menu();
      raiz.remove();
      o.alVolver();
      return;
    }
    if (j) {
      sonar('carta');
      o.alJugar?.(true);
      raiz.classList.add('opaca');
      raiz.innerHTML = `<header class="cabeza"><button class="boton-redondo" data-a="atras" aria-label="Atrás">${glifo('atras')}</button><h2>${JUEGOS.find((g) => g.id === j)!.nombre}</h2>
        <div class="marcador-refugio"></div></header><div class="mesa-refugio"></div>`;
      const mesa = raiz.querySelector<HTMLElement>('.mesa-refugio')!;
      const marcador = raiz.querySelector<HTMLElement>('.marcador-refugio')!;
      const ctx: CtxJuego = { mesa, marcador, sonar, record: (v) => record(j, v), r, retrato: o.retrato };
      detener = j === 'barril' ? barril(ctx) : j === 'taberna' ? taberna(ctx, () => o.alGuardar(r)) : campana(ctx);
    }
  });
  menu();
  return {
    cerrar: () => {
      if (detener) (detener(), o.alJugar?.(false));
      raiz.remove();
    },
  };
}

interface CtxJuego {
  mesa: HTMLElement;
  marcador: HTMLElement;
  sonar: (q: 'boton' | 'golpe' | 'compra' | 'derrota' | 'victoria' | 'campana' | 'carta') => void;
  /** Guarda el récord si lo superó (devuelve si fue récord). */
  record: (v: number) => boolean;
  r: RecordsRefugio;
  retrato?: string;
}

/** Un lienzo que llena la mesa, con su bucle de cuadros (para cuando se sale). */
function lienzo(mesa: HTMLElement, cuadro: (dt: number, c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas');
  c.className = 'lienzo-refugio';
  mesa.append(c);
  const ctx = c.getContext('2d')!;
  let w = 0, h = 0, vivo = true, antes = performance.now();
  const ajustar = () => {
    const b = c.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    w = b.width;
    h = b.height;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  ajustar();
  const obs = new ResizeObserver(ajustar);
  obs.observe(c);
  const paso = (ahora: number) => {
    if (!vivo) return;
    // (si el aparato va lento, el juego no se pone en cámara lenta)
    const dt = Math.min(0.1, (ahora - antes) / 1000);
    antes = ahora;
    if (w > 0 && h > 0) cuadro(dt, ctx, w, h);
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
  return {
    c,
    tam: () => ({ w, h }),
    detener() {
      vivo = false;
      obs.disconnect();
    },
  };
}

/** Piso de losas de piedra (cada una de su tono, con grietas y musgo en las juntas), dibujado una vez por tamaño y
 *  después copiado; encima, la luz del fuego que titila. */
const PISOS = new Map<string, HTMLCanvasElement>();
function piso(c: CanvasRenderingContext2D, w: number, h: number, tono = '#2a2420') {
  const clave = `${Math.round(w)}x${Math.round(h)}:${tono}`;
  let lienzo = PISOS.get(clave);
  if (!lienzo) {
    lienzo = document.createElement('canvas');
    lienzo.width = Math.max(1, Math.round(w));
    lienzo.height = Math.max(1, Math.round(h));
    const cl = lienzo.getContext('2d')!;
    if (typeof cl.roundRect === 'function') losas(cl, w, h, tono);
    else pisoSimple(cl, w, h, tono);
    PISOS.clear();
    PISOS.set(clave, lienzo);
  }
  c.drawImage(lienzo, 0, 0, w, h);
  const t = performance.now() / 1000;
  const titila = 0.06 + 0.025 * Math.sin(t * 7.3) + 0.02 * Math.sin(t * 13.1);
  const g = c.createRadialGradient(w * 0.08, h * 0.5, 0, w * 0.08, h * 0.5, Math.max(w, h) * 0.9);
  g.addColorStop(0, `rgba(255,150,60,${titila + 0.06})`);
  g.addColorStop(0.5, `rgba(255,120,40,${titila * 0.5})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}
function losas(c: CanvasRenderingContext2D, w: number, h: number, tono: string) {
  let semilla = 7;
  const az = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  c.fillStyle = '#120e0c';
  c.fillRect(0, 0, w, h);
  const alto = 40;
  for (let y = 0, fila = 0; y < h; y += alto, fila++) {
    for (let x = fila % 2 ? -30 : 0; x < w; ) {
      const ancho = 46 + az() * 34;
      const l = 0.82 + az() * 0.3;
      // la losa: su tono, un poco más clara arriba (luz) y con el borde gastado
      const g = c.createLinearGradient(0, y, 0, y + alto);
      g.addColorStop(0, sombra(tono, l * 1.12));
      g.addColorStop(1, sombra(tono, l * 0.86));
      c.fillStyle = g;
      c.beginPath();
      c.roundRect(x + 1.5, y + 1.5, ancho - 3, alto - 3, 4);
      c.fill();
      c.strokeStyle = 'rgba(255,230,190,0.05)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x + 4, y + 2.5);
      c.lineTo(x + ancho - 4, y + 2.5);
      c.stroke();
      // grieta
      if (az() < 0.35) {
        c.strokeStyle = 'rgba(0,0,0,0.45)';
        c.beginPath();
        let gx = x + 6 + az() * (ancho - 12), gy = y + 4;
        c.moveTo(gx, gy);
        for (let k = 0; k < 4; k++) {
          gx += (az() - 0.5) * 12;
          gy += alto / 5;
          c.lineTo(gx, gy);
        }
        c.stroke();
      }
      // musgo en la junta
      if (az() < 0.25) {
        c.fillStyle = 'rgba(70,90,40,0.35)';
        c.beginPath();
        c.ellipse(x + az() * ancho, y + alto - 2, 6 + az() * 10, 2.5, 0, 0, Math.PI * 2);
        c.fill();
      }
      x += ancho;
    }
  }
  const v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.6)');
  c.fillStyle = v;
  c.fillRect(0, 0, w, h);
}
/** Un color #rrggbb más claro u oscuro. */
function sombra(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (k: number) => Math.max(0, Math.min(255, Math.round(((n >> k) & 255) * f)));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
/** (el piso viejo, por si el aparato no tiene roundRect) */
function pisoSimple(c: CanvasRenderingContext2D, w: number, h: number, tono = '#2a2420') {
  c.fillStyle = tono;
  c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(0,0,0,0.35)';
  c.lineWidth = 1;
  for (let y = 0; y < h; y += 36) {
    const off = (y / 36) % 2 ? 24 : 0;
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
    for (let x = -off; x < w; x += 48) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y + 36);
      c.stroke();
    }
  }
  const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
  g.addColorStop(0, 'rgba(255,170,80,0.08)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}

function calavera(c: CanvasRenderingContext2D, x: number, y: number, r: number, rot = 0, alfa = 1) {
  if (dibujar(c, 'spr_calavera', x, y, r * 2.7, rot, alfa)) return;
  c.save();
  c.globalAlpha = alfa;
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = '#e8dcc0';
  c.beginPath();
  c.arc(0, -r * 0.1, r, 0, Math.PI * 2);
  c.fill();
  c.fillRect(-r * 0.55, r * 0.5, r * 1.1, r * 0.45);
  c.fillStyle = '#2a1a14';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.ellipse(s * r * 0.38, -r * 0.05, r * 0.24, r * 0.3, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.beginPath();
  c.moveTo(0, r * 0.25);
  c.lineTo(-r * 0.12, r * 0.45);
  c.lineTo(r * 0.12, r * 0.45);
  c.fill();
  c.restore();
}

// ------------------------------------------------------------------------------------------------- Patear el barril
function barril(x: CtxJuego) {
  const R = 14, RB = 13;
  let patadas = 6, puntos = 0, oleada = 0;
  const b = { x: 0, y: 0, vx: 0, vy: 0, giro: 0, rebotes: 0, rodando: false };
  let blancos: { x: number; y: number; vivo: boolean; t: number; vx: number; vy: number }[] = [];
  let pilares: { x: number; y: number; r: number }[] = [];
  /** La resortera: desde dónde se tocó y hasta dónde se jala (el tiro sale al revés). */
  let apunta: { x0: number; y0: number; x: number; y: number } | null = null;
  let mensaje = '', mensajeT = 0, fin = false;
  const L = lienzo(x.mesa, cuadro);
  const marcar = () => (x.marcador.innerHTML = `<span><span class="ico">${glifo('barril')}</span>${patadas}</span><span><span class="ico">${glifo('calavera')}</span>${puntos}</span><span class="rec">Récord ${x.r.barril}</span>`);
  const salida = () => {
    const { h } = L.tam();
    return { x: 50, y: h / 2 };
  };
  const nuevaOleada = () => {
    const { w, h } = L.tam();
    oleada++;
    pilares = [];
    for (let k = 0; k < Math.min(5, 1 + oleada); k++) pilares.push({ x: w * (0.35 + Math.random() * 0.4), y: h * (0.18 + Math.random() * 0.64), r: 18 + Math.random() * 10 });
    blancos = [];
    for (let k = 0; k < 5; k++) {
      for (let intento = 0; intento < 30; intento++) {
        const p = { x: w * (0.45 + Math.random() * 0.48), y: h * (0.12 + Math.random() * 0.76), vivo: true, t: 0, vx: 0, vy: 0 };
        if (pilares.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > q.r + RB + 8) && blancos.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > RB * 3)) {
          blancos.push(p);
          break;
        }
      }
    }
  };
  const reponer = () => {
    const s = salida();
    Object.assign(b, { x: s.x, y: s.y, vx: 0, vy: 0, rebotes: 0, rodando: false });
  };
  setTimeout(() => {
    nuevaOleada();
    reponer();
    marcar();
  }, 0);

  const pos = (e: PointerEvent) => {
    const rc = L.c.getBoundingClientRect();
    return { x: e.clientX - rc.left, y: e.clientY - rc.top };
  };
  L.c.addEventListener('pointerdown', (e) => {
    if (fin) {
      fin = false;
      patadas = 6;
      puntos = 0;
      oleada = 0;
      nuevaOleada();
      reponer();
      marcar();
      return;
    }
    if (b.rodando || patadas <= 0) return;
    const p = pos(e);
    apunta = { x0: p.x, y0: p.y, x: p.x, y: p.y };
    L.c.setPointerCapture(e.pointerId);
  });
  L.c.addEventListener('pointermove', (e) => {
    if (!apunta) return;
    const p = pos(e);
    apunta.x = p.x;
    apunta.y = p.y;
  });
  L.c.addEventListener('pointerup', () => {
    if (!apunta || b.rodando) return;
    // Resortera: se toca en cualquier lado y se jala hacia atrás; el barril sale al revés
    const dx = apunta.x0 - apunta.x, dy = apunta.y0 - apunta.y;
    const l = Math.hypot(dx, dy);
    apunta = null;
    if (l < 12) return;
    const f = Math.min(150, l) * 6.2;
    b.vx = (dx / l) * f;
    b.vy = (dy / l) * f;
    b.rodando = true;
    b.rebotes = 0;
    patadas--;
    x.sonar('golpe');
    marcar();
  });

  function cuadro(dt: number, c: CanvasRenderingContext2D, w: number, h: number) {
    piso(c, w, h);
    c.strokeStyle = '#120e0c';
    c.lineWidth = 8;
    c.strokeRect(4, 4, w - 8, h - 8);
    // Física: el barril rueda, se frena, rebota en las paredes y los pilares
    if (b.rodando) {
      const pasos = 3;
      for (let k = 0; k < pasos; k++) {
        const d = dt / pasos;
        b.x += b.vx * d;
        b.y += b.vy * d;
        if (b.x < R + 8) (b.x = R + 8, (b.vx = Math.abs(b.vx) * 0.85), b.rebotes++, x.sonar('golpe'));
        if (b.x > w - R - 8) (b.x = w - R - 8, (b.vx = -Math.abs(b.vx) * 0.85), b.rebotes++, x.sonar('golpe'));
        if (b.y < R + 8) (b.y = R + 8, (b.vy = Math.abs(b.vy) * 0.85), b.rebotes++, x.sonar('golpe'));
        if (b.y > h - R - 8) (b.y = h - R - 8, (b.vy = -Math.abs(b.vy) * 0.85), b.rebotes++, x.sonar('golpe'));
        for (const p of pilares) {
          const dx = b.x - p.x, dy = b.y - p.y;
          const dd = Math.hypot(dx, dy);
          if (dd < p.r + R && dd > 0) {
            const nx = dx / dd, ny = dy / dd;
            b.x = p.x + nx * (p.r + R);
            b.y = p.y + ny * (p.r + R);
            const v = b.vx * nx + b.vy * ny;
            if (v < 0) {
              b.vx = (b.vx - 2 * v * nx) * 0.85;
              b.vy = (b.vy - 2 * v * ny) * 0.85;
              b.rebotes++;
              x.sonar('golpe');
            }
          }
        }
        for (const t of blancos) {
          if (!t.vivo || Math.hypot(t.x - b.x, t.y - b.y) > R + RB) continue;
          t.vivo = false;
          t.vx = b.vx * 0.6;
          t.vy = b.vy * 0.6;
          const vale = 1 + Math.min(3, b.rebotes);
          puntos += vale;
          mensaje = b.rebotes ? `¡+${vale}! ${b.rebotes} rebote${b.rebotes > 1 ? 's' : ''}` : '+1';
          mensajeT = 1.2;
          x.sonar('compra');
          marcar();
        }
      }
      const fr = Math.exp(-1.1 * dt);
      b.vx *= fr;
      b.vy *= fr;
      b.giro += (Math.hypot(b.vx, b.vy) * dt) / R;
      if (Math.hypot(b.vx, b.vy) < 18) {
        b.rodando = false;
        if (blancos.every((t) => !t.vivo)) {
          patadas += 2;
          mensaje = '¡Todas! +2 patadas';
          mensajeT = 1.6;
          nuevaOleada();
        }
        if (patadas <= 0) {
          fin = true;
          const rec = x.record(puntos);
          mensaje = rec ? `¡Récord: ${puntos}!` : `Fin: ${puntos} puntos`;
          mensajeT = 99;
          x.sonar(rec ? 'victoria' : 'carta');
        } else reponer();
        marcar();
      }
    }
    // Pilares, calaveras (las tumbadas salen volando) y el barril
    for (const p of pilares) {
      if (dibujar(c, 'spr_pilar', p.x, p.y, p.r * 2.5)) continue;
      c.fillStyle = '#4a4440';
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#6a625a';
      c.beginPath();
      c.arc(p.x - p.r * 0.2, p.y - p.r * 0.2, p.r * 0.7, 0, Math.PI * 2);
      c.fill();
    }
    for (const t of blancos) {
      if (t.vivo) calavera(c, t.x, t.y, RB);
      else if (t.t < 0.8) {
        t.t += dt;
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        calavera(c, t.x, t.y, RB, t.t * 9, 1 - t.t / 0.8);
      }
    }
    if (apunta && !b.rodando) {
      const dx = apunta.x0 - apunta.x, dy = apunta.y0 - apunta.y;
      c.strokeStyle = 'rgba(200,160,90,0.5)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(apunta.x0, apunta.y0);
      c.lineTo(apunta.x, apunta.y);
      c.stroke();
      const l = Math.min(150, Math.hypot(dx, dy));
      const a = Math.atan2(dy, dx);
      c.strokeStyle = 'rgba(255,210,120,0.8)';
      c.setLineDash([6, 6]);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(b.x, b.y);
      c.lineTo(b.x + Math.cos(a) * l * 2.2, b.y + Math.sin(a) * l * 2.2);
      c.stroke();
      c.setLineDash([]);
    }
    // (su sombra, y el barril que gira al rodar)
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.beginPath();
    c.ellipse(b.x + 3, b.y + 5, R * 1.05, R * 0.8, 0, 0, Math.PI * 2);
    c.fill();
    if (!dibujar(c, 'spr_barril', b.x, b.y, R * 2.8, b.giro)) {
    c.save();
    c.translate(b.x, b.y);
    c.rotate(b.giro);
    c.fillStyle = '#7a5030';
    c.beginPath();
    c.arc(0, 0, R, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#3a2a1a';
    c.lineWidth = 3;
    for (const s of [-0.45, 0.45]) {
      c.beginPath();
      c.moveTo(s * R, -R * 0.9);
      c.lineTo(s * R, R * 0.9);
      c.stroke();
    }
    c.restore();
    }
    if (!b.rodando && patadas > 0 && !apunta && !fin) {
      c.fillStyle = 'rgba(255,230,180,0.85)';
      c.font = '600 13px Georgia, serif';
      c.textAlign = 'left';
      c.fillText('Toca, jala hacia atrás y suelta', b.x + 22, b.y + 5);
    }
    if (mensajeT > 0) {
      mensajeT -= dt;
      c.fillStyle = '#ffd36b';
      c.font = '700 22px Georgia, serif';
      c.textAlign = 'center';
      c.fillText(mensaje, w / 2, 34);
      if (fin) {
        c.font = '600 14px Georgia, serif';
        c.fillText('Toca para jugar otra vez', w / 2, 56);
      }
    }
  }
  return () => L.detener();
}

// ------------------------------------------------------------------------------------------------- La taberna
const FRASES_GANA = ['¡Ay, me pelaste!', '¡Qué suerte la tuya, mijo!', 'Tómate esta a mi salud.'];
const FRASES_PIERDE = ['¡Pa\' la casa!', 'La casa siempre gana, mi rey.', 'Otra vez será.'];
function taberna(x: CtxJuego, guardar: () => void) {
  const r = x.r;
  if (r.bolsa < 10) r.bolsa = 100;
  let apuesta = 10, yo: number[] = [], el: number[] = [], fase: 'apostar' | 'pedir' | 'fin' = 'apostar', dice = 'Siéntese. ¿Cuánto va a apostar?';
  const suma = (d: number[]) => d.reduce((a, b) => a + b, 0);
  const dado = () => 1 + Math.floor(Math.random() * 6);
  // (el último dado de cada mano cae rodando; los de antes ya están quietos)
  const pintarDados = (d: number[]) => d.map((v, k) => `<img class="dado-render${k === d.length - 1 ? ' nuevo' : ''}" src="./sangre/vinetas/dado${v}.webp" alt="${v}">`).join('');
  const pintar = () => {
    x.marcador.innerHTML = `<span><span class="ico">${glifo('alma')}</span>${r.bolsa}</span><span class="rec">Récord ${r.taberna}</span>`;
    x.mesa.innerHTML = `<div class="taberna">
      <div class="tabernero"><img class="mesa-tabernero" src="./sangre/vinetas/taberna.webp" alt=""><p class="globo-tabernero">${dice}</p></div>
      <div class="manos">
        <div class="mano"><small>El tabernero</small><div class="dados">${pintarDados(el) || '<em>—</em>'}</div><b>${el.length ? suma(el) : ''}</b></div>
        <div class="mano tuya"><small>Tú</small><div class="dados">${pintarDados(yo) || '<em>—</em>'}</div><b>${yo.length ? suma(yo) : ''}</b></div>
      </div>
      <div class="acciones-taberna">${fase === 'apostar' || fase === 'fin'
        ? `${[10, 25, 50].map((v) => `<button class="boton boton-chico${apuesta === v ? ' si' : ''}" data-ap="${v}" ${r.bolsa < v ? 'disabled' : ''}>${v}</button>`).join('')}
           <button class="boton boton-sangre" data-t="jugar" ${r.bolsa < apuesta ? 'disabled' : ''}>${glifo('dado')}${fase === 'fin' ? 'Otra' : 'Tirar'} · ${apuesta}</button>`
        : `<button class="boton boton-sangre" data-t="pedir">${glifo('dado')}Otro dado</button><button class="boton" data-t="plantarse">${glifo('mano')}Me planto</button>`}</div>
      <small class="reglas">Lo más cerca de 21 sin pasarse. El tabernero pide hasta 17. Veintiuno exacto paga doble.</small>
    </div>`;
  };
  const terminar = (gana: number) => {
    // gana: 2 veintiuno, 1 gana, 0 empate, −1 pierde
    r.bolsa += gana > 0 ? apuesta * gana : gana < 0 ? -apuesta : 0;
    if (r.bolsa > r.taberna) r.taberna = r.bolsa;
    fase = 'fin';
    dice = gana === 2 ? '¡Veintiuno! Paga doble… ¡qué rabia!' : gana === 1 ? FRASES_GANA[Math.floor(Math.random() * FRASES_GANA.length)] : gana === 0 ? 'Empatados. Cada uno con lo suyo.' : FRASES_PIERDE[Math.floor(Math.random() * FRASES_PIERDE.length)];
    if (r.bolsa < 10) {
      r.bolsa = 50;
      dice += ' Le fío 50 de mentiras, no se preocupe.';
    }
    x.sonar(gana > 0 ? 'compra' : gana < 0 ? 'derrota' : 'carta');
    guardar();
    pintar();
  };
  const plantarse = () => {
    el = [dado(), dado()];
    while (suma(el) < 17) el.push(dado());
    const t = suma(yo), s = suma(el);
    terminar(s > 21 || t > s ? (t === 21 ? 2 : 1) : t === s ? 0 : -1);
  };
  x.mesa.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const ap = t.closest<HTMLElement>('[data-ap]')?.dataset.ap;
    const acc = t.closest<HTMLElement>('[data-t]')?.dataset.t;
    if (ap) {
      apuesta = Number(ap);
      x.sonar('boton');
      return pintar();
    }
    if (acc === 'jugar') {
      if (r.bolsa < apuesta) return;
      yo = [dado(), dado()];
      el = [];
      fase = 'pedir';
      dice = suma(yo) === 21 ? '¿Ya?' : 'Hágale, pida o plántese.';
      x.sonar('carta');
    } else if (acc === 'pedir') {
      yo.push(dado());
      x.sonar('carta');
      if (suma(yo) > 21) return terminar(-1);
      if (suma(yo) === 21) return plantarse();
      dice = suma(yo) >= 18 ? 'Uy, ¿seguro que va a pedir más?' : 'Siga, siga.';
    } else if (acc === 'plantarse') return plantarse();
    pintar();
  });
  pintar();
  return () => guardar();
}

// ------------------------------------------------------------------------------------------------- La campana de práctica
function campana(x: CtxJuego) {
  const yo = { x: 0, y: 0, vx: 0, vy: 0 };
  let t = 0, spawnT = 1, vivo = false, listo = false, mensaje = 'Toca para empezar';
  let golpes: { x: number; y: number; r: number; t: number; dur: number }[] = [];
  let rodantes: { x: number; y: number; vx: number; vy: number; rot: number }[] = [];
  const teclas = new Set<string>();
  let toque: { x0: number; y0: number; x: number; y: number } | null = null;
  const L = lienzo(x.mesa, cuadro);
  const marcar = () => (x.marcador.innerHTML = `<span><span class="ico">${glifo('reloj')}</span>${t.toFixed(1).replace('.', ',')} s</span><span class="rec">Récord ${x.r.campana.toFixed(1).replace('.', ',')} s</span>`);
  marcar();
  const empezar = () => {
    const { w, h } = L.tam();
    Object.assign(yo, { x: w / 2, y: h / 2, vx: 0, vy: 0 });
    t = 0;
    spawnT = 1.2;
    golpes = [];
    rodantes = [];
    vivo = true;
    listo = true;
  };
  const kd = (e: KeyboardEvent) => teclas.add(e.key.toLowerCase());
  const ku = (e: KeyboardEvent) => teclas.delete(e.key.toLowerCase());
  addEventListener('keydown', kd);
  addEventListener('keyup', ku);
  const pos = (e: PointerEvent) => {
    const rc = L.c.getBoundingClientRect();
    return { x: e.clientX - rc.left, y: e.clientY - rc.top };
  };
  L.c.addEventListener('pointerdown', (e) => {
    if (!vivo) return empezar();
    const p = pos(e);
    toque = { x0: p.x, y0: p.y, x: p.x, y: p.y };
    L.c.setPointerCapture(e.pointerId);
  });
  L.c.addEventListener('pointermove', (e) => {
    if (!toque) return;
    const p = pos(e);
    toque.x = p.x;
    toque.y = p.y;
  });
  const soltar = () => (toque = null);
  L.c.addEventListener('pointerup', soltar);
  L.c.addEventListener('pointercancel', soltar);

  function morir() {
    vivo = false;
    const rec = x.record(Math.round(t * 10) / 10);
    mensaje = rec ? `¡Récord: ${t.toFixed(1).replace('.', ',')} s!` : `Aguantaste ${t.toFixed(1).replace('.', ',')} s · toca para otra`;
    x.sonar(rec ? 'victoria' : 'derrota');
    marcar();
  }

  function cuadro(dt: number, c: CanvasRenderingContext2D, w: number, h: number) {
    piso(c, w, h, '#26201e');
    const cx = w / 2, cy = h / 2, RA = Math.min(w, h) * 0.46;
    c.strokeStyle = 'rgba(200,160,90,0.35)';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(cx, cy, RA, 0, Math.PI * 2);
    c.stroke();
    if (vivo) {
      t += dt;
      // Mover: el dedo (como un joystick desde donde tocó) o las flechas
      let mx = (teclas.has('arrowright') || teclas.has('d') ? 1 : 0) - (teclas.has('arrowleft') || teclas.has('a') ? 1 : 0);
      let my = (teclas.has('arrowdown') || teclas.has('s') ? 1 : 0) - (teclas.has('arrowup') || teclas.has('w') ? 1 : 0);
      if (toque) {
        const dx = toque.x - toque.x0, dy = toque.y - toque.y0;
        const l = Math.hypot(dx, dy);
        if (l > 6) {
          mx = (dx / l) * Math.min(1, l / 40);
          my = (dy / l) * Math.min(1, l / 40);
        }
      }
      const l = Math.hypot(mx, my);
      if (l > 1) (mx /= l), (my /= l);
      yo.x += mx * 175 * dt;
      yo.y += my * 175 * dt;
      const d = Math.hypot(yo.x - cx, yo.y - cy);
      if (d > RA - 10) {
        yo.x = cx + ((yo.x - cx) / d) * (RA - 10);
        yo.y = cy + ((yo.y - cy) / d) * (RA - 10);
      }
      // Lo que cae y lo que rueda, cada vez más seguido
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = Math.max(0.28, 1.05 - t * 0.018);
        const cuantas = 1 + (t > 25 && Math.random() < 0.35 ? 2 : 0);
        for (let k = 0; k < cuantas; k++) {
          const a = Math.random() * Math.PI * 2, rr = Math.random() * RA * 0.8;
          const cerca = Math.random() < 0.55;
          golpes.push({ x: cerca ? yo.x + (Math.random() - 0.5) * 60 : cx + Math.cos(a) * rr, y: cerca ? yo.y + (Math.random() - 0.5) * 60 : cy + Math.sin(a) * rr, r: 24 + Math.random() * 16, t: 0, dur: Math.max(0.6, 1.1 - t * 0.008) });
        }
        if (t > 8 && Math.random() < 0.4) {
          const a = Math.random() * Math.PI * 2;
          const v = 130 + Math.min(120, t * 2.5);
          const dir = Math.atan2(yo.y - (cy + Math.sin(a) * RA), yo.x - (cx + Math.cos(a) * RA)) + (Math.random() - 0.5) * 0.5;
          rodantes.push({ x: cx + Math.cos(a) * RA, y: cy + Math.sin(a) * RA, vx: Math.cos(dir) * v, vy: Math.sin(dir) * v, rot: 0 });
        }
      }
      marcar();
    }
    // Campanazos: la sombra crece y después cae
    for (let k = golpes.length - 1; k >= 0; k--) {
      const g = golpes[k];
      g.t += dt;
      const u = Math.min(1, g.t / g.dur);
      if (u < 1) {
        c.fillStyle = `rgba(0,0,0,${0.25 + u * 0.35})`;
        c.beginPath();
        c.arc(g.x, g.y, g.r * (0.3 + 0.7 * u), 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = 'rgba(255,90,60,0.7)';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        c.stroke();
        // la campana que viene bajando (al final del aviso se ve llegar)
        if (u > 0.45) {
          const baja = (u - 0.45) / 0.55;
          dibujar(c, 'spr_campana', g.x, g.y - g.r * 0.4 - (1 - baja) * 140, g.r * 2.2, 0, Math.min(1, baja * 2));
        }
      } else {
        if (g.t - g.dur < dt * 1.5) {
          x.sonar('campana');
          if (vivo && Math.hypot(yo.x - g.x, yo.y - g.y) < g.r + 6) morir();
        }
        const f = (g.t - g.dur) / 0.35;
        // la campana que cayó (y se desvanece)
        if (dibujar(c, 'spr_campana', g.x, g.y - g.r * 0.4, g.r * 2.2 * (1 + f * 0.1), 0, 1 - f)) {
          if (f >= 1) golpes.splice(k, 1);
          continue;
        }
        c.fillStyle = `rgba(176,138,58,${1 - f})`;
        c.beginPath();
        c.moveTo(g.x - g.r * 0.8, g.y + g.r * 0.4);
        c.quadraticCurveTo(g.x - g.r * 0.7, g.y - g.r, g.x, g.y - g.r);
        c.quadraticCurveTo(g.x + g.r * 0.7, g.y - g.r, g.x + g.r * 0.8, g.y + g.r * 0.4);
        c.closePath();
        c.fill();
        if (f >= 1) golpes.splice(k, 1);
      }
    }
    for (let k = rodantes.length - 1; k >= 0; k--) {
      const q = rodantes[k];
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.rot += dt * 8;
      calavera(c, q.x, q.y, 11, q.rot);
      if (vivo && Math.hypot(yo.x - q.x, yo.y - q.y) < 11 + 9) morir();
      if (Math.hypot(q.x - cx, q.y - cy) > RA + 40) rodantes.splice(k, 1);
    }
    // El muñequito: el retrato del jugador en un medallón (si cargó), o la carita de antes
    const ret = x.retrato ? sprite('', x.retrato) : null;
    if (listo && ret) {
      c.save();
      c.globalAlpha = vivo ? 1 : 0.5;
      c.fillStyle = 'rgba(0,0,0,0.4)';
      c.beginPath();
      c.ellipse(yo.x + 2, yo.y + 15, 13, 5, 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(yo.x, yo.y, 16, 0, Math.PI * 2);
      c.fillStyle = '#1a1210';
      c.fill();
      c.save();
      c.clip();
      c.drawImage(ret, yo.x - 19, yo.y - 16, 38, 38);
      c.restore();
      c.lineWidth = 2.5;
      c.strokeStyle = '#c9a046';
      c.stroke();
      c.restore();
    } else if (listo) {
      c.fillStyle = vivo ? '#f0c8a8' : '#8a6a5a';
      c.beginPath();
      c.arc(yo.x, yo.y, 10, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#2a1a14';
      c.beginPath();
      c.arc(yo.x, yo.y - 3, 10, Math.PI, 0);
      c.fill();
      c.fillStyle = '#1a1010';
      for (const s of [-1, 1]) {
        c.beginPath();
        c.arc(yo.x + s * 3.5, yo.y + 2, 1.6, 0, Math.PI * 2);
        c.fill();
      }
    }
    if (!vivo) {
      c.fillStyle = '#ffd36b';
      c.font = '700 20px Georgia, serif';
      c.textAlign = 'center';
      c.fillText(mensaje, cx, cy - 20);
      c.font = '600 13px Georgia, serif';
      c.fillStyle = 'rgba(255,230,180,0.85)';
      c.fillText('Arrastra el dedo para moverte (o las flechas)', cx, cy + 8);
    }
  }
  return () => {
    L.detener();
    removeEventListener('keydown', kd);
    removeEventListener('keyup', ku);
  };
}
