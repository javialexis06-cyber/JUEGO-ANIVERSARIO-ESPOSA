// Los recorridos comparan con el formato y los premios del juego, incluidos los cofres de las misiones.
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function cargarDatosRetrete() {
  const carpeta = await mkdtemp(join(tmpdir(), 'retrete-datos-'));
  try {
    const archivo = join(carpeta, 'datos.mjs');
    await build({ entryPoints: [resolve(import.meta.dirname, '../src/casa/cohete/datos.ts')], bundle: true,
      platform: 'node', format: 'esm', outfile: archivo, logLevel: 'silent' });
    return { datos: await import(pathToFileURL(archivo)), liberar: () => rm(carpeta, { recursive: true, force: true }) };
  } catch (e) { await rm(carpeta, { recursive: true, force: true }); throw e; }
}
