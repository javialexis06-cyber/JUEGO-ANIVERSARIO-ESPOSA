# Ganadería: contrato del motor V3

Estado integrado: 9 de octubre de 2026. Se amplía `granja-v3.html`, con estado versión 5 y nuevo campo `ganaderia.version = 1`. No se creó otro motor. Esta fase conecta animales, objetos, refugios, mouse, genética, inventario, sueño, misiones y guardado. No cierra toda la ganadería ni la equivalencia funcional con los juegos de referencia.

## Especies y obtención

El catálogo tiene doce especies productivas: vaca, cerdito, gallina, conejo, oveja, cabra, pato, avestruz, dinosaurio, unicornio, dragón y grifo. Cabras, patos, avestruces y dinosaurios tienen cuatro variantes naturales cada uno, modelos propios y cuatro clips de animación. El atlas muestra 36 variedades naturales y los trece linajes fantásticos ya aprobados. La genética es un modelo mendeliano de juego con cuatro loci independientes; no pretende describir la genética real de las razas.

| Especie nueva | Descubrimiento | Llegada | Madurez después de llegar | Producto |
|---|---|---|---|---|
| Cabra | Misión `huerta` | Cría comprada en tienda | 3 noches | Leche de cabra con cubo |
| Pato | Misión `confianza` | Cría comprada o huevo fértil | 2 noches | Huevos; 1 pluma al recoger un lote de al menos 2 |
| Avestruz | Mina abierta y Agricultura reconocida 3 | Huevo fértil e incubadora grande | 4 noches | Huevo de avestruz |
| Dinosaurio | Mina abierta y Minería reconocida 4 | Huevo fértil | 5 noches | Huevo ancestral |

Los descubrimientos de cabra/pato se derivan también de las misiones completadas, para partidas que ya las terminaron antes de añadir esas especies. El catálogo de carpintería y la tienda usan el mismo predicado que el motor. Las variedades naturales mantienen los requisitos `hogar`, `huerta` y `confianza`. Los fundadores mágicos siguen las misiones existentes. La interfaz compra animales jóvenes; la opción histórica de API `adoptar` sin `cria:true` conserva la adopción adulta usada por integraciones anteriores.

## Productos, herramientas y proximidad

- `ordenar`: cubo de ordeño seleccionado en una casilla real de la barra; vaca/cabra adultas y saludables; 1 energía por acción.
- `esquilar`: tijeras seleccionadas; oveja adulta y saludable; 1 energía.
- `recoger`: huevos en el interior del refugio y productos de las otras especies. El cliente normal envía posición. La API antigua sin coordenadas sigue admitida para recogida genérica; no permite reemplazar ordeño/esquila/trufas.
- `buscar_trufas`: cerdo adulto sano en su corral exterior, con pasto disponible, horario 06:00–18:00, tiempo seco y fuera del invierno. Consume su reserva de productos y deja un hallazgo, sin otorgar XP todavía.
- `recoger_trufa`: recoge el hallazgo con su cantidad y calidad exactas y concede XP una vez. Se coloca junto al cerdo para que el modelo no tape la selección.

Las acciones de producto con coordenadas exigen estar en la granja, en el mismo interior si corresponde y a un máximo de 2.8 metros. Clic izquierdo usa la herramienta o recoge; manos libres/heno permiten cariño o alimentación. Clic derecho abre información. La animación del personaje ejecuta el cambio al impacto; la acción fallida no consume energía, productos, inventario ni XP. Las herramientas se compran en la tienda de animales o se fabrican con sus recetas; se pueden mover libremente en la mochila y la barra.

Las hembras de vaca/cabra y las aves naturales producen leche/huevos; los machos participan en la crianza. La migración permite retirar una vez el stock que un macho tenía en un guardado anterior. No genera stock nuevo en esos machos. Ovejas, conejos y criaturas con otros productos mantienen sus reglas anteriores.

El producto listo conserva el reloj real anterior, por períodos de especie y hasta cinco unidades almacenadas. Los bonos de profesión y calidad siguen activos; la XP cuenta las unidades base, sin multiplicarse por el bono. La cabra/pato/avestruz/dinosaurio alimentan cuatro recetas artesanales nuevas: queso de cabra y tres mayonesas, compatibles con las estaciones y redes existentes. Hay 101 recetas y 413 objetos registrados; los huevos genéticos se resuelven dinámicamente y no inflan esa cifra.

## Huevos fértiles e incubación

Un cruce de animales ovíparos entrega un huevo fértil a la mochila. No aparece una cría instantánea, ni se completa una misión de nacimiento. Los mamíferos mantienen el nacimiento directo anterior. Adultos sanos, alimentados y acompañados, 4 henos y 24 horas reales de descanso parental son requisitos del cruce.

La identidad `huevo_fertil_<especie>_<cuatro genotipos><sexo>` almacena los cuatro loci, con valores 0/1/2 para dominante/heterocigoto/recesivo, y sexo 0/1. Sus genes y sexo se deciden una vez al criar o comprar; moverlo, apilarlo, enviarlo, meterlo en un cofre, cancelar una incubación o recargar no vuelve a sortearlos. Los huevos alimenticios comunes no son incubables. Antes del azar se verifica espacio para todos los posibles resultados del cruce y ambos sexos, descontando el heno que se pagaría. Un error no vuelve a tirar genes.

| Especie | Noches de incubación | Incubadora grande |
|---|---:|---|
| Gallina | 2 | No |
| Pato | 3 | No |
| Avestruz | 5 | Sí |
| Dinosaurio | 4 | No |
| Dragón | 5 | Sí |
| Grifo | 4 | Sí |

El gallinero inicial incluye una incubadora básica. Partidas anteriores con ese gallinero reciben la instalación al migrar el campo ausente. Otros refugios requieren instalarla dentro: 120 monedas, 15 maderas, 4 cobres y 2 vidrios. Ampliarla cuesta 260 monedas, 20 maderas, 4 lingotes de hierro y 4 vidrios.

Cada refugio tiene una incubadora y seis plazas. Incubar reserva una plaza y cuenta para el límite de 240 animales; también comprueba especie, tamaño y clima del genotipo. Una reserva impide comprar o trasladar un animal que sobreocupe el hogar. Incubación y edad aumentan únicamente al dormir. El avance de hora activa o la ausencia real no adelantan ninguna de las dos. El recién nacido tiene edad cero en su noche de eclosión; en la siguiente noche aumenta a uno.

Retirar devuelve el mismo objeto y calidad; reinicia las noches al volver a incubar. Mochila llena conserva huevo, progreso y reserva. Nacimientos, XP y contadores `nacimiento_<linaje>` se anotan solo al eclosionar. La prueba de navegador simula una cuota fallida justo en la noche de nacimiento: revierte cría, incubadora, XP y calendario; el reintento guarda una sola cría. Las trece misiones de linajes fueron recorridas con incubación cuando corresponde; comprar/adoptar no sustituye el nacimiento exigido.

## Refugios, traslado y persistencia

`trasladar_animal` requiere un refugio distinto de la misma especie, clima compatible y plaza libre, incluida la reserva. Conserva ID, nombre, sexo, genoma, edad, salud y productos. Si dejó trufas pendientes hay que recogerlas antes de cambiarlo a otro refugio. Mover o girar el edificio conserva incubadora y reservas por su ID; las trufas usan coordenadas locales del corral y se trasladan con él. Un refugio con animales o instalación no se puede guardar como plano.

El importador añade el campo de ganadería solo cuando falta. Si está presente y es corrupto, lo rechaza sin sustituirlo. Valida IDs, especies, huevos decodificables, calidad, cantidades, fechas, progreso, tamaño, clima, capacidad y referencias de trufas. Las reglas previas de 24/48 horas de cuidado real, veterinario, pasto finito y mayordomo avanzado permanecen. No existe muerte animal.

## Archivos y verificación

- `ganaderia.ts`: identidad de huevos, capacidades, coordenadas y validación.
- `motor.ts` / `estado.ts`: acciones transaccionales, progreso nocturno, migración y misiones.
- `ganaderia-render.ts`, `vista.ts`, `avatar.ts`, `arte.ts`: modelos, animaciones, incubadora, nidos, selección por mouse y herramientas en mano.
- `ganaderia-ui.ts`, `main.ts`, `inventario-ui.ts`: tienda, refugio, días restantes, panel y barra.
- `genetica.ts`, `catalogo.ts`, `objetos.ts`, `inventario.ts`: variantes y objetos compartidos.
- `scripts/granja-v3/probar-ganaderia.mjs`: 31 casos, incluidos hambre/adultez/capacidad, identidad genética, almacenamiento, mochila llena, sueño, traslado, migración y conservación de productos antiguos.
- Desde la raíz del trabajo: `work/qa-ganaderia.cjs`, `work/qa-motor/ganaderia-navegador.json` y capturas `ganaderia-*.png`. Nueve recorridos de navegador, con escenario preparado declarado en el informe.

Los modelos en detalle alto tienen aproximadamente 9,380–13,120 triángulos y 11–17 llamadas de dibujo; el modo ligero reduce segmentos. No añaden descargas de texturas o modelos externos. Esto mide complejidad geométrica, no FPS ni memoria del juego completo en teléfonos físicos. La revisión de interfaz usa 412 × 915; falta medir S21 FE y S24 Ultra.

## Rutinas, puerta y comedero: segunda fase del 9 de octubre

El mismo motor V3 añade rutinas para las doce especies. `motor.pasoGanado(dt)` mueve sus posiciones locales únicamente en fotogramas activos de la granja. Menús, atlas, resumen nocturno, servicios, otras regiones y expediciones detienen este paso; `actualizar(fecha)` nunca lo invoca. No hay movimiento simulado por ausencia, ni crecimiento, incubación o productos nuevos por caminar.

Con sol o brisa salen de 06:00 a 17:00. Lluvia, tormenta, nieve y el invierno templado los mantienen dentro; los microclimas polares/volcánicos usan su meteorología propia. A partir de las 17:00 regresan, y desde las 18:00 descansan en sus plazas. La hora después de medianoche se trata como noche. Los enfermos buscan refugio. El tránsito interior pasa por el pasillo central y la puerta, en lugar de atravesar las divisiones de los establos. En el corral pasean y alternan con la animación de pastoreo mientras queda pasto.

La puerta admite abrir/cerrar por mouse, toque o botones. Cerrarla impide salir; quien ya está afuera sigue en el corral y espera al querer volver. Las seis plazas de espera son distintas. No se puede cerrar mientras un animal atraviesa el umbral. No hay ataque nocturno ni muerte animal. Al dormir, el cierre de jornada inicia a todos dentro del refugio para la mañana; no adelanta el cuidado real. La navegación libre fuera de estos recintos y las colisiones avanzadas entre animales siguen pendientes.

Los nidos tienen posiciones propias, independientes de sus aves. Recoger huevos exige entrar y acercarse al nido, incluso cuando las gallinas pastorean afuera. El ordeño y la esquila usan la posición real del animal; no se puede atender desde dentro a uno que está afuera. La interacción por mouse pausa brevemente su paseo para completar el gesto de cuidado. La vista cambia entre caminar, comer y reposo sin reconstruir el mundo en cada fotograma.

El comedero admite 64 henos. Depositar consume cantidades exactas de mochila; retirar conserva las calidades originales. El pasto sigue siendo el primer suministro de la regla existente de una ración por animal cada ocho horas reales; cuando se termina usa la reserva de heno. Las animaciones de pastoreo no descuentan comida adicional ni crean otro reloj de producción. Reserva, pasto, puerta, animales, nidos e incubadora siguen al edificio al moverlo/girarlo. No se puede guardar como plano un refugio con heno pendiente. Mochila llena revierte la retirada completa.

Campos opcionales compatibles con partidas V5 anteriores: `Animal.rutina`, `Edificio.puertaGanado` (omitido = abierta), `henoReserva` (omitido = cero) y `henoCalidades` (cuatro cantidades cuya suma coincide con la reserva). Una rutina ausente se inicia al jugar; una rutina presente corrupta se rechaza al cargar. Coordenadas y destinos son locales al refugio; no se almacenan posiciones globales duplicadas. Guardar/recargar conserva destino y posición. Trasladar un animal a otro edificio reinicia su ruta dentro del nuevo refugio y conserva genes, salud, edad y productos.

Acciones para la integración:

- `{tipo:'puerta_ganado', edificioId, xJugador, zJugador}`.
- `{tipo:'abastecer_refugio', edificioId, cantidad, xJugador, zJugador}`.
- `{tipo:'retirar_heno', edificioId, cantidad, xJugador, zJugador}`.
- `motor.pausarAnimal(animalId)` antes del gesto de interacción.
- `posicionAnimal(estado, animal)` y `posicionNido(estado, animal)` para usar las mismas coordenadas que el motor.

La tarjeta del refugio muestra ocupación, actividad, puerta y reservas. Su cierre permanece respetado durante la visita, también en móvil; tocar el comedero la vuelve a abrir.

Verificación: `probar-rutinas-ganado.mjs` añade 33 casos; las 17 suites del motor suman **312 comprobaciones sin fallos**. `work/qa-rutinas.cjs` comprueba diez recorridos con teclado, mouse, recarga y viewport táctil 412 × 915. Informes en `work/qa-motor/rutinas-{integracion,regresion,navegador}.json`, logs en `work/qa-motor/rutinas/` y capturas `rutinas-*.png`. El escenario de navegador elimina obstáculos para aislar interacciones y adelanta rutinas mediante el API de prueba; no demuestra balance de una campaña ni rendimiento físico en S21 FE/S24 Ultra. Build TypeScript/Vite correcto; permanece el aviso previo de importación mixta de `coreografias.ts`, ajeno a la granja.

## Pendiente después de esta fase

La fase de caballo montable y mascotas se integró después de este registro: véase [COMPANIA-INTEGRACION.md](./COMPANIA-INTEGRACION.md). Sigue pendiente ampliar sus efectos y variedad. Navegación libre y colisiones avanzadas, portones de vallas colocadas por el jugador y acciones de beber; gestación de mamíferos; calendario más amplio de productos, tamaño y calidad; equilibrio comercial a largo plazo; automatización especializada de refugios; encargos y efectos de compañía. La extensión narrativa y nuevas criaturas fantásticas seguirán el lore aprobado. Construcciones con plazos, comunidad/NPC, pesca avanzada y contenido regional siguen en el plan general.

Referencias consultadas para contrastar mecanismos: [Animals](https://stardewvalleywiki.com/Animals), [Incubator](https://stardewvalleywiki.com/Incubator) y [Ostrich Incubator](https://stardewvalleywiki.com/Ostrich_Incubator). Las duraciones, costes, genética y cuidado descritos aquí son reglas de este proyecto.


La fase de compañía conserva el ganado productivo y sus 33 pruebas de rutinas. Gatos, perros, tortugas y caballos tienen estado, adquisición, alimento, cuidados y movimiento propios, con 16 apariencias iniciales. El establo comparte la regla de pasto finito de ocho horas reales; caminar o la animación de pastoreo no generan productos ni crecimiento.
