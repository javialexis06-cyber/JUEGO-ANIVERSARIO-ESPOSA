// Mejoras de la tienda de Dave (las 8 de PvZ 1 y la Imitadora). No es un área: se siembran en cualquiera.
// Comportamiento propio de sus plantas y zombis. Vacío por ahora: comportamiento/index.ts ya lo importa, así que
// basta con agregar entradas a estos registros (ver comun.ts y dia.ts como ejemplo).
import type { RegistroComportamientos } from '../tipos';

export const TIENDA: RegistroComportamientos = { plantas: {}, zombis: {} };
