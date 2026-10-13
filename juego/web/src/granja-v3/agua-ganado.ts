import { coordenadaRefugio } from './ganaderia';
import { cambiarCantidad, resumirCasillas } from './inventario';
import type { Animal, Edificio, EstadoGranja, Resultado } from './estado';

/** Agua finita del cuenco existente. No agrega un reloj real de enfermedad. */
export interface AguaGanado { version:1; reserva:number }
export type AccionAguaGanado =
 |{tipo:'instalar_bebedero';edificioId:string;xJugador:number;zJugador:number}
 |{tipo:'rellenar_bebedero';edificioId:string;cantidad:number;xJugador:number;zJugador:number};
export const CAPACIDAD_AGUA_GANADO=24;
export const COSTE_BEBEDERO={monedas:60,materiales:{piedra:8,cobre:2}};
export const ENERGIA_RELLENAR_BEBEDERO=2;
/** Los modelos existentes ya tienen estos cuencos; la vista no decide las bebidas. */
export const BEBEDERO_CORRAL={u:.7,v:7.3};
export const BEBEDERO_INTERIOR={x:.88,z:-.76};
export const PUNTO_BEBIDA_CORRAL={u:.7,v:7};
export const PUNTO_BEBIDA_INTERIOR={u:2.44,v:1.92};

export function aguaGanadoValida(v:unknown,b:Pick<Edificio,'especie'>):v is AguaGanado|undefined {
 if(v===undefined)return true;
 if(!v||typeof v!=='object'||!b.especie)return false;
 const a=v as AguaGanado;
 return a.version===1&&Number.isSafeInteger(a.reserva)&&a.reserva>=0&&a.reserva<=CAPACIDAD_AGUA_GANADO;
}
export function bebidaAnimalValida(v:unknown,dia:number):boolean {
 return v===undefined||Number.isSafeInteger(v)&&Number(v)>=0&&Number(v)<=dia;
}
/** Sigue al animal aunque lo trasladen o retiren el refugio anterior. */
export function animalBebio(s:Pick<EstadoGranja,'animales'|'jornada'>,id:string,dia=s.jornada.diasCompletados):boolean {
 return s.animales.some(a=>a.id===id&&a.bebidaDia===dia);
}
export function necesitaBebida(s:Pick<EstadoGranja,'jornada'>,b:Edificio,a:Animal):boolean {
 return !!b.aguaGanado&&b.aguaGanado.reserva>0&&a.bebidaDia!==s.jornada.diasCompletados;
}
/** Se llama solo al llegar al cuenco en un paso activo de las rutinas. */
export function beberGanado(s:EstadoGranja,b:Edificio,a:Animal):boolean {
 if(!necesitaBebida(s,b,a)||a.edificioId!==b.id||s.zona!=='granja'||s.servicio||s.astra?.actual||s.aventura.destinoActual||s.jornada.resumenPendiente||s.jornada.minutos<360||s.jornada.minutos>=1080)return false;
 const r=a.rutina,p=r?.lugar==='refugio'?PUNTO_BEBIDA_INTERIOR:PUNTO_BEBIDA_CORRAL;
 if(!r||r.lugar==='campo'||s.interior&&(s.interior!==b.id||r.lugar!=='refugio')||Math.hypot(r.u-p.u,r.v-p.v)>=.035)return false;
 b.aguaGanado!.reserva--;a.bebidaDia=s.jornada.diasCompletados;return true;
}
export function textoAguaGanado(s:Pick<EstadoGranja,'animales'|'jornada'>,b:Edificio):string {
 if(!b.aguaGanado)return 'Bebedero sin preparar';
 const animales=s.animales.filter(a=>a.edificioId===b.id),bebieron=animales.filter(a=>a.bebidaDia===s.jornada.diasCompletados).length;
 return `${b.aguaGanado.reserva} / ${CAPACIDAD_AGUA_GANADO} de agua · ${bebieron} / ${animales.length} bebieron hoy`;
}
export function cercaBebedero(s:EstadoGranja,b:Edificio,x:number,z:number):boolean {
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>1000||Math.abs(z)>1000||s.zona!=='granja'||s.servicio||s.astra?.actual||s.aventura.destinoActual||s.jornada.resumenPendiente)return false;
 if(s.interior){
  if(s.interior!==b.id)return false;
  // También se admite el control físico del comedero ya existente, al otro lado del pasillo.
  return Math.min(Math.hypot(x-BEBEDERO_INTERIOR.x,z-BEBEDERO_INTERIOR.z),Math.hypot(x+.88,z+.76))<=2.8;
 }
 const p=coordenadaRefugio(b,BEBEDERO_CORRAL.u,BEBEDERO_CORRAL.v);
 return Math.hypot(x-p.x,z-p.z)<=2.8;
}
/** El motor envuelve esta transacción con su guardado/reversión habitual. */
export function actuarAguaGanado(s:EstadoGranja,a:AccionAguaGanado):Resultado {
 const mal=(mensaje:string):Resultado=>({ok:false,mensaje}),b=s.edificios.find(b=>b.id===a.edificioId);
 if(!b?.especie||!cercaBebedero(s,b,a.xJugador,a.zJugador))return mal('Acércate al bebedero o al comedero de su refugio.');
 if(!aguaGanadoValida(b.aguaGanado,b))return mal('El bebedero necesita un estado válido.');
 if(a.tipo==='instalar_bebedero'){
  if(b.aguaGanado)return mal('Este refugio ya tiene su bebedero preparado.');
  if(s.monedas<COSTE_BEBEDERO.monedas)return mal('Preparar el bebedero cuesta 60 monedas, 8 piedras y 2 cobres.');
  let casillas=s.casillasInventario;
  for(const [id,cantidad] of Object.entries(COSTE_BEBEDERO.materiales)){
   const nuevas=cambiarCantidad(casillas,id,-cantidad);if(!nuevas)return mal('Necesitas 8 piedras y 2 cobres para preparar el bebedero.');casillas=nuevas;
  }
  s.casillasInventario=casillas;s.inventario=resumirCasillas(casillas);s.monedas-=COSTE_BEBEDERO.monedas;b.aguaGanado={version:1,reserva:0};
  return {ok:true,mensaje:'Bebedero preparado. Selecciona la regadera para llenarlo; cada animal beberá una porción por jornada.'};
 }
 if(a.tipo!=='rellenar_bebedero')return mal('Acción de bebedero desconocida.');
 if(!b.aguaGanado)return mal('Primero prepara el bebedero de este refugio.');
 if(!Number.isSafeInteger(a.cantidad)||a.cantidad<1||b.aguaGanado.reserva+a.cantidad>CAPACIDAD_AGUA_GANADO)return mal('El bebedero admite hasta 24 porciones de agua.');
 if(s.herramienta!=='regadera')return mal('Selecciona la regadera para llenar el bebedero.');
 if(s.energia<ENERGIA_RELLENAR_BEBEDERO)return mal('Necesitas 2 de energía para llenar el bebedero.');
 s.energia-=ENERGIA_RELLENAR_BEBEDERO;b.aguaGanado.reserva+=a.cantidad;
 return {ok:true,mensaje:`Guardaste ${a.cantidad} porciones de agua. Beben caminando al cuenco; el agua no sustituye comida ni cariño.`};
}
