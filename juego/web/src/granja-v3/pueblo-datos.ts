/** Datos y colisiones del pueblo compartidos con el motor, sin dependencias de render. */
export type ServicioPueblo = 'semillas'|'animales'|'carpinteria'|'herreria'|'clinica'|'posada'|'archivo'|'altar_aura'|'altar_lara';
export interface EdificioPueblo {
  id:string; nombre:string; servicio:ServicioPueblo;
  /** Esquina mínima del volumen sólido; todas las coordenadas son mundiales. */
  x:number; z:number; ancho:number; fondo:number;
  entrada:{x:number;z:number}; descripcion:string;
}
export const EDIFICIOS_PUEBLO:readonly EdificioPueblo[] = [
  {id:'mercado',nombre:'Mercado de la Semilla',servicio:'semillas',x:59,z:-16,ancho:8,fondo:7,entrada:{x:63,z:-7.6},descripcion:'Semillas, provisiones y venta de las cosechas. El puesto cambia de color con la estación.'},
  {id:'animales',nombre:'Casa de los Animales',servicio:'animales',x:58,z:3,ancho:7,fondo:6,entrada:{x:61.5,z:10.4},descripcion:'Animales de granja, alimento y consejos para preparar un refugio adecuado.'},
  {id:'carpinteria',nombre:'Taller del Roble',servicio:'carpinteria',x:91,z:-16,ancho:9,fondo:7,entrada:{x:95.5,z:-7.6},descripcion:'Encargos de edificios, refugios, caminos y muebles. Trae madera, piedra y el plano de tu granja.'},
  {id:'herreria',nombre:'Forja del Arroyo',servicio:'herreria',x:99,z:0,ancho:7,fondo:7,entrada:{x:102.5,z:8.4},descripcion:'Mejora tus herramientas con minerales y monedas; cada nivel permite trabajar materiales más resistentes.'},
  {id:'clinica',nombre:'Clínica del Jardín',servicio:'clinica',x:72,z:-25,ancho:7,fondo:6,entrada:{x:75.5,z:-17.6},descripcion:'Atención veterinaria y cuidados para que los animales puedan recuperarse.'},
  {id:'posada',nombre:'Posada del Molino',servicio:'posada',x:90,z:13,ancho:10,fondo:8,entrada:{x:95,z:22.4},descripcion:'Una mesa caliente, descanso y conversaciones. Espacio preparado para los futuros vecinos.'},
  {id:'archivo',nombre:'Casa de los Oficios',servicio:'archivo',x:71,z:15,ancho:9,fondo:7,entrada:{x:75.5,z:23.4},descripcion:'Tablón de encargos, colección de manuscritos y memoria del pueblo. La historia se incorporará más adelante.'},
  {id:'altar_aura',nombre:'Altar del Despertar',servicio:'altar_aura',x:59,z:-26,ancho:4,fondo:4,entrada:{x:61,z:-20.6},descripcion:'Un jardín de luz y brotes dedicado a Aura, diosa de la Vida, la Pasión y el Fuego Interno.'},
  {id:'altar_lara',nombre:'Altar de la Calma',servicio:'altar_lara',x:99,z:-26,ancho:4,fondo:4,entrada:{x:101,z:-20.6},descripcion:'Un jardín de lirios y rosales dedicado a Lara, diosa de la Muerte, el Descanso y la Paz.'},
];
export const NPCS_PUEBLO = [
  {id:'mercader',nombre:'La mercader',edificio:'mercado',oficio:'semillas',x:66.3,z:-6.5,color:'#bf6b54'},
  {id:'cuidadora',nombre:'La cuidadora',edificio:'animales',oficio:'animales',x:64.5,z:11.3,color:'#b78a46'},
  {id:'carpintera',nombre:'La carpintera',edificio:'carpinteria',oficio:'carpinteria',x:94.8,z:-5.1,color:'#659385'},
  {id:'herrero',nombre:'El herrero',edificio:'herreria',oficio:'herreria',x:102.7,z:10.8,color:'#737a83'},
  {id:'veterinaria',nombre:'La veterinaria',edificio:'clinica',oficio:'clinica',x:78.5,z:-17.2,color:'#d5e4ce'},
  {id:'posadera',nombre:'La posadera',edificio:'posada',oficio:'posada',x:96.7,z:24.3,color:'#8d7097'},
  {id:'archivero',nombre:'El archivero',edificio:'archivo',oficio:'archivo',x:78.5,z:23.4,color:'#a29066'},
  {id:'canalizadora_aura',nombre:'Santa de Aura',edificio:'altar_aura',oficio:'altar_aura',x:63.8,z:-20.7,color:'#e1b95e'},
  {id:'canalizadora_lara',nombre:'Santa de Lara',edificio:'altar_lara',oficio:'altar_lara',x:103.8,z:-20.7,color:'#7a7499'},
  {id:'pescadora',nombre:'La pescadora',edificio:'posada',oficio:null,x:103,z:24,color:'#4e8d9c'},
  {id:'minero',nombre:'El minero',edificio:'posada',oficio:null,x:95,z:10,color:'#947150'},
  {id:'exploradora',nombre:'La exploradora',edificio:'posada',oficio:null,x:57,z:-4,color:'#6c8757'},
  {id:'cocinero',nombre:'El cocinero',edificio:'posada',oficio:null,x:88,z:23,color:'#dbbd86'},
  {id:'botanica',nombre:'La botánica',edificio:'archivo',oficio:null,x:83,z:-18,color:'#819958'},
  {id:'agricultor',nombre:'El agricultor',edificio:'archivo',oficio:null,x:68,z:-5,color:'#c69952'},
  {id:'maestra',nombre:'La maestra',edificio:'archivo',oficio:null,x:81,z:24,color:'#ad7181'},
  {id:'musica',nombre:'La música',edificio:'posada',oficio:null,x:88,z:5,color:'#aa75a0'},
  {id:'guardabosques',nombre:'El guardabosques',edificio:'posada',oficio:null,x:56,z:-17,color:'#557964'},
  {id:'artesana',nombre:'La artesana',edificio:'archivo',oficio:null,x:89,z:-8,color:'#bd7960'},
  {id:'astronoma',nombre:'La astrónoma',edificio:'archivo',oficio:null,x:86,z:-21,color:'#797da8'},
  {id:'veterano',nombre:'El vecino mayor',edificio:'posada',oficio:null,x:76,z:6,color:'#998676'},
  {id:'nina',nombre:'La joven aprendiz',edificio:'archivo',oficio:null,x:74,z:11,color:'#cc9588'},
  {id:'nino',nombre:'El joven aprendiz',edificio:'archivo',oficio:null,x:91,z:11,color:'#89a9b9'},
  {id:'viajera',nombre:'La viajera',edificio:'posada',oficio:null,x:85,z:-8,color:'#b19472'},
] as const;


export interface ViviendaPueblo {id:string;nombre:string;ocupantes:readonly string[];edificio:string|null;x:number;z:number;ancho:number;fondo:number;entrada:{x:number;z:number};tema:string}
export const VIVIENDAS_PUEBLO:readonly ViviendaPueblo[]=[
 {...{"id": "pueblo_sol_vivienda_01", "nombre": "Vivienda del Mercado", "ocupantes": ["mercader"], "tema": "mercado"},edificio:"mercado",...(()=>{const e=EDIFICIOS_PUEBLO.find(e=>e.id==="mercado")!;return {x:e.x,z:e.z,ancho:e.ancho,fondo:e.fondo,entrada:e.entrada};})()},
 {...{"id": "pueblo_sol_vivienda_02", "nombre": "Casa del Corral", "ocupantes": ["cuidadora"], "tema": "corral"},edificio:"animales",...(()=>{const e=EDIFICIOS_PUEBLO.find(e=>e.id==="animales")!;return {x:e.x,z:e.z,ancho:e.ancho,fondo:e.fondo,entrada:e.entrada};})()},
 {...{"id": "pueblo_sol_vivienda_03", "nombre": "Vivienda del Roble", "ocupantes": ["carpintera"], "tema": "roble"},edificio:"carpinteria",...(()=>{const e=EDIFICIOS_PUEBLO.find(e=>e.id==="carpinteria")!;return {x:e.x,z:e.z,ancho:e.ancho,fondo:e.fondo,entrada:e.entrada};})()},
 {...{"id": "pueblo_sol_vivienda_04", "nombre": "Casa de la Forja", "ocupantes": ["herrero"], "tema": "forja"},edificio:"herreria",...(()=>{const e=EDIFICIOS_PUEBLO.find(e=>e.id==="herreria")!;return {x:e.x,z:e.z,ancho:e.ancho,fondo:e.fondo,entrada:e.entrada};})()},
 {...{"id": "pueblo_sol_vivienda_05", "nombre": "Vivienda del Jardín", "ocupantes": ["veterinaria"], "tema": "jardin"},edificio:"clinica",...(()=>{const e=EDIFICIOS_PUEBLO.find(e=>e.id==="clinica")!;return {x:e.x,z:e.z,ancho:e.ancho,fondo:e.fondo,entrada:e.entrada};})()},
 {...{"id": "pueblo_sol_vivienda_06", "nombre": "Habitaciones de la Posada", "ocupantes": ["posadera", "cocinero"], "tema": "molino"},edificio:"posada",...(()=>{const e=EDIFICIOS_PUEBLO.find(e=>e.id==="posada")!;return {x:e.x,z:e.z,ancho:e.ancho,fondo:e.fondo,entrada:e.entrada};})()},
 {...{"id": "pueblo_sol_vivienda_07", "nombre": "Vivienda del Archivo", "ocupantes": ["archivero"], "tema": "archivo"},edificio:"archivo",...(()=>{const e=EDIFICIOS_PUEBLO.find(e=>e.id==="archivo")!;return {x:e.x,z:e.z,ancho:e.ancho,fondo:e.fondo,entrada:e.entrada};})()},
 {"id": "pueblo_sol_vivienda_08", "nombre": "Casa del Despertar", "ocupantes": ["canalizadora_aura"], "tema": "despertar", "edificio": null, "x": 56, "z": -40, "ancho": 7, "fondo": 7, "entrada": {"x": 59.5, "z": -31.6}},
 {"id": "pueblo_sol_vivienda_09", "nombre": "Casa de la Calma", "ocupantes": ["canalizadora_lara"], "tema": "calma", "edificio": null, "x": 67, "z": -40, "ancho": 7, "fondo": 7, "entrada": {"x": 70.5, "z": -31.6}},
 {"id": "pueblo_sol_vivienda_10", "nombre": "Casa de la Ribera", "ocupantes": ["pescadora", "minero"], "tema": "ribera", "edificio": null, "x": 78, "z": -40, "ancho": 7, "fondo": 7, "entrada": {"x": 81.5, "z": -31.6}},
 {"id": "pueblo_sol_vivienda_11", "nombre": "Casa de los Senderos", "ocupantes": ["exploradora", "viajera"], "tema": "senderos", "edificio": null, "x": 89, "z": -40, "ancho": 7, "fondo": 7, "entrada": {"x": 92.5, "z": -31.6}},
 {"id": "pueblo_sol_vivienda_12", "nombre": "Casa del Huerto", "ocupantes": ["botanica", "agricultor", "nina", "nino"], "tema": "huerto", "edificio": null, "x": 100, "z": -40, "ancho": 7, "fondo": 7, "entrada": {"x": 103.5, "z": -31.6}},
 {"id": "pueblo_sol_vivienda_13", "nombre": "Dúplex de la Escuela", "ocupantes": ["maestra", "musica"], "tema": "escuela", "edificio": null, "x": 56, "z": 31, "ancho": 7, "fondo": 7, "entrada": {"x": 59.5, "z": 39.4}},
 {"id": "pueblo_sol_vivienda_14", "nombre": "Cabaña del Guardabosques", "ocupantes": ["guardabosques"], "tema": "bosque", "edificio": null, "x": 67, "z": 31, "ancho": 7, "fondo": 7, "entrada": {"x": 70.5, "z": 39.4}},
 {"id": "pueblo_sol_vivienda_15", "nombre": "Casa de los Tejidos", "ocupantes": ["artesana"], "tema": "tejidos", "edificio": null, "x": 78, "z": 31, "ancho": 7, "fondo": 7, "entrada": {"x": 81.5, "z": 39.4}},
 {"id": "pueblo_sol_vivienda_16", "nombre": "Vivienda del Observatorio", "ocupantes": ["astronoma"], "tema": "observatorio", "edificio": null, "x": 89, "z": 31, "ancho": 7, "fondo": 7, "entrada": {"x": 92.5, "z": 39.4}},
 {"id": "pueblo_sol_vivienda_17", "nombre": "Casa del Rosal", "ocupantes": ["veterano"], "tema": "rosal", "edificio": null, "x": 100, "z": 31, "ancho": 7, "fondo": 7, "entrada": {"x": 103.5, "z": 39.4}},
 ];
export const viviendaDef=(id:string)=>VIVIENDAS_PUEBLO.find(v=>v.id===id);
export const viviendaDe=(id:string)=>VIVIENDAS_PUEBLO.find(v=>v.ocupantes.includes(id));
export const viviendaInterior=(id:string|null)=>id?.startsWith('vivienda_')?viviendaDef(id.slice(9)):id?.startsWith('dormitorio_')?viviendaDe(id.slice(11)):undefined;
export function viviendaEn(x:number,z:number){return VIVIENDAS_PUEBLO.find(v=>!v.edificio&&(x>=v.x-.25&&x<=v.x+v.ancho+.25&&z>=v.z-.25&&z<=v.z+v.fondo+.5||Math.hypot(x-v.entrada.x,z-v.entrada.z)<1.5));}
export function visitaVivienda(minutos:number){return minutos>=480&&minutos<1260;}
export const posicionResidente=(id:string)=>{const v=viviendaDe(id),i=v?.ocupantes.indexOf(id)??0;return {x:-3+i*2,z:2};};
export const SOLIDOS_VIVIENDA:readonly [number,number,number,number][]=[[-4.5,-3.7,.7,1],[-1.5,-3.7,.7,1],[1.5,-3.7,.7,1],[4.5,-3.7,.7,1],[-1,-.7,1.2,.8],[4.5,0,.8,.9]];
export function libreVivienda(x:number,z:number,v?:ViviendaPueblo){return x>=-5.6&&x<5.6&&z>=-4.6&&z<4.6&&!SOLIDOS_VIVIENDA.some(([bx,bz,w,d],i)=>i>=4&&Math.abs(x-bx)<w+.3&&Math.abs(z-bz)<d+.3);}

/** Rectángulos de pavimento compartidos por arte y altura de personajes. */
export const CAMINOS_PUEBLO:readonly [number,number,number,number][] = (()=>{
 const r:[number,number,number,number][]=[[53,-1.4,28,2.8],[82.5,-28,3,55],[55,-6.3,53,2.6],[55,23,53,2.6]];
 for(const e of EDIFICIOS_PUEBLO){
  if(e.servicio==='altar_aura'){r.push([e.entrada.x,e.entrada.z-.75,8,1.5],[68.25,e.entrada.z,1.5,-6.2-e.entrada.z]);continue;}
  if(e.servicio==='altar_lara'){r.push([e.entrada.x-.75,e.entrada.z,1.5,-6.2-e.entrada.z]);continue;}
  const zz=e.entrada.z,target=zz<0?-5:zz<12?-.1:24;if(Math.abs(target-zz)>.1)r.push([e.entrada.x-.85,Math.min(zz,target),1.7,Math.abs(target-zz)]);
  if(e.servicio==='animales')r.push([e.entrada.x,9.85,20.8,1.6]);if(e.servicio==='herreria')r.push([86,8.05,16.5,1.5]);
 }
 r.push([55,-30,53,1.8],[55,39.5,53,1.8],[82.5,-30,3,2],[82.5,25,3,16]);for(const v of VIVIENDAS_PUEBLO.filter(v=>!v.edificio))r.push([v.entrada.x-.8,v.entrada.z-.6,1.6,v.entrada.z<0?2.4:2]);
 r.push([103.3,11.8,5.8,1.6],[103.3,20.9,5.8,1.6]);return r;
})();
/** Altura del suelo, excluyendo paredes, vallas y la fuente sólida. */
export function alturaSueloPueblo(x:number,z:number):number{
 let h=CAMINOS_PUEBLO.some(([bx,bz,w,d])=>x>=bx-.1&&x<=bx+w+.1&&z>=bz-.1&&z<=bz+d+.1)?.1155:0;
 const dx=x-84,dz=z-2,enDecagono=(r:number)=>{const borde=r*Math.cos(Math.PI/10);for(let i=0;i<10;i++){const t=(i+.5)*Math.PI/5;if(dx*Math.sin(t)+dz*Math.cos(t)>borde)return false;}return true;};
 if(enDecagono(7.15))h=Math.max(h,.13);if(enDecagono(6.94))h=Math.max(h,.18);
 if(Math.hypot(dx,dz)<6.3)for(let ring=0;ring<3;ring++)for(let i=0;i<24;i++){const t=i/24*Math.PI*2,r=3.2+ring*1.12,xx=dx-Math.sin(t)*r,zz=dz-Math.cos(t)*r,c=Math.cos(t),s=Math.sin(t);if(Math.abs(xx*c-zz*s)<=.43&&Math.abs(xx*s+zz*c)<=.36)return Math.max(h,.2175);}
 if(x>=58.55&&x<=69.45&&z>=12.425&&z<=20.575)h=Math.max(h,.0625);return h;
}

/** Body or visible doorstep: suitable for mouse picking, independent of camera. */
export function edificioPuebloEn(x:number,z:number):EdificioPueblo|undefined {
  return EDIFICIOS_PUEBLO.find(e=>x>=e.x-.25&&x<=e.x+e.ancho+.25&&z>=e.z-.25&&z<=e.z+e.fondo+.5)
    ?? EDIFICIOS_PUEBLO.find(e=>Math.hypot(x-e.entrada.x,z-e.entrada.z)<1.5)
    ?? EDIFICIOS_PUEBLO.find(e=>NPCS_PUEBLO.some(n=>n.oficio===e.servicio&&Math.hypot(x-n.x,z-n.z)<.85));
}
export function puntoInteraccion(x:number,z:number,maxDist=2.4):EdificioPueblo|undefined {
  let candidate:EdificioPueblo|undefined;let dist=maxDist;
  for(const e of EDIFICIOS_PUEBLO){const n=NPCS_PUEBLO.find(n=>n.edificio===e.id),d=Math.min(Math.hypot(x-e.entrada.x,z-e.entrada.z),n?Math.hypot(x-n.x,z-n.z):Infinity);if(d<dist){candidate=e;dist=d;}}
  return candidate;
}
export function librePueblo(x:number,z:number,radius=.32):boolean {
  if(VIVIENDAS_PUEBLO.some(v=>!v.edificio&&x>v.x-radius&&x<v.x+v.ancho+radius&&z>v.z-radius&&z<v.z+v.fondo+radius))return false;
  if(EDIFICIOS_PUEBLO.some(e=>x>e.x-radius&&x<e.x+e.ancho+radius&&z>e.z-radius&&z<e.z+e.fondo+radius))return false;
  if(Math.hypot(x-84,z-2)<2.25+radius)return false;
  // Walkable pasture interior, solid fence sides and a two-metre opening facing the plaza.
  if(z>12-radius&&z<21+radius){
    if(Math.abs(x-58)<radius+.12||Math.abs(x-70)<radius+.12&&(z<15.4||z>17.6))return false;
  }
  if(x>58-radius&&x<70+radius&&(Math.abs(z-12)<radius+.12||Math.abs(z-21)<radius+.12))return false;
  if(ARBOLES_PUEBLO.some(([tx,tz])=>Math.hypot(x-tx,z-tz)<.29+radius))return false;
  if(MOBILIARIO_SOLIDO.some(([bx,bz,w,d])=>Math.abs(x-bx)<w+radius&&Math.abs(z-bz)<d+radius))return false;
  if(BANCOS_PUEBLO.some(([bx,bz,rot])=>{const c=Math.cos(rot),s=Math.sin(rot),dx=x-bx,dz=z-bz;return Math.abs(dx*c-dz*s)<1.1+radius&&Math.abs(dx*s+dz*c)<.37+radius;}))return false;
  // The two bridges cross the solid millrace; their rails keep the player on the deck.
  if(x>103.25-radius&&x<109.1+radius&&PUENTES_PUEBLO.some(bz=>Math.abs(z-bz)<radius+.12||Math.abs(z-bz-1.6)<radius+.12))return false;
  if(x>104.1-radius&&x<108.15+radius&&z>11-radius&&z<22+radius&&!PUENTES_PUEBLO.some(bz=>z>bz+radius+.12&&z<bz+1.6-radius-.12))return false;
  return true;
}

export const ARBOLES_PUEBLO:readonly [number,number,number][] = [[56,-11,3.6],[70,-22,3.2],[81,-25,3.7],[88,-26,4],[106,-23,3.8],[108,-11,3.5],[56,1,3.4],[55,14,3.6],[55,26,4],[68,25,3.5],[88,26,3.6],[102,26,4],[109,6,3.8]];
export const BANCOS_PUEBLO:readonly [number,number,number][] = [[77.1,1,Math.PI/2],[90.7,2,-Math.PI/2],[80,9,Math.PI],[88,-10,0]];
export const PUENTES_PUEBLO = [11.8,20.9] as const;
// x/z centre and half extents of outdoor furniture (doorsteps remain clear).
export const MOBILIARIO_SOLIDO:readonly [number,number,number,number][] = [[98.85,-6.75,1.4,.625],[92.1,-6.4,1.2,1.1],[100.4,8.7,.9,.71],[104.75,8.9,.825,.33],[98.5,22.7,.85,.85],[91.3,22.4,1.1,.37],[59.4,19.8,.9,.325]];
