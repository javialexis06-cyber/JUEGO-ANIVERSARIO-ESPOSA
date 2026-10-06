# Nuestro Hogar · el juego (web, Android y computador)

Vite + TypeScript + three.js, empacado con Capacitor (Android) y Electron (`../escritorio/`). Las reglas de trabajo,
cómo se prueba y las trampas conocidas están en el [`CLAUDE.md`](../../CLAUDE.md) de la raíz; cómo funciona cada parte, en
[`docs/sistemas/`](../../docs/sistemas/).

## Páginas

| Página | Código | Qué es |
|---|---|---|
| `index.html` | `src/casa/` | La casa (el juego principal). Con un perfil de amigo, manda a `amigos.html`. |
| `super.html` | `src/*.ts` | Súper Manía (en pareja, en sala de hasta 4 o con amigos). |
| `puertas.html` | `src/puertas/` | Cien Puertas. |
| `mesa.html` | `src/mesa/` | Juegos de mesa (Dados, Mancala, Puntos y Cajas, Parchís). |
| `sangre.html` | `src/sangre/` | Sangre y Ceniza. |
| `amigos.html` | `src/amigos/` | La sala de juegos de los amigos (creador de personajes y salas). |
| `retrete.html`, `cocina.html` | `src/sueltos/` | El retrete espacial y la cocina sin la casa (para amigos). |

## Comandos

```bash
npm ci
npm run dev              # http://localhost:5173 y las demás páginas
npx tsc --noEmit -p .    # tipos
npx vite build           # versión de la pareja → dist/
npm run build:amigos     # versión para amigos («Sala de Juegos») → dist-amigos/, revisada con verificar-amigos.mjs
npm run optimizar        # modelos de modelos-crudos/ → public/modelos/
```

Las pruebas con Playwright están en `scripts/probar-*.mjs` (cada una dice arriba cómo se usa).

## Versiones que se publican

GitHub Actions (`.github/workflows/apk.yml`) compila en cada cambio de `juego/web/` y publica en Releases:
`NuestroHogar.apk` y `NuestroHogar.exe` (la pareja) y `NuestroHogar-Amigos.apk` y `NuestroHogar-Amigos.exe` (amigos,
con `android-amigos/` y `../escritorio/build-amigos/`). La más reciente siempre está en
`https://github.com/javialexis06-cyber/juego-aniversario-esposa/releases/latest/download/<archivo>`.

- La app va en horizontal, a pantalla completa y sin apagar la pantalla.
- El servidor (Supabase) va en `src/casa/servidor.ts` o en las variables del repositorio `SUPABASE_URL` y
  `SUPABASE_ANON_KEY`.
- Se firma con la clave de depuración de Android (`android/app/debug.keystore`, pública por diseño) para que cada
  versión se instale encima de la anterior sin perder el progreso.
- A mano (con Android SDK): `npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`.
