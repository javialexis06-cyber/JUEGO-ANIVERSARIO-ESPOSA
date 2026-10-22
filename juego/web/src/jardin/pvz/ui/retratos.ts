import {AtlasPvZ} from '../arte/atlas';
import {ARTE_PLANTAS_PVZ,ARTE_ZOMBIS_PVZ,proteccionZombiPvZ,type FiguraPvZ} from '../arte/catalogo';
/** Retratos derivados de los mismos atlas que se dibujan durante la partida. */
export class RetratosPvZ {
 private cache=new Map<string,string>();
 constructor(private atlas:AtlasPvZ){}
 planta(id:string){const k='planta:'+id,anterior=this.cache.get(k);if(anterior)return anterior;const salida=this.atlas.miniatura(ARTE_PLANTAS_PVZ[id]);this.cache.set(k,salida);return salida;}
 objeto(celda:number){const k='objeto:'+celda,anterior=this.cache.get(k);if(anterior)return anterior;const salida=this.atlas.miniatura({hoja:'objetos',celda});this.cache.set(k,salida);return salida;}
 zombi(id:string,ropa=0){const k=id+':'+ropa,cache=this.cache.get(k);if(cache)return cache;
  const c=document.createElement('canvas');c.width=160;c.height=200;const ctx=c.getContext('2d')!;
  const figura=(f:FiguraPvZ,x:number,y:number,alto:number,ancho?:number)=>{const s=this.atlas.figura(f),w=ancho??Math.min(145,alto*s.width/s.height);ctx.drawImage(s,x-w/2,y-alto,w,alto);};
  figura(proteccionZombiPvZ(id,ropa)?.figura??ARTE_ZOMBIS_PVZ[id]??{hoja:'ropa',celda:ropa,alto:162},80,192,id==='zombi-globo'?190:178);
  if(id.includes('flotador')){ctx.strokeStyle='#9a652c';ctx.fillStyle='#f7bb46';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(80,157,40,16,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
  if(id==='zombi-bandera'){ctx.strokeStyle='#6a492b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(121,165);ctx.lineTo(121,5);ctx.stroke();ctx.fillStyle='#c8493e';ctx.beginPath();ctx.moveTo(122,6);ctx.lineTo(158,14);ctx.lineTo(153,48);ctx.lineTo(122,42);ctx.closePath();ctx.fill();}
  const salida=c.toDataURL('image/png');this.cache.set(k,salida);return salida;
 }
 destruir(){this.cache.clear();}
}
