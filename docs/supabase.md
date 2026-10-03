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

## Cómo se emparejan en la app

- Uno abre la app, elige **Soy Él** o **Soy Ella** y toca **Crear nuestra casa**: aparece un código de 6 letras.
- El otro elige su personaje, toca **Unirme** y escribe el código.
- Si se reinstala la app o se cambia de celular, se vuelve a entrar con el mismo código.

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
