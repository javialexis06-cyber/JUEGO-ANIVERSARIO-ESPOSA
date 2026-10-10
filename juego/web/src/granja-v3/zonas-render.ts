import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SALIDAS } from './caminos-mundo';
import type { Zona } from './catalogo';

/** Arte de las zonas fuera de la granja: la cueva de la Mina de Cristal, el monte espeso alrededor del bosque, del
 * bosque ancestral y del lago, el sotobosque, la orilla del lago y la textura de los senderos. Todo es decorado: no
 * cambia por dónde se camina ni qué se puede recoger. */

const hash=(i:number,k=0)=>{const n=Math.sin(i*127.1+k*311.7)*43758.5453;return n-Math.floor(n);};
const LIMITES:Partial<Record<Zona,[number,number,number,number]>>={bosque:[-101,-57,-24,23],bosque_ancestral:[-102,-55,52,100],lago:[5,49,74,111]};
const lienzo=(T:number,H=T)=>{const c=document.createElement('canvas');c.width=T;c.height=H;return c;};
const textura=(c:HTMLCanvasElement,color=true)=>{const t=new THREE.CanvasTexture(c);if(color)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;};

/** Pinta colores por vértice a una geometría: degradé de abajo (oscuro) a arriba (claro). */
function pintar(g:THREE.BufferGeometry,abajo:string,arriba:string,y0:number,y1:number){
 const p=g.attributes.position,a=new THREE.Color(abajo),b=new THREE.Color(arriba),col=new Float32Array(p.count*3);
 for(let i=0;i<p.count;i++){const t=THREE.MathUtils.clamp((p.getY(i)-y0)/(y1-y0),0,1),c=a.clone().lerp(b,t);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
 g.setAttribute('color',new THREE.BufferAttribute(col,3));return g;
}
/** Bola deformada con ruido (piedra, copa o mata), suavizada para que se vea de felpa y no facetada. */
function bola(det:number,amp:number,semilla:number){
 let g:THREE.BufferGeometry=new THREE.IcosahedronGeometry(1,det);g.deleteAttribute('normal');g.deleteAttribute('uv');g=mergeVertices(g);
 const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+amp*(Math.sin(x*3.1+semilla)*Math.sin(y*2.7+semilla*1.3)*Math.sin(z*3.3+semilla*.7));p.setXYZ(i,x*n,y*n,z*n);}
 g.computeVertexNormals();return g;
}
const unir=(partes:THREE.BufferGeometry[])=>{const g=mergeGeometries(partes.map(p=>p.index?p.toNonIndexed():p).map(p=>{if(p.attributes.uv)p.deleteAttribute('uv');return p;}))!;partes.forEach(p=>p.dispose());return g;};

/** Árboles de monte (copa redonda o pino), un solo dibujo por especie con instancias. */
function geoRoble(){const tronco=pintar(new THREE.CylinderGeometry(.2,.34,2.3,8).translate(0,1.15,0),'#5c3d2a','#8a5f3f',0,2.3);
 const copas=[[0,2.9,0,1.25],[.75,2.55,.3,.85],[-.7,2.6,-.2,.9],[.15,2.5,-.75,.85],[-.2,3.55,.15,.85]].map(([x,y,z,r],i)=>bola(2,.08,i*1.7).scale(r,r*.9,r).translate(x,y,z));
 return {tronco,copa:pintar(unir(copas),'#5f8a45','#c3dc8a',1.7,4.3)};}
function geoPino(){const tronco=pintar(new THREE.CylinderGeometry(.14,.26,1.4,7).translate(0,.7,0),'#553826','#7d573a',0,1.4);
 const pisos=[0,1,2,3].map(i=>{const r=1.45-i*.32;const c=new THREE.ConeGeometry(r,1.3,10,2);c.deleteAttribute('uv');const m=mergeVertices(c.deleteAttribute('normal') as THREE.BufferGeometry);const p=m.attributes.position;for(let k=0;k<p.count;k++){const y=p.getY(k);if(y<-.6)p.setY(k,y+.12*Math.sin(p.getX(k)*7+i));}m.computeVertexNormals();return m.translate(0,1.4+i*.72,0);});
 return {tronco,copa:pintar(unir(pisos),'#3f6b3d','#93bb72',.8,4.4)};}

interface Sitio{x:number;z:number;s:number;r:number;especie:number}
function instancias(geo:THREE.BufferGeometry,mat:THREE.Material,sitios:Sitio[],tintes:THREE.Color[],sombra=true){
 const m=new THREE.InstancedMesh(geo,mat,Math.max(1,sitios.length)),o=new THREE.Object3D();m.count=sitios.length;
 sitios.forEach((s,i)=>{o.position.set(s.x,0,s.z);o.rotation.set(0,s.r,0);o.scale.setScalar(s.s);o.updateMatrix();m.setMatrixAt(i,o.matrix);m.setColorAt(i,tintes[i%tintes.length].clone().multiplyScalar(.9+hash(i,77)*.2));});
 m.castShadow=sombra;m.receiveShadow=true;return m;
}
const matVertices=(extra:THREE.MeshStandardMaterialParameters={})=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,...extra});

/** Monte espeso alrededor de una zona (afuera de donde se camina), dejando abiertos los senderos de salida. */
export function monteZona(zona:Zona,senderos:[number,number,number,number][],obstaculos:{x:number;z:number}[]):THREE.Group{
 const g=new THREE.Group();g.name='monte';const b=LIMITES[zona];if(!b)return g;
 const antiguo=zona==='bosque_ancestral',lago=zona==='lago';
 const salidas=SALIDAS.filter(s=>s.desde===zona||s.hacia===zona).map(s=>s.desde===zona?{x:s.x,z:s.z}:s.llegada);
 const enSendero=(x:number,z:number,m:number)=>senderos.some(([cx,cz,w,d])=>Math.abs(x-cx)<w/2+m&&Math.abs(z-cz)<d/2+m)||salidas.some(s=>Math.hypot(x-s.x,z-s.z)<m+4);
 const fuera:Sitio[][]=[[],[]];let k=0;
 for(let x=b[0]-15;x<b[1]+15;x+=2.3)for(let z=b[2]-15;z<b[3]+15;z+=2.3){k++;
  const px=x+(hash(k,1)-.5)*1.9,pz=z+(hash(k,2)-.5)*1.9,dx=Math.max(b[0]-px,px-b[1],0),dz=Math.max(b[2]-pz,pz-b[3],0),afuera=Math.max(dx,dz);
  if(afuera<.8||enSendero(px,pz,1.5))continue;
  // Del lado de la cámara (abajo a la derecha) el monte es más ralo y bajito para no tapar al jugador
  const frente=(px>b[1]||pz>b[3]);if(frente&&afuera<3.5&&hash(k,3)<.55)continue;
  const esp=antiguo?(hash(k,4)<.35?1:0):lago?(hash(k,4)<.2?1:0):(hash(k,4)<.4?1:0);
  const s=(antiguo?1.35:1)*(.8+hash(k,5)*.55)*(frente&&afuera<5?.75:1);
  fuera[esp].push({x:px,z:pz,s,r:hash(k,6)*6.3,especie:esp});
 }
 const roble=geoRoble(),pino=geoPino(),mat=matVertices();
 const verdes=(antiguo?['#9fb88c','#87a67c','#b2c49a','#7e9a73']:['#ffffff','#e9f3d2','#d8e8b8','#f4f0c8']).map(c=>new THREE.Color(c));
 const madera=['#ffffff','#e6d9c9','#d7c3ad'].map(c=>new THREE.Color(c));
 g.add(instancias(roble.tronco,mat,fuera[0],madera),instancias(roble.copa,mat,fuera[0],verdes),instancias(pino.tronco,mat,fuera[1],madera),instancias(pino.copa,mat,fuera[1],verdes));
 // Sotobosque adentro: helechos, matas bajitas, hongos y troncos caídos, lejos de lo que se puede recoger
 const libre=(x:number,z:number,m:number)=>!enSendero(x,z,.6)&&!obstaculos.some(o=>Math.abs(o.x+.5-x)<m&&Math.abs(o.z+.5-z)<m);
 const helechos:Sitio[]=[],matas:Sitio[]=[],hongos:Sitio[]=[];
 for(let i=0;i<(lago?220:520);i++){const x=b[0]+1+hash(i,11)*(b[1]-b[0]-2),z=b[2]+1+hash(i,12)*(b[3]-b[2]-2);
  if(lago&&((x-28)**2/15**2+(z-89)**2/12**2<1))continue;if(!libre(x,z,1.1))continue;
  const t=hash(i,13),s:Sitio={x,z,s:.7+hash(i,14)*.6,r:hash(i,15)*6.3,especie:0};s.s*=t<.6?1.5:1;(t<.6?helechos:t<.8?matas:hongos).push(s);}
 const helecho=geoHelecho(),mata=pintar(unir([0,1,2].map(i=>bola(1,.1,i).scale(.42,.32,.42).translate((i-1)*.3,.22,(i%2)*.18))),'#577f3f','#a7c875',0,.55);
 g.add(instancias(helecho,matVertices({side:THREE.DoubleSide}),helechos,(antiguo?['#b9d0a8','#a2bf96']:['#ffffff','#e3efc5','#f2f7d8']).map(c=>new THREE.Color(c)),false));
 g.add(instancias(mata,mat,matas,(antiguo?['#8fae86','#7f9f7a']:['#c9d9b0','#b5c99a','#d6e2bd']).map(c=>new THREE.Color(c)),false));
 const hongo=geoHongo();g.add(instancias(hongo,matVertices(antiguo?{emissive:'#2c6f7a',emissiveIntensity:.55}:{}),hongos,(antiguo?['#9fe6ee','#c9b2ff','#a8f0d0']:['#ffffff','#fff1e0','#ffe0d0']).map(c=>new THREE.Color(c)),false));
 // Troncos caídos con musgo
 const troncos:Sitio[]=[];for(let i=0;i<40&&troncos.length<(lago?3:7);i++){const x=b[0]+3+hash(i,21)*(b[1]-b[0]-6),z=b[2]+3+hash(i,22)*(b[3]-b[2]-6);if(lago&&((x-28)**2/16**2+(z-89)**2/13**2<1))continue;if(libre(x,z,2.4))troncos.push({x,z,s:.9+hash(i,23)*.4,r:hash(i,24)*6.3,especie:0});}
 g.add(instancias(geoTronco(),mat,troncos,madera));
 if(lago)g.add(orillaLago());
 return g;
}
function geoHelecho(){const partes:THREE.BufferGeometry[]=[];for(let i=0;i<7;i++){const a=i/7*Math.PI*2,h=new THREE.PlaneGeometry(.16,.62,1,4);const p=h.attributes.position;for(let k=0;k<p.count;k++){const y=p.getY(k)+.31;p.setXYZ(k,p.getX(k)*(1-y/.62*.85),0,0);p.setY(k,y*.7+.0);p.setZ(k,y*.75-y*y*.55);}h.rotateY(a);partes.push(h);}
 return pintar(unir(partes),'#4d7a3a','#b4d27c',0,.4);}
function geoHongo(){const pie=pintar(new THREE.CylinderGeometry(.035,.05,.16,6).translate(0,.08,0),'#efe3cf','#f7efe1',0,.16);
 const som=new THREE.SphereGeometry(.11,10,6,0,Math.PI*2,0,Math.PI/2).translate(0,.15,0);const p=som.attributes.position,col=new Float32Array(p.count*3);
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),pinta=Math.sin(x*60)*Math.sin(z*60)>.55;const c=new THREE.Color(pinta?'#fff6e8':'#d2543f');col.set([c.r,c.g,c.b],i*3);}som.setAttribute('color',new THREE.BufferAttribute(col,3));
 const dos=som.clone().scale(.7,.7,.7).translate(.12,-.04,.06),pie2=pie.clone().scale(.7,.7,.7).translate(.12,0,.06);return unir([pie,som,pie2,dos]);}
function geoTronco(){const t=new THREE.CylinderGeometry(.32,.36,2.6,10,3);t.rotateZ(Math.PI/2);t.translate(0,.3,0);pintar(t,'#5d412d','#9a7556',0,.66);
 const musgo=bola(1,.15,3).scale(.7,.18,.32).translate(-.3,.62,0);pintar(musgo,'#5f8a45','#9fc06f',.5,.75);
 const raiz=new THREE.CylinderGeometry(.37,.37,.04,10).rotateZ(Math.PI/2).translate(1.31,.3,0);pintar(raiz,'#d8b98e','#d8b98e',0,1);return unir([t,musgo,raiz]);}

/** Orilla del lago: playita de arena, juncos con su espiga, piedras redondas y hojas de lirio flotando. */
function orillaLago(){
 const g=new THREE.Group(),cx=28,cz=89,rx=13,rz=10;
 const c=lienzo(256),ctx=c.getContext('2d')!;const gr=ctx.createRadialGradient(128,128,0,128,128,128);gr.addColorStop(0,'#d8c59a');gr.addColorStop(.83,'#e2cfa3');gr.addColorStop(.9,'#d9c69aee');gr.addColorStop(1,'#d9c69a00');ctx.fillStyle=gr;ctx.fillRect(0,0,256,256);
 for(let i=0;i<900;i++){const a=hash(i,31)*6.3,r=hash(i,32)*118;ctx.fillStyle=i%3?'#b9a57c88':'#f4e8c888';ctx.fillRect(128+Math.cos(a)*r,128+Math.sin(a)*r,1.5,1.5);}
 const arena=new THREE.Mesh(new THREE.CircleGeometry(1,64).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:textura(c),transparent:true,depthWrite:false,roughness:1}));arena.scale.set(rx+2.2,1,rz+2.2);arena.position.set(cx,.006,cz);arena.renderOrder=-1;arena.receiveShadow=true;g.add(arena);
 // Juncos en la orilla (menos junto al muelle)
 const juncos:Sitio[]=[],piedras:Sitio[]=[],lirios:Sitio[]=[];
 for(let i=0;i<150;i++){const a=hash(i,41)*Math.PI*2,f=.97+hash(i,42)*.12,x=cx+Math.cos(a)*rx*f,z=cz+Math.sin(a)*rz*f;if(Math.hypot(x-15,z-88)<3.5||Math.hypot(x-14.5,z-79)<3)continue;if(Math.cos(a)>.2&&Math.sin(a)>.2&&hash(i,43)<.6)continue;juncos.push({x,z,s:.8+hash(i,44)*.6,r:hash(i,45)*6.3,especie:0});}
 for(let i=0;i<34;i++){const a=hash(i,51)*Math.PI*2,f=1.05+hash(i,52)*.14,x=cx+Math.cos(a)*rx*f,z=cz+Math.sin(a)*rz*f;if(Math.hypot(x-15,z-88)<3)continue;piedras.push({x,z,s:.25+hash(i,53)*.4,r:hash(i,54)*6.3,especie:0});}
 for(let i=0;i<40;i++){const a=hash(i,61)*Math.PI*2,f=.35+hash(i,62)*.5,x=cx+Math.cos(a)*rx*f,z=cz+Math.sin(a)*rz*f;lirios.push({x,z,s:.6+hash(i,63)*.7,r:hash(i,64)*6.3,especie:0});}
 const junco=unir([0,1,2,3,4].map(i=>{const h=.7+hash(i,71)*.5,t=pintar(new THREE.CylinderGeometry(.012,.02,h,4).translate(0,h/2,0),'#4f7a3a','#9cc06c',0,h);t.rotateZ((hash(i,72)-.5)*.3);t.translate(Math.cos(i*1.3)*.08,0,Math.sin(i*1.3)*.08);
  if(i<2){const e=pintar(new THREE.CylinderGeometry(.035,.035,.18,6).translate(Math.cos(i*1.3)*.08,h-.05,Math.sin(i*1.3)*.08),'#6b4329','#7d5233',0,1);return unir([t,e]);}return t;}));
 g.add(instancias(junco,matVertices(),juncos,['#ffffff','#e8f0d4'].map(c=>new THREE.Color(c)),false));
 const piedra=pintar(bola(1,.12,5).scale(1,.55,.85).translate(0,.12,0),'#7f7c72','#c4bfb0',-.3,.6);g.add(instancias(piedra,matVertices(),piedras,['#ffffff','#e8e2d6','#d6d0c4'].map(c=>new THREE.Color(c))));
 const hoja=new THREE.CircleGeometry(.42,14,.35,Math.PI*2-.7).rotateX(-Math.PI/2).translate(0,.035,0);pintar(hoja,'#4f8a45','#4f8a45',0,1);
 g.add(instancias(hoja,matVertices({roughness:.5}),lirios,['#ffffff','#d9ecc0','#c3e0b0'].map(c=>new THREE.Color(c)),false));
 return g;
}

/** Sendero de tierra (centro, ancho y fondo): la textura va a lo ancho para que los bordes se pierdan en el pasto. */
export function senderoTierra(x:number,z:number,w:number,d:number){const g=new THREE.PlaneGeometry(w+.8,d+.8);g.rotateX(-Math.PI/2);const p=g.attributes.position,uv=g.attributes.uv,largo=w>d;
 for(let i=0;i<p.count;i++){const px=p.getX(i),pz=p.getZ(i);uv.setXY(i,largo?(pz+(d+.8)/2)/(d+.8):(px+(w+.8)/2)/(w+.8),(largo?px+x:pz+z)/3);}
 g.translate(x,.026,z);const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:texturaSendero(),transparent:true,depthWrite:false,roughness:1}));m.receiveShadow=true;m.renderOrder=-1;return m;}
/** Textura de sendero: tierra apisonada con dos huellas de carreta, piedritas y los bordes que se pierden en el pasto. */
let texSendero:THREE.Texture|null=null;
export function texturaSendero(){
 if(texSendero)return texSendero;const W=128,H=256,c=lienzo(W,H),ctx=c.getContext('2d')!;
 const img=ctx.createImageData(W,H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const u=x/W,i=(y*W+x)*4,borde=Math.min(u,1-u),ondula=.12+.05*Math.sin(y/H*Math.PI*6+(u<.5?0:2))+.03*Math.sin(y/H*Math.PI*22);
  const alfa=THREE.MathUtils.smoothstep(borde,ondula-.06,ondula+.06),huella=Math.exp(-((Math.abs(u-.5)-.17)**2)/.0025),n=hash(x*7+y*131,3);
  const c=new THREE.Color('#c9a878').lerp(new THREE.Color('#e3c99c'),huella*.6).multiplyScalar(.9+n*.18).lerp(new THREE.Color('#9b8a5e'),(1-alfa)*.5);
  img.data[i]=c.r*255;img.data[i+1]=c.g*255;img.data[i+2]=c.b*255;img.data[i+3]=alfa*255;}
 ctx.putImageData(img,0,0);
 for(let k=0;k<160;k++){const x=W*(.18+hash(k,81)*.64),y=hash(k,82)*H,r=.8+hash(k,83)*2.2;ctx.fillStyle=k%3?'#a58b6488':'#f1e2c2aa';ctx.beginPath();ctx.ellipse(x,y,r,r*.7,hash(k,84)*3,0,6.3);ctx.fill();}
 ctx.lineCap='round';for(let k=0;k<70;k++){const lado=k%2?W*(.04+hash(k,85)*.14):W*(.82+hash(k,85)*.14),y=hash(k,86)*H;ctx.strokeStyle=k%3?'#7d9d55cc':'#a7c271cc';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(lado,y);ctx.lineTo(lado+(hash(k,87)-.5)*5,y-5-hash(k,88)*6);ctx.stroke();}
 texSendero=textura(c);texSendero.userData.compartido=true;return texSendero;
}

/** La cueva de la Mina de Cristal: piso de roca, paredes con vetas, entibados con faroles, rieles con su vagoneta y
 * racimos de cristal que brillan. El color del cristal cambia con el nivel. */
export function cuevaMina(nivel:number):THREE.Group{
 const g=new THREE.Group();g.name='cueva';const cx=0,cz=-1;
 const tono=nivel>=3?{cristal:['#b48cff','#7fe3d6','#e0b8ff'],veta:'#7d6aa6',piso:'#827d8c'}:nivel===2?{cristal:['#9fd4e6','#cfeffa','#7fb8d8'],veta:'#7e8a96',piso:'#86847f'}:{cristal:['#ffb15c','#ffd08a','#ff8f4a'],veta:'#8c6a52',piso:'#8b8378'};
 // Oscuridad alrededor: nada de cielo pálido detrás de las paredes
 const vacio=new THREE.Mesh(new THREE.PlaneGeometry(320,320).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#17141c'}));vacio.position.y=-.4;g.add(vacio);
 // Piso de roca con grietas, gravilla y charquitos
 const c=lienzo(512),ctx=c.getContext('2d')!;ctx.fillStyle='#8a857c';ctx.fillRect(0,0,512,512);
 for(let i=0;i<70;i++){const x=hash(i,1)*512,y=hash(i,2)*512,r=30+hash(i,3)*80,gr=ctx.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,i%2?'#9d978b66':'#6f6a6266');gr.addColorStop(1,'#00000000');for(const dx of [-512,0,512])for(const dy of [-512,0,512]){ctx.fillStyle=gr;ctx.save();ctx.translate(dx,dy);ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();}}
 for(let i=0;i<1400;i++){const x=hash(i,4)*512,y=hash(i,5)*512,r=.8+hash(i,6)*3;ctx.fillStyle=i%4?'#5d5953aa':'#b8b2a5aa';ctx.beginPath();ctx.ellipse(x,y,r,r*.7,hash(i,7)*3,0,6.3);ctx.fill();}
 ctx.strokeStyle='#4a4641aa';ctx.lineCap='round';for(let i=0;i<30;i++){let x=hash(i,8)*512,y=hash(i,9)*512;ctx.lineWidth=1+hash(i,10)*1.5;ctx.beginPath();ctx.moveTo(x,y);for(let k=0;k<5;k++){x+=(hash(i*9+k,11)-.5)*40;y+=(hash(i*9+k,12)-.5)*40;ctx.lineTo(x,y);}ctx.stroke();}
 const piso=new THREE.Mesh(new THREE.CircleGeometry(1,48).rotateX(-Math.PI/2).scale(12.9,1,11.9),new THREE.MeshStandardMaterial({map:textura(c),color:tono.piso,roughness:.95}));
 {const uv=piso.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*6,uv.getY(i)*5.5);}
 piso.position.set(cx,-.01,cz);piso.receiveShadow=true;g.add(piso);
 for(const [x,z,rx,rz] of [[-6.5,-6,1.3,.8],[7,1.5,1,.7],[-3,6.8,.9,.6]]){const ch=new THREE.Mesh(new THREE.CircleGeometry(1,20).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:'#3d4f5a',roughness:.08,metalness:.2,transparent:true,opacity:.75}));ch.scale.set(rx,1,rz);ch.position.set(x,.005,z);g.add(ch);}
 // Paredes: rocas con vetas, altas atrás y bajitas del lado de la cámara (para no tapar al jugador)
 const rocas:THREE.BufferGeometry[]=[];const veta=new THREE.Color(tono.veta),gris=new THREE.Color('#4f4b49'),claro=new THREE.Color('#878078'),hondo=new THREE.Color('#2e2b2a');
 for(const [fila,radio,alto] of [[0,1,1],[1,1.2,1.7]] as [number,number,number][])for(let i=0;i<46;i++){
  const a=(i+hash(i,fila)*.5)/46*Math.PI*2,rx=(12.3+fila*2.6)*radio**0,rz=(11.3+fila*2.6),x=cx+Math.cos(a)*rx,z=cz+Math.sin(a)*rz;
  const frente=Math.max(0,(Math.cos(a)+Math.sin(a))/Math.SQRT2);if(fila===1&&frente>.3)continue;
  if(Math.abs(x)<2.6&&z>6)continue;// boca del túnel de salida
  const h=(1.2+hash(i,3+fila)*1.6)*alto*(1-frente*.78),r=bola(2,.22,i+fila*50);r.scale(1.5+hash(i,4)*.8,h,1.3+hash(i,5)*.6);r.rotateY(hash(i,6)*3);r.translate(x,h*.35,z);
  const p=r.attributes.position,col=new Float32Array(p.count*3);for(let k=0;k<p.count;k++){const y=p.getY(k),banda=Math.sin(y*5.3+p.getX(k)*.7+i)*.5+.5,cc=gris.clone().lerp(claro,banda*.55);if(banda>.9)cc.lerp(veta,.45);cc.lerp(hondo,THREE.MathUtils.clamp(.55-y*.6,0,.55));col.set([cc.r,cc.g,cc.b],k*3);}r.setAttribute('color',new THREE.BufferAttribute(col,3));rocas.push(r);
 }
 // Estalagmitas
 for(let i=0;i<16;i++){const a=hash(i,31)*Math.PI*2,f=.82+hash(i,32)*.08,x=cx+Math.cos(a)*12.3*f,z=cz+Math.sin(a)*11.3*f;if(Math.cos(a)+Math.sin(a)>0)continue;const h=.8+hash(i,33)*1.4,e=new THREE.ConeGeometry(.28+hash(i,34)*.2,h,7,3);e.deleteAttribute('uv');const m=mergeVertices(e.deleteAttribute('normal') as THREE.BufferGeometry);m.computeVertexNormals();m.translate(x,h/2,z);pintar(m,'#6c675f','#b6aea0',0,h);rocas.push(m);}
 const paredes=new THREE.Mesh(unir(rocas),matVertices());paredes.castShadow=paredes.receiveShadow=true;g.add(paredes);
 // Boca del túnel (por donde se sale) con su marco de madera
 const madera=new THREE.MeshStandardMaterial({color:'#8a6242',roughness:.9}),metal=new THREE.MeshStandardMaterial({color:'#5d6168',roughness:.5,metalness:.5});
 const viga=(w:number,h:number,d:number,x:number,y:number,z:number,ry=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),madera);m.position.set(x,y,z);m.rotation.y=ry;m.castShadow=m.receiveShadow=true;g.add(m);return m;};
 // Luz de afuera que entra por la salida
 const entra=new THREE.Mesh(new THREE.CircleGeometry(2.6,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#ffe2a8',transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}));entra.scale.set(1,1,1.4);entra.position.set(0,.02,8.6);g.add(entra);
 for(const s of [-1,1])viga(.3,3,.3,s*2.1,1.5,9.9);viga(4.8,.34,.36,0,3.05,9.9);
 // Entibados contra las paredes del fondo, con farol que alumbra
 const farol=new THREE.MeshStandardMaterial({color:'#ffd88a',emissive:'#ffb347',emissiveIntensity:1.6});
 for(const a of [3.35,3.95,4.55,5.15,2.75]){const x=cx+Math.cos(a)*10.2,z=cz+Math.sin(a)*9.3,ry=-a+Math.PI/2;
  const marco=new THREE.Group();marco.position.set(x,0,z);marco.rotation.y=ry;g.add(marco);
  for(const s of [-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.26,2.7,.26),madera);p.position.set(s*1.1,1.35,0);p.castShadow=true;marco.add(p);}
  const l=new THREE.Mesh(new THREE.BoxGeometry(2.6,.3,.32),madera);l.position.y=2.75;marco.add(l);
  const f=new THREE.Mesh(new THREE.BoxGeometry(.24,.32,.24),farol);f.position.set(0,2.35,.22);marco.add(f);const tapa=new THREE.Mesh(new THREE.ConeGeometry(.2,.16,4),metal);tapa.position.set(0,2.58,.22);tapa.rotation.y=Math.PI/4;marco.add(tapa);
 }
 for(const [x,z] of [[-6,-7],[6,-6.5]]){const luz=new THREE.PointLight('#ffbf70',14,13,1.6);luz.position.set(x,2.4,z);g.add(luz);}
 // Rieles con su vagoneta llena de mineral
 const rx=-5.2;for(let z=-8;z<=8.5;z+=.7)viga(1.25,.07,.18,rx,.04,z);
 for(const s of [-1,1]){const r=new THREE.Mesh(new THREE.BoxGeometry(.07,.08,16.8),metal);r.position.set(rx+s*.45,.11,.25);g.add(r);}
 const vagon=new THREE.Group();vagon.position.set(rx,0,-2.5);g.add(vagon);
 const caja=new THREE.Mesh(new THREE.BoxGeometry(1.1,.62,1.5),new THREE.MeshStandardMaterial({color:'#7a5a3e',roughness:.85}));caja.position.y=.62;caja.castShadow=true;vagon.add(caja);
 for(const y of [.4,.86]){const aro=new THREE.Mesh(new THREE.BoxGeometry(1.14,.06,1.54),metal);aro.position.y=y;vagon.add(aro);}
 for(const sx of [-1,1])for(const sz of [-1,1]){const rueda=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.1,12),metal);rueda.rotation.z=Math.PI/2;rueda.position.set(sx*.5,.19,sz*.48);vagon.add(rueda);}
 const carga=new THREE.MeshStandardMaterial({color:tono.cristal[0],emissive:tono.cristal[0],emissiveIntensity:.25,roughness:.4});for(let i=0;i<6;i++){const m=new THREE.Mesh(bola(1,.2,i),i%2?carga:new THREE.MeshStandardMaterial({color:'#77716a',roughness:.9}));m.scale.setScalar(.22+hash(i,91)*.08);m.position.set((hash(i,92)-.5)*.6,.98,(hash(i,93)-.5)*.9);vagon.add(m);}
 // Racimos de cristal que brillan, pegados a las paredes
 const prismas:THREE.BufferGeometry[]=[];
 for(let n=0;n<11;n++){const a=hash(n,101)*Math.PI*2,x=cx+Math.cos(a)*10.7,z=cz+Math.sin(a)*9.8;if(Math.abs(x)<3&&z>6)continue;
  for(let i=0;i<7;i++){const h=.9+hash(n*7+i,102)*1.5,p=new THREE.CylinderGeometry(0,.24+hash(n*7+i,103)*.1,h*.3,6).translate(0,h*.85,0),cuerpo=new THREE.CylinderGeometry(.24+hash(n*7+i,103)*.1,.26,h*.7,6).translate(0,h*.35,0);const m=unir([cuerpo,p]);m.rotateX((hash(n*7+i,104)-.5)*.9);m.rotateZ((hash(n*7+i,105)-.5)*.9);m.translate(x+(hash(n*7+i,106)-.5)*.6,0,z+(hash(n*7+i,107)-.5)*.6);
   const col=new THREE.Color(tono.cristal[(n+i)%3]),cs=new Float32Array(m.attributes.position.count*3);for(let k=0;k<cs.length;k+=3)cs.set([col.r,col.g,col.b],k);m.setAttribute('color',new THREE.BufferAttribute(cs,3));prismas.push(m);}
  const brillo=new THREE.Mesh(new THREE.CircleGeometry(1.6,20).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:tono.cristal[0],transparent:true,opacity:.32,blending:THREE.AdditiveBlending,depthWrite:false}));brillo.position.set(x,.02,z);g.add(brillo);}
 const cristales=new THREE.Mesh(unir(prismas),new THREE.MeshStandardMaterial({vertexColors:true,emissive:tono.cristal[0],emissiveIntensity:.9,roughness:.15,metalness:.1,transparent:true,opacity:.92}));cristales.castShadow=true;g.add(cristales);
 // Piedritas sueltas
 const sueltas:Sitio[]=[];for(let i=0;i<70;i++){const x=cx+(hash(i,111)-.5)*21,z=cz+(hash(i,112)-.5)*19;if(Math.abs(x-rx)<1)continue;sueltas.push({x,z,s:.08+hash(i,113)*.12,r:hash(i,114)*6,especie:0});}
 g.add(instancias(pintar(bola(1,.2,9).translate(0,.4,0),'#5f5a54','#a8a196',-.5,1.2),matVertices(),sueltas,[new THREE.Color('#ffffff')],false));
 return g;
}
