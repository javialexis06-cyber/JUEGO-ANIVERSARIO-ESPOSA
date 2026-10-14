# Builds de Lavado al llegar a los 30 minutos · 14 de octubre de 2026

Javier pidió los equipos y mejoras de tienda de las cuatro partidas que siguieron matando enemigos al final.
Se repitieron esos cuatro casos con el motor corregido y los nuevos hallazgos aprobados; sus resultados se
conservaron. Personaje **Él/Panda**, ataque automático, modo **normal**, semilla **1000**, maestría inicial 0,
sin cartas mágicas equipadas ni disponibles, y sin bonos iniciales de patitos. Armas y pasivas se consiguen con
cartas ofrecidas y cofres durante la partida. La tienda está **preparada al máximo salvo Maldición**: no son
cuatro campañas de compras pagadas desde cero y no se presentan como compras mínimas necesarias.

Al llegar a **30:00**, el motor retira los comunes y aparece la Muerte. Las bajas de la última columna corresponden
a **29:00–29:59**, no a muertes de la Parca. Estos equipos ganaron por tiempo y luego cayeron frente a ella.

## Equipos exactos

Las armas evolucionadas figuran 1/1 porque ya están evolucionadas. Las demás armas están en su nivel 8; las
pasivas al 5 excepto Espejo doble, cuyo máximo es 2.

| Mapa | Seis armas | Seis pasivas | Bajas en el último minuto |
|---|---|---|---:|
| Cara | Toallazo de vapor 1/1; Peinilla bumerán 8/8; Esponjas eternas 1/1; Tormenta de bombillos 1/1; Perfume 8/8; Patico amarillo 8/8 | Jabón extra fuerte 5/5; Espejo doble 2/2; Reloj de arena 5/5; Crema hidratante 5/5; Sales de baño 5/5; Corona de espuma 5/5 | 1.995 |
| Lavamanos | Toallazo de vapor 1/1; Burbujero sin fin 1/1; Esponjas eternas 1/1; Aura de espuma 8/8; Botellitas de agua 8/8; Jabón resbaloso 8/8 | Pantuflas veloces 5/5; Espejo de aumento 5/5; Crema hidratante 5/5; Reloj de arena 5/5; Sales de baño 5/5; Jabón extra fuerte 5/5 | 1.332 |
| Bañera | Toallazo de vapor 1/1; Burbujero sin fin 1/1; La inundación 1/1; Remolino de champú 1/1; Esponjas orbitales 8/8; Perfume 8/8 | Jabón extra fuerte 5/5; Crema hidratante 5/5; Imán de gotitas 5/5; Reloj de arena 5/5; Espejo de aumento 5/5; Espejo doble 2/2 | 2.596 |
| Ducha | Toallazo de vapor 1/1; Botellitas de agua 8/8; Burbujero sin fin 1/1; Esponjas orbitales 8/8; Tormenta de bombillos 1/1; Espuma devoradora 1/1 | Crema hidratante 5/5; Espejo doble 2/2; Jabón extra fuerte 5/5; Reloj de arena 5/5; Crema de noche 5/5; Espejo de aumento 5/5 | 2.638 |

Durante esas partidas el piloto ganó un bono de patito en Bañera (+0,02 de recuperación por segundo) y otro en Ducha
(+0,01 de duración). Cara y Lavamanos no ganaron bonos de patitos. Esos bonos se obtuvieron durante la partida; no se entregaron como estadísticas iniciales.

## Tienda exacta de los cuatro casos

| Rango comprado | Mejoras |
|---|---|
| 5/5 | Poder, Recuperación, Crecimiento, Codicia, Volver a tirar, Saltar, Vetar, Omni, Encanto, Desarmar |
| 3/3 | Armadura, Vida máxima, Suerte, Conservar |
| 2/2 | Recarga, Área, Velocidad de proyectiles, Duración, Movimiento, Imán |
| 1/1 | Cantidad, Revivir |
| 0/5 | Maldición |

Poder aporta +25 % de daño y Omni otros +10 %; Recarga aporta 5 % de reducción y el Reloj de arena del equipo
aporta el resto (en estos casos quedó 45 % total). Cantidad aporta un proyectil adicional. Los porcentajes no
incluyen todos los bonos del personaje y las pasivas: la tabla es el inventario comprado, no un cambio de balance.

El mismo conjunto de tienda se usa en los cuatro mapas. Que sirva con ese conjunto no demuestra que haga falta
tenerlo completo; el informe anterior incluye cuatro victorias de Cara con mejoras pagadas desde cero.
Tampoco garantiza estas cartas en cualquier semilla ni una victoria sin moverse o esquivar.

## Repetir un caso

```bash
cd juego/web
ESCENARIO=cara DISFRACES=el_panda TIENDAS=toda SEMILLAS=1000 FAMILIAS_ADICIONALES='' PARTIDAS_PAGADAS=0 node scripts/auditar-combate.mjs lavado test-results/build-cara
# Cambiar ESCENARIO por lavamanos, banera o ducha.
```

El informe generado conserva inventario, cartas mágicas, poderes, patitos ganados y bajas por minuto. Es una
simulación de motor con piloto, sin dibujo ni controles de un teléfono físico. Para derrotar a la Muerte
mediante la nueva receta, ver [pruebas de combate](pruebas-combate-lavado-sangre.md).
