import { MISIONES_HISTORIA } from './historia-datos';
import { historiaDisponible } from './historia';
import { npcAstra, regionAstra } from './astra';
import type { CartaDef } from './correo';
import type { EstadoGranja } from './estado';

/** La campaña llega por el buzón (tanda 6 de los arreglos): cada misión principal que se abre trae una carta de quien
 * la cuenta, con a quiénes buscar y dónde. P01 la trae la guía del inicio (`carta_campana`). Se aceptan igual que
 * siempre, en el Diario, estando en su región. */
const nombre = (id: string) => npcAstra(id)?.nombre ?? id;
export const CARTAS_CAMPANA: readonly CartaDef[] = MISIONES_HISTORIA.filter((q) => q.clase === 'principal' && q.id !== 'P01').map((q) => {
  const quien = q.reparto[0], lugar = regionAstra(q.region)?.nombre ?? 'el valle', otros = q.reparto.slice(1).map(nombre);
  return {
    id: 'campana_' + q.id, campana: q.id, remitente: nombre(quien), titulo: q.titulo, diaMin: 0, monedas: 0, objetos: [],
    texto: `Familia de la granja: en ${lugar} los necesitamos para «${q.titulo}».${otros.length ? ` Busquen también a ${otros.length > 1 ? otros.slice(0, -1).join(', ') + ' y ' + otros.at(-1) : otros[0]}.` : ''} Cuando lleguen, encuentran todo en su Diario, en Campaña. Aquí los espero. — ${nombre(quien)}`,
  };
});
/** Misiones principales abiertas que todavía no se han aceptado. */
export const campanaPorAceptar = (s: EstadoGranja, id: string) => historiaDisponible(s, id) && !s.historia?.activas[id] && !s.historia?.completadas[id];
