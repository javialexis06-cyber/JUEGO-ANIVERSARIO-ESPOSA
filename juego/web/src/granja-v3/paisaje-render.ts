import * as THREE from 'three';
import { caja, esfera, compactar } from './suelo';
import type { PaisajeGranja } from './paisaje';
import { SALIDAS } from './caminos-mundo';
import type { Zona } from './catalogo';
/** Agua viva: ondas que se mueven, centro más hondo, orilla clarita y destellos del sol. Sigue siendo un material
 * estándar (le llegan la luz, la niebla y la noche); el tiempo lo pone la malla justo antes de dibujarse. */
const tiempoAgua={value:0};
export function materialAgua(hondo='#2c7a8c',claro='#6fbdb6'){
 const m=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.5,metalness:0,envMapIntensity:.25});
 m.onBeforeCompile=(sh)=>{
  sh.uniforms.uTiempo=tiempoAgua;sh.uniforms.uHondo={value:new THREE.Color(hondo)};sh.uniforms.uClaro={value:new THREE.Color(claro)};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMundoAgua;varying vec2 vLocalAgua;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvMundoAgua=(modelMatrix*vec4(transformed,1.0)).xyz;vLocalAgua=position.xz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uTiempo;uniform vec3 uHondo;uniform vec3 uClaro;varying vec3 vMundoAgua;varying vec2 vLocalAgua;\nfloat ondaAgua(vec2 p){return sin(p.x*2.1+uTiempo*1.3)*.5+sin(p.y*2.7-uTiempo*1.1)*.5+sin((p.x+p.y)*3.9+uTiempo*1.9)*.35+sin((p.x-p.y)*5.3-uTiempo*2.3)*.2;}')
   .replace('#include <color_fragment>','#include <color_fragment>\n{float r=length(vLocalAgua);float o=ondaAgua(vMundoAgua.xz);vec3 c=mix(uClaro,uHondo,1.0-smoothstep(.25,.95,r));c+=o*.035;c=mix(c,vec3(.93,.98,.96),smoothstep(.86,.97,r)*(.55+.25*sin(uTiempo*1.6+atan(vLocalAgua.y,vLocalAgua.x)*7.0)));diffuseColor.rgb=c;}')
   .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n{vec2 q=vMundoAgua.xz;float e=.15;float h=ondaAgua(q);vec3 n2=normalize(vec3(-(ondaAgua(q+vec2(e,0.))-h)*.35,1.,-(ondaAgua(q+vec2(0.,e))-h)*.35));normal=normalize((viewMatrix*vec4(n2,0.)).xyz);}')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{float d=ondaAgua(vMundoAgua.xz*1.7+3.0);totalEmissiveRadiance+=vec3(1.,.98,.9)*smoothstep(1.05,1.3,d)*.35;}');
 };
 m.customProgramCacheKey=()=>'agua-granja';return m;
}
/** Malla de agua (disco) que avanza su reloj al dibujarse. */
export function mallaAgua(rx:number,rz:number,hondo?:string,claro?:string){const a=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.025,48,1),materialAgua(hondo,claro));a.scale.set(rx,1,rz);a.receiveShadow=true;a.userData.noCompactar=true;a.onBeforeRender=()=>{tiempoAgua.value=performance.now()/1000;};return a;}
export function paisajeGranja(p:PaisajeGranja):THREE.Group{
 const g=new THREE.Group();
 for(const e of p.estanques){
  const borde=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.07,32),new THREE.MeshStandardMaterial({color:'#a8b793',roughness:1}));borde.scale.set(e.radioX+.26,1,e.radioZ+.26);borde.position.set(e.x,-.005,e.z);borde.receiveShadow=true;g.add(borde);
  const agua=mallaAgua(e.radioX,e.radioZ);agua.position.set(e.x,.043,e.z);g.add(agua);
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
