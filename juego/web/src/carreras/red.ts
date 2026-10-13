// La carrera en línea por sala (src/salas/): hasta 4 personas, cada una en su celular, y la máquina completa a 8.
//
// Cómo se reparte el trabajo:
// - Cada aparato mueve SU carro (se siente inmediato) y le manda a los demás cómo va, 15 veces por segundo (`k`).
// - El anfitrión mueve a la máquina, las cajas y todo lo que hay en la pista, y manda la «foto» (`f`) 15 veces por
//   segundo. Él decide quién coge caja (`obj`), a quién le pega algo (`golpe`) y a quién moja la lluvia (`moja`).
// - Quien usa un objeto se lo cuenta al anfitrión (`usa`), que lo lanza desde donde va ese carro.
// - Quien llega a la meta lo cuenta a todos (`meta`); cuando todas las personas llegaron, el anfitrión cierra (`fin`).
// - Si alguien se corta, su carro sigue derecho un rato (avisa la sala) y si se va, lo maneja la máquina.
import { crearSala, unirseSala, normalizarCodigo } from '../salas/sala';
import { esperarEnSala } from '../salas/espera';
import { caritaSvg } from '../salas/carita';
import type { JugadorSala, Sala } from '../salas/tipos';
import { avisoSuelto } from '../sueltos/comun';
import { CRIATURAS, ORDEN_PISTAS, PISTAS, PUNTOS, CARROS, type Corredor, type IdCarro, type IdCriatura, type IdObjeto, type IdPista } from './datos';
import type { OpcionesCarrera, Resultado } from './main';
import type { Control, Evento, Kart, Sim, TipoCosa } from './sim';
import { escapar } from './hud';

export interface Red {
  soyAnfitrion: boolean;
  hayAmigos: boolean;
  /** Espera a que todos hayan cargado la pista (el anfitrión da la salida a la vez). */
  esperarListos(): Promise<void>;
  empezar(sim: Sim, mio: number, alEvento: (e: Evento) => void, alSalir: () => void): void;
  paso(): void;
  meta(tiempo: number): void;
  detener(): void;
}

interface Contexto {
  pantalla(html: string, clase?: string): HTMLElement;
  miCorredor(): Corredor;
  rivales(n: number, excluir?: Set<string>): Corredor[];
  ajustes(): { dificultad: string };
  garaje(luego: () => void): void;
  correr(o: OpcionesCarrera): Promise<Resultado>;
  resultados(r: Resultado, titulo: string, puntos?: Map<string, number>, ganados?: Map<string, number>, conPodio?: boolean): Promise<void>;
  podio(top: Corredor[], titulo: string): Promise<void>;
  portada(): void;
  vaciar(): void;
  arrancarGaraje(): void;
}

interface Config {
  modo: 'suelta' | 'gp';
  pista: IdPista;
  n: number;
  semilla: number;
  /** Corredores en orden de salida: id del jugador dueño (o null: la máquina). */
  lista: { j: string | null; c: Corredor }[];
}

const JUEGO = 'carreras';
const HZ = 1 / 15;

/** El corredor de un jugador de la sala (con lo que escogió en su garaje). */
function corredorDe(j: JugadorSala): Corredor {
  const d = (j.datos ?? {}) as { criatura?: string; carro?: string; color?: string };
  return {
    id: j.id, nombre: j.nombre, voz: j.tipo === 'amigo' ? 'amigo' : j.tipo, aspecto: j.aspecto,
    criatura: d.criatura && d.criatura in CRIATURAS ? (d.criatura as IdCriatura) : 'unicornio',
    carro: d.carro && d.carro in CARROS ? (d.carro as IdCarro) : 'carreta',
    color: typeof d.color === 'string' && /^#[0-9a-f]{6}$/i.test(d.color) ? d.color : '#e4566b',
  };
}

export async function abrirEnLinea(ctx: Contexto) {
  ctx.arrancarGaraje();
  const params = new URLSearchParams(location.search);
  const unirse = params.get('unirse');
  let sala: Sala;
  if (unirse) {
    try {
      sala = await unirseSala(normalizarCodigo(unirse), JUEGO);
    } catch (e) {
      avisoSuelto((e as Error).message);
      return ctx.portada();
    }
  } else {
    const r = ctx.pantalla(`<div class="car-panel car-linea"><h2>En línea</h2>
      <p>Corran hasta cuatro, cada uno en su celular. La máquina completa los ocho.</p>
      <div class="car-opciones">
        <button class="car-boton grande" data-c="suelta">Crear sala · Carrera</button>
        <button class="car-boton" data-c="gp">Crear sala · Gran Premio</button>
        <div class="car-unirse"><input maxlength="5" placeholder="CÓDIGO" autocapitalize="characters"><button class="car-boton" data-c="unirse">Unirme</button></div>
        <button class="car-boton suave" data-c="garaje">🛠️ Mi carro</button>
        <button class="car-boton suave" data-c="atras">⟵ Atrás</button>
      </div></div>`, 'linea');
    const que = await new Promise<string>((ok) => r.addEventListener('click', (e) => {
      const c = (e.target as HTMLElement).closest<HTMLElement>('[data-c]')?.dataset.c;
      if (c) ok(c);
    }));
    if (que === 'atras') return ctx.portada();
    if (que === 'garaje') return ctx.garaje(() => void abrirEnLinea(ctx));
    try {
      if (que === 'unirse') {
        const codigo = normalizarCodigo((r.querySelector('input') as HTMLInputElement).value);
        sala = await unirseSala(codigo, JUEGO);
      } else {
        sala = await crearSala({ juego: JUEGO, max: 4 });
        modoSala = que as 'suelta' | 'gp';
      }
    } catch (e) {
      avisoSuelto((e as Error).message);
      return void abrirEnLinea(ctx);
    }
  }
  await lobby(ctx, sala);
}

let modoSala: 'suelta' | 'gp' = 'suelta';
let pistaSala: IdPista = 'valle';

async function lobby(ctx: Contexto, sala: Sala) {
  ctx.pantalla('', 'vacia');
  ctx.arrancarGaraje();
  const mio = ctx.miCorredor();
  sala.ponerDatos({ criatura: mio.criatura, carro: mio.carro, color: mio.color, jugando: false });
  const e = esperarEnSala({
    sala, titulo: 'La Carrera de las Tres Lunas', subtitulo: sala.soyAnfitrion ? (modoSala === 'gp' ? 'Gran Premio · 4 pistas' : `Carrera · ${PISTAS[pistaSala].nombre}`) : 'Carrera en línea',
    tema: 'burbujas', minimo: 1,
    retrato: (j) => `<span class="car-carita grande" style="--c:${corredorDe(j).color}">${caritaSvg(j.aspecto, 64, 'feliz')}</span>`,
    detalle: (j) => `${CRIATURAS[corredorDe(j).criatura].nombre}`,
    extras: sala.soyAnfitrion && modoSala === 'suelta' ? [{ id: 'pista', texto: '🗺️ Cambiar pista', alTocar: () => {
      pistaSala = ORDEN_PISTAS[(ORDEN_PISTAS.indexOf(pistaSala) + 1) % ORDEN_PISTAS.length];
      const sub = document.querySelector('.sala-espera .sub, .sala-espera p');
      if (sub) sub.textContent = `Carrera · ${PISTAS[pistaSala].nombre}`;
      avisoSuelto(`Pista: ${PISTAS[pistaSala].nombre}`, 1600);
    } }] : [],
    alEmpezar: () => armarConfig(ctx, sala, modoSala === 'gp' ? ORDEN_PISTAS[0] : pistaSala, 0),
  });
  const r = await e.resultado;
  if (r.que !== 'empezar') {
    if (r.motivo) avisoSuelto(r.motivo);
    sala.salir();
    return ctx.portada();
  }
  await partida(ctx, sala, r.datos as Config);
}

function armarConfig(ctx: Contexto, sala: Sala, pista: IdPista, n: number, puntos?: Map<string, number>): Config {
  const humanos = sala.jugadores.map((j) => ({ j: j.id, c: corredorDe(j) }));
  // Con amigos, la máquina es solo vecinos; si están Javier y Laura, la pareja no se repite
  const excluir = new Set<string>(sala.jugadores.filter((j) => j.tipo !== 'amigo').map((j) => j.tipo));
  if (sala.hayAmigos) {
    excluir.add('el');
    excluir.add('ella');
  }
  const maquina = ctx.rivales(8 - humanos.length, excluir).map((c) => ({ j: null, c }));
  let lista = [...maquina, ...humanos];
  if (puntos) lista = lista.sort((a, b) => (puntos.get(a.c.id) ?? 0) - (puntos.get(b.c.id) ?? 0));
  return { modo: modoSala, pista, n, semilla: (Math.random() * 1e9) | 0, lista };
}

async function partida(ctx: Contexto, sala: Sala, cfg: Config) {
  const yo = sala.yo.id;
  const puntos = new Map<string, number>();
  let config = cfg;
  for (;;) {
    sala.ponerDatos({ jugando: true, listo: false });
    const red = new RedCarrera(sala, config);
    const mio = config.lista.findIndex((x) => x.j === yo);
    const corredores = config.lista.map((x) => ({
      c: x.c, humano: x.j !== null,
      control: (x.j === yo ? 'local' : x.j === null && sala.soyAnfitrion ? 'ia' : 'remoto') as Control,
    }));
    const r = await ctx.correr({ pista: config.pista, corredores, mio, semilla: config.semilla, red });
    if (r.salio || red.seAcabo) {
      sala.salir();
      return ctx.portada();
    }
    const ganados = new Map<string, number>();
    r.orden.forEach((i, idx) => {
      const c = r.corredores[i];
      ganados.set(c.id, PUNTOS[idx] ?? 0);
      puntos.set(c.id, (puntos.get(c.id) ?? 0) + (PUNTOS[idx] ?? 0));
    });
    const gp = config.modo === 'gp';
    const ultima = !gp || config.n >= ORDEN_PISTAS.length - 1;
    const porPuntos = gp ? { ...r, orden: [...r.orden].sort((a, b) => (puntos.get(r.corredores[b].id) ?? 0) - (puntos.get(r.corredores[a].id) ?? 0)) } : r;
    await ctx.resultados(porPuntos, gp ? `Gran Premio · ${config.n + 1}/4` : PISTAS[config.pista].nombre, gp ? puntos : undefined, gp ? ganados : undefined, !gp);
    if (gp && ultima) {
      const final = config.lista.map((x) => x.c).sort((a, b) => (puntos.get(b.id) ?? 0) - (puntos.get(a.id) ?? 0));
      await ctx.podio(final, 'Campeones del Gran Premio');
    }
    ctx.vaciar();
    if (ultima) break;
    // Siguiente pista del Gran Premio: la arma el anfitrión y se la manda a todos
    const sig = await new Promise<Config | null>((ok) => {
      const p = ctx.pantalla(`<div class="car-panel car-fin"><h2>Siguiente: ${escapar(PISTAS[ORDEN_PISTAS[config.n + 1]].nombre)}</h2>
        ${sala.soyAnfitrion ? '<button class="car-boton grande" data-sig>¡Vamos!</button>' : '<p>Esperando al anfitrión…</p>'}
        <button class="car-boton suave" data-salir>Salir</button></div>`, 'fin');
      const quitar = sala.al('sig', (d) => {
        quitar();
        ok(d as Config);
      });
      p.querySelector('[data-sig]')?.addEventListener('click', () => {
        const c = armarConfig(ctx, sala, ORDEN_PISTAS[config.n + 1], config.n + 1, puntos);
        sala.mandar('sig', c);
        quitar();
        ok(c);
      });
      p.querySelector('[data-salir]')!.addEventListener('click', () => {
        quitar();
        ok(null);
      });
      sala.alFin(() => ok(null));
    });
    if (!sig) {
      sala.salir();
      return ctx.portada();
    }
    config = sig;
  }
  sala.ponerDatos({ jugando: false });
  await lobby(ctx, sala);
}

// ------------------------------------------------------------------------------------------ durante la carrera

/** Estado de un carro en la red: x, y, z, h, m, v, vy, banderas, giroT, invisible, mojado, truco, vuelta, prog, s, tiempo */
type Foto = number[];
const B_SUELO = 1, B_TERM = 2, B_DERR_I = 4, B_DERR_D = 8, B_CAYE = 16, B_FUERA = 32;

function foto(k: Kart): Foto {
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const b = (k.suelo ? B_SUELO : 0) | (k.terminado ? B_TERM : 0) | (k.derrape > 0 ? B_DERR_I : 0) | (k.derrape < 0 ? B_DERR_D : 0) | (k.cayendo > 0 ? B_CAYE : 0) | (k.fueraPista ? B_FUERA : 0);
  return [k.i, r2(k.x), r2(k.y), r2(k.z), r2(k.h), r2(k.m), r2(k.v), r2(k.vy), b, r2(k.giroT), r2(k.invisible), r2(k.mojado), r2(k.truco), k.vuelta, r2(k.prog), r2(k.lugar.s), r2(k.tiempo), r2(k.entrada.giro), k.turbo > 0 ? k.turboNivel : 0, r2(k.carga)];
}

interface Meta {
  x: number;
  y: number;
  z: number;
  h: number;
  t: number;
}

class RedCarrera implements Red {
  soyAnfitrion: boolean;
  hayAmigos: boolean;
  seAcabo = false;
  private sim: Sim | null = null;
  private mio = -1;
  private quitar: (() => void)[] = [];
  private t = 0;
  private metas = new Map<number, Meta>();
  private alEvento: (e: Evento) => void = () => undefined;
  private alSalir: () => void = () => undefined;
  private dueno = new Map<number, string>();
  private cortados = new Set<string>();

  constructor(private sala: Sala, private cfg: Config) {
    this.soyAnfitrion = sala.soyAnfitrion;
    this.hayAmigos = sala.hayAmigos;
    cfg.lista.forEach((x, i) => x.j && this.dueno.set(i, x.j));
  }

  private kartDe(id: string) {
    for (const [i, j] of this.dueno) if (j === id) return i;
    return -1;
  }

  esperarListos(): Promise<void> {
    const s = this.sala;
    return new Promise<void>((ok) => {
      let hecho = false;
      const listo = () => {
        if (hecho) return;
        hecho = true;
        quitarA();
        quitarC();
        clearTimeout(tope);
        ok();
      };
      const quitarA = s.al('arranca', () => listo());
      const cargados = new Set<string>([s.yo.id]);
      const revisar = () => {
        if (!s.soyAnfitrion) return;
        const faltan = s.jugadores.filter((j) => !cargados.has(j.id) && s.conectado(j.id));
        if (!faltan.length) {
          s.mandar('arranca', {});
          listo();
        }
      };
      const quitarC = s.al('cargado', (_d, de) => {
        cargados.add(de.id);
        revisar();
      });
      // (si alguien no termina de cargar en 30 s, se arranca sin esperarlo)
      const tope = setTimeout(() => {
        if (s.soyAnfitrion) s.mandar('arranca', {});
        listo();
      }, 30000);
      s.mandar('cargado', {});
      revisar();
    });
  }

  empezar(sim: Sim, mio: number, alEvento: (e: Evento) => void, alSalir: () => void) {
    this.sim = sim;
    this.mio = mio;
    this.alEvento = alEvento;
    this.alSalir = alSalir;
    const s = this.sala;
    this.quitar.push(
      s.al('k', (d) => this.aplicar(d as Foto, true)),
      s.al('f', (d) => {
        if (this.soyAnfitrion) return;
        const f = d as { k: Foto[]; c: number[][]; cj: number; t: number };
        for (const x of f.k) this.aplicar(x, false);
        this.cosas(f.c);
        sim.cajas.forEach((c, i) => (c.vuelve = f.cj & (1 << i) ? 1 : 0));
        if (Math.abs(sim.t - f.t) > 0.5 && sim.t < 0) sim.t = f.t;
      }),
      s.al('obj', (d) => {
        const { k, o } = d as { k: number; o: IdObjeto };
        if (k === this.mio && sim.karts[k]) {
          sim.darObjeto(sim.karts[k], o);
          alEvento({ t: 'caja', k });
        }
      }),
      s.al('golpe', (d) => {
        const { k, por, como } = d as { k: number; por: number; como: TipoCosa };
        if (k === this.mio && sim.karts[k]) sim.golpear(sim.karts[k], por, como);
      }),
      s.al('moja', (d) => {
        const { k } = d as { k: number };
        if (k === this.mio && sim.karts[k]) sim.karts[k].mojado = 3.6;
      }),
      s.al('usa', (d, de) => {
        if (!this.soyAnfitrion) {
          // Los demás oyen el sonido y la frase
          const { k, o } = d as { k: number; o: IdObjeto };
          alEvento({ t: 'usa', k, o });
          return;
        }
        const { k, o, atras, adelante } = d as { k: number; o: IdObjeto; atras: boolean; adelante: boolean };
        const kart = sim.karts[k];
        if (!kart || this.dueno.get(k) !== de.id) return;
        kart.objeto = o;
        kart.usos = 1;
        kart.ruleta = 0;
        sim.usar(kart, atras, adelante);
        kart.objeto = null;
      }),
      s.al('meta', (d) => {
        const { k, tiempo } = d as { k: number; tiempo: number };
        const kart = sim.karts[k];
        if (kart && !kart.terminado) sim.llegar(kart, tiempo);
      }),
      s.al('fin', (d) => {
        const f = d as { orden: number[]; tiempos: number[] };
        f.orden.forEach((i, idx) => {
          const k = sim.karts[i];
          if (!k) return;
          k.tiempo = f.tiempos[i];
          k.terminado = true;
          k.puesto = idx;
        });
        sim.orden = f.orden;
        sim.terminada = true;
      }),
      s.alCorte((cortado, quien) => {
        if (cortado) this.cortados.add(quien.id);
        else this.cortados.delete(quien.id);
        avisoSuelto(cortado ? `Se cortó la conexión con ${quien.nombre}…` : `${quien.nombre} volvió`, 2200);
      }),
      s.alCambiar((js) => {
        // Si alguien se fue de la sala, su carro lo maneja la máquina (en el anfitrión)
        for (const [i, id] of [...this.dueno]) {
          if (!js.some((j) => j.id === id) && sim.karts[i]) {
            this.dueno.delete(i);
            sim.karts[i].humano = false;
            if (this.soyAnfitrion) sim.karts[i].control = 'ia';
          }
        }
      }),
      s.alFin((_m, texto) => {
        avisoSuelto(texto || 'Se acabó la sala.');
        this.seAcabo = true;
        this.alSalir();
      }),
    );
  }

  /** Lo que llegó de otro carro: se guarda como meta y `paso` lo acerca suavecito. */
  private aplicar(f: Foto, deSuDueno: boolean) {
    const sim = this.sim;
    if (!sim) return;
    const i = f[0];
    const k = sim.karts[i];
    if (!k || i === this.mio || k.control !== 'remoto') return;
    if (!deSuDueno && this.dueno.has(i) && !this.soyAnfitrion) {
      // (las personas se oyen directo de su aparato; la foto del anfitrión solo trae a la máquina)
      return;
    }
    const [, x, y, z, h, m, v, vy, b, giroT, invisible, mojado, truco, vuelta, prog, s, tiempo, giro, turbo, carga] = f;
    this.metas.set(i, { x, y, z, h, t: performance.now() });
    k.m = m;
    k.v = v;
    k.vy = vy;
    k.suelo = (b & B_SUELO) !== 0;
    k.derrape = b & B_DERR_I ? 1 : b & B_DERR_D ? -1 : 0;
    k.cayendo = b & B_CAYE ? 1 : 0;
    k.fueraPista = (b & B_FUERA) !== 0;
    k.giroT = giroT;
    k.invisible = invisible;
    k.mojado = mojado;
    k.truco = truco;
    k.vuelta = vuelta;
    k.prog = prog;
    k.lugar.s = s;
    k.entrada.giro = giro;
    k.turbo = turbo ? 0.2 : 0;
    k.turboNivel = turbo;
    k.carga = carga;
    if (b & B_TERM && !k.terminado) sim.llegar(k, tiempo);
  }

  private cosas(lista: number[][]) {
    const sim = this.sim!;
    const tipos: TipoCosa[] = ['enredadera', 'charco', 'semilla_vuela', 'brasa', 'lucero'];
    sim.cosas = lista.map(([id, t, x, y, z, h, edad, charco]) => {
      const vieja = sim.cosas.find((c) => c.id === id);
      return { id, tipo: tipos[t], x, y, z, h, v: 0, vy: 0, s: vieja?.s ?? 0, vida: 1, dueno: -1, objetivo: -1, t: edad, charco: !!charco };
    });
  }

  /** Cada paso de la física (60 por segundo). */
  paso() {
    const sim = this.sim;
    if (!sim) return;
    // Los carros que llegan por la red: se acercan a su última posición (con su velocidad hacia adelante)
    const ahora = performance.now();
    for (const [i, m] of this.metas) {
      const k = sim.karts[i];
      if (!k) continue;
      const edad = Math.min(0.25, (ahora - m.t) / 1000);
      const tx = m.x + Math.sin(k.m) * k.v * edad, tz = m.z + Math.cos(k.m) * k.v * edad;
      const f = 0.22;
      k.x += (tx - k.x) * f;
      k.z += (tz - k.z) * f;
      k.y += (m.y + k.vy * edad - k.y) * f;
      k.h += Math.atan2(Math.sin(m.h - k.h), Math.cos(m.h - k.h)) * f;
      sim.pista.lugar(k.x, k.z, k.lugar.s, k.lugar);
      if (k.giroT > 0) k.giroT = Math.max(0, k.giroT - 1 / 60);
    }
    // El anfitrión reparte cajas, golpes y lluvia a los dueños
    if (this.soyAnfitrion) {
      for (const ev of sim.eventos) {
        if (!('k' in ev)) continue;
        const dueno = this.dueno.get(ev.k);
        if (!dueno || dueno === this.sala.yo.id) continue;
        if (ev.t === 'objeto') this.sala.mandar('obj', { k: ev.k, o: sim.karts[ev.k].objeto }, { a: dueno });
        if (ev.t === 'golpe') this.sala.mandar('golpe', { k: ev.k, por: ev.por, como: ev.como }, { a: dueno });
      }
      for (const ev of sim.eventos) {
        if (ev.t === 'lluvia') for (const i of ev.mojados) {
          const d = this.dueno.get(i);
          if (d && d !== this.sala.yo.id) this.sala.mandar('moja', { k: i }, { a: d });
        }
      }
      // (en el anfitrión, el objeto de un invitado se entrega de una vez: la ruleta la ve el invitado)
      for (const [i, d] of this.dueno) if (d !== this.sala.yo.id && sim.karts[i]) sim.karts[i].objeto = null;
    } else {
      // El invitado le cuenta al anfitrión cuando usa un objeto
      for (const ev of sim.eventos) if (ev.t === 'usa' && ev.k === this.mio) {
        const k = sim.karts[this.mio];
        this.sala.mandar('usa', { k: this.mio, o: ev.o, atras: k.entrada.atras, adelante: k.entrada.adelante });
      }
    }
    this.t += 1 / 60;
    if (this.t < HZ) return;
    this.t = 0;
    const yoK = sim.karts[this.mio];
    if (yoK) this.sala.mandar('k', foto(yoK), { rapido: true });
    if (this.soyAnfitrion) {
      const ia = sim.karts.filter((k) => !this.dueno.has(k.i)).map(foto);
      const tipos: TipoCosa[] = ['enredadera', 'charco', 'semilla_vuela', 'brasa', 'lucero'];
      const c = sim.cosas.map((x) => [x.id, tipos.indexOf(x.tipo), Math.round(x.x * 10) / 10, Math.round(x.y * 10) / 10, Math.round(x.z * 10) / 10, Math.round(x.h * 100) / 100, Math.round(x.t * 10) / 10, x.charco ? 1 : 0]);
      let cj = 0;
      sim.cajas.forEach((x, i) => x.vuelve > 0 && (cj |= 1 << i));
      this.sala.mandar('f', { k: ia, c, cj, t: Math.round(sim.t * 100) / 100 }, { rapido: true });
      // ¿Ya llegaron todas las personas? Se cierra la carrera para todos
      if (sim.terminada && !this.finMandado) {
        this.finMandado = true;
        this.sala.mandar('fin', { orden: sim.orden, tiempos: sim.karts.map((k) => k.tiempo) });
      }
    }
  }

  private finMandado = false;

  meta(tiempo: number) {
    this.sala.mandar('meta', { k: this.mio, tiempo });
  }

  detener() {
    for (const q of this.quitar) q();
    this.quitar = [];
  }
}

