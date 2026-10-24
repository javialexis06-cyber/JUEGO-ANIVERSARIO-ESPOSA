/** Transporte preparado: una zona serializa órdenes; zonas distintas continúan en paralelo. */
import vm from'node:vm';import fs from'node:fs/promises';import ts from'typescript';import assert from'node:assert/strict';
const listeners=[],frames=[];
const sandbox={exports:{},URL,URLSearchParams,AbortController,crypto:{randomUUID:()=>crypto.randomUUID()},location:{origin:'https://juego.test'},setTimeout,clearTimeout,window:{addEventListener:(t,fn)=>listeners.push(fn)},document:{baseURI:'https://juego.test/',createElement:()=>{const f={style:{},setAttribute(){},remove(){},contentWindow:{postMessage:p=>f.enviados.push(p)},enviados:[]};frames.push(f);return f;}}};
const source=await fs.readFile(new URL('../src/jardin/motores/frente-gardendless.ts',import.meta.url),'utf8');vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,sandbox);
const{FrenteGardendless}=sandbox.exports,a=new FrenteGardendless({append(){}},'8','pareja'),b=new FrenteGardendless({append(){}},'9','pareja');
const responder=(m,p)=>listeners.forEach(fn=>fn({origin:sandbox.location.origin,source:m.frame.contentWindow,data:{canal:'semilla-frente-v1',zona:m.zona,sesion:m.sesion,...p}}));
try{
 responder(a,{evento:'listo',capacidades:{}});responder(b,{evento:'listo',capacidades:{}});
 const preparar=a.prepararHistoria({}),dibujar=a.pasoHistoria(0,true),otra=b.prepararHistoria({});await new Promise(setImmediate);
 assert.equal(a.frame.enviados.length,1);assert.equal(b.frame.enviados.length,1);assert.equal(a.frame.enviados[0].orden,'preparar-historia');
 responder(a,{solicitud:a.frame.enviados[0].solicitud,ok:true,valor:{fase:'preparando'}});await preparar;await new Promise(setImmediate);
 assert.equal(a.frame.enviados[1].orden,'paso-historia');assert.equal(b.frame.enviados.length,1);responder(a,{solicitud:a.frame.enviados[1].solicitud,ok:true,valor:{fase:'preparando'}});await dibujar;
 responder(b,{solicitud:b.frame.enviados[0].solicitud,ok:true,valor:{fase:'preparando'}});await otra;console.log('OK Dibujar espera la preparación de su zona mientras otro campo sigue cargando en paralelo');
 const rechazo=a.iniciarHistoria({}).catch(e=>e.message),siguiente=a.observar();await new Promise(setImmediate);responder(a,{solicitud:a.frame.enviados[2].solicitud,ok:false,error:'equipo inválido'});assert.equal(await rechazo,'equipo inválido');await new Promise(setImmediate);assert.equal(a.frame.enviados[3].orden,'observar');responder(a,{solicitud:a.frame.enviados[3].solicitud,ok:true,valor:{fase:'preparando'}});await siguiente;console.log('OK Una orden rechazada no bloquea las siguientes operaciones del campo');
}finally{a.destruir();b.destruir();}
