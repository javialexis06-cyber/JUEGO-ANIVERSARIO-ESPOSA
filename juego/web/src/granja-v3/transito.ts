import { celdaReservadaObra } from './construccion';
import type { EstadoGranja } from './estado';
import { ARTICULOS, CULTIVOS, type Zona } from './catalogo';
import { dentroDeZona } from './caminos-mundo';
import { aguaEn, huecoEn } from './paisaje';
import { librePueblo } from './pueblo-datos';
import { huellaProduccion } from './produccion';

/** Misma colisión exterior para personaje, compañeros y desembarco de monturas. */
export function celdaTransitable(s:EstadoGranja,x:number,z:number,zona:Zona=s.zona){
 if(!Number.isInteger(x)||!Number.isInteger(z)||!dentroDeZona(zona,x+.5,z+.5))return false;
 if(zona==='pueblo'&&!librePueblo(x+.5,z+.5,.18))return false;
 if(s.obstaculos.some(o=>(o.zona??'granja')===zona&&o.hp>0&&(zona!=='mina'||o.nivelMina===s.nivelMina)&&o.x===x&&o.z===z&&o.tipo!=='maleza'))return false;
 if(zona==='lago'&&((x-28)**2/13**2+(z-89)**2/10**2<1))return false;
 if(zona==='granja'){
  if(celdaReservadaObra(s,x,z,false))return false;
  if(aguaEn(s.paisaje,x,z)||huecoEn(s.paisaje,x,z)||s.frutales.some(f=>!f.edificioId&&f.x===x&&f.z===z))return false;
  if(s.parcelas.some(p=>p.x===x&&p.z===z&&p.cultivo&&p.cuidado?.status!=='arruinado'&&CULTIVOS.find(c=>c.id===p.cultivo)?.enrejado))return false;
  for(const n of [...s.produccion.cofres,...s.produccion.maquinas,...s.produccion.estructuras]){if(n.zona!==zona||n.articulo.startsWith('aspersor_'))continue;const p=huellaProduccion(n);if(x>=p.x&&x<p.x+p.ancho&&z>=p.z&&z<p.z+p.fondo)return false;}
  for(const b of s.edificios){const a=ARTICULOS.find(a=>a.id===b.articulo);if(!a||['suelo','valla'].includes(a.categoria))continue;const w=b.giro%2?a.fondo:a.ancho,d=b.giro%2?a.ancho:a.fondo,bx=b.x+(a.corral&&b.giro===1?a.corral:0),bz=b.z+(a.corral&&b.giro===2?a.corral:0);if(x>=bx&&x<bx+w&&z>=bz&&z<bz+d)return false;}
 }return true;
}
export function puntoTransitable(s:EstadoGranja,x:number,z:number,radio=.24,zona:Zona=s.zona){return Number.isFinite(x)&&Number.isFinite(z)&&[[-radio,-radio],[radio,-radio],[-radio,radio],[radio,radio]].every(([dx,dz])=>celdaTransitable(s,Math.floor(x+dx),Math.floor(z+dz),zona));}
