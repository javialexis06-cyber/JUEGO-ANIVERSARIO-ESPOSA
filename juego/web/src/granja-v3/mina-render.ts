import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { temaMina, varianteMina, type InstanciaAventura, type TemaMina, type VarianteMina } from './aventura';

/** Arte de los pisos de las Minas de Celia: piso con textura, paredes de roca con vetas (altas atrás, bajitas del lado
 * de la cámara), decorado por tipo de piso (tierra, hielo, lava, fondo, caverna; hongos y cristales), la escalera
 * escondida, la de subida y los cofres. Solo dibuja: las reglas están en aventura.ts. */

export interface PaletaMina { piso:string; juntas:string; roca:string; rocaClara:string; veta:string; brillo:string; luz:string; fondo:string; niebla:string; deco:string[] }
const PALETAS:Record<TemaMina,PaletaMina>={
 tierra:{piso:'#9a8670',juntas:'#6d5c4b',roca:'#6b5a4c',rocaClara:'#9a8572',veta:'#c98b5a',brillo:'#ffcf8a',luz:'#ffc788',fondo:'#1d1714',niebla:'#2b221d',deco:['#e6a86a','#c9c2b0','#b98a5c']},
 hielo:{piso:'#b9d3df',juntas:'#7f9fb2',roca:'#6c8aa0',rocaClara:'#b9d6e6',veta:'#e8f8ff',brillo:'#bfeaff',luz:'#c6ecff',fondo:'#121c26',niebla:'#1c2a36',deco:['#d4f2ff','#9fd6f0','#ffffff']},
 lava:{piso:'#5e4741',juntas:'#2c1d1a',roca:'#3e2d29',rocaClara:'#6b4c43',veta:'#ff7a32',brillo:'#ff9a4a',luz:'#ffa56a',fondo:'#1b0d0a',niebla:'#2a1410',deco:['#ff8a3d','#ffc35a','#ff5a2a']},
 fondo:{piso:'#7d7688',juntas:'#4f4858',roca:'#4a4456',rocaClara:'#7d7590',veta:'#e8c8ff',brillo:'#f0d8ff',luz:'#ead6ff',fondo:'#16121c',niebla:'#211a2a',deco:['#e8c8ff','#f6e3a1','#bfa6f0']},
 caverna:{piso:'#4f4762',juntas:'#2b2538',roca:'#2f2940',rocaClara:'#5b5276',veta:'#b48cff',brillo:'#c9a8ff',luz:'#c7b2ff',fondo:'#0d0a14',niebla:'#171222',deco:['#b48cff','#7fe3d6','#e0b8ff']},
};
export function paletaMina(i:InstanciaAventura):PaletaMina&{tema:TemaMina;variante:VarianteMina}{
 const tema=temaMina(i.nivel),variante=varianteMina(i.nivel,i.semilla),p={...PALETAS[tema]};
 if(variante==='hongos'){p.luz='#c8ffb0';p.deco=['#9ef08a','#6fe0c8','#f0a0e0'];}
 if(variante==='cristal'){p.deco=['#7fe3d6','#b48cff','#ffd2f2'];p.luz='#d7c8ff';}
 return {...p,tema,variante};
}

const hash=(x:number,z:number,k=0)=>{const n=Math.sin(x*127.1+z*311.7+k*74.7)*43758.5453;return n-Math.floor(n);};
const texturas=new Map<string,THREE.Texture>();
/** Piso de roca pintado (lajas, grietas, gravilla; brasas en la lava, escarcha en el hielo). Un metro por baldosa. */
function texturaPiso(tema:TemaMina,p:PaletaMina){
 const clave=tema;let t=texturas.get(clave);if(t)return t;
 const T=256,c=document.createElement('canvas');c.width=c.height=T;const ctx=c.getContext('2d')!;
 ctx.fillStyle=p.juntas;ctx.fillRect(0,0,T,T);
 // Lajas irregulares (2 × 2 por metro) con su luz arriba a la izquierda
 for(let j=0;j<1;j++)for(let i=0;i<1;i++){const x=3+hash(i,j,1)*4,y=3+hash(i,j,2)*4,w=T-7-hash(i,j,3)*5,h=T-7-hash(i,j,4)*5;
  const g=ctx.createLinearGradient(x,y,x+w,y+h);const base=new THREE.Color(p.piso).multiplyScalar(.9+hash(i,j,5)*.2);g.addColorStop(0,'#'+base.clone().lerp(new THREE.Color('#ffffff'),.12).getHexString());g.addColorStop(1,'#'+base.clone().multiplyScalar(.85).getHexString());
  ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,w,h,40);ctx.fill();}
 // Una laja por baldosa, con juntas finitas: el piso no se ve cuadriculado
 ctx.fillStyle=p.piso;ctx.globalAlpha=.35;ctx.fillRect(0,0,T,T);ctx.globalAlpha=1;
 for(let k=0;k<420;k++){const x=hash(k,1,7)*T,y=hash(k,2,7)*T,r=.6+hash(k,3,7)*1.8;ctx.fillStyle=k%3?'#00000030':'#ffffff26';ctx.beginPath();ctx.arc(x,y,r,0,6.3);ctx.fill();}
 ctx.strokeStyle='#00000045';ctx.lineWidth=1.2;for(let k=0;k<6;k++){let x=hash(k,4,9)*T,y=hash(k,5,9)*T;ctx.beginPath();ctx.moveTo(x,y);for(let s=0;s<4;s++){x+=(hash(k,s,10)-.5)*36;y+=(hash(k,s,11)-.5)*36;ctx.lineTo(x,y);}ctx.stroke();}
 if(tema==='lava'){ctx.strokeStyle='#ff7a32';ctx.lineWidth=2.2;ctx.shadowColor='#ffb060';ctx.shadowBlur=6;for(let k=0;k<3;k++){let x=hash(k,7,12)*T,y=hash(k,8,12)*T;ctx.beginPath();ctx.moveTo(x,y);for(let s=0;s<5;s++){x+=(hash(k,s,13)-.5)*50;y+=(hash(k,s,14)-.5)*50;ctx.lineTo(x,y);}ctx.stroke();}ctx.shadowBlur=0;}
 if(tema==='hielo'){for(let k=0;k<40;k++){const x=hash(k,9,15)*T,y=hash(k,10,15)*T;ctx.strokeStyle='#ffffff55';ctx.lineWidth=1;ctx.beginPath();for(let a=0;a<3;a++){const an=a*Math.PI/3;ctx.moveTo(x-Math.cos(an)*4,y-Math.sin(an)*4);ctx.lineTo(x+Math.cos(an)*4,y+Math.sin(an)*4);}ctx.stroke();}}
 t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.userData.compartido=true;texturas.set(clave,t);return t;
}

/** Roca de pared: bola deformada con ruido, vetas por altura (colores por vértice), suave como fieltro. */
function geoRoca(semilla:number,p:PaletaMina){
 let g:THREE.BufferGeometry=new THREE.IcosahedronGeometry(1,2);g.deleteAttribute('normal');g.deleteAttribute('uv');g=mergeVertices(g);
 const pos=g.attributes.position,col=new Float32Array(pos.count*3),roca=new THREE.Color(p.roca),clara=new THREE.Color(p.rocaClara),veta=new THREE.Color(p.veta),hondo=new THREE.Color(p.fondo);
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),n=1+.22*Math.sin(x*3.3+semilla)*Math.sin(y*2.9+semilla*1.7)*Math.sin(z*3.1+semilla*.6)+.08*Math.sin(x*9+z*7+semilla);
  pos.setXYZ(i,x*n,y*n,z*n);const banda=Math.sin(y*6.5+x*1.2+semilla)*.5+.5,c=roca.clone().lerp(clara,banda*.6);if(banda>.88)c.lerp(veta,.55);c.lerp(hondo,THREE.MathUtils.clamp(-y*.5,0,.5));col.set([c.r,c.g,c.b],i*3);}
 g.setAttribute('color',new THREE.BufferAttribute(col,3));g.translate(0,.55,0);g.computeVertexNormals();return g;
}
function geoCristal(){const partes:THREE.BufferGeometry[]=[];for(let k=0;k<4;k++){const h=.35+k*.13,b=new THREE.CylinderGeometry(.07,.09,h*.75,6).translate(0,h*.37,0),pu=new THREE.ConeGeometry(.07,h*.3,6).translate(0,h*.75+h*.15,0);const m=mergeGeometries([b.toNonIndexed(),pu.toNonIndexed()])!;m.rotateZ((k-1.5)*.32);m.rotateX(((k*7)%3-1)*.25);m.translate((k-1.5)*.08,0,((k*5)%3-1)*.06);partes.push(m);}
 const g=mergeGeometries(partes)!;g.deleteAttribute('uv');return g;}
function geoHongo(){const pie=new THREE.CylinderGeometry(.05,.07,.32,7).translate(0,.16,0),som=new THREE.SphereGeometry(.2,10,6,0,Math.PI*2,0,Math.PI/2).translate(0,.3,0);const g=mergeGeometries([pie.toNonIndexed(),som.toNonIndexed()])!;g.deleteAttribute('uv');return g;}

/** Cara de acantilado (como Stardew): capas de piedras redondeadas con sombra abajo, grietas y algún brillo de veta.
 * Un metro de ancho por toda la altura de la pared. */
function texturaAcantilado(tema:TemaMina,p:PaletaMina){
 const clave='acantilado:'+tema;let t=texturas.get(clave);if(t)return t;
 const W=128,H=320,c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d')!;
 const base=new THREE.Color(p.roca),clara=new THREE.Color(p.rocaClara),honda=new THREE.Color(p.fondo);
 const g0=ctx.createLinearGradient(0,0,0,H);g0.addColorStop(0,'#'+base.clone().lerp(honda,.25).getHexString());g0.addColorStop(1,'#'+base.clone().lerp(honda,.55).getHexString());ctx.fillStyle=g0;ctx.fillRect(0,0,W,H);
 // Hileras de piedras: más grandes abajo, con luz arriba y sombra abajo (relieve pintado)
 let y=4;let fila=0;while(y<H){const alto=22+hash(fila,1,20)*16+(y/H)*10;let x=-hash(fila,2,20)*30;let k=0;
  while(x<W+10){const ancho=26+hash(fila,k,21)*30;const tono=base.clone().lerp(clara,.15+hash(fila,k,22)*.45).lerp(honda,(y/H)*.35);
   const gx=ctx.createLinearGradient(0,y,0,y+alto);gx.addColorStop(0,'#'+tono.clone().lerp(new THREE.Color('#ffffff'),.18).getHexString());gx.addColorStop(.55,'#'+tono.getHexString());gx.addColorStop(1,'#'+tono.clone().lerp(honda,.45).getHexString());
   ctx.fillStyle=gx;ctx.beginPath();ctx.roundRect(x+1.5,y+1.5,ancho-3,alto-3,Math.min(10,alto/2.4));ctx.fill();
   for(const dx of [-W,W]){ctx.save();ctx.translate(dx,0);ctx.fillStyle=gx;ctx.beginPath();ctx.roundRect(x+1.5,y+1.5,ancho-3,alto-3,Math.min(10,alto/2.4));ctx.fill();ctx.restore();}
   x+=ancho;k++;}
  y+=alto;fila++;}
 // Grietas, motitas y vetas que brillan
 ctx.strokeStyle='#00000055';ctx.lineWidth=1.3;for(let k=0;k<5;k++){let x=hash(k,3,23)*W,yy=hash(k,4,23)*H;ctx.beginPath();ctx.moveTo(x,yy);for(let s=0;s<4;s++){x+=(hash(k,s,24)-.5)*22;yy+=8+hash(k,s,25)*18;ctx.lineTo(x,yy);}ctx.stroke();}
 for(let k=0;k<260;k++){ctx.fillStyle=k%3?'#00000026':'#ffffff1c';ctx.fillRect(hash(k,5,26)*W,hash(k,6,26)*H,1.5,1.5);}
 ctx.shadowColor=p.brillo;ctx.shadowBlur=8;ctx.fillStyle=p.veta;for(let k=0;k<4;k++){const x=10+hash(k,7,27)*(W-20),yy=30+hash(k,8,27)*(H-80);ctx.beginPath();ctx.ellipse(x,yy,3+hash(k,9,27)*3,2,hash(k,10,27)*3,0,6.3);ctx.fill();}ctx.shadowBlur=0;
 // Base oscura (oclusión donde la pared toca el piso)
 const g1=ctx.createLinearGradient(0,H-46,0,H);g1.addColorStop(0,'#00000000');g1.addColorStop(1,'#000000aa');ctx.fillStyle=g1;ctx.fillRect(0,H-46,W,46);
 t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.RepeatWrapping;t.anisotropy=4;t.userData.compartido=true;texturas.set(clave,t);return t;
}
/** Techo de la roca (lo que se ve desde arriba): oscuro y con textura suave, como la masa negra de Stardew. */
function texturaTecho(tema:TemaMina,p:PaletaMina,borde:boolean){
 const clave='techo:'+tema+borde;let t=texturas.get(clave);if(t)return t;
 const T=128,c=document.createElement('canvas');c.width=c.height=T;const ctx=c.getContext('2d')!;
 const base=new THREE.Color(p.roca).lerp(new THREE.Color(p.fondo),borde?.35:.7);ctx.fillStyle='#'+base.getHexString();ctx.fillRect(0,0,T,T);
 for(let k=0;k<26;k++){const x=hash(k,1,30)*T,y=hash(k,2,30)*T,r=8+hash(k,3,30)*16;const g=ctx.createRadialGradient(x-r*.3,y-r*.3,1,x,y,r);g.addColorStop(0,'#ffffff'+(borde?'22':'12'));g.addColorStop(1,'#00000000');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.3);ctx.fill();}
 for(let k=0;k<160;k++){ctx.fillStyle=k%2?'#0000002a':'#ffffff10';ctx.fillRect(hash(k,4,31)*T,hash(k,5,31)*T,2,2);}
 t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.userData.compartido=true;texturas.set(clave,t);return t;
}

const ALTO_PARED=2.6,ALTO_REPISA=.3;
/** Terreno del piso con la estrategia de Stardew: toda la roca es una masa sólida (nada de vacío). Detrás del piso
 * se ve la cara del acantilado; del lado de la cámara la roca baja a una repisa que no tapa al jugador. */
export function terrenoMina(i:InstanciaAventura):THREE.Group{
 const g=new THREE.Group(),p=paletaMina(i),o=new THREE.Object3D(),piso:[number,number][]=[],altos:[number,number][]=[],repisas:[number,number][]=[];
 const es=(x:number,z:number)=>i.suelos[`${x},${z}`]==='suelo';
 for(const [k,t] of Object.entries(i.suelos)){const [x,z]=k.split(',').map(Number);if(t==='suelo'){piso.push([x,z]);continue;}
  // ¿Hay piso detrás (hacia el fondo de la pantalla) a menos de 4 casillas? Entonces esta roca va bajita
  let tapa=false;for(let dz=0;dz<=3&&!tapa;dz++)for(let dx=0;dx<=3;dx++)if((dx||dz)&&es(x-dx,z-dz)){tapa=true;break;}
  (tapa?repisas:altos).push([x,z]);}
 // Piso: losas con textura; más oscuras junto a la pared (sombra de contacto)
 const losas=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.12,1),new THREE.MeshStandardMaterial({map:texturaPiso(p.tema,p),roughness:p.tema==='hielo'?.35:.95,...(p.tema==='lava'?{emissive:'#ff5a1a',emissiveMap:texturaPiso(p.tema,p),emissiveIntensity:.18}:{})}),piso.length);
 piso.forEach(([x,z],n)=>{o.position.set(x+.5,-.08,z+.5);o.rotation.set(0,((x*3+z*5)&3)*Math.PI/2,0);o.scale.set(1,1,1);o.updateMatrix();losas.setMatrixAt(n,o.matrix);
  const junto=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dz])=>!es(x+dx,z+dz)).length;losas.setColorAt(n,new THREE.Color('#ffffff').multiplyScalar((.92+hash(x,z)*.14)*(1-junto*.09)));});
 losas.receiveShadow=true;g.add(losas);
 // Roca alta: caras de acantilado a los lados y techo oscuro arriba
 const cara=new THREE.MeshStandardMaterial({map:texturaAcantilado(p.tema,p),roughness:.9}),techo=new THREE.MeshStandardMaterial({map:texturaTecho(p.tema,p,false),roughness:1}),techoBorde=new THREE.MeshStandardMaterial({map:texturaTecho(p.tema,p,true),roughness:1});
 const bloque=new THREE.BoxGeometry(1,ALTO_PARED,1).translate(0,ALTO_PARED/2,0);
 const mAltos=new THREE.InstancedMesh(bloque,[cara,cara,techo,techo,cara,cara],altos.length);
 altos.forEach(([x,z],n)=>{o.position.set(x+.5,0,z+.5);o.rotation.set(0,0,0);o.scale.set(1,1+hash(x,z,2)*.06,1);o.updateMatrix();mAltos.setMatrixAt(n,o.matrix);mAltos.setColorAt(n,new THREE.Color('#ffffff').multiplyScalar(.9+hash(x,z,3)*.2));});
 mAltos.castShadow=true;mAltos.receiveShadow=true;g.add(mAltos);
 const repisa=new THREE.BoxGeometry(1,ALTO_REPISA,1).translate(0,ALTO_REPISA/2,0);
 const mRepisas=new THREE.InstancedMesh(repisa,[cara,cara,techoBorde,techoBorde,cara,cara],repisas.length);
 repisas.forEach(([x,z],n)=>{o.position.set(x+.5,0,z+.5);o.scale.set(1,1,1);o.updateMatrix();mRepisas.setMatrixAt(n,o.matrix);mRepisas.setColorAt(n,new THREE.Color('#ffffff').multiplyScalar(.85+hash(x,z,4)*.2));});
 mRepisas.receiveShadow=true;g.add(mRepisas);
 // Bordes orgánicos: rocas sueltas al pie del acantilado y sobre el canto, para que no se vea cuadriculado
 const pie:{x:number;z:number;s:number;y:number}[]=[];
 for(const [x,z] of piso){for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){if(es(x+dx,z+dz))continue;const k=hash(x*3+dx,z*3+dz,5);if(k>.55)continue;
  pie.push({x:x+.5+dx*.42+(hash(x,z,6)-.5)*.5*(dz?1:0),z:z+.5+dz*.42+(hash(x,z,7)-.5)*.5*(dx?1:0),s:.16+k*.3,y:0});}}
 for(const [x,z] of altos)if(es(x+1,z)||es(x,z+1)||es(x-1,z)||es(x,z-1)){if(hash(x,z,8)<.5)pie.push({x:x+.5+(hash(x,z,9)-.5)*.6,z:z+.5+(hash(x,z,10)-.5)*.6,s:.22+hash(x,z,11)*.25,y:ALTO_PARED});}
 const geoPiedra=geoRoca(1.7,p),mPie=new THREE.InstancedMesh(geoPiedra,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9}),Math.max(1,pie.length));mPie.count=pie.length;
 pie.forEach((r,n)=>{o.position.set(r.x,r.y-r.s*.25,r.z);o.rotation.set(0,hash(n,r.s,12)*6.3,0);o.scale.set(r.s*1.2,r.s*(r.y?.6:1),r.s);o.updateMatrix();mPie.setMatrixAt(n,o.matrix);});
 mPie.castShadow=true;g.add(mPie);
 // Decorado por tipo de piso: cristales u hongos que brillan junto a las paredes
 const orillas=piso.filter(([x,z])=>(!es(x+1,z)||!es(x-1,z)||!es(x,z+1)||!es(x,z-1))&&Math.hypot(x+.5-i.inicio.x,z+.5-i.inicio.z)>3);
 const n=Math.min(orillas.length,p.variante==='cristal'||p.variante==='hongos'?90:40),elegidas=orillas.filter((_,k)=>hash(k,i.nivel,11)<n/Math.max(1,orillas.length));
 const deco=p.variante==='hongos'||p.tema==='tierra'&&p.variante==='normal'?geoHongo():geoCristal(),brilla=p.variante!=='normal'||p.tema!=='tierra';
 const im=new THREE.InstancedMesh(deco,new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.3,emissive:brilla?p.brillo:'#000000',emissiveIntensity:brilla?.55:0}),Math.max(1,elegidas.length));im.count=elegidas.length;
 elegidas.forEach(([x,z],k)=>{o.position.set(x+.2+hash(x,z,12)*.6,0,z+.2+hash(x,z,13)*.6);o.rotation.set(0,hash(x,z,14)*6.3,0);o.scale.setScalar(.8+hash(x,z,15)*1.1);o.updateMatrix();im.setMatrixAt(k,o.matrix);im.setColorAt(k,new THREE.Color(p.deco[k%p.deco.length]));});
 g.add(im);
 // Luces: la de llegada y unas pocas del color del piso
 const llegada=new THREE.PointLight(p.luz,8,16,1.4);llegada.position.set(i.inicio.x,3.5,i.inicio.z);g.add(llegada);
 const salas=piso.filter((_,k)=>k%Math.max(1,Math.floor(piso.length/3))===0).slice(1,4);for(const [x,z] of salas){const l=new THREE.PointLight(p.brillo,4,12,1.6);l.position.set(x+.5,3,z+.5);g.add(l);}
 return g;
}

/** Escalera de bajada (un hueco con su escalera de madera) o de subida (escalera de cuerda con luz de arriba). */
export function escaleraMina(tipo:'retorno'|'descenso'):THREE.Group{
 const g=new THREE.Group(),madera=new THREE.MeshStandardMaterial({color:'#8a6242',roughness:.9});
 if(tipo==='descenso'){
  const hueco=new THREE.Mesh(new THREE.CircleGeometry(.62,20),new THREE.MeshBasicMaterial({color:'#07060a'}));hueco.rotation.x=-Math.PI/2;hueco.position.y=.012;g.add(hueco);
  const borde=new THREE.Mesh(new THREE.TorusGeometry(.64,.09,6,20),new THREE.MeshStandardMaterial({color:'#6d6258',roughness:.95}));borde.rotation.x=-Math.PI/2;borde.position.y=.03;g.add(borde);
  for(const s of [-1,1]){const lado=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,1.1),madera);lado.position.set(s*.2,.06,-.05);lado.rotation.x=-.5;g.add(lado);}
  for(let k=0;k<4;k++){const p=new THREE.Mesh(new THREE.BoxGeometry(.42,.04,.05),madera);p.position.set(0,.2-k*.11,-.38+k*.2);g.add(p);}
  const aro=new THREE.Mesh(new THREE.RingGeometry(.7,.86,28),new THREE.MeshBasicMaterial({color:'#f6cf5a',transparent:true,opacity:.55,depthWrite:false}));aro.rotation.x=-Math.PI/2;aro.position.y=.035;aro.name='aro-escalera';g.add(aro);
 }else{
  for(const s of [-1,1]){const lado=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,3.2,6),madera);lado.position.set(s*.22,1.6,-.25);g.add(lado);}
  for(let k=0;k<9;k++){const p=new THREE.Mesh(new THREE.BoxGeometry(.5,.04,.05),madera);p.position.set(0,.25+k*.33,-.25);g.add(p);}
  const luz=new THREE.Mesh(new THREE.CircleGeometry(1.1,24),new THREE.MeshBasicMaterial({color:'#fff1c8',transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}));luz.rotation.x=-Math.PI/2;luz.position.y=.02;g.add(luz);
 }
 return g;
}
/** Cofre de premio (pisos 10, 20 … 100). */
export function cofreMina():THREE.Group{
 const g=new THREE.Group(),madera=new THREE.MeshStandardMaterial({color:'#9a5f34',roughness:.8}),oro=new THREE.MeshStandardMaterial({color:'#f2c14e',roughness:.35,metalness:.6,emissive:'#7a5a10',emissiveIntensity:.25});
 const base=new THREE.Mesh(new THREE.BoxGeometry(.9,.5,.6),madera);base.position.y=.25;base.castShadow=true;g.add(base);
 const tapa=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.9,12,1,false,0,Math.PI),madera);tapa.rotation.z=Math.PI/2;tapa.rotation.y=Math.PI/2;tapa.position.y=.5;tapa.castShadow=true;g.add(tapa);
 for(const x of [-.32,.32]){const f=new THREE.Mesh(new THREE.BoxGeometry(.07,.52,.62),oro);f.position.set(x,.26,0);g.add(f);const t=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.07,12,1,false,0,Math.PI),oro);t.rotation.z=Math.PI/2;t.rotation.y=Math.PI/2;t.position.set(x,.5,0);g.add(t);}
 const cerrojo=new THREE.Mesh(new THREE.BoxGeometry(.14,.16,.05),oro);cerrojo.position.set(0,.45,.31);g.add(cerrojo);
 const brillo=new THREE.Mesh(new THREE.CircleGeometry(.9,20),new THREE.MeshBasicMaterial({color:'#ffd56a',transparent:true,opacity:.25,blending:THREE.AdditiveBlending,depthWrite:false}));brillo.rotation.x=-Math.PI/2;brillo.position.y=.02;g.add(brillo);
 return g;
}
