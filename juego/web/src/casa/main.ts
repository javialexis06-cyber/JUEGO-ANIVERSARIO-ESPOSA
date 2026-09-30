// Nuestro Hogar: la mascota de pareja. Cada uno cuida a su personaje (Él o Ella), le da cariño al otro,
// se mandan regalos y notas, decoran la casa, guardan fotos y cuentan los días para sus fechas.
// El súper (Súper Manía) queda como minijuego que paga monedas para la casa.
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '../estilos.css';
import './casa.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import * as THREE from 'three';
import { aTres, Mundo } from '../mundo';
import { elegirModelos, Productos } from '../recursos';
import * as sonido from '../sonido';
import {
  BONO_ANIVERSARIO, BONO_DIARIO, CATALOGO, COLORES_TINTE, CONCEPTOS, type Concepto, DISFRACES_LISTA, EFECTO_CARINO, ITEM, Item, LE_CAE_MAL, lePasa, paraSitio,
  piezasConcepto, precioConcepto, RAREZA, RAREZAS, TINTES, TipoItem, type TipoSitio,
} from './catalogo';
import { CORTO, htmlBebe, htmlPintar, htmlPlano, htmlTrofeos } from './ampliacion';
import { Casa3D, Sitio } from './escena_casa';
import { CARINO_VOZ, enLlamada, grabarMensaje, llamadaEntrante, PRECIO_VOZ } from './llamada';
import { Mascota } from './mascota';
import { conGenero, EVENTOS_BANO, type EventoBano, eventoDe } from './bano_frases';
import { Bichos } from './bichos';
import { nombreRango, progresoNuevo, rangoDe, type ProgresoCocina, type RecetaId, type ResultadoDia } from './cocina/tipos';
import { type EstadoTele, Tele } from './tele';
import { Patio } from './patio';
import { PanelRecuerdos } from './recuerdos';
import {
  Accion, alDia, animo, Casa, colorSeguro, Cuarto, CUARTOS, diasPara, DUENO, EstadoPersonaje, Evento, FechaEspecial, hoy, Necesidad,
  NECESIDADES, NOMBRE_CUARTO, NOMBRE_NECESIDAD, NOMBRE_RANURA, nuevoId, otro, personajeNuevo, PRECIO_CUARTO, Ranura, RANURAS, Rol, Ropa,
  sumar, tieneCuarto,
} from './modelo';
import { logrosLocales, METAL, nivel, nivelAmor, niveles, PREMIO_TROFEO, salaTrofeos, TROFEOS } from './trofeos';
import { ranurasDe } from './ropa';
import {
  configLinea, guardarConfigLinea, olvidarSesion, PersonajeOcupado, QueCambio, sesionGuardada, Sincro, SincroLinea, SincroLocal,
} from './sincro';
import {
  $, abrirHoja, Capa, caraClase, cerrarHoja, cerrarVentana, cuerpoHoja, esc, hojaAbierta, ico, iconoItem, iconoRopa, lluviaCorazones,
  mostrar, nombre, pintarNecesidades, SVG, toast, ventana,
} from './ui_casa';

const params = new URLSearchParams(location.search);
const CLAVE_MODO = 'nuestro-hogar-modo';
const CLAVE_VISTO = (r: Rol) => `nuestro-hogar-visto-${r}`;
/** Monedas ganadas en el súper que esperan pasar a la casa (las escribe super.html). */
export const CLAVE_SUELDO = 'nuestro-hogar-sueldo';
const COLORES_NOTA = ['#FFE58A', '#FFC4D6', '#BFE9D8', '#CFE3FF', '#FFD7B0'];
/** Formularios que se están guardando (un doble toque no manda dos veces). */
const guardando = new Set<string>();
async function unaSolaVez(id: string, fn: () => Promise<unknown>) {
  if (guardando.has(id)) return;
  guardando.add(id);
  const b = document.querySelector<HTMLButtonElement>(`#${id} button[type="submit"]`);
  if (b) b.disabled = true;
  try {
    await fn();
  } finally {
    guardando.delete(id);
    if (b?.isConnected) b.disabled = false;
  }
}

interface Modo {
  modo: 'local' | 'linea';
  rol: Rol;
}

let mundo: Mundo;
let casa3d: Casa3D;
let productos: Productos;
let mascotas: Record<Rol, Mascota>;
let s: Sincro | null = null;
let yo: Rol = 'el';
let decorando = false;
let rolElegido: Rol | null = null;
const capa = new Capa();

const leer = <T,>(k: string): T | null => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
};
const escribir = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* sin almacenamiento */
  }
};

function progreso(k: number, texto?: string) {
  $('carga-barra').style.width = `${Math.round(k * 100)}%`;
  if (texto) $('carga-texto').textContent = texto;
}

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
async function iniciar() {
  progreso(0.05, 'Abriendo la puerta…');
  mundo = new Mundo($('lienzo') as HTMLCanvasElement);
  // Con el tono AgX del dibujo en alta calidad este color queda en el mismo beige cálido de la interfaz
  mundo.escena.background = new THREE.Color('#e9d3c0');
  await elegirModelos();
  productos = await Productos.cargar();
  progreso(0.2, 'Acomodando los muebles…');
  casa3d = await Casa3D.cargar(mundo, productos, (k) => progreso(0.2 + k * 0.45));
  progreso(0.7, 'Despertando a Él y a Ella…');
  mascotas = { el: new Mascota('el', casa3d, productos), ella: new Mascota('ella', casa3d, productos) };
  mascotas.el.alNalgada = () => plaf(mascotas.ella);
  bichos = new Bichos(() => casa3d.cuarto('bano'));
  for (const r of ['el', 'ella'] as Rol[]) mascotas[r].alBano = alBano;
  await Promise.all([mascotas.el.cargar(), mascotas.ella.cargar()]);
  progreso(1, 'Listo');
  // De fondo, mientras se elige quién es quién: los dos en la sala
  const ahora = Date.now();
  for (const r of ['el', 'ella'] as Rol[]) mascotas[r].aplicar(personajeNuevo(ahora), ahora, false);
  bucle();
  controles();
  iniciarTele();
  panelRecuerdos = new PanelRecuerdos();
  patio = new Patio({
    mundo,
    casa3d,
    capa,
    casa: () => s?.casa ?? null,
    yo: () => yo,
    cambiarCasa,
    personajes: (v) => {
      for (const m of Object.values(mascotas)) m.p.grupo.visible = v;
    },
    alCambiarModo: () => pintarAcciones(),
  });
  mostrar('carga', false);
  const modo = leerModo();
  modoGuardado = modo;
  if (!modo || !(await entrar(modo))) bienvenida();
}

let modoGuardado: Modo | null = null;
let entradoEn = 0;

function leerModo(): Modo | null {
  const r = params.get('rol');
  if (r === 'el' || r === 'ella') return { modo: params.get('local') === '0' ? 'linea' : 'local', rol: r };
  const m = leer<Modo>(CLAVE_MODO);
  if (m?.modo === 'linea' && (!sesionGuardada() || !configLinea())) return null;
  return m;
}

let entrando = false;

type Como = 'crear' | { codigo: string; reemplazar?: boolean };

async function entrar(m: Modo, como?: Como): Promise<boolean> {
  // Un doble toque en «Crear» o «Unirme» no crea dos casas ni conecta dos veces
  if (entrando || s) return !!s;
  entrando = true;
  const botones = ['btn-crear', 'btn-local', 'btn-reintentar'].map((id) => $(id) as HTMLButtonElement | null);
  const unirse = $('form-unirse').querySelector('button') as HTMLButtonElement;
  const antes = [...botones.map((b) => b?.disabled ?? false), unirse.disabled];
  for (const b of [...botones, unirse]) if (b) b.disabled = true;
  try {
    return await entrarDeVerdad(m, como);
  } finally {
    entrando = false;
    botones.forEach((b, i) => b && (b.disabled = antes[i]));
    unirse.disabled = antes[antes.length - 1];
  }
}

async function entrarDeVerdad(m: Modo, como?: Como): Promise<boolean> {
  const aviso = $('bienv-aviso');
  try {
    if (m.modo === 'local') s = new SincroLocal(m.rol);
    else {
      const cfg = configLinea();
      if (!cfg) throw new Error('Falta conectar el servidor.');
      aviso.textContent = 'Conectando…';
      if (como === 'crear') s = await SincroLinea.crear(cfg, m.rol);
      else if (como) s = await SincroLinea.unirse(cfg, como.codigo, m.rol, como.reemplazar);
      else s = await SincroLinea.reanudar(cfg, sesionGuardada()!);
    }
  } catch (e) {
    s = null;
    if (e instanceof PersonajeOcupado && como && como !== 'crear') {
      aviso.textContent = '';
      confirmarReemplazo(m, como.codigo);
      return false;
    }
    aviso.textContent = e instanceof Error ? e.message : 'No se pudo entrar a la casa.';
    // Si ya tenían casa en línea y falló (sin internet), se ofrece reintentar sin volver a elegir todo
    $('btn-reintentar').hidden = !(m.modo === 'linea' && !como);
    return false;
  }
  aviso.textContent = '';
  $('btn-reintentar').hidden = true;
  yo = m.rol;
  if (!params.get('rol')) escribir(CLAVE_MODO, m);
  s.alCambiar(alCambiar);
  s.alEvento(alEvento);
  mostrar('bienvenida', false);
  mostrar('hogar-hud');
  $('yo-nombre').textContent = nombre(yo);
  $('pareja-nombre').textContent = nombre(otro(yo));
  $('chip-yo').querySelector('.chip-cara')!.className = `chip-cara ${caraClase(yo)}`;
  $('chip-pareja').querySelector('.chip-cara')!.className = `chip-cara ${caraClase(otro(yo))}`;
  // Los cuartos donde están los dos (si son de la ampliación, se cargan antes de ponerlos ahí)
  await Promise.all([...new Set([s.personajes.el.cuarto, s.personajes.ella.cuarto])].map((c) => casa3d.asegurar(c).catch(() => {})));
  const ahora = Date.now();
  for (const r of ['el', 'ella'] as Rol[]) mascotas[r].aplicar(s.personajes[r], ahora, false);
  verCuarto(s.personajes[yo].cuarto);
  sincronizarAmpliacion();
  patio.sincronizar();
  await casa3d.ponerDeco(s.casa.deco, s.recuerdos);
  casa3d.pintarNotas(s.casa.notas);
  entradoEn = Date.now();
  await alAbrir();
  pintarTodo();
  sonido.musica.iniciar('menu', 76, 'hogar');
  (window as any).__listo = true;
  return true;
}

/** El personaje ya está en otro celular: ¿es un celular nuevo o se equivocó de personaje? */
function confirmarReemplazo(m: Modo, codigo: string) {
  const otroNombre = nombre(otro(m.rol));
  ventana(`<h2>${nombre(m.rol)} ya está en otro celular</h2>
    <p class="nota-hoja">Si es tu celular nuevo (o reinstalaste la app), entra aquí y el otro se desconecta.
    Si eres ${otroNombre}, vuelve y toca «Soy ${otroNombre}».</p>
    <div class="fila-botones" style="justify-content:center">
      <button class="boton boton-papel" data-cerrar>Me equivoqué</button>
      <button class="boton boton-tomate" id="btn-si-reemplazar">Soy yo, entrar aquí</button>
    </div>`);
  $('btn-si-reemplazar').onclick = () => {
    cerrarVentana();
    void entrar(m, { codigo, reemplazar: true });
  };
}

// ---------------------------------------------------------------------------
// Bienvenida
// ---------------------------------------------------------------------------
function bienvenida() {
  mostrar('bienvenida');
  const cfg = configLinea();
  const sinServidor = !cfg;
  ($('btn-crear') as HTMLButtonElement).disabled = sinServidor;
  ($('form-unirse').querySelector('button') as HTMLButtonElement).disabled = sinServidor;
  $('btn-bienv-config').hidden = !sinServidor;
  if (sinServidor) $('bienv-aviso').textContent = 'Para jugar entre los dos celulares falta conectar el servidor.';
}

function elegirRol(r: Rol) {
  rolElegido = r;
  for (const b of Array.from(document.querySelectorAll<HTMLElement>('.rol-carta'))) b.setAttribute('aria-checked', String(b.dataset.rol === r));
  mostrar('bienv-conexion');
  sonido.activar();
  sonido.toque();
}

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------
const est = (r: Rol) => alDia(s!.personajes[r]);
const dormido = (r: Rol) => s!.personajes[r].actividad.tipo === 'dormir';

async function guardarYo(e: EstadoPersonaje) {
  try {
    await s!.guardarPersonaje(yo, e);
  } catch (err) {
    fallo(err);
  }
}

function fallo(err: unknown) {
  console.error(err);
  toast(err instanceof Error && err.message ? `No se pudo guardar: ${err.message}` : 'No se pudo guardar. Revisa el internet.');
}

async function cambiarCasa(fn: Parameters<Sincro['cambiarCasa']>[0]) {
  try {
    await s!.cambiarCasa(fn);
    return true;
  } catch (err) {
    fallo(err);
    return false;
  }
}

function alCambiar(que: QueCambio) {
  // El personaje reacciona enseguida a su estado nuevo (no espera la revisión de cada medio segundo)
  if (que === 'personaje') {
    for (const r of ['el', 'ella'] as Rol[]) {
      void casa3d.asegurar(s!.personajes[r].cuarto).catch(() => {});
      mascotas[r].aplicar(s!.personajes[r]);
    }
  }
  if (que === 'casa') {
    void casa3d.ponerDeco(s!.casa.deco, s!.recuerdos);
    casa3d.pintarNotas(s!.casa.notas);
    sincronizarAmpliacion();
    patio.sincronizar();
  }
  if (que === 'recuerdos') void casa3d.ponerDeco(s!.casa.deco, s!.recuerdos);
  pintarTodo();
  if (hojaAbierta()) repintarHoja?.();
  if (que === 'eventos' || que === 'casa') void aplicarPendientes();
}

/** Al abrir la app (o volver a ella): lo que pasó en segundo plano, bono del día, sueldo del súper y aniversario.
 *  Si se llama otra vez mientras corre (volver y salir rápido), espera la que ya va: nada se cobra dos veces. */
let abriendo: Promise<void> | null = null;
function alAbrir() {
  abriendo ??= abrirDeVerdad().finally(() => (abriendo = null));
  return abriendo;
}

/** Suma monedas una sola vez por clave (queda anotada en la casa, así no se repite en otro celular ni al reintentar). */
async function unaVez(clave: string, monedas: number): Promise<boolean> {
  let dado = false;
  const ok = await cambiarCasa((c) => {
    dado = false;
    if (c.diario[clave]) return;
    for (const k of Object.keys(c.diario)) if (!k.startsWith(hoy()) && !k.startsWith('aniversario-') && !k.startsWith('trofeo-')) delete c.diario[k];
    c.diario[clave] = 1;
    c.monedas += monedas;
    dado = true;
  });
  return ok && dado;
}

async function abrirDeVerdad() {
  if (!s) return;
  const ahora = Date.now();
  const mensajes: string[] = [];
  // (recién entrando ya se leyó todo: solo se vuelve a leer al volver a la app)
  if (s.modo === 'linea' && Date.now() - entradoEn > 5000) {
    try {
      await s.refrescar();
    } catch {
      mensajes.push('Sin conexión: se muestra lo último que se guardó.');
    }
  }
  // Sueldo del súper: se descuenta del sobre solo lo que sí llegó a la casa
  let sueldo = 0;
  try {
    sueldo = Math.max(0, Math.floor(Number(localStorage.getItem(CLAVE_SUELDO) ?? 0) || 0));
  } catch {
    /* nada */
  }
  if (sueldo > 0 && (await cambiarCasa((c) => (c.monedas += sueldo)))) {
    try {
      const queda = (Number(localStorage.getItem(CLAVE_SUELDO)) || 0) - sueldo;
      if (queda > 0) localStorage.setItem(CLAVE_SUELDO, String(queda));
      else localStorage.removeItem(CLAVE_SUELDO);
    } catch {
      /* nada */
    }
    mensajes.push(`Llegaron monedas de los minijuegos: +${sueldo}`);
  }
  // Lo que se logró en los minijuegos de este celular sube a la casa (para los trofeos) y se cobran los trofeos nuevos
  await subirLogros();
  mensajes.push(...(await premiosTrofeos()));
  // Bono diario (uno por persona y por día)
  if (await unaVez(`${hoy()}|${yo}|bono`, BONO_DIARIO)) mensajes.push(`Bono del día: +${BONO_DIARIO} monedas`);
  await guardarYo({ ...est(yo), visto: ahora });
  // Aniversario
  const aniv = s.casa.aniversario;
  if (aniv && diasPara(aniv, true) === 0) {
    lluviaCorazones(36);
    if (await unaVez(`aniversario-${new Date().getFullYear()}`, BONO_ANIVERSARIO)) mensajes.push(`¡Feliz aniversario! +${BONO_ANIVERSARIO} monedas`);
  }
  // Lo que hizo la pareja mientras no estaba (y su cariño llega ahora)
  const nuevos = await aplicarPendientes();
  if (nuevos.length) mensajes.push(`Mientras no estabas, ${nombre(otro(yo))} ${resumen(nuevos)}`);
  else if (vozPendiente()) mensajes.push(`Tienes un mensaje de voz de ${nombre(otro(yo))} sin oír.`);
  escribir(CLAVE_VISTO(yo), ahora);
  mensajes.forEach((m, i) => setTimeout(() => toast(m, 3400), i * 3600));
}

/** Aplica a mi personaje los mimos y la comida que me mandaron y que todavía no se habían aplicado. */
let aplicando = false;
async function aplicarPendientes(): Promise<Evento[]> {
  if (!s || aplicando) return [];
  const pendientes = s.eventos.filter((e) => e.de !== yo && !e.visto && e.tipo !== 'saludo');
  const saludos = s.eventos.filter((e) => e.de !== yo && !e.visto && e.tipo === 'saludo');
  if (!pendientes.length && !saludos.length) return [];
  aplicando = true;
  try {
    for (const e of [...pendientes, ...saludos]) e.visto = true;
    const cambios: Partial<Record<Necesidad, number>> = {};
    const sumarA = (ef: Partial<Record<Necesidad, number>>) => {
      for (const [k, v] of Object.entries(ef) as [Necesidad, number][]) cambios[k] = (cambios[k] ?? 0) + v;
    };
    for (const e of pendientes) {
      if (e.tipo === 'caricia' || e.tipo === 'abrazo' || e.tipo === 'beso' || e.tipo === 'nalgada') sumarA({ carino: EFECTO_CARINO[e.tipo].suyo });
      else if (e.tipo === 'comida' && typeof e.datos.item === 'string' && ITEM[e.datos.item]?.tipo === 'comida') sumarA(ITEM[e.datos.item].efecto ?? {});
    }
    // La leche (Ella) o el picante (Él) que le trajo la pareja: ganas urgentes de ir al baño
    const apuro = pendientes.some((e) => e.tipo === 'comida' && LE_CAE_MAL[yo].includes(String(e.datos.item)));
    if (Object.keys(cambios).length || apuro) await guardarYo({ ...sumar(s.personajes[yo], cambios), ...(apuro ? { apuro: Date.now() } : {}) });
    if (apuro) setTimeout(() => toast(`¡Uy! A ${nombre(yo)} eso le cayó pesado… ¡al baño, rápido!`, 3600), 2500);
    await s.marcarVistos([...pendientes, ...saludos].map((e) => e.id)).catch((err) => console.error(err));
    return [...pendientes, ...saludos];
  } finally {
    aplicando = false;
    if (s?.eventos.some((e) => e.de !== yo && !e.visto)) setTimeout(() => void aplicarPendientes(), 0);
  }
}

function resumen(ev: Evento[]) {
  const n = (t: Evento['tipo']) => ev.filter((e) => e.tipo === t).length;
  const partes: string[] = [];
  const plural = (k: number, uno: string, varios: string) => (k === 1 ? `1 ${uno}` : `${k} ${varios}`);
  if (n('beso')) partes.push(plural(n('beso'), 'beso', 'besos'));
  if (n('nalgada')) partes.push(plural(n('nalgada'), 'nalgadita', 'nalgaditas'));
  if (n('abrazo')) partes.push(plural(n('abrazo'), 'abrazo', 'abrazos'));
  if (n('caricia')) partes.push(plural(n('caricia'), 'caricia', 'caricias'));
  if (n('regalo')) partes.push(plural(n('regalo'), 'regalo', 'regalos'));
  if (n('comida')) partes.push(plural(n('comida'), 'comida', 'comidas'));
  if (n('nota')) partes.push(plural(n('nota'), 'nota', 'notas'));
  if (n('voz')) partes.push(plural(n('voz'), 'mensaje de voz', 'mensajes de voz'));
  if (!partes.length) return 'pasó a saludar.';
  const ult = partes.pop()!;
  return `te dejó ${partes.length ? `${partes.join(', ')} y ${ult}` : ult}.`;
}

// ---------------------------------------------------------------------------
// Acciones propias
// ---------------------------------------------------------------------------
async function hacer(accion: Accion, cuarto: Cuarto, seg: number, cambios: Partial<Record<Necesidad, number>>, item?: string) {
  if (!s) return;
  if (dormido(yo)) return toast(`${nombre(yo)} está durmiendo. Despiértalo primero.`);
  const ahora = Date.now();
  const e = sumar(s.personajes[yo], cambios, ahora);
  seguir(cuarto);
  await guardarYo({ ...e, cuarto, actividad: { tipo: 'nada', desde: ahora, accion, hasta: ahora + seg * 1000, item }, visto: ahora });
}

/** Saca uno del inventario (con los datos de ese momento: el otro pudo gastar el último). */
function gastar(c: Casa, id: string) {
  if ((c.inventario[id] ?? 0) <= 0) throw new Error(`ya no queda ${ITEM[id]?.nombre.toLowerCase() ?? 'eso'}`);
  c.inventario[id] -= 1;
}

async function comer(id: string) {
  const it = ITEM[id];
  if (!s || !it || (s.casa.inventario[id] ?? 0) <= 0) return;
  if (dormido(yo)) return toast('Primero hay que despertar.');
  if (!(await cambiarCasa((c) => gastar(c, id)))) return;
  sonido.mordisco();
  setTimeout(() => sonido.mordisco(), 1600);
  await hacer('comer', 'cocina', 7, it.efecto ?? {}, id);
  toast(`¡Qué rico! ${it.nombre}`);
  if (LE_CAE_MAL[yo].includes(id) && s) {
    await guardarYo({ ...s.personajes[yo], apuro: Date.now() });
    setTimeout(() => toast(`¡Uy! ${it.nombre}… a ${nombre(yo)} eso le cae pesado. ¡Al baño, rápido!`, 3600), 2600);
  }
}

async function dormir() {
  if (!s) return;
  const e = est(yo);
  const ahora = Date.now();
  seguir('cuarto');
  sonido.bostezo();
  await guardarYo({ ...e, cuarto: 'cuarto', actividad: { tipo: 'dormir', desde: ahora }, visto: ahora });
  toast(
    e.energia >= 92
      ? 'Una siestica aunque no tenga sueño. Si los dos se acuestan, se quedan abrazados.'
      : 'A dormir. La energía sube mientras duerme (también con la app cerrada).',
    3400,
  );
}

async function despertar(auto = false) {
  if (!s || !dormido(yo)) return;
  const ahora = Date.now();
  const e = est(yo);
  await guardarYo({ ...e, actividad: { tipo: 'nada', desde: ahora, accion: 'saludo', hasta: ahora + 2500 }, visto: ahora });
  toast(auto ? `${nombre(yo)} se despertó con toda la energía.` : '¡Buenos días!');
}

// ---------------------------------------------------------------------------
// El retrete espacial: la leche (Ella) o el picante (Él) mandan el inodoro al espacio
// ---------------------------------------------------------------------------
let enCohete = false;
/** Mientras se juega en el espacio no se dibuja la casa (ahorra batería). */
let pausaCasa = false;
const pausa = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
async function esperarQue(cond: () => boolean, maxMs: number) {
  const t0 = performance.now();
  while (!cond() && performance.now() - t0 < maxMs) await pausa(200);
  return cond();
}

async function irAlBano() {
  if (!s || enCohete) return;
  if (dormido(yo)) return toast(`${nombre(yo)} está durmiendo. Despiértalo primero.`);
  const apuro = !!s.personajes[yo].apuro;
  // De vez en cuando (10 %) pasa algo gracioso: si hay que llamar a la pareja, se queda esperándola un rato
  const ev = apuro ? null : (eventoForzado ? EVENTOS_BANO.find((x) => x.id === eventoForzado) ?? null : eventoDe(Date.now()));
  eventoForzado = null;
  // (el tiempo cuenta desde que sale para el baño: incluye lo que tarda en llegar al inodoro)
  await hacer('inodoro', 'bano', apuro ? 90 : ev ? (ev.llama !== undefined ? 75 : 32) : 22, {}, ev?.id);
  if (!apuro) return;
  enCohete = true;
  try {
    const m = mascotas[yo];
    if (!(await esperarQue(() => m.escenaActual.split('|')[1] === 'inodoro', 25000))) return;
    await pausa(3200);
    await despegar(m);
    const { jugarCohete } = await import('./cohete');
    pausaCasa = true;
    const r = await jugarCohete({ rol: yo, ropa: s.personajes[yo].ropa, colorPelo: s.personajes[yo].colorPelo, record: s.casa.retrete });
    pausaCasa = false;
    await aterrizar(m);
    await terminarCohete(r.segundos);
  } finally {
    enCohete = false;
    pausaCasa = false;
  }
}

/** Anima algo durante `seg` segundos (k de 0 a 1). */
function animar(seg: number, fn: (k: number) => void) {
  return new Promise<void>((listo) => {
    const t0 = performance.now();
    const paso = () => {
      const k = Math.min(1, (performance.now() - t0) / 1000 / seg);
      fn(k);
      if (k < 1) requestAnimationFrame(paso);
      else listo();
    };
    requestAnimationFrame(paso);
  });
}

/** Tiembla, echa humo y sale disparado por el techo con el inodoro. */
async function despegar(m: Mascota) {
  verCuarto('bano');
  const inodoro = casa3d.inodoro();
  const y0 = inodoro?.position.y ?? 0;
  m.frase = '¡¿Qué está pasando?!';
  sonido.rumor(1.4, 160, 0.1, 0, 0.6, 80);
  await animar(1.3, (k) => {
    m.temblor = 0.02 + k * 0.05;
    if (inodoro) inodoro.rotation.z = (Math.random() - 0.5) * 0.08 * k;
  });
  m.frase = '¡AAAAAH!';
  sonido.nota(90, 1.4, 0, 'sawtooth', 0.06, 420);
  sonido.rumor(1.4, 400, 0.14, 0, 0.5, 2000);
  explosion(inodoro, 'humo');
  await animar(1.4, (k) => {
    const h = k * k * 9;
    m.vuelo = h;
    m.temblor = 0.04 * (1 - k);
    if (inodoro) inodoro.position.y = y0 + h;
  });
  m.temblor = 0;
  m.frase = null;
}

/** Cae del cielo con el inodoro y el baño explota. */
async function aterrizar(m: Mascota) {
  verCuarto('bano');
  const inodoro = casa3d.inodoro();
  m.frase = '¡Me voooy!';
  await animar(0.8, (k) => {
    const h = (1 - k * k) * 9;
    m.vuelo = h;
    if (inodoro) inodoro.position.y = h;
  });
  m.vuelo = 0;
  if (inodoro) {
    inodoro.position.y = 0;
    inodoro.rotation.z = 0;
  }
  explosion(inodoro, 'kaboom');
  sonido.rumor(1.2, 120, 0.2, 0, 0.5, 50);
  sonido.nota(70, 0.9, 0, 'sawtooth', 0.08, 30);
  document.body.classList.remove('sacudon');
  void document.body.offsetWidth;
  document.body.classList.add('sacudon');
  m.frase = '¡Estoy bien!… creo.';
  await animar(0.6, (k) => (m.temblor = 0.05 * (1 - k)));
  setTimeout(() => (m.frase = null), 2500);
}

/** Humo o explosión en la pantalla, sobre el inodoro. */
function explosion(obj: THREE.Object3D | null, tipo: 'humo' | 'kaboom' | 'agua') {
  if (!obj) return;
  const p = mundo.aPantalla(obj.getWorldPosition(new THREE.Vector3()));
  const e = document.createElement('div');
  e.className = `explosion ${tipo}`;
  e.style.left = `${p.x}px`;
  e.style.top = `${p.y}px`;
  e.innerHTML = Array.from({ length: 12 }, (_, i) => `<span style="--a:${i * 30}deg;--d:${0.4 + (i % 4) * 0.12}s"></span>`).join('') + (tipo === 'kaboom' ? '<b>¡KABOOM!</b>' : '');
  document.body.append(e);
  setTimeout(() => e.remove(), 1800);
}

async function terminarCohete(seg: number) {
  if (!s) return;
  const antes = s.casa.retrete?.[yo] ?? 0;
  const record = seg > antes;
  const premio = Math.min(3, Math.floor(seg / 15));
  await cambiarCasa((c) => {
    c.retrete = { ...(c.retrete ?? {}) };
    if (seg > (c.retrete[yo] ?? 0)) c.retrete[yo] = seg;
    c.monedas += premio;
  });
  // Ya fue al baño: se le quitan las ganas y se levanta del inodoro
  const ahora = Date.now();
  const e = { ...est(yo), actividad: { tipo: 'nada' as const, desde: ahora }, visto: ahora };
  delete e.apuro;
  await guardarYo(e);
  setTimeout(() => hojaRetrete(seg, record, premio), 1400);
  const nuevos = await premiosTrofeos();
  nuevos.forEach((m, i) => setTimeout(() => toast(m, 3400), 4000 + i * 3600));
}

/** El marcador del retrete espacial: quién ha durado más en el espacio. */
function hojaRetrete(seg?: number, record = false, premio = 0) {
  const r = s?.casa.retrete ?? {};
  const a = r.el ?? 0, b = r.ella ?? 0;
  const lider: Rol | null = a === b ? null : a > b ? 'el' : 'ella';
  const fila = (q: Rol) =>
    `<li class="${lider === q ? 'lider' : ''}"><span class="${caraClase(q)}"></span><b>${nombre(q)}</b><em>${r[q] ? `${r[q]!.toFixed(1)} s` : '—'}</em>${lider === q ? '<i>👑</i>' : ''}</li>`;
  const html = `${
    seg !== undefined
      ? `<p class="nota-hoja">Duraste <b>${seg.toFixed(1)} s</b> esquivando asteroides en el retrete.${record ? ' <b>¡Nuevo récord!</b>' : ''}${premio ? ` +${premio} ${premio === 1 ? 'moneda' : 'monedas'}.` : ''}</p>`
      : ''
  }<ol class="retrete-records">${fila('el')}${fila('ella')}</ol>
    <p class="nota-hoja">La leche le cae pesado a Ella y el picante a Él: si se los dan, el inodoro los manda al espacio. ¿Quién aguanta más?</p>`;
  abrirHoja('Retrete espacial', html, { saldo: s?.casa.monedas });
  if (record) lluviaCorazones(14);
}

// ---------------------------------------------------------------------------
// Ampliar la casa: cuartos nuevos, minijuegos en su cuarto, trofeos, la bebé y el cuarto de cada uno
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Eventos graciosos del baño (10 %): un ratón, cucarachas, se tapó, se fue la luz… y la pareja llega a rescatar
// ---------------------------------------------------------------------------
let bichos: Bichos | null = null;
/** El evento que se está viendo: de quién es y en qué escena pasó (si esa escena se acaba, se acaba el evento). */
let eventoBano: { rol: Rol; clave: string; ev: EventoBano } | null = null;
/** Para las pruebas: el próximo «Ir al baño» trae este evento. */
let eventoForzado: string | null = null;

const SONIDO_BANO: Partial<Record<EventoBano['id'], () => void>> = {
  raton: () => [0, 0.18, 0.4].forEach((d) => sonido.nota(2600, 0.06, d, 'sine', 0.05, 3200)),
  cucarachas: () => sonido.rumor(1.2, 5000, 0.03, 0, 0.8, 4000),
  arana: () => sonido.nota(300, 1.2, 0, 'sine', 0.03, 150),
  mosca: () => sonido.nota(220, 2.5, 0, 'sawtooth', 0.012, 260),
  tapado: () => [0, 0.3, 0.6, 0.9].forEach((d) => sonido.nota(180, 0.2, d, 'sine', 0.08, 90)),
  luz: () => sonido.nota(1200, 0.03, 0, 'square', 0.05),
  llamada: () => [0, 0.5, 1.2, 1.7].forEach((d) => sonido.nota(d % 1 < 0.4 ? 1320 : 990, 0.35, d, 'sine', 0.05)),
  chorro: () => sonido.rumor(0.9, 1400, 0.1, 0, 0.6, 500),
  ambientador: () => sonido.rumor(1.4, 6000, 0.05, 0, 1.2, 5000),
  patito: () => sonido.nota(900, 0.18, 0, 'square', 0.05, 1300),
  perrito: () => [0, 0.25, 0.5, 0.75].forEach((d) => sonido.rumor(0.15, 3000, 0.04, d, 1, 2000)),
  eco: () => [0, 0.45, 0.9].forEach((d, i) => sonido.nota(660, 0.3, d, 'sine', 0.05 / (i + 1))),
};

function alBano(m: Mascota, ev: EventoBano, que: 'pasa' | 'llama') {
  if (que === 'llama') {
    // Solo el celular de quien está en el baño le avisa a la pareja
    if (m.rol === yo && s) void s.enviar('auxilio', { evento: ev.id });
    sonido.alarma();
    return;
  }
  eventoBano = { rol: m.rol, clave: m.claveEscena, ev };
  SONIDO_BANO[ev.id]?.();
  const pt = casa3d.puntos('bano').inodoro;
  if (ev.bicho) bichos?.soltar(ev.bicho, ev.cuantos ?? 1, pt, 1.3, 70);
  else if (ev.id === 'tapado') bichos?.agua(pt, 70);
  else if (ev.id === 'chorro') explosion(casa3d.inodoro(), 'agua');
  else if (ev.id === 'ambientador') explosion(casa3d.inodoro(), 'humo');
}

/** Cada cuadro: el evento sigue mientras siga esa escena; con la luz ida el baño se ve a oscuras. */
function revisarEventoBano(dt: number) {
  bichos?.update(dt);
  if (eventoBano && mascotas[eventoBano.rol].claveEscena !== eventoBano.clave) {
    bichos?.quitar();
    eventoBano = null;
  }
  const oscuro = eventoBano?.ev.id === 'luz' && casa3d.actual === 'bano';
  if (document.body.classList.contains('apagon') !== oscuro) document.body.classList.toggle('apagon', oscuro);
}

/** La pareja pidió ayuda desde el baño. */
function hojaAuxilio(de: Rol, ev: EventoBano) {
  sonido.alarma();
  abrirHoja(
    '¡Auxilio!',
    `<p class="nota-hoja">${conGenero(de, ev.aviso(nombre(de)))}</p>
    <div class="fila-botones"><button class="boton boton-tomate" data-rescate="${ev.id}">¡Voy corriendo!</button></div>`,
  );
}

/** Voy al baño a rescatar a mi amor: ahuyento el bicho, destapo, traigo el papel… */
async function rescatar(id: string) {
  const ev = EVENTOS_BANO.find((x) => x.id === id);
  if (!s || !ev) return;
  cerrarHoja();
  if (dormido(yo)) return toast(`${nombre(yo)} está durmiendo. Despiértalo primero.`);
  await hacer('usar', 'bano', 14, { carino: 6 }, 'rescate');
  const m = mascotas[yo];
  const listo = () => {
    const e = m.escenaActual.split('|');
    return e[1] === 'usar' && e[2] === 'rescate';
  };
  if (!(await esperarQue(listo, 30000))) return;
  const frases = ev.rescate ?? ['¡Aquí estoy!', 'Tranquilidad, ya llegué.'];
  m.frase = conGenero(otro(yo), frases[Math.floor(Math.random() * frases.length)]);
  sonido.atrapado();
  if (eventoBano) {
    bichos?.quitar();
    eventoBano = null;
  }
  void s.enviar('rescate', { evento: id });
  setTimeout(() => (m.frase = null), 4800);
}

/** Me rescataron: se acaba el susto, salgo del baño feliz y con cariño. */
async function rescatado(de: Rol) {
  if (!s) return;
  bichos?.quitar();
  eventoBano = null;
  await pausa(1200);
  const ahora = Date.now();
  await guardarYo({ ...sumar(est(yo), { carino: 6 }, ahora), actividad: { tipo: 'nada', desde: ahora, accion: 'saludo', hasta: ahora + 3500 }, visto: ahora });
  mascotas[yo].frase = conGenero(de, '¡Mi héroe|heroína! 💖');
  setTimeout(() => (mascotas[yo].frase = null), 4800);
  lluviaCorazones(10);
}

// ---------------------------------------------------------------------------
// Lavarse la cara: se mira al espejo, la cara se pone borrosa con ondas y entra (como a otro plano) a un
// minijuego estilo Vampire Survivors contra los gérmenes de su propia cara
// ---------------------------------------------------------------------------
let lavandose = false;

async function lavarse() {
  if (!s || lavandose || enCohete) return;
  if (dormido(yo)) return toast(`${nombre(yo)} está durmiendo. Despiértalo primero.`);
  lavandose = true;
  const m = mascotas[yo];
  const sigue = () => s?.personajes[yo].actividad.accion === 'lavar';
  const lienzo = $('lienzo');
  let portal: HTMLElement | null = null;
  let v0: ReturnType<Mundo['vista']> | null = null;
  // El minijuego (y los estilos del espejo) se van cargando mientras camina al espejo
  const modulo = import('./lavado');
  try {
    await hacer('lavar', 'bano', 360, {});
    // Camina hasta el espejo (si mientras tanto le mandan a hacer otra cosa, no hay minijuego)
    if (!(await esperarQue(() => !sigue() || m.escenaActual.split('|')[1] === 'lavar', 25000)) || !sigue()) return;
    const frases = ['A ver esta carita…', '¿Y esos granitos?', 'Mmm… algo raro hay aquí', '¡Uy, qué es esto!'];
    m.frase = frases[Math.floor(Math.random() * frases.length)];
    sonido.limpio();
    await pausa(1500);
    if (!sigue()) return;
    // La cámara se acerca al espejo
    v0 = mundo.vista();
    const espejo = casa3d.objeto('bano', 'espejo');
    const meta = espejo ? espejo.getWorldPosition(new THREE.Vector3()) : m.p.grupo.getWorldPosition(new THREE.Vector3()).setY(1.4);
    const desde = v0.p.clone(), z0 = v0.zoom;
    await animar(1.2, (k) => {
      const e = k * k * (3 - 2 * k);
      mundo.enfocar(desde.clone().lerp(meta, e), z0 + (3.4 - z0) * e, 3.4);
    });
    m.frase = null;
    const { jugarLavado } = await modulo;
    // La cara en el espejo se pone borrosa, con ondas… y entra a otro plano
    document.body.classList.add('lavandose');
    portal = abrirPortal(yo);
    lienzo.classList.add('lienzo-borroso');
    sonido.rumor(1.6, 700, 0.06, 0, 0.5, 2400);
    await pausa(1700);
    portal.classList.add('entra');
    [0, 0.25, 0.5].forEach((d) => sonido.nota(1400 - d * 800, 0.4, d, 'sine', 0.04, 500));
    await pausa(1500);
    pausaCasa = true;
    const juego = jugarLavado({ rol: yo });
    // Ya con el juego encima, la casa borrosa y las ondas no se ven: se esconden (el filtro gasta batería)
    const tapar = setTimeout(() => {
      lienzo.style.visibility = 'hidden';
      if (portal) portal.style.display = 'none';
    }, 800);
    const r = await juego;
    clearTimeout(tapar);
    // De vuelta: el velo de agua se va, la casa vuelve a verse nítida y la cámara se aleja
    lienzo.style.visibility = '';
    portal.style.display = '';
    pausaCasa = false;
    await pausa(450);
    portal.classList.add('sale');
    lienzo.classList.add('lienzo-volviendo');
    lienzo.classList.remove('lienzo-borroso');
    const z1 = mundo.vista().zoom, p1 = mundo.vista().p;
    const vuelta = animar(1, (k) => {
      const e = k * k * (3 - 2 * k);
      mundo.enfocar(p1.clone().lerp(v0!.p, e), z1 + (v0!.zoom - z1) * e, 3.4);
    });
    await terminarLavado(r);
    await vuelta;
  } finally {
    lavandose = false;
    pausaCasa = false;
    document.body.classList.remove('lavandose');
    lienzo.style.visibility = '';
    lienzo.classList.remove('lienzo-borroso');
    setTimeout(() => lienzo.classList.remove('lienzo-volviendo'), 1000);
    if (portal) setTimeout(() => portal?.remove(), 900);
    if (v0 && mundo.vista().zoom > 3.01) mundo.fijarZoom(1);
  }
}

/** El espejo con la cara del personaje moviéndose en ondas (un filtro SVG que se va agitando) y anillos de agua. */
function abrirPortal(rol: Rol) {
  const p = document.createElement('div');
  p.className = 'lavado-portal';
  p.innerHTML = `<svg aria-hidden="true"><filter id="lavado-ondas" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="turbulence" baseFrequency="0.012 0.05" numOctaves="2" seed="3" result="ruido"/>
      <feDisplacementMap in="SourceGraphic" in2="ruido" scale="0" xChannelSelector="R" yChannelSelector="G"/>
      <feGaussianBlur stdDeviation="0"/>
    </filter></svg>
    <div class="velo"></div>
    ${[0, 0.4, 0.8, 1.2].map((d) => `<span class="onda" style="--d:${d}s"></span>`).join('')}
    <div class="lavado-espejo"><i style="background-image:url(./recuerdos/${rol}_sorpresa.webp)"></i></div>`;
  document.body.append(p);
  const ruido = p.querySelector('feTurbulence')!;
  const mapa = p.querySelector('feDisplacementMap')!;
  const borroso = p.querySelector('feGaussianBlur')!;
  const t0 = performance.now();
  const paso = () => {
    if (!p.isConnected) return;
    const t = (performance.now() - t0) / 1000;
    const k = Math.min(1, t / 1.6);
    ruido.setAttribute('baseFrequency', `${(0.012 + Math.sin(t * 3) * 0.004).toFixed(4)} ${(0.05 + Math.sin(t * 2.2) * 0.02).toFixed(4)}`);
    mapa.setAttribute('scale', String(Math.round(k * 34 + Math.sin(t * 7) * 6 * k)));
    borroso.setAttribute('stdDeviation', (k * 2.2).toFixed(2));
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
  return p;
}

async function terminarLavado(r: { segundos: number; gano: boolean; eliminados: number; nivel: number; jefe: boolean }) {
  if (!s) return;
  const higiene = r.gano ? 100 : Math.round(15 + (r.segundos / 180) * 60);
  const premio = Math.min(10, Math.floor(r.segundos / 30) + (r.gano ? 3 : 0) + (r.jefe ? 2 : 0));
  const record = r.eliminados > (s.casa.lavado?.[yo] ?? 0);
  await cambiarCasa((c) => {
    c.lavado = { ...(c.lavado ?? {}) };
    if (r.eliminados > (c.lavado[yo] ?? 0)) c.lavado[yo] = r.eliminados;
    c.monedas += premio;
  });
  // Ya se lavó: deja el espejo con la carita fresca
  const ahora = Date.now();
  await guardarYo({ ...sumar(est(yo), { higiene }, ahora), actividad: { tipo: 'nada', desde: ahora, accion: 'saludo', hasta: ahora + 2500 }, visto: ahora });
  mascotas[yo].frase = r.gano ? '¡Carita limpiecita! ✨' : '¡Algo es algo!';
  setTimeout(() => (mascotas[yo].frase = null), 2600);
  setTimeout(() => hojaLavado(r, record, premio, higiene), 1300);
}

/** Cómo le fue lavándose la cara y quién ha eliminado más gérmenes. */
function hojaLavado(r: { segundos: number; gano: boolean; eliminados: number; nivel: number; jefe: boolean }, record: boolean, premio: number, higiene: number) {
  const l = s?.casa.lavado ?? {};
  const a = l.el ?? 0, b = l.ella ?? 0;
  const lider: Rol | null = a === b ? null : a > b ? 'el' : 'ella';
  const fila = (q: Rol) =>
    `<li class="${lider === q ? 'lider' : ''}"><span class="${caraClase(q)}"></span><b>${nombre(q)}</b><em>${l[q] ? `${l[q]} 🦠` : '—'}</em>${lider === q ? '<i>👑</i>' : ''}</li>`;
  const mm = `${Math.floor(r.segundos / 60)}:${String(Math.floor(r.segundos % 60)).padStart(2, '0')}`;
  abrirHoja(
    r.gano ? '¡Carita limpia!' : 'Lavada a medias',
    `<p class="nota-hoja">${r.gano ? `Aguantaste los 3 minutos` : `Aguantaste ${mm}`}, llegaste a nivel <b>${r.nivel}</b> y eliminaste <b>${r.eliminados}</b> gérmenes${r.jefe ? ', ¡y hasta al Espinillón!' : '.'}${record ? ' <b>¡Nuevo récord!</b>' : ''}</p>
    <p class="nota-hoja">Higiene ${higiene >= 100 ? 'al máximo' : `+${higiene}`}${premio ? ` · +${premio} ${premio === 1 ? 'moneda' : 'monedas'}` : ''}</p>
    <ol class="retrete-records">${fila('el')}${fila('ella')}</ol>`,
    { saldo: s?.casa.monedas },
  );
  if (record || r.gano) lluviaCorazones(12);
}

// ---------------------------------------------------------------------------
// Cocinar: camina a la estufa, se concentra como un chef profesional y la cocina se vuelve un restaurante (tres
// minijuegos al estilo de Papa's: waflería, fresas con crema y frappés). Cada uno lleva su propio progreso.
// ---------------------------------------------------------------------------
const RESTAURANTES: { id: RecetaId; nombre: string; icono: string; plato: string; texto: string }[] = [
  { id: 'wafles', nombre: 'La Waflería', icono: '🧇', plato: 'wafle_chef', texto: 'Wafles en la plancha, toppings y jugos' },
  { id: 'fresas', nombre: 'La Fresería', icono: '🍓', plato: 'fresas_chef', texto: 'Fresas picadas, crema batida y queso' },
  { id: 'frappes', nombre: 'La Frapería', icono: '🥤', plato: 'frape_chef', texto: 'Frappés licuados con crema y salsas' },
];
let cocinando = false;

function hojaCocinar() {
  if (!s) return;
  const prog = s.casa.cocina?.[yo] ?? {};
  const html = `<p class="nota-hoja">${conGenero(yo, 'Hoy eres un|una chef profesional en tu propia cocina: llegan invitados, cocinas lo que piden y te califican. Con las propinas mejoras la cocina; cada día te deja monedas y platos de chef para comer o regalar.')}</p>
    <ul class="restaurantes">${RESTAURANTES.map((r) => {
      const p = prog[r.id];
      const rg = p ? rangoDe(p.xp) : 1;
      return `<li><button class="restaurante" data-cocinar="${r.id}"><span class="ico-rest">${r.icono}</span><b>${r.nombre}</b><small>${r.texto}</small>
        <em>${p ? `Día ${p.dia} · ${nombreRango(rg)}` : '¡Nuevo!'}</em>${(s!.casa.inventario[r.plato] ?? 0) ? `<i>Hay ${s!.casa.inventario[r.plato]} en la despensa</i>` : ''}</button></li>`;
    }).join('')}</ul>`;
  abrirHoja(conGenero(yo, '¿Qué cocinamos, chef?'), html, { saldo: s.casa.monedas });
}

async function cocinar(receta: RecetaId) {
  if (!s || cocinando || lavandose || enCohete) return;
  if (dormido(yo)) return toast(`${nombre(yo)} está durmiendo. Despiértalo primero.`);
  cerrarHoja();
  cocinando = true;
  const m = mascotas[yo];
  const sigue = () => s?.personajes[yo].actividad.accion === 'cocinar';
  const lienzo = $('lienzo');
  let v0: ReturnType<Mundo['vista']> | null = null;
  const ganado = { monedas: 0, platos: 0, dias: 0 };
  // El restaurante se va cargando mientras camina a la estufa
  const modulo = import('./cocina');
  try {
    await hacer('cocinar', 'cocina', 3600, {});
    if (!(await esperarQue(() => !sigue() || m.escenaActual.split('|')[1] === 'cocinar', 25000)) || !sigue()) return;
    // Se soba las manos, se concentra… y la cámara se le acerca
    const frases = ['Concentración total…', 'Hoy cocino como un|una chef profesional', 'Modo chef… activándose', 'La receta secreta de la casa…'];
    m.frase = conGenero(yo, frases[Math.floor(Math.random() * frases.length)]);
    v0 = mundo.vista();
    const meta = m.p.grupo.getWorldPosition(new THREE.Vector3()).setY(1.0);
    const desde = v0.p.clone(), z0 = v0.zoom;
    await animar(1.3, (k) => {
      const e = k * k * (3 - 2 * k);
      mundo.enfocar(desde.clone().lerp(meta, e), z0 + (3.4 - z0) * e, 3.4);
    });
    await pausa(1500);
    if (!sigue()) return;
    m.frase = null;
    const { jugarCocina } = await modulo;
    pausaCasa = true;
    const tapar = setTimeout(() => (lienzo.style.visibility = 'hidden'), 700);
    await jugarCocina({
      rol: yo,
      receta,
      progreso: s.casa.cocina?.[yo]?.[receta] ?? progresoNuevo(),
      pareja: { rol: otro(yo), nombre: nombre(otro(yo)) },
      guardar: async (p, dia) => {
        await guardarCocina(receta, p, dia);
        if (dia) {
          ganado.monedas += dia.monedas;
          ganado.platos += dia.platos;
          ganado.dias++;
        }
      },
    });
    clearTimeout(tapar);
  } finally {
    cocinando = false;
    pausaCasa = false;
    lienzo.style.visibility = '';
    if (v0) {
      const z1 = mundo.vista().zoom, p1 = mundo.vista().p, v = v0;
      void animar(1, (k) => {
        const e = k * k * (3 - 2 * k);
        mundo.enfocar(p1.clone().lerp(v.p, e), z1 + (v.zoom - z1) * e, 3.4);
      });
    }
    if (s && sigue()) {
      const ahora = Date.now();
      await guardarYo({ ...alDia(s.personajes[yo], ahora), actividad: { tipo: 'nada', desde: ahora, accion: 'saludo', hasta: ahora + 2500 }, visto: ahora });
    }
  }
  if (ganado.dias) {
    const r = RESTAURANTES.find((x) => x.id === receta)!;
    toast(`¡Qué chef! +${ganado.monedas} monedas${ganado.platos ? ` y ${ganado.platos} × ${ITEM[r.plato].nombre.toLowerCase()} en la despensa` : ''}`);
    mascotas[yo].frase = conGenero(yo, '¡Soy todo|toda un|una chef!');
    setTimeout(() => (mascotas[yo].frase = null), 3000);
    lluviaCorazones(10);
  }
}

/** Guarda el progreso del restaurante y paga el día (monedas y platos de chef a la despensa). */
async function guardarCocina(receta: RecetaId, p: ProgresoCocina, dia?: ResultadoDia) {
  const plato = RESTAURANTES.find((x) => x.id === receta)!.plato;
  await cambiarCasa((c) => {
    c.cocina = { ...(c.cocina ?? {}), [yo]: { ...(c.cocina?.[yo] ?? {}), [receta]: p } };
    if (dia) {
      c.monedas += dia.monedas;
      if (dia.platos) c.inventario[plato] = (c.inventario[plato] ?? 0) + dia.platos;
    }
  });
}

/** Qué pasa al tocar cada mueble (por el nombre del mueble en el modelo del cuarto). */
const MUEBLES: Partial<Record<Cuarto, [RegExp, string][]>> = {
  sala: [[/^sof/, 'sofa'], [/^televisor/, 'tv']],
  cocina: [[/^(mesa_comedor|silla)/, 'comer'], [/^nevera/, 'notas'], [/^(mes[oó]n|estufa)/, 'cocinar']],
  bano: [[/^tina/, 'banar'], [/^lavamanos/, 'lavar'], [/^inodoro/, 'inodoro']],
  cuarto: [[/^cama/, 'dormir'], [/^cl/, 'closet']],
  patio: [[/^(casita|platos|tina)/, 'perro'], [/^banca/, 'banca']],
  juegos: [[/^arcade/, 'jugar-super'], [/^la_puerta_100/, 'jugar-puertas'], [/^(mesa_de_juegos|puf)/, 'jugar-mesa'], [/^retrete_cohete/, 'retrete']],
  trofeos: [[/^(pedestal|podio|vitrina|placa_titulo|cuadro_honor)/, 'trofeos']],
  cuna: [[/^cuna/, 'cuna'], [/^mecedora/, 'mecedora']],
  cuarto_el: [[/^(escritorio|silla_gamer)/, 'escritorio'], [/^sill/, 'sillon']],
  cuarto_ella: [[/^(tocador|taburete)/, 'tocador'], [/^(estudio|silla)/, 'estudiar'], [/^sill/, 'sillon']],
};

/** La bebé que ya se ve (nombre|desde); null antes de la primera vez. */
let bebeVisto: string | null = null;
let cigueñaEnCamino = false;

/** Pone en 3D lo que dice la casa compartida: pintura, trofeos y la bebé (cada cuarto lo aplica al cargarse, que es
 *  cuando alguien entra o se mira: así el celular no tiene todos los cuartos en memoria). */
function sincronizarAmpliacion() {
  if (!s) return;
  const c = s.casa;
  casa3d.pintar(c.pintura ?? {});
  casa3d.ponerTrofeos(salaTrofeos(c));
  const clave = c.bebe ? `${c.bebe.nombre}|${c.bebe.desde}` : '';
  if (clave !== bebeVisto) {
    // La pidió el otro mientras esta app estaba abierta: también se ve llegar a la cigüeña
    const llego = bebeVisto === '' && !!c.bebe;
    bebeVisto = clave;
    if (llego && !cigueñaEnCamino) void traerBebe(false);
    else if (!cigueñaEnCamino) casa3d.ponerBebe(!!c.bebe);
  }
}

/** Lo mejor de este celular en los minijuegos sube a la casa (nunca baja: se guarda el máximo). */
async function subirLogros() {
  if (!s) return;
  const l = logrosLocales();
  const ya = s.casa.logros?.[yo];
  if (ya && l.super <= ya.super && l.puertas <= ya.puertas && l.mesa <= ya.mesa) return;
  await cambiarCasa((c) => {
    const a = c.logros?.[yo] ?? { super: 0, puertas: 0, mesa: 0 };
    c.logros = { ...c.logros, [yo]: { super: Math.max(a.super, l.super), puertas: Math.max(a.puertas, l.puertas), mesa: Math.max(a.mesa, l.mesa) } };
  });
}

/** Monedas por cada trofeo nuevo (una sola vez por metal, aunque lo vean los dos celulares). */
async function premiosTrofeos(): Promise<string[]> {
  if (!s) return [];
  const msj: string[] = [];
  for (const t of TROFEOS) {
    const nv = nivel(s.casa, t.id);
    for (let k = 1; k <= nv; k++) {
      if (s.casa.diario[`trofeo-${t.id}-${k}`]) continue;
      if (await unaVez(`trofeo-${t.id}-${k}`, PREMIO_TROFEO[k])) msj.push(`¡Trofeo de ${METAL[k].toLowerCase()} en ${t.nombre}! +${PREMIO_TROFEO[k]} monedas`);
    }
  }
  const amor = nivelAmor(s.casa);
  for (let k = 1; k <= amor; k++) {
    if (s.casa.diario[`trofeo-amor-${k}`]) continue;
    if (await unaVez(`trofeo-amor-${k}`, PREMIO_TROFEO[k] * 3)) msj.push(`¡La copa del amor ya es de ${METAL[k].toLowerCase()}! +${PREMIO_TROFEO[k] * 3} monedas`);
  }
  if (msj.length) setTimeout(() => lluviaCorazones(16), 600);
  return msj;
}

function hojaPlano() {
  if (!s) return;
  abrirHoja('Nuestra casa', htmlPlano(s.casa, cuartoVista(), { el: s.personajes.el.cuarto, ella: s.personajes.ella.cuarto }), {
    saldo: s.casa.monedas,
    alCerrar: () => (repintarHoja = null),
  });
  repintarHoja = hojaPlano;
}

const AL_CONSTRUIR: Partial<Record<Cuarto, string>> = {
  trofeos: '¡Sala de trofeos lista! Los que ganen en los minijuegos brillan en los pedestales.',
  cuna: '¡Cuarto del bebé listo! Ahora pueden pedirle una bebé a la cigüeña.',
  cuarto_el: '¡Cuarto de Él listo! Solo Él lo decora y le escoge el color.',
  cuarto_ella: '¡Cuarto de Ella listo! Solo Ella lo decora y le escoge el color.',
};

async function construir(k: Cuarto) {
  const precio = PRECIO_CUARTO[k];
  if (!s || !precio) return;
  if (tieneCuarto(s.casa, k)) return void irACuarto(k);
  if (s.casa.monedas < precio) return toast(`Faltan ${precio - s.casa.monedas} monedas. Se ganan jugando en el cuarto de juegos.`, 3200);
  const ok = await cambiarCasa((c) => {
    if (tieneCuarto(c, k)) return;
    if (c.monedas < precio) throw new Error('ya no alcanzan las monedas');
    c.monedas -= precio;
    c.ampliaciones = [...(c.ampliaciones ?? []), k];
  });
  if (!ok) return;
  cerrarHoja();
  sonido.regalo();
  lluviaCorazones(18);
  toast(AL_CONSTRUIR[k] ?? '¡Cuarto nuevo!', 3800);
  await casa3d.asegurar(k).catch(() => {});
  void irACuarto(k);
}

function hojaTrofeos() {
  if (!s) return;
  abrirHoja('Trofeos', htmlTrofeos(s.casa), { saldo: s.casa.monedas, alCerrar: () => (repintarHoja = null) });
  repintarHoja = hojaTrofeos;
}

/** Va a aplaudirle al mejor trofeo que tengan (o a la copa del amor, si ya brilla). */
function admirar() {
  if (!s) return;
  const n = niveles(s.casa);
  const mejor = nivelAmor(s.casa) > 0 ? 'amor' : [...TROFEOS].sort((a, b) => n[b.id] - n[a.id])[0].id;
  if (mejor !== 'amor' && !n[mejor]) toast('Todavía no hay trofeos: ganen en los minijuegos y aquí aparecen.', 3200);
  sonido.aviso();
  return hacer('usar', 'trofeos', 15, { carino: 3 }, `ver_${mejor}`);
}

// Minijuegos: su personaje va al arcade, a la puerta 100 o a la mesa del parchís y de ahí se entra al juego
const JUEGOS = {
  super: { punto: 'arcade', url: './super.html', nombre: 'Súper Manía' },
  puertas: { punto: 'cien', url: './puertas.html', nombre: 'Cien Puertas' },
  mesa: { punto: 'mesa', url: './mesa.html', nombre: 'los juegos de mesa' },
} as const;
let yendoAJugar = false;

async function jugar(j: keyof typeof JUEGOS) {
  if (!s || yendoAJugar) return;
  if (dormido(yo)) return toast(`${nombre(yo)} está durmiendo. Despiértalo primero.`);
  yendoAJugar = true;
  try {
    const J = JUEGOS[j];
    await hacer('usar', 'juegos', 30, {}, J.punto);
    toast(`¡A jugar ${J.nombre}!`);
    await esperarQue(() => !!s && mascotas[yo].mostrando(s.personajes[yo]), 7000);
    await pausa(1100);
    if (params.has('sin-salir')) (window as any).__salioA = J.url;
    else location.href = J.url;
  } finally {
    setTimeout(() => (yendoAJugar = false), 2500);
  }
}

function hojaBebe() {
  if (!s) return;
  if (!tieneCuarto(s.casa, 'cuna')) return hojaPlano();
  abrirHoja(s.casa.bebe ? s.casa.bebe.nombre : 'La cigüeña', htmlBebe(s.casa), { alCerrar: () => (repintarHoja = null) });
  repintarHoja = null;
}

async function pedirBebe(nombreBebe: string) {
  const n = nombreBebe.trim().replace(/\s+/g, ' ').slice(0, 30);
  if (!s || !n || s.casa.bebe || cigueñaEnCamino) return;
  cigueñaEnCamino = true;
  const ok = await cambiarCasa((c) => {
    if (!c.bebe) c.bebe = { nombre: n, desde: Date.now() };
  });
  cerrarHoja();
  // (la casa ya viene con la bebé que quedó guardada: la mía o la que pidió el otro al mismo tiempo)
  const b = (s as Sincro).casa.bebe;
  if (!ok || !b) {
    cigueñaEnCamino = false;
    return;
  }
  bebeVisto = `${b.nombre}|${b.desde}`;
  await traerBebe(true);
}

/** La cigüeña trae a la bebé (se ve si se está mirando el cuarto del bebé; si no, ya aparece en la cuna). */
async function traerBebe(yoLaPedi: boolean) {
  if (!s?.casa.bebe) return;
  const b = s.casa.bebe;
  cigueñaEnCamino = true;
  try {
    if (casa3d.actual === 'cuna') {
      toast('¡Miren por la ventana! Ahí viene la cigüeña…', 3200);
      sonido.campana();
      await casa3d.cigueña(() => {
        sonido.regalo();
        lluviaCorazones(30);
        toast(`¡Llegó ${b.nombre}! Bienvenida a la casa 💕`, 4200);
        if (yoLaPedi) void hacer('usar', 'cuna', 14, { carino: 15 }, 'cuna');
      });
    } else {
      casa3d.ponerBebe(true);
      lluviaCorazones(20);
      toast(`¡La cigüeña trajo a ${b.nombre}! Está en su cuna, en el cuarto del bebé.`, 4200);
    }
  } finally {
    cigueñaEnCamino = false;
    pintarAcciones();
  }
}

/** Una nanita (la de Brahms) mientras la arrullan o se mecen. */
function nana() {
  const notas = [659, 659, 784, 659, 659, 784, 659, 784, 1046, 988, 880, 880, 784];
  const dur = [0.3, 0.3, 0.9, 0.3, 0.3, 0.9, 0.3, 0.3, 0.6, 0.6, 0.6, 0.6, 1.2];
  let t = 0;
  notas.forEach((f, i) => {
    sonido.nota(f, dur[i] * 0.95, t, 'sine', 0.05);
    t += dur[i];
  });
}

function arrullar() {
  if (!s?.casa.bebe) return hojaBebe();
  nana();
  return hacer('usar', 'cuna', 18, { carino: 8 }, 'cuna');
}

function mimarBebe() {
  if (!s?.casa.bebe) return;
  const n = s.casa.bebe.nombre.split(' ')[0];
  [1318, 1568, 1760, 1568].forEach((f, i) => sonido.nota(f, 0.09, i * 0.09, 'sine', 0.05));
  const frases = [`${n} se ríe`, `${n} te agarra el dedo`, `${n} hace ruiditos`, `${n} bosteza chiquitico`, `${n} sonríe dormida`];
  toast(frases[Math.floor(Math.random() * frases.length)]);
  lluviaCorazones(6);
}

function hojaPintar(k: Cuarto) {
  if (!s) return;
  if (DUENO[k] !== yo) return toast(`Este es el cuarto de ${nombre(DUENO[k] ?? otro(yo))}: solo ${DUENO[k] === 'ella' ? 'ella' : 'él'} lo pinta.`);
  abrirHoja('Pintar las paredes', htmlPintar(s.casa, k), { alCerrar: () => (repintarHoja = null) });
  repintarHoja = () => hojaPintar(k);
}

async function pintarPared(color: string) {
  const k = cuartoVista();
  if (!s || DUENO[k] !== yo) return;
  const ok = await cambiarCasa((c) => {
    const p = { ...(c.pintura ?? {}) };
    if (color) p[k] = color;
    else delete p[k];
    c.pintura = p;
  });
  if (ok) sonido.repuesto();
}

// ---------------------------------------------------------------------------
// La tele de la sala (YouTube con cola de videos)
// ---------------------------------------------------------------------------
let tele: Tele;
let panelRecuerdos: PanelRecuerdos;
let patio: Patio;

/** Recuerdos flotantes: mientras mi personaje se baña (y se ve el baño) o mientras los dos duermen abrazados. */
function revisarRecuerdos() {
  if (!s || !panelRecuerdos) return;
  const accionDe = (r: Rol) => mascotas[r].escenaActual.split('|')[1] ?? '';
  const abrazados = dormido('el') && dormido('ella') && accionDe('el') === 'dormir' && accionDe('ella') === 'dormir';
  // La misma forma de abrazarse en los dos celulares (sale de cuándo se acostaron)
  const variante = abrazados ? (Math.floor(Math.max(s.personajes.el.actividad.desde, s.personajes.ella.actividad.desde) / 1000) % 2 ? 'cucharita' : 'arriba') : null;
  for (const r of ['el', 'ella'] as Rol[]) mascotas[r].abrazarEnCama(variante);
  if (accionDe(yo) === 'banar' && casa3d.actual === 'bano') panelRecuerdos.mostrar('bano');
  else if (abrazados && casa3d.actual === 'cuarto') panelRecuerdos.mostrar('cama');
  else if (panelRecuerdos.visible || accionDe(yo) === '') panelRecuerdos.reiniciar();
}
let teleAntes: EstadoTele = 'apagada';
/** Mientras ven tele se quedan sentados (se renueva de a poco; si se cierra la app, se paran solos). */
const TELE_SEG = 20 * 60;
let teleRenovando = false;

function iniciarTele() {
  tele = new Tele();
  tele.alCambiar = alCambiarTele;
  tele.alTocarMini = () => void verTele(true);
  alCambiarTele();
}

/** «Ver tele»: se sientan y la tele se agranda; si ya está prendida, se puede seguir viendo o apagarla. */
async function verTele(directo = false) {
  if (!s) return;
  if (dormido(yo)) return toast(`${nombre(yo)} está durmiendo. Despiértalo primero.`);
  if (tele.prendida && tele.estado !== 'grande' && !directo) {
    const titulo = tele.actual?.titulo ? `: «${esc(tele.actual.titulo)}»` : '';
    abrirHoja(
      'La tele',
      `<p class="nota-hoja">La tele está prendida${titulo}.</p>
       <div class="menu-casa">
         <button class="accion principal" data-tele-casa="ver">${ico('tv')}<span>Seguir viendo</span></button>
         <button class="accion" data-tele-casa="apagar">${ico('tv')}<span>Apagar la tele</span></button>
       </div>`,
    );
    return;
  }
  cerrarHoja();
  await hacer('tv', 'sala', TELE_SEG, { energia: 4, carino: 2 });
  tele.ver();
}

function alCambiarTele() {
  const e = tele.estado;
  document.body.classList.toggle('en-tele', e === 'grande');
  casa3d.telePrendida(e !== 'apagada');
  // Con la tele prendida la música de la casa se calla para que se oiga el video
  sonido.musica.callar(e !== 'apagada');
  if (e === 'grande' && teleAntes !== 'grande') {
    // La casa queda chiquita en una esquina: los dos en el sofá
    verCuarto('sala');
    const pt = casa3d.puntos('sala');
    const a = pt.sofa_izq ?? pt.centro_izq, b = pt.sofa_der ?? pt.centro_der;
    const centro = aTres((a.x + b.x) / 2, (a.y + b.y) / 2, 0.75);
    mundo.ajustar();
    mundo.enfocar(centro, 2.3);
  } else if (e !== 'grande' && teleAntes === 'grande') {
    mundo.ajustar();
    mundo.fijarZoom(1);
    void levantarseDeTele();
  }
  teleAntes = e;
  pintarAcciones();
}

/** Al levantarse (o apagar) se para del sofá; la tele sigue sonando en la ventanita si no la apagaron. */
async function levantarseDeTele() {
  if (!s || s.personajes[yo].actividad.accion !== 'tv') return;
  const ahora = Date.now();
  await guardarYo({ ...est(yo), actividad: { tipo: 'nada', desde: ahora }, visto: ahora });
}

/** Mientras la tele está en grande siguen sentados: se alarga el rato antes de que se acabe. */
function renovarTele() {
  if (!s || !tele || tele.estado !== 'grande' || teleRenovando) return;
  const act = s.personajes[yo].actividad;
  if (act.accion !== 'tv' || (act.hasta ?? 0) - Date.now() > 5 * 60_000) return;
  teleRenovando = true;
  const ahora = Date.now();
  void guardarYo({ ...est(yo), actividad: { ...act, hasta: ahora + TELE_SEG * 1000 }, visto: ahora }).finally(() => (teleRenovando = false));
}

// ---------------------------------------------------------------------------
// Con la pareja
// ---------------------------------------------------------------------------
function coreografia(tipo: 'caricia' | 'abrazo' | 'beso' | 'regalo' | 'nalgada', de: Rol, item?: string) {
  const para = otro(de);
  // Primero quien recibe (se levanta de donde esté), así quien lo hace llega a su lado
  mascotas[para].interactuar(tipo, mascotas[de], de, item);
  mascotas[de].interactuar(tipo, mascotas[para], de, item);
  vistaPendiente = null;
  verCuarto(mascotas[para].cuarto);
  // (la nalgada suena justo cuando la mano llega: ¡PLAF!)
  if (tipo !== 'nalgada') setTimeout(() => (tipo === 'beso' ? sonido.beso() : tipo === 'regalo' ? sonido.regalo() : sonido.abrazo()), 1500);
}

/** La nalgada: solo la da Él. Súper exagerada: ¡PLAF!, él da vueltitas y ella cae al piso haciendo berrinche. */
async function nalgada() {
  if (!s || yo !== 'el') return;
  if (dormido(yo)) return toast('Primero hay que despertar.');
  if (lejos() || mascotas.el.mimo === 'nalgada') return;
  if (dormido('ella')) return toast('Está dormida… déjala dormir, pícaro 😏');
  cerrarHoja();
  const ahora = Date.now();
  const cuarto = s.personajes.ella.cuarto;
  coreografia('nalgada', 'el');
  await guardarYo({ ...sumar(s.personajes.el, { carino: EFECTO_CARINO.nalgada.mio }, ahora), cuarto, actividad: { tipo: 'nada', desde: ahora }, visto: ahora });
  try {
    await s.enviar('nalgada');
  } catch (err) {
    fallo(err);
  }
}

/** El ¡PLAF! sobre la nalga de ella: estrellitas, la manito marcada, sacudón de pantalla y el sonido. */
function plaf(ella: Mascota) {
  if (!ella.visible) return;
  const v = ella.p.grupo.localToWorld(new THREE.Vector3(0, 0.95, 0));
  const p = mundo.aPantalla(v);
  const e = document.createElement('div');
  e.className = 'plaf';
  e.style.left = `${p.x}px`;
  e.style.top = `${p.y}px`;
  e.innerHTML = Array.from({ length: 10 }, (_, i) => `<span style="--a:${i * 36}deg;--d:${0.35 + (i % 3) * 0.1}s"></span>`).join('') + '<i>🖐️</i><b>¡PLAF!</b>';
  document.body.append(e);
  setTimeout(() => e.remove(), 2200);
  // Zumbido de la mano, el golpe seco y el eco
  sonido.rumor(0.18, 600, 0.05, 0, 0.8, 2400);
  sonido.rumor(0.16, 2600, 0.26, 0.17, 0.5, 900);
  sonido.nota(110, 0.3, 0.17, 'sine', 0.22, 60);
  sonido.nota(1800, 0.12, 0.2, 'triangle', 0.05, 900);
  document.body.classList.remove('sacudon');
  void document.body.offsetWidth;
  document.body.classList.add('sacudon');
  setTimeout(() => document.body.classList.remove('sacudon'), 600);
}

/** Los mimos (y regalar o llevar comida en persona) solo se hacen estando los dos en el mismo cuarto. */
function juntos() {
  return !!s && !!mascotas && mascotas[yo].cuarto === mascotas[otro(yo)].cuarto;
}

function lejos() {
  if (juntos()) return false;
  toast(`Primero ve a donde está ${nombre(otro(yo))}.`);
  return true;
}

/** Un mimo distinto corta el que va; el mismo repetido (doble toque) no se manda dos veces. */
const repetido = (tipo: 'caricia' | 'abrazo' | 'beso' | 'regalo') => mascotas[yo].mimo === tipo;

async function carino(tipo: 'caricia' | 'abrazo' | 'beso') {
  if (!s) return;
  if (dormido(yo)) return toast('Primero hay que despertar.');
  if (lejos() || repetido(tipo)) return;
  cerrarHoja();
  const par = otro(yo);
  const ef = EFECTO_CARINO[tipo];
  const ahora = Date.now();
  const cuarto = s.personajes[par].cuarto;
  coreografia(tipo, yo);
  await guardarYo({ ...sumar(s.personajes[yo], { carino: ef.mio }, ahora), cuarto, actividad: { tipo: 'nada', desde: ahora }, visto: ahora });
  // El cariño de la pareja lo suma su propio celular al recibir el evento (así no se pisa lo que está haciendo)
  try {
    await s.enviar(tipo);
  } catch (err) {
    fallo(err);
  }
}

async function regalar(id: string, mensaje: string) {
  if (!s || (s.casa.inventario[id] ?? 0) <= 0) return;
  if (dormido(yo)) return toast('Primero hay que despertar.');
  if (lejos() || repetido('regalo')) return;
  const par = otro(yo);
  const r = { id: nuevoId(), item: id, de: yo, para: par, mensaje: mensaje.trim().slice(0, 240), t: Date.now(), abierto: false };
  const ok = await cambiarCasa((c) => {
    gastar(c, id);
    c.regalos = [...c.regalos.slice(-29), r];
  });
  if (!ok) return;
  cerrarHoja();
  coreografia('regalo', yo, id);
  const ahora = Date.now();
  await guardarYo({ ...alDia(s.personajes[yo], ahora), cuarto: s.personajes[par].cuarto, actividad: { tipo: 'nada', desde: ahora }, visto: ahora });
  try {
    await s.enviar('regalo', { item: id, regalo: r.id });
  } catch (err) {
    fallo(err);
  }
  toast(`Le mandaste ${ITEM[id].nombre.toLowerCase()} a ${nombre(par)}`);
}

async function mandarComida(id: string) {
  const it = ITEM[id];
  if (!s || !it || (s.casa.inventario[id] ?? 0) <= 0) return;
  if (dormido(yo)) return toast('Primero hay que despertar.');
  if (lejos() || repetido('regalo')) return;
  const par = otro(yo);
  if (!(await cambiarCasa((c) => gastar(c, id)))) return;
  cerrarHoja();
  coreografia('regalo', yo, id);
  const ahora = Date.now();
  await guardarYo({ ...alDia(s.personajes[yo], ahora), cuarto: s.personajes[par].cuarto, actividad: { tipo: 'nada', desde: ahora }, visto: ahora });
  try {
    await s.enviar('comida', { item: id });
  } catch (err) {
    fallo(err);
  }
  toast(`Le llevaste ${it.nombre.toLowerCase()} a ${nombre(par)}`);
}

async function saludar() {
  if (!s) return;
  cerrarHoja();
  await hacer('saludo', s.personajes[yo].cuarto, 3, {});
  try {
    await s.enviar('saludo');
  } catch (err) {
    fallo(err);
  }
}

/** Lo que llega del otro celular. */
const JUEGOS_MESA: Record<string, string> = { dados: 'Dados Party', mancala: 'Mancala', cajas: 'Puntos y Cajas', parchis: 'Parchís', parchis2: 'Parchís a 2 colores' };

function alEvento(e: Evento) {
  if (e.de === yo) return;
  const quien = nombre(e.de);
  sonido.aviso();
  const item = typeof e.datos.item === 'string' && ITEM[e.datos.item] ? e.datos.item : undefined;
  switch (e.tipo) {
    case 'caricia':
    case 'abrazo':
    case 'beso':
      coreografia(e.tipo, e.de);
      toast(e.tipo === 'caricia' ? `${quien} te hizo una caricia` : e.tipo === 'abrazo' ? `${quien} te dio un abrazo` : `${quien} te dio un beso`);
      break;
    case 'regalo':
      coreografia('regalo', e.de, item);
      toast(`¡${quien} te trajo un regalo! Tócalo para abrirlo.`, 3400);
      break;
    case 'nalgada':
      coreografia('nalgada', e.de);
      toast(`¡${quien} te dio una nalgada! 😤🍑`, 3400);
      break;
    case 'comida':
      coreografia('regalo', e.de, item);
      toast(`${quien} te trajo ${item ? ITEM[item].nombre.toLowerCase() : 'comida'}`);
      break;
    case 'nota':
      toast(`${quien} te dejó una nota en la nevera`, 3200);
      break;
    case 'auxilio': {
      const ev = EVENTOS_BANO.find((x) => x.id === e.datos.evento);
      if (ev && Date.now() - e.t < 5 * 60_000) hojaAuxilio(e.de, ev);
      break;
    }
    case 'rescate':
      toast(`¡${quien} vino a rescatarte! 💖`, 3200);
      void rescatado(e.de);
      break;
    case 'saludo':
      toast(`${quien} te está saludando`);
      break;
    case 'voz':
      // Suena como una llamada si la app está a la vista y no se está en medio de algo
      if (document.visibilityState === 'visible' && !hojaAbierta() && $('llamada')?.hidden !== false) void contestarVoz(String(e.datos.voz ?? ''), true);
      else toast(`${quien} te dejó un mensaje de voz`, 3400);
      break;
    case 'juego': {
      // Invitación a atender la tienda juntos, cada uno en su celular (Súper Manía en línea)
      if (e.datos.juego === 'super') {
        if (Date.now() - e.t > 3 * 60_000) break;
        const nivel = Number(e.datos.nivel) || 1;
        const url = `./super.html?unirse=${encodeURIComponent(String(e.datos.id ?? ''))}`;
        abrirHoja('¡A la tienda!', `<p class="nota-hoja">${quien} te invita a atender el súper juntos: <b>${e.datos.legendario ? 'Legendario' : 'Nivel'} ${nivel}</b>, cada uno desde su celular.</p>
          <div class="fila-botones"><a class="boton boton-tomate" href="${url}">¡Vamos!</a></div>`);
        break;
      }
      // Invitación a la mesa de juegos (vale unos minutos)
      const j = JUEGOS_MESA[String(e.datos.juego)];
      if (!j || Date.now() - e.t > 3 * 60_000) break;
      const url = `./mesa.html?modo=linea&juego=${encodeURIComponent(String(e.datos.juego))}&unirse=${encodeURIComponent(String(e.datos.id ?? ''))}&empieza=${e.datos.empieza === 'ella' ? 'ella' : 'el'}`;
      abrirHoja('¡A jugar!', `<p class="nota-hoja">${quien} te invita a una partida de <b>${j}</b>.</p>
        <div class="fila-botones"><a class="boton boton-tomate" href="${url}">¡Juguemos!</a></div>`);
      break;
    }
  }
  escribir(CLAVE_VISTO(yo), Date.now());
  void aplicarPendientes();
}

// ---------------------------------------------------------------------------
// Mensajes de voz (se regalan por monedas y suenan como una llamada)
// ---------------------------------------------------------------------------
const MAX_VOCES = () => (s?.modo === 'local' ? 6 : 30);

function vozPendiente() {
  return s?.casa.voces.find((v) => v.para === yo && !v.oida) ?? null;
}

let grabandoVoz = false;
async function mandarVoz() {
  if (!s || grabandoVoz) return;
  if (dormido(yo)) return toast('Primero hay que despertar.');
  const par = otro(yo);
  cerrarHoja();
  grabandoVoz = true;
  try {
    const g = await grabarMensaje({ para: par, nombre: nombre(par), precio: PRECIO_VOZ, monedas: s.casa.monedas });
    if (!g || !s) return;
    const id = nuevoId();
    let ref: string;
    try {
      ref = await s.subirVoz(id, g.blob);
    } catch (err) {
      return fallo(err);
    }
    const v = { id, de: yo, para: par, ref, dur: Math.round(g.dur * 10) / 10, t: Date.now(), oida: false };
    const ok = await cambiarCasa((c) => {
      if (c.monedas < PRECIO_VOZ) throw new Error(`faltan monedas (el mensaje cuesta ${PRECIO_VOZ})`);
      c.monedas -= PRECIO_VOZ;
      c.voces = [...c.voces.filter((x) => x.id !== id), v].slice(-MAX_VOCES());
    });
    if (!ok) return;
    try {
      await s.enviar('voz', { voz: id });
    } catch (err) {
      fallo(err);
    }
    sonido.regalo();
    toast(`Le dejaste un mensaje de voz a ${nombre(par)}`);
  } finally {
    grabandoVoz = false;
  }
}

/** Contesta un mensaje (sonando primero como llamada si `sonar`). Sin id, el primero que falte por oír. */
let contestando = false;
async function contestarVoz(id: string, sonar: boolean) {
  if (!s || contestando) return;
  contestando = true;
  try {
    let v = id ? s.casa.voces.find((x) => x.id === id) : vozPendiente();
    // El aviso puede llegar antes que la casa con el mensaje: se espera un momento y se vuelve a leer
    for (let i = 0; !v && id && i < 3; i++) {
      await new Promise((ok) => setTimeout(ok, 1200));
      if (i === 1) await s.refrescar().catch(() => {});
      v = s.casa.voces.find((x) => x.id === id);
    }
    if (!v) return toast(`${nombre(otro(yo))} te dejó un mensaje de voz: está en el buzón.`);
    if (sonar && !(await llamadaEntrante({ de: v.de, nombre: nombre(v.de), dur: v.dur }))) {
      pintarAcciones();
      return;
    }
    await oirVoz(v.id);
  } finally {
    contestando = false;
  }
}

async function oirVoz(id: string) {
  const v = s?.casa.voces.find((x) => x.id === id);
  if (!s || !v) return;
  cerrarHoja();
  let url: string;
  try {
    url = await s.urlVoz(v.ref);
  } catch (err) {
    return fallo(err);
  }
  const nueva = v.para === yo && !v.oida;
  if (nueva) {
    let marcada = false;
    await cambiarCasa((c) => {
      marcada = false;
      const x = c.voces.find((y) => y.id === id);
      if (x && !x.oida) x.oida = marcada = true;
    });
    if (marcada) {
      await guardarYo(sumar(s.personajes[yo], { carino: CARINO_VOZ }));
      lluviaCorazones(10);
    }
  }
  const r = await enLlamada({ de: v.de, nombre: nombre(v.de), url, dur: v.dur, puedeResponder: v.de !== yo });
  if (r === 'responder') await mandarVoz();
}

function hojaBuzon() {
  if (!s) return;
  const pintar = () => {
    const voces = [...s!.casa.voces].reverse();
    const html = `<p class="nota-hoja">Mensajes de voz de la casa. Dejar uno cuesta ${PRECIO_VOZ} monedas; a quien lo recibe le suena como una llamada.</p>
      <button class="boton boton-rosa" data-hoja="voz">Dejarle un mensaje a ${esc(nombre(otro(yo)))}</button>
      <ul class="buzon">${voces.length ? voces
        .map((v) => `<li class="${v.para === yo && !v.oida ? 'nueva' : ''}"><span class="chip-cara ${caraClase(v.de)}"></span>
          <div><b>${v.de === yo ? `Para ${esc(nombre(v.para))}` : `De ${esc(nombre(v.de))}`}</b><small>${new Date(v.t).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · ${haceCuanto(v.t)} · ${Math.max(1, Math.round(v.dur))} s</small></div>
          <button class="boton-redondo boton-oir" data-oir-voz="${esc(v.id)}" aria-label="Oír"></button></li>`)
        .join('') : '<li class="vacio">Todavía no hay mensajes.</li>'}</ul>`;
    abrirHoja('Buzón de voz', html, { saldo: s!.casa.monedas, alCerrar: () => (repintarHoja = null) });
  };
  repintarHoja = pintar;
  pintar();
}

function regaloPendiente() {
  return s?.casa.regalos.find((r) => r.para === yo && !r.abierto) ?? null;
}

let abriendoRegalo = false;
async function abrirRegalo() {
  if (abriendoRegalo) return;
  abriendoRegalo = true;
  try {
    await abrirRegaloDeVerdad();
  } finally {
    abriendoRegalo = false;
  }
}

async function abrirRegaloDeVerdad() {
  const r = regaloPendiente();
  if (!s || !r) return;
  const it = ITEM[r.item];
  let extra = '';
  let sorpresa: string | null = null;
  if (r.item === 'cajita') {
    const comidas = CATALOGO.filter((i) => i.tipo === 'comida' && i.precio >= 2);
    sorpresa = comidas[Math.floor(Math.random() * comidas.length)].id;
    extra = `Adentro había: ${ITEM[sorpresa].nombre}. Quedó en la despensa.`;
  }
  const deco = r.item === 'osito' ? 'osito_deco' : null;
  if (deco) extra = 'El osito quedó guardado para decorar la casa.';
  if (it?.cocina) extra = `¡Lo cocinó con sus propias manos en su cocina de chef! Te lo comiste de una.`;
  let abierto = false;
  const ok = await cambiarCasa((c) => {
    abierto = false;
    const x = c.regalos.find((g) => g.id === r.id);
    // Si ya lo abrió (en otro celular o con otro toque), no se repite lo de adentro
    if (!x || x.abierto) return;
    x.abierto = true;
    abierto = true;
    if (sorpresa) c.inventario[sorpresa] = (c.inventario[sorpresa] ?? 0) + 1;
    if (deco) c.inventario[deco] = (c.inventario[deco] ?? 0) + 1;
  });
  if (!ok || !abierto) return;
  // Un plato de chef regalado llena y además sabe a amor
  await guardarYo(sumar(s.personajes[yo], it?.cocina ? { ...it.efecto, carino: (it.efecto?.carino ?? 0) + 15 } : it?.efecto ?? { carino: 10 }));
  sonido.regalo();
  ventana(`
    <h2>${esc(nombre(r.de))} te regaló</h2>
    <img class="regalo-img" src="${it ? iconoItem(it) : ''}" alt="">
    <p><b>${esc(it?.nombre ?? 'Un regalo')}</b></p>
    ${r.mensaje ? `<p class="mensaje-regalo">«${esc(r.mensaje)}»</p>` : ''}
    ${extra ? `<p class="nota-hoja">${esc(extra)}</p>` : ''}
    <div class="fila-botones" style="justify-content:center"><button class="boton boton-rosa" data-cerrar>Gracias, mi amor</button></div>`);
  lluviaCorazones(14);
}

// ---------------------------------------------------------------------------
// Cuartos, botones y HUD
// ---------------------------------------------------------------------------
/** Los cuartos propios solo los decora su dueño. */
const puedeDecorar = (c: Cuarto) => !DUENO[c] || DUENO[c] === yo;

function verCuarto(c: Cuarto) {
  if (c !== 'patio' && patio?.activo) patio.salir();
  casa3d.mostrar(c);
  if (c === 'patio') patio?.sincronizar();
  if (decorando) casa3d.modoDecorar(true, puedeDecorar);
  pintarCuartos();
  pintarAcciones();
}

/** Cambio de cuarto con su personaje a la vista: la cámara espera a que llegue a la puerta y salga, y lo sigue. */
let vistaPendiente: { cuarto: Cuarto; hasta: number } | null = null;
const cuartoVista = (): Cuarto => vistaPendiente?.cuarto ?? casa3d.actual;

/** La vista sigue a mi personaje al cuarto `c`: si se le ve salir, primero se ve caminar hasta la puerta. */
function seguir(c: Cuarto) {
  if (c === casa3d.actual) {
    vistaPendiente = null;
    return verCuarto(c);
  }
  if (mascotas[yo].visible && s?.personajes[yo].cuarto !== c) {
    // Se cambia de cuarto cuando cruza la puerta (el tope es solo por si algo lo detiene en el camino)
    vistaPendiente = { cuarto: c, hasta: performance.now() + 15000 };
    pintarCuartos();
    pintarAcciones();
  } else {
    vistaPendiente = null;
    verCuarto(c);
  }
}

/** ¿Ya salió por la puerta (o se acabó la espera)? Entonces se muestra el cuarto nuevo, donde entra caminando. */
function revisarVista() {
  const v = vistaPendiente;
  if (!v || !s) return;
  if (mascotas[yo].cuarto === v.cuarto || performance.now() >= v.hasta || s.personajes[yo].cuarto !== v.cuarto) {
    vistaPendiente = null;
    verCuarto(v.cuarto);
  }
}

/** Pestaña de un cuarto: su personaje camina hasta allá (sale por la puerta y entra por la del otro cuarto).
 *  Dormido no se levanta: solo se mira el cuarto. */
async function irACuarto(c: Cuarto) {
  if (!s) return;
  if (dormido(yo) || s.personajes[yo].cuarto === c) {
    vistaPendiente = null;
    return verCuarto(c);
  }
  const ahora = Date.now();
  seguir(c);
  await guardarYo({ ...est(yo), cuarto: c, actividad: { tipo: 'nada', desde: ahora }, visto: ahora });
}

/** Cambia el HTML solo si cambió (así un toque no se pierde porque el botón se reemplazó justo entonces). */
function html(el: HTMLElement, h: string) {
  if (el.dataset.html !== h) {
    el.innerHTML = h;
    el.dataset.html = h;
  }
}

/** Pestañas de los cuartos construidos (se desplazan de lado si no caben) y, primero, el plano de la casa. */
function pintarCuartos() {
  const cont = $('cuartos');
  const antes = cont.dataset.html;
  const lista = CUARTOS.filter((c) => !s || tieneCuarto(s.casa, c));
  html(cont, `<button class="cuarto-tab plano-tab" data-plano aria-label="Plano de la casa">${ico('casa')}</button>` + lista.map((c) => {
    const quien = s ? (['el', 'ella'] as Rol[]).filter((r) => s!.personajes[r].cuarto === c) : [];
    return `<button class="cuarto-tab" data-cuarto="${c}" aria-current="${c === cuartoVista()}">${CORTO[c] ?? NOMBRE_CUARTO[c]}${
      quien.length ? `<span class="quien">${quien.map((r) => `<span class="${caraClase(r)}"></span>`).join('')}</span>` : ''
    }</button>`;
  }).join(''));
  // Que la pestaña del cuarto a la vista no quede escondida a un lado
  if (cont.dataset.html !== antes) cont.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

type Boton = { id: string; texto: string; icono: string; principal?: boolean; activo?: boolean };

function botonesCuarto(): Boton[] {
  if (!s) return [];
  if (dormido(yo)) return [{ id: 'despertar', texto: 'Despertar', icono: ico('despertar'), principal: true }];
  const b: Boton[] = [];
  switch (cuartoVista()) {
    case 'sala':
      b.push({ id: 'sofa', texto: 'Descansar', icono: ico('sofa') }, { id: 'tv', texto: tele?.prendida ? 'Tele prendida' : 'Ver tele', icono: ico('tv'), activo: !!tele?.prendida });
      break;
    case 'cocina':
      b.push(
        { id: 'comer', texto: 'Comer', icono: `<img src="${iconoItem(ITEM.pan)}" alt="">`, principal: true },
        { id: 'cocinar', texto: 'Cocinar', icono: `<span class="ico ico-emoji">${yo === 'el' ? '👨‍🍳' : '👩‍🍳'}</span>` },
        { id: 'notas', texto: 'Notas', icono: ico('nota') },
      );
      break;
    case 'bano':
      b.push(
        { id: 'banar', texto: 'Bañarse', icono: ico('tina'), principal: !s.personajes[yo].apuro },
        { id: 'lavar', texto: 'Lavarse', icono: ico('lavar') },
        { id: 'inodoro', texto: 'Ir al baño', icono: ico('inodoro'), principal: !!s.personajes[yo].apuro },
      );
      break;
    case 'cuarto':
      b.push({ id: 'dormir', texto: 'Dormir', icono: ico('luna'), principal: true }, { id: 'closet', texto: 'Cambiarse', icono: ico('closet') });
      break;
    case 'juegos':
      b.push(
        { id: 'jugar-super', texto: 'Súper Manía', icono: '<img src="./modelos/iconos/caja_frutas.png" alt="">', principal: true },
        { id: 'jugar-puertas', texto: 'Cien Puertas', icono: ico('puerta') },
        { id: 'jugar-mesa', texto: 'Juegos de mesa', icono: '<img src="./modelos/iconos/mesa_juegos.svg" alt="">' },
      );
      break;
    case 'patio': {
      const perro = s.casa.perro;
      b.push(
        perro
          ? { id: 'perro', texto: `Jugar con ${perro.nombre}`, icono: '<span class="ico ico-emoji">🐶</span>', principal: true }
          : { id: 'adoptar', texto: 'Adoptar un perrito', icono: '<span class="ico ico-emoji">🐶</span>', principal: true },
        { id: 'banca', texto: 'Sentarse', icono: ico('sofa') },
      );
      break;
    }
    case 'trofeos':
      b.push({ id: 'trofeos', texto: 'Ver trofeos', icono: ico('trofeo'), principal: true }, { id: 'admirar', texto: 'Admirar', icono: ico('aplauso') });
      break;
    case 'cuna':
      if (s.casa.bebe) b.push({ id: 'arrullar', texto: `Arrullar a ${s.casa.bebe.nombre.split(' ')[0]}`, icono: ico('bebe'), principal: true });
      else b.push({ id: 'pedir-bebe', texto: 'Pedir a la cigüeña', icono: ico('cigueña'), principal: true });
      b.push({ id: 'mecedora', texto: 'Mecedora', icono: ico('mecedora') });
      break;
    case 'cuarto_el':
    case 'cuarto_ella': {
      const c = cuartoVista();
      if (c === 'cuarto_el') b.push({ id: 'escritorio', texto: 'Computador', icono: ico('pc') });
      else b.push({ id: 'tocador', texto: 'Tocador', icono: ico('espejo') }, { id: 'estudiar', texto: 'Estudiar', icono: ico('libro') });
      b.push({ id: 'sillon', texto: 'Sillón', icono: ico('sofa') });
      if (DUENO[c] === yo) b.push({ id: 'pintar', texto: 'Pintar', icono: ico('pintar') });
      break;
    }
  }
  return b;
}

function pintarAcciones() {
  const cont = $('acciones');
  if (!s) return html(cont, '');
  const b = [
    ...botonesCuarto(),
    // Consentir a la pareja: solo cuando están en el mismo cuarto
    ...(juntos() ? [{ id: 'pareja', texto: nombre(otro(yo)), icono: ico('carino') }] : []),
    // (el cuarto propio del otro no se decora: ni aparece el botón)
    ...(decorando || puedeDecorar(cuartoVista()) ? [{ id: 'decorar', texto: decorando ? 'Listo' : 'Decorar', icono: ico('decorar'), activo: decorando }] : []),
    { id: 'tienda', texto: 'Tienda', icono: ico('tienda') },
  ];
  if (vozPendiente()) b.unshift({ id: 'oir-voz', texto: 'Mensaje de voz', icono: ico('telefono'), principal: true });
  if (regaloPendiente()) b.unshift({ id: 'abrir-regalo', texto: 'Abrir regalo', icono: `<img src="${iconoItem(ITEM.cajita)}" alt="">`, principal: true });
  botones(cont, b.map((x) => ({
    id: x.id,
    h: `<button class="accion${x.principal ? ' principal' : ''}${x.activo ? ' activa' : ''}" data-accion="${x.id}">${x.icono}<span>${esc(x.texto)}</span></button>`,
  })));
}

/** Pone los botones sin rehacer los que no cambiaron (el de la pareja entra y sale seguido: los demás no se reemplazan
 *  bajo el dedo). */
function botones(cont: HTMLElement, lista: { id: string; h: string }[]) {
  const todo = lista.map((x) => x.h).join('');
  if (cont.dataset.html === todo) return;
  cont.dataset.html = todo;
  const viejos = new Map<string, HTMLElement>();
  for (const e of Array.from(cont.children) as HTMLElement[]) viejos.set(e.dataset.accion ?? '', e);
  let ref = cont.firstElementChild;
  for (const { id, h } of lista) {
    let e = viejos.get(id);
    if (e && e.dataset.h === h) viejos.delete(id);
    else {
      const t = document.createElement('template');
      t.innerHTML = h;
      e = t.content.firstElementChild as HTMLElement;
      e.dataset.h = h;
    }
    if (e === ref) ref = ref.nextElementSibling;
    else cont.insertBefore(e, ref);
  }
  for (const e of viejos.values()) e.remove();
}

function pintarTodo() {
  if (!s) return;
  const e = est(yo);
  pintarNecesidades($('necesidades'), e);
  $('hud-monedas').textContent = String(s.casa.monedas);
  $('pareja-linea').classList.toggle('si', s.enLinea[otro(yo)]);
  $('pareja-linea').title = s.enLinea[otro(yo)] ? 'En línea ahora' : 'No está conectado ahora';
  pintarCuartos();
  pintarAcciones();
  pintarFecha();
}

function proximaFecha(): { nombre: string; dias: number } | null {
  if (!s) return null;
  const lista: { nombre: string; dias: number }[] = [];
  if (s.casa.aniversario) {
    const d = diasPara(s.casa.aniversario, true);
    if (d !== null) lista.push({ nombre: 'nuestro aniversario', dias: d });
  }
  for (const f of s.casa.fechas) {
    const d = diasPara(f.fecha, f.cadaAno);
    if (d !== null && d >= 0) lista.push({ nombre: f.nombre, dias: d });
  }
  lista.sort((a, b) => a.dias - b.dias);
  return lista[0] ?? null;
}

function pintarFecha() {
  const f = proximaFecha();
  const p = $('hud-fecha');
  p.hidden = !f || f.dias > 30;
  if (f) p.textContent = f.dias === 0 ? `¡Hoy es ${f.nombre}!` : f.dias === 1 ? `Mañana es ${f.nombre}` : `Faltan ${f.dias} días para ${f.nombre}`;
}

async function alAccion(id: string) {
  sonido.activar();
  sonido.toque();
  if (!s) return;
  switch (id) {
    case 'despertar':
      return despertar();
    case 'sofa':
      return hacer('sofa', 'sala', 10, { energia: 8 });
    case 'tv':
      return verTele();
    case 'comer':
      return elegirComida('comer');
    case 'notas':
      void hacer('nevera', 'cocina', 6, {});
      return hojaNotas();
    case 'banar':
      sonido.burbuja();
      // Un bañito largo: mientras tanto salen recuerdos de los dos
      await hacer('banar', 'bano', 55, { higiene: 100 });
      for (let i = 1; i < 6; i++) setTimeout(() => sonido.burbuja(), i * 700);
      return;
    case 'lavar':
      return lavarse();
    case 'cocinar':
      return hojaCocinar();
    case 'inodoro':
      return irAlBano();
    case 'dormir':
      return dormir();
    case 'closet':
      hojaCloset('arriba');
      return hacer('closet', 'cuarto', 5, { higiene: 12 });
    case 'pareja':
      return hojaPareja();
    case 'adoptar':
      return patio.hojaAdoptar();
    case 'perro':
      return patio.activar();
    case 'banca':
      return hacer('usar', 'patio', 25, { energia: 4, carino: 2 }, 'banca');
    case 'jugar-super':
      return jugar('super');
    case 'jugar-puertas':
      return jugar('puertas');
    case 'jugar-mesa':
      return jugar('mesa');
    case 'retrete':
      // El retrete espacial es secreto (sale solo cuando algo le cae pesado): el cohete de adorno es para sentarse
      return hacer('usar', 'juegos', 12, {}, 'cohete');
    case 'trofeos':
      return hojaTrofeos();
    case 'admirar':
      return admirar();
    case 'pedir-bebe':
      return hojaBebe();
    case 'arrullar':
      return arrullar();
    case 'mecedora':
      nana();
      return hacer('usar', 'cuna', 25, { energia: 6, carino: 4 }, 'mecedora');
    case 'escritorio':
      return hacer('usar', 'cuarto_el', 20, {}, 'escritorio');
    case 'tocador':
      sonido.limpio();
      return hacer('usar', 'cuarto_ella', 15, { higiene: 8 }, 'tocador');
    case 'estudiar':
      return hacer('usar', 'cuarto_ella', 25, {}, 'estudiar');
    case 'sillon':
      return hacer('usar', cuartoVista(), 20, { energia: 6 }, 'sillon');
    case 'pintar':
      return hojaPintar(cuartoVista());
    case 'decorar':
      decorando = !decorando;
      casa3d.modoDecorar(decorando, puedeDecorar);
      if (decorando) toast('Toca un aro rojo para poner decoración. Compra más en la tienda.');
      return pintarAcciones();
    case 'tienda':
      return hojaTienda('comida');
    case 'abrir-regalo':
      return abrirRegalo();
    case 'oir-voz':
      return contestarVoz('', false);
  }
}

// ---------------------------------------------------------------------------
// Hojas
// ---------------------------------------------------------------------------
let repintarHoja: (() => void) | null = null;

function tarjetaItem(it: Item, pie: string, extra = '') {
  const efecto = it.efecto
    ? Object.entries(it.efecto)
        .map(([k, v]) => `+${v} ${NOMBRE_NECESIDAD[k as Necesidad].toLowerCase()}`)
        .join(' · ')
    : '';
  return `<li class="item" ${extra}><img src="${iconoItem(it)}" alt=""><b>${esc(it.nombre)}</b><small>${esc(it.texto ?? efecto)}</small><div class="fila-item">${pie}</div></li>`;
}

function hojaTienda(tab: TipoItem) {
  const pintar = () => {
    if (!s) return;
    if (tab === 'ropa' || tab === 'disfraz') return tiendaRopa(tab);
    if (tab === 'deco') return tiendaDeco();
    const lista = CATALOGO.filter((i) => i.tipo === tab && i.id !== 'osito_deco' && !i.cocina);
    const html = `<p class="nota-hoja">Las monedas son de los dos. Se ganan con el bono de cada día y jugando los minijuegos (el súper, Cien Puertas y los juegos de mesa).</p>
      <ul class="catalogo-casa">${lista
        .map((it) =>
          tarjetaItem(it, `<span class="tengo">${s!.casa.inventario[it.id] ? `Tienen ${s!.casa.inventario[it.id]}` : ''}</span>
            <button class="boton-precio-casa" data-comprar="${it.id}" ${s!.casa.monedas < it.precio ? 'disabled' : ''}><i class="moneda"></i>${it.precio}</button>`),
        )
        .join('')}</ul>`;
    abrirHoja('Tienda de la casa', html, {
      mantener: true,
      saldo: s.casa.monedas,
      pestanas: PESTANAS_TIENDA,
      activa: tab,
      alPestana: (p) => hojaTienda(p as TipoItem),
      alCerrar: () => (repintarHoja = null),
    });
  };
  repintarHoja = pintar;
  pintar();
}

// ---------------------------------------------------------------------------
// Decoración: conceptos para el cuarto propio (gamer, griego, egipcio…) y piezas sueltas por sitio
// ---------------------------------------------------------------------------
type FiltroDeco = 'conceptos' | TipoSitio;
const FILTROS_DECO: { id: FiltroDeco; nombre: string }[] = [
  { id: 'conceptos', nombre: 'Conceptos' },
  { id: 'cuadro', nombre: 'Pared' },
  { id: 'mesa', nombre: 'Mesa' },
  { id: 'piso', nombre: 'Piso' },
  { id: 'peluche', nombre: 'Peluches' },
];
let filtroDeco: FiltroDeco = 'conceptos';
/** El item de lo que hay puesto en un sitio («cuadro_foto:<foto>», «neon_gg#35f0ff»…). */
const itemDeClave = (clave: string) => clave.split(/[:#]/)[0];
const miCuarto = (): Cuarto => (yo === 'el' ? 'cuarto_el' : 'cuarto_ella');

/** ¿Tienen todas las piezas del concepto? (guardadas o ya puestas en mi cuarto) */
function tienePiezas(con: Concepto) {
  if (!s) return false;
  const k = miCuarto();
  const puestas: Record<string, number> = {};
  for (const st of casa3d.dato.cuartos[k]?.sitios ?? []) {
    const v = s.casa.deco[st.id];
    if (v) puestas[itemDeClave(v)] = (puestas[itemDeClave(v)] ?? 0) + 1;
  }
  const falta: Record<string, number> = {};
  for (const p of piezasConcepto(con)) falta[p.id] = (falta[p.id] ?? 0) + 1;
  return Object.entries(falta).every(([id, n]) => (s!.casa.inventario[id] ?? 0) + (puestas[id] ?? 0) >= n);
}

function tiendaDeco() {
  if (!s) return;
  const k = miCuarto();
  const hayCuarto = tieneCuarto(s.casa, k);
  let html = chips(FILTROS_DECO, filtroDeco, 'filtro-deco');
  if (filtroDeco === 'conceptos') {
    html += `<p class="nota-hoja">Un concepto trae las 9 piezas para tu cuarto y le pinta las paredes (con 30 % de descuento). Todo queda guardado:
      después puedes mezclar piezas de varios conceptos en «Decorar». ${hayCuarto ? '' : '<b>Primero construyan tu cuarto en «Ampliar la casa».</b>'}</p>
      <ul class="conceptos">${CONCEPTOS.map((con) => {
        const precio = precioConcepto(con);
        const tiene = tienePiezas(con);
        const iconos = piezasConcepto(con).map((p) => `<img src="${iconoItem(ITEM[p.id])}" alt="" loading="lazy">`).join('');
        const botones = (tiene ? '' : `<button class="boton-precio-casa" data-comprar-concepto="${con.id}" ${s!.casa.monedas < precio ? 'disabled' : ''}><i class="moneda"></i>${precio}</button>`) +
          (tiene && hayCuarto ? `<button class="boton boton-chico boton-menta" data-poner-concepto="${con.id}">Poner en mi cuarto</button>` : '') +
          (tiene && !hayCuarto ? '<span class="tengo">Lo tienen</span>' : '');
        return `<li class="concepto"><div class="concepto-cabeza" style="--pared:${con.pared}"><b>${esc(con.nombre)}</b><small>${esc(con.texto)}</small></div>
          <div class="concepto-piezas">${iconos}</div><div class="fila-item">${botones}</div></li>`;
      }).join('')}</ul>`;
  } else {
    const lista = paraSitio(filtroDeco).filter((i) => i.id !== 'osito_deco');
    html += `<p class="nota-hoja">Las monedas son de los dos. Lo que compran queda guardado para ponerlo con «Decorar».</p>
      <ul class="catalogo-casa">${lista
        .map((it) =>
          tarjetaItem(it, `<span class="tengo">${s!.casa.inventario[it.id] ? `Tienen ${s!.casa.inventario[it.id]}` : ''}</span>
            <button class="boton-precio-casa" data-comprar="${it.id}" ${s!.casa.monedas < it.precio ? 'disabled' : ''}><i class="moneda"></i>${it.precio}</button>`),
        )
        .join('')}</ul>`;
  }
  abrirHoja('Tienda de la casa', html, {
    mantener: true,
    saldo: s.casa.monedas,
    pestanas: PESTANAS_TIENDA,
    activa: 'deco',
    alPestana: (p) => hojaTienda(p as TipoItem),
    alCerrar: () => (repintarHoja = null),
  });
}

async function comprarConcepto(id: string) {
  const con = CONCEPTOS.find((x) => x.id === id);
  if (!s || !con) return;
  const precio = precioConcepto(con);
  if (s.casa.monedas < precio) return toast('No alcanzan las monedas.');
  const ok = await cambiarCasa((c) => {
    if (c.monedas < precio) throw new Error('No alcanzan las monedas.');
    c.monedas -= precio;
    for (const p of piezasConcepto(con)) c.inventario[p.id] = (c.inventario[p.id] ?? 0) + 1;
  });
  if (!ok) return;
  sonido.caja();
  // Si ya tiene su cuarto, queda puesto de una
  if (tieneCuarto(s.casa, miCuarto())) await ponerConcepto(id);
  else toast(`Compraron el concepto ${con.nombre}. Queda guardado para tu cuarto.`);
}

/** Pone las 9 piezas del concepto en mi cuarto (lo que había vuelve al inventario) y pinta las paredes. */
async function ponerConcepto(id: string) {
  const con = CONCEPTOS.find((x) => x.id === id);
  if (!s || !con) return;
  const k = miCuarto();
  if (!tieneCuarto(s.casa, k)) return toast('Primero construyan tu cuarto en «Ampliar la casa».');
  const sitios = casa3d.dato.cuartos[k]?.sitios ?? [];
  const ok = await cambiarCasa((c) => {
    for (const st of sitios) {
      const antes = c.deco[st.id];
      if (!antes) continue;
      const it = itemDeClave(antes);
      c.inventario[it] = (c.inventario[it] ?? 0) + 1;
      delete c.deco[st.id];
    }
    const libres: Record<string, string[]> = {};
    for (const st of sitios) (libres[st.tipo] ??= []).push(st.id);
    for (const p of piezasConcepto(con)) {
      const sitio = libres[p.tipo]?.shift();
      if (!sitio || (c.inventario[p.id] ?? 0) <= 0) continue;
      gastar(c, p.id);
      c.deco[sitio] = p.id;
    }
    c.pintura = { ...(c.pintura ?? {}), [k]: con.pared };
  });
  if (!ok) return;
  cerrarHoja();
  sonido.repuesto();
  lluviaCorazones(8);
  toast(`¡Tu cuarto quedó ${con.nombre.toLowerCase()}!`);
  if (casa3d.actual !== k) void irACuarto(k);
}

/** Cambia el color de lo que se puede pintar (neón, LED, lava…) sin gastar nada. */
async function pintarDeco(sitio: string, color: string) {
  if (!s) return;
  const ok = await cambiarCasa((c) => {
    const antes = c.deco[sitio];
    if (!antes || !ITEM[itemDeClave(antes)]?.tintable) return;
    c.deco[sitio] = `${antes.split('#')[0]}${color ? `#${color.replace('#', '').toLowerCase()}` : ''}`;
  });
  if (ok) {
    sonido.toque();
    const donde = casa3d.sitioDe(sitio);
    if (donde) hojaDecorar(donde.sitio);
  }
}

const PESTANAS_TIENDA = [
  { id: 'comida', nombre: 'Comida' },
  { id: 'regalo', nombre: 'Regalos' },
  { id: 'deco', nombre: 'Decoración' },
  { id: 'ropa', nombre: 'Ropa' },
  { id: 'disfraz', nombre: 'Disfraces' },
];

// ---------------------------------------------------------------------------
// Ropa: tienda, clóset y vestirse
// ---------------------------------------------------------------------------
type FiltroRanura = Ranura | 'tintes';
const FILTROS_RANURA: { id: FiltroRanura; nombre: string }[] = [
  ...RANURAS.map((r) => ({ id: r as FiltroRanura, nombre: NOMBRE_RANURA[r] })),
  { id: 'tintes', nombre: 'Tintes' },
];
let filtroRopa: { para: Rol | null; ranura: FiltroRanura } = { para: null, ranura: 'arriba' };
const tiene = (id: string) => (s?.casa.inventario[id] ?? 0) > 0;
const ropaDe = (r: Rol): Ropa => s?.personajes[r].ropa ?? {};
const puesto = (id: string) => Object.values(ropaDe(yo)).includes(id);
/** ¿Qué ranuras de esta pestaña del clóset muestra la prenda? (un vestido sale en Arriba) */
const enRanura = (it: Item, r: Ranura) => it.ranura === r;

function chips<T extends string>(lista: { id: T; nombre: string }[], activo: T, dato: string) {
  return `<div class="filtros" role="group">${lista
    .map((f) => `<button class="filtro" data-${dato}="${esc(f.id)}" aria-pressed="${f.id === activo}">${esc(f.nombre)}</button>`)
    .join('')}</div>`;
}

function tarjetaRopa(it: Item, rol: Rol, pie: string) {
  const img = it.tinte
    ? `<span class="muestra-tinte" style="background:${colorSeguro(it.tinte, '#6B4A33')}"></span>`
    : `<img src="${iconoRopa(it, rol)}" alt="" loading="lazy">`;
  const detalle = it.tinte ? 'Color de pelo para los dos' : `${it.ranura ? NOMBRE_RANURA[it.ranura] : ''}${it.tambien?.length ? ' y abajo' : ''} · ${
    it.para?.length === 2 ? 'Él y Ella' : nombre(it.para![0])}`;
  return `<li class="item${puesto(it.id) ? ' puesto' : ''}">${img}<b>${esc(it.nombre)}</b><small>${esc(detalle)}</small><div class="fila-item">${pie}</div></li>`;
}

function botonCompra(it: Item) {
  if (tiene(it.id)) return `<span class="tengo">La tienen</span>`;
  return `<button class="boton-precio-casa" data-comprar="${it.id}" ${s!.casa.monedas < it.precio ? 'disabled' : ''}><i class="moneda"></i>${it.precio}</button>`;
}

function tiendaRopa(tab: 'ropa' | 'disfraz') {
  if (!s) return;
  let html: string;
  if (tab === 'disfraz') {
    html = `<p class="nota-hoja">Disfraces para los dos: traen todas las piezas y se ponen de una en el clóset. Entre más raro, más detallado:
      <b class="r-verde">Especial</b> el doble, <b class="r-azul">Raro</b> el triple, <b class="r-morado">Épico</b> cinco veces y <b class="r-dorado">Legendario</b> diez.</p>
      <ul class="catalogo-casa">${DISFRACES_LISTA.map((d) => tarjetaDisfraz(d, botonCompra(d))).join('')}</ul>`;
  } else {
    const para = filtroRopa.para ?? yo;
    const ran = filtroRopa.ranura;
    // Las prendas de los disfraces nuevos solo vienen con su disfraz
    const lista = ran === 'tintes' ? TINTES : CATALOGO.filter((i) => i.tipo === 'ropa' && !i.tinte && !i.exclusiva && lePasa(i, para) && i.ranura === ran);
    html = `${chips([{ id: 'el' as Rol, nombre: `Para ${nombre('el')}` }, { id: 'ella' as Rol, nombre: `Para ${nombre('ella')}` }], para, 'ropa-para')}
      ${chips(FILTROS_RANURA, ran, 'ropa-ranura')}
      <p class="nota-hoja">Lo que compran queda en el clóset (en el cuarto, «Cambiarse»). ${ran === 'tintes' ? '' : `Se ve en ${nombre(para)}.`}</p>
      <ul class="catalogo-casa">${lista.map((it) => tarjetaRopa(it, para, botonCompra(it) + botonPoner(it))).join('')}</ul>`;
  }
  abrirHoja('Tienda de la casa', html, {
    mantener: true,
    saldo: s.casa.monedas,
    pestanas: PESTANAS_TIENDA,
    activa: tab,
    alPestana: (p) => hojaTienda(p as TipoItem),
    alCerrar: () => (repintarHoja = null),
  });
}

function botonPoner(it: Item) {
  if (!tiene(it.id)) return '';
  if (it.tinte) {
    const actual = s!.personajes[yo].colorPelo === it.tinte;
    return actual ? `<span class="tengo">Puesto</span>` : `<button class="boton boton-chico boton-menta" data-tinte="${esc(it.tinte)}">Ponérmelo</button>`;
  }
  if (!lePasa(it, yo)) return '';
  return puesto(it.id)
    ? `<button class="boton boton-chico boton-papel" data-quitar-ropa="${it.id}">Quitármelo</button>`
    : `<button class="boton boton-chico boton-menta" data-poner-ropa="${it.id}">Ponérmelo</button>`;
}

function tarjetaDisfraz(d: Item, pie: string) {
  const ej = (r: Rol) => {
    const id = d.piezas?.[r]?.find((x) => ITEM[x]?.ranura === 'arriba' || ITEM[x]?.ranura === 'cabeza') ?? d.piezas?.[r]?.[0];
    return id ? `<img src="${iconoRopa(ITEM[id], r)}" alt="" loading="lazy">` : '';
  };
  const mias = d.piezas?.[yo] ?? [];
  const lo = mias.length && mias.every((id) => puesto(id));
  const poner = tiene(d.id) && mias.length
    ? lo ? `<button class="boton boton-chico boton-papel" data-quitar-disfraz="${d.id}">Quitármelo</button>`
      : `<button class="boton boton-chico boton-menta" data-poner-disfraz="${d.id}">Ponérmelo</button>`
    : '';
  const r = d.rareza ?? 'blanco';
  return `<li class="item disfraz rareza-${r}${lo ? ' puesto' : ''}"><span class="sello-rareza">${r === 'blanco' ? '' : '★'.repeat(RAREZAS.length - RAREZAS.indexOf(r) - 1)} ${RAREZA[r].nombre}</span><span class="pareja-iconos">${ej('el')}${ej('ella')}</span><b>${esc(d.nombre)}</b><small>${esc(d.texto ?? '')}</small>
    <div class="fila-item">${pie}${poner}</div></li>`;
}

/** El clóset: ponerse, quitarse, tinte y disfraces (cada uno se viste en su celular; el otro lo ve igual). */
function hojaCloset(tab: Ranura | 'disfraz') {
  const pintar = () => {
    if (!s) return;
    let html = '';
    if (tab === 'disfraz') {
      const mios = DISFRACES_LISTA.filter((d) => tiene(d.id));
      html = mios.length
        ? `<ul class="catalogo-casa">${mios.map((d) => tarjetaDisfraz(d, '')).join('')}</ul>`
        : `<p class="nota-hoja">Todavía no tienen disfraces.</p>`;
      html += `<button class="boton boton-tomate" data-ir-tienda="disfraz">Ver disfraces en la tienda</button>`;
    } else {
      if (tab === 'pelo') {
        const color = s.personajes[yo].colorPelo;
        const mios = TINTES.filter((t) => tiene(t.id));
        html += `<p class="nota-hoja">Color del pelo</p><div class="tintes">
          <button class="tinte" data-tinte="" aria-pressed="${!color}" title="Natural"><span style="background:#1c1917"></span>Natural</button>
          ${mios.map((t) => `<button class="tinte" data-tinte="${esc(t.tinte!)}" aria-pressed="${color === t.tinte}" title="${esc(t.nombre)}"><span style="background:${colorSeguro(t.tinte, '#000000')}"></span>${esc(t.nombre.replace('Tinte ', ''))}</button>`).join('')}
          </div>`;
      }
      const mias = CATALOGO.filter((i) => i.tipo === 'ropa' && !i.tinte && lePasa(i, yo) && tiene(i.id) && enRanura(i, tab));
      const libre = !ropaDe(yo)[tab];
      html += `<ul class="catalogo-casa">
        <li class="item${libre ? ' puesto' : ''}"><span class="muestra-fabrica">${ico('closet')}</span><b>Como siempre</b><small>La ropa de ${nombre(yo)} de todos los días</small>
          <div class="fila-item">${libre ? '<span class="tengo">Puesto</span>' : `<button class="boton boton-chico boton-menta" data-quitar-ranura="${tab}">Ponérmelo</button>`}</div></li>
        ${mias.map((it) => tarjetaRopa(it, yo, botonPoner(it))).join('')}</ul>
        ${mias.length ? '' : `<p class="nota-hoja">No tienen nada de «${NOMBRE_RANURA[tab].toLowerCase()}» para ${nombre(yo)} todavía.</p>`}
        <button class="boton boton-tomate" data-ir-tienda-ropa="${tab}">Comprar más en la tienda</button>`;
    }
    abrirHoja(`Clóset de ${nombre(yo)}`, html, {
      mantener: true,
      pestanas: [...RANURAS.map((r) => ({ id: r, nombre: NOMBRE_RANURA[r] })), { id: 'disfraz', nombre: 'Disfraces' }],
      activa: tab,
      alPestana: (p) => hojaCloset(p as Ranura | 'disfraz'),
      alCerrar: () => (repintarHoja = null),
    });
  };
  repintarHoja = pintar;
  pintar();
}

/** Cambia la ropa de mi personaje (se guarda y el otro celular lo ve). */
async function vestir(cambio: (ropa: Ropa) => void, colorPelo?: string | null) {
  if (!s) return;
  const ahora = Date.now();
  const actual = s.personajes[yo];
  const ropa: Ropa = { ...(actual.ropa ?? {}) };
  cambio(ropa);
  const e: EstadoPersonaje = { ...alDia(actual, ahora) };
  delete e.ropa;
  if (Object.keys(ropa).length) e.ropa = ropa;
  if (colorPelo && !TINTES.some((t) => t.tinte === colorPelo && tiene(t.id))) return;
  if (colorPelo !== undefined) {
    delete e.colorPelo;
    if (colorPelo) e.colorPelo = colorPelo;
  }
  await guardarYo(e);
  repintarHoja?.();
}

/** Pone una prenda en la ropa (quita lo que ocupa sus mismas ranuras: un vestido quita la falda y la blusa). */
function ponerEn(ropa: Ropa, id: string) {
  const it = ITEM[id];
  if (!it?.ranura) return;
  const ocupa = ranurasDe(it);
  for (const [r, otro] of Object.entries(ropa)) {
    const o = otro ? ITEM[otro] : undefined;
    if (!o || ranurasDe(o).some((x) => ocupa.includes(x))) delete ropa[r as Ranura];
  }
  ropa[it.ranura] = id;
}

function ponerRopa(id: string) {
  const it = ITEM[id];
  if (!it || !tiene(id) || !lePasa(it, yo)) return;
  void vestir((ropa) => ponerEn(ropa, id)).then(() => toast(`${nombre(yo)} se puso: ${it.nombre.toLowerCase()}`));
}

function quitarRopa(id: string) {
  void vestir((ropa) => {
    for (const [r, x] of Object.entries(ropa)) if (x === id) delete ropa[r as Ranura];
  });
}

function ponerDisfraz(id: string, quitar = false) {
  const d = ITEM[id];
  const mias = d?.piezas?.[yo] ?? [];
  if (!d || !tiene(id) || !mias.length) return;
  void vestir((ropa) => {
    if (quitar) {
      for (const [r, x] of Object.entries(ropa)) if (x && mias.includes(x)) delete ropa[r as Ranura];
    } else {
      // Las piezas que solo existen con su disfraz (la cola de Angel, las patitas de la pulga) se van con él
      for (const [r, x] of Object.entries(ropa)) if (x && ITEM[x]?.exclusiva && !mias.includes(x)) delete ropa[r as Ranura];
      for (const p of mias) ponerEn(ropa, p);
    }
  }).then(() => toast(quitar ? '¡Listo, sin disfraz!' : `¡${nombre(yo)} se disfrazó: ${d.nombre.toLowerCase()}!`));
}

async function comprar(id: string) {
  const it = ITEM[id];
  if (!s || !it || s.casa.monedas < it.precio) return toast('No alcanzan las monedas.');
  const unaVezNomas = it.tipo === 'ropa' || it.tipo === 'disfraz';
  if (unaVezNomas && tiene(id)) return toast('Ya lo tienen.');
  const ok = await cambiarCasa((c) => {
    if (unaVezNomas && (c.inventario[id] ?? 0) > 0) throw new Error('ya lo tienen');
    if (c.monedas < it.precio) throw new Error('No alcanzan las monedas.');
    c.monedas -= it.precio;
    c.inventario[id] = unaVezNomas ? 1 : (c.inventario[id] ?? 0) + 1;
    for (const r of ['el', 'ella'] as Rol[]) for (const p of it.piezas?.[r] ?? []) c.inventario[p] = 1;
  });
  if (ok) {
    sonido.caja();
    toast(unaVezNomas ? `Compraron: ${it.nombre}. Está en el clóset.` : `Compraron: ${it.nombre}`);
  }
}

/** Elegir una comida de la despensa: para comer o para llevarle a la pareja. */
function elegirComida(para: 'comer' | 'llevar') {
  if (!s) return;
  const pintar = () => {
    const hay = CATALOGO.filter((i) => i.tipo === 'comida' && (s!.casa.inventario[i.id] ?? 0) > 0);
    const html = hay.length
      ? `<ul class="catalogo-casa">${hay
          .map((it) => tarjetaItem(it, `<span class="tengo">Hay ${s!.casa.inventario[it.id]}</span><button class="boton boton-chico boton-menta" data-${para}="${it.id}">${para === 'comer' ? 'Comer' : 'Llevar'}</button>`))
          .join('')}</ul>`
      : `<p class="nota-hoja">La despensa está vacía.</p><button class="boton boton-tomate" data-ir-tienda>Ir a la tienda</button>`;
    abrirHoja(para === 'comer' ? 'La despensa' : `Llevarle comida a ${nombre(otro(yo))}`, html, { mantener: true, alCerrar: () => (repintarHoja = null) });
  };
  repintarHoja = pintar;
  pintar();
}

/** La hoja de la pareja que está abierta (para repintarla en vivo cuando se juntan o se separan). */
let pintarPareja: (() => void) | null = null;

function hojaPareja() {
  if (!s) return;
  const par = otro(yo);
  const pintar = () => {
    const e = est(par);
    const a = s!.personajes[par].actividad;
    const cuarto = mascotas[par].cuarto;
    const donde = NOMBRE_CUARTO[cuarto].toLowerCase();
    const enEl = cuarto === 'bano' ? 'el baño' : cuarto === 'cuarto' ? 'el cuarto' : `la ${donde}`;
    const haciendo = a.tipo === 'dormir' ? `Está durmiendo en ${enEl}.` : `Está en ${enEl}.`;
    const linea = s!.enLinea[par] ? 'En línea ahora.' : `Entró por última vez ${haceCuanto(s!.personajes[par].visto)}.`;
    const an = animo(e);
    // Los mimos y los regalos en persona, solo en el mismo cuarto; notas y mensajes de voz, desde donde sea
    const cerca = juntos();
    const mimos = cerca
      ? `<button class="accion" data-mimo="caricia">${ico('caricia')}<span>Caricia</span></button>
          <button class="accion" data-mimo="abrazo">${ico('abrazo')}<span>Abrazo</span></button>
          <button class="accion principal" data-mimo="beso">${ico('beso')}<span>Beso</span></button>
          <button class="accion" data-hoja="regalar"><img src="${iconoItem(ITEM.flores)}" alt=""><span>Regalar</span></button>
          <button class="accion" data-hoja="llevar"><img src="${iconoItem(ITEM.manzana)}" alt=""><span>Llevar comida</span></button>${
            yo === 'el' ? `<button class="accion" data-mimo="nalgada"><span class="ico ico-emoji">🍑</span><span>Nalgadita</span></button>` : ''
          }`
      : `<button class="accion principal" data-ir-pareja="${cuarto}">${ico('carino')}<span>Ir a ${esc(enEl)}</span></button>`;
    const html = `<div class="estado-pareja">
        <p class="nota-hoja">${esc(haciendo)} ${esc(linea)} ${an === 'triste' ? 'Necesita que la consientas.' : an === 'feliz' ? 'Se ve feliz.' : ''}${
          cerca ? '' : ` Para darle mimos o regalos, ve a ${esc(enEl)}.`}</p>
        <ul class="necesidades" id="necesidades-pareja"></ul>
        <div class="menu-casa">
          ${mimos}
          <button class="accion" data-hoja="notas">${ico('nota')}<span>Dejar una nota</span></button>
          <button class="accion" data-hoja="voz">${ico('telefono')}<span>Mensaje de voz</span></button>
          ${cerca ? `<button class="accion" data-mimo="saludo">${ico('saludo')}<span>Saludar</span></button>` : ''}
        </div>
      </div>`;
    abrirHoja(`${nombre(par)}`, html, { mantener: true, alCerrar: () => (repintarHoja = null) });
    pintarNecesidades($('necesidades-pareja'), e);
  };
  repintarHoja = pintarPareja = pintar;
  pintar();
}

function haceCuanto(t: number) {
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 2) return 'hace un momento';
  if (min < 60) return `hace ${min} minutos`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} ${h === 1 ? 'hora' : 'horas'}`;
  const d = Math.round(h / 24);
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}

let regaloElegido: string | null = null;
function hojaRegalar() {
  if (!s) return;
  const pintar = () => {
    const hay = CATALOGO.filter((i) => (i.tipo === 'regalo' || i.cocina) && (s!.casa.inventario[i.id] ?? 0) > 0);
    if (regaloElegido && !hay.some((i) => i.id === regaloElegido)) regaloElegido = null;
    regaloElegido ??= hay[0]?.id ?? null;
    const html = hay.length
      ? `<ul class="catalogo-casa">${hay
          .map((it) => tarjetaItem(it, `<span class="tengo">Tienen ${s!.casa.inventario[it.id]}</span>`, `data-elegir-regalo="${it.id}" class="item elegible" role="button" aria-pressed="${it.id === regaloElegido}"`))
          .join('')}</ul>
        <form class="form-nota" id="form-regalo">
          <label class="campo">Mensaje para ${nombre(otro(yo))}<textarea id="regalo-mensaje" maxlength="240" placeholder="Escribe algo bonito…"></textarea></label>
          <button class="boton boton-rosa" type="submit">Enviar regalo</button>
        </form>`
      : `<p class="nota-hoja">No tienen regalos guardados. Compren uno en la tienda (pestaña Regalos).</p><button class="boton boton-tomate" data-ir-tienda="regalo">Ir a la tienda</button>`;
    abrirHoja(`Regalo para ${nombre(otro(yo))}`, html, { alCerrar: () => (repintarHoja = null) });
  };
  repintarHoja = null;
  pintar();
}

let colorNota = COLORES_NOTA[0];
function hojaNotas() {
  if (!s) return;
  const pintar = () => {
    const notas = [...s!.casa.notas].reverse();
    const html = `<form class="form-nota" id="form-nota">
        <label class="campo">Nota para la nevera<textarea id="nota-texto" maxlength="200" placeholder="Te amo, no olvides…"></textarea></label>
        <div class="colores" role="radiogroup" aria-label="Color">${COLORES_NOTA.map((c) => `<button type="button" class="color" data-color="${c}" style="background:${c}" aria-pressed="${c === colorNota}" aria-label="Color"></button>`).join('')}</div>
        <button class="boton boton-tomate" type="submit">Pegar en la nevera</button>
      </form>
      <ul class="notas">${notas
        .map(
          (n) => `<li class="nota-adhesiva" style="background:${colorSeguro(n.color)}">${esc(n.texto)}<small>${nombre(n.de)} · ${new Date(n.t).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</small>${
            n.de === yo ? `<button class="quitar" data-quitar-nota="${esc(n.id)}">Quitar</button>` : ''
          }</li>`,
        )
        .join('')}</ul>`;
    abrirHoja('La nevera', html, { alCerrar: () => (repintarHoja = null) });
  };
  repintarHoja = null;
  pintar();
}

async function pegarNota(texto: string) {
  if (!s || !texto.trim()) return;
  const n = { id: nuevoId(), de: yo, texto: texto.trim().slice(0, 200), color: colorSeguro(colorNota), t: Date.now() };
  if (!(await cambiarCasa((c) => (c.notas = [...c.notas.slice(-29), n])))) return;
  try {
    await s.enviar('nota', { texto: n.texto });
  } catch (err) {
    fallo(err);
  }
  toast('Nota pegada en la nevera');
  hojaNotas();
}

function hojaAlbum() {
  if (!s) return;
  const lista = s.recuerdos;
  const html = `<form class="form-recuerdo" id="form-recuerdo">
      <label class="campo">Foto<input id="rec-foto" type="file" accept="image/*" required></label>
      <label class="campo">¿Qué recuerdo es?<input id="rec-titulo" maxlength="60" placeholder="Nuestra primera cita" required></label>
      <label class="campo">Fecha<input id="rec-fecha" type="date"></label>
      <button class="boton boton-tomate" type="submit">Guardar en el álbum</button>
      <p id="rec-aviso" class="aviso" role="status"></p>
    </form>
    <ul class="album">${lista
      .map(
        (r) => `<li><button class="polaroid" data-foto="${esc(r.id)}"><img src="${esc(r.foto)}" alt=""><b>${esc(r.titulo)}</b><small>${r.fecha ? esc(fechaLarga(r.fecha)) : ''}</small></button></li>`,
      )
      .join('')}</ul>`;
  abrirHoja('Nuestro álbum', html, { alCerrar: () => (repintarHoja = null) });
  repintarHoja = null;
}

function fechaLarga(f: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f);
  if (!m) return f;
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function hojaFechas() {
  if (!s) return;
  const cal = (nombreF: string, fecha: string, cadaAno: boolean, id?: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
    if (!m) return '';
    const d = diasPara(fecha, cadaAno);
    const mes = new Date(2000, +m[2] - 1, 1).toLocaleDateString('es-CO', { month: 'short' });
    const falta = d === null ? '' : d === 0 ? '¡Es hoy!' : d < 0 ? 'Ya pasó' : d === 1 ? 'Mañana' : `Faltan ${d} días`;
    return `<li class="calendario${d === 0 ? ' hoy' : ''}"><span class="mes">${mes}</span><span class="dia">${+m[3]}</span><b>${esc(nombreF)}</b><small>${falta}${
      id ? ` · <button class="enlace" data-quitar-fecha="${esc(id)}">quitar</button>` : ''
    }</small></li>`;
  };
  const html = `<ul class="fechas">${s.casa.aniversario ? cal('Nuestro aniversario', s.casa.aniversario, true) : ''}${s.casa.fechas.map((f) => cal(f.nombre, f.fecha, f.cadaAno, f.id)).join('')}</ul>
    <form class="form-fecha" id="form-aniversario">
      <label class="campo">Nuestro aniversario<input id="aniv-fecha" type="date" value="${esc(s.casa.aniversario)}"></label>
      <button class="boton boton-rosa" type="submit">Guardar aniversario</button>
    </form>
    <form class="form-fecha" id="form-fecha" style="margin-top:12px">
      <label class="campo">Otra fecha especial<input id="fecha-nombre" maxlength="40" placeholder="Cumpleaños de Ella" required></label>
      <label class="campo">Día<input id="fecha-dia" type="date" required></label>
      <label class="chequeo"><input id="fecha-anual" type="checkbox" checked> Se repite cada año</label>
      <button class="boton boton-tomate" type="submit">Agregar fecha</button>
    </form>`;
  abrirHoja('Nuestras fechas', html, { alCerrar: () => (repintarHoja = null) });
  repintarHoja = null;
}

function hojaMenu() {
  const html = `<div class="menu-casa">
      <button class="accion" data-hoja="album">${ico('album')}<span>Álbum de fotos</span></button>
      <button class="accion" data-hoja="fechas">${ico('fechas')}<span>Fechas especiales</span></button>
      <button class="accion" data-hoja="notas">${ico('nota')}<span>Notas de la nevera</span></button>
      <button class="accion" data-hoja="buzon">${ico('telefono')}<span>Buzón de voz${s && vozPendiente() ? ' (nuevo)' : ''}</span></button>
      <button class="accion" data-hoja="plano">${ico('casa')}<span>Ampliar la casa</span></button>
      <button class="accion" data-hoja="trofeos">${ico('trofeo')}<span>Trofeos</span></button>
      <button class="accion" data-hoja="tienda">${ico('tienda')}<span>Tienda</span></button>
      <button class="accion" data-hoja="ajustes">${ico('ajustes')}<span>Ajustes</span></button>
    </div>`;
  abrirHoja('Nuestro Hogar', html, { saldo: s?.casa.monedas });
}

function hojaAjustes() {
  const cfg = configLinea();
  const enLinea = s?.modo === 'linea';
  const html = `<p class="nota-hoja">${
    !s ? 'Todavía no han entrado a una casa.' : `Eres <b>${nombre(yo)}</b>. ${
      enLinea ? `Casa en línea con el código <b class="codigo-chico">${esc(s.codigo)}</b>.` : 'Estás jugando solo en este celular (sin internet).'
    }`
  }</p>
    <div class="fila-botones" style="justify-content:flex-start">
      ${enLinea ? '<button class="boton boton-papel boton-chico" data-compartir>Compartir el código</button>' : ''}
      <button class="boton boton-papel boton-chico" data-musica>Música: ${sonido.musica.apagada() ? 'apagada' : 'sonando'}</button>
      <button class="boton boton-papel boton-chico" data-sonido>Sonido: ${sonido.silenciado() ? 'apagado' : 'prendido'}</button>
    </div>
    <form class="form-config" id="form-config" style="margin-top:12px">
      <p class="nota-hoja">Servidor para conectar los dos celulares (Supabase). Solo la dirección del proyecto y la clave pública «anon».</p>
      <label class="campo">Dirección (Project URL)<input id="cfg-url" inputmode="url" placeholder="https://xxxx.supabase.co" value="${esc(cfg?.url ?? '')}"></label>
      <label class="campo">Clave publicable (anon)<input id="cfg-clave" placeholder="sb_publishable_…" value="${esc(cfg?.clave ?? '')}"></label>
      <button class="boton boton-menta" type="submit">Guardar conexión</button>
    </form>
    ${s ? `<div class="fila-botones" style="margin-top:14px;justify-content:flex-start">
      <button class="boton boton-papel boton-chico" data-salir>Salir de esta casa</button>
    </div>` : ''}`;
  abrirHoja('Ajustes', html);
}

function hojaDecorar(sitio: Sitio) {
  if (!s) return;
  const actual = s.casa.deco[sitio.id];
  const opciones = paraSitio(sitio.tipo).filter((i) => (s!.casa.inventario[i.id] ?? 0) > 0);
  const esFoto = sitio.tipo === 'cuadro' && (s.casa.inventario.cuadro_foto ?? 0) > 0;
  const itActual = actual ? ITEM[itemDeClave(actual)] : undefined;
  const colorActual = actual?.split('#')[1] ?? '';
  const colores = itActual?.tintable
    ? `<p class="nota-hoja">Color de las luces:</p><div class="paleta-pared">${COLORES_TINTE.map(
        (col) => `<button class="muestra-pared" data-tinte-deco="${col}" data-sitio="${sitio.id}" style="background:${col}" aria-pressed="${col.slice(1).toLowerCase() === colorActual}" aria-label="Color ${col}"></button>`,
      ).join('')}</div><div class="fila-botones"><button class="boton boton-papel boton-chico" data-tinte-deco="" data-sitio="${sitio.id}">Como venía</button></div>`
    : '';
  const html = `${actual ? `<p class="nota-hoja">Aquí está: <b>${esc(itActual?.nombre ?? '')}</b></p><button class="boton boton-papel boton-chico" data-quitar-deco="${sitio.id}">Quitar y guardar</button>${colores}` : ''}
    ${
      opciones.length
        ? `<ul class="catalogo-casa" style="margin-top:10px">${opciones
            .filter((i) => i.id !== 'cuadro_foto')
            .map((it) => tarjetaItem(it, `<span class="tengo">Tienen ${s!.casa.inventario[it.id]}</span><button class="boton boton-chico boton-menta" data-poner="${it.id}" data-sitio="${sitio.id}">Poner</button>`))
            .join('')}</ul>`
        : `<p class="nota-hoja">${actual ? 'No tienen más guardado para este lugar.' : 'No tienen decoración para este lugar.'} En la tienda (pestaña Decoración) hay ${
            sitio.tipo === 'cuadro' ? 'cuadros' : sitio.tipo === 'mesa' ? 'floreros y velas' : sitio.tipo === 'peluche' ? 'ositos' : 'plantas, lámparas y globos'
          }.</p><button class="boton boton-tomate" data-ir-tienda="deco">Ir a la tienda</button>`
    }
    ${
      esFoto
        ? `<h3>Marco con una foto del álbum</h3>${
            s.recuerdos.length
              ? `<ul class="album">${s.recuerdos
                  .map((r) => `<li><button class="polaroid" data-poner="cuadro_foto:${esc(r.id)}" data-sitio="${sitio.id}"><img src="${esc(r.foto)}" alt=""><b>${esc(r.titulo)}</b></button></li>`)
                  .join('')}</ul>`
              : '<p class="nota-hoja">Primero agreguen fotos al álbum.</p>'
          }`
        : ''
    }`;
  abrirHoja('Decorar', html, { alCerrar: () => (repintarHoja = null) });
  repintarHoja = null;
}

async function ponerDeco(clave: string, sitio: string) {
  if (!s) return;
  const item = itemDeClave(clave);
  if ((s.casa.inventario[item] ?? 0) <= 0) return;
  const ok = await cambiarCasa((c) => {
    const antes = c.deco[sitio];
    if (antes === clave) return;
    gastar(c, item);
    if (antes) c.inventario[itemDeClave(antes)] = (c.inventario[itemDeClave(antes)] ?? 0) + 1;
    c.deco[sitio] = clave;
  });
  if (ok) {
    cerrarHoja();
    sonido.repuesto();
    toast('¡Qué bonito quedó!');
  }
}

async function quitarDeco(sitio: string) {
  if (!s) return;
  const ok = await cambiarCasa((c) => {
    const antes = c.deco[sitio];
    if (!antes) return;
    c.inventario[itemDeClave(antes)] = (c.inventario[itemDeClave(antes)] ?? 0) + 1;
    delete c.deco[sitio];
  });
  if (ok) cerrarHoja();
}

// ---------------------------------------------------------------------------
// Controles (botones, formularios y toques sobre la casa)
// ---------------------------------------------------------------------------
function controles() {
  for (const b of Array.from(document.querySelectorAll<HTMLElement>('.rol-carta'))) b.onclick = () => elegirRol(b.dataset.rol as Rol);
  $('btn-local').onclick = () => rolElegido && void entrar({ modo: 'local', rol: rolElegido });
  $('btn-crear').onclick = async () => {
    if (!rolElegido) return;
    if (await entrar({ modo: 'linea', rol: rolElegido }, 'crear')) {
      $('codigo-texto').textContent = s!.codigo;
      mostrar('codigo');
    }
  };
  $('form-unirse').onsubmit = (ev) => {
    ev.preventDefault();
    const cod = ($('inp-codigo') as HTMLInputElement).value.trim().toUpperCase();
    if (!rolElegido || cod.length < 6) return ($('bienv-aviso').textContent = 'Escribe el código de 6 letras que te mandó tu pareja.');
    void entrar({ modo: 'linea', rol: rolElegido }, { codigo: cod });
  };
  $('btn-bienv-config').onclick = () => hojaAjustes();
  $('btn-reintentar').onclick = () => modoGuardado && void entrar(modoGuardado);
  $('btn-codigo-listo').onclick = () => mostrar('codigo', false);
  $('btn-codigo-compartir').onclick = () => compartirCodigo();
  $('cuartos').onclick = (ev) => {
    const t = ev.target as HTMLElement;
    if (t.closest('[data-plano]')) {
      sonido.toque();
      return hojaPlano();
    }
    const b = t.closest('[data-cuarto]') as HTMLElement | null;
    if (!b) return;
    sonido.toque();
    void irACuarto(b.dataset.cuarto as Cuarto);
  };
  $('acciones').onclick = (ev) => {
    const b = (ev.target as HTMLElement).closest('[data-accion]') as HTMLElement | null;
    if (b) void alAccion(b.dataset.accion!);
  };
  $('btn-menu').onclick = () => hojaMenu();
  $('chip-pareja').onclick = () => hojaPareja();
  $('chip-yo').onclick = () => hojaYo();
  $('hoja-cerrar').onclick = () => cerrarHoja();
  $('hoja').onclick = (ev) => {
    if (ev.target === $('hoja')) cerrarHoja();
  };
  $('ventana').onclick = (ev) => {
    const t = ev.target as HTMLElement;
    if (t === $('ventana') || t.closest('[data-cerrar]')) cerrarVentana();
  };
  // Todo lo que pasa dentro de las hojas
  const cuerpo = $('hoja');
  cuerpo.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const d = (sel: string) => t.closest(sel) as HTMLElement | null;
    let b: HTMLElement | null;
    if ((b = d('[data-tele-casa]'))) {
      cerrarHoja();
      if (b.dataset.teleCasa === 'apagar') {
        tele.apagar();
        toast('Tele apagada.');
      } else void verTele(true);
    } else if ((b = d('[data-comprar]'))) void comprar(b.dataset.comprar!);
    else if ((b = d('[data-comprar-concepto]'))) void comprarConcepto(b.dataset.comprarConcepto!);
    else if ((b = d('[data-poner-concepto]'))) void ponerConcepto(b.dataset.ponerConcepto!);
    else if ((b = d('[data-filtro-deco]'))) {
      filtroDeco = b.dataset.filtroDeco as FiltroDeco;
      hojaTienda('deco');
    } else if ((b = d('[data-tinte-deco]'))) void pintarDeco(b.dataset.sitio!, b.dataset.tinteDeco!);
    else if ((b = d('[data-ropa-para]'))) {
      filtroRopa.para = b.dataset.ropaPara as Rol;
      hojaTienda('ropa');
    } else if ((b = d('[data-ropa-ranura]'))) {
      filtroRopa.ranura = b.dataset.ropaRanura as FiltroRanura;
      hojaTienda('ropa');
    } else if ((b = d('[data-ir-tienda-ropa]'))) {
      filtroRopa = { para: yo, ranura: b.dataset.irTiendaRopa as FiltroRanura };
      hojaTienda('ropa');
    } else if ((b = d('[data-poner-ropa]'))) ponerRopa(b.dataset.ponerRopa!);
    else if ((b = d('[data-quitar-ropa]'))) quitarRopa(b.dataset.quitarRopa!);
    else if ((b = d('[data-quitar-ranura]'))) {
      const r = b.dataset.quitarRanura as Ranura;
      void vestir((ropa) => delete ropa[r]);
    } else if ((b = d('[data-tinte]'))) void vestir(() => {}, b.dataset.tinte || null);
    else if ((b = d('[data-poner-disfraz]'))) ponerDisfraz(b.dataset.ponerDisfraz!);
    else if ((b = d('[data-quitar-disfraz]'))) ponerDisfraz(b.dataset.quitarDisfraz!, true);
    else if (d('[data-abrir-closet]')) hojaCloset('arriba');
    else if ((b = d('[data-comer]'))) {
      cerrarHoja();
      void comer(b.dataset.comer!);
    } else if ((b = d('[data-llevar]'))) void mandarComida(b.dataset.llevar!);
    else if ((b = d('[data-ir-tienda]'))) hojaTienda((b.dataset.irTienda || 'comida') as TipoItem);
    else if ((b = d('[data-cocinar]'))) void cocinar(b.dataset.cocinar as RecetaId);
    else if ((b = d('[data-ir-pareja]'))) {
      cerrarHoja();
      void irACuarto(b.dataset.irPareja as Cuarto);
    } else if ((b = d('[data-mimo]'))) {
      const m = b.dataset.mimo!;
      if (m === 'saludo') void saludar();
      else if (m === 'nalgada') void nalgada();
      else void carino(m as 'caricia' | 'abrazo' | 'beso');
    } else if ((b = d('[data-rescate]'))) {
      void rescatar(b.dataset.rescate!);
    } else if ((b = d('[data-hoja]'))) {
      const h = b.dataset.hoja!;
      if (h === 'regalar') hojaRegalar();
      else if (h === 'retrete') hojaRetrete();
      else if (h === 'llevar') elegirComida('llevar');
      else if (h === 'notas') hojaNotas();
      else if (h === 'voz') void mandarVoz();
      else if (h === 'buzon') hojaBuzon();
      else if (h === 'album') hojaAlbum();
      else if (h === 'fechas') hojaFechas();
      else if (h === 'plano') hojaPlano();
      else if (h === 'trofeos') hojaTrofeos();
      else if (h === 'tienda') hojaTienda('comida');
      else if (h === 'ajustes') hojaAjustes();
    } else if ((b = d('[data-construir]'))) void construir(b.dataset.construir as Cuarto);
    else if ((b = d('[data-ir-cuarto]'))) {
      cerrarHoja();
      void irACuarto(b.dataset.irCuarto as Cuarto);
    } else if ((b = d('[data-pintar]'))) void pintarPared(b.dataset.pintar!);
    else if ((b = d('[data-accion-hoja]'))) {
      cerrarHoja();
      void alAccion(b.dataset.accionHoja!);
    } else if ((b = d('[data-oir-voz]'))) void oirVoz(b.dataset.oirVoz!);
    else if ((b = d('[data-elegir-regalo]'))) {
      regaloElegido = b.dataset.elegirRegalo!;
      for (const x of Array.from(document.querySelectorAll('[data-elegir-regalo]'))) x.setAttribute('aria-pressed', String(x === b));
    } else if ((b = d('[data-color]'))) {
      colorNota = b.dataset.color!;
      for (const x of Array.from(document.querySelectorAll('[data-color]'))) x.setAttribute('aria-pressed', String(x === b));
    } else if ((b = d('[data-quitar-nota]'))) {
      const id = b.dataset.quitarNota!;
      void cambiarCasa((c) => (c.notas = c.notas.filter((n) => n.id !== id))).then(() => hojaNotas());
    } else if ((b = d('[data-foto]'))) verFoto(b.dataset.foto!);
    else if ((b = d('[data-quitar-fecha]'))) {
      const id = b.dataset.quitarFecha!;
      void cambiarCasa((c) => (c.fechas = c.fechas.filter((f) => f.id !== id))).then(() => hojaFechas());
    } else if ((b = d('[data-poner]'))) void ponerDeco(b.dataset.poner!, b.dataset.sitio!);
    else if ((b = d('[data-quitar-deco]'))) void quitarDeco(b.dataset.quitarDeco!);
    else if (d('[data-compartir]')) compartirCodigo();
    else if (d('[data-musica]')) {
      sonido.musica.alternar();
      hojaAjustes();
    } else if (d('[data-sonido]')) {
      sonido.alternar();
      hojaAjustes();
    } else if (d('[data-salir]')) salir();
  });
  cuerpo.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = ev.target as HTMLFormElement;
    const val = (id: string) => ($(id) as HTMLInputElement).value;
    if (f.id === 'form-nota') void unaSolaVez(f.id, () => pegarNota(val('nota-texto')));
    else if (f.id === 'form-regalo' && regaloElegido) void unaSolaVez(f.id, () => regalar(regaloElegido!, val('regalo-mensaje')));
    else if (f.id === 'form-recuerdo') void unaSolaVez(f.id, guardarRecuerdo);
    else if (f.id === 'form-bebe') {
      const otro = val('bebe-otro').trim();
      const elegido = (f.querySelector('input[name="bebe-nombre"]:checked') as HTMLInputElement | null)?.value ?? 'Katherine';
      void unaSolaVez(f.id, () => pedirBebe(otro || elegido));
    }
    else if (f.id === 'form-aniversario') void cambiarCasa((c) => (c.aniversario = val('aniv-fecha'))).then(() => {
      toast('Aniversario guardado');
      hojaFechas();
    });
    else if (f.id === 'form-fecha') {
      const nueva: FechaEspecial = { id: nuevoId(), nombre: val('fecha-nombre').trim().slice(0, 40), fecha: val('fecha-dia'), cadaAno: ($('fecha-anual') as HTMLInputElement).checked };
      if (!nueva.nombre || !nueva.fecha) return;
      void cambiarCasa((c) => (c.fechas = [...c.fechas, nueva].slice(-20))).then(() => hojaFechas());
    } else if (f.id === 'form-config') {
      const url = val('cfg-url').trim().replace(/\/+$/, '');
      const clave = val('cfg-clave').trim();
      if (url && !/^https:\/\/[\w.-]+$/.test(url)) return toast('La dirección debe verse como https://xxxx.supabase.co');
      guardarConfigLinea(url && clave ? { url, clave } : null);
      toast('Conexión guardada');
      setTimeout(() => location.reload(), 700);
    }
  });
  // Toques sobre la casa: la pareja, la nevera, un regalo, un aro de decoración o el piso
  const lienzo = $('lienzo');
  let inicio = { x: 0, y: 0 };
  lienzo.addEventListener('pointerdown', (e) => (inicio = { x: e.clientX, y: e.clientY }));
  lienzo.addEventListener('pointerup', (e) => {
    if (!s || Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 12) return;
    sonido.activar();
    tocar(e.clientX, e.clientY);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      escribir(CLAVE_VISTO(yo), Date.now());
      sonido.suspender();
    } else {
      sonido.activar();
      void alAbrir();
    }
  });
  if (Capacitor.isNativePlatform()) {
    void App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        sonido.activar();
        void alAbrir();
      } else {
        escribir(CLAVE_VISTO(yo), Date.now());
        sonido.suspender();
      }
    });
    void App.addListener('backButton', () => {
      const salirLavado = document.querySelector<HTMLElement>('.lavado-fin:not([hidden]) [data-listo], .lavado-salir');
      const pausaCocina = document.querySelector<HTMLElement>('.cocina .cocina-pausa');
      if (salirLavado) salirLavado.click();
      else if (pausaCocina) pausaCocina.click();
      else if (!$('ventana').hidden) cerrarVentana();
      else if (hojaAbierta()) cerrarHoja();
      else if (!$('codigo').hidden) mostrar('codigo', false);
      else if (patio.activo) patio.salir();
      else if (decorando) void alAccion('decorar');
      else void App.exitApp();
    });
  }
}

function tocar(x: number, y: number) {
  if (!s) return;
  // En el modo mascota todo toque es para el perrito (o la pelota, o un popó)
  if (patio.activo) return void patio.tocar(x, y);
  // ¿Tocó a alguien?
  const v = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  const rayo = new THREE.Raycaster();
  rayo.setFromCamera(v, mundo.camara);
  for (const r of ['el', 'ella'] as Rol[]) {
    const m = mascotas[r];
    if (m.visible && rayo.intersectObject(m.pickeable, false).length) {
      sonido.toque();
      return r === yo ? hojaYo() : hojaPareja();
    }
  }
  if (casa3d.actual === 'patio' && !decorando && patio.tocar(x, y)) return;
  const t = casa3d.tocar(x, y);
  if (!t) return;
  if (t.tipo === 'sitio') {
    if (!puedeDecorar(casa3d.actual)) return;
    return hojaDecorar(t.sitio);
  }
  if (t.tipo === 'bebe') return mimarBebe();
  // Tocar un mueble es usarlo (el arcade, la cuna, el sofá, la tina…)
  if (t.tipo === 'suelo' && t.mueble && !decorando) {
    const uso = MUEBLES[casa3d.actual]?.find(([re]) => re.test(t.mueble!))?.[1];
    if (uso) {
      sonido.toque();
      return void alAccion(uso === 'cuna' ? (s.casa.bebe ? 'arrullar' : 'pedir-bebe') : uso);
    }
  }
  if (t.tipo === 'regalo') return void abrirRegalo();
  if (t.tipo === 'nevera') {
    void hacer('nevera', 'cocina', 6, {});
    return hojaNotas();
  }
  // Pasear: su personaje camina hasta donde se tocó; si estaba haciendo algo (comiendo, sentado, en un mimo,
  // saliendo del cuarto) lo deja ya y va para allá
  const m = mascotas[yo];
  if (t.tipo === 'suelo' && m.cuarto === casa3d.actual && !dormido(yo)) void pasear(t.x, t.y);
}

async function pasear(x: number, y: number) {
  if (!s) return;
  const m = mascotas[yo];
  const d = casa3d.dato;
  vistaPendiente = null;
  const px = THREE.MathUtils.clamp(x, -d.W / 2 + 0.5, d.W / 2 - 0.5), py = THREE.MathUtils.clamp(y, -d.D / 2 + 0.4, d.D / 2 - 0.6);
  if (!m.pasear(px, py)) return;
  // Hasta dónde camina queda en el estado: el otro celular lo ve levantarse de lo que hacía y caminar hasta allá
  // (la casa siempre en línea: cada uno ve moverse al otro)
  const ahora = Date.now();
  const r2 = (v: number) => Math.round(v * 100) / 100;
  await guardarYo({ ...est(yo), cuarto: m.cuarto, actividad: { tipo: 'nada', desde: ahora, pos: { x: r2(px), y: r2(py) } }, visto: ahora });
  pintarCuartos();
  pintarAcciones();
}

function hojaYo() {
  if (!s) return;
  const e = est(yo);
  const consejos: Record<Necesidad, string> = {
    hambre: 'Tiene hambre: en la cocina, «Comer».',
    energia: 'Está cansado: en el cuarto, «Dormir», o descansa en el sofá.',
    higiene: 'Necesita un baño: en el baño, «Bañarse».',
    carino: `Necesita cariño: pídele a ${nombre(otro(yo))} un abrazo o un beso.`,
  };
  const bajos = NECESIDADES.filter((n) => e[n] < 45).map((n) => `<li>${consejos[n]}</li>`).join('');
  abrirHoja(nombre(yo), `<ul class="necesidades" id="necesidades-yo"></ul>
    ${bajos ? `<ul class="nota-hoja">${bajos}</ul>` : '<p class="nota-hoja">Está muy bien. Las necesidades bajan poco a poco, incluso con la app cerrada.</p>'}
    <button class="boton boton-menta" data-abrir-closet>${ico('closet')} Cambiar ropa y peinado</button>`);
  pintarNecesidades($('necesidades-yo'), e);
}

function verFoto(id: string) {
  const r = s?.recuerdos.find((x) => x.id === id);
  if (!r) return;
  ventana(`<div class="foto-grande"><img src="${esc(r.foto)}" alt=""></div><h2>${esc(r.titulo)}</h2><p class="nota-hoja">${r.fecha ? esc(fechaLarga(r.fecha)) : ''} · subida por ${nombre(r.autor)}</p>
    <p class="nota-hoja">Pueden ponerla en la pared con un «Marco para una foto» de la tienda.</p>
    <div class="fila-botones" style="justify-content:center"><button class="boton boton-tomate" data-cerrar>Cerrar</button></div>`);
}

async function guardarRecuerdo() {
  const archivo = ($('rec-foto') as HTMLInputElement).files?.[0];
  const titulo = ($('rec-titulo') as HTMLInputElement).value.trim();
  const fecha = ($('rec-fecha') as HTMLInputElement).value;
  const aviso = $('rec-aviso');
  if (!s || !archivo || !titulo) return;
  aviso.textContent = 'Guardando la foto…';
  try {
    await s.agregarRecuerdo(titulo.slice(0, 60), fecha, archivo);
    toast('Recuerdo guardado');
    hojaAlbum();
  } catch (err) {
    aviso.textContent = err instanceof Error ? err.message : 'No se pudo guardar la foto.';
  }
}

function compartirCodigo() {
  if (!s) return;
  const texto = `Entra a Nuestro Hogar con el código ${s.codigo}`;
  const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
  if (nav.share) void nav.share({ text: texto }).catch(() => undefined);
  else
    void navigator.clipboard?.writeText(s.codigo).then(
      () => toast('Código copiado'),
      () => toast(`El código es ${s!.codigo}`),
    );
}

function salir() {
  ventana(`<h2>¿Salir de esta casa?</h2><p class="nota-hoja">La casa no se borra: pueden volver a entrar con el mismo código.</p>
    <div class="fila-botones" style="justify-content:center"><button class="boton boton-papel" data-cerrar>Cancelar</button><button class="boton boton-tomate" id="btn-si-salir">Salir</button></div>`);
  $('btn-si-salir').onclick = () => {
    s?.cerrar();
    olvidarSesion();
    try {
      localStorage.removeItem(CLAVE_MODO);
    } catch {
      /* nada */
    }
    location.href = location.pathname;
  };
}

// ---------------------------------------------------------------------------
// Bucle
// ---------------------------------------------------------------------------
let ultimo = performance.now();
let acumulado = 0;
let ultimaRevision = -Infinity;
/** ?rapido=N (pruebas): N pasos fijos de 0,1 s por cuadro, para ver las coreografías en navegadores sin tarjeta gráfica. */
const RAPIDO = Number(params.get('rapido') ?? 0);

function bucle() {
  requestAnimationFrame(bucle);
  const ahora = performance.now();
  const dt = Math.min(0.1, (ahora - ultimo) / 1000);
  ultimo = ahora;
  acumulado += dt;
  // 30 cuadros por segundo bastan para la casa (ahorra batería)
  if (acumulado < 1 / 32) return;
  const paso = acumulado;
  acumulado = 0;
  try {
    if (RAPIDO > 0) for (let i = 0; i < RAPIDO; i++) for (const m of Object.values(mascotas)) m.update(0.1);
    else for (const m of Object.values(mascotas)) m.update(paso);
    casa3d.animar(ahora / 1000);
    // (con ?rapido=N el perrito también va más rápido, para las pruebas)
    patio?.update(RAPIDO > 0 ? paso * RAPIDO : paso, ahora / 1000);
    revisarEventoBano(paso);
    // Cada medio segundo de reloj real (aunque el celular vaya lento, despertar y demás no se atrasan)
    if (ahora - ultimaRevision >= 500) {
      ultimaRevision = ahora;
      revisar();
      renovarTele();
      revisarRecuerdos();
    }
    revisarVista();
    efectos();
    if (!pausaCasa) mundo.dibujar(paso, true);
  } catch (e) {
    // Un error en un cuadro no debe congelar la casa; se reporta una vez
    if (!errorReportado) console.error(e);
    errorReportado = true;
  }
}
let errorReportado = false;
let estabanJuntos = false;
let vestidosGuardados = '';

/** Lo que tiene puesto cada uno, para que en Cien Puertas el narrador salga vestido igual (también en línea). */
function guardarVestidos() {
  if (!s) return;
  const v = JSON.stringify({
    el: { ropa: s.personajes.el.ropa, colorPelo: s.personajes.el.colorPelo },
    ella: { ropa: s.personajes.ella.ropa, colorPelo: s.personajes.ella.colorPelo },
  });
  if (v === vestidosGuardados) return;
  vestidosGuardados = v;
  escribir('nuestro-hogar-vestidos', JSON.parse(v));
}

/** Cada medio segundo: estado de los personajes, barras, despertar solo, regalo por abrir. */
function revisar() {
  if (!s) return;
  const ahora = Date.now();
  for (const r of ['el', 'ella'] as Rol[]) mascotas[r].aplicar(s.personajes[r], ahora);
  guardarVestidos();
  // El botón de la pareja aparece y se va en vivo cuando uno de los dos entra o sale del cuarto
  const j = juntos();
  if (j !== estabanJuntos) {
    estabanJuntos = j;
    pintarAcciones();
    if (hojaAbierta() && repintarHoja && repintarHoja === pintarPareja) repintarHoja();
  }
  pintarNecesidades($('necesidades'), est(yo));
  casa3d.mecerCuna((['el', 'ella'] as Rol[]).some((r) => {
    const a = s!.personajes[r].actividad;
    return a.accion === 'usar' && a.item === 'cuna' && (a.hasta ?? 0) > ahora && mascotas[r].escenaActual.includes('|usar|cuna|');
  }));
  if (dormido(yo) && est(yo).energia >= 100 && Date.now() - s!.personajes[yo].actividad.desde > 30 * 60_000) void despertar(true);
  const g = regaloPendiente();
  const m = mascotas[yo];
  if (g) void casa3d.mostrarRegalo(m.cuarto, m.p.pos.x + (yo === 'el' ? -0.7 : 0.7), m.p.pos.y - 0.5);
  else if (casa3d.hayRegaloVisible) void casa3d.mostrarRegalo(null);
}

const PENSAR: Record<Necesidad, string> = {
  hambre: `<img src="./modelos/iconos/pan.png" alt="">`,
  energia: `<span class="ico">${SVG.luna}</span>`,
  higiene: `<span class="ico">${SVG.tina}</span>`,
  carino: `<span class="ico">${SVG.carino}</span>`,
};

function efectos() {
  if (!s) return;
  for (const r of ['el', 'ella'] as Rol[]) {
    const m = mascotas[r];
    if (!m.visible || patio?.activo) {
      capa.poner(`${r}-efecto`, null, 0, 0);
      capa.poner(`${r}-piensa`, null, 0, 0);
      continue;
    }
    const p = mundo.aPantalla(m.cabeza());
    capa.poner(`${r}-efecto`, m.efecto, p.x, p.y);
    // Globo: lo que piensa en el inodoro, las ganas urgentes de ir al baño o lo que más necesita (si está libre)
    const e = est(r);
    const falta = NECESIDADES.filter((n) => e[n] < 30).sort((a, b) => e[a] - e[b])[0];
    if (m.frase) capa.poner(`${r}-piensa`, 'frase', p.x, p.y, esc(m.frase));
    else if (s.personajes[r].apuro && !m.efecto) capa.poner(`${r}-piensa`, 'apuro', p.x, p.y, ico('inodoro'));
    else capa.poner(`${r}-piensa`, !m.efecto && falta && !m.enCamino ? 'pensamiento' : null, p.x, p.y, falta ? PENSAR[falta] : undefined);
  }
}

// Para las pruebas automáticas
(window as any).__casa = () => ({
  yo,
  modo: s?.modo,
  codigo: s?.codigo,
  monedas: s?.casa.monedas,
  inventario: s?.casa.inventario,
  personajes: s ? { el: est('el'), ella: est('ella') } : null,
  cuarto: casa3d?.actual,
  eventos: s?.eventos.length,
  notas: s?.casa.notas.length,
  regalos: s?.casa.regalos,
  deco: s?.casa.deco,
  lavado: s?.casa.lavado,
  cocina: s?.casa.cocina,
});
/** Progreso de prueba en un restaurante (para ver rangos altos). */
(window as any).__cocinaXp = (receta: RecetaId, xp: number, dia = 6, propinas = 300) =>
  cambiarCasa((c) => {
    c.cocina = { ...(c.cocina ?? {}), [yo]: { ...(c.cocina?.[yo] ?? {}), [receta]: { ...progresoNuevo(), xp, dia, propinas } } };
  });
/** La cocina de chef abierta (pruebas). */
(window as any).__cocina = () => import('./cocina').then((m) => m.cocina.actual);
(window as any).__mundo = () => mundo;
(window as any).__mascotas = () => mascotas;
(window as any).__decorar = (sitio: string) => {
  const d = casa3d.sitioDe(sitio);
  if (d) hojaDecorar(d.sitio);
};
(window as any).__casa3d = () => casa3d;
(window as any).__escena = (r: Rol) => mascotas?.[r].escenaActual ?? '';
(window as any).__fase = (r: Rol) => mascotas?.[r].fase ?? null;
(window as any).__quieto = (r: Rol) => !!s && mascotas[r].mostrando(s.personajes[r]);
/** Pone una pose fija (pruebas de ropa). */
(window as any).__pose = (r: Rol, n: string) => {
  const m = mascotas?.[r] as any;
  if (!m) return;
  m.reposo = n;
  m.p.pose(n, true);
};
/** Hace una acción sin pasar por los botones (pruebas): dormir o una acción corta de `seg` segundos. */
(window as any).__hacer = (c: Cuarto, a: Accion | 'dormir', seg = 60) => {
  if (!s) return;
  const ahora = Date.now();
  if (a === 'dormir') {
    seguir(c);
    return guardarYo({ ...est(yo), cuarto: c, actividad: { tipo: 'dormir', desde: ahora }, visto: ahora });
  }
  return hacer(a, c, seg, {}, a === 'comer' ? 'pan' : undefined);
};
/** Ganas urgentes de ir al baño sin comer nada (pruebas del retrete espacial). */
(window as any).__apuro = () => s && guardarYo({ ...s.personajes[yo], apuro: Date.now() });
/** Posición en pantalla del aro de un sitio de decoración (pruebas). */
(window as any).__sitio = (id: string) => {
  const d = casa3d.sitioDe(id);
  if (!d) return null;
  const z = d.sitio.tipo === 'cuadro' ? d.sitio.z : d.sitio.z + 0.25;
  return mundo.aPantalla(new THREE.Vector3(d.sitio.x, z, -d.sitio.y));
};

/** Monedas de regalo y botones de acción directos (pruebas de la ampliación). */
(window as any).__monedas = (n: number) => cambiarCasa((c) => (c.monedas += n));
(window as any).__patio = () => patio;
(window as any).__accion = (id: string) => alAccion(id);
(window as any).__nalgada = () => nalgada();
/** El próximo «Ir al baño» trae este evento gracioso (o se ve la lista). */
(window as any).__bano = (id?: string) => (id ? (eventoForzado = id) : EVENTOS_BANO.map((x) => x.id));
(window as any).__bichos = () => ({ hay: bichos?.hay, evento: eventoBano?.ev.id ?? null });
/** Logros de prueba para los trofeos (se guardan como si vinieran de los minijuegos). */
(window as any).__logros = (l: { super?: number; puertas?: number; mesa?: number }, retrete?: number) =>
  cambiarCasa((c) => {
    c.logros = { ...c.logros, [yo]: { super: 0, puertas: 0, mesa: 0, ...c.logros?.[yo], ...l } };
    if (retrete !== undefined) c.retrete = { ...c.retrete, [yo]: retrete };
  }).then(() => premiosTrofeos());

iniciar().catch((e) => {
  console.error(e);
  $('carga-texto').textContent = 'No se pudo abrir la casa. Cierra y vuelve a abrir.';
});
