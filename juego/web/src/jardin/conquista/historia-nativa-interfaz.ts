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
import { cargarRetratosNativos, retratoPlantaNativa } from '../motores/retratos-nativos';
import { ARTE_PLANTAS_PVZ } from '../pvz/arte/catalogo';
import { esModoAmigo } from '../../salas/perfil';
import { botonRedondo, icono } from './iconos';
import { regionesCampana as regionesHistoria, trazoRegionHistoria, puntoAreaCampana as puntoZonaHistoria } from './regiones';
import type { EscalaMapa } from './mapa';
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
    firma: string;
    precarga: Promise<void> | null;
};
export async function montarHistoriaNativa() {
    const amigo = esModoAmigo(), perfil = amigo ? 'amigos' : 'pareja', params = new URLSearchParams(location.search), eventos = new AbortController();
    const guardado = new GuardadoHistoriaNativa(localStorage, amigo ? 'amigo-conquista-historia-nativa-v3' : 'conquista-historia-nativa-v3');
    let mundo = guardado.leer(), errorArchivo = !!guardado.error, muerto = false, cargando = 0, ocupado = false, anterior = performance.now(), acumulado = 0, raf = 0;
    let visible: ZonaNativa | null = null, escala: EscalaMapa = 'ciudad', pais = AREAS_CAMPANA[8].pais, ciudad = AREAS_CAMPANA[8].ciudad, seleccion: ZonaNativa | null = null, editor: SemillaNativa[] | null = null, revisionEditor = 0;
    let liberar: () => void = () => { }, bloqueo = false, modal = '', avisoHasta = 0, ultimoEstado = '', necesitaGuardar = false, herramientasHTML = '';
    let importacion: HistoriaNativa | null = null, pausaAntesImportar: boolean | null = null, errorMotor = '', iniciando = false;
    let cine:CinematicaConquista|null=null;
    const instancias = new Map<ZonaNativa, Instancia>(), atlas = new AtlasPvZ(), retratos = new RetratosPvZ(atlas);
    document.body.dataset.conquista = '1';
    document.title = 'La Semilla Madre · Historia';
    const root = document.createElement('main');
    root.id = 'cq-app';
    root.className = 'cq-historia cq-nativa';
    root.style.setProperty('--hn-portada', `url("${urlArtePvZ('portada-conquista.webp')}")`);
    document.body.append(root);
    root.innerHTML = '<section class="hn-mapa"></section><section class="hn-defensas"></section><nav class="cq-herramientas hn-herramientas"></nav><nav class="hn-frentes" aria-label="Frentes activos"></nav><div class="hn-noticia" role="status" hidden></div><div class="hn-capa"></div><input type="file" id="hn-respaldo" accept=".json,application/json" hidden>';
    const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
    // Las 32 plantas heredadas conservan su arte propio; el resto del catálogo usa el retrato nativo.
    const retratoSemilla = (t: string) => ARTE_PLANTAS_PVZ[t] ? retratos.planta(t) : retratoPlantaNativa(t);
    const imagen = (t: SemillaNativa) => `<img src="${retratoSemilla(t)}" alt="${esc(nombre(t))}" draggable="false">`;
    const casa=(id:ZonaNativa)=>AREAS_CAMPANA[id].nombre;
    const nombre=(t:SemillaNativa)=>nombrePlantaCatalogo(t,PLANTAS_PVZ[t]?nombreSemillaNativa(t,PLANTAS_PVZ[t].nombre):undefined);
    const cortosHeredados=['Robles','Molino','Parque','Fuerte','Farol','Puente','Semillas','Mercado','Casa','Estación','Fuentes','Colina'];
    const cortos=AREAS_CAMPANA.map(a=>cortosHeredados[a.id]??a.nombre.split(' ').slice(-1)[0]);
    const boton = (a: string, n: string, i = a) => botonRedondo(a, n, i);
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
    function mapa() {
        const m = mundo ?? new HistoriaNativa(), s = m.mapa();
        let pines = '';
        if (escala === 'mundo')
            pines = PAISES_CAMPANA.map(p => `<button class="cq-pin cq-pin-region" data-hn-pais="${p.id}" style="--x:${p.x}%;--y:${p.y}%" aria-label="${p.nombre}"><span class="cq-emblema">${icono('pais')}</span><b>${p.nombre}</b></button>`).join('');
        else if (escala === 'pais')
            pines = CIUDADES_CAMPANA.filter(c => c.pais === pais).map(c => `<button class="cq-pin cq-pin-region" data-hn-ciudad="${c.id}" style="--x:${c.x}%;--y:${c.y}%" aria-label="${c.nombre}"><span class="cq-emblema">${icono('ciudad')}</span><b>${c.nombre}</b></button>`).join('');
        else
            pines = AREAS_CAMPANA.filter(a => a.ciudad === ciudad).map(z => { const p = puntoZonaHistoria(z.id), accesible=m.puedeLlegar(z.id), activa = m.estado.ataques.some(a => a.zona === z.id), est = estadoZona(m, z.id); return `<button class="cq-pin ${!accesible?'hn-lejana':''} ${activa ? 'hn-atacada' : ''} hn-${est.clase}" data-hn-zona="${z.id}" style="--x:${p.x}%;--y:${p.y}%" aria-label="${esc(z.nombre)}: ${est.corto}${!accesible?', necesita una ruta desde la casa':''}"><span class="cq-emblema">${icono(activa ? 'atacar' : z.id === 8 || z.tipo === 'fortaleza' ? 'historia' : 'formacion')}</span><b>${esc(z.nombre)}</b>${est.insignia?`<i class="hn-insignia">${est.insignia}</i>`:''}</button>`; }).join('');
        const trazos = regionesHistoria(s, escala, pais, ciudad).map(r => `<g class="cq-region ${r.estado}">${r.estado === 'mixta' ? `<path class="cq-trazo-mixto" d="${trazoRegionHistoria(r.poligono)}"/>` : ''}<path class="cq-trazo-parcela" d="${trazoRegionHistoria(r.poligono)}"/></g>`).join('');
        $('.hn-mapa').innerHTML = `<div class="cq-cartografia cq-cartografia-${escala}" style="background-image:url('${urlArtePvZ('mapa-' + escala + '.webp')}')"><svg class="cq-regiones" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${trazos}</svg>${pines}</div>`;
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
            b.style.display=activo?'':'none';
            b.style.pointerEvents = activo ? 'auto' : 'none';
            b.setAttribute('aria-hidden', String(!activo));
        }
        ultimoEstado = firma;
        disponibilidad();
        mapa();
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
            if (n instanceof HTMLElement && n !== c && n.id !== 'hn-respaldo')
                n.inert = true;
        let html = '';
        if (modal === 'inicio')
            html = `<img class="hn-dave" src="${urlArtePvZ('dave-tutorial.webp')}" alt="Dave"><section class="cq-modal hn-pergamino hn-inicio"><h2>Primero, nuestra casa</h2><p>Los zombis llegaron a la ciudad. Arrastra una semilla hasta una casilla (o tócala y luego la casilla) y recoge soles para plantar más.</p><p>Desde el mapa recuperas las zonas vecinas, ciudad por ciudad, a lo largo de doce países; cada ciudad termina en su fortaleza y la última es el castillo del Dr. Zomboid. En Forjaria aprenderás a fusionar plantas: siembra una sobre otra. Las zonas rodeadas solo de zonas nuestras quedan despejadas 🛡️ y ya no las atacan; las de frontera ⚔️ reciben asedios cada vez más fuertes.</p><p class="hn-nota">Si cierras en plena batalla, ese ataque se repite desde su inicio.</p><nav class="hn-acciones"><button data-cq="iniciar" class="cq-verde">Proteger la casa</button>${boton('importar', 'Importar historia', 'importar')}${boton('volver', 'Volver al jardín', 'salir')}</nav></section>`;
        else if(modal==='victoria')
            html=`<div class="cq-cine cq-cine-final"></div><nav class="cq-final-controles">${boton('cerrar-modal','El mapa está purificado: volver al mapa','mapa')}${boton('exportar','Exportar historia','exportar')}${boton('salir','Volver al jardín','salir')}</nav>`;
        else if (modal === 'interrumpida')
            html = `<section class="cq-modal hn-pergamino"><h2>Una defensa quedó interrumpida</h2><p>Las zonas recuperadas y sus defensas anteriores se conservan. Al continuar se repetirán los ataques pendientes desde su inicio.</p><button data-cq="retomar" class="cq-verde">Repetir los ataques pendientes</button>${boton('volver', 'Conservar el archivo y volver', 'salir')}</section>`;
        else if (modal === 'equipo')
            html = `<section class="cq-modal cq-editor hn-editor"><header><h2>Semillas para ${casa(seleccion!)}</h2>${boton('cerrar-modal', 'Volver al mapa', 'cerrar')}</header><div class="pvz-baraja-elegida" aria-label="Baraja de la zona">${editor!.map(t => `<button class="pvz-ranura" data-hn-quitar="${t}">${imagen(t)}</button>`).join('')}</div><div class="cq-catalogo">${mundo!.estado.desbloqueadas.map(t => { const origen = mundo!.propietaria(t), activa = origen !== null && mundo!.estado.ataques.some(a => a.zona === origen); return `<button class="cq-ficha ${editor!.includes(t) ? 'cq-elegida' : ''}" data-hn-semilla="${t}" aria-pressed="${editor!.includes(t)}" ${activa ? 'disabled' : ''}>${imagen(t)}<b>${esc(nombre(t))}</b><small>${origen === null ? 'Disponible' : casa(origen)}</small></button>`; }).join('')}</div><p>Hasta ocho semillas por formación. Cada tipo se reserva a una zona. Al trasladarlo se retiran sus plantas de la defensa anterior, sin devolver soles.</p><button class="cq-verde" data-cq="guardar-equipo">Guardar formación</button></section>`;
        else if (modal === 'zona')
            html = `<section class="cq-modal hn-pergamino hn-zona"><h2>${casa(seleccion!)}</h2><p class="hn-estado hn-${estadoZona(mundo!, seleccion!).clase}">${estadoZona(mundo!, seleccion!).largo}</p><div class="hn-equipo">${mundo!.zona(seleccion!).equipo.length?mundo!.zona(seleccion!).equipo.map(imagen).join(''):'<small>Todavía no tiene formación.</small>'}</div><nav>${conTexto(boton('equipo', 'Preparar formación', 'equipo'),'Formación')}${mundo!.zona(seleccion!).capturada ? conTexto(boton('ver', 'Ver la defensa', 'historia'),'Ver defensa') : conTexto(boton('expedicion', 'Iniciar expedición', 'atacar'),'Expedición')}${conTexto(boton('cerrar-modal', 'Volver al mapa', 'cerrar'),'Volver')}</nav></section>`;
        else if (modal === 'salida')
            html = `<section class="cq-modal hn-pergamino"><h2>La batalla sigue</h2><p>Puedes recorrer el mapa sin perder el combate. Termina los ataques antes de cerrar esta historia para guardar sus defensas.</p>${boton('cerrar-modal', 'Volver al mapa', 'mapa')}</section>`;
        else if (modal === 'ayuda')
            html = `<img class="hn-dave" src="${urlArtePvZ('dave-tutorial.webp')}" alt="Dave"><section class="cq-modal hn-pergamino"><h2>Una ciudad, varios frentes</h2><p>Puedes arrastrar y soltar semillas, o seleccionarlas y tocar una casilla. Primero protege la casa. Después podrás explorar las zonas vecinas, desbloquear semillas y reservar a cada territorio su propia formación. Un tipo no puede estar en dos zonas a la vez.</p><p>Toca el mapa para cambiar de frente. Las espadas señalan dónde atacan los zombis. El botón de pausa detiene todos los frentes.</p><p>🛡️ Despejada: ningún vecino es zombi, no la atacan. ⚔️ Frontera: la asedian, y cada asedio resistido y cada rato que pasa la hace más fuerte (hasta 6). Conquistar alrededor es la forma de dejarla en paz.</p><p>Al ganar conservas las plantas, el daño, los soles y los cortacéspedes que queden. Cierra entre combates para conservar ese punto; un ataque interrumpido se repite desde el comienzo.</p>${mundo&&!mundo.estado.ataques.length?boton('nueva','Comenzar otra historia','historia'):''}${boton('cerrar-modal', 'Entendido', 'cerrar')}</section>`;
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
            html = `<section class="cq-modal hn-pergamino"><h2>¿Recuperar esta historia?</h2><p>${importacion!.estado.zonas.filter(z => z.capturada).length} zonas recuperadas. ${importacion!.estado.ataques.length ? 'Los ataques pendientes se repetirán desde su inicio.' : 'Sus defensas terminadas se conservarán.'}</p><p>Al confirmar reemplazarás la historia guardada en este aparato. Puedes exportar primero la actual.</p><button data-cq="confirmar-importacion" class="cq-verde">Recuperar historia</button>${boton('exportar', 'Exportar historia actual', 'exportar')}${boton('cancelar-importacion', 'Conservar historia actual', 'cerrar')}</section>`;
        else if (modal === 'error')
            html = `<section class="cq-modal hn-pergamino"><h2>No se pudo preparar la historia</h2><p>${esc(guardado.error || 'Conserva esta ventana y exporta la historia antes de salir.')}</p>${boton('exportar', 'Exportar historia', 'exportar')}${boton('volver', 'Conservar y volver', 'salir')}</section>`;
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
            noticia('Ese archivo no es una historia de este jardín. Tu historia se conserva.');
        }
    }, { signal: eventos.signal });
    const firmaCampo = (c: ConfigDefensaNativa) => JSON.stringify([c.zona, c.semillas, c.punto]);
    function configuracion(id: ZonaNativa) {
        const z=mundo?.zona(id),previstas=AREAS_CAMPANA[id].desbloquea as SemillaNativa[];
        // Explorar un destino sin baraja aún no debe vaciar y reconstruir su vista previa.
        // Una zona propia sin semillas sí conserva su defensa vacía y vulnerable.
        return nivelCampana(id,z&&(z.capturada||z.equipo.length>0)?z.equipo:previstas,mundo?.estado.semilla??23,z?.punto??null,false,0,mundo?.estado.fusiones??[]);
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
        } finally { iniciando = false; anterior=performance.now();acumulado=0;disponibilidad(); }
    }
    async function terminar(id: ZonaNativa, i: Instancia, estado: ObservacionGardendless) {
        if (i.ataque === null || !['victoria', 'derrota'].includes(estado.fase))
            return;
        await i.motor.pausa();
        const punto = estado.fase === 'victoria' ? await i.motor.puntoHistoria() : null, fusionesAntes = mundo!.estado.fusiones.length;
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
        else noticia(estado.fase === 'victoria' ? casa(id) + ' está a salvo' + (siguiente !== undefined ? `. Siguiente: toca ${casa(siguiente)} en el mapa para recuperarla.` : '') : casa(id) + ' cayó ante los zombis', siguiente !== undefined ? 10000 : 5500);
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
                if (!mundo || !Number.isInteger(id) || id<0 || id>=AREAS_CAMPANA.length) return;
                if(!mundo.puedeLlegar(id)&&!mundo.zona(id).capturada) {
                    noticia(id===239?'Recupera primero las otras 239 áreas para llegar al castillo del Dr. Zomboid.':AREAS_CAMPANA[id].tipo==='fortaleza'&&mundo&&!mundo.fortalezaAbierta(id)?'Recupera primero las otras áreas de esta ciudad para llegar a su fortaleza.':'Necesitas recuperar una zona vecina y mantener una ruta hasta la casa.');return;
                }
                seleccion = id;
                if (mundo.estado.ataques.some(a => a.zona === id)) {await ver(id);return;}
                const anteriores=new Set(mundo.estado.desbloqueadas);
                if (mundo.explorar(id)) {
                    if (!guardar()) return;
                    const nuevas=mundo.estado.desbloqueadas.filter(t=>!anteriores.has(t));
                    if(nuevas.length)noticia('Encontraste '+nuevas.map(nombre).join(', ')+'. Prepara su formación.');
                }
                prepararCampos();
                modal = 'zona';
                capa();
                return;
            }
            const semilla = (target.dataset.hnSemilla || target.dataset.hnQuitar) as SemillaNativa | undefined;
            if (semilla && editor) {
                const elegida = editor.includes(semilla);
                if(!elegida&&editor.length>=8){noticia('Caben ocho semillas. Retira una para cambiarla.');return;}
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
                    if(!mundo.puedeLlegar(seleccion)){noticia('Recupera la ruta hasta la casa antes de cambiar esta formación.');break;}
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
                    else if(mundo.fin){modal='victoria';capa();pintar();}
                    else if (mundo.estado.ataques.length) {
                        modal = 'interrumpida';
                        capa();
                        pintar();
                    }
                    else {
                        modal='';capa();pintar();
                        await activar();
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
                    visible=null;seleccion=null;editor=null;escala='ciudad';pais=2;ciudad=6;
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
    }
    if(!errorArchivo && (!mundo || !mundo.estado.perdida) && modal!=='ocupada') prepararCampos();
    raf = requestAnimationFrame(avanzar);
}
