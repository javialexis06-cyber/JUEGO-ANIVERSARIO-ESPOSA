import {ACCESOS_CAMPANA} from './accesos-campana';
import * as THREE from 'three';
import { caja, esfera, compactar, liberar } from './suelo';
import { huellaProduccion } from './produccion';
import type { EstadoProduccion, MaquinaProduccion } from './produccion';
import { conKit } from './cuartos';

interface FiguraProduccion {grupo:THREE.Group;articulo:string;moviles:THREE.Object3D[];piloto:THREE.Mesh;proceso:boolean;llena:boolean;portal:boolean;aspersor:boolean}
const PALETA={madera:'#b7885b',oscuro:'#6e5542',metal:'#647d81',claro:'#c8d4c2',cobre:'#bd8962',verde:'#a6d092',oro:'#d6bd80'};
function cilindro(g:THREE.Object3D,radio:number,alto:number,x:number,y:number,z:number,color:string,vertices=12){const m=new THREE.Mesh(new THREE.CylinderGeometry(radio,radio,alto,vertices),new THREE.MeshStandardMaterial({color,roughness:.65,metalness:.12}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function aro(g:THREE.Object3D,radio:number,grosor:number,color:string){const m=new THREE.Mesh(new THREE.TorusGeometry(radio,grosor,6,24),new THREE.MeshStandardMaterial({color,metalness:.4,roughness:.5}));g.add(m);return m;}
function piloto(g:THREE.Object3D){const m=new THREE.Mesh(new THREE.SphereGeometry(.047,8,6),new THREE.MeshBasicMaterial({color:PALETA.verde}));m.position.set(.31,.51,.38);g.add(m);return m;}
/** Qué pieza de granja_maquinas.glb le toca a cada artículo (los que no tienen la suya usan la máquina genérica). */
function claveMaquina(articulo:string){articulo=ACCESOS_CAMPANA.find(d=>d.id===articulo)?.base??articulo;
 if(articulo.startsWith('cofre_'))return articulo.includes('hierro')?'cofre_hierro':'cofre_cobre';
 if(articulo.startsWith('portal_'))return articulo==='portal_verdia'||articulo==='portal_senda'?articulo:'portal_otro';
 if(articulo.startsWith('aspersor_'))return articulo.includes('hierro')?'aspersor_hierro':'aspersor_cobre';
 if(articulo.startsWith('recuperadora_'))return articulo.endsWith('astral')?'recuperadora_astral':articulo.endsWith('hierro')?'recuperadora_hierro':'recuperadora_cobre';
 return ['nave_exploradora','alto_horno','trituradora','taladro_vapor','ensambladora','horno','fundidora','forja','banco_trabajo','cocina','telar','fermentador','prensa','molino_artesanal'].includes(articulo)?articulo:'maquina';
}
export function figura(articulo:string):FiguraProduccion{
 const grupo=new THREE.Group(),fijo=new THREE.Group(),moviles:THREE.Object3D[]=[],portal=articulo.startsWith('portal_')||articulo.startsWith('paso_'),aspersor=articulo.startsWith('aspersor_');grupo.add(fijo);
 const madera=PALETA.madera,oscuro=PALETA.oscuro,metal=articulo.includes('hierro')?PALETA.metal:PALETA.cobre;
 if(articulo.startsWith('cofre_')){
  caja(fijo,[.83,.48,.62],[0,.3,0],madera);caja(fijo,[.87,.14,.66],[0,.61,0],'#c9a06e');
  for(const x of[-.31,.31]){caja(fijo,[.07,.55,.65],[x,.35,0],metal);caja(fijo,[.09,.035,.69],[x,.7,0],metal);}
  caja(fijo,[.15,.19,.055],[0,.5,.343],PALETA.oro);caja(fijo,[.032,.055,.06],[0,.49,.365],oscuro);
  for(const y of[.2,.37])caja(fijo,[.78,.012,.014],[0,y,.318],oscuro);
 }else if(portal){
  const color=articulo==='portal_verdia'?'#97d398':articulo==='portal_senda'?'#c5b9e1':'#aa97ce';
  caja(fijo,[1.86,.14,.87],[0,.07,0],'#8b9585');
  for(const x of[-.76,.76]){caja(fijo,[.28,1.85,.43],[x,.98,0],'#a1a397');for(const y of[.5,.94,1.37])caja(fijo,[.3,.065,.46],[x,y,0],PALETA.oro);}
  const arc=aro(fijo,.76,.16,'#afb4a3');arc.position.y=1.6;arc.scale.y=.54;
  const face=new THREE.Mesh(new THREE.CircleGeometry(.68,32),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.46,side:THREE.DoubleSide,depthWrite:false}));face.scale.y=1.22;face.position.set(0,1.15,.025);grupo.add(face);moviles.push(face);
  for(let i=0;i<7;i++){const star=esfera(grupo,[.035,.06,.025],[Math.sin(i*2.4)*.55,.4+i*.22,.065],i%2?color:'#f4e4ba');moviles.push(star);}
  for(const x of[-.76,.76]){const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.12),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.32,roughness:.4}));gem.position.set(x,1.57,.26);fijo.add(gem);}
 }else if(['nave_exploradora','nave_ensayo'].includes(articulo)){
  caja(fijo,[2.65,.09,2.65],[0,.045,0],'#87948b');for(const x of[-1.12,1.12])for(const z of[-1.12,1.12])caja(fijo,[.3,.018,.12],[x,.1,z],PALETA.oro);
  esfera(fijo,[.78,.49,1.13],[0,.8,0],PALETA.claro);esfera(fijo,[.51,.24,.61],[0,1.13,.18],'#759da8');
  for(const x of[-1,1]){const wing=caja(fijo,[.63,.13,1.1],[x*.83,.59,-.07],PALETA.cobre);wing.rotation.z=x*-.13;cilindro(fijo,.22,.51,x*.74,.68,-.48,PALETA.metal);esfera(fijo,[.16,.1,.16],[x*.74,.38,-.48],'#a3dfe3');caja(fijo,[.12,.39,.13],[x*.55,.29,.63],PALETA.metal);caja(fijo,[.41,.07,.46],[x*.55,.12,.63],PALETA.oscuro);}
  caja(fijo,[.09,.55,.64],[0,1.22,-.83],PALETA.cobre);const rotor=new THREE.Group();rotor.position.set(0,1.68,-.35);cilindro(rotor,.13,.1,0,0,0,PALETA.metal);for(const r of[0,Math.PI/2]){const b=caja(rotor,[1.6,.045,.105],[0,.08,0],PALETA.oro);b.rotation.y=r;}grupo.add(rotor);moviles.push(rotor);
 }else if(aspersor){
  cilindro(fijo,.22,.14,0,.09,0,metal);cilindro(fijo,.065,.53,0,.36,0,metal);const rotor=new THREE.Group();rotor.position.y=.64;caja(rotor,[.69,.07,.075],[0,0,0],metal);for(const x of[-.3,.3])caja(rotor,[.06,.06,.18],[x,0,.045],PALETA.claro);grupo.add(rotor);moviles.push(rotor);
 }else if(articulo.startsWith('recuperadora_')){
  // Recuperadora: cuerpo de hierro con tolva, dos rodillos que trituran, rampa de salida y el símbolo de reciclar
  const tono=articulo.endsWith('astral')?'#8d78c9':articulo.endsWith('hierro')?'#8e9aa3':'#c38a5c';
  caja(fijo,[.86,.55,.74],[0,.3,0],tono);caja(fijo,[.9,.08,.78],[0,.6,0],PALETA.oscuro);
  const tolva=new THREE.Mesh(new THREE.CylinderGeometry(.44,.24,.34,4,1,true),new THREE.MeshStandardMaterial({color:'#9aa3ab',roughness:.55,metalness:.4,side:THREE.DoubleSide}));tolva.rotation.y=Math.PI/4;tolva.position.y=.82;fijo.add(tolva);
  for(const x of[-.12,.12]){const r=new THREE.Group();r.position.set(x,.68,0);const c=cilindro(r,.1,.5,0,0,0,'#5b6168',10);c.rotation.x=Math.PI/2;for(let k=0;k<6;k++){const d=caja(r,[.04,.04,.48],[Math.cos(k)*.11,Math.sin(k)*.11,0],PALETA.claro);d.rotation.z=k;}grupo.add(r);moviles.push(r);}
  const rampa=caja(fijo,[.4,.05,.36],[0,.16,.5],PALETA.metal);rampa.rotation.x=.4;for(let k=0;k<3;k++)esfera(fijo,[.06,.05,.06],[-.1+k*.1,.12,.62],['#c8743c','#b7c0c6','#b7885b'][k]);
  const signo=aro(fijo,.13,.025,'#7fc77a');signo.position.set(0,.36,.375);
  if(articulo.endsWith('astral')){const gema=new THREE.Mesh(new THREE.OctahedronGeometry(.1),new THREE.MeshStandardMaterial({color:'#c9a8ff',emissive:'#9a7ae0',emissiveIntensity:.5}));gema.position.set(.32,.75,.3);fijo.add(gema);}
 }else if(articulo==='alto_horno'){
  // Torre de ladrillo con boca encendida, chimenea humeando y fuelle que sube y baja
  caja(fijo,[.95,.16,.95],[0,.08,0],'#7b6f66');for(let y=0;y<4;y++){const r=.42-y*.04;cilindro(fijo,r,.3,0,.31+y*.3,0,y%2?'#a8574a':'#b9644f',8);}
  caja(fijo,[.36,.3,.05],[0,.42,.38],PALETA.oscuro);caja(fijo,[.28,.2,.06],[0,.38,.4],'#f2a24e');cilindro(fijo,.12,.6,.22,1.6,-.14,PALETA.metal,8);
  for(const y of[.6,1.05])cilindro(fijo,.45,.04,0,y,0,PALETA.metal,8);
  const fuelle=new THREE.Group();fuelle.position.set(-.48,.35,.1);caja(fuelle,[.18,.08,.34],[0,0,0],madera);caja(fuelle,[.16,.12,.3],[0,.08,0],'#8a5a3a');grupo.add(fuelle);moviles.push(fuelle);
 }else if(articulo==='trituradora'){
  // Tolva arriba, dos rodillos dentados que giran y bandeja de salida
  caja(fijo,[.84,.5,.7],[0,.27,0],PALETA.metal);caja(fijo,[.62,.08,.5],[0,.55,0],PALETA.oscuro);
  const tolva=new THREE.Mesh(new THREE.CylinderGeometry(.42,.22,.36,4,1,true),new THREE.MeshStandardMaterial({color:'#9aa3ab',roughness:.6,metalness:.4,side:THREE.DoubleSide}));tolva.rotation.y=Math.PI/4;tolva.position.y=.82;fijo.add(tolva);
  for(const x of[-.14,.14]){const r=new THREE.Group();r.position.set(x,.62,0);cilindro(r,.11,.46,0,0,0,'#6d7680',10);r.children[0].rotation.x=Math.PI/2;for(let k=0;k<6;k++){const d=caja(r,[.05,.05,.44],[Math.cos(k)*.12,Math.sin(k)*.12,0],PALETA.claro);d.rotation.z=k;}grupo.add(r);moviles.push(r);}
  caja(fijo,[.4,.05,.3],[0,.12,.45],PALETA.cobre);
 }else if(articulo==='taladro_vapor'){
  // Torre de perforación: patas de hierro, caldera, broca que gira y nube de vapor
  for(const [x,z] of[[-.4,-.4],[.4,-.4],[-.4,.4],[.4,.4]]){const p=caja(fijo,[.08,1.5,.08],[x*.8,.75,z*.8],PALETA.metal);p.rotation.set(z*.12,0,-x*.12);}
  caja(fijo,[.7,.08,.7],[0,1.45,0],PALETA.metal);cilindro(fijo,.26,.5,.3,.3,.25,PALETA.cobre,10);esfera(fijo,[.26,.16,.26],[.3,.56,.25],PALETA.cobre);cilindro(fijo,.05,.4,.3,.85,.25,PALETA.metal,6);
  const broca=new THREE.Group();broca.position.y=.7;cilindro(broca,.06,1.2,0,0,0,'#c9cdd2',6);for(let k=0;k<4;k++){const h=caja(broca,[.22,.03,.05],[0,-.4+k*.2,0],'#9aa3ab');h.rotation.y=k*.8;}grupo.add(broca);moviles.push(broca);
  caja(fijo,[.5,.05,.5],[0,.03,0],'#6b5a4c');
 }else if(articulo==='ensambladora'){
  // Mesa con cinta transportadora, brazo mecánico y engranajes a la vista
  caja(fijo,[.9,.5,.6],[0,.27,0],PALETA.metal);caja(fijo,[.92,.06,.34],[0,.55,.08],PALETA.oscuro);for(let k=0;k<5;k++)caja(fijo,[.04,.065,.32],[-.36+k*.18,.56,.08],'#5a5f66');
  caja(fijo,[.1,.6,.1],[.32,.85,-.18],PALETA.metal);const brazo=new THREE.Group();brazo.position.set(.32,1.12,-.18);caja(brazo,[.5,.07,.07],[-.22,0,0],PALETA.cobre);caja(brazo,[.06,.18,.06],[-.45,-.1,0],PALETA.claro);grupo.add(brazo);moviles.push(brazo);
  for(const [x,r] of[[-.25,.15],[-.05,.1]]){const e=aro(grupo,r,.04,PALETA.oro);e.position.set(x,.3,.31);moviles.push(e);}
 }else if(articulo==='horno'||articulo==='fundidora'||articulo==='forja'){
  caja(fijo,[.83,.17,.79],[0,.09,0],'#8a9188');caja(fijo,[.75,.65,.68],[0,.49,0],articulo==='fundidora'?PALETA.metal:'#a2a598');
  caja(fijo,[.42,.3,.04],[0,.4,.36],PALETA.oscuro);caja(fijo,[.32,.17,.043],[0,.34,.385],'#d29966');for(const x of[-.13,0,.13])caja(fijo,[.035,.27,.06],[x,.41,.405],PALETA.metal);
  caja(fijo,[.87,.12,.8],[0,.86,0],PALETA.metal);cilindro(fijo,.13,.54,-.22,1.15,-.13,PALETA.metal,8);
  if(articulo==='forja'){caja(fijo,[.48,.11,.38],[.05,1,0],PALETA.metal);caja(fijo,[.21,.17,.24],[.05,.94,0],PALETA.metal);}
 }else if(articulo==='banco_trabajo'||articulo==='cocina'||articulo==='telar'){
  for(const x of[-.33,.33])for(const z of[-.27,.27])caja(fijo,[.09,.61,.09],[x,.32,z],oscuro);
  caja(fijo,[.88,.12,.74],[0,.66,0],madera);caja(fijo,[.7,.08,.54],[0,.2,0],madera);
  if(articulo==='cocina'){caja(fijo,[.74,.07,.62],[0,.755,0],PALETA.metal);for(const x of[-.19,.19]){cilindro(fijo,.13,.03,x,.802,0,PALETA.oscuro);cilindro(fijo,.105,.17,x,.9,0,PALETA.cobre);}caja(fijo,[.74,.25,.09],[0,.82,-.29],PALETA.claro);}
  else if(articulo==='telar'){for(const x of[-.3,.3])caja(fijo,[.08,.68,.09],[x,.98,0],oscuro);caja(fijo,[.69,.09,.1],[0,1.33,0],madera);caja(fijo,[.55,.47,.025],[0,1.02,.045],'#eee0be');for(let i=0;i<9;i++)caja(fijo,[.012,.46,.03],[-.25+i*.06,1.02,.065],i%2?'#b99077':'#8dabb4');}
  else{caja(fijo,[.32,.06,.36],[-.19,.76,-.04],PALETA.claro);caja(fijo,[.08,.09,.34],[.18,.81,.03],PALETA.metal);caja(fijo,[.11,.07,.23],[.18,.8,.19],madera);}
 }else if(articulo==='fermentador'||articulo==='prensa'){
  cilindro(fijo,.34,.68,0,.4,0,madera);for(const y of[.15,.4,.65])cilindro(fijo,.355,.045,0,y,0,PALETA.metal);cilindro(fijo,.36,.06,0,.78,0,'#cba270');
  if(articulo==='prensa'){for(const x of[-.39,.39])caja(fijo,[.07,1.09,.13],[x,.58,0],oscuro);caja(fijo,[.89,.09,.18],[0,1.1,0],oscuro);cilindro(fijo,.045,.39,0,.99,0,PALETA.metal);const wheel=aro(grupo,.18,.03,PALETA.cobre);wheel.rotation.x=Math.PI/2;wheel.position.y=1.25;moviles.push(wheel);}
  else{cilindro(fijo,.07,.14,0,.88,0,PALETA.oro);caja(fijo,[.07,.08,.14],[0,.31,.39],PALETA.metal);}
 }else if(articulo==='molino_artesanal'){
  caja(fijo,[.64,.42,.59],[0,.27,0],madera);cilindro(fijo,.35,.11,0,.54,0,'#b5b6a7');cilindro(fijo,.12,.25,0,.69,0,PALETA.metal);
  const wheel=new THREE.Group();wheel.position.set(0,.87,0);caja(wheel,[.59,.055,.065],[.2,0,0],madera);cilindro(wheel,.04,.18,.44,.08,0,PALETA.oscuro);grupo.add(wheel);moviles.push(wheel);caja(fijo,[.21,.16,.22],[0,.32,.38],PALETA.oscuro);
 }else{
  caja(fijo,[.74,.69,.67],[0,.42,0],PALETA.metal);caja(fijo,[.61,.08,.57],[0,.8,0],PALETA.claro);const wheel=aro(grupo,.23,.075,PALETA.cobre);wheel.position.set(0,.45,.39);moviles.push(wheel);cilindro(fijo,.11,.23,-.22,.94,-.12,PALETA.metal);
 }
 compactar(fijo);const luz=piloto(grupo);luz.visible=false;
 // La parte fija se cambia por su modelo de Blender (granja_maquinas.glb); lo que se mueve sigue siendo de aquí
 conKit(grupo,'granja_maquinas.glb',m=>{const base=m.get(claveMaquina(articulo));if(!base)return;for(const o of [...fijo.children]){o.removeFromParent();o.traverse(x=>{const malla=x as THREE.Mesh;if(malla.isMesh){malla.geometry.dispose();for(const mt of ([] as THREE.Material[]).concat(malla.material))mt.dispose();}});}fijo.add(base.clone(true));});
 return {grupo,articulo,moviles,piloto:luz,proceso:false,llena:false,portal,aspersor};
}

/** Modelos propios y ligeros; sincroniza sólo nodos cambiados, sin reconstruir por frame. */
export class EscenaProduccion{
 readonly grupo=new THREE.Group();private figuras=new Map<string,FiguraProduccion>();private tiempo=0;
 constructor(){this.grupo.name='produccion';}
 get seleccionables(){return [...this.figuras.values()].map(f=>f.grupo);}
 objetivoDeInterseccion(obj:THREE.Object3D):string|null{let p:THREE.Object3D|null=obj;while(p&&p!==this.grupo){if(typeof p.userData.produccionId==='string')return p.userData.produccionId;p=p.parent;}return null;}
 sync(estado:EstadoProduccion,zona:string,visible=true){
  this.grupo.visible=visible;const nodos=[...estado.cofres,...estado.maquinas,...estado.estructuras].filter(n=>n.zona===zona),ids=new Set(nodos.map(n=>n.id));
  for(const[id,f]of this.figuras)if(!ids.has(id)){liberar(f.grupo);this.figuras.delete(id);}
  for(const n of nodos){let f=this.figuras.get(n.id);if(f&&f.articulo!==n.articulo){liberar(f.grupo);this.figuras.delete(n.id);f=undefined;}if(!f){f=figura(n.articulo);f.grupo.userData.produccionId=n.id;this.figuras.set(n.id,f);this.grupo.add(f.grupo);}
   const h=huellaProduccion(n);f.grupo.position.set(h.x+h.ancho/2,0,h.z+h.fondo/2);const maquina=n as Partial<MaquinaProduccion>;f.proceso=!!maquina.proceso;f.llena=!!maquina.salida?.some(Boolean);f.piloto.visible=f.proceso||f.llena;(f.piloto.material as THREE.MeshBasicMaterial).color.set(f.llena?'#edc884':'#a2d8b7');
  }
 }
 update(dt:number){if(!this.grupo.visible)return;this.tiempo+=Math.max(0,Math.min(.1,dt));const t=this.tiempo;
  for(const f of this.figuras.values()){
   if(f.portal){f.moviles.forEach((m,i)=>{if(!i)(m as THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>).material.opacity=.4+Math.sin(t*1.6)*.07;else{m.position.x=Math.sin(t*.5+i*2.4)*.53;m.position.y=.35+((t*.15+i*.21)%1.57);}});}
   else if(f.aspersor||f.proceso||f.articulo==='nave_exploradora')for(const [k,m] of f.moviles.entries()){if(f.articulo==='recicladora')m.rotation.z+=dt*1.4;else if(f.articulo==='trituradora'||f.articulo.startsWith('recuperadora_'))m.rotation.x+=dt*(k?-3:3);else if(f.articulo==='alto_horno')m.scale.y=1+Math.sin(performance.now()/180)*.35;else if(f.articulo==='ensambladora')m.rotation.y=k?m.rotation.y+dt*2.4:Math.sin(performance.now()/400)*.9;else if(f.articulo==='taladro_vapor')m.rotation.y+=dt*6;else m.rotation.y+=dt*(f.aspersor?1.1:f.articulo==='nave_exploradora'?.35:1.4);}
   f.piloto.scale.setScalar(f.llena?1:1+Math.sin(t*4)*.08);
  }
 }
 dispose(){for(const f of this.figuras.values())liberar(f.grupo);this.figuras.clear();this.grupo.removeFromParent();}
}
