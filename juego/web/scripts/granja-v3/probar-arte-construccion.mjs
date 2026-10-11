import assert from 'node:assert/strict';import {build} from 'esbuild';
const result=await build({entryPoints:['src/granja-v3/construccion-render.ts'],bundle:true,write:false,format:'esm',platform:'node',target:'es2022',external:['three','three/*']});let code=result.outputFiles[0].text;
for(const m of [...code.matchAll(/from (["'])([^"']+)\1/g)])code=code.replace(m[0],'from '+JSON.stringify(import.meta.resolve(m[2])));
const {obraVista,animarObras,detalleAmpliacion}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));let checks=0,maxTriangles=0,maxDrawCalls=0;
function geometry(g){let tris=0,calls=0;g.traverse(o=>{if(o.isMesh){calls++;tris+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));}assert.ok(o.position.toArray().every(Number.isFinite));assert.ok(o.quaternion.toArray().every(Number.isFinite));});assert.ok(tris<12000);assert.ok(calls<=22);maxTriangles=Math.max(maxTriangles,tris);maxDrawCalls=Math.max(maxDrawCalls,calls);}
for(const giro of [0,1,2,3])for(const activa of [false,true])for(const tipo of ['nueva','mejora'])for(const jornadas of tipo==='nueva'?[0,1,2]:[0,1]){
 const o={id:'obra_prueba',tipo,articulo:'refugio_gallina_templado',nivel:tipo==='nueva'?1:2,lugar:{x:14,z:-4,giro},jornadas},g=obraVista(o,activa);assert.deepEqual(g.userData.ganado,{tipo:'obra',id:o.id});geometry(g);const worker=g.getObjectByName('cuadrilla'),hammer=g.getObjectByName('martillo-cuadrilla');animarObras(g,.5,600);assert.equal(worker.visible,activa);const before=hammer.rotation.x;animarObras(g,.6,600);assert.notEqual(hammer.rotation.x,before);animarObras(g,.7,1200);assert.equal(worker.visible,false);assert.equal(hammer.rotation.x,0);checks++;
}
for(const nivel of [1,2,3]){const g=detalleAmpliacion(nivel);geometry(g);assert.equal(g.children.length===0,nivel===1);checks++;}
console.log(JSON.stringify({checks,failures:0,maxTriangles,maxDrawCalls}));
