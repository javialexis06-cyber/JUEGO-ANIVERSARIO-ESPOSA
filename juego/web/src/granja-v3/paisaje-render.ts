import * as THREE from 'three';
import { caja, esfera, compactar } from './suelo';
import type { PaisajeGranja } from './paisaje';
import { SALIDAS } from './caminos-mundo';
import type { Zona } from './catalogo';
export function paisajeGranja(p:PaisajeGranja):THREE.Group{
 const g=new THREE.Group();
 for(const e of p.estanques){
  const borde=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.07,32),new THREE.MeshStandardMaterial({color:'#a8b793',roughness:1}));borde.scale.set(e.radioX+.26,1,e.radioZ+.26);borde.position.set(e.x,-.005,e.z);borde.receiveShadow=true;g.add(borde);
  const agua=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.025,32),new THREE.MeshStandardMaterial({color:'#79b9b0',roughness:.24,metalness:.08}));agua.scale.set(e.radioX,1,e.radioZ);agua.position.set(e.x,.043,e.z);g.add(agua);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,x=e.x+Math.cos(a)*(e.radioX+.12),z=e.z+Math.sin(a)*(e.radioZ+.10);if(i%3===0)esfera(g,[.22,.16,.18],[x,.11,z],'#a9ada0');else{const tallo=caja(g,[.025,.35,.025],[x,.17,z],'#819771');tallo.rotation.z=.13;esfera(g,[.04,.1,.04],[x,.38,z],'#a18e68');}}
  for(let i=0;i<3;i++){const nenufar=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.014,10),new THREE.MeshStandardMaterial({color:'#86a97d'}));nenufar.position.set(e.x+(i-1)*.4,.068,e.z+i*.13-.2);g.add(nenufar);if(i===1)esfera(g,[.07,.03,.07],[nenufar.position.x,.10,nenufar.position.z],'#e6bdc6');}
 }
 for(const h of p.huecos){if(h.relleno){caja(g,[.96,.016,.96],[h.x+.5,.012,h.z+.5],'#a49b77');continue;}
  caja(g,[.96,.012,.96],[h.x+.5,.022,h.z+.5],'#514e43');caja(g,[.67,.014,.67],[h.x+.5,.031,h.z+.5],'#343a34');
  for(const z of[h.z+.025,h.z+.975])caja(g,[1.04,.12,.11],[h.x+.5,.065,z],'#a08a64');for(const x of[h.x+.025,h.x+.975])caja(g,[.11,.12,.87],[x,.065,h.z+.5],'#b5a077');
 }
 compactar(g);return g;
}
export function señalesSalidas(zona:Zona):THREE.Group{
 const g=new THREE.Group();for(const s of SALIDAS.filter(s=>s.desde===zona)){
  caja(g,[.09,1.05,.09],[s.x+1.2,.53,s.z+.7],'#9d805e');caja(g,[.72,.28,.09],[s.x+1.2,.9,s.z+.7],'#c6ae82');
  const flecha=new THREE.Mesh(new THREE.ConeGeometry(.085,.25,3),new THREE.MeshStandardMaterial({color:'#6d815d'}));flecha.rotation.z=-Math.PI/2;flecha.position.set(s.x+1.25,.9,s.z+.765);g.add(flecha);
  for(let i=-1;i<=1;i++)caja(g,[.68,.012,.7],[s.x+.5,.009,s.z+.5+i*.75],'#c0b28a');
 }compactar(g);return g;
}
/** Nudo hundido en el tronco del árbol grande; acompaña el modelo original del follaje. */
export function huecoArbolGrande(x:number,z:number):THREE.Group{
 const g=new THREE.Group(),oscuro=new THREE.Mesh(new THREE.CircleGeometry(.3,16),new THREE.MeshStandardMaterial({color:'#443b30',roughness:1}));oscuro.scale.set(1,1.55,1);oscuro.position.set(0,.83,.43);g.add(oscuro);
 const aro=new THREE.Mesh(new THREE.TorusGeometry(.31,.052,5,16),new THREE.MeshStandardMaterial({color:'#967957',roughness:1}));aro.scale.set(1,1.55,1);aro.position.copy(oscuro.position);aro.position.z+=.025;g.add(aro);compactar(g);g.position.set(x,0,z);return g;
}
