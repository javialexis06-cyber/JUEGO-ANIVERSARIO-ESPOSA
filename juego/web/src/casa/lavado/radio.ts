// La Radio de la ducha (el Magic Banger del original): con ella se escoge la canción que suena en la lavada. Trae las
// del lavado y las de los otros juegos que también tiene la app de amigos (nunca las de la casa ni las de la pareja).
// Los nombres son los de la Radio (el id es el de la pista en public/musica/lista.json).

export interface PistaRadio {
  id: string;
  nombre: string;
  /** De qué juego es (para agruparlas en la pantalla). */
  de: string;
}

export const RADIO: PistaRadio[] = [
  { id: 'lavado-partida', nombre: 'Espuma a mil', de: 'Lavarse la cara' },
  { id: 'lavado-partida2', nombre: 'Burbujas pesadas', de: 'Lavarse la cara' },
  { id: 'lavado-partida3', nombre: 'Cepillo eléctrico', de: 'Lavarse la cara' },
  { id: 'lavado-partida4', nombre: 'Toalla al hombro', de: 'Lavarse la cara' },
  { id: 'lavado-intensa', nombre: 'Agua hirviendo', de: 'Lavarse la cara' },
  { id: 'lavado-intensa2', nombre: 'Champú en los ojos', de: 'Lavarse la cara' },
  { id: 'lavado-intensa3', nombre: 'Tormenta de jabón', de: 'Lavarse la cara' },
  { id: 'lavado-jefe', nombre: 'El jefe del desagüe', de: 'Lavarse la cara' },
  { id: 'lavado-menu', nombre: 'Frente al espejo', de: 'Lavarse la cara' },
  { id: 'sangre-batalla', nombre: 'La batalla', de: 'Sangre y Ceniza' },
  { id: 'sangre-horda', nombre: 'La horda', de: 'Sangre y Ceniza' },
  { id: 'sangre-jefe', nombre: 'El guardián', de: 'Sangre y Ceniza' },
  { id: 'sangre-noche', nombre: 'La noche', de: 'Sangre y Ceniza' },
  { id: 'cohete-cancion', nombre: 'Del baño a la NASA', de: 'Retrete cohete' },
  { id: 'cohete-tramo0', nombre: 'El despegue', de: 'Retrete cohete' },
  { id: 'cohete-tramo6', nombre: 'Espacio profundo', de: 'Retrete cohete' },
  { id: 'super-cancion', nombre: '¡Súper Manía!', de: 'Súper Manía' },
  { id: 'super-dia', nombre: 'Día de súper', de: 'Súper Manía' },
  { id: 'super-legendario', nombre: 'Súper legendario', de: 'Súper Manía' },
  { id: 'cocina-cancion', nombre: 'Hecho con amor', de: 'Cocina de chef' },
  { id: 'cocina-pico', nombre: 'Hora pico', de: 'Cocina de chef' },
  { id: 'mesa-dados', nombre: 'Dados al aire', de: 'Mesa de juegos' },
  { id: 'mesa-parchis', nombre: 'Parchís', de: 'Mesa de juegos' },
];

export const PISTA_RADIO: Record<string, PistaRadio> = Object.fromEntries(RADIO.map((p) => [p.id, p]));
