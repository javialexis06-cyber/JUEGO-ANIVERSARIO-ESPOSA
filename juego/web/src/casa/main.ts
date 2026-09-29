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
import { BONO_ANIVERSARIO, BONO_DIARIO, CATALOGO, DISFRACES_LISTA, EFECTO_CARINO, ITEM, Item, lePasa, paraSitio, TINTES, TipoItem } from './catalogo';
import { Casa3D, Sitio } from './escena_casa';
import { CARINO_VOZ, enLlamada, grabarMensaje, llamadaEntrante, PRECIO_VOZ } from './llamada';
import { Mascota } from './mascota';
import { type EstadoTele, Tele } from './tele';
import { PanelRecuerdos } from './recuerdos';
import {
  Accion, alDia, animo, Casa, colorSeguro, Cuarto, CUARTOS, diasPara, EstadoPersonaje, Evento, FechaEspecial, hoy, Necesidad,
  NECESIDADES, NOMBRE_CUARTO, NOMBRE_NECESIDAD, NOMBRE_RANURA, nuevoId, otro, personajeNuevo, Ranura, RANURAS, Rol, Ropa, sumar,
} from './modelo';
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
  await Promise.all([mascotas.el.cargar(), mascotas.ella.cargar()]);
  progreso(1, 'Listo');
  // De fondo, mientras se elige quién es quién: los dos en la sala
  const ahora = Date.now();
  for (const r of ['el', 'ella'] as Rol[]) mascotas[r].aplicar(personajeNuevo(ahora), ahora, false);
  bucle();
  controles();
  iniciarTele();
  panelRecuerdos = new PanelRecuerdos();
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
  const ahora = Date.now();
  for (const r of ['el', 'ella'] as Rol[]) mascotas[r].aplicar(s.personajes[r], ahora, false);
  verCuarto(s.personajes[yo].cuarto);
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
  if (que === 'personaje') for (const r of ['el', 'ella'] as Rol[]) mascotas[r].aplicar(s!.personajes[r]);
  if (que === 'casa') {
    void casa3d.ponerDeco(s!.casa.deco, s!.recuerdos);
    casa3d.pintarNotas(s!.casa.notas);
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
    for (const k of Object.keys(c.diario)) if (!k.startsWith(hoy()) && !k.startsWith('aniversario-')) delete c.diario[k];
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
      if (e.tipo === 'caricia' || e.tipo === 'abrazo' || e.tipo === 'beso') sumarA({ carino: EFECTO_CARINO[e.tipo].suyo });
      else if (e.tipo === 'comida' && typeof e.datos.item === 'string' && ITEM[e.datos.item]?.tipo === 'comida') sumarA(ITEM[e.datos.item].efecto ?? {});
    }
    if (Object.keys(cambios).length) await guardarYo(sumar(s.personajes[yo], cambios));
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
// La tele de la sala (YouTube con cola de videos)
// ---------------------------------------------------------------------------
let tele: Tele;
let panelRecuerdos: PanelRecuerdos;

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
function coreografia(tipo: 'caricia' | 'abrazo' | 'beso' | 'regalo', de: Rol, item?: string) {
  const para = otro(de);
  // Primero quien recibe (se levanta de donde esté), así quien lo hace llega a su lado
  mascotas[para].interactuar(tipo, mascotas[de], de, item);
  mascotas[de].interactuar(tipo, mascotas[para], de, item);
  vistaPendiente = null;
  verCuarto(mascotas[para].cuarto);
  setTimeout(() => (tipo === 'beso' ? sonido.beso() : tipo === 'regalo' ? sonido.regalo() : sonido.abrazo()), 1500);
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
const JUEGOS_MESA: Record<string, string> = { dados: 'Dados Party', mancala: 'Mancala', cajas: 'Puntos y Cajas', parchis: 'Parchís' };

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
    case 'comida':
      coreografia('regalo', e.de, item);
      toast(`${quien} te trajo ${item ? ITEM[item].nombre.toLowerCase() : 'comida'}`);
      break;
    case 'nota':
      toast(`${quien} te dejó una nota en la nevera`, 3200);
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
  await guardarYo(sumar(s.personajes[yo], it?.efecto ?? { carino: 10 }));
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
function verCuarto(c: Cuarto) {
  casa3d.mostrar(c);
  if (decorando) casa3d.modoDecorar(true);
  pintarCuartos();
  pintarAcciones();
}

/** Cambio de cuarto con su personaje a la vista: la cámara espera a que salga por la puerta (un momento) y lo sigue. */
let vistaPendiente: { cuarto: Cuarto; hasta: number } | null = null;
const cuartoVista = (): Cuarto => vistaPendiente?.cuarto ?? casa3d.actual;

/** La vista sigue a mi personaje al cuarto `c`: si se le ve salir, primero se ve caminar hasta la puerta. */
function seguir(c: Cuarto) {
  if (c === casa3d.actual) {
    vistaPendiente = null;
    return verCuarto(c);
  }
  if (mascotas[yo].visible && s?.personajes[yo].cuarto !== c) {
    vistaPendiente = { cuarto: c, hasta: performance.now() + 1700 };
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

function pintarCuartos() {
  html($('cuartos'), CUARTOS.map((c) => {
    const quien = s ? (['el', 'ella'] as Rol[]).filter((r) => s!.personajes[r].cuarto === c) : [];
    return `<button class="cuarto-tab" data-cuarto="${c}" aria-current="${c === cuartoVista()}">${NOMBRE_CUARTO[c]}${
      quien.length ? `<span class="quien">${quien.map((r) => `<span class="${caraClase(r)}"></span>`).join('')}</span>` : ''
    }</button>`;
  }).join(''));
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
      b.push({ id: 'comer', texto: 'Comer', icono: `<img src="${iconoItem(ITEM.pan)}" alt="">`, principal: true }, { id: 'notas', texto: 'Notas', icono: ico('nota') });
      break;
    case 'bano':
      b.push({ id: 'banar', texto: 'Bañarse', icono: ico('tina'), principal: true }, { id: 'lavar', texto: 'Lavarse', icono: ico('lavar') });
      break;
    case 'cuarto':
      b.push({ id: 'dormir', texto: 'Dormir', icono: ico('luna'), principal: true }, { id: 'closet', texto: 'Cambiarse', icono: ico('closet') });
      break;
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
    { id: 'decorar', texto: decorando ? 'Listo' : 'Decorar', icono: ico('decorar'), activo: decorando },
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
      await hacer('banar', 'bano', 30, { higiene: 100 });
      for (let i = 1; i < 6; i++) setTimeout(() => sonido.burbuja(), i * 700);
      return;
    case 'lavar':
      return hacer('lavar', 'bano', 5, { higiene: 25 });
    case 'dormir':
      return dormir();
    case 'closet':
      hojaCloset('arriba');
      return hacer('closet', 'cuarto', 5, { higiene: 12 });
    case 'pareja':
      return hojaPareja();
    case 'decorar':
      decorando = !decorando;
      casa3d.modoDecorar(decorando);
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
    const lista = CATALOGO.filter((i) => i.tipo === tab && i.id !== 'osito_deco');
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
    html = `<p class="nota-hoja">Disfraces para los dos: traen todas las piezas (más baratas que por separado) y se ponen de una en el clóset.</p>
      <ul class="catalogo-casa">${DISFRACES_LISTA.map((d) => tarjetaDisfraz(d, botonCompra(d))).join('')}</ul>`;
  } else {
    const para = filtroRopa.para ?? yo;
    const ran = filtroRopa.ranura;
    const lista = ran === 'tintes' ? TINTES : CATALOGO.filter((i) => i.tipo === 'ropa' && !i.tinte && lePasa(i, para) && i.ranura === ran);
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
  return `<li class="item disfraz${lo ? ' puesto' : ''}"><span class="pareja-iconos">${ej('el')}${ej('ella')}</span><b>${esc(d.nombre)}</b><small>${esc(d.texto ?? '')}</small>
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
    } else for (const p of mias) ponerEn(ropa, p);
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
          <button class="accion" data-hoja="llevar"><img src="${iconoItem(ITEM.manzana)}" alt=""><span>Llevar comida</span></button>`
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
    const hay = CATALOGO.filter((i) => i.tipo === 'regalo' && (s!.casa.inventario[i.id] ?? 0) > 0);
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
      <button class="accion" data-hoja="juegos">${ico('juegos')}<span>Minijuegos</span></button>
      <button class="accion" data-hoja="tienda">${ico('tienda')}<span>Tienda</span></button>
      <button class="accion" data-hoja="ajustes">${ico('ajustes')}<span>Ajustes</span></button>
    </div>`;
  abrirHoja('Nuestro Hogar', html, { saldo: s?.casa.monedas });
}

function hojaJuegos() {
  const html = `<article class="minijuego">
      <img src="./modelos/iconos/caja_frutas.png" alt="">
      <div>
        <h3>Súper Manía en Pareja</h3>
        <p>Atiende la tiendita de barrio: reponer, cobrar, limpiar y atrapar ladrones. Parte de lo que ganes llega a la casa como sueldo.</p>
        <a class="boton boton-tomate" href="./super.html">Ir a trabajar</a>
      </div>
    </article>
    <article class="minijuego">
      <img src="./modelos/iconos/deco_reloj.png" alt="">
      <div>
        <h3>Cien Puertas</h3>
        <p>Un escape room para ti: cien puertas con acertijos (inclina, sacude, voltea el celular…) y ${nombre(otro(yo))} te cuenta la historia. Cada puerta abierta da monedas para la casa.</p>
        <a class="boton boton-menta" href="./puertas.html">Abrir puertas</a>
      </div>
    </article>
    <article class="minijuego">
      <img src="./modelos/iconos/mesa_juegos.svg" alt="">
      <div>
        <h3>Juegos de Mesa</h3>
        <p>Dados Party, Mancala, Puntos y Cajas y Parchís: contra ${nombre(otro(yo))} (el celular), los dos en este celular o cada uno en el suyo. Los muñequitos celebran, se enojan y hacen drama con cada jugada.</p>
        <a class="boton boton-tomate" href="./mesa.html">Jugar</a>
      </div>
    </article>`;
  abrirHoja('Minijuegos', html, { saldo: s?.casa.monedas });
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
  const html = `${actual ? `<p class="nota-hoja">Aquí está: <b>${esc(ITEM[actual.split(':')[0]]?.nombre ?? '')}</b></p><button class="boton boton-papel boton-chico" data-quitar-deco="${sitio.id}">Quitar y guardar</button>` : ''}
    ${
      opciones.length
        ? `<ul class="catalogo-casa" style="margin-top:10px">${opciones
            .filter((i) => i.id !== 'cuadro_foto')
            .map((it) => tarjetaItem(it, `<span class="tengo">Tienen ${s!.casa.inventario[it.id]}</span><button class="boton boton-chico boton-menta" data-poner="${it.id}" data-sitio="${sitio.id}">Poner</button>`))
            .join('')}</ul>`
        : `<p class="nota-hoja">No tienen decoración para este lugar. En la tienda (pestaña Decoración) hay ${
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
  const item = clave.split(':')[0];
  if ((s.casa.inventario[item] ?? 0) <= 0) return;
  const ok = await cambiarCasa((c) => {
    const antes = c.deco[sitio];
    if (antes === clave) return;
    gastar(c, item);
    if (antes) c.inventario[antes.split(':')[0]] = (c.inventario[antes.split(':')[0]] ?? 0) + 1;
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
    c.inventario[antes.split(':')[0]] = (c.inventario[antes.split(':')[0]] ?? 0) + 1;
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
    const b = (ev.target as HTMLElement).closest('[data-cuarto]') as HTMLElement | null;
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
    else if ((b = d('[data-ir-pareja]'))) {
      cerrarHoja();
      void irACuarto(b.dataset.irPareja as Cuarto);
    } else if ((b = d('[data-mimo]'))) {
      const m = b.dataset.mimo!;
      if (m === 'saludo') void saludar();
      else void carino(m as 'caricia' | 'abrazo' | 'beso');
    } else if ((b = d('[data-hoja]'))) {
      const h = b.dataset.hoja!;
      if (h === 'regalar') hojaRegalar();
      else if (h === 'llevar') elegirComida('llevar');
      else if (h === 'notas') hojaNotas();
      else if (h === 'voz') void mandarVoz();
      else if (h === 'buzon') hojaBuzon();
      else if (h === 'album') hojaAlbum();
      else if (h === 'fechas') hojaFechas();
      else if (h === 'juegos') hojaJuegos();
      else if (h === 'tienda') hojaTienda('comida');
      else if (h === 'ajustes') hojaAjustes();
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
      if (!$('ventana').hidden) cerrarVentana();
      else if (hojaAbierta()) cerrarHoja();
      else if (!$('codigo').hidden) mostrar('codigo', false);
      else if (decorando) void alAccion('decorar');
      else void App.exitApp();
    });
  }
}

function tocar(x: number, y: number) {
  if (!s) return;
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
  const t = casa3d.tocar(x, y);
  if (!t) return;
  if (t.tipo === 'sitio') return hojaDecorar(t.sitio);
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
  if (!m.pasear(THREE.MathUtils.clamp(x, -d.W / 2 + 0.5, d.W / 2 - 0.5), THREE.MathUtils.clamp(y, -d.D / 2 + 0.4, d.D / 2 - 0.6))) return;
  // Lo que hacía se acaba también en el estado (así el otro celular lo ve levantarse o quedarse en este cuarto)
  const e = s.personajes[yo];
  const ahora = Date.now();
  if (e.cuarto !== m.cuarto || e.actividad.accion) {
    await guardarYo({ ...est(yo), cuarto: m.cuarto, actividad: { tipo: 'nada', desde: ahora }, visto: ahora });
  }
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
    // Cada medio segundo de reloj real (aunque el celular vaya lento, despertar y demás no se atrasan)
    if (ahora - ultimaRevision >= 500) {
      ultimaRevision = ahora;
      revisar();
      renovarTele();
      revisarRecuerdos();
    }
    revisarVista();
    efectos();
    mundo.dibujar(paso, true);
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
    if (!m.visible) {
      capa.poner(`${r}-efecto`, null, 0, 0);
      capa.poner(`${r}-piensa`, null, 0, 0);
      continue;
    }
    const p = mundo.aPantalla(m.cabeza());
    capa.poner(`${r}-efecto`, m.efecto, p.x, p.y);
    // Globo de pensamiento con lo que más necesita (si está libre)
    const e = est(r);
    const falta = NECESIDADES.filter((n) => e[n] < 30).sort((a, b) => e[a] - e[b])[0];
    capa.poner(`${r}-piensa`, !m.efecto && falta && !m.enCamino ? 'pensamiento' : null, p.x, p.y, falta ? PENSAR[falta] : undefined);
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
});
(window as any).__mundo = () => mundo;
(window as any).__mascotas = () => mascotas;
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
/** Posición en pantalla del aro de un sitio de decoración (pruebas). */
(window as any).__sitio = (id: string) => {
  const d = casa3d.sitioDe(id);
  if (!d) return null;
  const z = d.sitio.tipo === 'cuadro' ? d.sitio.z : d.sitio.z + 0.25;
  return mundo.aPantalla(new THREE.Vector3(d.sitio.x, z, -d.sitio.y));
};

iniciar().catch((e) => {
  console.error(e);
  $('carga-texto').textContent = 'No se pudo abrir la casa. Cierra y vuelve a abrir.';
});
