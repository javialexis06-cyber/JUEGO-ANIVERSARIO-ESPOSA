import {urlArtePvZ} from '../arte/catalogo';
interface Pista {archivos:string[];ganancia:number;bucle:boolean}
interface Indice {version:1;efectos:Record<string,Pista>;musica:Record<string,Pista>;recursos?:Record<string,string>}
const nombre=(s:unknown):s is string=>typeof s==='string'&&/^[a-z0-9-]+\.mp3$/.test(s);
/** Carga solo recursos publicados y limita voces/caché. Jamás conoce claves de producción. */
export class BancoAudioPvZ {
 private indice:Indice|null=null;private carga:Promise<void>|null=null;private cerrado=false;
 private buffers=new Map<string,AudioBuffer>();private pendientes=new Map<string,Promise<void>>();private voces=new Map<AudioBufferSourceNode,string>();private revision=0;
 private ultimas=new Map<string,number>();private variantes=new Map<string,number>();private habilitado=true;
 private musica:HTMLAudioElement|null=null;private ambiente:HTMLAudioElement|null=null;private temaCargado='';private ambienteCargado='';
 constructor(private contexto:()=>AudioContext|null){}
 preparar(){return this.carga??=this.leer();}
 private async leer(){try{
  const inline=document.getElementById('cq-audio-inline')?.textContent;
  if(document.body.dataset.portatil&&!inline)return;
  const dato=inline?JSON.parse(inline):await(await fetch(urlArtePvZ('audio/indice.json'))).json();
  if(this.cerrado||dato.version!==1||!dato.efectos||!dato.musica)return;
  for(const grupo of[dato.efectos,dato.musica])for(const[id,p]of Object.entries(grupo)as[string,Pista][]){
   if(!/^[a-z0-9-]+$/.test(id)||!p||!Array.isArray(p.archivos)||p.archivos.length>8||!p.archivos.every(nombre)||!Number.isFinite(p.ganancia)||p.ganancia<0||p.ganancia>1||typeof p.bucle!=='boolean')return;
  }
  this.indice=dato;
 }catch{/* Sigue disponible la síntesis local; un audio fallido no detiene la partida. */}}
 private url(archivo:string){return this.indice?.recursos?.[archivo]??urlArtePvZ('audio/'+archivo);}
 private cargar(archivo:string):Promise<void>{
  const anterior=this.pendientes.get(archivo);if(anterior)return anterior;
  const ctx=this.contexto();if(!ctx||this.buffers.has(archivo)||this.cerrado)return Promise.resolve();
  const tarea=(async()=>{try{const r=await fetch(this.url(archivo));if(!r.ok)return;const b=await ctx.decodeAudioData(await r.arrayBuffer());if(this.cerrado)return;
   // Un máximo de 32 efectos decodificados; música y ambiente usan streaming independiente.
   if(this.buffers.size>=32)this.buffers.delete(this.buffers.keys().next().value!);this.buffers.set(archivo,b);
  }catch{/* Fallback local sin errores de juego. */}finally{this.pendientes.delete(archivo);}})();this.pendientes.set(archivo,tarea);return tarea;
 }
 async anticipar(ids:readonly string[]){
  await this.preparar();if(this.cerrado)return;await Promise.all(ids.map(id=>{const p=this.indice?.efectos[id];return p?.archivos.length?this.cargar(p.archivos[0]):Promise.resolve();}));
 }
 tocar(id:string){
  const ctx=this.contexto(),p=this.indice?.efectos[id];if(!ctx||ctx.state!=='running'||!p?.archivos.length||!this.habilitado||this.cerrado)return false;
  const ahora=ctx.currentTime;if(ahora-(this.ultimas.get(id)??-100)<.08)return true;
  const i=this.variantes.get(id)??0,archivo=p.archivos[i%p.archivos.length];let buffer=this.buffers.get(archivo);
  if(!buffer){void this.cargar(archivo);buffer=p.archivos.map(a=>this.buffers.get(a)).find(Boolean);}
  if(!buffer)return false;if(this.voces.size>=16)return true;
  const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=p.ganancia*.3;
  source.connect(gain);gain.connect(ctx.destination);this.voces.set(source,id);this.ultimas.set(id,ahora);this.variantes.set(id,i+1);
  source.onended=()=>{this.voces.delete(source);source.disconnect();gain.disconnect();};source.start();return true;
 }
 async tema(id:string,ambiente=''){
  const revision=++this.revision;await this.preparar();if(this.cerrado||revision!==this.revision||!this.habilitado)return false;
  const p=this.indice?.musica[id],a=this.indice?.efectos[ambiente];
  if(this.temaCargado!==id){this.liberar(this.musica);this.musica=null;this.temaCargado=id;
   if(p?.archivos.length){this.musica=new Audio(this.url(p.archivos[0]));this.musica.loop=p.bucle;this.musica.volume=p.ganancia*.5;}}
  if(this.ambienteCargado!==ambiente){this.liberar(this.ambiente);this.ambiente=null;this.ambienteCargado=ambiente;
   if(a?.archivos.length){this.ambiente=new Audio(this.url(a.archivos[0]));this.ambiente.loop=a.bucle;this.ambiente.volume=a.ganancia*.2;}}
  if(this.ambiente?.paused)void this.ambiente.play().catch(()=>{});
  try{if(this.musica?.paused)await this.musica.play();return!!this.musica&&revision===this.revision;}catch{return false;}
 }
 silenciar(valor:boolean){this.habilitado=!valor;if(valor)this.pausar();}
 detenerFamilia(prefijo:string){for(const[v,id]of this.voces)if(id.startsWith(prefijo)){try{v.stop();}catch{/* Ya finalizó. */}this.voces.delete(v);}}
 pausarFondo(){this.revision++;this.musica?.pause();this.ambiente?.pause();}
 pausar(){this.pausarFondo();for(const v of this.voces.keys()){try{v.stop();}catch{/* Ya finalizó. */}}this.voces.clear();}
 private liberar(a:HTMLAudioElement|null){if(a){a.pause();a.removeAttribute('src');a.load();}}
 destruir(){this.cerrado=true;this.pausar();this.liberar(this.musica);this.liberar(this.ambiente);this.musica=this.ambiente=null;this.buffers.clear();}
}
