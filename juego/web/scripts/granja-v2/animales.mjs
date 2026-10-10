import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { grupo, caja, toro, malla, material } from './formas.mjs';

// Sculpted, animation-ready farm animals. Metres, ground at Y=0, forward +Z.
// Organic surfaces carry their colour in vertices; no image textures required.
const C={ivory:'#f7ebd6',cream:'#fff3dc',milk:'#f6ead8',cocoa:'#79513b',dark:'#372d2b',
  hoof:'#675049',pink:'#e9a196',rose:'#cc7d78',nose:'#bd746d',leaf:'#91ae85',gold:'#d7aa55',
  wool:'#f6ecd9',woolShade:'#e5d7bc',sheep:'#97745c',pig:'#e9aea2',pigLight:'#f0baae',
  orange:'#dc9555',rust:'#b47b47',hen:'#f5dfb8',red:'#c96d61',rabbit:'#c5a98c'};

function ctx(id){
  const root=grupo(id);let seq=0;
  return {root,n:s=>`${id}_${s}_${seq++}`,g(s,parent=root,pos=[0,0,0]){return grupo(`${id}_${s}_${seq++}`,parent,pos);}};
}

function smoothGeometry(geo){
  // Weld the longitudinal seam and poles before computing normals. Otherwise
  // duplicate seam vertices shade as a hard edge on a curved organic surface.
  geo.deleteAttribute('normal');geo.deleteAttribute('uv');
  const welded=mergeVertices(geo,1e-6);welded.computeVertexNormals();geo.dispose();return welded;
}

function ell(c,p,name,size,pos,color,segments=24,rings=16,deform){
  const geo=new THREE.SphereGeometry(1,segments,rings),v=geo.attributes.position;
  for(let i=0;i<v.count;i++){
    let x=v.getX(i),y=v.getY(i),z=v.getZ(i);
    if(deform){const d=deform(x,y,z);x=d[0];y=d[1];z=d[2];}
    v.setXYZ(i,x*size[0]/2,y*size[1]/2,z*size[2]/2);
  }
  return malla(p,c.n(name),smoothGeometry(geo),pos,color);
}

// A swept, closed organic surface with a varying radius and elliptical section.
// Anatomical forms taper continuously instead of joining cylinders and balls.
function organic(c,p,name,points,radii,color,segments=20,radial=10,flatten=1){
  const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)),false,'centripetal');
  const frames=curve.computeFrenetFrames(segments,false),positions=[],indices=[];
  for(let i=0;i<=segments;i++){
    const t=i/segments,cp=curve.getPointAt(t),f=t*(radii.length-1),k=Math.min(radii.length-2,Math.floor(f)),u=f-k;
    const r=THREE.MathUtils.lerp(radii[k],radii[k+1],u*u*(3-2*u));
    for(let j=0;j<=radial;j++){
      const a=j/radial*Math.PI*2,v=cp.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r*flatten);
      positions.push(v.x,v.y,v.z);
      if(i<segments&&j<radial){const a0=i*(radial+1)+j,b0=a0+radial+1;indices.push(a0,a0+1,b0,b0,a0+1,b0+1);}
    }
  }
  // Close both ends. Limb roots are also buried well inside the torso, so no
  // open rim can appear during breathing or gait animation.
  for(const end of [0,1]){
    const cp=curve.getPointAt(end),center=positions.length/3;positions.push(cp.x,cp.y,cp.z);
    const offset=end*segments*(radial+1);
    for(let j=0;j<radial;j++)indices.push(...(end?[center,offset+j,offset+j+1]:[center,offset+j+1,offset+j]));
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);
  return malla(p,c.n(name),smoothGeometry(geo),[0,0,0],color);
}

// A soft solid leaf shape also works for folded ears and layered feathers.
function petal(c,p,name,length,width,thickness,pos,color,bend=.05,segments=12,rings=12){
  const positions=[],indices=[];
  for(let i=0;i<=rings;i++){
    const t=i/rings,outline=Math.pow(Math.sin(Math.PI*t),.74),fold=bend*t*t;
    for(let j=0;j<=segments;j++){
      const a=j/segments*Math.PI*2;
      positions.push(Math.cos(a)*outline*width*.5,t*length,Math.sin(a)*outline*thickness*.5+fold);
      if(i<rings&&j<segments){const a0=i*(segments+1)+j,b0=a0+segments+1;indices.push(a0,b0,a0+1,b0,b0+1,a0+1);}
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);
  return malla(p,c.n(name),smoothGeometry(geo),pos,color);
}

function ear(c,parent,pos,length,width,color,inner,rot=[0,0,0],bend=.035){
  const pivot=c.g('oreja_pivote',parent,pos);pivot.rotation.set(...rot);
  petal(c,pivot,'oreja_esculpida',length,width,.055,[0,0,0],color,bend,14,14);
  petal(c,pivot,'concha_interior',length*.77,width*.67,.014,[0,length*.09,.025],inner,bend*.85,12,12);
  organic(c,pivot,'pliegue_oreja',[[0,length*.12,.04],[width*.105,length*.30,.045+bend*.1],[width*.09,length*.54,.041+bend*.32]], [.01,.012,.002],color,12,6);
  return pivot;
}

function line(c,p,name,points,color=C.dark,r=.012,segments=12){return organic(c,p,name,points,[r*.35,r,r*.35],color,segments,6);}

function eye(c,p,pos,size=1,side=1,skin=C.milk){
  const pivot=c.g('ojo_parpado_pivote',p,pos);pivot.rotation.y=side*.18;
  ell(c,pivot,'esclerotica',[.116*size,.145*size,.035*size],[0,0,-.008*size],'#f5eee1',20,12);
  ell(c,pivot,'iris',[.086*size,.111*size,.023*size],[side*.004*size,-.003*size,.012*size],'#503e30',20,14).material=material('#ffffff','eye');
  ell(c,pivot,'pupila',[.057*size,.084*size,.012*size],[side*.004*size,-.004*size,.022*size],'#251f20',16,12).material=material('#ffffff','eye');
  ell(c,pivot,'reflejo_principal',[.023*size,.028*size,.006*size],[-.016*size,.022*size,.028*size],'#fffdf5',10,6);
  ell(c,pivot,'reflejo_secundario',[.007*size,.009*size,.004*size],[.018*size,-.025*size,.028*size],'#efe6d5',8,6);
  // The eyelid rim belongs to the animated eye; the brow remains on the face.
  line(c,pivot,'borde_parpado',[[-.049*size,.027*size,.000],[0,.068*size,.012*size],[.049*size,.029*size,.000]],skin,.012*size,16);
  line(c,p,'ceja',[[pos[0]-.043*size,pos[1]+.10*size,pos[2]-.004],[pos[0],pos[1]+.114*size,pos[2]+.003],[pos[0]+.043*size,pos[1]+.098*size,pos[2]-.004]],C.cocoa,.009*size,14);
  return pivot;
}

function face(c,p,width,y,z,scale=1,skin=C.milk){return[-1,1].map(s=>eye(c,p,[s*width,y,z],scale,s,skin));}

function patches(mesh,size,kind='cow'){
  const pos=mesh.geometry.attributes.position,col=mesh.geometry.attributes.color;
  if(!col)return;
  const shade=new THREE.Color(C.cocoa),light=new THREE.Color(C.cream);
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i)/(size[0]/2),y=pos.getY(i)/(size[1]/2),z=pos.getZ(i)/(size[2]/2);
    let mask;
    if(kind==='cow'){
      const a=Math.pow((x+.9)/.47,2)+Math.pow((y-.16)/.69,2)+Math.pow((z+.37)/.72,2);
      const b=Math.pow((x-.87)/.51,2)+Math.pow((y-.18)/.72,2)+Math.pow((z-.25)/.58,2);
      const d=Math.pow((x-.13)/.61,2)+Math.pow((y-.94)/.38,2)+Math.pow((z+.48)/.48,2);
      const irregular=.06*Math.sin(x*8+y*5+z*4)+.035*Math.sin(z*11-y*7);
      mask=1-THREE.MathUtils.smoothstep(Math.min(a,b,d)+irregular,.64,1.34);
    }else if(kind==='cowFace'){
      const field=Math.pow((x+.76)/.62,2)+Math.pow((y-.36)/.7,2)+Math.pow((z-.39)/.65,2);
      mask=1-THREE.MathUtils.smoothstep(field+.04*Math.sin(y*10+z*7),.64,1.35);
    }else{
      mask=THREE.MathUtils.smoothstep(z*.65-y*.6,.28,.77);
    }
    const original=new THREE.Color().fromBufferAttribute(col,i),target=kind==='belly'?light:shade;
    original.lerp(target,mask*.94);col.setXYZ(i,original.r,original.g,original.b);
  }
  col.needsUpdate=true;
}

function clovenLeg(c,parent,pos,length,skin,width=.18){
  const leg=c.g('pata_pivote',parent,pos);
  organic(c,leg,'pata_moldeada',[[0,.20,-.016],[0,.06,-.01],[0,-length*.28,.005],[0,-length*.56,.018],[0,-length+.09,.025]], [width*.32,width*.81,width*.71,width*.55,width*.46,width*.40],skin,28,16);
  const foot=c.g('pezuña_pivote',leg,[0,-length+.074,.03]);
  for(const s of [-1,1]){
    caja(foot,c.n('dedo_pezuña'),[width*.48,.135,width*1.25],[s*width*.245,0,.025],C.hoof,.04);
  }
  return leg;
}

function quat(node,times,values){
  const out=[];
  for(const v of values){const e=node.rotation.clone();e.x+=v[0];e.y+=v[1];e.z+=v[2];new THREE.Quaternion().setFromEuler(e).toArray(out,out.length);}
  return new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`,times,out);
}
function scaleTrack(node,times,values){return new THREE.VectorKeyframeTrack(`${node.name}.scale`,times,values.flatMap(v=>[node.scale.x*v[0],node.scale.y*v[1],node.scale.z*v[2]]));}
function posTrack(node,times,values){return new THREE.VectorKeyframeTrack(`${node.name}.position`,times,values.flatMap(v=>[node.position.x+v[0],node.position.y+v[1],node.position.z+v[2]]));}
const ZERO=[0,0,0];

function animate(rig){
  const {body,head,eyes=[],ears=[],legs=[],tail,wings=[],jaw,hop=false}=rig;
  const idleT=[0,1.2,2.4,3.6,4.8],idle=[
    quat(head,idleT,[ZERO,[-.025,.06,-.025],[.012,-.035,.012],[0,-.06,.02],ZERO]),
    scaleTrack(body,idleT,[[1,1,1],[1.006,1.016,1.006],[1,1,1],[1.005,1.013,1.004],[1,1,1]]),
    ...eyes.map(e=>scaleTrack(e,[0,1.68,1.76,1.89,4.1,4.17,4.29,4.8],[[1,1,1],[1,1,1],[1,.035,1],[1,1,1],[1,1,1],[1,.035,1],[1,1,1],[1,1,1]])),
    ...ears.map((e,i)=>quat(e,idleT,[ZERO,[.025,0,(i%2?1:-1)*.045],ZERO,[-.02,0,(i%2?-1:1)*.025],ZERO])),
    ...wings.map((w,i)=>quat(w,idleT,[ZERO,[0,0,(i%2?1:-1)*.035],ZERO,[0,0,(i%2?1:-1)*.055],ZERO])),
  ];
  if(tail)idle.push(quat(tail,idleT,[ZERO,[0,.20,.10],ZERO,[0,-.20,-.10],ZERO]));
  const walkT=[0,.28,.56,.84,1.12],walk=[
    ...legs.map((l,i)=>quat(l,walkT,[ZERO,[(i%2?-1:1)*.33,0,0],ZERO,[(i%2?1:-1)*.33,0,0],ZERO])),
    posTrack(body,walkT,[ZERO,[0,hop?.065:.021,0],ZERO,[0,hop?.065:.021,0],ZERO]),
    quat(head,walkT,[ZERO,[.045,0,.022],ZERO,[-.025,0,-.022],ZERO]),
    ...eyes.map(e=>scaleTrack(e,[0,.7,.77,.88,1.12],[[1,1,1],[1,1,1],[1,.045,1],[1,1,1],[1,1,1]])),
  ];
  if(tail)walk.push(quat(tail,walkT,[ZERO,[0,.15,.14],ZERO,[0,-.15,-.14],ZERO]));
  for(let i=0;i<wings.length;i++)walk.push(quat(wings[i],walkT,[ZERO,[.015,0,(i%2?1:-1)*.09],ZERO,[0,0,(i%2?1:-1)*.09],ZERO]));
  const eatT=[0,.7,1.1,1.45,1.8,2.15,2.55,3.2],eat=[
    quat(head,eatT,[ZERO,[.55,0,0],[.66,.02,0],[.61,-.02,0],[.66,.01,0],[.60,-.015,0],[.55,0,0],ZERO]),
    scaleTrack(body,[0,1.6,3.2],[[1,1,1],[1.008,1.01,1],[1,1,1]]),
    ...eyes.map(e=>scaleTrack(e,[0,.8,1.2,1.35,2.7,3.2],[[1,1,1],[1,.8,1],[1,.8,1],[1,.3,1],[1,.85,1],[1,1,1]])),
  ];
  if(jaw)eat.push(quat(jaw,eatT,[ZERO,ZERO,[.10,0,0],ZERO,[.11,0,0],ZERO,[.06,0,0],ZERO]));
  const petT=[0,.5,1,1.5,2,2.8],pet=[
    quat(head,petT,[ZERO,[-.12,0,.11],[-.08,.03,-.085],[-.14,-.035,.10],[-.07,0,-.08],ZERO]),
    scaleTrack(body,petT,[[1,1,1],[1.006,1.026,1],[1,1.015,1],[1.007,1.023,1],[1,1.011,1],[1,1,1]]),
    ...eyes.map(e=>scaleTrack(e,petT,[[1,1,1],[1,.24,1],[1,.36,1],[1,.20,1],[1,.55,1],[1,1,1]])),
    ...ears.map((e,i)=>quat(e,petT,[ZERO,[.06,0,(i%2?1:-1)*.14],[-.015,0,(i%2?1:-1)*.04],[.07,0,(i%2?1:-1)*.15],ZERO,ZERO])),
    ...wings.map((w,i)=>quat(w,petT,[ZERO,[0,0,(i%2?1:-1)*.22],[0,0,(i%2?1:-1)*.04],[0,0,(i%2?1:-1)*.2],ZERO,ZERO])),
  ];
  if(tail)pet.push(quat(tail,petT,[ZERO,[0,.29,.2],[0,-.22,-.18],[0,.28,.16],[0,-.17,-.12],ZERO]));
  return[new THREE.AnimationClip('reposo',4.8,idle),new THREE.AnimationClip('caminar',1.12,walk),new THREE.AnimationClip('comer',3.2,eat),new THREE.AnimationClip('acariciar',2.8,pet)];
}

function done(c,label,footprint,rig){
  c.root.userData={...c.root.userData,tipo:'animal',frente:'+Z',calidad:'escultura-v2',interacciones:['comer','acariciar']};
  return{id:c.root.name,label,category:'animales',root:c.root,clips:animate(rig),footprint};
}

function vaca(){
  const c=ctx('vaca'),{root,n,g}=c,body=g('torso_respiracion',root,[0,.91,-.13]);
  const coat=ell(c,body,'torso_esculpido',[.97,.91,1.48],[0,0,0],C.milk,36,24,(x,y,z)=>[x*(1+.085*z),y*(1-.065*z),z]);patches(coat,[.97,.91,1.48]);
  ell(c,body,'pecho',[.70,.80,.68],[0,.012,.50],C.milk,24,16);
  organic(c,body,'cuello',[[0,.0,.40],[0,.25,.57],[0,.40,.63]], [.28,.23,.19],C.milk,24,14);
  const legs=[[-.33,.69,.43],[.33,.69,.43],[.33,.69,-.59],[-.33,.69,-.59]].map(p=>clovenLeg(c,root,p,.69,C.milk,.20));
  const head=g('cabeza_pivote',root,[0,1.18,.59]);
  const h=ell(c,head,'craneo_esculpido',[.61,.61,.55],[0,.02,.12],C.milk,30,20,(x,y,z)=>[x*(1+.075*y),y,z*(1-.035*y)]);patches(h,[.61,.61,.55],'cowFace');
  ell(c,head,'puente_nariz',[.36,.37,.33],[0,-.11,.29],C.milk,24,16);
  ell(c,head,'hocico_superior',[.50,.255,.29],[0,-.22,.38],C.pink,28,18);
  const jaw=g('mandibula_pivote',head,[0,-.29,.26]);
  ell(c,jaw,'labio_inferior',[.42,.115,.25],[0,-.003,.09],'#d99487',22,12);
  for(const s of [-1,1]){
    ell(c,head,'narina_hundida',[.083,.052,.025],[s*.132,-.203,.516],'#a2655b',16,10);
    line(c,head,'reborde_nariz',[[s*.175,-.211,.502],[s*.142,-.17,.515],[s*.098,-.197,.51]],C.rose,.009,10);
  }
  line(c,jaw,'sonrisa',[[-.13,-.014,.209],[0,-.032,.226],[.13,-.014,.209]],'#aa7369',.01,16);
  const eyes=face(c,head,.202,.084,.353,1.04);
  const ears=[-1,1].map(s=>ear(c,head,[s*.25,.15,.03],.32,.18,C.milk,C.pink,[0,s*.12,-s*1.04],-.035));
  for(const s of [-1,1]){
    organic(c,head,'cuerno_curvado',[[s*.18,.24,.012],[s*.22,.34,-.015],[s*.24,.43,-.035],[s*.20,.49,-.019]], [.062,.05,.031,0],'#dec99e',22,12);
  }
  for(let i=0;i<5;i++){
    const lock=petal(c,head,'flequillo',.20,.10,.045,[(i-2)*.055,.18,.33],i%2?'#b78e62':'#c69b6d',.012,10,10);lock.rotation.z=Math.PI+(i-2)*.1;
  }
  const tail=g('cola_pivote',root,[0,1.06,-.83]);
  organic(c,tail,'cola_curva',[[0,0,0],[.01,-.16,-.08],[.035,-.38,-.1],[.03,-.56,-.065]],[.027,.025,.023,.023],C.milk,26,9);
  for(let i=0;i<5;i++)organic(c,tail,'borla_cola',[[.03+(i-2)*.012,-.50,-.067],[.03+(i-2)*.022,-.62,-.05],[.035+(i-2)*.015,-.67,-.025]],[.025,.025,.002],C.cocoa,12,7);
  ell(c,body,'ubre',[.37,.21,.40],[0,-.40,-.30],C.pink,22,14);
  for(const x of [-.09,.09])for(const z of [-.20,-.39])organic(c,body,'pezon',[[x,-.43,z],[x,-.51,z],[x,-.54,z]],[.032,.027,.002],C.rose,10,8);
  const collar=toro(body,n('collar'),.222,.025,[0,.12,.57],'#91aa87');collar.rotation.x=Math.PI/2;collar.scale.set(1,.83,1);
  organic(c,body,'presilla_cencerro',[[0,.105,.785],[0,-.04,.82],[0,-.11,.85]],[.014,.013,.013],'#91aa87',12,6);
  ell(c,body,'cencerro',[.115,.13,.075],[0,-.17,.85],C.gold,16,12).material=material('#ffffff','metal');
  line(c,body,'ranura_cencerro',[[-.036,-.209,.89],[0,-.212,.893],[.036,-.209,.89]],'#947141',.008,8);
  return done(c,'Vaca · caramelo y crema',[1.08,1.92],{body,head,eyes,ears,tail,legs,jaw});
}

function oveja(){
  const c=ctx('oveja'),{root,g}=c,body=g('torso_respiracion',root,[0,.79,-.09]);
  ell(c,body,'subcapa_lana',[.89,.73,1.14],[0,0,0],C.woolShade,28,16);
  const phi=Math.PI*(3-Math.sqrt(5));let locks=0;
  for(let i=0;i<64;i++){
    const y=1-i/63*2;if(y<-.58)continue;
    const r=Math.sqrt(1-y*y),a=i*phi,x=Math.cos(a)*r,z=Math.sin(a)*r,s=.24+Math.sin(i*3.7)*.025;
    const lock=ell(c,body,'bucle_lana',[s*1.1,s*.92,s*1.18],[x*.399,y*.322,z*.511],i%7===0?'#eee1c9':C.wool,12,8,(x0,y0,z0)=>[x0*(1+y0*.1),y0,z0]);
    lock.rotation.set(Math.sin(i)*.22,a,Math.cos(i)*.23);locks++;
  }
  body.userData.mechones=locks;
  const legs=[[-.26,.49,.27],[.26,.49,.27],[.26,.49,-.43],[-.26,.49,-.43]].map(p=>clovenLeg(c,root,p,.49,C.sheep,.15));
  const head=g('cabeza_pivote',root,[0,.93,.45]);
  ell(c,head,'cara_aterciopelada',[.41,.53,.42],[0,-.03,.095],C.sheep,28,20,(x,y,z)=>[x*(1+y*.12),y,z]);
  ell(c,head,'morro',[.28,.19,.18],[0,-.205,.238],'#a9876c',22,14);
  const eyes=face(c,head,.131,.027,.279,.85);
  const ears=[-1,1].map(s=>ear(c,head,[s*.18,.13,-.01],.34,.145,C.sheep,'#c99a83',[.12,s*.18,-s*1.13],.05));
  for(let i=0;i<8;i++)ell(c,head,'rizo_flequillo',[.15,.14,.155],[Math.sin(i*2.4)*.15,.209+Math.cos(i*2.4)*.043,.08+(i%3)*.073],C.wool,12,8);
  ell(c,head,'nariz',[.10,.063,.051],[0,-.16,.326],C.cocoa,16,12);
  line(c,head,'filtrum',[[0,-.186,.333],[0,-.22,.331],[0,-.228,.327]],C.cocoa,.008,10);
  const jaw=g('mandibula_pivote',head,[0,-.24,.19]);
  line(c,jaw,'sonrisa',[[-.069,.009,.117],[0,-.008,.137],[.069,.009,.117]],C.cocoa,.009,14);
  const tail=g('cola_pivote',root,[0,.78,-.66]);
  for(let i=0;i<3;i++)ell(c,tail,'lana_cola',[.17,.17,.18],[Math.sin(i*2.2)*.055,-i*.043,-.03-i*.037],C.wool,14,9);
  return done(c,'Oveja · vellón de algodón',[1.10,1.55],{body,head,eyes,ears,tail,legs,jaw});
}

function cerdito(){
  const c=ctx('cerdito'),{root,g,n}=c,body=g('torso_respiracion',root,[0,.61,-.1]);
  ell(c,body,'torso_redondeado',[.86,.74,1.09],[0,0,0],C.pig,32,22,(x,y,z)=>[x*(1-z*.035),y,z]);
  for(const s of [-1,1])ell(c,body,'anca',[.42,.47,.54],[s*.25,-.035,-.24],C.pig,24,16);
  const legs=[[-.25,.36,.30],[.25,.36,.30],[.25,.36,-.43],[-.25,.36,-.43]].map(p=>clovenLeg(c,root,p,.36,C.pig,.18));
  const head=g('cabeza_pivote',root,[0,.75,.36]);
  ell(c,head,'craneo',[.62,.53,.54],[0,.018,.10],C.pig,32,22,(x,y,z)=>[x*(1+y*.065),y,z]);
  ell(c,head,'puente_hocico',[.43,.27,.29],[0,-.064,.30],C.pigLight,24,16);
  ell(c,head,'disco_nariz',[.36,.23,.123],[0,-.076,.425],'#e39b91',28,18);
  const rim=toro(head,n('borde_hocico'),.122,.018,[0,-.076,.459],'#ecb0a2');rim.scale.set(1.43,.94,.68);
  for(const s of [-1,1]){
    ell(c,head,'narina',[.048,.067,.022],[s*.073,-.067,.487],'#9d625c',16,12);
    ell(c,head,'mejilla',[.135,.073,.039],[s*.237,-.086,.296],'#df948a',16,10);
  }
  const eyes=face(c,head,.185,.115,.329,.96);
  const ears=[-1,1].map(s=>ear(c,head,[s*.212,.229,.026],.285,.19,C.pig,C.rose,[.06,s*.14,-s*.43],.093));
  const jaw=g('mandibula_pivote',head,[0,-.211,.253]);
  ell(c,jaw,'menton',[.29,.089,.15],[0,0,.054],C.pigLight,22,12);
  line(c,jaw,'sonrisa',[[-.10,.02,.11],[0,-.008,.126],[.10,.02,.11]],'#b7726b',.01,16);
  const tail=g('cola_pivote',root,[0,.72,-.64]),points=[[0,0,0],[0,.018,-.06]];
  for(let i=0;i<=24;i++){const t=i/24,a=-Math.PI/2+t*Math.PI*3.4,r=.074-t*.029;points.push([Math.cos(a)*r,.074+Math.sin(a)*r,-.085-t*.105]);}
  organic(c,tail,'queue_en_tire_bouchon',points,[.026,.024,.020,.004],C.pink,42,10);
  return done(c,'Cerdito · mejillas de melocotón',[1.02,1.60],{body,head,eyes,ears,tail,legs,jaw});
}

function rabbitLeg(c,parent,pos,length,hind=false){
  const leg=c.g('pata_pivote',parent,pos),w=hind?.19:.13;
  organic(c,leg,'pata_suave',[[0,.05,-.025],[0,-length*.38,0],[0,-length+.105,.035]],[w*.77,w*.66,w*.40],C.rabbit,18,12);
  ell(c,leg,'pie',[w,.13,hind?.36:.24],[0,-length+.073,hind?.105:.071],C.ivory,22,14);
  for(const s of [-1,1])line(c,leg,'dedito',[[s*w*.19,-length+.135,.113],[s*w*.19,-length+.12,.17],[s*w*.19,-length+.097,hind?.253:.17]],'#b6977f',.006,8);
  return leg;
}

function conejo(){
  const c=ctx('conejo'),{root,g}=c,body=g('torso_respiracion',root,[0,.46,-.13]);
  const coat=ell(c,body,'cuerpo_aterciopelado',[.66,.70,.85],[0,0,0],C.rabbit,32,22,(x,y,z)=>[x*(1-z*.10),y,z]);patches(coat,[.66,.70,.85],'belly');
  for(const s of [-1,1])ell(c,body,'anca_redonda',[.39,.43,.50],[s*.19,-.087,-.15],C.rabbit,24,16);
  const legs=[rabbitLeg(c,root,[-.175,.36,.21],.36),rabbitLeg(c,root,[.175,.36,.21],.36),rabbitLeg(c,root,[.218,.34,-.35],.34,true),rabbitLeg(c,root,[-.218,.34,-.35],.34,true)];
  const head=g('cabeza_pivote',root,[0,.78,.24]);
  ell(c,head,'craneo',[.49,.47,.44],[0,.015,.055],C.rabbit,30,20,(x,y,z)=>[x*(1-y*.06),y,z]);
  const eyes=face(c,head,.16,.079,.251,1.0);
  const ears=[ear(c,head,[-.119,.19,-.025],.65,.17,C.rabbit,'#d29c91',[0,-.08,.12],-.07),ear(c,head,[.119,.19,-.025],.61,.17,C.rabbit,'#d29c91',[.10,.08,-.20],.065)];
  for(const s of [-1,1])ell(c,head,'almohadilla_bigote',[.184,.142,.135],[s*.084,-.117,.257],C.cream,22,14);
  ell(c,head,'nariz_corazon',[.074,.049,.043],[0,-.082,.328],'#c48b85',16,12);
  const jaw=g('mandibula_pivote',head,[0,-.179,.215]);
  ell(c,jaw,'barbilla',[.17,.066,.103],[0,0,.038],C.ivory,18,12);
  caja(jaw,c.n('diente'),[.044,.043,.023],[0,-.004,.097],C.cream,.008);
  line(c,head,'filtrum',[[0,-.10,.335],[0,-.143,.328],[0,-.158,.319]],'#8f6c5b',.007,10);
  for(const s of [-1,1]){
    line(c,head,'sonrisa',[[0,-.15,.326],[s*.04,-.164,.32],[s*.074,-.146,.311]],'#8f6c5b',.007,12);
    for(let i=0;i<2;i++)line(c,head,'bigote',[[s*.11,-.107-i*.035,.30],[s*.24,-.095-i*.046,.30],[s*.31,-.075-i*.055,.27]],'#a28970',.0035,12);
  }
  const tail=g('cola_pivote',root,[0,.49,-.57]);
  ell(c,tail,'pompon',[.235,.24,.25],[0,0,-.027],C.cream,24,18);
  for(let i=0;i<5;i++)ell(c,tail,'pelusa',[.10,.10,.105],[Math.sin(i*2.4)*.07,Math.cos(i*2.4)*.08,-.106],C.cream,10,7);
  return done(c,'Conejo · orejas de terciopelo',[.89,1.34],{body,head,eyes,ears,tail,legs,jaw,hop:true});
}

function birdLeg(c,parent,pos,length,duck=false){
  const leg=c.g('pata_pivote',parent,pos);
  organic(c,leg,'caña',[[0,.015,0],[0,-length*.49,-.018],[0,-length+.037,.018]],[.036,.027,.034],C.orange,18,10);
  if(duck){
    const shape=new THREE.Shape();shape.moveTo(-.03,-.025);shape.quadraticCurveTo(-.067,.02,-.10,.12);shape.quadraticCurveTo(-.073,.16,-.024,.12);shape.quadraticCurveTo(.008,.17,.036,.12);shape.quadraticCurveTo(.08,.145,.11,.105);shape.quadraticCurveTo(.065,.045,.036,-.024);shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,steps:1,curveSegments:6});geo.rotateX(Math.PI/2);
    malla(leg,c.n('pie_palmeado'),geo,[0,-length+.049,.02],C.orange);
    for(const x of [-.05,.0,.05])line(c,leg,'nervio_membrana',[[0,-length+.051,.028],[x*.4,-length+.051,.09],[x,-length+.045,.14]],'#c98950',.006,9);
  }else{
    for(const s of [-1,0,1]){
      organic(c,leg,'dedo',[[0,-length+.041,.005],[s*.045,-length+.025,.067],[s*.068,-length+.022,.124]], [.018,.016,.008],C.orange,14,8);
      ell(c,leg,'uña',[.020,.015,.028],[s*.068,-length+.025,.136],'#dfc49a',10,7);
    }
    organic(c,leg,'espolon',[[0,-length+.045,-.007],[.01,-length+.025,-.055],[.013,-length+.021,-.072]],[.014,.012,.003],C.orange,12,8);
    for(let i=0;i<3;i++)line(c,leg,'anillo_pata',[[-.022,-length*.3-i*.03,.014],[0,-length*.3-i*.03,.025],[.023,-length*.3-i*.03,.014]],'#c08345',.005,8);
  }
  return leg;
}

function wings(c,parent,width,y,z,duck=false){
  return[-1,1].map(s=>{
    const wing=c.g('ala_pivote',parent,[s*width,y,z]);wing.rotation.set(.16,0,-s*.04);
    const surface=ell(c,wing,'ala_hombro',[.15,.36,duck?.44:.38],[s*.016,-.068,-.04],duck?C.ivory:'#e7cfa7',24,16);surface.rotation.x=-.25;
    for(let i=0;i<7;i++){
      const feather=petal(c,wing,'pluma_cobertora',.21+(i%3)*.023,.076,.04,[s*.044,-.01-(i%3)*.035,.105-i*.044],duck?(i%2?C.ivory:'#e7ddc9'):(i%2?'#f3deb8':'#e8cfa4'),.024,10,10);
      feather.rotation.set(Math.PI+.48,0,s*.12);
    }
    return wing;
  });
}

function gallina(){
  const c=ctx('gallina'),{root,g}=c,body=g('torso_respiracion',root,[0,.50,-.065]);
  ell(c,body,'cuerpo_plumon',[.55,.58,.72],[0,0,0],C.hen,32,22,(x,y,z)=>[x*(1-y*.1),y,z]);
  ell(c,body,'pechuga',[.43,.49,.39],[0,.035,.235],C.cream,24,18);
  const wingNodes=wings(c,body,.245,.11,.015,false);
  const tail=g('cola_pivote',root,[0,.63,-.34]);
  for(let i=0;i<7;i++){
    const feather=petal(c,tail,'pluma_caudal',.34+(.035*(3-Math.abs(i-3))),.105,.055,[(i-3)*.037,0,-Math.abs(i-3)*.005],i%2?C.rust:'#d5b47b',.045,12,14);
    feather.rotation.set(-.84-(i%2)*.05,0,(i-3)*-.17);
  }
  const legs=[-1,1].map(s=>birdLeg(c,root,[s*.12,.29,.045],.29));
  const head=g('cabeza_pivote',root,[0,.84,.255]);
  ell(c,head,'cabeza',[.34,.40,.34],[0,.025,.017],C.cream,28,20);
  for(let i=0;i<6;i++){
    const feather=petal(c,head,'pluma_cuello',.17,.075,.035,[(i-2.5)*.042,-.115,.045],i%2?C.hen:C.cream,.012,8,9);feather.rotation.set(Math.PI-.18,0,(i-2.5)*.09);
  }
  const eyes=face(c,head,.115,.073,.151,.76);
  const jaw=g('mandibula_pivote',head,[0,-.041,.177]);
  ell(c,jaw,'pico_inferior',[.135,.046,.16],[0,-.009,.056],'#c98c4c',22,12);
  organic(c,head,'pico_superior',[[0,-.014,.148],[0,-.016,.222],[0,-.035,.312]],[.068,.054,0],C.orange,20,12,.75);
  line(c,head,'linea_pico',[[-.048,-.035,.214],[0,-.042,.29],[.048,-.035,.214]],'#a86f3d',.005,12);
  for(const s of [-1,1])ell(c,head,'narina',[.019,.012,.01],[s*.029,-.006,.24],'#a86f3d',10,6);
  for(let i=0;i<5;i++)ell(c,head,'cresta',[.079,.106+(i%2)*.022,.083],[0,.209+Math.sin(i/4*Math.PI)*.026,-.10+i*.052],C.red,18,12);
  for(const s of [-1,1])ell(c,head,'barbilla',[.066,.105,.048],[s*.028,-.108,.16],C.red,18,12);
  const ears=[];
  return done(c,'Gallina · plumas de vainilla',[.77,1.22],{body,head,eyes,ears,tail,legs,jaw,wings:wingNodes});
}

function pato(){
  const c=ctx('pato'),{root,g}=c,body=g('torso_respiracion',root,[0,.36,-.11]);
  ell(c,body,'cuerpo_ovalado',[.57,.49,.85],[0,0,0],C.ivory,32,22,(x,y,z)=>[x*(1+.11*z),y,z]);
  organic(c,body,'cuello_curvado',[[0,.02,.26],[0,.19,.31],[0,.33,.35]],[.19,.137,.14],C.ivory,24,16);
  const wingNodes=wings(c,body,.25,.06,-.05,true);
  const tail=g('cola_pivote',root,[0,.40,-.48]);
  for(let i=0;i<5;i++){
    const feather=petal(c,tail,'pluma_caudal',.24,.09,.04,[(i-2)*.035,0,0],i%2?'#e2d8c3':C.ivory,.035,12,12);feather.rotation.set(-1.15,0,(i-2)*-.1);
  }
  const legs=[-1,1].map(s=>birdLeg(c,root,[s*.13,.18,.055],.18,true));
  const head=g('cabeza_pivote',root,[0,.70,.25]);
  ell(c,head,'cabeza',[.39,.37,.36],[0,.02,.07],C.ivory,28,20);
  const eyes=face(c,head,.135,.075,.222,.78);
  const jaw=g('mandibula_pivote',head,[0,-.082,.205]);
  ell(c,jaw,'pico_inferior',[.27,.045,.25],[0,-.01,.095],'#ce8849',24,14);
  ell(c,head,'pico_ancho',[.30,.091,.28],[0,-.056,.315],C.orange,28,16,(x,y,z)=>[x*(1+z*.10),y,z]);
  for(const s of [-1,1])ell(c,head,'narina',[.033,.012,.026],[s*.071,-.011,.30],'#a47143',12,8);
  line(c,head,'sonrisa_pico',[[-.123,-.074,.34],[0,-.083,.449],[.123,-.074,.34]],'#a6703f',.006,20);
  for(const s of [-1,1])ell(c,head,'mejilla',[.088,.043,.017],[s*.157,-.026,.208],'#e7bdb0',14,9);
  for(let i=0;i<3;i++){
    const tuft=petal(c,head,'mechon_corona',.113,.06,.032,[(i-1)*.037,.18,.038],C.cream,-.035,10,10);tuft.rotation.z=(i-1)*-.19;
  }
  return done(c,'Pato · plumón de crema',[.80,1.29],{body,head,eyes,ears:[],tail,legs,jaw,wings:wingNodes});
}

export function crearAnimales(){return[vaca(),oveja(),cerdito(),gallina(),conejo(),pato()];}
