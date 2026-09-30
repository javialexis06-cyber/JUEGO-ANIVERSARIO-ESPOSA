// La sala de trofeos por dentro: seis pedestales contra la pared del fondo (los cuatro del modelo corridos y dos
// copiados para lavarse la cara y la cocina), una placa con el título de la pareja encima de cada uno, el cuadro de
// honor en la pared de la izquierda con el título de cada uno en cada juego, y en la vitrina los trofeos chiquitos
// que cada uno se ha ganado (arriba los de Ella, abajo los de Él). Las medidas son del piso de Blender (x, y) y la
// altura z → aTres.
import * as THREE from 'three';
import { aTres } from '../mundo';
import type { CasaDato } from './escena_casa';
import type { Rol } from './modelo';
import { TROFEOS, type IdTrofeo, type SalaTrofeos } from './trofeos';
import { nombre } from './ui_casa';

/** El centro de cada pedestal a lo largo de la pared del fondo. */
const X_PEDESTAL: Record<IdTrofeo, number> = { super: -2.3, puertas: -1.58, mesa: -0.86, retrete: -0.14, lavado: 0.58, cocina: 1.3 };
/** Dónde los dejó el modelo (los dos nuevos salen del del retrete). */
const X_MODELO: Partial<Record<IdTrofeo, number>> = { super: -2, puertas: -0.95, mesa: 0.1, retrete: 1.15 };
const APLIQUES: [string, IdTrofeo][] = [['aplique', 'super'], ['aplique001', 'puertas'], ['aplique002', 'mesa'], ['aplique003', 'retrete']];
const Y_PEDESTAL = 1.55;
/** Encima del cojín del pedestal. */
const ALTO_PEDESTAL = 1.085;
/** La cara de la pared del fondo y la de la izquierda. */
const PARED_FONDO = 2.1;
const PARED_IZQ = -2.7;
/** El cuadro de honor: a lo largo de la pared de la izquierda, entre la vitrina y el rincón. */
const CUADRO = { y: 0.45, z: 1.5, ancho: 1.36, alto: 1.06 };
/** Las repisas de la vitrina (arriba Ella, abajo Él) y los seis puestos de cada una. */
const VITRINA = { x: -2.42, piso: { ella: 1.45, el: 0.9 } as Record<Rol, number>, y0: -1.2, paso: 0.14, escala: 0.28 };
export const COLOR_METAL = ['#E6DDD2', '#C98A4B', '#C9CED8', '#F2C14E'];

/** Los puntos y marcas de la sala según los seis pedestales; los cuadros se pasan a la pared de la izquierda (en la
 *  del fondo van las placas). Se hace una vez al cargar casa.json. */
export function acomodarDato(dato: CasaDato) {
  const t = dato.cuartos.trofeos;
  if (!t) return;
  t.marcas = { ...t.marcas };
  for (const tr of TROFEOS) {
    const x = X_PEDESTAL[tr.id];
    t.marcas[tr.id] = { x, y: Y_PEDESTAL, z: ALTO_PEDESTAL };
    t.puntos[`ver_${tr.id}`] = { x, y: 0.88, rot: 180 };
  }
  for (const s of t.sitios) {
    if (s.id === 'trofeos_cuadro') Object.assign(s, { x: -2.67, y: 1.62, z: 1.95, rot: 90 });
    if (s.id === 'trofeos_cuadro2') Object.assign(s, { x: -2.67, y: -0.9, z: 2.45, rot: 90 });
  }
}

/** Corre los pedestales y los apliques del modelo y copia los que faltan (con su placa de color y su emblema). */
export function acomodarModelo(base: THREE.Object3D) {
  const raiz = base.getObjectByName('casa_trofeos') ?? base;
  const hijo = (n: string) => raiz.children.find((o) => o.name === n);
  const mover = (o: THREE.Object3D, desde: number, hasta: number) => (o.position.x += hasta - desde);
  const molde = hijo('pedestal_retrete');
  const aplique = hijo('aplique003');
  // Primero las copias (del modelo tal cual) y después se corre todo
  const nuevos: [THREE.Object3D, IdTrofeo][] = [];
  const luces: [THREE.Object3D, IdTrofeo][] = [];
  for (const t of TROFEOS) {
    if (X_MODELO[t.id] !== undefined || !molde || hijo(`pedestal_${t.id}`)) continue;
    const p = molde.clone();
    p.name = `pedestal_${t.id}`;
    vestirPedestal(p, t.id, t.color);
    nuevos.push([p, t.id]);
    if (aplique) {
      const a = aplique.clone();
      a.name = `aplique_${t.id}`;
      luces.push([a, t.id]);
    }
  }
  for (const t of TROFEOS) {
    const p = hijo(`pedestal_${t.id}`);
    const x0 = X_MODELO[t.id];
    if (p && x0 !== undefined) mover(p, x0, X_PEDESTAL[t.id]);
  }
  for (const [n, id] of APLIQUES) {
    const a = hijo(n);
    if (a) mover(a, X_MODELO[id]!, X_PEDESTAL[id]);
  }
  for (const [o, id] of [...nuevos, ...luces]) {
    mover(o, X_MODELO.retrete!, X_PEDESTAL[id]);
    raiz.add(o);
  }
}

/** La copia del pedestal del retrete: placa de su color y su emblema (burbujas o gorro de chef) en vez del cohete. */
function vestirPedestal(p: THREE.Object3D, id: IdTrofeo, color: string) {
  const quitar: THREE.Object3D[] = [];
  p.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    if (/^(emblema|fuego)/.test(m.name)) quitar.push(m);
    else if (/^placa/.test(m.name)) {
      const mat = (m.material as THREE.MeshStandardMaterial).clone();
      mat.color.set(color);
      m.material = mat;
    }
  });
  for (const o of quitar) o.removeFromParent();
  // Frente a la placa (el pedestal todavía está donde el del retrete)
  const e = id === 'lavado' ? burbujas() : gorroChef();
  e.position.copy(aTres(X_MODELO.retrete!, 1.335, 0.58));
  p.add(e);
}

function burbujas() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#EFFBFF', roughness: 0.15, metalness: 0.1, emissive: '#9FE3F0', emissiveIntensity: 0.25 });
  for (const [x, y, r] of [[-0.03, -0.025, 0.036], [0.035, 0.005, 0.028], [-0.005, 0.045, 0.02]]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat);
    b.position.set(x, y, 0.012);
    g.add(b);
  }
  return g;
}

function gorroChef() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.7 });
  const banda = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.035, 18), mat);
  banda.position.y = -0.035;
  g.add(banda);
  for (const [x, y, r] of [[-0.028, 0.0, 0.032], [0.028, 0.0, 0.032], [0, 0.022, 0.036]]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat);
    b.position.set(x, y, 0);
    g.add(b);
  }
  g.position.z = 0.01;
  return g;
}

/** Un cartel de cartón: caja delgadita con el dibujo al frente y marco de madera. */
function cartel(ancho: number, alto: number, px: number, py: number) {
  const lienzo = document.createElement('canvas');
  lienzo.width = px;
  lienzo.height = py;
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const marco = new THREE.MeshStandardMaterial({ color: '#8A5A3C', roughness: 0.6 });
  // Sin luz encima: que las letras se lean igual con cualquier lámpara
  const frente = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const m = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, 0.02), [marco, marco, marco, marco, frente, marco]);
  return { m, g: lienzo.getContext('2d')!, tex };
}

const FUENTE = "Fredoka, Nunito, 'Trebuchet MS', sans-serif";

function redondo(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

/** Tamaño de letra con el que `texto` cabe en `ancho` en un renglón (achicándola hasta `min`), o 0 si no cabe. */
function tamUnRenglon(g: CanvasRenderingContext2D, texto: string, ancho: number, tam: number, peso: number, min: number) {
  for (let t = tam; t >= tam * min; t--) {
    g.font = `${peso} ${t}px ${FUENTE}`;
    if (g.measureText(texto).width <= ancho) return t;
  }
  return 0;
}

/** Escribe en `x` (con la alineación que tenga), achicando la letra hasta que quepa en `ancho`; si ni así, en dos
 *  renglones un poco más chicos alrededor de `y`. Devuelve cuántos renglones usó. */
function escribir(g: CanvasRenderingContext2D, texto: string, x: number, y: number, ancho: number, tam: number, peso = 700, min = 0.62) {
  const t1 = tamUnRenglon(g, texto, ancho, tam, peso, min);
  if (t1 || !texto.includes(' ')) {
    if (!t1) g.font = `${peso} ${Math.round(tam * min)}px ${FUENTE}`;
    g.fillText(texto, x, y, ancho);
    return 1;
  }
  // Dos renglones, cortando en el espacio más cerca de la mitad
  const partes = texto.split(' ');
  let mejor = 1;
  for (let i = 1; i < partes.length; i++) {
    if (Math.abs(partes.slice(0, i).join(' ').length - texto.length / 2) < Math.abs(partes.slice(0, mejor).join(' ').length - texto.length / 2)) mejor = i;
  }
  const a = partes.slice(0, mejor).join(' ');
  const b = partes.slice(mejor).join(' ');
  let t = Math.round(tam * 0.82);
  const medir = (s: string) => {
    g.font = `${peso} ${t}px ${FUENTE}`;
    return g.measureText(s).width;
  };
  while (Math.max(medir(a), medir(b)) > ancho && t > tam * 0.5) t -= 1;
  g.fillText(a, x, y - t * 0.55, ancho);
  g.fillText(b, x, y + t * 0.55, ancho);
  return 2;
}

function medalla(g: CanvasRenderingContext2D, x: number, y: number, r: number, nivel: number) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = COLOR_METAL[nivel] ?? COLOR_METAL[0];
  g.fill();
  g.lineWidth = Math.max(2, r * 0.18);
  g.strokeStyle = nivel ? 'rgba(90, 53, 34, 0.35)' : 'rgba(90, 53, 34, 0.15)';
  g.stroke();
  if (nivel) {
    // Brillito
    g.beginPath();
    g.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255, 255, 255, 0.55)';
    g.fill();
  }
}

/** Placas, cuadro de honor y vitrina: se redibujan solo cuando algo cambia. */
export class AdornosSala {
  private placas = new Map<IdTrofeo, ReturnType<typeof cartel>>();
  private honor: ReturnType<typeof cartel>;
  private minis = new Map<string, { nivel: number; obj: THREE.Object3D }>();
  private clave = '';

  constructor(private grupo: THREE.Object3D) {
    for (const t of TROFEOS) {
      const p = cartel(0.62, 0.39, 320, 200);
      p.m.position.copy(aTres(X_PEDESTAL[t.id], PARED_FONDO - 0.012, 1.8));
      p.m.name = `placa_titulo_${t.id}`;
      grupo.add(p.m);
      this.placas.set(t.id, p);
    }
    this.honor = cartel(CUADRO.ancho, CUADRO.alto, 1024, 800);
    this.honor.m.position.copy(aTres(PARED_IZQ + 0.012, CUADRO.y, CUADRO.z));
    this.honor.m.rotation.y = Math.PI / 2;
    this.honor.m.name = 'cuadro_honor';
    grupo.add(this.honor.m);
    // Los letreritos de la vitrina: de quién es cada repisa
    for (const r of ['ella', 'el'] as Rol[]) {
      const l = cartel(0.13, 0.065, 128, 64);
      l.m.position.copy(aTres(VITRINA.x + 0.1, VITRINA.y0 - 0.12, VITRINA.piso[r] + 0.04));
      l.m.rotation.set(0, Math.PI / 2, 0);
      l.m.rotateX(-0.25);
      l.g.fillStyle = r === 'ella' ? '#F7C6D3' : '#BFD9F2';
      l.g.fillRect(0, 0, 128, 64);
      l.g.fillStyle = '#5A3522';
      l.g.textAlign = 'center';
      l.g.textBaseline = 'middle';
      escribir(l.g, nombre(r), 64, 34, 116, 40);
      l.tex.needsUpdate = true;
      l.m.name = `vitrina_letrero_${r}`;
      grupo.add(l.m);
    }
  }

  /** `trofeo` hace una copia del trofeo ya teñida del metal. */
  actualizar(sala: SalaTrofeos, trofeo: (nivel: number) => THREE.Object3D) {
    const clave = JSON.stringify(sala);
    if (clave === this.clave) return false;
    this.clave = clave;
    for (const j of sala.juegos) {
      const p = this.placas.get(j.id);
      if (p) this.dibujarPlaca(p, j, sala.niveles[j.id]);
    }
    this.dibujarHonor(sala);
    // Los trofeos chiquitos de cada uno (solo los ganados; cada juego tiene su puesto)
    sala.juegos.forEach((j, i) => {
      for (const r of ['ella', 'el'] as Rol[]) {
        const k = `${r}-${j.id}`;
        const nv = j.de[r].nivel;
        const ya = this.minis.get(k);
        if (ya?.nivel === nv) continue;
        ya?.obj.removeFromParent();
        this.minis.delete(k);
        if (!nv) continue;
        const t = trofeo(nv);
        t.scale.setScalar(VITRINA.escala);
        t.position.copy(aTres(VITRINA.x, VITRINA.y0 + i * VITRINA.paso, VITRINA.piso[r] + 0.225 * VITRINA.escala));
        t.rotation.y = Math.PI / 2 + (i % 2 ? 0.3 : -0.3);
        t.name = `vitrina_trofeo_${k}`;
        this.grupo.add(t);
        this.minis.set(k, { nivel: nv, obj: t });
      }
    });
    return true;
  }

  private dibujarPlaca(p: ReturnType<typeof cartel>, j: SalaTrofeos['juegos'][number], nivel: number) {
    const { g, tex } = p;
    const W = 320, H = 200;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#8A5A3C';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#FFF1D6';
    g.fillRect(9, 9, W - 18, H - 18);
    // Cinta del color del juego con su nombre
    g.fillStyle = j.color;
    g.fillRect(9, 9, W - 18, 48);
    g.fillStyle = '#FFFFFF';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    escribir(g, j.nombre.toUpperCase(), W / 2, 34, W - 40, 28, 800);
    g.fillStyle = '#4A2A18';
    escribir(g, j.titulo, W / 2, 106, W - 40, 38, 800, 0.7);
    for (let i = 1; i <= 3; i++) medalla(g, W / 2 + (i - 2) * 48, 160, 17, i <= nivel ? i : 0);
    tex.needsUpdate = true;
  }

  private dibujarHonor(sala: SalaTrofeos) {
    const { g, tex } = this.honor;
    const W = 1024, H = 800;
    g.clearRect(0, 0, W, H);
    // Marco de madera con filete dorado y papel adentro
    g.fillStyle = '#7A4A2E';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#E4B866';
    g.fillRect(16, 16, W - 32, H - 32);
    g.fillStyle = '#FFF1D6';
    g.fillRect(24, 24, W - 48, H - 48);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#7A3B2E';
    escribir(g, 'Cuadro de honor', W / 2, 78, 760, 70, 800);
    g.fillStyle = '#D9434F';
    escribir(g, `♥ ${sala.tituloAmor} ♥`, W / 2, 136, 760, 38, 800);
    // Columnas: el juego, Ella y Él
    const cols: [Rol, number][] = [['ella', 540], ['el', 815]];
    g.fillStyle = '#8A5A3C';
    g.font = `800 28px ${FUENTE}`;
    g.fillText('JUEGO', 185, 186);
    for (const [r, x] of cols) g.fillText(nombre(r).toUpperCase(), x, 186);
    const y0 = 208, alto = (H - 34 - y0) / sala.juegos.length;
    sala.juegos.forEach((j, i) => {
      const y = y0 + i * alto;
      g.fillStyle = i % 2 ? '#FFFAF0' : '#FBE6BF';
      redondo(g, 38, y + 4, W - 76, alto - 8, 18);
      g.fill();
      const cy = y + alto / 2;
      // El juego con su color
      g.fillStyle = j.color;
      redondo(g, 50, cy - 26, 16, 52, 8);
      g.fill();
      g.fillStyle = '#4A2A18';
      g.textAlign = 'left';
      escribir(g, j.nombre, 80, cy, 300, 36, 800);
      g.textAlign = 'center';
      for (const [r, x] of cols) {
        const d = j.de[r];
        medalla(g, x - 112, cy, 22, d.nivel);
        g.fillStyle = d.valor ? '#4A2A18' : '#A8927E';
        // Si el título no cabe en un renglón, sube un poquito para dejarle sitio al puntaje
        const uno = tamUnRenglon(g, d.titulo, 210, 32, 800, 0.6) > 0;
        escribir(g, d.titulo, x + 24, uno ? cy - 13 : cy - 17, 210, 32, 800, 0.6);
        g.fillStyle = '#8A6A52';
        g.font = `700 ${uno ? 22 : 19}px ${FUENTE}`;
        g.fillText(d.valor ? d.cuenta : '—', x + 24, uno ? cy + 25 : cy + 29, 210);
      }
    });
    tex.needsUpdate = true;
  }
}
