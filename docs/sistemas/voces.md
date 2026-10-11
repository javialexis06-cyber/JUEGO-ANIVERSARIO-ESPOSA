# Las voces de Él y Ella

Las frases que dicen Él y Ella suenan con su voz, hecha con ElevenLabs (modelo **Eleven v4**) a partir de las voces
clonadas de los dos («ELLA» y «EL» en la cuenta). Javier aprobó el guion completo (11 de octubre de 2026): 1.727
frases, cada una con la emoción con la que se dice.

## Dónde suenan

| Parte | Qué dicen | Dónde se engancha |
|---|---|---|
| Cien Puertas | Los 20 recuerdos, el final de la puerta 100 y todo lo del narrador (inicio, capítulos, la entrada de cada puerta, ánimos, felicitaciones, «algo bonito», cuando algo se rompe, antes de la pista, sin plata) | `src/puertas/narrador.ts` |
| La casa | Saludos, mimos (quien da y quien recibe), los recuerdos flotantes del baño y la cama, la rutina del inodoro y sus eventos | `src/casa/mascota.ts` (el globito `frase`), `src/casa/recuerdos_panel.ts` |
| Mesa de juegos | Las reacciones de la pareja (presumir, celos, burla, ganar, perder…) | `src/reacciones/director.ts` |
| Retrete cohete | Lo que dice en el vuelo (110 frases por cada uno, barajadas: no se repite ninguna hasta que salgan todas), en cada tramo, con cada poder, «¡Te pasé!» y «otra vez». Durante la canción del primer despegue no habla (el globito sale mudo) | `src/casa/cohete.ts` (`decir`, `frase`), `src/casa/cohete/pareja.ts` |
| Cocina de chef | La pareja cuando llega a comer y cuando prueba el plato | `src/casa/cocina/pantallas.ts` |
| Súper Manía | Las 12 cartas de los recuerdos del súper, leídas por Javier | `src/main.ts` (`leerRecuerdo`) |
| Sangre y Ceniza | Solo las líneas de Él y Ella en las escenas del mapa de la Noche (la Santa, el Conde y el narrador siguen escritos) | `src/sangre/ui/historia.ts` |

No llevan voz: Lavarse la cara (son avisos y cartas, no frases de un personaje), los mensajes de voz de la casa (ya son
sus voces de verdad), la granja (es del otro frente) y las pistas de Cien Puertas (son largas y funcionales). Las
acotaciones de ruido del baño («\*cuac\*», «\*rasca, rasca\*») quedaron mudas a propósito.

## Cómo funciona

- `src/voces.ts`: `decir(quien, texto, modo)` busca el audio por un **código** que sale de quién habla y del texto
  limpio (sin emojis): FNV-1a de 32 bits de `quien|texto`. Así no hay que numerar frases: si el texto de una frase
  cambia, simplemente deja de sonar hasta que se vuelva a generar.
- Suena por el audio del juego (`sonido.contextoAudio()`): respeta el botón de silencio y la pausa, y baja la música
  mientras hablan (`musica.agachar`).
- `modo`: `cortar` (la nueva corta la anterior), `esperar` (espera hasta 4 s a que termine la otra: mimos, reacciones,
  cocina) o `saltar` (si alguien habla, esa se la salta: la rutina del inodoro, que cambia cada 1,5 s).
- Con amigos en la sala (modo neutro) no suena nada. La versión para amigos no lleva `public/voces/` (la quita
  `vite.config.ts`, y `verificar-amigos` lo revisa).
- Los recuerdos flotantes duran por lo menos lo que dura el audio (`duracionYa`).

## El guion y cómo se generan

- `juego/web/voces-guion/<parte>.json` (`puertas`, `casa`, `juegos`): cada frase con `id`, `g` (de dónde es), `q`
  (quién), `t` (como se ve en pantalla) y `d` (como se dice, con las emociones en inglés entre corchetes, que
  ElevenLabs actúa y no lee). `d` vacío = sin voz.
- `node scripts/voces-ia.mjs guion` vuelve a leer las frases del juego (los mismos módulos, cargados con Vite) y
  actualiza los JSON: conserva lo escrito en `d`, agrega las nuevas (sin emoción todavía) y avisa las que ya no están.
  Para agregar una parte nueva, se suma una función en `PARTES` del script.
- `SECO=1 node scripts/voces-ia.mjs` cuenta lo que falta; `node scripts/voces-ia.mjs` lo genera (3 a la vez) en
  `public/voces/<id>-<huella>.ogg` (Opus mono a 32 kb/s, silencios recortados) y arma `public/voces/lista.json`
  (código → archivo y segundos). La huella sale del modelo, los ajustes y `d`: si se cambia la emoción o el texto, se
  rehace solo esa; los audios que ya no se usan se borran.
- Necesita `ELEVENLABS_API_KEY` en el entorno (nunca en archivos ni en el chat), `ffmpeg` y la red abierta a
  `api.elevenlabs.io`. Cada carácter de `d` (emociones incluidas) gasta un crédito; el plan Creator trae unos 160.000
  al mes. Con Eleven v4 cada frase corta gastó de 4 a 8 créditos (medido en el historial, 11 de octubre de 2026).
- Para revisar cómo suena una frase sin el juego: el audio está en `public/voces/` (búscalo por su código en la lista).

## Pendiente o por mejorar

- Frases que todavía no están en el guion (suenan escritas): lo que dicen en las coreografías de la casa (la
  nalgada, el cohete al despegar, «¡Soy todo un chef!»…), los textos sueltos del cohete (granizo, récord, patico) y
  las escenas premium. Se agregan sumándolas a `PARTES` y corriendo los tres pasos.
