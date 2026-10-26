// La rocola de Carreras (pedido de Javier, 26 de octubre de 2026): una lista con TODAS las canciones de la app
// (public/musica/nombres.json y, en la versión de la pareja, public/musica/pareja/nombres.json, que arma
// scripts/musica-ia.mjs) para oírlas una tras otra, al azar o una sola. Mientras la rocola esté encendida, sus
// canciones suenan también en las carreras en vez de la música de cada circuito. Se recuerda en este aparato.
import * as sonido from '../sonido';
import './rocola.css';

type Nombres = Record<string, [string, string]>;
interface Cancion { id: string; nombre: string; juego: string }
interface Estado { activa: boolean; lista: string[]; azar: boolean }

const CLAVE = 'carreras-rocola';
const JUEGOS: Record<string, string> = {
  rocola: '💞 Canciones de amor', casa: '🏠 La casa', puertas: '🚪 Cien Puertas', super: '🛒 Súper Manía', cocina: '🧇 Cocina',
  cohete: '🚀 Retrete espacial', lavado: '🫧 Lavarse la cara', sangre: '🌙 Sangre y Ceniza', mesa: '🎲 Juegos de mesa',
  carreras: '🏁 Carreras', show: '📺 El Show de Nosotros', patio: '🧩 El patio', amigos: '🎮 Sala de juegos', granja: '🌾 La granja',
};

let canciones: Promise<Cancion[]> | null = null;
function leer(dir: string): Promise<Nombres> {
  return fetch(`./${dir}nombres.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
}
/** Todas las canciones que trae esta versión (la de amigos no trae las de la pareja). */
export function cancionesRocola(): Promise<Cancion[]> {
  canciones ??= Promise.all([leer('musica/pareja/'), leer('musica/')]).then(([p, n]) => {
    const orden = Object.keys(JUEGOS);
    return Object.entries({ ...p, ...n })
      .map(([id, [nombre, juego]]) => ({ id, nombre, juego }))
      .sort((a, b) => (orden.indexOf(a.juego) + 1 || 99) - (orden.indexOf(b.juego) + 1 || 99));
  });
  return canciones;
}

function estado(): Estado {
  try {
    const e = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
    if (e && Array.isArray(e.lista)) return { activa: !!e.activa, lista: e.lista.filter((x: unknown) => typeof x === 'string'), azar: !!e.azar };
  } catch { /* nada guardado */ }
  return { activa: false, lista: [], azar: false };
}
function guardar(e: Estado) {
  try { localStorage.setItem(CLAVE, JSON.stringify(e)); } catch { /* sin almacenamiento */ }
}
const barajar = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Si la rocola está encendida, pone su lista y devuelve true (quien llama no pone su propia música). */
export function sonarRocola(): boolean {
  const e = estado();
  if (!e.activa || !e.lista.length) return false;
  const actual = sonido.musica.pistaSonando();
  if (actual && e.lista.includes(actual)) return true; // ya va sonando: que siga
  sonido.musica.pista(e.lista[0], { rueda: e.lista, reiniciar: true });
  return true;
}

/** La ventana de la rocola encima de la pantalla actual. */
export async function abrirRocola(raiz: HTMLElement, alCerrar: () => void, alApagar: () => void = () => sonido.musica.pista('carreras-menu', { bucle: true, reiniciar: true })) {
  const todas = await cancionesRocola();
  const capa = document.createElement('div');
  capa.className = 'car-rocola-capa';
  const pintar = () => {
    const e = estado();
    const sonando = sonido.musica.pistaSonando();
    let grupo = '';
    const filas = todas.map((c) => {
      const cab = c.juego !== grupo ? `<li class="grupo">${JUEGOS[c.juego] ?? c.juego}</li>` : '';
      grupo = c.juego;
      return `${cab}<li><button data-una="${c.id}" class="${sonando === c.id ? 'sonando' : ''}">${sonando === c.id ? '🔊' : '▶'} ${c.nombre}</button></li>`;
    }).join('');
    capa.innerHTML = `<div class="car-rocola" role="dialog" aria-label="Rocola">
      <header><h2>🎵 Rocola</h2><small>${todas.length} canciones${e.activa ? ` · sonando ${e.azar ? 'al azar' : 'en orden'}` : ''}</small></header>
      <div class="acciones">
        <button data-todas>▶ Todas en orden</button><button data-azar>🔀 Todas al azar</button>
        ${e.activa ? '<button data-apagar>⏹ Apagar la rocola</button>' : ''}
      </div>
      <ul class="lista">${filas || '<li>Todavía no hay canciones en este aparato.</li>'}</ul>
      <button class="car-boton" data-cerrar>Listo</button></div>`;
  };
  // Solo se repinta todo al cambiar de modo; cada rato solo se marca la que suena (sin mover la lista ni el dedo)
  const marcar = () => {
    const sonando = sonido.musica.pistaSonando();
    capa.querySelectorAll<HTMLButtonElement>('[data-una]').forEach((b) => {
      const si = b.dataset.una === sonando;
      if (b.classList.contains('sonando') !== si) {
        b.classList.toggle('sonando', si);
        b.textContent = `${si ? '🔊' : '▶'} ${todas.find((c) => c.id === b.dataset.una)?.nombre ?? ''}`;
      }
    });
  };
  pintar();
  raiz.append(capa);
  const reloj = setInterval(marcar, 1000);
  capa.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) { if (ev.target === capa) cerrar(); return; }
    sonido.activar();
    const ids = todas.map((c) => c.id);
    if (b.dataset.cerrar !== undefined) return cerrar();
    if (b.dataset.todas !== undefined) guardar({ activa: true, lista: ids, azar: false });
    else if (b.dataset.azar !== undefined) guardar({ activa: true, lista: barajar(ids), azar: true });
    else if (b.dataset.apagar !== undefined) { guardar({ activa: false, lista: [], azar: false }); alApagar(); pintar(); return; }
    else if (b.dataset.una) {
      // Desde esa canción sigue el resto de la lista
      const i = ids.indexOf(b.dataset.una);
      guardar({ activa: true, lista: [...ids.slice(i), ...ids.slice(0, i)], azar: false });
    }
    const e = estado();
    sonido.musica.pista(e.lista[0], { rueda: e.lista, reiniciar: true });
    const arriba = capa.querySelector('.lista')?.scrollTop ?? 0;
    pintar();
    const l = capa.querySelector('.lista');
    if (l) l.scrollTop = arriba;
    setTimeout(marcar, 600);
  });
  function cerrar() {
    clearInterval(reloj);
    capa.remove();
    alCerrar();
  }
}
