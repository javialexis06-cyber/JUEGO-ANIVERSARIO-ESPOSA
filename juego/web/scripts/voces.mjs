// Arma public/voces/lista.json con los audios que haya en public/voces (r005-01.m4a, final-ella-2.mp3…).
// Uso: node scripts/voces.mjs   (se corre cada vez que se agregan o cambian grabaciones)
import { readdirSync, writeFileSync } from 'node:fs';
import { extname, basename, join } from 'node:path';

const dir = join(import.meta.dirname, '..', 'public', 'voces');
const lista = {};
for (const f of readdirSync(dir).sort()) {
  if (!['.mp3', '.m4a', '.aac', '.ogg', '.opus', '.wav', '.webm'].includes(extname(f).toLowerCase())) continue;
  lista[basename(f, extname(f)).toLowerCase()] = f;
}
writeFileSync(join(dir, 'lista.json'), JSON.stringify(lista, null, 1) + '\n');
console.log(`${Object.keys(lista).length} voces en la lista`);
