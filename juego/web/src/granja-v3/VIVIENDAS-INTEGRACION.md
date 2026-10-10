# Viviendas del Pueblo del Sol

## Dormitorios privados integrados

Actualización del 10 de octubre de 2026: 24 dormitorios con puerta física desde la sala, entrada por 500 puntos de amistad, cercanía y horario; lectura de escritorio/biblioteca sin recompensas, presencia del NPC al final de la tarde, persistencia y retorno primero a la sala y luego al pueblo. [DORMITORIOS-INTEGRACION.md](DORMITORIOS-INTEGRACION.md) describe API, pruebas y límites. Los cuartos comparten distribución; faltan diseño específico, animaciones de puerta y eventos domésticos completos.


Integradas el 10 de octubre de 2026 sobre granja-v3 y guardado V5. Se conserva el motor, los 24 IDs, relaciones, regalos, encargos y encuentros sociales. La casa del jugador sigue conectada al proyecto de Claude.

## Mapa y reparto

Se conecta el reparto de 17 domicilios de `REPARTO-MUNDOS.json`. Siete usan una entrada compartida con el edificio comercial, pero abren un interior residencial independiente. Diez casas nuevas forman barrios norte y sur, con calles y colisiones. Incluyen domicilios propios para las dos Santas, sin convertir sus altares en dormitorios.

| Vivienda | Ocupantes |
|---|---|
| Vivienda del Mercado | Mercader |
| Casa del Corral | Cuidadora |
| Vivienda del Roble | Carpintera |
| Casa de la Forja | Herrero |
| Vivienda del Jardín | Veterinaria |
| Habitaciones de la Posada | Posadera y cocinero |
| Vivienda del Archivo | Archivero |
| Casa del Despertar | Santa de Aura |
| Casa de la Calma | Santa de Lara |
| Casa de la Ribera | Pescadora y minero |
| Casa de los Senderos | Exploradora y viajera |
| Casa del Huerto | Botánica, agricultor y dos aprendices |
| Dúplex de la Escuela | Maestra y música |
| Cabaña del Guardabosques | Guardabosques |
| Casa de los Tejidos | Artesana |
| Vivienda del Observatorio | Astrónoma |
| Casa del Rosal | Vecino mayor |

Compartir vivienda no establece parentescos ni romance. Los nombres propios del reparto propuesto no sustituyen los títulos actuales.

## Uso y comportamiento

En Vecinos, el botón «Ver las viviendas del pueblo» abre el directorio. Muestra residentes, puerta y botón de visita habilitado al caminar cerca de esa puerta, entre las 08:00 y las 21:00. Las casas nuevas también responden al clic sobre su fachada. Para las viviendas anexas se usa el directorio desde el exterior del local. No transporta al jugador hasta otra puerta.

Cada interior permite movimiento de teclado, conversación y regalos con mouse, salida al barrio y recarga de partida. El regreso conserva la puerta exacta. No permite abrir un comercio desde dentro de otra casa. Mesas, camas presentes, estante y paredes limitan el paso; las camas que no existen no bloquean espacio.

Los habitantes regresan a su domicilio real según la misma semana, hora y clima de su rutina. Desaparecen del exterior cuando están dentro y aparecen en el interior durante el horario de visita. Conversar requiere que estén en casa, despiertos y cerca; no permite hablar a un NPC ausente. Usa las mismas relaciones, gustos y límites de regalos y permite entregar encargos si su cliente está presente.

El reloj se pausa en los interiores como en los locales actuales. No avanza días, temporadas, cultivos o edad de animales; esos avances siguen ocurriendo al dormir en la cabaña del jugador. Los cuidados reales conservan su regla anterior.

## Arte, API y guardado

Los interiores comparten el estilo de arcilla existente: suelo de tablas, ventanas, camas para cada ocupante, alfombra, mesa, vajilla, estantería, libros y plantas. Añaden objetos según el oficio. Las fachadas reutilizan y varían la arquitectura actual. La geometría está agrupada por colores para evitar una llamada de dibujo por cada tabla o mueble; no se añaden imágenes externas.

Datos en `pueblo-datos.ts`: `VIVIENDAS_PUEBLO`, `viviendaDef`, `viviendaDe`, `viviendaInterior`, `viviendaEn`, `libreVivienda`, `posicionResidente` y `visitaVivienda`. Acción: `{tipo:'entrar_vivienda',id,xJugador,zJugador}`. Salida mediante `{tipo:'salir'}`. El interior se identifica como `vivienda_<id>` en `EstadoGranja.interior`; no requiere otro campo ni versión de guardado. Los interiores falsos y los domicilios fuera del pueblo se rechazan.

Los límites del pueblo se amplían de z −33…30 a −43…44. La malla de rutas peatonales se amplía para conectar ambos barrios; conserva fuente, canal, puentes, árboles, locales y acceso a la granja.

## Verificación y alcance

Doce casos específicos correctos: reparto único, puertas conectadas, ausencia de superposiciones, horarios, cercanía, persistencia de los 17 interiores, posición de salida, importación corrupta, muebles, rutas de regreso y presencia/conversación en casa. Regresión de 25 suites correcta. TypeScript y Vite correctos. Siete recorridos de navegador con teclado/mouse y revisión visual a 412 × 915; no es medición de rendimiento en un teléfono físico.

Evidencia del workspace: `work/qa-motor/viviendas-regresion.json`, `viviendas-navegador.json`, `renders/viviendas-*.png`; pruebas en `scripts/granja-v3/probar-viviendas.mjs` y `work/qa-viviendas.cjs`.

Son interiores residenciales básicos: el dúplex es una sala compartida, sin planta superior física ni dormitorios privados con puertas propias. Faltan decoración exclusiva más elaborada, habitaciones por niveles de amistad, muebles interactivos, visitas y escenas puestas en escena, restauración mediante misiones y viviendas de los otros pueblos. No hay nuevos servicios de escuela u observatorio por construir una vivienda con ese nombre. No se certifica la paridad completa con Stardew Valley, Expanded o Automate.
