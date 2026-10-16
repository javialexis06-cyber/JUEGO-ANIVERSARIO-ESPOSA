// Resolutores para los recorridos: devuelven acciones legales; no alteran tablero, reloj ni resultado.
export function caminoDeslizante(inicio){
 const goal='123456780',s=inicio.join('');if(s===goal)return [];
 let frente=new Map([[s,[]]]),atras=new Map([[goal,[]]]),v1=new Set([s]),v2=new Set([goal]);
 while(frente.size&&atras.size){const nuevo=new Map();for(const [st,path] of frente){const c=st.indexOf('0');for(const i of [c-3,c+3,c-1,c+1]){if(i<0||i>8||Math.abs(i%3-c%3)+Math.abs(Math.floor(i/3)-Math.floor(c/3))!==1)continue;const a=[...st];[a[c],a[i]]=[a[i],a[c]];const k=a.join('');if(v1.has(k))continue;const p=[...path,i];if(atras.has(k)){const reversa=atras.get(k),moves=[...p];let actual=k;for(let j=reversa.length-1;j>=0;j--){const target=reversa[j];const q=actual.indexOf('0');moves.push(target);const b=[...actual];[b[q],b[target]]=[b[target],b[q]];actual=b.join('');}return moves;}v1.add(k);nuevo.set(k,p);}}
  frente=nuevo;
  // La búsqueda inversa conserva la casilla vacía anterior: sirve como movimiento para volver hacia la meta.
  const na=new Map();for(const [st,path] of atras){const c=st.indexOf('0');for(const i of [c-3,c+3,c-1,c+1]){if(i<0||i>8||Math.abs(i%3-c%3)+Math.abs(Math.floor(i/3)-Math.floor(c/3))!==1)continue;const a=[...st];[a[c],a[i]]=[a[i],a[c]];const k=a.join('');if(v2.has(k))continue;const p=[...path,c];if(frente.has(k))return [...frente.get(k),...p.toReversed()];v2.add(k);na.set(k,p);}}atras=na;
 }throw Error('Rompecabezas sin solución');
}
export function caminoLaberinto(m){const n=m.taman,cola=[m.cursor],prev=new Map([[m.cursor,null]]);for(let c=0;c<cola.length;c++){const p=cola[c];if(p===m.solucion[0]){const r=[];let i=p;while(prev.get(i)!==null){r.unshift(i);i=prev.get(i);}return r;}for(const j of [p-n,p+n,p-1,p+1])if(j>=0&&j<m.tablero.length&&!m.tablero[j]&&!prev.has(j)&&Math.abs(j%n-p%n)+Math.abs(Math.floor(j/n)-Math.floor(p/n))===1){prev.set(j,p);cola.push(j);}}throw Error('Laberinto sin salida');}
export function palabrasSopa(m){return m.palabras.map(w=>{for(let i=0;i<64;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const x=i%8,y=Math.floor(i/8),px=x+dx*(w.length-1),py=y+dy*(w.length-1);if(px<0||px>=8||py<0||py>=8)continue;const p=Array.from(w,(_,k)=>(y+dy*k)*8+x+dx*k);if(p.map(j=>String.fromCharCode(m.tablero[j])).join('')===w)return [i,p.at(-1)];}throw Error('Falta palabra '+w);});}
export function resolverSudoku(tablero){const b=[...tablero];function paso(){const i=b.indexOf(0);if(i<0)return true;for(let v=1;v<=4;v++){if(b.some((x,j)=>x===v&&(Math.floor(j/4)===Math.floor(i/4)||j%4===i%4||Math.floor(j/8)===Math.floor(i/8)&&Math.floor(j%4/2)===Math.floor(i%4/2))))continue;b[i]=v;if(paso())return true;b[i]=0;}return false;}if(!paso())throw Error('Sudoku sin solución');return b;}
export function movimientosHanoi(n=4,a=0,b=2,c=1){if(!n)return [];return [...movimientosHanoi(n-1,a,c,b),[a,b],...movimientosHanoi(n-1,c,b,a)];}
export function siguientes(m,tangram,colores){const a=(tipo,valor)=>({tipo,valor});switch(m.id){
 case 'parejas':{const grupos=new Map();m.tablero.forEach((v,i)=>{if(!m.encontrados.includes(i)){const g=grupos.get(v)??[];g.push(i);grupos.set(v,g);}});return [...grupos.values()].flatMap(g=>g.map(i=>a('celda',i)));}
 case 'simon':return [...m.solucion].map(i=>a('celda',i));
 case 'cuadricula':case 'compras':return [...m.solucion.map(i=>a('celda',i)),a('confirmar')];
 case 'diferencias':return m.tablero.flatMap((v,i)=>v!==m.otro[i]?[a('celda',i)]:[]);
 case 'buscar':return [a('celda',m.tablero.indexOf(m.cursor))];
 case 'stroop':return [a('opcion',colores[m.cursor])];
 case 'calculo':{const [x,op,y]=m.texto.split(' '),r=op==='+'?+x + +y:op==='−'?+x-+y:+x*+y;return [a('opcion',String(r))];}
 case 'sudoku':{const sol=resolverSudoku(m.tablero);return [...sol.flatMap((v,i)=>m.fijos.includes(i)?[]:[a('celda',i),a('opcion',String(v))]),a('confirmar')];}
 case 'sopa':return palabrasSopa(m).flatMap(p=>p.map(i=>a('celda',i)));
 case 'anagramas':{const usados=new Set();return [...[...m.texto].map(c=>{const i=m.tablero.findIndex((v,k)=>m.texto[v]===c&&!usados.has(k));usados.add(i);return a('celda',i);}),a('confirmar')];}
 case 'deslizante':return caminoDeslizante(m.tablero).map(i=>a('celda',i));
 case 'tangram':return tangram.flatMap((p,i)=>[a('celda',i),...Array.from({length:p.giro/45},()=>a('girar')),{tipo:'colocar',x:p.x,y:p.y}]);
 case 'hanoi':return movimientosHanoi().flatMap(p=>p.map(i=>a('celda',i)));
 case 'laberinto':return caminoLaberinto(m).map(i=>a('celda',i));
 case 'nback':return [a('opcion',m.solucion[m.turno]===m.solucion[m.turno-2]?1:0)];
 }throw Error(m.id);}
