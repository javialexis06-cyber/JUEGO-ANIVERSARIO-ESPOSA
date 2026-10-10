import * as THREE from 'three';
import { biomaZona, faseLuz, tiempoDia, tiempoRegion, type Tiempo } from './clima';
import type { EstadoGranja } from './estado';

/** Un único draw call de partículas, sin texturas ni geometría nueva por fotograma. */
export class AmbienteClima {
 readonly grupo=new THREE.Group();
 private geometria=new THREE.BufferGeometry();
 private material=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,
  uniforms:{reloj:{value:0},centro:{value:new THREE.Vector2()},modo:{value:0},fuerza:{value:1},pixel:{value:1},tinte:{value:new THREE.Color('#c6e1e4')}},
  vertexShader:[
   'uniform float reloj; uniform vec2 centro; uniform float modo; uniform float pixel; uniform float fuerza;',
   'attribute float azar; varying float alpha; varying float tipo;',
   'void main(){',
   ' float nieve=step(0.5,modo); float velocidad=mix(13.0,1.25,nieve);',
   ' float altura=mod(position.y-reloj*velocidad*fuerza,16.0);',
   ' float viento=mix(-0.65,0.35,nieve);',
   ' vec3 p=vec3(mod(position.x+reloj*viento+24.0,48.0)-24.0+centro.x,altura,mod(position.z+sin(reloj*0.4+azar*30.0)*nieve+24.0,48.0)-24.0+centro.y);',
   ' vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;',
   ' gl_PointSize=mix(12.0,4.0+azar*3.0,nieve)*pixel;',
   ' alpha=mix(0.3,0.8,nieve)*smoothstep(0.0,1.8,altura);tipo=nieve;',
   '}'
  ].join('\n'),
  fragmentShader:[
   'uniform vec3 tinte; varying float alpha; varying float tipo;',
   'void main(){vec2 p=gl_PointCoord-vec2(0.5);',
   ' float gota=1.0-smoothstep(0.04,0.09,abs(p.x+p.y*0.13));',
   ' float copo=1.0-smoothstep(0.2,0.5,length(p));',
   ' float a=mix(gota,copo,tipo)*alpha;if(a<0.02)discard;gl_FragColor=vec4(tinte,a);}',
  ].join('\n'),
 });
 private puntos:THREE.Points;
 private fondo=new THREE.Color();private niebla=new THREE.Color();
 private diaColor=new THREE.Color('#dde8ca');private lluviaColor=new THREE.Color('#9eafb6');private nocheColor=new THREE.Color('#596a85');
 private luzDia=new THREE.Color('#fff0d7');private luzNoche=new THREE.Color('#a2b9df');private ocaso=new THREE.Color('#efc59d');
 private cenizaColor=new THREE.Color('#beae91');
 private exposicion=1.1;private clave='';private estadoAnterior?:EstadoGranja;
 private segundos=0;private actual:Tiempo='sol';private visible=false;
 constructor(){const p=new Float32Array(512*3),a=new Float32Array(512);let n=0x41c64e6d;const rand=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};for(let i=0;i<512;i++){p[i*3]=rand()*48-24;p[i*3+1]=rand()*16;p[i*3+2]=rand()*48-24;a[i]=rand();}this.geometria.setAttribute('position',new THREE.BufferAttribute(p,3));this.geometria.setAttribute('azar',new THREE.BufferAttribute(a,1));this.puntos=new THREE.Points(this.geometria,this.material);this.puntos.frustumCulled=false;this.grupo.name='clima-del-valle';this.grupo.add(this.puntos);this.grupo.visible=false;}
 update(dt:number,s:EstadoGranja|undefined,centro:THREE.Vector3,escena:THREE.Scene,sol:THREE.DirectionalLight,ambiente:THREE.HemisphereLight,calidad:'ligera'|'alta',pixel:number,catalogo=false){
  this.visible=!!s&&!catalogo&&!s.interior&&!s.servicio&&!s.aventura.destinoActual&&s.zona!=='mina';
  this.grupo.visible=false;if(!s||!this.visible){this.exposicion=1.1;escena.environmentIntensity=.24;this.reset(ambiente);if(s&&!s.aventura.destinoActual){sol.intensity=3.5;sol.color.set('#fff0d7');if(!catalogo&&escena.background instanceof THREE.Color)escena.background.copy(this.diaColor);}return;}
  this.segundos+=Math.max(0,Math.min(.1,dt));const clave=[s.tiempo.semilla,s.jornada.diasCompletados,s.zona,Math.floor(centro.x),Math.floor(centro.z),s.revision].join(':');if(clave!==this.clave||s!==this.estadoAnterior){this.clave=clave;this.estadoAnterior=s;const bioma=biomaZona(s.zona,s,centro.x,centro.z);this.actual=tiempoRegion(tiempoDia(s.tiempo,s.jornada.diasCompletados),bioma);}
  const tormenta=this.actual==='tormenta',humedo=this.actual==='lluvia'||this.actual==='tormenta',precipita=humedo||this.actual==='nieve'||this.actual==='ceniza';
  const {noche,atardecer}=faseLuz(s.jornada.minutos);this.exposicion=1.1-noche*.35;escena.environmentIntensity=.24-noche*.13;this.fondo.copy(humedo?this.lluviaColor:this.diaColor).lerp(this.nocheColor,noche*.9);
  this.niebla.copy(this.fondo);if(this.actual==='ceniza'){this.fondo.lerp(this.cenizaColor,.35);this.niebla.copy(this.fondo);}
  if(escena.background instanceof THREE.Color)escena.background.copy(this.fondo);
  if(escena.fog instanceof THREE.Fog){escena.fog.color.copy(this.niebla);escena.fog.near=humedo?38:56;escena.fog.far=tormenta?85:humedo?100:150;}
  sol.color.copy(this.luzDia).lerp(this.ocaso,atardecer*.45).lerp(this.luzNoche,noche);
  sol.intensity=(humedo?2.1:3.5)*(1-noche*.73);ambiente.intensity=1.55-noche*.6-(humedo?.15:0);
  ambiente.color.set(humedo?'#d6e2e4':'#fff8e5').lerp(this.luzNoche,noche*.75);
  this.grupo.visible=precipita;if(!precipita)return;
  this.geometria.setDrawRange(0,calidad==='alta'?512:tormenta?384:256);
  const u=this.material.uniforms;u.reloj.value=this.segundos;u.centro.value.set(centro.x,centro.z);u.modo.value=humedo?0:1;u.fuerza.value=tormenta?1.4:1;u.pixel.value=pixel;
  u.tinte.value.set(this.actual==='ceniza'?'#d2bc84':this.actual==='nieve'?'#fffaf0':'#c6e1e4');
 }
 reset(ambiente:THREE.HemisphereLight){this.grupo.visible=false;ambiente.intensity=1.55;ambiente.color.set('#fff8e5');}
 get exposure(){return this.exposicion;}
 get stats(){return {tipo:this.actual,visible:this.grupo.visible,particulas:this.grupo.visible?this.geometria.drawRange.count:0,drawCalls:this.grupo.visible?1:0};}
 dispose(){this.grupo.removeFromParent();this.geometria.dispose();this.material.dispose();}
}
