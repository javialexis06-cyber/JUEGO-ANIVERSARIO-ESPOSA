# El Show de Nosotros

Concurso de preguntas en pareja, estilo programa de televisión. Va como un juego más de la mesa
(`mesa.html?juego=show`, código en `juego/web/src/mesa/show/`): se entra desde la mesa del cuarto de juegos, usa el
mismo canal en línea y las mismas invitaciones que llegan a la casa, y Él y Ella reaccionan con las coreografías,
caras y efectos de `src/reacciones/`. El presentador es **el perrito de la casa** (con el nombre y el pelaje que le
pusieron en el patio; si todavía no lo adoptan, se llama Pelusa), con corbatín y micrófono.

## Cómo se juega

1. **La cabina** (al tocar la tarjeta en la mesa): la marquesina, sus números (shows jugados, mejor conexión, lo
   que hay en el sobre), la **pregunta del día** (también se contesta aquí) y **el libro de nosotros**.
   «¡Que empiece el show!» sigue con el modo escogido en la mesa.
2. **La entrada** (se puede saltar): cortinilla con el logo, la grúa baja sobre el público, el perrito saluda y
   presenta a cada uno con su tercio («ÉL · el panda · desde Bucaramanga», «ELLA · la pulga aventurera · desde
   Sopetrán») y explica las reglas según el modo.
3. **Seis rondas**, cada una con su cortinilla, su fanfarria y su frase del presentador:

| Ronda | Preguntas | Qué hace cada uno | Puntos |
|---|---|---|---|
| ¿Quién es más probable? | 4 | Señala en secreto a Él o a Ella; al revelar, levantan su paleta | 100 a cada uno si coinciden |
| ¿Qué prefieres? | 4 | Escoge lo suyo y adivina lo del otro | 100 a quien adivina; +50 a los dos si escogieron lo mismo («¡almas gemelas!») |
| ¿Cuánto me conoces? | 4 (alternan de quién se habla) | Uno contesta sobre sí mismo y el otro adivina; las abiertas se escriben y las califica el dueño (exacto, casi, ni cerca) | 100 al que adivina y 50 al dueño (casi: 50 y 25) |
| El termómetro | 4 (alternan) | Del 1 al 10 con un deslizador | 100/70/40/15 según qué tan cerca; la mitad al dueño |
| Nuestra historia | 4 | Preguntas de sus recuerdos reales, con respuesta correcta y un datico del presentador | 100 a cada uno que acierte |
| Final relámpago | 10 en 30 s | El juego del zapato de las bodas: ¿quién…? a toda velocidad; se revela en ráfaga | 60 a cada uno por coincidencia |

Cada pregunta: el perrito la lee (sale en la pantalla gigante y en un tercio), se abre el panel a la derecha y la
cámara encuadra a los dos (o a quien se pregunta) en lo que queda de pantalla; el reloj corre (los últimos 5 s con
tic tac), el atril del que ya contestó dice «✓ LISTO» y al otro le sale «¡Ella ya contestó! 👀». Cuando están las
dos respuestas: luces moradas, redoble, las tarjetas se voltean, sello («¡COINCIDEN!», «¡NI CERCA!»…), timbre de
acierto o «¡bzzz!», aplausos o «¡ohhh!» del público, confeti, los puntos vuelan al marcador y Él y Ella reaccionan
(señalarse y reírse, presumir, puchero, sonrojarse, abrazo si son almas gemelas…), con sus globitos.

4. **El final**: el **medidor de conexión** (aguja con rebote, del 0 al 100 %, con su nivel: Telepatía total, Almas
   gemelas, Complemento perfecto, Novios de Transformice, Recién conocidos, Señal perdida), el ganador (quien más
   conoce al otro) con trofeo y drama del que pierde, confeti grande, la despedida del perrito y la tarjeta final con
   «¡Otro show!», «El libro» y «Salir».

## Modos

| Modo de la mesa | En el show | Cómo |
|---|---|---|
| En línea | Cada uno en su celular (lo principal) | Él arma el guion y lo manda; cada uno contesta en secreto y se revela al tiempo |
| Los dos aquí | Mismo celular | Se lo pasan: un telón tapa la pantalla («Turno de Ella · Él: ¡ojos cerrados!») |
| Contra el otro | Solo | Contesta y adivina contra lo que el otro ya dejó guardado en el libro; lo que no tenga respuesta del otro queda **en el sobre** y se revela cuando el otro juegue (el guion prefiere las preguntas que el otro ya contestó) |

**Pausa**: si uno se va a segundo plano (`visibilitychange`) se pausa en los dos («Ella pausó el show»); si el otro
desaparece del canal unos segundos o deja de contestar, sale «Se fue la señal de Ella» con la opción de salir.
Mientras está en pausa no corren ni los relojes ni el programa.

**Premio** (escaso, como la casa): 3 monedas en pareja (+1 si la conexión llega al 80 %), 2 jugando solo (+1 igual).
Cuenta para el **trofeo de los juegos de mesa**: una victoria para quien gana (en empate, para los dos; jugando solo,
si la conexión llega al 70 %).

## Las preguntas

Más de 500 escritas a mano (`src/mesa/show/preguntas/`): 103 de «¿quién?», 100 de «¿qué prefieres?», 106 de
«¿cuánto me conoces?» (29 abiertas), 72 del termómetro, 62 de nuestra historia y 82 del relámpago, en siete
categorías (divertidas, románticas, futuro y familia, comida, muy colombianas, de los recuerdos, algo picantes). Se
escriben en tercera persona con marcas: `{n}` (Él/Ella), `{otro}`, `{apodo}` y `{x|y}` (x si es Él, y si es Ella).
Las que solo aplican a uno llevan `de` (Yanbal es de Ella; el frappé, de Él). Lo delicado de `docs/la-pareja.md`
nunca va en chiste.

- El **id** sale del texto (FNV-1a): reordenar los archivos no daña el libro; corregir el texto de una pregunta ya
  jugada la deja sin sus respuestas viejas.
- **Sin repetir**: el guion escoge primero las que nunca han salido (en el libro de cualquiera de los dos o en un
  show de este celular); cuando una categoría se agota, vuelve a empezar. Varía las categorías dentro de cada ronda y
  pone como mucho una abierta por show.

## La pregunta del día

Para cuando no pueden jugar al tiempo: en la **nevera** de la casa (tarjetica arriba de las notas) y en el menú de la
casa («Pregunta del día»), y también en la cabina del show. Cada uno contesta sobre sí mismo y adivina al otro; queda
en el sobre hasta que contesten los dos y se revela con su animación y +1 moneda para cada uno (una sola vez). La
escoge el primero que la abre ese día (sale de la fecha, de las que nadie ha contestado). Al abrir la casa hay un
aviso suave si hay pregunta nueva, si el otro ya contestó o si se reveló. Código: `src/casa/pregunta_dia.ts` (lo
interactivo, carga el banco aparte) y `src/casa/show_casa.ts` (lo liviano que usa la casa).

## El libro de nosotros

`src/mesa/show/libro.ts`: un álbum abierto (portada con sus números y pestañas a la izquierda, fichas a la
derecha): **Episodios** (cada show con fecha, modo, marcador y conexión, y cada pregunta con lo que dijo cada uno y
si le atinaron), **Del día**, **Por categoría** y **En el sobre** (lo que falta que el otro conteste). Se abre desde
la cabina, desde el final del show y desde la pregunta del día (`mesa.html?libro`).

## Lo que se guarda en la casa compartida

`casa.show` (normalizado en `show_casa.ts`, enganchado en `normalizarCasa` de `modelo.ts`), comprimido en textos
cortos para que la casa no crezca de más:

| Campo | Qué es |
|---|---|
| `r[rol][id]` | Lo que cada uno contestó sobre sí mismo (o su voto, o su respuesta en «nuestra historia») |
| `g[rol][id]` | Lo que cada uno adivinó del otro |
| `c[rol][id]` | La calificación que recibió su adivinanza abierta (`2`, `1`, `0`) |
| `ep` | Los últimos 60 episodios: id, fecha, modo, puntos, conexión y las preguntas (las de conocer con `:e`/`:a`) |
| `dia`, `dias` | La pregunta de hoy (y quién ya cobró su moneda) y las anteriores |

Valores: `e`/`a` (Él/Ella), el número de opción, el número del termómetro, el texto de una abierta (90 letras) o `-`
(se le fue el tiempo, no se guarda). Cada celular guarda lo suyo al terminar cada ronda (`guardar_casa` con la
versión leída; si chocan, se vuelve a leer y se aplica otra vez) y el episodio lo anota uno solo (Él en línea).
Sin casa configurada (pruebas sueltas de la mesa) se guarda aparte en el celular (`show-libro-suelto`).

## En línea

Cada celular manda mensajes numerados por el canal de la mesa (`Canal.movimiento`) en su propia fila
`<partida>~<rol>` (`src/mesa/show/red.ts`): el guion (`plan`, lo manda Él), las respuestas (`r`), las calificaciones
de las abiertas (`nota`), la pausa y la salida. Llegan en orden aunque la red los desordene y cada 2,2 s se vuelven a
pedir desde el primero que falta (el otro los reenvía de su historial). La mesa solo enruta: en `main.ts`,
`jugarShow` abre el show y `alMovimiento`/`alSalir` le pasan lo que no es de una partida de tablero.

## El estudio (3D)

`personajes/blender/show.py` arma el set por código en el estilo de plastilina y fieltro y lo exporta a
`show_estudio.glb` (~690 KB después de comprimir): escenario con piso brillante, medallón con estrella y corazón,
gradas con franjas de LED; tarima alta con los dos atriles (azul con estrella bordada para Él, rosado con corazón
para Ella, pantallita, escritorio, botón grande y bombillos); el atril del presentador con su escudo, tarjetas y
banquito; pantalla gigante con marco de bombillos y dos laterales; pared del fondo con franjas de luz, estrellitas y
corazones de neón; el letrero «El Show de Nosotros» (letras en relieve con la letra del juego, marquesina, bombillos
y corazones); telón de terciopelo con cenefa, flecos, borlas y amarres; cercha de aluminio con ocho reflectores
móviles; dos cámaras de pedestal y una grúa con su luz roja; monitores de piso, bafles, floreros con rosas, cañones
de confeti, el cuadro de «APLAUSOS», cables, y las gradas del público con su cordón dorado.

```bash
python3 personajes/blender/show.py juego/web/modelos-crudos      # ~5 min
cd juego/web && npx gltf-transform optimize modelos-crudos/show_estudio.glb public/modelos/show_estudio.glb \
  --compress meshopt --flatten false --instance false --palette false --texture-compress false --prune false \
  --simplify true --join false --simplify-ratio 0 --simplify-error 0.0006
```

Lo estático se une por material; lo que el juego mueve o pinta va en nodos con nombre (`foco_N`/`foco_N_cabeza`,
`pantalla_grande`, `pantalla_izq/der`, `marcador_el/ella`, `tally_N`, `bombillos_0/1/2`, `corbatin`, `microfono`,
`publico_a/b/c`, `publico_mano`, `ancla_el/ella/perro`). Ojo: al comprimir, la escala real de cada malla queda en su
nodo; para repetir una malla sola (el público) se hornea su matriz (`geometriaReal` en `estudio.ts`) y lo que se
cuelga de otro lado (corbatín, micrófono) va envuelto en un grupo.

`src/mesa/show/estudio.ts` lo vuelve un programa de televisión: haces de luz con sombreador (aditivos, con su
charco en el piso) que barren el escenario y en suspenso apuntan a los atriles; pantallas de LED con sombreador
(puntitos de LED, patrones animados y el texto de la pregunta, la ronda o el medidor encima); bombillos en cadena;
colores por momento (entrada, normal, suspenso, acierto, error, fiesta, relámpago); el público repetido con
instancias (aplaude, ovaciona o se lamenta); confeti de los cañones y de la cercha; paletas con «ÉL»/«ELLA» en la mano
de los muñecos; y una cámara de televisión con planos (general, grúa, pareja, Él, Ella, presentador, pantalla,
público), cortes secos, un empujoncito lento y el encuadre corrido cuando está el panel. `presentador.ts` anima al
perrito por piezas (habla, señala, salta, se ríe, se sorprende, aplaude, baila, menea la cola).

Rendimiento: 30 cuadros por segundo, baja la resolución sola si no alcanza (y quita los charcos de luz), el público
solo se mueve cuando se ve, los sombreadores se preparan en la pantalla de carga (`compileAsync`) y al salir se
suelta todo y se llama `forceContextLoss()`.

## Pruebas

- `node scripts/probar-show-linea.mjs <url de mesa.html> [carpeta]`: dos celulares con un Supabase de mentiras
  (demoras, 8 % de mensajes perdidos y la casa con versión). Él invita desde la cabina, Ella acepta, juegan un show
  completo con un bot; a mitad del show Ella se va a segundo plano. Revisa la pausa, que los dos terminen con el
  mismo marcador y resultados, que el libro tenga lo de los dos y un solo episodio, y que el libro se abra.
- `node scripts/probar-show.mjs <url de mesa.html> [carpeta]`: un celular: Ella sola (todo al sobre), Él solo
  (se revela contra lo de Ella), los dos aquí (con el telón), la pregunta del día desde la cabina y el libro.
- `mesa.html?juego=show&modo=ia|local&rol=el|ella&rapido=4` entra directo; `&sin3d` no pinta (pruebas);
  `window.__show.show` es el show actual (`estudio.pintar()` pinta un cuadro, `estudio.plano('pareja')`…) y
  `__show.banco()` cuenta las preguntas.
