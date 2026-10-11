import type { EstadoGranja } from './estado';
import { ARTICULOS } from './catalogo';

/** La posición física acompaña la huella y el giro de la casa, sin alterar su puerta. */
export function posicionBuzon(s:EstadoGranja){const b=s.edificios.find(b=>b.id==='casa_inicial')??s.edificios.find(b=>ARTICULOS.find(a=>a.id===b.articulo)?.categoria==='casa');if(!b)return null;const a=ARTICULOS.find(a=>a.id===b.articulo)!;const h={ancho:b.giro%2?a.fondo:a.ancho,fondo:b.giro%2?a.ancho:a.fondo},p=b.giro===0?{x:b.x+h.ancho/2,z:b.z+h.fondo+.5}:b.giro===1?{x:b.x-.5,z:b.z+h.fondo/2}:b.giro===2?{x:b.x+h.ancho/2,z:b.z-.5}:{x:b.x+h.ancho+.5,z:b.z+h.fondo/2};const t=b.giro*Math.PI/2;return {x:p.x-1.6*Math.cos(t)+.3*Math.sin(t),z:p.z+1.6*Math.sin(t)+.3*Math.cos(t)};}
export function cercaBuzon(s:EstadoGranja,x:number,z:number){const p=posicionBuzon(s);return !!p&&s.zona==='granja'&&!s.interior&&!s.servicio&&!s.aventura.destinoActual&&Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x-p.x,z-p.z)<=2.4;}
