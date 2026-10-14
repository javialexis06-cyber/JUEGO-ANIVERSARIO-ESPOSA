import { RetratosMapa } from './retratos-mapa';
import { regionAstra, NPC_ASTRA, RECURSOS_ASTRA, puntoRecurso, posicionNpcAstra, rutasDesde, planoAstra } from './astra';
// La cara de la granja: reloj, monedas, energía, minimapa y mapa grande (con fotos de verdad desde arriba, nombres y
// marcas), menú de pestañas y palanca táctil. Solo lee el estado del motor y abre los paneles que ya existen: no cambia reglas ni partidas.
import type { MotorGranja } from './motor';
import type { VistaGranja } from './vista';
import type { ControlesGranja } from './controles';
import { huella } from './motor';
import { DESTINOS } from './vista';
import { ARTICULOS, CULTIVOS, SECTORES, type Zona } from './catalogo';
import { SALIDAS, rutaCaminando, CAMINOS_GRANJA } from './caminos-mundo';
import { MINA, MINERALES as MINERALES_AV, instanciaAventura, destinoAventura } from './aventura';
const MINERALES_COLOR: Record<string, string> = Object.fromEntries(Object.entries(MINERALES_AV).map(([k, v]) => [k, v.color]));
import { ARBOLES_PUEBLO, CAMINOS_PUEBLO, EDIFICIOS_PUEBLO, NPCS_PUEBLO, VIVIENDAS_PUEBLO } from './pueblo-datos';
import { ubicacionAldeano } from './aldeanos';
import { huellaProduccion } from './produccion';
import { lluviaRiega, tiempoDia, TIEMPOS } from './clima';
import { ARTICULO_ENVIO } from './envios';
import { FotosMapa, MarcasMapa, LADO_FOTO } from './mapa-real';
import { celdasAgua } from './paisaje';
import './hud.css';

interface Hud {
  motor: MotorGranja;
  vista: VistaGranja;
  controles: ControlesGranja;
  mostrarPanel: (id: string) => void;
  cerrarPanel: () => void;
  panelAbierto: () => string;
}

const $ = (id: string) => document.getElementById(id)!;
const ESTACIONES = { primavera: 'Primavera', verano: 'Verano', otono: 'Otoño', invierno: 'Invierno' } as const;
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const CLAVE_PESTANA = 'granja-hud-pestana';

/** Límites [x0, x1, z0, z1] de cada zona (los mismos de `dentroDeZona`). */
function limites(zona: Zona): [number, number, number, number] {
  if (zona === 'granja') {
    const xs = SECTORES.flatMap((s) => [s.x, s.x + s.ancho]), zs = SECTORES.flatMap((s) => [s.z, s.z + s.fondo]);
    return [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  }
  return ({ pueblo: [50, 112, -43, 44], bosque: [-101, -57, -24, 23], bosque_ancestral: [-102, -55, 52, 100], lago: [5, 49, 74, 111], mina: [-10, 10, -9, 9] } as Record<string, [number, number, number, number]>)[zona] ?? [-20, 20, -20, 20];
}
const PISO: Record<string, string> = { granja: '#9cc77a', pueblo: '#b3cf8f', bosque: '#6f9e63', bosque_ancestral: '#5d8a6b', lago: '#a8cf8a', mina: '#8a7b70' };

export function renderAjustes(personaje: string, calidad: string, partida = ''): string {
  return `<div class="ajustes">
    <button class="ajuste" data-ajuste="personaje"><i>${personaje === 'ella' ? '👩' : '👨'}</i><span><b>Jugando con ${personaje === 'ella' ? 'Laura' : 'Javier'}</b><small>Toca para cambiar a ${personaje === 'ella' ? 'Javier' : 'Laura'}</small></span></button>
    <button class="ajuste" data-ajuste="calidad"><i>✨</i><span><b>Gráficos: ${calidad === 'Detalle' ? 'con detalle' : 'ligeros'}</b><small>${calidad === 'Detalle' ? 'Más bonito, gasta más batería' : 'Más fluido y fresco en el celular'}</small></span></button>
    <button class="ajuste" data-do="ver-prologo"><i>🎬</i><span><b>Ver el prólogo</b><small>Celia, Aura y Lara: cómo empezó todo</small></span></button>
    <a class="ajuste" href="./cine.html"><i>🍿</i><span><b>Sala de cine</b><small>Todas las películas de la historia, seguidas o una por una, y en video</small></span></a>
    <button class="ajuste" data-ajuste="rejilla"><i>▦</i><span><b>Cuadrícula</b><small>Para acomodar cultivos y construcciones</small></span></button>
    ${partida}
    <div class="ajustes-ayuda"><b>Cómo se juega</b><p>Camina con la palanca (o WASD). Toca una casilla para usar lo que tienes en la mano; si está lejos, tu personaje camina hasta allá. Toca un vecino, un animal o una puerta para hablar o entrar. Duerme en la cabaña para pasar el día.</p></div>
  </div>`;
}

const CLAVE_CALIDAD = 'granja-hud-calidad';
/** Antes de cargar modelos: perfil ligero por defecto; respetar la elección guardada en Ajustes. */
export function calidadInicial(vista: VistaGranja) {
  let elegida = '';
  try { elegida = localStorage.getItem(CLAVE_CALIDAD) ?? ''; } catch { /* nada */ }
  // Muchos núcleos de CPU no garantizan una GPU potente. Se conserva la elección explícita.
  if (elegida === 'alta' && vista.calidad !== 'alta') vista.cambiarCalidad();
  $('quality').textContent = vista.calidad === 'alta' ? 'Detalle' : 'Ligero';
}

export function iniciarHud(h: Hud) {
  const { motor, vista } = h;

  // ── Reloj, monedas, energía ─────────────────────────────────────────
  $('hud-reloj').onclick = () => $('calendar').click();
  $('hud-dinero').onclick = () => $('inventory-button').click();
  $('hud-menu').onclick = () => {
    if (h.panelAbierto()) { h.cerrarPanel(); return; }
    let id = 'inventario';
    try { id = localStorage.getItem(CLAVE_PESTANA) ?? id; } catch { /* nada */ }
    if (!document.querySelector(`.menu-pestana[data-panel="${id}"]`)) id = 'inventario';
    document.body.classList.remove('solo-mochila');
    h.mostrarPanel(id);
  };
  // Recordar la última pestaña del menú (como Stardew, que abre donde la dejaste)
  document.querySelectorAll<HTMLElement>('.menu-pestana').forEach((b) => b.addEventListener('click', () => {
    try { localStorage.setItem(CLAVE_PESTANA, b.dataset.panel!); } catch { /* nada */ }
  }));
  // El panel abierto cambia el aspecto del HUD (menú grande o tarjeta de un lugar)
  const panelDom = $('panel');
  new MutationObserver(() => {
    const id = h.panelAbierto();
    document.body.classList.toggle('menu-abierto', panelDom.classList.contains('open') && !!document.querySelector(`.menu-pestana[data-panel="${id}"]`));
  }).observe(panelDom, { attributes: true, attributeFilter: ['class'] });

  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-ajuste]');
    if (!b) return;
    const que = b.dataset.ajuste;
    if (que === 'personaje') $('character').click();
    else if (que === 'calidad') $('quality').click();
    else if (que === 'rejilla') $('grid-button').click();
    setTimeout(() => h.panelAbierto() === 'ajustes' && h.mostrarPanel('ajustes'), 60);
  });

  let objetoFirma = '', objetoTimer = 0;
  function reloj() {
    const s = motor.estado, c = motor.calendario(), p = vista.avatar.position;
    const clima = TIEMPOS[motor.meteorologia(p.x, p.z)];
    $('hud-dia').textContent = `${DIAS[s.jornada.diasCompletados % 7]} ${c.dia} · ${ESTACIONES[c.estacion]}`;
    $('hud-hora').textContent = `${String(c.hora).padStart(2, '0')}:${String(c.minuto).padStart(2, '0')}`;
    $('hud-clima').textContent = clima?.icono ?? '';
    $('hud-reloj').classList.toggle('tarde', c.finDelDia);
    $('hud-monedas').textContent = Math.floor(s.monedas).toLocaleString('es');
    const e = Math.max(0, Math.min(100, s.energia)), v = Math.max(0, Math.min(100, s.vida));
    $('hud-energia-relleno').style.height = e + '%';
    $('hud-energia-relleno').classList.toggle('poca', e < 25);
    $('hud-salud-relleno').style.height = v + '%';
    $('hud-salud').hidden = v >= 100 && s.zona !== 'mina' && !s.aventura.destinoActual;
    // El nombre de lo que tienes en la mano sale un momento al cambiarlo
    const activo = document.querySelector<HTMLElement>('#hotbar .hotbar-slot.active');
    const firma = activo?.title ?? '';
    if (firma !== objetoFirma) {
      objetoFirma = firma;
      $('hud-objeto').textContent = firma;
      $('hud-objeto').classList.add('visible');
      clearTimeout(objetoTimer);
      objetoTimer = window.setTimeout(() => $('hud-objeto').classList.remove('visible'), 1600);
    }
  }

  // ── Mapa: base pintada, fotos de verdad desde arriba, nombres y marcas ─────────────
  const mini = $('minimapa-lienzo') as HTMLCanvasElement, grande = $('mapa-grande-lienzo') as HTMLCanvasElement;
  const partida = () => String(motor.estado.tiempo?.semilla ?? 0);
  const fotos = new FotosMapa(vista, partida), marcas = new MarcasMapa(partida), retratos=new RetratosMapa();let cuadrosMapa=0;const ultimoCentro={x:0,z:0,t:0};
  (window as any).__granjaMapa = { fotos, marcas, clave: () => claveZona().clave, movimiento:()=>({cuadros:cuadrosMapa,...ultimoCentro}) };
  const fwd = { x: 0, z: -1 };
  /** Arriba del mapa = hacia donde mira la cámara, para que el mapa y la pantalla coincidan. */
  function orientar() {
    const d = vista.camera.getWorldDirection(vista.camera.position.clone());
    const l = Math.hypot(d.x, d.z) || 1;
    fwd.x = d.x / l; fwd.z = d.z / l;
  }
  interface Marco { ctx: CanvasRenderingContext2D; cx: number; cy: number; s: number; px: number; pz: number; w: number; h: number; dpr: number }
  const aPantalla = (m: Marco, x: number, z: number) => {
    const dx = x - m.px, dz = z - m.pz, rx = -fwd.z, rz = fwd.x;
    return { x: m.cx + m.s * (dx * rx + dz * rz), y: m.cy - m.s * (dx * fwd.x + dz * fwd.z) };
  };
  /** Lo contrario: de un punto del lienzo al mundo (para poner marcas). */
  const aMundo = (m: Marco, sx: number, sy: number) => {
    const u = (sx - m.cx) / m.s, v = (m.cy - sy) / m.s, rx = -fwd.z, rz = fwd.x;
    return { x: m.px + u * rx + v * fwd.x, z: m.pz + u * rz + v * fwd.z };
  };
  function transformar(m: Marco) {
    const rx = -fwd.z, rz = fwd.x;
    m.ctx.setTransform(m.s * rx, -m.s * fwd.x, m.s * rz, -m.s * fwd.z, m.cx - m.s * (m.px * rx + m.pz * rz), m.cy + m.s * (m.px * fwd.x + m.pz * fwd.z));
  }
  const azar = (i: number, j = 0) => { const n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return n - Math.floor(n); };

  /** La zona que se ve: un lugar del valle o una región de Astra, con sus límites [x0, x1, z0, z1]. */
  function claveZona(): { clave: string; lim: [number, number, number, number] } {
    const s = motor.estado;
    if (s.astra?.actual) { const l = planoAstra(s.astra.actual)?.limites ?? { x: 24, z: 28 }; return { clave: 'astra:' + s.astra.actual, lim: [-l.x, l.x, -l.z, l.z] }; }
    return { clave: s.zona, lim: limites(s.zona) };
  }

  // La base pintada (lo que todavía no se ha fotografiado) se dibuja una vez en su lienzo y se rehace solo cuando cambia
  // la partida, como mucho cada 2,5 s: antes se recorrían los 1.212 recursos del suelo cinco veces por segundo.
  const PPM_BASE = 4;
  let base: { clave: string; lienzo: HTMLCanvasElement; x0: number; z0: number; revision: number; cuando: number } | null = null;
  function baseZona(clave: string, lim: [number, number, number, number]) {
    const s = motor.estado, ahora = performance.now();
    if (base && base.clave === clave && (base.revision === s.revision || ahora - base.cuando < 2500)) return base;
    const [x0, x1, z0, z1] = lim, lienzo = base?.lienzo ?? document.createElement('canvas');
    lienzo.width = Math.ceil((x1 - x0) * PPM_BASE); lienzo.height = Math.ceil((z1 - z0) * PPM_BASE);
    const ctx = lienzo.getContext('2d')!;
    ctx.setTransform(PPM_BASE, 0, 0, PPM_BASE, -x0 * PPM_BASE, -z0 * PPM_BASE);
    pintarBase(ctx, lim);
    base = { clave, lienzo, x0, z0, revision: s.revision, cuando: ahora };
    return base;
  }
  function pintarBase(ctx: CanvasRenderingContext2D, [x0, x1, z0, z1]: [number, number, number, number]) {
    const s = motor.estado, zona = s.zona;
    const rect = (x: number, z: number, w: number, d: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(x, z, w, d); };
    const circulo = (x: number, z: number, r: number, color: string) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, z, r, 0, Math.PI * 2); ctx.fill(); };
    const elipse = (x: number, z: number, rx: number, rz: number, color: string) => { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, z, rx, rz, 0, 0, Math.PI * 2); ctx.fill(); };
    /** Árbol visto desde arriba: sombra, copa y brillo. */
    const arbol = (x: number, z: number, r: number, color: string) => { circulo(x + r * 0.25, z + r * 0.3, r, '#00000026'); circulo(x, z, r, color); circulo(x - r * 0.28, z - r * 0.3, r * 0.48, '#ffffff22'); };
    const piedra = (x: number, z: number, r: number) => { circulo(x + 0.1, z + 0.12, r, '#00000022'); circulo(x, z, r, '#9a9a94'); circulo(x - r * 0.3, z - r * 0.3, r * 0.4, '#c9c8c0'); };
    /** Edificio: sombra, techo y la línea del caballete. */
    const techo = (x: number, z: number, w: number, d: number, color: string, borde: string) => {
      rect(x + 0.35, z + 0.45, w, d, '#00000030'); rect(x, z, w, d, borde); rect(x + 0.3, z + 0.3, w - 0.6, d - 0.6, color);
      ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = 0.18; ctx.beginPath();
      if (w >= d) { ctx.moveTo(x + 0.4, z + d / 2); ctx.lineTo(x + w - 0.4, z + d / 2); } else { ctx.moveTo(x + w / 2, z + 0.4); ctx.lineTo(x + w / 2, z + d - 0.4); }
      ctx.stroke();
    };
    const camino = (x: number, z: number, w: number, d: number, color: string) => { rect(x - 0.15, z - 0.15, w + 0.3, d + 0.3, '#00000018'); rect(x, z, w, d, color); };
    if (claveZona().clave.startsWith('astra:')) {
      const r = regionAstra(s.astra!.actual!)!;
      rect(x0, z0, x1 - x0, z1 - z0, r.color);
      for (let i = 0; i < (x1 - x0) * (z1 - z0) / 5; i++) circulo(x0 + azar(i) * (x1 - x0), z0 + azar(i, 1) * (z1 - z0), 0.25 + azar(i, 2) * 0.3, azar(i, 3) < 0.5 ? '#ffffff14' : '#00000012');
      camino(-22, 11, 44, 3, '#e2cf9f'); camino(-1.5, -20, 3, 46, '#e2cf9f');
      for (const h of r.viviendas) techo(h.x, h.z, h.ancho, h.fondo, '#c98b6b', '#9b5f4e');
      return;
    }
    rect(x0, z0, x1 - x0, z1 - z0, PISO[zona] ?? '#9cc77a');
    // Manchitas de pasto para que no se vea plano
    for (let i = 0; i < (x1 - x0) * (z1 - z0) / 5; i++) circulo(x0 + azar(i) * (x1 - x0), z0 + azar(i, 1) * (z1 - z0), 0.25 + azar(i, 2) * 0.35, azar(i, 3) < 0.5 ? '#ffffff14' : '#00000012');
    if (zona === 'granja') {
      for (const sec of SECTORES) if (!s.sectorIds.includes(sec.id)) rect(sec.x, sec.z, sec.ancho, sec.fondo, '#5f7d4a40');
      for (const [x, z, w, d] of CAMINOS_GRANJA) camino(x, z, w, d, '#e2cf9f');
      // El agua por casillas, con bordes redondeados (círculos que se tocan)
      const agua = [...celdasAgua(s.paisaje)].map((k) => k.split(',').map(Number));
      for (const [x, z] of agua) circulo(x + 0.5, z + 0.5, 0.95, '#c9b98a');
      for (const [x, z] of agua) circulo(x + 0.5, z + 0.5, 0.74, '#4f9cc4');
      for (const [x, z] of agua) circulo(x + 0.35, z + 0.35, 0.3, '#7cc0e0');
      for (const hu of s.paisaje?.huecos ?? []) if (!hu.relleno) circulo(hu.x + 0.5, hu.z + 0.5, 0.45, '#5b4a3c');
      for (const p of s.parcelas) {
        const regada = p.campo?.riegoDia === s.jornada.diasCompletados || p.campo?.riegoManualDia === s.jornada.diasCompletados;
        rect(p.x + 0.04, p.z + 0.04, 0.92, 0.92, regada ? '#6e4c31' : '#a67b52');
        if (p.cultivo && p.cuidado) {
          const maduro = p.cuidado.status === 'maduro', seco = p.cuidado.status === 'arruinado';
          circulo(p.x + 0.5, p.z + 0.5, maduro ? 0.4 : 0.28, seco ? '#9b8f6a' : maduro ? '#f2a43a' : '#4f9a3c');
        }
      }
      for (const f of s.frutales) if (!f.edificioId) { arbol(f.x + 0.5, f.z + 0.5, 1.1, '#3f7d3a'); if (f.frutos) circulo(f.x + 0.5, f.z + 0.5, 0.4, '#e5604f'); }
    }
    if (zona === 'lago') { elipse(28, 89, 13.6, 10.6, '#c9b98a'); elipse(28, 89, 13, 10, '#3f8fb8'); elipse(25, 86.5, 7, 5, '#6fb3d6'); }
    if (zona === 'pueblo') {
      for (const [x, z, w, d] of CAMINOS_PUEBLO) camino(w < 0 ? x + w : x, d < 0 ? z + d : z, Math.abs(w), Math.abs(d), '#dccaa3');
      for (const [x, z, r] of ARBOLES_PUEBLO) arbol(x, z, r * 0.45, '#4d8a45');
      for (const v of VIVIENDAS_PUEBLO) if (!v.edificio) techo(v.x, v.z, v.ancho, v.fondo, '#d9a184', '#b07257');
      for (const e of EDIFICIOS_PUEBLO) techo(e.x, e.z, e.ancho, e.fondo, '#bf7a5f', '#8e4f45');
    }
    for (const o of s.obstaculos) {
      if ((o.zona ?? 'granja') !== zona || o.hp <= 0 || (zona === 'mina' && o.nivelMina !== s.nivelMina)) continue;
      if (o.tipo === 'arbol') arbol(o.x + 0.5, o.z + 0.5, o.gigante ? 1.5 : 0.85, zona === 'bosque_ancestral' ? '#2b5d3c' : '#2f6b33');
      else if (o.tipo === 'roca') piedra(o.x + 0.5, o.z + 0.5, 0.42);
      else if (o.tipo === 'maleza') circulo(o.x + 0.5, o.z + 0.5, 0.32, '#6c9a3e');
      else rect(o.x, o.z, 1, 1, '#8b6f55');
    }
    if (zona === 'granja') {
      for (const b of s.edificios) {
        const a = ARTICULOS.find((a) => a.id === b.articulo);
        if (!a) continue;
        const hh = huella(b);
        if (a.categoria === 'suelo') rect(hh.x, hh.z, hh.ancho, hh.fondo, '#d8c49a');
        else if (a.categoria === 'valla') rect(hh.x + 0.3, hh.z + 0.3, Math.max(0.4, hh.ancho - 0.6), Math.max(0.4, hh.fondo - 0.6), '#8a6040');
      }
      for (const b of s.edificios) {
        const a = ARTICULOS.find((a) => a.id === b.articulo);
        if (!a || a.categoria === 'suelo' || a.categoria === 'valla') continue;
        const hh = huella(b), casa = a.categoria === 'casa' || a.categoria === 'refugio';
        if (casa) techo(hh.x, hh.z, hh.ancho, hh.fondo, '#c46e5c', '#8e4f45'); else { rect(hh.x + 0.2, hh.z + 0.25, hh.ancho, hh.fondo, '#00000022'); rect(hh.x, hh.z, hh.ancho, hh.fondo, '#b98a5e'); }
      }
      for (const n of motor.nodosProduccion()) {
        if (n.zona !== zona) continue;
        const hh = huellaProduccion(n);
        rect(hh.x + 0.1, hh.z + 0.1, hh.ancho - 0.2, hh.fondo - 0.2, n.articulo.startsWith('aspersor_') ? '#7fc3df' : '#a9a197');
      }
    }
  }

  /** Los nombres que salen en el mapa: salidas, edificios y lugares. */
  function lugares(): { x: number; z: number; nombre: string; salida?: boolean }[] {
    const s = motor.estado, out: { x: number; z: number; nombre: string; salida?: boolean }[] = [];
    if (s.astra?.actual) {
      for (const ruta of rutasDesde(s)) if (ruta.punto) out.push({ x: ruta.punto.x, z: ruta.punto.z, nombre: regionAstra(ruta.destino)?.nombre ?? 'Granja', salida: true });
      const r = regionAstra(s.astra.actual)!;
      RECURSOS_ASTRA.find((v) => v.id === r.id)?.recursos.forEach((d, i) => { const p = puntoRecurso(r.id, i); out.push({ x: p.x, z: p.z, nombre: d.nombre }); });
      return out;
    }
    for (const sal of SALIDAS) if (sal.desde === s.zona) out.push({ x: sal.x + 0.5, z: sal.z + 0.5, nombre: DESTINOS[sal.hacia].nombre, salida: true });
    if (s.zona === 'pueblo') {
      for (const e of EDIFICIOS_PUEBLO) out.push({ x: e.x + e.ancho / 2, z: e.z + e.fondo / 2, nombre: e.nombre });
      for (const v of VIVIENDAS_PUEBLO) if (!v.edificio) out.push({ x: v.x + v.ancho / 2, z: v.z + v.fondo / 2, nombre: v.nombre });
    }
    if (s.zona === 'granja') for (const b of s.edificios) {
      const a = ARTICULOS.find((a) => a.id === b.articulo);
      if (!a || !(a.categoria === 'casa' || a.categoria === 'refugio' || b.articulo === ARTICULO_ENVIO || b.articulo === 'hogar_mascota')) continue;
      const hh = huella(b);
      out.push({ x: hh.x + hh.ancho / 2, z: hh.z + hh.fondo / 2, nombre: b.articulo === 'hogar_mascota' ? 'Hogar de la mascota' : a.nombre });
    }
    if (s.zona === 'lago') out.push({ x: 28, z: 86, nombre: 'Lago de los Lirios' }, { x: 15, z: 88, nombre: 'Muelle' });
    return out;
  }

  /** Un nombre con su fondo; no se dibuja si se monta encima de otro (salvo los importantes). */
  function rotulo(m: Marco, ocupado: number[][], texto: string, x: number, y: number, px: number, estilo: 'lugar' | 'salida', forzar = false) {
    const ctx = m.ctx;
    ctx.font = `700 ${px}px Nunito, sans-serif`;
    const t = estilo === 'salida' ? '➜ ' + texto : texto, w = ctx.measureText(t).width + px * 0.9, h = px * 1.45, aire = 2 * m.dpr;
    if (x + w / 2 < 0 || x - w / 2 > m.w || y < 0 || y > m.h) return;
    // Si se monta encima de otro nombre, se prueba un poquito más arriba o más abajo antes de saltárselo
    const choca = (c: number[]) => ocupado.some((o) => c[0] - aire < o[0] + o[2] && c[0] + c[2] + aire > o[0] && c[1] - aire < o[1] + o[3] && c[1] + c[3] + aire > o[1]);
    let caja: number[] | undefined;
    for (const dy of [0, -h * 1.05, h * 1.05]) { const c = [x - w / 2, y + dy - h / 2, w, h]; if (!choca(c)) { caja = c; break; } }
    if (!caja) { if (!forzar) return; caja = [x - w / 2, y - h / 2, w, h]; }
    ocupado.push(caja);
    y = caja[1] + h / 2;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = estilo === 'salida' ? '#f6cf5aee' : '#fff8eee0';
    ctx.beginPath(); ctx.roundRect(caja[0], caja[1], w, h, h / 2); ctx.fill();
    ctx.strokeStyle = estilo === 'salida' ? '#a9782b' : '#c8b28c'; ctx.lineWidth = Math.max(1, px * 0.1); ctx.stroke();
    ctx.fillStyle = '#3d2b27'; ctx.fillText(t, x, y + px * 0.05);
  }
  function flechaYo(m: Marco) {
    const ctx = m.ctx, yo = vista.avatar.position, q = aPantalla(m, yo.x, yo.z), rot = vista.avatar.direccionMontura;
    const dirX = Math.sin(rot), dirZ = Math.cos(rot), ang = Math.atan2(dirX * -fwd.z + dirZ * fwd.x, dirX * fwd.x + dirZ * fwd.z), k = m.dpr;
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(ang); ctx.scale(k, k);
    ctx.fillStyle = motor.estado.personaje === 'ella' ? '#e4566b' : '#3f86c9'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2.5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  /** Chincheta de una marca (la que te guía, más grande y dorada). */
  function chincheta(m: Marco, x: number, y: number, guia: boolean) {
    const ctx = m.ctx, k = m.dpr * (guia ? 1.25 : 1);
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#0000002e'; ctx.beginPath(); ctx.ellipse(0, 0, 3.5, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = guia ? '#f2b33d' : '#e4566b'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-2, -5, -6, -7, -6, -11); ctx.arc(0, -11, 6, Math.PI, 0); ctx.bezierCurveTo(6, -7, 2, -5, 0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -11, 2.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function dibujarZona(m: Marco, grandeMapa: boolean) {
    const s = motor.estado, ctx = m.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = s.zona === 'mina' && !s.astra?.actual ? '#211d24' : '#4f6b4a';
    ctx.fillRect(0, 0, m.w, m.h);
    const exp = instanciaAventura(s.aventura);
    if (exp) { dibujarExpedicion(m, exp); return; }
    const { clave, lim } = claveZona(), b = baseZona(clave, lim), hoja = fotos.hoja(clave, lim);
    transformar(m);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(b.lienzo, b.x0, b.z0, b.lienzo.width / PPM_BASE, b.lienzo.height / PPM_BASE);
    // Lo que no se ha recorrido queda como un plano dibujado, más pálido; encima, las fotos de lo que ya se vio
    ctx.fillStyle = '#f4ead266'; ctx.fillRect(b.x0, b.z0, b.lienzo.width / PPM_BASE, b.lienzo.height / PPM_BASE);
    ctx.drawImage(hoja.lienzo, hoja.x0, hoja.z0, hoja.cols * LADO_FOTO, hoja.filas * LADO_FOTO);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const ocupado: number[][] = [], k = m.dpr, yo = vista.avatar.position;
    // Uno mismo no se tapa con nombres
    const qy = aPantalla(m, yo.x, yo.z); ocupado.push([qy.x - 8 * k, qy.y - 8 * k, 16 * k, 16 * k]);
    const vecinos = vista.puntosMapa();
    // Primero los nombres de los lugares (las salidas siempre), después los vecinos
    const px = (grandeMapa ? 10.5 : 8) * k;
    for (const l of lugares().sort((a, b) => +!!b.salida - +!!a.salida)) {
      const q = aPantalla(m, l.x, l.z);
      if (l.salida) { ctx.fillStyle = '#f6cf5a'; ctx.strokeStyle = '#3d2b27'; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.arc(q.x, q.y, (grandeMapa ? 5 : 3.5) * k, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      rotulo(m, ocupado, l.nombre, q.x, l.salida ? q.y - 9 * k : q.y, l.salida ? px * 0.95 : px, l.salida ? 'salida' : 'lugar', !!l.salida && grandeMapa);
    }
    for (const n of vecinos) {
      const q = aPantalla(m, n.x, n.z), r = (grandeMapa ? 9 : 6.5) * k;
      if(q.x+r<0||q.y+r<0||q.x-r>m.w||q.y-r>m.h)continue;
      retratos.dibujar(ctx,n.id,q.x,q.y,r,'#9c795c');
    }
    // Las marcas de esta zona
    for (const mk of marcas.lista) if (mk.zona === clave) { const q = aPantalla(m, mk.x, mk.z); chincheta(m, q.x, q.y, mk.id === marcas.activa); }
    flechaYo(m);
  }
  /** Plano del piso de la expedición (galerías, vetas, monstruos, escalera y cofres), cacheado por mapa. */
  let planoClave = '', plano: HTMLCanvasElement | null = null, planoX = 0, planoZ = 0;
  const circulo = (m: Marco, x: number, z: number, r: number, color: string) => { m.ctx.fillStyle = color; m.ctx.beginPath(); m.ctx.arc(x, z, r, 0, Math.PI * 2); m.ctx.fill(); };
  function dibujarExpedicion(m: Marco, i: NonNullable<ReturnType<typeof instanciaAventura>>) {
    const ctx = m.ctx, clave = i.id + ':' + i.semilla + ':' + Object.keys(i.chunks).length;
    ctx.fillStyle = '#1b181f'; ctx.fillRect(0, 0, m.w, m.h);
    if (clave !== planoClave) {
      const xs = Object.values(i.chunks).flatMap((c) => [c.x, c.x + c.ancho]), zs = Object.values(i.chunks).flatMap((c) => [c.z, c.z + c.fondo]);
      planoX = Math.min(...xs); planoZ = Math.min(...zs);
      plano = document.createElement('canvas'); plano.width = Math.max(...xs) - planoX; plano.height = Math.max(...zs) - planoZ;
      const p = plano.getContext('2d')!; p.fillStyle = i.destinoId === MINA ? '#8b7f72' : '#8a8f86';
      for (const [k, t] of Object.entries(i.suelos)) if (t === 'suelo') { const [x, z] = k.split(',').map(Number); p.fillRect(x - planoX, z - planoZ, 1, 1); }
      planoClave = clave;
    }
    transformar(m); ctx.imageSmoothingEnabled = false;
    if (plano) ctx.drawImage(plano, planoX, planoZ);
    for (const n of i.nodos) if (!n.agotado) circulo(m, n.x, n.z, 0.38, MINERALES_COLOR[n.mineral] ?? '#c9c2b6');
    for (const s2 of i.situaciones) if (!s2.resuelta) circulo(m, s2.x, s2.z, 0.7, s2.tipo === 'cofre' ? '#f2c14e' : '#d9c6f0');
    for (const mo of i.monstruos) if (mo.vivo) circulo(m, mo.x, mo.z, 0.5, '#e05a5a');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
    for (const e of i.entradas) {
      const q = aPantalla(m, e.x, e.z);
      ctx.fillStyle = e.tipo === 'descenso' ? '#f6cf5a' : '#9fe0b8'; ctx.strokeStyle = '#3d2b27'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(q.x, q.y, 5 * m.dpr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3d2b27'; ctx.font = `700 ${8 * m.dpr}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e.tipo === 'descenso' ? '↓' : '↑', q.x, q.y + 0.5);
    }
    flechaYo(m);
  }

  /** La flecha del minimapa hacia la marca que te guía (o hacia la salida que lleva a ella) y lo que falta. */
  let llegada = 0;
  function guiaMarca(m: Marco): string {
    marcas.revisar();
    const g = marcas.guia, s = motor.estado;
    if (performance.now() - llegada < 2500) return '📍 ¡Llegaste a tu marca!';
    if (!g || s.interior || s.servicio || s.aventura.destinoActual || s.astra?.interior) return '';
    const { clave } = claveZona(), yo = vista.avatar.position;
    let meta: { x: number; z: number } | undefined, texto = '';
    if (g.zona === clave) {
      const d = Math.hypot(g.x - yo.x, g.z - yo.z);
      if (d < 2.2) { marcas.quitar(g.id); llegada = performance.now(); return '📍 ¡Llegaste a tu marca!'; }
      meta = g; texto = `📍 Tu marca · ${Math.round(d)} m`;
    } else if (!s.astra?.actual && !g.zona.startsWith('astra:')) {
      const ruta = rutaCaminando(s.zona, g.zona as Zona)[0];
      if (ruta) { meta = { x: ruta.x + 0.5, z: ruta.z + 0.5 }; texto = `📍 Tu marca en ${DESTINOS[g.zona as Zona]?.nombre ?? g.zona} · ve por el ${ruta.nombre.toLowerCase()}`; }
    } else texto = '📍 Tu marca está en otro lugar';
    if (meta) {
      const q = aPantalla(m, meta.x, meta.z), margen = 9 * m.dpr;
      if (q.x < margen || q.x > m.w - margen || q.y < margen || q.y > m.h - margen) {
        const ang = Math.atan2(q.y - m.cy, q.x - m.cx), ctx = m.ctx;
        const t = Math.min((m.w / 2 - margen) / Math.abs(Math.cos(ang) || 1e-6), (m.h / 2 - margen) / Math.abs(Math.sin(ang) || 1e-6));
        ctx.save(); ctx.translate(m.cx + Math.cos(ang) * t, m.cy + Math.sin(ang) * t); ctx.rotate(ang + Math.PI / 2); ctx.scale(m.dpr, m.dpr);
        ctx.fillStyle = '#f2b33d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 4); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
    return texto;
  }

  function prepararLienzo(c: HTMLCanvasElement) {
    const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr)), hh = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== hh) { c.width = w; c.height = hh; }
    return { ctx: c.getContext('2d')!, w, h: hh, dpr };
  }
  function nombreLugar() {
    const s = motor.estado, exp = instanciaAventura(s.aventura);
    return exp ? (exp.destinoId === MINA ? `Minas · piso ${exp.nivel}` : `${destinoAventura(exp.destinoId)?.nombre ?? ''} · ${exp.nivel}`) : s.astra?.actual ? regionAstra(s.astra.actual)!.nombre : s.interior ? $('place-name').textContent ?? '' : DESTINOS[s.zona].nombre;
  }
  function pintarMini() {
    const s = motor.estado;
    $('minimapa').classList.toggle('apagado', !!(s.astra?.interior || s.interior || s.servicio || s.aventura.destinoActual));
    const { ctx, w, h: alto, dpr } = prepararLienzo(mini);
    orientar();
    const p = vista.avatar.position;cuadrosMapa++;ultimoCentro.x=p.x;ultimoCentro.z=p.z;ultimoCentro.t=performance.now();
    const m: Marco = { ctx, cx: w / 2, cy: alto / 2, s: 3.6 * dpr, px: p.x, pz: p.z, w, h: alto, dpr };
    dibujarZona(m, false);
    const guia = guiaMarca(m);
    $('minimapa-nombre').textContent = nombreLugar();
    $('minimapa-guia').hidden = !guia;
    $('minimapa-guia').textContent = guia;
  }
  let marcoGrande: Marco | null = null;
  /** Acercar (rueda o pellizco) y arrastrar el mapa grande; al abrirlo se ve la zona entera. */
  let zoomG = 1;
  const centroG = { x: 0, z: 0 };
  function verZonaEntera() { const [x0, x1, z0, z1] = claveZona().lim; zoomG = 1; centroG.x = (x0 + x1) / 2; centroG.z = (z0 + z1) / 2; }
  function acercar(factor: number, sx: number, sy: number) {
    const m = marcoGrande;
    if (!m) return;
    const fijo = aMundo(m, sx, sy), nuevo = Math.max(1, Math.min(6, zoomG * factor));
    const despues: Marco = { ...m, s: (m.s / zoomG) * nuevo };
    const d = aMundo(despues, sx, sy);
    zoomG = nuevo; centroG.x += fijo.x - d.x; centroG.z += fijo.z - d.z;
    pintarGrande();
  }
  function pintarGrande() {
    const s = motor.estado, { ctx, w, h: alto, dpr } = prepararLienzo(grande), [x0, x1, z0, z1] = claveZona().lim;
    orientar();
    // El mapa grande va derecho, con arriba hacia el eje más parecido a la cámara: así la zona llena la pantalla
    // (girada como el minimapa quedaba en rombo y sobraba mucho espacio a los lados)
    if (Math.abs(fwd.x) > Math.abs(fwd.z)) { fwd.x = Math.sign(fwd.x); fwd.z = 0; } else { fwd.z = Math.sign(fwd.z) || -1; fwd.x = 0; }
    // Cabe la zona entera girada
    const rx = -fwd.z, rz = fwd.x, esquinas = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]];
    const us = esquinas.map(([x, z]) => x * rx + z * rz), vs = esquinas.map(([x, z]) => x * fwd.x + z * fwd.z);
    const ancho = Math.max(...us) - Math.min(...us), largo = Math.max(...vs) - Math.min(...vs);
    const esc = Math.min((w - 20 * dpr) / ancho, (alto - 20 * dpr) / largo);
    centroG.x = Math.max(x0, Math.min(x1, centroG.x)); centroG.z = Math.max(z0, Math.min(z1, centroG.z));
    const m: Marco = { ctx, cx: w / 2, cy: alto / 2, s: esc * zoomG, px: centroG.x, pz: centroG.z, w, h: alto, dpr };
    marcoGrande = m;
    dibujarZona(m, true);
    $('mapa-grande-titulo').textContent = s.astra?.actual ? regionAstra(s.astra.actual)!.nombre : DESTINOS[s.zona].nombre;
    const { tomadas, total } = fotos.cobertura(claveZona().clave);
    $('mapa-explorado').textContent = total ? `Explorado ${Math.round((100 * tomadas) / total)}%` : '';
  }
  const dedos = new Map<number, { x: number; y: number }>();
  let arrastre = 0, pellizco = 0;
  const enLienzo = (e: PointerEvent | WheelEvent) => { const r = grande.getBoundingClientRect(), k = marcoGrande?.dpr ?? 1; return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k }; };
  grande.addEventListener('wheel', (e) => { e.preventDefault(); const q = enLienzo(e); acercar(e.deltaY < 0 ? 1.25 : 0.8, q.x, q.y); }, { passive: false });
  grande.addEventListener('pointerdown', (e) => { grande.setPointerCapture(e.pointerId); dedos.set(e.pointerId, enLienzo(e)); arrastre = 0; if (dedos.size === 2) { const [a, b] = [...dedos.values()]; pellizco = Math.hypot(a.x - b.x, a.y - b.y); } });
  grande.addEventListener('pointermove', (e) => {
    const antes = dedos.get(e.pointerId), m = marcoGrande;
    if (!antes || !m) return;
    const q = enLienzo(e);
    dedos.set(e.pointerId, q);
    if (dedos.size === 2) {
      const [a, b] = [...dedos.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pellizco > 0) acercar(d / pellizco, (a.x + b.x) / 2, (a.y + b.y) / 2);
      pellizco = d; arrastre = 99; return;
    }
    arrastre += Math.hypot(q.x - antes.x, q.y - antes.y);
    if (arrastre < 6 * m.dpr) return;
    const w0 = aMundo(m, antes.x, antes.y), w1 = aMundo(m, q.x, q.y);
    centroG.x -= w1.x - w0.x; centroG.z -= w1.z - w0.z;
    pintarGrande();
  });
  const soltarDedo = (e: PointerEvent) => {
    const tenia = dedos.delete(e.pointerId);
    if (dedos.size < 2) pellizco = 0;
    if (!tenia || e.type !== 'pointerup' || arrastre >= 6 * (marcoGrande?.dpr ?? 1) || dedos.size) return;
    // Un toque sin arrastrar: poner o quitar una marca
    const m = marcoGrande, s = motor.estado;
    if (!m || instanciaAventura(s.aventura) || s.interior || s.servicio || s.astra?.interior) return;
    const q = enLienzo(e), p = aMundo(m, q.x, q.y), { clave, lim } = claveZona();
    if (p.x < lim[0] || p.x > lim[1] || p.z < lim[2] || p.z > lim[3]) return;
    marcas.tocar(clave, p.x, p.z, (16 * m.dpr) / m.s);
    pintarGrande();
  };
  grande.addEventListener('pointerup', soltarDedo);
  grande.addEventListener('pointercancel', soltarDedo);

  // ── Mapa grande ─────────────────────────────────────────────────────
  const abrirMapa = () => { h.cerrarPanel(); vista.avatar.detener(); h.controles.limpiar(); $('mapa-grande').hidden = false; document.body.classList.add('mapa-abierto'); verZonaEntera(); requestAnimationFrame(pintarGrande); };
  const cerrarMapa = () => { $('mapa-grande').hidden = true; document.body.classList.remove('mapa-abierto'); fotos.guardarTodo(); };
  $('minimapa').onclick = abrirMapa;
  $('mapa-cerrar').onclick = cerrarMapa;
  $('mapa-grande').addEventListener('click', (e) => { if (e.target === $('mapa-grande')) cerrarMapa(); });
  // Al escoger un lugar del valle se cierra el mapa para ver la ruta marcada en el mundo
  document.querySelectorAll<HTMLElement>('#mapa-grande [data-zone]').forEach((g) => g.addEventListener('click', () => setTimeout(cerrarMapa, 30)));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('mapa-grande').hidden) { e.preventDefault(); cerrarMapa(); }
    else if (e.key.toLowerCase() === 'm' && !(e.target as HTMLElement).matches('input,select,textarea')) $('mapa-grande').hidden ? abrirMapa() : cerrarMapa();
  });

  // ── Palanca táctil ──────────────────────────────────────────────────
  const tactil = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  document.body.classList.toggle('es-tactil', tactil);
  const palanca = $('palanca'), bola = $('palanca-bola');
  let dedo: number | null = null, cx = 0, cy = 0;
  const RADIO = 42;
  const mover = (x: number, y: number) => {
    let dx = x - cx, dy = y - cy;
    const l = Math.hypot(dx, dy);
    if (l > RADIO) { dx *= RADIO / l; dy *= RADIO / l; }
    bola.style.transform = `translate(${dx}px, ${dy}px)`;
    const f = Math.min(1, l / RADIO);
    // Zona muerta pequeña para que no camine solo con apoyar el dedo
    h.controles.eje = f < 0.18 ? { x: 0, y: 0 } : { x: (dx / RADIO), y: -(dy / RADIO) };
  };
  palanca.addEventListener('pointerdown', (e) => {
    if (dedo !== null) return;
    dedo = e.pointerId; palanca.setPointerCapture(e.pointerId);
    const r = palanca.querySelector('.palanca-base')!.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    palanca.classList.add('activa'); mover(e.clientX, e.clientY); e.preventDefault();
  });
  palanca.addEventListener('pointermove', (e) => { if (e.pointerId === dedo) mover(e.clientX, e.clientY); });
  const soltar = (e: PointerEvent) => { if (e.pointerId !== dedo) return; dedo = null; bola.style.transform = ''; h.controles.eje = { x: 0, y: 0 }; palanca.classList.remove('activa'); };
  palanca.addEventListener('pointerup', soltar);
  palanca.addEventListener('pointercancel', soltar);
  palanca.addEventListener('lostpointercapture', soltar);

  // ── Calidad automática: con detalle en celulares potentes, y baja sola si el juego va lento ─────
  let elegida = '';
  try { elegida = localStorage.getItem(CLAVE_CALIDAD) ?? ''; } catch { /* nada */ }
  // Si la persona la cambia en Ajustes, se respeta su elección
  // (antes se leía solo al abrir el juego: escoger «con detalle» en Ajustes no evitaba que bajara sola a ligeros)
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-ajuste="calidad"],[data-do="calidad"]')) setTimeout(() => { elegida = vista.calidad; lentos = 0; try { localStorage.setItem(CLAVE_CALIDAD, vista.calidad); } catch { /* nada */ } }, 0);
  }, true);
  let cuadros = 0, desde = performance.now(), lentos = 0;
  const inicio = performance.now();
  const medir = (t: number) => {
    requestAnimationFrame(medir);
    if (document.hidden) { desde = t; cuadros = 0; return; }
    cuadros++;
    if (t - desde < 4000) return;
    const fps = (cuadros * 1000) / (t - desde);
    cuadros = 0; desde = t;
    // Solo baja sola si nadie la escogió, y después de 12 s seguidos lentos (un tirón suelto no cuenta)
    // Los primeros segundos (cargar modelos y compilar) no cuentan
    lentos = fps < 20 && !h.panelAbierto() && t - inicio > 12000 ? lentos + 1 : 0;
    if (lentos >= 3 && vista.calidad === 'alta' && !elegida) { $('quality').click(); lentos = 0; }
  };
  requestAnimationFrame(medir);

  // ── Bucle (barato: 5 veces por segundo, nada cuando la app duerme) ──
  let ultimoMovimiento=performance.now();
  const tic = () => {
    if (document.hidden) return;
    try {
      reloj();const s=motor.estado;$('minimapa').classList.toggle('apagado',!!(s.interior||s.servicio||s.astra?.interior));$('minimapa-nombre').textContent=nombreLugar();
      const zona=claveZona();baseZona(zona.clave,zona.lim);
      if(vista.avatar.moviendo)ultimoMovimiento=performance.now();
      // Una foto de lo que está cerca (si falta o está vieja) para el mapa de verdad
      // (las pruebas pueden apagarlas con window.__sinFotosMapa: sin tarjeta de video cada foto es lenta)
      if (!vista.avatar.moviendo && performance.now()-ultimoMovimiento>500 && !h.panelAbierto() && !instanciaAventura(motor.estado.aventura) && !(window as any).__sinFotosMapa) { const z = claveZona(); void fotos.tic(z.clave, z.lim); }
    } catch (e) { console.warn('HUD', e); }
  };
  let ultimaPintada=0;
  const moverMapa=(t:number)=>{requestAnimationFrame(moverMapa);if(document.hidden)return;const s=motor.estado;if(!$('mapa-grande').hidden){if(t-ultimaPintada>=100){pintarGrande();ultimaPintada=t;}}else if(!h.panelAbierto()&&!s.interior&&!s.servicio&&!s.astra?.interior&&(vista.avatar.moviendo||t-ultimaPintada>=100)){pintarMini();ultimaPintada=t;}};
  tic();requestAnimationFrame(moverMapa);
  setInterval(tic, 200);
}
