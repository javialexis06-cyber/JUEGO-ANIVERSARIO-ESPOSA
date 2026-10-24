/** Puente nativo: tutorial aislado y primer sector de historia con puntos entre combates. */
import type {ConfigDefensaNativa,PuntoDescansoNativo} from './nivel-historia';
export interface ObservacionGardendless {
 version:1; zona:string; nivel:'tutorial1'|'historia'|null;
 fase:'preparando'|'combatiendo'|'victoria'|'derrota'|'cerrado';
 segundos:number; oleada:number; soles:number; plantas:number; zombis:number; pausada:boolean;
}
export interface CapacidadesGardendless {
 nivel:'tutorial1'|'historia'; instantaneas:false; carrilesVariables:false; pasoExterno:boolean; perfilTemporal:true;puntosDescanso?:boolean;
}
type Pendiente={ok:(v:any)=>void;mal:(e:Error)=>void;reloj:ReturnType<typeof setTimeout>};

export class FrenteGardendless {
 readonly frame:HTMLIFrameElement;
 readonly listo:Promise<CapacidadesGardendless>;
 readonly sesion=crypto.randomUUID();
 private pendientes=new Map<number,Pendiente>();
 private eventos=new AbortController();
 private contador=0;
 private destruido=false;
 private preparado=false;
 private error:Error|null=null;
 private recibirListo!:(v:CapacidadesGardendless)=>void;
 private fallarListo!:(e:Error)=>void;
 private reloj:ReturnType<typeof setTimeout>;
 constructor(contenedor:HTMLElement,readonly zona:string,perfil:'pareja'|'amigos',alResultado?:(v:ObservacionGardendless)=>void,opciones:{historia?:boolean}={}) {
  if(!/^[a-z0-9_-]{1,64}$/.test(zona))throw new Error('Identificador de zona inválido.');
  this.frame=document.createElement('iframe');this.frame.title=`Frente ${zona} · Gardendless`;
  this.frame.allow='autoplay; fullscreen';this.frame.setAttribute('sandbox','allow-scripts allow-same-origin');
  Object.assign(this.frame.style,{width:'100%',height:'100%',border:'0'});
  this.listo=new Promise((ok,mal)=>{this.recibirListo=ok;this.fallarListo=mal;});
  void this.listo.catch(()=>{}); // Permite cancelar una carga antes de que el coordinador llegue a esperarla.
  this.reloj=setTimeout(()=>this.fallar(new Error('No se pudo preparar el frente. Revisa la conexión.')),150000);
  window.addEventListener('message',e=>{
   const p=e.data;
   if(this.destruido||e.origin!==location.origin||e.source!==this.frame.contentWindow||p?.canal!=='semilla-frente-v1'||p.sesion!==this.sesion||p.zona!==this.zona)return;
   if(p.evento==='listo'){this.preparado=true;clearTimeout(this.reloj);this.recibirListo(p.capacidades);}
   else if(p.evento==='error')this.fallar(new Error(String(p.error)));
   else if(p.evento==='resultado')alResultado?.(p.estado);
   else if(Number.isSafeInteger(p.solicitud)){
    const pendiente=this.pendientes.get(p.solicitud);if(!pendiente)return;
    clearTimeout(pendiente.reloj);this.pendientes.delete(p.solicitud);
    p.ok?pendiente.ok(p.valor):pendiente.mal(new Error(String(p.error)));
   }
  },{signal:this.eventos.signal});
  const u=new URL('jardin/motores/pvz2/index.html',document.baseURI);
  u.search=new URLSearchParams({perfil,frente:zona,sesion:this.sesion}).toString();
  if(opciones.historia)u.searchParams.set('historia','1');
  this.frame.src=u.href;contenedor.append(this.frame);
 }
 private fallar(error:Error){this.error=error;clearTimeout(this.reloj);this.fallarListo(error);for(const p of this.pendientes.values()){clearTimeout(p.reloj);p.mal(error);}this.pendientes.clear();}
 private async ordenar(orden:string,datos:Record<string,unknown>={},limite=150000):Promise<ObservacionGardendless>{
  if(this.destruido)throw new Error('El frente está cerrado.');
  if(this.error)throw this.error;
  await this.listo;
  if(this.destruido)throw new Error('El frente está cerrado.');
  const solicitud=++this.contador;
  return new Promise((ok,mal)=>{
   const reloj=setTimeout(()=>{this.pendientes.delete(solicitud);mal(new Error(`El frente no respondió a ${orden}.`));},limite);
   this.pendientes.set(solicitud,{ok,mal,reloj});
   this.frame.contentWindow!.postMessage({canal:'semilla-frente-v1',zona:this.zona,sesion:this.sesion,solicitud,orden,...datos},location.origin);
  });
 }
 iniciar(){return this.ordenar('iniciar',{nivel:'tutorial1'});}
 iniciarHistoria(config:ConfigDefensaNativa){return this.ordenar('iniciar-historia',{config});}
 pasoHistoria(cantidad:number,visible:boolean){return this.ordenar('paso-historia',{cantidad,visible});}
 async puntoHistoria(){return await this.ordenar('punto-historia') as unknown as PuntoDescansoNativo;}
 observar(){return this.ordenar('observar');}
 pausa(){return this.ordenar('pausa');}
 reanudar(){return this.ordenar('reanudar');}
 async cerrar(){if(this.destruido)return;if(!this.preparado){this.destruir();return;}try{await this.ordenar('cerrar',{},10000);}finally{this.destruir();}}
 /** Descartar la instancia no guarda el combate; el coordinador no debe usarlo para cambiar de frente. */
 destruir(){if(this.destruido)return;this.destruido=true;this.fallar(new Error('El frente está cerrado.'));this.eventos.abort();this.frame.remove();}
}
