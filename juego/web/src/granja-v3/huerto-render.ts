import * as THREE from 'three';
import { caja, esfera, compactar } from './suelo';
import { frutalDef } from './frutales-datos';
import { faseFrutal, type Frutal } from './frutales';
function rama(g:THREE.Group,a:number[],b:number[],r:number,color:string){const aa=new THREE.Vector3().fromArray(a),bb=new THREE.Vector3().fromArray(b),v=bb.clone().sub(aa);const m=new THREE.Mesh(new THREE.CylinderGeometry(r*.7,r,v.length(),7),new THREE.MeshStandardMaterial({color,roughness:.92}));m.position.copy(aa.add(bb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());m.castShadow=true;g.add(m);}
export function frutalVista(f:Frutal){
 const g=new THREE.Group();g.name='frutal-vista-'+f.id;const d=frutalDef(f.tipo)!,fase=faseFrutal(f),seco=f.cuidado.status==='arruinado',escala=[.26,.43,.62,.81,1][fase];
 rama(g,[0,0,0],[.04,1.65,0],.14,'#91724c');for(let i=0;i<5;i++){const a=i*Math.PI*2/5;rama(g,[0,.1,0],[Math.cos(a)*.36,.02,Math.sin(a)*.36],.045,'#91724c');}
 for(let i=0;i<4;i++){const a=i*2.4;rama(g,[.03,.75+i*.12,0],[Math.sin(a)*.7,1.65+i*.09,Math.cos(a)*.6],.06,'#91724c');}compactar(g);
 const copa=new THREE.Group();copa.name='copa-frutal';copa.userData.semilla=f.semilla;g.add(copa);
 if(!seco){if(d.forma==='banano'){for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const hoja=esfera(copa,[.25,.065,1.65],[Math.sin(a)*.53,1.85+Math.sin(i)*.1,Math.cos(a)*.53],i%2?'#94b17a':d.hojas);hoja.rotation.y=a;hoja.rotation.x=.3;}}
 else{for(let i=0;i<7;i++){const a=i*2.4;esfera(copa,[.68,.57,.64],[Math.sin(a)*.58,1.55+Math.sin(i*1.6)*.25,Math.cos(a)*.5],i%3===0?'#a0b575':d.hojas);}esfera(copa,[1.15,.8,1.15],[0,1.9,0],d.hojas);}
 if(fase===4&&f.frutos)for(let i=0;i<f.frutos*2;i++){const a=i*2.4,xx=Math.sin(a)*1.12,zz=Math.cos(a)*1.08,yy=1.36+Math.sin(i)*.1;
  if(d.forma==='banano'){for(let k=0;k<3;k++){const fruta=esfera(copa,[.085,.29,.09],[xx+k*.075,yy,zz],d.color);fruta.rotation.z=.2+k*.17;}}
  else{esfera(copa,[.19,.2,.18],[xx,yy,zz],d.color);rama(copa,[xx,yy+.1,zz],[xx+.015,yy+.18,zz],.013,'#7a8052');}}
 if(fase===3)for(let i=0;i<5;i++){const a=i*2.4;esfera(copa,[.09,.06,.09],[Math.sin(a)*.72,1.7,Math.cos(a)*.64],f.tipo==='cerezo'?'#eed0d0':'#efe7c5');}
 }compactar(copa);g.scale.setScalar(escala);g.position.set(f.x+.5,.02,f.z+.5);return g;
}
export function interiorInvernadero(){const g=new THREE.Group();g.name='interior-invernadero';caja(g,[16,.16,12],[0,-.08,0],'#c3b58d');for(let i=-8;i<8;i++)caja(g,[.025,.015,12],[i,0,0],'#aca784');
 for(const x of[-2.5,2.5]){caja(g,[3,.012,6],[x,.025,0],'#a28a60');for(const z of[-3.04,3.04])caja(g,[3.12,.07,.08],[x,.04,z],'#b9956a');for(const xx of[x-1.54,x+1.54])caja(g,[.08,.07,6],[xx,.04,0],'#b9956a');}
 for(const x of[-7.9,-4,0,4,7.9])caja(g,[.14,3.2,.18],[x,1.6,-5.9],'#a58a62');for(const y of[.35,1.6,3.18])caja(g,[16,.13,.18],[0,y,-5.9],'#b6996e');
 for(const x of[-7.9,7.9]){caja(g,[.14,.45,12],[x,.2,0],'#c6b38d');for(const z of[-3,0,3])caja(g,[.12,2.6,.12],[x,1.3,z],'#b49a73');}
 for(const x of[-1,1])caja(g,[.13,2.7,.16],[x,1.35,5.9],'#a68b62');caja(g,[2.1,.15,.16],[0,2.7,5.9],'#bca27d');caja(g,[1.8,.025,1.1],[0,.025,5.25],'#e5d8b4');
 compactar(g);const cristal=new THREE.Mesh(new THREE.BoxGeometry(15.7,2.8,.04),new THREE.MeshStandardMaterial({color:'#b0d4c7',transparent:true,opacity:.22,roughness:.2,depthWrite:false}));cristal.position.set(0,1.8,-5.88);g.add(cristal);return g;}
export function riegoInvernadero(){const g=new THREE.Group();g.name='riego-invernadero';for(const x of[-2.5,2.5]){caja(g,[.035,.07,6],[x,.08,0],'#7b9b93');for(const z of[-2.5,-.5,1.5]){caja(g,[.13,.09,.13],[x,.12,z],'#8daea0');}}compactar(g);return g;}
