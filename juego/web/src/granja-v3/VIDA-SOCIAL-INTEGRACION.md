# Calendario y encuentros del pueblo

Integrado el 10 de octubre de 2026 sobre el motor granja-v3 y guardado V5 existente. No crea otro motor ni sustituye la casa de Claude.

## Calendario y cumpleaños

El calendario muestra los 28 días de la estación actual, señala hoy y los seis cumpleaños de esa estación. Los 24 IDs existentes conservan sus relaciones y horarios. Las fechas son una propuesta original editable en `CUMPLEANOS`, no una reproducción del calendario de Stardew Valley. También aparecen en la ficha y conversación de cada habitante.

Un regalo aceptado que no desagrade en su cumpleaños añade hasta 60 puntos de amistad, sin superar 2500. Solo una celebración por año. Se mantienen un regalo por día y dos por semana; no se añade una excepción al límite semanal. El bonus usa la jornada guardada, no el reloj real. El regalo conserva la selección de casilla y calidad del sistema anterior.

## Ocho encuentros originales

| Encuentro | Habitante | Requisito además de conocerse |
|---|---|---|
| La primera página | Archivero | 20 puntos |
| Madera con historia | Carpintera | 250 y pedido_roble completado |
| Aprender a escuchar | Veterinaria | 250 y pedido_cuidado completado |
| Una canción para el valle | Música | 500 |
| La orilla paciente | Pescadora | 250 y pedido_pesca completado |
| Una semilla y un recuerdo | Botánica | 250 y una cosecha |
| Lo que vuelve a levantarse | Veterano | 250 y una reparación |
| El cielo compartido | Astrónoma | 250 y pedido_cuarzo completado |

Se inicia desde la conversación, cerca del NPC o dentro de su servicio abierto. Dos páginas de diálogo y dos respuestas por encuentro; ambas suman hasta 40 puntos, sin castigar preferencias personales. La elección queda guardada y se consulta en la conversación. Los requisitos se basan en progreso real, no en tiempo desconectado. No entrega tokens de casa ni decide la historia definitiva.

Durante el encuentro el panel mantiene pausado el reloj y bloquea las demás acciones del motor. Cerrar el panel vuelve al diálogo; se puede cancelar explícitamente y reiniciar sin premio. Una recarga recupera el paso guardado. Una respuesta de un paso anterior, doble cobro o elección inválida se rechaza. Son encuentros mediante diálogo: todavía no hay puesta en escena con desplazamientos, cámaras o animaciones específicas.

## API y persistencia

`EstadoGranja.vidaSocial = {version:1, cumpleanos:{[npcId]:ano}, escenas:[{id,dia,eleccion}], actual:{id,paso}|null}`.

Acción: `{tipo:'social', accion:{tipo:'iniciar',id}|{tipo:'avanzar',id,paso}|{tipo:'elegir',id,paso,eleccion}|{tipo:'cancelar',id}, xJugador,zJugador}`.

Motor valida fechas, duplicados, escenas, índices y años. Una V5 sin este campo recibe estado vacío; un campo presente corrupto se rechaza. El frontend escribe las acciones sociales y los regalos antes de confirmarlos; si falla el almacenamiento restaura el estado anterior, sin consumir el regalo ni otorgar amistad.

## Verificación y límites

Compilación TypeScript/Vite correcta. Regresión de 24 suites correcta; la suite social se amplió después a 17 casos correctos, incluyendo ambas respuestas de los ocho encuentros, cumpleaños reales, migración, límites, cancelación y ausencia real. Siete recorridos headless con mouse: calendario, inicio, cierre/pausa, recarga del diálogo, cuota agotada, elección móvil y persistencia final. Revisión visual a 412 × 915; no equivale a rendimiento medido en un S21 FE o S24 Ultra.

Evidencia en `work/qa-motor/vida-social-regresion.json`, `social-navegador.json` y capturas `renders/social-*.png` del workspace. Pruebas: `scripts/granja-v3/probar-vida-social.mjs` y `work/qa-social.cjs`.

Actualización posterior: los 17 interiores residenciales básicos están conectados; véase VIVIENDAS-INTEGRACION.md. Actualización posterior: los 24 dormitorios privados y sus puertas están integrados; véase DORMITORIOS-INTEGRACION.md. El calendario aún no organiza festivales jugables. Quedan encuentros de los otros 16 habitantes, correo, eventos de más corazones, puesta en escena, festivales y residentes de los otros mundos. No se certifica paridad con Stardew Valley, Expanded o Automate.
