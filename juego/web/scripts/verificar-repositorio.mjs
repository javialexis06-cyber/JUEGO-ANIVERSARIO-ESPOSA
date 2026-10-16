// Higiene del repositorio: enlaces locales, JSON y exclusión de temporales; no modifica archivos.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {existsSync,readFileSync} from 'node:fs';
import {dirname,extname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const raiz=fileURLToPath(new URL('../../../',import.meta.url));
const {stdout}=await promisify(execFile)('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:raiz,encoding:'utf8',maxBuffer:8*1024*1024});
const archivos=[...new Set(stdout.split('\0').filter(Boolean))];
const problemas=[];let documentos=0,json=0,enlaces=0;
for(const archivo of archivos){
 const ruta=resolve(raiz,archivo);if(!existsSync(ruta))continue;
 if(/(?:^|\/)(?:node_modules|dist|dist-amigos|test-results|__pycache__)\//.test(archivo)||/\.(?:pyc|blend1|tmp|bak|log)$/.test(archivo))problemas.push(`${archivo}: generado o temporal sin excluir`);
 if(extname(archivo)==='.json'){
  try{JSON.parse(readFileSync(ruta,'utf8'));json++;}catch{problemas.push(`${archivo}: JSON inválido`);}
 }
 if(extname(archivo)!=='.md')continue;
 documentos++;
 // Los ejemplos de código pueden describir archivos hipotéticos: no son enlaces navegables.
 let cerca=false;const texto=readFileSync(ruta,'utf8').split('\n').filter(l=>{if(/^\s*(?:```|~~~)/.test(l)){cerca=!cerca;return false;}return !cerca;}).join('\n');
 for(const m of texto.matchAll(/!?\[[^\]]*\]\((<[^>]+>|[^\s)]+)(?:\s+["'][^)]*)?\)/g)){
  let destino=m[1].replace(/^<|>$/g,'').split('#')[0].split('?')[0];
  if(!destino||/^[a-z][a-z\d+.-]*:/i.test(destino)||destino.startsWith('/')||destino.includes('${'))continue;
  try{destino=decodeURIComponent(destino);}catch{problemas.push(`${archivo}: enlace mal codificado`);continue;}
  enlaces++;if(!existsSync(resolve(dirname(ruta),destino)))problemas.push(`${archivo}: enlace inexistente ${destino}`);
 }
}
console.log(`${documentos} documentos, ${json} JSON y ${enlaces} enlaces locales revisados`);
if(problemas.length){console.error(problemas.join('\n'));process.exitCode=1;}else console.log('OK sin enlaces rotos, JSON inválidos ni temporales registrados');
