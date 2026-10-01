// El presentador del show: el perrito de la casa (perro.glb, con el pelaje que le escogieron en el patio), sentado en
// sus patas de atrás detrás de su atril, con corbatín y micrófono. Se anima por piezas como en el patio: habla
// (abre la boca al ritmo de la voz y mueve la cabeza), señala a los concursantes, salta de la emoción, se ríe,
// se sorprende, aplaude con las patas y menea la cola todo el tiempo.
import * as THREE from 'three';
import { cargar, copia } from '../../recursos';

export type AccionPerro = 'senalar' | 'saltar' | 'reir' | 'sorpresa' | 'aplaudir' | 'leer' | 'bailar';

const PELAJES: Record<string, [string, string]> = {
  caramelo: ['#E0A96D', '#B9784A'],
  chocolate: ['#8A5A3C', '#5E3A26'],
  negro: ['#3B3434', '#231F1F'],
  gris: ['#A8A9B4', '#6F7180'],
  manchas: ['#FBF3E8', '#C98A56'],
  dorado: ['#F2C46B', '#D39A3E'],
};

const CANALES = ['cuerpoRX', 'cuerpoY', 'cabezaRX', 'cabezaRY', 'cabezaRZ', 'orejas', 'pataDI', 'pataDD', 'pataTI', 'pataTD', 'saltoY', 'giroY'] as const;
type Canal = (typeof CANALES)[number];

interface Parte {
  obj: THREE.Object3D;
  pos: THREE.Vector3;
  rot: THREE.Euler;
}

export class Presentador {
  grupo = new THREE.Group();
  listo = false;
  private partes = new Map<string, Parte>();
  private val = Object.fromEntries(CANALES.map((c) => [c, 0])) as Record<Canal, number>;
  private meta = Object.fromEntries(CANALES.map((c) => [c, 0])) as Record<Canal, number>;
  private accion: { tipo: AccionPerro; t: number; dur: number } | null = null;
  private habla = false;
  private voz = 0;
  private tVoz = 0;
  private parpadeo = 2;
  private ultimaCara = '';
  private micro: THREE.Object3D | null = null;
  /** Hacia dónde mira cuando señala: a Él (-1) o a Ella (+1), en el espacio del perrito. */
  mirarA = 0;

  constructor(private escala = 1.3) {
    this.grupo.name = 'presentador';
  }

  async cargar(pelaje: string, corbatin: THREE.Object3D | null, micro: THREE.Object3D | null) {
    const m = copia(await cargar('perro.glb'));
    m.scale.setScalar(this.escala);
    this.grupo.add(m);
    m.traverse((o) => {
      if (/^p_/.test(o.name)) this.partes.set(o.name, { obj: o, pos: o.position.clone(), rot: o.rotation.clone() });
      const malla = o as THREE.Mesh;
      if (malla.isMesh && /Perro \| (pelaje|manchas)/.test((malla.material as THREE.Material).name)) malla.material = (malla.material as THREE.Material).clone();
    });
    const [c1, c2] = PELAJES[pelaje] ?? PELAJES.caramelo;
    m.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (mat?.name === 'Perro | pelaje') mat.color.set(c1);
      if (mat?.name === 'Perro | manchas') mat.color.set(c2);
    });
    // El corbatín va en el pecho, sobre el collar (se inclina con el cuerpo)
    const cuerpo = this.partes.get('p_cuerpo')?.obj;
    if (corbatin && cuerpo) {
      corbatin.position.set(0, 0.035, 0.255);
      corbatin.rotation.set(-0.5, 0, 0);
      corbatin.scale.setScalar(0.85);
      cuerpo.add(corbatin);
    }
    if (micro) {
      this.micro = micro;
      micro.scale.setScalar(this.escala * 0.95);
      this.grupo.add(micro);
    }
    this.listo = true;
    this.cara(false, false);
  }

  hablar(si: boolean) {
    this.habla = si;
  }

  hacer(tipo: AccionPerro, dur = 1.6) {
    this.accion = { tipo, t: 0, dur };
  }

  /** Punto de la cabeza en el mundo (para el globo y la cámara). */
  cabeza(): THREE.Vector3 {
    const c = this.partes.get('p_cabeza')?.obj;
    const v = new THREE.Vector3();
    if (c) c.getWorldPosition(v);
    else this.grupo.getWorldPosition(v).y += 0.8;
    return v;
  }

  private cara(feliz: boolean, boca: boolean, cerrados = false) {
    const clave = `${feliz}|${boca}|${cerrados}`;
    if (clave === this.ultimaCara) return;
    this.ultimaCara = clave;
    const ver = (n: string, si: boolean) => {
      const p = this.partes.get(n);
      if (p) p.obj.visible = si;
    };
    ver('p_ojos_abiertos', !feliz && !cerrados);
    ver('p_ojos_felices', feliz && !cerrados);
    ver('p_ojos_cerrados', cerrados);
    ver('p_boca_abierta', boca);
    ver('p_boca_cerrada', !boca);
  }

  update(dt: number, t: number) {
    if (!this.listo) return;
    const M = this.meta;
    // Sentado como presentador: el cuerpo parado, las patas de atrás dobladas y la pata derecha con el micrófono
    M.cuerpoRX = -1.12;
    M.cuerpoY = 0.035;
    M.pataTI = M.pataTD = -1.25;
    M.pataDD = -1.45;
    M.pataDI = -0.55 + Math.sin(t * 1.3) * 0.08;
    M.cabezaRX = 0.42 + Math.sin(t * 0.9) * 0.03;
    M.cabezaRY = this.mirarA * 0.45 + Math.sin(t * 0.55) * 0.12;
    M.cabezaRZ = Math.sin(t * 0.7) * 0.05;
    M.orejas = 0.15;
    M.saltoY = 0;
    M.giroY = this.mirarA * 0.25;
    let feliz = false;
    let boca = false;
    let colaVel = 9, colaAmp = 0.45;
    // La voz: sílabas al azar mientras habla
    if (this.habla) {
      this.tVoz -= dt;
      if (this.tVoz <= 0) {
        this.tVoz = 0.07 + Math.random() * 0.1;
        this.voz = Math.random() < 0.75 ? 0.4 + Math.random() * 0.6 : 0;
      }
    } else this.voz = Math.max(0, this.voz - dt * 6);
    if (this.voz > 0.15) {
      boca = true;
      M.cabezaRX += -0.12 * this.voz;
      M.orejas += 0.25 * this.voz;
      M.pataDI += -0.35 * this.voz;
    }
    const a = this.accion;
    if (a) {
      a.t += dt;
      const k = a.t;
      switch (a.tipo) {
        case 'senalar':
          M.pataDI = -1.9;
          M.cabezaRY += 0.3 * Math.sign(this.mirarA || 1);
          feliz = true;
          break;
        case 'saltar': {
          const u = (k % 0.55) / 0.55;
          M.saltoY = Math.sin(u * Math.PI) * 0.16;
          M.pataDI = -2.3;
          M.orejas = 0.8;
          feliz = true;
          boca = true;
          colaVel = 22;
          colaAmp = 0.8;
          break;
        }
        case 'reir':
          M.cuerpoRX += Math.sin(k * 16) * 0.06;
          M.cabezaRX += -0.25 + Math.sin(k * 16) * 0.08;
          M.pataDI = -1.2 + Math.sin(k * 16) * 0.2;
          feliz = true;
          boca = Math.sin(k * 16) > -0.2;
          break;
        case 'sorpresa':
          M.cabezaRX -= 0.3;
          M.orejas = 1.0;
          M.pataDI = -2.4;
          boca = true;
          M.saltoY = k < 0.25 ? Math.sin((k / 0.25) * Math.PI) * 0.08 : 0;
          break;
        case 'aplaudir':
          M.pataDI = -1.6 + Math.sin(k * 18) * 0.35;
          M.cabezaRX -= 0.1;
          feliz = true;
          colaVel = 18;
          colaAmp = 0.7;
          break;
        case 'leer':
          M.cabezaRX += 0.35;
          M.pataDI = -1.2;
          break;
        case 'bailar':
          M.giroY += Math.sin(k * 6) * 0.35;
          M.cuerpoRX += Math.sin(k * 12) * 0.05;
          M.saltoY = Math.abs(Math.sin(k * 6)) * 0.06;
          M.pataDI = -2.0 + Math.sin(k * 6) * 0.4;
          feliz = true;
          colaVel = 20;
          colaAmp = 0.8;
          break;
      }
      if (a.t >= a.dur) this.accion = null;
    }
    // Parpadeo
    this.parpadeo -= dt;
    const cerrados = this.parpadeo < 0.12 && !feliz;
    if (this.parpadeo < 0) this.parpadeo = 2.2 + Math.random() * 3;
    this.cara(feliz, boca, cerrados);
    const s = 1 - Math.exp(-dt * 10);
    for (const c of CANALES) this.val[c] += (M[c] - this.val[c]) * s;
    this.aplicar(t, colaVel, colaAmp);
  }

  private aplicar(t: number, colaVel: number, colaAmp: number) {
    const V = this.val;
    const girar = (n: string, rx = 0, ry = 0, rz = 0) => {
      const p = this.partes.get(n);
      if (p) p.obj.rotation.set(p.rot.x + rx, p.rot.y + ry, p.rot.z + rz);
    };
    const cuerpo = this.partes.get('p_cuerpo');
    if (cuerpo) {
      cuerpo.obj.position.set(cuerpo.pos.x, cuerpo.pos.y + V.cuerpoY / this.escala + V.saltoY / this.escala, cuerpo.pos.z - 0.06);
      cuerpo.obj.rotation.set(cuerpo.rot.x + V.cuerpoRX, cuerpo.rot.y, cuerpo.rot.z);
      cuerpo.obj.scale.setScalar(1 + Math.sin(t * 2.4) * 0.012);
    }
    this.grupo.children[0]?.rotation.set(0, V.giroY, 0);
    girar('p_cabeza', V.cabezaRX, V.cabezaRY, V.cabezaRZ);
    girar('p_cola', 0.6, 0, Math.sin(t * colaVel) * colaAmp);
    girar('p_oreja_izq', 0, 0, V.orejas + Math.sin(t * 3.1) * 0.04);
    girar('p_oreja_der', 0, 0, -V.orejas - Math.sin(t * 3.1) * 0.04);
    girar('p_pata_del_izq', V.pataDI);
    girar('p_pata_del_der', V.pataDD);
    girar('p_pata_tra_izq', V.pataTI);
    girar('p_pata_tra_der', V.pataTD);
    // El micrófono va en la punta de la pata derecha, parado hacia la boca
    const pata = this.partes.get('p_pata_del_der')?.obj;
    const cab = this.partes.get('p_cabeza')?.obj;
    if (this.micro && pata && cab) {
      this.grupo.updateMatrixWorld(true);
      const punta = pata.localToWorld(new THREE.Vector3(0, -0.15, 0.03));
      const boca = cab.localToWorld(new THREE.Vector3(0, -0.12, 0.3));
      const local = this.grupo.worldToLocal(punta.clone());
      this.micro.position.copy(local);
      const hacia = this.grupo.worldToLocal(boca.clone()).sub(local).normalize();
      this.micro.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), hacia);
    }
  }
}
