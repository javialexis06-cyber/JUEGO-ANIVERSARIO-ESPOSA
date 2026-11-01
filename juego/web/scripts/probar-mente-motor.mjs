import assert from 'node:assert/strict';import {build} from 'esbuild';import{mkdtemp,rm,readFile}from'node:fs/promises';import{tmpdir}from'node:os';import{join,resolve}from'node:path';import{pathToFileURL}from'node:url';import{siguientes,resolverLuces}from'./mente-piloto.mjs';
const tmp=await mkdtemp(join(tmpdir(),'patio-mente-'));
try{const f=join(tmp,'motor.mjs');await build({stdin:{contents:"export * from './src/mente/motor';export * from './src/mente/catalogo';",resolveDir:resolve(import.meta.dirname,'..')},bundle:true,platform:'node',format:'esm',outfile:f,logLevel:'silent'});const {MotorMental,JUEGOS,TANGRAM,COLORES,retoDiario,fechaBogota,DIBUJOS,pistasNonograma}=await import(pathToFileURL(f));
 assert.equal(fechaBogota(new Date('2026-10-17T04:59:59Z')),'2026-10-16');assert.equal(fechaBogota(new Date('2026-10-17T05:00:00Z')),'2026-10-17');
 const dias=Array.from({length:16},(_,i)=>new Date(Date.UTC(2026,9,1+i)).toISOString().slice(0,10));assert.equal(new Set(dias.map(d=>retoDiario(d).juego.id)).size,16);assert.deepEqual(retoDiario(dias[0]),retoDiario(dias[0]));
 // El reto del día es el juego que espera el servidor (patio_publicar) durante 64 días seguidos; los juegos nuevos son de práctica.
 const sqlPatio=await readFile(resolve(import.meta.dirname,'../../../supabase/patio-clasificacion.sql'),'utf8'),esperados=[...sqlPatio.match(/esperado := \(array\[([^\]]+)\]/)[1].matchAll(/'([a-z]+)'/g)].map(x=>x[1]);assert.equal(esperados.length,16);
 for(let i=0;i<64;i++){const d=new Date(Date.UTC(2026,10,1+i)),fecha=d.toISOString().slice(0,10);assert.equal(retoDiario(fecha).juego.id,esperados[Math.floor(d.getTime()/86400000)%16],fecha);}
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
 console.log('OK rotación de 16 días igual a la del servidor, medianoche de Colombia, acciones ilegales, memoria oculta y turnos agotados');
 // Juegos nuevos (1 de noviembre de 2026): reglas en muchas semillas.
 for(let seed=1;seed<=200;seed++){
  const l=new MotorMental('luces',seed);assert.ok(l.tablero.filter(Boolean).length>=3,'faroles encendidos al empezar');for(const i of resolverLuces(l.tablero,l.taman))l.accion({tipo:'celda',valor:i});assert.equal(l.ronda,1,'el primer tablero se apaga');assert.equal(l.taman,5);assert.ok(resolverLuces(l.tablero,5).length>0);
  const se=new MotorMental('series',seed);for(let r=0;r<8;r++){assert.equal(new Set(se.opciones).size,4);assert.ok(se.opciones.includes(String(se.cursor)));assert.ok(se.opciones.every(o=>+o>=0));se.accion({tipo:'opcion',valor:String(se.cursor)});}assert.equal(se.fase,'fin');
  const ma=new MotorMental('matriz',seed);for(let r=0;r<6;r++){assert.equal(new Set(ma.opciones).size,4);assert.ok(ma.opciones.includes(String(ma.cursor)));const t=ma.tablero,forma=Math.floor(t[6]/9),color=Math.floor(t[2]/3)%3;assert.equal(Math.floor(ma.cursor/9),forma,'la forma sigue la fila');assert.equal(Math.floor(ma.cursor/3)%3,color,'el color sigue la columna');const fila=[t[6]%3,t[7]%3],col=[t[2]%3,t[5]%3],q=ma.cursor%3;assert.ok(fila[0]===fila[1]?q===fila[0]:![...fila].includes(q)&&!col.includes(q),'la cantidad completa la fila y la columna');ma.accion({tipo:'opcion',valor:String(ma.cursor)});}
 }
 const c=new MotorMental('codigo',5);c.solucion=[0,1,2,3];for(const [i,v] of [0,2,1,5].entries()){c.accion({tipo:'celda',valor:i});c.accion({tipo:'opcion',valor:v});}c.accion({tipo:'confirmar'});assert.deepEqual(c.otro,[1,2],'una en su sitio y dos de buen color');
 const c2=new MotorMental('codigo',6);c2.solucion=[1,1,2,2];for(const [i,v] of [1,2,1,1].entries()){c2.accion({tipo:'celda',valor:i});c2.accion({tipo:'opcion',valor:v});}c2.accion({tipo:'confirmar'});assert.deepEqual(c2.otro,[1,2],'los colores repetidos no cuentan doble');
 const c3=new MotorMental('codigo',7);c3.solucion=[5,5,5,5];c3.accion({tipo:'confirmar'});assert.equal(c3.torres.length,0,'un intento incompleto no se cuenta');for(let k=0;k<8;k++){for(let i=0;i<4;i++){c3.accion({tipo:'celda',valor:i});c3.accion({tipo:'opcion',valor:0});}c3.accion({tipo:'confirmar'});}assert.equal(c3.fase,'fin');assert.equal(c3.completo,false);assert.equal(c3.puntos,0);
 const sc=new MotorMental('schulte',8);sc.accion({tipo:'celda',valor:sc.tablero.indexOf(2)});assert.equal(sc.errores,1);sc.accion({tipo:'celda',valor:sc.tablero.indexOf(1)});sc.accion({tipo:'celda',valor:sc.tablero.indexOf(1)});assert.equal(sc.errores,1,'tocar uno ya encontrado no es error');assert.equal(sc.cursor,2);
 for(const d of DIBUJOS){assert.equal(d.filas.length,5);assert.ok(d.filas.every(f=>f.length===5));}
 const no=new MotorMental('nonograma',9);no.accion({tipo:'girar'});const vacia=no.solucion.indexOf(0);no.accion({tipo:'celda',valor:vacia});assert.equal(no.tablero[vacia],2,'marcar con ✕');no.accion({tipo:'girar'});for(const [i,v] of no.solucion.entries())if(v)no.accion({tipo:'celda',valor:i});assert.equal(no.fase,'fin','las ✕ no cuentan como pintadas');
 assert.deepEqual(pistasNonograma([1,1,0,1,0, 0,0,0,0,0, 1,1,1,1,1, 0,1,0,1,0, 1,0,0,0,1],5).filas,[[2,1],[0],[5],[1,1],[1,1]]);
 console.log('OK faroles siempre resolubles, series y piezas con una sola respuesta, candado con pistas correctas, tabla en orden y dibujo por pistas');
}finally{await rm(tmp,{recursive:true,force:true});}
