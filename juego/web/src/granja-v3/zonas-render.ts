import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SALIDAS } from './caminos-mundo';
import type { Zona } from './catalogo';

/** Arte de las zonas fuera de la granja: la cueva de la Mina de Cristal, el monte espeso alrededor del bosque, del
 * bosque ancestral y del lago, el sotobosque, la orilla del lago y la textura de los senderos. Todo es decorado: no
 * cambia por dónde se camina ni qué se puede recoger. */

const hash=(i:number,k=0)=>{const n=Math.sin(i*127.1+k*311.7)*43758.5453;return n-Math.floor(n);};
const LIMITES:Partial<Record<Zona,[number,number,number,number]>>={bosque:[-101,-57,-24,23],bosque_ancestral:[-102,-55,52,100],lago:[5,49,74,111],granja:[-50,50,-40,56],pueblo:[50,112,-43,44]};
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
 const copas=[[0,2.9,0,1.25],[.75,2.55,.3,.85],[-.7,2.6,-.2,.9],[.15,2.5,-.75,.85],[-.2,3.55,.15,.85]].map(([x,y,z,r],i)=>bola(1,.1,i*1.7).scale(r,r*.9,r).translate(x,y,z));
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
export function monteZona(zona:Zona,senderos:[number,number,number,number][],obstaculos:{x:number;z:number}[],libres:[number,number,number,number][]=[]):THREE.Group{
 const g=new THREE.Group();g.name='monte';const b=LIMITES[zona];if(!b)return g;
 const antiguo=zona==='bosque_ancestral',lago=zona==='lago';
 const llegada={bosque:{x:-78,z:3},bosque_ancestral:{x:-78,z:79},lago:{x:14.5,z:80.5}}[zona as 'bosque'];
 const salidas=[...SALIDAS.filter(s=>s.desde===zona||s.hacia===zona).map(s=>s.desde===zona?{x:s.x,z:s.z}:s.llegada),...(llegada?[llegada]:[])];
const enSendero=(x:number,z:number,m:number)=>libres.some(([cx,cz,w,d])=>Math.abs(x-cx)<w/2+m&&Math.abs(z-cz)<d/2+m)||senderos.some(([cx,cz,w,d])=>Math.abs(x-cx)<w/2+m&&Math.abs(z-cz)<d/2+m)||salidas.some(s=>Math.hypot(x-s.x,z-s.z)<m+4);
 const fuera:Sitio[][]=[[],[]];let k=0;
 for(let x=b[0]-10;x<b[1]+10;x+=2.5)for(let z=b[2]-10;z<b[3]+10;z+=2.5){k++;
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
 // La granja y el pueblo solo llevan el monte del borde; el sotobosque es de los bosques y el lago
 if(zona==='granja'||zona==='pueblo')return g;
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
/** Dónde está el pozo de bajada y el ascensor en la entrada de la mina. */
export const POZO_MINA={x:0,z:-8.2};
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
 // Pozo de la mina (escalera al piso 1) y jaula del ascensor al fondo: acercarse abre los botones para bajar
 {const pozo=new THREE.Group();pozo.position.set(POZO_MINA.x,0,POZO_MINA.z);g.add(pozo);
  const hueco=new THREE.Mesh(new THREE.CircleGeometry(1.1,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#060508'}));hueco.position.set(-1.4,.012,0);pozo.add(hueco);
  const borde=new THREE.Mesh(new THREE.TorusGeometry(1.12,.16,6,24),new THREE.MeshStandardMaterial({color:'#6d6258',roughness:.95}));borde.rotation.x=-Math.PI/2;borde.position.set(-1.4,.05,0);pozo.add(borde);
  for(const sx of [-1,1]){const l=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,1.6),madera);l.position.set(-1.4+sx*.28,.1,0);l.rotation.x=-.45;pozo.add(l);}
  for(let k=0;k<5;k++){const p=new THREE.Mesh(new THREE.BoxGeometry(.6,.05,.07),madera);p.position.set(-1.4,.3-k*.13,-.5+k*.25);pozo.add(p);}
  // Jaula del ascensor: cuatro postes, techo con polea, rejas y una lucecita
  const jaula=new THREE.Group();jaula.position.set(1.4,0,0);pozo.add(jaula);
  for(const [x,z] of [[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]]){const p=new THREE.Mesh(new THREE.BoxGeometry(.14,2.6,.14),metal);p.position.set(x,1.3,z);p.castShadow=true;jaula.add(p);}
  const techo=new THREE.Mesh(new THREE.BoxGeometry(1.7,.16,1.7),madera);techo.position.y=2.65;jaula.add(techo);
  const polea=new THREE.Mesh(new THREE.TorusGeometry(.25,.06,8,16),metal);polea.position.y=3;jaula.add(polea);
  const cable=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,2,5),metal);cable.position.y=4;jaula.add(cable);
  for(let k=0;k<6;k++){const r=new THREE.Mesh(new THREE.BoxGeometry(.04,2.4,.04),metal);r.position.set(-.55+k*.22,1.25,-.7);jaula.add(r);}
  const piso=new THREE.Mesh(new THREE.BoxGeometry(1.5,.1,1.5),madera);piso.position.y=.05;jaula.add(piso);
  const luz=new THREE.Mesh(new THREE.BoxGeometry(.2,.26,.2),farol);luz.position.set(0,2.35,.62);jaula.add(luz);
  const aro=new THREE.Mesh(new THREE.RingGeometry(2.4,2.6,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:tono.cristal[0],transparent:true,opacity:.35,depthWrite:false}));aro.position.y=.02;pozo.add(aro);}
 // Piedritas sueltas
 const sueltas:Sitio[]=[];for(let i=0;i<70;i++){const x=cx+(hash(i,111)-.5)*21,z=cz+(hash(i,112)-.5)*19;if(Math.abs(x-rx)<1)continue;sueltas.push({x,z,s:.08+hash(i,113)*.12,r:hash(i,114)*6,especie:0});}
 g.add(instancias(pintar(bola(1,.2,9).translate(0,.4,0),'#5f5a54','#a8a196',-.5,1.2),matVertices(),sueltas,[new THREE.Color('#ffffff')],false));
 return g;
}

/** Árboles talables lejanos dibujados con instancias (los cercanos usan el modelo completo, que se sacude y cae).
 * Geometría y material se comparten entre reconstrucciones. */
let lejanos:{roble:{tronco:THREE.BufferGeometry;copa:THREE.BufferGeometry};pino:{tronco:THREE.BufferGeometry;copa:THREE.BufferGeometry};mat:THREE.MeshStandardMaterial}|null=null;
export function arbolesLejanos(arboles:{id:string;x:number;z:number}[],antiguo:boolean):THREE.Group{
 if(!lejanos){lejanos={roble:geoRoble(),pino:geoPino(),mat:matVertices()};for(const g of [lejanos.roble.tronco,lejanos.roble.copa,lejanos.pino.tronco,lejanos.pino.copa])g.userData.compartido=true;lejanos.mat.userData.compartido=true;}
 const g=new THREE.Group();g.name='arboles-lejanos';const sitios:Sitio[][]=[[],[]];
 for(const a of arboles){let h=0;for(let i=0;i<a.id.length;i++)h=(h*31+a.id.charCodeAt(i))>>>0;sitios[h%10<(antiguo?4:3)?1:0].push({x:a.x+.5,z:a.z+.5,s:(antiguo?.95:.72)*(.9+(h%7)*.03),r:(h%628)/100,especie:0});}
 const verdes=(antiguo?['#a3bc90','#8fae84','#b4c69c']:['#ffffff','#eef5d8','#dfeac0']).map(c=>new THREE.Color(c)),madera=['#ffffff','#e6d9c9'].map(c=>new THREE.Color(c));
 const l=lejanos;g.add(instancias(l.roble.tronco,l.mat,sitios[0],madera),instancias(l.roble.copa,l.mat,sitios[0],verdes),instancias(l.pino.tronco,l.mat,sitios[1],madera),instancias(l.pino.copa,l.mat,sitios[1],verdes));
 return g;
}

/** Arco de madera con letrero al final de un camino de la granja (como las salidas de Stardew). */
export function arcoSalida(nombre:string,x:number,z:number,horizontal:boolean):THREE.Group{
 const g=new THREE.Group();g.position.set(x,0,z);if(horizontal)g.rotation.y=Math.PI/2;
 const madera=new THREE.MeshStandardMaterial({color:'#8a6242',roughness:.9}),oscura=new THREE.MeshStandardMaterial({color:'#6b4a33',roughness:.9});
 for(const s of [-1.6,1.6]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.13,.16,2.8,8),madera);p.position.set(s,1.4,0);p.castShadow=true;g.add(p);
  const piedra=new THREE.Mesh(new THREE.DodecahedronGeometry(.3,1),new THREE.MeshStandardMaterial({color:'#a9a596',roughness:.95}));piedra.scale.set(1,.5,1);piedra.position.set(s,.1,0);g.add(piedra);}
 const viga=new THREE.Mesh(new THREE.BoxGeometry(3.9,.22,.26),oscura);viga.position.y=2.75;viga.castShadow=true;g.add(viga);
 // Letrero con el nombre del destino, colgado de dos cadenitas
 const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d')!;ctx.fillStyle='#d9b98a';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#8a6242';ctx.lineWidth=10;ctx.strokeRect(5,5,502,118);
 for(let k=0;k<6;k++){ctx.strokeStyle='#c4a272';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(10,20+k*18);ctx.lineTo(502,24+k*18);ctx.stroke();}
 ctx.fillStyle='#4a3324';ctx.font='700 52px Nunito, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(nombre,256,68,480);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 const tabla=new THREE.Mesh(new THREE.BoxGeometry(2.4,.6,.08),[madera,madera,madera,madera,new THREE.MeshStandardMaterial({map:tex,roughness:.85}),new THREE.MeshStandardMaterial({map:tex,roughness:.85})]);tabla.position.y=2.22;tabla.castShadow=true;g.add(tabla);
 for(const s of [-.9,.9]){const cad=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.3,4),new THREE.MeshStandardMaterial({color:'#5d5a58'}));cad.position.set(s,2.55,0);g.add(cad);}
 // Faroles a los lados y flores al pie
 for(const s of [-1.6,1.6]){const f=new THREE.Mesh(new THREE.BoxGeometry(.18,.24,.18),new THREE.MeshStandardMaterial({color:'#ffd88a',emissive:'#ffb347',emissiveIntensity:.9}));f.position.set(s,2.05,.2);g.add(f);
  for(let k=0;k<5;k++){const fl=new THREE.Mesh(new THREE.SphereGeometry(.07,6,4),new THREE.MeshStandardMaterial({color:['#f4a7b9','#f7d55a','#ffffff','#c9a3e0'][k%4]}));fl.position.set(s+(k-2)*.13,.18,.35+(k%2)*.12);g.add(fl);}}
 return g;
}

/** Adelanto de la zona a la que lleva cada salida de la granja, más allá del arco: así el borde no se ve como un
 * prado vacío. Pueblo: casitas, faroles y cerca; bosque: pinos grandes y troncos; mina: la montaña con la boca de la
 * mina y rieles; lago: un pedazo de agua con juncos y muelle. Solo decorado. */
export function adelantoZona(hacia:Zona,x:number,z:number,mallaAgua:(rx:number,rz:number)=>THREE.Mesh):THREE.Group{
 const g=new THREE.Group();g.name='adelanto-'+hacia;g.position.set(x,0,z);
 const mat=(c:string,extra:THREE.MeshStandardMaterialParameters={})=>new THREE.MeshStandardMaterial({color:c,roughness:.85,...extra});
 const caja=(w:number,h:number,d:number,px:number,py:number,pz:number,c:string|THREE.Material)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof c==='string'?mat(c):c);m.position.set(px,py,pz);m.castShadow=m.receiveShadow=true;g.add(m);return m;};
 if(hacia==='pueblo'){
  // Dos casitas del pueblo con techo de teja, ventanas con luz, cerca y faroles a lado y lado del camino
  for(const [cx,cz,pared,techo] of [[9,-6,'#f0dabc','#c9715a'],[11,6,'#e6d3b0','#7d9a6a'],[17,-1,'#efe2c8','#b3684f']] as [number,number,string,string][]){
   caja(4,2.4,3.4,cx,1.2,cz,pared);for(const s of [-1,1]){const t=caja(2.6,.18,3.9,cx+s*1.05,2.95,cz,techo);t.rotation.z=-s*.6;}
   caja(.8,1.3,.08,cx-2.04,.65,cz,'#7a5236').rotation.y=Math.PI/2;for(const dz of [-1,1])caja(.08,.6,.6,cx-2.04,1.4,cz+dz*1,new THREE.MeshStandardMaterial({color:'#ffe2a0',emissive:'#ffb347',emissiveIntensity:.4}));
   caja(.5,.9,.5,cx+.8,3.3,cz-.8,'#a8a296');}
  for(const s of [-1,1]){caja(.12,2.4,.12,3,1.2,s*2.2,'#536271');caja(.38,.42,.34,3,2.5,s*2.2,new THREE.MeshStandardMaterial({color:'#ffe2a0',emissive:'#ffb347',emissiveIntensity:.8}));
   for(let k=0;k<6;k++){caja(.12,.9,.12,5+k*1.4,.45,s*3.4,'#b98e62');}caja(7.2,.1,.1,8.5,.7,s*3.4,'#b98e62');}
 }else if(hacia==='bosque'){
  // Pinos altos a lado y lado y un tronco caído con hongos
  for(let k=0;k<10;k++){const lado=k%2?1:-1,px=-3-k*1.6,pz=lado*(3+((k*7)%3));const h=3+((k*5)%4);const tronco=caja(.35,h*.45,.35,px,h*.22,pz,'#5c3d2a');void tronco;
   for(let n=0;n<3;n++){const c=new THREE.Mesh(new THREE.ConeGeometry(1.3-n*.3,1.6,9),mat(['#3f6b3d','#4c7a45','#5d8a50'][n]));c.position.set(px,h*.45+n*.9,pz);c.castShadow=true;g.add(c);}}
  const log=new THREE.Mesh(new THREE.CylinderGeometry(.35,.4,3,10),mat('#6d4a33'));log.rotation.z=Math.PI/2;log.rotation.y=.4;log.position.set(-6,.35,-2.4);g.add(log);
  for(let k=0;k<4;k++){const h=new THREE.Mesh(new THREE.SphereGeometry(.16,8,5,0,Math.PI*2,0,Math.PI/2),mat('#d2543f'));h.position.set(-6.6+k*.4,.68,-2.3+(k%2)*.2);g.add(h);}
 }else if(hacia==='mina'){
  // La montaña con la boca de la mina, su marco de madera, rieles y una vagoneta
  const roca=mat('#8a837b');for(let k=0;k<9;k++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),roca);m.scale.set(3+((k*3)%4),3+((k*5)%5),2.5+((k*7)%3));m.position.set(-9+k*2.4,1+((k*5)%3),-9-((k*3)%4));m.castShadow=true;g.add(m);}
  caja(3.2,3,1.5,0,1.5,-6.5,'#1a1714');for(const s of [-1,1])caja(.35,3.4,.35,s*1.8,1.7,-5.7,'#7a5236');caja(4.2,.4,.45,0,3.4,-5.7,'#6b4a33');
  for(let k=0;k<7;k++)caja(1.3,.08,.22,0,.05,-5+k*.8,'#6b4a33');for(const s of [-.45,.45])caja(.08,.1,5.8,s,.13,-2.3,'#5d6168');
  caja(1,.6,1.3,0,.55,-3,'#7a5a3e');for(let k=0;k<4;k++){const p=new THREE.Mesh(new THREE.DodecahedronGeometry(.22,0),mat(['#c8743c','#b7c0c6','#f2c14a','#9b938a'][k]));p.position.set(-.25+(k%2)*.5,.95,-3.3+Math.floor(k/2)*.6);g.add(p);}
  const farol=caja(.25,.3,.25,1.8,2.6,-5.4,new THREE.MeshStandardMaterial({color:'#ffe2a0',emissive:'#ffb347',emissiveIntensity:.9}));void farol;
 }else if(hacia==='lago'){
  // Un pedazo del lago con su muelle, juncos y piedras
  const agua=mallaAgua(7,4);agua.position.set(0,.02,10);g.add(agua);
  const orilla=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.03,40),mat('#d9c69a',{roughness:1}));orilla.scale.set(8,1,5);orilla.position.set(0,.004,10);g.add(orilla);
  for(let k=0;k<6;k++)caja(1.2,.1,.5,0,.2,5.6+k*.5,'#a07850');for(const s of [-.5,.5])for(let k=0;k<3;k++)caja(.12,.6,.12,s,0,6+k*1.2,'#7a5236');
  for(let k=0;k<26;k++){const a=k/26*Math.PI*2,px=Math.cos(a)*7.4,pz=10+Math.sin(a)*4.3;if(Math.abs(px)<1.4&&pz<10)continue;const j=new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,.9,4),mat('#6f9a4a'));j.position.set(px,.45,pz);g.add(j);if(k%3===0){const e=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.2,6),mat('#6b4329'));e.position.set(px,.85,pz);g.add(e);}}
 }
 return g;
}

/** Muebles de la cabaña (por dentro): cama doble con colcha de retazos, mesitas con lámpara, cocina con estufa y
 * repisas, mesa con dos sillas y flores, chimenea encendida, biblioteca, plantas y cuadros. Todo pegado a las paredes
 * para dejar libre el paso. */
export function amoblarCabana():THREE.Group{
 const g=new THREE.Group();g.name='muebles-cabana';
 const m=(c:string,extra:THREE.MeshStandardMaterialParameters={})=>new THREE.MeshStandardMaterial({color:c,roughness:.8,...extra});
 const caja=(w:number,h:number,d:number,x:number,y:number,z:number,c:string|THREE.Material)=>{const k=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof c==='string'?m(c):c);k.position.set(x,y,z);k.castShadow=k.receiveShadow=true;g.add(k);return k;};
 const bola=(r:number,x:number,y:number,z:number,c:string|THREE.Material,sx=1,sy=1,sz=1)=>{const k=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),typeof c==='string'?m(c):c);k.position.set(x,y,z);k.scale.set(sx,sy,sz);k.castShadow=true;g.add(k);return k;};
 const cil=(r:number,h:number,x:number,y:number,z:number,c:string|THREE.Material)=>{const k=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),typeof c==='string'?m(c):c);k.position.set(x,y,z);k.castShadow=true;g.add(k);return k;};
 const madera='#9a6f4c',oscura='#6e4b33',luz=m('#ffe2a0',{emissive:'#ffb347',emissiveIntensity:.9});
 // Cama doble
 caja(2.2,.35,2.5,-2.6,.3,-2.55,madera);caja(2.3,1.1,.16,-2.6,.75,-3.8,oscura);caja(2.05,.22,2.3,-2.6,.58,-2.5,'#f3ead8');
 for(let i=0;i<5;i++)for(let j=0;j<4;j++)caja(.4,.06,.36,-3.4+i*.4,.72,-2.15+j*.38,['#d9654f','#e9b44c','#6fa3c7','#f4a7b9','#7fb77e'][(i+j)%5]);
 for(const x of [-3.1,-2.1])bola(.32,x,.78,-3.45,'#ffffff',1.2,.45,.8);
 caja(.9,.5,.5,-2.6,.25,-1.05,oscura);caja(.95,.06,.55,-2.6,.52,-1.05,madera);
 for(const x of [-3.95,-1.25]){caja(.55,.6,.5,x+(x<-2?.25:0),.3,-3.6,madera);cil(.08,.25,x+(x<-2?.25:0),.72,-3.6,'#d9c9a8');const pantalla=new THREE.Mesh(new THREE.ConeGeometry(.2,.22,10,1,true),luz);pantalla.position.set(x+(x<-2?.25:0),.95,-3.6);g.add(pantalla);}
 // Cocina: mesón, estufa de leña, olla, repisas con frascos
 caja(2.6,.9,.6,2.6,.45,-3.65,madera);caja(2.7,.08,.66,2.6,.92,-3.65,'#d9cdb8');caja(.8,.95,.62,3.55,.48,-3.64,'#4a4a4f');caja(.62,.3,.05,3.55,.45,-3.32,'#e9a14e');cil(.08,.9,3.75,1.4,-3.75,'#3c3c40');
 cil(.18,.2,1.9,1.06,-3.6,'#b0b7bc');for(let k=0;k<2;k++){caja(2.4,.06,.3,2.4,1.55+k*.45,-3.85,oscura);for(let j=0;j<5;j++)cil(.07,.2,1.5+j*.42,1.68+k*.45,-3.82,['#e3b45a','#c9563f','#8fbf7a','#d9c9a8','#7aa7c7'][(j+k)%5]);}
 // Mesa con dos sillas y florero
 cil(.65,.08,2.2,.82,-.6,madera);cil(.08,.78,2.2,.4,-.6,oscura);for(const dz of [-1,1]){caja(.5,.06,.5,2.2,.48,-.6+dz*.95,madera);caja(.5,.6,.06,2.2,.8,-.6+dz*1.18,madera);for(const dx of [-.2,.2])for(const ez of [-.2,.2])caja(.05,.46,.05,2.2+dx,.23,-.6+dz*.95+ez,oscura);}
 cil(.1,.22,2.2,.97,-.6,'#7aa7c7');for(let k=0;k<5;k++)bola(.07,2.2+Math.cos(k*1.3)*.09,1.15+(k%2)*.05,-.6+Math.sin(k*1.3)*.09,['#f4a7b9','#f7d55a','#ffffff'][k%3]);
 // Chimenea de piedra con fuego
 caja(.6,1.6,1.6,-3.7,.8,1.4,'#a69f92');caja(.62,.15,1.8,-3.65,1.62,1.4,oscura);caja(.3,.7,.9,-3.45,.45,1.4,'#2d2421');const fuego=bola(.22,-3.4,.35,1.4,m('#ffb347',{emissive:'#ff7a1a',emissiveIntensity:1.2}),1,1.4,1);fuego.name='fuego-chimenea';
 caja(.4,1.4,.6,-3.75,2.2,1.4,'#a69f92');const calor=new THREE.PointLight('#ffb36b',5,7,1.6);calor.position.set(-3,1,1.4);g.add(calor);
 // Biblioteca, baúl, plantas y cuadros
 caja(.45,1.9,1.3,-3.75,.95,-.5,oscura);for(let k=0;k<4;k++){caja(.42,.05,1.25,-3.72,.3+k*.45,-.5,madera);for(let j=0;j<6;j++)caja(.28,.32,.12,-3.7,.48+k*.45,-1.0+j*.19,['#c9563f','#6fa3c7','#e3b45a','#7fb77e','#a58cc4','#d9cdb8'][(j+k)%6]);}
 for(const [x,z] of [[3.5,3.4],[-3.4,3.4],[.9,-3.6]] as [number,number][]){cil(.22,.35,x,.18,z,'#c26e45');for(let k=0;k<6;k++)bola(.16,x+Math.cos(k)*.12,.5+k*.07,z+Math.sin(k)*.12,['#5f8a45','#7fae55','#4c7a45'][k%3]);}
 for(const [x,c] of [[-1.2,'#7aa7c7'],[.2,'#e9b44c']] as [number,string][]){caja(.7,.5,.05,x,2.05,-3.9,oscura);caja(.6,.4,.06,x,2.05,-3.88,c);}
 return g;
}

/** Detalles por dentro de los refugios (en coordenadas del cuarto de 8 × 8): paja regada, farol colgado que alumbra,
 * ventana con luz de afuera, costales de alimento, escoba y, en gallineros, un aseladero para dormir. */
export function adornosRefugio(especie:string):THREE.Group{
 const g=new THREE.Group();g.name='adornos-refugio';const h=(i:number,k:number)=>{const n=Math.sin(i*127.1+k*311.7)*43758.5453;return n-Math.floor(n);};
 const m=(c:string,extra:THREE.MeshStandardMaterialParameters={})=>new THREE.MeshStandardMaterial({color:c,roughness:.85,...extra});
 const caja=(w:number,hh:number,d:number,x:number,y:number,z:number,c:string|THREE.Material,ry=0)=>{const k=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),typeof c==='string'?m(c):c);k.position.set(x,y,z);k.rotation.y=ry;k.castShadow=k.receiveShadow=true;g.add(k);return k;};
 const paja=m('#e3c77a'),oscura=m('#c9a95c');
 for(let i=0;i<70;i++){const x=-3.6+h(i,1)*7.2,z=-3.6+h(i,2)*7.2;if(Math.abs(x)<.9&&z>2)continue;caja(.3,.015,.03,x,.02,z,i%3?paja:oscura,h(i,3)*6.3);}
 // Farol colgado del techo
 const cuerda=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.9,4),m('#6b5a4c'));cuerda.position.set(0,2.75,-.5);g.add(cuerda);
 caja(.26,.32,.26,0,2.15,-.5,m('#ffe2a0',{emissive:'#ffb347',emissiveIntensity:1}));caja(.34,.06,.34,0,2.34,-.5,'#4a4a4f');
 const luz=new THREE.PointLight('#ffc27a',6,9,1.5);luz.position.set(0,1.9,-.5);g.add(luz);
 // Ventana en la pared del fondo con su luz entrando
 for(const z of [-1.6,1.2]){caja(.06,.7,1.1,-3.8,1.05,z,'#6e4b33');caja(.07,.52,.9,-3.78,1.05,z,m('#cfe9ef',{emissive:'#9fd6e6',emissiveIntensity:.35}));caja(.08,.52,.05,-3.75,1.05,z,'#6e4b33');caja(.08,.05,.9,-3.75,1.05,z,'#6e4b33');
  const haz=new THREE.Mesh(new THREE.PlaneGeometry(1,1.8),new THREE.MeshBasicMaterial({color:'#fff4d0',transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}));haz.position.set(-3,.5,z);haz.rotation.set(-Math.PI/2,0,0);haz.scale.set(1,1,1);g.add(haz);}
 // Costales de alimento y escoba junto a la puerta
 for(const [x,z,s] of [[3.3,3.2,1],[2.8,3.4,.85],[3.35,2.65,.8]] as [number,number,number][]){const c=new THREE.Mesh(new THREE.SphereGeometry(.3*s,10,8),m('#d8c49c'));c.scale.set(1,1.35,.9);c.position.set(x,.38*s,z);c.castShadow=true;g.add(c);caja(.12*s,.08,.12*s,x,.8*s,z,'#b39168');}
 const palo=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.5,5),m('#8a6242'));palo.position.set(-1.4,.75,3.8);palo.rotation.z=.18;g.add(palo);caja(.32,.3,.08,-1.53,.12,3.8,'#c9a95c');
 if(especie==='gallina'||especie==='pato'){
  // Aseladero: palos para dormir y su escalerita
  for(const x of [-3.3,-1.9])caja(.08,1.1,.08,x,.55,3.2,'#7a5236');for(let k=0;k<2;k++)caja(1.6,.06,.06,-2.6,.7+k*.3,3.2-k*.35,'#9a6f4c');
  const esc=caja(.3,.04,1.2,-2.6,.35,2.4,'#9a6f4c');esc.rotation.x=.6;
 }
 return g;
}

/** Detalle de los locales del pueblo por dentro (cuarto de 9 × 8, mostrador al fondo): ventanas con luz, lámparas
 * colgadas, tapete y matas para todos, y lo propio de cada oficio contra las paredes, dejando libre el paso. */
export function adornosServicio(servicio:string):THREE.Group{
 const g=new THREE.Group();g.name='adornos-servicio';const h=(i:number,k:number)=>{const n=Math.sin(i*127.1+k*311.7)*43758.5453;return n-Math.floor(n);};
 const m=(c:string,extra:THREE.MeshStandardMaterialParameters={})=>new THREE.MeshStandardMaterial({color:c,roughness:.8,...extra});
 const caja=(w:number,hh:number,d:number,x:number,y:number,z:number,c:string|THREE.Material,ry=0)=>{const k=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),typeof c==='string'?m(c):c);k.position.set(x,y,z);k.rotation.y=ry;k.castShadow=k.receiveShadow=true;g.add(k);return k;};
 const cil=(r:number,hh:number,x:number,y:number,z:number,c:string|THREE.Material,r2=r)=>{const k=new THREE.Mesh(new THREE.CylinderGeometry(r,r2,hh,12),typeof c==='string'?m(c):c);k.position.set(x,y,z);k.castShadow=true;g.add(k);return k;};
 const bola=(r:number,x:number,y:number,z:number,c:string|THREE.Material,sy=1)=>{const k=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),typeof c==='string'?m(c):c);k.position.set(x,y,z);k.scale.y=sy;k.castShadow=true;g.add(k);return k;};
 const madera='#9a6f4c',oscura='#6e4b33',luz=m('#ffe2a0',{emissive:'#ffb347',emissiveIntensity:1});
 // Comunes: ventanas en la pared del fondo, lámparas, tapete de entrada y matas
 for(const x of [-2.6,2.6]){caja(1.3,1,.06,x,1.75,-3.88,oscura);caja(1.1,.8,.07,x,1.75,-3.86,m('#cfe9ef',{emissive:'#9fd6e6',emissiveIntensity:.35}));caja(.05,.8,.08,x,1.75,-3.83,oscura);caja(1.1,.05,.08,x,1.75,-3.83,oscura);caja(1.4,.08,.2,x,1.22,-3.82,oscura);for(let k=0;k<3;k++)bola(.09,x-.4+k*.4,1.32,-3.8,['#f4a7b9','#f7d55a','#c9a3e0'][k]);}
 for(const x of [-1.5,1.5]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.8,4),m('#5a4a3c'));c.position.set(x,2.6,.4);g.add(c);const p=new THREE.Mesh(new THREE.ConeGeometry(.3,.25,12,1,true),m('#c9563f',{side:THREE.DoubleSide}));p.position.set(x,2.15,.4);g.add(p);bola(.1,x,2.05,.4,luz);const l=new THREE.PointLight('#ffcf8a',4,8,1.6);l.position.set(x,1.9,.4);g.add(l);}
 caja(2.4,.02,1.4,0,.02,3,'#b5553f');caja(2.1,.025,1.1,0,.025,3,'#e3b45a');
 for(const [x,z] of [[-4,3.4],[4,3.4]] as [number,number][]){cil(.25,.4,x,.2,z,'#c26e45',.2);for(let k=0;k<7;k++)bola(.17,x+Math.cos(k)*.14,.55+k*.08,z+Math.sin(k)*.14,['#5f8a45','#7fae55','#4c7a45'][k%3]);}
 const C=['#c9563f','#6fa3c7','#e3b45a','#7fb77e','#a58cc4','#d9cdb8'];
 if(servicio==='semillas'){
  // Exhibidor de sobres de semillas, costales de grano, canastas de frutas y calabazas
  caja(.5,1.6,1.6,-4.1,.8,0,oscura);for(let f=0;f<4;f++)for(let k=0;k<5;k++)caja(.06,.26,.22,-3.83,.3+f*.36,-.6+k*.3,C[(f+k)%6]);
  for(const [x,z] of [[-3.6,2],[-3.1,2.3],[3.6,1.2]] as [number,number][]){const s=bola(.32,x,.35,z,'#d8c49c',1.3);void s;caja(.3,.1,.3,x,.75,z,'#b39168');}
  for(const [x,z,c] of [[3.4,-.4,'#d9453d'],[3.4,.4,'#f2a33a']] as [number,number,string][]){cil(.32,.3,x,.15,z,'#a07850',.28);for(let k=0;k<6;k++)bola(.1,x+Math.cos(k)*.15,.36,z+Math.sin(k)*.15,c);}
  for(let k=0;k<3;k++)bola(.25,3.9-k*.35,.22,2.8,'#e8892f',.8);
 }else if(servicio==='herreria'){
  // Yunque, fragua encendida, barril de agua y herramientas colgadas
  caja(.5,.5,.4,2.8,.25,1,'#3a3a3e');caja(.9,.2,.35,2.8,.6,1,'#4a4a50');caja(.25,.12,.25,3.3,.62,1,'#4a4a50');
  caja(1.4,1,1.2,-3.6,.5,1.5,'#7b6f66');caja(1,.12,.8,-3.6,1.05,1.5,m('#ff8a3d',{emissive:'#ff5a1a',emissiveIntensity:1.2}));const f=new THREE.PointLight('#ff8a4a',6,6,1.6);f.position.set(-3.4,1.5,1.5);g.add(f);
  cil(.35,.7,3.8,.35,2.6,madera);cil(.33,.05,3.8,.71,2.6,m('#5c8fa3',{roughness:.2}));
  caja(.08,1.4,2.4,-4.4,1.6,-1.2,oscura);for(let k=0;k<5;k++){caja(.05,.8,.05,-4.3,1.6,-2.2+k*.5,'#8a6242');caja(.06,.12,.3,-4.3,2,-2.2+k*.5,'#9aa3ab');}
 }else if(servicio==='carpinteria'){
  // Tablas apiladas, banco con serrucho, aserrín y una silla de muestra
  for(let k=0;k<6;k++)caja(2.4,.12,.3,-3.5,.08+k*.13,1.5+(k%2)*.05,['#c69a6b','#b88c5e','#cfa477'][k%3],Math.PI/2);
  caja(1.8,.12,.8,3,.85,1.4,madera);for(const dx of [-.8,.8])for(const dz of [-.3,.3])caja(.1,.8,.1,3+dx,.4,1.4+dz,oscura);caja(.6,.05,.15,3,.94,1.4,'#c9cdd2');
  for(let k=0;k<20;k++)caja(.1,.01,.06,2.2+h(k,1)*1.8,.01,1+h(k,2)*1.2,'#e3c79a',h(k,3)*6);
  caja(.5,.06,.5,3.6,.45,3,madera);caja(.5,.6,.06,3.6,.78,2.77,madera);
 }else if(servicio==='animales'){
  // Pacas de heno, costales de alimento, montura y un afiche de vaca
  for(const [x,y,z] of [[-3.6,.27,1.4],[-3.6,.27,2.1],[-3.6,.72,1.75]] as [number,number,number][]){caja(.7,.45,.55,x,y,z,'#e3c77a');}
  for(const z of [-.4,.2])bola(.3,3.8,.36,z,'#d8c49c',1.3);
  caja(.1,.7,.1,3.4,.35,2.2,oscura);caja(.6,.12,.4,3.4,.76,2.2,'#8a4a2e');
  caja(.06,.8,1,-4.42,1.7,-1.5,'#f3ead8');bola(.18,-4.38,1.75,-1.5,'#ffffff',.7);
 }else if(servicio==='clinica'){
  // Vitrina con frascos, camilla, biombo y botiquín
  caja(.5,1.6,1.4,-4.1,.8,-.2,'#e9ecd8');for(let f=0;f<3;f++)for(let k=0;k<4;k++)cil(.06,.18,-3.85,.45+f*.45,-.6+k*.25,['#9fd6e6','#f4a7b9','#bfe39a','#f7d55a'][(f+k)%4]);
  caja(.9,.5,2,3.4,.45,1.6,'#c9cdd2');caja(.95,.12,2.05,3.4,.75,1.6,'#f3f6ee');caja(.8,.12,.4,3.4,.85,.8,'#ffffff');
  caja(.06,1.4,1.2,2.4,.7,2.8,'#cfe0d0');caja(.4,.3,.15,-4.38,1.9,-2.2,'#ffffff');caja(.24,.06,.16,-4.36,1.9,-2.2,'#d9453d');caja(.06,.24,.16,-4.36,1.9,-2.2,'#d9453d');
 }else if(servicio==='posada'){
  // Mesas con jarras, barriles y estantería de botellas
  for(const [x,z] of [[-2.8,1.8],[2.6,2]] as [number,number][]){cil(.6,.08,x,.8,z,madera);cil(.08,.76,x,.4,z,oscura);for(let k=0;k<3;k++){const a=k*2.1;cil(.25,.4,x+Math.cos(a)*.95,.2,z+Math.sin(a)*.95,madera);}cil(.08,.18,x+.15,.93,z,'#c9cdd2');cil(.08,.18,x-.2,.93,z+.1,'#c9cdd2');}
  for(const z of [-.6,.2]){const b=cil(.35,.8,-4,.4,z,madera,.32);void b;for(const y of [.15,.65])cil(.37,.04,-4,y,z,'#5d5a58');}
 }else if(servicio==='archivo'){
  // Bibliotecas altas, globo, mesa de lectura con vela y pergaminos
  for(const z of [-1.4,.2,1.8]){caja(.5,2.2,1.4,-4.1,1.1,z,oscura);for(let f=0;f<5;f++)for(let k=0;k<6;k++)caja(.3,.3,.15,-3.85,.25+f*.42,z-.55+k*.22,C[(f*2+k)%6]);}
  cil(.05,.6,3.6,.3,1.6,'#8a6242');bola(.3,3.6,.85,1.6,'#6fa3c7');caja(1.4,.08,.8,2.6,.8,2.8,madera);for(const dx of [-.6,.6])caja(.08,.78,.7,2.6+dx,.4,2.8,oscura);cil(.05,.2,2.3,.94,2.8,'#f3ead8');bola(.05,2.3,1.08,2.8,luz,1.5);
  for(let k=0;k<3;k++){const r=cil(.06,.5,2.8+k*.15,.88,2.75,'#efe2c8');r.rotation.z=Math.PI/2;}
 }else{
  // Altares: velas, cristales y flores
  for(let k=0;k<8;k++){const x=-3.8+(k%4)*.25,z=1+Math.floor(k/4)*.4;cil(.05,.2+h(k,1)*.2,x,.15,z,'#f3ead8');bola(.04,x,.33+h(k,1)*.2,z,luz,1.6);}
  for(let k=0;k<5;k++){const c=new THREE.Mesh(new THREE.OctahedronGeometry(.18),m(servicio==='altar_aura'?'#f2c14e':'#b48cff',{emissive:servicio==='altar_aura'?'#c08a20':'#7a5ac9',emissiveIntensity:.5}));c.position.set(3.4+h(k,2)*.6,.25+h(k,3)*.3,1+k*.35);c.scale.y=1.6;g.add(c);}
 }
 return g;
}
