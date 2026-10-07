import type { CapacitorConfig } from '@capacitor/cli';

// Con NH_AMIGOS=1 (lo pone el workflow al armar NuestroHogar-Amigos.apk) es la app aparte para amigos: otro id
// (se puede tener instalada junto a la de la pareja), otro nombre y solo la compilación para amigos (dist-amigos).
const amigos = process.env.NH_AMIGOS === '1';

const config: CapacitorConfig = {
  appId: amigos ? 'com.javialexis.salajuegos' : 'com.javialexis.supermania',
  appName: amigos ? 'Sala de Juegos' : 'Nuestro Hogar',
  webDir: amigos ? 'dist-amigos' : 'dist',
};

export default config;
