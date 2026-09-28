// Súper Manía en Pareja · jugable 1 (la tiendita completa: 25 días, en solitario con Él).
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
import { Juego, NivelDato, textoDe } from './juego';
import { Mundo } from './mundo';
import { cargar, cargarAnimado, cargarJSON, elegirModelos, icono, Productos } from './recursos';
import * as sonido from './sonido';
import { liberarPropios, NOMBRE_SECCION, Tienda, TiendaDato } from './tienda';
import { mostrar, pantallaUnica, UI } from './ui';
import { SUELDO_FRACCION } from './casa/catalogo';

const CLAVE_SUELDO = 'nuestro-hogar-sueldo';

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

async function iniciar() {
  mundo = new Mundo($('lienzo') as HTMLCanvasElement);
  ui = new UI(mundo);
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
  let antes = performance.now();
  const bucle = (ahora: number) => {
    const dt = Math.min((ahora - antes) / 1000, 0.1);
    antes = ahora;
    requestAnimationFrame(bucle);
    try {
      paso(dt);
    } catch (e) {
      console.error(e);
    }
  };
  const paso = (dt: number) => {
    if (juego && !pausado && !juego.terminado) {
      // En pruebas (?bot&rapido=N) se simulan N pasos fijos de 0,1 s por cuadro
      const pasos = BOT ? RAPIDO : 1;
      for (let k = 0; k < pasos && !juego.terminado; k++) {
        if (BOT) piloto(juego);
        juego.update(BOT ? 0.1 : dt);
      }
      if (!juego.terminado) ui.actualizar(juego, BOT ? 0.1 * RAPIDO : dt);
      // La música se apura cuando falta poco para cerrar
      sonido.musica.tempo((juego.legendario ? 112 : 100) + (!juego.cerrado && juego.restante < 25 ? 14 : 0));
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
  sonido.musica.iniciar('menu');
  pantallaUnica('menu');
  $('menu-dinero').textContent = String(partida.dinero);
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
  const nv = niveles[n - 1];
  const tres = (partida.estrellas[n] ?? []).filter(Boolean).length === 3;
  if (!tres) legendario = false;
  pantallaUnica('tarjeta');
  $('tarjeta-titulo').textContent = `${legendario ? 'Legendario' : 'Nivel'} ${n}`;
  const clientes = legendario && nv.legendario ? nv.legendario.clientes.solitario : nv.clientes.solitario;
  $('tarjeta-sub').textContent = `${tiendaDato.nombre} · Día ${nv.dia} · ${clientes} clientes`;
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

/** Copia del nivel con las reglas del modo legendario. */
function nivelDeJuego(n: number): NivelDato {
  const nv = niveles[n - 1];
  if (!legendario || !nv.legendario) return nv;
  return { ...nv, clientes: nv.legendario.clientes, paciencia: nv.legendario.paciencia };
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
  const nuevo = new Juego(mundo, nivelDeJuego(n), productos, tiendaDato, partida.sitios, escalas, partida.mejoras, legendario);
  await nuevo.preparar();
  juego = nuevo;
  $('cargando-nivel').hidden = true;
  ui.empezarNivel(juego, partida.ayudas);
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
  juego.alTerminar = (r) => {
    const j = juego!;
    const antes = partida.estrellas[n] ?? [false, false, false];
    if (!j.legendario) partida.estrellas[n] = antes.map((e, i) => e || r.estrellas[i]);
    if (r.luna) partida.lunas[n] = true;
    if (r.corazon) partida.corazones[n] = true;
    partida.dinero += r.ganancia;
    guardado.guardar(partida);
    // Un tercio de lo ganado pasa a la casa (Nuestro Hogar) como sueldo
    const sueldo = Math.max(0, Math.round(r.ganancia * SUELDO_FRACCION));
    try {
      localStorage.setItem(CLAVE_SUELDO, String((Number(localStorage.getItem(CLAVE_SUELDO)) || 0) + sueldo));
    } catch {
      /* sin almacenamiento */
    }
    $('rec-sueldo').hidden = sueldo <= 0;
    $('rec-sueldo').textContent = `Sueldo para la casa: +${sueldo} monedas`;
    ui.terminarNivel();
    ui.resultado(j, r, antes);
    pantallaUnica('resultado');
    (window as any).__resultado = r;
  };
  pausado = false;
}

function abrirMejoras() {
  pantallaUnica('mejoras');
  pintarMejoras();
}

function pintarMejoras() {
  $('mej-dinero').textContent = String(partida.dinero);
  const lista = $('mej-lista');
  lista.innerHTML = '';
  const dia = diaAlcanzado();
  const titulo = (t: string) => {
    const li = document.createElement('li');
    li.className = 'catalogo-grupo';
    li.textContent = t;
    lista.appendChild(li);
  };
  const fila = (nombre: string, detalle: string, precio: number, accion: () => void, estado: 'comprar' | 'listo' | 'bloqueado' = 'comprar', bloqueo = '') => {
    const li = document.createElement('li');
    if (estado === 'bloqueado') li.className = 'bloqueada';
    li.innerHTML = `<div><strong>${nombre}</strong><span>${estado === 'bloqueado' ? bloqueo : detalle}</span></div>`;
    const b = document.createElement('button');
    b.className = 'boton-precio';
    b.disabled = estado !== 'comprar' || partida.dinero < precio;
    b.textContent = estado === 'listo' ? 'Listo' : estado === 'bloqueado' ? '—' : `${precio}`;
    b.addEventListener('click', async () => {
      if (partida.dinero < precio) return;
      partida.dinero -= precio;
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
    titulo(g === 'Él' ? 'Para Él' : g);
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
      fila(nombre, sig.texto, sig.precio, () => (partida.mejoras[m.id] = nivel + 1), dia >= m.desde ? 'comprar' : 'bloqueado', `Desde el día ${m.desde}`);
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
  $('btn-abrir').addEventListener('click', () => void jugar(nivelElegido));
  $('btn-tarjeta-volver').addEventListener('click', abrirMenu);
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
    pausado = true;
    pantallaUnica('pausa');
  });
  $('btn-continuar').addEventListener('click', () => {
    pausado = false;
    pantallaUnica(null);
  });
  $('btn-salir').addEventListener('click', async () => {
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
  const mensajes: Record<string, string> = {
    llena: 'Esa vitrina está llena',
    cancelada: 'Acción cancelada',
    cajera: 'La cajera se encarga de la caja',
    aseo: 'El aseo ya va para allá',
  };
  lienzo.addEventListener('pointerup', (e) => {
    if (!juego || pausado || juego.terminado) return;
    if (Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 12) return;
    const r = juego.tocar(e.clientX, e.clientY);
    if (r && mensajes[r]) ui.aviso(mensajes[r]);
    if (r && r !== 'ya') sonido.toque();
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
  if (Capacitor.isNativePlatform()) {
    void App.addListener('appStateChange', ({ isActive }) => (isActive ? sonido.activar() : alSalir()));
    // Botón «atrás» de Android: pausa el día, vuelve al menú o sale de la app
    void App.addListener('backButton', () => {
      const visible = (id: string) => !$(id).hidden;
      if (juego && !juego.terminado && !pausado) $('btn-pausa').click();
      else if (visible('pausa')) $('btn-continuar').click();
      else if (visible('resultado')) $('btn-rmenu').click();
      else if (visible('tarjeta') || visible('mejoras') || visible('como')) abrirMenu();
      else location.href = './index.html';
    });
  }
}

/** Piloto automático para pruebas (?bot): juega como alguien atento. Atrapa, cobra cuando hay fila,
 *  carga varias cajas por viaje y limpia cuando le queda tiempo. */
function piloto(j: Juego) {
  const jug = j.jugador;
  const guardia = j.ayudantes.some((a) => a.tipo === 'guardia');
  if (!guardia) for (const o of j.perseguibles()) if (o.visible) jug.agregar({ tipo: 'atrapar', objetivo: o });
  const repone = j.ayudantes.filter((a) => a.vitrina).map((a) => a.vitrina);
  const bajas = j.tienda.enVenta
    .filter((v) => v.fraccion <= 0.5 && !jug.vaAReponer(v) && !repone.includes(v))
    .sort((a, c) => a.fraccion - c.fraccion);
  const vacias = bajas.filter((v) => v.stock === 0);
  const reponiendo = jug.fila.some((t) => t.tipo === 'reponer');
  // Canastas: si quedan pocas en la entrada, recogerlas es urgente
  if (j.canastas <= 2) for (const c of j.canastasSueltas.filter((x) => !x.reservado).slice(0, 2)) jug.agregar({ tipo: 'canasta', canasta: c });
  // Un charco o basura a la vez, sin esperar a estar libre del todo
  const limpiando = jug.fila.some((t) => t.tipo === 'mugre');
  const sucia = j.mugres.find((x) => !x.reservado && (x.tipo === 'charco' || x.tiempo > 12));
  if (!limpiando && sucia && jug.fila.length <= 2) jug.agregar({ tipo: 'mugre', mugre: sucia });
  const alguienEspera = j.clientes.some((c) => c.estado === 'esperando');
  if (!j.cajera && j.fila.length && !jug.estaCobrando && !jug.tiene({ tipo: 'caja' })) {
    const urgente = j.fila.length >= 2 || j.fila[0].paciencia < 0.45 || !reponiendo;
    if (urgente) jug.agregar({ tipo: 'caja' });
  }
  // Mientras cobra, solo sale a reponer si alguien está esperando un producto que se acabó
  const puedeReponer = !jug.estaCobrando || alguienEspera || !j.fila.length;
  if (!reponiendo && puedeReponer && (bajas.length >= 2 || vacias.length || (bajas.length && !jug.fila.length))) {
    for (const v of bajas.slice(0, jug.capacidadCarrito)) jug.agregar({ tipo: 'reponer', vitrina: v });
    return;
  }
  if (jug.fila.length) return;
  const m = j.mugres.filter((x) => !x.reservado).sort((a, c) => (a.tipo === 'charco' ? -1 : 0) - (c.tipo === 'charco' ? -1 : 0))[0];
  if (m && jug.agregar({ tipo: 'mugre', mugre: m })) return;
  const c = j.canastasSueltas.find((x) => !x.reservado);
  if (c) jug.agregar({ tipo: 'canasta', canasta: c });
}

if (BOT) {
  (window as any).__mundo = () => mundo;
  (window as any).__juego = () => juego;
}
(window as any).__estado = () => ({
  juego: juego ? { tiempo: juego.tiempo, stats: juego.stats, clientes: juego.clientes.length, fila: juego.fila.length, terminado: juego.terminado } : null,
  el: juego ? {
    tareas: juego.jugador.fila.map((t) => t.tipo), cobrando: juego.jugador.estaCobrando, moviendo: juego.jugador.moviendo,
    pos: juego.jugador.pos, cajas: juego.jugador.cajas.length,
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
