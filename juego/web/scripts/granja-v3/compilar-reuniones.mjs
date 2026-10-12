import fs from 'node:fs';
import crypto from 'node:crypto';
const fuente=new URL('../../../../docs/narrativa/jugabilidad/reuniones.json',import.meta.url);
const defs=JSON.parse(fs.readFileSync(fuente,'utf8'));
const ids=new Set();
for(const d of defs){
 if(ids.has(d.id)||d.actores.length!==2||new Set(d.actores).size!==2||d.opciones.length!==2||d.lineas.length<2)throw Error('Reunión inválida: '+d.id);
 ids.add(d.id);
 for(const l of d.lineas)if(crypto.createHash('sha256').update(l.texto).digest('hex')!==l.huella||l.huella_texto!==l.huella.slice(0,16))throw Error('Firma de texto inválida: '+l.id);
}
fs.writeFileSync(new URL('../../src/granja-v3/reuniones-datos.ts',import.meta.url),"// Generado por compilar-reuniones.mjs; editar la fuente narrativa.\nimport type {ReunionDef} from './reuniones-tipos';\nexport const REUNIONES:readonly ReunionDef[] = "+JSON.stringify(defs)+';\n');
const p=new URL('../../public/granja/astra/produccion.json',import.meta.url),datos=JSON.parse(fs.readFileSync(p,'utf8'));
datos.reuniones={version:1,escenas:defs,reglas:{cola:'Únicas por ID; llega al dormir. Pendientes antes de aplazadas, luego prioridad y antigüedad.',presencia:'Dos vecinos adultos de su localidad, de 14 a 16 h, sin mal tiempo, descanso ni comisión de historia.',recompensa:'Una cuerda por materiales reales, o escucha sin pago; +5 amistad por vecino una sola vez.',voces:'312 líneas nuevas con ID y SHA-256, todavía sin audio. Música y actores regionales existentes.'}};
fs.writeFileSync(p,JSON.stringify(datos,null,2)+'\n');
console.log(JSON.stringify({escenas:defs.length,pueblos:new Set(defs.map(d=>d.region)).size,lineas:defs.reduce((n,d)=>n+d.lineas.length,0)}));
