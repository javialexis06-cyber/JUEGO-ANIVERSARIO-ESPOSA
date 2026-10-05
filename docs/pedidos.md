# Pedidos de Javier en cola

Lo que Javier pidió y todavía falta, en el orden en que se va a hacer. Se tacha (se borra) cuando queda hecho,
probado y subido.

## Siguiente, apenas termine Sangre y Ceniza: amigos como invitados

Creador de personajes para los amigos y acceso a la APK y al .exe como invitado, para que los amigos prueben y
testeen los juegos **sin acceso a nada personal ni romántico de la pareja** (ni recuerdos, ni notas, ni la casa,
ni frases de amor, ni apodos). Parte de la base ya la hace el frente de salas («Soy un amigo» básico).

## Cuentas: el mismo progreso desde cualquier aparato (pedido de Javier, prioridad alta)

«Quiero que el progreso de cuenta se guarde: solo una persona puede ser Él y solo una Ella, y que desde cualquier
dispositivo que entre con la contraseña pueda jugar con los mismos datos, la misma casa, los mismos avances; que no
se pierda el progreso.»
- Hoy se entra con el código de la casa de 6 letras y se escoge Él o Ella; cada celular es una sesión anónima de
  Supabase (`miembros`). Hace falta una **cuenta por persona con contraseña** (Supabase Auth con correo o usuario +
  contraseña), **un solo dueño por rol** en cada casa (Él y Ella exclusivos: el segundo aparato que quiera ser Él debe
  iniciar sesión como Él, no crear otro), y que al entrar desde otro celular o el computador cargue la misma casa.
- **Todo el progreso en la nube**, no en el aparato: revisar cada minijuego que guarda en `localStorage`
  (súper, Cien Puertas, mesa, lavado, retrete, cocina, Sangre y Ceniza, tele, escenas compradas, ajustes) y pasarlo
  al estado de la casa o a tablas propias, con migración de lo que ya hay en el celular de cada uno.
- Los cambios de SQL los aplica Javier en el panel de Supabase (no hay clave de servicio aquí); dejarlos en
  `supabase/cambios-pendientes.sql` con instrucciones claras. No poner nunca la clave de servicio en la app.

## Sangre y Ceniza: correcciones y mejoras (pedido de Javier tras probarlo)

Textual: «Mejorar calidad de mapa; mejorar movilidad, se siente tosca, los ojos se cansan o se abruman por la
velocidad, se siente raro…»
- **Calidad**: mapas, enemigos, personajes «y todo lo demás»; «los sprites están muy básicos, falta mucho trabajo de
  texturas».
- **Movimiento y cámara**: se siente tosco y cansa la vista (velocidad, sacudidas, cámara que salta): suavizar
  aceleración/frenado, cámara con amortiguación, menos parpadeo de efectos.
- **Visión astral** (un modo de ver en gris o similar, con un botón) que deje identificar lo del piso: menas, cofres,
  campana, objetos. **Que nada salga señalado en el mapa salvo la campana de extracción.**
- **La campana**: revisar si está fallando (sale la flecha que guía pero al llegar no se ve la campana; eso puede
  impedir pasar de nivel). Hacer mucho más visible el haz de luz; **más tiempo para llegar** (hoy, si estás lejos, es
  imposible). Javier dice que en algunos niveles «de repente baja la campana»: si no es error, explicárselo (pasa
  cuando se cumple el objetivo o se acaba el tiempo de la etapa); si es error, arreglarlo.
- **Recoger objetos**: en computador, con clic del mouse; en celular, pasando por encima. **Áreas de recolección más
  grandes** (no el dibujo, solo el área) y una barrita o animación de que se está recogiendo/interactuando.
- **La Forja**: al mejorar algo no debe devolver al principio de la lista (que se quede donde estabas). Revisar el
  **aura dorada de subir de nivel**, que no sale (parece error).
- **Más Deep Rock Galactic**: mapas más grandes, más importancia a la minería, partidas más largas.
- **Balance**: la dificultad de los primeros segundos se pierde a los 2 minutos y después de la primera etapa es
  prácticamente morir. Que siga siendo jugable y divertido, pero con una progresión de dificultad más pareja y la
  minería más importante.
- **Modo infinito**: expediciones sin fin con enemigos cada vez más difíciles.
- **Mejoras de minería**: bombas de minería, picar en área y cosas así.

## Ronda 2 de arreglos (después de lo de amigos)

**Retrete espacial**
- Consumibles como la patineta de Subway Surfers: se activan cada cierto tiempo y protegen de 1 choque.
- Los cascos, retretes y estelas se consiguen **cumpliendo misiones** según su calidad (rareza).
- Estelas de mejor calidad, más nítidas; las premium mucho más fluidas.

**Cocina**
- Ver el pedido en todo momento después de tomarlo (hoy toca ir hasta la última estación para recordarlo).
- Chantilly y demás con textura y grosor: que se puedan hacer montañas.
- La mantequilla con número (1, 2) en vez de puntitos.
- Lo que se acumula (chantilly, miel…) con una ruedita pequeña de cantidad que avise cuándo cumple el pedido
  (sencillo, doble).
- Tomar el pedido más lento, con velocidad según el cliente, y sin poder cambiar de estación mientras se toma.

**Nombres**: Javier y Laura en vez de «Él» y «Ella» en todas las pantallas (`NOMBRE_ROL`).

**Tutoriales** para Lavarse la cara (Vampire Survivors), Súper Manía, Cien Puertas y los juegos más complejos.

**Súper Manía**
- La mitad de estantes de cada tipo por tienda (hay demasiados).
- La lista de mejoras solo muestra las que están desbloqueadas (aunque no alcance la plata).

**Lavarse la cara (Vampire Survivors)**
- (En obra con las salas) El chorro de agua más translúcido; ataque manual o automático a escoger (los de área
  —perro lanudo, bombero, astronauta— siguen automáticos); tutorial.
- **Íconos de poderes, armas y mejoras**: en el celular salen vacíos; renderizarlos y revisar que carguen en la APK.
- Un **panel de combinaciones**: ver qué tengo y con qué se combina para evolucionar y hacer combos (como la guía
  de evoluciones del original), también a mitad de partida.
- **Logros y recompensas por avanzar con cada personaje/disfraz** (maestría de cada uno).
- Seguir mejorando el minijuego con lo mejor de otros juegos del género, **sin chocar con Sangre y Ceniza** (que se
  queda con lo oscuro, las cuevas excavables, las expediciones por etapas y las clases serias).

## Después
- Sótano tétrico con contraseña y juego de terror estilo *No, I'm Not a Human* (estudio del género, historia
  profunda).
- Juego de resolver crímenes: 10 casos revisando el celular de la víctima (apps parecidas a las reales, personas
  ficticias).
- Lo acumulado: Cien Puertas (en obra), Show de Nosotros (en obra), tele compartida, tocador de Laura, escenas
  premium y diseños premium.
