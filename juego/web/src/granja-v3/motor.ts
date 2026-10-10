import { crearCorreo, entregarCorreo, actuarCorreo, correoValido } from './correo';
import { dormitorioDef, puertaDormitorio, puedeEntrarDormitorio, MUEBLES_DORMITORIO } from './dormitorios';
import { viviendaDef, viviendaInterior, visitaVivienda, librePueblo } from './pueblo-datos';
import { crearVidaSocial, vidaSocialValida, actuarSocial, celebrarRegalo } from './vida-social';
import { crearEncargos, encargosValidos, actuarEncargo, vencerEncargos } from './encargos';
import { crearPuebloEstado, puebloValido, conversar, atencionServicio } from './aldeanos';
import { puntoInteraccion } from './pueblo-datos';
import { esperaCorral } from './refugios';
import { crearObras, MAX_ENCARGOS, requiereObra, costeObra, capacidadRefugio, nivelEdificio, materialesObra, celdaReservadaObra, intersectaHuellaObra, huellaObra, obraActiva, errorObras, type ObraTerminada } from './construccion';
import { crearCompania, COMPANEROS, companiaDisponible, actuarCompania, companiaValida, actualizarCompania, cerrarDiaCompania, trasladarHogarCompania, hogarCompania, posicionMontada, PaseosCompania } from './compania';
import { puntoTransitable } from './transito';
import { avanzarRutinas, animalVisible, crearRutina, pausaAnimal, puertaAbierta, reiniciarRutinas, rutinaValida } from './rutinas-ganado';
import { GANADO, crearGanaderia, especieDisponible, posicionAnimal, posicionNido, coordenadaRefugio, reservaRefugio, articuloHuevo, leerHuevo, ganaderiaValida, COSTE_INCUBADORA, COSTE_INCUBADORA_GRANDE } from './ganaderia';
import { crearHabilidades, nivelHabilidad, ganarExperiencia, efectosHabilidades, costeHerramienta, mejorarBotin, reconocerAprendizajes, elegirProfesion, habilidadesValidas, aprendizajesValidos, type Habilidad, HABILIDADES } from './habilidades';
import { FRUTALES, frutalDef } from './frutales-datos';
import { crearFrutal, regarFrutal, avanzarFrutal, frutalValido, vidaFrutal, type Frutal } from './frutales';
import { crearInvernadero, camaInvernadero, dentroInvernadero, CLIMA_INVERNADERO, COSTE_RIEGO_INVERNADERO, MAX_INVERNADEROS } from './invernadero';
import { ARTICULO_ENVIO, crearEnvios, crearCajaEnvio, transferirEnvio, resumenEnvios, valorEnvios, enviosValidos } from './envios';
import { crearGenoma, cruzar, fenotipo, probabilidades } from './genetica';
import type { Genome, Species } from './genetica';
import { crearCuidado, reconciliarAnimal, estadoAnimal, alimentar, consentir, curar, crearCultivo, reconciliarCultivo, avanzarCultivoDia, regarCultivo } from './cuidados';
import { ARTICULOS, CLIMAS, CULTIVOS, DIA, ESPECIES, FANTASIAS, HERRAMIENTAS, HORA, MISIONES, PECES, PRECIOS_VENTA, SECTORES, sectorDeCelda, sonAdyacentes } from './catalogo';
import type { Articulo, Clima, Estacion, Mision, PezDef } from './catalogo';
import type { Accion, Animal, Edificio, EstadoGranja, Resultado, Obstaculo, Drop } from './estado';
import { RECETAS, obtenerObjeto, obtenerReceta } from './objetos';
import { crearJornada, relojValle, avanzarReloj, cerrarJornada, jornadaValida, CRECIMIENTO_NOCHE_MS, INICIO_DIA, FIN_DIA } from './jornada';
import { crearTiempo, tiempoValido, tiempoDia, tiempoRegion, biomaCelda, biomaZona, lluviaRiega, pronostico } from './clima';
import { SALIDAS, dentroDeZona, esSenderoGranja } from './caminos-mundo';
import { crearPaisaje, aguaEn, huecoEn, paisajeValido } from './paisaje';
import { crearCampo, campoValido, duracionCampo, diasCultivo, calidadCosecha, siguienteCosecha, nombreCalidad, multiplicadorCalidad } from './agricultura';
import { crearProduccion, aplicarProduccion, avanzarProduccion, errorProduccion, huellaProduccion } from './produccion';
import { MONSTRUOS, MINERALES, crearAventura, errorAventura, entrarAventura, salirAventura, descenderAventura, golpearMonstruo, golpearNodo, recogerBotin, resolverSituacion, stepAventura, destinoAventura, instanciaAventura, esTransitableAventura, opcionesAventura } from './aventura';
import { crearBarra, validarBarra, indiceActivo, objetoActivo, herramientaDeObjeto, bonosEquipo, HERRAMIENTAS_INICIALES, LARGO_BARRA } from './barra';
import type { Pila } from './inventario';
import { calidadPila, type Calidad, articuloValido, limitePila, cambiarCantidad, distribuirInventario, resumirCasillas, moverPila, MAX_PILA, CASILLAS_AMPLIADAS } from './inventario';
import { SERVICIOS, NIVELES_HERRAMIENTA, HERRAMIENTAS_MEJORABLES, VIDA_RECURSO, nodosExteriores, herramientaDeNodo, nivelNecesario, botinDeNodo, REGENERACION_NODO_MS, ALCANCE_GOLPE, ALCANCE_RECOGIDA, celdasDeHerramienta } from './progresion';
export type { Accion, Animal, Edificio, EstadoGranja, Resultado } from './estado';

const bien=(mensaje:string):Resultado=>({ok:true,mensaje});
const mal=(mensaje:string):Resultado=>({ok:false,mensaje});
const clonar=<T>(x:T):T=>structuredClone(x);
const entero=(x:unknown,min=-1000,max=1000):x is number=>typeof x==='number'&&Number.isInteger(x)&&x>=min&&x<=max;
const finito=(x:unknown,min=0,max=Number.MAX_SAFE_INTEGER):x is number=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
const articulo=(id:string)=>ARTICULOS.find(a=>a.id===id);
const MAX_ANIMALES=240, MAX_EDIFICIOS=1500, MAX_DROPS=2000;
class MochilaLlena extends Error {}
const normalizarGiro=(n=0)=>((n%4)+4)%4;
export function huella(e:Pick<Edificio,'articulo'|'giro'|'x'|'z'>):{x:number;z:number;ancho:number;fondo:number}{
 const a=articulo(e.articulo)!;const d=a.fondo+(a.corral||0);return {x:e.x,z:e.z,ancho:e.giro%2?d:a.ancho,fondo:e.giro%2?a.ancho:d};
}
function contiene(r:{x:number;z:number;ancho:number;fondo:number},x:number,z:number){return x>=r.x&&x<r.x+r.ancho&&z>=r.z&&z<r.z+r.fondo}
function solapa(a:ReturnType<typeof huella>,b:ReturnType<typeof huella>){return a.x<b.x+b.ancho&&a.x+a.ancho>b.x&&a.z<b.z+b.fondo&&a.z+a.fondo>b.z}

export class MotorGranja {
 estado:EstadoGranja;
 private paseosCompania=new PaseosCompania();
 private jornadaLluvia=-1;private revisionLluvia=-1;
 private readonly ahora:()=>number;
 private readonly azar:()=>number;
 constructor(opciones:{ahora?:()=>number;azar?:()=>number;estado?:EstadoGranja}={}){
  this.ahora=opciones.ahora||Date.now;this.azar=opciones.azar||Math.random;
  const now=this.ahora();this.estado=this.inicial(now);
  // La granja empieza enmontada, como en Stardew: maleza, piedras y tocones por limpiar
  if(!opciones.estado)for(let ronda=1;ronda<=9;ronda++)this.brotarMaleza(ronda);
  if(opciones.estado){const r=this.cargarJSON(JSON.stringify(opciones.estado));if(!r.ok)throw new Error(r.mensaje)}
 }
 private inicial(now:number):EstadoGranja {
  const edificios:Edificio[]=[{id:'casa_inicial',articulo:'casa',x:-8,z:-6,giro:0,clima:'templado',pasto:0,ultimoPastoAt:now},{id:'corral_inicial',articulo:'refugio_gallina_templado',x:2,z:-6,giro:0,especie:'gallina',clima:'templado',pasto:16,ultimoPastoAt:now},{id:'envio_inicial',articulo:ARTICULO_ENVIO,x:-8,z:0,giro:0,clima:'templado',pasto:0,ultimoPastoAt:now}];
  const animales:Animal[]=(['hembra','macho'] as const).map((sexo,i)=>({id:`animal_inicial_${i}`,nombre:i?'Pipo':'Pepita',especie:'gallina',sexo,genoma:crearGenoma('Aa','Bb','FF','Ee'),nacimiento:now-2*DIA,edadDias:2,ultimoCruce:null,edificioId:'corral_inicial',cuidado:crearCuidado(now),productos:0,ultimoProductoAt:now}));
  const paisaje=crearPaisaje(),obstaculos:EstadoGranja['obstaculos']=[];
  for(const s of SECTORES){
   for(let i=0;i<(s.id===0?14:28);i++){
    const x=s.x+1+(i*7+s.id*3)%18,z=s.z+1+(i*5+s.id)%14;
    if(s.id===0&&(edificios.some(e=>contiene(huella(e),x,z))||(x>=-1&&x<=1)))continue;
    if(obstaculos.some(o=>o.x===x&&o.z===z)||aguaEn(paisaje,x,z)||huecoEn(paisaje,x,z)||esSenderoGranja(x,z))continue;
    const tipo=i===0&&s.id?'ruina':(['maleza','arbol','roca','maleza'] as const)[i%4];
    const gigante=tipo==='arbol'&&i===13,hp= gigante?24:VIDA_RECURSO[tipo];
    obstaculos.push({id:`obstaculo_${s.id}_${i}`,tipo,x,z,sectorId:s.id,hp,hpMax:hp,regeneraEn:null,...(gigante?{gigante:true}:{})});
   }
  }
  const inventario={...Object.fromEntries(HERRAMIENTAS_INICIALES.map(h=>['herramienta_'+h,1])),pan:3,semilla_zanahoria:12,semilla_trigo:6,semilla_fresa:4,semilla_pasto:8,heno:20,madera:12,piedra:8,creacion_banco:1,lombriz:8};
  obstaculos.push(...nodosExteriores());
  return {...crearBarra(),correo:crearCorreo(),vidaSocial:crearVidaSocial(),encargos:crearEncargos(),pueblo:crearPuebloEstado(),obras:crearObras(),compania:crearCompania(),ganaderia:crearGanaderia('corral_inicial'),habilidades:crearHabilidades(),frutales:[],invernaderos:[],jornada:crearJornada(420),tiempo:crearTiempo(now),envios:{version:1,cajas:[crearCajaEnvio('envio_inicial')]},paisaje,produccion:crearProduccion(now),aventura:crearAventura(),posicionAventura:null,version:5,revision:0,ultimoTiempo:now,inicioTiempo:now,monedas:420,inventario,casillasInventario:distribuirInventario(inventario).casillas,almacenMigracion:{},nivelesHerramienta:Object.fromEntries(HERRAMIENTAS_MEJORABLES.map(h=>[h,0])),mejoraHerramienta:null,servicio:null,drops:[],ultimoGolpeAt:0,herramienta:'azada',personaje:'ella',sectorIds:[0],edificios,obstaculos,parcelas:[],animales,estadisticas:{},misionesCompletadas:[],desbloqueos:['especie_gallina'],tokensCasa:[],zona:'granja',interior:null,vida:100,energia:100,enemigo:0,nivelMina:1,ayudante:null,secuencia:0};
 }
 private random(){const r=this.azar();return Number.isFinite(r)?Math.max(0,Math.min(.999999999,r)):0.5}
 private id(prefijo:string){return `${prefijo}_${++this.estado.secuencia}`}
 private contar(clave:string,n=1){this.estado.estadisticas[clave]=(this.estado.estadisticas[clave]||0)+n}
 private experiencia(h:Habilidad,n:number){ganarExperiencia(this.estado.habilidades,h,n)}
 costeEnergia(h=this.estado.herramienta,base=1){return costeHerramienta(this.estado.habilidades,h,base)}
 private agregar(id:string,n:number,calidad?:Calidad){const casillas=cambiarCantidad(this.estado.casillasInventario,id,n,calidad);if(!casillas)throw new MochilaLlena('La mochila está llena. Libera una casilla o combina pilas.');this.estado.casillasInventario=casillas;this.estado.inventario=resumirCasillas(casillas);this.sincronizarSeleccion()}
 nivelFabricacion(){return Math.max(0,...Object.values(this.estado.nivelesHerramienta))}
 nodosProduccion(){const p=this.estado.produccion;return [...p.cofres,...p.maquinas,...p.estructuras]}
 contextoProduccion(){return {casillas:this.estado.casillasInventario,habilidades:this.estado.habilidades,nivel:this.nivelFabricacion(),desbloqueos:this.estado.desbloqueos,zona:this.estado.zona,ahora:this.estado.ultimoTiempo}}
 rutasAventura(){return opcionesAventura({desbloqueos:this.estado.desbloqueos,construcciones:this.estado.produccion.estructuras.map(n=>n.articulo),nivelPico:this.nivelHerramienta('pico')})}
 pasoAventura(dt:number,x:number,z:number){
  const s=this.estado;if(!s.aventura.destinoActual||!finito(x,-1000,1000)||!finito(z,-1000,1000))return {dano:0,avisos:[] as string[]};
  const r=stepAventura(s.aventura,dt,{x,z,vida:s.vida,defensa:this.bonos().defensa});
  s.vida=Math.max(0,s.vida-r.dano);s.posicionAventura=s.aventura.destinoActual?{x,z}:null;
  if(r.dano)s.revision++;if(r.salidaSegura){s.vida=Math.max(35,s.vida);s.energia=Math.max(25,s.energia);s.revision++;}
  return r;
 }
 seleccionado(){return objetoActivo(this.estado)}
 registrarPosicion(x:number,z:number){const s=this.estado;if(!s.interior&&!s.servicio&&!s.aventura.destinoActual&&dentroDeZona(s.zona,x,z))s.posicionExterior={zona:s.zona,x,z};posicionMontada(s,x,z);}
 bonos(){const b=bonosEquipo(this.estado,this.estado.ultimoTiempo),h=efectosHabilidades(this.estado.habilidades);return {...b,ataque:b.ataque+(h.ataque??0)+Math.floor(nivelHabilidad(this.estado.habilidades,'combate')/2),defensa:b.defensa+(h.defensa??0)}}
 private sincronizarSeleccion(){const s=this.estado,h=herramientaDeObjeto(this.seleccionado()?.articulo);s.herramienta=this.herramientaDisponible(h)?h:'mano';}
 nivelHerramienta(h=this.estado.herramienta){return this.estado.nivelesHerramienta[h]||0}
 herramientaDisponible(h=this.estado.herramienta){return this.estado.mejoraHerramienta?.herramienta!==h}
 nodosActuales(){return this.estado.obstaculos.filter(o=>(o.zona||'granja')===this.estado.zona&&o.hp>0&&(o.zona!=='mina'||o.nivelMina===this.estado.nivelMina))}
 private cerca(x:number,z:number,xJugador:number,zJugador:number,alcance:number){return finito(xJugador,-1000,1000)&&finito(zJugador,-1000,1000)&&Math.hypot(x+.5-xJugador,z+.5-zJugador)<=alcance}
 private crearDrops(recursos:Record<string,number>,x:number,z:number){const s=this.estado;const partes=Object.entries(recursos).flatMap(([articulo,cantidad],i)=>{const filas:Drop[]=[];for(let n=cantidad;n>0;n-=MAX_PILA)filas.push({id:this.id('drop'),articulo,cantidad:Math.min(n,MAX_PILA),x:x+.5+(i%3-1)*.28,z:z+.5+Math.floor(i/3)*.25,zona:s.zona,...(s.zona==='mina'?{nivelMina:s.nivelMina}:{})});return filas});if(s.drops.length+partes.length>MAX_DROPS)throw new MochilaLlena('Hay demasiados objetos en el suelo. Recoge algunos antes de continuar.');s.drops.push(...partes)}
 private puedePagar(receta:Record<string,number>,n=1){return Object.entries(receta).every(([k,v])=>(this.estado.inventario[k]||0)>=v*n)}
 private pagar(receta:Record<string,number>,n=1){for(const [k,v] of Object.entries(receta))this.agregar(k,-v*n)}
 private posee(id:string){if(id==='companeros'||id==='montura')return companiaDisponible(this.estado,id==='montura'?'caballo':'gato');return id.startsWith('especie_')&&Object.hasOwn(ESPECIES,id.slice(8))?especieDisponible(this.estado,id.slice(8) as Species):this.estado.desbloqueos.includes(id)}
 articuloDisponible(id:string){const d=articulo(id);return !!d&&(!d.requiere||this.posee(d.requiere));}
 especieDisponible(especie:Species){return especieDisponible(this.estado,especie)}
 private cercaAnimal(a:Animal,x:number,z:number){const p=posicionAnimal(this.estado,a);return animalVisible(this.estado,a)&&this.estado.zona==='granja'&&!this.estado.servicio&&(!this.estado.interior||this.estado.interior===a.edificioId)&&finito(x,-1000,1000)&&finito(z,-1000,1000)&&Math.hypot(p.x-x,p.z-z)<=2.8;}
 private nacimiento(especie:Species,genoma:Genome,sexo:'hembra'|'macho',edificioId:string,nombre:string,now:number){this.estado.animales.push({id:this.id('animal'),nombre:nombre.slice(0,32),rutina:crearRutina(this.estado.animales.filter(a=>a.edificioId===edificioId).length,'refugio',capacidadRefugio(this.estado.edificios.find(b=>b.id===edificioId)!)),especie,sexo,genoma,nacimiento:now,edadDias:0,ultimoCruce:null,edificioId,cuidado:crearCuidado(now),productos:0,ultimoProductoAt:now});this.contar('nacimientos');this.experiencia('agricultura',25);const f=fenotipo(especie,genoma);if(f.fantasia)this.contar('nacimiento_'+f.fantasia);}
 private tiempo(){return Math.max(this.estado.ultimoTiempo,this.ahora())}
 pasoCompania(segundos:number,x:number,z:number,direccion?:number){this.paseosCompania.paso(this.estado,segundos,{x,z,direccion});}
 pasoGanado(segundos:number){const s=this.estado;if(avanzarRutinas(s,segundos,b=>tiempoRegion(tiempoDia(s.tiempo,s.jornada.diasCompletados),b.clima)))s.revision++;}
 pausarAnimal(id:string){const a=this.estado.animales.find(a=>a.id===id);if(a)pausaAnimal(a);}
 calendario(){return relojValle(this.estado.jornada)}
 avanzarJornada(segundos:number){if(Number.isFinite(segundos)&&segundos>0&&!this.estado.jornada.resumenPendiente&&(this.jornadaLluvia!==this.estado.jornada.diasCompletados||this.revisionLluvia!==this.estado.revision))this.atenderLluvia();avanzarReloj(this.estado.jornada,segundos);}
 pronostico(){return pronostico(this.estado);}
 meteorologia(x=0,z=0){const s=this.estado;return tiempoRegion(tiempoDia(s.tiempo,s.jornada.diasCompletados),biomaZona(s.zona,s,x,z));}
 private atenderLluvia(){
  const s=this.estado,dia=s.jornada.diasCompletados,t=tiempoDia(s.tiempo,dia);this.jornadaLluvia=dia;this.revisionLluvia=s.revision;if(!lluviaRiega(t))return;let cambios=0;
  for(const a of s.compania.animales){const b=s.edificios.find(b=>b.id===a.edificioId);if(a.tipo!=='caballo'&&b&&a.aguaDia!==dia&&lluviaRiega(tiempoRegion(t,this.climaDeCelda(b.x,b.z)))){a.aguaDia=dia;cambios++;}}
  for(const p of s.parcelas){if(p.cuidado?.status!=='creciendo'||p.campo?.riegoDia===dia||!lluviaRiega(tiempoRegion(t,this.climaDeCelda(p.x,p.z))))continue;
   p.cuidado=regarCultivo(p.cuidado,s.ultimoTiempo);if(p.cuidado.status!=='creciendo')continue;p.campo??=crearCampo();p.campo.riegoDia=dia;cambios++;
  }
  for(const f of s.frutales){if(f.edificioId||f.cuidado.status!=='creciendo'||f.riegoDia===dia||!lluviaRiega(tiempoRegion(t,this.climaDeCelda(f.x,f.z))))continue;regarFrutal(f,dia,s.ultimoTiempo);if(f.cuidado.status==='creciendo')cambios++;}
  if(cambios){s.revision++;this.contar('riego_lluvia',cambios);}this.revisionLluvia=s.revision;
 }
 getMisionActual():Mision|undefined{return MISIONES.find(m=>!this.estado.misionesCompletadas.includes(m.id))}
 progresoMision(m=this.getMisionActual()){return m?Object.entries(m.requisitos).map(([clave,total])=>({clave,total,actual:Math.min(total,this.estado.estadisticas[clave]||0)})):[]}
 resumenAnimal(a:Animal){const now=this.estado.ultimoTiempo;return {...fenotipo(a.especie,a.genoma),...estadoAnimal(a.cuidado,now),adulto:a.edadDias>=Math.ceil(ESPECIES[a.especie].adultoMs/DIA),diasAdulto:Math.max(0,Math.ceil(ESPECIES[a.especie].adultoMs/DIA)-a.edadDias),horasCruce:Math.max(0,((a.ultimoCruce??-Infinity)+DIA-now)/HORA)}}
 invernaderoActual(){return this.estado.invernaderos.find(i=>i.edificioId===this.estado.interior);}
 parcelasActuales(){return this.invernaderoActual()?.parcelas??this.estado.parcelas;}
 frutalesActuales(){if(this.estado.interior&&!this.invernaderoActual())return [];return this.estado.frutales.filter(f=>f.edificioId=== (this.invernaderoActual()?.edificioId));}
 private todasParcelas(){return [...this.estado.parcelas,...this.estado.invernaderos.flatMap(i=>i.parcelas)];}
 private sueloAgricola(){return this.estado.zona==='granja'&&!this.estado.servicio&&(!this.estado.interior||!!this.invernaderoActual());}
 private celdaAgricola(x:number,z:number){return this.invernaderoActual()?camaInvernadero(x,z)&&!this.frutalesActuales().some(f=>f.x===x&&f.z===z):this.celdaLibre(x,z);}
 frutalDespejado(f:Frutal){
  const recinto=f.edificioId?this.estado.invernaderos.find(i=>i.edificioId===f.edificioId):null;if(f.edificioId&&!recinto)return false;
  for(let z=f.z-1;z<=f.z+1;z++)for(let x=f.x-1;x<=f.x+1;x++){if(x===f.x&&z===f.z)continue;if(recinto?!dentroInvernadero(x,z)||recinto.parcelas.some(p=>p.x===x&&p.z===z):!this.celdaLibre(x,z)||this.estado.parcelas.some(p=>p.x===x&&p.z===z))return false;}return true;
 }
 climaDeCelda(x:number,z:number):Clima{return biomaCelda(this.estado,x,z);}
 /** Como en Stardew: cada noche brota maleza y salen piedritas en la granja (solo en terreno propio, libre y sin
  * tapar caminos, cultivos, construcciones ni el sendero). Nunca pasa de un tope, para que no se vuelva una selva. */
 brotarMaleza(ronda=0){const s=this.estado,dia=s.jornada.diasCompletados,TOPE=40*s.sectorIds.length,granja=s.obstaculos.filter(o=>(o.zona??'granja')==='granja'&&o.hp>0&&this.celdaPropia(o.x,o.z)).length;if(granja>=TOPE)return;
  let semilla=(dia*2654435761+ronda*40503+s.sectorIds.length*97)>>>0;const azar=()=>{semilla=(semilla*1664525+1013904223)>>>0;return semilla/4294967296;};
  /* El patio de enfrente de la cabaña (donde se empieza a sembrar) se queda limpio */const ocupada=(x:number,z:number)=>(x>=-5&&x<=9&&z>=-4&&z<=9)||s.obstaculos.some(o=>(o.zona??'granja')==='granja'&&o.x===x&&o.z===z)||s.parcelas.some(p=>p.x===x&&p.z===z)||s.frutales.some(f=>!f.edificioId&&Math.abs(f.x-x)<=1&&Math.abs(f.z-z)<=1)||s.edificios.some(e=>{const h=huella(e);return x>=h.x-1&&x<h.x+h.ancho+1&&z>=h.z-1&&z<h.z+h.fondo+1;})||[...s.produccion.cofres,...s.produccion.maquinas,...s.produccion.estructuras].some(n=>n.zona==='granja'&&Math.abs(n.x-x)<=1&&Math.abs(n.z-z)<=1)||aguaEn(s.paisaje,x,z)||!!huecoEn(s.paisaje,x,z)||esSenderoGranja(x,z)||celdaReservadaObra(s,x,z,false);
  const cuantos=Math.min(TOPE-granja,3+Math.floor(azar()*4));let k=0;
  for(let intento=0;intento<cuantos*12&&k<cuantos;intento++){const sec=SECTORES.find(x=>x.id===s.sectorIds[Math.floor(azar()*s.sectorIds.length)]);if(!sec)continue;const x=sec.x+Math.floor(azar()*sec.ancho),z=sec.z+Math.floor(azar()*sec.fondo);if(!this.celdaPropia(x,z)||ocupada(x,z))continue;
   const v=azar(),tipo=ronda&&v>.86?'arbol':v<.62?'maleza':'roca',hp=VIDA_RECURSO[tipo];s.obstaculos.push({id:ronda?`monte_${ronda}_${k}`:`brote_${dia}_${k}`,tipo,x,z,sectorId:sec.id,hp,hpMax:hp,regeneraEn:null});k++;}
 }
 celdaPropia(x:number,z:number){const s=sectorDeCelda(x,z);return entero(x)&&entero(z)&&!!s&&this.estado.sectorIds.includes(s.id)}
 celdaLibre(x:number,z:number,ignorarEdificio?:string){return !celdaReservadaObra(this.estado,x,z)&&!aguaEn(this.estado.paisaje,x,z)&&!huecoEn(this.estado.paisaje,x,z)&&!esSenderoGranja(x,z)&&!this.nodosProduccion().some(n=>n.id!==ignorarEdificio&&n.zona==='granja'&&contiene(huellaProduccion(n),x,z))&&this.celdaPropia(x,z)&&!this.estado.frutales.some(f=>!f.edificioId&&f.x===x&&f.z===z)&&!this.estado.obstaculos.some(o=>(o.zona||'granja')==='granja'&&o.hp>0&&o.x===x&&o.z===z)&&!this.estado.edificios.some(e=>e.id!==ignorarEdificio&&contiene(huella(e),x,z))}
 pecesDisponibles(cebo?:string):PezDef[]{const {hora,estacion}=this.calendario();return PECES.filter(p=>p.zonas.includes(this.estado.zona)&&p.estaciones.includes(estacion)&&(!p.tiempos||p.tiempos.includes(this.meteorologia()))&&(!cebo||p.cebo===cebo)&&(p.desde<p.hasta?hora>=p.desde&&hora<p.hasta:hora>=p.desde||hora<p.hasta))}
 private climaAnimal(a:Pick<Animal,'especie'|'genoma'>){const f=fenotipo(a.especie,a.genoma).fantasia;return f?FANTASIAS[f]?.clima||'templado':'templado'}
 private habitatDisponible(especie:Species,genoma:Genome,preferido?:string){
  const clima=this.climaAnimal({especie,genoma});
  return this.estado.edificios.find(e=>(!preferido||e.id===preferido)&&e.especie===especie&&(clima==='templado'||e.clima===clima)&&this.estado.animales.filter(a=>a.edificioId===e.id).length+reservaRefugio(this.estado.ganaderia,e.id)<capacidadRefugio(e));
 }
 private avanzarObras():ObraTerminada[]{
  const s=this.estado,o=obraActiva(s);if(!o)return [];const d=articulo(o.articulo)!,coste=costeObra(d,o.nivel);o.jornadas++;if(o.jornadas<coste.noches)return [];
  let edificioId=o.edificioId!;if(o.tipo==='nueva'){edificioId=o.id;const p=o.lugar!;s.edificios.push({id:edificioId,articulo:d.id,...p,especie:d.especie,clima:d.clima,pasto:0,ultimoPastoAt:s.ultimoTiempo});if(d.id==='invernadero')s.invernaderos.push(crearInvernadero(edificioId));this.contar('construir');}
  else {const b=s.edificios.find(b=>b.id===edificioId)!;b.nivel=o.nivel;this.contar('ampliar_refugio');}
  s.obras.encargos=s.obras.encargos.filter(e=>e.id!==o.id);this.contar('obras_terminadas');return [{edificioId,articulo:o.articulo,tipo:o.tipo,nivel:o.nivel}];
 }
 previsualizarConstruccion(id:string,x:number,z:number,giro=0,ignorar?:string){const a=articulo(id);return a&&a.categoria!=='insumo'?this.lugarConstruccion(a,x,z,giro,ignorar):mal('Construcción desconocida.');}
 private lugarConstruccion(a:Articulo,x:number,z:number,giro:number,ignorar?:string):Resultado {
  if(!entero(x)||!entero(z)||!entero(giro,0,3))return mal('La posición debe ser una casilla entera.');
  const h=huella({articulo:a.id,x,z,giro});
  for(let dz=0;dz<h.fondo;dz++)for(let dx=0;dx<h.ancho;dx++){
   const xx=x+dx,zz=z+dz;
   if(!this.celdaLibre(xx,zz,ignorar)||this.estado.parcelas.some(p=>p.x===xx&&p.z===zz))return mal('Necesitas todo el edificio y su corral sobre terreno propio y despejado.');
  }
  // A one-cell apron outside the door stays accessible after placing or moving anything.
  const entrada=(e:Pick<Edificio,'x'|'z'|'giro'|'articulo'>)=>{const hh=huella(e);return e.giro===0?{x:e.x+Math.floor(hh.ancho/2),z:e.z+hh.fondo}:e.giro===1?{x:e.x-1,z:e.z+Math.floor(hh.fondo/2)}:e.giro===2?{x:e.x+Math.floor(hh.ancho/2),z:e.z-1}:{x:e.x+hh.ancho,z:e.z+Math.floor(hh.fondo/2)}};
  if(a.categoria==='refugio'||a.categoria==='casa'||a.id==='invernadero'||a.id==='hogar_mascota'){
   const p=entrada({articulo:a.id,x,z,giro});
   if(!this.celdaLibre(p.x,p.z,ignorar)||this.estado.parcelas.some(c=>c.x===p.x&&c.z===p.z))return mal('Deja una casilla libre delante de la entrada.');
  }
  for(const e of this.estado.edificios){if(e.id===ignorar)continue;const def=articulo(e.articulo)!;if(def.categoria==='casa'||def.categoria==='refugio'||def.id==='invernadero'||def.id==='hogar_mascota'){const p=entrada(e);if(contiene(h,p.x,p.z))return mal('Ese lugar bloquea la entrada de otro edificio.')}}
  return bien('Lugar disponible.');
 }
 actualizar(now=this.ahora()):void{
  if(!finito(now))return;const s=this.estado;now=Math.max(s.ultimoTiempo,now);if(now===s.ultimoTiempo)return;
  // Only finite provisions are processed. With capped pasture and a 72h contract, all
  // active feeding events finish within 32 days; a final reconciliation handles long absences.
  const inicio=s.ultimoTiempo;const limite=Math.min(now,inicio+32*DIA);
  const instantes=new Set<number>([limite]);let t=(Math.floor((inicio-s.inicioTiempo)/HORA)+1)*HORA+s.inicioTiempo;
  for(;t<=limite;t+=HORA)instantes.add(t);
  // Preserve each service's own phase. A contract bought between whole hours
  // must receive the same turns online and after one long offline update.
  const programar=(desde:number,paso:number,hasta=limite)=>{const primero=desde+Math.max(1,Math.floor((inicio-desde)/paso)+1)*paso;for(let at=primero;at<=Math.min(hasta,limite);at+=paso)instantes.add(at)};
  for(const e of s.edificios)if(e.especie||e.articulo==='establo')programar(e.ultimoPastoAt,8*HORA);
  if(s.ayudante)programar(s.ayudante.ultimoTurno,6*HORA,s.ayudante.hasta);
  for(const a of s.animales)programar(a.ultimoProductoAt,ESPECIES[a.especie].periodoMs);
  const aspersores=s.produccion.estructuras.filter(n=>obtenerObjeto(n.articulo)?.aspersor);if(aspersores.length||s.invernaderos.some(i=>i.riegoAutomatico))programar(s.inicioTiempo,6*HORA);
  const regarAutomaticos=(at:number,continuo=false)=>{
   const cubierto=(x:number,z:number)=>aspersores.some(n=>n.zona==='granja'&&Math.max(Math.abs(n.x-x),Math.abs(n.z-z))<=(obtenerObjeto(n.articulo)?.aspersor?.radio??0));
   const regar=(p:EstadoGranja['parcelas'][number])=>{if(p.cuidado?.status==='creciendo'){p.cuidado=continuo?{...p.cuidado,lastWateredAt:at,lastEvaluatedAt:at}:regarCultivo(p.cuidado,at);if(p.cuidado.status==='creciendo'){p.campo??=crearCampo();p.campo.riegoDia=s.jornada.diasCompletados;}}};
   const regarArbol=(f:Frutal)=>{if(continuo&&f.cuidado.status==='creciendo'){f.cuidado={...f.cuidado,lastWateredAt:at,lastEvaluatedAt:at};f.riegoDia=s.jornada.diasCompletados;}else regarFrutal(f,s.jornada.diasCompletados,at);};
   for(const p of s.parcelas)if(cubierto(p.x,p.z))regar(p);
   for(const f of s.frutales)if(!f.edificioId&&cubierto(f.x,f.z))regarArbol(f);
   for(const i of s.invernaderos.filter(i=>i.riegoAutomatico)){i.parcelas.forEach(regar);for(const f of s.frutales.filter(f=>f.edificioId===i.edificioId))regarArbol(f);}
  };
  const eventos=[...instantes].sort((a,b)=>a-b);
  for(const at of eventos){
   if((at-s.inicioTiempo)%(6*HORA)===0)regarAutomaticos(at);
   for(const e of s.edificios.filter(e=>e.especie||e.articulo==='establo')){
    if(at-e.ultimoPastoAt>=8*HORA){
     const pasos=Math.floor((at-e.ultimoPastoAt)/(8*HORA));e.ultimoPastoAt+=pasos*8*HORA;
     for(const c of s.compania.animales.filter(c=>c.tipo==='caballo'&&c.edificioId===e.id&&c.posicion.zona==='granja')){const p=hogarCompania(e,c.tipo);if(e.pasto>=1&&Math.hypot(c.posicion.x-p.x,c.posicion.z-p.z)<=2){e.pasto-=1;c.cuidado=alimentar(c.cuidado,at);}}
     for(const a of s.animales.filter(a=>a.edificioId===e.id)){if(e.pasto>=1){e.pasto-=1;a.cuidado=alimentar(a.cuidado,at)}else if((e.henoReserva??0)>=1){e.henoReserva=(e.henoReserva??0)-1;if(e.henoCalidades){const q=e.henoCalidades.findIndex(n=>n>0);e.henoCalidades[q]--;}a.cuidado=alimentar(a.cuidado,at)}}
    }
   }
   if(s.ayudante&&at<=s.ayudante.hasta&&at-s.ayudante.ultimoTurno>=6*HORA){
    s.ayudante.ultimoTurno=at;
    for(const c of s.compania.animales){const alimento=COMPANEROS[c.tipo].alimento;if((s.inventario[alimento]??0)>0){this.agregar(alimento,-1);c.cuidado=alimentar(c.cuidado,at);}c.cuidado=consentir(c.cuidado,'cuento',at);}
    for(const f of s.frutales)regarFrutal(f,s.jornada.diasCompletados,at);
   for(const a of s.animales){if((s.inventario.heno||0)>0){this.agregar('heno',-1);a.cuidado=alimentar(a.cuidado,at)}a.cuidado=consentir(a.cuidado,'cuento',at)}
    for(const p of this.todasParcelas())if(p.cuidado){p.cuidado=regarCultivo(p.cuidado,at);if(p.cuidado.status==='creciendo'){p.campo??=crearCampo();p.campo.riegoDia=s.jornada.diasCompletados;}}
   }
   for(const a of s.animales){
    a.cuidado=reconciliarAnimal(a.cuidado,at);
    const periodo=ESPECIES[a.especie].periodoMs;
    if(at-a.ultimoProductoAt>=periodo){
     const intervalos=Math.floor((at-a.ultimoProductoAt)/periodo);
     if(this.resumenAnimal(a).adulto&&(!['vaca','cabra','gallina','pato','avestruz','dinosaurio'].includes(a.especie)||a.sexo==='hembra')&&estadoAnimal(a.cuidado,at).puedeProducir)a.productos=Math.min(5,a.productos+intervalos);
     a.ultimoProductoAt+=intervalos*periodo;
    }
   }
  }
  if(now>limite){
   // El riego permanente continúa tras el límite de provisiones sin simular crecimiento.
   regarAutomaticos(s.inicioTiempo+Math.floor((now-s.inicioTiempo)/(6*HORA))*6*HORA,true);
   for(const a of s.animales){a.cuidado=reconciliarAnimal(a.cuidado,now);a.ultimoProductoAt=now}}
  // El agua se reconcilia en cada evento de riego; la ausencia restante solo evalúa sequía una vez.
  for(const p of this.todasParcelas())if(p.cuidado)p.cuidado=reconciliarCultivo(p.cuidado,now);for(const f of s.frutales)f.cuidado=reconciliarCultivo(f.cuidado,now);
  if(s.ayudante&&now>s.ayudante.hasta)s.ayudante=null;
  for(const nodo of s.obstaculos)if(nodo.hp===0&&nodo.regeneraEn!==null&&now>=nodo.regeneraEn){nodo.hp=nodo.hpMax;nodo.regeneraEn=null;s.revision++;}
  const produccion=avanzarProduccion(s.produccion,now,{...this.contextoProduccion(),ahora:now});
  s.produccion=produccion.estado;s.casillasInventario=produccion.casillas;s.inventario=resumirCasillas(produccion.casillas);
  for(const [id,n]of Object.entries(produccion.producidos)){this.contar('fabricar_'+id,n);this.contar('fabricar',n);}
  actualizarCompania(s,now);s.ultimoTiempo=now;s.buffs=s.buffs.filter(b=>b.hasta>now);this.sincronizarSeleccion();
 }
 actuar(a:Accion):Resultado {
  this.actualizar();const anterior=clonar(this.estado);
  try{const resultado=this.ejecutar(a);if(!resultado.ok)this.estado=anterior;else {if(a.tipo!=='herramienta')this.sincronizarSeleccion();if(a.tipo!=='dormir')this.atenderLluvia();const experiencia=HABILIDADES.filter(h=>this.estado.habilidades.experiencia[h]>anterior.habilidades.experiencia[h]).map(h=>({habilidad:h,cantidad:this.estado.habilidades.experiencia[h]-anterior.habilidades.experiencia[h],antes:nivelHabilidad(anterior.habilidades,h),despues:nivelHabilidad(this.estado.habilidades,h)}));if(experiencia.length)resultado.experiencia=experiencia;}return resultado}catch(e){this.estado=anterior;if(e instanceof MochilaLlena)return mal(e.message);throw e}
 }
 private ejecutar(a:Accion):Resultado {
  const s=this.estado;const now=s.ultimoTiempo;let r:Resultado;
  if(s.vidaSocial.actual&&a.tipo!=='social')return mal('Termina o cancela el encuentro antes de continuar.');
  if(s.jornada.resumenPendiente&&a.tipo!=='continuar_dia')return mal('Lee el resumen de la jornada y comienza la mañana.');
  if(s.aventura.destinoActual&&!['seleccionar_casilla','fila_barra','herramienta','personaje','mover_item','consumir','equipar_objeto','desequipar_objeto','accion_aventura','salir_aventura','descender_aventura'].includes(a.tipo))return mal('Regresa de la expedición antes de realizar esa actividad.');
  if(['golpear','limpiar','labrar','regar','alisar','combatir','pescar','extraer'].includes(a.tipo)&&!this.herramientaDisponible())return mal('Esa herramienta está en la herrería. Retírala cuando termine el encargo.');
  if(s.compania.montada&&!['compania','viajar','seleccionar_casilla','fila_barra','herramienta','personaje','mover_item','consumir','equipar_objeto','desequipar_objeto','recoger_drop'].includes(a.tipo))return mal('Desmonta para entrar en edificios o trabajar con las herramientas.');
  if(s.zona==='pueblo'&&s.servicio&&(['comprar','craftear','comprar_objeto','adoptar','comprar_huevo_fertil','ampliar_mochila','vender','vender_pila','mejorar_herramienta','retirar_mejora','encargar_obra','ampliar_refugio','cancelar_obra'].includes(a.tipo)||(a.tipo==='compania'&&a.accion.tipo==='adoptar'))){const horario=atencionServicio(s.servicio,s.jornada.diasCompletados,s.jornada.minutos);if(!horario.abierto)return mal(horario.mensaje);}
  // Actions validate all requirements before spending currency, stock, energy or RNG.
  switch(a.tipo){
   case 'correo':r=actuarCorreo(s,a.accion,a.xJugador,a.zJugador);break;
   case 'social':r=actuarSocial(s,a.accion,a.xJugador,a.zJugador);break;
   case 'encargo':r=actuarEncargo(s,a.accion,a.xJugador,a.zJugador);break;
   case 'hablar_aldeano':case 'regalar_aldeano':{
    if(a.tipo==='regalar_aldeano'&&!entero(a.casilla,0,s.casillasInventario.length-1))return mal('Elige una casilla válida de tu mochila.');
    r=conversar(s,a.npcId,a.xJugador,a.zJugador,lluviaRiega(tiempoDia(s.tiempo,s.jornada.diasCompletados)),a.tipo==='regalar_aldeano'?a.casilla:undefined);
    if(r.ok){if(a.tipo==='regalar_aldeano')celebrarRegalo(s,a.npcId,r);if(r.conversacion?.primeraCharla)this.contar('vecinos_conocidos');if(a.tipo==='regalar_aldeano')this.contar('regalos_'+a.npcId);else if(r.conversacion?.puntos)this.contar('conversar_'+a.npcId);s.estadisticas['amistad_'+a.npcId]=s.pueblo.relaciones.find(n=>n.id===a.npcId)!.amistad;}break;
   }
   case 'compania':r=actuarCompania(s,a.accion,a.xJugador,a.zJugador,{id:()=>this.id('companero'),pagar:id=>this.agregar(id,-1),contar:id=>this.contar(id)});break;
   case 'elegir_profesion':{const error=elegirProfesion(s.habilidades,a.profesion);if(error)return mal(error);r=bien('Profesión elegida. Sus beneficios ya están activos.');break;}
   case 'plantar_frutal':{
    if(!this.sueloAgricola())return mal('Planta frutales en tu granja o dentro del invernadero.');const d=frutalDef(a.frutal),i=this.invernaderoActual();
    if(!d||!entero(a.x)||!entero(a.z)||!this.cerca(a.x,a.z,a.xJugador,a.zJugador,2.4))return mal('Elige un plantón válido y acércate a la casilla.');
    if(this.frutalesActuales().some(f=>Math.max(Math.abs(f.x-a.x),Math.abs(f.z-a.z))<3))return mal('Deja tres casillas entre los centros de los frutales.');
    if(i?camaInvernadero(a.x,a.z)||!dentroInvernadero(a.x,a.z):!this.celdaLibre(a.x,a.z))return mal('Planta en terreno libre; dentro del invernadero usa el anillo exterior.');
    if(this.parcelasActuales().some(p=>p.x===a.x&&p.z===a.z))return mal('Alisa el terreno antes de plantar un árbol.');
    if(!d.climas.includes(i?CLIMA_INVERNADERO:this.climaDeCelda(a.x,a.z)))return mal('Este frutal no corresponde al clima del terreno.');
    const f=crearFrutal(this.id('frutal'),d.id,a.x,a.z,now,i?.edificioId);if(!this.frutalDespejado(f))return mal('Despeja las nueve casillas del espacio de 3 × 3 antes de plantar.');
    if(s.frutales.length>=400)return mal('La granja admite hasta 400 frutales.');if(!this.puedePagar({[d.planton]:1}))return mal('Consigue ese plantón en la tienda de semillas.');
    this.pagar({[d.planton]:1});s.frutales.push(f);this.contar('plantar_frutal');r=bien(d.nombre+' plantado. Riega y mantén espacio libre para que crezca al dormir.');break;
   }
   case 'recoger_frutal':case 'golpear_frutal':{
    const f=this.frutalesActuales().find(f=>f.id===a.id);if(!this.sueloAgricola()||!f||!this.cerca(f.x,f.z,a.xJugador,a.zJugador,2.4))return mal('Acércate al frutal de este lugar.');
    if(a.tipo==='recoger_frutal'){if(!f.frutos)return mal('Aún no hay fruta para recoger.');const d=frutalDef(f.tipo)!,n=f.frutos;this.agregar(d.producto,n);f.frutos=0;this.contar('fruta_recogida',n);this.experiencia('agricultura',n*8);this.contar('cosecha_'+d.id,n);r=bien('Recoges '+n+' '+d.producto+'.');break;}
    if(s.herramienta!=='hacha'||!this.herramientaDisponible())return mal('Usa el hacha para talar este frutal.');if(now-s.ultimoGolpeAt<380)return mal('Termina el golpe antes de continuar.');if(s.energia<this.costeEnergia())return mal('Necesitas energía para talar.');
    const hpMax=vidaFrutal(f),dano=1+this.nivelHerramienta('hacha')*2;f.golpes+=dano;s.ultimoGolpeAt=now;s.energia=Math.max(0,s.energia-this.costeEnergia());const destruido=f.golpes>=hpMax;
    if(destruido){const madera=mejorarBotin(s.habilidades,{madera:f.cuidado.status==='maduro'?8:2},'arbol').madera;if(f.cuidado.status==='maduro')this.experiencia('recoleccion',12);if(f.edificioId){this.agregar('madera',madera);if(f.frutos)this.agregar(frutalDef(f.tipo)!.producto,f.frutos);}else this.crearDrops({madera,...(f.frutos?{[frutalDef(f.tipo)!.producto]:f.frutos}:{})},f.x,f.z);s.frutales=s.frutales.filter(x=>x.id!==f.id);this.contar('frutales_talados');}
    r={...bien(destruido?'Frutal talado. Recoge su madera.':'El tronco recibe el golpe.'),impacto:{obstaculoId:f.id,x:f.x,z:f.z,tipo:'arbol',hp:Math.max(0,hpMax-f.golpes),hpMax,destruido,dano}};break;
   }
   case 'instalar_riego_invernadero':{
    const i=this.invernaderoActual(),coste=COSTE_RIEGO_INVERNADERO;if(!i||i.edificioId!==a.edificioId)return mal('Instala el riego desde el interior del invernadero.');if(i.riegoAutomatico)return mal('El riego ya está instalado.');if(s.monedas<coste.monedas||!this.puedePagar(coste.materiales))return mal('El riego requiere 300 monedas, 3 lingotes de hierro y 6 vidrios.');this.pagar(coste.materiales);s.monedas-=coste.monedas;i.riegoAutomatico=true;r=bien('Riego instalado: mantiene humedad cada 6 horas reales y riega al dormir, sin adelantar crecimiento.');break;
   }
   case 'restaurar_invernadero':{
    const o=s.obstaculos.find(o=>o.id===a.obstaculoId&&o.tipo==='ruina'&&(o.zona??'granja')==='granja'),d=articulo('invernadero')!;
    if(!o||s.zona!=='granja'||s.interior||s.servicio||!this.cerca(o.x,o.z,a.xJugador,a.zJugador,2.4))return mal('Acércate a una ruina de la granja para restaurarla.');
    if(s.invernaderos.length+s.obras.encargos.filter(o=>o.tipo==='nueva'&&o.articulo==='invernadero').length>=MAX_INVERNADEROS)return mal('Ya tienes el máximo de 30 invernaderos.');s.obstaculos=s.obstaculos.filter(x=>x.id!==o.id);const permiso=this.lugarConstruccion(d,o.x,o.z,0);if(!permiso.ok)return permiso;
    if(!this.puedePagar(d.receta))return mal('La restauración requiere 30 maderas, 15 cristales y 5 minerales de hierro.');this.pagar(d.receta);const id=this.id('edificio');s.edificios.push({id,articulo:d.id,x:o.x,z:o.z,giro:0,clima:d.clima,pasto:0,ultimoPastoAt:now});s.invernaderos.push(crearInvernadero(id));this.contar('invernaderos_restaurados');r=bien('Invernadero restaurado. Camina hasta la puerta para cultivar dentro.');break;
   }
   case 'envio':{
    const e=s.edificios.find(e=>e.id===a.edificioId&&e.articulo===ARTICULO_ENVIO),c=s.envios.cajas.find(c=>c.edificioId===a.edificioId);
    if(!e||!c||s.zona!=='granja'||s.interior||s.servicio)return mal('Usa una caja de envíos en el exterior de la granja.');
    if(!this.cerca(e.x,e.z,a.xJugador,a.zJugador,3.3))return mal('Acércate a la caja para depositar o recuperar productos.');
    if(!['depositar','retirar'].includes(a.sentido))return mal('Operación de envío desconocida.');
    const t=transferirEnvio(c,s.casillasInventario,a.sentido,a.casilla,a.cantidad);if(!t.ok)return mal(t.mensaje);
    const futuras={...s.envios,cajas:s.envios.cajas.map(x=>x===c?{...c,casillas:t.casillas}:x)};
    if(a.sentido==='depositar'&&s.monedas+valorEnvios(futuras)>1e9)return mal('El envío supera el límite de monedas. Retira parte de la carga.');
    c.casillas=t.casillas;s.casillasInventario=t.mochila;s.inventario=resumirCasillas(t.mochila);
    r=bien(a.sentido==='depositar'?'Productos preparados. Cobrarás al dormir; puedes retirarlos antes.':'Productos recuperados en la mochila.');break;
   }
   case 'produccion':{
    const p=a.accion,objetos=this.nodosProduccion();
    if(p.tipo==='fabricar'&&obtenerReceta(p.recetaId)?.estacion!=='mano')return mal('Selecciona la estación y prepara allí el lote.');
    if(p.tipo!=='fabricar'&&p.tipo!=='adyacencia'){
     if(s.interior||s.servicio||s.zona!=='granja')return mal('Organiza tus máquinas y cofres en el exterior de la granja.');
     const ids=new Set<string>();if('id'in p)ids.add(p.id);if(p.tipo==='transferir')for(const ref of [p.desde,p.hasta])if(ref.tipo!=='mochila'&&ref.id)ids.add(ref.id);
     for(const id of ids){const n=objetos.find(n=>n.id===id);if(!n||n.zona!==s.zona||!this.cerca(n.x,n.z,a.xJugador,a.zJugador,3.3))return mal('Acércate al cofre o a la máquina para usarlo.');}
     if('x'in p){
      if(p.zona!=='granja')return mal('Coloca este objeto en tu granja.');
      const anterior=p.tipo==='mover_produccion'?objetos.find(n=>n.id===p.id):undefined;
      const h=huellaProduccion({articulo:'articulo'in p?p.articulo:anterior!.articulo,x:p.x,z:p.z});
      for(let z=h.z;z<h.z+h.fondo;z++)for(let x=h.x;x<h.x+h.ancho;x++)if(!this.celdaLibre(x,z,anterior?.id)||s.parcelas.some(c=>c.x===x&&c.z===z))return mal('Necesitas terreno propio, despejado y sin cultivos.');
      if(!this.cerca(p.x,p.z,a.xJugador,a.zJugador,5))return mal('Acércate al lugar donde quieres colocarlo.');
      for(const e of s.edificios){const d=articulo(e.articulo)!;if(!['casa','refugio'].includes(d.categoria)&&d.id!=='invernadero')continue;const hh=huella(e),puerta=e.giro===0?{x:e.x+Math.floor(hh.ancho/2),z:e.z+hh.fondo}:e.giro===1?{x:e.x-1,z:e.z+Math.floor(hh.fondo/2)}:e.giro===2?{x:e.x+Math.floor(hh.ancho/2),z:e.z-1}:{x:e.x+hh.ancho,z:e.z+Math.floor(hh.fondo/2)};if(contiene(h,puerta.x,puerta.z))return mal('Deja libre la entrada de la construcción.');}
     }
    }
    const result=aplicarProduccion(s.produccion,p,this.contextoProduccion());if(!result.ok)return mal(result.mensaje);
    s.produccion=result.estado;s.casillasInventario=result.casillas;s.inventario=resumirCasillas(result.casillas);
    for(const [id,n]of Object.entries(result.producidos)){this.contar('fabricar_'+id,n);this.contar('fabricar',n);}r=bien(result.mensaje);break;
   }
   case 'comprar_objeto':{
    const disponibles=['alimento_mascota','cubo_ordeno','tijeras_esquila','carbon','harina','sal','azucar','aceite','resina','arena','cuero','pan',...FRUTALES.map(f=>f.planton)];const def=obtenerObjeto(a.articulo),n=a.cantidad??1;
    if(s.zona!=='pueblo'||s.servicio!==(['alimento_mascota','cubo_ordeno','tijeras_esquila'].includes(a.articulo)?'animales':'semillas'))return mal('Compra las provisiones en el almacén y las herramientas de ganado en la tienda de animales.');
    if(!def||!disponibles.includes(a.articulo)||!entero(n,1,99))return mal('Esta provisión no está disponible.');if(s.monedas<def.precioCompra*n)return mal('No tienes suficientes monedas.');
    this.agregar(a.articulo,n);s.monedas-=def.precioCompra*n;r=bien(`${def.nombre} guardado en la mochila.`);break;
   }
   case 'entrar_aventura':{
    const d=destinoAventura(a.destino);if(!d)return mal('Destino desconocido.');if(s.interior||s.servicio||!finito(a.xJugador,-1000,1000)||!finito(a.zJugador,-1000,1000))return mal('Sal al exterior para iniciar la expedición.');
    if(d.construccion){const portal=s.produccion.estructuras.find(n=>n.articulo===d.construccion&&n.zona===s.zona&&this.cerca(n.x,n.z,a.xJugador,a.zJugador,5));if(!portal)return mal('Acércate al portal o a tu nave construida en la granja.');}
    else if(s.zona!==(d.tipo==='mina'?'mina':'bosque_ancestral'))return mal(d.tipo==='mina'?'Viaja a la entrada de la mina.':'Viaja al bosque ancestral para encontrar las ruinas.');
    const result=entrarAventura(s.aventura,a.destino,{x:a.xJugador,z:a.zJugador},{desbloqueos:s.desbloqueos,construcciones:s.produccion.estructuras.map(n=>n.articulo),nivelPico:this.nivelHerramienta('pico')});if(!result.ok)return result;
    s.posicionAventura=result.posicion!;s.enemigo=0;this.contar('expediciones');r={...result,posicionAventura:result.posicion};break;
   }
   case 'salir_aventura':{if(!s.aventura.destinoActual)return mal('No estás en una expedición.');const result=salirAventura(s.aventura);s.posicionAventura=null;r={...result,posicionAventura:result.posicion};break;}
   case 'descender_aventura':{if(!finito(a.xJugador,-1000,1000)||!finito(a.zJugador,-1000,1000))return mal('Posición de jugador inválida.');const result=descenderAventura(s.aventura,{x:a.xJugador,z:a.zJugador});if(!result.ok)return result;s.posicionAventura=result.posicion!;r={...result,posicionAventura:result.posicion};break;}
   case 'accion_aventura':{
    if(!s.aventura.destinoActual||!finito(a.xJugador,-1000,1000)||!finito(a.zJugador,-1000,1000))return mal('No estás en una expedición.');const jugador={x:a.xJugador,z:a.zJugador};
    if(['nodo','monstruo'].includes(a.objetivo)){
     if(s.energia<this.costeEnergia())return mal('Come algo o busca un campamento para recuperar energía.');
     if(!this.herramientaDisponible())return mal('Tu herramienta está en la herrería.');
     if(s.herramienta!==(a.objetivo==='nodo'?'pico':'espada'))return mal(a.objetivo==='nodo'?'Selecciona tu pico.':'Selecciona una espada en la barra.');
    }
    const instancia=instanciaAventura(s.aventura),monstruo=instancia?.monstruos.find(m=>m.id===a.id),nodo=instancia?.nodos.find(n=>n.id===a.id),botinAntes=new Set(instancia?.botin.map(b=>b.id));
    const result=a.objetivo==='monstruo'?golpearMonstruo(s.aventura,a.id,jugador,this.nivelHerramienta('espada'),this.bonos().ataque):a.objetivo==='nodo'?golpearNodo(s.aventura,a.id,jugador,this.nivelHerramienta('pico')):a.objetivo==='botin'?recogerBotin(s.aventura,a.id,jugador):resolverSituacion(s.aventura,a.id,jugador);
    if(!result.ok)return result;if(result.botin)this.agregar(result.botin.articulo,result.botin.cantidad);
    if(['nodo','monstruo'].includes(a.objetivo))s.energia=Math.max(0,s.energia-this.costeEnergia());if(result.destruido){this.contar(a.objetivo==='monstruo'?'monstruos':'mineria');if(a.objetivo==='monstruo'&&monstruo)this.experiencia('combate',Math.ceil(MONSTRUOS[monstruo.tipo].vida/2));if(a.objetivo==='nodo'&&nodo){this.experiencia('mineria',8+MINERALES[nodo.mineral].pico*5);for(const b of instancia?.botin??[])if(!botinAntes.has(b.id))b.cantidad=mejorarBotin(s.habilidades,{[b.articulo]:b.cantidad},'roca')[b.articulo];}}
    s.vida=Math.min(100,s.vida+(result.vida??0));s.energia=Math.min(100,s.energia+(result.energia??0));r=result;break;
   }
   case 'herramienta':{if(!HERRAMIENTAS.some(h=>h.id===a.herramienta))return mal('Herramienta desconocida.');if(!this.herramientaDisponible(a.herramienta))return mal('Tu herramienta está en la herrería.');if(a.herramienta!=='mano'){const at=s.casillasInventario.findIndex(p=>p?.articulo==='herramienta_'+a.herramienta);if(at<0)return mal('Esa herramienta no está en tu mochila.');s.filaBarra=Math.floor(at/LARGO_BARRA);s.casillaActiva=at%LARGO_BARRA;}s.herramienta=a.herramienta;r=bien('Herramienta equipada.');break;}
   case 'seleccionar_casilla':{if(!entero(a.casilla,0,LARGO_BARRA-1))return mal('Casilla desconocida.');s.casillaActiva=a.casilla;this.sincronizarSeleccion();r=bien(this.seleccionado()?obtenerObjeto(this.seleccionado()!.articulo)?.nombre??'Objeto seleccionado.':'Manos libres.');break;}
   case 'fila_barra':{if(!entero(a.fila,0,s.casillasInventario.length/LARGO_BARRA-1))return mal('Fila desconocida.');s.filaBarra=a.fila;this.sincronizarSeleccion();r=bien(`Barra ${a.fila+1}.`);break;}
   case 'consumir':{const i=a.casilla??indiceActivo(s);if(!entero(i,0,s.casillasInventario.length-1))return mal('Casilla desconocida.');const pila=s.casillasInventario[i],def=obtenerObjeto(pila?.articulo??'');if(!pila||!def?.comida)return mal('Este objeto no es comestible.');if(now-s.ultimoConsumoAt<700)return mal('Termina de comer antes de continuar.');if(s.vida>=100&&s.energia>=100&&!def.comida.buffs?.length)return mal('Ya tienes toda tu energía y salud.');pila.cantidad--;if(!pila.cantidad)s.casillasInventario[i]=null;s.inventario=resumirCasillas(s.casillasInventario);s.vida=Math.min(100,s.vida+Math.floor(def.comida.vida*(1+(efectosHabilidades(s.habilidades).comida??0))));s.energia=Math.min(100,s.energia+Math.floor(def.comida.energia*(1+(efectosHabilidades(s.habilidades).comida??0))));for(const b of def.comida.buffs??[]){s.buffs=s.buffs.filter(x=>x.tipo!==b.tipo);s.buffs.push({tipo:b.tipo,valor:b.valor,hasta:now+b.duracionMs});}s.ultimoConsumoAt=now;this.sincronizarSeleccion();this.contar('comidas');r=bien(`${def.nombre}: +${def.comida.energia} energía, +${def.comida.vida} salud.`);break;}
   case 'equipar_objeto':{if(!entero(a.casilla,0,s.casillasInventario.length-1))return mal('Casilla desconocida.');const pila=s.casillasInventario[a.casilla],def=obtenerObjeto(pila?.articulo??'');if(!pila||!def?.equipo)return mal('Este objeto no se equipa.');const ranura=def.equipo.ranura,anterior=s.equipo[ranura];s.casillasInventario[a.casilla]=null;if(anterior)this.agregar(anterior,1);s.equipo[ranura]=pila.articulo;s.inventario=resumirCasillas(s.casillasInventario);this.sincronizarSeleccion();r=bien(`${def.nombre} equipado.`);break;}
   case 'desequipar_objeto':{if(!['arma','casco','pechera','botas'].includes(a.ranura))return mal('Ranura desconocida.');const id=s.equipo[a.ranura];if(!id)return mal('No hay equipo en esa ranura.');this.agregar(id,1);s.equipo[a.ranura]=null;r=bien('Equipo guardado en la mochila.');break;}
   case 'personaje':if(a.personaje!=='el'&&a.personaje!=='ella')return mal('Personaje desconocido.');s.personaje=a.personaje;r=bien('Personaje seleccionado.');break;
   case 'golpear':case 'limpiar':{
    const o=a.tipo==='golpear'?s.obstaculos.find(o=>o.id===a.obstaculoId):this.nodosActuales().find(o=>o.x===a.x&&o.z===a.z);
    if(s.interior||!o||!this.nodosActuales().includes(o))return mal('Este recurso ya no está disponible en esta zona.');
    if(o.tipo==='ruina')return mal('Esta ruina se restaura con materiales; no se destruye.');
    if((o.zona||'granja')==='granja'&&!this.celdaPropia(o.x,o.z))return mal('Compra primero este sector.');
    if(!this.cerca(o.x,o.z,a.xJugador as number,a.zJugador as number,ALCANCE_GOLPE))return mal('Acércate al recurso con el teclado para usar la herramienta.');
    if(s.enemigo>0)return mal('Despeja los monstruos antes de recolectar recursos.');
    const herramienta=herramientaDeNodo(o);/* Como en Stardew, la maleza sale con cualquier herramienta (azada, guadaña, hacha, pico o espada) */if(s.herramienta!==herramienta&&!(o.tipo==='maleza'&&['azada','hacha','pico','espada'].includes(s.herramienta)))return mal(`Equipa ${herramienta==='guadana'?'la guadaña':herramienta==='hacha'?'el hacha':'el pico'}.`);
    const nivel=this.nivelHerramienta();if(nivel<nivelNecesario(o))return mal(`Necesitas una herramienta de ${NIVELES_HERRAMIENTA[nivelNecesario(o)].nombre.toLowerCase()} o mejor.`);
    if(now-s.ultimoGolpeAt<360)return mal('Espera a terminar el golpe.');
    if(s.energia<this.costeEnergia())return mal('Descansa para recuperar energía.');
    const dano=NIVELES_HERRAMIENTA[nivel].dano;s.energia=Math.max(0,s.energia-this.costeEnergia());s.ultimoGolpeAt=now;o.hp=Math.max(0,o.hp-dano);
    const impacto={obstaculoId:o.id,x:o.x,z:o.z,tipo:o.tipo,hp:o.hp,hpMax:o.hpMax,destruido:o.hp===0,dano};
    if(o.hp===0){
     const recursos=mejorarBotin(s.habilidades,botinDeNodo(o),o.tipo as 'arbol'|'roca'|'maleza');this.experiencia(o.tipo==='roca'?'mineria':'recoleccion',o.tipo==='arbol'?(o.gigante?30:12):o.tipo==='roca'?8+(o.nivelMina??0)*3:2);this.crearDrops(recursos,o.x,o.z);
     if((o.zona||'granja')==='granja'){s.obstaculos=s.obstaculos.filter(n=>n!==o);this.contar('limpiar');}else o.regeneraEn=now+REGENERACION_NODO_MS;
     for(const [id,cantidad] of Object.entries(recursos))this.contar(id,cantidad);
     if(o.zona==='mina')this.contar('mineral',2);
     r={...bien('El recurso se ha roto. Acércate a los objetos para recogerlos.'),impacto};
    }else r={...bien(`Golpe: ${o.hp} / ${o.hpMax} de resistencia.`),impacto};break;
   }
   case 'recoger_drop':{
    const d=s.drops.find(d=>d.id===a.dropId);if(!d||d.zona!==s.zona||(d.zona==='mina'&&d.nivelMina!==s.nivelMina)||s.interior)return mal('Ese objeto no está aquí.');
    if(!finito(a.xJugador,-1000,1000)||!finito(a.zJugador,-1000,1000)||Math.hypot(d.x-a.xJugador,d.z-a.zJugador)>ALCANCE_RECOGIDA)return mal('Acércate al objeto para recogerlo.');
    this.agregar(d.articulo,d.cantidad);s.drops=s.drops.filter(x=>x!==d);r={...bien(`Recoges ${d.cantidad} × ${d.articulo.replaceAll('_',' ')}.`),recogida:{dropId:d.id,articulo:d.articulo,cantidad:d.cantidad}};break;
   }
   case 'reparar':{
    if(s.zona!=='granja'||!this.celdaPropia(a.x,a.z))return mal('Compra primero este sector.');const o=this.nodosActuales().find(o=>o.x===a.x&&o.z===a.z);if(!o||o.tipo!=='ruina')return mal('Solo las construcciones en ruinas pueden repararse.');
    if(s.edificios.length+s.obras.encargos.filter(o=>o.tipo==='nueva').length>=MAX_EDIFICIOS)return mal('Tu granja ha alcanzado el límite de 1500 construcciones.');
    if(!this.puedePagar({madera:20,piedra:12}))return mal('La reparación requiere 20 maderas y 12 piedras.');
    const def=articulo('pozo')!;s.obstaculos=s.obstaculos.filter(x=>x!==o);const permiso=this.lugarConstruccion(def,a.x,a.z,0);if(!permiso.ok)return permiso;
    this.pagar({madera:20,piedra:12});s.edificios.push({id:this.id('edificio'),articulo:'pozo',x:a.x,z:a.z,giro:0,clima:'templado',pasto:0,ultimoPastoAt:now});this.contar('reparar');r=bien('El viejo pozo vuelve a formar parte de la granja. Puedes moverlo.');break;
   }
   case 'mover_item':{const casillas=moverPila(s.casillasInventario,a.desde,a.hasta,a.cantidad);if(!casillas)return mal('No se pueden mover esas casillas o esa cantidad.');s.casillasInventario=casillas;s.inventario=resumirCasillas(casillas);this.sincronizarSeleccion();r=bien('Mochila reorganizada.');break;}
   case 'ampliar_mochila':{
    if(s.zona!=='pueblo'||s.servicio!=='semillas')return mal('La ampliación de mochila se compra en la tienda del pueblo.');if(s.casillasInventario.length>=CASILLAS_AMPLIADAS)return mal('Tu mochila ya tiene 36 casillas.');if(s.monedas<250)return mal('La ampliación cuesta 250 monedas.');s.monedas-=250;while(s.casillasInventario.length<CASILLAS_AMPLIADAS)s.casillasInventario.push(null);r=bien('Mochila ampliada a 36 casillas.');break;
   }
   case 'recuperar_almacen':{const n=a.cantidad??Math.min(MAX_PILA,s.almacenMigracion[a.articulo]||0);if(!entero(n,1,MAX_PILA)||(s.almacenMigracion[a.articulo]||0)<n)return mal('No hay esa cantidad en el almacén de la partida anterior.');this.agregar(a.articulo,n);s.almacenMigracion[a.articulo]-=n;if(!s.almacenMigracion[a.articulo])delete s.almacenMigracion[a.articulo];r=bien('Objetos de tu partida anterior recuperados.');break;}
   case 'entrar_dormitorio':{if(!puedeEntrarDormitorio(s,a.npcId,a.xJugador,a.zJugador))return mal('Acércate a la puerta de su dormitorio. Necesitas dos corazones de amistad (500 puntos) y horario de visita.');s.interior='dormitorio_'+a.npcId;r={...bien('Dentro del dormitorio de '+dormitorioDef(s.interior)!.nombre+'.'),posicionZona:{x:0,z:2.5}};break;}
   case 'inspeccionar_mueble':{const n=dormitorioDef(s.interior),m=Object.hasOwn(MUEBLES_DORMITORIO,a.mueble)?MUEBLES_DORMITORIO[a.mueble]:undefined;if(!n||!m||!finito(a.xJugador,-100,100)||!finito(a.zJugador,-100,100)||Math.hypot(a.xJugador-m.x,a.zJugador-m.z)>1.8)return mal('Acércate al mueble de este dormitorio.');r=bien(n.nombre+' · '+m.nombre+': '+m.texto);break;}
   case 'entrar_vivienda':{const v=viviendaDef(a.id);if(!v||s.zona!=='pueblo'||s.interior||s.servicio)return mal('Visita la vivienda desde el exterior del pueblo.');if(!visitaVivienda(s.jornada.minutos))return mal('Las visitas son de 08:00 a 21:00.');if(!finito(a.xJugador,-1000,1000)||!finito(a.zJugador,-1000,1000)||Math.hypot(a.xJugador-v.entrada.x,a.zJugador-v.entrada.z)>2.8||!librePueblo(a.xJugador,a.zJugador))return mal('Acércate a la puerta de la vivienda.');s.posicionExterior={zona:'pueblo',x:v.entrada.x,z:v.entrada.z};s.interior='vivienda_'+v.id;r={...bien('Dentro de '+v.nombre+'.'),posicionZona:{x:0,z:3.5}};break;}
   case 'entrar_servicio':{
    if(s.interior||s.zona!=='pueblo'||!SERVICIOS.includes(a.servicio))return mal('Visita ese edificio en el pueblo.');const horario=atencionServicio(a.servicio,s.jornada.diasCompletados,s.jornada.minutos);if(!horario.abierto)return mal(horario.mensaje);if((a.xJugador!==undefined||a.zJugador!==undefined)&&(!Number.isFinite(a.xJugador)||!Number.isFinite(a.zJugador)||puntoInteraccion(a.xJugador!,a.zJugador!,2.8)?.servicio!==a.servicio))return mal('Acércate a la puerta del local para entrar.');s.servicio=a.servicio;s.interior=null;r=bien('Bienvenido. Elige un servicio del mostrador.');break;
   }
   case 'salir_servicio':s.servicio=null;r=bien('De vuelta a la plaza.');break;
   case 'mejorar_herramienta':{
    if(s.zona!=='pueblo'||s.servicio!=='herreria')return mal('Encarga las mejoras en la herrería del pueblo.');
    if(!HERRAMIENTAS_MEJORABLES.includes(a.herramienta))return mal('Esta herramienta no se mejora.');if(!(s.inventario['herramienta_'+a.herramienta]>0))return mal('Trae la herramienta en tu mochila.');if(s.mejoraHerramienta)return mal('Retira el encargo actual antes de iniciar otro.');
    const nivel=this.nivelHerramienta(a.herramienta)+1,def=NIVELES_HERRAMIENTA[nivel];if(!def)return mal('La herramienta ya tiene el nivel máximo.');
    if(s.monedas<def.monedas||!this.puedePagar(def.receta))return mal(`Requiere ${def.monedas} monedas y ${Object.entries(def.receta).map(([k,v])=>`${v} ${k}`).join(', ')}.`);
    s.monedas-=def.monedas;this.pagar(def.receta);s.mejoraHerramienta={herramienta:a.herramienta,nivel,hasta:now+def.duracionMs};if(s.herramienta===a.herramienta)s.herramienta='mano';r=bien(`Encargo de ${def.nombre}: listo en ${def.duracionMs/1000} segundos de esta demo. La herramienta queda en la herrería.`);break;
   }
   case 'retirar_mejora':{
    if(s.zona!=='pueblo'||s.servicio!=='herreria')return mal('Vuelve a la herrería para retirar la herramienta.');const trabajo=s.mejoraHerramienta;if(!trabajo)return mal('No tienes un encargo pendiente.');if(now<trabajo.hasta)return mal(`Faltan ${Math.ceil((trabajo.hasta-now)/1000)} segundos para terminar.`);
    s.nivelesHerramienta[trabajo.herramienta]=trabajo.nivel;s.herramienta=trabajo.herramienta;s.mejoraHerramienta=null;const at=s.casillasInventario.findIndex(p=>p?.articulo==='herramienta_'+trabajo.herramienta);if(at>=0){s.filaBarra=Math.floor(at/LARGO_BARRA);s.casillaActiva=at%LARGO_BARRA;}this.contar('mejorar_herramienta');r=bien(`Herramienta de ${NIVELES_HERRAMIENTA[trabajo.nivel].nombre} lista.`);break;
   }
   case 'labrar':{
    if(!this.sueloAgricola()||s.herramienta!=='azada')return mal('Usa la azada en el exterior de tu granja.');
    if(!entero(a.x)||!entero(a.z)||a.direccion&&(!finito(a.direccion.x,-1,1)||!finito(a.direccion.z,-1,1)))return mal('La posición o dirección no es válida.');
    if(s.energia<this.costeEnergia())return mal('Necesitas descansar.');
    const area=celdasDeHerramienta(a.x,a.z,this.nivelHerramienta(),a.direccion).filter(p=>this.celdaAgricola(p.x,p.z)&&!this.parcelasActuales().some(c=>c.x===p.x&&c.z===p.z)).slice(0,Math.floor(s.energia/this.costeEnergia()));
    if(!area.length)return mal('Elige casillas propias y despejadas.');
    s.energia=Math.max(0,s.energia-area.length*this.costeEnergia());for(const p of area)this.parcelasActuales().push({...p,campo:crearCampo((now+p.x*73471+p.z*93811)>>>0),cultivo:null,cuidado:null});this.contar('labrar',area.length);r={...bien(`Tierra labrada: ${area.length} ${area.length===1?'casilla':'casillas'}. Los surcos vecinos se unen.`),area};break;
   }
   case 'alisar':{
    if(!this.sueloAgricola()||s.herramienta!=='pico')return mal('Usa el pico en tu granja para alisar la tierra.');
    const p=this.parcelasActuales().find(p=>p.x===a.x&&p.z===a.z);if(!p||!(this.invernaderoActual()?camaInvernadero(a.x,a.z):this.celdaPropia(a.x,a.z)))return mal('Selecciona una casilla de tierra labrada.');
    if(p.cultivo!==null||p.cuidado!==null)return mal('Cosecha o retira primero el cultivo. El pico no destruirá tus plantas.');
    if(s.energia<this.costeEnergia())return mal('Necesitas descansar.');s.energia=Math.max(0,s.energia-this.costeEnergia());const i=this.invernaderoActual();if(i)i.parcelas=i.parcelas.filter(x=>x!==p);else s.parcelas=s.parcelas.filter(x=>x!==p);this.contar('alisar');r=bien('Terreno alisado. Puedes volver a labrarlo o colocar una construcción.');break;
   }
   case 'plantar':{
    if(!this.sueloAgricola())return mal('Planta en tu granja o dentro de un invernadero.');
    const p=this.parcelasActuales().find(p=>p.x===a.x&&p.z===a.z),c=CULTIVOS.find(c=>c.id===a.cultivo);if(!p||p.cultivo||!c)return mal('Necesitas tierra labrada y vacía y una semilla válida.');
    if(a.xJugador!==undefined||a.zJugador!==undefined){if(!finito(a.xJugador,-1000,1000)||!finito(a.zJugador,-1000,1000))return mal('La posición del personaje no es válida.');if(c.enrejado&&Math.floor(a.xJugador)===a.x&&Math.floor(a.zJugador)===a.z)return mal('Sal de esta casilla antes de plantar el enrejado.');}
    if(c.requiere&&!this.posee(c.requiere))return mal('Descubre primero la región de este cultivo.');
    if(!c.climas.includes(this.invernaderoActual()?CLIMA_INVERNADERO:this.climaDeCelda(a.x,a.z)))return mal(`Este cultivo necesita: ${c.climas.map(c=>CLIMAS[c]).join(', ')}.`);
    const invernadero=!!this.invernaderoActual();
    if(!invernadero&&!c.estaciones.includes(this.calendario().estacion))return mal(`La temporada de ${c.nombre.toLowerCase()} es ${c.estaciones.join(' / ')}.`);
    if(!this.puedePagar({[c.semilla]:1}))return mal('No tienes esa semilla.');this.pagar({[c.semilla]:1});p.campo={...(p.campo??crearCampo((now+a.x*73471+a.z*93811)>>>0)),ciclo:'inicial',cosechas:0,riegoDia:null,riegoManualDia:null};p.cultivo=c.id;p.cuidado=crearCultivo(duracionCampo(c,p.campo),now,false);this.contar('plantar');r=bien(`${c.nombre} plantada. Dale su primer riego.`);break;
   }
   case 'regar':{
    if(!this.sueloAgricola()||s.herramienta!=='regadera')return mal('Equipa la regadera en la granja o el invernadero.');
    if(!entero(a.x)||!entero(a.z)||a.direccion&&(!finito(a.direccion.x,-1,1)||!finito(a.direccion.z,-1,1)))return mal('La posición o dirección no es válida.');
    const celdas=celdasDeHerramienta(a.x,a.z,this.nivelHerramienta(),a.direccion),parcelas=this.parcelasActuales().filter(p=>p.cuidado?.status==='creciendo'&&celdas.some(c=>c.x===p.x&&c.z===p.z));
    const arboles=this.frutalesActuales().filter(f=>f.cuidado.status==='creciendo'&&celdas.some(c=>c.x===f.x&&c.z===f.z));for(const f of arboles)regarFrutal(f,s.jornada.diasCompletados,now);
    if(!parcelas.length&&!arboles.length){const p=this.parcelasActuales().find(p=>p.x===a.x&&p.z===a.z);if(p?.cuidado?.status==='maduro')return bien('Este cultivo maduro ya puede permanecer como decoración.');return mal(p?.cuidado?.status==='arruinado'?'Retira el cultivo seco y vuelve a plantar.':'Planta antes de regar.');}
    const energia=this.costeEnergia();if(s.energia<energia)return mal('Necesitas energía para regar.');s.energia=Math.max(0,s.energia-energia);
    for(const p of parcelas){p.cuidado=regarCultivo(p.cuidado!,now);p.campo??=crearCampo();p.campo.riegoDia=s.jornada.diasCompletados;if(p.campo.riegoManualDia!==s.jornada.diasCompletados){this.contar('regar');p.campo.riegoManualDia=s.jornada.diasCompletados;}}
    r={...bien(`${parcelas.length+arboles.length} ${parcelas.length+arboles.length===1?'planta regada':'plantas regadas'}: protegido durante 48 horas reales.`),area:[...parcelas,...arboles].map(p=>({x:p.x,z:p.z}))};break;
   }
   case 'fertilizar':{
    if(!this.sueloAgricola())return mal('Abona en la granja o el invernadero.');const p=this.parcelasActuales().find(p=>p.x===a.x&&p.z===a.z),nivel=a.articulo==='fertilizante'?1:a.articulo==='fertilizante_mejorado'?2:0;
    if(!p||!nivel)return mal('Usa abono sobre tierra labrada.');if(p.cuidado&&p.cuidado.grownMs>0)return mal('Aplica el abono antes de que el cultivo empiece a crecer.');
    const campo=p.campo??crearCampo((now+a.x*73471+a.z*93811)>>>0);if(campo.fertilizante>=nivel)return mal('Esta tierra ya tiene ese abono o uno mejor.');if(!this.puedePagar({[a.articulo]:1}))return mal('Necesitas abono en la mochila.');this.agregar(a.articulo,-1);p.campo={...campo,fertilizante:nivel as 1|2};r=bien('Tierra abonada: aumenta la posibilidad de cosechas de calidad.');break;
   }
   case 'cosechar':{
    if(!this.sueloAgricola())return mal('Cosecha en la granja o el invernadero.');
    const p=this.parcelasActuales().find(p=>p.x===a.x&&p.z===a.z);if(!p?.cuidado||!p.cultivo)return mal('No hay un cultivo aquí.');if(p.cuidado.status==='creciendo')return mal('Todavía está creciendo.');
    if(p.cuidado.status==='maduro'){
     const c=CULTIVOS.find(c=>c.id===p.cultivo)!;if(c.cosecha==='guadana'&&s.herramienta!=='guadana')return mal('Cosecha este cultivo con la guadaña.');const campo=p.campo??crearCampo(),calidad=calidadCosecha(campo,nivelHabilidad(s.habilidades,'agricultura'),efectosHabilidades(s.habilidades).calidadCultivo),n=c.cantidad??3;
     this.agregar(c.producto,n,calidad);this.contar('cosechar');this.experiencia('agricultura',Math.max(8,diasCultivo(c,campo.ciclo)*3));this.contar('cosecha_'+c.id,n);this.contar('calidad_'+calidad,n);r=bien(`Cosecha: +${n} ${c.nombre} · ${nombreCalidad(calidad)}.`);
     const siguiente=siguienteCosecha(c,campo,now);if(siguiente){p.campo=siguiente.campo;p.cuidado=siguiente.cuidado;r.mensaje+=` Volverá a producir en ${diasCultivo(c,'rebrote')} días de juego con riego diario.`;break;}
    }else{this.contar('cultivo_retirado');r=bien('Cultivo dañado retirado. La tierra está lista para una nueva semilla.');}
    p.cultivo=null;p.cuidado=null;p.campo=crearCampo((now+a.x*73471+a.z*93811)>>>0);break;
   }
   case 'vender_pila':{
    if(s.zona!=='pueblo'||s.servicio!=='semillas')return mal('Vende en el almacén del pueblo.');if(!entero(a.casilla,0,s.casillasInventario.length-1))return mal('Casilla desconocida.');const p=s.casillasInventario[a.casilla],n=a.cantidad??1;if(!p||!entero(n,1,p.cantidad))return mal('Cantidad inválida.');const precio=obtenerObjeto(p.articulo)?.precioVenta??PRECIOS_VENTA[p.articulo]??0;if(precio<=0)return mal('Este objeto no se vende.');const valor=Math.floor(precio*multiplicadorCalidad(calidadPila(p)))*n;p.cantidad-=n;if(!p.cantidad)s.casillasInventario[a.casilla]=null;s.inventario=resumirCasillas(s.casillasInventario);s.monedas+=valor;this.contar('vender',n);r=bien(`Venta realizada: +${valor} monedas.`);break;
   }
   case 'sector':{
    const sector=SECTORES.find(x=>x.id===a.sectorId);if(!sector||s.sectorIds.includes(sector.id))return mal('Elige un sector sin comprar.');if(!SECTORES.some(x=>s.sectorIds.includes(x.id)&&sonAdyacentes(x,sector)))return mal('Compra un sector adyacente a tu terreno.');if(s.monedas<sector.precio)return mal(`Necesitas ${sector.precio} monedas.`);s.monedas-=sector.precio;s.sectorIds.push(sector.id);this.contar('sectores_comprados');r=bien('Nuevo sector comprado. Despeja y restaura el terreno.');break;
   }
   case 'comprar':case 'craftear':case 'vender':{
    const n=a.cantidad??1;if(!entero(n,1,999))return mal('La cantidad debe estar entre 1 y 999.');
    if(a.tipo==='vender'&&(s.zona!=='pueblo'||s.servicio!=='semillas'))return mal('Vende tus productos en la tienda del pueblo.');
    if(a.tipo==='vender'){const precio=obtenerObjeto(a.articulo)?.precioVenta??PRECIOS_VENTA[a.articulo];if(!precio||!this.puedePagar({[a.articulo]:n}))return mal('No tienes suficientes productos vendibles.');const antes=s.casillasInventario.filter(p=>p?.articulo===a.articulo).reduce((v,p)=>v+p!.cantidad*Math.floor(precio*multiplicadorCalidad(calidadPila(p))),0);this.pagar({[a.articulo]:n});const despues=s.casillasInventario.filter(p=>p?.articulo===a.articulo).reduce((v,p)=>v+p!.cantidad*Math.floor(precio*multiplicadorCalidad(calidadPila(p))),0);const valor=antes-despues;s.monedas+=valor;this.contar('vender',n);r=bien(`Venta realizada: +${valor} monedas.`);break;}
    const def=articulo(a.articulo);if(!def)return mal('Artículo desconocido.');if(def.requiere&&!this.posee(def.requiere))return mal('Completa las misiones para desbloquear este artículo.');if(def.categoria==='refugio'&&def.clima!=='templado'&&!this.posee('fantasia'))return mal('Los hábitats especiales se desbloquean con la primera misión de crianza.');
    const taller=def.categoria==='casa'||def.categoria==='refugio';
    if((a.tipo==='comprar'||taller)&&(s.zona!=='pueblo'||s.servicio!==(def.categoria==='insumo'?'semillas':'carpinteria')))return mal(def.categoria==='insumo'?'Visita la tienda del pueblo para comprar insumos.':'Encarga construcciones y mobiliario en la carpintería del pueblo.');
    if(a.tipo==='comprar'){const cultivo=CULTIVOS.find(c=>c.semilla===a.articulo);if(cultivo&&!cultivo.estaciones.includes(this.calendario().estacion))return mal('Estas semillas no se venden en la temporada actual.');if(s.monedas<def.precio*n)return mal(`Necesitas ${def.precio*n} monedas.`);s.monedas-=def.precio*n}else{if(!Object.keys(def.receta).length)return mal('Este insumo se compra o se recolecta.');if(!this.puedePagar(def.receta,n))return mal(`Faltan materiales: ${Object.entries(def.receta).map(([k,v])=>`${v*n} ${k}`).join(', ')}.`);this.pagar(def.receta,n);this.contar('craftear',n)}
    this.agregar(def.categoria==='insumo'?def.id:`creacion_${def.id}`,n);r=bien(`${n} × ${def.nombre} en el inventario.`);break;
   }
   case 'encargar_obra':case 'ampliar_refugio':{
    if(s.zona!=='pueblo'||s.servicio!=='carpinteria')return mal('Visita la carpintería del pueblo para encargar una obra.');if(s.obras.encargos.length>=MAX_ENCARGOS)return mal('La carpintería admite ocho encargos pendientes. Termina o cancela uno.');
    const b=a.tipo==='ampliar_refugio'?s.edificios.find(b=>b.id===a.edificioId):undefined,d=articulo(a.tipo==='encargar_obra'?a.articulo:b?.articulo??'');
    if(!d||!requiereObra(d)||a.tipo==='ampliar_refugio'&&!b?.especie)return mal('Elige un edificio o un refugio productivo para ampliar.');
    if(a.tipo==='encargar_obra'&&(!this.articuloDisponible(d.id)||d.categoria==='refugio'&&d.clima!=='templado'&&!this.posee('fantasia')))return mal('Este hábitat se desbloquea avanzando en las misiones.');
    if(b&&(nivelEdificio(b)===3||s.obras.encargos.some(o=>o.edificioId===b.id)))return mal('Ese refugio ya está al máximo o tiene una ampliación pendiente.');
    if(!b&&(s.edificios.length+s.obras.encargos.filter(o=>o.tipo==='nueva').length>=MAX_EDIFICIOS||d.id==='invernadero'&&s.invernaderos.length+s.obras.encargos.filter(o=>o.tipo==='nueva'&&o.articulo==='invernadero').length>=MAX_INVERNADEROS))return mal('Límite de construcciones alcanzado.');
    const nivel=(b?nivelEdificio(b)+1:1) as 1|2|3,c=costeObra(d,nivel);if(s.monedas<c.monedas||!this.puedePagar(c.materiales))return mal('Faltan monedas o materiales para este encargo.');const materiales=materialesObra(s.casillasInventario,c.materiales);this.pagar(c.materiales);s.monedas-=c.monedas;
    s.obras.encargos.push({id:this.id('obra'),tipo:b?'mejora':'nueva',articulo:d.id,edificioId:b?.id??null,nivel,encargadaDia:s.jornada.diasCompletados,colocadaDia:b?s.jornada.diasCompletados:null,lugar:b?{x:b.x,z:b.z,giro:b.giro}:null,jornadas:0,monedas:c.monedas,materiales});this.contar('encargos_carpinteria');r=bien(b?'Ampliación encargada. La cuadrilla avanza al dormir y conserva tus animales e instalaciones.':'Encargo pagado. Regresa caminando a la granja y elige el terreno desde Construir.');break;
   }
   case 'emplazar_obra':{
    if(s.zona!=='granja'||s.interior||s.servicio||s.aventura.destinoActual)return mal('Regresa al exterior de la granja para elegir el terreno.');const o=s.obras.encargos.find(o=>o.id===a.id);if(!o||o.tipo!=='nueva'||o.lugar)return mal('Este encargo no necesita un emplazamiento.');const giro=normalizarGiro(a.giro),p=this.lugarConstruccion(articulo(o.articulo)!,a.x,a.z,giro);if(!p.ok)return p;
    const h=huellaObra({articulo:o.articulo,lugar:{x:a.x,z:a.z,giro}});if(s.posicionExterior?.zona==='granja'&&intersectaHuellaObra(h,s.posicionExterior.x,s.posicionExterior.z)||s.compania.animales.some(a=>a.posicion.zona==='granja'&&intersectaHuellaObra(h,a.posicion.x,a.posicion.z,a.tipo==='caballo'?.45:.2)))return mal('Deja salir al personaje y a sus compañeros antes de reservar ese terreno.');
    o.lugar={x:a.x,z:a.z,giro};o.colocadaDia=s.jornada.diasCompletados;s.obras.encargos=s.obras.encargos.filter(e=>e.id!==o.id).concat(o);r=bien('Terreno reservado. Una sola cuadrilla atiende los encargos en orden; avanza al dormir.');break;
   }
   case 'cancelar_obra':{
    if(!(s.zona==='pueblo'&&s.servicio==='carpinteria')&&!(s.zona==='granja'&&!s.interior&&!s.servicio&&!s.aventura.destinoActual))return mal('Cancela desde la carpintería o desde el exterior de la granja.');const o=s.obras.encargos.find(o=>o.id===a.id);if(!o)return mal('Encargo no encontrado.');if(s.monedas+o.monedas>1e9)return mal('No cabe el reembolso en tu saldo.');for(const p of o.materiales)this.agregar(p.articulo,p.cantidad,calidadPila(p));s.monedas+=o.monedas;s.obras.encargos=s.obras.encargos.filter(e=>e.id!==o.id);r=bien('Encargo cancelado. Recuperaste las monedas y todos los materiales con su calidad.');break;
   }
   case 'construir':{
    if(s.edificios.length+s.obras.encargos.filter(o=>o.tipo==='nueva').length>=MAX_EDIFICIOS)return mal('Tu granja ha alcanzado el límite de 1500 construcciones. Guarda algún objeto antes de colocar otro.');
    const def=articulo(a.articulo);if(!def||def.categoria==='insumo')return mal('Elige una construcción o decoración.');if(def.id==='invernadero'&&s.invernaderos.length+s.obras.encargos.filter(o=>o.tipo==='nueva'&&o.articulo==='invernadero').length>=MAX_INVERNADEROS)return mal('Ya tienes 30 invernaderos.');const giro=normalizarGiro(a.giro);const permiso=this.lugarConstruccion(def,a.x,a.z,giro);if(!permiso.ok)return permiso;
    if(!this.puedePagar({[`creacion_${def.id}`]:1}))return mal('Compra o fabrica primero este objeto.');this.pagar({[`creacion_${def.id}`]:1});const id=this.id('edificio');s.edificios.push({id,articulo:def.id,x:a.x,z:a.z,giro,especie:def.especie,clima:def.clima,pasto:0,ultimoPastoAt:now});if(def.id==='invernadero')s.invernaderos.push(crearInvernadero(id));if(def.id===ARTICULO_ENVIO)s.envios.cajas.push(crearCajaEnvio(id));this.contar('construir');r=bien('Construcción colocada. Puedes moverla o girarla.');break;
   }
   case 'retirar_edificio':{
    const e=s.edificios.find(e=>e.id===a.edificioId);if(!e)return mal('Construcción no encontrada.');if(s.obras.encargos.some(o=>o.edificioId===e.id))return mal('Termina o cancela la ampliación antes de mover o guardar este refugio.');
    if(nivelEdificio(e)>1)return mal('Mueve el refugio ampliado para conservar sus mejoras.');if(s.compania.animales.some(a=>a.edificioId===e.id))return mal('Este hogar está ocupado. Traslada a su compañero a otro hogar antes de guardarlo.');
    if(s.animales.some(animal=>animal.edificioId===e.id)||s.ganaderia.incubadoras.some(i=>i.edificioId===e.id)||s.ganaderia.trufas.some(t=>t.edificioId===e.id))return mal('Este refugio tiene animales o una incubadora instalada. Puedes moverlo con su corral y sus instalaciones.');
    if((e.henoReserva??0)>0)return mal('Retira el heno del comedero antes de guardar el refugio. Puedes moverlo con sus provisiones.');
    if(s.envios.cajas.some(c=>c.edificioId===e.id&&c.casillas.some(Boolean)))return mal('Retira los productos de la caja antes de guardarla. Puedes moverla con su carga.');
    const recinto=s.invernaderos.find(i=>i.edificioId===e.id);if(recinto&&(recinto.parcelas.some(p=>p.cultivo)||s.frutales.some(f=>f.edificioId===e.id)))return mal('El invernadero contiene plantas. Puedes moverlo con sus cultivos, pero no guardarlo ocupado.');
    if(recinto?.riegoAutomatico)return mal('El riego instalado forma parte del edificio. Mueve el invernadero para conservarlo.');
    s.invernaderos=s.invernaderos.filter(i=>i.edificioId!==e.id);this.agregar(`creacion_${e.articulo}`,1);s.envios.cajas=s.envios.cajas.filter(c=>c.edificioId!==e.id);s.edificios=s.edificios.filter(x=>x!==e);if(s.interior===e.id)s.interior=null;
    this.contar('retirar_edificio');r=bien('Objeto guardado en el inventario. Puedes colocarlo de nuevo sin comprarlo.');break;
   }
   case 'mover':case 'girar':{
    const e=s.edificios.find(e=>e.id===a.edificioId);if(!e)return mal('Construcción no encontrada.');if(s.obras.encargos.some(o=>o.edificioId===e.id))return mal('Termina o cancela la ampliación antes de mover o guardar este refugio.');const x=a.tipo==='mover'?a.x:e.x,z=a.tipo==='mover'?a.z:e.z,giro=a.tipo==='mover'?normalizarGiro(a.giro??e.giro):(e.giro+1)%4;
    const permiso=this.lugarConstruccion(articulo(e.articulo)!,x,z,giro,e.id);if(!permiso.ok)return permiso;Object.assign(e,{x,z,giro});for(const a of s.compania.animales.filter(a=>a.edificioId===e.id)){const p=hogarCompania(e,a.tipo);if(!puntoTransitable(s,p.x,p.z,a.tipo==='caballo'?.45:.2,'granja'))return mal('Deja libre el patio del compañero al mover su hogar.');}trasladarHogarCompania(s,e);this.paseosCompania.limpiar();r=bien('La construcción y su corral se han trasladado juntos.');break;
   }
   case 'puerta_ganado':case 'abastecer_refugio':case 'retirar_heno':{
    const b=s.edificios.find(b=>b.id===a.edificioId);if(!b?.especie||s.zona!=='granja'||s.servicio||s.interior&&s.interior!==b.id)return mal('Acércate al refugio de los animales.');
    const puerta=s.interior===b.id?{x:0,z:3.5}:coordenadaRefugio(b,2,4);if(!finito(a.xJugador,-1000,1000)||!finito(a.zJugador,-1000,1000)||s.interior!==b.id&&Math.hypot(puerta.x-a.xJugador,puerta.z-a.zJugador)>2.8)return mal('Acércate a la puerta del refugio.');
    if(a.tipo==='puerta_ganado'){
     if(puertaAbierta(b)&&s.animales.some(an=>an.edificioId===b.id&&an.rutina&&Math.abs(an.rutina.u-2)<.4&&an.rutina.v>3.55&&an.rutina.v<4.75))return mal('Espera a que el animal termine de cruzar la puerta.');
     b.puertaGanado=!puertaAbierta(b);r=bien(b.puertaGanado?'Puerta abierta: los animales pueden salir y regresar.':'Puerta cerrada: quienes estén afuera necesitarán que la abras para volver.');
    }else if(a.tipo==='retirar_heno'){if(!entero(a.cantidad,1,64)||a.cantidad>(b.henoReserva??0))return mal('El comedero no tiene ese heno.');const calidades=b.henoCalidades??[b.henoReserva??0,0,0,0];let quedan=a.cantidad;for(let q=0;q<4;q++){const n=Math.min(quedan,calidades[q]);if(n){this.agregar('heno',n,q as Calidad);calidades[q]-=n;quedan-=n;}}b.henoCalidades=calidades;b.henoReserva=(b.henoReserva??0)-a.cantidad;r=bien('Heno devuelto a la mochila con su calidad.');
    }else{
     if(!entero(a.cantidad,1,64)||a.cantidad+(b.henoReserva??0)>64)return mal('El comedero admite hasta 64 porciones de heno.');if(!this.puedePagar({heno:a.cantidad}))return mal('Necesitas ese heno en la mochila.');const calidades=b.henoCalidades??[b.henoReserva??0,0,0,0];let quedan=a.cantidad;for(let q=0;q<4;q++){const disponibles=s.casillasInventario.reduce((n,p)=>n+(p?.articulo==='heno'&&calidadPila(p)===q?p.cantidad:0),0),n=Math.min(quedan,disponibles);if(n){this.agregar('heno',-n,q as Calidad);calidades[q]+=n;quedan-=n;}}b.henoCalidades=calidades;b.henoReserva=(b.henoReserva??0)+a.cantidad;r=bien('Heno guardado: se usará cuando se termine el pasto. Una porción por animal cada 8 horas reales.');
    }break;
   }
   case 'pasto':case 'jardinero':{
    const e=s.edificios.find(e=>e.id===a.edificioId);if(!e?.especie&&e?.articulo!=='establo')return mal('Selecciona el corral de un refugio.');if(e.pasto>=64)return mal('El corral ya tiene todo su pasto.');if(a.tipo==='pasto'){if(!this.puedePagar({semilla_pasto:4}))return mal('Necesitas 4 semillas de pasto.');this.pagar({semilla_pasto:4})}else{if(s.monedas<25)return mal('El jardinero cobra 25 monedas por sembrar.');s.monedas-=25}e.pasto=64;this.contar('pasto');r=bien('Pasto plantado. Cada animal come una porción cada 8 horas reales.');break;
   }
   case 'adoptar':{
    if(s.zona!=='pueblo'||s.servicio!=='animales')return mal('Visita la tienda de animales del pueblo para adoptar.');
    if(s.animales.length+s.ganaderia.incubadoras.filter(i=>i.huevo).length>=MAX_ANIMALES)return mal('Tu granja ha alcanzado el límite de 240 animales, incluidas las crías reservadas.');
    if(!Object.hasOwn(ESPECIES,a.especie)||(a.sexo!=='hembra'&&a.sexo!=='macho')||a.cria!==undefined&&typeof a.cria!=='boolean')return mal('Especie o sexo no válido.');if(!this.posee(`especie_${a.especie}`))return mal('Completa las misiones para conocer esta especie.');
    if(['avestruz','dinosaurio'].includes(a.especie))return mal('Esta especie llega como huevo fértil. Prepárale una incubadora.');
    let genoma:Genome;let nombreVariante='';
    if(typeof a.variante==='string'){
     const f=FANTASIAS[a.variante];if(!f||f.especie!==a.especie||!this.posee(`fundador_${a.variante}`))return mal('Ese linaje fundador aún no está desbloqueado.');genoma=crearGenoma('Aa','Bb','ff',f.aleloE);nombreVariante=f.nombre;
    }else {const v=a.variante??0;if(!entero(v,0,3))return mal('La variedad debe ser de 0 a 3.');const mision=['','hogar','huerta','confianza'][v];if(mision&&!s.misionesCompletadas.includes(mision))return mal('Completa las primeras misiones para conocer esta variedad natural.');genoma=crearGenoma(v>=2?'aa':'Aa',v%2?'bb':'Bb','FF','Ee');}
    const e=this.habitatDisponible(a.especie,genoma,a.edificioId);if(!e)return mal(`Prepara un refugio de ${ESPECIES[a.especie].nombre.toLowerCase()} con capacidad y clima ${CLIMAS[this.climaAnimal({especie:a.especie,genoma})]}.`);
    const precio=ESPECIES[a.especie].precio*(nombreVariante?2:1);if(s.monedas<precio)return mal(`Necesitas ${precio} monedas.`);s.monedas-=precio;
    s.animales.push({id:this.id('animal'),nombre:(a.nombre?.trim()||nombreVariante||ESPECIES[a.especie].nombre).slice(0,32),rutina:crearRutina(s.animales.filter(an=>an.edificioId===e.id).length,'refugio',capacidadRefugio(e)),especie:a.especie,sexo:a.sexo,genoma,nacimiento:a.cria?now:now-ESPECIES[a.especie].adultoMs,edadDias:a.cria?0:Math.ceil(ESPECIES[a.especie].adultoMs/DIA),ultimoCruce:null,edificioId:e.id,cuidado:crearCuidado(now),productos:0,ultimoProductoAt:now});this.contar('adoptar');r=bien(a.cria?'Una cría llega a su refugio. Crecerá al cerrar jornadas.':'Un nuevo animal adulto llega a su refugio.');break;
   }
   case 'criar':{
    if(!this.posee('crianza'))return mal('Completa «Manos que cuidan» para aprender crianza.');const madre=s.animales.find(x=>x.id===a.madreId),padre=s.animales.find(x=>x.id===a.padreId);
    if(!madre||!padre||madre.id===padre.id||madre.especie!==padre.especie||madre.sexo!=='hembra'||padre.sexo!=='macho')return mal('Selecciona una hembra y un macho de la misma especie.');
    if([madre,padre].some(x=>{const salud=estadoAnimal(x.cuidado,now);return !this.resumenAnimal(x).adulto||!salud.puedeProducir||salud.triste}))return mal('Ambos padres deben ser adultos, sanos, alimentados y atendidos.');if([madre,padre].some(x=>x.ultimoCruce!==null&&now-x.ultimoCruce<DIA))return mal('Los padres necesitan descansar 24 horas reales entre crías.');
    if(!this.puedePagar({heno:4}))return mal('Reserva 4 henos para la nueva familia.');const huevos=GANADO[madre.especie].incubacion>0,posibles=probabilidades(madre.genoma,padre.genoma);
    // Verificar todos los resultados antes del azar impide volver a tirar genes o sexo.
    if(huevos){const bolsa=cambiarCantidad(s.casillasInventario,'heno',-4)!;if(posibles.some(p=>['hembra','macho'].some(sexo=>!cambiarCantidad(bolsa,articuloHuevo(madre.especie,p.genoma,sexo as 'hembra'|'macho'),1,0))))return mal('Libera una casilla para el huevo fértil antes del cruce.');}
    else {if(s.animales.length+s.ganaderia.incubadoras.filter(i=>i.huevo).length>=MAX_ANIMALES)return mal('Tu granja ha alcanzado el límite de 240 animales, incluidas las crías reservadas.');if(posibles.some(p=>!this.habitatDisponible(madre.especie,p.genoma)))return mal('Prepara plazas libres en todos los climas posibles del cuadro de Punnett.');}
    const genoma=cruzar(madre.genoma,padre.genoma,()=>this.random()),sexo=this.random()<.5?'hembra':'macho';this.pagar({heno:4});madre.ultimoCruce=now;padre.ultimoCruce=now;
    if(huevos){this.agregar(articuloHuevo(madre.especie,genoma,sexo),1,0);this.contar('huevos_fertiles');r=bien('Obtienes un huevo fértil. Sus genes y sexo están fijados; coloca el huevo en una incubadora.');}
    else {this.nacimiento(madre.especie,genoma,sexo,this.habitatDisponible(madre.especie,genoma)!.id,`Cría de ${madre.nombre}`,now);r=bien(`Ha nacido ${fenotipo(madre.especie,genoma).label}. Los alelos provienen de sus padres.`);}break;
   }
   case 'comprar_huevo_fertil':{
    if(s.zona!=='pueblo'||s.servicio!=='animales')return mal('Visita la tienda de animales del pueblo.');const d=GANADO[a.especie];if(!Object.hasOwn(GANADO,a.especie)||!d?.precioHuevo||!this.posee('especie_'+a.especie)||!['hembra','macho'].includes(a.sexo))return mal('Este huevo fundador aún no está disponible.');const v=a.variante??0;if(!entero(v,0,3))return mal('Variedad no válida.');const m=['','hogar','huerta','confianza'][v];if(m&&!s.misionesCompletadas.includes(m))return mal('Desbloquea esta variedad mediante las misiones.');if(s.monedas<d.precioHuevo)return mal(`Necesitas ${d.precioHuevo} monedas.`);
    this.agregar(articuloHuevo(a.especie,crearGenoma(v>=2?'aa':'Aa',v%2?'bb':'Bb','FF','Ee'),a.sexo),1,0);s.monedas-=d.precioHuevo;this.contar('comprar');r=bien('Huevo fértil guardado en la mochila. No crecerá hasta que lo incubes y duermas.');break;
   }
   case 'instalar_incubadora':case 'ampliar_incubadora':{
    const b=s.edificios.find(b=>b.id===a.edificioId),i=s.ganaderia.incubadoras.find(i=>i.edificioId===a.edificioId);if(s.zona!=='granja'||s.interior!==a.edificioId||!b?.especie||!GANADO[b.especie].incubacion)return mal('Instala la incubadora dentro de un refugio de animales ovíparos.');if(a.tipo==='instalar_incubadora'&&i||a.tipo==='ampliar_incubadora'&&(!i||i.grande))return mal('Esta instalación no necesita ese cambio.');if(a.tipo==='instalar_incubadora'&&s.ganaderia.incubadoras.length>=240)return mal('Límite de incubadoras alcanzado.');const coste=a.tipo==='instalar_incubadora'?COSTE_INCUBADORA:COSTE_INCUBADORA_GRANDE;if(s.monedas<coste.monedas||!this.puedePagar(coste.materiales))return mal('Faltan monedas o materiales para instalar la incubadora.');this.pagar(coste.materiales);s.monedas-=coste.monedas;if(i)i.grande=true;else s.ganaderia.incubadoras.push({edificioId:a.edificioId,grande:false,huevo:null});r=bien('Incubadora preparada. Solo avanza al dormir.');break;
   }
   case 'incubar':{
    const b=s.edificios.find(b=>b.id===a.edificioId),i=s.ganaderia.incubadoras.find(i=>i.edificioId===a.edificioId);if(s.zona!=='granja'||s.interior!==a.edificioId||!b?.especie||!i||i.huevo)return mal('Entra en el refugio y prepara una incubadora libre.');if(!entero(a.casilla,0,s.casillasInventario.length-1)||a.nombre!==undefined&&typeof a.nombre!=='string')return mal('Elige un huevo de tu mochila.');const p=s.casillasInventario[a.casilla],h=p&&leerHuevo(p.articulo);if(!p||!h||h.especie!==b.especie)return mal('Ese huevo fértil no pertenece a la especie de este refugio.');if(GANADO[h.especie].grande&&!i.grande)return mal('Este huevo necesita la incubadora grande.');if(s.animales.length+s.ganaderia.incubadoras.filter(i=>i.huevo).length>=MAX_ANIMALES||!this.habitatDisponible(h.especie,h.genoma,b.id))return mal('Falta una plaza libre en el hábitat compatible de la cría.');
    i.huevo={articulo:p.articulo,calidad:calidadPila(p),nombre:(a.nombre?.trim()||ESPECIES[h.especie].nombre).slice(0,32),dias:0,inicioDia:s.jornada.diasCompletados};p.cantidad--;if(!p.cantidad)s.casillasInventario[a.casilla]=null;s.inventario=resumirCasillas(s.casillasInventario);r=bien(`Incubación iniciada: ${GANADO[h.especie].incubacion} jornadas al dormir.`);break;
   }
   case 'cancelar_incubacion':{
    const i=s.ganaderia.incubadoras.find(i=>i.edificioId===a.edificioId);if(s.zona!=='granja'||s.interior!==a.edificioId||!i?.huevo)return mal('Entra en el refugio de la incubación.');this.agregar(i.huevo.articulo,1,i.huevo.calidad);i.huevo=null;r=bien('El mismo huevo vuelve a la mochila. Conserva sus genes; reiniciará la incubación.');break;
   }
   case 'trasladar_animal':{
    const animal=s.animales.find(x=>x.id===a.animalId);if(!animal||animal.edificioId===a.edificioId||!this.habitatDisponible(animal.especie,animal.genoma,a.edificioId))return mal('Elige otro refugio compatible con una plaza libre.');if(s.ganaderia.trufas.some(t=>t.animalId===animal.id))return mal('Recoge primero las trufas que dejó en su corral.');animal.edificioId=a.edificioId;animal.rutina=crearRutina(s.animales.filter(an=>an.edificioId===a.edificioId).findIndex(an=>an.id===animal.id),'refugio',capacidadRefugio(s.edificios.find(b=>b.id===a.edificioId)!));r=bien('Animal trasladado con sus genes, cuidados y productos.');break;
   }
   case 'cuidar':{
    const animal=s.animales.find(x=>x.id===a.animalId);if(!animal)return mal('Animal no encontrado.');if(a.metodo==='alimentar'){if(!this.puedePagar({heno:1}))return mal('Compra heno o corta maleza para conseguirlo.');this.pagar({heno:1});animal.cuidado=alimentar(animal.cuidado,now);this.contar('alimentar')}else{if(!['acariciar','musica','cuento','cepillar'].includes(a.metodo))return mal('Cuidado desconocido.');animal.cuidado=consentir(animal.cuidado,a.metodo,now);this.contar('consentir')}if(animal.ultimoDiaExperiencia!==s.jornada.diasCompletados){animal.ultimoDiaExperiencia=s.jornada.diasCompletados;this.experiencia('agricultura',5);}r=bien(estadoAnimal(animal.cuidado,now).enfermo?'Gracias por cuidarlo. Aún necesita que lo revise el veterinario.':'Tu animal se siente acompañado.');break;
   }
   case 'medico':{
    const animal=s.animales.find(x=>x.id===a.animalId);if(!animal)return mal('Animal no encontrado.');const salud=estadoAnimal(animal.cuidado,now);if(!salud.enfermo&&!salud.deprimido)return mal('Este animal no necesita tratamiento.');const precio=Math.round(60*(efectosHabilidades(s.habilidades).veterinario??1));if(s.monedas<precio)return mal('La visita veterinaria cuesta '+precio+' monedas.');s.monedas-=precio;animal.cuidado=curar(animal.cuidado,now);this.contar('curar');r=bien('El veterinario lo ha curado, alimentado y reconfortado.');break;
   }
   case 'recoger':case 'ordenar':case 'esquilar':case 'buscar_trufas':{
    const animal=s.animales.find(x=>x.id===a.animalId);if(!animal||animal.productos<1)return mal('Aún no hay productos para recoger.');const metodo=GANADO[animal.especie].metodo;if(a.tipo!==metodo)return mal(metodo==='ordenar'?'Equipa el cubo de ordeño y acércate al animal.':metodo==='esquilar'?'Equipa las tijeras y acércate a la oveja.':'El cerdo debe buscar sus trufas en el corral.');
    if(a.tipo!=='recoger'||a.xJugador!==undefined||a.zJugador!==undefined){if(a.tipo==='recoger'&&ESPECIES[animal.especie].producto.startsWith('huevo')){const nido=posicionNido(s,animal);if(s.zona!=='granja'||s.servicio||s.interior!==animal.edificioId||!finito(a.xJugador,-1000,1000)||!finito(a.zJugador,-1000,1000)||Math.hypot(nido.x-a.xJugador!,nido.z-a.zJugador!)>2.8)return mal('Acércate al nido dentro del refugio.');}else if(!this.cercaAnimal(animal,a.xJugador!,a.zJugador!))return mal('Acércate al animal para obtener sus productos.');}
    if(['vaca','cabra','gallina','pato','avestruz','dinosaurio'].includes(animal.especie)&&animal.sexo!=='hembra'&&!animal.productoLegado)return mal('Los machos de esta especie participan en la crianza, pero no producen leche ni huevos.');const salud=estadoAnimal(animal.cuidado,now);if(a.tipo!=='recoger'&&(!this.resumenAnimal(animal).adulto||!salud.puedeProducir))return mal('El animal debe estar adulto, sano y alimentado.');
    if(a.tipo==='ordenar'||a.tipo==='esquilar'){if(this.seleccionado()?.articulo!==(a.tipo==='ordenar'?'cubo_ordeno':'tijeras_esquila'))return mal(a.tipo==='ordenar'?'Selecciona el cubo de ordeño en la barra.':'Selecciona las tijeras en la barra.');if(s.energia<1)return mal('Necesitas energía para atender al animal.');}
    const efectos=efectosHabilidades(s.habilidades),base=animal.productos,n=base+(efectos.productoExtra??0),calidad=(salud.puedeProducir?Math.min(2,efectos.calidadAnimal??0):0) as Calidad;
    if(a.tipo==='buscar_trufas'){const b=s.edificios.find(b=>b.id===animal.edificioId)!,tiempo=this.meteorologia(b.x,b.z),reloj=this.calendario();if(s.interior||b.pasto<1||reloj.estacion==='invierno'||reloj.hora<6||reloj.hora>=18||['lluvia','tormenta','nieve'].includes(tiempo))return mal('Las trufas requieren pasto, exterior, luz del día y tiempo seco fuera del invierno.');if(s.ganaderia.trufas.length>=1200)return mal('Recoge las trufas pendientes.');const index=s.animales.filter(a=>a.edificioId===b.id).findIndex(a=>a.id===animal.id),p=nivelEdificio(b)===1?{u:1.18+index%3*1.18,v:5.82+Math.floor(index/3)*1.4}:esperaCorral(index,capacidadRefugio(b));s.ganaderia.trufas.push({id:this.id('trufa'),animalId:animal.id,edificioId:b.id,...p,cantidad:n,base,calidad});animal.productos=0;r=bien('El cerdo olfatea el pasto y desentierra trufas. Recógelas del suelo.');}
    else {this.agregar(ESPECIES[animal.especie].producto,n,calidad);if(animal.especie==='pato'&&base>=2)this.agregar('pluma_pato',1,calidad);this.experiencia('agricultura',base*5);animal.productos=0;delete animal.productoLegado;this.contar('producto',n);if(a.tipo!=='recoger')s.energia-=1;r=bien(`Recoges ${n} × ${obtenerObjeto(ESPECIES[animal.especie].producto)?.nombre??ESPECIES[animal.especie].producto}.`);}break;
   }
   case 'recoger_trufa':{
    const t=s.ganaderia.trufas.find(t=>t.id===a.id),b=t&&s.edificios.find(b=>b.id===t.edificioId);if(!t||!b||s.zona!=='granja'||s.interior||s.servicio)return mal('Esta trufa no está en el exterior de la granja.');const p=coordenadaRefugio(b,t.u,t.v);if(!finito(a.xJugador,-1000,1000)||!finito(a.zJugador,-1000,1000)||Math.hypot(p.x-a.xJugador,p.z-a.zJugador)>2.8)return mal('Acércate a la trufa para recogerla.');this.agregar('trufa',t.cantidad,t.calidad);this.experiencia('agricultura',t.base*5);this.contar('producto',t.cantidad);s.ganaderia.trufas=s.ganaderia.trufas.filter(x=>x.id!==t.id);r=bien(`Recoges ${t.cantidad} trufas del corral.`);break;
   }
   case 'entrar':{if(s.zona!=='granja'||s.servicio)return mal('Regresa a la granja para entrar.');const e=s.edificios.find(e=>e.id===a.edificioId);if(!e||!['casa','refugio'].includes(articulo(e.articulo)!.categoria)&&e.articulo!=='invernadero')return mal('Este objeto no tiene un interior habitable.');if(e.articulo==='invernadero'){const h=huella(e),p=e.giro===0?{x:e.x+h.ancho/2,z:e.z+h.fondo+.5}:e.giro===1?{x:e.x-.5,z:e.z+h.fondo/2}:e.giro===2?{x:e.x+h.ancho/2,z:e.z-.5}:{x:e.x+h.ancho+.5,z:e.z+h.fondo/2};if(!finito(a.xJugador,-1000,1000)||!finito(a.zJugador,-1000,1000)||Math.hypot(a.xJugador-p.x,a.zJugador-p.z)>2.8)return mal('Acércate a la puerta del invernadero para entrar.');}
    s.interior=e.id;s.servicio=null;r=bien(e.articulo==='invernadero'?'Dentro del invernadero: cultiva fuera de temporada, con riego.':'Estás dentro del refugio.');break;}
   case 'salir':{const dormitorio=dormitorioDef(s.interior);if(dormitorio){const v=viviendaInterior(s.interior)!;s.interior='vivienda_'+v.id;r={...bien('De vuelta a la sala común.'),posicionZona:puertaDormitorio(dormitorio.id)!};break;}const vivienda=viviendaInterior(s.interior);if(vivienda){s.interior=null;s.servicio=null;s.posicionExterior={zona:'pueblo',...vivienda.entrada};r={...bien('De vuelta al barrio.'),posicionZona:{...vivienda.entrada}};break;}const e=s.edificios.find(e=>e.id===s.interior&&e.articulo==='invernadero');let p;if(e){const h=huella(e);p=e.giro===0?{x:e.x+h.ancho/2,z:e.z+h.fondo+.5}:e.giro===1?{x:e.x-.5,z:e.z+h.fondo/2}:e.giro===2?{x:e.x+h.ancho/2,z:e.z-.5}:{x:e.x+h.ancho+.5,z:e.z+h.fondo/2};s.posicionExterior={zona:'granja',...p};}s.interior=null;s.servicio=null;r={...bien('De vuelta al exterior.'),...(p?{posicionZona:p}:{})};break;}
   case 'viajar':{
    if(!['granja','pueblo','bosque','lago','mina','bosque_ancestral'].includes(a.zona))return mal('Zona desconocida.');if((a.zona==='mina'||a.zona==='bosque_ancestral')&&!this.posee(a.zona))return mal('Completa misiones para abrir esta ruta.');
    let llegada:{x:number;z:number}|undefined;
    if(a.ruta!==undefined||a.xJugador!==undefined||a.zJugador!==undefined){const camino=SALIDAS.find(p=>p.id===a.ruta&&p.desde===s.zona&&p.hacia===a.zona);if(!camino||s.interior||s.servicio||!this.cerca(camino.x,camino.z,a.xJugador!,a.zJugador!,1.2))return mal('Camina hasta el sendero que conecta estas zonas.');llegada=camino.llegada;}
    if(s.compania.montada&&(a.zona==='mina'||!llegada))return mal('Desmonta antes de entrar en la mina. Con montura debes viajar por los senderos.');
    // Cada entrada comienza en la boca de la mina: los minerales de pisos anteriores
    // siguen siendo accesibles aunque el jugador aún no pueda picar en los profundos.
    if(a.zona==='mina'&&s.zona!=='mina')s.nivelMina=1;
    s.zona=a.zona;s.interior=null;s.servicio=null;s.enemigo=a.zona==='mina'?30+s.nivelMina*10:a.zona==='bosque_ancestral'?50:0;if(llegada){s.posicionExterior={zona:a.zona,...llegada};posicionMontada(s,llegada.x,llegada.z);}else delete s.posicionExterior;r={...bien(`Has llegado a ${a.zona.replace('_',' ')}.`),...(llegada?{posicionZona:llegada}:{})};break;
   }
   case 'rellenar_hueco':{
    const h=s.paisaje?.huecos.find(h=>h.id===a.id&&!h.relleno);if(s.zona!=='granja'||s.interior||s.servicio||!h||!this.celdaPropia(h.x,h.z))return mal('Compra este sector antes de reparar el terreno.');if(!this.cerca(h.x,h.z,a.xJugador,a.zJugador,2.4))return mal('Acércate al hueco para rellenarlo.');if(!this.puedePagar({piedra:5}))return mal('Necesitas 5 piedras para rellenar el hueco.');this.pagar({piedra:5});h.relleno=true;this.contar('huecos_rellenados');r=bien('Terreno reparado: ya puedes caminar, cultivar y construir aquí.');break;
   }
   case 'pescar':{
    if(s.herramienta!=='cana')return mal('Equipa la caña.');if(s.enemigo>0)return mal('Despeja la zona de monstruos antes de pescar.');const cebo=a.cebo||'lombriz';const disponibles=this.pecesDisponibles(cebo);if(!disponibles.length)return mal('No hay peces para ese cebo, hora, temporada y clima en esta zona.');if(!this.puedePagar({[cebo]:1}))return mal('No tienes ese cebo.');if(s.energia<this.costeEnergia('cana',3))return mal('Necesitas energía para lanzar la caña.');if(!finito(a.precision,0,1))return mal('Completa el minijuego de pesca.');
    const efectos=efectosHabilidades(s.habilidades),nivel=nivelHabilidad(s.habilidades,'pesca'),precision=Math.min(1,a.precision+this.nivelHerramienta()*.035+nivel*.01+(efectos.precision??0)),cantidad=1+(efectos.pecesExtra??0),calidad=Math.min(2,Math.max(efectos.calidadPez??0,nivel>=7&&precision>=.9?1:0)) as Calidad;
    const mochilaTrasCebo=cambiarCantidad(s.casillasInventario,cebo,-1)!;
    if(disponibles.some(p=>!cambiarCantidad(mochilaTrasCebo,p.id,cantidad,calidad)))return mal('Reserva una casilla de la mochila para el pez antes de lanzar.');
    this.pagar({[cebo]:1});s.energia=Math.max(0,s.energia-this.costeEnergia('cana',3));if(precision<.25){r=bien('El pez escapó. Un nuevo lanzamiento usará otro cebo.');break}
    const pesos=disponibles.map(p=>1/(p.rareza*p.rareza));let aleatorio=this.random()*pesos.reduce((a,b)=>a+b,0),indice=0;while(indice<pesos.length-1&&aleatorio>=pesos[indice])aleatorio-=pesos[indice++];const pez=disponibles[indice];this.agregar(pez.id,cantidad,calidad);this.experiencia('pesca',8+pez.rareza*4);this.contar('pescar',cantidad);this.contar(`pez_${pez.id}`,cantidad);r=bien(`¡Has pescado ${cantidad} × ${pez.nombre.toLowerCase()} · ${nombreCalidad(calidad)}!`);break;
   }
   case 'combatir':{
    if(s.herramienta!=='espada')return mal('Equipa la espada.');if(s.enemigo<=0)return mal('No hay un monstruo frente a ti.');if(s.energia<this.costeEnergia('espada',4))return mal('Retírate y descansa antes de combatir.');s.energia=Math.max(0,s.energia-this.costeEnergia('espada',4));s.enemigo=Math.max(0,s.enemigo-(22+this.nivelHerramienta()*6+this.bonos().ataque));if(s.enemigo>0)s.vida=Math.max(0,s.vida-Math.max(1,8+s.nivelMina*2-this.bonos().defensa));else{this.crearDrops({cristal:1},s.zona==='bosque_ancestral'?-76:0,s.zona==='bosque_ancestral'?74:1);this.contar('monstruos');this.experiencia('combate',30+s.nivelMina*5);}
    if(s.vida<=0){s.zona='granja';s.enemigo=0;s.vida=35;s.energia=25;r=bien('Te rescataron y volviste a casa. Conservas tus recursos.')}else r=bien(s.enemigo?'El monstruo retrocede.':'Zona despejada. Puedes recolectar con seguridad.');break;
   }
   case 'extraer':return mal('Selecciona un árbol o una roca de la zona y golpéalo con la herramienta. Los recursos ya no son infinitos.');
   case 'descender':if(s.zona!=='mina'||s.enemigo>0)return mal('Despeja la mina antes de descender.');if(s.nivelMina>=5)return mal('Has alcanzado el último nivel de esta colección.');s.nivelMina++;s.enemigo=30+s.nivelMina*10;r=bien(`Mina: nivel ${s.nivelMina}.`);break;
   case 'continuar_dia':if(!s.jornada.resumenPendiente||a.jornada!==s.jornada.diasCompletados)return mal('Esta mañana ya está abierta.');s.jornada.resumenPendiente=false;r=bien('Buenos días. El valle te espera.');break;
   case 'dormir':{
    if(a.jornada!==s.jornada.diasCompletados)return mal('Esta jornada ya se ha guardado.');const casa=s.edificios.find(e=>e.id===a.edificioId&&articulo(e.articulo)?.categoria==='casa');
    if(!casa||s.zona!=='granja'||s.servicio||s.interior&&s.interior!==casa.id)return mal('Duerme en tu cabaña para cerrar la jornada.');
    const h=huella(casa),p=casa.giro===0?{x:casa.x+h.ancho/2,z:casa.z+h.fondo+.5}:casa.giro===1?{x:casa.x-.5,z:casa.z+h.fondo/2}:casa.giro===2?{x:casa.x+h.ancho/2,z:casa.z-.5}:{x:casa.x+h.ancho+.5,z:casa.z+h.fondo/2};
    if(s.interior!==casa.id&&(!finito(a.xJugador,-1000,1000)||!finito(a.zJugador,-1000,1000)||Math.hypot(a.xJugador-p.x,a.zJugador-p.z)>2.8))return mal('Acércate a la puerta de tu cabaña para dormir.');
    if(s.jornada.diasCompletados>=1_000_000)return mal('El calendario alcanzó su límite.');
    const ventas=resumenEnvios(s.envios);if(s.monedas+ventas.total>1e9)return mal('El envío supera el límite de monedas. Retira productos antes de dormir.');
    this.atenderLluvia();let avanzados=0,maduros=0;
    const aspersores=s.produccion.estructuras.filter(n=>n.zona==='granja'&&obtenerObjeto(n.articulo)?.aspersor);
    for(const parcela of this.todasParcelas()){
     const c=parcela.cuidado;if(c?.status!=='creciendo')continue;
     if(s.invernaderos.some(i=>i.riegoAutomatico&&i.parcelas.includes(parcela))||s.parcelas.includes(parcela)&&aspersores.some(n=>Math.max(Math.abs(n.x-parcela.x),Math.abs(n.z-parcela.z))<=(obtenerObjeto(n.articulo)?.aspersor?.radio??0))||s.ayudante&&s.ayudante.hasta>now){parcela.cuidado=regarCultivo(c,now);parcela.campo??=crearCampo();parcela.campo.riegoDia=s.jornada.diasCompletados;}
     if(parcela.campo?.riegoDia!==s.jornada.diasCompletados)continue;
     const antes=parcela.cuidado!,despues=avanzarCultivoDia(antes,CRECIMIENTO_NOCHE_MS,now);parcela.cuidado=despues;
     if(despues.grownMs>antes.grownMs)avanzados++;if(despues.status==='maduro'&&antes.status!=='maduro')maduros++;
    }
    for(const f of s.frutales){if(s.ayudante&&s.ayudante.hasta>now||f.edificioId&&s.invernaderos.some(i=>i.edificioId===f.edificioId&&i.riegoAutomatico)||!f.edificioId&&aspersores.some(n=>Math.max(Math.abs(n.x-f.x),Math.abs(n.z-f.z))<=(obtenerObjeto(n.articulo)?.aspersor?.radio??0)))regarFrutal(f,s.jornada.diasCompletados,now);const paso=avanzarFrutal(f,s.jornada.diasCompletados,now,this.frutalDespejado(f));if(paso.crecio)this.contar('frutales_crecidos');if(paso.maduro)this.contar('frutales_maduros');if(paso.producido)this.contar('fruta_producida');}
    for(const animal of s.animales)animal.edadDias=Math.min(1_000_003,animal.edadDias+1);
    for(const i of s.ganaderia.incubadoras){const h=i.huevo;if(!h)continue;const huevo=leerHuevo(h.articulo)!;h.dias++;if(h.dias>=GANADO[huevo.especie].incubacion){this.nacimiento(huevo.especie,huevo.genoma,huevo.sexo,i.edificioId,h.nombre,now);i.huevo=null;this.contar('huevos_incubados');}}
    cerrarDiaCompania(s);this.paseosCompania.limpiar();s.vida=100;s.energia=100;s.interior=null;s.servicio=null;s.enemigo=0;s.posicionExterior={zona:'granja',...p};this.contar('dias_dormidos');
    s.monedas+=ventas.total;for(const c of s.envios.cajas)c.casillas.fill(null);if(ventas.total){this.contar('ingresos_envio',ventas.total);this.contar('vender',ventas.lineas.reduce((n,p)=>n+p.cantidad,0));}
    const terminadas=this.avanzarObras();const resumen=cerrarJornada(s.jornada,now,Math.floor(s.monedas),s.estadisticas,avanzados,maduros);if(terminadas.length)resumen.obras=terminadas;entregarCorreo(s);vencerEncargos(s);reiniciarRutinas(s);this.brotarMaleza();resumen.envios=ventas;resumen.aprendizajes=reconocerAprendizajes(s.habilidades,RECETAS);r={...bien('Jornada cerrada. Amanecerá a las 06:00.'),resumenJornada:resumen,posicionZona:p};break;
   }
   case 'descansar':if(s.zona!=='granja'&&s.zona!=='pueblo')return mal('Regresa a un lugar seguro para descansar.');s.vida=100;s.energia=100;r=bien('Descansaste y recuperaste fuerzas. El reloj de cuidado sigue su curso.');break;
   case 'reclamar':{
    const m=this.getMisionActual();if(!m||m.id!==a.misionId)return mal('Esta misión no es la misión activa.');if(!Object.entries(m.requisitos).every(([k,v])=>(s.estadisticas[k]||0)>=v))return mal('Aún quedan objetivos por completar.');s.misionesCompletadas.push(m.id);s.monedas+=m.monedas;for(const [k,v] of Object.entries(m.recursos||{}))this.agregar(k,v);s.desbloqueos=[...new Set([...s.desbloqueos,...m.desbloqueos])];if(m.tokenCasa)s.tokensCasa.push(m.tokenCasa);this.contar('misiones');r=bien(`Misión completada: ${m.nombre}. +${m.monedas} monedas${m.tokenCasa?' y un desbloqueo especial para la casa':''}.`);break;
   }
   case 'ayudante':if(!this.posee('ayudante'))return mal('Completa los linajes fantásticos para contratar al mayordomo.');if(s.ayudante&&s.ayudante.hasta>now)return mal('Ya tienes un contrato activo.');if(s.monedas<180)return mal('El contrato de 72 horas cuesta 180 monedas.');s.monedas-=180;s.ayudante={desde:now,hasta:now+3*DIA,ultimoTurno:now};r=bien('Mayordomo contratado por 72 horas: riega, cuenta cuentos y usa el heno de tu inventario cada 6 horas.');break;
   default:return mal('Acción desconocida.');
  }
  s.revision++;return r;
 }
 exportar(compacto=false):string{this.actualizar();return JSON.stringify(this.estado,null,compacto?undefined:2)}
 cargarJSON(json:string):Resultado {
  let v:unknown;try{if(json.length>16_000_000)return mal('El archivo es demasiado grande.');v=migrarEstado(JSON.parse(json))}catch{return mal('El archivo no contiene JSON válido.')}
  let error:string|null;try{error=validarEstado(v)}catch{return mal('Partida no válida: estructura incompatible.')}
  if(error)return mal(`Partida no válida: ${error}`);
  const anterior=this.estado;
  try{this.estado=clonar(v as EstadoGranja);this.paseosCompania.limpiar();this.jornadaLluvia=-1;this.revisionLluvia=-1;this.actualizar()}catch{this.estado=anterior;return mal('Partida no válida: fechas o cuidados incoherentes.')}
  return bien('Partida cargada. Se han calculado los cuidados pendientes.');
 }
}

export function validarEstado(v:unknown):string|null {
 if(!v||typeof v!=='object')return 'falta el estado';const s=v as EstadoGranja;
 if(s.version!==5)return 'versión incompatible';
  if(!correoValido(s.correo,s.jornada?.diasCompletados))return 'correo inválido';
  if(!vidaSocialValida(s.vidaSocial,s.jornada?.diasCompletados))return 'vida social inválida';
  if(!encargosValidos(s.encargos,s.jornada?.diasCompletados,s.estadisticas??{}))return 'encargos inválidos';
 if(!habilidadesValidas(s.habilidades,RECETAS))return 'habilidades inválidas';
 if(s.jornada?.ultimaNoche?.aprendizajes!==undefined&&(!aprendizajesValidos(s.jornada.ultimaNoche.aprendizajes,RECETAS)||s.jornada.ultimaNoche.aprendizajes.some(a=>a.hasta>s.habilidades.reconocidos[a.habilidad])))return 'aprendizajes de la noche inválidos';
 if(!tiempoValido(s.tiempo))return 'clima inválido';
 if(!jornadaValida(s.jornada,s.ultimoTiempo))return 'jornada inválida';
 if(s.paisaje!==undefined&&!paisajeValido(s.paisaje))return 'paisaje inválido';
 if(s.posicionExterior!==undefined&&(!s.posicionExterior||!['granja','pueblo','bosque','lago','mina','bosque_ancestral'].includes(s.posicionExterior.zona)||!dentroDeZona(s.posicionExterior.zona,s.posicionExterior.x,s.posicionExterior.z)))return 'posición exterior inválida';
 const produccionError=errorProduccion(s.produccion);if(produccionError)return produccionError;const aventuraError=errorAventura(s.aventura);if(aventuraError)return aventuraError;
 if(s.produccion.ultimoTiempo>s.ultimoTiempo)return 'reloj de producción incoherente';
 if(s.aventura.destinoActual){if(!s.posicionAventura||!esTransitableAventura(s.aventura,s.posicionAventura.x,s.posicionAventura.z,0))return 'posición de expedición inválida';if(s.interior||s.servicio)return 'expedición dentro de un servicio';}else if(s.posicionAventura!==null)return 'posición de expedición sin destino';
 if(!finito(s.ultimoTiempo)||!finito(s.inicioTiempo)||s.inicioTiempo>s.ultimoTiempo)return 'reloj incoherente';
 if(!entero(s.revision,0,1e9)||!entero(s.secuencia,0,1e9)||!finito(s.monedas,0,1e9)||!finito(s.vida,0,100)||!finito(s.energia,0,100)||!finito(s.enemigo,0,1000)||!entero(s.nivelMina,1,5))return 'estadísticas fuera de rango';
 if(!['granja','pueblo','bosque','lago','mina','bosque_ancestral'].includes(s.zona)||!['ella','el'].includes(s.personaje)||!HERRAMIENTAS.some(h=>h.id===s.herramienta))return 'posición o herramienta desconocida';
 for(const k of ['inventario','estadisticas'] as const){if(!s[k]||typeof s[k]!=='object'||Array.isArray(s[k])||Object.keys(s[k]).length>500||!Object.entries(s[k]).every(([key,val])=>articuloValido(key)&&entero(val,0,1e9)))return `${k} inválido`}
 const errorMochila=validarMochila(s);if(errorMochila)return errorMochila;if(!validarBarra(s,s.casillasInventario.length,s.ultimoTiempo))return 'barra o equipo inválido';
 if(!Array.isArray(s.sectorIds)||!s.sectorIds.includes(0)||s.sectorIds.length>30||new Set(s.sectorIds).size!==s.sectorIds.length||!s.sectorIds.every(id=>entero(id,0,29)))return 'sectores inválidos';
 for(const k of ['misionesCompletadas','desbloqueos','tokensCasa'] as const)if(!Array.isArray(s[k])||s[k].length>100||new Set(s[k]).size!==s[k].length||s[k].some(x=>typeof x!=='string'||x.length>80))return `${k} inválidos`;
 if(s.misionesCompletadas.some((id,i)=>MISIONES[i]?.id!==id))return 'misiones fuera de orden';
 if(!Array.isArray(s.edificios)||s.edificios.length>MAX_EDIFICIOS||!Array.isArray(s.animales)||s.animales.length>MAX_ANIMALES||!Array.isArray(s.obstaculos)||s.obstaculos.length>1000||!Array.isArray(s.parcelas)||s.parcelas.length>9600)return 'colecciones fuera de límite';
 if(!Array.isArray(s.frutales)||s.frutales.length>400||!Array.isArray(s.invernaderos)||s.invernaderos.length>MAX_INVERNADEROS)return 'huerto o invernaderos inválidos';
 const recintos=new Set<string>();if(s.invernaderos.length!==s.edificios.filter(e=>e.articulo==='invernadero').length||s.invernaderos.some(i=>!i||typeof i.edificioId!=='string'||recintos.has(i.edificioId)||(recintos.add(i.edificioId),false)||!s.edificios.some(e=>e.id===i.edificioId&&e.articulo==='invernadero')||typeof i.riegoAutomatico!=='boolean'||!Array.isArray(i.parcelas)||i.parcelas.length>36))return 'recinto de invernadero inválido';
 if(!enviosValidos(s.envios,s.edificios))return 'envíos inválidos';
 const ids=new Set<string>();const id=(v:unknown)=>typeof v==='string'&&/^[a-z0-9_]+$/.test(v)&&v.length<100&&!ids.has(v)&&(ids.add(v),true);
 for(const e of s.edificios){if(e?.henoCalidades!==undefined&&(!e.especie||!Array.isArray(e.henoCalidades)||e.henoCalidades.length!==4||e.henoCalidades.some(n=>!entero(n,0,64))||e.henoCalidades.reduce((n,k)=>n+k,0)!==e.henoReserva))return 'calidades del comedero inválidas';if(e?.puertaGanado!==undefined&&(!e.especie||typeof e.puertaGanado!=='boolean')||e?.henoReserva!==undefined&&(!e.especie||!entero(e.henoReserva,0,64)))return 'refugio con cuidados inválidos';const def=articulo(e?.articulo);if(!e||e.nivel!==undefined&&(!e.especie||!entero(e.nivel,1,3))||!id(e.id)||!def||def.categoria==='insumo'||!entero(e.x)||!entero(e.z)||!entero(e.giro,0,3)||e.clima!==def.clima||e.especie!==def.especie||!finito(e.pasto,0,64)||!finito(e.ultimoPastoAt,0,s.ultimoTiempo))return 'edificio inválido';const h=huella(e);for(let z=h.z;z<h.z+h.fondo;z++)for(let x=h.x;x<h.x+h.ancho;x++)if(!s.sectorIds.includes(sectorDeCelda(x,z)?.id??-1)||aguaEn(s.paisaje,x,z)||huecoEn(s.paisaje,x,z))return 'edificio fuera del terreno disponible'}
 for(let i=0;i<s.edificios.length;i++)if(s.edificios.slice(i+1).some(e=>solapa(huella(e),huella(s.edificios[i]))))return 'edificios superpuestos';
 const celdas=new Set<string>();const grupos=[{edificioId:undefined as string|undefined,parcelas:s.parcelas},...s.invernaderos];for(const grupo of grupos)for(const p of grupo.parcelas){const key=(grupo.edificioId?grupo.edificioId+':':'')+`${p?.x},${p?.z}`;if(!p||!entero(p.x)||!entero(p.z)||celdas.has(key)||(grupo.edificioId?!camaInvernadero(p.x,p.z):!s.sectorIds.includes(sectorDeCelda(p.x,p.z)?.id??-1)||s.edificios.some(e=>contiene(huella(e),p.x,p.z))||aguaEn(s.paisaje,p.x,p.z)||huecoEn(s.paisaje,p.x,p.z)))return 'parcela inválida';celdas.add(key);if(p.campo!==undefined&&(!campoValido(p.campo)||p.campo.riegoDia!==null&&p.campo.riegoDia>s.jornada.diasCompletados||p.campo.riegoManualDia!=null&&p.campo.riegoManualDia>s.jornada.diasCompletados))return 'datos de parcela inválidos';if(p.cultivo===null&&p.cuidado===null)continue;const def=CULTIVOS.find(c=>c.id===p.cultivo),c=p.cuidado;if(!def||!c||!['creciendo','maduro','arruinado'].includes(c.status)||!finito(c.plantedAt,0,s.ultimoTiempo)||!finito(c.lastEvaluatedAt,c.plantedAt,s.ultimoTiempo)||!finito(c.grownMs,0,c.growthMs)||c.growthMs!==duracionCampo(def,p.campo??crearCampo())||!(c.lastWateredAt===null||finito(c.lastWateredAt,c.plantedAt,c.lastEvaluatedAt))||!(c.maturedAt===null||finito(c.maturedAt,c.plantedAt,c.lastEvaluatedAt))||!(c.ruinedAt===null||finito(c.ruinedAt,c.plantedAt,c.lastEvaluatedAt)))return 'cultivo inválido';if(p.campo?.ciclo==='rebrote'&&!def.rebroteHoras)return 'rebrote no disponible';
  if(c.status==='maduro'?(c.grownMs!==c.growthMs||c.maturedAt===null||c.ruinedAt!==null):c.status==='arruinado'?(c.grownMs>=c.growthMs||c.ruinedAt===null||c.maturedAt!==null):(c.grownMs>=c.growthMs||c.maturedAt!==null||c.ruinedAt!==null))return 'madurez de cultivo incoherente';
 }
 for(const f of s.frutales){
  if(!f||!id(f.id)||!frutalValido(f,s.ultimoTiempo,s.jornada.diasCompletados)||f.edificioId!==undefined&&(typeof f.edificioId!=='string'||!recintos.has(f.edificioId)))return 'frutal inválido';
  if(f.edificioId?camaInvernadero(f.x,f.z)||!dentroInvernadero(f.x-1,f.z-1)||!dentroInvernadero(f.x+1,f.z+1):!s.sectorIds.includes(sectorDeCelda(f.x,f.z)?.id??-1)||s.edificios.some(e=>contiene(huella(e),f.x,f.z))||aguaEn(s.paisaje,f.x,f.z)||huecoEn(s.paisaje,f.x,f.z)||esSenderoGranja(f.x,f.z)||[...s.produccion.cofres,...s.produccion.maquinas,...s.produccion.estructuras].some(n=>contiene(huellaProduccion(n),f.x,f.z))||s.obstaculos.some(o=>(o.zona??'granja')==='granja'&&o.hp>0&&o.x===f.x&&o.z===f.z))return 'frutal sobre terreno ocupado';
  if(celdas.has((f.edificioId?f.edificioId+':':'')+f.x+','+f.z)||s.frutales.some(g=>g!==f&&g.edificioId===f.edificioId&&Math.max(Math.abs(g.x-f.x),Math.abs(g.z-f.z))<3))return 'frutales superpuestos';
 }
 for(const n of [...s.produccion.cofres,...s.produccion.maquinas,...s.produccion.estructuras]){if(n.zona!=='granja')return 'producción fuera de la granja';const h=huellaProduccion(n);for(let z=h.z;z<h.z+h.fondo;z++)for(let x=h.x;x<h.x+h.ancho;x++)if(!s.sectorIds.includes(sectorDeCelda(x,z)?.id??-1)||aguaEn(s.paisaje,x,z)||huecoEn(s.paisaje,x,z)||s.edificios.some(e=>contiene(huella(e),x,z))||s.parcelas.some(c=>c.x===x&&c.z===z)||s.obstaculos.some(o=>(o.zona??'granja')==='granja'&&o.hp>0&&o.x===x&&o.z===z))return 'producción sobre terreno ocupado';}
 const obstacles=new Set<string>();for(const o of s.obstaculos){
  const zona=o?.zona||'granja',key=`${zona},${o?.nivelMina||0},${o?.x},${o?.z}`;
  if(o?.gigante!==undefined&&(typeof o.gigante!=='boolean'||o.gigante&&o.tipo!=='arbol'))return 'árbol gigante inválido';
  if(!o||!id(o.id)||!['arbol','roca','maleza','ruina'].includes(o.tipo)||!entero(o.x)||!entero(o.z)||!['granja','bosque','mina','bosque_ancestral'].includes(zona)||!entero(o.hpMax,1,100)||!entero(o.hp,0,o.hpMax)||!(o.regeneraEn===null||finito(o.regeneraEn,s.ultimoTiempo))||obstacles.has(key))return 'obstáculo inválido';
  if(zona==='granja'&&(sectorDeCelda(o.x,o.z)?.id!==o.sectorId||o.hp===0||o.regeneraEn!==null||celdas.has(`${o.x},${o.z}`)||s.edificios.some(e=>contiene(huella(e),o.x,o.z))))return 'obstáculo de granja inválido';
  if(zona!=='granja'&&(o.sectorId!==-1||(o.hp===0)!==(o.regeneraEn!==null)))return 'regeneración de recurso incoherente';
  if(zona==='mina'&&!entero(o.nivelMina,1,5))return 'nivel de nodo inválido';obstacles.add(key);
 }
 for(const a of s.animales){if(a?.rutina!==undefined&&!rutinaValida(a.rutina))return 'rutina animal inválida';if(a?.productoLegado!==undefined&&(a.productoLegado!==true||a.sexo!=='macho'||!['vaca','cabra','gallina','pato','avestruz','dinosaurio'].includes(a.especie)||!entero(a.productos,1,5)))return 'producto legado inválido';if(a?.ultimoDiaExperiencia!==undefined&&!entero(a.ultimoDiaExperiencia,0,s.jornada.diasCompletados))return 'experiencia animal inválida';if(!a||!id(a.id)||!ESPECIES[a.especie]||!['hembra','macho'].includes(a.sexo)||typeof a.nombre!=='string'||a.nombre.length>32||!entero(a.edadDias,0,1_000_003)||!finito(a.nacimiento,-Number.MAX_SAFE_INTEGER,s.ultimoTiempo)||!finito(a.ultimoProductoAt,0,s.ultimoTiempo)||!entero(a.productos,0,5)||!(a.ultimoCruce===null||finito(a.ultimoCruce,0,s.ultimoTiempo)))return 'animal inválido';const e=s.edificios.find(e=>e.id===a.edificioId);if(!e||e.especie!==a.especie)return 'animal sin refugio';if(!a.genoma||Object.entries({A:'Aa',B:'Bb',F:'Ff',E:'Ee'}).some(([k,letras])=>!Array.isArray(a.genoma[k as keyof Genome])||a.genoma[k as keyof Genome].length!==2||a.genoma[k as keyof Genome].some(x=>typeof x!=='string'||!letras.includes(x)||x.length!==1)))return 'genoma inválido';const f=fenotipo(a.especie,a.genoma).fantasia;if(f&&FANTASIAS[f]?.clima!==e.clima)return 'hábitat incompatible';const c=a.cuidado;if(!c||!finito(c.lastEvaluatedAt,0,s.ultimoTiempo)||![c.lastFedAt,c.lastLovedAt].every(x=>finito(x,0,c.lastEvaluatedAt))||![c.illnessSince,c.depressionSince].every(x=>x===null||finito(x,0,c.lastEvaluatedAt))||!(c.lastComfortMethod===null||['acariciar','musica','cuento','cepillar'].includes(c.lastComfortMethod)))return 'cuidado inválido'}
 if(!ganaderiaValida(s.ganaderia,s))return 'ganadería inválida';
 if(!puebloValido(s.pueblo,s.jornada.diasCompletados))return 'habitantes del pueblo inválidos';if(!companiaValida(s))return 'compañeros inválidos';const obraError=errorObras(s);if(obraError)return obraError;
 for(const i of s.ganaderia.incubadoras){if(i.huevo){const h=leerHuevo(i.huevo.articulo)!,b=s.edificios.find(b=>b.id===i.edificioId)!,f=fenotipo(h.especie,h.genoma).fantasia;if(f&&FANTASIAS[f]?.clima!==b.clima)return 'incubación en hábitat incompatible';}}
 for(const e of s.edificios)if(e.especie&&s.animales.filter(a=>a.edificioId===e.id).length+reservaRefugio(s.ganaderia,e.id)>capacidadRefugio(e))return 'refugio sobreocupado';
 if(viviendaInterior(s.interior)&&(s.zona!=='pueblo'||s.servicio!==null))return 'vivienda fuera del pueblo';
 if(s.interior!==null&&!viviendaInterior(s.interior)&&!s.edificios.some(e=>e.id===s.interior))return 'interior inexistente';
 if(s.ayudante&&(!finito(s.ayudante.desde,0,s.ultimoTiempo)||!finito(s.ayudante.hasta,s.ayudante.desde,s.ayudante.desde+3*DIA)||!finito(s.ayudante.ultimoTurno,s.ayudante.desde,s.ultimoTiempo)))return 'contrato inválido';
 return null;
}

function validarMochila(s:EstadoGranja):string|null{
 const clave=articuloValido;
 if(!Array.isArray(s.casillasInventario)||![24,36].includes(s.casillasInventario.length)||s.casillasInventario.some(p=>p!==null&&(!p||!clave(p.articulo)||!entero(p.cantidad,1,limitePila(p.articulo))||(p.calidad!==undefined&&!entero(p.calidad,0,3)))))return 'casillas de inventario inválidas';
 const total=resumirCasillas(s.casillasInventario);if([...new Set([...Object.keys(total),...Object.keys(s.inventario)])].some(id=>(total[id]||0)!==(s.inventario[id]||0)))return 'inventario y casillas no coinciden';
 if(!s.almacenMigracion||typeof s.almacenMigracion!=='object'||Array.isArray(s.almacenMigracion)||Object.keys(s.almacenMigracion).length>500||Object.entries(s.almacenMigracion).some(([id,n])=>!clave(id)||!entero(n,0,1e9)))return 'almacén de migración inválido';
 if(!s.nivelesHerramienta||typeof s.nivelesHerramienta!=='object'||HERRAMIENTAS_MEJORABLES.some(h=>!entero(s.nivelesHerramienta[h],0,4))||Object.keys(s.nivelesHerramienta).some(h=>!HERRAMIENTAS_MEJORABLES.includes(h as never)))return 'niveles de herramientas inválidos';
 const mejora=s.mejoraHerramienta;if(mejora!==null&&(!mejora||!HERRAMIENTAS_MEJORABLES.includes(mejora.herramienta)||!entero(mejora.nivel,1,4)||mejora.nivel!==s.nivelesHerramienta[mejora.herramienta]+1||!finito(mejora.hasta,0,s.ultimoTiempo+90_000)||s.herramienta===mejora.herramienta))return 'encargo de herrería inválido';
 if(s.servicio!==null&&(!SERVICIOS.includes(s.servicio)||s.zona!=='pueblo'||s.interior!==null))return 'servicio fuera del pueblo';
 if(!finito(s.ultimoGolpeAt,0,s.ultimoTiempo))return 'fecha de golpe inválida';
 if(!Array.isArray(s.drops)||s.drops.length>MAX_DROPS)return 'objetos del suelo fuera de límite';const ids=new Set<string>();
 for(const d of s.drops){if(!d||!clave(d.id)||ids.has(d.id)||!clave(d.articulo)||!entero(d.cantidad,1,MAX_PILA)||!finito(d.x,-1000,1000)||!finito(d.z,-1000,1000)||!['granja','pueblo','bosque','lago','mina','bosque_ancestral'].includes(d.zona)||(d.zona==='mina'&&!entero(d.nivelMina,1,5)))return 'objeto del suelo inválido';ids.add(d.id);}
 return null;
}

/** Migración única y sin pérdidas. Una mochila antigua desbordada conserva un almacén de recuperación. */
function migrarVersion3(valor:unknown):unknown{
 if(!valor||typeof valor!=='object'||(valor as {version?:number}).version!==3)return valor;
 const s=clonar(valor) as Record<string,any>;
 if(!s.inventario||!Array.isArray(s.obstaculos))return valor;
 if(Object.entries(s.inventario).some(([k,v])=>!articuloValido(k)||!entero(v,0,1e9)))return valor;
 const reparto=distribuirInventario(s.inventario,36);s.casillasInventario=reparto.casillas;s.almacenMigracion=reparto.almacen;s.inventario=resumirCasillas(reparto.casillas);
 s.nivelesHerramienta=Object.fromEntries(HERRAMIENTAS_MEJORABLES.map(h=>[h,0]));s.mejoraHerramienta=null;s.servicio=null;s.drops=[];s.ultimoGolpeAt=0;
 s.obstaculos=s.obstaculos.map((o:Obstaculo)=>({...o,hp:VIDA_RECURSO[o.tipo],hpMax:VIDA_RECURSO[o.tipo],zona:'granja',regeneraEn:null}));s.obstaculos.push(...nodosExteriores());s.version=4;return s;
}


/** La barra comparte casillas reales con la mochila: nunca clona objetos. */
export function migrarEstado(valor:unknown):unknown {
 const antiguo=migrarVersion3(valor);
 if(antiguo&&typeof antiguo==='object'&&(antiguo as any).version===5){
  const s=clonar(antiguo) as any;if(s.correo===undefined)s.correo=crearCorreo();if(s.vidaSocial===undefined)s.vidaSocial=crearVidaSocial();if(s.encargos===undefined)s.encargos=crearEncargos();if(s.pueblo===undefined)s.pueblo=crearPuebloEstado();else if(s.pueblo?.version===1&&Array.isArray(s.pueblo.relaciones)&&s.pueblo.relaciones.length===9&&s.pueblo.relaciones.every((r:any)=>crearPuebloEstado().relaciones.slice(0,9).some(n=>n.id===r?.id)))s.pueblo.relaciones.push(...crearPuebloEstado().relaciones.filter(n=>!s.pueblo.relaciones.some((r:any)=>r?.id===n.id)));if(s.obras===undefined)s.obras=crearObras();if(s.compania===undefined)s.compania=crearCompania();if(s.ganaderia===undefined){s.ganaderia=crearGanaderia(s.edificios?.some((b:any)=>b.id==='corral_inicial'&&b.especie==='gallina')?'corral_inicial':undefined);if(Array.isArray(s.animales))for(const a of s.animales)if(a?.sexo==='macho'&&['vaca','cabra','gallina','pato','avestruz','dinosaurio'].includes(a.especie)&&a.productos>0)a.productoLegado=true;}if(s.tiempo===undefined&&finito(s.inicioTiempo))s.tiempo=crearTiempo(s.inicioTiempo);if(s.produccion===undefined)s.produccion=crearProduccion(s.ultimoTiempo);if(s.aventura===undefined){s.aventura=crearAventura();s.posicionAventura=null;}
  if(s.envios===undefined){
   s.envios=crearEnvios();if(Array.isArray(s.edificios))s.envios.cajas=s.edificios.filter((e:any)=>e?.articulo===ARTICULO_ENVIO).map((e:any)=>crearCajaEnvio(e.id));
   // Un plano de bienvenida para partidas anteriores; no altera su paisaje ni construcciones.
   if(!s.envios.cajas.length&&s.almacenMigracion&&typeof s.almacenMigracion==='object'&&!Array.isArray(s.almacenMigracion))s.almacenMigracion.creacion_caja_envio=(s.almacenMigracion.creacion_caja_envio??0)+1;
  }
  if(s.frutales===undefined)s.frutales=[];if(s.invernaderos===undefined&&Array.isArray(s.edificios))s.invernaderos=s.edificios.filter((e:any)=>e?.articulo==='invernadero').map((e:any)=>crearInvernadero(e.id));
  const relojAnterior=s.jornada===undefined||s.jornada?.version===1;
  if(s.jornada===undefined&&finito(s.ultimoTiempo)&&finito(s.inicioTiempo)&&s.ultimoTiempo>=s.inicioTiempo){const dias=Math.floor((s.ultimoTiempo-s.inicioTiempo)/1_800_000),fraccion=(s.ultimoTiempo-s.inicioTiempo)%1_800_000/1_800_000;s.jornada=crearJornada(Math.floor(s.monedas),s.estadisticas,dias,INICIO_DIA+fraccion*(FIN_DIA-INICIO_DIA));}
  if(relojAnterior&&s.jornada){
   if(s.jornada.version===1)s.jornada.version=2;
   if(Array.isArray(s.parcelas))for(const p of s.parcelas){
    if(!p||typeof p!=='object')continue;const def=CULTIVOS.find(c=>c.id===p.cultivo),c=p.cuidado;
    const campo=p.campo??crearCampo();if(campo.riegoDia===undefined)campo.riegoDia=c?.lastWateredAt!=null?s.jornada.diasCompletados:null;p.campo=campo;
    if(def&&c){const anterior=(campo.ciclo==='rebrote'?def.rebroteHoras??def.horas:def.horas)*HORA;
     // Duraciones falsas y proporciones fuera de rango se dejan para el validador.
     if(c.growthMs===anterior&&finito(c.grownMs,0,anterior)){const proporcion=c.grownMs/anterior;c.growthMs=duracionCampo(def,campo);c.grownMs=proporcion*c.growthMs;}
    }
   }
   if(Array.isArray(s.animales))for(const a of s.animales)if(a&&a.edadDias===undefined&&ESPECIES[a.especie as Species]&&finito(s.ultimoTiempo)&&finito(a.nacimiento,-Number.MAX_SAFE_INTEGER,s.ultimoTiempo))a.edadDias=Math.min(1_000_003,Math.floor((s.ultimoTiempo-a.nacimiento)/DIA));
  }
  if(s.habilidades===undefined){
   const h=crearHabilidades(),stats=s.estadisticas??{},numero=(id:string)=>Number.isSafeInteger(stats[id])&&stats[id]>0?Math.min(15000,stats[id]):0;
   h.experiencia.agricultura=Math.min(15000,numero('cosechar')*12+numero('fruta_recogida')*8+numero('producto')*5+numero('nacimientos')*25);
   h.experiencia.mineria=Math.min(15000,numero('mineria')*12+numero('mineral')*4);
   h.experiencia.recoleccion=Math.min(15000,numero('madera')*3+numero('frutales_talados')*12);
   h.experiencia.pesca=Math.min(15000,numero('pescar')*12);h.experiencia.combate=Math.min(15000,numero('monstruos')*30);
   for(const habilidad of HABILIDADES)h.reconocidos[habilidad]=nivelHabilidad(h,habilidad);
   const nivel=Math.max(0,...Object.values(s.nivelesHerramienta??{}).filter((v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v))) as number;
   h.recetasLegadas=RECETAS.filter(r=>r.nivel<=nivel&&(!r.requisito||s.desbloqueos?.includes(r.requisito))).map(r=>r.id);
   // Conserva recetas configuradas o pagadas aun si cambiaron los descubrimientos.
   for(const m of s.produccion?.maquinas??[])for(const id of [m.recetaId,m.proceso?.recetaId,...(m.cola??[]).map((p:any)=>p.recetaId)])if(RECETAS.some(r=>r.id===id)&&!h.recetasLegadas.includes(id))h.recetasLegadas.push(id);
   s.habilidades=h;
  }
  return s;
 }
if(!antiguo||typeof antiguo!=='object'||(antiguo as {version?:number}).version!==4)return antiguo;
 const s=clonar(antiguo) as Record<string,any>;
 if(!s.inventario||!Array.isArray(s.casillasInventario)||![24,36].includes(s.casillasInventario.length))return antiguo;
 const cantidades=s.inventario as Record<string,number>;if(Object.entries(cantidades).some(([id,n])=>!articuloValido(id)||!entero(n,0,1e9)))return antiguo;
 if(s.casillasInventario.some((p:any)=>p!==null&&(!p||typeof p.articulo!=='string'||!entero(p.cantidad,1,999))))return antiguo;const anterior=resumirCasillas(s.casillasInventario);if([...new Set([...Object.keys(anterior),...Object.keys(cantidades)])].some(k=>(anterior[k]||0)!==(cantidades[k]||0)))return antiguo;
 const barra=crearBarra();Object.assign(s,barra);
 // Las herramientas antes implícitas pasan a ser objetos únicos; nada del inventario anterior se descarta.
 const totales={...Object.fromEntries(HERRAMIENTAS_INICIALES.map(h=>['herramienta_'+h,1])),...cantidades};
 const reparto=distribuirInventario(totales,s.casillasInventario.length);s.casillasInventario=reparto.casillas;s.inventario=resumirCasillas(reparto.casillas);s.almacenMigracion={...s.almacenMigracion};
 for(const [id,n] of Object.entries(reparto.almacen))s.almacenMigracion[id]=(s.almacenMigracion[id]||0)+n;
 const at=s.casillasInventario.findIndex((p:Pila|null)=>p?.articulo==='herramienta_'+s.herramienta);if(at>=0){s.filaBarra=Math.floor(at/12);s.casillaActiva=at%12;}else{s.casillaActiva=Math.min(11,HERRAMIENTAS_INICIALES.length);s.herramienta='mano';}
 s.produccion=crearProduccion(s.ultimoTiempo);s.aventura=crearAventura();s.posicionAventura=null;s.version=5;return migrarEstado(s);
}
