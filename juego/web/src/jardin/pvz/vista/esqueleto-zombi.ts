import type {AtlasPvZ} from '../arte/atlas';
export const usaEsqueletoZombiPvZ=(tipo:string)=>['zombi','zombi-bandera','caracono','caracubo','zombi-flotador','caracono-flotador','caracubo-flotador'].includes(tipo);
export interface PoseEsqueletoPvZ {alto:number;escala:number;aspecto:number;espejo:boolean;fase:number;quieto:boolean;muerde:boolean;sinBrazo:boolean;sinCabeza:boolean;casco:''|'cono'|'cubo';ropa:number;filtro?:string;alfa:number}
const TINTES=['','hue-rotate(155deg) saturate(.6)','hue-rotate(55deg) saturate(.7)','hue-rotate(335deg) saturate(.8)','hue-rotate(25deg)','hue-rotate(12deg) saturate(1.7)','saturate(.18) brightness(1.3)','hue-rotate(320deg) saturate(.6) brightness(.8)'];
/** Piezas dibujadas independientemente, con hombros/codos/caderas/rodillas.
 * Los ciclos son de presentación; nunca cambian posiciones, mordidas o relojes de combate. */
export function dibujarEsqueletoZombiPvZ(c:CanvasRenderingContext2D,a:AtlasPvZ,x:number,y:number,p:PoseEsqueletoPvZ){
 const escala=p.alto*p.escala/(p.casco==='cono'?221:p.casco==='cubo'?207:180),fase=p.fase,seno=p.quieto?0:Math.sin(fase),mordida=p.muerde&&!p.quieto?Math.sin(fase*1.8):0;
 c.save();c.translate(x,y);c.scale(escala*p.aspecto*(p.espejo?-1:1),escala);c.globalAlpha=p.alfa;
 const filtro=(ropa=false)=>[p.filtro,ropa?TINTES[p.ropa%TINTES.length]:''].filter(Boolean).join(' ')||'none';
 const pieza=(i:number,xx:number,yy:number,w:number,h:number,ropa=false)=>{c.filter=filtro(ropa&&i!==3&&i!==5);c.drawImage(a.piezaZombi(i),xx,yy,w,h);if(ropa&&(i===3||i===5)&&TINTES[p.ropa%TINTES.length]){c.save();c.beginPath();c.rect(xx,yy,w,h*.32);c.clip();c.filter=filtro(true);c.drawImage(a.piezaZombi(i),xx,yy,w,h);c.restore();}};
 const pierna=(cerca:boolean)=>{const f=fase+(cerca?0:Math.PI),s=p.quieto||p.muerde?0:Math.sin(f),muslo=s*.22-.04,rodilla=p.quieto||p.muerde?.08:Math.max(0,-Math.sin(f+.4))*.5+.08;
  c.save();c.translate(cerca?15:0,-61);c.rotate(muslo);pieza(cerca?6:8,-11,-3,24,39);c.translate(0,29);c.rotate(-rodilla);pieza(cerca?7:9,-28,-4,44,41);c.restore();};
 const brazo=(cerca:boolean)=>{if(cerca&&p.sinBrazo)return;const f=seno*(cerca?1:-1),superior=.20+f*.12+mordida*.1,inferior=.55+f*.18+mordida*.22;
  c.save();c.translate(cerca?25:-6,-111+Math.abs(seno));c.rotate(superior);pieza(cerca?2:4,-10,-3,23,40,true);c.translate(0,30);c.rotate(inferior);pieza(cerca?3:5,-16,-3,29,45,true);c.restore();};
 pierna(false);brazo(false);c.save();c.translate(0,-Math.abs(seno)*1.5);c.rotate(seno*.018);c.save();c.beginPath();const contorno=[[0,0],[.6,0],[.63,.3],[.58,.6],[.75,.97],[.44,1],[.09,.96],[0,.52]];for(const[i,[xx,yy]]of contorno.entries()){const px=-24+xx*80,py=-124+yy*74;if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.closePath();c.clip();pieza(1,-24,-124,80,74,true);c.restore();
 pierna(true);brazo(true);
 if(!p.sinCabeza){c.save();c.translate(-2,-120);c.rotate(seno*.035+mordida*.07);pieza(0,-38,-58,68,66);if(p.casco)pieza(p.casco==='cono'?10:11,-38,p.casco==='cono'?-101:-90,76,p.casco==='cono'?65:52);c.restore();}
 c.restore();c.restore();
}
export function dibujarRestoEsqueletoPvZ(c:CanvasRenderingContext2D,a:AtlasPvZ,parte:'brazo'|'cabeza'|'casco',x:number,y:number,alto:number,escala:number,aspecto:number,t:number,espejo:boolean,casco:'cono'|'cubo'='cono'){
 const s=alto*escala/180;c.save();c.translate(x+(espejo?-1:1)*t*27,y-25*t+90*t*t);c.scale(aspecto*(espejo?-1:1)*s,s);c.globalAlpha=Math.max(0,1-Math.max(0,t-.7)/.7);c.translate(parte==='brazo'?13:-2,parte==='brazo'?-97:-146);c.rotate(t*(parte==='brazo'?2:-2.4));
 const pieza=(i:number,x:number,y:number,w:number,h:number)=>c.drawImage(a.piezaZombi(i),x,y,w,h);
 if(parte==='cabeza')pieza(0,-34,-30,68,66);else if(parte==='casco')pieza(casco==='cono'?10:11,-38,-58,76,casco==='cono'?83:68);else{pieza(2,-10,-3,23,40);c.translate(0,30);c.rotate(.55);pieza(3,-16,-3,29,45);}c.restore();
}
