# Un ratito en el patio

Página `juego/web/mente.html`, código `src/mente/`. Se abre desde el patio de la mascota y desde la Sala de Juegos
de amigos. Son juegos de ocio que practican memoria, atención, lenguaje y lógica; sus marcas no evalúan salud ni
se anuncian como prevención de enfermedades. No dan recursos de la casa ni modifican su balance.

## Los dieciséis juegos

| Juego | Mecánica |
|---|---|
| Parejas del jardín | Ocho parejas en dieciséis cartas. |
| El coro de luces | Cinco secuencias, de tres a siete luces; sonido opcional. |
| Ventanas de colores | Tres cuadrículas que se muestran y luego se ocultan. |
| Dos patios | Cinco diferencias entre dos cuadrículas de figuras. |
| ¿Dónde está? | Diez búsquedas entre distractores. |
| Tinta traviesa | Doce turnos de Stroop: responder al color, no a la palabra. |
| Cuentas del puesto | Doce operaciones de suma, resta y multiplicación. |
| Sudoku de bolsillo | Cuadrícula 4×4 con bloques 2×2 y solución única. |
| Letras entre hojas | Seis palabras en una sopa 8×8, por primera y última letra. |
| Palabras revueltas | Seis anagramas con tema; las letras repetidas conservan sus fichas. |
| Las nueve baldosas | Rompecabezas de ocho fichas generado con movimientos legales. |
| Siluetas de fieltro | Tangram de siete piezas: selección, giro y colocación; acepta intercambiar piezas iguales. |
| Las torres del patio | Hanói de cuatro discos, tres torres y movimientos legales. |
| El camino del perrito | Laberinto conectado, con flechas, teclado o toques vecinos. |
| La lista del mercado | Recordar ocho productos y escogerlos entre dieciséis. |
| Dos pasos atrás | N-back de dos posiciones, dos presentaciones y veintidós respuestas. |

Cada uno tiene un motor determinista. No se puede contestar durante una presentación de memoria. Las respuestas,
la selección y el generador de azar se conservan al guardar y continuar una partida. La pausa y el segundo plano
paran el reloj. Los perfiles de amigos y los roles de pareja conservan claves independientes.

## Reto diario y clasificación

El día se calcula en `America/Bogota`; cambia a medianoche de Colombia. La rotación recorre los dieciséis juegos
antes de repetir. Todos reciben el mismo juego y semilla ese día. La práctica libre permite jugar cualquiera y
no publica marcas. El resultado combina precisión y tiempo; los errores reducen puntos, con máximo 10.000.

Al terminar el reto se guarda la marca local. Publicar requiere escribir un seudónimo y tocar el botón; un fallo
de red conserva el envío para reintentar. La tabla muestra las cien mejores marcas del día. Cada perfil conserva
solo su mejor puntuación, con menor tiempo como desempate.

**Habilitación del servidor:** el agente debe aplicar [patio-clasificacion.sql](../../supabase/patio-clasificacion.sql)
en el proyecto Supabase configurado cuando Javier conecte su cuenta mediante el plugin ofrecido. No se le pide
escribir SQL. Añade `patio_perfiles`, `patio_marcas`, `patio_tabla` y `patio_publicar`. RLS impide
leer los hashes de perfiles o escribir marcas directamente. La función de publicación comprueba el token del
perfil, el día de Colombia, el juego esperado y los rangos. La tabla solo devuelve seudónimo, puntos y tiempo.
Es una competición amistosa con resultados comunicados por el cliente, sin premios económicos ni certificación
contra manipulación de una aplicación modificada.

La consulta al servidor real devolvió `PGRST202` durante esta ampliación: las funciones todavía no estaban
instaladas. El archivo se probó en PostgreSQL temporal; no presentar esa prueba como despliegue real.

## Comprobaciones

Desde `juego/web/`:

```sh
node scripts/probar-mente-motor.mjs
CHROME_PATH=/usr/bin/chromium node scripts/probar-mente-interfaz.mjs http://127.0.0.1:4182/ test-results/mente
```

La prueba de interfaz necesita la base temporal `patio-sql-prueba` con los roles `anon`/`authenticated` y la
migración aplicada; intercepta únicamente sus RPC y los envía a esa base. No publica datos en Supabase real.
El resolutor usa el estado para encontrar acciones legales; no demuestra deducción de una persona ni beneficios
médicos. El SQL reproducible de permisos está en [probar_patio.sql](../../supabase/pruebas/probar_patio.sql).

`scripts/probar-patio-accesos.mjs` comprueba ambos accesos desde casa, su retorno al patio conservando el perfil
y las dos tarjetas de la compilación de amigos. Requiere servir las dos compilaciones; sus URLs son argumentos.
