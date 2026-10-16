// «Desaparecidos de Astra»: la mesa de los perdidos de Vigilia. Ulises recibe teléfonos encontrados en Astra y tú
// los revisas para saber qué le pasó a su dueño y dónde está. Doce casos con investigación y apuntes manuales. Se juega en horizontal con el teléfono grande a la izquierda y la libreta del detective a la derecha.
// Documento: docs/sistemas/celular.md.
import './celular.css';
import { alAtras, volverALaSala } from '../sueltos/comun';
import { arrancarMusica, cargarAudio, efecto, pararVoz, ponerMusica, segundosVoz, sonarVoz } from './audio';
import { CASOS } from './casos';
import { ICONO } from './iconos';
import { confirmarGuardado, de, desbloqueado, estrellasDe, guardar as guardarProgreso, guardadoPendiente, progreso, reiniciar, type ProgresoCaso } from './progreso';
import { Telefono, foto } from './telefono';
import type { Caso } from './tipos';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

const app = el('div', 'cel-juego');
document.body.append(app);
const avisoGuardar = el('div', 'cel-guardado', '<p role="status">No se pudo guardar. Mantén esta partida abierta y reintenta antes de continuar.</p><button class="cel-boton" data-reintentar-guardado>Reintentar guardado</button>');
avisoGuardar.hidden = true;
document.body.append(avisoGuardar);
avisoGuardar.querySelector('button')!.onclick = () => guardar();

function pintarGuardado() { avisoGuardar.hidden = !guardadoPendiente; }
function guardar() { const ok = guardarProgreso(); pintarGuardado(); return ok; }
function asegurarGuardado() { const ok = confirmarGuardado(); pintarGuardado(); return ok; }

let tel: Telefono | null = null;
let casoActual: Caso | null = null;
/** Lo que cierra el botón atrás antes de salir (capas abiertas). */
let capas: (() => void)[] = [];

// ------------------------------------------------------------------ la mesa (los expedientes)

function mesa() {
  if (!asegurarGuardado()) return;
  tel?.destruir();
  tel = null;
  casoActual = null;
  capas = [];
  const s = el('div', 'cel-mesa');
  const cab = el('header', 'cel-mesa-cab');
  const volver = el('button', 'cel-boton redondo', ICONO.salir);
  volver.title = 'Volver';
  volver.onclick = () => { if (asegurarGuardado()) volverALaSala(); };
  const titulo = el('div', 'cel-titulo', '<b>Desaparecidos de Astra</b><span>La mesa de los perdidos · Vigilia de Ceniza</span>');
  const resueltos = CASOS.filter((c) => progreso.casos[c.id]?.resuelto).length;
  const estrellas = CASOS.reduce((a, c) => a + (progreso.casos[c.id]?.estrellas ?? 0), 0);
  const marcador = el('div', 'cel-marcador', `<span>${resueltos}/${CASOS.length} casos</span><span>${ICONO.estrella}${estrellas}/${CASOS.length * 3}</span>`);
  const musica = el('button', 'cel-boton redondo', progreso.musica ? ICONO.musica : ICONO.sinMusica);
  musica.title = 'Música';
  musica.onclick = () => { progreso.musica = !progreso.musica; guardar(); ponerMusica(progreso.musica); musica.innerHTML = progreso.musica ? ICONO.musica : ICONO.sinMusica; };
  cab.append(volver, titulo, marcador, musica);
  const tablero = el('div', 'cel-tablero');
  CASOS.forEach((c, i) => {
    const p = progreso.casos[c.id];
    const libre = desbloqueado(CASOS, i);
    const b = el('button', `cel-carpeta ${libre ? '' : 'bloqueada'} ${p?.resuelto ? 'resuelta' : ''}`);
    b.dataset.caso = c.id;
    b.style.setProperty('--giro', `${((i * 37) % 7) - 3}deg`);
    b.innerHTML = `
      <span class="cel-carpeta-pestana">Caso ${c.n}</span>
      <span class="cel-polaroid" style="background-image:url(${foto(c.persona.foto)})"></span>
      <b>${esc(c.titulo)}</b>
      <small>${esc(c.lugar)}</small>
      ${p?.resuelto ? `<span class="cel-sello">Resuelto</span><span class="cel-estrellas">${[1, 2, 3].map((k) => `<i class="${k <= p.estrellas ? 'si' : ''}">${ICONO.estrella}</i>`).join('')}</span>` : ''}
      ${!libre ? `<span class="cel-carpeta-candado">${ICONO.candado}<small>Resuelve el caso ${c.n - 1}</small></span>` : p?.recibido && !p.resuelto ? '<span class="cel-sello abierto">En curso</span>' : ''}`;
    b.onclick = () => {
      if (!libre) { efecto('duda', 0.4); b.classList.remove('temblor'); void b.offsetWidth; b.classList.add('temblor'); return; }
      efecto('pop', 0.3);
      expediente(c);
    };
    tablero.append(b);
  });
  s.append(cab, tablero);
  app.replaceChildren(s);
}

// ------------------------------------------------------------------ el expediente de Ulises

function expediente(c: Caso) {
  const p = de(c);
  const capa = el('div', 'cel-capa');
  const hoja = el('div', 'cel-expediente');
  hoja.innerHTML = `
    <div class="cel-exp-foto"><span style="background-image:url(${foto(c.persona.foto)})"></span><i class="clip"></i></div>
    <div class="cel-exp-texto">
      <small>Expediente ${c.n} · ${esc(c.lugar)} · ${esc(c.mundo)}</small>
      <h2>${esc(c.titulo)}</h2>
      <div class="cel-exp-ficha"><b>${esc(c.persona.nombre)}</b> · ${esc(c.persona.edad)} · ${esc(c.persona.oficio)}</div>
      ${c.expediente.map((t) => `<p>${esc(t)}</p>`).join('')}
      <div class="cel-exp-hallazgo">${ICONO.pin}<span>Teléfono encontrado: ${esc(c.hallazgo)}</span></div>
      <div class="cel-exp-firma">— Ulises, cartógrafo de Vigilia</div>
    </div>`;
  const botones = el('div', 'cel-exp-botones');
  const ir = el('button', 'cel-boton grande', `${ICONO.lupa}<span>${p.recibido ? (p.resuelto ? 'Volver a revisar' : 'Seguir revisando') : 'Recibir el teléfono'}</span>`);
  ir.dataset.accion = 'recibir';
  ir.onclick = () => { capa.remove(); capas.pop(); p.recibido = true; guardar(); abrirCaso(c); };
  const cerrar = el('button', 'cel-boton', 'Volver a la mesa');
  cerrar.onclick = () => { capa.remove(); capas.pop(); };
  botones.append(cerrar);
  if (p.resuelto) {
    const otra = el('button', 'cel-boton', 'Empezar de cero');
    otra.onclick = () => { if (!reiniciar(c)) { pintarGuardado(); return; } capa.remove(); capas.pop(); mesa(); };
    botones.append(otra);
  }
  botones.append(ir);
  hoja.append(botones);
  capa.append(hoja);
  app.append(capa);
  capas.push(() => capa.remove());
}

// ------------------------------------------------------------------ el caso: teléfono + libreta

function abrirCaso(c: Caso) {
  casoActual = c;
  const p = de(c);
  capas = [];
  const s = el('div', 'cel-caso');
  const zonaTel = el('div', 'cel-zona-tel');
  tel = new Telefono(c, p, {
    abierto: (id) => { if (!p.abiertos.includes(id)) { p.abiertos.push(id); guardar(); } },
    guardar,
  });
  zonaTel.append(tel.raiz);
  const libreta = el('aside', 'cel-libreta');
  libreta.setAttribute('aria-label', 'Tus anotaciones');
  libreta.append(el('div', 'cel-libreta-cab', `${ICONO.libreta}<b>Mi libreta</b>`));
  const apuntes = el('textarea', 'cel-apuntes');
  apuntes.setAttribute('aria-label', 'Anotaciones del caso');
  apuntes.placeholder = 'Escribe aquí tus observaciones, fechas, dudas e hipótesis…';
  apuntes.maxLength = 30000;
  apuntes.value = p.apuntes;
  const estado = el('small', 'cel-apuntes-estado', 'Solo se guarda lo que tú escribas.');
  apuntes.oninput = () => { p.apuntes = apuntes.value; estado.textContent = guardar() ? 'Notas guardadas' : 'Notas pendientes de guardar'; };
  const acciones = el('div', 'cel-libreta-acciones');
  const exp = el('button', 'cel-boton', `${ICONO.carpeta}<span>Expediente</span>`);
  exp.onclick = () => expediente(c);
  const resolverBoton = el('button', 'cel-boton resolver', `${ICONO.lupa}<span>Presentar conclusiones</span>`);
  resolverBoton.dataset.accion = 'resolver';
  resolverBoton.onclick = () => resolver(c, p);
  acciones.append(exp, resolverBoton);
  libreta.append(apuntes, estado, acciones);
  const salir = el('button', 'cel-boton redondo chico', ICONO.salir);
  salir.title = 'Volver a la mesa';
  salir.onclick = () => mesa();
  const alternar = el('button', 'cel-alternar-libreta', `${ICONO.libreta}<span>Libreta</span>`);
  alternar.setAttribute('aria-expanded', 'false');
  libreta.hidden = true;
  alternar.onclick = () => { libreta.hidden = !libreta.hidden; alternar.setAttribute('aria-expanded', String(!libreta.hidden)); };
  s.append(zonaTel, libreta, salir, alternar);
  app.replaceChildren(s);
}

// ------------------------------------------------------------------ resolver

function resolver(c: Caso, p: ProgresoCaso) {
  const capa = el('div', 'cel-capa');
  const caja = el('div', 'cel-resolver');
  capa.append(caja);
  app.append(capa);
  capas.push(() => capa.remove());
  const cerrar = () => { capa.remove(); capas.pop(); };
  let i = 0;
  const pregunta = () => {
    const q = c.preguntas[i];
    caja.innerHTML = `<small>Pregunta ${i + 1} de ${c.preguntas.length}</small><h3>${esc(q.texto)}</h3>`;
    const ops = el('div', 'cel-opciones');
    const aviso = el('div', 'cel-resolver-aviso');
    q.opciones.forEach((o, k) => {
      const b = el('button', 'cel-opcion', `<i>${'ABCD'[k]}</i><span>${esc(o)}</span>`);
      b.dataset.opcion = String(k);
      b.onclick = () => {
        if (ops.classList.contains('hecho')) return;
        if (k === q.correcta) {
          ops.classList.add('hecho');
          b.classList.add('bien');
          efecto('si', 0.4);
          aviso.textContent = 'Conclusión registrada.';
          aviso.className = 'cel-resolver-aviso bien';
          const sig = el('button', 'cel-boton grande', i + 1 < c.preguntas.length ? 'Siguiente' : 'Cerrar el caso');
          sig.dataset.accion = 'siguiente';
          sig.onclick = () => { i++; if (i < c.preguntas.length) pregunta(); else { cerrar(); cerrarCaso(c, p); } };
          caja.append(sig);
        } else {
          b.classList.add('mal');
          b.disabled = true;
          p.errores++;
          guardar();
          efecto('duda', 0.4);
          aviso.innerHTML = 'Esa conclusión no concuerda con el expediente.';
          aviso.className = 'cel-resolver-aviso mal';
        }
      };
      ops.append(b);
    });
    const x = el('button', 'cel-boton chico cel-resolver-cerrar', 'Volver al teléfono');
    x.onclick = cerrar;
    caja.append(ops, aviso, x);
  };
  pregunta();
}

function cerrarCaso(c: Caso, p: ProgresoCaso) {
  const estrellas = estrellasDe(c, p);
  p.resuelto = true;
  p.estrellas = Math.max(p.estrellas, estrellas);
  guardar();
  void escenaFinal(c, estrellas);
}

// ------------------------------------------------------------------ la escena del final

async function escenaFinal(c: Caso, estrellas: number) {
  tel?.destruir();
  const s = el('div', 'cel-final');
  const img = el('div', 'cel-final-img');
  const img2 = el('div', 'cel-final-img');
  const texto = el('div', 'cel-final-texto');
  const tit = el('div', 'cel-final-titulo', `<small>Caso ${c.n} · ${esc(c.lugar)}</small><b>${esc(c.final.titulo)}</b>`);
  const saltar = el('button', 'cel-final-saltar', 'Tocar para seguir ›');
  s.append(img, img2, el('div', 'cel-final-franja arriba'), el('div', 'cel-final-franja abajo'), texto, tit, saltar);
  app.append(s);
  capas.push(() => undefined);
  efecto('musiquita', 0.3);
  await new Promise((r) => setTimeout(r, 2300));
  tit.classList.add('fuera');
  let siguiente: () => void = () => undefined;
  s.onclick = () => siguiente();
  let capaA = img, capaB = img2;
  for (const pan of c.final.paneles) {
    capaB.style.backgroundImage = `url(${foto(pan.foto)})`;
    capaB.className = `cel-final-img visible mov-${pan.mov ?? 'acerca'}`;
    capaA.classList.remove('visible');
    [capaA, capaB] = [capaB, capaA];
    texto.classList.remove('visible');
    await new Promise((r) => setTimeout(r, 450));
    texto.textContent = pan.texto;
    texto.classList.add('visible');
    const voz = pan.voz;
    const dur = Math.max(5200, pan.texto.length * 55, voz ? segundosVoz(voz) * 1000 + 1800 : 0);
    await new Promise<void>((r) => {
      let listo = false;
      const fin = () => { if (!listo) { listo = true; pararVoz(); r(); } };
      siguiente = fin;
      if (voz) setTimeout(() => { if (!listo) sonarVoz(voz); }, 700);
      setTimeout(fin, dur);
    });
  }
  texto.classList.remove('visible');
  // El cierre: caso cerrado, estrellas y volver
  const cierre = el('div', 'cel-final-cierre');
  cierre.innerHTML = `<div class="cel-sello grande">Caso cerrado</div><div class="cel-estrellas grande">${[1, 2, 3].map((k) => `<i class="${k <= estrellas ? 'si' : ''}">${ICONO.estrella}</i>`).join('')}</div><p>${esc(c.final.cierre)}</p>`;
  const sig = CASOS[c.n];
  const volver = el('button', 'cel-boton grande', sig ? `Siguiente caso: ${esc(sig.titulo)}` : 'Volver a la mesa');
  volver.dataset.accion = 'volver-mesa';
  volver.onclick = (e) => { e.stopPropagation(); mesa(); };
  cierre.append(volver);
  s.onclick = null;
  saltar.remove();
  s.append(cierre);
  efecto('fanfarria', 0.35);
}

// ------------------------------------------------------------------ arranque

alAtras(() => {
  if (tel?.atras()) return true;
  const f = capas.pop();
  if (f) { f(); return true; }
  if (casoActual) { mesa(); return true; }
  return !asegurarGuardado();
});

document.addEventListener('pointerdown', () => arrancarMusica(), { once: true });
document.querySelector('.suelto-carga')?.remove();
void cargarAudio().then(() => ponerMusica(progreso.musica));
mesa();

// Ganchos de prueba (scripts/_celular_*.mjs)
(window as unknown as { __celular: unknown }).__celular = {
  casos: CASOS,
  progreso,
  mesa,
  abrir: (id: string) => { const c = CASOS.find((x) => x.id === id); if (c) { de(c).recibido = true; abrirCaso(c); } },
  tel: () => tel,
  desbloquearTodo: () => { for (const c of CASOS) { const p = de(c); p.resuelto = true; p.estrellas = Math.max(1, p.estrellas); } guardar(); mesa(); },
  final: (id: string) => { const c = CASOS.find((x) => x.id === id); if (c) void escenaFinal(c, 3); },
  borrar: () => { for (const k of Object.keys(progreso.casos)) delete progreso.casos[k]; guardar(); mesa(); },
};
