# Campaña: territorios, tienda, cupo, tutorial y balance (30 de octubre de 2026)

Javier pidió:

- territorios que cubran todo el mapa (el morado ocupándolo todo, sin cuadros de color);
- pruebas de balance completas de la campaña;
- mejorar lo visual que se viera pobre y que se entienda para qué sirve cada cosa;
- un tutorial que explique la campaña y cada mecánica nueva cuando aparece;
- comprar las plantas con monedas ganadas al capturar zonas, con un número de plantas por zona.

Dejó el balance a criterio de Claude ("el balance que decidas para el juego").

## Territorios del mapa (`src/jardin/conquista/territorios.ts`)

- Cada marcador (país, ciudad o área) reclama la parte del dibujo más cercana. Las fronteras se ondulan con ruido
  determinista, así que el mapa entero queda repartido sin rectángulos.
- Se pinta en un lienzo de 384×216 que el navegador escala con suavizado. Encima va una textura de pincel: rayado
  diagonal en lo zombi, punteado en lo nuestro y un halo junto a cada frontera.
- Estados:
  - **verde**: nuestra;
  - **borde rojo**: en combate;
  - **morado con borde dorado**: se puede recuperar ahora;
  - **morado oscuro**: sin ruta;
  - **franjas verdes sobre morado**: país o ciudad a medio recuperar.
- En el mundo y en los países el mar se tiñe menos (se detecta el azul del dibujo).
- Tocar cualquier punto de un territorio equivale a tocar su marcador.

## Economía (`src/jardin/conquista/economia.ts`, guardado v7)

- **Explorar ya no regala plantas.** Se empieza con Lanzaguisantes, Girasol, Nuez y Petacereza.
- **Monedas por captura (una sola vez por área)**: base según el tipo × (1 + 0,15 × país).

  | Tipo | Base |
  |---|---|
  | Residencial | 50 |
  | Vía | 40 |
  | Zona especial | 60 |
  | Suministros | 75 |
  | Fortaleza | 120 |

  La casa paga 300, lo justo para Repetidora y Patatapum, como en el diseño original de la estación. Perder un área y
  recuperarla no vuelve a pagar.
- **Resistir un asedio**: 5 × (1 + 0,1 × país), redondeado a 5.
- **Tienda**: 183 plantas. Cada una pertenece al país donde antes se desbloqueaba y se vende cuando ese país está a
  tu alcance (una de sus áreas es tuya o se puede atacar).
  - Precio: máx(75, 40 + 0,8 × soles) × (1 + 0,15 × país), redondeado a 25.
  - Las mentas (recarga larga) se cobran como si costaran 200 soles.
- **Cupo de semillas por área**: 4 + ⌊dificultad / 8⌋, más 1 en fortalezas, en áreas con agua y en tableros de 6 o 7
  carriles, hasta 8. La casa admite 5. Las formaciones guardadas antes con más semillas se conservan; al editarlas se aplica el cupo.
- **Migración v6 → v7**:
  - las plantas que ya tenías quedan como heredadas, gratis;
  - las áreas ya capturadas cuentan como cobradas, sin monedas;
  - se empieza con 0 monedas.

  No se quita nada ni se regalan recursos. La validación exige que las monedas cuadren con lo cobrado y lo gastado.

## Interfaz

- **Cabecera del mapa**:
  - ruta Mundo › País › Ciudad, con regreso;
  - áreas recuperadas de 240;
  - leyenda con solo los colores que hay en el mapa visible;
  - monedas con acceso a la tienda.
- **Marcadores**: el nombre va en una tablilla oscura legible sobre el dibujo. El ícono y una etiqueta dicen el estado
  (Despejada, Frontera n/6, recompensa en monedas, 🔒 Fortaleza, Sin ruta, ¡En combate!). Países y ciudades muestran
  su avance (n/20, n/5).
- **Herramientas**: llevan su nombre debajo (Ciudad, Subir, Tienda, Pausa, Guía, Pantalla, Salir). Javier pidió quitar
  Exportar e Importar: el guardado es automático y solo se ofrecen en las ventanas de error del guardado.
- **Ficha de zona**: tipo, país y ciudad, carriles, agua, noche, cupo y recompensa. Debajo, los zombis que trae (como la
  vista previa antes de cada nivel de PvZ) y, si aún no tiene formación, una pista para elegirla.
- **Inicio**: el texto de Dave se acortó a lo esencial; el resto lo explica el tutorial al aparecer.
- **Editor de formación**:
  - pergamino legible y contador n / cupo con ranuras vacías;
  - familia y coste en soles de cada planta, y dónde está reservada;
  - acceso a la tienda.
- **Tienda**: pestañas A la venta, Próximamente (con el país que la abre) y Tus plantas.

## Tutorial (`src/jardin/conquista/tutorial-campana.ts`)

Dave explica cada tema una vez, encima de la ventana abierta o pausando los frentes, y al aceptarlo se vuelve a
donde estabas. Lo visto se guarda aparte del guardado de la historia. Temas y cuándo aparecen:

- **Al ganar la casa**: el mapa, y después las monedas y la tienda.
- **Al abrir algo por primera vez**: la formación (editor), una fortaleza, el agua y la noche (ficha de zona) y cada
  país nuevo.
- **Cuando ocurre**: el primer asedio, varios frentes a la vez, la primera zona despejada, el descanso tras una
  victoria, las fusiones y una ruta cortada.

El botón Guía reúne todos los temas. En las pruebas automáticas (`?prueba`) el tutorial solo aparece con `&tutorial`.

## Prueba de balance (`scripts/balance/`)

- `plan.mjs`: jugador simulado sobre el motor de la historia. Recorre las 240 áreas en el orden en que se abren,
  cobra capturas y asedios y compra con una regla sensata:
  1. lo básico barato de cada papel;
  2. las plantas nuevas del país donde está;
  3. mejoras del atacante.

  Arma cada formación con el cupo: nenúfar si hay agua, sol barato, atacante barato (hasta 125 soles), el mejor
  atacante que el área pueda pagar (tope de 200 soles con cupo 4 y 50 más por cada semilla extra), muro e
  instantáneo. Las plantas de alcance corto o de apoyo (Humoseta, Melancoseta, Boca de dragón…) no las usa: el piloto
  las sembraría atrás, donde no alcanzan a nadie.
- `jugar.mjs`: un piloto automático juega cada área en **Gardendless real**, por la ruta de la interfaz (carta, coste,
  recarga y casilla legal). Recoge los soles y decide por carril, como una apertura normal de PvZ:
  1. instantáneos de emergencia (también contra cualquier zombi pegado a la casa);
  2. ningún carril con zombis sin atacante; si no alcanza, guarda los soles para eso;
  3. soles primero (hasta dos columnas) mientras ningún carril esté en aprietos;
  4. entre 2 y 5 atacantes según la amenaza, ahorrando para el atacante principal cuando todo está cubierto;
  5. muros y minas.

  Registra la victoria o la derrota, las podadoras gastadas, qué tan cerca llegaron los zombis y cuáles entraron.
- Hallazgos y cambios hechos con esta prueba:
  - Las oleadas generadas eran demasiado grandes desde la primera (17 zombis contra 150 soles en Nubaria). Ahora
    empiezan pequeñas, crecen dentro del nivel y entre países sube sobre todo la calidad de los zombis.
  - Los especiales se ordenan de fácil a exigente: voladores, máquinas y gargantúas al final, y aparecen más despacio.
  - Los trineos no se generan sueltos: sin el hielo de la zamboni no tienen sentido.
  - La primera oleada venía con un 60 % de zombis blindados o especiales: el piloto perdía áreas antes de armar su
    economía. Ahora, como en PvZ, los primeros zombis del nivel son básicos y la proporción de blindados y especiales
    sube con cada oleada y con el país (de 0–35 % en la primera oleada a 65–90 % en la última). Los gargantúas sueltos
    solo aparecen en la segunda mitad del nivel.
  - El futbolista, el superfán y el troglobita cuentan como especiales exigentes (aparecen al final de cada país): el
    futbolista causó 3 de las 4 derrotas del primer país.
  - Los tableros de 6 o 7 carriles admiten una semilla más (un área nocturna de 7 carriles con 4 semillas era imposible
    de cubrir).
  - Las 12 zonas originales conservan su composición aprobada.

El piloto no es un jugador humano: sirve para encontrar áreas imposibles o regaladas, no para certificar la
experiencia. Los resultados finales se anotan abajo.

### Resultados

(pendiente: se completan al terminar la corrida de las 240 áreas)
