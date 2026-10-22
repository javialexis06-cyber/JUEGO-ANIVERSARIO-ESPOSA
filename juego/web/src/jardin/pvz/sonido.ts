import type {EventoPvZ} from './tipos';
/** Síntesis breve propia. Solo se abre después de una interacción; sin voces ni recursos remotos. */
export class SonidoPvZ {
 private audio:AudioContext|null=null;private ultima=0;private musica=0;private nota=0;
 habilitado=true;
 activar(){try{this.audio??=new AudioContext();void this.audio.resume();}catch{/* El juego funciona sin audio. */}}
 private tono(f:number,d=.09,vol=.025,tipo:OscillatorType='sine'){if(!this.habilitado||!this.audio||this.audio.state!=='running')return;const a=this.audio,o=a.createOscillator(),g=a.createGain();o.type=tipo;o.frequency.value=f;g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d);o.onended=()=>{o.disconnect();g.disconnect();};}
 eventos(eventos:EventoPvZ[]){if(!this.audio)return;for(const e of eventos){if(e.t==='recogeSol')this.tono(880,.14);else if(e.t==='siembra')this.tono(260,.12,.02,'triangle');else if(e.t==='fin')this.tono(e.gano?660:130,.5,.04,'triangle');else if(e.t==='explosion')this.tono(70,.2,.035,'sawtooth');else if(e.t==='disparo'&&this.audio.currentTime-this.ultima>.11){this.ultima=this.audio.currentTime;this.tono(410,.045,.009,'triangle');}}}
 ambiente(activo:boolean){if(!activo){if(this.musica)clearInterval(this.musica);this.musica=0;return;}if(this.musica)return;this.musica=window.setInterval(()=>{const notas=[196,246.94,293.66,246.94,220,261.63,329.63,261.63];this.tono(notas[this.nota++%notas.length],.45,.008,'triangle');},650);}
 pausa(){this.ambiente(false);void this.audio?.suspend();}
 destruir(){this.ambiente(false);void this.audio?.close();this.audio=null;}
}
