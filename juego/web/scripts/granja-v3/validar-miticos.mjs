import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const folder='public/modelos/granja-v3/',manifest=JSON.parse(await fs.readFile(folder+'manifest.json','utf8')),loader=new GLTFLoader();
assert.equal(manifest.version,2);assert.equal(manifest.assets.length,3);
let totalBytes=0,clips=0;const warnings=[],warn=console.warn;console.warn=(...a)=>warnings.push(a.join(' '));
for(const asset of manifest.assets)for(const variant of [asset,asset.lod]) {
  const raw=await fs.readFile(folder+variant.path),binary=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.length);totalBytes+=raw.length;
  assert.equal(raw.length,variant.bytes);const gltf=await loader.parseAsync(binary,'');
  assert.deepEqual(gltf.animations.map(a=>a.name),['reposo','caminar','comer','acariciar']);
  let triangles=0,draws=0;const nodes=[];gltf.scene.traverse(o=>{nodes.push(o);if(!o.isMesh)return;draws++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;for(const key of ['position','normal','color']) {const attr=o.geometry.getAttribute(key);assert.ok(attr,`${asset.id}/${key}`);assert.ok(Array.from(attr.array).every(Number.isFinite));}});
  assert.equal(triangles,variant.triangles);assert.equal(draws,variant.drawCalls);if(variant===asset)assert.ok(triangles<=15000);
  const bounds=new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());assert.ok(bounds.x<=asset.footprint[0]+.001&&bounds.z<=asset.footprint[1]+.001,`${asset.id} footprint contains geometry`);
  for(const clip of gltf.animations){const mixer=new THREE.AnimationMixer(gltf.scene);for(const track of clip.tracks){const p=THREE.PropertyBinding.parseTrackName(track.name);assert.ok(THREE.PropertyBinding.findNode(gltf.scene,p.nodeName),track.name);assert.ok([...track.times,...track.values].every(Number.isFinite));}mixer.clipAction(clip).play();mixer.setTime(0);const first=nodes.map(n=>n.matrixWorld.toArray());gltf.scene.updateMatrixWorld(true);const initial=nodes.map(n=>[...n.position,...n.quaternion,...n.scale]);mixer.setTime(clip.duration*.37);const moved=nodes.some((n,i)=>[...n.position,...n.quaternion,...n.scale].some((v,j)=>Math.abs(v-initial[i][j])>1e-6));assert.ok(moved,`${asset.id}/${clip.name}: animated`);mixer.stopAllAction();mixer.uncacheRoot(gltf.scene);clips++;}
}
console.warn=warn;assert.deepEqual(warnings,[]);assert.equal(totalBytes,manifest.totalBytes);console.log(JSON.stringify({ok:true,models:3,files:6,clipsValidated:clips,totalBytes,trianglesHigh:manifest.assets.reduce((s,a)=>s+a.triangles,0),trianglesLow:manifest.assets.reduce((s,a)=>s+a.lod.triangles,0),warnings},null,2));
