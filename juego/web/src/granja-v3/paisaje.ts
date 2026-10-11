export interface EstanqueGranja {id:string;x:number;z:number;radioX:number;radioZ:number}
export interface HuecoGranja {id:string;x:number;z:number;relleno:boolean}
export interface PaisajeGranja {version:1;estanques:EstanqueGranja[];huecos:HuecoGranja[]}
export function crearPaisaje():PaisajeGranja{return {version:1,estanques:[
 {id:'estanque_cabana',x:-5,z:6,radioX:1.65,radioZ:1.05},
 {id:'estanque_sur',x:15,z:20,radioX:4,radioZ:3},
 {id:'estanque_bosque',x:-28,z:-17,radioX:3.2,radioZ:2.7},
 ],huecos:[[7,6],[-17,5],[17,10],[-25,-12],[25,-14],[-6,20],[10,25],[-25,30],[32,20],[-6,-25],[20,-30],[-32,-30],[30,40]].map(([x,z],i)=>({id:'hueco_'+i,x,z,relleno:false}))};}
export const aguaEn=(p:PaisajeGranja|undefined,x:number,z:number)=>!!p?.estanques.some(e=>((x+.5-e.x)/e.radioX)**2+((z+.5-e.z)/e.radioZ)**2<1);
export const huecoEn=(p:PaisajeGranja|undefined,x:number,z:number)=>p?.huecos.find(h=>!h.relleno&&h.x===x&&h.z===z);
export function paisajeValido(v:unknown):v is PaisajeGranja{
 const p=v as PaisajeGranja;if(!p||p.version!==1||!Array.isArray(p.estanques)||!Array.isArray(p.huecos)||p.estanques.length>10||p.huecos.length>100)return false;
 const ids=new Set<string>(),celdas=new Set<string>();const id=(i:unknown)=>typeof i==='string'&&/^[a-z0-9_]{1,99}$/.test(i)&&!ids.has(i)&&(ids.add(i),true);
 return p.estanques.every(e=>e&&id(e.id)&&Number.isFinite(e.x)&&Number.isFinite(e.z)&&Math.abs(e.x)<45&&e.z>-35&&e.z<50&&Number.isFinite(e.radioX)&&e.radioX>0&&e.radioX<=6&&Number.isFinite(e.radioZ)&&e.radioZ>0&&e.radioZ<=6)&&p.huecos.every(h=>{const key=h?.x+','+h?.z;return h&&id(h.id)&&Number.isInteger(h.x)&&Number.isInteger(h.z)&&Math.abs(h.x)<50&&h.z>=-40&&h.z<56&&typeof h.relleno==='boolean'&&!celdas.has(key)&&(celdas.add(key),true);});
}
