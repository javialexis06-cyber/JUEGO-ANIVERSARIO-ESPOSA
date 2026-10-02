# Auditoría y pruebas de estrés

Revisión del código de Nuestro Hogar (casa), Súper Manía (minijuego) y la base de datos de Supabase, con pruebas
automáticas que buscan fallos tocando rápido, con datos dañados, sin internet, con dos celulares a la vez y con días
sin abrir la app.

## Cómo correr las pruebas

```bash
cd juego/web && npm run dev          # en otra terminal
node scripts/probar-linea.mjs        # dos celulares en línea contra un Supabase de mentiras (mismas reglas)
node scripts/estres-casa.mjs         # casa: datos dañados, días sin abrir, textos raros, toques rapidísimos, al azar
node scripts/estres-super.mjs        # súper: partidas dañadas, entrar y salir, toques al azar, días completos
node scripts/probar-casa.mjs         # casa en dos pestañas (modo local), con capturas
psql -d <base> -f supabase/pruebas/imitar_supabase.sql -f supabase/esquema.sql -f supabase/pruebas/probar_reglas.sql
```

## Fallos encontrados y corregidos

### Base de datos (Supabase)

| Fallo | Qué pasaba | Arreglo |
|---|---|---|
| Robar el personaje sin querer | Si Ella tocaba «Soy Él» con el código, sacaba a Él de la casa sin preguntar (su celular quedaba sin acceso). | `unirse_pareja` pide confirmar (`reemplazar`) si el personaje ya lo tiene otro celular; la app pregunta «¿Es tu celular nuevo?». |
| Foto en carpeta rara | Una foto con una carpeta que no fuera el id de la casa hacía fallar la regla con un error. | Regla `carpeta_de_mi_casa`: cualquier otra carpeta se rechaza limpio. |

Las 28 pruebas de reglas pasan en un Postgres 16 local: un extraño no ve ni cambia nada de la casa, la casa solo se
guarda con la versión correcta (dos celulares a la vez no se pisan), eventos solo de Él o de Ella, fotos solo en la
carpeta de la casa.

### Casa (sincronización)

| Fallo | Qué pasaba | Arreglo |
|---|---|---|
| Un mimo pisaba lo que el otro hacía | El abrazo escribía el personaje del otro con una copia vieja: si justo estaba comiendo o durmiendo, se deshacía. | Cada personaje lo escribe solo su celular; el cariño del mimo lo suma quien lo recibe. |
| Mimos perdidos sin internet | Si el otro celular estaba sin internet o en segundo plano, el beso se veía pero el cariño no le llegaba. | Los eventos quedan pendientes en el servidor (`visto`) y se aplican al volver a abrir la app, una sola vez. |
| Hora distinta en los dos celulares | Con el reloj de un celular corrido, el otro veía a su pareja «comiendo» varios minutos. | La duración de cada acción se mide desde que el celular la ve, no con la hora del otro. |
| Ecos atrasados | Un guardado viejo que llegaba tarde del servidor devolvía al personaje a lo que hacía antes. | Se ignora lo que llega con una hora de guardado anterior a la que ya se tiene. |
| Bono y premios dobles | Abrir y cerrar la app rápido, o dos besos seguidos, podía dar el bono del día o el premio dos veces. | El bono y los premios se anotan dentro del mismo guardado de la casa y se revisan ahí. |
| Sueldo del súper perdido | Si no había internet al abrir la casa, el sueldo se borraba sin llegar. | Solo se descuenta del sobre lo que sí entró a la casa. |
| Inventario negativo | Si los dos gastaban el último pan a la vez, quedaba en −1. | Se revisa con los datos frescos del guardado («ya no queda pan»). |
| Regalo abierto dos veces | Dos toques en «Abrir regalo» daban el cariño y la sorpresa dos veces. | Solo lo abre quien lo marca como abierto. |
| Datos dañados | Un dato raro (de otra versión o a medias) podía dejar necesidades en NaN o romper la casa. | Todo lo que se lee se normaliza (necesidades 0–100, monedas ≥ 0, colores válidos). |
| Doble entrada | Dos toques en «Crear nuestra casa» podían crear dos casas. | Un solo intento a la vez; «Reintentar» si no hay internet. |
| Sin internet al abrir | La app en línea quedaba en la bienvenida sin poder reintentar. | Botón «Reintentar la conexión» y recarga de todo al volver a la app. |
| Mimo que llega mientras se aplicaba otro | Quedaba esperando hasta volver a abrir la app. | Se aplica apenas termina el anterior. |
| Guardados de más | Revisar el bono cuando ya estaba dado igual guardaba la casa (más choques entre los dos celulares). | Si nada cambió, no se guarda. |
| Volver a la app en Android | La casa solo se enteraba por el evento del navegador. | También escucha a Android (`appStateChange`) para refrescar al volver. |
| Dos pestañas en el mismo navegador (sin internet) | El navegador copia el almacenamiento entre pestañas con un retraso: una pestaña podía guardar encima una copia vieja y se perdían besos, regalos o cambios. | Cada guardado lleva un número de versión y viaja en el aviso a la otra pestaña: siempre se usa la copia más nueva. |

### Casa (3D e interfaz)

| Fallo | Qué pasaba | Arreglo |
|---|---|---|
| Decoración fantasma | Dos cambios seguidos de decoración (los dos decorando) dejaban objetos repetidos que no se podían quitar. | Los cambios de decoración van en fila. |
| Cajita de regalo repetida | Mientras cargaba la cajita se pedía otra vez y quedaban dos. | Una sola carga; la cajita sigue a quien la recibe de cuarto en cuarto. |
| Objeto en la mano huérfano | Si se soltaba la comida mientras cargaba, aparecía después flotando. | Cada objeto tiene su turno. |
| Ojos abiertos durmiendo | Después de un beso dormido, al rato se le abrían los ojos acostado. | Sigue dormido con su pose y su cara. |
| Caminar comiendo | Tocar el piso mientras comía lo hacía caminar sentado con el pan. | Solo camina si está libre. |
| Toques lentos | Cada toque probaba contra los personajes completos (125 mil triángulos). | Solo contra el cuarto. |
| Notas en la nevera | Cada cambio de la casa creaba notas 3D nuevas sin soltar las viejas (memoria). | Solo se rehacen si cambian y se libera la memoria. |
| Color de nota | Un color raro en los datos podía meter estilos en la página. | Solo colores `#rrggbb`. |
| Doble envío | Dos toques en «Pegar en la nevera», «Enviar regalo» o «Guardar en el álbum» mandaban dos veces. | Un envío a la vez. |
| Mimos encimados | Tocar «Beso» muchas veces encadenaba coreografías. | Un mimo a la vez («Un momentico…»). |
| La tienda saltaba arriba | Al comprar, la lista volvía al principio. | Se queda donde iba. |
| Fotos sin internet | Sin internet cabían pocas fotos y al llenarse no se podía guardar nada más. | Fotos más livianas (900 px) y máximo 20 sin internet. |
| Casa lenta en celulares viejos | Con cuadros muy espaciados (celular viejo o mientras carga la casa), el despertar solo, la cajita del regalo y el fin de los mimos se atrasaban muchísimo. | Se revisa cada medio segundo de reloj real, sin importar cuántos cuadros alcance a dibujar. |

### Súper Manía

| Fallo | Qué pasaba | Arreglo |
|---|---|---|
| Memoria de la tarjeta gráfica | Cada día jugado y cada compra dejaban tapetes 3D sin soltar. | Se liberan al salir del día y al volver al menú. |
| Texturas de huesos de los personajes | Cada cliente, ayudante o ladrón es una copia con su propio esqueleto, y cada parte del cuerpo guarda una textura en la tarjeta gráfica. Al irse de la tienda o al salir del día no se soltaba: **259 texturas más por cada día** (tras 10 días, de 541 a 3131). En el celular eso termina en lentitud o en que la app se cierre. | Se sueltan cuando el personaje sale de la tienda y al terminar el día: después de cada día se vuelve a las mismas 23 texturas del menú. |
| Dos tiendas montadas | Dos compras seguidas en «Mejorar la tienda» podían dejar dos tiendas en el fondo. | Solo se queda la última. |
| Partida dañada | Una partida guardada rara podía romper el menú. | Se normaliza al cargar. |
| Cliente fantasma | Salir del día justo cuando entraba un cliente lo dejaba parado en la tienda del menú. | Lo que termina de cargar después de salir ya no aparece. |
| Música atropellada | Si el celular se atrasaba, la música tocaba de golpe las notas perdidas. | Se salta lo perdido. |

## Resultados de las pruebas

Corridas en un navegador sin tarjeta gráfica (la casa va a ~1 cuadro por segundo y el súper a ~0,2; por eso las
pruebas usan tiempos de espera largos y simulan varios pasos por cuadro).

| Prueba | Resultado |
|---|---|
| Reglas de la base de datos (`probar_reglas.sql`, Postgres 16) | 28 de 28 |
| Casa: datos dañados, días sin abrir, textos raros, toques rapidísimos, almacenamiento lleno, toques al azar (`estres-casa.mjs`) | Todo bien: 3.700 toques al azar en dos pestañas sin errores, la misma casa en las dos y la memoria 3D estable |
| Casa en dos pestañas con capturas (`probar-casa.mjs`) | Todo bien |
| Súper: partidas dañadas, 10 días entrando y saliendo, día con 1.476 toques al azar, días 1, 6, 8, 12, 16, 20 y 25 y el legendario con el piloto (`estres-super.mjs`) | Todo bien: los días terminan sin errores y las texturas quedan en 23 después de cada día (antes subían 259 por día) |

Lo que no se puede probar desde aquí: la conexión real con el proyecto de Supabase (la red de este entorno no deja
salir a `supabase.co`). La prueba en línea usa un Supabase de mentiras con las mismas reglas; la prueba de verdad es
instalar la APK en los dos celulares, crear la casa en uno y unirse con el código en el otro.

---

# Segunda auditoría (octubre de 2026): segundo plano, base de datos, memoria y rendimiento

Revisión de todo lo que no se estaba rehaciendo en ese momento (casa, súper, mesa, reacciones, escenas, carga,
navegación, sonido, Android y Supabase). Cada fila dice qué pasaba, dónde, qué tan grave era y cómo quedó.
Gravedad: **alta** (se pierde algo o gasta batería sin parar), **media** (se ve mal o falla a veces), **baja** (detalle).

## Segundo plano: batería y música

Pedido del dueño: «que la app en segundo plano quite la música y pause el consumo de batería y procesos».

Módulo nuevo **`src/segundo_plano.ts`** (para cualquier pantalla o minijuego): `alPausar(fn)`, `alReanudar(fn)`
(recibe los milisegundos que estuvo afuera), `enPausa()`, `cuadros(fn)` (bucle de dibujo que se detiene solo en el
fondo y vuelve sin salto de tiempo), `reloj()` (milisegundos sin contar el tiempo afuera, para minijuegos con tiempo)
y `esperar(fn, ms)` (temporizador que se congela afuera). Escucha `visibilitychange`, `pagehide`/`pageshow`,
`freeze`/`resume` y `appStateChange` de Capacitor y avisa **una sola vez** por ida y por vuelta.

| Hallazgo | Dónde | Gravedad | Arreglo |
|---|---|---|---|
| En Android la app seguía corriendo en el fondo: Capacitor deja el WebView despierto (`KeepRunning`), con relojes de JavaScript, red y animaciones | `MainActivity.java` | alta | `onPause`: `webView.onPause()` y, 0,7 s después (para que la página alcance a avisarle al otro celular), `pauseTimers()`; `onResume`: lo despierta antes de avisarle a la página |
| El reloj de la música seguía despertando al celular 33 veces por segundo con la app escondida | `sonido.ts` | alta | Se detiene en el fondo y vuelve donde iba; el `AudioContext` se suspende |
| La mesa no se enteraba de nada: la música seguía sonando con el celular bloqueado | `mesa/main.ts` | alta | Usa el módulo (música, efectos y dibujo se pausan) |
| La casa, el súper y la mesa pedían cuadros en el fondo (en el navegador) | `casa/main.ts`, `main.ts`, `mesa/escenario.ts` | media | Los bucles se detienen del todo y al volver siguen sin salto (dt máximo 0,1 s) |
| El timbre de un mensaje de voz seguía vibrando en el fondo | `casa/llamada.ts` | media | No timbra mientras está afuera (vuelve a sonar al regresar si nadie contestó) |
| El audio con el que el perrito repite lo que le dicen quedaba despierto para siempre (un `AudioContext` despierto gasta batería aunque no suene) | `casa/patio.ts` | media | Se duerme al terminar |
| Si Android le quitaba el dibujo 3D en el fondo, a los 5 s la página se recargaba escondida (se perdía la partida del súper) | `contexto.ts` | media | La cuenta de 5 s no corre en el fondo |
| Súper en línea: si uno salía de la app, al otro le salía «Ella pausó el juego» y (en el navegador) los «sigo aquí» seguían llegando | `main.ts`, `linea_super.ts` | media | Mensaje `fuera`: al otro le sale «Se cortó la conexión con Ella: salió de la app… esperando a que vuelva» sin poder seguir solo; al volver, «Ella pausó el juego» y cualquiera sigue. Afuera más de 2,5 min: se termina con aviso |
| Mesa en línea: no había pausa de conexión; si el otro se iba, el que esperaba veía «Le toca a Ella» para siempre | `mesa/main.ts`, `mesa/canal.ts` | media | Pausa encima del tablero («salió de la app» o «se cortó la conexión»), se quita sola al volver y se vuelve a pedir la jugada perdida |
| Casa en línea: al irse al fondo, el otro lo seguía viendo «en línea» hasta que se caía el canal (un minuto o más) | `casa/sincro.ts` | baja | Se quita la presencia al irse y se pone al volver |
| La tele de YouTube sigue sonando en el fondo en el navegador (en la APK la pausa el WebView) | `casa/tele.ts` (no es de este frente) | media | **Pasado al frente de la tele**: `Tele` no tiene `pausar()`; ver «Para otros frentes» |

Prueba nueva: `node scripts/probar-segundo-plano.mjs [casa,super,mesa] <base>` (la casa deja de dibujar y calla,
el súper en línea y la mesa en línea muestran la pausa de conexión y retoman). Resultado: todo bien.

## Base de datos (Supabase)

Revisión de `supabase/esquema.sql`. Las reglas ya impedían que una pareja viera o cambiara la casa de otra (las 28
pruebas de `probar_reglas.sql` siguen pasando), pero dentro de la API quedaban puertas abiertas. Los cambios están
en **`supabase/cambios-pendientes.sql`** (el dueño lo pega en el SQL Editor; ver `docs/supabase.md`) con 23 pruebas
nuevas en `supabase/pruebas/probar_cambios.sql`, todas bien en Postgres 16.

| Hallazgo | Gravedad | Arreglo (pendiente de aplicar) |
|---|---|---|
| Las funciones `crear_pareja`, `unirse_pareja`, `guardar_casa`… se podían llamar sin sesión (Postgres da permiso a «public» por defecto) | baja | Solo `authenticated` |
| Regla «personajes: todo»: cualquiera de los dos podía reescribir el personaje del otro | media | Cada uno escribe solo el suyo (`es_rol`) |
| Eventos: se podían mandar a nombre del otro, reescribir lo que decían o borrarlos | media | Solo a nombre propio; de los mandados solo se cambia `visto` (permiso por columna) |
| Recuerdos a nombre del otro | baja | Solo a nombre propio |
| Adivinar el código de 6 letras: sin límite de intentos | media | 20 equivocados por hora y se bloquea un rato (el código que no existe vuelve vacío para poder anotar el intento; la app ya lo entiende) |
| Crear casas sin límite | baja | Máximo 5 por celular |
| La casa guardada, las fotos y los audios sin tamaño máximo | baja | Casa hasta 1 MB y de tipo objeto; fotos y audios hasta 5 MB |
| Los eventos se acumulaban para siempre | baja | Los ya vistos de más de 30 días se borran solos al llegar uno nuevo |
| Los audios de mensajes de voz que salen del buzón (se guardan los últimos 30) se quedan en el almacenamiento | baja | Pendiente (no hay regla para borrar archivos; se puede agregar cuando haga falta) |

## Sincronización de la casa

| Hallazgo | Dónde | Gravedad | Arreglo |
|---|---|---|---|
| Choque de versiones: si llegaba por el canal una versión más nueva del otro mientras se guardaba la propia, la respuesta del guardado la pisaba con la vieja (la casa se veía atrasada hasta el siguiente choque) | `sincro.ts` `cambiarCasa` | media | Solo se toma lo propio si es más nuevo que lo que ya llegó |
| Sin internet, lo que hacía mi personaje no se subía y al volver se perdía (la lectura del servidor lo pisaba con lo viejo) | `sincro.ts` | alta | Queda pendiente y se sube al volver el internet (evento `online`) o al volver a la app, solo si sigue siendo lo último |
| Si el canal en vivo se caía y volvía (internet intermitente), los besos y regalos de ese rato no llegaban hasta volver a abrir la app | `sincro.ts` | media | Al reconectarse el canal se vuelve a leer todo (los mimos pendientes se aplican una vez) |
| Campos que trae una versión más nueva de la app (el otro celular actualizó y este no): cada guardado del celular viejo se los borraba | `modelo.ts` `normalizarCasa` | alta | Se conservan tal cual. `CAMPOS_CASA` lista los campos conocidos y TypeScript obliga a agregar ahí cada campo nuevo de `Casa` |
| Notas, fechas y regalos con datos raros (sin id, mensaje que no es texto, quién/para quién inválido) rompían las hojas que los pintan | `modelo.ts` | media | Se normalizan (los regalos sin quién o para quién válido se descartan) |

## Memoria (tarjeta gráfica) y fugas

| Hallazgo | Dónde | Gravedad | Arreglo |
|---|---|---|---|
| Cada popó del perrito creaba 6 geometrías y 3 materiales que nunca se soltaban | `casa/patio.ts` | media | Piezas compartidas por todos |
| Cada baño del perrito dejaba 16 burbujas en la tarjeta gráfica, y cada sacudida 26 gotitas | `casa/perro.ts` | media | Las burbujas se sueltan; una sola gotita compartida |
| Escuchas, intervalos y temporizadores: revisados en casa, súper, mesa, reacciones y escenas | — | — | Sin huérfanos nuevos (los de las partidas en línea se limpian en `cerrarLinea`) |
| Contextos WebGL: el cine (`escenas/cine.ts`) y el cohete los sueltan al salir | — | — | Bien |

## Animaciones que se veían pobres o bruscas

Módulo común nuevo `src/transiciones.ts` + `src/transiciones.css` (`salirSuave`, `avisoSuave`, `fundido`). Todo
respeta «reducir movimiento» del celular.

| Antes | Dónde | Ahora |
|---|---|---|
| Las hojas (tienda, notas, álbum, fechas…) y las ventanas (regalo, foto, confirmaciones) aparecían y desaparecían de golpe | casa | Entran con un saltico de resorte (el fondo se oscurece suave) y se van bajando y desvaneciendo. La salida la hace una copia sin toques, así la lógica no espera la animación |
| Cambiar de cuarto era un corte seco | casa (`escena_casa.ts`) | El cuarto nuevo aparece desde el color del fondo en 0,36 s (no cambia ningún tiempo de la lógica) |
| La lluvia de corazones caía en línea recta, todos girando igual y sin el tamaño que se les daba (la animación pisaba la escala) | casa | Cada corazón con su tamaño, su vaivén de lado a lado, su giro y su duración; se desvanecen al final |
| Los globitos de pensamiento aparecían y desaparecían de golpe | casa | Se inflan con un saltico y se desinflan al irse |
| Los botones de acción nuevos (al cambiar de cuarto, cuando llega la pareja) aparecían de golpe | casa | Entran escalonados con un saltico (los que no cambian se quedan quietos) |
| Los avisos de abajo (toast) desaparecían de golpe; en la mesa ni siquiera entraban con animación | casa, súper, mesa | Entran con un brinquito y se van bajando |
| La pantalla de carga se cortaba de golpe | casa, súper | Se desvanece y el logo se agranda un poquito |
| Las monedas y los «¡Pum!» del súper solo subían derechito | súper | Saltan con un golpecito y después suben |
| La hoja de la mesa (invitación, ayuda) desaparecía de golpe | mesa | Se va suave como las de la casa |

## Para otros frentes (fuera de esta parte)

| Qué | Dónde | Gravedad | Propuesta |
|---|---|---|---|
| La tele no tiene cómo pausarse: en el navegador el video sigue sonando con la app escondida (en la APK lo pausa el WebView) | `src/casa/tele.ts` (`reproductorYoutube` no expone `pauseVideo`) | media | Agregar `pausar()`/`reanudar()` a `Tele` con `p.pauseVideo()`/`p.playVideo()` y suscribirlos con `alPausar`/`alReanudar` de `segundo_plano.ts` |
| Al lavarse la cara, el bucle que anima las ondas del espejo (`abrirPortal`) sigue corriendo todo el minijuego aunque el portal está escondido | `src/casa/main.ts` `abrirPortal` (función `lavarse`) | baja | Detener el `requestAnimationFrame` mientras `portal.style.display === 'none'` |
| Lavado, cohete y cocina no muestran pausa al volver de segundo plano (el juego se congela y sigue, sin salto de tiempo porque su `dt` va topado a 0,05 s) | `lavado.ts`, `cohete.ts`, `cocina/motor.ts` | baja | `alPausar(() => abrir su menú de pausa)` de `segundo_plano.ts` |
| Cien Puertas: ya apaga los sensores en segundo plano; puede usar el módulo común para la música y su bucle | `src/puertas/` | baja | `import { alPausar, alReanudar, cuadros } from '../segundo_plano'` |
| Las escenas premium dibujan a 60 cuadros por segundo (todo lo demás va a 30) | `src/escenas/cine.ts` | baja | Al rehacerlas, usar `cuadros()` con tope de 30 |
| Nombres de animaciones CSS repetidos: `cae`, `sube` y `late` existen en `estilos.css` y en `casa.css` con movimientos distintos (en la casa ganan los de `casa.css`) | `src/estilos.css`, `src/casa/casa.css` | baja | Renombrar los de la casa (`cae-corazon`, `sube-efecto`, `late-ico`) |
| **Campos nuevos de la casa**: `modelo.ts` ahora tiene `CAMPOS_CASA` y TypeScript obliga a listar ahí cada campo nuevo de `Casa` (si no, no compila). Así un celular con la app vieja no borra lo que guarda la nueva | `src/casa/modelo.ts` | — | Al juntar ramas que agreguen campos a `Casa` (p. ej. el tocador), agregar la clave a `CAMPOS_CASA` además de su normalización |
| Íconos de productos en PNG (248 archivos, 6,3 MB) junto a 701 en WebP | `public/modelos/iconos` | baja | Pasarlos a WebP sin pérdida en el optimizador (ahorraría ~2-3 MB de la APK); hay rutas `.png` fijas en `recursos.ts`, `ui_casa.ts` y `main.ts` |

## Rendimiento (sin bajar la calidad gráfica)

Nada de bajar resolución, modelos, sombras ni efectos: lo mismo se ve igual, pero cuesta menos.

| Cambio | Dónde | Efecto |
|---|---|---|
| Las sombras de contacto (N8AO) y el suavizado (SMAA) se descargan aparte mientras cargan los modelos (antes iban en el trozo `personaje`, que también cargaban la mesa y el súper sin necesitarlos todos) | `mundo.ts` → `postpro.ts` | Trozo `personaje`: 915 → 689 kB (gzip 307 → 184 kB) |
| Los recuerdos flotantes (dibujos, frases y la historia de los dos) se descargan la primera vez que salen (baño o cama) | `casa/recuerdos.ts` → `recuerdos_panel.ts` | Trozo `casa`: 266 → 227 kB, y la historia (25 kB) ya no se carga al abrir |
| 9 modelos sin comprimir (cuartos de la ampliación, patio, perrito, bebé, cigüeña): se comprimieron con meshopt igual que el resto, **sin simplificar** | `public/modelos` | 21,0 → 5,5 MB (la APK pesa ~15 MB menos); comparados foto a foto, se ven igual. Además ocupan menos memoria de video (atributos cuantizados) |
| Los cuartos de siempre y los dos personajes empiezan a descargarse a la par con los productos | `casa/main.ts` | Menos espera en la pantalla de carga |
| Con una hoja encima (tienda, notas…) o la tele en grande, la casa se dibuja a 16 cuadros por segundo en vez de 30 (casi no se ve; el vigilante de calidad no se confunde) | `casa/main.ts` | Mitad de trabajo de la tarjeta gráfica mientras se compra |
| La mesa dibujaba a 60 cuadros por segundo | `mesa/escenario.ts` | 30, como todo lo demás |
| Súper: los globos, barras, números y avisos se reescribían en cada cuadro aunque no cambiaran (cada escritura hace recalcular la página) | `ui.ts` | Solo se escribe lo que cambió |
| Vectores nuevos en cada cuadro por personaje y por globo | `personaje.ts`, `mundo.ts`, `ui.ts` | Se reusan |
| Un modelo que falla al cargar quedaba fallando para siempre (la promesa rota se quedaba en la caché) | `recursos.ts` | Se vuelve a intentar |
| **Error grave encontrado al medir**: descomprimir los modelos en hilos (`MeshoptDecoder.useWorkers`) rompe la versión compilada (el hilo se arma con el nombre de una función que el minificador cambia): la casa se quedaba cargando para siempre | `recursos.ts` | Se dejó sin hilos, con el aviso escrito en el código |

Choques de muchos contra muchos: en el súper hay a lo sumo unas 30 personas a la vez y los choques solo se revisan
entre los dos jugadores; una estructura espacial no ahorraría nada. Cuartos: se cargan cuando alguien entra (o va
caminando para allá) y no se descargan, porque los modelos quedan en la caché compartida y soltarlos obligaría a
volver a descomprimirlos (más espera y más calor al volver).

JavaScript que hay que leer antes de mostrar cada página (versión compilada):

| Página | Antes | Después |
|---|---|---|
| Casa (`index.html`) | 1.325 kB (gzip 436) | 1.043 kB (gzip 293) |
| Súper (`super.html`) | 1.031 kB (gzip 345) | 811 kB (gzip 225) |
| Mesa (`mesa.html`) | 1.103 kB (gzip 355) | 886 kB (gzip 236) |
| Modelos (`public/modelos`) | 79,8 MB | 64,4 MB |

### Mediciones antes y después

Versión compilada servida en local, Chromium sin tarjeta gráfica (SwiftShader: el dibujo va a 1-2 cuadros por
segundo, así que los cuadros por segundo no sirven para comparar; se mide el trabajo de JavaScript y de la página).
«Antes» es la rama al empezar la auditoría (`822ee9e`); «después», el final de esta rama. `scripts/_medir.mjs`
(temporal, no se sube) con tres corridas de la casa.

| Medida | Antes | Después |
|---|---|---|
| Casa: abrir hasta poder jugar (`__listo`), tres corridas | 4,34 / 4,32 / 4,47 s | 3,90 / 4,19 / 4,40 s |
| Casa: memoria de JavaScript al abrir | 19,6–20,0 MB | 14,6–19,3 MB |
| Casa: recálculos de estilo de la página en 8 s quieta | 13 | 1 |
| Súper: maquetaciones y recálculos de estilo en 12 s de juego con el piloto | 16 y 16 | 2 y 2 |
| Súper: tiempo de JavaScript en esos 12 s | 0,335 s | 0,303 s |
| Súper: memoria de JavaScript jugando | 25,4 MB | 23,0 MB |
| Cuarto de la ampliación más pesado (patio): cargar la primera vez, disco frío | 423 ms | 82 ms |
| Memoria de video de los modelos comprimidos (vértices e índices) | patio 5,7 · juegos 3,4 · bebé 4,1 · perrito 2,3 MB | 3,3 · 1,9 · 2,4 · 1,1 MB |
| Mesa: cuadros dibujados por segundo en un celular de verdad | 60 | 30 (la mitad de trabajo; en SwiftShader no se nota porque no alcanza ni a 30) |

En un celular Android normal la diferencia de abrir debería ser mayor que aquí: este computador lee 280 kB de
JavaScript de más en unos pocos milisegundos, un celular de gama media en 50-100 ms, y los cuartos nuevos se leen
del almacenamiento de la APK con la mitad de memoria de video.

## Pruebas (esta auditoría)

Todas contra la versión compilada (la que va en la APK), en un servidor local:

| Prueba | Resultado |
|---|---|
| `probar-segundo-plano.mjs` (casa, súper en línea, mesa en línea) | 18 de 18 |
| `probar-linea.mjs` (casa en línea con el Supabase de mentiras) | 17 de 17 (antes fallaban 4: la prueba simulaba volver a la app sin haberse ido) |
| `probar-casa.mjs` | Sin errores |
| `probar-acciones.mjs` | Sin errores (estaba desactualizada: la tele en grande tapaba los botones) |
| `probar-mesa-linea.mjs` con cajas, dados, mancala, parchís y parchís a 2 colores | Los cinco: misma partida en los dos celulares (el parchís estaba desactualizado: ahora pregunta uno o dos colores) |
| `probar.mjs` (día 1 del súper con el piloto) | 3 estrellas, sin errores del juego |
| `supabase/pruebas/probar_reglas.sql` + `probar_cambios.sql` (Postgres 16) | 28 de 28 y 23 de 23 |
| Modelos comprimidos: fotos de los 10 cuartos, de cerca y del perrito con los modelos viejos y los nuevos | Iguales (solo cambian lo que se mueve: trofeos girando, el perrito, pantallas) |
