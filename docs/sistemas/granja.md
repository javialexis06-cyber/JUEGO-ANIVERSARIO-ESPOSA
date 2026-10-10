# Nuestra granjita · integración actual

La granja vive en `juego/web/src/granja-v3/`, con entrada `granja-v3.html`, guardado V5 y una única fuente de motor. El 10 de octubre de 2026 se integra sobre la versión actual del proyecto principal. Está en desarrollo: no certifica paridad completa con los juegos de referencia.

En la casa, abrir el cuarto de juegos y elegir «Nuestra granjita». En la granja, acercarse a la entrada de la cabaña y abrir la casa real; aparece «Volver a la granja» para recuperar la posición. No se transfieren por esta navegación inventario, monedas o recompensas entre economías. El guardado de granja sigue local; la integración no añade multijugador o sincronización Supabase a sus sistemas.

Teclado: WASD/flechas para caminar; mouse para acciones y selección. La barra permite ordenar herramientas, comida y objetos. Las jornadas se guardan y avanzan al dormir; cierre/recarga no gastan días de temporada. Los cuidados reales conservan sus reglas separadas.

Los documentos detallados están en el módulo: `PUEBLO-INTEGRACION.md`, `VIVIENDAS-INTEGRACION.md`, `DORMITORIOS-INTEGRACION.md`, `VIDA-SOCIAL-INTEGRACION.md`, `ENCARGOS-INTEGRACION.md`, `CORREO-INTEGRACION.md`, `CARPINTERIA-INTEGRACION.md` y `COMPANIA-INTEGRACION.md`. `PLAN-MOTOR-COMPLETO.md` registra las capacidades parciales y pendientes. `REPARTO-COMPLETO.md` y `PLAN-PUEBLOS-MUNDOS.md` son planificación de contenido, no un catálogo de mundos ya terminados.

El cargador `src/granja-v2/biblioteca.ts` y los modelos de `public/modelos/granja-v2/` son dependencias visuales. Los antiguos motores y demos no se publican. No hay nuevas dependencias runtime. Las pruebas se ejecutan con `npm run probar:granja`; al integrar también se revisan `npm run build` y `npm run build:amigos` y el flujo de casa/retorno.

El reparto de trabajo solicitado por Javier está en [`../en-obra/granja-coordinacion.md`](../en-obra/granja-coordinacion.md): motor, historia y sistemas en el frente de granja; gráficos, personajes y presentación a cargo de Claude. Cada avance probado se sube al repositorio.
