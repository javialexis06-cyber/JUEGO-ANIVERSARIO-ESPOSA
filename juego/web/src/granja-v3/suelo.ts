import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const material=(color:string)=>new THREE.MeshStandardMaterial({color,roughness:.9});
export function caja(root:THREE.Object3D,size:number[],pos:number[],color:string){const m=new THREE.Mesh(new THREE.BoxGeometry(...size as [number,number,number]),material(color));m.position.fromArray(pos);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
export function esfera(root:THREE.Object3D,size:number[],pos:number[],color:string){const m=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),material(color));m.scale.fromArray(size);m.position.fromArray(pos);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
export function liberar(root:THREE.Object3D){const geo=new Set<THREE.BufferGeometry>(),mat=new Set<THREE.Material>();root.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){geo.add(m.geometry);(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>mat.add(x));if((m as THREE.InstancedMesh).isInstancedMesh)(m as THREE.InstancedMesh).dispose();}});geo.forEach(g=>g.dispose());mat.forEach(m=>m.dispose());root.removeFromParent();}
/** Batch owned, untextured helper meshes inside a static group. Never use on GLB instances or animated pivots. */
export function compactar(root:THREE.Group){
 const batches=new Map<string,THREE.Mesh[]>();root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert();
 root.traverse(o=>{if(!(o instanceof THREE.Mesh)||(o as THREE.InstancedMesh).isInstancedMesh||Array.isArray(o.material))return;const m=o.material;if(!(m instanceof THREE.MeshStandardMaterial)||m.map||m.vertexColors||m.transparent)return;const key=[m.color.getHex(),m.roughness,m.metalness,m.emissive.getHex(),m.emissiveIntensity,m.side,o.castShadow,o.receiveShadow].join(':');const list=batches.get(key)??[];list.push(o);batches.set(key,list);});
 for(const meshes of batches.values()){
  if(meshes.length<2)continue;
  const parts=meshes.map(m=>{const transformed=m.geometry.clone().applyMatrix4(inverse.clone().multiply(m.matrixWorld));transformed.deleteAttribute('uv');if(!transformed.index)return transformed;const expanded=transformed.toNonIndexed();transformed.dispose();return expanded;});
  const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(!merged)continue;
  const first=meshes[0],mat=first.material as THREE.Material,oldMaterials=new Set<THREE.Material>();
  for(const m of meshes){m.removeFromParent();m.geometry.dispose();if(m.material!==mat)oldMaterials.add(m.material as THREE.Material);}oldMaterials.forEach(m=>m.dispose());
  const m=new THREE.Mesh(merged,mat);m.castShadow=first.castShadow;m.receiveShadow=first.receiveShadow;root.add(m);
 }
}
const hash=(a:number,b=0)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453123;return n-Math.floor(n);};
function textura(tipo:'hierba'|'surcos'|'piedra'|'madera'){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;
 ctx.fillStyle={hierba:'#c4d094',surcos:'#936544',piedra:'#b4ada0',madera:'#b48b64'}[tipo];ctx.fillRect(0,0,256,256);
 if(tipo==='surcos'){for(let y=0;y<256;y+=32){ctx.fillStyle='#66462f';ctx.fillRect(0,y,256,9);ctx.fillStyle='#b08457';ctx.fillRect(0,y+12,256,6);}}
 if(tipo==='piedra'){ctx.strokeStyle='#746b5d';ctx.lineWidth=7;for(let y=0;y<2;y++)for(let x=0;x<2;x++){const xx=x*128+(y%2)*64;ctx.strokeRect(xx-64,y*128,128,128);}}
 if(tipo==='madera'){ctx.fillStyle='#735035';for(let y=0;y<256;y+=64)ctx.fillRect(0,y,256,5);ctx.fillRect(0,0,3,256);}
 for(let i=0;i<3200;i++){const x=hash(i,4)*256,y=hash(i,9)*256;ctx.fillStyle=i%2?'#ffffff14':'#28221718';ctx.fillRect(x,y,tipo==='madera'?8:1.5,tipo==='hierba'?3:1);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
export class Suelos{
 readonly hierba=textura('hierba');readonly surcos=textura('surcos');readonly piedra=textura('piedra');readonly madera=textura('madera');
 terreno(){const g=new THREE.PlaneGeometry(260,240,52,48);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors:number[]=[];for(let i=0;i<p.count;i++){const c=new THREE.Color('#85a66a').multiplyScalar(.9+hash(i,6)*.12);colors.push(c.r,c.g,c.b);}g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*130,uv.getY(i)*120);const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,map:this.hierba,roughness:1}));mesh.position.y=-.04;mesh.receiveShadow=true;return mesh;}
 /** All cells touch edge to edge. Furrow UVs use world coordinates so rows continue across cells. */
 labrado(cells:{x:number;z:number;wet:boolean;dead:boolean}[]){const group=new THREE.Group();for(const wet of [false,true]){
  const subset=cells.filter(p=>p.wet===wet);if(!subset.length)continue;const pos:number[]=[],uv:number[]=[],indices:number[]=[],col:number[]=[];
  for(const c of subset){const n=pos.length/3;pos.push(c.x,.015,c.z,c.x+1,.015,c.z,c.x+1,.015,c.z+1,c.x,.015,c.z+1);uv.push(c.x,c.z,c.x+1,c.z,c.x+1,c.z+1,c.x,c.z+1);indices.push(n,n+2,n+1,n,n+3,n+2);const tint=new THREE.Color(c.dead?'#938976':wet?'#806343':'#ffffff');for(let k=0;k<4;k++)col.push(tint.r,tint.g,tint.b);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));geo.setIndex(indices);geo.computeVertexNormals();const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:this.surcos,vertexColors:true,roughness:1}));m.receiveShadow=true;group.add(m);
 }
 const owned=new Set(cells.map(c=>c.x+','+c.z));for(const c of cells)for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]])if(!owned.has((c.x+dx)+','+(c.z+dz)))caja(group,[dx?.055:1,.025,dz?.055:1],[c.x+.5+dx*.49,.014,c.z+.5+dz*.49],'#a98150');compactar(group);return group;}
 camino(id:string,vecinos:{n:boolean;s:boolean;e:boolean;w:boolean}){const g=new THREE.Group();const wood=/madera|tabl/.test(id),sand=/arena|tierra/.test(id);const m=new THREE.Mesh(new THREE.BoxGeometry(1,.07,1),new THREE.MeshStandardMaterial({color:sand?'#c0a06e':wood?'#edd4ae':'#d1ccba',map:sand?null:wood?this.madera:this.piedra,roughness:1}));m.position.y=.035;m.receiveShadow=true;g.add(m);const border=wood?'#725939':'#8e9278';if(!sand){if(!vecinos.n)caja(g,[1,.07,.045],[0,.045,-.48],border);if(!vecinos.s)caja(g,[1,.07,.045],[0,.045,.48],border);if(!vecinos.e)caja(g,[.045,.07,1],[.48,.045,0],border);if(!vecinos.w)caja(g,[.045,.07,1],[-.48,.045,0],border);}return g;}
 pasto(x:number,z:number,w:number,d:number,density=300,visible:(x:number,z:number)=>boolean=()=>true){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-.035,0,0,.035,0,0,0,.24,.025,0,0,-.025,0,0,.025,.035,.19,0],3));geo.computeVertexNormals();const grass=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:'#739350',side:THREE.DoubleSide,roughness:1}),density),dummy=new THREE.Object3D();for(let i=0;i<density;i++){dummy.position.set(x+hash(i,x)*w,.01,z+hash(i,z+20)*d);dummy.rotation.y=hash(i,99)*Math.PI;dummy.scale.setScalar(visible(dummy.position.x,dummy.position.z)?(.65+hash(i,31)*.7):0);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);}return grass;}
 dispose(){[this.hierba,this.surcos,this.piedra,this.madera].forEach(t=>t.dispose());}
}
