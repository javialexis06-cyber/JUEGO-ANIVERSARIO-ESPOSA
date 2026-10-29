// Captura plantas de Gardendless (prefabs DragonBones del distribuible fijado en motores.lock.json) sobre fondo negro
// y blanco, para que montar-plantas.py calcule el alfa exacto. Necesita Vite sirviendo public/ en el puerto 5176 y
// acceso a los recursos remotos fijados de Gardendless. Ejemplo:
//   OUT=capturas ESC=2.4 OCULTAR='^COS\d+$|^COS\d_\d|_infi$|COS5_shade|food|deathPar|explCollect|^star|campass|stick|floating|fan|roto|iron|locating|upper_here' \
//   IDS=CabbagePultDIS,FloawerPotDIS,KernelPultDIS,GarlicDIS,UmbrellaLeafDIS,MariGoldDIS,MelonPultDIS node scripts/arte-tejado/capturar-gardendless.mjs
// IDS admite «Id:animación:espera_ms». OCULTAR quita ranuras de disfraces y efectos. Las variantes DIS traen la planta completa.
import {chromium} from '@playwright/test';
import fs from 'node:fs';
const OUT=process.env.OUT, IDS=(process.env.IDS_ARCHIVO?fs.readFileSync(process.env.IDS_ARCHIVO,'utf8').trim():(process.env.IDS??'CabbagePult')).split(/[,\n]/).filter(Boolean), ESC=Number(process.env.ESC??1.4), ANIM=process.env.ANIM??'';
fs.mkdirSync(OUT,{recursive:true});
const px=process.env.HTTPS_PROXY;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',proxy:px?{server:px,bypass:'localhost'}:undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-certificate-errors']});
const p=await (await b.newContext({viewport:{width:1000,height:1000},ignoreHTTPSErrors:true})).newPage();
const err=[];p.on('pageerror',e=>err.push(String(e).slice(0,300)));
await p.goto('http://localhost:5176/jardin/motores/pvz2/index.html');
await p.waitForFunction(()=>!!window.System?.get('chunks:///_virtual/mainScene.ts'),null,{timeout:240000});
await p.waitForTimeout(3000);
await p.waitForFunction(async()=>{const cc=await System.import('cc');return cc.director.getScene()?.name==='mainScene';},null,{timeout:240000,polling:500});
await p.waitForTimeout(12000);
console.log(await p.evaluate(async()=>{const cc=await System.import('cc');window.__cc=cc;
 // La escena principal puede reconstruirse después de cargar: el contenedor se rehace cuando hace falta.
 window.__prep=()=>{if(window.__foto?.canvas?.isValid&&window.__foto.canvas.parent?.isValid)return window.__foto;
  const scene=cc.director.getScene();const cv=scene.getComponentInChildren(cc.Canvas);const canvas=cv.node;
  const cams=scene.getComponentsInChildren(cc.Camera);
  for(const c of canvas.children)if(!c.getComponent(cc.Camera))c.active=false;
  const hold=new cc.Node('foto');hold.layer=canvas.layer;canvas.addChild(hold);hold.addComponent(cc.UITransform);
  for(const c of cams){c.clearFlags=cc.Camera.ClearFlag.SOLID_COLOR;}
  window.__foto={cams,canvas:hold};return window.__foto;};
 const f=window.__prep();return f.cams.map(c=>c.node.name+':'+c.visibility).join(' ');}));
for(const ent of IDS){const [id,animId,esperaId]=ent.split(':');
 let info;try{info=await p.evaluate(async([id,esc,anim,ocultar,dbg])=>{const cc=window.__cc,{canvas}=window.__prep();
  for(const c of [...canvas.children])c.destroy();
  const pf=await new Promise((ok,mal)=>cc.resources.load(id.includes('/')?id:'plants/'+(/PLANT|DIS/.test(id)?id:id+'PLANT'),cc.Prefab,(e,a)=>e?mal(String(e)):ok(a)));
  const n=cc.instantiate(pf);
  const set=(x)=>{x.layer=canvas.layer;x.children.forEach(set)};set(n);
  // Solo la parte visual: se quitan los scripts del juego para que no corran reglas.
  const keep=c=>c instanceof cc.UITransform||c?.constructor?.name?.includes('Skeleton')||c instanceof cc.Renderer||(window.sp&&c instanceof sp.Skeleton);
  canvas.addChild(n);n.setScale(esc,esc,1);n.setPosition(0,0,0);
  const ctrl=n.getComponent('AnimationController');const names=[];
  if(ctrl?.PlantUpper instanceof cc.Prefab){const u=cc.instantiate(ctrl.PlantUpper);set(u);for(const c of u.getComponents(cc.Component))if(!(c instanceof cc.UITransform)&&cc.js.getClassName(c)!=='AnimationController')c.enabled=false;n.addChild(u);}
  const arms=n.getComponentsInChildren(cc.dragonBones.ArmatureDisplay);
  for(const ad of arms){const an=ad.armature()?.animation?.animationNames??[];names.push(ad.node.parent?.name+'/'+ad.node.name+':'+an.join('|'));
   const pick=(anim&&an.includes(anim))?anim:(ctrl?.IdleAnim&&an.includes(ctrl.IdleAnim)?ctrl.IdleAnim:an.find(x=>/idle/i.test(x))??an[0]);
   if(pick)ad.playAnimation(pick,0);
   const slots=ad.armature()?.getSlots?.()??[];names.push('slots:'+slots.map(x=>x.name).join('|'));
   const OCULTAR=new RegExp(ocultar,'i');for(const sl of slots)if(OCULTAR.test(sl.name)){sl.visible=false;}}
  names.push('idle='+ctrl?.IdleAnim+' hide='+ctrl?.startHideSlotName);
  if(dbg){const f=k=>{const v=ctrl?.[k];return k+'='+(v?.name??v?._name??(typeof v==='object'?JSON.stringify(Object.keys(v||{})).slice(0,80):v));};
   names.push(['Vineback','vinebackDB','PotFront','potFrontDB','PlantUpper','plantUpperDB','WaterAnm'].map(f).join(' '));
   const walk=(x,d)=>'  '.repeat(d)+x.name+'('+x.active+')\n'+x.children.map(c=>walk(c,d+1)).join('');names.push(walk(n,0));
   const pl=n.getComponents(cc.Component).map(c=>cc.js.getClassName(c));names.push(pl.join(','));}
  const desc=[];
  return {names};
 },[id,ESC,animId??ANIM,process.env.OCULTAR??'shadow|shade|ripple|splash|glow',!!process.env.DBG]);}catch(e){console.log('FALLO',id,String(e).slice(0,160));continue;}
 console.log(id,JSON.stringify(info).slice(0,600));
 await p.waitForTimeout(Number(esperaId??400));
 await p.evaluate(()=>{const cc=window.__cc;for(const s of cc.director.getScene().getComponentsInChildren(cc.dragonBones.ArmatureDisplay))s.timeScale=0;});
 for(const [nom,col] of [['negro',[0,0,0]],['blanco',[255,255,255]]]){
  await p.evaluate(c=>{for(const k of window.__prep().cams)k.clearColor=new window.__cc.Color(c[0],c[1],c[2],255)},col);
  await p.waitForTimeout(500);
  await p.screenshot({path:`${OUT}/${id.replace(/\//g,'_')}-${nom}.png`,clip:{x:0,y:0,width:1000,height:880}});
 }
}
console.log('errores',err.slice(0,8));await b.close();
