// Escrituras fallidas, confirmación perdida y pagos de la casa con los precios y topes originales.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const carpeta = await mkdtemp(join(tmpdir(), 'retrete-guardado-'));
try {
  const archivo = join(carpeta, 'motor.mjs');
  await build({ stdin: { contents: `export * from './src/casa/cohete/guardado'; export * from './src/casa/cohete/datos';
    export {casaNueva,normalizarCasa} from './src/casa/modelo';`, resolveDir: resolve(import.meta.dirname, '..') },
    bundle: true, platform: 'node', format: 'esm', outfile: archivo, logLevel: 'silent' });
  const { GuardadoCohete, PremiosCohete, aplicarGuardadoCohete, progresoNuevo, comprar, revisarMisiones, cuentasNuevas,
    precioMejora, monedasVuelo, TOPE_MONEDAS_DIA, casaNueva, normalizarCasa } = await import(pathToFileURL(archivo));
  const probar = async (nombre, fn) => { await fn(); console.log(`✓ ${nombre}`); };
  const vuelo = (numero = 1, segundos = 60, dia = '2026-10-14') => ({ numero, segundos, dia });

  await probar('Un perfil nuevo no inventa un guardado ni monedas', async () => {
    let n = 0;
    const g = new GuardadoCohete(progresoNuevo(), () => { n++; });
    assert.equal(await g.confirmar(), true); assert.equal(n, 0); assert.equal(g.premio, null);
  });
  await probar('Un false y una excepción conservan el vuelo; confirmar no vuelve a registrarlo', async () => {
    const p = progresoNuevo(); p.vuelos = 1; p.rollitos = 80;
    let n = 0, disco;
    const g = new GuardadoCohete(p, (v) => { n++; if (n === 1) return false; if (n === 2) throw Error('Corte'); disco = v; });
    g.registrar(vuelo());
    assert.equal(await g.confirmar(), false); assert.equal(g.pendiente, true);
    assert.equal(await g.confirmar(), false); assert.equal(g.pendiente, true);
    assert.equal(await g.confirmar(), true); assert.equal(g.pendiente, false);
    assert.deepEqual(disco, p); assert.equal(p.vuelos, 1);
    await g.confirmar(); assert.equal(n, 3);
  });
  await probar('Dos toques comparten una escritura en curso', async () => {
    let resolver, n = 0;
    const g = new GuardadoCohete(progresoNuevo(), async () => { n++; await new Promise(r => { resolver = r; }); });
    g.registrar(); const a = g.confirmar(), b = g.confirmar();
    assert.equal(n, 1); assert.equal(a, b); resolver();
    assert.deepEqual(await Promise.all([a, b]), [true, true]);
  });
  await probar('El adaptador no puede alterar la copia que se reintentará ni su fecha', async () => {
    const p = progresoNuevo(); p.rollitos = 200; p.vuelos = 1;
    let n = 0;
    const g = new GuardadoCohete(p, (v, r) => {
      assert.equal(v.rollitos, 200); assert.equal(r.dia, '2026-10-14');
      v.rollitos = 0; r.dia = '2099-01-01'; return ++n > 1;
    });
    const r = vuelo(); g.registrar(r); r.dia = '2026-10-15';
    assert.equal(await g.confirmar(), false);
    assert.throws(() => g.registrar(), /pendiente/);
    assert.equal(await g.confirmar(), true); assert.equal(p.rollitos, 200);
  });
  await probar('Reintentar una compra conserva su coste, mejora y misión sin cobrarlos otra vez', async () => {
    const p = progresoNuevo(); p.rollitos = 500;
    p.misiones = [{ tipo: 'compras_total', meta: 1, avance: 0, hecha: false }, ...p.misiones.slice(1)];
    const precio = precioMejora(p, 'escudo');
    assert.equal(comprar(p, { mejora: 'escudo' }), true);
    const premios = revisarMisiones(p, cuentasNuevas(), p.misiones.map(m => m.avance), true);
    const esperado = structuredClone(p); let cortar = true, disco;
    const g = new GuardadoCohete(p, v => { if (cortar) return false; disco = v; });
    g.registrar(); assert.equal(await g.confirmar(), false); cortar = false;
    assert.equal(await g.confirmar(), true); await g.confirmar();
    assert.deepEqual(p, esperado); assert.deepEqual(disco, esperado);
    assert.equal(p.mejoras.escudo, 1); assert.equal(p.rollitos, 500 - precio + premios.cumplidas[0].premio);
  });
  await probar('Un fallo antes de escribir no guarda el vuelo ni paga sus monedas', async () => {
    let casa = casaNueva(), cortar = true; const antes = structuredClone(casa);
    const p = progresoNuevo(); p.vuelos = 1; p.rollitos = 90;
    const g = new GuardadoCohete(p, (v, r) => {
      const copia = structuredClone(casa), premio = aplicarGuardadoCohete(copia, 'el', v, r);
      if (cortar) throw Error('Sin espacio'); casa = copia; return premio;
    });
    g.registrar(vuelo()); assert.equal(await g.confirmar(), false); assert.deepEqual(casa, antes);
    cortar = false; assert.equal(await g.confirmar(), true);
    assert.deepEqual(casa.cohete.el, p); assert.equal(casa.monedas, antes.monedas + monedasVuelo(60));
  });
  await probar('Escribir y perder la respuesta permite recuperar el mismo premio una sola vez', async () => {
    let casa = casaNueva(), n = 0; const antes = casa.monedas;
    const p = progresoNuevo(); p.vuelos = 1;
    const g = new GuardadoCohete(p, (v, r) => {
      const premio = aplicarGuardadoCohete(casa, 'el', v, r);
      casa = normalizarCasa(JSON.parse(JSON.stringify(casa)));
      if (++n === 1) throw Error('Respuesta perdida'); return premio;
    });
    g.registrar(vuelo()); assert.equal(await g.confirmar(), false);
    assert.equal(casa.monedas, antes + 3);
    assert.equal(await g.confirmar(), true); assert.deepEqual(g.premio, { monedas: 3, tope: false });
    assert.equal(casa.monedas, antes + 3); assert.equal(casa.cohete.el.vuelos, 1);
  });
  await probar('El tope original sigue siendo por persona y día; un nuevo día conserva los vuelos', () => {
    const c = casaNueva(), antes = c.monedas, p = progresoNuevo();
    for (let n = 1; n <= 3; n++) {
      p.vuelos = n; const r = aplicarGuardadoCohete(c, 'el', p, vuelo(n));
      assert.equal(r.monedas, n <= 2 ? 3 : 0); assert.equal(r.tope, n >= 2);
      assert.deepEqual(aplicarGuardadoCohete(c, 'el', p, vuelo(n)), r);
    }
    assert.equal(c.monedas, antes + TOPE_MONEDAS_DIA);
    const ella = progresoNuevo(); ella.vuelos = 1;
    assert.equal(aplicarGuardadoCohete(c, 'ella', ella, vuelo()).monedas, 3);
    p.vuelos++; assert.equal(aplicarGuardadoCohete(c, 'el', p, vuelo(p.vuelos, 60, '2026-10-15')).monedas, 3);
    assert.equal(c.cohete.el.vuelos, 4); assert.equal(c.cohete.ella.vuelos, 1);
  });
  await probar('Vuelos antiguos y recibos limpiados no cobran ni borran progreso más reciente', () => {
    const c = casaNueva(), p = progresoNuevo(); p.vuelos = 4; p.rollitos = 800;
    c.cohete = { el: structuredClone(p) }; const antes = c.monedas;
    assert.equal(aplicarGuardadoCohete(c, 'el', p, vuelo(4)).monedas, 0);
    const viejo = progresoNuevo(); viejo.vuelos = 2;
    assert.equal(aplicarGuardadoCohete(c, 'el', viejo, vuelo(2)).monedas, 0);
    assert.deepEqual(c.cohete.el, p); assert.equal(c.monedas, antes);
  });
  await probar('Guardar compras o cosméticos conserva el contador diario y los premios previos', () => {
    const c = casaNueva(), p = progresoNuevo(); p.vuelos = 1; p.rollitos = 600;
    aplicarGuardadoCohete(c, 'el', p, vuelo()); const antes = c.monedas, diario = structuredClone(c.diario);
    comprar(p, { patico: true }); aplicarGuardadoCohete(c, 'el', p);
    assert.deepEqual(c.diario, diario); assert.equal(c.monedas, antes); assert.deepEqual(c.cohete.el, p);
  });
  await probar('Un reintento al día siguiente conserva el tope aunque se haya limpiado el diario', () => {
    const c = casaNueva(), p = progresoNuevo(), premios = new PremiosCohete();
    p.vuelos = 2; c.cohete = { el: structuredClone(p) }; c.diario['2026-10-14|el|retrete'] = TOPE_MONEDAS_DIA;
    const antes = c.monedas; p.vuelos = 3;
    assert.equal(premios.aplicar(structuredClone(c), 'el', p, vuelo(3)).monedas, 0);
    c.diario = {}; // Limpieza del bono del nuevo día, mientras el vuelo anterior seguía sin escribir.
    assert.deepEqual(premios.aplicar(c, 'el', p, vuelo(3)), { monedas: 0, tope: true });
    assert.equal(c.monedas, antes); p.vuelos = 4;
    assert.equal(premios.aplicar(c, 'el', p, vuelo(4, 60, '2026-10-15')).monedas, 3);
  });
  await probar('Los intentos sin escribir no consumen el cupo; vuelos cortos conservan su premio original', () => {
    const c = casaNueva(), p = progresoNuevo(), premios = new PremiosCohete(); p.vuelos = 1;
    for (let n = 0; n < 4; n++) assert.equal(premios.aplicar(structuredClone(c), 'el', p, vuelo()).monedas, 3);
    assert.deepEqual(premios.aplicar(c, 'el', p, vuelo()), { monedas: 3, tope: false });
    p.vuelos++; premios.aplicar(c, 'el', p, vuelo(2)); p.vuelos++;
    assert.deepEqual(premios.aplicar(c, 'el', p, vuelo(3, 14)), { monedas: 0, tope: false });
  });
  console.log('✓ Doce regresiones del guardado del Retrete');
} finally { await rm(carpeta, { recursive: true, force: true }); }
