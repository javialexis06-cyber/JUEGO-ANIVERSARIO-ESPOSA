import type {Pila} from './inventario';
import type {Genome} from './genetica';
import type {AnimalCare} from './cuidados';
export interface TerritorioRegional {id:string;nombre:string;actividad:'cuentas'|'canales'|'senderos'|'soportes'|'termica'|'presion';diasRenovacion:number;materiales:Record<string,number>;producto:string;fauna:{id:string;nombre:string;limites:string;colonia:boolean;permiso:string|null;producto:string}}
export interface FaunaRegional {id:string;sexo:'hembra'|'macho';genoma:Genome;edadNoches:number;cuidado:AnimalCare;madre?:string;padre?:string}
export interface ColoniaRegional {region:string;inicioDia:number;animales:FaunaRegional[];cria:{madre:string;padre:string;genoma:Genome;sexo:'hembra'|'macho';noches:number}|null;ultimaCriaAt:number|null;ultimaEntrega:number;capacidad:8}
export interface EstadoRegional {version:1;secuencia:number;trabajos:Record<string,{dia:number;cantidad:number}>;habitats:Record<string,{dia:number;ultimaRevision:number}>;colonias:ColoniaRegional[];reto:{region:string;ciclo:number;paso:number;errores:number;reservas:Pila[];respuestas:number[]}|null}
export type AccionRegional={tipo:'iniciar'}|{tipo:'responder';valor:number}|{tipo:'cancelar'}|{tipo:'cobrar'}|{tipo:'habitat'}|{tipo:'revisar_habitat'}|{tipo:'entrar_habitat'}|{tipo:'salir_habitat'}|{tipo:'colonia'}|{tipo:'cuidar';id:string;metodo:'alimentar'|'acompanar'|'curar'}|{tipo:'criar';madre:string;padre:string}|{tipo:'recoger_colonia'};
