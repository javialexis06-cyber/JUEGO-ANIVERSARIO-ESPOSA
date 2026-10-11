import * as T from 'three';
import { Objeto, type Asset, type Calidad } from '../granja-v2/biblioteca';
import { compactar, liberar } from './suelo';
import type { Species } from './genetica';
import type { Incubadora } from './ganaderia';
export type ObjetivoGanado={tipo:'buzon'|'obra'|'establo'|'companero'|'cuenco'|'animal'|'trufa'|'incubadora'|'nido'|'puerta'|'comedero';id:string};
export const esAnimalNativo=(id:string)=>['cabra','pato','avestruz','dinosaurio'].includes(id);
/** Modelos propios, sin texturas externas. Las partes quietas se agrupan por material. */
export function animalNativo(especie:Species,variante=0,calidad:Calidad='ligera'){
 const root=new T.Group(),body=new T.Group(),head=new T.Group(),mats=new Map<string,T.MeshStandardMaterial>();root.add(body);head.name='cabeza';body.add(head);
 const palette:Record<string,string[]>={cabra:['#c69660','#343943','#939eaa','#efe9d8'],pato:['#836a48','#644943','#9aabba','#f0ecd8'],avestruz:['#34363e','#95714c','#8c969c','#ead8b7'],dinosaurio:['#72a574','#7daabc','#c88465','#d1b064']},base=palette[especie]?.[variante]??'#b7a684',claro=especie==='dinosaurio'?'#d7ddae':'#efe3c5',oscuro='#393846',seg=calidad==='alta'?20:12;
 const mat=(c:string)=>{let m=mats.get(c);if(!m){m=new T.MeshStandardMaterial({color:c,roughness:.72});mats.set(c,m);}return m;};
 const oval=(g:T.Group,p:number[],r:number[],c:string)=>{const m=new T.Mesh(new T.SphereGeometry(1,seg,Math.round(seg*.7)),mat(c));m.position.set(...p as [number,number,number]);m.scale.set(...r as [number,number,number]);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
 const cono=(g:T.Group,p:number[],r:number,h:number,c:string,rx=0)=>{const m=new T.Mesh(new T.ConeGeometry(r,h,10),mat(c));m.position.set(...p as [number,number,number]);m.rotation.x=rx;m.castShadow=true;g.add(m);return m;};
 const patas:T.Group[]=[];const pata=(x:number,z:number,y:number,largo:number,grueso:number)=>{const g=new T.Group();g.position.set(x,y,z);g.name='pata'+patas.length;root.add(g);oval(g,[0,-largo/2,0],[grueso,largo/2,grueso],especie==='cabra'?base:'#d6ad75');oval(g,[0,-largo,.04],[grueso*1.5,.065,grueso*2],especie==='cabra'?oscuro:'#d1a56b');compactar(g);patas.push(g);};
 if(especie==='cabra'){
  oval(body,[0,.87,0],[.38,.4,.65],base);oval(body,[0,.81,.1],[.29,.29,.48],claro);head.position.set(0,1.18,.56);oval(head,[0,0,0],[.23,.3,.25],base);oval(head,[0,-.08,.23],[.18,.14,.18],claro);oval(head,[0,-.04,.35],[.10,.055,.035],oscuro);
  for(const x of [-1,1]){const e=oval(head,[x*.28,.1,0],[.18,.075,.095],base);e.rotation.z=x*.25;oval(head,[x*.285,.11,.03],[.13,.03,.05],'#d5b195');cono(head,[x*.14,.35,-.09],.065,.4,'#b9aa82',-.45);oval(head,[x*.2,.06,.16],[.035,.045,.028],oscuro);oval(head,[x*.211,.077,.185],[.012,.014,.007],'#fffbee');}cono(head,[0,-.32,.2],.08,.21,claro,Math.PI);for(const x of [-.23,.23])for(const z of [-.4,.35])pata(x,z,.74,.59,.065);const tail=oval(body,[0,1,-.7],[.07,.19,.09],base);tail.rotation.x=-.5;
 }else if(especie==='pato'){
  oval(body,[0,.51,0],[.4,.36,.57],base);oval(body,[0,.53,.39],[.28,.29,.3],claro);head.position.set(0,.91,.42);oval(head,[0,0,0],[.24,.24,.25],variante===0?'#416f61':base);oval(head,[0,-.075,.29],[.19,.06,.22],'#dfa853');oval(head,[0,-.08,.43],[.16,.025,.065],'#be8748');oval(head,[0,-.2,-.02],[.2,.07,.18],claro);for(const x of [-1,1]){oval(head,[x*.2,.055,.13],[.04,.044,.022],oscuro);oval(head,[x*.216,.07,.142],[.012,.012,.008],'#fffbee');oval(body,[x*.33,.52,-.1],[.09,.2,.38],variante===0?'#50738b':base);oval(body,[x*.38,.6,-.1],[.02,.045,.30],claro);pata(x*.18,.04,.24,.18,.075);}const tail=cono(body,[0,.65,-.59],.15,.38,base,-Math.PI/2);tail.rotation.z=.2;
 }else if(especie==='avestruz'){
  oval(body,[0,1.07,-.05],[.43,.43,.56],base);for(const x of [-1,1])oval(body,[x*.32,1.06,-.12],[.16,.31,.48],claro);oval(body,[0,1.55,.3],[.12,.6,.13],'#d8bf9e');head.position.set(0,2.08,.4);oval(head,[0,0,0],[.19,.19,.21],claro);oval(head,[0,-.03,.23],[.1,.06,.16],'#cbac7c');for(const x of [-1,1]){oval(head,[x*.165,.065,.1],[.043,.05,.025],oscuro);oval(head,[x*.179,.085,.112],[.013,.014,.007],'#fffbee');pata(x*.18,-.04,.8,.73,.045);for(let i=0;i<3;i++)oval(body,[x*(.17+i*.065),1.23,-.58],[.09,.24,.23],claro);}
 }else{
  oval(body,[0,.69,0],[.41,.46,.63],base);oval(body,[0,.61,.22],[.3,.3,.44],claro);head.position.set(0,1.04,.58);oval(head,[0,0,0],[.3,.29,.39],base);oval(head,[0,-.13,.28],[.27,.12,.26],claro);oval(head,[0,-.04,.4],[.27,.09,.24],base);for(const x of [-1,1]){oval(head,[x*.25,.10,.20],[.06,.067,.026],oscuro);oval(head,[x*.275,.124,.216],[.018,.018,.009],'#fffbee');oval(head,[x*.16,0,.53],[.026,.019,.015],oscuro);for(const z of [-.34,.32])pata(x*.26,z,.47,.35,.09);oval(body,[x*.35,.79,.09],[.1,.15,.26],base);}
  const tail=oval(body,[0,.62,-.81],[.15,.17,.5],base);tail.rotation.x=.35;for(let i=0;i<6;i++)cono(body,[0,1.16-i*.025,.4-i*.22],.105,.22, '#b77d54');for(let i=0;i<3;i++)oval(head,[0,-.15,.33+i*.09],[.025,.015,.025],'#b5906d');
 }
 compactar(head);for(const child of [...body.children])if(child!==head&&child instanceof T.Mesh)child.name='';
 // Mantener cabeza y patas como pivotes; compactar solo la geometría del cuerpo.
 body.remove(head);compactar(body);body.add(head);
 const times=[0,.45,.9],track=(name:string,values:number[])=>new T.NumberKeyframeTrack(name,times,values);
 const clips=[new T.AnimationClip('reposo',.9,[track('cabeza.rotation[x]',[0,.06,0])]),new T.AnimationClip('comer',.9,[track('cabeza.rotation[x]',[.45,.8,.45])]),new T.AnimationClip('acariciar',.9,[track('cabeza.rotation[z]',[-.1,.1,-.1])]),new T.AnimationClip('caminar',.9,patas.map((p,i)=>track(p.name+'.rotation[x]',i%2?[-.25,.25,-.25]:[.25,-.25,.25])))];
 let triangles=0,drawCalls=0;root.traverse(o=>{if(o instanceof T.Mesh){drawCalls++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});const size=new T.Box3().setFromObject(root).getSize(new T.Vector3()).toArray();
 const asset:Asset={id:especie,label:especie,category:'animal',path:'procedural',bytes:0,triangles,drawCalls,animations:clips.map(c=>c.name),footprint:[1,2],size,lod:{path:'procedural',bytes:0,triangles,drawCalls}};return new Objeto(root,asset,clips,()=>liberar(root));
}
export function incubadoraVista(i:Incubadora){const g=new T.Group(),mats:T.Material[]=[];const mat=(color:string)=>{const m=new T.MeshStandardMaterial({color,roughness:.6});mats.push(m);return m;};const madera=mat('#94714c'),metal=mat('#b6b5a4'),heno=mat('#d8be76'),huevo=mat('#f4e7bf');const box=(s:number[],p:number[],m:T.Material)=>{const o=new T.Mesh(new T.BoxGeometry(...s as [number,number,number]),m);o.position.set(...p as [number,number,number]);o.castShadow=true;g.add(o);};box([1.3,.15,.95],[0,.5,0],madera);for(const x of [-.52,.52])for(const z of[-.35,.35])box([.12,.55,.12],[x,.26,z],madera);box([1.05,.09,.7],[0,.6,0],heno);for(const x of [-.58,.58])box([.08,.55,.88],[x,.8,0],metal);box([1.3,.08,.95],[0,1.1,0],metal);const lampara=new T.Mesh(new T.SphereGeometry(.12,12,8),new T.MeshStandardMaterial({color:'#ffda91',emissive:'#f4a343',emissiveIntensity:.55}));lampara.position.set(0,.98,0);g.add(lampara);if(i.huevo){const e=new T.Mesh(new T.SphereGeometry(.18,16,12),huevo);e.scale.y=i.grande?1.5:1.3;e.position.y=.77;e.name='huevoIncubado';g.add(e);}compactar(g);g.userData.ganado={tipo:'incubadora',id:i.edificioId} satisfies ObjetivoGanado;g.position.set(0,0,-2.9);return g;}
export function trufaVista(id:string){const g=new T.Group(),m=new T.MeshStandardMaterial({color:'#8f7052',roughness:.95});for(const [x,y,z,r] of [[0,.15,0,.18],[.12,.12,.09,.13],[-.08,.12,.12,.11]]){const t=new T.Mesh(new T.SphereGeometry(r,10,7),m);t.position.set(x,y,z);t.castShadow=true;g.add(t);}compactar(g);g.userData.ganado={tipo:'trufa',id} satisfies ObjetivoGanado;return g;}

export function huevosRefugio(animalId:string,especie:Species,cantidad:number){const g=new T.Group(),m=new T.MeshStandardMaterial({color:especie==='dinosaurio'?'#a4b984':especie==='pato'?'#d1ddba':'#f1e2bd',roughness:.8}),paja=new T.MeshStandardMaterial({color:'#ceb078',roughness:1});const aro=new T.Mesh(new T.TorusGeometry(.27,.045,5,16),paja);aro.rotation.x=Math.PI/2;aro.position.y=.06;g.add(aro);for(let i=0;i<Math.min(3,cantidad);i++){const e=new T.Mesh(new T.SphereGeometry(.09,12,8),m);e.scale.y=1.35;e.position.set((i-1)*.12,.12,(i%2)*.12-.06);e.castShadow=true;g.add(e);}compactar(g);g.userData.ganado={tipo:'nido',id:animalId} satisfies ObjetivoGanado;return g;}

/** Puerta con bisagra; su etiqueta permite pulsarla sin seleccionar todo el edificio. */
export function puertaGanadoVista(id:string,abierta:boolean){
 const g=new T.Group(),hoja=new T.Group(),madera=new T.MeshStandardMaterial({color:'#b98c5b',roughness:.8}),metal=new T.MeshStandardMaterial({color:'#7a786a',roughness:.45});
 g.name='puerta-ganado-'+id;g.userData.ganado={tipo:'puerta',id} satisfies ObjetivoGanado;
 hoja.position.x=-.48;hoja.rotation.y=abierta?-Math.PI*.48:0;g.add(hoja);
 const box=(s:number[],p:number[],m:T.Material)=>{const o=new T.Mesh(new T.BoxGeometry(...s as [number,number,number]),m);o.position.set(...p as [number,number,number]);o.castShadow=true;hoja.add(o);};
 for(let i=0;i<5;i++)box([.18,1.45,.10],[.09+i*.19,.8,0],madera);
 for(const y of [.3,1.25])box([.93,.1,.13],[.475,y,.02],metal);
 box([.07,.15,.15],[.8,.8,.13],metal);compactar(hoja);return g;
}
export function comederoVista(id:string,henos:number){
 const g=new T.Group(),wood=new T.MeshStandardMaterial({color:'#a7855f',roughness:.85}),hay=new T.MeshStandardMaterial({color:'#d6bf79',roughness:.95});g.name='comedero-'+id;
 const box=(s:number[],p:number[],m:T.Material)=>{const o=new T.Mesh(new T.BoxGeometry(...s as [number,number,number]),m);o.position.set(...p as [number,number,number]);o.castShadow=true;g.add(o);};
 box([1.8,.12,.65],[0,.45,0],wood);for(const z of [-.32,.32])box([1.9,.28,.08],[0,.58,z],wood);for(const x of [-.92,.92])box([.08,.28,.7],[x,.58,0],wood);for(const x of [-.72,.72])box([.1,.45,.1],[x,.23,0],wood);
 if(henos>0){box([1.7,.12,.53],[0,.55,0],hay);for(let i=0;i<18;i++){const o=new T.Mesh(new T.BoxGeometry(.15,.02,.012),hay);o.position.set(-.7+i%6*.26,.63+.015*(i%2),-.19+Math.floor(i/6)*.18);o.rotation.y=i*.71;g.add(o);}}
 compactar(g);g.userData.ganado={tipo:'comedero',id} satisfies ObjetivoGanado;g.position.set(-.88,0,-.76);g.scale.set(.6,.75,1);return g;
}
