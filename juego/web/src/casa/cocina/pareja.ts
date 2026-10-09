// Lo que dicen Él y Ella cuando llegan a comer a la cocina de chef (los apodos y los antojos de cada uno). La versión
// para amigos lo cambia por src/amigos/sin_pareja/cocina.ts (vite.config.ts): allá la pareja nunca llega a comer.
import type { Rol } from '../modelo';
import type { RecetaId } from './tipos';

// Cómo se dicen (docs/la-pareja.md): Él le dice a Ella «esposa» o «pulga aventurera»; Ella a Él «panda», «perro lanudo»
// o «liefje». A Ella le encantan los wafles; a Él el frappé de café (ella siempre lo recibe con uno después del
// trabajo); y para Amor y Amistad él le mandó unas fresas con crema gigantes con un wafle de sorpresa.

/** Lo que dice la pareja según quién llega a comer (rol del invitado) y a qué restaurante. */
export const SALUDOS_PAREJA: Record<Rol, Record<RecetaId, string[]>> = {
  ella: {
    wafles: ['¡Panda! Me prometiste wafles cada vez que yo quisiera… y hoy quiero 🧇💖', 'Liefje, vine por mis wafles favoritos', 'Huele a wafle… ¿fuiste tú, perro lanudo?'],
    fresas: ['¡Panda! ¿Me haces unas fresas con crema gigantes? 🍓', 'Liefje… ¿me atiendes con amor?', 'Vengo a ver a mi chef favorito, perro lanudo'],
    frappes: ['Hoy me toca a mí que me reciban con frappé, ¿no, panda? 😏', 'Liefje, un frappecito para tu esposa', '¿Aquí atiende el perro lanudo más lindo?'],
  },
  el: {
    wafles: ['¡Esposa! Vine a probar los wafles más famosos de la casa 🧇', 'Pulga aventurera, ¿hoy cocinas tú? ¡Qué lujo!', '¿Me atiende la chef más linda de Sopetrán?'],
    fresas: ['¿Me haces unas fresas con crema gigantes… con un wafle de sorpresa? 😏🍓', 'Pulga aventurera, vine por mis fresas con crema', 'Esposa, ¿me atiendes con amor?'],
    frappes: ['¡Esposa! ¿Me recibes con un frappé de café como siempre? ☕💖', 'Pulga, después del trabajo solo pienso en tu frappé', 'Un frappé de café para tu panda, por favor'],
  },
};
export type Tono = 'encantado' | 'feliz' | 'normal' | 'bravo';
export const REACCIONES_PAREJA: Record<Rol, Record<Tono, string[]>> = {
  ella: {
    encantado: ['¡Panda, esto está divino! 💖', '¡Liefje, me casaría otra vez contigo por esto!', '¡Mi chef favorito! Te amo 💕', '¡Hecho con amor se nota, perro lanudo!'],
    feliz: ['¡Qué rico, mi amor!', 'Gracias, panda 💕', 'Me encantó, liefje'],
    normal: ['Te quedó… bien, perro lanudo 😅', 'Con amor todo sabe rico', 'Lo importante es la intención, panda'],
    bravo: ['Panda… ¿qué pasó aquí? 😂', 'Te perdono porque te amo, perro lanudo', 'Mejor pedimos domicilio… mentiras 😘'],
  },
  el: {
    encantado: ['¡Esposa, esto está buenísimo! 💖', '¡Mi pulga aventurera es toda una chef!', '¡Me casaría otra vez contigo por esto!', '¡Hecho con amor se nota!'],
    feliz: ['¡Qué rico, mi amor!', 'Gracias, esposa 💕', 'Me encantó, pulga'],
    normal: ['Te quedó… bien, esposa 😅', 'Con amor todo sabe rico', 'Lo importante es la intención, pulguita'],
    bravo: ['Pulga… ¿qué pasó aquí? 😂', 'Te perdono porque te amo', 'Mejor pedimos domicilio… mentiras 😘'],
  },
};
/** Frases especiales cuando la pareja queda encantada con su plato favorito. */
export const FAVORITO: Partial<Record<Rol, Partial<Record<RecetaId, string>>>> = {
  ella: { wafles: '¡Cumpliste tu promesa: wafles cuando yo quiera! 🧇💖' },
  el: { frappes: '¡Igualito al que me esperas después del trabajo! ☕💖', fresas: '¡Ahora sí sé de quién eran esas fresas con crema! 😂🍓' },
};
