// Mundo 1 · la casa (día). Plantas, zombis y niveles 1-1 a 1-10 con los valores de Plants vs. Zombies 1
// (investigación del 17 y 18 de octubre). Los premios coinciden con historia/estrenos.ts (lo verifica la prueba).
import type { DatosArea, DefNivelBase, DefPlanta, DefZombi } from '../tipos';

/** Segundos por casilla de 80 px → px/s. */
const porCasilla = (s: number) => Math.round((80 / s) * 100) / 100;

const PLANTAS: DefPlanta[] = [
  {
    id: 'lanzaguisantes', nombre: 'Lanzaguisantes', sol: 100, recarga: 7.5, vida: 300, familia: 'tiradora',
    desbloqueo: 'Desde el principio.', descripcion: 'Dispara un guisante de 20 cada 1,5 s a los zombis de su fila.',
    datos: { dano: 20, intervalo: 1.5 },
  },
  {
    id: 'girasol', nombre: 'Girasol', sol: 50, recarga: 7.5, vida: 300, familia: 'productora',
    desbloqueo: 'Al superar el 1-1.', descripcion: 'Da 25 de sol cada ~24 s (el primero entre 3 y 12,5 s).',
    // Primer sol entre 3 y 12,5 s; después cada 23,5–25 s. Abono: 150 de sol al instante (PvZ 2).
    datos: { sol: 25, primeroMin: 3, primeroMax: 12.5, intervaloMin: 23.5, intervaloMax: 25, abonoSol: 150 },
  },
  {
    id: 'petacereza', nombre: 'Petacereza', sol: 150, recarga: 50, vida: 300, familia: 'explosiva', mordible: false,
    desbloqueo: 'Al superar el 1-2.', descripcion: 'Explota a los 1,2 s: 1800 a todos los zombis de 3×3.',
    // Abono (propuesto en la investigación, no es de PvZ 2): si se abona durante la mecha, la explosión cubre 5×5.
    datos: { dano: 1800, mecha: 1.2, radio: 1, radioAbono: 2 },
  },
  {
    id: 'nuez', nombre: 'Nuez', sol: 50, recarga: 30, vida: 4000, familia: 'barrera',
    desbloqueo: 'Al superar el 1-3.', descripcion: 'Muro de 4000 que frena a los zombis mientras la muerden.',
    // Abono: se cura y se pone una coraza de 8000 que dura hasta romperse (PvZ 2).
    datos: { coraza: 8000 },
  },
  {
    id: 'patatapum', nombre: 'Patatapum', sol: 25, recarga: 30, vida: 300, familia: 'explosiva',
    desbloqueo: 'Al superar el 1-5.', descripcion: 'Tarda 15 s en armarse; luego estalla con el primer zombi: 1800.',
    // Abono: se arma al instante y lanza 2 copias armadas a casillas libres al azar (PvZ 2).
    datos: { dano: 1800, armado: 15, copiasAbono: 2 },
  },
  {
    id: 'hielaguisantes', nombre: 'Hielaguisantes', sol: 175, recarga: 7.5, vida: 300, familia: 'tiradora',
    desbloqueo: 'Al superar el 1-6.', descripcion: 'Guisantes de 20 que ralentizan al zombi 10 s.',
    // Abono: ralentiza a todos los zombis de delante en su fila y dispara 60 guisantes helados en 3 s (PvZ 2).
    datos: { dano: 20, intervalo: 1.5, lento: 10, rafaga: 60, rafagaT: 3 },
  },
  {
    id: 'carnivora', nombre: 'Planta carnívora', sol: 150, recarga: 7.5, vida: 300, familia: 'devoradora',
    desbloqueo: 'Al superar el 1-7.', descripcion: 'Se traga entero al zombi de delante y mastica 42 s.',
    // mordida: 0,7 s desde que apunta hasta que cierra la boca (coincide con el arte). Alcance: la mitad izquierda
    // de la casilla de delante (40 px, como el rectángulo de ataque de PvZ). A los que no puede tragar (Zombistein)
    // les da mordiscos de 40.
    // Abono: se traga a los 3 zombis más cercanos de su fila a 3 casillas o menos (1000 a los que no puede tragar) y
    // empuja a los demás con un eructo (PvZ 2).
    datos: { mastica: 42, mordida: 0.7, mordisco: 40, alcance: 40, abonoTraga: 3, abonoAlcance: 3, abonoDano: 1000, eructo: 80 },
  },
  {
    id: 'repetidora', nombre: 'Repetidora', sol: 200, recarga: 7.5, vida: 300, familia: 'tiradora',
    desbloqueo: 'Al superar el 1-8.', descripcion: 'Dispara dos guisantes de 20 cada 1,5 s.',
    // Abono: 90 guisantes en 3 s y, tras un segundo en rojo, un guisante gigante de 600 (PvZ 2).
    datos: { dano: 20, intervalo: 1.5, disparos: 2, separacion: 0.2, rafaga: 90, rafagaT: 3, gigante: 600, carga: 1 },
  },
  {
    id: 'desesporada', nombre: 'Seta desesporada', sol: 0, recarga: 7.5, vida: 300, familia: 'hongo', nocturna: true,
    desbloqueo: 'Al superar el 1-10.', descripcion: 'Gratis. Esporas de 20 a 3 casillas. Duerme de día.',
    // Abono: ella y las demás desesporadas despiertas disparan 30 esporas (PvZ 2). Si dormía, el abono la despierta
    // (propuesto: en PvZ 1 solo el Grano de café la despierta).
    datos: { dano: 20, intervalo: 1.5, alcance: 3, rafaga: 30, rafagaT: 1.5 },
  },
  // Minijuego La bolera: llegan por la cinta y ruedan solas (no ocupan casilla).
  {
    id: 'nuezbolos', nombre: 'Nuez', sol: 0, recarga: 0, vida: 4000, familia: 'barrera', soloMinijuego: true,
    desbloqueo: 'La bolera.', descripcion: 'Rueda por la fila y rebota en diagonal al golpear.',
    datos: { rodante: 1 },
  },
  {
    id: 'nuezexplosiva', nombre: 'Cascanueces', sol: 0, recarga: 0, vida: 4000, familia: 'explosiva', soloMinijuego: true,
    desbloqueo: 'La bolera.', descripcion: 'Rueda y estalla como una Petacereza al primer golpe.',
    datos: { rodante: 1, dano: 1800, radio: 1 },
  },
];

const ZOMBIS: DefZombi[] = [
  {
    id: 'zombi', nombre: 'Zombi', vida: 270, velocidad: porCasilla(4.7), mordida: 100, area: 'dia',
    puntos: 1, peso: 4000, oleadaMinima: 1,
    desbloqueo: '1-1', descripcion: 'Camina 4,7 s por casilla y se come lo primero que encuentra.',
  },
  {
    id: 'abanderado', nombre: 'Zombi abanderado', vida: 270, velocidad: porCasilla(3.7), mordida: 100, area: 'dia',
    puntos: 1, peso: 0, oleadaMinima: 1,
    desbloqueo: '1-2', descripcion: 'Encabeza cada oleada enorme; un poco más rápido.',
  },
  {
    id: 'caracono', nombre: 'Zombi caracono', vida: 270, casco: { nombre: 'cono', vida: 370 },
    velocidad: porCasilla(4.7), mordida: 100, area: 'dia', puntos: 2, peso: 4000, oleadaMinima: 1,
    desbloqueo: '1-3', descripcion: 'El cono aguanta 370 antes que el cuerpo.',
  },
  {
    id: 'pertiga', nombre: 'Zombi saltador de pértiga', vida: 500, velocidad: porCasilla(2.5), mordida: 100,
    area: 'dia', puntos: 2, peso: 2000, oleadaMinima: 5,
    desbloqueo: '1-6', descripcion: 'Corre con la pértiga y salta la primera planta que encuentra.',
    // Corre a 2,5 s por casilla y después camina a 4,7. El salto (1,1 s) lo deja 155 px más adelante.
    // Empieza el salto con los pies a 85 px de la planta (antes de poder morderla, a 70 px).
    datos: { velSinPertiga: porCasilla(4.7), salto: 155, duracionSalto: 1.1, distanciaSalto: 85 },
  },
  {
    id: 'caracubo', nombre: 'Zombi caracubo', vida: 270, casco: { nombre: 'cubo', vida: 1100, metal: true },
    velocidad: porCasilla(4.7), mordida: 100, area: 'dia', puntos: 4, peso: 3000, oleadaMinima: 1,
    desbloqueo: '1-8', descripcion: 'El cubo de metal aguanta 1100 antes que el cuerpo.',
  },
];

// Filas del día: 0 a 4 de arriba abajo. En 1-1 solo la del centro tiene césped; en 1-2 y 1-3, las tres del centro.
const CINCO = [0, 1, 2, 3, 4];
const BASE = {
  parte: 1 as const, mundo: 1, area: 'dia' as const, filas: 5 as const, noche: false, solDelCielo: true,
  solInicial: 50, tipo: 'normal' as const,
};

const NIVELES: DefNivelBase[] = [
  {
    ...BASE, id: '1-1', nombre: 'Nivel 1-1', numero: 1, filasActivas: [2], solInicial: 150,
    zombis: ['zombi'], zombiNuevo: 'zombi', banderas: 0, oleadas: 4,
    // Tutorial: los zombis no llegan hasta sembrar el segundo Lanzaguisantes.
    esperaPlantas: { tipo: 'lanzaguisantes', cantidad: 2 },
    tablaOleadas: [{ fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { fijos: { zombi: 2 } }],
    repeticion: { oleadas: 20, banderas: 2, zombisExtra: ['abanderado'], filasActivas: CINCO },
    premio: { planta: 'girasol' },
  },
  {
    ...BASE, id: '1-2', nombre: 'Nivel 1-2', numero: 2, filasActivas: [1, 2, 3],
    zombis: ['zombi', 'abanderado'], zombiNuevo: 'abanderado', banderas: 1, oleadas: 6,
    tablaOleadas: [
      { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } },
      { fijos: { zombi: 2 } }, { fijos: { zombi: 2 } }, { fijos: { abanderado: 1, zombi: 4 } },
    ],
    repeticion: { oleadas: 20, banderas: 2, filasActivas: CINCO },
    premio: { planta: 'petacereza' },
  },
  {
    ...BASE, id: '1-3', nombre: 'Nivel 1-3', numero: 3, filasActivas: [1, 2, 3],
    zombis: ['zombi', 'abanderado', 'caracono'], zombiNuevo: 'caracono', banderas: 1, oleadas: 8,
    tablaOleadas: [
      { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { extra: 2 },
      { fijos: { caracono: 1 } }, { extra: 2 }, { fijos: { zombi: 1 }, extra: 2 },
      { fijos: { abanderado: 1, zombi: 4, caracono: 1 } },
    ],
    repeticion: { oleadas: 20, banderas: 2, filasActivas: CINCO },
    premio: { planta: 'nuez' },
  },
  {
    ...BASE, id: '1-4', nombre: 'Nivel 1-4', numero: 4, filasActivas: CINCO,
    zombis: ['zombi', 'abanderado', 'caracono'], banderas: 1, oleadas: 10,
    tablaOleadas: [
      { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { extra: 2 }, { extra: 2 },
      { extra: 2 }, { fijos: { zombi: 1 }, extra: 2 }, { fijos: { zombi: 1 }, extra: 2 }, { fijos: { zombi: 1 }, extra: 2 },
      { fijos: { zombi: 5, abanderado: 1, caracono: 1 }, extra: 2 },
    ],
    repeticion: { oleadas: 20, banderas: 2 },
    premio: { objeto: 'pala-y-abono' },
  },
  {
    // La bolera: sin sol; las nueces llegan por la cinta y se ponen antes de la línea roja (3 primeras columnas).
    ...BASE, id: '1-5', nombre: 'La bolera', numero: 5, filasActivas: CINCO, tipo: 'minijuego', minijuego: 'bolera',
    solDelCielo: false, solInicial: 0, lineaRoja: 3, sinAbono: true,
    zombis: ['zombi', 'abanderado', 'caracono'], banderas: 1, oleadas: 8,
    cinta: { plantas: [{ tipo: 'nuezbolos', peso: 80 }, { tipo: 'nuezexplosiva', peso: 20 }] },
    // Dave pide arrancar tres Lanzaguisantes con la pala recién ganada antes de jugar (solo la primera vez).
    plantasIniciales: [{ tipo: 'lanzaguisantes', fila: 1, col: 2 }, { tipo: 'lanzaguisantes', fila: 2, col: 1 }, { tipo: 'lanzaguisantes', fila: 3, col: 2 }],
    palearAntes: true,
    tablaOleadas: [
      { extra: 4 }, { extra: 4 }, { extra: 4 }, { extra: 8 }, { extra: 8 }, { extra: 8 }, { extra: 12 },
      { fijos: { zombi: 3, abanderado: 1, caracono: 1 }, extra: 10 },
    ],
    repeticion: { oleadas: 20, banderas: 2, zombisExtra: ['pertiga', 'caracubo', 'lector'] },
    plantasDisponibles: [], seleccion: false,
    premio: { planta: 'patatapum' },
  },
  {
    ...BASE, id: '1-6', nombre: 'Nivel 1-6', numero: 6, filasActivas: CINCO,
    zombis: ['zombi', 'abanderado', 'caracono', 'pertiga'], zombiNuevo: 'pertiga', banderas: 1, oleadas: 10,
    tablaOleadas: [
      { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { extra: 2 }, { extra: 2 },
      { fijos: { pertiga: 1 } }, { fijos: { zombi: 1 }, extra: 2 }, { fijos: { zombi: 1 }, extra: 2 },
      { fijos: { zombi: 1 }, extra: 2 }, { fijos: { zombi: 5, abanderado: 1, caracono: 1, pertiga: 1 } },
    ],
    repeticion: { oleadas: 20, banderas: 2 },
    premio: { planta: 'hielaguisantes' },
  },
  {
    ...BASE, id: '1-7', nombre: 'Nivel 1-7', numero: 7, filasActivas: CINCO,
    zombis: ['zombi', 'abanderado', 'caracono', 'pertiga'], banderas: 2, oleadas: 20,
    tablaOleadas: [
      { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { extra: 2 }, { extra: 2 },
      { extra: 2 }, { fijos: { zombi: 1 }, extra: 2 }, { fijos: { zombi: 1 }, extra: 2 }, { fijos: { zombi: 1 }, extra: 2 },
      { fijos: { zombi: 5, abanderado: 1 }, extra: 4 }, { extra: 4 }, { extra: 4 }, { fijos: { zombi: 1 }, extra: 4 },
      { fijos: { zombi: 1 }, extra: 4 }, { fijos: { zombi: 1 }, extra: 4 }, { extra: 6 }, { extra: 6 }, { extra: 6 },
      { fijos: { zombi: 1 }, extra: 6 }, { fijos: { zombi: 7, abanderado: 1, caracono: 1, pertiga: 1 }, extra: 5 },
    ],
    repeticion: { oleadas: 30, banderas: 3 },
    premio: { planta: 'carnivora' },
  },
  {
    ...BASE, id: '1-8', nombre: 'Nivel 1-8', numero: 8, filasActivas: CINCO,
    zombis: ['zombi', 'abanderado', 'caracono', 'caracubo'], zombiNuevo: 'caracubo', banderas: 1, oleadas: 10,
    tablaOleadas: [
      { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { extra: 2 }, { extra: 2 },
      { fijos: { caracubo: 1 } }, { fijos: { zombi: 1 }, extra: 2 }, { fijos: { zombi: 1 }, extra: 2 },
      { fijos: { zombi: 1 }, extra: 2 }, { fijos: { zombi: 4, abanderado: 1, caracono: 1, caracubo: 1 } },
    ],
    repeticion: { oleadas: 20, banderas: 2 },
    premio: { planta: 'repetidora' },
  },
  {
    ...BASE, id: '1-9', nombre: 'Nivel 1-9', numero: 9, filasActivas: CINCO,
    zombis: ['zombi', 'abanderado', 'caracono', 'pertiga', 'caracubo'], banderas: 2, oleadas: 20,
    tablaOleadas: [
      { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { fijos: { zombi: 1 } }, { extra: 2 }, { extra: 2 },
      { extra: 2 }, { fijos: { zombi: 1 }, extra: 2 }, { fijos: { zombi: 1 }, extra: 2 }, { fijos: { zombi: 1 }, extra: 2 },
      { fijos: { zombi: 5, abanderado: 1 }, extra: 4 }, { extra: 4 }, { extra: 4 }, { fijos: { zombi: 1 }, extra: 4 },
      { fijos: { zombi: 1 }, extra: 4 }, { fijos: { zombi: 1 }, extra: 4 }, { extra: 6 }, { extra: 6 }, { extra: 6 },
      { fijos: { zombi: 1 }, extra: 6 }, { fijos: { zombi: 8, abanderado: 1, caracono: 1, pertiga: 1, caracubo: 1 } },
    ],
    repeticion: { oleadas: 30, banderas: 3 },
    premio: { nota: true },
  },
  {
    // Ataque total: cinta transportadora sin sol ni girasoles; oleadas con el triple de puntos.
    ...BASE, id: '1-10', nombre: 'Nivel 1-10', numero: 10, filasActivas: CINCO, tipo: 'cinta',
    solDelCielo: false, solInicial: 0, multiplicadorPuntos: 3,
    zombis: ['zombi', 'abanderado', 'caracono', 'pertiga', 'caracubo'], banderas: 2, oleadas: 20,
    // Pesos propuestos (la investigación no confirmó los del juego).
    cinta: {
      plantas: [
        { tipo: 'lanzaguisantes', peso: 15 }, { tipo: 'repetidora', peso: 20 }, { tipo: 'hielaguisantes', peso: 15 },
        { tipo: 'nuez', peso: 15 }, { tipo: 'patatapum', peso: 12 }, { tipo: 'carnivora', peso: 12 }, { tipo: 'petacereza', peso: 8 },
      ],
    },
    tablaOleadas: [
      { fijos: { zombi: 1 }, extra: 2 }, { fijos: { zombi: 1 }, extra: 2 }, { fijos: { zombi: 1 }, extra: 2 },
      { extra: 6 }, { extra: 6 }, { extra: 6 }, { fijos: { zombi: 1 }, extra: 8 }, { fijos: { zombi: 1 }, extra: 8 },
      { fijos: { zombi: 1 }, extra: 8 }, { fijos: { zombi: 5, abanderado: 1 }, extra: 14 }, { extra: 12 }, { extra: 12 },
      { fijos: { zombi: 1 }, extra: 14 }, { fijos: { zombi: 1 }, extra: 14 }, { fijos: { zombi: 1 }, extra: 14 },
      { extra: 18 }, { extra: 18 }, { extra: 18 }, { fijos: { zombi: 1 }, extra: 20 },
      { fijos: { zombi: 8, abanderado: 1, caracono: 1, pertiga: 1, caracubo: 1 }, extra: 18 },
    ],
    repeticion: { oleadas: 20, banderas: 2 },
    plantasDisponibles: [], seleccion: false,
    premio: { planta: 'desesporada' },
  },
];

export const DIA: DatosArea = { plantas: PLANTAS, zombis: ZOMBIS, niveles: NIVELES };
