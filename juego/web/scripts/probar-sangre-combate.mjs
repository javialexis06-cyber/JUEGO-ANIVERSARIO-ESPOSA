// Control de la horda y pagos de vida en la simulación que usa el anfitrión.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const carpeta = await mkdtemp(join(tmpdir(), 'sangre-combate-'));
try {
  const archivo = join(carpeta, 'motor.mjs');
  await build({ stdin: { contents: `export * from './src/sangre/sim/estado';
    export {Expedicion} from './src/sangre/expedicion';
    export {aparecerEnemigo,moverEnemigos} from './src/sangre/sim/enemigos_ia';
    export {TIPO} from './src/sangre/sim/catalogo';
    export {costoAstral,DURACION_ASTRAL} from './src/sangre/datos/mundo';
    export {costoSigilo} from './src/sangre/datos/sigilos';
    export {CLASES} from './src/sangre/datos/clases';`, resolveDir: resolve(import.meta.dirname, '..') },
    bundle: true, platform: 'node', format: 'esm', outfile: archivo, logLevel: 'silent' });
  const { Enemigos, Expedicion, aparecerEnemigo, moverEnemigos, TIPO, costoAstral, costoSigilo, DURACION_ASTRAL, CLASES } = await import(pathToFileURL(archivo));
  const probar = (nombre, fn) => { fn(); console.log(`✓ ${nombre}`); };
  const escena = (sigilos = ['cartografo', 'brujula']) => {
    const exp = new Expedicion({ bioma: 'cementerio', peligro: 1, mutadores: [], semilla: 8919 }, [{
      id: 'piloto', nombre: 'Piloto', puesto: 0, clase: 'campesino', spec: 0, meta: {}, equipo: {},
      arsenal: CLASES.campesino.arsenal, comunes: [], tiradas: 0, vetos: 0, cuerpo: 'el', tipo: 'amigo', sigilos,
    }]);
    return exp.iniciarEtapa();
  };

  probar('Golpes continuos abren un segundo de resistencia y permiten otra racha después', () => {
    for (const dt of [1 / 30, 1 / 60, 0.1]) {
      const E = new Enemigos(1), i = E.nuevo(); let racha = 0, max = 0, libre = 0, ventanas = 0;
      for (let k = 0; k < Math.round(10 / dt); k++) {
        E.aturdir(i, 3); E.pasoAturdimiento(i, dt);
        if (E.aturdido[i] > 0) { racha += dt; max = Math.max(max, racha); }
        else racha = 0;
        if (E.resistenciaAturdimiento[i] > 0) {
          libre += dt; E.aturdir(i, 100); assert.equal(E.aturdido[i], 0);
        } else if (libre) { assert.ok(libre >= 1 - 1e-5, `${dt}: ${libre}`); ventanas++; libre = 0; }
      }
      assert.ok(max <= 1.5 + 1e-5); assert.ok(ventanas >= 3);
    }
  });
  probar('Un aturdimiento corto termina normalmente; morir y reutilizar el cupo limpia la resistencia', () => {
    const E = new Enemigos(1), i = E.nuevo(); E.aturdir(i, 0.2); E.pasoAturdimiento(i, 0.25);
    assert.equal(E.aturdido[i], 0); assert.equal(E.resistenciaAturdimiento[i], 0);
    E.aturdir(i, 2); E.pasoAturdimiento(i, 1.5); assert.equal(E.resistenciaAturdimiento[i], 1);
    const uid = E.uid[i]; E.quitar(i); assert.equal(E.nuevo(), i); assert.notEqual(E.uid[i], uid);
    assert.equal(E.resistenciaAturdimiento[i], 0); assert.equal(E.aturdidoContinuo[i], 0);
    E.aturdir(i, 0.8); assert.ok(E.aturdido[i] > 0);
  });
  probar('La IA vuelve a atacar durante la resistencia aunque reciba un golpe que aturde cada cuadro', () => {
    const sim = escena(), j = sim.J[0], E = sim.E;
    for (let i = 0; i < E.max; i++) E.quitar(i);
    const i = aparecerEnemigo(sim, TIPO.zombi, j.x + 0.3, j.y, { vida: 1000 });
    E.atqT[i] = 0; j.invul = 0; const antes = j.hp;
    const g = { j: -1, arma: -1, etq: 0, dx: 0, dy: 0, empuje: 0, critico: 0, quema: 0, veneno: 0, sangrado: 0, lento: 0, aturde: 1 };
    for (let k = 0; k < 45; k++) { sim.danar(i, 1, g); moverEnemigos(sim, 1 / 30); }
    assert.ok(E.resistenciaAturdimiento[i] > 0); assert.ok(j.hp < antes, 'El enemigo cercano debe recuperar su ataque');
    const dano = E.hp[i]; sim.danar(i, 1, g); assert.equal(E.hp[i], dano - 1); assert.equal(E.aturdido[i], 0);
    const jefe = aparecerEnemigo(sim, TIPO.golem_osarios, j.x + 3, j.y);
    sim.danar(jefe, 1, g); assert.equal(E.aturdido[jefe], 0, 'Los jefes conservan su inmunidad');
  });
  probar('Astral cobra el 10 % de vida máxima en cualquier etapa, y Sangre fría cobra el 5 %', () => {
    for (const etapa of [1, 5, 25]) for (const fria of [false, true]) {
      const sim = escena(fria ? ['sangre_fria'] : []), j = sim.J[0]; sim.cfg.etapa = etapa;
      j.hpMax = 200; j.hp = 100; sim.usarAstral(j);
      assert.equal(j.hp, fria ? 90 : 80); assert.equal(j.astralT, DURACION_ASTRAL + (fria ? 1 : 0));
      sim.usarAstral(j); assert.equal(j.hp, fria ? 90 : 80, 'Un pulso en curso no se cobra dos veces');
    }
    assert.equal(costoAstral(101), 11); assert.equal(costoAstral(101, true), 6);
  });
  probar('Los sigilos cobran sobre vida máxima, rechazan vida insuficiente y mantienen sus recargas', () => {
    for (const [id, costo, recarga] of [['brujula', 140, 15], ['iman_tumba', 30, 60]]) {
      const sim = escena([id]), j = sim.J[0]; j.hpMax = 200; j.hp = 180;
      assert.equal(costoSigilo(j.hpMax, id), costo); sim.usarSigilo(j, 0);
      assert.equal(j.hp, 180 - costo); assert.equal(j.sigiloT[0], recarga);
      sim.usarSigilo(j, 0); assert.equal(j.hp, 180 - costo);
      j.sigiloT[0] = 0; j.hp = costo; sim.usarSigilo(j, 0);
      assert.equal(j.hp, costo); assert.equal(j.sigiloT[0], 0);
      j.hp = costo + 1; sim.usarSigilo(j, 0); assert.equal(j.hp, 1);
    }
    const sim = escena(), j = sim.J[0]; j.hpMax = 200; j.hp = 21; sim.usarAstral(j);
    assert.equal(j.hp, 21); assert.equal(j.astralT, 0);
    assert.equal(costoSigilo(200, 'paso_sombra'), 0);
  });
  console.log('5 pruebas de combate y costes de Sangre y Ceniza aprobadas');
} finally { await rm(carpeta, { recursive: true, force: true }); }
