import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

const file = new URL('../../src/granja-v3/cuidados.ts', import.meta.url);
const { code } = await transform(await readFile(file, 'utf8'), { loader: 'ts', format: 'esm', target: 'es2022' });
const { HORA, crearCuidado, reconciliarAnimal, estadoAnimal, alimentar, consentir, curar, crearCultivo, reconciliarCultivo, regarCultivo, avanzarCultivoDia, estadoCultivo } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
let checks = 0;
const test = (name, fn) => { fn(); checks++; console.log(`OK ${name}`); };
const start = 1_800_000_000_000;
const at = hours => start + hours * HORA;

test('Avisos exactamente a 24 horas y enfermedad/depresión a 48 horas', () => {
  const a = crearCuidado(start);
  assert.equal(estadoAnimal(a, at(24) - 1).estado, 'sano');
  assert.equal(estadoAnimal(a, at(24)).estado, 'necesita_atencion');
  assert.equal(estadoAnimal(a, at(48) - 1).enfermo, false);
  const s = reconciliarAnimal(a, at(48));
  assert.equal(s.illnessSince, at(48));
  assert.equal(s.depressionSince, at(48));
  assert.equal(estadoAnimal(s, at(48)).puedeProducir, false);
});
test('Alimentar y consentir preservan enfermedades pendientes de médico', () => {
  let a = reconciliarAnimal(crearCuidado(start), at(72));
  a = alimentar(a, at(72));
  a = consentir(a, 'musica', at(72));
  assert.equal(estadoAnimal(a, at(72)).hambriento, false);
  assert.equal(estadoAnimal(a, at(72)).triste, false);
  assert.equal(estadoAnimal(a, at(72)).enfermo, true);
  assert.equal(estadoAnimal(a, at(72)).deprimido, true);
  a = curar(a, at(80));
  assert.equal(estadoAnimal(a, at(80)).estado, 'sano');
  assert.equal(estadoAnimal(a, at(80)).puedeProducir, true);
  assert.equal(a.lastFedAt, at(80));
  assert.equal(a.lastLovedAt, at(80));
});
test('Los relojes de alimento y afecto son independientes', () => {
  const cared = consentir(crearCuidado(start), 'cuento', at(36));
  const s = estadoAnimal(cared, at(48));
  assert.equal(s.enfermo, true);
  assert.equal(s.deprimido, false);
  const fed = alimentar(crearCuidado(start), at(36));
  assert.equal(estadoAnimal(fed, at(48)).enfermo, false);
  assert.equal(estadoAnimal(fed, at(48)).deprimido, true);
});
test('Cuatro formas de cariño, datos serializables e inmutabilidad', () => {
  const a = crearCuidado(start);
  for (const method of ['acariciar', 'musica', 'cuento', 'cepillar']) {
    const b = consentir(a, method, at(1));
    assert.equal(b.lastComfortMethod, method);
    assert.equal(b.lastLovedAt, at(1));
    assert.deepEqual(JSON.parse(JSON.stringify(b)), b);
  }
  assert.equal(a.lastLovedAt, start);
  assert.throws(() => consentir(a, 'invalido', at(1)));
});
test('Tras meses ausente no mueren, mantienen fechas originales de enfermedad', () => {
  const a = reconciliarAnimal(crearCuidado(start), at(24 * 180));
  assert.equal(a.illnessSince, at(48));
  assert.equal(a.depressionSince, at(48));
  assert.equal(estadoAnimal(curar(a, at(24 * 180)), at(24 * 180)).estado, 'sano');
});
test('Plantar no riega: no crece seco y requiere primer riego antes de 48 horas', () => {
  const crop = crearCultivo(12 * HORA, start);
  assert.equal(reconciliarCultivo(crop, at(47)).grownMs, 0);
  assert.equal(estadoCultivo(crop, at(1)).necesitaAgua, true);
  assert.equal(reconciliarCultivo(crop, at(48)).status, 'arruinado');
  const wet = regarCultivo(crop, at(36));
  assert.equal(reconciliarCultivo(wet, at(47)).grownMs, 0);
  assert.equal(reconciliarCultivo(wet, at(48)).status, 'creciendo');
});
test('Un cultivo lento no madura ficticiamente durante una semana offline', () => {
  const crop = crearCultivo(120 * HORA, start, true);
  const s = reconciliarCultivo(crop, at(168));
  assert.equal(s.status, 'arruinado');
  assert.equal(s.grownMs, 0);
  assert.equal(s.ruinedAt, at(48));
  assert.equal(s.maturedAt, null);
});
test('Una planta se arruina en el límite exacto de 48h y no revive al regar', () => {
  const crop = crearCultivo(100 * HORA, start, true);
  assert.equal(reconciliarCultivo(crop, at(48) - 1).status, 'creciendo');
  assert.equal(regarCultivo(crop, at(48)).status, 'arruinado');
  const ruined = reconciliarCultivo(crop, at(80));
  const afterWater = regarCultivo(ruined, at(81));
  assert.equal(afterWater.status, 'arruinado');
  assert.equal(afterWater.lastWateredAt, start);
  assert.equal(afterWater.grownMs, 0);
});
test('El riego protege pero solo pasos explícitos de jornada dan crecimiento', () => {
  const paso = 1_800_000;
  let crop = crearCultivo(4 * paso, start);
  for (let dia = 0; dia < 4; dia++) {
    crop = regarCultivo(crop, at(dia * 24));
    const antes = crop.grownMs;
    crop = reconciliarCultivo(crop, at(dia * 24 + 1));
    assert.equal(crop.grownMs, antes);
    crop = avanzarCultivoDia(crop, paso, at(dia * 24 + 1));
  }
  assert.equal(crop.status, 'maduro');
  assert.equal(crop.maturedAt, at(73));
  assert.equal(crop.grownMs, 4 * paso);
});
test('Cultivo maduro permanente; llegar a 48 horas seco antes de dormir impide madurar', () => {
  const paso = 1_800_000;
  let crop = avanzarCultivoDia(crearCultivo(paso, start, true), paso, at(1));
  assert.equal(crop.status, 'maduro');
  const s = reconciliarCultivo(crop, at(24 * 365));
  assert.equal(s.status, 'maduro');
  assert.equal(s.maturedAt, at(1));
  assert.equal(estadoCultivo(s, at(24 * 730)).necesitaAgua, false);
  crop = avanzarCultivoDia(crearCultivo(paso, start, true), paso, at(48));
  assert.equal(crop.status, 'arruinado');
  assert.equal(crop.grownMs, 0);
});
test('Reconciliar varias veces es equivalente a una única visita offline', () => {
  for (const duration of [12, 48, 120]) {
    const original = crearCultivo(duration * HORA, start, true);
    let partitioned = original;
    for (const h of [3, 8, 24, 47, 48, 49, 200]) partitioned = reconciliarCultivo(partitioned, at(h));
    assert.deepEqual(partitioned, reconciliarCultivo(original, at(200)));
  }
});
test('Retroceder el reloj no retrocede progreso, cuidados ni fechas médicas', () => {
  let a = reconciliarAnimal(crearCuidado(start), at(60));
  const back = alimentar(a, at(3));
  assert.equal(back.lastFedAt, at(60));
  assert.equal(back.lastEvaluatedAt, at(60));
  assert.equal(back.illnessSince, at(48));
  assert.equal(curar(a, at(3)).lastLovedAt, at(60));
  const crop = reconciliarCultivo(crearCultivo(120 * HORA, start, true), at(24));
  assert.deepEqual(reconciliarCultivo(crop, at(2)), crop);
  assert.equal(regarCultivo(crop, at(2)).lastWateredAt, at(24));
});
test('Valores temporales inválidos se rechazan y un estado creado no muta', () => {
  assert.throws(() => crearCuidado(NaN));
  assert.throws(() => crearCultivo(0, start));
  assert.throws(() => crearCultivo(Infinity, start));
  assert.throws(() => reconciliarAnimal(crearCuidado(start), -1));
  const crop = crearCultivo(HORA, start, true);
  reconciliarCultivo(crop, at(2));
  assert.equal(crop.status, 'creciendo');
  assert.equal(crop.grownMs, 0);
});
console.log(JSON.stringify({ ok: true, suite: 'cuidados', checks, timeUnit: 'real milliseconds', cropDehydrationHours: 48, animalWarningHours: 24, animalIllnessHours: 48 }));
