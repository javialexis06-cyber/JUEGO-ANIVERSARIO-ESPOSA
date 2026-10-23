# CLAUDE · entrega de audio para La Semilla Madre

**Encargo vigente del 23 de octubre de 2026.** Javier pidió expresamente que Claude haga la producción
de ElevenLabs y Codex integre el juego. Esta es la guía que hay que ejecutar; no buscar otra guía histórica.

El juego también figura como Jardín de los Desvelados o «desolados» en mensajes anteriores. Su código
vigente está en `juego/web/src/jardin/`; la historia nueva es `conquista/historia-interfaz.ts`.

## Autorización y reparto

- Javier autoriza consumir los créditos **ya disponibles** de ElevenLabs en efectos y música de este juego.
  No contratar planes, habilitar sobrecostes ni comprar créditos. Consultar saldo antes de producir.
- **No generar diálogos hablados, voces clonadas ni narración.** Los descartes anteriores de voces nuevas
  continúan para esos trabajos. Este pedido nuevo sí autoriza efectos, música y balbuceos no verbales de Dave.
- Claude produce, escucha, valida y publica los audios y su índice. Codex se ocupa de mapas, animaciones,
  tutorial, eventos y reproducción. No sustituir motores ni tocar daño, costes, progresión o partidas.
- Mantener `ELEVENLABS_API_KEY` en el entorno de producción. Nunca en `VITE_*`, código público, logs o commits.
  Este entorno de Codex no dispone de la clave; Javier confirmó que el entorno de Claude sí la tiene.

## Archivos que debes leer

| Archivo | Uso |
|---|---|
| [plan.json](../../juego/web/produccion/pvz-audio/plan.json) | **107 familias, 253 archivos previstos**, con prompt individual, duración, variantes, prioridad, bucle y ganancia. |
| [catalogo.ts](../../juego/web/src/jardin/pvz/audio/catalogo.ts) | Correspondencias de plantas/zombis con identidades sonoras. No cambia el catálogo jugable. |
| [tutorial-dave.ts](../../juego/web/src/jardin/conquista/tutorial-dave.ts) | Guion exacto del tutorial; se muestra por escrito. Sus estados indican qué balbuceo reproducir. |
| [generar-elevenlabs.mjs](../../juego/web/scripts/pvz-audio/generar-elevenlabs.mjs) | Productor secuencial con consulta de saldo, reanudación y marcadores de peticiones inciertas. Sin `--generar` no usa red. |
| [validar.mjs](../../juego/web/scripts/pvz-audio/validar.mjs) | Valida contratos y MP3 con ffprobe/ffmpeg; publica solo archivos declarados como escuchados. |
| [indice.json](../../juego/web/public/jardin/pvz/audio/indice.json) | Contrato de carga del juego. Comienza vacío: eso significa **pendiente**, no audio completado. |

El plan cubre las 49 plantas normales de PvZ 1, las 26 categorías principales de zombis y sus variantes
acuáticas registradas. Incluye firmas de mecanismos futuros de PvZ 2 y Fusión: láser, electricidad,
veneno, bumerán, lianas, curación, portales, robots, animales y fusiones elementales. **No afirma tener
enumeradas todas las unidades ni recetas de las últimas versiones de PvZ 2/Fusión.** No inventar recetas
ni convertir los IDs sonoros futuros en supuestas unidades funcionales. Esta biblioteca permite avanzar
con su audio sin esperar a que el catálogo completo esté dibujado y programado.

## Producción

Desde `juego/web/`, con Node 24 o posterior y ffmpeg/ffprobe instalados:

```sh
node scripts/pvz-audio/validar.mjs
node scripts/pvz-audio/generar-elevenlabs.mjs
```

Estos comandos son locales y permiten revisar el plan sin gastar créditos. Para una muestra real:

```sh
NODE_USE_ENV_PROXY=1 node scripts/pvz-audio/generar-elevenlabs.mjs --generar --id guisante --variante 1
```

Escuchar esa muestra, `hielo`, `zombi-mordida` y `dave-explica` antes del lote. Ajustar el prompt si la
identidad no encaja; no producir 253 variaciones defectuosas por seguir un lote sin escucha.
Para continuar el plan completo con el saldo existente:

```sh
NODE_USE_ENV_PROXY=1 node scripts/pvz-audio/generar-elevenlabs.mjs --generar
```

El productor conserva MP3 existentes y no los vuelve a cobrar. Produce primero una versión de las
familias y después sus variaciones. El saldo se consulta por petición y se deja un margen conservador:
si no alcanza, se detiene. Aprovechar el saldo restante con trabajos que sí quepan **tras comprobar
la tarifa de la cuenta**, sin sobrecoste. No es obligatorio dejarlo exactamente en cero a costa de una
compra o un cargo extra. Una respuesta fallida o incierta conserva `.pendiente.json`; revisar el
historial de ElevenLabs antes de repetirla. No borrar ese marcador para reintentar a ciegas.

Los modelos del plan son `eleven_text_to_sound_v2` y `music_v1`. No usar un modelo de voz para Dave.
Efectos: `POST /v1/sound-generation`, duración del manifiesto, `prompt_influence:0.55`, `loop` solo donde
esté indicado. Música: `POST /v1/music`, `force_instrumental:true`, 60.000 ms. MP3 a 44,1 kHz/128 kbps.
Respetar el proxy y los certificados del entorno; no desactivar TLS.

## Dirección sonora

Juego ilustrado cálido y expresivo, defensa botánica con zombis caricaturescos. Ataques vegetales
orgánicos, pequeños y legibles; sin disparos militares realistas, estridencia constante ni terror gráfico.
Los proyectiles de hielo tienen crujido y brillo cristalino; los normales un pequeño golpe de aire.
Capas cortas para permitir muchos ataques sin una masa de ruido. No copiar grabaciones, melodías o
interpretaciones de PvZ, otros juegos o personas reales.

- Efectos con ataque claro, cola natural corta y sin silencio largo inicial/final.
- Variaciones de la misma familia conservan volumen y timbre. No cambiar el tipo de objeto entre variantes.
- Cono: plástico; cubo: metal; puerta: marco y malla; periódico: papel. Sus daños y caídas son distintos.
- Pies, mordidas, pérdida de brazo/cabeza y caída del cuerpo deben ser suaves y cómicos, sin gore.
- Dave: cinco estados — saludo, explicación, idea, aviso y satisfacción. Balbuceos nasales juguetones
  sin palabras reconocibles. **El texto del tutorial no se envía a TTS.**
- Ambientes discretos en bucle: día, noche, agua, carretera y almacén.
- Ocho pistas originales instrumentales: inicio, día, noche, piscina, mapa, frontera, fusión y final.
  Buscar comienzos/finales compatibles con bucle; no insertar títulos hablados ni letra.
- Evitar saturación. Referencia de mezcla: efectos alrededor de −18 LUFS, música/ambiente alrededor
  de −23 LUFS y pico verdadero por debajo de −1 dBTP. Son referencias de escucha, no una orden de
  comprimir brutalmente cada golpe muy corto. El juego aplica además la ganancia del índice.

## Revisión y publicación de los archivos

Los MP3 originales se generan en `juego/web/produccion/pvz-audio/generados/`, fuera del paquete público.
Escuchar todos los resultados. Crear `juego/web/produccion/pvz-audio/revisados.json` con los nombres
**exactos** que estén aprobados, por ejemplo:

```json
{"version":1,"archivos":["guisante-01.mp3","hielo-01.mp3","dave-explica-01.mp3"]}
```

La lista es acumulativa: conservar los audios ya revisados al añadir otro lote. Para comprobar y publicar:

```sh
node scripts/pvz-audio/validar.mjs
node scripts/pvz-audio/validar.mjs --publicar
```

El segundo comando copia los MP3 aceptados a `public/jardin/pvz/audio/` y crea su índice. No declarar
archivos sin producir, no publicar errores HTML/JSON con extensión MP3 ni sustituir faltantes por tonos
sintéticos diciendo que son ElevenLabs. Los originales y marcadores se conservan fuera de Git.

El contrato del índice es:

```json
{
  "version": 1,
  "efectos": {
    "guisante": {"archivos": ["guisante-01.mp3"], "ganancia": 0.65, "bucle": false}
  },
  "musica": {
    "musica-dia": {"archivos": ["musica-dia-01.mp3"], "ganancia": 0.25, "bucle": true}
  }
}
```

Los nombres son relativos a esa carpeta, sin rutas externas ni `..`. No cambiar IDs, formato o
ganancias sin coordinar el contrato. Si un archivo no está listo, dejarlo fuera del índice: Codex
conserva el funcionamiento del juego mientras llegan las grabaciones.

## Cierre para Javier y Codex

1. Traer las ramas remotas antes de publicar; no forzar ni sobrescribir avances visuales de Codex.
2. Comprobar índice, existencia y decodificación de cada archivo publicado; guardar el informe de ffprobe.
3. Registrar cantidades reales, saldo gastado/restante consultado y audios pendientes. No publicar claves,
   facturas, identificadores privados de la cuenta ni afirmar que todo está generado si falta un lote.
4. Revisar la licencia de uso/distribución correspondiente a la cuenta de ElevenLabs. La música debe ser
   original y utilizable en este repositorio público; no descargar pistas aleatorias sin licencia comprobada.
5. Ejecutar `npm run verificar:repo`, `npm run build` y `npm run build:amigos`; el trabajo de integración
   sigue las comprobaciones completas de AGENTS.md. No alterar la granja pausada.
6. Commit de MP3, índice, lista revisada e informe público breve, y publicar en `work` y
   `claude/supermarket-mania-minigame-xn2it8`, conservando el trabajo remoto y sin push forzado.

Fuentes de la interfaz de producción:
[efectos](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert),
[música](https://elevenlabs.io/docs/api-reference/music/compose) y
[saldo](https://elevenlabs.io/docs/api-reference/user/subscription/get).
