import * as THREE from 'three';
import type { CultivoDef } from './catalogo';
import { caja, compactar } from './suelo';

/** Vegetación propia sin texturas externas; los lotes visibles se compactan después por material. */
export function plantaCultivo(d:CultivoDef,fase:number,rebrote=false):THREE.Group{
 const g=new THREE.Group(),color=d.color??'#caa774',verde='#829e68',escala=[.24,.5,.76,1][fase],altura=d.forma==='cereal'?.85:d.enrejado?1.2:.45;
 const forma=(size:number[],pos:number[],c:string)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshStandardMaterial({color:c,roughness:.9}));m.scale.fromArray(size);m.position.fromArray(pos);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
 const tallo=(x:number,z:number,h=altura*escala)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.015,.025,h,5),new THREE.MeshStandardMaterial({color:verde,roughness:.9}));m.position.set(x,h/2,z);m.castShadow=true;g.add(m);return h;};
 const hojas=(x:number,z:number,h:number)=>{for(let i=0;i<3;i++){const a=i*Math.PI*2/3,hoja=forma([.17*escala,.025,.08*escala],[x+Math.cos(a)*.10*escala,h*.35+Math.sin(i)*.035,z+Math.sin(a)*.1*escala],verde);hoja.rotation.y=-a;hoja.rotation.z=.25;}};
 if(d.enrejado){for(const x of[-.3,.3])caja(g,[.045,1.35,.045],[x,.675,0],'#b99770');for(const y of[.35,.75,1.15])caja(g,[.66,.035,.035],[0,y,0],'#c4a67c');}
 if(d.forma==='cereal'){
  for(let i=0;i<5;i++){const x=(i%3-1)*.15,z=(Math.floor(i/3)-.5)*.22,h=tallo(x,z);if(fase>=2)for(let k=0;k<3;k++)forma([.055,.075,.038],[x+(k%2?-.035:.035),h-.11+k*.065,z],fase===3?color:'#adc282');}
 }else if(d.forma==='cabeza'){
  for(let i=0;i<5;i++){const a=i*1.25,m=forma([.18*escala,.055,.23*escala],[Math.cos(a)*.14*escala,.08+fase*.025,Math.sin(a)*.14*escala],verde);m.rotation.y=-a;m.rotation.z=.2;}
  if(fase>=2){forma([.19*escala,.17*escala,.19*escala],[0,.18*escala,0],color);if(d.id==='coliflor'||d.id==='brocoli')for(let i=0;i<5;i++)forma([.065,.065,.065],[Math.cos(i*1.25)*.13,.27*escala,Math.sin(i*1.25)*.13],color);}
 }else if(d.forma==='hongo'){
  for(let i=0;i<3;i++){const x=(i-1)*.15,z=i%2*.15,h=.22*escala;tallo(x,z,h);if(fase>=1){forma([.15*escala,.08*escala,.15*escala],[x,h,z],color);if(fase===3)for(let j=0;j<3;j++)forma([.025,.012,.025],[x+Math.cos(j*2)*.085,h+.06,z+Math.sin(j*2)*.085],'#e8d6c9');}}
 }else if(d.forma==='raiz'){
  hojas(0,0,.27*escala);if(fase>=2)forma([.17*escala,.09*escala,.13*escala],[0,.03,0],color);
 }else if(d.forma==='cactus'){
  forma([.13*escala,.3*escala,.13*escala],[0,.25*escala,0],verde);if(fase>=2){forma([.065,.17,.07],[-.16,.26,0],verde);forma([.065,.13,.07],[.16,.33,0],verde);}if(fase===3)forma([.08,.09,.07],[0,.57,0],color);
 }else if(d.forma==='hoja'){
  for(let i=0;i<5;i++){const a=i*1.25,m=forma([.1*escala,.2*escala,.065*escala],[Math.cos(a)*.08,.16*escala,Math.sin(a)*.08],i%2?verde:color);m.rotation.z=Math.sin(a)*.5;m.rotation.x=Math.cos(a)*.4;}
 }else {
  const h=tallo(0,0);hojas(0,0,h);if(d.enrejado)hojas(0,0,h*2);
  if(fase>=2&&!rebrote||fase===3){
   if(d.forma==='flor'){const y=h+.03;forma([.045,.04,.045],[0,y,0],'#e5c46e');for(let i=0;i<6;i++){const a=i*1.05,m=forma([.1*escala,.025,.06*escala],[Math.cos(a)*.09,y,Math.sin(a)*.09],color);m.rotation.y=-a;}}
   else if(d.forma==='baya'||d.forma==='vaina'){for(let i=0;i<4;i++)forma(d.forma==='vaina'?[.035,.14,.035]:[.07,.07,.07],[(i%2?-.09:.09),h*(.45+i*.1),Math.floor(i/2)*.09],color);}
   else{const m=forma([.21*escala,.16*escala,.18*escala],[0,.13,0],color);if(d.id==='pina')for(let i=0;i<4;i++){const hoja=forma([.035,.19,.035],[0,.39,0],verde);hoja.rotation.z=(i-1.5)*.4;}if(d.id.includes('melon'))for(let i=0;i<4;i++)forma([.012,.13,.014],[Math.cos(i*1.57)*.2,.16,Math.sin(i*1.57)*.17],'#d9deac');m.rotation.y=.3;}
  }
 }
 compactar(g);return g;
}
