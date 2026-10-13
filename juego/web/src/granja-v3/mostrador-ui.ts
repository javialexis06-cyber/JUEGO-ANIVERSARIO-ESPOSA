import { ARTICULOS, CULTIVOS, type Estacion } from './catalogo';
import { FRUTALES } from './frutales-datos';
import type { EstadoGranja } from './estado';
import { iconoInventario } from './inventario-ui';
import { obtenerObjeto } from './objetos';
import './mostrador-ui.css';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** El inventario del mostrador: un clic por unidad, mismas acciones y precios del motor. */
export function renderMostradorSemillas(s: EstadoGranja, estacion: Estacion) {
  const producto = (id: string, nombre: string, precio: number, accion: string) => `<button class="mostrador-producto" data-do="${accion}" data-id="${id}" ${s.monedas >= precio ? '' : 'disabled'} title="${esc(nombre)} · ${s.inventario[id] ?? 0} en la mochila" aria-label="Comprar ${esc(nombre)} por ${precio} monedas">${iconoInventario(id)}<strong>${esc(nombre)}</strong><span>${precio} ◈</span><small>× ${s.inventario[id] ?? 0}</small></button>`;
  const semillas = CULTIVOS.filter(c => !c.region && c.precio > 0 && c.estaciones.includes(estacion) && (!c.requiere || s.desbloqueos.includes(c.requiere))).map(c => producto(c.semilla, c.nombre, c.precio, 'comprar-art'));
  const provisiones = ['heno', 'semilla_pasto', 'lombriz', 'pez_cebo', 'cebo_magico'].map(id => { const a = ARTICULOS.find(a => a.id === id)!; return producto(id, a.nombre, a.precio!, 'comprar-art'); });
  const taller = ['carbon', 'harina', 'sal', 'azucar', 'aceite', 'resina', 'arena', 'cuero', 'pan'].map(id => { const a = obtenerObjeto(id)!; return producto(id, a.nombre, a.precioCompra!, 'comprar-provision'); });
  return `<section class="mostrador-estante" aria-label="Productos del mostrador"><div class="section-label">Semillas de temporada</div><div class="mostrador-productos">${semillas.join('')}</div><div class="section-label">Provisiones</div><div class="mostrador-productos">${provisiones.join('')}${taller.join('')}</div><div class="section-label">Plantones</div><div class="mostrador-productos">${FRUTALES.map(f => producto(f.planton, f.nombre, f.precio, 'comprar-provision')).join('')}</div>${s.casillasInventario.length < 36 ? '<button class="btn" data-do="ampliar-mochila" ' + (s.monedas >= 250 ? '' : 'disabled') + '>🎒 36 casillas · 250 ◈</button>' : ''}<button class="btn" data-do="vender-mochila">Vender desde la mochila</button><button class="btn" data-do="hablar-vecino" data-id="mercader">Conversar con Inés</button></section>`;
}
