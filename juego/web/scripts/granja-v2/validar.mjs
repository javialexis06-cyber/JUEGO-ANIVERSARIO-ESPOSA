// Run from juego/web: node scripts/granja-v2/validar.mjs [manifest.json] [expected-count]
// Validates real exported files and AnimationMixer motion; it does not certify phone FPS.
import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const manifestPath=path.resolve(process.argv[2]??'public/modelos/granja-v2/manifest.json');
const expected=Number(process.argv[3]??77),base=path.dirname(manifestPath);
const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
const errors=[],warnings=[],loader=new GLTFLoader();
let files=0,clipsValidated=0,totalBytes=0,highTriangles=0,lodTriangles=0;
const fail=(id,message)=>errors.push(`${id}: ${message}`);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const originalWarn=console.warn;
console.warn=(...args)=>warnings.push(args.join(' '));

function glbJSON(bytes,id){
  if(bytes.length<20||bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2)throw new Error(`${id}: invalid GLB 2 header`);
  if(bytes.readUInt32LE(8)!==bytes.length)throw new Error(`${id}: GLB header size does not match file`);
  if(bytes.readUInt32LE(16)!==0x4e4f534a)throw new Error(`${id}: first GLB chunk is not JSON`);
  const length=bytes.readUInt32LE(12);
  return JSON.parse(bytes.subarray(20,20+length).toString('utf8'));
}

function transformState(nodes){
  return nodes.map(o=>o.position.toArray().concat(o.quaternion.toArray(),o.scale.toArray(),o.morphTargetInfluences??[]));
}

function differs(before,after){
  return before.some((values,i)=>values.some((v,j)=>Math.abs(v-after[i][j])>1e-6));
}

async function validate(asset,quality){
  const data=quality==='alta'?asset:asset.lod,key=`${asset.id}/${quality}`;
  if(!data||typeof data.path!=='string'||!/^[a-z0-9_-]+\.glb$/i.test(data.path))throw new Error(`${key}: unsafe or missing relative file path`);
  const bytes=await fs.readFile(path.join(base,data.path));files++;totalBytes+=bytes.length;
  const json=glbJSON(bytes,key);
  if(bytes.length!==data.bytes)fail(key,`size ${bytes.length} differs from manifest ${data.bytes}`);
  if(json.images?.length)fail(key,'expected self-contained vertex-colour assets; image textures need a separate browser validation');
  if((json.buffers??[]).some(b=>b.uri))fail(key,'external buffer dependency');
  let triangles=0,drawCalls=0;
  for(const mesh of json.meshes??[])for(const p of mesh.primitives){
    if((p.mode??4)!==4)fail(key,'primitive is not triangle geometry');
    const index=p.indices??p.attributes?.POSITION,accessor=json.accessors?.[index];
    if(!accessor){fail(key,'missing geometry accessor');continue;}
    triangles+=accessor.count/3;drawCalls++;
    if(p.attributes?.COLOR_0===undefined)fail(key,'mesh lost vertex colours');
  }
  if(triangles!==data.triangles)fail(key,`triangles ${triangles} differ from manifest ${data.triangles}`);
  if(drawCalls!==data.drawCalls)fail(key,`primitives ${drawCalls} differ from manifest ${data.drawCalls}`);
  if(quality==='alta')highTriangles+=triangles;else lodTriangles+=triangles;
  const metadata=(json.nodes??[]).find(n=>n.extras?.assetId===asset.id)?.extras;
  if(!metadata||metadata.version!==2||!same(metadata.footprint,asset.footprint))fail(key,'assetId/version/footprint extras were not preserved');
  const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
  const parsed=await loader.parseAsync(buffer,'');
  const clipNames=parsed.animations.map(c=>c.name);
  if(!same(clipNames,asset.animations))fail(key,`animation names differ: ${clipNames.join(', ')}`);
  const nodes=[];
  parsed.scene.traverse(o=>{
    nodes.push(o);
    if(!o.isMesh)return;
    for(const name of ['position','normal','color']){
      const attribute=o.geometry.getAttribute(name);
      if(!attribute){fail(key,`missing ${name} on ${o.name}`);continue;}
      if(Array.from(attribute.array).some(v=>!Number.isFinite(v)))fail(key,`non-finite ${name} on ${o.name}`);
    }
    const mats=Array.isArray(o.material)?o.material:[o.material];
    if(mats.some(m=>!m.vertexColors))fail(key,'loaded material disables vertex colours');
  });
  for(const clip of parsed.animations){
    clipsValidated++;
    if(!(clip.duration>0))fail(key,`clip ${clip.name} has no positive duration`);
    for(const track of clip.tracks){
      const binding=THREE.PropertyBinding.parseTrackName(track.name);
      if(!THREE.PropertyBinding.findNode(parsed.scene,binding.nodeName))fail(key,`${clip.name}: unbound track ${track.name}`);
      if([...track.times,...track.values].some(v=>!Number.isFinite(v)))fail(key,`${clip.name}: non-finite keyframes`);
    }
    const mixer=new THREE.AnimationMixer(parsed.scene);
    mixer.clipAction(clip).play();mixer.setTime(0);
    const before=transformState(nodes);let moved=false;
    for(const fraction of [.173,.417,.731]){
      mixer.setTime(clip.duration*fraction);
      moved ||= differs(before,transformState(nodes));
    }
    if(!moved)fail(key,`clip ${clip.name} did not move any node at three sampled times`);
    mixer.stopAllAction();mixer.uncacheRoot(parsed.scene);
  }
  const geometries=new Set(),materials=new Set();
  parsed.scene.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  return {json,triangles};
}

try{
  if(manifest.version!==2||manifest.units!=='meters'||manifest.upAxis!=='Y')fail('manifest','unexpected version or unit convention');
  if(!Array.isArray(manifest.assets))throw new Error('manifest.assets must be an array');
  if(manifest.assets.length!==expected)fail('manifest',`expected ${expected} models, found ${manifest.assets.length}`);
  const ids=new Set();
  for(const asset of manifest.assets){
    if(ids.has(asset.id))fail('manifest',`duplicate id ${asset.id}`);ids.add(asset.id);
    try{
      const high=await validate(asset,'alta'),low=await validate(asset,'ligera');
      if(low.triangles>high.triangles)fail(asset.id,'LOD has more triangles than high detail');
      for(const extension of high.json.extensionsRequired??[])if(!(low.json.extensionsRequired??[]).includes(extension))fail(asset.id,`LOD dropped required extension ${extension}`);
      for(const extension of high.json.extensionsUsed??[])if(!(low.json.extensionsUsed??[]).includes(extension))fail(asset.id,`LOD dropped extension ${extension}`);
    }catch(error){fail(asset.id,error instanceof Error?error.message:String(error));}
  }
  if(totalBytes!==manifest.totalBytes)fail('manifest',`totalBytes ${manifest.totalBytes} differs from actual files ${totalBytes}`);
}finally{console.warn=originalWarn;}

const report={ok:errors.length===0,models:manifest.assets.length,files,clipsValidated,totalBytes,highTriangles,lodTriangles,lodReductionPercent:Number((100*(1-lodTriangles/highTriangles)).toFixed(1)),warnings:[...new Set(warnings)],errors};
console.log(JSON.stringify(report,null,2));
if(errors.length)process.exitCode=1;
