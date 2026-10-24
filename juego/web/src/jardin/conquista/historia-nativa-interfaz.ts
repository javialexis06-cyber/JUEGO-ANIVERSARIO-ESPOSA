import './conquista.css';
import './historia.css';
import './historia-nativa.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/900.css';
import { HistoriaNativa, type ZonaNativa, type AtaqueNativo } from './historia-nativa-motor';
import { GuardadoHistoriaNativa } from './historia-nativa-guardado';
import { FrenteGardendless, type ObservacionGardendless } from '../motores/frente-gardendless';
import { nivelHistoriaNativa, type SemillaNativa } from '../motores/nivel-historia';
import { esModoAmigo } from '../../salas/perfil';
import { botonRedondo, icono } from './iconos';
import { regionesHistoria, trazoRegionHistoria, puntoZonaHistoria } from './regiones';
import { PAISES_CONQUISTA, ciudadesConquista, zonasCiudad, type EscalaMapa } from './mapa';
import { urlArtePvZ } from '../pvz/arte/catalogo';
import { AtlasPvZ } from '../pvz/arte/atlas';
import { RetratosPvZ } from '../pvz/ui/retratos';
import { PLANTAS_PVZ } from '../pvz/datos/plantas';
import { volarSobrePvZ } from '../pvz/ui/baraja';
import '../pvz/ui/manipulacion.css';
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
type Instancia = {
    motor: FrenteGardendless;
    ataque: number | null;
    lista: boolean;
    estado: ObservacionGardendless | null;
};
export async function montarHistoriaNativa() {
    const amigo = esModoAmigo(), perfil = amigo ? 'amigos' : 'pareja', params = new URLSearchParams(location.search), eventos = new AbortController();
    const guardado = new GuardadoHistoriaNativa(localStorage, amigo ? 'amigo-conquista-historia-nativa-v3' : 'conquista-historia-nativa-v3');
    let mundo = guardado.leer(), errorArchivo = !!guardado.error, muerto = false, cargando = 0, ocupado = false, anterior = performance.now(), acumulado = 0, raf = 0;
    let visible: ZonaNativa | null = null, escala: EscalaMapa = 'ciudad', pais = 2, ciudad = 6, seleccion: ZonaNativa | null = null, editor: SemillaNativa[] | null = null, revisionEditor = 0;
    let liberar: () => void = () => { }, bloqueo = false, modal = '', avisoHasta = 0, ultimoEstado = '', necesitaGuardar = false, herramientasHTML = '';
    let importacion: HistoriaNativa | null = null, pausaAntesImportar: boolean | null = null, errorMotor = '', iniciando = false;
    const instancias = new Map<ZonaNativa, Instancia>(), atlas = new AtlasPvZ(), retratos = new RetratosPvZ(atlas);
    document.body.dataset.conquista = '1';
    document.title = 'La Semilla Madre · Historia';
    const root = document.createElement('main');
    root.id = 'cq-app';
    root.className = 'cq-historia cq-nativa';
    root.style.setProperty('--hn-portada', `url("${urlArtePvZ('portada-conquista.png')}")`);
    document.body.append(root);
    root.innerHTML = '<section class="hn-mapa"></section><section class="hn-defensas"></section><nav class="cq-herramientas hn-herramientas"></nav><nav class="hn-frentes" aria-label="Frentes activos"></nav><div class="hn-carga" role="status" hidden>Preparando la defensa…</div><div class="hn-noticia" role="status" hidden></div><div class="hn-capa"></div><input type="file" id="hn-respaldo" accept=".json,application/json" hidden>';
    const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
    const imagen = (t: SemillaNativa) => `<img src="${retratos.planta(t)}" alt="${esc(PLANTAS_PVZ[t].nombre)}" draggable="false">`;
    const casa = (id: ZonaNativa) => id === 8 ? 'La casa' : 'Estación vieja';
    const boton = (a: string, n: string, i = a) => botonRedondo(a, n, i);
    // Los controles se conservan al cambiar de vista: sustituir el botón dentro
    // de su propio clic interrumpe foco y eventos de ratón entre iframes.
    $('.hn-frentes').innerHTML = ([8, 9] as const).map(id => `<button class="cq-redondo" data-hn-frente="${id}" aria-label="Defender ${casa(id)}" style="visibility:hidden" disabled>${icono('atacar')}<small>${id === 8 ? 'Casa' : 'Estación'}</small></button>`).join('');
    function noticia(t: string) { const e = $('.hn-noticia'); e.textContent = t; e.hidden = false; avisoHasta = performance.now() + 5500; }
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
    function mapa() {
        const m = mundo ?? new HistoriaNativa(), s = m.mapa();
        let pines = '';
        if (escala === 'mundo')
            pines = PAISES_CONQUISTA.map(p => `<button class="cq-pin cq-pin-region" data-hn-pais="${p.id}" style="--x:${p.x}%;--y:${p.y}%" aria-label="${p.nombre}"><span class="cq-emblema">${icono('pais')}</span><b>${p.nombre}</b></button>`).join('');
        else if (escala === 'pais')
            pines = ciudadesConquista(s, pais).map(c => `<button class="cq-pin cq-pin-region" data-hn-ciudad="${c.id}" style="--x:${c.x}%;--y:${c.y}%" aria-label="${c.nombre}"><span class="cq-emblema">${icono('ciudad')}</span><b>${c.nombre}</b></button>`).join('');
        else
            pines = zonasCiudad(s, ciudad).map(z => { const p = puntoZonaHistoria(z.id), activa = m.estado.ataques.some(a => a.zona === z.id); return `<button class="cq-pin ${activa ? 'hn-atacada' : ''}" data-hn-zona="${z.id}" style="--x:${p.x}%;--y:${p.y}%" aria-label="${esc(z.nombre)}"><span class="cq-emblema">${icono(activa ? 'atacar' : z.base ? 'historia' : 'formacion')}</span><b>${esc(z.nombre)}</b></button>`; }).join('');
        const trazos = regionesHistoria(s, escala, pais, ciudad).map(r => `<g class="cq-region ${r.estado}">${r.estado === 'mixta' ? `<path class="cq-trazo-mixto" d="${trazoRegionHistoria(r.poligono)}"/>` : ''}<path class="cq-trazo-parcela" d="${trazoRegionHistoria(r.poligono)}"/></g>`).join('');
        $('.hn-mapa').innerHTML = `<div class="cq-cartografia cq-cartografia-${escala}" style="background-image:url('${urlArtePvZ('mapa-' + escala + '.png')}')"><svg class="cq-regiones" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${trazos}</svg>${pines}</div>`;
    }
    function pintar() {
        $('.hn-mapa').hidden = visible !== null;
        for (const [id, v] of instancias) {
            v.motor.frame.className = 'hn-frente';
            v.motor.frame.style.visibility = id === visible ? 'visible' : 'hidden';
            v.motor.frame.style.pointerEvents = id === visible ? 'auto' : 'none';
        }
        const herramientas = boton('mapa', 'Mapa de la ciudad', 'ciudad') + boton('subir', 'Mapa del país o del mundo', 'mapa') + boton('pausa', mundo?.pausada ? 'Reanudar los frentes' : 'Pausar todos los frentes', mundo?.pausada ? 'reanudar' : 'pausa') + boton('ayuda', 'Dave te explica cómo jugar', 'ayuda') + boton('pantalla', 'Pantalla completa', 'pantalla') + boton('exportar', 'Exportar historia', 'exportar') + boton('importar', 'Importar historia', 'importar') + boton('salir', 'Volver al jardín', 'salir');
        if (herramientasHTML !== herramientas) {
            herramientasHTML = herramientas;
            $('.hn-herramientas').innerHTML = herramientas;
        }
        const firma = mundo?.estado.ataques.map(a => a.id + ':' + a.zona).join(',') ?? '';
        for (const b of root.querySelectorAll<HTMLButtonElement>('[data-hn-frente]')) {
            const activo = !!mundo?.estado.ataques.some(a => a.zona === Number(b.dataset.hnFrente));
            b.disabled = !activo;
            b.style.visibility = activo ? 'visible' : 'hidden';
            b.style.pointerEvents = activo ? 'auto' : 'none';
            b.setAttribute('aria-hidden', String(!activo));
        }
        ultimoEstado = firma;
        $('.hn-carga').hidden = cargando === 0 || visible === null;
        mapa();
    }
    function capa() {
        const c = $('.hn-capa');
        if (!modal) {
            c.innerHTML = '';
            for (const n of root.children)
                if (n instanceof HTMLElement)
                    n.inert = false;
            return;
        }
        for (const n of root.children)
            if (n instanceof HTMLElement && n !== c && n.id !== 'hn-respaldo')
                n.inert = true;
        let html = '';
        if (modal === 'inicio')
            html = `<img class="hn-dave" src="${urlArtePvZ('dave-tutorial.png')}" alt="Dave"><section class="cq-modal hn-pergamino"><h2>Primero, nuestra casa</h2><p>Los zombis llegaron a la ciudad. Elige una semilla y después una casilla del jardín. Recoge los soles para plantar más defensas.</p><p>Vuelve al mapa para cambiar de zona: los ataques continúan en los otros frentes. Este primer tramo llega hasta la estación.</p><p>Termina las defensas antes de cerrar para conservar sus plantas. Si se interrumpe un combate, tendrás que repetir ese ataque desde su inicio.</p><button data-cq="iniciar" class="cq-verde">Proteger la casa</button>${boton('importar', 'Importar historia', 'importar')}${boton('volver', 'Volver al jardín', 'salir')}</section>`;
        else if (modal === 'interrumpida')
            html = `<section class="cq-modal hn-pergamino"><h2>Una defensa quedó interrumpida</h2><p>Las zonas recuperadas y sus defensas anteriores se conservan. Al continuar se repetirán los ataques pendientes desde su inicio.</p><button data-cq="retomar" class="cq-verde">Repetir los ataques pendientes</button>${boton('volver', 'Conservar el archivo y volver', 'salir')}</section>`;
        else if (modal === 'equipo')
            html = `<section class="cq-modal cq-editor hn-editor"><header><h2>Semillas para ${casa(seleccion!)}</h2>${boton('cerrar-modal', 'Volver al mapa', 'cerrar')}</header><div class="pvz-baraja-elegida" aria-label="Baraja de la zona">${editor!.map(t => `<button class="pvz-ranura" data-hn-quitar="${t}">${imagen(t)}</button>`).join('')}</div><div class="cq-catalogo">${mundo!.estado.desbloqueadas.map(t => { const origen = mundo!.propietaria(t), activa = origen !== null && mundo!.estado.ataques.some(a => a.zona === origen); return `<button class="cq-ficha ${editor!.includes(t) ? 'cq-elegida' : ''}" data-hn-semilla="${t}" aria-pressed="${editor!.includes(t)}" ${activa ? 'disabled' : ''}>${imagen(t)}<b>${PLANTAS_PVZ[t].nombre}</b><small>${origen === null ? 'Disponible' : casa(origen)}</small></button>`; }).join('')}</div><p>Cada tipo se reserva a una zona. Al trasladarlo se retiran sus plantas de la defensa anterior, sin devolver soles.</p><button class="cq-verde" data-cq="guardar-equipo">Guardar formación</button></section>`;
        else if (modal === 'zona')
            html = `<section class="cq-modal hn-zona"><h2>${casa(seleccion!)}</h2><div class="hn-equipo">${mundo!.zona(seleccion!).equipo.map(imagen).join('')}</div><nav>${boton('equipo', 'Preparar formación', 'equipo')}${mundo!.zona(seleccion!).capturada ? boton('ver', 'Ver la defensa', 'historia') : boton('expedicion', 'Iniciar expedición', 'atacar')}${boton('cerrar-modal', 'Volver al mapa', 'cerrar')}</nav></section>`;
        else if (modal === 'salida')
            html = `<section class="cq-modal hn-pergamino"><h2>La batalla sigue</h2><p>Puedes recorrer el mapa sin perder el combate. Termina los ataques antes de cerrar esta historia para guardar sus defensas.</p>${boton('cerrar-modal', 'Volver al mapa', 'mapa')}</section>`;
        else if (modal === 'ayuda')
            html = `<img class="hn-dave" src="${urlArtePvZ('dave-tutorial.png')}" alt="Dave"><section class="cq-modal hn-pergamino"><h2>Una ciudad, varios frentes</h2><p>Primero protege la casa. Después podrás explorar la estación y reservarle sus propias plantas. Un tipo no puede estar en dos zonas a la vez.</p><p>Toca el mapa para cambiar de frente. Las espadas señalan dónde atacan los zombis. El botón de pausa detiene todos los frentes.</p><p>Al ganar conservas las plantas, el daño, los soles y los cortacéspedes que queden. Cierra entre combates para conservar ese punto; un ataque interrumpido se repite desde el comienzo.</p>${mundo&&!mundo.estado.ataques.length?boton('nueva','Comenzar otra historia','historia'):''}${boton('cerrar-modal', 'Volver al jardín', 'cerrar')}</section>`;
        else if (modal === 'pausa')
            html = `<section class="cq-modal hn-pergamino"><h2>Un respiro en el jardín</h2>${boton('pausa', 'Reanudar todos los frentes', 'reanudar')}${boton('salir', 'Volver al jardín', 'salir')}</section>`;
        else if (modal === 'perdida')
            html = `<section class="cq-modal hn-pergamino"><h2>Los zombis tomaron la casa</h2><button data-cq="nueva" class="cq-verde">Comenzar otra historia</button>${boton('exportar', 'Exportar historia', 'exportar')}${boton('volver', 'Volver al jardín', 'salir')}</section>`;
        else if (modal === 'nueva')
            html = `<section class="cq-modal hn-pergamino"><h2>¿Empezar otra historia?</h2><p>Puedes exportar la historia antes de reemplazarla.</p><button data-cq="confirmar-nueva">Comenzar otra historia</button>${boton('exportar', 'Exportar historia', 'exportar')}${boton('cerrar-modal', 'Conservar la historia', 'cerrar')}</section>`;
        else if (modal === 'ocupada')
            html = `<section class="cq-modal hn-pergamino"><h2>La historia está en otra pestaña</h2><p>Cierra la otra pestaña antes de continuar aquí. Su progreso se conserva.</p><button data-cq="recargar" class="cq-verde">Volver a comprobar</button>${boton('volver', 'Volver al jardín', 'salir')}</section>`;
        else if (modal === 'guardado-error')
            html = `<section class="cq-modal hn-pergamino"><h2>No se pudo guardar</h2><p>${esc(guardado.error)}</p><p>Los ataques están pausados. Exporta la historia antes de salir; un ataque pendiente se repetirá desde su inicio.</p><button data-cq="reintentar-guardado" class="cq-verde">Reintentar guardado</button>${boton('exportar', 'Exportar historia', 'exportar')}</section>`;
        else if (modal === 'motor-error')
            html = `<section class="cq-modal hn-pergamino"><h2>La defensa no respondió</h2><p>${esc(errorMotor)}</p><p>Las defensas terminadas se conservan. Al volver a cargar tendrás que repetir los ataques pendientes desde su inicio.</p><button data-cq="recargar" class="cq-verde">Volver a cargar</button>${boton('exportar', 'Exportar historia', 'exportar')}</section>`;
        else if (modal === 'importacion')
            html = `<section class="cq-modal hn-pergamino"><h2>¿Recuperar esta historia?</h2><p>${importacion!.estado.zonas.filter(z => z.capturada).length} zonas recuperadas. ${importacion!.estado.ataques.length ? 'Los ataques pendientes se repetirán desde su inicio.' : 'Sus defensas terminadas se conservarán.'}</p><p>Al confirmar reemplazarás la historia nativa de este perfil. Puedes exportar primero la actual.</p><button data-cq="confirmar-importacion" class="cq-verde">Recuperar historia</button>${boton('exportar', 'Exportar historia actual', 'exportar')}${boton('cancelar-importacion', 'Conservar historia actual', 'cerrar')}</section>`;
        else if (modal === 'error')
            html = `<section class="cq-modal hn-pergamino"><h2>No se pudo preparar la historia</h2><p>${esc(guardado.error || 'Conserva esta ventana y exporta la historia antes de salir.')}</p>${boton('exportar', 'Exportar historia', 'exportar')}${boton('volver', 'Conservar y volver', 'salir')}</section>`;
        c.innerHTML = html;
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
    async function cancelarImportacion() {
        importacion = null;
        const previa = pausaAntesImportar;
        pausaAntesImportar = null;
        if (previa !== null)
            await pausar(previa);
        modal = mundo?.pausada ? 'pausa' : mundo ? '' : 'inicio';
        capa();
        pintar();
    }
    const respaldo = $<HTMLInputElement>('#hn-respaldo');
    respaldo.addEventListener('cancel', () => void cancelarImportacion(), { signal: eventos.signal });
    respaldo.addEventListener('change', async () => {
        const archivo = respaldo.files?.[0];
        respaldo.value = '';
        if (!archivo) {
            await cancelarImportacion();
            return;
        }
        try {
            if (archivo.size > 1048576)
                throw Error('El archivo es demasiado grande para esta historia.');
            importacion = HistoriaNativa.restaurar(JSON.parse(await archivo.text()));
            modal = 'importacion';
            capa();
        }
        catch {
            await cancelarImportacion();
            noticia('El archivo no es una historia nativa compatible. Tu historia se conserva.');
        }
    }, { signal: eventos.signal });
    async function cargarAtaque(a: AtaqueNativo) {
        if (instancias.get(a.zona)?.ataque === a.id)
            return;
        const previa = instancias.get(a.zona);
        if (previa) {
            await previa.motor.cerrar();
            instancias.delete(a.zona);
        }
        const motor = new FrenteGardendless($('.hn-defensas'), String(a.zona), perfil, undefined, { historia: true }), i: Instancia = { motor, ataque: a.id, lista: false, estado: null };
        instancias.set(a.zona, i);
        cargando++;
        pintar();
        try {
            i.estado = await motor.iniciarHistoria(nivelHistoriaNativa(a.zona, a.equipo, a.semilla, a.punto));
            i.lista = true;
            if (mundo!.pausada)
                await motor.pausa();
        }
        catch (e) {
            if (!muerto)
                falloMotor(e);
        }
        finally {
            cargando--;
            anterior = performance.now();
            acumulado = 0;
            pintar();
        }
    }
    async function ver(id: ZonaNativa) {
        visible = id;
        modal = '';
        capa();
        pintar();
        const actual = instancias.get(id);
        if (actual) {
            if (actual.lista) await actual.motor.pasoHistoria(0, true);
            return;
        }
        const z = mundo!.zona(id);
        if (!z.punto)
            return;
        const motor = new FrenteGardendless($('.hn-defensas'), String(id), perfil, undefined, { historia: true }), i: Instancia = { motor, ataque: null, lista: false, estado: null };
        instancias.set(id, i);
        cargando++;
        pintar();
        try {
            i.estado = await motor.iniciarHistoria(nivelHistoriaNativa(id, z.equipo, mundo!.estado.semilla, z.punto, true));
            i.lista = true;
        }
        catch (e) {
            if (!muerto)
                falloMotor(e);
        }
        finally {
            cargando--;
            pintar();
        }
    }
    async function activar() {
        if (iniciando) return;
        iniciando = true;
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
        mundo.pausada = false;
        modal = '';
        capa();
        if (!guardar())
            return;
        visible = mundo.estado.inicioCasa ? 8 : null;
        pintar();
        await Promise.all(mundo.estado.ataques.map(cargarAtaque));
        } finally { iniciando = false; }
    }
    async function terminar(id: ZonaNativa, i: Instancia, estado: ObservacionGardendless) {
        if (i.ataque === null || !['victoria', 'derrota'].includes(estado.fase))
            return;
        await i.motor.pausa();
        const punto = estado.fase === 'victoria' ? await i.motor.puntoHistoria() : null;
        if (!mundo!.resultado(i.ataque, estado.fase as 'victoria' | 'derrota', punto))
            return;
        i.ataque = null;
        if (!guardar())
            return;
        if (visible === id) visible = null;
        if (seleccion === id && modal !== 'equipo') seleccion = null;
        noticia(estado.fase === 'victoria' ? casa(id) + ' está a salvo' : casa(id) + ' cayó ante los zombis');
        if (mundo!.estado.perdida) {
            mundo!.pausada = true;
            for (const v of instancias.values())
                await v.motor.pausa();
            modal = 'perdida';
            capa();
        }
        if (mundo!.fin)
            noticia('La casa y la estación están a salvo. La ciudad empieza a despertar.');
        pintar();
    }
    async function avanzar(now: number) {
        raf = requestAnimationFrame(avanzar);
        const delta = Math.min(.1, Math.max(0, (now - anterior) / 1000));
        anterior = now;
        if (avisoHasta && now > avisoHasta) {
            $('.hn-noticia').hidden = true;
            avisoHasta = 0;
        }
        if (muerto || !mundo || cargando || mundo.pausada || !bloqueo || mundo.estado.perdida || modal === 'interrumpida') {
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
                noticia('¡Atacan la casa! Puedes volver desde el mapa.');
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
                if (id !== 8 && id !== 9) {
                    noticia('Este primer tramo llega hasta la estación.');
                    return;
                }
                if (!mundo)
                    return;
                if (id === 9 && mundo.estado.inicioCasa) {
                    noticia('Primero protege la casa.');
                    return;
                }
                seleccion = id;
                if (mundo.estado.ataques.some(a => a.zona === id)) {
                    await ver(id);
                    return;
                }
                if (id === 9 && mundo.explorar()) {
                    if (!guardar()) return;
                    noticia('Encontraste Repetidora y Patatapum. Prepara su formación.');
                }
                modal = 'zona';
                capa();
                return;
            }
            const semilla = (target.dataset.hnSemilla || target.dataset.hnQuitar) as SemillaNativa | undefined;
            if (semilla && editor) {
                const elegida = editor.includes(semilla);
                editor = elegida ? editor.filter(t => t !== semilla) : [...editor, semilla];
                const r = target.getBoundingClientRect();
                capa();
                if (!elegida) {
                    const dest = $('.pvz-baraja-elegida').lastElementChild;
                    if (dest instanceof HTMLElement)
                        volarSobrePvZ(root, retratos.planta(semilla), r, dest);
                }
                return;
            }
            switch (target.dataset.cq) {
                case 'iniciar':
                case 'retomar':
                    await activar();
                    break;
                case 'mapa':
                    visible = null;
                    escala = 'ciudad';
                    pais = 2;
                    ciudad = 6;
                    pintar();
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
                    modal = '';
                    editor = null;
                    capa();
                    break;
                case 'equipo':
                    if (!mundo || seleccion === null)
                        break;
                    editor = [...mundo.zona(seleccion).equipo];
                    revisionEditor = mundo.estado.revision;
                    modal = 'equipo';
                    capa();
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
                    for (const [id, i] of instancias)
                        if (i.ataque === null) {
                            await i.motor.cerrar();
                            instancias.delete(id);
                        }
                    if (!guardar()) break;
                    editor = null;
                    modal = 'zona';
                    capa();
                    break;
                case 'expedicion': {
                    const a = mundo?.expedicion();
                    if (!a) {
                        noticia('Prepara semillas disponibles para la estación; si acaba de caer, deja que pase su descanso.');
                        break;
                    }
                    if (!guardar()) break;
                    modal = '';
                    capa();
                    visible = 9;
                    await cargarAtaque(a);
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
                case 'importar':
                    if (errorArchivo) {
                        noticia('Exporta primero el archivo que no se pudo abrir; se conserva sin reemplazarlo.');
                        break;
                    }
                    if (mundo?.estado.ataques.length && !mundo.estado.perdida) {
                        modal = 'salida';
                        capa();
                        break;
                    }
                    pausaAntesImportar = mundo?.pausada ?? false;
                    await pausar(true);
                    respaldo.click();
                    break;
                case 'cancelar-importacion':
                    await cancelarImportacion();
                    break;
                case 'confirmar-importacion':
                    if (!importacion || !await adquirir())
                        break;
                    if (!guardado.guardar(importacion.exportar())) {
                        noticia(guardado.error);
                        break;
                    }
                    for (const i of instancias.values())
                        i.motor.destruir();
                    instancias.clear();
                    mundo = importacion;
                    importacion = null;
                    pausaAntesImportar = null;
                    visible = null;
                    if (mundo.estado.perdida) {
                        modal = 'perdida';
                        capa();
                        pintar();
                    }
                    else if (mundo.estado.ataques.length) {
                        modal = 'interrumpida';
                        capa();
                        pintar();
                    }
                    else
                        await activar();
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
                    for (const i of instancias.values())
                        i.motor.destruir();
                    instancias.clear();
                    mundo = new HistoriaNativa();
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
        i.motor.destruir(); liberar(); atlas.destruir(); }, { once: true });
    if (params.has('prueba'))
        (window as any).__historiaNativa = {
            mundo: () => mundo, instancias: () => instancias, observar: () => mundo?.exportar(),
            control: () => ({cargando, ocupado, anterior, acumulado, raf, visible, bloqueo, muerto})
        };
    await atlas.cargar();
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
    else if (mundo.estado.ataques.length) {
        modal = 'interrumpida';
        capa();
    }
    else {
        await activar();
        visible = null;
        pintar();
    }
    raf = requestAnimationFrame(avanzar);
}
