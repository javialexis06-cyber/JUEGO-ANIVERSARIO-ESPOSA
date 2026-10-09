// Empaqueta scripts/medallas-sangre.ts con esbuild y lo corre (escribe la lista de medallas de Sangre y Ceniza).
// Después: blender -b -P personajes/blender/sangre_medallas.py -- personajes/blender/medallas.json juego/web/public/sangre/iconos
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const salida = join(mkdtempSync(join(tmpdir(), 'sangre-')), 'medallas.mjs');
await build({ entryPoints: ['scripts/medallas-sangre.ts'], bundle: true, platform: 'node', format: 'esm', outfile: salida, logLevel: 'error' });
await import(pathToFileURL(salida).href);
