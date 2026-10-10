import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { mkdir, writeFile } from 'node:fs/promises';
import { crearMiticos } from './miticos.mjs';
import { compactar } from '../granja-v2/formas.mjs';

globalThis.FileReader ??= class { result=null;onloadend=null;onerror=null;readAsArrayBuffer(blob){blob.arrayBuffer().then(x=>{this.result=x;this.onloadend?.({target:this});}).catch(e=>this.onerror?.(e));}readAsDataURL(blob){blob.arrayBuffer().then(x=>{this.result='data:'+blob.type+';base64,'+Buffer.from(x).toString('base64');this.onloadend?.({target:this});}).catch(e=>this.onerror?.(e));} };
await MeshoptSimplifier.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),exporter=new GLTFExporter(),out='public/modelos/granja-v3';
await mkdir(out,{recursive:true});
const manifest={version:2,collection:'miticos-v3',units:'meters',upAxis:'Y',frontAxis:'+Z',assets:[]};
function stats(buffer){const b=new Uint8Array(buffer),view=new DataView(b.buffer,b.byteOffset,b.byteLength),j=JSON.parse(new TextDecoder().decode(b.slice(20,20+view.getUint32(12,true))));let triangles=0,drawCalls=0;for(const m of j.meshes??[])for(const p of m.primitives){triangles+=j.accessors[p.indices??p.attributes.POSITION].count/3;drawCalls++;}return{triangles,drawCalls};}
for(const a of crearMiticos()) {
  compactar(a.root);a.root.userData={...a.root.userData,assetId:a.id,footprint:a.footprint,version:3};
  const size=new THREE.Box3().setFromObject(a.root).getSize(new THREE.Vector3()).toArray();
  let buffer=new Uint8Array(await exporter.parseAsync(a.root,{binary:true,animations:a.clips,onlyVisible:false}));
  // Preserve the silhouette while enforcing the 15k triangle high-detail budget.
  for(let attempt=0;stats(buffer).triangles>15000&&attempt<3;attempt++){const doc=await io.readBinary(buffer);await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:Math.min(.88,14300/stats(buffer).triangles),error:.0008*Math.pow(2.5,attempt),lockBorder:false}));buffer=await io.writeBinary(doc);}
  const high=stats(buffer); if(high.triangles>15000)throw new Error(`${a.id}: high geometry budget exceeded (${high.triangles})`);
  await writeFile(`${out}/${a.id}.glb`,buffer);
  const doc=await io.readBinary(buffer);await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.42,error:.005,lockBorder:false}));const low=await io.writeBinary(doc);await writeFile(`${out}/${a.id}_lod.glb`,low);
  manifest.assets.push({id:a.id,label:a.label,category:a.category,path:a.id+'.glb',footprint:a.footprint,size,bytes:buffer.byteLength,...high,animations:a.clips.map(c=>c.name),lod:{path:a.id+'_lod.glb',bytes:low.byteLength,...stats(low)}});
  console.log(a.id,high.triangles+' → '+stats(low).triangles+' triangles',buffer.byteLength+' bytes');
}
manifest.totalBytes=manifest.assets.reduce((n,a)=>n+a.bytes+a.lod.bytes,0);await writeFile(out+'/manifest.json',JSON.stringify(manifest,null,2));console.log('Míticos exportados:',manifest.totalBytes,'bytes');
