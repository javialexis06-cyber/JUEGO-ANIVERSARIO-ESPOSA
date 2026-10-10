import assert from 'node:assert/strict';
import { transform } from 'esbuild';
import { readFile } from 'node:fs/promises';

// Transform in memory: no temporary build and no directory scanning outside the workspace.
const modules = new Map();
async function compile(url) {
  if (modules.has(url.href)) return modules.get(url.href);
  let { code } = await transform(await readFile(url, 'utf8'), { loader: 'ts', format: 'esm', target: 'es2022' });
  for (const match of [...code.matchAll(/from (["'])(\.\/[^"']+)\1/g)]) {
    const imported = await compile(new URL(`${match[2]}.ts`, url));
    code = code.replace(match[0], `from ${JSON.stringify(imported)}`);
  }
  const result = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  modules.set(url.href, result); return result;
}
const { MotorGranja, validarEstado } = await import(await compile(new URL('../../src/granja-v3/motor.ts', import.meta.url)));
const { distribuirInventario, resumirCasillas } = await import(await compile(new URL('../../src/granja-v3/inventario.ts', import.meta.url)));
const { nodosExteriores } = await import(await compile(new URL('../../src/granja-v3/progresion.ts', import.meta.url)));
const {atencionServicio} = await import(await compile(new URL('../../src/granja-v3/aldeanos.ts', import.meta.url)));
const G = await import(await compile(new URL('../../src/granja-v3/ganaderia.ts', import.meta.url)));
const H = 3_600_000, D = 24 * H, start = 1_800_000_000_000;
let checks = 0, failures = 0, now = start;
const clone = x => structuredClone(x);
const test = (name, fn) => { try { fn(); checks++; console.log(`OK ${name}`); } catch (e) { failures++; console.error(`FAIL ${name}: ${e.message}`); } };
const act = (motor, action) => { const r = motor.actuar(action); assert.equal(r.ok, true, `${JSON.stringify(action)}: ${r.mensaje}`); return r; };
const fail = (motor, action) => { const r = motor.actuar(action); assert.equal(r.ok, false, `La acción debía rechazarse: ${JSON.stringify(action)}`); return r; };
const motor = new MotorGranja({ ahora: () => now, azar: () => .25 });
let basicState, finalState, hogarState, huertaState;
const inventory = (state, record) => { state.casillasInventario=distribuirInventario(record,36).casillas; state.inventario=resumirCasillas(state.casillasInventario); };
// El recorrido de linajes respeta los días libres y espera mediante noches normales.
const service = (game, id) => {act(game,{tipo:'viajar',zona:'pueblo'});game.estado.jornada.minutos=600;while(!atencionServicio(id,game.estado.jornada.diasCompletados,600).abierto){act(game,{tipo:'viajar',zona:'granja'});act(game,{tipo:'dormir',jornada:game.estado.jornada.diasCompletados,edificioId:'casa_inicial',xJugador:-5,zJugador:-.5});act(game,{tipo:'continuar_dia',jornada:game.estado.jornada.diasCompletados});act(game,{tipo:'viajar',zona:'pueblo'});game.estado.jornada.minutos=600;}act(game,{tipo:'entrar_servicio',servicio:id});};
const collect = game => { for(const d of [...game.estado.drops].filter(d=>d.zona===game.estado.zona && (d.zona!=='mina'||d.nivelMina===game.estado.nivelMina)))act(game,{tipo:'recoger_drop',dropId:d.id,xJugador:d.x,zJugador:d.z}); };
const harvest = (game,o) => { while(game.nodosActuales().some(n=>n.id===o.id)){now+=400;act(game,{tipo:'limpiar',x:o.x,z:o.z,xJugador:o.x+.5,zJugador:o.z+1.5});} collect(game); };


// Los nacimientos ovíparos se verifican mediante huevo, incubadora y noches normales.
const eclosionar=(game,mother,advanced=false)=>{const casilla=game.estado.casillasInventario.findIndex(p=>p&&G.leerHuevo(p.articulo)?.especie===mother.especie);if(casilla<0)return;const id=mother.edificioId;act(game,{tipo:'viajar',zona:'granja'});act(game,{tipo:'entrar',edificioId:id});if(!game.estado.ganaderia.incubadoras.some(i=>i.edificioId===id)){assert.equal(advanced,true,'La primera familia usa la incubadora inicial');act(game,{tipo:'instalar_incubadora',edificioId:id});}if(G.GANADO[mother.especie].grande)act(game,{tipo:'ampliar_incubadora',edificioId:id});act(game,{tipo:'incubar',edificioId:id,casilla});act(game,{tipo:'salir'});for(let i=0;i<G.GANADO[mother.especie].incubacion;i++){act(game,{tipo:'dormir',jornada:game.estado.jornada.diasCompletados,edificioId:'casa_inicial',xJugador:-5,zJugador:-.5});act(game,{tipo:'continuar_dia',jornada:game.estado.jornada.diasCompletados});}};
test('Tres primeras misiones mediante acciones legales y tiempo entre golpes, sin editar inventario ni dinero', () => {
  assert.equal(validarEstado(motor.estado), null);
  assert.equal(motor.getMisionActual().id, 'hogar');
  for (const obstacle of motor.estado.obstaculos.filter(o => o.sectorId === 0).slice(0, 3)) {
    act(motor, { tipo: 'herramienta', herramienta: obstacle.tipo === 'arbol' ? 'hacha' : obstacle.tipo === 'maleza' ? 'guadana' : 'pico' });
    harvest(motor, obstacle);
  }
  act(motor, { tipo: 'reclamar', misionId: 'hogar' });
  hogarState = clone(motor.estado);
  for (let z = -4; z < 0; z++) {
    act(motor, { tipo: 'herramienta', herramienta: 'azada' });
    act(motor, { tipo: 'labrar', x: -1, z });
    act(motor, { tipo: 'plantar', x: -1, z, cultivo: 'zanahoria' });
    act(motor, { tipo: 'herramienta', herramienta: 'regadera' });
    act(motor, { tipo: 'regar', x: -1, z });
  }
  act(motor, { tipo: 'reclamar', misionId: 'huerta' });
  huertaState = clone(motor.estado);
  for (const a of motor.estado.animales) {
    act(motor, { tipo: 'cuidar', animalId: a.id, metodo: 'alimentar' });
    act(motor, { tipo: 'cuidar', animalId: a.id, metodo: 'cuento' });
  }
  act(motor, { tipo: 'craftear', articulo: 'banco' });
  act(motor, { tipo: 'reclamar', misionId: 'confianza' });
  assert.deepEqual(motor.estado.misionesCompletadas, ['hogar', 'huerta', 'confianza']);
  assert.equal(motor.estado.monedas, 880);
  assert.equal(motor.estado.desbloqueos.includes('crianza'), true);
  assert.equal(validarEstado(motor.estado), null);
  basicState = clone(motor.estado);
});
test('La primera familia usa los adultos iniciales y desbloquea fantasía sin compras obligatorias de padres', () => {
  fail(motor, { tipo: 'adoptar', especie: 'gallina', sexo: 'hembra', variante: 'gallina_oscura' });
  act(motor, { tipo: 'criar', madreId: 'animal_inicial_0', padreId: 'animal_inicial_1' });
  assert.equal(motor.estado.animales.length,2);assert.equal(motor.estado.estadisticas.nacimientos??0,0);
  eclosionar(motor,motor.estado.animales[0]);
  assert.equal(motor.estado.animales.length, 3);
  assert.equal(motor.estado.estadisticas.nacimientos, 1);
  fail(motor, { tipo: 'criar', madreId: 'animal_inicial_0', padreId: 'animal_inicial_1' });
  act(motor, { tipo: 'sector', sectorId: 1 });
  act(motor, { tipo: 'reclamar', misionId: 'familia' });
  assert.equal(motor.estado.monedas, 1000);
  assert.equal(motor.getMisionActual().id, 'crianza_gallina_oscura');
  assert.equal(validarEstado(motor.estado), null);
});
test('No se pueden repetir recompensas después de exportar y cargar, ni retrocediendo el reloj', () => {
  const loaded = new MotorGranja({ ahora: () => start - H, estado: clone(motor.estado) });
  const money = loaded.estado.monedas;
  for (const id of ['hogar', 'huerta', 'confianza', 'familia']) fail(loaded, { tipo: 'reclamar', misionId: id });
  assert.equal(loaded.estado.monedas, money);
  assert.equal(loaded.estado.ultimoTiempo, motor.estado.ultimoTiempo);
});
test('Flujo de los 13 linajes: una adopción jamás satisface una misión que exige nacimiento', () => {
  // Fixture con terreno despejado y capital de prueba. La cadena de desbloqueos y
  // cada nacimiento se ejecutan con acciones normales; esto NO mide tiempo/economía final.
  const fixture = clone(motor.estado);
  fixture.monedas = 1_000_000;
  fixture.sectorIds = Array.from({ length: 30 }, (_, i) => i);
  fixture.obstaculos = nodosExteriores();
  inventory(fixture, {...fixture.inventario, heno: 300,madera:200,cobre:100,vidrio:100,lingote_hierro:50});
  fixture.nivelesHerramienta.hacha=2; // Esta prueba recorre linajes, no el coste/tiempo de herrería.
  const game = new MotorGranja({ ahora: () => now, azar: () => .25, estado: fixture });
  const lineages = [
    ['gallina_oscura', 'gallina', 'sombrio'], ['gallina_aurora', 'gallina', 'polar'],
    ['conejo_lunar', 'conejo', 'celeste'], ['conejo_escarcha', 'conejo', 'polar'],
    ['cerdito_musgo', 'cerdito', 'humedo'], ['cerdito_ambar', 'cerdito', 'mineral'],
    ['oveja_cristal', 'oveja', 'mineral'], ['oveja_tormenta', 'oveja', 'celeste'],
    ['vaca_volcan', 'vaca', 'volcanico'], ['vaca_nube', 'vaca', 'celeste'],
    ['unicornio', 'unicornio', 'celeste'], ['dragon', 'dragon', 'volcanico'], ['grifo', 'grifo', 'celeste'],
  ];
  for (let index = 0; index < lineages.length; index++) {
    const [lineage, species, climate] = lineages[index];
    assert.equal(game.getMisionActual().id, `crianza_${lineage}`);
    fail(game, { tipo: 'reclamar', misionId: `crianza_${lineage}` });
    if (index < lineages.length - 1) fail(game, { tipo: 'adoptar', especie: lineages[index + 1][1], sexo: 'hembra', variante: lineages[index + 1][0] });
    service(game,'animales');
    fail(game, { tipo: 'adoptar', especie: species, sexo: 'hembra', variante: lineage });
    const shelter = `refugio_${species}_${climate}`;
    service(game,'carpinteria');
    act(game, { tipo: 'comprar', articulo: shelter });
    act(game,{tipo:'viajar',zona:'granja'});
    let placed = false;
    outer: for (let z = -39; z < 46; z++) for (let x = -49; x < 45; x++) {
      const result = game.actuar({ tipo: 'construir', articulo: shelter, x, z });
      if (result.ok) { placed = true; break outer; }
    }
    assert.equal(placed, true, `Sin espacio para ${lineage}`);
    const count = game.estado.animales.length;
    service(game,'animales');
    act(game, { tipo: 'adoptar', especie: species, sexo: 'hembra', variante: lineage });
    act(game, { tipo: 'adoptar', especie: species, sexo: 'macho', variante: lineage });
    assert.equal(game.estado.estadisticas[`nacimiento_${lineage}`] ?? 0, 0);
    fail(game, { tipo: 'reclamar', misionId: `crianza_${lineage}` });
    const mother = game.estado.animales[count], father = game.estado.animales[count + 1];
    act(game, { tipo: 'criar', madreId: mother.id, padreId: father.id });
    if(G.GANADO[species].incubacion){assert.equal(game.estado.estadisticas[`nacimiento_${lineage}`]??0,0);fail(game,{tipo:'reclamar',misionId:`crianza_${lineage}`});eclosionar(game,mother,true);}
    assert.equal(game.estado.estadisticas[`nacimiento_${lineage}`], 1);
    if (species === 'unicornio') {
      fail(game, { tipo: 'reclamar', misionId: `crianza_${lineage}` });
      act(game, { tipo: 'viajar', zona: 'bosque_ancestral' });
      act(game, { tipo: 'herramienta', herramienta: 'espada' });
      while (game.estado.enemigo) act(game, { tipo: 'combatir' });
      act(game, { tipo: 'herramienta', herramienta: 'hacha' });
      for(const node of game.nodosActuales().slice(0,2))harvest(game,node);
    }
    if (species === 'dragon') {
      fail(game, { tipo: 'reclamar', misionId: `crianza_${lineage}` });
      act(game, { tipo: 'viajar', zona: 'mina' });
      act(game, { tipo: 'herramienta', herramienta: 'espada' });
      while (game.estado.enemigo) act(game, { tipo: 'combatir' });
      act(game, { tipo: 'herramienta', herramienta: 'pico' });
      for(const node of game.nodosActuales().slice(0,3))harvest(game,node);
    }
    act(game, { tipo: 'reclamar', misionId: `crianza_${lineage}` });
    assert.equal(game.estado.tokensCasa.includes(`casa_${lineage}`), true);
    assert.equal(validarEstado(game.estado), null);
  }
  assert.equal(game.getMisionActual(), undefined);
  assert.equal(game.estado.tokensCasa.length, 13);
  assert.equal(game.estado.desbloqueos.includes('ayudante'), true);
  finalState = clone(game.estado);
});
test('Sin monedas ni provisiones, las herramientas básicas permiten recuperar la economía', () => {
  const fixture = clone(basicState); fixture.monedas = 0; inventory(fixture,{herramienta_hacha:1}); fixture.energia = 0;
  const game = new MotorGranja({ ahora: () => now, estado: fixture });
  act(game, { tipo: 'descansar' });
  act(game, { tipo: 'viajar', zona: 'bosque' });
  act(game, { tipo: 'herramienta', herramienta: 'hacha' });
  for(const node of game.nodosActuales().slice(0,5))harvest(game,node);
  service(game,'semillas');
  act(game, { tipo: 'vender', articulo: 'madera', cantidad: 30 });
  assert.equal(game.estado.monedas, 60);
  assert.equal(game.estado.inventario.madera ?? 0, 0);
});

const helperFixture = () => {
  assert.ok(finalState, 'Se necesita la prueba de linajes completada');
  const state = clone(finalState);
  state.animales = state.animales.filter(a => a.id.startsWith('animal_inicial'));
  state.edificios = state.edificios.filter(e => ['casa_inicial', 'corral_inicial'].includes(e.id));
  state.envios.cajas=[];state.ganaderia.incubadoras=state.ganaderia.incubadoras.filter(i=>i.edificioId==='corral_inicial');state.ganaderia.trufas=[];state.interior = null; state.servicio=null; state.zona = 'granja'; state.enemigo = 0;
  state.edificios.find(e => e.especie).pasto = 0;
  inventory(state,{...state.inventario,heno:100});
  return state;
};
test('Ayudante contratado entre horas: resultado idéntico continuo y 72h offline', () => {
  let clock = start + H / 2;
  const base = new MotorGranja({ ahora: () => clock, estado: helperFixture() });
  act(base, { tipo: 'ayudante' });
  const state = clone(base.estado);
  const offline = new MotorGranja({ ahora: () => clock, estado: state });
  const continuous = new MotorGranja({ ahora: () => clock, estado: state });
  for (let i = 1; i <= 144; i++) continuous.actualizar(clock + i * H / 2);
  offline.actualizar(clock + 72 * H);
  assert.equal(offline.estado.inventario.heno, 76, 'Dos animales × doce cuidados de seis horas');
  assert.equal(continuous.estado.inventario.heno, offline.estado.inventario.heno);
  assert.deepEqual(continuous.estado.animales.map(a => a.cuidado), offline.estado.animales.map(a => a.cuidado));
});
test('Heno, pasto, duración de contrato y producción siguen siendo finitos durante ausencia larga', () => {
  let clock = start;
  const state = helperFixture(); inventory(state,{...state.inventario,heno:3}); state.edificios.find(e => e.especie).pasto = 2;
  const game = new MotorGranja({ ahora: () => clock, estado: state });
  act(game, { tipo: 'ayudante' });
  clock += 365 * D; game.actualizar();
  assert.equal(game.estado.inventario.heno ?? 0, 0);
  assert.equal(game.estado.edificios.find(e => e.especie).pasto, 0);
  assert.equal(game.estado.ayudante, null);
  for (const a of game.estado.animales) {
    assert.ok(a.productos <= 5);
    assert.equal(game.resumenAnimal(a).enfermo, true);
    assert.equal(game.resumenAnimal(a).deprimido, true);
  }
  assert.equal(validarEstado(game.estado), null);
});
test('Carga rechaza cuidado incoherente antes de provocar excepciones al actualizar', () => {
  const fixture = clone(basicState);
  fixture.animales[0].cuidado.lastEvaluatedAt = start - H;
  const game = new MotorGranja({ ahora: () => start + H });
  const previous = clone(game.estado);
  let result;
  assert.doesNotThrow(() => { result = game.cargarJSON(JSON.stringify(fixture)); });
  assert.equal(result.ok, false);
  assert.deepEqual(game.estado, previous);
  fixture.animales[0].especie = 'constructor';
  assert.doesNotThrow(() => { result = game.cargarJSON(JSON.stringify(fixture)); });
  assert.equal(result.ok, false);
  assert.deepEqual(game.estado, previous);
});
test('Carga rechaza riego posterior a evaluación y cultivo maduro incompleto', () => {
  const game = new MotorGranja({ ahora: () => start });
  const fixture = clone(basicState);
  fixture.parcelas[0].cuidado.lastEvaluatedAt = start - 1;
  assert.equal(game.cargarJSON(JSON.stringify(fixture)).ok, false);
  const mature = clone(basicState);
  mature.parcelas[0].cuidado.status = 'maduro';
  assert.equal(game.cargarJSON(JSON.stringify(mature)).ok, false);
});
test('Alisar exige pico y tierra vacía, protege cultivos y permite construir sobre el antiguo surco', () => {
  const game = new MotorGranja({ ahora: () => start, estado: clone(basicState) });
  act(game, { tipo: 'herramienta', herramienta: 'azada' });
  act(game, { tipo: 'labrar', x: -1, z: 4 });
  fail(game, { tipo: 'construir', articulo: 'banco', x: -1, z: 4 });
  fail(game, { tipo: 'alisar', x: -1, z: 4 });
  act(game, { tipo: 'herramienta', herramienta: 'pico' });
  const planted = clone(game.estado.parcelas.find(p => p.x === -1 && p.z === -4));
  fail(game, { tipo: 'alisar', x: -1, z: -4 });
  assert.deepEqual(game.estado.parcelas.find(p => p.x === -1 && p.z === -4), planted);
  act(game, { tipo: 'alisar', x: -1, z: 4 });
  assert.equal(game.estado.parcelas.some(p => p.x === -1 && p.z === 4), false);
  act(game, { tipo: 'construir', articulo: 'banco', x: -1, z: 4 });
  assert.equal(validarEstado(game.estado), null);
});
test('Suelos y vallas vuelven al inventario sin duplicarse; los refugios ocupados se conservan', () => {
  const game = new MotorGranja({ ahora: () => start, estado: clone(basicState) });
  for (const articulo of ['suelo_piedra', 'valla_madera']) {
    service(game,'carpinteria');
    act(game, { tipo: 'comprar', articulo });
    const money = game.estado.monedas;
    act(game,{tipo:'viajar',zona:'granja'});
    act(game, { tipo: 'construir', articulo, x: -1, z: 4 });
    const e = game.estado.edificios.find(e => e.articulo === articulo);
    act(game, { tipo: 'retirar_edificio', edificioId: e.id });
    assert.equal(game.estado.inventario[`creacion_${articulo}`], 1);
    fail(game, { tipo: 'retirar_edificio', edificioId: e.id });
    assert.equal(game.estado.inventario[`creacion_${articulo}`], 1);
    assert.equal(game.estado.monedas, money);
    act(game, { tipo: 'construir', articulo, x: -1, z: 4 });
    const placed = game.estado.edificios.find(e => e.articulo === articulo);
    act(game, { tipo: 'retirar_edificio', edificioId: placed.id });
  }
  const animals = clone(game.estado.animales);
  fail(game, { tipo: 'retirar_edificio', edificioId: 'corral_inicial' });
  assert.deepEqual(game.estado.animales, animals);
  assert.ok(game.estado.edificios.some(e => e.id === 'corral_inicial'));
  act(game, { tipo: 'entrar', edificioId: 'casa_inicial' });
  act(game, { tipo: 'retirar_edificio', edificioId: 'casa_inicial' });
  assert.equal(game.estado.interior, null);
  assert.equal(game.estado.inventario.creacion_casa, 1);
  assert.equal(validarEstado(game.estado), null);
});
test('La tristeza impide criar aunque los padres tengan alimento y aún no estén deprimidos', () => {
  let clock = basicState.ultimoTiempo;
  const game = new MotorGranja({ ahora: () => clock, estado: clone(basicState) });
  clock += 24 * H; game.actualizar();
  for (const a of game.estado.animales) {
    assert.equal(game.resumenAnimal(a).triste, true);
    assert.equal(game.resumenAnimal(a).deprimido, false);
    assert.equal(game.resumenAnimal(a).puedeProducir, true);
  }
  const count = game.estado.animales.length, hay = game.estado.inventario.heno;
  fail(game, { tipo: 'criar', madreId: 'animal_inicial_0', padreId: 'animal_inicial_1' });
  assert.equal(game.estado.animales.length, count);
  assert.equal(game.estado.inventario.heno, hay);
  for (const a of game.estado.animales) act(game, { tipo: 'cuidar', animalId: a.id, metodo: 'musica' });
  act(game, { tipo: 'criar', madreId: 'animal_inicial_0', padreId: 'animal_inicial_1' });
  assert.equal(game.estado.animales.length,count);eclosionar(game,game.estado.animales[0]);
  assert.equal(game.estado.animales.length, count + 1);
});
test('Pasto entre horas conserva consumo y salud idénticos tras guardar y cargar', () => {
  let clock = start + H / 2;
  const fixture = clone(basicState);
  fixture.ultimoTiempo = clock;
  fixture.edificios.find(e => e.especie).ultimoPastoAt = clock;
  fixture.edificios.find(e => e.especie).pasto = 64;
  const offline = new MotorGranja({ ahora: () => clock, estado: fixture });
  const split = new MotorGranja({ ahora: () => clock, estado: fixture });
  for (let i = 1; i <= 27; i++) split.actualizar(clock + i * H / 2);
  // Export must use the same injected time as the latest explicit update.
  clock += 13.5 * H;
  const save = split.exportar();
  const loaded = new MotorGranja({ ahora: () => clock });
  assert.equal(loaded.cargarJSON(save).ok, true);
  clock = start + 32.5 * H;
  offline.actualizar(clock); loaded.actualizar(clock);
  assert.equal(offline.estado.edificios.find(e => e.especie).pasto, 56);
  assert.equal(loaded.estado.edificios.find(e => e.especie).pasto, 56);
  assert.deepEqual(loaded.estado.animales, offline.estado.animales);
  assert.equal(validarEstado(loaded.estado), null);
});
test('Las variedades naturales se desbloquean con hogar, huerta y confianza sin cobrar intentos bloqueados', () => {
  const games = [new MotorGranja({ ahora: () => start }), ...[hogarState, huertaState, basicState].map(estado => new MotorGranja({ ahora: () => start, estado: clone(estado) }))];
  for (let stage = 0; stage < games.length; stage++) {
    const game = games[stage];
    service(game,'animales');
    for (let variant = stage + 1; variant <= 3; variant++) {
      const before = clone(game.estado);
      fail(game, { tipo: 'adoptar', especie: 'gallina', sexo: 'hembra', variante: variant });
      assert.deepEqual(game.estado, before);
    }
    act(game, { tipo: 'adoptar', especie: 'gallina', sexo: 'hembra', variante: stage });
    assert.equal(game.estado.animales.length, 3);
    assert.equal(game.resumenAnimal(game.estado.animales.at(-1)).variante, stage);
  }
});
test('Decoración ancestral: requisitos bloquean sin gasto y los cuatro objetos se fabrican y compran', () => {
  const locked = new MotorGranja({ ahora: () => start, estado: clone(basicState) });
  for (const id of ['puente_ancestral', 'pergola_ancestral']) {
    const before = clone(locked.estado);
    fail(locked, { tipo: 'comprar', articulo: id });
    fail(locked, { tipo: 'craftear', articulo: id });
    assert.deepEqual(locked.estado, before);
  }
  const fixture = clone(finalState);
  inventory(fixture,{ madera_ancestral: 100, madera: 100, fibra: 100, hierro: 100, piedra: 100, cristal: 100 });
  const game = new MotorGranja({ ahora: () => start, estado: fixture });
  service(game,'carpinteria');
  const recipes = {
    puente_ancestral: { madera_ancestral: 16, hierro: 4 },
    farol_cristal: { madera_ancestral: 4, cristal: 5 },
    jardin_lirios: { piedra: 15, cristal: 3 },
    pergola_ancestral: { madera_ancestral: 24, madera: 12, fibra: 10 },
  };
  for (const [id, recipe] of Object.entries(recipes)) {
    const before = clone(game.estado.inventario);
    act(game, { tipo: 'craftear', articulo: id });
    for (const [material, amount] of Object.entries(recipe)) assert.equal(game.estado.inventario[material], before[material] - amount);
    assert.equal(game.estado.inventario[`creacion_${id}`], 1);
    act(game, { tipo: 'comprar', articulo: id });
    assert.equal(game.estado.inventario[`creacion_${id}`], 2);
  }
  assert.equal(validarEstado(game.estado), null);
});
test('Los límites de animales y construcciones preservan una partida cargable sin cobrar intentos', () => {
  const fixture = clone(basicState);
  // Terreno sintético vacío: esta prueba cubre capacidad, no ocupación de estanques.
  delete fixture.paisaje;
  fixture.sectorIds = Array.from({ length: 30 }, (_, i) => i);
  fixture.obstaculos = []; fixture.parcelas = []; fixture.secuencia = 10000;
  fixture.edificios = Array.from({ length: 41 }, (_, i) => ({ id: `refugio_prueba_${i}`, articulo: 'refugio_gallina_templado', x: -48 + (i % 10) * 5, z: -38 + Math.floor(i / 10) * 9, giro: 0, especie: 'gallina', clima: 'templado', pasto: 0, ultimoPastoAt: start }));
  fixture.envios.cajas=[];fixture.ganaderia=G.crearGanaderia();
  fixture.animales = Array.from({ length: 240 }, (_, i) => ({ ...clone(basicState.animales[i % 2]), id: `animal_prueba_${i}`, edificioId: fixture.edificios[Math.floor(i / 6)].id }));
  assert.equal(validarEstado(fixture), null);
  const animals = new MotorGranja({ ahora: () => start, estado: fixture });
  service(animals,'animales');
  const before = clone(animals.estado);
  fail(animals, { tipo: 'adoptar', especie: 'gallina', sexo: 'hembra' });
  assert.deepEqual(animals.estado,before);
  act(animals, { tipo: 'criar', madreId: 'animal_prueba_0', padreId: 'animal_prueba_1' });assert.equal(animals.estado.animales.length,240);assert.equal(animals.estado.inventario.heno,before.inventario.heno-4);assert.equal(animals.estado.estadisticas.nacimientos??0,before.estadisticas.nacimientos??0);assert.equal(animals.estado.habilidades.experiencia.agricultura,before.habilidades.experiencia.agricultura);assert.equal(animals.estado.casillasInventario.filter(p=>p&&G.leerHuevo(p.articulo)).reduce((n,p)=>n+p.cantidad,0),1);
  assert.equal(new MotorGranja({ ahora: () => start }).cargarJSON(animals.exportar()).ok, true);

  const buildingsState = clone(basicState);
  delete buildingsState.paisaje;
  buildingsState.sectorIds = fixture.sectorIds;
  buildingsState.obstaculos = [{ id: 'ruina_prueba', tipo: 'ruina', x: 1, z: 1, sectorId: 0, hp:8, hpMax:8, regeneraEn:null }];
  buildingsState.envios.cajas=[];buildingsState.ganaderia=G.crearGanaderia();buildingsState.animales = []; buildingsState.parcelas = []; buildingsState.secuencia = 10000;
  buildingsState.edificios = Array.from({ length: 1500 }, (_, i) => ({ id: `suelo_prueba_${i}`, articulo: 'suelo_piedra', x: -50 + i % 100, z: -40 + Math.floor(i / 100), giro: 0, clima: 'templado', pasto: 0, ultimoPastoAt: start }));
  inventory(buildingsState,{ creacion_suelo_piedra: 1, madera: 20, piedra: 12 });
  assert.equal(validarEstado(buildingsState), null);
  const buildings = new MotorGranja({ ahora: () => start, estado: buildingsState });
  const previous = clone(buildings.estado);
  fail(buildings, { tipo: 'construir', articulo: 'suelo_piedra', x: 0, z: 0 });
  fail(buildings, { tipo: 'reparar', x: 1, z: 1 });
  assert.deepEqual(buildings.estado, previous);
  assert.equal(new MotorGranja({ ahora: () => start }).cargarJSON(buildings.exportar()).ok, true);
});
console.log(JSON.stringify({ ok: failures === 0, suite: 'progresion-integracion', checks, failures, legalOpeningQuests: basicState?.misionesCompletadas.length ?? 0, lineageQuestsTested: finalState?.tokensCasa.length ?? 0, advancedFixture: 'capital y terreno de prueba; desbloqueos y nacimientos ejecutados por acciones reales' }));
if (failures) process.exitCode = 1;
