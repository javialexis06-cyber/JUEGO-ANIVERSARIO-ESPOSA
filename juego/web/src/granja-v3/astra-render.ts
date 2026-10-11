/** Escenarios provisionales: reutilizan los kits existentes. Las reglas y anclajes viven en astra.ts. */
import * as THREE from 'three';
import type { EstadoGranja } from './estado';
import { regionAstra, NPC_ASTRA, posicionNpcAstra, rutasDesde, RECURSOS_ASTRA, puntoRecurso } from './astra';
import { Suelos, liberar } from './suelo';
import { conKit, interiorVivienda } from './cuartos';
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
export function señalesRecursosAstra(region:string){const g=new THREE.Group();g.name='astra-recursos-'+region;RECURSOS_ASTRA.find(r=>r.id===region)?.recursos.forEach((d,i)=>{const p=puntoRecurso(region,i);g.add(arcoSalida(d.nombre,p.x,p.z,false));conKit(g,'granja_pueblo.glb',m=>{const base=m.get(d.clase==='mineral'?'piedras_mineral':d.clase==='madera'?'troncos':'jardinera');if(base){const o=base.clone(true);o.position.set(p.x,0,p.z);g.add(o);sustituir('recurso:'+d.id,g,o);}});});return g;}

export class EscenaAstra {
 readonly grupo=new THREE.Group();private clave='';private vecinos=new Map<string,THREE.Group>();private estado?:EstadoGranja;private suelos=new Suelos();
 constructor(){this.grupo.name='astra-escenario';this.grupo.visible=false;}
 sync(s:EstadoGranja){
  this.estado=s;const t=s.astra;if(!t?.actual){this.grupo.visible=false;return;}
  this.grupo.visible=true;const key=t.actual+':'+t.interior;if(key!==this.clave){this.limpiar();this.clave=key;this.grupo.userData.liberado=false;const capa=new THREE.Group();this.grupo.add(capa);const r=regionAstra(t.actual)!;
   if(t.interior)capa.add(interiorVivienda([r.color],'archivo'));
   else {
    const terreno=this.suelos.terreno();capa.add(terreno);sustituir('region:'+r.id,capa,terreno);capa.add(senderoTierra(0,13,43,3));capa.add(senderoTierra(0,5,3,43));
    for(const h of r.viviendas){capa.add(arcoSalida(h.nombre,h.entrada.x,h.entrada.z,false));conKit(capa,'granja_edificios.glb',m=>{const base=m.get('edificio_animales_7x6');if(!base)return;const o=base.clone(true);o.name='astra-vivienda-'+h.id;o.position.set(h.x+4,0,h.z+3);o.scale.x=8/7;capa.add(o);sustituir('vivienda:'+h.id,capa,o);});}
    for(const ruta of rutasDesde(s))if(ruta.punto)capa.add(arcoSalida(regionAstra(ruta.destino)?.nombre??'Granja',ruta.punto.x,ruta.punto.z,true));
    capa.add(arcoSalida('Archivo público',0,22,false));
    if(r.combate)capa.add(arcoSalida('Zona de combate',18,23,false));
    capa.add(señalesRecursosAstra(r.id));
    if(r.mundo==='confluencia'){const lugar=arcoSalida(r.id==='confluencia'?'Fuatia · los cuatro elementos':'Puesto de balance',0,22,false);capa.add(lugar);if(r.id==='confluencia'){const figura=new THREE.Group();figura.position.set(0,0,20);capa.add(figura);sustituir('figura:figura_fuatia',capa,figura);}}
   }
   for(const id of r.npc){const g=vecinoPeluche(id,NPC_ASTRA.findIndex(n=>n.id===id));g.name='astra-npc-'+id;g.userData.npcId=id;this.vecinos.set(id,g);capa.add(g);sustituir('npc:'+id,capa,g);}
  }
  this.update(0);
 }
 actorHabla(id:string|null){this.grupo.traverse(g=>{if(!g.userData.mixer||!g.userData.actorId)return;const hablando=g.userData.actorId===id;if(g.userData.hablando===hablando)return;g.userData.hablando=hablando;const clips=g.userData.clips as THREE.AnimationClip[],clip=clips.find(c=>c.name===(hablando?'hablar':'reposo'));if(clip){const mixer=g.userData.mixer as THREE.AnimationMixer;mixer.stopAllAction();mixer.clipAction(clip).play();}});}
 update(dt:number){if(!this.grupo.visible||!this.estado)return;this.grupo.traverse(g=>{if(g.userData.mixer)(g.userData.mixer as THREE.AnimationMixer).update(dt);if(!g.userData.npcId)return;const id=g.userData.npcId,p=posicionNpcAstra(this.estado!,id);g.visible=!!p&&p.interior===this.estado!.astra?.interior;if(p&&g.visible){g.position.set(p.x,0,p.z);if(!g.userData.mixer)animarVecino(g,dt,false);}});}
 private limpiar(){sacarVecinos(this.grupo);for(const g of [...this.grupo.children]){g.userData.liberado=true;liberar(g);}this.vecinos.clear();}
 dispose(){this.limpiar();this.suelos.dispose();this.grupo.userData.liberado=true;this.grupo.removeFromParent();}
}
