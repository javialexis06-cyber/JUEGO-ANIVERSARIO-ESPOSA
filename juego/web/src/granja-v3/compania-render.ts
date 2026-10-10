import * as T from 'three';
import { Objeto, type Asset, type Calidad } from '../granja-v2/biblioteca';
import { compactar, liberar, caja, esfera } from './suelo';
import type { TipoCompania } from './compania';
import type { ObjetivoGanado } from './ganaderia-render';

/** Cuatro familias originales con pivotes animados y geometría agrupada por material. */
export function modeloCompania(tipo:TipoCompania,variante=0,calidad:Calidad='ligera'){
 const root=new T.Group(),body=new T.Group(),head=new T.Group(),tail=new T.Group(),patas:T.Group[]=[],mats=new Map<string,T.MeshStandardMaterial>();root.name='compania-'+tipo;root.add(body,tail);head.name='cabeza';tail.name='cola';body.add(head);
 const paletas={gato:['#c98e58','#3e414d','#969faa','#e9deca'],perro:['#cda05e','#343c48','#9caab7','#e8d1a1'],tortuga:['#859a61','#496f62','#738e9d','#bcad74'],caballo:['#a56f4c','#343942','#9da8ae','#d9b877']},base=paletas[tipo][variante]??paletas[tipo][0],oscuro='#39343b',claro=tipo==='caballo'?'#dfd3b9':'#f1dfbc',seg=calidad==='alta'?20:12;
 const mat=(c:string)=>{let m=mats.get(c);if(!m){m=new T.MeshStandardMaterial({color:c,roughness:.78});mats.set(c,m);}return m;};
 const oval=(g:T.Group,p:number[],r:number[],c:string)=>{const o=new T.Mesh(new T.SphereGeometry(1,seg,Math.round(seg*.65)),mat(c));o.position.set(...p as [number,number,number]);o.scale.set(...r as [number,number,number]);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;};
 const box=(g:T.Group,p:number[],s:number[],c:string)=>{const o=new T.Mesh(new T.BoxGeometry(...s as [number,number,number]),mat(c));o.position.set(...p as [number,number,number]);o.castShadow=true;g.add(o);return o;};
 const pata=(x:number,z:number,y:number,l:number,r:number)=>{const g=new T.Group();g.name='pata'+patas.length;g.position.set(x,y,z);root.add(g);oval(g,[0,-l*.45,0],[r,l*.55,r],base);oval(g,[0,-l,.04],[r*1.5,.07,r*1.65],tipo==='caballo'?oscuro:claro);compactar(g);patas.push(g);};
 if(tipo==='caballo'){
  oval(body,[0,1.18,-.06],[.38,.43,.77],base);oval(body,[0,1.19,.56],[.24,.42,.31],base);const cuello=oval(body,[0,1.53,.62],[.22,.48,.25],base);cuello.rotation.x=-.3;
  head.position.set(0,1.91,.85);oval(head,[0,0,0],[.22,.29,.3],base);const hocico=oval(head,[0,-.17,.29],[.17,.15,.3],variante===1?'#676b74':'#be9472');hocico.rotation.x=.35;oval(head,[0,.02,.27],[.075,.18,.03],claro);
  for(const x of[-1,1]){oval(head,[x*.14,.32,-.05],[.08,.22,.06],base);oval(head,[x*.19,.06,.10],[.035,.04,.022],oscuro);oval(head,[x*.205,.075,.118],[.012,.012,.007],'#fff7dc');oval(head,[x*.10,-.2,.49],[.025,.018,.015],oscuro);box(head,[x*.21,-.1,.25],[.025,.05,.25],'#6d513e');for(const z of[-.57,.47])pata(x*.25,z,1,.87,.07);}
  for(let i=0;i<7;i++)oval(body,[0,1.83-i*.05,.53-i*.1],[.12,.17,.1],variante===3?'#f0dfb0':oscuro);
  oval(body,[0,1.55,-.12],[.41,.035,.45],'#779a8a');box(body,[0,1.6,-.12],[.49,.1,.53],'#76523b');oval(body,[0,1.67,-.35],[.31,.1,.08],'#976846');
  for(const x of[-1,1]){box(body,[x*.39,1.07,-.12],[.035,.65,.065],'#775640');const estribo=new T.Mesh(new T.TorusGeometry(.085,.017,5,12),mat('#c9ba91'));estribo.position.set(x*.41,.81,-.12);estribo.rotation.y=Math.PI/2;body.add(estribo);}
  tail.position.set(0,1.37,-.8);const pelo=oval(tail,[0,-.31,-.11],[.1,.39,.12],variante===3?'#e9d6a0':oscuro);pelo.rotation.x=.25;
 }else if(tipo==='tortuga'){
  oval(body,[0,.20,0],[.34,.17,.47],base);oval(body,[0,.38,-.05],[.39,.25,.48],base);oval(body,[0,.18,0],[.34,.06,.44],'#d6c290');
  for(let j=0;j<3;j++)for(let i=0;i<3;i++){const x=(i-1)*.20,z=(j-1)*.24;oval(body,[x,.51-Math.abs(i-1)*.065-Math.abs(j-1)*.025,z-.05],[.092,.032,.11],variante===1?'#739879':'#b4ba83');}
  head.position.set(0,.27,.48);oval(head,[0,0,0],[.15,.14,.19],base);for(const x of[-1,1]){oval(head,[x*.12,.025,.085],[.029,.035,.022],oscuro);oval(head,[x*.132,.037,.097],[.008,.01,.006],'#fff3cf');for(const z of[-.29,.25])pata(x*.30,z,.17,.10,.10);}tail.position.set(0,.18,-.48);oval(tail,[0,0,-.08],[.05,.05,.12],base);
 }else{
  const dog=tipo==='perro';oval(body,[0,dog?.49:.43,0],[dog?.25:.22,dog?.28:.25,dog?.45:.36],base);oval(body,[0,dog?.45:.40,.25],[.18,.22,.21],claro);head.position.set(0,dog?.79:.76,dog?.39:.32);oval(head,[0,0,0],[dog?.24:.23,.23,.23],base);oval(head,[0,-.06,.21],[.16,.10,dog?.18:.11],claro);oval(head,[0,-.025,dog?.36:.30],[.055,.038,.035],oscuro);
  for(const x of[-1,1]){const ear=oval(head,[x*.18,dog?.04:.24,dog?-.06:0],[dog?.11:.09,dog?.27:.16,.065],base);ear.rotation.z=x*(dog?.25:-.25);oval(head,[x*.14,.07,.17],[.034,.041,.022],oscuro);oval(head,[x*.15,.084,.190],[.009,.01,.005],'#fff9dd');if(!dog){oval(head,[x*.185,.25,.033],[.04,.09,.018],'#d6aaa0');for(let i=0;i<3;i++)box(head,[x*.19,-.06+i*.026,.28],[.21,.008,.008],'#e8d8bd');}for(const z of[-.26,.25])pata(x*(dog?.16:.14),z,dog?.36:.32,dog?.27:.23,.055);}
  tail.position.set(0,dog?.60:.54,dog?-.43:-.35);const pelo=oval(tail,[0,.16,-.11],[.065,dog?.23:.30,.07],base);pelo.rotation.x=dog?-.65:.2;
  const collar=oval(body,[0,dog?.70:.65,dog?.31:.28],[.205,.04,.17],'#729ba0');oval(body,[0,dog?.65:.61,dog?.48:.44],[.04,.05,.018],'#d4b375');collar.name='';
 }
 compactar(head);body.remove(head);compactar(body);body.add(head);compactar(tail);
 const times=[0,.35,.7],track=(n:string,v:number[])=>new T.NumberKeyframeTrack(n,times,v),clips=[new T.AnimationClip('reposo',.7,[track('cabeza.rotation[x]',[0,.04,0]),track('cola.rotation[z]',[-.06,.06,-.06])]),new T.AnimationClip('caminar',.7,[...patas.map((p,i)=>track(p.name+'.rotation[x]',i%3===0?[.32,-.32,.32]:[-.32,.32,-.32])),track('cola.rotation[z]',[-.12,.12,-.12])]),new T.AnimationClip('comer',.7,[track('cabeza.rotation[x]',[.35,.6,.35])]),new T.AnimationClip('acariciar',.7,[track('cabeza.rotation[z]',[-.12,.12,-.12]),track('cola.rotation[z]',[-.25,.25,-.25])]),new T.AnimationClip('dormir',.7,[track('cabeza.rotation[x]',[.2,.23,.2])])];
 let triangles=0,drawCalls=0;root.traverse(o=>{if(o instanceof T.Mesh){drawCalls++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});const size=new T.Box3().setFromObject(root).getSize(new T.Vector3()).toArray(),asset:Asset={id:tipo,label:tipo,category:'animal',path:'procedural',bytes:0,triangles,drawCalls,animations:clips.map(c=>c.name),footprint:[1,2],size,lod:{path:'procedural',bytes:0,triangles,drawCalls}};return new Objeto(root,asset,clips,()=>liberar(root));
}
export function hogarMascotaVista(id:string,agua:boolean){
 const g=new T.Group();caja(g,[1.45,.12,1.35],[0,.06,-.08],'#b09a7d');caja(g,[1.2,.14,.95],[0,.2,-.1],'#a2b69a');for(const x of[-.7,.7])caja(g,[.10,.52,1.3],[x,.28,-.08],'#d9bc8e');caja(g,[1.5,.5,.10],[0,.27,-.72],'#d9bc8e');
 for(const x of[-.72,.72]){caja(g,[.07,1.1,.07],[x,.55,-.73],'#97704e');caja(g,[.07,1.1,.07],[x,.55,.49],'#97704e');}for(const x of[-1,1]){const techo=caja(g,[.95,.12,1.6],[x*.37,1.14,-.08],'#92a7a2');techo.rotation.z=-x*.22;}
 for(let i=0;i<8;i++)for(const x of[-1,1]){const tabla=caja(g,[.95,.018,.015],[x*.37,1.22,-.78+i*.20],'#c7d2bd');tabla.rotation.z=-x*.22;}caja(g,[.075,.08,1.62],[0,1.26,-.08],'#d1c09e');for(const x of[-.7,.7])for(const z of[-.69,.45])esfera(g,[.025,.025,.014],[x,.39,z],'#8b7c66');esfera(g,[.22,.09,.17],[-.27,.33,-.36],'#d5c39d');caja(g,[1.25,.03,.04],[0,.26,.44],'#c4bc8e');
 compactar(g);const cuenco=new T.Group(),m=new T.MeshStandardMaterial({color:'#b69171',roughness:.65});cuenco.name='cuenco-'+id;const aro=new T.Mesh(new T.TorusGeometry(.24,.05,6,18),m);aro.rotation.x=Math.PI/2;aro.position.y=.12;cuenco.add(aro);const base=new T.Mesh(new T.CylinderGeometry(.22,.17,.11,16),m);base.position.y=.06;cuenco.add(base);if(agua){const aguaMesh=new T.Mesh(new T.CircleGeometry(.205,16),new T.MeshStandardMaterial({color:'#8dc6cc',roughness:.2}));aguaMesh.rotation.x=-Math.PI/2;aguaMesh.position.y=.119;cuenco.add(aguaMesh);}compactar(cuenco);cuenco.position.set(.5,0,1.5);cuenco.userData.ganado={tipo:'cuenco',id} satisfies ObjetivoGanado;g.add(cuenco);return g;
}
