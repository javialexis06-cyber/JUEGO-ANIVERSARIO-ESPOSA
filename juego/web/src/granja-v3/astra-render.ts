/** Escenarios provisionales: reutilizan los kits existentes. Las reglas y anclajes viven en astra.ts. */
import {habitantesHistoria} from './historia-ubicaciones';
import * as THREE from 'three';
import type { EstadoGranja } from './estado';
import { planoAstra, regionAstra, NPC_ASTRA, posicionNpcAstra, rutasDesde, RECURSOS_ASTRA, puntoRecurso } from './astra';
import { Suelos, liberar } from './suelo';
import { interiorVivienda } from './cuartos';
import { viviendaAstra, recursoAstra, lugaresAstra, paisajeAstra, paletaSueloAstra } from './astra-arte';
import { vecinoPeluche, animarVecino, sacarVecinos } from './vecinos3d';
import { arcoSalida, senderoTierra } from './zonas-render';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { MediosAstra } from './astra-medios';
let arte:MediosAstra['modelos']={},cargarArte:((archivo:string)=>Promise<{escena:THREE.Group;clips:THREE.AnimationClip[]}>)|undefined;
export function usarArteAstra(m:MediosAstra['modelos'],cargar:NonNullable<typeof cargarArte>){arte=m;cargarArte=cargar;}
function sustituir(id:string,raiz:THREE.Group,provisional:THREE.Object3D){
 const d=arte[id],cargar=cargarArte;if(!d||!cargar)return;
 void cargar(d.archivo.replace(/^\.\/modelos\//,'')).then(({escena,clips})=>{
  if(!raiz.parent)return;for(let p:THREE.Object3D|null=raiz;p;p=p.parent)if(p.userData.liberado)return;
  const g=clone(escena);g.scale.setScalar(d.escala??1);g.position.copy(provisional.position);g.name='arte-'+id;
  g.traverse(o=>{const m=o as THREE.Mesh;if(!m.isMesh)return;m.geometry.userData.compartido=true;for(const mm of Array.isArray(m.material)?m.material:[m.material])mm.userData.compartido=true;});
  if(provisional.userData.npcId){g.userData.npcId=provisional.userData.npcId;g.userData.peluche=true;g.userData.artePropio=true;g.visible=provisional.visible;}
  g.userData.actorId=provisional.userData.npcId??(id.startsWith('figura:')?id.slice(7).replace(/^figura_/,''):undefined);
  if(clips.length){const mixer=new THREE.AnimationMixer(g);g.userData.mixer=mixer;g.userData.clips=clips;const reposo=clips.find(c=>c.name==='reposo')??clips[0];mixer.clipAction(reposo).play();}
  if(provisional.userData.peluche)sacarVecinos(provisional);else liberar(provisional);raiz.add(g);
 }).catch(()=>{/* El kit existente sigue disponible si un recurso aún no se produjo. */});
}
/** El arte de cada recurso (afloramiento, troncos, cantero, puesto de observación) con su letrero está en astra-arte.ts. */
export function señalesRecursosAstra(region:string){const g=new THREE.Group();g.name='astra-recursos-'+region;RECURSOS_ASTRA.find(r=>r.id===region)?.recursos.forEach((d,i)=>{const p=puntoRecurso(region,i);recursoAstra(g,region,d,p,o=>sustituir('recurso:'+d.id,g,o));});return g;}

/** Camino a pie por la calle (carril sur de la principal), rodeando el monumento de la plaza. */
function rutaCalle(a:{x:number;z:number},b:{x:number;z:number},plaza?:{x:number;z:number}){
 const carril=3,pts=Math.abs(a.z-b.z)<1.5&&Math.abs(a.x-b.x)<8?[{x:b.x,z:b.z}]:[{x:a.x,z:carril},{x:b.x,z:carril},{x:b.x,z:b.z}],out:{x:number;z:number}[]=[];let prev={x:a.x,z:a.z};
 for(const q of pts){if(plaza){const vx=q.x-prev.x,vz=q.z-prev.z,l2=vx*vx+vz*vz||1,t=Math.max(0,Math.min(1,((plaza.x-prev.x)*vx+(plaza.z-prev.z)*vz)/l2)),cx=prev.x+vx*t,cz=prev.z+vz*t,dd=Math.hypot(cx-plaza.x,cz-plaza.z);
   if(dd<3.2&&t>0&&t<1){const nx=(cx-plaza.x)/(dd||1),nz=(cz-plaza.z)/(dd||1);out.push(dd<.01?{x:plaza.x,z:plaza.z+3.4}:{x:plaza.x+nx*3.4,z:plaza.z+nz*3.4});}}
  out.push(q);prev=q;}
 return out;
}
export class EscenaAstra {
 readonly grupo=new THREE.Group();private clave='';private vecinos=new Map<string,THREE.Group>();private estado?:EstadoGranja;private suelos=new Suelos();
 constructor(){this.grupo.name='astra-escenario';this.grupo.visible=false;}
 sync(s:EstadoGranja){
  this.estado=s;const t=s.astra;if(!t)return;const region=t.actual??'pueblo_sol',visitantes=!t.actual;
  const ids=habitantesHistoria(s,region,visitantes?[]:regionAstra(region)!.npc);
  this.grupo.visible=!visitantes||s.zona==='pueblo'&&!s.interior&&!s.servicio&&ids.length>0;const key=region+':'+t.interior+':'+ids.join(',');if(key!==this.clave){this.limpiar();this.clave=key;this.grupo.userData.liberado=false;const capa=new THREE.Group();this.grupo.add(capa);const r=regionAstra(region)!;
   if(!visitantes&&t.interior)capa.add(interiorVivienda([r.color],'archivo'));
   else if(!visitantes){
    const terreno=this.suelos.terreno(paletaSueloAstra(r.id));capa.add(terreno);sustituir('region:'+r.id,capa,terreno);const plano=planoAstra(r.id) as Parameters<typeof paisajeAstra>[4];if(!plano){capa.add(senderoTierra(0,13,43,3));capa.add(senderoTierra(0,5,3,43));}
    // Casas, paisaje, archivo y combate con el arte de su región (astra-arte.ts)
    for(const h of r.viviendas)viviendaAstra(capa,r.id,h,o=>sustituir('vivienda:'+h.id,capa,o));
    paisajeAstra(capa,r.id,r.viviendas,rutasDesde(s).flatMap(ruta=>ruta.punto?[ruta.punto]:[]),plano,NPC_ASTRA.filter(n=>n.region===r.id));
    for(const ruta of rutasDesde(s))if(ruta.punto)capa.add(arcoSalida(regionAstra(ruta.destino)?.nombre??'Granja',ruta.punto.x,ruta.punto.z,true));
    lugaresAstra(capa,r.id,r.mundo==='confluencia'?(r.id==='confluencia'?'Fuatia · los cuatro elementos':'Puesto de balance'):'Archivo público',!!r.combate,plano);
    capa.add(señalesRecursosAstra(r.id));
    if(r.mundo==='confluencia'){if(r.id==='confluencia'){const figura=new THREE.Group();figura.position.set(0,0,20);capa.add(figura);sustituir('figura:figura_fuatia',capa,figura);}}
   }
   for(const id of ids){const g=vecinoPeluche(id,NPC_ASTRA.findIndex(n=>n.id===id));g.name='astra-npc-'+id;g.userData.npcId=id;this.vecinos.set(id,g);capa.add(g);sustituir('npc:'+id,capa,g);}
  }
  this.update(0);
 }
 actorHabla(id:string|null){this.grupo.traverse(g=>{
  // El peluche provisional habla con las manos y la boca (vecinos3d); el arte propio, con su clip «hablar»
  if(g.userData.peluche&&g.userData.npcId&&!g.userData.mixer){g.userData.hablando=g.userData.npcId===id;return;}
  if(!g.userData.mixer||!g.userData.actorId)return;const hablando=g.userData.actorId===id;if(g.userData.hablando===hablando)return;g.userData.hablando=hablando;const clips=g.userData.clips as THREE.AnimationClip[],clip=clips.find(c=>c.name===(hablando?'hablar':'reposo'));if(clip){const mixer=g.userData.mixer as THREE.AnimationMixer;mixer.stopAllAction();mixer.clipAction(clip).play();}});}
 update(dt:number){if(!this.grupo.visible||!this.estado)return;const s=this.estado,dentro=s.astra?.interior??null,region=regionAstra(s.astra?.actual??'');
  this.grupo.traverse(g=>{if(g.userData.mixer)(g.userData.mixer as THREE.AnimationMixer).update(dt);if(!g.userData.npcId)return;const p=posicionNpcAstra(s,g.userData.npcId);
   // Adentro de una casa (o con arte propio), cada quien en su sitio, como lo dice el motor
   if(dentro||g.userData.mixer){g.visible=!!p&&p.interior===dentro;if(p&&g.visible){g.position.set(p.x,0,p.z);if(!g.userData.mixer)animarVecino(g,dt,false);}return;}
   // Afuera (solo arte): caminan por la calle entre su puesto, la plaza y la puerta de su casa, y entran por la puerta
   const casa=p?.interior?region?.viviendas.find(h=>h.id===p.interior):undefined,meta=p&&!p.interior?{x:p.x,z:p.z}:casa?casa.entrada:null;
   if(!meta){g.visible=false;g.userData.puesto=false;return;}
   if(!g.userData.puesto){g.userData.puesto=true;g.userData.meta=meta;g.userData.ruta=[];g.position.set(meta.x,0,meta.z);g.visible=!casa;if(g.visible)animarVecino(g,dt,false);return;}
   const m0=g.userData.meta as {x:number;z:number};if(m0.x!==meta.x||m0.z!==meta.z){g.userData.meta=meta;g.userData.ruta=rutaCalle(g.position,meta,planoAstra(region?.id??'')?.plaza);g.visible=true;}
   const ruta=g.userData.ruta as {x:number;z:number}[];
   if(!ruta.length){if(casa)g.visible=false;else animarVecino(g,dt,false);return;}
   const q=ruta[0],dx=q.x-g.position.x,dz=q.z-g.position.z,d=Math.hypot(dx,dz),paso=2.6*dt;
   if(d<=paso){g.position.set(q.x,0,q.z);ruta.shift();}else{g.position.x+=dx/d*paso;g.position.z+=dz/d*paso;g.rotation.y=Math.atan2(dx,dz);}
   animarVecino(g,dt,true);
  });}
 private limpiar(){sacarVecinos(this.grupo);for(const g of [...this.grupo.children]){g.userData.liberado=true;liberar(g);}this.vecinos.clear();}
 dispose(){this.limpiar();this.suelos.dispose();this.grupo.userData.liberado=true;this.grupo.removeFromParent();}
}
