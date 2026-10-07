// El retrete espacial sin la casa (retrete.html), para la sala de juegos de amigos: el amigo despega de una con su
// muñeco y sus colores, todo en modo neutro (src/casa/cohete.ts), y su progreso (rollitos, mejoras, cosméticos,
// misiones y récords) queda guardado en el aparato. «Volar otra vez» y la tienda funcionan igual que en la casa; al
// salir vuelve a su sala de juegos (./amigos.html), nunca a la casa.
//   retrete.html           despega
//   retrete.html?tienda    abre solo la tienda del retrete
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '../estilos.css';
import './sueltos.css';
import { elegirModelos } from '../recursos';
import { activar } from '../sonido';
import { alAtras, aLaVista, amigoDelAparato, avisoSuelto, guardarAparato, leerAparato, volverALaSala } from './comun';

/** Donde vive el progreso del retrete de un amigo (en el aparato: los amigos no tienen casa). */
export const CLAVE_RETRETE = 'amigo-retrete-progreso';

const params = new URLSearchParams(location.search);
const carga = document.querySelector<HTMLElement>('.suelto-carga');

async function arrancar() {
  const amigo = amigoDelAparato();
  // (la guardia del <head> ya mandó a la casa a quien no es amigo; esto es por si acaso)
  if (!amigo) return volverALaSala();
  document.addEventListener('pointerdown', () => activar(), { once: true });
  try {
    await elegirModelos();
    const { jugarCohete, abrirTiendaCohete, precargarCohete } = await import('../casa/cohete');
    const { normalizarCohete } = await import('../casa/cohete/datos');
    precargarCohete();
    const opciones = {
      rol: amigo.cuerpo,
      progreso: normalizarCohete(leerAparato(CLAVE_RETRETE)),
      guardar: (p: unknown) => guardarAparato(CLAVE_RETRETE, p),
      amigo: { nombre: amigo.nombre, aspecto: amigo.aspecto },
      textoSalir: '🎮 Mis juegos',
    };
    carga?.classList.add('fuera');
    setTimeout(() => carga?.remove(), 600);
    // Atrás de Android (o Esc): cierra la tienda, sale de la pantalla del vuelo o pone la pausa (en vuelo, en el
    // computador el mismo retrete ya pone y quita la pausa con Esc)
    alAtras(() => {
      const cerrarTienda = aLaVista('.cohete-tienda .ct-cerrar');
      const salir = aLaVista('.cohete-resultado [data-casa]');
      const seguir = aLaVista('.ch-pausa-capa:not([hidden]) [data-seguir]');
      const pausa = aLaVista('.cohete-hud:not([hidden]) .ch-pausa');
      if (cerrarTienda) cerrarTienda.click();
      else if (salir) salir.click();
      else if (seguir) {
        if (document.body.dataset.nativo) seguir.click();
      } else if (pausa) {
        if (document.body.dataset.nativo) pausa.click();
      }
      // (mientras carga o despega no se sale de un tirón: se espera a la pausa o a la pantalla del vuelo)
      return true;
    });
    await (params.has('tienda') ? abrirTiendaCohete(opciones) : jugarCohete(opciones));
  } catch (e) {
    console.error(e);
    avisoSuelto('No se pudo abrir el retrete espacial. Intenta otra vez.');
    await new Promise((r) => setTimeout(r, 2600));
  }
  volverALaSala();
}

void import('@capacitor/core').then(({ Capacitor }) => {
  if (Capacitor.isNativePlatform()) document.body.dataset.nativo = '1';
});
void arrancar();
