// Versión para amigos: reemplaza a `src/mesa/show/show.ts`, `cabina.ts` y `libro.ts` al compilar con
// `vite build --mode amigos`. El Show de Nosotros es un concurso de preguntas de la pareja: en la sala de amigos no
// sale en el menú y, si algo lo llama, no abre nada.
export interface OpcionesShow {
  alSalir: () => void;
}
export async function abrirShow(o: OpcionesShow) {
  o.alSalir();
}
export const llegaShow = (_id: string, _n: number, _m: unknown) => false;
export function salioShow(_id: string) {}
export const showAbierto = () => false;
export function atrasShow() {}
export async function abrirCabina(_yo: unknown, _modo: unknown): Promise<boolean> {
  return false;
}
export async function abrirLibro(_yo: unknown) {}
