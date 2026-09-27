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
| Dos tiendas montadas | Dos compras seguidas en «Mejorar la tienda» podían dejar dos tiendas en el fondo. | Solo se queda la última. |
| Partida dañada | Una partida guardada rara podía romper el menú. | Se normaliza al cargar. |
| Cliente fantasma | Salir del día justo cuando entraba un cliente lo dejaba parado en la tienda del menú. | Lo que termina de cargar después de salir ya no aparece. |
| Música atropellada | Si el celular se atrasaba, la música tocaba de golpe las notas perdidas. | Se salta lo perdido. |
