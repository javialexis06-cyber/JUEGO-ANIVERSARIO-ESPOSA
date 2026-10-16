# Fuentes de Supabase

Esta carpeta conserva el esquema, cambios SQL y herramientas del servicio en línea.
La guía de tablas, perfiles y sincronización está en [docs/sistemas/supabase.md](../docs/sistemas/supabase.md).

- `esquema.sql`: definición base.
- `cambios-pendientes.sql`: cambios conservados para despliegue manual; su presencia no acredita que estén aplicados.
- Las demás comprobaciones y herramientas describen su uso en sus propias cabeceras.

La aplicación/confirmación del SQL y la validación del servicio real fueron descartadas como tareas del cierre
del 16 de octubre. No ejecutarlas por encontrar este archivo; consultar primero [pedidos vigentes](../docs/pedidos.md).
Las pruebas con transporte o servidor simulado no certifican el despliegue.

La app utiliza únicamente URL y clave publicable. No guardar credenciales privadas en este repositorio.
