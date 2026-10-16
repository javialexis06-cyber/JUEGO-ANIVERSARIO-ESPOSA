import assert from 'node:assert/strict';import {build} from 'esbuild';import{mkdtemp,rm}from'node:fs/promises';import{tmpdir}from'node:os';import{join,resolve}from'node:path';import{pathToFileURL}from'node:url';import{siguientes}from'./mente-piloto.mjs';
const tmp=await mkdtemp(join(tmpdir(),'patio-mente-'));
try{const f=join(tmp,'motor.mjs');await build({stdin:{contents:"export * from './src/mente/motor';export * from './src/mente/catalogo';",resolveDir:resolve(import.meta.dirname,'..')},bundle:true,platform:'node',format:'esm',outfile:f,logLevel:'silent'});const {MotorMental,JUEGOS,TANGRAM,COLORES,retoDiario,fechaBogota}=await import(pathToFileURL(f));
 assert.equal(fechaBogota(new Date('2026-10-17T04:59:59Z')),'2026-10-16');assert.equal(fechaBogota(new Date('2026-10-17T05:00:00Z')),'2026-10-17');
 const dias=Array.from({length:16},(_,i)=>new Date(Date.UTC(2026,9,1+i)).toISOString().slice(0,10));assert.equal(new Set(dias.map(d=>retoDiario(d).juego.id)).size,16);assert.deepEqual(retoDiario(dias[0]),retoDiario(dias[0]));
 for(const j of JUEGOS){for(const seed of [1,2026,98765]){
  const m=new MotorMental(j.id,seed),igual=new MotorMental(j.id,seed);assert.deepEqual(m.exportar(),igual.exportar());let vueltas=0;
  while(m.fase!=='fin'&&vueltas++<100){while(m.fase==='observar'||m.id==='parejas'&&m.espera>0)m.paso(.25);
   const copia=MotorMental.restaurar(m.exportar());assert.ok(copia);assert.deepEqual(copia.exportar(),m.exportar());
   for(const a of siguientes(m,TANGRAM,COLORES)){m.accion(a);if(m.fase!=='jugar')break;}
   m.paso(.1);
  }
  assert.equal(m.fase,'fin',j.id+' debe terminar');assert.equal(m.completo,true);assert.equal(m.errores,0,j.id+' solución legal sin errores');assert.equal(m.puntos,10000);
  const fin=m.exportar();m.accion({tipo:'confirmar'});m.paso(.25);assert.deepEqual(m.exportar(),fin,'El resultado no cambia después del final');
 }console.log('OK',j.id,'tres semillas, solución completa, reanudación y final estable');}
 const h=new MotorMental('hanoi',1);h.accion({tipo:'celda',valor:0});h.accion({tipo:'celda',valor:2});h.accion({tipo:'celda',valor:0});h.accion({tipo:'celda',valor:2});assert.equal(h.errores,1);assert.deepEqual(h.torres,[[4,3,2],[],[1]]);
 const s=new MotorMental('sudoku',2);const fija=s.fijos[0],antes=s.tablero[fija];s.accion({tipo:'celda',valor:fija});s.accion({tipo:'opcion',valor:'4'});assert.equal(s.tablero[fija],antes);
 const b=new MotorMental('simon',3);const antesSimon=b.exportar();b.accion({tipo:'celda',valor:0});assert.deepEqual(b.exportar(),antesSimon,'No responder durante la presentación');
 const n=new MotorMental('nback',3);while(n.fase!=='fin')n.paso(.25);assert.equal(n.completo,true);assert.equal(n.aciertos,0);assert.equal(n.errores,22);
 console.log('OK rotación de 16 días, medianoche de Colombia, acciones ilegales, memoria oculta y turnos agotados');
}finally{await rm(tmp,{recursive:true,force:true});}
