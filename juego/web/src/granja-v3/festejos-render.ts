import * as THREE from 'three';
import { conKit } from './cuartos';
import { festivalHoy } from './festivales-datos';

/** Decoración de los cuatro festivales en la plaza del Pueblo del Sol, modelada en Blender
 * (personajes/blender/granja_festivales.py → granja_festivales.glb). Solo se ve el día del festival; el motor sigue
 * decidiendo fecha, horario, participantes y premios. Todo va en el pasto, fuera de las calles (el arco cruza
 * por encima), del punto de inscripción (84, 10) y de los puestos de los seis participantes. */
const ARCHIVO='granja_festivales.glb';
const TEMA:Record<string,'primavera'|'verano'|'otono'|'invierno'>={semillas_compartidas:'primavera',ritmo_fuente:'verano',mesa_cosecha:'otono',memorias_invierno:'invierno'};
/** Postes de las guirnaldas alrededor de la plaza (centro 84, 2; radio 7,15), en el orden en que se unen. */
const POSTES:readonly [number,number][]=[[78.3,5.6],[89.9,5.9],[90.6,-2.5],[77.6,-2.6]];
/** El arco recibe en la calle del oeste, por donde se llega de la granja (al sur lo tapaba la posada). */
const ARCO={x:73,z:0,giro:Math.PI/2},CENTRO={x:94.6,z:2.6},EXTRA={x:75.8,z:4,giro:Math.PI/2},FUENTE={x:84,y:.45,z:2};
const ALTO_TIRA=2.95,LARGO_TIRA=2;
/** Lo que ocupa cada pieza en el piso [x0, z0, x1, z1]: el personaje no la atraviesa. */
const HUELLA_CENTRO:Record<string,[number,number,number,number]>={primavera:[93.2,1.5,96,4.1],verano:[92.9,.9,96.3,4.6],otono:[92,2,97.3,3.3],invierno:[93.4,1.4,95.8,3.8]};
const HUELLA_EXTRA:[number,number,number,number]=[74.9,3,76.8,5];
/** Hacia dónde mira la cámara (x, z): lo que queda de espaldas se voltea. */
const CAMARA=new THREE.Vector2(18,23).normalize();

export function temaFestivalHoy(dia:number){const f=festivalHoy(dia);return f?TEMA[f.id]:undefined;}

/** Celdas (x, z enteros) que la decoración del festival de hoy no deja pisar. */
export function celdasFestejo(dia:number):Set<string>{
 const tema=temaFestivalHoy(dia),out=new Set<string>();if(!tema)return out;
 const rect=([x0,z0,x1,z1]:[number,number,number,number])=>{for(let x=Math.floor(x0);x<=Math.floor(x1);x++)for(let z=Math.floor(z0);z<=Math.floor(z1);z++)if(x+.5>=x0&&x+.5<=x1&&z+.5>=z0&&z+.5<=z1)out.add(x+','+z);};
 rect(HUELLA_CENTRO[tema]);rect(HUELLA_EXTRA);
 for(const [x,z] of POSTES)out.add(Math.floor(x)+','+Math.floor(z));
 for(const s of [-1,1])out.add(Math.floor(ARCO.x+s*2.1*Math.cos(ARCO.giro))+','+Math.floor(ARCO.z-s*2.1*Math.sin(ARCO.giro)));
 return out;
}

/** Tramos de la guirnalda entre dos postes, colgando en catenaria y con el frente hacia la cámara. */
function guirnalda(g:THREE.Group,tira:THREE.Object3D,a:readonly [number,number],b:readonly [number,number]){
 let [x0,z0]=a,[x1,z1]=b;
 // El frente de la tira mira a +z local; tras girarla debe quedar hacia la cámara
 const yaw0=Math.atan2(-(z1-z0),x1-x0);if(Math.sin(yaw0)*CAMARA.x+Math.cos(yaw0)*CAMARA.y<0){[x0,z0,x1,z1]=[x1,z1,x0,z0];}
 const largo=Math.hypot(x1-x0,z1-z0),n=Math.max(2,Math.round(largo/LARGO_TIRA)),comba=Math.min(.9,largo*.07);
 const punto=(t:number)=>new THREE.Vector3(x0+(x1-x0)*t,ALTO_TIRA-comba*4*t*(1-t),z0+(z1-z0)*t);
 for(let i=0;i<n;i++){
  const p=punto(i/n),q=punto((i+1)/n),d=q.clone().sub(p),plano=Math.hypot(d.x,d.z);
  const o=tira.clone(true);o.position.copy(p);o.rotation.set(0,Math.atan2(-d.z,d.x),Math.atan2(d.y,plano),'YXZ');o.scale.set(d.length()/LARGO_TIRA,1,1);
  o.userData.vaiven=i*.7+x0;g.add(o);
 }
}

/** Grupo con la decoración del festival de hoy (vacío si no hay). Las piezas llegan cuando carga el modelo. */
export function decoracionFestival(dia:number):THREE.Group{
 const g=new THREE.Group();g.name='festejo';const tema=temaFestivalHoy(dia);if(!tema)return g;g.userData.tema=tema;
 conKit(g,ARCHIVO,m=>{
  const pieza=(clave:string,x:number,y:number,z:number,giro=0)=>{const base=m.get(clave+'_'+tema);if(!base)return;const o=base.clone(true);o.position.set(x,y,z);o.rotation.y=giro;g.add(o);return o;};
  for(const [x,z] of POSTES)pieza('poste',x,0,z,Math.atan2(CAMARA.x,CAMARA.y));
  const tira=m.get('tira_'+tema);
  if(tira)for(let i=0;i<POSTES.length;i++)guirnalda(g,tira,POSTES[i],POSTES[(i+1)%POSTES.length]);
  pieza('arco',ARCO.x,0,ARCO.z,ARCO.giro);
  pieza('centro',CENTRO.x,0,CENTRO.z);
  pieza('extra',EXTRA.x,0,EXTRA.z,EXTRA.giro);
  pieza('borde',FUENTE.x,FUENTE.y,FUENTE.z);
  // Bombillos, farolillos, velas y estrella titilan (sus materiales solo los usa este kit)
  const luces:THREE.MeshStandardMaterial[]=[];
  g.traverse(o=>{const malla=o as THREE.Mesh;if(!malla.isMesh)return;for(const mt of ([] as THREE.Material[]).concat(malla.material)){const s=mt as THREE.MeshStandardMaterial;if(s.emissiveIntensity>0&&s.emissive&&s.emissive.getHex()!==0&&!luces.includes(s)){s.userData.brilloBase??=s.emissiveIntensity;luces.push(s);}}});
  g.userData.luces=luces;
 });
 return g;
}

/** Vaivén de las guirnaldas con la brisa y luces que titilan. */
export function animarFestejo(g:THREE.Group,t:number){
 for(const o of g.children)if(o.userData.vaiven!==undefined)o.rotation.x=Math.sin(t*1.6+o.userData.vaiven)*.09;
 const luces=g.userData.luces as THREE.MeshStandardMaterial[]|undefined;
 luces?.forEach((m,i)=>{m.emissiveIntensity=m.userData.brilloBase*(.82+.18*Math.sin(t*2.3+i*1.7));});
}
