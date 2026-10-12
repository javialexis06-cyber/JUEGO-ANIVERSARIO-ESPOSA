// Listas que se deslizan de lado (pestañas, carruseles de clases, filtros, mutadores…): antes escondían su barra y en
// el computador no había cómo moverlas, y en el celular nada decía que había más cosas a la derecha. Aquí, para
// cualquier lista de lado de cualquier juego:
//   · la rueda del mouse la mueve de lado (si la lista no se mueve hacia abajo),
//   · se puede arrastrar con el mouse,
//   · y lleva una sombrita con flecha en el lado donde quedan cosas escondidas (clases `hay-izq` / `hay-der`).
// Se activa solo con importar este archivo una vez por página.

const SELECTOR = '.am-tabs, .am-vistas, .pestanas, .filtros, .ct-pestanas, .carrusel, .mutadores.lista-mut, [data-desliza]';

function deLado(e: Element | null): HTMLElement | null {
  for (let n = e as HTMLElement | null; n && n !== document.body; n = n.parentElement) {
    if (n.scrollWidth > n.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(n).overflowX)) return n;
  }
  return null;
}

function marcar(el: HTMLElement) {
  const max = el.scrollWidth - el.clientWidth;
  el.classList.toggle('hay-izq', max > 2 && el.scrollLeft > 2);
  el.classList.toggle('hay-der', max > 2 && el.scrollLeft < max - 2);
}

const vistos = new WeakSet<HTMLElement>();
const tamano = new ResizeObserver((es) => es.forEach((e) => marcar(e.target as HTMLElement)));
function revisar() {
  document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
    if (!vistos.has(el)) {
      vistos.add(el);
      el.classList.add('desliza');
      el.addEventListener('scroll', () => marcar(el), { passive: true });
      tamano.observe(el);
    }
    marcar(el);
  });
}

function iniciar() {
  if ((window as unknown as { __deslizar?: boolean }).__deslizar) return;
  (window as unknown as { __deslizar?: boolean }).__deslizar = true;
  const estilo = document.createElement('style');
  estilo.textContent = `
.desliza { scrollbar-width: thin !important; scrollbar-color: rgba(120, 90, 80, 0.45) transparent; }
.desliza::-webkit-scrollbar { display: block !important; height: 5px; }
.desliza::-webkit-scrollbar-thumb { background: rgba(120, 90, 80, 0.45); border-radius: 9px; }
.desliza.hay-der { -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 34px), transparent); mask-image: linear-gradient(90deg, #000 calc(100% - 34px), transparent); }
.desliza.hay-izq { -webkit-mask-image: linear-gradient(90deg, transparent, #000 34px); mask-image: linear-gradient(90deg, transparent, #000 34px); }
.desliza.hay-izq.hay-der { -webkit-mask-image: linear-gradient(90deg, transparent, #000 34px, #000 calc(100% - 34px), transparent); mask-image: linear-gradient(90deg, transparent, #000 34px, #000 calc(100% - 34px), transparent); }`;
  document.head.append(estilo);

  // La rueda del mouse mueve de lado la lista que solo se desliza de lado
  addEventListener('wheel', (e) => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const el = deLado(e.target as Element);
    if (!el || el.scrollHeight > el.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(el).overflowY)) return;
    const max = el.scrollWidth - el.clientWidth;
    if ((e.deltaY > 0 && el.scrollLeft >= max - 1) || (e.deltaY < 0 && el.scrollLeft <= 0)) return;
    el.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false, capture: true });

  // Arrastrar con el mouse (en el celular ya se arrastra con el dedo)
  let soltadoEn = -1e9;
  let arrastre: { el: HTMLElement; x: number; desde: number; movio: boolean } | null = null;
  addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = deLado(e.target as Element);
    if (el && el.classList.contains('desliza')) arrastre = { el, x: e.clientX, desde: el.scrollLeft, movio: false };
  }, true);
  addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    const d = e.clientX - arrastre.x;
    if (Math.abs(d) > 6) arrastre.movio = true;
    if (arrastre.movio) arrastre.el.scrollLeft = arrastre.desde - d;
  }, true);
  addEventListener('pointerup', () => {
    const a = arrastre;
    arrastre = null;
    // Si fue un arrastre, el clic que sigue no escoge nada
    if (a?.movio) soltadoEn = performance.now();
  }, true);
  addEventListener('click', (ev) => {
    if (performance.now() - soltadoEn < 250) { ev.stopPropagation(); ev.preventDefault(); }
  }, true);

  revisar();
  let pendiente = 0;
  new MutationObserver(() => {
    if (pendiente) return;
    pendiente = requestAnimationFrame(() => { pendiente = 0; revisar(); });
  }).observe(document.body, { childList: true, subtree: true });
}

if (document.body) iniciar();
else addEventListener('DOMContentLoaded', iniciar, { once: true });
