// Audios cotidianos, separados del reparto y presupuesto de las voces de la trama.
// Requiere python3, edge-tts y ffmpeg. Reanuda por huella sin volver a sintetizar lo existente.
import { build } from 'esbuild';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const web=resolve(import.meta.dirname,'../..'), tmp=await mkdtemp(join(tmpdir(),'astra-audios-'));
try {
 await build({entryPoints:[join(web,'src/celular/casos/index.ts')],bundle:true,platform:'node',format:'esm',outfile:join(tmp,'casos.mjs'),logLevel:'silent'});
 const {CASOS}=await import(pathToFileURL(join(tmp,'casos.mjs')));
 await writeFile(join(tmp,'voces.json'),JSON.stringify(CASOS.flatMap(c=>c.voces.filter(v=>v.historial).map(v=>({...v,caso:c.n})))));
 const r=spawnSync('python3',[join(import.meta.dirname,'historial-audio.py'),join(tmp,'voces.json'),join(web,'public/audio/celular/historial')],{stdio:'inherit'});
 if(r.status!==0)throw Error('No se completaron los audios del historial');
} finally { await rm(tmp,{recursive:true,force:true}); }
