// Escenario de la mesa: los dos muñequitos arriba del tablero, con su marcador, y sus reacciones.
import type { Rol } from '../casa/modelo';
import type { Final, Suceso } from './tipos';

export class Escenario {
  private yo: Rol = 'el';

  constructor(private lienzo: HTMLCanvasElement, private efectos: HTMLElement, private rapido = 1) {}

  /** Carga a los dos personajes (una vez) y los pone en su lado: el de este celular a la izquierda. */
  async preparar(yo: Rol) {
    this.yo = yo;
    const izq = yo, der: Rol = yo === 'el' ? 'ella' : 'el';
    const marc = document.querySelectorAll<HTMLElement>('.marcador');
    marc[0].dataset.quien = izq;
    marc[1].dataset.quien = der;
    marc[0].querySelector('.marcador-nombre')!.textContent = izq === 'el' ? 'Él' : 'Ella';
    marc[1].querySelector('.marcador-nombre')!.textContent = der === 'el' ? 'Él' : 'Ella';
    void this.lienzo;
    void this.efectos;
    void this.rapido;
  }

  async inicio(_empieza: Rol) {}
  turno(t: Rol, _humanoAqui: boolean) {
    for (const m of document.querySelectorAll<HTMLElement>('.marcador')) m.classList.toggle('activo', m.dataset.quien === t);
  }
  pensar(_quien: Rol, _si: boolean) {}
  suceso(_s: Suceso) {}
  adelante(_quien: Rol) {}
  marcador(p: Record<Rol, number>) {
    for (const m of document.querySelectorAll<HTMLElement>('.marcador')) m.querySelector('.marcador-puntos')!.textContent = String(p[m.dataset.quien as Rol] ?? 0);
  }
  async final(_f: Final) {}
}
