/** Abono del motor nuevo: efectos observables sin arte, DOM ni partidas del usuario. */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const tmp = await mkdtemp(join(tmpdir(), 'pvz-abono-'));
const resultados = [];
try {
 const fichero = join(tmp, 'motor.mjs');
 await build({stdin: {contents: "export * from './src/jardin/pvz/motor/motor';export * from './src/jardin/pvz/datos/dia';export * from './src/jardin/pvz/datos/plantas';export * from './src/jardin/pvz/datos/zombis';", resolveDir: resolve(import.meta.dirname, '..')}, outfile: fichero, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent'});
 const {MotorPvZ, NIVELES_DIA, PLANTAS_DIA, PLANTAS_PVZ, ZOMBIS_PVZ} = await import(pathToFileURL(fichero));
 const preparado = (op = {}, nivel = {}, registros = {}) => new MotorPvZ({...NIVELES_DIA[8], id: 'prueba-abono', solInicial: 10000, sinSolCielo: true, ...nivel}, {sinOleadas: true, semillas: PLANTAS_DIA.map(p=>p.id), abono: 3, ...op}, registros);
 const prueba = (nombre, fn) => {const detalle = fn(); resultados.push({nombre, ok: true, ...detalle}); console.log('OK', nombre);};
 const pasos = (m, cantidad) => {const eventos = []; for (let i = 0; i < cantidad; i++) {m.paso(); eventos.push(...m.consumirEventos());} return eventos;};
 const segundos = (m, s) => pasos(m, Math.ceil(s * 60));
 const siembra = (m, tipo, fila = 2, col = 0) => {assert.ok(m.plantar(tipo, fila, col), 'siembra preparada válida'); return m.plantaEn(fila, col);};
 const acabarRafaga = (m, p, maximo = 600) => {
  const eventos = []; let cantidad = 0;
  while (m.protegidaPorAbono(p) && cantidad++ < maximo) eventos.push(...pasos(m, 1));
  assert.ok(!m.protegidaPorAbono(p), 'el abono debe terminar');
  return eventos;
 };
 const disparos = (eventos, p) => eventos.filter(e => e.t === 'disparo' && e.id === p.id);
 const inmovil = {...ZOMBIS_PVZ.zombi, id: 'resistente', vida: 100000, velocidad: 0, mordida: 0};
 const conResistente = () => preparado({}, {}, {zombis: {...ZOMBIS_PVZ, resistente: inmovil}});

 for (const [tipo, normales, grande, duracion, aspecto] of [
  ['lanzaguisantes', 60, 0, 2, 'guisante'],
  ['hielaguisantes', 60, 0, 3.5, 'guisante-hielo'],
  ['repetidora', 90, 1, 2.5, 'guisante'],
 ]) {
  prueba(`${tipo}: ráfaga completa, daño, duración y curación sin blanco`, () => {
   const m = preparado(), p = siembra(m, tipo); m.danarPlanta(p, 200);
   const sol = m.sol, recarga = m.recargas[tipo];
   assert.ok(m.usarAbono(p.id)); assert.equal(m.abono, 2);
   assert.equal(m.sol, sol); assert.equal(m.recargas[tipo], recarga);
   const antes = m.estado(); assert.equal(m.usarAbono(p.id), false); assert.deepEqual(m.estado(), antes);
   assert.equal(m.quitar(p.fila, p.col), false); assert.equal(m.danarPlanta(p, 9999), false); assert.equal(p.vida, 100);
   const eventos = acabarRafaga(m, p), tiros = disparos(eventos, p);
   assert.equal(tiros.length, normales + grande);
   assert.equal(tiros.filter(e => e.proyectil === aspecto && e.cantidad === 20).length, normales);
   assert.equal(tiros.filter(e => e.proyectil === 'guisante-grande' && e.cantidad === 600).length, grande);
   assert.equal(tiros.reduce((a, e) => a + e.cantidad, 0), normales * 20 + grande * 600);
   // El primer tiro sale al iniciar; el último pequeño puede preceder un intervalo al final de su ventana.
   assert.ok(m.t >= duracion - duracion / normales - 1 / 60 && m.t <= duracion + 1 / 60, 'cadencia dentro de un intervalo de emisión y un paso fijo');
   assert.equal(eventos.filter(e => e.t === 'estado' && e.tipo === 'abono-fin' && e.id === p.id).length, 1);
   assert.equal(p.vida, PLANTAS_PVZ[tipo].vida);
   assert.ok(m.danarPlanta(p, 10)); assert.equal(p.vida, PLANTAS_PVZ[tipo].vida - 10);
   assert.ok(m.quitar(p.fila, p.col), 'la pala vuelve a funcionar al acabar');
   return {ventanaEmisionSegundos: duracion, proteccionObservadaSegundos: m.t, toleranciaSegundos: duracion / normales + 1 / 60, disparos: tiros.length, danoTotal: tiros.reduce((a, e) => a + e.cantidad, 0)};
  });
 }

 prueba('Repetidora cancela el segundo disparo normal pendiente y reinicia su espera', () => {
  const m = conResistente(), p = siembra(m, 'repetidora'); m.crearZombi('resistente', 2, 700);
  for (let i = 0; i < 60 && !p.datos.rafagaPendiente; i++) pasos(m, 1);
  assert.equal(p.datos.rafagaPendiente, 1); assert.ok(m.usarAbono(p.id));
  const eventos = acabarRafaga(m, p);
  assert.equal(disparos(eventos, p).length, 91, 'el tiro normal pendiente no se suma a los 91 del abono');
  assert.equal(disparos(segundos(m, 1.3), p).length, 0, 'la recarga normal no se consume durante el abono');
  assert.equal(disparos(segundos(m, .3), p).length, 2, 'después se recupera la ráfaga normal de dos');
 });

 prueba('el límite de 500 proyectiles pausa la ráfaga sin gastar disparos ni su final grande', () => {
  const m = preparado(), p = siembra(m, 'repetidora'); assert.ok(m.usarAbono(p.id));
  for (let i = 0; i < 500; i++) m.proyectiles.push({id: m.nuevoId(), tipo: 'ocupante-prueba', origen: 0, fila: 0, x: 200, velocidad: 0, dano: 1, danoTipo: 'recto', impactados: []});
  assert.equal(disparos(segundos(m, .5), p).length, 0); assert.ok(m.protegidaPorAbono(p));
  assert.equal(m.usarAbono(p.id), false); assert.equal(m.abono, 2);
  m.proyectiles = [];
  const eventos = acabarRafaga(m, p), tiros = disparos(eventos, p);
  assert.equal(tiros.length, 91); assert.equal(tiros.reduce((a, e) => a + e.cantidad, 0), 2400);
  assert.equal(tiros.at(-1).proyectil, 'guisante-grande');
 });

 prueba('Repetidora conserva el guisante grande si el tablero se satura justo antes de lanzarlo', () => {
  const m = preparado(), p = siembra(m, 'repetidora'); assert.ok(m.usarAbono(p.id));
  const eventos = []; let pequenos = 0;
  for (let i = 0; i < 180 && pequenos < 90; i++) {
   const nuevos = pasos(m, 1); eventos.push(...nuevos); pequenos += disparos(nuevos, p).filter(e => e.cantidad === 20).length;
  }
  assert.equal(pequenos, 90); assert.equal(disparos(eventos, p).filter(e => e.cantidad === 600).length, 0);
  while (m.proyectiles.length < 500) m.proyectiles.push({id: m.nuevoId(), tipo: 'ocupante-prueba', origen: 0, fila: 0, x: 200, velocidad: 0, dano: 1, danoTipo: 'recto', impactados: []});
  // Se inmovilizan los tiros pequeños para mantener la saturación durante la espera preparada.
  for (const q of m.proyectiles) q.velocidad = 0;
  assert.equal(disparos(segundos(m, .5), p).length, 0); assert.ok(m.protegidaPorAbono(p)); assert.equal(m.quitar(p.fila, p.col), false);
  m.proyectiles = []; const finales = disparos(acabarRafaga(m, p), p);
  assert.deepEqual(finales.map(e => [e.proyectil, e.cantidad]), [['guisante-grande', 600]]); assert.equal(m.abono, 2);
 });

 prueba('Hielaguisantes deja hielo solo delante y en su fila; la zona expira sin frío permanente', () => {
  const puerta = {...ZOMBIS_PVZ.zombi, id: 'puerta', velocidad: 20, mordida: 0, armadura: {tipo: 'escudo', vida: 100000}};
  const m = preparado({}, {}, {zombis: {...ZOMBIS_PVZ, puerta}}), p = siembra(m, 'hielaguisantes', 2, 3);
  const frente = m.crearZombi('puerta', 2, 700), detras = m.crearZombi('puerta', 2, 150), otra = m.crearZombi('puerta', 1, 700), aliado = m.crearZombi('puerta', 2, 400);
  m.aplicarEstado(aliado, 'hipnotizado'); assert.ok(m.usarAbono(p.id));
  const zona = m.estado().zonas[0]; assert.equal(zona.origen, p.id); assert.equal(zona.desde, p.x); assert.equal(zona.fila, 2); assert.equal(zona.vida, 3.5);
  segundos(m, 1); assert.ok(Math.abs(frente.x - 690) < 1e-8); assert.equal(detras.lento, 0); assert.equal(otra.lento, 0); assert.equal(aliado.lento, 0);
  assert.ok(Math.abs(detras.x - 130) < 1e-8); assert.ok(Math.abs(otra.x - 680) < 1e-8); assert.ok(Math.abs(aliado.x - 420) < 1e-8);
  segundos(m, 2.6); assert.equal(m.zonas.length, 0); assert.equal(frente.lento, 0, 'un escudo absorbe los tiros y deja aislar el efecto de la zona');
  const x = frente.x; segundos(m, .5); assert.ok(Math.abs(x - frente.x - 10) < 1e-8);
 });

 prueba('los proyectiles de abono helado conservan los diez segundos normales de lento', () => {
  const m = conResistente(), p = siembra(m, 'hielaguisantes'), z = m.crearZombi('resistente', 2, 500);
  assert.ok(m.usarAbono(p.id)); segundos(m, 4.8);
  assert.equal(m.zonas.length, 0); assert.ok(z.lento > 8 && z.lento <= 10);
  assert.equal(z.vida, 100000 - 60 * 20);
 });

 prueba('Girasol entrega 150 soles adicionales sin alterar precio ni su reloj normal', () => {
  const m = preparado(), p = siembra(m, 'girasol'), reloj = p.datos.reloj, sol = m.sol;
  m.danarPlanta(p, 200); assert.ok(m.usarAbono(p.id));
  assert.equal(m.sol, sol); assert.equal(p.vida, 300); assert.equal(p.datos.reloj, reloj);
  assert.equal(m.soles.length, 1); assert.equal(m.soles[0].valor, 150);
  assert.ok(m.recoger(m.soles[0].id)); assert.equal(m.sol, sol + 150);
  segundos(m, 6.9); assert.equal(m.soles.length, 0); segundos(m, .2); assert.equal(m.soles[0].valor, 25);
 });

 prueba('Girasol conserva la carga si hay 100 soles activos y vuelve a poder entregar 150 al liberar espacio', () => {
  const m = preparado(), p = siembra(m, 'girasol');
  for (let i = 0; i < 100; i++) assert.ok(m.crearSol(2, 200));
  const lleno = m.estado();
  assert.equal(m.puedeUsarAbono(p.id), false); assert.equal(m.usarAbono(p.id), false); assert.deepEqual(m.estado(), lleno);
  assert.ok(m.recoger(m.soles[0].id)); const sol = m.sol;
  assert.equal(m.puedeUsarAbono(p.id), true); assert.ok(m.usarAbono(p.id));
  assert.equal(m.abono, 2); assert.equal(m.sol, sol); assert.equal(m.soles.length, 100);
  assert.equal(m.soles.filter(s => s.valor === 150).length, 1); assert.equal(m.soles.at(-1).valor, 150);
 });

 prueba('Nuez cura y repone 8000 de armadura sin apilarla ni aumentar su vida base', () => {
  const m = preparado(), p = siembra(m, 'nuez'); m.danarPlanta(p, 3900);
  assert.ok(m.usarAbono(p.id)); assert.equal(p.vida, 4000); assert.equal(p.datos.abonoEscudo, 8000);
  m.danarPlanta(p, 600); assert.equal(p.vida, 4000); assert.equal(p.datos.abonoEscudo, 7400);
  assert.ok(m.usarAbono(p.id)); assert.equal(p.datos.abonoEscudo, 8000); assert.equal(m.abono, 1);
  m.danarPlanta(p, 8500); assert.equal(p.vida, 3500); assert.equal(p.datos.abonoEscudo, 0);
 });

 prueba('Patatapum arma el original y dos copias distintas sin cobrar sol ni recarga', () => {
  const m = preparado(), p = siembra(m, 'patatapum'); m.danarPlanta(p, 200);
  const sol = m.sol, recarga = m.recargas.patatapum;
  assert.ok(m.usarAbono(p.id)); assert.equal(m.abono, 2); assert.equal(m.sol, sol); assert.equal(m.recargas.patatapum, recarga);
  assert.equal(m.plantas.length, 3); assert.equal(new Set(m.plantas.map(p => p.id)).size, 3);
  assert.equal(new Set(m.plantas.map(p => `${p.fila}:${p.col}`)).size, 3);
  assert.ok(m.plantas.every(q => q.tipo === 'patatapum' && q.edad >= 14 && q.vida === 300));
  const copias = m.plantas.filter(q => q !== p); assert.ok(copias.every(q => q.datos.origenAbono === p.id));
  assert.equal(m.eventos.filter(e => e.t === 'siembra' && e.origen === p.id).length, 2);
  const z = m.crearZombi('caracubo', copias[0].fila, copias[0].x + 20); m.paso(); assert.equal(z.vida, 0, 'una copia recién creada ya puede detonar');
 });

 const relleno = {...PLANTAS_PVZ.nuez, id: 'relleno-prueba', sol: 0, recarga: 0};
 for (const libres of [0, 1]) prueba(`Patatapum respeta el tablero ocupado con ${libres} huecos disponibles`, () => {
  const plantas = {...PLANTAS_PVZ, [relleno.id]: relleno};
  const m = preparado({semillas: ['patatapum',relleno.id]}, {filas: [2]}, {plantas}), p = siembra(m, 'patatapum');
  for (let c = 1; c < 9 - libres; c++) siembra(m, relleno.id, 2, c);
  const antes = m.plantas.length; assert.ok(m.usarAbono(p.id));
  assert.equal(m.plantas.length, antes + libres); assert.equal(m.plantas.filter(q => q.datos.origenAbono === p.id).length, libres);
  assert.ok(m.plantas.every(q => q.fila === 2)); assert.equal(p.edad, 14);
 });

 prueba('Patatapum y sus copias rechazan el agua incluso con soporte', () => {
  const base = {...PLANTAS_PVZ.nuez, id: 'base-prueba', sol: 0, recarga: 0, capa: 'base', agua: 'tambien'};
  const plantas = {...PLANTAS_PVZ, [base.id]: base};
  const m = preparado({semillas: ['patatapum',base.id]}, {area:'piscina',filas:[1,2],filasAgua:[2]}, {plantas});
  for (const c of [0,1,8]) siembra(m,base.id,2,c);
  const antes=m.estado();assert.equal(m.plantar('patatapum',2,0),false);assert.deepEqual(m.estado(),antes);
  const p=siembra(m,'patatapum',1,0);assert.ok(m.usarAbono(p.id));
  const minas=m.plantas.filter(q=>q.tipo==='patatapum');assert.equal(minas.length,3);
  assert.ok(minas.every(q=>q.fila===1));assert.equal(new Set(minas.map(q=>q.col)).size,3);
 });
 prueba('Patatapum reproduce solo en casillas con soporte de tejado', () => {
  const base = {...PLANTAS_PVZ.nuez, id: 'base-prueba', sol: 0, recarga: 0, capa: 'base', agua: 'tambien'};
  const plantas = {...PLANTAS_PVZ, [base.id]: base};
  const m = preparado({semillas: ['patatapum',base.id]}, {area:'tejado',filas:[2]}, {plantas});
  for (const c of [0,1,8]) siembra(m,base.id,2,c);
  const p=siembra(m,'patatapum');assert.ok(m.usarAbono(p.id));
  assert.deepEqual(m.plantas.filter(q=>q.tipo==='patatapum').map(q=>q.col).sort((a,b)=>a-b),[0,1,8]);
 });

 prueba('reproducir plantas y crear hielo no son órdenes gratuitas fuera de la habilidad', () => {
  const m = preparado(), p = siembra(m, 'patatapum'), antes = m.estado();
  assert.deepEqual(m.casillasParaReproducir(p), []); assert.equal(m.reproducirPlanta(p, 2, 1), null); assert.equal(m.crearZonaHielo(p, 3), null);
  assert.deepEqual(m.estado(), antes);
 });

 prueba('Carnívora devora tres enemigos frontales y deja intactos los de atrás, otra fila y aliados', () => {
  const m = preparado(), p = siembra(m, 'planta-carnivora', 2, 3); p.datos.digiere = 35;
  const frente = [350, 400, 450, 500, 800].map(x => m.crearZombi('caracubo', 2, x));
  const detras = m.crearZombi('zombi', 2, 200), otra = m.crearZombi('zombi', 1, 300), aliado = m.crearZombi('zombi', 2, 300);
  m.aplicarEstado(aliado, 'hipnotizado'); assert.ok(m.usarAbono(p.id));
  assert.ok(frente.slice(0, 3).every(z => z.vida === 0 && z.armadura === 0));
  assert.equal(frente[3].x, 680); assert.equal(frente[4].x, 800, 'el retroceso nunca acerca a un enemigo lejano');
  assert.ok([detras, otra, aliado].every(z => z.vida === 270)); assert.equal(detras.x, 200); assert.equal(aliado.x, 300);
  assert.equal(p.datos.digiere, 0); assert.equal(m.eliminados, 3);
  const siguiente = m.crearZombi('zombi', 2, p.x + 40); m.paso(); assert.equal(siguiente.vida, 0, 'puede volver a devorar después del abono');
  assert.equal(p.datos.digiere, 42);
 });

 prueba('Carnívora causa 1000 a indigeribles sin suprimir el retroceso de supervivientes', () => {
  const grande = {...inmovil, id: 'indigerible', vida: 6000, comestible: false};
  const m = preparado({}, {}, {zombis: {...ZOMBIS_PVZ, indigerible: grande}}), p = siembra(m, 'planta-carnivora');
  const zs = [200, 300, 400, 500].map(x => m.crearZombi('indigerible', 2, x));
  assert.ok(m.usarAbono(p.id)); assert.deepEqual(zs.map(z => z.vida), [5000, 5000, 5000, 6000]);
  assert.ok(zs.every(z => z.x === 680 && z.comiendo === null)); assert.equal(p.datos.digiere, 0);
 });

 prueba('el ataque normal de Carnívora muerde indigeribles a 40 cada 1,5 s sin tragarlos', () => {
  const grande = {...inmovil, id: 'indigerible', vida: 6000, comestible: false};
  const m = preparado({}, {}, {zombis: {...ZOMBIS_PVZ, indigerible: grande}}), p = siembra(m, 'planta-carnivora');
  const z = m.crearZombi('indigerible', 2, p.x + 40); m.paso(); assert.equal(z.vida, 5960);
  segundos(m, 1.4); assert.equal(z.vida, 5960); segundos(m, .15); assert.equal(z.vida, 5920);
  assert.equal(p.datos.digiere, 0); assert.equal(z.x, p.x + 40);
 });

 prueba('sin carga, dormida, congelada, muerta, id inválido o sin efecto no se cobra abono', () => {
  for (const variante of ['sin-carga', 'dormida', 'congelada', 'muerta', 'id-invalido', 'sin-efecto']) {
   const m = preparado({abono: variante === 'sin-carga' ? 0 : 3});
   const p = siembra(m, variante === 'sin-efecto' ? 'petacereza' : 'lanzaguisantes');
   if (variante === 'dormida') p.dormida = true;
   if (variante === 'congelada') p.congelada = 1;
   if (variante === 'muerta') m.danarPlanta(p, 300);
   const id = variante === 'id-invalido' ? Number.NaN : p.id, antes = m.estado();
   assert.equal(m.puedeUsarAbono(id), false, variante); assert.equal(m.usarAbono(id), false, variante); assert.deepEqual(m.estado(), antes, variante);
  }
 });

 prueba('una derrota bloquea nuevas habilidades y conserva el estado de la ráfaga en curso', () => {
  const m = preparado(), p = siembra(m, 'lanzaguisantes'); assert.ok(m.usarAbono(p.id));
  m.cortacespedes[0].estado = 'gastado'; m.crearZombi('zombi', 0, -59.99); m.paso(); assert.equal(m.terminado, 'perdio');
  const antes = m.estado(); assert.equal(m.usarAbono(p.id), false); m.paso(); assert.deepEqual(m.estado(), antes);
 });

 prueba('misma semilla y habilidades producen clones, zonas, tiros y estado idénticos', () => {
  const correr = () => {
   const m = preparado({semilla: 108}), mina = siembra(m, 'patatapum', 2, 2), hielo = siembra(m, 'hielaguisantes', 1, 2), repetidora = siembra(m, 'repetidora', 3, 2);
   const eventos = []; for (const p of [mina, hielo, repetidora]) {assert.ok(m.usarAbono(p.id)); eventos.push(...m.consumirEventos());}
   for (let i = 0; i < 300; i++) {eventos.push(...pasos(m, 1)); const copia = m.estado(); copia.plantas.length = 0; copia.zonas.length = 0;}
   return {estado: m.estado(), azar: m.azar.estado, eventos};
  };
  assert.deepEqual(correr(), correr());
 });

 const salida = resolve(import.meta.dirname, '../test-results/pvz/abono');
 await mkdir(salida, {recursive: true}); await writeFile(join(salida, 'resultado.json'), JSON.stringify({ok: true, pruebas: resultados}, null, 2));
 console.log('OK', resultados.length, 'verificaciones de abono, sin arte ni almacenamiento del usuario');
} finally {await rm(tmp, {recursive: true, force: true});}
