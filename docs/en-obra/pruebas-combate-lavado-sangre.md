# Combate de Lavado y Sangre y Ceniza · 14 de octubre de 2026

Javier pidió comprobar el control permanente de la horda de Sangre y la dificultad después del minuto 22 de
Lavado. Aprobó **1,5 s máximos de aturdimiento continuo, seguidos de 1 s de resistencia**, y costes sobre vida
máxima, con Vista Astral al 10 %. Esos cambios sí están en el juego. La vida, daño, retroceso, precios y premios
base se conservan. La revisión inicial utilizó `5b6bc177`; las cifras de Lavado de abajo corresponden a la
repetición **después de corregir la reutilización de enemigos**, no a la medición inicial.

## Lavado: fallo funcional y partidas repetidas

Un enemigo muerto podía volver a ocupar su casilla antes de que se compactara la lista del cuadro. Su índice
aparecía repetido y la rejilla espacial formaba un ciclo, repitiendo impactos hasta llenar la consulta. En una
prueba de Bañera, la Toalla hizo **9.744 impactos a la Muerte en unos 3,3 segundos**. Esa muerte artificialmente
rápida no sirve como prueba de balance. Ahora el cupo espera a desaparecer de la lista antes de reutilizarse;
no se cambian cifras de armas, oleadas, vida ni premios. Cuatro regresiones comprueban capacidad, reutilización y veinte fotos de red,
impacto único, contadores y una partida con horda hasta derrota o diez minutos.

**Los enemigos comunes siguen muriendo después del minuto 22 con el fallo corregido.** No cualquier combinación
sobrevive: hay una subida fuerte de vida al entrar la Mugre alrededor del minuto 21.

| Escenario | Partidas repetidas | Victorias a los 30 minutos | Partidas que alcanzaron el minuto 22 |
|---|---:|---:|---:|
| La Cara | 34 | 12 | 17 |
| El Lavamanos | 8 | 6 | 6 |
| La Bañera | 8 | 4 | 7 |
| La Ducha | 8 | 3 | 5 |

Total: **58 partidas, 25 victorias**. Personajes iniciales, tres semillas en Cara y una en los otros mapas,
tiendas sin mejoras/media/completa, y preferencias por distancia o área. Tiendas media/completa son perfiles
preparados. Doce partidas de Cara son dos series desde cero: cada mejora se paga con las gotas ganadas y su precio
original. El ganó en la segunda y quinta; Ella en la cuarta y quinta. Esas cuatro victorias hicieron
**9.119–14.447 bajas entre los minutos 22 y 30**.

La curva de La Cara sin Maldición ni Inverso permanece igual:

| Minuto | Tipos principales y vida al aparecer | Mínimo de enemigos |
|---|---|---:|
| 20 | Lagaña 1.524; Barrito 952,5 | 210 |
| 21 | Mugre 3.419; Lagaña 1.578 | 220 |
| 22 | Mugre 3.536; Barrito 1.020 | 230 |
| 24 | Moco 2.465; Mugre 3.770 | 250 |
| 29 | Mugre 4.355; Moco 2.847,5; Virus 703,5 | 300 |

El cambio de tipo produce el salto principal; el incremento tardío añade 4,5 % por minuto después del 14.
Inverso multiplica adicionalmente la vida por 4,1 al minuto 22, antes de Maldición. **No se probaron todos los
escenarios especiales, capítulos, disfraces ni modos avanzados.** No se propone bajar globalmente la vida de
los enemigos con esta evidencia.

## Lavado: la Muerte y una receta inaccesible

Llegar a 30 minutos ya marca victoria: no exige matar a la Ducha Helada. Su vida base es 655.350 y su daño base
65.535; la escala tardía aumenta su vida real a unos 1,13 millones al minuto 30 sin Maldición. Algunas partidas
sobreviven al minuto 31 y usan el retiro normal después de que el motor ya declaró victoria.

En combate **preparado**, arrancando al minuto 30 con seis evoluciones y mejoras completas, el daño y la defensa
actuales derrotan a una Muerte en cada mapa normal: alrededor de **37:25–37:28**. No se reduce su vida ni se fuerza
la muerte. Este escenario entrega las evoluciones: **no demuestra que se obtengan legalmente**.

La Cortina de terciopelo pide Cortina al máximo, ambos aretes y un cofre después del minuto 10. Actualmente el
arete derecho aparece solo en Cara y el izquierdo solo en Bañera; no salen nuevos en cartas ni en el vendedor,
y las pasivas no pasan a la siguiente partida. Por eso esa receta está bloqueada en el recorrido normal.

**Propuesta pendiente de aprobación:** añadir el arete que falta en Cara y Bañera y ambos en Lavamanos y Ducha,
conservando el desbloqueo del Espejito, guardianes, ranuras, requisitos de evolución y efectos actuales:

| Mapa | Hallazgos adicionales propuestos (x, y) |
|---|---|
| Cara | Izquierdo (1750, 1300) |
| Lavamanos | Izquierdo (−3200, 120); derecho (3600, 120) |
| Bañera | Derecho (1500, −1500) |
| Ducha | Izquierdo (−1800, −1400); derecho (1800, 1400) |

Se ensayó solo en el proceso de pruebas, después del arreglo de enemigos: ocho partidas, dos semillas por mapa.
La tienda y disponibilidad de secretos son preparadas; armas, niveles, recogida, cofres y evolución se obtienen
jugando, sin entregarlos. Tres partidas derrotaron a la Muerte: Cara 40:39, Lavamanos 37:54 y Bañera 37:07. Otra
con Cortina evolucionada cayó después del minuto 34. Ambas de Ducha murieron antes del minuto 4 al buscar tesoros
muy temprano; su ruta no está certificada. Reservar dos ranuras de pasivas forma parte de la estrategia.
**Los hallazgos propuestos no están en los datos del juego hasta recibir aprobación.**

## Sangre: control aprobado y coste de vida

En `5b6bc177`, cada golpe renovaba `max(actual, duración)` sin resistencia. Caballero en peligro 2 alcanzó
**4,10 y 4,63 s** de aturdimiento encadenado; los jefes eran inmunes y los élites recibían media duración.

Todas las fuentes de aturdimiento ahora usan la misma racha y resistencia: armas, habilidades, explosiones de
objetivos y otros enemigos. Tras alcanzar 1,5 s, el enemigo recupera su IA durante 1 s y no acepta más
aturdimiento en esa ventana. Daño y retroceso siguen funcionando. Un efecto corto termina normalmente; los
cupos nuevos limpian ambos relojes. Los jefes conservan su inmunidad. Los relojes son arreglos planos sin objetos
por enemigo ni por cuadro; el anfitrión los simula y los invitados reciben su estado visual habitual.

**21 expediciones completas con el ajuste:** 18 de Monarca, Campesino y Prisionero en peligro 1, iniciales o con
arsenal disponible preparado, y tres de Caballero en peligro 2. Todas completaron sus cinco etapas. Las tres
semillas de Caballero (1000, 8919, 56433) tuvieron un bloqueo efectivo máximo de IA de **1,47 s a 30 Hz**.
Se mide antes de los proyectiles y zonas finales del cuadro: ver un estado positivo después no significa que
la IA haya estado bloqueada todo el cuadro. Las pausas del Reloj parado tampoco se cuentan como aturdimiento.

| Uso | Coste sobre vida máxima | Recarga/efecto conservado |
|---|---:|---|
| Vista Astral | 10 % | Pulso de 1,6 s |
| Vista Astral con Sangre fría | 5 % | Pulso de 2,6 s |
| Brújula de sangre | 70 % | Recarga de 15 s |
| Imán de tumba | 15 % | Recarga de 60 s |
| Paso de sombra | Gratis | Recarga de 10 s |

El coste se redondea hacia arriba. Los sigilos rechazan usos que consuman la última vida y no arrancan recarga
si falta vida; Astral conserva su margen previo de seguridad. No se vuelven más baratos al estar herido ni cambia
Astral por etapa. Motor y HUD usan los mismos cálculos y los botones dicen «vida máxima». Cinco regresiones
cubren golpes repetidos, oportunidad de atacar, jefes, reciclaje, porcentajes, redondeo, rechazos y doble cobro.
Cuatro comprobaciones en navegador usan los botones y Q, con vida/ausencia de horda preparadas para aislar los cobros.

## Sangre: Infinito sin moverse

Con arsenal disponible preparado, peligro 2 y semilla 8919, Caballero y Prisionero obtuvieron niveles y equipo
mediante cartas y compras pagadas durante la expedición. Sin bonos permanentes entregados. En sondas de 60 s sin
moverse ni usar habilidades, varios tramos intermedios siguieron sin perder vida: el límite de aturdimiento no
elimina el efecto de matar rápido, retroceder o bloquear golpes.

En una repetición más larga, cada uno permaneció quieto casi **600 s en la etapa 15**. Caballero recibió cuatro
golpes (748 de daño acumulado, con curación intermedia); Prisionero ocho (717). Ambos completaron la extracción
de esa etapa tras retomar el movimiento. Las dos expediciones terminaron en la etapa 16 por **extracción perdida**
(estado 2 con vida positiva), no por quedarse sin vida: esta distinción evita presentar una derrota del objetivo
como prueba de daño letal. Son 32 etapas recorridas hasta resultados normales, sin forzar fin ni saltar objetivos.

La revisión anterior con las mismas semillas también es reproducible; los cambios de combate alteran botín y
cartas posteriores, así que no se consideran construcciones idénticas al final. No se añadió Berserk ni otra
cifra de dificultad. La prueba confirma que algunos enemigos tardíos pueden golpear al personaje fuerte;
**no certifica todo Infinito**, especialmente biomas, equipo permanente y combinaciones no recorridos.

## Repetición y límites

Comprobaciones del cierre: compilación completa y de amigos, filtro de amigos (546 archivos, 45 palabras y
190 frases), `npm run probar:motores` con las nueve regresiones nuevas, 48 suites de granja y seis comprobaciones
casa–granja sin errores sobre el build final. La integración final dibuja solo al tomar capturas para reducir la
carga de la GPU virtual; no certifica rendimiento físico. La edición de pareja también recorrió el flujo de
Sangre en grupo local y los controles táctiles preparados, sin errores de página.

Las salidas locales están en `juego/web/test-results/revision-balance-2026-10-14/` y no se publican.

```bash
cd juego/web
npm run probar:motores
node scripts/auditar-combate.mjs lavado test-results/auditoria-combate/lavado
ESCENARIO=lavamanos TIENDAS=media,toda SEMILLAS=1000 PARTIDAS_PAGADAS=0 node scripts/auditar-combate.mjs lavado test-results/auditoria-combate/lavamanos
# Repetir con ESCENARIO=banera y ESCENARIO=ducha.
node scripts/auditar-combate.mjs muerte test-results/auditoria-combate/muerte
PERFILES=arsenal CLASES=caballero SEMILLAS=1000,8919,56433 PELIGRO=2 node scripts/auditar-combate.mjs sangre test-results/auditoria-combate/caballero
INFINITO=1 AFK_DESDE_ETAPA=15 AFK_HASTA=615 HASTA_ETAPA=25 CLASES=caballero,prisionero PERFILES=arsenal PELIGRO=2 SEMILLAS=8919 node scripts/auditar-combate.mjs sangre test-results/auditoria-combate/infinito
# Leer el motor publicado anterior con git, manteniendo el árbol de trabajo actual:
REVISION_MOTOR=5b6bc177 INFINITO=1 AFK_DESDE_ETAPA=15 AFK_HASTA=615 HASTA_ETAPA=25 CLASES=caballero,prisionero PERFILES=arsenal PELIGRO=2 SEMILLAS=8919 node scripts/auditar-combate.mjs sangre test-results/auditoria-combate/infinito-base
# Propuesta de acceso a los aretes: solo simulada, nunca cambia los datos de producción.
PROPUESTA_ARETES=1 SEMILLAS=1000,16838 node scripts/auditar-combate.mjs receta-muerte test-results/auditoria-combate/receta-propuesta
CHROME_PATH=/usr/bin/chromium node scripts/probar-sangre-costes-navegador.mjs http://127.0.0.1:4182 test-results/auditoria-combate/costes
```

Los pilotos y compras son entradas legales, pero los perfiles preparados se distinguen del progreso pagado desde
cero. No certifican la precisión de controles físicos, FPS, batería, red real, ni la APK instalada. Las pruebas
de grupo y celular en Chromium recorren controles, pausa y flujo de Forja/resultados con escenarios preparados;
no son una campaña humana ni una certificación Android. La auditoría general continúa abierta.
