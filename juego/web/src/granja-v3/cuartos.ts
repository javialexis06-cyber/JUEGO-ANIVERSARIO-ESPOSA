import * as THREE from 'three';
import { cargar } from '../recursos';

/** Interiores de la granja y del pueblo hechos con el kit de muebles de Blender (personajes/blender/granja_muebles.py,
 * un solo GLB con un vacío «m_<clave>» por pieza). El kit se carga una vez; cada mueble es una copia que comparte
 * geometría y materiales (marcados «compartido» para que liberar() no los destruya). */
let kit:Promise<Map<string,THREE.Object3D>>|null=null;
function cargarKit(){
 if(!kit){kit=cargar('granja_muebles.glb').then(g=>{const m=new Map<string,THREE.Object3D>();g.traverse(o=>{const x=o as THREE.Mesh;if(!x.isMesh)return;x.geometry.userData.compartido=true;for(const mm of ([] as THREE.Material[]).concat(x.material))mm.userData.compartido=true;x.castShadow=true;x.receiveShadow=true;});for(const c of g.children)m.set(c.name.replace(/^m_/,''),c);return m;});kit.catch(()=>{kit=null;});}
 return kit;
}
export function precargarMuebles(){return cargarKit().then(()=>undefined,()=>undefined);}

/** [clave, x, z, giro, escala, altura] */
export type Puesto=[string,number,number,number?,number?,number?];
type Tintes=Record<string,string>;

function vivo(g:THREE.Object3D){let r:THREE.Object3D|null=g;while(r){if(r.userData.liberado)return false;r=r.parent;}return true;}
/** Material teñido propio del cuarto (no compartido: se libera con el cuarto). */
function tenir(o:THREE.Object3D,tintes:Tintes,cache:Map<string,THREE.Material>){o.traverse(x=>{const m=x as THREE.Mesh;if(!m.isMesh||Array.isArray(m.material))return;const base=m.material as THREE.MeshStandardMaterial;const t=Object.keys(tintes).find(k=>base.name.includes(k));if(!t)return;const clave=base.uuid+tintes[t];let nm=cache.get(clave);if(!nm){const c=base.clone();c.userData={};c.color.set(tintes[t]);nm=c;cache.set(clave,nm);}m.material=nm;});}

/** Pone muebles del kit dentro de g (llegan cuando el modelo termina de cargar). */
export function amueblar(g:THREE.Group,puestos:Puesto[],tintes:Tintes={}){
 const cache=new Map<string,THREE.Material>();
 cargarKit().then(m=>{if(!vivo(g))return;for(const [c,x,z,ry=0,s=1,y=0] of puestos){const base=m.get(c);if(!base)continue;const o=base.clone(true);o.position.set(x,y,z);o.rotation.y=ry;o.scale.setScalar(s);o.name='mueble-'+c;if(Object.keys(tintes).length)tenir(o,tintes,cache);g.add(o);}}).catch(()=>{});
}

/** Repite una pieza muchas veces con instancias (piso y paredes por módulos de 1 m). */
export function mosaico(g:THREE.Group,clave:string,lugares:[number,number,number,number][],tintes:Tintes={}){
 const cache=new Map<string,THREE.Material>();
 cargarKit().then(m=>{if(!vivo(g)||!lugares.length)return;const base=m.get(clave);if(!base)return;base.updateMatrixWorld(true);const inv=base.matrixWorld.clone().invert();
  const t=new THREE.Matrix4(),q=new THREE.Quaternion(),uno=new THREE.Vector3(1,1,1),eje=new THREE.Vector3(0,1,0);
  base.traverse(o=>{const malla=o as THREE.Mesh;if(!malla.isMesh)return;const local=inv.clone().multiply(malla.matrixWorld);let material=malla.material as THREE.Material;
   if(Object.keys(tintes).length){const tmp=new THREE.Mesh(malla.geometry,material);tenir(tmp,tintes,cache);material=tmp.material as THREE.Material;}
   const im=new THREE.InstancedMesh(malla.geometry,material,lugares.length);im.receiveShadow=true;im.castShadow=false;
   lugares.forEach(([x,y,z,ry],i)=>{t.compose(new THREE.Vector3(x,y,z),q.setFromAxisAngle(eje,ry),uno);im.setMatrixAt(i,t.clone().multiply(local));});
   im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();g.add(im);});
 }).catch(()=>{});
}

const PI2=Math.PI/2;
/** Cascarón de un cuarto: piso de tablas, pared del fondo y pared izquierda con zócalo y colgadura, postes en las
 * esquinas y marco de la puerta al frente. El cuarto va de -ancho/2 a ancho/2 en x y de -fondo/2 a fondo/2 en z. */
export function cascaron(ancho:number,fondo:number,papel='#E8D5B0',conPuerta=true){
 const g=new THREE.Group();g.name='cascaron';const x0=-ancho/2,z0=-fondo/2;
 const piso:[number,number,number,number][]=[];for(let i=0;i<Math.ceil(ancho);i++)for(let j=0;j<Math.ceil(fondo);j++)piso.push([x0+.5+i,0,z0+.5+j,0]);
 mosaico(g,'piso_modulo',piso);
 const pared:[number,number,number,number][]=[];for(let i=0;i<Math.ceil(ancho);i++)pared.push([x0+.5+i,0,z0,0]);for(let j=0;j<Math.ceil(fondo);j++)pared.push([x0,0,z0+.5+j,PI2]);
 mosaico(g,'pared_modulo',pared,{'papel pared':papel,'raya papel':new THREE.Color(papel).offsetHSL(0,-.05,.06).getStyle()});
 // Base oscura bajo el piso (lo que se alcanza a ver por los bordes mientras carga)
 const base=new THREE.Mesh(new THREE.BoxGeometry(ancho+.4,.2,fondo+.4),new THREE.MeshStandardMaterial({color:'#6b4a32',roughness:.9}));base.position.set(0,-.17,0);base.receiveShadow=true;g.add(base);
 const p:Puesto[]=[['poste',x0,z0]];if(conPuerta)p.push(['marco_puerta',0,-z0-.15,0,1]);amueblar(g,p);
 return g;
}

/** Luz cálida en un punto (lámparas, fuego). */
export function luzCalida(g:THREE.Group,x:number,y:number,z:number,color='#ffcf8a',fuerza=4,alcance=7){const l=new THREE.PointLight(color,fuerza,alcance,1.6);l.position.set(x,y,z);g.add(l);return l;}

// ------------------------------------------------------------------ locales del pueblo (9 × 8)

const PAPEL_LOCAL:Record<string,string>={semillas:'#E8D5B0',animales:'#E3D6A8',carpinteria:'#E2CBA6',herreria:'#C9C2B2',clinica:'#DCE6D6',posada:'#E6C9A2',archivo:'#D9C7A8',altar_aura:'#F0DEB0',altar_lara:'#DCD0EA'};

export function interiorLocal(servicio:string):THREE.Group{
 const g=cascaron(9,8,PAPEL_LOCAL[servicio]??'#E8D5B0');g.name='interior-local';
 const altar=servicio.startsWith('altar');
 const p:Puesto[]=[
  [altar?'altar':'mostrador',0,-1.6],
  ['ventana',-1.7,-4,0,1,1.8],['ventana',1.7,-4,0,1,1.8],
  ['lampara',-1.5,.4,0,1,2.4],['lampara',1.5,.4,0,1,2.4],
  ['tapete',0,2.7],['planta',-3.9,3.3],['planta',3.9,3.3],
 ];
 for(const x of [-1.5,1.5])luzCalida(g,x,2.2,.4);
 const pared=(c:string,z:number,y=0,s=1):Puesto=>[c,-4.5,z,PI2,s,y];
 switch(servicio){
  case 'semillas':p.push(['estante_mercado',-3.4,-3.7],['estante_mercado',3.4,-3.7],pared('exhibidor_semillas',-.4),['costales',-3.5,1.7,PI2],['canasta_frutas',3.6,-.4],['cajon_verduras',3.6,.6,-.3],['calabazas',3.6,1.8],['canasta_frutas',.9,-1.6,0,.6,1.12],['cuadro',-4.5,-2.6,PI2,1,1.9]);break;
  case 'herreria':p.push(['estante_armas',-3.4,-3.6],['estante_mercado',3.4,-3.7],pared('fragua',1.3),pared('panoplia',-1.6,1.6),['yunque',1.6,1.2,-.4],['barril_agua',3.8,1.6],['barril',3.8,.6],['troncos',3.6,-.6,-PI2,.8]);luzCalida(g,-3.6,1.4,1.3,'#ff8a4a',6,6);break;
  case 'carpinteria':p.push(['estante_mercado',-3.4,-3.7],['pila_tablas',3.4,-3.6,0,.75],pared('pila_tablas',.6),pared('panoplia',-1.8,1.6),['banco_carpintero',2.6,1.2],['troncos',-3.4,2.2,PI2,.8],['silla',3.7,2.7,-.6],['barril',3.9,-.6]);break;
  case 'animales':p.push(['estante_mercado',-3.4,-3.7],['estante_mercado',3.4,-3.7],['paca_heno',-3.7,.8,PI2],['paca_heno',-3.7,1.75,PI2],['paca_heno',-3.7,1.3,PI2,1,.48],['costales',3.5,-.2,-PI2],['montura',3.5,1.6,-PI2],['comedero',-2.2,3.3],['cuadro',-4.5,-1.4,PI2,1,1.9]);break;
  case 'clinica':p.push(['vitrina_frascos',-3.4,-3.6],['vitrina_frascos',3.4,-3.6],['camilla',3.3,1.4],['biombo',1.8,2.4,-.3],pared('botiquin',-1.4,1.8),['sillon',-3.7,1.4,PI2],['sillon',-3.7,.2,PI2],['jarron_flores',-.9,-1.6,0,.7,1.12]);break;
  case 'posada':p.push(['estante_botellas',-3.4,-3.7],['estante_botellas',3.4,-3.7],pared('chimenea',1.3),['barril_grande',3.7,-.3,-PI2],['mesa_taberna',-1.4,2.1],['mesa_taberna',2.2,2.3]);
   for(const [mx,mz] of [[-1.4,2.1],[2.2,2.3]])for(let k=0;k<3;k++){const a=k*2.1+.5;p.push(['taburete',mx+Math.cos(a)*.95,mz+Math.sin(a)*.95]);}
   luzCalida(g,-3.8,.6,1.3,'#ff9a4a',5,6);break;
  case 'archivo':p.push(['biblioteca',-3.4,-3.7],['biblioteca',3.4,-3.7],pared('biblioteca',-1.6),pared('biblioteca',-.25),pared('biblioteca',1.1),['globo',3.6,.7],['escritorio',2.6,2.4],['silla',2.6,3.1,Math.PI],['pila_tablas',-3.7,2.6,PI2,.4]);break;
  default:{const cr=servicio==='altar_aura'?'cristales_aura':'cristales_lara';p.push([cr,-3.4,-3.4,0,1.6],[cr,3.4,-3.4,0,1.6],[cr,-3.8,1.8,0,1.2],[cr,3.8,1.2,0,1.2],['jarron_flores',-2.2,-3.3],['jarron_flores',2.2,-3.3],pared('cuadro',-1.4,1.9));luzCalida(g,0,1.5,-2.5,servicio==='altar_aura'?'#ffd27a':'#c9a8ff',4,7);}
 }
 amueblar(g,p);return g;
}

// ------------------------------------------------------------------ viviendas del pueblo (12 × 10)

export function interiorVivienda(colores:string[],tema:string):THREE.Group{
 const color=colores[0]??'#E4566B';const g=cascaron(12,10,new THREE.Color(color).lerp(new THREE.Color('#F3E6CA'),.75).getStyle());g.name='interior-vivienda-kit';
 const p:Puesto[]=[['ventana',-3,-5,0,.85,1.9],['ventana',3,-5,0,.85,1.9],['tapete',0,2,0,1.3],['planta',-5.4,4.3],['planta',5.4,4.3],
  ['lampara',-1,-.7,0,1,2.4],['lampara',3,1.6,0,1,2.4],
  ['mesa_comedor',-1,-.7],['silla',-1.55,.0,Math.PI],['silla',-.45,.0,Math.PI],['silla',-1.55,-1.4],['silla',-.45,-1.4],
  ['cocina',-5.65,1.6,PI2],['biblioteca',5.3,.2,-PI2],['sillon',3.3,2.6,-.5],['cuadro',-6,-2.6,PI2,1,1.9],['baul',5.2,-2.6,-PI2]];
 luzCalida(g,-1,2.2,-.7);luzCalida(g,3,2.2,1.6);
 const t=tema;
 if(['huerto','jardin','corral','despertar','bosque','rosal'].includes(t))p.push(['jarron_flores',-1,-.7,0,.5,.84],['canasta_frutas',-4.6,3.4],['planta',-3.2,4.3]);
 if(['roble','forja','senderos','ribera'].includes(t))p.push(['panoplia',-6,-.6,PI2,1,1.6],['troncos',-4.8,3.6,0,.7]);
 if(['archivo','escuela','observatorio','calma'].includes(t))p.push(['globo',4.6,3.6],['escritorio',3.4,-3.9]);
 if(['molino','tejidos'].includes(t))p.push(['costales',-4.6,3.4],['banco_carpintero',3.4,-3.9,0,.8]);
 amueblar(g,p);return g;
}
/** Puerta de cada cuarto en la pared del fondo, teñida con el color de quien vive ahí. */
export function puertaCuarto(g:THREE.Group,x:number,z:number,color:string){amueblar(g,[['puerta',x,z]],{'Granja | puerta':color});}

// ------------------------------------------------------------------ dormitorios (8 × 8)

export function interiorDormitorio(color:string):THREE.Group{
 const g=cascaron(8,8,new THREE.Color(color).lerp(new THREE.Color('#F3E6CA'),.7).getStyle());g.name='dormitorio-kit';
 amueblar(g,[['ventana',0,-4,0,1,1.9],['cama',-2.4,-2.95],['mesa_noche',-1.2,-3.6],['armario',-3.6,.2,PI2],['escritorio',2.4,-3.5],['silla',2.4,-2.7,Math.PI],
  ['tapete',0,1.1],['planta',3.2,2.6],['lampara',0,0,0,1,2.4],['cuadro',-4,-1.8,PI2,1,1.9],['baul',-2.4,-1.2,0,.8]]);
 amueblar(g,[['cama',-2.4,-2.95]],{'cobija':color});
 luzCalida(g,0,2.2,0);luzCalida(g,-1.2,1,-3.4,'#ffd9a0',2,3);return g;
}

// ------------------------------------------------------------------ cabaña de la granja (8 × 8)

export function interiorCabana():THREE.Group{
 const g=cascaron(8,8,'#EAD8B6');g.name='muebles-cabana';
 amueblar(g,[['ventana',1.8,-4,0,1,1.8],['cama',-2.6,-2.95],['mesa_noche',-1.3,-3.6],['cocina',2.6,-3.65,0,.9],['mesa_comedor',2.2,-.6,PI2,.8],['silla',1.6,-.6,PI2],['silla',2.8,-.6,-PI2],
  ['chimenea',-4,1.4,PI2],['biblioteca',-3.7,-1.0,PI2],['baul',-2.6,-1.1,0,.9],['tapete',0,1.6],['planta',3.5,3.3],['planta',-3.4,3.4,0,.8],['jarron_flores',2.2,-.6,0,.5,.66],
  ['cuadro',-.4,-4,0,1,2],['lampara',.5,.2,0,1,2.4],['sillon',-2.3,2.2,PI2*.8]]);
 luzCalida(g,-3.3,.8,1.4,'#ffb36b',5,7);luzCalida(g,.5,2.2,.2);return g;
}
