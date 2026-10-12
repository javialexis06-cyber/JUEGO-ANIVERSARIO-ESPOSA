# Nuestra granjita · integración actual

**Historia nueva, todavía sin activar:** [biblia narrativa](../narrativa/README.md) y contrato
`juego/web/src/granja-v3/NARRATIVA-INTEGRACION.md`. Desarrolla todo el reparto previsto, campaña,
relaciones y secundarios, con guiones exportables; no agrega NPC, escenas, premios ni voces al motor.
El usuario autorizó publicar el trabajo completo; las misiones nuevas y Confluencia siguen en diseño.

La granja vive en `juego/web/src/granja-v3/`, con entrada `granja-v3.html`, guardado V5 y una única fuente de motor. El 10 de octubre de 2026 se integra sobre la versión actual del proyecto principal. Está en desarrollo: no certifica paridad completa con los juegos de referencia.

En la casa, abrir el cuarto de juegos y elegir «Nuestra granjita». En la granja, acercarse a la entrada de la cabaña y abrir la casa real; aparece «Volver a la granja» para recuperar la posición. No se transfieren por esta navegación inventario, monedas o recompensas entre economías. El guardado de granja sigue local; la integración no añade multijugador o sincronización Supabase a sus sistemas.

Teclado: WASD/flechas para caminar; mouse para acciones y selección. La barra permite ordenar herramientas, comida y objetos. Las jornadas se guardan y avanzan al dormir; cierre/recarga no gastan días de temporada. Los cuidados reales conservan sus reglas separadas.

Toca el reloj para ver cuatro festivales estacionales del Pueblo del Sol. Inscripción de 10:00 a 16:00 junto a la fuente; actividades sencillas, premio anual único y recuerdos. La feria de otoño usa una unidad de cosecha real, consumida solo al cobrar. El calendario se pausa durante la participación; los cuidados reales continúan. Recarga y fallo de almacenamiento conservan o revierten los pasos. Ese día la plaza se decora con lo de cada festival, modelado en Blender: guirnaldas de banderines, farolillos, hojas o bombillos entre cuatro postes, un arco de bienvenida en la calle del oeste, el puesto de semillas, la tarima de la ronda, la mesa de la cosecha o el árbol de los recuerdos, un rincón de adorno y una corona en la fuente (`festejos-render.ts`).

En Misiones o el tablón de la Casa de los Oficios aparecen dos ofertas diarias, una semanal y un pedido especial semanal. Cambian solo al dormir; los encargos aceptados conservan su plazo. Los tres especiales separan actividad, revisión con el solicitante y entrega real en dos etapas, con premio único de monedas, amistad y objetos útiles. Los doce pedidos permanentes y las partidas anteriores se conservan.

El buzón ofrece un proyecto de riego o cuidados después de despejar terreno y dormir tres jornadas; otro de pesca o minería después de una expedición y cinco jornadas. Cada propuesta permite elegir una sola rama. El encargo elegido tiene dos etapas y, al completarlo, enseña una receta alternativa útil. Cancelar o vencer permite retomar esa misma rama con devolución de las entregas y sus calidades. La elección, receta, confirmación y cierre permanecen al guardar; la correspondencia nueva llega solo al dormir.

En Colecciones puedes consultar seis lotes sin plazo. Entra a la Casa de los Oficios para reservar entregas
por casilla y calidad, recuperarlas o cerrar un lote como donación permanente. Cada cierre entrega un premio
único; los cuatro lotes agrícolas abren semillas durante todo el año al precio original. La siembra conserva
estación y clima. El cuaderno registra solo lo donado, y el Atlas continúa como vista previa separada.
Partidas anteriores, recarga, mochila llena y fallo de almacenamiento conservan o revierten los pasos.

En Explorar o la biblioteca de la Casa de los Oficios puedes consultar tres cuadernos. Se recuperan
junto al campamento principal de los pisos 1, 5 y 9 de Minas de Celia, con cercanía y camino despejado.
Regresa y lee para aprender prospección (3 antorchas y 8 de energía revelan una bajada sin extraer vetas),
o recetas de cobre y vidrio en 20 segundos con los mismos ingredientes y requisitos originales.
Encontrado y leído persisten por separado; relecturas no dan premios y un guardado fallido revierte también
la escalera y el pago. Son textos técnicos propuestos, sin canon nuevo ni cambios de arte.

Las expediciones actuales admiten espada, arco con flechas, bastón y un sello elemental activo a la vez. Las recetas usan recursos básicos y banco de trabajo; el dominio aumenta solo con impactos y tiene tope. Los proyectiles colisionan con enemigos y paredes, y se cancelan al salir. Confluencia, sus materiales, ajustes regionales y jefes todavía son diseño. El contrato está en `docs/narrativa/11-armas-y-combate.md`.

Los documentos detallados están en el módulo: `PUEBLO-INTEGRACION.md`, `VIVIENDAS-INTEGRACION.md`, `DORMITORIOS-INTEGRACION.md`, `VIDA-SOCIAL-INTEGRACION.md`, `ENCARGOS-INTEGRACION.md`, `CORREO-INTEGRACION.md`, `COLECCIONES-INTEGRACION.md`, `LIBROS-INTEGRACION.md`, `FESTIVALES-INTEGRACION.md`, `CARPINTERIA-INTEGRACION.md` y `COMPANIA-INTEGRACION.md`. `PLAN-MOTOR-COMPLETO.md` registra las capacidades parciales y pendientes. `REPARTO-COMPLETO.md` y `PLAN-PUEBLOS-MUNDOS.md` son planificación de contenido, no un catálogo de mundos ya terminados.

El monte que rodea cada zona (robles, pinos, helechos, matas, hongos y troncos caídos) los arcos y letreritos de las salidas, lo que se alcanza a ver más allá de cada arco y lo hecho por mano en la cueva de la mina (entibados, vía, vagoneta y cristales) vienen de Blender (`granja_monte.glb`). Las máquinas de producción (cofres, portales, hornos, telar, prensa, molino, la nave…) tienen su cuerpo modelado en Blender (`granja_maquinas.glb`); sus partes móviles siguen animadas igual. El Pueblo del Sol también viene de Blender: sus 14 edificios y los dos altares (`granja_edificios.glb`) y la utilería (la fuente, bancos, faroles, jardineras, vallas, árboles, la rueda del molino, los animales del corral y lo de cada local; `granja_pueblo.glb`). Los interiores (cabaña, los nueve locales, las viviendas y los dormitorios) se arman con el kit de muebles modelado en Blender (`personajes/blender/granja_muebles.py` → `public/modelos/granja_muebles.glb`, armado en `src/granja-v3/cuartos.ts`); el contrato está en la coordinación.

El cargador `src/granja-v2/biblioteca.ts` y los modelos de `public/modelos/granja-v2/` son dependencias visuales. Los antiguos motores y demos no se publican. No hay nuevas dependencias runtime. Las pruebas se ejecutan con `npm run probar:granja`; al integrar también se revisan `npm run build` y `npm run build:amigos` y el flujo de casa/retorno.

El reparto de trabajo solicitado por Javier está en [`../en-obra/granja-coordinacion.md`](../en-obra/granja-coordinacion.md): motor, historia y sistemas en el frente de granja; gráficos, personajes y presentación a cargo de Claude. Cada avance probado se sube al repositorio.

**Lugares físicos e inicio guiado (12 de octubre de 2026).** El Pueblo del Sol tiene el **Gremio de Aventureros**
(tablón de expediciones y campaña; atiende la exploradora) y el **Museo del Valle** (lotes de las estaciones, donaciones
y seis vitrinas que muestran en 3D lo expuesto, pedestales de los lotes cerrados y galería de especies; atiende el vecino
mayor). Los terrenos se compran en la Oficina de tierras del Taller del Roble. Las partidas nuevas empiezan con el
prólogo de Celia y siete «Primeros pasos» (`guia.ts`) que llevan del primer surco a la carta del pueblo, sus lugares, la
primera historia y la primera noche; cada local se presenta la primera vez. La historia de cada vecino se abre por partes
(charlas en días distintos y su misión). Detalle en [`../en-obra/granja-arreglos.md`](../en-obra/granja-arreglos.md),
tanda 6.
