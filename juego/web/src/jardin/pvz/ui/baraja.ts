/** Viaje visual entre catálogo y baraja. La selección real ya está confirmada por la interfaz. */
export function volarSobrePvZ(padre:HTMLElement,fuente:string,desde:DOMRect,hasta:HTMLElement|null){
 if(!hasta||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const destino=hasta.getBoundingClientRect(),img=document.createElement('img');img.src=fuente;img.alt='';img.className='pvz-sobre-volando';img.setAttribute('aria-hidden','true');
 Object.assign(img.style,{left:desde.left+'px',top:desde.top+'px',width:desde.width+'px',height:desde.height+'px'});padre.append(img);
 const anim=img.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${destino.left-desde.left}px,${destino.top-desde.top}px) scale(${destino.width/desde.width},${destino.height/desde.height})`,opacity:.95}],{duration:340,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'});
 void anim.finished.catch(()=>{}).finally(()=>img.remove());
}
