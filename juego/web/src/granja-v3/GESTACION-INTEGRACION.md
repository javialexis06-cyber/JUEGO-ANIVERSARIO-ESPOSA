# Gestación del ganado · 13 de octubre de 2026

La vaca, la cabra, la oveja, el cerdito y el conejo esperan una cría antes del nacimiento.
Las duraciones son reglas del juego: **4 jornadas** para la vaca, **3** para cabra, oveja
y cerdito, y **2** para conejo. No representan gestaciones reales. Gallinas, patos,
avestruces, dinosaurios, dragones y grifos conservan huevos fértiles e incubadoras.
El unicornio conserva su vía fantástica anterior.

El cruce sigue costando **4 henos** y requiere adultos de la misma especie, una hembra
y un macho sanos, alimentados y atendidos, y **24 horas reales de descanso** entre cruces.
Para estos cinco mamíferos, los padres deben compartir refugio y haber bebido en la
jornada actual; el jugador se acerca a la madre visible para iniciar. No se cobra de nuevo
al dormir ni se entregan monedas o experiencia al iniciar. La recompensa anterior de
nacimiento llega cuando nace la cría, una sola vez.

La gestación solo avanza al **dormir**. Necesita que la madre esté sana, alimentada y
atendida y haya bebido en la jornada que se cierra. Si falta algo, esa noche queda
pausada; conserva la cría, los genes y la plaza. No muere ningún animal ni se pierde
el embarazo por ausencia. Las horas reales mantienen el sistema anterior de cuidados,
sin convertirse en noches de gestación. Tiempo activo, viajes, recarga y ausencia no
adelantan la gestación.

## Reserva y parentesco

Antes de utilizar azar se revisan **todos** los genomas posibles del cuadro de Punnett.
Cada posibilidad necesita al menos una plaza en un clima compatible. Los genes y sexo
se sortean una sola vez al iniciar; el nombre y el refugio de la cría también quedan
fijados en ese momento. Un genoma climático puede reservar otro refugio que el de su
madre. La reserva permanece hasta el nacimiento, sin una segunda tirada al cargar.

La ocupación suma animales vivos, huevos en incubadora y gestaciones. Cada gestación
reserva una plaza adicional a la de su madre. Adopción, incubación y nuevos cruces deben
considerarla tanto para las **240 plazas globales** como para las **6, 8 o 12** de cada
refugio. No cuentan como reserva los huevos guardados en mochila o cofre.

Trasladar a la madre conserva el embarazo y el destino reservado de la cría. El traslado
requiere una plaza compatible para la madre en el nuevo refugio. Su reserva anterior
no se traslada ni se libera por esa acción. Mover o girar el edificio reservado conserva
su ID; retirarlo debe estar bloqueado aunque no tenga animales vivos. No cambiar el
genoma de ningún progenitor después del cruce.

## Contrato de integración

Fuente: `reproduccion-ganado.ts`. `Animal.gestacion?: GestacionGanado` añade un campo
opcional a V5. Su ausencia no crea ni simula embarazos anteriores. Un valor presente
corrupto se rechaza; no se repara sorteando genes nuevos.

- `usaGestacion(especie)` identifica los cinco mamíferos de esta vía.
- `plazasGestacion(s, edificioId?)` cuenta solo las reservas de gestación.
- `plazasGanado(s, edificioId?)` cuenta vivos, incubaciones y gestaciones.
- `planGestacion(s, madre, padre)` no usa azar ni modifica el estado. Devuelve los
  destinos para cada resultado posible o una razón de rechazo.
- `iniciarGestacion(s, madre, padre, genoma, sexo, plan)` devuelve un registro nuevo
  o `undefined`. Revalida el plan y la plaza; no cobra ni cambia fechas.
- `avanzarGestaciones(s, diaCerrado, now, nacer, puedeAvanzar)` se llama únicamente
  desde dormir. Devuelve `{avanzadas, pausadas, nacidas}`.
- `resumenGestacion(animal)` devuelve `{dias, total, pendientes, destino}` o `null`.
- `gestacionValida(valor, s, madre)` y `gestacionesValidas(s)` revisan parentesco,
  progreso, genomas heredables, destino y límites. La validación base de animales y
  ganadería precede estas comprobaciones.

La secuencia de inicio del motor es: validar proximidad y agua de ambos padres, comprobar
4 henos, obtener el plan, sortear genes y sexo, obtener el registro, cobrar y asignar
`madre.gestacion` y ambos `ultimoCruce`. **Preparar el registro antes de fijar las fechas**:
la función comprueba que el descanso anterior sigue cumplido. El estado guarda copias
de los genomas parentales y de la cría, sin referencias compartidas.

Si la jornada actual es `D`, el sueño llama:

```ts
avanzarGestaciones(s, D + 1, now,
 (madre, cria) => {
  this.nacimiento(madre.especie, cria.genoma, cria.sexo,
   cria.edificioId, cria.nombre, now);
  this.contar('gestaciones_completadas');
 },
 madre => animalBebio(s, madre.id, D));
```

Se hace después de aumentar la edad de los animales existentes y antes de cerrar la
jornada, para que los recién nacidos queden con edad cero. Cada embarazo registra
`ultimoDia = D + 1`, aunque esa noche no progrese. Repetir la revisión de la misma
noche no cambia nada. No admite saltos de calendario que pudieran simular ausencia.
Al nacer se elimina la gestación **antes** del callback; así se consume la reserva
antes de añadir el animal. El callback reutiliza nacimiento, genomas, cuidados y
experiencia del motor vigente. El sueño completo necesita el rollback habitual ante
un fallo de guardado; no guardar la fase intermedia antes de `cerrarJornada`.

Los genes deben proceder de un alelo de cada progenitor por locus. El padre puede
tener un cruce posterior mientras continúa un embarazo previo, pero sigue vivo y con
el mismo genoma. La madre no puede iniciar otro hasta terminar; cualquier embarazo
de un macho, especie ajena, clima incompatible, padre ausente, fecha adelantada,
progreso imposible o reserva sobreocupada se rechaza al cargar.

## Comprobaciones del módulo

`node scripts/granja-v3/probar-gestacion-ganado.mjs`: **22 comprobaciones, 0 fallos**.
Incluyen inicio puro, descanso, todos los climas, genes sin alias, plan obsoleto,
límites, partos simultáneos, noches exactas, cuidado/agua insuficientes, ausencia,
recarga, traslado, padre con otro cruce y entradas corruptas. `npx tsc --noEmit -p .`
también pasa. Son estados preparados del módulo, no un recorrido completo desde una
partida nueva ni una medición física de rendimiento. El coordinador verifica por
separado la integración, los controles, el guardado, las regresiones y los instaladores.

No se producen gráficos, voces ni música. La interfaz utiliza los refugios, animales,
retratos y modelos existentes. El frente visual puede añadir una señal discreta de
gestación leyendo `resumenGestacion`, sin cambiar sus reglas ni fabricar otra cría.
