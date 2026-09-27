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
import { Mundo } from '../mundo';
import { elegirModelos, Productos } from '../recursos';
import * as sonido from '../sonido';
import { BONO_DIARIO, CATALOGO, EFECTO_CARINO, ITEM, Item, paraSitio, PREMIO_CARINO, TipoItem } from './catalogo';
import { Casa3D, Sitio } from './escena_casa';
import { Mascota } from './mascota';
import {
  Accion, alDia, animo, Casa, colorSeguro, Cuarto, CUARTOS, diasPara, EstadoPersonaje, Evento, FechaEspecial, hoy, Necesidad,
  NECESIDADES, NOMBRE_CUARTO, NOMBRE_NECESIDAD, nuevoId, otro, personajeNuevo, Rol, sumar,
} from './modelo';
import {
  configLinea, guardarConfigLinea, olvidarSesion, PersonajeOcupado, QueCambio, sesionGuardada, Sincro, SincroLinea, SincroLocal,
} from './sincro';
import {
  $, abrirHoja, Capa, caraClase, cerrarHoja, cerrarVentana, cuerpoHoja, esc, hojaAbierta, ico, iconoItem, lluviaCorazones,
  mostrar, nombre, pintarNecesidades, SVG, toast, ventana,
} from './ui_casa';

const params = new URLSearchParams(location.search);
const CLAVE_MODO = 'nuestro-hogar-modo';
const CLAVE_VISTO = (r: Rol) => `nuestro-hogar-visto-${r}`;
/** Monedas ganadas en el súper que esperan pasar a la casa (las escribe super.html). */
export const CLAVE_SUELDO = 'nuestro-hogar-sueldo';
const BONO_ANIVERSARIO = 50;
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
    mensajes.push(`Llegó el sueldo del súper: +${sueldo} monedas`);
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
  verCuarto(cuarto);
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
  if (e.energia >= 92) return toast('Todavía no tiene sueño.');
  const ahora = Date.now();
  verCuarto('cuarto');
  sonido.bostezo();
  await guardarYo({ ...e, cuarto: 'cuarto', actividad: { tipo: 'dormir', desde: ahora }, visto: ahora });
  toast('A dormir. La energía sube mientras duerme (también con la app cerrada).', 3400);
}

async function despertar(auto = false) {
  if (!s || !dormido(yo)) return;
  const ahora = Date.now();
  const e = est(yo);
  await guardarYo({ ...e, actividad: { tipo: 'nada', desde: ahora, accion: 'saludo', hasta: ahora + 2500 }, visto: ahora });
  toast(auto ? `${nombre(yo)} se despertó con toda la energía.` : '¡Buenos días!');
}

// ---------------------------------------------------------------------------
// Con la pareja
// ---------------------------------------------------------------------------
async function premio(tipo: string) {
  const p = PREMIO_CARINO[tipo] ?? 0;
  if (!p || !(await unaVez(`${hoy()}|${yo}|${tipo}`, p))) return;
  setTimeout(() => toast(`Primer${tipo === 'caricia' ? 'a caricia' : tipo === 'abrazo' ? ' abrazo' : ' beso'} del día: +${p} monedas`), 1800);
}

function coreografia(tipo: 'caricia' | 'abrazo' | 'beso' | 'regalo', de: Rol, item?: string) {
  const para = otro(de);
  mascotas[de].interactuar(tipo, mascotas[para], de, item);
  mascotas[para].interactuar(tipo, mascotas[de], de, item);
  verCuarto(mascotas[para].cuarto);
  setTimeout(() => (tipo === 'beso' ? sonido.beso() : tipo === 'regalo' ? sonido.regalo() : sonido.abrazo()), 1500);
}

/** Un mimo a la vez: mientras los dos posan, otro toque no empieza otra coreografía. */
function ocupados() {
  if (mascotas[yo].ocupado || mascotas[otro(yo)].ocupado) {
    toast('Un momentico…');
    return true;
  }
  return false;
}

async function carino(tipo: 'caricia' | 'abrazo' | 'beso') {
  if (!s) return;
  if (dormido(yo)) return toast('Primero hay que despertar.');
  if (ocupados()) return;
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
  await premio(tipo);
}

async function regalar(id: string, mensaje: string) {
  if (!s || (s.casa.inventario[id] ?? 0) <= 0) return;
  if (dormido(yo)) return toast('Primero hay que despertar.');
  if (ocupados()) return;
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
  if (ocupados()) return;
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
  }
  escribir(CLAVE_VISTO(yo), Date.now());
  void aplicarPendientes();
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
    const comidas = CATALOGO.filter((i) => i.tipo === 'comida' && i.precio >= 6);
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
    return `<button class="cuarto-tab" data-cuarto="${c}" aria-current="${c === casa3d.actual}">${NOMBRE_CUARTO[c]}${
      quien.length ? `<span class="quien">${quien.map((r) => `<span class="${caraClase(r)}"></span>`).join('')}</span>` : ''
    }</button>`;
  }).join(''));
}

type Boton = { id: string; texto: string; icono: string; principal?: boolean; activo?: boolean };

function botonesCuarto(): Boton[] {
  if (!s) return [];
  if (dormido(yo)) return [{ id: 'despertar', texto: 'Despertar', icono: ico('despertar'), principal: true }];
  const b: Boton[] = [];
  switch (casa3d.actual) {
    case 'sala':
      b.push({ id: 'sofa', texto: 'Descansar', icono: ico('sofa') }, { id: 'tv', texto: 'Ver tele', icono: ico('tv') });
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
    { id: 'pareja', texto: nombre(otro(yo)), icono: ico('carino') },
    { id: 'decorar', texto: decorando ? 'Listo' : 'Decorar', icono: ico('decorar'), activo: decorando },
    { id: 'tienda', texto: 'Tienda', icono: ico('tienda') },
  ];
  if (regaloPendiente()) b.unshift({ id: 'abrir-regalo', texto: 'Abrir regalo', icono: `<img src="${iconoItem(ITEM.cajita)}" alt="">`, principal: true });
  html(cont, b
    .map((x) => `<button class="accion${x.principal ? ' principal' : ''}${x.activo ? ' activa' : ''}" data-accion="${x.id}">${x.icono}<span>${esc(x.texto)}</span></button>`)
    .join(''));
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
      return hacer('tv', 'sala', 10, { energia: 4, carino: 2 });
    case 'comer':
      return elegirComida('comer');
    case 'notas':
      void hacer('nevera', 'cocina', 6, {});
      return hojaNotas();
    case 'banar':
      sonido.burbuja();
      await hacer('banar', 'bano', 8, { higiene: 100 });
      for (let i = 1; i < 6; i++) setTimeout(() => sonido.burbuja(), i * 700);
      return;
    case 'lavar':
      return hacer('lavar', 'bano', 5, { higiene: 25 });
    case 'dormir':
      return dormir();
    case 'closet':
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
    const lista = CATALOGO.filter((i) => i.tipo === tab && i.id !== 'osito_deco');
    const html = `<p class="nota-hoja">Las monedas son de los dos. Se ganan con el bono de cada día, los primeros mimos del día y trabajando en el súper.</p>
      <ul class="catalogo-casa">${lista
        .map((it) =>
          tarjetaItem(it, `<span class="tengo">${s!.casa.inventario[it.id] ? `Tienen ${s!.casa.inventario[it.id]}` : ''}</span>
            <button class="boton-precio-casa" data-comprar="${it.id}" ${s!.casa.monedas < it.precio ? 'disabled' : ''}><i class="moneda"></i>${it.precio}</button>`),
        )
        .join('')}</ul>`;
    abrirHoja('Tienda de la casa', html, {
      mantener: true,
      saldo: s.casa.monedas,
      pestanas: [
        { id: 'comida', nombre: 'Comida' },
        { id: 'regalo', nombre: 'Regalos' },
        { id: 'deco', nombre: 'Decoración' },
      ],
      activa: tab,
      alPestana: (p) => hojaTienda(p as TipoItem),
      alCerrar: () => (repintarHoja = null),
    });
  };
  repintarHoja = pintar;
  pintar();
}

async function comprar(id: string) {
  const it = ITEM[id];
  if (!s || !it || s.casa.monedas < it.precio) return toast('No alcanzan las monedas.');
  const ok = await cambiarCasa((c) => {
    if (c.monedas < it.precio) throw new Error('No alcanzan las monedas.');
    c.monedas -= it.precio;
    c.inventario[id] = (c.inventario[id] ?? 0) + 1;
  });
  if (ok) {
    sonido.caja();
    toast(`Compraron: ${it.nombre}`);
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

function hojaPareja() {
  if (!s) return;
  const par = otro(yo);
  const pintar = () => {
    const e = est(par);
    const a = s!.personajes[par].actividad;
    const donde = NOMBRE_CUARTO[s!.personajes[par].cuarto].toLowerCase();
    const haciendo = a.tipo === 'dormir' ? `Está durmiendo en el ${donde}.` : `Está en ${s!.personajes[par].cuarto === 'bano' ? 'el baño' : `la ${donde}`}.`;
    const linea = s!.enLinea[par] ? 'En línea ahora.' : `Entró por última vez ${haceCuanto(s!.personajes[par].visto)}.`;
    const an = animo(e);
    const html = `<div class="estado-pareja">
        <p class="nota-hoja">${esc(haciendo)} ${esc(linea)} ${an === 'triste' ? 'Necesita que la consientas.' : an === 'feliz' ? 'Se ve feliz.' : ''}</p>
        <ul class="necesidades" id="necesidades-pareja"></ul>
        <div class="menu-casa">
          <button class="accion" data-mimo="caricia">${ico('caricia')}<span>Caricia</span></button>
          <button class="accion" data-mimo="abrazo">${ico('abrazo')}<span>Abrazo</span></button>
          <button class="accion principal" data-mimo="beso">${ico('beso')}<span>Beso</span></button>
          <button class="accion" data-hoja="regalar"><img src="${iconoItem(ITEM.flores)}" alt=""><span>Regalar</span></button>
          <button class="accion" data-hoja="llevar"><img src="${iconoItem(ITEM.manzana)}" alt=""><span>Llevar comida</span></button>
          <button class="accion" data-hoja="notas">${ico('nota')}<span>Dejar una nota</span></button>
          <button class="accion" data-mimo="saludo">${ico('saludo')}<span>Saludar</span></button>
        </div>
      </div>`;
    abrirHoja(`${nombre(par)}`, html, { mantener: true, alCerrar: () => (repintarHoja = null) });
    pintarNecesidades($('necesidades-pareja'), e);
  };
  repintarHoja = pintar;
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
        <p>Atiende la tiendita de barrio: reponer, cobrar, limpiar y atrapar ladrones. Un tercio de lo que ganes cada día llega a la casa como sueldo.</p>
        <a class="boton boton-tomate" href="./super.html">Ir a trabajar</a>
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
      <label class="campo">Clave pública (anon)<input id="cfg-clave" placeholder="eyJhbGciOi…" value="${esc(cfg?.clave ?? '')}"></label>
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
    verCuarto(b.dataset.cuarto as Cuarto);
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
    if ((b = d('[data-comprar]'))) void comprar(b.dataset.comprar!);
    else if ((b = d('[data-comer]'))) {
      cerrarHoja();
      void comer(b.dataset.comer!);
    } else if ((b = d('[data-llevar]'))) void mandarComida(b.dataset.llevar!);
    else if ((b = d('[data-ir-tienda]'))) hojaTienda((b.dataset.irTienda || 'comida') as TipoItem);
    else if ((b = d('[data-mimo]'))) {
      const m = b.dataset.mimo!;
      if (m === 'saludo') void saludar();
      else void carino(m as 'caricia' | 'abrazo' | 'beso');
    } else if ((b = d('[data-hoja]'))) {
      const h = b.dataset.hoja!;
      if (h === 'regalar') hojaRegalar();
      else if (h === 'llevar') elegirComida('llevar');
      else if (h === 'notas') hojaNotas();
      else if (h === 'album') hojaAlbum();
      else if (h === 'fechas') hojaFechas();
      else if (h === 'juegos') hojaJuegos();
      else if (h === 'tienda') hojaTienda('comida');
      else if (h === 'ajustes') hojaAjustes();
    } else if ((b = d('[data-elegir-regalo]'))) {
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
  // Pasear: su personaje camina hasta donde se tocó (si está en ese cuarto y libre)
  const m = mascotas[yo];
  if (t.tipo === 'suelo' && m.cuarto === casa3d.actual && !dormido(yo)) {
    const d = casa3d.dato;
    m.pasear(THREE.MathUtils.clamp(t.x, -d.W / 2 + 0.5, d.W / 2 - 0.5), THREE.MathUtils.clamp(t.y, -d.D / 2 + 0.4, d.D / 2 - 0.8));
  }
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
    ${bajos ? `<ul class="nota-hoja">${bajos}</ul>` : '<p class="nota-hoja">Está muy bien. Las necesidades bajan poco a poco, incluso con la app cerrada.</p>'}`);
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
let cadaSegundo = 0;
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
    cadaSegundo -= paso;
    if (cadaSegundo <= 0) {
      cadaSegundo = 0.5;
      revisar();
    }
    efectos();
    mundo.dibujar(paso, true);
  } catch (e) {
    // Un error en un cuadro no debe congelar la casa; se reporta una vez
    if (!errorReportado) console.error(e);
    errorReportado = true;
  }
}
let errorReportado = false;

/** Cada medio segundo: estado de los personajes, barras, despertar solo, regalo por abrir. */
function revisar() {
  if (!s) return;
  const ahora = Date.now();
  for (const r of ['el', 'ella'] as Rol[]) mascotas[r].aplicar(s.personajes[r], ahora);
  pintarNecesidades($('necesidades'), est(yo));
  if (dormido(yo) && est(yo).energia >= 100) void despertar(true);
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
    capa.poner(`${r}-piensa`, !m.efecto && falta && !m.p.moviendo ? 'pensamiento' : null, p.x, p.y, falta ? PENSAR[falta] : undefined);
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
(window as any).__escena = (r: Rol) => mascotas?.[r].escenaActual ?? '';
(window as any).__fase = (r: Rol) => mascotas?.[r].fase ?? null;
(window as any).__quieto = (r: Rol) => !!s && mascotas[r].mostrando(s.personajes[r]);
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
