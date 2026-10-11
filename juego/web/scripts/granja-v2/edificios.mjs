import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { grupo, esfera as esferaBase, cilindro, cono, barra, tubo, hoja, malla, material, giroClip } from './formas.mjs';

// Biblioteca V2: carpintería modelada, teja curva individual y piezas de cantería.
// Sin imágenes ni texturas externas. Escala en metros, suelo Y=0, frente +Z.
const P = {
  cream:'#f5e1b7', creamLight:'#fff0d5', coral:'#d77760', coralDark:'#b85348',
  roof:'#b65d47', roofLight:'#d88964', sage:'#829d64', sageDark:'#4f7657',
  wood:'#a7764c', woodLight:'#c69b68', woodDark:'#65482f', grain:'#815938',
  stone:'#a5a094', stoneLight:'#d1c5ad', stoneDark:'#838877', metal:'#4e625f',
  brass:'#b49b5b', blue:'#8ec5c0', blueDark:'#416f75', glass:'#b5d9cc',
  leaf:'#517e45', leafLight:'#92b35f', flower:'#e59baf', flowerCream:'#f7dda0',
  soil:'#765640', hay:'#d9ad50', hayLight:'#ebcb76', dark:'#3f4139', water:'#73b3b3',
};

// La densidad depende del tamaño legible: los detalles diminutos no necesitan
// las mismas subdivisiones que una pared. Se conserva el perfil biselado.
function caja(parent,name,size,pos,color,radius=.06){
  const segments=Math.max(...size)>1.3&&Math.min(...size)>.45?2:1;
  return malla(parent,name,new RoundedBoxGeometry(...size,segments,Math.min(radius,Math.min(...size)*.45)),pos,color);
}
function esfera(parent,name,size,pos,color){
  const diameter=Math.max(...size),segments=diameter<.085?8:diameter<.24?12:18;
  return esferaBase(parent,name,size,pos,color,segments,diameter<.085?5:diameter<.24?8:10);
}
function toro(parent,name,radius,tube,pos,color){
  return malla(parent,name,new THREE.TorusGeometry(radius,tube,6,20),pos,color);
}

function finish(id,label,category,root,footprint,clips=[]) {
  root.name=id;
  root.updateMatrixWorld(true);
  const minY=new THREE.Box3().setFromObject(root).min.y;
  // Cero físico común aunque una pieza redondeada tenga un pequeño bisel inferior.
  root.children.forEach(child=>child.position.y-=minY);
  // Las agrupaciones de modelado no deben convertirse en draw calls adicionales.
  // Aplanar sólo grupos estáticos; conservar los pivotes a los que apuntan clips.
  const animated=new Set(clips.flatMap(clip=>clip.tracks.map(track=>track.name.split('.')[0])));
  const flatten=(parent)=>{
    for(const child of [...parent.children]){
      if(!child.isGroup)continue;
      if(animated.has(child.name)){flatten(child);continue;}
      flatten(child);child.updateMatrix();
      for(const item of [...child.children]){item.applyMatrix4(child.matrix);parent.add(item);}
      parent.remove(child);
    }
  };
  flatten(root);
  root.userData={id,label,category,style:'arcilla artesanal v2',upAxis:'Y',frontAxis:'+Z',units:'meters'};
  return {id,label,category,root,clips,footprint};
}

function extruded(parent,name,shape,depth,pos,color,bevel=.014) {
  const geo=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:bevel>0,
    bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,curveSegments:8});
  geo.translate(0,0,-depth/2);
  return malla(parent,name,geo,pos,color);
}

function plank(parent,name,w,h,d,pos,color=P.wood,seed=0,grain=true) {
  const shape=new THREE.Shape();
  const chip=.012+Math.abs(Math.sin(seed*1.7))*.009;
  shape.moveTo(-w/2+chip,-h/2);shape.lineTo(w/2,-h/2+.004);
  shape.lineTo(w/2-chip,h/2);shape.lineTo(-w/2,h/2-.012);shape.closePath();
  const body=extruded(parent,name,shape,d,pos,color,Math.min(.009,d*.2,w*.07));
  if(grain&&w>.07&&h>.12) {
    for(let i=0;i<2;i++){
      const x=pos[0]+(i-.5)*w*.42;
      tubo(parent,name+'_veta_'+i,[[x,pos[1]-h*.31,pos[2]+d/2+.009],
        [x+Math.sin(seed+i)*.011,pos[1]-h*.06,pos[2]+d/2+.011],
        [x-.014,pos[1]+h*.17,pos[2]+d/2+.01],
        [x+.004,pos[1]+h*.32,pos[2]+d/2+.01]],.0038,P.grain,7,3);
    }
  }
  return body;
}

function nail(parent,name,x,y,z,size=.026,color=P.metal) {
  const n=cilindro(parent,name,size,size,.012,[x,y,z],color,8);n.rotation.x=Math.PI/2;
  return n;
}

function ring(parent,name,r,t,pos,color,axis='y') {
  const o=toro(parent,name,r,t,pos,color);
  if(axis==='y')o.rotation.x=Math.PI/2;
  else if(axis==='x')o.rotation.y=Math.PI/2;
  return o;
}

function gable(parent,name,w,rise,depth,y,color) {
  const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,rise);s.closePath();
  return extruded(parent,name,s,depth,[0,y,0],color,.009);
}

function archShape(width,height,arch=.32) {
  const w=width/2,b=-height/2,t=height/2,curve=Math.min(arch,height*.46);
  const s=new THREE.Shape();s.moveTo(-w,b);s.lineTo(w,b);s.lineTo(w,t-curve);
  s.quadraticCurveTo(w,t,w*.42,t);s.quadraticCurveTo(0,t+curve*.08,-w*.42,t);
  s.quadraticCurveTo(-w,t,-w,t-curve);s.lineTo(-w,b);s.closePath();return s;
}

function stone(parent,name,size,pos,seed=0) {
  const bevel=Math.min(.023,Math.min(...size)*.18),w=size[0]/2-bevel,h=size[1]/2-bevel;
  const shape=new THREE.Shape();shape.moveTo(-w,-h);shape.lineTo(w-.014,-h);
  shape.lineTo(w,h*.65);shape.lineTo(w-.026,h);shape.lineTo(-w+.007,h-.004);shape.closePath();
  const mesh=extruded(parent,name,shape,Math.max(.01,size[2]-2*bevel),pos,
    [P.stone,P.stoneLight,P.stoneDark][Math.abs(seed)%3],bevel);
  mesh.rotation.set(Math.sin(seed*2.1)*.025,Math.sin(seed)*.035,Math.cos(seed*1.7)*.016);
  return mesh;
}

function foundation(parent,name,w,d,h=.29) {
  caja(parent,name+'_mortero',[w,h-.015,d],[0,h/2,0],P.stoneDark,.075);
  const nx=Math.max(3,Math.round(w/.44)),nz=Math.max(2,Math.round(d/.43));
  for(let row=0;row<2;row++){
    const y=.075+row*(h/2-.015),height=h/2-.025;
    for(let i=0;i<nx;i++)for(const sign of [-1,1]){
      const x=-w/2+(i+.5)*w/nx;
      stone(parent,`${name}_fachada_${row}_${i}_${sign}`,[w/nx-.024,height,.095],[x,y,sign*d/2],i+row*4);
    }
    for(let j=0;j<nz;j++)for(const sign of [-1,1]){
      stone(parent,`${name}_lateral_${row}_${j}_${sign}`,[.095,height,d/nz-.024],[sign*w/2,y,-d/2+(j+.5)*d/nz],j+row+1);
    }
  }
}

// Teja de sección curva: espesor en contorno y superficie ondulada, 40–64 triángulos.
function curvedTile(parent,name,halfW,rise,eave,u0,u1,z0,z1,sign,color) {
  const verts=[],indices=[],nx=2,nz=4;
  const height=(u,v)=>eave+rise*(1-u)+.055*Math.sin(u*Math.PI)+.037*Math.sin(v*Math.PI);
  for(let layer=0;layer<2;layer++)for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){
    const u=u0+(u1-u0)*i/nx,v=j/nz;
    verts.push(sign*halfW*u,height(u,v)-layer*.031,z0+(z1-z0)*v);
  }
  const stride=nz+1,layerN=(nx+1)*stride;
  const tri=(a,b,c)=>sign>0?indices.push(a,b,c):indices.push(a,c,b);
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
    const a=i*stride+j,b=a+1,c=a+stride,d=c+1;tri(a,b,c);tri(b,d,c);
  }
  const perimeter=[...Array.from({length:nz+1},(_,j)=>j),...Array.from({length:nx},(_,i)=>(i+1)*stride+nz),
    ...Array.from({length:nz},(_,j)=>nx*stride+nz-j-1),...Array.from({length:nx-1},(_,i)=>(nx-i-1)*stride)];
  for(let k=0;k<perimeter.length;k++){
    const a=perimeter[k],b=perimeter[(k+1)%perimeter.length];tri(a,a+layerN,b);tri(b,a+layerN,b+layerN);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();
  return malla(parent,name,geo,[0,0,0],color);
}

function roof(parent,name,w,d,eave,rise,color=P.roof,rows=3,cols=7) {
  const half=w/2,angle=Math.atan2(rise,half);
  for(const sign of [-1,1]){
    const base=caja(parent,`${name}_tablado_${sign}`,[Math.hypot(half,rise)+.07,.075,d+.035],
      [sign*half/2,eave+rise/2-.022,0],P.woodDark,.022);base.rotation.z=-sign*angle;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const u0=row/rows-.014,u1=(row+1)/rows+.035;
      const z0=-d/2+col*d/cols+.009,z1=-d/2+(col+1)*d/cols-.006;
      const tint=new THREE.Color(color).multiplyScalar(1+Math.sin(col*2.3+row*4.1)*.075).getStyle();
      curvedTile(parent,`${name}_teja_${sign}_${row}_${col}`,half,rise,eave+.032,u0,u1,z0,z1,sign,tint);
    }
    for(const front of [-1,1]){
      tubo(parent,`${name}_viga_borde_${sign}_${front}`,[[0,eave+rise-.035,front*(d/2+.033)],
        [sign*half*.48,eave+rise*.54-.035,front*(d/2+.034)],
        [sign*half*1.03,eave-.035,front*(d/2+.033)]],.045,P.cream,12,6);
    }
  }
  for(let i=0;i<cols;i++){
    const cap=cilindro(parent,`${name}_cumbrera_${i}`,.092,.096,d/cols+.018,[0,eave+rise+.061,-d/2+(i+.5)*d/cols],P.roofLight,10);
    cap.rotation.x=Math.PI/2;
  }
}

function pot(parent,name,pos,scale=1,flowers=true) {
  const p=grupo(name,parent,pos);p.scale.setScalar(scale);
  cilindro(p,name+'_maceta',.115,.084,.17,[0,.085,0],P.coral,10);
  ring(p,name+'_borde',.112,.018,[0,.168,0],P.roofLight);
  cilindro(p,name+'_tierra',.096,.096,.012,[0,.166,0],P.soil,10);
  for(let i=0;i<3;i++){
    const a=i*2.4,x=Math.cos(a)*.07,z=Math.sin(a)*.07;
    barra(p,name+'_tallo_'+i,[0,.17,0],[x,.34+i*.015,z],.011,P.leaf);
    hoja(p,name+'_hoja_'+i,.12,.06,[x*.6,.24,z*.6],P.leafLight,[.25,a,.5]);
    if(flowers){
      for(let k=0;k<4;k++){const b=k*Math.PI/2;esfera(p,`${name}_petalo_${i}_${k}`,[.059,.035,.059],[x+Math.cos(b)*.027,.35+i*.015,z+Math.sin(b)*.027],i%2?P.flower:P.flowerCream);}
      esfera(p,name+'_centro_'+i,[.033,.035,.033],[x,.36+i*.015,z],P.hay);
    }
  }
  return p;
}

function flowerbox(parent,name,w,pos) {
  const p=grupo(name,parent,pos);
  caja(p,name+'_caja',[w,.19,.23],[0,0,0],P.wood,.035);
  caja(p,name+'_borde',[w+.045,.044,.27],[0,.105,0],P.woodLight,.015);
  caja(p,name+'_tierra',[w-.07,.018,.19],[0,.109,0],P.soil,.006);
  for(let i=0;i<3;i++){
    const x=(i-1)*w*.26;
    hoja(p,name+'_hoja_a_'+i,.22,.1,[x,.16,.015],P.leaf,[-.4,0,-.8+i*.8]);
    hoja(p,name+'_hoja_b_'+i,.16,.08,[x,.15,.06],P.leafLight,[.8,i,.4]);
    const flower=grupo(name+'_flor_'+i,p,[x,.24,.01]);
    for(let j=0;j<4;j++){const a=j*Math.PI/2;esfera(flower,name+'_petalo_'+i+'_'+j,[.066,.05,.058],[Math.cos(a)*.035,Math.sin(a)*.031,0],i%2?P.flowerCream:P.flower);}
    esfera(flower,name+'_centro_'+i,[.04,.04,.025],[0,0,.025],P.hay);
  }
  return p;
}

function window(parent,name,pos,w=.53,h=.66,options={}) {
  const p=grupo(name,parent,pos);
  extruded(p,name+'_hueco',archShape(w+.15,h+.15,.18),.09,[0,0,0],P.woodDark,.018);
  extruded(p,name+'_marco',archShape(w+.11,h+.11,.18),.075,[0,0,.03],P.cream,.018);
  const glass=extruded(p,name+'_vidrio',archShape(w,h,.16),.018,[0,0,.078],P.blue,.007);
  glass.material=material('#ffffff','glass');
  if(options.curtains!==false){
    for(const sign of [-1,1]){
      const curtain=extruded(p,`${name}_cortina_${sign}`,archShape(w*.24,h*.88,.04),.022,
        [sign*w*.34,-.014,.092],P.flowerCream,.006);curtain.rotation.z=sign*.06;
      tubo(p,`${name}_pliegue_${sign}`,[[sign*w*.33,-h*.37,.113],[sign*w*.32,0,.112],[sign*w*.36,h*.31,.11]],.005,P.cream,6,3);
    }
  }
  caja(p,name+'_montante',[.037,h+.014,.055],[0,0,.118],P.cream,.009);
  caja(p,name+'_travesano',[w+.01,.035,.055],[0,-.035,.118],P.cream,.009);
  caja(p,name+'_alfeizar',[w+.24,.09,.22],[0,-h/2-.083,.045],P.woodLight,.025);
  if(options.shutters){
    for(const sign of [-1,1]){
      const sh=grupo(name+'_postigo_'+sign,p,[sign*(w*.73+.055),0,.014]);sh.rotation.y=sign*.13;
      for(let i=0;i<2;i++)plank(sh,`${name}_postigo_tabla_${sign}_${i}`,w*.24,h*.96,.045,[(i-.5)*w*.25,0,0],P.sage,2+i,false);
      for(const y of [-h*.3,h*.3])caja(sh,`${name}_postigo_refuerzo_${sign}_${y}`,[w*.47,.05,.04],[0,y,.04],P.sageDark,.007);
    }
  }
  if(options.flowers)flowerbox(p,name+'_jardinera',w+.2,[0,-h/2-.24,.15]);
  return p;
}

function door(parent,name,pos,w=.72,h=1.3,color=P.wood,arch=true) {
  const p=grupo(name,parent,pos);
  extruded(p,name+'_marco',arch?archShape(w+.16,h+.13,.24):archShape(w+.16,h+.13,.025),.14,[0,0,0],P.cream,.025);
  extruded(p,name+'_hueco',arch?archShape(w,h,.2):archShape(w,h,.018),.032,[0,-.005,.089],P.woodDark,.012);
  for(let i=0;i<4;i++){
    const x=(i-1.5)*w/4,top=arch?(i===0||i===3?.095:.015):.015;
    plank(p,`${name}_tabla_${i}`,w/4-.017,h-top-.045,.045,[x,-top/2,.119],i%2?color:new THREE.Color(color).multiplyScalar(1.08).getStyle(),i);
  }
  for(const y of [-h*.28,h*.2]){
    caja(p,name+'_bisagra_'+y,[w*.35,.055,.018],[-w*.27,y,.16],P.metal,.012);
    nail(p,name+'_clavo_'+y,-w*.39,y,.18,.014);
  }
  const knob=esfera(p,name+'_pomo',[.065,.065,.07],[w*.31,-.02,.185],P.brass);knob.material=material('#ffffff','metal');
  caja(p,name+'_placa_pomo',[.074,.15,.014],[w*.31,-.02,.156],P.metal,.027);
  return p;
}

function granero(){
  const r=grupo('granero');foundation(r,'gr_base',3.08,2.46,.32);
  // Hueco real detrás de las puertas: al abrirlas se ve el interior del granero.
  caja(r,'gr_pared_fondo',[2.9,1.89,.14],[0,1.245,-1.085],P.coralDark,.045);
  for(const sign of [-1,1]){
    caja(r,'gr_muro_costado_'+sign,[.14,1.89,2.31],[sign*1.38,1.245,0],P.coralDark,.045);
    caja(r,'gr_muro_frontal_'+sign,[.72,1.65,.15],[sign*1.09,1.125,1.08],P.coralDark,.045);
  }
  caja(r,'gr_dintel_interior',[2.9,.30,.15],[0,2.04,1.08],P.coralDark,.03);
  caja(r,'gr_suelo_interior',[2.69,.085,2.1],[0,.347,0],P.woodDark,.025);
  gable(r,'gr_fronton',2.89,.94,2.3,2.16,P.coral);
  for(let i=0;i<13;i++){
    const x=(i-6)*.218,aboveDoor=Math.abs(x)<.77;
    plank(r,'gr_tabla_frontal_'+i,.209,aboveDoor?.245:1.75,.045,[x,aboveDoor?2.018:1.265,1.18],i%3?P.coral:P.coralDark,i,i<3||i>9);
  }
  for(const sign of [-1,1]){
    const wall=grupo('gr_lateral_'+sign,r,[sign*1.47,1.23,0]);wall.rotation.y=sign*Math.PI/2;
    for(let i=0;i<10;i++)plank(wall,`gr_tabla_costado_${sign}_${i}`,.211,1.77,.045,[(i-4.5)*.225,0,0],i%3?P.coral:P.coralDark,i,i%3===0);
    for(const z of [-1.16,1.16])caja(r,`gr_esquina_${sign}_${z}`,[.14,1.91,.14],[sign*1.405,1.245,z],P.cream,.026);
    barra(r,'gr_cruz_lateral_'+sign,[sign*1.49,.5,-1.03],[sign*1.49,1.99,1.01],.036,P.cream);
  }
  roof(r,'gr_techo',3.46,2.85,2.16,1.07,P.roof,3,8);
  caja(r,'gr_friso',[2.94,.12,.115],[0,2.11,1.21],P.cream,.023);
  const panels=[];
  for(const sign of [-1,1]){
    const p=grupo('gr_puerta_pivote_'+sign,r,[sign*.71,.38,1.23]);
    const cx=-sign*.345;
    for(let i=0;i<3;i++)plank(p,`gr_puerta_${sign}_${i}`,.221,1.36,.07,[cx+(i-1)*.228,.7,0],i%2?P.woodLight:P.wood,i);
    for(const y of [.08,1.32])caja(p,`gr_puerta_bastidor_${sign}_${y}`,[.69,.084,.067],[cx,y,.07],P.cream,.02);
    barra(p,'gr_puerta_diagonal_'+sign,[cx-.3,.14,.086],[cx+.3,1.26,.086],.031,P.cream);
    for(const y of [.26,1.12]){caja(p,`gr_herrajes_${sign}_${y}`,[.24,.07,.025],[-sign*.09,y,.12],P.metal,.019);nail(p,`gr_remache_${sign}_${y}`,-sign*.18,y,.145,.015);}
    ring(p,'gr_asa_'+sign,.052,.013,[-sign*.61,.73,.128],P.metal,'z');
    panels.push(p);
  }
  caja(r,'gr_riel',[1.65,.085,.15],[0,1.87,1.25],P.woodDark,.025);
  window(r,'gr_altillo',[0,2.53,1.18],.43,.48,{curtains:false});
  const side=window(r,'gr_ventana_lateral',[1.525,1.47,-.17],.55,.64,{flowers:true});side.rotation.y=Math.PI/2;
  // Elementos interiores sencillos que dan profundidad a la entrada abierta.
  for(let i=0;i<3;i++)caja(r,'gr_paca_interior_'+i,[.56,.32,.44],[-.84+i*.57,.545,-.67],i%2?P.hay:P.hayLight,.08);
  for(let i=0;i<2;i++)stone(r,'gr_peldano_'+i,[1.58,.12,.35],[0,.06+i*.12,1.63-i*.22],i+1);
  pot(r,'gr_maceta',[-1.17,.33,1.4],.9,false);
  const open=new THREE.AnimationClip('abrir',-1,[...giroClip('a',panels[0],'y',[0,-1.38],[0,1.1]).tracks,...giroClip('b',panels[1],'y',[0,1.38],[0,1.1]).tracks]);
  const close=new THREE.AnimationClip('cerrar',-1,[...giroClip('a',panels[0],'y',[-1.38,0],[0,1.1]).tracks,...giroClip('b',panels[1],'y',[1.38,0],[0,1.1]).tracks]);
  return finish('granero','Granero artesanal','edificios',r,[3.9,3.55],[open,close]);
}

function molino(){
  const r=grupo('molino');
  cilindro(r,'mo_base',.83,.91,.22,[0,.11,0],P.stoneDark,18);
  cilindro(r,'mo_torre',.5,.74,2.2,[0,1.3,0],P.cream,18);
  for(let row=0;row<3;row++)for(let i=0;i<12;i++){
    const a=i*Math.PI/6+(row%2)*.22,rad=.738-row*.045;
    const s=stone(r,`mo_sillar_${row}_${i}`,[.325,.18,.11],[Math.sin(a)*rad,.15+row*.205,Math.cos(a)*rad],i+row);
    s.rotation.y=a;
  }
  // Cubierta de perfil cóncavo con fajas y juntas de cobre envejecido.
  // LatheGeometry espera recorrer el perfil exterior de abajo hacia arriba.
  // Ese orden mantiene las normales hacia fuera y evita una cubierta invertida.
  const points=[[0,2.43],[.77,2.43],[.79,2.49],[.62,2.74],[.4,3.01],[.13,3.23],[0,3.38]].map(([x,y])=>new THREE.Vector2(x,y));
  malla(r,'mo_cubierta',new THREE.LatheGeometry(points,20),[0,0,0],P.roof);
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5;
    tubo(r,'mo_junta_techo_'+i,[[Math.sin(a)*.79,2.49,Math.cos(a)*.79],[Math.sin(a)*.61,2.75,Math.cos(a)*.61],
      [Math.sin(a)*.39,3.02,Math.cos(a)*.39],[Math.sin(a)*.12,3.24,Math.cos(a)*.12]],.015,P.roofLight,10,4);
  }
  ring(r,'mo_alero',.76,.055,[0,2.46,0],P.woodDark);
  door(r,'mo_puerta',[0,.84,.67],.43,1.05,P.woodLight);
  const win=window(r,'mo_ventana',[.55,1.66,.31],.33,.45,{curtains:false});win.rotation.y=.92;
  const rotor=grupo('mo_rotor',r,[0,2.35,.95]);
  barra(r,'mo_eje',[0,2.35,.43],[0,2.35,1.05],.085,P.metal);
  for(let i=0;i<4;i++){
    const blade=grupo('mo_aspa_'+i,rotor);blade.rotation.z=i*Math.PI/2+.18;
    caja(blade,'mo_larguero_'+i,[.072,1.42,.077],[0,.72,0],P.wood,.022);
    const sail=new THREE.Shape();sail.moveTo(-.03,.43);sail.lineTo(-.33,.56);sail.lineTo(-.4,1.4);sail.quadraticCurveTo(-.2,1.34,-.03,1.4);sail.closePath();
    extruded(blade,'mo_lona_'+i,sail,.022,[0,0,.025],P.creamLight,.012);
    caja(blade,'mo_lona_borde_'+i,[.027,.89,.037],[-.34,.97,.052],P.woodLight,.008).rotation.z=-.06;
    for(let j=0;j<5;j++){
      caja(blade,`mo_travesano_${i}_${j}`,[.4,.031,.04],[-.155,.56+j*.2,.065],P.woodLight,.008);
    }
    for(const y of [.53,1.35])nail(blade,`mo_aspa_perno_${i}_${y}`,0,y,.061,.024);
  }
  esfera(rotor,'mo_cubo',[.3,.3,.2],[0,0,.055],P.wood);
  ring(rotor,'mo_aro_cubo',.106,.018,[0,0,.167],P.metal,'z');
  esfera(rotor,'mo_tapa_cubo',[.105,.105,.07],[0,0,.175],P.brass);
  stone(r,'mo_escalon',[.78,.12,.45],[0,.06,.97],1);
  return finish('molino','Molino de velas y piedra','edificios',r,[3.35,2.6],
    [giroClip('idle',rotor,'z',[0,-Math.PI/2,-Math.PI,-Math.PI*1.5,-Math.PI*2],[0,3,6,9,12])]);
}

function gallinero(){
  const r=grupo('gallinero');
  for(const x of [-.72,.72])for(const z of [-.48,.48]){
    caja(r,`ga_pata_${x}_${z}`,[.15,.52,.15],[x,.26,z],P.woodDark,.03);
    stone(r,`ga_apoyo_${x}_${z}`,[.25,.13,.24],[x,.065,z],1);
  }
  caja(r,'ga_tarima',[1.73,.13,1.32],[0,.53,0],P.wood,.025);
  caja(r,'ga_cuerpo',[1.5,1.02,1.16],[0,1.11,0],P.cream,.07);
  for(let i=0;i<7;i++)plank(r,'ga_revestimiento_'+i,.201,.97,.036,[(i-3)*.211,1.12,.603],i%2?P.cream:P.creamLight,i,false);
  gable(r,'ga_fronton',1.5,.49,1.16,1.61,P.cream);
  roof(r,'ga_techo',1.98,1.61,1.61,.6,P.sageDark,3,5);
  extruded(r,'ga_marco_entrada',archShape(.54,.68,.21),.075,[-.34,.93,.647],P.wood,.018);
  extruded(r,'ga_hueco_entrada',archShape(.4,.57,.2),.014,[-.34,.904,.698],P.dark,.009);
  window(r,'ga_ventana',[.4,1.25,.635],.29,.35,{curtains:false});
  const ramp=grupo('ga_rampa',r,[-.34,.307,1.22]);ramp.rotation.x=.39;
  for(let i=0;i<3;i++)plank(ramp,'ga_rampa_tabla_'+i,.17,1.35,.066,[(i-1)*.18,0,0],P.wood,i,false).rotation.x=Math.PI/2;
  for(let i=0;i<7;i++)caja(ramp,'ga_peldano_'+i,[.56,.047,.057],[0,.069,-.56+i*.185],P.woodLight,.014);
  caja(r,'ga_nidal',[.53,.5,.87],[.98,1.02,-.035],P.coral,.05);
  for(let i=0;i<4;i++)caja(r,'ga_nidal_tabla_'+i,[.025,.43,.033],[1.252,1.02,-.34+i*.205],P.roofLight,.007);
  const lid=caja(r,'ga_tapa_nidal',[.64,.09,.98],[1.005,1.3,-.035],P.sage,.026);lid.rotation.z=-.11;
  caja(r,'ga_cierre',[.035,.17,.075],[1.285,1.195,.11],P.metal,.012);
  const nest=grupo('ga_nido',r,[-.3,.62,.63]);
  for(let i=0;i<5;i++)ring(nest,'ga_paja_nido_'+i,.12+i*.009,.014,[0,i*.013,0],P.hay);
  esfera(nest,'ga_huevo',[.12,.155,.12],[0,.07,.025],P.creamLight);
  return finish('gallinero','Gallinero con nidal y rampa','edificios',r,[2.75,2.8]);
}

function puesto(){
  const r=grupo('puesto_mercado');
  for(let i=0;i<7;i++)plank(r,'pu_tarima_'+i,.325,1.4,.07,[(i-3)*.33,.09,0],i%2?P.wood:P.woodLight,i,false).rotation.x=Math.PI/2;
  caja(r,'pu_cuerpo',[2.1,.83,.98],[0,.57,.13],P.sageDark,.055);
  for(let i=0;i<10;i++)plank(r,'pu_frontal_'+i,.192,.73,.033,[(i-4.5)*.205,.59,.645],i%2?P.sage:P.sageDark,i,i%3===0);
  caja(r,'pu_marco_inferior',[2.2,.12,.09],[0,.21,.69],P.cream,.022);
  for(let i=0;i<3;i++)plank(r,'pu_encimera_'+i,2.28,.32,.085,[0,1.05,-.2+i*.325],P.woodLight,i,false).rotation.x=Math.PI/2;
  for(const sign of [-1,1]){
    caja(r,'pu_poste_'+sign,[.13,2.03,.13],[sign*1.03,1.13,-.45],P.wood,.03);
    barra(r,'pu_riostra_'+sign,[sign*1.03,1.66,-.45],[sign*.71,2.07,-.45],.043,P.woodLight);
  }
  barra(r,'pu_viga',[-1.2,2.17,-.45],[1.2,2.17,-.45],.063,P.woodDark);
  // Lona curva con costuras y faldón recortado, no plano rígido.
  for(let i=0;i<8;i++){
    const x0=-1.25+i*.3125,x1=x0+.314;
    const positions=[],idx=[];
    for(let j=0;j<=7;j++){
      const z=-.6+j*.22,y=2.2-.16*((z+.6)/1.54)+.11*Math.sin((z+.6)/1.54*Math.PI);
      positions.push(x0,y,z,x1,y,z);
      if(j<7){const a=j*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(idx);geo.computeVertexNormals();
    const mat=malla(r,'pu_lona_'+i,geo,[0,0,0],i%2?P.creamLight:P.coral);mat.material=material('#ffffff','clay');
    const s=new THREE.Shape();s.moveTo(-.156,0);s.lineTo(.156,0);s.lineTo(.156,-.11);s.quadraticCurveTo(.12,-.21,0,-.21);s.quadraticCurveTo(-.12,-.21,-.156,-.11);s.closePath();
    extruded(r,'pu_feston_'+i,s,.034,[x0+.157,2.04,.94],i%2?P.creamLight:P.coral,.007);
  }
  for(let i=0;i<3;i++){
    const x=(i-1)*.73;
    caja(r,'pu_cajita_'+i,[.64,.14,.61],[x,1.145,.12],P.wood,.025);
    for(let j=0;j<6;j++){
      const z=-.02+Math.floor(j/3)*.245,px=x+(j%3-1)*.18;
      const fruit=esfera(r,`pu_fruto_${i}_${j}`,[.16,.165,.155],[px,1.27,z],[P.coral,P.hay,P.sage][i]);
      barra(r,`pu_pedunculo_${i}_${j}`,[px,1.32,z],[px+.008,1.371,z],.012,P.woodDark);
    }
  }
  const sign=grupo('pu_cartel',r,[0,1.8,-.42]);
  caja(sign,'pu_placa',[.9,.3,.055],[0,0,0],P.woodDark,.06);
  for(const x of [-.32,.32])barra(r,'pu_cuerda_'+x,[x,2.12,-.42],[x,1.92,-.42],.012,P.hay);
  barra(sign,'pu_emblema_tallo',[0,-.085,.048],[0,.085,.048],.017,P.cream);
  hoja(sign,'pu_emblema_hoja',.16,.08,[.05,.055,.045],P.cream,[0,0,-.9]);
  return finish('puesto_mercado','Puesto de cosecha con toldo de lona','edificios',r,[2.7,1.85]);
}

function pozo(){
  const r=grupo('pozo');
  cilindro(r,'pz_agua',.47,.47,.024,[0,.22,0],P.water,24).material=material('#ffffff','glass');
  for(let row=0;row<3;row++)for(let i=0;i<12;i++){
    const a=i*Math.PI/6+(row%2)*Math.PI/12;
    const block=stone(r,`pz_bloque_${row}_${i}`,[.31,.19,.23],[Math.sin(a)*.59,.1+row*.185,Math.cos(a)*.59],row+i);
    block.rotation.y=a+Math.sin(i)*.014;
  }
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;const rim=stone(r,'pz_coronacion_'+i,[.355,.1,.31],[Math.sin(a)*.58,.59,Math.cos(a)*.58],i+1);rim.rotation.y=a;
  }
  for(const sign of [-1,1]){
    caja(r,'pz_poste_'+sign,[.145,1.7,.145],[sign*.82,.85,0],P.wood,.03);
    caja(r,'pz_zapata_'+sign,[.21,.2,.21],[sign*.82,.1,0],P.woodDark,.025);
    barra(r,'pz_refuerzo_'+sign,[sign*.82,1.23,0],[sign*.57,1.69,0],.04,P.woodLight);
    for(const y of [.23,1.27])nail(r,`pz_clavo_${sign}_${y}`,sign*.82,y,.087,.02);
  }
  roof(r,'pz_techo',2.08,1.4,1.68,.48,P.roof,2,5);
  const crank=grupo('pz_manivela',r,[0,1.15,0]);
  barra(crank,'pz_eje',[-.94,0,0],[1.02,0,0],.063,P.woodDark);
  const axle=cilindro(crank,'pz_tambor',.122,.122,.45,[0,0,0],P.woodLight,14);axle.rotation.z=Math.PI/2;
  for(let i=0;i<9;i++)ring(crank,'pz_cuerda_enrollada_'+i,.127,.012,[-.17+i*.043,0,0],P.hay,'x');
  for(const x of [-.29,.29]){const disc=cilindro(crank,'pz_tope_'+x,.16,.16,.06,[x,0,0],P.wood,12);disc.rotation.z=Math.PI/2;}
  barra(crank,'pz_brazo',[1.01,0,0],[1.01,-.24,0],.03,P.metal);
  barra(crank,'pz_asidero',[1.01,-.24,0],[1.23,-.24,0],.043,P.wood);
  tubo(r,'pz_cuerda_suspendida',[[.12,1.1,.095],[.125,.8,.098],[.1,.55,.09]],.012,P.hay,10,4);
  const bucket=grupo('pz_cubo',r,[.1,.43,.09]);
  cilindro(bucket,'pz_cubo_madera',.155,.116,.24,[0,.12,0],P.wood,12);
  for(const y of [.04,.205])ring(bucket,'pz_abrazadera_'+y,.135+y*.07,.012,[0,y,0],P.metal);
  cilindro(bucket,'pz_cubo_hueco',.131,.131,.008,[0,.244,0],P.dark,12);
  ring(bucket,'pz_asa',.137,.014,[0,.285,0],P.metal,'z');
  return finish('pozo','Pozo de cantería con torno','edificios',r,[2.7,1.6],
    [giroClip('extraer_agua',crank,'x',[0,Math.PI/2,Math.PI,Math.PI*1.5,Math.PI*2],[0,.75,1.5,2.25,3])]);
}

function fencePost(parent,name,x,h=1.1){
  caja(parent,name+'_poste',[.17,h,.18],[x,h/2,0],P.woodLight,.028);
  const pyramid=cono(parent,name+'_punta',.125,.14,[x,h+.035,0],P.cream);pyramid.rotation.y=Math.PI/4;
  stone(parent,name+'_apoyo',[.245,.12,.25],[x,.06,0],1);
  for(const y of [.38,.8])nail(parent,name+'_clavo_'+y,x,y,.122,.018);
}

function cerca(){
  const r=grupo('cerca');[-.95,.95].forEach((x,i)=>fencePost(r,'ce_'+i,x));
  for(const y of [.35,.78]){
    const p=grupo('ce_riel_'+y,r,[0,y,.045]);p.rotation.z=Math.PI/2;
    plank(p,'ce_tabla_'+y,.12,1.96,.075,[0,0,0],P.woodLight,1,true);
  }
  for(let i=0;i<5;i++){
    const x=(i-2)*.32;
    plank(r,'ce_liston_'+i,.1,.65,.055,[x,.6,.083],i%2?P.cream:P.woodLight,i,false);
    nail(r,'ce_remache_'+i,x,.77,.12,.013);
  }
  for(const x of [-.93,.93])hoja(r,'ce_hierba_'+x,.21,.055,[x,.1,.12],P.leafLight,[.3,0,x]);
  return finish('cerca','Cerca modular de carpintería','decoracion',r,[2.2,.4]);
}

function porton(){
  const r=grupo('porton');[-1,1].forEach((x,i)=>fencePost(r,'pt_'+i,x,1.25));
  const leaf=grupo('pt_hoja',r,[-.86,0,.04]);
  for(const y of [.31,1.02])caja(leaf,'pt_travesano_'+y,[1.71,.11,.09],[.855,y,0],P.cream,.021);
  for(const x of [.035,1.675])plank(leaf,'pt_montante_'+x,.1,.83,.1,[x,.66,0],P.cream,2,false);
  for(let i=0;i<6;i++){
    const x=.19+i*.263;plank(leaf,'pt_liston_'+i,.15,.72,.055,[x,.665,-.018],i%2?P.sage:P.sageDark,i);
    nail(leaf,'pt_clavo_'+i,x,1.025,.068,.016);
  }
  barra(leaf,'pt_refuerzo_diagonal',[.09,.36,.07],[1.6,.97,.07],.033,P.cream);
  for(const y of [.39,.95]){
    caja(leaf,'pt_bisagra_'+y,[.23,.075,.033],[.085,y,.092],P.metal,.014);
    cilindro(leaf,'pt_eje_bisagra_'+y,.027,.027,.14,[.004,y,.06],P.metal,10);
  }
  caja(leaf,'pt_pestillo',[.24,.048,.064],[1.64,.92,.095],P.metal,.018);
  ring(leaf,'pt_anilla',.045,.011,[1.5,.85,.099],P.brass,'z');
  return finish('porton','Portón con bisagras y pestillo','decoracion',r,[2.3,2.0],
    [giroClip('abrir',leaf,'y',[0,-.15,-1.4],[0,.18,1.05]),giroClip('cerrar',leaf,'y',[-1.4,-.15,0],[0,.86,1.05])]);
}

function sendero(){
  const r=grupo('sendero_piedra');
  for(let row=0;row<4;row++)for(let col=0;col<2;col++){
    const i=row*2+col,x=(col-.5)*.54+Math.sin(i*3)*.025,z=(row-1.5)*.52;
    const s=new THREE.Shape(),n=7;
    for(let j=0;j<n;j++){const a=j*Math.PI*2/n,rad=1+Math.sin(i*4+j*3)*.09;const px=Math.cos(a)*(.24+i%2*.022)*rad,py=Math.sin(a)*.232*rad;j?s.lineTo(px,py):s.moveTo(px,py);}s.closePath();
    const slab=extruded(r,'se_losa_'+i,s,.058,[x,.065,z],i%3?P.stoneLight:P.stone,.022);slab.rotation.x=-Math.PI/2;slab.rotation.z=Math.sin(i)*.15;
    if(i%2===0)tubo(r,'se_fisura_'+i,[[x-.12,.119,z-.04],[x-.025,.122,z+.014],[x+.085,.12,z+.035]],.004,P.stoneDark,6,3);
  }
  for(let i=0;i<5;i++){
    const x=(i%2?1:-1)*.51,z=-.85+i*.4;
    hoja(r,'se_hierba_'+i,.13,.039,[x,.085,z],P.sage,[.4,i*.9,.4]);
  }
  return finish('sendero_piedra','Losas de piedra irregular','decoracion',r,[1.25,2.25]);
}

function puente(){
  const r=grupo('puente_madera');
  for(let i=0;i<11;i++){
    const z=(i-5)*.235,y=.095+.24*(1-z*z/1.4);
    const board=grupo('pe_tablon_'+i,r,[0,y,z]);board.rotation.x=Math.atan(.343*z);
    plank(board,'pe_madera_'+i,1.3,.218,.076,[0,0,0],i%3?P.wood:P.woodLight,i,false).rotation.x=Math.PI/2;
    for(const x of [-.49,.49])nail(board,`pe_clavo_${i}_${x}`,x,0,.042,.018).rotation.x=0;
    for(let k=0;k<2;k++)tubo(board,`pe_veta_${i}_${k}`,[[-.4,.047,(k-.5)*.06],[-.03,.049,(k-.5)*.06+.018],[.37,.047,(k-.5)*.06]],.004,P.grain,6,3);
  }
  for(const sign of [-1,1]){
    const points=[];
    for(let i=0;i<5;i++){
      const z=(i-2)*.57,y=.12+.21*(1-z*z/1.4);
      caja(r,`pe_poste_${sign}_${i}`,[.105,.64,.115],[sign*.7,y+.3,z],P.wood,.025);
      esfera(r,`pe_capuchon_${sign}_${i}`,[.155,.105,.155],[sign*.7,y+.655,z],P.cream);
      points.push([sign*.7,y+.52,z]);
    }
    tubo(r,'pe_pasamanos_'+sign,points,.049,P.woodLight,24,7);
    tubo(r,'pe_longeron_'+sign,points.map(p=>[p[0],p[1]-.57,p[2]]),.055,P.woodDark,24,6);
  }
  return finish('puente_madera','Puente curvo de tablones','decoracion',r,[1.6,2.7]);
}

function barril(){
  const r=grupo('barril');
  const profile=[[.272,.04],[.325,.13],[.362,.35],[.36,.47],[.317,.71],[.267,.8]].map(([x,y])=>new THREE.Vector2(x,y));
  for(let i=0;i<14;i++){
    const g=new THREE.LatheGeometry(profile,2,i*Math.PI*2/14+.008,Math.PI*2/14-.016);
    malla(r,'ba_duela_'+i,g,[0,0,0],i%3?P.wood:P.woodLight);
    const a=(i+.5)*Math.PI*2/14;
    tubo(r,'ba_veta_'+i,[[Math.sin(a)*.33,.19,Math.cos(a)*.33],[Math.sin(a+.017)*.365,.38,Math.cos(a+.017)*.365],[Math.sin(a)*.34,.61,Math.cos(a)*.34]],.004,P.grain,8,3);
  }
  for(const y of [.18,.64]){
    ring(r,'ba_abrazadera_'+y,y<.2?.343:.342,.028,[0,y,0],P.metal);
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7;esfera(r,`ba_remache_${y}_${i}`,[.031,.031,.031],[Math.sin(a)*.367,y,Math.cos(a)*.367],P.brass);}
  }
  cilindro(r,'ba_tapa',.268,.268,.037,[0,.782,0],P.woodLight,18);
  for(const x of [-.12,0,.12])caja(r,'ba_junta_tapa_'+x,[.01,.009,Math.sqrt(.268*.268-x*x)*1.8],[x,.805,0],P.grain,.003);
  ring(r,'ba_borde',.275,.017,[0,.803,0],P.woodDark);
  cilindro(r,'ba_tapon',.045,.037,.03,[.1,.82,.075],P.wood,10);
  return finish('barril','Barril de duelas y aros','decoracion',r,[.82,.82]);
}

function paca(){
  const r=grupo('paca_heno');caja(r,'pa_cuerpo',[1.03,.63,.73],[0,.315,0],P.hay,.14);
  for(let i=0;i<26;i++){
    const y=.08+(i%7)*.075,x=-.4+(i%4)*.26,z=(i%2?.366:-.366);
    tubo(r,'pa_fibra_'+i,[[x,y,z],[x+.085,y+.012,z+.004],[x+.19,y-.004,z]],.006,i%3?P.hayLight:P.woodLight,4,3);
  }
  for(const x of [-.31,.31]){
    tubo(r,'pa_cuerda_'+x,[[x,.045,.30],[x,.14,.372],[x,.52,.372],[x,.636,.26],[x,.638,-.26],[x,.52,-.371],[x,.13,-.371],[x,.04,-.3]],.018,P.wood,22,5);
    for(let k=0;k<3;k++)barra(r,`pa_nudo_${x}_${k}`,[x-.02,.632+k*.003,.075],[x+.034,.649+k*.003,.13],.009,P.woodDark);
  }
  for(let i=0;i<6;i++)barra(r,'pa_hebra_suelta_'+i,[-.43+i*.16,.625,-.19],[ -.38+i*.16,.657,-.07],.007,P.hayLight);
  return finish('paca_heno','Paca de heno atada','decoracion',r,[1.12,.84]);
}

function cajon(){
  const r=grupo('cajon');
  for(let i=0;i<4;i++)plank(r,'cj_fondo_'+i,.184,.67,.042,[(i-1.5)*.193,.04,0],P.woodLight,i,false).rotation.x=Math.PI/2;
  for(let row=0;row<3;row++){
    const y=.125+row*.122;
    for(const sign of [-1,1]){
      const front=grupo(`cj_tabla_larga_${row}_${sign}`,r,[0,y,sign*.323]);
      plank(front,'cj_larga_'+row+'_'+sign,.083,.81,.045,[0,0,0],row%2?P.wood:P.woodLight,row,false).rotation.z=Math.PI/2;
      const end=grupo(`cj_extremo_${row}_${sign}`,r,[sign*.39,y,0]);end.rotation.y=Math.PI/2;
      plank(end,'cj_corta_'+row+'_'+sign,.079,.626,.045,[0,0,0],row%2?P.woodLight:P.wood,row,false).rotation.z=Math.PI/2;
    }
  }
  for(const x of [-.34,.34])for(const z of [-.28,.28]){
    caja(r,'cj_esquina_'+x+'_'+z,[.055,.43,.055],[x,.225,z],P.woodDark,.014);
    for(const y of [.13,.37])nail(r,`cj_clavo_${x}_${z}_${y}`,x,y,Math.sign(z)*.353,.012);
  }
  for(const sign of [-1,1]){
    caja(r,'cj_asa_oscura_'+sign,[.013,.038,.22],[sign*.419,.37,0],P.woodDark,.018);
  }
  return finish('cajon','Cajón de tablillas con asas','decoracion',r,[.9,.75]);
}

function letrero(){
  const r=grupo('letrero');
  caja(r,'le_poste',[.14,1.34,.14],[0,.67,0],P.wood,.03);
  stone(r,'le_base',[.28,.14,.26],[0,.07,0],1);
  const board=grupo('le_tabla',r,[0,1.065,.055]);board.rotation.z=-.025;
  extruded(board,'le_marco',archShape(1.16,.59,.12),.085,[0,0,0],P.woodLight,.028);
  extruded(board,'le_campo',archShape(1.025,.454,.1),.029,[0,0,.063],P.sageDark,.021);
  tubo(board,'le_borde_interior',[[-.46,-.16,.09],[-.47,.1,.09],[-.31,.17,.09],[.31,.17,.09],[.47,.1,.09],[.46,-.16,.09]],.01,P.sage,20,4);
  barra(board,'le_emblema_tallo',[0,-.14,.101],[0,.13,.101],.022,P.cream);
  hoja(board,'le_emblema_hoja_a',.22,.105,[-.074,.015,.104],P.cream,[0,0,.8]);
  hoja(board,'le_emblema_hoja_b',.2,.105,[.073,.08,.104],P.hayLight,[0,0,-.8]);
  for(const x of [-.47,.47])nail(board,'le_clavo_'+x,x,-.085,.102,.019);
  for(const z of [-.05,.07])hoja(r,'le_hierba_'+z,.2,.055,[.13,.1,z],P.leafLight,[.2,0,.75]);
  return finish('letrero','Letrero tallado de la granja','decoracion',r,[1.3,.4]);
}

function lantern(parent,name,pos,scale=1){
  const p=grupo(name,parent,pos);p.scale.setScalar(scale);
  ring(p,name+'_anilla',.067,.014,[0,.16,0],P.metal,'z');
  cono(p,name+'_tejado',.213,.13,[0,.058,0],P.sageDark);
  caja(p,name+'_cristal',[.245,.31,.245],[0,-.16,0],P.flowerCream,.05).material=material('#ffffff','glass');
  caja(p,name+'_base',[.3,.07,.3],[0,-.35,0],P.metal,.028);
  for(const x of [-.135,.135])for(const z of [-.135,.135])barra(p,`${name}_montante_${x}_${z}`,[x,-.33,z],[x,.012,z],.016,P.metal);
  esfera(p,name+'_llama',[.063,.14,.062],[0,-.17,0],material(P.hayLight,'emissive'));
  cilindro(p,name+'_vela',.04,.04,.08,[0,-.285,0],P.cream,10);
  return p;
}

function farol(){
  const r=grupo('farol');
  stone(r,'fa_zocalo',[.35,.16,.35],[0,.08,0],1);
  cilindro(r,'fa_base_metal',.13,.15,.18,[0,.25,0],P.metal,12);
  cilindro(r,'fa_poste',.048,.067,1.49,[0,1.055,0],P.metal,12);
  for(const y of [.35,1.67])ring(r,'fa_collar_'+y,.071,.017,[0,y,0],P.brass);
  tubo(r,'fa_brazo_curvo',[[0,1.79,0],[.04,1.97,0],[.24,2.01,0],[.43,1.87,0],[.43,1.77,0]],.035,P.metal,20,7);
  const lamp=lantern(r,'fa_lampara',[.43,1.63,0]);
  return finish('farol','Farol de forja y cristal','decoracion',r,[1.05,.52],
    [giroClip('idle',lamp,'z',[0,.045,0,-.045,0],[0,1.2,2.4,3.6,4.8])]);
}

function regadera(){
  const r=grupo('regadera');
  const shape=[[0,.03],[.237,.03],[.267,.09],[.258,.34],[.23,.43],[.195,.44],[.195,.425],[0,.425]].map(([x,y])=>new THREE.Vector2(x,y));
  malla(r,'re_cuerpo',new THREE.LatheGeometry(shape,20),[0,0,0],P.sage);
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5;
    tubo(r,'re_nervadura_'+i,[[Math.sin(a)*.25,.09,Math.cos(a)*.25],[Math.sin(a)*.265,.24,Math.cos(a)*.265],[Math.sin(a)*.247,.36,Math.cos(a)*.247]],.005,P.sageDark,6,3);
  }
  ring(r,'re_borde',.22,.021,[0,.435,0],P.cream);
  cilindro(r,'re_hueco',.191,.191,.008,[0,.441,0],P.dark,20);
  tubo(r,'re_asa',[[ -.18,.37,0],[-.39,.48,0],[-.52,.32,0],[-.48,.12,0],[-.24,.09,0]],.035,P.sageDark,20,8);
  tubo(r,'re_arco_superior',[[-.15,.41,0],[-.1,.63,0],[.16,.61,0],[.21,.4,0]],.025,P.woodLight,16,6);
  const start=new THREE.Vector3(.17,.16,0),end=new THREE.Vector3(.58,.5,0),dir=end.clone().sub(start);
  const spout=cilindro(r,'re_pico',.032,.068,dir.length(),start.clone().add(end).multiplyScalar(.5).toArray(),P.sage,14);
  spout.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
  const nozzle=grupo('re_roseta',r,[.59,.51,0]);nozzle.quaternion.copy(spout.quaternion);
  cilindro(nozzle,'re_difusor',.12,.036,.10,[0,0,0],P.brass,16);
  cilindro(nozzle,'re_cara',.116,.116,.009,[0,.055,0],P.cream,16);
  for(let i=0;i<9;i++){const a=i*Math.PI*2/8,rad=i===8?0:.075;esfera(nozzle,'re_agujero_'+i,[.019,.007,.019],[Math.sin(a)*rad,.062,Math.cos(a)*rad],P.metal);}
  return finish('regadera','Regadera acanalada de jardín','herramientas',r,[1.3,.63]);
}

function casita(){
  const r=grupo('casita_pueblo');foundation(r,'ca_cimientos',2.6,2.2,.32);
  caja(r,'ca_muros',[2.43,1.65,2.04],[0,1.135,0],P.cream,.10);
  gable(r,'ca_hastial',2.43,.83,2.03,1.95,P.cream);
  for(const sign of [-1,1]){
    caja(r,'ca_viga_esquina_'+sign,[.13,1.68,.13],[sign*1.19,1.16,1.025],P.wood,.026);
    caja(r,'ca_viga_posterior_'+sign,[.13,1.68,.13],[sign*1.19,1.16,-1.025],P.wood,.026);
    barra(r,'ca_riostra_'+sign,[sign*1.13,1.92,1.064],[sign*.81,1.62,1.064],.031,P.wood);
  }
  roof(r,'ca_toit',3.03,2.62,1.96,.99,P.sageDark,3,7);
  caja(r,'ca_viga_frontal',[2.47,.11,.14],[0,1.94,1.04],P.wood,.022);
  door(r,'ca_porte',[-.48,1.035,1.065],.68,1.28,P.coral);
  window(r,'ca_fenetre',[.67,1.34,1.05],.46,.58,{shutters:true,flowers:true});
  window(r,'ca_grenier',[0,2.27,1.05],.35,.36,{curtains:true});
  const side=window(r,'ca_costado',[1.26,1.35,-.1],.58,.67,{shutters:true,flowers:true});side.rotation.y=Math.PI/2;
  for(let i=0;i<3;i++)stone(r,'ca_escalon_'+i,[1.18,.1,.3],[-.48,.05+i*.1,1.71-i*.22],i+1);
  const porch=grupo('ca_porch',r,[-.48,0,1.33]);
  const canopy=caja(porch,'ca_marquesina',[1.2,.08,.65],[0,1.82,0],P.roof,.03);canopy.rotation.x=-.1;
  for(const x of [-.52,.52])barra(porch,'ca_mensula_'+x,[x,1.44,-.19],[x,1.76,.17],.036,P.wood);
  lantern(r,'ca_aplique',[-1.035,1.45,1.18],.5);
  caja(r,'ca_chimenea',[.39,.85,.43],[-.83,2.78,-.5],P.stoneLight,.035);
  for(let i=0;i<3;i++)caja(r,'ca_chimenea_junta_'+i,[.409,.018,.445],[-.83,2.53+i*.2,-.5],P.stone,.009);
  caja(r,'ca_chapeau',[.49,.1,.53],[-.83,3.22,-.5],P.stoneDark,.025);
  caja(r,'ca_cheminee_hueco',[.28,.019,.32],[-.83,3.28,-.5],P.dark,.022);
  pot(r,'ca_maceta',[.35,.32,1.42],.88,true);
  return finish('casita_pueblo','Casita del pueblo con porche','edificios',r,[3.6,3.3]);
}

function invernadero(){
  const r=grupo('invernadero');foundation(r,'iv_base',2.22,2.59,.25);
  const frame=P.cream,frameDark=P.sageDark;
  const glass=(name,size,pos,rotation=[0,0,0])=>{
    const o=caja(r,name,size,pos,P.glass,.009);o.rotation.set(...rotation);o.material=material('#ffffff','glass');return o;
  };
  for(const x of [-1.02,1.02])for(const z of [-1.2,-.4,.4,1.2]){
    caja(r,`iv_poste_${x}_${z}`,[.058,1.66,.058],[x,1.08,z],frame,.013);
  }
  for(const sign of [-1,1]){
    for(let i=0;i<3;i++){
      glass(`iv_cristal_lateral_${sign}_${i}`,[.026,1.45,.737],[sign*1.019,1.07,-.8+i*.8]);
      for(const y of [.37,1.09,1.83])caja(r,`iv_lateral_riel_${sign}_${i}_${y}`,[.066,.046,.8],[sign*1.021,y,-.8+i*.8],frame,.01);
    }
  }
  for(const z of [-1.2,1.2]){
    for(const x of [-.68,0,.68]){
      glass(`iv_panel_frente_${z}_${x}`,[.626,1.44,.025],[x,1.07,z]);
      caja(r,`iv_montante_${z}_${x}`,[.052,1.58,.058],[x-.34,1.08,z],frame,.012);
    }
    caja(r,'iv_friso_'+z,[2.12,.07,.073],[0,1.84,z],frameDark,.016);
    const fronton=gable(r,'iv_fronton_'+z,2.04,.61,.025,1.84,P.glass);fronton.position.z=z;fronton.material=material('#ffffff','glass');
  }
  const half=1.1,rise=.68,eave=1.84,slope=Math.atan2(rise,half),length=Math.hypot(half,rise);
  for(const sign of [-1,1]){
    for(let i=0;i<3;i++)glass(`iv_techo_${sign}_${i}`,[length-.04,.025,.765],[sign*half/2,eave+rise/2,-.8+i*.8],[0,0,-sign*slope]);
    for(const z of [-1.22,-.41,.4,1.22]){
      const bar=caja(r,`iv_cabio_${sign}_${z}`,[length+.08,.046,.045],[sign*half/2,eave+rise/2+.023,z],frame,.01);bar.rotation.z=-sign*slope;
    }
  }
  caja(r,'iv_cumbrera',[.075,.075,2.58],[0,2.52,0],frameDark,.023);
  for(const x of [-.34,.34])caja(r,'iv_jamba_puerta_'+x,[.063,1.54,.073],[x,1.045,1.235],frameDark,.014);
  for(const y of [.3,1.8])caja(r,'iv_dintel_puerta_'+y,[.74,.062,.075],[0,y,1.24],frameDark,.014);
  esfera(r,'iv_pomo',[.052,.052,.049],[.245,1.03,1.286],P.brass);
  for(const x of [-.66,.66]){
    caja(r,'iv_bancada_'+x,[.54,.09,1.88],[x,.67,0],P.wood,.018);
    for(const z of [-.75,.75])caja(r,`iv_pata_${x}_${z}`,[.07,.45,.07],[x,.445,z],P.woodDark,.012);
    for(let i=0;i<3;i++)pot(r,`iv_plantula_${x}_${i}`,[x,.717,-.62+i*.62],.78,false);
  }
  stone(r,'iv_peldano',[.9,.12,.42],[0,.06,1.42],1);
  return finish('invernadero','Invernadero con bancadas de cultivo','edificios',r,[2.5,3.15]);
}

function mina(){
  const r=grupo('entrada_mina');
  const voidShape=archShape(1.41,1.59,.57);
  extruded(r,'mi_oscuridad',voidShape,.23,[0,.95,-.23],P.dark,.025);
  for(let i=0;i<13;i++){
    const a=i/12*Math.PI,x=Math.cos(a)*1.01,y=.45+Math.sin(a)*1.63;
    const block=stone(r,'mi_roca_arco_'+i,[.57+Math.sin(i)*.1,.59,.64],[x,y,-.13+Math.sin(i*2)*.13],i);
    block.rotation.z=a-Math.PI/2+Math.sin(i)*.1;
  }
  for(const sign of [-1,1]){
    caja(r,'mi_madero_'+sign,[.17,1.57,.2],[sign*.77,.85,.3],P.wood,.045);
    barra(r,'mi_riostra_'+sign,[sign*.73,1.27,.34],[sign*.43,1.72,.34],.075,P.woodLight);
    for(const y of [.36,1.33]){caja(r,`mi_abrazadera_${sign}_${y}`,[.19,.1,.214],[sign*.77,y,.3],P.metal,.015);nail(r,`mi_remache_${sign}_${y}`,sign*.77,y,.419,.022);}
  }
  const beam=grupo('mi_viga',r,[0,1.75,.33]);beam.rotation.z=Math.PI/2;
  plank(beam,'mi_travesano',.23,1.89,.22,[0,0,0],P.wood,3,true);
  for(let i=0;i<5;i++){
    caja(r,'mi_durmiente_'+i,[1.23,.08,.16],[0,.045,-.18+i*.33],P.woodDark,.023);
  }
  for(const x of [-.42,.42])caja(r,'mi_riel_'+x,[.065,.063,1.78],[x,.107,.45],P.metal,.01);
  lantern(r,'mi_lampara',[.67,1.48,.64],.64);
  tubo(r,'mi_gancho',[[.77,1.8,.3],[.73,1.84,.57],[.67,1.72,.64]],.017,P.metal,9,5);
  for(let i=0;i<4;i++){
    const x=-1.22+i*.11,z=.38+Math.sin(i)*.15;
    const crystal=cono(r,'mi_cristal_'+i,.06,.22+i*.023,[x,.15,z],P.blue);crystal.rotation.z=-.3+i*.17;
  }
  for(let i=0;i<3;i++)hoja(r,'mi_musgo_'+i,.22,.13,[-.94+i*.72,1.98+Math.sin(i)*.3,-.05],P.sage,[.7,.4,i]);
  return finish('entrada_mina','Entrada de mina de piedra y madera','edificios',r,[2.95,2.0]);
}

function banco(){
  const r=grupo('banco');
  for(const x of [-.63,.63]){
    tubo(r,'bn_pata_'+x,[[x,.04,.3],[x,.39,.23],[x,.49,-.14],[x,.04,-.29]],.038,P.metal,14,7);
    tubo(r,'bn_brazo_'+x,[[x,.45,.29],[x,.65,.26],[x,.66,-.17],[x,.83,-.26]],.035,P.metal,16,7);
    caja(r,'bn_soporte_'+x,[.055,.55,.055],[x,.61,-.235],P.metal,.012).rotation.x=-.13;
  }
  for(let i=0;i<4;i++){
    plank(r,'bn_asiento_'+i,1.54,.113,.065,[0,.46,-.205+i*.137],i%2?P.woodLight:P.wood,i,false).rotation.x=Math.PI/2;
  }
  for(let i=0;i<3;i++){
    const board=grupo('bn_respaldo_'+i,r,[0,.63+i*.137,-.267-i*.014]);board.rotation.z=Math.PI/2;
    plank(board,'bn_lama_'+i,.112,1.53,.054,[0,0,0],i%2?P.wood:P.woodLight,i,true);
    for(const x of [-.625,.625])nail(r,`bn_tornillo_${i}_${x}`,x,.63+i*.137,-.227-i*.014,.016);
  }
  return finish('banco','Banco de plaza con brazos de forja','decoracion',r,[1.72,.85]);
}

function fuente(){
  const r=grupo('fuente');
  cilindro(r,'fu_base',.87,.94,.13,[0,.065,0],P.stoneDark,24);
  const profile=[[.83,.13],[.86,.2],[.84,.34],[.77,.41],[.69,.41],[.67,.31],[.67,.19]].map(([x,y])=>new THREE.Vector2(x,y));
  malla(r,'fu_pila',new THREE.LatheGeometry(profile,28),[0,0,0],P.stoneLight);
  for(let i=0;i<14;i++){
    const a=i*Math.PI/7;
    tubo(r,'fu_junta_'+i,[[Math.sin(a)*.852,.19,Math.cos(a)*.852],[Math.sin(a)*.842,.33,Math.cos(a)*.842]],.008,P.stone,5,3);
  }
  cilindro(r,'fu_agua',.679,.679,.016,[0,.298,0],P.water,28).material=material('#ffffff','glass');
  cilindro(r,'fu_pedestal',.135,.245,.61,[0,.58,0],P.stoneLight,16);
  ring(r,'fu_moldura_base',.219,.041,[0,.32,0],P.stone);
  ring(r,'fu_moldura_capitel',.17,.035,[0,.85,0],P.stone);
  const bowl=[[0,.89],[.16,.89],[.4,1.025],[.405,1.08],[.358,1.115],[.32,1.07],[.12,.963],[0,.963]].map(([x,y])=>new THREE.Vector2(x,y));
  malla(r,'fu_copa',new THREE.LatheGeometry(bowl,24),[0,0,0],P.stoneLight);
  cilindro(r,'fu_agua_copa',.318,.318,.009,[0,1.068,0],P.water,24).material=material('#ffffff','glass');
  esfera(r,'fu_remate',[.14,.19,.14],[0,1.16,0],P.stone);
  const splash=grupo('fu_chorros',r);
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2+.3;
    const points=[[Math.sin(a)*.1,1.12,Math.cos(a)*.1],[Math.sin(a)*.31,1.29,Math.cos(a)*.31],
      [Math.sin(a)*.5,.91,Math.cos(a)*.5],[Math.sin(a)*.55,.33,Math.cos(a)*.55]];
    tubo(splash,'fu_hilo_agua_'+i,points,.014,P.blue,20,5).material=material('#ffffff','glass');
    for(let j=0;j<3;j++)esfera(splash,`fu_gota_${i}_${j}`,[.035,.046,.035],[Math.sin(a)*(.5+j*.022),.32+j*.023,Math.cos(a)*(.5+j*.022)],P.glass);
    ring(r,'fu_onda_'+i,.09,.007,[Math.sin(a)*.55,.31,Math.cos(a)*.55],P.glass);
  }
  return finish('fuente','Fuente de plaza con agua','decoracion',r,[2.02,2.02],
    [giroClip('agua',splash,'y',[0,.025,0,-.025,0],[0,.5,1,1.5,2])]);
}

export function crearEdificios(){
  return [granero(),molino(),gallinero(),puesto(),pozo(),cerca(),porton(),sendero(),puente(),barril(),
    paca(),cajon(),letrero(),farol(),regadera(),casita(),invernadero(),mina(),banco(),fuente()];
}
