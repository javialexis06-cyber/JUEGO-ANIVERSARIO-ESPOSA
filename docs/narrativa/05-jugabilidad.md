# Historia convertida en juego

## Qué tiene cada misión

Una misión personal es un arco de tres actos, no tres premios repetibles. Tiene oferta, investigación o prueba, decisión entre dos soluciones válidas, cierre y dos respuestas completas. Los 142 arcos no son encargos diarios. Las tareas renovables del tablón siguen siendo otro sistema y conservan sus IDs.

Contrato propuesto: `no_descubierta → disponible → aceptada → acto_1 → acto_2 → decision → acto_3 → cerrada`. Pausar conserva pruebas confirmadas. Cancelar devuelve reservas no consumidas y mantiene descubrimientos; retomar no concede de nuevo lo entregado. Una transición y su premio se guardan en una sola transacción. Cada edición narrativa usa un ID estable y un recibo, no solo el texto de un botón.

Todas las ramas personales tienen final válido. La elección se hace después del descubrimiento y antes del acto final. Cambia el método, el documento o la disposición, no exige rehacer los dos primeros actos. Si una variante pide más material, se reduce otra partida del presupuesto para mantener costo equivalente; se muestra el presupuesto completo antes de confirmar. Si todavía no está disponible su capacidad mecánica, esa misión sigue siendo diseño: no se concede por leer el guion.

Los consentimientos de autor, visitante y destinatario son diferentes. Ninguna prueba puede acreditar permiso por amistad máxima. “Esperar”, “no quiero hablar” y “no quiero recibir esa carta” tienen cierre escrito o aplazamiento sin castigo. No se consigue una recompensa más fuerte violando privacidad.

## Pruebas y fallos

| Actividad | Prueba aceptada | Fallo y recuperación |
|---|---|---|
| Agricultura | Parcela y cultivo existentes, siembra posterior a aceptación cuando el ensayo lo exige, agua y jornadas válidas. | Si se pierde cultivo, repetir lote pequeño; conservar entrevista y medidas anteriores. Sin fertilizante ficticio de misión. |
| Cuidado | Estado observado, refugio y ración existentes; procedencia de producto. | No empeorar bienestar para activar diálogo. La pausa no altera reloj real; atender necesidad ordinaria primero. |
| Fabricación | Receta del catálogo, reserva de insumos, operación completada y objeto resultante. | Si no cabe el resultado, mantener salida reservada; no cobrar otra vez ni cerrar como si se hubiera entregado. |
| Investigación | Hallazgo identificado, fuente y permiso; dos pruebas distintas cuando se contrastan versiones. | Un duplicado de la misma fuente no es segunda prueba. Consultar versión accesible o volver a buscar. |
| Conversación | Escena alcanzada, interlocutor presente o medio autorizado y decisión confirmada. | Horario visible y próxima visita; ninguna urgencia depende de la hora real. Se puede rechazar intimidad y seguir campaña. |
| Pesca | Captura legítima con hora, zona y resultado; devolución registrada por acción. | Una captura incorrecta no desbloquea premio. No obligar a vender primero para demostrar devolución. |
| Viaje | Permiso, equipo, consumo, ancla y ubicación real. | Sin reserva no hay salida; si falla durante ruta, contingencia de retorno, sin inventar combustible o teletransportar ganado. |
| Sangre y Ceniza | Hito real de la Noche, rescates y victorias del sistema actual. | Reintentar expedición. No cambia el vínculo de la pareja ni requiere vencer un reto opcional para escuchar el argumento. |

Las cantidades definitivas de ensayos se calibran contra los catálogos actuales. Propuesta inicial: pruebas de agricultura de 2–4 unidades, artesanía de una pieza, comida de 2–6 porciones. Nunca cantidades de material mítico para una entrevista. Las misiones grandes consumen materiales explícitos; las conversaciones y documentos prestados se devuelven o conservan por acuerdo. Las listas de materiales pendientes no se fingen IDs implementados.

## Premios útiles sin inflación de poder

Cada misión tiene un premio funcional de una de seis familias y una insignia de diario vinculada a su título. **La insignia no ocupa inventario, no se vende y no se duplica al releer.** Los secretos dan la misma utilidad en la rama respetuosa de privacidad. Completar todo es atractivo por variedad de uso, visitas, escenas y colecciones; no por sumar 142 porcentajes de ataque.

| Familia | Utilidad propuesta | Límite |
|---|---|---|
| `conocimiento` | Página interactiva sobre el ensayo, con comparación de registros y advertencias específicas; reutilizable fuera de misión. | No revela datos no descubiertos ni concede materiales al leer. No diagnostica por sí sola ni da poder divino. |
| `agenda` | Plantilla de planificación del oficio: turnos, consumo, pronóstico o revisión según el arco. Permite guardar un plan y ver recordatorios dentro de la partida. | Máximo tres planes fijados simultáneamente; horarios y advertencias esenciales nunca se ocultan tras premio. No notificaciones reales obligatorias. |
| `plano` | Variante reparable o contextual de una receta/hogar ya autorizado. La ficha cambia modo de uso o aspecto simple. | Mismos insumos y rendimiento total. No convierte pieza decorativa en equipo de combate superior; los planes espaciales exigen entorno propio. |
| `acceso` | Visita, consulta, recorrido o servicio adicional con consentimiento y criterios de seguridad. | No vende permiso de Nox, no suplanta equipo requerido, no abre casa privada solo por amistad. |
| `tecnica` | Variante de proceso más cómoda o una calibración reutilizable. Se elige un método por estación de trabajo. | Ahorro de tiempo de operación propuesto hasta 20% respecto a receta base, nunca acumulable; mismos insumos/salidas. No afecta crecimiento, descanso, rareza o cuidados reales. |
| `trofeo` | Recuerdo exhibible en estante de hitos; contiene escena releíble y selección de un motivo musical instrumental para la visita, si existe audio producido. | No da monedas, estadísticas o bendiciones. La música tiene alternativa escrita y no constituye ventaja jugable. |

Los premios `conocimiento` y `agenda` deben llegar a interfaz útil: comparar surcos, leer registros de entradas/salidas, anticipar revisión o preparar viaje. Una descripción literaria sola no cumple su implementación. La acción final de cada misión identifica el tema de su ficha; [recompensas.json](datos/recompensas.json) da ID, origen, familia, alcance y política para integrarla sin ambigüedad.

**Compatibilidad con K07:** las recetas rápidas de cobre y vidrio ya enseñadas por cuadernos no se vuelven a vender como recompensa nueva. Una misión de Bruno o Gaspar puede reconocer ese conocimiento y añadir un control de calibración; no concede otra reducción sobre el 20% existente. Un jugador que recuperó un libro antes de aceptar conserva su hallazgo; solo se exige trabajo nuevo cuando el guion define un ensayo nuevo.

**Presupuesto total:** cero multiplicadores permanentes globales de daño, monedas, calidad o genética; cero intereses de venta; cero consumibles renovables por lectura. Se habilitan opciones y una colección, no poder exponencial. Reciclar devuelve menos material/valor que fabricar; regalar y revender un plano no crea bucle porque no es un objeto negociable. Si falta capacidad de inventario, el cierre se conserva pendiente y nunca pierde el premio.

## Progresión y convivencia

La campaña desbloquea regiones por conocimiento, seguridad y acuerdo, no por comprar amor a todo un pueblo. Cada región ofrece arcos personales cuando puede visitarse. Los 24 NPC actuales pueden recibir versiones tempranas de su arco; los otros 118 necesitan hogar, horario, escena y acciones reales antes de integrarse. No se llenan tiendas vacías para cumplir una cifra.

Una escena personal breve puede surgir después de una jornada de trabajo; no interrumpe combate o un temporizador. Las visitas repetidas ofrecen conversación sobre cambios cumplidos: Inés permite revisar el fondo; Rosa habla de un menú nuevo; Tecla acepta una excepción. No repetir el discurso inicial como si el personaje no hubiera aprendido.

El afecto no decae por dejar la app. Los regalos del catálogo conservan preferencias y límites actuales. Una decisión honesta puede generar desacuerdo y abrir una conversación posterior, sin cancelar el arco completo. Las relaciones de NPC entre sí siguen siendo suyas: ayudar a Renata no autoriza elegir su pareja.

Las temporadas ayudan a variar ambientes, no a perder campaña. Si una prueba exige estación, ofrece cultivo compatible o reserva un ensayo para siguiente estación agrícola, con otros capítulos abiertos entretanto. Un festival mítico puede leerse y representarse en próxima edición; el premio no exige regresar en un día real.

## Cómo conectar los juegos

Puente propuesto: registro de **hitos narrativos**, sin monedas ni materiales compartidos. Ejemplo `{origen:'sangre', hito:'noche_corte_resuelta', version:1, recibo:'…'}`. No es código implementado. El adaptador verifica partida y hito real; el consumidor aplica escena una vez. Un evento repetido no vuelve a cerrar la fisura ni concede trofeo.

La campaña de la pareja puede leer sus propios hitos locales. Si se habilita sincronización, se resuelven duplicados por recibo estable y jamás se exige conexión para continuar una escena ya acreditada. La granja no se agrega a amigos en esta etapa. Sangre con amigos mantiene su guion neutral y no recibe escenas de pareja desde un bundle común.

El hogar podrá exhibir una reliquia simbólica por el hito, no extraer energía de almas para producir monedas de casa. Un álbum muestra lo ocurrido y conserva capas de privacidad. Antes de integrar se necesitan pruebas de origen, guardado, duplicados, offline y aislamiento de amigos.

## Capacidades necesarias y estado honesto

| Bloque | Base existente | Trabajo pendiente para estos guiones |
|---|---|---|
| Agricultura y cuidado | Motor V5, parcelas, productos, tiempo agrícola y cuidado real. | Recibos de ensayos narrativos, consentimiento y comparación de pruebas. |
| Libros y archivo | Cuadernos mineros, lectura persistente y colecciones. | Biblioteca de testimonios, autorizaciones y corrección versionada. |
| NPC | 24 identidades sociales funcionales, preferencias y encargos. | Nombres de autoría, biografías, escenas, reacciones posteriores y 118 habitantes nuevos. |
| Campaña | Cinco escenas de Sangre, Noche de cuatro sectores. | 24 misiones coordinadas, adaptación de escenas sin perder audio actual y puente de hitos. |
| Relaciones | Interacciones básicas de jugador. | Relaciones entre NPC, privacidad, encuentros consentidos y consecuencias de rama. |
| Mundos | Planes y rutas de aventura parciales. | Las 19 localidades con viviendas, horarios, logística y actividades reales. |
| Audio | Reproducción, silencios, música y voces de otros frentes. | Revisión de guiones nuevos, reparto de voces, generación elegida e integración por línea. |
| Secretos | Exploración y registros parciales. | Pistas localizadas, diario de deducciones y soluciones alternativas accesibles. |

Orden recomendado de integración: P01–P05 y arcos del pueblo; P06–P10 y enlace con Noche; P11–P16 con Verdia/Senda/perímetro; viajes y acuerdos P17–P21; desenlace P22–P24. Los secretos pueden llegar con su región. Primero texto, estado y pruebas; después presentación de Claude y audio. Ninguna migración debe volver a V1 ni borrar genomas por tener una historia nueva.
