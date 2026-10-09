// Las brasas de la pantalla de inicio: chispitas que suben del fuego del campamento, titilan, se mecen con el aire y
// se apagan. Un lienzo 2D encima del 3D (sin filtros ni mezclas: en Android hacen parpadear). Se detiene solo cuando
// el lienzo sale de la página.

interface Brasa {
  x: number;
  y: number;
  vy: number;
  vida: number;
  dur: number;
  r: number;
  fase: number;
  vaiven: number;
  tono: number;
}

export function brasas(lienzo: HTMLCanvasElement, cuantas = 70) {
  const g = lienzo.getContext('2d');
  if (!g) return;
  const lista: Brasa[] = [];
  let W = 0, H = 0, dpr = 1;
  const medir = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = lienzo.clientWidth;
    H = lienzo.clientHeight;
    lienzo.width = Math.max(1, Math.round(W * dpr));
    lienzo.height = Math.max(1, Math.round(H * dpr));
  };
  const nueva = (b?: Brasa, alAzar = false): Brasa => {
    const o = b ?? ({} as Brasa);
    // (salen más del lado del personaje y del fuego: abajo a la derecha)
    o.x = W * (Math.random() < 0.65 ? 0.45 + Math.random() * 0.5 : Math.random());
    o.y = alAzar ? Math.random() * H : H + 10;
    o.vy = 18 + Math.random() * 38;
    o.dur = 3 + Math.random() * 5;
    o.vida = alAzar ? Math.random() * o.dur : 0;
    o.r = 0.7 + Math.random() * 1.8;
    o.fase = Math.random() * 10;
    o.vaiven = 6 + Math.random() * 16;
    o.tono = Math.random();
    return o;
  };
  medir();
  for (let k = 0; k < cuantas; k++) lista.push(nueva(undefined, true));
  addEventListener('resize', medir);
  let antes = performance.now(), ultimo = 0;
  const cuadro = (ahora: number) => {
    if (!lienzo.isConnected) {
      removeEventListener('resize', medir);
      return;
    }
    requestAnimationFrame(cuadro);
    // (30 cuadros por segundo bastan)
    if (ahora - ultimo < 32) return;
    ultimo = ahora;
    const dt = Math.min(0.1, (ahora - antes) / 1000);
    antes = ahora;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    for (const b of lista) {
      b.vida += dt;
      b.y -= b.vy * dt;
      if (b.vida >= b.dur || b.y < -10) nueva(b);
      const t = b.vida / b.dur;
      const x = b.x + Math.sin(b.fase + b.vida * 1.7) * b.vaiven;
      const titila = 0.65 + 0.35 * Math.sin(b.fase * 3 + b.vida * 11);
      const alfa = Math.min(1, t * 5) * (1 - t) * titila;
      if (alfa <= 0.01) continue;
      // Núcleo claro y halo naranja (dos círculos: más barato que un gradiente por chispa)
      g.globalAlpha = alfa * 0.35;
      g.fillStyle = b.tono < 0.25 ? '#ff4a2a' : '#ff8a3a';
      g.beginPath();
      g.arc(x, b.y, b.r * 3.2, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = alfa;
      g.fillStyle = b.tono < 0.25 ? '#ffb07a' : '#ffe0a0';
      g.beginPath();
      g.arc(x, b.y, b.r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  };
  requestAnimationFrame(cuadro);
}
