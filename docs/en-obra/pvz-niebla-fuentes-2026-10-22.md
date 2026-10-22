# Niebla · fuentes y alcance de las reglas

Referencia: primera aventura de Plants vs. Zombies 1 para PC. Consulta técnica del 21–22 de octubre de 2026.
Los valores originales cuentan como aprobados en el [encargo vigente](../pedidos.md). El motor es propio:
no se incorporan código, imágenes, sonidos ni animaciones de las fuentes consultadas.

## Referencias

- [Reconstrucción técnica de PC](https://github.com/Patoke/re-plants-vs-zombies/tree/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn):
  `Plant.cpp` (definiciones, disparos, magnetismo e iluminación), `Zombie.cpp` (fases, equipo y frío),
  `Board.cpp` (niveles, niebla y emboscadas), `Challenge.cpp` (jarrones y tormenta) y
  `ConstEnums.h` (máscaras de daño).
  La revisión queda fijada para poder contrastar los hechos sin depender de cambios posteriores.
- [Tabla técnica de zombis de PvZ 1](https://wiki.pvz1.com/doku.php?id=教程:僵尸图鉴):
  vidas, protecciones, velocidades, demora de la caja y mareo del minero.
- [Plants vs. Zombies Wiki](https://plantsvszombies.wiki.gg/wiki/Plants_vs._Zombies_Wiki):
  fichas de las ocho plantas, los cuatro enemigos, los niveles 4-1 a 4-10 y Vasebreaker.
  La reconstrucción técnica resuelve diferencias de redondeo y separa aventura de minijuegos independientes.

## Plantas

| Planta | Sol | Recarga (s) | Regla funcional |
|---|---:|---:|---|
| Marseta | 0 | 30 | Acuática, nocturna; espora de 20, alcance 240 y cadencia 1,425 s. |
| Planterna | 25 | 30 | Aclara 31 celdas: siete columnas por cinco filas sin las cuatro esquinas. |
| Cactus | 125 | 7,5 | Pincho de 20 cada 1,425 s; distingue objetivos terrestres y aéreos. |
| Trebolador | 100 | 7,5 | Sopla a los 0,5 s, desaparece a los 2,5 s; retira globos y desplaza la niebla. |
| Bipetidora | 125 | 7,5 | Un guisante frontal y dos traseros de 20; ráfaga trasera separada 0,1 s. |
| Frustrella | 125 | 7,5 | Cinco estrellas de 20 a 333 px/s: izquierda, dos verticales y dos diagonales frontales de 30°. |
| Calabaza | 125 | 30 | Cubierta de 4000 de vida; no sustituye la planta principal. |
| Magnetoseta | 100 | 7,5 | Recarga interna de 15 s; retira metal sin herir al cuerpo. |

Las plantas tienen 300 de vida salvo Calabaza. Marseta y Magnetoseta duermen de día. El radio del imán
es 270, o 320 si la víctima está comiendo; exige como máximo dos filas de separación y usa el desplazamiento
del punto de atracción de PC. Puede retirar cubos, puertas y cascos metálicos, caja cerrada, pico o saltador;
no retira cono, periódico ni sombrero no metálico. La caja que ya se abre no admite esa interrupción.

## Enemigos

| Enemigo | Cuerpo / protección | Movimiento y fases |
|---|---|---|
| Caja sorpresa | 500 / sin casco | 32 px/s; el temporizador sortea una apertura temprana con probabilidad 1/20. |
| Globo | 270 / globo de 20 | Vuelo sorteado entre 23 y 32 px/s; tras perderlo, 80/4,7 px/s en tierra. |
| Minero | 270 / sombrero de 100 | Túnel a 67 px/s; al llegar a x=10 emerge durante 1,3 s, espera 3,5 s y regresa a 12 px/s. |
| Saltarín | 500 / sin casco | 45 px/s y ciclos de rebote de 0,8 s; pierde el saltador ante barrera alta o imán. |

La caja convierte una distancia entera de 450–749 mediante el factor 0,67 y pasos de dos centésimas;
la variante temprana divide esa distancia entre tres. Tras el temporizador hay 1,1 s de apertura. En
Rompejarrones el temporizador inicial es 0,1 s. La explosión destruye físicamente las plantas a radio 90,
incluidas cubiertas y pinchos; alcanza zombis del bando contrario a radio 115 y abre los jarrones vecinos.
Una caja hipnotizada respeta las plantas. La apertura ya iniciada tampoco admite congelación.

El globo evita proyectiles terrestres y cortacéspedes; pincharlo sobre agua lo hunde. El minero evita
disparos y frío en el túnel. Patatapum, Petacereza, Jalapeño y Petaseta sí lo alcanzan: sus máscaras
originales incluyen el daño subterráneo. Apisonaflor no lo alcanza, tampoco como víctima colateral. El imán le impone una
pausa de 2 s y una emergencia de 1,3 s, tras la cual marcha a la izquierda sin pico. Un minero que ya regresa
invierte su marcha al hipnotizarse. Globo y saltador con herramienta no se congelan; sí admiten frío lento.

## Niveles y terreno

- 4-1 tiene niebla desde la columna cero-based 6; 4-2, 4-3, 4-4 y 4-6 desde la 5;
  4-7, 4-8 y 4-9 desde la 4. Tierra y agua siguen las seis filas de piscina nocturna.
- Plantorcha aclara su celda y las cuatro vecinas ortogonales. Trebolador mantiene un contador de 40 s:
  la niebla queda fuera durante los primeros 20 y vuelve gradualmente durante los otros 20.
- La emboscada final contiene dos enemigos en 4-1/4-2 y tres en los demás niveles acuáticos.
- 4-5 es Rompejarrones sobre cinco filas terrestres de noche, sin niebla, lápidas ni sol del cielo.
  Sus tres tandas son propias de la aventura, no el rompecabezas independiente:

| Tanda | Jarrones / verdes | Plantas | Zombis |
|---|---|---|---|
| 1 | 15 / 0, columnas 6–8 | 5 Lanzaguisantes, 5 Apisonaflor | 4 básicos, 1 cubo |
| 2 | 20 / 2, columnas 5–8 | 4 Lanzaguisantes, 5 Hielaguisantes, 4 Apisonaflor | 5 básicos, 1 cubo, 1 futbolista |
| 3 | 25 / 3, columnas 4–8 | 5 Lanzaguisantes, 5 Hielaguisantes, 5 Hipnoseta | 6 básicos, 2 cubos, 1 bailón, 1 caja |

Los sobres liberados duran 15 s y se plantan una vez sin coste ni recarga. Hay 5 s entre tandas. Se conserva
el sol y el estado de los cortacéspedes. El banco solo contiene Petacereza; empezar con cero sol no la regala.
El contenido oculto no aparece en los snapshots; un jarrón verde o una Planterna permiten verlo.

4-10 es la tormenta de aventura con veinte oleadas y ocho sobres: Nenúfar, Marseta, Magnetoseta,
Trebolador, Cactus, Frustrella, Bipetidora y Calabaza (pesos 25/10/5/5/15/25/5/10). No tiene niebla.
La tormenta comienza con variante 2 y un segundo de contador; después sortea variante 1–3 y ciclos basados
en el destello de 1,5 s. La variante 1 conserva las dos intensidades, máxima y 92/255;
el contrato publica su intensidad base sin el parpadeo ni la capa blanca de dibujo. No se sustituye por el minijuego independiente de cinco sobres y treinta oleadas.
El Yeti de la segunda aventura no forma parte de esta primera vuelta. El premio final es Coltapulta,
conservada en el guardado para el mundo siguiente aunque aún no se puede seleccionar.

## Límites deliberados

Se conservan el paso de 60 Hz, los cuerpos puntuales y las distancias del motor ya publicado. La elevación
del Cactus y el aterrizaje del globo cambian funcionalmente al resolverse su acción; el rebote usa velocidad
media y eventos de fase. No se inventan duraciones dependientes de animaciones que todavía debe integrar
Claude. Los destellos y la transparencia son datos para la vista, no efectos dibujados aquí. Tampoco se
afirma paridad binaria con PC. El abono de estas ocho plantas se rechaza sin consumir cargas hasta verificar
una regla propia, siguiendo el contrato de los mundos anteriores.
