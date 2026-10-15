# Verificación general de los juegos · 15 de octubre de 2026

## Encargo y alcance

Javier pidió limpiar las notas antiguas, actualizar el repositorio, terminar la comprobación de los juegos y
corregir los fallos funcionales. La granja está pausada. Se descartan las ampliaciones no realizadas de escenas
premium y el contenido futuro del sótano; lo ya programado y los guardados se conservan.

Dificultad, balance, precios, costes y recompensas requieren aprobación previa. No se añaden nuevos modos o
expansiones para cerrar esta comprobación. Las ampliaciones sugeridas antes no son fallos de los modos existentes.

## Registro de esta tanda

- Punto de partida: `03734a85`, publicado en las dos ramas autorizadas.
- Limpieza: cola antigua archivada, instrucciones y prioridades actuales unificadas; corregidas notas obsoletas de
  música del Show, tarjeta de Carreras y compilación de amigos. Propuestas descartadas retiradas de la cola.
- Regresión inicial `npm run probar:motores`: pasa; incluye mesa, Show, Cocina, Escudo, Astra, Carreras, Torneo,
  Retrete, Sangre y Lavado. No sustituye los recorridos de interfaz ni la adquisición ordinaria de contenido.
- Estado: comprobación de navegador y ampliación de la cobertura en curso. Los siguientes puntos son objetivos
  de verificación, no afirmaciones de funciones inexistentes.

## Recorridos por cerrar o ampliar

| Familia | Comprobación de esta tanda |
|---|---|
| Casa | Ciclo de cuidado, compras pagadas, habitaciones, trofeos, persistencia y dos perfiles |
| Súper Manía | Campaña y mejoras obtenidas jugando; días avanzados, pérdida/reintento, recarga y pareja |
| Cien Puertas | Cien puertas, narrativa, retorno, progreso y pareja; sensores solo simulados |
| Dados Party | Partida, botones, pausa, persistencia y dos jugadores |
| Mancala | Partida, movimientos táctiles y dos jugadores |
| Puntos y Cajas | Partida, controles y dos jugadores |
| Parchís | Partida, dado, fichas, pausa y dos jugadores |
| Parchís a dos colores | Partida, dos dados, fichas y dos jugadores |
| Clue | Partida, cuaderno, cartas privadas, acusación y dos jugadores |
| Show | Conservar el cierre recién comprobado; repetir solo si cambia código relacionado |
| Lavado | Desbloqueos y compras ordinarias, escenarios/modos, cierre, guardado y sala |
| Sangre y Ceniza | Clases, biomas y peligros, mejoras pagadas, expedición, derrota, guardado y sala |
| Cocina | Wafles, fresas y frappés: progresión, derrota, compras, pausa y pareja |
| Retrete | Acceso desde baño, vuelos/ciclos, compras, pérdida, guardado y sala |
| Escudo | Conservar seis niveles y P23 verificados; ampliar derrota/salida y retorno de amigos |
| Carreras | Conservar 16 pistas/copas/desafíos recién comprobados; ampliar mandos o recuperación si hace falta |
| Desaparecidos | Conservar ocho casos y notas recién comprobados; la deducción humana sigue requiriendo jugadores |
| Torneo | Otros luchadores, escenarios, dos jugadores y sala; el arcade actual se completa en una sesión |

La evidencia anterior sigue en [auditoría de motores](auditoria-motores.md). Se reutiliza la cobertura vigente
cuando no cambia el sistema; un caso nuevo, fallo o corrección justifica repetir las comprobaciones relacionadas.

## Límites externos

- GitHub Actions está desactivado para la cuenta: comprobar el workflow al publicar y registrar su respuesta.
- El despliegue de SQL de Supabase no se considera confirmado por pruebas locales ni se modifica sin credenciales
  y autorización aplicables. Las pruebas de red con transporte local o servidor simulado se etiquetan como tales.
- No hay teléfonos físicos disponibles: no certificar FPS, batería, memoria, sensores ni internet real entre ellos.
- La granja solo participa en regresiones e integración existentes; no se retoma su desarrollo.
