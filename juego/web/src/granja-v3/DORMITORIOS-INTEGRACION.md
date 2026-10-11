# Dormitorios privados y objetos domésticos

Integrados el 10 de octubre de 2026 en el mismo motor granja-v3 y guardado V5.

## Comportamiento

Los 24 residentes tienen un dormitorio propio, conectado mediante una puerta de su sala común. Se retiran las camas de las salas comunes y se conservan las 17 viviendas y los diez edificios exteriores nuevos. Compartir vivienda no fija parentescos ni romance.

La entrada requiere conocer al propietario, 500 puntos de amistad (dos corazones), estar cerca de su puerta dentro de la vivienda correcta y el horario de visita 08:00–21:00. La puerta se puede seleccionar directamente en 3D con mouse o desde el detalle de la vivienda. No se abre desde el pueblo, otra vivienda o un dormitorio distinto. El requisito se comprueba al entrar: una reducción posterior de amistad no expulsa una visita ya admitida, y la recarga conserva esa visita.

Al salir del dormitorio se vuelve a la sala, frente a la puerta correspondiente. Una segunda salida devuelve al barrio por la puerta exterior. El jugador camina con teclado dentro de ambos espacios. El reloj se mantiene pausado en los interiores, sin avanzar días, cultivos ni edades. Dormir en la cabaña conserva su funcionamiento anterior.

Si el habitante está en casa, antes de las 19:00 aparece en la sala común; desde las 19:00 y hasta el final de las visitas aparece solo en su dormitorio. Quienes siguen trabajando o paseando no aparecen en casa. La conversación usa la misma amistad, regalos, cumpleaños y encargos; exige presencia y cercanía. No hay un duplicado del NPC en ambas habitaciones.

## Muebles y presentación

Cada cuarto tiene cama, escritorio, biblioteca, ventana, alfombra y planta, con colores de su habitante y geometría agrupada. Actualmente comparten distribución; no son 24 diseños arquitectónicos exclusivos. Se cargan solo el interior visitado y su habitante.

Escritorio y biblioteca son consultables desde el detalle del dormitorio, al acercarse al mueble. La consulta abre «Objetos y recuerdos», un panel de lectura pausado y adaptable a móvil. Los textos son originales y generales de esta etapa; no revelan todavía biografías o misiones nuevas. No consume objetos ni otorga amistad, dinero o recompensas repetibles. El detalle actualiza los botones según la distancia del jugador. Camas, escritorio, estante y paredes tienen colisiones.

## API y guardado

`dormitorios.ts` concentra `dormitorioDef`, `puertaDormitorio`, `puertaDormitorioEn`, `puedeEntrarDormitorio`, `horaDormitorio`, `libreDormitorio`, `MUEBLES_DORMITORIO` y `AMISTAD_DORMITORIO`.

- Entrada: `{tipo:'entrar_dormitorio',npcId,xJugador,zJugador}`.
- Consulta: `{tipo:'inspeccionar_mueble',mueble:'escritorio'|'biblioteca',xJugador,zJugador}`.
- Salida: `{tipo:'salir'}`.
- Interior guardado: `dormitorio_<npcId>` en el campo `interior` de V5.

`viviendaInterior` reconoce la vivienda propietaria tanto desde su sala como desde un dormitorio. Identificadores inexistentes y dormitorios fuera del pueblo se rechazan al importar. Las partidas V5 anteriores conservan la sala común y no necesitan otra migración ni otro campo. Como en el resto de la importación de partidas, no se intenta certificar que el progreso importado haya sido obtenido jugando.

## Verificación y pendientes

Diez casos específicos correctos: las 24 puertas y cuartos, límite 499/500, vivienda/hora/distancia, persistencia y doble salida, colisiones, lectura sin recompensa, geometría, estancia del NPC sin duplicación, importación inválida y estados de interfaz. Regresión de 26 suites correcta. TypeScript/Vite correctos. Seis recorridos de navegador prueban puerta 3D, rechazo por amistad, teclado, recarga, lectura y salida a sala/pueblo; captura revisada a 412 × 915. No certifica rendimiento físico en S21 FE o S24 Ultra.

Evidencia: `work/qa-motor/dormitorios-regresion.json`, `dormitorios-navegador.json` y `renders/dormitorio-*.png`. Pruebas: `scripts/granja-v3/probar-dormitorios.mjs`, `work/qa-dormitorios.cjs`.

Quedan distribución y objetos propios de cada biografía, animaciones de apertura de puertas, sentarse/dormir de los NPC, ventanas con paisaje, eventos domésticos completos, cartas ramificadas y festivales. No implementa romance nuevo ni cambia la casa del jugador o las recompensas que Claude definirá. No se certifica paridad completa con Stardew Valley, Expanded o Automate.
