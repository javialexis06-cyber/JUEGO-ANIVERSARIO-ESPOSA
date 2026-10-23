# La Semilla Madre · primer escenario y controles

23 de octubre de 2026. Javier pidió detener la ampliación de mundos hasta revisar los principios del juego,
los controles y la animación. Se mantiene el catálogo pendiente, con prioridad en esta base jugable.

## Problema reproducido y cambio aprobado

El [run de Actions 39974792422](https://github.com/javialexis06-cyber/JUEGO-ANIVERSARIO-ESPOSA/actions/runs/39974792422)
terminó correctamente y compiló `cf1d926c`. La captura de derrota corresponde a la historia territorial.
La falta de fidelidad visual no se atribuye a una rama equivocada.

El inicio anterior permitía salir a Estación vieja y recibía un contraataque en la casa a los 35 segundos.
En una reproducción con semilla 23, equipo Repetidora/Patatapum y piloto solo en la expedición, la casa vacía
cayó a los **159,08 segundos**. El aviso temporal podía desaparecer mientras el jugador atendía otro tablero.
Esto acredita una ruta de derrota temprana; no demuestra que todas las combinaciones sean imposibles.

**Javier aprobó expresamente el cambio de progresión:** para partidas nuevas, defender primero la casa en
una partida completa de PvZ, conservar lo plantado y habilitar después expediciones y contraataques.

- La historia nueva entra directamente en La casa, con su motor y equipo existentes. Durante esa primera defensa
  no se pueden explorar zonas ni comenzar expediciones. No se superpone un segundo contraataque.
- Al ganar se conservan plantas, vida, soles, recargas y cortacéspedes. Se abre el mapa y el siguiente ataque queda
  programado 35 segundos después; el resto de la presión conserva sus reglas.
- Se mantienen el nivel territorial de la casa, sus enemigos, recursos iniciales, costes y estadísticas.
- El estado opcional `inicioCasa: true` existe solo durante el prólogo. Los guardados V2 que no lo contienen
  siguen en su fase previa sin imponerles otra defensa ni resetearlos. Se valida su coherencia antes de escribir.
  El parámetro `inicio: 'anterior'` del constructor permite restauración y fixtures explícitos de ese formato.

## Interacción y presentación

- Pala dibujada que sigue al puntero, botón activo visible y celda señalada. Usarla no reembolsa soles; se guarda
  después de retirar la planta. Escape y clic derecho cancelan la herramienta o semilla en mano.
- Plantas visibles en la mano al seleccionar sobres, estado `aria-pressed` y sobre elevado. Después de plantar
  se libera la selección. En táctil se mantiene la señal del botón y la figura se desplaza durante el toque.
- Las semillas del selector viajan visualmente a una baraja de ranuras, conservando el orden elegido. Se pueden
  quitar desde ella. El catálogo conserva el puesto y muestra una marca; las reservas por zona siguen vigentes.
  La baraja funciona en historia y aventura, con una distribución revisada en 844×390.
- Croquis trazados a mano sobre parcelas, cercas, calles y costas del arte existente. La casa inicial resalta
  una propiedad concreta; la estación, su recinto. Los pines están dentro de esos lugares. Los límites ya no
  se calculan repartiendo la pantalla por distancia a los marcadores. Verde propio y morado enemigo;
  regiones mixtas usan un borde de ambos colores con interior transparente.
- Botones persistentes avisan de los frentes ocultos y localizan la zona en el mapa. El brillo pulsa sin mover
  el botón, para facilitar su toque. No pausan las oleadas ni teletransportan recursos.
- La derrota muestra el mapa y la casa perdida con un rótulo breve; se retira de ese resultado la imagen de la
  gran fortaleza de la portada, que confundía el lugar perdido. Se conservan volver y exportar.

## Animación que se entrega para revisar

`zombi-base-piezas.png` es un recurso ilustrado propio de doce partes. `esqueleto-zombi.ts` coloca torso,
cabeza, hombros, codos, caderas, rodillas y zapatos con pivotes y solapes. Se usa en zombi normal, bandera,
cono, cubo y variantes de flotador. Cascos siguen la transformación de la cabeza; brazos, cabeza y casco
se desprenden mediante los eventos de daño existentes. El ciclo no modifica velocidad, daño ni colisiones.
Hay variaciones de color del abrigo; el vestuario anterior se conserva como recurso. El resto de unidades
mantiene su representación previa y requiere su propia adaptación después de revisar esta base.

La portada de guerra también usa el esqueleto cuando sus piezas han cargado. Antes de esa carga usa los
recursos disponibles. El atlas guarda las piezas por celda y las libera al salir. Las dieciocho colecciones
originales conservan su contrato; las piezas son un recurso auxiliar, como el retrato de Dave.
Las plantas mantienen su balanceo, respiración y retroceso; no se declara terminado todo su catálogo de poses.

## Fuentes facilitadas por Javier

Revisión, límites y plan de adaptación en [repositorios de referencia](pvz-referencias-motores-2026-10-23.md).
Se leyeron como referencia técnica, sin ejecutar scripts de terceros ni importar sus gráficos o DLL.

## Pruebas

- `scripts/probar-conquista-inicio.mjs`: fase inicial real, victoria con órdenes legales, instantánea a mitad de
  combate, conservación de la defensa, apertura posterior, rechazo de fase falsa y carga de V2 anteriores.
- `scripts/probar-pvz-principios-interfaz.mjs`: entrada a la casa, semilla/pala en mano, cancelación, baraja,
  croquis y avisos por toques reales, 1280×720 y 844×390. La escena final de articulación es preparada.
- `scripts/ayudas-pvz-navegador.mjs` termina la casa con un piloto legal para las regresiones posteriores al prólogo.
  No añade soles ni escribe partidas del usuario. Los escenarios anteriores del test de motor están identificados
  con el inicio anterior, y el prólogo nuevo tiene su prueba propia.
- Los recorridos de los cuarenta niveles ya construidos y del final territorial se mantienen como regresiones;
  no se han añadido mundos. El recorrido territorial de cierre usa el fixture sin incursiones estratégicas y
  no certifica la dificultad humana de toda la campaña.

Resultados, capturas y demostración de animación se generan en `juego/web/test-results/pvz/principios/`.
La granja continúa pausada y solo participa en las regresiones exigidas del repositorio.

### Resultado del cierre

Pasaron las cinco comprobaciones de motor del inicio nuevo, las ocho de interacción nueva, las trece de
historia y las siete de presentación/audio. La regresión de aventura completó los cuarenta niveles existentes
y sus controles, almanaque y guardados (55 comprobaciones); el perfil de amigos y la copia autónoma también
pasaron. Esta última se comprobó servida por HTTP: no se certifica su apertura nativa `file://` ni un teléfono.
Pasaron `probar:motores`, las 48 suites de `probar:granja`, `verificar:repo`, `build` y `build:amigos`;
el filtro de amigos revisó 610 archivos sin contenido de la pareja.
El recorrido integrado del build completo pasó sus seis controles en contexto aislado, sin errores de página
ni recursos fallidos, con dibujo por captura y calidad baja; no acredita rendimiento en dispositivos físicos.

Se preparó un vídeo de seis segundos, 1280×720 a 12 FPS, a partir de 72 capturas del navegador. Lleva el rótulo
«Muestra de animación»: usa un tablero preparado y daño provocado para observar pasos, congelación,
protecciones y desprendimientos. No representa una partida completa ni una medición de rendimiento.
