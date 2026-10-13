import * as T from 'three';
import { caja, esfera, compactar } from './suelo';
import { ARTICULOS } from './catalogo';
import { huellaObra, costeObra, type EncargoObra } from './construccion';
import { conKit, fundir, cambiarPorKit } from './cuartos';

/** Suelta lo hecho con figuras (geometría y materiales propios) cuando llega el modelo de Blender. */
function soltar(g:T.Object3D){g.removeFromParent();g.traverse(o=>{const m=o as T.Mesh;if(m.isMesh&&!m.geometry.userData.compartido){m.geometry.dispose();for(const mt of ([] as T.Material[]).concat(m.material))if(!mt.userData.compartido)mt.dispose();}});}

/** Geometría propia agrupada por material. Solo el brazo de la cuadrilla es animado. */
export function obraVista(o:EncargoObra,activa:boolean){
 const root=new T.Group(),estatica=new T.Group(),h=huellaObra(o),a=ARTICULOS.find(a=>a.id===o.articulo)!,giro=o.lugar!.giro;
 root.name='obra-vista-'+o.id;root.userData.ganado={tipo:'obra',id:o.id};root.position.set(h.x,0,h.z);root.add(estatica);
 // Lo que no cambia por el modelo: el piso de la obra nueva y la barra de avance del cartel
 const fija=new T.Group();root.add(fija);
 const w=giro%2?a.fondo:a.ancho,d=giro%2?a.ancho:a.fondo,bx=a.corral&&giro===1?a.corral:0,bz=a.corral&&giro===2?a.corral:0,progreso=o.jornadas/costeObra(a,o.nivel).noches;
 if(o.tipo==='nueva')caja(fija,[h.ancho,.045,h.fondo],[h.ancho/2,.025,h.fondo/2],'#ba9c6e');
 for(const x of [bx+.18,bx+w-.18])for(const z of [bz+.18,bz+d-.18]){caja(estatica,[.13,2.7,.13],[x,1.35,z],'#b28c5c');caja(estatica,[.23,.12,.23],[x,.08,z],'#848b80');}
 for(const z of [bz+.18,bz+d-.18])for(const y of [1.2,2.4])caja(estatica,[w,.10,.10],[bx+w/2,y,z],'#b28c5c');
 for(const x of [bx+.18,bx+w-.18])for(const y of [1.2,2.4])caja(estatica,[.10,.10,d],[x,y,bz+d/2],'#b28c5c');
 for(let i=0;i<6;i++){const bar=caja(estatica,[.08,.06,d-.25],[bx+w-.4, .35+i*.35,bz+d/2],'#695b48');if(i===0)bar.name='andamio';}
 if(o.tipo==='nueva')for(let i=0;i<=Math.ceil(h.ancho);i++)for(const z of [.12,h.fondo-.12])caja(estatica,[.08,.45,.08],[Math.min(h.ancho-.12,.12+i),.23,z],'#e9ce8c');
 for(let i=0;i<5;i++){const tabla=caja(estatica,[1.15,.09,.24],[bx+.8,.12+i*.085,bz+.65],'#b28c5c');tabla.rotation.y=.13;}
 caja(estatica,[.6,.45,.55],[bx+.8,.25,bz+1.4],'#b28c5c');for(const y of [.13,.36])caja(estatica,[.66,.035,.6],[bx+.8,y,bz+1.4],'#695b48');
 // Lona de seguridad y cartel; no texturas o imágenes añadidas.
 caja(estatica,[1.15,.5,.09],[h.ancho/2,1.0,h.fondo-.08],'#efe2ba');for(let i=0;i<4;i++){const raya=caja(estatica,[.09,.45,.02],[h.ancho/2-.3+i*.2,1,h.fondo-.02],'#bd9148');raya.rotation.z=-.5;}
 caja(fija,[1.1,.065,.11],[h.ancho/2,.66,h.fondo-.01],'#695b48');if(progreso)caja(fija,[1.1*progreso,.065,.12],[h.ancho/2-.55+.55*progreso,.66,h.fondo],'#769763');
 compactar(estatica);compactar(fija);
 const persona=new T.Group();persona.name='cuadrilla';persona.visible=activa;persona.userData.activa=activa;persona.position.set(bx+w/2,.05,bz+d*.65);root.add(persona);
 for(const x of [-.12,.12]){caja(persona,[.15,.45,.19],[x,.28,0],'#506574');caja(persona,[.18,.12,.28],[x,.08,.05],'#4b4540');}caja(persona,[.42,.55,.28],[0,.76,0],'#af7950');caja(persona,[.35,.32,.31],[0,.65,.02],'#647b72');
 esfera(persona,[.19,.22,.18],[0,1.2,0],'#d7ad83');caja(persona,[.49,.10,.39],[0,1.4,0],'#b9944a');esfera(persona,[.23,.12,.19],[0,1.45,0],'#dab963');for(const x of [-.07,.07])esfera(persona,[.021,.025,.017],[x,1.24,.17],'#3f403b');
 const brazo=new T.Group();brazo.name='martillo-cuadrilla';brazo.position.set(.22,.96,.02);persona.add(brazo);caja(brazo,[.13,.36,.14],[0,-.15,.1],'#ae7851');esfera(brazo,[.085,.085,.08],[0,-.32,.12],'#d7ad83');caja(brazo,[.04,.35,.045],[0,-.18,.2],'#7a5c41');caja(brazo,[.22,.11,.10],[0,-.03,.2],'#6c7474');compactar(brazo);persona.remove(brazo);compactar(persona);persona.add(brazo);
 // Cuando carga granja_obras.glb (personajes/blender/granja_obras.py), todo lo de arriba se cambia por sus piezas en los
 // mismos sitios: postes con zapata y amarres, vigas, la escalera, las tablas con el serrucho, el cajón de
 // herramientas, el cartel con el casco, las estacas con cinta y el obrero de peluche (su brazo del martillo aparte)
 conKit(root,'granja_obras.glb',m=>{
  const poner=(g:T.Object3D,clave:string,x:number,y:number,z:number,ry=0,sx=1)=>{const b=m.get(clave);if(!b)return null;const c=b.clone(true);c.position.set(x,y,z);c.rotation.y=ry;c.scale.x=sx;g.add(c);return c;};
  if(!m.get('obra_poste')||!m.get('obrero'))return;
  const kit=new T.Group();
  for(const x of [bx+.18,bx+w-.18])for(const z of [bz+.18,bz+d-.18])poner(kit,'obra_poste',x,0,z);
  for(const z of [bz+.18,bz+d-.18])for(const y of [1.2,2.4])poner(kit,'obra_viga',bx+w/2,y,z,0,w);
  for(const x of [bx+.18,bx+w-.18])for(const y of [1.2,2.4])poner(kit,'obra_viga',x,y,bz+d/2,Math.PI/2,d);
  const esc=poner(kit,'obra_escalera',bx+w-.4,0,bz+d/2,Math.PI/2);if(esc)esc.rotation.x=-.12;
  if(o.tipo==='nueva')for(let i=0;i<=Math.ceil(h.ancho);i++)for(const z of [.12,h.fondo-.12])poner(kit,'obra_estaca',Math.min(h.ancho-.12,.12+i),0,z,i*.7);
  poner(kit,'obra_tablas',bx+.8,0,bz+.65,.13);
  poner(kit,'obra_cajon',bx+.8,0,bz+1.4,-.2);
  poner(kit,'obra_cartel',h.ancho/2,1.0,h.fondo-.08);
  const unida=fundir(kit);unida.name='obra-kit';soltar(estatica);root.add(unida);
  // El obrero: el cuerpo en la cuadrilla y el brazo del martillo en su grupo (que es el que anima animarObras)
  for(const c of [...persona.children])if(c!==brazo)soltar(c);
  for(const c of [...brazo.children])soltar(c);
  poner(persona,'obrero',0,0,0);
  const mano=m.get('obrero_brazo');if(mano)brazo.add(mano.clone(true));
 });
 return root;
}
export function animarObras(root:T.Object3D,tiempo:number,minutos:number){const trabajando=minutos>=8*60&&minutos<18*60;root.traverse(o=>{if(o.name==='cuadrilla')o.visible=o.userData.activa!==false&&trabajando;if(o.name==='martillo-cuadrilla')o.rotation.x=trabajando?-.3-Math.max(0,Math.sin(tiempo*5))*.8:0;});}
export function detalleAmpliacion(nivel:number){const g=new T.Group();if(nivel<2)return g;
 for(const x of [.25,3.75]){caja(g,[.2,2.2,.13],[x,1.1,3.88],'#768d84');for(const y of [.35,1.9])caja(g,[.27,.08,.18],[x,y,3.9],'#d5be7e');}
 caja(g,[1.4,.25,.08],[2,2.23,3.94],nivel===3?'#d2be81':'#b0c7bc');for(let i=0;i<nivel;i++)esfera(g,[.065,.065,.015],[1.8+i*.2,2.23,4],'#5d7069');compactar(g);
 // Con granja_patio.glb: pilares de piedra con anillos y remates, y el letrero colgado con sus estrellas
 cambiarPorKit(g,'granja_patio.glb',m=>m.get('ampliacion_'+(nivel>=3?3:2))?.clone(true)??null);return g;
}
