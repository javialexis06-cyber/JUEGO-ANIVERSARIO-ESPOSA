import fs from 'node:fs';
import {compilarModulo} from './modulos-prueba.mjs';
const fuente=new URL('../../../../docs/narrativa/jugabilidad/pesca-sedal.json',import.meta.url),perfiles=JSON.parse(fs.readFileSync(fuente,'utf8'));
fs.writeFileSync(new URL('../../src/granja-v3/pesca-datos.ts',import.meta.url),"// Generado por compilar-pesca.mjs; editar pesca-sedal.json.\nimport type {PerfilSedal} from './pesca-tipos';\nexport const PERFILES_SEDAL:readonly PerfilSedal[]="+JSON.stringify(perfiles)+';\n');
const C=await import(await compilarModulo(new URL('../../src/granja-v3/catalogo.ts',import.meta.url)));
if(new Set(perfiles.map(p=>p.pez)).size!==C.PECES.length||perfiles.length!==C.PECES.length||perfiles.some(p=>!C.PECES.some(q=>q.id===p.pez)))throw Error('Los perfiles no coinciden con las especies del catálogo.');
const produccion=new URL('../../public/granja/astra/produccion.json',import.meta.url),datos=JSON.parse(fs.readFileSync(produccion,'utf8'));
datos.pesca_sedal={version:1,perfiles:perfiles.map(p=>({...p,especie:C.PECES.find(q=>q.id===p.pez)})),reglas:{fases:['espera','picada','tiron','lista','escapo'],coste:'Un cebo y energía de caña al lanzar; cancelar no los devuelve.',captura:'Ejemplar y semilla reservados. Seguir al pez controla progreso y tensión; se cobra una vez.',calendario:'Pausado durante el lanzamiento; cuidados reales continúan. No hay progreso fuera de pantalla.',controles:'Mantener y soltar el botón o Espacio; enganchar en la picada, guardar al llegar a la orilla.',medios:'Controles simples, sonidos y escenarios existentes; no hay recursos de arte nuevos.'}};
fs.writeFileSync(produccion,JSON.stringify(datos,null,2)+'\n');console.log(JSON.stringify({especies:perfiles.length,movimientos:new Set(perfiles.map(p=>p.movimiento)).size}));
