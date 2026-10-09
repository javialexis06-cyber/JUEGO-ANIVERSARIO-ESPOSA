// Repintar una pantalla entera (innerHTML) sin que las listas vuelvan al principio: se anota dónde iba cada parte que
// se desplaza y se devuelve ahí después (al comprar en la Forja o en el Pozo, la lista se queda donde estabas).
const ruta = (raiz: Element, el: Element) => {
  const r: number[] = [];
  for (let e: Element = el; e !== raiz && e.parentElement; e = e.parentElement) r.push(Array.prototype.indexOf.call(e.parentElement.children, e));
  return r.reverse();
};
const seguir = (raiz: Element, r: number[]) => {
  let e: Element | undefined = raiz;
  for (const k of r) e = e?.children[k];
  return e as HTMLElement | undefined;
};

export function sinSaltar(raiz: HTMLElement, pintar: () => void) {
  const guardados: { r: number[]; x: number; y: number }[] = [];
  if (raiz.scrollTop || raiz.scrollLeft) guardados.push({ r: [], x: raiz.scrollLeft, y: raiz.scrollTop });
  for (const el of raiz.querySelectorAll<HTMLElement>('*')) if (el.scrollTop || el.scrollLeft) guardados.push({ r: ruta(raiz, el), x: el.scrollLeft, y: el.scrollTop });
  pintar();
  for (const g of guardados) {
    const el = seguir(raiz, g.r);
    if (el) {
      el.scrollLeft = g.x;
      el.scrollTop = g.y;
    }
  }
}

/** Lo que se acaba de mejorar late con un aura dorada (una vez). */
export function brillar(el: Element | null | undefined) {
  if (!el) return;
  el.classList.remove('subio');
  void (el as HTMLElement).offsetWidth;
  el.classList.add('subio');
}

/** Centra `el` en su carrusel, solo de lado (scrollIntoView también movía la pantalla de arriba abajo). */
export function centrarEnCarrusel(el: HTMLElement | null) {
  const c = el?.parentElement;
  if (!el || !c) return;
  const er = el.getBoundingClientRect(), cr = c.getBoundingClientRect();
  c.scrollLeft += er.left + er.width / 2 - (cr.left + cr.width / 2);
}
