/** Modelo mendeliano de juego; no representa la genética real de razas animales. */
export type Species = 'vaca' | 'cerdito' | 'gallina' | 'conejo' | 'oveja' | 'unicornio' | 'dragon' | 'grifo' | 'cabra' | 'pato' | 'avestruz' | 'dinosaurio';
export type AllelePair = [string, string];
export type Locus = 'A' | 'B' | 'F' | 'E';
export type Genome = Record<Locus, AllelePair>;
export type Phenotype = { variante: 0 | 1 | 2 | 3; fantasia: string | null; label: string };
export type PunnettResult = {
  cuadro: AllelePair[][];
  resultados: { genotipo: string; alelos: AllelePair; probabilidad: number }[];
};

const LOCI: Locus[] = ['A', 'B', 'F', 'E'];
const ESPECIES: Species[] = ['vaca', 'cerdito', 'gallina', 'conejo', 'oveja', 'unicornio', 'dragon', 'grifo', 'cabra', 'pato', 'avestruz', 'dinosaurio'];
const NATURALES: Record<string, string[]> = {
  vaca: ['Vaca caramelo y crema', 'Vaca negra y crema', 'Vaca dorada', 'Vaca blanca'],
  cerdito: ['Cerdito rosado', 'Cerdito manchado', 'Cerdito castaño', 'Cerdito crema'],
  gallina: ['Gallina dorada', 'Gallina negra', 'Gallina rojiza', 'Gallina blanca'],
  conejo: ['Conejo canela', 'Conejo negro', 'Conejo gris', 'Conejo blanco'],
  cabra: ['Cabra canela', 'Cabra negra', 'Cabra gris', 'Cabra blanca'],
  pato: ['Pato de collar verde', 'Pato chocolate', 'Pato gris', 'Pato blanco'],
  avestruz: ['Avestruz negro', 'Avestruz castaño', 'Avestruz gris', 'Avestruz crema'],
  dinosaurio: ['Dinosaurio musgoso', 'Dinosaurio azul', 'Dinosaurio terracota', 'Dinosaurio dorado'],
  oveja: ['Oveja crema', 'Oveja negra', 'Oveja café', 'Oveja perla'],
};
const FANTASIA: Partial<Record<Species, [string, string, string, string]>> = {
  vaca: ['vaca_volcan', 'Vaca de volcán', 'vaca_nube', 'Vaca de nube'],
  cerdito: ['cerdito_musgo', 'Cerdito de musgo', 'cerdito_ambar', 'Cerdito de ámbar'],
  gallina: ['gallina_oscura', 'Gallina oscura', 'gallina_aurora', 'Gallina de aurora'],
  conejo: ['conejo_lunar', 'Conejo lunar', 'conejo_escarcha', 'Conejo de escarcha'],
  oveja: ['oveja_cristal', 'Oveja de cristal', 'oveja_tormenta', 'Oveja de tormenta'],
};

function pareja(value: AllelePair | string, esperado?: Locus): AllelePair {
  const alleles = typeof value === 'string' ? [...value] : value;
  if (!Array.isArray(alleles) || alleles.length !== 2 || alleles.some(a => typeof a !== 'string' || !/^[ABFEabfe]$/.test(a))) {
    throw new TypeError('Cada locus requiere exactamente dos alelos A/a, B/b, F/f o E/e.');
  }
  const locus = alleles[0].toUpperCase();
  if (alleles[1].toUpperCase() !== locus || (esperado && locus !== esperado)) {
    throw new TypeError(`Alelos incompatibles con el locus ${esperado ?? locus}.`);
  }
  // La mayúscula va primero, de modo que aA y Aa comparten el mismo genotipo.
  return [...alleles].sort() as AllelePair;
}

export function validarGenoma(genoma: Genome): Genome {
  if (!genoma || typeof genoma !== 'object') throw new TypeError('Genoma ausente.');
  return Object.fromEntries(LOCI.map(l => [l, pareja(genoma[l], l)])) as Genome;
}

export function crearGenoma(A = 'Aa', B = 'Bb', F = 'FF', E = 'Ee'): Genome {
  return { A: pareja(A, 'A'), B: pareja(B, 'B'), F: pareja(F, 'F'), E: pareja(E, 'E') };
}

/** Cada celda combina un alelo de cada progenitor; las cuatro celdas equiprobables se agrupan. */
export function cuadroPunnett(pairA: AllelePair | string, pairB: AllelePair | string): PunnettResult {
  const a = pareja(pairA), b = pareja(pairB, a[0].toUpperCase() as Locus);
  const cuadro = a.map(ma => b.map(pa => pareja([ma, pa])));
  const agrupados = new Map<string, { genotipo: string; alelos: AllelePair; probabilidad: number }>();
  for (const alelos of cuadro.flat()) {
    const genotipo = alelos.join('');
    const resultado = agrupados.get(genotipo);
    if (resultado) resultado.probabilidad += .25;
    else agrupados.set(genotipo, { genotipo, alelos: [...alelos] as AllelePair, probabilidad: .25 });
  }
  return { cuadro, resultados: [...agrupados.values()] };
}

/** Loci independientes: la probabilidad conjunta es el producto de sus cuadros de Punnett. */
export function probabilidades(a: Genome, b: Genome): { genoma: Genome; probabilidad: number }[] {
  const madre = validarGenoma(a), padre = validarGenoma(b);
  let conjunto: { genoma: Partial<Genome>; probabilidad: number }[] = [{ genoma: {}, probabilidad: 1 }];
  for (const locus of LOCI) {
    const opciones = cuadroPunnett(madre[locus], padre[locus]).resultados;
    conjunto = conjunto.flatMap(prev => opciones.map(opcion => ({
      genoma: { ...prev.genoma, [locus]: [...opcion.alelos] },
      probabilidad: prev.probabilidad * opcion.probabilidad,
    })));
  }
  return conjunto as { genoma: Genome; probabilidad: number }[];
}

/** Ocho selecciones independientes. Las proporciones son probabilidades, no cuotas por camada. */
export function cruzar(a: Genome, b: Genome, rng: () => number = Math.random): Genome {
  const madre = validarGenoma(a), padre = validarGenoma(b);
  const alelo = (pair: AllelePair) => {
    const n = rng();
    if (!Number.isFinite(n) || n < 0 || n >= 1) throw new RangeError('rng debe devolver un valor entre 0 incluido y 1 excluido.');
    return pair[n < .5 ? 0 : 1];
  };
  return Object.fromEntries(LOCI.map(l => [l, pareja([alelo(madre[l]), alelo(padre[l])], l)])) as Genome;
}

export function fenotipo(especie: Species, genoma: Genome): Phenotype {
  if (!ESPECIES.includes(especie)) throw new TypeError(`Especie desconocida: ${especie}`);
  const genes = validarGenoma(genoma);
  const dominanteA = genes.A.includes('A'), dominanteB = genes.B.includes('B');
  const variante = (dominanteA ? (dominanteB ? 0 : 1) : (dominanteB ? 2 : 3)) as 0 | 1 | 2 | 3;
  if (especie === 'unicornio' || especie === 'dragon' || especie === 'grifo') {
    const nombre = { unicornio: 'Unicornio', dragon: 'Dragón', grifo: 'Grifo' }[especie];
    return { variante, fantasia: especie, label: `${nombre} · variedad ${variante + 1}` };
  }
  if (FANTASIA[especie] && genes.F.every(a => a === 'f')) {
    const especies = FANTASIA[especie]!;
    const indice = genes.E.includes('E') ? 0 : 2;
    return { variante, fantasia: especies[indice], label: especies[indice + 1] };
  }
  return { variante, fantasia: null, label: NATURALES[especie][variante] };
}
