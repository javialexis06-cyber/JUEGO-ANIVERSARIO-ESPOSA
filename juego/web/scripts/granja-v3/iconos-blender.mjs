/** Pasa a webp los íconos que renderiza Blender (personajes/blender/granja_iconos_herramientas.py) y los deja en
 * public/modelos/granja-v3/iconos/ con el mismo recorte y tamaño de los demás (96 × 96).
 *   node scripts/granja-v3/iconos-blender.mjs <carpeta-de-png> */
import sharp from 'sharp';
import fs from 'node:fs/promises';
const carpeta = process.argv[2];
if (!carpeta) throw new Error('Falta la carpeta con los PNG');
const out = 'public/modelos/granja-v3/iconos';
let n = 0;
for (const f of (await fs.readdir(carpeta)).filter((f) => f.endsWith('.png'))) {
  await sharp(`${carpeta}/${f}`).trim({ threshold: 1 }).resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 90, alphaQuality: 100 }).toFile(`${out}/${f.replace(/\.png$/, '.webp')}`);
  n++;
}
console.log(n, 'íconos');
