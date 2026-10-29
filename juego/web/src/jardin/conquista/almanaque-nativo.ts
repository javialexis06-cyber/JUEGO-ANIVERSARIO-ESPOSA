/** Almanaque del catálogo completo (`jardin.html?modo=almanaque`): plantas y zombis nativos de PvZ 1 y PvZ 2,
 * las derivadas de PvZ 1 y las fusiones con su receta. Solo consulta; no cambia ninguna partida. */
import './conquista.css';
import './almanaque-nativo.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/900.css';
import { PLANTAS_NATIVAS, ZOMBIS_NATIVOS, FUSIONES_NATIVAS, DERIVADAS_NATIVAS, nombrePlantaCatalogo } from '../motores/nivel-historia';
import { cargarRetratosNativos, retratoPlantaNativa, retratoZombiNativo } from '../motores/retratos-nativos';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const MUNDOS: Record<string, string> = {
    frontyard: 'Jardín', modern: 'Tiempos modernos', egypt: 'Antiguo Egipto', pirate: 'Mares piratas', cowboy: 'Salvaje Oeste',
    kongfu: 'Kung-fu', future: 'Futuro lejano', dark: 'Época oscura', beach: 'Gran ola', water: 'Agua', ice: 'Cavernas heladas',
    lostcity: 'Ciudad perdida', sky: 'Cielo', eighties: 'Años 80', dino: 'Jurásico', epic: 'Épicas', market: 'Tienda', lod: 'Desafíos',
    mint: 'Mentas', especial: 'Especiales', pvz1: 'PvZ 1',
};
type Pestana = 'plantas' | 'zombis' | 'fusiones';

export async function montarAlmanaqueNativo() {
    document.body.dataset.conquista = '1';
    document.title = 'La Semilla Madre · Almanaque';
    const root = document.createElement('main');
    root.id = 'cq-app';
    root.className = 'an-app';
    document.body.append(root);
    let pestana: Pestana = 'plantas', mundo = '', busqueda = '';
    await cargarRetratosNativos().catch(() => undefined);
    const ficha = (img: string, nombre: string, detalle: string) => `<article class="an-ficha"><img src="${img}" alt="" loading="lazy"><b>${esc(nombre)}</b><small>${esc(detalle)}</small></article>`;
    function pintar() {
        const q = busqueda.trim().toLowerCase(), coincide = (n: string) => !q || n.toLowerCase().includes(q);
        let contenido = '', mundos: string[] = [];
        if (pestana === 'plantas') {
            const lista = [...PLANTAS_NATIVAS.map(p => ({ ...p, nombre: nombrePlantaCatalogo(p.id) })), ...DERIVADAS_NATIVAS.map(d => ({ id: d.id, nombre: d.nombre, mundo: 'pvz1', coste: Number(d.props.SunCost ?? 0) }))];
            mundos = [...new Set(lista.map(p => p.mundo))];
            contenido = lista.filter(p => (!mundo || p.mundo === mundo) && coincide(p.nombre)).map(p => ficha(retratoPlantaNativa(p.id), p.nombre, `☀ ${p.coste ?? 0} · ${MUNDOS[p.mundo] ?? p.mundo}`)).join('');
        } else if (pestana === 'zombis') {
            mundos = [...new Set(ZOMBIS_NATIVOS.map(z => z.mundo))];
            contenido = ZOMBIS_NATIVOS.filter(z => (!mundo || z.mundo === mundo) && coincide(z.nombre)).map(z => ficha(retratoZombiNativo(z.id), z.nombre, (z.jefe ? 'Jefe · ' : '') + (MUNDOS[z.mundo] ?? z.mundo))).join('');
        } else {
            contenido = FUSIONES_NATIVAS.filter(f => coincide(f.nombre)).map(f => `<article class="an-ficha an-fusion"><div class="an-receta"><img src="${retratoPlantaNativa(f.padres[0])}" alt=""><span>+</span><img src="${retratoPlantaNativa(f.padres[1])}" alt=""></div><img src="${retratoPlantaNativa(f.id)}" alt="" loading="lazy"><b>${esc(f.nombre)}</b><small>${esc(nombrePlantaCatalogo(f.padres[0]))} + ${esc(nombrePlantaCatalogo(f.padres[1]))}</small></article>`).join('');
        }
        const total = (pestana === 'plantas' ? PLANTAS_NATIVAS.length + DERIVADAS_NATIVAS.length : pestana === 'zombis' ? ZOMBIS_NATIVOS.length : FUSIONES_NATIVAS.length);
        root.innerHTML = `<header class="an-cabecera"><button class="an-volver" data-an="volver">Volver</button><div><small>PLANTAS CONTRA ZOMBIS</small><h1>Almanaque</h1></div><span>${total} en el catálogo</span></header>
        <nav class="an-pestanas">${(['plantas', 'zombis', 'fusiones'] as Pestana[]).map(p => `<button data-pestana="${p}" aria-pressed="${p === pestana}">${p[0].toUpperCase() + p.slice(1)}</button>`).join('')}
        <input type="search" placeholder="Buscar…" value="${esc(busqueda)}" aria-label="Buscar en el almanaque"></nav>
        ${pestana === 'fusiones' ? '<p class="an-nota">Siembra la segunda planta sobre la primera para fusionarlas. Se aprenden en los laboratorios de Forjaria y en versus están desde el inicio.</p>' : `<nav class="an-mundos"><button data-mundo="" aria-pressed="${!mundo}">Todos</button>${mundos.map(m => `<button data-mundo="${m}" aria-pressed="${m === mundo}">${esc(MUNDOS[m] ?? m)}</button>`).join('')}</nav>`}
        <section class="an-grilla">${contenido || '<p>No hay coincidencias.</p>'}</section>`;
        const buscar = root.querySelector<HTMLInputElement>('input[type=search]')!;
        buscar.addEventListener('input', () => { busqueda = buscar.value; const pos = buscar.selectionStart; pintar(); const n = root.querySelector<HTMLInputElement>('input[type=search]')!; n.focus(); n.setSelectionRange(pos, pos); });
    }
    root.addEventListener('click', e => {
        const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
        if (!b) return;
        if (b.dataset.pestana) { pestana = b.dataset.pestana as Pestana; mundo = ''; pintar(); }
        else if (b.dataset.mundo !== undefined) { mundo = b.dataset.mundo; pintar(); }
        else if (b.dataset.an === 'volver') { const u = new URL('jardin.html', location.href); u.search = '?modo=conquista'; location.href = u.href; }
    });
    pintar();
}
