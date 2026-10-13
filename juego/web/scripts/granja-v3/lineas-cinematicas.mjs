// Saca las líneas de las 14 cinemáticas (C01-C14) del catálogo de producción de Astra y las deja como datos de las
// películas en src/granja-v3/cine-lineas-campana.ts (texto del subtítulo, quién habla y su nombre). Sus voces ya
// existen (voces-astra.mjs); voces-cine.mjs las declara en granja/cine/medios.json con su duración.
//   node scripts/granja-v3/lineas-cinematicas.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(import.meta.dirname, '..', '..');
const p = JSON.parse(readFileSync(join(RAIZ, 'public', 'granja', 'astra', 'produccion.json'), 'utf8'));
const nombres = { narrador: 'Narrador', canalizadora_aura: 'Eliana', canalizadora_lara: 'Serena', fuatia: 'Fuatia', aura: 'Aura', lara: 'Lara', celia: 'Celia', conde: 'El Conde Sangrevil', nathgora: 'Nath’Gora', vaelthor: 'Vael’Thor' };
for (const n of p.npc) nombres[n.id] ??= n.nombre;
const escenas = {};
for (const l of p.lineas) {
  if (!/^C\d\d$/.test(l.escena) || /^\(En señas\)/.test(l.texto)) continue;
  (escenas[l.escena] ??= []).push([l.id, l.hablante, l.texto.replace(/^\([^)]*\)\s*/, '')]);
}
const cuerpo = Object.entries(escenas).sort().map(([c, ls]) => `  ${c}: [\n${ls.map(([id, q, t]) => `    L(${JSON.stringify(id)}, ${JSON.stringify(q)}, ${JSON.stringify(t)}),`).join('\n')}\n  ],`).join('\n');
writeFileSync(join(RAIZ, 'src', 'granja-v3', 'cine-lineas-campana.ts'), `// Generado por scripts/granja-v3/lineas-cinematicas.mjs desde granja/astra/produccion.json: no se edita a mano.
// Las líneas de las 14 cinemáticas de la campaña (sus voces ya existen; ver voces-cine.mjs).
import type { LineaCine } from './cine-granja';
import { NOMBRE_PAREJA } from '../nombres';

const NOMBRES: Record<string, string> = ${JSON.stringify(nombres)};
const L = (id: string, quien: string, texto: string): LineaCine => ({ id, quien, nombre: quien === 'el' || quien === 'ella' ? NOMBRE_PAREJA[quien] : NOMBRES[quien] ?? quien, texto, desde: 0.4 });

export const LINEAS_CAMPANA: Record<string, LineaCine[]> = {
${cuerpo}
};
`);
console.log(Object.entries(escenas).map(([c, l]) => `${c}:${l.length}`).join(' '));
