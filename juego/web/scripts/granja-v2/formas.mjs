import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const materials=new Map();
export function material(color='#ffffff',kind='clay'){
  const key=color+':'+kind;if(materials.has(key))return materials.get(key);
  const m=new THREE.MeshStandardMaterial({color,vertexColors:true,roughness:kind==='eye'?.18:kind==='metal'?.32:kind==='glass'?.22:.78,metalness:kind==='metal'?.48:0});
  if(kind==='glass'){m.transparent=true;m.opacity=.40;m.depthWrite=false;}
  if(kind==='emissive'){m.emissive.set(color);m.emissiveIntensity=.35;}
  m.name='GranjaV2_'+kind+'_'+color.replace('#','');m.userData.kind=kind;materials.set(key,m);return m;
}
export function grupo(name,parent,position=[0,0,0]){const o=new THREE.Group();o.name=name;o.position.fromArray(position);parent?.add(o);return o;}
export function malla(parent,name,geometry,pos,color,kind='clay'){
  if(!geometry.attributes.normal)geometry.computeVertexNormals();
  if(!geometry.attributes.color){geometry.computeBoundingBox();const p=geometry.attributes.position,lo=geometry.boundingBox.min.y,range=Math.max(.01,geometry.boundingBox.max.y-lo);const c=new THREE.Color(color?.isMaterial?'#ffffff':color);const colors=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const h=(p.getY(i)-lo)/range;const grain=Math.sin(p.getX(i)*36.7+p.getY(i)*27.1+p.getZ(i)*17.3)*.008;const tint=.91+.09*h+grain;colors[i*3]=c.r*tint;colors[i*3+1]=c.g*tint;colors[i*3+2]=c.b*tint;}geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));}
  geometry.deleteAttribute('uv');const m=new THREE.Mesh(geometry,color?.isMaterial?color:material('#ffffff',kind));m.name=name;m.position.fromArray(pos);m.castShadow=kind!=='glass';m.receiveShadow=true;parent.add(m);return m;
}
export function caja(p,n,s,pos,c,r=.07){return malla(p,n,new RoundedBoxGeometry(...s,2,Math.min(r,Math.min(...s)*.45)),pos,c);}
export function elipsoide(p,n,s,pos,c,segments=20,rings=12){const m=malla(p,n,new THREE.SphereGeometry(1,segments,rings),pos,c);m.scale.set(s[0]/2,s[1]/2,s[2]/2);return m;}
export const esfera=elipsoide;
export function cilindro(p,n,t,b,h,pos,c,segments=16){return malla(p,n,new THREE.CylinderGeometry(t,b,h,segments),pos,c);}
export function cono(p,n,r,h,pos,c){return malla(p,n,new THREE.ConeGeometry(r,h,16),pos,c);}
export function toro(p,n,r,t,pos,c){return malla(p,n,new THREE.TorusGeometry(r,t,8,24),pos,c);}
export function barra(p,n,a,b,r,c){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const m=cilindro(p,n,r,r,d.length(),av.clone().add(bv).multiplyScalar(.5).toArray(),c,10);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
export function tubo(p,n,points,r,c,segments=20,radial=8){const curve=new THREE.CatmullRomCurve3(points.map(v=>v.isVector3?v:new THREE.Vector3(...v)));return malla(p,n,new THREE.TubeGeometry(curve,segments,r,radial,false),[0,0,0],c);}
// Solid leaf, curled toward the tip. +Y runs from stem to tip; Z is leaf depth.
export function hoja(p,n,length,width,pos,c,rotation=[0,0,0]){
  const vertices=[],indices=[],rows=10;for(let side=0;side<2;side++)for(let j=0;j<=rows;j++){const t=j/rows,w=Math.sin(Math.PI*t)*width/2;for(const x of [-1,0,1])vertices.push(x*w,length*t,Math.sin(t*Math.PI)*length*.12+Math.abs(x)*width*.08+(side?-.008:.008));}
  for(let side=0;side<2;side++)for(let j=0;j<rows;j++)for(let k=0;k<2;k++){const a=side*(rows+1)*3+j*3+k,b=a+3;indices.push(...(side?[a,a+1,b,a+1,b+1,b]:[a,b,a+1,a+1,b,b+1]));}
  for(let j=0;j<rows;j++)for(const k of [0,2]){const a=j*3+k,b=a+3,d=a+(rows+1)*3,e=b+(rows+1)*3;indices.push(a,d,b,b,d,e);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const m=malla(p,n,g,pos,c);m.rotation.set(...rotation);return m;
}
export function giroClip(name,node,axis,values,times){const q=[];for(const value of values){const e=node.rotation.clone();e[axis]=value;new THREE.Quaternion().setFromEuler(e).toArray(q,q.length);}return new THREE.AnimationClip(name,-1,[new THREE.QuaternionKeyframeTrack(node.name+'.quaternion',times,q)]);}
export function movimientoClip(name,node,axis,values,times){const points=[];for(const v of values){const p=node.position.clone();p[axis]=v;p.toArray(points,points.length);}return new THREE.AnimationClip(name,-1,[new THREE.VectorKeyframeTrack(node.name+'.position',times,points)]);}
export function compactar(root){const groups=[];root.traverse(o=>{if(o.isGroup)groups.push(o);});for(const g of groups){const byMat=new Map();for(const o of g.children)if(o.isMesh&&!o.children.length){const a=byMat.get(o.material)??[];a.push(o);byMat.set(o.material,a);}for(const[mat,meshes]of byMat){if(meshes.length<2)continue;const parts=meshes.map(m=>{m.updateMatrix();const geo=m.geometry.clone().applyMatrix4(m.matrix);geo.deleteAttribute('uv');return geo.index?geo.toNonIndexed():geo;});const geo=mergeGeometries(parts,false);if(!geo)throw new Error('Cannot merge '+g.name);const mesh=new THREE.Mesh(mergeVertices(geo,1e-5),mat);mesh.name=g.name+'_surface_'+g.children.length;mesh.castShadow=!mat.transparent;mesh.receiveShadow=true;g.remove(...meshes);g.add(mesh);parts.forEach(g=>g.dispose());}}}
