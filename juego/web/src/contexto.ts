// Si el celular le quita al juego el dibujo 3D (poca memoria, otra app pesada, el video de la tele) la pantalla
// queda en blanco o parpadea. three.js se recupera solo cuando Android se lo devuelve; si no vuelve pronto, se
// recarga la página (todo lo importante ya está guardado) en vez de quedarse sin mostrar nada.
// En segundo plano la cuenta no corre (Android suele quitar el dibujo ahí y devolverlo al volver): así la partida no
// se recarga escondida y al volver sigue donde iba.
import { esperar } from './segundo_plano';

export function vigilarContexto(lienzo: HTMLCanvasElement, alVolver?: () => void) {
  let reloj: ReturnType<typeof esperar> | null = null;
  lienzo.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    reloj?.cancelar();
    reloj = esperar(() => location.reload(), 5000);
  });
  lienzo.addEventListener('webglcontextrestored', () => {
    reloj?.cancelar();
    reloj = null;
    alVolver?.();
  });
}
