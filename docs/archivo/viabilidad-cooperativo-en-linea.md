# Viabilidad: jugar en pareja desde Medellín y Bucaramanga, como APK

## Respuesta corta
**Sí es viable.** Un juego de gestión de tiempo como Supermarket Mania no necesita la reacción al milisegundo de un juego de disparos:
- Cada toque encola una tarea, así que un retraso de 100 a 200 ms casi no se nota.
- Entre dos ciudades de Colombia, la latencia real suele estar entre **30 y 120 ms** según la red (fibra, 4G o datos móviles).
- Si la conexión pasa por un servidor en otro país, puede llegar a unos 150 ms, y sigue siendo aceptable.

## Cómo se conectan los dos teléfonos
```
Teléfono A (anfitrión)  ── simula la tienda (clientes, estantes, dinero)
        ▲    │ estado resumido 10–15 veces por segundo
        │    ▼
   Servidor de relevo (en internet)  ── solo reenvía mensajes; también guarda el progreso
        ▲    │
        │    ▼
Teléfono B (invitado)   ── envía sus toques ("reponer estante 3") y dibuja lo que manda A
```
- **Anfitrión con autoridad**:
  - Un teléfono calcula todo el día de juego y el otro solo envía órdenes y recibe el estado. Así nunca hay dos versiones distintas de la tienda.
  - Si el anfitrión se desconecta, el juego se pausa y el invitado puede retomar desde el último estado guardado.
- **Por qué un servidor de relevo y no conexión directa**:
  - Los operadores móviles en Colombia suelen usar NAT compartido (CGNAT), que bloquea muchas conexiones directas entre teléfonos.
  - Si los dos se conectan hacia un servidor, siempre funciona.
- **Consumo de datos**: unos 2 a 5 KB por segundo, es decir, 10 a 20 MB por hora de juego.

## Opciones de servidor (de más simple a más completa)
| Opción | Qué es | Costo aprox. | Comentario |
|---|---|---|---|
| **Supabase Realtime** (canales de difusión) + base de datos | Servicio en la nube con tiempo real y base de datos | Gratis para 2 personas | No hay que mantener un servidor. Sirve también para sincronizar el resto de la app (usuarios, progreso, inventario). |
| **Relevo WebSocket propio** (Node.js o Godot sin pantalla) | Programa pequeño que reenvía mensajes | USD 0–5 al mes (Fly.io, Railway, un VPS) | Control total y latencia baja; hay que mantenerlo. |
| **Nakama** (código abierto, para juegos) | Servidor de juegos con salas, cuentas y guardado | USD 5–10 al mes autoalojado | El más completo. Tiene cliente oficial para Godot y es ideal si la app crece. |

**Recomendación**: empezar con **Supabase**:
- no hay servidor que mantener,
- la misma cuenta guarda el progreso y sincroniza el resto de la app de pareja,
- los mensajes del juego (toques y estados) son pocos y caben en los canales de tiempo real.

Si más adelante se necesita más control, se migra a Nakama sin cambiar la lógica del juego.

## APK para Android
- El resto de la app va a **Godot 4**, así que lo natural es hacer el minijuego también en Godot. Godot exporta **APK/AAB** directamente, con el SDK de Android y Java instalados.
- Instalación entre ustedes dos:
  - APK directo (activando «instalar apps de origen desconocido»), o
  - pruebas internas de Google Play, que no requieren publicarla.
- **Preparar los modelos para el celular**:
  - Las versiones de render tienen mucho detalle; para el juego se exportan versiones livianas, de 15 000 a 30 000 triángulos por personaje (el decimado ya está en el código).
  - La pelusa y los tejidos, que hoy son procedurales en Blender, se hornean en texturas y mapas de normales.
  - El objetivo son **60 cuadros por segundo** en un celular de gama media con el renderizador *Mobile* de Godot.
- Mientras se desarrolla, el mismo proyecto se puede exportar a **web** para probar desde el navegador.

## Riesgos y cómo manejarlos
- **Android suspende la app en segundo plano**: el juego se pausa automáticamente y se reconecta al volver.
- **Señal débil**: la simulación en el anfitrión tolera cortes cortos. El invitado ve «reconectando…» y no se pierde el día.
- **Los dos deben estar en línea al tiempo**: se puede ofrecer también un modo de un jugador que controla a Él y a Ella a la vez, para jugar sola o solo.

## Plan por fases
1. ✅ **Prototipo de un jugador** (Godot o web): mecánicas completas del día con Él y Ella.
2. ✅ **Sincronización del anfitrión** (probada con dos pestañas por `BroadcastChannel`, `super.html?linea=local&rol=el|ella`).
3. ✅ **Cooperativo por internet**: relevo con Supabase y reconexión.
4. **APK y prueba real** entre Medellín y Bucaramanga: medir latencia y ajustar la frecuencia de envío.

**Estado (Súper Manía):** el cooperativo en línea ya está en el juego con el anfitrión que simula y manda una foto
cada 100 ms, el invitado como espejo con su personaje predicho al instante, invitación por el canal o por la casa,
pausa compartida y pausa automática si se corta la conexión. Detalles en `mecanicas.md` → «Pareja en línea». Falta
la fase 4: probarlo entre Medellín y Bucaramanga con datos móviles y ajustar la frecuencia de fotos si hace falta.
