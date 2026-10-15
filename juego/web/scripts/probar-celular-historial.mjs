import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const web=resolve(import.meta.dirname,'..'),tmp=await mkdtemp(join(tmpdir(),'astra-historial-'));
try {
 const archivo=join(tmp,'casos.mjs');
 await build({entryPoints:[join(web,'src/celular/casos/index.ts')],bundle:true,platform:'node',format:'esm',outfile:archivo,logLevel:'silent'});
 const {CASOS}=await import(pathToFileURL(archivo));
 const originales=JSON.parse(await readFile(join(web,'public/audio/celular/voces.json'),'utf8')).voces;
 const nuevos=JSON.parse(await readFile(join(web,'public/audio/celular/historial/voces.json'),'utf8')).voces;
 let total=0;
 for(const c of CASOS) {
  const mensajes=c.chats.flatMap(ch=>ch.mensajes),contactos=new Set(c.contactos.map(x=>x.id));
  assert.ok(mensajes.length>=650);
  assert.ok(c.chats.length>=9);
  assert.equal(c.tutorial,false);
  assert.equal(c.bloqueo.recordatorio,'');
  assert.ok(c.candados.every(k=>!k.recordatorio));
  assert.ok(c.chats.some(ch=>ch.archivado));
  assert.equal(c.voces.filter(v=>v.historial).length,12);
  const anos=new Set(mensajes.map(m=>m.dia?.match(/AV (\d+)/)?.[1]).filter(Boolean));
  assert.equal(anos.size,3);
  for(const ch of c.chats) {
   assert.ok(contactos.has(ch.con));
   for(const m of ch.mensajes) {
    assert.ok(m.de==='yo'||contactos.has(m.de));
    assert.match(m.t,/^(?:[01]\d|2[0-3]):[0-5]\d$/);
    assert.ok(!/\{(?:objeto|lugar|comida|persona)\}/.test(m.texto??''));
    if(m.voz)assert.ok(c.voces.some(v=>v.id===m.voz));
   }
  }
  assert.equal(new Set(c.voces.map(v=>v.id)).size,c.voces.length);
  for(const v of c.voces) {
   const registro=(v.historial?nuevos:originales)[v.id];assert.ok(registro,v.id);
   const f=join(web,'public',registro.archivo);await access(f);
   assert.ok(registro.seg>0);
   if(v.historial && process.env.PROBAR_AUDIO==='1') {
    const dur=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',f]));
    assert.ok(Math.abs(dur-registro.seg)<.02);
   }
  }
  total+=mensajes.length;
  console.log(`OK ${c.id}: ${mensajes.length} mensajes, ${c.chats.length} chats, 3 años anteriores y 12 audios nuevos verificables`);
 }
 console.log(`OK ${total} mensajes en ocho teléfonos; 96 audios nuevos sin referencias rotas`);
} finally {await rm(tmp,{recursive:true,force:true});}
