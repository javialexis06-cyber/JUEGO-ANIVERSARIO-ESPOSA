import type {EventoPvZ} from './tipos';
import {BancoAudioPvZ} from './audio/banco';
import {AUDIO_PLANTAS_PVZ,AUDIO_ZOMBIS_PVZ} from './audio/catalogo';
import type {MotorPvZ} from './motor/motor';
import {ZOMBIS_PVZ} from './datos/zombis';
const ESTADOS_AUDIO:Readonly<Record<string,string>>={'aplastaflor-salta':'aplastar','atrapado-alga':'zampalga','arrastrado':'zampalga','iman-cargando':'iman','congelado':'congelacion','mantequilla':'mantequilla','hipnotizado':'hipnosis','viento':'viento','salta':'palo-salto','pogo-rebota':'pogo','caja-abriendo':'caja','globo-pinchado':'globo','minero-emerge':'pico','bailon-invoca':'baile','delfin-salta':'delfin','delfin-entra':'delfin','periodico-roto':'papel-romper'};
const AL_SEMBRAR=new Set(['nuez','nuez-alta','nenufar','calabaza','planterna','plantorcha','comepiedras','pinchohierba']);
/** Biblioteca local publicada por producción, con síntesis de respaldo mientras faltan grabaciones. */
export class SonidoPvZ {
 private audio:AudioContext|null=null;private ultima=0;private musica=0;private nota=0;
 private banco=new BancoAudioPvZ(()=>this.audio);private _habilitado=true;private temaActual='musica-dia';private ambienteActual='ambiente-dia';private vozDave=0;private pasoEn=0;private grunidoEn=0;private vistos=new Map<number,number>();private minas=new Set<number>();private motorActual:MotorPvZ|null=null;
 get habilitado(){return this._habilitado;}
 constructor(){void this.banco.preparar();}
 set habilitado(v:boolean){this._habilitado=v;this.banco.silenciar(!v);}
 activar(){try{this.audio??=new AudioContext();void this.audio.resume();void this.banco.anticipar(['guisante','hielo','siembra','pala','sol','zombi-mordida','cereza','dave-saludo']);}catch{/* El juego funciona sin audio. */}}
 private tono(f:number,d=.09,vol=.025,tipo:OscillatorType='sine'){if(!this.habilitado||!this.audio||this.audio.state!=='running')return;const a=this.audio,o=a.createOscillator(),g=a.createGain();o.type=tipo;o.frequency.value=f;g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d);o.onended=()=>{o.disconnect();g.disconnect();};}
 eventos(eventos:EventoPvZ[]){if(!this.audio||!this.habilitado)return;for(const e of eventos){

  const id=e.t==='disparo'?AUDIO_PLANTAS_PVZ[e.tipo??'']??'guisante':e.t==='recogeSol'?'sol':e.t==='siembra'?AL_SEMBRAR.has(e.tipo??'')?AUDIO_PLANTAS_PVZ[e.tipo!]: 'siembra':e.t==='pala'?'pala':e.t==='fin'?e.gano?'victoria':'derrota':e.t==='explosion'?AUDIO_PLANTAS_PVZ[e.tipo??'']??'cereza':e.t==='muerde'?'zombi-mordida':e.t==='pierdeBrazo'?'zombi-brazo':e.t==='pierdeCabeza'?'zombi-cabeza':e.t==='pierdeArmadura'?e.tipo?.includes('cubo')?'cubo-caida':e.tipo?.includes('cono')?'cono-caida':e.tipo==='zombi-periodico'?'papel-romper':'puerta-dano':e.t==='oleadaEnorme'?'oleada':e.t==='muere'&&e.tipo&&Object.hasOwn(ZOMBIS_PVZ,e.tipo)?'zombi-caida':e.t==='estado'?ESTADOS_AUDIO[e.tipo??'']:e.t==='terreno'&&e.tipo==='lapida-quitada'?'piedra-comer':e.t==='impacto'&&e.tipo==='hielo'?'hielo':null;
  if(id&&this.banco.tocar(id))continue;
  if(e.t==='recogeSol')this.tono(880,.14);else if(e.t==='siembra')this.tono(260,.12,.02,'triangle');else if(e.t==='fin')this.tono(e.gano?660:130,.5,.04,'triangle');else if(e.t==='explosion')this.tono(70,.2,.035,'sawtooth');else if(e.t==='disparo'&&this.audio.currentTime-this.ultima>.11){this.ultima=this.audio.currentTime;this.tono(410,.045,.009,'triangle');}
 }}
 efecto(id:string){return this.banco.tocar(id);}
 anticipar(ids:readonly string[]){return this.banco.anticipar(ids);}
 async dave(id:string){if(!this.habilitado)return;this.activar();const voz=++this.vozDave;this.banco.detenerFamilia('dave-');await this.banco.anticipar([id]);if(voz!==this.vozDave||!this.habilitado)return;this.banco.tocar(id);}
 cancelarDave(){this.vozDave++;this.banco.detenerFamilia('dave-');}
 actualizar(m:MotorPvZ){
  if(!this.audio||!this.habilitado||m.terminado)return;
  if(this.motorActual!==m){this.motorActual=m;this.vistos.clear();this.minas.clear();this.pasoEn=this.grunidoEn=0;void this.banco.anticipar([...new Set([...m.semillas.map(id=>AUDIO_PLANTAS_PVZ[id]),...m.nivel.zombis.map(id=>AUDIO_ZOMBIS_PVZ[id]),'zombi-paso','zombi-agua','zombi-grunido','zombi-mordida','zombi-caida','zombi-brazo','zombi-cabeza','victoria','derrota','oleada','mina-armar'].filter(Boolean))]);}
  const ahora=this.audio.currentTime,zombis=m.zombis.filter(z=>z.vida>0&&!z.sinCabeza),cercano=[...zombis].sort((a,b)=>a.x-b.x)[0];
  if(cercano&&ahora>=this.pasoEn&&!cercano.congelado&&!cercano.mantequilla&&!cercano.comiendo){this.banco.tocar(m.esAgua(cercano.fila)?'zombi-agua':'zombi-paso');this.pasoEn=ahora+1.2;}
  if(zombis.length&&ahora>=this.grunidoEn){this.banco.tocar(AUDIO_ZOMBIS_PVZ[cercano?.tipo??'']??'zombi-grunido');this.grunidoEn=ahora+8;}
  for(const p of m.plantas){if(p.tipo==='patatapum'&&p.edad>=14&&!this.minas.has(p.id)){this.minas.add(p.id);this.banco.tocar('mina-armar');}const antes=this.vistos.get(p.id)??0,actual=p.datos.atacaHasta??0;if(actual>antes&&actual>m.t){const id=AUDIO_PLANTAS_PVZ[p.tipo];if(id&&p.tipo==='planta-carnivora')this.banco.tocar(id);}this.vistos.set(p.id,actual);}
  const vivos=new Set(m.plantas.map(p=>p.id));for(const id of this.vistos.keys())if(!vivos.has(id))this.vistos.delete(id);for(const id of this.minas)if(!vivos.has(id))this.minas.delete(id);
 }
 tema(id:string,ambiente=''){this.temaActual=id;this.ambienteActual=ambiente;if(this.habilitado)void this.banco.tema(id,ambiente).then(listo=>{if(listo&&this.musica){clearInterval(this.musica);this.musica=0;}});}
 ambiente(activo:boolean){if(!activo){if(this.musica)clearInterval(this.musica);this.musica=0;this.banco.pausarFondo();return;}this.tema(this.temaActual,this.ambienteActual);if(this.musica)return;this.musica=window.setInterval(()=>{const notas=[196,246.94,293.66,246.94,220,261.63,329.63,261.63];this.tono(notas[this.nota++%notas.length],.45,.008,'triangle');},650);}
 pausa(){this.cancelarDave();this.ambiente(false);this.banco.pausar();void this.audio?.suspend();}
 destruir(){this.ambiente(false);this.banco.destruir();void this.audio?.close();this.audio=null;}
}
