// Genera las hojas del tejado (plantas, accesorios de zombis y escenario) a partir de ilustraciones vectoriales propias.
// Uso: node scripts/arte-tejado/generar.mjs [carpeta-de-prueba]. Sin carpeta escribe en public/jardin/pvz/ (WebP con alfa exacto).
import {chromium} from '@playwright/test';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {SVG_PLANTAS_TEJADO} from './plantas.mjs';
import {SVG_ZOMBIS_TEJADO} from './zombis.mjs';
import {SVG_FONDO_TEJADO} from './fondo.mjs';

const destino=process.argv[2]?resolve(process.argv[2]):resolve(import.meta.dirname,'../../public/jardin/pvz');
await mkdir(destino,{recursive:true});
const PREINSTALADO='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador=await chromium.launch({executablePath:process.env.CHROME_PATH??(existsSync(PREINSTALADO)?PREINSTALADO:undefined)});
const pagina=await navegador.newPage({deviceScaleFactor:1});
const hojas=[['plantas-tejado',SVG_PLANTAS_TEJADO,true],['zombis-tejado',SVG_ZOMBIS_TEJADO,true],['fondo-tejado',SVG_FONDO_TEJADO,false]];
for(const [nombre,svg,alfa] of hojas){
 const ancho=Number(/width="(\d+)"/.exec(svg)[1]),alto=Number(/height="(\d+)"/.exec(svg)[1]);
 await pagina.setViewportSize({width:ancho,height:alto});
 await pagina.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`);
 const png=join(destino,nombre+'.png');
 await pagina.screenshot({path:png,omitBackground:alfa,clip:{x:0,y:0,width:ancho,height:alto}});
 console.log('dibujada',nombre,ancho+'×'+alto);
}
await navegador.close();
if(!process.argv[2]){
 // Misma conversión que el resto del arte del Jardín: alfa exacto para el recorte del atlas.
 execFileSync('python3',[resolve(import.meta.dirname,'../jardin-webp.py'),'--borrar-png'],{stdio:'inherit'});
}
