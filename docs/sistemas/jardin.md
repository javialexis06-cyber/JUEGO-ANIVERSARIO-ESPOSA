# Jardín de los Desvelados

Defensa por carriles con plantas y zombis originales de peluche. Página `juego/web/jardin.html`, código
`src/jardin/`. Está en el patio de la mascota y en la Sala de Juegos de amigos. Se inspira en el género de defensa
con plantas; no distribuye personajes, mapas, sonidos ni recursos de Plants vs. Zombies.

## Cómo se juega

Escoge una planta y toca una casilla libre. Recoge las luces del cielo y de las margaritas para pagar otras
plantas. Cada semilla tiene su recarga. Los zombis avanzan por su carril, se detienen para morder una planta y
continúan si la destruyen. Las plantas que disparan solo lo hacen con un blanco en su carril. La pala retira una
planta sin devolver su coste.

Cada carril empieza con un farol guardián: despide una vez a los zombis de ese carril si uno alcanza la izquierda.
Si otro vuelve a cruzar sin farol, se pierde. Se gana al despedir a todas las visitas de la última oleada. Hay
pausa, velocidad ×1/×2 y efectos de sonido opcionales. Cambiar de aplicación pausa la partida.

## Macetas y visitas

| Planta | Función |
|---|---|
| Margarita farol | Produce luz. |
| Frijol campana | Dispara semillas. |
| Calabaza cojín | Barrera resistente. |
| Menta escarcha | Dispara y ralentiza. |
| Hongo linterna | Explosión de esporas que puede alcanzar carriles vecinos. |
| Chile cometa | Explosión de un uso. |
| Enredadera gemela | Disparo doble. |
| Flor campanilla | Repara plantas vecinas. |

Los cinco zombis son Remendado, De olla, Corredor, Paraguas y Grandote. La olla aporta resistencia, el corredor es
más rápido, el paraguas amortigua las semillas pequeñas y el grandote llega al final de los patios avanzados.

Las trece figuras salen de `personajes/blender/patio_figuras.py` a `public/jardin/figuras.glb`, con materiales de
fieltro, ojos, mejillas y costuras propias. Ese exportador también crea los retratos y documentos de los cuatro
expedientes nuevos de Desaparecidos. No modifica recursos ni código de granja.

## Campaña y guardado

Doce patios: La primera siembra, El paseo de las macetas, Las hojas con rocío, La sombra de los naranjos, La tarde
de llovizna, El sendero de costuras, Cuando prenden los faroles, Las hileras de lavanda, La ronda de las luciérnagas,
El tapiz de la abuela, Las doce de la noche y Un amanecer sin bostezos. Cambian los carriles, el ambiente, las
visitas, las oleadas y las plantas disponibles. Se desbloquean al ganar el anterior.

Tres estrellas si quedan todos los faroles; dos si queda al menos la mitad; una por victoria. Progreso local
`jardin-v1` o `amigo-jardin-v1`. Las mejores estrellas nunca disminuyen. Un fallo de escritura conserva la victoria
abierta y ofrece reintento; no se abandona el resultado pendiente. Salir de una batalla sin terminar la descarta,
como indica el menú de pausa. No se concede dinero ni se modifica la economía de la casa.

## Plantas contra zombis · dos jugadores

El botón **Plantas contra zombis · jugar dos** abre `jardin-duelo.html`. Se puede jugar en una pantalla o crear
una sala para exactamente dos personas, cada una en su dispositivo. La Sala de Juegos de amigos también ofrece
crear o unirse a estas salas. Quien la crea elige su bando; puede intercambiarlos antes de empezar.

Las plantas recogen luz, siembran las ocho macetas y usan la pala. Los zombis escogen una de las cinco unidades y
un carril mediante sus botones o tocando el campo. La ronda dura tres minutos, incluidos veinte segundos de
preparación. Las plantas ganan si la casa resiste; los zombis ganan si cruzan un carril después de consumir su
farol. No hay oleadas automáticas en el duelo: las envía la persona que ataca.

La luz, daño, vida, velocidades y ataques de las figuras conservan los valores de campaña. La niebla es un recurso
exclusivo del nuevo duelo: empieza en 150, recibe 20 cada cuatro segundos y tiene un límite de 600. Los reclutas
cuestan 50/100/75/100/225 de niebla (remendado/olla/corredor/paraguas/grandote), con recargas de 5/11/9/12/35 s.
Estas reglas iniciales no cambian precios ni dificultad de los doce patios. El duelo no concede estrellas,
monedas, compras ni desbloqueos de campaña. Los ajustes posteriores de balance siguen requiriendo aprobación.

El anfitrión simula el motor y valida bando, recursos, recargas, carril, sesión y secuencia de cada orden. El
invitado interpola posiciones entre fotos; no calcula impactos ni inventa recursos o ganadores. Las órdenes y
el primer resultado usan confirmación y reenvío. La partida espera a que las figuras carguen en los dos aparatos.

Cualquiera puede poner pausa; cada uno retira solo su propia pausa. Cambiar de aplicación pausa también en
Android. Los cortes detienen el reloj y no conceden una victoria; salir del anfitrión cierra la sala. La revancha
necesita que ambos acepten, crea otra sesión e intercambia los bandos, rechazando fotos y órdenes de la anterior.
Las salas usan el transporte Realtime existente y no necesitan tablas nuevas de Supabase.

## Pruebas del motor y la interfaz

```sh
node scripts/probar-jardin-motor.mjs
node scripts/probar-jardin-duelo.mjs
CHROME_PATH=/usr/bin/chromium node scripts/probar-jardin-interfaz.mjs http://127.0.0.1:4184/ test-results/jardin
CHROME_PATH=/usr/bin/chromium node scripts/probar-jardin-duelo-interfaz.mjs http://127.0.0.1:4184/ test-results/jardin-duelo
```

El motor completa los doce patios con tres semillas mediante un piloto que usa los costes, recargas y casillas
normales. También comprueba derrota sin defensa, pala, límites y recogida única de luces. La interfaz usa primero
toques reales sin piloto y después la campaña con piloto y paso fijo; no certifica habilidad humana ni teléfonos.
Escenarios unitarios separados comprueban la ráfaga doble, esporas entre carriles, ralentización y reparación
de plantas vivas. El banco lateral y la cámara adaptan el campo a los tres, cuatro y cinco carriles en horizontal.

El recorrido de dos jugadores usa contextos separados y un transporte Supabase simulado con un 8 % de pérdida,
demora aleatoria y corte controlado. Comprueba toques, ambos resultados, pausa, tercer jugador, revancha y salida.
`REAL=1` usa una sala efímera en Supabase Realtime real y omite el corte simulado. La conexión real debe comprobarse
por separado; pasar el transporte falso no la acredita. Los escenarios acelerados no certifican balance competitivo humano.
El 16 de octubre de 2026 también pasó el recorrido con `REAL=1`, ambas victorias y revancha entre dos contextos
aislados, sin errores ni recursos fallidos. [Registro y límites](../en-obra/jardin-dos-jugadores-2026-10-16.md).
