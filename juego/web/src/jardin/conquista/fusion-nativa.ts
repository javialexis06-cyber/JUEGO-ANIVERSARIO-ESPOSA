/** Minijuego Fusión (`jardin.html?modo=fusion`): el modo Fusión aparte que pedía el encargo del 17 de octubre,
 * sobre Gardendless y las 117 recetas nativas de PvZ Fusión 4.0.x que ya usan la historia y el Versus.
 * Doce niveles, uno por mundo de la campaña, con las mismas oleadas ya probadas de esas áreas (no hay balance
 * nuevo). Sembrar una planta encima de otra de su receta forma la fusión. El progreso se guarda aparte. */
import './conquista.css';
import './versus-nativo.css';
import './fusion-nativa.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/900.css';
import { FrenteGardendless } from '../motores/frente-gardendless';
import { nivelCampana, nombreSemillaNativa, nombrePlantaCatalogo, nativoDe, TIPOS_NATIVOS, PLANTAS_NATIVAS, FUSIONES_NATIVAS, type SemillaNativa } from '../motores/nivel-historia';
import { cargarRetratosNativos, retratoPlantaNativa } from '../motores/retratos-nativos';
import { ARTE_PLANTAS_PVZ } from '../pvz/arte/catalogo';
import { AREAS_CAMPANA, PAISES_CAMPANA } from './campana-datos';
import { esModoAmigo } from '../../salas/perfil';
import { AtlasPvZ } from '../pvz/arte/atlas';
import { RetratosPvZ } from '../pvz/ui/retratos';
import { PLANTAS_PVZ } from '../pvz/datos/plantas';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const HEREDADAS = new Set<string>(Object.values(TIPOS_NATIVOS));
const SEMILLAS = [...Object.keys(TIPOS_NATIVOS), ...PLANTAS_NATIVAS.map(p => p.id).filter(id => !HEREDADAS.has(id))] as SemillaNativa[];
const FUSIONES = FUSIONES_NATIVAS.map(f => f.id);
const MUNDOS: Record<string, string> = { modern: 'Jardín de hoy', egypt: 'Antiguo Egipto', pirate: 'Mares piratas', cowboy: 'Salvaje Oeste', beach: 'Playa grande', ice: 'Edad de hielo', lostcity: 'Ciudad perdida', future: 'Futuro lejano', eighties: 'Años ochenta', dino: 'Era jurásica', sky: 'Ciudad del cielo', dark: 'Edad oscura' };
const COLOR_MUNDO: Record<string, string> = { modern: '#5aa23c', egypt: '#d3a24c', pirate: '#8a5a2e', cowboy: '#c08a3e', beach: '#3fa3c8', ice: '#7fbfdc', lostcity: '#4f8f3a', future: '#5f7ea0', eighties: '#8a4fc0', dino: '#6a9a3a', sky: '#78aee0', dark: '#5a4a78' };
/** Un nivel por país: un área sin agua de dificultad media dentro de su país (de cinco carriles si la hay). */
const NIVELES = PAISES_CAMPANA.map(p => {
    const sinAgua = AREAS_CAMPANA.filter(a => a.pais === p.id && !a.heredada && a.tipo !== 'fortaleza' && !a.agua.length && a.filas >= 4 && a.filas <= 6);
    const opciones = (sinAgua.some(a => a.filas === 5) ? sinAgua.filter(a => a.filas === 5) : sinAgua).sort((a, b) => a.dificultad - b.dificultad);
    return opciones[Math.floor(opciones.length / 2)] ?? opciones[0];
}).filter(Boolean);
const INICIAL: SemillaNativa[] = ['girasol', 'lanzaguisantes', 'nuez', 'petacereza', 'patatapum', 'hielaguisantes', 'seta-desesporada', 'repetidora'].filter(t => SEMILLAS.includes(t as SemillaNativa)) as SemillaNativa[];
interface Progreso { v: 1; ganados: number[]; mazo: string[] }

export async function montarFusionNativa() {
    const amigo = esModoAmigo(), perfil = amigo ? 'amigos' : 'pareja', clave = amigo ? 'amigo-pvz-fusion-v1' : 'pvz-fusion-v1';
    const atlas = new AtlasPvZ(), retratos = new RetratosPvZ(atlas), params = new URLSearchParams(location.search);
    document.body.dataset.conquista = '1';
    document.title = 'La Semilla Madre · Fusión';
    const root = document.createElement('main');
    root.id = 'cq-app';
    root.className = 'vs-app fu-app';
    root.innerHTML = '<section class="vs-carga"><small>PVZ FUSIÓN</small><h1>Preparando las semillas…</h1></section>';
    document.body.append(root);
    const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
    await Promise.all([atlas.cargar(undefined, ['dia', 'noche', 'piscina', 'niebla', 'tripitidora', 'ropa', 'protegidos', 'especiales', 'agua']).catch(() => undefined), cargarRetratosNativos().catch(() => undefined)]);
    const nombrePlanta = (t: string) => nombrePlantaCatalogo(t, PLANTAS_PVZ[t as keyof typeof PLANTAS_PVZ] ? nombreSemillaNativa(t, PLANTAS_PVZ[t as keyof typeof PLANTAS_PVZ].nombre) : undefined);
    const imgPlanta = (t: string) => { try { return ARTE_PLANTAS_PVZ[t] ? retratos.planta(t) : retratoPlantaNativa(t); } catch { return ''; } };
    /** Nombre e imagen de un tipo nativo (receta): el propio si es una de las 32 heredadas. */
    const propioDe = (nativo: string) => Object.entries(TIPOS_NATIVOS).find(([, n]) => n === nativo)?.[0] ?? nativo;

    let progreso: Progreso = { v: 1, ganados: [], mazo: INICIAL };
    try { const p = JSON.parse(localStorage.getItem(clave) ?? 'null'); if (p?.v === 1 && Array.isArray(p.ganados)) progreso = { v: 1, ganados: p.ganados.filter((n: unknown) => Number.isInteger(n)), mazo: Array.isArray(p.mazo) && p.mazo.length ? p.mazo.filter((t: unknown) => SEMILLAS.includes(t as SemillaNativa)).slice(0, 8) : INICIAL }; } catch { /* progreso nuevo */ }
    const guardar = () => { try { localStorage.setItem(clave, JSON.stringify(progreso)); return true; } catch { return false; } };
    let nivel = 0, mazo = [...progreso.mazo] as SemillaNativa[], todas = false;
    let frente: FrenteGardendless | null = null, raf = 0, anterior = performance.now(), acumulado = 0, enPaso = false, pausa = false, fin: 'victoria' | 'derrota' | null = null, generacion = 0, muerto = false;

    /** Recetas cuyas dos plantas están en el mazo (una receta puede pedir dos veces la misma planta). */
    const recetasDe = (semillas: readonly string[]) => { const n = new Set(semillas.map(nativoDe)); return FUSIONES_NATIVAS.filter(f => f.padres.every(p => n.has(p))); };
    const receta = (f: (typeof FUSIONES_NATIVAS)[number]) => { const a = nombrePlanta(propioDe(f.padres[0])), b = nombrePlanta(propioDe(f.padres[1])); return `<li class="fu-receta" title="${esc(a)} + ${esc(b)} = ${esc(f.nombre)}"><div><img src="${imgPlanta(propioDe(f.padres[0]))}" alt=""><i>+</i><img src="${imgPlanta(propioDe(f.padres[1]))}" alt=""><i>=</i><img class="fu-resultado" src="${imgPlanta(f.id)}" alt=""></div><b>${esc(f.nombre)}</b><small>${esc(a)} + ${esc(b)}</small></li>`; };
    const libre = (i: number) => i === 0 || progreso.ganados.includes(i - 1) || progreso.ganados.includes(i);
    function volverJardin() { const u = new URL('jardin.html', location.href); u.search = ''; for (const k of ['rol', 'local']) if (params.has(k)) u.searchParams.set(k, params.get(k)!); location.href = u.href; }

    function menu() {
        cerrarPartida();
        root.innerHTML = `<section class="fu-menu"><header><button class="vs-volver" data-fu="jardin">‹ Jardín</button><div><small>PVZ FUSIÓN · MINIJUEGO</small><h1>Fusión</h1></div><b class="fu-cuenta" title="Niveles superados">🏆 ${progreso.ganados.length}/${NIVELES.length}</b></header>
          <p class="fu-intro">Siembra una planta <b>encima</b> de otra de su receta y se fusionan: <span class="fu-ejemplo">${receta(FUSIONES_NATIVAS.find(f => f.id === 'fus_sunshooter') ?? FUSIONES_NATIVAS[0])}</span> Hay ${FUSIONES_NATIVAS.length} recetas.</p>
          <div class="fu-niveles">${NIVELES.map((a, i) => { const p = PAISES_CAMPANA[a.pais], ok = progreso.ganados.includes(i), abierto = libre(i); return `<button class="fu-nivel ${ok ? 'fu-ganado' : ''}" data-fu-nivel="${i}" ${abierto ? '' : 'disabled'} style="--mundo:${COLOR_MUNDO[p.mundo] ?? '#5aa23c'}"><small>Nivel ${i + 1} · ${esc(MUNDOS[p.mundo] ?? p.nombre)}</small><b>${esc(a.nombre)}</b><span>${a.noche ? '🌙 Noche · ' : '☀️ Día · '}${a.filas} carriles</span><i>${ok ? '✓ Superado' : abierto ? 'Jugar' : '🔒 Gana el anterior'}</i></button>`; }).join('')}</div></section>`;
    }
    function preparar() {
        cerrarPartida();
        const a = NIVELES[nivel], p = PAISES_CAMPANA[a.pais], recetas = recetasDe(mazo);
        root.innerHTML = `<section class="vs-preparar fu-preparar"><header><button class="vs-volver" data-fu="menu">Atrás</button><div><small>NIVEL ${nivel + 1} · ${esc((MUNDOS[p.mundo] ?? p.nombre).toUpperCase())}</small><h1>${esc(a.nombre)}</h1></div><button class="vs-principal" data-fu="jugar" ${mazo.length ? '' : 'disabled'}>¡A jugar!</button></header>
          <h2>Recetas con tu mazo <small>${recetas.length}</small> <button class="fu-todas" data-fu="todas">${todas ? 'Ver solo las de mi mazo' : 'Ver las ' + FUSIONES_NATIVAS.length}</button></h2>
          <ul class="fu-recetas">${(todas ? FUSIONES_NATIVAS : recetas).map(receta).join('') || '<li class="fu-vacia">Ninguna receta usa dos plantas de tu mazo. Prueba con Lanzaguisantes y Girasol.</li>'}</ul>
          <h2>Semillas <small>${mazo.length} / 8</small></h2><div class="vs-semillas">${SEMILLAS.map(t => `<button data-fu-semilla="${t}" aria-pressed="${mazo.includes(t)}"${mazo.includes(t) ? ` data-orden="${mazo.indexOf(t) + 1}"` : ''} title="${esc(nombrePlanta(t))}"><img src="${imgPlanta(t)}" alt="" loading="lazy"><span>${esc(nombrePlanta(t))}</span></button>`).join('')}</div></section>`;
    }

    // ------------------------------------------------------------------ partida
    function cerrarPartida() { cancelAnimationFrame(raf); raf = 0; const f = frente; frente = null; void f?.cerrar().catch(() => {}); fin = null; pausa = false; enPaso = false; }
    async function jugar() {
        const g = ++generacion, a = NIVELES[nivel];
        progreso.mazo = [...mazo]; guardar();
        root.innerHTML = `<section class="fu-juego"><div class="fu-tablero"></div><nav class="fu-herramientas"><button class="cq-redondo" data-fu="recetas" aria-label="Recetas" title="Recetas">🧬</button><button class="cq-redondo" data-fu="pausa" aria-label="Pausar" title="Pausar">❚❚</button><button class="cq-redondo" data-fu="salir" aria-label="Salir del nivel" title="Salir">✕</button></nav><div class="fu-capa"><section class="vs-cargando"><h2>Preparando el jardín…</h2><p>La primera vez descarga el motor; luego queda en caché.</p></section></div></section>`;
        fin = null; pausa = false;
        try {
            const config = nivelCampana(a.id, mazo, (Date.now() & 0x7fffffff) || 1, null, false, 0, FUSIONES);
            frente = new FrenteGardendless($('.fu-tablero'), 'fusion', perfil, o => { if (o.fase === 'victoria') terminar('victoria'); else if (o.fase === 'derrota') terminar('derrota'); }, { historia: true });
            await frente.listo;
            await frente.prepararHistoria(config);
            await frente.iniciarHistoria(config);
            if (muerto || g !== generacion) return;
            $('.fu-capa').innerHTML = '';
            anterior = performance.now(); acumulado = 0;
            raf = requestAnimationFrame(cuadro);
        } catch (e) { if (g === generacion && !muerto) { cerrarPartida(); preparar(); avisar('No se pudo abrir el nivel: ' + (e as Error).message); } }
    }
    async function cuadro(t: number) {
        if (muerto || !frente) return;
        raf = requestAnimationFrame(cuadro);
        const dt = Math.min(.2, Math.max(0, (t - anterior) / 1000)); anterior = t;
        if (!pausa && !fin) acumulado = Math.min(.1, acumulado + dt);
        if (enPaso) return;
        enPaso = true;
        try {
            const pasos = pausa || fin ? 0 : Math.min(6, Math.floor(acumulado * 60));
            acumulado -= pasos / 60;
            const o = await frente.pasoHistoria(pasos, true);
            if (o.fase === 'victoria') terminar('victoria'); else if (o.fase === 'derrota') terminar('derrota');
        } catch { /* el siguiente cuadro lo reintenta */ }
        finally { enPaso = false; }
    }
    async function pausar(si: boolean, dialogo = true) {
        if (!frente || fin) return;
        pausa = si;
        try { await (si ? frente.pausa() : frente.reanudar()); } catch { /* cerrado */ }
        if (!frente || fin || pausa !== si) return;
        if (dialogo || !si) $('.fu-capa').innerHTML = si ? '<section class="vs-fin" role="dialog" aria-modal="true"><h2>Pausa</h2><p>El jardín espera.</p><div><button class="vs-principal" data-fu="pausa">Seguir</button><button data-fu="recetas">Recetas</button><button data-fu="salir-ya">Salir del nivel</button></div></section>' : '';
        root.querySelector('[data-fu="pausa"]')!.textContent = si ? '▶' : '❚❚';
    }
    async function recetasEnJuego() {
        await pausar(true, false);
        if (!frente || fin) return;
        $('.fu-capa').innerHTML = `<section class="vs-fin fu-panel" role="dialog" aria-modal="true"><h2>Recetas de tu mazo</h2><ul class="fu-recetas">${recetasDe(mazo).map(receta).join('') || '<li class="fu-vacia">Ninguna receta usa dos plantas de tu mazo.</li>'}</ul><div><button class="vs-principal" data-fu="pausa">Seguir</button></div></section>`;
    }
    function terminar(r: 'victoria' | 'derrota') {
        if (fin) return;
        fin = r;
        void frente?.pausa().catch(() => {});
        if (r === 'victoria' && !progreso.ganados.includes(nivel)) { progreso.ganados.push(nivel); guardar(); }
        const siguiente = nivel + 1 < NIVELES.length;
        $('.fu-capa').innerHTML = r === 'victoria'
            ? `<section class="vs-fin vs-fin-plantas" role="dialog" aria-modal="true"><h2>¡Nivel superado!</h2><p>${esc(NIVELES[nivel].nombre)} resistió todas las oleadas.</p><div>${siguiente ? '<button class="vs-principal" data-fu="siguiente">Siguiente nivel</button>' : ''}<button data-fu="otra">Jugar otra vez</button><button data-fu="menu">Niveles</button></div></section>`
            : `<section class="vs-fin vs-fin-zombis" role="dialog" aria-modal="true"><h2>Los zombis entraron</h2><p>Prueba otra combinación: mira las recetas de tu mazo.</p><div><button class="vs-principal" data-fu="otra">Intentar de nuevo</button><button data-fu="mazo">Cambiar semillas</button><button data-fu="menu">Niveles</button></div></section>`;
    }
    function avisar(t: string) { const p = document.createElement('p'); p.className = 'vs-error fu-aviso'; p.setAttribute('role', 'alert'); p.textContent = t; root.querySelector('section')?.append(p); }

    root.addEventListener('click', e => {
        const el = (e.target as HTMLElement).closest<HTMLElement>('button');
        if (!el || (el as HTMLButtonElement).disabled) return;
        if (el.dataset.fuNivel) { nivel = Number(el.dataset.fuNivel); preparar(); return; }
        if (el.dataset.fuSemilla) {
            const t = el.dataset.fuSemilla as SemillaNativa;
            mazo = mazo.includes(t) ? mazo.filter(s => s !== t) : mazo.length < 8 ? [...mazo, t] : mazo;
            const lista = root.querySelector<HTMLElement>('.vs-preparar'), y = lista?.scrollTop ?? 0;
            preparar();
            const nueva = root.querySelector<HTMLElement>('.vs-preparar'); if (nueva) nueva.scrollTop = y;
            return;
        }
        switch (el.dataset.fu) {
            case 'jardin': volverJardin(); break;
            case 'menu': menu(); break;
            case 'mazo': preparar(); break;
            case 'todas': todas = !todas; { const y = root.querySelector<HTMLElement>('.vs-preparar')?.scrollTop ?? 0; preparar(); const n = root.querySelector<HTMLElement>('.vs-preparar'); if (n) n.scrollTop = y; } break;
            case 'jugar': if (mazo.length) void jugar(); break;
            case 'pausa': void pausar(!pausa); break;
            case 'recetas': void recetasEnJuego(); break;
            case 'salir': if (!fin && !confirm('¿Salir del nivel?')) break; menu(); break;
            case 'salir-ya': menu(); break;
            case 'otra': void jugar(); break;
            case 'siguiente': nivel = Math.min(NIVELES.length - 1, nivel + 1); preparar(); break;
        }
    });
    addEventListener('keydown', e => { if (e.key === 'Escape' && frente && !fin) void pausar(!pausa); });
    addEventListener('pagehide', () => { muerto = true; cerrarPartida(); }, { once: true });
    if (params.has('prueba')) (window as unknown as { __fusion: unknown }).__fusion = { niveles: () => NIVELES.map(a => a.id), mazo: () => mazo, recetas: () => recetasDe(mazo).map(f => f.id), progreso: () => progreso, fin: () => fin, frente: () => frente };
    menu();
}
