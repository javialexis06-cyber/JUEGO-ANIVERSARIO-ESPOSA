# Actividades, fauna y mecanismos de los territorios

Los 24 territorios conservan sus bancos, semillas, recursos y permisos. Las actividades recurrentes
conectan sus materiales con mantenimiento; no reemplazan la granja ni cambian los 178 residentes,
93 domicilios, genomas antiguos, calendario al dormir o cuidados de 48 horas reales.

## Trabajo que sigue siendo útil

Cada archivo ofrece un trabajo por ciclo de dos a cinco jornadas dormidas, según el territorio.
Reserva un mineral y una madera locales, conservando calidad. Hay seis actividades: cuentas de lotes,
retornos de canales, senderos con estaciones y colisiones, reparto de soportes, circuito térmico y
regulación de presión. Corregir mantiene la misma reserva; cancelar la devuelve íntegra. Cobrar requiere
completar sus operaciones y espacio para una pieza; mochila llena o guardado fallido restauran el estado.

Las piezas no tienen precio comercial ni daño. Las 24 recetas de kit ajustado consumen una pieza,
un mineral, dos maderas y una cosecha locales. El kit mantiene el coste de recolección en una energía
durante diez estancias, con una mejora activa, cupos originales y herramientas necesarias. Los kits
anteriores conservan sus ocho estancias. La inversión extra ofrece dos estancias; no aumenta extracción.

Después de observar la fauna, restituir pasos, sombra y bebederos consume cuatro maderas y dos minerales
locales y dos fibras. Revisar con una madera, tras el intervalo regional, elabora otra pieza de reparación.
Es trabajo del jugador: no caza, tributo animal, extracción de recuerdos o conversión de criaturas en energía.

## Colonias autorizadas y fauna silvestre

Solo cinco entornos aceptan atención y crianza: abejas de Jardines del Eco, geckos del módulo de Celia,
polinizadores del Huerto de Aurelia y compostadores de los dos Fragmentos. Requieren restauración y
los permisos de P12, P16 o P17. Los otros 19 bancos de fauna mantienen observación y conservación;
las salamandras, tortugas, armadillos y rayas elementales no se capturan ni se trasladan a la granja.

Las colonias se visitan por su puesto físico, con sala protegida `habitat_<region>`. El interior, el retorno,
las ocho plazas y sus identificadores persisten. En los Fragmentos se atienden dentro del módulo;
no se presenta fauna respirando al aire libre en una roca del espacio. Los indicadores provisionales
reutilizan el kit de salidas y la sala existente. Sus modelos finales corresponden al frente visual.

Cada colonia comienza con dos individuos. La edad aumenta al dormir; alimentar consume una ración de
heno y acompañar registra atención real. A las 48 horas sin cuidado se pausa la productividad;
la atención veterinaria completa cuesta 60 monedas. No hay muerte animal ni crecimiento offline.
La crianza exige adultos de tres noches, cuidado, cuatro henos, plaza y 24 horas reales entre inicios.
La pareja se elige en la interfaz, con probabilidades de sus cuatro loci ficticios. Genotipo y sexo se
determinan al reservar; tres noches con padres atendidos permiten el nacimiento. Guardar no vuelve
a sortear. Sus identificadores regionales permanecen separados de las especies y genomas anteriores.

Un aporte de mantenimiento se recoge manualmente cada tres jornadas con adultos atendidos, conservando
alimento para la colonia. Cinco recetas convierten el aporte y un mineral local en una pieza. No pagan
moneda, producen fuera del juego, amplían la mochila ni exigen trabajo de las almas de Verdia o Senda.

## Seis mecanismos de combate

El tercer piso de cada arena elemental tiene un jefe propio: Horno del Resentimiento, Bomba de los
Retornos Rotos, Ancla de la Raíz Cerrada y Turbina del Viento Cautivo. Sus patrones anticipados usan,
respectivamente, líneas de calor, anillo de agua, tres impactos de soporte y corredor de viento con empuje.
La dirección se fija al avisar; moverse permite esquivar. Se mantienen espada, arco, bastón y cuatro
invocaciones, sus costes, munición y dominio máximo de tres rangos.

La Cámara de los Núcleos de Confluencia permite desactivar el Circuito de Forma Fija como alternativa
de F12. El Borde de Astra permite intervenir en la proyección del conducto de Nath durante P23.
Ambos mecanismos alternan cuatro patrones según su integridad. Se conservan los pasos, guiones,
materiales y soluciones técnicas: las armas son una elección adicional. P24 continúa en la granja.
Fuatia no es un jefe; no se reduce su poder ni se mata a Nath mediante una barra de vida humana.

Los seis jefes usan cámaras limitadas y regreso seguro. La baliza permite reintentar sin duplicar el
botín de cada mecanismo. El aviso y sus objetivos persisten. No se aplica daño mientras el juego
está pausado ni al cargar. Las criaturas antiguas de práctica se migran a sus constructos equivalentes
sin cambiar vida, botín o dominio; no acreditan combatientes ajenos como piezas elementales.

## API y producción visual

- `estado.regional` es aditivo, versión 1: trabajos, reservas, refugios, colonias y genotipos.
- `MotorGranja.actuar({tipo:'regional', accion, xJugador, zJugador})` reserva, opera y atiende en el puesto.
- `astra.interior = habitat_<region>` conserva la sala y su salida al banco de fauna original.
- `monstruo.patron` tiene fase, tiempo activo, elemento, centro, dirección y tres objetivos como máximo.
- `medios.json` acepta `jefe:<tipo>`, `fauna:<recurso_fauna>` y `habitat:<region>`. Se reutilizan indicadores
  hasta producir modelos; su sustitución conserva selección, posición, avisos y hitboxes del motor.
- Clips opcionales de jefe: `reposo`, `anticipar`, `atacar`. La vida y el área de daño no dependen del clip.

`compilar_regiones.py` reproduce actividades desde el canon. Los contratos conservan 217 historias y
727 objetivos; F12.3 y P23.4 añaden alternativa de jefe con los mismos IDs. No cambia una línea grabada
ni se ejecuta generación de voces o música. La wiki publica instrucciones y spoilers por petición del usuario.

Las pruebas incluyen las seis cámaras con las siete familias de armas, cierre real de F12 y P23,
escrows, renovación, 24 trabajos, módulos, cuidado, genética y datos dañados. Los escenarios preparan
recursos y posiciones: no certifican economía desde cero, arte final ni rendimiento físico de teléfonos.
