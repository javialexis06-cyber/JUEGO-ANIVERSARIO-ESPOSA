import {RECURSOS_ARTE_PVZ,type HojaPvZ,type FiguraPvZ,urlArtePvZ} from './catalogo';
type Fuente=HTMLCanvasElement;
/** Recorta y guarda cada celda una vez al cargar; el cuadro solo hace drawImage. */
export class AtlasPvZ {
 private imagenes=new Map<HojaPvZ,HTMLImageElement>();private figuras=new Map<string,Fuente>();
 constructor(private rutas:Partial<Record<HojaPvZ,string>>={}){}
 async cargar(alCargar?:(clave:HojaPvZ)=>void){await Promise.all(Object.entries(RECURSOS_ARTE_PVZ).map(async([clave,archivo])=>{
  const img=new Image();img.decoding='async';if(['fondos','dia','ropa'].includes(clave))img.fetchPriority='high';img.src=this.rutas[clave as HojaPvZ]??urlArtePvZ(archivo);await img.decode();this.imagenes.set(clave as HojaPvZ,img);alCargar?.(clave as HojaPvZ);
 }));}
 disponible(hoja:HojaPvZ){return this.imagenes.has(hoja);}
 imagen(hoja:HojaPvZ){return this.imagenes.get(hoja);}
 fondo(indice:number){const img=this.imagenes.get('fondos');if(!img)throw Error('Faltan los escenarios');return{imagen:img,x:(indice%2)*img.width/2,y:Math.floor(indice/2)*img.height/2,w:img.width/2,h:img.height/2};}
 figura(f:Pick<FiguraPvZ,'hoja'|'celda'>):Fuente{
  const clave=f.hoja+':'+f.celda,anterior=this.figuras.get(clave);if(anterior)return anterior;
  const img=this.imagenes.get(f.hoja);if(!img)throw Error('Falta el atlas '+f.hoja);
  const unica=f.hoja==='tripitidora'||f.hoja==='nave',columnas=unica?1:4,filas=unica?1:2;
  const recortes=[[0,0,554,443],[554,0,850,443],[850,0,1326,443],[1326,0,1774,443],[0,443,512,887],[512,443,910,887],[910,443,1326,887],[1326,443,1774,887]];
  const r=f.hoja==='interfaz'?recortes[f.celda]:null;
  const x0=Math.round(r?r[0]*img.width/1774:(f.celda%columnas)*img.width/columnas),y0=Math.round(r?r[1]*img.height/887:Math.floor(f.celda/columnas)*img.height/filas),w=Math.round(r?(r[2]-r[0])*img.width/1774:((f.celda%columnas)+1)*img.width/columnas-x0),h=Math.round(r?(r[3]-r[1])*img.height/887:(Math.floor(f.celda/columnas)+1)*img.height/filas-y0);
  const celda=document.createElement('canvas');celda.width=w;celda.height=h;const ctx=celda.getContext('2d')!;ctx.drawImage(img,x0,y0,w,h,0,0,w,h);
  // Los materiales tienen brillos y bordes separados: conservar todos sus componentes.
  if(f.hoja==='interfaz'){const d=ctx.getImageData(0,0,w,h).data;let l=w,t=h,r=0,b=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}const salida=document.createElement('canvas');salida.width=r-l+1;salida.height=b-t+1;salida.getContext('2d')!.drawImage(celda,l,t,salida.width,salida.height,0,0,salida.width,salida.height);this.figuras.set(clave,salida);return salida;}
  const imagen=ctx.getImageData(0,0,w,h),datos=imagen.data,etiquetas=new Int32Array(w*h);let componente=0,principal=0;const visitado=new Uint8Array(w*h),pila=new Int32Array(w*h);let minX=w,minY=h,maxX=-1,maxY=-1,mayor=0;
  // Un borde de una figura vecina no debe formar parte del retrato de esta celda.
  // Se toma el componente conectado principal; los archivos originales se conservan completos.
  for(let i=0;i<w*h;i++)if(!visitado[i]&&datos[i*4+3]>48){
   componente++;let pendientes=1,cantidad=0,xmin=w,ymin=h,xmax=0,ymax=0;pila[0]=i;visitado[i]=1;
   while(pendientes){const n=pila[--pendientes],x=n%w,y=Math.floor(n/w);etiquetas[n]=componente;cantidad++;xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);
    for(const vecino of[x>0?n-1:-1,x<w-1?n+1:-1,y>0?n-w:-1,y<h-1?n+w:-1])if(vecino>=0&&!visitado[vecino]&&datos[vecino*4+3]>48){visitado[vecino]=1;pila[pendientes++]=vecino;}
   }
   if(cantidad>mayor){principal=componente;mayor=cantidad;minX=xmin;maxX=xmax;minY=ymin;maxY=ymax;}
  }
  for(let n=0;n<w*h;n++)if(etiquetas[n]!==principal){const x=n%w,adyacente=(!etiquetas[n]&&(x>0&&etiquetas[n-1]===principal||x<w-1&&etiquetas[n+1]===principal||n>=w&&etiquetas[n-w]===principal||n<w*(h-1)&&etiquetas[n+w]===principal));if(!adyacente)datos[n*4+3]=0;}
  ctx.putImageData(imagen,0,0);
  if(maxX<minX||maxY<minY)throw Error('Figura vacía '+clave);
  const margen=2;minX=Math.max(0,minX-margen);minY=Math.max(0,minY-margen);maxX=Math.min(w-1,maxX+margen);maxY=Math.min(h-1,maxY+margen);
  const salida=document.createElement('canvas'),escala=Math.min(1,384/Math.max(maxX-minX+1,maxY-minY+1));salida.width=Math.ceil((maxX-minX+1)*escala);salida.height=Math.ceil((maxY-minY+1)*escala);
  salida.getContext('2d')!.drawImage(celda,minX,minY,maxX-minX+1,maxY-minY+1,0,0,salida.width,salida.height);this.figuras.set(clave,salida);return salida;
 }
 miniatura(f:Pick<FiguraPvZ,'hoja'|'celda'>){return this.figura(f).toDataURL('image/png');}
 get cargadas(){return this.imagenes.size;}
 destruir(){for(const c of this.figuras.values()){c.width=1;c.height=1;}this.figuras.clear();for(const img of this.imagenes.values())img.src='';this.imagenes.clear();}
}
