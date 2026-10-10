import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
export type Calidad='alta'|'ligera';
export interface Asset{ id:string;label:string;category:string;path:string;bytes:number;triangles:number;drawCalls:number;animations:string[];footprint:[number,number];size:number[];lod:{path:string;bytes:number;triangles:number;drawCalls:number};}
interface Entry{root:THREE.Group;clips:THREE.AnimationClip[];refs:number;used:number;}
export class Objeto{
 readonly mixer:THREE.AnimationMixer;private current?:THREE.AnimationAction;private dead=false;
 constructor(readonly root:THREE.Group,readonly asset:Asset,readonly clips:THREE.AnimationClip[],private release:()=>void){this.mixer=new THREE.AnimationMixer(root);}
 play(name:string,loop=true){const c=this.clips.find(c=>c.name===name);if(!c)return;const next=this.mixer.clipAction(c);if(next===this.current&&next.isRunning())return;this.current?.fadeOut(.22);next.reset().setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);next.clampWhenFinished=!loop;next.fadeIn(.22).play();this.current=next;}
 update(dt:number){if(!this.dead)this.mixer.update(dt);}
 dispose(){if(this.dead)return;this.dead=true;this.mixer.stopAllAction();this.mixer.uncacheRoot(this.root);this.root.removeFromParent();this.release();}
}
function free(root:THREE.Object3D){const gs=new Set<THREE.BufferGeometry>(),ms=new Set<THREE.Material>();root.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){gs.add(m.geometry);(Array.isArray(m.material)?m.material:[m.material]).forEach(m=>ms.add(m));}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
export class BibliotecaV2{
 private loader=new GLTFLoader();private cache=new Map<string,Promise<Entry>>();private entries=new Map<string,Entry>();private borrowers=new Map<string,number>();private closed=false;
 private constructor(readonly assets:Asset[],readonly base:string){}
 static async cargar(base='./modelos/granja-v2/'){const r=await fetch(base+'manifest.json');if(!r.ok)throw new Error('Catálogo '+r.status);const m=await r.json();if(m.version!==2||!Array.isArray(m.assets))throw new Error('Catálogo V2 inválido');return new BibliotecaV2(m.assets,base);}
 async crear(id:string,quality:Calidad='alta'):Promise<Objeto>{
  if(this.closed)throw new Error('Biblioteca cerrada');
  const asset=this.assets.find(a=>a.id===id);if(!asset)throw new Error('No existe '+id);
  const key=id+quality;this.borrowers.set(key,(this.borrowers.get(key)??0)+1);
  try{
   let promise=this.cache.get(key);
   if(!promise){promise=this.loader.loadAsync(this.base+(quality==='alta'?asset.path:asset.lod.path)).then(g=>{
    if(this.closed){free(g.scene);throw new Error('Biblioteca cerrada');}
    g.scene.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){const mats=Array.isArray(m.material)?m.material:[m.material];m.castShadow=!mats.some(m=>m.transparent);m.receiveShadow=true;}});
    const entry={root:g.scene,clips:g.animations,refs:0,used:performance.now()};this.entries.set(key,entry);return entry;
   }).catch(e=>{this.cache.delete(key);throw e;});this.cache.set(key,promise);}
   const entry=await promise;if(this.closed)throw new Error('Biblioteca cerrada');
   entry.refs++;entry.used=performance.now();
   return new Objeto(entry.root.clone(true),asset,entry.clips,()=>{entry.refs--;entry.used=performance.now();this.evict();});
  }finally{const n=(this.borrowers.get(key)??1)-1;if(n)this.borrowers.set(key,n);else this.borrowers.delete(key);}
 }
 private evict(){const unused=[...this.entries].filter(([key,e])=>e.refs===0&&!this.borrowers.has(key)).sort((a,b)=>a[1].used-b[1].used);while(unused.length>12){const[key,e]=unused.shift()!;free(e.root);this.entries.delete(key);this.cache.delete(key);}}
 get resident(){return this.entries.size;}
 dispose(){this.closed=true;this.entries.forEach(e=>free(e.root));this.entries.clear();this.cache.clear();}
}
