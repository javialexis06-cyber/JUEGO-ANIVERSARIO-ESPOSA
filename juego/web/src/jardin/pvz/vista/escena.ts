import type {MotorPvZ} from '../motor/motor';
import type {EventoPvZ,PlantaPvZ,ZombiPvZ,SolPvZ,NieblaPvZ} from '../tipos';
import {AtlasPvZ} from '../arte/atlas';
import {ARTE_PLANTAS_PVZ,ARTE_ZOMBIS_PVZ,ropaZombiPvZ,proteccionZombiPvZ,type FiguraPvZ} from '../arte/catalogo';
import {dibujarZombiArticuladoPvZ,dibujarParteZombiPvZ,type ParteZombiPvZ} from './articulacion';
import {ZOMBIS_PVZ} from '../datos/zombis';
import {TABLERO_PVZ,geometriaPvZ,escalaVerticalPvZ} from './geometria';
export {TABLERO_PVZ} from './geometria';
type Resto={figura:FiguraPvZ;parte:ParteZombiPvZ;x:number;y:number;alto:number;inicio:number;espejo:boolean};
type Efecto={tipo:string;x:number;y:number;inicio:number;vida:number};
export interface ToquePvZ {fila:number;col:number;sol?:number;jarron?:number;zombi?:number}
/** La vista observa el motor. Nunca avanza relojes, sortea contenido ni cambia entidades. */
export class EscenaPvZ {
 readonly canvas=document.createElement('canvas');private ctx:CanvasRenderingContext2D;private efectos:Efecto[]=[];private restos:Resto[]=[];
 private observador:ResizeObserver;private escalaX=1;private escalaY=1;private ancho=0;private alto=0;
 private muerto=false;private cacheFondo:HTMLCanvasElement|null=null;private firmaFondo='';
 private resaltada:{fila:number;col:number}|null=null;
 private mascaraNiebla=document.createElement('canvas');
 private motorActual:MotorPvZ|null=null;
 constructor(readonly atlas:AtlasPvZ,private contenedor:HTMLElement){
  this.canvas.setAttribute('aria-label','Campo de plantas y zombis. Elige una semilla y toca una casilla.');this.canvas.setAttribute('role','img');this.canvas.tabIndex=0;this.canvas.className='pvz-campo';
  const ctx=this.canvas.getContext('2d');if(!ctx)throw Error('No se pudo abrir el lienzo');this.ctx=ctx;contenedor.append(this.canvas);
  this.mascaraNiebla.width=1100;this.mascaraNiebla.height=650;
  this.observador=new ResizeObserver(()=>this.ajustar());this.observador.observe(contenedor);this.ajustar();
 }
 private ajustar(){const r=this.contenedor.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);this.ancho=Math.max(1,r.width);this.alto=Math.max(1,r.height);this.canvas.width=Math.round(this.ancho*dpr);this.canvas.height=Math.round(this.alto*dpr);this.escalaX=this.ancho/TABLERO_PVZ.ancho;this.escalaY=this.alto/TABLERO_PVZ.alto;this.ctx.setTransform(dpr*this.escalaX,0,0,dpr*this.escalaY,0,0);}
 punto(x:number,fila:number,m:MotorPvZ){const r=this.canvas.getBoundingClientRect();return{x:r.left+(TABLERO_PVZ.x+x)*this.escalaX,y:r.top+(TABLERO_PVZ.y+(m.centroFila(fila)*escalaVerticalPvZ(m)))*this.escalaY};}
 puntoSol(s:SolPvZ,m:MotorPvZ){const r=this.canvas.getBoundingClientRect(),q=this.posicionSol(s,m);return{x:r.left+q.x*this.escalaX,y:r.top+q.y*this.escalaY};}
 private posicionSol(s:SolPvZ,m:MotorPvZ){const y=TABLERO_PVZ.y+(m.centroFila(s.fila)*escalaVerticalPvZ(m))-20;return{x:TABLERO_PVZ.x+s.x,y:s.origen==='cielo'?y-Math.max(0,1-s.edad/.8)*90:y-Math.sin(Math.min(1,s.edad/.45)*Math.PI)*18};}
 tocar(clientX:number,clientY:number,m:MotorPvZ):ToquePvZ|null{
  const r=this.canvas.getBoundingClientRect(),x=(clientX-r.left)/this.escalaX,y=(clientY-r.top)/this.escalaY;
  for(const s of [...m.soles].reverse()){const q=this.posicionSol(s,m);if(Math.hypot(x-q.x,y-q.y)<30)return{fila:s.fila,col:Math.floor(s.x/80),sol:s.id};}
  if(m.nivel.minijuego==='aplastazombis'){const z=m.zombis.find(z=>z.vida>0&&!z.hipnotizado&&Math.abs(x-TABLERO_PVZ.x-z.x)<32&&y>TABLERO_PVZ.y+(m.centroFila(z.fila)*escalaVerticalPvZ(m))-90&&y<TABLERO_PVZ.y+(m.centroFila(z.fila)*escalaVerticalPvZ(m))+35);if(z)return{fila:z.fila,col:Math.max(0,Math.min(8,Math.floor(z.x/80))),zombi:z.id};}
  const fila=Math.floor((y-TABLERO_PVZ.y)/(m.altoFila*escalaVerticalPvZ(m))),col=Math.floor((x-TABLERO_PVZ.x)/80);if(!m.casilla(fila,col))return null;
  const jarron=m.jarrones.find(j=>j.fila===fila&&j.col===col)?.id;
  const zombi=m.zombis.filter(z=>z.fila===fila&&z.vida>0&&!z.hipnotizado&&Math.abs(x-TABLERO_PVZ.x-z.x)<35).sort((a,b)=>a.x-b.x)[0]?.id;
  return{fila,col,jarron,zombi};
 }
 resaltar(q:{fila:number;col:number}|null){this.resaltada=q;}
 private prepararMotor(m:MotorPvZ){
  if(this.motorActual!==m){this.efectos=[];this.restos=[];this.resaltada=null;this.motorActual=m;}
  const g=geometriaPvZ(m);this.ultimoAltoFila=g.altoFila;this.escalaFiguras=g.escalaFiguras;
 }
 eventos(eventos:readonly EventoPvZ[],tiempo:number,m?:MotorPvZ){
  if(m)this.prepararMotor(m);
  for(const e of eventos){if(e.fila===undefined||e.x===undefined)continue;
   if(m&&['pierdeBrazo','pierdeCabeza','pierdeArmadura'].includes(e.t)&&e.tipo&&Object.hasOwn(ZOMBIS_PVZ,e.tipo)){
    const ropa=ropaZombiPvZ(e.id??0,m.nivel.id),equipo=proteccionZombiPvZ(e.tipo,ropa),parte:ParteZombiPvZ=e.t==='pierdeBrazo'?'brazo':e.t==='pierdeCabeza'?'cabeza':'casco';
    const figura=parte==='casco'?equipo?.figura:ARTE_ZOMBIS_PVZ[e.tipo]??{hoja:'ropa' as const,celda:equipo?.ropa??ropa,alto:126};
    if(figura&&(parte!=='casco'||e.tipo.includes('cono')||e.tipo.includes('cubo')))this.restos.push({figura,parte,x:TABLERO_PVZ.x+e.x,y:TABLERO_PVZ.y+(e.fila+.5)*this.ultimoAltoFila+33,alto:figura.alto,inicio:tiempo,espejo:m.zombis.find(z=>z.id===e.id)?.sentido===1});
   }
   if(['explosion','muere','siembra','impacto','pierdeArmadura','jarron'].includes(e.t))this.efectos.push({tipo:e.t,x:TABLERO_PVZ.x+e.x,y:TABLERO_PVZ.y+(e.fila+.5)*this.ultimoAltoFila,inicio:tiempo,vida:e.t==='explosion'?.65:e.t==='siembra'?.3:.22});
  }if(this.restos.length>40)this.restos.splice(0,this.restos.length-40);if(this.efectos.length>100)this.efectos.splice(0,this.efectos.length-100);
 }
 private ultimoAltoFila=92;private escalaFiguras=1;
 private dibujarFondo(m:MotorPvZ){
  const indice=m.nivel.area==='niebla'?3:m.nivel.area==='piscina'?2:m.esNoche?1:0,firma=indice+':'+m.nivel.filas.join(',')+':'+m.filas+':'+(m.nivel.tablero?'nuevo':'original')+':'+m.nivel.filasAgua?.join(',');
  if(firma!==this.firmaFondo){
   const c=document.createElement('canvas');c.width=1100;c.height=650;const ctx=c.getContext('2d')!,f=this.atlas.fondo(indice);
   // Ajustar las franjas del fondo al tablero mantiene tierra y agua bajo sus carriles reales.
   const xs=[0,.23,.85,1],xd=[0,TABLERO_PVZ.x,TABLERO_PVZ.x+720,1100],g=geometriaPvZ(m);
   const franja=(imagen:typeof f,desde:number,hasta:number,y:number,alto:number)=>{
    for(let i=0;i<xs.length-1;i++)ctx.drawImage(imagen.imagen,imagen.x+xs[i]*imagen.w,imagen.y+desde*imagen.h,(xs[i+1]-xs[i])*imagen.w,(hasta-desde)*imagen.h,xd[i],y,xd[i+1]-xd[i],alto);
   };
   if(!m.nivel.tablero){
    const ys=indice>=2?[0,.27,.43,.65,.98,1]:[0,.27,.98,1],yd=indice>=2?[0,TABLERO_PVZ.y,TABLERO_PVZ.y+170*g.escalaY,TABLERO_PVZ.y+340*g.escalaY,TABLERO_PVZ.y+510*g.escalaY,650]:[0,TABLERO_PVZ.y,TABLERO_PVZ.y+g.alto,650];
    for(let j=0;j<ys.length-1;j++)franja(f,ys[j],ys[j+1],yd[j],yd[j+1]-yd[j]);
   }else{
    // La casa y la calle conservan una perspectiva continua; solo cambia el terreno interior.
    const tierra=this.atlas.fondo(m.esNoche?1:0);
    franja(tierra,0,.27,0,TABLERO_PVZ.y);franja(tierra,.27,.98,TABLERO_PVZ.y,g.alto);
    for(let fila=0;fila<m.filas;fila++){
     if(m.esAgua(fila)){const agua=this.atlas.fondo(m.esNoche?3:2);ctx.drawImage(agua.imagen,agua.x+.23*agua.w,agua.y+.43*agua.h,.62*agua.w,.22*agua.h,TABLERO_PVZ.x,TABLERO_PVZ.y+fila*g.altoFila,720,g.altoFila);}
    }
    franja(tierra,.98,1,TABLERO_PVZ.y+g.alto,650-TABLERO_PVZ.y-g.alto);
   }
   for(let fila=0;fila<m.filas;fila++){
    const agua=m.esAgua(fila),y=TABLERO_PVZ.y+fila*m.altoFila*escalaVerticalPvZ(m);
    ctx.fillStyle=!m.nivel.filas.includes(fila)?'rgba(12,30,24,.59)':agua?'rgba(26,163,192,.32)':fila%2?'rgba(34,78,30,.13)':'rgba(184,222,101,.1)';ctx.fillRect(TABLERO_PVZ.x,y,720,m.altoFila*escalaVerticalPvZ(m));
    ctx.strokeStyle=agua?'rgba(194,246,250,.30)':'rgba(75,110,38,.32)';ctx.lineWidth=1;
    for(let col=0;col<9;col++)ctx.strokeRect(TABLERO_PVZ.x+col*80+.5,y+.5,79,m.altoFila*escalaVerticalPvZ(m)-1);
   }
   this.cacheFondo=c;this.firmaFondo=firma;
  }this.ctx.drawImage(this.cacheFondo!,0,0);
  const ctx=this.ctx;for(const fila of m.nivel.filas.filter(f=>m.esAgua(f)))for(let j=0;j<9;j++){
   ctx.strokeStyle=m.esNoche?'rgba(132,224,231,.12)':'rgba(218,255,255,.25)';ctx.lineWidth=2;ctx.beginPath();const x=TABLERO_PVZ.x+j*80+30+Math.sin(m.t*.8+j)*7,y=TABLERO_PVZ.y+fila*m.altoFila*escalaVerticalPvZ(m)+(m.nivel.tablero?m.altoFila*escalaVerticalPvZ(m)*.7:55);ctx.ellipse(x,y,19,2,0,0,Math.PI*2);ctx.stroke();
  }
 }
 private vidaEscenario(m:MotorPvZ){
  const c=this.ctx,g=geometriaPvZ(m),t=m.t;
  // Detalles acotados y sin azar de combate: congelan su movimiento con la pausa global.
  for(const fila of m.nivel.filas){if(m.esAgua(fila))continue;
   for(let j=0;j<8;j++){const x=TABLERO_PVZ.x+j*89+14+(fila*13%27),y=TABLERO_PVZ.y+(fila+.88)*g.altoFila,viento=Math.sin(t*1.5+j*.8+fila)*3;
    c.strokeStyle=m.esNoche?'rgba(93,137,96,.45)':'rgba(58,112,37,.45)';c.lineWidth=1.2;
    for(let k=-1;k<=1;k++){c.beginPath();c.moveTo(x+k*2,y);c.quadraticCurveTo(x+k*2+viento*.5,y-4,x+k*4+viento,y-7-Math.sin(j+fila+k)*2);c.stroke();}
   }
  }
  for(let i=0;i<5;i++){
   const x=170+i*154+Math.sin(t*.32+i*1.7)*25,y=113+Math.sin(t*.6+i)*11;
   if(m.esNoche){const r=2+Math.sin(t*2+i)*.6,l=c.createRadialGradient(x,y,0,x,y,r*5);l.addColorStop(0,'rgba(236,249,144,.75)');l.addColorStop(1,'rgba(236,249,144,0)');c.fillStyle=l;c.fillRect(x-r*5,y-r*5,r*10,r*10);}
   else{const a=Math.abs(Math.sin(t*7+i));c.fillStyle=i%2?'#f0cf79':'#d8b5ed';c.beginPath();c.ellipse(x-3*a,y,3*a+.6,4,.4,0,Math.PI*2);c.ellipse(x+3*a,y,3*a+.6,4,-.4,0,Math.PI*2);c.fill();c.fillStyle='#65583d';c.fillRect(x-.7,y-2,1.4,4);}
  }
  for(let i=0;i<4;i++){
   const x=110+(t*(4+i*.5)+i*179)%830,y=632+Math.sin(i)*3;c.strokeStyle=m.esNoche?'#364138':'#51482b';c.fillStyle=c.strokeStyle;c.lineWidth=.6;
   for(let k=-1;k<=1;k++){c.beginPath();c.moveTo(x+k,y);c.lineTo(x+k+Math.sin(t*12+i+k),y-2);c.moveTo(x+k,y);c.lineTo(x+k-Math.sin(t*12+i+k),y+2);c.stroke();}c.beginPath();c.ellipse(x,y,2,.85,0,0,Math.PI*2);c.fill();
  }
 }
 private sombra(x:number,y:number,w:number,agua=false){const c=this.ctx;c.fillStyle=agua?'rgba(8,71,90,.24)':'rgba(27,43,20,.22)';c.beginPath();c.ellipse(x,y,w,6,0,0,Math.PI*2);c.fill();}
 private figura(f:FiguraPvZ,x:number,y:number,op:{alto?:number;ancho?:number;giro?:number;espejo?:boolean;alfa?:number;cabeza?:boolean;recoil?:number;camina?:number;filtro?:string}={}){
  const c=this.ctx,img=this.atlas.figura(f),h=(op.alto??f.alto)*this.escalaFiguras,w=(op.ancho??Math.min(f.ancho??115,(op.alto??f.alto)*img.width/img.height))*this.escalaFiguras,aspecto=this.escalaY/this.escalaX;
  c.save();c.translate(x,y);c.scale(aspecto*(op.espejo?-1:1),1);c.rotate(op.giro??0);c.globalAlpha=op.alfa??1;if(op.filtro)c.filter=op.filtro;
  if(op.cabeza===false){const corte=Math.floor(img.height*.37);c.drawImage(img,0,corte,img.width,img.height-corte,-w/2,-h+h*.37,w,h*.63);}
  else if(op.recoil){const corte=Math.floor(img.height*.72);c.drawImage(img,0,corte,img.width,img.height-corte,-w/2,-h*.28,w,h*.28);c.translate(-op.recoil,0);c.drawImage(img,0,0,img.width,corte,-w/2,-h,w,h*.72);}
  else if(op.camina){const corte=Math.floor(img.height*.72);c.drawImage(img,0,0,img.width,corte,-w/2,-h+Math.abs(op.camina)*.3,w,h*.72);c.drawImage(img,0,corte,img.width,img.height-corte,-w/2+op.camina,-h*.28,w,h*.28);}
  else c.drawImage(img,-w/2,-h,w,h);
  c.restore();
 }
 private planta(p:PlantaPvZ,m:MotorPvZ){
  const f=ARTE_PLANTAS_PVZ[p.tipo];if(!f)return;const c=this.ctx,x=TABLERO_PVZ.x+p.x,y=TABLERO_PVZ.y+(m.centroFila(p.fila)*escalaVerticalPvZ(m))+28;
  const atacar=Math.max(0,(p.datos.atacaHasta??0)-m.t),respira=Math.sin(m.t*2.5+p.id*1.7),vida=p.vida/m.plantasDef[p.tipo].vida;
  let h=f.alto,baseY=y,giro=respira*(atacar?.012:.04),alfa=1;
  if(p.tipo==='seta-solar'&&!p.datos.crecida)h*=.65;
  if(p.tipo==='patatapum'&&p.edad<14){h*=.6;alfa=.8;}
  if(p.tipo==='cactus'&&p.datos.alto)h*=1.15;
  if(p.tipo==='seta-miedica'&&p.datos.asustada){h*=.62;giro=0;}
  if(p.tipo==='aplastaflor'&&p.datos.enAire){const t=Math.min(1,Math.max(0,(m.t-p.datos.activada-1.26)/.56));baseY-=Math.sin(t*Math.PI)*95;this.figura(f,x+((p.datos.destinoX??p.x)-p.x)*t,baseY,{alto:h,giro:-t*.25});return;}
  if(p.tipo==='trebolador')giro=p.datos.soplo?(m.t*8):respira*.06;
  if(p.capa!=='cubierta')this.sombra(x,y-1,p.capa==='base'?31:25,m.esAgua(p.fila));
  if(p.tipo==='planterna'&&!p.dormida){const g=c.createRadialGradient(x,y-45,5,x,y-45,65);g.addColorStop(0,'rgba(255,224,97,.35)');g.addColorStop(1,'rgba(255,224,97,0)');c.fillStyle=g;c.fillRect(x-65,y-110,130,130);}
  this.figura(f,x,baseY,{alto:h+respira*1.3,giro,alfa:alfa*(p.dormida?.72:1),recoil:atacar?Math.sin(Math.min(1,atacar/.2)*Math.PI)*5:0,filtro:p.dormida?'saturate(.5) brightness(.75)':p.congelada?'sepia(.4) hue-rotate(150deg)':vida<.35?'saturate(.7) brightness(.83)':undefined});
  if(p.dormida){c.fillStyle='#d8d7ef';c.font='bold 15px sans-serif';c.fillText('z',x+16,y-h+6);}
  if(p.tipo==='patatapum'&&p.edad<14){c.fillStyle='#e6b65d';c.beginPath();c.arc(x,y-22,4,0,Math.PI*2);c.fill();}
  if(vida<.65){c.fillStyle='rgba(71,43,24,.62)';c.beginPath();c.moveTo(x-6,y-h*.7);c.lineTo(x+2,y-h*.54);c.lineTo(x-4,y-h*.37);c.lineTo(x+7,y-h*.2);c.strokeStyle='#563b24';c.lineWidth=2;c.stroke();}
 }
 private zombi(z:ZombiPvZ,m:MotorPvZ){
  const ctx=this.ctx,ropa=ropaZombiPvZ(z.id,m.nivel.id),proteccion=proteccionZombiPvZ(z.tipo,ropa),base:FiguraPvZ={hoja:'ropa',celda:proteccion?.ropa??ropa,alto:126};
  let f=proteccion&&z.armadura>0?proteccion.figura:ARTE_ZOMBIS_PVZ[z.tipo]??base,h=f.alto,x=TABLERO_PVZ.x+z.x,y=TABLERO_PVZ.y+(m.centroFila(z.fila)*escalaVerticalPvZ(m))+33;
  if(z.datos.intocableTrineo)return;
  if(z.tipo==='zombi-trineo'&&!z.datos.enTrineo)f=base;
  if(z.tipo==='saltador'&&z.datos.saltoUsado)f=base;
  if(z.tipo==='zombi-cajita'&&!z.datos.caja)f={...base,celda:6};
  if(z.tipo==='zombi-minero'&&z.datos.sinPico)f={...base,celda:4};
  if(z.tipo==='zombi-pogo'&&!z.datos.pogo)f={...base,celda:7};
  if(z.tipo==='zombi-globo'&&!m.esVolador(z))f={...base,celda:1};
  if(z.tipo==='zombi-futbolista'&&z.armadura<=0)f={...base,celda:7};
  h=f.alto*(z.datos.escala??1);
  if(z.datos.bajoTierra){
   const sale=z.datos.emergiendoHasta&&m.t>(z.datos.pausaPicoHasta??0),avance=sale?Math.max(0,1-(z.datos.emergiendoHasta-m.t)/1.3):0;
   ctx.fillStyle='#5f4b34';for(let j=0;j<5;j++){ctx.beginPath();ctx.ellipse(x-18+j*9,y-4,7,3+Math.sin(j+m.t*10),0,0,Math.PI*2);ctx.fill();}
   if(avance>0){ctx.save();ctx.beginPath();ctx.rect(x-70,y-h*avance,140,h*avance);ctx.clip();this.figura(f,x,y,{alto:h});ctx.restore();}return;
  }
  if(z.datos.sumergido&&!z.comiendo){ctx.strokeStyle='#b3eff2';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-7,y-18);ctx.lineTo(x-7,y-48);ctx.lineTo(x+3,y-48);ctx.stroke();this.sombra(x,y,18,true);return;}
  const volando=m.esVolador(z),salto=z.datos.pogo?Math.abs(Math.sin((m.t+(z.id%7)*.1)*Math.PI/.8))*25:z.datos.saltando>m.t?30:0;
  if(volando)y-=12+Math.sin(m.t*2+z.id)*6;else y-=salto;
  this.sombra(x,TABLERO_PVZ.y+(m.centroFila(z.fila)*escalaVerticalPvZ(m))+33,volando?16:24,m.esAgua(z.fila));
  const congelado=z.congelado>0||z.mantequilla>0||z.datos.mareoHasta>m.t,paso=congelado?0:Math.sin(z.edad*(z.lento?3:6)+z.id),giro=congelado?0:z.comiendo!==null?Math.sin(z.edad*11)*.035:paso*.025;
  const filtro=z.ceniza?'brightness(.13)':z.hipnotizado?'sepia(.5) hue-rotate(235deg) saturate(1.7)':z.lento||z.congelado?'sepia(.45) hue-rotate(145deg) saturate(1.4)':undefined;
  // Los diseños equipados oscilan enteros: no cortar una puerta ni desplazar su casco por separado.
  if(f.hoja==='ropa'||f.hoja==='protegidos')dibujarZombiArticuladoPvZ(ctx,this.atlas,f,x,y,{alto:h,escala:this.escalaFiguras,aspecto:this.escalaY/this.escalaX,giro,espejo:z.sentido===1,paso:z.comiendo===null?paso:0,manos:congelado?0:z.comiendo!==null?Math.sin(z.edad*11):0,sinBrazo:z.sinBrazo,sinCabeza:z.sinCabeza,filtro,alfa:z.datos.arrastrado?.45:1});
  else this.figura(f,x,y,{alto:h,giro,espejo:z.sentido===1,cabeza:!z.sinCabeza,filtro,alfa:z.datos.arrastrado?.45:1});
  if(proteccion&&z.armadura>0&&z.armadura<z.armaduraInicial*.72){
   const dano=1-z.armadura/z.armaduraInicial,casco=z.tipo.includes('cono')||z.tipo.includes('cubo'),s=this.escalaFiguras;
   ctx.save();ctx.translate(x,y);ctx.scale(this.escalaY/this.escalaX*(z.sentido===1?-1:1),1);ctx.rotate(giro);ctx.strokeStyle=z.tipo.includes('cono')?'#70452f':'#606162';ctx.lineWidth=1.5*s;
   for(let i=0;i<(dano>.65?3:1);i++){const xx=(-12+i*10)*s,yy=-h*s*(casco?.88:.49);ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+6*s,yy+5*s);ctx.lineTo(xx+2*s,yy+10*s);ctx.lineTo(xx+9*s,yy+15*s);ctx.stroke();}
   ctx.restore();
  }
  if(m.esAgua(z.fila)&&['zombi-flotador','caracono-flotador','caracubo-flotador','zombi-bandera'].includes(z.tipo)){
   ctx.fillStyle='#eeaf40';ctx.strokeStyle='#624527';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y-25,31,13,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#6bd4df';ctx.beginPath();ctx.ellipse(x,y-28,19,6,0,0,Math.PI*2);ctx.fill();
  }
  if(z.tipo==='zombi-bandera'){ctx.strokeStyle='#624931';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+25,y-10);ctx.lineTo(x+25,y-148);ctx.stroke();ctx.fillStyle='#c64439';ctx.beginPath();ctx.moveTo(x+25,y-148);ctx.lineTo(x+67,y-140);ctx.lineTo(x+58,y-108);ctx.lineTo(x+25,y-118);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#efd5a5';ctx.font='bold 21px sans-serif';ctx.fillText('!',x+40,y-121);}
  if(z.mantequilla>0){ctx.fillStyle='#f9da72';ctx.strokeStyle='#ad8033';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x-14,y-h-4,28,13,4);ctx.fill();ctx.stroke();}
  if(z.datos.cajaAbriendo){ctx.fillStyle='#f4e4bd';ctx.font='bold 21px sans-serif';ctx.fillText('!',x+18,y-h+20);}
  if(z.datos.mareoHasta>m.t){for(let i=0;i<3;i++){const a=m.t*3+i*Math.PI*2/3;this.estrella(x+Math.cos(a)*21,y-h-8+Math.sin(a)*5,5,'#f7d660');}}
 }
 private estrella(x:number,y:number,r:number,color:string){const c=this.ctx;c.fillStyle=color;c.strokeStyle='#8d622a';c.lineWidth=1;c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,s=i%2?r*.45:r;const xx=x+Math.cos(a)*s,yy=y+Math.sin(a)*s;if(i)c.lineTo(xx,yy);else c.moveTo(xx,yy);}c.closePath();c.fill();c.stroke();}
 private sol(s:SolPvZ,m:MotorPvZ){const c=this.ctx,q=this.posicionSol(s,m),r=s.valor<25?15:s.valor>25?25:21;c.save();c.translate(q.x,q.y);c.rotate(Math.sin(m.t*2+s.id)*.07);const g=c.createRadialGradient(0,0,4,0,0,r*1.8);g.addColorStop(0,'rgba(255,239,133,.7)');g.addColorStop(1,'rgba(255,237,113,0)');c.fillStyle=g;c.fillRect(-r*2,-r*2,r*4,r*4);this.estrella(0,0,r*1.25,'#ffe783');const grad=c.createRadialGradient(-5,-6,1,0,0,r);grad.addColorStop(0,'#fffcd1');grad.addColorStop(1,'#f2b83a');c.fillStyle=grad;c.strokeStyle='#dc8e28';c.lineWidth=2;c.beginPath();c.arc(0,0,r*.75,0,Math.PI*2);c.fill();c.stroke();c.restore();}
 private terreno(m:MotorPvZ){const c=this.ctx;
  for(const q of m.pistasHielo){c.fillStyle='rgba(189,233,255,.56)';c.fillRect(TABLERO_PVZ.x+q.desde,TABLERO_PVZ.y+q.fila*m.altoFila*escalaVerticalPvZ(m),q.hasta-q.desde,m.altoFila*escalaVerticalPvZ(m));}
  for(const q of m.crateres)this.figura({hoja:'objetos',celda:4,alto:37},TABLERO_PVZ.x+q.x,TABLERO_PVZ.y+(m.centroFila(q.fila)*escalaVerticalPvZ(m))+30,{ancho:77});
  for(const q of m.lapidas)this.figura({hoja:'objetos',celda:1,alto:87},TABLERO_PVZ.x+q.x,TABLERO_PVZ.y+(m.centroFila(q.fila)*escalaVerticalPvZ(m))+29,{ancho:67});
 }
 private niebla(m:MotorPvZ,estado:NieblaPvZ|undefined){if(!estado)return;const c=this.ctx,mascara=this.mascaraNiebla,ctx=mascara.getContext('2d')!;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,1100,650);
  const inicio=TABLERO_PVZ.x+estado.desde*80+estado.desplazamiento;if(inicio>1100)return;const g=ctx.createLinearGradient(inicio-55,0,inicio+80,0);g.addColorStop(0,'rgba(144,177,176,0)');g.addColorStop(.4,'rgba(152,184,181,.76)');g.addColorStop(1,'rgba(175,202,194,.98)');ctx.fillStyle=g;ctx.fillRect(Math.max(0,inicio-55),TABLERO_PVZ.y-30,1100,540);
  ctx.globalCompositeOperation='destination-out';for(const [fila,col]of estado.claras){const x=TABLERO_PVZ.x+col*80+40,y=TABLERO_PVZ.y+(m.centroFila(fila)*escalaVerticalPvZ(m));ctx.fillStyle='#000';ctx.fillRect(x-41,y-m.altoFila*escalaVerticalPvZ(m)/2-1,82,m.altoFila*escalaVerticalPvZ(m)+2);}
  c.drawImage(mascara,0,0);c.save();c.globalAlpha=.1;c.strokeStyle='#e1ece1';c.lineWidth=20;for(let i=0;i<7;i++){c.beginPath();c.ellipse(inicio+80+i*28,190+i*65,90+Math.sin(m.t*.4+i)*15,22,0,0,Math.PI*2);c.stroke();}c.restore();
 }
 dibujar(m:MotorPvZ){if(this.muerto)return;this.prepararMotor(m);const c=this.ctx;c.clearRect(0,0,1100,650);this.dibujarFondo(m);this.vidaEscenario(m);this.terreno(m);
  if(this.resaltada&&m.casilla(this.resaltada.fila,this.resaltada.col)){c.fillStyle='rgba(250,235,141,.32)';c.fillRect(TABLERO_PVZ.x+this.resaltada.col*80,TABLERO_PVZ.y+this.resaltada.fila*m.altoFila*escalaVerticalPvZ(m),80,m.altoFila*escalaVerticalPvZ(m));}
  for(const fila of m.nivel.filas){
   for(const p of m.plantas.filter(p=>p.fila===fila&&p.capa==='base'))this.planta(p,m);
   for(const p of m.plantas.filter(p=>p.fila===fila&&p.capa==='principal'))this.planta(p,m);
   for(const p of m.plantas.filter(p=>p.fila===fila&&p.capa==='cubierta'))this.planta(p,m);
   for(const z of m.zombis.filter(z=>z.fila===fila).sort((a,b)=>b.x-a.x))this.zombi(z,m);
   for(const j of m.jarrones.filter(j=>j.fila===fila)){const x=TABLERO_PVZ.x+j.x,y=TABLERO_PVZ.y+(m.centroFila(fila)*escalaVerticalPvZ(m))+29;this.sombra(x,y,26);this.figura({hoja:'objetos',celda:j.verde?3:2,alto:80},x,y);if(j.contenido?.planta)this.figura(ARTE_PLANTAS_PVZ[j.contenido.planta],x,y-12,{alto:48,alfa:.8});else if(j.contenido?.zombi){c.fillStyle='#dae8b8';c.font='bold 28px sans-serif';c.fillText('!',x-5,y-29);}}
  }
  for(const q of m.proyectiles){const x=TABLERO_PVZ.x+q.x,y=TABLERO_PVZ.y+((q.y??m.centroFila(q.fila))*escalaVerticalPvZ(m))-13;
   if(q.tipo.startsWith('bolo-')){this.figura(ARTE_PLANTAS_PVZ.nuez,x,y+28,{alto:62,giro:m.t*4});continue;}
   const hielo=q.danoTipo==='hielo'||q.tipo.includes('hielo'),fuego=q.danoTipo==='fuego'||q.tipo.includes('fuego'),r=(q.tipo==='pincho'?5:q.tipo==='guisante-grande'?14:q.tipo==='estrella'?8:7)*this.escalaFiguras;
   c.save();c.translate(x,y);c.scale(this.escalaY/this.escalaX,1);
   const vx=q.velocidad,vy=(q.velocidadY??0)*escalaVerticalPvZ(m),norma=Math.hypot(vx,vy)||1,dx=vx/norma,dy=vy/norma,largo=(hielo?37:fuego?30:22)*this.escalaFiguras;
   const cola=c.createLinearGradient(-dx*largo,-dy*largo,0,0);cola.addColorStop(0,'rgba(255,255,255,0)');cola.addColorStop(1,hielo?'rgba(175,239,255,.7)':fuego?'rgba(255,166,64,.7)':'rgba(226,244,177,.55)');
   c.strokeStyle=cola;c.lineWidth=Math.max(1,r*.55);c.lineCap='round';c.beginPath();c.moveTo(-dx*largo,-dy*largo);c.lineTo(-dx*3,-dy*3);c.stroke();
   if(hielo){for(let i=1;i<=3;i++){const d=largo*i/3,brillo=(Math.sin(m.t*11+q.id+i)+1)/2;c.fillStyle=`rgba(190,241,255,${.15+brillo*.35})`;c.beginPath();c.moveTo(-dx*d,-dy*d-2);c.lineTo(-dx*d+2,-dy*d);c.lineTo(-dx*d,-dy*d+2);c.lineTo(-dx*d-2,-dy*d);c.closePath();c.fill();}}
   if(q.tipo==='estrella'){c.rotate(m.t*7+q.id);this.estrella(0,0,r,'#ffdd58');c.restore();continue;}
   c.fillStyle=hielo?'#8ae1f8':fuego?'#ffb548':q.tipo==='pincho'?'#e4d39d':q.tipo==='espora'?'#c5b2f0':'#a8dc36';c.strokeStyle=hielo?'#3d8cac':fuego?'#bd652e':'#447d31';c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,q.tipo==='pincho'?r*1.5:r,q.tipo==='pincho'?2:r,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.72)';c.beginPath();c.ellipse(-r*.25,-r*.35,r*.3,r*.22,-.6,0,Math.PI*2);c.fill();c.restore();
  }
  for(const v of m.cortacespedes){if(v.estado==='gastado')continue;this.figura({hoja:'objetos',celda:0,alto:64},TABLERO_PVZ.x+v.x-5,TABLERO_PVZ.y+(m.centroFila(v.fila)*escalaVerticalPvZ(m))+29,{ancho:68});}
  this.restos=this.restos.filter(r=>m.t-r.inicio<1.4);for(const r of this.restos)dibujarParteZombiPvZ(c,this.atlas,r.figura,r.parte,r.x,r.y,r.alto,this.escalaFiguras,this.escalaY/this.escalaX,Math.max(0,m.t-r.inicio),r.espejo);
  this.efectos=this.efectos.filter(e=>m.t-e.inicio<e.vida);for(const e of this.efectos){const t=Math.max(0,(m.t-e.inicio)/e.vida);c.save();c.globalAlpha=1-t;if(e.tipo==='explosion'){c.fillStyle='#ffe082';c.strokeStyle='#de823e';c.lineWidth=7;this.estrella(e.x,e.y,20+t*100,'#ffe082');}else if(e.tipo==='siembra'){c.strokeStyle='#f0dc9e';c.lineWidth=3;c.beginPath();c.ellipse(e.x,e.y+18,15+t*22,5+t*8,0,0,Math.PI*2);c.stroke();}else if(e.tipo==='impacto'){c.strokeStyle='#fff2c5';c.lineWidth=2;c.beginPath();c.moveTo(e.x-6,e.y-12);c.lineTo(e.x+6,e.y+2);c.moveTo(e.x+6,e.y-12);c.lineTo(e.x-6,e.y+2);c.stroke();}c.restore();}
  const visibilidad=m.estadoVisibilidad();this.niebla(m,visibilidad.niebla);const tormenta=visibilidad.tormenta;if(tormenta){c.fillStyle=`rgba(9,19,34,${.9*(1-tormenta.claridad)})`;c.fillRect(0,85,1100,565);if(tormenta.claridad>.8){c.fillStyle=`rgba(227,246,255,${(tormenta.claridad-.8)*.8})`;c.fillRect(0,85,1100,565);}}
  for(const s of m.soles)this.sol(s,m);
 }
 destruir(){if(this.muerto)return;this.muerto=true;this.observador.disconnect();this.canvas.remove();this.canvas.width=1;this.canvas.height=1;this.mascaraNiebla.width=1;this.mascaraNiebla.height=1;if(this.cacheFondo){this.cacheFondo.width=1;this.cacheFondo=null;}this.efectos=[];this.restos=[];this.motorActual=null;}
}
