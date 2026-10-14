// Fallos reales de escritura, reintentos y premios del restaurante; no altera precios ni las recetas.
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const carpeta = await mkdtemp(join(tmpdir(), 'cocina-guardado-'));
const web = resolve(import.meta.dirname, '..');
try {
  const archivo = join(carpeta, 'motor.mjs');
  await build({
    stdin: { contents: `export * from './src/casa/cocina/guardado'; export * from './src/casa/cocina/tipos';
      export {casaNueva,normalizarCasa} from './src/casa/modelo';`, resolveDir: web },
    bundle: true, platform: 'node', format: 'esm', outfile: archivo, logLevel: 'silent',
  });
  const { GuardadoCocina, aplicarGuardadoCocina, progresoNuevo, casaNueva, normalizarCasa, RESTAURANTES } = await import(pathToFileURL(archivo));
  const visual = ['cuadros', 'nota', 'rumor', 'COLOR_PUESTO', 'NOMBRE_ROL', 'imagenChefAmigo', 'chefAmigoListo', 'prepararChefAmigo',
    'boton', 'dentro', 'rr', 'texto', 'Efectos', 'FRASES', 'frasePareja', 'invitadoPareja', 'invitadoPorId', 'INVITADOS', 'invitadosDelDia', 'POSES', 'Sincro', 'cargarRecortes', 'soltarFondos'];
  const interfaz = join(carpeta, 'interfaz.mjs');
  await build({
    stdin: { contents: `export {Motor} from './src/casa/cocina/motor'; export {GuardadoCocina} from './src/casa/cocina/guardado';`, resolveDir: web },
    bundle: true, platform: 'node', format: 'esm', outfile: interfaz, logLevel: 'silent',
    plugins: [{ name: 'sin-dibujo-ni-red', setup(b) {
      b.onResolve({ filter: /.*/ }, (a) => a.importer.endsWith('/cocina/motor.ts') && !['./tipos', './guardado'].includes(a.path) ? { path: a.path, namespace: 'vista' } : null);
      b.onLoad({ filter: /.*/, namespace: 'vista' }, () => ({ contents: `${visual.map((n) => `export const ${n}=()=>{};`).join('\n')} export const musica={};`, loader: 'js' }));
    } }],
  });
  const { Motor, GuardadoCocina: GuardadoMotor } = await import(pathToFileURL(interfaz));
  const resultado = (dia = 1) => ({ receta: 'wafles', dia, servidos: 3, promedio: 90, propinas: 7, perfectos: 1, xp: 100, monedas: 6, platos: 2 });
  const pruebas = [];
  const probar = async (nombre, fn) => { await fn(); pruebas.push(nombre); console.log(`✓ ${nombre}`); };
  const motor = (guardar) => {
    const progreso = progresoNuevo();
    return Object.assign(Object.create(Motor.prototype), {
      s: { n: 1, dia: 1, fase: 'fin', resultado: resultado() }, progreso, guardado: new GuardadoMotor(progreso, guardar),
      guardadoN: -1, escenasFin: new Map(), anfitrion: true, terminado: false, sync: null, receta: { id: 'wafles' },
      o: { rol: 'el', premioCasa: true, guardar }, yo: { id: 'el', rol: 'el', tipo: 'el', puesto: 0 }, jugadores: [],
      raiz: {}, pintarCapa() {}, aviso() {},
    });
  };

  await probar('El botón del siguiente día espera, permite reintentar y soporta un doble toque', async () => {
    let rechazar, llamadas = 0, nuevos = 0, escenas = 0;
    const m = motor(async () => { if (++llamadas === 1) await new Promise((_, r) => { rechazar = r; }); });
    m.o.alTerminarDia = async () => { escenas++; };
    m.nuevoDia = () => { nuevos++; m.s = { n: 2, fase: 'espera', resultado: null }; };
    const intento = m.siguienteDia();
    await new Promise((r) => setImmediate(r));
    assert.equal(nuevos, 0);
    assert.equal(m.guardadoN, -1);
    rechazar(Error('Corte'));
    await intento;
    assert.equal(nuevos, 0);
    await Promise.all([m.siguienteDia(), m.siguienteDia()]);
    assert.equal(nuevos, 1);
    assert.equal(llamadas, 2);
    assert.equal(escenas, 1);
    assert.equal(m.progreso.xp, 100);
  });

  await probar('La salida mantiene abierta la cocina cuando el día no pudo guardarse', async () => {
    const m = motor(async () => { throw Error('Sin espacio'); });
    let salidas = 0;
    m.alSalir = () => { salidas++; };
    await m.salir();
    assert.equal(salidas, 0);
    assert.equal(m.terminado, false);
    assert.equal(m.guardado.pendiente, true);
  });

  await probar('Un corte conserva el día pendiente y reintentar no repite puntos ni propinas', async () => {
    let llamadas = 0, guardado;
    const p = progresoNuevo();
    const g = new GuardadoCocina(p, async (v) => { if (++llamadas === 1) throw Error('Corte'); guardado = v; });
    g.registrar(1, resultado(), true, true);
    assert.equal(await g.guardarPendientes(), false);
    assert.equal(g.pendiente, true);
    assert.equal(g.registrar(1, resultado(), true, true).nuevo, false);
    assert.equal(await g.esperar(), true);
    assert.equal(llamadas, 2);
    assert.deepEqual(guardado, { ...progresoNuevo(), dia: 2, xp: 100, propinas: 7, servidos: 3, perfectos: 1, mejor: 90 });
    assert.deepEqual(p, guardado);
    assert.equal(g.pendiente, false);
  });

  await probar('Dos intentos simultáneos comparten la escritura en curso', async () => {
    let terminar, llamadas = 0;
    const g = new GuardadoCocina(progresoNuevo(), async () => { llamadas++; await new Promise((r) => { terminar = r; }); });
    g.registrar(1, resultado(), true, true);
    const a = g.guardarPendientes(), b = g.guardarPendientes();
    await new Promise((r) => setImmediate(r));
    assert.equal(llamadas, 1);
    terminar();
    assert.deepEqual(await Promise.all([a, b]), [true, true]);
    assert.equal(llamadas, 1);
  });

  await probar('El invitado conserva dos días recibidos mientras su primer guardado está esperando', async () => {
    let terminar;
    const escrituras = [];
    const p = { ...progresoNuevo(), dia: 8 };
    const g = new GuardadoCocina(p, async (v, r) => {
      escrituras.push({ v, r });
      if (escrituras.length === 1) await new Promise((r) => { terminar = r; });
    });
    g.registrar(1, resultado(), false, true);
    const tarea = g.guardarPendientes();
    await new Promise((r) => setImmediate(r));
    g.registrar(2, resultado(2), false, true);
    terminar();
    assert.equal(await tarea, true);
    assert.equal(escrituras.length, 2);
    assert.equal(escrituras[1].v.xp, 200);
    assert.equal(escrituras[1].v.propinas, 14);
    assert.equal(p.dia, 8);
    assert.ok(escrituras.every(({ r }) => r.monedas === 0 && r.platos === 0));
  });

  await probar('Una compra fallida no cobra ni instala la mejora', async () => {
    const p = { ...progresoNuevo(), propinas: 100 };
    const g = new GuardadoCocina(p, async () => { throw Error('Sin espacio'); });
    assert.equal(await g.comprar('alarma', 0, 40), false);
    assert.equal(p.propinas, 100);
    assert.deepEqual(p.mejoras, {});
    assert.equal(g.pendiente, true);
    assert.equal(await g.esperar(), false);
  });

  await probar('Recuperar una compra cuya confirmación se perdió no descuenta dos veces', async () => {
    let escritas = 0, almacenado;
    const p = { ...progresoNuevo(), propinas: 100 };
    const g = new GuardadoCocina(p, async (v) => {
      almacenado = structuredClone(v);
      if (++escritas === 1) throw Error('Se perdió la confirmación');
    });
    assert.equal(await g.comprar('alarma', 0, 40), false);
    assert.equal(almacenado.propinas, 60);
    assert.equal(p.propinas, 100);
    assert.equal(await g.comprar('alarma', 0, 40), true);
    assert.equal(escritas, 2);
    assert.equal(p.propinas, 60);
    assert.deepEqual(p, almacenado);
    assert.equal(g.pendiente, false);
  });

  await probar('Dos toques en la misma compra solo cobran una vez y conservan un día que llega durante la escritura', async () => {
    let terminar, llamadas = 0;
    const p = { ...progresoNuevo(), propinas: 100 };
    const g = new GuardadoCocina(p, async () => { llamadas++; await new Promise((r) => { terminar = r; }); });
    const a = g.comprar('alarma', 0, 40), b = g.comprar('alarma', 0, 40);
    await new Promise((r) => setImmediate(r));
    g.registrar(1, resultado(), false, false);
    terminar();
    // La segunda compra debe guardar el día que llegó antes de comprobar que ya existe esa mejora.
    await new Promise((r) => setImmediate(r));
    terminar();
    assert.deepEqual(await Promise.all([a, b]), [true, false]);
    assert.equal(llamadas, 2);
    assert.equal(p.propinas, 67);
    assert.equal(p.xp, 100);
    assert.equal(p.mejoras.alarma, 1);
  });

  await probar('Reenviar un resultado y normalizar la casa no repite monedas ni platos', async () => {
    let c = casaNueva();
    const monedas = c.monedas, plato = RESTAURANTES.find((r) => r.id === 'wafles').plato;
    const p = { ...progresoNuevo(), dia: 2, xp: 100 };
    aplicarGuardadoCocina(c, 'el', 'wafles', p, resultado());
    c = normalizarCasa(JSON.parse(JSON.stringify(c)));
    aplicarGuardadoCocina(c, 'el', 'wafles', p, resultado());
    assert.equal(c.monedas, monedas + 6);
    assert.equal(c.inventario[plato], 2);
    assert.equal(c.diario['cocina-pago:el:wafles:1'], 1);
  });

  await probar('Una partida antigua cuyo día ya fue pagado no vuelve a cobrarlo', async () => {
    const c = casaNueva();
    const p = { ...progresoNuevo(), dia: 2 };
    aplicarGuardadoCocina(c, 'el', 'wafles', p);
    const monedas = c.monedas, inventario = structuredClone(c.inventario);
    aplicarGuardadoCocina(c, 'el', 'wafles', p, resultado());
    assert.equal(c.monedas, monedas);
    assert.deepEqual(c.inventario, inventario);
  });

  await probar('Ayudar sin premio no consume el pago de la propia cocina', async () => {
    const c = casaNueva(), monedas = c.monedas;
    aplicarGuardadoCocina(c, 'el', 'wafles', progresoNuevo(), { ...resultado(), monedas: 0, platos: 0 });
    aplicarGuardadoCocina(c, 'el', 'wafles', { ...progresoNuevo(), dia: 2 }, resultado());
    aplicarGuardadoCocina(c, 'ella', 'wafles', { ...progresoNuevo(), dia: 2 }, resultado());
    assert.equal(c.monedas, monedas + 12);
  });
  console.log(`${pruebas.length} regresiones de Cocina pasan.`);
} finally {
  await rm(carpeta, { recursive: true, force: true });
}
