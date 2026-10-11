# Festivales del primer pueblo

Se integran cuatro celebraciones originales en el motor V3 y guardado V5. Usan la plaza y los 24 habitantes
existentes; la presentación actual son paneles sencillos. Arte, decoración y animación final corresponden al frente
visual. Estas actividades no completan los eventos comunitarios de los otros 18 núcleos planificados.

| Celebración | Fecha anual | Actividad | Recuerdo |
|---|---|---|---|
| Encuentro de las Semillas | Primavera 13 | Tres decisiones del cuidado del huerto | Semilla del encuentro |
| Ronda de la Fuente | Verano 11 | Memorizar y repetir Palma, Campana, Tambor | Compás de la fuente |
| Mesa de la Cosecha | Otoño 16 | Una cosecha real y dos preguntas del huerto | Recuerdo de la cosecha |
| Velada de los Recuerdos | Invierno 25 | Tres conocimientos de jornadas y cuidados | Luz del recuerdo |

Toca el reloj para consultar las fechas, invitaciones, actividades y recuerdos. Durante los tres días anteriores,
la primera noche guardada que entre en esa ventana entrega una invitación en el calendario. Si la función llega a
una partida ya avanzada, se puede asistir sin invitación previa. Cada año renueva la invitación y el premio.

## Acceso, reloj y habitantes

Inscripción de 10:00 inclusive a 16:00 exclusive, el día señalado, a menos de 2.8 metros del sur de la fuente
(84, 10), en un punto transitable del exterior del Pueblo del Sol. No se puede entrar desde una vivienda, negocio,
expedición, resumen de noche, montura o encuentro social. Seis habitantes distintos participan en cada celebración.
Sus rutas cambian desde las 08:30: llegan a la plaza a las 09:00, permanecen hasta las 18:00 y regresan hasta las
18:30. Sus locales cierran durante ese intervalo y explican la causa. Los demás conservan sus horarios habituales.

El calendario se pausa durante la actividad, incluido el caso de recargar y reabrir el panel. Los cuidados y la
producción en tiempo real continúan con sus reglas actuales. La sesión bloquea acciones económicas, viajes, regalos,
otros encuentros y dormir. Retirarse consume 30 minutos de jornada, cobrar consume 90, ambos desde la hora de entrada.
Se vuelve al mismo punto de la plaza. No cambia el día ni se simula crecimiento o descanso gratuito.

## Actividad, inventario y recompensa

Leer la presentación y comenzar son pasos separados. Cada respuesta exige el índice de la ronda actual y una opción
válida; botones viejos no aplican la misma respuesta dos veces. Responder mal avanza la ronda y reduce la puntuación.
La ronda musical oculta la secuencia al comenzar. Los tres festivales sin muestra puntúan de 0 a 3.

En otoño se elige una casilla real con un producto de `CULTIVOS`; semillas, herramientas y comida elaborada no son
muestras. Se reserva su ID y calidad exactos. La unidad permanece en la mochila hasta cobrar; retirarse conserva todo.
Su calidad suma de 1 (normal) a 4 (estelar), más dos posibles aciertos. Al cobrar se verifica de nuevo la casilla,
se consume una única unidad y se reconstruye el índice `inventario`. No hay generación de objetos ni traslado a otra
calidad. La reserva sigue vigente al recargar. Los objetos que también proceden de un cultivo, como fibra, son válidos.

La recompensa es `20 + 10 × puntos` monedas (20–50 en tres celebraciones; 30–80 en otoño), hasta 10 de amistad con
cada participante y un recuerdo propio. Conocer habitantes en el festival también actualiza `vecinos_conocidos`, sin
consumir límites de conversación o regalo. Un saldo que superaría 1 000 000 000 rechaza el cobro sin consumir muestra,
recompensa o recuerdo; se puede retirar y liberar saldo antes de volver si sigue abierto el horario de inscripción.

Se conserva una última edición por celebración, hasta cuatro recuerdos, y contadores agregados de participaciones.
La edición del año actual impide otro premio aunque se recargue o importe la misma partida. La siguiente edición
anual puede premiarse, reemplazando ese último recuerdo. No se promete protección frente a editar manualmente un JSON.

## API y persistencia

- `festivales-datos.ts`: catálogo, fechas absolutas, lugar, horario y posiciones de los participantes.
- `festivales.ts`: `crearFestivales`, `invitarFestivales`, `actuarFestival`, puntuación y validación.
- Acción del motor: `{tipo:'festival', accion, xJugador, zJugador}`. Subacciones: `entrar`, `comenzar`, `responder`,
  `muestra`, `retirarse` y `cobrar`; la identidad del festival acompaña cada una.
- `festivales-ui.ts`: calendario/invitación, selección de muestra, rondas y recuerdos; los cambios pasan por el motor.
- Guardado V5: campo `festivales` con versión 1, invitaciones, últimas ediciones y sesión actual. V5 anterior agrega
  únicamente el campo ausente; valores nulos o corruptos se rechazan. Se mantienen IDs y claves de almacenamiento.

Cada paso, retirada y cobro se guardan desde la misma vía transaccional de UI que encargos y escenas. Si falla
`localStorage`, se restaura el estado anterior y se permite reintentar. La importación valida fechas, IDs, unicidad,
horario, ubicación, sesión, muestra y resultados; no completa una sesión ni repara datos inválidos silenciosamente.

## Comprobación y límites

Validación de este bloque: 20 casos de festivales, regresión completa de 28 suites sin fallos, compilaciones de
pareja/amigos, ocho comprobaciones del navegador de festivales y seis del recorrido casa/granja, sin errores de
JavaScript ni recursos fallidos.

`probar-festivales.mjs` cubre acceso, invitación nocturna, edición anual, reloj/cuidado, inventario exacto, puntos,
recompensa única, rutinas, comercios, migración y rechazo de estados corruptos. Forma parte de `npm run probar:granja`.
`verificar-festivales.mjs` recorre los botones reales, recarga, un fallo de almacenamiento, cobro y muestra de otoño
sobre un build completo servido, con fechas y cosecha preparadas en un contexto aislado. `verificar-demo.mjs` conserva
el recorrido casa → granja → casa → granja; usa perfil ligero explícito y espera movimiento real, en vez de exigir
que el renderizador software complete el movimiento en 500 ms de reloj de pared.

Comandos desde `juego/web`: `npm run probar:granja`, `npm run build`, `npm run build:amigos`. Servir `dist/` con
`npm run preview -- --port 4182 --strictPort`; ejecutar los dos scripts `verificar-*.mjs` contra esa URL.
`CHROME_PATH` puede apuntar al Chromium instalado. Los informes JSON y capturas deben ir fuera del código o en
`test-results/`. Los fixtures comprueban reglas e integración; no certifican campaña desde cero ni rendimiento físico.

Siguen pendientes concursos regionales más amplios, decoración final, premios de catálogo y eventos de mundo con
cola/prioridad general. Los festivales actuales y sus actividades usan guardado local: no añaden multijugador.
