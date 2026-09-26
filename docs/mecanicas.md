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
Sobre cada cliente hay una **carita** que cambia de feliz (verde) a normal (amarilla) y a enojada (roja). La paciencia baja cuando:
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

### Cómo se repone con toques (como en Supermarket Mania)
1. **Tocas la vitrina** que quieres reponer. Aparece un **número flotante (1, 2, 3…)**: esa acción entró a tu **cola de acciones**.
2. Tu personaje **camina a la bodega** y **toma la caja de esa sección**.
3. Vuelve por el pasillo **empujando el carrito** hasta la vitrina.
4. **La rellena**: la animación dura de 1 a 2 segundos, los productos aparecen con un brillo y la barra vuelve a verde.

**Truco de planeación:**
- Si tocas **varias vitrinas seguidas**, el personaje hace **un solo viaje** a la bodega y carga todas las cajas de una vez.
- Cuántas caben depende del **carrito de reposición**:
  - **Nivel 1:** 5 cajas por viaje.
  - **Nivel 2:** 7 cajas.
  - **Nivel 3:** 9 cajas y camina más rápido. Es el carrito eléctrico.
- **Una caja rellena una vitrina completa.** Si la vitrina está a medias, la caja igual la deja llena.
- **Cada tienda nueva empieza con el carrito de nivel 1.**

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
- **Tocas la caja** para atender: cada cliente tarda según el nivel de la caja.
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

| Problema | Qué pasa | Cómo se resuelve |
|---|---|---|
| **Derrame** | Los clientes se resbalan y se enojan | Tocar el charco: el personaje trae el trapero y pone el aviso de piso mojado |
| **Basura** | Baja la paciencia de todos los que están cerca | Tocarla para recogerla y llevarla a la caneca |
| **Ladrón** | Toma productos y corre a la salida | Tocarlo para atraparlo, o dejar que lo detenga el guardia |
| **Niño perdido** | Llora; la mamá no se va sin él | Llevarlo con la mamá |
| **Niña traviesa** | Tumba productos: la vitrina baja de golpe | Calmarla tocándola, o con el guardia |
| **Famoso** | Todos se detienen a mirarlo | Atenderlo rápido: deja una propina enorme |

---

## 7. Jugando en pareja (cooperativo)

- **Cada uno controla su personaje** desde su celular, con su propia **cola de acciones**. Los números de ella se ven de otro color.
- **No se duplican tareas**: si Él ya va a reponer los lácteos, a Ella le aparece esa vitrina con la carita de Él y no la puede tomar.
- **Marcar para el otro**: si mantienes el dedo sobre algo, le pones un marcador al otro, por ejemplo «¡ve tú a la caja!».
- **Combo en equipo** (ícono de corazón): pasa cuando los dos atienden al mismo cliente o terminan tareas juntos en pocos segundos (uno cocina y el otro entrega; uno repone y el otro cobra). Da **propina doble** y llena la barra de corazón.
- **Roles sugeridos** (no son obligatorios): uno se encarga de **reponer** y el otro de la **caja, la limpieza y las zonas especiales**.
- **Jugar solo**: se puede jugar con un solo personaje, o controlar a los dos alternando.

---

## 8. Números iniciales de balance (se ajustan probando)

| Vitrina | Capacidad nivel 1 | Nivel 2 | Nivel 3 | Qué mejora además |
|---|---|---|---|---|
| Estante de abarrotes | 8 | 12 | 18 | Más atractivo: los clientes compran 1 extra a veces |
| Frutas y verduras | 8 | 12 | 18 | |
| Nevera de lácteos | 6 | 10 | 15 | |
| Vitrina de carnes | 4 | 8 | 12 | |
| Congelador | 6 | 10 | 15 | |
| Panadería | 6 | 10 | 14 | |
| Bebidas | 8 | 12 | 18 | |
| Zonas especiales (vitrina / cocinas) | 3 / 1 | 5 / 2 | 8 / 3 | Cocina más rápido |
| Caja registradora | 6 s por cliente | 4 s | 2.5 s | |
| Carrito de reposición | 5 cajas | 7 cajas | 9 cajas y +30 % de velocidad | |

- Un producto vale entre 2 y 8 monedas; los productos preparados valen entre 10 y 15.
- La propina va de 0 a 5 según la carita, y se duplica con el combo en equipo.

---

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

### Dificultad
- Cada día llegan más clientes: por ejemplo, 8 el primer día de la tiendita y 32 el último del hipermercado, jugando en solitario.
- La paciencia baja poco a poco.
- Las listas pasan de 1 a 4 productos.
- Van apareciendo clientes y problemas nuevos. Cada novedad llega sola y con un aviso corto de cómo se resuelve.

### Pasar de tienda
- Para abrir la siguiente tienda hay que **terminar el día 25** y tener **al menos 45 de las 75 estrellas** de esa tienda. Así, a veces conviene volver a sacar estrellas.
- En la tienda nueva **se empieza de cero**: vitrinas de nivel 1, lo mínimo para funcionar y el carrito de nivel 1.
- Las **monedas** son de cada tienda: se gastan en sitios y mejoras y no pasan a la siguiente.
- Las **estrellas** son para siempre y desbloquean recompensas.

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

- **Tocar** una vitrina, la caja, un charco, un cliente o una máquina agrega esa acción a tu cola.
- **Tocar dos veces** una acción de la cola la cancela.
- **Mantener el dedo** pone un marcador para tu pareja.
- **Pellizcar** acerca o aleja la cámara (en las tiendas grandes).
- La cámara es la misma vista isométrica de los renders de las tiendas.
