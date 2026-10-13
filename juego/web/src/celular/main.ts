// «Desaparecidos de Astra»: la mesa de los perdidos de Vigilia. Ulises recibe teléfonos encontrados en Astra y tú
// los revisas para saber qué le pasó a su dueño y dónde está. Ocho casos (src/celular/casos), el primero enseña a
// jugar. Se juega en horizontal con el teléfono grande a la izquierda y la libreta del detective a la derecha.
// Documento: docs/sistemas/celular.md.
import './celular.css';
import { alAtras, volverALaSala } from '../sueltos/comun';
import { arrancarMusica, cargarAudio, efecto, pararVoz, ponerMusica, segundosVoz, sonarVoz } from './audio';
import { CASOS } from './casos';
import { ICONO } from './iconos';
import { de, desbloqueado, estrellasDe, guardar, progreso, reiniciar, type ProgresoCaso } from './progreso';
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

let tel: Telefono | null = null;
let casoActual: Caso | null = null;
/** Lo que cierra el botón atrás antes de salir (capas abiertas). */
let capas: (() => void)[] = [];

// ------------------------------------------------------------------ la mesa (los ocho expedientes)

function mesa() {
  tel?.destruir();
  tel = null;
  casoActual = null;
  capas = [];
  const s = el('div', 'cel-mesa');
  const cab = el('header', 'cel-mesa-cab');
  const volver = el('button', 'cel-boton redondo', ICONO.salir);
  volver.title = 'Volver';
  volver.onclick = () => volverALaSala();
  const titulo = el('div', 'cel-titulo', '<b>Desaparecidos de Astra</b><span>La mesa de los perdidos · Vigilia de Ceniza</span>');
  const resueltos = CASOS.filter((c) => progreso.casos[c.id]?.resuelto).length;
  const estrellas = CASOS.reduce((a, c) => a + (progreso.casos[c.id]?.estrellas ?? 0), 0);
  const marcador = el('div', 'cel-marcador', `<span>${resueltos}/8 casos</span><span>${ICONO.estrella}${estrellas}/24</span>`);
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
    otra.onclick = () => { reiniciar(c); capa.remove(); capas.pop(); mesa(); };
    botones.append(otra);
  }
  botones.append(ir);
  hoja.append(botones);
  capa.append(hoja);
  app.append(capa);
  capas.push(() => capa.remove());
}

// ------------------------------------------------------------------ el caso: teléfono + libreta

let libretaLista: HTMLElement | null = null;
let libretaCuenta: HTMLElement | null = null;
let botonResolver: HTMLButtonElement | null = null;
let coach: HTMLElement | null = null;

function abrirCaso(c: Caso) {
  casoActual = c;
  const p = de(c);
  capas = [];
  const s = el('div', 'cel-caso');
  const zonaTel = el('div', 'cel-zona-tel');
  tel = new Telefono(c, p, {
    anotar: (id) => anotar(c, p, id),
    abierto: (id) => { if (!p.abiertos.includes(id)) { p.abiertos.push(id); guardar(); actualizarLibreta(c, p); } },
    evento: (n) => tutorial(c, p, n),
    guardar,
  });
  zonaTel.append(tel.raiz);
  const libreta = el('aside', 'cel-libreta');
  const cab = el('div', 'cel-libreta-cab', `${ICONO.libreta}<b>Libreta</b>`);
  libretaCuenta = el('small', 'cel-libreta-cuenta');
  cab.append(libretaCuenta);
  libretaLista = el('ol', 'cel-libreta-lista');
  const acciones = el('div', 'cel-libreta-acciones');
  const ayuda = el('button', 'cel-boton', `${ICONO.ayuda}<span>Ayuda</span>`);
  ayuda.dataset.accion = 'ayuda';
  ayuda.onclick = () => mostrarAyuda(c, p);
  const exp = el('button', 'cel-boton', `${ICONO.carpeta}<span>Expediente</span>`);
  exp.onclick = () => expediente(c);
  botonResolver = el('button', 'cel-boton resolver', `${ICONO.lupa}<span>Resolver el caso</span>`);
  botonResolver.dataset.accion = 'resolver';
  botonResolver.onclick = () => resolver(c, p);
  const salir = el('button', 'cel-boton redondo chico', ICONO.salir);
  salir.title = 'Volver a la mesa';
  salir.onclick = () => mesa();
  acciones.append(ayuda, exp, botonResolver);
  libreta.append(cab, libretaLista, acciones);
  s.append(zonaTel, libreta, salir);
  app.replaceChildren(s);
  actualizarLibreta(c, p);
  if (c.tutorial) tutorial(c, p, 'inicio');
}

function actualizarLibreta(c: Caso, p: ProgresoCaso) {
  if (!libretaLista || !libretaCuenta || !botonResolver) return;
  libretaLista.replaceChildren();
  // En el orden en que las fue encontrando
  for (const id of p.pistas) {
    const pi = c.pistas.find((x) => x.id === id);
    if (!pi) continue;
    const li = el('li', `${pi.clave ? 'clave' : ''} ${pi.giro ? 'giro' : ''}`, `${pi.giro ? '<b>¡Giro!</b> ' : ''}${esc(pi.texto)}`);
    li.dataset.pista = id;
    libretaLista.append(li);
  }
  if (!p.pistas.length) libretaLista.append(el('li', 'vacia', 'Todavía nada. Lo que encuentres en el teléfono se anota aquí solo.'));
  const claves = c.pistas.filter((x) => x.clave);
  const tengo = claves.filter((x) => p.pistas.includes(x.id)).length;
  libretaCuenta.innerHTML = `${p.pistas.length} pistas · <b>${tengo}/${claves.length}</b> importantes`;
  const listo = tengo === claves.length;
  botonResolver.classList.toggle('listo', listo);
  libretaLista.scrollTop = libretaLista.scrollHeight;
}

function anotar(c: Caso, p: ProgresoCaso, id: string | undefined) {
  if (!id || p.pistas.includes(id)) return;
  const pi = c.pistas.find((x) => x.id === id);
  if (!pi) return;
  p.pistas.push(id);
  guardar();
  actualizarLibreta(c, p);
  efecto(pi.giro ? 'sorpresa' : 'tin', pi.giro ? 0.45 : 0.25);
  const papel = el('div', `cel-papelito ${pi.giro ? 'giro' : ''}`, `<b>${pi.giro ? '¡Giro en el caso!' : 'Pista anotada'}</b><span>${esc(pi.texto)}</span>`);
  app.append(papel);
  setTimeout(() => papel.classList.add('vuela'), pi.giro ? 2600 : 1500);
  setTimeout(() => papel.remove(), pi.giro ? 3300 : 2200);
  libretaLista?.querySelector(`[data-pista="${id}"]`)?.classList.add('nueva');
  tutorial(c, p, 'pista');
}

// ------------------------------------------------------------------ ayudas

function etapaActual(c: Caso, p: ProgresoCaso) {
  if (!p.abiertos.includes('bloqueo')) return 'bloqueo';
  const falta = c.candados.find((k) => !p.abiertos.includes(k.id));
  return falta?.id ?? 'resolver';
}

function mostrarAyuda(c: Caso, p: ProgresoCaso) {
  const etapa = etapaActual(c, p);
  const a = c.ayudas.find((x) => x.etapa === etapa);
  const capa = el('div', 'cel-capa');
  const caja = el('div', 'cel-ayuda');
  const n = p.ayudas[etapa] ?? 0;
  const nombre = etapa === 'bloqueo' ? 'Abrir el teléfono' : etapa === 'resolver' ? 'Resolver el caso' : `Abrir «${c.candados.find((k) => k.id === etapa)?.titulo ?? ''}»`;
  const pintar = () => {
    const k = p.ayudas[etapa] ?? 0;
    caja.innerHTML = `<h3>${ICONO.ayuda} Ayuda de Ulises</h3><small>Ahora mismo: ${esc(nombre)}</small>`;
    const ol = el('ol');
    a?.textos.forEach((t, i) => ol.append(el('li', i < k ? 'vista' : 'tapada', i < k ? esc(t) : i === a.textos.length - 1 ? 'La respuesta (cuesta una estrella)' : 'Otra ayuda')));
    caja.append(ol);
    const fila = el('div', 'cel-exp-botones');
    const cerrar = el('button', 'cel-boton', 'Cerrar');
    cerrar.onclick = () => { capa.remove(); capas.pop(); };
    fila.append(cerrar);
    if (a && k < a.textos.length) {
      const mas = el('button', 'cel-boton grande', k === a.textos.length - 1 ? 'Ver la respuesta' : k ? 'Otra ayuda' : 'Dame una ayuda');
      mas.dataset.accion = 'mas-ayuda';
      mas.onclick = () => { p.ayudas[etapa] = k + 1; guardar(); efecto('idea', 0.35); pintar(); };
      fila.append(mas);
    }
    caja.append(fila);
  };
  if (!a) caja.textContent = 'Sigue buscando: vas bien.';
  else pintar();
  void n;
  capa.append(caja);
  app.append(capa);
  capas.push(() => capa.remove());
}

// ------------------------------------------------------------------ resolver

function resolver(c: Caso, p: ProgresoCaso) {
  const claves = c.pistas.filter((x) => x.clave);
  const faltan = claves.filter((x) => !p.pistas.includes(x.id)).length;
  const capa = el('div', 'cel-capa');
  const caja = el('div', 'cel-resolver');
  capa.append(caja);
  app.append(capa);
  capas.push(() => capa.remove());
  const cerrar = () => { capa.remove(); capas.pop(); };
  if (faltan) {
    caja.innerHTML = `<h3>${ICONO.lupa} Todavía no cuadra</h3><p>Te faltan <b>${faltan}</b> ${faltan === 1 ? 'pista importante' : 'pistas importantes'} en la libreta. Revisa el teléfono con calma: chats, fotos, notas de voz… y lo que esté con candado.</p>`;
    const f = el('div', 'cel-exp-botones');
    const b = el('button', 'cel-boton grande', 'Seguir buscando');
    b.onclick = cerrar;
    f.append(b);
    caja.append(f);
    return;
  }
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
          aviso.innerHTML = `<b>¡Eso es!</b> ${esc(q.porque)}`;
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
          aviso.innerHTML = '<b>No cuadra con las pistas.</b> Vuelve a mirar la libreta.';
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

// ------------------------------------------------------------------ el tutorial del caso 1 (Ulises va guiando)

const PASOS: { id: string; cuando: (n: string, c: Caso, p: ProgresoCaso) => boolean; texto: string }[] = [
  { id: 'hola', cuando: (n, _c, p) => n === 'inicio' && !p.abiertos.includes('bloqueo'), texto: 'Este es el teléfono de Marcela. Tócale la pantalla para despertarlo.' },
  { id: 'clave', cuando: (n) => n === 'despertar', texto: 'Tiene clave. Lee el recordatorio que dejó ella: dice qué número usó. Mira la fecha de arriba.' },
  { id: 'adentro', cuando: (n) => n === 'desbloqueo', texto: '¡Adentro! Lo que encuentres se anota solo en tu libreta (a la derecha). Empieza por Mensajes.' },
  { id: 'chat', cuando: (n) => n === 'app:mensajes', texto: 'Abre cada conversación. Las notas de voz se escuchan con el botón de play (y «Aa» muestra lo que dicen).' },
  { id: 'voz', cuando: (n) => n === 'voz', texto: 'Eso. Revisa también Fotos, Notas, la Grabadora y el Mapa. Si una foto está muy oscura, prende la Linterna.' },
  { id: 'candado', cuando: (n) => n.startsWith('candado:'), texto: 'Una nota con candado. La clave siempre está escondida en otra parte del teléfono. Si te atascas, toca Ayuda.' },
  { id: 'resolver', cuando: (_n, c, p) => c.pistas.filter((x) => x.clave).every((x) => p.pistas.includes(x.id)), texto: 'Ya tienes todas las pistas importantes. Toca «Resolver el caso» y contesta qué pasó.' },
];

function tutorial(c: Caso, p: ProgresoCaso, n: string) {
  if (!c.tutorial || p.resuelto) return;
  const paso = PASOS.find((x) => !p.tutorial.includes(x.id) && x.cuando(n, c, p));
  if (!paso) return;
  p.tutorial.push(paso.id);
  guardar();
  coach?.remove();
  coach = el('div', 'cel-coach', `<span class="cel-coach-cara" style="background-image:url(${foto('ulises')})"></span><div><b>Ulises</b><p>${esc(paso.texto)}</p></div>`);
  const x = el('button', 'cel-coach-x', '×');
  x.onclick = () => coach?.remove();
  coach.append(x);
  app.append(coach);
  const este = coach;
  setTimeout(() => este.classList.add('fuera'), 9000);
  setTimeout(() => este.remove(), 9600);
}

// ------------------------------------------------------------------ arranque

alAtras(() => {
  if (tel?.atras()) return true;
  const f = capas.pop();
  if (f) { f(); return true; }
  if (casoActual) { mesa(); return true; }
  return false;
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
