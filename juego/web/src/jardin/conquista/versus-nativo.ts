/** Versus de dos personas sobre Gardendless (`jardin.html?modo=versus`): un jugador siembra en el tablero nativo
 * y el otro suelta zombis por carril pagando cerebros. En un dispositivo comparten pantalla; en una sala, el
 * anfitrión (plantas) corre el motor y el invitado (zombis) ve el tablero a partir de las fotos que recibe. */
import './conquista.css';
import './versus-nativo.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/900.css';
import { FrenteGardendless, type EstadoVersusNativo } from '../motores/frente-gardendless';
import { nivelHistoriaNativa, nombreSemillaNativa, nombrePlantaCatalogo, nativoDe, TIPOS_NATIVOS, PLANTAS_NATIVAS, FUSIONES_NATIVAS, type SemillaNativa, type ConfigDefensaNativa } from '../motores/nivel-historia';
import { cargarRetratosNativos, retratoPlantaNativa } from '../motores/retratos-nativos';
import { ARTE_PLANTAS_PVZ } from '../pvz/arte/catalogo';
import { ReglasVersus, VERSUS, ZOMBIS_VERSUS, PROPIO_PLANTA, PROPIO_ZOMBI, type EstadoReglasVersus } from '../motores/versus-reglas';
import { ESCENARIOS_HISTORIA_PVZ, escenarioHistoriaPvZ } from './historia-datos';
import { esModoAmigo } from '../../salas/perfil';
import type { Sala } from '../../salas/tipos';
import { AtlasPvZ } from '../pvz/arte/atlas';
import { RetratosPvZ } from '../pvz/ui/retratos';
import { PLANTAS_PVZ } from '../pvz/datos/plantas';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
// Todo el catálogo: las 32 heredadas con su identificador propio y el resto de plantas nativas.
const HEREDADAS = new Set<string>(Object.values(TIPOS_NATIVOS));
const SEMILLAS = [...Object.keys(TIPOS_NATIVOS), ...PLANTAS_NATIVAS.map(p => p.id).filter(id => !HEREDADAS.has(id))] as SemillaNativa[];
const reloj = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
type Rol = 'local' | 'anfitrion' | 'invitado';
type Pantalla = 'menu' | 'sala' | 'preparar' | 'esperando' | 'cargando' | 'juego';
/** Lo que el anfitrión elige y manda al invitado: con esto los dos saben qué tablero se juega. */
interface EleccionVersus { version: 1; sesion: string; zona: number; semillas: SemillaNativa[] }
/** Foto que el anfitrión manda unas diez veces por segundo. */
interface FotoVersus { sesion: string; n: number; reglas: EstadoReglasVersus; tablero: Omit<EstadoVersusNativo, 'pantalla'>; ganador: 'plantas' | 'zombis' | null; pausa: boolean }
const eleccionSegura = (v: unknown): v is EleccionVersus => {
    const e = v as EleccionVersus;
    return !!e && e.version === 1 && typeof e.sesion === 'string' && e.sesion.length >= 8 && e.sesion.length <= 80 && Number.isInteger(e.zona) && e.zona >= 0 && e.zona < ESCENARIOS_HISTORIA_PVZ.length
        && Array.isArray(e.semillas) && e.semillas.length >= 1 && e.semillas.length <= 8 && new Set(e.semillas).size === e.semillas.length && e.semillas.every(s => SEMILLAS.includes(s));
};

export async function montarVersusNativo() {
    const amigo = esModoAmigo(), perfil = amigo ? 'amigos' : 'pareja', atlas = new AtlasPvZ(), retratos = new RetratosPvZ(atlas);
    document.body.dataset.conquista = '1';
    document.title = 'La Semilla Madre · Versus';
    const root = document.createElement('main');
    root.id = 'cq-app';
    root.className = 'vs-app';
    document.body.append(root);
    const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
    let pantalla: Pantalla = 'menu', rol: Rol = 'local', sala: Sala | null = null, quitarSala: (() => void)[] = [];
    let zona = 0, semillas: SemillaNativa[] = ['girasol', 'lanzaguisantes', 'nuez', 'petacereza', 'patatapum', 'hielaguisantes'];
    let frente: FrenteGardendless | null = null, config: ConfigDefensaNativa | null = null, reglas: ReglasVersus | null = null, sesion = '';
    let tablero: EstadoVersusNativo | null = null, anteriorTablero: EstadoVersusNativo | null = null, llegada = 0;
    let elegido: string | null = null, ganador: 'plantas' | 'zombis' | null = null, pausa = false, aviso = '', avisoHasta = 0;
    let raf = 0, anterior = performance.now(), acumulado = 0, enPaso = false, ultimoEstado = 0, n = 0, ultimaFoto = -1, muerto = false, generacion = 0, envios = 0;
    await Promise.all([atlas.cargar(undefined, ['dia', 'noche', 'piscina', 'niebla', 'tripitidora', 'ropa', 'protegidos', 'especiales', 'agua']), cargarRetratosNativos().catch(() => undefined)]);
    const nombrePlanta = (t: SemillaNativa) => nombrePlantaCatalogo(t, PLANTAS_PVZ[t] ? nombreSemillaNativa(t, PLANTAS_PVZ[t].nombre) : undefined);
    const imgPlanta = (t: string) => { try { return ARTE_PLANTAS_PVZ[t] ? retratos.planta(t) : retratoPlantaNativa(t); } catch { return ''; } };
    const imgZombi = (t: string) => { try { return retratos.zombi(t); } catch { return ''; } };
    function noticia(t: string, ms = 2600) { aviso = t; avisoHasta = performance.now() + ms; const e = root.querySelector('.vs-aviso'); if (e) { e.textContent = t; (e as HTMLElement).hidden = false; } }
    function volverJardin() { const u = new URL('jardin.html', location.href); u.search = ''; u.searchParams.set('modo', 'conquista'); location.href = u.href; }

    // ------------------------------------------------------------------ menús
    function menu(mensaje = '') {
        cerrarPartida(); salirSala(); pantalla = 'menu'; rol = 'local';
        root.innerHTML = `<section class="vs-menu"><header><small>PLANTAS CONTRA ZOMBIS</small><h1>Versus</h1><p>Una persona siembra plantas; la otra manda zombis. Las plantas ganan si resisten ${reloj(VERSUS.duracion)} minutos; los zombis, si uno llega a la casa.</p></header>
        <div class="vs-opciones"><button data-vs="local"><b>En este dispositivo</b><span>Las plantas juegan en el tablero; los zombis, con la barra de la derecha.</span></button>
        <button data-vs="crear"><b>Crear sala</b><span>Tú siembras plantas. Comparte el código con quien lleve los zombis.</span></button>
        <form class="vs-unirse"><label><b>Unirse con código</b><span>Llevas los zombis desde otro dispositivo.</span><input name="codigo" maxlength="8" autocomplete="off" placeholder="CÓDIGO" aria-label="Código de la sala"></label><button>Entrar</button></form></div>
        ${mensaje ? `<p class="vs-error" role="alert">${esc(mensaje)}</p>` : ''}<button class="vs-volver" data-vs="volver">Volver al Jardín</button></section>`;
    }
    function preparar() {
        pantalla = 'preparar';
        const esc0 = escenarioHistoriaPvZ(zona).nivel;
        root.innerHTML = `<section class="vs-preparar"><header><button class="vs-volver" data-vs="${rol === 'anfitrion' ? 'salir-sala' : 'menu'}">Atrás</button><div><small>${rol === 'anfitrion' ? 'SALA ' + esc(sala?.codigo ?? '') + ' · TÚ LLEVAS LAS PLANTAS' : 'VERSUS EN ESTE DISPOSITIVO'}</small><h1>Prepara el duelo</h1></div><button class="vs-principal" data-vs="jugar" ${semillas.length ? '' : 'disabled'}>¡A jugar!</button></header>
        <h2>Escenario</h2><div class="vs-escenarios">${ESCENARIOS_HISTORIA_PVZ.map(e => { const nv = e.nivel; return `<button data-zona="${e.id}" aria-pressed="${e.id === zona}"><b>${esc(e.nombre)}</b><span>${nv.tablero!.filas} carriles${nv.filasAgua?.length ? ' · agua' : ''}${nv.sinSolCielo ? ' · noche' : ''}</span></button>`; }).join('')}</div>
        <h2>Semillas de las plantas <small>${semillas.length} / 8</small></h2><div class="vs-semillas">${SEMILLAS.map(t => `<button data-semilla="${t}" aria-pressed="${semillas.includes(t)}" title="${esc(nombrePlanta(t))}"><img src="${imgPlanta(t)}" alt=""><span>${esc(nombrePlanta(t))}</span></button>`).join('')}</div>
        <h2>Zombis disponibles</h2><div class="vs-zombis-lista">${new ReglasVersus(esc0.filasAgua ?? [], esc0.tablero!.filas).disponibles().map(z => `<figure><img src="${imgZombi(z.propio)}" alt=""><figcaption>${esc(z.nombre)}<span>🧠 ${z.coste}</span></figcaption></figure>`).join('')}</div></section>`;
    }
    function esperando(texto: string) {
        pantalla = 'esperando';
        root.innerHTML = `<section class="vs-carga"><small>SALA ${esc(sala?.codigo ?? '')} · TÚ LLEVAS LOS ZOMBIS</small><h1>${esc(texto)}</h1><button class="vs-volver" data-vs="salir-sala">Salir de la sala</button></section>`;
    }

    // ------------------------------------------------------------------ salas
    function salirSala() { for (const q of quitarSala) q(); quitarSala = []; sala?.salir(); sala = null; }
    async function conectar(crear: boolean, codigo = '') {
        const g = ++generacion;
        pantalla = 'sala';
        root.innerHTML = '<section class="vs-carga"><small>VERSUS EN COMPAÑÍA</small><h1>Abriendo la sala…</h1></section>';
        try {
            const [{ crearSala, unirseSala, normalizarCodigo }, { esperarEnSala }] = await Promise.all([import('../../salas/sala'), import('../../salas/espera')]);
            const s = crear ? await crearSala({ juego: 'versus-nativo', max: 2, yo: { nombre: 'Jardinero', tipo: 'amigo' } }) : await unirseSala(normalizarCodigo(codigo), 'versus-nativo', { nombre: 'Zombi', tipo: 'amigo' });
            if (muerto || g !== generacion) { s.salir(); return; }
            sala = s; rol = s.soyAnfitrion ? 'anfitrion' : 'invitado';
            root.innerHTML = '';
            const espera = esperarEnSala({ sala: s, contenedor: root, titulo: 'La Semilla Madre · Versus', subtitulo: 'Quien crea la sala siembra plantas; quien se une manda zombis.', tema: 'oscuro', retrato: j => `<img alt="" src="${imgZombi('caracono')}" style="${j.puesto === 0 ? 'display:none' : ''}">${j.puesto === 0 ? `<img alt="" src="${imgPlanta('lanzaguisantes')}">` : ''}`, detalle: j => j.puesto === 0 ? '☘ Plantas' : '☠ Zombis', alEmpezar: () => true, invitacion: c => 'Abre el Versus de La Semilla Madre y únete con el código ' + c });
            const r = await espera.resultado;
            if (muerto || g !== generacion) return;
            if (r.que === 'salir') { menu(r.motivo ?? ''); return; }
            escucharSala(s);
            if (rol === 'anfitrion') preparar(); else esperando('El jardinero está eligiendo semillas…');
        } catch (e) { if (g === generacion) menu((e as Error).message); }
    }
    function escucharSala(s: Sala) {
        const otro = () => s.jugadores.find(j => j.id !== s.yo.id);
        quitarSala.push(
            s.al('vs:eleccion', (d, de) => { if (rol !== 'invitado' || de.puesto !== 0 || !eleccionSegura(d)) return; sesion = d.sesion; zona = d.zona; semillas = d.semillas; ultimaFoto = -1; empezarInvitado(); }),
            s.al('vs:foto', (d, de) => {
                const f = d as FotoVersus;
                if (rol !== 'invitado' || de.puesto !== 0 || f?.sesion !== sesion || !Number.isSafeInteger(f.n) || f.n <= ultimaFoto || !f.tablero || !Array.isArray(f.tablero.zombis) || f.tablero.zombis.length > 200 || !Array.isArray(f.tablero.plantas) || f.tablero.plantas.length > 200) return;
                ultimaFoto = f.n; anteriorTablero = tablero; tablero = { ...f.tablero, pantalla: { filas: [], derecha: 0, ancho: 0 } }; llegada = performance.now();
                if (reglas) reglas.estado = f.reglas;
                pausa = f.pausa;
                if (f.ganador && !ganador) terminar(f.ganador);
            }),
            s.al('vs:soltar', (d, de) => { const p = d as { sesion: string; tipo: string; fila: number }; if (rol !== 'anfitrion' || de.id !== otro()?.id || p?.sesion !== sesion) return; void soltar(p.tipo, p.fila, true); }),
            s.al('vs:rechazo', (d, de) => { if (rol === 'invitado' && de.puesto === 0 && typeof (d as { texto?: unknown })?.texto === 'string') noticia(String((d as { texto: string }).texto).slice(0, 120)); }),
            s.al('vs:pausa', (d, de) => { if (rol === 'anfitrion' && de.id === otro()?.id && typeof (d as { si?: unknown })?.si === 'boolean') void pausar((d as { si: boolean }).si); }),
            s.al('vs:otra', (_d, de) => { if (rol === 'invitado' && de.puesto === 0) { cerrarPartida(); esperando('El jardinero está eligiendo semillas…'); } }),
            s.alCorte((cortado) => { if (pantalla === 'juego' && cortado) { noticia('Se cortó la conexión con el otro jugador. El duelo queda en pausa.', 5000); if (rol === 'anfitrion') void pausar(true); } }),
            s.alFin((_m, texto) => { if (!muerto) menu(texto || 'La sala se cerró.'); }),
        );
    }

    // ------------------------------------------------------------------ partida
    function cerrarPartida() { cancelAnimationFrame(raf); raf = 0; const f = frente; frente = null; void f?.cerrar().catch(() => {}); config = null; reglas = null; tablero = anteriorTablero = null; ganador = null; elegido = null; pausa = false; enPaso = false; }
    function plantillaJuego() {
        const zombisHTML = reglas!.disponibles().map(z => `<button class="vs-carta" data-zombi="${z.id}" aria-pressed="false" title="${esc(z.nombre)} · ${z.coste} cerebros"><img src="${imgZombi(z.propio)}" alt=""><span>🧠 ${z.coste}</span><i class="vs-recarga"></i></button>`).join('');
        const cartas = rol !== 'anfitrion';
        root.innerHTML = `<section class="vs-juego vs-con-barra vs-rol-${rol}"><div class="vs-tablero"></div><div class="vs-carriles"></div>
        <aside class="vs-barra" aria-label="${cartas ? 'Zombis' : 'Marcador'}"><div class="vs-hud"><span class="vs-tiempo" title="Tiempo para que ganen las plantas">⏱ ${reloj(VERSUS.duracion)}</span><span class="vs-cerebros" title="Cerebros de los zombis">🧠 ${VERSUS.cerebrosIniciales}</span><div><button class="cq-redondo" data-vs="pausa" aria-label="Pausar">❚❚</button><button class="cq-redondo" data-vs="abandonar" aria-label="Salir del duelo">✕</button></div></div>
        ${cartas ? `<small>ZOMBIS</small>${zombisHTML}<p>Elige un zombi y toca una flecha de carril.</p>` : '<p>Los zombis los manda el otro jugador. Resiste hasta que el reloj llegue a cero.</p>'}</aside>
        <div class="vs-aviso" role="status" hidden></div><div class="vs-capa"></div></section>`;
        pantalla = 'juego';
    }
    async function empezarLocalOAnfitrion() {
        const g = ++generacion;
        sesion = crypto.randomUUID();
        const base = nivelHistoriaNativa(zona, semillas, 4242);
        // En versus las fusiones están disponibles desde el inicio: plantar B sobre A forma la fusión.
        config = { ...base, semillas: semillas.map(nativoDe), oleadas: [[]], versus: true, punto: null, reposo: false, fusiones: FUSIONES_NATIVAS.map(f => f.id) };
        reglas = new ReglasVersus(config.agua, config.filas);
        if (rol === 'anfitrion') sala?.mandar('vs:eleccion', { version: 1, sesion, zona, semillas } satisfies EleccionVersus);
        plantillaJuego();
        $('.vs-capa').innerHTML = '<section class="vs-cargando"><h2>Preparando el jardín…</h2><p>La primera vez descarga el motor; luego queda en caché.</p></section>';
        try {
            frente = new FrenteGardendless($('.vs-tablero'), 'vs', perfil, o => { if (o.fase === 'derrota') terminar('zombis'); }, { historia: true });
            await frente.listo;
            await frente.prepararHistoria(config);
            await frente.iniciarHistoria(config);
            if (muerto || g !== generacion) return;
            $('.vs-capa').innerHTML = '';
            anterior = performance.now(); acumulado = 0;
            raf = requestAnimationFrame(cuadroAnfitrion);
        } catch (e) { if (g === generacion) menu('No se pudo abrir el jardín: ' + (e as Error).message); }
    }
    function empezarInvitado() {
        const nv = escenarioHistoriaPvZ(zona).nivel;
        config = null;
        reglas = new ReglasVersus(nv.filasAgua ?? [], nv.tablero!.filas);
        ganador = null; tablero = anteriorTablero = null;
        plantillaJuego();
        const c = document.createElement('canvas'); c.className = 'vs-lienzo'; $('.vs-tablero').append(c);
        raf = requestAnimationFrame(cuadroInvitado);
    }
    async function pausar(si: boolean) {
        if (pantalla !== 'juego' || ganador) return;
        if (rol === 'invitado') { sala?.mandar('vs:pausa', { si }); return; }
        pausa = si;
        try { if (frente) await (si ? frente.pausa() : frente.reanudar()); } catch { /* el siguiente cuadro lo reintenta */ }
        publicar(true);
    }
    async function soltar(tipo: string, fila: number, remoto = false) {
        if (!reglas || ganador) return;
        if (rol === 'invitado') { sala?.mandar('vs:soltar', { sesion, tipo, fila }); return; }
        const motivo = pausa ? 'El duelo está en pausa.' : reglas.impedimento(tipo, fila);
        const rechazar = (t: string) => { if (remoto) sala?.mandar('vs:rechazo', { texto: t }); else noticia(t); };
        if (motivo) { rechazar(motivo); return; }
        reglas.gastar(tipo);
        try { await frente!.soltarZombi(tipo, fila); } catch (e) { const z = ZOMBIS_VERSUS.find(z => z.id === tipo)!; reglas.estado.cerebros += z.coste; delete reglas.estado.recargas[tipo]; rechazar((e as Error).message); }
        publicar(true);
    }
    function publicar(fiable = false) {
        if (rol !== 'anfitrion' || !sala || !reglas || !tablero) return;
        const ahora = performance.now();
        if (!fiable && ahora - envios < 100) return;
        envios = ahora;
        const { pantalla: _p, ...resto } = tablero; void _p;
        sala.mandar('vs:foto', { sesion, n: ++n, reglas: reglas.estado, tablero: resto, ganador, pausa } satisfies FotoVersus, { rapido: !fiable && !ganador });
    }
    function terminar(quien: 'plantas' | 'zombis') {
        if (ganador) return;
        ganador = quien;
        if (rol !== 'invitado') { void frente?.pausa().catch(() => {}); publicar(true); }
        const mio = rol === 'local' ? null : rol === 'anfitrion' ? 'plantas' : 'zombis';
        const titulo = quien === 'plantas' ? '¡Ganan las plantas!' : '¡Ganan los zombis!';
        const sub = mio ? (mio === quien ? 'Ganaste el duelo.' : 'Perdiste esta vez.') : quien === 'plantas' ? 'El jardín resistió hasta el final.' : 'Un zombi llegó a la casa.';
        $('.vs-capa').innerHTML = `<section class="vs-fin vs-fin-${quien}" role="dialog" aria-modal="true"><h2>${titulo}</h2><p>${sub}</p><div>${rol !== 'invitado' ? '<button class="vs-principal" data-vs="otra">Otra partida</button>' : '<p>El jardinero decide si juegan otra.</p>'}<button data-vs="abandonar">Salir</button></div></section>`;
    }

    // ------------------------------------------------------------------ cuadros
    function hud() {
        if (!reglas) return;
        const e = reglas.estado;
        $('.vs-tiempo').textContent = '⏱ ' + reloj(reglas.restante);
        $('.vs-cerebros').textContent = '🧠 ' + e.cerebros;
        for (const b of root.querySelectorAll<HTMLButtonElement>('[data-zombi]')) {
            const z = ZOMBIS_VERSUS.find(z => z.id === b.dataset.zombi)!, r = e.recargas[z.id] ?? 0;
            b.disabled = !!ganador || pausa || e.cerebros < z.coste || r > 0;
            b.setAttribute('aria-pressed', String(elegido === z.id));
            (b.querySelector('.vs-recarga') as HTMLElement).style.height = `${Math.min(100, r / z.recarga * 100)}%`;
        }
        if (elegido && root.querySelector<HTMLButtonElement>(`[data-zombi="${elegido}"]`)?.disabled) elegido = null;
        const pb = root.querySelector('[data-vs="pausa"]'); if (pb) pb.textContent = pausa ? '▶' : '❚❚';
        if (performance.now() > avisoHasta) { const a = root.querySelector<HTMLElement>('.vs-aviso'); if (a) a.hidden = true; }
    }
    /** Flechas de carril alineadas con las filas reales del tablero (solo para quien lleva los zombis). */
    function carriles(filas: number[], derecha: number, alto: number, agua: readonly number[]) {
        const c = $('.vs-carriles');
        if (rol === 'anfitrion') { c.innerHTML = ''; return; }
        const firma = filas.map(y => y.toFixed(3)).join(',') + derecha.toFixed(3) + (elegido ?? '');
        if (c.dataset.firma === firma) return;
        c.dataset.firma = firma;
        const z = ZOMBIS_VERSUS.find(z => z.id === elegido);
        c.innerHTML = filas.map((y, f) => { const sirve = !z || !!z.agua === agua.includes(f); return `<button class="vs-carril ${elegido ? 'vs-activo' : ''}" data-fila="${f}" style="top:${y * 100}%;left:${derecha * 100}%;height:${alto * 100}%" ${sirve ? '' : 'disabled'} aria-label="Carril ${f + 1}">◀</button>`; }).join('');
    }
    const altoCarril = (filas: number[]) => filas.length > 1 ? Math.abs(filas[1] - filas[0]) * .85 : .12;
    async function cuadroAnfitrion(t: number) {
        if (muerto || !frente || !reglas) return;
        const dt = Math.min(.2, Math.max(0, (t - anterior) / 1000)); anterior = t;
        if (!pausa && !ganador) { acumulado = Math.min(.1, acumulado + dt); reglas.avanzar(dt); if (reglas.restante <= 0) terminar('plantas'); }
        if (!enPaso && frente) {
            enPaso = true;
            try {
                const pasos = pausa || ganador ? 0 : Math.min(6, Math.floor(acumulado * 60));
                acumulado -= pasos / 60;
                await frente.pasoHistoria(pasos, true);
                if (t - ultimoEstado > 120) {
                    ultimoEstado = t;
                    tablero = await frente.estadoVersus();
                    if (tablero.ganaron === 'zombis') terminar('zombis');
                    carriles(tablero.pantalla.filas, tablero.pantalla.derecha + tablero.pantalla.ancho * .55, altoCarril(tablero.pantalla.filas), config!.agua);
                    publicar();
                }
            } catch (e) { if (!ganador && frente) noticia((e as Error).message); }
            finally { enPaso = false; }
        }
        hud();
        raf = requestAnimationFrame(cuadroAnfitrion);
    }
    const imagenes = new Map<string, HTMLImageElement>();
    const img = (src: string) => { let i = imagenes.get(src); if (!i) { i = new Image(); i.src = src; imagenes.set(src, i); } return i; };
    function cuadroInvitado() {
        if (muerto || pantalla !== 'juego' || !reglas) return;
        const c = root.querySelector<HTMLCanvasElement>('.vs-lienzo');
        if (c) {
            const caja = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
            if (c.width !== Math.round(caja.width * dpr)) { c.width = Math.round(caja.width * dpr); c.height = Math.round(caja.height * dpr); }
            const ctx = c.getContext('2d')!, W = c.width, H = c.height, nv = escenarioHistoriaPvZ(zona).nivel, filas = nv.tablero!.filas, agua = nv.filasAgua ?? [], noche = !!nv.sinSolCielo;
            const x0 = W * .1, x1 = W * .86, y0 = H * .14, y1 = H * .97, cw = (x1 - x0) / 9, ch = (y1 - y0) / filas;
            ctx.fillStyle = noche ? '#1b2a3a' : '#9fd5ef'; ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = noche ? '#3c3a52' : '#c9a77a'; ctx.fillRect(0, y0, x0, y1 - y0);
            for (let f = 0; f < filas; f++) for (let k = 0; k < 9; k++) {
                const a = agua.includes(f), par = (f + k) % 2 === 0;
                ctx.fillStyle = a ? (par ? '#3f9fd1' : '#4aaee0') : noche ? (par ? '#2f5a3a' : '#376843') : (par ? '#77bf47' : '#86cb52');
                ctx.fillRect(x0 + k * cw, y0 + f * ch, cw + 1, ch + 1);
            }
            ctx.fillStyle = noche ? '#2a2d3d' : '#b9b9b0'; ctx.fillRect(x1, y0, W - x1, y1 - y0);
            const s = tablero, a = anteriorTablero, mezcla = Math.min(1, (performance.now() - llegada) / 110);
            if (s) {
                for (let f = 0; f < filas; f++) if (s.cortacespedes[f]) { ctx.fillStyle = '#d64a3a'; ctx.fillRect(x0 - cw * .45, y0 + f * ch + ch * .55, cw * .35, ch * .22); }
                for (const p of s.plantas) { const src = imgPlanta(PROPIO_PLANTA[p.tipo] ?? ''); if (!src) continue; const im = img(src); if (im.complete && im.naturalWidth) { const h = ch * .82, w = h * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, x0 + (p.col + .5) * cw - w / 2, y0 + (p.fila + .92) * ch - h, w, h); } }
                const zs = [...s.zombis].sort((p, q) => p.fila - q.fila);
                for (const z of zs) {
                    const antes = a?.zombis.find(v => v.tipo === z.tipo && v.fila === z.fila && Math.abs(v.x - z.x) < .5), x = antes ? antes.x + (z.x - antes.x) * mezcla : z.x;
                    const src = imgZombi(PROPIO_ZOMBI[z.tipo] ?? 'zombi'), im = img(src);
                    if (im.complete && im.naturalWidth) { const h = ch * 1.05, w = h * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, x0 + (x + .5) * cw - w / 2, y0 + (z.fila + .95) * ch - h, w, h); }
                }
            }
            carriles(Array.from({ length: filas }, (_, f) => (y0 + (f + .5) * ch) / H), x1 / W, ch / H * .9, agua);
        }
        hud();
        raf = requestAnimationFrame(cuadroInvitado);
    }

    // ------------------------------------------------------------------ entrada
    root.addEventListener('click', e => {
        const el = (e.target as HTMLElement).closest<HTMLElement>('button');
        if (!el) return;
        if (el.dataset.zona) { zona = Number(el.dataset.zona); preparar(); return; }
        if (el.dataset.semilla) { const t = el.dataset.semilla as SemillaNativa; semillas = semillas.includes(t) ? semillas.filter(s => s !== t) : semillas.length < 8 ? [...semillas, t] : semillas; if (semillas.length === 8 && !semillas.includes(t)) noticia('Caben ocho semillas.'); preparar(); return; }
        if (el.dataset.zombi) { elegido = elegido === el.dataset.zombi ? null : el.dataset.zombi; root.querySelector<HTMLElement>('.vs-carriles')!.dataset.firma = ''; return; }
        if (el.dataset.fila) { if (!elegido) { noticia('Primero elige un zombi.'); return; } const tipo = elegido; void soltar(tipo, Number(el.dataset.fila)); return; }
        switch (el.dataset.vs) {
            case 'local': rol = 'local'; preparar(); break;
            case 'crear': void conectar(true); break;
            case 'menu': menu(); break;
            case 'volver': volverJardin(); break;
            case 'salir-sala': menu(); break;
            case 'jugar': if (semillas.length) void empezarLocalOAnfitrion(); break;
            case 'pausa': void pausar(!pausa); break;
            case 'abandonar': if (pantalla === 'juego' && !ganador && !confirm('¿Salir del duelo?')) break; if (rol === 'local') { cerrarPartida(); preparar(); } else menu(); break;
            case 'otra': cerrarPartida(); if (rol === 'anfitrion') sala?.mandar('vs:otra', {}); preparar(); break;
        }
    });
    root.addEventListener('submit', e => { e.preventDefault(); const v = String(new FormData(e.target as HTMLFormElement).get('codigo') ?? '').trim(); if (v) void conectar(false, v); else noticia('Escribe el código de la sala.'); });
    addEventListener('keydown', e => { if (pantalla === 'juego' && e.key === 'Escape') void pausar(!pausa); });
    addEventListener('pagehide', () => { muerto = true; cerrarPartida(); salirSala(); }, { once: true });
    void aviso;
    // Solo pruebas: consultar el estado y adelantar el reloj del duelo sin tocar el motor.
    if (new URLSearchParams(location.search).has('prueba')) (window as unknown as { __vs: unknown }).__vs = { reglas: () => reglas, tablero: () => tablero, ganador: () => ganador, pantalla: () => pantalla, rol: () => rol, adelantar: (s: number) => reglas?.avanzar(s) };
    const codigo = new URLSearchParams(location.search).get('sala');
    if (codigo) void conectar(false, codigo); else menu();
}
