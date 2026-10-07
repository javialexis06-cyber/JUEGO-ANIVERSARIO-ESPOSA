// Súper Manía en Pareja · jugable 1 (la tiendita completa: 25 días, solo con Él, los dos en el mismo celular, en
// línea cada uno en su celular o en una sala con código de 2 a 4 con amigos). Con amigos (o en el aparato de un
// amigo) todo va en modo neutro: nada personal de la pareja (neutro.ts).
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
import { TutorialSuper, tutorialVisto } from './tutorial_super';
import type { InfoJugador, Jugador, Rol } from './jugador';
import { CanalSuper, type ConfigDia, type Mensaje } from './linea_super';
import { Mandos } from './mando';
import { Mundo } from './mundo';
import { cargar, cargarAnimado, cargarJSON, elegirModelos, icono, Productos } from './recursos';
import * as sonido from './sonido';
import * as segundoPlano from './segundo_plano';
import { liberarPropios, NOMBRE_SECCION, Tienda, TiendaDato } from './tienda';
import { mostrar, pantallaUnica, UI } from './ui';
import { alNeutro, amigoDeAqui, escHtml, esNeutro, modoAmigo, paginaDeSalida, ponerNeutro } from './neutro';
import { NOMBRE_PAREJA } from './nombres';
import type { AspectoJugador, JugadorSala, Sala } from './salas/tipos';

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
/** El tutorial guiado (la primera vez en el día 1, o cuando se pide desde «Cómo se juega»). */
let tutorial: TutorialSuper | null = null;
let pedirTutorial = false;
let nivelElegido = 1;
let legendario = false;
let mandos: Mandos;
/** Solo (Él), los dos en el mismo celular (dos joysticks), en línea (cada uno en su celular, por la casa) o en una
 *  sala con código (de 2 a 4: Javier, Laura y amigos). Un amigo no tiene casa: no juega «en línea». */
type Modo = 'solo' | 'pareja' | 'linea' | 'sala';
let modo: Modo = (() => {
  try {
    const m = localStorage.getItem(CLAVE_MODO);
    if (m === 'linea' && modoAmigo()) return 'solo';
    return m === 'pareja' || m === 'linea' || m === 'sala' ? m : 'solo';
  } catch {
    return 'solo';
  }
})();

// ---------------------------------------------------------------------------------------------------------------
// Modo neutro: un amigo juega aquí, o hay amigos en la sala. Se esconden los textos de la pareja (los que tienen
// `data-neutro` en super.html traen su versión neutra) y el corazón escondido pasa a ser un trébol.
// ---------------------------------------------------------------------------------------------------------------
function pintarNeutro() {
  const n = esNeutro();
  document.body.classList.toggle('neutro', n);
  document.body.classList.toggle('modo-amigo', modoAmigo());
  document.title = n ? 'Súper Manía' : 'Súper Manía en Pareja';
  for (const el of document.querySelectorAll<HTMLElement>('[data-neutro]')) {
    el.dataset.normal ??= el.innerHTML;
    el.innerHTML = n ? el.dataset.neutro! : el.dataset.normal;
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-neutro-title]')) {
    el.dataset.normalTitulo ??= el.title;
    el.title = n ? el.dataset.neutroTitle! : el.dataset.normalTitulo;
  }
  const casa = document.getElementById('btn-casa') as HTMLAnchorElement | null;
  if (casa) {
    casa.href = paginaDeSalida();
    casa.textContent = modoAmigo() ? 'Volver a la sala de juegos' : 'Volver a la casa';
  }
  const linea = document.getElementById('btn-modo-linea');
  if (linea) linea.hidden = modoAmigo();
  document.querySelector('.modo-juego')?.classList.toggle('cuatro', !modoAmigo());
}
alNeutro(pintarNeutro);

/** Colores del «Jugador 2» de un amigo en el mismo celular (nada de los muñecos de fábrica de la pareja). */
const INVITADO: Record<Rol, AspectoJugador> = {
  el: { cuerpo: 'el', piel: '#c27f52', pelo: '#3b2418', detalles: { ropa: '#f2c94c', ropa2: '#4a4a52', zapatos: '#f4efe6' } },
  ella: { cuerpo: 'ella', piel: '#f6c8a4', pelo: '#9a6233', detalles: { ropa: '#3fb5a3', ropa2: '#1d1d24', zapatos: '#e85d5d' } },
};

/** En el aparato de un amigo, quién juega (solo o con un «Jugador 2» en el mismo celular): su nombre y su muñeco. */
function equipoLocal(enPareja: boolean): InfoJugador[] | null {
  const a = amigoDeAqui();
  if (!a) return null;
  const yo: InfoJugador = { id: 'el', cuerpo: a.aspecto.cuerpo, nombre: a.nombre, aspecto: a.aspecto, color: '#3f8fd6' };
  if (!enPareja) return [yo];
  const otro: Rol = a.aspecto.cuerpo === 'el' ? 'ella' : 'el';
  return [yo, { id: 'ella', cuerpo: otro, nombre: 'Jugador 2', aspecto: INVITADO[otro], color: '#e8577a' }];
}

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
  pintarNeutro();
  abrirMenu();
  // Entrar directo a la sala de alguien (desde «Unirme con un código» de la sala de juegos de amigos)
  const codigoSala = params.get('sala');
  if (codigoSala) void unirseConCodigo(codigoSala);
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
  // En segundo plano el bucle se detiene del todo (ni simula ni dibuja) y al volver sigue sin salto de tiempo
  let quieto = false;
  segundoPlano.alReanudar(() => {
    if (!quieto) return;
    quieto = false;
    antes = performance.now();
    acumulado = 0;
    requestAnimationFrame(bucle);
  });
  const bucle = (ahora: number) => {
    if (segundoPlano.enPausa()) {
      quieto = true;
      return;
    }
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
    // (si la partida del tutorial se acabó o se salió, el globo se va)
    if (tutorial && (juego !== tutorial.j || juego.terminado)) {
      tutorial.quitar();
      tutorial = null;
    }
    tutorial?.ocultar(pausado);
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
      const l = linea;
      if (l) {
        // En línea: el joystick de este celular mueve al personaje propio y el de los demás llega por el canal (o la sala)
        for (const p of juego.jugadores) p.mando = p.id === l.yo ? mandos.leer(0) : l.remotos.find((r) => r.id === p.id)?.mando ?? { x: 0, y: 0 };
      } else if (!BOT) juego.jugadores.forEach((p, i) => (p.mando = mandos.leer(i)));
      for (let k = 0; k < pasos && !juego.terminado; k++) {
        if (BOT) piloto(juego);
        juego.update(BOT ? 0.1 : dt);
      }
      tutorial?.paso(dt);
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
  $('btn-modo-sala').setAttribute('aria-pressed', String(modo === 'sala'));
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
    ul.innerHTML = nv.estrellas.map((e, i) => `<li class="${previas[i] ? 'hecha' : ''}"><span class="sello-mini"></span>${textoNeutro(textoDe(e.texto))}${i === 0 ? ' <em>(obligatoria)</em>' : ''}</li>`).join('');
  }
  const bl = $('btn-legendario');
  bl.hidden = !tres || !nv.legendario;
  bl.textContent = legendario ? 'Volver al modo normal' : 'Modo legendario';
  bl.setAttribute('aria-pressed', String(legendario));
}

/** Cuántos juegan con el modo de la tarjeta (en una sala lo dice la sala). */
const jugadoresDelModo = () => (modo === 'solo' ? 1 : 2);

/** Con amigos los textos dicen «en equipo» (no «en pareja»). */
const textoNeutro = (t: string) => (esNeutro() ? t.replace(/en pareja/gi, 'en equipo') : t).replace(/^1 combos/, '1 combo');

/**
 * Copia del nivel con las reglas del modo legendario y, con más de uno, con los clientes y las metas de todos
 * (puestas donde el juego lee las de uno solo). De a dos se usa la columna «pareja» de niveles.json; de a tres o
 * cuatro, un 15 % más de clientes por cada uno (la caja es una sola: más gente la ahogaría) y las metas en
 * proporción (los combos en equipo salen mucho más seguido entre cuatro).
 */
function nivelDeJuego(n: number, jugadores = jugadoresDelModo()): NivelDato {
  const base = niveles[n - 1];
  let nv: NivelDato = base;
  if (legendario && base.legendario) nv = { ...base, clientes: base.legendario.clientes, paciencia: base.legendario.paciencia };
  if (jugadores <= 1) return { ...nv, estrellas: nv.estrellas.map((e) => ({ ...e, texto: textoNeutro(textoDe(e.texto)) })) };
  const k = 1 + 0.15 * Math.max(0, Math.min(4, jugadores) - 2);
  const clientes = Math.round(nv.clientes.pareja * k);
  const x = clientes / Math.max(1, nv.clientes.solitario);
  const par = <T,>(v: T | { solitario: T; pareja: T }): T => (typeof v === 'object' && v !== null && 'pareja' in (v as object) ? (v as { pareja: T }).pareja : v as T);
  const escalar = (e: NivelDato['estrellas'][number]) => {
    const m = par(e.meta);
    const t = par(e.texto);
    if (k === 1) return { ...e, texto: textoNeutro(t), meta: m };
    const f = e.clave === 'equipo' ? 1 + 0.5 * (jugadores - 2) : ['ventas', 'propinas', 'perdidos'].includes(e.clave) ? k : 1;
    const nueva = f === 1 || m === 0 ? m : Math.round(m * f);
    return { ...e, meta: nueva, texto: textoNeutro((nueva === m ? t : t.replace(/\d+/, String(nueva))).replace(/en pareja/gi, 'en equipo')) };
  };
  const l = nv.legendario;
  return {
    ...nv,
    clientes: { solitario: clientes, pareja: clientes },
    estrellas: nv.estrellas.map(escalar),
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
  const nuevo = new Juego(mundo, nivelDeJuego(n, enPareja ? 2 : 1), productos, tiendaDato, partida.sitios, escalas, partida.mejoras, legendario, enPareja, equipoLocal(enPareja));
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
  // La primera vez (día 1, en este celular) se aprende jugando con el reloj quieto
  tutorial?.quitar();
  tutorial = null;
  if (!BOT && !params.has('sintutorial') && (modo === 'solo' || modo === 'pareja') && n === 1 && (pedirTutorial || !tutorialVisto())) {
    tutorial = new TutorialSuper(juego, mundo, () => {
      tutorial = null;
      sonido.campana();
      ui.aviso('¡Abrió la tienda! Ahora sí corre el reloj 🛒');
    });
  }
  pedirTutorial = false;
}

/**
 * Fin del día: estrellas, monedas y el sueldo para la casa. La casa es una sola: en línea lo pone solo el que invitó
 * (`sueldoDe` es el nombre del otro cuando le toca a él); en una sala, el primero de la pareja que esté en ella. A
 * un amigo no se le paga nada a ninguna casa (`sueldoDe` = '' esconde la línea).
 */
function terminarDia(j: Juego, n: number, r: Resultado, sueldoDe: string | null = null) {
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
  const sueldo = r.ganancia > 0 && !modoAmigo() && sueldoDe !== '' ? Math.max(1, Math.round(r.ganancia * SUELDO_FRACCION)) : 0;
  if (!sueldoDe && sueldo) {
    try {
      localStorage.setItem(CLAVE_SUELDO, String((Number(localStorage.getItem(CLAVE_SUELDO)) || 0) + sueldo));
    } catch {
      /* sin almacenamiento */
    }
  }
  $('rec-sueldo').hidden = sueldo <= 0;
  $('rec-sueldo').textContent = sueldoDe
    ? `Sueldo para la casa: +${sueldo} monedas (llegan por el celular de ${sueldoDe})`
    : `Sueldo para la casa: +${sueldo} monedas`;
  ui.terminarNivel();
  mandos.mostrar(false);
  ui.resultado(j, r, antes);
  // En una sala: todos vuelven a la sala de espera (el anfitrión escoge el día que sigue)
  const enSala = !!salaActual;
  for (const id of ['btn-siguiente', 'btn-repetir', 'btn-rmejoras', 'btn-rmenu']) $(id).classList.toggle('oculto-sala', enSala);
  $('btn-rsala').hidden = !enSala;
  $('btn-rsalir').hidden = !enSala;
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
    titulo(g === 'Él' ? (esNeutro() ? 'Para ustedes' : 'Para Javier y Laura') : g);
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
  $('btn-abrir').addEventListener('click', () => void (modo === 'linea' ? invitar() : modo === 'sala' ? abrirSala() : jugar(nivelElegido)));
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
  $('btn-modo-sala').addEventListener('click', () => elegirModo('sala'));
  $('btn-unirme').addEventListener('click', () => void unirseConCodigo());
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
  $('btn-tutorial').addEventListener('click', () => {
    pedirTutorial = true;
    if (modo !== 'solo' && modo !== 'pareja') modo = 'solo';
    nivelElegido = 1;
    void jugar(1);
  });
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
    // En línea (y en la sala) se pausan todos los celulares
    const l = linea;
    if (l?.fase === 'jugando') {
      l.pausaPropia = true;
      enviar(l, { t: 'pausa', id: l.id, si: true });
    }
  });
  $('btn-continuar').addEventListener('click', () => {
    const l = linea;
    if (l?.pausaPorConexion) return;
    seguir();
    if (l?.fase === 'jugando') {
      l.pausaPropia = false;
      for (const r of l.remotos) r.pausa = false;
      enviar(l, { t: 'pausa', id: l.id, si: false });
    }
  });
  $('btn-salir').addEventListener('click', async () => {
    const l = linea;
    if (l) {
      enviar(l, { t: 'salir', id: l.id });
      // (en una sala, salir del día es salir de la sala: si era el anfitrión, la sala se acaba para todos)
      if (l.sala) return void salirDeLinea('');
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
  // En una sala, después del tiquete todos vuelven a la sala de espera (o se salen)
  $('btn-rsala').addEventListener('click', () => terminarDiaSala('sala'));
  $('btn-rsalir').addEventListener('click', () => terminarDiaSala('salir'));
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
  $('codigo-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const c = normalizar($<HTMLInputElement>('codigo-input').value);
    if (c.length !== 5) {
      $('codigo-error').textContent = 'El código tiene 5 letras y números.';
      return;
    }
    // (sin esto el teclado se queda escribiendo en la cajita y WASD no mueve al muñeco en el computador)
    $<HTMLInputElement>('codigo-input').blur();
    pedirCodigoListo?.(c);
  });
  $<HTMLInputElement>('codigo-input').addEventListener('input', () => {
    const i = $<HTMLInputElement>('codigo-input');
    i.value = normalizar(i.value);
    $('codigo-error').textContent = '';
  });
  $('btn-codigo-no').addEventListener('click', () => pedirCodigoListo?.(null));
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
    const l = linea;
    if (l?.espejo) {
      const o = l.espejo.orden(e.clientX, e.clientY);
      if (!o) return;
      if (typeof o === 'string') avisoToque(o);
      else {
        enviarAlAnfitrion(l, { t: 'orden', id: l.id, o });
        sonido.toque();
      }
      return;
    }
    const yo = l ? juego.jugadores.find((p) => p.id === l.yo) : undefined;
    const r = juego.tocar(e.clientX, e.clientY, yo);
    avisoToque(r);
    if (r && r !== 'ya' && r !== 'otro') sonido.toque();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && juego && !juego.terminado) $('btn-pausa').click();
  });
  // Si el celular cambia de app o se apaga la pantalla, el día se pausa y la música calla (segundo_plano.ts); en
  // línea al otro le sale «se cortó la conexión» hasta que vuelva (en una sala eso lo avisa la sala sola)
  segundoPlano.alPausar(() => {
    if (juego && !juego.terminado && !pausado) $('btn-pausa').click();
    const l = linea;
    if (l && !l.sala && l.fase !== 'invitando') enviar(l, { t: 'fuera', id: l.id, si: true });
  });
  segundoPlano.alReanudar((ms) => {
    sonido.activar();
    const l = linea;
    if (!l || l.fase === 'invitando') return;
    // Mientras estaba afuera este celular no oía a los demás: se les da un rato antes de dar la conexión por perdida
    for (const r of l.remotos) r.ultimo = performance.now();
    if (ms / 1000 > LINEA_ADIOS && (l.fase === 'jugando' || l.fase === 'cargando')) {
      enviar(l, { t: 'salir', id: l.id });
      void salirDeLinea('Estuviste mucho rato por fuera: la partida en línea se terminó.');
      return;
    }
    if (l.sala) return;
    enviar(l, { t: 'fuera', id: l.id, si: false });
    enviar(l, { t: 'latido', id: l.id });
  });
  // Se cierra la página (o se vuelve a la casa) en medio de una partida en línea: el otro se entera de una (en una
  // sala, la sala manda su propio «adiós»)
  window.addEventListener('pagehide', () => {
    const l = linea;
    if (l && !l.sala) enviar(l, l.fase === 'invitando' ? { t: 'cancelar', id: l.id } : { t: 'salir', id: l.id });
  });
  // Botón «atrás» de Android (en el computador, la tecla Esc): pausa el día, vuelve al menú o sale (a la casa, o a la
  // sala de juegos de amigos)
  const atras = () => {
    const visible = (id: string) => !$(id).hidden;
    const espera = document.querySelector<HTMLElement>('.sala-espera.visible [data-a="salir"]');
    const dia = document.querySelector<HTMLElement>('.dia-sala [data-cerrar]');
    if (dia) dia.click();
    else if (espera) espera.click();
    else if (juego && !juego.terminado && !pausado) $('btn-pausa').click();
    else if (visible('codigo')) $('btn-codigo-no').click();
    else if (visible('sala')) $('btn-sala-no').click();
    else if (visible('pausa')) $('btn-continuar').click();
    else if (visible('resultado')) $(salaActual ? 'btn-rsala' : 'btn-rmenu').click();
    else if (visible('tarjeta') || visible('mejoras') || visible('como')) abrirMenu();
    else location.href = paginaDeSalida();
  };
  if (Capacitor.isNativePlatform()) void App.addListener('backButton', atras);
  else document.addEventListener('keydown', (e) => e.key === 'Escape' && !e.repeat && atras());
}

/** Lo que alguien escribió → un código de sala (mayúsculas, sin I, L, O, 0 ni 1; como `normalizarCodigo` de las salas). */
const normalizar = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').split('').filter((c) => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'.includes(c)).join('').slice(0, 5);

// ---------------------------------------------------------------------------------------------------------------
// En línea, cada uno en su celular. Dos maneras:
// - Él y Ella por el canal de la pareja (linea_super.ts): el que abre la tienda invita y al otro le llega el aviso en
//   la casa.
// - Una sala con código (src/salas/): de 2 a 4, Javier, Laura y amigos; uno abre la sala y los demás entran con el
//   código de 5 letras. Con amigos adentro todo va en modo neutro.
// En las dos, el anfitrión simula el día con sus vitrinas y mejoras y manda fotos; los demás mandan su joystick y sus
// toques. Los mensajes del día son los mismos (`Mensaje` de linea_super.ts).
// ---------------------------------------------------------------------------------------------------------------
const NOMBRE: Record<Rol, string> = { ...NOMBRE_PAREJA };
const otroRol = (r: Rol): Rol => (r === 'el' ? 'ella' : 'el');
/** «a» u «o» según quién sea (conectada/conectado). */
const ao = (r: Rol) => (r === 'ella' ? 'a' : 'o');
const r2 = (v: number) => Math.round(v * 100) / 100;
/** Sin noticias del otro celular por estos segundos: se pausa; por más de LINEA_ADIOS, se acaba la partida. */
const LINEA_PAUSA = 5;
const LINEA_ADIOS = 150;
/** Mensajes del súper dentro de una sala (todos van con este tipo; adentro va el `Mensaje` de siempre). */
const MSJ_SALA = 'super';

interface Invitacion {
  id: string;
  nivel: number;
  legendario: boolean;
  de: Rol;
}
/** Otro jugador del día (en pareja hay uno solo; en una sala, hasta tres). */
interface Remoto {
  /** Su id del día («el»/«ella» entre la pareja; «j1»… en una sala). */
  id: string;
  nombre: string;
  /** Su id en la sala (para mandarle algo solo a él). */
  salaId?: string;
  anfitrion: boolean;
  mando: { x: number; y: number };
  listo: boolean;
  /** Última vez que se supo de él (pareja: cualquier mensaje). */
  ultimo: number;
  /** Se fue a segundo plano (pareja: lo avisa él; en la sala lo dice la sala). */
  fuera: boolean;
  /** Pausó el juego. */
  pausa: boolean;
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
  /** Mi id del día. */
  yo: string;
  remotos: Remoto[];
  /** La sala por la que viaja todo (null: el canal de la pareja). */
  sala: Sala | null;
  /** Desde cuándo está cargando (para no esperar para siempre a alguien que no carga). */
  desde: number;
  nFoto: number;
  /** Eventos del día ya mandados en alguna foto. */
  enviados: number;
  relojFoto: number;
  mandoEnviado: { x: number; y: number; t: number };
  pausaPorConexion: boolean;
  /** Este celular pausó (para volver a la pausa correcta si la conexión regresa). */
  pausaPropia: boolean;
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

/** Manda un mensaje del día a todos (o a uno). Las fotos y el joystick van «rápidos» (sin reenvío). */
function enviar(l: Linea, m: Mensaje, a?: Remoto) {
  if (!l.sala) {
    canal?.mandar(m);
    return;
  }
  const rapido = m.t === 'foto' || m.t === 'mando';
  l.sala.mandar(MSJ_SALA, m, { rapido, ...(a?.salaId ? { a: a.salaId } : {}) });
}
/** Lo que solo le importa al anfitrión (joystick, toques, ayudas). */
function enviarAlAnfitrion(l: Linea, m: Mensaje) {
  enviar(l, m, l.remotos.find((r) => r.anfitrion));
}

function asegurarCanal(): Promise<boolean> {
  if (canal?.listo) return Promise.resolve(true);
  if (conectando) return conectando;
  if (canal) canal.cerrar();
  const c = new CanalSuper('el');
  canal = c;
  c.alMensaje = (m) => alMensaje(m);
  c.alCambiar = () => {
    if (!$('tarjeta').hidden) pintarNotaModo();
  };
  conectando = c.conectar().finally(() => (conectando = null));
  return conectando;
}

function pintarNotaModo() {
  const n = $('modo-nota');
  n.classList.remove('en-linea-si');
  const amigo = amigoDeAqui();
  if (modo === 'solo') n.textContent = amigo ? 'Tú solo, con el joystick de la izquierda.' : 'Javier solo, con el joystick de la izquierda.';
  else if (modo === 'pareja') {
    n.textContent = amigo
      ? 'Tú con el joystick de la izquierda y el Jugador 2 con el de la derecha. Vienen más clientes. ¡Cuidado con chocarse!'
      : 'Javier con el joystick de la izquierda y Laura con el de la derecha. Vienen más clientes. ¡Cuidado con chocarse!';
  } else if (modo === 'sala') {
    n.textContent = 'Abres una sala y les pasas el código: de 2 a 4, cada uno en su celular, con tus vitrinas y mejoras. Los demás entran con «Unirme con código».';
  } else if (!canal || conectando) n.textContent = 'Conectando con la casa en línea…';
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

function nuevaLinea(id: string, anfitrion: boolean, nivel: number, leg: boolean, yo: string, remotos: Remoto[], s: Sala | null = null): Linea {
  const l: Linea = {
    id, anfitrion, fase: s ? 'cargando' : anfitrion ? 'invitando' : 'esperando', nivel, legendario: leg, config: null, dia: null, espejo: null,
    yo, remotos, sala: s, desde: performance.now(), nFoto: 0, enviados: 0, relojFoto: 0, mandoEnviado: { x: 0, y: 0, t: 0 },
    pausaPorConexion: false, pausaPropia: false, timers: [],
  };
  // «Sigo aquí» cada segundo mientras no viajan fotos ni joystick (esperando, cargando o en pausa); en segundo plano
  // no se manda: así el otro ve que se cortó (en una sala el latido lo lleva la sala)
  if (!s) {
    l.timers.push(window.setInterval(() => {
      if (linea === l && !segundoPlano.enPausa() && l.fase !== 'invitando' && (l.fase !== 'jugando' || pausado)) enviar(l, { t: 'latido', id: l.id });
    }, 1000));
  }
  return l;
}

/** El otro de la pareja, como «remoto» del día. */
function remotoPareja(yo: Rol, anfitrion: boolean): Remoto {
  const o = otroRol(yo);
  return { id: o, nombre: NOMBRE[o], anfitrion, mando: { x: 0, y: 0 }, listo: false, ultimo: performance.now(), fuera: false, pausa: false };
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

/** Deja la partida en línea y vuelve al menú con un aviso (en una sala, también deja la sala). */
async function salirDeLinea(aviso: string) {
  const enSala = !!linea?.sala || !!salaActual;
  cerrarLinea();
  pausado = false;
  $('pausa-nota').hidden = true;
  juego?.destruir();
  juego = null;
  if (enSala && finDiaSala) {
    avisoAlSalir = aviso;
    terminarDiaSala('salir');
    return;
  }
  await montarFondo();
  abrirMenu();
  if (aviso) ui.aviso(aviso);
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
  const l = nuevaLinea(id, true, nivelElegido, legendario, c.yo, [remotoPareja(c.yo, false)]);
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
  if (m.de === c.yo || salaActual) return;
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
  const l = nuevaLinea(inv.id, false, inv.nivel, inv.legendario, c.yo, [remotoPareja(c.yo, true)]);
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
  // Abriendo o buscando una sala con código: se cancela (lo que estaba en camino se suelta al llegar)
  if (turnoAbrir.abriendo) {
    turnoAbrir.abriendo = false;
    turnoAbrir.n++;
    await montarFondo();
    if (modo === 'sala' && !turnoAbrir.uniendo) abrirTarjeta(nivelElegido);
    else abrirMenu();
    return;
  }
  // Cargando el día de la sala: se sale de la sala
  if (salaActual) {
    const l = linea;
    if (l) enviar(l, { t: 'salir', id: l.id });
    await salirDeLinea('');
    return;
  }
  const l = linea;
  if (invitacionVista && canal) canal.mandar({ t: 'resp', id: invitacionVista.id, si: false });
  invitacionVista = null;
  if (l) {
    enviar(l, l.fase === 'invitando' ? { t: 'cancelar', id: l.id } : { t: 'salir', id: l.id });
    cerrarLinea();
  }
  if (juego) return;
  await montarFondo();
  if (l?.anfitrion) abrirTarjeta(nivelElegido);
  else abrirMenu();
}

/** Monta el día en este celular (el anfitrión, para simularlo; los demás, como espejo). */
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
  const equipo = cfg.equipo?.length ? cfg.equipo : null;
  const nuevo = new Juego(mundo, nivelDeJuego(cfg.nivel, equipo?.length ?? 2), productos, tiendaDato, cfg.sitios, escalas, cfg.mejoras, cfg.legendario, true, equipo);
  await nuevo.preparar(!l.anfitrion);
  if (linea !== l) {
    nuevo.destruir();
    return false;
  }
  l.dia = nuevo;
  if (!l.anfitrion) l.espejo = new Espejo(nuevo, l.yo);
  return true;
}

async function empezarAnfitrion(l: Linea) {
  l.fase = 'cargando';
  l.desde = performance.now();
  l.config = { nivel: l.nivel, legendario: l.legendario, sitios: { ...partida.sitios }, mejoras: { ...partida.mejoras } };
  const inicio: Mensaje = { t: 'inicio', id: l.id, config: l.config };
  enviar(l, inicio);
  l.timers.push(window.setInterval(() => linea === l && !l.remotos.every((r) => r.listo) && enviar(l, inicio), 3000));
  sala('¡Aceptó!', 'Acomodando la tienda en los dos celulares…', { esperando: true, no: 'Cancelar' });
  if (await cargarDia(l)) intentarArrancar();
}

async function empezarInvitado(l: Linea, config: ConfigDia) {
  l.fase = 'cargando';
  l.desde = performance.now();
  l.config = config;
  sala('¡A trabajar!', 'Acomodando la tienda…', { esperando: true, no: 'Cancelar' });
  if (await cargarDia(l)) enviar(l, { t: 'listo', id: l.id });
}

/** El anfitrión arranca cuando todos los demás tienen la tienda lista (en la sala, los que sigan en ella). */
function intentarArrancar(aunque = false) {
  const l = linea;
  if (!l || !l.anfitrion || !l.dia || l.fase !== 'cargando') return;
  const presentes = l.sala ? new Set(l.sala.jugadores.map((j) => j.id)) : null;
  const faltan = l.remotos.filter((r) => !r.listo && (!presentes || presentes.has(r.salaId ?? '')));
  if (faltan.length && !aunque) return;
  arrancarDia(l);
  enviarFoto(l);
}

function arrancarDia(l: Linea) {
  const j = l.dia!;
  l.fase = 'jugando';
  for (const r of l.remotos) r.ultimo = performance.now();
  juego = j;
  pausado = false;
  pantallaUnica(null);
  sonido.activar();
  sonido.musica.iniciar('juego', j.legendario ? 112 : 100);
  const yo = j.jugadores.find((p) => p.id === l.yo) ?? j.jugador;
  ui.empezarNivel(j, partida.ayudas, yo);
  mandos.mostrar(true, false);
  const ordenar = (o: Orden) => enviarAlAnfitrion(l, { t: 'orden', id: l.id, o });
  ui.alTocarAlerta = (id) => {
    if (!l.anfitrion) return ordenar({ tipo: 'reponer', vitrina: id });
    const v = j.tienda.vitrinas.find((x) => x.dato.id === id);
    if (v && j.reponerSeccion(v, yo)) ui.aviso('Reposición en la fila');
  };
  ui.alUsarAyuda = (id) => {
    if ((partida.ayudas[id] ?? 0) <= 0) return;
    if (l.anfitrion) {
      if (!j.usarAyuda(id)) return;
    } else enviarAlAnfitrion(l, { t: 'ayuda', id: l.id, ayuda: id });
    partida.ayudas[id]--;
    guardado.guardar(partida);
    ui.pintarAyudas(partida.ayudas, j);
  };
  ui.alTomarCorazon = () => (l.anfitrion ? j.tomarCorazon() : enviarAlAnfitrion(l, { t: 'corazon', id: l.id }));
  if (l.anfitrion) {
    j.alTerminar = (r) => {
      enviarFoto(l);
      const fin: Mensaje = { t: 'fin', id: l.id, r };
      enviar(l, fin);
      // (por el canal de la pareja se repite; en la sala ya va fiable)
      if (!l.sala) window.setTimeout(() => enviar(l, fin), 800);
      l.fase = 'fin';
      cerrarLinea();
      terminarDia(j, l.nivel, r, sueldoDe(l));
    };
  }
}

/**
 * ¿Quién pone el sueldo de este día en la casa? null: este celular; un nombre: el de ese jugador; '': nadie (un
 * amigo, o una sala sin Javier ni Laura).
 */
function sueldoDe(l: Linea): string | null {
  if (modoAmigo()) return '';
  if (!l.sala) return l.anfitrion ? null : l.remotos[0]?.nombre ?? '';
  const primero = l.config?.equipo?.find((q) => q.casa);
  if (!primero) return '';
  return primero.id === l.yo ? null : primero.nombre;
}

function enviarFoto(l: Linea) {
  const j = l.dia;
  if (!j) return;
  const f = tomarFoto(j, ++l.nFoto, l.enviados);
  l.enviados = j.eventos.length;
  enviar(l, { t: 'foto', id: l.id, f });
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
  enviarAlAnfitrion(l, { t: 'mando', id: l.id, ...v });
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
  if (r === 'otro') {
    const l = linea;
    ui.aviso(l && l.remotos.length === 1 ? `${l.remotos[0].nombre} ya va para allá` : 'Alguien del equipo ya va para allá');
  } else if (AVISOS_TOQUE[r]) ui.aviso(AVISOS_TOQUE[r]);
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

/** La conexión volvió: queda en la pausa que corresponda (alguien había pausado) o sigue el juego. */
function reanudarSegunPausas(l: Linea) {
  const quien = l.remotos.find((r) => r.pausa);
  if (quien) pausar(`${quien.nombre} pausó el juego.`);
  else if (l.pausaPropia) pausar();
  else seguir();
}

/** Si otro celular deja de hablar, se pausa (y vuelve solo cuando regresa); si no vuelve, se acaba. */
function vigilarLinea() {
  const l = linea!;
  if (l.fase !== 'jugando' && l.fase !== 'cargando') return;
  if (l.sala) return vigilarSala(l, l.sala);
  const r = l.remotos[0];
  const sin = (performance.now() - r.ultimo) / 1000;
  const o = r.nombre;
  if (l.fase === 'cargando') {
    if (sin > 40) void salirDeLinea(`No se pudo empezar: se perdió la conexión con ${o}.`);
    return;
  }
  if ((sin > LINEA_PAUSA || r.fuera) && !l.pausaPorConexion) {
    l.pausaPorConexion = true;
    pausar(r.fuera ? `Se cortó la conexión con ${o}: salió de la app… esperando a que vuelva.` : `Se cortó la conexión con ${o}… esperando a que vuelva.`);
  } else if (sin < 1.5 && !r.fuera && l.pausaPorConexion) {
    l.pausaPorConexion = false;
    reanudarSegunPausas(l);
  } else if (sin > LINEA_ADIOS) void salirDeLinea(`Se perdió la conexión con ${o}.`);
}

/** En una sala: la sala sabe quién está conectado (latidos y segundo plano) y quién ya se fue. */
function vigilarSala(l: Linea, s: Sala) {
  const presentes = new Set(s.jugadores.map((j) => j.id));
  const siguen = l.remotos.filter((r) => presentes.has(r.salaId ?? ''));
  if (l.fase === 'cargando') {
    const espera = performance.now() - l.desde;
    // El anfitrión no espera para siempre a quien no termina de cargar (entra cuando le llegue la primera foto)
    if (l.anfitrion && l.dia && espera > 40_000) intentarArrancar(true);
    else if (!l.anfitrion && espera > 60_000) void salirDeLinea('No llegó la tienda del anfitrión. Revisen el internet e inténtenlo otra vez.');
    return;
  }
  const cortados = siguen.filter((r) => !s.conectado(r.salaId ?? ''));
  if (cortados.length) {
    const nota = `Se cortó la conexión con ${cortados.map((r) => r.nombre).join(' y ')} (o salió de la app)… esperando a que vuelva.`;
    if (!l.pausaPorConexion || $('pausa-nota').textContent !== nota) {
      l.pausaPorConexion = true;
      pausar(nota);
    }
  } else if (l.pausaPorConexion) {
    l.pausaPorConexion = false;
    reanudarSegunPausas(l);
  }
}

function alMensaje(m: Mensaje, de?: Remoto) {
  if (m.t === 'hola') return;
  if (m.t === 'inv') return llegaInvitacion(m);
  const l = linea;
  if (!l || m.id !== l.id) {
    // Cancelaron la invitación que se estaba mostrando
    if (m.t === 'cancelar' && invitacionVista?.id === m.id) {
      const quien = invitacionVista.de;
      invitacionVista = null;
      if (!$('sala').hidden) sala('Invitación cancelada', `${NOMBRE[quien]} ya no va a abrir la tienda.`, { no: 'Volver' });
    }
    return;
  }
  const r = de ?? (l.sala ? undefined : l.remotos[0]);
  if (!r) return;
  r.ultimo = performance.now();
  const o = r.nombre;
  switch (m.t) {
    case 'resp':
      if (!l.anfitrion || l.fase !== 'invitando') return;
      if (m.si) void empezarAnfitrion(l);
      else {
        cerrarLinea();
        sala(`${o} no puede ahora`, 'Será en otro momento. Pueden jugar solos o en el mismo celular.', { no: 'Volver' });
      }
      return;
    case 'cancelar':
      if (l.anfitrion) return;
      cerrarLinea();
      if (!juego) sala('Invitación cancelada', `${o} ya no va a abrir la tienda.`, { no: 'Volver' });
      return;
    case 'inicio':
      if (l.anfitrion || l.sala) return;
      if (l.fase === 'esperando') void empezarInvitado(l, m.config);
      else if (l.dia && l.fase === 'cargando') enviar(l, { t: 'listo', id: l.id });
      return;
    case 'listo':
      if (!l.anfitrion) return;
      r.listo = true;
      intentarArrancar();
      return;
    case 'foto':
      if (!l.espejo || !r.anfitrion) return;
      l.espejo.aplicar(m.f);
      if (l.fase === 'cargando') arrancarDia(l);
      return;
    case 'mando':
      r.mando = { x: m.x, y: m.y };
      return;
    case 'orden': {
      if (!l.anfitrion || !l.dia || l.fase !== 'jugando') return;
      const suyo = l.dia.jugadores.find((p) => p.id === r.id);
      if (suyo) enviar(l, { t: 'res', id: l.id, r: aplicarOrden(l.dia, suyo, m.o) }, r);
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
    case 'fuera':
      r.fuera = m.si;
      // (el aviso de la pausa lo pone vigilarLinea en el siguiente cuadro)
      return;
    case 'pausa':
      if (l.fase !== 'jugando') return;
      r.pausa = m.si;
      if (!m.si) {
        l.pausaPropia = false;
        for (const x of l.remotos) x.pausa = false;
      }
      if (l.pausaPorConexion) return;
      if (m.si) pausar(`${o} pausó el juego.`);
      else if (pausado) seguir();
      return;
    case 'fin': {
      if (l.anfitrion || !r.anfitrion || l.fase !== 'jugando' || !l.dia) return;
      const j = l.dia;
      l.fase = 'fin';
      j.terminado = true;
      cerrarLinea();
      pausado = false;
      $('pausa-nota').hidden = true;
      terminarDia(j, l.nivel, m.r, sueldoDe(l));
      return;
    }
    case 'salir':
      if (l.sala) {
        // En la sala: si se fue el anfitrión se acaba (también lo avisa la sala); si no, se sigue sin él
        if (r.anfitrion) void salirDeLinea(`${o} cerró la tienda.`);
        else ui.aviso(`${o} salió del juego`);
        return;
      }
      if (l.fase === 'invitando' || l.fase === 'esperando') {
        cerrarLinea();
        sala(`${o} se salió`, 'La partida en línea se canceló.', { no: 'Volver' });
      } else void salirDeLinea(`${o} salió del juego`);
      return;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Sala con código (de 2 a 4: Javier, Laura y amigos)
// ---------------------------------------------------------------------------------------------------------------
/** La sala en la que está este celular (si está en una). */
let salaActual: Sala | null = null;
/** El día de la sala que está en curso (o su tiquete): cómo seguir. */
let finDiaSala: ((que: 'sala' | 'salir') => void) | null = null;
/** Aviso para cuando se vuelva al menú (la sala se acabó). */
let avisoAlSalir = '';
/** Abrir o buscar una sala toma un rato: si se cancela, lo que llegue tarde se suelta. */
const turnoAbrir = { n: 0, abriendo: false, uniendo: false };
let pedirCodigoListo: ((c: string | null) => void) | null = null;

/** Pide el código de una sala (5 letras y números). */
function pedirCodigo(): Promise<string | null> {
  pantallaUnica('codigo');
  const i = $<HTMLInputElement>('codigo-input');
  i.value = '';
  $('codigo-error').textContent = '';
  setTimeout(() => i.focus(), 60);
  return new Promise((ok) => {
    pedirCodigoListo = (c) => {
      pedirCodigoListo = null;
      ok(c);
    };
  });
}

/** El anfitrión abre una sala nueva (desde la tarjeta del día, con el modo «Sala con código»). */
async function abrirSala() {
  if (salaActual || linea) return;
  const turno = ++turnoAbrir.n;
  Object.assign(turnoAbrir, { abriendo: true, uniendo: false });
  sala('Abriendo la sala…', 'Un momentico: ya te damos el código para tus amigos.', { esperando: true, no: 'Cancelar' });
  try {
    const { crearSala } = await import('./salas/sala');
    const s = await crearSala({ juego: 'super', max: 4 });
    if (turno !== turnoAbrir.n) return s.salir();
    turnoAbrir.abriendo = false;
    void cicloSala(s);
  } catch (e) {
    if (turno !== turnoAbrir.n) return;
    turnoAbrir.abriendo = false;
    sala('No se pudo abrir la sala', e instanceof Error ? e.message : 'Revisa el internet e intenta otra vez.', { no: 'Volver' });
  }
}

/** Entrar a la sala de otro con su código (botón del menú, o super.html?sala=CÓDIGO). */
async function unirseConCodigo(codigo?: string) {
  if (salaActual || linea) return;
  const c = codigo ? normalizar(codigo) : await pedirCodigo();
  if (!c) return abrirMenu();
  const turno = ++turnoAbrir.n;
  Object.assign(turnoAbrir, { abriendo: true, uniendo: true });
  sala('Buscando la sala…', `Entrando a la sala ${c.split('').join(' ')}`, { esperando: true, no: 'Cancelar' });
  try {
    const { unirseSala } = await import('./salas/sala');
    const s = await unirseSala(c, 'super');
    if (turno !== turnoAbrir.n) return s.salir();
    turnoAbrir.abriendo = false;
    void cicloSala(s);
  } catch (e) {
    if (turno !== turnoAbrir.n) return;
    turnoAbrir.abriendo = false;
    sala('No se pudo entrar', e instanceof Error ? e.message : 'Revisa el código e intenta otra vez.', { no: 'Volver' });
  }
}

/** El día que va a abrir el anfitrión, en palabras (para la sala de espera). */
function textoDia(): string {
  const nv = niveles[nivelElegido - 1];
  const extra = nv?.evento ?? (nv?.noticia ? 'día con noticia' : `día ${nv?.dia ?? nivelElegido}`);
  return `${legendario ? 'Legendario' : 'Nivel'} ${nivelElegido} · ${extra}`;
}

/** Sala de espera → día → tiquete → sala de espera…, hasta que se salgan (o el anfitrión cierre la sala). */
async function cicloSala(s: Sala) {
  salaActual = s;
  avisoAlSalir = '';
  const { esperarEnSala } = await import('./salas/espera');
  const neutro = () => ponerNeutro(s.hayAmigos);
  neutro();
  const quitar = [
    s.alCambiar(neutro),
    s.al(MSJ_SALA, (d, de) => alMensajeSala(s, d, de)),
    s.alFin((_m, texto) => {
      // Si están jugando o cargando, se sale ya; si están viendo el tiquete, al tocar «Volver a la sala»
      if (linea?.sala === s) void salirDeLinea(texto);
      else avisoAlSalir = texto;
    }),
  ];
  try {
    for (;;) {
      pantallaUnica(null);
      mandos.mostrar(false);
      sonido.musica.iniciar('menu');
      s.ponerDatos({ jugando: false, dia: textoDia() });
      const e = esperarEnSala({
        sala: s,
        titulo: 'Súper Manía',
        subtitulo: s.soyAnfitrion
          ? `${textoDia()}: con tus vitrinas y mejoras. De 2 a 4 en la misma tienda.`
          : 'Se juega con las vitrinas y mejoras de quien abrió la sala.',
        tema: 'casa',
        detalle: (j) => (j.puesto === 0 && j.datos?.dia ? `🗓️ ${escHtml(String(j.datos.dia))}` : ''),
        extras: s.soyAnfitrion ? [{ id: 'dia', texto: '🗓️ Escoger día', alTocar: () => escogerDiaSala(s, e.raiz) }] : [],
        minimo: 2,
        alEmpezar: () => configSala(s),
        invitacion: (c) => `¡Ven a atender la tienda conmigo en Súper Manía! Abre «Nuestro Hogar», toca «Soy un amigo / una amiga», «Unirme con un código» y escribe: ${c}`,
      });
      const r = await e.resultado;
      document.querySelector('.dia-sala')?.remove();
      if (r.que !== 'empezar') {
        if (r.motivo) avisoAlSalir = r.motivo;
        break;
      }
      const cfg = configSegura(r.datos, s);
      if (!cfg) {
        avisoAlSalir = 'No se pudo entrar al día. Intenten otra vez.';
        break;
      }
      const que = await diaEnSala(s, cfg);
      juego?.destruir();
      juego = null;
      if (que === 'salir' || avisoAlSalir) break;
    }
  } finally {
    for (const q of quitar) q();
    s.salir();
    if (linea?.sala === s) cerrarLinea();
    salaActual = null;
    finDiaSala = null;
    ponerNeutro(false);
    pausado = false;
    juego?.destruir();
    juego = null;
  }
  await montarFondo();
  abrirMenu();
  if (avisoAlSalir) ui.aviso(avisoAlSalir);
  avisoAlSalir = '';
}

/** Los mensajes del día que llegan por la sala (de quién vienen lo dice la sala). */
function alMensajeSala(s: Sala, d: unknown, de: JugadorSala) {
  const m = d as Mensaje;
  if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
  const l = linea;
  if (!l || l.sala !== s) return;
  const r = l.remotos.find((x) => x.salaId === de.id);
  if (r) alMensaje(m, r);
}

/** La configuración que arma el anfitrión: el día, sus vitrinas y mejoras y quién juega (en el orden de los puestos). */
function configSala(s: Sala): ConfigDia {
  const js = s.jugadores.filter((j) => j.puesto >= 0).slice(0, 4);
  return {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    nivel: nivelElegido,
    legendario,
    sitios: { ...partida.sitios },
    mejoras: { ...partida.mejoras },
    equipo: js.map((j, i) => ({
      id: `j${i}`,
      salaId: j.id,
      cuerpo: j.aspecto?.cuerpo === 'ella' ? 'ella' : 'el',
      nombre: String(j.nombre ?? '').slice(0, 16) || 'Jugador',
      color: COLORES_SALA[j.puesto] ?? COLORES_SALA[i],
      aspecto: j.tipo === 'amigo' ? j.aspecto : undefined,
      casa: j.tipo !== 'amigo',
    })),
  };
}
/** Los colores de los puestos de la sala (los mismos de `COLOR_PUESTO` en salas/sala.ts). */
const COLORES_SALA = ['#ff7aa8', '#4fb3ff', '#ffc24d', '#6fd39a'];

/** Revisa lo que mandó el anfitrión (nunca se confía a ciegas en lo que llega de otro celular). */
function configSegura(x: unknown, s: Sala): ConfigDia | null {
  const c = x as Partial<ConfigDia> | null;
  if (!c || typeof c !== 'object' || !Array.isArray(c.equipo) || c.equipo.length < 1 || c.equipo.length > 4) return null;
  const nivel = Math.round(Number(c.nivel));
  if (!(nivel >= 1 && nivel <= NIVELES_JUGABLES)) return null;
  const numeros = (o: unknown) => {
    const r: Record<string, number> = {};
    if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (typeof v === 'number' && Number.isFinite(v)) r[k] = Math.max(0, Math.min(9, Math.floor(v)));
    return r;
  };
  const color = (v: unknown) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : undefined);
  const equipo = c.equipo.map((q, i) => ({
    id: `j${i}`,
    salaId: typeof q?.salaId === 'string' ? q.salaId : '',
    cuerpo: (q?.cuerpo === 'ella' ? 'ella' : 'el') as Rol,
    nombre: typeof q?.nombre === 'string' ? q.nombre.replace(/[<>&"'`\\]/g, '').slice(0, 16) || 'Jugador' : 'Jugador',
    color: color(q?.color),
    aspecto: q?.aspecto && typeof q.aspecto === 'object'
      ? { cuerpo: (q.cuerpo === 'ella' ? 'ella' : 'el') as Rol, piel: color(q.aspecto.piel), pelo: color(q.aspecto.pelo), detalles: { ropa: color(q.aspecto.detalles?.ropa) ?? '', ropa2: color(q.aspecto.detalles?.ropa2) ?? '', zapatos: color(q.aspecto.detalles?.zapatos) ?? '' } }
      : undefined,
    casa: !!q?.casa,
  }));
  if (!equipo.some((q) => q.salaId === s.yo.id)) return null;
  return { id: typeof c.id === 'string' ? c.id.slice(0, 24) : 'sala', nivel, legendario: !!c.legendario, sitios: numeros(c.sitios), mejoras: numeros(c.mejoras), equipo };
}

/** Un día jugado en la sala: carga, juega y espera a que tocar «Volver a la sala» (o salir). */
function diaEnSala(s: Sala, cfg: ConfigDia): Promise<'sala' | 'salir'> {
  return new Promise((listo) => {
    finDiaSala = listo;
    const yo = cfg.equipo!.find((q) => q.salaId === s.yo.id)!;
    const anfitrion = cfg.equipo![0]?.salaId === s.yo.id;
    const remotos: Remoto[] = cfg.equipo!
      .filter((q) => q.salaId !== s.yo.id)
      .map((q) => ({ id: q.id, nombre: q.nombre, salaId: q.salaId, anfitrion: q.salaId === cfg.equipo![0].salaId, mando: { x: 0, y: 0 }, listo: false, ultimo: performance.now(), fuera: false, pausa: false }));
    const l = nuevaLinea(cfg.id ?? 'sala', anfitrion, cfg.nivel, cfg.legendario, yo.id, remotos, s);
    l.config = cfg;
    linea = l;
    s.ponerDatos({ jugando: true, listo: false });
    sala('¡A trabajar!', anfitrion ? 'Acomodando la tienda en todos los celulares…' : 'Acomodando la tienda…', { esperando: true, no: 'Salir' });
    void cargarDia(l).then((ok) => {
      if (!ok || linea !== l) return;
      if (anfitrion) intentarArrancar();
      else enviarAlAnfitrion(l, { t: 'listo', id: l.id });
    });
  });
}

/** Tiquete de la sala: volver a la sala de espera o salirse. */
function terminarDiaSala(que: 'sala' | 'salir') {
  const f = finDiaSala;
  finDiaSala = null;
  f?.(avisoAlSalir ? 'salir' : que);
}

/** El anfitrión escoge en la sala de espera qué día abrir (de los que ya tiene abiertos). */
function escogerDiaSala(s: Sala, raiz: HTMLElement) {
  document.querySelector('.dia-sala')?.remove();
  const capa = document.createElement('div');
  capa.className = 'dia-sala';
  const pintar = () => {
    const tres = (partida.estrellas[nivelElegido] ?? []).filter(Boolean).length === 3 && !!niveles[nivelElegido - 1]?.legendario;
    if (!tres) legendario = false;
    capa.innerHTML = `<div class="dia-sala-caja" role="dialog" aria-label="Escoger día"><h3>¿Qué día abrimos?</h3>
      <div class="dia-sala-lista">${Array.from({ length: NIVELES_JUGABLES }, (_, k) => {
        const n = k + 1;
        const libre = nivelDesbloqueado(n);
        const est = (partida.estrellas[n] ?? []).filter(Boolean).length;
        const nv = niveles[n - 1];
        return `<button class="dia-sala-n${n === nivelElegido ? ' si' : ''}${nv?.evento || nv?.noticia ? ' evento' : ''}" data-n="${n}" ${libre ? '' : 'disabled'}>
          <b>${n}</b><small>${'★'.repeat(est)}${'☆'.repeat(3 - est)}</small></button>`;
      }).join('')}</div>
      <p class="dia-sala-texto">${escHtml(textoDia())}</p>
      <div class="fila-botones">${tres ? `<button class="boton boton-luna" data-leg aria-pressed="${legendario}">${legendario ? 'Modo normal' : '🌙 Legendario'}</button>` : ''}
      <button class="boton boton-tomate" data-cerrar>Listo</button></div></div>`;
  };
  pintar();
  capa.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('button');
    if (!b && ev.target !== capa) return;
    sonido.toque();
    if (b?.dataset.n) {
      nivelElegido = Number(b.dataset.n);
      legendario = false;
      pintar();
    } else if (b?.dataset.leg !== undefined && b) {
      legendario = !legendario;
      pintar();
    } else {
      capa.remove();
      s.ponerDatos({ dia: textoDia() });
      const sub = raiz.querySelector('.se-sub');
      if (sub) sub.textContent = `${textoDia()}: con tus vitrinas y mejoras. De 2 a 4 en la misma tienda.`;
    }
  });
  document.body.append(capa);
}

/** Piloto automático para pruebas (?bot): juega como alguien atento (con toques). Atrapa, cobra cuando hay fila,
 *  llena varias vitrinas por viaje y limpia cuando le queda tiempo. En pareja, Él cuida la caja y Ella repone. */
function piloto(j: Juego) {
  // (las pruebas de la sala pueden dejarle los demás a su joystick: `__soloAnfitrion`)
  const solo = !!(window as { __soloAnfitrion?: boolean }).__soloAnfitrion;
  j.jugadores.forEach((jug, i) => (!solo || i === 0) && pilotoDe(j, jug, !j.pareja || i === 0));
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
