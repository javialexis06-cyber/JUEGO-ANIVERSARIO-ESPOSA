import './mente.css';
import { clavePerfil } from './perfil';
import { JUEGOS, CATEGORIAS, categoriaDe, fechaBogota, juegoDe, retoDiario, semillaDe, type IdMental, type CategoriaMental } from './catalogo';
import { COLORES, FIGURAS, PRODUCTOS, TANGRAM, TINTAS, COLORES_CODIGO, NOMBRES_CODIGO, FORMAS_MATRIZ, COLORES_MATRIZ, NOMBRES_COLOR_MATRIZ, pistasNonograma, MotorMental, type Accion } from './motor';
import { publicar, tabla, type Envio } from './clasificacion';
import { esModoAmigo, perfilAmigo } from '../salas/perfil';
import * as sonido from '../sonido';
import { efectoArchivo, precargarEfectos } from '../efecto_archivo';
// Música y efectos del patio (pedido de Javier, 26 de octubre de 2026): diez pistas CC0 variadas que rotan al azar y
// efectos propios de cada juego (public/sfx/patio_*). Arrancan con el primer toque (el navegador lo exige).
// Rediseño visual y seis juegos nuevos (pedido de Javier, 1 de noviembre de 2026): portada por categorías, partida con
// progreso y animaciones de acierto y error, final con estrellas. Los atributos data-a/data-v se conservan.
const MUSICA_PATIO = ['patio-cider', 'patio-dondeiba', 'patio-lofi', 'patio-cuna', 'patio-piano', 'patio-nube', 'patio-parque', 'patio-kalimba', 'patio-hiphop', 'patio-cuento'];
const EFECTOS_PATIO = ['patio_toque', 'patio_acierto', 'patio_error', 'patio_ronda', 'patio_carta', 'patio_mover', 'patio_disco', 'patio_pieza', 'patio_letra', 'patio_paso', 'patio_gano', 'patio_descanso'];
let audioListo = false;
function despertarAudio() { if (audioListo) return; audioListo = true; sonido.activar(); precargarEfectos(EFECTOS_PATIO); const r = [...MUSICA_PATIO].sort(() => Math.random() - .5); sonido.musica.pista(r[0], { rueda: r, reiniciar: true }); }
const GOLPE: Partial<Record<IdMental, string>> = { parejas: 'patio_carta', deslizante: 'patio_mover', hanoi: 'patio_disco', tangram: 'patio_pieza', anagramas: 'patio_letra', sopa: 'patio_letra', laberinto: 'patio_paso', luces: 'patio_mover', nonograma: 'patio_pieza', codigo: 'patio_carta' };
function sonarCambio(m: MotorMental, antes: { a: number; e: number; r: number; f: string }) {
    if (m.fase === 'fin' && antes.f !== 'fin') efectoArchivo(m.completo ? 'patio_gano' : 'patio_descanso', .8, 0);
    else if (m.errores > antes.e) efectoArchivo('patio_error', .6);
    else if (m.ronda > antes.r) efectoArchivo('patio_ronda', .7);
    else if (m.aciertos > antes.a) efectoArchivo('patio_acierto', .65);
    else efectoArchivo(GOLPE[m.id] ?? 'patio_toque', .55);
}
const app = document.createElement('main'); document.body.append(app);
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const CLAVE = clavePerfil('patio-mente-v1');
/** `mejores`: estrellas por juego (0–3), nuevo campo opcional del mismo guardado v1. */
interface Guardado { v: 1; marcas: Record<string, number>; partida: { diario: boolean; fecha: string; motor: ReturnType<MotorMental['exportar']> } | null; pendiente: Envio | null; nombre: string; mejores: Record<string, number> }
const nuevo = (): Guardado => ({ v: 1, marcas: {}, partida: null, pendiente: null, nombre: perfilAmigo()?.nombre ?? '', mejores: {} });
let g = nuevo(); try { const x = JSON.parse(localStorage.getItem(CLAVE) ?? 'null'); if (x?.v === 1 && x.marcas && typeof x.nombre === 'string') g = { ...nuevo(), ...x, mejores: x.mejores && typeof x.mejores === 'object' ? x.mejores : {} }; } catch { /* nuevo perfil */ }
let motor: MotorMental | null = null, diario = false, fecha = '', pantalla = 'menu', errorGuardar = '', ultimo = '', pausado = false, ultimoGuardado = 0, finGuardado = false;
let filtro: CategoriaMental | 'todos' = 'todos', efectoPendiente = '';
try { const f = localStorage.getItem('patio-mente-filtro'); if (f && (f === 'todos' || CATEGORIAS.some(c => c.id === f))) filtro = f as typeof filtro; } catch { /* preferencia opcional */ }
/** Cómo se veía cada casilla en el dibujo anterior: la que cambia se anima (carta que se voltea, farol que cambia…). */
const vistas = new Map<string, string>();
// Al pasar de una vista a otra se sube al inicio de la página; al volver a la portada se recupera el punto donde se dejó.
let vistaPintada = '', scrollPortada = 0;
addEventListener('scroll', () => { if (vistaPintada === 'menu') scrollPortada = scrollY; }, { passive: true });
function vistaNueva(v: string) { if (v === vistaPintada) return; vistaPintada = v; scrollTo(0, v === 'menu' ? scrollPortada : 0); }
function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(g)); errorGuardar = ''; return true; } catch { errorGuardar = 'No se pudo guardar. Mantén esta página abierta y reintenta.'; return false; } }
function salir() {
    if (!guardar() && !confirm('No se pudo guardar el patio. ¿Salir de todos modos?')) { pintar(); return; }
    const destino = new URL(esModoAmigo() ? './amigos.html' : './index.html', location.href);
    if (!esModoAmigo()) { destino.searchParams.set('desdePatio', '1'); const p = new URLSearchParams(location.search); for (const k of ['rol', 'local']) if (p.has(k)) destino.searchParams.set(k, p.get(k)!); }
    location.href = destino.href;
}
function menu() { if (motor) { if (motor.fase !== 'fin') g.partida = { diario, fecha, motor: motor.exportar() }; if (!guardar()) { pintar(); return; } } motor = null; pantalla = 'menu'; ultimo = ''; pintar(); }
function iniciar(id: IdMental, delDia: boolean) {
    if (g.partida && motor === null && !confirm('Hay una partida guardada. ¿La reemplazas por esta?')) return;
    diario = delDia; fecha = fechaBogota(); motor = new MotorMental(id, delDia ? retoDiario(fecha).semilla : semillaDe(`${id}:${Date.now()}:${crypto.randomUUID()}`));
    g.partida = { diario, fecha, motor: motor.exportar() }; finGuardado = false; pausado = false; pantalla = 'juego'; vistas.clear(); guardar(); ultimo = ''; pintar();
}
function continuar() { const p = g.partida, m = p ? MotorMental.restaurar(p.motor) : null; if (!p || !m) { g.partida = null; guardar(); return menu(); } motor = m; diario = p.diario; fecha = p.fecha; pausado = false; finGuardado = false; pantalla = 'juego'; vistas.clear(); ultimo = ''; pintar(); }

// ------------------------------------------------------------------ piezas de dibujo
const boton = (texto: string, accion: string, valor?: string | number, clase = '') => `<button class="${clase}" data-a="${accion}"${valor !== undefined ? ` data-v="${esc(String(valor))}"` : ''}>${texto}</button>`;
function celda(i: number, texto: string, clase = '', disabled = false, etiqueta = '') { return `<button data-a="celda" data-v="${i}" class="casilla ${clase}" aria-label="${etiqueta || `Casilla ${i + 1}${texto ? ': ' + esc(texto.replace(/<[^>]+>/g, '')) : ''}`}" ${disabled ? 'disabled' : ''}>${texto}</button>`; }
function cuadricula(n: number, celdas: string[], clase = '') { return `<div class="cuadricula ${clase}" style="--n:${n}">${celdas.join('')}</div>`; }
const estrellas = (n: number) => `<span class="estrellas" aria-label="${n} de 3 estrellas">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i></span>`;
/** Estrellas de una partida terminada, a partir de sus puntos (no cambian puntos ni clasificación). */
const estrellasDe = (m: MotorMental) => !m.completo ? 0 : m.puntos >= 9000 ? 3 : m.puntos >= 7000 ? 2 : 1;
/** Forma de «La pieza que falta» en SVG: forma por la fila, color por la columna y de una a tres copias. */
function pieza(codigo: number) {
    if (codigo < 0) return '<span class="pieza-falta">?</span>';
    const f = Math.floor(codigo / 9), c = Math.floor(codigo / 3) % 3, q = codigo % 3 + 1, color = COLORES_MATRIZ[c];
    const forma = (x: number) => f === 0 ? `<circle cx="${x}" cy="20" r="9" fill="${color}"/>` : f === 1 ? `<rect x="${x - 9}" y="11" width="18" height="18" rx="3" fill="${color}"/>` : `<polygon points="${x},10 ${x + 10},29 ${x - 10},29" fill="${color}"/>`;
    const xs = q === 1 ? [30] : q === 2 ? [19, 41] : [10, 30, 50];
    return `<svg viewBox="0 0 60 40" aria-label="${q} ${FORMAS_MATRIZ[f].toLowerCase()}${q > 1 ? 's' : ''} ${NOMBRES_COLOR_MATRIZ[c]}${q > 1 ? 's' : ''}">${xs.map(forma).join('')}</svg>`;
}
/** Avance de la partida (0–1) y su texto para la barra del panel. */
function progreso(m: MotorMental): [number, string] {
    switch (m.id) {
        case 'parejas': return [m.aciertos / 8, `${m.aciertos} de 8 parejas`];
        case 'simon': return [m.ronda / 5, `Secuencia ${Math.min(5, m.ronda + 1)} de 5`];
        case 'cuadricula': return [m.ronda / 3, `Ronda ${Math.min(3, m.ronda + 1)} de 3`];
        case 'diferencias': return [m.aciertos / 5, `${m.aciertos} de 5 diferencias`];
        case 'buscar': return [m.ronda / 10, `Búsqueda ${Math.min(10, m.ronda + 1)} de 10`];
        case 'stroop': case 'calculo': return [m.ronda / 12, `Turno ${Math.min(12, m.ronda + 1)} de 12`];
        case 'sudoku': { const libres = 16 - m.fijos.length, puestas = m.tablero.filter((v, i) => v && !m.fijos.includes(i)).length; return [puestas / libres, `${puestas} de ${libres} casillas`]; }
        case 'sopa': return [m.aciertos / Math.max(1, m.palabras.length), `${m.aciertos} de ${m.palabras.length} palabras`];
        case 'anagramas': return [m.ronda / 6, `Palabra ${Math.min(6, m.ronda + 1)} de 6`];
        case 'deslizante': { const bien = m.tablero.filter((v, i) => v && v === i + 1).length; return [bien / 8, `${bien} de 8 baldosas en su sitio`]; }
        case 'tangram': return [m.encontrados.length / 7, `${m.encontrados.length} de 7 piezas`];
        case 'hanoi': return [(m.torres[2]?.length ?? 0) / 4, `${m.torres[2]?.length ?? 0} de 4 discos en la llegada`];
        case 'laberinto': return [m.completo ? 1 : 0, 'Lleva la patita a la casita'];
        case 'compras': return [m.fase === 'observar' ? 0 : m.seleccion.length / 8, `${m.seleccion.length} de 8 productos elegidos`];
        case 'nback': return [Math.max(0, m.turno - 2) / 22, `Turno ${Math.max(0, m.turno - 1)} de 22`];
        case 'schulte': return [(m.cursor - 1) / 25, `Siguiente: ${Math.min(25, m.cursor)}`];
        case 'luces': { const on = m.tablero.filter(Boolean).length; return [(m.ronda + (on ? 0 : 1)) / 2, `Tablero ${Math.min(2, m.ronda + 1)} de 2 · ${on} faroles encendidos`]; }
        case 'codigo': return [m.torres.length / 8, `Intento ${Math.min(8, m.torres.length + 1)} de 8`];
        case 'series': return [m.ronda / 8, `Serie ${Math.min(8, m.ronda + 1)} de 8`];
        case 'matriz': return [m.ronda / 6, `Cuadro ${Math.min(6, m.ronda + 1)} de 6`];
        case 'nonograma': { const meta = m.solucion.filter(Boolean).length, bien = m.solucion.filter((v, i) => v && m.tablero[i] === 1).length; return [bien / meta, `${bien} de ${meta} casillas pintadas`]; }
    }
    return [0, ''];
}
function contenido(m: MotorMental): string {
    const observando = m.fase === 'observar';
    switch (m.id) {
        case 'parejas': return cuadricula(4, m.tablero.map((v, i) => { const vista = m.encontrados.includes(i) || m.seleccion.includes(i); return celda(i, vista ? `<span class="cara">${FIGURAS[v]}</span>` : '', `carta ${m.encontrados.includes(i) ? 'hallada' : vista ? 'destapada' : 'reverso'}`, false, vista ? `Carta ${i + 1}: ${FIGURAS[v]}` : `Carta ${i + 1} tapada`); }), 'cartas');
        case 'simon': return `<p class="estado">${observando ? 'Observa y escucha el orden' : 'Tu turno: repite el orden'}</p>` + `<div class="coro">${Array.from({ length: 4 }, (_, i) => `<button data-a="celda" data-v="${i}" class="luz ${m.luzSimon === i ? 'encendida' : ''}" style="--color:${TINTAS[i]}" aria-label="${COLORES[i]}" ${observando ? 'disabled' : ''}><span>${['☀', '☂', '❀', '☾'][i]}</span></button>`).join('')}</div>`;
        case 'cuadricula': return `<p class="estado">${observando ? 'Recuerda las ventanas encendidas' : 'Marca las ventanas que viste'}</p>` + cuadricula(4, Array.from({ length: 16 }, (_, i) => celda(i, '', `ventana ${observando && m.solucion.includes(i) || m.seleccion.includes(i) ? 'seleccionada' : ''}`, observando))) + (!observando ? boton('Confirmar', 'confirmar', undefined, 'principal') : '');
        case 'diferencias': return `<div class="comparacion"><div><small>Patio de referencia</small>${cuadricula(4, m.tablero.map(v => `<span class="casilla fija-vista">${FIGURAS[v]}</span>`))}</div><div><small>Toca aquí las diferencias</small>${cuadricula(4, m.otro.map((v, i) => celda(i, FIGURAS[v], m.encontrados.includes(i) ? 'hallada' : '')))}</div></div>`;
        case 'buscar': return `<p class="estado objetivo-busqueda">Busca <span>${FIGURAS[m.cursor]}</span></p>` + cuadricula(6, m.tablero.map((v, i) => celda(i, FIGURAS[v])), 'rejilla-buscar');
        case 'stroop': return `<p class="estado">¿De qué color es la tinta?</p><div class="tarjeta-grande"><strong class="palabra-color" style="color:${TINTAS[m.cursor]}">${m.texto}</strong></div><div class="opciones">${m.opciones.map(t => boton(t, 'opcion', t, 'opcion-color')).join('')}</div>`;
        case 'calculo': return `<p class="estado">Resuelve</p><div class="pizarra"><strong class="cuenta">${m.texto} = ?</strong></div><div class="opciones">${m.opciones.map(t => boton(t, 'opcion', t, 'opcion-num')).join('')}</div>`;
        case 'sudoku': return cuadricula(4, m.tablero.map((v, i) => celda(i, v ? String(v) : '', `${m.fijos.includes(i) ? 'fija' : ''} ${m.cursor === i ? 'seleccionada' : ''}`, m.fijos.includes(i))), 'sudoku') + `<div class="opciones">${m.opciones.map(t => boton(t, 'opcion', t, t === 'Borrar' ? '' : 'opcion-num')).join('')}${boton('Comprobar', 'confirmar', undefined, 'principal')}</div>`;
        case 'sopa': return `<div class="palabras">${m.palabras.map((w, i) => `<span class="${m.fijos.includes(i) ? 'tachada' : ''}">${w}</span>`).join('')}</div>` + cuadricula(8, m.tablero.map((v, i) => celda(i, String.fromCharCode(v), `letra ${m.encontrados.includes(i) ? 'hallada' : ''} ${m.seleccion.includes(i) ? 'seleccionada' : ''}`)), 'sopa');
        case 'anagramas': return `<p class="estado">Pista: ${m.tema}</p><div class="respuesta">${Array.from(m.texto, (_, k) => `<span>${m.seleccion[k] !== undefined ? m.texto[m.tablero[m.seleccion[k]]] : ''}</span>`).join('')}</div><div class="letras">${m.tablero.map((v, i) => celda(i, m.texto[v], `ficha ${m.seleccion.includes(i) ? 'usada' : ''}`, m.seleccion.includes(i))).join('')}</div><div class="opciones">${boton('Borrar última', 'borrar')}${boton('Confirmar', 'confirmar', undefined, 'principal')}</div>`;
        case 'deslizante': return cuadricula(3, m.tablero.map((v, i) => celda(i, v ? String(v) : '', v ? `baldosa ${v === i + 1 ? 'en-su-sitio' : ''}` : 'hueco', !v)), 'baldosas');
        case 'tangram': { const tonos = ['#e35d6a', '#4f8fd6', '#f0b13a', '#5cba73', '#9a6ad0', '#f08a4b', '#3fb7b0']; return `<div class="tangram"><svg viewBox="0 0 360 300" data-tablero-tangram aria-label="Silueta para las siete piezas">${TANGRAM.map((p, i) => `<polygon points="${p.p.map(x => x.join(',')).join(' ')}" transform="translate(${p.x} ${p.y}) rotate(${p.giro})" fill="${m.otro[i] >= 0 ? tonos[i] : '#e8dcc4'}" stroke="${m.otro[i] >= 0 ? '#fff' : '#a3927c'}" stroke-width="2"/>`).join('')}</svg><div class="piezas">${m.tablero.map(i => { const p = TANGRAM[i]; return `<button data-a="celda" data-v="${i}" class="${m.cursor === i ? 'seleccionada' : ''}" ${m.encontrados.includes(i) ? 'disabled' : ''} aria-label="Pieza ${i + 1}"><svg viewBox="-80 -80 160 160"><polygon points="${p.p.map(x => x.join(',')).join(' ')}" transform="scale(.55) rotate(${m.cursor === i ? m.giro : 0})" fill="${tonos[i]}"/></svg></button>`; }).join('')}${boton(`Girar ↻ ${m.giro}°`, 'girar')}</div></div>`; }
        case 'hanoi': return `<div class="torres">${m.torres.map((discos, i) => `<button data-a="celda" data-v="${i}" class="torre ${m.cursor === i ? 'seleccionada' : ''}" aria-label="Torre ${['de salida', 'auxiliar', 'de llegada'][i]}"><span class="poste"></span>${discos.map((d, j) => `<span class="disco" style="width:${25 + d * 17}%;bottom:${12 + j * 18}%;--tono:${['#e35d6a', '#4f8fd6', '#5cba73', '#9a6ad0'][d - 1]}">${d}</span>`).join('')}<b>${['Salida', 'Auxiliar', 'Llegada'][i]}</b></button>`).join('')}</div>`;
        case 'laberinto': return cuadricula(m.taman, m.tablero.map((v, i) => celda(i, i === m.cursor ? '🐾' : i === m.solucion[0] ? '🏠' : '', v ? 'muro' : 'sendero', !!v)), 'laberinto') + `<div class="direcciones">${[['↑', 'arriba'], ['←', 'izquierda'], ['↓', 'abajo'], ['→', 'derecha']].map(([t, v]) => boton(t, 'mover', v)).join('')}</div>`;
        case 'compras': return observando ? `<p class="estado">Recuerda la lista</p><ul class="lista-compras">${m.solucion.map(i => `<li>${PRODUCTOS[i]}</li>`).join('')}</ul>` : `<p class="estado">¿Qué llevaba la lista?</p><div class="productos">${m.tablero.map(i => celda(i, PRODUCTOS[i], m.seleccion.includes(i) ? 'seleccionada' : '')).join('')}</div>${boton('Confirmar la cesta', 'confirmar', undefined, 'principal')}`;
        case 'nback': return `<p class="estado">${observando ? 'Observa las dos primeras figuras' : '¿Es igual a la de hace DOS turnos?'}</p><div class="tarjeta-grande"><strong class="figura-nback">${FIGURAS[m.solucion[m.turno]]}</strong></div>${observando ? '' : `<div class="opciones">${boton('Es diferente', 'opcion', 0)}${boton('Coincide', 'opcion', 1, 'principal')}</div>`}`;
        // ---- juegos nuevos
        case 'schulte': return `<p class="estado">Toca el <span class="siguiente">${Math.min(25, m.cursor)}</span></p>` + cuadricula(5, m.tablero.map((v, i) => celda(i, m.encontrados.includes(i) ? '✨' : String(v), m.encontrados.includes(i) ? 'luciernaga' : 'numero', false, `Número ${v}`)), 'schulte');
        case 'luces': return `<p class="estado">${m.tablero.filter(Boolean).length} faroles encendidos</p>` + cuadricula(m.taman, m.tablero.map((v, i) => celda(i, `<span class="farol-luz"></span>`, v ? 'farol encendido' : 'farol', false, `Farol ${i + 1} ${v ? 'encendido' : 'apagado'}`)), 'faroles');
        case 'codigo': {
            const fila = (colores: number[], fb?: [number, number], actual = false) => `<div class="fila-codigo ${actual ? 'actual' : ''}">${colores.map((c, k) => actual ? `<button data-a="celda" data-v="${k}" class="hueco-codigo ${m.cursor === k ? 'seleccionada' : ''}" style="--c:${c >= 0 ? COLORES_CODIGO[c] : 'transparent'}" aria-label="Hueco ${k + 1}: ${c >= 0 ? NOMBRES_CODIGO[c] : 'vacío'}"></button>` : `<span class="hueco-codigo" style="--c:${COLORES_CODIGO[c]}"></span>`).join('')}<span class="pistas-codigo" aria-label="${fb ? `${fb[0]} en su sitio, ${fb[1]} de buen color` : ''}">${fb ? [...Array(fb[0]).fill('negra'), ...Array(fb[1]).fill('blanca'), ...Array(4 - fb[0] - fb[1]).fill('vacia')].map(t => `<i class="${t}"></i>`).join('') : ''}</span></div>`;
            return `<div class="candado"><div class="historial">${m.torres.map((t, k) => fila(t, [m.otro[k * 2], m.otro[k * 2 + 1]])).join('')}${m.fase === 'jugar' ? fila(m.seleccion, undefined, true) : ''}${Array.from({ length: Math.max(0, 7 - m.torres.length) }, () => `<div class="fila-codigo vacia">${'<span class="hueco-codigo"></span>'.repeat(4)}<span class="pistas-codigo"></span></div>`).join('')}</div><div class="paleta">${COLORES_CODIGO.map((c, k) => `<button data-a="opcion" data-v="${k}" class="color-codigo" style="--c:${c}" aria-label="${NOMBRES_CODIGO[k]}"></button>`).join('')}</div><div class="opciones">${boton('Borrar', 'borrar')}${boton('Probar', 'confirmar', undefined, 'principal')}</div><p class="leyenda-codigo"><i class="negra"></i> en su sitio · <i class="blanca"></i> buen color, otro sitio</p></div>`;
        }
        case 'series': return `<p class="estado">¿Qué número sigue?</p><div class="serie">${m.texto.split(' · ').map(t => `<span>${t}</span>`).join('<i>›</i>')}<i>›</i><span class="incognita">?</span></div><div class="opciones">${m.opciones.map(t => boton(t, 'opcion', t, 'opcion-num')).join('')}</div>`;
        case 'matriz': return `<p class="estado">Completa el cuadro</p><div class="matriz">${m.tablero.map((c, i) => `<div class="celda-matriz ${c < 0 ? 'falta' : ''}" aria-label="Casilla ${i + 1}">${pieza(c)}</div>`).join('')}</div><div class="opciones opciones-matriz">${m.opciones.map(t => `<button data-a="opcion" data-v="${t}" class="opcion-pieza">${pieza(Number(t))}</button>`).join('')}</div>`;
        case 'nonograma': {
            const { filas, columnas } = pistasNonograma(m.solucion, 5), mia = pistasNonograma(m.tablero.map(x => x === 1 ? 1 : 0), 5), igual = (a: number[], b: number[]) => a.join() === b.join();
            return `<div class="nono-envoltura"><div class="nonograma"><span class="esquina"></span>${columnas.map((c, x) => `<span class="pista-col ${igual(c, mia.columnas[x]) ? 'cumplida' : ''}">${c.map(n => `<b>${n}</b>`).join('')}</span>`).join('')}${filas.map((f, y) => `<span class="pista-fila ${igual(f, mia.filas[y]) ? 'cumplida' : ''}">${f.map(n => `<b>${n}</b>`).join('')}</span>${Array.from({ length: 5 }, (_, x) => { const i = y * 5 + x, v = m.tablero[i]; return celda(i, v === 2 ? '✕' : '', v === 1 ? 'pintada' : v === 2 ? 'marcada' : 'vacia-nono', false, `Fila ${y + 1}, columna ${x + 1}${v === 1 ? ', pintada' : v === 2 ? ', marcada' : ''}`); }).join('')}`).join('')}</div><div class="opciones modo-nono">${boton('🖌️ Pintar', 'girar', undefined, m.cursor === 0 ? 'activo' : '')}${boton('✕ Marcar vacía', 'girar', undefined, m.cursor === 1 ? 'activo' : '')}</div></div>`;
        }
    }
    return '';
}
let sonidos = false, audio: AudioContext | null = null, luzAnterior = -1;
function nota(i: number) { if (!sonidos || i < 0) return; try { audio ??= new AudioContext(); void audio.resume(); const o = audio.createOscillator(), v = audio.createGain(); o.frequency.value = [330, 392, 440, 523][i]; v.gain.setValueAtTime(.06, audio.currentTime); v.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .23); o.connect(v); v.connect(audio.destination); o.start(); o.stop(audio.currentTime + .25); } catch { /* sonido opcional */ } }
/** Tiempo hasta el reto de mañana (medianoche de Colombia). */
function cambiaEn() {
    const ahora = new Date(), bogota = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Bogota' })), manana = new Date(bogota); manana.setHours(24, 0, 0, 0);
    const min = Math.max(1, Math.round((manana.getTime() - bogota.getTime()) / 60000)); return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}
function confeti() { const tonos = ['#e35d6a', '#4f8fd6', '#f0b13a', '#5cba73', '#9a6ad0', '#f08a4b']; return `<div class="confeti" aria-hidden="true">${Array.from({ length: 28 }, (_, k) => `<i style="--x:${(k * 37) % 100}%;--d:${(k % 7) * .12}s;--t:${2.2 + (k % 5) * .35}s;--c:${tonos[k % tonos.length]};--r:${(k * 53) % 360}deg"></i>`).join('')}</div>`; }

function pintar() {
    if (pantalla === 'menu') {
        const r = retoDiario(), cr = categoriaDe(r.juego.id), total = Object.values(g.mejores).reduce((a, b) => a + b, 0), jugados = Object.keys(g.mejores).length;
        const lista = JUEGOS.filter(j => filtro === 'todos' || j.categoria === filtro);
        app.innerHTML = `<header class="cabecera"><button data-a="salir" class="volver">‹ Volver al patio</button><div class="marca"><span class="marca-icono" aria-hidden="true">🧠</span><div><h1>Un ratito en el patio</h1><small>${JUEGOS.length} juegos de memoria, atención y lógica · a tu ritmo</small></div></div>${boton(sonido.silenciado() ? '🔇' : '🔊', 'audio', undefined, 'redondo')}${boton('🏆 Clasificación', 'tabla', undefined, 'claro')}</header>
<section class="menu-patio">
 <article class="reto" style="--cat:${cr.color}">
  <div class="reto-medalla" aria-hidden="true"><span>${r.juego.icono}</span></div>
  <div class="reto-texto"><small class="chip">RETO DEL DÍA · ${r.fecha}</small><h2>${r.juego.nombre}</h2><p class="reto-area"><span class="chip-cat">${cr.nombre}</span> ${r.juego.area}</p><p>El mismo tablero para todos. Cambia en ${cambiaEn()} (hora de Colombia).</p>
   <div class="reto-botones">${boton('▶ Jugar el reto de hoy', 'diario', undefined, 'principal')}${g.partida ? boton('Continuar partida guardada', 'continuar') : ''}${g.pendiente ? boton('Publicar marca guardada', 'pendiente') : ''}</div>
   ${g.marcas[r.fecha] ? `<p class="marca-hoy">Tu mejor marca de hoy: <b>${g.marcas[r.fecha].toLocaleString('es-CO')} puntos</b></p>` : ''}</div>
  <div class="reto-brillo" aria-hidden="true"></div>
 </article>
 <div class="barra-catalogo"><nav class="filtros" aria-label="Categorías">${[{ id: 'todos', nombre: 'Todos', color: '#6d5a8a' }, ...CATEGORIAS].map(c => `<button data-a="filtro" data-v="${c.id}" class="filtro ${filtro === c.id ? 'activo' : ''}" style="--cat:${c.color}">${c.nombre}</button>`).join('')}</nav><span class="progreso-total" title="Estrellas ganadas">⭐ ${total} de ${JUEGOS.length * 3} · ${jugados} de ${JUEGOS.length} juegos</span></div>
 <div class="catalogo">${lista.map(j => { const c = categoriaDe(j.id), e = g.mejores[j.id] ?? 0; return `<button data-a="practica" data-v="${j.id}" class="tarjeta-juego" style="--cat:${c.color}"><span class="medalla" aria-hidden="true">${j.icono}</span><span class="tarjeta-texto"><b>${j.nombre}</b><small>${j.area}</small><span class="pie-tarjeta">${estrellas(e)}${'nuevo' in j ? '<i class="cinta">Nuevo</i>' : ''}</span></span></button>`; }).join('')}</div>
 <p class="nota-ocio">Para pasar un buen rato: no son pruebas médicas ni miden capacidades.</p>
</section>`;
        vistaNueva('menu'); return;
    }
    if (!motor) return;
    const m = motor, j = juegoDe(m.id), cat = categoriaDe(m.id);
    if (m.fase === 'fin') {
        const firmaFin = 'fin:' + m.puntos + ':' + errorGuardar; if (ultimo === firmaFin) return; ultimo = firmaFin;
        const e = estrellasDe(m);
        if (!finGuardado) {
            g.partida = null;
            if (e > (g.mejores[m.id] ?? 0)) g.mejores[m.id] = e;
            if (diario && m.completo) { g.marcas[fecha] = Math.max(g.marcas[fecha] ?? 0, m.puntos); if (!g.pendiente || g.pendiente.fecha !== fecha || m.puntos > g.pendiente.puntos || m.puntos === g.pendiente.puntos && m.tiempo * 1000 < g.pendiente.milisegundos) g.pendiente = { fecha, juego: m.id, puntos: m.puntos, milisegundos: Math.max(1000, Math.round(m.tiempo * 1000)), nombre: g.nombre }; }
            finGuardado = guardar();
        }
        const extra = m.id === 'codigo' && !m.completo ? `<p class="secreto">El candado era: ${m.solucion.map(c => `<i style="--c:${COLORES_CODIGO[c]}"></i>`).join('')}</p>` : m.id === 'nonograma' && m.completo ? `<p class="secreto">Era ${m.tema}.</p>` : '';
        app.innerHTML = `<header class="cabecera">${boton('‹ Patio', 'menu', undefined, 'volver')}<div class="marca"><div><h1>${esc(j.nombre)}</h1><small>${cat.nombre}</small></div></div></header><section class="resultado ${m.completo ? 'ganado' : ''}" style="--cat:${cat.color}">${m.completo ? confeti() : ''}<span class="medalla grande" aria-hidden="true">${m.completo ? j.icono : '🌿'}</span><h2>${m.completo ? '¡Reto terminado!' : 'Un descanso también viene bien'}</h2>${m.completo ? `<div class="estrellas-fin">${[0, 1, 2].map(k => `<span class="${k < e ? 'llena' : ''}" style="--k:${k}">★</span>`).join('')}</div>` : ''}<strong>${m.puntos.toLocaleString('es-CO')} puntos</strong><div class="datos-fin"><div><small>Tiempo</small><b>${Math.round(m.tiempo)} s</b></div><div><small>Aciertos</small><b>${m.aciertos}</b></div><div><small>Errores</small><b>${m.errores}</b></div></div>${extra}<p>${diario ? 'Reto diario del ' + fecha : 'Partida de práctica · sin clasificación'}</p>${diario && m.completo ? `<label>Tu nombre en la clasificación<input id="alias" maxlength="16" value="${esc(g.nombre)}" autocomplete="nickname" placeholder="Elige un seudónimo"></label>${boton('Publicar mejor marca de hoy', 'publicar', undefined, 'principal')}<p id="estado-red" role="status"></p>` : ''}<div class="botones-fin">${boton('↻ Jugar otra vez', 'practica', m.id, diario ? '' : 'principal')}${boton('Volver al patio', 'menu')}</div>${errorGuardar ? `<p role="alert">${errorGuardar}</p>${boton('Reintentar guardado', 'guardar')}` : ''}</section>`;
        vistaNueva('fin'); return;
    }
    const firma = JSON.stringify([m.fase, m.espera > 0 && m.id === 'parejas', m.ronda, m.tablero, m.otro, m.seleccion, m.encontrados, m.fijos, m.cursor, m.giro, m.torres, m.texto, m.opciones, m.turno, m.luzSimon, m.aviso, pausado, errorGuardar]);
    if (firma === ultimo) { const reloj = document.getElementById('reloj'); if (reloj) reloj.textContent = `⏱ ${Math.floor(m.tiempo)} s`; return; }
    ultimo = firma;
    const [p, textoP] = progreso(m);
    app.innerHTML = `<header class="cabecera juego" style="--cat:${cat.color}">${boton('‹ Guardar y volver', 'menu', undefined, 'volver')}<div class="marca"><span class="medalla mini" aria-hidden="true">${j.icono}</span><div><h1>${esc(j.nombre)}</h1><small><span class="chip-cat">${cat.nombre}</span> ${diario ? 'Reto diario · ' + fecha : 'Práctica'}</small></div></div><span id="reloj" class="reloj">⏱ ${Math.floor(m.tiempo)} s</span>${boton(sonido.silenciado() ? '🔇' : '🔊', 'audio', undefined, 'redondo')}${boton(pausado ? '▶ Seguir' : '❚❚ Pausa', 'pausa', undefined, 'claro')}</header>
<section class="partida" style="--cat:${cat.color}"><aside class="panel"><h2>${j.area}</h2><p class="reglas">${j.reglas}</p><div class="progreso" aria-label="Avance"><div class="barra"><i style="width:${Math.round(Math.max(0, Math.min(1, p)) * 100)}%"></i></div><small>${textoP}</small></div><div class="contadores"><span class="ok" title="Aciertos">✓ ${m.aciertos}</span><span class="mal" title="Errores">✗ ${m.errores}</span></div><p class="aviso" role="status">${esc(m.aviso || (m.fase === 'observar' ? 'Primero observa. Los botones se activan después.' : ''))}</p>${j.id === 'simon' ? boton(sonidos ? '♪ Sonido activado' : '♪ Activar sonido', 'sonido') : ''}${errorGuardar ? `<p role="alert">${errorGuardar}</p>${boton('Reintentar guardado', 'guardar')}` : ''}</aside><div class="tablero-juego" id="tablero">${pausado ? `<div class="descanso"><span aria-hidden="true">☕</span><h2>Una pausa</h2><p>El reloj está detenido.</p>${boton('▶ Seguir jugando', 'pausa', undefined, 'principal')}</div>` : contenido(m)}</div></section>`; vistaNueva('juego');
    // Animaciones: lo que cambió desde el dibujo anterior y el efecto del último acierto o error.
    const tablero = document.getElementById('tablero');
    if (tablero) {
        if (efectoPendiente) { tablero.classList.add('efecto-' + efectoPendiente); efectoPendiente = ''; }
        for (const el of tablero.querySelectorAll<HTMLElement>('[data-a][data-v]')) {
            const k = el.dataset.a + ':' + el.dataset.v, sig = el.className + '|' + el.textContent + '|' + (el.getAttribute('style') ?? '');
            if (vistas.has(k) && vistas.get(k) !== sig) el.classList.add('cambio');
            vistas.set(k, sig);
        }
    }
    const tangram = app.querySelector<SVGSVGElement>('[data-tablero-tangram]'); if (tangram) tangram.onpointerup = e => { const q = tangram.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; const pt = q.matrixTransform(tangram.getScreenCTM()!.inverse()); accion({ tipo: 'colocar', x: pt.x, y: pt.y }); };
}
function accion(a: Accion) {
    if (!motor || pausado) return;
    const antes = { a: motor.aciertos, e: motor.errores, r: motor.ronda, f: motor.fase };
    motor.accion(a); sonarCambio(motor, antes);
    efectoPendiente = motor.errores > antes.e ? 'error' : motor.ronda > antes.r ? 'ronda' : motor.aciertos > antes.a ? 'acierto' : '';
    g.partida = { diario, fecha, motor: motor.exportar() }; guardar(); pintar();
}
async function mostrarTabla() {
    pantalla = 'tabla'; motor = null;
    app.innerHTML = `<header class="cabecera">${boton('‹ Patio', 'menu', undefined, 'volver')}<div class="marca"><div><h1>Clasificación del reto diario</h1><small>${fechaBogota()} · ${retoDiario().juego.nombre}</small></div></div></header><section class="tabla"><div id="tabla-red" role="status">Cargando marcas…</div>${boton('Actualizar', 'tabla', undefined, 'principal')}</section>`; vistaNueva('tabla');
    try { const filas = await tabla(fechaBogota()); const e = document.getElementById('tabla-red'); if (e) e.innerHTML = filas.length ? `<table><thead><tr><th>Puesto</th><th>Jugador</th><th>Puntos</th><th>Tiempo</th></tr></thead><tbody>${filas.map((f, i) => `<tr><td>${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</td><td>${esc(f.nombre)}</td><td>${f.puntos}</td><td>${(f.milisegundos / 1000).toFixed(1)} s</td></tr>`).join('')}</tbody></table>` : 'Todavía no hay marcas publicadas hoy. Puedes ser la primera persona.'; } catch (e) { const el = document.getElementById('tabla-red'); if (el) el.textContent = (e as Error).message; }
}
async function enviar() {
    const nombre = (app.querySelector<HTMLInputElement>('#alias')?.value ?? g.nombre).replace(/[<>&"'`\n\r]/g, '').trim().slice(0, 16); g.nombre = nombre; if (!g.pendiente) return;
    if (!nombre) { const el = document.getElementById('estado-red'); if (el) el.textContent = 'Elige un nombre para tu marca.'; return; }
    g.pendiente.nombre = nombre; if (!guardar()) return pintar();
    const envio = { ...g.pendiente }; const estado = document.getElementById('estado-red'); if (estado) estado.textContent = 'Publicando…';
    try { await publicar(envio); if (g.pendiente && JSON.stringify(g.pendiente) === JSON.stringify(envio)) g.pendiente = null; guardar(); if (estado) estado.textContent = 'Tu mejor marca está publicada. ¡Gracias por jugar!'; } catch (e) { if (estado) estado.textContent = (e as Error).message; }
}
app.addEventListener('input', e => { const t = e.target as HTMLInputElement; if (t.id === 'alias') g.nombre = t.value.slice(0, 16); });
app.addEventListener('pointerdown', despertarAudio, { once: true });
app.addEventListener('click', e => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-a]'); if (!b) return; const a = b.dataset.a!, v = b.dataset.v;
    if (a === 'audio') { despertarAudio(); sonido.alternar(); ultimo = ''; pintar(); return; }
    if (a === 'filtro') { filtro = (v ?? 'todos') as typeof filtro; try { localStorage.setItem('patio-mente-filtro', filtro); } catch { /* preferencia opcional */ } pintar(); return; }
    if (a === 'menu') menu(); else if (a === 'salir') salir(); else if (a === 'diario') iniciar(retoDiario().juego.id, true); else if (a === 'practica') { if (motor?.fase === 'fin') motor = null; iniciar(v as IdMental, false); } else if (a === 'continuar') continuar(); else if (a === 'tabla') void mostrarTabla(); else if (a === 'publicar') void enviar();
    else if (a === 'pendiente') { pantalla = 'juego'; motor = new MotorMental(g.pendiente!.juego, 0); motor.fase = 'fin'; motor.completo = true; motor.puntos = g.pendiente!.puntos; motor.tiempo = g.pendiente!.milisegundos / 1000; diario = true; fecha = g.pendiente!.fecha; finGuardado = true; pintar(); }
    else if (a === 'guardar') { if (motor && motor.fase !== 'fin') g.partida = { diario, fecha, motor: motor.exportar() }; guardar(); ultimo = ''; pintar(); }
    else if (a === 'pausa') { pausado = !pausado; ultimo = ''; pintar(); } else if (a === 'sonido') { sonidos = !sonidos; ultimo = ''; pintar(); } else accion({ tipo: a as Accion['tipo'], valor: v });
});
document.addEventListener('keydown', e => { if ((e.target as HTMLElement).matches('input,textarea')) return; const d: Record<string, string> = { ArrowUp: 'arriba', ArrowDown: 'abajo', ArrowLeft: 'izquierda', ArrowRight: 'derecha' }; if (motor?.id === 'laberinto' && d[e.key]) { e.preventDefault(); accion({ tipo: 'mover', valor: d[e.key] }); } else if (e.key === 'Escape' && motor && motor.fase !== 'fin') { pausado = !pausado; ultimo = ''; pintar(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && motor && motor.fase !== 'fin') { pausado = true; g.partida = { diario, fecha, motor: motor.exportar() }; guardar(); ultimo = ''; pintar(); } });
window.addEventListener('pagehide', () => { if (motor && motor.fase !== 'fin') g.partida = { diario, fecha, motor: motor.exportar() }; guardar(); });
let t0 = performance.now(); function cuadro(t: number) { const dt = (t - t0) / 1000; t0 = t; if (motor && !pausado && pantalla === 'juego') { motor.paso(dt); if (motor.id === 'simon' && motor.luzSimon !== luzAnterior) { luzAnterior = motor.luzSimon; nota(luzAnterior); } if (t - ultimoGuardado > 2000) { g.partida = motor.fase === 'fin' ? null : { diario, fecha, motor: motor.exportar() }; guardar(); ultimoGuardado = t; } pintar(); } requestAnimationFrame(cuadro); } requestAnimationFrame(cuadro);
(window as unknown as { __mente: unknown }).__mente = { estado: () => motor?.exportar(), guardado: () => g, juegos: JUEGOS, reto: retoDiario };
pintar();
