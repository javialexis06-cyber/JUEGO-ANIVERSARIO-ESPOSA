# La Semilla Madre · historia con defensas PvZ

Actualizado el **22 de octubre de 2026, hora de Bogotá**. Continúa el
[núcleo de instancias](pvz-instancias-2026-10-23.md) y el [seguimiento en GitHub](https://github.com/javialexis06-cyber/JUEGO-ANIVERSARIO-ESPOSA/issues/1).

## Entrada y alcance

`jardin.html` y `?modo=conquista` abren la historia nueva. Cada defensa usa `MotorPvZ`: soles locales,
semillas, recargas, capas, proyectiles, habilidades, cortacéspedes y oleadas completas. No importa
`MotorConquista`, sus unidades simplificadas ni su economía de reservas.

La base tiene doce territorios y las 32 plantas normales ya construidas. Los niveles normales
reutilizados de aventura suministran composiciones, costes y parámetros; se adaptan a los carriles del
territorio. No son el mundo final de 240 áreas ni los catálogos completos de PvZ 1/2/Fusión. No se han añadido
plantas, zombis o gráficos en esta entrega, ni se han cambiado estadísticas de los juegos anteriores.

El versus y la historia del prototipo siguen en `?modo=prototipo`. PvZ aventura sigue en `?modo=aventura`
y los patios en `?modo=clasicos`. El menú conserva esos accesos. **Las salas todavía usan el motor anterior**;
el nuevo protocolo de PvP y su resistencia básica siguen pendientes. La historia nueva no ofrece las cinco
fusiones de muestra como si fueran el sistema real.

## Territorios y desbloqueos de esta base

Solo la casa está recuperada al empezar. Se puede explorar una zona junto a una ruta propia conectada
con la casa. Llegar la primera vez desbloquea sus semillas antes de preparar la expedición; perderla y
volver no entrega copias ni repite premios. La fortaleza se abre cuando las otras once son propias.

| ID | Territorio | Carriles | Nivel de referencia | Nuevas semillas al llegar |
|---|---|---:|---|---|
| 8 | La casa | 5 | 1-2 | Lanzaguisantes, Girasol, Nuez, Petacereza |
| 9 | Estación vieja | 4 | 1-3 | Repetidora, Patatapum |
| 4 | Paseo del farol | 3 | 2-2 | Seta desesporada, Seta solar, Humoseta, Comepiedras |
| 0 | Casas del roble | 5 | 1-4 | Hielaguisantes, Planta carnívora |
| 1 | Calle del molino | 3 | 1-6 | Hipnoseta, Seta congelada |
| 5 | Puente del río | 4, dos de agua | 3-2 | Nenúfar, Marseta, Zampalga |
| 6 | Almacén de semillas | 7 | 1-8 | Tripitidora, Aplastaflor, Nuez alta |
| 10 | Plaza de las fuentes | 6 | 1-8 | Plantorcha, Pinchohierba, Jalapeño |
| 2 | Parque del estanque | 5 | 1-7 | Cactus, Trébolador, Planterna |
| 7 | Avenida del mercado | 4 | 1-9 | Bipetidora, Frustrella, Calabaza |
| 11 | Colina del norte | 6 | 2-4 | Magnetoseta, Seta miedica, Petaseta |
| 3 | Fortaleza zombi | 7 | 2-9 | Sin recetas nuevas de Fusión mientras no estén construidas |

Son datos de integración, no una certificación del balance de todas las rutas. La noche, el agua y las
dependencias de cada planta conservan sus reglas. Los fondos existentes se reutilizan: faltan escenarios
artísticos específicos de calles, almacenes y demás regiones.

## Combates, conservación y reservas

- Una expedición completa una partida de PvZ para purificar su zona; las plantas no caminan ni atacan núcleos.
- Los ataques zombis solo abren defensas en periferias colindantes. Se conserva del prototipo el primer
  ataque a los 35 s, la cadencia `max(22,42−presión×4)`, el descanso de 18 s y el máximo de seis frentes.
  La presión permite una/dos/tres/cuatro defensas a partir de una/tres/cinco/ocho zonas propias. No se ha
  certificado aún cuánta intervención humana necesita esta adaptación a partidas PvZ más largas.
- Los tableros activos comparten 60 pasos por segundo. Mapas y selectores no detienen a los enemigos.
  La pausa global o esconder la página detienen todos. No se simula tiempo con el juego cerrado.
- Ganar conserva plantas, salud, soles, recargas, terreno, estados y cortacéspedes. El descanso congela
  ese tablero: no produce sol ni avanza sus relojes. La incursión siguiente rearma solo el director de oleadas.
- Cada tipo queda reservado a una zona, incluso si muere un ejemplar. Preparar un equipo puede trasladar
  tipos desde zonas en descanso. La operación es completa o no cambia nada; no se permite durante combates.
- Un traslado retira los ejemplares anteriores y sus capas dependientes, proyectiles y zonas asociados,
  sin reembolso, curación ni reposición de recursos. El tablero de origen conserva el resto de su estado.
- Perder un territorio destruye su defensa y libera su reserva. Sus desbloqueos anteriores permanecen.
  Perder la casa termina la historia. Recuperar las doce zonas dispara la huida del Dr. Zomboid en su nave.
- Retirada voluntaria, reparación/fortificación estratégica y apoyos entre territorios siguen pendientes;
  no se presentan botones que aparenten aplicarlos al nuevo motor.

## Guardado, respaldo y archivos anteriores

El mundo V2 y las instantáneas de todos sus tableros se guardan juntos en `conquista-historia-v2` o
`amigo-conquista-historia-v2`. Se validan nivel, geometría, catálogo, relojes, desbloqueos, reservas, incursiones
y final. Una versión futura o un archivo roto se conserva y bloquea su reemplazo.

Las claves `conquista-prototipo-v1`, `amigo-conquista-prototipo-v1`, `pvz-v1`, `amigo-pvz-v1` y las de patios
y duelo no se convierten ni se escriben. La historia anterior sigue jugable en su entrada independiente.
**La conversión de progreso V1 sigue pendiente**: sus equipos repetidos no se recortan automáticamente ni
sus frentes simplificados se convierten en combates supuestamente equivalentes.

La sesión adquiere un Web Lock exclusivo por clave antes de jugar. Una segunda pestaña recibe un aviso
y no abre otra copia. En navegadores sin Web Locks quedan la comparación del archivo y la pausa por eventos
de almacenamiento; no se acredita con eso exclusión estricta entre pestañas en esos navegadores.

Una cuota fallida conserva el mundo en memoria, pausa todos los frentes y permite reintentar o exportar.
Abrir un respaldo valida primero y muestra zonas/combates y qué historia reemplazaría; no escribe hasta
confirmar. Cancelar o un archivo inválido conservan los bytes existentes. Se puede exportar la historia
actual antes de confirmar. Un conflicto entre pestañas no se resuelve sobrescribiendo el otro archivo.

## Interfaz y comprobaciones

Mapa a pantalla completa con mundo → país → ciudad → zona y controles redondos. El selector usa sobres
ilustrados, costes reales, procedencia y enemigos previstos. Los mapas marcan propiedad e incursiones;
el campo muestra solo semillas, sol local, pala y los controles pequeños. Conserva portada animada y nave.

Desde `juego/web/`:

```sh
node scripts/probar-conquista-historia.mjs
CHROME_PATH=/usr/bin/chromium node scripts/probar-conquista-historia-interfaz.mjs http://127.0.0.1:4196/
```

El motor comprueba llegada, rutas, reserva, traslado, reanudación sin reposiciones, incursiones a la casa,
carga exacta multizona y rechazo de archivos contradictorios. Sin intervención, la casa cae y la reserva
no queda duplicada. Un recorrido con piloto legal completa los doce escenarios en unos 3.593 s virtuales,
**con incursiones estratégicas desactivadas como fixture**. Eso comprueba los combates y la integración;
no acredita que la campaña normal con contraataques esté balanceada ni todas las combinaciones.

El navegador comprueba toques en cuatro y tres carriles, mapas, tres frentes ocultos, pausa, recarga,
cuota, importación, dos pestañas, perfiles de amigos, archivos antiguos intactos y el final preparado sin
incursiones. Logs/capturas: `test-results/conquista/historia-motor/` e `historia-interfaz/`.
La regresión del versus anterior usa `scripts/probar-conquista-interfaz.mjs` sobre `modo=prototipo`.
No se certifican sensores ni rendimiento de teléfonos físicos.

El cierre pasó `verificar:repo`, `probar:motores`, las 48 suites de granja y ambos builds. El filtro de amigos
revisó 608 archivos; su recorrido sobre el build conservó claves y progreso. La regresión de Conquista V1
pasó diez comprobaciones con dos clientes, pérdida/demora, pausa y reconexión simuladas.

Se generó `/workspace/borradores/la-semilla-madre-historia-pvz.html` (57 MiB, dieciocho colecciones),
con fuentes y recursos incluidos. El recorrido autónomo completó el fixture de doce escenarios sin
incursiones, guardó y recargó sin conexión y sin solicitudes externas. No acredita políticas `file://`
de todos los navegadores. La integración del build con la granja pasó seis comprobaciones sin errores
usando calidad ligera y dibujo por captura; no se modificó su contenido.
