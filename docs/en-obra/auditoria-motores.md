# Motor y partidas completas: seguimiento de verificación

## Encargo vigente · 13 de octubre de 2026

Javier encargó terminar lo que falte para que los motores funcionen correctamente y probar una partida de inicio
a fin de cada juego. Cualquier propuesta de dificultad, balance, precios, costes o recompensas se presenta con
su efecto concreto y espera aprobación antes de cambiar código. Las correcciones funcionales, conservación de
partidas y comprobaciones de reglas continúan. Esta instrucción también está registrada en `AGENTS.md`.

La revisión parte de `9e290f6a`, integrado con la rama compartida. No se considera una campaña completa un
recorrido que habilita contenido, teletransporta personajes, entrega recursos o fuerza resultados mediante un
gancho de prueba. Esas pruebas sirven para la integración y se describen como escenarios preparados.

## Correcciones comprobadas

- **Show: guardado fallido.** La ronda solo se marca guardada cuando se confirma la escritura. Final y salida
  esperan la escritura en curso y reintentan cuando falla. Un diario local conserva respuestas/calificaciones
  pendientes y las recupera al volver a abrir el Show, la cabina o el libro, únicamente en la casa de origen.
  No incluye monedas ni premios, por lo que reenviarlo no repite pagos. Una casa configurada no se sustituye por
  el libro suelto si falla la conexión. Si también falla el almacenamiento local, se avisa del error.
- **Pregunta diaria.** Las nuevas fechas tienen respuestas propias. Al agotarse las 229 candidatas, las respuestas
  de episodios anteriores no revelan la nueva pregunta ni habilitan su moneda. Las respuestas previas del libro
  y la pregunta en curso de partidas antiguas se conservan. Los días archivados guardan su copia; el libro
  distingue fechas aunque se repita el ID. El cobro comprueba fecha y respuestas actuales.
- **Pruebas de motores.** `npm run probar:motores` comprueba partidas completas de Dados, Mancala, Cajas,
  Parchís, Parchís a dos colores y Clue; los dos jugadores pueden empezar y se recorren los niveles de IA.
  Se completaron 36 partidas. Cada movimiento se valida, se replica en otro estado y se serializa entre pasos; Mancala conserva sus 48
  semillas. Incluye siete regresiones de guardado/calendario del Show. Workflow: «Motores de mesa y Show».

No se cambiaron precios, puntuaciones, temporizadores, recompensas ni dificultad.

## Cobertura y límites

| Juego o sistema | Evidencia obtenida en esta revisión | Lo que falta para cerrar su recorrido |
|---|---|---|
| Dados Party | Reglas e IA y recorrido de navegador inicio → resultado → menú (37 s) | Precisión física de controles, persistencia, pausa y red |
| Mancala | Reglas e IA sin perder semillas y recorrido de navegador completo (6 s) | Controles físicos y red |
| Puntos y Cajas | Reglas e IA y recorrido de navegador completo (6 s) | Controles físicos y red |
| Parchís | Reglas e IA y recorrido de navegador hasta meta y menú (93 s) | Controles físicos del dado, pausa y red |
| Parchís a dos colores | Reglas e IA y recorrido de navegador hasta meta y menú (340 s) | Controles físicos de dos dados y red |
| Clue / ¿Quién fue? | Reglas e IA hasta acusación legal y recorrido de navegador completo (11 s) | Recorrido táctil completo y cartas privadas en red |
| El Show de Nosotros | Tres episodios locales y uno en línea completo; pausa, pérdida de mensajes, dos fallos de guardado, conflictos resueltos, mismo resultado y un episodio en el libro; sin errores | Todas las escenas y controles en dispositivos |
| Granja / Astra | Las 48 suites pasan. Seis comprobaciones de navegador casa–granja, inventario, correo, retorno y recarga sin errores | Campaña por controles normales desde cero; cerrar capacidades pendientes de la auditoría vigente y probar dispositivos |
| Lavarse la cara | Doce partidas simuladas desde cero en «cara», con compras pagadas y varias victorias de 30 minutos | Final de la Ducha Helada, demás escenarios y capítulos, controles táctiles, pausa y red |
| Sangre y Ceniza | Expedición simulada de cinco etapas y victoria en cementerio, monarca, peligro 1; perfil preparado, sin experiencia/equipo previo | Perfil desbloqueado desde cero, demás biomas, jefe final, controles y red |
| Súper Manía | Inventario de pruebas localizado | Campaña desde cero; comprobar progresión pagada, resultados y recarga, además de un día completo |
| Cien Puertas | Resolutor de toques/sensores y revisión de las 100 puertas localizado | Resolver campaña completa y verificar retorno, inventario, guardado y sensores de teléfono |
| Retrete espacial | Pruebas de integración localizadas; son escenarios preparados | Vuelo normal desde progreso nuevo hasta resultado, tienda pagada y continuación tras recarga |
| Cocina de chef: wafles, frappés y fresas | Pruebas de integración y red localizadas; algunas fuerzan el fin del día | Día completo normal de cada receta, pedidos, estaciones, propinas, guardado y continuidad |
| Casa / mascota virtual | Entrada, retorno y persistencia del recorrido de granja comprobados | Ciclo completo de cuidado, compras, habitaciones, trofeos y sincronización en dos perfiles |

Las compilaciones de pareja y amigos pasan. El filtro de amigos revisó 506 archivos y no encontró contenido
personal. Estas comprobaciones no certifican FPS, batería o memoria en Android real.

## Criterio de cierre por juego

1. Empezar con progreso nuevo en un contexto aislado, sin tocar la partida de Javier.
2. Llegar al resultado final mediante acciones legales; en juegos abiertos, completar un ciclo normal y volver.
3. Comprobar que desbloqueos y recursos se obtienen jugando, sin preparación de partidas.
4. Guardar, cerrar, reabrir y continuar; un cobro o entrega no se repite.
5. Probar derrota/cancelación, pausa, reconexión y almacenamiento lleno cuando corresponda.
6. Repetir la versión de amigos y el modo en pareja cuando estén disponibles.
7. Registrar fallos funcionales, correcciones y resultados. Las propuestas de balance llevan aprobación explícita.

**Estado:** auditoría en curso. No está certificado que todos los juegos estén terminados o perfectos.

## Cómo repetir esta tanda

Desde `juego/web/`:

```sh
npm run probar:motores
npm run probar:granja
npm run build
npm run build:amigos
# Servir dist completo y usar un navegador instalado si no está el de Playwright:
CHROME_PATH=/usr/bin/chromium node scripts/probar-show.mjs http://127.0.0.1:4182/mesa.html /tmp/show-local
CHROME_PATH=/usr/bin/chromium FALLAR_GUARDADOS=2 node scripts/probar-show-linea.mjs http://127.0.0.1:4182/mesa.html /tmp/show-linea
CHROME_PATH=/usr/bin/chromium node scripts/probar-mesa-recorridos.mjs http://127.0.0.1:4182/ /tmp/mesa-recorridos
```

Ejecutar los recorridos de navegador de a uno y terminar de compilar antes de abrirlos. Cada script utiliza
contextos nuevos; no se ejecuta contra la cuenta o las partidas reales de Javier.
