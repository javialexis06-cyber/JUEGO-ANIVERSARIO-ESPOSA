import type { EstadoGranja, Accion, Resultado } from './estado';
import { iconoInventario } from './inventario-ui';
import { obtenerObjeto } from './objetos';
import { calidadPila } from './inventario';
import { LARGO_BARRA } from './barra';
import './barra-ui.css';
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function renderBarra(s:EstadoGranja,nombre:(id:string)=>string):string {
 const offset=s.filaBarra*LARGO_BARRA,teclas=['1','2','3','4','5','6','7','8','9','0','−','='];
 return `<div class="hotbar-slots">${Array.from({length:LARGO_BARRA},(_,i)=>{const p=s.casillasInventario[offset+i],def=obtenerObjeto(p?.articulo??''),nombreItem=p?nombre(p.articulo):'Manos libres',enForja=!!def?.herramienta&&def.herramienta.tipo===s.mejoraHerramienta?.herramienta;return `<button class="tool hotbar-slot ${s.casillaActiva===i?'active':''} ${enForja?'en-forja':''}" data-hotbar="${i}" data-casilla-real="${offset+i}" data-cantidad="${p?.cantidad??0}" draggable="${!!p}" aria-label="${esc(nombreItem)}" aria-pressed="${s.casillaActiva===i}" title="${esc(nombreItem)}${enForja?' · En la herrería':''}"><kbd>${teclas[i]}</kbd>${p?iconoInventario(p.articulo):'<span class="hotbar-empty">·</span>'}${p&&calidadPila(p)>0?`<span class="calidad-estrella calidad-${calidadPila(p)}" aria-label="Calidad ${calidadPila(p)}">★</span>`:''}${p&&p.cantidad>1?`<b class="hotbar-count">${p.cantidad}</b>`:''}${enForja?'<b class="hotbar-lock">⌛</b>':''}<span class="hotbar-item-name">${esc(nombreItem)}</span></button>`;}).join('')}</div><button class="btn hotbar-row" data-barra-fila="${(s.filaBarra+1)%(s.casillasInventario.length/LARGO_BARRA)}" title="Cambiar fila · Tab" aria-label="Cambiar fila de la barra"><strong>${s.filaBarra+1}/${s.casillasInventario.length/LARGO_BARRA}</strong><small>Tab ↻</small></button>`;
}
/** Both grid and toolbar carry absolute inventory indices: dragging moves, never copies. */
export function conectarBarra(root:HTMLElement,_capacidad:number,actuar:(a:Accion)=>Promise<Resultado>):()=>void {
 const abort=new AbortController(),{signal}=abort;let pendiente=false;
 const ejecutar=async(a:Accion)=>{if(pendiente)return;pendiente=true;try{await actuar(a)}finally{pendiente=false}};
 root.addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLElement>('[data-hotbar],[data-barra-fila]');if(!b)return;void ejecutar(b.dataset.barraFila!==undefined?{tipo:'fila_barra',fila:Number(b.dataset.barraFila)}:{tipo:'seleccionar_casilla',casilla:Number(b.dataset.hotbar)});},{signal});
 root.addEventListener('dragstart',e=>{const b=(e.target as Element).closest<HTMLElement>('[data-casilla-real]');if(!b||!Number(b.dataset.cantidad)){e.preventDefault();return;}e.dataTransfer?.setData('application/x-granjita-casilla',b.dataset.casillaReal!);if(e.dataTransfer)e.dataTransfer.effectAllowed='move';},{signal});
 root.addEventListener('dragover',e=>{if(e.dataTransfer?.types.includes('application/x-granjita-casilla')){e.preventDefault();e.dataTransfer.dropEffect='move';}},{signal});
 root.addEventListener('drop',e=>{const b=(e.target as Element).closest<HTMLElement>('[data-casilla-real]');if(!b||!e.dataTransfer?.types.includes('application/x-granjita-casilla'))return;e.preventDefault();const desde=Number(e.dataTransfer.getData('application/x-granjita-casilla')),hasta=Number(b.dataset.casillaReal);if(Number.isInteger(desde)&&desde!==hasta)void ejecutar({tipo:'mover_item',desde,hasta});},{signal});
 return ()=>abort.abort();
}
