# Bebederos del ganado productivo

13 de octubre de 2026. Componente del motor sobre V5 y sobre los cuencos que ya existen en los refugios de la granja. No se producen modelos, música ni voces.

## Regla y control físico

- Preparar un bebedero cuesta 60 monedas, ocho piedras y dos cobres. La transacción acepta materiales de cualquier calidad y conserva los demás objetos de la mochila. Empieza vacío.
- Con la regadera seleccionada, llenar entre una y 24 porciones cuesta dos de energía por operación. La reserva total admite 24; nunca se redondea ni se llena parcialmente ante una petición inválida. Las regaderas anteriores no tienen un depósito de agua en V5: se mantiene ese funcionamiento y se cobra energía.
- La interacción valida cercanía al cuenco del patio (`u=.7, v=7.3`, con el giro del edificio) o, dentro del refugio correcto, al cuenco (`x=.88, z=-.76`) o al comedero físico existente (`x=-.88, z=-.76`). El radio es 2.8 m. La puerta interior no permite llenar a distancia.
- Cada animal puede beber una porción por jornada, entre las 06:00 y las 18:00 del juego, al llegar caminando a su cuenco. Los recién hidratados esperan paseando en el corral mientras llega el siguiente; así no salen de frente contra quien vuelve por el paso estrecho. Tienen prioridad los que ya están dentro o en el corral.
- La lluvia y la enfermedad mantienen el regreso al refugio. Un portón cerrado no se abre solo: conserva la reserva y el animal espera el camino. La posición, el destino y el agua se guardan.
- El agua no alimenta, no cura y no sustituye cariño. Beber no paga monedas, productos, experiencia ni energía; no adelanta genética, edad, incubación ni calendario. La bebida puede consultarse como requisito de las nuevas gestaciones sin modificar la producción anterior.

## Estado y API

Campos opcionales, sin cambio de versión de guardado:

```ts
Edificio.aguaGanado?: { version: 1; reserva: number }; // entero de 0 a 24
Animal.bebidaDia?: number; // entero entre 0 y jornada.diasCompletados
```

El registro de bebida sigue al animal al trasladarlo o al retirar su refugio anterior. No hay listas de IDs que puedan perderse con ese edificio. Una partida anterior sin los campos sigue usando la alimentación y las rutinas originales; no calcula rutas de bebida.

`agua-ganado.ts` exporta:

- `actuarAguaGanado(s, accion): Resultado`, con `instalar_bebedero` o `rellenar_bebedero`; ambas llevan `edificioId`, `xJugador` y `zJugador`, y la segunda también `cantidad`.
- `aguaGanadoValida(valor, edificio)`: acepta ausencia y comprueba que el nuevo estado pertenezca a ganado productivo, versión uno y reserva entera acotada. Rechaza `null`, campos mal tipados y reserva inválida.
- `bebidaAnimalValida(valor, diaActual)`: acepta ausencia; rechaza día futuro, negativo, fraccionario o no finito aunque no haya bebedero.
- `animalBebio(s, animalId, dia = s.jornada.diasCompletados)`: consulta una bebida real en el día pedido. La primera noche de una gestación consulta el día cero antes de cambiar de jornada; las siguientes consultan el día que se acaba de cerrar.
- `textoAguaGanado(s, edificio)`: reserva y cantidad de habitantes hidratados para la interfaz.
- `beberGanado(s, edificio, animal)`: transición interna finita; exige jornada activa, lugar correcto y llegada física. Solo se llama desde las rutinas; la reconciliación de tiempo real no la llama.

El coordinador conecta las dos acciones en `motor.ts`, agrega ambos validadores a la importación V5 y muestra el control desde el comedero ya interactivo. Las operaciones se guardan con la reversión habitual ante cuota o fallo de almacenamiento. No quitar esas protecciones al integrar la presentación final.

## Navegación y presentación

`rutinas-ganado.ts` añade la actividad guardable `beber` en la misma rutina versión uno. Dura 1.5 segundos, usa el clip existente `comer` y muestra «Bebiendo». Los puntos para llegar son `.7, 7` en el patio y `2.44, 1.92` en el interior. Las divisiones interiores se cruzan por el pasillo central antes de aproximarse al cuenco.

`PastoreoGanado.paso(s,b,a,dt,exterior,destinoCorral?)` admite una meta temporal para volver a beber. Quien está en el terreno primero vuelve por el paso existente y luego se acerca al cuenco. El modo de pastoreo del refugio conserva su valor; después de beber se reanuda. La navegación de bebida comparte los **dos inicios y 64 pasos de búsqueda totales por cuadro** del pastoreo, con el mismo límite de 384 nodos por ruta y la caché acotada de 8192 celdas. No hay una búsqueda completa nueva por animal o por cuadro.

Solo la llegada y el consumo de una unidad notifican un cambio de revisión. Caminar o ejecutar el clip no reconstruye el mapa en cada fotograma. La cola y los caminos son datos de sesión; se reconstruyen al jugar, conservando las posiciones guardadas. No existe movimiento ni bebida durante la ausencia.

## Comprobación de este componente

```bash
cd juego/web
node scripts/granja-v3/probar-bebederos.mjs
node scripts/granja-v3/probar-rutinas-ganado.mjs
node scripts/granja-v3/probar-pastoreo.mjs
npx tsc --noEmit
```

La suite nueva comprueba 18 casos: costes y rollback lógico sin escritura parcial; capacidad finita; regadera y energía; los puntos físicos; bebida con pasos en cuatro giros; una vez por jornada; reserva agotada; siguiente día; genes, producción y cuidados sin bonus; recarga y 72 horas ausente; traslado y retirada del registro anterior; corrupción de los campos; lluvia; puerta y portón cerrados; retorno desde pastoreo; pausa; seis habitantes y pasillos; y 240 animales con reserva y navegación bajo el presupuesto compartido. Las suites anteriores de rutinas y pastoreo comprueban además la compatibilidad.

Estas pruebas de reglas preparan terreno, animales y suministros; no certifican controles visuales ni rendimiento físico de computadores o celulares. El coordinador hace el recorrido de navegador y las compilaciones del conjunto antes de publicar la rama del juego.
