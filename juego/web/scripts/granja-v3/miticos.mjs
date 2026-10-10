import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { grupo, malla, material, caja } from '../granja-v2/formas.mjs';

// Three new, original clay creatures. Metres, +Z forward, Y=0 ground.
// Animation pivots and sculpted surfaces use the same contract as the V2 herd.
const P = { cream:'#f4ead7', white:'#fff5e6', cocoa:'#826144', dark:'#39313d', gold:'#dcb16b', pink:'#d8a0b7', lilac:'#ac9bc9', mint:'#a7caba', blue:'#95b9c7' };
function ctx(id) { let k=0;const root=grupo(id);return {root,n:s=>`${id}_${s}_${k++}`,g(s,p=root,pos=[0,0,0]) { return grupo(`${id}_${s}_${k++}`,p,pos); }}; }
function smooth(geo) { geo.deleteAttribute('normal');geo.deleteAttribute('uv');const g=mergeVertices(geo,1e-5);g.computeVertexNormals();geo.dispose();return g; }
function ell(c,p,n,size,pos,color,segments=18,rings=12) {
  const g=new THREE.SphereGeometry(1,segments,rings);g.scale(size[0]/2,size[1]/2,size[2]/2);return malla(p,c.n(n),smooth(g),pos,color);
}
function curve(c,p,n,points,radii,color,segments=18,radial=8,flat=1) {
  const path=new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),frame=path.computeFrenetFrames(segments,false),v=[],idx=[];
  for(let i=0;i<=segments;i++) {const t=i/segments,f=t*(radii.length-1),k=Math.min(radii.length-2,Math.floor(f)),u=f-k,r=THREE.MathUtils.lerp(radii[k],radii[k+1],u*u*(3-2*u)),cp=path.getPointAt(t);
    for(let j=0;j<=radial;j++) {const a=j/radial*Math.PI*2,q=cp.clone().addScaledVector(frame.normals[i],Math.cos(a)*r).addScaledVector(frame.binormals[i],Math.sin(a)*r*flat);v.push(q.x,q.y,q.z);if(i<segments&&j<radial){const a=i*(radial+1)+j,b=a+radial+1;idx.push(a,a+1,b,b,a+1,b+1);}}
  }
  for(const end of [0,1]) {const cp=path.getPointAt(end),center=v.length/3;v.push(cp.x,cp.y,cp.z);const a=end*segments*(radial+1);for(let j=0;j<radial;j++)idx.push(...(end?[center,a+j,a+j+1]:[center,a+j+1,a+j]));}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);return malla(p,c.n(n),smooth(g),[0,0,0],color);
}
function feather(c,p,n,base,tip,width,color,bend=.03) {
  const av=new THREE.Vector3(...base),bv=new THREE.Vector3(...tip),axis=bv.clone().sub(av).normalize();
  let side=new THREE.Vector3(0,1,0).cross(axis);if(side.lengthSq()<.08)side.set(1,0,0);side.normalize();
  const depth=axis.clone().cross(side).normalize(),v=[],idx=[],rows=12,rings=8;
  for(let i=0;i<=rows;i++){const t=i/rows,cp=av.clone().lerp(bv,t);cp.z+=Math.sin(t*Math.PI)*bend;const r=Math.pow(Math.sin(t*Math.PI),.70)*width;
    for(let j=0;j<=rings;j++){const a=j/rings*Math.PI*2,q=cp.clone().addScaledVector(side,Math.cos(a)*r).addScaledVector(depth,Math.sin(a)*r*.27);v.push(q.x,q.y,q.z);if(i<rows&&j<rings){const a0=i*(rings+1)+j,b0=a0+rings+1;idx.push(a0,a0+1,b0,b0,a0+1,b0+1);}}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(idx);return malla(p,c.n(n),smooth(geo),[0,0,0],color);
}
function eye(c,p,pos,size=1,skin=P.cream) {
  const g=c.g('ojo_parpado_pivote',p,pos);
  ell(c,g,'esclerotica',[.108*size,.141*size,.042*size],[0,0,0],P.white,14,9);
  ell(c,g,'iris',[.079*size,.107*size,.027*size],[0,-.004*size,.024*size],'#66567d',14,10).material=material('#ffffff','eye');
  ell(c,g,'pupila',[.047*size,.075*size,.014*size],[0,-.003*size,.04*size],P.dark,12,8).material=material('#ffffff','eye');
  ell(c,g,'destello',[.022*size,.025*size,.009*size],[-.018*size,.027*size,.048*size],P.white,8,6);
  curve(c,p,'ceja',[[pos[0]-.042*size,pos[1]+.10*size,pos[2]],[pos[0],pos[1]+.118*size,pos[2]+.018*size],[pos[0]+.043*size,pos[1]+.096*size,pos[2]]],[.005,.010,.003],skin,10,5);
  return g;
}
function hoof(c,root,pos,length,skin,hoofColor=P.gold,width=.14) {
  const leg=c.g('pata_pivote',root,pos);
  curve(c,leg,'pata_esculpida',[[0,.30,0],[0,.06,0],[0,-length*.28,-.018],[0,-length*.67,.018],[0,-length+.095,.025]],[.022,width*.74,width*.58,width*.36,width*.46],skin,20,9);
  caja(leg,c.n('casco'),[width*1.10,.16,width*1.37],[0,-length+.08,.035],hoofColor,.05);
  return leg;
}
function quat(node,times,values) { const out=[];for(const d of values){const e=node.rotation.clone();e.x+=d[0];e.y+=d[1];e.z+=d[2];new THREE.Quaternion().setFromEuler(e).toArray(out,out.length);}return new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`,times,out); }
function scale(node,times,values) {return new THREE.VectorKeyframeTrack(`${node.name}.scale`,times,values.flatMap(d=>[node.scale.x*d[0],node.scale.y*d[1],node.scale.z*d[2]]));}
function position(node,times,values) {return new THREE.VectorKeyframeTrack(`${node.name}.position`,times,values.flatMap(d=>[node.position.x+d[0],node.position.y+d[1],node.position.z+d[2]]));}
const Z=[0,0,0];
function animations({body,head,legs,eyes,tail,ears=[],wings=[]}) {
  const idleT=[0,1.2,2.4,3.6,4.8],walkT=[0,.28,.56,.84,1.12],petT=[0,.55,1.1,1.65,2.2,2.8];
  const blink=eyes.map(e=>scale(e,[0,1.75,1.84,1.97,4.8],[[1,1,1],[1,1,1],[1,.04,1],[1,1,1],[1,1,1]]));
  const idle=[...blink,scale(body,idleT,[[1,1,1],[1.006,1.014,1.003],[1,1,1],[1.008,1.015,1.004],[1,1,1]]),quat(head,idleT,[Z,[-.025,.04,-.02],[.012,-.02,.01],[0,-.05,.02],Z]),quat(tail,idleT,[Z,[0,.18,.03],Z,[0,-.18,-.03],Z]),...ears.map((e,i)=>quat(e,idleT,[Z,[.025,0,(i%2?1:-1)*.07],Z,[-.02,0,(i%2?-1:1)*.05],Z])),...wings.map((w,i)=>quat(w,idleT,[Z,[.025,0,(i%2?1:-1)*.035],Z,[0,0,(i%2?-1:1)*.02],Z]))];
  const walk=[...legs.map((l,i)=>quat(l,walkT,[Z,[(i%2?1:-1)*.32,0,0],Z,[(i%2?-1:1)*.32,0,0],Z])),position(body,walkT,[Z,[0,.024,0],Z,[0,.024,0],Z]),quat(head,walkT,[Z,[.04,0,.02],Z,[-.03,0,-.02],Z]),quat(tail,walkT,[Z,[0,.19,.05],Z,[0,-.19,-.05],Z]),...wings.map((w,i)=>quat(w,walkT,[Z,[0,0,(i%2?1:-1)*.09],Z,[0,0,(i%2?-1:1)*.025],Z]))];
  const eat=[quat(head,[0,.7,1.2,1.7,2.2,2.65,3.2],[Z,[.45,0,0],[.55,.02,0],[.48,-.02,0],[.56,.01,0],[.44,0,0],Z]),...eyes.map(e=>scale(e,[0,.7,1.2,2.4,3.2],[[1,1,1],[1,.8,1],[1,.25,1],[1,.8,1],[1,1,1]])),scale(body,[0,1.6,3.2],[[1,1,1],[1.007,1.012,1],[1,1,1]])];
  const pet=[quat(head,petT,[Z,[-.10,.04,.09],[-.08,-.03,-.07],[-.13,.02,.08],[-.06,0,-.04],Z]),...eyes.map(e=>scale(e,petT,[[1,1,1],[1,.23,1],[1,.36,1],[1,.21,1],[1,.60,1],[1,1,1]])),quat(tail,petT,[Z,[0,.28,.09],[0,-.22,-.06],[0,.29,.08],[0,-.17,-.03],Z]),...wings.map((w,i)=>quat(w,petT,[Z,[0,0,(i%2?1:-1)*.24],[0,0,(i%2?1:-1)*.06],[0,0,(i%2?1:-1)*.22],[0,0,(i%2?1:-1)*.06],Z])),...ears.map((e,i)=>quat(e,petT,[Z,[.08,0,(i%2?1:-1)*.13],Z,[.06,0,(i%2?1:-1)*.13],Z,Z]))];
  return [new THREE.AnimationClip('reposo',4.8,idle),new THREE.AnimationClip('caminar',1.12,walk),new THREE.AnimationClip('comer',3.2,eat),new THREE.AnimationClip('acariciar',2.8,pet)];
}
function finish(c,label,footprint,rig,habitat) {c.root.userData={tipo:'animal',frente:'+Z',calidad:'escultura-v3',habitat,interacciones:['comer','acariciar'],mitico:true};return {id:c.root.name,label,category:'animales',root:c.root,clips:animations(rig),footprint};}

function unicornio() {
  const c=ctx('unicornio'),{root}=c,body=c.g('torso_respiracion',root,[0,.97,-.12]);
  ell(c,body,'torso_equino',[.65,.68,1.18],[0,0,0],P.cream,24,16);
  ell(c,body,'pecho',[.51,.64,.56],[0,.02,.42],P.white,18,12);
  for(const s of [-1,1])ell(c,body,'anca',[.31,.46,.46],[s*.19,-.02,-.40],P.cream,16,10);
  curve(c,body,'cuello_arqueado',[[0,.05,.37],[0,.35,.50],[0,.56,.60],[0,.63,.64]],[.22,.20,.16,.13],P.cream,22,12,.86);
  const legs=[[-.20,.76,.24],[.20,.76,.24],[.21,.74,-.46],[-.21,.74,-.46]].map(p=>hoof(c,root,p,p[1],P.cream,P.gold,.15));
  const head=c.g('cabeza_pivote',root,[0,1.58,.51]);
  ell(c,head,'craneo',[.39,.44,.45],[0,.035,.12],P.cream,22,14);
  curve(c,head,'rostro_alargado',[[0,.04,.20],[0,-.10,.38],[0,-.16,.51]],[.18,.15,.125],P.cream,20,12,.92);
  ell(c,head,'morro',[.28,.21,.22],[0,-.15,.50],'#e7d7c3',18,12);
  for(const s of [-1,1]) {ell(c,head,'narina',[.032,.05,.012],[s*.088,-.13,.597],'#b09280',10,8);}
  curve(c,head,'sonrisa',[[-.083,-.215,.561],[0,-.232,.583],[.083,-.215,.561]],[.004,.007,.003],P.cocoa,10,5);
  const eyes=[-1,1].map(s=>eye(c,head,[s*.145,.08,.278],.86,P.cream));
  const ears=[-1,1].map(s=>{const g=c.g('oreja_pivote',head,[s*.125,.16,.02]);g.rotation.z=-s*.15;feather(c,g,'oreja',[0,0,0],[0,.27,.025],.066,P.cream);feather(c,g,'interior_oreja',[0,.04,.025],[0,.23,.047],.036,P.pink);return g;});
  curve(c,head,'cuerno_espiral',[[0,.20,.13],[0,.36,.12],[0,.53,.10],[0,.65,.07]],[.058,.044,.025,0],P.gold,22,10);
  const spiral=[];for(let i=0;i<64;i++){const t=i/63,a=t*Math.PI*9,r=.058*(1-t)+.002;spiral.push([Math.cos(a)*r,.21+t*.42,.132-t*.055+Math.sin(a)*r]);}curve(c,head,'estrias_cuerno',spiral,[.009,.007,.003],P.white,60,5);
  // Long swept clay locks overlap naturally along the neck and follow its curve.
  for(let i=0;i<6;i++) {
    const color=[P.lilac,P.pink,P.mint][i%3],x=-.10+i*.04;
    curve(c,body,'crin_ondulada',[[x,.70,.42],[x-.03,.50,.30],[x-.12,.28,.29],[x-.16,.10,.19],[x-.14,-.03,.03]],[.047,.051,.043,.034,.001],color,24,8);
  }
  for(let i=0;i<4;i++)curve(c,head,'flequillo',[[.10-i*.053,.25,.13],[.065-i*.042,.16,.29],[.11-i*.05,.08,.30]],[.036,.04,.001],[P.pink,P.lilac,P.mint,P.lilac][i],14,7);
  const tail=c.g('cola_pivote',root,[0,1.00,-.73]);
  for(let i=0;i<5;i++) {const x=(i-2)*.038;curve(c,tail,'cola_sedosa',[[x,0,0],[x+.04,-.10,-.19],[x+.12,-.39,-.24],[x+.20,-.70,-.12],[x+.14,-.81,.03]],[.047,.055,.05,.036,.001],[P.pink,P.mint,P.lilac,P.pink,P.lilac][i],25,8);}
  for(const s of [-1,1]) {
    const star=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.026:.061;i?star.lineTo(Math.cos(a)*r,Math.sin(a)*r):star.moveTo(Math.cos(a)*r,Math.sin(a)*r);}star.closePath();
    const geo=new THREE.ExtrudeGeometry(star,{depth:.012,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:1,steps:1});geo.rotateY(s*Math.PI/2);malla(body,c.n('estrella_del_costado'),geo,[s*.311,.08,-.28],P.gold);
  }
  return finish(c,'Unicornio · crin de amanecer',[.95,2.25],{body,head,eyes,ears,legs,tail},'pradera_luminosa');
}

function dragonWing(c,parent,side) {
  const wing=c.g('ala_pivote',parent,[side*.32,.25,-.06]);
  const vertices=[[0,0,0],[side*.30,.40,-.08],[side*.82,.63,-.16],[side*.95,.17,-.03],[side*.72,.05,.08],[side*.55,-.10,.24],[side*.33,-.20,.31],[side*.08,-.18,.20]];
  const center=[side*.39,.16,.065],v=[...center],idx=[];for(const p of vertices)v.push(...p);
  // A closed double-sided membrane with softly raised centre.
  const back=v.length/3;v.push(center[0],center[1],center[2]-.035);for(const p of vertices)v.push(p[0],p[1],p[2]-.025);
  for(let i=0;i<vertices.length;i++){const a=i+1,b=(i+1)%vertices.length+1;if(side>0){idx.push(0,a,b,back,back+b,back+a,a,back+a,b,b,back+a,back+b);}else{idx.push(0,b,a,back,back+a,back+b,a,b,back+a,b,back+b,back+a);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();malla(wing,c.n('membrana_suave'),geo,[0,0,0],'#c3aec9');
  curve(c,wing,'brazo_alado',[[0,0,0],[side*.30,.40,-.08],[side*.82,.63,-.16]],[.05,.035,.004],P.mint,16,8);
  for(const tip of [vertices[3],vertices[5],vertices[6]])curve(c,wing,'nervadura',[[side*.30,.40,-.08],[(side*.30+tip[0])*.55,(.4+tip[1])*.49,(tip[2]-.08)*.5],tip],[.025,.020,.004],'#8eafab',12,6);
  curve(c,wing,'borde_membrana',vertices.slice(2),[.009,.012,.01],P.lilac,24,5);return wing;
}
function dragon() {
  const c=ctx('dragon'),{root}=c,body=c.g('torso_respiracion',root,[0,.72,-.12]);
  ell(c,body,'cuerpo_pera',[.91,.90,1.22],[0,0,0],'#9abfae',24,16);
  ell(c,body,'pecho_crema',[.58,.71,.25],[0,-.03,.54],'#ead8af',20,14);
  for(let i=0;i<5;i++) {const y=.25-i*.13;curve(c,body,'placa_ventral',[[-.21,y,.615],[0,y-.035,.667],[.21,y,.615]],[.009,.014,.007],'#d6c49c',14,6);}
  const legs=[];
  for(const p of [[-.29,.42,.23],[.29,.42,.23],[.31,.40,-.45],[-.31,.40,-.45]]) {
    const leg=c.g('pata_pivote',root,p);curve(c,leg,'pata_gordita',[[0,.40,-.03],[0,.16,0],[0,-.05,.018],[0,-p[1]+.13,.052]],[.025,.13,.11,.07],'#9abfae',20,10);
    ell(c,leg,'pie',[.25,.18,.32],[0,-p[1]+.1,.12],'#9abfae',16,10);
    for(const s of [-1,0,1])curve(c,leg,'garra',[[s*.072,-p[1]+.105,.245],[s*.08,-p[1]+.09,.30]],[.025,0],P.cream,8,6);legs.push(leg);
  }
  const head=c.g('cabeza_pivote',root,[0,1.19,.45]);
  ell(c,head,'craneo',[.70,.57,.57],[0,.015,.065],P.mint,24,16);
  ell(c,head,'morro_ancho',[.59,.26,.39],[0,-.13,.30],'#b6ccae',20,14);
  for(const s of [-1,1]) {ell(c,head,'narina',[.054,.032,.022],[s*.16,-.063,.452],'#6d948a',12,8);ell(c,head,'mejilla',[.14,.065,.025],[s*.278,-.074,.263],P.pink,12,8);}
  const eyes=[-1,1].map(s=>eye(c,head,[s*.237,.085,.29],1.1,P.mint));
  curve(c,head,'sonrisa',[[-.16,-.20,.430],[0,-.224,.484],[.16,-.20,.430]],[.006,.009,.004],'#7c9e91',12,6);
  for(const s of [-1,1]) {curve(c,head,'cuerno_curvo',[[s*.235,.23,-.055],[s*.32,.35,-.12],[s*.34,.48,-.21],[s*.28,.53,-.25]],[.08,.060,.034,0],P.cream,18,9);}
  const ears=[-1,1].map(s=>{const ear=c.g('aleta_oreja_pivote',head,[s*.27,.08,-.045]);for(let i=0;i<3;i++)feather(c,ear,'aleta',[0,0,0],[s*(.19+i*.018),.08-i*.068,-.085],.04,i%2?P.lilac:P.mint);return ear;});
  const tail=c.g('cola_pivote',root,[0,.78,-.66]);
  curve(c,tail,'cola_curvada',[[0,0,0],[0,-.10,-.31],[.18,-.25,-.64],[.45,-.08,-.76],[.58,.12,-.67]],[.19,.14,.09,.048,0],'#9abfae',26,11);
  const wings=[dragonWing(c,body,-1),dragonWing(c,body,1)];
  for(let i=0;i<5;i++) {const z=-.50+i*.19,y=.45*Math.sqrt(1-(z/.61)**2)-.045;feather(c,body,'espina_dorsal',[0,y,z],[0,y+.23,z-.06],.075,P.lilac);}
  for(let i=0;i<3;i++)feather(c,tail,'espina_caudal',[[0,.18,.45][i],[.01,-.19,-.06][i],[-.31,-.64,-.76][i]],[[0,.18,.45][i],[.18,-.02,.10][i],[-.35,-.67,-.79][i]],.047,P.lilac);
  // Low relief scales are concentrated on the shoulders rather than carpeting
  // the whole creature with separate spheres.
  for(const s of [-1,1])for(let i=0;i<6;i++)ell(c,body,'escama',[.025,.08,.10],[s*(.408-Math.floor(i/3)*.022),.06+(i%3)*.12,-.30+Math.floor(i/3)*.15],i%2?'#afcdb9':'#b4d0bd',10,6);
  return finish(c,'Dragón · guardián de jade',[2.70,2.72],{body,head,eyes,ears,legs,tail,wings},'roquedal_calido');
}

function griffinWing(c,body,side) {
  const w=c.g('ala_pivote',body,[side*.31,.19,-.05]);
  w.rotation.set(.25,0,side*.28);
  ell(c,w,'hombro_emplumado',[.24,.30,.43],[side*.06,.025,0],P.cream,16,10);
  for(let i=0;i<7;i++) {
    const start=[side*(.06+i*.025),.04+i*.016,.09-i*.056];
    const tip=[side*(.72+i*.020),.14-i*.025,.16-i*.162];
    feather(c,w,'pluma_primaria',start,tip,.125,i%2?P.cream:'#decaa4',-.035);
    curve(c,w,'raquis_pluma',[start,[(start[0]+tip[0])*.5,(start[1]+tip[1])*.5,(start[2]+tip[2])*.5],tip],[.003,.004,.001],P.gold,10,5);
  }
  for(let i=0;i<5;i++)feather(c,w,'pluma_cobertora',[side*.04,.10,.06-i*.067],[side*(.36+i*.033),.20,-.13-i*.071],.066,P.white);
  return w;
}
function grifo() {
  const c=ctx('grifo'),{root}=c,body=c.g('torso_respiracion',root,[0,.82,-.14]);
  ell(c,body,'torso_leon',[.74,.72,1.13],[0,0,0],'#c5a477',24,16);
  ell(c,body,'pecho_ave',[.55,.68,.52],[0,.16,.35],P.cream,20,14);
  for(const s of [-1,1])ell(c,body,'anca_felina',[.32,.41,.43],[s*.235,-.04,-.36],'#c5a477',16,10);
  const legs=[];
  for(const s of [-1,1]) {
    const leg=c.g('pata_pivote',root,[s*.22,.57,.20]);
    curve(c,leg,'antebrazo_emplumado',[[0,.35,0],[0,.11,0],[0,-.12,.015],[0,-.30,.042]],[.023,.105,.075,.045],P.cream,20,9);
    curve(c,leg,'tarso',[[0,-.22,.03],[0,-.40,.025],[0,-.51,.09]],[.050,.035,.045],P.gold,14,8);
    for(let i=0;i<3;i++){const x=(i-1)*.07;curve(c,leg,'dedo_ave',[[0,-.51,.07],[x*.6,-.54,.15],[x,-.55,.22]],[.029,.025,.016],P.gold,10,7);curve(c,leg,'garra_ave',[[x,-.55,.21],[x,-.53,.26],[x,-.552,.29]],[.024,.017,0],P.cocoa,8,6);}
    for(let i=0;i<3;i++)feather(c,leg,'pluma_pata',[s*.034,.02-i*.07,-.012],[s*.07,-.16-i*.07,.02],.035,P.cream);
    legs.push(leg);
  }
  for(const s of [-1,1]) {
    const leg=c.g('pata_pivote',root,[s*.23,.49,-.43]);
    curve(c,leg,'pierna_felina',[[0,.28,-.01],[0,-.15,-.025],[0,-.39,.065]],[.12,.067,.052],'#c5a477',16,9);
    ell(c,leg,'zarpa',[.23,.15,.29],[0,-.407,.10],'#d3b887',16,10);
    for(const x of [-.06,0,.06])curve(c,leg,'dedo_zarpa',[[x,-.354,.14],[x,-.379,.22]],[.007,.004],P.cocoa,8,5);legs.push(leg);
  }
  const head=c.g('cabeza_pivote',root,[0,1.37,.36]);
  ell(c,head,'cabeza_aguila',[.48,.50,.44],[0,.025,.08],P.cream,22,14);
  // Cheek feathers silhouette both sides of the eagle's expressive face.
  for(const s of [-1,1])for(let i=0;i<4;i++)feather(c,head,'pluma_mejilla',[s*.15,.02-i*.045,.08],[s*(.26-i*.015),-.13-i*.043,.07-i*.015],.040,i%2?P.cream:P.white);
  const eyes=[-1,1].map(s=>eye(c,head,[s*.159,.070,.253],.94,P.cream));
  curve(c,head,'pico_ganchudo',[[0,-.015,.235],[0,-.038,.35],[0,-.105,.419],[0,-.208,.371]],[.094,.079,.050,0],P.gold,20,11,.87);
  curve(c,head,'pico_inferior',[[0,-.119,.257],[0,-.143,.351],[0,-.164,.386]],[.063,.043,0],'#be9459',14,9,.62);
  for(const s of [-1,1])ell(c,head,'narina',[.018,.015,.01],[s*.045,-.013,.32],P.cocoa,8,6);
  const ears=[-1,1].map(s=>{const ear=c.g('cresta_pivote',head,[s*.12,.18,.035]);for(let i=0;i<3;i++)feather(c,ear,'pluma_corona',[0,0,0],[s*(.05+i*.025),.22-i*.037,-.085-i*.018],.035,i%2?P.gold:P.cream);return ear;});
  for(let i=0;i<6;i++)feather(c,body,'gola_emplumada',[(i-2.5)*.068,.42,.37],[(i-2.5)*.085,.14,.52],.048,i%2?P.cream:P.white);
  const wings=[griffinWing(c,body,-1),griffinWing(c,body,1)];
  const tail=c.g('cola_pivote',root,[0,.86,-.72]);
  curve(c,tail,'cola_leon',[[0,0,0],[.05,.05,-.23],[.20,.18,-.44],[.33,.36,-.45],[.35,.45,-.30]],[.036,.034,.027,.024,.021],'#c5a477',25,8);
  for(let i=0;i<4;i++)curve(c,tail,'borla',[ [.35+(i-1.5)*.025,.44,-.32],[.37+(i-1.5)*.035,.53,-.29],[.34+(i-1.5)*.028,.60,-.23] ],[.040,.039,.001],i%2?P.cocoa:P.gold,12,7);
  return finish(c,'Grifo · alas de trigo',[2.70,2.15],{body,head,eyes,ears,legs,tail,wings},'bosque_dorado');
}
export function crearMiticos() {return [unicornio(),dragon(),grifo()];}
