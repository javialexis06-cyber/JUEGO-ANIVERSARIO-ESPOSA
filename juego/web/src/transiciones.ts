// Transiciones de la interfaz: las hojas, ventanas y avisos entran con un saltico de resorte y se van suavecito, en
// vez de aparecer y desaparecer de golpe. La salida la hace una copia sin toques: el elemento de verdad se esconde de
// una (así la lógica de cada pantalla no tiene que esperar a la animación).
import './transiciones.css';

const sinMovimiento = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Hace la salida animada de `el` con una copia (llamar justo antes de esconderlo). */
export function salirSuave(el: HTMLElement | null) {
  if (!el || el.hidden || sinMovimiento() || !el.isConnected) return;
  const copia = el.cloneNode(true) as HTMLElement;
  // (la copia conserva los id para verse igual; va después de la de verdad, así getElementById sigue dando la original)
  copia.classList.add('saliendo');
  copia.setAttribute('aria-hidden', 'true');
  copia.inert = true;
  el.after(copia);
  // Que la copia quede donde iba la lectura (la hoja de la tienda puede ir bajada)
  const cuerpos = el.querySelectorAll<HTMLElement>('[class*="cuerpo"], .hoja-carta, .hoja-cuerpo');
  const otros = copia.querySelectorAll<HTMLElement>('[class*="cuerpo"], .hoja-carta, .hoja-cuerpo');
  cuerpos.forEach((c, i) => otros[i] && (otros[i].scrollTop = c.scrollTop));
  let hecho = false;
  const fin = () => {
    if (hecho) return;
    hecho = true;
    copia.remove();
  };
  copia.addEventListener('animationend', (e) => e.target === copia && fin());
  window.setTimeout(fin, 450);
}

let cortina: HTMLElement | null = null;
/** Cambio de vista (otro cuarto): la nueva aparece desde el color del fondo en vez de un corte seco. No cambia
 *  ningún tiempo de la lógica: el cuarto nuevo ya está puesto debajo y la cortina solo se desvanece encima. */
export function fundido(color: string) {
  if (sinMovimiento() || document.body.classList.contains('en-tele')) return;
  if (!cortina) {
    cortina = document.createElement('div');
    cortina.className = 'cortina-vista';
    cortina.setAttribute('aria-hidden', 'true');
    document.body.append(cortina);
  }
  cortina.style.background = color;
  cortina.classList.remove('fundiendo');
  void cortina.offsetWidth;
  cortina.classList.add('fundiendo');
}

/** Aviso flotante (toast): entra con un brinquito y se va bajando suave. Devuelve el reloj para cancelarlo. */
export function avisoSuave(t: HTMLElement, texto: string, ms: number, reloj: { id: number }) {
  t.textContent = texto;
  t.hidden = false;
  t.classList.remove('sale', 'se-va');
  void t.offsetWidth;
  t.classList.add('sale');
  clearTimeout(reloj.id);
  reloj.id = window.setTimeout(() => {
    if (sinMovimiento()) return void (t.hidden = true);
    t.classList.add('se-va');
    reloj.id = window.setTimeout(() => {
      t.hidden = true;
      t.classList.remove('se-va');
    }, 230);
  }, ms);
}
