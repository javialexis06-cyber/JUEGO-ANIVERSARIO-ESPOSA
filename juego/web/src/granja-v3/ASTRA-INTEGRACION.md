# Astra: base del motor y entrega para arte, voces y música

La entrega posterior de campaña está en [HISTORIA-INTEGRACION.md](HISTORIA-INTEGRACION.md).
Incorpora los planos y voces recientes de Claude, 178 residentes y 93 domicilios, sus encargos de
pueblos y el diario de 36 contratos principales con 110 objetivos. Las cifras y ubicaciones de la
base descrita más abajo son históricas: consultar los planos y el contrato vigente para producción.
El motor completo sigue en desarrollo; los siete bloques autorizados se comprueban por separado.

Actualización: 11 de octubre de 2026. Fuente activa: esta carpeta. Se conserva el guardado V5; `astra`
es un bloque aditivo versionado, sin sustituir inventario, calendario, relaciones anteriores ni genomas.

## Qué ya puede integrar Claude

| Contenido | Estado real |
|---|---|
| Geografía | 28 lugares recorribles: los 19 asentamientos del reparto y nueve lugares de tránsito, extracción o Confluencia. |
| Conexiones | 27 rutas bidireccionales. Proximidad obligatoria, llegada definida, requisitos de expediente y construcciones; regreso sin volver a exigir el expediente. |
| Habitantes | 142 identidades: los 24 vecinos originales conservan su sistema; 118 residentes nuevos tienen región, oficio, domicilio, conversación, descanso semanal y vínculo diario guardado. |
| Viviendas | 76 domicilios. Se conservan las 17 viviendas originales; 59 interiores nuevos reutilizan el kit existente, con entrada física, colisiones, horario de visitas y retorno. |
| Recursos | 24 territorios, con mineral, madera, semilla y observación de fauna por territorio. Cupos de seis minerales, ocho maderas y una semilla por ciclo. |
| Cultivo | 24 cultivos regionales adicionales, manteniendo los 63 anteriores. Cada cosecha regional produce una unidad y devuelve una semilla. Crecen al dormir y necesitan cuidados reales. |
| Fabricación | 72 recetas regionales: 24 de cuatro flechas, 24 de una ración y 24 kits de mantenimiento. Usan materiales de su propia región. |
| Mantenimiento | Un kit activo. Dos minerales, dos maderas y una cosecha; se fabrica en el banco y se instala en el archivo local. Durante ocho estancias recoger cuesta una energía en esa región; no aumenta cupos ni combate. Sustituirlo consume el nuevo kit. |
| Combate | Se conserva el motor de espada, arco, bastón y cuatro sellos. Se añaden cuatro destinos elementales de práctica: 14 destinos en total. Los NPC y la fauna observada no son enemigos. |
| Conversaciones | 284 guiones personales; los 142 recuerdos iniciales se pueden escuchar con presencia y subtítulos. Los 142 posteriores requieren su misión personal todavía pendiente. Lectura completa y persona conocida son registros distintos. |
| Campaña | 36 **expedientes de investigación**, con grafo P/F, escenas, testimonios, lecturas públicas, decisiones de acta y objetivos reales donde hay soporte. **No equivalen a las 36 misiones definitivas completas.** |
| Sangre y Ceniza | Los objetivos de puerta consultan, sin escribir, `sangre-progreso-el/ella`: puerta terminada y rescate real cuando corresponde. No transfieren inventario ni conceden victorias por diálogo. |
| Cinemática | 14 guiones reproducibles mediante el jugador de escenas, tras cerrar su expediente. Subtítulos, actor, línea, dirección de voz y claves musicales están definidos; las animaciones cinematográficas están por producir. |
| Audio | 2.750 líneas con ID y huella de texto; 152 guiones de voz y 23 briefs musicales. El manifiesto de medios está vacío: no hay tomas nuevas generadas ni consumo de ElevenLabs. |

Los cuatro lugares de conexión sin banco propio ofrecen rutas, archivo o habitantes; no se les inventa
un yacimiento adicional. Los puestos espaciales son áreas seguras. El oxígeno de las expediciones espaciales
sigue usando su motor existente. Las semillas de Astra y Confluencia requieren un invernadero protegido;
no se simula una huerta expuesta al vacío. Los cultivos usan por ahora formas visuales existentes.

## Encontrarlo dentro del juego

Abre el menú del HUD y selecciona la pestaña **Astra**. Muestra rutas, viviendas, habitantes, recursos y expedientes del lugar actual.
Los botones ejecutan acciones del motor: abrir la pestaña desde lejos no permite cruzar puertas,
hablar, recoger recursos ni entrar en viviendas. El Diario anterior permanece disponible.

Desde el Pueblo del Sol se camina al acceso **108, 29**, hacia el Cruce del Valle. De allí salen
Puerto de los Lirios, Brumaverde y Piedralumbre. Sus caminos continúan hacia Brasaviva, Nieveclara y Vigilia.
Verdia, Senda, Nox y la estación se alcanzan desde los portales o la nave **fabricados y colocados** en la granja.
Los requisitos se muestran al intentar cruzar; Confluencia abre tras el expediente F06.

En las regiones nuevas el archivo público está en **0, 22**; el acceso de combate, en **18, 23**.
Las casas indican su entrada en la pestaña. Las visitas son de 08:00 a 21:00; los dormitorios privados
nuevos todavía no se implementan. Los residentes descansan un día semanal y pueden estar en casa
antes de las 10:00 o después de las 18:00 de ese día. En los demás días trabajan de 08:00 a 17:00,
pasean hasta las 21:00 y se retiran a dormir. Sus cambios de posición todavía no tienen trayectos animados.

La primera conversación registra a la persona. Escuchar el primer recuerdo abre sus memorias extensas;
el recuerdo posterior se reserva hasta completar su misión personal. La pestaña muestra también vida cotidiana, postura ante Fuatia y vínculos.
La wiki conserva la biografía completa, incluidas las relaciones que tienen spoilers.

## Archivos y límites de responsabilidad

- `astra.ts`: acciones, estado, puertas, presencia, expedientes, cupos y validación. No añadir economía en el render.
- `astra-render.ts`: escenario provisional y sustitución de modelos; reutiliza los kits de Blender ya existentes.
- `astra-ui.ts`: subtítulos, biografías, rutas y objetivos. La autoría grande se carga como módulo separado.
- `astra-medios.ts`: voz, música, validación de rutas, huella de texto, reducción del fondo y pausa al ocultar la app.
- `astra-*-datos.ts`: salidas generadas. La autoría se edita en `docs/narrativa/datos/` y `audio/`.
- `public/granja/astra/produccion.json`: catálogo completo para producción, con biografías, figuras,
  regiones, viviendas, recursos, rutas, misiones, guiones, direcciones y claves de música.
- `public/granja/astra/medios.json`: **editar aquí** las asociaciones de archivos producidos. El generador conserva este archivo.

Regenerar desde la raíz, con dependencias de `juego/web` instaladas:

```sh
python3 docs/narrativa/herramientas/integrar_motor.py
```

El generador lee las huellas y los horarios del primer pueblo desde sus módulos existentes.
No desplazar sus casas ni cambiar los IDs de personajes, objetos, expedientes o voces.

## Incorporar una voz o una pista musical

Ejemplo de estructura; estos nombres ilustrativos no se declaran en el manifiesto hasta producir los archivos:

```json
{
  "version": 1,
  "voces": {
    "C01.L001": {
      "archivo": "./audio/astra/C01.L001.ogg",
      "huella_texto": "copiar-la-huella-real-del-catalogo"
    }
  },
  "musica": { "M01": "./audio/astra/M01.ogg" },
  "modelos": {}
}
```

Copiar la huella hexadecimal real de 16 caracteres de `produccion.json`. Si cambia el texto, una toma con
huella anterior no se reproduce. El jugador muestra subtítulos aunque falte audio; no solicita una ruta
de voz inventada. Se activa tras una interacción. La música baja durante voz y la app pausa al ocultarse.
No pegar claves de ElevenLabs en archivos ni iniciar generación pagada desde el navegador.

M01–M22 conservan sus briefs; M23 corresponde a Confluencia. C01–C14 tienen asociación musical explícita.
Las escenas normales usan el ambiente de su localidad. Producir primero una escena de prueba y revisar
volumen, pronunciación y ritmo antes de grabar todo el reparto.

## Incorporar modelos y animaciones

Claves admitidas en `modelos`:

- `region:<id>`: terreno del escenario nuevo, origen local 0, 0; las casas, puertas, habitantes y recursos mantienen sus anclajes.
- `vivienda:<id>`: edificio exterior centrado en su huella; los nuevos tienen 8 × 6 y fachada hacia la entrada.
- `recurso:<id>`: pieza del depósito o punto de observación, sobre la posición de ese recurso.
- `npc:<id>`: cuerpo del residente nuevo; el motor controla posición, visibilidad e interacción.
- `figura:figura_fuatia`: aparición de Fuatia en el refugio de Confluencia, posición 0, 20. No se agrega al roster social ni se convierte en ganado o enemiga.

```json
"npc:lirios_bastian": { "archivo": "./modelos/astra/bastian.glb", "escala": 1 }
```

Usar archivos GLB reales y rutas relativas bajo `modelos/`. Se admiten escala positiva hasta 10 y clips
`reposo` y `hablar`. El actor del subtítulo activa `hablar` cuando exista el clip; sin él conserva reposo.
Los modelos se clonan compartiendo sus recursos; una carga que termina después de salir del escenario
no añade edificios al mapa nuevo. El kit provisional permanece si una sustitución falla.

Los **24 residentes y las 17 casas originales** conservan las rutas de arte de `vecinos3d.ts` y `pueblo.ts`;
su renovación se hace allí. Los interiores usan `cuartos.ts`. El catálogo de producción incluye todas
las identidades para nombrar y coordinar los recursos, pero no todas las figuras tienen aparición 3D.
La cinematografía puede consultar `estado.astra.escena.id/linea` y la línea activa sin cambiar sus efectos.
La cámara, los gestos adicionales, los escenarios de las cinematográficas y las voces siguen a cargo del frente visual.

## Qué falta para terminar el motor

Claude puede comenzar el arte y el audio con esta base. **El motor completo todavía no está terminado.**
Pendientes principales, ordenados para evitar grabar escenas que luego requieran cambios mecánicos:

1. **Campaña integrada:** 36 historias con 110 objetivos verificables, reintentos y guardado.
   El cierre técnico de F12 está disponible; la alternativa de jefe propio pertenece al bloque regional.
2. **Historias adicionales integradas:** 181 contratos con 617 objetivos, recuerdos posteriores,
   pistas físicas y decisiones. Las consecuencias de las 98 relaciones se conectan en el bloque social.
3. **Premios integrados:** 217 utilidades únicas con consultas, agendas, planos, depósitos,
   accesos, trampas selectivas, exposición y técnicas acotadas. Ver `PREMIOS-INTEGRACION.md`.
4. **Vida social integrada para los 154 residentes adicionales:** navegación real entre rutina y hogar,
   agenda por estación/clima, regalos, preferencias, comercios y revisión de las 98 relaciones.
   Los 24 vecinos originales conservan su sistema; el reparto actual suma 178 personas.
5. Dar identidad mecánica a cada región: actividades distintas, jefes elementales propios, circuitos
   y retornos, depósitos especiales, soporte y fauna criable donde el canon lo permita.
6. Completar pesca con tesoros y trampas generales, museo, redes de automatización y logística,
   obras comunitarias y variedad regional de encargos y colecciones.
7. Recorrer la campaña desde una partida nueva con medios ordinarios, balancear economía y combate,
   verificar accesos sin herramientas de prueba y medir memoria y tiempos en teléfonos reales.

No cambiar el nacimiento de Fuatia, su neutralidad ni su límite de equilibrio para justificar el combate.
Verdia no requiere combate contra sus habitantes; Senda conserva las tres almas y su consentimiento;
Nox es un perímetro de contención. Las cuatro arenas elementales actuales son espacios de práctica,
no jefes finales ni pruebas de que la historia esté concluida.

## Verificación y revisión del arte

Resultados y límites de esta entrega: [ASTRA-VERIFICACION.json](ASTRA-VERIFICACION.json).

```sh
cd juego/web
npm run probar:granja
npm run build
npm run build:amigos
node scripts/granja-v3/verificar-medios-astra.mjs
CHROME_PATH=/usr/bin/chromium node scripts/granja-v3/verificar-demo.mjs http://127.0.0.1:4192/ /tmp/granja-demo
node scripts/granja-v3/verificar-astra.mjs http://127.0.0.1:4192/ /tmp/astra-navegador.json
```

Servir el build completo antes de las dos pruebas de navegador. Usan perfiles nuevos, posiciones y permisos
preparados para revisar recorridos; no modifican las partidas del jugador ni certifican una campaña terminada.
El verificador de medios permite un manifiesto vacío, pero rechaza archivos declarados inexistentes,
modelos sin anclaje, pistas desconocidas y tomas cuyo texto cambió.
El recorrido adicional de Astra pausa el dibujo WebGL en su perfil de Chromium por software; en este
contenedor el recorrido con dibujo del primer pueblo agotó el tiempo de espera. Comprueba controles, simulación, carga y grafos de escena;
no certifica el dibujo de las regiones. El recorrido general casa/granja mantiene el render real.
Esta configuración solo pertenece a la prueba y no cambia la calidad del juego. En una máquina con GPU,
usar `ASTRA_RENDER_REAL=1` para repetir el recorrido con dibujo y revisar los modelos nuevos.

Las pruebas del motor ahora comparten un grafo ESM por suite, sin URI base64 anidadas que duplicaban
los catálogos. Se conservan las comprobaciones de los módulos anteriores.
