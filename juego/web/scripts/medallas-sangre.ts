// Saca qué glifos usan las mejoras, los objetos, las reliquias, el equipo, los logros, los desafíos y los sigilos de
// Sangre y Ceniza, con su trazo SVG:
// personajes/blender/medallas.json (lo que dibuja sangre_medallas.py) y src/sangre/ui/medallas.ts (cuáles hay).
import { writeFileSync } from 'node:fs';
import { BENDICIONES, EQUIPOS, MEJORAS, OBJETOS, RELIQUIAS } from '../src/sangre/datos/botin';
import { CLASES } from '../src/sangre/datos/clases';
import { ANOMALIAS } from '../src/sangre/datos/desafios';
import { BIOMAS, MUTADORES } from '../src/sangre/datos/mundo';
import { SIGILOS } from '../src/sangre/datos/sigilos';
import { LOGROS } from '../src/sangre/logros';
import { G } from '../src/sangre/ui/iconos';

const usos: Record<string, string[]> = { mejora: [], objeto: [], reliquia: [], equipo: [], logro: [], desafio: [], sigilo: [] };
const add = (t: string, g: string | undefined) => {
  if (g && G[g] && !usos[t].includes(g)) usos[t].push(g);
};
for (const m of MEJORAS) add('mejora', m.glifo);
for (const c of Object.values(CLASES)) for (const d of c.dones) add('mejora', d.glifo);
for (const b of BENDICIONES) add('mejora', (b as { glifo?: string }).glifo);
for (const g of ['corazon', 'oro', 'pan']) add('mejora', g);
for (const o of OBJETOS) add('objeto', o.glifo);
for (const r of RELIQUIAS) add('reliquia', r.glifo);
for (const e of EQUIPOS) add('equipo', e.ranura);
// Los logros, los desafíos (anomalías, mutadores, contratos y pruebas) y los sigilos
for (const l of LOGROS) add('logro', l.glifo);
for (const a of ANOMALIAS) add('desafio', a.glifo);
for (const m of Object.values(MUTADORES)) add('desafio', m.glifo);
for (const g of ['sol', 'luna', 'espada', 'corona', 'castillo', 'dado']) add('desafio', g);
for (const c of Object.values(CLASES)) add('desafio', c.glifo);
for (const b of Object.values(BIOMAS)) add('desafio', b.glifo);
for (const s of Object.values(SIGILOS)) add('sigilo', s.glifo);
const glifos: Record<string, string> = {};
for (const lista of Object.values(usos)) for (const g of lista) glifos[g] = G[g];
writeFileSync('../../personajes/blender/medallas.json', JSON.stringify({ usos, glifos }, null, 1) + '\n');
const nombres = Object.entries(usos).flatMap(([t, l]) => l.map((g) => `med_${t}_${g}`)).sort();
writeFileSync('src/sangre/ui/medallas.ts', `// Las medallas que hay en public/sangre/iconos (las arma scripts/medallas-sangre.mjs; las dibuja
// personajes/blender/sangre_medallas.py). No editar a mano.
export const MEDALLAS = new Set<string>(${JSON.stringify(nombres).replace(/","/g, '", "')});
`);
console.log(Object.fromEntries(Object.entries(usos).map(([k, v]) => [k, v.length])), nombres.length, 'medallas');
