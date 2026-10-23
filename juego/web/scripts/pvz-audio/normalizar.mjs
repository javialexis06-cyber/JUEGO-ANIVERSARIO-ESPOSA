/** Prepara los MP3 generados para el juego sin tocar los originales: efectos sin silencio largo al inicio/final y
 * alrededor de −18 LUFS; música y ambientes (bucles) enteros y alrededor de −23 LUFS; pico verdadero ≤ −1,5 dBTP.
 * Lee produccion/pvz-audio/generados/ y escribe produccion/pvz-audio/listos/ (MP3 44,1 kHz 128 kb/s) más
 * informe.json con la medición de cada archivo. Después: validar.mjs --desde produccion/pvz-audio/listos --publicar
 */
import {readFile,writeFile,mkdir,readdir,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';

const web=resolve(import.meta.dirname,'../..'),dir=join(web,'produccion/pvz-audio');
const plan=JSON.parse(await readFile(join(dir,'plan.json'),'utf8')),origen=join(dir,'generados'),destino=join(dir,'listos');
await mkdir(destino,{recursive:true});
const porId=new Map(plan.assets.map(a=>[a.id,a]));
const informe=[];
for(const nombre of (await readdir(origen)).filter(n=>n.endsWith('.mp3')).sort()){
 const id=nombre.replace(/-\d\d\.mp3$/,''),a=porId.get(id);if(!a)continue;
 const de=join(origen,nombre),a2=join(destino,nombre);
 try{await access(a2);informe.push({nombre,omitido:'ya listo'});continue;}catch{/* falta: se prepara */}
 const objetivo=a.bucle?-23:-18;
 // Recortar silencio solo en efectos sueltos (los bucles tienen que empalmar enteros)
 const recorte=a.bucle?'':'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.04,';
 execFileSync('ffmpeg',['-v','error','-y','-i',de,'-af',`${recorte}loudnorm=I=${objetivo}:TP=-1.5:LRA=11,aresample=44100,alimiter=limit=0.63:level=false:attack=1:release=40`,'-ar','44100','-ac',a.tipo==='musica'||a.bucle?'2':'1','-c:a','libmp3lame','-b:a','128k',a2]);
 informe.push({nombre,objetivo});
}
// Medición final de todo lo listo (ffmpeg escribe ebur128 en stderr)
const final=[];
for(const nombre of (await readdir(destino)).filter(n=>n.endsWith('.mp3')).sort()){
 const f=join(destino,nombre),r=spawnSync('ffmpeg',['-hide_banner','-i',f,'-af','ebur128=peak=true','-f','null','-'],{encoding:'utf8'}).stderr;
 const lufs=Number(/I:\s+(-?[\d.]+) LUFS/.exec(r.slice(r.lastIndexOf('Summary')))?.[1]),pico=Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(r.slice(r.lastIndexOf('Summary')))?.[1]);
 const dur=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',f],{encoding:'utf8'}).trim());
 // Los golpes de menos de medio segundo no alcanzan a medir LUFS: cuenta su volumen máximo
 const v=spawnSync('ffmpeg',['-hide_banner','-i',f,'-af','volumedetect','-f','null','-'],{encoding:'utf8'}).stderr,maximo=Number(/max_volume: (-?[\d.]+) dB/.exec(v)?.[1]);
 final.push({nombre,segundos:Math.round(dur*100)/100,lufs,picoVerdadero:pico,maximoDb:maximo});
}
await writeFile(join(dir,'informe.json'),JSON.stringify({fecha:new Date().toISOString().slice(0,10),archivos:final},null,1)+'\n');
const malos=final.filter(x=>!(x.picoVerdadero<=-1)||!(x.maximoDb>-30));
console.log(JSON.stringify({listos:final.length,nuevos:informe.filter(x=>!x.omitido).length,fueraDeRango:malos.map(x=>x.nombre)},null,1));
