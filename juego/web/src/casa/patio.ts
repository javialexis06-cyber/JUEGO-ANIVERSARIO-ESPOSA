// El patio y su perrito, al estilo de Pou y Talking Tom: se adopta (nombre, color, perrito o perrita), tiene sus
// necesidades (comida, energía, limpieza y alegría) que bajan con el reloj real, y en el «modo mascota» la cámara se
// le acerca: se le da cuido o un huesito, se baña en la tina y se sacude, se le tira la pelota y la trae, duerme en
// su casita, hace trucos según su nivel y reacciona a caricias, cosquillas, jalones de cola y un toquecito en la
// nariz. «Háblale» graba lo que le digan y lo repite con vocecita. Los popós en la grama se recogen con un toque.
import './patio.css';
import * as THREE from 'three';
import { aTres, Mundo } from '../mundo';
import * as sonido from '../sonido';
import type { Casa3D } from './escena_casa';
import { Grabadora } from './llamada';
import {
  AccionPerro, Casa, NECESIDADES_PERRO, NecesidadPerro, nivelPerro, perroAlDia, Perrito, perritoNuevo, Rol,
} from './modelo';
import { Accion, PELAJES, Perro3D } from './perro';
import { $, abrirHoja, Capa, cerrarHoja, lluviaCorazones, SVG, toast } from './ui_casa';

type P = { x: number; y: number };

export interface DepsPatio {
  mundo: Mundo;
  casa3d: Casa3D;
  capa: Capa;
  casa: () => Casa | null;
  yo: () => Rol;
  cambiarCasa: (fn: (c: Casa) => void) => Promise<boolean>;
  /** Esconde o muestra a Él y a Ella (en el modo mascota solo se ve el perrito). */
  personajes: (visibles: boolean) => void;
  /** Se entró o se salió del modo mascota (para repintar los botones de la casa). */
  alCambiarModo: () => void;
}

const TRUCOS: { id: Accion; nombre: string; nivel: number; dur: number }[] = [
  { id: 'sentado', nombre: 'Sentado', nivel: 1, dur: 2.5 },
  { id: 'pata', nombre: 'Dar la pata', nivel: 2, dur: 2.6 },
  { id: 'rodar', nombre: 'Rodar', nivel: 3, dur: 1.2 },
  { id: 'muerto', nombre: 'Hacerse el muerto', nivel: 4, dur: 3.2 },
  { id: 'saltar', nombre: 'Saltar', nivel: 5, dur: 0.75 },
  { id: 'pedir', nombre: 'Pedir', nivel: 6, dur: 2.8 },
];
export const NOMBRES_PERRO = ['Canela', 'Toby', 'Maní', 'Luna', 'Coco', 'Lucas'];
const PRECIO_HUESITO = 2;
/** Qué tan cerca se ve el perrito en el modo mascota (la casa normal va de 1 a 3). */
const ZOOM = 4.4;
/** Hacia dónde mira para quedar de frente a la cámara (la vista está girada 38°). */
const DE_FRENTE = 38;
const ICONO: Record<NecesidadPerro, string> = { hambre: SVG.hambre, energia: SVG.energia, higiene: SVG.higiene, alegria: SVG.carino };
const NOMBRE_NEC: Record<NecesidadPerro, string> = { hambre: 'Comida', energia: 'Energía', higiene: 'Limpieza', alegria: 'Alegría' };

// Sonidos del perrito (sintetizados)
function ladrido(tono = 1, cuando = 0) {
  sonido.rumor(0.09, 900 * tono, 0.07, cuando, 1.4, 450 * tono);
  sonido.nota(560 * tono, 0.12, cuando, 'sawtooth', 0.045, 280 * tono);
  sonido.nota(1100 * tono, 0.09, cuando, 'square', 0.012, 560 * tono);
}
const guau = (n = 2, tono = 1) => {
  for (let i = 0; i < n; i++) ladrido(tono, i * 0.22);
};
const gruñido = () => sonido.nota(130, 0.6, 0, 'sawtooth', 0.04, 90);
const achis = () => {
  sonido.rumor(0.12, 3000, 0.05, 0, 0.8);
  sonido.rumor(0.25, 2200, 0.09, 0.14, 0.7, 900);
};
const risita = () => [0, 0.12, 0.24, 0.36].forEach((c, i) => ladrido(1.5 + i * 0.05, c));
const chapoteo = () => {
  for (let i = 0; i < 5; i++) sonido.rumor(0.15, 700 + Math.random() * 500, 0.05, i * 0.18, 1.2, 300);
};

export class Patio {
  perro: Perro3D | null = null;
  activo = false;
  private cargando: Promise<void> | null = null;
  private hud: HTMLElement;
  private menu: HTMLElement;
  private popos = new Map<string, THREE.Object3D>();
  private pelota: THREE.Mesh;
  private vuelo: { a: THREE.Vector3; b: THREE.Vector3; t: number; dur: number; fin: () => void } | null = null;
  /** Una secuencia de cuidados en curso (comer, bañarse, traer la pelota…): el perrito no se distrae. */
  private ocupado = false;
  private vistoAccion = -1;
  private pendiente: Partial<Record<NecesidadPerro | 'xp', number>> = {};
  private tGuardar = 0;
  private paseo = 5;
  private foco = new THREE.Vector3();
  private tHud = 0;
  private grabadora: Grabadora | null = null;
  private audio: AudioContext | null = null;
  private ultimaCaricia = 0;
  private hembra = false;

  constructor(private d: DepsPatio) {
    this.hud = document.createElement('section');
    this.hud.className = 'perro-hud';
    this.hud.hidden = true;
    this.hud.innerHTML = `
      <header class="perro-cabeza"><b class="perro-nombre"></b><small class="perro-nivel"></small>
        <button class="perro-salir" aria-label="Volver a la casa">✕</button></header>
      <div class="perro-barras">${NECESIDADES_PERRO.map(
        (n) => `<div class="perro-barra" data-n="${n}" title="${NOMBRE_NEC[n]}"><span class="ico">${ICONO[n]}</span><i><b></b></i></div>`,
      ).join('')}</div>
      <nav class="perro-botones">
        <button data-perro="comer"><span>🦴</span>Comida</button>
        <button data-perro="banar"><span>🛁</span>Bañar</button>
        <button data-perro="pelota"><span>🎾</span>Pelota</button>
        <button data-perro="dormir"><span>🌙</span><em>Dormir</em></button>
        <button data-perro="trucos"><span>⭐</span>Trucos</button>
        <button data-perro="hablar" class="perro-hablar"><span>🎤</span>Háblale</button>
      </nav>
      <div class="perro-menu" hidden></div>
      <p class="perro-ayuda">Tócale la cabeza, la barriga, la cola o la nariz</p>`;
    document.body.append(this.hud);
    this.menu = this.hud.querySelector('.perro-menu')!;
    this.hud.querySelector('.perro-salir')!.addEventListener('click', () => this.salir());
    this.hud.querySelector('.perro-botones')!.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest('[data-perro]') as HTMLElement | null;
      if (b && b.dataset.perro !== 'hablar') this.boton(b.dataset.perro!);
    });
    // Háblale: se mantiene apretado mientras se habla
    const hablar = this.hud.querySelector('[data-perro="hablar"]') as HTMLElement;
    hablar.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      void this.empezarAEscuchar();
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) hablar.addEventListener(ev, () => void this.terminarDeEscuchar());
    this.menu.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest('[data-opcion]') as HTMLElement | null;
      if (!b || b.getAttribute('aria-disabled') === 'true') return;
      this.menu.hidden = true;
      const [tipo, cual] = b.dataset.opcion!.split(':');
      if (tipo === 'comer') void this.comer(cual === 'huesito');
      if (tipo === 'truco') void this.truco(cual as Accion);
    });
    // La hoja de adopción (nombre, color, perrito o perrita)
    $('hoja').addEventListener('click', (ev) => {
      const t = ev.target as HTMLElement;
      const pel = t.closest('[data-pelaje]') as HTMLElement | null;
      if (pel) for (const x of Array.from(document.querySelectorAll('[data-pelaje]'))) x.setAttribute('aria-pressed', String(x === pel));
      const sug = t.closest('[data-nombre-perro]') as HTMLElement | null;
      if (sug) ($('perro-nombre') as HTMLInputElement).value = sug.dataset.nombrePerro!;
    });
    $('hoja').addEventListener('submit', (ev) => {
      const f = ev.target as HTMLFormElement;
      if (f.id !== 'form-perro') return;
      ev.preventDefault();
      const nombre = ($('perro-nombre') as HTMLInputElement).value.trim() || 'Canela';
      const pelaje = (document.querySelector('[data-pelaje][aria-pressed="true"]') as HTMLElement | null)?.dataset.pelaje ?? 'caramelo';
      const hembra = (f.querySelector('input[name="perro-sexo"]:checked') as HTMLInputElement | null)?.value === 'hembra';
      void this.adoptar(nombre, pelaje, hembra);
    });
    // La pelota (roja con una franja blanca)
    this.pelota = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), new THREE.MeshStandardMaterial({ color: '#E4574B', roughness: 0.35 }));
    const franja = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 28), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 }));
    this.pelota.add(franja);
    this.pelota.castShadow = true;
    this.pelota.name = 'pelota';
  }

  /** El perrito con los valores de ahora. */
  get datos(): Perrito | null {
    const p = this.d.casa()?.perro;
    return p ? perroAlDia(p) : null;
  }

  private get lo() {
    return this.hembra ? 'la' : 'lo';
  }

  // -------------------------------------------------------------------------
  // Estado compartido → lo que se ve
  // -------------------------------------------------------------------------
  /** Llega un cambio de la casa (propio o del otro celular). */
  sincronizar() {
    const p = this.datos;
    if (!p) return;
    this.hembra = p.hembra;
    // El patio (y el perrito) se cargan cuando alguien lo mira: no antes
    if (!this.cargando && this.d.casa3d.actual !== 'patio') return;
    void this.asegurar().then(() => {
      const q = this.datos;
      if (!q || !this.perro) return;
      this.perro.pintar(q.pelaje);
      this.d.casa3d.letrero('patio', 'letrero_casita', q.nombre);
      this.pintarPopos(q.popos);
      // Lo que le hizo el otro: también se ve aquí (si pasó hace poco y el patio está a la vista)
      const a = q.accion;
      if (a && a.desde > this.vistoAccion) {
        const primera = this.vistoAccion < 0;
        this.vistoAccion = a.desde;
        if (!primera && a.de !== this.d.yo() && Date.now() - a.desde < 30000 && this.d.casa3d.actual === 'patio' && !this.ocupado) this.repetirAccion(a.tipo);
      } else if (this.vistoAccion < 0) this.vistoAccion = 0;
      this.pintarHud();
    });
  }

  /** Carga el patio y el perrito (una sola vez). */
  asegurar(): Promise<void> {
    this.cargando ??= (async () => {
      await this.d.casa3d.asegurar('patio');
      const p = this.datos;
      const perro = new Perro3D(this.d.casa3d);
      await perro.cargar(p?.pelaje ?? 'caramelo');
      this.d.casa3d.cuarto('patio').add(perro.grupo);
      const c = this.d.casa3d.puntos('patio');
      if (p?.dormido) this.acostar(perro);
      else perro.poner(c.perro_juego, DE_FRENTE);
      this.perro = perro;
      this.pelota.position.copy(aTres(c.perro_juego.x + 0.45, c.perro_juego.y - 0.2, 0.075));
      this.d.casa3d.cuarto('patio').add(this.pelota);
      this.verObjeto('cuido', false);
      this.verObjeto('espuma_tina', false);
    })().catch((e) => {
      this.cargando = null;
      throw e;
    });
    return this.cargando;
  }

  private verObjeto(nombre: string, si: boolean) {
    const o = this.d.casa3d.objeto('patio', nombre);
    if (o) o.visible = si;
  }

  private acostar(perro = this.perro) {
    if (!perro) return;
    const c = this.d.casa3d.puntos('patio');
    perro.poner(c.perro_dormir, 0);
    perro.hacer('dormir', Infinity);
  }

  private pintarPopos(lista: [number, number][]) {
    const claves = new Set(lista.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`));
    for (const [k, o] of this.popos) {
      if (!claves.has(k)) {
        o.removeFromParent();
        this.popos.delete(k);
      }
    }
    for (const [x, y] of lista) {
      const k = `${x.toFixed(2)},${y.toFixed(2)}`;
      if (this.popos.has(k)) continue;
      const o = popo();
      o.position.copy(aTres(x, y, 0));
      o.userData.popo = [x, y];
      this.d.casa3d.cuarto('patio').add(o);
      this.popos.set(k, o);
    }
  }

  /** El otro celular le dio de comer, lo bañó o lo mandó a dormir: aquí también se ve. */
  private repetirAccion(tipo: AccionPerro) {
    if (tipo === 'comer' || tipo === 'premio') void this.secuenciaComer();
    else if (tipo === 'banar') void this.secuenciaBano();
  }

  // -------------------------------------------------------------------------
  // Cada cuadro
  // -------------------------------------------------------------------------
  update(dt: number, t: number) {
    const perro = this.perro;
    if (!perro) return;
    const p = this.datos;
    if (!p) {
      perro.grupo.visible = false;
      return;
    }
    perro.grupo.visible = true;
    const min = Math.min(p.hambre, p.energia, p.higiene, p.alegria);
    perro.animo = min < 25 ? 0 : (p.alegria + p.hambre) / 2 > 70 ? 2 : 1;
    perro.update(dt, t);
    this.volarPelota(dt);
    // Dormido (o se despertó) según el estado compartido
    if (!this.ocupado) {
      if (p.dormido && perro.haciendo !== 'dormir' && !perro.caminando) this.irADormir(false);
      else if (!p.dormido && perro.haciendo === 'dormir') this.salirDeLaCasita();
    }
    // Pasea solo por el patio cuando nadie lo está atendiendo
    if (!this.ocupado && !p.dormido && !perro.caminando && !perro.haciendo) {
      this.paseo -= dt;
      if (this.paseo <= 0) {
        this.paseo = this.activo ? 9 + Math.random() * 6 : 5 + Math.random() * 7;
        const destino = this.activo ? this.d.casa3d.puntos('patio').perro_juego : this.puntoLibre();
        perro.ir(destino, () => {
          if (this.activo) perro.rot = THREE.MathUtils.degToRad(DE_FRENTE);
        });
      }
    }
    // Cámara pegada al perrito en el modo mascota
    if (this.activo) {
      const c = perro.cabeza();
      c.y -= 0.12;
      if (this.foco.lengthSq() === 0) this.foco.copy(c);
      this.foco.lerp(c, Math.min(1, dt * 4));
      this.d.mundo.enfocar(this.foco, ZOOM, ZOOM);
    }
    // Globos: lo que siente o lo que necesita
    this.globos(p, perro);
    this.tHud -= dt;
    if (this.tHud <= 0) {
      this.tHud = 0.5;
      this.pintarHud();
      void this.revisarPopo();
    }
    this.tGuardar -= dt;
    if (this.tGuardar <= 0 && Object.keys(this.pendiente).length) void this.guardarPendiente();
  }

  private globos(p: Perrito, perro: Perro3D) {
    const capa = this.d.capa;
    if (this.d.casa3d.actual !== 'patio' || !perro.grupo.visible) {
      capa.poner('perro-efecto', null, 0, 0);
      capa.poner('perro-piensa', null, 0, 0);
      return;
    }
    const v = perro.cabeza();
    v.y += 0.35;
    const s = this.d.mundo.aPantalla(v);
    const h = perro.haciendo;
    const efecto = h === 'dormir' ? 'zzz' : h === 'banar' ? 'burbujas' : h === 'caricia' || h === 'cosquillas' ? 'corazones' : h === 'feliz' ? 'brillos' : null;
    capa.poner('perro-efecto', efecto, s.x, s.y);
    const falta = NECESIDADES_PERRO.filter((n) => p[n] < 30).sort((a, b) => p[a] - p[b])[0];
    capa.poner('perro-piensa', !efecto && falta && !perro.caminando && !p.dormido ? 'pensamiento' : null, s.x, s.y, falta ? `<span class="ico">${ICONO[falta]}</span>` : undefined);
  }

  private pintarHud() {
    const p = this.datos;
    if (!p || this.hud.hidden) return;
    const nv = nivelPerro(p.xp);
    this.hud.querySelector('.perro-nombre')!.textContent = p.nombre;
    this.hud.querySelector('.perro-nivel')!.textContent = `Nivel ${nv}`;
    for (const n of NECESIDADES_PERRO) {
      const b = this.hud.querySelector(`[data-n="${n}"]`) as HTMLElement;
      const v = Math.round(p[n]);
      (b.querySelector('b') as HTMLElement).style.width = `${v}%`;
      b.classList.toggle('baja', v < 30);
    }
    (this.hud.querySelector('[data-perro="dormir"] em') as HTMLElement).textContent = p.dormido ? 'Despertar' : 'Dormir';
    this.hud.classList.toggle('dormido', !!p.dormido);
  }

  private puntoLibre(): P {
    const d = this.d.casa3d.dato;
    for (let i = 0; i < 12; i++) {
      const q = { x: (Math.random() - 0.5) * (d.W - 1.6), y: -d.D / 2 + 0.5 + Math.random() * (d.D - 1.6) };
      if (this.d.casa3d.libre('patio', q)) return q;
    }
    return this.d.casa3d.puntos('patio').perro_juego;
  }

  // -------------------------------------------------------------------------
  // Modo mascota
  // -------------------------------------------------------------------------
  hojaAdoptar() {
    const nombres = NOMBRES_PERRO.map((n) => `<button type="button" class="chip" data-nombre-perro="${n}">${n}</button>`).join('');
    const colores = Object.entries(PELAJES)
      .map(([id, p], i) => `<button type="button" class="pelaje" data-pelaje="${id}" aria-pressed="${i === 0}" style="--p:${p.pelaje};--m:${p.manchas}"><i></i><span>${p.nombre}</span></button>`)
      .join('');
    abrirHoja(
      'Adoptar un perrito',
      `<form id="form-perro" class="form-perro">
        <p class="nota-hoja">Va a vivir en el patio y es de los dos: denle comida, báñenlo, jueguen con la pelota y enséñenle trucos. Si lo descuidan se pone triste.</p>
        <div class="sexo-perro">
          <label><input type="radio" name="perro-sexo" value="macho" checked><span>🐶 Perrito</span></label>
          <label><input type="radio" name="perro-sexo" value="hembra"><span>🐶 Perrita</span></label>
        </div>
        <label class="campo">¿Cómo se va a llamar?<input id="perro-nombre" maxlength="24" placeholder="Canela"></label>
        <div class="chips-nombres">${nombres}</div>
        <p class="nota-hoja"><b>Color</b></p>
        <div class="pelajes">${colores}</div>
        <button class="boton boton-rosa" type="submit">Adoptar</button>
      </form>`,
    );
  }

  private async adoptar(nombre: string, pelaje: string, hembra: boolean) {
    if (this.d.casa()?.perro) return cerrarHoja();
    const ok = await this.d.cambiarCasa((c) => {
      if (!c.perro) c.perro = perritoNuevo(nombre.slice(0, 24), pelaje, hembra);
    });
    cerrarHoja();
    if (!ok) return;
    this.hembra = hembra;
    await this.asegurar();
    const perro = this.perro!;
    perro.pintar(pelaje);
    this.d.casa3d.letrero('patio', 'letrero_casita', nombre);
    // Entra corriendo por la puerta de la casa, ladra y salta de la dicha
    const c = this.d.casa3d.puntos('patio');
    perro.poner(c.entrada, 180);
    this.ocupado = true;
    perro.ir(c.perro_juego, () => {
      perro.rot = THREE.MathUtils.degToRad(DE_FRENTE);
      guau(3, 1.2);
      perro.hacer('feliz', 2.2, () => (this.ocupado = false));
    });
    lluviaCorazones(24);
    toast(`¡Bienvenid${hembra ? 'a' : 'o'} a casa, ${nombre}! 🐶`, 3600);
  }

  activar() {
    if (!this.d.casa()?.perro) return this.hojaAdoptar();
    this.activo = true;
    document.body.classList.add('modo-perro');
    this.hud.hidden = false;
    this.menu.hidden = true;
    this.foco.set(0, 0, 0);
    this.d.personajes(false);
    void this.asegurar().then(() => {
      const perro = this.perro!;
      if (!this.datos?.dormido && !this.ocupado) {
        perro.ir(this.d.casa3d.puntos('patio').perro_juego, () => {
          perro.rot = THREE.MathUtils.degToRad(DE_FRENTE);
          guau(2, 1.15);
          perro.hacer('feliz', 1.4);
        });
      }
    });
    this.pintarHud();
    this.d.alCambiarModo();
  }

  salir() {
    if (!this.activo) return;
    this.activo = false;
    document.body.classList.remove('modo-perro');
    this.hud.hidden = true;
    this.menu.hidden = true;
    this.d.personajes(true);
    this.d.mundo.fijarZoom(1);
    void this.terminarDeEscuchar(true);
    void this.guardarPendiente();
    this.d.alCambiarModo();
  }

  private boton(id: string) {
    sonido.toque();
    const p = this.datos;
    if (!p || !this.perro) return;
    if (id === 'dormir') return p.dormido ? void this.despertar() : void this.dormir();
    if (p.dormido) return toast(`${p.nombre} está dormid${this.hembra ? 'a' : 'o'}. Despiérta${this.lo} primero.`);
    if (id === 'comer') return this.abrirMenu('comer');
    if (id === 'trucos') return this.abrirMenu('trucos');
    if (id === 'banar') return void this.banar();
    if (id === 'pelota') return void this.tirarPelota();
  }

  private abrirMenu(cual: 'comer' | 'trucos') {
    const p = this.datos!;
    const monedas = this.d.casa()?.monedas ?? 0;
    if (cual === 'comer') {
      this.menu.innerHTML = `
        <button data-opcion="comer:cuido"><span>🥣</span><b>Cuido</b><small>Gratis · llena la barriga</small></button>
        <button data-opcion="comer:huesito" aria-disabled="${monedas < PRECIO_HUESITO}"><span>🦴</span><b>Huesito</b><small>${PRECIO_HUESITO} monedas · ¡lo pone feliz!</small></button>`;
    } else {
      const nv = nivelPerro(p.xp);
      this.menu.innerHTML = TRUCOS.map((t) =>
        t.nivel <= nv
          ? `<button data-opcion="truco:${t.id}"><span>⭐</span><b>${t.nombre}</b></button>`
          : `<button aria-disabled="true"><span>🔒</span><b>${t.nombre}</b><small>Nivel ${t.nivel}</small></button>`,
      ).join('');
    }
    this.menu.dataset.cual = cual;
    this.menu.hidden = false;
  }

  // -------------------------------------------------------------------------
  // Cuidados
  // -------------------------------------------------------------------------
  /** Cambia el perrito en la casa compartida (con sus valores al día). */
  private cambiar(fn: (p: Perrito) => void) {
    return this.d.cambiarCasa((c) => {
      if (!c.perro) return;
      const p = perroAlDia(c.perro);
      fn(p);
      c.perro = p;
    });
  }

  /** Mimos pequeños (caricias, trucos): se juntan y se guardan de a poquitos. */
  private sumar(cambios: Partial<Record<NecesidadPerro | 'xp', number>>) {
    for (const [k, v] of Object.entries(cambios) as [NecesidadPerro | 'xp', number][]) this.pendiente[k] = (this.pendiente[k] ?? 0) + v;
    if (this.tGuardar <= 0) this.tGuardar = 3;
  }

  private async guardarPendiente() {
    const c = this.pendiente;
    this.pendiente = {};
    this.tGuardar = 0;
    if (!Object.keys(c).length) return;
    const antes = nivelPerro(this.datos?.xp ?? 0);
    await this.cambiar((p) => {
      for (const n of NECESIDADES_PERRO) if (c[n]) p[n] = Math.max(0, Math.min(100, p[n] + c[n]!));
      if (c.xp) p.xp += c.xp;
    });
    this.subioNivel(antes);
  }

  private subioNivel(antes: number) {
    const p = this.datos;
    if (!p) return;
    const nv = nivelPerro(p.xp);
    if (nv <= antes) return;
    const truco = TRUCOS.find((t) => t.nivel === nv);
    lluviaCorazones(18);
    sonido.fin(true);
    toast(`¡${p.nombre} subió a nivel ${nv}!${truco ? ` Aprendió «${truco.nombre}».` : ''}`, 3800);
  }

  private async accion(tipo: AccionPerro, fn: (p: Perrito) => void) {
    const antes = nivelPerro(this.datos?.xp ?? 0);
    const ahora = Date.now();
    const ok = await this.cambiar((p) => {
      fn(p);
      p.accion = { tipo, desde: ahora, de: this.d.yo() };
    });
    if (ok) {
      this.vistoAccion = ahora;
      this.subioNivel(antes);
    }
    return ok;
  }

  private async comer(huesito: boolean) {
    const p = this.datos;
    if (!p || this.ocupado) return;
    if (!huesito && p.hambre >= 92) {
      this.perro!.hacer('sentado', 1.5);
      return toast(`${p.nombre} no tiene hambre ahorita.`);
    }
    if (huesito && (this.d.casa()?.monedas ?? 0) < PRECIO_HUESITO) return toast('No alcanzan las monedas para el huesito.');
    const ok = await this.accion(huesito ? 'premio' : 'comer', (q) => {
      q.hambre = Math.min(100, q.hambre + (huesito ? 15 : 40));
      if (huesito) q.alegria = Math.min(100, q.alegria + 25);
      q.xp += huesito ? 4 : 3;
      // Un rato después de comer… hay que salir a recoger
      q.popoEn ??= Date.now() + (3 + Math.random() * 5) * 60000;
    });
    if (!ok) return;
    if (huesito) {
      await this.d.cambiarCasa((c) => {
        c.monedas = Math.max(0, c.monedas - PRECIO_HUESITO);
      });
      this.ocupado = true;
      guau(2, 1.3);
      this.perro!.hacer('pedir', 1.8, () => {
        sonido.mordisco();
        this.perro!.hacer('feliz', 2, () => (this.ocupado = false));
      });
      return;
    }
    await this.secuenciaComer();
  }

  private secuenciaComer() {
    const perro = this.perro!;
    const c = this.d.casa3d.puntos('patio');
    this.ocupado = true;
    return new Promise<void>((listo) => {
      perro.ir(c.perro_plato, () => {
        perro.rot = Math.PI;
        this.verObjeto('cuido', true);
        let n = 0;
        const crunch = setInterval(() => (n++ < 7 ? sonido.mordisco() : clearInterval(crunch)), 600);
        perro.hacer('comer', 4.5, () => {
          this.verObjeto('cuido', false);
          perro.rot = THREE.MathUtils.degToRad(DE_FRENTE);
          perro.hacer('feliz', 1.3, () => {
            this.ocupado = false;
            listo();
          });
        });
      });
    });
  }

  private async banar() {
    const p = this.datos;
    if (!p || this.ocupado) return;
    if (p.higiene >= 95) return toast(`${p.nombre} ya está limpiecit${this.hembra ? 'a' : 'o'}.`);
    const ok = await this.accion('banar', (q) => {
      q.higiene = 100;
      q.xp += 4;
    });
    if (ok) await this.secuenciaBano();
  }

  private secuenciaBano() {
    const perro = this.perro!;
    const c = this.d.casa3d.puntos('patio');
    const tina = this.d.casa3d.dato.cuartos.patio.marcas?.tina;
    const frente = { x: c.perro_tina.x - 0.1, y: c.perro_tina.y - 0.75 };
    const deFrente = () => (perro.rot = THREE.MathUtils.degToRad(DE_FRENTE));
    this.ocupado = true;
    return new Promise<void>((listo) => {
      perro.ir(frente, () => {
        // Se mete a la tina de un brinquito
        perro.ir(c.perro_tina, () => {
          deFrente();
          perro.piso = (tina?.z ?? 0.24) - 0.18;
          perro.hacer('saltar', 0.45, () => {
            this.verObjeto('espuma_tina', true);
            perro.espuma(true);
            chapoteo();
            const burbujas = setInterval(() => sonido.burbuja(), 350);
            perro.hacer('banar', 5, () => {
              clearInterval(burbujas);
              perro.espuma(false);
              this.verObjeto('espuma_tina', false);
              perro.hacer('saltar', 0.45, () => {
                perro.piso = 0;
                perro.ir(frente, () => {
                  deFrente();
                  // Se sacude y salpica todo
                  perro.salpicar();
                  chapoteo();
                  perro.hacer('sacudir', 1.3, () => {
                    guau(1, 1.2);
                    perro.hacer('feliz', 1.2, () => {
                      this.ocupado = false;
                      listo();
                    });
                  });
                }, true);
              });
            });
          });
        }, true);
      });
    });
  }

  /** Tira la pelota (a donde se tocó o a un sitio libre) y el perrito la va a buscar y la trae. */
  private async tirarPelota(destino?: P) {
    const p = this.datos;
    const perro = this.perro;
    if (!p || !perro || this.ocupado || this.vuelo) return;
    if (p.energia < 10) return toast(`${p.nombre} está muy cansad${this.hembra ? 'a' : 'o'}. Déja${this.lo} dormir un rato.`);
    const c = this.d.casa3d.puntos('patio');
    const meta = destino && this.d.casa3d.libre('patio', destino) ? destino : this.puntoLibre();
    perro.morder(null);
    this.pelota.removeFromParent();
    this.d.casa3d.cuarto('patio').add(this.pelota);
    this.ocupado = true;
    perro.hacer('escuchar', 0.7);
    const salida = aTres(perro.pos.x + 0.6, perro.pos.y - 0.9, 0.9);
    sonido.toque();
    this.vuelo = {
      a: salida,
      b: aTres(meta.x, meta.y, 0.075),
      t: 0,
      dur: 0.75,
      fin: () => {
        guau(1, 1.25);
        perro.ir(meta, () => {
          perro.morder(this.pelota);
          perro.ir(c.perro_juego, () => {
            perro.rot = THREE.MathUtils.degToRad(DE_FRENTE);
            perro.morder(null);
            perro.hacer('feliz', 1.4, () => (this.ocupado = false));
            this.sumar({ alegria: 12, energia: -4, hambre: -2, xp: 2 });
          });
        });
      },
    };
  }

  private volarPelota(dt: number) {
    const v = this.vuelo;
    if (!v) return;
    v.t += dt;
    const u = Math.min(1, v.t / v.dur);
    this.pelota.position.lerpVectors(v.a, v.b, u);
    this.pelota.position.y += Math.sin(u * Math.PI) * 0.9;
    this.pelota.rotation.x += dt * 12;
    if (u >= 1) {
      this.vuelo = null;
      sonido.nota(300, 0.08, 0, 'sine', 0.05, 180);
      v.fin();
    }
  }

  private dormir() {
    const p = this.datos;
    if (!p || this.ocupado) return;
    void this.accion('dormir', (q) => {
      q.dormido = Date.now();
      q.xp += 1;
    });
    this.irADormir(true);
  }

  private irADormir(avisar: boolean) {
    const perro = this.perro;
    if (!perro) return;
    const c = this.d.casa3d.puntos('patio');
    this.ocupado = true;
    perro.ir(c.perro_casita, () => {
      perro.ir(c.perro_dormir, () => {
        perro.rot = 0;
        perro.hacer('dormir', Infinity);
        this.ocupado = false;
        if (avisar) sonido.bostezo();
      }, true);
    });
  }

  private async despertar() {
    await this.accion('despertar', (q) => {
      delete q.dormido;
    });
    this.salirDeLaCasita();
    guau(1, 1.1);
  }

  private salirDeLaCasita() {
    const perro = this.perro;
    if (!perro) return;
    perro.parar();
    const c = this.d.casa3d.puntos('patio');
    this.ocupado = true;
    perro.ir(c.perro_casita, () => {
      perro.ir(this.activo ? c.perro_juego : this.puntoLibre(), () => {
        perro.rot = THREE.MathUtils.degToRad(DE_FRENTE);
        this.ocupado = false;
      });
    }, true);
  }

  private async truco(t: Accion) {
    const p = this.datos;
    const perro = this.perro;
    if (!p || !perro || this.ocupado) return;
    if (p.energia < 10) return toast(`${p.nombre} está muy cansad${this.hembra ? 'a' : 'o'} para trucos.`);
    const tr = TRUCOS.find((x) => x.id === t)!;
    this.ocupado = true;
    perro.rot = THREE.MathUtils.degToRad(DE_FRENTE);
    if (t === 'saltar' || t === 'pedir') guau(2, 1.3);
    perro.hacer(t, tr.dur, () => {
      guau(1, 1.2);
      perro.hacer('feliz', 1, () => (this.ocupado = false));
    });
    this.sumar({ alegria: 4, energia: -1, xp: 1 });
  }

  // -------------------------------------------------------------------------
  // Toques
  // -------------------------------------------------------------------------
  /** Un toque sobre la casa mientras se ve el patio: ¿fue al perrito, a un popó o a la grama? */
  tocar(x: number, y: number): boolean {
    const perro = this.perro;
    if (!perro) return false;
    const rayo = new THREE.Raycaster();
    rayo.setFromCamera(new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1), this.d.mundo.camara);
    // Popós: se recogen
    for (const [k, o] of this.popos) {
      if (rayo.intersectObject(o, true).length) {
        void this.recoger(k, o.userData.popo);
        return true;
      }
    }
    const h = perro.grupo.visible ? rayo.intersectObject(perro.grupo, true)[0] : undefined;
    if (h) {
      if (!this.activo) {
        this.activar();
        return true;
      }
      this.tocarPerro(perro.parteTocada(h.object));
      return true;
    }
    if (!this.activo) return false;
    this.menu.hidden = true;
    // En la grama: ahí va la pelota
    const base = this.d.casa3d.objeto('patio', 'piso');
    const suelo = base ? rayo.intersectObject(base, true)[0] : undefined;
    if (suelo && !this.datos?.dormido) void this.tirarPelota({ x: suelo.point.x, y: -suelo.point.z });
    return true;
  }

  private tocarPerro(parte: ReturnType<Perro3D['parteTocada']>) {
    const perro = this.perro!;
    const p = this.datos;
    if (!p || this.ocupado || !parte) return;
    if (p.dormido) {
      // Dormido: solo se acomoda y suspira
      sonido.bostezo();
      return;
    }
    perro.ir(perro.pos);
    perro.rot = THREE.MathUtils.degToRad(DE_FRENTE);
    switch (parte) {
      case 'cabeza':
        perro.hacer('caricia', 2.2);
        sonido.nota(880, 0.2, 0, 'sine', 0.03, 1100);
        if (Date.now() - this.ultimaCaricia > 2500) this.sumar({ alegria: 4, xp: 1 });
        this.ultimaCaricia = Date.now();
        break;
      case 'barriga':
        perro.hacer('cosquillas', 2.4);
        risita();
        this.sumar({ alegria: 5, energia: -1 });
        break;
      case 'cola':
        perro.hacer('cola', 1.6);
        gruñido();
        setTimeout(() => guau(2, 0.9), 350);
        this.sumar({ alegria: -3 });
        break;
      case 'nariz':
        perro.hacer('estornudo', 1.1);
        setTimeout(achis, 650);
        this.sumar({ alegria: 2 });
        break;
      case 'pata':
        perro.hacer(nivelPerro(p.xp) >= 2 ? 'pata' : 'sentado', 2.2);
        this.sumar({ alegria: 2 });
        break;
    }
  }

  private async recoger(k: string, pos: [number, number]) {
    const o = this.popos.get(k);
    if (!o) return;
    sonido.nota(520, 0.1, 0, 'triangle', 0.05, 700);
    sonido.limpio();
    o.removeFromParent();
    this.popos.delete(k);
    await this.cambiar((p) => {
      p.popos = p.popos.filter(([x, y]) => Math.abs(x - pos[0]) > 0.01 || Math.abs(y - pos[1]) > 0.01);
      p.xp += 2;
    });
    toast('¡Recogido! 🧻');
  }

  /** Después de comer le llega el momento: aparece un popó en la grama (máximo tres). */
  private async revisarPopo() {
    const p = this.d.casa()?.perro;
    if (!p?.popoEn || Date.now() < p.popoEn || p.dormido) return;
    const lugar = this.puntoLibre();
    await this.cambiar((q) => {
      if (!q.popoEn || Date.now() < q.popoEn) return;
      delete q.popoEn;
      if (q.popos.length < 3) q.popos = [...q.popos, [Math.round(lugar.x * 100) / 100, Math.round(lugar.y * 100) / 100]];
    });
  }

  // -------------------------------------------------------------------------
  // Háblale (como Talking Tom): graba y lo repite con vocecita
  // -------------------------------------------------------------------------
  private async empezarAEscuchar() {
    const perro = this.perro;
    const p = this.datos;
    if (!perro || !p || this.grabadora) return;
    if (p.dormido) return toast(`${p.nombre} está dormid${this.hembra ? 'a' : 'o'}.`);
    this.grabadora = new Grabadora();
    this.hud.classList.add('escuchando');
    try {
      await this.grabadora.empezar();
      perro.rot = THREE.MathUtils.degToRad(DE_FRENTE);
      perro.hacer('escuchar', Infinity);
      // No más de 6 segundos
      setTimeout(() => void this.terminarDeEscuchar(), 6000);
    } catch (e) {
      this.grabadora = null;
      this.hud.classList.remove('escuchando');
      toast(e instanceof Error ? e.message : 'No se pudo usar el micrófono.');
    }
  }

  private async terminarDeEscuchar(cancelar = false) {
    const g = this.grabadora;
    if (!g) return;
    this.grabadora = null;
    this.hud.classList.remove('escuchando');
    if (!g.grabando) return;
    if (cancelar || g.segundos < 0.4) {
      g.cancelar();
      this.perro?.parar();
      return;
    }
    const { blob } = await g.parar();
    await this.repetir(blob);
  }

  private async repetir(blob: Blob) {
    const perro = this.perro;
    if (!perro) return;
    try {
      this.audio ??= new AudioContext();
      const ctx = this.audio;
      if (ctx.state === 'suspended') await ctx.resume();
      const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = 1.55;
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      const vol = ctx.createGain();
      vol.gain.value = 1.4;
      src.connect(an).connect(vol).connect(ctx.destination);
      const datos = new Uint8Array(an.fftSize);
      const dur = buf.duration / 1.55;
      perro.hacer('hablar', dur + 0.3, () => {
        perro.voz = 0;
        perro.hacer('feliz', 0.8);
      });
      src.start();
      const t0 = performance.now();
      const medir = () => {
        if (performance.now() - t0 > (dur + 0.3) * 1000) return;
        an.getByteTimeDomainData(datos);
        let s = 0;
        for (const v of datos) s += ((v - 128) / 128) ** 2;
        perro.voz = Math.min(1, Math.sqrt(s / datos.length) * 6);
        requestAnimationFrame(medir);
      };
      medir();
      this.sumar({ alegria: 3, xp: 2 });
    } catch {
      perro.parar();
      toast('No se pudo repetir el audio en este celular.');
    }
  }

  /** Para las pruebas: tocar una parte del perrito o tirar la pelota sin tocar la pantalla. */
  probar(que: string) {
    if (que === 'pelota') return void this.tirarPelota();
    if (que === 'comer') return void this.comer(false);
    if (que === 'banar') return void this.banar();
    if (que === 'dormir') return void this.dormir();
    if (que === 'despertar') return void this.despertar();
    if (TRUCOS.some((t) => t.id === que)) return void this.truco(que as Accion);
    this.tocarPerro(que as 'cabeza');
  }
}

/** Un popó de caricatura (tres bolitas en espiral) con su brillito. */
function popo(): THREE.Object3D {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#7A4B2A', roughness: 0.5 });
  [
    [0.075, 0.045],
    [0.058, 0.1],
    [0.038, 0.145],
  ].forEach(([r, y]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
    m.position.y = y;
    m.scale.y = 0.75;
    g.add(m);
  });
  const punta = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 10), mat);
  punta.position.y = 0.18;
  g.add(punta);
  const brillo = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  brillo.position.set(-0.03, 0.12, 0.045);
  g.add(brillo);
  // Área de toque más grande que el dibujo
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ visible: false })));
  return g;
}
