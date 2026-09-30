// Si el celular le quita al juego el dibujo 3D (poca memoria, otra app pesada, el video de la tele) la pantalla
// queda en blanco o parpadea. three.js se recupera solo cuando Android se lo devuelve; si no vuelve pronto, se
// recarga la página (todo lo importante ya está guardado) en vez de quedarse sin mostrar nada.
export function vigilarContexto(lienzo: HTMLCanvasElement, alVolver?: () => void) {
  let reloj = 0;
  lienzo.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    clearTimeout(reloj);
    reloj = window.setTimeout(() => location.reload(), 5000);
  });
  lienzo.addEventListener('webglcontextrestored', () => {
    clearTimeout(reloj);
    alVolver?.();
  });
}
