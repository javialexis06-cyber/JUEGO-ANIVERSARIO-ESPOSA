import * as THREE from 'three';
import { grupo, malla, giroClip } from './formas.mjs';

// Original sculpted geometry, no raster maps. Metres, Y up, front +Z.
// All animation targets are groups, so sibling mesh merging keeps every pivot intact.
const P = {
  leaf: '#4d9653', light: '#79b95b', dark: '#306743', vein: '#9bc578',
  stem: '#528447', red: '#d9453d', coral: '#e66145', orange: '#ed922f',
  gold: '#e8b847', straw: '#b99147', ivory: '#fff2d5', pink: '#e987a3',
  bark: '#875639', barkLight: '#ac784c', soil: '#92633e', wet: '#5d4935',
};

function contexto(id) {
  let serial = 0;
  const root = grupo(id);
  const name = label => `${id}_${label}_${serial++}`;
  const pivot = (label, parent = root, position = [0, 0, 0]) => grupo(name(label), parent, position);
  return { id, root, name, pivot };
}

function mesh(c, parent, label, geometry, position, color) {
  if(!geometry.attributes.normal)geometry.computeVertexNormals();
  // Collapsed lathe poles / leaf tips have no face area; supply a stable normal.
  const normals=geometry.attributes.normal,positions=geometry.attributes.position;
  for(let i=0;i<normals.count;i++){
    let x=normals.getX(i),y=normals.getY(i),z=normals.getZ(i),length=Math.hypot(x,y,z);
    if(length<1e-8){x=positions.getX(i);y=positions.getY(i);z=positions.getZ(i);length=Math.hypot(x,y,z);if(length<1e-8){y=-1;length=1;}}
    normals.setXYZ(i,x/length,y/length,z/length);
  }
  return malla(parent, c.name(label), geometry, position, color);
}

function ellipsoid(c, parent, label, position, size, color, segments = 12, rings = 7) {
  const o = mesh(c, parent, label, new THREE.SphereGeometry(1, segments, rings), position, color);
  o.scale.set(size[0] / 2, size[1] / 2, size[2] / 2);
  return o;
}

function tube(c, parent, label, points, radius, color, segments = 8, radial = 5) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return mesh(c, parent, label, new THREE.TubeGeometry(curve, segments, radius, radial, false), [0, 0, 0], color);
}

// Closed curved leaf: two surfaces, raised midrib, corrugated/serrated rim and a curled tip.
// The stem is at (0,0,0); +Y is the blade direction. No double-sided transparency.
function leafGeometry(length, width, { curl = .22, serration = .09, lobes = 0, sections = 8 } = {}) {
  const positions = [], indices = [], sideCount = (sections + 1) * 5;
  for (const side of [1, -1]) for (let i = 0; i <= sections; i++) {
    const t = i / sections;
    const silhouette = Math.pow(Math.sin(Math.PI * t), .78);
    const ripple = 1 + serration * (i % 2 ? -1 : 1) + lobes * Math.sin(t * Math.PI * 6);
    for (const v of [-1, -.42, 0, .42, 1]) {
      const edge = Math.abs(v);
      const x = v * width * .5 * silhouette * ripple;
      const y = t * length;
      const z = length * (curl * t * t - .07 * Math.sin(Math.PI * t))
        + width * .085 * (1 - edge) * silhouette
        + side * .0025 * silhouette;
      positions.push(x, y, z);
    }
  }
  for (let side = 0; side < 2; side++) for (let row = 0; row < sections; row++) for (let col = 0; col < 4; col++) {
    const a = side * sideCount + row * 5 + col, b = a + 5;
    if (side === 0) indices.push(a, a + 1, b, a + 1, b + 1, b);
    else indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  for (let row = 0; row < sections; row++) for (const col of [0, 4]) {
    const a = row * 5 + col, b = a + 5;
    indices.push(a, b, a + sideCount, b, b + sideCount, a + sideCount);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);g.computeVertexNormals();
  return g;
}

function leaf(c, parent, position, length, width, rotation = [0, 0, 0], color = P.leaf, options = {}) {
  const p = c.pivot('hoja_curvada', parent, position);p.rotation.set(...rotation);
  const geometry = leafGeometry(length, width, options);
  const body = mesh(c, p, 'lamina_dentada', geometry, [0, 0, 0], color);
  const curl = options.curl ?? .22;
  if (options.vein !== false) {
    tube(c, p, 'nervio_central', [[0,.005,.004],[0,length*.45,length*(-.07 + curl*.2)+width*.085+.004],[0,length*.87,length*curl*.76+.005]], Math.max(.002, width*.016), P.vein, 5, 4);
  }
  return { root: p, mesh: body };
}

function bladeToward(c, parent, position, direction, length, width, color, options = {}) {
  const l = leaf(c, parent, position, length, width, [0,0,0], color, options);
  l.root.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), new THREE.Vector3(...direction).normalize());
  return l.root;
}

// Lathed profiles with angular deformation: indented shoulders, ribs and organic asymmetry.
function profileGeometry(profile, radial = 20, deformer = (r) => r) {
  const pos = [], ix = [];
  for (let row=0; row<profile.length; row++) {
    const [radius,y] = profile[row], t = row/(profile.length-1);
    for (let j=0;j<=radial;j++) {
      const a=j/radial*Math.PI*2, r=deformer(radius,a,t,y);
      pos.push(Math.cos(a)*r,y,Math.sin(a)*r);
    }
  }
  for(let row=0;row<profile.length-1;row++)for(let j=0;j<radial;j++){
    const a=row*(radial+1)+j,b=a+radial+1;ix.push(a,b,a+1,a+1,b,b+1);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setIndex(ix);geometry.computeVertexNormals();return geometry;
}

function radiusAt(profile,y) {
  for(let i=1;i<profile.length;i++)if(profile[i-1][1]<=y&&profile[i][1]>=y){
    const k=(y-profile[i-1][1])/Math.max(1e-6,profile[i][1]-profile[i-1][1]);
    return {radius:THREE.MathUtils.lerp(profile[i-1][0],profile[i][0],k),t:(i-1+k)/(profile.length-1)};
  }
  return {radius:0,t:0};
}

function calyx(c, parent, y, radius, color = P.dark, count = 5) {
  for(let i=0;i<count;i++){
    const a=i/count*Math.PI*2;
    bladeToward(c,parent,[0,y,0],[Math.cos(a),.20,Math.sin(a)],radius,radius*.40,color,{sections:4,serration:0,vein:false,curl:-.18});
  }
}

function apple(c, parent, position, scale = 1, ripe = true, detailed = true) {
  const p=c.pivot('manzana',parent,position);p.scale.setScalar(scale);
  const profile=[[0,.009],[.065,0],[.113,.026],[.145,.067],[.155,.117],[.144,.16],[.12,.19],[.075,.20],[.036,.183],[0,.174]];
  mesh(c,p,'fruto_hombros_hundidos',profileGeometry(profile,detailed?24:18,(r,a,t)=>r*(1+.035*Math.cos(a*5)*(t>.55?1:.5))),[0,0,0],ripe?P.red:'#91b958');
  tube(c,p,'pedunculo',[[0,.18,0],[.008,.22,.001],[.019,.25,.008]],.012,P.bark,5,6);
  leaf(c,p,[.009,.226,.003],.13,.07,[.1,.7,-.95],P.leaf,{sections:5,serration:.09});
  if(detailed) {
    // Small warm lenticels on the cheek. Low polygon seeds are geometry, not a texture.
    for(let i=0;i<8;i++){
      const a=.25+i*.73,y=.055+(i%3)*.035,profilePoint=radiusAt(profile,y),r=profilePoint.radius*(1+.035*Math.cos(a*5)*(profilePoint.t>.55?1:.5))+.001;
      const dot=ellipsoid(c,p,'lenticela',[Math.cos(a)*r,y,Math.sin(a)*r],[.005,.007,.0025],'#f5b879',6,4);
      dot.rotation.y=-a+Math.PI/2;
    }
  }
  return p;
}

function peach(c,parent,position,scale=1,detailed=true) {
  const p=c.pivot('durazno',parent,position);p.scale.setScalar(scale);
  const profile=[[0,.006],[.075,.008],[.125,.04],[.153,.085],[.156,.13],[.135,.18],[.09,.212],[.033,.207],[0,.19]];
  const skin=mesh(c,p,'fruto_sutura',profileGeometry(profile,detailed?24:18,(r,a,t)=>r*(1-.055*Math.pow(Math.abs(Math.cos(a)),18)+.025*Math.cos(3*a))),[0,0,0],'#f1a451');
  // Broad blush is baked into vertex colour, so it follows the actual sculpted skin.
  const colors=skin.geometry.attributes.color,vertices=skin.geometry.attributes.position,blush=new THREE.Color('#e37b60');
  for(let i=0;i<colors.count;i++){
    const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i),k=Math.exp(-((x-.04)**2/.012+(y-.11)**2/.006))*Math.max(0,z/.155)*.72;
    colors.setXYZ(i,THREE.MathUtils.lerp(colors.getX(i),blush.r,k),THREE.MathUtils.lerp(colors.getY(i),blush.g,k),THREE.MathUtils.lerp(colors.getZ(i),blush.b,k));
  }
  if(detailed)tube(c,p,'pliegue',[[.028,.205,.024],[.124,.164,.043],[.151,.103,.038],[.122,.04,.028]],.0025,'#da9252',10,4);
  tube(c,p,'rabito',[[0,.198,0],[.01,.23,-.004]],.009,P.bark,4,5);
  leaf(c,p,[.007,.224,0],.17,.052,[.15,.5,-1.05],P.leaf,{sections:6});return p;
}

function lemon(c,parent,position,scale=1,detailed=true) {
  const p=c.pivot('limon',parent,position);p.scale.setScalar(scale);
  const profile=[[0,0],[.025,.011],[.04,.028],[.082,.055],[.105,.10],[.107,.15],[.087,.19],[.047,.222],[.025,.244],[0,.257]];
  mesh(c,p,'piel_citrica',profileGeometry(profile,detailed?24:18,(r,a,t)=>r*(1+.014*Math.sin(a*9+t*33)+.009*Math.cos(a*5-t*24))),[0,0,0],'#f2d445');
  calyx(c,p,.253,.036,P.dark,4);
  tube(c,p,'pedunculo',[[0,.25,0],[.003,.278,0]],.007,P.dark,3,5);
  if(detailed)leaf(c,p,[0,.273,0],.145,.064,[.1,.5,-.8],P.leaf,{sections:6});
  return p;
}

function strawberry(c,parent,position,scale=1,detailed=true,ripe=true) {
  const p=c.pivot('fresa',parent,position);p.scale.setScalar(scale);
  const profile=[[0,.006],[.025,.015],[.052,.05],[.08,.092],[.109,.14],[.123,.19],[.12,.224],[.089,.242],[.035,.238],[0,.23]];
  mesh(c,p,'corazon_carnoso',profileGeometry(profile,detailed?24:16,(r,a,t)=>r*(1+.025*Math.cos(a*5)*(1-t))),[0,0,0],ripe?'#d6334c':'#c9d984');
  const rows=detailed?5:3,around=detailed?8:6;
  for(let row=0;row<rows;row++)for(let i=0;i<around;i++){
    const y=.043+row/(rows-1)*.174,a=(i+(row%2)*.5)/around*Math.PI*2;
    const profilePoint=radiusAt(profile,y),r=profilePoint.radius*(1+.025*Math.cos(a*5)*(1-profilePoint.t));
    const seed=ellipsoid(c,p,'aquenio',[Math.cos(a)*(r+.001),y,Math.sin(a)*(r+.001)],[detailed?.009:.01,.015,.004],ripe?'#f0c580':'#e0df98',6,4);
    seed.rotation.y=-a+Math.PI/2;seed.rotation.z=Math.sin(a)*.12;
  }
  calyx(c,p,.237,.135,P.dark,6);tube(c,p,'pedunculo',[[0,.24,0],[.018,.283,-.003]],.008,P.dark,4,5);return p;
}

function tomato(c,parent,position,scale=1,ripe=true) {
  const p=c.pivot('tomate',parent,position);p.scale.setScalar(scale);
  const profile=[[0,.004],[.052,.009],[.102,.04],[.12,.088],[.116,.13],[.085,.166],[.037,.17],[0,.151]];
  mesh(c,p,'fruto_nervaduras',profileGeometry(profile,18,(r,a,t)=>r*(1+.027*Math.cos(a*7))),[0,0,0],ripe?'#d84634':'#abc267');
  calyx(c,p,.157,.112,P.dark,5);tube(c,p,'tallo_fruto',[[0,.16,0],[.006,.199,.006]],.009,P.dark,4,5);return p;
}

function pumpkin(c,parent,position,scale=1,ripe=true) {
  const p=c.pivot('calabaza',parent,position);p.scale.setScalar(scale);
  const profile=[[0,.009],[.1,.008],[.19,.047],[.245,.105],[.263,.18],[.242,.252],[.183,.299],[.08,.31],[.037,.291],[0,.273]];
  mesh(c,p,'gajos_profundo',profileGeometry(profile,40,(r,a,t)=>r*(.90+.10*Math.cos(a*10))),[0,0,0],ripe?'#e88b2d':'#9daf60');
  tube(c,p,'pedunculo_anguloso',[[0,.281,0],[.005,.344,0],[.035,.383,.007]],.025,'#597749',5,7);
  tube(c,p,'zarcillo_fruto',[[.027,.363,.006],[.085,.369,.015],[.102,.344,.04],[.074,.331,.055],[.063,.35,.04]],.006,P.leaf,12,5);
  return p;
}

function windAsset(c,label,category,footprint,pivots=[],data={}) {
  c.root.userData={...c.root.userData,tipo:category,frente:'+Z',...data};
  const minY=new THREE.Box3().setFromObject(c.root,true).min.y;
  if(Number.isFinite(minY)&&Math.abs(minY)>1e-7)for(const child of c.root.children)child.position.y-=minY/c.root.scale.y;
  // Leaves/fruit groups only position details during construction. Bake them into
  // their closest animated parent so the common exporter can merge whole crowns
  // and crop plants into one draw call, while wind pivots keep independent motion.
  const keep=new Set([c.root,...pivots]),meshes=[],groups=[];
  c.root.updateMatrixWorld(true);
  c.root.traverse(o=>{if(o.isMesh)meshes.push(o);else if(o.isGroup)groups.push(o);});
  for(const object of meshes){let parent=object.parent;while(parent&&!keep.has(parent))parent=parent.parent;if(parent&&object.parent!==parent)parent.attach(object);}
  for(const group of groups.reverse())if(!keep.has(group)&&group.children.length===0)group.removeFromParent();
  const tracks=pivots.flatMap((pivot,i)=>giroClip('viento',pivot,'z',[0,(i%2?-1:1)*.025,0,(i%2?1:-1)*.025,0],[0,1.7,3.4,5.1,6.8]).tracks);
  return{id:c.id,label,category,root:c.root,footprint,clips:tracks.length?[new THREE.AnimationClip('viento',6.8,tracks)]:[]};
}

function crop(c,pivot,kind,label,stage,footprint) {
  return windAsset(c,`${label} · etapa ${stage+1}`,'cultivos',footprint,[pivot],{cultivo:kind,etapa:stage,etapas:4});
}

function sprout(c,p,h=.10,kind='round') {
  tube(c,p,'tallo_naciente',[[0,0,0],[.004,h*.5,0],[0,h,0]],.012,P.stem,5,5);
  for(const s of [-1,1])bladeToward(c,p,[0,h*.79,0],[s,.6,.12],h*.9,h*(kind==='narrow'?.24:.53),s<0?P.leaf:P.light,{sections:5,curl:.19,serration:.04});
}

function carrot(stage) {
  const c=contexto(`zanahoria_${stage}`),p=c.pivot('penacho');
  if(stage===0)sprout(c,p,.085,'narrow');else{
    const s=[0,.52,.76,1][stage],h=.27*s;
    const profile=[[0,0],[.017*s,.045*s],[.03*s,.11*s],[.057*s,.18*s],[.078*s,.225*s],[.068*s,.265*s],[0,.27*s]];
    mesh(c,p,'raiz_afinada',profileGeometry(profile,18,(r,a,t)=>r*(1+.035*Math.sin(a*5+t*12))),[0,0,0],P.orange);
    for(let i=0;i<4;i++){
      const y=(.084+i*.039)*s,rr=(.022+i*.012)*s;
      tube(c,p,'surco_raiz',[[rr*.9,y,0],[rr*.55,y+.004,rr*.8],[-rr*.25,y+.008,rr*.95]],.0028*s,'#c16d27',6,4);
    }
    for(let i=0;i<3+stage;i++){
      const a=i*2.4,end=[Math.cos(a)*.17*s,h+.30*s,Math.sin(a)*.17*s];
      tube(c,p,'peciolo',[[0,h*.93,0],[end[0]*.4,h+.16*s,end[2]*.4],end],.008*s,i%2?P.stem:P.dark,7,5);
      for(let k=0;k<2;k++)for(const side of [-1,1]){
        const t=.53+k*.28,pos=[end[0]*t,h+(end[1]-h)*t,end[2]*t];
        const direction=[Math.cos(a+side*.95),.24,Math.sin(a+side*.95)];
        bladeToward(c,p,pos,direction,(.12-k*.02)*s,.059*s,i%2?P.light:P.leaf,{sections:5,serration:.22,lobes:.13,vein:false,curl:.12});
      }
    }
  }
  return crop(c,p,'zanahoria','Zanahoria de huerta',stage,[.53,.53]);
}

function tomatoCrop(stage) {
  const c=contexto(`tomate_${stage}`),p=c.pivot('mata');
  if(stage===0)sprout(c,p,.12);else{
    const h=[0,.35,.64,.86][stage];
    tube(c,p,'tallo_ramificado',[[0,0,0],[-.025,h*.32,0],[.014,h*.7,-.015],[0,h,0]],.017,P.stem,12,6);
    for(let i=0;i<stage+3;i++){
      const a=i*2.35,y=h*(.2+i/(stage+3)*.7),r=.18+(i%2)*.03;
      const end=[Math.cos(a)*r,y+.05,Math.sin(a)*r];
      tube(c,p,'rama',[[0,y,0],[end[0]*.5,y+.06,end[2]*.5],end],.009,P.stem,6,5);
      for(const side of [-1,0,1])bladeToward(c,p,end,[Math.cos(a+side*.85),side===0?.34:.1,Math.sin(a+side*.85)],side===0?.17:.12,side===0?.09:.068,i%2?P.light:P.leaf,{sections:5,serration:.15,vein:side===0});
      if(stage>=2&&i<stage){
        const s=stage===3?.87:.56;
        const fruit=tomato(c,p,[end[0]*.88,y-.14*s,end[2]*.88],s,stage===3);fruit.rotation.z=.08*Math.sin(a);
      }
    }
    if(stage===3){
      tube(c,p,'tutor_madera',[[.071,0,-.041],[.075,.53,-.041],[.073,1.0,-.048]],.013,'#b18b58',4,6);
      tube(c,p,'lienzo_sujecion',[[-.025,.49,.005],[.086,.49,.006],[.089,.49,-.054],[-.018,.49,-.038]],.005,'#d3c095',7,4);
    }
  }
  return crop(c,p,'tomate','Tomatera en rama',stage,[.68,.68]);
}

function wheat(stage) {
  const c=contexto(`trigo_${stage}`),p=c.pivot('espigas');
  if(stage===0)sprout(c,p,.09,'narrow');else{
    const count=stage===1?3:5;
    for(let i=0;i<count;i++){
      const a=i*2.4,x=Math.cos(a)*.065,z=Math.sin(a)*.065,h=[0,.26,.49,.72][stage]*(.86+(i%3)*.07),gold=stage===3;
      tube(c,p,'caña',[[x,0,z],[x+.011,h*.6,z],[x+.024,h,z]],.009,gold?P.straw:P.stem,6,5);
      for(let k=0;k<2;k++)bladeToward(c,p,[x,h*(.29+k*.2),z],[k?1:-1,.65,.16],h*.36,.037,gold?'#d9b95e':P.leaf,{sections:5,curl:.34,serration:0,vein:false});
      if(stage>=2){
        for(let row=0;row<4;row++)for(const side of [-1,1]){
          const yy=h-.132+row*.043,xx=x+.024+side*.024;
          const grain=ellipsoid(c,p,'grano_en_espiga',[xx,yy,z],[.043,.075,.036],gold?(row%2?'#eed07b':'#d8ab48'):'#9fb96a',8,5);grain.rotation.z=-side*.42;
          tube(c,p,'arista',[[xx,yy+.025,z],[xx+side*.018,yy+.091,z-.002]],.0018,gold?'#ebce80':'#adc27a',2,3);
        }
      }
    }
  }
  return crop(c,p,'trigo','Trigo dorado',stage,[.44,.44]);
}

function pumpkinCrop(stage) {
  const c=contexto(`calabaza_${stage}`),p=c.pivot('guias');
  if(stage===0)sprout(c,p,.1);else{
    const s=[0,.62,.84,1][stage];
    for(let i=0;i<3;i++){
      const a=i*2.2,end=[Math.cos(a)*.3*s,.027,Math.sin(a)*.3*s];
      tube(c,p,'guia_reptante',[[0,.026,0],[end[0]*.5,.035,end[2]*.5],end],.012,P.stem,8,5);
      bladeToward(c,p,[end[0]*.8,.04,end[2]*.8],[Math.cos(a)*.65,.5,Math.sin(a)*.65],.26*s,.24*s,i%2?P.light:P.leaf,{sections:7,lobes:.14,serration:.12,curl:.30});
      const points=Array.from({length:13},(_,k)=>{const t=k/12*2*Math.PI;return[end[0]+Math.cos(t)*.023,.051+k*.002,end[2]+Math.sin(t)*.023];});
      tube(c,p,'zarcillo_rizado',points,.0045,P.light,14,4);
    }
    if(stage>=2)pumpkin(c,p,[.016,0,0],stage===3?1:.63,stage===3);
    if(stage===3)flower(c,p,[-.20,.13,.17],.15,'#f0be48',5,[.2,.5,0]);
  }
  return crop(c,p,'calabaza','Calabaza de otoño',stage,[.82,.82]);
}

function strawberryCrop(stage) {
  const c=contexto(`fresa_${stage}`),p=c.pivot('roseta');
  if(stage===0)sprout(c,p,.08);else{
    for(let i=0;i<stage+2;i++){
      const a=i*2.4,h=.10+(i%2)*.05,end=[Math.cos(a)*.13,h,Math.sin(a)*.13];
      tube(c,p,'peciolo',[[0,.01,0],[end[0]*.5,h*.7,end[2]*.5],end],.007,P.stem,5,5);
      for(const j of [-1,0,1])bladeToward(c,p,end,[Math.cos(a+j*.8),.3,Math.sin(a+j*.8)],j===0?.14:.112,j===0?.09:.076,i%2?P.leaf:P.light,{sections:5,serration:.17,curl:.18,vein:j===0});
    }
    if(stage===2)for(let i=0;i<3;i++)flower(c,p,[-.1+i*.10,.22,.10],.095,P.ivory,5,[.55,0,i*.2]);
    if(stage===3){
      for(const [x,z,s]of [[-.13,.15,.78],[.15,.12,.69],[.05,-.15,.55]]){
        strawberry(c,p,[x,.025,z],s,false,true);
        tube(c,p,'pedunculo_colgante',[[0,.05,0],[x*.6,.25,z*.5],[x,.215*s,z]],.006,P.stem,8,5);
      }
      flower(c,p,[-.09,.25,-.08],.085,P.ivory,5,[.4,.1,0]);
    }
  }
  return crop(c,p,'fresa','Fresal con flores',stage,[.64,.64]);
}

function corn(stage) {
  const c=contexto(`maiz_${stage}`),p=c.pivot('caña');
  if(stage===0)sprout(c,p,.12,'narrow');else{
    const h=[0,.38,.82,1.22][stage];
    tube(c,p,'tallo_nudoso',[[0,0,0],[.007,h*.5,.003],[-.009,h,0]],.025,P.stem,8,7);
    for(let i=0;i<stage+3;i++){
      const y=h*(.15+i/(stage+3)*.67),a=i*2.4;
      bladeToward(c,p,[0,y,0],[Math.cos(a)*.75,.72,Math.sin(a)*.75],h*(.37+(i%2)*.03),stage===3?.115:.08,i%2?P.light:P.leaf,{sections:7,serration:0,curl:.43});
      const ring=mesh(c,p,'nudo',new THREE.TorusGeometry(.026,.0035,4,10),[0,y,0],P.light);ring.rotation.x=Math.PI/2;
    }
    if(stage>=2){
      const ear=c.pivot('mazorca',p,[.055,h*.41,.025]);ear.rotation.z=-.30;
      const s=stage===3?1:.66;ear.scale.setScalar(s);
      mesh(c,ear,'corazon_mazorca',profileGeometry([[0,0],[.059,.025],[.069,.12],[.063,.23],[.035,.315],[0,.34]],12),[0,0,0],P.gold);
      if(stage===3)for(let row=0;row<8;row++)for(let j=0;j<6;j++){
        const a=j/6*Math.PI*2,r=.061*(1-row*.047),yy=.049+row*.034;
        const kernel=ellipsoid(c,ear,'grano_tierno',[Math.cos(a)*r,yy,Math.sin(a)*r],[.039,.040,.027],(row+j)%3?'#edc348':'#f7d879',7,4);kernel.rotation.y=-a+Math.PI/2;
      }
      for(const side of [-1,1])bladeToward(c,ear,[side*.02,.0,-.04],[side*.35,1,-.13],.34,.088,P.leaf,{sections:6,serration:0,curl:.3});
      for(let i=0;i<5;i++)tube(c,ear,'barba',[[0,.31,0],[Math.sin(i)*.047,.36,Math.cos(i)*.025],[Math.sin(i)*.077,.35,Math.cos(i)*.046]],.0027,'#b8874e',7,4);
    }
    if(stage===3){
      for(let i=0;i<5;i++){
        const a=i*2.4,tip=[Math.cos(a)*.10,h+.14+(i%2)*.03,Math.sin(a)*.10];
        tube(c,p,'panoja',[[0,h-.03,0],[tip[0]*.5,h+.065,tip[2]*.5],tip],.004,'#d4b563',6,4);
        for(let k=0;k<3;k++)ellipsoid(c,p,'antera',[tip[0]*(.45+k*.2),h+.055+k*.035,tip[2]*(.45+k*.2)],[.023,.033,.017],P.gold,6,4);
      }
    }
  }
  return crop(c,p,'maiz','Maíz con mazorca',stage,[.76,.76]);
}

function canopy(c,parent,position,size,color,seed=1) {
  const g=new THREE.SphereGeometry(1,14,9),a=g.getAttribute('position');
  for(let i=0;i<a.count;i++){
    const x=a.getX(i),y=a.getY(i),z=a.getZ(i),angle=Math.atan2(z,x);
    const ripple=1+.075*Math.cos(angle*5+seed)*Math.sin(Math.acos(Math.max(-1,Math.min(1,y)))*3)+.035*Math.sin((x+y+z)*8+seed);
    a.setXYZ(i,x*ripple*size[0]/2,y*ripple*size[1]/2,z*ripple*size[2]/2);
  }
  g.computeVertexNormals();return mesh(c,parent,'copa_lobulada',g,position,color);
}

function barkTrunk(c,parent,height,radius=.13) {
  const profile=[[0,0],[radius*1.45,0],[radius*1.15,.12],[radius,.38],[radius*.72,height*.72],[radius*.59,height],[0,height]];
  mesh(c,parent,'tronco_acanalado',profileGeometry(profile,14,(r,a,t)=>r*(1+.09*Math.cos(a*7+t*3))),[0,0,0],P.bark);
  for(let i=0;i<5;i++){
    const a=i/5*Math.PI*2;
    tube(c,parent,'raiz_expuesta',[[Math.cos(a)*radius*.5,.18,Math.sin(a)*radius*.5],[Math.cos(a)*radius*1.6,.05,Math.sin(a)*radius*1.6],[Math.cos(a)*radius*2.1,.018,Math.sin(a)*radius*2.1]],.027,P.bark,6,5);
  }
  for(let i=0;i<4;i++){
    const a=i*1.7,r=radius*.99;
    tube(c,parent,'veta_corteza',[[Math.cos(a)*r,.20,Math.sin(a)*r],[Math.cos(a+.08)*r*.92,.48,Math.sin(a+.08)*r*.92],[Math.cos(a+.04)*r*.81,.75,Math.sin(a+.04)*r*.81]],.0045,P.barkLight,8,4);
  }
}

function fruitTree(kind) {
  const config={manzano:{label:'Manzano rubí',fruit:apple,palette:['#4a8b49','#69a64c','#7fb75c'],size:1.0},duraznero:{label:'Duraznero de verano',fruit:peach,palette:['#417d4c','#5b9953','#75ad61'],size:.95},limonero:{label:'Limonero soleado',fruit:lemon,palette:['#316f42','#4a8c48','#6aa854'],size:.9}}[kind];
  const c=contexto(kind),crown=c.pivot('copa_viento',c.root,[0,1.12,0]);
  barkTrunk(c,c.root,1.43,.14);
  const clusters=[[-.42,.30,-.02,.90],[.39,.35,.03,.92],[-.13,.68,-.18,.95],[.18,.72,.17,.87],[.02,.19,.40,.83],[-.10,.28,-.43,.82],[.02,.96,-.03,.67]];
  clusters.forEach(([x,y,z,s],i)=>{
    tube(c,c.root,'rama_bifurcada',[[0,.73,0],[x*.55,1.06+y*.45,z*.55],[x,1.12+y,z]],.033,P.bark,6,6);
    canopy(c,crown,[x,y,z],[s,s*.76,s*.91],config.palette[i%3],i+1);
  });
  // Explicit foliage gives readable, curled silhouettes over the sculpted larger masses.
  for(let i=0;i<20;i++){
    const a=i*2.4,ring=i%3,y=.23+ring*.29,r=ring===2?.52:.69;
    leaf(c,crown,[Math.cos(a)*r,y,Math.sin(a)*r],kind==='duraznero'?.24:.19,kind==='duraznero'?.055:.105,[.6, -a,Math.sin(a)*.8],config.palette[(i+1)%3],{sections:5,serration:.065,vein:i%3===0,curl:.19});
  }
  const fruitPositions=[[-.53,.24,.26],[.38,.30,.39],[-.06,.58,.54],[.08,.81,.35],[-.24,.02,.52],[.56,.26,-.11],[.04,.12,-.64],[-.45,.59,-.21]];
  fruitPositions.forEach((pos,i)=>{
    const fn=config.fruit,fruit=kind==='manzano'?fn(c,crown,pos,.66+(i%3)*.045,true,false):fn(c,crown,pos,.65+(i%3)*.045,false);
    fruit.rotation.z=Math.sin(i)*.15;
    tube(c,crown,'ramita_frutal',[[pos[0]*.92,pos[1]+.22,pos[2]*.91],[pos[0],pos[1]+.16,pos[2]]],.006,P.dark,3,4);
  });
  c.root.scale.setScalar(config.size);
  return windAsset(c,config.label,'naturaleza',[1.95*config.size,1.85*config.size],[crown],{fruta:kind==='manzano'?'manzana':kind==='duraznero'?'durazno':'limon'});
}

function pine() {
  const c=contexto('pino'),crown=c.pivot('ramas_viento',c.root,[0,.44,0]);barkTrunk(c,c.root,.90,.125);
  for(let level=0;level<5;level++){
    const radius=.72-level*.118,h=.78-level*.055,y=level*.34;
    const profile=[[0,-.03],[radius*.76,0],[radius,.10],[radius*.80,.20],[radius*.56,h*.62],[radius*.24,h*.89],[0,h]];
    mesh(c,crown,'rama_doblada',profileGeometry(profile,20,(r,a,t)=>r*(1+.08*Math.cos(a*10)+.035*Math.sin(a*5+level))),[0,y,0],['#397650','#44865a','#4e9563','#68a975','#80b985'][level]);
    for(let i=0;i<5;i++){
      const a=i/5*Math.PI*2+level*.6;
      tube(c,crown,'aguja_luminosa',[[Math.cos(a)*radius*.35,y+.45,Math.sin(a)*radius*.35],[Math.cos(a)*radius*.75,y+.19,Math.sin(a)*radius*.75]],.008,'#75af7b',3,4);
    }
  }
  return windAsset(c,'Pino de ramas suaves','naturaleza',[1.6,1.6],[crown]);
}

function oak() {
  const c=contexto('roble'),crown=c.pivot('copa_viento',c.root,[0,1.17,0]);barkTrunk(c,c.root,1.57,.2);
  const clusters=[[-.56,.28,0,.96],[.54,.36,.12,1.08],[0,.73,-.15,1.19],[-.36,.65,.25,.98],[.19,.17,.55,.96],[.14,.29,-.61,1.01],[-.55,.22,-.42,.78],[.52,.75,-.29,.80]];
  clusters.forEach(([x,y,z,s],i)=>{tube(c,c.root,'rama_nudosa',[[0,.75,0],[x*.58,1.06,z*.62],[x,1.17+y,z]],.043,P.bark,7,6);canopy(c,crown,[x,y,z],[s,s*.74,s],['#548745','#739f4c','#89b058'][i%3],i);});
  for(let i=0;i<17;i++){const a=i*2.4;leaf(c,crown,[Math.cos(a)*.83,.25+(i%3)*.28,Math.sin(a)*.8],.23,.14,[.8,-a,Math.sin(a)],i%2?'#8bb35c':'#5d974b',{sections:8,lobes:.27,serration:.03,vein:i%3===0});}
  for(let i=0;i<4;i++){const a=i*1.9,x=Math.cos(a)*.68,z=Math.sin(a)*.73;ellipsoid(c,crown,'bellota',[x,.15,z],[.06,.087,.056],'#b08044',9,6);ellipsoid(c,crown,'cupula_bellota',[x,.191,z],[.065,.034,.061],'#746541',9,5);}
  return windAsset(c,'Roble del sendero','naturaleza',[2.45,2.35],[crown]);
}

function flower(c,parent,position,size,color,petals=7,rotation=[0,0,0]) {
  const p=c.pivot('flor',parent,position);p.rotation.set(...rotation);
  for(let i=0;i<petals;i++){
    const a=i/petals*Math.PI*2;
    const petal=ellipsoid(c,p,'petalo',[Math.cos(a)*size*.29,Math.sin(a)*size*.29,0],[size*.43,size*.23,size*.12],i%3===0&&color===P.ivory?'#fff9ec':color,8,5);petal.rotation.z=a;
  }
  ellipsoid(c,p,'corazon_polinizador',[0,0,size*.053],[size*.25,size*.25,size*.18],P.gold,9,5);
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2;ellipsoid(c,p,'polen',[Math.cos(a)*size*.058,Math.sin(a)*size*.058,size*.14],[size*.03,size*.03,size*.024],'#ba8139',5,3);}
  return p;
}

function floweringBush() {
  const c=contexto('arbusto_flores'),p=c.pivot('ramas');
  for(let i=0;i<5;i++){const a=i*2.4;canopy(c,p,[Math.cos(a)*.22,.22+(i%2)*.10,Math.sin(a)*.18],[.54,.42,.46],i%2?P.leaf:P.light,i);}
  for(let i=0;i<7;i++){
    const a=i*2.4,x=Math.cos(a)*.32,z=Math.sin(a)*.28,y=.31+(i%3)*.09;
    tube(c,p,'tallo_flower',[[x*.7,.14,z*.7],[x,y,z]],.008,P.dark,4,5);
    flower(c,p,[x,y,z+.025],.16,[P.pink,P.ivory,'#e8acb9'][i%3],6,[.7,-a*.25,0]);
  }
  for(let i=0;i<8;i++){const a=i*2.4;leaf(c,p,[Math.cos(a)*.31,.29,Math.sin(a)*.29],.16,.085,[.8,-a,Math.sin(a)],P.leaf,{sections:5,vein:false});}
  return windAsset(c,'Arbusto de flores silvestres','naturaleza',[1.0,.9],[p]);
}

function earthGeometry() {
  const n=18,positions=[],indices=[];
  for(let z=0;z<=n;z++)for(let x=0;x<=n;x++){
    const u=x/n,v=z/n,xx=(u-.5)*1.38,zz=(v-.5)*1.38;
    const edge=Math.min(1,Math.min(u,1-u,v,1-v)*13);
    const furrow=.041*Math.pow(.5+.5*Math.cos(u*Math.PI*10),1.7)*edge;
    const noise=.005*Math.sin(x*2.1+z*1.7)+.003*Math.cos(x*3.3-z*2.7);
    positions.push(xx+(x===0||x===n?.013*Math.sin(z*1.8):0),.085+furrow+noise,zz+(z===0||z===n?.012*Math.sin(x*1.5):0));
  }
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){const a=z*(n+1)+x,b=a+n+1;indices.push(a,b,a+1,a+1,b,b+1);}
  const border=[];for(let x=0;x<=n;x++)border.push(x);for(let z=1;z<=n;z++)border.push(z*(n+1)+n);for(let x=n-1;x>=0;x--)border.push(n*(n+1)+x);for(let z=n-1;z>0;z--)border.push(z*(n+1));
  for(let k=0;k<border.length;k++){
    const a=border[k],b=border[(k+1)%border.length],bottom=positions.length/3;
    positions.push(positions[a*3]*.98,0,positions[a*3+2]*.98,positions[b*3]*.98,0,positions[b*3+2]*.98);
    indices.push(a,b,bottom,bottom,b,bottom+1);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

function parcel(wet) {
  const c=contexto(wet?'parcela_regada':'parcela_seca');
  const g=earthGeometry(),ground=mesh(c,c.root,'tierra_con_surcos',g,[0,0,0],wet?P.wet:P.soil);
  const color=g.getAttribute('color'),pos=g.getAttribute('position');
  if(color)for(let i=0;i<color.count;i++){const value=.80+(pos.getY(i)-.08)*3.4+.06*Math.sin(i*2.1);color.setXYZ(i,color.getX(i)*value,color.getY(i)*value,color.getZ(i)*value);}
  for(let i=0;i<14;i++){
    const x=Math.sin(i*8.43)*.65,z=Math.sin(i*5.27+.3)*.65;
    const lump=mesh(c,c.root,'terron',new THREE.IcosahedronGeometry(.028+(i%3)*.006,0),[x,.117,z],wet?'#7d6044':'#b17e50');lump.scale.set(1.2,.65,.86);lump.rotation.set(i*.13,i*.79,i*.17);
  }
  for(let i=0;i<3;i++){
    const x=i%2?-.64:.63,z=-.48+i*.48;
    for(const s of [-1,1])bladeToward(c,c.root,[x,.10,z],[s*.5,.9,.2],.085,.023,wet?'#64924f':'#8d9c56',{sections:4,vein:false,serration:0});
  }
  if(wet)for(const [x,z,s]of [[-.34,-.3,.09],[.30,.20,.11],[-.33,.43,.07]]){
    const water=ellipsoid(c,c.root,'brillo_humedad',[x,.101,z],[s,.005,s*.47],'#80968b',9,5);water.rotation.y=.4;
  }
  ground.userData.castShadow=false;
  return windAsset(c,wet?'Tierra recién regada':'Tierra de huerta','parcelas',[1.4,1.4],[],{regada:wet,capacidad:4});
}

function rock() {
  const c=contexto('roca');
  const g=new THREE.IcosahedronGeometry(.43,1),p=g.getAttribute('position');
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.12*Math.sin(x*19+y*11+z*13);p.setXYZ(i,x*k,Math.max(-.19,y*.65*k),z*.77*k);}g.computeVertexNormals();
  mesh(c,c.root,'piedra_tallada',g,[0,.19,0],'#9da6a0');
  for(let i=0;i<5;i++){const a=i*2.4;canopy(c,c.root,[Math.cos(a)*.22,.36+Math.sin(i)*.035,Math.sin(a)*.16],[.21,.045,.15],i%2?'#71976a':'#8da574',i);}
  return windAsset(c,'Roca con musgo','naturaleza',[.95,.78]);
}

function log() {
  const c=contexto('tronco'),p=c.pivot('madera');p.rotation.x=Math.PI/2;p.position.set(0,.23,-.48);
  mesh(c,p,'corteza',profileGeometry([[0,0],[.22,0],[.236,.12],[.218,.48],[.235,.89],[.22,.96],[0,.96]],18,(r,a,t)=>r*(1+.055*Math.cos(a*9+t*2))),[0,0,0],P.bark);
  for(const y of [-.002,.963]){
    const disk=mesh(c,p,'madera_corte',new THREE.CylinderGeometry(.205,.205,.009,24),[0,y,0],'#cca577');
    for(const r of [.056,.113,.164]){const ring=mesh(c,p,'anillo_crecimiento',new THREE.TorusGeometry(r,.004,4,24),[0,y+(y>0?.007:-.007),0],'#a77e51');ring.rotation.x=Math.PI/2;ring.scale.x=1.05;}
    void disk;
  }
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2; tube(c,p,'grieta_corteza',[[Math.cos(a)*.231,.08,Math.sin(a)*.231],[Math.cos(a+.06)*.223,.46,Math.sin(a+.06)*.223],[Math.cos(a)*.231,.88,Math.sin(a)*.231]],.0055,i%2?'#6e4935':'#a06e45',8,4);}
  for(let i=0;i<3;i++)canopy(c,c.root,[-.12+i*.11,.423,-.25+i*.15],[.22,.035,.16],i%2?'#6e965c':'#7e9e64',i);
  return windAsset(c,'Tronco con anillos y musgo','naturaleza',[.56,1.08]);
}

function meadowFlowers() {
  const c=contexto('flores_pradera'),p=c.pivot('tallos');
  for(let i=0;i<5;i++){
    const a=i*2.4,x=Math.cos(a)*.15,z=Math.sin(a)*.14,h=.23+(i%3)*.09;
    tube(c,p,'tallo',[[x,0,z],[x-.018,h*.6,z],[x+.012,h,z]],.007,P.stem,8,5);
    bladeToward(c,p,[x,h*.36,z],[Math.cos(a),.45,Math.sin(a)],.12,.045,P.leaf,{sections:5,vein:false});
    flower(c,p,[x+.012,h,z],i===0?.16:.12,[P.ivory,'#cf82a4','#eeb949'][i%3],i%2?6:8,[.65,0,Math.sin(i)*.2]);
  }
  return windAsset(c,'Flores de la pradera','naturaleza',[.54,.50],[p]);
}

function lily() {
  const c=contexto('nenufar'),p=c.pivot('hojas_flotantes');
  for(const [x,z,r,rot]of [[-.11,0,.24,.3],[.21,-.12,.17,2.4]]){
    const shape=new THREE.Shape();shape.moveTo(0,0);for(let i=0;i<=32;i++){const a=.20+i/32*(Math.PI*2-.40);shape.lineTo(Math.sin(a)*r,Math.cos(a)*r);}shape.lineTo(0,0);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.008,bevelEnabled:true,bevelSegments:1,bevelSize:.003,bevelThickness:.002,steps:1});
    const pad=mesh(c,p,'hoja_acorazonada',geometry,[x,.016,z],rot<1?'#4e9870':'#6aaa77');pad.rotation.set(-Math.PI/2,0,rot);
    for(let k=0;k<5;k++){const a=.5+k*1.1+rot;tube(c,p,'nervadura_radial',[[x,.03,z],[x+Math.sin(a)*r*.65,.034,z+Math.cos(a)*r*.65]],.0025,'#8abc83',3,4);}
  }
  const bloom=c.pivot('flor_acuatica',p,[-.07,.049,.023]);
  for(let ring=0;ring<2;ring++)for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2+ring*.38;
    bladeToward(c,bloom,[Math.cos(a)*.025,0,Math.sin(a)*.025],[Math.cos(a)*.7,.5+ring*.8,Math.sin(a)*.7],ring?.13:.16,ring?.051:.064,ring?'#f1b1c3':'#f7dce1',{sections:5,serration:0,vein:false,curl:.21});
  }
  ellipsoid(c,bloom,'estambres',[0,.065,0],[.061,.071,.061],P.gold,10,6);
  return windAsset(c,'Nenúfar en flor','naturaleza',[.85,.65],[p]);
}

function harvestFruit(id,label,creator,footprint) {
  const c=contexto(id);creator(c,c.root,[0,0,0]);return windAsset(c,label,'cosecha',footprint);
}

export function crearNaturaleza() {
  const assets=[];
  for(const factory of [carrot,tomatoCrop,wheat,pumpkinCrop,strawberryCrop,corn])for(let stage=0;stage<4;stage++)assets.push(factory(stage));
  assets.push(fruitTree('manzano'),fruitTree('duraznero'),fruitTree('limonero'),pine(),oak(),floweringBush(),parcel(false),parcel(true),rock(),log(),meadowFlowers(),lily());
  assets.push(harvestFruit('fruta_manzana','Manzana rubí cosechada',apple,[.33,.33]),harvestFruit('fruta_fresa','Fresa con semillas',strawberry,[.29,.29]),harvestFruit('fruta_limon','Limón de piel rugosa',lemon,[.27,.27]),harvestFruit('fruta_durazno','Durazno aterciopelado',peach,[.34,.34]));
  return assets;
}
