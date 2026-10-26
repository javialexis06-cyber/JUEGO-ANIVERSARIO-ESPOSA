import {COMPORTAMIENTO_NIEBLA_PLANTAS} from './niebla';
import {COMPORTAMIENTO_NIEBLA_ZOMBIS} from './zombis-niebla';
import {COMPORTAMIENTO_PISCINA_PLANTAS} from './piscina';
import {COMPORTAMIENTO_PISCINA_ZOMBIS} from './zombis-piscina';
import type {MotorPvZ} from '../motor/motor';
import type {PlantaPvZ,ZombiPvZ,TipoDano} from '../tipos';
import {COMPORTAMIENTO_NOCHE_PLANTAS} from './noche';
import {COMPORTAMIENTO_NOCHE_ZOMBIS} from './zombis-noche';
import {COMPORTAMIENTO_DIA_PLANTAS,COMPORTAMIENTO_DIA_ZOMBIS} from './dia';
import {COMPORTAMIENTO_TEJADO_PLANTAS} from './tejado';
import {COMPORTAMIENTO_TEJADO_ZOMBIS} from './zombis-tejado';
export interface ComportamientoPlantaPvZ {
 iniciar?(m:MotorPvZ,p:PlantaPvZ):void;paso(m:MotorPvZ,p:PlantaPvZ,dt:number):void;
 puedeAbono?(m:MotorPvZ,p:PlantaPvZ):boolean;abono?(m:MotorPvZ,p:PlantaPvZ):void;alDanar?(m:MotorPvZ,p:PlantaPvZ,cantidad:number,origen?:ZombiPvZ):void;
 alMorir?(m:MotorPvZ,p:PlantaPvZ):void;
}
export interface ComportamientoZombiPvZ {
 quitarMetal?(m:MotorPvZ,z:ZombiPvZ):boolean;pincharGlobo?(m:MotorPvZ,z:ZombiPvZ):boolean;
 iniciar?(m:MotorPvZ,z:ZombiPvZ):void;paso?(m:MotorPvZ,z:ZombiPvZ,dt:number):void|false;
 alDanar?(m:MotorPvZ,z:ZombiPvZ,cantidad:number,origen:TipoDano):void;alMorir?(m:MotorPvZ,z:ZombiPvZ):void;
 /** Corre antes de congelación y mantequilla (la bola del jefe sigue rodando). */
 siempre?(m:MotorPvZ,z:ZombiPvZ,dt:number):void;
 alQuemarFila?(m:MotorPvZ,z:ZombiPvZ,fila:number):void;alHelar?(m:MotorPvZ,z:ZombiPvZ):void;
}
export const COMPORTAMIENTOS_PLANTAS:Readonly<Record<string,ComportamientoPlantaPvZ>>={...COMPORTAMIENTO_DIA_PLANTAS,...COMPORTAMIENTO_NOCHE_PLANTAS,...COMPORTAMIENTO_PISCINA_PLANTAS,...COMPORTAMIENTO_NIEBLA_PLANTAS,...COMPORTAMIENTO_TEJADO_PLANTAS};
export const COMPORTAMIENTOS_ZOMBIS:Readonly<Record<string,ComportamientoZombiPvZ>>={...COMPORTAMIENTO_DIA_ZOMBIS,...COMPORTAMIENTO_NOCHE_ZOMBIS,...COMPORTAMIENTO_PISCINA_ZOMBIS,...COMPORTAMIENTO_NIEBLA_ZOMBIS,...COMPORTAMIENTO_TEJADO_ZOMBIS};
