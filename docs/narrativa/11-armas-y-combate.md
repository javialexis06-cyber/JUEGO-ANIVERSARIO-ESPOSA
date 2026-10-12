# Armas, dominio y combate

**Estado: primera versión del motor de armas integrada en las expediciones actuales.** Espadas, arco, bastón y cuatro sellos funcionan en las expediciones existentes. Confluencia, sus materiales, los ajustes regionales, jefes y misiones siguen siendo diseño pendiente de integración. No hay animaciones definitivas ni audio nuevo.

La referencia es la libertad de estilos y el combate de exploración de Terraria y Sun Haven, adaptados a la perspectiva actual del juego. No se cambia a una cámara lateral ni se crea otro motor. El jugador se mueve para evitar ataques anunciados, usa obstáculos y elige distancia, energía y consumibles. No se añaden niveles de personaje, talentos generales ni un árbol RPG para armaduras. Las habilidades y el equipo que ya existían conservan sus reglas.

## Primera versión integrada

| Familia | Alcance | Costo por acción confirmada | Comportamiento |
|---|---:|---|---|
| Espada | 2,1 | 1 energía | Impacto próximo, recuperación 0,42 s y empuje. Conserva mejoras anteriores de espada. |
| Arco de ribera | 8 | 1 energía y 1 flecha | Proyectil a 11 unidades/s, recuperación 0,6 s; dirección fijada al disparar. |
| Bastón de cuarzo | 6 | 3 energía | Proyectil a 8 unidades/s, recuperación 0,8 s. |
| Sello de fuego | 5 | 10 energía al convocar | Patrón estacionario de 8 s, disparos separados por al menos 1 s. |
| Sello de agua | 5 | 10 energía al convocar | Menor daño; recuperación del enemigo de 0,8 s al impactar. |
| Sello de tierra | 4 | 10 energía al convocar | Alcance menor y mayor empuje; no atraviesa obstáculos. |
| Sello de aire | 6 | 10 energía al convocar | Proyectil más rápido y menor daño. |

Los sellos convocan patrones elementales y no capturan animales, almas ni fragmentos de los núcleos de Fuatia. Una sola invocación activa: no se puede superponer otra para obtener una ráfaga infinita. Desaparece si el jugador se aleja más de diez unidades, termina su duración, sale o cambia de piso. No hace daño durante un menú que pause el motor ni mientras el juego está cerrado. Los proyectiles pueden fallar, impactan en el primer enemigo que encuentran y se detienen ante muros. Un objetivo invulnerable detiene el proyectil sin recibir otro impacto.

## Cómo obtenerlas y usarlas

El banco de trabajo ofrece las seis recetas nuevas con materiales de Celia: arco con 8 maderas, 6 fibras y 2 cobres; bastón con 6 maderas, 3 cuarzos y 2 cobres. Fuego requiere 6 piedras, 4 carbones y 2 cuarzos; agua, 6 piedras, 4 arcillas y 2 cuarzos; tierra, 8 piedras, 2 cobres y 2 cuarzos; aire, 6 maderas, 4 fibras y 2 cuarzos. Cada receta dura 30 segundos de producción y usa la transacción existente de insumos y salida. La mochila llena no duplica el arma ni devuelve insumos de un lote terminado.

Cuatro flechas se fabrican a mano con 2 maderas y 1 piedra, de forma inmediata. Las flechas no tienen precio de venta. Se descuentan después de validar alcance, trayectoria, energía y recuperación. Un intento rechazado no consume munición. Un disparo válido que luego falla sí la consume.

Se puede seleccionar el arma en la barra o equiparla en la ranura de arma y seleccionar la herramienta espada. En expedición, apuntar a una criatura usa la familia equipada con su alcance. La espada y los otros estilos comparten la recuperación de acción: cambiar de arma no permite esquivar ese límite. El combate escalar antiguo fuera de expedición conserva su espada; las familias a distancia se prueban en expediciones.

## Progresión de arma

El dominio pertenece a cada una de las siete familias. Solo aumenta con impactos que hagan daño, no con clics, lanzamientos fallidos, conversaciones o esperar fuera del juego. A 30, 60 y 90 impactos obtiene rango 1, 2 y 3; cada rango añade 2 de daño base. Máximo 6 adicional, sujeto al límite existente del daño extra de espada. El dominio se guarda en el subestado de aventura; no altera salud, capacidad de mochila, cuidado de animales o cosechas. No se crean bonificaciones acumulables por coleccionar muchas armas.

Este primer balance sirve para comprobar comportamientos; no representa todavía balance de todos los jefes. Las futuras armas metálicas y regionales ofrecerán alternativas: espada corta frente a empuje, arco rápido frente a alcance, bastón estable frente a ráfaga, sello móvil frente a duración. Un material tardío no deberá aumentar simultáneamente todos los parámetros. Una espada común podrá terminar la historia con técnica y mejoras disponibles; ningún jefe exigirá una familia exclusiva.

## Recursos y encuentros siguientes

Los cuatro retornos de [Confluencia](09-regiones-y-recursos.md) darán ferrascua, hidrita, terralita y aeralita. Los ajustes se pagan y sustituyen uno por otro; no se suman. Al agotarse su mantenimiento opcional, el arma conserva su funcionamiento básico. Cobre, hierro, madera, fibra y cuarzo de Celia permanecen en las recetas avanzadas. Los jardines de Verdia no se transforman en arena de combate; sus fisuras externas ofrecen desafíos opcionales.

Diseño de jefes: el Regulador del Rescoldo anuncia apertura de ductos y tiene ventanas de ataque; el Guarda de Retorno alterna pasarelas y reserva segura; el Apuntalador protege galerías que pueden estabilizarse antes de golpearlo; el Centinela de Corrientes anuncia dirección de ráfaga con marca visual y sonido. Todos deben poder vencerse usando una familia principal o completarse por una ruta técnica equivalente de campaña. Sus variantes repetibles pagan botín de expedición con cupo, nunca repiten el premio único de misión. Los jefes aún no están programados.

## Contrato de guardado y revisión

El formato de granja sigue siendo V5. Campos de proyectiles, invocación y dominio son opcionales para aceptar partidas anteriores sin regenerar expediciones. Se validan identificadores, límites de daño, dirección unitaria, duración, máximo 24 proyectiles y máximo 90 de dominio. Salir cancela efectos, conserva inventario y dominio; recargar conserva el tiempo activo restante y no completa ataques de forma instantánea. Una importación corrupta se rechaza manteniendo la partida original.

La próxima integración debe unir territorios, cupos por jornadas dormidas, materiales y guiones de Fuatia a acciones comprobables. Los documentos publicados en la wiki no adelantan esos estados ni los confunden con una APK terminada.
