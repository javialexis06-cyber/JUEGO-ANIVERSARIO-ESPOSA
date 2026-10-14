// Auditoría de combate con los motores originales. No escribe partidas ni modifica el balance del juego.
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const web = resolve(import.meta.dirname, '..');
const revision = process.env.REVISION_MOTOR ? execFileSync('git', ['rev-parse', '--verify', `${process.env.REVISION_MOTOR}^{commit}`], { cwd: web, encoding: 'utf8' }).trim() : null;
// Comparar una revisión publicada con las mismas entradas, sin alterar el árbol de trabajo.
const plugins = revision ? [{ name: 'motor-publicado', setup(b) {
  b.onLoad({ filter: /\/src\/.*\.ts$/ }, ({ path }) => ({ contents: execFileSync('git', ['show', `${revision}:juego/web/${path.slice(web.length + 1)}`], { cwd: web, encoding: 'utf8' }), loader: 'ts' }));
} }] : [];
const carpeta = await mkdtemp(join(tmpdir(), 'auditoria-combate-'));
try {
  const archivo = join(carpeta, 'auditoria.mjs');
  await build({ entryPoints: [resolve(import.meta.dirname, 'auditar-combate.ts')], bundle: true,
    platform: 'node', format: 'esm', outfile: archivo, logLevel: 'silent', plugins });
  await import(pathToFileURL(archivo));
} finally { await rm(carpeta, { recursive: true, force: true }); }
