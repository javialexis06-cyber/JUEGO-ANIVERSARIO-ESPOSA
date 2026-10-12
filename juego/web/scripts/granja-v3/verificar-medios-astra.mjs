import {compilarModulo as moduloRegional} from './modulos-prueba.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilarModulo } from './modulos-prueba.mjs';
const publico=fileURLToPath(new URL('../../public/',import.meta.url));
const produccion=JSON.parse(await fs.readFile(path.join(publico,'granja/astra/produccion.json'),'utf8'));
const medios=JSON.parse(await fs.readFile(path.join(publico,'granja/astra/medios.json'),'utf8'));
const {validarMedios}=await import(await compilarModulo(new URL('../../src/granja-v3/astra-medios.ts',import.meta.url)));
const P=await import(await compilarModulo(new URL('../../src/granja-v3/premios-datos.ts',import.meta.url)));
const R=await import(await moduloRegional(new URL('../../src/granja-v3/regiones-datos.ts',import.meta.url))),J=await import(await moduloRegional(new URL('../../src/granja-v3/jefes.ts',import.meta.url)));
const errores=[];
if(!validarMedios(medios))errores.push('Manifiesto de medios incompatible.');
else {
 const lineas=new Map([...produccion.lineas,...(produccion.reuniones?.escenas??[]).flatMap(d=>d.lineas)].map(l=>[l.id,l]));
 for(const [id,v] of Object.entries(medios.voces))if(lineas.get(id)?.huella_texto!==v.huella_texto)errores.push('Toma desconocida o texto cambiado: '+id);
 const modelos=new Set([...R.TERRITORIOS_REGIONALES.map(r=>'fauna:'+r.fauna.id),...R.TERRITORIOS_REGIONALES.filter(r=>r.fauna.colonia).map(r=>'habitat:'+r.id),...Object.keys(J.JEFES).map(id=>'jefe:'+id),...P.PREMIOS_NARRATIVOS.map(p=>'premio:'+p.id),...produccion.npc.map(n=>'npc:'+n.id),...produccion.regiones.map(r=>'region:'+r.id),...produccion.regiones.flatMap(r=>r.viviendas.map(h=>'vivienda:'+h.id)),...produccion.figuras.map(f=>'figura:'+f.id),...produccion.recursos.flatMap(r=>r.recursos.map(d=>'recurso:'+d.id))]);
 for(const id of Object.keys(medios.modelos))if(!modelos.has(id))errores.push('Modelo sin anclaje: '+id);
 for(const id of Object.keys(medios.musica))if(!produccion.musica.some(m=>m.id===id))errores.push('Pista musical desconocida: '+id);
 const archivos=[...Object.values(medios.voces).map(v=>v.archivo),...Object.values(medios.musica),...Object.values(medios.modelos).map(v=>v.archivo)];
 for(const a of new Set(archivos))try{const b=await fs.readFile(path.join(publico,a.slice(2)));if(!b.length)errores.push('Archivo vacío: '+a);if(a.endsWith('.glb')&&b.subarray(0,4).toString()!=='glTF')errores.push('GLB incompatible: '+a);}catch{errores.push('Archivo declarado sin producir: '+a);}
}
console.log(JSON.stringify({lineas:produccion.lineas.length,lineasReuniones:(produccion.reuniones?.escenas??[]).reduce((n,d)=>n+d.lineas.length,0),vocesDeclaradas:Object.keys(medios.voces??{}).length,modelosDeclarados:Object.keys(medios.modelos??{}).length,musicaDeclarada:Object.keys(medios.musica??{}).length,errores,estado:'Ausencia de medios opcionales permitida; una referencia declarada debe existir y coincidir.'}));
if(errores.length)process.exitCode=1;
