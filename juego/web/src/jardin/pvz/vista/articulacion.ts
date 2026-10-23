import type {AtlasPvZ} from '../arte/atlas';
import type {FiguraPvZ} from '../arte/catalogo';
type Punto=readonly[number,number];
// Coordenadas del retrato recortado: mano del primer plano y articulación de rodillas.
const brazo:readonly Punto[]=[[.58,.48],[.68,.50],[.60,.64],[.57,.72],[.47,.77],[.35,.73],[.37,.63],[.48,.58]];
export interface PoseZombiPvZ {alto:number;escala:number;aspecto:number;giro:number;espejo:boolean;paso:number;manos:number;sinBrazo:boolean;sinCabeza:boolean;filtro?:string;alfa:number}
export type ParteZombiPvZ='brazo'|'cabeza'|'casco';
export function trazarPartePvZ(c:CanvasRenderingContext2D,w:number,h:number,parte:ParteZombiPvZ,f:FiguraPvZ){
 if(parte==='brazo'){for(const [i,[x,y]]of brazo.entries()){const px=(x-.5)*w,py=(y-1)*h;if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.closePath();}
 else if(parte==='casco')c.rect(-w/2,-h,w,h*.27);
 else{const cabeza:readonly Punto[]=[[0,0],[.61,0],[.61,.16],[.54,.25],[.48,.37],[.17,.39],[0,.28]];for(const[i,[x,y]]of cabeza.entries()){if(i)c.lineTo((x-.5)*w,(y-1)*h);else c.moveTo((x-.5)*w,(y-1)*h);}c.closePath();}
}
/** Las piernas se alternan; la mano se articula sobre el cuerpo. Puertas y cascos
 * comparten el mismo marco del torso, de modo que no se separan al caminar. */
export function dibujarZombiArticuladoPvZ(c:CanvasRenderingContext2D,atlas:AtlasPvZ,f:FiguraPvZ,x:number,y:number,p:PoseZombiPvZ){
 const img=atlas.figura(f),h=p.alto*p.escala,w=Math.min(f.ancho??115,p.alto*img.width/img.height)*p.escala,ropa=f.hoja==='ropa';
 c.save();c.translate(x,y);c.scale(p.aspecto*(p.espejo?-1:1),1);c.rotate(p.giro);c.globalAlpha=p.alfa;if(p.filtro)c.filter=p.filtro;
 const dibujar=()=>c.drawImage(img,-w/2,-h,w,h);
 // Parte superior con máscara de mano; no se repinta el fondo ni se cambia el sprite fuente.
 c.save();c.beginPath();c.rect(-w/2,-h,w,h*.72);c.clip();
 if(ropa){c.beginPath();c.rect(-w/2,-h,w,h);trazarPartePvZ(c,w,h,'brazo',f);c.clip('evenodd');}
 if(p.sinCabeza){c.beginPath();c.rect(-w/2,-h,w,h);trazarPartePvZ(c,w,h,'cabeza',f);c.clip('evenodd');}dibujar();c.restore();
 for(let pierna=0;pierna<2;pierna++){
  const fase=p.paso*(pierna?-1:1),desde=pierna?.55:0,ancho=pierna?.45:.55;
  c.save();c.translate((desde+ancho/2-.5)*w,-h*.28);c.rotate(fase*.055);c.translate(-(desde+ancho/2-.5)*w,h*.28);
  c.translate(fase*1.8,Math.min(0,fase)*1.8);c.beginPath();c.rect((desde-.5)*w,-h*.28,w*ancho,h*.28+1);c.clip();dibujar();c.restore();
 }
 if(ropa&&!p.sinBrazo){
  c.save();const ax=.12*w,ay=-h*.49;c.translate(ax,ay);c.rotate(p.paso*.035+p.manos*.035);c.translate(-ax,-ay);
  c.beginPath();trazarPartePvZ(c,w,h,'brazo',f);c.clip();dibujar();c.restore();
 }
 c.restore();
}
export function dibujarParteZombiPvZ(c:CanvasRenderingContext2D,atlas:AtlasPvZ,f:FiguraPvZ,parte:ParteZombiPvZ,x:number,y:number,h:number,escala:number,aspecto:number,t:number,espejo=false){
 const img=atlas.figura(f),alto=h*escala,w=Math.min(f.ancho??115,h*img.width/img.height)*escala;
 c.save();c.translate(x+(espejo?-1:1)*t*26,y-30*t+90*t*t);c.scale(aspecto*(espejo?-1:1),1);c.globalAlpha=Math.max(0,1-Math.max(0,t-.7)/.7);
 const anclaY=parte==='brazo'?-alto*.35:-alto*.8;c.translate(0,anclaY);c.rotate(t*(parte==='brazo'?2:-2.4));c.translate(0,-anclaY);
 c.beginPath();trazarPartePvZ(c,w,alto,parte,f);c.clip();c.drawImage(img,-w/2,-alto,w,alto);c.restore();
}
