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
- **Inicio**: el texto de Dave se acortó a lo esencial; el resto lo explica el tutorial al aparecer. El botón
  «Proteger la casa» solo espera el motor de la casa (antes esperaba también el de la estación, en fila, y en el
  celular parecía colgado en «Preparando semillas…»): en un navegador limpio pasó de unos 95 a unos 48 segundos.
  Si tarda, un aviso explica que la primera vez se descargan unos 100 MB del jardín.
- **Barra en batalla**: en pantallas bajas (cualquier celular en horizontal) la caja invisible de la barra ocupaba
  todo el ancho de abajo y se tragaba los toques del carril inferior del césped: no se podía sembrar ahí y la casa
  caía por ese carril en los asedios. Ahora solo los botones reciben toques, y en batalla la barra queda en Ciudad y
  Pausa (completa tapaba la esquina del césped y un toque a un sol podía abrir «Salir»).
- **Salir** ya no toma por avería los campos que se estaban preparando en segundo plano.
- **Tienda** (1 de noviembre): sin título grande; pestañas, monedas y cerrar en una sola fila, ventana casi a
  pantalla completa y tarjetas más compactas (en 960 × 540 se ven 24 plantas en vez de unas 14).

## Rendimiento con varios combates (1 de noviembre de 2026)

Cada campo es un motor completo de Gardendless y todos corren en el mismo hilo. Cambios, sin tocar reglas:

- **Frentes que no se ven, a 30 Hz**: se simulan en pasos de 1/30 s (la mitad de trabajo) cubriendo el mismo tiempo de
  juego; el paso suelto se da al volver a la vista. Comprobado con dos motores iguales durante 160 s: mismas oleadas,
  plantas que caen en el mismo momento y zombis equivalentes (solo varía el azar fino).
- **Resolución del campo**: se dibuja como mucho al ancho de su diseño (1280 px). Antes, en un celular, Cocos usaba 2
  píxeles por punto (un 75 % más de píxeles en un 844 × 390 sin ganar detalle).
- **Campo visible a 30 cuadros por segundo con tres o más combates** (su lógica sigue a 60 Hz).
- **Modo ligero automático** (4 GB de memoria o 4 núcleos, o menos): densidad 1× y 30 cuadros desde dos combates.
- **Precargas**: con dos o más combates no se crean motores nuevos de precarga; los ya listos se conservan.
- La versión de los scripts del motor sube a `historia7` para que nadie siga con una copia vieja en caché.

Medición en esta máquina (sin tarjeta gráfica: dibujo por software, que no representa un celular), tres combates a la
vez durante 20 s con la misma partida preparada (`scripts/_rendimiento.mjs`, local):

| | Cuadros/s | Cuadro p95 | CPU de la página | Ritmo del juego |
|---|---|---|---|---|
| Antes | 16,9–17,6 | 117 ms | 11,1–13,0 s | 93–95 % |
| Después, sin modo ligero | 17,1–18,1 | 100 ms | 10,0–10,2 s | 96–99 % |
| Después, modo ligero (esta máquina tiene 4 núcleos) | 27,5 | 67 ms (mediana 33 ms) | 11,2 s | 100 % |

Aquí manda el dibujo por software. Sin modo ligero la mejora es moderada (unos 15–20 % menos CPU y combates más cerca
del tiempo real); con el modo ligero (densidad 1× y 30 cuadros) la fluidez sube un 60 % y los combates van a tiempo
real. En un teléfono con tarjeta gráfica la simulación pesa proporcionalmente más; no se midió en un teléfono real.
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
  - La primera corrida completa mostró que la dificultad crecía sin freno (el piloto ganaba 75–88 % hasta Solaria y
    0 % en Nubaria y Umbra). La dificultad efectiva de las oleadas se comprime desde el cuarto país: sube a una quinta
    parte del ritmo anterior; los zombis de cada país y sus especiales siguen cambiando.
  - Más especiales exigentes: el zombi eléctrico y el gemelo del cielo, el pulpo, el pescador y el buceador de la playa
    y el protector del futuro. Los exigentes solo aparecen en la segunda mitad de cada país (sus 10 últimas áreas),
    aunque el país no tenga especiales fáciles. El cielo repetía su zombi pesado en las armaduras 3 y 4; ese hueco usa
    ahora la ligera.
  - Los zombis del cielo (Nubaria) disparan rayos a las plantas desde lejos: el piloto perdía todas sus áreas aun con
    solo zombis básicos. Ese escenario trae el 55 % de los zombis. La playa (Coralia), con dos carriles de agua, trae
    el 85 %.
  - De noche (sin soles del cielo) se empieza con 100 soles y llega el 70 % de los zombis: con las oleadas del día se
    perdían todas las áreas nocturnas de Arenaria y luego la mayoría de las de Forjaria y Neón. Las lápidas siguen la
    dificultad comprimida (máximo 3) y siempre dejan un carril libre. El protector del futuro es especial exigente.
  - Los tableros de 6 o 7 carriles admiten una semilla más (un área nocturna de 7 carriles con 4 semillas era imposible
    de cubrir).
  - Las 12 zonas originales conservan su composición aprobada.

El piloto no es un jugador humano: sirve para encontrar áreas imposibles o regaladas, no para certificar la
experiencia.

Fallos del juego que encontró la prueba (corregidos):

- Las áreas nocturnas con 100 soles no cargaban: el puente de Gardendless solo aceptaba 50 o 150.
- La plántula que deja la bomba atómica impedía guardar el punto de descanso de una victoria ("La defensa no
  respondió"). Ahora queda fuera del punto y se avisa en la consola.
- Comprar en la tienda con el editor de formación abierto hacía fallar el guardado de la formación.

### Resultados (31 de octubre de 2026)

Corrida completa en Gardendless real: las 239 áreas (la casa aparte), una partida por área con la formación y las
compras del plan, a unas 5 veces la velocidad normal y sin dibujar. Coralia se volvió a jugar tras su último ajuste.

| País | Áreas | Victorias del piloto | Día | Noche | Podadoras gastadas por victoria |
|---|---|---|---|---|---|
| 1. Verdalia | 19 | 18 (95 %) | 12/13 | 6/6 | 0,8 |
| 2. Arenaria | 20 | 17 (85 %) | 9/10 | 8/10 | 0,9 |
| 3. Marisma | 20 | 15 (75 %) | 15/20 | — | 1,3 |
| 4. Solaria | 20 | 15 (75 %) | 15/20 | — | 1,4 |
| 5. Coralia | 20 | 15 (75 %) | 15/20 | — | 1,7 |
| 6. Borealia | 20 | 14 (70 %) | 14/20 | — | 1,4 |
| 7. Altarruta | 20 | 9 (45 %) | 8/16 | 1/4 | 1,9 |
| 8. Forjaria | 20 | 9 (45 %) | 6/10 | 3/10 | 1,6 |
| 9. Neón | 20 | 12 (60 %) | — | 12/20 | 1,5 |
| 10. Sauria | 20 | 8 (40 %) | 8/20 | — | 2,5 |
| 11. Nubaria | 20 | 10 (50 %) | 10/20 | — | 0,9 |
| 12. Umbra | 20 | 6 (30 %) | — | 6/20 | 3,2 |

Total: 148 de 239 áreas (62 %), sin errores del motor.

Lectura:

- La dificultad sube a lo largo de la campaña: los cuatro primeros países son cómodos y los últimos piden
  formación y atención. Umbra, el país final y todo de noche, es el más duro.
- El piloto juega peor que una persona: no apunta los instantáneos, no elige plantas según los zombis que vienen
  y en el agua es torpe. Perder una expedición no cuesta progreso (se reintenta). Las cifras son un piso, no la
  experiencia de un jugador.
- Por ciudad: 18 de las 48 ciudades ganan 4 o 5 de sus áreas, 26 ganan 2 o 3, 3 ganan una y solo Puente
  Levadizo (la última de Umbra, con el castillo del Dr. Zomboid) no gana ninguna. El piloto gana 28 de las 48
  fortalezas.

Asedios (muestra): el piloto captura el área y en seguida la misma zona recibe un asedio reforzado con las plantas,
soles y podadoras que quedaron, como en la campaña.

| Asedio | Áreas (2 por país / 1 por país) | Capturas | Asedios resistidos | Perdidos |
|---|---|---|---|---|
| Nivel 3 | 24 | 23 | 19 (83 %) | 41 y 143 (quedaban 6 y 3 plantas), 202 y 203 (cielo) |
| Nivel 6 (el máximo) | 12 | 10 | 8 (80 %) | 58 (Marisma) y 99 (fortaleza de Coralia) |

Los asedios perdidos son de zonas que quedaron casi sin plantas al capturarlas o del cielo, cuyos zombis disparan a
las plantas. Resistir paga 5–10 monedas por asedio.
