import * as THREE from 'three';
import { caja, esfera, compactar } from './suelo';
import { celdasAgua, type PaisajeGranja } from './paisaje';
import { SALIDAS } from './caminos-mundo';
import type { Zona } from './catalogo';
import { conKit, fundir } from './cuartos';
/** Agua viva: ondas que se mueven, centro más hondo, orilla clarita y destellos del sol. Sigue siendo un material
 * estándar (le llegan la luz, la niebla y la noche); el tiempo lo pone la malla justo antes de dibujarse. */
const tiempoAgua={value:0};
export function materialAgua(hondo='#2c7a8c',claro='#6fbdb6'){
 const m=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.5,metalness:0,envMapIntensity:.25});
 m.onBeforeCompile=(sh)=>{
  sh.uniforms.uTiempo=tiempoAgua;sh.uniforms.uHondo={value:new THREE.Color(hondo)};sh.uniforms.uClaro={value:new THREE.Color(claro)};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMundoAgua;varying vec2 vLocalAgua;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvMundoAgua=(modelMatrix*vec4(transformed,1.0)).xyz;vLocalAgua=position.xz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uTiempo;uniform vec3 uHondo;uniform vec3 uClaro;varying vec3 vMundoAgua;varying vec2 vLocalAgua;\nfloat ondaAgua(vec2 p){return sin(p.x*2.1+uTiempo*1.3)*.5+sin(p.y*2.7-uTiempo*1.1)*.5+sin((p.x+p.y)*3.9+uTiempo*1.9)*.35+sin((p.x-p.y)*5.3-uTiempo*2.3)*.2;}')
   .replace('#include <color_fragment>','#include <color_fragment>\n{float r=length(vLocalAgua);float o=ondaAgua(vMundoAgua.xz);vec3 c=mix(uClaro,uHondo,1.0-smoothstep(.25,.95,r));c+=o*.035;c=mix(c,vec3(.93,.98,.96),smoothstep(.86,.97,r)*(.55+.25*sin(uTiempo*1.6+atan(vLocalAgua.y,vLocalAgua.x)*7.0)));diffuseColor.rgb=c;}')
   .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n{vec2 q=vMundoAgua.xz;float e=.15;float h=ondaAgua(q);vec3 n2=normalize(vec3(-(ondaAgua(q+vec2(e,0.))-h)*.35,1.,-(ondaAgua(q+vec2(0.,e))-h)*.35));normal=normalize((viewMatrix*vec4(n2,0.)).xyz);}')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{float d=ondaAgua(vMundoAgua.xz*1.7+3.0);totalEmissiveRadiance+=vec3(1.,.98,.9)*smoothstep(1.05,1.3,d)*.35;}');
 };
 m.customProgramCacheKey=()=>'agua-granja';return m;
}
/** Malla de agua (disco) que avanza su reloj al dibujarse. */
export function mallaAgua(rx:number,rz:number,hondo?:string,claro?:string){const a=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.025,48,1),materialAgua(hondo,claro));a.scale.set(rx,1,rz);a.receiveShadow=true;a.userData.noCompactar=true;a.onBeforeRender=()=>{tiempoAgua.value=performance.now()/1000;};return a;}
/** Agua con forma libre: lo hondo y la espuma salen de una máscara borrosa de las casillas (orilla redondeada). */
function materialAguaMascara(mascara:THREE.Texture,ancho:number,fondo:number){
 const m=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.5,metalness:0,envMapIntensity:.25});
 m.onBeforeCompile=(sh)=>{
  sh.uniforms.uTiempo=tiempoAgua;sh.uniforms.uHondo={value:new THREE.Color('#2c7a8c')};sh.uniforms.uClaro={value:new THREE.Color('#6fbdb6')};sh.uniforms.uMascara={value:mascara};sh.uniforms.uTam={value:new THREE.Vector2(ancho,fondo)};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMundoAgua;varying vec2 vLocalAgua;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvMundoAgua=(modelMatrix*vec4(transformed,1.0)).xyz;vLocalAgua=position.xz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uTiempo;uniform vec3 uHondo;uniform vec3 uClaro;uniform sampler2D uMascara;uniform vec2 uTam;varying vec3 vMundoAgua;varying vec2 vLocalAgua;\nfloat ondaAgua(vec2 p){return sin(p.x*2.1+uTiempo*1.3)*.5+sin(p.y*2.7-uTiempo*1.1)*.5+sin((p.x+p.y)*3.9+uTiempo*1.9)*.35+sin((p.x-p.y)*5.3-uTiempo*2.3)*.2;}')
   .replace('#include <color_fragment>','#include <color_fragment>\n{float d=texture2D(uMascara,vec2(vLocalAgua.x/uTam.x+.5,-vLocalAgua.y/uTam.y+.5)).r;if(d<.5)discard;float r=clamp(1.0-(d-.5)*2.6,0.,1.);float o=ondaAgua(vMundoAgua.xz);vec3 c=mix(uClaro,uHondo,1.0-smoothstep(.25,.95,r));c+=o*.035;c=mix(c,vec3(.93,.98,.96),smoothstep(.84,.98,r)*(.55+.25*sin(uTiempo*1.6+(vMundoAgua.x+vMundoAgua.z)*2.3)));diffuseColor.rgb=c;}')
   .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n{vec2 q=vMundoAgua.xz;float e=.15;float h=ondaAgua(q);vec3 n2=normalize(vec3(-(ondaAgua(q+vec2(e,0.))-h)*.35,1.,-(ondaAgua(q+vec2(0.,e))-h)*.35));normal=normalize((viewMatrix*vec4(n2,0.)).xyz);}')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{float d=ondaAgua(vMundoAgua.xz*1.7+3.0);totalEmissiveRadiance+=vec3(1.,.98,.9)*smoothstep(1.05,1.3,d)*.35;}');
 };
 m.customProgramCacheKey=()=>'agua-mascara';return m;
}
/** Grupos de casillas de agua unidas por un lado. */
function gruposAgua(celdas:Set<string>):[number,number][][]{
 const vistas=new Set<string>(),grupos:[number,number][][]=[];
 for(const k of celdas){if(vistas.has(k))continue;const grupo:[number,number][]=[],pila=[k];vistas.add(k);
  while(pila.length){const c=pila.pop()!,[x,z]=c.split(',').map(Number);grupo.push([x,z]);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=(x+dx)+','+(z+dz);if(celdas.has(n)&&!vistas.has(n)){vistas.add(n);pila.push(n);}}}
  grupos.push(grupo);}
 return grupos;
}
/** Un estanque hecho de casillas: orilla de pasto mojado, agua con la forma redondeada de las casillas y, en el borde,
 * juncos y piedras de orilla de Blender. */
function estanqueCasillas(celdas:[number,number][]):THREE.Group{
 const g=new THREE.Group(),PX=8,PAD=1,xs=celdas.map(c=>c[0]),zs=celdas.map(c=>c[1]),x0=Math.min(...xs)-PAD,z0=Math.min(...zs)-PAD,ancho=Math.max(...xs)-x0+1+PAD,fondo=Math.max(...zs)-z0+1+PAD;
 // Máscara borrosa calculada a mano (dos pasadas de caja): no depende del lienzo del navegador ni de su filtro
 const W=ancho*PX,H=fondo*PX,m0=new Float32Array(W*H);
 // La fila 0 es el borde de mayor z (así v=0 en la textura queda hacia +z, como la malla)
 for(const [x,z] of celdas){const c0=(x-x0)*PX,f0=(z0+fondo-1-z)*PX;for(let f=f0;f<f0+PX;f++)for(let c=c0;c<c0+PX;c++)m0[f*W+c]=1;}
 const caja1=(src:Float32Array,r:number,horizontal:boolean)=>{const dst=new Float32Array(W*H),n=2*r+1;for(let a=0;a<(horizontal?H:W);a++)for(let b=0;b<(horizontal?W:H);b++){let t=0;for(let k=-r;k<=r;k++){const bb=Math.min((horizontal?W:H)-1,Math.max(0,b+k));t+=horizontal?src[a*W+bb]:src[bb*W+a];}if(horizontal)dst[a*W+b]=t/n;else dst[b*W+a]=t/n;}return dst;};
 let m1=m0;for(let k=0;k<2;k++){m1=caja1(m1,Math.round(PX*.45),true);m1=caja1(m1,Math.round(PX*.45),false);}
 const datos=new Uint8Array(W*H*4);for(let k=0;k<W*H;k++){const v=Math.round(m1[k]*255);datos.set([v,v,v,255],k*4);}
 const mascara=new THREE.DataTexture(datos,W,H);mascara.magFilter=THREE.LinearFilter;mascara.minFilter=THREE.LinearFilter;mascara.needsUpdate=true;
 const cx=x0+ancho/2,cz=z0+fondo/2,geo=new THREE.PlaneGeometry(ancho,fondo).rotateX(-Math.PI/2);
 const orilla=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:'#9fb08a',roughness:1,alphaMap:mascara,alphaTest:.2}));orilla.position.set(cx,.012,cz);orilla.receiveShadow=true;g.add(orilla);
 const agua=new THREE.Mesh(geo,materialAguaMascara(mascara,ancho,fondo));agua.position.set(cx,.043,cz);agua.receiveShadow=true;agua.userData.noCompactar=true;agua.onBeforeRender=()=>{tiempoAgua.value=performance.now()/1000;};g.add(agua);
 const set=new Set(celdas.map(([x,z])=>x+','+z)),bordes:[number,number,number][]=[];
 for(const [x,z] of celdas)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])if(!set.has((x+dx)+','+(z+dz)))bordes.push([x+.5+dx*.62,z+.5+dz*.62,Math.atan2(-dz,dx)]);
 conKit(g,'granja_monte.glb',m=>{const juncos=m.get('juncos'),piedra=m.get('piedra_orilla');if(!juncos||!piedra)return;const kit=new THREE.Group();
  bordes.forEach(([x,z,giro],k)=>{const h=Math.sin(x*12.9898+z*78.233)*43758.5453,azar=h-Math.floor(h);if(azar>.58)return;const o=(azar<.36?juncos:piedra).clone(true);o.position.set(x,0,z);o.rotation.y=giro+azar*2;o.scale.setScalar(azar<.36?.7+azar:.55+azar*.6);kit.add(o);void k;});
  g.add(fundir(kit));});
 return g;
}
export function paisajeGranja(p:PaisajeGranja):THREE.Group{
 const g=new THREE.Group();
 // Estanques por casillas (se cavan y rellenan en el modo diseño): cada grupo de casillas unidas es un estanque
 for(const grupo of gruposAgua(celdasAgua(p)))g.add(estanqueCasillas(grupo));
 for(const h of p.huecos){const cx=h.x+.5,cz=h.z+.5,r=(k:number)=>{const n=Math.sin((h.x*12.9+h.z*78.2+k)*43.1)*4375.5;return n-Math.floor(n);};
  if(h.relleno){const t=new THREE.Mesh(new THREE.CylinderGeometry(.5,.55,.04,16),new THREE.MeshStandardMaterial({color:'#9c8160',roughness:1}));t.position.set(cx,.012,cz);t.receiveShadow=true;g.add(t);for(let k=0;k<4;k++)esfera(g,[.08,.04,.07],[cx+(r(k)-.5)*.6,.04,cz+(r(k+5)-.5)*.6],'#8a7152');continue;}
  // Hoyo redondo: fondo oscuro con degradé, bordecito de tierra removida en terrones y piedritas
  const fondo=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.02,18),new THREE.MeshStandardMaterial({color:'#2f2a24',roughness:1}));fondo.position.set(cx,.02,cz);g.add(fondo);
  const medio=new THREE.Mesh(new THREE.CylinderGeometry(.47,.47,.015,18),new THREE.MeshStandardMaterial({color:'#5a4a3a',roughness:1}));medio.position.set(cx,.012,cz);g.add(medio);
  for(let k=0;k<11;k++){const a=k/11*Math.PI*2+r(k)*.3,d=.5+r(k+20)*.06;esfera(g,[.13+r(k+30)*.06,.07+r(k+40)*.04,.11],[cx+Math.cos(a)*d,.05,cz+Math.sin(a)*d],k%3?'#9c7d58':'#b39168');}
  for(let k=0;k<3;k++)esfera(g,[.07,.05,.06],[cx+(r(k+50)-.5)*1.1,.04,cz+(r(k+60)-.5)*1.1],'#a9a596');
 }
 compactar(g);return g;
}
/** Nudo hundido en el tronco del árbol grande; acompaña el modelo original del follaje. */
export function huecoArbolGrande(x:number,z:number):THREE.Group{
 const g=new THREE.Group(),oscuro=new THREE.Mesh(new THREE.CircleGeometry(.3,16),new THREE.MeshStandardMaterial({color:'#443b30',roughness:1}));oscuro.scale.set(1,1.55,1);oscuro.position.set(0,.83,.43);g.add(oscuro);
 const aro=new THREE.Mesh(new THREE.TorusGeometry(.31,.052,5,16),new THREE.MeshStandardMaterial({color:'#967957',roughness:1}));aro.scale.set(1,1.55,1);aro.position.copy(oscuro.position);aro.position.z+=.025;g.add(aro);compactar(g);g.position.set(x,0,z);return g;
}
