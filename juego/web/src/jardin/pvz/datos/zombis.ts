import {ZOMBIS_DIA} from './dia';
import {ZOMBIS_NOCHE} from './noche';
import type {DefZombi} from '../tipos';
export const ZOMBIS_PVZ:Readonly<Record<string,DefZombi>>=Object.fromEntries([...ZOMBIS_DIA,...ZOMBIS_NOCHE].map(z=>[z.id,z]));
