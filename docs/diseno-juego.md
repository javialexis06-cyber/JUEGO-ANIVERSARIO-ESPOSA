# Súper Manía en Pareja: estudio y diseño del juego

Este documento reúne cómo funcionaban **Supermarket Mania** (2008) y **Supermarket Mania 2** (2010) de G5 Games y define qué tomamos de cada uno para la versión en pareja. De aquí sale la lista de componentes que se modelan y renderizan en Blender.

---

## 1. Cómo funcionaba Supermarket Mania

### Supermarket Mania 1 (2008)
- Protagonista: **Nikki**, que trabaja en tiendas de su barrio y compite contra **TORG**, una cadena de supermercados manejada por robots.
- **5 tiendas** y **50 niveles**. Cada nivel es **un día de trabajo** con una **meta** de dinero y una **meta experta** más exigente.
- **7 tipos de cliente**. La abuela es lenta y paciente; el ejecutivo o yuppie es rápido e impaciente. Los adolescentes compran bien, pero a veces se alborotan y tiran basura. Los ladrones nunca compran: caminan pensando qué robar. De vez en cuando llegan estrellas de cine.
- Al empezar cada día el juego muestra **qué productos prefiere cada tipo de cliente**.
- **Reponer desde el almacén** es el corazón del juego:
  - Nikki carga el carrito en el almacén y toca los estantes vacíos.
  - Un carrito lleno alcanza para unos **5 estantes**; con la mejora, **7**.
  - Luego hay que volver al almacén.
- Si un estante está vacío, el cliente **espera y pierde paciencia**; si tarda demasiado, se va de la tienda.
- **Basura en el piso**: hace tropezar a los clientes. Hay que recogerla y llevarla a la **caneca de reciclaje**.
- **Más de 12 productos** y **más de 20 mejoras**: alimentos más caros, almacén más eficiente, carrito más grande, etc.

### Supermarket Mania 2 (2010)
- Nikki y sus amigos (Clarence, **Wendy**, Max) llegan a *Tinseltown* a salvar la cadena de su tío Ross del malvado Mr. Torg.
- **6 ambientes**: centro de la ciudad, suburbios, playa soleada, estación de esquí, el edificio más alto y un sexto escenario especial.
- **80 niveles**, **34 productos**, **11 tipos de cliente** y **200 mejoras**.
- Clientes con velocidad y paciencia propias:
  - **Señora mayor**: lenta y muy paciente.
  - **Chica**: rápida, paciencia media; le gustan el banano, las uvas, el brócoli, el pescado y el queso.
  - **Yuppie**: velocidad media, poca paciencia; le gustan la piña, la naranja, el pollo, la salchicha y las papitas.
  - Otros tipos del juego que no confirmé en las fuentes; por eso no los detallo.
- Personajes especiales:
  - **La celebridad**: cuando entra, todos dejan de comprar para mirarla.
  - **La niña traviesa**: hace desorden.
  - **El niño perdido**: hay que llevarlo con su mamá.
  - **Ladrones y vándalos**: hay que avisar al guardia.
- **Productos que se preparan en la tienda**:
  - **Malteadas**: llevar leche y helado a la máquina y esperar a que estén listas.
  - Café, croissants, jugo natural y pizza fresca.
- **Tareas extra**:
  - limpiar derrames y productos caídos;
  - devolver niños perdidos;
  - **devolver canastas abandonadas** a su puesto junto a la puerta (sin canastas no pueden entrar más clientes).
- **Ayudantes que se compran como mejora**:
  - **Cajera** (Wendy cobra en la caja).
  - **Guardia de seguridad**: calma a la niña traviesa y detiene ladrones.
  - **Limpiador automático de pisos**: mejora de tercer nivel.
- **Mejoras**:
  - estantes más grandes y un carrito más grande;
  - máquinas más rápidas y cámaras de seguridad;
  - **decoración que aumenta la paciencia** de los clientes;
  - una mejora que **limpia toda la tienda** de un golpe.
- **Paciencia**: una carita sobre cada cliente que pasa de feliz a roja.
- **Interfaz**, según tus capturas:
  - barra de dinero con la meta (p. ej. 528/240);
  - clientes atendidos y clientes perdidos (2/3 y 0/2);
  - reloj del día («CLOSED» al cerrar), botón de pausa y menú.

### Qué se ve en tus capturas (SM2)
- **Vista isométrica** de la tienda completa, sin paredes delanteras.
- **Entrada** con torniquetes y flechas de entrar/salir, y **puesto de canastas** amarillas junto a la puerta.
- **Caja registradora**: mostrador rayado rojo/blanco con banda y registradora, en la esquina de la entrada.
- **Almacén** en una esquina: puerta roja y estantería con cajas de cartón.
- **Vitrinas refrigeradas** curvas de vidrio (pescado, pollo, queso).
- **Cajas de frutas y verduras** amarillas escalonadas (naranjas, piñas, tomates, brócoli).
- **Congeladores** azules tipo baúl, **estantes de alambre** de 2 pisos, **mesas de bebidas**, **repisas de madera** para pan, una **estación de café** y una **máquina de dulces**.
- **Caneca azul de reciclaje**, **trapero con balde**, **materas con flores**, globos y adornos.
- Personal: **guardia**, **cajera** y la protagonista con **carrito amarillo** de reposición.
- **Globo de pensamiento** sobre el cliente con el producto que busca.

---

## 2. Nuestra versión: Súper Manía en Pareja

### Idea central
Él y Ella manejan juntos una cadena de supermercados. Cada uno controla **su propio personaje desde su propio teléfono** (cooperativo en línea Medellín–Bucaramanga). El control es el clásico de Supermarket Mania: **tocar para encolar tareas** (almacén, estante, caja, derrame, ladrón), y el personaje las cumple en orden.

### Cómo se juega un día
1. Se abre la tienda. Al comienzo se muestran los clientes del día y sus productos favoritos (como en SM1).
2. Los clientes entran, toman una **canasta** y van de vitrina en vitrina. Sobre cada uno aparece un **globo con el producto** que busca y su **carita de paciencia**.
3. Si la vitrina está vacía, el cliente espera. Uno de los dos va al **almacén**, llena el **carrito** y repone.
4. El cliente va a la **caja**. Alguien tiene que cobrar hasta que se contrate un ayudante.
5. Mientras tanto aparecen problemas: derrames, basura, canastas abandonadas, niños perdidos, ladrones, la niña traviesa, la visita de un famoso.
6. Al cerrar se cuentan el dinero, las propinas y los combos. **Meta** = pasar el día; **meta experta** = estrella dorada.
7. Entre días, la **tienda de mejoras**: comprar niveles de vitrinas, máquinas, ayudantes y decoración.

### Lo que añadimos por ser en pareja
- **Combo en equipo**: si los dos atienden al mismo cliente seguido (uno repone y el otro cobra), las propinas se duplican. Un **choque de manos** animado lo celebra.
- **Pedidos para dos**: productos especiales que se preparan entre los dos, por ejemplo una torta de aniversario (uno trae los ingredientes, el otro hornea).
- **Día especial de aniversario**: un nivel sorpresa con decoración, música y mensaje final.
- **Tiendas en lugares de ustedes** (propuesta, a confirmar): tiendita en Bucaramanga, minimercado en Medellín, súper en la costa, súper cafetero en la montaña e hipermercado de ciudad.

### Niveles de supermercado (la tienda crece)
Cada nivel es una tienda más grande, con más secciones y más problemas:

| Nivel | Tienda | Tamaño y secciones | Novedades |
|---|---|---|---|
| 1 | **Tiendita de barrio** | Local pequeño: 3–4 vitrinas, 1 caja, almacén chico | Reponer, cobrar, basura |
| 2 | **Minimercado** | Más pasillos: frutas, lácteos, abarrotes, 1–2 cajas | Derrames, canastas abandonadas, ladrones |
| 3 | **Supermercado** | Congeladores, vitrina refrigerada, panadería, máquina de malteadas | Productos preparados, niño perdido, cajera |
| 4 | **Hipermercado** | Tienda grande y decorada: café, jugos, pizza, todas las secciones | Celebridad, niña traviesa, guardia, limpiador automático |

### Vitrinas y sus niveles de mejora
Cada vitrina tiene **3 niveles**. Al subir de nivel gana **capacidad** (menos viajes al almacén) y **atractivo** (los clientes compran más y esperan con más paciencia).

| Vitrina | Nivel 1 | Nivel 2 | Nivel 3 |
|---|---|---|---|
| Estante de abarrotes | Repisa de madera de 2 pisos | Góndola metálica de 3 pisos | Góndola grande iluminada con letrero |
| Frutas y verduras | Guacales de madera en el piso | Puesto escalonado de canastas | Puesto de mercado con toldo |
| Nevera de lácteos | Nevera pequeña de una puerta | Nevera de puertas de vidrio | Isla refrigerada abierta |
| Vitrina refrigerada (carnes, pescado, quesos) | Vitrina curva pequeña | Vitrina larga iluminada | Isla doble de charcutería |
| Congelador (helados, congelados) | Baúl pequeño | Baúl con tapa de vidrio | Isla congeladora doble |
| Panadería | Canasto de panes | Repisa de panadería | Vitrina de pastelería con horno |
| Bebidas | Canasta de alambre | Enfriador de bebidas | Enfriador grande con dispensador |
| Caja registradora | Mostrador con registradora | Caja con banda transportadora | Caja moderna con escáner y pantalla |
| Máquinas especiales (malteadas, café, jugo, horno) | Básica y lenta | Más rápida | Rápida y con doble tanda |
| Carrito de reposición | 5 reposiciones | 7 reposiciones | 9 reposiciones y más veloz |
| Almacén | Puerta con cajas | Estantería ordenada (reposición más rápida) | Banda transportadora |

### Clientes
| Cliente | Velocidad | Paciencia | Comportamiento |
|---|---|---|---|
| Abuelita | Lenta | Muy alta | Compra poco y con calma |
| Ejecutivo apurado | Rápida | Muy baja | Se va rápido si algo falta |
| Mamá con niño | Media | Media | Compra mucho; el niño a veces se pierde |
| Chica deportista | Rápida | Media | Frutas, bebidas, yogur |
| Adolescente con audífonos | Media | Media | Deja basura y derrames |
| Chef | Media | Media | Compra mucho de una sola sección |
| Turista | Lenta | Alta | Se detiene a mirar y compra de todo un poco |
| Niña traviesa | Rápida | — | Tumba productos; la calma el guardia |
| Famoso | Lenta | — | Todos se detienen a mirarlo; propina grande si se atiende rápido |
| Ladrón | Rápida | — | No compra: roba. Se atrapa tocándolo o con el guardia |

### Ayudantes (se contratan como mejora)
- **Cajero(a)**: cobra solo en una caja.
- **Reponedor**: repone una sección.
- **Guardia**: detiene ladrones y calma a la niña traviesa.
- **Aseo**: limpia derrames y basura, y más adelante un **robot limpiador**.

### Decoración y mejoras de paciencia
Plantas, globos, música ambiental (parlante), aire acondicionado, pantalla de ofertas, bancas y letreros de oferta.

### Economía
- Cada producto tiene precio de venta. Los productos preparados valen más.
- **Propinas** por atender rápido y por combos en equipo.
- **Estrellas** por día (meta y meta experta) que desbloquean tiendas nuevas.
- El dinero se gasta en mejoras.

---

## 3. Catálogo de componentes a modelar y renderizar

1. **Personajes**: Él y Ella (aprobados en estilo plastilina), clientes (10 tipos) y ayudantes (4 uniformes).
2. **Niveles de supermercado**: 4 tiendas completas en vista isométrica de juego.
3. **Vitrinas**: 11 tipos × 3 niveles, llenas de producto.
4. **Productos** (≈24):
   - Frutas y verduras: manzana, banano, naranja, piña, uvas, tomate, brócoli, zanahoria.
   - Lácteos y refrigerados: leche, queso, yogur, huevos.
   - Carnes: pollo, pescado, salchichas.
   - Panadería: pan, croissant, torta.
   - Abarrotes: cereal, enlatados, arroz.
   - Bebidas: gaseosa, jugo, agua.
   - Congelados y snacks: helado, papitas, galletas.
   - Preparados: malteada, café, pizza.
   - **Cajas de reposición** por categoría.
5. **Utilería**:
   - Compras: carrito de reposición, canasta de cliente y puesto de canastas.
   - Tienda: torniquetes de entrada, carretilla con cajas del almacén.
   - Limpieza: trapero y balde, charco, basura, caneca de reciclaje, cono de piso mojado.
   - Cobro y decoración: bolsa de compras, monedas y billetes, planta, globos, parlante, letrero de oferta, cámara de seguridad.
6. **Máquinas**: malteadas, café, exprimidor de jugos, horno de pan y horno de pizza.
7. **Íconos 3D de interfaz**:
   - Juego: globo de pensamiento, caritas de paciencia (feliz, normal, enojada), moneda, estrella, reloj.
   - Pareja: corazón (combo en equipo).

---

## Fuentes consultadas
- [Supermarket Mania 2 Review – Gamezebo](https://www.gamezebo.com/reviews/supermarket-mania-2-review/)
- [Hints and Tips for Surviving Supermarket Mania 2 – GameYum](https://www.gameyum.com/family-friendly-games/98368-supermarket-mania-2-tips-for-the-food-shopping-gamer/)
- [PC Game Review: Supermarket Mania 2 – Gear Diary](https://geardiary.com/2010/12/16/pc-game-review-supermarket-mania-2/)
- [Review Supermarket Mania 2 – From Val's Kitchen](https://www.fromvalskitchen.com/supermarket-mania-2/)
- [Review Supermarket Mania 2 – Mom Knows It All](https://valmg.com/supermarket-mania-2/)
- [Supermarket Mania Review – Pocket Gamer](https://www.pocketgamer.com/supermarket-mania/review-4001/)
- [Supermarket Mania (2008) – MobyGames](https://www.mobygames.com/game/49242/supermarket-mania/)
- [Review: Supermarket Mania – DualShockers](https://www.dualshockers.com/guest-review-supermarket-mania/)
- [Supermarket Mania Review – Gamezebo (2008)](http://www.gamezebo.com/2008/04/29/supermarket-mania-review/)
- [Supermarket Mania Journey – G5](https://www.g5.com/games/supermarket-mania-journey)
- [Supermarket Mania Journey Strategy Guide – Noodle Arcade](https://noodlearcade.com/supermarket-mania-journey-strategy-guide)
- [Supermarket Mania 2 – GameFAQs](https://gamefaqs.gamespot.com/pc/612006-supermarket-mania-2/data)
