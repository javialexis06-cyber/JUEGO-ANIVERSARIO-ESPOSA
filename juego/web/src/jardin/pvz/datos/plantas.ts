import {PLANTAS_NIEBLA} from './niebla';
import {PLANTAS_TEJADO} from './tejado';
import {PLANTAS_PISCINA} from './piscina';
import {PLANTAS_DIA} from './dia';
import {PLANTAS_NOCHE} from './noche';
import type {DefPlanta} from '../tipos';
export const PLANTAS_PVZ:Readonly<Record<string,DefPlanta>>=Object.fromEntries([...PLANTAS_DIA,...PLANTAS_NOCHE,...PLANTAS_PISCINA,...PLANTAS_NIEBLA,...PLANTAS_TEJADO].map(p=>[p.id,p]));
