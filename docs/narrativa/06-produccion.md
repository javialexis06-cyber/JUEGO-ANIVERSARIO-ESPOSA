# Voces, música y escenas de Astra

## Entrega para audio

La carpeta [audio](audio/) contiene líneas estructuradas y archivos por personaje. Campos: `id`, `escena`, `hablante`, `texto`, `direccion`, `capa`, `archivo`, `prioridad`. Los IDs nombran escena y posición; una revisión de texto conserva el ID y cambia la huella del audio. No insertar una línea renumerando tomas aprobadas: asignar sufijo nuevo. El archivo sugerido es `<id>.ogg`; el generador real añadirá su huella y duración conforme al sistema de audio existente.

El catálogo incluye los tres momentos y ambas respuestas de cada misión personal, guiones principales, secretos y diez escenas largas. **No incluye biografías como narración:** son material para dirección, no miles de palabras que deban sonar al entrar al pueblo. Las acotaciones, costos y explicaciones de motor tampoco se leen en voz alta.

No se han generado audios ni gastado créditos. La promoción mencionada por Javier no se toma como precio confirmado: el resumen exportado cuenta caracteres y palabras por prioridad para cotizar con la cuenta vigente. El modelo y voz se eligen en la configuración del generador; no se inventa un identificador de proveedor. Se recomienda escuchar una prueba breve de cada voz antes de producir un bloque completo. No reutilizar voces clonadas reales como reparto de NPC sin una elección expresa; Él y Ella conservan las voces ya autorizadas en el proyecto.

## Dirección del reparto

| Voz | Interpretación | Evitar |
|---|---|---|
| Narrador | Cercano, con curiosidad, frases respiradas. Sabe contexto sin declarar culpabilidades no probadas. | Voz de tráiler constante, solemnidad en cada surco, explicar una emoción que ya se ve. |
| Aura | Energía cálida; puede detenerse para escuchar. Su firmeza final no es grito. | Euforia que invalida cansancio. |
| Lara | Serenidad humana, pausas claras y humor pequeño. Dice verdades difíciles sin frialdad. | Susurro ininteligible, amenaza, confundir muerte con maldad. |
| Celia | Cercanía cotidiana y asombro; joven sin infantilizarla. | Habla de oráculo remoto o voz de niña. |
| Nath’Gora | Cortesía fría, convicción útil, cansancio antiguo. | Villano que ríe después de cada amenaza o víctima a la que el guion absuelve. |
| Vael’Thor | Precisión y paciencia del diseñador. Pequeñas interrupciones al perder control. | Robot plano o grito teatral. |
| Sangrevil | Autoridad educada con miedo bajo la frase. Se quiebra sin pedir al oyente que lo rescate. | Acento cómico que borra gravedad. |
| Él y Ella | Conversación natural y humor en momentos concretos. Escuchan de verdad las respuestas. | Declaración amorosa solemne en cada conversación o recuerdos reales añadidos. |
| Eliana / Serena | Eliana inicia con impulso y aprende a preguntar. Serena deja espacio, puede reír. | Hacerlas copias auditivas de las diosas. |
| Damián / Aurelio | Damián ordena palabras cuando teme; Aurelio deja frases más cortas al reconocer responsabilidad. | Disculpa que suena a discurso de campaña. |
| Nerea / Paloma | Nerea es precisa con dudas audibles; Paloma rápida sin atropellar confidencias. | Ingeniera robótica / aventurera que nunca se cansa. |
| Rosa / Lucio | Humor sobre cocina, reconocimiento sencillo. El duelo no ocupa cada frase. | Llanto obligatorio o voz etérea para Lucio. |
| Tecla / Elián | Tecla compara y se corrige; Elián recupera respiración al poder negar. | Exposición técnica sin escucha / trastorno convertido en caricatura. |
| Niños | Curiosidad, orgullo y enojo pequeños. Voces diseñadas, interpretación respetuosa. | Voces de personas menores clonadas por defecto, infantilización exagerada o frases adultas declamadas. |

Cada NPC tiene su archivo propio aunque varios puedan ser interpretados por un mismo actor o voz diseñada. Registrar voz aprobada, rango, ritmo y muestra de referencia; no asignar aleatoriamente una nueva toma a cada visita. Los habitantes de otros mundos no necesitan acentos nacionales estereotípicos. El vocabulario distingue oficios; la personalidad distingue personas.

Tres intensidades bastan para una primera tanda: conversación, confesión sin pedir absolución y firmeza ante un límite. La emoción va en dirección, no dentro del texto visible. Los tags de interpretación se adaptan al modelo elegido tras una prueba; no se asume que todas las instrucciones entre corchetes serán actuadas en vez de leídas.

Pronunciaciones acordadas: Astra «Ástra», Celia «Sélia», Aurelia «Aurélia», Nocturna «Noctúrna», Esmeralda «Esmerálda», Nath’Gora «Nat Góra», Vael’Thor «Vael Tor», Nox «Noks», Verdia «Vérdia», Sangrevil «Sangrevíl». Mantener la escritura canónica en pantalla. Confirmar la interpretación de nombres antes del lote largo y usar diccionario de pronunciación si el proveedor lo permite.

## Prioridades y costo controlable

1. **A:** catorce escenas largas, 36 misiones principales, narrador y figuras centrales. Probar primero C01 y C04 completos para revisar ritmo entre voces.
2. **B:** 24 arcos de Pueblo del Sol y los doce secretos. La conversación principal del pueblo tiene más probabilidad de escucharse que una visita orbital tardía.
3. **C:** los otros 118 arcos. Grabar por región después de poder recorrerla; se pueden producir textos anticipados, pero la integración sigue necesitando escenas jugables.

Una toma inicial por línea. Segunda toma solo si pronunciación, intención, ruido o ritmo fallan; no generar tres versiones de todo por costumbre. El exportador da subtotales independientes, para elegir un lote sin renderizar toda la biblia. Aprobar por escena completa, no solo muestras aisladas: una línea buena puede responder con una emoción equivocada a la anterior.

## Música

El arco usa cuatro motivos: **semilla** (intervalo ascendente corto, Aura), **velo** (respuesta descendente con pausa, Lara), **suelo** (pulso estable de madera, Celia) y **forma fija** (ostinato que evita resolver, Vael). Nath introduce un vacío rítmico y textura de ceniza; no reutilizar el motivo amoroso como leitmotiv suyo. Sangre conserva el rock electrónico pesado y metal instrumental ya aprobados; estas indicaciones añaden transiciones narrativas sin sustituir pistas producidas por Claude.

| ID | Escena/uso | Brief instrumental y duración objetivo |
|---|---|---|
| M01 | Granja, C01 | Piano de fieltro, madera y cuerdas suaves; 72 bpm, 100 s, final abierto y bucle. Sin letra. |
| M02 | Pueblo y posada | Guitarra acústica, percusión de mesa, clarinete; 88 bpm, 120 s; acogedor sin euforia permanente. |
| M03 | Puerto | Cuerdas pulsadas, pequeñas campanas y agua; 82 bpm, 100 s; movimiento y espacio. |
| M04 | Brumaverde | Flauta baja, madera, capas orgánicas; 70 bpm, 110 s; luz entre sombras, sin coro verbal. |
| M05 | Piedralumbre | Percusión metálica ligera, contrabajo; 80 bpm, 110 s; oficio y atención, sin marcha militar. |
| M06 | Brasaviva | Guitarra cálida, barro percutido y cuerdas; 90 bpm, 110 s; calor que puede reposar. |
| M07 | Nieveclara | Celesta tenue, arco largo, madera; 64 bpm, 110 s; abrigo, no amenaza constante. |
| M08 | Vigilia, C05 | Piano corto y pulso grave contenido; 68 bpm, 110 s; reconstrucción sin triunfo grandioso. |
| M09 | Archivo, C03 | Cuerda solista, respiraciones de silencio; 66 bpm, 140 s; permite voces secas. |
| M10 | Extracción, C02 | Motivos semilla y velo, campana breve; 76 bpm, 120 s; cuidado antes de tensión. |
| M11 | Corte, C04 | Transición al metal electrónico instrumental existente; 180 s con descenso a piano y silencio al confinamiento. |
| M12 | Verdia | Cuerdas, arpa contenida y coro sin palabras; 62 bpm, 120 s; vida personal, no funeral perpetuo. |
| M13 | Senda | Piano con dos respuestas distintas, percusión espaciada; 70 bpm, 120 s; pregunta sin castigo. |
| M14 | Casa de Vael, C06 | Ostinato perfecto que pierde una nota; 72 bpm, 180 s; tensión comprensible, sin sobresalto brusco. |
| M15 | Perímetro de Nox | Grave suave, metal lejano, señales regulares; 66 bpm, 100 s; control y límites, no sufrimiento como espectáculo. |
| M16 | Estación y lunas | Sintetizador cálido, pulso y tres timbres; 86 bpm, 120 s; cada luna tiene una variación separada. |
| M17 | Ambarina | Percusión seca, cuerda pulsada, viento bajo; 80 bpm, 110 s; territorio vivo, sin caricatura cultural. |
| M18 | Iridalia | Resonancias de cristal y bajo orgánico; 84 bpm, 110 s; diversidad, no exotismo de museo. |
| M19 | Borde de Astra, C09 | Motivos completos contra vacío rítmico; metal electrónico instrumental contenido, 180 s; silencio programable para Lara. |
| M20 | Final, C10 | M01 con segunda voz instrumental y pausa; 76 bpm, 110 s; satisfacción abierta, sin canción con datos privados. |
| M21 | Tratado, C07 | Tres motivos alternando sin dominante; 78 bpm, 150 s; no fanfarria de coronación. |
| M22 | Vasija, C08 | Ostinato rígido se abre a madera y respiración; 92 bpm, 140 s; cierre distinto de M19. |

Son briefs, no pistas generadas ni minutos facturados. Los bucles no deben contener un crescendo obligatorio cada minuto. Los leitmotivs pueden compartir stems si el proveedor y licencia lo permiten; no hace falta una pista distinta por cada NPC. Música ambiental nunca tapa diálogo; respetar silencio, pausa y reducción de volumen del sistema existente.

## Animación, sonido y accesibilidad

Las diez escenas incluyen plano, gesto y sonido suficientes para una animación sencilla: manos, objetos, puertas y documentos transmiten el conflicto sin rehacer personajes. Claude conserva el diseño final. Antes de video, usar storyboard de cuatro a seis cuadros por escena y temporización con audio aprobado. No encargar animación terminada sobre diálogos que aún cambian.

Efectos necesarios: regadera, papel por ambos lados, cierre de bolsa, campana de entrenamiento, campana de extracción, paso sobre madera, señal redundante, respiración de nave y junta cerámica. No usar un grito humano como decoración de la prisión. Cada efecto tiene sustituto existente o silencio mientras falta producción.

Subtítulos para todas las voces, nombre del hablante, avance manual, pausa, repetición por línea y velocidades de texto. La ruta de una pista no puede depender exclusivamente del sonido o color. El jugador que silencia audio recibe el mismo dato y premio. La cinemática nunca decide consumos ni modifica estado por su duración; entra después de confirmar el hito y puede cerrarse sin perderlo.

## Integración y privacidad

Los guiones nuevos no se mezclan automáticamente con `voces-guion/` ni con `public/voces/`. El sistema actual identifica audios por hablante/texto y huella; este catálogo añade IDs de autoría para revisión, no reemplaza ese cargador. Antes de importar, adaptar IDs de hablante, autorizar voces, validar texto vigente y construir una lista de archivos disponibles. Línea ausente mantiene subtítulo; no bloquea misión.

`capa: pareja` marca todas las intervenciones de Él/Ella y toda escena de campaña que supone su Lazo. El exportado neutral incluye únicamente arcos personales y secretos del mundo que no contienen esa capa; **no es todavía una adaptación jugable de la campaña para amigos**. No basta filtrar dos hablantes: el contexto de una escena puede ser privado aunque hable el narrador. Cien Puertas, apodos, álbum y voces reales siguen fuera de cualquier bundle neutral.

Antes de publicar audio: revisión de guion elegido, prueba de pronunciación, reproducción completa de escena, subtítulos idénticos, silencio/pausa, tamaño móvil y verificación del build de amigos. Esta entrega no inicia compras ni generación remota.

Fuatia requiere una sexta voz divina: amable sin ser sumisa, resentimiento contenido y escucha capaz de rechazar una condición. C11–C14 añaden narración y diálogos en [Figuras y escenas](10-figuras-y-escenas.md). Las 284 conversaciones VID permiten grabar el pasado y la vida cotidiana fuera de los premios de misión. Registrar el hash de cada toma para no pagar por una versión antigua después de corregir un guion.
