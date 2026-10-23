# La Semilla Madre · reproducción y presentación

23 de octubre de 2026. Se integra la [entrega de Claude](pvz-audio-entrega-2026-10-23.md):
**253 MP3 en 107 familias** (99 de efectos/ambientes/Dave y ocho músicas). No se ha generado más audio,
consultado claves ni consumido créditos. La [guía de producción](pvz-elevenlabs-guia-claude.md) ya está ejecutada.

## Reproducción

- `src/jardin/pvz/audio/banco.ts` carga el índice público, decodifica efectos por demanda y limita la caché
  a 32 buffers y 16 voces. Alterna variantes; si la siguiente aún carga, usa una variante disponible.
- `SonidoPvZ` conecta siembra, sol, pala, disparos por familia, explosiones, mordidas, pasos, agua,
  gruñidos/habilidades, brazos, cabeza, protección, oleada y resultados. Patatapum identifica su explosión
  mediante metadatos del evento; daño, umbrales, costes y tiempos no cambian.
- Historia y aventura reproducen música de escenario; el mapa tiene su tema, los contraataques de frontera el suyo y el final su música.
  Música y ambiente usan streaming en bucle. Volver al mismo tema no crea otra pista ni lo reinicia.
  Se pausa al ocultar/pausar la partida; silencio y salida detienen y liberan recursos.
  En el resultado, parar el fondo permite que termine el efecto de victoria/derrota.
- Dave reproduce solo balbuceos no verbales. Cambiar de explicación cancela el anterior; no hay TTS ni voces clonadas.
- Historia dispone de botón redondo de sonido en inicio, defensa/mapa y tutorial. Requiere un gesto del jugador
  para cumplir las políticas del navegador. La aventura conserva sus ajustes de sonido y música.
- Las familias de plantas/zombis futuros y la música de Fusión están publicadas y disponibles para sus futuros
  comportamientos; producir su sonido no crea esas unidades ni recetas. El catálogo jugable sigue siendo el existente.
- No se realizan peticiones a ElevenLabs durante el juego. Si falta un archivo, el respaldo sintetizado permite continuar.

## Presentación

- Límites SVG y tintes verdes/morados según dueño de las zonas existentes; regiones mixtas muestran ambos colores.
  Los bordes se actualizan tras capturas. Los contornos de continentes/costa son aproximados sobre las ilustraciones
  existentes; no constituyen nuevas rutas ni el mapa definitivo de toda la campaña.
- Nuevo retrato de Dave y guía ilustrada opcional de once pasos, accesible desde el inicio y la partida. Explica
  siembra, recursos, mapa, reservas exclusivas, terreno, frentes, pausa y objetivo. Pausa todos los tableros y
  restaura la pausa previa al cerrar. Mapas y selección ordinarios continúan dejando avanzar las oleadas.
- Ropa base con piernas alternas y mano articulada; figuras equipadas conservan torso/protección en el mismo marco.
  Conos, cubos y puertas muestran grietas según daño; brazos/cabezas/cascos se desprenden usando los eventos existentes.
  Es articulación por recortes del arte actual, no un catálogo completo de poses independientes de todas las unidades.
  Las figuras especiales conservan su representación anterior y aún necesitan poses propias más completas.
- Plantas con balanceo y respiración; proyectiles proporcionados con estelas de aire, fuego o hielo y estrellas rotatorias.
  El dibujo no consume azar ni modifica el estado del motor.
- Fondo ilustrado de día/noche/piscina/niebla sin cuadrícula pintada incompatible: las casillas se dibujan con la geometría
  real del motor. Hierba animada, mariposas/luciérnagas y pequeñas hormigas añaden movimiento sin afectar al combate.
  Los fondos específicos de carretera, almacén y demás regiones definitivas continúan pendientes.
- La copia autónoma se compila con 18 colecciones, el retrato de Dave y los 253 MP3 incrustados (aproximadamente 79 MiB).
  El prototipo anterior se conserva separado. No se publica el HTML grande como fuente en Git.

## Verificación

- `node scripts/pvz-audio/validar.mjs --desde public/jardin/pvz/audio`: 253 archivos válidos, cero pendientes;
  decodificación ffmpeg y duraciones. Esta revisión técnica no es una escucha humana.
- `scripts/probar-pvz-presentacion-audio.mjs`: MP3 reales decodificados/reproducidos en Chromium; ocho temas,
  bucles, no reinicio, pausa, silencio, resultado y contraataque real con música de frontera; once explicaciones en 844×390, regiones y escena de daño preparada.
- Regresiones de historia, carriles, protecciones, aventura y portátil; resultados y capturas locales en
  `juego/web/test-results/`. Los recorridos de doce zonas hasta el final usan un piloto y desactivan incursiones
  estratégicas en ese escenario: no acreditan balance de una campaña humana normal.

Comprobaciones completadas en este avance: `verificar:repo` (283 documentos, 122 JSON, 535 enlaces),
`probar:motores`, `probar:granja` (48 suites), `build`, `build:amigos` (609 archivos revisados por el filtro),
protecciones, carriles, aventura, historia, audio/presentación y humo de amigos. La integración completa
`granja-v3/verificar-demo.mjs` pasó sus seis comprobaciones, con dibujo por captura en un contexto aislado.
Las capturas de Dave, mapa y combate se inspeccionaron visualmente.

La copia autónoma completó las doce zonas de la partida preparada y recargó el final con su guardado;
el servidor de prueba solo entregó el HTML, bloqueando otras dependencias. La política de Chromium de este
entorno impide abrir `file://`, por lo que no se certifica aquí esa vía de apertura. Los archivos incrustados
sí se reprodujeron desde el HTML. No se cambiaron políticas del navegador.

El catálogo completo de PvZ 1/2/Fusión, arte propio restante, mapas definitivos, nuevo PvP y migración V1 siguen
registrados en [pendientes](pvz-pendientes-2026-10-22.md). La granja continúa congelada. No se ha ajustado dificultad,
balance ni economía.
