import type {ComportamientoPlantaPvZ} from './index';
import type {MotorPvZ} from '../motor/motor';
import type {PlantaPvZ} from '../tipos';

const datos=(m:MotorPvZ,p:PlantaPvZ)=>m.plantasDef[p.tipo].datos!;
const consumir=(m:MotorPvZ,p:PlantaPvZ)=>m.danarPlanta(p,p.vida);

/** Las lanzadoras apuntan al zombi más cercano de su carril (o al jefe) que no vuele ni esté bajo tierra. */
function blancoLanzado(m:MotorPvZ,p:PlantaPvZ){
 return m.zombis.filter(z=>z.vida>0&&!z.hipnotizado&&!z.sinCabeza&&m.puedeRecibirProyectil(z,'lanzado')&&(z.fila===p.fila||!!z.datos.todasFilas)&&z.x>=p.x-10&&z.x<800)
  .sort((a,b)=>a.x-b.x||a.id-b.id)[0];
}
function lanzadora(proyectil:string):ComportamientoPlantaPvZ{
 return{
  iniciar(m,p){p.datos.reloj=m.azar.entre(.15,.45);},
  paso(m,p,dt){
   p.datos.reloj-=dt;if(p.datos.reloj>0)return;
   const z=blancoLanzado(m,p);if(!z)return;const d=datos(m,p);
   // PC: el Lanzamaíz elige mantequilla en uno de cada cuatro lanzamientos.
   if(p.tipo==='lanzamaiz'&&m.azar.entero(4)===0)m.lanzar(p,z,d.danoMantequilla,'mantequilla',d.vuelo,'lanzado',d.mantequilla);
   else m.lanzar(p,z,d.dano,proyectil,d.vuelo);
   p.datos.reloj=d.cada;
  },
 };
}

/** Reglas de las ocho plantas del tejado de PvZ 1; el abono no se presupone. */
export const COMPORTAMIENTO_TEJADO_PLANTAS:Record<string,ComportamientoPlantaPvZ>={
 coltapulta:lanzadora('col'),
 lanzamaiz:lanzadora('maiz'),
 melonpulta:lanzadora('melon'),
 maceta:{paso(){}},
 'grano-cafe':{
  paso(m,p){
   const d=datos(m,p);if(p.edad+1e-9<d.retardo)return;
   const hongo=m.plantaEn(p.fila,p.col);
   if(hongo?.dormida&&hongo.datos.despiertaEn===undefined){hongo.datos.despiertaEn=m.t+d.despertar;m.eventos.push({t:'estado',id:hongo.id,tipo:'despertando',fila:hongo.fila,x:hongo.x,duracion:d.despertar});}
   consumir(m,p);
  },
 },
 ajo:{
  paso(){},
  alDanar(m,p,_cantidad,origen){
   if(!origen||origen.hipnotizado||origen.datos.ajoDesde!==undefined)return;
   origen.datos.ajoDesde=m.t;m.eventos.push({t:'estado',id:origen.id,tipo:'asco',fila:origen.fila,x:origen.x,duracion:1.7});
  },
 },
 // La protección de 3×3 vive en el colgado y en el balón de la catapulta.
 paraplanta:{paso(){}},
 margarita:{
  iniciar(m,p){const d=datos(m,p);p.datos.reloj=m.azar.entre(d.primeroMin,d.primeroMax);},
  paso(m,p,dt){
   const d=datos(m,p);
   // PC: al llegar la última oleada solo produce sesenta segundos más.
   if(m.director&&m.oleada>=m.director.total){p.datos.finEn??=m.t+d.final;if(m.t>p.datos.finEn)return;}
   p.datos.reloj-=dt;if(p.datos.reloj>0)return;
   p.datos.reloj=m.azar.entre(d.cadaMin,d.cadaMax);
   m.crearSol(p.fila,p.x,m.azar.siguiente()<d.probOro?d.oro:d.plata,'moneda');
  },
 },
};
