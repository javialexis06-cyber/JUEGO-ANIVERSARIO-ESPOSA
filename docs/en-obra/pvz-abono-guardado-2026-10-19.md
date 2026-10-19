# Abono y progreso de La Semilla Madre · 19 de octubre de 2026

Codex entrega mecánicas y persistencia independientes de la interfaz. Claude conserva toda la parte gráfica,
las escenas y la conexión visual de la aventura. Esta ampliación sigue la [arquitectura](pvz-arquitectura.md)
y la [base del mundo 1](pvz-motor-2026-10-19.md). No modifica los patios clásicos, el duelo, sus claves o sus compras.

## Abono del día

Se conservan los valores normales del día de PvZ 1. El abono usa los efectos internacionales de PvZ 2 a nivel 1,
sin mejoras de nivel, disfraces, mentas ni variantes chinas. El motor no regala cargas: el llamador proporciona
entre cero y tres; la aventura deberá decidir su obtención conforme a los datos aprobados.

| Planta | Efecto de una carga |
| --- | --- |
| Lanzaguisantes | 60 guisantes de 20 de daño en unos 2 s. |
| Hielaguisantes | 60 guisantes helados de 20 en unos 3,5 s y zona de ralentización frontal durante 3,5 s. |
| Repetidora | 90 guisantes de 20 y uno grande de 600 al final, unos 2,5 s. |
| Girasol | Produce 150 de sol adicional para recoger. |
| Nuez | Recupera su vida corporal y obtiene 8.000 de armadura; renovar abono no acumula armaduras. |
| Patatapum | Se arma inmediatamente y genera hasta dos copias armadas en casillas válidas distintas. |
| Planta carnívora | Ataca los tres enemigos delanteros de su carril: devora comestibles y daña 1.000 a los indigestibles. Empuja los supervivientes hacia la novena columna y queda lista. |
| Petacereza / Nuez explosiva de bolos | No admiten abono; se rechaza sin consumir la carga. |

Las ráfagas suspenden los disparos normales pendientes y reinician su reloj al acabar. Durante la ráfaga activa
se rechazan daño, pala y otro abono; al acabar se cura el cuerpo. Las habilidades instantáneas curan al resolver.
El límite de proyectiles conserva los tiros pendientes hasta poder emitirlos. Girasol rechaza el abono sin
cobrar cuando ya hay cien soles activos; vuelve a admitirlo al liberar un hueco. Las copias de minas no cobran sol
ni cambian la recarga del sobre: solo la habilidad activa puede crearlas y respeta filas, capas, agua y tejado.
Si no hay huecos se arma la original; con un hueco solo aparece una copia.

La zona de hielo afecta a enemigos delanteros del mismo carril y termina sin prolongarse indefinidamente.
Los guisantes helados conservan su estado normal de diez segundos. `DefZombi.comestible = false` permite a las
futuras áreas identificar gigantes y vehículos; en ataques normales la Carnívora les da 40 cada 1,5 s, sin
tragarlos. La digestión normal de enemigos comestibles permanece en 42 s.

Datos observables para Claude: `puedeUsarAbono(id)`, zona de hielo en `estado().zonas`, eventos `zona`,
`siembra.origen`, `disparo.cantidad`, `disparo.proyectil` y `estado` con tipo `abono-fin`. Los eventos se drenan
tras las órdenes y se reúnen con `avanzar(n)`, igual que en la base. No hay dibujos ni animaciones en el motor.

Fuentes de hechos: [Plant Food](https://plantsvszombies.wiki.gg/wiki/Plant_Food),
[Peashooter](https://plantsvszombies.wiki.gg/wiki/Peashooter_(PvZ2)),
[Snow Pea](https://plantsvszombies.wiki.gg/wiki/Snow_Pea_(PvZ2)),
[Repeater](https://plantsvszombies.wiki.gg/wiki/Repeater_(PvZ2)),
[Sunflower](https://plantsvszombies.wiki.gg/wiki/Sunflower_(PvZ2)),
[Wall-nut](https://plantsvszombies.wiki.gg/wiki/Wall-nut_(PvZ2)),
[Potato Mine](https://plantsvszombies.wiki.gg/wiki/Potato_Mine_(PvZ2)),
[Chomper de PvZ 2](https://plantsvszombies.wiki.gg/wiki/Chomper_(PvZ2)) y
[Chomper de PvZ 1](https://plantsvszombies.wiki.gg/wiki/Chomper_(PvZ)).
No se incorporan textos ni recursos del juego original. Las tablas internacionales fijan la Repetidora en
2,5 s; las páginas discrepan sobre una espera adicional de carga, por lo que no se añade otra espera. La cadencia
se cuantiza al paso de 1/60 s: los tiros pequeños ocupan una ventana `[0, duración)` y la protección termina al
último tiro emitido, hasta un intervalo antes de completar esa ventana. El guisante grande de Repetidora sale
al final de los 2,5 s. La elección de huecos de minas usa azar con semilla; no se afirma el algoritmo
exacto de aterrizaje del juego original. Tampoco se simula una fase gráfica de vuelo de esas minas.

## Guardado para conectar a la aventura

```ts
const g = new GuardadoPvZ(localStorage, { amigo: esModoAmigo() });
const inicio = g.abrirNivel('1-1', ['lanzaguisantes'], 23);
if (inicio.ok) {
  const m = new MotorPvZ(inicio.nivel, inicio.opciones);
  // La interfaz envía órdenes y avanza el motor. Al recibir su final:
  if (m.terminado) g.confirmarResultado(inicio.partida, m.estado());
}
// Si g.bloqueo o g.pendiente: mostrar aviso y ofrecer g.reintentar().
```

- `GuardadoPvZ` recibe `{getItem,setItem}`. Importarlo no toca navegador ni almacenamiento. El parámetro `amigo`
  selecciona `pvz-v1` o `amigo-pvz-v1`; no se lee, migra ni escribe ninguna clave clásica.
- `abrirNivel` valida nivel disponible, semillas desbloqueadas, ranuras, duplicados y configuración de cinta.
  Devuelve una copia del nivel y opciones para el motor, además del recibo de partida que debe conservar la UI.
- Solo hay una partida activa por gestor. `abandonar(recibo)` permite salir. No se guarda ni restaura la batalla
  en curso: una recarga vuelve al progreso confirmado.
- `confirmarResultado` recibe un estado final del nivel abierto. Solo el primer triunfo concede el premio del
  nivel; repetir la confirmación o volver a ganar no duplica desbloqueos. Derrota y abandono no desbloquean.
- `progreso` es una copia independiente. Conserva monedas, compras, ranuras, ajustes, objetos, notas y bloques
  de modos. No se inventan premios de monedas ni se implementan tienda, Fusión, supervivencia o minijuegos.
  El premio de 1-10 se conserva aunque la planta del mundo nocturno aún no esté registrada.
- La carga exige niveles consecutivos y un nivel alcanzado coherente; una inconsistencia bloquea sin recortar
  avances registrados. Un extra explícito de plantas, objetos o
  notas se conserva si el mismo ID tiene una compra positiva; una compra por sí sola no crea un desbloqueo.
  Si un extra carece de procedencia reconocida, o hay campos de formato futuro, se bloquea sin borrar el texto.
- Una escritura fallida conserva el resultado en memoria, marca `pendiente` y bloquea abrir otra partida.
  `reintentar()` intenta guardarlo de nuevo. `guardado` solo es verdadero si no hay pendiente ni bloqueo.
- JSON roto, versión futura o estructura incompatible bloquean las escrituras y conservan el archivo original.
  `reintentar()` vuelve a leerlo cuando no hay resultado pendiente; no hay reinicio automático de progreso.
- Antes de escribir se compara el texto original. Un cambio de otra pestaña produce `conflicto` sin sobrescribirlo.
  No hay mezcla automática de resultados pendientes ni escritura transaccional entre pestañas. La UI debe avisar;
  no debe borrar la clave para resolverlo. La protección es para persistencia local, no contra trampas.

## Verificación y límites

Los scripts de reglas y guardado están incluidos en `npm run probar:pvz` y `probar:motores`. La prueba adicional
`npm run probar:pvz:guardado-navegador` utiliza Chromium, un servidor local efímero y un contexto aislado con
`localStorage` real. Sus partidas usan el piloto y los mismos costes, recargas y órdenes del motor.

Comprobaciones de reglas: 57 del motor (incluyen treinta victorias en diez niveles con tres semillas),
23 del abono y 32 del guardado (incluyen diez victorias secuenciales con selección desbloqueada y recarga).
La persistencia en Chromium pasa diez comprobaciones: dos victorias legales, recargas, cuota fallida y
recuperada, perfiles independientes, JSON roto y versión futura conservados. También pasan `probar:motores`,
las 48 suites de `probar:granja`, `verificar:repo`, TypeScript y compilaciones completa y de amigos con su filtro.
Tras reforzar el bloqueo de progresión incoherente se repitieron guardado, TypeScript y persistencia en navegador.
El build completo pasa las seis comprobaciones de integración de `verificar-demo.mjs`, sin errores de página
ni recursos faltantes; la granja interviene solo como regresión existente.

La evidencia generada queda en `juego/web/test-results/pvz/` y no entra al repositorio. Ninguna de estas pruebas certifica la interfaz nueva: falta conectar
los gráficos de Claude y ejecutar el recorrido visual de la aventura, incluida su pantalla de error y reintento.
Los mundos 2–10 y los demás modos del plan siguen pendientes; la granja participa únicamente en sus regresiones.
