// Une los catálogos de ropa de Él y Ella (modelos-crudos/ropa_el.json y ropa_ella.json, que escribe
// personajes/blender/ropa.py) en src/casa/ropa.json, y pasa sus íconos a WebP livianos.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const CRUDOS = 'modelos-crudos';
const todos = new Map();
for (const rol of ['el', 'ella']) {
  const p = `${CRUDOS}/ropa_${rol}.json`;
  if (!existsSync(p)) continue;
  for (const it of Object.values(JSON.parse(readFileSync(p, 'utf8')))) {
    // Solo lo que ya está optimizado en public/ (si una prenda falló en Blender, no se vende)
    if (!existsSync(`public/modelos/ropa/${it.modelo}_${rol}.glb`)) continue;
    const prev = todos.get(it.id);
    if (prev) prev.para.push(rol);
    else todos.set(it.id, { ...it, para: [rol] });
  }
}
const lista = [...todos.values()].sort((a, b) => a.orden - b.orden);
// La primera variante de cada modelo viene pintada en el archivo: no se recolorea en el juego
const primera = new Set();
for (const it of lista) {
  if (primera.has(it.modelo)) continue;
  primera.add(it.modelo);
  it.colores = {};
}
writeFileSync('src/casa/ropa.json', JSON.stringify(lista, null, 0).replace(/\},\{/g, '},\n{'));
console.log('ropa:', lista.length, 'variantes de', primera.size, 'prendas');
if (existsSync(`${CRUDOS}/iconos`)) {
  execFileSync('python3', ['-c', `
import os, sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
n = 0
for f in sorted(os.listdir(src)):
    if not (f.startswith('ropa_') and f.endswith('.png')):
        continue
    out = os.path.join(dst, f[:-4] + '.webp')
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(os.path.join(src, f)):
        continue
    im = Image.open(os.path.join(src, f)).convert('RGBA').resize((144, 144), Image.LANCZOS)
    im.save(out, 'WEBP', quality=82, method=6)
    n += 1
print('iconos webp nuevos:', n)
`, `${CRUDOS}/iconos`, 'public/modelos/iconos'], { stdio: 'inherit' });
}
