// Empaqueta scripts/balance-sangre.ts con esbuild y lo corre en Node (la simulación de Sangre y Ceniza no usa el DOM).
// Uso: node scripts/balance-sangre.mjs [partidas] [clases separadas por coma|todas] [bioma] [peligro] [jugadores]
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const salida = join(mkdtempSync(join(tmpdir(), 'sangre-')), 'balance.mjs');
await build({ entryPoints: ['scripts/balance-sangre.ts'], bundle: true, platform: 'node', format: 'esm', outfile: salida, logLevel: 'error' });
await import(pathToFileURL(salida).href);
