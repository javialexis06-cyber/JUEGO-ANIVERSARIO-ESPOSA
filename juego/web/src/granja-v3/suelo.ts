import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const material=(color:string)=>new THREE.MeshStandardMaterial({color,roughness:.9});
export function caja(root:THREE.Object3D,size:number[],pos:number[],color:string){const m=new THREE.Mesh(new THREE.BoxGeometry(...size as [number,number,number]),material(color));m.position.fromArray(pos);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
export function esfera(root:THREE.Object3D,size:number[],pos:number[],color:string){const m=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),material(color));m.scale.fromArray(size);m.position.fromArray(pos);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
export function liberar(root:THREE.Object3D){const geo=new Set<THREE.BufferGeometry>(),mat=new Set<THREE.Material>();root.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){geo.add(m.geometry);(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>mat.add(x));if((m as THREE.InstancedMesh).isInstancedMesh)(m as THREE.InstancedMesh).dispose();}});geo.forEach(g=>{if(!g.userData.compartido)g.dispose();});mat.forEach(m=>{if(!m.userData.compartido)m.dispose();});root.removeFromParent();}
/** Batch owned, untextured helper meshes inside a static group. Never use on GLB instances or animated pivots. */
export function compactar(root:THREE.Group){
 const batches=new Map<string,THREE.Mesh[]>();root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert();
 root.traverse(o=>{if(!(o instanceof THREE.Mesh)||(o as THREE.InstancedMesh).isInstancedMesh||Array.isArray(o.material))return;const m=o.material;if(!(m instanceof THREE.MeshStandardMaterial)||m.map||m.vertexColors||m.transparent)return;const key=[m.color.getHex(),m.roughness,m.metalness,m.emissive.getHex(),m.emissiveIntensity,m.side,o.castShadow,o.receiveShadow].join(':');const list=batches.get(key)??[];list.push(o);batches.set(key,list);});
 for(const meshes of batches.values()){
  if(meshes.length<2)continue;
  const parts=meshes.map(m=>{const transformed=m.geometry.clone().applyMatrix4(inverse.clone().multiply(m.matrixWorld));transformed.deleteAttribute('uv');if(!transformed.index)return transformed;const expanded=transformed.toNonIndexed();transformed.dispose();return expanded;});
  const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(!merged)continue;
  const first=meshes[0],mat=first.material as THREE.Material,oldMaterials=new Set<THREE.Material>();
  for(const m of meshes){m.removeFromParent();m.geometry.dispose();if(m.material!==mat)oldMaterials.add(m.material as THREE.Material);}oldMaterials.forEach(m=>m.dispose());
  const m=new THREE.Mesh(merged,mat);m.castShadow=first.castShadow;m.receiveShadow=first.receiveShadow;root.add(m);
 }
}
const hash=(a:number,b=0)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453123;return n-Math.floor(n);};
/** Ruido suave (para manchas del prado y grano de fieltro). */
function ruido2(x:number,y:number){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const h=(a:number,b:number)=>hash(a*57+b*131,a-b);return (h(xi,yi)*(1-u)+h(xi+1,yi)*u)*(1-v)+(h(xi,yi+1)*(1-u)+h(xi+1,yi+1)*u)*v;}
const fbm2=(x:number,y:number)=>ruido2(x,y)*.5+ruido2(x*2.1,y*2.1)*.27+ruido2(x*4.3,y*4.3)*.15+ruido2(x*8.7,y*8.7)*.08;
/** Texturas pintadas a mano en un lienzo (sin descargas): fieltro de pasto, tierra con surcos, adoquines y tablas. */
function textura(tipo:'hierba'|'surcos'|'piedra'|'madera'|'musgo'|'tierra'){
 const T=512,c=document.createElement('canvas');c.width=c.height=T;const ctx=c.getContext('2d')!;
 const rnd=(i:number,k:number)=>hash(i,k);
 const fibras=(n:number,colores:string[],largo:number,ancho:number)=>{ctx.lineCap='round';for(let i=0;i<n;i++){const x=rnd(i,1)*T,y=rnd(i,2)*T,a=rnd(i,3)*Math.PI*2,l=largo*(.5+rnd(i,4));ctx.strokeStyle=colores[i%colores.length];ctx.lineWidth=ancho*(.6+rnd(i,5)*.8);ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.cos(a+.6)*l*.5,y+Math.sin(a+.6)*l*.5,x+Math.cos(a)*l,y+Math.sin(a)*l);ctx.stroke();}};
 if(tipo==='hierba'||tipo==='musgo'){
  ctx.fillStyle=tipo==='musgo'?'#8fae68':'#c9d79a';ctx.fillRect(0,0,T,T);
  // Manchas suaves y fibras de fieltro en varios verdes (se repite sin que se note la costura)
  for(let i=0;i<60;i++){const x=rnd(i,7)*T,y=rnd(i,8)*T,r=20+rnd(i,9)*60;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%3?'#b5c98455':'#dfe6ad44');g.addColorStop(1,'#00000000');for(const dx of [-T,0,T])for(const dy of [-T,0,T]){ctx.fillStyle=g;ctx.save();ctx.translate(dx,dy);ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();}}
  fibras(5200,tipo==='musgo'?['#6f914f99','#a8c47a88','#58784088']:['#a9bf7888','#dbe4a988','#8fa86488','#c3d48e88'],7,1.4);
  // Treboles y motitas
  for(let i=0;i<140;i++){const x=rnd(i,21)*T,y=rnd(i,22)*T;ctx.fillStyle=i%4?'#93b0688a':'#eef2c8aa';for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(x+Math.cos(k*2.1)*2.4,y+Math.sin(k*2.1)*2.4,2.2,0,6.3);ctx.fill();}}
 }else if(tipo==='surcos'||tipo==='tierra'){
  ctx.fillStyle=tipo==='tierra'?'#c2a274':'#7e5638';ctx.fillRect(0,0,T,T);
  // Dos surcos por casilla (igual que el relieve): lomo claro, zanja oscura
  if(tipo==='surcos')for(let y=0;y<T;y+=256){const g=ctx.createLinearGradient(0,y,0,y+256);g.addColorStop(0,'#5a3a25');g.addColorStop(.3,'#8a5f3e');g.addColorStop(.5,'#a3754c');g.addColorStop(.7,'#8a5f3e');g.addColorStop(1,'#5a3a25');ctx.fillStyle=g;ctx.fillRect(0,y,T,256);}
  fibras(3000,tipo==='tierra'?['#a8875a66','#d9bd8f66','#8f6f4866']:['#5c3d2766','#c0915f55','#7a553866'],5,1.3);
  // Terroncitos y piedritas
  for(let i=0;i<260;i++){const x=rnd(i,31)*T,y=rnd(i,32)*T,r=1.5+rnd(i,33)*3.5;ctx.fillStyle=i%5?(tipo==='tierra'?'#a4855a':'#7d5a3c'):'#c9bfae';ctx.beginPath();ctx.ellipse(x,y,r,r*.75,rnd(i,34)*3,0,6.3);ctx.fill();ctx.fillStyle='#ffffff22';ctx.beginPath();ctx.arc(x-r*.3,y-r*.3,r*.4,0,6.3);ctx.fill();}
 }else if(tipo==='piedra'){
  ctx.fillStyle='#8c8675';ctx.fillRect(0,0,T,T);
  // Adoquines redondeados con su sombrita y brillo
  const filas=4,col=4,w=T/col,h=T/filas;
  for(let fy=0;fy<filas;fy++)for(let fx=-1;fx<=col;fx++){const ox=(fy%2)*w/2,x=fx*w+ox+w/2,y=fy*h+h/2,k=fy*9+fx;const ww=w*.43*(.9+rnd(k,41)*.15),hh=h*.42*(.9+rnd(k,42)*.15);
   ctx.fillStyle='#00000030';ctx.beginPath();ctx.ellipse(x+3,y+5,ww,hh,0,0,6.3);ctx.fill();
   const base=['#c9c2b1','#bdb6a4','#d4cdbd','#b4ad9b'][k&3];const g=ctx.createRadialGradient(x-ww*.35,y-hh*.4,2,x,y,ww*1.2);g.addColorStop(0,'#f1ece0');g.addColorStop(.45,base);g.addColorStop(1,'#8f8878');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,ww,hh,rnd(k,43)*.3-.15,0,6.3);ctx.fill();}
  fibras(1600,['#ffffff22','#3b332822'],4,1);
  for(let i=0;i<90;i++){const x=rnd(i,51)*T,y=rnd(i,52)*T;ctx.fillStyle='#7ea25a99';ctx.beginPath();ctx.arc(x,y,1.5+rnd(i,53)*2,0,6.3);ctx.fill();}
 }else{
  // Tablas con veta, nudos y clavos
  const tablas=4,h=T/tablas;for(let k=0;k<tablas;k++){const y=k*h,base=['#c69a6b','#b88c5e','#cfa477','#b48659'][k];ctx.fillStyle=base;ctx.fillRect(0,y,T,h);
   for(let v=0;v<26;v++){ctx.strokeStyle=v%2?'#8c623f55':'#e2bd8f55';ctx.lineWidth=1+rnd(k*30+v,61)*1.5;ctx.beginPath();const yy=y+4+rnd(k*30+v,62)*(h-8);ctx.moveTo(0,yy);for(let x=0;x<=T;x+=32)ctx.lineTo(x,yy+Math.sin(x*.02+v)*2.5);ctx.stroke();}
   const nx=rnd(k,63)*T;ctx.fillStyle='#7a5134';ctx.beginPath();ctx.ellipse(nx,y+h/2,9,5,0,0,6.3);ctx.fill();
   ctx.fillStyle='#5a3b26';ctx.fillRect(0,y,T,4);for(const x of [24,T-24]){ctx.fillStyle='#6f7072';ctx.beginPath();ctx.arc(x,y+h/2,3.5,0,6.3);ctx.fill();}}
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
/** Mata de pasto (tres hojas con degradé de verde oscuro a verde claro), para repetir con instancias. */
function geometriaMata(){const pos:number[]=[],col:number[]=[],base=new THREE.Color('#79a052'),punta=new THREE.Color('#cfe197');
 for(let k=0;k<3;k++){const a=k*2.1+.3,ca=Math.cos(a),sa=Math.sin(a),lean=.06+k*.02,h=.15+k*.04,w=.05;
  const p=[[-w,0,0],[w,0,0],[w*.4,h*.55,lean*.5],[-w*.4,h*.55,lean*.5],[0,h,lean]].map(([x,y,z])=>[x*ca-z*sa+ca*.03,y,x*sa+z*ca+sa*.03]);
  for(const [i0,i1,i2] of [[0,1,2],[0,2,3],[3,2,4]])for(const i of [i0,i1,i2]){pos.push(...p[i]);const c=base.clone().lerp(punta,p[i][1]/h);col.push(c.r,c.g,c.b);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
 // Normales hacia arriba: el pasto se ilumina parejo, como fieltro, sin caras negras
 const n=g.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,0,1,0);return g;}
function geometriaFlor(){const g=new THREE.CylinderGeometry(.07,.045,.04,7,1);g.translate(0,.12,0);const tallo=new THREE.CylinderGeometry(.008,.008,.12,4);tallo.translate(0,.06,0);const m=mergeGeometries([g.toNonIndexed(),tallo.toNonIndexed()].map(x=>{x.deleteAttribute('uv');return x;}));return m!;}
export class Suelos{
 readonly hierba=textura('hierba');readonly surcos=textura('surcos');readonly piedra=textura('piedra');readonly madera=textura('madera');readonly musgo=textura('musgo');readonly tierra=textura('tierra');
 private mata=geometriaMata();private flor=geometriaFlor();
 private matPasto=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1});
 private matFlor=new THREE.MeshStandardMaterial({vertexColors:false,roughness:.8});
 private matsCamino=new Map<string,THREE.MeshStandardMaterial>();
 constructor(){for(const o of [this.mata,this.flor,this.matPasto,this.matFlor])o.userData.compartido=true;}
 /** Prado grande: manchas de verde más claro, más oscuro y amarillento (ruido suave) sobre el fieltro de pasto. */
 terreno(){const g=new THREE.PlaneGeometry(260,240,130,120);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors:number[]=[],base=new THREE.Color('#8db06c'),claro=new THREE.Color('#a9c77d'),oscuro=new THREE.Color('#6f9654'),seco=new THREE.Color('#b8bf78');
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),n=fbm2(x*.06,z*.06),m=fbm2(x*.17+40,z*.17),c=base.clone();if(n>.55)c.lerp(claro,(n-.55)*2.4);else c.lerp(oscuro,(.55-n)*1.6);if(m>.66)c.lerp(seco,(m-.66)*2.2);colors.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*65,uv.getY(i)*60);
  const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,map:this.hierba,roughness:1}));mesh.position.y=-.04;mesh.receiveShadow=true;return mesh;}
 /** Tierra labrada con surcos de verdad (lomitos de tierra), continuos de casilla a casilla; la regada, oscura y brillante. */
 labrado(cells:{x:number;z:number;wet:boolean;dead:boolean}[]){const group=new THREE.Group();const N=8;
  for(const wet of [false,true]){const subset=cells.filter(p=>p.wet===wet);if(!subset.length)continue;const pos:number[]=[],uv:number[]=[],indices:number[]=[],col:number[]=[];
   for(const c of subset){const n0=pos.length/3,tint=new THREE.Color(c.dead?'#a49a86':wet?'#7a5a3e':'#ffffff');
    for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=c.x+i/N,z=c.z+j/N,borde=Math.min(i,N-i,j,N-j)/N;const y=.02+.05*(.5+.5*Math.sin((z*4-.5)*Math.PI))*Math.min(1,borde*5)+.012*Math.min(1,borde*4);
     pos.push(x,y,z);uv.push(x,z);const k=.9+.1*hash(i+c.x*9,j+c.z*7);col.push(tint.r*k,tint.g*k,tint.b*k);}
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=n0+j*(N+1)+i,b=a+1,d=a+N+1,e=d+1;indices.push(a,d,b,b,d,e);}}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));geo.setIndex(indices);geo.computeVertexNormals();
   const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:this.surcos,vertexColors:true,roughness:wet?.55:1,metalness:0}));m.receiveShadow=true;group.add(m);}
  // Bordecito de tierra removida donde la parcela toca el pasto
  const owned=new Set(cells.map(c=>c.x+','+c.z));for(const c of cells)for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]])if(!owned.has((c.x+dx)+','+(c.z+dz))){const b=caja(group,[dx?.07:1.02,.03,dz?.07:1.02],[c.x+.5+dx*.5,.012,c.z+.5+dz*.5],'#8e6a47');b.castShadow=false;}
  compactar(group);return group;}
 /** Caminos pieza por pieza: adoquines sobre arena, tablas con clavos, tierra apisonada o piedra con musgo. */
 camino(id:string,vecinos:{n:boolean;s:boolean;e:boolean;w:boolean}){const g=new THREE.Group();const wood=/madera|tabl/.test(id),sand=/arena|tierra/.test(id),moss=/musgo/.test(id);
  const mat=(clave:string,map:THREE.Texture|null,color:string,rough=1)=>{let m=this.matsCamino.get(clave);if(!m){m=new THREE.MeshStandardMaterial({map,color,roughness:rough});m.userData.compartido=true;this.matsCamino.set(clave,m);}return m;};
  if(wood){const tabla=new THREE.BoxGeometry(1,.06,.3);for(let k=0;k<3;k++){const m=new THREE.Mesh(tabla,mat('tabla',this.madera,['#f2dcbc','#e8cfa8','#f6e2c4'][k]));m.position.set((hash(k,id.length)-.5)*.04,.04,-.33+k*.33);m.rotation.y=(hash(k,3)-.5)*.03;m.castShadow=m.receiveShadow=true;g.add(m);}
   for(const [x,z] of [[-.36,-.36],[.36,-.36],[-.36,0],[.36,0],[-.36,.33],[.36,.33]])caja(g,[.03,.012,.03],[x,.075,z],'#6d6f71');
   if(!vecinos.n&&!vecinos.s){caja(g,[.06,.1,1],[-.5,.05,0],'#7a5638');caja(g,[.06,.1,1],[.5,.05,0],'#7a5638');}return g;}
  const base=new THREE.Mesh(new THREE.BoxGeometry(1,.05,1),mat(sand?'tierra':moss?'musgo':'piedra',sand?this.tierra:moss?this.musgo:this.piedra,sand?'#e9dcc4':moss?'#d6dcc8':'#bfb8a8'));base.position.y=.025;base.receiveShadow=true;g.add(base);
  if(!sand){// Adoquines sueltos encima, para que tengan relieve
   const r=(k:number)=>hash(k+id.length*3,vecinos.n?1:2);for(let k=0;k<(moss?3:0);k++){const sx=.22+r(k)*.12,sz=.2+r(k+9)*.1;const p=new THREE.Mesh(new THREE.CylinderGeometry(1,1.08,1,9,1),mat(moss?'adoquin_musgo':'adoquin',null,moss?'#8f9a74':'#aaa392',.85));p.scale.set(sx,.05,sz);p.position.set((r(k+3)-.5)*.6,.06,(r(k+5)-.5)*.6);p.rotation.y=r(k+7)*3;p.castShadow=p.receiveShadow=true;g.add(p);}
   const border=moss?'#6e8a55':'#8e9278';if(!vecinos.n)caja(g,[1,.06,.05],[0,.04,-.48],border);if(!vecinos.s)caja(g,[1,.06,.05],[0,.04,.48],border);if(!vecinos.e)caja(g,[.05,.06,1],[.48,.04,0],border);if(!vecinos.w)caja(g,[.05,.06,1],[-.48,.04,0],border);}
  return g;}
 /** Matas de pasto con degradé y, de vez en cuando, florecitas blancas, amarillas, lilas y rosadas. */
 pasto(x:number,z:number,w:number,d:number,density=300,visible:(x:number,z:number)=>boolean=()=>true){const g=new THREE.Group(),dummy=new THREE.Object3D();
  const grass=new THREE.InstancedMesh(this.mata,this.matPasto,density);for(let i=0;i<density;i++){dummy.position.set(x+hash(i,x)*w,.0,z+hash(i,z+20)*d);dummy.rotation.y=hash(i,99)*Math.PI*2;dummy.scale.setScalar(visible(dummy.position.x,dummy.position.z)?(.7+hash(i,31)*.8):0);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);}
  grass.receiveShadow=true;g.add(grass);
  const nf=Math.floor(density/9),flores=new THREE.InstancedMesh(this.flor,this.matFlor,nf),colores=['#ffffff','#f7d55a','#c9a3e0','#f4a7b9','#ffffff'].map(c=>new THREE.Color(c));
  for(let i=0;i<nf;i++){const fx=x+hash(i,x+71)*w,fz=z+hash(i,z+83)*d;dummy.position.set(fx,0,fz);dummy.rotation.y=0;dummy.scale.setScalar(visible(fx,fz)?(.8+hash(i,7)*.5):0);dummy.updateMatrix();flores.setMatrixAt(i,dummy.matrix);flores.setColorAt(i,colores[Math.floor(hash(i,5)*colores.length)]);}
  g.add(flores);return g;}
 dispose(){[this.hierba,this.surcos,this.piedra,this.madera,this.musgo,this.tierra].forEach(t=>t.dispose());this.mata.dispose();this.flor.dispose();this.matPasto.dispose();this.matFlor.dispose();this.matsCamino.forEach(m=>m.dispose());}
}
