# Jardín para dos · 16 de octubre de 2026

## Encargo y alcance

Javier pidió ver los gráficos del juego y poder jugar dos personas: una ataca con zombis y la otra defiende con
plantas. Se mostró una captura del juego real, con sus figuras 3D originales de peluche. Se añadió una opción
en el Jardín para jugar en una pantalla o en dos dispositivos mediante sala por código.

La granja sigue pausada, no se generan voces ni se cambian las estadísticas, compras o estrellas de campaña.
La clasificación de juegos mentales es otro frente: su plugin aparece instalado pero aún faltan herramientas
de conexión en este chat. El duelo usa las salas existentes y no requiere migraciones de tablas.

## Implementación

- `jardin-duelo.html` en las compilaciones completa y de amigos, con acceso desde el Jardín y desde crear/unirse
  a sala de amigos. El regreso conserva rol y modo local.
- Cinco carriles, ocho plantas, cinco zombis. Las plantas siembran y recogen luz; los zombis eligen unidad y
  carril. No se añaden oleadas automáticas al duelo. Preparación inicial de veinte segundos dentro de una ronda
  de tres minutos. La niebla, reclutamiento y recargas son reglas propias de este modo nuevo.
- El anfitrión elige bando o lo intercambia antes de empezar. La revancha requiere aceptar en ambos aparatos,
  crea una nueva sesión e invierte los bandos.
- Solo el anfitrión confirma órdenes, costes, ataques y resultados; el invitado interpola posiciones entre
  estados confirmados. No simula daño ni reparte premios. Órdenes, pausa y primer final usan transporte fiable.
- Ambos deben cargar las figuras antes de que avance el reloj. Cualquier persona puede pausar, pero cada una
  retira solo su pausa. Los cortes detienen el motor; abandonar no se transforma en una victoria.
- Se corrigió el mensaje genérico de sala llena: ya no afirma «cuatro» cuando el juego admite solo dos.

## Comprobación

El motor demuestra victoria natural de zombis al consumir un farol y volver a cruzar ese carril. Las plantas
resisten tres minutos contra reclutas legales con tres semillas. Pasan bando incorrecto, preparación, costes,
recargas, límites de carril, órdenes duplicadas/ajenas, corte, pausa independiente, final fiable y revancha.
La vista interpola sin inventar daño y se detiene cuando deja de recibir fotos. Los doce patios anteriores
siguen pasando con tres semillas cada uno.

El recorrido de interfaz pasa con acciones por toque en una pantalla y entre dos contextos de navegador,
con 8 % de pérdida de mensajes, demora aleatoria de hasta 175 ms y corte recuperable. Pasan ambos resultados,
tercer jugador rechazado, pausa independiente, revancha y cierre al salir el anfitrión.

También pasó una sala efímera en **Supabase Realtime real**, con dos contextos aislados: selección de bandos,
órdenes reales de ambos, rechazo del tercero, pausa, dos resultados naturales, revancha con bandos invertidos
y cierre. `real: true`, `errores: []`, `bad: []` en `realtime-real/resultado.json`. No se escribieron filas de
clasificación ni tablas de la casa. Esta comprobación no despliega ni acredita las funciones de juegos mentales.

Las capturas, logs y resultados de esta ampliación están en `juego/web/test-results/jardin-duelo-2026-10-16/`.

El recorrido completo también pasa sobre la compilación de amigos: sin errores de navegador ni recursos fallidos.
Se repitió el primer patio de campaña por toque, con victoria, pausa y guardado fallido recuperado. Pasan los
motores completos, las 48 suites de granja y los seis checks de integración de casa/granja sin cambios en sus
fuentes. Ambas compilaciones pasan; el filtro de amigos revisa 594 archivos sin contenido personal de pareja.
La higiene de documentos, JSON y enlaces y la sintaxis de los scripts también pasan.

No se han certificado teléfonos físicos ni balance competitivo entre personas. Las estadísticas de los
doce patios siguen iguales; cualquier ajuste posterior de dificultad o balance requiere aprobación de Javier.
