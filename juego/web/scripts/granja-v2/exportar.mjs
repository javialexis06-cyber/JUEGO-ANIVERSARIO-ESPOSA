import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld,simplify } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { mkdir,writeFile } from 'node:fs/promises';
import { crearAnimales } from './animales.mjs';
import { crearEdificios } from './edificios.mjs';
import { crearNaturaleza } from './naturaleza.mjs';
import { compactar } from './formas.mjs';
globalThis.FileReader??=class{result=null;onloadend=null;onerror=null;readAsArrayBuffer(b){b.arrayBuffer().then(x=>{this.result=x;this.onloadend?.({target:this});}).catch(e=>this.onerror?.(e));}readAsDataURL(b){b.arrayBuffer().then(x=>{this.result='data:'+b.type+';base64,'+Buffer.from(x).toString('base64');this.onloadend?.({target:this});}).catch(e=>this.onerror?.(e));}};
await MeshoptSimplifier.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),exporter=new GLTFExporter(),out='public/modelos/granja-v2';await mkdir(out,{recursive:true});
const assets=[...crearAnimales(),...crearEdificios(),...crearNaturaleza()],manifest={version:2,units:'meters',upAxis:'Y',frontAxis:'+Z',assets:[]};
const stats=(buffer)=>{const data=JSON.parse(new TextDecoder().decode(buffer.slice(20,20+new DataView(buffer.buffer,buffer.byteOffset,buffer.byteLength).getUint32(12,true))));let triangles=0,drawCalls=0;for(const m of data.meshes??[])for(const p of m.primitives){triangles+=data.accessors[p.indices??p.attributes.POSITION].count/3;drawCalls++;}return{triangles,drawCalls};};
for(const a of assets){
 compactar(a.root);a.root.userData={...a.root.userData,assetId:a.id,footprint:a.footprint,version:2};
 const box=new THREE.Box3().setFromObject(a.root),size=box.getSize(new THREE.Vector3()).toArray();
 const buffer=Buffer.from(await exporter.parseAsync(a.root,{binary:true,animations:a.clips??[],onlyVisible:false}));
 await writeFile(out+'/'+a.id+'.glb',buffer);
 const doc=await io.readBinary(buffer);await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.36,error:.006,lockBorder:false}));const low=await io.writeBinary(doc);await writeFile(out+'/'+a.id+'_lod.glb',low);
 manifest.assets.push({id:a.id,label:a.label,category:a.category,path:a.id+'.glb',footprint:a.footprint,size,bytes:buffer.length,...stats(buffer),animations:(a.clips??[]).map(c=>c.name),lod:{path:a.id+'_lod.glb',bytes:low.byteLength,...stats(low)}});
 console.log(a.id,stats(buffer).triangles+' → '+stats(low).triangles+' tris',buffer.length+' bytes');
}
manifest.totalBytes=manifest.assets.reduce((n,a)=>n+a.bytes+a.lod.bytes,0);await writeFile(out+'/manifest.json',JSON.stringify(manifest,null,2));console.log('DONE',manifest.assets.length,'assets',manifest.totalBytes,'bytes');
