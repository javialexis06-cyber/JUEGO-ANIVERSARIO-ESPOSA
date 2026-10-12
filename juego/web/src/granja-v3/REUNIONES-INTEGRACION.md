# Reuniones comunitarias y consecuencias sociales

52 conversaciones jugables en 17 localidades de Astra: una mesa inicial, un asunto de clima y
una revisión de conservación por localidad, más el acuerdo del puesto de carga de Celia.
Son 312 líneas nuevas y 104 decisiones posibles. Se añaden a las mesas semanales anteriores;
no sustituyen las 217 historias, sus voces ni los encargos existentes.

## Llegada, prioridad y presencia

Solo una noche dormida añade asuntos de localidades realmente visitadas. La mesa inicial llega
al cambiar de semana; el clima necesita un pronóstico difícil de la jornada anterior (tormenta,
ceniza o nieve); conservación necesita un refugio realmente restaurado. Celia necesita la obra
terminal abierta y el permiso P16 que esa obra ya exige. Cada ID llega una sola vez.

El puesto está junto al archivo: centro `x = archivo.x`, `z = archivo.z + 2.4`; los interlocutores
ocupan `x − 1` y `x + 1`. Los dos son vecinos adultos ya existentes de esa localidad. Caminan a
2.4 m/s por calles transitables con la navegación anterior. Al entrar por primera vez en una región,
se inicializa la agenda actual como antes; no se simulan viajes fuera de pantalla.

Horario 14–16 h. Se respetan días de descanso, mal tiempo, viviendas, encuentros, festivales y
comisiones de la campaña. Una reunión necesita conocer a ambos y esperar su llegada; no permite
conversar desde el puesto anterior. Pendientes antes de aplazados; después, clima (3), cuidado y
terminal (2), mesa (1), antigüedad e ID. Aplazar cede el turno a otro pendiente. Una ventana de seis
noches vencida conserva el asunto como aplazado, con las mismas decisiones y costes.

La revisión de la terminal lleva a Rita y al archivista Ivo al puesto comunitario. Durante ese turno
Rita atiende el acuerdo; su compra sigue requiriendo estar en su oficio abierto. Las otras tres obras
anteriores conservan sus servicios. El Museo del Valle nuevo conserva el acceso a donaciones y
vitrinas. Esta entrega no añade visitas de NPC al muelle, galería o banco.
Los territorios sin habitantes conservan trabajos y mantenimiento; no se inventan residentes.

## Decisión y efectos

Leer los seis turnos antes de elegir. **Aportar:** una madera de la localidad y una fibra se
transforman en una cuerda. **Escuchar:** no consume materiales, no entrega objetos y no impone
un turno. Ambas respuestas reconocen la escucha con cinco puntos por vecino, limitados a 2500,
una sola vez. No dan monedas, experiencia, permisos, cupos, crianza rápida ni envíos gratis.
Dejar la conversación conserva materiales y amistad y permite retomar desde el principio.

La conversación pausa el calendario agrícola y la navegación de vecinos. El cuidado de 48 horas
reales sigue activo. Otros trabajos y servicios requieren terminar o dejar la reunión. Guardar cada
turno y decisión usa la reversión económica de las acciones comunitarias existentes; la mochila
llena, los materiales insuficientes o el almacenamiento fallido conservan la decisión abierta.

Los diálogos siguen límites ya establecidos: habitantes de Nox permanecen en el Bastión, Verdia
no exige producción, las memorias conservan consentimiento y reserva, los animales silvestres no
se capturan para recompensas y los menores no reciben turnos comunitarios de adultos.

## Guardado, interfaz y producción

V5 se conserva. `comunidad.reuniones` es un subestado aditivo V1 con cola, fecha, decisión y línea
activa. Las partidas anteriores reciben una cola vacía. Las importaciones verifican IDs únicos,
prerrequisitos, fechas, decisiones y coherencia de la conversación con las posiciones presentes.
No se convierten recuerdos de lectura anteriores en decisiones nuevas.

Acceso: **Diario → Comunidad y museo → Reuniones con los vecinos**; el motor comprueba la
presencia junto al archivo. El diálogo usa un panel simple y los actores, mapas y música regional
existentes. El botón «Dejar y retomar» permite salir de una conversación sin decidir.

Fuente editable: `docs/narrativa/jugabilidad/reuniones.json`. Compilar:
`node scripts/granja-v3/compilar-reuniones.mjs` desde `juego/web`.
El contrato `public/granja/astra/produccion.json → reuniones` contiene actores, lugares, horas,
condiciones, materiales, premios, guiones y ramas. Cada línea tiene ID `COM_<region>_<tipo>.NN`,
SHA-256 completo `huella` y su prefijo de 16 caracteres `huella_texto` compatible con AudioAstra.

El reproductor y el actor que habla ya consultan esas claves. Para incorporar una toma, declarar
su archivo y firma en `medios.json → voces`, igual que para las voces anteriores. El verificador
admite las líneas comunitarias y exige archivos reales y firmas coincidentes cuando se declaran.
**Estas 312 líneas todavía usan subtítulos: no se han generado ni comprado nuevas voces.**
Se conservan las 3581 tomas y las 23 músicas existentes. No hacen falta modelos nuevos para jugar.

## Comprobación y límites

`probar-reuniones.mjs`: migración, llegada solo al dormir, requisitos, prioridades, aplazamiento,
rutas, descanso, clima, presencia, pausa, bloqueos, recarga, costes, decisión única, reversión y
104 ramas sobre los 52 guiones. Los escenarios preparan recursos, visitas y fechas; la terminal
usa los permisos de un recorrido de contratos preparado por los ayudantes existentes.
El recorrido ordinario de 36 principales se mantiene como regresión independiente.

`verificar-reuniones.mjs` comprueba controles, lectura, cancelación, almacenamiento fallido,
decisión y recarga en el build completo. Su escenario y pausa de dibujo se declaran en la evidencia;
la prueba general casa/granja mantiene WebGL real. La regresión, builds y evidencia concreta se
registran en `REUNIONES-VERIFICACION.json`. No certifican FPS, memoria ni batería de celulares.
