// Presentaciones públicas de los cinco biomas. Conservan los IDs, textos y dirección de voz existentes.
export interface PostalBioma {id:string;quien:'narrador';nombre:string;texto:string;d?:string;desde:number}
const N=(id:string,texto:string,d?:string):PostalBioma=>({id,quien:'narrador',nombre:'Narrador',texto,d,desde:.8});
export const POSTALES_SANGRE:Record<string,PostalBioma>={
  cementerio: N('LUG.cementerio', 'El Cementerio Hundido: los muertos que Lara no alcanzó a guiar. La niebla es ceniza.', '[low, eerie] El Cementerio Hundido: los muertos que Lara no alcanzó a guiar. [whispering] La niebla es ceniza.'),
  catacumbas: N('LUG.catacumbas', 'Las Catacumbas: los laberintos de Vael’Thor, hechos para que ninguna alma encuentre la salida.', '[ominous] Las Catacumbas: los laberintos de Vael’Thor, hechos para que ninguna alma encuentre la salida.'),
  minas: N('LUG.minas', 'Las Minas de Sangre: la mina de los dragones de Celia, corrompida por la Noche.', '[grave, sad] Las Minas de Sangre: la mina de los dragones de Celia, corrompida por la Noche.'),
  abadia: N('LUG.abadia', 'La Abadía en Llamas: un templo de Aura y Lara donde ahora se reza… pero a otro.', '[unsettling, slow] La Abadía en Llamas: un templo de Aura y Lara donde ahora se reza… [whispering] pero a otro.'),
  castillo: N('LUG.castillo', 'El Castillo del Conde: donde el Conde guarda la grieta.', '[dark, menacing] El Castillo del Conde: donde el Conde guarda la grieta.'),
};
