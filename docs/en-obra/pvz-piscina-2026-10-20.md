# Motor del mundo acuático · 20 de octubre de 2026

El motor propio incorpora diez niveles de piscina (3-1 a 3-10), seis carriles, dos de agua, ocho plantas
y siete variantes de zombis. Codex mantiene reglas, niveles, persistencia y pruebas. Claude conserva toda la
interfaz, las escenas, las animaciones y el arte. No se modifican los patios clásicos, el duelo ni la granja.

Las [fuentes de plantas, zombis y niveles](pvz-piscina-fuentes-2026-10-20.md) y las
[reglas técnicas de terreno](pvz-piscina-terreno-fuentes-2026-10-20.md) registran valores, procedencia y
aproximaciones. La referencia es la primera aventura de PvZ 1 para PC. No se incorporan código ni recursos
originales. Se mantienen 60 Hz y cuerpos puntuales; no se afirma equivalencia de animaciones o colisiones.

## Reglas y contenido

- Nenúfar sostiene plantas terrestres. La destrucción del soporte hunde sus plantas; la pala retira capas
  desde arriba. Nenúfar y Zampalga requieren agua sin otra base ni planta principal. Patatapum y Pinchohierba nunca admiten agua, incluso si hay Nenúfar.
- Apisonaflor espera, salta y aplasta. Tripitidora dispara una tanda por tres carriles, incluso desde un borde.
  Zampalga retiene y arrastra una víctima; quitarla libera la víctima y no deja un bloqueo permanente.
- Jalapeño quema toda la fila y derrite el rastro de hielo. Pinchohierba no detiene ni recibe mordidas;
  pincha vehículos sin ser aplastada antes. Plantorcha transforma guisantes al cruzarla: uno helado pierde el
  frío y un cruce posterior puede calentarlo. El fuego tiene salpicadura. La barrera alta bloquea los saltos.
- Las oleadas respetan tierra y agua. Los básicos, conos y cubos acuáticos conservan sus estadísticas con
  flotador; aparecen a partir de la sexta oleada. La bandera también puede entrar en agua desde esa oleada.
  Los buzos y delfines solo se asignan a filas acuáticas.
- Buzo se sumerge para evitar disparos rectos y emerge para morder; explosiones, Zampalga y proyectiles
  lanzados conservan su capacidad de alcanzarlo. Delfín salta una defensa y después reduce su velocidad;
  no supera la barrera alta. Su salto funcional sigue la convención puntual del motor anterior.
- Zomboni aplasta plantas y deja hielo durante treinta segundos desde la última renovación. No se puede
  sembrar sobre esa pista. El trineo contiene cuatro zombis: el patín protege al grupo hasta romperse y,
  tras el choque, sus ocupantes caminan. Sin una pista suficientemente iniciada, la entrada del director
  se sustituye por cuatro básicos. Vehículos activos no reciben frío ni pierden cabeza.
- La última oleada programa una emboscada acuática a los 2,1 s. Genera dos enemigos en 3-1 y 3-2, tres en
  los demás niveles, en casillas distintas. La victoria espera el temporizador y la eliminación del grupo.
- 3-5 usa veinte oleadas, vida y armadura divididas entre cuatro, velocidad y mordida normales e intervalo
  de 7,5 s. 3-10 usa cinta con las ocho plantas acuáticas. Los Nenúfares reducen su peso al acumularse vivos
  y en la cinta, sin un límite total de dieciocho emisiones. La presión de sobres aumenta su espera.
- Sin compra de limpiapiscinas, el cortacésped acuático se hunde al entrar en agua. El contrato permite
  habilitar un limpiador explícitamente en un escenario; no concede monedas ni compras al progresar.
  La tienda y su conexión con ese contrato siguen pendientes.

Los contratos aditivos, campos de estado y eventos están en la [arquitectura](pvz-arquitectura.md).
El abono del día se conserva. Las nuevas plantas no inventan efectos de abono: se rechazan sin consumirlo.

## Guardado e integración visual

El catálogo reúne treinta niveles. Se reconoce tanto el final publicado de diez victorias (`1-10`) como el
final de veinte (`2-10`), ofreciendo el nivel siguiente sin escribir al leer ni conceder triunfos. Se conservan
monedas, compras, ranuras, ajustes, modos, objetos y notas. Los archivos incoherentes siguen bloqueados.
Al finalizar 3-10 se almacena Marseta, todavía sin registrar para el futuro mundo de niebla.

La interfaz debe pasar la selección explícita del jugador a `abrirNivel`: los sobres disponibles incluyen
Nenúfar desde 3-1. El valor por defecto histórico no sustituye la pantalla de selección ni cambia las elecciones
del usuario. El piloto utiliza seis ranuras y semillas obtenidas antes de cada nivel, sin compras, abono,
recursos añadidos ni cambios de estadísticas.

La persistencia en navegador se verifica con un arnés del motor y `localStorage` real. No acredita una aventura
visual terminada: la conexión con las escenas y gráficos sigue a cargo de Claude. Los mundos 4–10, la tienda,
los modos posteriores y Fusión se mantienen pendientes.

## Verificación · cierre del 21 de octubre

Pasan 55 reglas preparadas de piscina: diecisiete de plantas, quince de zombis y veintitrés de terreno.
Incluyen colisiones con vehículos, proyectiles durante el salto y choque, capas acuáticas, salida del buzo,
presión de cinta, reposición de Nenúfares, emboscada pendiente y hundimiento del cortacésped.
El piloto completa treinta partidas acuáticas: los diez niveles con semillas 1, 23 y 108. Se auditan sol
recogido, compras de plantas, seis ranuras, órdenes legales, una sola victoria e inmutabilidad tras finalizar.

Las 52 comprobaciones de guardado incluyen treinta victorias consecutivas reales del motor, con recarga tras
cada una. Pasan dieciséis comprobaciones de las dos fronteras históricas y dieciséis en Chromium, incluida
la victoria legal de 3-1 seguida de recarga con 3-2 disponible. No se modifica economía ni dificultad para
facilitar las pruebas: los ajustes del piloto mejoran selección, reservas, colocación y uso de pala.
En la cinta acuática se preparan barreras antes de las llegadas rápidas y se reponen los apoyos tras una brecha.

La evidencia, incluidos los intentos fallidos de desarrollo, se conserva localmente fuera de git en
`juego/web/test-results/pvz/`. El cierre general registra compilaciones, regresiones e integración por separado.
También pasan `probar:motores`, las 48 suites existentes de `probar:granja`, `verificar:repo`, TypeScript y
las compilaciones completa y de amigos con su filtro. El build servido completa las seis comprobaciones
funcionales de integración en Chromium, sin errores de página ni recursos faltantes. La ejecución usa
`DIBUJO_POR_CAPTURA=1` y el modo bajo existente; comprueba navegación, controles, HUD y persistencia.
La captura final de ese arnés muestra HUD y fondo sin la geometría del mundo: no se utiliza como
certificación visual 3D ni como evidencia de la aventura de PvZ. No se modifica la granja para esta entrega.
Las pruebas automáticas del motor y del guardado no certifican una aventura visual ni un teléfono físico.
