# Utilidades y premios de las historias

La pestaña **Premios** reúne 217 entregas únicas: 69 fichas de conocimiento, 49 agendas, 36 planos,
34 recuerdos, 24 consultas de acuerdos y cinco técnicas. Completar una historia entrega su ID `Q_*`
dentro del mismo guardado. Importar una partida que ya completó historias incorpora esos premios,
sin repetir escenas, gastar materiales, regalar moneda o añadir experiencia.

## Comportamientos disponibles

- **Fichas:** consultas de los datos actuales, ensayos y permisos conservados al cerrar una misión.
  Comparan cuidados, cultivos, producción, capturas y rutas ya conocidas según su ámbito. No revelan
  especies, minerales o destinos sin descubrir. Reservar un relato conserva la versión sin identidades.
- **Agendas:** tres planes fijados como máximo, por jornadas agrícolas del año siguiente. Revisarlos
  no alimenta animales, completa misiones, altera clima ni adelanta cuidados de 48 horas.
- **Planos:** 14 variantes de recetas existentes, con ingredientes, estación, cantidad, tiempo, nivel
  y aprendizaje de la receta base. Requieren su premio incluso si se conoce la receta original.
  Otras 22 instalaciones incluyen diez accesos reparables, cinco depósitos, dos trampas selectivas
  y cinco piezas de exposición. Se construyen con materiales reales y una instalación por plano.
- **Recuerdos:** álbum y exposición de seis recuerdos elegidos. Exponer, guardar o volver a leer no
  paga. Las inscripciones se pueden retirar; un cierre privado no permite publicarlas después.
- **Acuerdos:** consulta del registro autorizado, su visita y límites. Conservan los requisitos reales
  de los accesos de la campaña. La consulta no sustituye equipo, horario, permiso o ancla.
- **Técnicas:** una activa. Reducción del tiempo de procesos nuevos compatibles entre 10% y 20%,
  sin sumar técnicas, cambiar procesos ya iniciados o afectar cultivo y cuidado. Las recetas de
  archivo con reducción previa no acumulan la reducción térmica del 20%.

La utilidad de cada herramienta se documenta en `docs/narrativa/jugabilidad/premios.json`; su descripción
narrativa conserva el acuerdo del personaje. Servicios y actividades adicionales del mundo se conectan
con esa base en los bloques sociales, regionales y comunitarios posteriores.

## Instalaciones físicas

Los accesos se colocan junto a una vivienda existente y conservan su huella. En los mundos de Astra
solo modifican una vivienda de los titulares del acuerdo; conservan horario de 08:00 a 21:00 y llegan
al espacio común. No abren dormitorios ni la contención de Nox. En la granja permiten entrar y volver
por el módulo. Al mover o girar el soporte, el acceso lo sigue; una colisión revierte la operación.
Primero se retira el módulo para guardar un edificio que lo tenga instalado.

Los depósitos usan 24 casillas, salvo el cuenco de cerámica, que usa cuatro. Guardan pilas reales con
su calidad y cantidad, sin ampliar la mochila. Retirarlos devuelve el contenido y la mitad del material
estructural; si no cabe en la mochila se restaura toda la operación.

Las trampas se colocan en la orilla transitable del lago de Celia. Reservan hasta cuatro lombrices y
cuatro usos. Al dormir una jornada realizan como máximo un intento, con probabilidad base del 50%
y pesos normales de rareza; la selección solo rechaza especies distintas de una ya conocida. Una
captura pendiente impide otro intento. No produce por entrar, cargar o dejar pasar tiempo real.
Reparar consume cuatro maderas y dos fibras; recoger y desmontar conservan un solo ejemplar real.
Las trampas generales, los tesoros de pesca y la ampliación regional pertenecen al sexto bloque.

## Producción visual

Las instalaciones tienen `id`, `premio`, `region`, `x/z` y soporte opcional en
`estado.historia.utilidades.modulos`. Su marcador provisional reutiliza `arcoSalida`; el arte se asocia
como `premio:Q_<mision>` en `medios.json`. No desplazar el anclaje ni aumentar capacidad al sustituirlo.
Los patrones de equipo se guardan aparte en `utilidades.estilos`; usan la pieza base equipada con sus
estadísticas intactas. El modelo y la presentación corresponden a Claude.

## Reproducir y comprobar

```sh
python3 docs/narrativa/herramientas/compilar_premios.py
cd juego/web
node scripts/granja-v3/probar-premios.mjs
```

Las once comprobaciones incluyen migración, entrega única, consultas, agenda, recetas equivalentes,
reducción acotada, calidad de pilas, accesos, mochila llena, trampas y datos dañados. Preparan ubicaciones
y recursos; no certifican la economía desde cero ni el rendimiento en los teléfonos.
