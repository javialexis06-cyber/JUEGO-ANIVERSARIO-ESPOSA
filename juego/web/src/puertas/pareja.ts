// Cien Puertas en pareja: los dos resuelven la misma puerta al tiempo, cada uno en su celular. Quien invita
// (anfitrión) aplica las reglas del acertijo y manda fotos del cuarto; el invitado ve lo mismo (lo que el otro
// arrastra o abre se mueve en su pantalla), y sus dedos y sensores llegan al anfitrión como si fueran propios. Los
// candados y las notas le salen a quien los tocó, las pistas y las monedas se comparten, se ve dónde toca el otro
// (una manito con su carita) y se pueden mandar señas rápidas. Si uno se va a segundo plano o se corta la conexión,
// todo se queda quieto con un aviso hasta que vuelva.
import * as THREE from 'three';
import { otro, type Rol } from '../casa/modelo';
import retratoEl from '../casa/retratos/el.png';
import retratoElla from '../casa/retratos/ella.png';
import * as sonido from '../sonido';
import * as fondo from '../segundo_plano';
import type { PlanoDesorden } from './desorden';
import type { DedoRed, Entrada } from './entrada';
import type { Escena } from './escena';
import { Espejo, type FotoCuarto } from './pareja_espejo';
import { CanalPuertas, Enlace, type FotoPanel, type InvPuertas, type Mov, type MovNuevo } from './pareja_red';
import type { Sensores } from './sensores';
import { ponerEco, sonar } from './sonido_eco';
import { $, aviso, esc, Paneles, type Inventario } from './ui';

export type Papel = 'anfitrion' | 'invitado';

export const nombreDe = (r: Rol) => (r === 'el' ? 'Él' : 'Ella');
export const retrato = (r: Rol) => (r === 'el' ? retratoEl : retratoElla);

/** Cómo le dice cada uno al otro (lo que sale en las señas que llegan). */
const APODOS: Record<Rol, string[]> = {
  // A Él, Ella le dice…
  el: ['panda', 'perro lanudo', 'liefje', 'mi amor'],
  // A Ella, Él le dice…
  ella: ['esposa', 'pulga aventurera', 'protagonista', 'mi amor'],
};

/** Las señas rápidas: lo que dice quien la manda (con el apodo de quien la recibe). */
export const SENAS: { k: string; boton: string; texto: (apodo: string, de: Rol) => string }[] = [
  { k: 'mira', boton: '¡Mira aquí!', texto: (a) => `¡Mira aquí, ${a}!` },
  { k: 'ya', boton: '¡Ya sé!', texto: (a) => `¡Ya sé, ${a}! Déjamelo a mí.` },
  { k: 'ayuda', boton: '¿Me ayudas?', texto: (a, de) => `¿Me ayudas, ${a}? Estoy ${de === 'ella' ? 'perdida' : 'perdido'}.` },
  { k: 'muak', boton: '¡Muak!', texto: (a) => `¡Muak! Ese beso es para ti, ${a}.` },
];

export interface Juego {
  escena: Escena;
  entrada: Entrada;
  sensores: Sensores;
  inv: Inventario;
  paneles: Paneles;
  /** Empieza una puerta (el invitado, con el reguero del anfitrión). */
  jugar(n: number, plano?: PlanoDesorden): void;
  /** La puerta que se está jugando (0 si ninguna). */
  puerta(): number;
  /** El anfitrión abrió la puerta n: el invitado la abre también. */
  resuelta(n: number): void;
  /** El narrador reacciona a lo que pasó en el otro celular. */
  cara(k: 'bien' | 'mal'): void;
  /** El otro compró una pista: el narrador se come el dulce y la dice. */
  pista(nivel: number): void;
  salirAlMapa(texto?: string): void;
  /** Raíces de lo que se mira en el cuarto (para saber dónde toca uno). */
  raices(): THREE.Object3D[];
}

const cam = (c: THREE.Camera) => {
  const pc = c as THREE.PerspectiveCamera;
  const p = c.getWorldPosition(new THREE.Vector3()), q = c.getWorldQuaternion(new THREE.Quaternion());
  return [p.x, p.y, p.z, q.x, q.y, q.z, q.w, pc.fov, pc.aspect].map((v) => Math.round(v * 10000) / 10000);
};

export class Pareja {
  enlace: Enlace;
  espejo: Espejo | null = null;
  /** Candados y notas que abre el otro: se arman aquí invisibles y se le muestran a él (anfitrión). */
  panelesOtro: Paneles | null = null;
  /** Puertas que mandó el anfitrión y todavía no se empiezan (el invitado sigue celebrando la anterior). */
  private cola: { n: number; plano: PlanoDesorden }[] = [];
  private libre = true;
  private quitar: (() => void)[] = [];
  private ultimoDedo = 0;
  private dedoAbajo = false;
  private dedoPunto: THREE.Vector3 | null = null;
  private ultimaInc = '';
  private ultimaIncT = 0;
  private luz = 1;
  private dedoOtro = { el: $('dedo-otro'), p: new THREE.Vector3(), meta: new THREE.Vector3(), visto: 0, abajo: false, hay: false };
  private rc = new THREE.Raycaster();
  /** Puertas que el anfitrión ya abrió (por si llega la noticia antes de que el invitado alcance a empezarla). */
  resueltas = new Set<number>();
  /** Pruebas: lo que se ha recibido. */
  cuenta = { fotos: 0, movs: 0 };
  terminada = false;

  constructor(
    public papel: Papel,
    public id: string,
    public yo: Rol,
    private canal: CanalPuertas,
    private j: Juego,
  ) {
    this.enlace = new Enlace(id, yo, (p) => canal.mandar(p), {
      alMov: (m) => this.alMov(m),
      alFoto: (f) => this.alFoto(f as FotoCuarto),
      alPanel: (f) => this.alPanel(f),
      alTextura: (i, url) => {
        const n = Math.floor(i / 1000);
        if (this.espejo && this.espejo.n === n) this.espejo.ponerTextura(i % 1000, url);
      },
      alDedo: (p) => this.alDedoOtro(p),
      alInclinacion: (i) => this.j.sensores.ponerInclinacionExterna(i),
      alEstado: () => this.pintarEstado(),
    });
    canal.enlace = this.enlace;
    const e = this.j.entrada;
    e.espejo = papel === 'invitado';
    // Los dedos propios: al anfitrión (si soy invitado) y a la manito del otro (los dos)
    e.alDedo = (tipo, id, x, y, t) => this.dedoPropio(tipo, id, x, y, t);
    if (papel === 'anfitrion') {
      // Los sonidos de los acertijos suenan también allá
      ponerEco((f, a) => this.enlace.mandar({ t: 'sonido', f, a }));
      // Los candados que abre el otro se arman aquí sin verse
      const capa = document.createElement('section');
      capa.className = 'panel';
      const carta = document.createElement('article');
      carta.className = 'panel-carta';
      capa.appendChild(carta);
      this.panelesOtro = new Paneles(capa, carta);
      this.panelesOtro.alFallar = () => this.enlace.mandar({ t: 'cara', k: 'mal' });
      let pendiente = false;
      this.panelesOtro.alCambiar = () => {
        if (pendiente) return;
        pendiente = true;
        queueMicrotask(() => {
          pendiente = false;
          const f = this.panelesOtro!.foto();
          this.enlace.ponerPanel(f.abierto ? f : null);
        });
      };
    } else {
      // Los sensores propios viajan al anfitrión (aquí no se aplican: allá están las reglas)
      for (const k of ['sacudida', 'volteo', 'pantalla', 'soplido'] as const)
        this.quitar.push(this.j.sensores.on(k, (v) => !this.j.entrada.bloqueada && this.enlace.mandar({ t: 'sensor', k, v })));
    }
    // Fotos, inclinación y manito, al ritmo de los paquetes
    const timer = window.setInterval(() => this.tick(), 125);
    this.quitar.push(() => clearInterval(timer));
    // Cada cuadro: el espejo suavecito y la manito del otro
    this.quitar.push(this.j.escena.cada((dt) => this.cuadro(dt)));
    // Segundo plano: al otro le sale la pausa (y al volver sigue donde iba)
    this.quitar.push(fondo.alPausar(() => this.enlace.ponerFuera(true)));
    this.quitar.push(fondo.alReanudar(() => this.enlace.ponerFuera(false)));
    if (fondo.enPausa()) this.enlace.ponerFuera(true);
    this.pintarChip();
    this.pintarEstado();
  }

  // --- Puertas repartidas: uno ve la pista y el otro tiene el candado ------------------
  /** Quién ve la pista en esta puerta (null si no es repartida). */
  vigia: Papel | null = null;
  private nubes: { o: THREE.Object3D; m: THREE.Mesh }[] = [];

  /** Reparte la puerta n: se turnan (en las impares la ve el invitado). Quien no la ve tiene una nubecita encima. */
  repartir(n: number, objs: THREE.Object3D[]) {
    this.sinReparto();
    if (!objs.length) return;
    this.vigia = n % 2 ? 'invitado' : 'anfitrion';
    const de = otro(this.yo);
    if (this.papel === this.vigia) {
      aviso(`Puerta en equipo: tú ves la pista y ${nombreDe(de)} tiene el candado. Cuéntale lo que ves (o mándale una notica).`, 6000);
      return;
    }
    aviso(`Puerta en equipo: tú tienes el candado y la pista la ve ${nombreDe(de)}. ¡Pídesela!`, 6000);
    const tex = nubeTextura(`Esto lo ve ${nombreDe(de)}`);
    for (const o of objs) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.62), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
      m.renderOrder = 7;
      m.name = 'nube de pareja';
      this.j.escena.escena.add(m);
      this.nubes.push({ o, m });
    }
  }

  sinReparto() {
    this.vigia = null;
    for (const n of this.nubes) {
      n.m.removeFromParent();
      n.m.geometry.dispose();
      (n.m.material as THREE.MeshBasicMaterial).map?.dispose();
      (n.m.material as THREE.Material).dispose();
    }
    this.nubes = [];
  }

  private moverNubes() {
    const cam = this.j.escena.camara;
    const caja = new THREE.Box3(), c = new THREE.Vector3(), t = new THREE.Vector3(), ojo = cam.getWorldPosition(new THREE.Vector3());
    for (const n of this.nubes) {
      caja.setFromObject(n.o);
      if (caja.isEmpty()) continue;
      caja.getCenter(c);
      caja.getSize(t);
      n.m.position.copy(c).addScaledVector(ojo.clone().sub(c).normalize(), 0.12);
      n.m.quaternion.copy(cam.quaternion);
      n.m.scale.set(Math.max(0.5, Math.max(t.x, t.z) * 1.35), Math.max(0.32, t.y * 1.6, Math.max(t.x, t.z) * 0.5), 1);
    }
  }

  // --- La puerta ---------------------------------------------------------------
  /** Lo que se sigue en el espejo de esta puerta (los dos celulares lo arman igual). */
  empezarPuerta(n: number, raices: THREE.Object3D[], plano?: PlanoDesorden) {
    this.espejo = new Espejo(n, raices);
    this.luz = 1;
    if (this.papel === 'anfitrion') this.enlace.mandar({ t: 'puerta', n, desorden: plano });
  }

  /** (anfitrión) La puerta se abrió. */
  resuelta(n: number) {
    if (this.papel === 'anfitrion') {
      // La última foto (completa) y luego la noticia
      this.fotoAhora(true);
      this.enlace.mandar({ t: 'res', n });
    }
  }

  /** (invitado) Terminó de celebrar: empieza la siguiente puerta si ya llegó. */
  listo() {
    this.libre = true;
    this.siguiente();
  }

  private siguiente() {
    if (!this.libre || !this.cola.length) return;
    const p = this.cola.shift()!;
    this.libre = false;
    this.espejo = null;
    this.j.jugar(p.n, p.plano);
  }

  // --- Lo que llega --------------------------------------------------------------
  private alMov(m: Mov) {
    this.cuenta.movs++;
    const j = this.j;
    switch (m.t) {
      case 'puerta':
        if (this.papel !== 'invitado') return;
        this.cola.push({ n: m.n, plano: m.desorden as PlanoDesorden });
        this.siguiente();
        break;
      case 'res':
        this.resueltas.add(m.n);
        if (this.papel === 'invitado' && j.puerta() === m.n) j.resuelta(m.n);
        break;
      case 'dedo':
        if (this.papel === 'anfitrion') j.entrada.remoto(m.d);
        break;
      case 'sensor':
        if (this.papel === 'anfitrion') j.sensores.externo(m.k, m.v);
        break;
      case 'pulsar':
        this.panelesOtro?.pulsar(m.i);
        break;
      case 'cerrarPanel':
        this.panelesOtro?.quitar();
        break;
      case 'enfocar':
        void this.enfocarAqui(new THREE.Vector3(m.p[0], m.p[1], m.p[2]), m.d);
        break;
      case 'volver':
        this.alVolver?.();
        break;
      case 'aviso':
        aviso(m.texto, m.ms);
        break;
      case 'cara':
        j.cara(m.k);
        break;
      case 'sonido':
        sonar(m.f, m.a);
        break;
      case 'pista':
        j.pista(m.nivel);
        break;
      case 'sena':
        this.senaLlega(m.k, m.p);
        break;
      case 'notica':
        this.noticaLlega(m.texto);
        break;
      case 'salir':
        this.terminar();
        j.salirAlMapa(`${nombreDe(otro(this.yo))} salió de Cien Puertas.`);
        break;
    }
  }

  /** El invitado mira de cerca lo que su dedo pidió (las reglas están en el otro celular). */
  alEnfocar: ((p: THREE.Vector3, d: number) => Promise<void>) | null = null;
  alVolver: (() => void) | null = null;
  private async enfocarAqui(p: THREE.Vector3, d: number) {
    await this.alEnfocar?.(p, d);
  }

  private alFoto(f: FotoCuarto) {
    this.cuenta.fotos++;
    if (this.papel !== 'invitado' || !this.espejo || f.n !== this.espejo.n) return;
    this.espejo.aplicar(f);
    if (f.luz !== undefined && f.luz !== this.luz) {
      this.luz = f.luz;
      this.j.escena.atenuar(f.luz);
    }
    if (f.inv) this.j.inv.mostrar(f.inv);
  }

  private alPanel(f: FotoPanel | null) {
    if (this.papel !== 'invitado') return;
    this.j.paneles.espejar(
      f,
      (i) => this.enlace.mandar({ t: 'pulsar', i }),
      () => this.enlace.mandar({ t: 'cerrarPanel' }),
    );
  }

  // --- Lo que sale -------------------------------------------------------------
  mandar(m: MovNuevo) {
    this.enlace.mandar(m);
  }

  private tick() {
    if (this.papel === 'anfitrion') this.fotoAhora(false);
    else {
      // La inclinación propia (si el celular la tiene), cuando cambia
      const i = this.j.sensores.inclinacionPropia();
      const k = i ? i.join(',') : '';
      if (k !== this.ultimaInc || (i && performance.now() - this.ultimaIncT > 400)) {
        this.ultimaInc = k;
        this.ultimaIncT = performance.now();
        this.enlace.ponerInclinacion(i);
      }
    }
  }

  private fotoAhora(completa: boolean) {
    if (!this.espejo || this.j.puerta() !== this.espejo.n) return;
    const f = this.espejo.capturar({ luz: this.j.escena.nivelLuz, inv: this.j.inv.items }, completa);
    if (f) this.enlace.ponerFoto(f);
    for (const [i, url] of this.espejo.texturasNuevas()) this.enlace.ponerTextura(this.espejo.n * 1000 + i, url);
  }

  /** Un dedo propio: al anfitrión (si soy invitado) y la manito que ve el otro. */
  private dedoPropio(tipo: DedoRed['tipo'], id: number, x: number, y: number, t: number) {
    const e = this.j.escena;
    if (this.papel === 'invitado') {
      const d: DedoRed = { tipo, id, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, t: Math.round(t), w: window.innerWidth, h: window.innerHeight, cam: cam(e.camara), item: this.j.entrada.item };
      // Los movimientos van como mucho cada 40 ms (los de bajar y subir siempre)
      if (tipo !== 'mueve' || t - this.ultimoDedo > 40) {
        this.ultimoDedo = t;
        this.enlace.mandar({ t: 'dedo', d });
      }
    }
    // La manito: dónde quedó el dedo en el cuarto
    this.dedoAbajo = tipo === 'abajo' || tipo === 'mueve';
    const ndc = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    this.rc.setFromCamera(ndc, e.camara);
    const hit = this.rc.intersectObjects(this.j.raices(), true).find((h) => (h.object as THREE.Mesh).isMesh && h.object.visible);
    const p = hit?.point ?? this.rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.05), new THREE.Vector3());
    if (p) this.dedoPunto = p.clone();
    if (p && (tipo !== 'mueve' || performance.now() - this.ultimoDedoRed > 90)) {
      this.ultimoDedoRed = performance.now();
      this.enlace.ponerDedo([Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100, Math.round(p.z * 100) / 100, this.dedoAbajo ? 1 : 0]);
    }
  }
  private ultimoDedoRed = 0;

  // --- La manito del otro ----------------------------------------------------------
  private alDedoOtro(p: [number, number, number, number] | null) {
    const d = this.dedoOtro;
    if (!p) return;
    d.meta.set(p[0], p[1], p[2]);
    if (!d.hay) d.p.copy(d.meta);
    d.hay = true;
    d.visto = performance.now();
    const abajo = p[3] === 1;
    if (abajo && !d.abajo) {
      d.el.classList.remove('toca');
      void d.el.offsetWidth;
      d.el.classList.add('toca');
    }
    d.abajo = abajo;
  }

  private cuadro(dt: number) {
    if (this.papel === 'invitado') this.espejo?.cuadro(dt, (o) => this.j.entrada.enLaMano(o));
    if (this.nubes.length) this.moverNubes();
    const d = this.dedoOtro;
    if (!d.hay) return;
    d.p.lerp(d.meta, 1 - Math.exp(-dt * 16));
    const quieto = performance.now() - d.visto;
    const s = this.j.escena.aPantalla(d.p);
    // (se queda un ratico después de soltar, y se desvanece suavecito)
    d.el.hidden = quieto > 3800 || s.detras;
    d.el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`;
    d.el.style.opacity = String(quieto > 2600 ? Math.max(0, 1 - (quieto - 2600) / 1200) : 1);
    d.el.classList.toggle('abajo', d.abajo);
  }

  // --- Señas ---------------------------------------------------------------------
  /** Manda una seña con el punto donde uno tocó por última vez. */
  sena(k: string) {
    const p = this.dedoPunto;
    this.enlace.mandar({ t: 'sena', k, p: p ? [p.x, p.y, p.z].map((v) => Math.round(v * 100) / 100) : null });
    const s = SENAS.find((x) => x.k === k);
    if (s) aviso(`Le dijiste a ${nombreDe(otro(this.yo))}: «${s.boton}»`, 1800);
    sonido.toque();
  }

  private senaLlega(k: string, p: number[] | null) {
    const s = SENAS.find((x) => x.k === k);
    if (!s) return;
    const de = otro(this.yo);
    const apodos = APODOS[this.yo];
    const texto = s.texto(apodos[Math.floor(Math.random() * apodos.length)], de);
    const globo = $('sena-globo');
    globo.innerHTML = `<i class="cara-pareja" style="background-image:url('${retrato(de)}')"></i><span>${esc(texto)}</span>`;
    globo.hidden = false;
    globo.classList.remove('sale');
    void globo.offsetWidth;
    globo.classList.add('sale');
    clearTimeout(this.timerSena);
    this.timerSena = window.setTimeout(() => (globo.hidden = true), 3400);
    sonido.aviso();
    if (k === 'muak') sonido.beso();
    // ¡Mira aquí!: un aro que late en ese punto del cuarto
    if (p && (k === 'mira' || k === 'muak')) {
      const aro = $('sena-aro');
      const pt = new THREE.Vector3(p[0], p[1], p[2]);
      aro.className = `sena-aro ${k}`;
      aro.hidden = false;
      const fin = performance.now() + 3200;
      const q = this.j.escena.cada(() => {
        const sp = this.j.escena.aPantalla(pt);
        aro.style.transform = `translate(${sp.x.toFixed(1)}px, ${sp.y.toFixed(1)}px)`;
        if (performance.now() > fin) {
          aro.hidden = true;
          q();
        }
      });
      this.quitar.push(q);
    }
  }
  private timerSena = 0;

  /** Manda una notica escrita (lo que uno ve y el otro necesita: un número, una palabra). */
  notica(texto: string) {
    const t = texto.trim().slice(0, 60);
    if (!t) return;
    this.enlace.mandar({ t: 'notica', texto: t });
    aviso(`Le mandaste una notica a ${nombreDe(otro(this.yo))}`, 1800);
    sonido.toque();
  }

  private noticaLlega(texto: string) {
    const de = otro(this.yo);
    const el = $('notica-otro');
    el.innerHTML = `<i class="cara-pareja" style="background-image:url('${retrato(de)}')"></i><small>${nombreDe(de)} te escribió:</small><p>${esc(texto)}</p>`;
    el.hidden = false;
    el.classList.remove('sale');
    void el.offsetWidth;
    el.classList.add('sale');
    el.onclick = () => (el.hidden = true);
    clearTimeout(this.timerNotica);
    this.timerNotica = window.setTimeout(() => (el.hidden = true), 15000);
    sonido.aviso();
  }
  private timerNotica = 0;

  // --- Estado: chip, pausa ---------------------------------------------------------
  private pintarChip() {
    const de = otro(this.yo);
    (this.dedoOtro.el.querySelector('.cara-pareja') as HTMLElement).style.backgroundImage = `url('${retrato(de)}')`;
    const chip = $('pareja-chip');
    chip.innerHTML = `<i class="cara-pareja" style="background-image:url('${retrato(de)}')"></i><span>En pareja con <b>${nombreDe(de)}</b></span>`;
    chip.hidden = false;
    $('btn-sena').hidden = false;
  }

  /** Pausa con aviso si el otro se fue a segundo plano o se cortó la conexión. */
  private pintarEstado() {
    const de = otro(this.yo);
    const corte = !this.enlace.conectado, fuera = this.enlace.otroFuera;
    const pausa = !this.terminada && (corte || fuera);
    this.j.escena.pausada = pausa;
    const el = $('pareja-pausa');
    el.hidden = !pausa;
    if (pausa) {
      $('pareja-pausa-texto').textContent = fuera
        ? `${nombreDe(de)} se fue un momentico (o cerró los ojos). Todo queda quieto hasta que vuelva.`
        : `Se cortó la conexión con ${nombreDe(de)}. Todo queda quieto mientras vuelve…`;
      $('pareja-pausa-cara').style.backgroundImage = `url('${retrato(de)}')`;
    }
    $('pareja-chip').classList.toggle('sin-conexion', pausa);
  }

  /** Sale de la pareja (avisándole al otro si se pide). */
  salir(avisar = true) {
    if (avisar && !this.terminada) {
      this.enlace.mandar({ t: 'salir' });
      // Que alcance a salir el paquete
      this.enlace.ponerFuera(false);
    }
    window.setTimeout(() => this.terminar(), avisar ? 600 : 0);
  }

  private terminar() {
    if (this.terminada) return;
    this.terminada = true;
    this.sinReparto();
    for (const q of this.quitar.splice(0)) q();
    this.enlace.cerrar();
    if (this.canal.enlace === this.enlace) this.canal.enlace = null;
    ponerEco(null);
    const e = this.j.entrada;
    e.espejo = false;
    e.alDedo = null;
    this.j.sensores.ponerInclinacionExterna(null);
    this.j.escena.pausada = false;
    this.panelesOtro?.quitar();
    this.j.paneles.espejar(null, () => {}, () => {});
    for (const id of ['pareja-chip', 'btn-sena', 'senas', 'pareja-pausa', 'dedo-otro', 'sena-globo', 'sena-aro', 'notica-otro', 'libretica']) $(id).hidden = true;
  }

  /** Huella del estado de la puerta (pruebas: los dos tienen que quedar iguales). */
  huella() {
    return { puerta: this.j.puerta(), inv: this.j.inv.items.join(','), ...(this.espejo?.huella() ?? {}) };
  }
}

/** Nubecita rosada que tapa la pista en el celular de quien no la ve. */
function nubeTextura(texto: string) {
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 320;
  const c = cv.getContext('2d')!;
  c.fillStyle = 'rgba(255,236,244,0.97)';
  c.strokeStyle = 'rgba(232,106,138,0.9)';
  c.lineWidth = 10;
  c.beginPath();
  for (const [x, y, r] of [[130, 190, 90], [230, 130, 110], [350, 150, 100], [420, 210, 75], [270, 220, 110], [90, 230, 60]] as const) {
    c.moveTo(x + r, y);
    c.arc(x, y, r, 0, Math.PI * 2);
  }
  c.stroke();
  c.fill();
  c.fillStyle = '#b8405f';
  c.font = "700 44px 'Fredoka', system-ui, sans-serif";
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(texto, 256, 180);
  c.font = "700 40px 'Fredoka', system-ui, sans-serif";
  c.fillText('♥', 256, 236);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export type { InvPuertas };
