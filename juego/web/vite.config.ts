import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

// base relativa: el juego funciona servido desde cualquier carpeta (también como Artifact)
//
// Dos versiones:
// - La de la pareja (`vite build`, carpeta dist): la casa (index.html) y todos los juegos.
// - La de los AMIGOS (`vite build --mode amigos`, carpeta dist-amigos): solo la sala de juegos de amigos y los
//   juegos aptos para ellos, SIN NADA de la pareja adentro (ni la casa, ni Cien Puertas, ni recuerdos, ni apodos):
//   los archivos con lo personal se cambian por versiones vacías (SUSTITUTOS), nada de la casa entra si no está en
//   PERMITIDOS y de `public/` solo se copia lo que esos juegos usan. `scripts/verificar-amigos.mjs` revisa después
//   que en dist-amigos no quede ni una palabra de la pareja (docs/sistemas/salas.md, «Versión para amigos»).

/** Páginas de la versión para amigos. Un juego nuevo para amigos se agrega aquí (y en la lista de `src/amigos/juegos.ts`). */
export const PAGINAS_AMIGOS = ['amigos.html', 'sangre.html', 'super.html', 'retrete.html', 'cocina.html', 'mesa.html', 'escudo.html', 'carreras.html', 'celular.html', 'peleas.html'];

/** Lo que se cambia, en la versión para amigos, por su versión vacía o sin nada personal. */
const SUSTITUTOS: Record<string, string> = {
  'src/casa/lavado/pareja.ts': 'src/amigos/sin_pareja/lavado.ts',
  'src/casa/modelo.ts': 'src/amigos/sin_pareja/modelo.ts',
  'src/casa/sincro.ts': 'src/amigos/sin_pareja/sincro.ts',
  'src/casa/catalogo.ts': 'src/amigos/sin_pareja/catalogo.ts',
  'src/recuerdos_super.ts': 'src/amigos/sin_pareja/recuerdos_super.ts',
  'src/sangre/historia_pareja.ts': 'src/amigos/sin_pareja/sangre_historia.ts',
  'src/casa/cohete/pareja.ts': 'src/amigos/sin_pareja/cohete.ts',
  'src/casa/cocina/pareja.ts': 'src/amigos/sin_pareja/cocina.ts',
  'src/escenas/catalogo.ts': 'src/amigos/sin_pareja/escenas.ts',
  'src/escenas/cine.ts': 'src/amigos/sin_pareja/cine.ts',
  'src/reacciones/pareja.ts': 'src/amigos/sin_pareja/reacciones.ts',
  // El Show de Nosotros es de la pareja (preguntas, libro y cabina): en amigos no abre nada
  'src/mesa/show/show.ts': 'src/amigos/sin_pareja/show.ts',
  // Las postales de los lugares cuentan la mitología de la pareja: en amigos no salen
  'src/granja-v3/cine-lineas-lugares.ts': 'src/amigos/sin_pareja/lugares.ts',
  'src/mesa/show/cabina.ts': 'src/amigos/sin_pareja/show.ts',
  'src/mesa/show/libro.ts': 'src/amigos/sin_pareja/show.ts',
  'src/escudo/pareja.ts': 'src/amigos/sin_pareja/escudo.ts',
  'src/carreras/pareja.ts': 'src/amigos/sin_pareja/carreras.ts',
  'src/peleas/pareja.ts': 'src/amigos/sin_pareja/peleas.ts',
};

/**
 * Lo único de `src/` que puede entrar a la versión para amigos (carpetas que terminan en «/» o archivos). Lo que no
 * esté aquí frena la compilación: así nunca se cuela la casa por un import descuidado. Los archivos sueltos de
 * `src/` (personaje, recursos, sonido…) son del motor y se permiten todos.
 */
export const PERMITIDOS_AMIGOS = [
  'src/amigos/', 'src/salas/', 'src/sangre/', 'src/casa/lavado/', 'src/casa/lavado.ts', 'src/casa/lavado.css', 'src/casa/ropa.ts',
  'src/casa/ropa_tapa.ts', 'src/casa/servidor.ts',
  // el retrete espacial y la cocina sin la casa (src/sueltos), con lo de la pareja en archivos aparte
  'src/sueltos/', 'src/casa/cohete/', 'src/casa/cohete.ts', 'src/casa/cohete.css', 'src/casa/cocina/', 'src/casa/progreso_nube.ts', 'src/casa/ropa.json',
  // los juegos de mesa (sin las escenas premium, que son de la pareja: ver SUSTITUTOS)
  'src/reacciones/', 'src/mesa/',
  // El Escudo de las Hermanas (lo de la pareja va en src/escudo/pareja.ts: ver SUSTITUTOS)
  'src/escudo/',
  // La Carrera de las Tres Lunas (lo de la pareja va en src/carreras/pareja.ts, ver SUSTITUTOS)
  'src/carreras/',
  // Desaparecidos de Astra (el juego del celular encontrado: ningún caso es de la pareja)
  'src/celular/',
  // el Torneo del Despertar Dorado (peleas), con Javier y Laura aparte (ver SUSTITUTOS)
  'src/peleas/',
];

/** Lo de `public/` que va en la versión para amigos (carpetas que terminan en «/» o archivos), además de la ropa. */
export const PUBLICOS_AMIGOS = ['modelos/escudo_mapa.glb', 'modelos/escudo_torres.glb', 'modelos/escudo_enemigos.glb', 'audio/escudo/',
  'modelos/granja-v3/dragon_lod.glb', 'modelos/granja-v3/grifo_lod.glb', 'modelos/granja-v3/unicornio_lod.glb', 'modelos/el.glb', 'modelos/ella.glb', 'modelos/lavado/', 'lavado/', 'modelos/sangre/', 'sangre/', 'datos/niveles.json',
  'modelos/manifest_export.json',
  // La carrera: pistas, carros, íconos y voces (sin las de la pareja); las criaturas ya van arriba
  'modelos/carreras/', 'carreras/', 'audio/carreras/',
  // Desaparecidos de Astra: las fotos de los casos y las notas de voz
  'celular/', 'audio/celular/',
  // el Torneo del Despertar Dorado: escenarios, utilería y voces comunes
  'modelos/peleas/', 'audio/peleas/comun/'];

/** Lo de Súper Manía en `modelos/` (y en `modelos-plano/`, la copia para celulares sin WebAssembly): el local en sus
 *  4 tamaños, vitrinas, letreros, productos, utilería y la gente; y los íconos de los productos. */
const MODELOS_SUPER = /^(tienda\d(_base\.glb|\.json)|vitrina_\w+\.glb|letrero_\w+\.glb|productos\.glb|boton_comprar\.glb|carrito_\d\.glb|canasta\.glb|caneca\.glb|basura\.glb|charco\.glb|planta\.glb|parlante\.glb|globos\.glb|camara\.glb|trapero_balde\.glb|(abuelita|mama|adolescente|ejecutivo|deportista|famoso|ladron|nina|cajera|reponedor|aseo|guardia)\.glb)$/;

const raiz = __dirname;
const rel = (id: string) => relative(raiz, id.split('?')[0]).split(sep).join('/');

function versionAmigos(): Plugin {
  let salida = resolve(raiz, 'dist-amigos');
  return {
    name: 'version-amigos',
    enforce: 'pre',
    configResolved(c) {
      salida = c.build.outDir;
    },
    // Las páginas de la pareja que también juegan los amigos (super.html) salen con sus textos neutros de una vez
    // (`data-neutro`) y sin lo que es solo de los dos (`solo-pareja`): así ni el HTML trae nada de la pareja
    transformIndexHtml(html) {
      const des = (t: string) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      return html
        .replace(/<(\w+)([^>]*?\sdata-neutro="([^"]*)"[^>]*)>[\s\S]*?<\/\1>/g, (_m, tag, attrs, neutro) => `<${tag}${attrs}>${des(neutro)}</${tag}>`)
        .replace(/(\stitle=")[^"]*("[^>]*?\sdata-neutro-title="([^"]*)")/g, (_m, a, b, t) => `${a}${t}${b}`)
        .replace(/<(\w+)[^>]*\bclass="[^"]*\bsolo-pareja\b[^"]*"[^>]*>[\s\S]*?<\/\1>\s*/g, '');
    },
    async resolveId(fuente, importador, opciones) {
      if (!importador || fuente.startsWith('\0')) return null;
      const r = await this.resolve(fuente, importador, { ...opciones, skipSelf: true });
      if (!r || r.external) return r;
      const otro = SUSTITUTOS[rel(r.id)];
      return otro ? resolve(raiz, otro) : r;
    },
    load(id) {
      const r = rel(id);
      if (!r.startsWith('src/') || r.split('/').length === 2) return null;
      if (PERMITIDOS_AMIGOS.some((p) => (p.endsWith('/') ? r.startsWith(p) : r === p))) return null;
      this.error(`La versión para amigos no puede llevar ${r} (¿trae algo de la pareja?). Si es apto para amigos, agrégalo a PERMITIDOS_AMIGOS en vite.config.ts.`);
    },
    // Lo de public/: solo lo que usan los juegos de los amigos (nada de recuerdos, voces, la casa ni la ropa de pareja)
    closeBundle() {
      const pub = resolve(raiz, 'public');
      const copiar = (r: string) => {
        const de = resolve(pub, r);
        if (!existsSync(de)) return;
        mkdirSync(dirname(resolve(salida, r)), { recursive: true });
        cpSync(de, resolve(salida, r), { recursive: true });
      };
      for (const r of PUBLICOS_AMIGOS) copiar(r);
      for (const d of ['modelos', 'modelos-plano']) {
        if (!existsSync(resolve(pub, d))) continue;
        for (const f of readdirSync(resolve(pub, d))) if (MODELOS_SUPER.test(f)) copiar(`${d}/${f}`);
      }
      // Íconos de los productos y de las cajas de la bodega (los demás .png son de la casa: deco_, comida_, regalo_…)
      for (const f of readdirSync(resolve(pub, 'modelos/iconos'))) if (/^(?!deco_|comida_|regalo_)[a-z_]+\.png$/.test(f)) copiar(`modelos/iconos/${f}`);
      const prendas = JSON.parse(readFileSync(resolve(raiz, 'src/salas/prendas.json'), 'utf8')) as {
        modelos: { m: string; para: string[]; i: string }[];
        items: Record<string, { modelo: string; para: string[] }>;
      };
      for (const m of prendas.modelos) for (const rol of m.para) {
        copiar(`modelos/ropa/${m.m}_${rol}.glb`);
        copiar(`modelos/iconos/ropa_${m.i}_${rol}.webp`);
      }
      for (const it of Object.values(prendas.items)) for (const rol of it.para) copiar(`modelos/ropa/${it.modelo}_${rol}.glb`);
      // Los trajes de las clases de Sangre y Ceniza y los cascos del retrete espacial
      for (const f of readdirSync(resolve(pub, 'modelos/ropa'))) if (/^(sangre|cohete)_/.test(f)) copiar(`modelos/ropa/${f}`);
      // El retrete espacial: sus modelos y los íconos de la tienda y de los poderes
      for (const f of ['cohete_cosas.glb', 'cohete_retretes.glb']) copiar(`modelos/${f}`);
      for (const f of readdirSync(resolve(pub, 'modelos/iconos'))) if (/^cohete_\w+\.webp$/.test(f)) copiar(`modelos/iconos/${f}`);
      // La cocina de chef: fondos, hojas de recortes y la gente, menos la pareja cuando llega a comer (pareja_*)
      for (const f of readdirSync(resolve(pub, 'cocina'))) if (f !== 'gente') copiar(`cocina/${f}`);
      for (const f of readdirSync(resolve(pub, 'cocina/gente'))) if (!f.startsWith('pareja_')) copiar(`cocina/gente/${f}`);
      // Los juegos de mesa: la utilería de las reacciones y las imágenes del Clue
      for (const f of readdirSync(resolve(pub, 'modelos'))) if (/^reaccion_\w+\.glb$/.test(f)) copiar(`modelos/${f}`);
      copiar('modelos/clue/');
      // La música de los juegos que tienen los amigos (nada de la casa ni de public/musica/pareja/) y los efectos
      const musica = resolve(pub, 'musica');
      if (existsSync(resolve(musica, 'lista.json'))) {
        const de = (id: string) => /^(super|mesa|lavado|sangre|cohete|cocina|amigos)-/.test(id);
        const lista = JSON.parse(readFileSync(resolve(musica, 'lista.json'), 'utf8')) as Record<string, [string, number]>;
        const suya = Object.fromEntries(Object.entries(lista).filter(([id]) => de(id)));
        for (const [a] of Object.values(suya)) copiar(`musica/${a}`);
        writeFileSync(resolve(salida, 'musica/lista.json'), JSON.stringify(suya) + '\n');
      }
      // Los efectos (los de la granja no: la granja no va en la versión para amigos)
      for (const f of readdirSync(resolve(pub, 'sfx'))) if (f !== 'granja') copiar(`sfx/${f}`);
      // El Escudo: su música es la de la granja (M16 en los menús, M19 en la batalla, M20 al ganar)
      if (existsSync(resolve(pub, 'audio/astra/musica'))) for (const f of readdirSync(resolve(pub, 'audio/astra/musica'))) if (/^M(16|19|20)-\w+\.ogg$/.test(f)) copiar(`audio/astra/musica/${f}`);
      // La app arranca en index.html: aquí lleva directo a la sala de juegos de los amigos
      writeFileSync(
        resolve(salida, 'index.html'),
        '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
          '<meta http-equiv="refresh" content="0; url=./amigos.html"><title>Sala de juegos</title></head>' +
          '<body style="background:#fde9d4"><script>location.replace("./amigos.html" + location.search)</script></body></html>\n',
      );
    },
  };
}

export default defineConfig(({ mode, command }) => {
  const amigos = mode === 'amigos';
  return {
    base: './',
    // (en la versión para amigos, public/ se copia a mano y filtrado; al probar con el servidor sí se sirve entero)
    publicDir: amigos && command === 'build' ? false : 'public',
    plugins: amigos ? [versionAmigos()] : [],
    build: {
      outDir: amigos ? 'dist-amigos' : 'dist',
      emptyOutDir: true,
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 2000,
      modulePreload: { polyfill: false },
      rollupOptions: {
        input: amigos
          ? Object.fromEntries(PAGINAS_AMIGOS.map((p) => [p.replace(/\.html$/, ''), resolve(raiz, p)]))
          : {
            // La casa (index.html, el juego principal), los minijuegos con página propia y los que se abren sin la casa
            // desde la sala de juegos de amigos (retrete.html, cocina.html)
            casa: resolve(raiz, 'index.html'), super: resolve(raiz, 'super.html'), puertas: resolve(raiz, 'puertas.html'), mesa: resolve(raiz, 'mesa.html'),
            granjaV3: resolve(raiz, 'granja-v3.html'),
            amigos: resolve(raiz, 'amigos.html'), sangre: resolve(raiz, 'sangre.html'), retrete: resolve(raiz, 'retrete.html'), cocina: resolve(raiz, 'cocina.html'),
            escudo: resolve(raiz, 'escudo.html'),
            carreras: resolve(raiz, 'carreras.html'),
            celular: resolve(raiz, 'celular.html'),
            peleas: resolve(raiz, 'peleas.html'),
          },
      },
    },
    server: { host: true },
  };
});
