# Plan para el primer jugable

## Qué ya está listo
- **Diseño completo:**
  - mecánicas en [`mecanicas.md`](mecanicas.md);
  - los 100 niveles en [`niveles.md`](niveles.md) y `juego/datos/niveles.json`;
  - logros en [`logros.md`](logros.md) y `juego/datos/logros.json`;
  - progresión y tiendas en [`diseno-juego.md`](diseno-juego.md).
- **Modelos en Blender** (todos se generan por código, en `personajes/blender/`):
  - Él y Ella, con esqueleto y poses de prueba;
  - 15 clientes y ayudantes;
  - 32 productos y 9 cajas;
  - 10 tipos de vitrina en 3 niveles, con llenado controlable para mostrar el stock;
  - utilería, máquinas e íconos;
  - las 4 tiendas en estado inicial y completo.

## Renders que faltan
1. **En cola ahora:**
   - hipermercado completo;
   - las 4 tiendas «así empieza» con los clientes bien ubicados;
   - tiendita y minimercado completos corregidos.
2. **Íconos nuevos:**
   - Luna 🌙;
   - medallas de bronce, plata y oro;
   - corazón escondido;
   - figuritas de clientes;
   - caja dorada y vitrina dorada (Leyendas).
3. **Estados de cocina:**
   - wafle y arepa crudos, listos y quemados (con humo);
   - indicador de tiempo en waflera, plancha y máquinas.
4. **Animaciones**, que se hacen sobre el esqueleto ya creado:
   - **Él y Ella:** caminar, caminar con carrito, reponer, cobrar, trapear, cocinar y celebrar.
   - **Clientes:** caminar, tomar producto, esperar, enojarse, pagar e irse.
   - **Especiales:** ladrón corriendo y niño llorando.
5. **Maquetas de pantallas:**
   - menú (solitario o pareja);
   - mapa de los 100 niveles;
   - tarjeta del nivel con los 3 objetivos y la Luna;
   - HUD durante el juego;
   - resultados con estrellas;
   - tienda de mejoras;
   - vitrina de trofeos y álbum.

## Qué hace falta para jugarlo en el celular

### 1. Decidir el motor (única decisión pendiente)
| Opción | Ventajas | Desventajas |
|---|---|---|
| **Web (Three.js) primero, APK después con Capacitor** | Lo puedo construir y probar aquí mismo, jugando partidas automáticas en un navegador. Se juega abriendo un **enlace en el celular**, sin instalar nada. El cooperativo en línea con Supabase funciona igual. El APK sale envolviendo la misma web | Si el resto de la app de aniversario es Godot, habría que integrarlo como pantalla web o portarlo |
| **Godot 4 desde el inicio** | Exporta APK directo y encaja si la app principal es Godot | Más lento de iterar aquí: para probar cada versión hay que instalar el APK |

**Recomendación:** hacer el primer jugable en **web**, para probar y ajustar rápido desde el celular. Cuando las reglas estén bien, se empaqueta como APK o se porta al motor de la app principal.

### 2. Pasar los modelos al juego (Blender → GLB)
- Aplicar modificadores, reducir polígonos y **hornear los materiales** (fieltro, tejido, pelusa) a texturas.
- Separar los productos de cada vitrina como piezas que el juego **prende y apaga** según el stock.
- Exportar a Él, a Ella y a los clientes con esqueleto y animaciones.

### 3. Programar los sistemas mínimos
1. Plano de la tienda con caminos, es decir, por dónde se puede caminar.
2. **Fila de acciones** con toques.
3. **Vitrinas con stock**: estados, barra y avisos «!».
4. **Bodega y carrito**: reponer.
5. **Clientes**: llegar, lista, buscar, tomar, esperar con paciencia, caja, pagar e irse.
6. **Caja**: cobrar, monedas y propinas.
7. **Reloj del día, metas y 3 estrellas**, leyendo `niveles.json`.
8. HUD mínimo y guardado local.

## Entregas propuestas
| Entrega | Qué trae | Para probar |
|---|---|---|
| **Jugable 1** | Tiendita, niveles 1 a 5, en solitario con Él. Tiene 4 vitrinas, caja y bodega; 3 tipos de cliente; basura; 3 estrellas; comprar un sitio y mejorar una vitrina | ¿Se siente como Supermarket Mania? ¿El ritmo, los avisos y la dificultad están bien? |
| **Jugable 2** | Ella jugable, cooperativo en línea (Supabase), combos y selector de modo | Jugar en pareja entre Medellín y Bucaramanga |
| **Jugable 3** | Las 4 tiendas, zonas especiales, problemas, ayudantes y los 100 niveles | Balance de la progresión |
| **Jugable 4** | Modo legendario, logros, coleccionables, álbum y APK | Versión completa para el aniversario |

Después de cada entrega ustedes prueban y dicen qué cambiar. Los números de balance se ajustan en un solo lugar: `generar_niveles.py`.
