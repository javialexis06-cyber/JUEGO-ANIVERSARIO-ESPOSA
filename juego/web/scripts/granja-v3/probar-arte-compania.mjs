import assert from 'node:assert/strict';import {build} from 'esbuild';
const result=await build({entryPoints:['src/granja-v3/compania-render.ts'],bundle:true,write:false,format:'esm',platform:'node',target:'es2022',external:['three','three/*']});let code=result.outputFiles[0].text;
for(const m of [...code.matchAll(/from (["'])([^"']+)\1/g)])code=code.replace(m[0],'from '+JSON.stringify(import.meta.resolve(m[2])));
const {modeloCompania,hogarMascotaVista}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));const stats=[];let checks=0;
for(const tipo of ['gato','perro','tortuga','caballo'])for(let variante=0;variante<4;variante++)for(const calidad of ['ligera','alta']){
 const model=modeloCompania(tipo,variante,calidad);assert.ok(model.asset.triangles<70000);assert.ok(model.asset.drawCalls<=28);assert.equal(model.asset.bytes,0);
 for(const clip of ['reposo','caminar','comer','acariciar','dormir']){model.play(clip);for(let i=0;i<6;i++)model.update(.1);}
 model.root.traverse(o=>{if(o.isMesh){for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));}assert.ok(o.position.toArray().every(Number.isFinite));assert.ok(o.quaternion.toArray().every(Number.isFinite));});
 stats.push({tipo,variante,calidad,triangles:model.asset.triangles,drawCalls:model.asset.drawCalls});model.dispose();checks++;
}
for(const agua of [false,true]){const g=hogarMascotaVista('mascota_prueba',agua);assert.equal(g.getObjectByName('cuenco-mascota_prueba').userData.ganado.tipo,'cuenco');g.traverse(o=>{if(o.isMesh)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});checks++;}
console.log(JSON.stringify({checks,failures:0,maxTriangles:Math.max(...stats.map(s=>s.triangles)),maxDrawCalls:Math.max(...stats.map(s=>s.drawCalls)),models:stats}));
