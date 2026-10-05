// La cocina de chef sin la casa (cocina.html), para la sala de juegos de amigos: el amigo escoge restaurante (la
// waflería, la fresería o la frapería) y cocina solo, o abre una cocina con sus amigos (hasta 4, con código) o entra a
// la de otro. Todo en modo neutro (la pareja no llega a comer, sin frases de amor ni premios de la casa), con su chef
// hecho con su muñeco y sus colores, y su progreso (día, rango, propinas y mejoras de cada restaurante) guardado en
// el aparato. Al salir vuelve a su sala de juegos (./amigos.html), nunca a la casa.
//   cocina.html                 el menú de los restaurantes
//   cocina.html?unirse=ABCDE    entra directo a la sala de otro (lo usa «Unirme con un código» de la sala de juegos)
//   cocina.html?receta=wafles   abre directo ese restaurante, cocinando solo
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '../estilos.css';
import './sueltos.css';
import { caritaSvg } from '../salas/carita';
import { normalizarCodigo } from '../salas/sala';
import { activar } from '../sonido';
import { alAtras, aLaVista, amigoDelAparato, avisoSuelto, guardarAparato, leerAparato, volverALaSala, type AmigoJugando } from './comun';
import type { ProgresoCocina, RecetaId } from '../casa/cocina/tipos';

/** Donde vive el progreso de la cocina de un amigo: un objeto con cada restaurante (en el aparato). */
export const CLAVE_COCINA = 'amigo-cocina-progreso';

const params = new URLSearchParams(location.search);
const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const carga = document.querySelector<HTMLElement>('.suelto-carga');
type ModuloTipos = typeof import('../casa/cocina/tipos');

/** Lo que el amigo lleva en cada restaurante (normalizado). */
function progresoDe(T: ModuloTipos, r: RecetaId): ProgresoCocina {
  const todo = leerAparato(CLAVE_COCINA) as Record<string, unknown> | null;
  return T.normalizarProgreso(todo && typeof todo === 'object' ? todo[r] : null);
}
function guardarProgreso(r: RecetaId, p: ProgresoCocina) {
  const todo = (leerAparato(CLAVE_COCINA) as Record<string, unknown> | null) ?? {};
  guardarAparato(CLAVE_COCINA, { ...(typeof todo === 'object' ? todo : {}), [r]: p });
}

let ocupado = false;

async function arrancar() {
  const amigo = amigoDelAparato();
  // (la guardia del <head> ya mandó a la casa a quien no es amigo; esto es por si acaso)
  if (!amigo) return volverALaSala();
  document.addEventListener('pointerdown', () => activar(), { once: true });
  let T: ModuloTipos, cocina: typeof import('../casa/cocina/index'), sala: typeof import('../casa/cocina/sala');
  try {
    [T, cocina, sala] = await Promise.all([import('../casa/cocina/tipos'), import('../casa/cocina/index'), import('../casa/cocina/sala')]);
    await (await import('../casa/cocina/sprites')).cargarRecortes();
  } catch (e) {
    console.error(e);
    avisoSuelto('No se pudo abrir la cocina. Intenta otra vez.');
    setTimeout(volverALaSala, 2600);
    return;
  }
  carga?.classList.add('fuera');
  setTimeout(() => carga?.remove(), 600);
  const { iconoHTML } = await import('../casa/cocina/pantallas');
  // (los recortes del chef del amigo se van haciendo desde ya: así el «modo chef» sale con su muñeco)
  void import('../casa/cocina/chef_amigo').then((m) => m.prepararChefAmigo(amigo.aspecto));

  const solo = async (receta: RecetaId) => {
    menu?.remove();
    await cocina.jugarCocina({
      rol: amigo.cuerpo,
      receta,
      progreso: progresoDe(T, receta),
      yo: { id: amigo.perfil.id, nombre: amigo.nombre, tipo: 'amigo', rol: amigo.cuerpo, aspecto: amigo.aspecto, puesto: 0 },
      neutro: true,
      textoSalir: '🎮 Mis juegos',
      guardar: async (p) => guardarProgreso(receta, p),
    });
  };
  const enSala = async (receta: RecetaId, unirse?: string) => {
    menu?.remove();
    await sala.cocinarEnSala({
      yo: { tipo: 'amigo', id: amigo.perfil.id, nombre: amigo.nombre, aspecto: amigo.aspecto },
      rol: amigo.cuerpo,
      receta,
      unirse,
      progresoDe: (r) => progresoDe(T, r),
      guardar: async (r, p) => guardarProgreso(r, p),
      textoSalir: '🎮 Mis juegos',
    });
  };
  /** Lo que se toca en el menú (una cosa a la vez: un doble toque no abre dos cocinas). */
  const hacer = async (fn: () => Promise<void>) => {
    if (ocupado) return;
    ocupado = true;
    try {
      await fn();
    } catch (e) {
      console.error(e);
      avisoSuelto('Algo falló en la cocina. Intenta otra vez.');
    }
    ocupado = false;
    pintarMenu(amigo, T, iconoHTML, hacer, solo, enSala, sala);
  };

  alAtras(() => {
    const cerrar = aLaVista('.cocina-codigo [data-c="no"]', '.cocina-elegir [data-r=""]', '.cocina-aviso .boton-cocina', '.sala-espera [data-a="salir"]');
    const pausa = aLaVista('.cocina:not(.cocina-codigo):not(.cocina-elegir) .cocina-capa:not([hidden]) [data-c="salir"]');
    const enCocina = aLaVista('.cocina .cocina-pausa');
    if (cerrar) cerrar.click();
    else if (pausa) pausa.click();
    else if (enCocina) enCocina.click();
    else if (ocupado) return true; // (cargando: no se sale de un tirón)
    else return false; // menú: vuelve a la sala de juegos
    return true;
  });

  const unirse = normalizarCodigo(params.get('unirse') ?? '');
  const directa = params.get('receta');
  if (unirse.length === 5) await hacer(() => enSala('wafles', unirse));
  else if (T.esReceta(directa)) await hacer(() => solo(directa));
  else pintarMenu(amigo, T, iconoHTML, hacer, solo, enSala, sala);
}

let menu: HTMLElement | null = null;

/** El menú de los restaurantes (con su día y su rango), cocinar con amigos y unirse con un código. */
function pintarMenu(
  amigo: AmigoJugando,
  T: ModuloTipos,
  iconoHTML: (id: string, tam: number) => string,
  hacer: (fn: () => Promise<void>) => Promise<void>,
  solo: (r: RecetaId) => Promise<void>,
  enSala: (r: RecetaId, unirse?: string) => Promise<void>,
  sala: typeof import('../casa/cocina/sala'),
) {
  menu?.remove();
  menu = document.createElement('section');
  menu.className = 'cz-menu';
  const acento: Record<RecetaId, string> = { wafles: '#e0793a', fresas: '#e2475d', frappes: '#2f9e8f' };
  menu.innerHTML = `<header><div><h1>👨‍🍳 Cocina de chef</h1><p>Escoge restaurante: llegan invitados, cocinas lo que piden y te califican.</p></div>
      <span class="cz-yo">${caritaSvg(amigo.aspecto, 38, 'feliz')}${esc(amigo.nombre)}</span></header>
    <ul class="cz-lista">${T.RESTAURANTES.map((r) => {
      const guardado = leerAparato(CLAVE_COCINA) as Record<string, unknown> | null;
      const nuevo = !guardado || typeof guardado !== 'object' || !guardado[r.id];
      const p = progresoDe(T, r.id);
      return `<li><button class="cz-carta" data-r="${r.id}" style="--acento-cocina:${acento[r.id]}">${iconoHTML(r.icono, 110) || `<span class="cz-emoji">${r.emoji}</span>`}
        <b>${r.nombre}</b><small>${r.texto}</small><em class="${nuevo ? 'nuevo' : ''}">${nuevo ? '¡Nuevo!' : `Día ${p.dia} · ${T.nombreRango(T.rangoDe(p.xp))}`}</em></button></li>`;
    }).join('')}</ul>
    <footer>
      <button class="boton-cocina" data-a="volver">🎮 Mis juegos</button>
      <button class="boton-cocina" data-a="codigo">🔑 Unirme con un código</button>
      <button class="boton-cocina principal" data-a="amigos">👥 Cocinar con amigos</button>
    </footer>`;
  document.body.append(menu);
  menu.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const r = t.closest<HTMLElement>('[data-r]')?.dataset.r;
    const a = t.closest<HTMLElement>('[data-a]')?.dataset.a;
    activar();
    if (T.esReceta(r)) void hacer(() => solo(r));
    else if (a === 'volver') volverALaSala();
    else if (a === 'codigo')
      void hacer(async () => {
        const c = await sala.pedirCodigoCocina();
        if (c) await enSala('wafles', c);
      });
    else if (a === 'amigos')
      void hacer(async () => {
        const receta = await sala.elegirRestaurante((x) => progresoDe(T, x));
        if (receta) await enSala(receta);
      });
  });
}

void arrancar();
