import { NPCS_PUEBLO, viviendaDe, viviendaInterior } from './pueblo-datos';
import type { EstadoGranja } from './estado';
export const AMISTAD_DORMITORIO=500;
export const dormitorioDef=(interior:string|null)=>interior?.startsWith('dormitorio_')?NPCS_PUEBLO.find(n=>n.id===interior.slice(11)):undefined;
export function puertaDormitorio(id:string){const v=viviendaDe(id),i=v?.ocupantes.indexOf(id)??-1;return v&&i>=0?{x:[-4.5,-1.5,1.5,4.5][i],z:-3.7}:undefined;}
export function puertaDormitorioEn(interior:string|null,x:number,z:number){const v=viviendaInterior(interior);return v&&!dormitorioDef(interior)?v.ocupantes.find(id=>{const p=puertaDormitorio(id)!;return Math.abs(x-p.x)<1&&z<-3&&z>-5.5;}):undefined;}
export function puedeEntrarDormitorio(s:EstadoGranja,id:string,x:number,z:number){const v=viviendaInterior(s.interior),r=s.pueblo.relaciones.find(r=>r.id===id),p=puertaDormitorio(id);return !!v&&!dormitorioDef(s.interior)&&v.ocupantes.includes(id)&&s.zona==='pueblo'&&!s.servicio&&!s.aventura.destinoActual&&s.jornada.minutos>=480&&s.jornada.minutos<1260&&!!r?.conocido&&r.amistad>=AMISTAD_DORMITORIO&&!!p&&Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x-p.x,z-p.z)<=1.8;}
export const horaDormitorio=(minutos:number)=>minutos>=1140;
export function libreDormitorio(x:number,z:number){return x>=-3.6&&x<3.6&&z>=-3.6&&z<3.6&&!([[-2.5,-2.6,.8,1],[2.4,-2.2,.9,.55],[-3.3,.2,.35,.7]] as const).some(([bx,bz,w,d])=>Math.abs(x-bx)<w+.25&&Math.abs(z-bz)<d+.25);}
export const MUEBLES_DORMITORIO={escritorio:{x:2.4,z:-1.2,nombre:'Escritorio',texto:'Un cuaderno de proyectos y pequeñas notas del día. El cuidado del valle también empieza con una idea.'},biblioteca:{x:-2.6,z:.2,nombre:'Biblioteca',texto:'Libros de los oficios del valle y recuerdos de viajes. Algunas páginas esperan las historias que todavía quedan por vivir.'}} as const;
