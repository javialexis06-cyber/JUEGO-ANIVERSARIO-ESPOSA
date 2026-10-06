// Prueba de «¿Quién fue?» (el Clue de la mesa):
//  1. Reglas e IA: la máquina contra la máquina cientos de partidas en todos los niveles (todo legal, nadie se queda
//     pegado, las acusaciones de la máquina son correctas y la difícil le gana a la fácil).
//  2. La vista: una partida completa contra la máquina tocando la pantalla como una persona (repartir, tirar,
//     escoger cuarto, mirar la carta boca abajo, sospechar, mostrar cartas, el cuaderno y acusar), sin errores.
// Uso: node scripts/probar-clue.mjs [url] [carpeta]    (url por defecto http://localhost:5173)
import { build } from 'esbuild';
import { existsSync, mkdirSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:5173';
const carpeta = process.argv[3] ?? join(tmpdir(), 'probar-clue');
mkdirSync(carpeta, { recursive: true });
const fallas = [];
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) fallas.push(texto);
};

// ---------------------------------------------------------------------------
// 1. Reglas e IA (se empaqueta el TypeScript del juego con esbuild)
const salida = join(mkdtempSync(join(tmpdir(), 'clue-')), 'sim.mjs');
await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: 'ts',
    contents: `
      import { ia } from './src/mesa/clue/ia';
      import { legal, reglas } from './src/mesa/clue/reglas';
      import { revisarTablero } from './src/mesa/clue/tablero';
      export function simular(ne, nella, N, semilla0) {
        let semilla = semilla0;
        const azar = () => ((semilla = (semilla * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
        const r = { ganaEl: 0, malas: 0, turnos: 0, ilegales: 0, colgadas: 0, N };
        for (let k = 0; k < N; k++) {
          let e = reglas.inicial(k % 2 ? 'el' : 'ella');
          let pasos = 0;
          while (!reglas.fin(e) && pasos < 4000) {
            const t = reglas.turno(e);
            const m = ia(e, t === 'el' ? ne : nella, azar);
            if (!legal(e, m)) { r.ilegales++; break; }
            e = reglas.aplicar(e, m);
            pasos++;
          }
          const f = reglas.fin(e);
          if (!f) { r.colgadas++; continue; }
          if (f.ganador === 'el') r.ganaEl++;
          if (e.acusacion && !e.acusacion.acerto) r.malas++;
          r.turnos += e.turnos;
        }
        return r;
      }
      export const tablero = revisarTablero();
    `,
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: salida,
  logLevel: 'error',
});
const sim = await import(pathToFileURL(salida).href);
revisar(sim.tablero.length === 0, `El tablero está bien armado (puertas pegadas a su cuarto y a un pasillo)${sim.tablero.length ? `: ${sim.tablero.join('; ')}` : ''}`);
for (const [ne, nella, N] of [['normal', 'normal', 200], ['dificil', 'facil', 150], ['facil', 'facil', 100], ['dificil', 'dificil', 100]]) {
  const r = sim.simular(ne, nella, N, 7);
  revisar(r.ilegales === 0 && r.colgadas === 0, `${ne} contra ${nella}: ${N} partidas, ninguna jugada ilegal ni partida pegada (turnos promedio ${(r.turnos / N).toFixed(1)})`);
  revisar(r.malas === 0, `${ne} contra ${nella}: la máquina solo acusa cuando está segura`);
  if (ne === 'dificil' && nella === 'facil') revisar(r.ganaEl / N > 0.8, `La difícil le gana a la fácil (${r.ganaEl} de ${N})`);
}

// ---------------------------------------------------------------------------
// 2. La vista: una persona contra la máquina
const chrome = existsSync('/opt/pw-browsers')
  ? readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`).find((f) => existsSync(f))
  : undefined;
const navegador = await chromium.launch({ executablePath: chrome, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errores = [];

async function partida(semilla, nivel, acusarYo) {
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(`${semilla}: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|WebGL|GPU/.test(m.text()) && errores.push(`${semilla}: ${m.text()}`));
  await p.goto(`${url}/mesa.html?juego=clue&modo=ia&nivel=${nivel}&rol=el&empieza=el&semilla=${semilla}&rapido=4&sin3d`);
  const vistas = new Set();
  const t0 = Date.now();
  let acuse = false;
  let ultimo = '';
  let quieto = Date.now();
  while (Date.now() - t0 < 12 * 60_000) {
    if (await p.evaluate(() => !document.getElementById('final').hidden)) break;
    // Lo que hay en pantalla y lo que se puede hacer
    const ahora = await p.evaluate(() => {
      const h = document.querySelector('.clue-capa:not([hidden]) .clue-hoja');
      const b = document.querySelector('.clue-accion');
      const e = window.__mesa?.partida?.e;
      return { hoja: h ? h.className.replace(/.*clue-hoja-/, '') : '', accion: b && !b.disabled ? b.textContent : '', fase: e?.fase, turnos: e?.turnos };
    });
    vistas.add(ahora.hoja || ahora.accion);
    const clave = JSON.stringify(ahora);
    if (clave !== ultimo) {
      ultimo = clave;
      quieto = Date.now();
    } else if (Date.now() - quieto > 90_000) {
      await p.screenshot({ path: `${carpeta}/pegada-${semilla}.png` });
      revisar(false, `Partida ${semilla}: se quedó quieta en ${clave}`);
      break;
    }
    if (ahora.hoja === 'cartas' || ahora.hoja === 'revela') {
      if (ahora.hoja === 'revela' && !vistas.has('foto-revela')) {
        vistas.add('foto-revela');
        await p.screenshot({ path: `${carpeta}/${semilla}-revela.png` });
      }
      await p.evaluate(() => document.querySelector('.clue-hoja [data-ok]')?.click());
    } else if (ahora.hoja === 'sospecha') {
      if (!vistas.has('foto-sospecha')) {
        vistas.add('foto-sospecha');
        await p.screenshot({ path: `${carpeta}/${semilla}-sospecha.png` });
      }
      // Sospecha de lo que todavía no sabe
      await p.evaluate(() => {
        const una = (sel) => { const l = [...document.querySelectorAll(sel)]; return l[Math.floor(Math.random() * l.length)]; };
        (una('[data-fila="s"] .clue-carta:not(.clue-sabida)') ?? una('[data-fila="s"] .clue-carta')).click();
        (una('[data-fila="a"] .clue-carta:not(.clue-sabida)') ?? una('[data-fila="a"] .clue-carta')).click();
        document.querySelector('.clue-hoja-sospecha [data-ok]').click();
      });
    } else if (ahora.hoja === 'mostrar') {
      if (!vistas.has('foto-mostrar')) {
        vistas.add('foto-mostrar');
        await p.screenshot({ path: `${carpeta}/${semilla}-mostrar.png` });
      }
      await p.evaluate(() => (document.querySelector('.clue-hoja-mostrar button.clue-carta') ?? document.querySelector('.clue-hoja-mostrar [data-ok]')).click());
    } else if (ahora.hoja === 'sobre') {
      if (!vistas.has('foto-sobre')) {
        vistas.add('foto-sobre');
        await p.waitForTimeout(900);
        await p.screenshot({ path: `${carpeta}/${semilla}-sobre.png` });
      }
    } else if (ahora.accion) {
      // ¿Ya sabe todo? Acusa por la pantalla (con la confirmación)
      const quedan = await p.evaluate(() => {
        const e = window.__mesa.partida.e;
        const sabe = new Set([...e.manos.el, ...e.miradas.el.map((c) => e.bocaAbajo[c]), ...e.sospechas.filter((q) => q.quien === 'el' && q.carta).map((q) => q.carta)]);
        return 21 - sabe.size;
      });
      const puede = await p.evaluate(() => !document.querySelector('[data-b="acusar"]').disabled);
      if (acusarYo && puede && quedan <= 3 && !acuse) {
        acuse = true;
        await p.evaluate(() => document.querySelector('[data-b="acusar"]').click());
        await p.waitForTimeout(400);
        await p.evaluate(() => ['s', 'a', 'c'].forEach((f) => document.querySelector(`[data-fila="${f}"] .clue-carta:not(.clue-sabida)`).click()));
        await p.screenshot({ path: `${carpeta}/${semilla}-acusar.png` });
        await p.evaluate(() => document.querySelector('.clue-hoja-acusar [data-ok]').click());
        await p.waitForTimeout(300);
        await p.evaluate(() => document.querySelector('.clue-hoja-acusar [data-ok]').click());
        continue;
      }
      if (ahora.accion === 'Tirar') await p.evaluate(() => document.querySelector('.clue-accion').click());
      else if (ahora.accion === 'Sospechar') await p.evaluate(() => document.querySelector('.clue-accion').click());
      else if (ahora.accion === 'Terminar turno' || ahora.accion === 'Mostrar carta') await p.evaluate(() => document.querySelector('.clue-accion').click());
      else if (ahora.accion === 'Ir aquí') await p.evaluate(() => document.querySelector('.clue-accion').click());
    } else if (ahora.fase === 'mover') {
      // Escoge a dónde ir tocando el tablero: un cuarto si se puede (como haría alguien), si no una casilla
      const punto = await p.evaluate(() => {
        const l = [...document.querySelectorAll('.clue-meta')];
        const m = l.length ? l[Math.floor(Math.random() * l.length)] : [...document.querySelectorAll('.clue-paso')].sort(() => Math.random() - 0.5)[0];
        if (!m) return null;
        const b = m.getBoundingClientRect();
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      });
      if (punto) {
        if (!vistas.has('foto-mover')) {
          vistas.add('foto-mover');
          await p.screenshot({ path: `${carpeta}/${semilla}-mover.png` });
        }
        await p.touchscreen.tap(punto.x, punto.y);
      }
    }
    await p.waitForTimeout(250);
  }
  const fin = await p.evaluate(() => {
    const e = window.__mesa.partida.e;
    return { ganador: e.ganador, acusacion: e.acusacion, turnos: e.turnos, sospechas: e.sospechas.length, titulo: document.getElementById('final-titulo').textContent };
  });
  await p.screenshot({ path: `${carpeta}/${semilla}-final.png` });
  revisar(!!fin.ganador, `Partida ${semilla} (${nivel}): termina en ${fin.turnos} turnos con ${fin.sospechas} sospechas — «${fin.titulo}»`);
  if (acuse) revisar(fin.acusacion?.quien === 'el' && fin.acusacion.acerto && fin.ganador === 'el', `Partida ${semilla}: la persona acusa por la pantalla y acierta`);
  revisar(['cartas', 'sospecha'].every((v) => vistas.has(v)) && vistas.has('Tirar'), `Partida ${semilla}: salieron las cartas, los dados y la hoja de sospechar`);
  await ctx.close();
  return { acuse, vistas };
}

const a = await partida(5, 'facil', true);
const b = await partida(11, 'dificil', false);
revisar(a.vistas.has('mostrar') || b.vistas.has('mostrar'), 'La persona tuvo que mostrarle una carta a la máquina');
revisar(errores.length === 0, `Sin errores en la página${errores.length ? `:\n  ${errores.join('\n  ')}` : ''}`);
await navegador.close();
console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\nTodo bien');
process.exit(fallas.length ? 1 : 0);
