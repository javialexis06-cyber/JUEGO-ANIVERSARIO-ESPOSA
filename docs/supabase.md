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
