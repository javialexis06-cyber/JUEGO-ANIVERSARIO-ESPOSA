import { regionAstra, regionActual, NPC_ASTRA, RECURSOS_ASTRA, puntoRecurso, posicionNpcAstra, rutasDesde } from './astra';
// La cara de la granja: reloj, monedas, energía, minimapa, mapa grande con buscador de vecinos, menú de pestañas y
// palanca táctil. Solo lee el estado del motor y abre los paneles que ya existen: no cambia reglas ni partidas.
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
const CLAVE_BUSCADO = 'granja-hud-buscado';
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
    <button class="ajuste" data-ajuste="rejilla"><i>▦</i><span><b>Cuadrícula</b><small>Para acomodar cultivos y construcciones</small></span></button>
    ${partida}
    <div class="ajustes-ayuda"><b>Cómo se juega</b><p>Camina con la palanca (o WASD). Toca una casilla para usar lo que tienes en la mano; si está lejos, tu personaje camina hasta allá. Toca un vecino, un animal o una puerta para hablar o entrar. Duerme en la cabaña para pasar el día.</p></div>
  </div>`;
}

const CLAVE_CALIDAD = 'granja-hud-calidad';
/** Antes de cargar los modelos (así no se cargan dos veces): con detalle en celulares potentes o si la persona lo
 * escogió en Ajustes. */
export function calidadInicial(vista: VistaGranja) {
  let elegida = '';
  try { elegida = localStorage.getItem(CLAVE_CALIDAD) ?? ''; } catch { /* nada */ }
  const nav = navigator as Navigator & { deviceMemory?: number };
  const potente = (nav.deviceMemory ?? 4) >= 6 || (navigator.hardwareConcurrency ?? 4) >= 8;
  if ((elegida === 'alta' || (!elegida && potente)) && vista.calidad !== 'alta') vista.cambiarCalidad();
  $('quality').textContent = vista.calidad === 'alta' ? 'Detalle' : 'Ligero';
}

export function iniciarHud(h: Hud) {
  const { motor, vista } = h;
  let buscado = '';
  try { buscado = localStorage.getItem(CLAVE_BUSCADO) ?? ''; } catch { /* sin almacenamiento */ }

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

  // ── Mapa: dibujo de la zona ─────────────────────────────────────────
  const mini = $('minimapa-lienzo') as HTMLCanvasElement, grande = $('mapa-grande-lienzo') as HTMLCanvasElement;
  const fwd = { x: 0, z: -1 };
  /** Arriba del mapa = hacia donde mira la cámara, para que el mapa y la pantalla coincidan. */
  function orientar() {
    const d = vista.camera.getWorldDirection(vista.camera.position.clone());
    const l = Math.hypot(d.x, d.z) || 1;
    fwd.x = d.x / l; fwd.z = d.z / l;
  }
  interface Marco { ctx: CanvasRenderingContext2D; cx: number; cy: number; s: number; px: number; pz: number; w: number; h: number }
  const aPantalla = (m: Marco, x: number, z: number) => {
    const dx = x - m.px, dz = z - m.pz, rx = -fwd.z, rz = fwd.x;
    return { x: m.cx + m.s * (dx * rx + dz * rz), y: m.cy - m.s * (dx * fwd.x + dz * fwd.z) };
  };
  function transformar(m: Marco) {
    const rx = -fwd.z, rz = fwd.x;
    m.ctx.setTransform(m.s * rx, -m.s * fwd.x, m.s * rz, -m.s * fwd.z, m.cx - m.s * (m.px * rx + m.pz * rz), m.cy + m.s * (m.px * fwd.x + m.pz * fwd.z));
  }
  const rect = (m: Marco, x: number, z: number, w: number, d: number, color: string) => { m.ctx.fillStyle = color; m.ctx.fillRect(x, z, w, d); };
  function circulo(m: Marco, x: number, z: number, r: number, color: string) { m.ctx.fillStyle = color; m.ctx.beginPath(); m.ctx.arc(x, z, r, 0, Math.PI * 2); m.ctx.fill(); }
  function elipse(m: Marco, x: number, z: number, rx: number, rz: number, color: string) { m.ctx.fillStyle = color; m.ctx.beginPath(); m.ctx.ellipse(x, z, rx, rz, 0, 0, Math.PI * 2); m.ctx.fill(); }

  function dibujarZona(m: Marco, conNombres: boolean) {
    const s = motor.estado, zona = s.zona, [x0, x1, z0, z1] = limites(zona), ctx = m.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = zona === 'mina' ? '#211d24' : '#4f6b4a';
    ctx.fillRect(0, 0, m.w, m.h);
    const exp = instanciaAventura(s.aventura);
    if (exp) { dibujarExpedicion(m, exp); return []; }
    if(s.astra?.actual)return dibujarAstra(m,conNombres);
    transformar(m);
    rect(m, x0, z0, x1 - x0, z1 - z0, PISO[zona] ?? '#9cc77a');
    if (zona === 'granja') {
      // Terrenos que todavía no son nuestros: más apagados
      for (const sec of SECTORES) if (!s.sectorIds.includes(sec.id)) rect(m, sec.x, sec.z, sec.ancho, sec.fondo, '#86a96c');
      for (const sec of SECTORES) if (s.sectorIds.includes(sec.id)) { ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 0.25; ctx.strokeRect(sec.x, sec.z, sec.ancho, sec.fondo); }
      for (const [x, z, w, d] of CAMINOS_GRANJA) rect(m, x, z, w, d, '#e2cf9f');
      for (const e of s.paisaje?.estanques ?? []) elipse(m, e.x, e.z, e.radioX, e.radioZ, '#6fb3d6');
      for (const hu of s.paisaje?.huecos ?? []) if (!hu.relleno) circulo(m, hu.x + 0.5, hu.z + 0.5, 0.45, '#5b4a3c');
      for (const p of s.parcelas) {
        const regada = p.campo?.riegoDia === s.jornada.diasCompletados || p.campo?.riegoManualDia === s.jornada.diasCompletados;
        rect(m, p.x, p.z, 1, 1, regada ? '#7a5638' : '#a67b52');
        if (p.cultivo && p.cuidado) {
          const maduro = p.cuidado.status === 'maduro', seco = p.cuidado.status === 'arruinado';
          circulo(m, p.x + 0.5, p.z + 0.5, maduro ? 0.42 : 0.3, seco ? '#9b8f6a' : maduro ? '#f2a43a' : '#4f9a3c');
        }
      }
      for (const f of s.frutales) if (!f.edificioId) { circulo(m, f.x + 0.5, f.z + 0.5, 1.1, '#3f7d3a'); if (f.frutos) circulo(m, f.x + 0.5, f.z + 0.5, 0.45, '#e5604f'); }
    }
    if (zona === 'lago') elipse(m, 28, 89, 13, 10, '#6fb3d6');
    if (zona === 'pueblo') {
      for (const [x, z, w, d] of CAMINOS_PUEBLO) rect(m, w < 0 ? x + w : x, d < 0 ? z + d : z, Math.abs(w), Math.abs(d), '#e2cf9f');
      for (const [x, z, r] of ARBOLES_PUEBLO) circulo(m, x, z, r * 0.45, '#4d8a45');
      for (const v of VIVIENDAS_PUEBLO) if (!v.edificio) { rect(m, v.x, v.z, v.ancho, v.fondo, '#c98b6b'); rect(m, v.x + 0.3, v.z + 0.3, v.ancho - 0.6, v.fondo - 0.6, '#d9a184'); }
      for (const e of EDIFICIOS_PUEBLO) { rect(m, e.x, e.z, e.ancho, e.fondo, '#9b5f4e'); rect(m, e.x + 0.4, e.z + 0.4, e.ancho - 0.8, e.fondo - 0.8, '#bf7a5f'); }
    }
    // Recursos del suelo: árboles, rocas, maleza y ruinas
    for (const o of s.obstaculos) {
      if ((o.zona ?? 'granja') !== zona || o.hp <= 0 || (zona === 'mina' && o.nivelMina !== s.nivelMina)) continue;
      if (o.tipo === 'arbol') circulo(m, o.x + 0.5, o.z + 0.5, o.gigante ? 1.4 : 0.8, '#2f6b33');
      else if (o.tipo === 'roca') circulo(m, o.x + 0.5, o.z + 0.5, 0.42, '#9a9a94');
      else if (o.tipo === 'maleza') circulo(m, o.x + 0.5, o.z + 0.5, 0.3, '#6c9a3e');
      else rect(m, o.x, o.z, 1, 1, '#8b6f55');
    }
    if (zona === 'granja' && !s.interior) {
      // Lo que uno construye: caminos, cercas, edificios, cofres y máquinas
      for (const b of s.edificios) {
        const a = ARTICULOS.find((a) => a.id === b.articulo);
        if (!a) continue;
        const hh = huella(b);
        if (a.categoria === 'suelo') rect(m, hh.x, hh.z, hh.ancho, hh.fondo, '#d8c49a');
        else if (a.categoria === 'valla') rect(m, hh.x + 0.3, hh.z + 0.3, Math.max(0.4, hh.ancho - 0.6), Math.max(0.4, hh.fondo - 0.6), '#8a6040');
      }
      for (const b of s.edificios) {
        const a = ARTICULOS.find((a) => a.id === b.articulo);
        if (!a || a.categoria === 'suelo' || a.categoria === 'valla') continue;
        const hh = huella(b), casa = a.categoria === 'casa' || a.categoria === 'refugio';
        rect(m, hh.x, hh.z, hh.ancho, hh.fondo, casa ? '#8e4f45' : '#b98a5e');
        if (casa) rect(m, hh.x + 0.35, hh.z + 0.35, hh.ancho - 0.7, hh.fondo - 0.7, '#c46e5c');
      }
      for (const n of motor.nodosProduccion()) {
        if (n.zona !== zona) continue;
        const hh = huellaProduccion(n);
        rect(m, hh.x + 0.1, hh.z + 0.1, hh.ancho - 0.2, hh.fondo - 0.2, n.articulo.startsWith('aspersor_') ? '#7fc3df' : '#a9a197');
      }
    }
    // Vecinos del pueblo (el que buscas, más grande y con nombre)
    const npcs: { id: string; x: number; z: number; color: string; nombre: string }[] = [];
    if (zona === 'pueblo' && !s.interior && !s.servicio) {
      const resguardado = lluviaRiega(tiempoDia(s.tiempo, s.jornada.diasCompletados));
      for (const n of NPCS_PUEBLO) {
        const u = ubicacionAldeano(n.id, s.jornada.diasCompletados, s.jornada.minutos, resguardado);
        if (u?.visible) npcs.push({ id: n.id, x: u.x, z: u.z, color: n.color, nombre: n.nombre });
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const k = m.s;
    for (const n of npcs) {
      const q = aPantalla(m, n.x, n.z), es = n.id === buscado;
      ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(2.4, k * (es ? 0.95 : 0.55)) + 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = n.color; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(2.4, k * (es ? 0.95 : 0.55)), 0, Math.PI * 2); ctx.fill();
      if (es || conNombres) etiqueta(ctx, n.nombre, q.x, q.y - Math.max(5, k * 1.2), es ? 11 : 9, es);
    }
    if (conNombres && zona === 'pueblo') for (const e of EDIFICIOS_PUEBLO) { const q = aPantalla(m, e.x + e.ancho / 2, e.z + e.fondo / 2); etiqueta(ctx, e.nombre, q.x, q.y, 9, false); }
    // Salidas hacia otras zonas
    for (const sal of SALIDAS) if (sal.desde === zona && !s.interior) {
      const q = aPantalla(m, sal.x + 0.5, sal.z + 0.5);
      ctx.fillStyle = '#f6cf5a'; ctx.strokeStyle = '#3d2b27'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(q.x, q.y, conNombres ? 6 : 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (conNombres) etiqueta(ctx, DESTINOS[sal.hacia].nombre, q.x, q.y - 10, 9, false);
    }
    // Uno mismo: flecha hacia donde mira
    const yo = vista.avatar.position, q = aPantalla(m, yo.x, yo.z), rot = vista.avatar.direccionMontura;
    const dirX = Math.sin(rot), dirZ = Math.cos(rot), ang = Math.atan2(dirX * -fwd.z + dirZ * fwd.x, dirX * fwd.x + dirZ * fwd.z);
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(ang);
    ctx.fillStyle = s.personaje === 'ella' ? '#e4566b' : '#3f86c9'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2.5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    return npcs;
  }
  function dibujarAstra(m:Marco,nombres:boolean){
    const s=motor.estado,r=regionAstra(s.astra!.actual!)!,ctx=m.ctx;transformar(m);rect(m,-24,-28,48,56,r.color);rect(m,-22,11,44,3,'#e2cf9f');rect(m,-1.5,-20,3,46,'#e2cf9f');
    for(const h of r.viviendas)rect(m,h.x,h.z,h.ancho,h.fondo,'#b98a5e');
    ctx.setTransform(1,0,0,1,0,0);const npcs=[];
    for(const id of r.npc){const n=NPC_ASTRA.find(n=>n.id===id)!,p=posicionNpcAstra(s,id);if(!p||p.interior!==s.astra!.interior)continue;const q=aPantalla(m,p.x,p.z);ctx.fillStyle=id===buscado?'#fff':'#da7659';ctx.beginPath();ctx.arc(q.x,q.y,id===buscado?5:3,0,Math.PI*2);ctx.fill();if(nombres||id===buscado)etiqueta(ctx,n.nombre,q.x,q.y-8,9,id===buscado);npcs.push({id,x:p.x,z:p.z,color:'#da7659',nombre:n.nombre});}
    for(const ruta of rutasDesde(s)){if(!ruta.punto)continue;const p=aPantalla(m,ruta.punto.x,ruta.punto.z);ctx.fillStyle='#f6cf5a';ctx.fillRect(p.x-3,p.y-3,6,6);if(nombres)etiqueta(ctx,regionAstra(ruta.destino)?.nombre??'Granja',p.x,p.y-9,9,false);}
    RECURSOS_ASTRA.find(v=>v.id===r.id)?.recursos.forEach((d,i)=>{const p=puntoRecurso(r.id,i),q=aPantalla(m,p.x,p.z);ctx.fillStyle='#75645e';ctx.fillRect(q.x-3,q.y-3,6,6);if(nombres)etiqueta(ctx,d.nombre,q.x,q.y-8,8,false);});
    const p=aPantalla(m,vista.avatar.position.x,vista.avatar.position.z);ctx.fillStyle='#e4566b';ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill();return npcs;
  }
  /** Plano del piso de la expedición (galerías, vetas, monstruos, escalera y cofres), cacheado por mapa. */
  let planoClave = '', plano: HTMLCanvasElement | null = null, planoX = 0, planoZ = 0;
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const e of i.entradas) {
      const q = aPantalla(m, e.x, e.z);
      ctx.fillStyle = e.tipo === 'descenso' ? '#f6cf5a' : '#9fe0b8'; ctx.strokeStyle = '#3d2b27'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3d2b27'; ctx.font = '700 8px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e.tipo === 'descenso' ? '↓' : '↑', q.x, q.y + 0.5);
    }
    const yo = vista.avatar.position, q = aPantalla(m, yo.x, yo.z), rot = vista.avatar.direccionMontura;
    const dirX = Math.sin(rot), dirZ = Math.cos(rot), ang = Math.atan2(dirX * -fwd.z + dirZ * fwd.x, dirX * fwd.x + dirZ * fwd.z);
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(ang);
    ctx.fillStyle = motor.estado.personaje === 'ella' ? '#e4566b' : '#3f86c9'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2.5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function etiqueta(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, px: number, fuerte: boolean) {
    ctx.font = `${fuerte ? 700 : 600} ${px}px Nunito, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff8eecc'; ctx.strokeText(texto, x, y);
    ctx.fillStyle = '#3d2b27'; ctx.fillText(texto, x, y);
  }
  /** Flecha en el borde del minimapa hacia el vecino que se busca (o hacia la salida que lleva a él). */
  function guiaBuscado(m: Marco, npcs: { id: string; x: number; z: number }[]) {
    if (!buscado) return '';
    const n = NPCS_PUEBLO.find((n) => n.id === buscado);
    if(motor.estado.astra?.actual||!n){const nuevo=NPC_ASTRA.find(n=>n.id===buscado),p=nuevo&&posicionNpcAstra(motor.estado,nuevo.id);return nuevo?`${nuevo.nombre} · ${p?(p.interior?'En casa':'En este lugar'):regionAstra(nuevo.region)?.nombre}`:'';}
    const s = motor.estado;
    let meta: { x: number; z: number } | undefined, texto = '';
    const enPueblo = npcs.find((v) => v.id === buscado);
    if (s.zona === 'pueblo' && !s.interior && !s.servicio) {
      if (enPueblo) { meta = enPueblo; texto = n.nombre; }
      else texto = `${n.nombre} está bajo techo`;
    } else if (!s.interior && !s.servicio) {
      const ruta = rutaCaminando(s.zona, 'pueblo');
      if (ruta[0]) { meta = { x: ruta[0].x + 0.5, z: ruta[0].z + 0.5 }; texto = `${n.nombre} · ${ruta[0].nombre.toLowerCase()}`; }
    }
    if (meta) {
      const q = aPantalla(m, meta.x, meta.z), margen = 9;
      const fuera = q.x < margen || q.x > m.w - margen || q.y < margen || q.y > m.h - margen;
      if (fuera) {
        const ang = Math.atan2(q.y - m.cy, q.x - m.cx), ctx = m.ctx;
        const t = Math.min((m.w / 2 - margen) / Math.abs(Math.cos(ang) || 1e-6), (m.h / 2 - margen) / Math.abs(Math.sin(ang) || 1e-6));
        ctx.save(); ctx.translate(m.cx + Math.cos(ang) * t, m.cy + Math.sin(ang) * t); ctx.rotate(ang + Math.PI / 2);
        ctx.fillStyle = n.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
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
  function pintarMini() {
    const s = motor.estado;
    if (s.astra?.interior || s.interior || s.servicio || s.aventura.destinoActual) { $('minimapa').classList.add('apagado'); }
    else $('minimapa').classList.remove('apagado');
    const { ctx, w, h: alto, dpr } = prepararLienzo(mini);
    orientar();
    const p = vista.avatar.position;
    const m: Marco = { ctx, cx: w / 2, cy: alto / 2, s: 3.6 * dpr, px: p.x, pz: p.z, w, h: alto };
    const npcs = dibujarZona(m, false);
    const guia = guiaBuscado(m, npcs);
    const exp = instanciaAventura(s.aventura);
    $('minimapa-nombre').textContent = exp ? (exp.destinoId === MINA ? `Minas · piso ${exp.nivel}` : `${destinoAventura(exp.destinoId)?.nombre ?? ''} · ${exp.nivel}`) : s.astra?.actual?regionAstra(s.astra.actual)!.nombre:s.interior ? $('place-name').textContent ?? '' : DESTINOS[s.zona].nombre;
    $('minimapa-buscando').hidden = !guia;
    $('minimapa-buscando').textContent = guia ? '🔎 ' + guia : '';
  }
  function pintarGrande() {
    const s = motor.estado, { ctx, w, h: alto, dpr } = prepararLienzo(grande), [x0, x1, z0, z1] = s.astra?.actual?[-24,24,-28,28]:limites(s.zona);
    orientar();
    // Cabe la zona entera girada
    const rx = -fwd.z, rz = fwd.x, esquinas = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]];
    const us = esquinas.map(([x, z]) => x * rx + z * rz), vs = esquinas.map(([x, z]) => x * fwd.x + z * fwd.z);
    const ancho = Math.max(...us) - Math.min(...us), largo = Math.max(...vs) - Math.min(...vs);
    const esc = Math.min((w - 20 * dpr) / ancho, (alto - 20 * dpr) / largo);
    const m: Marco = { ctx, cx: w / 2, cy: alto / 2, s: esc, px: (x0 + x1) / 2, pz: (z0 + z1) / 2, w, h: alto };
    dibujarZona(m, true);
    $('mapa-grande-titulo').textContent = s.astra?.actual?regionAstra(s.astra.actual)!.nombre:DESTINOS[s.zona].nombre;
    // Dónde está el vecino que se busca
    const n = NPCS_PUEBLO.find((n) => n.id === buscado);
    let texto = 'Escoge a alguien y te lo señalo en el minimapa.';
    if (n) {
      const u = ubicacionAldeano(n.id, s.jornada.diasCompletados, s.jornada.minutos, lluviaRiega(tiempoDia(s.tiempo, s.jornada.diasCompletados)));
      const lugar = u?.lugar ? ` (${u.lugar})` : '';
      if (s.zona === 'pueblo') texto = u?.visible ? `${n.nombre} anda por el pueblo${lugar}. Sigue el punto grande.` : `${n.nombre} está bajo techo${lugar}.`;
      else { const r = rutaCaminando(s.zona, 'pueblo')[0]; texto = `${n.nombre} está en el ${DESTINOS.pueblo.nombre}${lugar}.` + (r ? ` Ve por el ${r.nombre.toLowerCase()}: la flecha del minimapa te guía.` : ''); }
    }
    const nuevo=NPC_ASTRA.find(n=>n.id===buscado);if(nuevo&&(s.astra?.actual||!n)){const p=posicionNpcAstra(s,nuevo.id);texto=`${nuevo.nombre}: ${regionAstra(nuevo.region)?.nombre}. ${p?(p.interior?'Está en casa; respeta el horario de visitas.':'Busca su punto en el mapa.'):'Consulta los accesos en la pestaña Astra.'}`;}
    $('mapa-donde').textContent = texto;
  }

  // ── Mapa grande ─────────────────────────────────────────────────────
  const sel = $('mapa-buscar') as HTMLSelectElement;
  sel.innerHTML = '<option value="">— Nadie —</option>' + [...NPC_ASTRA].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((n) => `<option value="${n.id}">${n.nombre}</option>`).join('');
  sel.value = buscado;
  sel.onchange = () => {
    buscado = sel.value;
    try { localStorage.setItem(CLAVE_BUSCADO, buscado); } catch { /* nada */ }
    pintarGrande(); pintarMini();
  };
  const abrirMapa = () => { h.cerrarPanel(); vista.avatar.detener(); h.controles.limpiar(); $('mapa-grande').hidden = false; document.body.classList.add('mapa-abierto'); requestAnimationFrame(pintarGrande); };
  const cerrarMapa = () => { $('mapa-grande').hidden = true; document.body.classList.remove('mapa-abierto'); };
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
  const tic = () => {
    if (document.hidden) return;
    try {
      reloj();
      if (!$('mapa-grande').hidden) pintarGrande();
      else if (!h.panelAbierto()) pintarMini();
    } catch (e) { console.warn('HUD', e); }
  };
  tic();
  setInterval(tic, 200);
}
