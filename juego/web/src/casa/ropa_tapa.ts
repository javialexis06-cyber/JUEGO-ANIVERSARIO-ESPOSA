// Qué partes del muñeco de fábrica (el de Javier y el de Laura) tapa cada ranura de ropa: lo usan el clóset de la
// casa (`ropa.ts`) y el vestidor de los amigos (`src/salas/vestir.ts`). Sin nada de la casa adentro.
type Rol = 'el' | 'ella';
type Ranura = 'pelo' | 'cabeza' | 'cara' | 'arriba' | 'abajo' | 'pies' | 'espalda' | 'cola';

/** Partes de fábrica que tapa cada ranura (prefijos del nombre de la malla). */
export const TAPA: Record<Rol, Partial<Record<Ranura | 'medias' | 'copete', string[]>>> = {
  el: {
    copete: ['mechon copete', 'mechon flequillo'],
    arriba: ['torso camiseta', 'cuello camiseta', 'ribete', 'pespunte camiseta', 'suciedad ropa'],
    abajo: ['pantalon', 'pespunte pantalon'],
    pies: ['tenis', 'suela'],
    pelo: ['cabello base', 'mechon'],
  },
  ella: {
    arriba: ['torso camiseta', 'cuello camiseta', 'ribete manga', 'pespunte camiseta', 'chaleco', 'solapa', 'tapa bolsillo', 'pespunte chaleco',
      'suciedad ropa'],
    abajo: ['pantalon', 'dobladillo short', 'pespunte shorts'],
    pies: ['tenis', 'suela', 'cordon'],
    pelo: ['cabello base', 'mechon'],
    medias: ['media', 'puño media'],
  },
};

