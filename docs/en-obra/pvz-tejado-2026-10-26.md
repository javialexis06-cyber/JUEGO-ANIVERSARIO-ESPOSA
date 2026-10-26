# Mundo 5 · el tejado (26 de octubre de 2026)

La aventura de `jardin.html?modo=aventura` pasa de 40 a 50 niveles: 5-1 a 5-10 con ocho plantas, seis enemigos,
la lluvia de colgados (5-5) y el Dr. Zomboid (5-10). Javier pidió continuar «en el orden que consideres» lo que
faltaba; según el [orden de ejecución](pvz-pendientes-2026-10-22.md) toca completar PvZ 1 (P2). Los valores
originales de PvZ 1 cuentan como aprobados, igual que en los mundos anteriores. No se tocaron los patios, el
duelo, la historia nativa de Gardendless ni la granja. La Conquista V1 excluye a propósito las unidades nuevas
de su catálogo, para no alterar su balance.

## Fuentes

Misma [reconstrucción técnica de PC](https://github.com/Patoke/re-plants-vs-zombies/tree/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn)
fijada que usaron niebla y piscina: `Plant.cpp`, `Zombie.cpp`, `Zombie.h`, `Projectile.cpp`, `Board.cpp`,
`Challenge.cpp`, `CutScene.cpp` y `LawnApp.cpp`. Solo se toman datos; no se copia código, arte ni sonido.

## Plantas

| Planta | Sol | Recarga | Regla |
|---|---:|---:|---|
| Coltapulta | 100 | 7,5 s | Col de 40 en parábola de 1,2 s; ignora escudos; no alcanza globos ni túneles. |
| Maceta | 25 | 7,5 s | Capa base; en el tejado toda planta la necesita; solo sobre casilla vacía. |
| Lanzamaíz | 100 | 7,5 s | Grano de 20; uno de cada cuatro lanzamientos es mantequilla de 40 que inmoviliza 4 s. |
| Grano de café | 75 | 7,5 s | Solo sobre un hongo dormido; lo despierta 2 s después. |
| Ajo | 50 | 7,5 s | 400 de vida; quien lo muerde para a los 0,2 s y a los 1,7 s pasa a un carril vecino del mismo terreno. |
| Paraplanta | 100 | 7,5 s | Protege el cuadro de 3×3 de colgados y balones. |
| Margarita | 50 | 30 s | Monedas cada 23,5–25 s (primera a los 3–12,5 s): 90 % plata (10), 10 % oro (50); deja de producir 60 s después de la última oleada. |
| Melonpulta | 300 | 7,5 s | Melón de 80; salpica un tercio (26) a zombis a un carril de distancia, con el tope total de PC. |

En el tejado, los tiros rectos de las dos primeras columnas chocan con la pendiente (regla de sombra < 28 px de
PC). La Pinchohierba no cabe en maceta. No hay cortacéspedes, porque el limpiatejados solo se compra en la tienda.

## Enemigos

| Enemigo | Vida | Regla |
|---|---|---|
| Zombi colgado | 450 | Baja a 800 px/s sobre una casilla (planta 10000, vacía 1, sin repetir casilla ni robar la última productora); espera 3 s y se lleva la planta superior. La Paraplanta lo rechaza. Solo recibe daño abajo. |
| Zombi escalera | 500 + escudo metálico 500 | Corre (80/2,1 px/s) y apoya la escalera en Nuez, Nuez cáscara-rabias o Calabaza; todos los que caminan trepan por ella. El imán retira escaleras cercanas; el Jalapeño las quema. |
| Zombi catapulta | 850 | Vehículo. Desde x≤650 lanza 20 balones de 75, cada 3 s, a la planta más lejana del carril (≥100 px detrás, nunca a la Pinchohierba). Sin balones avanza y aplasta. |
| Gargantúa | 3000 | Destruye toda la casilla de un golpe. Con menos de la mitad de vida y x>400 lanza al diablillo (fórmula de PC, −180 en el tejado). |
| Diablillo | 270 | Vuela hasta caer y luego camina. |
| Dr. Zomboid | 40000 | Solo recibe daño con la cabeza baja. Convoca zombis (según su edad), pisa columnas 5–8, suelta tres colgados, deja caer una caravana (2×3 casillas) y escupe bolas de fuego o hielo. La Seta congelada rompe la de fuego; el Jalapeño, la de hielo de su carril. Cambia de modo al 80 % y al 50 %. |

Las duraciones de animación del jefe (entrada, pisada, cabeza) son aproximadas; los contadores
(5 s, 40–50 s, 55–65 s, 65 s) y probabilidades son los de PC.

## Niveles

Oleadas 10/20/20/30/20/20/30/20/30 y jefe. Macetas iniciales: 5 columnas en 5-1, 4 en 5-2 y 3 desde 5-3.
Los zombis de cada nivel salen de la tabla de PC (`gZombieAllowedLevels`). El zombi nuevo aparece a mitad del
nivel y en la última oleada. Al empezar la última oleada, los colgados traen 2 (5-1, 5-2) o 3 zombis comunes a
las columnas 4–8: es el equivalente en el tejado del alzamiento nocturno.

- **5-5 Lluvia de colgados:** cinta (Maceta 50, Planta carnívora 25, Calabaza 15, Petacereza 10). Puntos ×2.
  Las oleadas enormes intermedias traen solo cinco colgados que roban; el resto de zombis cae del cielo.
- **5-10 Dr. Zomboid:** tejado de noche, sin sol. Cinta inicial Coltapulta, Jalapeño, Coltapulta y Seta
  congelada; después Maceta 55, Melonpulta 10, Jalapeño 12, Coltapulta 10, Lanzamaíz 5 y Seta congelada 8.
  La cinta es un 12,5 % más rápida.

Las dos cintas del tejado usan las reglas completas de PC: la Maceta pierde peso al haber más; un sobre con
tres o cuatro iguales en la cinta baja a 5 o 1; el último pierde la mitad. En el jefe, las lanzadoras escasean
sin macetas vacías y la Maceta pesa 500 durante la caravana. Las cintas de los mundos 1–4 no cambian.

## Guardado y vista

- Progreso: una partida publicada que terminaba en 4-10 abre 5-1 sin acreditar victorias. Las monedas de la
  Margarita se suman al progreso aunque se pierda, como en PC. La tienda sigue pendiente.
- Instantánea del motor: tiros parabólicos, monedas, escaleras y estado del jefe se guardan y se reanudan iguales.
- Plantas con arte original (pedido de Javier del 26 de octubre, tras rechazar las versiones vectorial y de
  Blender): siete salen de Gardendless 0.16.0, el distribuible PvZ2 ya fijado en `motores.lock.json`
  (Coltapulta, Maceta, Lanzamaíz, Ajo, Paraplanta, Margarita y Melonpulta, variantes DIS en pose de reposo);
  el Grano de café, que Gardendless no tiene, se arma desde `Coffeebean.reanim` y sus piezas de PvZ 1
  (`scripts/arte-tejado/reanim.py`, resolución nativa) del repositorio
  [ruslan831/PlantsVsZombies-decompilation](https://github.com/ruslan831/PlantsVsZombies-decompilation). `scripts/arte-tejado/capturar-gardendless.mjs` las
  captura sobre negro y blanco y `montar-plantas.py` calcula el alfa y arma la hoja. Ese arte pertenece a
  PopCap/EA; ninguno de estos repositorios lo licencia. El estilo PvZ2 difiere de las hojas ilustradas de
  los mundos 1–4.
- Escenarios originales de PvZ 1 (mismo repositorio): `background5.jpg` de día y `background6boss.jpg` para el
  jefe de noche. `scripts/arte-tejado/fondo-original.py` sube cada columna lo que baja la pendiente de PC
  (20 px por columna en las cinco primeras) para que las tejas coincidan con el tablero plano de la vista, y
  los deja del tamaño del lienzo (1100×650), que se dibuja 1:1 sin velos de fila ni noche simulada.
- Arte propio vectorial (`scripts/arte-tejado/`): hoja de accesorios (escalera, catapulta, poste, balón,
  robot, caravana, bolas). El colgado,
  el zombi escalera, el gargantúa y el diablillo reutilizan los cuerpos con ropa ya aprobados más sus
  accesorios. El gargantúa es un cuerpo agrandado con poste: falta un diseño propio. El robot del jefe es una
  cabeza con cuello; no tiene un cuerpo animado completo.

## Comprobaciones

- `probar-pvz-tejado-reglas.mjs`: 19 reglas preparadas (las de arriba, guardado a mitad de combate y avance
  desde 4-10).
- `probar-pvz-tejado.mjs`: 50 partidas con el piloto (5 semillas por nivel), solo órdenes ordinarias y
  contabilidad exacta de sol y monedas. Victorias del piloto: 5-1 4/5, 5-2 4/5, 5-3 4/5, 5-4 3/5, 5-5 0/5,
  5-6 5/5, 5-7 1/5, 5-8 2/5, 5-9 2/5, 5-10 0/5. Cada nivel normal se ganó al menos una vez con órdenes legales.
  **El piloto no ganó la lluvia de colgados ni al jefe:** no se certifica que sean superables con recursos
  normales ni se ajustó su dificultad. Requieren una partida humana o un piloto mejor.
- `probar-pvz-instancias.mjs`: los mundos 1–4 siguen ganándose como antes; en el tejado se exige que la
  partida termine y que guardar y reanudar dé el mismo resultado exacto.
- La campaña real con guardado de `probar-pvz-guardado.mjs` cubre los primeros 40 niveles.
- Capturas en Chromium (844×390) de 5-6 y 5-10 con el piloto: escenario, macetas, catapulta, robot, bola de
  hielo y barra del jefe.
