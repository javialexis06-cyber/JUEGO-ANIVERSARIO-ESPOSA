import {PLANTAS_PISCINA} from './piscina';
import {PLANTAS_DIA} from './dia';
import {PLANTAS_NOCHE} from './noche';
import type {DefPlanta} from '../tipos';
export const PLANTAS_PVZ:Readonly<Record<string,DefPlanta>>=Object.fromEntries([...PLANTAS_DIA,...PLANTAS_NOCHE,...PLANTAS_PISCINA].map(p=>[p.id,p]));
