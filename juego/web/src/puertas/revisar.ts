// Revisión automática (solo pruebas): qué tapa la puerta desde la vista de siempre. Se pintan en una rejilla de la
// pantalla las hojas de la puerta y, uno por uno, los objetos del cuarto, del acertijo, el desorden, el narrador en
// sus tres puestos (contando, en la esquina y celebrando) y la interfaz; se cuenta cuánto se cruzan.
import * as THREE from 'three';
import type { Desorden } from './desorden';
import type { Entrada } from './entrada';
import { esDe, listarImportantes, muestras, nombreDe as nombreImp, primeroDelante, unidad } from './protegidas';
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
  const esquina = narrador.esquina;
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

// ---------------------------------------------------------------------------
// Lo importante (lo que se toca, las pistas pintadas, los papelitos): ¿algo lo tapa?
// ---------------------------------------------------------------------------
export interface Tapado {
  /** Lo importante que queda tapado. */
  que: string;
  /** Lo que lo tapa. */
  por: string;
  /** Puntos tapados de los que se ven. */
  n: number;
  de: number;
  vista: string;
}

/** Rectángulos de la interfaz que siempre están durante una puerta (con el inventario lleno a tres cosas). */
function interfazFija() {
  const out: { que: string; x0: number; y0: number; x1: number; y1: number }[] = [];
  const medir = (el: HTMLElement | null, que: string) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width > 0) out.push({ que, x0: r.left, y0: r.top, x1: r.right, y1: r.bottom });
  };
  const hud = document.getElementById('hud');
  if (hud && !hud.hidden) for (const h of [...hud.children] as HTMLElement[]) if (!h.hidden) medir(h, `interfaz: ${h.id || h.className}`);
  const inv = document.getElementById('inventario')!;
  const antes = { html: inv.innerHTML, oculto: inv.hidden };
  // (con una cosa: la llave; más de una al tiempo es raro y el inventario crece hacia abajo, por el borde)
  inv.innerHTML = '<button class="ranura"></button>';
  inv.hidden = false;
  medir(inv, 'interfaz: inventario');
  inv.innerHTML = antes.html;
  inv.hidden = antes.oculto;
  return out;
}

/**
 * Revisa con rayos desde la cámara qué tapa lo importante. `cam` es la vista (la general o un acercamiento del
 * nivel). Lo que el acertijo esconde a propósito detrás de otra cosa que se toca (la llave entre los cojines) no
 * cuenta.
 */
export function revisarImportantes(o: {
  escena: Escena;
  cam: THREE.Camera;
  vista: string;
  puerta: Puerta;
  cuarto: THREE.Object3D;
  g: THREE.Object3D;
  desorden: Desorden | null;
  narrador: Narrador | null;
  entrada: Entrada;
  extra: THREE.Object3D[];
  /** Solo lo que está dentro de la vista (en los acercamientos). */
  soloEnVista?: boolean;
}): Tapado[] {
  const W = window.innerWidth, H = window.innerHeight;
  o.escena.escena.updateMatrixWorld(true);
  (o.cam as THREE.PerspectiveCamera).updateMatrixWorld();
  const lista = listarImportantes({ g: o.g, puerta: o.puerta, entrada: o.entrada, extra: o.extra });
  // Las piezas del acertijo que se tocan (esconder algo detrás de ellas es parte del juego)
  const tocables = new Set<THREE.Object3D>();
  for (const [obj] of o.entrada.registrados()) if (esDe(obj, o.g)) tocables.add(unidad(obj, o.g));
  const raices: THREE.Object3D[] = [o.cuarto, o.g];
  if (o.desorden) raices.push(o.desorden.grupo);
  // El narrador en su esquina (donde se queda mientras se juega)
  let volverNarrador = () => {};
  if (o.narrador) {
    const p = o.narrador.p;
    const antes = { pos: { ...p.pos }, rot: p.rot, visible: p.grupo.visible };
    p.grupo.visible = true;
    p.pos = { x: o.narrador.esquina, y: -0.75 };
    p.sincronizar();
    p.grupo.updateMatrixWorld(true);
    raices.push(p.grupo);
    volverNarrador = () => {
      p.pos = antes.pos;
      p.rot = antes.rot;
      p.sincronizar();
      p.grupo.visible = antes.visible;
    };
  }
  const interfaz = o.soloEnVista ? [] : interfazFija();
  const fuera: Tapado[] = [];
  const v = new THREE.Vector3();
  try {
    for (const imp of lista) {
      // Lo que está escondido debajo del piso (los topos en su hueco) todavía no se ve: no cuenta
      const caja = new THREE.Box3().setFromObject(imp.obj);
      if (!caja.isEmpty() && caja.max.y < 0.03) continue;
      const ps = muestras(imp.obj, 40);
      let vistos = 0;
      const por = new Map<string, number>();
      for (const p of ps) {
        v.copy(p).project(o.cam);
        if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) {
          if (!o.soloEnVista) por.set('fuera de la pantalla', (por.get('fuera de la pantalla') ?? 0) + 1);
          if (!o.soloEnVista) vistos++;
          continue;
        }
        const { cual, propio } = primeroDelante(o.cam, p, raices, imp.propios);
        if (propio) continue;
        vistos++;
        let quien = '';
        if (cual) {
          if (o.narrador && esDe(cual, o.narrador.p.grupo)) quien = 'narrador en la esquina';
          else if (o.desorden && esDe(cual, o.desorden.grupo)) quien = `desorden: ${nombreImp(unidad(cual, o.desorden.grupo))}`;
          else if (esDe(cual, o.puerta.grupo)) quien = 'la puerta';
          else if (esDe(cual, o.g)) {
            const u = unidad(cual, o.g);
            if (!tocables.has(u)) quien = `acertijo: ${nombreImp(u)}`;
          } else if (esDe(cual, o.cuarto)) {
            // (el piso, la arena o el mar que tapan lo que está enterrado o flotando lejos es parte del acertijo)
            const u = unidad(cual, o.cuarto);
            if (!/^(piso|arena|mar|agua|olas|pasto|suelo|nieve|cesped)/i.test(u.name) && !/^(piso|arena|mar|agua|olas)/i.test(cual.name)) quien = `cuarto: ${nombreImp(u)}`;
          }
        }
        if (!quien && interfaz.length) {
          const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
          const r = interfaz.find((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);
          if (r) quien = r.que;
        }
        if (quien) por.set(quien, (por.get(quien) ?? 0) + 1);
      }
      // (lo del mismo acertijo que tapa un poquito es parte de cómo se armó: un cojín metido en el sofá)
      for (const [quien, n] of por) {
        const tope = quien.startsWith('acertijo') ? 0.3 : quien === 'fuera de la pantalla' ? 0.34 : 0.12;
        if (n >= 2 && n / Math.max(1, vistos) >= tope) fuera.push({ que: imp.que, por: quien, n, de: vistos, vista: o.vista });
      }
    }
  } finally {
    volverNarrador();
  }
  return fuera;
}
