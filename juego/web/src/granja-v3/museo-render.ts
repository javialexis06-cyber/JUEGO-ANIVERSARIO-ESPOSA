import * as THREE from 'three';
import { amueblar, PEDESTALES_LOTES, VITRINAS_MUSEO, type Puesto } from './cuartos';
import { ARTEFACTOS_COMUNIDAD } from './comunidad-datos';
import { figuraObjeto } from './iconos3d';
import type { EstadoGranja } from './estado';

/** Lo expuesto en el Museo del Valle: las seis vitrinas muestran lo que el jugador eligió en el museo comunitario y
 * cada lote cerrado pone su pieza en el pedestal de su cartela. Las seis piezas comunitarias son modelos de Blender
 * (pieza_<id> en granja_muebles.glb); lo demás (peces, cosechas, minerales) usa la figurita de los íconos. */
const PIEZA_LOTE:Record<string,string>={primavera:'fresa',verano:'maiz',otono:'calabaza',invierno:'melon_polvo',pesca:'carpa',mineria:'lingote_cobre'};
const ORDEN_LOTES=['primavera','verano','otono','invierno','pesca','mineria'];
const ARTEFACTOS=new Set<string>(ARTEFACTOS_COMUNIDAD.map(a=>a[0]));

/** Firma de lo expuesto: si cambia mientras se está adentro, la vista rehace el interior. */
export function firmaMuseo(s:EstadoGranja){return (s.comunidad?.vitrinas??[]).map(v=>v??'-').join(',')+'|'+s.colecciones.lotes.filter(l=>l.completadoDia!==null).map(l=>l.id).join(',');}

/** Figurita de icono ajustada para que quepa en una caja de `lado` metros, apoyada en y=0. */
function figurita(id:string,lado:number){
 const f=figuraObjeto(id);if(!f)return null;
 const caja=new THREE.Box3().setFromObject(f),tam=caja.getSize(new THREE.Vector3()),escala=lado/Math.max(tam.x,tam.y,tam.z,1e-3);
 const g=new THREE.Group();f.scale.multiplyScalar(escala);const c=caja.getCenter(new THREE.Vector3()).multiplyScalar(escala);f.position.set(-c.x,-caja.min.y*escala,-c.z);
 f.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});g.add(f);g.name='pieza-'+id;return g;
}

export function exponerMuseo(g:THREE.Group,s:EstadoGranja){
 const kit:Puesto[]=[];
 const poner=(id:string,x:number,z:number,y:number,lado:number,giro=0)=>{
  if(ARTEFACTOS.has(id)){kit.push(['pieza_'+id,x,z,giro,1.6,y]);return;}
  const f=figurita(id,lado);if(!f)return;f.position.set(x,y,z);f.rotation.y=giro;g.add(f);
 };
 (s.comunidad?.vitrinas??[]).slice(0,VITRINAS_MUSEO.length).forEach((id,i)=>{if(id){const [x,z]=VITRINAS_MUSEO[i];poner(id,x,z,1.05,.55,-.35);}});
 for(const r of s.colecciones.lotes){if(r.completadoDia===null)continue;const i=ORDEN_LOTES.indexOf(r.id);if(i<0)continue;const [x,z]=PEDESTALES_LOTES[i];poner(PIEZA_LOTE[r.id],x,z,1.1,.6,-.35);}
 if(kit.length)amueblar(g,kit);
}
