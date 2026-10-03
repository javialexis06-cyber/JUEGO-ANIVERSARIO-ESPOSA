// Lavarse la cara: el Vampire Survivors del baño. El juego vive en src/casa/lavado/ (motor, armas, mugrosos,
// oleadas, dibujo 3D, interfaz, tienda, disfraces y juego en pareja); aquí solo la entrada que usa la casa.
import './lavado.css';

export { jugarLavado, monedasPorPartida, lavado, type OpcionesLavado, type ResultadoLavado } from './lavado/juego';
export { progresoNuevo as progresoLavadoNuevo } from './lavado/progreso';
