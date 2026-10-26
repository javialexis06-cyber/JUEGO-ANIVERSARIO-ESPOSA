import {ZOMBIS_NIEBLA} from './niebla';
import {ZOMBIS_TEJADO} from './tejado';
import {ZOMBIS_PISCINA} from './piscina';
import {ZOMBIS_DIA} from './dia';
import {ZOMBIS_NOCHE} from './noche';
import type {DefZombi} from '../tipos';
export const ZOMBIS_PVZ:Readonly<Record<string,DefZombi>>=Object.fromEntries([...ZOMBIS_DIA,...ZOMBIS_NOCHE,...ZOMBIS_PISCINA,...ZOMBIS_NIEBLA,...ZOMBIS_TEJADO].map(z=>[z.id,z]));
