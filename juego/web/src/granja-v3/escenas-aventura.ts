import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import type {MediosAstra} from './astra-medios';
import * as THREE from 'three';
import {JEFES} from './jefes';
import { caja, esfera, liberar, compactar } from './suelo';
import { destinoAventura, instanciaAventura, MINERALES, MONSTRUOS, MINA } from './aventura';
import { terrenoMina, escaleraMina, cofreMina, paletaMina } from './mina-render';
import { conKit } from './cuartos';
import type { EstadoAventura, InstanciaAventura, MonstruoAventura, NodoAventura, TipoMonstruo, PuntoAventura } from './aventura';

let mediosJefe:MediosAstra['modelos']={},cargarJefe:((archivo:string)=>Promise<{escena:THREE.Group;clips:THREE.AnimationClip[]}>)|undefined;
export function usarArteJefes(m:MediosAstra['modelos'],cargar:NonNullable<typeof cargarJefe>){mediosJefe=m;cargarJefe=cargar;}
export type ObjetivoAventura = { tipo:'monstruo'|'nodo'|'botin'|'entrada'|'situacion'; id:string };
interface FiguraMonstruo { grupo:THREE.Group; cuerpo:THREE.Group; miembros:THREE.Object3D[]; aviso:THREE.Mesh; barra:THREE.Group; relleno:THREE.Mesh; fase:number }
const objetivo=(g:THREE.Object3D,tipo:ObjetivoAventura['tipo'],id:string)=>{g.userData.aventura={tipo,id};g.traverse(o=>{o.userData.aventura={tipo,id};});};
function aro(g:THREE.Object3D,radio:number,y:number,color:string,grosor=.06){const m=new THREE.Mesh(new THREE.TorusGeometry(radio,grosor,6,24),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.38,roughness:.75}));m.rotation.x=-Math.PI/2;m.position.y=y;g.add(m);return m;}
function cristal(g:THREE.Object3D,color:string,x=0,z=0,altura=.6){const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.22,0),new THREE.MeshStandardMaterial({color,roughness:.3,metalness:.15,emissive:color,emissiveIntensity:.17}));mesh.position.set(x,altura*.5+.15,z);mesh.scale.y=altura/.4;g.add(mesh);return mesh;}
function ojos(g:THREE.Object3D,y:number,z:number,separacion=.16){for(const x of [-separacion,separacion]){esfera(g,[.07,.08,.04],[x,y,z],'#f9f5e5');esfera(g,[.033,.044,.022],[x,y,z+.033],'#302d43');}}
function figura(tipo:TipoMonstruo):FiguraMonstruo {
 const grupo=new THREE.Group(),cuerpo=new THREE.Group(),miembros:THREE.Object3D[]=[],color=MONSTRUOS[tipo].color;grupo.add(cuerpo);
 if(tipo==='gelatina'){
  esfera(cuerpo,[.48,.43,.43],[0,.4,0],color);esfera(cuerpo,[.29,.09,.25],[-.11,.73,-.05],'#c7e1b2');ojos(cuerpo,.42,.39,.15);
  for(const x of [-.3,.3])miembros.push(esfera(cuerpo,[.19,.1,.22],[x,.09,.18],color));
 }else if(tipo==='escarabajo'){
  esfera(cuerpo,[.4,.28,.53],[0,.36,0],color);caja(cuerpo,[.035,.055,.65],[0,.64,-.05],'#70536c');esfera(cuerpo,[.3,.25,.26],[0,.29,.48],'#9c755c');ojos(cuerpo,.39,.7,.13);
  for(const x of [-1,1])for(let z=-1;z<=1;z++){const leg=caja(cuerpo,[.4,.09,.09],[x*.41,.2,z*.25],'#70566d');leg.rotation.z=x*.35;miembros.push(leg);}
  for(const x of [-.16,.16]){const a=caja(cuerpo,[.045,.26,.045],[x,.61,.59],'#e4bc86');a.rotation.z=x>0?-.3:.3;}
 }else if(tipo==='murcielago'){
  esfera(cuerpo,[.25,.32,.23],[0,.68,0],color);ojos(cuerpo,.75,.21,.095);
  for(const x of [-1,1]){const oreja=caja(cuerpo,[.11,.26,.1],[x*.15,1,.02],'#7979a8');oreja.rotation.z=x*-.25;const wing=new THREE.Group();wing.position.set(x*.17,.76,0);const w=esfera(wing,[.48,.065,.25],[x*.35,0,-.08],'#8c87b5');w.rotation.y=x*.3;cuerpo.add(wing);miembros.push(wing);}
 }else if(tipo==='guardian'){
  caja(cuerpo,[.65,.71,.48],[0,.65,0],color);caja(cuerpo,[.62,.41,.48],[0,1.19,0],'#a8ac8d');ojos(cuerpo,1.23,.255,.16);
  for(const x of [-1,1]){caja(cuerpo,[.24,.3,.31],[x*.22,.15,0],'#666f64');miembros.push(caja(cuerpo,[.25,.57,.29],[x*.49,.58,.01],'#89917a'));}
  cristal(cuerpo,'#b9d79b',0,.28,.32);esfera(cuerpo,[.2,.045,.18],[-.22,1.41,-.01],'#65836b');
 }else if(tipo==='ascua'){
  esfera(cuerpo,[.29,.42,.29],[0,.7,0],color);esfera(cuerpo,[.19,.27,.2],[0,.72,.09],'#f8cf89');ojos(cuerpo,.77,.29,.09);
  for(const x of [-1,1])miembros.push(esfera(cuerpo,[.14,.2,.14],[x*.31,.62,0],'#d48069'));
  cristal(cuerpo,'#f4b16e',0,0,.85);
 }else if(tipo==='sombra'){
  esfera(cuerpo,[.38,.49,.34],[0,.68,0],color);ojos(cuerpo,.8,.3,.13);
  for(let x=-1;x<=1;x++)miembros.push(esfera(cuerpo,[.13,.22,.15],[x*.21,.25,.04],'#776d96'));
  aro(cuerpo,.29,1.21,'#d7bee9',.035);
 }else {
  caja(cuerpo,[.63,.5,.46],[0,.78,0],color);caja(cuerpo,[.46,.15,.055],[0,.84,.26],'#53647e');esfera(cuerpo,[.1,.075,.04],[0,.84,.3],'#def4da');
  for(const x of [-1,1]){miembros.push(caja(cuerpo,[.17,.37,.2],[x*.41,.7,0],'#b9c2ca'));esfera(cuerpo,[.12,.07,.12],[x*.2,.42,0],'#99dbe0');}
  aro(cuerpo,.43,.32,'#86d2e2',.04);caja(cuerpo,[.05,.25,.05],[0,1.14,0],'#b9cbd4');esfera(cuerpo,[.07,.07,.07],[0,1.3,0],'#e8c779');
 }
 const aviso=new THREE.Mesh(new THREE.CircleGeometry(MONSTRUOS[tipo].alcance+.15,32),new THREE.MeshBasicMaterial({color:'#f2b669',transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide}));aviso.rotation.x=-Math.PI/2;aviso.position.y=.027;aviso.visible=false;grupo.add(aviso);
 const barra=new THREE.Group();barra.position.set(0,1.8,0);caja(barra,[.9,.07,.04],[0,0,0],'#423a53');const relleno=caja(barra,[.85,.05,.05],[0,.005,.003],'#c5df8f');grupo.add(barra);barra.visible=false;
 return {grupo,cuerpo,miembros,aviso,barra,relleno,fase:0};
}
function rocaNodo(n:NodoAventura){
 // Roca grande y redondita con la veta a la vista: trozos de metal o cristales del color del mineral
 const g=new THREE.Group(),color=MINERALES[n.mineral].color,h=(k:number)=>{const v=Math.sin((n.x*12.9+n.z*78.2+k)*43.1)*4375.5;return v-Math.floor(v);};
 const roca=esfera(g,[.5,.36,.46],[0,.28,0],n.mineral==='piedra'?'#9a948c':'#7d7672');roca.rotation.y=h(1)*6;esfera(g,[.3,.22,.28],[.28,.2,.16],'#8a837d');
 if(['carbon','piedra','hierro','cobre','oro','plata','titanio','meteorita','estano','mitrilo','geoda','geoda_helada','geoda_magma','geoda_omni'].includes(n.mineral)){
  for(let k=0;k<6;k++){const angle=k*2.399+h(2),mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(.11+h(k)*.05,0),new THREE.MeshStandardMaterial({color,roughness:n.mineral==='carbon'?.9:.35,metalness:['oro','plata','hierro','titanio','cobre'].includes(n.mineral)?.55:.05}));mesh.position.set(Math.sin(angle)*.33,.3+(k%3)*.12,Math.cos(angle)*.3);mesh.rotation.set(k,k*.6,k*.3);mesh.castShadow=true;g.add(mesh);}
 }else for(let k=0;k<4;k++){const angle=k*2.399+h(3);cristal(g,color,Math.sin(angle)*.25,Math.cos(angle)*.22,.5+k*.12);}
 g.scale.setScalar(1.25);objetivo(g,'nodo',n.id);g.position.set(n.x,0,n.z);
 // Con granja_nodos.glb (personajes/blender/granja_nodos.py): una de las tres rocas de plastilina con grietas y, encima,
 // las pepitas de la veta o el racimo de cristales pintados del color del mineral (mientras carga, lo de arriba)
 conKit(g,'granja_nodos.glb',m=>{
  const roca=m.get(['nodo_roca_a','nodo_roca_b','nodo_roca_c'][Math.floor(h(4)*3)%3]),veta=m.get(PEPITAS.has(n.mineral)?'nodo_pepitas':'nodo_cristales');if(!roca||!veta)return;
  const nuevo=new THREE.Group();nuevo.add(roca.clone(true));const v=veta.clone(true);v.rotation.y=h(5)*6;nuevo.add(v);
  v.traverse(o=>{const x=o as THREE.Mesh;if(x.isMesh)x.material=materialVeta(n.mineral,x.material as THREE.MeshStandardMaterial);});
  for(const c of[...g.children]){c.removeFromParent();c.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}});}
  g.add(nuevo);objetivo(g,'nodo',n.id);
 });
 return g;
}
const PEPITAS=new Set(['carbon','piedra','hierro','cobre','oro','plata','titanio','meteorita','estano','mitrilo','geoda','geoda_helada','geoda_magma','geoda_omni']);
/** El material de la veta de cada mineral (uno por mineral y pieza, compartido entre todos los nodos). */
const vetas=new Map<string,THREE.MeshStandardMaterial>();
function materialVeta(mineral:NodoAventura['mineral'],base:THREE.MeshStandardMaterial){
 if(/brillo/.test(base.name))return base;const clave=mineral+'|'+base.name;let mt=vetas.get(clave);if(mt)return mt;
 const color=MINERALES[mineral].color,metal=['oro','plata','hierro','titanio','cobre','estano','mitrilo'].includes(mineral);
 mt=base.clone();mt.color.set(color);
 if(PEPITAS.has(mineral)){mt.metalness=metal?.6:.05;mt.roughness=mineral==='carbon'?.9:.35;}
 else if(/cristal/.test(base.name)){mt.emissive=new THREE.Color(color);mt.emissiveIntensity=.22;mt.roughness=.2;}
 mt.userData.compartido=true;vetas.set(clave,mt);return mt;
}
export function ambienteAventura(e:EstadoAventura){const d=destinoAventura(e.destinoActual),i=instanciaAventura(e);if(i&&i.destinoId===MINA){const p=paletaMina(i);return{fondo:p.fondo,niebla:p.niebla,luz:p.luz,mina:true};}return{mina:false,fondo:d?.espacial?'#252439':d?.tipo==='reino'?'#3c344c':'#404044',niebla:d?.espacial?'#343249':'#696578',luz:d?.luz??'#e8cfa4'};}

/** Adaptador de escena: geometría estática se reconstruye solo al cambiar de instancia/chunks.
 * `grupo` se añade a la escena anfitriona; sync tras acciones, update cada frame.
 * objetivoDeInterseccion() acepta cualquier mesh hijo obtenido por raycast.
 */
export class EscenaAventura {
 readonly grupo=new THREE.Group();
 readonly group=this.grupo;
 private terreno=new THREE.Group();private objetos=new THREE.Group();private efectos=new THREE.Group();
 private particulas:{mesh:THREE.Mesh;vx:number;vz:number;vy:number;edad:number}[]=[];
 private monstruos=new Map<string,FiguraMonstruo>();private nodos=new Map<string,THREE.Group>();private botin=new Map<string,THREE.Group>();private situaciones=new Map<string,THREE.Group>();private entradas=new Map<string,THREE.Group>();
 private trazosArma=new Map<string,THREE.Group>();
 private avisosJefe=new Map<string,{clave:string;grupo:THREE.Group}>();
 private claveMapa='';private estado:EstadoAventura|null=null;private tiempo=0;
 constructor(){this.grupo.name='expedicion';this.grupo.add(this.terreno,this.objetos,this.efectos);}
 get seleccionables(){return this.objetos.children;}
 objetivoDeInterseccion(obj:THREE.Object3D):ObjetivoAventura|null {let actual:THREE.Object3D|null=obj;while(actual){if(actual.userData.aventura)return actual.userData.aventura as ObjetivoAventura;actual=actual.parent;}return null;}
 private limpiar(){liberar(this.terreno);liberar(this.objetos);liberar(this.efectos);this.terreno=new THREE.Group();this.objetos=new THREE.Group();this.efectos=new THREE.Group();this.particulas=[];this.grupo.add(this.terreno,this.objetos,this.efectos);this.trazosArma.clear();this.avisosJefe.clear();this.monstruos.clear();this.nodos.clear();this.botin.clear();this.situaciones.clear();this.entradas.clear();}
 private deshacer(p:PuntoAventura,color:string){
  for(let k=0;k<7;k++){const a=k*2.399,mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.09+(k%3)*.025,0),new THREE.MeshStandardMaterial({color,roughness:.9}));mesh.position.set(p.x,.4,p.z);this.efectos.add(mesh);this.particulas.push({mesh,vx:Math.cos(a)*1.3,vz:Math.sin(a)*1.3,vy:1.7+k*.1,edad:0});}
  while(this.particulas.length>70){const p=this.particulas.shift()!;liberar(p.mesh);}
 }
 private construir(i:InstanciaAventura){
  if(i.destinoId===MINA){
   // Minas de Celia: piso por tipo (tierra, hielo, lava, caverna…), paredes de roca y escaleras de verdad
   this.terreno.add(terrenoMina(i));
   for(const entrada of i.entradas){const g=escaleraMina(entrada.tipo);g.position.set(entrada.x,0,entrada.z);objetivo(g,'entrada',entrada.id);this.objetos.add(g);this.entradas.set(entrada.id,g);}
   return;
  }
  const d=destinoAventura(i.destinoId)!,dummy=new THREE.Object3D(),floor:number[][]=[],walls:number[][]=[];
  for(const[k,tipo]of Object.entries(i.suelos)){const[x,z]=k.split(',').map(Number);if(tipo==='suelo')floor.push([x,z]);else if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>i.suelos[`${x+dx},${z+dz}`]==='suelo'))walls.push([x,z]);}
  const piso=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.12,1),new THREE.MeshStandardMaterial({color:d.color,roughness:1}),floor.length);piso.receiveShadow=true;
  floor.forEach(([x,z],n)=>{dummy.position.set(x+.5,-.08,z+.5);dummy.scale.set(1,1,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();piso.setMatrixAt(n,dummy.matrix);piso.setColorAt(n,new THREE.Color('#ffffff').multiplyScalar(.9+(((x*7+z*13)%11)+11)%11*.015));});piso.instanceMatrix.needsUpdate=true;this.terreno.add(piso);
  const muro=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.95,1),new THREE.MeshStandardMaterial({color:d.roca,roughness:1}),walls.length);muro.castShadow=true;muro.receiveShadow=true;
  walls.forEach(([x,z],n)=>{dummy.position.set(x+.5,.46,z+.5);dummy.scale.set(1,1+((x*x+z*z)%4)*.08,1);dummy.updateMatrix();muro.setMatrixAt(n,dummy.matrix);});muro.instanceMatrix.needsUpdate=true;this.terreno.add(muro);
  const decoracion=new THREE.Group();
  for(let n=0;n<floor.length;n+=43){const[x,z]=floor[n];if(Math.hypot(x-i.inicio.x,z-i.inicio.z)<3)continue;cristal(decoracion,d.luz,x+.17,z+.15,.2);}
  for(const entrada of i.entradas){
   const g=new THREE.Group(),color=entrada.tipo==='retorno'?'#b9e6cb':'#e3c485';g.position.set(entrada.x,0,entrada.z);
   aro(g,.77,.08,color);caja(g,[1.1,.1,1.1],[0,.025,0],'#b6b0a0');
   for(const x of [-.7,.7]){caja(g,[.18,1.8,.2],[x,.9,0],d.roca);cristal(g,color,x,0,2);}
   const ring=new THREE.Mesh(new THREE.TorusGeometry(.67,.075,8,32),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.5}));ring.position.y=1;g.add(ring);
   objetivo(g,'entrada',entrada.id);this.objetos.add(g);
  }
  compactar(decoracion);this.terreno.add(decoracion);
  const light=new THREE.PointLight(d.luz,5,16,1.5);light.position.set(i.inicio.x,4,i.inicio.z);this.terreno.add(light);
 }
 sync(e:EstadoAventura){
  this.estado=e;const i=instanciaAventura(e);this.grupo.visible=!!i;if(!i)return;
  const key=`${i.id}:${i.semilla}:${Object.keys(i.chunks).sort().join('|')}`;
  if(key!==this.claveMapa){this.limpiar();this.claveMapa=key;this.construir(i);}
  // La escalera escondida aparece en pleno piso: se agrega sin rehacer el terreno
  if(i.destinoId===MINA)for(const entrada of i.entradas)if(!this.entradas.has(entrada.id)){const g=escaleraMina(entrada.tipo);g.position.set(entrada.x,0,entrada.z);objetivo(g,'entrada',entrada.id);this.objetos.add(g);this.entradas.set(entrada.id,g);this.deshacer(entrada,'#f6cf5a');}
  const vivos=new Set(i.monstruos.filter(m=>m.vivo).map(m=>m.id));for(const[id,f]of this.monstruos)if(!vivos.has(id)){const m=i.monstruos.find(m=>m.id===id);if(m)this.deshacer(m,MONSTRUOS[m.tipo].color);liberar(f.grupo);this.monstruos.delete(id);}
  for(const m of i.monstruos)if(m.vivo&&!this.monstruos.has(m.id)){const f=figura((JEFES[m.tipo]?.modeloBase??m.tipo) as TipoMonstruo);objetivo(f.grupo,'monstruo',m.id);this.monstruos.set(m.id,f);this.objetos.add(f.grupo);this.arteJefe(f,m);}
  const activos=new Set(i.nodos.filter(n=>!n.agotado).map(n=>n.id));for(const[id,g]of this.nodos)if(!activos.has(id)){const n=i.nodos.find(n=>n.id===id);if(n)this.deshacer(n,MINERALES[n.mineral].color);liberar(g);this.nodos.delete(id);}
  for(const n of i.nodos)if(!n.agotado){let g=this.nodos.get(n.id);if(!g){g=rocaNodo(n);this.nodos.set(n.id,g);this.objetos.add(g);}else if(g.userData.hp!==n.hp)g.userData.impacto=.18;g.userData.hp=n.hp;}
  const drops=new Set(i.botin.map(b=>b.id));for(const[id,g]of this.botin)if(!drops.has(id)){liberar(g);this.botin.delete(id);}
  for(const b of i.botin)if(!this.botin.has(b.id)){const g=new THREE.Group();cristal(g,MINERALES[b.articulo as keyof typeof MINERALES]?.color??'#accb8c',0,0,.32);aro(g,.22,.045,'#e7dbaa',.018);g.position.set(b.x,0,b.z);objetivo(g,'botin',b.id);this.objetos.add(g);this.botin.set(b.id,g);}
  for(const s of i.situaciones){
   let g=this.situaciones.get(s.id);if(!g){g=new THREE.Group();g.position.set(s.x,0,s.z);
    if(s.tipo==='campamento'){for(const x of [-.24,.24]){const wood=caja(g,[.13,.13,.85],[x,.08,0],'#84604f');wood.rotation.y=x>0?.45:-.45;}cristal(g,'#f4c189',0,0,.7);esfera(g,[.3,.1,.2],[.9,.1,0],'#bcbaad');}
    else if(s.tipo==='cofre')g.add(cofreMina());
    else if(s.tipo==='baliza'){caja(g,[.48,1,.48],[0,.5,0],'#a3b5bf');cristal(g,'#c5edda',0,0,1.5);aro(g,.5,.03,'#bfdfd1');}
    else{esfera(g,[.54,.48,.5],[0,.4,0],'#9993ad');cristal(g,'#dbbfe8',0,.25,.8);}
    objetivo(g,'situacion',s.id);this.objetos.add(g);this.situaciones.set(s.id,g);
   }g.visible=!s.resuelta;
  }
  this.update(0,e);
 }
 update(dt:number,e:EstadoAventura|null=this.estado,centro?:PuntoAventura){
  this.tiempo+=Math.max(0,Math.min(.1,dt));if(!e)return;const i=instanciaAventura(e);if(!i)return;
  const visible=(p:PuntoAventura)=>!centro||Math.hypot(p.x-centro.x,p.z-centro.z)<30;
  const activos=new Set<string>();for(const m of i.monstruos){const p=m.patron;if(!m.vivo||!p||!['aviso','activo'].includes(p.fase))continue;activos.add(m.id);const key=p.elemento+':'+p.ciclo+':'+JSON.stringify([p.centro,p.direccion,p.objetivos]);let aviso=this.avisosJefe.get(m.id);
   if(aviso?.clave!==key){if(aviso)liberar(aviso.grupo);const g=new THREE.Group(),color=MONSTRUOS[m.tipo].color;g.name='patron-'+m.id;g.userData.jefeTipo=m.tipo;g.userData.modeloBase=JEFES[m.tipo]?.modeloBase;this.efectos.add(g);
    const linea=(pts:number[][])=>{const geo=new THREE.BufferGeometry().setFromPoints(pts.map(([x,z])=>new THREE.Vector3(x,.08,z))),l=new THREE.LineLoop(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity:.9}));g.add(l);};
    const aroSimple=(x:number,z:number,r:number)=>linea(Array.from({length:48},(_,i)=>[x+Math.cos(i*Math.PI/24)*r,z+Math.sin(i*Math.PI/24)*r]));
    const banda=(lado:number,frente:number,desde:number)=>linea([[-lado,desde],[lado,desde],[lado,frente],[-lado,frente]].map(([x,z])=>[p.centro.x+p.direccion.z*x+p.direccion.x*z,p.centro.z-p.direccion.x*x+p.direccion.z*z]));
    if(p.elemento==='agua'){aroSimple(p.centro.x,p.centro.z,4.8);aroSimple(p.centro.x,p.centro.z,6.6);}else if(p.elemento==='tierra')for(const q of p.objetivos)aroSimple(q.x,q.z,1.7);else if(p.elemento==='aire')banda(1.1,11,-1);else{banda(.85,9,-9);linea([[-9,-.85],[9,-.85],[9,.85],[-9,.85]].map(([x,z])=>[p.centro.x+p.direccion.z*x+p.direccion.x*z,p.centro.z-p.direccion.x*x+p.direccion.z*z]));}
    aviso={clave:key,grupo:g};this.avisosJefe.set(m.id,aviso);
   }aviso.grupo.visible=visible(m);
  }for(const [id,aviso]of this.avisosJefe)if(!activos.has(id)){liberar(aviso.grupo);this.avisosJefe.delete(id);}
  const trazos=[...(e.proyectiles??[]).map(p=>({...p,id:'p'+p.id})),...(e.invocacion?[{id:'inv',...e.invocacion}]:[])];
  const ids=new Set(trazos.map(p=>p.id));for(const [id,g] of this.trazosArma)if(!ids.has(id)){liberar(g);this.trazosArma.delete(id);}
  for(const p of trazos){let g=this.trazosArma.get(p.id);if(!g){g=new THREE.Group();const color=p.modo==='sello_fuego'?'#df7359':p.modo==='sello_agua'?'#69badb':p.modo==='sello_tierra'?'#86b878':p.modo==='sello_aire'?'#bcc4cd':'#ecdca3';esfera(g,[.14,.14,.14],[0,.65,0],color);this.efectos.add(g);this.trazosArma.set(p.id,g);}g.position.set(p.x,0,p.z);}
  for(const m of i.monstruos){const f=this.monstruos.get(m.id);if(!f)continue;this.animar(f,m);const mixer=f.grupo.userData.mixerJefe as THREE.AnimationMixer|undefined;if(mixer){mixer.update(dt);const fase=m.fase==='anticipacion'?'anticipar':m.fase==='ataque'?'atacar':'reposo';if(f.grupo.userData.faseArte!==fase){f.grupo.userData.faseArte=fase;const clip=(f.grupo.userData.clipsJefe as THREE.AnimationClip[]).find(c=>c.name===fase);if(clip){mixer.stopAllAction();mixer.clipAction(clip).play();}}}f.grupo.visible=m.vivo&&visible(m);}
  for(const n of i.nodos){const g=this.nodos.get(n.id);if(!g)continue;g.visible=visible(n);const t=Math.max(0,(g.userData.impacto??0)-dt);g.userData.impacto=t;g.rotation.z=t>0?Math.sin(t*90)*t*.5:0;}
  for(const p of this.particulas){p.edad+=dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.z+=p.vz*dt;p.mesh.position.y+=p.vy*dt;p.vy-=dt*6;p.mesh.rotation.x+=dt*4;p.mesh.scale.setScalar(Math.max(0,1-p.edad/.65));}
  this.particulas=this.particulas.filter(p=>{if(p.edad<.65)return true;liberar(p.mesh);return false;});
  for(const [id,g]of this.botin){g.position.y=Math.sin(this.tiempo*2+id.length)*.07;g.rotation.y=this.tiempo*.6;}
  for(const b of i.botin){const g=this.botin.get(b.id);if(g)g.visible=visible(b);}
  for(const s of i.situaciones){const g=this.situaciones.get(s.id);if(g)g.visible=!s.resuelta&&visible(s);}
 }
 frame(dt:number,e?:EstadoAventura){this.update(dt,e??this.estado);}
 private arteJefe(f:FiguraMonstruo,m:MonstruoAventura){const d=mediosJefe['jefe:'+m.tipo],cargar=cargarJefe;if(!d||!cargar)return;void cargar(d.archivo.replace(/^\.\/modelos\//,'')).then(({escena,clips})=>{if(!f.grupo.parent||this.monstruos.get(m.id)!==f)return;const g=clone(escena);g.scale.setScalar(d.escala??1);g.traverse(o=>{const mesh=o as THREE.Mesh;if(!mesh.isMesh)return;mesh.geometry.userData.compartido=true;for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material])mat.userData.compartido=true;});for(const hijo of [...f.cuerpo.children])liberar(hijo);f.miembros=[];f.cuerpo.add(g);objetivo(g,'monstruo',m.id);if(clips.length){const mixer=new THREE.AnimationMixer(g);f.grupo.userData.mixerJefe=mixer;f.grupo.userData.clipsJefe=clips;mixer.clipAction(clips.find(c=>c.name==='reposo')??clips[0]).play();}}).catch(()=>{});}
 private animar(f:FiguraMonstruo,m:MonstruoAventura){
  const t=this.tiempo,moving=['patrulla','persecucion'].includes(m.fase),wind=m.fase==='anticipacion',attack=m.fase==='ataque';
  f.grupo.visible=m.vivo;f.grupo.position.set(m.x,0,m.z);f.cuerpo.rotation.y=Math.atan2(m.direccion.x,m.direccion.z);
  f.cuerpo.position.y=['ascua','sombra','centinela','murcielago'].includes(m.tipo)?Math.sin(t*3+m.origen.x)*.09:moving?Math.abs(Math.sin(t*8))*.055:Math.sin(t*2)*.016;
  f.cuerpo.scale.set(1,1,1);if(m.tipo==='gelatina'){f.cuerpo.scale.y=wind?.73:1+Math.sin(t*(moving?8:2))*.045;f.cuerpo.scale.x=wind?1.12:1;}
  f.cuerpo.rotation.z=wind?Math.sin(t*18)*.04:attack?.18:0;
  f.miembros.forEach((limb,k)=>{if(m.tipo==='murcielago')limb.rotation.z=Math.sin(t*11)*(k?-.65:.65);else if(moving)limb.rotation.x=Math.sin(t*9+k*Math.PI)*.22;else limb.rotation.x=0;});
  f.aviso.visible=wind||attack||m.fase==='alerta';const mat=f.aviso.material as THREE.MeshBasicMaterial;mat.color.set(attack?'#d78985':wind?'#e8b86e':'#e9e0ae');mat.opacity=attack?.34:wind?.16+(Math.sin(t*10)+1)*.035:.09;
  f.barra.visible=m.hp<m.hpMax||wind;f.relleno.scale.x=Math.max(.001,m.hp/m.hpMax);f.relleno.position.x=-.425*(1-m.hp/m.hpMax);
  if(m.invulnerable>0)f.cuerpo.scale.multiplyScalar(1+Math.sin(t*45)*.035);
 }
 dispose(){liberar(this.grupo);this.avisosJefe.clear();this.trazosArma.clear();this.monstruos.clear();this.nodos.clear();this.botin.clear();this.situaciones.clear();this.estado=null;this.claveMapa='';}
}
