import { leerRetornoHogar, volverALaGranja } from '../granja-v3/hogar';

/** Importación aditiva en casa/main.ts: no cambia la casa, su sesión ni su economía. */
export function instalarRegresoGranja(): void {
  if (!leerRetornoHogar() || document.getElementById('btn-volver-granja')) return;
  const grupo = document.querySelector<HTMLElement>('.hud-arriba-der');
  if (!grupo) return;
  const boton = document.createElement('button');
  boton.id = 'btn-volver-granja';
  boton.className = 'boton boton-papel boton-chico';
  boton.type = 'button';
  boton.textContent = 'Volver a la granja';
  boton.setAttribute('aria-label', 'Salir de casa y volver a la granja');
  boton.addEventListener('click', () => {
    if (!volverALaGranja()) boton.remove();
  });
  grupo.prepend(boton);
  // Permite regresar también antes de elegir una sesión de la casa.
  const bienvenida = document.querySelector<HTMLElement>('#bienvenida article');
  if (bienvenida) {
    const regreso = boton.cloneNode(true) as HTMLButtonElement;
    regreso.id = 'btn-volver-granja-bienvenida';
    regreso.addEventListener('click', () => { if (!volverALaGranja()) regreso.remove(); });
    bienvenida.append(regreso);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalarRegresoGranja, { once: true });
else instalarRegresoGranja();
