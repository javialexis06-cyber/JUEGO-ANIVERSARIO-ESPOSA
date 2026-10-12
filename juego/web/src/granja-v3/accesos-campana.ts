import type {EstadoGranja} from './estado';
/** Pasos civiles: transportan a los asentamientos de la campaña. Las expediciones avanzadas
 * conservan sus portales y nave originales; estas piezas no los sustituyen en combate. */
export const ACCESOS_CAMPANA=[
 {id:'paso_verdia',nombre:'Paso acordado de Verdía',base:'portal_verdia',permiso:'F04',materiales:{madera:12,fibra:8,piedralumbre_mineral:2}},
 {id:'paso_senda',nombre:'Paso acordado de Senda',base:'portal_senda',permiso:'P13',materiales:{madera:12,piedra:8,fibra:8}},
 {id:'paso_nox',nombre:'Paso de visita al perímetro de Nox',base:'portal_nox',permiso:'P15',materiales:{madera:12,piedra:12,fibra:8}},
 {id:'nave_ensayo',nombre:'Nave de enlace con Celia',base:'nave_exploradora',permiso:'P16',materiales:{madera:20,fibra:12,piedralumbre_mineral:4,piedralumbre_madera:6}},
] as const;
export function construccionRuta(s:EstadoGranja,base:string){return s.produccion.estructuras.find(n=>n.zona==='granja'&&(n.articulo===base||ACCESOS_CAMPANA.some(d=>d.base===base&&n.articulo===d.id&&s.historia?.completadas[d.permiso])));}
export function accesoBosqueAntiguo(s:EstadoGranja){return s.desbloqueos.includes('bosque_ancestral')||!!s.historia?.completadas.P05;}
