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

## Las voces de la granja (Astra)

Toda la narración de la granja tiene voz: 3.581 líneas que cubren:
- las escenas de los 36 expedientes y las 14 cinemáticas;
- los recuerdos de los 178 vecinos;
- los secretos, los encuentros y los 42 encargos de los pueblos.

Las 13 líneas de Maia no llevan voz porque habla en señas; quedan en subtítulos.

**Reparto** (`voces-guion/astra-reparto.json`):
- Él y Ella usan sus voces clonadas.
- Cada uno de los otros 186 personajes tiene una voz distinta de la biblioteca pública de ElevenLabs, en español latino,
  elegida por sexo y por la edad que dice su biografía.
- Las figuras y el narrador se eligieron a mano:
  - Narrador: Josué Maya.
  - Fuatia: Tatiana Martin.
  - Vael'Thor: Miguel.
  - Nath'Gora: Carmelo.
  - El Conde: Johnny.
- Los niños tienen voces de personaje infantil: Tina (Fruna), Nina (Lulu), Nino (Leo) y Yago (Charlee).
- Las voces de la biblioteca se usan por su id sin agregarlas a la cuenta; no ocupan cupo de voces.

**Cómo se genera** (`scripts/granja-v3/voces-astra.mjs`):

```bash
node scripts/granja-v3/voces-astra.mjs reparto     # solo personajes nuevos; respeta los que ya tienen voz
SECO=1 node scripts/granja-v3/voces-astra.mjs      # cuenta lo que falta
node scripts/granja-v3/voces-astra.mjs             # genera lo que falte
```

- Cada audio va a `public/audio/astra/<línea>-<huella>.ogg` (Opus mono 24 kb/s, volumen parejo) y queda declarado
  en `public/granja/astra/medios.json` con la huella del texto. Si el guion cambia, el juego no reproduce la toma vieja y
  el script rehace solo esa.
- Costo medido con Eleven v4: unos 0,13 créditos por carácter (toda la granja, ≈ 31.500 créditos).
- Pesa ≈ 58 MB. No va en la versión para amigos.

**Efectos de la granja** (`scripts/granja-v3/efectos-granja.mjs`, `public/sfx/granja/`, `src/granja-v3/sonidos-granja.ts`):
- 42 efectos: herramientas, cuidados, la voz de cada una de las 12 especies, pesca, monedas, puertas, rutas, cofres y
  dormir.
- 4 ambientes en bucle: pájaros de día, grillos de noche, lluvia y mar en el puerto y el lago. En el espacio y adentro
  no suena ambiente.
- El botón de audio de la granja también los calla. Si un efecto falta, suena el pitido sintetizado de antes.

## Pendiente o por mejorar

- Frases que todavía no están en el guion (suenan escritas): lo que dicen en las coreografías de la casa (la
  nalgada, el cohete al despegar, «¡Soy todo un chef!»…), los textos sueltos del cohete (granizo, récord, patico) y
  otras reacciones ya existentes. Las escenas premium conservan la decisión de efectos sin voces en los globitos; no ampliar las escenas descartadas. Las frases que se autoricen se agregan a `PARTES` y se generan con los tres pasos.

## Las voces del cine de la granja (las diosas, celestiales)

Las películas de la historia principal de la granja (el prólogo y las que sigan) tienen su propio guion de voces en
`src/granja-v3/cine-lineas.ts` y su script, `scripts/granja-v3/voces-cine.mjs` (reparto propio para Celia, Aura y
Lara con voces etéreas, procesado celestial con ffmpeg, salida en `public/audio/cine/` y `public/granja/cine/medios.json`
con la duración de cada línea). Detalle en [`cine-granja.md`](cine-granja.md).
