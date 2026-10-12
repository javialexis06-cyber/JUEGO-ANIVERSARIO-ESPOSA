// El Laberinto de la cortina (Mazerella en el original): un laberinto sin fin de cortinas de baño colgadas, por
// celdas. Cada celda abre su camino hacia el sur o hacia el este (un árbol binario: todo queda conectado) y a algunas
// se les quita también la otra cortina para que haya vueltas y nadie quede encerrado. Las cortinas atajan a los
// jugadores; los mugrosos se cuelan por debajo, pero despacio. El piso las dibuja con una textura de esta misma
// función (`Suelo`), así que lo que se ve y lo que ataja es lo mismo.
import { hash2 } from './azar';

export const CELDA = 300;
/** Medio grosor de una cortina. */
export const GROSOR = 10;

/** Las cortinas propias de cada celda: 1 = la del lado derecho (este), 2 = la de abajo (sur). */
export function paredes(i: number, j: number): number {
  // Alrededor del principio no hay cortinas (para arrancar tranquilos)
  if (Math.abs(i) <= 1 && Math.abs(j) <= 1) return 0;
  const sur = hash2(i, j, 71) < 0.5;
  let b = 0;
  if (sur && hash2(i, j, 72) > 0.42) b |= 1;
  if (!sur && hash2(i, j, 73) > 0.42) b |= 2;
  return b;
}

function empujar(x: number, y: number, r: number, x0: number, y0: number, x1: number, y1: number): [number, number] {
  const rx0 = x0 - GROSOR, rx1 = x1 + GROSOR, ry0 = y0 - GROSOR, ry1 = y1 + GROSOR;
  const cx = Math.max(rx0, Math.min(rx1, x)), cy = Math.max(ry0, Math.min(ry1, y));
  const dx = x - cx, dy = y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return [x, y];
  if (d2 < 1e-6) {
    // El centro quedó adentro: se saca por el lado más cercano
    const izq = x - rx0, der = rx1 - x, arr = y - ry0, aba = ry1 - y;
    const mn = Math.min(izq, der, arr, aba);
    if (mn === izq) return [rx0 - r, y];
    if (mn === der) return [rx1 + r, y];
    if (mn === arr) return [x, ry0 - r];
    return [x, ry1 + r];
  }
  const d = Math.sqrt(d2);
  return [cx + (dx / d) * r, cy + (dy / d) * r];
}

/** Empuja un círculo fuera de las cortinas de alrededor. */
export function fueraDeCortinas(x: number, y: number, r: number): [number, number] {
  const ci = Math.floor(x / CELDA), cj = Math.floor(y / CELDA);
  for (let di = -1; di <= 1; di++)
    for (let dj = -1; dj <= 1; dj++) {
      const i = ci + di, j = cj + dj;
      const b = paredes(i, j);
      if (b & 1) [x, y] = empujar(x, y, r, (i + 1) * CELDA, j * CELDA, (i + 1) * CELDA, (j + 1) * CELDA);
      if (b & 2) [x, y] = empujar(x, y, r, i * CELDA, (j + 1) * CELDA, (i + 1) * CELDA, (j + 1) * CELDA);
    }
  return [x, y];
}

/** ¿Está metido en una cortina? (los mugrosos se cuelan por debajo, pero despacio) */
export function enCortina(x: number, y: number, r: number): boolean {
  const [x2, y2] = fueraDeCortinas(x, y, r);
  return x2 !== x || y2 !== y;
}
