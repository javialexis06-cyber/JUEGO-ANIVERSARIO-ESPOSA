# Conectar los dos celulares (Supabase)

Nuestro Hogar guarda la casa, los personajes y lo que se mandan en **Supabase**, un servicio gratuito con base de datos
y tiempo real. Así, lo que hace uno le llega al otro al instante, de Medellín a Bucaramanga.

## Pasos (una sola vez, unos 10 minutos)

1. Entra a <https://supabase.com>, crea una cuenta gratis y toca **New project**.
   - Nombre: `nuestro-hogar`.
   - Región: **South America (São Paulo)**, la más cercana.
   - Pon una contraseña de base de datos y guárdala.
2. Cuando el proyecto esté listo, ve a **Authentication → Sign In / Providers** y activa **Allow anonymous sign-ins**.
   Cada celular entra con una sesión anónima; no hay que crear usuarios ni correos.
3. Ve a **SQL Editor → New query**, pega todo el contenido de [`supabase/esquema.sql`](../supabase/esquema.sql)
   y toca **Run**. Debe decir *Success*.
4. Ve a **Project Settings → API** (o **Data API / API Keys**) y copia:
   - **Project URL** (algo como `https://abcd1234.supabase.co`);
   - la clave **anon public** (o **publishable key**).
5. Mándame esos dos datos. Esa clave es pública por diseño: las reglas del esquema hacen que cada pareja solo pueda
   ver lo suyo. **No** me mandes la clave `service_role` ni la contraseña de la base de datos.
   (También se pueden escribir directo en la app: Menú → Ajustes → «Servidor para conectar los dos celulares».)

**Estado:** listo. El proyecto `nuestro-hogar` (São Paulo) ya tiene el esquema y los accesos anónimos, y su dirección y
clave publicable están en [`juego/web/src/casa/servidor.ts`](../juego/web/src/casa/servidor.ts): la APK ya entra en línea
sin escribir nada. Si algún día se cambia el esquema, hay que volver a correr `supabase/esquema.sql` completo (se puede
correr varias veces).

## Cómo se entra en la app (con contraseña)

- Al tocar **Soy Javier** o **Soy Laura** en un aparato nuevo, la app pide la **contraseña** de ese personaje. La de
  base es **TEAMO** (no distingue mayúsculas); cada uno la puede cambiar en Ajustes → Mi cuenta. Sin ella nadie entra
  como ellos: los amigos que tengan la app entran por «Soy un amigo / una amiga».
- Con la contraseña, el aparato entra directo a la casa de los dos (sin código) y **queda abierto para siempre**: no
  la vuelve a pedir (salvo que se borren los datos de la app o se cierre la sesión en Ajustes).
- La primera vez de todas (antes de que exista la cuenta), con TEAMO aparecen **Crear nuestra casa** (da un código de 6
  letras) y **Unirme** con ese código, como antes. Cada aparato que ya está en la casa le crea solo la cuenta a su
  personaje (usuario `javier` o `laura`, contraseña TEAMO).
- Un personaje con cuenta ya no se puede tomar con el código: solo con su contraseña. Cada uno puede tener varios
  aparatos abiertos (celular y computador) con el mismo progreso.
- El progreso de los minijuegos que se guardaba solo en el aparato (súper, Cien Puertas, victorias de la mesa,
  escenas compradas) ahora también va en la casa (`casa.progreso`), así que llega a cualquier aparato donde entren; la
  cocina, Lavarse la cara, el retrete y Sangre y Ceniza ya estaban en la casa.

## Qué se guarda

| Tabla | Para qué |
|---|---|
| `parejas` | El código y la casa compartida: monedas, inventario, decoración, notas en la nevera y fechas especiales |
| `miembros` | Qué sesión es Él y cuál es Ella |
| `personajes` | Necesidades (hambre, energía, higiene, cariño), qué está haciendo y en qué cuarto |
| `eventos` | Besos, abrazos, caricias, regalos y notas que uno le manda al otro |
| `recuerdos` | El álbum: fotos (en la carpeta privada `recuerdos`), títulos y fechas. Los mensajes de voz van en la misma carpeta (`<casa>/voces/`) |

## Cambios pendientes de la base (auditoría): `supabase/cambios-pendientes.sql`

La auditoría encontró puertas que la app nunca usa pero que alguien con la clave publicable podría usar mal. Para
cerrarlas, pega **todo** [`supabase/cambios-pendientes.sql`](../supabase/cambios-pendientes.sql) en
**SQL Editor → New query → Run** (después de `esquema.sql`; se puede correr varias veces):

| Qué cierra | Antes | Después |
|---|---|---|
| Funciones de la pareja | Cualquiera (hasta sin sesión) podía llamarlas | Solo celulares con sesión |
| Personajes | Ella podía reescribir el personaje de Él (y al revés) | Cada uno escribe solo el suyo; los dos ven los dos |
| Eventos (besos, regalos, notas…) | Se podían mandar a nombre del otro, reescribir o borrar | Solo a nombre propio; de los mandados solo cambia «visto» |
| Recuerdos | Se podían subir a nombre del otro | Solo a nombre propio |
| Adivinar el código de la casa | Sin límite | 20 códigos equivocados por hora y se bloquea un rato |
| Crear casas | Sin límite | Máximo 5 por celular |
| Tamaño | Sin límite | La casa guardada hasta 1 MB; fotos y audios hasta 5 MB |
| Eventos viejos | Se acumulaban para siempre | Los ya vistos de más de 30 días se borran solos |

Con estos cambios, un código que no existe vuelve vacío en vez de error: la app (desde esta versión) lo muestra igual
(«Ese código no existe»). Las pruebas están en `supabase/pruebas/probar_cambios.sql` (23 de 23 en Postgres 16) y las
28 de `probar_reglas.sql` siguen pasando.

**Ojo:** si algún día vuelves a correr `esquema.sql` completo, corre después otra vez `cambios-pendientes.sql`
(el esquema viejo vuelve a abrir la regla «personajes: todo» y las demás).

El mismo archivo trae además (secciones 9 y 10):

| Qué | Para qué |
|---|---|
| Cuentas (`cuentas`, `aparatos`, `crear_cuenta`, `entrar_cuenta`, `cambiar_contrasena`, `volver_a_casa`…) | La contraseña de Javier y de Laura y sus aparatos. La contraseña va cifrada (bcrypt) y nadie la puede leer. 10 contraseñas equivocadas por aparato en una hora (u 8 para un mismo usuario en 15 minutos) bloquean un rato |
| `latido()` | La consulta del «Latido de Supabase» (abajo) |

Pruebas: `supabase/pruebas/probar_cuentas.sql` (36 de 36). Mientras no se pegue, la app sigue funcionando como antes
(entra con el código y pide la contraseña TEAMO solo en el aparato).

## Que no se pause (latido)

Supabase gratis **pausa el proyecto si pasa 7 días sin uso** (la app deja de conectar y GitHub ni siquiera encuentra la
dirección). El trabajo **Latido de Supabase** de GitHub Actions (`.github/workflows/latido-supabase.yml`) le hace una
consulta pequeñita cada 3 días, así nunca se duerme. Se puede correr a mano en GitHub → Actions → «Latido de
Supabase» → Run workflow. Si alguna vez sale en rojo es que el proyecto quedó en pausa: entrar a supabase.com, abrir
`nuestro-hogar` y tocar **Restore project** (después de 90 días en pausa ya no se puede restaurar).
