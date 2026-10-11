# Carpintería, encargos y ampliaciones

Integración del 9 de octubre de 2026 en **granja-v3**, conservando el guardado V5, la casa y los minijuegos del proyecto de Claude. No se crea otro motor ni un paquete final.

## Recorrido disponible

1. Visitar la carpintería y abrir Construir. Cabañas, refugios productivos, establos e invernaderos se encargan con **monedas y materiales**. Las decoraciones, caminos, vallas y hogares de mascotas conservan fabricación/compra y colocación inmediata.
2. El contrato pagado permanece en el guardado; todavía no ofrece refugio, cupo ni interior. Regresar caminando al exterior de la granja, elegir el contrato y señalar el terreno con mouse o toque, cuadrícula y giro.
3. Reservar edificio, corral y acceso sobre sectores comprados, sin cultivos, agua, huecos, obstáculos, edificios o máquinas. No se permite encerrar al personaje o sus compañeros en la huella. La obra reserva el acceso para futuras colocaciones y permite caminar delante de él.
4. Una sola cuadrilla atiende hasta ocho encargos por orden de emplazamiento. Un contrato sin terreno no bloquea trabajos emplazados. Edificio nuevo: **3 noches**; ampliación productiva: **2 noches**. Dormir avanza una noche de trabajo de la primera obra; los demás esperan. La espera total aparece en cada tarjeta.
5. La entrega crea un único edificio con interior y corral funcionales; un invernadero recibe su recinto de 36 bancales. El resumen nocturno anuncia la finalización. Las horas reales, cerrar el juego, recargar, caminar o alcanzar las 02:00 no avanzan obras.

Andamios, tablas, caja de materiales, delimitación, señal y cuadrilla son geometría original sin imágenes/GLB adicionales. El martillo se anima visualmente de 08:00 a 18:00 en la obra activa; el operario se oculta fuera de ese horario y en trabajos en espera. Esa animación no modifica el plazo.

## Ampliaciones productivas

Cada refugio de especie admite nivel 1/2/3 y **6/8/12 plazas**. El clima y la especie se conservan, incluidas variantes fantásticas. La mejora mantiene el ID, coordenadas, giro, animales/genomas/cuidados/productos, incubadora y su huevo, pasto, puerta y heno con sus calidades. Durante la ampliación se mantiene el refugio existente y su capacidad anterior; las plazas nuevas solo aparecen al terminar. Las camas, nidos, espera de corral y trufas de los habitantes adicionales permanecen dentro del recinto. El interior y la fachada reflejan la mejora.

Costes propios centralizados en `costeObra`: nivel inicial utiliza precio y receta del catálogo; nivel 2 cuesta el doble del precio base, 40 madera, 20 piedra y 4 cobre; nivel 3 cuesta cuatro veces el precio base, 70 madera, 35 piedra y 6 hierro. Hábitats especiales añaden 4/8 cristales. Son valores de desarrollo, pendientes de balance de campaña.

No se mueve/gira/guarda un refugio mientras tenga ampliación pendiente. Al terminar puede moverse/girarse con todo su contenido y nivel. Guardar un refugio ampliado en un plano sin nivel se rechaza para evitar pérdida de mejoras; permanece movible. Caballos, hogares de mascotas, casa e invernadero no tienen ampliaciones en esta fase.

## Pago, cancelación y guardado

El pago reserva pilas concretas, incluidas calidades. Se puede cancelar cualquier encargo pendiente desde la carpintería o desde el exterior de la granja: devuelve **todas** sus monedas y materiales. Si la mochila no admite el reembolso o se excede el saldo máximo, se rechaza la acción completa; el contrato y las reservas se conservan. Un encargo terminado ya no puede cancelarse.

`EstadoGranja.obras = {version:1, encargos: EncargoObra[]}`. Cada contrato guarda ID, tipo nueva/mejora, artículo, edificio de destino o null, nivel, jornada de encargo/emplazamiento, lugar o null, noches trabajadas, monedas y materiales pagados. `Edificio.nivel` es opcional: ausente significa nivel 1. `ResumenJornada.obras` es un informe opcional de entregas, no una cola ejecutable.

Un V5 anterior sin `obras` recibe una cola vacía; no cambia sus edificios, días, inventario o habitantes. Un campo presente corrupto no se sustituye silenciosamente. Se comprueban costes, materiales, calidades, IDs, calendario, nivel de destino, vínculo y reserva del terreno antes de aceptar una importación. Si guardar la noche falla, se revierte día, obra, entrega, saldo y mundo visible; puede volver a dormirse sin duplicar el edificio.

Los planos `creacion_*` ya presentes y la API anterior `comprar/craftear/construir` siguen siendo compatibles y permiten recolocar edificios guardados. La interfaz nueva usa encargos para adquirir edificios grandes. No hay conversión retroactiva de planos en obras ni de construcciones existentes en ruinas. La restauración anterior del invernadero sigue siendo inmediata; todavía no está incorporada a la cola.

## API para Claude

```ts
motor.actuar({tipo:'encargar_obra', articulo:'refugio_gallina_templado'});
// En la carpintería. Guardar y regresar a la granja por los senderos existentes.
motor.actuar({tipo:'emplazar_obra', id:contrato.id, x:14, z:-4, giro:0});
motor.actuar({tipo:'ampliar_refugio', edificioId:'corral_inicial'});
motor.actuar({tipo:'cancelar_obra', id:contrato.id});
motor.previsualizarConstruccion(articulo, x, z, giro, edificioIdIgnorado);
```

`capacidadRefugio` y `nivelEdificio` son la fuente de cupos/niveles; no utilizar directamente el cupo base del catálogo para adopción, cría o incubación. `obraActiva`, `plazoObra`, `celdaReservadaObra`, `renderTaller` y `obraVista` exponen cola, reservas, interfaz y arte. La reserva también participa en la colisión del personaje y compañeros y en las colocaciones de máquinas/cultivos.

## Verificación y límites

- `probar-construccion.mjs`: **30 casos** de adquisición, permisos, ocupación, cola, sueño, entrega única, calidades, reembolso/rollback, límites, recarga, mejoras, cupos, rutinas, nidos y trufas de manadas ampliadas.
- `probar-arte-construccion.mjs`: **43 casos** de geometría, giros, fases, actividad y señal de ampliación; máximo medido **1.632 triángulos y 20 objetos de dibujo por obra**. Las partes estáticas se agrupan por material; no se añaden texturas ni archivos de arte.
- `work/qa-carpinteria.cjs`: **12 recorridos de navegador** con acciones reales de interfaz, mouse, recarga, noches, fallo de almacenamiento, entrada, ampliación, cancelación e interfaz de 412 × 915. Capturas en `work/qa-motor/renders/carpinteria-*.png`, informe `work/qa-motor/carpinteria-navegador.json`.

Los escenarios de prueba preparan recursos y terreno para aislar sistemas. No certifican el balance completo, toda la campaña ni rendimiento en S21 FE/S24 Ultra físicos. La regresión conjunta incluye 465 comprobaciones en 21 suites y 35 recorridos de navegador (12 de obras, 13 de compañía, 10 de ganado). La cobertura conjunta y compilación están registradas en `work/qa-motor/carpinteria-integracion.json` y `carpinteria-build.log`.

Pendiente en construcción: mejoras de casa coordinadas con Claude, ampliaciones de invernadero/establo, silo, equipamiento y más familias de edificios, terrenos interiores ampliables, restauración con encargos, obras comunitarias, horarios de carpintería/NPC, festivales y balance. **K03 permanece parcial**: el ciclo de encargos y las ampliaciones productivas están integrados, la paridad de construcción completa sigue abierta.

Referencia para contrastar el ciclo de servicios, obras y mejoras: [Carpintería de Stardew Valley](https://es.stardewvalleywiki.com/Carpinter%C3%ADa). Código, arte, costes, tiempos y reglas anteriores pertenecen a este proyecto.


La atención del Taller del Roble ahora respeta 09:00–17:00 y descansa los miércoles de la semana de la partida. Consultar [PUEBLO-INTEGRACION.md](./PUEBLO-INTEGRACION.md). Los contratos conservan sus plazos por noches; los días libres solo afectan la atención del mostrador.
