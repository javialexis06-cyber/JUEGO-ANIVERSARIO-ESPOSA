import * as THREE from 'three';
import { caja, compactar } from './suelo';
/** Madera en tablas, herrajes y sello propios; mallas compactadas sin texturas. */
export function cajaEnvioVista(id:string,cargada:boolean){
 const g=new THREE.Group();g.name='envio-vista-'+id;
 for(const x of[-.36,.36])for(const z of[-.32,.32])caja(g,[.12,.12,.12],[x,.1,z],'#6b5a44');
 caja(g,[.8,.08,.7],[0,.17,0],'#916743');
 for(let fila=0;fila<3;fila++){
  for(const z of[-.35,.35])caja(g,[.84,.15,.045],[0,.29+fila*.155,z],fila%2?'#bd956a':'#aa7f55');
  for(const x of[-.42,.42])caja(g,[.045,.15,.69],[x,.29+fila*.155,0],fila%2?'#bd956a':'#aa7f55');
 }
 for(const x of[-.28,.28]){caja(g,[.06,.49,.78],[x,.43,0],'#71817c');for(const y of[.25,.59])caja(g,[.025,.025,.01],[x,y,.393],'#d1c8ad');}
 caja(g,[.3,.17,.025],[0,.45,.396],'#f2e3b7');
 const sello=new THREE.Group();for(const lado of[-1,1]){const m=caja(sello,[.14,.012,.01],[lado*.06,.01,0],'#78917c');m.rotation.z=lado*.45;}
 sello.position.set(0,.47,.412);g.add(sello);
 caja(g,[.02,.37,.02],[.47,.62,0],'#71817c');caja(g,[.12,.09,.025],[.49,cargada?.8:.55,0],cargada?'#94b677':'#8d8f79');compactar(g);
 const tapa=new THREE.Group();tapa.name='tapa_envio';tapa.position.set(0,.68,-.36);
 for(let i=0;i<5;i++)caja(tapa,[.18,.075,.78],[-.36+i*.18,.03,.38],i%2?'#be966a':'#b1895f');
 for(const x of[-.28,.28])caja(tapa,[.06,.015,.79],[x,.073,.38],'#71817c');compactar(tapa);g.add(tapa);return g;
}
