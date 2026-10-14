// La Carrera de las Tres Lunas (carreras.html): carreras tipo Mario Kart por las regiones de Astra, con carros de
// madera y fieltro tirados por criaturas. Modos: Gran Premio (las 4 pistas, puntos), carrera suelta, contrarreloj (con
// fantasma) y en línea por sala (src/carreras/red.ts). Ver docs/sistemas/carreras.md.
import './carreras.css';
import * as sonido from '../sonido';
import { cuadros } from '../segundo_plano';
import { yoMismo } from '../salas/sala';
import { caritaSvg } from '../salas/carita';
import { alAtras, guardarAparato, leerAparato, volverALaSala } from '../sueltos/comun';
import { esModoAmigo } from '../salas/perfil';
import {
  CARROS, COLORES, CRIATURAS, DIFICULTADES, LISTA_CARROS, LISTA_CRIATURAS, ORDEN_PISTAS, PISTAS, PUNTOS, VECINOS,
  type Corredor, type Dificultad, type IdCarro, type IdCriatura, type IdPista,
} from './datos';
import { CON_PAREJA, CORREDORES_PAREJA } from './pareja';
import { cargarPista } from './pista';
import { Hud, escapar, icono, tiempoTexto } from './hud';
import { Mando } from './mando';
import { PASO, Sim, type Control, type Evento } from './sim';
import { Galope, Voces, efecto } from './sonidos';
import { Vista, type Calidad } from './vista';
import { abrirEnLinea, type Red } from './red';

const params = new URLSearchParams(location.search);
/** Pruebas: la carrera corre más rápido (?rapido=4) y sin compilar todo antes (?sinprecalentar). */
const RAPIDO = Math.max(1, Math.min(8, Number(params.get('rapido')) || 1));
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

// ------------------------------------------------------------------------------------------ ajustes guardados

interface Ajustes {
  criatura: IdCriatura;
  carro: IdCarro;
  color: string;
  dificultad: Dificultad;
  aceleraSolo: boolean;
  calidad: Calidad;
}
interface Record_ {
  mejor: number;
  vuelta: number;
  fantasma?: number[];
}
interface Progreso {
  records: Partial<Record<IdPista, Record_>>;
  copas: Partial<Record<Dificultad, number>>;
}
const AMIGO = esModoAmigo();
const CLAVE_AJUSTES = AMIGO ? 'amigo-carreras-ajustes' : 'carreras-ajustes';
const CLAVE_PROGRESO = AMIGO ? 'amigo-carreras-progreso' : 'carreras-progreso';
const yo = yoMismo();
const conPareja = CON_PAREJA && yo.tipo !== 'amigo';
const miPareja = conPareja ? CORREDORES_PAREJA.find((c) => c.id === yo.tipo) : undefined;

function leerAjustes(): Ajustes {
  const a = (leerAparato(CLAVE_AJUSTES) ?? {}) as Partial<Ajustes>;
  const tactil = matchMedia('(pointer: coarse)').matches;
  return {
    criatura: a.criatura && a.criatura in CRIATURAS ? a.criatura : miPareja?.criatura ?? 'unicornio',
    carro: a.carro && a.carro in CARROS ? a.carro : miPareja?.carro ?? 'carreta',
    color: typeof a.color === 'string' && /^#[0-9a-f]{6}$/i.test(a.color) ? a.color : miPareja?.color ?? '#e4566b',
    dificultad: a.dificultad && a.dificultad in DIFICULTADES ? a.dificultad : 'carrera',
    aceleraSolo: typeof a.aceleraSolo === 'boolean' ? a.aceleraSolo : tactil,
    calidad: a.calidad === 'alta' || a.calidad === 'media' || a.calidad === 'baja' ? a.calidad : tactil ? 'media' : 'alta',
  };
}
const ajustes = leerAjustes();
const guardarAjustes = () => guardarAparato(CLAVE_AJUSTES, ajustes);
function leerProgreso(): Progreso {
  const p = (leerAparato(CLAVE_PROGRESO) ?? {}) as Partial<Progreso>;
  return { records: p.records && typeof p.records === 'object' ? p.records : {}, copas: p.copas && typeof p.copas === 'object' ? p.copas : {} };
}
const progreso = leerProgreso();
const guardarProgreso = () => guardarAparato(CLAVE_PROGRESO, progreso);

/** El corredor de quien juega en este aparato. */
export function miCorredor(): Corredor {
  return {
    id: yo.id, nombre: yo.nombre, voz: miPareja ? miPareja.voz : 'amigo', aspecto: yo.aspecto,
    criatura: ajustes.criatura, carro: ajustes.carro, color: ajustes.color,
  };
}

/** Los rivales de la máquina: la pareja (si juega uno de los dos) y los vecinos de Astra. */
export function rivales(n: number, excluir: Set<string> = new Set()): Corredor[] {
  const out: Corredor[] = [];
  if (conPareja) for (const c of CORREDORES_PAREJA) if (c.id !== yo.tipo && !excluir.has(c.id)) out.push(c);
  const vecinos = [...VECINOS].sort(() => Math.random() - 0.5);
  for (const v of vecinos) if (out.length < n && !excluir.has(v.id)) out.push(v);
  return out.slice(0, n);
}

// ------------------------------------------------------------------------------------------ página

const lienzo = $<HTMLCanvasElement>('#lienzo');
const capa = $('#capa');
const pantallas = $('#pantallas');
let vista: Vista;
let garajeVivo = false;
let bucleGaraje: { detener(): void } | null = null;

function activarSonido() {
  sonido.activar();
}
document.addEventListener('pointerdown', activarSonido, { capture: true });
document.addEventListener('keydown', activarSonido, { capture: true });

function cargaVisible(si: boolean, texto = '', f = 0) {
  const c = $('#carga');
  c.hidden = !si;
  if (texto) $('#carga-frase').textContent = texto;
  $('#carga-barra').style.width = `${Math.round(f * 100)}%`;
}

function pantalla(html: string, clase = '') {
  pantallas.innerHTML = `<section class="car-pantalla ${clase}">${html}</section>`;
  return pantallas.firstElementChild as HTMLElement;
}

function botonSonido() {
  return `<button class="car-redondo" data-sonido aria-label="Sonido">${sonido.silenciado() ? '🔇' : '🔊'}</button>`;
}
function enlazarSonido(r: HTMLElement) {
  r.querySelector('[data-sonido]')?.addEventListener('click', (e) => {
    const s = sonido.alternar();
    (e.currentTarget as HTMLElement).textContent = s ? '🔇' : '🔊';
  });
}

// ------------------------------------------------------------------------------------------ garaje y menú

function arrancarGaraje() {
  if (garajeVivo) return;
  garajeVivo = true;
  bucleGaraje?.detener();
  void vista.garaje(miCorredor());
  bucleGaraje = cuadros((dt) => {
    if (garajeVivo) vista.dibujarGaraje(dt);
  });
}
function pararGaraje() {
  garajeVivo = false;
  bucleGaraje?.detener();
  bucleGaraje = null;
}
let turnoGaraje = 0;
function refrescarGaraje() {
  const t = ++turnoGaraje;
  setTimeout(() => {
    if (t === turnoGaraje && garajeVivo) void vista.garaje(miCorredor());
  }, 120);
}

function portada() {
  arrancarGaraje();
  sonido.musica.pista('super-cancion', { bucle: true });
  const copas = Object.values(progreso.copas).reduce((a, b) => a + (b ?? 0), 0);
  const r = pantalla(`
    <div class="car-menu">
      <h1 class="car-logo"><small>La Carrera de las</small>Tres Lunas</h1>
      <p class="car-sub">${conPareja ? `¡${escapar(yo.nombre)} al volante!` : `Corre por Astra, ${escapar(yo.nombre)}`}${copas ? ` · 🏆 ${copas}` : ''}</p>
      <div class="car-opciones">
        <button class="car-boton grande" data-ir="gp">🏆 Gran Premio<small>Las 4 pistas, por puntos</small></button>
        <button class="car-boton" data-ir="suelta">🏁 Carrera suelta</button>
        <button class="car-boton" data-ir="crono">⏱️ Contrarreloj</button>
        <button class="car-boton" data-ir="linea">👥 En línea<small>Hasta 4 en una sala</small></button>
        <button class="car-boton suave" data-ir="garaje">🛠️ Mi carro y criatura</button>
      </div>
      <div class="car-fila-abajo">
        <button class="car-redondo" data-ir="volver" aria-label="Volver">⟵</button>
        <label class="car-chip">Máquina
          <select data-dif>${Object.entries(DIFICULTADES).map(([k, d]) => `<option value="${k}" ${k === ajustes.dificultad ? 'selected' : ''}>${d.nombre}</option>`).join('')}</select></label>
        <label class="car-chip"><input type="checkbox" data-solo ${ajustes.aceleraSolo ? 'checked' : ''}> Acelerar solo</label>
        ${botonSonido()}
      </div>
    </div>`, 'portada');
  enlazarSonido(r);
  r.querySelector<HTMLSelectElement>('[data-dif]')!.onchange = (e) => {
    ajustes.dificultad = (e.target as HTMLSelectElement).value as Dificultad;
    guardarAjustes();
  };
  r.querySelector<HTMLInputElement>('[data-solo]')!.onchange = (e) => {
    ajustes.aceleraSolo = (e.target as HTMLInputElement).checked;
    guardarAjustes();
  };
  r.querySelectorAll<HTMLElement>('[data-ir]').forEach((b) =>
    b.addEventListener('click', () => {
      efecto.toque();
      const ir = b.dataset.ir;
      if (ir === 'gp') void granPremio();
      else if (ir === 'suelta') escogerPista('suelta');
      else if (ir === 'crono') escogerPista('crono');
      else if (ir === 'garaje') garaje(portada);
      else if (ir === 'linea') void enLinea();
      else salir();
    }),
  );
}

function barras(c: IdCriatura) {
  const s = CRIATURAS[c].stats;
  const b = (n: string, v: number, min: number, max: number) => `<div class="car-barra"><span>${n}</span><i><b style="width:${Math.round(((v - min) / (max - min)) * 80 + 20)}%"></b></i></div>`;
  return b('Velocidad', s.vmax, 0.95, 1.05) + b('Aceleración', s.acel, 0.88, 1.2) + b('Manejo', s.giro, 0.9, 1.14) + b('Peso', s.peso, 0.7, 1.5);
}

/** Escoger criatura, carro y color (con el carro dando vueltas a la derecha). */
function garaje(luego: () => void, textoListo = 'Listo') {
  arrancarGaraje();
  const r = pantalla(`
    <div class="car-panel car-garaje">
      <h2>Mi carro</h2>
      <div class="car-seccion"><h3>Criatura</h3><div class="car-cartas" data-lista="criatura">
        ${LISTA_CRIATURAS.map((c) => `<button class="car-carta ${c.id === ajustes.criatura ? 'activa' : ''}" data-v="${c.id}"><img src="./carreras/criaturas/${c.id}.webp" alt=""><b>${c.nombre}</b><small>${c.rasgo}</small></button>`).join('')}
      </div><div class="car-barras">${barras(ajustes.criatura)}</div></div>
      <div class="car-seccion"><h3>Carro</h3><div class="car-cartas chicas" data-lista="carro">
        ${LISTA_CARROS.map((c) => `<button class="car-carta ${c.id === ajustes.carro ? 'activa' : ''}" data-v="${c.id}"><b>${c.nombre}</b></button>`).join('')}
      </div></div>
      <div class="car-seccion"><h3>Color</h3><div class="car-colores" data-lista="color">
        ${COLORES.map((c) => `<button class="car-color ${c === ajustes.color ? 'activa' : ''}" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}
      </div></div>
      <button class="car-boton grande" data-listo>${textoListo}</button>
    </div>`, 'garaje');
  r.querySelectorAll<HTMLElement>('[data-lista]').forEach((lista) =>
    lista.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-v]');
      if (!b) return;
      efecto.toque();
      lista.querySelectorAll('.activa').forEach((x) => x.classList.remove('activa'));
      b.classList.add('activa');
      const v = b.dataset.v!;
      const k = lista.dataset.lista;
      if (k === 'criatura') {
        ajustes.criatura = v as IdCriatura;
        r.querySelector('.car-barras')!.innerHTML = barras(ajustes.criatura);
      } else if (k === 'carro') ajustes.carro = v as IdCarro;
      else ajustes.color = v;
      guardarAjustes();
      refrescarGaraje();
    }),
  );
  r.querySelector('[data-listo]')!.addEventListener('click', () => {
    efecto.toque();
    luego();
  });
}

function escogerPista(modo: 'suelta' | 'crono') {
  arrancarGaraje();
  const r = pantalla(`
    <div class="car-panel car-pistas">
      <h2>${modo === 'crono' ? 'Contrarreloj' : 'Carrera suelta'}</h2>
      <div class="car-cartas pistas">
        ${ORDEN_PISTAS.map((id) => {
          const p = PISTAS[id];
          const rec = progreso.records[id];
          return `<button class="car-carta pista" data-v="${id}" style="--tarjeta:${p.tarjeta}">
            <img src="./carreras/pistas/${id}.webp" alt="">
            <b>${p.nombre}</b><small>${p.region} · ${p.lema}</small>
            ${rec ? `<em>Récord ${tiempoTexto(rec.mejor)}</em>` : ''}</button>`;
        }).join('')}
      </div>
      <div class="car-fila-abajo"><button class="car-boton suave" data-atras>⟵ Atrás</button><button class="car-boton suave" data-garaje>🛠️ Mi carro</button></div>
    </div>`, 'pistas');
  r.querySelector('[data-atras]')!.addEventListener('click', portada);
  r.querySelector('[data-garaje]')!.addEventListener('click', () => garaje(() => escogerPista(modo)));
  r.querySelectorAll<HTMLElement>('[data-v]').forEach((b) =>
    b.addEventListener('click', async () => {
      efecto.toque();
      const id = b.dataset.v as IdPista;
      if (modo === 'crono') await contrarreloj(id);
      else await carreraSuelta(id);
    }),
  );
}

function salir() {
  pararGaraje();
  sonido.musica.pista(null);
  try {
    vista?.liberar();
  } catch {
    /* ya */
  }
  volverALaSala();
}

// ------------------------------------------------------------------------------------------ la carrera

export interface Resultado {
  /** Índices de corredor en orden de llegada. */
  orden: number[];
  tiempos: number[];
  corredores: Corredor[];
  mio: number;
  mejorVuelta: number;
  salio?: boolean;
}

export interface OpcionesCarrera {
  pista: IdPista;
  corredores: { c: Corredor; control: Control; humano: boolean }[];
  mio: number;
  contrarreloj?: boolean;
  semilla?: number;
  titulo?: string;
  red?: Red;
}

let carreraViva = false;

/** Corre una carrera completa (carga, cuenta regresiva, carrera, meta) y devuelve el resultado. */
export async function correr(o: OpcionesCarrera): Promise<Resultado> {
  pararGaraje();
  carreraViva = true;
  pantallas.innerHTML = '';
  const info = PISTAS[o.pista];
  cargaVisible(true, `Preparando ${info.nombre}…`, 0.05);
  vista.vaciar();
  vista.pistaId = o.pista;
  const pista = await cargarPista(o.pista);
  await vista.cargarPista(o.pista, pista);
  cargaVisible(true, 'Enganchando las criaturas…', 0.3);
  await vista.cargarKarts(o.corredores.map((x) => x.c), (f) => cargaVisible(true, '', 0.3 + f * 0.55));
  const bot = params.has('bot');
  const vueltas = Number(params.get('vueltas')) || undefined;
  const sim = new Sim({
    pista, corredores: o.corredores,
    ia: DIFICULTADES[ajustes.dificultad].ia, semilla: o.semilla ?? (Math.random() * 1e9) | 0, contrarreloj: o.contrarreloj, vueltas,
    autoridad: o.red ? o.red.soyAnfitrion : true,
  });
  // Fantasma del contrarreloj
  const rec = progreso.records[o.pista];
  let fantasma: number[] | null = o.contrarreloj && rec?.fantasma?.length ? rec.fantasma : null;
  if (fantasma) await vista.cargarFantasma(o.corredores[o.mio].c).catch(() => (fantasma = null));
  const grabacion: number[] = [];
  let grabarT = 0;
  cargaVisible(true, 'Encendiendo las lunas…', 0.92);
  if (!params.has('sinprecalentar')) await vista.precalentar();
  if (o.red) {
    cargaVisible(true, 'Esperando a los demás…', 1);
    await o.red.esperarListos();
  }
  cargaVisible(false);
  const hud = new Hud(capa, pista);
  const mando = new Mando(capa, ajustes.aceleraSolo);
  const voces = new Voces();
  voces.neutro = !!o.red?.hayAmigos;
  voces.alDecir = (quien, texto, seg) => {
    const c = o.corredores.find((x) => x.c.voz === quien)?.c;
    hud.decir(quien === 'presentador' ? '🎙️ Presentador' : c?.nombre ?? '', texto, seg);
  };
  const vozIds = ['presentador.marcas', 'presentador.ya', 'presentador.ultima', 'presentador.ganador', `presentador.${o.pista}`,
    ...o.corredores.flatMap((x) => ['inicio', 'adelanta', 'golpe', 'objeto', 'gana'].map((m) => `${x.c.voz}.${m}`))];
  voces.precargar(vozIds);
  const galope = new Galope();
  const mio = o.mio;
  (window as unknown as { __carreras?: unknown }).__carreras = { sim, vista, hud, mio };
  sonido.musica.pista(info.musica[0], { bucle: true, rueda: info.musica, reiniciar: true });
  sonido.musica.prisa(1);
  void voces.decir(`presentador.${o.pista}`, true);
  setTimeout(() => {
    const yoK = sim.karts[mio];
    if (yoK) voces.corredor(yoK.c.voz, 'inicio');
  }, 2600);

  let pausado = false;
  let acumulado = 0;
  let dibujo = 0;
  let ultimaCuenta = 99;
  let terminoT = -1;
  let ultimaVueltaDicha = false;
  let ganadorDicho = false;
  let resolver!: (r: Resultado) => void;
  const fin = new Promise<Resultado>((r) => (resolver = r));
  const pausa = () => {
    if (o.red) {
      menuPausa(true);
      return;
    }
    pausado = !pausado;
    menuPausa(pausado);
  };
  hud.alPausa = pausa;
  mando.alPausar = pausa;
  const quitarAtras = alAtras(() => {
    pausa();
    return true;
  });
  const menuPausa = (si: boolean) => {
    const viejo = capa.querySelector('.car-pausa-menu');
    viejo?.remove();
    if (!si) return;
    const m = document.createElement('div');
    m.className = 'car-pausa-menu';
    m.innerHTML = `<div class="car-panel"><h2>Pausa</h2>
      <button class="car-boton grande" data-p="seguir">Seguir</button>
      ${o.red ? '' : '<button class="car-boton" data-p="otra">Empezar de nuevo</button>'}
      <button class="car-boton suave" data-p="salir">Salir de la carrera</button>
      <div class="car-fila-abajo">${botonSonido()}<button class="car-redondo" data-musica>${sonido.musica.apagada() ? '🎵̸' : '🎵'}</button></div></div>`;
    capa.append(m);
    enlazarSonido(m);
    m.querySelector('[data-musica]')!.addEventListener('click', (e) => ((e.currentTarget as HTMLElement).textContent = sonido.musica.alternar() ? '🎵̸' : '🎵'));
    m.addEventListener('click', (e) => {
      const p = (e.target as HTMLElement).closest<HTMLElement>('[data-p]')?.dataset.p;
      if (!p) return;
      m.remove();
      pausado = false;
      if (p === 'otra') terminar(true, true);
      else if (p === 'salir') terminar(true);
    });
  };
  let reiniciar = false;
  const terminar = (salio: boolean, otra = false) => {
    if (!carreraViva) return;
    carreraViva = false;
    reiniciar = otra;
    bucle.detener();
    quitarAtras();
    mando.liberar();
    hud.liberar();
    voces.callar();
    o.red?.detener();
    const orden = [...sim.orden];
    resolver({
      orden, tiempos: sim.karts.map((k) => k.tiempo), corredores: sim.karts.map((k) => k.c), mio,
      mejorVuelta: Math.min(...(sim.karts[mio]?.vueltas.length ? sim.karts[mio].vueltas : [Infinity])), salio: salio || undefined,
    });
  };

  const evento = (ev: Evento) => {
    vista.efecto(ev, sim, mio);
    const esMio = 'k' in ev && ev.k === mio;
    const k = 'k' in ev ? sim.karts[ev.k] : null;
    switch (ev.t) {
      case 'caja':
        if (esMio) efecto.caja();
        break;
      case 'objeto':
        if (esMio) efecto.objeto();
        break;
      case 'usa':
        if (esMio || near(ev.k)) ({ semilla: efecto.semilla, ceniza: efecto.ceniza, brasa: efecto.brasa, lucero: efecto.lucero, velo: efecto.velo, pluma: efecto.pluma, lluvia: efecto.lluvia } as Record<string, () => void>)[ev.o]?.();
        if (k && ['semilla', 'ceniza', 'brasa', 'lucero', 'lluvia'].includes(ev.o)) voces.corredor(k.c.voz, 'objeto');
        break;
      case 'turbo':
        if (esMio) efecto.turbo(ev.nivel);
        if (esMio && ev.nivel >= 3 && k?.derrape === 0) hud.avisar('¡Turbo de Aura!', 'turbo', 900);
        break;
      case 'chispas':
        if (esMio) efecto.chispas(ev.nivel);
        break;
      case 'rebufo':
        if (esMio) {
          efecto.rebufo();
          hud.avisar('¡Rebufo!', 'rebufo', 900);
        }
        break;
      case 'golpe':
        if (esMio || near(ev.k)) efecto.golpe();
        if (k) voces.corredor(k.c.voz, 'golpe');
        break;
      case 'muro':
        if (esMio) efecto.muro();
        break;
      case 'salto':
        if (esMio) {
          efecto.salto();
          hud.avisar('¡Toca DERRAPE para un truco!', 'truco', 900);
        }
        break;
      case 'truco':
        if (esMio) efecto.truco();
        break;
      case 'aterriza':
        if (esMio) efecto.aterriza();
        if (esMio && ev.truco) hud.avisar('¡Truco!', 'turbo', 800);
        break;
      case 'caida':
        if (esMio) o.pista === 'brasa' ? efecto.lava() : efecto.caida();
        if (esMio || Math.random() < 0.3) void voces.decir('presentador.caida');
        break;
      case 'lluvia':
        efecto.lluvia();
        if (ev.mojados.includes(mio)) hud.avisar('¡Lluvia de Celia!', 'lluvia', 1200);
        break;
      case 'adelanta':
        if (esMio) efecto.toque();
        if (k && Math.random() < 0.5) voces.corredor(k.c.voz, 'adelanta');
        break;
      case 'vuelta':
        if (esMio && ev.vuelta === sim.vueltasTotal && !ultimaVueltaDicha) {
          ultimaVueltaDicha = true;
          efecto.ultima();
          hud.avisar('¡Última vuelta!', 'ultima', 2200);
          void voces.decir('presentador.ultima', true);
          sonido.musica.prisa(1.08);
        } else if (esMio && ev.vuelta > 1 && ev.vuelta <= sim.vueltasTotal) {
          efecto.vuelta();
          hud.avisar(`Vuelta ${ev.vuelta} · ${tiempoTexto(ev.tiempo)}`, '', 1400);
        }
        if (esMio && ev.vuelta > 1) grabarVuelta(ev.tiempo);
        break;
      case 'meta':
        if (!ganadorDicho && ev.puesto === 1) {
          ganadorDicho = true;
          void voces.decir('presentador.ganador', true);
          if (k) setTimeout(() => voces.corredor(k.c.voz, 'gana', true), 1800);
        }
        if (esMio) {
          efecto.meta();
          hud.avisar(`¡Meta! ${ev.puesto}º`, 'meta', 3000);
          sonido.musica.remate(ev.puesto <= 3 ? 'mesa-ganar' : 'mesa-perder');
          terminoT = performance.now();
          o.red?.meta(ev.tiempo);
        }
        break;
      default:
        break;
    }
  };
  const near = (i: number) => {
    const a = sim.karts[i], b = sim.karts[mio];
    return a && b && Math.hypot(a.x - b.x, a.z - b.z) < 40;
  };
  const grabarVuelta = (t: number) => {
    const r = progreso.records[o.pista] ?? { mejor: Infinity, vuelta: Infinity };
    if (t < r.vuelta) {
      r.vuelta = t;
      progreso.records[o.pista] = r;
      guardarProgreso();
    }
  };

  o.red?.empezar(sim, mio, (ev) => evento(ev), () => terminar(true));

  const bucle = cuadros((dt, ahora) => {
    if (!carreraViva) return;
    const inicio = performance.now();
    if (!pausado) {
      const k = sim.karts[mio];
      if (k && k.control === 'local') {
        // (?bot=1: la máquina maneja el carro de quien juega, también en línea)
        if (bot) sim.pilotar(k);
        else mando.leer(k.entrada);
        if (sim.t < 0) k.entrada.acel = mando.aceleraDeVerdad() ? 1 : 0;
      }
      acumulado += dt * RAPIDO;
      let pasos = 0;
      while (acumulado >= PASO && pasos < 6 * RAPIDO) {
        sim.paso();
        acumulado -= PASO;
        pasos++;
        o.red?.paso();
        for (const ev of sim.eventos.splice(0)) evento(ev);
      }
      // Cuenta regresiva
      const c = Math.ceil(-sim.t);
      if (sim.t < 0 && c !== ultimaCuenta && c <= 3) {
        ultimaCuenta = c;
        hud.cuentaRegresiva(String(c));
        efecto.cuenta();
        if (c === 3) void voces.decir('presentador.marcas', true);
      } else if (sim.t >= 0 && ultimaCuenta !== 0) {
        ultimaCuenta = 0;
        hud.cuentaRegresiva('¡YA!');
        efecto.ya();
        void voces.decir('presentador.ya', true);
        setTimeout(() => hud.cuentaRegresiva(''), 900);
      }
      if (k) galope.actualizar(dt, k.v, k.suelo);
      // Fantasma: grabar y mover
      if (o.contrarreloj && sim.t >= 0 && k && !k.terminado) {
        grabarT += dt;
        if (grabarT >= 0.1) {
          grabarT -= 0.1;
          grabacion.push(Math.round(k.x * 10) / 10, Math.round(k.y * 10) / 10, Math.round(k.z * 10) / 10, Math.round(k.h * 100) / 100);
        }
      }
      if (fantasma && sim.t >= 0) vista.moverFantasma(fantasma, sim.t, dt);
    }
    // Dibuja a 30 cuadros por segundo como mucho
    dibujo += dt;
    if (dibujo >= 1 / 31 || pausado) {
      vista.dibujar(sim, dibujo * RAPIDO, mio);
      hud.actualizar(sim, mio, dibujo);
      dibujo = 0;
      if (vista.medir(performance.now() - inicio)) {
        ajustes.calidad = vista.calidad;
        guardarAjustes();
      }
    }
    // Después de la meta: un rato mirando y luego los resultados
    const yoK = sim.karts[mio];
    if (yoK?.terminado && terminoT > 0 && ahora - terminoT > 3200) {
      if (!o.red || sim.terminada) {
        if (!sim.terminada) sim.terminarResto();
        if (o.contrarreloj) {
          const r = progreso.records[o.pista] ?? { mejor: Infinity, vuelta: Infinity };
          if (yoK.tiempo < r.mejor) {
            r.mejor = yoK.tiempo;
            r.fantasma = grabacion;
            progreso.records[o.pista] = r;
            guardarProgreso();
            void voces.decir('presentador.record', true);
          }
        }
        terminar(false);
      }
    }
  });
  const r = await fin;
  if (reiniciar) return correr(o);
  return r;
}

// ------------------------------------------------------------------------------------------ resultados y podio

function tablaResultados(r: Resultado, puntos?: Map<string, number>, ganados?: Map<string, number>) {
  return `<ol class="car-resultados">${r.orden.map((i, idx) => {
    const c = r.corredores[i];
    const pts = puntos ? `<em>${ganados?.get(c.id) ? `+${ganados.get(c.id)}` : ''}</em><strong>${puntos.get(c.id) ?? 0}</strong>` : '';
    return `<li class="${i === r.mio ? 'yo' : ''}"><span class="pos">${idx + 1}</span>${carita(c)}<b>${escapar(c.nombre)}</b><span class="t">${tiempoTexto(r.tiempos[i])}</span>${pts}</li>`;
  }).join('')}</ol>`;
}
function carita(c: Corredor) {
  return `<span class="car-carita" style="--c:${c.color}">${caritaSvg(c.aspecto, 30, 'feliz')}</span>`;
}

async function podio(top: Corredor[], titulo: string, voces = new Voces()) {
  pantallas.innerHTML = '';
  capa.querySelectorAll('.car-hud, .car-mando').forEach((x) => x.remove());
  cargaVisible(true, 'Armando el podio…', 0.6);
  await vista.mostrarPodio(top);
  cargaVisible(false);
  sonido.musica.pista('cocina-cancion', { bucle: true, oSino: 'super-cancion' });
  void voces.decir(titulo.includes('Gran Premio') ? 'presentador.campeon' : 'presentador.podio', true);
  const r = pantalla(`<div class="car-podio-texto"><h2>${escapar(titulo)}</h2>
    <p>${top.slice(0, 3).map((c, i) => `<span>${['🥇', '🥈', '🥉'][i]} ${escapar(c.nombre)}</span>`).join('')}</p>
    <button class="car-boton grande" data-seguir>Seguir</button></div>`, 'podio');
  const bucle = cuadros((dt) => vista.dibujarPodio(dt));
  await new Promise<void>((ok) => {
    const t = setTimeout(ok, 14000);
    r.querySelector('[data-seguir]')!.addEventListener('click', () => {
      clearTimeout(t);
      ok();
    });
  });
  bucle.detener();
  voces.callar();
}

async function carreraSuelta(id: IdPista) {
  const corredores = [{ c: miCorredor(), control: 'local' as Control, humano: true }, ...rivales(7).map((c) => ({ c, control: 'ia' as Control, humano: false }))];
  // Quien juega sale de atrás (como en el original)
  const orden = [...corredores.slice(1), corredores[0]];
  const r = await correr({ pista: id, corredores: orden, mio: orden.length - 1 });
  if (r.salio) return portada();
  await mostrarResultados(r, `${PISTAS[id].nombre}`, [
    { texto: 'Otra vez', fn: () => void carreraSuelta(id) },
    { texto: 'Otra pista', fn: () => escogerPista('suelta') },
  ]);
}

async function contrarreloj(id: IdPista) {
  const r = await correr({ pista: id, corredores: [{ c: miCorredor(), control: 'local', humano: true }], mio: 0, contrarreloj: true });
  if (r.salio) return portada();
  vista.vaciar();
  const rec = progreso.records[id];
  const t = r.tiempos[0];
  const p = pantalla(`<div class="car-panel car-fin">
    <h2>Contrarreloj · ${escapar(PISTAS[id].nombre)}</h2>
    <p class="car-grande">${tiempoTexto(t)}</p>
    <p>Mejor vuelta: ${tiempoTexto(r.mejorVuelta)}</p>
    ${rec ? `<p>Récord: ${tiempoTexto(rec.mejor)}${rec.mejor >= t - 0.001 ? ' · <b>¡nuevo!</b>' : ''}</p>` : ''}
    <div class="car-fila-abajo"><button class="car-boton grande" data-otra>Otra vez (con fantasma)</button><button class="car-boton suave" data-menu>Menú</button></div></div>`, 'fin');
  p.querySelector('[data-otra]')!.addEventListener('click', () => void contrarreloj(id));
  p.querySelector('[data-menu]')!.addEventListener('click', portada);
}

async function mostrarResultados(r: Resultado, titulo: string, botones: { texto: string; fn: () => void }[], puntos?: Map<string, number>, ganados?: Map<string, number>, conPodio = true) {
  const top = r.orden.map((i) => r.corredores[i]);
  const p = pantalla(`<div class="car-panel car-fin"><h2>${escapar(titulo)}</h2>${tablaResultados(r, puntos, ganados)}
    <div class="car-fila-abajo"><button class="car-boton grande" data-seguir>${conPodio ? 'Ver el podio' : 'Seguir'}</button></div></div>`, 'fin');
  await new Promise<void>((ok) => p.querySelector('[data-seguir]')!.addEventListener('click', () => ok()));
  if (conPodio) await podio(top, titulo);
  vista.vaciar();
  arrancarGaraje();
  const q = pantalla(`<div class="car-panel car-fin"><h2>¿Y ahora?</h2>
    <div class="car-opciones">${botones.map((b, i) => `<button class="car-boton ${i ? '' : 'grande'}" data-b="${i}">${escapar(b.texto)}</button>`).join('')}
    <button class="car-boton suave" data-b="menu">Menú</button></div></div>`, 'fin');
  q.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-b]')?.dataset.b;
    if (b === undefined) return;
    efecto.toque();
    if (b === 'menu') portada();
    else botones[Number(b)].fn();
  });
}

async function granPremio() {
  const corredores = [{ c: miCorredor(), control: 'local' as Control, humano: true }, ...rivales(7).map((c) => ({ c, control: 'ia' as Control, humano: false }))];
  const puntos = new Map<string, number>(corredores.map((x) => [x.c.id, 0]));
  let orden = [...corredores.slice(1), corredores[0]];
  for (let n = 0; n < ORDEN_PISTAS.length; n++) {
    const id = ORDEN_PISTAS[n];
    const mio = orden.findIndex((x) => x.control === 'local');
    const r = await correr({ pista: id, corredores: orden, mio });
    if (r.salio) return portada();
    const ganados = new Map<string, number>();
    r.orden.forEach((i, idx) => {
      const c = r.corredores[i];
      ganados.set(c.id, PUNTOS[idx] ?? 0);
      puntos.set(c.id, (puntos.get(c.id) ?? 0) + (PUNTOS[idx] ?? 0));
    });
    // Tabla del Gran Premio (ordenada por puntos)
    const porPuntos = { ...r, orden: [...r.orden].sort((a, b) => (puntos.get(r.corredores[b].id) ?? 0) - (puntos.get(r.corredores[a].id) ?? 0)) };
    const ultima = n === ORDEN_PISTAS.length - 1;
    await new Promise<void>((ok) => {
      const p = pantalla(`<div class="car-panel car-fin"><h2>Gran Premio · ${n + 1}/4 · ${escapar(PISTAS[id].nombre)}</h2>
        ${tablaResultados(porPuntos, puntos, ganados)}
        <div class="car-fila-abajo"><button class="car-boton grande" data-seguir>${ultima ? 'Ver el podio' : `Siguiente: ${escapar(PISTAS[ORDEN_PISTAS[n + 1]].nombre)}`}</button>
        <button class="car-boton suave" data-menu>Salir</button></div></div>`, 'fin');
      p.querySelector('[data-seguir]')!.addEventListener('click', () => ok());
      p.querySelector('[data-menu]')!.addEventListener('click', () => {
        portada();
      });
    });
    if (!pantallas.querySelector('.car-fin')) return;
    // La siguiente carrera sale en orden inverso a los puntos (el líder atrás)
    orden = [...orden].sort((a, b) => (puntos.get(a.c.id) ?? 0) - (puntos.get(b.c.id) ?? 0));
    if (ultima) {
      const final = [...corredores].sort((a, b) => (puntos.get(b.c.id) ?? 0) - (puntos.get(a.c.id) ?? 0)).map((x) => x.c);
      const puesto = final.findIndex((c) => c.id === corredores[0].c.id);
      if (puesto === 0) {
        progreso.copas[ajustes.dificultad] = (progreso.copas[ajustes.dificultad] ?? 0) + 1;
        guardarProgreso();
      }
      await podio(final, `Campeones del Gran Premio`);
      vista.vaciar();
      portada();
    }
  }
}

async function enLinea() {
  pararGaraje();
  await abrirEnLinea({
    pantalla, miCorredor, rivales, ajustes: () => ajustes, garaje: (luego: () => void) => garaje(luego, 'Listo'), correr,
    resultados: (r: Resultado, titulo: string, puntos?: Map<string, number>, ganados?: Map<string, number>, conPodio?: boolean) => mostrarResultados(r, titulo, [], puntos, ganados, conPodio),
    podio, portada, vaciar: () => vista.vaciar(), arrancarGaraje,
  });
}

// ------------------------------------------------------------------------------------------ arranque

async function iniciar() {
  vista = new Vista(lienzo, ajustes.calidad);
  window.addEventListener('resize', () => vista.redimensionar());
  addEventListener('pagehide', () => {
    try {
      vista.liberar();
    } catch {
      /* ya */
    }
  });
  cargaVisible(false);
  // Fotos para las tarjetas del menú (scripts/carreras/fotos.mjs)
  const postal = params.get('postal') as IdPista | null;
  if (postal && postal in PISTAS) {
    await vista.postal(postal, await cargarPista(postal));
    document.body.dataset.foto = 'lista';
    return;
  }
  const retrato = params.get('retrato') as IdCriatura | null;
  if (retrato && retrato in CRIATURAS) {
    await vista.retrato({ ...miCorredor(), criatura: retrato });
    document.body.dataset.foto = 'lista';
    return;
  }
  if (params.has('podio')) {
    await podio([miCorredor(), ...rivales(2)], 'Camino del Pueblo del Sol');
    return portada();
  }
  const pista = params.get('pista') as IdPista | null;
  if (pista && pista in PISTAS) {
    if (params.has('crono')) await contrarreloj(pista);
    else await carreraSuelta(pista);
    return;
  }
  const unirse = params.get('unirse');
  if (unirse || params.has('sala')) {
    await enLinea();
    return;
  }
  portada();
}

void iniciar();
