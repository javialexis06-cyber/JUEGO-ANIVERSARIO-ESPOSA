// Segundo plano: cuando el celular cambia de app, se bloquea la pantalla o se esconde la pestaña, todo se queda
// quieto (dibujo, música, efectos, relojes de los minijuegos, avisos en línea) y al volver sigue donde iba, sin saltos.
// Así la app no gasta batería ni suena escondida.
//
// Un solo aviso por cada ida y cada vuelta, venga de donde venga: `visibilitychange` (pestaña o WebView escondida),
// `pagehide`/`pageshow` (se cierra o vuelve de la caché), `freeze`/`resume` (el navegador congela la página) y
// `appStateChange` de Capacitor (la app de Android pasa al fondo). En Android, además, MainActivity.java pausa el
// WebView entero (onPause/pauseTimers) un instante después de avisarle a la página.
//
// Cómo se usa desde cualquier pantalla o minijuego:
//
//   import * as fondo from '../segundo_plano';
//
//   const quitar = fondo.alPausar(() => { ... });      // al irse: pausar el bucle, callar, avisar al otro celular…
//   fondo.alReanudar((msFuera) => { ... });            // al volver (msFuera: cuánto tiempo estuvo afuera)
//   quitar();                                           // dejar de escuchar (al cerrar el minijuego)
//   fondo.enPausa();                                    // ¿está en segundo plano ahora mismo?
//
//   // Bucle de dibujo que se detiene solo en segundo plano y vuelve sin salto de tiempo (dt máximo 0,1 s):
//   const bucle = fondo.cuadros((dt, ahora) => { ... }); bucle.detener();
//
//   // Reloj del juego que no avanza mientras la app está en el fondo (para minijuegos con tiempo):
//   const t = fondo.reloj();                            // ms, como performance.now() pero sin el tiempo afuera
//
//   // Temporizador que se congela en el fondo y al volver espera solo lo que le faltaba:
//   const t = fondo.esperar(() => { ... }, 3000); t.cancelar();
//
// Cien Puertas, la tele y los minijuegos que se rehacen (lavado, cohete, cocina) pueden suscribirse igual.
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

type AlPausar = () => void;
type AlReanudar = (msFuera: number) => void;

const pausas = new Set<AlPausar>();
const vueltas = new Set<AlReanudar>();
/** Escondida para el navegador (pestaña, WebView o página congelada). */
let ocultaNavegador = typeof document !== 'undefined' && document.hidden;
/** La app de Android en el fondo (Capacitor). */
let ocultaApp = false;
let fuera = ocultaNavegador;
let desde = fuera ? performance.now() : 0;
/** Tiempo total que la app ha pasado en el fondo (para el reloj del juego). */
let totalFuera = 0;

function llamar<T extends unknown[]>(lista: Set<(...a: T) => void>, ...args: T) {
  for (const fn of [...lista]) {
    try {
      fn(...args);
    } catch (e) {
      console.error(e);
    }
  }
}

function revisar() {
  const ahora = ocultaNavegador || ocultaApp;
  if (ahora === fuera) return;
  fuera = ahora;
  if (fuera) {
    desde = performance.now();
    llamar(pausas);
  } else {
    const ms = Math.max(0, performance.now() - desde);
    totalFuera += ms;
    llamar(vueltas, ms);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    ocultaNavegador = document.hidden;
    revisar();
  });
  addEventListener('pagehide', () => {
    ocultaNavegador = true;
    revisar();
  });
  addEventListener('pageshow', () => {
    ocultaNavegador = document.hidden;
    revisar();
  });
  // Page Lifecycle (Chrome): la página se congela en el fondo y se descongela al volver
  document.addEventListener('freeze', () => {
    ocultaNavegador = true;
    revisar();
  });
  document.addEventListener('resume', () => {
    ocultaNavegador = document.hidden;
    revisar();
  });
  if (Capacitor.isNativePlatform()) {
    void App.addListener('appStateChange', ({ isActive }) => {
      ocultaApp = !isActive;
      // Al volver, el WebView puede avisar tarde que ya se ve: manda lo que dice Android
      if (isActive) ocultaNavegador = false;
      revisar();
    });
  }
}

/** Avisa al irse a segundo plano. Devuelve la función para dejar de escuchar. */
export function alPausar(fn: AlPausar): () => void {
  pausas.add(fn);
  return () => pausas.delete(fn);
}

/** Avisa al volver (con los milisegundos que estuvo afuera). Devuelve la función para dejar de escuchar. */
export function alReanudar(fn: AlReanudar): () => void {
  vueltas.add(fn);
  return () => vueltas.delete(fn);
}

/** ¿La app está ahora en segundo plano? */
export function enPausa() {
  return fuera;
}

/** Milisegundos como performance.now(), pero sin contar el tiempo en segundo plano (el reloj del juego no salta). */
export function reloj() {
  const ahora = performance.now();
  return ahora - totalFuera - (fuera ? ahora - desde : 0);
}

/** Bucle de requestAnimationFrame que se detiene en segundo plano y vuelve solo, sin salto de tiempo.
 *  `fn(dt, ahora)`: dt en segundos (máximo `maxDt`), ahora en ms de performance.now(). */
export function cuadros(fn: (dt: number, ahora: number) => void, maxDt = 0.1) {
  let id = 0;
  let antes = 0;
  let vivo = true;
  const paso = (ahora: number) => {
    id = 0;
    if (!vivo || fuera) return;
    const dt = antes ? Math.min(maxDt, Math.max(0, (ahora - antes) / 1000)) : 0;
    antes = ahora;
    id = requestAnimationFrame(paso);
    fn(dt, ahora);
  };
  const arrancar = () => {
    if (!vivo || id || fuera) return;
    antes = 0;
    id = requestAnimationFrame(paso);
  };
  const quitarPausa = alPausar(() => {
    if (id) cancelAnimationFrame(id);
    id = 0;
  });
  const quitarVuelta = alReanudar(arrancar);
  arrancar();
  return {
    detener() {
      vivo = false;
      if (id) cancelAnimationFrame(id);
      id = 0;
      quitarPausa();
      quitarVuelta();
    },
  };
}

/** setTimeout que se congela mientras la app está en el fondo: al volver espera solo lo que le faltaba. */
export function esperar(fn: () => void, ms: number) {
  let restante = ms;
  let inicio = performance.now();
  let id = 0;
  let hecho = false;
  const correr = () => {
    if (hecho || fuera) return;
    inicio = performance.now();
    id = window.setTimeout(() => {
      hecho = true;
      quitar();
      fn();
    }, Math.max(0, restante));
  };
  const quitarPausa = alPausar(() => {
    if (hecho) return;
    clearTimeout(id);
    restante -= performance.now() - inicio;
  });
  const quitarVuelta = alReanudar(() => correr());
  const quitar = () => {
    quitarPausa();
    quitarVuelta();
  };
  correr();
  return {
    cancelar() {
      hecho = true;
      clearTimeout(id);
      quitar();
    },
  };
}
