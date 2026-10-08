// Las armas de Sangre y Ceniza: cuatro por clase (su arsenal propio), seis comunes y las evoluciones.
// Cada arma es un comportamiento (barrido, proyectil, órbita…) con sus números; las sobrecargas (niveles 6, 12 y 18
// del arma) le cambian el comportamiento prendiendo banderas o multiplicando parámetros.
import { F, type DefArma, type DefSobrecarga, type ParamsArma } from '../tipos';

const BASE: ParamsArma = {
  dano: 10, cadencia: 1, cantidad: 1, area: 1, alcance: 6, vel: 12, perfora: 1, duracion: 0, rebotes: 0, empuje: 2, critico: 0,
  arco: 1.6, quema: 0, veneno: 0, sangrado: 0, lento: 0, aturde: 0, maldicion: 0, flags: 0,
};
const P = (p: Partial<ParamsArma>): ParamsArma => ({ ...BASE, ...p });
const S = (id: string, nombre: string, desc: string, o: Omit<DefSobrecarga, 'id' | 'nombre' | 'desc'>): DefSobrecarga => ({ id, nombre, desc, ...o });

export const ARMAS_LISTA: DefArma[] = [
  // ------------------------------------------------------------------------------------------- Monarca
  {
    id: 'espada_larga', nombre: 'Espada larga', clase: 'monarca', tipo: 'barrido', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo'],
    base: P({ dano: 14, cadencia: 1.05, area: 2.1, arco: 2.2, alcance: 2.6, empuje: 4 }),
    desc: 'Un tajo ancho delante. Con nivel corta más lejos.', modelo: 'espada_larga', color: '#e9e2cf', glifo: 'espada',
    sobrecargas: [
      S('tajo_doble', 'Tajo doble', 'También corta hacia atrás.', { flags: F.DETRAS, por: { dano: 0.9 } }),
      S('hoja_ardiente', 'Hoja ardiente', 'El filo quema a los que toca.', { mas: { quema: 6 }, etiqueta: 'fuego' }),
      S('estocada_real', 'Estocada real', 'Arco cerrado, mucho más largo y fuerte.', { por: { arco: 0.5, area: 1.6, dano: 1.4 } }),
    ],
    evoluciona: { con: 'corona_rota', a: 'hoja_rey_caido' },
  },
  {
    id: 'cetro_hierro', nombre: 'Cetro de hierro', clase: 'monarca', tipo: 'onda', apunta: 'cercano', etiquetas: ['fisico', 'area'],
    base: P({ dano: 10, cadencia: 2.4, area: 3.2, aturde: 0.4, empuje: 6, alcance: 3.4 }),
    desc: 'Golpea el suelo: un anillo que empuja y aturde.', modelo: 'cetro', color: '#d8b45a', glifo: 'cetro',
    sobrecargas: [
      S('decreto', 'Decreto', 'El anillo llega mucho más lejos.', { por: { area: 1.4 } }),
      S('cetro_juicio', 'Cetro de juicio', 'Daño sagrado y más fuerte.', { por: { dano: 1.35 }, etiqueta: 'sagrado' }),
      S('eco_real', 'Eco real', 'Cada golpe retumba dos veces.', { flags: F.DOBLE }),
    ],
  },
  {
    id: 'estandarte', nombre: 'Estandarte real', clase: 'monarca', tipo: 'aura', apunta: 'cercano', etiquetas: ['sagrado', 'area'],
    base: P({ dano: 4, cadencia: 0.5, area: 2.4 }),
    desc: 'Quema a los que se acercan y anima a los aliados cercanos (+10 % de daño).', modelo: 'estandarte', color: '#c8323a', glifo: 'bandera',
    sobrecargas: [
      S('pendon_sangriento', 'Pendón sangriento', 'Los que entran sangran.', { mas: { sangrado: 3 }, etiqueta: 'sangre' }),
      S('bandera_guerra', 'Bandera de guerra', 'El aura crece un 35 %.', { por: { area: 1.35 } }),
      S('estandarte_santo', 'Estandarte santo', 'Cura poco a poco a los aliados dentro.', { flags: F.CURA }),
    ],
  },
  {
    id: 'lanza_ceremonial', nombre: 'Lanza ceremonial', clase: 'monarca', tipo: 'estocada', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo'],
    base: P({ dano: 20, cadencia: 1.5, alcance: 4.2, area: 0.6, perfora: 99, empuje: 3 }),
    desc: 'Una estocada larga que atraviesa a todos los de la fila.', modelo: 'lanza', color: '#e9e2cf', glifo: 'lanza',
    sobrecargas: [
      S('lanza_justa', 'Lanza de justa', 'Empuja el triple y aturde.', { por: { empuje: 3 }, mas: { aturde: 0.5 } }),
      S('triple_punta', 'Triple punta', 'Tres estocadas en abanico.', { mas: { cantidad: 2 } }),
      S('asta_plata', 'Asta de plata', '+15 % de crítico.', { mas: { critico: 0.15 } }),
    ],
  },
  // ------------------------------------------------------------------------------------------- Campesino
  {
    id: 'horca', nombre: 'Horca', clase: 'campesino', tipo: 'estocada', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo'],
    base: P({ dano: 12, cadencia: 0.85, alcance: 3.2, area: 0.7, perfora: 99, empuje: 3 }),
    desc: 'Estocada rápida que ensarta a varios.', modelo: 'horca', color: '#d9c9a0', glifo: 'horca',
    sobrecargas: [
      S('tres_dientes', 'Tres dientes', 'Tres estocadas en abanico.', { mas: { cantidad: 2 } }),
      S('horca_heno', 'Horca de heno', 'Frena y empuja el doble.', { mas: { lento: 0.3 }, por: { empuje: 2 } }),
      S('bieldo_ardiente', 'Bieldo ardiente', 'Prende fuego a lo que pincha.', { mas: { quema: 5 }, etiqueta: 'fuego' }),
    ],
    evoluciona: { con: 'espiga_dorada', a: 'horca_cosecha' },
  },
  {
    id: 'hoz', nombre: 'Hoz', clase: 'campesino', tipo: 'barrido', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo'],
    base: P({ dano: 8, cadencia: 0.55, area: 1.6, arco: 2.6, alcance: 2.0, empuje: 1.5 }),
    desc: 'Tajos cortos y rapidísimos.', modelo: 'hoz', color: '#e8e0c8', glifo: 'hoz',
    sobrecargas: [
      S('siega_rapida', 'Siega rápida', 'Corta un 33 % más rápido.', { por: { cadencia: 0.75 } }),
      S('hoz_curva', 'Hoz curva', 'El tajo da la vuelta completa.', { flags: F.GIRA, por: { dano: 0.85 } }),
      S('hoz_oxidada', 'Hoz oxidada', 'Hace sangrar.', { mas: { sangrado: 3 }, etiqueta: 'sangre' }),
    ],
  },
  {
    id: 'antorcha', nombre: 'Antorcha', clase: 'campesino', tipo: 'cono', apunta: 'cercano', etiquetas: ['fuego', 'area'],
    base: P({ dano: 3, cadencia: 0.35, alcance: 3.4, arco: 0.9, quema: 4, empuje: 0.5 }),
    desc: 'Una llamarada corta que prende todo lo que toca.', modelo: 'antorcha', color: '#ff8a2a', glifo: 'antorcha',
    sobrecargas: [
      S('aceite', 'Aceite', 'Deja el piso ardiendo.', { flags: F.CHARCO, mas: { duracion: 2 } }),
      S('llama_alta', 'Llama alta', 'La llamarada llega un 40 % más lejos.', { por: { alcance: 1.4 } }),
      S('brasas', 'Brasas', 'Quema el doble.', { por: { quema: 2 } }),
    ],
  },
  {
    id: 'honda', nombre: 'Honda', clase: 'campesino', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['fisico', 'distancia'],
    base: P({ dano: 9, cadencia: 0.9, vel: 15, rebotes: 2, alcance: 9, flags: F.REBOTA }),
    desc: 'Piedras que rebotan en las paredes.', modelo: 'honda', proyectil: 'piedra', color: '#b9b0a0', glifo: 'honda',
    sobrecargas: [
      S('piedra_rio', 'Piedra de río', 'Más pesada: aturde.', { mas: { aturde: 0.3 }, por: { dano: 1.2 } }),
      S('punado', 'Puñado de piedras', 'Tres piedras a la vez.', { mas: { cantidad: 2 }, por: { dano: 0.7 } }),
      S('piedra_encendida', 'Piedra encendida', 'Revienta en llamas al pegar.', { flags: F.EXPLOTA, mas: { quema: 4, area: 0.4 }, etiqueta: 'fuego' }),
    ],
  },
  // ------------------------------------------------------------------------------------------- Prisionero
  {
    id: 'grillete', nombre: 'Grillete con cadena', clase: 'prisionero', tipo: 'latigo', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo'],
    base: P({ dano: 13, cadencia: 1.1, alcance: 3.6, area: 0.8, perfora: 99, empuje: 2 }),
    desc: 'Latigazo de cadena que alterna de lado.', modelo: 'grillete', color: '#9aa0a6', glifo: 'cadena',
    sobrecargas: [
      S('cadena_larga', 'Cadena larga', 'Llega un 50 % más lejos.', { por: { alcance: 1.5 } }),
      S('eslabones_puas', 'Eslabones de púas', 'Hace sangrar.', { mas: { sangrado: 4 }, etiqueta: 'sangre' }),
      S('doble_cadena', 'Doble cadena', 'Azota adelante y atrás.', { flags: F.DETRAS }),
    ],
    evoluciona: { con: 'llave_maestra', a: 'cadenas_libertad' },
  },
  {
    id: 'bola_hierro', nombre: 'Bola de hierro', clase: 'prisionero', tipo: 'orbita', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo'],
    base: P({ dano: 11, cadencia: 0.6, area: 1.8, vel: 3.2, empuje: 5 }),
    desc: 'La bola del grillete gira a tu alrededor.', modelo: 'bola_hierro', proyectil: 'bola_hierro', color: '#7b7f86', glifo: 'bola',
    sobrecargas: [
      S('bola_pesada', 'Bola más pesada', 'Pega y empuja un 50 % más.', { por: { dano: 1.5, empuje: 1.5 } }),
      S('dos_bolas', 'Dos bolas', 'Una bola más.', { mas: { cantidad: 1 } }),
      S('bola_encadenada', 'Bola encadenada', 'Gira un 40 % más lejos.', { por: { area: 1.4 } }),
    ],
  },
  {
    id: 'punos', nombre: 'Puños encadenados', clase: 'prisionero', tipo: 'barrido', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo'],
    base: P({ dano: 6, cadencia: 0.32, area: 1.25, arco: 1.2, alcance: 1.7, empuje: 1 }),
    desc: 'Golpes rapidísimos de frente.', modelo: 'punos', color: '#d0c0b0', glifo: 'puno',
    sobrecargas: [
      S('nudillos', 'Nudillos de hierro', '+40 % de daño.', { por: { dano: 1.4 } }),
      S('furia_ciega', 'Furia ciega', 'Pega un 33 % más rápido.', { por: { cadencia: 0.75 } }),
      S('puno_aturde', 'Puño que aturde', 'Cada golpe aturde un instante.', { mas: { aturde: 0.25 } }),
    ],
  },
  {
    id: 'pico_robado', nombre: 'Pico robado', clase: 'prisionero', tipo: 'bumeran', apunta: 'cercano', etiquetas: ['fisico', 'distancia'],
    base: P({ dano: 14, cadencia: 1.8, vel: 11, alcance: 7, perfora: 99, flags: F.VUELVE | F.EXCAVA }),
    desc: 'Lo lanza y vuelve a la mano; rompe la roca blanda que toca.', modelo: 'pico', proyectil: 'pico', color: '#b0a89a', glifo: 'pico',
    sobrecargas: [
      S('dos_picos', 'Dos picos', 'Lanza dos.', { mas: { cantidad: 1 } }),
      S('pico_minero', 'Pico de minero', 'Más pesado y más lejos.', { por: { dano: 1.3, alcance: 1.3 } }),
      S('pico_afilado', 'Pico afilado', 'Hace sangrar.', { mas: { sangrado: 4 }, etiqueta: 'sangre' }),
    ],
  },
  // ------------------------------------------------------------------------------------------- Caballero
  {
    id: 'maza', nombre: 'Maza y escudo', clase: 'caballero', tipo: 'barrido', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo'],
    base: P({ dano: 16, cadencia: 1.25, area: 1.9, arco: 1.8, alcance: 2.3, aturde: 0.35, empuje: 5 }),
    desc: 'Mazazo pesado que aturde.', modelo: 'maza', color: '#c9c3b5', glifo: 'maza',
    sobrecargas: [
      S('maza_bendita', 'Maza bendita', 'Daño sagrado y +20 %.', { por: { dano: 1.2 }, etiqueta: 'sagrado' }),
      S('golpe_sismico', 'Golpe sísmico', 'Cada mazazo hace temblar el suelo alrededor.', { flags: F.GIRA, por: { area: 1.15 } }),
      S('maza_puas', 'Maza de púas', 'Hace sangrar.', { mas: { sangrado: 4 }, etiqueta: 'sangre' }),
    ],
    evoluciona: { con: 'escudo_torre', a: 'maza_juicio' },
  },
  {
    id: 'mangual', nombre: 'Mangual', clase: 'caballero', tipo: 'orbita', apunta: 'cercano', etiquetas: ['fisico'],
    base: P({ dano: 14, cadencia: 0.7, area: 2.2, vel: 2.6, empuje: 6 }),
    desc: 'La bola de púas gira a tu alrededor.', modelo: 'mangual', proyectil: 'bola_puas', color: '#8a8f96', glifo: 'mangual',
    sobrecargas: [
      S('dos_cabezas', 'Dos cabezas', 'Una bola más.', { mas: { cantidad: 1 } }),
      S('mangual_largo', 'Cadena larga', 'Gira un 35 % más lejos.', { por: { area: 1.35 } }),
      S('mangual_fuego', 'Mangual de fuego', 'Quema.', { mas: { quema: 5 }, etiqueta: 'fuego' }),
    ],
  },
  {
    id: 'lanza_justa', nombre: 'Lanza de justa', clase: 'caballero', tipo: 'estocada', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo'],
    base: P({ dano: 22, cadencia: 1.6, alcance: 4.5, area: 0.7, perfora: 99, empuje: 7 }),
    desc: 'Estocada larguísima que lo atraviesa todo.', modelo: 'lanza_justa', color: '#e2d6b8', glifo: 'lanza',
    sobrecargas: [
      S('carga', 'Carga', 'Empuja el doble y aturde.', { por: { empuje: 2 }, mas: { aturde: 0.4 } }),
      S('asta_larga', 'Asta larga', 'Llega un 40 % más lejos.', { por: { alcance: 1.4 } }),
      S('lanza_plata', 'Lanza de plata', '+15 % de crítico.', { mas: { critico: 0.15 } }),
    ],
  },
  {
    id: 'escudo_arrojadizo', nombre: 'Escudo arrojadizo', clase: 'caballero', tipo: 'bumeran', apunta: 'cercano', etiquetas: ['fisico', 'distancia'],
    base: P({ dano: 15, cadencia: 2.2, vel: 10, alcance: 7, perfora: 99, aturde: 0.3, flags: F.VUELVE }),
    desc: 'Lanza el escudo y vuelve; aturde lo que golpea.', modelo: 'escudo', proyectil: 'escudo', color: '#c9c3b5', glifo: 'escudo',
    sobrecargas: [
      S('escudo_rebota', 'Rebote', 'Salta de enemigo en enemigo.', { flags: F.SALTA, mas: { rebotes: 3 } }),
      S('escudo_pesado', 'Escudo pesado', '+50 % de daño, un poco más lento.', { por: { dano: 1.5, vel: 0.8 } }),
      S('dos_escudos', 'Dos escudos', 'Lanza dos.', { mas: { cantidad: 1 } }),
    ],
  },
  // ------------------------------------------------------------------------------------------- Cazador
  {
    id: 'ballesta', nombre: 'Ballesta', clase: 'cazador', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['fisico', 'distancia'],
    base: P({ dano: 15, cadencia: 0.95, vel: 22, alcance: 11, perfora: 1 }),
    desc: 'Virotes rápidos y certeros.', modelo: 'ballesta', proyectil: 'virote', color: '#d8d0c0', glifo: 'ballesta',
    sobrecargas: [
      S('virote_perforante', 'Virote perforante', 'Atraviesa a 3 más.', { mas: { perfora: 3 } }),
      S('rafaga', 'Ráfaga', 'Tres virotes, un poco más flojos.', { mas: { cantidad: 2 }, por: { dano: 0.75 } }),
      S('virote_plata', 'Virote de plata', 'Sagrado y +20 % de crítico.', { mas: { critico: 0.2 }, etiqueta: 'sagrado' }),
    ],
    evoluciona: { con: 'mira_plata', a: 'ballesta_cazanoche' },
  },
  {
    id: 'estacas', nombre: 'Estacas de fresno', clase: 'cazador', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['fisico', 'distancia'],
    base: P({ dano: 10, cadencia: 1.3, cantidad: 3, vel: 16, alcance: 8, perfora: 2, arco: 0.5 }),
    desc: 'Tres estacas en abanico. Los vampiros las odian (+100 %).', modelo: 'estaca', proyectil: 'estaca', color: '#c8a878', glifo: 'estaca',
    sobrecargas: [
      S('clavar', 'Clavar', 'Dejan clavados a los que tocan.', { mas: { aturde: 0.5 } }),
      S('abanico', 'Abanico', 'Dos estacas más.', { mas: { cantidad: 2 } }),
      S('estacas_benditas', 'Estacas benditas', 'Sagradas y +30 %.', { por: { dano: 1.3 }, etiqueta: 'sagrado' }),
    ],
  },
  {
    id: 'agua_bendita', nombre: 'Agua bendita', clase: 'cazador', tipo: 'lanzado', apunta: 'azar', etiquetas: ['sagrado', 'area'],
    base: P({ dano: 6, cadencia: 2.6, area: 1.8, duracion: 3, alcance: 7, flags: F.CHARCO }),
    desc: 'Frascos que dejan charcos sagrados.', modelo: 'frasco', proyectil: 'frasco_agua', color: '#9fd8ff', glifo: 'frasco',
    sobrecargas: [
      S('pila', 'Pila bautismal', 'Charcos un 40 % más grandes.', { por: { area: 1.4 } }),
      S('dos_frascos', 'Dos frascos', 'Lanza dos.', { mas: { cantidad: 1 } }),
      S('agua_plata', 'Agua de plata', 'Marca a los que toca y cura a los aliados.', { flags: F.CURA | F.MARCA }),
    ],
  },
  {
    id: 'trabuco', nombre: 'Trabuco', clase: 'cazador', tipo: 'cono', apunta: 'cercano', etiquetas: ['fisico', 'distancia'],
    base: P({ dano: 13, cadencia: 1.7, alcance: 5, arco: 0.7, empuje: 6 }),
    desc: 'Un fogonazo de perdigones en abanico.', modelo: 'trabuco', color: '#ffd38a', glifo: 'trabuco',
    sobrecargas: [
      S('perdigones_plata', 'Perdigones de plata', 'Sagrado y +15 % de crítico.', { mas: { critico: 0.15 }, etiqueta: 'sagrado' }),
      S('canon_recortado', 'Cañón recortado', 'Abanico más ancho y corto.', { por: { arco: 1.5, alcance: 0.8, dano: 1.15 } }),
      S('doble_canon', 'Doble cañón', 'Dispara dos veces.', { flags: F.DOBLE }),
    ],
  },
  // ------------------------------------------------------------------------------------------- Herrero
  {
    id: 'martillo', nombre: 'Martillo', clase: 'herrero', tipo: 'onda', apunta: 'cercano', etiquetas: ['fisico', 'area', 'cuerpo'],
    base: P({ dano: 15, cadencia: 1.6, area: 2.8, aturde: 0.3, empuje: 6, alcance: 3 }),
    desc: 'Martillazo al suelo: una onda que tumba a los cercanos.', modelo: 'martillo', color: '#ffb46a', glifo: 'martillo',
    sobrecargas: [
      S('martillo_forja', 'Martillo de forja', 'La onda quema.', { mas: { quema: 5 }, etiqueta: 'fuego' }),
      S('golpe_doble', 'Golpe doble', 'Dos martillazos seguidos.', { flags: F.DOBLE }),
      S('yunque_onda', 'Peso del yunque', 'Onda más grande y fuerte.', { por: { area: 1.35, dano: 1.2 } }),
    ],
    evoluciona: { con: 'fuelle', a: 'martillo_titan' },
  },
  {
    id: 'torreta_ballesta', nombre: 'Torreta de ballesta', clase: 'herrero', tipo: 'torreta', apunta: 'cercano', etiquetas: ['construccion', 'distancia'],
    base: P({ dano: 9, cadencia: 7, cantidad: 1, duracion: 18, alcance: 9, vel: 20, area: 0.75 }),
    desc: 'Arma una torreta que dispara virotes sola.', modelo: 'martillo', proyectil: 'virote', color: '#d8d0c0', glifo: 'torreta',
    sobrecargas: [
      S('torreta_doble', 'Torreta doble', 'Una torreta más.', { mas: { cantidad: 1 } }),
      S('virotes_fuego', 'Virotes de fuego', 'Las torretas queman.', { mas: { quema: 4 }, etiqueta: 'fuego' }),
      S('torreta_pesada', 'Torreta pesada', '+60 % de daño.', { por: { dano: 1.6 } }),
    ],
  },
  {
    id: 'yunque', nombre: 'Yunque que cae', clase: 'herrero', tipo: 'rayo', apunta: 'denso', etiquetas: ['fisico', 'area'],
    base: P({ dano: 30, cadencia: 3.0, area: 1.7, aturde: 0.6, alcance: 9, empuje: 3 }),
    desc: 'Un yunque cae del cielo sobre el montón más grande.', modelo: 'martillo', proyectil: 'yunque', color: '#9aa0a6', glifo: 'yunque',
    sobrecargas: [
      S('lluvia_yunques', 'Lluvia de yunques', 'Tres yunques, un poco más flojos.', { mas: { cantidad: 2 }, por: { dano: 0.7 } }),
      S('yunque_ardiente', 'Yunque al rojo', 'Deja el piso ardiendo.', { flags: F.CHARCO, mas: { quema: 6, duracion: 2.5 }, etiqueta: 'fuego' }),
      S('yunque_gigante', 'Yunque gigante', 'Aplasta un 50 % más de área.', { por: { area: 1.5 } }),
    ],
  },
  {
    id: 'chispas', nombre: 'Chispas de forja', clase: 'herrero', tipo: 'cono', apunta: 'cercano', etiquetas: ['fuego', 'area'],
    base: P({ dano: 4, cadencia: 0.45, alcance: 3.8, arco: 1.0, quema: 3, empuje: 0.5 }),
    desc: 'Un chorro de chispas al rojo vivo.', modelo: 'martillo', color: '#ffb02a', glifo: 'chispas',
    sobrecargas: [
      S('fuelle_chispas', 'Fuelle', 'Llega un 40 % más lejos.', { por: { alcance: 1.4 } }),
      S('escoria', 'Escoria', 'Deja el piso ardiendo.', { flags: F.CHARCO, mas: { duracion: 2 } }),
      S('chispas_blancas', 'Chispas blancas', '+50 % de daño.', { por: { dano: 1.5 } }),
    ],
  },
  // ------------------------------------------------------------------------------------------- Alquimista
  {
    id: 'frasco_acido', nombre: 'Frascos ácidos', clase: 'alquimista', tipo: 'lanzado', apunta: 'cercano', etiquetas: ['veneno', 'area'],
    base: P({ dano: 9, cadencia: 1.3, area: 1.6, duracion: 2.5, veneno: 3, alcance: 8, flags: F.CHARCO }),
    desc: 'Revientan y dejan un charco de ácido.', modelo: 'frasco', proyectil: 'frasco_roto', color: '#9be15d', glifo: 'frasco',
    sobrecargas: [
      S('acido_concentrado', 'Ácido concentrado', 'Envenena el doble.', { por: { veneno: 2 } }),
      S('frasco_grande', 'Frasco grande', 'Charco un 40 % más grande.', { por: { area: 1.4 } }),
      S('tres_frascos', 'Tres frascos', 'Lanza tres, un poco más flojos.', { mas: { cantidad: 2 }, por: { dano: 0.7 } }),
    ],
    evoluciona: { con: 'piedra_filosofal', a: 'gran_obra' },
  },
  {
    id: 'fuego_griego', nombre: 'Fuego griego', clase: 'alquimista', tipo: 'lanzado', apunta: 'denso', etiquetas: ['fuego', 'area'],
    base: P({ dano: 14, cadencia: 2.0, area: 2.0, duracion: 2, quema: 6, alcance: 8, flags: F.EXPLOTA | F.CHARCO }),
    desc: 'Explota en llamas sobre el montón más grande.', modelo: 'frasco', proyectil: 'frasco_fuego', color: '#ff7a2a', glifo: 'llama',
    sobrecargas: [
      S('explosion_mayor', 'Explosión mayor', 'Un 40 % más grande.', { por: { area: 1.4 } }),
      S('napalm', 'Napalm', 'El fuego dura el doble.', { por: { duracion: 2 } }),
      S('racimo', 'Racimo', 'Se parte en explosiones pequeñas.', { flags: F.DIVIDE }),
    ],
  },
  {
    id: 'frasco_helado', nombre: 'Frasco helado', clase: 'alquimista', tipo: 'lanzado', apunta: 'cercano', etiquetas: ['hielo', 'area'],
    base: P({ dano: 8, cadencia: 1.7, area: 2.0, lento: 0.5, alcance: 8, flags: F.EXPLOTA }),
    desc: 'Revienta en escarcha: frena todo alrededor.', modelo: 'frasco', proyectil: 'frasco_hielo', color: '#9fe8ff', glifo: 'copo',
    sobrecargas: [
      S('escarcha', 'Escarcha', 'Deja el piso helado.', { flags: F.CHARCO, mas: { duracion: 3 } }),
      S('congelacion', 'Congelación', 'Congela un instante.', { flags: F.CONGELA, mas: { aturde: 0.6 } }),
      S('esquirlas', 'Esquirlas', 'Se parte en esquirlas.', { flags: F.DIVIDE }),
    ],
  },
  {
    id: 'gas_venenoso', nombre: 'Gas venenoso', clase: 'alquimista', tipo: 'aura', apunta: 'cercano', etiquetas: ['veneno', 'area'],
    base: P({ dano: 3, cadencia: 0.5, area: 2.2, veneno: 2 }),
    desc: 'Una nube venenosa que te sigue.', modelo: 'frasco', color: '#86c94a', glifo: 'nube',
    sobrecargas: [
      S('nube_densa', 'Nube densa', 'Envenena el doble.', { por: { veneno: 2 } }),
      S('gas_expansivo', 'Gas expansivo', 'La nube crece un 40 %.', { por: { area: 1.4 } }),
      S('miasma', 'Miasma', 'También frena.', { mas: { lento: 0.3 } }),
    ],
  },
  // ------------------------------------------------------------------------------------------- Sepulturero
  {
    id: 'pala', nombre: 'Pala', clase: 'sepulturero', tipo: 'barrido', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo'],
    base: P({ dano: 13, cadencia: 1.0, area: 1.8, arco: 1.9, alcance: 2.2, empuje: 4 }),
    desc: 'Palazo de frente. También excava rapidísimo.', modelo: 'pala', color: '#b8b0a0', glifo: 'pala',
    sobrecargas: [
      S('palada_tierra', 'Palada de tierra', 'Tira tierra que aturde.', { mas: { aturde: 0.3 }, por: { arco: 1.3 } }),
      S('pala_afilada', 'Pala afilada', 'Hace sangrar.', { mas: { sangrado: 3 }, etiqueta: 'sangre' }),
      S('pala_sepulcro', 'Pala de sepulcro', 'Daño de sombra y +25 %.', { por: { dano: 1.25 }, etiqueta: 'sombra' }),
    ],
    evoluciona: { con: 'calavera_antigua', a: 'pala_ultimo_descanso' },
  },
  {
    id: 'linterna_almas', nombre: 'Linterna de almas', clase: 'sepulturero', tipo: 'orbita', apunta: 'cercano', etiquetas: ['sombra', 'area'],
    base: P({ dano: 7, cadencia: 0.5, cantidad: 2, area: 1.6, vel: 2.8, empuje: 1 }),
    desc: 'Almas en pena que giran a tu alrededor.', modelo: 'linterna', proyectil: 'alma', color: '#8fe3ff', glifo: 'alma',
    sobrecargas: [
      S('mas_almas', 'Más almas', 'Dos almas más.', { mas: { cantidad: 2 } }),
      S('almas_hambrientas', 'Almas hambrientas', 'Salen disparadas contra el enemigo.', { flags: F.PERSIGUE }),
      S('almas_heladas', 'Almas heladas', 'Frenan a los que tocan.', { mas: { lento: 0.4 }, etiqueta: 'hielo' }),
    ],
  },
  {
    id: 'huesos', nombre: 'Huesos', clase: 'sepulturero', tipo: 'proyectil', apunta: 'azar', etiquetas: ['fisico', 'distancia'],
    base: P({ dano: 8, cadencia: 0.8, vel: 12, rebotes: 3, cantidad: 2, alcance: 8, flags: F.REBOTA }),
    desc: 'Huesos que rebotan por las paredes.', modelo: 'pala', proyectil: 'hueso', color: '#e8e0c8', glifo: 'hueso',
    sobrecargas: [
      S('femur', 'Fémur', '+60 % de daño.', { por: { dano: 1.6 } }),
      S('huesos_saltan', 'Huesos inquietos', 'Saltan de enemigo en enemigo.', { flags: F.SALTA, mas: { rebotes: 2 } }),
      S('osario', 'Osario', 'Dos huesos más.', { mas: { cantidad: 2 } }),
    ],
  },
  {
    id: 'campana_funebre', nombre: 'Campana fúnebre', clase: 'sepulturero', tipo: 'onda', apunta: 'cercano', etiquetas: ['sombra', 'area'],
    base: P({ dano: 9, cadencia: 3.0, area: 4.2, aturde: 0.8, empuje: 2, alcance: 4 }),
    desc: 'El toque de difuntos aturde a todos alrededor.', modelo: 'campana_mano', color: '#c8b8ff', glifo: 'campana',
    sobrecargas: [
      S('toque_difuntos', 'Toque de difuntos', '+60 % de daño.', { por: { dano: 1.6 } }),
      S('campanada_larga', 'Campanada larga', 'Llega un 30 % más lejos.', { por: { area: 1.3 } }),
      S('requiem', 'Réquiem', 'También frena.', { mas: { lento: 0.4 } }),
    ],
  },
  // ------------------------------------------------------------------------------------------- Inquisidor
  {
    id: 'incensario', nombre: 'Incensario', clase: 'inquisidor', tipo: 'aura', apunta: 'cercano', etiquetas: ['sagrado', 'area'],
    base: P({ dano: 5, cadencia: 0.5, area: 2.6, quema: 2, flags: F.CURA }),
    desc: 'Humo sagrado: quema a los muertos y cura a los aliados.', modelo: 'incensario', color: '#ffe7a0', glifo: 'incensario',
    sobrecargas: [
      S('incienso_espeso', 'Incienso espeso', 'El humo llega un 35 % más lejos.', { por: { area: 1.35 } }),
      S('brasas_santas', 'Brasas santas', 'Quema dos veces y media más.', { por: { quema: 2.5 }, etiqueta: 'fuego' }),
      S('bendicion', 'Bendición', 'Cura el doble y frena a los muertos.', { mas: { lento: 0.25 }, por: { dano: 1.15 } }),
    ],
    evoluciona: { con: 'rosario', a: 'incensario_juicio' },
  },
  {
    id: 'libro_oraciones', nombre: 'Libro de oraciones', clase: 'inquisidor', tipo: 'orbita', apunta: 'cercano', etiquetas: ['sagrado'],
    base: P({ dano: 9, cadencia: 0.55, cantidad: 2, area: 2.0, vel: 3.4, empuje: 2 }),
    desc: 'Páginas sagradas que giran a tu alrededor.', modelo: 'libro', proyectil: 'pagina', color: '#fff0c0', glifo: 'libro',
    sobrecargas: [
      S('salmos', 'Salmos', 'Una página más.', { mas: { cantidad: 1 } }),
      S('paginas_ardientes', 'Páginas ardientes', 'Queman.', { mas: { quema: 4 }, etiqueta: 'fuego' }),
      S('escritura', 'Escritura', 'Más grandes y fuertes.', { por: { area: 1.3, dano: 1.2 } }),
    ],
  },
  {
    id: 'cruz_plata', nombre: 'Cruz de plata', clase: 'inquisidor', tipo: 'bumeran', apunta: 'cercano', etiquetas: ['sagrado', 'distancia'],
    base: P({ dano: 12, cadencia: 1.6, vel: 12, alcance: 8, perfora: 99, flags: F.VUELVE }),
    desc: 'La cruz va y vuelve atravesando a todos.', modelo: 'cruz', proyectil: 'cruz', color: '#e8eef5', glifo: 'cruz',
    sobrecargas: [
      S('dos_cruces', 'Dos cruces', 'Lanza dos.', { mas: { cantidad: 1 } }),
      S('cruz_llamas', 'Cruz en llamas', 'Quema.', { mas: { quema: 5 }, etiqueta: 'fuego' }),
      S('cruz_pesada', 'Cruz pesada', 'Aturde y pega un 30 % más.', { mas: { aturde: 0.3 }, por: { dano: 1.3 } }),
    ],
  },
  {
    id: 'rayo_sagrado', nombre: 'Rayo sagrado', clase: 'inquisidor', tipo: 'cadena', apunta: 'cercano', etiquetas: ['sagrado'],
    base: P({ dano: 11, cadencia: 1.4, cantidad: 4, alcance: 8, area: 4 }),
    desc: 'Un rayo que salta de muerto en muerto.', modelo: 'incensario', color: '#fff4a8', glifo: 'rayo',
    sobrecargas: [
      S('relampago', 'Relámpago', 'Salta 3 veces más.', { mas: { cantidad: 3 } }),
      S('juicio', 'Juicio', '+50 % de daño.', { por: { dano: 1.5 } }),
      S('luz_cegadora', 'Luz cegadora', 'Aturde.', { mas: { aturde: 0.4 } }),
    ],
  },
  // ------------------------------------------------------------------------------------------- Verdugo
  {
    id: 'hacha_verdugo', nombre: 'Hacha de verdugo', clase: 'verdugo', tipo: 'barrido', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo'],
    base: P({ dano: 26, cadencia: 1.7, area: 2.3, arco: 2.0, alcance: 2.7, empuje: 4 }),
    desc: 'Hachazo lento y brutal.', modelo: 'hacha_verdugo', color: '#d9d2c2', glifo: 'hacha',
    sobrecargas: [
      S('hacha_carnicero', 'Hacha de carnicero', 'Hace sangrar mucho.', { mas: { sangrado: 6 }, etiqueta: 'sangre' }),
      S('hoja_negra', 'Hoja negra', 'Daño de sombra y +15 % de crítico.', { mas: { critico: 0.15 }, etiqueta: 'sombra' }),
      S('giro_mortal', 'Giro mortal', 'El hachazo da la vuelta completa.', { flags: F.GIRA, por: { dano: 0.9 } }),
    ],
    evoluciona: { con: 'capucha_verdugo', a: 'hacha_ultimo_juicio' },
  },
  {
    id: 'ganchos', nombre: 'Ganchos de carnicero', clase: 'verdugo', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['fisico', 'distancia'],
    base: P({ dano: 9, cadencia: 1.5, vel: 16, alcance: 8, perfora: 1, flags: F.ATRAE }),
    desc: 'Ganchos que jalan a los enemigos hacia ti.', modelo: 'gancho', proyectil: 'gancho', color: '#a8a0a0', glifo: 'gancho',
    sobrecargas: [
      S('dos_ganchos', 'Dos ganchos', 'Lanza dos.', { mas: { cantidad: 1 } }),
      S('gancho_oxidado', 'Gancho oxidado', 'Hace sangrar.', { mas: { sangrado: 4 }, etiqueta: 'sangre' }),
      S('gancho_pesado', 'Gancho pesado', 'Aturde al llegar.', { mas: { aturde: 0.5 }, por: { dano: 1.2 } }),
    ],
  },
  {
    id: 'guillotina', nombre: 'Guillotina', clase: 'verdugo', tipo: 'rayo', apunta: 'fuerte', etiquetas: ['fisico'],
    base: P({ dano: 40, cadencia: 3.5, area: 1.3, alcance: 9, flags: F.EJECUTA }),
    desc: 'Cae una hoja de guillotina sobre el más fuerte.', modelo: 'hacha_verdugo', proyectil: 'guillotina', color: '#e0e0e0', glifo: 'guillotina',
    sobrecargas: [
      S('doble_cuchilla', 'Doble cuchilla', 'Dos hojas.', { mas: { cantidad: 1 } }),
      S('hoja_afilada', 'Hoja afilada', '+50 % de daño.', { por: { dano: 1.5 } }),
      S('cadalso', 'Cadalso', 'Corta un 50 % más de área.', { por: { area: 1.5 } }),
    ],
  },
  {
    id: 'soga', nombre: 'Soga', clase: 'verdugo', tipo: 'latigo', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo'],
    base: P({ dano: 7, cadencia: 0.9, alcance: 4, area: 0.7, perfora: 99, lento: 0.45, empuje: 0.5 }),
    desc: 'La soga frena y ahoga.', modelo: 'soga', color: '#c8b088', glifo: 'soga',
    sobrecargas: [
      S('nudo_corredizo', 'Nudo corredizo', 'Aturde.', { mas: { aturde: 0.4 } }),
      S('soga_larga', 'Soga larga', 'Llega un 40 % más lejos.', { por: { alcance: 1.4 } }),
      S('ahorcar', 'Ahorcar', 'Remata a los débiles.', { flags: F.EJECUTA }),
    ],
  },
  // ------------------------------------------------------------------------------------------- Bruja
  {
    id: 'baston_cuervos', nombre: 'Bastón de cuervos', clase: 'bruja', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['sombra', 'distancia'],
    base: P({ dano: 9, cadencia: 0.9, vel: 10, cantidad: 2, alcance: 9, maldicion: 1, flags: F.TELEDIRIGIDO }),
    desc: 'Cuervos que buscan solos al enemigo y lo maldicen.', modelo: 'baston', proyectil: 'pluma_cuervo', color: '#9b7bd8', glifo: 'cuervo',
    sobrecargas: [
      S('bandada', 'Bandada', 'Dos cuervos más.', { mas: { cantidad: 2 } }),
      S('cuervos_famelicos', 'Cuervos famélicos', 'Atraviesan a 2 más.', { mas: { perfora: 2 } }),
      S('picotazo_maldito', 'Picotazo maldito', 'Maldicen el doble.', { mas: { maldicion: 1 } }),
    ],
    evoluciona: { con: 'ojo_cuervo', a: 'baston_noche_eterna' },
  },
  {
    id: 'vudu', nombre: 'Muñeco de vudú', clase: 'bruja', tipo: 'cadena', apunta: 'cercano', etiquetas: ['sombra'],
    base: P({ dano: 8, cadencia: 1.6, cantidad: 3, maldicion: 2, alcance: 8, area: 4 }),
    desc: 'El muñeco reparte el dolor entre varios.', modelo: 'vudu', color: '#c06bd8', glifo: 'vudu',
    sobrecargas: [
      S('alfileres', 'Alfileres', 'Salta a 2 más.', { mas: { cantidad: 2 } }),
      S('agujas_envenenadas', 'Agujas envenenadas', 'Envenena.', { mas: { veneno: 3 }, etiqueta: 'veneno' }),
      S('dolor_compartido', 'Dolor compartido', '+50 % de daño.', { por: { dano: 1.5 } }),
    ],
  },
  {
    id: 'caldero', nombre: 'Caldero', clase: 'bruja', tipo: 'zona', apunta: 'denso', etiquetas: ['veneno', 'area'],
    base: P({ dano: 5, cadencia: 3.4, area: 2.4, duracion: 4.5, veneno: 2, lento: 0.3, alcance: 8 }),
    desc: 'Un charco hirviente del caldero que frena y envenena.', modelo: 'baston', color: '#7ad04a', glifo: 'caldero',
    sobrecargas: [
      S('caldero_grande', 'Caldero grande', 'Un 35 % más grande.', { por: { area: 1.35 } }),
      S('pocima_negra', 'Pócima negra', 'También maldice.', { mas: { maldicion: 1 }, etiqueta: 'sombra' }),
      S('hervor', 'Hervor', '+60 % de daño.', { por: { dano: 1.6 } }),
    ],
  },
  {
    id: 'plumas_negras', nombre: 'Plumas negras', clase: 'bruja', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['sombra', 'distancia'],
    base: P({ dano: 6, cadencia: 0.75, cantidad: 5, vel: 14, arco: 0.9, alcance: 7 }),
    desc: 'Un abanico de plumas afiladas.', modelo: 'baston', proyectil: 'pluma_cuervo', color: '#7a5bb8', glifo: 'pluma',
    sobrecargas: [
      S('tormenta_plumas', 'Tormenta de plumas', 'Tres plumas más.', { mas: { cantidad: 3 } }),
      S('plumas_acero', 'Plumas de acero', 'Atraviesan a 2 más.', { mas: { perfora: 2 } }),
      S('plumas_malditas', 'Plumas malditas', 'Maldicen.', { mas: { maldicion: 1 } }),
    ],
  },
  // ------------------------------------------------------------------------------------------- Juglar
  {
    id: 'laud', nombre: 'Laúd', clase: 'juglar', tipo: 'cono', apunta: 'cercano', etiquetas: ['fisico', 'area'],
    base: P({ dano: 7, cadencia: 1.1, alcance: 4.2, arco: 1.2, aturde: 0.2, empuje: 3 }),
    desc: 'Acordes que empujan y aturden.', modelo: 'laud', color: '#ffd9a0', glifo: 'laud',
    sobrecargas: [
      S('acorde_mayor', 'Acorde mayor', 'Abanico un 50 % más ancho.', { por: { arco: 1.5 } }),
      S('cuerda_rota', 'Cuerda rota', '+60 % de daño.', { por: { dano: 1.6 } }),
      S('eco', 'Eco', 'Cada acorde suena dos veces.', { flags: F.DOBLE }),
    ],
    evoluciona: { con: 'partitura_maldita', a: 'laud_requiem' },
  },
  {
    id: 'cuchillos_malabar', nombre: 'Cuchillos de malabar', clase: 'juglar', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['fisico', 'distancia'],
    base: P({ dano: 7, cadencia: 1.0, cantidad: 4, vel: 13, alcance: 7, flags: F.ESPIRAL }),
    desc: 'Cuchillos que salen en espiral hacia todos lados.', modelo: 'daga', proyectil: 'daga', color: '#e0e6ee', glifo: 'cuchillos',
    sobrecargas: [
      S('mas_cuchillos', 'Más cuchillos', 'Tres cuchillos más.', { mas: { cantidad: 3 } }),
      S('cuchillos_fuego', 'Cuchillos de fuego', 'Queman.', { mas: { quema: 4 }, etiqueta: 'fuego' }),
      S('malabar', 'Malabar', 'Vuelven a la mano.', { flags: F.VUELVE, mas: { perfora: 3 } }),
    ],
  },
  {
    id: 'flauta', nombre: 'Flauta encantada', clase: 'juglar', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['sombra', 'distancia'],
    base: P({ dano: 6, cadencia: 1.2, vel: 9, alcance: 9, duracion: 4, flags: F.TELEDIRIGIDO | F.ENCANTA }),
    desc: 'Notas que encantan: los muertos pelean de tu lado un rato.', modelo: 'flauta', proyectil: 'nota_musical', color: '#ffe08a', glifo: 'nota',
    sobrecargas: [
      S('melodia_larga', 'Melodía larga', 'El encanto dura el doble.', { por: { duracion: 2 } }),
      S('dos_notas', 'Dos notas', 'Toca dos.', { mas: { cantidad: 1 } }),
      S('nota_aguda', 'Nota aguda', 'Atraviesan a 2 más.', { mas: { perfora: 2 } }),
    ],
  },
  {
    id: 'tambor_guerra', nombre: 'Tambor de guerra', clase: 'juglar', tipo: 'onda', apunta: 'cercano', etiquetas: ['fisico', 'area'],
    base: P({ dano: 8, cadencia: 2.2, area: 3.4, aturde: 0.3, empuje: 4, alcance: 3.5 }),
    desc: 'Retumbos que aturden alrededor.', modelo: 'tambor', color: '#e8c08a', glifo: 'tambor',
    sobrecargas: [
      S('redoble', 'Redoble', 'Dos golpes seguidos.', { flags: F.DOBLE }),
      S('tambor_grande', 'Tambor grande', 'Un 30 % más lejos.', { por: { area: 1.3 } }),
      S('ritmo', 'Ritmo', 'Retumba un 33 % más seguido.', { por: { cadencia: 0.75 } }),
    ],
  },
  // ------------------------------------------------------------------------------------------- Comunes
  {
    id: 'daga', nombre: 'Dagas', clase: 'comun', tipo: 'proyectil', apunta: 'mira', etiquetas: ['fisico', 'distancia'],
    base: P({ dano: 7, cadencia: 0.5, vel: 18, alcance: 8 }),
    desc: 'Dagas rápidas hacia donde caminas.', modelo: 'daga', proyectil: 'daga', color: '#e0e6ee', glifo: 'daga',
    sobrecargas: [
      S('dos_dagas', 'Dos dagas', 'Lanza dos.', { mas: { cantidad: 1 } }),
      S('daga_envenenada', 'Daga envenenada', 'Envenena.', { mas: { veneno: 3 }, etiqueta: 'veneno' }),
      S('lanzamiento', 'Lanzamiento', 'Atraviesan a 2 más.', { mas: { perfora: 2 } }),
    ],
    evoluciona: { con: 'guante_ladron', a: 'mil_dagas' },
  },
  {
    id: 'arco_largo', nombre: 'Arco largo', clase: 'comun', tipo: 'proyectil', apunta: 'fuerte', etiquetas: ['fisico', 'distancia'],
    base: P({ dano: 18, cadencia: 1.4, vel: 24, perfora: 2, alcance: 13 }),
    desc: 'Flechas lejanas al enemigo más fuerte.', modelo: 'arco', proyectil: 'flecha', color: '#d8c8a8', glifo: 'arco',
    sobrecargas: [
      S('flecha_fuego', 'Flecha de fuego', 'Quema.', { mas: { quema: 5 }, etiqueta: 'fuego' }),
      S('lluvia_flechas', 'Lluvia de flechas', 'Tres flechas.', { mas: { cantidad: 2 }, por: { dano: 0.8 } }),
      S('flecha_negra', 'Flecha negra', '+20 % de crítico.', { mas: { critico: 0.2 } }),
    ],
  },
  {
    id: 'hacha_arrojadiza', nombre: 'Hacha arrojadiza', clase: 'comun', tipo: 'lanzado', apunta: 'azar', etiquetas: ['fisico', 'area'],
    base: P({ dano: 16, cadencia: 1.4, area: 1.1, alcance: 7, empuje: 3 }),
    desc: 'Vuela girando y cae sobre un enemigo.', modelo: 'hacha', proyectil: 'hacha', color: '#d0c8b8', glifo: 'hacha',
    sobrecargas: [
      S('dos_hachas', 'Dos hachas', 'Lanza dos.', { mas: { cantidad: 1 } }),
      S('hacha_pesada', 'Hacha pesada', '+50 % de daño y área.', { por: { dano: 1.5, area: 1.3 } }),
      S('hacha_sangre', 'Hacha sangrienta', 'Hace sangrar.', { mas: { sangrado: 4 }, etiqueta: 'sangre' }),
    ],
  },
  {
    id: 'bomba', nombre: 'Bomba de pólvora', clase: 'comun', tipo: 'lanzado', apunta: 'denso', etiquetas: ['fuego', 'area'],
    base: P({ dano: 22, cadencia: 2.8, area: 2.3, alcance: 8, empuje: 5, flags: F.EXPLOTA | F.EXCAVA }),
    desc: 'Revienta sobre el montón y rompe paredes blandas.', modelo: 'bomba', proyectil: 'bomba', color: '#ffb05a', glifo: 'bomba',
    sobrecargas: [
      S('mecha_corta', 'Mecha corta', 'Explota un 30 % más seguido.', { por: { cadencia: 0.7 } }),
      S('barril', 'Barril', 'Explosión un 40 % más grande.', { por: { area: 1.4 } }),
      S('metralla', 'Metralla', 'Se parte en explosiones pequeñas.', { flags: F.DIVIDE }),
    ],
    evoluciona: { con: 'barril_polvora', a: 'polvorin' },
  },
  {
    // La minería con pólvora: busca la veta más cercana y la revienta (el hierro, el oro y la sangre saltan al piso)
    id: 'carga_minera', nombre: 'Carga minera', clase: 'comun', tipo: 'lanzado', apunta: 'veta', etiquetas: ['fuego', 'area'],
    base: P({ dano: 14, cadencia: 3.2, area: 2, alcance: 7.5, empuje: 3, flags: F.EXPLOTA | F.EXCAVA | F.MINA }),
    desc: 'Vuela a la veta más cercana y la revienta con todo lo que tiene; si no hay vetas, cae sobre el montón.', modelo: 'bomba', proyectil: 'bomba', color: '#e8c070', glifo: 'pico',
    sobrecargas: [
      S('doble_carga', 'Doble carga', 'Lanza dos cargas.', { mas: { cantidad: 1 } }),
      S('carga_pesada', 'Carga pesada', '+40 % de área y +30 % de daño.', { por: { area: 1.4, dano: 1.3 } }),
      S('mecha_minera', 'Mecha de minero', 'Revienta un 35 % más seguido.', { por: { cadencia: 0.65 } }),
    ],
  },
  {
    id: 'sierra', nombre: 'Hojas de sierra', clase: 'comun', tipo: 'orbita', apunta: 'cercano', etiquetas: ['fisico'],
    base: P({ dano: 8, cadencia: 0.45, cantidad: 3, area: 1.4, vel: 4, empuje: 1 }),
    desc: 'Tres hojas de sierra giran pegadas a ti.', modelo: 'sierra', proyectil: 'sierra', color: '#c8ccd2', glifo: 'sierra',
    sobrecargas: [
      S('sierra_mas', 'Más hojas', 'Dos hojas más.', { mas: { cantidad: 2 } }),
      S('sierra_oxidada', 'Sierra oxidada', 'Hace sangrar.', { mas: { sangrado: 3 }, etiqueta: 'sangre' }),
      S('sierra_lejos', 'Brazo largo', 'Giran un 40 % más lejos.', { por: { area: 1.4 } }),
    ],
  },
  {
    id: 'ira_cielo', nombre: 'Ira del cielo', clase: 'comun', tipo: 'rayo', apunta: 'azar', etiquetas: ['fuego', 'area'],
    base: P({ dano: 18, cadencia: 2.0, cantidad: 2, area: 1.0, alcance: 9, aturde: 0.2 }),
    desc: 'Rayos que caen sobre enemigos al azar.', modelo: 'baston', proyectil: 'rayo', color: '#bfe4ff', glifo: 'rayo',
    sobrecargas: [
      S('tormenta', 'Tormenta', 'Dos rayos más.', { mas: { cantidad: 2 } }),
      S('rayo_grueso', 'Rayo grueso', 'Un 50 % más de área.', { por: { area: 1.5 } }),
      S('trueno', 'Trueno', 'Aturde más y +30 % de daño.', { mas: { aturde: 0.4 }, por: { dano: 1.3 } }),
    ],
  },
  // ------------------------------------------------------------------------------------------- Evoluciones
  {
    id: 'hoja_rey_caido', nombre: 'Hoja del Rey Caído', clase: 'monarca', tipo: 'barrido', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo', 'sagrado'],
    base: P({ dano: 34, cadencia: 0.9, area: 2.9, arco: 6.3, alcance: 3.2, empuje: 6, flags: F.GIRA }),
    desc: 'Un tajo que da la vuelta completa y deja ondas doradas.', modelo: 'espada_larga', color: '#ffd76a', glifo: 'espada', evolucion: true, sobrecargas: [],
  },
  {
    id: 'horca_cosecha', nombre: 'Horca de la Cosecha', clase: 'campesino', tipo: 'estocada', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo'],
    base: P({ dano: 26, cadencia: 0.6, alcance: 4.4, area: 0.9, perfora: 99, empuje: 4, cantidad: 4, quema: 4 }),
    desc: 'Estocadas en estrella; cada muerto puede dejar una espiga.', modelo: 'horca', color: '#ffd76a', glifo: 'horca', evolucion: true, sobrecargas: [],
  },
  {
    id: 'cadenas_libertad', nombre: 'Cadenas de la Libertad', clase: 'prisionero', tipo: 'latigo', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo', 'sangre'],
    base: P({ dano: 28, cadencia: 0.8, alcance: 5.2, area: 1.0, perfora: 99, empuje: 3, sangrado: 5, flags: F.DETRAS | F.GIRA }),
    desc: 'Cuatro latigazos en cruz que roban vida.', modelo: 'grillete', color: '#ff6a6a', glifo: 'cadena', evolucion: true, sobrecargas: [],
  },
  {
    id: 'maza_juicio', nombre: 'Maza del Juicio', clase: 'caballero', tipo: 'barrido', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo', 'sagrado'],
    base: P({ dano: 40, cadencia: 1.0, area: 2.6, arco: 6.3, alcance: 2.8, aturde: 0.6, empuje: 8, flags: F.GIRA }),
    desc: 'Cada mazazo hace temblar la tierra con luz sagrada.', modelo: 'maza', color: '#ffe9a0', glifo: 'maza', evolucion: true, sobrecargas: [],
  },
  {
    id: 'ballesta_cazanoche', nombre: 'Ballesta Cazanoche', clase: 'cazador', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['fisico', 'distancia', 'sagrado'],
    base: P({ dano: 30, cadencia: 0.6, vel: 28, alcance: 13, perfora: 99, area: 1.2, cantidad: 2, flags: F.EXPLOTA }),
    desc: 'Virotes que lo atraviesan todo y revientan en luz.', modelo: 'ballesta', proyectil: 'virote', color: '#fff4c0', glifo: 'ballesta', evolucion: true, sobrecargas: [],
  },
  {
    id: 'martillo_titan', nombre: 'Martillo del Titán', clase: 'herrero', tipo: 'onda', apunta: 'cercano', etiquetas: ['fisico', 'area', 'fuego'],
    base: P({ dano: 38, cadencia: 1.2, area: 4.2, aturde: 0.5, empuje: 8, quema: 6, alcance: 4, flags: F.DOBLE }),
    desc: 'Dos ondas de fuego que tumban todo alrededor.', modelo: 'martillo', color: '#ff9a3a', glifo: 'martillo', evolucion: true, sobrecargas: [],
  },
  {
    id: 'gran_obra', nombre: 'La Gran Obra', clase: 'alquimista', tipo: 'lanzado', apunta: 'cercano', etiquetas: ['veneno', 'area', 'fuego'],
    base: P({ dano: 24, cadencia: 0.9, area: 2.4, duracion: 3.5, veneno: 6, quema: 6, alcance: 9, cantidad: 3, flags: F.CHARCO | F.EXPLOTA }),
    desc: 'Tres frascos que mezclan todo: explotan, queman y envenenan.', modelo: 'frasco', proyectil: 'frasco_roto', color: '#d8ff6a', glifo: 'frasco', evolucion: true, sobrecargas: [],
  },
  {
    id: 'pala_ultimo_descanso', nombre: 'Pala del Último Descanso', clase: 'sepulturero', tipo: 'barrido', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo', 'sombra'],
    base: P({ dano: 32, cadencia: 0.85, area: 2.5, arco: 3.2, alcance: 2.8, empuje: 6, aturde: 0.3, flags: F.DETRAS }),
    desc: 'Palazos que entierran: los muertos se levantan de tu lado.', modelo: 'pala', color: '#a8f0ff', glifo: 'pala', evolucion: true, sobrecargas: [],
  },
  {
    id: 'incensario_juicio', nombre: 'Incensario del Juicio Final', clase: 'inquisidor', tipo: 'aura', apunta: 'cercano', etiquetas: ['sagrado', 'area', 'fuego'],
    base: P({ dano: 14, cadencia: 0.4, area: 3.8, quema: 8, flags: F.CURA }),
    desc: 'Una nube de fuego sagrado que cura a los tuyos.', modelo: 'incensario', color: '#ffe080', glifo: 'incensario', evolucion: true, sobrecargas: [],
  },
  {
    id: 'hacha_ultimo_juicio', nombre: 'Hacha del Último Juicio', clase: 'verdugo', tipo: 'barrido', apunta: 'cercano', etiquetas: ['fisico', 'cuerpo', 'sombra'],
    base: P({ dano: 60, cadencia: 1.3, area: 3.0, arco: 6.3, alcance: 3.2, empuje: 6, sangrado: 8, flags: F.GIRA | F.EJECUTA }),
    desc: 'Un giro que remata a todo lo que queda débil.', modelo: 'hacha_verdugo', color: '#ff4a4a', glifo: 'hacha', evolucion: true, sobrecargas: [],
  },
  {
    id: 'baston_noche_eterna', nombre: 'Bastón de la Noche Eterna', clase: 'bruja', tipo: 'proyectil', apunta: 'cercano', etiquetas: ['sombra', 'distancia'],
    base: P({ dano: 18, cadencia: 0.55, vel: 12, cantidad: 4, alcance: 10, perfora: 3, maldicion: 2, flags: F.TELEDIRIGIDO }),
    desc: 'Una bandada maldita que no deja de cazar.', modelo: 'baston', proyectil: 'pluma_cuervo', color: '#b88bff', glifo: 'cuervo', evolucion: true, sobrecargas: [],
  },
  {
    id: 'laud_requiem', nombre: 'Laúd del Réquiem', clase: 'juglar', tipo: 'cono', apunta: 'cercano', etiquetas: ['fisico', 'area', 'sombra'],
    base: P({ dano: 20, cadencia: 0.8, alcance: 5.4, arco: 2.2, aturde: 0.5, empuje: 4, flags: F.DOBLE | F.DETRAS }),
    desc: 'Acordes por delante y por detrás que dejan a todos tiesos.', modelo: 'laud', color: '#ffd080', glifo: 'laud', evolucion: true, sobrecargas: [],
  },
  {
    id: 'mil_dagas', nombre: 'Mil Dagas', clase: 'comun', tipo: 'proyectil', apunta: 'mira', etiquetas: ['fisico', 'distancia'],
    base: P({ dano: 12, cadencia: 0.12, vel: 22, alcance: 9, perfora: 2 }),
    desc: 'Una lluvia sin fin de dagas.', modelo: 'daga', proyectil: 'daga', color: '#f0f4ff', glifo: 'daga', evolucion: true, sobrecargas: [],
  },
  {
    id: 'polvorin', nombre: 'Polvorín', clase: 'comun', tipo: 'lanzado', apunta: 'denso', etiquetas: ['fuego', 'area'],
    base: P({ dano: 50, cadencia: 1.6, area: 3.4, alcance: 9, empuje: 8, quema: 6, cantidad: 2, flags: F.EXPLOTA | F.EXCAVA | F.DIVIDE }),
    desc: 'Barriles de pólvora que lo vuelan todo, paredes incluidas.', modelo: 'bomba', proyectil: 'bomba', color: '#ffb05a', glifo: 'bomba', evolucion: true, sobrecargas: [],
  },
];

export const ARMAS: Record<string, DefArma> = Object.fromEntries(ARMAS_LISTA.map((a) => [a.id, a]));
export const ARMAS_COMUNES = ARMAS_LISTA.filter((a) => a.clase === 'comun' && !a.evolucion).map((a) => a.id);
/** Nivel máximo de un arma; las sobrecargas salen en estos niveles. */
export const NIVEL_MAX_ARMA = 18;
export const NIVELES_SOBRECARGA = [6, 12, 18];
/** Nivel del arma que pide la evolución (además de su objeto pareja). */
export const NIVEL_EVOLUCION = 12;
/** Ranuras de armas por jugador. */
export const MAX_ARMAS = 4;

/** Experiencia (daño hecho) para pasar del nivel n al n+1 de un arma. */
export const xpArma = (n: number) => Math.round(80 * Math.pow(n, 1.6));
