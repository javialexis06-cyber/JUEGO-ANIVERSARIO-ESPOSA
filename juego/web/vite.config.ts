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
export const PAGINAS_AMIGOS = ['amigos.html', 'sangre.html'];

/** Lo que se cambia, en la versión para amigos, por su versión vacía o sin nada personal. */
const SUSTITUTOS: Record<string, string> = {
  'src/casa/lavado/pareja.ts': 'src/amigos/sin_pareja/lavado.ts',
  'src/casa/modelo.ts': 'src/amigos/sin_pareja/modelo.ts',
  'src/casa/sincro.ts': 'src/amigos/sin_pareja/sincro.ts',
  'src/casa/catalogo.ts': 'src/amigos/sin_pareja/catalogo.ts',
};

/**
 * Lo único de `src/` que puede entrar a la versión para amigos (carpetas que terminan en «/» o archivos). Lo que no
 * esté aquí frena la compilación: así nunca se cuela la casa por un import descuidado. Los archivos sueltos de
 * `src/` (personaje, recursos, sonido…) son del motor y se permiten todos.
 */
export const PERMITIDOS_AMIGOS = [
  'src/amigos/', 'src/salas/', 'src/sangre/', 'src/casa/lavado/', 'src/casa/lavado.ts', 'src/casa/lavado.css', 'src/casa/ropa.ts',
  'src/casa/ropa_tapa.ts', 'src/casa/servidor.ts',
];

/** Lo de `public/` que va en la versión para amigos (carpetas que terminan en «/» o archivos), además de la ropa. */
export const PUBLICOS_AMIGOS = ['modelos/el.glb', 'modelos/ella.glb', 'modelos/lavado/', 'lavado/', 'modelos/sangre/', 'sangre/'];

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
      const prendas = JSON.parse(readFileSync(resolve(raiz, 'src/salas/prendas.json'), 'utf8')) as {
        modelos: { m: string; para: string[]; i: string }[];
        items: Record<string, { modelo: string; para: string[] }>;
      };
      for (const m of prendas.modelos) for (const rol of m.para) {
        copiar(`modelos/ropa/${m.m}_${rol}.glb`);
        copiar(`modelos/iconos/ropa_${m.i}_${rol}.webp`);
      }
      for (const it of Object.values(prendas.items)) for (const rol of it.para) copiar(`modelos/ropa/${it.modelo}_${rol}.glb`);
      // Los trajes de las clases de Sangre y Ceniza
      for (const f of readdirSync(resolve(pub, 'modelos/ropa'))) if (f.startsWith('sangre_')) copiar(`modelos/ropa/${f}`);
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
            amigos: resolve(raiz, 'amigos.html'), sangre: resolve(raiz, 'sangre.html'), retrete: resolve(raiz, 'retrete.html'), cocina: resolve(raiz, 'cocina.html'),
          },
      },
    },
    server: { host: true },
  };
});
