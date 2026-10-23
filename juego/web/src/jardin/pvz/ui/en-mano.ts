/** Herramienta que sigue al puntero. Solo presentación: no planta, cobra ni avanza el motor. */
export class EnManoPvZ {
 readonly elemento=document.createElement('img');private fuente='';private x=0;private y=0;private dentro=false;private tactil=false;private habilitada=true;
 private eventos=new AbortController();
 constructor(private campo:HTMLElement,private padre:HTMLElement){
  const img=this.elemento;img.className='pvz-en-mano';img.alt='';img.draggable=false;img.hidden=true;img.setAttribute('aria-hidden','true');padre.append(img);
  const mover=(e:PointerEvent)=>{this.x=e.clientX;this.y=e.clientY;this.tactil=e.pointerType==='touch';this.dentro=true;this.pintar();};
  campo.addEventListener('pointermove',mover,{signal:this.eventos.signal});campo.addEventListener('pointerdown',mover,{signal:this.eventos.signal});campo.addEventListener('pointerenter',mover,{signal:this.eventos.signal});
  campo.addEventListener('pointerleave',()=>{this.dentro=false;this.pintar();},{signal:this.eventos.signal});
  campo.addEventListener('pointerup',()=>{if(this.tactil){this.dentro=false;this.pintar();}},{signal:this.eventos.signal});
 }
 elegir(fuente:string|null,pala=false){this.fuente=fuente??'';if(fuente&&this.elemento.getAttribute('src')!==fuente)this.elemento.src=fuente;this.elemento.dataset.herramienta=pala?'pala':'semilla';this.pintar();}
 habilitar(v:boolean){this.habilitada=v;this.pintar();}
 private pintar(){const activo=!!this.fuente&&this.habilitada;this.elemento.hidden=!activo||!this.dentro;this.campo.classList.toggle('pvz-cursor-propio',activo);this.elemento.style.left=this.x+'px';this.elemento.style.top=(this.y-(this.tactil?45:0))+'px';}
 destruir(){this.eventos.abort();this.campo.classList.remove('pvz-cursor-propio');this.elemento.remove();}
}
