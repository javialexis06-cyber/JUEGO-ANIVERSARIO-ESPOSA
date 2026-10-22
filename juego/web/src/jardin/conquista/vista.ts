import {AtlasPvZ} from '../pvz/arte/atlas';
import {ARTE_PLANTAS_PVZ,ARTE_ZOMBIS_PVZ,proteccionZombiPvZ,ropaZombiPvZ,type FiguraPvZ} from '../pvz/arte/catalogo';
import {FICHAS_CONQUISTA} from './catalogo';
import type {EstadoConquista,FrenteConquista,UnidadConquista} from './tipos';
export class VistaConquista {
 readonly canvas=document.createElement('canvas');private ctx:CanvasRenderingContext2D;private observer:ResizeObserver;private sx=1;private sy=1;
 constructor(private atlas:AtlasPvZ,private padre:HTMLElement){this.canvas.className='cq-canvas';this.canvas.setAttribute('aria-label','Tres carriles. Elige una carta y toca una casilla para intervenir.');this.canvas.tabIndex=0;padre.append(this.canvas);this.ctx=this.canvas.getContext('2d')!;this.observer=new ResizeObserver(()=>this.ajustar());this.observer.observe(padre);this.ajustar();}
 private ajustar(){const r=this.padre.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.max(1,Math.round(r.width*d));this.canvas.height=Math.max(1,Math.round(r.height*d));this.sx=r.width/1000;this.sy=r.height/500;this.ctx.setTransform(d*this.sx,0,0,d*this.sy,0,0);}
 punto(fila:number,col:number){const r=this.canvas.getBoundingClientRect();return{x:r.left+(110+col*88)*this.sx,y:r.top+(160+fila*115)*this.sy};}
 tocar(x:number,y:number){const r=this.canvas.getBoundingClientRect(),xx=(x-r.left)/this.sx,yy=(y-r.top)/this.sy,fila=Math.floor((yy-100)/115),col=Math.round((xx-110)/88);return fila>=0&&fila<3&&col>=0&&col<8?{fila,col}:null;}
 private figura(f:FiguraPvZ,x:number,y:number,alto=f.alto,giro=0,frio=false){const c=this.ctx,img=this.atlas.figura(f),w=Math.min(110,alto*img.width/img.height);c.save();c.translate(x,y);c.scale(this.sy/this.sx,1);c.rotate(giro);if(frio)c.filter='sepia(.4) hue-rotate(145deg)';c.drawImage(img,-w/2,-alto,w,alto);c.restore();}
 private unidad(u:UnidadConquista,s:EstadoConquista,f:FrenteConquista){const c=this.ctx,d=FICHAS_CONQUISTA[u.tipo],id=d.arte??u.tipo,y=205+u.fila*115+(d.rol==='vuelo'?-32:0),x=u.x;let figura:FiguraPvZ;
  if(u.bando==='plantas')figura=ARTE_PLANTAS_PVZ[id];else{const ropa=ropaZombiPvZ(u.id,String(f.zona)),proteccion=proteccionZombiPvZ(id,ropa);figura=proteccion&&u.armadura>0?proteccion.figura:ARTE_ZOMBIS_PVZ[id]??{hoja:'ropa',celda:proteccion?.ropa??ropa,alto:126};}
  if(!figura)return;const alto=figura.alto*(u.bando==='plantas'?.86:.77);c.fillStyle='#17322140';c.beginPath();c.ellipse(x,y,24,5,0,0,Math.PI*2);c.fill();
  if(d.fusion){c.strokeStyle='#eac553';c.lineWidth=3;c.beginPath();c.ellipse(x,y-2,31,9,0,0,Math.PI*2);c.stroke();}
  this.figura(figura,x,y,alto,Math.sin(s.t*(u.bando==='plantas'?2:5)+u.id)*.025,u.lento>0);
  if(d.fusion){c.fillStyle='#ffe8a6';c.font='bold 15px sans-serif';c.textAlign='center';c.fillText('F',x,y-alto-7);}
  const porcentaje=Math.max(0,u.vida/d.vida);if(porcentaje<.99||u.armadura>0){c.fillStyle='#182a20b0';c.fillRect(x-21,y+4,42,4);c.fillStyle=porcentaje>.4?'#b6dd6c':'#f09660';c.fillRect(x-21,y+4,42*porcentaje,4);if(u.armadura>0){c.fillStyle='#9acde1';c.fillRect(x-21,y+10,42*Math.min(1,u.armadura/Math.max(1,d.armadura)),3);}}
 }
 dibujar(s:EstadoConquista,f:FrenteConquista){const c=this.ctx,indice=f.zona%3===1?1:0,fondo=this.atlas.fondo(indice);c.clearRect(0,0,1000,500);const xs=[0,.23,.85,1],xd=[0,66,770,1000],ys=[0,.27,.98,1],yd=[0,100,445,500];for(let i=0;i<3;i++)for(let j=0;j<3;j++)c.drawImage(fondo.imagen,fondo.x+xs[i]*fondo.w,fondo.y+ys[j]*fondo.h,(xs[i+1]-xs[i])*fondo.w,(ys[j+1]-ys[j])*fondo.h,xd[i],yd[j],xd[i+1]-xd[i],yd[j+1]-yd[j]);c.fillStyle=indice?'#122c2a60':'#31522a28';c.fillRect(65,95,790,350);
  for(let fila=0;fila<3;fila++){for(let col=0;col<8;col++){c.fillStyle=col<=Math.floor(f.cabecera[fila])?'#9bce4f32':'#643d7830';c.fillRect(66+col*88,100+fila*115,86,113);c.strokeStyle='#e4ecbb44';c.lineWidth=1;c.strokeRect(66+col*88,100+fila*115,87,114);}c.strokeStyle='#e5ef9d';c.lineWidth=2;c.setLineDash([5,5]);const x=66+(Math.floor(f.cabecera[fila])+1)*88;c.beginPath();c.moveTo(x,103+fila*115);c.lineTo(x,210+fila*115);c.stroke();c.setLineDash([]);}
  for(const b of ['plantas','zombis'] as const){const x=b==='plantas'?34:931,fig=this.atlas.figura({hoja:'lugares',celda:b==='plantas'?5:4}),w=95,h=w*fig.height/fig.width;c.drawImage(fig,x-w/2,335-h,w,h);c.fillStyle='#18251c';c.fillRect(x-25,346,50,8);c.fillStyle=b==='plantas'?'#c1e282':'#ddb2e9';c.fillRect(x-25,346,50*Math.max(0,f.nucleos[b]/f.maximos[b]),8);}
  for(const u of [...f.unidades].sort((a,b)=>a.fila-b.fila||b.x-a.x))this.unidad(u,s,f);
  for(const p of f.balas){c.fillStyle=p.hielo?'#a0e5ff':p.dano>50?'#ffb349':'#b2e446';c.strokeStyle=p.hielo?'#557e9e':'#476632';c.lineWidth=2;c.beginPath();c.arc(p.x,174+p.fila*115,6,0,Math.PI*2);c.fill();c.stroke();}

 }
 destruir(){this.observer.disconnect();this.canvas.remove();this.canvas.width=1;this.canvas.height=1;}
}
