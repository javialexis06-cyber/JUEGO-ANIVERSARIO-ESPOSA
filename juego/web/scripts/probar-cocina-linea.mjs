// Prueba de la cocina de chef juntos, en una sala (src/casa/cocina/sala.ts): Javier abre la sala, Laura entra con el
// código (dos «celulares», dos contextos del navegador) por un Supabase de mentiras con demoras y mensajes perdidos.
// En la sala de espera Laura toca «Estoy listo» y Javier arranca; ven el mismo día, Laura toma un pedido y lo entrega,
// los dos ven la misma calificación, la pausa llega al otro, salir de la app pausa a los dos, un corte de red pone la
// pausa de conexión y al volver sigue, al final los dos terminan el mismo día con las mismas propinas y cada uno guarda
// lo suyo; «A la sala» los devuelve a la sala de espera y si Javier se va, Laura queda con el aviso.
// Uso (con el servidor de desarrollo prendido): node scripts/probar-cocina-linea.mjs [receta] [url] [carpeta]
// Variables: PERDER (fracción de mensajes que se pierden, 0.08 por defecto).
// Nunca toca el Supabase de verdad: el cliente de mentiras entra por globalThis.__crearSupabase.
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { SupabaseFalso } from './supabase-falso.mjs';

const receta = process.argv[2] ?? 'wafles';
const url = process.argv[3] ?? 'http://127.0.0.1:5173/scripts/cocina-prueba.html';
const carpeta = process.argv[4] ?? 'test-results/cocina-linea';
mkdirSync(carpeta, { recursive: true });
const red = new SupabaseFalso({ perder: Number(process.env.PERDER ?? 0.08), demora: 200 });
const errores = [];

const PRE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  executablePath: existsSync(PRE) ? PRE : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
async function celular(rol, sala) {
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.rol = rol;
  p.on('pageerror', (e) => errores.push(`${rol}: ${e}`));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|403/.test(m.text()) && errores.push(`${rol}: ${m.text()}`));
  await red.conectar(p, rol);
  await p.goto(`${url}?rol=${rol}&receta=${receta}&xp=900&dia=4&sala=${sala}`, { timeout: 180000 });
  return p;
}
const revisar = (ok, texto) => {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${texto}`);
  if (!ok) errores.push(texto);
};
const resumen = (p) => p.evaluate(() => window.__cocinaMotor.resumen());
const esperar = (p, fn, arg, ms = 30000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 200 }).then(() => true, () => false);
const foto = (p, n) => p.screenshot({ path: `${carpeta}/${receta}-${p.rol}-${n}.png` }).catch(() => {});

// 0) Javier abre la sala; Laura entra con el código y toca «Estoy listo»; Javier arranca
const el = await celular('el', 'crear');
revisar(await esperar(el, () => !!window.__codigo, null, 120000), 'Javier abre la sala y tiene código');
const codigo = await el.evaluate(() => window.__codigo);
const ella = await celular('ella', codigo);
revisar(await esperar(ella, () => document.querySelectorAll('.sala-espera .se-puesto:not(.vacio)').length === 2, null, 120000), `Laura entra a la sala ${codigo}`);
await foto(ella, '0-sala');
await ella.click('.sala-espera [data-a="principal"]', { force: true });
revisar(await esperar(el, () => !document.querySelector('.sala-espera [data-a="principal"]')?.disabled, null, 30000), 'Javier ve a Laura lista');
await el.click('.sala-espera [data-a="principal"]', { force: true });

// 1) Se encuentran en la misma cocina
revisar(await esperar(el, () => window.__cocinaMotor?.resumen().juntos, null, 60000), 'Javier ve que Laura está en su cocina');
revisar(await esperar(ella, () => window.__cocinaMotor?.resumen().juntos, null, 60000), 'Laura está en la cocina de Javier');
revisar(await el.evaluate(() => !!window.__cocinaMotor.pareja && !window.__cocinaMotor.neutro), 'Sin amigos no es modo neutro (la pareja puede llegar a comer)');
await Promise.all([el, ella].map((p) => p.evaluate(() => window.__cocinaMotor.probar('intro'))));
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().dia === 4 && window.__cocinaMotor.resumen().n > 0), 'Laura recibe el día 4 del restaurante de Javier');
await foto(ella, '1-dia');

// 2) Laura le da «¡A cocinar!» (se lo pide al anfitrión) y los dos arrancan
await ella.evaluate(() => window.__cocinaMotor.probar('jugar'));
revisar(await esperar(el, () => window.__cocinaMotor.resumen().fase === 'jugando'), 'El «¡A cocinar!» de Laura arranca el día en el celular de Javier');
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().fase === 'jugando'), 'Laura también ve el día andando');
await el.evaluate(() => window.__cocinaMotor.probar('llegar', 0));
await esperar(el, () => window.__cocinaMotor.resumen().invitados.some((e) => e === 'fila'), null, 20000);
await el.waitForTimeout(3500);

// 3) Laura toma un pedido: el tiquete lo cuelga el anfitrión y les sale a los dos
await ella.evaluate(() => window.__cocinaMotor.probar('tomar'));
// (el invitado se demora dictando: de 3 a 9 s de juego según lo que pide y quién es; sin pantalla va más lento)
revisar(await esperar(el, () => window.__cocinaMotor.resumen().tickets.length >= 1, null, 120000), 'El pedido que tomó Laura queda colgado donde Javier');
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().tickets.length >= 1), 'Laura ve el tiquete en su riel');
await el.waitForTimeout(1500);
await foto(ella, '2-tiquete');

// 4) Laura entrega el plato: Javier lo califica y los dos ven la calificación y la propina
await ella.evaluate(() => {
  const m = window.__cocinaMotor;
  m.entregar(m.s.tickets[0]);
});
revisar(await esperar(el, () => window.__cocinaMotor.resumen().puntajes.length === 1), 'La entrega de Laura llega y Javier la califica');
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().puntajes.length === 1), 'Laura ve su calificación');
await ella.waitForTimeout(1200);
await foto(el, '3-juicio');
await el.evaluate(() => window.__cocinaMotor.probar('juicio'));
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().fase === 'jugando'), 'Se cierra la calificación en los dos');

// 5) Pausa: Laura pone pausa y a Javier le sale; Javier le da seguir
await ella.evaluate(() => window.__cocinaMotor.pausar('mano'));
revisar(await esperar(el, () => window.__cocinaMotor.resumen().fase === 'pausa'), 'La pausa de Laura le llega a Javier');
revisar(/Laura puso pausa/.test(await el.evaluate(() => document.querySelector('.cocina-capa')?.innerText ?? '')), 'Javier ve quién puso la pausa');
await foto(el, '4-pausa');
await el.click('[data-c="seguir"]');
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().fase === 'jugando'), 'El «seguir» de Javier quita la pausa en los dos');

// 6) Laura se va a otra app: se pausa sola y a Javier le sale que salió un momentico
await ella.evaluate(() => document.dispatchEvent(new Event('freeze')));
revisar(await esperar(el, () => window.__cocinaMotor.s.fase === 'pausa' && window.__cocinaMotor.s.pausa?.motivo === 'fondo', null, 20000), 'Salir de la app pausa la cocina de los dos');
await foto(el, '5-fondo');
await ella.evaluate(() => document.dispatchEvent(new Event('resume')));
await ella.waitForTimeout(1500);
await ella.click('[data-c="seguir"]').catch(() => {});
revisar(await esperar(el, () => window.__cocinaMotor.resumen().fase === 'jugando', null, 20000), 'Al volver, Laura le da seguir y siguen cocinando');

// 7) Se le corta la red a Laura: pausa de conexión; al volver, siguen solos
red.cortar(ella, true);
revisar(await esperar(el, () => window.__cocinaMotor.s.pausa?.por === 'red', null, 20000), 'Con la red cortada, a Javier le sale la pausa de conexión');
await foto(el, '6-corte');
red.cortar(ella, false);
revisar(await esperar(el, () => window.__cocinaMotor.resumen().fase === 'jugando', null, 20000), 'Al volver la red, la cocina sigue sola');
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().fase === 'jugando', null, 20000), 'Laura también sigue');

// 8) Fin del día: los dos con el mismo día, las mismas propinas y los mismos puntajes
await el.evaluate(() => window.__cocinaMotor.probar('fin'));
revisar(await esperar(ella, () => window.__cocinaMotor.resumen().fase === 'fin', null, 20000), 'Laura ve el fin del día');
await ella.waitForTimeout(1500);
const [a, b] = await Promise.all([resumen(el), resumen(ella)]);
revisar(a.dia === b.dia && a.propinas === b.propinas && JSON.stringify(a.puntajes) === JSON.stringify(b.puntajes),
  `Mismo día, propinas y puntajes en los dos (Javier ${a.dia}/${a.propinas}/${a.puntajes}, Laura ${b.dia}/${b.propinas}/${b.puntajes})`);
const guardEl = await el.evaluate(() => window.__guardados.filter((g) => g.dia).map((g) => g.dia.monedas));
const guardElla = await ella.evaluate(() => window.__guardados.filter((g) => g.dia).map((g) => g.dia.monedas));
revisar(guardEl.length >= 1 && guardElla.length >= 1, `Cada uno guarda su propio progreso (Javier ${guardEl.length}, Laura ${guardElla.length})`);
revisar(guardEl[0] > 0 && guardElla[0] === 0, `El premio de la casa es del anfitrión (Javier +${guardEl[0]}, Laura +${guardElla[0]})`);
await foto(el, '7-fin');
await foto(ella, '7-fin');
const st = await Promise.all([el, ella].map((p) => p.evaluate(() => window.__cocinaMotor.resumen().stats)));
console.log('Mensajes', JSON.stringify(st));

// 9) «A la sala»: los dos vuelven a la sala de espera; Javier se va y a Laura le sale el aviso
await el.click('[data-c="sala"]');
revisar(await esperar(el, () => !!document.querySelector('.sala-espera.visible') && !document.querySelector('.cocina.visible:not(.cocina-carga)'), null, 20000), 'Javier vuelve a la sala de espera');
revisar(await esperar(ella, () => !!document.querySelector('.sala-espera.visible'), null, 20000), 'Laura vuelve con él a la sala de espera');
await foto(ella, '8-sala');
await el.click('.sala-espera [data-a="salir"]');
revisar(await esperar(ella, () => /cerró|se fue|acab/i.test(document.querySelector('.cocina-aviso')?.innerText ?? ''), null, 30000), 'Javier se va y a Laura le sale el aviso');
revisar(await esperar(el, () => window.__cocinaCerrada, null, 10000), 'La cocina de Javier se cierra del todo');

await navegador.close();
if (errores.length) {
  console.log(`\n${errores.length} problema(s):\n${errores.slice(0, 20).join('\n')}`);
  process.exit(1);
}
console.log('\nTodo bien: la cocina juntos quedó sincronizada.');
