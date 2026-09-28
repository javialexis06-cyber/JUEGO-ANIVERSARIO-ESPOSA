// Las voces grabadas por la pareja: si una línea tiene audio (voces/lista.json dice qué archivo), se oye mientras
// sale su globo. Sin audio, la línea se lee escrita como siempre. La lista la arma scripts/voces.mjs.
import * as sonido from '../sonido';

let lista: Promise<Record<string, string>> | null = null;
let actual: HTMLAudioElement | null = null;
let turno = 0;

function disponibles() {
  lista ??= fetch('./voces/lista.json')
    .then((r) => (r.ok ? r.json() : {}))
    .then((l: unknown) => (l && typeof l === 'object' && !Array.isArray(l) ? (l as Record<string, string>) : {}))
    .catch(() => ({}));
  return lista;
}

/** Suena la línea `id` (si tiene audio) y corta la anterior. */
export async function oir(id: string | undefined) {
  const mio = ++turno;
  callar(false);
  if (!id || sonido.silenciado()) return;
  const archivo = (await disponibles())[id];
  if (!archivo || mio !== turno) return;
  const a = new Audio(`./voces/${archivo}`);
  actual = a;
  a.play().catch(() => {});
}

export function callar(todo = true) {
  if (todo) turno++;
  actual?.pause();
  actual = null;
}

/** Código de la línea i (desde 0) del recuerdo de la puerta dada: r005-01, r005-02… */
export const idRecuerdo = (puerta: number, i: number) => `r${String(puerta).padStart(3, '0')}-${String(i + 1).padStart(2, '0')}`;
