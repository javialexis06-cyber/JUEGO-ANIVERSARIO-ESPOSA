# Pesca manual con picada y sedal

La caña usa sesiones jugables en el motor: esperar, enganchar durante el aviso, mantener y soltar
para seguir al pez, controlar tensión y guardar la captura al llegar a la orilla. Los 26 peces del
catálogo mantienen precios, cebos, rarezas, horas, estaciones y clima. Hay seis familias de movimiento:
sereno, zigzag, fondo, ráfaga, ondulante y errático; cada especie tiene un perfil editable y su ejemplar
usa una fase determinada por la semilla del lanzamiento.

## Coste, resultado y pausa

Un lanzamiento válido reserva un ejemplar con los pesos anteriores `1 / rareza²`, una semilla y un
tiempo de espera entre dos y cuatro segundos. Se gasta un cebo y la energía de caña anterior al lanzar.
No hay captura, experiencia, hallazgo ni recompensa por abrir el panel, lanzar o enganchar.
Cancelar, perder la picada o romper el sedal conserva ese coste y no acredita una captura.
Antes de elegir el ejemplar se comprueba capacidad para cualquier salida posible, con las calidades
que pueden conseguirse. Las herramientas y profesiones conservan sus reglas y costes.

La franja sube hacia la derecha al mantener y vuelve al soltar. Coincidir con el pez aumenta el
progreso; perderlo lo disminuye. Sujetar fuera de la franja eleva la tensión; soltar la reduce. Tensión
máxima, progreso agotado o treinta segundos sin resolver terminan el intento. Llegar a la orilla
reserva el resultado: **Guardar captura** entrega material, experiencia y registro una sola vez.
Si no se puede recoger por mochila o almacenamiento, conserva la captura preparada para reintentar.
Con el pez en la orilla, **Organizar mochila** permite juntar pilas, usar provisiones o ampliar la bolsa
por su coste anterior, y volver al resultado. No inicia otro lanzamiento ni permite viajar con la reserva.

El ejemplar y su trayectoria no se vuelven a sortear al cargar. El hallazgo posterior también usa
azar derivado de esa misma semilla y mantiene el límite de un éxito por jornada. Al recargar se
conserva el último paso guardado; el botón presionado no se restaura. Los cambios automáticos de
fase también guardan un punto de recuperación. Las fases avanzan por cuadros
visibles con pasos pequeños, sin consumir azar por cuadro. Una pestaña ausente o un salto de reloj
real no hace picar, luchar, ganar o perder al pez.

El calendario agrícola y la navegación ampliada de NPC quedan pausados; los cuidados reales de
48 horas siguen activos. Cambiar herramienta, fabricar, comprar, viajar, dormir o abrir otra actividad
requiere recoger o cancelar primero. El prólogo tampoco interrumpe una sesión; las acciones del
valle esperan mientras la película está activa. Los puestos espaciales siguen en módulos cerrados, y los peces
no amplían la captura a fauna protegida de Fuatia. Las trampas anteriores conservan sus noches y reglas.

## Entrada y controles

Equipa la caña y visita una orilla o puesto habilitado. En el panel de pesca, elige un cebo y pulsa
**Lanzar la caña**. El botón se habilita al picar; **Enganchar** inicia la lucha.

- Móvil y ratón: mantener y soltar **Mantener para recoger**. Cancelar el puntero o perder foco suelta.
- Teclado: Espacio engancha, mantiene y recoge según fase; soltar Espacio afloja. Escape cancela.
- Con la captura preparada, pulsa **Guardar captura**. También puedes soltar el pez sin recompensa.

Se usan controles sencillos, sonidos y escenarios existentes. No se producen modelos o voces nuevos.
La lectura del cuaderno distingue captura real de vista previa y donación. Los contratos de devolución
registran solamente capturas posteriores a aceptar, incluidas las de la nueva sesión.

## Guardado y contrato para presentación

V5 y claves permanecen. `pesca` es un bloque aditivo V1, con secuencia y una sesión opcional. Las
partidas anteriores reciben una sesión vacía, sin cambiar materiales, genomas, fechas ni misiones.
Las importaciones verifican especie, semilla, contexto, fases, reloj y rangos.
La acción anterior `pescar` conserva compatibilidad para los contratos y recorridos existentes; la
interfaz nueva usa exclusivamente `pesca`. La API anterior queda bloqueada durante una sesión activa.

API del mismo motor:

- `actuar({tipo:'pesca', accion:{tipo:'lanzar',cebo}, xJugador,zJugador})` y acciones `enganchar`,
  `cobrar`, `cancelar`: cambios guardables y reversión completa si falla.
- `sujetarSedal(boolean)`: entrada transitoria; no se guarda un botón pulsado.
- `pasoPesca(segundos)`: avance visible, máximo 250 ms por llamada y pasos de 20 ms; intervalos
  inválidos no adelantan la sesión.
- `estadoSedal()`: observación de objetivo, jugador, ancho, progreso, tensión y fase para la presentación.

Fuente de perfiles: `docs/narrativa/jugabilidad/pesca-sedal.json`. Ejecutar
`node scripts/granja-v3/compilar-pesca.mjs` desde `juego/web`. El contrato
`public/granja/astra/produccion.json → pesca_sedal` incluye los 26 perfiles y contextos. Conservar
colisiones, requisitos y reservas cuando se integren animaciones de caña, boya, pez o tirón.

## Comprobaciones y límites

`probar-pesca-sedal.mjs` comprueba migración, contextos, costes, ventanas, cancelación, pausa,
recarga, 26 capturas con entradas de seguimiento, escapes, registros, recogida única, reversión e
importaciones incoherentes. Los recursos, fechas, clima y semilla se preparan: no mide destreza humana.
El recorrido ordinario de 36 principales se conserva como regresión con la API compatible anterior;
no se presenta ese recorrido como 80 combates humanos del nuevo sedal.

Para preparar la prueba de navegador: `PESCA_PARTIDA=/tmp/pesca-partida.json node scripts/granja-v3/probar-pesca-sedal.mjs`.
`verificar-pesca-sedal.mjs` verifica espera visible, botones, teclado, puntero, recogida, recarga y
almacenamiento fallido. Usa un escenario preparado y pausa de dibujo declarada; la integración general
casa/granja conserva WebGL real. No se certifica rendimiento o destreza en teléfonos físicos.

La evidencia de entrega está en [PESCA-VERIFICACION.json](PESCA-VERIFICACION.json): 45 suites sin
fallos, 18 comprobaciones lógicas con las 26 especies y 17 comprobaciones de navegador
(11 de pesca y seis de integración general con WebGL). Incluye firmas de las fuentes y alcance
de cada escenario. Se incorporan las diez voces del prólogo del frente visual; sus archivos,
IDs y duraciones se verifican sin generar audio.
