# PvZ · carriles, reanudación exacta y coordinador de defensas

Registro del núcleo del **22 de octubre de 2026, Bogotá** sobre el [seguimiento vigente](pvz-pendientes-2026-10-22.md).
El núcleo se probó sin DOM y en Canvas. En este primer avance aún no sustituía el mapa ni las salas V1.
La [integración posterior de historia](pvz-historia-integrada.md) conecta mapa y guardado V2; las salas y
la conversión explícita de V1 siguen pendientes. El resto de este registro describe ese primer avance.

## Contrato construido

- `DefNivel.tablero.filas` define los carriles físicos; `DefNivel.filas` selecciona los activos y
  `filasAgua` define el agua. El límite defensivo de validación es 32; las pruebas cubren 3, 4, 5, 6, 7 y 9.
  Siguen siendo nueve columnas de 80 unidades. Anchos, accesos y otras geometrías de B03 quedan pendientes.
- Los cuarenta niveles existentes omiten `tablero` y conservan la geometría y los valores anteriores.
  No se han modificado precios, costes, vida, daño, recargas, recompensas ni dificultad de esos niveles.
- `EscenaPvZ` comparte la proyección del campo con los toques, ajusta figuras a carriles estrechos y
  dibuja el agua bajo sus casillas. La casa y la calle conservan su perspectiva al cambiar las filas.
  Cambiar de instancia limpia los efectos y la selección visual del tablero anterior.
- `MotorPvZ.exportar()` produce una instantánea JSON de confianza del anfitrión. Incluye reglas y fichas,
  semilla aleatoria actual, siguiente ID, relojes privados, director, terreno, unidades y estados especiales.
  Captura viento/tormenta, contenido oculto de jarrones, sobres, etapas y Aplastazombis.
- `MotorPvZ.restaurar(dato, registros?)` valida y construye **otra instancia**. Rechaza versiones futuras,
  números no finitos, entidades duplicadas, carriles inválidos y reglas incompatibles. No corrige ni
  sobrescribe el archivo original. Agregar nuevas fichas al catálogo no invalida las existentes.
- Los eventos audiovisuales ya emitidos no se restauran: no se repiten sonidos al cargar. Los eventos de
  los pasos siguientes sí coinciden exactamente. La instantánea completa contiene secretos de jarrones;
  **no es el contrato público de red para el rival**.

## Coordinador `DefensasConquistaPvZ`

Está en `juego/web/src/jardin/conquista/defensas.ts`. Mantiene zonas con sus semillas y una instancia real
de `MotorPvZ` por defensa. No importa el motor simplificado ni decide propiedad, suministros o capturas.

- Un paso común avanza todos los tableros. Seleccionar una zona o el mapa no altera el reloj de los demás.
  La pausa es global y también rechaza órdenes. Al restaurar no se simula el tiempo que el juego estuvo cerrado.
- Cada defensa conserva soles, recargas, entidades, oleadas y cortacéspedes propios. Los niveles normales
  usan sus datos reales; las cintas y minijuegos se mantienen fuera de este contrato territorial.
- La reserva corresponde al **tipo canónico completo**. Una asignación se acepta entera o se rechaza
  sin cambios. Las revisiones permiten rechazar órdenes basadas en un estado antiguo del anfitrión.
- La reserva no se libera al morir un ejemplar. Los tipos solo pueden trasladarse entre zonas sin partida;
  no se puede reiniciar o cambiar un equipo activo para borrar daño o duplicar sus plantas.
- El contrato admite identidades compartidas entre ediciones. La prueba usa una ficha ficticia identificada
  como fixture; no añade un catálogo nuevo ni recetas de Fusión. Al restaurar, el llamador proporciona el
  registro canónico vigente: el archivo importado no puede inventar identidades para duplicar un tipo.
- La instantánea del coordinador restaura reservas y tableros juntos y rechaza contradicciones.
  **Esto no implementa todavía la exclusión entre pestañas o clientes reales:** requiere conectar la autoridad
  de salas y el guardado nuevo antes de habilitarlo en el mapa.

## Comprobaciones reproducibles

Desde `juego/web/`:

```sh
node scripts/probar-pvz-instancias.mjs
CHROME_PATH=/usr/bin/chromium node scripts/probar-pvz-carriles-interfaz.mjs http://127.0.0.1:4196/
```

La segunda orden necesita Vite sirviendo el código fuente. Sus muestras preparadas usan recursos existentes
y recursos iniciales de prueba; no representan nuevos niveles publicados ni acreditan su balance.

- Nueve grupos de comprobaciones: carriles, agua/capas, errores, instantáneas, estados, datos corruptos,
  reservas, alias y seis defensas simultáneas. Estas últimas terminan con resultados idénticos después de
  guardar/cargar y rotar la vista; no afirman ser seis defensas ganables sin intervención.
- Cuarenta partidas completas con piloto legal, semilla 23 y **1.258 reconstrucciones** desde JSON.
  Coinciden estados, azar, tiempos, resultados y eventos posteriores. Incluye bolos, Aplastazombis,
  Rompejarrones, piscina y tormenta. No acredita todas las semillas ni combinaciones.
- Toques reales a 1280 × 720 y 844 × 390 en 3/4/5/6/7/9 carriles: extremos del campo, costes,
  recarga, límites y reanudación. Capturas de siete carriles y agua discontinua.
- Evidencia local regenerable: `test-results/pvz/instancias/resultado.json` y
  `test-results/pvz/carriles-interfaz/`. No se guardan perfiles ni partidas de usuarios en el repositorio.

El cierre pasó `npm run verificar:repo`, `npm run probar:motores`, las 48 suites de `npm run probar:granja`,
`npm run build` y `npm run build:amigos`. La revisión de amigos comprobó 603 archivos. El recorrido Canvas
completó los 40 niveles y sus premios/recargas, sin errores de página o recursos; conservó los guardados
clásicos y el aislamiento de amigos. El recorrido de integración del build pasó sus seis comprobaciones,
sin errores, con perfil ligero y dibujo por captura. Esto no certifica rendimiento de teléfonos físicos.

El catálogo y el arte no han aumentado en este avance. Siguen pendientes las tareas de PvZ 2/Fusión y el resto de PvZ 1.

## Siguiente integración necesaria

Conectar el coordinador al mapa con navegación mundo → país → ciudad → zona y selector de reservas.
Diseñar el guardado territorial versionado y la migración explícita de V1, que contiene grupos repetidos;
conservar su archivo original. Resolver la persistencia entre incursiones y los traslados al cerrar/perder
una defensa, y después adaptar la autoridad y las instantáneas de salas. No activar una mezcla de ambos
motores ni convertir automáticamente las viejas formaciones en reservas contradictorias.
