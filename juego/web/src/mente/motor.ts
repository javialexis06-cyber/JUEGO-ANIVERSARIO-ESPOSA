import { juegoDe, type IdMental } from './catalogo';
export const FIGURAS=['🌼','🍓','🦋','🍀','🐞','🌙','⭐','🍄','🍋','🪻','🐝','🍒','🧵','🧸','🪁','🌻'];
export const COLORES=['Rojo','Azul','Verde','Violeta'];
export const TINTAS=['#bf3f56','#306fbb','#328357','#9260b5'];
const PALABRAS=[['LUNA','Cielo'],['GATO','Animal'],['CASA','Lugar para vivir'],['RANA','Animal que salta'],['FLOR','Jardín'],['PERRO','Animal que ladra'],['NUBE','Cielo'],['LIMON','Fruta ácida'],['PLUMA','Ave'],['MANGO','Fruta'],['LIBRO','Lectura'],['BARCO','Transporte sobre agua']];
export const PRODUCTOS=['Pan','Leche','Arroz','Huevos','Mango','Queso','Tomate','Jabón','Café','Sal','Papa','Limón','Avena','Manzana','Lentejas','Zanahoria'];
export interface Pieza {p:number[][];x:number;y:number;giro:number;periodo:number}
export const TANGRAM:Pieza[]=[
 {p:[[0,0],[141.421356,0],[0,141.421356]],x:140,y:140,giro:225,periodo:360},
 {p:[[0,0],[141.421356,0],[0,141.421356]],x:140,y:140,giro:135,periodo:360},
 {p:[[0,0],[100,0],[0,100]],x:240,y:240,giro:180,periodo:360},
 {p:[[0,0],[70.710678,0],[0,70.710678]],x:190,y:90,giro:315,periodo:360},
 {p:[[0,0],[70.710678,0],[0,70.710678]],x:140,y:140,giro:45,periodo:360},
 {p:[[0,0],[70.710678,0],[70.710678,70.710678],[0,70.710678]],x:140,y:140,giro:315,periodo:90},
 {p:[[0,0],[100,0],[150,-50],[50,-50]],x:40,y:240,giro:0,periodo:180},
];
export type Fase='observar'|'jugar'|'fin';
export type Accion={tipo:'celda'|'opcion'|'confirmar'|'borrar'|'girar'|'colocar'|'mover';valor?:number|string;x?:number;y?:number};
export class MotorMental {
 readonly version=1; readonly id:IdMental;readonly semilla:number;
 fase:Fase='jugar';tiempo=0;espera=0;ronda=0;aciertos=0;errores=0;movimientos=0;puntos=0;completo=false;
 tablero:number[]=[];otro:number[]=[];solucion:number[]=[];seleccion:number[]=[];fijos:number[]=[];encontrados:number[]=[];
 opciones:string[]=[];palabras:string[]=[];texto='';tema='';taman=4;cursor=0;giro=0;torres:number[][]=[];turno=0;
 private azarEstado:number;private mensajeT=0;aviso='';
 constructor(id:IdMental,semilla:number){this.id=id;this.semilla=semilla;this.azarEstado=semilla>>>0||1;this.preparar();}
 private rnd(){let a=this.azarEstado;a^=a<<13;a^=a>>>17;a^=a<<5;this.azarEstado=a>>>0;return this.azarEstado/4294967296;}
 private n(max:number){return Math.floor(this.rnd()*max);}
 private mezclar<T>(a:T[]):T[]{const b=[...a];for(let i=b.length-1;i>0;i--){const k=this.n(i+1);[b[i],b[k]]=[b[k],b[i]];}return b;}
 private decir(t:string){this.aviso=t;this.mensajeT=2;}
 private error(t='Prueba otra vez'){this.errores++;this.decir(t);}
 private terminar(completo=true){this.fase='fin';this.completo=completo;const precision=this.aciertos/Math.max(1,this.aciertos+this.errores);
  this.puntos=completo?Math.max(0,Math.round(precision*(7000+3000*Math.min(1,juegoDe(this.id).objetivo/Math.max(1,this.tiempo))))):0;}
 private observar(segundos:number){this.fase='observar';this.espera=segundos;this.seleccion=[];}
 private preparar(){
  switch(this.id){
   case 'parejas':this.tablero=this.mezclar([...Array(8).keys(),...Array(8).keys()]);break;
   case 'simon':this.solucion=Array.from({length:3},()=>this.n(4));this.observar(3*.8+.5);break;
   case 'cuadricula':this.nuevaCuadricula();break;
   case 'diferencias':this.tablero=Array.from({length:16},()=>this.n(8));this.otro=[...this.tablero];this.solucion=this.mezclar([...Array(16).keys()]).slice(0,5);for(const i of this.solucion)this.otro[i]=(this.otro[i]+1+this.n(7))%8;break;
   case 'buscar':this.nuevaBusqueda();break;
   case 'stroop':this.nuevoColor();break;
   case 'calculo':this.nuevaCuenta();break;
   case 'sudoku':this.sudoku();break;
   case 'sopa':this.sopa();break;
   case 'anagramas':this.palabras=this.mezclar(PALABRAS.map(x=>x[0])).slice(0,6);this.anagrama();break;
   case 'deslizante':{
    this.taman=3;this.tablero=[1,2,3,4,5,6,7,8,0];let prev=-1;
    for(let k=0;k<90;k++){const cero=this.tablero.indexOf(0),r=Math.floor(cero/3),c=cero%3;const vec=[cero-3,cero+3,cero-1,cero+1].filter(i=>i>=0&&i<9&&Math.abs(Math.floor(i/3)-r)+Math.abs(i%3-c)===1&&i!==prev);const i=vec[this.n(vec.length)];[this.tablero[cero],this.tablero[i]]=[this.tablero[i],this.tablero[cero]];prev=cero;}
    if(this.tablero.every((v,i)=>v===(i+1)%9))[this.tablero[7],this.tablero[8]]=[0,8];break;}
   case 'tangram':this.tablero=this.mezclar([...Array(7).keys()]);this.otro=Array(7).fill(-1);this.cursor=-1;break;
   case 'hanoi':this.torres=[[4,3,2,1],[],[]];this.cursor=-1;break;
   case 'laberinto':this.laberinto();break;
   case 'compras':this.solucion=this.mezclar([...Array(16).keys()]).slice(0,8);this.tablero=this.mezclar([...Array(16).keys()]);this.observar(8);break;
   case 'nback':this.solucion=[];for(let i=0;i<24;i++)this.solucion.push(i>1&&this.rnd()<.35?this.solucion[i-2]:this.n(8));this.observar(1.6);break;
  }
 }
 private nuevaCuadricula(){this.solucion=this.mezclar([...Array(16).keys()]).slice(0,4+this.ronda);this.observar(4);}
 private nuevaBusqueda(){this.cursor=this.n(16);this.solucion=[this.n(36)];this.tablero=Array.from({length:36},()=>{let v=this.n(15);if(v>=this.cursor)v++;return v;});this.tablero[this.solucion[0]]=this.cursor;this.taman=6;}
 private nuevoColor(){this.cursor=this.n(4);this.texto=COLORES[this.n(4)];this.opciones=[...COLORES];}
 private nuevaCuenta(){const a=2+this.n(18),b=2+this.n(12),tipo=this.n(3);const valor=tipo===0?a+b:tipo===1?a-b:a*b;this.texto=`${a} ${['+','−','×'][tipo]} ${b}`;const otros=new Set([valor]);while(otros.size<4)otros.add(valor+this.n(19)-9);this.opciones=this.mezclar([...otros]).map(String);this.cursor=valor;}
 private sudoku(){
  const nums=this.mezclar([1,2,3,4]);this.solucion=Array.from({length:16},(_,i)=>nums[(Math.floor(i/4)*2+Math.floor(Math.floor(i/4)/2)+i%4)%4]);
  this.tablero=[...this.solucion];
  for(const i of this.mezclar([...Array(16).keys()])){
   const antes=this.tablero[i];this.tablero[i]=0;if(this.solucionesSudoku([...this.tablero],2)!==1)this.tablero[i]=antes;
   if(this.tablero.filter(Boolean).length<=7)break;
  }
  this.fijos=this.tablero.map((v,i)=>v?i:-1).filter(i=>i>=0);this.cursor=this.tablero.indexOf(0);this.opciones=['1','2','3','4','Borrar'];
 }
 private solucionesSudoku(b:number[],tope:number):number{
  const i=b.indexOf(0);if(i<0)return 1;let n=0;for(let v=1;v<=4;v++){const r=Math.floor(i/4),c=i%4;if(b.some((x,j)=>x===v&&(Math.floor(j/4)===r||j%4===c||Math.floor(Math.floor(j/4)/2)===Math.floor(r/2)&&Math.floor(j%4/2)===Math.floor(c/2))))continue;b[i]=v;n+=this.solucionesSudoku(b,tope-n);b[i]=0;if(n>=tope)return n;}return n;
 }
 private sopa(){
  this.taman=8;this.tablero=Array(64).fill(-1);this.palabras=this.mezclar(PALABRAS.filter(p=>p[0].length<=5).map(p=>p[0])).slice(0,6);
  for(const palabra of this.palabras){let puesta=false;for(let k=0;k<300&&!puesta;k++){
   const [dx,dy]=[[1,0],[0,1],[1,1],[-1,1]][this.n(4)],x=this.n(8),y=this.n(8),ex=x+dx*(palabra.length-1),ey=y+dy*(palabra.length-1);if(ex<0||ex>=8||ey<0||ey>=8)continue;
   const pos=Array.from(palabra,(_,i)=>(y+dy*i)*8+x+dx*i);if(pos.some((p,i)=>this.tablero[p]>=0&&this.tablero[p]!==palabra.charCodeAt(i)))continue;
   pos.forEach((p,i)=>this.tablero[p]=palabra.charCodeAt(i));puesta=true;
  }if(!puesta){this.sopa();return;}}
  this.tablero=this.tablero.map(v=>v<0?65+this.n(26):v);
 }
 private anagrama(){const p=this.palabras[this.ronda];this.texto=p;this.tema=PALABRAS.find(x=>x[0]===p)![1];this.tablero=this.mezclar([...p].map((_,i)=>i));this.seleccion=[];}
 private laberinto(){
  this.taman=11;const n=11;this.tablero=Array(n*n).fill(1);const pila=[n+1];this.tablero[n+1]=0;
  while(pila.length){const i=pila.at(-1)!,x=i%n,y=Math.floor(i/n),vec=this.mezclar([[2,0],[-2,0],[0,2],[0,-2]]).filter(([dx,dy])=>x+dx>0&&x+dx<n-1&&y+dy>0&&y+dy<n-1&&this.tablero[i+dy*n+dx]===1);if(!vec.length){pila.pop();continue;}const [dx,dy]=vec[0];this.tablero[i+dy/2*n+dx/2]=0;this.tablero[i+dy*n+dx]=0;pila.push(i+dy*n+dx);}
  this.cursor=n+1;this.solucion=[n*n-n-2];
 }
 get luzSimon(){if(this.id!=='simon'||this.fase!=='observar')return -1;const t=this.solucion.length*.8+.5-this.espera;const i=Math.floor(t/.8);return t%.8<.6?this.solucion[i]??-1:-1;}
 paso(dt:number){
  if(this.fase==='fin')return;dt=Math.max(0,Math.min(dt,.25));this.tiempo+=dt;this.mensajeT-=dt;if(this.mensajeT<=0)this.aviso='';
  if(this.tiempo>=900){this.terminar(false);return;}
  if(this.espera>0){this.espera-=dt;if(this.espera>0)return;
   if(this.id==='parejas'){this.seleccion=[];return;}
   if(this.id==='nback'&&this.fase==='observar'){this.turno++;if(this.turno<2){this.espera=1.6;return;}this.fase='jugar';this.espera=8;return;}
   if(this.id==='nback'){this.responderNback(-1);return;}
   this.fase='jugar';
  }
 }
 accion(a:Accion){
  if(this.fase!=='jugar'||this.id==='parejas'&&this.espera>0)return;
  const n=Number(a.valor);this.movimientos++;
  switch(this.id){
   case 'parejas':if(a.tipo==='celda'&&this.valida(n)&&!this.encontrados.includes(n)&&!this.seleccion.includes(n)){
    this.seleccion.push(n);if(this.seleccion.length===2){const [i,j]=this.seleccion;if(this.tablero[i]===this.tablero[j]){this.encontrados.push(i,j);this.seleccion=[];this.aciertos++;if(this.aciertos===8)this.terminar();}else{this.error('Esas cartas no son pareja');this.espera=.8;}}}break;
   case 'simon':if(a.tipo==='celda'&&n>=0&&n<4){if(n!==this.solucion[this.seleccion.length]){this.error('Observa de nuevo el orden');this.observar(this.solucion.length*.8+.5);break;}this.seleccion.push(n);if(this.seleccion.length===this.solucion.length){this.aciertos++;this.ronda++;if(this.ronda===5)this.terminar();else{this.solucion.push(this.n(4));this.observar(this.solucion.length*.8+.5);}}}break;
   case 'cuadricula':case 'compras':if(a.tipo==='celda'&&n>=0&&n<16)this.alternar(n);else if(a.tipo==='confirmar'){
    if(this.seleccion.length===this.solucion.length&&this.solucion.every(i=>this.seleccion.includes(i))){this.aciertos++;this.ronda++;if(this.id==='compras'||this.ronda===3)this.terminar();else this.nuevaCuadricula();}
    else{this.error('La selección no coincide. Vuelve a observar.');this.observar(this.id==='compras'?8:4);}}break;
   case 'diferencias':if(a.tipo==='celda'&&this.valida(n)&&!this.encontrados.includes(n)){if(this.solucion.includes(n)){this.encontrados.push(n);this.aciertos++;if(this.aciertos===5)this.terminar();}else this.error('Las dos casillas son iguales');}break;
   case 'buscar':if(a.tipo==='celda'&&this.valida(n)){if(n===this.solucion[0]){this.aciertos++;this.ronda++;if(this.ronda===10)this.terminar();else this.nuevaBusqueda();}else this.error('Busca la figura de arriba');}break;
   case 'stroop':case 'calculo':if(a.tipo==='opcion'&&this.opciones.includes(String(a.valor))){const correcto=this.id==='stroop'?COLORES[this.cursor]===a.valor:this.cursor===n;if(correcto)this.aciertos++;else this.error('La siguiente es una nueva oportunidad');this.ronda++;if(this.ronda===12)this.terminar();else if(this.id==='stroop')this.nuevoColor();else this.nuevaCuenta();}break;
   case 'sudoku':if(a.tipo==='celda'&&this.valida(n)&&!this.fijos.includes(n))this.cursor=n;
    else if(a.tipo==='opcion'&&!this.fijos.includes(this.cursor)&&this.cursor>=0){if(a.valor==='Borrar')this.tablero[this.cursor]=0;else if(n>=1&&n<=4)this.tablero[this.cursor]=n;}
    else if(a.tipo==='confirmar'){if(this.tablero.every((v,i)=>v===this.solucion[i])){this.aciertos=16-this.fijos.length;this.terminar();}else this.error('Aún faltan casillas o hay números repetidos');}break;
   case 'sopa':if(a.tipo==='celda'&&this.valida(n)){if(!this.seleccion.length)this.seleccion=[n];else{
    const i=this.seleccion[0],x=i%8,y=Math.floor(i/8),dx=n%8-x,dy=Math.floor(n/8)-y;this.seleccion=[];
    if(dx!==0&&dy!==0&&Math.abs(dx)!==Math.abs(dy)){this.error('Elige una línea recta');break;}
    const largo=Math.max(Math.abs(dx),Math.abs(dy))+1,camino=Array.from({length:largo},(_,k)=>(y+k*Math.sign(dy))*8+x+k*Math.sign(dx));
    const texto=camino.map(p=>String.fromCharCode(this.tablero[p])).join('');const w=this.palabras.findIndex(w=>w===texto||[...w].reverse().join('')===texto);
    if(w>=0&&!this.fijos.includes(w)){this.fijos.push(w);this.encontrados.push(...camino);this.aciertos++;if(this.aciertos===this.palabras.length)this.terminar();}else this.error(w>=0?'Ya encontraste esa palabra':'Esa línea no contiene una palabra de la lista');}}break;
   case 'anagramas':if(a.tipo==='celda'&&this.valida(n)&&!this.seleccion.includes(n))this.seleccion.push(n);else if(a.tipo==='borrar')this.seleccion.pop();else if(a.tipo==='confirmar'){
    if(this.seleccion.map(i=>this.texto[this.tablero[i]]).join('')===this.texto){this.aciertos++;this.ronda++;if(this.ronda===6)this.terminar();else this.anagrama();}else this.error('Ordena todas las letras para formar la palabra');}break;
   case 'deslizante':if(a.tipo==='celda'&&this.valida(n)){const c=this.tablero.indexOf(0);if(Math.abs(n%3-c%3)+Math.abs(Math.floor(n/3)-Math.floor(c/3))===1){[this.tablero[n],this.tablero[c]]=[this.tablero[c],this.tablero[n]];if(this.tablero.every((v,i)=>v===(i+1)%9)){this.aciertos=1;this.terminar();}}}break;
   case 'tangram':if(a.tipo==='celda'&&n>=0&&n<7&&!this.encontrados.includes(n)){this.cursor=n;this.giro=0;}
    else if(a.tipo==='girar')this.giro=(this.giro+45)%360;
    else if(a.tipo==='colocar'&&this.cursor>=0&&!this.encontrados.includes(this.cursor)){const forma=(i:number)=>i<2?0:i===3||i===4?3:i;const hueco=TANGRAM.findIndex((p,i)=>this.otro[i]<0&&forma(i)===forma(this.cursor)&&Math.hypot((a.x??-999)-p.x,(a.y??-999)-p.y)<28&&((this.giro-p.giro)%p.periodo+p.periodo)%p.periodo===0);if(hueco>=0){this.otro[hueco]=this.cursor;this.encontrados.push(this.cursor);this.aciertos++;this.cursor=-1;if(this.aciertos===7)this.terminar();}else this.error('Comprueba la orientación y el punto de apoyo');}break;
   case 'hanoi':if(a.tipo==='celda'&&n>=0&&n<3){if(this.cursor<0){if(this.torres[n].length)this.cursor=n;}else{const desde=this.cursor;this.cursor=-1;if(desde===n)break;const d=this.torres[desde].at(-1)!;if((this.torres[n].at(-1)??99)>d){this.torres[desde].pop();this.torres[n].push(d);if(this.torres[2].length===4){this.aciertos=1;this.terminar();}}else this.error('Un disco grande no va sobre uno pequeño');}}break;
   case 'laberinto':{
    const nuevo=a.tipo==='mover'?this.cursor+({'arriba':-this.taman,'abajo':this.taman,'izquierda':-1,'derecha':1}[String(a.valor)]??0):n;
    if(this.valida(nuevo)&&!this.tablero[nuevo]&&Math.abs(nuevo%this.taman-this.cursor%this.taman)+Math.abs(Math.floor(nuevo/this.taman)-Math.floor(this.cursor/this.taman))===1){this.cursor=nuevo;if(nuevo===this.solucion[0]){this.aciertos=1;this.terminar();}}break;}
   case 'nback':if(a.tipo==='opcion'&&(n===0||n===1))this.responderNback(n);break;
  }
 }
 private responderNback(n:number){if((this.solucion[this.turno]===this.solucion[this.turno-2]?1:0)===n)this.aciertos++;else this.error(n===-1?'Se acabó el turno':'Observa la figura de hace dos turnos');this.turno++;if(this.turno>=24)this.terminar();else this.espera=8;}
 private valida(i:number){return Number.isInteger(i)&&i>=0&&i<this.tablero.length;}
 private alternar(n:number){const i=this.seleccion.indexOf(n);if(i<0)this.seleccion.push(n);else this.seleccion.splice(i,1);}
 exportar(){return JSON.parse(JSON.stringify(this));}
 static restaurar(f:ReturnType<MotorMental['exportar']>):MotorMental|null{
  if(!f||f.version!==1||!juegoDe(f.id)||!Number.isFinite(f.semilla)||!Number.isFinite(f.tiempo)||f.tiempo<0||f.tiempo>900)return null;
  try{const m=new MotorMental(f.id,f.semilla);Object.assign(m,f);if(!Array.isArray(m.tablero)||!Array.isArray(m.solucion)||!['jugar','observar','fin'].includes(m.fase))return null;return m;}catch{return null;}
 }
}
