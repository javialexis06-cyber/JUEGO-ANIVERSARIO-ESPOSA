/** Verifica entregas sin claves ni red; --publicar copia solo los archivos revisados indicados. */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const web=resolve(import.meta.dirname,'../..'),produccion=join(web,'produccion/pvz-audio');
const plan=JSON.parse(await readFile(join(produccion,'plan.json'),'utf8')),args=process.argv.slice(2),valor=k=>args[args.indexOf(k)+1];
const ids=new Set();for(const a of plan.assets){
 if(ids.has(a.id)||!/^[a-z0-9-]+$/.test(a.id)||!['efecto','musica'].includes(a.tipo)||!Number.isInteger(a.variantes)||a.variantes<1||!a.prompt||a.duracion<.5||a.duracion>(a.tipo==='musica'?600:30))throw Error('Contrato de audio inválido: '+a.id);ids.add(a.id);
}
for(const [tipo,audio]of Object.entries({...plan.plantas,...plan.zombis}))if(!ids.has(audio))throw Error('Familia sin definir para '+tipo);
const entrega=JSON.parse(await readFile(join(produccion,'revisados.json'),'utf8').catch(()=>'{"version":1,"archivos":[]}'));
if(entrega.version!==1||!Array.isArray(entrega.archivos)||new Set(entrega.archivos).size!==entrega.archivos.length)throw Error('Lista de revisión inválida');
const origen=resolve(args.includes('--desde')?valor('--desde'):join(produccion,'generados')),destino=join(web,'public/jardin/pvz/audio');
const indice={version:1,efectos:{},musica:{}};
for(const a of plan.assets)for(let v=1;v<=a.variantes;v++){
 const nombre=`${a.id}-${String(v).padStart(2,'0')}.mp3`;if(!entrega.archivos.includes(nombre))continue;
 const fichero=join(origen,nombre),dato=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type','-of','json',fichero],{encoding:'utf8'}));
 const duracion=Number(dato.format.duration);if(!dato.streams.some(s=>s.codec_type==='audio')||!Number.isFinite(duracion)||duracion<.2||duracion>a.duracion+5)throw Error('Duración o formato inválido: '+nombre);
 execFileSync('ffmpeg',['-v','error','-i',fichero,'-f','null','-'],{stdio:'pipe'});
 const grupo=a.tipo==='musica'?indice.musica:indice.efectos;grupo[a.id]??={archivos:[],ganancia:a.ganancia,bucle:a.bucle};grupo[a.id].archivos.push(nombre);
 if(args.includes('--publicar')){await mkdir(destino,{recursive:true});await copyFile(fichero,join(destino,nombre));}
}
const aceptados=new Set(Object.values({...indice.efectos,...indice.musica}).flatMap(a=>a.archivos));
for(const nombre of entrega.archivos)if(!aceptados.has(nombre))throw Error('Nombre no admitido en el plan: '+nombre);
if(args.includes('--publicar'))await writeFile(join(destino,'indice.json'),JSON.stringify(indice,null,2)+'\n');
console.log(JSON.stringify({ok:true,familias:plan.assets.length,variantesPrevistas:plan.assets.reduce((n,a)=>n+a.variantes,0),archivosRevisados:aceptados.size,pendientes:plan.assets.reduce((n,a)=>n+a.variantes,0)-aceptados.size,publicado:args.includes('--publicar')},null,2));
