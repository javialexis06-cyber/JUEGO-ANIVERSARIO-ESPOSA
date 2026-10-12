# Pesca, museo, redes y comunidad

Actualización: [REUNIONES-INTEGRACION.md](REUNIONES-INTEGRACION.md) añade 52 conversaciones,
vecinos presentes, prioridades por clima/conservación y decisiones recuperables. La cola de mesas
semanales descrita abajo conserva sus reglas; ambas series quedan diferenciadas.

Bloque 6 sobre el motor activo y el guardado V5. Se conserva el menú de seis pestañas de Claude:
**Diario → Comunidad y museo**; la Casa de Oficios también ofrece acceso. Las actividades requieren
presencia en su puesto. El cuaderno y los registros antiguos reciben un bloque aditivo vacío;
la vista previa del catálogo no se convierte en descubrimiento ni donación.

## Pesca, contexto y trampas

Se conservan los 18 peces anteriores, sus precios, cebos, rarezas, horas, estaciones y tiempo.
Se añaden ocho pesquerías: Lirios, Brumaverde, Piedralumbre, Ámbar, Aurelia, Celia, cuenca de Agua
y fragmentos de Cristal. Su puesto está en **−24, 22**; se interactúa desde terreno libre a tres
metros. Los tres puestos espaciales son acuarios cerrados, nunca agua expuesta al vacío.
La caña utiliza el minijuego existente, gasta cebo y energía, comprueba espacio y conserva calidad.
La API anterior sin coordenadas sigue admitida en las cuatro zonas antiguas para sus contratos;
la interfaz actual envía coordenadas y las pesquerías nuevas siempre las exigen.

Cada captura manual correcta tiene un 12 % de posibilidad de un objeto contextual. Máximo un
hallazgo exitoso por jornada y ocho pendientes. La pieza se guarda antes de retirarla: una mochila
llena conserva el hallazgo. Hay seis artefactos ordinarios, sin poderes, venta o compra gratuita.
El archivo también identifica una geoda de cualquiera de las cuatro clases por **20 monedas**;
consume una unidad y favorece contextos todavía desconocidos. La trituradora conserva sus recetas.

Las trampas generales necesitan un dispositivo fabricado y cuatro cebos. Hasta dos por puesto,
18 globales. Un intento por noche dormida; 50 % de captura, luego rareza ponderada como en la caña.
Una captura pendiente bloquea nuevos intentos. Cuatro usos; reparación con cuatro maderas, dos
fibras y cuatro cebos. Agotar y recoger permite retirar el dispositivo. En el lago requieren la
obra del puesto. La fauna protegida y las cuatro criaturas elementales permanecen fuera de este
sistema. Las dos trampas selectivas narrativas anteriores conservan sus IDs y reglas.

## Galería y cuadernos

El Museo del Valle nuevo ofrece donaciones y vitrinas; la Casa de Oficios conserva compatibilidad
para las partidas anteriores. Ambos usan sus espacios públicos y horarios vigentes.
Donar transfiere exactamente **una unidad de la casilla elegida**, con calidad y fecha. Hay 26
colecciones: seis contextos, ocho peces nuevos y una tríada mineral/madera/cosecha por cada uno
de los 24 territorios. Los seis lotes antiguos se conservan. Cerrar una colección se acredita una
sola vez; no paga monedas o experiencia por repetir ni devuelve piezas donadas.

Una colección territorial habilita un conector que ahorra una fibra; la colección de peces
habilita una trampa que ahorra dos fibras. Misma cantidad de salida y valor de venta cero.
Seis vitrinas solo exponen piezas realmente donadas. Notas privadas, inscripciones reservadas,
animales y vistas previas quedan fuera del catálogo de exposición.

Tres cuadernos se abren por experiencia real: tres capturas regionales distintas, tres artefactos
donados y una carga retirada. Se leen en un archivo. El de carga permite acordar una quinta
terminal, pagando sus materiales normales. El registro separa obtener, capturar, fabricar, vender,
identificar y donar; no reconstruye pruebas inexistentes de partidas antiguas.

## Redes y transporte

**Conector:** dispositivo físico de un metro que participa en el grafo de adyacencia cardinal o
diagonal. Une cofres y máquinas mediante caminos contiguos de la misma zona. No cuenta como
máquina ni fusiona inventarios de mundos diferentes. Cuesta dos maderas y dos fibras.

**Exportador:** mejora opcional fabricada; el jugador autoriza un producto y un límite de 1–24
unidades por noche en un cofre a tres metros de una caja de envío. Hasta ocho. Solo la noche
transfiere esas unidades, conservando calidad, y el resumen existente realiza la venta única.
Una caja llena conserva el contenido del cofre. Cambiar filtros no vende. Mover lejos suspende
exportación; antes de retirar un cofre o caja hay que desactivarla. Las herramientas y equipo
no pueden exportarse. Las prioridades y reservas de colas anteriores permanecen intactas.

**Terminales:** requieren P16 y abrir la obra de Celia. Se instalan presencialmente en archivos,
hasta cuatro o cinco con el cuaderno. Fabricación: dos lingotes de hierro, un engranaje y una batería.
Un despacho consume otra batería y reserva una pila con cantidad/calidad exactas; hasta 24 unidades
y seis bultos pendientes. Llega tras dormir y exige retirada en el destino. Inventario lleno conserva
el bulto. No hay cofres globales gratuitos, carga instantánea, transferencia con Sangre ni movimiento
de animales protegidos. El usuario puede seguir usando almacenamiento manual y envío nocturno normales.

## Comunidad y calendario

| Obra | Puesto | Materiales | Noches | Uso |
|---|---|---|---|---|
| Puesto del lago | 28, 77 | 24 madera, 12 piedra, 8 fibra | 2 | Trampas generales del lago |
| Galería de oficios | Archivo público, 0, 1 | 30 madera, 20 piedra, 4 vidrio | 3 | Donación, colecciones y seis vitrinas |
| Banco del sendero | Bosque ancestral, −72, 72 | 8 madera ancestral, 16 piedra, 8 fibra | 2 | Un pan por una pausa diaria útil de +10 energía, sin enemigo |
| Terminal acordada | Celia, archivo 0, −9,6 | 6 lingotes hierro, 2 baterías, 2 engranajes | 3 | Transporte opcional entre archivos |

Entrega y apertura se realizan en el puesto. Reserva única; el plazo solo avanza al dormir.
Los pedidos de los 24 territorios admiten una entrega semanal: mineral y cosecha locales por una
pieza de mantenimiento. No modifican cuotas de extracción. Cada siete jornadas, el calendario
coloca una mesa pública en un territorio realmente visitado. Cola limitada a 32; orden por prioridad
y fecha, con estados pendiente/aplazado/visto. Se puede aplazar y recuperar después en el archivo.
Una madera local y una fibra se convierten en una cuerda una sola vez. Festivales y escenas activas
conservan prioridad: la mesa no interrumpe diálogos, sueño o pruebas. Los encuentros vistos más
antiguos dejan espacio para nuevos; los hechos producidos permanecen en el cuaderno.

## Arte y verificación

Los puestos, trampas y vitrinas reutilizan los arcos de los kits existentes. En `medios.json` se
pueden asociar `pesca:<region>`, `obra:<id>`, `trampa:<region>`, `museo:<articulo>` y `museo:vitrina`.
La presencia, calidad, datos y pruebas funcionan sin GLB final. No se generan voces de pago.
El manifiesto exportable se actualiza con `node scripts/granja-v3/compilar-comunidad.mjs`.

`probar-comunidad.mjs` usa preparación explícita de recursos, ubicaciones y campaña para probar
transacciones, permisos, noches, inventarios, cuotas, calidad y rechazo de guardados corruptos.
No certifica el balance ordinario de toda la campaña. `verificar-comunidad.mjs` prueba interfaz y
persistencia con dibujo pausado tras arrancar; `verificar-demo.mjs` mantiene la comprobación general
con WebGL real. El recorrido ordinario corresponde al bloque 7. Teléfonos físicos no disponibles.
