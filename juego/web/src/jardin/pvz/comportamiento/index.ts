import type {MotorPvZ} from '../motor/motor';
import type {PlantaPvZ,ZombiPvZ,TipoDano} from '../tipos';
import {COMPORTAMIENTO_NOCHE_PLANTAS} from './noche';
import {COMPORTAMIENTO_NOCHE_ZOMBIS} from './zombis-noche';
import {COMPORTAMIENTO_DIA_PLANTAS,COMPORTAMIENTO_DIA_ZOMBIS} from './dia';
export interface ComportamientoPlantaPvZ {
 iniciar?(m:MotorPvZ,p:PlantaPvZ):void;paso(m:MotorPvZ,p:PlantaPvZ,dt:number):void;
 puedeAbono?(m:MotorPvZ,p:PlantaPvZ):boolean;abono?(m:MotorPvZ,p:PlantaPvZ):void;alDanar?(m:MotorPvZ,p:PlantaPvZ,cantidad:number,origen?:ZombiPvZ):void;
 alMorir?(m:MotorPvZ,p:PlantaPvZ):void;
}
export interface ComportamientoZombiPvZ {
 iniciar?(m:MotorPvZ,z:ZombiPvZ):void;paso?(m:MotorPvZ,z:ZombiPvZ,dt:number):void|false;
 alDanar?(m:MotorPvZ,z:ZombiPvZ,cantidad:number,origen:TipoDano):void;alMorir?(m:MotorPvZ,z:ZombiPvZ):void;
}
export const COMPORTAMIENTOS_PLANTAS:Readonly<Record<string,ComportamientoPlantaPvZ>>={...COMPORTAMIENTO_DIA_PLANTAS,...COMPORTAMIENTO_NOCHE_PLANTAS};
export const COMPORTAMIENTOS_ZOMBIS:Readonly<Record<string,ComportamientoZombiPvZ>>={...COMPORTAMIENTO_DIA_ZOMBIS,...COMPORTAMIENTO_NOCHE_ZOMBIS};
