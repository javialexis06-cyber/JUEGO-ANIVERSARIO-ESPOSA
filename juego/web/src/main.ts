// Súper Manía en Pareja · jugable 1 (tiendita, niveles 1 a 6, en solitario con Él).
import './estilos.css';
import * as guardado from './guardado';
import { Juego, NivelDato, textoDe } from './juego';
import { Mundo } from './mundo';
import { cargar, cargarAnimado, cargarJSON, elegirModelos, Productos } from './recursos';
import { NOMBRE_SECCION, Tienda, TiendaDato } from './tienda';
import { mostrar, pantallaUnica, UI } from './ui';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const NIVELES_JUGABLES = 6;
const PRECIO_COMPRA: Record<string, number> = { frutas: 60, abarrotes: 60, bebidas: 60, lacteos: 80, panaderia: 80, congelados: 100, carnes: 100 };
const PRECIO_MEJORA = 90;
const PRECIO_MEJORA_CAJA = 120;
const PRECIO_CARRITO = 150;

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
    const dt = (ahora - antes) / 1000;
    antes = ahora;
    if (juego && !pausado && !juego.terminado) {
      // En pruebas (?bot&rapido=N) se simulan N pasos fijos de 0,1 s por cuadro
      const pasos = BOT ? RAPIDO : 1;
      for (let k = 0; k < pasos && !juego.terminado; k++) {
        if (BOT) piloto(juego);
        juego.update(BOT ? 0.1 : dt);
      }
      if (!juego.terminado) ui.actualizar(juego);
    }
    mundo.dibujar(dt, !!juego && !juego.terminado && !pausado);
    requestAnimationFrame(bucle);
  };
  requestAnimationFrame(bucle);
}

/** La tienda de fondo del menú y de la tienda de mejoras, con lo que se ha comprado. */
async function montarFondo() {
  if (fondo) mundo.escena.remove(fondo.grupo);
  fondo = new Tienda(tiendaDato, productos);
  await fondo.montar(partida.sitios);
  mundo.escena.add(fondo.grupo);
  mundo.encuadrar(tiendaDato.W, tiendaDato.D);
  mundo.sucio = true;
}

function nivelDesbloqueado(n: number) {
  return n === 1 || !!partida.estrellas[n - 1]?.[0];
}

function abrirMenu() {
  ui.terminarNivel();
  pantallaUnica('menu');
  $('menu-dinero').textContent = String(partida.dinero);
  $('menu-estrellas').textContent = `${guardado.totalEstrellas(partida)} / ${NIVELES_JUGABLES * 3}`;
  const lista = $('niveles');
  lista.innerHTML = '';
  for (let n = 1; n <= NIVELES_JUGABLES; n++) {
    const nv = niveles[n - 1];
    const est = partida.estrellas[n] ?? [false, false, false];
    const libre = nivelDesbloqueado(n);
    const b = document.createElement('button');
    b.className = `etiqueta${libre ? '' : ' bloqueada'}`;
    b.disabled = !libre;
    b.innerHTML = `<span class="etiqueta-hueco" aria-hidden="true"></span>
      <span class="etiqueta-num">${n}</span>
      <span class="etiqueta-dia">Día ${nv.dia}${nv.evento ? ` · ${nv.evento}` : ''}</span>
      <span class="etiqueta-estrellas">${est.map((e) => `<i class="${e ? 'si' : ''}"></i>`).join('')}</span>`;
    b.setAttribute('aria-label', `Nivel ${n}${libre ? '' : ' (bloqueado)'}`);
    b.addEventListener('click', () => abrirTarjeta(n));
    lista.appendChild(b);
  }
}

function abrirTarjeta(n: number) {
  nivelElegido = n;
  const nv = niveles[n - 1];
  pantallaUnica('tarjeta');
  $('tarjeta-titulo').textContent = `Nivel ${n}`;
  $('tarjeta-sub').textContent = `${tiendaDato.nombre} · Día ${nv.dia} · ${nv.clientes.solitario} clientes`;
  $('tarjeta-novedad').textContent = nv.descripcion_evento ?? nv.novedad ?? 'Atiende bien a todos y no dejes vitrinas vacías.';
  $('tarjeta-evento').textContent = nv.evento ?? 'Día normal';
  const ul = $('tarjeta-objetivos');
  const previas = partida.estrellas[n] ?? [];
  ul.innerHTML = nv.estrellas.map((e, i) => `<li class="${previas[i] ? 'hecha' : ''}"><span class="sello-mini"></span>${textoDe(e.texto)}${i === 0 ? ' <em>(obligatoria)</em>' : ''}</li>`).join('');
}

async function jugar(n: number) {
  pantallaUnica(null);
  if (juego) juego.destruir();
  if (fondo) {
    mundo.escena.remove(fondo.grupo);
    fondo = null;
  }
  $('cargando-nivel').hidden = false;
  juego = new Juego(mundo, niveles[n - 1], productos, tiendaDato, partida.sitios, escalas);
  await juego.preparar();
  juego.jugador.capacidadCarrito = partida.carrito >= 2 ? 7 : 5;
  $('cargando-nivel').hidden = true;
  ui.empezarNivel(juego);
  ui.alTocarAlerta = (id) => {
    const v = juego?.tienda.vitrinas.find((x) => x.dato.id === id);
    if (v && juego?.reponerSeccion(v)) ui.aviso('Reposición en la fila');
  };
  juego.alTerminar = (r) => {
    const antes = partida.estrellas[n] ?? [false, false, false];
    partida.estrellas[n] = antes.map((e, i) => e || r.estrellas[i]);
    partida.dinero += r.ganancia;
    guardado.guardar(partida);
    ui.terminarNivel();
    ui.resultado(juego!, r, antes);
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
  const fila = (titulo: string, detalle: string, precio: number, accion: () => void, hecho = false) => {
    const li = document.createElement('li');
    const puede = !hecho && partida.dinero >= precio;
    li.innerHTML = `<div><strong>${titulo}</strong><span>${detalle}</span></div>`;
    const b = document.createElement('button');
    b.className = 'boton-precio';
    b.disabled = !puede;
    b.textContent = hecho ? 'Listo' : `${precio}`;
    b.addEventListener('click', async () => {
      if (partida.dinero < precio) return;
      partida.dinero -= precio;
      accion();
      guardado.guardar(partida);
      pintarMejoras();
      await montarFondo();
    });
    li.appendChild(b);
    lista.appendChild(li);
  };
  for (const s of tiendaDato.sitios) {
    const nv = partida.sitios[s.id] ?? 0;
    const nombre = NOMBRE_SECCION[s.seccion] ?? s.seccion;
    if (!nv) fila(`Comprar ${nombre}`, s.isla ? 'Góndola en la isla del centro' : 'Vitrina nueva de nivel 1', PRECIO_COMPRA[s.seccion] ?? 80,
      () => (partida.sitios[s.id] = 1));
    else if (nv < tiendaDato.tope) {
      const caja = s.seccion === 'caja';
      fila(caja ? 'Mejorar la caja' : `Mejorar ${nombre}`, caja ? 'Banda y cobro más rápido' : 'Nivel 2: más capacidad y más bonita',
        caja ? PRECIO_MEJORA_CAJA : PRECIO_MEJORA, () => (partida.sitios[s.id] = nv + 1));
    } else fila(`${nombre} al tope`, `Nivel ${nv}, el máximo de esta tienda`, 0, () => {}, true);
  }
  if (partida.carrito < 2) fila('Carrito de reposición nivel 2', 'Lleva 7 cajas por viaje (ahora 5)', PRECIO_CARRITO, () => (partida.carrito = 2));
}

function conectarBotones() {
  $('btn-abrir').addEventListener('click', () => void jugar(nivelElegido));
  $('btn-tarjeta-volver').addEventListener('click', abrirMenu);
  $('btn-mejoras').addEventListener('click', abrirMejoras);
  $('btn-mej-cerrar').addEventListener('click', abrirMenu);
  $('btn-como').addEventListener('click', () => pantallaUnica('como'));
  $('btn-como-cerrar').addEventListener('click', abrirMenu);
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
  $('btn-siguiente').addEventListener('click', () => abrirTarjeta(Math.min(nivelElegido + 1, NIVELES_JUGABLES)));
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
  lienzo.addEventListener('pointerdown', (e) => (inicio = { x: e.clientX, y: e.clientY }));
  lienzo.addEventListener('pointerup', (e) => {
    if (!juego || pausado || juego.terminado) return;
    if (Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 12) return;
    const r = juego.tocar(e.clientX, e.clientY);
    if (r === 'llena') ui.aviso('Esa vitrina está llena');
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && juego && !juego.terminado) $('btn-pausa').click();
  });
}

/** Piloto automático para pruebas (?bot): repone lo que baja, cobra y recoge basura. */
function piloto(j: Juego) {
  const jug = j.jugador;
  if (jug.fila.length > 1) return;
  const b = j.basuras[0];
  if (b && jug.agregar({ tipo: 'basura', basura: b })) return;
  if (j.fila.length && !jug.estaCobrando && jug.agregar({ tipo: 'caja' })) return;
  const baja = j.tienda.enVenta.filter((v) => v.fraccion <= 0.4).sort((a, c) => a.fraccion - c.fraccion)[0];
  if (baja && !jug.estaCobrando) jug.agregar({ tipo: 'reponer', vitrina: baja });
}

if (BOT) {
  (window as any).__mundo = () => mundo;
  (window as any).__juego = () => juego;
}
(window as any).__estado = () => ({
  juego: juego ? { tiempo: juego.tiempo, stats: juego.stats, clientes: juego.clientes.length, fila: juego.fila.length, terminado: juego.terminado } : null,
  resultado: (window as any).__resultado ?? null,
});

iniciar().catch((e) => {
  console.error(e);
  $('carga-texto').textContent = 'No se pudo cargar el juego. Recarga la página.';
});

mostrar('toast', false);
