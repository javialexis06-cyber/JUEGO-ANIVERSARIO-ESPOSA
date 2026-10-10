# Habilidades en el motor existente

Integración del 9 de octubre de 2026. Entrada activa: `granja-v3.html`. Se amplía `MotorGranja`; el guardado conserva versión 5 y añade `habilidades.version = 1`. No se añade otro motor ni otro paquete del juego.

## Experiencia y descanso

Cinco habilidades independientes, niveles 0–10. Umbrales acumulados: 0, 100, 380, 770, 1300, 2150, 3300, 4800, 6900, 10000 y 15000 XP. El nivel se calcula a partir de XP, nunca se almacena una segunda copia susceptible de divergir. La XP tiene tope 15000.

| Actividad completada | Habilidad | XP |
| --- | --- | --- |
| Cosecha madura, incluido rebrote | Agricultura | Máximo entre 8 y tres veces los días del ciclo |
| Recoger fruta de un árbol | Agricultura | 8 por fruta |
| Recoger productos animales | Agricultura | 5 por unidad original; los productos de profesión no multiplican XP |
| Nacimiento válido | Agricultura | 25 |
| Alimentar o consentir manualmente | Agricultura | 5, una vez por animal y jornada, compartida entre métodos |
| Destruir roca exterior | Minería | 8 + 3 por piso de mina, cuando corresponda |
| Destruir veta en expedición | Minería | 8 + 5 por nivel de pico exigido por el mineral |
| Derribar árbol / árbol gigante | Recolección | 12 / 30 |
| Talar frutal adulto | Recolección | 12; los plantones no dan XP |
| Cortar maleza | Recolección | 2 |
| Captura exitosa | Pesca | 8 + 4 × rareza; una tirada, aunque la profesión dé dos peces |
| Derrotar criatura en expedición | Combate | Mitad de su vida base, redondeada hacia arriba |
| Derrotar enemigo del contrato exterior anterior | Combate | 30 + 5 por nivel de mina |

Labrado, siembra, riego, golpes parciales, peces escapados, mover objetos y recoger de nuevo un botín no dan XP. La automatización y el ayudante no conceden XP por cuidado durante ausencia. Toda ganancia pertenece a la transacción de la acción; un rechazo, mochila llena o exceso de objetos en suelo revierte también la experiencia.

Al ganar nivel, la eficiencia se aplica inmediatamente. El coste de herramienta es `base × (1 − 0.04 × nivel)`, con mínimo 0.2, redondeado a dos decimales; las profesiones de herramienta ligera multiplican por 0.65 únicamente la herramienta indicada. Se conservan las bases anteriores: 1 para golpes/azada/pico, 3 por lanzamiento y 4 para el contrato de combate exterior. El riego manual ahora cuesta un uso, incluso si refresca humedad; no cobra al inspeccionar una planta madura. Labrado por área limita la cantidad de casillas a la energía disponible.

Agricultura aumenta la calidad determinista de cosecha junto al abono, reemplazando la aproximación anterior basada en cosechas globales. Pesca añade un punto de precisión por nivel; a nivel 7 una captura precisa puede ser plata. Combate añade un punto de ataque por cada dos niveles. Todas las habilidades reducen el coste de sus herramientas correspondientes.

Al dormir, `reconocerAprendizajes` avanza `reconocidos` y añade `ResumenJornada.aprendizajes`. Las recetas y profesiones se habilitan entonces. El resumen puede incluir varios niveles y todas sus recetas, sin concederlos otra vez al leerlo o comenzar la mañana. Un fallo de la copia nocturna revierte reconocimientos, resumen, jornada, productos y dinero. El cuidado real y el calendario agrícola siguen separados: la ausencia no otorga XP ni crecimiento.

## Profesiones y recetas

`PROFESIONES` en `habilidades.ts` contiene 30 opciones: dos de nivel 5 por habilidad, y dos especializaciones por rama al nivel 10. Se elige una de cada nivel. La elección valida nivel reconocido, habilidad, padre y elección previa. Sus efectos activos incluyen calidad de cultivo y productos animales, productos adicionales, descuento veterinario, madera/piedra/minerales/heno/semillas adicionales, comida más eficaz, precisión y calidad de pesca, dos peces por captura, ataque, defensa y coste de herramientas concretas. No hay profesiones que solo guarden una etiqueta.

Acción pública: `{ tipo: 'elegir_profesion', profesion: '<id>' }`. Los IDs y descripciones están en el catálogo del módulo. No mutar profesiones directamente desde la interfaz. `profesionesDisponibles` devuelve únicamente opciones válidas. `efectosHabilidades` agrega efectos generales; el coste por herramienta se calcula con `costeHerramienta`, que evita extender una bonificación de hacha a guadaña o de azada a regadera.

`requisitoReceta` asigna habilidad y nivel de aprendizaje a las 95 recetas actuales. Aspersores: agricultura 2/5/9; abono mejorado: agricultura 3; cebo refinado: pesca 2; molino/prensa/fermentador/telar: agricultura 1/2/4/4; cofre de hierro/recicladora/batería: recolección 3. Otros requisitos se derivan del nivel y familia de la receta. La estación, los materiales, la herramienta y los descubrimientos originales siguen siendo necesarios.

`recetaPermitida` es compartida por motor e interfaz. Se comprueba al fabricar a mano, encolar, elegir receta automática y comenzar un ciclo automático. Una cola ya pagada puede terminar sin reclamar de nuevo aprendizaje; no se pierden reservas. Las recetas básicas de nivel de aprendizaje cero están disponibles desde el comienzo.

## Guardado, interfaz y compatibilidad

Los guardados que realmente carecen de `habilidades` se migran una sola vez. Se estima XP conservadora a partir de estadísticas existentes, se reconocen esos niveles y se mantienen las recetas que estaban disponibles con herramientas y descubrimientos antiguos. También se preservan recetas configuradas, activas o pagadas en máquinas. No se eligen profesiones por el jugador. Los campos presentes y dañados se rechazan; nunca se reparan inventando progreso.

`Animal.ultimoDiaExperiencia` es opcional para compatibilidad, y valida el día dentro del calendario de la partida. Se conserva al recargar para impedir repetir el mismo crédito diario. XP, niveles reconocidos, ramas, recetas legadas y aprendizajes nocturnos se validan al importar.

Cuaderno: menú **Habilidades**, o tecla **F**. Contiene diez marcas de nivel, barra de XP, faltante, actividad que concede XP, coste real de herramientas, profesiones disponibles/elegidas y siguientes recetas. Fabricación explica los aprendizajes pendientes y el resumen nocturno muestra lo aprendido. Los precios veterinarios reflejan la profesión activa. Las nuevas piezas de interfaz usan los iconos existentes y no añaden texturas ni modelos.

Referencia funcional consultada: [Stardew Valley Wiki — Skills](https://stardewvalleywiki.com/Skills), 9 de octubre de 2026, para las cinco habilidades, diez niveles, profesiones de niveles 5/10 y reconocimiento nocturno. Las fórmulas de energía, XP por acciones del proyecto y efectos de profesiones son reglas propias ajustables; no certifican equivalencia de balance ni incorporan ejecutables del juego de referencia.

## Validación y límites

`scripts/granja-v3/probar-habilidades.mjs`: 29 casos de reglas, transacciones, profesiones, receta manual/automática, combate/minería reales, recarga y migración. Regresión: 178 casos anteriores de agricultura, interacción, cuidados, clima, jornada, producción, huerto, aventura, envíos y barra.

`work/qa-habilidades.cjs`, en la raíz de trabajo: seis recorridos de navegador con ratón y teclado, desbloqueo nocturno, fabricación en banco, elección, gasto real al labrar, recarga, especialización, fallo de cuota y pantalla de 412 × 915. La experiencia próxima al umbral, cultivos maduros y materiales se preparan como muestras; el nivel, el sueño, la fabricación y las elecciones se ejecutan mediante controles normales. Las capturas se revisan visualmente. No son una partida completa de campaña ni una medición en S21 FE/S24 Ultra físicos.

Quedan pendientes balance prolongado, recompensas adicionales de aprendizaje, habilidades narrativas de las regiones, cambios de profesión, dominio posterior al nivel 10 y progresión social. El bloque siguiente del plan es ganadería: especies que faltan, incubación y acciones productivas propias. Este documento registra una ampliación comprobada, no una entrega del motor completo.
