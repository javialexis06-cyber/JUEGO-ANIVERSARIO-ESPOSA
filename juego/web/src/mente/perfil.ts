import { perfilAmigo } from '../salas/perfil';
/** Una misma tableta puede tener la pareja y perfiles amigos distintos. Las marcas e identidades no se mezclan. */
export function clavePerfil(base:string):string {
 const amigo=perfilAmigo();if(amigo?.activo)return `${base}:${amigo.id}`;
 let rol=new URLSearchParams(location.search).get('rol');
 if(rol!=='el'&&rol!=='ella')for(const k of ['nuestro-hogar-sesion','nuestro-hogar-modo']){try{const r=JSON.parse(localStorage.getItem(k)??'null')?.rol;if(r==='el'||r==='ella'){rol=r;break;}}catch{/* sin sesión */}}
 return `${base}:${rol==='el'||rol==='ella'?rol:'visitante'}`;
}
