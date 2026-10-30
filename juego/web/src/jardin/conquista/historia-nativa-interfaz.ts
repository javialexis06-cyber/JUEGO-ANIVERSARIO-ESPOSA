import './conquista.css';
import './historia.css';
import './historia-nativa.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/900.css';
import { CinematicaConquista } from './cinematica';
import { HistoriaNativa, type ZonaNativa, type AtaqueNativo } from './historia-nativa-motor';
import { GuardadoHistoriaNativa } from './historia-nativa-guardado';
import { FrenteGardendless, type ObservacionGardendless } from '../motores/frente-gardendless';
import { AREAS_CAMPANA, PAISES_CAMPANA, CIUDADES_CAMPANA } from './campana-datos';
import { nivelCampana, nombreSemillaNativa, nombrePlantaCatalogo, type SemillaNativa, type ConfigDefensaNativa } from '../motores/nivel-historia';
import { cargarRetratosNativos, retratoPlantaNativa, retratoZombiNativo } from '../motores/retratos-nativos';
import { ARTE_PLANTAS_PVZ } from '../pvz/arte/catalogo';
import { esModoAmigo } from '../../salas/perfil';
import { botonRedondo, icono } from './iconos';
import { puntoAreaCampana as puntoZonaHistoria } from './regiones';
import type { EscalaMapa } from './mapa';
import { urlArtePvZ } from '../pvz/arte/catalogo';
import { AtlasPvZ } from '../pvz/arte/atlas';
import { RetratosPvZ } from '../pvz/ui/retratos';
import { PLANTAS_PVZ } from '../pvz/datos/plantas';
import { volarSobrePvZ } from '../pvz/ui/baraja';
import '../pvz/ui/manipulacion.css';
import { CapaTerritorios, type Territorio } from './territorios';
import { precio, recompensa, cupo, paisDePlanta, costeSol, PLANTAS_TIENDA, nombrePais } from './economia';
import { TUTORIAL, GUIA, MemoriaTutorial } from './tutorial-campana';
import { PLANTAS_NATIVAS, ZOMBIS_NATIVOS, nativoDe } from '../motores/nivel-historia';
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
type Instancia = {
    motor: FrenteGardendless;
    ataque: number | null;
    lista: boolean;
    estado: ObservacionGardendless | null;
    firma: string;
    precarga: Promise<void> | null;
};
export async function montarHistoriaNativa() {
    const amigo = esModoAmigo(), perfil = amigo ? 'amigos' : 'pareja', params = new URLSearchParams(location.search), eventos = new AbortController();
    const guardado = new GuardadoHistoriaNativa(localStorage, amigo ? 'amigo-conquista-historia-nativa-v3' : 'conquista-historia-nativa-v3');
    let mundo = guardado.leer(), errorArchivo = !!guardado.error, muerto = false, cargando = 0, ocupado = false, anterior = performance.now(), acumulado = 0, raf = 0;
    let visible: ZonaNativa | null = null, escala: EscalaMapa = 'ciudad', pais = AREAS_CAMPANA[8].pais, ciudad = AREAS_CAMPANA[8].ciudad, seleccion: ZonaNativa | null = null, editor: SemillaNativa[] | null = null, revisionEditor = 0;
    let liberar: () => void = () => { }, bloqueo = false, modal = '', avisoHasta = 0, ultimoEstado = '', necesitaGuardar = false, herramientasHTML = '';
    let errorMotor = '', iniciando = false;
    let cine:CinematicaConquista|null=null;
    const instancias = new Map<ZonaNativa, Instancia>(), atlas = new AtlasPvZ(), retratos = new RetratosPvZ(atlas);
    const capaTerritorios = new CapaTerritorios();
    let tiendaVista: 'venta' | 'proximas' | 'tuyas' = 'venta', tiendaDesde = '';
    // Tutorial: Dave explica cada mecánica la primera vez. En las pruebas automáticas solo con ?tutorial.
    const tutorial = new MemoriaTutorial(localStorage, (amigo ? 'amigo-' : '') + 'semilla-historia-tutorial');
    const sinTutorial = params.has('prueba') && !params.has('tutorial');
    const pendientes: { tema: string; titulo: string; texto: string[] }[] = [];
    let temaActual: { tema: string; titulo: string; texto: string[] } | null = null, pausaPorTutorial = false, modalTrasTutorial = '';
    document.body.dataset.conquista = '1';
    document.title = 'La Semilla Madre · Historia';
    const root = document.createElement('main');
    root.id = 'cq-app';
    root.className = 'cq-historia cq-nativa';
    root.style.setProperty('--hn-portada', `url("${urlArtePvZ('portada-conquista.webp')}")`);
    document.body.append(root);
    root.innerHTML = '<section class="hn-mapa"></section><section class="hn-defensas"></section><nav class="cq-herramientas hn-herramientas"></nav><nav class="hn-frentes" aria-label="Frentes activos"></nav><div class="hn-noticia" role="status" hidden></div><div class="hn-capa"></div>';
    const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
    // Las 32 plantas heredadas conservan su arte propio; el resto del catálogo usa el retrato nativo.
    const retratoSemilla = (t: string) => ARTE_PLANTAS_PVZ[t] ? retratos.planta(t) : retratoPlantaNativa(t);
    const imagen = (t: SemillaNativa) => `<img src="${retratoSemilla(t)}" alt="${esc(nombre(t))}" draggable="false">`;
    const casa=(id:ZonaNativa)=>AREAS_CAMPANA[id].nombre;
    const nombre=(t:SemillaNativa)=>nombrePlantaCatalogo(t,PLANTAS_PVZ[t]?nombreSemillaNativa(t,PLANTAS_PVZ[t].nombre):undefined);
    const cortosHeredados=['Robles','Molino','Parque','Fuerte','Farol','Puente','Semillas','Mercado','Casa','Estación','Fuentes','Colina'];
    const cortos=AREAS_CAMPANA.map(a=>cortosHeredados[a.id]??a.nombre.split(' ').slice(-1)[0]);
    const boton = (a: string, n: string, i = a) => botonRedondo(a, n, i);
    const FAMILIAS: Record<string, string> = { Sun: 'Sol', Peashooter: 'Disparo', Lobber: 'Lanzadora', Defence: 'Defensa', Explosive: 'Explosiva', Fire: 'Fuego', Cold: 'Hielo', Electricity: 'Eléctrica', Shadow: 'Sombra', Sharp: 'Púas', Poison: 'Veneno', Magic: 'Magia', Melee: 'Cuerpo a cuerpo', Slow: 'Control', Nope: 'Apoyo' };
    const fichaNativa = new Map(PLANTAS_NATIVAS.map(p => [p.id, p]));
    const familia = (t: string) => FAMILIAS[fichaNativa.get(nativoDe(t))?.familia ?? ''] ?? 'Apoyo';
    const TIPO_AREA: Record<string, string> = { residencial: 'Barrio residencial', via: 'Vía', especial: 'Zona especial', suministros: 'Depósito de suministros', fortaleza: 'Fortaleza' };
    const cobrada = (id: ZonaNativa) => !!mundo?.estado.cobradas.includes(id);
    /** Botón redondo con su nombre debajo (en la ficha de la zona solo había íconos). */
    const conTexto = (b: string, t: string) => `<span class="hn-accion">${b}<small>${t}</small></span>`;
    // Los controles se conservan al cambiar de vista: sustituir el botón dentro
    // de su propio clic interrumpe foco y eventos de ratón entre iframes.
    $('.hn-frentes').innerHTML = AREAS_CAMPANA.map(({id})=>id).map(id => `<button class="cq-redondo" data-hn-frente="${id}" aria-label="Defender ${casa(id)}" style="visibility:hidden" disabled>${icono('atacar')}<small>${cortos[id]}</small></button>`).join('');
    function noticia(t: string, ms = 5500) { const e = $('.hn-noticia'); e.textContent = t; e.hidden = false; avisoHasta = performance.now() + ms; }
    function guardar() { if (!mundo)
        return false;
        if (!bloqueo) { mundo.pausada = true; modal = 'ocupada'; capa(); return false; }
        const ok = guardado.guardar(mundo.exportar()); if (!ok) {
        void pausar(true);
        modal = 'guardado-error';
        capa();
        pintar();
    } necesitaGuardar = !ok; return ok; }
    function descargar() { const raw = mundo ? JSON.stringify(mundo.exportar(), null, 2) : localStorage.getItem(guardado.clave); if (!raw)
        return; const u = URL.createObjectURL(new Blob([raw], { type: 'application/json' })), a = document.createElement('a'); a.href = u; a.download = 'semilla-madre-historia-nativa.json'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); }
    function volver() { const u = new URL('jardin.html', location.href); u.searchParams.set('modo', 'conquista'); for (const k of ['rol', 'local', 'salas'])
        if (params.has(k))
            u.searchParams.set(k, params.get(k)!); location.href = u.href; }
    async function adquirir() { if (bloqueo)
        return true; if (!navigator.locks) {
        bloqueo = true;
        return true;
    } return new Promise<boolean>(ok => { void navigator.locks.request(guardado.clave, { ifAvailable: true }, async (l) => { if (!l || muerto) {
        ok(false);
        return;
    } bloqueo = true; ok(true); await new Promise<void>(r => { liberar = r; }); }).catch(() => ok(false)); }); }
    /** Cómo está cada zona para el jugador: despejada (no la atacan), frontera (con la fuerza del próximo asedio) o zombi. */
    function estadoZona(m: HistoriaNativa, id: ZonaNativa) {
        const z = m.zona(id);
        if (!z.capturada) return { clase: 'zombi', corto: 'en manos zombis', insignia: '', largo: id===239?'El castillo del Dr. Zomboid. Se abre cuando recuperes las otras 239 áreas.':AREAS_CAMPANA[id].tipo==='fortaleza'?'Fortaleza de la ciudad. Se abre cuando recuperes las otras cuatro áreas de esta ciudad.':'Está en manos de los zombis. Recupérala con una expedición desde una zona vecina.' };
        if (m.segura(id)) return { clase: 'segura', corto: 'despejada', insignia: '🛡️', largo: 'Despejada: todas sus vecinas son nuestras, así que los zombis ya no la atacan. Si se pierde una vecina, vuelve a ser frontera.' };
        const r = m.refuerzo(id);
        return { clase: 'frontera', corto: 'frontera, asedio ' + r + ' de 6', insignia: r ? '⚔️' + r : '⚔️', largo: `Frontera: toca territorio zombi y la pueden asediar. Cada asedio que resiste y cada rato que pasa la hacen más fuerte (próximo asedio: ${r} de 6). Recupera sus vecinas para despejarla.` };
    }
    /** Territorios que cubren el mapa visible: cada área (o ciudad, o país) con el estado que importa al jugador. */
    function territorios(m: HistoriaNativa): { clave: string; semilla: number; zonas: Territorio[] } {
        const avance = (ids: number[]) => ids.filter(id => m.zona(id).capturada).length / ids.length;
        const grupo = (ids: number[]): Territorio['estado'] => { const p = avance(ids); return p >= 1 ? 'plantas' : p > 0 ? 'mixta' : ids.some(id => m.puedeLlegar(id)) ? 'recuperable' : 'bloqueada'; };
        if (escala === 'mundo') return { clave: 'mundo', semilla: 5, zonas: PAISES_CAMPANA.map(p => { const ids = AREAS_CAMPANA.filter(a => a.pais === p.id).map(a => a.id); return { id: p.id, x: p.x, y: p.y, estado: grupo(ids), progreso: avance(ids) }; }) };
        if (escala === 'pais') return { clave: 'pais', semilla: 11, zonas: CIUDADES_CAMPANA.filter(c => c.pais === pais).map(c => { const ids = AREAS_CAMPANA.filter(a => a.ciudad === c.id).map(a => a.id); return { id: c.id, x: c.x, y: c.y, estado: grupo(ids), progreso: avance(ids) }; }) };
        // Todas las ciudades comparten dibujo y ranuras: la partición se calcula una vez, en orden de ranura.
        return { clave: 'ciudad', semilla: 17, zonas: AREAS_CAMPANA.filter(a => a.ciudad === ciudad).sort((a, b) => a.ranura - b.ranura).map(a => { const z = m.zona(a.id), p = puntoZonaHistoria(a.id); return { id: a.id, x: p.x, y: p.y, estado: z.capturada ? (m.estado.ataques.some(q => q.zona === a.id) ? 'atacada' : 'plantas') : m.puedeLlegar(a.id) ? 'recuperable' : 'bloqueada' }; }) };
    }
    function mapa() {
        const m = mundo ?? new HistoriaNativa(), contenedor = $('.hn-mapa');
        let cart = contenedor.querySelector<HTMLElement>('.cq-cartografia');
        if (!cart) {
            contenedor.innerHTML = '<div class="cq-cartografia"><div class="hn-pines"></div></div><header class="hn-cabecera"></header>';
            cart = contenedor.querySelector<HTMLElement>('.cq-cartografia')!;
            cart.prepend(capaTerritorios.lienzo);
            // Tocar cualquier punto de un territorio equivale a tocar su marcador.
            capaTerritorios.lienzo.addEventListener('click', ev => {
                const t = capaTerritorios.territorioEn(ev);
                const sel = t && (escala === 'mundo' ? `[data-hn-pais="${t.id}"]` : escala === 'pais' ? `[data-hn-ciudad="${t.id}"]` : `[data-hn-zona="${t.id}"]`);
                if (sel) root.querySelector<HTMLButtonElement>(sel)?.click();
            }, { signal: eventos.signal });
        }
        const fondo = urlArtePvZ('mapa-' + escala + '.webp'), t = territorios(m);
        cart.className = `cq-cartografia cq-cartografia-${escala}`;
        cart.style.backgroundImage = `url('${fondo}')`;
        void capaTerritorios.pintar(t.clave, fondo, t.zonas, t.semilla);
        const estadoDe = (id: number) => t.zonas.find(z => z.id === id)!;
        let pines = '';
        if (escala === 'mundo')
            pines = PAISES_CAMPANA.map(p => { const e = estadoDe(p.id), n = AREAS_CAMPANA.filter(a => a.pais === p.id && m.zona(a.id).capturada).length; return `<button class="cq-pin cq-pin-region hn-pin-${e.estado}" data-hn-pais="${p.id}" style="--x:${p.x}%;--y:${p.y}%" aria-label="${p.nombre}: ${n} de 20 áreas"><span class="cq-emblema">${icono(e.estado === 'bloqueada' ? 'candado' : e.estado === 'plantas' ? 'escudo' : 'pais')}</span><b>${p.nombre}</b><i class="hn-chip">${n}/20</i></button>`; }).join('');
        else if (escala === 'pais')
            pines = CIUDADES_CAMPANA.filter(c => c.pais === pais).map(c => { const e = estadoDe(c.id), n = AREAS_CAMPANA.filter(a => a.ciudad === c.id && m.zona(a.id).capturada).length; return `<button class="cq-pin cq-pin-region hn-pin-${e.estado}" data-hn-ciudad="${c.id}" style="--x:${c.x}%;--y:${c.y}%" aria-label="${c.nombre}: ${n} de 5 áreas"><span class="cq-emblema">${icono(e.estado === 'bloqueada' ? 'candado' : e.estado === 'plantas' ? 'escudo' : 'ciudad')}</span><b>${c.nombre}</b><i class="hn-chip">${n}/5</i></button>`; }).join('');
        else
            pines = AREAS_CAMPANA.filter(a => a.ciudad === ciudad).map(z => {
                const p = puntoZonaHistoria(z.id), e = estadoDe(z.id).estado, activa = m.estado.ataques.some(a => a.zona === z.id), est = estadoZona(m, z.id);
                const chip = activa ? '⚔️ ¡En combate!' : m.zona(z.id).capturada ? (m.segura(z.id) ? '🛡️ Despejada' : `⚔️ Frontera ${m.refuerzo(z.id)}/6`) : e === 'recuperable' ? (cobrada(z.id) ? 'Recuperable' : `🪙 ${recompensa(z.id)}`) : z.tipo === 'fortaleza' && !m.fortalezaAbierta(z.id) ? '🔒 Fortaleza' : 'Sin ruta';
                const simbolo = activa ? 'atacar' : m.zona(z.id).capturada ? (z.id === 8 ? 'historia' : 'escudo') : e === 'recuperable' ? 'atacar' : 'candado';
                return `<button class="cq-pin hn-pin-${e} ${e === 'bloqueada' ? 'hn-lejana' : ''} ${activa ? 'hn-atacada' : ''} hn-${est.clase}" data-hn-zona="${z.id}" style="--x:${p.x}%;--y:${p.y}%" aria-label="${esc(z.nombre)}: ${est.corto}${e === 'bloqueada' ? ', necesita una ruta desde la casa' : ''}"><span class="cq-emblema">${icono(simbolo)}</span><b>${esc(z.nombre)}</b><i class="hn-chip">${chip}</i></button>`;
            }).join('');
        cart.querySelector('.hn-pines')!.innerHTML = pines;
        // Cabecera: dónde estoy (con regreso), cuánto llevo y las monedas con acceso a la tienda.
        const p0 = PAISES_CAMPANA[escala === 'mundo' ? 0 : escala === 'pais' ? pais : CIUDADES_CAMPANA[ciudad].pais], c0 = CIUDADES_CAMPANA[ciudad];
        const migas = escala === 'mundo' ? '<b>Mundo</b>' : escala === 'pais' ? `<button data-hn-ir="mundo">Mundo</button><span>›</span><b>${p0.nombre}</b>` : `<button data-hn-ir="mundo">Mundo</button><span>›</span><button data-hn-ir="pais">${p0.nombre}</button><span>›</span><b>${c0.nombre}</b>`;
        const total = m.estado.zonas.filter(z => z.capturada).length;
        // La leyenda solo nombra los colores que hay en el mapa visible (así cabe en una línea y no explica de más).
        const presentes = new Set<string>(t.zonas.map(z => z.estado === 'zombis' ? 'bloqueada' : z.estado));
        const nombres: [string, string][] = escala === 'ciudad'
            ? [['plantas', 'Nuestra'], ['recuperable', 'Se puede recuperar'], ['bloqueada', 'Zombi sin ruta'], ['atacada', 'En combate']]
            : [['plantas', 'Recuperado'], ['mixta', 'En curso'], ['recuperable', 'Al alcance'], ['bloqueada', 'Sin ruta'], ['atacada', 'En combate']];
        const leyenda = nombres.filter(([e]) => presentes.has(e)).map(([e, n]) => `<span class="hn-l-${e}">${n}</span>`).join('');
        $('.hn-cabecera').innerHTML = `<nav class="hn-migas" aria-label="Ubicación">${migas}</nav><span class="hn-progreso" title="Áreas recuperadas">${icono('escudo')}<span><b>${total}</b>/240</span></span><aside class="hn-leyenda" aria-label="Leyenda del mapa">${leyenda}</aside><button class="hn-monedas" data-cq="tienda" aria-label="Tienda: ${m.estado.monedas} monedas">${icono('moneda')}<b>${m.estado.monedas}</b><small>Tienda</small></button>`;
    }
    function pintar() {
        $('.hn-mapa').hidden = visible !== null;
        for (const [id, v] of instancias) {
            v.motor.frame.className = 'hn-frente';
            // Los que no se ven, ocultos del todo: con opacidad 0 el navegador los seguía componiendo uno encima del otro
            v.motor.frame.style.visibility = id === visible ? 'visible' : 'hidden';
            v.motor.frame.style.opacity = id === visible ? '1' : '0';
            v.motor.frame.dataset.visible = String(id === visible);
            v.motor.frame.inert = id !== visible;
            v.motor.frame.tabIndex = id === visible ? 0 : -1;
            v.motor.frame.setAttribute('aria-hidden',String(id!==visible));
            v.motor.frame.style.pointerEvents = id === visible ? 'auto' : 'none';
        }
        // Cada herramienta lleva su nombre debajo: solo con íconos no se entendía qué hacía cada una.
        const herr = (a: string, n: string, i: string, t: string) => `<span class="hn-herr">${boton(a, n, i)}<small>${t}</small></span>`;
        const herramientas = herr('mapa', 'Mapa de la ciudad', 'ciudad', 'Ciudad') + herr('subir', 'Mapa del país o del mundo', 'mapa', 'Subir') + herr('tienda', 'Tienda de plantas', 'tienda', 'Tienda') + herr('pausa', mundo?.pausada ? 'Reanudar los frentes' : 'Pausar todos los frentes', mundo?.pausada ? 'reanudar' : 'pausa', mundo?.pausada ? 'Seguir' : 'Pausa') + herr('ayuda', 'Guía de la campaña', 'ayuda', 'Guía') + herr('pantalla', 'Pantalla completa', 'pantalla', 'Pantalla') + herr('salir', 'Volver al jardín', 'salir', 'Salir');
        if (herramientasHTML !== herramientas) {
            herramientasHTML = herramientas;
            $('.hn-herramientas').innerHTML = herramientas;
        }
        const firma = mundo?.estado.ataques.map(a => a.id + ':' + a.zona).join(',') ?? '';
        for (const b of root.querySelectorAll<HTMLButtonElement>('[data-hn-frente]')) {
            const activo = !!mundo?.estado.ataques.some(a => a.zona === Number(b.dataset.hnFrente));
            b.disabled = !activo;
            b.style.visibility = activo ? 'visible' : 'hidden';
            b.style.display=activo?'':'none';
            b.style.pointerEvents = activo ? 'auto' : 'none';
            b.setAttribute('aria-hidden', String(!activo));
        }
        ultimoEstado = firma;
        disponibilidad();
        mapa();
    }
    /** Tienda: lo que está a la venta (países abiertos), lo que llega con los próximos países y lo que ya es tuyo. */
    function tiendaHTML() {
        const m = mundo!, abiertos = m.paisesAbiertos(), orden = (a: string, b: string) => paisDePlanta(a) - paisDePlanta(b) || precio(a) - precio(b);
        const venta = PLANTAS_TIENDA.filter(t => m.enVenta(t, abiertos)).sort(orden);
        const proximas = PLANTAS_TIENDA.filter(t => !m.estado.desbloqueadas.includes(t as SemillaNativa) && !abiertos.has(paisDePlanta(t))).sort(orden);
        const lista = tiendaVista === 'venta' ? venta : tiendaVista === 'proximas' ? proximas : [...m.estado.desbloqueadas];
        const ficha = (t: string) => `<article class="hn-producto">${imagen(t as SemillaNativa)}<b>${esc(nombre(t as SemillaNativa))}</b><small>${familia(t)} · ☀${costeSol(t)}</small>${tiendaVista === 'venta' ? `<button class="hn-comprar" data-hn-comprar="${t}" ${m.estado.monedas < precio(t) || m.estado.inicioCasa ? 'disabled' : ''}>${icono('moneda')}${precio(t)}</button>` : tiendaVista === 'proximas' ? `<em>${icono('candado')}${esc(nombrePais(paisDePlanta(t)))}</em>` : `<em>Tuya</em>`}</article>`;
        const pestana = (v: string, t: string, n: number) => `<button data-hn-tienda="${v}" aria-pressed="${tiendaVista === v}">${t} <small>${n}</small></button>`;
        return `<section class="cq-modal hn-pergamino hn-tienda"><header><h2>Tienda de Dave</h2><span class="hn-saldo">${icono('moneda')}<b>${m.estado.monedas}</b></span>${boton('cerrar-modal', tiendaDesde === 'equipo' ? 'Volver a la formación' : 'Volver al mapa', 'cerrar')}</header><nav class="hn-pestanas">${pestana('venta', 'A la venta', venta.length)}${pestana('proximas', 'Próximamente', proximas.length)}${pestana('tuyas', 'Tus plantas', m.estado.desbloqueadas.length)}</nav><p class="hn-nota">${m.estado.inicioCasa ? 'Defiende primero la casa: después podrás comprar.' : 'Las monedas se ganan recuperando áreas (una vez cada una) y resistiendo asedios. Cada país pone a la venta sus plantas cuando llegas a él.'}</p><div class="hn-productos">${lista.map(ficha).join('') || '<p>Nada por aquí todavía.</p>'}</div></section>`;
    }
    /** Explicación de Dave la primera vez que aparece una mecánica (en cola si ya hay otra ventana abierta). */
    function ensenar(tema: string, base = tema, cambio: Record<string, string> = {}) {
        if (sinTutorial || !TUTORIAL[base] || tutorial.visto(tema) || temaActual?.tema === tema || pendientes.some(p => p.tema === tema)) return;
        const t = TUTORIAL[base];
        pendientes.push({ tema, titulo: t.titulo, texto: t.texto.map(x => Object.entries(cambio).reduce((y, [k, v]) => y.replace('{' + k + '}', v), x)) });
        siguienteTutorial();
    }
    function siguienteTutorial() {
        // Se muestra encima de la ficha, el editor o la tienda (y al aceptarlo se vuelve a ellos); nunca sobre avisos
        // importantes ni en mitad de un combate que se está mirando, salvo los que explican ese combate.
        if (iniciando || !mundo || !pendientes.length || modal === 'tutorial' || (modal && !['zona', 'equipo', 'tienda'].includes(modal))) return;
        if (visible !== null && mundo.estado.ataques.some(a => a.zona === visible) && !/^(asedio|simultaneos)$/.test(pendientes[0].tema)) return;
        temaActual = pendientes.shift()!;
        modalTrasTutorial = modal;
        modal = 'tutorial';
        if (!mundo.pausada) { pausaPorTutorial = true; void pausar(true); }
        capa();
    }
    function capa() {
        cine?.destruir();cine=null;
        const c = $('.hn-capa');
        if (!modal) {
            c.innerHTML = '';
            for (const n of root.children)
                if (n instanceof HTMLElement)
                    n.inert = false;
            return;
        }
        for (const n of root.children)
            if (n instanceof HTMLElement && n !== c)
                n.inert = true;
        let html = '';
        if (modal === 'inicio')
            html = `<img class="hn-dave" src="${urlArtePvZ('dave-tutorial.webp')}" alt="Dave"><section class="cq-modal hn-pergamino hn-inicio"><h2>Primero, nuestra casa</h2><p>Los zombis llegaron a la ciudad. Arrastra una semilla hasta una casilla (o tócala y luego la casilla) y recoge soles para plantar más.</p><p>Después recuperarás el mapa área por área, en doce países, hasta el castillo del Dr. Zomboid. Cada área ganada paga monedas para comprar plantas en la tienda. Yo te explicaré cada cosa cuando aparezca, y todo queda en el botón Guía.</p><p class="hn-nota">Si cierras en plena batalla, ese ataque se repite desde su inicio.</p><nav class="hn-acciones"><button data-cq="iniciar" class="cq-verde">Proteger la casa</button>${boton('volver', 'Volver al jardín', 'salir')}</nav></section>`;
        else if(modal==='victoria')
            html=`<div class="cq-cine cq-cine-final"></div><nav class="cq-final-controles">${boton('cerrar-modal','El mapa está purificado: volver al mapa','mapa')}${boton('salir','Volver al jardín','salir')}</nav>`;
        else if (modal === 'interrumpida')
            html = `<section class="cq-modal hn-pergamino"><h2>Una defensa quedó interrumpida</h2><p>Las zonas recuperadas y sus defensas anteriores se conservan. Al continuar se repetirán los ataques pendientes desde su inicio.</p><button data-cq="retomar" class="cq-verde">Repetir los ataques pendientes</button>${boton('volver', 'Conservar el archivo y volver', 'salir')}</section>`;
        else if (modal === 'equipo')
            html = `<section class="cq-modal cq-editor hn-editor hn-pergamino"><header><h2>Semillas para ${casa(seleccion!)}</h2><span class="hn-cupo ${editor!.length >= cupo(seleccion!) ? 'hn-lleno' : ''}">${editor!.length} / ${cupo(seleccion!)} semillas</span><button class="hn-boton-tienda" data-cq="tienda">${icono('tienda')} Tienda</button>${boton('cerrar-modal', 'Volver al mapa', 'cerrar')}</header><div class="pvz-baraja-elegida" aria-label="Baraja de la zona">${editor!.map(t => `<button class="pvz-ranura" data-hn-quitar="${t}">${imagen(t)}</button>`).join('')}${Array.from({ length: Math.max(0, cupo(seleccion!) - editor!.length) }, () => '<span class="pvz-ranura hn-vacia" aria-hidden="true"></span>').join('')}</div><div class="cq-catalogo">${mundo!.estado.desbloqueadas.map(t => { const origen = mundo!.propietaria(t), activa = origen !== null && mundo!.estado.ataques.some(a => a.zona === origen); return `<button class="cq-ficha ${editor!.includes(t) ? 'cq-elegida' : ''}" data-hn-semilla="${t}" aria-pressed="${editor!.includes(t)}" ${activa ? 'disabled' : ''}>${imagen(t)}<b>${esc(nombre(t))}</b><small>${familia(t)} · ☀${costeSol(t)}</small><small class="hn-origen">${origen === null || origen === seleccion ? 'Libre' : 'En ' + esc(cortos[origen])}</small></button>`; }).join('')}</div><p>Esta área admite ${cupo(seleccion!)} semillas. Cada tipo defiende una sola zona: si lo traes de otra, sus plantas se retiran de allí y no se devuelven los soles. Compra más tipos en la tienda.</p><button class="cq-verde" data-cq="guardar-equipo">Guardar formación</button></section>`;
        else if (modal === 'zona')
            html = `<section class="cq-modal hn-pergamino hn-zona"><h2>${casa(seleccion!)}</h2><p class="hn-subtitulo">${TIPO_AREA[AREAS_CAMPANA[seleccion!].tipo]} · ${PAISES_CAMPANA[AREAS_CAMPANA[seleccion!].pais].nombre} › ${CIUDADES_CAMPANA[AREAS_CAMPANA[seleccion!].ciudad].nombre}</p><ul class="hn-datos"><li title="Carriles del tablero">🌿 ${AREAS_CAMPANA[seleccion!].filas} carriles</li>${AREAS_CAMPANA[seleccion!].agua.length ? '<li title="Necesitas nenúfares">💧 Agua</li>' : ''}${AREAS_CAMPANA[seleccion!].noche ? '<li title="No caen soles del cielo">🌙 Noche</li>' : ''}<li title="Semillas que admite su formación">🎴 Cupo ${cupo(seleccion!)}</li><li title="Monedas al recuperarla por primera vez">${cobrada(seleccion!) ? '🪙 Ya cobrada' : '🪙 ' + recompensa(seleccion!) + ' monedas'}</li></ul><p class="hn-estado hn-${estadoZona(mundo!, seleccion!).clase}">${estadoZona(mundo!, seleccion!).largo}</p><div class="hn-equipo">${mundo!.zona(seleccion!).equipo.length?mundo!.zona(seleccion!).equipo.map(imagen).join(''):'<small>Todavía no tiene formación: toca <b>Formación</b> para elegir sus semillas.</small>'}</div><div class="hn-zombis" aria-label="Zombis de esta zona"><small>Zombis</small>${zombisDe(seleccion!)}</div><nav>${conTexto(boton('equipo', 'Preparar formación', 'equipo'),'Formación')}${mundo!.zona(seleccion!).capturada ? conTexto(boton('ver', 'Ver la defensa', 'historia'),'Ver defensa') : conTexto(boton('expedicion', 'Iniciar expedición', 'atacar'),'Expedición')}${conTexto(boton('cerrar-modal', 'Volver al mapa', 'cerrar'),'Volver')}</nav></section>`;
        else if (modal === 'salida')
            html = `<section class="cq-modal hn-pergamino"><h2>La batalla sigue</h2><p>Puedes recorrer el mapa sin perder el combate. Termina los ataques antes de cerrar esta historia para guardar sus defensas.</p>${boton('cerrar-modal', 'Volver al mapa', 'mapa')}</section>`;
        else if (modal === 'ayuda')
            html = `<img class="hn-dave" src="${urlArtePvZ('dave-tutorial.webp')}" alt="Dave"><section class="cq-modal hn-pergamino hn-guia"><h2>Guía de la campaña</h2><p>En combate arrastra una semilla a una casilla (o tócala y luego la casilla) y recoge los soles para plantar más.</p>${GUIA.map(k => `<details${k === 'mapa' ? ' open' : ''}><summary>${TUTORIAL[k].titulo}</summary>${TUTORIAL[k].texto.map(x => `<p>${esc(x.replace('{pais}', 'un país nuevo'))}</p>`).join('')}</details>`).join('')}<nav class="hn-acciones">${mundo && !mundo.estado.ataques.length ? boton('nueva', 'Comenzar otra historia', 'historia') : ''}${boton('cerrar-modal', 'Entendido', 'cerrar')}</nav></section>`;
        else if (modal === 'tutorial' && temaActual)
            html = `<img class="hn-dave" src="${urlArtePvZ('dave-tutorial.webp')}" alt="Dave"><section class="cq-modal hn-pergamino hn-tutorial"><small class="hn-etiqueta">Dave te cuenta</small><h2>${esc(temaActual.titulo)}</h2>${temaActual.texto.map(x => `<p>${esc(x)}</p>`).join('')}<nav class="hn-acciones"><button class="cq-verde" data-cq="tutorial-ok">¡Entendido!</button></nav></section>`;
        else if (modal === 'tienda')
            html = tiendaHTML();
        else if (modal === 'pausa')
            html = `<section class="cq-modal hn-pergamino"><h2>Un respiro en el jardín</h2>${boton('pausa', 'Reanudar todos los frentes', 'reanudar')}${boton('salir', 'Volver al jardín', 'salir')}</section>`;
        else if (modal === 'perdida')
            html = `<section class="cq-modal hn-pergamino"><h2>Los zombis tomaron la casa</h2><button data-cq="nueva" class="cq-verde">Comenzar otra historia</button>${boton('volver', 'Volver al jardín', 'salir')}</section>`;
        else if (modal === 'nueva')
            html = `<section class="cq-modal hn-pergamino"><h2>¿Empezar otra historia?</h2><p>La historia actual se reemplaza.</p><button data-cq="confirmar-nueva">Comenzar otra historia</button>${boton('cerrar-modal', 'Conservar la historia', 'cerrar')}</section>`;
        else if (modal === 'ocupada')
            html = `<section class="cq-modal hn-pergamino"><h2>La historia está en otra pestaña</h2><p>Cierra la otra pestaña antes de continuar aquí. Su progreso se conserva.</p><button data-cq="recargar" class="cq-verde">Volver a comprobar</button>${boton('volver', 'Volver al jardín', 'salir')}</section>`;
        else if (modal === 'guardado-error')
            html = `<section class="cq-modal hn-pergamino"><h2>No se pudo guardar</h2><p>${esc(guardado.error)}</p><p>Los ataques están pausados. Libera espacio en el navegador y reintenta; si sales ahora, un ataque pendiente se repetirá desde su inicio.</p><button data-cq="reintentar-guardado" class="cq-verde">Reintentar guardado</button></section>`;
        else if (modal === 'motor-error')
            html = `<section class="cq-modal hn-pergamino"><h2>La defensa no respondió</h2><p>${esc(errorMotor)}</p><p>Las defensas terminadas se conservan. Al volver a cargar tendrás que repetir los ataques pendientes desde su inicio.</p><button data-cq="recargar" class="cq-verde">Volver a cargar</button></section>`;
        else if (modal === 'error')
            html = `<section class="cq-modal hn-pergamino"><h2>No se pudo preparar la historia</h2><p>${esc(guardado.error || 'El guardado no se pudo leer.')}</p><p>Tu historia no se borra. Si quieres que la revisemos, descarga una copia del archivo.</p>${boton('exportar', 'Descargar copia del archivo', 'exportar')}${boton('volver', 'Conservar y volver', 'salir')}</section>`;
        c.innerHTML = html;
        // La película final necesita todas las hojas: se completan solo al llegar aquí
        if(modal==='victoria')void atlas.cargar().then(()=>{if(modal==='victoria'&&!cine&&root.querySelector('.cq-cine-final'))cine=new CinematicaConquista(atlas,$('.cq-cine-final'),false,true);});
        disponibilidad();
    }
    async function pausar(si: boolean) {
        if (!mundo)
            return;
        mundo.pausada = si;
        await Promise.all([...instancias.values()].filter(i => i.lista).map(i => si ? i.motor.pausa() : i.motor.reanudar()));
        anterior = performance.now();
        acumulado = 0;
    }
    async function alternarPausa() {
        if (!mundo) return;
        await pausar(!mundo.pausada);
        modal = mundo.pausada ? 'pausa' : '';
        capa();
        pintar();
    }
    function falloMotor(e: unknown) {
        errorMotor = e instanceof Error ? e.message : String(e);
        void pausar(true);
        modal = 'motor-error';
        capa();
        pintar();
    }
    const firmaCampo = (c: ConfigDefensaNativa) => JSON.stringify([c.zona, c.semillas, c.punto]);
    function configuracion(id: ZonaNativa) {
        const z=mundo?.zona(id),previstas=AREAS_CAMPANA[id].desbloquea as SemillaNativa[];
        // Explorar un destino sin baraja aún no debe vaciar y reconstruir su vista previa.
        // Una zona propia sin semillas sí conserva su defensa vacía y vulnerable.
        return nivelCampana(id,z&&(z.capturada||z.equipo.length>0)?z.equipo:previstas,mundo?.estado.semilla??23,z?.punto??null,false,0,mundo?.estado.fusiones??[]);
    }
    /** Vista previa de los zombis de un área, como antes de cada nivel de PvZ (de su composición con la semilla de la
     * historia; los asedios agregan más del mismo tipo). */
    function zombisDe(id: ZonaNativa) {
        const tipos = [...new Set(configuracion(id).oleadas.flat().map(z => z.tipo))].slice(0, 12);
        return tipos.map(t => { const r = retratoZombiNativo(t), n = esc(ZOMBIS_NATIVOS.find(z => z.id === t)?.nombre ?? t); return r ? `<img src="${r}" alt="${n}" title="${n}">` : ''; }).join('');
    }
    function disponibilidad() {
        const listas=camposInicio().every(id=>instancias.get(id)?.lista);
        for (const b of root.querySelectorAll<HTMLButtonElement>('[data-cq="iniciar"],[data-cq="retomar"]')) {
            b.disabled = !listas;
            b.setAttribute('aria-busy', String(!listas));
            b.textContent = !listas ? 'Preparando semillas…' : b.dataset.cq === 'iniciar' ? 'Proteger la casa' : 'Repetir los ataques pendientes';
        }
        for (const b of root.querySelectorAll<HTMLButtonElement>('[data-cq="ver"],[data-cq="expedicion"]')) {
            b.disabled = iniciando || seleccion === null || !instancias.get(seleccion)?.lista;
            b.setAttribute('aria-busy', String(b.disabled));
            // Mientras se prepara el campo, el botón dice que está cargando en vez de verse apagado sin razón.
            const rotulo = b.parentElement?.querySelector('small');
            if (rotulo) rotulo.textContent = b.disabled && !iniciando ? 'Preparando…' : b.dataset.cq === 'ver' ? 'Ver defensa' : 'Expedición';
        }
    }
    async function prepararCampo(c: ConfigDefensaNativa) {
        let i = instancias.get(c.zona);
        if (!i) {
            const motor = new FrenteGardendless($('.hn-defensas'), String(c.zona), perfil, undefined, { historia:true });
            i = {motor, ataque:null, lista:false, estado:null, firma:'', precarga:null};
            instancias.set(c.zona,i);
            pintar();
        }
        if (i.ataque !== null) return i;
        const firma = firmaCampo(c);
        if (i.firma === firma) { if(i.precarga) await i.precarga; return i; }
        const actual=i, previa=i.precarga;
        i.firma=firma; i.lista=false;
        const tarea=(async()=>{
            if(previa) await previa;
            if(muerto || instancias.get(c.zona)!==actual) return;
            actual.estado=await actual.motor.prepararHistoria(c);
        })();
        i.precarga=tarea;
        disponibilidad();
        try { await tarea; if(i.precarga===tarea && instancias.get(c.zona)===i) {i.lista=true;i.precarga=null;} }
        catch(e) { if(!muerto && instancias.get(c.zona)===i) throw e; }
        finally { disponibilidad(); }
        return i;
    }
    function camposInicio() { return mundo?.estado.ataques.length?mundo.estado.ataques.map(a=>a.zona):[8,9]; }
    function prepararCampos() {
        if(muerto)return;
        const activas=mundo?.estado.ataques.map(a=>a.zona)??[];
        const proximas=mundo?.fin?[]:mundo&&!mundo.estado.inicioCasa
            ? mundo.estado.zonas.filter(z=>mundo!.puedeLlegar(z.id)).map(z=>z.id):[8,9];
        // Cada campo es un motor completo (memoria y gráficos): se precargan los combates, lo que se mira o se tocó y
        // solo tres vecinas más (antes, todas las alcanzables hasta ocho, y el celular se ahogaba)
        const fijas=[...new Set([...activas,...(visible===null?[]:[visible]),...(seleccion===null?[]:[seleccion])])];
        const extra=[...new Set([...(mundo?.fin?[]:mundo?.fronteras()??[]),...proximas])].filter(id=>!fijas.includes(id)).slice(0,Math.max(0,Math.min(3,8-fijas.length)));
        const deseadas=[...fijas,...extra];
        // Los combates vivos nunca se descartan. Los puntos terminados permiten liberar
        // motores de interiores seguros sin perder una sola planta ni su vida.
        for(const [id,i] of instancias)if(!deseadas.includes(id)&&!activas.includes(id)) {
            i.motor.destruir();instancias.delete(id);
        }
        // El primer motor carga solo: así los demás toman de la caché sus imágenes (decenas de MB) en vez de
        // descargarlas todos a la vez
        const nuevos=deseadas.filter(id=>instancias.get(id)?.ataque==null);
        const hayListo=[...instancias.values()].some(i=>i.lista);
        void (hayListo||!nuevos.length?Promise.all(nuevos.map(id=>prepararCampo(configuracion(id))))
            :prepararCampo(configuracion(nuevos[0])).then(()=>Promise.all(nuevos.slice(1).map(id=>prepararCampo(configuracion(id))))))
            .catch(e=>{if(!muerto)falloMotor(e);});
    }
    async function cargarAtaque(a: AtaqueNativo) {
        if (instancias.get(a.zona)?.ataque === a.id) return;
        cargando++;
        try {
            const c=nivelCampana(a.zona,a.equipo,a.semilla,a.punto,false,a.refuerzo,mundo!.estado.fusiones), i=await prepararCampo(c);
            i.estado=await i.motor.iniciarHistoria(c);
            i.ataque=a.id;
            if(mundo!.pausada) await i.motor.pausa();
        } catch(e) {if(!muerto)falloMotor(e);}
        finally {cargando--;pintar();}
    }
    async function ver(id: ZonaNativa) {
        const i=instancias.get(id);
        if(!i?.lista) {noticia('Las semillas de esta zona todavía se están preparando.');return;}
        if(i.ataque===null && i.estado?.fase==='preparando') {
            const c=configuracion(id);
            if(!mundo!.zona(id).punto) return;
            i.estado=await i.motor.iniciarHistoria({...c,reposo:true});
        }
        visible=id;modal='';capa();pintar();
        await i.motor.pasoHistoria(0,true);
    }
    async function activar() {
        if (iniciando) return;
        iniciando = true;
        const modalInicial=modal;
        try {
        if (!await adquirir()) {
            if (mundo)
                mundo.pausada = true;
            modal = 'ocupada'; capa();
            noticia('Esta historia está abierta en otra pestaña. Ciérrala para continuar aquí.');
            return;
        }
        if (errorArchivo) {
            modal = 'error';
            capa();
            return;
        }
        if (!mundo)
            mundo = new HistoriaNativa();
        const inicio=camposInicio();
        await prepararCampo(configuracion(inicio[0]));
        await Promise.all(inicio.slice(1).map(id=>prepararCampo(configuracion(id))));
        mundo.pausada = false;
        if (!guardar())
            return;
        await Promise.all(mundo.estado.ataques.map(cargarAtaque));
        if(mundo.estado.inicioCasa) visible=8;
        if(modal===modalInicial) modal='';
        capa();pintar();
        prepararCampos();
        } finally { iniciando = false; anterior=performance.now();acumulado=0;disponibilidad();
            // Las explicaciones que llegaron mientras cargaban los motores esperaban en cola.
            siguienteTutorial(); }
    }
    async function terminar(id: ZonaNativa, i: Instancia, estado: ObservacionGardendless) {
        if (i.ataque === null || !['victoria', 'derrota'].includes(estado.fase))
            return;
        await i.motor.pausa();
        const punto = estado.fase === 'victoria' ? await i.motor.puntoHistoria() : null, fusionesAntes = mundo!.estado.fusiones.length, monedasAntes = mundo!.estado.monedas, eraCasa = mundo!.estado.inicioCasa;
        if (!mundo!.resultado(i.ataque, estado.fase as 'victoria' | 'derrota', punto))
            return;
        const nuevasFusiones = mundo!.estado.fusiones.length - fusionesAntes;
        i.ataque = null;
        if (!guardar())
            return;
        if (visible === id) visible = null;
        if (seleccion === id && modal !== 'equipo') seleccion = null;
        // Tras una victoria, decir cuál es el siguiente paso si no hay otra expedición en marcha.
        const siguiente = estado.fase === 'victoria' && !mundo!.estado.ataques.length ? AREAS_CAMPANA.map(e => e.id).find(z => !mundo!.zona(z).capturada && mundo!.puedeLlegar(z)) : undefined;
        if (nuevasFusiones > 0) { noticia(`El laboratorio de Forjaria enseñó ${nuevasFusiones} fusiones nuevas: siembra una planta sobre otra para fusionarlas. Están en el Almanaque.`, 12000); }
        else noticia(estado.fase === 'victoria' ? casa(id) + ' está a salvo' + (mundo!.estado.monedas > monedasAntes ? ` (+${mundo!.estado.monedas - monedasAntes} monedas)` : '') + (siguiente !== undefined ? `. Siguiente: toca ${casa(siguiente)} en el mapa para recuperarla.` : '') : casa(id) + ' cayó ante los zombis', siguiente !== undefined ? 10000 : 5500);
        if (estado.fase === 'victoria') {
            if (eraCasa) { ensenar('mapa'); ensenar('monedas'); }
            else if (id !== 8) ensenar('descanso');
            if (mundo!.estado.zonas.some(z => z.id !== 8 && mundo!.segura(z.id))) ensenar('despejada');
            if (nuevasFusiones > 0) ensenar('fusion');
        }
        if (mundo!.estado.perdida) {
            mundo!.pausada = true;
            for (const v of instancias.values())
                await v.motor.pausa();
            modal = 'perdida';
            capa();
        }
        if(mundo!.fin){modal='victoria';capa();}
        pintar();
        if(!mundo!.estado.perdida) prepararCampos();
    }
    async function avanzar(now: number) {
        raf = requestAnimationFrame(avanzar);
        cine?.dibujar(now);
        const delta = Math.min(.1, Math.max(0, (now - anterior) / 1000));
        anterior = now;
        if (avisoHasta && now > avisoHasta) {
            $('.hn-noticia').hidden = true;
            avisoHasta = 0;
        }
        if (muerto || iniciando || !mundo || mundo.pausada || !bloqueo || mundo.estado.perdida || modal === 'interrumpida') {
            acumulado = 0;
            return;
        }
        acumulado = Math.min(.25, acumulado + delta);
        if (ocupado)
            return;
        const n = Math.min(6, Math.floor(acumulado * 60));
        if (!n)
            return;
        acumulado -= n / 60;
        ocupado = true;
        try {
            let pasos = 0, nueva: AtaqueNativo | null = null;
            for (let k = 0; k < n; k++) {
                pasos++;
                nueva = mundo.paso();
                if (nueva)
                    break;
            }
            const activas = [...instancias.entries()].filter(([, i]) => i.lista && i.ataque !== null);
            const estados = await Promise.all(activas.map(async ([id, i]) => ({ id, i, estado: await i.motor.pasoHistoria(i.ataque === null ? 0 : pasos, id === visible) })));
            for (const { id, i, estado } of estados) {
                i.estado = estado;
                await terminar(id, i, estado);
            }
            if (nueva && !mundo.estado.perdida) {
                if (!guardar()) return;
                void cargarAtaque(nueva);
                noticia('¡Atacan '+casa(nueva.zona)+'!'+(nueva.refuerzo?' Vienen reforzados ('+nueva.refuerzo+' de 6).':'')+' Toca sus espadas para defenderla.',9000);
                if (mundo.zona(nueva.zona).capturada) ensenar('asedio');
                if (mundo.estado.ataques.length >= 2) ensenar('simultaneos');
            }
            if (ultimoEstado !== mundo.estado.ataques.map(a => a.id + ':' + a.zona).join(','))
                pintar();
        }
        catch (e) {
            if (!muerto)
                falloMotor(e);
        }
        finally {
            ocupado = false;
        }
    }
    root.addEventListener('click', async (e) => {
        const target = (e.target as Element).closest<HTMLElement>('button');
        if (!target || target.hasAttribute('disabled'))
            return;
        try {
            if (target.dataset.hnIr) {
                escala = target.dataset.hnIr === 'mundo' ? 'mundo' : 'pais';
                if (escala === 'pais') pais = CIUDADES_CAMPANA[ciudad].pais;
                mapa();
                return;
            }
            if (target.dataset.hnTienda) {
                tiendaVista = target.dataset.hnTienda as typeof tiendaVista;
                capa();
                return;
            }
            if (target.dataset.hnComprar && mundo) {
                const t = target.dataset.hnComprar as SemillaNativa, alDia = revisionEditor === mundo.estado.revision;
                if (!mundo.comprar(t)) { noticia('No alcanza o ya no está a la venta.'); return; }
                // Comprar no cambia ninguna reserva: el editor abierto sigue vigente y puede guardar sin aviso.
                if (editor && alDia) revisionEditor = mundo.estado.revision;
                if (!guardar()) return;
                noticia(`Compraste ${nombre(t)}. Ya puedes llevarla en cualquier formación.`, 4500);
                capa(); mapa();
                return;
            }
            if (target.dataset.hnPais !== undefined) {
                pais = Number(target.dataset.hnPais);
                escala = 'pais';
                mapa();
                return;
            }
            if (target.dataset.hnCiudad !== undefined) {
                ciudad = Number(target.dataset.hnCiudad);
                escala = 'ciudad';
                mapa();
                return;
            }
            if (target.dataset.hnFrente !== undefined) {
                await ver(Number(target.dataset.hnFrente) as ZonaNativa);
                return;
            }
            if (target.dataset.hnZona !== undefined) {
                const id = Number(target.dataset.hnZona);
                if (!mundo || !Number.isInteger(id) || id<0 || id>=AREAS_CAMPANA.length) return;
                if(!mundo.puedeLlegar(id)&&!mundo.zona(id).capturada) {
                    noticia(id===239?'Recupera primero las otras 239 áreas para llegar al castillo del Dr. Zomboid.':AREAS_CAMPANA[id].tipo==='fortaleza'&&mundo&&!mundo.fortalezaAbierta(id)?'Recupera primero las otras áreas de esta ciudad para llegar a su fortaleza.':'Necesitas recuperar una zona vecina y mantener una ruta hasta la casa.');return;
                }
                seleccion = id;
                if (mundo.estado.ataques.some(a => a.zona === id)) {await ver(id);return;}
                if (mundo.explorar(id) && !guardar()) return;
                prepararCampos();
                modal = 'zona';
                capa();
                const area = AREAS_CAMPANA[id];
                if (area.pais > 0) ensenar('pais-' + area.pais, 'pais', { pais: PAISES_CAMPANA[area.pais].nombre });
                if (area.tipo === 'fortaleza') ensenar('fortaleza');
                if (area.agua.length) ensenar('agua');
                if (area.noche) ensenar('noche');
                return;
            }
            const semilla = (target.dataset.hnSemilla || target.dataset.hnQuitar) as SemillaNativa | undefined;
            if (semilla && editor) {
                const elegida = editor.includes(semilla);
                if(!elegida&&seleccion!==null&&editor.length>=cupo(seleccion)){noticia(`Esta área admite ${cupo(seleccion)} semillas. Retira una para cambiarla.`);return;}
                editor = elegida ? editor.filter(t => t !== semilla) : [...editor, semilla];
                const r = target.getBoundingClientRect();
                capa();
                if (!elegida) {
                    const dest = $('.pvz-baraja-elegida').lastElementChild;
                    if (dest instanceof HTMLElement)
                        volarSobrePvZ(root, retratoSemilla(semilla), r, dest);
                }
                return;
            }
            switch (target.dataset.cq) {
                case 'iniciar':
                case 'retomar':
                    await activar();
                    break;
                case 'mapa':
                    if(visible!==null&&mundo){pais=AREAS_CAMPANA[visible].pais;ciudad=AREAS_CAMPANA[visible].ciudad;}
                    visible = null;
                    escala = 'ciudad';
                    pintar();
                    siguienteTutorial();
                    break;
                case 'subir':
                    visible = null;
                    escala = escala === 'ciudad' ? 'pais' : 'mundo';
                    pintar();
                    break;
                case 'pausa':
                    await alternarPausa();
                    break;
                case 'ayuda':
                    modal = 'ayuda';
                    capa();
                    break;
                case 'cerrar-modal':
                    // Desde la tienda se vuelve a la formación si se llegó desde ahí.
                    if (modal === 'tienda' && tiendaDesde === 'equipo' && editor) { modal = 'equipo'; tiendaDesde = ''; capa(); break; }
                    modal = '';
                    editor = null;
                    capa();
                    pintar();
                    siguienteTutorial();
                    break;
                case 'tienda':
                    if (!mundo) break;
                    tiendaDesde = modal === 'equipo' ? 'equipo' : '';
                    tiendaVista = 'venta';
                    modal = 'tienda';
                    capa();
                    break;
                case 'tutorial-ok':
                    if (temaActual) tutorial.marcar(temaActual.tema);
                    temaActual = null;
                    modal = modalTrasTutorial; modalTrasTutorial = '';
                    capa();
                    if (pausaPorTutorial && !pendientes.length) { pausaPorTutorial = false; await pausar(false); }
                    siguienteTutorial();
                    pintar();
                    break;
                case 'equipo':
                    if (!mundo || seleccion === null)
                        break;
                    if(!mundo.puedeLlegar(seleccion)){noticia('Recupera la ruta hasta la casa antes de cambiar esta formación.');ensenar('ruta');break;}
                    editor = [...mundo.zona(seleccion).equipo].slice(0, cupo(seleccion));
                    revisionEditor = mundo.estado.revision;
                    modal = 'equipo';
                    capa();
                    ensenar('formacion');
                    break;
                case 'guardar-equipo':
                    if (!mundo || seleccion === null || !editor)
                        break;
                    if (!mundo.preparar(seleccion, editor, revisionEditor)) {
                        revisionEditor = mundo.estado.revision;
                        capa();
                        noticia('Las reservas cambiaron o una zona está combatiendo. Revisa la formación.');
                        break;
                    }
                    if (!guardar()) break;
                    editor = null;
                    modal = 'zona';
                    capa();
                    prepararCampos();
                    break;
                case 'expedicion': {
                    const a=seleccion===null?null:mundo?.expedicion(seleccion);
                    if (!a) {
                        const zz=mundo&&seleccion!==null?mundo.zona(seleccion):null;
                        noticia(!zz||!mundo?'Elige una zona del mapa.':!zz.equipo.length?'Primero prepara su formación de semillas.':!mundo.puedeLlegar(zz.id)?'Necesitas una ruta hasta la casa por zonas nuestras.':zz.descanso>mundo.t?'Las tropas descansan un momento: inténtalo en unos segundos.':'Ya hay demasiados combates abiertos (máximo tres expediciones y seis combates).');
                        break;
                    }
                    if (!guardar()) break;
                    await cargarAtaque(a);
                    modal = '';
                    capa();
                    visible = a.zona;
                    pintar();
                    break;
                }
                case 'ver':
                    if (seleccion !== null)
                        await ver(seleccion);
                    break;
                case 'exportar':
                    descargar();
                    break;
                case 'recargar':
                    location.reload();
                    break;
                case 'reintentar-guardado':
                    if (guardar()) {
                        await Promise.all(mundo!.estado.ataques
                            .filter(a => instancias.get(a.zona)?.ataque !== a.id)
                            .map(cargarAtaque));
                        await pausar(false);
                        editor = null;
                        modal = '';
                        capa();
                        pintar();
                    }
                    break;
                case 'pantalla':
                    await (document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen());
                    break;
                case 'salir':
                    if (mundo?.estado.ataques.length && !mundo.estado.perdida) {
                        modal = 'salida';
                        capa();
                        break;
                    }
                    if (mundo) {
                        await pausar(true);
                        if (!guardar()) break;
                    }
                    for (const i of instancias.values())
                        await i.motor.cerrar();
                    volver();
                    break;
                case 'volver':
                    volver();
                    break;
                case 'nueva':
                    modal = 'nueva';
                    capa();
                    break;
                case 'confirmar-nueva':
                    if(iniciando) break;
                    for (const i of instancias.values())
                        i.motor.destruir();
                    instancias.clear();
                    mundo = new HistoriaNativa();
                    visible=null;seleccion=null;editor=null;escala='ciudad';pais=AREAS_CAMPANA[8].pais;ciudad=AREAS_CAMPANA[8].ciudad;
                    await activar();
                    break;
            }
        }
        catch (e) {
            noticia(e instanceof Error ? e.message : String(e));
        }
    }, { signal: eventos.signal });
    window.addEventListener('message', e => { if (e.origin !== location.origin || e.data?.canal !== 'semilla-motor-v1' || ![...instancias.values()].some(i => i.motor.frame.contentWindow === e.source))
        return; if (e.data.estado === 'error')
        noticia(e.data.mensaje);
    else if (e.data.estado === 'pausa-solicitada' && mundo && (!modal || modal === 'pausa')) {
        void alternarPausa().catch(falloMotor);
    } }, { signal: eventos.signal });
    window.addEventListener('keydown', e => {
        if (e.repeat || !mundo) return;
        if (e.key === 'Escape' && ['equipo', 'zona', 'ayuda', 'salida', 'nueva'].includes(modal)) {
            e.preventDefault();
            modal = ''; editor = null; capa();
        } else if ((e.key === 'Escape' || e.code === 'Space') && (!modal || modal === 'pausa')
            && !(e.target instanceof Element && e.target.closest('button,input'))) {
            e.preventDefault();
            void alternarPausa().catch(falloMotor);
        }
    }, { signal: eventos.signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden && mundo && !mundo.pausada) {
        mundo.pausada = true;
        for (const i of instancias.values())
            if (i.lista)
                void i.motor.pausa();
        modal = 'pausa';
        capa();
        pintar();
    } }, { signal: eventos.signal });
    window.addEventListener('beforeunload', e => { if (mundo?.estado.ataques.length && !mundo.estado.perdida || necesitaGuardar) {
        e.preventDefault();
        e.returnValue = '';
    } }, { signal: eventos.signal });
    window.addEventListener('pagehide', () => { muerto = true; cancelAnimationFrame(raf); eventos.abort(); for (const i of instancias.values())
        i.motor.destruir(); liberar(); cine?.destruir(); atlas.destruir(); }, { once: true });
    if (params.has('prueba'))
        (window as any).__historiaNativa = {
            mundo: () => mundo, instancias: () => instancias, observar: () => mundo?.exportar(),
            control: () => ({cargando, ocupado, anterior, acumulado, raf, visible, bloqueo, muerto})
        };
    // Solo las plantas (la batalla la dibuja su propio motor): antes bajaba las 19 hojas antes de mostrar nada
    await Promise.all([atlas.cargar(undefined, ['dia', 'noche', 'piscina', 'niebla', 'tripitidora']), cargarRetratosNativos().catch(() => undefined)]);
    pintar();
    if (errorArchivo) {
        modal = 'error';
        capa();
    }
    else if (!mundo) {
        modal = 'inicio';
        capa();
    }
    else if (mundo.estado.perdida) {
        modal = 'perdida';
        capa();
    }
    else if(mundo.fin) {
        await adquirir();modal='victoria';capa();
    }
    else if (mundo.estado.ataques.length) {
        modal = 'interrumpida';
        capa();
    }
    else {
        await activar();
        visible = null;
        pintar();
        // Quien ya pasó la casa con una versión anterior no vio el mapa ni la tienda explicados (30 de octubre).
        if (!mundo.estado.inicioCasa && !mundo.fin) { ensenar('mapa'); ensenar('monedas'); }
    }
    if(!errorArchivo && (!mundo || !mundo.estado.perdida) && modal!=='ocupada') prepararCampos();
    raf = requestAnimationFrame(avanzar);
}
