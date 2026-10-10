import { dormitorioDef, horaDormitorio } from './dormitorios';
import type { EstadoGranja } from './estado';
import { tiempoDia, lluviaRiega } from './clima';
import { VIVIENDAS_PUEBLO, viviendaInterior, posicionResidente, visitaVivienda, type ViviendaPueblo } from './pueblo-datos';
import { ubicacionAldeano } from './aldeanos';
import { vecinoPeluche, animarVecino, sacarVecinos } from './vecinos3d';
import type { Jornada } from './jornada';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { EDIFICIOS_PUEBLO, NPCS_PUEBLO, CAMINOS_PUEBLO, alturaSueloPueblo, ARBOLES_PUEBLO, BANCOS_PUEBLO, PUENTES_PUEBLO, MOBILIARIO_SOLIDO, type ServicioPueblo, type EdificioPueblo } from './pueblo-datos';
export * from './pueblo-datos';
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
function sign(root:THREE.Group,e:EdificioPueblo,y=3.08){
  // Nine tiny sign textures are separate from the batched architecture; no external font download.
  if(typeof document==='undefined')return;
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#654832';ctx.fillRect(0,0,768,128);ctx.strokeStyle='#caa56e';ctx.lineWidth=5;ctx.strokeRect(9,9,750,110);
  ctx.fillStyle='#fff0ce';ctx.font='600 43px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e.nombre,384,65,722);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=2;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(e.ancho-.8,6.5),.8),new THREE.MeshStandardMaterial({map:tex,roughness:.9}));mesh.position.set(e.x+e.ancho/2,y,e.z+e.fondo+.21);root.add(mesh);
}
function building(a:Arcilla,root:THREE.Group,e:EdificioPueblo){
  const palettes:Record<string,[string,string,string]>={semillas:['#edc38f','#a56548','#809958'],animales:['#d7bf93','#699c91','#a95e4d'],carpinteria:['#caa77c','#656f50','#976b42'],herreria:['#b5b2a2','#637e8b','#525766'],clinica:['#e8e5c8','#78a492','#92ada4'],posada:['#ead6b0','#8f6976','#977346'],archivo:['#d8c7a8','#7d8399','#699181']};
  const [wall,roofColor,accent]=palettes[e.servicio],{x,z,ancho:w,fondo:d}=e,h=e.servicio==='posada'?4.65:3.7;
  a.box([w+.32,.42,d+.3],[x+w/2,.2,z+d/2],C.stone,.09);a.box([w,h-.3,d],[x+w/2,(h+.3)/2,z+d/2],wall,.09);
  for(const xx of [x+.06,x+w-.06])a.box([.2,h,.22],[xx,h/2,z+d+.04],C.beam);
  a.box([w+.12,.24,.25],[x+w/2,.72,z+d+.07],accent);a.box([w+.12,.22,.26],[x+w/2,h-.1,z+d+.07],C.beam);
  const doorX=x+w/2,front=z+d;
  a.box([1.6,2.6,.2],[doorX,1.58,front+.05],C.beam);a.box([1.28,2.32,.15],[doorX,1.56,front+.18],accent);
  for(let n=0;n<4;n++)a.box([.035,2.12,.04],[doorX-.48+n*.32,1.54,front+.28],C.beam);
  a.ball([.09,.09,.09],[doorX+.42,1.42,front+.32],'#e5c574');
  a.box([2.25,.2,1.1],[doorX,.12,front+.52],C.stone);a.box([2.55,.1,.65],[doorX,.055,front+1.05],C.stone);
  for(const side of [-1,1])windowFront(a,doorX+side*(w*.3),2,front+.08,accent,w>8?1.55:1.2);
  if(e.servicio==='posada'){
    for(const side of [-1,0,1])windowFront(a,doorX+side*2.8,3.78,front+.08,accent,1.0);
    a.box([w+.25,.21,.4],[doorX,2.7,front+.08],C.woodLight);
  }
  roof(a,x,z,w,d,h,roofColor);
  if(e.servicio!=='animales'){
    a.box([.9,2.7,1.05],[x+w*.8,h+.55,z+d*.33],e.servicio==='herreria'?C.darkStone:C.cream,.04);a.box([1.14,.23,1.2],[x+w*.8,h+1.97,z+d*.33],C.darkStone,.045);
  }
  for(const side of [-1,1])flowerpot(a,x+w/2+side*1.5,front+.6,e.servicio==='clinica'?'#c8d8bd':'#c59679',.32);
  sign(root,e,e.servicio==='posada'?5.05:3.19);
  // Side windows make the buildings feel complete when viewed from the orthographic camera.
  for(let j=0;j<2;j++){
    a.box([.14,1.3,1.15],[x+w+.035,2,z+1.55+j*(d-3)],C.beam);a.box([.12,1.06,.95],[x+w+.12,2,z+1.55+j*(d-3)],C.glass);
    a.box([.05,1.08,.07],[x+w+.19,2,z+1.55+j*(d-3)],C.cream);a.box([.05,.07,.98],[x+w+.19,2,z+1.55+j*(d-3)],C.cream);
  }
  if(e.servicio==='semillas'){
    for(const side of [-1,1]){const bx=doorX+side*2.6;
      a.box([2.55,.19,1.65],[bx,2.7,front+.85],side<0?'#899f69':'#d4aa68',.04,[-.12,0,0]);
      for(let i=0;i<5;i++)a.box([.24,.06,1.66],[bx-1.04+i*.52,2.75,front+.85],C.cream,.01,[-.12,0,0]);
      for(const s of [-1,1])a.cyl(.06,2.62,[bx+s*1.16,1.31,front+1.55],C.wood);
      crate(a,bx-.51,0,front+.92,side<0?'#df9360':'#879d5c');crate(a,bx+.51,0,front+.92,side<0?'#d9bc68':'#be7471');
    }
  }
  if(e.servicio==='carpinteria'){
    for(let row=0;row<3;row++)for(let i=0;i<4-row;i++){
      const lx=x+.2+i*.58+row*.29;a.cyl(.25,2.2,[lx,.28+row*.44,z+d+2.6],C.wood,[Math.PI/2,0,0]);a.cyl(.2,.025,[lx,.28+row*.44,z+d+3.71],C.woodLight,[Math.PI/2,0,0]);
    }
    a.box([2.8,.25,1.25],[x+w-1.15,1.07,z+d+2.25],C.woodLight);
    for(const s of [-1,1])a.box([.15,.95,1.08],[x+w-1.15+s*1.14,.47,z+d+2.25],C.beam);
    a.box([1.85,.09,.38],[x+w-1.15,1.25,z+d+2.25],C.cream);
    a.box([1.2,.04,.26],[x+w-1.1,1.36,z+d+2.15],C.metal,.01,[0,.3,0]);
    a.cyl(.46,1.15,[x+w+1.1,.6,z+d-1.1],C.woodLight);a.cyl(.48,.1,[x+w+1.1,1.22,z+d-1.1],C.wood);
  }
  if(e.servicio==='herreria'){
    a.box([1.8,1.62,1.42],[x+1.4,.82,z+d+1.7],C.darkStone);a.box([1.27,.73,.06],[x+1.4,.83,z+d+2.44],'#493f3b');
    a.box([1.02,.15,.5],[x+1.4,.5,z+d+2.42],'#ecab57');
    a.cyl(.48,.76,[x+w-1.25,.42,z+d+1.9],C.wood);a.box([1.65,.31,.66],[x+w-1.25,1.04,z+d+1.9],C.metal);
    a.box([.55,.54,.5],[x+w-1.25,.8,z+d+1.9],C.metal);a.cyl(.12,.7,[x+w-.95,1.46,z+d+1.9],C.wood,[0,0,.5]);a.box([.47,.23,.24],[x+w-.77,1.78,z+d+1.9],C.metal,.03,[0,0,.5]);
    for(let i=0;i<5;i++)a.ball([.23,.2,.22],[x-.3+hash(i)*.8,.19,z+d-1.3+hash(i,2)],i%2?'#98afa9':'#ae9279');
  }
  if(e.servicio==='clinica'){
    a.cyl(.46,.12,[doorX,h+.5,front+.16],'#dfe8d3',[Math.PI/2,0,0]);a.box([.13,.6,.09],[doorX,h+.5,front+.27],'#819e87');a.box([.56,.13,.09],[doorX,h+.5,front+.27],'#819e87');
    for(let i=0;i<4;i++)flowerpot(a,x+w+1.05,z+.9+i*1.45,'#bdd0b0',.43);
  }
  if(e.servicio==='archivo'){
    a.box([2.2,1.3,.22],[x-1.25,1.65,z+d],C.wood);for(const s of [-1,1])a.cyl(.08,2.25,[x-1.25+s*.85,1.12,z+d],C.wood);
    for(let i=0;i<3;i++)a.box([.52,.73,.03],[x-1.87+i*.62,1.66,z+d+.14],i%2?'#ddc7a3':'#eddfb6',.01,[0,0,(i-1)*.04]);
    for(let i=0;i<3;i++)crate(a,x+w+1.1,0,z+1.25+i*1.1);
  }
  if(e.servicio==='posada'){
    seat(a,x+1.3,z+d+1.4);a.cyl(.8,.12,[x+w-1.5,.95,z+d+1.7],C.woodLight);a.cyl(.1,.92,[x+w-1.5,.46,z+d+1.7],C.wood);
    for(const side of [-1,1]){a.cyl(.26,.12,[x+w-1.5+side*1.05,.51,z+d+1.7],C.woodLight);a.cyl(.08,.49,[x+w-1.5+side*1.05,.25,z+d+1.7],C.wood);}
    a.cyl(.16,.31,[x+w-1.5,1.17,z+d+1.7],C.cream);
  }
}
function shrine(a:Arcilla,root:THREE.Group,e:EdificioPueblo){
  const aura=e.servicio==='altar_aura',col=aura?'#d5b66a':'#9591ac',flower=aura?'#e8c460':'#c6b1d3',cx=e.x+2,cz=e.z+2;
  a.box([4.6,.16,4.7],[cx,.08,cz],C.stone,.11);a.box([3.3,.18,3.4],[cx,.24,cz],aura?'#e6d5b1':'#c1bbca',.11);
  for(const sx of [-1,1]){a.cyl(.18,2.65,[cx+sx*1.2,1.55,cz-.65],col);a.ball([.27,.23,.27],[cx+sx*1.2,2.91,cz-.65],col);}
  a.box([3.06,.2,.38],[cx,2.77,cz-.65],col,.08);a.box([3.1,.15,.44],[cx,2.96,cz-.65],aura?'#e5cd83':'#aaa3bb',.08);
  a.cyl(.64,.66,[cx,.65,cz],col);a.cyl(.86,.13,[cx,1.03,cz],C.cream);
  if(aura){a.ball([.24,.55,.24],[cx,1.62,cz],'#edbf62');a.ball([.16,.4,.16],[cx+.12,1.61,cz+.1],'#e58b58');a.ball([.13,.26,.13],[cx-.05,1.51,cz+.12],'#fff1b1');}
  else {a.cyl(.38,.075,[cx,1.57,cz],'#ddd5e9',[Math.PI/2,0,0]);a.ball([.22,.28,.09],[cx+.18,1.69,cz+.07],'#9591ac');}
  for(let i=0;i<10;i++){
    const angle=i*Math.PI*2/10,r=1.6,xx=cx+Math.cos(angle)*r,zz=cz+Math.sin(angle)*r;
    if(zz>cz+.9&&Math.abs(xx-cx)<.75)continue;a.cyl(.035,.45,[xx,.47,zz],C.green);for(let p=0;p<4;p++)a.ball([.12,.06,.12],[xx+Math.cos(p*Math.PI/2)*.1,.72,zz+Math.sin(p*Math.PI/2)*.1],flower);
  }
  sign(root,e,3.28);
}
function tree(a:Arcilla,x:number,z:number,h=3.5){
  a.cyl(.2,h*.67,[x,h*.335,z],C.wood,[0,0,-.05],.3);
  for(let i=0;i<4;i++){const t=i*2.4;a.ball([.93,h*.31,.88],[x+Math.cos(t)*.58,h*.77+hash(i,x)*.27,z+Math.sin(t)*.55],i%2?C.leaf:C.leafLight);}
  a.ball([.7,.8,.7],[x,h*1.12,z],C.leaf);
}
function path(a:Arcilla,x:number,z:number,w:number,d:number,variant=0){
  a.box([w+.2,.1,d+.2],[x+w/2,.018,z+d/2],'#93957c',.04);
  const cols=Math.ceil(w/.95),rows=Math.ceil(d/.95),dx=w/cols,dz=d/rows;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const tint=['#c9c2a7','#d3cbb3','#c3bda5','#d0c5ab'][(row+col+variant)%4];a.box([dx-.037,.055,dz-.037],[x+(col+.5)*dx,.088,z+(row+.5)*dz],tint,.025);
  }
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

interface AnimationPueblo { npcs:THREE.Group[]; humo:THREE.Group[]; rueda:THREE.Group; agua:THREE.Mesh; fuego:THREE.Mesh; }

/** Original compact village. Owns all geometry/materials; no V2 cache references. */
export function crearPueblo():THREE.Group {
  const group=new THREE.Group();group.name='pueblo';const a=new Arcilla();
  // A offset plaza and bent approach distinguish the layout from a copied map.
  for(const [x,z,w,d]of CAMINOS_PUEBLO)path(a,x,z,w,d);
  // Irregular paving of the civic square, with visible raised perimeter.
  a.cyl(7.15,.16,[84,.05,2],C.stone,[0,0,0]);a.cyl(6.94,.12,[84,.12,2],'#d3c8aa');
  for(let ring=0;ring<3;ring++)for(let i=0;i<24;i++){const t=i/24*Math.PI*2,r=3.2+ring*1.12;a.box([.86,.035,.72],[84+Math.sin(t)*r,.2,2+Math.cos(t)*r],i%3?'#d0c5aa':'#e0d5b9',.04,[0,t,0]);}
  a.cyl(2.23,.32,[84,.29,2],C.stone);a.cyl(1.95,.24,[84,.5,2],C.cream);a.cyl(1.75,.1,[84,.59,2],'#729d9d');a.cyl(.47,.86,[84,1.04,2],C.stone);a.cyl(.98,.2,[84,1.5,2],C.cream);a.cyl(.27,.83,[84,1.88,2],C.stone);a.ball([.29,.31,.29],[84,2.4,2],'#c5b27e');
  for(const v of VIVIENDAS_PUEBLO.filter(v=>!v.edificio)){building(a,group,{...v,servicio:({despertar:'clinica',calma:'archivo',ribera:'animales',senderos:'carpinteria',huerto:'clinica',escuela:'archivo',bosque:'carpinteria',tejidos:'posada',observatorio:'archivo',rosal:'clinica'} as Record<string,ServicioPueblo>)[v.tema],descripcion:'Vivienda de los habitantes del pueblo'});}
  for(const e of EDIFICIOS_PUEBLO)e.servicio.startsWith('altar')?shrine(a,group,e):building(a,group,e);
  // Animal-yard fence has a visible gate gap facing the plaza.
  fence(a,58,12,70,12);fence(a,58,21,70,21);fence(a,58,12,58,21);fence(a,70,12,70,15.4);fence(a,70,17.6,70,21);
  a.box([10.9,.075,8.15],[64,.025,16.5],'#98b575',.12);for(let i=0;i<32;i++){const xx=58.7+hash(i,2)*10.5,zz=12.5+hash(i,9)*8;a.ball([.15,.045,.12],[xx,.09,zz],i%3?'#a6ba7b':'#becc8e');}
  cow(a,61,15.5);cow(a,66,18,.63);chicken(a,66,14);chicken(a,67.1,15.5);chicken(a,62,19);
  a.box([1.8,.4,.65],[59.4,.25,19.8],C.woodLight);a.box([1.56,.08,.44],[59.4,.49,19.8],'#89adb4');
  for(let i=0;i<3;i++)a.cyl(.5,.8,[67+i*.63,.45,20.1],'#c8b679',[0,0,Math.PI/2]);
  // Narrow millrace; its banks and wheel are the inn's architectural landmark.
  a.box([3.5,.1,11],[106.1,.03,16.5],'#83aeb0',.15);for(const x of [104.2,108])a.box([.35,.33,11.3],[x,.15,16.5],C.stone);
  for(let i=0;i<11;i++)a.box([3.55,.09,.09],[106.1,.13,11.3+i*.95],i%2?'#a7c8c6':'#97bab9',.01);
  for(const zz of PUENTES_PUEBLO){fence(a,103.3,zz,109,zz);fence(a,103.3,zz+1.6,109,zz+1.6);}
  for(const [x,z,r]of BANCOS_PUEBLO)seat(a,x,z,r);
  for(const [x,z]of [[55,-8],[69,-6],[80,-10],[88,-6],[108,-6],[71,9],[92,8],[81,22],[102,23],[55,23]])lamp(a,x,z);
  // Flowerbeds are inset with a stone rim, leaving the main routes clear.
  for(const [x,z,w,d]of [[70,-13,2,5],[88,-20,1.8,8],[56,-21,1.4,13],[87,13,1.7,8],[73,7,2.5,3.2],[102,-14,2,5]] as [number,number,number,number][]){
    a.box([w+.2,.19,d+.2],[x+w/2,.08,z+d/2],C.stone,.07);a.box([w,.17,d],[x+w/2,.16,z+d/2],C.soil,.06);
    for(let i=0;i<Math.ceil(w*d*1.4);i++){const xx=x+.2+hash(i,x)*(w-.4),zz=z+.2+hash(i,z)*(d-.4);a.ball([.25,.25,.25],[xx,.36,zz],i%3?C.green:C.leaf);a.ball([.12,.085,.12],[xx,.61,zz],['#d4a0a1','#dec46b','#c8b0d5'][i%3]);}
  }
  for(const [x,z,h]of ARBOLES_PUEBLO)tree(a,x,z,h);
  // Low perimeter stones, flowers and signpost at the approach.
  for(let i=0;i<29;i++){const x=55+i*1.9;a.ball([.55,.27,.39],[x,.2,-28.1+hash(i)*.2],i%3?C.stone:'#b7b49b');}
  a.cyl(.13,2.5,[54,1.25,1.8],C.wood);a.box([2.2,.48,.13],[54,2.17,1.8],C.woodLight);a.box([1.7,.42,.13],[54,1.58,1.8],C.woodLight,.04,[0,0,-.09]);
  group.add(a.mesh());
  const npcs=NPCS_PUEBLO.map((n,i)=>{const g=vecinoPeluche(n.id,i);if(n.id==='nina'||n.id==='nino')g.scale.setScalar(.82);g.position.set(n.x,0,n.z);g.userData.origin={x:n.x,z:n.z};g.userData.npcId=n.id;group.add(g);return g;});
  const rueda=new THREE.Group(),r=new Arcilla();for(const xx of [-.29,.29]){r.add(new THREE.TorusGeometry(1.68,.12,6,24),C.wood,[xx,0,0],[0,Math.PI/2,0]);}
  r.cyl(.19,.85,[0,0,0],C.metal,[0,0,Math.PI/2]);
  for(let i=0;i<12;i++){const t=i/12*Math.PI*2;r.box([.72,.24,.65],[0,Math.sin(t)*1.61,Math.cos(t)*1.61],C.woodLight,.04,[t,0,0]);r.box([.12,3.22,.11],[0,0,0],C.wood,.01,[t,0,0]);}
  rueda.add(r.mesh());rueda.position.set(103.2,1.75,16);group.add(rueda);
  const humo:THREE.Group[]=[];for(let i=0;i<4;i++){const g=new THREE.Group(),m=new THREE.Mesh(new THREE.SphereGeometry(.35,8,5),new THREE.MeshStandardMaterial({color:'#d0cbc0',roughness:1,transparent:true,opacity:.28,depthWrite:false}));g.add(m);g.userData.offset=i*.9;g.position.set(104.6,5.9,2.31);group.add(g);humo.push(g);}
  const agua=new THREE.Mesh(new THREE.TorusGeometry(.7,.025,5,28),new THREE.MeshStandardMaterial({color:'#cee5d6',roughness:.28}));agua.rotation.x=Math.PI/2;agua.position.set(84,.66,2);group.add(agua);
  const fuego=new THREE.Mesh(new THREE.SphereGeometry(.24,8,6),new THREE.MeshStandardMaterial({color:'#f5b064',emissive:'#db7835',emissiveIntensity:.2,roughness:.8}));fuego.position.set(100.4,.93,9.4);fuego.scale.set(.8,1.45,.75);group.add(fuego);
  group.userData.animacionPueblo={npcs,humo,rueda,agua,fuego} satisfies AnimationPueblo;
  group.userData.edificios=EDIFICIOS_PUEBLO;
  return group;
}

export function updatePueblo(group:THREE.Group,dt:number,time:number,jornada?:Jornada,resguardado=false){
  const a=group.userData.animacionPueblo as AnimationPueblo|undefined;if(!a)return;
  a.rueda.rotation.x+=Math.min(dt,.1)*.25;
  a.humo.forEach((g,i)=>{const phase=(time*.43+i*.83)%3.3;g.position.set(104.6+Math.sin(time*.3+i)*phase*.14,5.9+phase,2.31+phase*.17);g.scale.setScalar(.6+phase*.42);((g.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity=.25*(1-phase/3.3);});
  const pulse=.9+Math.sin(time*7)*.12;a.fuego.scale.set(.8,pulse*1.45,.75);a.agua.scale.setScalar(1+(time*.24)%1.35);
  a.npcs.forEach(g=>{
    const u=ubicacionAldeano(g.userData.npcId,jornada?.diasCompletados??0,jornada?.minutos??600,resguardado);if(!u)return;g.visible=u.visible;
    const walk=u.andando?1:0,phase=u.paso*3;g.position.set(u.x,alturaSueloPueblo(u.x,u.z)+Math.abs(Math.sin(phase*2))*.025*walk,u.z);g.rotation.y=u.direccion;
    const legs=g.userData.legs as THREE.Group[];legs.forEach((leg,j)=>leg.rotation.x=Math.sin(phase+j*Math.PI)*.38*walk);animarVecino(g,dt,!!walk);
    g.userData.actividad=u.actividad;
  });
}

export function liberarPueblo(group:THREE.Group){
  sacarVecinos(group);
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
  group.traverse(o=>{if(!(o instanceof THREE.Mesh))return;geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);if(m instanceof THREE.MeshStandardMaterial&&m.map)textures.add(m.map);}});
  textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.removeFromParent();delete group.userData.animacionPueblo;
}

/** Optional shared interior for a service. The house/hogar remains the host project's scene. */
export function crearInteriorServicio(servicio:ServicioPueblo):THREE.Group {
  const group=new THREE.Group(),a=new Arcilla(),col=servicio==='herreria'?'#b7b3a4':servicio==='clinica'?'#dfdfc7':'#dfc8a7';
  a.box([9,.18,8],[0,-.04,0],C.woodLight,.02);for(let i=0;i<12;i++)a.box([9,.012,.035],[0,.057,-3.8+i*.67],C.wood,.001);
  a.box([9,2.9,.2],[0,1.43,-4],col);a.box([.2,2.9,8],[-4.5,1.43,0],col);a.box([9,.2,.25],[0,2.9,-3.99],C.wood);
  a.box([4.8,1.05,.9],[0,.55,-1.6],C.woodLight);a.box([5.05,.13,1.15],[0,1.14,-1.6],C.wood);
  for(const side of [-1,1]){a.box([1.4,2.55,.65],[side*3.5,1.28,-3.5],C.wood);for(let shelf=0;shelf<3;shelf++)a.box([1.3,.12,.8],[side*3.5,.4+shelf*.77,-3.42],C.woodLight);}
  if(servicio==='semillas'){for(let i=0;i<5;i++)crate(a,-2.8+i*1.4,0,-3.4,['#bd8b65','#d6b959','#8d9f5b'][i%3]);}
  else if(servicio==='herreria'){a.box([2.1,1.7,1.35],[2.3,.85,-3.2],C.darkStone);a.box([1.3,.7,.03],[2.3,.8,-2.5],'#e4a263');a.box([1.5,.25,.65],[0,1.4,-1.6],C.metal);}
  else if(servicio==='clinica'){a.box([1.5,.65,2.2],[2.5,.4,1],C.woodLight);a.box([1.65,.18,2.3],[2.5,.82,1],'#e9ecd8');a.box([1.2,.22,.5],[2.5,1,.24],'#b7caae');}
  else if(servicio==='animales'){fence(a,-3.8,.4,-.4,.4);fence(a,-.4,.4,-.4,3.2);chicken(a,-2.2,1.8);chicken(a,-1.2,2.6);flowerpot(a,3.6,2.8);}
  else if(servicio==='carpinteria'){a.box([2.6,.16,1.25],[1.8,1.02,1.2],C.woodLight);for(const s of [-1,1])a.box([.16,1,.95],[1.8+s, .49,1.2],C.wood);for(let i=0;i<3;i++)a.cyl(.17,2.5,[-2.8+i*.38,.22,1.4],C.wood,[Math.PI/2,0,0]);}
  else if(servicio==='posada'){for(const x of [-2.5,2.5]){a.cyl(.92,.13,[x,.95,1.4],C.woodLight);a.cyl(.11,.92,[x,.46,1.4],C.wood);seat(a,x,2.65);}}
  else {for(let i=0;i<12;i++)a.box([.16,.5+hash(i)*.2,.38],[-3.95+i*.083,.8,-3.1],['#a66959','#84927c','#b49b69'][i%3]);}
  group.add(a.mesh());const vecino=NPCS_PUEBLO.find(n=>n.oficio===servicio);if(vecino){const personaje=vecinoPeluche(vecino.id,NPCS_PUEBLO.indexOf(vecino));personaje.name='dependiente';personaje.userData.npcId=vecino.id;personaje.position.set(-.8,0,-2.7);group.add(personaje);}return group;
}

/** Interiores propios, agrupados en una malla de color por vivienda. */
export function crearInteriorVivienda(v:ViviendaPueblo){
 const g=new THREE.Group(),a=new Arcilla();g.name='interior-vivienda';const color=NPCS_PUEBLO.find(n=>n.id===v.ocupantes[0])?.color??C.cream;
 a.box([12,.18,10],[0,-.08,0],C.woodLight);for(let i=0;i<20;i++)a.box([12,.012,.025],[0,.02,-4.8+i*.5],C.wood,0);
 a.box([12,3,.18],[0,1.5,-5],C.cream);a.box([.18,3,10],[-6,1.5,0],'#dfcdb0');for(const x of [-5.8,0,5.8])a.box([.18,3,.2],[x,1.5,-4.88],C.beam);
 for(const x of [-3,3])windowFront(a,x,1.9,-4.8,color,1.5);
 a.box([5,.025,2.5],[0,.025,2],color,0);for(const x of [-2.4,2.4])a.box([.04,.015,2.4],[x,.045,2],C.cream,0);
 for(let i=0;i<v.ocupantes.length;i++){const x=[-4.5,-1.5,1.5,4.5][i],n=NPCS_PUEBLO.find(n=>n.id===v.ocupantes[i])!;a.box([1.65,2.5,.18],[x,1.25,-4.8],C.beam);a.box([1.4,2.3,.13],[x,1.2,-4.65],n.color);for(let j=0;j<4;j++)a.box([.035,2.05,.04],[x-.5+j*.33,1.2,-4.55],C.wood);a.ball([.08,.08,.08],[x+.42,1.2,-4.53],'#d9bc76');}

 a.box([2.4,.16,1.6],[-1,.9,-.7],C.woodLight);for(const x of [-2,-.0])for(const z of [-1.3,-.1])a.box([.14,.8,.14],[x,.4,z],C.wood);
 a.cyl(.22,.09,[-1,.99,-.7],'#e6ceb0');a.cyl(.13,.3,[-.5,1.1,-.7],color);a.box([1.6,2.3,1.8],[4.5,1.15,0],C.wood);for(let i=0;i<3;i++)a.box([1.65,.1,1.85],[4.5,.3+i*.7,0],C.woodLight);
 for(let i=0;i<6;i++)a.box([.13,.45,.5],[3.9+i*.2,.59,-.25],i%2?color:C.cream);
 flowerpot(a,-5,2.7,color,.35);flowerpot(a,5,3,color,.35);
 if(['huerto','jardin','corral','despertar','bosque','rosal'].includes(v.tema))for(let i=0;i<3;i++)flowerpot(a,-4+i*.65,-1.5,color,.24);
 if(['roble','forja','senderos','ribera'].includes(v.tema)){a.box([1.6,.08,.65],[-4,1.1,0],C.wood);a.cyl(.12,.8,[-4,1.25,0],C.metal,[0,0,Math.PI/2]);}
 if(['archivo','escuela','observatorio','calma'].includes(v.tema)){for(let i=0;i<4;i++)a.box([.5,.1,.7],[-4,.2+i*.12,0],i%2?color:C.cream);if(v.tema==='observatorio'){for(let i=0;i<3;i++){const t=i*Math.PI*2/3;a.box([.07,1,.07],[-4+Math.sin(t)*.24,.5,-1+Math.cos(t)*.24],C.metal,0,[Math.cos(t)*.4,0,Math.sin(t)*.4]);}a.cyl(.16,.16,[-4,1,-1],C.metal);a.cyl(.19,1.3,[-4,1.3,-1],C.metal,[Math.PI/2,0,.2]);a.ball([.12,.12,.03],[-4,1.3,-.33],C.glass);}}
 if(['molino','tejidos'].includes(v.tema)){a.box([1.8,.8,.5],[-4,.5,0],C.wood);a.box([1.5,.1,1.2],[-4,1.3,0],color);}
 for(const x of [-1,1])a.box([.15,2.7,.15],[x,1.35,4.8],C.beam);a.box([2.15,.2,.2],[0,2.6,4.8],C.woodLight);
 const room=a.mesh();room.name='mobiliario-vivienda';g.add(room);
 for(const id of v.ocupantes){const n=NPCS_PUEBLO.find(n=>n.id===id)!;const personaje=vecinoPeluche(n.id,NPCS_PUEBLO.indexOf(n));personaje.userData.npcId=id;personaje.userData.residente=true;const pos=posicionResidente(id);personaje.position.set(pos.x,0,pos.z);personaje.visible=false;g.add(personaje);}return g;
}
export function updateInteriorVivienda(g:THREE.Group,s:EstadoGranja,tiempo=0){const rain=lluviaRiega(tiempoDia(s.tiempo,s.jornada.diasCompletados));g.traverse(o=>{if(o.userData.residente){const u=ubicacionAldeano(o.userData.npcId,s.jornada.diasCompletados,s.jornada.minutos,rain);o.visible=u?.actividad==='hogar'&&visitaVivienda(s.jornada.minutos)&&(o.userData.privado?horaDormitorio(s.jornada.minutos):!horaDormitorio(s.jornada.minutos));o.scale.y=1+Math.sin(tiempo*2+(o.userData.seed??0))*.007;}});}

export function crearDormitorio(id:string){
 const n=NPCS_PUEBLO.find(n=>n.id===id)!,a=new Arcilla(),g=new THREE.Group();g.name='dormitorio';const color=n.color;
 a.box([8,.18,8],[0,-.08,0],C.woodLight);for(let i=0;i<16;i++)a.box([8,.012,.025],[0,.02,-3.8+i*.5],C.wood,0);
 a.box([8,3,.18],[0,1.5,-4],C.cream);a.box([.18,3,8],[-4,1.5,0],'#dfcdb0');windowFront(a,0,1.9,-3.85,color,1.6);
 for(const x of [-3.8,3.8])a.box([.16,3,.2],[x,1.5,-3.85],C.beam);
 a.box([1.6,.6,2],[-2.5,.3,-2.6],C.wood);a.box([1.5,.22,1.9],[-2.5,.7,-2.6],C.cream);a.box([1.5,.1,1.3],[-2.5,.84,-2.3],color);a.box([1.1,.18,.4],[-2.5,.92,-3.2],C.white);a.box([1.7,1.1,.16],[-2.5,.55,-3.6],C.wood);
 a.box([1.8,.13,1.1],[2.4,.9,-2.2],C.woodLight);for(const x of [1.65,3.15])for(const z of [-2.6,-1.8])a.box([.12,.85,.12],[x,.45,z],C.wood);a.box([.6,.025,.45],[2.3,1,-2.2],C.cream);a.cyl(.1,.24,[2.9,1.06,-2.2],color);a.cyl(.06,.35,[2.9,1.2,-2.2],C.wood,[0,0,.25]);
 a.box([.7,2.1,1.4],[-3.3,1.05,.2],C.wood);for(let i=0;i<3;i++){a.box([.8,.1,1.5],[-3.3,.3+i*.7,.2],C.woodLight);for(let j=0;j<4;j++)a.box([.45,.42,.12],[-3.15,.55+i*.7,-.25+j*.26],j%2?color:C.cream);}
 a.box([3.1,.025,2.3],[0,.03,1.1],color,0);for(const x of [-1.45,1.45])a.box([.04,.02,2.2],[x,.05,1.1],C.cream,0);flowerpot(a,3,2.2,color,.32);
 for(const x of [-1,1])a.box([.15,2.6,.15],[x,1.3,3.9],C.beam);a.box([2.15,.2,.2],[0,2.6,3.9],C.woodLight);
 const m=a.mesh();m.name='mobiliario-dormitorio';g.add(m);const residente=vecinoPeluche(n.id,NPCS_PUEBLO.indexOf(n));residente.userData.npcId=id;residente.userData.residente=true;residente.userData.privado=true;residente.position.set(0,0,0);residente.visible=false;g.add(residente);return g;
}
