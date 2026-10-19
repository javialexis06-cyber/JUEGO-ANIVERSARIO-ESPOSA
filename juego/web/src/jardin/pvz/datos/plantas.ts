import {PLANTAS_DIA} from './dia';
import type {DefPlanta} from '../tipos';
export const PLANTAS_PVZ:Readonly<Record<string,DefPlanta>>=Object.fromEntries(PLANTAS_DIA.map(p=>[p.id,p]));
