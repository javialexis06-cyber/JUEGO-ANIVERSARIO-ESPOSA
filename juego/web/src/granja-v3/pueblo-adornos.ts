import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CAMINOS_PUEBLO, EDIFICIOS_PUEBLO, VIVIENDAS_PUEBLO } from './pueblo-datos';

/** Arte del Pueblo del Sol que necesita texturas pintadas: empedrado de las calles, la plaza con su sol de piedra y
 * el agua de la fuente. Solo se usa en el navegador (pinta en un lienzo). */

const hash=(i:number,k=0)=>{const n=Math.sin(i*124.16+k*271.7)*15423.724;return n-Math.floor(n);};
const PLAZA={x:84,z:2,r:6.94};
/** Rectángulos de calle con ancho y fondo positivos (algunos vienen al revés en los datos). */
export const CALLES=CAMINOS_PUEBLO.map(([x,z,w,d])=>[w<0?x+w:x,d<0?z+d:z,Math.abs(w),Math.abs(d)] as [number,number,number,number]);
const enCalle=(x:number,z:number,m=0)=>CALLES.some(([bx,bz,w,d])=>x>=bx-m&&x<=bx+w+m&&z>=bz-m&&z<=bz+d+m);
const enPlaza=(x:number,z:number,m=0)=>Math.hypot(x-PLAZA.x,z-PLAZA.z)<7.15+m;

/** Ruido de valor suave que se repite cada `p` unidades (para que la textura no muestre costuras). */
function ruido(x:number,y:number,p:number,k:number){
 const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,h=(a:number,b:number)=>hash(((a%p)+p)%p*31+((b%p)+p)%p,k);
 const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h(xi,yi),h(xi+1,yi),sx),THREE.MathUtils.lerp(h(xi,yi+1),h(xi+1,yi+1),sx),sy);
}
const lienzo=(T:number)=>{const c=document.createElement('canvas');c.width=c.height=T;return c;};
function aTextura(c:HTMLCanvasElement,color=true){const t=new THREE.CanvasTexture(c);if(color)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;}

/** Piedras de río irregulares (Voronoi con celdas desordenadas), boleadas, con juntas de arena, musgo en las
 * esquinas sombreadas y piedritas. Devuelve el color y el relieve (para `bumpMap`). Se repite sin costura. */
function empedrado(){
 const T=512,N=9,c=lienzo(T),b=lienzo(T),ctx=c.getContext('2d')!,bx=b.getContext('2d')!,img=ctx.createImageData(T,T),rel=bx.createImageData(T,T);
 const pts:[number,number][]=[];for(let j=0;j<N;j++)for(let i=0;i<N;i++){const k=j*N+i;pts.push([(i+.18+hash(k,1)*.64)/N,(j+.18+hash(k,2)*.64)/N]);}
 const tonos=['#ddd3bc','#d2c6ac','#e8dfca','#c9bea6','#dfcdaa','#d6cbbb','#c4baa5','#ead9b6'].map(h=>new THREE.Color(h));
 const junta=new THREE.Color('#a29473'),musgo=new THREE.Color('#93ad6a'),brillo=new THREE.Color('#fbf3e2');
 for(let y=0;y<T;y++)for(let x=0;x<T;x++){
  const u=x/T,v=y/T;let d1=9,d2=9,id=0,cx=0,cy=0;
  const gi=Math.floor(u*N),gj=Math.floor(v*N);
  for(let dj=-2;dj<=2;dj++)for(let di=-2;di<=2;di++){const ii=gi+di,jj=gj+dj,k=((jj%N+N)%N)*N+((ii%N+N)%N),px=pts[k][0]+Math.floor(ii/N),py=pts[k][1]+Math.floor(jj/N),d=Math.hypot(u-px,v-py);if(d<d1){d2=d1;d1=d;id=k;cx=px;cy=py;}else if(d<d2)d2=d;}
  const borde=(d2-d1)*N,lomo=THREE.MathUtils.smoothstep(borde,.05,.32);
  const g=ruido(u*24,v*24,24,7),m=ruido(u*5,v*5,5,9);
  const col=tonos[Math.floor(hash(id,3)*tonos.length)].clone().multiplyScalar(.93+g*.14);
  // Luz de arriba a la izquierda: la piedra se ve redondita
  const lx=(u-cx)*N,ly=(v-cy)*N,luz=THREE.MathUtils.clamp(-(lx+ly)*.55,-.3,.4)*lomo;col.lerp(luz>0?brillo:junta,Math.abs(luz)*.5);
  const fondo=junta.clone().multiplyScalar(.85+g*.3);if(m>.7)fondo.lerp(musgo,Math.min(.8,(m-.7)*4));
  col.lerp(fondo,1-lomo);
  const i=(y*T+x)*4;img.data[i]=col.r*255;img.data[i+1]=col.g*255;img.data[i+2]=col.b*255;img.data[i+3]=255;
  const h=Math.pow(lomo,.6)*(.75+.25*hash(id,5))*255;rel.data[i]=rel.data[i+1]=rel.data[i+2]=h;rel.data[i+3]=255;
 }
 ctx.putImageData(img,0,0);bx.putImageData(rel,0,0);
 // Grietas finitas, manchas de uso y piedritas sueltas en las juntas
 ctx.lineCap='round';for(let i=0;i<26;i++){const x=hash(i,11)*T,y=hash(i,12)*T,a=hash(i,13)*6.3;ctx.strokeStyle='#7f735c44';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*9,y+Math.sin(a)*9);ctx.lineTo(x+Math.cos(a+.7)*15,y+Math.sin(a+.7)*15);ctx.stroke();}
 for(let i=0;i<220;i++){const x=hash(i,21)*T,y=hash(i,22)*T,r=.8+hash(i,23)*1.8;ctx.fillStyle=i%3?'#efe4ca88':'#6d624d77';ctx.beginPath();ctx.arc(x,y,r,0,6.3);ctx.fill();}
 return {mapa:aTextura(c),relieve:aTextura(b,false)};
}

/** La plaza: anillos de adoquines en abanico, un sol de piedra rojiza alrededor de la fuente y un borde de lajas. */
function plazaSol(){
 const T=1024,R=PLAZA.r,c=lienzo(T),b=lienzo(T),ctx=c.getContext('2d')!,bx=b.getContext('2d')!,img=ctx.createImageData(T,T),rel=bx.createImageData(T,T);
 const tonos=['#d8ccb0','#cdbf9f','#e2d6bb','#c4b799','#d3c3a2'].map(h=>new THREE.Color(h)),sol=['#d39a5f','#c9864f','#ddb070'].map(h=>new THREE.Color(h)),laja=['#a8a08a','#9a927c','#b3aa92'].map(h=>new THREE.Color(h));
 const junta=new THREE.Color('#8f8166'),brillo=new THREE.Color('#fff6e4');
 for(let y=0;y<T;y++)for(let x=0;x<T;x++){
  const wx=(x/T*2-1)*R,wz=(y/T*2-1)*R,r=Math.hypot(wx,wz),t=Math.atan2(wz,wx),i=(y*T+x)*4;
  let col:THREE.Color,lomo:number,id:number;
  if(r>6.25){// Lajas grandes del borde
   const n=40,s=(t/(Math.PI*2)+1)*n,k=Math.floor(s),fs=s-k,fr=(r-6.25)/.75;lomo=THREE.MathUtils.smoothstep(Math.min(fs,1-fs)*3.2,0,.25)*THREE.MathUtils.smoothstep(Math.min(fr,1-fr)*4,0,.3);id=k;col=laja[k%3].clone();
  }else{
   const anillo=Math.floor(r/.3),fr=r/.3-anillo,n=Math.max(6,Math.round(Math.PI*2*(anillo+.5)*.3/.36)),s=(t/(Math.PI*2)+1)*n+hash(anillo,4)*.9,k=Math.floor(s),fs=s-k;
   lomo=THREE.MathUtils.smoothstep(Math.min(fs,1-fs)*2.6,0,.24)*THREE.MathUtils.smoothstep(Math.min(fr,1-fr)*2.6,0,.24);id=anillo*97+k;
   // Doce rayos de sol que salen de la fuente
   const rayo=Math.abs(((t/(Math.PI*2))*12%1+1)%1-.5)*2,ancho=1-(r-2.3)/2.4;
   const enSol=(r>2.25&&r<2.62)||(r>=2.62&&r<4.7&&rayo<ancho*.45);
   col=(enSol?sol[id%3]:tonos[Math.floor(hash(id,6)*tonos.length)]).clone();
  }
  const g=ruido(x/T*40,y/T*40,40,3);col.multiplyScalar(.94+g*.12);
  col.lerp(brillo,lomo*.12*(.5+hash(id,8)));col.lerp(junta.clone().multiplyScalar(.85+g*.3),1-lomo);
  img.data[i]=col.r*255;img.data[i+1]=col.g*255;img.data[i+2]=col.b*255;img.data[i+3]=255;
  const h=Math.pow(lomo,.6)*255;rel.data[i]=rel.data[i+1]=rel.data[i+2]=h;rel.data[i+3]=255;
 }
 ctx.putImageData(img,0,0);bx.putImageData(rel,0,0);
 for(let i=0;i<500;i++){const x=hash(i,31)*T,y=hash(i,32)*T;ctx.fillStyle=i%3?'#f3e9d088':'#7a6d5466';ctx.beginPath();ctx.arc(x,y,.8+hash(i,33)*1.6,0,6.3);ctx.fill();}
 const mapa=aTextura(c),relieve=aTextura(b,false);mapa.wrapS=mapa.wrapT=relieve.wrapS=relieve.wrapT=THREE.ClampToEdgeWrapping;return {mapa,relieve};
}

/** Chorritos de agua que caen: franjas claras transparentes que bajan (la textura se corre en `animarFuente`). */
function chorros(){
 const c=lienzo(128),ctx=c.getContext('2d')!;ctx.clearRect(0,0,128,128);
 for(let i=0;i<80;i++){const x=hash(i,41)*128,w=2+hash(i,42)*5,y=hash(i,43)*128,l=30+hash(i,44)*80;const g=ctx.createLinearGradient(0,y,0,y+l);g.addColorStop(0,'#ffffff00');g.addColorStop(.5,i%3?'#e8fbffcc':'#ffffffee');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;for(const dy of [-128,0,128])ctx.fillRect(x,y+dy,w,l);}
 const t=aTextura(c);return t;
}

function caraSuperior(x:number,z:number,w:number,d:number,y:number){
 const g=new THREE.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);g.translate(x+w/2,y,z+d/2);
 // Coordenadas de textura del mundo: dos calles que se cruzan coinciden piedra con piedra
 const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/2,-p.getZ(i)/2);return g;
}

export interface AguaFuente { texturas:THREE.Texture[]; }

/** Calles empedradas con su bordillo de piedras, la plaza del sol y el agua de la fuente. */
export function adornosPueblo(materialAguaFn:(rx:number,rz:number,hondo:string,claro:string)=>THREE.Mesh):THREE.Group{
 const grupo=new THREE.Group();grupo.name='pueblo-empedrado';
 const piedra=empedrado(),plaza=plazaSol();
 const matCalle=new THREE.MeshStandardMaterial({map:piedra.mapa,bumpMap:piedra.relieve,bumpScale:3.2,roughness:.92});
 // Superficie de las calles (a la altura que usan los personajes) y su costado
 const caras:THREE.BufferGeometry[]=[];for(const [x,z,w,d] of CALLES){caras.push(caraSuperior(x,z,w,d,.1155));
  for(const [px,pz,pw,pd,rot] of [[x,z,w,0,Math.PI],[x,z+d,w,0,0],[x,z,0,d,-Math.PI/2],[x+w,z,0,d,Math.PI/2]] as [number,number,number,number,number][]){const largo=pw||pd,s=new THREE.PlaneGeometry(largo,.12);s.rotateY(rot);s.translate(px+pw/2,.055,pz+pd/2);const uv=s.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*largo/2,uv.getY(i)*.06);caras.push(s);}}
 const calles=new THREE.Mesh(mergeGeometries(caras)!,matCalle);calles.receiveShadow=true;calles.name='calles';grupo.add(calles);caras.forEach(g=>g.dispose());
 // Bordillo: piedras boleadas donde la calle toca el pasto (no en los cruces ni en la plaza ni en las puertas)
 const sitios:{x:number;z:number;giro:number}[]=[];
 for(const [x,z,w,d] of CALLES)for(const [x0,z0,dx,dz,nx,nz,largo] of [[x,z,1,0,0,-1,w],[x,z+d,1,0,0,1,w],[x,z,0,1,-1,0,d],[x+w,z,0,1,1,0,d]] as number[][]){
  const n=Math.max(1,Math.round(largo/.34));for(let k=0;k<n;k++){const t=(k+.5)/n*largo,px=x0+dx*t,pz=z0+dz*t,fx=px+nx*.22,fz=pz+nz*.22;
   if(enCalle(fx,fz,.02)||enPlaza(fx,fz,.1)||junto(fx,fz))continue;sitios.push({x:px+nx*.03,z:pz+nz*.03,giro:dx?0:Math.PI/2});}}
 const geoBordillo=new THREE.DodecahedronGeometry(1,1);const matBordillo=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.88});
 const bordillo=new THREE.InstancedMesh(geoBordillo,matBordillo,sitios.length),o=new THREE.Object3D(),tono=['#a49a84','#b5ab93','#968d79','#bdb39c','#a7a08e'].map(h=>new THREE.Color(h));
 sitios.forEach((s,i)=>{o.position.set(s.x,.1,s.z);o.rotation.set(0,s.giro+(hash(i,51)-.5)*.5,0);o.scale.set(.17+hash(i,52)*.03,.075+hash(i,53)*.025,.11+hash(i,54)*.03);o.updateMatrix();bordillo.setMatrixAt(i,o.matrix);bordillo.setColorAt(i,tono[i%tono.length].clone().multiplyScalar(.92+hash(i,55)*.16));});
 bordillo.castShadow=bordillo.receiveShadow=true;bordillo.name='bordillo';grupo.add(bordillo);
 // La plaza del sol, encima de la tarima de piedra (los anillos de lajas en relieve los pone pueblo.ts)
 const cara=new THREE.CircleGeometry(PLAZA.r,10);cara.rotateX(-Math.PI/2);
 const piso=new THREE.Mesh(cara,new THREE.MeshStandardMaterial({map:plaza.mapa,bumpMap:plaza.relieve,bumpScale:3,roughness:.9}));piso.position.set(PLAZA.x,.182,PLAZA.z);piso.receiveShadow=true;piso.name='plaza-sol';grupo.add(piso);
 // Agua de la fuente: estanque de abajo, tacita de arriba y las cortinas que caen
 const abajo=materialAguaFn(1.78,1.78,'#2f8199','#7cc9c4');abajo.position.set(PLAZA.x,.645,PLAZA.z);grupo.add(abajo);
 const arriba=materialAguaFn(.84,.84,'#3a8ca2','#8ad3cd');arriba.position.set(PLAZA.x,1.612,PLAZA.z);grupo.add(arriba);
 const tex=[chorros(),chorros()];tex[0].repeat.set(6,1);tex[1].repeat.set(3,1);
 const cortina=(rArriba:number,rAbajo:number,alto:number,y:number,t:THREE.Texture)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rArriba,rAbajo,alto,28,1,true),new THREE.MeshStandardMaterial({map:t,color:'#dff6f6',emissive:'#9fd7dc',emissiveIntensity:.25,transparent:true,depthWrite:false,side:THREE.DoubleSide,roughness:.2}));m.position.set(PLAZA.x,y,PLAZA.z);m.renderOrder=2;m.userData.noCompactar=true;return m;};
 grupo.add(cortina(1.0,1.18,.98,1.13,tex[0]));grupo.add(cortina(.2,.62,.78,2.04,tex[1]));
 // Gotitas que brincan en el estanque
 const gotas=new THREE.InstancedMesh(new THREE.SphereGeometry(.035,6,4),new THREE.MeshStandardMaterial({color:'#e9fbff',emissive:'#bfe9ee',emissiveIntensity:.4,roughness:.2}),24);gotas.name='gotas';gotas.userData.noCompactar=true;grupo.add(gotas);
 grupo.userData.fuente={texturas:tex,gotas};
 return grupo;
}
/** Junto a una puerta o pegado a una casa: ahí no va bordillo. */
function junto(x:number,z:number){return [...EDIFICIOS_PUEBLO,...VIVIENDAS_PUEBLO.filter(v=>!v.edificio)].some(e=>x>=e.x-.3&&x<=e.x+e.ancho+.3&&z>=e.z-.3&&z<=e.z+e.fondo+.9);}

const oo=new THREE.Object3D();
export function animarFuente(grupo:THREE.Object3D,tiempo:number){
 const f=grupo.userData.fuente as {texturas:THREE.Texture[];gotas:THREE.InstancedMesh}|undefined;if(!f)return;
 f.texturas[0].offset.y=tiempo*.9%1;f.texturas[1].offset.y=tiempo*1.3%1;
 for(let i=0;i<24;i++){const fase=(tiempo*1.4+hash(i,61))%1,a=hash(i,62)*Math.PI*2+Math.floor(tiempo*1.4+hash(i,61))*1.7,r=1.12+hash(i,63)*.3;oo.position.set(PLAZA.x+Math.cos(a)*(r+fase*.18),.66+Math.sin(fase*Math.PI)*.16,PLAZA.z+Math.sin(a)*(r+fase*.18));oo.scale.setScalar(1-fase*.6);oo.updateMatrix();f.gotas.setMatrixAt(i,oo.matrix);}
 f.gotas.instanceMatrix.needsUpdate=true;
}

/** Dónde crece pasto alto en el pueblo: prados, fuera de calles, plaza, casas, canal y corral. */
export function cespedPueblo(x:number,z:number){
 if(enCalle(x,z,.28)||enPlaza(x,z,.35))return false;
 if([...EDIFICIOS_PUEBLO,...VIVIENDAS_PUEBLO.filter(v=>!v.edificio)].some(e=>x>=e.x-.4&&x<=e.x+e.ancho+.4&&z>=e.z-.4&&z<=e.z+e.fondo+.6))return false;
 if(x>=103.7&&x<=108.6&&z>=10.6&&z<=22.4)return false;
 return true;
}
