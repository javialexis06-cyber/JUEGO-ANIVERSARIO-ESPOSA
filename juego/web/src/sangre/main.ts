// Sangre y Ceniza: la página. Pantalla de carga, título con el muñeco en su traje en una cripta con antorchas,
// escoger clase y especialización, bioma, peligro, mutadores y equipo del Pozo, la expedición (cuatro etapas con la
// Forja entre medio), los resultados con la ceniza y la maestría, el Pozo de las Almas, los logros, la pausa y el
// tutorial. Las partidas en grupo (hasta 4) van por `red/`.
import './sangre.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import * as sonido from '../sonido';
import * as fondo from '../segundo_plano';
import { ARMAS } from './datos/armas';
import { CLASES, nombreClase } from './datos/clases';
import { BIOMAS, MUTADORES, PELIGROS } from './datos/mundo';
import { EQUIPO, POZO, precioPozo } from './datos/botin';
import { Expedicion } from './expedicion';
import { Guardado, ponerPreferencia, preferencia } from './guardado';
import { quienSoy } from './identidad';
import { esModoAmigo } from '../salas/perfil';
import { LOGROS, aplicarDesbloqueos, revisarLogros, type DefLogro } from './logros';
import { DT, Partida } from './partida';
import { Anfitrion } from './red/anfitrion';
import { PartidaInvitado, type DatosFin } from './red/invitado';
import { MSJ, aplicarJugador, serializarJugador, type DatosJugador } from './red/protocolo';
import { esperarEnSala } from '../salas/espera';
import type { JugadorSala, Sala } from '../salas/tipos';
import {
  armasDisponibles, nivelMaestria, progresoNuevo, peligroPermitido, perfilDe, recompensaMaestria, specsDisponibles, tituloMaestria, xpMaestria, type ProgresoSangre,
} from './progreso';
import { ArmaJ, Jugador } from './sim/jugador';
import type { Sim } from './sim/sim';
import { efectos, musica, sonarSucesos } from './sonidos';
import { BIOMAS_ORDEN, CLASES_ORDEN, RANURAS_EQUIPO, type ConfigExpedicion, type IdBioma, type IdClase, type IdMutador, type PerfilJugador, type RanuraEquipo, type Stats } from './tipos';
import { Tutorial } from './tutorial';
import { VistaEleccion } from './ui/eleccion';
import { mostrarForja } from './ui/forja';
import { aviso } from './ui/hud';
import { glifo, icono, revisarRenders } from './ui/iconos';
import { Mando } from './ui/mando';
import { Escena3D, type Calidad } from './vista/escena';

const params = new URLSearchParams(location.search);
if (params.has('sinanim')) document.body.classList.add('sin-animaciones');
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const pantallas = $('pantallas');
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// ------------------------------------------------------------------------------------------------- Estado
const yo = quienSoy(params);
const guardado = new Guardado(yo);
if (params.has('prueba') || params.has('limpio')) guardado.soloAparato = true;
if (params.has('limpio')) guardado.p = progresoNuevo();
const P = () => guardado.p;

interface Seleccion {
  clase: IdClase;
  spec: number;
  bioma: IdBioma;
  peligro: number;
  mutadores: IdMutador[];
  equipo: Partial<Record<RanuraEquipo, string>>;
}
const sel: Seleccion = {
  clase: 'monarca', spec: 0, bioma: 'cementerio', peligro: 1, mutadores: [], equipo: {},
  ...(P().ultima ?? {}),
};
const corregirSeleccion = () => {
  const p = P();
  if (!p.clases.includes(sel.clase)) sel.clase = p.clases[0];
  sel.spec = Math.min(sel.spec, specsDisponibles(nivelMaestria(p.maestria[sel.clase] ?? 0).nivel) - 1);
  if (!p.biomas.includes(sel.bioma)) sel.bioma = p.biomas[0];
  sel.peligro = Math.max(1, Math.min(peligroPermitido(p), sel.peligro));
  if (sel.peligro < 3) sel.mutadores = [];
  for (const r of RANURAS_EQUIPO) if (sel.equipo[r] && !p.ofrendas.includes(sel.equipo[r]!)) delete sel.equipo[r];
};
corregirSeleccion();

function autoCalidad(): Calidad {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const nucleos = navigator.hardwareConcurrency || 4;
  const memoria = nav.deviceMemory ?? 4;
  if (Capacitor.isNativePlatform()) return nucleos >= 8 && memoria >= 6 ? 'media' : 'baja';
  return nucleos >= 8 ? 'alta' : 'media';
}
const calidadPedida = params.get('calidad');
const calidad: Calidad = calidadPedida === 'alta' || calidadPedida === 'media' || calidadPedida === 'baja' ? calidadPedida : preferencia<Calidad>('calidad', autoCalidad());

const escena = new Escena3D($('lienzo') as unknown as HTMLCanvasElement, calidad);
escena.alCambiarCalidad = (c) => {
  if (!calidadPedida) ponerPreferencia('calidad', c);
};
const mando = new Mando();
mando.alZoom = (f) => (escena.zoom = Math.max(0.7, Math.min(1.35, escena.zoom * f)));
type PartidaComun = Partida | PartidaInvitado;
let partida: PartidaComun | null = null;
/** La sala del grupo (si se juega con otros). */
let sala: Sala | null = null;
let tutorial: Tutorial | null = null;
let pantalla: 'carga' | 'titulo' | 'clases' | 'expedicion' | 'pozo' | 'logros' | 'juego' | 'forja' | 'resultado' | 'grupo' | 'sala' = 'carga';
const eleccionMenu = new VistaEleccion();

const perfilVista = () => ({ i: 0, cuerpo: yo.cuerpo, clase: sel.clase, piel: yo.piel, pelo: yo.pelo });

function pozoStats(niv: Record<string, number>) {
  const meta: Partial<Stats> = {};
  for (const d of POZO) {
    const n = niv[d.id] ?? 0;
    if (d.stat && n) meta[d.stat] = (meta[d.stat] ?? 0) + d.por * n;
  }
  return { meta, tiradas: niv.tiradas ?? 0, vetos: niv.vetos ?? 0 };
}

function perfilLocal(puesto = 0): PerfilJugador {
  return perfilDe(
    P(),
    { id: yo.id, nombre: yo.nombre, puesto, clase: sel.clase, spec: sel.spec, equipo: sel.equipo, cuerpo: yo.cuerpo, tipo: yo.tipo, piel: yo.piel, pelo: yo.pelo },
    CLASES[sel.clase].arsenal,
    pozoStats,
  );
}

// ------------------------------------------------------------------------------------------------- Carga
const FRASES = [
  'Encendiendo las antorchas…', 'Afilando la horca…', 'Contando los huesos del osario…', 'El Conde no duerme. Tú tampoco.',
  'La campana de extracción espera abajo…', 'Excava donde suene hueco.', 'Las almas azules valen poco; las rojas, mucho.',
];
function carga(si: boolean, frase?: string, avance?: number) {
  const c = $('carga');
  if (si) {
    c.classList.remove('fuera');
    c.hidden = false;
    $('carga-frase').textContent = frase ?? FRASES[Math.floor(Math.random() * FRASES.length)];
    $('carga-barra').style.width = `${Math.round((avance ?? 0.2) * 100)}%`;
  } else {
    $('carga-barra').style.width = '100%';
    c.classList.add('fuera');
    setTimeout(() => {
      if (c.classList.contains('fuera')) c.hidden = true;
    }, 550);
  }
}

// ------------------------------------------------------------------------------------------------- Campamento (fondo 3D de los menús)
let camp: { sim: Sim; bioma: IdBioma; detener: () => void } | null = null;

async function campamento() {
  const bioma: IdBioma = P().biomas.includes(sel.bioma) ? sel.bioma : 'cementerio';
  if (camp && camp.bioma === bioma) {
    await vestirCampamento();
    return;
  }
  camp?.detener();
  camp = null;
  const exp = new Expedicion({ bioma, peligro: 1, mutadores: [], semilla: 11, tutorial: true }, [perfilLocal()]);
  const sim = exp.iniciarEtapa();
  await escena.prepararEtapa(sim.mapa, BIOMAS[bioma], [perfilVista()]);
  escena.local = 0;
  escena.vitrina = { lado: 0.95, dist: 4.4 };
  const j = sim.J[0];
  j.fx = 0.2;
  j.fy = 1;
  let ultimo = 0;
  const bucle = fondo.cuadros((dt, ahora) => {
    if (ahora - ultimo < 32) return;
    const d = ultimo ? Math.min(0.1, (ahora - ultimo) / 1000) : 1 / 30;
    ultimo = ahora;
    escena.actualizar(d, sim);
    escena.dibujar();
  });
  camp = { sim, bioma, detener: () => bucle.detener() };
}

/** Cambió la clase: se viste el muñeco otra vez y se le pone el arma. */
async function vestirCampamento() {
  if (!camp) return;
  const viejo = camp.sim.J[0];
  const nj = new Jugador(0, perfilLocal());
  nj.x = viejo.x;
  nj.y = viejo.y;
  nj.fx = 0.2;
  nj.fy = 1;
  nj.armas = [new ArmaJ(CLASES[sel.clase].arsenal[0])];
  camp.sim.J[0] = nj;
  await escena.prepararMunecos([perfilVista()]);
}

function cerrarCampamento() {
  camp?.detener();
  camp = null;
  escena.vitrina = null;
}

// ------------------------------------------------------------------------------------------------- Pantallas
function cabeza(titulo: string, saldo = true) {
  return `<header class="cabeza"><button class="boton-redondo" data-a="atras" aria-label="Atrás">${glifo('atras')}</button><h2>${titulo}</h2>
    ${saldo ? `<div class="saldo"><span title="Ceniza"><span class="ico">${glifo('alma', '#c8c0b8')}</span>${P().ceniza}</span></div>` : ''}</header>`;
}

function seccion(clase: string, html: string) {
  const s = document.createElement('section');
  s.className = `pantalla ${clase}`;
  s.innerHTML = html;
  pantallas.replaceChildren(s);
  return s;
}

function titulo() {
  pantalla = 'titulo';
  musica.cambiar('menu');
  if (escena.vitrina) escena.vitrina.lado = 0.95;
  const p = P();
  const nv = nivelMaestria(p.maestria[sel.clase] ?? 0).nivel;
  const s = seccion('titulo con-fondo', `
    <h1 class="logo">Sangre <em>y</em> Ceniza</h1>
    <p class="lema">Cayó la Noche Eterna sobre Valdemora. Baja, junta lo que puedas y sal viva por la campana.</p>
    <div class="menu-titulo">
      <button class="boton boton-sangre" data-a="jugar">${glifo('espada')}Expedición</button>
      <button class="boton" data-a="grupo">${glifo('mano')}Jugar en grupo <small>hasta 4</small></button>
      <button class="boton" data-a="tutorial">${glifo('libro')}${p.tutorial ? 'Repetir el tutorial' : 'Aprender a jugar'}</button>
      <button class="boton" data-a="pozo">${glifo('caliz')}Pozo de las Almas</button>
      <button class="boton" data-a="logros">${glifo('corona')}Logros <small>${p.logros.length}/${LOGROS.length}</small></button>
      <button class="boton" data-a="salir">${glifo('atras')}Volver</button>
    </div>
    <div class="quien"><b>${esc(yo.nombre)}</b><br>${nombreClase(sel.clase, yo.cuerpo)} · ${tituloMaestria(nv)}</div>
    <div class="titulo-pie">
      <button class="boton-redondo" data-a="sonido" aria-label="Sonido">${glifo(sonido.silenciado() ? 'pausa' : 'sonido')}</button>
      <button class="boton-redondo" data-a="musica" aria-label="Música">${glifo('musica')}</button>
    </div>`);
  s.querySelector('[data-a="musica"]')!.classList.toggle('apagado', sonido.musica.apagada());
  s.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-a]')?.dataset.a;
    if (!a) return;
    efectos.boton();
    if (a === 'jugar') {
      if (!P().tutorial) return confirmar('¿Primera vez?', 'El tutorial enseña a moverse, excavar, cumplir el objetivo y salir en la campana. Toma unos tres minutos.', 'Hacer el tutorial', 'Ya sé jugar', (si) => (si ? empezarTutorial() : escogerClase()));
      escogerClase();
    } else if (a === 'grupo') grupo();
    else if (a === 'tutorial') empezarTutorial();
    else if (a === 'pozo') pozo();
    else if (a === 'logros') logros();
    else if (a === 'salir') salirDelJuego();
    else if (a === 'sonido') {
      sonido.alternar();
      titulo();
    } else if (a === 'musica') {
      sonido.musica.alternar();
      musica.despertar();
      titulo();
    }
  });
}

function escogerClase(alListo?: () => void) {
  pantalla = 'clases';
  if (escena.vitrina) escena.vitrina.lado = -0.95;
  const p = P();
  const pintar = () => {
    const c = CLASES[sel.clase];
    const xp = p.maestria[sel.clase] ?? 0;
    const m = nivelMaestria(xp);
    const nSpecs = specsDisponibles(m.nivel);
    const nArmas = armasDisponibles(m.nivel);
    const tarjetas = CLASES_ORDEN.map((k) => {
      const d = CLASES[k];
      const abierta = p.clases.includes(k);
      const mk = nivelMaestria(p.maestria[k] ?? 0);
      return `<button class="tarjeta tarjeta-clase${abierta ? '' : ' bloqueada'}${k === sel.clase ? ' elegida' : ''}" data-c="${k}" style="--c1:${d.colores[0]}">
        <span class="retrato">${retrato(k)}${abierta ? '' : `<span class="candado">${glifo('candado')}</span>`}</span>
        <span class="pie"><b>${nombreClase(k, yo.cuerpo)}</b>${abierta ? `<span class="maestria-mini"><i style="width:${mk.siguiente ? Math.round((mk.resto / mk.siguiente) * 100) : 100}%"></i></span>` : ''}</span>
      </button>`;
    }).join('');
    const abierta = p.clases.includes(sel.clase);
    const logro = c.logro ? LOGROS.find((l) => l.id === c.logro) : null;
    const specs = c.specs.map((sp, k) => `<button class="spec${k === sel.spec ? ' elegida' : ''}${k >= nSpecs ? ' bloqueada' : ''}" data-s="${k}" ${k >= nSpecs ? 'disabled' : ''}>
        <b>${sp.nombre}${k >= nSpecs ? ` · ${glifo('candado')} maestría ${k === 1 ? 1 : 3}` : ''}</b><small>${sp.desc}</small></button>`).join('');
    const arsenal = c.arsenal.map((id, k) => `<span class="arma-mini${k >= nArmas ? ' no' : ''}" title="${ARMAS[id].nombre}${k >= nArmas ? ` (maestría ${k === 2 ? 2 : 4})` : ''}">${icono(ARMAS[id].glifo, id)}</span>`).join('');
    s.innerHTML = `${cabeza('Escoge tu clase')}
      <div class="ficha">
        <div class="ficha-texto pergamino">
          <h3>${nombreClase(sel.clase, yo.cuerpo)} <small class="dificultad">${'◆'.repeat(c.dificultad)}${'◇'.repeat(3 - c.dificultad)}</small></h3>
          <p class="lema-clase">${c.lema}</p>
          ${abierta ? '' : `<p class="bloqueo">${glifo('candado')} ${logro ? `${logro.nombre}: ${logro.desc}` : 'Bloqueada'}</p>`}
          <p>${c.desc}</p>
          <h4>${c.mecanica.nombre}</h4><p>${c.mecanica.desc}</p>
          <h4>Habilidad · ${c.habilidad.nombre} <small>(${c.habilidad.recarga} s)</small></h4><p>${c.habilidad.desc}</p>
          <h4>Arsenal</h4><div class="arsenal">${arsenal}</div>
          <h4>Especialización</h4><div class="specs">${specs}</div>
          <h4>Maestría ${m.nivel} · ${tituloMaestria(m.nivel)}</h4>
          <div class="barra barra-maestria"><i style="width:${m.siguiente ? Math.round((m.resto / m.siguiente) * 100) : 100}%"></i></div>
          <small>${m.siguiente ? `Siguiente: ${recompensaMaestria(m.nivel + 1)} (${m.resto}/${xpMaestria(m.nivel)})` : 'Maestría completa.'}</small>
        </div>
        <div class="ficha-vacia"></div>
      </div>
      <div class="carrusel carrusel-clases">${tarjetas}</div>
      <div class="pie-clases"><button class="boton boton-sangre" data-a="seguir" ${abierta ? '' : 'disabled'}>${glifo('espada')}Seguir</button></div>`;
    s.querySelector('.carrusel-clases .elegida')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  };
  const s = seccion('pantalla-clases con-fondo', '');
  pintar();
  s.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const c = t.closest<HTMLElement>('[data-c]')?.dataset.c as IdClase | undefined;
    const sp = t.closest<HTMLElement>('[data-s]')?.dataset.s;
    const a = t.closest<HTMLElement>('[data-a]')?.dataset.a;
    if (c) {
      efectos.carta();
      if (c !== sel.clase) {
        sel.clase = c;
        sel.spec = 0;
        void vestirCampamento();
      }
      pintar();
    } else if (sp !== undefined) {
      efectos.boton();
      sel.spec = Number(sp);
      pintar();
    } else if (a === 'seguir') {
      efectos.boton();
      if (alListo) alListo();
      else escogerExpedicion();
    } else if (a === 'atras') {
      efectos.boton();
      if (alListo) alListo();
      else titulo();
    }
  });
}

function retrato(k: IdClase) {
  const d = CLASES[k];
  return `<img src="./sangre/retratos/${k}_${yo.cuerpo}.webp" alt="" onerror="this.remove()">${glifo(d.glifo)}`;
}

function escogerExpedicion(alListo?: () => void) {
  pantalla = 'expedicion';
  if (escena.vitrina) escena.vitrina.lado = -1.25;
  const p = P();
  const s = seccion('pantalla-expedicion con-fondo', '');
  const pintar = () => {
    const max = peligroPermitido(p);
    const biomas = BIOMAS_ORDEN.map((b) => {
      const d = BIOMAS[b];
      const abierto = p.biomas.includes(b);
      const ganado = p.ganado[b] ?? 0;
      return `<button class="tarjeta tarjeta-bioma${abierto ? '' : ' bloqueada'}${b === sel.bioma ? ' elegida' : ''}" data-b="${b}" style="--c1:${d.color}" ${abierto ? '' : ''}>
        <span class="ico">${glifo(abierto ? d.glifo : 'candado')}</span><b>${d.nombre}</b><small>${abierto ? d.desc : desbloqueoBioma(b)}</small>
        ${ganado ? `<small class="ganado">${glifo('corona')} ganado en peligro ${ganado}</small>` : ''}</button>`;
    }).join('');
    const peligros = PELIGROS.map((g) => `<button class="peligro${g.n === sel.peligro ? ' elegido' : ''}${g.n > max ? ' bloqueado' : ''}" data-p="${g.n}" ${g.n > max ? 'disabled' : ''} title="${g.nombre}">${g.n}</button>`).join('');
    const pel = PELIGROS[sel.peligro - 1];
    const mutadores = sel.peligro >= 3
      ? (Object.keys(MUTADORES) as IdMutador[]).map((m) => `<button class="mutador${sel.mutadores.includes(m) ? ' si' : ''}" data-m="${m}" title="${MUTADORES[m].desc}"><span class="ico">${glifo(MUTADORES[m].glifo)}</span>${MUTADORES[m].nombre}</button>`).join('')
      : '<small>Desde el peligro 3 se pueden poner mutadores (más difícil, más ceniza).</small>';
    const equipo = RANURAS_EQUIPO.map((r) => {
      const id = sel.equipo[r];
      const hay = p.ofrendas.filter((o) => EQUIPO[o]?.ranura === r).length;
      return `<button class="ranura-equipo${id ? ' si' : ''}" data-r="${r}" ${hay ? '' : 'disabled'} title="${id ? EQUIPO[id].desc : hay ? 'Toca para escoger' : 'Ofrece equipo al Pozo para usarlo aquí'}"><span class="ico">${glifo(r)}</span><small>${id ? EQUIPO[id].nombre : hay ? 'Nada' : '—'}</small></button>`;
    }).join('');
    const extra = sel.mutadores.reduce((x, m) => x + MUTADORES[m].recompensa, 0);
    s.innerHTML = `${cabeza('La expedición')}
      <div class="carrusel carrusel-biomas">${biomas}</div>
      <div class="opciones-exp placa">
        <div class="fila"><span class="etiqueta">Peligro</span><div class="peligros">${peligros}</div><span class="desc-peligro"><b>${pel.nombre}</b> · ${pel.desc} <em>×${(pel.recompensa * (1 + extra)).toFixed(2)} de ceniza</em></span></div>
        <div class="fila"><span class="etiqueta">Mutadores</span><div class="mutadores">${mutadores}</div></div>
        <div class="fila"><span class="etiqueta">Equipo</span><div class="equipo-pozo">${equipo}</div></div>
      </div>
      <div class="pie-clases"><span class="resumen-sel">${nombreClase(sel.clase, yo.cuerpo)} · ${CLASES[sel.clase].specs[sel.spec].nombre}</span><button class="boton boton-sangre boton-grande" data-a="empezar">${glifo('antorcha')}Bajar</button></div>`;
    s.querySelector('.carrusel-biomas .elegida')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  };
  pintar();
  s.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const b = t.closest<HTMLElement>('[data-b]')?.dataset.b as IdBioma | undefined;
    const pg = t.closest<HTMLElement>('[data-p]')?.dataset.p;
    const m = t.closest<HTMLElement>('[data-m]')?.dataset.m as IdMutador | undefined;
    const r = t.closest<HTMLElement>('[data-r]')?.dataset.r as RanuraEquipo | undefined;
    const a = t.closest<HTMLElement>('[data-a]')?.dataset.a;
    if (b) {
      efectos.carta();
      if (!p.biomas.includes(b)) return aviso(desbloqueoBioma(b), '', 2200);
      if (b !== sel.bioma) {
        sel.bioma = b;
        void campamento();
      }
    } else if (pg) {
      efectos.boton();
      sel.peligro = Number(pg);
      if (sel.peligro < 3) sel.mutadores = [];
    } else if (m) {
      efectos.boton();
      sel.mutadores = sel.mutadores.includes(m) ? sel.mutadores.filter((x) => x !== m) : [...sel.mutadores, m];
    } else if (r) {
      efectos.boton();
      const lista = [undefined, ...p.ofrendas.filter((o) => EQUIPO[o]?.ranura === r)];
      const k = lista.indexOf(sel.equipo[r]);
      const sig = lista[(k + 1) % lista.length];
      if (sig) sel.equipo[r] = sig;
      else delete sel.equipo[r];
    } else if (a === 'empezar') {
      efectos.boton();
      guardarUltima();
      if (alListo) return alListo();
      const cfg: ConfigExpedicion = { bioma: sel.bioma, peligro: sel.peligro, mutadores: [...sel.mutadores], semilla: semilla() };
      void empezar(cfg, [perfilLocal()], 0);
      return;
    } else if (a === 'atras') {
      efectos.boton();
      if (alListo) return alListo();
      escogerClase();
      return;
    } else return;
    pintar();
  });
}

function desbloqueoBioma(b: IdBioma) {
  if (b === 'minas') return 'Gana una expedición en el Cementerio Hundido.';
  if (b === 'abadia') return 'Gana una expedición en Las Catacumbas.';
  if (b === 'castillo') return 'Gana en Las Minas de Sangre y en La Abadía en Llamas.';
  return '';
}

const semilla = () => (params.get('semilla') ? Number(params.get('semilla')) : Math.floor(Math.random() * 1e9));

function guardarUltima() {
  P().ultima = { clase: sel.clase, spec: sel.spec, bioma: sel.bioma, peligro: sel.peligro, mutadores: [...sel.mutadores], equipo: { ...sel.equipo } };
  guardado.guardar();
}

function pozo() {
  pantalla = 'pozo';
  const p = P();
  const s = seccion('pantalla-pozo opaca', '');
  const pintar = () => {
    const mejoras = POZO.map((d) => {
      const n = p.pozo[d.id] ?? 0;
      const precio = precioPozo(d, n);
      const max = n >= d.max;
      return `<button class="renglon${max ? ' hecho' : ''}${!max && p.ceniza < precio ? ' no' : ''}" data-z="${d.id}" ${max ? 'disabled' : ''}>
        <span class="ico">${glifo(d.glifo)}</span><span><b>${d.nombre}</b><small>${d.desc}</small><span class="puntitos">${Array.from({ length: d.max }, (_, k) => `<i class="${k < n ? 'si' : ''}"></i>`).join('')}</span></span>
        <span class="nivel">${max ? 'Completo' : `${glifo('alma')} ${precio}`}</span></button>`;
    }).join('');
    const ofrendas = p.ofrendas.length
      ? p.ofrendas.filter((o) => EQUIPO[o]).map((o) => `<div class="renglon hecho"><span class="ico">${glifo(EQUIPO[o].ranura)}</span><span><b>${EQUIPO[o].nombre}</b><small>${EQUIPO[o].desc}</small></span></div>`).join('')
      : '<small class="vacio">Al terminar una expedición puedes ofrecer al Pozo una pieza del equipo que llevabas: queda tuya para siempre y la escoges antes de bajar.</small>';
    s.innerHTML = `${cabeza('El Pozo de las Almas')}
      <p class="sub-pozo">La ceniza de cada expedición alimenta el Pozo. Lo que compres aquí te acompaña en todas las clases.</p>
      <div class="lista">${mejoras}</div>
      <h3 class="titulo-grabado">Ofrendas</h3>
      <div class="lista lista-ofrendas">${ofrendas}</div>`;
  };
  pintar();
  s.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const z = t.closest<HTMLElement>('[data-z]')?.dataset.z;
    const a = t.closest<HTMLElement>('[data-a]')?.dataset.a;
    if (a === 'atras') {
      efectos.boton();
      return titulo();
    }
    if (!z) return;
    const d = POZO.find((x) => x.id === z)!;
    const n = p.pozo[z] ?? 0;
    const precio = precioPozo(d, n);
    if (n >= d.max) return;
    if (p.ceniza < precio) {
      aviso('Te falta ceniza: baja otra vez.', 'peligro', 1600);
      return;
    }
    p.ceniza -= precio;
    p.pozo[z] = n + 1;
    guardado.guardar();
    efectos.compra();
    pintar();
  });
}

function logros() {
  pantalla = 'logros';
  const p = P();
  const s = seccion('pantalla-logros opaca', `${cabeza(`Logros · ${p.logros.length} de ${LOGROS.length}`)}
    <div class="lista">${LOGROS.map((l) => {
      const hecho = p.logros.includes(l.id);
      const av = !hecho && l.avance ? l.avance(p) : 0;
      return `<div class="renglon${hecho ? ' hecho' : ' no'}"><span class="ico">${glifo(l.glifo)}</span><span><b>${l.nombre}</b><small>${l.desc}${l.premio ? ` <em>${l.premio}.</em>` : ''}</small>
        ${av ? `<span class="barra barra-logro"><i style="width:${Math.round(av * 100)}%"></i></span>` : ''}</span><span class="nivel">${hecho ? glifo('corona') : `+${l.ceniza}`}</span></div>`;
    }).join('')}</div>`);
  s.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-a="atras"]')) {
      efectos.boton();
      titulo();
    }
  });
}

// ------------------------------------------------------------------------------------------------- Hojas (pausa, confirmar)
function hoja(html: string, clase = '') {
  const h = document.createElement('div');
  h.className = 'hoja';
  h.innerHTML = `<div class="hoja-carta pergamino ${clase}">${html}</div>`;
  $('hojas').append(h);
  return h;
}

function confirmar(tituloH: string, texto: string, si: string, no: string, fn: (si: boolean) => void) {
  const h = hoja(`<h2>${tituloH}</h2><p>${texto}</p><div class="fila-botones"><button class="boton" data-r="no">${no}</button><button class="boton boton-sangre" data-r="si">${si}</button></div>`);
  h.addEventListener('click', (e) => {
    const r = (e.target as HTMLElement).closest<HTMLElement>('[data-r]')?.dataset.r;
    if (!r) return;
    efectos.boton();
    h.remove();
    fn(r === 'si');
  });
}

let hojaPausa: HTMLElement | null = null;
function pausa() {
  if (!partida || hojaPausa) return;
  const pt = partida;
  const solo = pt.o.perfiles.length === 1;
  pt.pausar(solo);
  if (!solo) pt.hud.tenue(true);
  const pintar = () => {
    const j = pt.local;
    hojaPausa!.querySelector('.hoja-carta')!.innerHTML = `<h2>Pausa</h2>
      ${j ? `<p class="centro">${nombreClase(j.clase, j.cuerpo)} · nivel ${j.nivel} · etapa ${pt.exp.etapa} de ${pt.exp.cfg.tutorial ? 1 : 4}${solo ? '' : ' · <em>el juego sigue para los demás</em>'}</p>` : ''}
      <div class="menu-pausa">
        <button class="boton boton-sangre" data-p="seguir">${glifo('espada')}Seguir</button>
        <div class="fila"><span class="etiqueta">Calidad</span>${(['baja', 'media', 'alta'] as Calidad[]).map((c) => `<button class="boton boton-chico${escena.calidad === c ? ' boton-oro' : ''}" data-c="${c}">${c[0].toUpperCase() + c.slice(1)}</button>`).join('')}</div>
        <div class="fila"><button class="boton boton-chico" data-p="sonido">${glifo('sonido')}Sonido: ${sonido.silenciado() ? 'no' : 'sí'}</button><button class="boton boton-chico" data-p="musica">${glifo('musica')}Música: ${sonido.musica.apagada() ? 'no' : 'sí'}</button></div>
        <button class="boton" data-p="abandonar">${glifo('atras')}Abandonar la expedición</button>
      </div>`;
  };
  hojaPausa = hoja('', 'hoja-pausa');
  pintar();
  hojaPausa.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const c = t.closest<HTMLElement>('[data-c]')?.dataset.c as Calidad | undefined;
    const a = t.closest<HTMLElement>('[data-p]')?.dataset.p;
    if (e.target === hojaPausa) return cerrarPausa();
    if (c) {
      escena.ponerCalidad(c);
      ponerPreferencia('calidad', c);
      pintar();
    } else if (a === 'seguir') cerrarPausa();
    else if (a === 'sonido') {
      sonido.alternar();
      pintar();
    } else if (a === 'musica') {
      sonido.musica.alternar();
      musica.despertar();
      pintar();
    } else if (a === 'abandonar') {
      confirmar('¿Abandonar?', 'Se pierde lo de esta expedición (la ceniza y la maestría que ya ganaste en etapas anteriores sí quedan).', 'Abandonar', 'Seguir jugando', (si) => {
        if (!si) return;
        cerrarPausa();
        abandonar();
      });
    }
  });
}
function cerrarPausa() {
  hojaPausa?.remove();
  hojaPausa = null;
  if (partida && !partida.terminada) {
    partida.pausar(false);
    partida.hud.tenue(false);
  }
}

// ------------------------------------------------------------------------------------------------- La expedición
async function empezar(cfg: ConfigExpedicion, perfiles: PerfilJugador[], local: number, extra: { bots?: number[]; sala?: Sala } = {}) {
  pantalla = 'juego';
  carga(true, undefined, 0.15);
  pantallas.replaceChildren();
  cerrarCampamento();
  musica.cambiar('juego');
  const bots = [...(extra.bots ?? [])];
  if (params.has('bot') && !bots.includes(local)) bots.push(local);
  const pt: Partida = new Partida({
    cfg, perfiles, local, escena, mando, bots,
    rapido: Math.max(1, Number(params.get('rapido')) || 1),
    nombre: (i): string => perfiles[i]?.nombre ?? `Jugador ${i + 1}`,
    alForja: (p, seguir) => abrirForja(p, seguir),
    alTerminar: (p) => terminar(p),
    alPausa: () => pausa(),
    alSucesos: (suc, sim) => {
      sonarSucesos(suc, sim, local);
      const j = sim.J[local];
      if (j) musica.tension = Math.min(1, sim.E.vivos / 160 + (sim.fase !== 'juego' ? 0.4 : 0));
    },
    alCuadro: (p, dt) => {
      tutorial?.cuadro(p, dt);
      red?.cuadro(p, dt);
    },
    alPaso: (sim) => red?.anf.alPaso(sim, DT),
    alEtapa: (_p, sim) => red?.etapa(sim),
    alFinEtapa: (p) => red?.finEtapa(p),
  });
  const red = extra.sala ? redAnfitrion(extra.sala, pt, perfiles, local) : null;
  partida = pt;
  mando.alPausar = atras;
  try {
    await pt.empezar();
  } catch (e) {
    console.error(e);
    aviso('No se pudo armar el mapa. Intenta otra vez.', 'peligro', 3000);
  }
  carga(false);
  tutorial?.alEmpezar(pt);
}

function abrirForja(p: PartidaComun, seguir: () => void, esperando?: () => string | null) {
  pantalla = 'forja';
  const j = p.exp.J[p.o.local];
  const sim = p.exp.sim!;
  if (j.estado === 3 || j.estado === 0) {
    efectos.campana();
  }
  const f = mostrarForja({
    exp: p.exp, j, sim, eleccion: p.eleccion, esperando,
    pista: tutorial ? tutorial.pistaForja() : undefined,
    alListo: () => {
      if (esperando?.()) {
        // En grupo: se queda en la Forja hasta que todos estén
        const revisar = setInterval(() => {
          f.refrescar();
          if (esperando()) return;
          clearInterval(revisar);
          f.cerrar();
          pantalla = 'juego';
          seguir();
        }, 400);
        return;
      }
      f.cerrar();
      pantalla = 'juego';
      if (!(p instanceof PartidaInvitado)) carga(true, `Etapa ${p.exp.etapa + 1}…`, 0.3);
      seguir();
      if (!(p instanceof PartidaInvitado)) setTimeout(() => carga(false), 400);
    },
  });
  forjaAbierta = f;
}

let forjaAbierta: { cerrar(): void; refrescar(): void } | null = null;

function abandonar(motivo?: string) {
  if (!partida) return;
  const p = partida;
  p.terminada = true;
  p.liberar();
  partida = null;
  forjaAbierta?.cerrar();
  forjaAbierta = null;
  tutorial?.cerrar();
  tutorial = null;
  quitarRed();
  // Lo de las etapas ya extraídas sí cuenta
  if (p.exp.resultados.some((r) => r.fin.exito)) cobrar(p, false);
  if (motivo) aviso(motivo, 'peligro', 3500);
  if (sala) {
    sala.mandar(MSJ.SALIR, {});
    void volverALaSala();
  } else void volverAlMenu();
}

interface Cobro {
  ceniza: number;
  maestria: number;
  subio: number[];
  logros: DefLogro[];
  monedas: number;
  clasesNuevas: IdClase[];
  biomasNuevos: IdBioma[];
}

/** Lo que se gana al terminar (ceniza, maestría, logros, cifras, monedas de la casa). */
function cobrar(p: PartidaComun, exito: boolean): Cobro {
  const pr = P();
  const j = p.exp.J[p.o.local];
  const antes = { clases: [...pr.clases], biomas: [...pr.biomas] };
  const r = p.exp.recompensa(j);
  const nvAntes = nivelMaestria(pr.maestria[j.clase] ?? 0).nivel;
  pr.ceniza += r.ceniza;
  pr.cenizaTotal += r.ceniza;
  pr.maestria[j.clase] = (pr.maestria[j.clase] ?? 0) + r.maestria;
  const nvDespues = nivelMaestria(pr.maestria[j.clase]!).nivel;
  const c = pr.cifras;
  const rs = j.resumen;
  if (!p.exp.cfg.tutorial) c.expediciones++;
  if (exito && !p.exp.cfg.tutorial) c.victorias++;
  c.etapas += r.etapas;
  c.muertes += rs.muertes;
  c.elites += rs.elites;
  c.excavadas += rs.excavadas;
  c.oro += rs.oro;
  c.almas += rs.almas;
  c.frascos += rs.frascos;
  c.altares += rs.altares;
  c.prisioneros += rs.prisioneros;
  c.bendiciones += rs.bendiciones;
  c.ejecuciones += rs.ejecuciones;
  c.levantados += rs.levantados;
  c.caidas += rs.caidas;
  c.nivelMax = Math.max(c.nivelMax, j.nivel);
  c.segundos += Math.round(p.exp.tiempo);
  if (p.o.perfiles.length > 1) c.enGrupo++;
  if (exito && !p.exp.cfg.tutorial) pr.ganado[p.exp.cfg.bioma] = Math.max(pr.ganado[p.exp.cfg.bioma] ?? 0, p.exp.cfg.peligro);
  if (p.exp.cfg.tutorial) pr.tutorial = true;
  const nuevos = p.exp.cfg.tutorial ? [] : revisarLogros({ p: pr, exp: p.exp, j, exito, jugadores: p.o.perfiles.length });
  aplicarDesbloqueos(pr);
  // Monedas de la casa (escasas): una por etapa extraída y un poquito más por ganar
  const monedas = p.exp.cfg.tutorial ? 0 : r.etapas + (exito ? 2 + Math.max(0, p.exp.cfg.peligro - 2) : 0);
  guardado.pagarCasa(monedas);
  guardado.guardar();
  return {
    ceniza: r.ceniza, maestria: r.maestria, subio: Array.from({ length: nvDespues - nvAntes }, (_, k) => nvAntes + k + 1), logros: nuevos,
    monedas: yo.tipo === 'amigo' ? 0 : monedas, clasesNuevas: pr.clases.filter((k) => !antes.clases.includes(k)), biomasNuevos: pr.biomas.filter((b) => !antes.biomas.includes(b)),
  };
}

function terminar(p: PartidaComun) {
  const exito = p.exp.exito;
  if (p.exp.cfg.tutorial && tutorial) {
    // El tutorial termina mostrando la Forja de mentiras y luego los resultados
    if (exito) {
      p.exp.fase = 'forja';
      p.exp.forja.clear();
      const j = p.exp.J[p.o.local];
      j.oroSeguro = Math.max(j.oroSeguro, 60);
      j.hierroSeguro = Math.max(j.hierroSeguro, 12);
      j.sangreSeguro = Math.max(j.sangreSeguro, 8);
      p.exp.forja.set(j.i, { ofertas: p.exp.ofertasNuevas(j), renovaciones: 0, sangreUsada: {}, listo: false });
      abrirForja(p, () => {
        tutorial?.cerrar();
        tutorial = null;
        const cb = cobrar(p, true);
        resultados(p, cb, true);
      });
      return;
    }
    tutorial.cerrar();
    tutorial = null;
  }
  const cb = cobrar(p, exito);
  if (exito) efectos.victoria();
  else efectos.derrota();
  resultados(p, cb, exito);
}

function resultados(p: PartidaComun, cb: Cobro, exito: boolean) {
  pantalla = 'resultado';
  musica.cambiar('menu');
  const j = p.exp.J[p.o.local];
  const pr = P();
  const rs = j.resumen;
  const min = Math.floor(p.exp.tiempo / 60), seg = Math.round(p.exp.tiempo % 60);
  const ofrecibles = exito ? p.exp.ofrendas(j).filter((o) => !pr.ofrendas.includes(o)) : [];
  let ofrecida = false;
  const s = seccion('pantalla-resultado opaca', '');
  const pintar = () => {
    s.innerHTML = `<header class="cabeza"><h2 class="${exito ? 'gano' : 'perdio'}">${p.exp.cfg.tutorial ? 'Tutorial completo' : exito ? `Sobreviviste a la noche` : 'La noche te consumió'}</h2></header>
      <div class="resultado">
        <div class="pergamino ficha-texto">
          <h3>${esc(j.nombre)} · ${nombreClase(j.clase, j.cuerpo)}</h3>
          <p class="lema-clase">${BIOMAS[p.exp.cfg.bioma].nombre} · peligro ${p.exp.cfg.peligro} · ${p.exp.resultados.filter((r) => r.fin.exito).length} de ${p.exp.cfg.tutorial ? 1 : 4} etapas</p>
          <div class="cifras">
            <span>Tiempo</span><b>${min}:${String(seg).padStart(2, '0')}</b>
            <span>Nivel</span><b>${j.nivel}</b>
            <span>Enemigos</span><b>${rs.muertes}</b>
            <span>Élites</span><b>${rs.elites}</b>
            <span>Daño</span><b>${Math.round(rs.dano).toLocaleString('es-CO')}</b>
            <span>Oro</span><b>${rs.oro}</b>
            <span>Roca excavada</span><b>${rs.excavadas}</b>
            <span>Caídas</span><b>${rs.caidas}</b>
          </div>
          <div class="arsenal">${j.armas.map((a) => `<span class="arma-mini" title="${a.def.nombre} · nivel ${a.nivel}">${icono(a.def.glifo, a.def.id)}</span>`).join('')}</div>
        </div>
        <div class="placa premios">
          <div class="premio"><span>${glifo('alma', '#d8d0c8')}+${cb.ceniza} ceniza</span><span>${glifo('corona', '#f0d488')}+${cb.maestria} maestría</span>${cb.monedas ? `<span>${glifo('oro', '#f0d488')}+${cb.monedas} moneda${cb.monedas > 1 ? 's' : ''} de la casa</span>` : ''}</div>
          ${cb.subio.map((n) => `<div class="desbloqueo">Maestría ${n} de ${nombreClase(j.clase, j.cuerpo)}: ${recompensaMaestria(n)}</div>`).join('')}
          ${cb.clasesNuevas.map((k) => `<div class="desbloqueo">${glifo(CLASES[k].glifo)} Nueva clase: ${nombreClase(k, yo.cuerpo)}</div>`).join('')}
          ${cb.biomasNuevos.map((b) => `<div class="desbloqueo">${glifo(BIOMAS[b].glifo)} Nuevo bioma: ${BIOMAS[b].nombre}</div>`).join('')}
          ${cb.logros.map((l) => `<div class="desbloqueo">${glifo(l.glifo)} Logro: <b>${l.nombre}</b> (+${l.ceniza} ceniza)${l.premio ? ` · ${l.premio}` : ''}</div>`).join('')}
          ${ofrecibles.length && !ofrecida ? `<h3 class="titulo-grabado">Ofrecer al Pozo (una)</h3><div class="ofrendas">${ofrecibles.map((o) => `<button class="boton boton-chico" data-o="${o}" title="${EQUIPO[o].desc}">${glifo(EQUIPO[o].ranura)}${EQUIPO[o].nombre}</button>`).join('')}</div>` : ''}
        </div>
      </div>
      <footer class="fila-botones">${sala ? `<button class="boton boton-sangre" data-a="sala">${glifo('mano')}Volver a la sala</button>` : `<button class="boton" data-a="menu">${glifo('atras')}Menú</button>${p.exp.cfg.tutorial ? '' : `<button class="boton boton-sangre" data-a="otra">${glifo('espada')}Otra expedición</button>`}`}</footer>`;
  };
  pintar();
  s.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const o = t.closest<HTMLElement>('[data-o]')?.dataset.o;
    const a = t.closest<HTMLElement>('[data-a]')?.dataset.a;
    if (o && !ofrecida) {
      ofrecida = true;
      pr.ofrendas.push(o);
      guardado.guardar();
      efectos.campana();
      aviso(`${EQUIPO[o].nombre} queda en el Pozo para siempre.`, '', 2200);
      pintar();
    } else if (a === 'menu' || a === 'otra' || a === 'sala') {
      efectos.boton();
      p.liberar();
      partida = null;
      quitarRed();
      if (a === 'sala') void volverALaSala();
      else if (a === 'otra') {
        corregirSeleccion();
        void empezar({ bioma: sel.bioma, peligro: sel.peligro, mutadores: [...sel.mutadores], semilla: semilla() }, [perfilLocal()], 0);
      } else void volverAlMenu(p.exp.cfg.tutorial ? 'clases' : 'titulo');
    }
  });
}

async function volverAlMenu(a: 'titulo' | 'clases' | 'nada' = 'titulo') {
  pantalla = 'carga';
  carga(true, 'Subiendo a la superficie…', 0.5);
  pantallas.replaceChildren();
  corregirSeleccion();
  await campamento();
  carga(false);
  if (a === 'clases') escogerClase();
  else if (a === 'titulo') titulo();
}


// ------------------------------------------------------------------------------------------------- En grupo (hasta 4)
let quitarSala: (() => void)[] = [];
function quitarRed() {
  for (const q of quitarSala) q();
  quitarSala = [];
  document.querySelector('.pausa-red')?.remove();
}

/** Aviso grande de conexión cortada (el anfitrión pausa a todos). */
function avisoRed(texto: string | null) {
  let el = document.querySelector<HTMLElement>('.pausa-red');
  if (!texto) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('div');
    el.className = 'pausa-red placa';
    document.body.append(el);
  }
  el.innerHTML = `<b>${glifo('reloj')}Pausa</b><span>${esc(texto)}</span>`;
}

/** Lo del anfitrión: fotos, cartas de cada uno, etapas y la Forja de todos. */
function redAnfitrion(s: Sala, pt: Partida, perfiles: PerfilJugador[], local: number) {
  const anf = new Anfitrion(s, perfiles.map((x) => x.id), local);
  const forjaLista = new Set<string>();
  let esperandoT = 0;
  let cortados = new Set<string>();
  const nombreDe = (id: string) => perfiles.find((x) => x.id === id)?.nombre ?? 'alguien';
  quitarSala.push(
    () => anf.liberar(),
    s.al(MSJ.FORJA_LISTA, (d, de) => {
      const x = d as { etapa: number; j: DatosJugador };
      const i = perfiles.findIndex((q) => q.id === de.id);
      if (i < 0 || x.etapa !== pt.exp.etapa) return;
      aplicarJugador(pt.exp.J[i], x.j);
      forjaLista.add(de.id);
      forjaAbierta?.refrescar();
    }),
    s.alCorte((cortado, quien) => {
      if (cortado) cortados.add(quien.id);
      else cortados.delete(quien.id);
      pt.pausaExterna = cortados.size > 0;
      avisoRed(cortados.size ? `Se cortó la conexión de ${[...cortados].map(nombreDe).join(' y ')}. Esperando a que vuelva…` : null);
    }),
    s.alCambiar((js) => {
      // El que se fue del todo queda afuera de la expedición (no se queda quieto para que lo maten)
      const sim = pt.sim;
      perfiles.forEach((pf, i) => {
        if (i === local || js.some((j) => j.id === pf.id)) return;
        cortados.delete(pf.id);
        forjaLista.add(pf.id);
        if (sim?.J[i] && sim.J[i].estado !== 3) sim.J[i].estado = 2;
      });
      pt.pausaExterna = cortados.size > 0;
      if (!cortados.size) avisoRed(null);
    }),
  );
  return {
    anf,
    etapa(sim: Sim) {
      anf.nuevaEtapa(sim);
      forjaLista.clear();
      esperandoT = 0;
      pt.pausaExterna = true;
    },
    cuadro(p: Partida, dt: number) {
      const sim = p.sim;
      if (!sim) return;
      // Al empezar cada etapa se espera a que todos la tengan armada (máximo 25 s)
      if (esperandoT >= 0) {
        esperandoT += dt;
        const faltan = anf.faltan.filter((i) => s.jugadores.some((j) => j.id === perfiles[i].id));
        if (!faltan.length || esperandoT > 25) {
          esperandoT = -1;
          if (!cortados.size) pt.pausaExterna = false;
          avisoRed(null);
        } else if (esperandoT > 2) avisoRed(`Esperando a que ${faltan.map((i) => perfiles[i].nombre).join(' y ')} termine de bajar…`);
      }
      anf.alCuadro(sim, dt);
    },
    finEtapa(p: Partida) {
      const exp = p.exp;
      const d: DatosFin = { etapa: exp.etapa, fase: exp.fase, exito: exp.exito, J: exp.J.map((j) => serializarJugador(j)), resultados: exp.resultados, tiempo: exp.tiempo };
      s.mandar(MSJ.FIN_ETAPA, d);
      if (exp.fase === 'forja') {
        // La Forja del anfitrión espera a que todos estén listos
        const original = p.o.alForja;
        p.o.alForja = (pp, seguir) => {
          p.o.alForja = original;
          abrirForja(pp, seguir, () => {
            const faltan = perfiles.filter((pf, i) => i !== local && s.jugadores.some((j) => j.id === pf.id) && !forjaLista.has(pf.id));
            return faltan.length ? `Esperando a ${faltan.map((x) => x.nombre).join(' y ')} en la Forja…` : null;
          });
        };
      }
    },
  };
}

/** Pantalla para jugar en grupo: crear una sala o entrar con un código. */
function grupo() {
  pantalla = 'grupo';
  const s = seccion('pantalla-grupo con-fondo', `${cabeza('Jugar en grupo', false)}
    <div class="grupo placa">
      <p>Hasta cuatro, cada uno en su celular. La horda crece con cada uno: más muertos, más élites… y más botín para repartir.</p>
      <button class="boton boton-sangre" data-a="crear">${glifo('antorcha')}Crear una sala</button>
      <form class="unirse" autocomplete="off"><input name="c" maxlength="7" placeholder="CÓDIGO" aria-label="Código de la sala" autocapitalize="characters" spellcheck="false" enterkeyhint="go">
        <button class="boton">${glifo('llave')}Unirme</button></form>
    </div>`);
  const input = s.querySelector<HTMLInputElement>('input')!;
  input.addEventListener('input', () => (input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)));
  s.querySelector('form')!.addEventListener('submit', (e) => {
    e.preventDefault();
    void entrarSala(input.value);
  });
  s.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-a]')?.dataset.a;
    if (a === 'crear') void entrarSala();
    else if (a === 'atras') titulo();
  });
}

async function entrarSala(codigo?: string) {
  carga(true, codigo ? 'Buscando la sala…' : 'Abriendo la sala…', 0.3);
  try {
    const api = await import('../salas/sala');
    if (params.get('salas') === 'local') api.usarSalasLocales(true);
    // (con ?rol o ?amigo en la dirección, quien juega es el de la dirección: pruebas en un mismo navegador)
    const yoSala = params.has('amigo') || params.has('rol') ? { id: yo.id, nombre: yo.nombre, tipo: yo.tipo, aspecto: { cuerpo: yo.cuerpo, piel: yo.piel, pelo: yo.pelo } } : undefined;
    sala = codigo ? await api.unirseSala(codigo, 'sangre', yoSala) : await api.crearSala({ juego: 'sangre', max: 4, yo: yoSala });
  } catch (e) {
    carga(false);
    aviso(e instanceof Error ? e.message : 'No hay conexión.', 'peligro', 3500);
    if (pantalla !== 'grupo') titulo();
    return;
  }
  carga(false);
  const s = sala;
  s.alFin((_m, texto) => {
    if (sala !== s) return;
    sala = null;
    if (partida) abandonar(texto);
    else {
      aviso(texto, 'peligro', 3500);
      titulo();
    }
  });
  void lobby();
}

function datosSala() {
  return { clase: sel.clase, spec: sel.spec, perfil: perfilLocal(sala?.yo.puesto ?? 0) };
}

async function lobby() {
  const s = sala;
  if (!s) return titulo();
  pantalla = 'sala';
  pantallas.replaceChildren();
  if (escena.vitrina) escena.vitrina.lado = -1.1;
  s.ponerDatos({ ...datosSala(), jugando: false });
  const retratoSala = (j: JugadorSala) => {
    const c = (j.datos?.clase as IdClase) ?? 'monarca';
    return CLASES[c] ? `<span class="retrato-sala" style="--c1:${CLASES[c].colores[0]}"><img src="./sangre/retratos/${c}_${j.aspecto.cuerpo}.webp" alt="" onerror="this.remove()">${glifo(CLASES[c].glifo)}</span>` : '';
  };
  const detalle = (j: JugadorSala) => {
    const c = j.datos?.clase as IdClase | undefined;
    if (!c || !CLASES[c]) return '';
    const sp = Number(j.datos?.spec) || 0;
    return `${nombreClase(c, j.aspecto.cuerpo)} · ${CLASES[c].specs[sp]?.nombre ?? ''}`;
  };
  const resumenExp = () => `${BIOMAS[sel.bioma].nombre} · peligro ${sel.peligro}${sel.mutadores.length ? ` · ${sel.mutadores.length} mutador${sel.mutadores.length > 1 ? 'es' : ''}` : ''}`;
  let e: ReturnType<typeof esperarEnSala>;
  const esconder = (si: boolean) => e.raiz.classList.toggle('escondida', si);
  e = esperarEnSala({
    sala: s, titulo: 'Sangre y Ceniza', tema: 'oscuro', subtitulo: s.soyAnfitrion ? resumenExp() : 'Escoge tu clase mientras arrancan',
    retrato: retratoSala, detalle,
    extras: [
      { id: 'clase', texto: '⚔️ Mi clase', alTocar: () => {
        esconder(true);
        escogerClase(() => {
          pantallas.replaceChildren();
          s.ponerDatos(datosSala());
          esconder(false);
          e.repintar();
        });
      } },
      ...(s.soyAnfitrion ? [{ id: 'exp', texto: '🗺️ Expedición', alTocar: () => {
        esconder(true);
        escogerExpedicion(() => {
          pantallas.replaceChildren();
          esconder(false);
          const sub = e.raiz.querySelector('.se-sub');
          if (sub) sub.textContent = resumenExp();
        });
      } }] : []),
    ],
    alEmpezar: () => {
      guardarUltima();
      const cfg: ConfigExpedicion = { bioma: sel.bioma, peligro: sel.peligro, mutadores: [...sel.mutadores], semilla: semilla() };
      const perfiles = s.jugadores.map((j, k) => {
        const pf = (j.datos?.perfil as PerfilJugador | undefined) ?? perfilLocal(k);
        return { ...pf, id: j.id, nombre: j.nombre, puesto: j.puesto, cuerpo: j.aspecto.cuerpo, tipo: j.tipo, piel: j.aspecto.piel ?? pf.piel, pelo: j.aspecto.pelo ?? pf.pelo };
      });
      return { cfg, perfiles };
    },
  });
  const r = await e.resultado;
  if (r.que === 'salir') {
    if (sala === s) {
      s.salir();
      sala = null;
    }
    if (r.motivo) aviso(r.motivo, 'peligro', 3000);
    titulo();
    return;
  }
  const d = r.datos as { cfg: ConfigExpedicion; perfiles: PerfilJugador[] };
  s.ponerDatos({ jugando: true, listo: false });
  const local = Math.max(0, d.perfiles.findIndex((x) => x.id === s.yo.id));
  if (s.soyAnfitrion) void empezar(d.cfg, d.perfiles, local, { sala: s });
  else void empezarInvitado(d.cfg, d.perfiles, local, s);
}

async function volverALaSala() {
  await volverAlMenu('nada');
  void lobby();
}

async function empezarInvitado(cfg: ConfigExpedicion, perfiles: PerfilJugador[], local: number, s: Sala) {
  pantalla = 'juego';
  carga(true, 'Bajando con los demás…', 0.15);
  pantallas.replaceChildren();
  cerrarCampamento();
  musica.cambiar('juego');
  const pt: PartidaInvitado = new PartidaInvitado({
    sala: s, cfg, perfiles, local, escena, mando,
    nombre: (i) => perfiles[i]?.nombre ?? `Jugador ${i + 1}`,
    alForja: (p, seguir) => abrirForja(p, seguir),
    alTerminar: (p) => terminar(p),
    alPausa: () => pausa(),
    alSucesos: (p) => {
      const sim = p.sim;
      if (!sim) return;
      sonarSucesos(sim.suc, sim, local);
      musica.tension = Math.min(1, sim.E.vivos / 160 + (sim.fase !== 'juego' ? 0.4 : 0));
    },
    alCarga: (si, texto) => carga(si, texto, 0.4),
  });
  partida = pt;
  mando.alPausar = atras;
  let cortados = new Set<string>();
  quitarSala.push(
    s.alCorte((cortado, quien) => {
      if (cortado) cortados.add(quien.id);
      else cortados.delete(quien.id);
      avisoRed(cortados.size ? `Se cortó la conexión de ${[...cortados].map((id) => perfiles.find((x) => x.id === id)?.nombre ?? 'alguien').join(' y ')}. Esperando…` : null);
    }),
    s.al(MSJ.SALIR, () => {
      if (partida === pt && !pt.terminada) abandonar('Quien tenía la sala terminó la expedición.');
    }),
  );
  // El anfitrión ya pudo haber mandado la etapa 1 (si no, llega enseguida)
  setTimeout(() => {
    if (partida === pt && !pt.sim) carga(true, 'Esperando a que arranque la expedición…', 0.3);
  }, 1500);
}

// ------------------------------------------------------------------------------------------------- Tutorial
function empezarTutorial() {
  tutorial?.cerrar();
  tutorial = new Tutorial(mando);
  const perfil = perfilLocal();
  void empezar({ bioma: 'catacumbas', peligro: 1, mutadores: [], semilla: 5, tutorial: true }, [perfil], 0);
}

// ------------------------------------------------------------------------------------------------- Atrás y salir
function salirDelJuego() {
  cerrarCampamento();
  partida?.liberar();
  escena.liberar();
  location.href = esModoAmigo() ? './amigos.html' : './index.html';
}

function atras() {
  if (hojaPausa) return cerrarPausa();
  const hj = $('hojas').lastElementChild as HTMLElement | null;
  if (hj) {
    hj.remove();
    return;
  }
  switch (pantalla) {
    case 'juego':
      return pausa();
    case 'clases':
    case 'pozo':
    case 'logros':
    case 'grupo':
      return titulo();
    case 'expedicion':
      return escogerClase();
    case 'titulo':
      return confirmar('¿Volver?', 'Sales de Sangre y Ceniza.', 'Salir', 'Quedarme', (si) => si && salirDelJuego());
    default:
      return;
  }
}
mando.alPausar = atras;
if (Capacitor.isNativePlatform()) void App.addListener('backButton', atras);

// El primer toque despierta el sonido (los navegadores no dejan sonar antes)
const despertar = () => {
  sonido.activar();
  musica.despertar();
};
addEventListener('pointerdown', despertar, { capture: true });
addEventListener('keydown', despertar, { capture: true });

// ------------------------------------------------------------------------------------------------- Ganchos de prueba
const w = window as unknown as Record<string, unknown>;
w.__sangre = () => partida?.sim ?? null;
w.__sangrePartida = () => partida;
w.__sangreEscena = () => escena;
w.__sangreProgreso = () => P();
w.__sangrePantalla = () => pantalla;
w.__sangreInfo = () => ({ ...escena.infoDibujo, calidad: escena.calidad, msSim: partida?.msSim ?? 0, enemigos: partida?.sim?.E.vivos ?? 0, pantalla });
w.__sangreDar = (ceniza: number) => {
  P().ceniza += ceniza;
  guardado.guardar();
};
w.__sangreAbrirTodo = () => {
  const p: ProgresoSangre = P();
  p.clases = [...CLASES_ORDEN];
  p.biomas = [...BIOMAS_ORDEN];
  for (const b of BIOMAS_ORDEN) p.ganado[b] = 5;
  guardado.guardar();
};
w.__sangreForja = () => {
  // Salta a la Forja con la etapa ganada (pruebas)
  const sim = partida?.sim;
  if (!sim) return;
  for (const j of sim.J) j.estado = 3;
  sim.fin = { exito: true, objetivo: true, secundario: 0, prisioneros: 0, extraidos: sim.J.map((j) => j.i) } as unknown as typeof sim.fin;
};

// ------------------------------------------------------------------------------------------------- Arranque
async function arrancar() {
  carga(true, 'Encendiendo las antorchas…', 0.1);
  void revisarRenders();
  await guardado.traer().catch(() => undefined);
  aplicarDesbloqueos(P());
  corregirSeleccion();
  // Pruebas: entrar directo a una expedición
  if (params.has('prueba')) {
    const c = params.get('clase') as IdClase | null;
    if (c && CLASES[c]) sel.clase = c;
    const b = params.get('bioma') as IdBioma | null;
    if (b && BIOMAS[b]) sel.bioma = b;
    sel.peligro = Math.max(1, Math.min(5, Number(params.get('peligro')) || 1));
    sel.spec = Math.max(0, Math.min(2, Number(params.get('spec')) || 0));
    if (params.get('prueba') === 'tutorial') {
      empezarTutorial();
      return;
    }
    const perfil = perfilLocal();
    perfil.spec = sel.spec;
    await empezar({ bioma: sel.bioma, peligro: sel.peligro, mutadores: [], semilla: semilla() }, [perfil], 0);
    w.__listo = true;
    return;
  }
  carga(true, undefined, 0.4);
  await campamento();
  carga(false);
  titulo();
  w.__listo = true;
  // Desde la sala de juegos de amigos: ./sangre.html?unirse=CÓDIGO
  const unirse = params.get('unirse');
  if (unirse) void entrarSala(unirse);
  else if (params.has('sala')) void entrarSala();
}

void arrancar();
