# Súper Manía en Pareja: cómo funciona el juego

Este documento explica, paso a paso, cómo se juega un día en la tienda. Cubre:
- qué pasa con las vitrinas cuando los clientes compran;
- cómo se sabe que hay que reponer y dónde se repone;
- cómo se cobra;
- cómo juegan Él y Ella juntos;
- cómo avanza la partida.

Las láminas `16a-estados-vitrina.png` y `16b-como-se-repone.png` (en `supermercado/renders/`) muestran lo más importante.

---

## 1. Un día en la tienda (el bucle principal)

1. **Se abre la tienda.** Suena la campanita y el reloj del día arranca, con unos 3 a 4 minutos por día.
2. **Entran clientes** por la puerta y toman una canasta (o un carrito en las tiendas grandes).
3. Cada cliente trae una **lista de 1 a 4 productos**. Encima de su cabeza aparece un **globo de pensamiento** con el producto que va a buscar.
4. Camina hasta la sección de ese producto, **lo toma de la vitrina** y lo echa a la canasta. Luego sigue con el siguiente de su lista.
5. Con la lista completa va a la **caja**, hace fila, paga y **deja propina** si lo atendieron rápido.
6. **Si algo falta** (vitrina vacía), el cliente se queda esperando frente a la vitrina y su **paciencia baja**. Si se le acaba, se va sin comprar ese producto, o sin comprar nada si está muy bravo.
7. **Al cerrar** se suman las ventas y las propinas, y se revisan los **3 objetivos del nivel**; cada uno da una estrella (ver punto 9).

Tu trabajo, y el de ella, es que **nunca falte producto**, que **nadie espere mucho en la caja** y que la tienda esté **limpia y segura**.

---

## 2. Las vitrinas: cómo se vacían y cómo avisan

### Lo que ves es lo que hay
Cada vitrina muestra físicamente sus productos: latas, cajas de cereal, botellas, panes, etc.
- **Cuando un cliente compra**, la pieza de adelante desaparece con un pequeño *pop* y **vuela a su canasta**.
- **Cuando se repone**, las piezas vuelven a aparecer una por una, con un brillo.

Cada vitrina tiene una **capacidad** en unidades (ver la tabla del punto 8) y el dibujo muestra la proporción. Por ejemplo, una góndola al 50 % se ve con la mitad de los huecos vacíos.

### Los cuatro estados (lámina 16a)
| Estado | Cuánto queda | Cómo se ve | Qué pasa |
|---|---|---|---|
| **Llena** | Más del 50 % | Barra de inventario **verde** | Todo bien |
| **A medias** | 21 % a 50 % | Barra **amarilla** y huecos en las repisas | Buen momento para reponer si pasas cerca |
| **Casi vacía** | 1 % a 20 % | Aviso **«!» amarillo** saltando sobre la vitrina y un «ding» suave | ¡Hay que reponer pronto! |
| **Vacía** | 0 | Aviso **«!» rojo** con el **ícono del producto** que falta; los clientes que lo buscan se quedan parados con su globo | Pierdes ventas y paciencia |

La **barra de inventario** flota sobre cada vitrina y solo aparece cuando baja del 50 %, para no llenar la pantalla. Así, de un vistazo, se sabe qué se está acabando.

### La paciencia del cliente
Sobre cada cliente de la **fila de la caja** hay una **carita** según su paciencia: **verde** contento (66 % o más: deja la propina completa), **amarilla** impaciente (30 % a 66 %) y **roja**, temblando, a punto de irse (menos de 30 %). Si la paciencia se le acaba, **se va desde donde esté, también desde la fila**: hace una pataleta corta («¡Me voy!»), la fila avanza y cuenta como cliente perdido. La paciencia baja cuando:
- espera frente a una vitrina vacía,
- hace fila larga en la caja,
- se resbala en un derrame,
- la tienda está sucia.

La paciencia sube un poco con la **decoración**: plantas, música, globos, letreros de oferta.

---

## 3. Dónde y cómo se repone (lámina 16b)

### La bodega
- Al fondo de cada tienda está la **bodega**, con su puerta coral.
- Adentro hay **una caja por sección**, con su ícono en relieve: manzana (frutas), leche (lácteos), filete (carnes), pan (panadería), lata (abarrotes), botella (bebidas), copo de nieve (congelados), wafle y arepa.
- Las cajas **no se acaban** y **no cuestan**: lo que cuesta es **tiempo**, porque ir y volver toma varios segundos. La estrategia está en **cuándo** ir y **cuántas** cosas traer por viaje.

### Cómo se mueve y cómo se trabaja (joystick)
- **El joystick** transparente de la esquina de abajo a la izquierda mueve a Él (en el computador, WASD o las flechas). Es la forma principal de moverse; los muebles no se atraviesan (se desliza por el borde).
- **Quedarse quieto junto a algo lo hace solo**, con una barrita sobre la cabeza que muestra cuánto falta:
  - en la **bodega** se llena el carrito;
  - junto a un **estante** que no esté lleno se vacía en él lo que lleva el carrito;
  - **detrás de la caja**, si hay fila, se cobra (uno a la vez);
  - en el **balde azul** (contra la pared, junto a la puerta) se lava el trapero;
  - encima de un **charco o mugre** se trapea;
  - junto a la **caneca** se bota la bolsa y en la **entrada** se dejan las canastas.
- **Al pasar por encima** (sin detenerse) se recogen la basura, los productos caídos y las canastas tiradas, se atrapa al ladrón o a la niña y se toma el corazón escondido.
- **Tocar sigue sirviendo:** tocar una vitrina, la caja, una mugre, una canasta, el ladrón o el balde manda al personaje solo (con un número en su fila de acciones; otro toque lo cancela). Al mover el joystick, la fila se borra: manda el joystick.

### El carrito: reposiciones para cualquier estante
1. En la **bodega** se llena el carrito hasta el tope (tarda 1 s + 0,3 s por reposición, menos con la «Bodega ordenada»).
2. Cada **reposición deja lleno un estante**, el que sea (frutas, lácteos o bebidas: no importa cuál).
3. Cuántas caben depende del **Carrito grande**: **2** estantes por viaje (nivel 1), **3** (nivel 2), **5** (nivel 3) y **7** (nivel 4). Al principio hay que ir seguido a la bodega; con las mejoras se hacen viajes más largos.
4. **Combo de reposición:** llenar 2 o más estantes con la misma carga da +2 monedas por cada estante después del primero.
5. Los **productos caídos** (de la niña traviesa o de un estante tumbado) se suben al carrito como una reposición si cabe; si el carrito va lleno, se devuelven a mano a su estante.
6. El HUD (arriba a la izquierda) muestra el carrito con su barrita y las reposiciones que le quedan (por ejemplo, 1/2). Con toques, si el carrito está vacío, primero pasa por la bodega.
7. **Los estantes arrancan a medio llenar** («¡Llegó el camión!»): 80 % el primer día, 55 % los días 2 y 3, 40 % después y 30 % en la hora pico, el gran día y los días legendarios. Quedarse en la caja todo el día ya no alcanza: sin reponer se acaba todo y los clientes se van.
8. Los botones verdes de los sitios «por comprar» solo salen en el menú y en las mejoras, no mientras se juega.

### Herramientas con capacidad (todas funcionan igual: se llenan y se vacían o recargan en su puesto)
| Herramienta | Capacidad | Se llena con | Se vacía o recarga en |
|---|---|---|---|
| **Carrito** | 2 / 3 / 5 / 7 estantes por viaje (Carrito grande) | Nada: se gasta al reponer | La **bodega** (se recarga) |
| **Trapero** | 4 / 6 / 9 manchas (Trapero grande) | Charcos y mugre del piso | El **balde** (se lava en 1,3 s) |
| **Bolsa de basura** | 4 basuras | Basura del piso | La **caneca** |
| **Canastas en la mano** | 3 canastas | Canastas tiradas | El **puesto de la entrada** |

El HUD muestra cada una con su barrita; cuando el trapero se llena dice **«¡Lávalo!»** y ya no trapea hasta lavarlo. El ayudante de **aseo** también lava su trapero en el balde cuando se le llena.

### ¿Cómo sé cuándo ir a la bodega?
- **Barras de inventario** amarillas y rojas sobre las vitrinas.
- **Avisos «!»**: el amarillo es «queda poco» y el rojo es «se acabó», con el producto que falta.
- **Globos de pensamiento** de los clientes: si ves varios clientes pensando en arroz, el arroz se está acabando.
- **Barra de alertas** arriba en la pantalla: una fila de íconos con las secciones en amarillo o rojo. Si tocas un ícono, esa vitrina entra a la cola.
- **Sonidos**: un «ding» cuando algo pasa a amarillo y un «uh-oh» cuando se vacía.
- **Ayudas que se compran**:
  - El **reponedor** (ayudante) repone solo las vitrinas en rojo.
  - El **timbre de inventario** avisa desde el 35 %.

---

## 4. La caja: cobrar

- Los clientes hacen **fila** detrás de la caja (con los postes y la cinta).
- **Si nadie está cobrando, la fila se enoja más rápido**: el primero de la fila pierde paciencia 1.7 veces más rápido que esperando producto, y si se le acaba se va **sin pagar**.
- **Combo de caja:** cobrarle a varios clientes seguidos sin soltar la caja da +1, +2, +3… monedas (hasta +5).
- **Tocas la caja** para atender: cada cliente tarda según el nivel de la caja y cuántas unidades lleva (nivel 1: 2.2 s + 0.9 s por unidad; nivel 2: 1.4 s + 0.55 s).
  - **Nivel 1:** registradora de teclas, lenta.
  - **Nivel 2:** caja con banda, media.
  - **Nivel 3:** escáner con pantalla, rápida.
- Al pagar salen **monedas y billetes** que vuelan al contador del día, más la **propina** según la carita del cliente.
- La **cajera** (ayudante) atiende una caja sola, así ustedes quedan libres para reponer.
- Cada tienda permite **más cajas**. Las cajas extra se compran como cualquier otro sitio «+».

---

## 5. Zonas especiales: wafles y arepas

Funcionan como la panadería, pero con un **paso de cocina**:
1. Algunos clientes piden **«un wafle»** o **«una arepa»**, con su globo mostrando el producto.
2. Si la vitrina de la zona tiene producto listo, lo toman como de cualquier vitrina.
3. Si no hay, alguien debe **cocinar**:
   - toca la **waflera** o la **plancha** (usa masa de la caja de la zona);
   - espera el **temporizador**, unos 5 segundos;
   - lleva el producto a la vitrina de la zona o **directo al cliente** que lo pidió, que deja más propina.
4. Si se deja mucho tiempo, **se quema**: sale humo y hay que botarlo a la caneca.

**En pareja:** uno cocina y el otro entrega. Si lo hacen seguido, se activa el **combo en equipo**.

Las **máquinas** (malteadas, café, jugos y pizza) funcionan igual: poner, esperar y entregar.

---

## 6. Problemas del día

En la tiendita aparecen uno por uno; desde la segunda tienda ya vienen todos.

| Día (tiendita) | Problema | Qué pasa | Cómo se resuelve |
|---|---|---|---|
| 6 | **Basura** | Baja la paciencia de todos los que están cerca | Pasar por encima (o tocarla): va a la **bolsa** (caben 4) y la bolsa se vacía en la **caneca** |
| 8 | **Derrame** | El que lo pisa se resbala, se queda quieto y pierde paciencia | Quedarse encima (o tocarlo): se trapea y llena el **trapero**, que se lava en el **balde** |
| todos | **Canastas tiradas** | Sin canastas en la entrada no entra nadie: los clientes esperan en la puerta | Pasar por encima (hasta 3 en la mano) y llevarlas a la entrada |
| 12 | **Ladrón** | Toma productos y corre a la salida | Alcanzarlo (o tocarlo) antes de que salga: devuelve lo robado y da 5 monedas |
| 14 | **Niña traviesa** | Tumba productos de varias vitrinas; quedan en el piso | Alcanzarla para calmarla, y recoger los productos caídos (van al carrito) |
| 18 | **Famoso** | Todos se quedan mirándolo unos segundos | Atenderlo rápido: si sale feliz deja 15 monedas de propina |

- **Día lluvioso:** el doble de charcos, muchos junto a la puerta.
- **Hora pico:** los clientes llegan en tres oleadas.
- **Día de ofertas:** algunos clientes llevan una unidad más de cada producto.

### Tipos de cliente (tiendita)
| Cliente | Desde | Camina | Paciencia | Prefiere | Propina extra |
|---|---|---|---|---|---|
| Abuelita | día 1 | lenta | mucha | panadería, lácteos, frutas | |
| Mamá | día 1 | normal | media | lácteos, frutas, abarrotes | |
| Adolescente | día 6 | rápido | poca, y tira basura | bebidas, abarrotes, congelados | |
| Ejecutivo apurado | día 11 | muy rápido | muy poca | bebidas, congelados, abarrotes | +3 si sale feliz |
| Chica deportista | día 16 | rápida | media | frutas, bebidas | +1 |
| Famoso | día 18 | normal | poca | bebidas, panadería, frutas | +12 |

La tarjeta de cada día muestra quién viene y qué prefiere, como en Supermarket Mania.

## 7. Jugando en pareja (cooperativo)

### Los dos en el mismo celular (ya se puede jugar)
- En la tarjeta de cada día se elige **«Jugar solo»** (Él), **«Los dos en este celular»** o **«En línea»** (abajo). Se recuerda para la próxima vez.
- En pareja aparece **un segundo joystick en la esquina de abajo a la derecha**: Él juega con el de la izquierda (azul) y Ella con el de la derecha (rosado). En el computador, Él con WASD y Ella con las flechas. Cada uno tiene su nombre sobre la cabeza, su tira de herramientas (Él arriba a la izquierda, Ella arriba a la derecha) y su propio carrito, trapero y bolsa.
- Se juega con la **columna «pareja»** de `niveles.json`: más clientes y metas de dos (ventas, propinas, perdidos). La estrella «equipo» pide **combos en pareja**.
- **Combo en pareja** (corazón, +3 monedas): cuando los dos terminan algo útil con 3,5 s o menos de diferencia (uno repone y el otro cobra, uno trapea y el otro atrapa al ladrón…).
- En la caja **cobra uno a la vez**; si el otro llega, le sale el aviso de que ya están cobrando.
- Un toque en la pantalla le llega a **quien esté más cerca** de lo tocado.
- Las estrellas que se ganan en pareja cuentan en la misma partida guardada.

### Choques
- **Solo cuentan los choques de frente y rápidos:** los dos tienen que ir el uno hacia el otro a más de 1,4 m/s (casi a toda velocidad) y al menos uno debe ir con el joystick. Si apenas se rozan, solo se apartan.
- Al chocar suena un «¡pum!», los dos **salen empujados** unos 80 cm hacia atrás con un saltico, sueltan lo que estaban haciendo y quedan **mareados 0,8 s** con estrellitas dando vueltas. Después hay 1,6 s en que no se vuelven a chocar.
- **Si uno sale volando contra un estante, el estante se tumba:** cae de cara al pasillo, **se vacía** (hasta 3 productos quedan tirados en el piso y se pueden recoger al carrito) y deja **mugre** que hay que trapear (y en la que los clientes se resbalan). A los dos segundos se levanta solo, vacío.
- **Si alguno llevaba el carrito lleno** (75 % o más), **se riega**: el carrito queda vacío y el piso sucio.

### Pareja en línea: cada uno en su celular (ya se puede jugar)
- En la tarjeta del día se elige **«En línea, cada uno en el suyo»**. Los dos celulares tienen que estar en la **casa en línea** (Nuestro Hogar → Conectar); si el otro tiene Súper Manía abierto, la nota lo dice en verde.
- **El que abre la tienda invita** al otro: si el otro está en el súper le sale «¡Él te invita!» con «¡Vamos!» / «Ahora no»; si no, le llega un **aviso en la casa** con el botón para entrar (vale 3 minutos). Si los dos invitan a la vez, gana la invitación más vieja.
- Se juega el día **con las vitrinas y mejoras del que invita** (la columna «pareja» de `niveles.json`, igual que en el mismo celular). Cada uno mueve **su personaje con su joystick** (uno solo, a la izquierda) y **toca para su personaje**: los toques no le quitan al otro lo que ya tiene en su fila («Ella ya va para allá»); las alertas de vitrina vacía también son para el que las toca.
- **Pausa, ayudas y corazón** valen para los dos: si uno pausa, al otro le sale «Él pausó el juego» y cualquiera puede seguir. Cada uno gasta sus propias ayudas.
- **Al final** los dos ven el mismo tiquete y **cada uno gana en su partida** las estrellas, la luna, el corazón y las monedas del día. El **sueldo para la casa** lo pone solo el celular del que invitó (la casa es una sola).
- **Si se corta el internet** de alguno, a los dos se les pausa con «Se cortó la conexión con Ella… esperando a que vuelva» y sigue solo cuando vuelve; si pasan 2 minutos y medio, o el otro sale o cierra el juego, se vuelve al menú con el aviso.
- Cómo funciona por dentro: el celular que invita (**anfitrión**) simula todo el día y 10 veces por segundo le manda al otro una **foto** de la tienda (~1-3 KB: personajes, estantes, mugre, canastas, reloj, cuentas y lo que pasó). El otro (**invitado**) arma la misma tienda como **espejo**, mueve a todos suavecito de una foto a la siguiente y mueve su propio personaje **al instante** con el joystick (si se aleja mucho de lo que dice el anfitrión, se corrige). Viaja por un canal de Supabase Realtime (`super-<pareja>`); para probar sin internet, dos pestañas con `super.html?linea=local&rol=el` y `?linea=local&rol=ella`. Código: `src/linea_super.ts` (canal), `src/espejo.ts` (foto, órdenes y espejo) y la sección «En línea» de `src/main.ts`.
- **Ideas para después:** marcar algo para el otro con el dedo sostenido («¡ve tú a la caja!») y roles sugeridos (uno repone, el otro caja y limpieza).

---

## 8. Números de balance (juego/web/src/balance.ts)

| Vitrina | Capacidad nivel 1 | Nivel 2 | Nivel 3 |
|---|---|---|---|
| Estante de abarrotes, frutas, bebidas | 3 | 6 | 10 |
| Nevera de lácteos | 3 | 6 | 9 |
| Congelador, panadería | 3 | 5 | 8 |
| Vitrina de carnes | 2 | 4 | 7 |

- **Una vitrina de nivel 1 alcanza para uno o dos clientes**: desde el día 3 cada cliente lleva 1 o 2 unidades de cada producto. Al vaciarse, las piezas desaparecen de la vitrina en proporción.
- **Tiempos de Él y Ella:** caminan a 2,6 m/s (hasta 3,7 con tenis); cargar el carrito toma 1 s + 0,07 s por unidad; llenar una vitrina, 1,4 s; trapear, 1,6 s; lavar el trapero, 1,3 s.
- **Carrito:** 8, 14 o 20 unidades. **Trapero:** 4, 6 o 9 manchas. **Bolsa:** 4 basuras. **Canastas en la mano:** 3.
- **Choques (en pareja):** cada uno a más de 1,4 m/s hacia el otro; empujón de 3,2 m/s por 0,26 s; mareo 0,8 s; carrito regado desde el 75 % (`CHOQUE` en `balance.ts`).
- **Sueldo para la casa:** una doceava parte de la ganancia del día (un tercio dividido entre 4), mínimo 1 moneda.
- **Paciencia** (segundos de espera): abuelita 62, mamá 46, adolescente 36, ejecutivo 27, deportista 38. Baja a ritmo 1 esperando producto, 1.3 en la fila, 1.7 si es el primero y nadie cobra, 0.25 caminando y +0.45 cerca de basura.
- Un producto vale entre 5 y 9 monedas. La propina es 0, 1 o 3 según la carita, más la propina extra del tipo de cliente.

### Mejoras que se compran entre días
| Grupo | Mejora | Niveles | Efecto | Desde el día |
|---|---|---|---|---|
| Vitrinas | Comprar sitios «+» / subir a nivel 2 | | Más vitrinas y el doble de capacidad | 3 / 4 |
| Caja | Banda | 1 | Cobra 40 % más rápido | 4 |
| Él y Ella | Tenis nuevos | 3 | Caminan 15 %, 30 % y 47 % más rápido | 2 |
| Él y Ella | Carrito grande | 2 | 14 y 20 unidades (empieza en 8) | 3 |
| Él y Ella | Trapero grande | 2 | 6 y 9 manchas antes de lavarlo (empieza en 4) | 8 |
| Bodega | Bodega ordenada | 3 | Carga 28 %, 48 % y 64 % más rápido | 2 |
| Bodega | Reposición rápida | 3 | Llena vitrinas 28 %, 48 % y 64 % más rápido | 3 |
| Tienda | Matera, música y globos | 1 c/u | Cada uno: −10 % en la pérdida de paciencia | 3, 6 y 10 |
| Tienda | Más canastas | 1 | 9 canastas en vez de 6 | 6 |
| Tienda | Segunda caneca | 1 | Menos camino para botar basura | 7 |
| Tienda | Cámara de seguridad | 1 | El ladrón se ve desde que entra y corre más lento | 12 |
| Ayudantes | Cajera | 1 | Cobra sola (70 % más lenta que Él) | 7 |
| Ayudantes | Aseo | 1 | Basura, charcos y productos caídos (lava su trapero en el balde) | 9 |
| Ayudantes | Reponedor | 1 | Repone las vitrinas que bajan del 34 % | 10 |
| Ayudantes | Guardia | 1 | Atrapa ladrones y calma a la niña | 13 |

### Ayudas de un día (se compran y se usan con un botón)
- **Tinto** (día 4): Él corre 40 % más rápido por 20 s.
- **Canción favorita** (día 6): nadie pierde paciencia por 12 s.
- **Limpieza total** (día 8): la tienda queda limpia al instante.

### Música y sonido
- Música de fondo sintetizada en el juego: una cumbia suave de tienda de barrio. En el menú suena más bajo y se acelera cuando faltan 25 s para cerrar.
- Efectos: caja registradora, vitrina vacía, combo, alarma del ladrón, resbalón y corazón encontrado.

## 9. Progresión: 100 niveles con 3 estrellas cada uno

Son **100 niveles**: 4 tiendas de **25 días** cada una. La tabla completa, con los clientes y las metas de cada nivel, está en [`niveles.md`](niveles.md). La genera `juego/datos/generar_niveles.py`, que también produce `juego/datos/niveles.json` para el juego.

### Las 3 estrellas de cada nivel
| Estrella | Qué premia | ¿Obligatoria? |
|---|---|---|
| ⭐ 1 · **Ventas** | Llegar a la meta de monedas del día | **Sí**: sin ella se repite el nivel |
| ⭐ 2 · **Objetivo del día** | Rota entre los objetivos de la lista de abajo | No |
| ⭐ 3 · **Objetivo del día** | Otro distinto de la misma lista | No |

**Objetivos que rotan en las estrellas 2 y 3:**
- **Propinas**: recolectar al menos *X* monedas de propina. Premia atender rápido y hacer combos.
- **Clientes perdidos**: que se vayan como máximo *X* clientes sin comprar por demora. En los niveles altos, ninguno.
- **Espera en la caja**: que la espera promedio en la fila sea de *X* segundos o menos.
- **Vitrinas vacías**: que ninguna vitrina quede vacía más de *X* segundos seguidos.
- **Limpieza**: que ningún charco ni basura quede más de *X* segundos (aparece cuando ya existen basura y derrames).
- **Robos**: ningún robo en el día (aparece desde que llega el ladrón).
- **Productos preparados**: vender *X* wafles, arepas, malteadas…
- **Equipo**: en **pareja**, hacer *X* combos en equipo; en **solitario**, que el *X* % de los clientes salga feliz.

**Cómo se ve:**
- Antes de empezar, la tarjeta del nivel muestra los 3 objetivos con sus metas.
- Durante el día se ven como 3 mini-íconos arriba, que se llenan en vivo. Por ejemplo, el contador de propinas sube, y los clientes perdidos se ven como caritas tachadas.
- Al cerrar, las estrellas se encienden una por una.
- **Se puede repetir cualquier nivel** para sacar las estrellas que faltaron. Al repetir, se juega con las mejoras que ya se tienen en esa tienda.

### Días especiales
- **Cada 5 días hay un evento con estrellas propias:**
  - **Hora pico** (días 5, 30, 55 y 80): clientes en oleadas. Estrellas por clientes perdidos y espera en la caja.
  - **Día de ofertas** (días 10, 35, 60 y 85): más clientes y más ventas. Estrellas por propinas y vitrinas vacías.
  - **Día lluvioso** (días 15, 40, 65 y 90): el doble de derrames. Estrellas por limpieza y clientes perdidos.
  - **Visita especial** (días 20, 45, 70 y 95): inspección, y la limpieza cuenta doble. Estrellas por limpieza y equipo.
- **Gran día** (niveles 25, 50 y 75): el final de cada tienda, con todo junto y la meta más alta.
- **Nivel 100 · Nuestro aniversario**: la tienda decorada, música especial y un mensaje final para los dos.
- **Noticias del Diario del Barrio** (días 3, 7, 9, 12, 13, 17, 19, 22, 23 y 24 de cada tienda): la tarjeta del día trae un recorte de periódico y la noticia cambia el día:
  | Noticia | Qué pasa |
  |---|---|
  | Se acerca el Día de la Madre | Más mamás y abuelitas, un poco más de paciencia y +1 de propina |
  | ¡Hoy juega la Selección! | Paciencia −28 %; todos buscan bebidas y paquetes |
  | Ola de calor en el barrio | Paciencia −15 %, +10 % de clientes; bebidas y helados |
  | ¡Llegó la quincena! | +10 % de clientes y cada uno lleva una unidad más de cada producto |
  | Concierto gratis en el parque | +20 % de clientes, muchos adolescentes y el doble de basura |
  | Feria del barrio en la cuadra | +40 % de clientes |
  | Paro de buses en la ciudad | −15 % de clientes, pero paciencia −40 % y caminan 20 % más rápido |
  Las metas de ventas de esos días ya cuentan la noticia.

### Dificultad
- Cada día llegan más clientes: por ejemplo, 8 el primer día de la tiendita y 32 el último del hipermercado, jugando en solitario.
- La paciencia baja poco a poco.
- Las listas pasan de 1 a 4 productos.
- Van apareciendo clientes y problemas nuevos. Cada novedad llega sola y con un aviso corto de cómo se resuelve.

### Pasar de tienda
- Para abrir la siguiente tienda hay que **terminar el día 25** y tener un mínimo de estrellas de esa tienda. El mínimo sube con cada tienda, así que a veces conviene volver a sacar estrellas:
  - **Tiendita → Minimercado:** 70 %, es decir 53 de 75 estrellas.
  - **Minimercado → Supermercado:** 80 %, es decir 60 de 75.
  - **Supermercado → Hipermercado:** 90 %, es decir 68 de 75.
- En la tienda nueva **se empieza de cero**: vitrinas de nivel 1, lo mínimo para funcionar y el carrito de nivel 1.
- Las **monedas** son de cada tienda: se gastan en sitios y mejoras y no pasan a la siguiente.
- Las **estrellas** son para siempre y desbloquean recompensas.

### 🌙 Modo legendario: las Lunas
- **Cuándo se abre:** cuando se sacan las 3 estrellas de un nivel, se abre su **versión legendaria**.
- **Qué cambia:**
  - llega el **doble de clientes**;
  - tienen **la mitad de paciencia**;
  - hay **1.5 veces más problemas** (derrames, basura, ladrones…).
- **La Luna:** si se cumple la meta legendaria, se gana **1 Luna 🌙**. La meta pide llegar a unas ventas y no pasar de cierto número de clientes perdidos. Hay **100 Lunas**, una por nivel.
- **Por qué se puede pasar:**
  - la meta de ventas pide el 80 % de lo posible, como un día normal bien jugado;
  - se permite perder hasta el 12 % de los clientes;
  - se juega con todas las mejoras que ya se tienen en esa tienda.
  - Es difícil de verdad, pero pensado para lograrse con práctica y buena coordinación.
- **Qué desbloquean las Lunas:**
  - las cajas doradas de la bodega;
  - el logro «Noche de lunas»;
  - con las 100 Lunas y las 300 estrellas, el título **Leyendas del súper**: vitrinas doradas en todas las tiendas.
- **Metas nivel por nivel:** están en la última columna de [`niveles.md`](niveles.md).

### 🏆 Logros y coleccionables
Todo el detalle está en [`logros.md`](logros.md), que genera `juego/datos/logros.py`.
- **24 logros con 3 rangos** (bronce, plata y oro): reponer vitrinas, cero clientes perdidos, propinas, limpieza, ladrones, niños devueltos, wafles, arepas, combos en pareja, Lunas…
- **8 logros especiales:** dueños de cada tienda, equipo completo de ayudantes, «Feliz aniversario» (nivel 100) y «Leyendas del súper».
- **Coleccionables:**
  - **100 corazones escondidos:** uno por nivel; aparece un momento y hay que tocarlo. Cada 10 corazones abren una página del álbum de recuerdos.
  - **30 figuritas de clientes:** bronce, plata y oro por cada tipo de cliente.
  - **9 cajas doradas.**
  - **8 recetas nuevas:** por ejemplo, arepa de choclo y wafle de arequipe.
  - **4 postales:** de lugares especiales para ustedes.

### Recompensas por estrellas (300 en total)
| Estrellas | Recompensa |
|---|---|
| Cada 10 ⭐ | Un **recuerdo** en el álbum de la pareja: una foto o un mensaje que ustedes cargan en la app |
| 30 ⭐ | Delantales de barrio para Él y Ella |
| 75 ⭐ | Decoración especial: guirnaldas con sus iniciales |
| 150 ⭐ | Nuevos peinados y ropa |
| 225 ⭐ | Música de la tienda: su canción |
| 300 ⭐ | Final secreto del aniversario |

---

## 10. Modos de juego: en solitario y en pareja

Desde el menú principal se elige cómo jugar.

| | **Solitario** | **Pareja en línea** |
|---|---|---|
| Personajes | Solo el que elijas (Él o Ella) | Cada uno el suyo, desde su celular |
| Clientes por día | Los de la tabla (columna solitario) | ×1.5 (columna pareja) |
| Metas de estrellas | Escaladas a un jugador | Escaladas a dos jugadores |
| Objetivo «equipo» | % de clientes felices | Combos en pareja |
| Partida guardada | Una propia para cada uno: «la de Ella» y «la de Él» | Una compartida: «la de los dos» |

- **Son 3 partidas independientes**, cada una con sus 100 niveles, monedas y mejoras. Así ella puede jugar sola a su ritmo sin adelantar ni dañar la partida de los dos.
- **Las estrellas se suman en un solo álbum**: las 3 partidas desbloquean los mismos recuerdos y cosméticos.
- **Ayuda opcional en solitario**: se puede activar un **ayudante automático**, que es el otro personaje manejado por la máquina. Hace tareas simples, como reponer lo que está en rojo o recoger basura, pero con esa ayuda el nivel da como máximo 2 estrellas.
- **En pareja**:
  - Uno crea la sala y el otro entra con un código de 4 letras o una invitación.
  - Si uno se desconecta, el juego se pausa hasta 60 segundos. Si no vuelve, se puede terminar el día solo, con la ayuda automática.
- **Progreso en la nube**: se guarda en el servidor (ver `viabilidad-cooperativo-en-linea.md`), así se puede seguir desde cualquiera de los dos celulares.

---

## 11. Controles en el celular

- **Joystick** (esquina de abajo a la izquierda; en pareja, otro a la derecha para Ella): mueve al personaje. En el computador, WASD o flechas.
- **Quedarse quieto** junto a la bodega, un estante, la caja, el balde, la caneca, la entrada o una mancha hace esa tarea sola.
- **Pasar por encima** recoge basura, productos caídos y canastas, atrapa al ladrón y toma el corazón escondido.
- **Tocar** una vitrina, la caja, una mugre, una canasta, el ladrón o el balde manda al personaje solo (fila de acciones con números); **tocar otra vez** lo mismo lo cancela. Mover el joystick borra la fila.
- Los botones de la **bandeja de abajo** (vitrinas que se acaban) mandan a reponer esa vitrina.
- **Pellizcar** acerca o aleja la cámara.
- La cámara es la misma vista isométrica de los renders de las tiendas.
