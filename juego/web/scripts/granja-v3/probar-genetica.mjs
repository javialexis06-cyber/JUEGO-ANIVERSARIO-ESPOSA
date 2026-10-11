import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

const file = new URL('../../src/granja-v3/genetica.ts', import.meta.url);
const { code } = await transform(await readFile(file, 'utf8'), { loader: 'ts', format: 'esm', target: 'es2022' });
const { crearGenoma, cuadroPunnett, cruzar, probabilidades, fenotipo, validarGenoma } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
let checks = 0;
const test = (name, fn) => { fn(); checks++; console.log(`OK ${name}`); };
const fraction = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);
const simplify = list => Object.fromEntries(list.map(r => [r.genotipo, r.probabilidad]));

test('AA × aa produce 100 % Aa', () => {
  const q = cuadroPunnett('AA', 'aa');
  assert.deepEqual(simplify(q.resultados), { Aa: 1 });
  assert.equal(q.cuadro.length, 2);
  assert.deepEqual(q.cuadro.flat(), [['A', 'a'], ['A', 'a'], ['A', 'a'], ['A', 'a']]);
});
test('Aa × Aa produce 1:2:1 genotípico', () => {
  assert.deepEqual(simplify(cuadroPunnett('Aa', 'Aa').resultados), { AA: .25, Aa: .5, aa: .25 });
});
test('AaBb × AaBb produce 9:3:3:1 fenotípico con dominancia completa', () => {
  const results = probabilidades(crearGenoma('Aa', 'Bb', 'FF', 'EE'), crearGenoma('Aa', 'Bb', 'FF', 'EE'));
  const ratios = [0, 0, 0, 0];
  for (const result of results) ratios[fenotipo('vaca', result.genoma).variante] += result.probabilidad;
  assert.deepEqual(ratios, [9 / 16, 3 / 16, 3 / 16, 1 / 16]);
  fraction(results.reduce((sum, row) => sum + row.probabilidad, 0), 1);
  assert.equal(results.length, 9);
});
test('Cuatro loci heterocigotos generan 81 genotipos conjuntos sin duplicados', () => {
  const results = probabilidades(crearGenoma('Aa', 'Bb', 'Ff', 'Ee'), crearGenoma('Aa', 'Bb', 'Ff', 'Ee'));
  assert.equal(results.length, 81);
  assert.equal(new Set(results.map(r => JSON.stringify(r.genoma))).size, 81);
  fraction(results.reduce((sum, row) => sum + row.probabilidad, 0), 1);
});
test('Fantasía recesiva ff y tipo dominante E_ / recesivo ee', () => {
  const a = crearGenoma('Aa', 'Bb', 'Ff', 'Ee');
  const totals = { natural: 0, vaca_volcan: 0, vaca_nube: 0 };
  for (const result of probabilidades(a, a)) {
    const id = fenotipo('vaca', result.genoma).fantasia ?? 'natural';
    totals[id] += result.probabilidad;
  }
  assert.deepEqual(totals, { natural: .75, vaca_volcan: 3 / 16, vaca_nube: 1 / 16 });
  const map = { vaca: ['vaca_volcan', 'vaca_nube'], cerdito: ['cerdito_musgo', 'cerdito_ambar'], gallina: ['gallina_oscura', 'gallina_aurora'], conejo: ['conejo_lunar', 'conejo_escarcha'], oveja: ['oveja_cristal', 'oveja_tormenta'] };
  for (const [species, ids] of Object.entries(map)) {
    assert.equal(fenotipo(species, crearGenoma('AA', 'BB', 'ff', 'Ee')).fantasia, ids[0]);
    assert.equal(fenotipo(species, crearGenoma('aa', 'bb', 'ff', 'ee')).fantasia, ids[1]);
    assert.equal(fenotipo(species, crearGenoma('AA', 'BB', 'Ff', 'EE')).fantasia, null);
  }
});
test('Las especies míticas conservan identidad propia', () => {
  for (const s of ['unicornio', 'dragon', 'grifo']) assert.equal(fenotipo(s, crearGenoma()).fantasia, s);
});
test('Cada hijo recibe exactamente un alelo de cada progenitor en cada locus', () => {
  let seed = 48723;
  const rng = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const a = crearGenoma('Aa', 'BB', 'ff', 'Ee');
  const b = crearGenoma('aa', 'Bb', 'Ff', 'ee');
  const originalA = JSON.stringify(a), originalB = JSON.stringify(b);
  for (let i = 0; i < 2000; i++) {
    const child = cruzar(a, b, rng);
    for (const locus of ['A', 'B', 'F', 'E']) {
      const allowed = new Set(a[locus].flatMap(ma => b[locus].map(pa => [ma, pa].sort().join(''))));
      assert.ok(allowed.has(child[locus].join('')));
      assert.notEqual(child[locus], a[locus]);
      assert.notEqual(child[locus], b[locus]);
    }
  }
  assert.equal(JSON.stringify(a), originalA);
  assert.equal(JSON.stringify(b), originalB);
});
test('La cría usa probabilidad por nacimiento, nunca cuotas forzadas por camada', () => {
  const a = crearGenoma('Aa', 'Bb', 'Ff', 'Ee');
  const children = Array.from({ length: 4 }, () => cruzar(a, a, () => 0));
  for (const child of children) assert.deepEqual(child, crearGenoma('AA', 'BB', 'FF', 'EE'));
});
test('Rechaza alelos incompatibles, especies ausentes y números aleatorios inválidos', () => {
  assert.throws(() => crearGenoma('AB'));
  assert.throws(() => crearGenoma('AAA'));
  assert.throws(() => crearGenoma('aa', 'AA'));
  assert.throws(() => cuadroPunnett('Aa', 'Bb'));
  assert.throws(() => validarGenoma({}));
  assert.throws(() => fenotipo('pez', crearGenoma()));
  for (const random of [NaN, -0.1, 1, Infinity]) assert.throws(() => cruzar(crearGenoma(), crearGenoma(), () => random));
  assert.deepEqual(crearGenoma('aA', 'bB', 'fF', 'eE'), crearGenoma('Aa', 'Bb', 'Ff', 'Ee'));
});
console.log(JSON.stringify({ ok: true, suite: 'genetica', checks, inheritanceSamples: 2000, model: 'Mendeliano de juego, loci independientes; no simulación de razas reales' }));
