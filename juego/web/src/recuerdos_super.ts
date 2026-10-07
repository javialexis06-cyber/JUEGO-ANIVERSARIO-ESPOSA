// Recuerdos del súper: cartas que se abren al pasar ciertos días (al ganar su primera estrella). Son de Javier
// para Laura y hablan de lo que es solo de este juego: el mercado que hacen juntos cada vez que él va a Sopetrán, la
// cocina de ella después y el local que crece como lo de ellos (los recuerdos de Cien Puertas, la bañera, los mimos
// y las cartas de Lavarse la cara cuentan otras cosas). La versión para amigos usa sin_pareja/recuerdos_super.ts
// (vacía) y con amigos en la sala no se muestran.

export interface RecuerdoSuper {
  /** Día que hay que pasar (estrella 1) para abrirlo. */
  dia: number;
  titulo: string;
  texto: string;
  firma: string;
}

/** Lo que dicen los botones y la carta (aquí y no en super.html ni en main.ts, para que la versión de amigos no lo lleve). */
export const TEXTOS_CARTAS = {
  sello: '💌',
  boton: (abiertos: number, total: number) => `💌 Recuerdos (${abiertos}/${total})`,
  nueva: '💌 Se abrió un recuerdo',
  fecha: (dia: number) => `Recuerdo del día ${dia}`,
  lista: { fecha: 'Cartas del súper', titulo: 'Nuestros recuerdos', texto: 'Cada carta se abre la primera vez que pasan su día.' },
};

/** El día 100 es el aniversario (en los datos se llama «Gran final», que es lo que ven los amigos). */
export const DIA_FINAL: { evento: string; texto: string } | null = {
  evento: 'Nuestro aniversario',
  texto: 'El local decorado, música especial y una carta para los dos',
};

export const RECUERDOS_SUPER: RecuerdoSuper[] = [
  {
    dia: 7,
    titulo: 'La primera lista',
    texto: 'Pulga aventurera: ¿te has fijado que cada vez que llego a Sopetrán lo primero que hacemos es ir al súper? Tú con la lista y yo con el carrito, decidiendo entre los dos si llevamos una cosa o dos.\nEsta tiendita la hice pensando en eso: en que contigo hasta comprar arroz se vuelve plan.',
    firma: 'Tu panda',
  },
  {
    dia: 15,
    titulo: 'Cocinar juntitos',
    texto: 'Lo mejor del mercado no es comprar: es llegar a tu casa con las bolsas y cocinar juntitos. Tú mandas en la cocina y yo obedezco (casi siempre).\nCuando la tienda se llene de clientes y no des abasto, acuérdate de que al final del día nos espera esa cocina.',
    firma: 'Tu panda',
  },
  {
    dia: 25,
    titulo: 'Nuestra tiendita',
    texto: 'Último día de la tiendita. Empezó con una nevera, un estante y una caja, y mira todo lo que le pusimos.\nAsí somos nosotros, esposa: empezamos con poquito y lo vamos llenando de cosas bonitas. Mañana el local crece… y nosotros también.',
    firma: 'Javier',
  },
  {
    dia: 33,
    titulo: 'El carrito',
    texto: 'Dicen que uno conoce a su pareja empujando un carrito de mercado: si se antoja de todo, si choca contra las góndolas, si deja que el otro escoja el pan.\nYo ya te conozco: te antojas de todo y yo te lo quiero comprar todo. Y no cambio eso por nada.',
    firma: 'Tu panda',
  },
  {
    dia: 42,
    titulo: 'Lo que no está en la lista',
    texto: 'En la lista nunca está lo más importante: la canción del súper que tarareas sin darte cuenta, el antojo que se cuela al final y la fila que se hace cortica porque estamos juntos.\nEso no se paga en la caja, pero siempre me lo llevo para la casa.',
    firma: 'Javier',
  },
  {
    dia: 50,
    titulo: 'La mitad del camino',
    texto: 'Cincuenta días atendiendo juntos, mi amor, sin soltarnos la mano ni cuando el súper se llena.\nSi este juego fuera nuestra vida, estaríamos en ese momento en que uno mira para atrás, sonríe y piensa: valió la pena cada viaje.',
    firma: 'Tu panda',
  },
  {
    dia: 60,
    titulo: 'La bolsa más pesada',
    texto: 'Te prometo una cosa sencilla, esposa: de aquí en adelante, la bolsa más pesada la cargo yo. La del mercado y las otras, las que no se ven.\nPara eso somos dos: para que a ninguno le toque cargar solo.',
    firma: 'Javier',
  },
  {
    dia: 66,
    titulo: 'La alacena de los dos',
    texto: 'Cuando vivamos juntos, el mercado va a ser de los dos y la nevera también. Vamos a tener una alacena llena de lo que te gusta y un cajón solo para tus antojos, que nadie más puede tocar (ni yo… bueno, casi).\nYa lo tengo todo pensado. Lo único que me falta es contar los días.',
    firma: 'Tu panda',
  },
  {
    dia: 75,
    titulo: 'Un supermercado entero',
    texto: 'Mira lo grande que está el local. Me acuerdo de la tiendita del principio y me da risa: así era yo antes de ti, con muy poquito adentro.\nTú llegaste y le pusiste luces, letreros y vida a todo.',
    firma: 'Javier',
  },
  {
    dia: 85,
    titulo: 'La mejor socia',
    texto: 'Si algún día tuviéramos una tienda de verdad, tú serías la jefa y yo el que repone. Tú atenderías a todo el mundo con esa sonrisa que convence a cualquiera, y yo correría feliz a la bodega solo por verte trabajar.\nEres la mejor socia que la vida me pudo dar.',
    firma: 'Tu panda',
  },
  {
    dia: 92,
    titulo: 'Lo que me llevo',
    texto: 'De todos los mercados que hemos hecho no me acuerdo de los precios ni de lo que compramos. Me acuerdo de ti: de tu risa en los pasillos, de cómo me miras cuando me antojo de algo y de lo bonito que es volver contigo a la casa.',
    firma: 'Javier',
  },
  {
    dia: 100,
    titulo: 'Cien días, un solo carrito',
    texto: 'Cien días, una tiendita que se volvió hipermercado y dos que nunca se soltaron. Gracias por jugar esto conmigo, esposa.\nFeliz aniversario. Ojalá nos toquen mil mercados más, mil comidas juntitos en la cocina y una vida entera empujando el mismo carrito.\nTe amo.',
    firma: 'Javier',
  },
];
