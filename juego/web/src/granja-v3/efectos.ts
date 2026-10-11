import * as THREE from 'three';
import { caja, esfera, compactar, liberar, material } from './suelo';
import type { Drop, Resultado } from './estado';

type Animacion={t:number;duracion:number;update:(t:number,dt:number)=>void;fin:()=>void};
/** Effects own only their generated geometry; borrowed GLB objects provide their own release callback. */
export class EfectosGranja {
 readonly root=new THREE.Group();private animaciones:Animacion[]=[];private objetos=new Map<string,{root:THREE.Group;drop:Drop}>();private tiempo=0;
 private animar(duracion:number,update:Animacion['update'],fin:()=>void){this.animaciones.push({t:0,duracion,update,fin});}
 particulas(x:number,z:number,color:string,cantidad=10){const geo=new THREE.IcosahedronGeometry(.055,0),mesh=new THREE.InstancedMesh(geo,material(color),cantidad),dummy=new THREE.Object3D();mesh.frustumCulled=false;this.root.add(mesh);const v=Array.from({length:cantidad},(_,i)=>{const a=i*2.399;return {x:Math.sin(a)*(1+i%3*.35),z:Math.cos(a)*(1+i%3*.35),y:1.3+i%4*.35};});
  this.animar(.65,(t)=>{v.forEach((vel,i)=>{dummy.position.set(x+vel.x*t,.12+vel.y*t-3*t*t,z+vel.z*t);dummy.rotation.set(t*4,i,t*3);dummy.scale.setScalar(Math.max(.01,1-t/.65));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.instanceMatrix.needsUpdate=true;},()=>{mesh.removeFromParent();mesh.dispose();geo.dispose();(mesh.material as THREE.Material).dispose();});
 }
 impacto(info:NonNullable<Resultado['impacto']>,obj?:THREE.Object3D,soltar?:()=>void){this.particulas(info.x+.5,info.z+.5,info.tipo==='arbol'?'#ba9267':info.tipo==='maleza'?'#89a369':'#a4aea4',info.destruido?20:7);
  if(!obj)return;
  if(info.destruido){this.root.attach(obj);const rot=obj.rotation.clone(),scale=obj.scale.clone(),y=obj.position.y;this.animar(info.tipo==='arbol'?1:.3,t=>{const p=Math.min(1,t/(info.tipo==='arbol'?1:.3));if(info.tipo==='arbol'){obj.rotation.z=rot.z-Math.pow(p,1.7)*1.45;obj.position.y=y-Math.max(0,p-.6)*3;}else obj.scale.copy(scale).multiplyScalar(Math.max(.001,1-p));},()=>{obj.removeFromParent();soltar?.();});}
  else{const base=obj.rotation.z;this.animar(.25,t=>{obj.rotation.z=base+Math.sin(t*48)*.055*(1-t/.25)},()=>{obj.rotation.z=base;});}
 }
 private crearDrop(d:Drop){const g=new THREE.Group();g.name='botin_'+d.id;
  if(/madera/.test(d.articulo)){for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.4,7),material(i%2?'#b79062':'#9b774d'));m.rotation.z=Math.PI/2;m.position.set(0,.13+(i===2?.11:0),(i-1)*.10);m.castShadow=true;g.add(m);}}
  else if(/piedra|cobre|hierro|cristal/.test(d.articulo)){for(let i=0;i<3;i++)esfera(g,[.12,.10+i*.02,.10],[(i-1)*.12,.12,i%2*.07],d.articulo==='cobre'?'#c89565':d.articulo==='hierro'?'#889aa4':d.articulo==='cristal'?'#91cfc9':'#a9b1a1');}
  else{caja(g,[.28,.28,.20],[0,.18,0],/semilla/.test(d.articulo)?'#d4b077':'#a0b57b');caja(g,[.32,.04,.24],[0,.26,0],'#efe4bd');esfera(g,[.065,.11,.025],[.01,.16,.115],'#638b55');}
  const ring=new THREE.Mesh(new THREE.RingGeometry(.23,.28,20),new THREE.MeshBasicMaterial({color:'#fff0ad',transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.025;g.add(ring);compactar(g);g.position.set(d.x,.06,d.z);this.root.add(g);return g;
 }
 sync(drops:Drop[]){const wanted=new Set(drops.map(d=>d.id));for(const [id,o]of this.objetos)if(!wanted.has(id)){liberar(o.root);this.objetos.delete(id);}for(const d of drops)if(!this.objetos.has(d.id))this.objetos.set(d.id,{root:this.crearDrop(d),drop:d});}
 recoger(id:string,destino:()=>THREE.Vector3){const o=this.objetos.get(id);if(!o)return;this.objetos.delete(id);const initial=o.root.position.clone();this.animar(.25,t=>{const p=Math.min(1,t/.25),to=destino().clone().add(new THREE.Vector3(0,.8,0));o.root.position.lerpVectors(initial,to,p);o.root.position.y+=Math.sin(p*Math.PI)*.35;o.root.scale.setScalar(1-p*.65);},()=>liberar(o.root));}
 update(dt:number){this.tiempo+=dt;for(const {root,drop}of this.objetos.values()){root.position.y=.07+Math.sin(this.tiempo*3+drop.x)*.035;root.rotation.y=this.tiempo*.65;}for(const a of this.animaciones)a.update(a.t+=dt,dt);const finished=this.animaciones.filter(a=>a.t>=a.duracion);this.animaciones=this.animaciones.filter(a=>a.t<a.duracion);finished.forEach(a=>a.fin());}
 clear(){this.animaciones.forEach(a=>a.fin());this.animaciones=[];for(const o of this.objetos.values())liberar(o.root);this.objetos.clear();}
 dispose(){this.clear();this.root.removeFromParent();}
}
