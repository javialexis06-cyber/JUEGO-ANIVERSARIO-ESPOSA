import type { EstadoGranja, Resultado } from './estado';
import type { Pila } from './inventario';
import { calidadPila } from './inventario';
import { nombreCalidad } from './agricultura';
import { obtenerObjeto } from './objetos';
import { iconoInventario } from './inventario-ui';
import { admiteEnvio, valorCaja, valorEnvios, type ResumenEnvios } from './envios';
import { valorVenta } from './valor-venta';
import './envios-ui.css';
const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export interface SeleccionEnvio {origen:'mochila'|'caja';casilla:number}
const nombre=(p:Pila)=>obtenerObjeto(p.articulo)?.nombre??p.articulo;
const moneda=(n:number)=>n.toLocaleString('es')+' ◈';
const detalle=(p:Pila)=>nombreCalidad(calidadPila(p))+' · '+moneda(valorVenta(p))+' por unidad';
function rejilla(casillas:(Pila|null)[],origen:SeleccionEnvio['origen'],sel:SeleccionEnvio|null){return '<div class="envio-grid" role="group" aria-label="'+(origen==='mochila'?'Objetos de tu mochila':'Productos para enviar')+'">'+casillas.map((p,i)=>'<button type="button" class="envio-slot '+(sel?.origen===origen&&sel.casilla===i?'selected ':'')+(p&&!admiteEnvio(p)?'no-vendible':'')+'" data-envio-seleccion="'+origen+'" data-casilla="'+i+'" aria-label="'+esc(p?nombre(p)+' · '+detalle(p)+' · '+p.cantidad+' unidades':'Casilla vacía '+(i+1))+'" '+(!p?'disabled':'')+'>'+(p?iconoInventario(p.articulo)+'<b>'+p.cantidad+'</b>'+(calidadPila(p)?'<span class="envio-calidad q'+calidadPila(p)+'">★</span>':''):'')+'</button>').join('')+'</div>';}
export function renderEnvios(s:EstadoGranja,id:string,sel:SeleccionEnvio|null){
 const c=s.envios.cajas.find(c=>c.edificioId===id);if(!c)return '<div class="note">Esta caja ya no está colocada.</div>';
 const p=sel?(sel.origen==='mochila'?s.casillasInventario:c.casillas)[sel.casilla]:null;
 const accion=sel?.origen==='mochila'?'depositar':'retirar',habilitado=p&&(accion==='retirar'||admiteEnvio(p));
 const control=p?'<div class="envio-detalle">'+iconoInventario(p.articulo)+'<div><strong>'+esc(nombre(p))+'</strong><p>'+detalle(p)+' · '+p.cantidad+' disponibles</p></div>'+(habilitado?'<label for="envio-cantidad">Cantidad</label><input id="envio-cantidad" type="number" inputmode="numeric" value="1" min="1" max="'+p.cantidad+'"/><div class="buttons"><button class="btn" data-envio-transferir="'+accion+'">'+(accion==='depositar'?'Depositar':'Recuperar')+'</button><button class="btn" data-envio-transferir="'+accion+'" data-todo="si">'+(accion==='depositar'?'Depositar todo':'Recuperar todo')+'</button></div>':'<p class="small-text">Este objeto se guarda en cofres; no se puede enviar.</p>')+'</div>':'<p class="small-text">Selecciona una casilla de la mochila para depositar, o de la caja para recuperar.</p>';
 return '<div class="envio-cabecera"><span class="caps">Cobrarás al dormir</span><strong>'+moneda(valorCaja(c))+'</strong><p>'+c.casillas.filter(Boolean).length+' / '+c.casillas.length+' casillas · Total de todas tus cajas: '+moneda(valorEnvios(s.envios))+'</p></div><p class="small-text">Puedes recuperar cualquier producto antes de cerrar el día. Las calidades se conservan por separado.</p>'+control+'<h3>Tu mochila</h3>'+rejilla(s.casillasInventario,'mochila',sel)+'<h3>Preparado para esta noche</h3>'+rejilla(c.casillas,'caja',sel)+'<div class="note">El envío se vende y guarda al dormir. Cerrar el juego o volver después no cobra ni vacía la caja.</div>';
}
export function conectarEnvios(el:HTMLElement,op:{estado:()=>EstadoGranja;id:string;seleccion:()=>SeleccionEnvio|null;seleccionar:(s:SeleccionEnvio)=>void;transferir:(sentido:'depositar'|'retirar',casilla:number,cantidad:number)=>Promise<Resultado>}){
 let ocupado=false;const click=async(e:Event)=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-envio-seleccion],[data-envio-transferir]');if(!b||!el.contains(b)||ocupado)return;
 if(b.dataset.envioSeleccion){op.seleccionar({origen:b.dataset.envioSeleccion as SeleccionEnvio['origen'],casilla:Number(b.dataset.casilla)});return;}
 const sel=op.seleccion(),s=op.estado(),c=s.envios.cajas.find(c=>c.edificioId===op.id);if(!sel||!c)return;
 const p=(sel.origen==='mochila'?s.casillasInventario:c.casillas)[sel.casilla];if(!p)return;
 const n=b.dataset.todo?p.cantidad:Number(el.querySelector<HTMLInputElement>('#envio-cantidad')?.value);ocupado=true;b.disabled=true;
 try{await op.transferir(sel.origen==='mochila'?'depositar':'retirar',sel.casilla,n);}finally{ocupado=false;b.disabled=false;}
 };el.addEventListener('click',click);return ()=>el.removeEventListener('click',click);
}
export function renderVentasNoche(r:ResumenEnvios|undefined){if(!r)return '';return '<section class="envio-noche" aria-label="Desglose de ventas"><h3>Envíos de la granja</h3>'+(r.lineas.length?'<p>'+r.cajas+(r.cajas===1?' caja recogida':' cajas recogidas')+' · <strong>+'+moneda(r.total)+'</strong></p><table><thead><tr><th scope="col">Producto</th><th scope="col">Cantidad</th><th scope="col">Ingreso</th></tr></thead><tbody>'+r.lineas.map(p=>'<tr><th scope="row"><span>'+iconoInventario(p.articulo)+'</span><div>'+esc(nombre(p))+'<small>'+nombreCalidad(calidadPila(p))+' · '+moneda(p.unitario)+' por unidad</small></div></th><td>'+p.cantidad+'</td><td>'+moneda(p.total)+'</td></tr>').join('')+'</tbody></table>':'<p>No se enviaron productos esta noche.</p>')+'</section>';}
