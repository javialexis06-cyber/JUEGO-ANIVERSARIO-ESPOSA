# Lotes y donaciones del archivo

## Uso

Abre Colecciones en el menú para consultar los seis lotes. Para entregar, recuperar, cerrar o comprar
semillas, entra a la Casa de los Oficios del Pueblo del Sol durante su horario de atención. Las acciones
requieren estar en el interior existente y respetan descanso semanal, festivales y bloqueos de actividad.
La pestaña Atlas conserva el catálogo de vista previa; ver sus ejemplares no registra progreso conseguido.

Cada requisito enumera los artículos aceptados, su cantidad y la calidad mínima. Selecciona una casilla
de la mochila y una cantidad: solo se descuenta esa pila. Se admiten entregas parciales, alternativas
mezcladas y calidades superiores. No se entregan unidades de más ni se reemplazan calidades automáticamente.

Las entregas quedan **reservadas**, no donadas. Recuperar devuelve todo el lote abierto con cantidades
y calidades intactas. Si falta espacio para una parte, no devuelve ninguna. No hay plazo: noches,
temporadas, tiempo real y recargas conservan el avance. No hace falta aceptar un encargo ni consume sus
cinco espacios de actividad.

Cuando todos los requisitos están completos, el botón **Donar lote permanentemente y recibir premio**
convierte las reservas en donaciones y entrega el premio una sola vez. Desde entonces no se recuperan.
Si falla espacio, saldo, límite de desbloqueos o almacenamiento, el lote sigue abierto sin premio parcial.
El cuaderno reúne exclusivamente las donaciones de lotes cerrados, por artículo y calidad.

## Primera serie de seis lotes

| Lote | Entregas | Premio único | Reserva de semillas |
| --- | --- | --- | --- |
| Primavera | 3 fresas; 2 zanahorias/trigos/chirivías de plata o mejor | 80 monedas y 12 abonos | Fresa, zanahoria y chirivía |
| Verano | 3 maíces; 2 tomates/melones/rábanos de plata o mejor | 100 monedas y 1 aspersor básico | Maíz, melón y rábano |
| Otoño | 3 calabazas; 2 zanahorias/remolachas/berenjenas de plata o mejor | 120 monedas y 1 cofre de madera | Calabaza, remolacha y berenjena |
| Invierno | 3 melones de polvo; 1 melón de polvo/fresa de escarcha de plata o mejor | 140 monedas y 1 aspersor de cobre | Melón de polvo y fresa de escarcha |
| Aguas del valle | 2 carpas; 1 perca/trucha/sardina de lago de plata o mejor | 90 monedas y 8 cebos de pez | No aplica |
| Piedra y oficio | 5 minerales de cobre, 2 cuarzos y 1 lingote de cobre | 100 monedas y 1 horno | No aplica |

Cada línea acepta mezclas dentro de sus alternativas. El melón de polvo de calidad también sirve para la
primera línea del invierno, pero cada entrega consume sus propias unidades: no cuenta dos veces. La plata
de cultivos usa la calidad real de la cosecha; el abono aumenta sus probabilidades. El melón de polvo puede
cultivarse en terreno templado en invierno; el lote no exige desbloquear primero un cultivo especial.
La carpa/perca y el cobre/cuarzo/lingote ya tienen vías de obtención existentes.

El cierre agrícola abre una reserva permanente en el archivo. Puedes comprar de 1 a 99 semillas por acción,
durante cualquier estación, pagando el precio original de cada cultivo. No se altera la tienda normal,
ni los requisitos de clima, temporada, conocimiento o invernadero al sembrar. Los premios son objetos
funcionales existentes: se pueden colocar y usar con las reglas normales de producción y agricultura.

## API y guardado

- `colecciones-datos.ts`: catálogo propio de requisitos, premios y semillas, sin imports runtime.
- `colecciones.ts`: creación, progreso, reservas, devolución, cierre, compra y validación estricta.
- `colecciones-ui.ts`: panel de lectura y controles simples; todos pasan por `MotorGranja.actuar`.
- Acción general `coleccion`, con `entregar`, `retirar`, `completar` y `comprar_semilla`.
- Subestado `colecciones.version:1`: seis registros con `id`, `iniciadoDia`, `completadoDia` y
  `entregas[{objetivo,articulo,cantidad,calidad}]`. Se fusionan solo reservas idénticas del mismo requisito.
- Cada cierre persiste `coleccion_<id>` en desbloqueos. El validador exige correspondencia exacta entre
  cierre, requisitos completos, fechas y desbloqueo; rechaza registros duplicados, excesos, artículos o
  calidades incompatibles, futuros y formatos dañados. No repara ni inventa entregas.
- Partidas V5 anteriores sin este campo reciben lotes vacíos, sin cambios económicos. Campo presente
  corrupto se rechaza. La versión general V5 y las claves actuales siguen iguales.
- Las cuatro operaciones guardan inmediatamente; fallo de almacenamiento restaura el estado completo
  previo a la acción. La reserva de semillas se obtiene de los lotes cerrados, sin otra bandera paralela.

## Alcance de aceptación

I09 tiene una primera serie funcional: piezas concretas, categorías explícitas, calidad, avance persistido,
premio único y una nueva oferta útil en el archivo. Quedan pendientes lotes regionales, exhibiciones físicas,
artefactos y colecciones semánticas completas. Tres libros encontrados con lectura y efectos ya se integraron
en `LIBROS-INTEGRACION.md`. K06 continúa parcial: donado/reservado
se distinguen del atlas, pero faltan registros independientes completos de descubrimiento, captura,
crianza, fabricación y venta. Este bloque no certifica campaña completa ni rendimiento físico móvil.

Pruebas: `probar-colecciones.mjs` valida reglas y guardado, todas las recompensas, compra fuera de temporada,
siembra real posterior y funcionamiento agrícola del aspersor recibido. `verificar-colecciones.mjs` usa
controles reales del build en contexto aislado con materiales/servicios preparados, cuota fallida,
recargas, mochila llena y reserva de semillas. Se ejecutan también la regresión general, las dos builds
y el recorrido casa → granja → casa → granja.

Resultado local: 23 grupos nuevos, 31 suites de regresión y 17 comprobaciones de navegador, sin fallos.
Ambas compilaciones pasan; amigos revisa 503 archivos contra 45 palabras y 132 frases. El navegador
usa viewport horizontal 844 × 390 sin errores JavaScript, recursos fallidos ni desbordamiento.
