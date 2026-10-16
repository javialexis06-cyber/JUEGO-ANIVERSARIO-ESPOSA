import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PLANTAS } from './datos';
import type { MotorJardin } from './motor';
export type EstadoVisualJardin=Pick<MotorJardin,'nivel'|'t'|'plantas'|'zombis'|'semillas'|'soles'|'guardianes'>;
export class VistaJardin {
 readonly renderer:THREE.WebGLRenderer;readonly escena=new THREE.Scene();readonly camara=new THREE.PerspectiveCamera(35,1,.1,100);
 private kit=new Map<string,THREE.Object3D>();private figuras=new Map<string,THREE.Object3D>();private campo=new THREE.Group();private piezas=new THREE.Group();private objetivo=new THREE.Vector3(3.5,0,2);
 private filas=0;
 private ray=new THREE.Raycaster();private plano=new THREE.Plane(new THREE.Vector3(0,1,0),0);private resize:ResizeObserver;
 private geometria=new THREE.SphereGeometry(.12,8,6);private material=new THREE.MeshStandardMaterial({color:'#eadc9f',roughness:1});
 constructor(readonly cont:HTMLElement){
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(1.5,devicePixelRatio));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
  this.renderer.domElement.setAttribute('aria-label','Jardín de cinco carriles: toca una casilla para sembrar');cont.append(this.renderer.domElement);this.escena.add(this.campo,this.piezas);
  this.escena.add(new THREE.HemisphereLight('#fff4d6','#6a796c',2));const sol=new THREE.DirectionalLight('#fff1d6',2.3);sol.position.set(-3,8,3);this.escena.add(sol);
  this.resize=new ResizeObserver(()=>this.redimensionar());this.resize.observe(cont);this.redimensionar();
 }
 private redimensionar(){const w=this.cont.clientWidth,h=this.cont.clientHeight;this.renderer.setSize(w,h,false);this.camara.aspect=w/Math.max(1,h);this.camara.updateProjectionMatrix();if(this.filas)this.encuadrar();}
 async cargar(){const gltf=await new GLTFLoader().loadAsync('./jardin/figuras.glb');for(const o of gltf.scene.children)this.kit.set(o.name,o);}
 private caja(w:number,h:number,d:number,color:string){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:1}));}
 montar(m:Pick<EstadoVisualJardin,'nivel'>){
  this.limpiar(this.campo);this.limpiarFiguras();this.escena.background=new THREE.Color(m.nivel.cielo);
  const filas=m.nivel.filas;this.filas=filas;this.encuadrar();
  const borde=this.caja(11,.3,filas*1.12+1.4,'#b89c7c');borde.position.set(3.6,-.20,(filas-1)*.56);this.campo.add(borde);
  for(let f=0;f<filas;f++)for(let c=0;c<8;c++){const tile=this.caja(.97,.12,1.06,(f+c)%2?m.nivel.suelo:'#adc498');tile.position.set(c,-.03,f*1.12);this.campo.add(tile);}
  for(let f=0;f<filas;f++){const camino=this.caja(1.2,.1,1.06,'#cbb69d');camino.position.set(8.2,-.06,f*1.12);this.campo.add(camino);}
  for(let c=-1;c<11;c++){const poste=this.caja(.10,.65,.1,'#e7d8bd');poste.position.set(c-.45,.25,-.82);this.campo.add(poste);}
  for(let h=0;h<2;h++){const baranda=this.caja(11,.1,.1,'#f4e4c5');baranda.position.set(3.6,.15+h*.28,-.82);this.campo.add(baranda);}
 }
 private encuadrar(){
  this.objetivo.set(3.7,.35,(this.filas-1)*.56);this.camara.position.set(3.7,8.2,7.3+this.filas*.55);this.camara.lookAt(this.objetivo);
  for(let k=0;k<4;k++){this.camara.updateMatrixWorld(true);let max=0;for(const x of [-1.7,9.5])for(const z of [-.9,(this.filas-1)*1.12+.8])for(const y of [-.2,1.1]){const p=new THREE.Vector3(x,y,z).project(this.camara);max=Math.max(max,Math.abs(p.x),Math.abs(p.y));}this.camara.position.sub(this.objetivo).multiplyScalar(max/.91).add(this.objetivo);this.camara.lookAt(this.objetivo);}
  this.camara.updateMatrixWorld(true);
 }
 private modelo(clave:string,id:string){let o=this.figuras.get(id);if(o)return o;const original=this.kit.get(clave);o=original?original.clone(true):new THREE.Group();o.scale.multiplyScalar(.57);this.figuras.set(id,o);this.piezas.add(o);return o;}
 dibujar(m:EstadoVisualJardin,seleccion?:{fila:number;col:number}){
  const presentes=new Set<string>();
  for(const p of m.plantas){const id='p'+p.id;presentes.add(id);const o=this.modelo('planta_'+p.tipo,id);o.position.set(p.col,0,p.fila*1.12);o.rotation.y=-Math.PI/2;o.rotation.z=Math.sin(m.t*2+p.id)*.025;
   if(p.vida<PLANTAS[p.tipo].vida*.3)o.rotation.z+=.08;}
  for(const z of m.zombis){const id='z'+z.id;presentes.add(id);const o=this.modelo('zombi_'+z.tipo,id);o.position.set(z.x,Math.abs(Math.sin(m.t*5+z.id))*.025,z.fila*1.12);o.rotation.y=Math.PI/2;o.rotation.z=Math.sin(m.t*(z.mordiendo?8:4)+z.id)*.055;}
  for(const s of m.semillas){const id='s'+s.id;presentes.add(id);let o=this.figuras.get(id);if(!o){o=new THREE.Mesh(this.geometria,this.material);this.figuras.set(id,o);this.piezas.add(o);}o.position.set(s.x,.51,s.fila*1.12);}
  for(const l of m.soles){const id='l'+l.id;presentes.add(id);let o=this.figuras.get(id);if(!o){o=new THREE.Mesh(this.geometria,new THREE.MeshBasicMaterial({color:'#ffe482'}));o.scale.setScalar(2);this.figuras.set(id,o);this.piezas.add(o);}o.position.set(l.x,.85+Math.sin(m.t*2+l.id)*.08,l.fila*1.12);o.rotation.y=m.t;}
  for(let f=0;f<m.nivel.filas;f++)if(m.guardianes[f]){const id='g'+f;presentes.add(id);let o=this.figuras.get(id);if(!o){o=this.caja(.3,.6,.35,'#d9ae68');this.figuras.set(id,o);this.piezas.add(o);}o.position.set(-.9,.25,f*1.12);}
  if(seleccion)presentes.add('sel');
  for(const [id,o] of this.figuras)if(!presentes.has(id)){this.liberarFigura(id,o);this.figuras.delete(id);}
  if(seleccion){const id='sel';presentes.add(id);let o=this.figuras.get(id);if(!o){o=new THREE.Mesh(new THREE.RingGeometry(.34,.4,32),new THREE.MeshBasicMaterial({color:'#fff2b3',side:THREE.DoubleSide}));o.rotation.x=-Math.PI/2;this.figuras.set(id,o);this.piezas.add(o);}o.position.set(seleccion.col,.05,seleccion.fila*1.12);}
  this.renderer.render(this.escena,this.camara);
 }
 tocar(clientX:number,clientY:number){const r=this.renderer.domElement.getBoundingClientRect();this.ray.setFromCamera(new THREE.Vector2((clientX-r.left)/r.width*2-1,1-(clientY-r.top)/r.height*2),this.camara);const q=this.ray.ray.intersectPlane(this.plano,new THREE.Vector3());return q?{fila:Math.round(q.z/1.12),col:Math.round(q.x)}:null;}
 punto(x:number,fila:number,altura=.1){const q=new THREE.Vector3(x,altura,fila*1.12).project(this.camara),r=this.renderer.domElement.getBoundingClientRect();return{x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2};}
 private limpiar(g:THREE.Group,destruir=true){for(const o of [...g.children]){g.remove(o);if(destruir)o.traverse(x=>{if(x instanceof THREE.Mesh){x.geometry.dispose();for(const m of Array.isArray(x.material)?x.material:[x.material])m.dispose();}});}}
 private liberarFigura(id:string,o:THREE.Object3D){this.piezas.remove(o);if(o instanceof THREE.Mesh&&(id.startsWith('l')||id.startsWith('g')||id==='sel')){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();if(!id.startsWith('l'))o.geometry.dispose();}}
 private limpiarFiguras(){for(const [id,o] of this.figuras)this.liberarFigura(id,o);this.figuras.clear();}
 destruir(){this.resize.disconnect();this.limpiar(this.campo);this.limpiarFiguras();this.geometria.dispose();this.material.dispose();const geometria=new Set<THREE.BufferGeometry>(),material=new Set<THREE.Material>();for(const o of this.kit.values())o.traverse(x=>{if(x instanceof THREE.Mesh){geometria.add(x.geometry);for(const m of Array.isArray(x.material)?x.material:[x.material])material.add(m);}});for(const x of geometria)x.dispose();for(const x of material)x.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();}
}
