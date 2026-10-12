// Un grafo ESM compartido por suite evita repetir catálogos grandes dentro de URI base64 anidadas.
import { build } from 'esbuild';
import { readdir, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const fuente=fileURLToPath(new URL('../../src/granja-v3/',import.meta.url));
let listo;
export async function compilarModulo(url){
 if(!listo)listo=(async()=>{
  const dir=await mkdtemp(join(tmpdir(),'granja-regresion-'));
  process.once('beforeExit',()=>rm(dir,{recursive:true,force:true}));
  await symlink(join(fuente,'../../node_modules'),join(dir,'node_modules'),'dir');
  const archivos=(await readdir(fuente)).filter(n=>n.endsWith('.ts')&&n!=='main.ts');
  await build({entryPoints:archivos.map(n=>join(fuente,n)),outdir:dir,bundle:true,splitting:true,packages:'external',format:'esm',platform:'node',target:'es2022',outExtension:{'.js':'.mjs'},logLevel:'silent'});
  return dir;
 })();
 const dir=await listo,name=fileURLToPath(url).split('/').at(-1).replace(/\.ts$/,'.mjs');return pathToFileURL(join(dir,name)).href;
}
