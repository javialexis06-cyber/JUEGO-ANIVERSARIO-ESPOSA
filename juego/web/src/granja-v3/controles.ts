/** Held inputs are reset on focus loss; keyboard movement never depends on key repeat. */
export class ControlesGranja {
 private teclas=new Set<string>();private tactil=new Set<string>();
 /** Palanca táctil analógica (x a la derecha, y hacia arriba de la pantalla, largo 0..1). */
 eje={x:0,y:0};
 constructor(){
  const movement=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight'];
  window.addEventListener('keydown',e=>{if((e.target as HTMLElement)?.closest('input,select,textarea,[contenteditable="true"],.side-panel'))return;if(movement.includes(e.code)){this.teclas.add(e.code);e.preventDefault();}});
  window.addEventListener('keyup',e=>this.teclas.delete(e.code));window.addEventListener('blur',()=>this.limpiar());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.limpiar();});
 }
 limpiar(){this.teclas.clear();this.tactil.clear();this.eje={x:0,y:0};}
 leer(){const has=(...keys:string[])=>keys.some(k=>this.teclas.has(k)||this.tactil.has(k));const x=Number(has('KeyD','ArrowRight'))-Number(has('KeyA','ArrowLeft')),y=Number(has('KeyW','ArrowUp'))-Number(has('KeyS','ArrowDown'));if(!x&&!y&&(this.eje.x||this.eje.y))return{x:this.eje.x,y:this.eje.y,correr:Math.hypot(this.eje.x,this.eje.y)>.92};return{x,y,correr:has('ShiftLeft','ShiftRight')};}
 conectarPad(root:HTMLElement){root.querySelectorAll<HTMLElement>('[data-move]').forEach(b=>{const stop=()=>{this.tactil.delete(b.dataset.move!);b.classList.remove('pressed')};b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);this.tactil.add(b.dataset.move!);b.classList.add('pressed')});b.addEventListener('pointerup',stop);b.addEventListener('pointercancel',stop);b.addEventListener('lostpointercapture',stop);});}
}
