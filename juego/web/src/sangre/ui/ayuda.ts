// Los textos de ayuda al pasar el ratón (los `title`): el del sistema sale con otra letra y, en el computador con la
// pantalla escalada, grandote y blanco, desentonando con el juego. Aquí se cambian por un globito chiquito de
// pergamino oscuro junto al puntero (y el `title` pasa a `data-ayuda` para que el del sistema ya no salga).
let puesto = false;

export function globitosDeAyuda() {
  if (puesto) return;
  puesto = true;
  const g = document.createElement('div');
  g.className = 'globito-ayuda';
  g.hidden = true;
  document.body.append(g);
  let actual: HTMLElement | null = null;
  const ocultar = () => {
    actual = null;
    g.hidden = true;
  };
  const mover = (x: number, y: number) => {
    const w = g.offsetWidth, h = g.offsetHeight;
    g.style.left = `${Math.max(4, Math.min(innerWidth - w - 4, x + 12))}px`;
    g.style.top = `${y + 18 + h > innerHeight - 4 ? y - h - 10 : y + 18}px`;
  };
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = (e.target as Element | null)?.closest?.<HTMLElement>('[title],[data-ayuda]') ?? null;
    if (!el) return ocultar();
    if (el.hasAttribute('title')) {
      if (el.title) el.dataset.ayuda = el.title;
      el.removeAttribute('title');
    }
    if (!el.dataset.ayuda) return ocultar();
    actual = el;
    g.textContent = el.dataset.ayuda;
    g.hidden = false;
    mover(e.clientX, e.clientY);
  });
  document.addEventListener('pointermove', (e) => {
    if (actual && e.pointerType === 'mouse') mover(e.clientX, e.clientY);
  });
  document.addEventListener('pointerout', (e) => {
    if (actual && !actual.contains(e.relatedTarget as Node | null)) ocultar();
  });
  document.addEventListener('pointerdown', ocultar, true);
  addEventListener('blur', ocultar);
}
