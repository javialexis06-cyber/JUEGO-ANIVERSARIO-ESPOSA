// Súper Manía en Pareja · jugable 1 (la tiendita completa: 25 días, solo con Él, los dos en el mismo celular o en
// línea, cada uno en su celular).
// Letras empacadas con el juego (funciona sin internet, también en la app de Android)
import '@fontsource/courier-prime/latin-400.css';
import '@fontsource/courier-prime/latin-700.css';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import './estilos.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { AYUDAS, AYUDAS_MAX, CLIENTES, GrupoMejora, MEJORAS, TipoCliente } from './balance';
import * as guardado from './guardado';
import { aplicarOrden, Espejo, tomarFoto, type Orden } from './espejo';
import { Juego, NivelDato, Resultado, textoDe } from './juego';
import type { Jugador, Rol } from './jugador';
import { CanalSuper, type ConfigDia, type Mensaje } from './linea_super';
import { Mandos } from './mando';
import { Mundo } from './mundo';
import { cargar, cargarAnimado, cargarJSON, elegirModelos, icono, Productos } from './recursos';
import * as sonido from './sonido';
import { liberarPropios, NOMBRE_SECCION, Tienda, TiendaDato } from './tienda';
import { mostrar, pantallaUnica, UI } from './ui';

const CLAVE_SUELDO = 'nuestro-hogar-sueldo';
/** Parte de la ganancia del día que llega a la casa como sueldo: un tercio, dividido entre 4 (la casa se paga con calma). */
const SUELDO_FRACCION = 1 / 12;
const CLAVE_MODO = 'supermania-modo';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const NIVELES_JUGABLES = 25;
// (los días duran la mitad que antes y se gana menos por día: todo cuesta un 30 % menos)
const PRECIO_COMPRA: Record<string, number> = { frutas: 40, abarrotes: 40, bebidas: 40, lacteos: 55, panaderia: 55, congelados: 70, carnes: 70 };
const PRECIO_MEJORA_VITRINA = 65;
const PRECIO_MEJORA_CAJA = 85;
/** Producto de muestra por sección (para los íconos de «qué prefiere cada cliente»). */
const MUESTRA: Record<string, string> = { frutas: 'manzana', lacteos: 'leche', abarrotes: 'enlatado', bebidas: 'gaseosa', panaderia: 'pan', congelados: 'helado', carnes: 'pollo' };

const params = new URLSearchParams(location.search);
const BOT = params.has('bot');
const RAPIDO = Number(params.get('rapido') ?? 1) || 1;

let mundo: Mundo;
let ui: UI;
let productos: Productos;
let tiendaDato: TiendaDato;
let niveles: NivelDato[];
let escalas: Record<string, number> = {};
let partida: guardado.Partida;
let juego: Juego | null = null;
let fondo: Tienda | null = null;
let pausado = false;
let nivelElegido = 1;
let legendario = false;
let mandos: Mandos;
/** Solo (Él), los dos en el mismo celular (dos joysticks) o en línea (cada uno en su celular). */
type Modo = 'solo' | 'pareja' | 'linea';
let modo: Modo = (() => {
  try {
    const m = localStorage.getItem(CLAVE_MODO);
    return m === 'pareja' || m === 'linea' ? m : 'solo';
  } catch {
    return 'solo';
  }
})();

async function iniciar() {
  mundo = new Mundo($('lienzo') as HTMLCanvasElement);
  ui = new UI(mundo);
  mandos = new Mandos($('mandos'));
  pantallaUnica('carga');
  const barra = $('carga-barra');
  const pasos: (() => Promise<unknown>)[] = [
    elegirModelos,
    async () => (tiendaDato = await cargarJSON<TiendaDato>('tienda1.json')),
    async () => (niveles = await cargarJSON<NivelDato[]>('niveles.json', './datos/')),
    async () => {
      const m = await cargarJSON<any>('manifest_export.json');
      escalas = m?.personajes?.escalas ?? {};
    },
    async () => (productos = await Productos.cargar()),
    () => cargar('tienda1_base.glb'),
    () => cargar('boton_comprar.glb'),
    ...['estante', 'frutas', 'nevera', 'caja'].map((k) => () => cargar(`vitrina_${k}_1.glb`)),
    () => cargarAnimado('el.glb'),
    () => cargarAnimado('ella.glb'),
    () => cargar('carrito_1.glb'),
    () => cargar('canasta.glb'),
    () => cargar('caneca.glb'),
  ];
  for (let i = 0; i < pasos.length; i++) {
    await pasos[i]();
    barra.style.width = `${((i + 1) / pasos.length) * 100}%`;
  }
  partida = guardado.cargar(tiendaDato);
  await montarFondo();
  conectarBotones();
  abrirMenu();
  // En línea: se escuchan invitaciones si se entró por el aviso de la casa o si el último modo fue en línea
  if (unirse) {
    sala('Conectando…', 'Entrando a la tienda de tu pareja…', { esperando: true, no: 'Cancelar' });
    window.setTimeout(() => {
      if (!linea && !invitacionVista && !$('sala').hidden) sala('La invitación ya no está', 'Parece que ya se cerró. Pueden abrir la tienda otra vez desde el menú.', { no: 'Volver' });
    }, 15_000);
  }
  if (unirse || modo === 'linea') {
    void asegurarCanal().then((ok) => {
      if (!ok && unirse && !$('sala').hidden) sala('No se pudo conectar', canal?.error || 'Revisa el internet e intenta otra vez.', { no: 'Volver' });
    });
  }
  let antes = performance.now();
  let acumulado = 0;
  const bucle = (ahora: number) => {
    acumulado += Math.min((ahora - antes) / 1000, 0.1);
    antes = ahora;
    requestAnimationFrame(bucle);
    // 30 cuadros por segundo: se ve igual de bonito y el celular no se calienta (el doble de cuadros era el doble
    // de trabajo para la tarjeta gráfica con las sombras y el suavizado)
    if (!BOT && acumulado < 1 / 32) return;
    const dt = Math.min(acumulado, 0.1);
    acumulado = 0;
    try {
      paso(dt);
    } catch (e) {
      console.error(e);
    }
  };
  const paso = (dt: number) => {
    if (linea) vigilarLinea();
    // En línea, el invitado no simula: copia las fotos del anfitrión y mueve su personaje con el joystick
    const espejo = linea?.fase === 'jugando' ? linea.espejo : null;
    if (juego && espejo && !pausado && !juego.terminado) {
      const m = mandos.leer(0);
      espejo.update(dt, m);
      mandarMando(linea!, m);
      ui.actualizar(juego, dt);
      sonido.musica.tempo((juego.legendario ? 112 : 100) + (!juego.cerrado && juego.restante < 25 ? 14 : 0));
    } else if (juego && !espejo && !pausado && !juego.terminado) {
      // En pruebas (?bot&rapido=N) se simulan N pasos fijos de 0,1 s por cuadro
      const pasos = BOT ? RAPIDO : 1;
      if (linea && canal) {
        // En línea: el joystick de este celular mueve al personaje propio y el del otro llega por el canal
        for (const p of juego.jugadores) p.mando = p.rol === canal.yo ? mandos.leer(0) : linea.mandoRemoto;
      } else if (!BOT) juego.jugadores.forEach((p, i) => (p.mando = mandos.leer(i)));
      for (let k = 0; k < pasos && !juego.terminado; k++) {
        if (BOT) piloto(juego);
        juego.update(BOT ? 0.1 : dt);
      }
      if (!juego.terminado) ui.actualizar(juego, BOT ? 0.1 * RAPIDO : dt);
      // La música se apura cuando falta poco para cerrar
      sonido.musica.tempo((juego.legendario ? 112 : 100) + (!juego.cerrado && juego.restante < 25 ? 14 : 0));
      // Una foto de la tienda para el otro celular cada décima de segundo
      if (linea?.anfitrion && linea.fase === 'jugando' && !juego.terminado) {
        linea.relojFoto += dt;
        if (linea.relojFoto >= 0.1) {
          linea.relojFoto = 0;
          enviarFoto(linea);
        }
      }
    }
    mundo.dibujar(dt, !!juego && !juego.terminado && !pausado);
  };
  requestAnimationFrame(bucle);
}

/** La tienda de fondo del menú y de la tienda de mejoras, con lo que se ha comprado. */
let turnoFondo = 0;
async function montarFondo() {
  // Dos compras seguidas no dejan dos tiendas montadas: solo la última se queda
  const turno = ++turnoFondo;
  if (fondo) {
    mundo.escena.remove(fondo.grupo);
    liberarPropios(fondo.grupo);
    fondo = null;
  }
  const nueva = new Tienda(tiendaDato, productos);
  await nueva.montar(partida.sitios, partida.mejoras);
  if (turno !== turnoFondo || juego) {
    liberarPropios(nueva.grupo);
    return;
  }
  fondo = nueva;
  mundo.escena.add(fondo.grupo);
  mundo.encuadrar(tiendaDato.W, tiendaDato.D);
  mundo.sucio = true;
}

function nivelDesbloqueado(n: number) {
  return n === 1 || !!partida.estrellas[n - 1]?.[0];
}
/** Día más alto al que se ha llegado (abre mejoras del catálogo). */
function diaAlcanzado() {
  let d = 1;
  for (let n = 1; n <= NIVELES_JUGABLES; n++) if (nivelDesbloqueado(n)) d = n;
  return d;
}

function abrirMenu() {
  ui.terminarNivel();
  mandos.mostrar(false);
  sonido.musica.iniciar('menu');
  pantallaUnica('menu');
  $('menu-dinero').textContent = String(partida.dinero);
  $('menu-fichas').textContent = String(guardado.fichas(partida));
  $('menu-estrellas').textContent = `${guardado.totalEstrellas(partida)} / ${NIVELES_JUGABLES * 3}`;
  $('menu-lunas').textContent = String(guardado.cuenta(partida.lunas));
  $('menu-corazones').textContent = String(guardado.cuenta(partida.corazones));
  const lista = $('niveles');
  lista.innerHTML = '';
  let ultimo: HTMLElement | null = null;
  for (let n = 1; n <= NIVELES_JUGABLES; n++) {
    const nv = niveles[n - 1];
    const est = partida.estrellas[n] ?? [false, false, false];
    const libre = nivelDesbloqueado(n);
    const b = document.createElement('button');
    b.className = `etiqueta${libre ? '' : ' bloqueada'}${nv.evento || nv.noticia ? ' evento' : ''}`;
    b.disabled = !libre;
    b.innerHTML = `<span class="etiqueta-hueco" aria-hidden="true"></span>
      <span class="etiqueta-num">${n}</span>
      <span class="etiqueta-dia">${nv.evento ?? (nv.noticia ? 'Noticia' : `Día ${nv.dia}`)}</span>
      <span class="etiqueta-estrellas">${est.map((e) => `<i class="${e ? 'si' : ''}"></i>`).join('')}</span>
      <span class="etiqueta-extras">${partida.lunas[n] ? '<i class="luna" title="Luna"></i>' : ''}${partida.corazones[n] ? '<i class="corazon" title="Corazón"></i>' : ''}</span>`;
    b.setAttribute('aria-label', `Nivel ${n}${libre ? '' : ' (bloqueado)'}`);
    b.addEventListener('click', () => abrirTarjeta(n));
    lista.appendChild(b);
    if (libre) ultimo = b;
  }
  // El riel arranca mostrando el último día abierto
  ultimo?.scrollIntoView({ inline: 'center', block: 'nearest' });
}

function tiposDelDia(nv: NivelDato): TipoCliente[] {
  const t = (Object.keys(CLIENTES) as TipoCliente[]).filter((k) => CLIENTES[k].desde <= nv.dia);
  if (nv.problemas.includes('famoso')) t.push('famoso');
  return t;
}

function abrirTarjeta(n: number) {
  nivelElegido = n;
  const tres = (partida.estrellas[n] ?? []).filter(Boolean).length === 3;
  if (!tres) legendario = false;
  const nv = nivelDeJuego(n);
  pantallaUnica('tarjeta');
  $('tarjeta-titulo').textContent = `${legendario ? 'Legendario' : 'Nivel'} ${n}`;
  $('tarjeta-sub').textContent = `${tiendaDato.nombre} · Día ${nv.dia} · ${nv.clientes.solitario} clientes`;
  // Solo (Él), los dos en este celular (Él con el joystick de la izquierda, Ella con el de la derecha) o en línea
  $('btn-modo-solo').setAttribute('aria-pressed', String(modo === 'solo'));
  $('btn-modo-pareja').setAttribute('aria-pressed', String(modo === 'pareja'));
  $('btn-modo-linea').setAttribute('aria-pressed', String(modo === 'linea'));
  pintarNotaModo();
  if (modo === 'linea') void asegurarCanal().then(pintarNotaModo);
  $('tarjeta-novedad').textContent = legendario
    ? 'El doble de clientes, la mitad de paciencia y más problemas. Se juega con todas tus mejoras.'
    : nv.descripcion_evento ?? nv.novedad ?? 'Atiende bien a todos y no dejes vitrinas vacías.';
  $('tarjeta-evento').textContent = legendario ? 'Modo legendario' : nv.evento ?? (nv.noticia ? 'Día con noticia' : 'Día normal');
  // Recorte del Diario del Barrio
  const nt = !legendario ? nv.noticia : null;
  $('tarjeta-noticia').hidden = !nt;
  if (nt) {
    $('noticia-fecha').textContent = `Día ${nv.dia} · edición de la mañana`;
    $('noticia-titular').textContent = nt.titular;
    $('noticia-texto').textContent = nt.texto;
  }
  $('tarjeta-evento').classList.toggle('legendario', legendario);
  // Quién viene hoy y qué prefiere (como al empezar cada día en Supermarket Mania)
  $('tarjeta-clientes').innerHTML = tiposDelDia(nv)
    .map((t) => `<li><strong>${CLIENTES[t].nombre}</strong><span>${CLIENTES[t].prefiere.map((s) => `<img src="${icono(MUESTRA[s] ?? 'pan')}" alt="${NOMBRE_SECCION[s] ?? s}" title="${NOMBRE_SECCION[s] ?? s}">`).join('')}</span></li>`)
    .join('');
  const ul = $('tarjeta-objetivos');
  if (legendario && nv.legendario) {
    ul.innerHTML = `<li class="${partida.lunas[n] ? 'hecha' : ''} luna"><span class="sello-mini"></span>${nv.legendario.luna.texto.solitario}</li>`;
  } else {
    const previas = partida.estrellas[n] ?? [];
    ul.innerHTML = nv.estrellas.map((e, i) => `<li class="${previas[i] ? 'hecha' : ''}"><span class="sello-mini"></span>${textoDe(e.texto)}${i === 0 ? ' <em>(obligatoria)</em>' : ''}</li>`).join('');
  }
  const bl = $('btn-legendario');
  bl.hidden = !tres || !nv.legendario;
  bl.textContent = legendario ? 'Volver al modo normal' : 'Modo legendario';
  bl.setAttribute('aria-pressed', String(legendario));
}

/** Copia del nivel con las reglas del modo legendario y, en pareja, con los clientes y las metas de los dos
 *  (puestos donde el juego lee las de uno solo). */
function nivelDeJuego(n: number, pareja = modo !== 'solo'): NivelDato {
  const base = niveles[n - 1];
  let nv: NivelDato = base;
  if (legendario && base.legendario) nv = { ...base, clientes: base.legendario.clientes, paciencia: base.legendario.paciencia };
  if (!pareja) return nv;
  const x = nv.clientes.pareja / Math.max(1, nv.clientes.solitario);
  const par = <T,>(v: T | { solitario: T; pareja: T }): T => (typeof v === 'object' && v !== null && 'pareja' in (v as object) ? (v as { pareja: T }).pareja : v as T);
  const l = nv.legendario;
  return {
    ...nv,
    clientes: { solitario: nv.clientes.pareja, pareja: nv.clientes.pareja },
    estrellas: nv.estrellas.map((e) => ({ ...e, texto: par(e.texto), meta: par(e.meta) })),
    legendario: l && {
      ...l,
      luna: {
        ventas: { solitario: Math.round(l.luna.ventas.solitario * x) },
        perdidos_max: { solitario: Math.round(l.luna.perdidos_max.solitario * x) },
        texto: { solitario: `Vender ${Math.round(l.luna.ventas.solitario * x)} y perder máximo ${Math.round(l.luna.perdidos_max.solitario * x)} clientes` },
      },
    },
  };
}

async function jugar(n: number) {
  sonido.activar();
  sonido.musica.iniciar('juego', legendario ? 112 : 100);
  pantallaUnica(null);
  if (juego) juego.destruir();
  turnoFondo++;
  if (fondo) {
    mundo.escena.remove(fondo.grupo);
    liberarPropios(fondo.grupo);
    fondo = null;
  }
  $('cargando-nivel').hidden = false;
  // El día empieza a correr solo cuando todo está cargado
  juego = null;
  const enPareja = modo === 'pareja';
  const nuevo = new Juego(mundo, nivelDeJuego(n, enPareja), productos, tiendaDato, partida.sitios, escalas, partida.mejoras, legendario, enPareja);
  await nuevo.preparar();
  juego = nuevo;
  $('cargando-nivel').hidden = true;
  ui.empezarNivel(juego, partida.ayudas);
  mandos.mostrar(true, enPareja, juego.jugadores.map((p) => p.nombre));
  ui.alTocarAlerta = (id) => {
    const v = juego?.tienda.vitrinas.find((x) => x.dato.id === id);
    if (v && juego?.reponerSeccion(v)) ui.aviso('Reposición en la fila');
  };
  ui.alUsarAyuda = (id) => {
    if (!juego || (partida.ayudas[id] ?? 0) <= 0) return;
    if (juego.usarAyuda(id)) {
      partida.ayudas[id]--;
      guardado.guardar(partida);
      ui.pintarAyudas(partida.ayudas, juego);
    }
  };
  ui.alTomarCorazon = () => juego?.tomarCorazon();
  juego.alTerminar = (r) => terminarDia(juego!, n, r);
  pausado = false;
}

/** Fin del día: estrellas, monedas y el sueldo para la casa (en línea, el sueldo lo pone solo el que invitó, porque
 *  la casa es una sola). */
function terminarDia(j: Juego, n: number, r: Resultado, sueldoDe: Rol | null = null) {
  const antes = partida.estrellas[n] ?? [false, false, false];
  const fichasAntes = guardado.fichasGanadas(partida);
  if (!j.legendario) partida.estrellas[n] = antes.map((e, i) => e || r.estrellas[i]);
  if (r.luna) partida.lunas[n] = true;
  const fichasNuevas = guardado.fichasGanadas(partida) - fichasAntes;
  $('rec-fichas').hidden = fichasNuevas <= 0;
  $('rec-fichas').textContent = `+${fichasNuevas} ${fichasNuevas === 1 ? 'estrella' : 'estrellas'} para mejorar la tienda (tienes ${guardado.fichas(partida)})`;
  if (r.corazon) partida.corazones[n] = true;
  partida.dinero += r.ganancia;
  guardado.guardar(partida);
  // Una parte de lo ganado pasa a la casa (Nuestro Hogar) como sueldo (al menos 1 moneda si se ganó algo)
  const sueldo = r.ganancia > 0 ? Math.max(1, Math.round(r.ganancia * SUELDO_FRACCION)) : 0;
  if (!sueldoDe) {
    try {
      localStorage.setItem(CLAVE_SUELDO, String((Number(localStorage.getItem(CLAVE_SUELDO)) || 0) + sueldo));
    } catch {
      /* sin almacenamiento */
    }
  }
  $('rec-sueldo').hidden = sueldo <= 0;
  $('rec-sueldo').textContent = sueldoDe
    ? `Sueldo para la casa: +${sueldo} monedas (llegan por el celular de ${NOMBRE[sueldoDe]})`
    : `Sueldo para la casa: +${sueldo} monedas`;
  ui.terminarNivel();
  mandos.mostrar(false);
  ui.resultado(j, r, antes);
  pantallaUnica('resultado');
  (window as any).__resultado = r;
}

function abrirMejoras() {
  pantallaUnica('mejoras');
  pintarMejoras();
}

function pintarMejoras() {
  $('mej-dinero').textContent = String(partida.dinero);
  $('mej-fichas').textContent = String(guardado.fichas(partida));
  const lista = $('mej-lista');
  lista.innerHTML = '';
  const dia = diaAlcanzado();
  const titulo = (t: string) => {
    const li = document.createElement('li');
    li.className = 'catalogo-grupo';
    li.textContent = t;
    lista.appendChild(li);
  };
  const fila = (nombre: string, detalle: string, precio: number, accion: () => void, estado: 'comprar' | 'listo' | 'bloqueado' = 'comprar', bloqueo = '', conFichas = false) => {
    const li = document.createElement('li');
    if (estado === 'bloqueado') li.className = 'bloqueada';
    li.innerHTML = `<div><strong>${nombre}</strong><span>${estado === 'bloqueado' ? bloqueo : detalle}</span></div>`;
    const b = document.createElement('button');
    b.className = `boton-precio${conFichas ? ' con-fichas' : ''}`;
    const alcanza = () => (conFichas ? guardado.fichas(partida) >= precio : partida.dinero >= precio);
    b.disabled = estado !== 'comprar' || !alcanza();
    b.textContent = estado === 'listo' ? 'Listo' : estado === 'bloqueado' ? '—' : `${precio}`;
    if (conFichas && estado === 'comprar') b.setAttribute('aria-label', `${precio} estrellas`);
    b.addEventListener('click', async () => {
      if (!alcanza()) return;
      if (conFichas) partida.gastadas += precio;
      else partida.dinero -= precio;
      accion();
      sonido.activar();
      sonido.caja();
      guardado.guardar(partida);
      pintarMejoras();
      await montarFondo();
    });
    li.appendChild(b);
    lista.appendChild(li);
  };
  titulo('Vitrinas');
  let alTope = 0;
  for (const s of tiendaDato.sitios) {
    const nv = partida.sitios[s.id] ?? 0;
    const nombre = NOMBRE_SECCION[s.seccion] ?? s.seccion;
    if (!nv) fila(`Comprar ${nombre}`, s.isla ? 'Góndola en la isla del centro' : 'Vitrina nueva de nivel 1', PRECIO_COMPRA[s.seccion] ?? 80,
      () => (partida.sitios[s.id] = 1), dia >= 3 ? 'comprar' : 'bloqueado', 'Desde el día 3');
    else if (nv < tiendaDato.tope) {
      const caja = s.seccion === 'caja';
      fila(caja ? 'Mejorar la caja' : `Mejorar ${nombre}`, caja ? 'Banda: cobra 40 % más rápido' : 'Nivel 2: el doble de capacidad',
        caja ? PRECIO_MEJORA_CAJA : PRECIO_MEJORA_VITRINA, () => (partida.sitios[s.id] = nv + 1), dia >= 4 ? 'comprar' : 'bloqueado', 'Desde el día 4');
    } else alTope++;
  }
  if (alTope) fila(`${alTope} vitrina${alTope > 1 ? 's' : ''} al tope`, 'Ya están en el nivel máximo de esta tienda', 0, () => {}, 'listo');
  const grupos: GrupoMejora[] = ['Él', 'Bodega', 'Tienda', 'Ayudantes'];
  for (const g of grupos) {
    titulo(g === 'Él' ? 'Para Él y Ella' : g);
    for (const m of MEJORAS.filter((x) => x.grupo === g)) {
      const base = m.id === 'carrito' ? 1 : 0;
      const nivel = partida.mejoras[m.id] ?? base;
      const k = nivel - base;
      if (k >= m.niveles.length) {
        fila(m.nombre, m.niveles[m.niveles.length - 1].texto, 0, () => {}, 'listo');
        continue;
      }
      const sig = m.niveles[k];
      const nombre = m.niveles.length > 1 ? `${m.nombre} · nivel ${k + 1}` : m.nombre;
      fila(nombre, sig.texto, sig.precio, () => (partida.mejoras[m.id] = nivel + 1), dia >= m.desde ? 'comprar' : 'bloqueado', `Desde el día ${m.desde}`, true);
    }
  }
  titulo('Ayudas para un día');
  for (const a of AYUDAS) {
    const n = partida.ayudas[a.id] ?? 0;
    fila(`${a.nombre} (tienes ${n})`, a.texto, a.precio, () => (partida.ayudas[a.id] = n + 1),
      dia < a.desde ? 'bloqueado' : n >= AYUDAS_MAX ? 'listo' : 'comprar', `Desde el día ${a.desde}`);
  }
}

function conectarBotones() {
  $('btn-abrir').addEventListener('click', () => void (modo === 'linea' ? invitar() : jugar(nivelElegido)));
  $('btn-tarjeta-volver').addEventListener('click', abrirMenu);
  const elegirModo = (m: Modo) => {
    modo = m;
    try {
      localStorage.setItem(CLAVE_MODO, m);
    } catch {
      /* sin almacenamiento */
    }
    abrirTarjeta(nivelElegido);
  };
  $('btn-modo-solo').addEventListener('click', () => elegirModo('solo'));
  $('btn-modo-pareja').addEventListener('click', () => elegirModo('pareja'));
  $('btn-modo-linea').addEventListener('click', () => elegirModo('linea'));
  $('btn-sala-si').addEventListener('click', () => {
    if (invitacionVista) aceptar(invitacionVista);
  });
  $('btn-sala-no').addEventListener('click', () => void cancelarSala());
  $('btn-legendario').addEventListener('click', () => {
    legendario = !legendario;
    abrirTarjeta(nivelElegido);
  });
  $('btn-mejoras').addEventListener('click', abrirMejoras);
  $('btn-mej-cerrar').addEventListener('click', abrirMenu);
  $('btn-como').addEventListener('click', () => pantallaUnica('como'));
  $('btn-como-cerrar').addEventListener('click', abrirMenu);
  const pintarSonido = () => {
    $('btn-sonido').classList.toggle('apagado', sonido.silenciado());
    $('btn-sonido').setAttribute('aria-label', sonido.silenciado() ? 'Activar sonido' : 'Silenciar');
  };
  pintarSonido();
  $('btn-sonido').addEventListener('click', () => {
    sonido.alternar();
    pintarSonido();
  });
  const pintarMusica = () => {
    for (const id of ['btn-musica', 'btn-musica-menu']) $(id).textContent = sonido.musica.apagada() ? 'Música: apagada' : 'Música: sonando';
  };
  pintarMusica();
  for (const id of ['btn-musica', 'btn-musica-menu'])
    $(id).addEventListener('click', () => {
      sonido.activar();
      sonido.musica.alternar();
      pintarMusica();
    });
  // El navegador solo deja sonar después del primer toque
  document.addEventListener('pointerdown', () => {
    sonido.activar();
    sonido.musica.iniciar(juego && !juego.terminado ? 'juego' : 'menu');
  }, { once: true });
  $('btn-pausa').addEventListener('click', () => {
    pausar();
    // En línea se pausan los dos celulares
    if (linea?.fase === 'jugando') {
      linea.pausaPropia = true;
      canal?.mandar({ t: 'pausa', id: linea.id, si: true });
    }
  });
  $('btn-continuar').addEventListener('click', () => {
    if (linea?.pausaPorConexion) return;
    seguir();
    if (linea?.fase === 'jugando') {
      linea.pausaPropia = linea.pausaOtro = false;
      canal?.mandar({ t: 'pausa', id: linea.id, si: false });
    }
  });
  $('btn-salir').addEventListener('click', async () => {
    if (linea) {
      canal?.mandar({ t: 'salir', id: linea.id });
      cerrarLinea();
    }
    pausado = false;
    juego?.destruir();
    juego = null;
    await montarFondo();
    abrirMenu();
  });
  $('btn-siguiente').addEventListener('click', () => {
    legendario = false;
    abrirTarjeta(Math.min(nivelElegido + 1, NIVELES_JUGABLES));
  });
  $('btn-repetir').addEventListener('click', () => abrirTarjeta(nivelElegido));
  $('btn-rmejoras').addEventListener('click', async () => {
    juego?.destruir();
    juego = null;
    await montarFondo();
    abrirMejoras();
  });
  $('btn-rmenu').addEventListener('click', async () => {
    juego?.destruir();
    juego = null;
    await montarFondo();
    abrirMenu();
  });
  $('btn-borrar').addEventListener('click', async () => {
    const b = $('btn-borrar');
    if (b.dataset.confirmar !== '1') {
      b.dataset.confirmar = '1';
      b.textContent = 'Toca otra vez para borrar';
      return;
    }
    guardado.borrar();
    partida = guardado.nueva(tiendaDato);
    b.dataset.confirmar = '';
    b.textContent = 'Empezar de cero';
    await montarFondo();
    abrirMenu();
  });
  const lienzo = $('lienzo');
  let inicio = { x: 0, y: 0 };
  lienzo.addEventListener('pointerdown', (e) => {
    inicio = { x: e.clientX, y: e.clientY };
    sonido.activar();
  });
  lienzo.addEventListener('pointerup', (e) => {
    if (!juego || pausado || juego.terminado) return;
    if (Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 12) return;
    // En línea, el invitado le manda al anfitrión lo que tocó (y cada uno toca solo para su personaje)
    if (linea?.espejo && canal) {
      const o = linea.espejo.orden(e.clientX, e.clientY);
      if (!o) return;
      if (typeof o === 'string') avisoToque(o);
      else {
        canal.mandar({ t: 'orden', id: linea.id, o });
        sonido.toque();
      }
      return;
    }
    const yo = linea && canal ? juego.jugadores.find((p) => p.rol === canal!.yo) : undefined;
    const r = juego.tocar(e.clientX, e.clientY, yo);
    avisoToque(r);
    if (r && r !== 'ya' && r !== 'otro') sonido.toque();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && juego && !juego.terminado) $('btn-pausa').click();
  });
  // Si el celular cambia de app o se apaga la pantalla, el día se pausa y la música calla
  const alSalir = () => {
    if (juego && !juego.terminado && !pausado) $('btn-pausa').click();
    sonido.suspender();
  };
  document.addEventListener('visibilitychange', () => (document.hidden ? alSalir() : sonido.activar()));
  // Se cierra la página (o se vuelve a la casa) en medio de una partida en línea: el otro se entera de una
  window.addEventListener('pagehide', () => {
    if (linea && canal) canal.mandar(linea.fase === 'invitando' ? { t: 'cancelar', id: linea.id } : { t: 'salir', id: linea.id });
  });
  if (Capacitor.isNativePlatform()) {
    void App.addListener('appStateChange', ({ isActive }) => (isActive ? sonido.activar() : alSalir()));
    // Botón «atrás» de Android: pausa el día, vuelve al menú o sale de la app
    void App.addListener('backButton', () => {
      const visible = (id: string) => !$(id).hidden;
      if (juego && !juego.terminado && !pausado) $('btn-pausa').click();
      else if (visible('sala')) $('btn-sala-no').click();
      else if (visible('pausa')) $('btn-continuar').click();
      else if (visible('resultado')) $('btn-rmenu').click();
      else if (visible('tarjeta') || visible('mejoras') || visible('como')) abrirMenu();
      else location.href = './index.html';
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// En línea: Él en Bucaramanga y Ella en Medellín, cada uno en su celular. El que abre la tienda (anfitrión) invita,
// simula el día con sus vitrinas y mejoras y manda fotos; el otro (invitado) manda su joystick y sus toques.
// ---------------------------------------------------------------------------------------------------------------
const NOMBRE: Record<Rol, string> = { el: 'Él', ella: 'Ella' };
const otroRol = (r: Rol): Rol => (r === 'el' ? 'ella' : 'el');
/** «a» u «o» según quién sea (conectada/conectado). */
const ao = (r: Rol) => (r === 'ella' ? 'a' : 'o');
const r2 = (v: number) => Math.round(v * 100) / 100;
/** Sin noticias del otro celular por estos segundos: se pausa; por más de LINEA_ADIOS, se acaba la partida. */
const LINEA_PAUSA = 5;
const LINEA_ADIOS = 150;

interface Invitacion {
  id: string;
  nivel: number;
  legendario: boolean;
  de: Rol;
}
interface Linea {
  id: string;
  anfitrion: boolean;
  fase: 'invitando' | 'esperando' | 'cargando' | 'jugando' | 'fin';
  nivel: number;
  legendario: boolean;
  config: ConfigDia | null;
  /** El día ya montado en este celular (se vuelve `juego` al arrancar). */
  dia: Juego | null;
  espejo: Espejo | null;
  otroListo: boolean;
  ultimoDelOtro: number;
  nFoto: number;
  /** Eventos del día ya mandados en alguna foto. */
  enviados: number;
  relojFoto: number;
  mandoRemoto: { x: number; y: number };
  mandoEnviado: { x: number; y: number; t: number };
  pausaPorConexion: boolean;
  /** Quién pausó (para volver a la pausa correcta si la conexión regresa). */
  pausaPropia: boolean;
  pausaOtro: boolean;
  timers: number[];
}

let canal: CanalSuper | null = null;
let conectando: Promise<boolean> | null = null;
let linea: Linea | null = null;
/** Invitación que se le está mostrando a este celular. */
let invitacionVista: Invitacion | null = null;
/** Invitaciones que llegaron en medio de otro día (se avisan una sola vez). */
const avisadas = new Set<string>();
/** Enlace del aviso de la casa (super.html?unirse=...): esa invitación se acepta sola. */
const unirse = params.get('unirse');

function asegurarCanal(): Promise<boolean> {
  if (canal?.listo) return Promise.resolve(true);
  if (conectando) return conectando;
  if (canal) canal.cerrar();
  const c = new CanalSuper('el');
  canal = c;
  c.alMensaje = alMensaje;
  c.alCambiar = () => {
    if (!$('tarjeta').hidden) pintarNotaModo();
  };
  conectando = c.conectar().finally(() => (conectando = null));
  return conectando;
}

function pintarNotaModo() {
  const n = $('modo-nota');
  n.classList.remove('en-linea-si');
  if (modo === 'solo') n.textContent = 'Él solo, con el joystick de la izquierda.';
  else if (modo === 'pareja') n.textContent = 'Él con el joystick de la izquierda y Ella con el de la derecha. Vienen más clientes. ¡Cuidado con chocarse!';
  else if (!canal || conectando) n.textContent = 'Conectando con la casa en línea…';
  else if (!canal.listo) n.textContent = canal.error || 'No se pudo conectar. Revisa el internet e intenta otra vez.';
  else {
    const o = otroRol(canal.yo);
    if (canal.otroPresente) {
      n.textContent = `${NOMBRE[o]} está en Súper Manía ahora mismo. ¡Abre la tienda e ${o === 'ella' ? 'invítala' : 'invítalo'}!`;
      n.classList.add('en-linea-si');
    } else n.textContent = `Tú juegas desde tu celular y ${NOMBRE[o]} desde el suyo. Al abrir la tienda le llega el aviso en la casa. Se juega con tus vitrinas y mejoras.`;
  }
}

function sala(titulo: string, texto: string, o: { esperando?: boolean; no?: string; si?: string } = {}) {
  pantallaUnica('sala');
  $('sala-titulo').textContent = titulo;
  $('sala-texto').textContent = texto;
  $('sala').querySelector('.sala')!.classList.toggle('esperando', !!o.esperando);
  $('btn-sala-no').textContent = o.no ?? 'Volver';
  $('btn-sala-si').hidden = !o.si;
  $('btn-sala-si').textContent = o.si ?? '';
}

function nuevaLinea(id: string, anfitrion: boolean, nivel: number, leg: boolean): Linea {
  const l: Linea = {
    id, anfitrion, fase: anfitrion ? 'invitando' : 'esperando', nivel, legendario: leg, config: null, dia: null, espejo: null,
    otroListo: false, ultimoDelOtro: performance.now(), nFoto: 0, enviados: 0, relojFoto: 0, mandoRemoto: { x: 0, y: 0 },
    mandoEnviado: { x: 0, y: 0, t: 0 }, pausaPorConexion: false, pausaPropia: false, pausaOtro: false, timers: [],
  };
  // «Sigo aquí» cada segundo mientras no viajan fotos ni joystick (esperando, cargando o en pausa)
  l.timers.push(window.setInterval(() => {
    if (linea === l && l.fase !== 'invitando' && (l.fase !== 'jugando' || pausado)) canal?.mandar({ t: 'latido', id: l.id });
  }, 1000));
  return l;
}

function cerrarLinea() {
  const l = linea;
  if (!l) return;
  linea = null;
  for (const t of l.timers) {
    clearInterval(t);
    clearTimeout(t);
  }
  l.espejo?.cerrar();
  if (l.dia && l.dia !== juego) l.dia.destruir();
  $('cargando-nivel').hidden = true;
}

/** Deja la partida en línea y vuelve al menú con un aviso. */
async function salirDeLinea(aviso: string) {
  cerrarLinea();
  pausado = false;
  $('pausa-nota').hidden = true;
  juego?.destruir();
  juego = null;
  await montarFondo();
  abrirMenu();
  ui.aviso(aviso);
}

/** El anfitrión abre la tienda e invita al otro (por el canal y, si no está en el súper, por la casa). */
async function invitar() {
  if (linea) return;
  sala('Conectando…', 'Un momentico, buscando la casa en línea.', { esperando: true, no: 'Cancelar' });
  if (!(await asegurarCanal())) {
    if (!$('sala').hidden) sala('No se pudo conectar', canal?.error || 'Revisa el internet e intenta otra vez.', { no: 'Volver' });
    return;
  }
  if (linea || $('sala').hidden) return;
  const c = canal!;
  const o = otroRol(c.yo);
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const l = nuevaLinea(id, true, nivelElegido, legendario);
  linea = l;
  const inv: Mensaje = { t: 'inv', id, nivel: nivelElegido, legendario, de: c.yo };
  c.mandar(inv);
  // Se repite por si el otro abre el súper mientras tanto
  l.timers.push(window.setInterval(() => l.fase === 'invitando' && c.mandar(inv), 3000));
  l.timers.push(window.setTimeout(() => {
    if (linea !== l || l.fase !== 'invitando') return;
    c.mandar({ t: 'cancelar', id });
    cerrarLinea();
    sala('Nadie contestó', `${NOMBRE[o]} no aceptó a tiempo. Inténtalo otra vez cuando esté conectad${ao(o)}.`, { no: 'Volver' });
  }, 3 * 60_000));
  if (!c.otroPresente) void c.avisarPorCasa({ id, nivel: nivelElegido, legendario });
  const dia = `${legendario ? 'Legendario' : 'Nivel'} ${nivelElegido}`;
  sala(`Esperando a ${NOMBRE[o]}…`, c.otroPresente
    ? `Le llegó la invitación al ${dia}. Cuando acepte, empiezan.`
    : `Le llegó el aviso en la casa. Cuando lo toque (o abra Súper Manía), empiezan el ${dia}.`, { esperando: true, no: 'Cancelar' });
}

function llegaInvitacion(m: Invitacion) {
  const c = canal!;
  if (m.de === c.yo) return;
  if (linea) {
    // Ya aceptada (la respuesta se perdió): se repite
    if (!linea.anfitrion && linea.id === m.id && linea.fase === 'esperando') c.mandar({ t: 'resp', id: m.id, si: true });
    // Los dos invitaron a la vez: gana la invitación más vieja
    else if (linea.anfitrion && linea.fase === 'invitando' && m.id < linea.id) {
      c.mandar({ t: 'cancelar', id: linea.id });
      cerrarLinea();
      aceptar(m);
    }
    return;
  }
  if (juego && !juego.terminado) {
    if (!avisadas.has(m.id)) ui.aviso(`${NOMBRE[m.de]} te invita a jugar en línea: sal al menú para unirte`);
    avisadas.add(m.id);
    return;
  }
  if (unirse === m.id) return aceptar(m);
  if (invitacionVista?.id === m.id) return;
  invitacionVista = m;
  const nv = niveles[m.nivel - 1];
  const dia = `${m.legendario ? 'Legendario' : 'Nivel'} ${m.nivel}${nv?.evento ? ` (${nv.evento})` : nv ? ` (día ${nv.dia})` : ''}`;
  sala(`¡${NOMBRE[m.de]} te invita!`, `A atender la tienda juntos: ${dia}, con las vitrinas y mejoras de ${NOMBRE[m.de]}. Cada uno desde su celular.`, { si: '¡Vamos!', no: 'Ahora no' });
}

/** El invitado dice que sí y espera la configuración del día. */
function aceptar(inv: Invitacion) {
  const c = canal!;
  invitacionVista = null;
  if (juego) {
    juego.destruir();
    juego = null;
  }
  const l = nuevaLinea(inv.id, false, inv.nivel, inv.legendario);
  linea = l;
  c.mandar({ t: 'resp', id: inv.id, si: true });
  sala('¡Listo!', `Esperando a que ${NOMBRE[inv.de]} abra la tienda…`, { esperando: true, no: 'Cancelar' });
  l.timers.push(window.setTimeout(() => {
    if (linea !== l || l.fase !== 'esperando') return;
    cerrarLinea();
    sala('No se pudo empezar', `No llegó la tienda de ${NOMBRE[inv.de]}. Revisen el internet e inténtenlo otra vez.`, { no: 'Volver' });
  }, 30_000));
}

async function cancelarSala() {
  const l = linea;
  if (invitacionVista && canal) canal.mandar({ t: 'resp', id: invitacionVista.id, si: false });
  invitacionVista = null;
  if (l) {
    canal?.mandar(l.fase === 'invitando' ? { t: 'cancelar', id: l.id } : { t: 'salir', id: l.id });
    cerrarLinea();
  }
  if (juego) return;
  await montarFondo();
  if (l?.anfitrion) abrirTarjeta(nivelElegido);
  else abrirMenu();
}

/** Monta el día en este celular (el anfitrión, para simularlo; el invitado, como espejo). */
async function cargarDia(l: Linea): Promise<boolean> {
  const cfg = l.config!;
  nivelElegido = cfg.nivel;
  legendario = cfg.legendario;
  if (juego) juego.destruir();
  juego = null;
  turnoFondo++;
  if (fondo) {
    mundo.escena.remove(fondo.grupo);
    liberarPropios(fondo.grupo);
    fondo = null;
  }
  const nuevo = new Juego(mundo, nivelDeJuego(cfg.nivel, true), productos, tiendaDato, cfg.sitios, escalas, cfg.mejoras, cfg.legendario, true);
  await nuevo.preparar(!l.anfitrion);
  if (linea !== l) {
    nuevo.destruir();
    return false;
  }
  l.dia = nuevo;
  if (!l.anfitrion) l.espejo = new Espejo(nuevo, canal!.yo);
  return true;
}

async function empezarAnfitrion(l: Linea) {
  const c = canal!;
  l.fase = 'cargando';
  l.config = { nivel: l.nivel, legendario: l.legendario, sitios: { ...partida.sitios }, mejoras: { ...partida.mejoras } };
  const inicio: Mensaje = { t: 'inicio', id: l.id, config: l.config };
  c.mandar(inicio);
  l.timers.push(window.setInterval(() => linea === l && !l.otroListo && c.mandar(inicio), 3000));
  sala('¡Aceptó!', 'Acomodando la tienda en los dos celulares…', { esperando: true, no: 'Cancelar' });
  if (await cargarDia(l)) intentarArrancar();
}

async function empezarInvitado(l: Linea, config: ConfigDia) {
  l.fase = 'cargando';
  l.config = config;
  sala('¡A trabajar!', 'Acomodando la tienda…', { esperando: true, no: 'Cancelar' });
  if (await cargarDia(l)) canal?.mandar({ t: 'listo', id: l.id });
}

function intentarArrancar() {
  const l = linea;
  if (!l || !l.anfitrion || !l.dia || !l.otroListo || l.fase !== 'cargando') return;
  arrancarDia(l);
  enviarFoto(l);
}

function arrancarDia(l: Linea) {
  const c = canal!;
  const j = l.dia!;
  l.fase = 'jugando';
  l.ultimoDelOtro = performance.now();
  juego = j;
  pausado = false;
  pantallaUnica(null);
  sonido.activar();
  sonido.musica.iniciar('juego', j.legendario ? 112 : 100);
  ui.empezarNivel(j, partida.ayudas);
  mandos.mostrar(true, false);
  const yo = j.jugadores.find((p) => p.rol === c.yo) ?? j.jugador;
  const ordenar = (o: Orden) => c.mandar({ t: 'orden', id: l.id, o });
  ui.alTocarAlerta = (id) => {
    if (!l.anfitrion) return ordenar({ tipo: 'reponer', vitrina: id });
    const v = j.tienda.vitrinas.find((x) => x.dato.id === id);
    if (v && j.reponerSeccion(v, yo)) ui.aviso('Reposición en la fila');
  };
  ui.alUsarAyuda = (id) => {
    if ((partida.ayudas[id] ?? 0) <= 0) return;
    if (l.anfitrion) {
      if (!j.usarAyuda(id)) return;
    } else c.mandar({ t: 'ayuda', id: l.id, ayuda: id });
    partida.ayudas[id]--;
    guardado.guardar(partida);
    ui.pintarAyudas(partida.ayudas, j);
  };
  ui.alTomarCorazon = () => (l.anfitrion ? j.tomarCorazon() : c.mandar({ t: 'corazon', id: l.id }));
  if (l.anfitrion) {
    j.alTerminar = (r) => {
      enviarFoto(l);
      const fin: Mensaje = { t: 'fin', id: l.id, r };
      c.mandar(fin);
      window.setTimeout(() => c.mandar(fin), 800);
      l.fase = 'fin';
      cerrarLinea();
      terminarDia(j, l.nivel, r);
    };
  }
}

function enviarFoto(l: Linea) {
  const j = l.dia;
  if (!j || !canal) return;
  const f = tomarFoto(j, ++l.nFoto, l.enviados);
  l.enviados = j.eventos.length;
  canal.mandar({ t: 'foto', id: l.id, f });
}

/** El invitado manda su joystick cuando cambia (hasta ~10 veces por segundo) y al soltarlo. */
function mandarMando(l: Linea, m: { x: number; y: number }) {
  const ahora = performance.now();
  const e = l.mandoEnviado;
  const quieto = (v: { x: number; y: number }) => Math.hypot(v.x, v.y) < 0.2;
  const solto = quieto(m) !== quieto(e);
  if (!solto && !(Math.hypot(m.x - e.x, m.y - e.y) > 0.08 && ahora - e.t > 90) && ahora - e.t < 1000) return;
  const v = quieto(m) ? { x: 0, y: 0 } : { x: r2(m.x), y: r2(m.y) };
  l.mandoEnviado = { ...v, t: ahora };
  canal?.mandar({ t: 'mando', id: l.id, ...v });
}

const AVISOS_TOQUE: Record<string, string> = {
  llena: 'Esa vitrina está llena',
  cancelada: 'Acción cancelada',
  cajera: 'La cajera se encarga de la caja',
  aseo: 'El aseo ya va para allá',
  lavar: 'A lavar el trapero',
};
function avisoToque(r: string | null) {
  if (!r) return;
  if (r === 'otro' && canal) ui.aviso(`${NOMBRE[otroRol(canal.yo)]} ya va para allá`);
  else if (AVISOS_TOQUE[r]) ui.aviso(AVISOS_TOQUE[r]);
}

function pausar(nota = '') {
  pausado = true;
  mandos.mostrar(false);
  pantallaUnica('pausa');
  $('pausa-nota').hidden = !nota;
  $('pausa-nota').textContent = nota;
  // Sin conexión no se puede seguir (se sigue solo cuando el otro vuelve)
  ($('btn-continuar') as HTMLButtonElement).disabled = !!linea?.pausaPorConexion;
}
function seguir() {
  pausado = false;
  $('pausa-nota').hidden = true;
  ($('btn-continuar') as HTMLButtonElement).disabled = false;
  if (juego && !juego.terminado) mandos.mostrar(true, juego.pareja && !linea, juego.jugadores.map((p) => p.nombre));
  pantallaUnica(null);
}

/** Si el otro celular deja de hablar, se pausa (y vuelve solo cuando regresa); si no vuelve, se acaba. */
function vigilarLinea() {
  const l = linea!;
  if (l.fase !== 'jugando' && l.fase !== 'cargando') return;
  const sin = (performance.now() - l.ultimoDelOtro) / 1000;
  const o = NOMBRE[otroRol(canal?.yo ?? 'el')];
  if (l.fase === 'cargando') {
    if (sin > 40) void salirDeLinea(`No se pudo empezar: se perdió la conexión con ${o}.`);
    return;
  }
  if (sin > LINEA_PAUSA && !l.pausaPorConexion) {
    l.pausaPorConexion = true;
    pausar(`Se cortó la conexión con ${o}… esperando a que vuelva.`);
  } else if (sin < 1.5 && l.pausaPorConexion) {
    l.pausaPorConexion = false;
    if (l.pausaOtro) pausar(`${o} pausó el juego.`);
    else if (l.pausaPropia) pausar();
    else seguir();
  } else if (sin > LINEA_ADIOS) void salirDeLinea(`Se perdió la conexión con ${o}.`);
}

function alMensaje(m: Mensaje) {
  if (m.t === 'hola') return;
  if (m.t === 'inv') return llegaInvitacion(m);
  const l = linea;
  if (!l || m.id !== l.id) {
    // Cancelaron la invitación que se estaba mostrando
    if (m.t === 'cancelar' && invitacionVista?.id === m.id) {
      const de = invitacionVista.de;
      invitacionVista = null;
      if (!$('sala').hidden) sala('Invitación cancelada', `${NOMBRE[de]} ya no va a abrir la tienda.`, { no: 'Volver' });
    }
    return;
  }
  l.ultimoDelOtro = performance.now();
  const o = otroRol(canal!.yo);
  switch (m.t) {
    case 'resp':
      if (!l.anfitrion || l.fase !== 'invitando') return;
      if (m.si) void empezarAnfitrion(l);
      else {
        cerrarLinea();
        sala(`${NOMBRE[o]} no puede ahora`, 'Será en otro momento. Pueden jugar solos o en el mismo celular.', { no: 'Volver' });
      }
      return;
    case 'cancelar':
      if (l.anfitrion) return;
      cerrarLinea();
      if (!juego) sala('Invitación cancelada', `${NOMBRE[o]} ya no va a abrir la tienda.`, { no: 'Volver' });
      return;
    case 'inicio':
      if (l.anfitrion) return;
      if (l.fase === 'esperando') void empezarInvitado(l, m.config);
      else if (l.dia && l.fase === 'cargando') canal!.mandar({ t: 'listo', id: l.id });
      return;
    case 'listo':
      if (!l.anfitrion) return;
      l.otroListo = true;
      intentarArrancar();
      return;
    case 'foto':
      if (!l.espejo) return;
      l.espejo.aplicar(m.f);
      if (l.fase === 'cargando') arrancarDia(l);
      return;
    case 'mando':
      l.mandoRemoto = { x: m.x, y: m.y };
      return;
    case 'orden': {
      if (!l.anfitrion || !l.dia || l.fase !== 'jugando') return;
      const suyo = l.dia.jugadores.find((p) => p.rol === o);
      if (suyo) canal!.mandar({ t: 'res', id: l.id, r: aplicarOrden(l.dia, suyo, m.o) });
      return;
    }
    case 'res':
      avisoToque(m.r);
      return;
    case 'ayuda':
      if (l.anfitrion && l.fase === 'jugando') l.dia?.usarAyuda(m.ayuda);
      return;
    case 'corazon':
      if (l.anfitrion && l.fase === 'jugando') l.dia?.tomarCorazon();
      return;
    case 'pausa':
      if (l.fase !== 'jugando') return;
      l.pausaOtro = m.si;
      if (!m.si) l.pausaPropia = false;
      if (l.pausaPorConexion) return;
      if (m.si) pausar(`${NOMBRE[o]} pausó el juego.`);
      else if (pausado) seguir();
      return;
    case 'fin': {
      if (l.anfitrion || l.fase !== 'jugando' || !l.dia) return;
      const j = l.dia;
      l.fase = 'fin';
      j.terminado = true;
      cerrarLinea();
      pausado = false;
      $('pausa-nota').hidden = true;
      terminarDia(j, l.nivel, m.r, o);
      return;
    }
    case 'salir':
      if (l.fase === 'invitando' || l.fase === 'esperando') {
        cerrarLinea();
        sala(`${NOMBRE[o]} se salió`, 'La partida en línea se canceló.', { no: 'Volver' });
      } else void salirDeLinea(`${NOMBRE[o]} salió del juego`);
      return;
  }
}

/** Piloto automático para pruebas (?bot): juega como alguien atento (con toques). Atrapa, cobra cuando hay fila,
 *  llena varias vitrinas por viaje y limpia cuando le queda tiempo. En pareja, Él cuida la caja y Ella repone. */
function piloto(j: Juego) {
  j.jugadores.forEach((jug, i) => pilotoDe(j, jug, !j.pareja || i === 0));
}

function pilotoDe(j: Juego, jug: Jugador, cuidaCaja: boolean) {
  if (jug.atontado) return;
  // ?bot=caja: el que se queda en la caja todo el día sin reponer ni limpiar (no debería poder pasar los días)
  if (params.get('bot') === 'caja') {
    if (!jug.estaCobrando && !jug.tiene({ tipo: 'caja' }) && j.fila.length) jug.agregar({ tipo: 'caja' });
    return;
  }
  const guardia = j.ayudantes.some((a) => a.tipo === 'guardia');
  if (!guardia) for (const o of j.perseguibles()) if (o.visible && !o.reservado) jug.agregar({ tipo: 'atrapar', objetivo: o });
  const repone = j.ayudantes.filter((a) => a.vitrina).map((a) => a.vitrina);
  const bajas = j.tienda.enVenta
    .filter((v) => v.fraccion <= 0.5 && !v.tumbada && !j.vaAReponer(v) && !repone.includes(v))
    .sort((a, c) => a.fraccion - c.fraccion);
  const vacias = bajas.filter((v) => v.stock === 0);
  const reponiendo = jug.fila.some((t) => t.tipo === 'reponer');
  // Canastas: si quedan pocas en la entrada, recogerlas es urgente
  if (j.canastas <= 2) for (const c of j.canastasSueltas.filter((x) => !x.reservado).slice(0, 2)) jug.agregar({ tipo: 'canasta', canasta: c });
  // Un charco o basura a la vez, sin esperar a estar libre del todo
  const limpiando = jug.fila.some((t) => t.tipo === 'mugre');
  const sucia = j.mugres.find((x) => !x.reservado && (x.tipo === 'charco' || x.tipo === 'sucio' || x.tiempo > 12));
  if (!limpiando && sucia && jug.fila.length <= 2) jug.agregar({ tipo: 'mugre', mugre: sucia });
  const alguienEspera = j.clientes.some((c) => c.estado === 'esperando');
  const otroCobra = j.jugadores.some((p) => p !== jug && (p.estaCobrando || p.tiene({ tipo: 'caja' })));
  if (cuidaCaja && !j.cajera && !otroCobra && j.fila.length && !jug.estaCobrando && !jug.tiene({ tipo: 'caja' })) {
    const urgente = j.fila.length >= 2 || j.fila[0].paciencia < 0.45 || !reponiendo;
    if (urgente) jug.agregar({ tipo: 'caja' });
  }
  // Mientras cobra, solo sale a reponer si alguien está esperando un producto que se acabó
  const puedeReponer = !jug.estaCobrando || alguienEspera || !j.fila.length;
  if (!reponiendo && puedeReponer && (bajas.length >= 2 || vacias.length || (bajas.length && !jug.fila.length))) {
    // Las que alcancen con un carrito lleno (cada reposición deja lleno un estante)
    for (const v of bajas.slice(0, jug.capacidadCarrito)) jug.agregar({ tipo: 'reponer', vitrina: v });
    return;
  }
  if (jug.fila.length) return;
  if (jug.traperoLleno) {
    jug.agregar({ tipo: 'lavar' });
    return;
  }
  const m = j.mugres.filter((x) => !x.reservado).sort((a, c) => (a.tipo === 'charco' ? -1 : 0) - (c.tipo === 'charco' ? -1 : 0))[0];
  if (m && jug.agregar({ tipo: 'mugre', mugre: m })) return;
  const c = j.canastasSueltas.find((x) => !x.reservado);
  if (c) jug.agregar({ tipo: 'canasta', canasta: c });
}

if (BOT || params.has('prueba')) {
  (window as any).__mundo = () => mundo;
  (window as any).__juego = () => juego;
}
(window as any).__estado = () => ({
  juego: juego ? { tiempo: juego.tiempo, stats: juego.stats, clientes: juego.clientes.length, fila: juego.fila.length, terminado: juego.terminado, pareja: juego.pareja } : null,
  jugadores: juego ? juego.jugadores.map((p) => ({
    rol: p.nombre, pos: p.pos, carga: `${p.carga}/${p.capacidadCarrito}`, trapero: `${p.trapero}/${p.capacidadTrapero}`, bolsa: p.bolsa,
    canastas: p.canastasEnMano, mareo: p.atontado, tareas: p.fila.map((t) => t.tipo), cobrando: p.estaCobrando,
  })) : null,
  el: juego ? {
    tareas: juego.jugador.fila.map((t) => t.tipo), cobrando: juego.jugador.estaCobrando, moviendo: juego.jugador.moviendo,
    pos: juego.jugador.pos, cajas: juego.jugador.carga,
    vitrinas: juego.tienda.enVenta.map((v) => `${v.seccion}:${v.stock}/${v.capacidad}`).join(' '),
    clientes: juego.clientes.map((c) => `${c.tipo[0]}${c.estado}:${c.paciencia.toFixed(2)}`).join(' '),
    mugres: juego.mugres.length, canastas: juego.canastas,
  } : null,
  resultado: (window as any).__resultado ?? null,
});

iniciar().catch((e) => {
  console.error(e);
  $('carga-texto').textContent = 'No se pudo cargar el juego. Recarga la página.';
});

mostrar('toast', false);
