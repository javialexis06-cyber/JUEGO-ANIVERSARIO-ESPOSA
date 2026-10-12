# Vida cotidiana y vínculos de Astra

El reparto reúne 178 residentes y 93 domicilios. Los 24 vecinos del Pueblo del Sol mantienen sus
horarios, navegación, gustos, comercio, dormitorios y escenas anteriores. Los otros 154 usan el
subestado aditivo `astra.vida`, dentro del mismo guardado V5. No se regeneran NPC ni hogares al cargar.

## Agenda y posición real

Los residentes alternan oficio, pausa, paseo, descanso semanal y hogar. La agenda distingue trabajo
estacional, observación nocturna, merienda infantil y resguardo ante tormentas. Tras acuerdos públicos,
los participantes locales reservan la revisión del sábado por la tarde en la plaza. Las decisiones
reservadas no anuncian reuniones que revelen relaciones privadas.

En la región presente, `MotorGranja.pasoVidaAstra(segundos)` recorre una malla cardinal de calles libres
y cruza la entrada de su vivienda. `posicionNpcAstra` devuelve esa posición: es la que comprueban
conversaciones, obsequios, misiones y clics. No se conversa con una posición invisible al otro lado
del pueblo. La marcha, destino y ruta sobreviven a la recarga. Se pausa con panel, escena o reto.
Fuera de la región no se simulan pasos; la siguiente visita sitúa al residente según su agenda.

La vista consume `pasos[id].andando`, posición y actividad; conserva los peluches y las piezas de
Blender existentes. Sustituir arte no cambia colisiones, entradas o cercanía del motor. Las comisiones
de las historias mantienen su prioridad, incluida la presencia anticipada de Íñigo.

## Amistad, preferencias y oficio

- Una charla cotidiana concede cinco puntos como máximo por jornada. El límite de los residentes
  adicionales es 2500; se conservan todos los puntos anteriores.
- Los regalos consumen una unidad de su calidad real. Solo un regalo por jornada y tres jornadas
  por semana agrícola; aprender un gusto exige una entrega. Los cumpleaños añaden 15 puntos una vez
  por año. Equipo, herramientas, estructuras y crías no se convierten en obsequios.
- Las memorias de Senda se acompañan con relatos y documentos; no consumen mercancía material.
- Los oficios comerciales venden dos provisiones del catálogo a su precio original, seis de cada una
  por semana. No hay descuento acumulable, nueva moneda ni recompra con margen positivo. Descanso,
  pausas y caminatas suspenden atención. Si la mochila o el guardado fallan, la compra se revierte.
- Hay tres recuerdos de amistad por residente adicional, a 50/250/500 puntos. Los dos últimos
  requieren la misión personal cuando exista. Guardan paso y una sola respuesta; repetirlos no paga.
  Reutilizan líneas canónicas ya grabadas, sin cambiar texto, actor o firma.

Las preferencias y fechas de los residentes adicionales son diseño de agenda para el juego, basado
en su oficio y vida cotidiana; no sustituyen el relato original de sus autores.

## Las 98 relaciones

`estadoRelacion` deriva las consecuencias de los contratos reales de Campaña y su opción de cierre.
El diario solo muestra vínculos públicos entre personas conocidas; un secreto necesita cierre con
publicación autorizada. La rama reservada conserva un contador anónimo, sin nombres o acciones que
permitan exponerlo después. La wiki contiene spoilers por petición del usuario; la partida no los revela.

Después de un acuerdo visible se revisa una nota con cada participante en su propia localidad,
como máximo una vez por semana. Solo ambas revisiones conceden diez puntos a los residentes nuevos.
No teletransporta a nadie, libera detenidos, exige perdón, crea parentescos o convierte amistad en romance.
La revisión puede abarcar los 24 vecinos originales, conservando su amistad anterior sin sumas externas.

## Producción y verificación

`docs/narrativa/jugabilidad/vida-social.json` contiene perfiles, relaciones y 462 referencias de escenas.
`compilar_vida.py` lo reproduce desde las biografías integradas de los 178 residentes. No modifica las
3590 líneas existentes ni genera audio. La vida de los 36 vecinos añadidos por Claude y sus 42 encargos
se incluye en la wiki, separada de las 217 historias de Campaña.

Las pruebas recorren las calles de los 154 residentes, recargan rutas y encuentros, comprueban regalos,
stock, privacidad, mochila llena y datos dañados. Los escenarios preparan ubicaciones y materiales:
no certifican la economía desde cero ni el rendimiento de teléfonos. Las rutinas y requisitos no
introducen cambios en crecimiento al dormir, genética o cuidados de 48 horas reales.
