import { interiorLocal, interiorVivienda, interiorDormitorio, puertaCuarto, conKit, fundir } from './cuartos';
import { dormitorioDef, horaDormitorio } from './dormitorios';
import type { EstadoGranja } from './estado';
import { tiempoDia, lluviaRiega } from './clima';
import { VIVIENDAS_PUEBLO, viviendaInterior, posicionResidente, visitaVivienda, type ViviendaPueblo } from './pueblo-datos';
import { ubicacionAldeano } from './aldeanos';
import type { Jornada } from './jornada';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { EDIFICIOS_PUEBLO, NPCS_PUEBLO, CAMINOS_PUEBLO, alturaSueloPueblo, ARBOLES_PUEBLO, BANCOS_PUEBLO, PUENTES_PUEBLO, MOBILIARIO_SOLIDO, type ServicioPueblo, type EdificioPueblo } from './pueblo-datos';
export * from './pueblo-datos';
import { adornosPueblo, animarFuente } from './pueblo-adornos';
import { mallaAgua } from './paisaje-render';
import { exponerMuseo } from './museo-render';
const C={wood:'#79523c',woodLight:'#b98e62',beam:'#674a39',cream:'#f0dabc',stone:'#ada793',darkStone:'#827e72',green:'#78955d',leaf:'#91ae6d',leafLight:'#b4c87b',metal:'#536271',soil:'#9c7851',white:'#f8ead3',glass:'#9ebcc0'};
const hash=(i:number,k=0)=>{const n=Math.sin(i*124.16+k*271.7)*15423.724;return n-Math.floor(n);};

/** Geometry is baked once into one vertex-colour mesh per static group. */
class Arcilla {
  readonly partes:THREE.BufferGeometry[]=[];
  add(geometry:THREE.BufferGeometry,color:string,pos:[number,number,number],rot:[number,number,number]=[0,0,0],scale:[number,number,number]=[1,1,1]){
    const geo=geometry.index?geometry.toNonIndexed():geometry;if(geo!==geometry)geometry.dispose();
    geo.deleteAttribute('uv');const m=new THREE.Matrix4().compose(new THREE.Vector3(...pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),new THREE.Vector3(...scale));geo.applyMatrix4(m);
    const c=new THREE.Color(color),count=geo.getAttribute('position').count,arr=new Float32Array(count*3);
    for(let i=0;i<count;i++){arr[i*3]=c.r;arr[i*3+1]=c.g;arr[i*3+2]=c.b;}geo.setAttribute('color',new THREE.BufferAttribute(arr,3));this.partes.push(geo);
  }
  // Fine trim keeps its relief and colour; bevel tessellation is reserved for larger silhouettes.
  box(size:[number,number,number],pos:[number,number,number],color:string,r=.055,rot:[number,number,number]=[0,0,0]){this.add(r&&Math.min(...size)>=.13?new RoundedBoxGeometry(...size,1,Math.min(r,...size.map(v=>v/3))):new THREE.BoxGeometry(...size),color,pos,rot);}
  ball(size:[number,number,number],pos:[number,number,number],color:string){const r=Math.max(...size),segments=r<.1?[6,4]:r<.3?[8,5]:[10,6];this.add(new THREE.SphereGeometry(1,segments[0],segments[1]),color,pos,[0,0,0],size);}
  cyl(radius:number,height:number,pos:[number,number,number],color:string,rot:[number,number,number]=[0,0,0],r2=radius){this.add(new THREE.CylinderGeometry(radius,r2,height,10),color,pos,rot);}
  mesh(material?:THREE.MeshStandardMaterial){
    const geometry=mergeGeometries(this.partes,false)??new THREE.BufferGeometry();this.partes.forEach(p=>p.dispose());this.partes.length=0;geometry.computeBoundingSphere();
    const mesh=new THREE.Mesh(geometry,material??new THREE.MeshStandardMaterial({vertexColors:true,roughness:.89}));mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
  }
}
function roof(a:Arcilla,x:number,z:number,w:number,d:number,y:number,color:string){
  const peak=1.7,over=.38,slope=Math.atan2(peak,w/2+over),span=Math.hypot(w/2+over,peak);
  for(const side of [-1,1]){
    a.box([span,.22,d+.85],[x+w/2+side*(w/2+over)/2,y+peak/2,z+d/2],color,.06,[0,0,-side*slope]);
    // Embossed rows of generous clay tiles; batching preserves the relief at low draw cost.
    for(let row=0;row<3;row++)for(let col=0;col<Math.ceil(d/1.1);col++){
      const t=(row+.48)/3,xx=x+w/2+side*t*(w/2+over),yy=y+peak*(1-t)+.12;
      a.box([span/3+.05,.095,1.04],[xx,yy,z-.04+col*1.09],row%2?new THREE.Color(color).multiplyScalar(1.045).getStyle():color,.045,[0,0,-side*slope]);
    }
  }
  a.cyl(.18,d+.95,[x+w/2,y+peak+.04,z+d/2],new THREE.Color(color).multiplyScalar(.85).getStyle(),[Math.PI/2,0,0]);
  // Gable walls close the triangular end without importing a separate art asset.
  for(const zz of [z-.025,z+d+.025]){
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([x,y,zz,x+w,y,zz,x+w/2,y+peak,zz,x+w/2,y+peak,zz,x+w,y,zz,x,y,zz],3));g.computeVertexNormals();a.add(g,C.cream,[0,0,0]);
    a.box([.16,peak,.13],[x+w/2,y+peak*.45,zz+.06],C.beam);
  }
}
function windowFront(a:Arcilla,x:number,y:number,z:number,accent:string,width=1.35){
  a.box([width+.24,1.55,.15],[x,y,z],C.beam);a.box([width,1.3,.12],[x,y,z+.09],C.glass);
  a.box([.09,1.3,.08],[x,y,z+.18],C.cream);a.box([width,.09,.08],[x,y,z+.18],C.cream);
  a.box([width+.4,.16,.38],[x,y-.78,z+.15],C.stone);
  for(const s of [-1,1]){a.box([.34,1.42,.1],[x+s*(width/2+.28),y,z],accent);for(let i=0;i<4;i++)a.box([.3,.025,.04],[x+s*(width/2+.28),y-.45+i*.3,z+.06],C.beam);}
}
function flowerpot(a:Arcilla,x:number,z:number,color='#deab78',size=.34){
  a.cyl(size*.9,size*1.15,[x,size*.6,z],color,[0,0,0],size*.62);a.cyl(size*.91,.08,[x,size*1.14,z],C.soil);
  for(let i=0;i<5;i++){const t=i*2.4;a.ball([size*.45,size*.29,size*.43],[x+Math.cos(t)*size*.62,size*1.45+hash(i)*.13,z+Math.sin(t)*size*.62],i%3?'#d6a1a1':'#edcf73');}
}
function coloredTransform(target:Arcilla,source:Arcilla,x:number,y:number,z:number,rotation=0){
  const matrix=new THREE.Matrix4().makeRotationY(rotation);matrix.setPosition(x,y,z);
  for(const g of source.partes){g.applyMatrix4(matrix);target.partes.push(g);}source.partes.length=0;
}
function seat(a:Arcilla,x:number,z:number,rotation=0){
  const b=new Arcilla();b.box([2.1,.13,.63],[0,.63,0],C.woodLight);b.box([2.1,.52,.11],[0,1.06,-.3],C.woodLight);
  for(const s of [-1,1]){b.box([.14,.65,.52],[s*.8,.32,0],C.metal);b.box([.12,.7,.13],[s*.8,.87,-.28],C.metal);}coloredTransform(a,b,x,0,z,rotation);
}
function crate(a:Arcilla,x:number,y:number,z:number,fruit?:string){
  a.box([.95,.58,.7],[x,y+.29,z],C.woodLight);for(const s of [-1,1])for(let i=0;i<3;i++)a.box([.98,.05,.045],[x,y+.13+i*.18,z+s*.37],C.wood);
  if(fruit)for(let i=0;i<6;i++)a.ball([.13,.12,.13],[x-.3+(i%3)*.3,y+.6,z-.15+Math.floor(i/3)*.3],fruit);
}
function sign(root:THREE.Group,e:EdificioPueblo,y=3.08,ancho=Math.min(e.ancho-.8,6.5)){
  // Nine tiny sign textures are separate from the batched architecture; no external font download.
  if(typeof document==='undefined')return;
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#654832';ctx.fillRect(0,0,768,128);ctx.strokeStyle='#caa56e';ctx.lineWidth=5;ctx.strokeRect(9,9,750,110);
  ctx.fillStyle='#fff0ce';ctx.font='600 43px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e.nombre,384,65,722);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=2;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(ancho,.8),new THREE.MeshStandardMaterial({map:tex,roughness:.9}));mesh.position.set(e.x+e.ancho/2,y,e.z+e.fondo+.21);root.add(mesh);
}
/** Pieza del kit del pueblo que reemplaza a la utilería de arcilla de un edificio (mismo sitio). */
interface PuestoKit {clave:string;x:number;z:number;giro?:number;escala?:number;y?:number;tinte?:string}
function building(u:Arcilla,root:THREE.Group,e:EdificioPueblo,kit:PuestoKit[]=[]){
  const palettes:Record<string,[string,string,string]>={semillas:['#edc38f','#a56548','#809958'],animales:['#d7bf93','#699c91','#a95e4d'],carpinteria:['#caa77c','#656f50','#976b42'],herreria:['#b5b2a2','#637e8b','#525766'],clinica:['#e8e5c8','#78a492','#92ada4'],posada:['#ead6b0','#8f6976','#977346'],archivo:['#d8c7a8','#7d8399','#699181'],gremio:['#e8d6b0','#8e3b3b','#3e5c76'],museo:['#efe4cc','#6fa59a','#8e3b5e']};
  const [wall,roofColor,accent]=palettes[e.servicio],{x,z,ancho:w,fondo:d}=e,h=e.servicio==='posada'?4.65:3.7;
  u.box([w+.32,.42,d+.3],[x+w/2,.2,z+d/2],C.stone,.09);u.box([w,h-.3,d],[x+w/2,(h+.3)/2,z+d/2],wall,.09);
  for(const xx of [x+.06,x+w-.06])u.box([.2,h,.22],[xx,h/2,z+d+.04],C.beam);
  u.box([w+.12,.24,.25],[x+w/2,.72,z+d+.07],accent);u.box([w+.12,.22,.26],[x+w/2,h-.1,z+d+.07],C.beam);
  const doorX=x+w/2,front=z+d;
  u.box([1.6,2.6,.2],[doorX,1.58,front+.05],C.beam);u.box([1.28,2.32,.15],[doorX,1.56,front+.18],accent);
  for(let n=0;n<4;n++)u.box([.035,2.12,.04],[doorX-.48+n*.32,1.54,front+.28],C.beam);
  u.ball([.09,.09,.09],[doorX+.42,1.42,front+.32],'#e5c574');
  u.box([2.25,.2,1.1],[doorX,.12,front+.52],C.stone);u.box([2.55,.1,.65],[doorX,.055,front+1.05],C.stone);
  for(const side of [-1,1])windowFront(u,doorX+side*(w*.3),2,front+.08,accent,w>8?1.55:1.2);
  if(e.servicio==='posada'){
    for(const side of [-1,0,1])windowFront(u,doorX+side*2.8,3.78,front+.08,accent,1.0);
    u.box([w+.25,.21,.4],[doorX,2.7,front+.08],C.woodLight);
  }
  roof(u,x,z,w,d,h,roofColor);
  if(e.servicio!=='animales'){
    u.box([.9,2.7,1.05],[x+w*.8,h+.55,z+d*.33],e.servicio==='herreria'?C.darkStone:C.cream,.04);u.box([1.14,.23,1.2],[x+w*.8,h+1.97,z+d*.33],C.darkStone,.045);
  }
  for(const side of [-1,1]){flowerpot(u,x+w/2+side*1.5,front+.6,e.servicio==='clinica'?'#c8d8bd':'#c59679',.32);kit.push({clave:'maceta_puerta',x:x+w/2+side*1.5,z:front+.6,giro:side,tinte:e.servicio==='clinica'?'#c8d8bd':'#c59679'});}
  // El gremio lleva estandartes y ventanas altas a los lados de su letrero; el del museo va sobre el arquitrabe
  if(e.servicio==='gremio')sign(root,e,3.25,3.2);else if(e.servicio==='museo')sign(root,e,3.6,5.2);else sign(root,e,e.servicio==='posada'?5.05:3.19);
  // El edificio entero también tiene su modelo de Blender (granja_edificios.py), centrado en su huella
  kit.push({clave:`edificio_${e.servicio}_${w}x${d}`,x:x+w/2,z:z+d/2});
  // Side windows make the buildings feel complete when viewed from the orthographic camera.
  for(let j=0;j<2;j++){
    u.box([.14,1.3,1.15],[x+w+.035,2,z+1.55+j*(d-3)],C.beam);u.box([.12,1.06,.95],[x+w+.12,2,z+1.55+j*(d-3)],C.glass);
    u.box([.05,1.08,.07],[x+w+.19,2,z+1.55+j*(d-3)],C.cream);u.box([.05,.07,.98],[x+w+.19,2,z+1.55+j*(d-3)],C.cream);
  }
  if(e.servicio==='semillas'){
    for(const side of [-1,1]){const bx=doorX+side*2.6;
      u.box([2.55,.19,1.65],[bx,2.7,front+.85],side<0?'#899f69':'#d4aa68',.04,[-.12,0,0]);
      for(let i=0;i<5;i++)u.box([.24,.06,1.66],[bx-1.04+i*.52,2.75,front+.85],C.cream,.01,[-.12,0,0]);
      for(const s of [-1,1])u.cyl(.06,2.62,[bx+s*1.16,1.31,front+1.55],C.wood);
      crate(u,bx-.51,0,front+.92,side<0?'#df9360':'#879d5c');crate(u,bx+.51,0,front+.92,side<0?'#d9bc68':'#be7471');
      kit.push({clave:side<0?'puesto_mercado_verde':'puesto_mercado_mostaza',x:bx,z:front+.85});
    }
  }
  if(e.servicio==='carpinteria'){
    for(let row=0;row<3;row++)for(let i=0;i<4-row;i++){
      const lx=x+.2+i*.58+row*.29;u.cyl(.25,2.2,[lx,.28+row*.44,z+d+2.6],C.wood,[Math.PI/2,0,0]);u.cyl(.2,.025,[lx,.28+row*.44,z+d+3.71],C.woodLight,[Math.PI/2,0,0]);
    }
    u.box([2.8,.25,1.25],[x+w-1.15,1.07,z+d+2.25],C.woodLight);
    for(const s of [-1,1])u.box([.15,.95,1.08],[x+w-1.15+s*1.14,.47,z+d+2.25],C.beam);
    u.box([1.85,.09,.38],[x+w-1.15,1.25,z+d+2.25],C.cream);
    u.box([1.2,.04,.26],[x+w-1.1,1.36,z+d+2.15],C.metal,.01,[0,.3,0]);
    u.cyl(.46,1.15,[x+w+1.1,.6,z+d-1.1],C.woodLight);u.cyl(.48,.1,[x+w+1.1,1.22,z+d-1.1],C.wood);
    kit.push({clave:'troncos_pila',x:x+1.27,z:z+d+2.6},{clave:'banco_taller',x:x+w-1.15,z:z+d+2.25},{clave:'barril_taller',x:x+w+1.1,z:z+d-1.1});
  }
  if(e.servicio==='herreria'){
    u.box([1.8,1.62,1.42],[x+1.4,.82,z+d+1.7],C.darkStone);u.box([1.27,.73,.06],[x+1.4,.83,z+d+2.44],'#493f3b');
    u.box([1.02,.15,.5],[x+1.4,.5,z+d+2.42],'#ecab57');
    u.cyl(.48,.76,[x+w-1.25,.42,z+d+1.9],C.wood);u.box([1.65,.31,.66],[x+w-1.25,1.04,z+d+1.9],C.metal);
    u.box([.55,.54,.5],[x+w-1.25,.8,z+d+1.9],C.metal);u.cyl(.12,.7,[x+w-.95,1.46,z+d+1.9],C.wood,[0,0,.5]);u.box([.47,.23,.24],[x+w-.77,1.78,z+d+1.9],C.metal,.03,[0,0,.5]);
    for(let i=0;i<5;i++)u.ball([.23,.2,.22],[x-.3+hash(i)*.8,.19,z+d-1.3+hash(i,2)],i%2?'#98afa9':'#ae9279');
    kit.push({clave:'fragua_patio',x:x+1.4,z:z+d+1.7},{clave:'yunque_patio',x:x+w-1.25,z:z+d+1.9},{clave:'piedras_mineral',x:x+.1,z:z+d-.8});
  }
  if(e.servicio==='clinica'){
    u.cyl(.46,.12,[doorX,h+.5,front+.16],'#dfe8d3',[Math.PI/2,0,0]);u.box([.13,.6,.09],[doorX,h+.5,front+.27],'#819e87');u.box([.56,.13,.09],[doorX,h+.5,front+.27],'#819e87');
    for(let i=0;i<4;i++)flowerpot(u,x+w+1.05,z+.9+i*1.45,'#bdd0b0',.43);
    kit.push({clave:'emblema_clinica',x:doorX,z:front+.18,y:h+.5});for(let i=0;i<4;i++)kit.push({clave:'maceta_grande',x:x+w+1.05,z:z+.9+i*1.45,giro:i,tinte:'#bdd0b0'});
  }
  if(e.servicio==='archivo'){
    u.box([2.2,1.3,.22],[x-1.25,1.65,z+d],C.wood);for(const s of [-1,1])u.cyl(.08,2.25,[x-1.25+s*.85,1.12,z+d],C.wood);
    for(let i=0;i<3;i++)u.box([.52,.73,.03],[x-1.87+i*.62,1.66,z+d+.14],i%2?'#ddc7a3':'#eddfb6',.01,[0,0,(i-1)*.04]);
    for(let i=0;i<3;i++)crate(u,x+w+1.1,0,z+1.25+i*1.1);
    kit.push({clave:'tablon',x:x-1.25,z:z+d});for(let i=0;i<3;i++)kit.push({clave:'caja',x:x+w+1.1,z:z+1.25+i*1.1,giro:(i-1)*.15});
  }
  if(e.servicio==='posada'){
    seat(u,x+1.3,z+d+1.4);u.cyl(.8,.12,[x+w-1.5,.95,z+d+1.7],C.woodLight);u.cyl(.1,.92,[x+w-1.5,.46,z+d+1.7],C.wood);
    for(const side of [-1,1]){u.cyl(.26,.12,[x+w-1.5+side*1.05,.51,z+d+1.7],C.woodLight);u.cyl(.08,.49,[x+w-1.5+side*1.05,.25,z+d+1.7],C.wood);}
    u.cyl(.16,.31,[x+w-1.5,1.17,z+d+1.7],C.cream);
    kit.push({clave:'banco',x:x+1.3,z:z+d+1.4},{clave:'mesa_posada',x:x+w-1.5,z:z+d+1.7});
  }
}
function shrine(u:Arcilla,root:THREE.Group,e:EdificioPueblo,kit:PuestoKit[]=[]){
  const aura=e.servicio==='altar_aura',col=aura?'#d5b66a':'#9591ac',flower=aura?'#e8c460':'#c6b1d3',cx=e.x+2,cz=e.z+2;
  u.box([4.6,.16,4.7],[cx,.08,cz],C.stone,.11);u.box([3.3,.18,3.4],[cx,.24,cz],aura?'#e6d5b1':'#c1bbca',.11);
  for(const sx of [-1,1]){u.cyl(.18,2.65,[cx+sx*1.2,1.55,cz-.65],col);u.ball([.27,.23,.27],[cx+sx*1.2,2.91,cz-.65],col);}
  u.box([3.06,.2,.38],[cx,2.77,cz-.65],col,.08);u.box([3.1,.15,.44],[cx,2.96,cz-.65],aura?'#e5cd83':'#aaa3bb',.08);
  u.cyl(.64,.66,[cx,.65,cz],col);u.cyl(.86,.13,[cx,1.03,cz],C.cream);
  if(aura){u.ball([.24,.55,.24],[cx,1.62,cz],'#edbf62');u.ball([.16,.4,.16],[cx+.12,1.61,cz+.1],'#e58b58');u.ball([.13,.26,.13],[cx-.05,1.51,cz+.12],'#fff1b1');}
  else {u.cyl(.38,.075,[cx,1.57,cz],'#ddd5e9',[Math.PI/2,0,0]);u.ball([.22,.28,.09],[cx+.18,1.69,cz+.07],'#9591ac');}
  for(let i=0;i<10;i++){
    const angle=i*Math.PI*2/10,r=1.6,xx=cx+Math.cos(angle)*r,zz=cz+Math.sin(angle)*r;
    if(zz>cz+.9&&Math.abs(xx-cx)<.75)continue;u.cyl(.035,.45,[xx,.47,zz],C.green);for(let p=0;p<4;p++)u.ball([.12,.06,.12],[xx+Math.cos(p*Math.PI/2)*.1,.72,zz+Math.sin(p*Math.PI/2)*.1],flower);
  }
  sign(root,e,3.28);
  kit.push({clave:aura?'altar_aura':'altar_lara',x:cx,z:cz});
}
function tree(a:Arcilla,x:number,z:number,h=3.5){
  a.cyl(.2,h*.67,[x,h*.335,z],C.wood,[0,0,-.05],.3);
  for(let i=0;i<4;i++){const t=i*2.4;a.ball([.93,h*.31,.88],[x+Math.cos(t)*.58,h*.77+hash(i,x)*.27,z+Math.sin(t)*.55],i%2?C.leaf:C.leafLight);}
  a.ball([.7,.8,.7],[x,h*1.12,z],C.leaf);
}
function fence(a:Arcilla,x:number,z:number,x2:number,z2:number){
  const d=Math.hypot(x2-x,z2-z),n=Math.ceil(d/1.5),horizontal=Math.abs(x2-x)>Math.abs(z2-z);
  for(let i=0;i<=n;i++){const t=i/n;a.box([.18,1.15,.18],[x+(x2-x)*t,.58,z+(z2-z)*t],C.woodLight);a.ball([.14,.13,.14],[x+(x2-x)*t,1.17,z+(z2-z)*t],C.wood);}
  for(const yy of [.42,.86])a.box(horizontal?[d,.12,.12]:[.12,.12,d],[(x+x2)/2,yy,(z+z2)/2],C.woodLight,.02);
}
function lamp(a:Arcilla,x:number,z:number){
  a.cyl(.2,.18,[x,.09,z],C.stone);a.cyl(.075,2.5,[x,1.3,z],C.metal);a.box([.57,.08,.52],[x,2.87,z],C.metal);a.box([.42,.51,.37],[x,2.58,z],'#efcd86',.065);
  for(const s of [-1,1])a.box([.045,.59,.045],[x+s*.2,2.58,z+.2],C.metal);
}
/** Los vecinos de peluche los pone `main.ts` (en el navegador); sin ellos (pruebas en Node) quedan los de arcilla. */
let pelucheVecino:((id:string,i:number)=>THREE.Group)|null=null,animarPeluche:((g:THREE.Object3D,dt:number,andando:boolean)=>void)|null=null,sacarPeluches:((g:THREE.Object3D)=>void)|null=null;
export function usarVecinosPeluche(crear:(id:string,i:number)=>THREE.Group,animar:(g:THREE.Object3D,dt:number,andando:boolean)=>void,sacar:(g:THREE.Object3D)=>void){pelucheVecino=crear;animarPeluche=animar;sacarPeluches=sacar;}
function vecinoPeluche(id:string,i:number){return pelucheVecino?.(id,i)??npc(NPCS_PUEBLO[i]?.color??'#b98a6a',i);}
function npc(color:string,index:number){
  const group=new THREE.Group(),body=new Arcilla(),skin=['#dcb294','#b88463','#ebc9a6'][index%3],hair=index===20?'#ada99c':['#644c3f','#9b7652','#4d4749'][index%3];
  body.ball([.34,.39,.23],[0,.95,0],color);body.box([.45,.28,.1],[0,.8,.21],'#d8c5a4',.08);body.cyl(.09,.13,[0,1.28,0],skin);
  body.ball([.255,.29,.25],[0,1.54,0],skin);body.ball([.26,.16,.26],[0,1.73,-.035],hair);
  for(const s of [-1,1]){body.ball([.053,.07,.035],[s*.087,1.56,.233],'#443d39');body.ball([.015,.018,.013],[s*.078,1.578,.265],C.white);body.ball([.045,.032,.02],[s*.13,1.48,.233],'#c18e79');body.ball([.095,.11,.1],[s*.37,.78,.035],skin);body.ball([.1,.27,.12],[s*.32,1.04,0],color);}
  body.ball([.04,.055,.045],[0,1.49,.27],skin);body.ball([.045,.012,.012],[0,1.41,.232],hair);
  if(index===2||index===0){body.cyl(.32,.13,[0,1.82,0],index===0?'#d5b378':'#a47a53');body.cyl(.43,.035,[0,1.76,0],index===0?'#dbbe87':'#ba9063');}
  if(index===7||index===8){body.ball([.28,.39,.17],[0,1.55,-.18],index===7?'#d9af59':'#565369');body.cyl(.28,.04,[0,1.81,0],index===7?'#f0d992':'#bbb3ce');}
  if(index>=9&&index%4===1){body.cyl(.32,.13,[0,1.82,0],index===9?'#659ba7':'#c6a26a');body.cyl(.43,.035,[0,1.76,0],'#c9b68c');}
  if(index===10){body.ball([.28,.13,.28],[0,1.8,0],'#c5a957');body.ball([.06,.06,.045],[0,1.8,.26],'#eee0b2');}
  if(index===12){body.ball([.28,.18,.26],[0,1.85,0],'#ece3ce');body.box([.42,.4,.04],[0,.92,.245],'#ece3ce');}
  if(index===19){for(const side of [-1,1])body.add(new THREE.TorusGeometry(.068,.012,4,12),'#5f5966',[side*.09,1.56,.263]);}
  group.add(body.mesh());const legs:THREE.Group[]=[];
  for(const s of [-1,1]){const leg=new THREE.Group(),a=new Arcilla();a.box([.18,.46,.21],[0,-.2,0],'#6f746d',.08);a.box([.2,.15,.33],[0,-.43,.045],C.wood,.05);leg.add(a.mesh());leg.position.set(s*.145,.52,0);group.add(leg);legs.push(leg);}
  group.userData.legs=legs;group.userData.seed=index;return group;
}
function cow(a:Arcilla,x:number,z:number,scale=.8){
  const b=new Arcilla();b.ball([.62,.47,.94],[0,1,0],C.white);for(const s of [-1,1])for(const end of [-1,1]){b.box([.21,.6,.22],[s*.4,.48,end*.63],C.white,.06);b.box([.22,.14,.24],[s*.4,.11,end*.63],C.wood,.04);}
  b.ball([.42,.43,.4],[0,1.38,.86],C.white);b.ball([.34,.2,.2],[0,1.2,1.19],'#d6a396');
  for(const s of [-1,1]){b.ball([.23,.1,.15],[s*.43,1.62,.8],C.woodLight);b.ball([.056,.075,.034],[s*.16,1.48,1.21],'#4b413b');b.cyl(.065,.29,[s*.24,1.88,.77],'#d8c49d',[0,0,s*.3],.095);b.ball([.14,.28,.36],[s*.535,1.12,-.22],C.wood);}
  const m=new THREE.Matrix4().compose(new THREE.Vector3(x,0,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,-.4,0)),new THREE.Vector3(scale,scale,scale));for(const p of b.partes){p.applyMatrix4(m);a.partes.push(p);}b.partes.length=0;
}
function chicken(a:Arcilla,x:number,z:number){
  a.ball([.29,.31,.36],[x,.46,z],C.cream);a.ball([.2,.23,.22],[x,.74,z+.18],C.cream);a.ball([.11,.055,.16],[x,.7,z+.37],'#cf9d52');
  for(const s of [-1,1]){a.ball([.025,.034,.017],[x+s*.115,.81,z+.36],'#493d35');a.cyl(.025,.24,[x+s*.1,.13,z],'#c39455');}
  a.ball([.08,.13,.07],[x,.98,z+.18],'#b96358');a.ball([.23,.16,.2],[x,.65,z-.29],C.cream);
}

const VALLAS_CORRAL:readonly [number,number,number,number][]=[[58,12,70,12],[58,21,70,21],[58,12,58,21],[70,12,70,15.4],[70,17.6,70,21]];
const FAROLES_PUEBLO:readonly [number,number][]=[[55,-8],[69,-6],[80,-10],[88,-6],[108,-6],[77.4,9.2],[92,8],[81,22],[102,23],[55,23]];
const JARDINERAS_PUEBLO:readonly [number,number,number,number][]=[[70,-13,2,5],[88,-16,1.8,4],[56,-21,1.4,13],[87,13,1.7,8],[102,-14,2,5]];

/** La utilería del pueblo con las piezas de granja_pueblo.glb (mismas posiciones, alturas y huellas que la arcilla),
 * juntada por material para que sean pocas llamadas de dibujo. */
function utileriaPueblo(m:Map<string,THREE.Object3D>,edificios:readonly PuestoKit[]=[]):THREE.Group|null{
  if(!m.has('fuente')||edificios.some(p=>!m.has(p.clave)))return null;const g=new THREE.Group(),tintes=new Map<string,THREE.Material>();
  const poner=(clave:string,x:number,z:number,giro=0,escala:number|[number,number,number]=1,y=0)=>{const base=m.get(clave);if(!base)return;const o=base.clone(true);o.position.set(x,y,z);o.rotation.y=giro;if(typeof escala==='number')o.scale.setScalar(escala);else o.scale.set(...escala);g.add(o);};
  poner('fuente',84,2);
  for(const [x,z,r]of BANCOS_PUEBLO)poner('banco',x,z,r);
  for(const [x,z]of FAROLES_PUEBLO)poner('farol',x,z,hash(x,z)*6.28);
  ARBOLES_PUEBLO.forEach(([x,z,h],i)=>poner(i%3===1?'arbol_b':'arbol_a',x,z,hash(i,7)*6.28,h/3.5));
  // Jardineras: módulos de 1 m estirados para llenar cada una, con su bordillo alrededor
  for(const [x,z,w,d]of JARDINERAS_PUEBLO){
    const nx=Math.max(1,Math.round(w)),nz=Math.max(1,Math.round(d)),sx=w/nx,sz=d/nz;
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)poner('jardinera',x+sx*(i+.5),z+sz*(j+.5),0,[sx,1,sz]);
    const lado=(x0:number,z0:number,x1:number,z1:number)=>{const largo=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.round(largo)),giro=Math.atan2(-(z1-z0),x1-x0);for(let k=0;k<n;k++){const t=(k+.5)/n;poner('jardinera_borde',x0+(x1-x0)*t,z0+(z1-z0)*t,giro,[largo/n,1,1]);}};
    lado(x-.1,z-.1,x+w+.1,z-.1);lado(x-.1,z+d+.1,x+w+.1,z+d+.1);lado(x-.1,z-.1,x-.1,z+d+.1);lado(x+w+.1,z-.1,x+w+.1,z+d+.1);
  }
  // Vallas del corral y de los puentes: tramos de 1,5 m como mucho, igual que la arcilla
  const valla=(x:number,z:number,x2:number,z2:number)=>{const d=Math.hypot(x2-x,z2-z),n=Math.ceil(d/1.5),giro=Math.atan2(-(z2-z),x2-x);for(let i=0;i<n;i++)poner('valla_tramo',x+(x2-x)*i/n,z+(z2-z)*i/n,giro,[d/n/1.5,1,1]);poner('valla_poste',x2,z2);};
  for(const [x,z,x2,z2] of VALLAS_CORRAL)valla(x,z,x2,z2);
  for(const zz of PUENTES_PUEBLO){valla(103.3,zz,109,zz);valla(103.3,zz+1.6,109,zz+1.6);}
  poner('vaca',61,15.5,-.4,.8);poner('vaca',66,18,.5,.63);
  for(const [x,z,r] of [[66,14,.3],[67.1,15.5,-.8],[62,19,2.4]] as const)poner('gallina',x,z,r);
  poner('bebedero',59.4,19.8);
  for(let i=0;i<3;i++)poner('rollo_heno',66.8+i*.85,20.1,(i-1)*.12);
  for(let i=0;i<29;i++)poner('piedra_borde',55+i*1.9,-28.1+hash(i)*.2,hash(i,3)*6.28,.85+hash(i,4)*.3);
  poner('letrero_entrada',54,1.8);
  // Lo de cada edificio, en el sitio que anotó building(); las materas toman el color de su fachada
  for(const p of edificios){const base=m.get(p.clave);if(!base)continue;const o=base.clone(true);o.position.set(p.x,p.y??0,p.z);o.rotation.y=p.giro??0;o.scale.setScalar(p.escala??1);
    if(p.tinte)o.traverse(x=>{const malla=x as THREE.Mesh;if(!malla.isMesh||Array.isArray(malla.material)||!malla.material.name.endsWith('| maceta'))return;const clave=malla.material.uuid+p.tinte;let t=tintes.get(clave);if(!t){const c=(malla.material as THREE.MeshStandardMaterial).clone();c.userData={};c.color.set(p.tinte!);t=c;tintes.set(clave,t);}malla.material=t;});
    g.add(o);}
  return fundir(g);
}

interface AnimationPueblo { npcs:THREE.Group[]; humo:THREE.Group[]; rueda:THREE.Group; agua:THREE.Mesh; fuego:THREE.Mesh; }

/** Original compact village. Owns all geometry/materials; no V2 cache references. */
export function crearPueblo():THREE.Group {
  const group=new THREE.Group();group.name='pueblo';const a=new Arcilla(),u=new Arcilla();
  // A offset plaza and bent approach distinguish the layout from a copied map.
  // Calles empedradas, la plaza del sol y el agua de la fuente (texturas pintadas): pueblo-adornos.ts
  if(typeof document!=='undefined')group.add(adornosPueblo(mallaAgua));
  // Irregular paving of the civic square, with visible raised perimeter.
  a.cyl(7.15,.16,[84,.05,2],C.stone,[0,0,0]);a.cyl(6.94,.12,[84,.12,2],'#d3c8aa');
  for(let ring=0;ring<3;ring++)for(let i=0;i<24;i++){const t=i/24*Math.PI*2,r=3.2+ring*1.12;a.box([.86,.035,.72],[84+Math.sin(t)*r,.2,2+Math.cos(t)*r],ring===1?(i%2?'#c98a57':'#d9a466'):(i%2?'#b9b09a':'#cfc5ab'),.04,[0,t,0]);}
  u.cyl(2.23,.32,[84,.29,2],C.stone);u.cyl(1.95,.24,[84,.5,2],C.cream);u.cyl(.47,.86,[84,1.04,2],C.stone);u.cyl(.98,.2,[84,1.5,2],C.cream);u.cyl(.27,.83,[84,1.88,2],C.stone);u.ball([.29,.31,.29],[84,2.4,2],'#c5b27e');
  const kitEdificios:PuestoKit[]=[];
  for(const v of VIVIENDAS_PUEBLO.filter(v=>!v.edificio)){building(u,group,{...v,servicio:({despertar:'clinica',calma:'archivo',ribera:'animales',senderos:'carpinteria',huerto:'clinica',escuela:'archivo',bosque:'carpinteria',tejidos:'posada',observatorio:'archivo',rosal:'clinica'} as Record<string,ServicioPueblo>)[v.tema],descripcion:'Vivienda de los habitantes del pueblo'},kitEdificios);}
  for(const e of EDIFICIOS_PUEBLO)e.servicio.startsWith('altar')?shrine(u,group,e,kitEdificios):building(u,group,e,kitEdificios);
  // Animal-yard fence has a visible gate gap facing the plaza.
  for(const [x,z,x2,z2] of VALLAS_CORRAL)fence(u,x,z,x2,z2);
  a.box([10.9,.075,8.15],[64,.025,16.5],'#98b575',.12);for(let i=0;i<32;i++){const xx=58.7+hash(i,2)*10.5,zz=12.5+hash(i,9)*8;a.ball([.15,.045,.12],[xx,.09,zz],i%3?'#a6ba7b':'#becc8e');}
  cow(u,61,15.5);cow(u,66,18,.63);chicken(u,66,14);chicken(u,67.1,15.5);chicken(u,62,19);
  u.box([1.8,.4,.65],[59.4,.25,19.8],C.woodLight);u.box([1.56,.08,.44],[59.4,.49,19.8],'#89adb4');
  for(let i=0;i<3;i++)u.cyl(.5,.8,[66.8+i*.85,.45,20.1],'#c8b679',[0,0,Math.PI/2]);
  // Narrow millrace; its banks and wheel are the inn's architectural landmark.
  a.box([3.5,.1,11],[106.1,.03,16.5],'#83aeb0',.15);for(const x of [104.2,108])a.box([.35,.33,11.3],[x,.15,16.5],C.stone);
  for(let i=0;i<11;i++)a.box([3.55,.09,.09],[106.1,.13,11.3+i*.95],i%2?'#a7c8c6':'#97bab9',.01);
  for(const zz of PUENTES_PUEBLO){fence(u,103.3,zz,109,zz);fence(u,103.3,zz+1.6,109,zz+1.6);}
  for(const [x,z,r]of BANCOS_PUEBLO)seat(u,x,z,r);
  for(const [x,z]of FAROLES_PUEBLO)lamp(u,x,z);
  // Flowerbeds are inset with a stone rim, leaving the main routes clear.
  for(const [x,z,w,d]of JARDINERAS_PUEBLO){
    u.box([w+.2,.19,d+.2],[x+w/2,.08,z+d/2],C.stone,.07);u.box([w,.17,d],[x+w/2,.16,z+d/2],C.soil,.06);
    for(let i=0;i<Math.ceil(w*d*1.4);i++){const xx=x+.2+hash(i,x)*(w-.4),zz=z+.2+hash(i,z)*(d-.4);u.ball([.25,.25,.25],[xx,.36,zz],i%3?C.green:C.leaf);u.ball([.12,.085,.12],[xx,.61,zz],['#d4a0a1','#dec46b','#c8b0d5'][i%3]);}
  }
  for(const [x,z,h]of ARBOLES_PUEBLO)tree(u,x,z,h);
  // Low perimeter stones, flowers and signpost at the approach.
  for(let i=0;i<29;i++){const x=55+i*1.9;u.ball([.55,.27,.39],[x,.2,-28.1+hash(i)*.2],i%3?C.stone:'#b7b49b');}
  u.cyl(.13,2.5,[54,1.25,1.8],C.wood);u.box([2.2,.48,.13],[54,2.17,1.8],C.woodLight);u.box([1.7,.42,.13],[54,1.58,1.8],C.woodLight,.04,[0,0,-.09]);
  group.add(a.mesh());const arcilla=u.mesh();arcilla.name='utileria-arcilla';group.add(arcilla);
  const npcs=NPCS_PUEBLO.map((n,i)=>{const g=vecinoPeluche(n.id,i);if(n.id==='nina'||n.id==='nino')g.scale.setScalar(.82);g.position.set(n.x,0,n.z);g.userData.origin={x:n.x,z:n.z};g.userData.npcId=n.id;group.add(g);return g;});
  const rueda=new THREE.Group(),r=new Arcilla();for(const xx of [-.29,.29]){r.add(new THREE.TorusGeometry(1.68,.12,6,24),C.wood,[xx,0,0],[0,Math.PI/2,0]);}
  r.cyl(.19,.85,[0,0,0],C.metal,[0,0,Math.PI/2]);
  for(let i=0;i<12;i++){const t=i/12*Math.PI*2;r.box([.72,.24,.65],[0,Math.sin(t)*1.61,Math.cos(t)*1.61],C.woodLight,.04,[t,0,0]);r.box([.12,3.22,.11],[0,0,0],C.wood,.01,[t,0,0]);}
  rueda.add(r.mesh());rueda.position.set(103.2,1.75,16);group.add(rueda);
  // En el navegador la utilería de arcilla se cambia por la de Blender (granja_pueblo.glb) apenas carga el kit
  conKit(group,'granja_pueblo.glb',m1=>conKit(group,'granja_edificios.glb',m2=>{const m=new Map([...m1,...m2]);const kit=utileriaPueblo(m,kitEdificios);if(!kit)return;group.add(kit);arcilla.removeFromParent();arcilla.geometry.dispose();(arcilla.material as THREE.Material).dispose();
   const ruedaKit=m.get('rueda_molino');if(ruedaKit){for(const c of [...rueda.children]){c.removeFromParent();const malla=c as THREE.Mesh;malla.geometry?.dispose();(malla.material as THREE.Material|undefined)?.dispose();}rueda.add(ruedaKit.clone(true));}}));
  const humo:THREE.Group[]=[];for(let i=0;i<4;i++){const g=new THREE.Group(),m=new THREE.Mesh(new THREE.SphereGeometry(.35,8,5),new THREE.MeshStandardMaterial({color:'#d0cbc0',roughness:1,transparent:true,opacity:.28,depthWrite:false}));g.add(m);g.userData.offset=i*.9;g.position.set(104.6,5.9,2.31);group.add(g);humo.push(g);}
  const agua=new THREE.Mesh(new THREE.TorusGeometry(.7,.025,5,28),new THREE.MeshStandardMaterial({color:'#cee5d6',roughness:.28}));agua.rotation.x=Math.PI/2;agua.position.set(84,.66,2);group.add(agua);
  const fuego=new THREE.Mesh(new THREE.SphereGeometry(.24,8,6),new THREE.MeshStandardMaterial({color:'#f5b064',emissive:'#db7835',emissiveIntensity:.2,roughness:.8}));fuego.position.set(100.4,.93,9.4);fuego.scale.set(.8,1.45,.75);group.add(fuego);
  group.userData.animacionPueblo={npcs,humo,rueda,agua,fuego} satisfies AnimationPueblo;
  group.userData.edificios=EDIFICIOS_PUEBLO;
  return group;
}

export function updatePueblo(group:THREE.Group,dt:number,time:number,jornada?:Jornada,resguardado=false){
  const a=group.userData.animacionPueblo as AnimationPueblo|undefined;if(!a)return;
  animarFuente(group,time);a.rueda.rotation.x+=Math.min(dt,.1)*.25;
  a.humo.forEach((g,i)=>{const phase=(time*.43+i*.83)%3.3;g.position.set(104.6+Math.sin(time*.3+i)*phase*.14,5.9+phase,2.31+phase*.17);g.scale.setScalar(.6+phase*.42);((g.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity=.25*(1-phase/3.3);});
  const pulse=.9+Math.sin(time*7)*.12;a.fuego.scale.set(.8,pulse*1.45,.75);a.agua.scale.setScalar(1+(time*.24)%1.35);
  a.npcs.forEach(g=>{
    const u=ubicacionAldeano(g.userData.npcId,jornada?.diasCompletados??0,jornada?.minutos??600,resguardado);if(!u)return;g.visible=u.visible;
    const walk=u.andando?1:0,phase=u.paso*3;g.position.set(u.x,alturaSueloPueblo(u.x,u.z)+Math.abs(Math.sin(phase*2))*.025*walk,u.z);g.rotation.y=u.direccion;
    const legs=g.userData.legs as THREE.Group[];legs.forEach((leg,j)=>leg.rotation.x=Math.sin(phase+j*Math.PI)*.38*walk);animarPeluche?.(g,dt,!!walk);
    g.userData.actividad=u.actividad;
  });
}

export function liberarPueblo(group:THREE.Group){
  sacarPeluches?.(group);
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
  group.traverse(o=>{if(!(o instanceof THREE.Mesh))return;geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);if(m instanceof THREE.MeshStandardMaterial){if(m.map)textures.add(m.map);if(m.bumpMap)textures.add(m.bumpMap);}}});
  textures.forEach(t=>{if(!t.userData.compartido)t.dispose();});geometries.forEach(g=>{if(!g.userData.compartido)g.dispose();});materials.forEach(m=>{if(!m.userData.compartido)m.dispose();});group.removeFromParent();delete group.userData.animacionPueblo;
}

/** Optional shared interior for a service. The house/hogar remains the host project's scene. */
export function crearInteriorServicio(servicio:ServicioPueblo,s?:EstadoGranja):THREE.Group {
  // Cascarón y muebles modelados en Blender (cuartos.ts); aquí solo se pone a quien atiende (y lo expuesto en el museo)
  const group=interiorLocal(servicio);if(VIVIENDAS_PUEBLO.some(v=>v.edificio===EDIFICIOS_PUEBLO.find(b=>b.servicio===servicio)?.id))puertaCuarto(group,3.2,-4,'#b38b65');if(servicio==='museo'&&s)exponerMuseo(group,s);
  const vecino=NPCS_PUEBLO.find(n=>n.oficio===servicio);if(vecino){const personaje=vecinoPeluche(vecino.id,NPCS_PUEBLO.indexOf(vecino));personaje.name='dependiente';personaje.userData.npcId=vecino.id;if(servicio==='museo')personaje.position.set(0,0,-2.55);else personaje.position.set(-.8,0,-2.7);group.add(personaje);}return group;
}

/** Interiores propios, agrupados en una malla de color por vivienda. */
export function crearInteriorVivienda(v:ViviendaPueblo){
 const g=new THREE.Group();g.name='interior-vivienda';const colores=v.ocupantes.map(id=>NPCS_PUEBLO.find(n=>n.id===id)?.color??C.cream);
 g.add(interiorVivienda(colores,v.tema));
 // Una puerta por cuarto, del color de quien vive ahí
 for(let i=0;i<v.ocupantes.length;i++)puertaCuarto(g,[-4.5,-1.5,1.5,4.5][i],-5,colores[i]);

 for(const id of v.ocupantes){const n=NPCS_PUEBLO.find(n=>n.id===id)!;const personaje=vecinoPeluche(n.id,NPCS_PUEBLO.indexOf(n));personaje.userData.npcId=id;personaje.userData.residente=true;const pos=posicionResidente(id);personaje.position.set(pos.x,0,pos.z);personaje.visible=false;g.add(personaje);}return g;
}
export function updateInteriorVivienda(g:THREE.Group,s:EstadoGranja,tiempo=0){const rain=lluviaRiega(tiempoDia(s.tiempo,s.jornada.diasCompletados));g.traverse(o=>{if(o.userData.residente){const u=ubicacionAldeano(o.userData.npcId,s.jornada.diasCompletados,s.jornada.minutos,rain);o.visible=u?.actividad==='hogar'&&visitaVivienda(s.jornada.minutos)&&(o.userData.privado?horaDormitorio(s.jornada.minutos):!horaDormitorio(s.jornada.minutos));o.scale.y=1+Math.sin(tiempo*2+(o.userData.seed??0))*.007;}});}

export function crearDormitorio(id:string){
 const n=NPCS_PUEBLO.find(n=>n.id===id)!,g=new THREE.Group();g.name='dormitorio';g.add(interiorDormitorio(n.color));
const residente=vecinoPeluche(n.id,NPCS_PUEBLO.indexOf(n));residente.userData.npcId=id;residente.userData.residente=true;residente.userData.privado=true;residente.position.set(0,0,0);residente.visible=false;g.add(residente);return g;
}
