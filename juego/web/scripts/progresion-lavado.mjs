// Empaqueta scripts/progresion-lavado.ts con esbuild y lo corre en Node (el motor del lavado no usa el DOM).
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const salida = join(mkdtempSync(join(tmpdir(), 'lavado-')), 'progresion.mjs');
await build({ entryPoints: ['scripts/progresion-lavado.ts'], bundle: true, platform: 'node', format: 'esm', outfile: salida, logLevel: 'error' });
await import(pathToFileURL(salida).href);
