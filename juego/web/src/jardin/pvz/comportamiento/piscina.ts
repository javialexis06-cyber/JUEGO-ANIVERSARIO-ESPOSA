import type {ComportamientoPlantaPvZ} from './index';
import type {MotorPvZ} from '../motor/motor';
import type {PlantaPvZ,ZombiPvZ} from '../tipos';

const datos=(m:MotorPvZ,p:PlantaPvZ)=>m.plantasDef[p.tipo].datos!;
const consumir=(m:MotorPvZ,p:PlantaPvZ)=>m.danarPlanta(p,p.vida);
const enemigo=(z:ZombiPvZ)=>z.vida>0&&!z.hipnotizado&&!z.sinCabeza&&!z.datos.zampalga;

/** Se conservan las distancias del tablero funcional; no depende de cajas del dibujo. */
function blancoAplastaflor(m:MotorPvZ,p:PlantaPvZ){
 const alcance=datos(m,p).alcance;
 return m.zombis.filter(z=>enemigo(z)&&z.fila===p.fila&&Math.abs(z.x-p.x)<=alcance&&
  !(z.datos.saltando>m.t)&&!z.datos.montado&&!z.datos.enTrineo)
  .sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x)||a.id-b.id)[0];
}

function soltarAlga(m:MotorPvZ,p:PlantaPvZ){
 const z=m.zombis.find(z=>z.id===p.datos.objetivo);
 if(z?.datos.zampalga===p.id){delete z.datos.zampalga;delete z.datos.arrastrado;}
}

/** Reglas de las ocho plantas de piscina de PvZ 1; el abono no se presupone. */
export const COMPORTAMIENTO_PISCINA_PLANTAS:Record<string,ComportamientoPlantaPvZ>={
 nenufar:{paso(){}},
 aplastaflor:{
  paso(m,p){
   const d=datos(m,p);
   if(p.datos.activada===undefined){
    const z=blancoAplastaflor(m,p);if(!z)return;
    p.datos.activada=m.t;p.datos.objetivo=z.id;p.datos.destinoX=z.x;
    m.eventos.push({t:'estado',id:p.id,tipo:'aplastaflor-mira',fila:p.fila,x:p.x,duracion:d.despegue});
   }
   const transcurrido=m.t-p.datos.activada;
   if(!p.datos.enAire&&transcurrido+1e-9>=d.despegue){
    // Una víctima que desaparece antes del salto permite buscar otra. Después se fija el impacto.
    const anterior=m.zombis.find(z=>z.id===p.datos.objetivo&&enemigo(z));
    const z=anterior??blancoAplastaflor(m,p);if(z)p.datos.destinoX=z.x;
    p.datos.enAire=1;
    m.eventos.push({t:'estado',id:p.id,tipo:'aplastaflor-salta',fila:p.fila,x:p.datos.destinoX,duracion:d.impacto-d.despegue});
   }
   if(transcurrido+1e-9<d.impacto)return;
   for(const z of m.zombis)if(enemigo(z)&&z.fila===p.fila&&Math.abs(z.x-p.datos.destinoX)<=d.radio)m.danarZombi(z,d.dano,'aplastar');
   m.eventos.push({t:'explosion',id:p.id,tipo:p.tipo,fila:p.fila,x:p.datos.destinoX});consumir(m,p);
  },
 },
 tripitidora:{
  iniciar(m,p){p.datos.reloj=m.azar.entre(.15,.45);},
  paso(m,p,dt){
   p.datos.reloj-=dt;if(p.datos.reloj>0)return;
   const filas=m.nivel.filas.filter(f=>Math.abs(f-p.fila)<=1);
   if(!filas.some(fila=>m.hayBlanco({...p,fila})))return;
   // Una tanda es indivisible frente al límite defensivo de proyectiles del motor.
   if(m.proyectiles.length+filas.length>500)return;
   const d=datos(m,p);for(const fila of filas)m.disparar({...p,fila},d.dano);
   p.datos.reloj=d.cada;p.datos.atacaHasta=m.t+.2;
  },
 },
 zampalga:{
  paso(m,p){
   const d=datos(m,p);
   if(p.datos.activada===undefined){
    const z=m.zombis.filter(z=>enemigo(z)&&z.fila===p.fila&&m.esAgua(z.fila)&&Math.abs(z.x-p.x)<=d.alcance)
     .sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x)||a.id-b.id)[0];
    if(!z)return;p.datos.objetivo=z.id;p.datos.activada=m.t;z.datos.zampalga=p.id;z.comiendo=null;
    m.eventos.push({t:'estado',id:z.id,tipo:'atrapado-alga',origen:p.id,fila:z.fila,x:z.x,duracion:d.retardo});
   }
   const z=m.zombis.find(z=>z.id===p.datos.objetivo&&z.vida>0);
   const transcurrido=m.t-p.datos.activada;
   if(z&&transcurrido+1e-9>=d.arrastra&&!z.datos.arrastrado){
    z.datos.arrastrado=1;m.eventos.push({t:'estado',id:z.id,tipo:'arrastrado',origen:p.id,fila:z.fila,x:z.x});
   }
   if(transcurrido+1e-9<d.retardo)return;
   if(z&&!z.hipnotizado)m.danarZombi(z,z.vida+z.armadura,'aplastar');
   consumir(m,p);
  },
  alMorir:soltarAlga,
 },
 jalapeno:{
  paso(m,p){
   const d=datos(m,p);if(p.edad+1e-9<d.retardo)return;
   for(const z of m.zombis)if(z.vida>0&&!z.hipnotizado&&z.fila===p.fila&&z.x<800)m.danarZombi(z,d.dano,'fuego');
   m.quitarHielo(p.fila);m.eventos.push({t:'explosion',id:p.id,tipo:p.tipo,fila:p.fila,x:p.x});consumir(m,p);
  },
 },
 pinchohierba:{
  iniciar(m,p){p.datos.reloj=datos(m,p).primero;},
  paso(m,p,dt){
   p.datos.reloj-=dt;if(p.datos.reloj>1e-9)return;
   const d=datos(m,p),blancos=m.zombis.filter(z=>enemigo(z)&&z.fila===p.fila&&Math.abs(z.x-p.x)<=d.radio&&!(z.datos.saltando>m.t));
   if(!blancos.length){p.datos.reloj=0;return;}
   for(const z of blancos){
    const vehiculo=m.esVehiculo(z);
    m.danarZombi(z,vehiculo?1800:d.dano,'aplastar');
    if(vehiculo){consumir(m,p);break;}
   }
   p.datos.reloj=d.cada;p.datos.atacaHasta=m.t+.2;
  },
 },
 // Transformación de guisantes y barrera de saltos viven en las colisiones comunes.
 plantorcha:{paso(){}},
 'nuez-alta':{paso(){}},
};
