import * as THREE from 'three';
import { Personaje } from '../personaje';
import { elegirModelos } from '../recursos';
import { caja, esfera, liberar } from './suelo';
import { crearHerramienta } from './herramientas3d';

export class AvatarGranja{
 private montada=false;
 montar(si:boolean){if(this.montada===si)return;this.montada=si;this.herramienta.visible=!si;this.detener();if(this.activo){this.activo.cuerpo.position.z=0;this.activo.quieto();}}
 get estaMontada(){return this.montada;}
 orientarMontura(direccion:number){if(this.activo){this.activo.rot=direccion;this.activo.sincronizar();}}
 get direccionMontura(){return this.activo?.grupo.rotation.y??0;}
 multiplicadorVelocidad=1;readonly root=new THREE.Group();private personajes=new Map<string,Personaje>();private activo?:Personaje;private herramienta=new THREE.Group();private usando=0;private poseRetorno='reposo';private direccion=new THREE.Vector2();private manual=false;private carrera=false;private golpe?:{tiempo:number;impacto:()=>void;terminar:()=>void;hecho:boolean};private brazoBase?:THREE.Quaternion;
 async cargar(){await elegirModelos();for(const id of ['ella','el']){const p=new Personaje({x:0,y:-3},id==='ella'?.70:.69);p.velocidad=3.2;await p.cargarPoses(id);p.grupo.visible=false;this.root.add(p.grupo);this.personajes.set(id,p);}this.elegir('ella');}
 elegir(id:string){const p=this.personajes.get(id);if(!p)return;const anterior=this.activo;p.pos={x:anterior?.pos.x??0,y:anterior?.pos.y??-3};p.ruta=[];p.rot=anterior?.rot??0;p.sincronizar();this.personajes.forEach(x=>x.grupo.visible=x===p);this.activo=p;this.equipar(this.herramienta.userData.id??'mano');}
 get position(){return this.activo?.grupo.position??new THREE.Vector3(0,0,3);}
 setPosition(x:number,z:number){if(!this.activo)return;this.activo.ruta=[];this.activo.pos={x,y:-z};this.activo.sincronizar();}
 get moviendo(){return !!this.activo?.moviendo;}
 get ocupado(){return !!this.golpe;}
 detener(){this.direccion.set(0,0);this.manual=false;if(this.activo){this.activo.ruta=[];this.activo.alLlegar=null;if(!this.golpe)this.activo.quieto();}}
 conducir(x:number,z:number,correr=false){this.manual=true;this.direccion.set(x,z);if(this.direccion.lengthSq()>1)this.direccion.normalize();this.carrera=correr;}
 mirar(x:number,z:number){this.activo?.mirarA({x,y:-z});}
 usar(x:number,z:number,impacto:()=>void,terminar:()=>void=()=>{}){if(this.golpe||!this.activo)return false;this.detener();this.mirar(x,z);this.activo.pose('reponer');this.golpe={tiempo:0,impacto,terminar,hecho:false};return true;}
 ir(x:number,z:number,walkable:(x:number,z:number)=>boolean,done?:()=>void){if(!this.activo)return false;const start=[Math.floor(this.position.x),Math.floor(this.position.z)],end=[Math.floor(x),Math.floor(z)],key=(x:number,z:number)=>x+','+z;
  if(!walkable(...end as [number,number]))return false;
  const queue=[start],seen=new Set([key(...start as [number,number])]),parents=new Map<string,number[]>();let at=0,found=false;
  while(at<queue.length&&at<12000){const [cx,cz]=queue[at++];if(cx===end[0]&&cz===end[1]){found=true;break;}for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=cx+dx,zz=cz+dz,k=key(xx,zz);if(Math.abs(xx-start[0])>70||Math.abs(zz-start[1])>70||seen.has(k)||!walkable(xx,zz))continue;seen.add(k);parents.set(k,[cx,cz]);queue.push([xx,zz]);}}
  if(!found)return false;let c=end,path:number[][]=[];while(c[0]!==start[0]||c[1]!==start[1]){path.push(c);c=parents.get(key(c[0],c[1]))!;}path.reverse();this.activo.ruta=path.map(([xx,zz])=>({x:xx+.5,y:-(zz+.5)}));this.activo.alLlegar=()=>{this.activo?.quieto();done?.();};if(!path.length)done?.();return true;
 }
 equipar(id:string,nivel=0){liberar(this.herramienta);const g=new THREE.Group();g.userData.id=id;g.userData.nivel=nivel;this.herramienta=g;g.visible=!this.montada;if(id==='mano'||id==='mover')return;
  const fina=crearHerramienta(id,nivel);if(fina){g.add(...fina.children);}
  else if(id==='regadera'){esfera(g,[.16,.18,.13],[0,-.14,0],'#769b81');caja(g,[.055,.07,.28],[0,-.08,.2],'#557e68');const h=new THREE.Mesh(new THREE.TorusGeometry(.17,.025,6,16),new THREE.MeshStandardMaterial({color:'#ccad76'}));h.position.y=-.08;g.add(h);}
  else if(id==='cubo_ordeno'){const m=new THREE.Mesh(new THREE.CylinderGeometry(.16,.12,.24,12),new THREE.MeshStandardMaterial({color:'#abb5b4',metalness:.45,roughness:.5}));m.position.y=-.15;g.add(m);const h=new THREE.Mesh(new THREE.TorusGeometry(.14,.016,6,16),new THREE.MeshStandardMaterial({color:'#8b9694'}));h.position.y=-.04;g.add(h);}
  else if(id==='tijeras_esquila'){for(const x of[-1,1]){const blade=caja(g,[.035,.32,.028],[x*.04,-.05,0],'#c8d5d1');blade.rotation.z=x*.2;const h=new THREE.Mesh(new THREE.TorusGeometry(.055,.012,6,12),new THREE.MeshStandardMaterial({color:'#ae8f61'}));h.position.set(x*.065,-.24,0);g.add(h);}}
  else if(id==='semillas'||id==='pasto'){esfera(g,[.14,.18,.12],[0,-.15,0],'#c4a67a');}
  else {caja(g,[.038,.66,.038],[0,-.20,0],'#926b45');if(id==='azada')caja(g,[.24,.045,.19],[0,.14,.06],'#879292');else if(id==='hacha')caja(g,[.26,.22,.055],[.09,.12,0],'#98a6a2');else if(id==='pico')caja(g,[.45,.06,.055],[0,.14,0],'#758588');else if(id==='espada'){caja(g,[.085,.58,.028],[0,.19,0],'#d7e7e6');caja(g,[.22,.045,.06],[0,-.12,0],'#c4a25a');}else if(id==='cana'){caja(g,[.025,1.35,.025],[0,.43,0],'#b69557');}else if(id==='guadana'){const s=new THREE.Mesh(new THREE.TorusGeometry(.20,.025,6,14,Math.PI*.9),new THREE.MeshStandardMaterial({color:'#abb8a7'}));s.position.set(.13,.1,0);g.add(s);}}
  if(nivel>0&&!fina){const tonos=['#a1aaa3','#c69265','#b7c3c9','#a99ccd','#a7ddd6'];g.traverse(o=>{if(o instanceof THREE.Mesh){const m=o.material as THREE.MeshStandardMaterial;if(m.color&&m.color.r<=m.color.g*1.2){m.color.set(tonos[nivel]??tonos[4]);m.metalness=.2;m.roughness=.5;}}});}
  const mano=(this.activo?.huesos.get('mano.R')??this.activo?.huesos.get('manoR'));
  if(mano&&this.activo){
   // La herramienta va en una «pose» adentro: la mano la agarra por el mango (un tercio de abajo) y queda parada,
   // un poco hacia adelante y hacia afuera, sin importar cómo vengan los ejes del hueso. El golpe gira `g`.
   const pose=new THREE.Group();pose.add(...g.children);g.add(pose);mano.add(g);g.position.set(0,0,0);g.rotation.set(0,0,0);
   this.activo.grupo.updateWorldMatrix(true,true);const qMano=mano.getWorldQuaternion(new THREE.Quaternion()),qCuerpo=this.activo.grupo.getWorldQuaternion(new THREE.Quaternion());
   const deseo=qCuerpo.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(.45,0,-.3)));pose.quaternion.copy(qMano.invert().multiply(deseo));
   const s=mano.getWorldScale(new THREE.Vector3()).x||1,escalaCuerpo=this.activo.grupo.getWorldScale(new THREE.Vector3()).x||1;pose.scale.setScalar(.85*escalaCuerpo/s);
   pose.position.copy(new THREE.Vector3(0,.3,0).applyQuaternion(pose.quaternion).multiplyScalar(pose.scale.x));
  }else this.activo?.cuerpo.add(g);
 }
 accion(afecto=false){this.usando=.7;this.activo?.pose(afecto?'acariciar':'reponer');}
 update(dt:number,walkable:(x:number,z:number)=>boolean=()=>true){
  const p=this.activo;if(!p)return;const brazo=(p.huesos.get('brazo.R')??p.huesos.get('brazoR'));if(brazo&&this.brazoBase){brazo.quaternion.copy(this.brazoBase);this.brazoBase=undefined;}
  if(this.manual&&!this.golpe){const v=this.direccion,speed=(this.montada?(this.carrera?6.1:4.8):(this.carrera?5.1:3.4))*Math.max(.5,Math.min(2,this.multiplicadorVelocidad)),step=speed*dt,pos=this.position;let dx=v.x,dz=v.y;const radio=this.montada?.45:.24,libre=(x:number,z:number)=>[[-radio,-radio],[radio,-radio],[-radio,radio],[radio,radio]].every(([rx,rz])=>walkable(Math.floor(x+rx),Math.floor(z+rz)));
   if(!libre(pos.x+dx*step,pos.z+dz*step)){if(libre(pos.x+dx*step,pos.z))dz=0;else if(libre(pos.x,pos.z+dz*step))dx=0;else dx=dz=0;}
   p.velocidad=speed;if(Math.hypot(dx,dz)>.01){p.ruta=[{x:pos.x+dx*3,y:-(pos.z+dz*3)}];p.alLlegar=null;}else{p.ruta=[];p.quieto();}
  }
  p.update(dt);
  if(this.montada){p.pose('sentado',true);p.update(0);p.grupo.position.y=1.02;p.cuerpo.position.z=-.12;p.cuerpo.position.y=this.moviendo?Math.abs(Math.sin(performance.now()*.012))*.035:0;p.cuerpo.rotation.z=0;}else p.cuerpo.position.z=0;
  if(this.golpe){const a=this.golpe;a.tiempo+=dt;const t=Math.min(1,a.tiempo/.58),lift=t<.38?t/.38:Math.max(0,1-(t-.38)/.62),swing=Math.sin(lift*Math.PI*.75);if(brazo){this.brazoBase=brazo.quaternion.clone();brazo.rotateX(-swing*.75);brazo.rotateZ(swing*.28);}this.herramienta.rotation.x=-swing*.85;p.cuerpo.rotation.x=-Math.sin(t*Math.PI)*.10;
   if(!a.hecho&&a.tiempo>=.25){a.hecho=true;a.impacto();}
   if(t>=1){this.golpe=undefined;this.herramienta.rotation.x=0;p.cuerpo.rotation.x=0;p.quieto();a.terminar();}
  }
  if(this.usando>0){this.usando-=dt;if(this.usando<=0&&!this.golpe)p.quieto(this.poseRetorno);}
 }
 dispose(){liberar(this.herramienta);this.root.removeFromParent();}
}
