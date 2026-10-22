import {MotorConquista} from './motor';
import {otroBando,type Bando} from './tipos';
/** Piloto de verificación: solo manda las órdenes públicas, paga sus costes y respeta las recargas. */
export function crearPilotoConquista(b:Bando){let proxima=0,n=0;return(m:MotorConquista)=>{
 const s=m.estado;if(s.t<proxima||s.ganador)return;proxima=s.t+.45;n++;
 const enemigos=m.activos.filter(f=>f.atacante===b||s.zonas[f.zona].dueno===b).sort((a,c)=>a.nucleos[b]/a.maximos[b]-c.nucleos[b]/c.maximos[b]);
 for(const f of enemigos){
  for(let j=0;j<3;j++){const fila=(n+j)%3;
   if(b==='plantas'){
    let col=Math.floor(f.cabecera[fila]);while(col>=0&&f.unidades.some(u=>u.bando===b&&u.fila===fila&&Math.abs(u.x-(110+col*88))<35))col--;
    if(col<0)continue;const ficha=n%6===0?'hielaguisantes':s.reservas[b]>=65?'repetidora':'lanzaguisantes';
    if(m.ordenar(b,{tipo:'desplegar',frente:f.id,ficha,fila,col}))return;
   }else if(s.reservas[b]>40&&m.ordenar(b,{tipo:'desplegar',frente:f.id,ficha:n%3===0?'zombi-futbolista':'caracono',fila,col:7}))return;
  }
 }
 if(s.reservas[b]<85)return;
 const fuerte=s.zonas.find(z=>z.base===otroBando(b))!,candidatos=s.zonas.filter(z=>m.puedeAtacar(b,z.id)).sort((a,c)=>{const punt=(z:typeof a)=>(z.base?18:0)+z.perfil*2+Math.abs(z.col-fuerte.col)+Math.abs(z.fila-fuerte.fila);return punt(a)-punt(c);});
 if(candidatos.length)m.ordenar(b,{tipo:'atacar',zona:candidatos[0].id,fuerza:90});
};}
