import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const carpeta = new URL('./', import.meta.url);
const suites = readdirSync(carpeta).filter(n => /^probar-.*\.mjs$/.test(n) && n !== 'probar-todo.mjs').sort();
let fallos = 0;
for (const suite of suites) {
  console.log('\nSuite: ' + suite);
  const r = spawnSync(process.execPath, [fileURLToPath(new URL(suite, carpeta))], { stdio: 'inherit' });
  if (r.error || r.status !== 0) { fallos++; console.error('Falló ' + suite, r.error?.message ?? r.status); }
}
console.log(JSON.stringify({ suites: suites.length, fallos }));
if (!suites.length || fallos) process.exitCode = 1;
