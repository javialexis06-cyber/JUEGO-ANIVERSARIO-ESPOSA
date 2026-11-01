/** Partida del Versus por territorios (pedido de Javier, 1 de noviembre de 2026). Las dos personas se disputan un
 * mapa: cada zona es un tablero de Gardendless con el área y el mundo de la historia, y puede haber varias
 * batallas a la vez. Quien corre los motores (este dispositivo o el anfitrión de la sala, que lleva las plantas)
 * aplica las reglas de `motores/versus-territorios.ts`; el invitado (zombis) ve un tablero dibujado a partir de las
 * fotos que recibe y manda sus órdenes. */
import './historia-nativa.css';
import './versus-territorios.css';
import { FrenteGardendless, type EstadoVersusNativo } from '../motores/frente-gardendless';
import { nivelCampana, FUSIONES_NATIVAS, type ConfigDefensaNativa, type PuntoDescansoNativo } from '../motores/nivel-historia';
import { ReglasTerritorios, VT, type EleccionVT, type EstadoVT, type EventoVT, type Lado } from '../motores/versus-territorios';
import { ZOMBIS_VERSUS, PROPIO_PLANTA, PROPIO_ZOMBI } from '../motores/versus-reglas';
import { AREAS_CAMPANA, PAISES_CAMPANA } from './campana-datos';
import { CapaTerritorios, type EstadoTerritorio } from './territorios';
import { urlArtePvZ } from '../pvz/arte/catalogo';
import { icono } from './iconos';
import type { Sala } from '../../salas/tipos';

export type RolVT = 'local' | 'anfitrion' | 'invitado';
export interface ContextoVT {
    root: HTMLElement; rol: RolVT; sala: Sala | null; perfil: 'pareja' | 'amigos'; eleccion: EleccionVT;
    imgPlanta(t: string): string; imgZombi(t: string): string;
    /** Dejar la partida (en una sala, salir de ella). */
    alSalir(mensaje?: string): void;
    /** Otra partida: el que elige vuelve a preparar y el invitado, a esperar. */
    alOtra(): void;
}
type Zombis = EstadoVersusNativo['zombis'];
type Plantas = EstadoVersusNativo['plantas'];
interface TableroVT { zombis: Zombis; plantas: Plantas; cortacespedes: boolean[]; soles: number; pantalla: EstadoVersusNativo['pantalla'] | null; llegada: number; previo: Zombis | null }
interface MotorVT { motor: FrenteGardendless; caja: HTMLDivElement; zona: number | null; firma: string; uso: number; roto: boolean }
interface FotoVT { sesion: string; n: number; tableros: { zona: number; z: Zombis; p: Plantas; c: boolean[]; s: number }[] }
interface EstadoMsgVT { sesion: string; n: number; estado: EstadoVT; pausa: boolean }

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const reloj = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;
const FUSIONES = FUSIONES_NATIVAS.map(f => f.id);
const MUNDOS: Record<string, string> = { modern: 'Jardín de hoy', egypt: 'Antiguo Egipto', pirate: 'Mares piratas', cowboy: 'Salvaje Oeste', beach: 'Playa grande', ice: 'Edad de hielo', lostcity: 'Ciudad perdida', future: 'Futuro lejano', eighties: 'Años ochenta', dino: 'Era jurásica', sky: 'Ciudad del cielo', dark: 'Edad oscura' };
/** Colores del césped dibujado (vista del invitado y tablero objetivo) según el mundo de la zona. */
const CESPED: Record<string, [string, string, string]> = {
    modern: ['#77bf47', '#86cb52', '#c9a77a'], egypt: ['#d9b26a', '#e3be78', '#b7854a'], pirate: ['#a8743f', '#b5824a', '#7c5530'], cowboy: ['#c9a35a', '#d4ad63', '#9c7a3e'],
    beach: ['#e6cf8e', '#eed899', '#c7a866'], ice: ['#bfe3ef', '#cdebf5', '#8fb9cc'], lostcity: ['#6aa84f', '#78b75a', '#8a7a4a'], future: ['#8fa3b5', '#9db1c3', '#5f7385'],
    eighties: ['#6d4a8f', '#7a559d', '#3c2a55'], dino: ['#7ab04a', '#88bd55', '#6b5a35'], sky: ['#cfe6f7', '#dceef9', '#9cbfdc'], dark: ['#4a3f5c', '#544869', '#2b2438'],
};
const ligero = ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4;

export function jugarTerritorios(cx: ContextoVT) {
    const { root, rol, sala, eleccion } = cx, sesion = eleccion.sesion, prueba = new URLSearchParams(location.search).has('prueba');
    const reglas = new ReglasTerritorios(eleccion, { maxTotal: ligero ? 4 : VT.maxTotal });
    const maxMotores = reglas.maxTotal;
    const motores: MotorVT[] = [], puntos = new Map<number, PuntoDescansoNativo>(), tableros = new Map<number, TableroVT>(), cerrando = new Set<number>();
    const quitar: (() => void)[] = [], capa = new CapaTerritorios(), fondo = urlArtePvZ('mapa-pais.webp');
    let vista: number | 'mapa' = 'mapa', objetivo: number | null = null, elegido: string | null = null, seleccion: number | null = null;
    let pausa = rol !== 'invitado', intro = true, finMostrado = false, muerto = false, raf = 0, anterior = performance.now(), acumulado = 0, enPaso = false;
    let ultimaConsulta = 0, ultimoRefresco = 0, ultimoEstadoMsg = 0, nEstado = 0, nFoto = 0, ultimoEstadoRecibido = -1, ultimaFotoRecibida = -1, contadorMotores = 0;
    let firmaMapa = '', firmaPines = '', firmaLista = '', firmaChips = '', firmaCarriles = '', avisoHasta = 0, pedido: number | null = null, filaEncima: number | null = null;
    const vistasBatalla = new Set<number>();
    const yo: Lado | null = rol === 'anfitrion' ? 'plantas' : rol === 'invitado' ? 'zombis' : null;
    const zombisMazo = reglas.disponibles();
    const nombre = (z: number) => z === 0 ? 'La casa' : eleccion.zonas[z].base === 'zombis' ? 'La guarida zombi' : AREAS_CAMPANA[eleccion.zonas[z].area].nombre;
    const mundo = (z: number) => PAISES_CAMPANA[AREAS_CAMPANA[eleccion.zonas[z].area].pais];
    const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
    const imagenes = new Map<string, HTMLImageElement>();
    const img = (src: string) => { let i = imagenes.get(src); if (!i) { i = new Image(); i.src = src; imagenes.set(src, i); } return i; };
    const srcPlanta = (t: string) => cx.imgPlanta(PROPIO_PLANTA[t] ?? t);
    const srcZombi = (t: string) => cx.imgZombi(PROPIO_ZOMBI[t] ?? 'zombi');

    // ------------------------------------------------------------------ esqueleto
    root.innerHTML = `<section class="vt-juego vt-rol-${rol}">
      <div class="vt-escena">
        <div class="vt-mapa"><div class="vt-mapa-fondo" style="background-image:url('${fondo}')"></div><div class="cq-cartografia" style="background-image:url('${fondo}')"><svg class="vt-rutas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg><div class="hn-pines"></div></div>
          <div class="vt-leyenda" aria-label="Leyenda"><span class="vt-l-plantas">Plantas</span><span class="vt-l-neutral">Neutral</span><span class="vt-l-zombis">Zombis</span><span class="vt-l-alcance">Puedes atacar</span></div></div>
        <div class="vt-motores"></div>
        <canvas class="vt-lienzo vt-oculto" aria-label="Tablero de la batalla"></canvas>
        <div class="vt-cargando vt-oculto"><b></b><span>Abriendo el tablero de esta zona…</span></div>
        <div class="vt-carriles"></div>
        ${rol !== 'invitado' ? '<nav class="vt-frentes" aria-label="Batallas de las plantas"></nav>' : ''}
        <div class="vt-ficha" hidden></div>
        <div class="vt-aviso" role="status" hidden></div>
        <div class="vt-capa"></div>
      </div>
      <aside class="vt-barra">
        <div class="vt-hud"><div><small>${rol === 'local' ? 'MISMO DISPOSITIVO' : rol === 'anfitrion' ? 'SALA ' + esc(sala?.codigo ?? '') + ' · PLANTAS' : 'SALA ' + esc(sala?.codigo ?? '') + ' · ZOMBIS'}</small><span class="vt-reloj" title="Tiempo que queda de partida">⏱ ${reloj(eleccion.duracion)}</span></div>
          <div class="vt-botones"><button class="cq-redondo" data-vt="pausa" aria-label="Pausar" title="Pausar (Esc)">${icono('pausa')}</button><button class="cq-redondo" data-vt="salir" aria-label="Salir de la partida" title="Salir">${icono('salir')}</button></div>
          <div class="vt-cuenta" aria-label="Zonas de cada bando"></div></div>
        ${rol !== 'anfitrion' ? `<section class="vt-zombis"><header><b>Zombis</b><span class="vt-cerebros" title="Cerebros">🧠 ${VT.cerebrosIniciales}</span></header>
          <div class="vt-cartas">${zombisMazo.map(z => `<button class="vs-carta" data-vt-zombi="${z.id}" aria-pressed="false" title="${esc(z.nombre)} · ${z.coste} cerebros${z.agua ? ' · solo agua' : ''}"><img src="${cx.imgZombi(z.propio)}" alt=""><span>🧠 ${z.coste}</span><i class="vs-recarga"></i></button>`).join('')}</div>
          <small class="vt-ingreso"></small></section>` : ''}
        ${rol === 'local' ? '<section class="vt-objetivo"><header><b class="vt-objetivo-nombre">Sin batalla</b><span class="vt-objetivo-reloj"></span></header><canvas class="vt-mini" aria-label="Tablero donde sueltan los zombis"></canvas><small>Zombis: elige uno y toca un carril de este tablero.</small></section>' : ''}
        <section class="vt-batallas"><header><b>Batallas</b><small class="vt-cupo"></small></header><div class="vt-lista"></div></section>
        <p class="vt-ayuda">${rol === 'invitado' ? 'Toca una zona vecina de las tuyas en el mapa para invadirla. En una batalla, elige un zombi y toca un carril.' : rol === 'anfitrion' ? 'Toca una zona vecina de las tuyas para mandar una expedición. Resiste el reloj de cada batalla para quedarte la zona.' : 'Toca una zona del mapa para atacarla. Las plantas siembran en el tablero grande; los zombis, en el tablero de esta barra.'}</p>
      </aside></section>`;
    const cart = $('.cq-cartografia');
    cart.prepend(capa.lienzo);

    // ------------------------------------------------------------------ utilidades de vista
    function noticia(t: string, ms = 3000) { const a = $('.vt-aviso'); a.textContent = t; a.hidden = false; avisoHasta = performance.now() + ms; }
    function estadoZona(id: number): EstadoTerritorio {
        const d = reglas.estado.duenos[id], b = !!reglas.batalla(id);
        return d === 'plantas' ? (b ? 'atacada' : 'plantas') : d === 'zombis' ? (b ? 'recuperable' : 'zombis') : (b ? 'disputa' : 'neutral');
    }
    /** Qué bandos pueden atacar esa zona desde este dispositivo. */
    const ladosPropios = (): Lado[] => yo ? [yo] : ['plantas', 'zombis'];
    const alcance = (id: number) => ladosPropios().some(l => reglas.impedimentoAtaque(l, id) === null);
    function pintarMapa() {
        const zonas = eleccion.zonas.map(z => ({ id: z.id, x: z.x, y: z.y, estado: estadoZona(z.id) }));
        const firma = zonas.map(z => z.estado).join(',');
        if (firma !== firmaMapa) { firmaMapa = firma; void capa.pintar('vt:' + sesion, fondo, zonas, eleccion.semilla % 1000); }
        const e = reglas.estado;
        // Rutas entre zonas vecinas: verdes entre plantas, moradas entre zombis.
        const rutas: string[] = [];
        for (const z of eleccion.zonas) for (const v of z.vecinos) if (v > z.id) {
            const a = e.duenos[z.id], b = e.duenos[v], clase = a && a === b ? a : 'libre', w = eleccion.zonas[v];
            rutas.push(`<line class="vt-ruta vt-ruta-${clase}" x1="${z.x}" y1="${z.y}" x2="${w.x}" y2="${w.y}"/>`);
        }
        const svg = cart.querySelector('.vt-rutas')!, htmlRutas = rutas.join('');
        if (svg.innerHTML !== htmlRutas) svg.innerHTML = htmlRutas;
        const pines = eleccion.zonas.map(z => {
            const d = e.duenos[z.id], b = reglas.batalla(z.id), clase = d ?? 'neutral';
            return `${z.id}:${clase}:${b ? b.iniciador + (b.lista ? 1 : 0) : ''}:${e.espera[z.id] > 0 ? 1 : 0}:${alcance(z.id) ? 1 : 0}:${seleccion === z.id ? 1 : 0}`;
        }).join('|');
        if (pines !== firmaPines) {
            firmaPines = pines;
            cart.querySelector('.hn-pines')!.innerHTML = eleccion.zonas.map(z => {
                const d = e.duenos[z.id], b = reglas.batalla(z.id), a = AREAS_CAMPANA[z.area];
                const simbolo = b ? 'atacar' : z.base === 'plantas' ? 'historia' : z.base === 'zombis' ? 'alerta' : d === 'plantas' ? 'escudo' : d === 'zombis' ? 'alerta' : 'pais';
                return `<button class="cq-pin vt-pin vt-pin-${d ?? 'neutral'} ${b ? 'vt-pin-batalla' : ''} ${z.base ? 'vt-pin-base' : ''} ${alcance(z.id) ? 'vt-pin-alcance' : ''} ${seleccion === z.id ? 'vt-pin-elegida' : ''}" data-vt-zona="${z.id}" style="--x:${z.x}%;--y:${z.y}%" aria-label="${esc(nombre(z.id))}, ${a.filas} carriles"><span class="cq-emblema">${icono(simbolo)}</span><b>${esc(nombre(z.id))}</b><i class="hn-chip" data-vt-chip="${z.id}"></i></button>`;
            }).join('');
        }
        for (const z of eleccion.zonas) {
            const chip = cart.querySelector<HTMLElement>(`[data-vt-chip="${z.id}"]`);
            if (!chip) continue;
            const b = reglas.batalla(z.id), a = AREAS_CAMPANA[z.area];
            chip.textContent = b ? (b.lista ? `⚔️ ${reloj(b.duracion - b.t)}` : '⚔️ Preparando…') : e.espera[z.id] > 0 ? `⏳ ${Math.ceil(e.espera[z.id])} s` : z.base === 'plantas' ? 'Base de las plantas' : z.base === 'zombis' ? 'Base de los zombis' : `${MUNDOS[mundo(z.id).mundo] ?? ''} · ${a.filas} carriles`;
        }
    }
    function pintarFicha() {
        const f = $('.vt-ficha');
        if (seleccion === null || vista !== 'mapa') { f.hidden = true; return; }
        const z = eleccion.zonas[seleccion], a = AREAS_CAMPANA[z.area], d = reglas.estado.duenos[z.id], b = reglas.batalla(z.id), p = mundo(z.id);
        const accion = (l: Lado) => { const m = reglas.impedimentoAtaque(l, z.id); return `<button class="vt-atacar vt-atacar-${l}" data-vt-atacar="${l}" ${m ? 'disabled' : ''} title="${esc(m ?? '')}">${l === 'plantas' ? '🌱 Atacar con las plantas' : '🧟 Atacar con los zombis'}</button>${m ? `<small class="vt-motivo">${esc(m)}</small>` : ''}`; };
        const dueno = d === 'plantas' ? '<li class="vt-d-plantas">🌱 De las plantas</li>' : d === 'zombis' ? '<li class="vt-d-zombis">🧟 De los zombis</li>' : '<li>⚪ Neutral</li>';
        const extra = z.base === 'plantas' ? 'Si los zombis la toman, ganan la partida.' : z.base === 'zombis' ? 'Si las plantas la toman, ganan la partida. Tiene una guarnición fuerte.' : d === 'zombis' ? 'Zona zombi: si las plantas la atacan, su guarnición suelta zombis.' : puntos.has(z.id) ? 'Las plantas conservan aquí su defensa.' : 'Quien gane la batalla se queda la zona.';
        f.innerHTML = `<header><div><small>${esc(p.nombre)} · ${esc(MUNDOS[p.mundo] ?? '')}</small><b>${esc(nombre(z.id))}</b></div><button class="vt-cerrar" data-vt="cerrar-ficha" aria-label="Cerrar">×</button></header>
          <ul class="vt-datos"><li>🌿 ${a.filas} carriles</li>${a.agua.length ? '<li>💧 Agua</li>' : ''}${a.noche ? '<li>🌙 Noche</li>' : ''}${dueno}<li>⏱ ${reloj(reglas.duracionDe(z.id))}</li></ul>
          <p>${esc(extra)}</p>
          <div class="vt-acciones">${b ? `<button class="vt-ver" data-vt-ver="${z.id}">⚔️ Ver la batalla</button>` : ladosPropios().map(accion).join('')}</div>`;
        f.hidden = false;
    }
    function pintarEscena() {
        const enMapa = vista === 'mapa';
        $('.vt-mapa').classList.toggle('vt-oculto', !enMapa);
        for (const m of motores) m.caja.classList.toggle('vt-oculto', rol === 'invitado' || m.zona !== vista || enMapa);
        $('.vt-lienzo').classList.toggle('vt-oculto', !(rol === 'invitado' && !enMapa));
        const b = enMapa ? undefined : reglas.batalla(vista as number), cargando = $('.vt-cargando');
        cargando.classList.toggle('vt-oculto', enMapa || !b || b.lista || rol === 'invitado' && tableros.has(vista as number));
        if (!enMapa) cargando.querySelector('b')!.textContent = nombre(vista as number);
        if (enMapa) { $('.vt-carriles').innerHTML = ''; firmaCarriles = ''; }
        pintarFicha();
        if (enMapa) pintarMapa();
        const m = motores.find(x => x.zona === vista);
        if (m && rol !== 'invitado') void m.motor.pasoHistoria(0, true).catch(() => {});
    }
    function ver(v: number | 'mapa') {
        if (v !== 'mapa' && !reglas.batalla(v)) v = 'mapa';
        vista = v;
        if (v !== 'mapa') { seleccion = null; if (rol === 'invitado') objetivo = v; }
        pintarEscena(); refrescar(true);
    }

    // ------------------------------------------------------------------ marcador y barra
    function refrescar(forzar = false) {
        const ahora = performance.now();
        if (!forzar && ahora - ultimoRefresco < 200) return;
        ultimoRefresco = ahora;
        const e = reglas.estado, batallas = e.batallas;
        $('.vt-reloj').textContent = '⏱ ' + reloj(reglas.restante);
        $('.vt-cuenta').innerHTML = `<span class="vt-c-plantas" title="Zonas de las plantas">🌱 ${reglas.zonasDe('plantas')}</span><span class="vt-c-neutral" title="Zonas neutrales">⚪ ${reglas.zonasDe(null)}</span><span class="vt-c-zombis" title="Zonas de los zombis">🧟 ${reglas.zonasDe('zombis')}</span>`;
        const pb = root.querySelector<HTMLElement>('[data-vt="pausa"]');
        if (pb) { const v = pausa ? '▶' : icono('pausa'); if (pb.dataset.v !== String(pausa)) { pb.dataset.v = String(pausa); pb.innerHTML = v; } pb.setAttribute('aria-label', pausa ? 'Seguir' : 'Pausar'); }
        if (rol !== 'anfitrion') {
            $('.vt-cerebros').textContent = '🧠 ' + Math.floor(e.cerebros);
            $('.vt-ingreso').textContent = `+${reglas.ingreso()} 🧠 cada ${VT.cadaSegundos} s`;
            const zonaZ = rol === 'invitado' ? (vista === 'mapa' ? null : vista) : objetivo;
            for (const b of root.querySelectorAll<HTMLButtonElement>('[data-vt-zombi]')) {
                const z = ZOMBIS_VERSUS.find(x => x.id === b.dataset.vtZombi)!, r = e.recargas[z.id] ?? 0;
                b.disabled = !!e.ganador || pausa || e.cerebros < z.coste || r > 0 || zonaZ === null;
                b.setAttribute('aria-pressed', String(elegido === z.id));
                (b.querySelector('.vs-recarga') as HTMLElement).style.height = `${Math.min(100, r / z.recarga * 100)}%`;
            }
            if (elegido && root.querySelector<HTMLButtonElement>(`[data-vt-zombi="${elegido}"]`)?.disabled && (e.cerebros < (ZOMBIS_VERSUS.find(x => x.id === elegido)?.coste ?? 0) || e.recargas[elegido])) elegido = null;
        }
        // En este dispositivo, el tablero objetivo de los zombis sigue a la batalla más reciente si no hay otro.
        if (objetivo !== null && !reglas.batalla(objetivo)) objetivo = null;
        if (rol === 'local' && objetivo === null && batallas.length) objetivo = [...batallas].sort((a, b) => (b.iniciador === 'zombis' ? 1 : 0) - (a.iniciador === 'zombis' ? 1 : 0) || b.id - a.id)[0].zona;
        if (rol === 'local') {
            const b = objetivo === null ? undefined : reglas.batalla(objetivo);
            $('.vt-objetivo-nombre').textContent = b ? '🎯 ' + nombre(b.zona) : 'Sin batalla';
            $('.vt-objetivo-reloj').textContent = b ? (b.lista ? reloj(b.duracion - b.t) : 'Preparando…') : '';
        }
        $('.vt-cupo').textContent = `${batallas.length}/${reglas.maxTotal}`;
        // Lista de batallas: se rehace solo si cambian; reloj y barra se actualizan en su sitio (un clic no se pierde).
        const firma = batallas.map(b => `${b.zona}:${b.iniciador}:${b.lista ? 1 : 0}:${b.fin ?? ''}`).join('|') + '/' + (rol === 'local' ? objetivo : vista);
        const lista = $('.vt-lista');
        if (firma !== firmaLista) {
            firmaLista = firma;
            lista.innerHTML = batallas.length ? batallas.map(b => {
                const sel = rol === 'local' ? objetivo === b.zona : vista === b.zona;
                return `<button class="vt-fila vt-de-${b.iniciador} ${sel ? 'vt-activo' : ''}" data-vt-batalla="${b.zona}"><span class="vt-fila-nombre">${b.iniciador === 'plantas' ? '🌱' : '🧟'} ${esc(nombre(b.zona))}</span><span class="vt-fila-reloj" data-vt-reloj="${b.zona}"></span><small data-vt-detalle="${b.zona}"></small><i class="vt-barrita" data-vt-barra="${b.zona}"></i></button>`;
            }).join('') : '<p class="vt-vacia">No hay batallas. Ataca una zona desde el mapa.</p>';
        }
        for (const b of batallas) {
            const t = tableros.get(b.zona), r = lista.querySelector<HTMLElement>(`[data-vt-reloj="${b.zona}"]`), d = lista.querySelector<HTMLElement>(`[data-vt-detalle="${b.zona}"]`), br = lista.querySelector<HTMLElement>(`[data-vt-barra="${b.zona}"]`);
            if (r) r.textContent = b.fin ? (b.fin === 'plantas' ? 'Resistió' : 'Cayó') : b.lista ? reloj(b.duracion - b.t) : 'Preparando…';
            if (d) d.textContent = t ? `🧟 ${t.zombis.length} · 🌱 ${t.plantas.length} · 🚜 ${t.cortacespedes.filter(Boolean).length}${b.guarnicion ? ' · guarnición' : ''}` : b.guarnicion ? 'Con guarnición zombi' : '';
            if (br) br.style.setProperty('--p', `${Math.round(b.t / b.duracion * 100)}%`);
        }
        if (rol !== 'invitado') {
            const chips = $('.vt-frentes'), fc = batallas.map(b => `${b.zona}:${b.iniciador}`).join('|') + '/' + vista;
            if (fc !== firmaChips) {
                firmaChips = fc;
                chips.innerHTML = `<button class="vt-chip vt-chip-mapa ${vista === 'mapa' ? 'vt-activo' : ''}" data-vt-ver="mapa">${icono('mapa')}<b>Mapa</b></button>` + batallas.map(b => `<button class="vt-chip vt-de-${b.iniciador} ${vista === b.zona ? 'vt-activo' : ''}" data-vt-ver="${b.zona}" title="${esc(nombre(b.zona))}">${icono('atacar')}<b>${esc(nombre(b.zona))}</b><span data-vt-chipreloj="${b.zona}"></span><i class="vt-barrita" data-vt-chipbarra="${b.zona}"></i></button>`).join('');
            }
            for (const b of batallas) {
                const s = chips.querySelector<HTMLElement>(`[data-vt-chipreloj="${b.zona}"]`), br = chips.querySelector<HTMLElement>(`[data-vt-chipbarra="${b.zona}"]`), t = tableros.get(b.zona);
                if (s) s.textContent = b.lista ? reloj(b.duracion - b.t) : '…';
                if (br) br.style.setProperty('--p', `${Math.round(b.t / b.duracion * 100)}%`);
                // Aviso de peligro: zombis cerca de la casa de ese tablero.
                chips.querySelector(`[data-vt-ver="${b.zona}"]`)?.classList.toggle('vt-peligro', !!t?.zombis.some(z => z.x < 2.5));
            }
        }
        if (vista === 'mapa') { pintarMapa(); if (seleccion !== null) actualizarFichaSinRehacer(); }
        if (performance.now() > avisoHasta) $('.vt-aviso').hidden = true;
    }
    /** La ficha abierta se rehace solo si cambia lo que permite hacer (para no comerse un toque). */
    let firmaFicha = '';
    function actualizarFichaSinRehacer() {
        if (seleccion === null) return;
        const id = seleccion, f = `${id}:${reglas.estado.duenos[id]}:${!!reglas.batalla(id)}:${ladosPropios().map(l => reglas.impedimentoAtaque(l, id)).join(';')}`;
        if (f !== firmaFicha) { firmaFicha = f; pintarFicha(); }
    }

    // ------------------------------------------------------------------ tableros dibujados (invitado y objetivo)
    /** Césped de cada dibujo, para que los toques caigan en el carril que se ve. */
    const geometria = new WeakMap<HTMLCanvasElement, { y0: number; y1: number; H: number }>();
    const fondos = img(urlArtePvZ('fondos-mundos.webp'));
    function dibujar(c: HTMLCanvasElement, zona: number | null) {
        const caja = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
        if (!caja.width || !caja.height) return;
        if (c.width !== Math.round(caja.width * dpr) || c.height !== Math.round(caja.height * dpr)) { c.width = Math.round(caja.width * dpr); c.height = Math.round(caja.height * dpr); }
        const g = c.getContext('2d')!, W = c.width, H = c.height;
        g.clearRect(0, 0, W, H);
        if (zona === null) { g.fillStyle = '#183424'; g.fillRect(0, 0, W, H); g.fillStyle = '#cfe7b5'; g.font = `900 ${Math.round(13 * dpr)}px Nunito`; g.textAlign = 'center'; g.fillText('Sin batalla abierta', W / 2, H / 2); return; }
        const a = AREAS_CAMPANA[eleccion.zonas[zona].area], filas = a.filas, colores = CESPED[mundo(zona).mundo] ?? CESPED.modern;
        // Fondo: el jardín ilustrado de día o de noche (fondos-mundos.webp), con el tinte del mundo de la zona.
        let x0 = W * .1, x1 = W * .9, y0 = H * .05, y1 = H * .97;
        if (fondos.complete && fondos.naturalWidth) {
            const qw = fondos.naturalWidth / 2, qh = fondos.naturalHeight / 2, e = Math.max(W / qw, H / qh), ox = (W - qw * e) / 2, oy = (H - qh * e) / 2;
            g.drawImage(fondos, a.noche ? qw : 0, 0, qw, qh, ox, oy, qw * e, qh * e);
            x0 = ox + .225 * qw * e; x1 = ox + .925 * qw * e; y0 = oy + .255 * qh * e; y1 = oy + .955 * qh * e;
            x0 = Math.max(x0, W * .08); x1 = Math.min(x1, W * .9); y0 = Math.max(y0, H * .03); y1 = Math.min(y1, H * .98);
        } else { g.fillStyle = a.noche ? '#1b2333' : '#9fd5ef'; g.fillRect(0, 0, W, H); g.fillStyle = colores[2]; g.fillRect(0, y0, x0, y1 - y0); }
        const cw = (x1 - x0) / 9, ch = (y1 - y0) / filas;
        geometria.set(c, { y0, y1, H });
        const z = elegido ? ZOMBIS_VERSUS.find(q => q.id === elegido) : null;
        for (let f = 0; f < filas; f++) for (let k = 0; k < 9; k++) {
            const agua = a.agua.includes(f), par = (f + k) % 2 === 0;
            g.globalAlpha = agua ? .85 : .32;
            g.fillStyle = agua ? (par ? '#3f9fd1' : '#4aaee0') : (par ? colores[0] : colores[1]);
            g.fillRect(x0 + k * cw, y0 + f * ch, cw + 1, ch + 1);
        }
        g.globalAlpha = 1;
        g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = Math.max(1, dpr);
        for (let f = 1; f < filas; f++) { g.beginPath(); g.moveTo(x0, y0 + f * ch); g.lineTo(x1, y0 + f * ch); g.stroke(); }
        // Carriles: el que está bajo el dedo se ilumina; los que no sirven para el zombi elegido se apagan.
        for (let f = 0; f < filas; f++) {
            const sirve = !z || !!z.agua === a.agua.includes(f);
            if (!sirve) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x0, y0 + f * ch, W - x0, ch); }
            else if (z && filaEncima === f && c.matches(':hover')) { g.fillStyle = 'rgba(255,225,74,.32)'; g.fillRect(x0, y0 + f * ch, W - x0, ch); }
            if (z && sirve) { g.fillStyle = '#ffe14a'; g.beginPath(); const yc = y0 + (f + .5) * ch, s = Math.min(ch * .28, cw * .35); g.moveTo(W - s * .4, yc - s); g.lineTo(W - s * 1.6, yc); g.lineTo(W - s * .4, yc + s); g.fill(); }
        }
        const t = tableros.get(zona);
        if (!t) return;
        const mezcla = Math.min(1, (performance.now() - t.llegada) / 180);
        for (let f = 0; f < filas; f++) if (t.cortacespedes[f]) { g.fillStyle = '#d64a3a'; g.fillRect(x0 - cw * .45, y0 + f * ch + ch * .55, cw * .35, ch * .22); }
        for (const p of t.plantas) { const src = srcPlanta(p.tipo); if (!src) continue; const im = img(src); if (im.complete && im.naturalWidth) { const h = ch * .82, w = h * im.naturalWidth / im.naturalHeight; g.drawImage(im, x0 + (p.col + .5) * cw - w / 2, y0 + (p.fila + .92) * ch - h, w, h); } }
        for (const q of [...t.zombis].sort((p, r) => p.fila - r.fila)) {
            const antes = t.previo?.find(v => v.tipo === q.tipo && v.fila === q.fila && Math.abs(v.x - q.x) < .5), x = Math.min(8.9, antes ? antes.x + (q.x - antes.x) * mezcla : q.x);
            const im = img(srcZombi(q.tipo));
            if (im.complete && im.naturalWidth) { const h = ch * 1.05, w = h * im.naturalWidth / im.naturalHeight; g.drawImage(im, x0 + (x + .5) * cw - w / 2, y0 + (q.fila + .95) * ch - h, w, h); }
        }
    }
    /** Carril bajo un punto de un tablero dibujado. */
    function filaEn(c: HTMLCanvasElement, zona: number, ev: { clientX: number; clientY: number }) {
        const r = c.getBoundingClientRect(), filas = AREAS_CAMPANA[eleccion.zonas[zona].area].filas, gm = geometria.get(c);
        const y = (ev.clientY - r.top) / r.height, y0 = gm ? gm.y0 / gm.H : .05, y1 = gm ? gm.y1 / gm.H : .97;
        const f = Math.floor((y - y0) / ((y1 - y0) / filas));
        return f >= 0 && f < filas ? f : null;
    }
    /** Flechas de carril sobre el tablero nativo, para quien lleva los zombis en este dispositivo. */
    function carrilesNativos() {
        const c = $('.vt-carriles');
        const zona = vista === 'mapa' ? null : vista, t = zona === null ? undefined : tableros.get(zona);
        if (rol !== 'local' || zona === null || zona !== objetivo || !elegido || !t?.pantalla || !t.pantalla.filas.length) { if (c.innerHTML) { c.innerHTML = ''; firmaCarriles = ''; } return; }
        const p = t.pantalla, alto = p.filas.length > 1 ? Math.abs(p.filas[1] - p.filas[0]) * .85 : .12, derecha = p.derecha + p.ancho * .55;
        const a = AREAS_CAMPANA[eleccion.zonas[zona].area], z = ZOMBIS_VERSUS.find(q => q.id === elegido);
        const firma = p.filas.map(y => y.toFixed(3)).join(',') + derecha.toFixed(3) + elegido;
        if (firma === firmaCarriles) return;
        firmaCarriles = firma;
        c.innerHTML = p.filas.map((y, f) => `<button class="vs-carril vs-activo" data-vt-fila="${f}" style="top:${y * 100}%;left:${derecha * 100}%;height:${alto * 100}%" ${!z || !!z.agua === a.agua.includes(f) ? '' : 'disabled'} aria-label="Carril ${f + 1}">◀</button>`).join('');
    }

    // ------------------------------------------------------------------ motores (anfitrión o este dispositivo)
    function configZona(zona: number): ConfigDefensaNativa {
        const z = eleccion.zonas[zona], punto = puntos.get(zona) ?? null;
        const c = nivelCampana(z.area, eleccion.semillas, (eleccion.semilla + zona * 7919) >>> 0, punto, false, 0, FUSIONES);
        return { ...c, oleadas: [[]], versus: true, autoSol: true, reposo: false, solInicial: punto ? c.solInicial : reglas.solesIniciales() };
    }
    function crearMotor(): MotorVT {
        const caja = document.createElement('div');
        caja.className = 'vt-motor vt-oculto';
        $('.vt-motores').append(caja);
        const m: MotorVT = { motor: null as unknown as FrenteGardendless, caja, zona: null, firma: '', uso: performance.now(), roto: false };
        m.motor = new FrenteGardendless(caja, 'vt' + (++contadorMotores), cx.perfil, o => { if (o.fase === 'derrota' && m.zona !== null && reglas.batalla(m.zona)) void cerrarBatalla(m.zona, 'zombis'); }, { historia: true });
        motores.push(m);
        return m;
    }
    function descartar(m: MotorVT) { const i = motores.indexOf(m); if (i >= 0) motores.splice(i, 1); m.motor.destruir(); m.caja.remove(); }
    /** Un tablero libre para esa zona: el que ya la tuvo, el que lleva más tiempo sin usarse o uno nuevo. */
    function tomarMotor(zona: number) {
        const libre = (m: MotorVT) => !m.roto && (m.zona === null || m.zona === zona || !reglas.batalla(m.zona));
        let m = motores.find(x => x.zona === zona && libre(x)) ?? motores.filter(libre).sort((a, b) => a.uso - b.uso)[0];
        if (!m && motores.length < maxMotores) m = crearMotor();
        if (!m) throw new Error('No quedan tableros libres.');
        if (m.zona !== zona) m.firma = '';
        m.zona = zona; m.uso = performance.now();
        return m;
    }
    async function cargarBatalla(zona: number) {
        let m: MotorVT | null = null;
        try {
            m = tomarMotor(zona);
            const c = configZona(zona), firma = JSON.stringify(c);
            await m.motor.listo;
            if (m.firma !== firma) { await m.motor.prepararHistoria(c); m.firma = firma; }
            if (muerto || !reglas.batalla(zona) || m.zona !== zona) return;
            await m.motor.iniciarHistoria(c);
            m.firma = '';
            if (pausa || reglas.estado.ganador) await m.motor.pausa();
            reglas.marcarLista(zona);
            publicarEstado(true);
            if (vista === zona) pintarEscena();
            refrescar(true);
        } catch (e) {
            if (muerto) return;
            reglas.cancelar(zona);
            if (m) { m.zona = null; m.firma = ''; m.roto = true; descartar(m); }
            noticia(`No se pudo abrir ${nombre(zona)}: ${(e as Error).message}`, 6000);
            if (vista === zona) ver('mapa');
            publicarEstado(true); refrescar(true);
        }
    }
    /** Precarga mientras se leen las reglas: las primeras zonas de cada bando quedan listas para empezar. */
    async function precargar() {
        const primeras = [eleccion.zonas[0].vecinos[0], eleccion.zonas[eleccion.zonas.length - 1].vecinos[0]].filter((z, i, l) => z !== undefined && l.indexOf(z) === i).slice(0, Math.min(2, maxMotores));
        for (const zona of primeras) {
            if (muerto || reglas.batalla(zona)) continue;
            const m = crearMotor();
            m.zona = zona;
            try { await m.motor.listo; const c = configZona(zona); if (muerto || reglas.batalla(zona) || m.zona !== zona) continue; await m.motor.prepararHistoria(c); m.firma = JSON.stringify(c); }
            catch { if (!muerto) { m.roto = true; descartar(m); } }
        }
    }
    async function cerrarBatalla(zona: number, ganador: Lado) {
        const b = reglas.batalla(zona);
        if (!b || cerrando.has(zona) || (!reglas.marcarFin(zona, ganador) && b.fin !== ganador)) return;
        cerrando.add(zona);
        const m = motores.find(x => x.zona === zona);
        try {
            if (ganador === 'plantas' && m && !m.roto) { try { puntos.set(zona, await m.motor.puntoHistoria()); } catch { puntos.delete(zona); } }
            else if (ganador === 'zombis') puntos.delete(zona);
            if (m && !m.roto) await m.motor.pausa().catch(() => {});
        } finally {
            cerrando.delete(zona);
            if (!muerto) {
                const fin = reglas.resolver(zona, ganador);
                tableros.delete(zona);
                if (m) m.uso = performance.now();
                noticia(ganador === 'plantas' ? `🌱 Las plantas resistieron: ${nombre(zona)} es suya.` : `🧟 Un zombi entró a la casa: ${nombre(zona)} es de los zombis.`, 4000);
                if (vista === zona) ver('mapa');
                publicarEstado(true); refrescar(true); pintarMapa();
                if (fin) terminarPartida();
            }
        }
    }
    function manejar(ev: EventoVT) {
        if (ev.tipo === 'reloj') void cerrarBatalla(ev.zona, 'plantas');
        else if (ev.tipo === 'guarnicion') { const m = motores.find(x => x.zona === ev.zona); if (m && !m.roto) void m.motor.soltarZombi(ev.zombi, ev.fila).catch(() => {}); }
        else if (ev.tipo === 'fin') terminarPartida();
    }
    async function pasoMotores(t: number) {
        const pasos = pausa || reglas.estado.ganador ? 0 : Math.min(6, Math.floor(acumulado * 60));
        acumulado -= pasos / 60;
        const activos = motores.filter(m => m.zona !== null && !m.roto && reglas.batalla(m.zona)?.lista && !reglas.batalla(m.zona)?.fin);
        const fps = activos.length >= (ligero ? 2 : 3) ? 30 : 60;
        await Promise.all(activos.map(m => m.motor.pasoHistoria(pasos, vista === m.zona, fps).catch(e => { if (!muerto && m.zona !== null) noticia(`${nombre(m.zona)}: ${(e as Error).message}`); })));
        if (t - ultimaConsulta < 180) return;
        ultimaConsulta = t;
        await Promise.all(activos.map(async m => {
            const zona = m.zona!;
            try {
                const s = await m.motor.estadoVersus();
                if (muerto || m.zona !== zona || !reglas.batalla(zona)) return;
                const previo = tableros.get(zona);
                tableros.set(zona, { zombis: s.zombis, plantas: s.plantas, cortacespedes: s.cortacespedes, soles: s.soles, pantalla: s.pantalla, llegada: performance.now(), previo: previo?.zombis ?? null });
                if (s.ganaron === 'zombis') void cerrarBatalla(zona, 'zombis');
            } catch { /* la siguiente consulta lo reintenta */ }
        }));
        publicarFoto();
        carrilesNativos();
    }

    // ------------------------------------------------------------------ órdenes
    function iniciarBatalla(lado: Lado, zona: number, remoto = false) {
        if (rol === 'invitado') { pedido = zona; sala?.mandar('vt:atacar', { sesion, zona }); seleccion = null; pintarFicha(); noticia('🧟 Orden enviada: invadir ' + nombre(zona) + '.'); return; }
        const motivo = pausa ? 'La partida está en pausa.' : reglas.impedimentoAtaque(lado, zona);
        if (motivo) { if (remoto) sala?.mandar('vt:rechazo', { texto: motivo }); else noticia(motivo); return; }
        reglas.atacar(lado, zona);
        seleccion = null;
        noticia(lado === 'plantas' ? `🌱 Las plantas avanzan sobre ${nombre(zona)}.` : `🧟 ¡Los zombis atacan ${nombre(zona)}!`, 3500);
        if (lado === 'plantas') ver(zona); else { if (rol === 'local') objetivo = zona; pintarEscena(); }
        publicarEstado(true); refrescar(true);
        void cargarBatalla(zona);
    }
    async function soltar(tipo: string, zona: number, fila: number, remoto = false) {
        if (rol === 'invitado') { sala?.mandar('vt:soltar', { sesion, zona, tipo, fila }); return; }
        const rechazar = (t: string) => { if (remoto) sala?.mandar('vt:rechazo', { texto: t }); else noticia(t); };
        const motivo = pausa ? 'La partida está en pausa.' : reglas.impedimentoZombi(tipo, zona, fila);
        if (motivo) { rechazar(motivo); return; }
        const m = motores.find(x => x.zona === zona && !x.roto);
        if (!m) { rechazar('Ese tablero no está abierto.'); return; }
        reglas.gastar(tipo);
        try { await m.motor.soltarZombi(tipo, fila); } catch (e) { reglas.devolver(tipo); rechazar((e as Error).message); }
        publicarEstado(true); refrescar(true);
    }
    async function pausar(si: boolean) {
        if (finMostrado || muerto) return;
        if (rol === 'invitado') { sala?.mandar('vt:pausa', { si }); return; }
        pausa = si;
        await Promise.all(motores.filter(m => m.zona !== null && !m.roto && reglas.batalla(m.zona)?.lista).map(m => (si ? m.motor.pausa() : m.motor.reanudar()).catch(() => {})));
        anterior = performance.now();
        capaPausa();
        publicarEstado(true); refrescar(true);
    }
    function capaPausa() {
        if (finMostrado || intro) return;
        $('.vt-capa').innerHTML = pausa ? `<section class="vs-fin vt-modal" role="dialog" aria-modal="true"><h2>Pausa</h2><p>El reloj de la partida y todas las batallas están detenidos.</p><div>${rol === 'invitado' ? '<button class="vs-principal" data-vt="pausa">Pedir que siga</button>' : '<button class="vs-principal" data-vt="pausa">Seguir</button>'}<button data-vt="salir">Salir de la partida</button></div></section>` : '';
    }
    function terminarPartida() {
        if (finMostrado) return;
        finMostrado = true; intro = false;
        if (rol !== 'invitado') for (const m of motores) if (!m.roto) void m.motor.pausa().catch(() => {});
        publicarEstado(true);
        const e = reglas.estado, g = e.ganador ?? 'empate';
        const titulo = g === 'plantas' ? '¡Ganan las plantas!' : g === 'zombis' ? '¡Ganan los zombis!' : '¡Empate!';
        const sub = e.motivo === 'casa' ? 'Un zombi entró a La casa.' : e.motivo === 'guarida' ? 'Las plantas tomaron la guarida zombi.' : g === 'empate' ? 'Las dos fuerzas terminaron con las mismas zonas.' : 'Se acabó el tiempo y tienen más zonas.';
        const mio = yo ? (g === 'empate' ? 'Nadie gana esta vez.' : g === yo ? 'Ganaste la partida.' : 'Perdiste esta vez.') : '';
        $('.vt-capa').innerHTML = `<section class="vs-fin vs-fin-${g === 'empate' ? 'plantas' : g} vt-modal" role="dialog" aria-modal="true"><h2>${titulo}</h2><p>${sub}${mio ? ' ' + mio : ''}</p>
          <ul class="vt-recuento"><li class="vt-c-plantas">🌱 ${reglas.zonasDe('plantas')} zonas</li><li class="vt-c-neutral">⚪ ${reglas.zonasDe(null)}</li><li class="vt-c-zombis">🧟 ${reglas.zonasDe('zombis')} zonas</li></ul>
          <div>${rol !== 'invitado' ? '<button class="vs-principal" data-vt="otra">Otra partida</button>' : '<p>El jardinero decide si juegan otra.</p>'}<button data-vt="salir">Salir</button></div></section>`;
        refrescar(true);
    }
    function mostrarIntro() {
        $('.vt-capa').innerHTML = `<section class="vs-fin vt-modal vt-intro" role="dialog" aria-modal="true"><small>VERSUS POR TERRITORIOS</small><h2>Conquista el mapa</h2>
          <ul class="vt-reglas">
            <li><b>🗺 Cada zona es un tablero</b> con el área y el mundo de la historia. Ataca zonas <em>vecinas</em> de las tuyas: tocando la zona en el mapa.</li>
            <li><b>🌱 Plantas:</b> resiste el reloj de la batalla y la zona es tuya, con tu defensa guardada para la próxima vez. Los soles se recogen solos en todos los tableros.</li>
            <li><b>🧟 Zombis:</b> haz entrar un zombi a la casa de esa zona. Ganas cerebros con el tiempo, por cada batalla abierta y por cada zona tuya; tus zonas tienen guarnición.</li>
            <li><b>🏆 Victoria:</b> toma la base rival, o ten más zonas cuando acabe el reloj de la partida (${reloj(eleccion.duracion)}). Puede haber hasta ${reglas.maxTotal} batallas a la vez.</li>
          </ul><div><button class="vs-principal" data-vt="empezar">${rol === 'invitado' ? 'Entendido' : '¡A jugar!'}</button></div></section>`;
    }

    // ------------------------------------------------------------------ sala
    function publicarEstado(fiable = false) {
        if (rol !== 'anfitrion' || !sala) return;
        const ahora = performance.now();
        if (!fiable && ahora - ultimoEstadoMsg < 500) return;
        ultimoEstadoMsg = ahora;
        sala.mandar('vt:estado', { sesion, n: ++nEstado, estado: reglas.estado, pausa } satisfies EstadoMsgVT);
    }
    function publicarFoto() {
        if (rol !== 'anfitrion' || !sala) return;
        const lista = [...tableros].filter(([z]) => reglas.batalla(z)).map(([zona, t]) => ({ zona, z: t.zombis.slice(0, 150), p: t.plantas.slice(0, 200), c: t.cortacespedes, s: t.soles }));
        sala.mandar('vt:foto', { sesion, n: ++nFoto, tableros: lista } satisfies FotoVT, { rapido: true });
    }
    const filasValidas = (l: unknown, max: number) => Array.isArray(l) && l.length <= max;
    if (sala) {
        const otro = () => sala.jugadores.find(j => j.id !== sala.yo.id);
        quitar.push(
            sala.al('vt:atacar', (d, de) => { const p = d as { sesion?: string; zona?: number }; if (rol === 'anfitrion' && de.id === otro()?.id && p?.sesion === sesion && Number.isInteger(p.zona)) iniciarBatalla('zombis', p.zona!, true); }),
            sala.al('vt:soltar', (d, de) => { const p = d as { sesion?: string; zona?: number; tipo?: string; fila?: number }; if (rol === 'anfitrion' && de.id === otro()?.id && p?.sesion === sesion && Number.isInteger(p.zona) && typeof p.tipo === 'string' && Number.isInteger(p.fila)) void soltar(p.tipo, p.zona!, p.fila!, true); }),
            sala.al('vt:pausa', (d, de) => { const p = d as { si?: unknown }; if (rol === 'anfitrion' && de.id === otro()?.id && typeof p?.si === 'boolean' && !intro) void pausar(p.si); }),
            sala.al('vt:estado', (d, de) => {
                const m = d as EstadoMsgVT;
                if (rol !== 'invitado' || de.puesto !== 0 || m?.sesion !== sesion || !Number.isSafeInteger(m.n) || m.n <= ultimoEstadoRecibido) return;
                const e = m.estado;
                if (!e || !filasValidas(e.duenos, eleccion.zonas.length) || e.duenos.length !== eleccion.zonas.length || !filasValidas(e.batallas, VT.maxTotal) || !filasValidas(e.espera, eleccion.zonas.length) || typeof e.cerebros !== 'number' || typeof e.t !== 'number') return;
                ultimoEstadoRecibido = m.n;
                const antes = new Set(reglas.estado.batallas.map(b => b.zona));
                reglas.estado = e;
                for (const b of e.batallas) if (!antes.has(b.zona) && !vistasBatalla.has(b.id)) {
                    vistasBatalla.add(b.id);
                    if (b.iniciador === 'plantas') noticia(`🌱 Las plantas avanzan sobre ${nombre(b.zona)}.`);
                    if (pedido === b.zona && b.iniciador === 'zombis') { pedido = null; ver(b.zona); }
                }
                for (const z of [...tableros.keys()]) if (!reglas.batalla(z)) tableros.delete(z);
                if (vista !== 'mapa' && !reglas.batalla(vista)) ver('mapa');
                if (pausa !== m.pausa) { pausa = m.pausa; capaPausa(); }
                if (e.ganador) terminarPartida();
                refrescar(true);
            }),
            sala.al('vt:foto', (d, de) => {
                const f = d as FotoVT;
                if (rol !== 'invitado' || de.puesto !== 0 || f?.sesion !== sesion || !Number.isSafeInteger(f.n) || f.n <= ultimaFotoRecibida || !filasValidas(f.tableros, VT.maxTotal)) return;
                ultimaFotoRecibida = f.n;
                for (const t of f.tableros) {
                    if (!Number.isInteger(t?.zona) || !eleccion.zonas[t.zona] || !filasValidas(t.z, 150) || !filasValidas(t.p, 200) || !filasValidas(t.c, 7)) continue;
                    const previo = tableros.get(t.zona);
                    tableros.set(t.zona, { zombis: t.z, plantas: t.p, cortacespedes: t.c, soles: t.s, pantalla: null, llegada: performance.now(), previo: previo?.zombis ?? null });
                }
                if (vista !== 'mapa') pintarEscena();
            }),
            sala.al('vt:rechazo', (d, de) => { const p = d as { texto?: unknown }; if (rol === 'invitado' && de.puesto === 0 && typeof p?.texto === 'string') { pedido = null; noticia(p.texto.slice(0, 140)); } }),
            sala.al('vt:otra', (_d, de) => { if (rol === 'invitado' && de.puesto === 0) { cerrar(); cx.alOtra(); } }),
            sala.alCorte(cortado => { if (cortado && !finMostrado) { noticia('Se cortó la conexión con el otro jugador. La partida queda en pausa.', 6000); if (rol === 'anfitrion') void pausar(true); } }),
        );
    }

    // ------------------------------------------------------------------ bucles
    function cuadro(t: number) {
        if (muerto) return;
        raf = requestAnimationFrame(cuadro);
        const dt = Math.min(.2, Math.max(0, (t - anterior) / 1000));
        anterior = t;
        if (rol !== 'invitado') {
            if (!pausa && !reglas.estado.ganador) {
                for (const ev of reglas.avanzar(dt)) manejar(ev);
                acumulado = Math.min(.1, acumulado + dt);
            }
            if (!enPaso) { enPaso = true; void pasoMotores(t).finally(() => { enPaso = false; }); }
            publicarEstado();
        }
        if (rol === 'invitado' && vista !== 'mapa') dibujar($<HTMLCanvasElement>('.vt-lienzo'), vista);
        if (rol === 'local') dibujar($<HTMLCanvasElement>('.vt-mini'), objetivo);
        refrescar();
    }

    // ------------------------------------------------------------------ entrada
    function onClick(ev: MouseEvent) {
        const el = (ev.target as HTMLElement).closest<HTMLElement>('button');
        if (!el || (el as HTMLButtonElement).disabled) return;
        if (el.dataset.vtZona) { seleccion = Number(el.dataset.vtZona); firmaFicha = ''; pintarFicha(); pintarMapa(); return; }
        if (el.dataset.vtAtacar && seleccion !== null) { iniciarBatalla(el.dataset.vtAtacar as Lado, seleccion); return; }
        if (el.dataset.vtVer) { ver(el.dataset.vtVer === 'mapa' ? 'mapa' : Number(el.dataset.vtVer)); return; }
        if (el.dataset.vtBatalla) { const z = Number(el.dataset.vtBatalla); if (rol === 'local') { objetivo = z; firmaLista = ''; refrescar(true); } else ver(z); return; }
        if (el.dataset.vtZombi) { elegido = elegido === el.dataset.vtZombi ? null : el.dataset.vtZombi; firmaCarriles = ''; refrescar(true); carrilesNativos(); return; }
        if (el.dataset.vtFila) { if (elegido && objetivo !== null) void soltar(elegido, objetivo, Number(el.dataset.vtFila)); return; }
        switch (el.dataset.vt) {
            case 'cerrar-ficha': seleccion = null; pintarFicha(); pintarMapa(); break;
            case 'pausa': if (!intro) void pausar(!pausa); break;
            case 'empezar':
                intro = false; $('.vt-capa').innerHTML = '';
                if (rol !== 'invitado') void pausar(false); else capaPausa();
                break;
            case 'salir': if (!finMostrado && !confirm('¿Salir de la partida?')) break; cerrar(); cx.alSalir(); break;
            case 'otra': if (rol !== 'invitado') { if (sala) sala.mandar('vt:otra', {}); cerrar(); cx.alOtra(); } break;
        }
    }
    function tocarLienzo(c: HTMLCanvasElement, zona: number | null, ev: MouseEvent) {
        if (zona === null) return;
        if (!elegido) { noticia('Primero elige un zombi.'); return; }
        const f = filaEn(c, zona, ev);
        if (f !== null) void soltar(elegido, zona, f);
    }
    root.addEventListener('click', onClick);
    quitar.push(() => root.removeEventListener('click', onClick));
    capa.lienzo.addEventListener('click', ev => { const t = capa.territorioEn(ev); if (t) { seleccion = t.id; firmaFicha = ''; pintarFicha(); pintarMapa(); } });
    const lienzo = $<HTMLCanvasElement>('.vt-lienzo');
    lienzo.addEventListener('click', ev => tocarLienzo(lienzo, vista === 'mapa' ? null : vista, ev));
    lienzo.addEventListener('pointermove', ev => { filaEncima = vista === 'mapa' ? null : filaEn(lienzo, vista, ev); });
    const mini = root.querySelector<HTMLCanvasElement>('.vt-mini');
    if (mini) { mini.addEventListener('click', ev => tocarLienzo(mini, objetivo, ev)); mini.addEventListener('pointermove', ev => { filaEncima = objetivo === null ? null : filaEn(mini, objetivo, ev); }); }
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape' && !intro && !finMostrado) { e.preventDefault(); void pausar(!pausa); } };
    addEventListener('keydown', tecla);
    quitar.push(() => removeEventListener('keydown', tecla));

    function cerrar() {
        if (muerto) return;
        muerto = true;
        cancelAnimationFrame(raf);
        for (const q of quitar.splice(0)) q();
        for (const m of motores.splice(0)) void m.motor.cerrar().catch(() => {}).finally(() => m.caja.remove());
    }
    if (prueba) (window as unknown as { __vt: unknown }).__vt = {
        reglas: () => reglas, tableros: () => tableros, vista: () => vista, objetivo: () => objetivo, pausa: () => pausa, puntos: () => [...puntos.keys()],
        motores: () => motores.map(m => ({ zona: m.zona, roto: m.roto })),
        empezar: () => { if (intro) root.querySelector<HTMLButtonElement>('[data-vt="empezar"]')?.click(); },
        atacar: (lado: Lado, zona: number) => iniciarBatalla(lado, zona),
        soltar: (tipo: string, zona: number, fila: number) => soltar(tipo, zona, fila),
        /** Caso preparado: adelanta el reloj de la partida y de las batallas sin tocar los motores. */
        adelantar: (s: number) => { for (let i = 0; i < s; i++) for (const ev of reglas.avanzar(1)) manejar(ev); refrescar(true); },
        /** Caso preparado: decide una batalla como si hubiera terminado así en el tablero. */
        decidir: (zona: number, ganador: Lado) => cerrarBatalla(zona, ganador),
        ver,
        /** Césped del dibujo en fracciones del lienzo (para tocar un carril en las pruebas). */
        geometria: (c: HTMLCanvasElement) => { const g = geometria.get(c); return g ? { y0: g.y0 / g.H, y1: g.y1 / g.H } : null; },
    };

    mostrarIntro();
    pintarEscena();
    refrescar(true);
    if (rol !== 'invitado') void precargar();
    raf = requestAnimationFrame(cuadro);
    if (rol === 'anfitrion') publicarEstado(true);
    return { cerrar };
}
