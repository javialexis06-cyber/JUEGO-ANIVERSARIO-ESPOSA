/** Producción fuera del navegador. Sin --generar imprime el trabajo y no accede a la red. */
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';

const web=resolve(import.meta.dirname,'../..'),dir=join(web,'produccion/pvz-audio');
const plan=JSON.parse(await readFile(join(dir,'plan.json'),'utf8')),args=process.argv.slice(2);
const valor=k=>args[args.indexOf(k)+1],elegidas=args.includes('--id')?plan.assets.filter(a=>a.id===valor('--id')):plan.assets;
if(!elegidas.length)throw Error('ID de audio desconocido');
const tareas=elegidas.flatMap(a=>Array.from({length:a.variantes},(_,i)=>({asset:a,variante:i+1})))
 .filter(t=>!args.includes('--variante')||String(t.variante)===valor('--variante'))
 .sort((a,b)=>a.variante-b.variante||a.asset.prioridad-b.asset.prioridad);
if(!tareas.length)throw Error('Variante desconocida');
if(!args.includes('--generar')){
 console.log(JSON.stringify({modo:'plan-sin-red',tareas:tareas.map(t=>({id:t.asset.id,variante:t.variante,segundos:t.asset.duracion,modelo:plan.modelos[t.asset.tipo]}))},null,2));
 process.exit(0);
}
const clave=process.env.ELEVENLABS_API_KEY;
if(!clave)throw Error('Configura ELEVENLABS_API_KEY en secretos del entorno; nunca en VITE ni en Git');
const headers={'xi-api-key':clave,'Content-Type':'application/json'},destino=join(dir,'generados');await mkdir(destino,{recursive:true});
const existe=async p=>{try{await access(p);return true;}catch{return false;}};
let consumido=0;
for(const {asset:a,variante}of tareas){
 const nombre=`${a.id}-${String(variante).padStart(2,'0')}`,archivo=join(destino,nombre+'.mp3'),pendiente=join(destino,nombre+'.pendiente.json');
 if(await existe(archivo)){console.log('EXISTENTE',nombre);continue;}
 if(await existe(pendiente))throw Error('Generación incierta: '+nombre+'. Revisar historial de ElevenLabs antes de repetir; conservar el marcador.');
 const consulta=await fetch('https://api.elevenlabs.io/v1/user/subscription',{headers,signal:AbortSignal.timeout(30000)});
 if(!consulta.ok)throw Error('No se pudo consultar el saldo: HTTP '+consulta.status);
 const cuota=await consulta.json(),restante=cuota.character_limit-cuota.character_count;
 if(!Number.isSafeInteger(restante)||restante<0)throw Error('Saldo no verificable; se detiene la producción');
 // Estimación conservadora frente a la tarifa publicada; no habilita saldo extra ni compras.
 const techo=a.tipo==='musica'?Math.ceil(a.duracion/60*1200):300;
 if(restante<techo){console.log('SALDO INSUFICIENTE para la siguiente generación',{restante,techo,id:a.id});break;}
 const ruta=a.tipo==='musica'?'music':'sound-generation';
 const prompt=a.prompt+(a.variantes>1?` Performance variation ${variante}: keep the same acoustic identity, slightly vary the natural timing and timbre.`:'');
 const body=a.tipo==='musica'?{prompt,model_id:plan.modelos.musica,music_length_ms:a.duracion*1000,force_instrumental:true}:{text:prompt,model_id:plan.modelos.efecto,duration_seconds:a.duracion,loop:a.bucle,prompt_influence:.55};
 const registro={id:a.id,variante,modelo:body.model_id,fecha:new Date().toISOString(),promptSha256:createHash('sha256').update(prompt).digest('hex')};
 await writeFile(pendiente,JSON.stringify(registro,null,2),{flag:'wx'});
 const r=await fetch(`https://api.elevenlabs.io/v1/${ruta}?output_format=mp3_44100_128`,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(240000)});
 if(!r.ok)throw Error('Generación detenida: HTTP '+r.status+' para '+nombre+'. Revisar saldo/historial antes de reintentar.');
 if(!(r.headers.get('content-type')??'').startsWith('audio/'))throw Error('Respuesta sin audio para '+nombre+'; conservar marcador y revisar historial.');
 const bytes=new Uint8Array(await r.arrayBuffer());if(bytes.length<1000)throw Error('Audio vacío o incompleto para '+nombre);
 await writeFile(archivo,bytes,{flag:'wx'});const coste=Number(r.headers.get('character-cost'));
 registro.creditos=Number.isFinite(coste)&&coste>0?coste:null;consumido+=registro.creditos??0;
 await writeFile(join(destino,nombre+'.json'),JSON.stringify(registro,null,2));
 console.log('GENERADO pendiente de escucha',{nombre,bytes:bytes.length,creditos:registro.creditos,consumido});
 // El MP3 existente evita repetir el cargo; el marcador queda como constancia de la petición.
}
console.log('Revisar escucha y licencia del plan antes de publicar. No se ha modificado el índice del juego.');
