// Revisión automática (solo pruebas): qué tapa la puerta desde la vista de siempre. Se pintan en una rejilla de la
// pantalla las hojas de la puerta y, uno por uno, los objetos del cuarto, del acertijo, el desorden, el narrador en
// sus tres puestos (contando, en la esquina y celebrando) y la interfaz; se cuenta cuánto se cruzan.
import * as THREE from 'three';
import type { Desorden } from './desorden';
import { esquinaNarrador } from './desorden';
import { MIRA, OJO, type Escena } from './escena';
import type { Narrador } from './narrador';
import type { Puerta } from './puerta';
import { HUECO } from './puerta';
import { Mascara, pintar, rectDeCaja } from './revision';

export interface Tapa {
  que: string;
  celdas: number;
}

const nombre = (o: THREE.Object3D) => {
  const partes: string[] = [];
  let x: THREE.Object3D | null = o;
  while (x && partes.length < 3) {
    if (x.name) partes.unshift(x.name);
    x = x.parent;
    if (x?.name === 'cuarto' || x?.name?.startsWith('acertijo') || x?.name === 'desorden') break;
  }
  return partes.join(' › ') || o.type;
};

export function revisarPuerta(escena: Escena, puerta: Puerta, cuarto: THREE.Object3D, g: THREE.Object3D | null, desorden: Desorden | null, narrador: Narrador) {
  const W = window.innerWidth, H = window.innerHeight;
  const cam = escena.camara.clone();
  cam.position.copy(OJO);
  cam.lookAt(MIRA);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  escena.escena.updateMatrixWorld(true);
  const hojas = new Mascara(W, H);
  pintar(hojas, puerta.toque, cam);
  const rect = hojas.caja();
  const tapan: Tapa[] = [];
  const revisar = (o: THREE.Object3D, que: string, zMin = 0.1) => {
    const m = new Mascara(W, H);
    pintar(m, o, cam, { zMin });
    const n = m.cruce(hojas);
    if (n >= 3) tapan.push({ que, celdas: n });
  };
  // (lo que es parte del marco de la puerta y los efectos de pantalla completa, como cerrar los ojos, no cuentan)
  const vale = (o: THREE.Object3D) => !/^marco|^oscuridad/.test(o.name);
  for (const o of cuarto.children) if (o !== puerta.grupo && vale(o)) revisar(o, `cuarto: ${nombre(o)}`);
  if (g) for (const o of g.children) if (vale(o)) revisar(o, `acertijo: ${nombre(o)}`);
  if (desorden) for (const b of desorden.cuerpos) if (!b.roto) revisar(b.obj, `desorden: ${b.id}`);
  // El narrador en sus puestos
  const p = narrador.p;
  const antes = { pos: { ...p.pos }, rot: p.rot, visible: p.grupo.visible };
  p.grupo.visible = true;
  const esquina = esquinaNarrador(escena.camara);
  for (const [que, x, z] of [['narrador contando', -1.75, 1.5], ['narrador en la esquina', esquina, 0.75], ['narrador celebrando', -1.3, 1.05]] as [string, number, number][]) {
    p.pos = { x, y: -z };
    p.sincronizar();
    p.grupo.updateMatrixWorld(true);
    revisar(p.grupo, que, -1);
  }
  p.pos = antes.pos;
  p.rot = antes.rot;
  p.sincronizar();
  p.grupo.visible = antes.visible;
  // La interfaz (con textos largos de prueba donde hace falta)
  const interfaz: { que: string; r: DOMRect }[] = [];
  const medir = (el: HTMLElement | null, que: string) => {
    if (!el || el.hidden) return;
    const r = el.getBoundingClientRect();
    if (r.width > 0) interfaz.push({ que, r });
  };
  const hud = document.getElementById('hud');
  if (hud && !hud.hidden) for (const h of [...hud.children] as HTMLElement[]) medir(h, `interfaz: ${h.id || h.className}`);
  const inv = document.getElementById('inventario')!;
  const invAntes = { html: inv.innerHTML, oculto: inv.hidden };
  inv.innerHTML = '<button class="ranura"></button>'.repeat(3);
  inv.hidden = false;
  medir(inv, 'interfaz: inventario (3 cosas)');
  inv.innerHTML = invAntes.html;
  inv.hidden = invAntes.oculto;
  const avisoEl = document.getElementById('aviso')!;
  const avisoAntes = { t: avisoEl.textContent, oculto: avisoEl.hidden };
  avisoEl.textContent = 'Este celular no avisa cuando se gira: lleva la canica con el dedo.';
  avisoEl.hidden = false;
  medir(avisoEl, 'interfaz: aviso');
  avisoEl.textContent = avisoAntes.t;
  avisoEl.hidden = avisoAntes.oculto;
  // El globo se acomoda sin tapar la puerta (como lo hace el juego al cambiar el tamaño de la pantalla)
  {
    const caja = new THREE.Box3(new THREE.Vector3(-HUECO.w / 2 - 0.12, 0, 0), new THREE.Vector3(HUECO.w / 2 + 0.12, HUECO.h + 0.12, 0.05));
    narrador.globo.evitar = rectDeCaja(caja, cam, W, H);
  }
  const largo = 'Mi amor… anoche un nubarrón travieso, el Olvido, se metió por la ventana y se llevó todos nuestros recuerdos.';
  for (const [id, x, z] of [['globo', -1.75, 1.5], ['globo-chico', esquina, 0.75]] as [string, number, number][]) {
    const el = document.getElementById(id)!;
    const a = { oculto: el.hidden, capa: document.getElementById('dialogo')!.hidden };
    const texto = id === 'globo' ? document.getElementById('globo-texto')! : el;
    const t0 = texto.textContent;
    texto.textContent = largo;
    el.hidden = false;
    const cabeza = new THREE.Vector3(x, 2.45 * 0.68, z).project(cam);
    narrador.globo.ubicar((cabeza.x * 0.5 + 0.5) * W, (-cabeza.y * 0.5 + 0.5) * H);
    medir(el, `interfaz: ${id}`);
    texto.textContent = t0;
    el.hidden = a.oculto;
  }
  const yo = document.getElementById('globo-yo')!;
  const yoAntes = { oculto: yo.hidden, t: document.getElementById('globo-yo-texto')!.textContent };
  document.getElementById('globo-yo-texto')!.textContent = largo;
  yo.hidden = false;
  medir(yo, 'interfaz: globo-yo');
  document.getElementById('globo-yo-texto')!.textContent = yoAntes.t;
  yo.hidden = yoAntes.oculto;
  if (rect)
    for (const { que, r } of interfaz) {
      const ix = Math.min(r.right, rect.x1) - Math.max(r.left, rect.x0), iy = Math.min(r.bottom, rect.y1) - Math.max(r.top, rect.y0);
      if (ix > 2 && iy > 2) tapan.push({ que, celdas: Math.round((ix * iy) / 16) });
    }
  return { pantalla: `${W}x${H}`, puerta: rect, cosas: desorden?.cuerpos.length ?? 0, tapan };
}
