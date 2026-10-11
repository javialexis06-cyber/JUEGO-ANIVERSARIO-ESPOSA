import { CLIMAS, CULTIVOS, type Estacion } from './catalogo';
import type { EstadoGranja } from './estado';
import { iconoInventario } from './inventario-ui';
import './cultivos-ui.css';
import { diasCultivo } from './agricultura';

const esc=(v:unknown)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const normalizar=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const memoria=new WeakMap<HTMLElement,{busqueda:string;filtro:string;clima:string;scroll:number}>();

export function renderCultivos(s:EstadoGranja,estacion:Estacion):string{
 return `<section class="cultivos-catalogo"><p class="small-text">Labra la tierra, aplica abono, siembra y riega. La calidad de la cosecha depende del abono y de tu experiencia.</p><div class="cultivos-filtros"><label>Buscar cultivo<input type="search" data-cultivo-buscar placeholder="Nombre o producto…"></label><label>Mostrar<select data-cultivo-filtro><option value="temporada">Temporada actual</option><option value="mochila">Semillas en mi mochila</option><option value="todos">Todos los cultivos</option></select></label><label>Hábitat<select data-cultivo-clima><option value="todos">Todos los climas</option>${Object.entries(CLIMAS).map(([id,n])=>`<option value="${id}">${n}</option>`).join('')}</select></label></div><p class="small-text" data-cultivo-conteo aria-live="polite"></p><div class="cultivos-lista">${CULTIVOS.map(c=>{
  const cantidad=s.inventario[c.semilla]??0,temporada=c.estaciones.includes(estacion),descubierto=!c.requiere||s.desbloqueos.includes(c.requiere),comprable=s.servicio==='semillas'&&temporada&&descubierto;
  const razon=!descubierto?'Descubre su región para conseguir estas semillas.':!temporada?'La tienda las ofrece en su temporada.':s.servicio!=='semillas'?'Compra en la tienda del pueblo.':'';
  return `<article class="card cultivo-card" data-cultivo="${c.id}" data-buscar="${esc(normalizar(c.nombre+' '+c.producto))}" data-temporada="${temporada}" data-semillas="${cantidad}" data-climas="${c.climas.join(' ')}"><div class="cultivo-cabecera"><span class="cultivo-icono">${iconoInventario(c.producto)}</span><div><h3>${esc(c.nombre)}</h3><span class="pill">${diasCultivo(c)} días de juego</span><span class="pill">Crece al dormir</span>${c.rebroteHoras?`<span class="pill">Rebrote · ${diasCultivo(c,'rebrote')} días</span>`:''}</div></div><p>${c.estaciones.join(' · ')}<br>${c.climas.map(c=>CLIMAS[c]).join(' / ')}</p><p class="small-text">${cantidad} semillas en tu mochila${c.enrejado?' · Crece en enrejado: deja un paso al lado.':''}${c.cosecha==='guadana'?' · Cosecha con guadaña.':''}</p>${razon?`<p class="small-text cultivo-aviso">${razon}</p>`:''}<div class="buttons"><button class="btn small primary" data-do="sembrar" data-id="${c.id}" ${cantidad&&descubierto?'':'disabled'}>Sembrar</button><button class="btn small" data-do="comprar-art" data-id="${c.semilla}" ${comprable?'':'disabled'}>Comprar · ${c.precio} ◈</button></div></article>`;
 }).join('')}</div><p class="note">El abono se aplica antes de que la planta crezca. Los cultivos que rebrotan lo conservan entre cosechas. Riega antes de 48 horas reales; una planta madura puede permanecer como decoración para siempre.</p></section>`;
}

export function conectarCultivos(root:HTMLElement):()=>void{
 const buscar=root.querySelector<HTMLInputElement>('[data-cultivo-buscar]')!,filtro=root.querySelector<HTMLSelectElement>('[data-cultivo-filtro]')!,clima=root.querySelector<HTMLSelectElement>('[data-cultivo-clima]')!;
 const anterior=memoria.get(root);if(anterior){buscar.value=anterior.busqueda;filtro.value=anterior.filtro;clima.value=anterior.clima;root.scrollTop=anterior.scroll;}
 const actualizar=()=>{const q=normalizar(buscar.value);let visibles=0;root.querySelectorAll<HTMLElement>('[data-cultivo]').forEach(card=>{card.hidden=!(card.dataset.buscar!.includes(q)&&(filtro.value!=='temporada'||card.dataset.temporada==='true')&&(filtro.value!=='mochila'||Number(card.dataset.semillas)>0)&&(clima.value==='todos'||card.dataset.climas!.split(' ').includes(clima.value)));if(!card.hidden)visibles++;});root.querySelector('[data-cultivo-conteo]')!.textContent=`${visibles} de ${CULTIVOS.length} cultivos`;};
 root.addEventListener('input',actualizar);root.addEventListener('change',actualizar);actualizar();
 let conectado=true;return ()=>{if(!conectado)return;conectado=false;memoria.set(root,{busqueda:buscar.value,filtro:filtro.value,clima:clima.value,scroll:root.scrollTop});root.removeEventListener('input',actualizar);root.removeEventListener('change',actualizar);};
}
