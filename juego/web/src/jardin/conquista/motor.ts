import {FICHAS_CONQUISTA,COSTES_CONQUISTA,CARTAS_CONQUISTA} from './catalogo';
import {otroBando,type Bando,type ConfigConquista,type EstadoConquista,type FrenteConquista,type OrdenConquista,type UnidadConquista,type PuestoConquista} from './tipos';
const BANDOS:Bando[]=['plantas','zombis'];
const entero=(v:unknown):v is number=>Number.isSafeInteger(v);
const numero=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const equipoSeguro=(v:unknown,b?:Bando):v is string[]=>Array.isArray(v)&&v.length>=1&&v.length<=8&&new Set(v).size===v.length&&v.every(id=>typeof id==='string'&&Object.hasOwn(FICHAS_CONQUISTA,id)&&(!b||FICHAS_CONQUISTA[id].bando===b));
const puestosSeguros=(v:unknown,equipo:string[]):v is PuestoConquista[]=>Array.isArray(v)&&v.length>=3&&v.length<=9&&v.every(p=>p&&typeof p==='object'&&equipo.includes(p.ficha)&&entero(p.fila)&&p.fila>=0&&p.fila<3&&entero(p.col)&&p.col>=0&&p.col<=3&&!['explosion','linea','congelar','viento'].includes(FICHAS_CONQUISTA[p.ficha]?.rol??''))&&new Set(v.map(p=>p.fila+':'+p.col)).size===v.length&&[0,1,2].every(fila=>v.some(p=>p.fila===fila));
function puestosBase(b:Bando,perfil:number):PuestoConquista[]{return[0,1,2].flatMap(fila=>[{ficha:b==='plantas'?'lanzaguisantes':perfil>=2?'caracono':'zombi',fila,col:2},...(perfil>=2?[{ficha:b==='plantas'?'nuez':'zombi',fila,col:3}]:[])]);}
export function ordenConquistaSegura(o:unknown):o is OrdenConquista {
 if(!o||typeof o!=='object')return false;const a=o as OrdenConquista;
 switch(a.tipo){case'atacar':return entero(a.zona)&&[30,60,90].includes(a.fuerza)&&(a.equipo===undefined||equipoSeguro(a.equipo));case'formacion':return entero(a.zona)&&equipoSeguro(a.equipo)&&puestosSeguros(a.puestos,a.equipo);case'fortificar':case'reparar':return entero(a.zona);case'reforzar':case'retirarse':return entero(a.frente);case'desplegar':return entero(a.frente)&&typeof a.ficha==='string'&&Object.hasOwn(FICHAS_CONQUISTA,a.ficha)&&entero(a.fila)&&a.fila>=0&&a.fila<3&&entero(a.col)&&a.col>=0&&a.col<8;default:return false;}
}
/** Todos los frentes comparten este reloj, incluidos los que no se dibujan. Sin DOM ni reloj externo. */
export class MotorConquista {
 readonly dt=1/30;readonly estado:EstadoConquista;
 constructor(config:ConfigConquista={modo:'historia',ia:['zombis'],semilla:23},restaurado?:EstadoConquista){
  if(restaurado){if(!estadoConquistaSeguro(restaurado))throw Error('Partida de conquista incompatible');this.estado=structuredClone(restaurado);return;}
  if(!['historia','pvp'].includes(config.modo)||!entero(config.semilla)||!Array.isArray(config.ia)||config.ia.some(b=>!BANDOS.includes(b))||new Set(config.ia).size!==config.ia.length)throw Error('Configuración inválida');
  const ancho=config.modo==='historia'?4:6,alto=config.modo==='historia'?3:6,baseP=(alto-1)*ancho,baseZ=ancho-1;
  const nombres=['Casas del roble','Calle del molino','Parque del estanque','Almacén central','Paseo del farol','Puente del río','Taller de semillas','Avenida del mercado','Jardines del sur','Estación vieja','Plaza de las fuentes','Colina del norte'];
  this.estado={v:1,config:structuredClone(config),ancho,alto,t:0,pasos:0,azar:config.semilla>>>0||1,proximo:1,zonas:Array.from({length:ancho*alto},(_,i)=>{const perfil=i===baseP||i===baseZ?3:1+(i*7+config.semilla)%3;return{id:i,nombre:i===baseP?'Nuestra casa':i===baseZ?'Fortaleza zombi':nombres[i%nombres.length]+(i>=12?' '+(1+Math.floor(i/12)):''),col:i%ancho,fila:Math.floor(i/ancho),dueno:i===baseP?'plantas':i===baseZ||config.modo==='historia'?'zombis':'neutral',base:i===baseP?'plantas':i===baseZ?'zombis':null,perfil,fortificacion:0,integridad:1,descanso:0,equipos:{plantas:[...CARTAS_CONQUISTA.plantas],zombis:[...CARTAS_CONQUISTA.zombis]},puestos:{plantas:puestosBase('plantas',perfil),zombis:puestosBase('zombis',perfil)}};}),frentes:[],reservas:{plantas:140,zombis:140},siguienteAtaque:35,proximaIA:8,ganador:'',avisos:[],capturas:{plantas:0,zombis:0},relojManual:{plantas:0,zombis:0},fusiones:config.modo==='pvp'};
  this.aviso('Recupera posiciones, deja defensas y abre una ruta al fuerte rival.');
 }
 private id(){return this.estado.proximo++;}
 private azar(){let x=this.estado.azar;x^=x<<13;x^=x>>>17;x^=x<<5;this.estado.azar=x>>>0;return this.estado.azar/4294967296;}
 private aviso(texto:string,zona:number|null=null){this.estado.avisos.push({id:this.id(),t:this.estado.t,texto,zona});if(this.estado.avisos.length>30)this.estado.avisos.shift();}
 vecinos(id:number){const s=this.estado,z=s.zonas[id];if(!z)return[];return s.zonas.filter(q=>Math.abs(q.col-z.col)+Math.abs(q.fila-z.fila)===1).map(q=>q.id);}
 abastecidas(b:Bando){const s=this.estado,base=s.zonas.find(z=>z.base===b&&z.dueno===b);if(!base)return new Set<number>();const vistas=new Set([base.id]),cola=[base.id];for(let i=0;i<cola.length;i++)for(const v of this.vecinos(cola[i]))if(!vistas.has(v)&&s.zonas[v].dueno===b){vistas.add(v);cola.push(v);}return vistas;}
 apoyo(zona:number,b:Bando){return this.vecinos(zona).filter(i=>this.estado.zonas[i].dueno===b).length;}
 bonificaciones(zona:number,b:Bando){return{ataque:Math.min(.3,Math.max(0,this.apoyo(zona,b)-1)*.1),defensa:Math.min(.36,this.apoyo(zona,b)*.12)};}
 get presion(){const n=this.estado.zonas.filter(z=>z.dueno==='plantas').length;return n>=8?4:n>=5?3:n>=3?2:1;}
 get activos(){return this.estado.frentes.filter(f=>!f.final);}
 frenteDe(zona:number){return this.activos.find(f=>f.zona===zona);}
 puedeAtacar(b:Bando,zona:number){const s=this.estado,z=s.zonas[zona];return!!z&&!s.ganador&&!(s.config.modo==='historia'&&b==='plantas'&&z.base==='zombis'&&s.zonas.filter(q=>q.dueno==='plantas').length<s.zonas.length-1)&&z.dueno!==b&&z.descanso<=s.t&&!this.frenteDe(zona)&&this.vecinos(zona).some(i=>this.abastecidas(b).has(i))&&this.activos.length<6&&this.activos.filter(f=>f.atacante===b).length<(s.config.modo==='historia'&&b==='zombis'?4:3);}
 ordenar(b:Bando,o:OrdenConquista){
  const s=this.estado;if(!BANDOS.includes(b)||s.ganador||!ordenConquistaSegura(o))return false;
  if(o.tipo==='atacar'){const equipo=o.equipo??[...CARTAS_CONQUISTA[b]];if(!this.puedeAtacar(b,o.zona)||s.reservas[b]<o.fuerza||!equipoSeguro(equipo,b)||!s.fusiones&&equipo.some(id=>FICHAS_CONQUISTA[id].fusion))return false;s.reservas[b]-=o.fuerza;this.abrirFrente(b,o.zona,o.fuerza,equipo);return true;}
  if(o.tipo==='formacion'){const z=s.zonas[o.zona];if(!z||z.dueno!==b||this.frenteDe(z.id)||!equipoSeguro(o.equipo,b)||!puestosSeguros(o.puestos,o.equipo)||!s.fusiones&&o.equipo.some(id=>FICHAS_CONQUISTA[id].fusion)||o.puestos.reduce((n,p)=>n+FICHAS_CONQUISTA[p.ficha].coste,0)>this.cupo(z.id)||s.reservas[b]<20||!this.abastecidas(b).has(z.id))return false;s.reservas[b]-=20;z.equipos[b]=[...o.equipo];z.puestos[b]=structuredClone(o.puestos);this.aviso('Formación preparada en '+z.nombre,z.id);return true;}
  if(o.tipo==='fortificar'||o.tipo==='reparar'){
   const z=s.zonas[o.zona],coste=COSTES_CONQUISTA[o.tipo];if(!z||z.dueno!==b||this.frenteDe(z.id)||!this.abastecidas(b).has(z.id)||s.reservas[b]<coste||o.tipo==='fortificar'&&z.fortificacion>=2||o.tipo==='reparar'&&z.integridad>=.999)return false;
   s.reservas[b]-=coste;if(o.tipo==='fortificar')z.fortificacion++;else z.integridad=Math.min(1,z.integridad+.45);this.aviso(o.tipo==='fortificar'?'Defensas reforzadas en '+z.nombre:'Reparaciones en '+z.nombre,z.id);return true;
  }
  const f=this.activos.find(f=>f.id===o.frente);if(!f||b!==f.atacante&&s.zonas[f.zona].dueno!==b)return false;
  if(o.tipo==='retirarse'){if(f.atacante!==b)return false;f.final=f.defensor;this.resolver(f);return true;}
  if(o.tipo==='reforzar'){if(s.reservas[b]<COSTES_CONQUISTA.reforzar||f.reservas[b]>150)return false;s.reservas[b]-=COSTES_CONQUISTA.reforzar;f.reservas[b]+=40;f.proxima[b]=Math.min(f.proxima[b],f.t+.5);this.aviso('Reservas enviadas a '+s.zonas[f.zona].nombre,f.zona);return true;}
  const d=FICHAS_CONQUISTA[o.ficha],key=b+':'+d.id;if(d.bando!==b||!f.equipos[b].includes(d.id)||d.fusion&&!s.fusiones||s.reservas[b]<d.coste||(f.recargas[key]??0)>0||f.unidades.length>=72)return false;
  if(!this.desplegar(f,b,o.ficha,o.fila,o.col))return false;s.reservas[b]-=d.coste;f.recargas[key]=d.recarga;s.relojManual[b]=s.t;return true;
 }
 cupo(zona:number){const z=this.estado.zonas[zona];return z?80+z.perfil*20+z.fortificacion*30:0;}
 private abrirFrente(atacante:Bando,zona:number,fuerza:number,equipo:string[]){
  const s=this.estado,z=s.zonas[zona],defensor=otroBando(atacante),core=(z.base?200:110)+z.fortificacion*35;
  const f:FrenteConquista={id:this.id(),zona,atacante,defensor,inicio:s.t,t:0,limite:135,nucleos:{plantas:95,zombis:95},maximos:{plantas:95,zombis:95},reservas:{plantas:0,zombis:0},oleada:{plantas:0,zombis:0},proxima:{plantas:2,zombis:2},cabecera:[1,1,1],unidades:[],balas:[],recargas:{},equipos:{plantas:[...z.equipos.plantas],zombis:[...z.equipos.zombis]},final:'',resultadoAplicado:false};f.equipos[atacante]=[...equipo];
  f.nucleos[defensor]=core*Math.max(.45,z.integridad);f.maximos[defensor]=core;f.reservas[atacante]=fuerza;f.reservas[defensor]=25+z.perfil*10+z.fortificacion*18;
  if(defensor==='plantas')f.cabecera=[3,3,3];
  for(const puesto of z.puestos[defensor])this.desplegar(f,defensor,puesto.ficha,puesto.fila,puesto.col,true);
  s.frentes.push(f);this.aviso((atacante==='plantas'?'Las plantas':'Los zombis')+' atacan '+z.nombre,zona);
 }
 private desplegar(f:FrenteConquista,b:Bando,tipo:string,fila:number,col:number,inicial=false){
  const d=FICHAS_CONQUISTA[tipo];if(!d||d.bando!==b||fila<0||fila>2||f.unidades.length>=72)return false;
  const x=b==='plantas'?110+col*88:inicial?620+col*55:870;
  if(b==='plantas'&&(col>Math.floor(f.cabecera[fila])||f.unidades.some(u=>u.bando===b&&u.fila===fila&&Math.abs(u.x-x)<35)))return false;
  if(['explosion','linea','congelar','viento'].includes(d.rol??'')){for(const u of f.unidades)if(u.bando!==b){if(d.rol==='congelar')u.lento=12;else if(d.rol==='viento'){u.x=Math.min(970,u.x+90);if(FICHAS_CONQUISTA[u.tipo].rol==='vuelo')u.vida=0;}else if(d.rol==='linea'?u.fila===fila:Math.abs(u.fila-fila)<=1&&Math.abs(u.x-x)<d.alcance)this.danar(u,d.dano);}f.unidades=f.unidades.filter(u=>u.vida>0);return true;}
  const integridad=inicial?Math.max(.45,this.estado.zonas[f.zona].integridad):1;
  f.unidades.push({id:this.id(),tipo,bando:b,fila,x,vida:d.vida*integridad,armadura:d.armadura*integridad,reloj:.15,lento:0,edad:0,especial:0});return true;
 }
 private danar(u:UnidadConquista,dano:number){const escudo=Math.min(u.armadura,dano);u.armadura-=escudo;u.vida-=dano-escudo;}
 private oleada(f:FrenteConquista,b:Bando){
  const defensor=b===f.defensor,z=this.estado.zonas[f.zona],n=f.oleada[b]++,res=f.reservas[b];
  let opciones=b==='plantas'?['lanzaguisantes','nuez','lanzaguisantes','repetidora']:['zombi','caracono','zombi-periodico','caracubo'];
  if(defensor&&z.perfil===1)opciones=b==='plantas'?['lanzaguisantes','nuez']:['zombi','caracono'];
  if(b==='zombis'&&n>3&&z.perfil===3)opciones=['caracono','zombi-futbolista','caracubo'];
  opciones=opciones.filter(id=>f.equipos[b].includes(id));if(!opciones.length)opciones=f.equipos[b].filter(id=>!['explosion','linea','congelar','viento'].includes(FICHAS_CONQUISTA[id].rol??''));if(!opciones.length){f.proxima[b]=f.t+7;return;}
  const filas=[0,1,2].sort((a,c)=>{const peligro=(fila:number)=>f.unidades.filter(u=>u.bando!==b&&u.fila===fila).reduce((s,u)=>s+(b==='plantas'?1000-u.x:u.x),0)-f.unidades.filter(u=>u.bando===b&&u.fila===fila).length*180;return peligro(c)-peligro(a);});
  for(let j=0;j<3;j++){const fila=filas[(j+n)%3],tipo=opciones[(n+j)%opciones.length],d=FICHAS_CONQUISTA[tipo];if(f.reservas[b]<d.coste)continue;
   let col=Math.floor(f.cabecera[fila]);if(tipo==='nuez')col=Math.min(7,col);else col=Math.max(0,col-1);
   if(b==='plantas'){while(col>=0&&f.unidades.some(u=>u.bando===b&&u.fila===fila&&Math.abs(u.x-(110+col*88))<35))col--;if(col<0)continue;}
   if(this.desplegar(f,b,tipo,fila,col))f.reservas[b]-=d.coste;
  }
  // Una oleada modesta sigue existiendo sin intervención; las reservas manuales permiten sostenerla.
  f.proxima[b]=f.t+(defensor?10:7)/(1+(defensor?0:this.bonificaciones(f.zona,b).ataque));
 }
 private combate(f:FrenteConquista){
  const dt=this.dt,s=this.estado;f.t+=dt;
  for(const b of BANDOS){const historia=s.config.modo==='historia'&&b==='zombis'&&b===f.atacante?this.presion*.25:0;f.reservas[b]=Math.min(180,f.reservas[b]+dt*(b===f.defensor?.35:.85+historia));if(f.t>=f.proxima[b])this.oleada(f,b);}
  for(const k of Object.keys(f.recargas))f.recargas[k]=Math.max(0,f.recargas[k]-dt);
  for(let fila=0;fila<3;fila++)if(f.atacante==='plantas'&&!f.unidades.some(u=>u.bando==='zombis'&&u.fila===fila&&u.vida>0&&u.x<110+f.cabecera[fila]*88+115))f.cabecera[fila]=Math.min(7,f.cabecera[fila]+dt/5);
  for(const u of f.unidades){if(u.vida<=0)continue;const d=FICHAS_CONQUISTA[u.tipo];u.edad+=dt;u.reloj-=dt;u.lento=Math.max(0,u.lento-dt);
   if(d.rol==='produccion'){if(u.reloj<=0){s.reservas.plantas=Math.min(300,s.reservas.plantas+2);u.reloj=5;}continue;}
   if(d.rol==='escudo'){if(u.reloj<=0){const aliado=f.unidades.find(v=>v.bando===u.bando&&v.id!==u.id&&v.fila===u.fila&&Math.abs(v.x-u.x)<d.alcance&&v.vida<FICHAS_CONQUISTA[v.tipo].vida);if(aliado)aliado.vida=Math.min(FICHAS_CONQUISTA[aliado.tipo].vida,aliado.vida+22);u.reloj=3;}continue;}
   const enemigos=f.unidades.filter(v=>v.bando!==u.bando&&v.fila===u.fila&&v.vida>0&&(u.bando==='plantas'?v.x>=u.x-20:v.x<=u.x+20)&&!(d.rol==='vuelo'&&v.bando==='plantas')).sort((a,b)=>u.bando==='plantas'?a.x-b.x:b.x-a.x),objetivo=enemigos[0];
   if(u.bando==='plantas'){
    if(d.rol==='iman'&&objetivo&&objetivo.x-u.x<=d.alcance&&u.reloj<=0){objetivo.armadura=Math.max(0,objetivo.armadura-130);u.reloj=d.intervalo;continue;}
    if(d.rol==='hipnosis'&&objetivo&&Math.abs(objetivo.x-u.x)<d.alcance){for(const enemigo of f.unidades)if(enemigo.bando==='zombis'&&enemigo.fila===u.fila&&Math.abs(enemigo.x-u.x)<170)this.danar(enemigo,100);u.vida=0;continue;}
    if(['devorar','mina','pinchos','humo'].includes(d.rol??'')){if(objetivo&&Math.abs(objetivo.x-u.x)<=d.alcance&&u.reloj<=0&&(d.rol!=='mina'||u.edad>=5)){if(d.rol==='devorar')this.danar(objetivo,d.dano);else for(const enemigo of f.unidades)if(enemigo.bando==='zombis'&&enemigo.fila===u.fila&&Math.abs(enemigo.x-u.x)<(d.rol==='humo'?d.alcance:70)){if(d.rol==='humo')enemigo.vida-=d.dano;else this.danar(enemigo,d.dano);}u.reloj=d.intervalo;if(d.rol==='mina'||u.tipo==='aplastaflor'||u.tipo==='zampalga')u.vida=0;}else if(d.rol==='humo'&&!objetivo&&900-u.x<=d.alcance&&u.reloj<=0){this.danarNucleo(f,'zombis',d.dano);u.reloj=d.intervalo;}continue;}
    if(d.dano<=0||u.reloj>0)continue;
    if(objetivo&&objetivo.x-u.x<=d.alcance){const filas=d.rol==='triple'||d.rol==='estrella'?[0,1,2]:[u.fila],luz=f.unidades.some(v=>v.bando==='plantas'&&FICHAS_CONQUISTA[v.tipo].rol==='luz'&&Math.abs(v.x-u.x)<180&&Math.abs(v.fila-u.fila)<=1);for(const fila of filas)f.balas.push({id:this.id(),bando:'plantas',fila,x:u.x+22,dano:d.dano*(luz?1.15:1),velocidad:340,hielo:d.rol==='hielo',aereo:u.tipo==='cactus'||d.rol==='estrella'});u.reloj=d.intervalo;}
    else if(!objetivo&&900-u.x<=d.alcance){this.danarNucleo(f,'zombis',d.dano);u.reloj=d.intervalo;}
   }else if(objetivo&&u.x-objetivo.x<=d.alcance){if((d.rol==='salto'||d.rol==='minero')&&!u.especial&&objetivo.tipo!=='nuez-alta'){u.x=Math.max(60,objetivo.x-80);u.especial=1;}else if(d.rol==='caja'){for(const p of f.unidades)if(p.bando==='plantas'&&p.fila===u.fila&&Math.abs(p.x-u.x)<160)this.danar(p,d.dano);u.vida=0;}else if(u.reloj<=0){this.danar(objetivo,d.dano);u.reloj=d.intervalo;}}
   else if(u.x<=55){if(u.reloj<=0){this.danarNucleo(f,'plantas',d.dano);u.reloj=d.intervalo;}}
   else{const rabia=u.tipo==='zombi-periodico'&&u.armadura<=0?1.65:1;u.x-=d.velocidad*dt*(u.lento>0?.5:1)*rabia;}
  }
  for(const p of f.balas){const antes=p.x;p.x+=p.velocidad*dt;if(f.unidades.some(u=>u.bando==='plantas'&&FICHAS_CONQUISTA[u.tipo].rol==='fuego'&&u.fila===p.fila&&u.x>=antes&&u.x<p.x))p.dano=Math.min(150,p.dano*1.5);const z=f.unidades.filter(u=>u.bando!==p.bando&&u.fila===p.fila&&u.vida>0&&(p.aereo||FICHAS_CONQUISTA[u.tipo].rol!=='vuelo')&&u.x>=antes-25&&u.x<=p.x+25).sort((a,b)=>a.x-b.x)[0];if(z){this.danar(z,p.dano);if(p.hielo)z.lento=4;p.x=1100;}}
  f.unidades=f.unidades.filter(u=>u.vida>0);f.balas=f.balas.filter(p=>p.x<1020).slice(-150);
  const p=f.nucleos.plantas<=0,z=f.nucleos.zombis<=0;if(p||z)f.final=p?'zombis':'plantas';else if(f.t>=f.limite)f.final=f.defensor;
  if(f.final)this.resolver(f);
 }
 private danarNucleo(f:FrenteConquista,b:Bando,dano:number){const bono=b===f.defensor?this.bonificaciones(f.zona,b).defensa:0;f.nucleos[b]=Math.max(0,f.nucleos[b]-dano/(1+bono));}
 private resolver(f:FrenteConquista){
  if(f.resultadoAplicado||!f.final)return;f.resultadoAplicado=true;const s=this.estado,z=s.zonas[f.zona],capturada=f.final===f.atacante;
  if(capturada){z.dueno=f.atacante;z.fortificacion=Math.max(0,z.fortificacion-1);z.integridad=.7;s.capturas[f.atacante]++;s.reservas[f.atacante]=Math.min(300,s.reservas[f.atacante]+12);this.aviso(z.nombre+' cambia al control de '+f.atacante+'. Guarnición del nivel desplegada.',z.id);}
  else{z.integridad=Math.max(.25,Math.min(1,f.nucleos[f.defensor]/f.maximos[f.defensor]));this.aviso(z.nombre+' resiste. Revisa sus defensas antes del próximo ataque.',z.id);}
  z.descanso=s.t+18;
  if(!s.fusiones&&s.config.modo==='historia'&&s.zonas.filter(z=>z.dueno==='plantas').length>=8){s.fusiones=true;this.aviso('El laboratorio de Fusión está listo para la ofensiva final.');}
 }
 private comprobarFinal(){const s=this.estado,p=s.zonas.find(z=>z.base==='plantas')!,z=s.zonas.find(z=>z.base==='zombis')!,caeP=p.dueno!=='plantas',caeZ=z.dueno!=='zombis'&&(s.config.modo==='pvp'||s.zonas.every(q=>q.dueno==='plantas'));if(caeP||caeZ){s.ganador=caeP&&caeZ?'empate':caeP?'zombis':'plantas';this.aviso(s.ganador==='empate'?'Ambos fuertes han caído. Empate.':s.config.modo==='historia'&&s.ganador==='plantas'?'El mapa está purificado al 100%. ¡El Dr. Zomboid huye en su nave!':'Victoria de '+s.ganador+'. El fuerte rival ha caído.');}}
 private inteligencia(){
  const s=this.estado;
  if(s.config.modo==='historia'){
   if(!s.config.ia.includes('zombis'))return;
   if(s.t<s.siguienteAtaque)return;s.siguienteAtaque=s.t+Math.max(22,42-this.presion*4);
   if(this.activos.filter(f=>f.atacante==='zombis').length>=this.presion)return;
   const candidatos=s.zonas.filter(z=>z.dueno==='plantas'&&this.puedeAtacar('zombis',z.id)).sort((a,b)=>Number(!!a.base)-Number(!!b.base)||a.fortificacion-b.fortificacion||a.integridad-b.integridad);
   if(candidatos.length){const objetivo=candidatos[Math.floor(this.azar()*Math.min(candidatos.length,3))],fuerza=s.reservas.zombis>=90?90:s.reservas.zombis>=60?60:30;this.ordenar('zombis',{tipo:'atacar',zona:objetivo.id,fuerza});}
   return;
  }
  if(s.t<s.proximaIA)return;s.proximaIA=s.t+6;
  for(const b of s.config.ia){const fuerte=s.zonas.find(z=>z.base===otroBando(b))!;const candidatos=s.zonas.filter(z=>this.puedeAtacar(b,z.id)).sort((a,c)=>(Math.abs(a.col-fuerte.col)+Math.abs(a.fila-fuerte.fila)+a.perfil*.6)-(Math.abs(c.col-fuerte.col)+Math.abs(c.fila-fuerte.fila)+c.perfil*.6));if(candidatos.length&&s.reservas[b]>=60)this.ordenar(b,{tipo:'atacar',zona:candidatos[0].id,fuerza:s.reservas[b]>=120?90:60});}
 }
 paso(cantidad=1){
  if(!entero(cantidad)||cantidad<0||cantidad>90000)throw Error('Pasos inválidos');const s=this.estado;
  for(let n=0;n<cantidad&&!s.ganador;n++){
   s.t+=this.dt;s.pasos++;
   for(const b of BANDOS){const abastecidas=this.abastecidas(b).size,extra=s.config.modo==='historia'&&b==='zombis'?this.presion*.4:0;s.reservas[b]=Math.min(300,s.reservas[b]+this.dt*(1.2+Math.min(2.4,abastecidas*.18)+extra));}
   // Resolver después de avanzar todos los frentes mantiene el empate independiente del orden de la vista.
   for(const f of this.activos)this.combate(f);this.comprobarFinal();if(!s.ganador)this.inteligencia();
   if(s.frentes.length>24)s.frentes=s.frentes.filter(f=>!f.final||s.t-f.inicio-f.t<20);
  }
 }
 foto(){return structuredClone(this.estado);}
}
/** Valida el archivo completo antes de restaurar o aceptar una foto de red. */
export function estadoConquistaSeguro(v:unknown):v is EstadoConquista {try{return validarEstado(v);}catch{return false;}}
function validarEstado(v:unknown):v is EstadoConquista {
 if(!v||typeof v!=='object')return false;const s=v as EstadoConquista;
 if(s.v!==1||!s.config||!['historia','pvp'].includes(s.config.modo)||!entero(s.config.semilla)||!Array.isArray(s.config.ia)||s.config.ia.some(b=>!BANDOS.includes(b))||new Set(s.config.ia).size!==s.config.ia.length)return false;
 if(s.ancho!==(s.config.modo==='historia'?4:6)||s.alto!==(s.config.modo==='historia'?3:6)||!numero(s.t)||s.t<0||s.t>1e7||!entero(s.pasos)||s.pasos<0||!entero(s.azar)||s.azar<0||s.azar>4294967295||!entero(s.proximo)||s.proximo<1||!['','plantas','zombis','empate'].includes(s.ganador)||typeof s.fusiones!=='boolean'||s.config.modo==='pvp'&&!s.fusiones)return false;
 const finitos=(obj:unknown)=>!!obj&&typeof obj==='object'&&Object.values(obj).every(v=>numero(v)&&v>=0&&v<1e9);
 if(!finitos(s.reservas)||!finitos(s.capturas)||!finitos(s.relojManual)||BANDOS.some(b=>!numero(s.reservas[b])||s.reservas[b]>300||!numero(s.capturas[b])||!numero(s.relojManual[b]))||!numero(s.siguienteAtaque)||!numero(s.proximaIA))return false;
 if(!Array.isArray(s.zonas)||s.zonas.length!==s.ancho*s.alto||s.zonas.some((z,i)=>z.id!==i||z.col!==i%s.ancho||z.fila!==Math.floor(i/s.ancho)||typeof z.nombre!=='string'||z.nombre.length>90||!['plantas','zombis','neutral'].includes(z.dueno)||![null,'plantas','zombis'].includes(z.base)||!entero(z.perfil)||z.perfil<1||z.perfil>3||!entero(z.fortificacion)||z.fortificacion<0||z.fortificacion>2||!numero(z.integridad)||z.integridad<0||z.integridad>1||!numero(z.descanso)))return false;
 const bp=(s.alto-1)*s.ancho,bz=s.ancho-1;if(s.zonas.some((z,i)=>z.base!==(i===bp?'plantas':i===bz?'zombis':null)))return false;
 for(const z of s.zonas)for(const b of BANDOS)if(!equipoSeguro(z.equipos[b],b)||!puestosSeguros(z.puestos[b],z.equipos[b]))return false;
 if(!Array.isArray(s.frentes)||s.frentes.length>100||new Set(s.frentes.map(f=>f.id)).size!==s.frentes.length)return false;
 const activos=s.frentes.filter(f=>!f.final);if(activos.length>6||new Set(activos.map(f=>f.zona)).size!==activos.length)return false;
 for(const f of s.frentes){if(!entero(f.id)||f.id<=0||!entero(f.zona)||!s.zonas[f.zona]||!BANDOS.includes(f.atacante)||f.defensor!==otroBando(f.atacante)||!numero(f.inicio)||!numero(f.t)||f.t<0||f.t>136||f.limite!==135||!['','plantas','zombis'].includes(f.final)||typeof f.resultadoAplicado!=='boolean'||f.resultadoAplicado!==!!f.final)return false;
  for(const obj of[f.nucleos,f.maximos,f.reservas,f.oleada,f.proxima])if(!finitos(obj)||BANDOS.some(b=>!numero(obj[b])))return false;
  for(const b of BANDOS)if(!equipoSeguro(f.equipos[b],b))return false;
  if(!Array.isArray(f.cabecera)||f.cabecera.length!==3||f.cabecera.some(v=>!numero(v)||v<1||v>7)||!finitos(f.recargas))return false;
  if(!Array.isArray(f.unidades)||f.unidades.length>72||new Set(f.unidades.map(u=>u.id)).size!==f.unidades.length)return false;
  for(const u of f.unidades)if(!entero(u.id)||u.id<=0||!Object.hasOwn(FICHAS_CONQUISTA,u.tipo)||u.bando!==FICHAS_CONQUISTA[u.tipo].bando||!entero(u.fila)||u.fila<0||u.fila>2||![u.x,u.vida,u.armadura,u.reloj,u.lento,u.edad,u.especial].every(numero)||u.x<0||u.x>1000||u.vida<=0||u.vida>1000||u.armadura<0||u.armadura>1000||u.lento<0||u.edad<0)return false;
  if(!Array.isArray(f.balas)||f.balas.length>150||f.balas.some(p=>!entero(p.id)||p.bando!=='plantas'||!entero(p.fila)||p.fila<0||p.fila>2||![p.x,p.dano,p.velocidad].every(numero)||p.dano<0||p.dano>1000||p.velocidad!==340||typeof p.hielo!=='boolean'||typeof p.aereo!=='boolean'))return false;
 }
 return Array.isArray(s.avisos)&&s.avisos.length<=30&&s.avisos.every(a=>entero(a.id)&&numero(a.t)&&typeof a.texto==='string'&&a.texto.length<240&&(a.zona===null||entero(a.zona)&&!!s.zonas[a.zona]));
}
