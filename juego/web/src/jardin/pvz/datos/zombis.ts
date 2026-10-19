import {ZOMBIS_DIA} from './dia';
import type {DefZombi} from '../tipos';
export const ZOMBIS_PVZ:Readonly<Record<string,DefZombi>>=Object.fromEntries(ZOMBIS_DIA.map(z=>[z.id,z]));
