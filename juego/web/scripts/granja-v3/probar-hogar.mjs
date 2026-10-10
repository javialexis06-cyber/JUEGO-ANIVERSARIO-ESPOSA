import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

const file = new URL('../../src/granja-v3/hogar.ts', import.meta.url);
const { code } = await transform(await readFile(file, 'utf8'), { loader: 'ts', format: 'esm', target: 'es2022' });
const hogar = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const almacen = new Map();
let destino = null;
globalThis.location = { href: 'http://localhost:4181/subcarpeta/granja-v3.html?calidad=alta', assign(url) { destino = url; } };
globalThis.sessionStorage = { getItem: k => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, v), removeItem: k => almacen.delete(k) };
let checks = 0;
async function test(nombre, fn) { almacen.clear(); destino = null; await fn(); checks++; console.log(`OK ${nombre}`); }

await test('La puerta espera guardado y apunta a la casa real dentro de la subcarpeta', async () => {
  let liberar;
  const barrera = new Promise(resolve => { liberar = resolve; });
  const paso = hogar.abrirHogar({ x: 2, z: 3, personaje: 'ella', guardar: () => barrera });
  assert.equal(destino, null);
  liberar(); await paso;
  assert.equal(destino, 'http://localhost:4181/subcarpeta/index.html?desdeGranja=1');
  assert.equal(hogar.leerRetornoHogar().personaje, 'ella');
  assert.equal(hogar.leerRetornoHogar().ruta, '/subcarpeta/granja-v3.html?calidad=alta');
});

await test('Un fallo de guardado conserva al jugador en la granja', async () => {
  await assert.rejects(hogar.abrirHogar({ x: 0, z: 0, personaje: 'el', guardar: () => { throw Error('almacenamiento lleno'); } }));
  assert.equal(destino, null); assert.equal(almacen.size, 0);
});

await test('El retorno conserva parámetros y se consume una sola vez al volver', async () => {
  hogar.guardarRetornoHogar(-2.5, 7, 'el');
  assert.equal(hogar.volverALaGranja(), true);
  assert.equal(destino, 'http://localhost:4181/subcarpeta/granja-v3.html?calidad=alta&desdeHogar=1');
  assert.equal(hogar.leerRetornoHogar(true).x, -2.5);
  assert.equal(hogar.leerRetornoHogar(), null);
  assert.equal(hogar.volverALaGranja(), false);
});

await test('No admite navegación a otro origen, esquemas ejecutables ni coordenadas inválidas', async () => {
  for (const url of ['https://example.com/', '//example.com/', 'javascript:alert(1)', 'http://user:pass@localhost:4181/']) {
    await assert.rejects(hogar.abrirHogar({ x: 0, z: 0, personaje: 'el', guardar() {}, url }));
  }
  for (const n of [NaN, Infinity, 1e20]) assert.throws(() => hogar.guardarRetornoHogar(n, 0, 'el'));
  assert.equal(destino, null);
});

await test('Rechaza retornos caducados, alterados o externos', () => {
  const r = hogar.guardarRetornoHogar(0, 0, 'ella');
  for (const cambio of [{ fecha: Date.now() - 8 * 86400e3 }, { fecha: Date.now() + 86400e3 }, { x: '0' }, { ruta: 'https://example.com' }, { personaje: 'otro' }]) {
    almacen.set(hogar.CLAVE_RETORNO_HOGAR, JSON.stringify({ ...r, ...cambio }));
    assert.equal(hogar.leerRetornoHogar(), null);
  }
  almacen.set(hogar.CLAVE_RETORNO_HOGAR, '{');
  assert.equal(hogar.leerRetornoHogar(), null);
});

await test('Funciona en Capacitor y distingue hosts incluso con origen nulo', async () => {
  globalThis.location.href = 'capacitor://localhost/granja-v3.html';
  await hogar.abrirHogar({ x: 0, z: 2, personaje: 'ella', guardar() {} });
  assert.equal(destino, 'capacitor://localhost/index.html?desdeGranja=1');
  await assert.rejects(hogar.abrirHogar({ x: 0, z: 2, personaje: 'ella', guardar() {}, url: 'capacitor://otro/index.html' }));
});
console.log(JSON.stringify({ suite: 'puerta-hogar', checks, ok: true }));
