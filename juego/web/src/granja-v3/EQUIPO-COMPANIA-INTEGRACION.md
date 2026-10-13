# Accesorios funcionales de compañía

13 de octubre de 2026. Frente de motor: tres accesorios fabricables para mascotas y caballos. Los modelos, animaciones, voces y la presentación existente se conservan. No hay nuevas piezas de arte.

| Accesorio | Compañero y ranura | Fabricación | Beneficio efectivo |
| --- | --- | --- | --- |
| `collar_paseo` | Gato, perro o tortuga; paseo | A mano: 8 fibras y 1 mineral de cobre | Camina un 10 % más rápido por la ruta existente. |
| `brida_senda` | Caballo; paseo | Banco de trabajo: 3 cuerdas, 6 fibras y 1 lingote de cobre; 25 segundos | Camina un 10 % más rápido cuando lo llamas y espera a menos de 1,2 m, frente a 1,6 m sin brida. |
| `herraduras_senda` | Caballo; montura | Banco de trabajo: 2 lingotes de hierro y 4 piedras; 30 segundos | La montura avanza un 8 % más rápido. |

Las tres recetas tienen nivel 0. Los materiales existen antes de este bloque y las recetas se ejecutan en las estaciones reales: ingredientes reservados al encolar y salida recogida desde el banco. Las primeras misiones conservan el acceso a hogares y establos; no se introduce un requisito circular ni un nuevo recurso. Los accesorios no se compran gratis y su venta vale cero. La fabricación sigue registrando sus hechos y pagando los materiales por las acciones del motor.

## Uso

Fabrica el accesorio en Taller y recoge el resultado en la mochila. Acércate al compañero en el exterior y abre Compañeros. Su ficha muestra las ranuras y un selector con las piezas compatibles de la mochila. Equipar consume una pieza; Quitar la devuelve con su calidad exacta. Para ajustar un caballo, primero desmonta.

No hay beneficios por llevar el accesorio en la mochila. La calidad se conserva, pero no aumenta su efecto. Un caballo puede llevar brida y herraduras a la vez; una mascota solo tiene la ranura de paseo. Las mascotas conservan su diferencia de ritmo: la tortuga pasa de 0,65 a 0,715 m/s; el gato y el perro, de 2,2 a 2,42 m/s. El caballo a pie pasa de 2,2 a 2,42 m/s. La velocidad montada aplica un factor de 1,08 sobre su velocidad habitual.

## Guardado y transacciones

`Companero.equipo` es opcional en V5. La ausencia conserva exactamente el comportamiento anterior; no necesita migración ni objetos compensatorios. Sus valores son pilas de cantidad 1, con artículo y calidad opcional de 0 a 3. El campo presente debe ser un objeto con las ranuras `paseo` y/o `montura`; se rechazan ranuras, artículos, cantidades, tipos y calidades incompatibles. No se transforma un guardado corrupto en equipo vacío.

Las acciones preparan una copia de mochila y equipo y solo confirman ambas después de comprobar la capacidad. Para cambiar una pieza, se libera primero la casilla de la nueva y se devuelve la anterior. Así funciona el cambio incluso con la mochila completa. Para quitar, hace falta una casilla libre porque las piezas no se apilan. No se usa el almacén de migración ni se producen excedentes invisibles.

Equipar exige la identidad esperada de la casilla: `articulo` y `calidad`. Si cambió desde que se mostró la ficha, la acción falla. Esto impide que una repetición de la misma petición reintercambie la pieza anterior devuelta a esa casilla. Equipar la misma pieza con la misma calidad o quitar una ranura ya vacía falla sin gastar ni duplicar. La interfaz debe transmitir los datos del `option` seleccionado, no asumir calidad cero.

El equipo no modifica genes, vínculos, cuidados, producción, comida, monedas, energía ni jornadas. Dormir y pasar tiempo real lo conservan. La ausencia sigue aplicando los cuidados reales; no hace caminar ni crecer el vínculo. Caminos, portones, agua, obstáculos, noche y enfermedades siguen usando las reglas de compañía existentes.

## Integración del coordinador

Los archivos `compania.ts` y `estado.ts` ya conectan `AccionCompania` por tipo. `motor.ts` delega en `actuarCompania`; no necesita un caso de motor adicional.

Firmas nuevas:

```ts
{ tipo: 'compania', accion: { tipo: 'equipar', id, casilla, articulo, calidad }, xJugador, zJugador }
{ tipo: 'compania', accion: { tipo: 'quitar_equipo', id, ranura }, xJugador, zJugador }
// calidad: 0 | 1 | 2 | 3; ranura: 'paseo' | 'montura'
```

En `main.ts`, añadir `comp-equipar`: leer el selector `comp-equipo-${id}` y enviar `Number(select.value)`, `selectedOptions[0].dataset.articulo` y `Number(selectedOptions[0].dataset.calidad)`. Añadir `comp-quitar-equipo` con `data-id` y `data-ranura`. Ambos usan `accionCompania`, que toma las coordenadas físicas del avatar. Las opciones declaran su identidad con `data-articulo` y `data-calidad`.

Importar `efectosEquipoCompania` de `equipo-compania.ts`. En el cálculo habitual de `avatar.multiplicadorVelocidad`, si hay caballo montado, multiplicar por `efectosEquipoCompania(caballo).velocidadMontada`. El factor no se guarda y no se aplica al personaje a pie. El movimiento del compañero ya usa `velocidadPaseo` y `distanciaEspera` en `PaseosCompania`.

El guardado inmediato con reversión por cuota debe abarcar las acciones `compania`, incluyendo las nuevas. La reversión debe restaurar juntos `casillasInventario`, `inventario` y `compania`. Comprobar en navegador la ficha, cercanía, cambio, velocidad montada, cuota y recarga del conjunto; el frente aislado no afirma haber comprobado esos manejadores de `main.ts`.

## Validación aislada

`node scripts/granja-v3/probar-equipo-compania.mjs`: 22 comprobaciones sin fallos. Incluyen fabricación a mano y producción/recogida física en banco; consumo exacto de casilla y calidad; límites de proximidad; piezas y ranuras incompatibles; acciones repetidas; cambio de calidad con mochila llena; devolución bloqueada sin pérdida; caballo montado; V5 anterior; recarga; guardados corruptos; efectos acotados; paseo real un 10 % más rápido de las tres mascotas; aproximación del caballo con brida; y ausencia de 49 horas/dormir sin vínculo gratuito.

`node scripts/granja-v3/probar-compania.mjs`: 46 comprobaciones de compañía anterior sin fallos. `npx tsc --noEmit -p .`: correcto. Las comprobaciones completas, ambos paquetes y recorrido de navegador los realiza el coordinador después de combinar los tres bloques. Esta prueba no certifica FPS de un dispositivo. Los beneficios reutilizan las rutas existentes y no aumentan el presupuesto de búsquedas.

## Límites

No hay alforjas, transporte autónomo, armaduras de mascota, estadísticas de combate, combate de compañeros ni accesorios elementales. No cambia el número de compañeros ni incorpora nuevos modos de llamar. El sistema admite los accesorios actuales y deja estas ampliaciones para decisiones futuras de jugabilidad y arte.
