// Catálogo de reacciones de los muñequitos. Cada una es una pequeña actuación: anticipación, acción, remate
// y vuelta a la calma, con su cara, su movimiento, sus efectos y su sonido.
import type { Coreografia } from './tipos';

/** Si al modelo todavía le falta una pose nueva, se usa la más parecida de las que ya tiene. */
export const PARECIDA: Record<string, string> = {
  presumir_a: 'hablar_a', presumir_b: 'hablar_b', pulgares_a: 'regalo', pulgares_b: 'regalo', baile_a: 'frotar_a', baile_b: 'frotar_b',
  preparar_salto: 'triste', salto: 'celebrar', puno_a: 'saludo_a', puno_b: 'celebrar', musculo: 'celebrar', jarras: 'reposo',
  puchero: 'triste', facepalm: 'pensando', rascarse: 'pensando', triste_b: 'triste', encogerse: 'hablar_b', llorar_a: 'frotar_a',
  llorar_b: 'frotar_b', rodillas_a: 'celebrar', rodillas_b: 'triste', bandera: 'saludo_a', desmayo: 'pensando', tirado: 'dormido',
  enojo_a: 'cobrar', enojo_b: 'cobrar', brazos_cruzados: 'regalo', boca_abierta: 'frotar_a', aplauso_a: 'regalo', aplauso_b: 'cobrar',
  senalar_a: 'hablar_a', senalar_b: 'hablar_a', risita_a: 'comer_a', risita_b: 'comer_b', beso_volado_a: 'comer_a',
  beso_volado_b: 'saludo_a', pensando_b: 'pensando', reloj: 'hablar_b', impaciente_a: 'reposo', impaciente_b: 'reposo',
  bostezo: 'celebrar', agitar_a: 'regalo', agitar_b: 'cobrar', soplar: 'comer_b', lanzar: 'saludo_a', suplicar: 'comer_b',
  frotar_manos_a: 'cobrar', frotar_manos_b: 'regalo', contar_a: 'reponer', contar_b: 'reponer', inclinado: 'triste',
  trofeo: 'celebrar', corona: 'frotar_a', reverencia: 'triste', chocar_cinco: 'saludo_b', senalar_arriba: 'saludo_a',
  celebrar: 'feliz', saludo_a: 'saludo', cobrar: 'regalo',
};

const c = (nombre: string, pasos: Coreografia['pasos'], extra: Partial<Coreografia> = {}): Coreografia => ({ nombre, pasos, ...extra });

export const COREOS: Record<string, Coreografia> = {
  // ------------------------------------------------------------------ Presumir y celebrar
  presumir: c('presumir', [
    { dur: 0.28, pose: 'jarras', cara: 'presumido', suave: 22, mov: [{ tipo: 'inflarse', cuanto: 0.05 }], fx: [{ tipo: 'brillo' }] },
    { dur: 1.15, pose: 'presumir_a', pose2: 'presumir_b', ritmo: 2.6, cara: 'presumido', suave: 26, mov: [{ tipo: 'cabeza', eje: 'ladeo', grados: 7, frec: 1.3 }, { tipo: 'inflarse', cuanto: 0.05 }], sonidoRitmo: 'sacudir', habla: true },
    { dur: 0.7, pose: 'jarras', cara: 'guino', suave: 20, mov: [{ tipo: 'inflarse', cuanto: 0.07 }, { tipo: 'mirar', a: 'otro' }], fx: [{ tipo: 'brillo' }], sonido: 'tin' },
    { dur: 0.25, pose: 'reposo', cara: 'presumido' },
  ], { prioridad: 2 }),

  pulgares: c('pulgares', [
    { dur: 0.14, pose: 'preparar_salto', cara: 'feliz', suave: 30, mov: [{ tipo: 'estirar', cuanto: -0.08 }] },
    { dur: 0.95, pose: 'pulgares_a', pose2: 'pulgares_b', ritmo: 3.4, cara: 'guino', suave: 28, mov: [{ tipo: 'rebote', alto: 0.035, frec: 3.4 }, { tipo: 'mirar', a: 'camara' }], fx: [{ tipo: 'estrellas', n: 5 }], sonido: 'pop', habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'feliz' },
  ], { prioridad: 1 }),

  bailecito: c('bailecito', [
    { dur: 0.18, pose: 'baile_a', cara: 'feliz', suave: 24 },
    { dur: 1.9, pose: 'baile_a', pose2: 'baile_b', ritmo: 2.2, cara: 'carcajada', suave: 24, mov: [{ tipo: 'balanceo', grados: 9, frec: 2.2 }, { tipo: 'rebote', alto: 0.04, frec: 4.4 }], fx: [{ tipo: 'notas', dur: 1.9 }], sonido: 'musiquita', habla: true },
    { dur: 0.35, pose: 'feliz', cara: 'guino', mov: [{ tipo: 'salto', alto: 0.12 }] },
    { dur: 0.25, pose: 'reposo', cara: 'feliz' },
  ], { prioridad: 2 }),

  salto_confeti: c('salto confeti', [
    { dur: 0.24, pose: 'preparar_salto', cara: 'concentrado', suave: 26, mov: [{ tipo: 'estirar', cuanto: -0.14 }] },
    { dur: 0.62, pose: 'salto', cara: 'carcajada', suave: 30, mov: [{ tipo: 'salto', alto: 0.42 }], fx: [{ tipo: 'confeti', n: 46 }, { tipo: 'estrellas', n: 6 }], sonido: 'boing' },
    { dur: 0.2, pose: 'preparar_salto', cara: 'carcajada', suave: 30, mov: [{ tipo: 'estirar', cuanto: -0.12 }], fx: [{ tipo: 'polvo' }] },
    { dur: 0.75, pose: 'celebrar', cara: 'carcajada', suave: 18, mov: [{ tipo: 'rebote', alto: 0.05, frec: 3.2 }], habla: true },
    { dur: 0.25, pose: 'reposo', cara: 'feliz' },
  ], { prioridad: 2 }),

  puno_aire: c('puño al aire', [
    { dur: 0.16, pose: 'puno_b', cara: 'concentrado', suave: 28, mov: [{ tipo: 'estirar', cuanto: -0.06 }] },
    { dur: 0.34, pose: 'puno_a', cara: 'carcajada', suave: 30, mov: [{ tipo: 'estirar', cuanto: 0.08 }], fx: [{ tipo: 'estrellas', n: 4 }], sonido: 'si' },
    { dur: 0.3, pose: 'puno_b', cara: 'feliz', suave: 32, mov: [{ tipo: 'estirar', cuanto: -0.07 }] },
    { dur: 0.26, pose: 'puno_a', cara: 'carcajada', suave: 30, mov: [{ tipo: 'estirar', cuanto: 0.06 }] },
    { dur: 0.45, pose: 'puno_b', cara: 'feliz', suave: 30, mov: [{ tipo: 'estirar', cuanto: -0.05 }], habla: true },
    { dur: 0.25, pose: 'reposo', cara: 'feliz' },
  ], { prioridad: 2 }),

  musculo: c('músculo', [
    { dur: 0.2, pose: 'jarras', cara: 'concentrado', suave: 24 },
    { dur: 1.25, pose: 'musculo', cara: 'presumido', suave: 26, mov: [{ tipo: 'inflarse', cuanto: 0.09 }, { tipo: 'temblor', amp: 0.006, frec: 22 }, { tipo: 'cabeza', eje: 'ladeo', grados: 5, frec: 0.8 }], fx: [{ tipo: 'brillo' }, { tipo: 'estrellas', n: 3 }], sonido: 'tin', habla: true },
    { dur: 0.45, pose: 'jarras', cara: 'guino', mov: [{ tipo: 'inflarse', cuanto: 0.05 }], fx: [{ tipo: 'brillo' }] },
    { dur: 0.25, pose: 'reposo', cara: 'feliz' },
  ], { prioridad: 2 }),

  celebrar: c('celebrar', [
    { dur: 0.12, pose: 'preparar_salto', cara: 'feliz', suave: 30, mov: [{ tipo: 'estirar', cuanto: -0.06 }] },
    { dur: 0.8, pose: 'celebrar', cara: 'feliz', suave: 24, mov: [{ tipo: 'rebote', alto: 0.05, frec: 3 }], fx: [{ tipo: 'estrellas', n: 3 }], sonido: 'pop', habla: true },
    { dur: 0.25, pose: 'reposo', cara: 'feliz' },
  ], { prioridad: 1 }),

  asentir: c('asentir', [
    { dur: 0.75, pose: 'reposo', cara: 'feliz', mov: [{ tipo: 'cabeza', eje: 'si', grados: 9, frec: 2.6 }] },
  ]),

  // ------------------------------------------------------------------ Tristeza y mala suerte
  puchero: c('puchero', [
    { dur: 0.2, pose: 'triste', cara: 'sorprendido', suave: 22 },
    { dur: 1.5, pose: 'puchero', cara: 'puchero', suave: 16, mov: [{ tipo: 'cabeza', eje: 'ladeo', grados: 5, frec: 0.9 }, { tipo: 'hueso', hueso: 'pie.L', eje: 'x', grados: 16, frec: 1.3 }, { tipo: 'hundirse', cuanto: 0.03 }], fx: [{ tipo: 'resoplido' }], sonido: 'puchero', habla: true },
    { dur: 0.35, pose: 'triste', cara: 'puchero' },
    { dur: 0.3, pose: 'reposo', cara: 'normal' },
  ], { prioridad: 1 }),

  facepalm: c('facepalm', [
    { dur: 0.16, pose: 'reposo', cara: 'sorprendido', suave: 26 },
    { dur: 1.35, pose: 'facepalm', cara: 'triste', suave: 34, mov: [{ tipo: 'cabeza', eje: 'no', grados: 8, frec: 1.1 }, { tipo: 'hundirse', cuanto: 0.03 }], fx: [{ tipo: 'nube', dur: 1.3 }], sonido: 'plaf', habla: true },
    { dur: 0.3, pose: 'triste', cara: 'triste' },
    { dur: 0.25, pose: 'reposo', cara: 'normal' },
  ], { prioridad: 1 }),

  triste: c('triste', [
    { dur: 0.3, pose: 'triste', cara: 'triste', suave: 10 },
    { dur: 1.6, pose: 'triste_b', cara: 'triste', suave: 8, mov: [{ tipo: 'hundirse', cuanto: 0.05 }, { tipo: 'balanceo', grados: 3, frec: 0.6 }], fx: [{ tipo: 'nube', dur: 1.8 }], sonido: 'wawa', habla: true },
    { dur: 0.35, pose: 'reposo', cara: 'normal', suave: 10 },
  ], { prioridad: 1 }),

  rascarse: c('rascarse la cabeza', [
    { dur: 1.45, pose: 'rascarse', cara: 'nervioso', suave: 20, mov: [{ tipo: 'cabeza', eje: 'ladeo', grados: 8, frec: 1.2 }, { tipo: 'hueso', hueso: 'mano.R', eje: 'x', grados: 18, frec: 5 }], fx: [{ tipo: 'gotita' }, { tipo: 'signo', c: '?' }], sonido: 'duda', habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'nervioso' },
  ], { prioridad: 1 }),

  gotita: c('gotita', [
    { dur: 1.2, pose: 'encogerse', cara: 'nervioso', suave: 18, mov: [{ tipo: 'temblor', amp: 0.005, frec: 14 }, { tipo: 'estirar', cuanto: -0.03 }], fx: [{ tipo: 'gotita' }], sonido: 'gota', habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'nervioso' },
  ], { prioridad: 1 }),

  encogerse: c('encogerse de hombros', [
    { dur: 0.25, pose: 'reposo', cara: 'aburrido' },
    { dur: 0.9, pose: 'encogerse', cara: 'aburrido', suave: 24, mov: [{ tipo: 'estirar', cuanto: 0.04 }, { tipo: 'cabeza', eje: 'ladeo', grados: 10, frec: 0.8 }], fx: [{ tipo: 'signo', c: '…' }], habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'normal' },
  ], { prioridad: 1 }),

  alivio: c('alivio', [
    { dur: 0.3, pose: 'encogerse', cara: 'nervioso', mov: [{ tipo: 'estirar', cuanto: -0.05 }], fx: [{ tipo: 'gotita' }] },
    { dur: 0.9, pose: 'reposo', cara: 'feliz', suave: 10, mov: [{ tipo: 'hundirse', cuanto: 0.04 }], fx: [{ tipo: 'soplido' }], sonido: 'uf', habla: true },
    { dur: 0.25, pose: 'reposo', cara: 'normal' },
  ], { prioridad: 1 }),

  // ------------------------------------------------------------------ Enojo y celos (cuando el otro juega bien)
  enojo: c('enojo chistoso', [
    { dur: 0.22, pose: 'enojo_a', cara: 'sorprendido', suave: 30, mov: [{ tipo: 'estirar', cuanto: 0.05 }] },
    { dur: 1.3, pose: 'enojo_a', pose2: 'enojo_b', ritmo: 4.4, cara: 'enojado', suave: 34, mov: [{ tipo: 'rebote', alto: 0.03, frec: 8.8 }, { tipo: 'temblor', amp: 0.012, frec: 16 }], fx: [{ tipo: 'vena', dur: 2.2 }, { tipo: 'humo', dur: 1.3 }, { tipo: 'polvo' }], sonido: 'enojo', sonidoRitmo: 'pisoton', habla: true },
    { dur: 0.75, pose: 'brazos_cruzados', cara: 'enojado', suave: 22, mov: [{ tipo: 'mirar', a: 'lejos' }, { tipo: 'inflarse', cuanto: 0.04 }], fx: [{ tipo: 'resoplido' }], sonido: 'hmph' },
    { dur: 0.3, pose: 'reposo', cara: 'enojado' },
  ], { prioridad: 2 }),

  brazos_cruzados: c('brazos cruzados de reojo', [
    { dur: 0.9, pose: 'brazos_cruzados', cara: 'aburrido', suave: 20, mov: [{ tipo: 'mirar', a: 'lejos' }, { tipo: 'inflarse', cuanto: 0.03 }], fx: [{ tipo: 'resoplido' }], sonido: 'hmph', habla: true },
    { dur: 0.45, pose: 'brazos_cruzados', cara: 'enojado', suave: 30, mov: [{ tipo: 'mirar', a: 'otro' }] },
    { dur: 0.6, pose: 'brazos_cruzados', cara: 'aburrido', suave: 22, mov: [{ tipo: 'mirar', a: 'lejos' }] },
    { dur: 0.3, pose: 'reposo', cara: 'normal' },
  ], { prioridad: 1 }),

  boca_abierta: c('boca abierta', [
    { dur: 0.12, pose: 'reposo', cara: 'sorprendido', suave: 30, mov: [{ tipo: 'salto', alto: 0.06 }] },
    { dur: 1.15, pose: 'boca_abierta', cara: 'sorprendido', suave: 30, mov: [{ tipo: 'temblor', amp: 0.008, frec: 18 }, { tipo: 'estirar', cuanto: 0.04 }, { tipo: 'mirar', a: 'otro' }], fx: [{ tipo: 'rayos' }, { tipo: 'signo', c: '!?' }], sonido: 'sorpresa', habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'normal' },
  ], { prioridad: 1 }),

  aplauso_mala_gana: c('aplauso de mala gana', [
    { dur: 2.0, pose: 'aplauso_a', pose2: 'aplauso_b', ritmo: 1.4, cara: 'aburrido', suave: 26, mov: [{ tipo: 'mirar', a: 'otro' }, { tipo: 'cabeza', eje: 'ladeo', grados: 4, frec: 0.7 }], sonidoRitmo: 'palmada', habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'aburrido' },
  ], { prioridad: 1 }),

  mirada_asesina: c('mirada asesina', [
    { dur: 1.1, pose: 'jarras', cara: 'enojado', suave: 24, mov: [{ tipo: 'mirar', a: 'otro' }, { tipo: 'temblor', amp: 0.004, frec: 20 }], fx: [{ tipo: 'vena', dur: 1.2 }], sonido: 'hmph', habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'normal' },
  ], { prioridad: 1 }),

  // ------------------------------------------------------------------ Burla (cuando al otro le va mal)
  risita: c('risita burlona', [
    { dur: 1.35, pose: 'risita_a', pose2: 'risita_b', ritmo: 2.8, cara: 'guino', suave: 24, mov: [{ tipo: 'temblor', amp: 0.006, frec: 10 }, { tipo: 'rebote', alto: 0.015, frec: 5.6 }, { tipo: 'mirar', a: 'otro' }], fx: [{ tipo: 'risa', texto: 'ji ji' }], sonido: 'risita', habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'presumido' },
  ], { prioridad: 1 }),

  senalar_reir: c('señalar y reír', [
    { dur: 0.2, pose: 'senalar_a', cara: 'sorprendido', suave: 30, mov: [{ tipo: 'mirar', a: 'otro' }] },
    { dur: 1.55, pose: 'senalar_a', pose2: 'senalar_b', ritmo: 3.2, cara: 'carcajada', suave: 26, mov: [{ tipo: 'rebote', alto: 0.03, frec: 6.4 }, { tipo: 'mirar', a: 'otro' }], fx: [{ tipo: 'risa', texto: 'JA JA' }, { tipo: 'lagrimas', dur: 1.4, risa: true }], sonido: 'carcajada', habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'feliz' },
  ], { prioridad: 2 }),

  frotarse_manos: c('frotarse las manos', [
    { dur: 1.25, pose: 'frotar_manos_a', pose2: 'frotar_manos_b', ritmo: 4.2, cara: 'presumido', suave: 30, mov: [{ tipo: 'cabeza', eje: 'si', grados: 3, frec: 4.2 }, { tipo: 'estirar', cuanto: -0.03 }], fx: [{ tipo: 'brillo' }], sonido: 'frotar', habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'guino' },
  ], { prioridad: 1 }),

  encogerse_burla: c('encogerse burlón', [
    { dur: 0.9, pose: 'encogerse', cara: 'guino', suave: 24, mov: [{ tipo: 'mirar', a: 'otro' }, { tipo: 'cabeza', eje: 'ladeo', grados: 8, frec: 1 }], habla: true },
    { dur: 0.25, pose: 'reposo', cara: 'presumido' },
  ], { prioridad: 1 }),

  // ------------------------------------------------------------------ Cariño
  beso_volado: c('besito volado', [
    { dur: 0.45, pose: 'beso_volado_a', cara: 'beso', suave: 22, mov: [{ tipo: 'mirar', a: 'otro' }], sonido: 'beso' },
    { dur: 0.7, pose: 'beso_volado_b', cara: 'guino', suave: 26, mov: [{ tipo: 'mirar', a: 'otro' }, { tipo: 'estirar', cuanto: 0.04 }], fx: [{ tipo: 'beso' }], habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'feliz' },
  ], { prioridad: 2 }),

  sonrojarse: c('sonrojarse', [
    { dur: 1.3, pose: 'recibir_caricia', cara: 'feliz', suave: 14, mov: [{ tipo: 'balanceo', grados: 4, frec: 1.2 }, { tipo: 'estirar', cuanto: -0.03 }], fx: [{ tipo: 'sonrojo', dur: 1.6 }, { tipo: 'corazones', n: 4 }], sonido: 'corazon', habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'feliz' },
  ], { prioridad: 2 }),

  saludo: c('saludo', [
    { dur: 1.3, pose: 'saludo_a', pose2: 'saludo_b', ritmo: 2, cara: 'feliz', suave: 20, mov: [{ tipo: 'mirar', a: 'camara' }, { tipo: 'rebote', alto: 0.02, frec: 2 }], habla: true },
    { dur: 0.25, pose: 'reposo', cara: 'feliz' },
  ], { prioridad: 1 }),

  chocar_cinco: c('chocar los cinco', [
    { dur: 0.45, pose: 'reposo', cara: 'feliz', mov: [{ tipo: 'acercarse', cuanto: 1 }, { tipo: 'mirar', a: 'otro' }, { tipo: 'rebote', alto: 0.04, frec: 4.4 }] },
    { dur: 0.16, pose: 'chocar_cinco', cara: 'concentrado', suave: 30, mov: [{ tipo: 'acercarse', cuanto: 1 }, { tipo: 'mirar', a: 'otro' }, { tipo: 'estirar', cuanto: 0.06 }] },
    { dur: 0.55, pose: 'chocar_cinco', cara: 'carcajada', mov: [{ tipo: 'acercarse', cuanto: 1 }, { tipo: 'mirar', a: 'otro' }], fx: [{ tipo: 'chispa' }], sonido: 'palmada_fuerte', habla: true },
    { dur: 0.45, pose: 'feliz', cara: 'feliz', mov: [{ tipo: 'mirar', a: 'otro' }] },
  ], { prioridad: 3 }),

  abrazo: c('abrazo', [
    { dur: 0.5, pose: 'reposo', cara: 'feliz', mov: [{ tipo: 'acercarse', cuanto: 1 }, { tipo: 'mirar', a: 'otro' }, { tipo: 'rebote', alto: 0.03, frec: 4 }] },
    { dur: 1.6, pose: 'abrazo', cara: 'feliz', suave: 12, mov: [{ tipo: 'acercarse', cuanto: 1 }, { tipo: 'mirar', a: 'otro' }, { tipo: 'balanceo', grados: 4, frec: 0.9 }], fx: [{ tipo: 'corazones', n: 7 }], sonido: 'abrazo', habla: true },
    { dur: 0.3, pose: 'feliz', cara: 'feliz' },
  ], { prioridad: 3 }),

  // ------------------------------------------------------------------ Esperando y pensando
  pensando: c('pensando', [
    { dur: 2.4, pose: 'pensando', pose2: 'pensando_b', ritmo: 0.42, cara: 'concentrado', suave: 6, mov: [{ tipo: 'cabeza', eje: 'ladeo', grados: 5, frec: 0.42 }, { tipo: 'hueso', hueso: 'pie.R', eje: 'x', grados: 10, frec: 2.2 }], fx: [{ tipo: 'signo', c: '?' }] },
  ], { bucle: true }),

  idea: c('idea', [
    { dur: 0.6, pose: 'senalar_arriba', cara: 'sorprendido', suave: 30, mov: [{ tipo: 'estirar', cuanto: 0.06 }], fx: [{ tipo: 'foco' }], sonido: 'idea' },
    { dur: 0.2, pose: 'reposo', cara: 'feliz' },
  ], { prioridad: 1 }),

  estudiar: c('estudiar el tablero', [
    { dur: 3, pose: 'inclinado', cara: 'concentrado', suave: 6, mov: [{ tipo: 'mirar', a: 'tablero' }, { tipo: 'cabeza', eje: 'no', grados: 4, frec: 0.35 }] },
  ], { bucle: true }),

  impaciente: c('impaciente', [
    { dur: 1.0, pose: 'reloj', cara: 'aburrido', suave: 16, fx: [{ tipo: 'reloj' }], sonido: 'tictac' },
    { dur: 1.5, pose: 'impaciente_a', pose2: 'impaciente_b', ritmo: 3.6, cara: 'aburrido', suave: 34, mov: [{ tipo: 'mirar', a: 'otro' }], sonidoRitmo: 'tic', habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'aburrido' },
  ], { prioridad: 0 }),

  bostezo: c('bostezo', [
    { dur: 0.3, pose: 'reposo', cara: 'aburrido' },
    { dur: 1.5, pose: 'bostezo', cara: 'bostezo', suave: 7, mov: [{ tipo: 'estirar', cuanto: 0.06 }, { tipo: 'temblor', amp: 0.003, frec: 12 }], fx: [{ tipo: 'zzz', dur: 1.6 }], sonido: 'bostezo', habla: true },
    { dur: 0.4, pose: 'reposo', cara: 'aburrido', suave: 8 },
  ], { prioridad: 0 }),

  // ------------------------------------------------------------------ Propias de los juegos
  soplar_lanzar: c('soplar y lanzar los dados', [
    { dur: 0.7, pose: 'agitar_a', pose2: 'agitar_b', ritmo: 7, cara: 'concentrado', suave: 40, mov: [{ tipo: 'temblor', amp: 0.006, frec: 14 }], sonido: 'agitar', prop: 'dados' },
    { dur: 0.42, pose: 'soplar', cara: 'beso', suave: 26, fx: [{ tipo: 'soplido' }], sonido: 'soplo', prop: 'dados' },
    { dur: 0.36, pose: 'lanzar', cara: 'concentrado', suave: 36, mov: [{ tipo: 'estirar', cuanto: 0.05 }], prop: null },
    { dur: 0.3, pose: 'reposo', cara: 'normal' },
  ], { prioridad: 1 }),

  cruzar_dedos: c('cruzar los dedos', [
    { dur: 1.5, pose: 'suplicar', cara: 'nervioso', suave: 18, mov: [{ tipo: 'temblor', amp: 0.005, frec: 12 }, { tipo: 'cabeza', eje: 'si', grados: 4, frec: 3 }], fx: [{ tipo: 'gotita' }, { tipo: 'estrellas', n: 2 }], habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'nervioso' },
  ], { prioridad: 1 }),

  contar: c('contar semillas', [
    { dur: 1.4, pose: 'contar_a', pose2: 'contar_b', ritmo: 2.1, cara: 'concentrado', suave: 24, mov: [{ tipo: 'mirar', a: 'tablero' }, { tipo: 'cabeza', eje: 'si', grados: 5, frec: 2.1 }], sonidoRitmo: 'tic', habla: true },
    { dur: 0.3, pose: 'reposo', cara: 'feliz' },
  ], { prioridad: 1 }),

  // ------------------------------------------------------------------ Final de la partida
  trofeo: c('trofeo', [
    { dur: 0.22, pose: 'preparar_salto', cara: 'concentrado', suave: 26, mov: [{ tipo: 'estirar', cuanto: -0.12 }], prop: 'trofeo' },
    { dur: 0.6, pose: 'trofeo', cara: 'carcajada', suave: 28, mov: [{ tipo: 'salto', alto: 0.4 }], fx: [{ tipo: 'confeti', n: 70, pantalla: true }, { tipo: 'aura', dur: 5 }], sonido: 'fanfarria', prop: 'trofeo' },
    { dur: 1.7, pose: 'trofeo', cara: 'carcajada', suave: 18, mov: [{ tipo: 'rebote', alto: 0.04, frec: 3 }, { tipo: 'giro', vueltas: 1 }], fx: [{ tipo: 'estrellas', n: 8 }], habla: true, prop: 'trofeo' },
  ], { prioridad: 3 }),

  corona: c('corona', [
    { dur: 0.35, pose: 'corona', cara: 'sorprendido', suave: 24, prop: 'corona', sonido: 'tin' },
    { dur: 1.5, pose: 'corona', cara: 'presumido', suave: 18, mov: [{ tipo: 'inflarse', cuanto: 0.07 }, { tipo: 'cabeza', eje: 'ladeo', grados: 6, frec: 0.8 }], fx: [{ tipo: 'brillo' }, { tipo: 'estrellas', n: 5 }], habla: true, prop: 'corona' },
    { dur: 0.6, pose: 'jarras', cara: 'guino', mov: [{ tipo: 'inflarse', cuanto: 0.06 }], fx: [{ tipo: 'brillo' }], prop: 'corona' },
  ], { prioridad: 3 }),

  baile_final: c('baile final', [
    { dur: 1.2, pose: 'baile_a', pose2: 'baile_b', ritmo: 2.4, cara: 'carcajada', suave: 26, mov: [{ tipo: 'balanceo', grados: 10, frec: 2.4 }, { tipo: 'rebote', alto: 0.05, frec: 4.8 }], fx: [{ tipo: 'notas', dur: 3 }], sonido: 'musiquita', prop: 'corona' },
    { dur: 0.75, pose: 'feliz', cara: 'carcajada', mov: [{ tipo: 'giro', vueltas: 1 }, { tipo: 'salto', alto: 0.25 }], fx: [{ tipo: 'confeti', n: 30 }], sonido: 'boing', prop: 'corona' },
    { dur: 1.2, pose: 'baile_a', pose2: 'baile_b', ritmo: 2.4, cara: 'guino', suave: 26, mov: [{ tipo: 'balanceo', grados: 10, frec: 2.4 }, { tipo: 'rebote', alto: 0.05, frec: 4.8 }], habla: true, prop: 'corona' },
    { dur: 0.3, pose: 'reposo', cara: 'feliz', prop: 'corona' },
  ], { prioridad: 3 }),

  llorar: c('llorar dramático', [
    { dur: 0.3, pose: 'triste', cara: 'puchero', suave: 16 },
    { dur: 2.3, pose: 'llorar_a', pose2: 'llorar_b', ritmo: 2.6, cara: 'llorando', suave: 24, mov: [{ tipo: 'rebote', alto: 0.02, frec: 5.2 }, { tipo: 'temblor', amp: 0.007, frec: 12 }], fx: [{ tipo: 'lagrimas', dur: 2.4 }, { tipo: 'nube', dur: 2.4 }], sonido: 'llanto', habla: true, prop: 'panuelo' },
    { dur: 0.4, pose: 'triste', cara: 'puchero', prop: null },
  ], { prioridad: 3 }),

  rodillas: c('de rodillas', [
    { dur: 0.35, pose: 'boca_abierta', cara: 'sorprendido', suave: 24, fx: [{ tipo: 'rayos' }] },
    { dur: 1.3, pose: 'rodillas_a', cara: 'llorando', suave: 14, mov: [{ tipo: 'temblor', amp: 0.008, frec: 12 }], fx: [{ tipo: 'lagrimas', dur: 1.3 }], sonido: 'porque', habla: true },
    { dur: 1.4, pose: 'rodillas_b', cara: 'triste', suave: 10, mov: [{ tipo: 'hundirse', cuanto: 0.02 }], fx: [{ tipo: 'nube', dur: 1.5 }], sonido: 'wawa' },
    { dur: 0.4, pose: 'reposo', cara: 'triste', suave: 8 },
  ], { prioridad: 3 }),

  bandera_blanca: c('bandera blanca', [
    { dur: 1.9, pose: 'bandera', cara: 'nervioso', suave: 18, mov: [{ tipo: 'hueso', hueso: 'brazo.R', eje: 'z', grados: 16, frec: 1.8 }, { tipo: 'cabeza', eje: 'ladeo', grados: 5, frec: 0.9 }], fx: [{ tipo: 'gotita' }], sonido: 'rendirse', habla: true, prop: 'bandera' },
    { dur: 0.4, pose: 'reposo', cara: 'nervioso', prop: null },
  ], { prioridad: 3 }),

  otra: c('¡otra!', [
    { dur: 0.2, pose: 'puno_b', cara: 'enojado', suave: 30, mov: [{ tipo: 'estirar', cuanto: -0.08 }] },
    { dur: 1.1, pose: 'senalar_arriba', cara: 'enojado', suave: 30, mov: [{ tipo: 'salto', alto: 0.18 }], fx: [{ tipo: 'signo', c: '!' }, { tipo: 'vena', dur: 1.2 }], sonido: 'otra', habla: true },
    { dur: 0.3, pose: 'jarras', cara: 'concentrado' },
  ], { prioridad: 3 }),

  desmayo: c('desmayo', [
    { dur: 0.7, pose: 'desmayo', cara: 'llorando', suave: 18, mov: [{ tipo: 'balanceo', grados: 6, frec: 1.4 }], sonido: 'desmayo', habla: true },
    { dur: 1.5, pose: 'tirado', cara: 'dormido', suave: 12, mov: [{ tipo: 'caer' }], fx: [{ tipo: 'mareo', dur: 1.4 }, { tipo: 'polvo' }] },
    { dur: 0.45, pose: 'reposo', cara: 'nervioso', suave: 10 },
  ], { prioridad: 3 }),

  huir: c('salir corriendo', [
    { dur: 0.3, pose: 'boca_abierta', cara: 'sorprendido', suave: 30, mov: [{ tipo: 'salto', alto: 0.08 }, { tipo: 'mirar', a: 'otro' }], fx: [{ tipo: 'signo', c: '!' }], sonido: 'sorpresa' },
    { dur: 1.3, pose: 'caminar_a', pose2: 'caminar_b', ritmo: 4.5, cara: 'llorando', suave: 30, mov: [{ tipo: 'huir', cuanto: 1 }, { tipo: 'mirar', a: 'lejos' }, { tipo: 'rebote', alto: 0.05, frec: 9 }], fx: [{ tipo: 'polvo' }, { tipo: 'lagrimas', dur: 1.2 }], sonido: 'huida', habla: true },
    { dur: 0.9, pose: 'reposo', cara: 'puchero', mov: [{ tipo: 'huir', cuanto: 1 }] },
    { dur: 0.7, pose: 'caminar_a', pose2: 'caminar_b', ritmo: 2, cara: 'puchero', suave: 20, mov: [{ tipo: 'huir', cuanto: 0.55 }, { tipo: 'mirar', a: 'otro' }], fx: [{ tipo: 'signo', c: '…' }] },
    { dur: 1.1, pose: 'caminar_a', pose2: 'caminar_b', ritmo: 2.2, cara: 'puchero', suave: 20, mov: [{ tipo: 'mirar', a: 'camara' }] },
    { dur: 0.35, pose: 'brazos_cruzados', cara: 'aburrido', mov: [{ tipo: 'mirar', a: 'lejos' }], fx: [{ tipo: 'resoplido' }], sonido: 'hmph' },
  ], { prioridad: 2 }),

  reverencia: c('reverencia', [
    { dur: 1.1, pose: 'reverencia', cara: 'feliz', suave: 10, fx: [{ tipo: 'estrellas', n: 3 }], habla: true },
    { dur: 0.35, pose: 'reposo', cara: 'feliz', suave: 10 },
  ], { prioridad: 2 }),
};
