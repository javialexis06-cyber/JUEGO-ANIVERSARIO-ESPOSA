/** Reproduce únicamente archivos declarados. El texto funciona aunque todavía no haya audio. */
export interface MediosAstra {version:1;voces:Record<string,{archivo:string;huella_texto:string}>;musica:Record<string,string>;modelos:Record<string,{archivo:string;escala?:number}>}
export const MUSICA_ESCENAS_ASTRA:Record<string,string>={C01:'M01',C02:'M10',C03:'M09',C04:'M11',C05:'M08',C06:'M14',C07:'M21',C08:'M22',C09:'M19',C10:'M20',C11:'M23',C12:'M23',C13:'M23',C14:'M23'};
export const rutaMedioValida=(s:unknown):s is string=>typeof s==='string'&&/^\.\/(?:audio|modelos)\/[a-zA-Z0-9_./-]+\.(?:ogg|mp3|wav|glb)$/.test(s)&&!s.includes('..')&&!s.includes('//');
export function validarMedios(v:unknown):v is MediosAstra {
 const m=v as MediosAstra;if(!m||m.version!==1||!m.voces||!m.musica||!m.modelos||[m.voces,m.musica,m.modelos].some(v=>typeof v!=='object'||Array.isArray(v)))return false;
 if(Object.keys(m.voces).length>5000||Object.values(m.voces).some(v=>!v||!rutaMedioValida(v.archivo)||!v.archivo.match(/\.(ogg|mp3|wav)$/)||!/^([a-f0-9]{16})$/.test(v.huella_texto)))return false;
 if(Object.values(m.musica).some(v=>!rutaMedioValida(v)||!v.match(/\.(ogg|mp3|wav)$/)))return false;
 if(Object.values(m.modelos).some(v=>!v||!rutaMedioValida(v.archivo)||!v.archivo.endsWith('.glb')||v.escala!==undefined&&(!Number.isFinite(v.escala)||v.escala<=0||v.escala>10)))return false;
 return true;
}
export class AudioAstra {
 medios:MediosAstra={version:1,voces:{},musica:{},modelos:{}};
 private voz?:HTMLAudioElement;private fondo?:HTMLAudioElement;private lineaId='';private ultimaLinea:{id:string;huella_texto:string}|null=null;private musicaId='';private activo=false;private silencio=false;
 private visibilidad=()=>{if(document.hidden){this.voz?.pause();this.fondo?.pause();}else if(this.activo&&!this.silencio){void this.fondo?.play().catch(()=>{});void this.voz?.play().catch(()=>{});}};
 constructor(){document.addEventListener('visibilitychange',this.visibilidad);}
 async cargar(){try{const r=await fetch('./granja/astra/medios.json');if(r.ok){const m:unknown=await r.json();if(validarMedios(m))this.medios=m;}}catch{/* Subtítulos disponibles sin red. */}}
 activar(){this.activo=true;if(!this.silencio&&!document.hidden)void this.fondo?.play().catch(()=>{});}
 alternar(){this.silencio=!this.silencio;if(this.silencio){this.voz?.pause();this.fondo?.pause();}else{this.activo=true;if(!this.voz){this.lineaId='';this.linea(this.ultimaLinea);}this.visibilidad();}return this.silencio;}
 musica(id:string){
  if(id===this.musicaId)return;this.musicaId=id;this.fondo?.pause();this.fondo=undefined;const archivo=this.medios.musica[id];if(!archivo)return;
  const a=new Audio(archivo);a.loop=true;a.volume=this.voz&&!this.voz.paused ? .035 : .12;a.preload='none';this.fondo=a;if(this.activo&&!this.silencio&&!document.hidden)void a.play().catch(()=>{});
 }
 linea(linea:{id:string;huella_texto:string}|null){
  this.ultimaLinea=linea;
  const id=linea?.id??'';if(id===this.lineaId)return;this.lineaId=id;this.voz?.pause();this.voz=undefined;if(this.fondo)this.fondo.volume=.12;
  if(!linea||!this.activo||this.silencio||document.hidden)return;const v=this.medios.voces[id];if(!v||v.huella_texto!==linea.huella_texto)return;
  const a=new Audio(v.archivo);a.volume=.85;a.preload='none';this.voz=a;if(this.fondo)this.fondo.volume=.035;
  const restaurar=()=>{if(this.fondo&&this.voz===a)this.fondo.volume=.12;};a.onended=restaurar;a.onerror=restaurar;void a.play().catch(restaurar);
 }
 dispose(){document.removeEventListener('visibilitychange',this.visibilidad);this.voz?.pause();this.fondo?.pause();this.voz?.removeAttribute('src');this.fondo?.removeAttribute('src');}
}
