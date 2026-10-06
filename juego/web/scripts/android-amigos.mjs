// Convierte el proyecto de Android (juego/web/android) en la app aparte para amigos, ANTES de `npx cap sync` y de
// compilar NuestroHogar-Amigos.apk: otro id de aplicación (se instala al lado de la de la pareja), otro nombre
// («Sala de Juegos») y el ícono y la pantalla de arranque neutros de android-amigos/res (sin la pareja ni el
// corazón). Solo lo corre el workflow en su copia del repositorio; aquí no se usa (dejaría el proyecto cambiado).
// Uso: node scripts/android-amigos.mjs
import { cpSync, readFileSync, writeFileSync } from 'node:fs';

const ID = 'com.javialexis.salajuegos';
const NOMBRE = 'Sala de Juegos';

cpSync('android-amigos/res', 'android/app/src/main/res', { recursive: true });

const strings = 'android/app/src/main/res/values/strings.xml';
writeFileSync(strings, readFileSync(strings, 'utf8')
  .replace(/(<string name="(?:app_name|title_activity_main)">)[^<]*(<\/string>)/g, `$1${NOMBRE}$2`)
  .replace(/(<string name="(?:package_name|custom_url_scheme)">)[^<]*(<\/string>)/g, `$1${ID}$2`));

const gradle = 'android/app/build.gradle';
const g = readFileSync(gradle, 'utf8');
if (!/applicationId "[^"]+"/.test(g)) throw new Error('No encontré applicationId en build.gradle');
writeFileSync(gradle, g.replace(/applicationId "[^"]+"/, `applicationId "${ID}"`));
console.log(`Proyecto de Android listo como «${NOMBRE}» (${ID})`);
