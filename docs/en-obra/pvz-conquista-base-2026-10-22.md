# Conquista · base jugable del 22 de octubre

**Registro del primer prototipo.** Después de jugarlo, el pedido cambió a defensas PvZ completas con carriles
por escenario, tipos exclusivos por zona y catálogo progresivo completo. Esas funciones siguen pendientes
y se siguen en [el listado vigente](pvz-pendientes-2026-10-22.md); este documento acredita únicamente la base
publicada, no ese motor definitivo.

El pedido es probar la gestión territorial antes de seguir ampliando el catálogo. `jardin.html` abre Conquista;
`?modo=aventura` conserva los cuarenta niveles PvZ y `?modo=clasicos` los doce patios y su acceso al duelo.
Las claves anteriores permanecen intactas. El [diseño mundial](pvz-conquista-propuesta-2026-10-22.md) separa
contenido futuro e implementación actual. No se ha retomado la granja.

## Qué se puede jugar

Historia de 12 áreas agrupadas en tres países y seis ciudades: solo nuestra casa pertenece al jugador al comenzar. Se atacan zonas contiguas a una
ruta conectada, se dejan guarniciones y se defienden contraataques. El laboratorio abre fusiones al controlar
8 áreas. La fortaleza espera hasta recuperar las otras 11. La victoria exige todas las zonas controladas;
un contraataque que recupere territorio retrasa el final. Al llegar al 100%, la nave del Dr. Zomboid abandona
el mapa en una escena animada. Se puede cargar de nuevo la campaña terminada y ver su final.

Versus de 36 áreas con dos fuertes y resistencias neutrales: contra IA, dos personas alternando controles en
un dispositivo o una sala por código. Los bandos pueden intercambiarse antes de empezar. Las fusiones están
abiertas desde el comienzo. Gana quien destruye el fuerte rival; ambos destruidos en el mismo paso empatan.

Cada expedición elige hasta ocho tipos y sus reservas iniciales. Cada zona conserva equipo y hasta nueve
puestos, con al menos una defensa en cada carril. Las zonas capturadas reciben automáticamente resistencia
del nivel. Los vecinos aliados aceleran refuerzos del atacante y amortiguan daño del defensor; las rutas
cortadas suspenden ingresos y nuevas expediciones desde áreas aisladas. Todos los frentes siguen activos
al cambiar de vista, abrir el mapa o editar formaciones. La pausa sí detiene el mundo completo.

## Presentación y controles

Mapas pintados de mundo, país y ciudad, portada detallada, materiales de madera y sobres y núcleos
ilustrados. La vista llena la pantalla: se eliminaron los paneles superior, inferior y lateral y la barra de
frentes. Los controles son botones redondos pequeños, las cartas flotan sobre el escenario y las órdenes
aparecen únicamente al seleccionar una zona. El botón de pantalla completa usa la función nativa del navegador. La portada ilustrada tiene movimiento de cámara y luces; carga y sala muestran escenas de día, noche, canal y niebla: movimiento,
proyectiles, impactos, partículas, cámaras y transiciones. Es animación Canvas con sprites, no vídeo ni
animación independiente de extremidades. El sonido decorativo es opcional y empieza solo tras tocarlo.

Seleccionar carta y tocar carril/casilla despliega la unidad. Teclas 1–8 eligen cartas;
M o Tab vuelven al mapa; espacio pausa. La cabecera de plantas avanza al despejar carriles; los zombis llegan desde la
derecha. Para cambiar de expedición se vuelve al mapa: mundo → país → ciudad → zona. Los marcadores muestran
las batallas activas y permiten intervenir. La navegación agrupa las zonas existentes sin cambiar sus IDs ni
conexiones. La historia tiene dos ciudades por país con dos áreas cada una; versus, tres ciudades por país
con cuatro áreas cada una. Las ilustraciones de país y ciudad se reutilizan entre destinos en esta base.

## Contratos

`src/jardin/conquista/motor.ts` es un motor determinista de 30 pasos/s, sin DOM ni reloj externo. El nuevo
catálogo adapta las habilidades a esta prueba; no cambia las fichas del motor PvZ existente. Hay **32 plantas,
21 zombis y cinco fusiones de muestra**, con imágenes reutilizadas y marca F. No son todas las plantas de
PvZ 2 ni todas las recetas de Fusión. Las batallas del canal en la película son decorativas: el campo jugable
de Conquista usa tres carriles terrestres y habilidades adaptadas. El minijuego Fusión separado sigue pendiente.

Guardado propio `conquista-prototipo-v1` o `amigo-conquista-prototipo-v1`. Solo historia, cada ocho segundos y
al salir; cerrar el juego detiene el avance. Se valida el archivo completo, se conservan versiones futuras
y se detectan escrituras de otra pestaña. Un fallo de cuota pausa, ofrece reintento y exportación JSON.
El archivo exportado es respaldo para inspección; la interfaz todavía no ofrece importarlo.

La red reutiliza las salas existentes, sin tablas, SQL ni cambios de autenticación. El anfitrión verifica las
órdenes y simula todos los frentes. Las fotos compactas de 100 ms interpolan posiciones en el invitado.
La pausa es compartida y cada persona retira la suya. Los cortes detienen la partida; salir cierra la sala
sin conceder victoria. La versión de amigos usa los sustitutos y el filtro existentes.

## Compilar una copia para probar

Desde `juego/web`, `npm run build:conquista:portatil` produce
`test-results/conquista/la-semilla-madre-jugable.html`. Incluye código, fuentes y las dieciocho colecciones
gráficas. La historia y el versus en un dispositivo funcionan sin red. Las salas necesitan conexión.
La copia autónoma solo incluye Conquista; los minijuegos anteriores permanecen en la aplicación completa.
No se añade el HTML generado al repositorio: se conserva su compilador reproducible.

## Comprobaciones de esta entrega

- `npm run probar:conquista`: catálogo, órdenes inválidas, equipos por frente, formaciones, suministros,
  simultaneidad, guardado/archivos dañados/cuota/conflictos, cable compacto, empate y victoria al 100%.
  Tres campañas completas con pilotos que pagan costes y respetan recargas. Prueba sin órdenes: derrota.
  Ambos bandos capturan un fuerte en versus contra guarniciones de un rival que no da órdenes.
- `npm run probar:conquista:interfaz`: toques reales, navegación mundo/país/ciudad, formación, asalto, siembra, dos frentes, pausa, guardado,
  cuota fallida y campaña completa con final espacial; 1280×720 y 844×390. Dos contextos con pérdida del 8%,
  demora y corte controlado verifican órdenes, pausas y cierre de sala.
- `REAL=1 SOLO_SALA=1` ejecuta el recorrido de sala sobre Realtime real con dos contextos aislados.
- Regresiones de los motores y granja, aventura visual PvZ de cuarenta niveles, versión de amigos,
  compilaciones y recorrido integrado de granja se registran en `juego/web/test-results/`.

Los pilotos aceleran el mismo motor sin regalar recursos. Estas pruebas no certifican equilibrio competitivo,
todas las combinaciones del catálogo, rendimiento de teléfonos ni el mundo futuro de 240 áreas.

La escena final ocupa la pantalla con el mapa y la nave animada: sin cartel narrativo ni paneles de estadísticas.
Las imágenes del primer prototipo con barras y panel lateral quedaron sustituidas por este pedido de Javier.

Verificación de cierre: 18 comprobaciones del motor de Conquista, tres campañas al 100%,
recorrido visual y sala real/simulada correctos; copia autónoma sin solicitudes externas. Cuarenta niveles
PvZ y doce patios clásicos completados con pilotos legales, ocho protecciones completas verificadas,
48 suites de granja y seis comprobaciones de integración de granja sin errores. Compilaciones normal y
de amigos correctas; el filtro revisó 603 archivos y no encontró contenido privado de la pareja.
