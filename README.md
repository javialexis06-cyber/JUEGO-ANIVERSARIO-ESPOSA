# Nuestro Hogar

Casa virtual de pareja con juegos de mesa, aventuras, carreras y minijuegos. Una segunda compilación,
**Sala de Juegos**, reúne los juegos disponibles para amigos y excluye el contenido personal de la pareja.

El juego usa TypeScript, Vite y three.js. Se puede servir en navegador; los proyectos de Capacitor y Electron
contienen el empaquetado de Android y Windows. Los datos en línea usan Supabase.

## Empezar

Requiere Node.js 22 o posterior y npm.

```sh
cd juego/web
npm ci
npm run dev
```

Abrir la dirección que indique Vite. Para una casa local de prueba: `index.html?rol=el&local=1` o
`index.html?rol=ella&local=1`, siempre con un perfil aislado. [Páginas y opciones](juego/web/README.md).

## Comprobaciones

Desde `juego/web/`:

```sh
npm run verificar:repo  # Enlaces de documentos, JSON y temporales registrados
npm run probar:motores # Reglas, persistencia y regresiones de los juegos
npm run probar:granja  # Regresión existente del motor pausado
npm run build          # Tipos y compilación completa → dist/
npm run build:amigos   # Tipos, compilación y filtro de contenido → dist-amigos/
```

Las pruebas de interfaz están en `scripts/probar-*.mjs`. Sus cabeceras indican URL, navegador y escenarios.
Las compilaciones locales no generan por sí mismas una APK o un instalador Windows.

## Estructura

| Ruta | Contenido |
|---|---|
| [juego/web](juego/web/README.md) | Código, recursos públicos, pruebas y proyectos Android. |
| `juego/escritorio/` | Contenedor Electron y configuración del instalador. |
| [personajes](personajes/README.md) | Fuentes de Blender, exportadores y poses. |
| [docs](docs/README.md) | Guías de sistemas, registro de verificaciones, referencias e historia. |
| [supabase](supabase/README.md) | Esquema, cambios SQL y comprobaciones del servicio. |
| `archivo/renders/` | Referencias visuales ya guardadas. |
| `.github/workflows/` | Automatizaciones de compilación y regresión conservadas en el repositorio. |

## Estado y colaboración

[Pedidos vigentes](docs/pedidos.md) es la fuente de alcance; [CLAUDE.md](CLAUDE.md) reúne los contratos y la
forma de probar. La granja está pausada. Las voces clonadas y los diálogos hablados nuevos, las ampliaciones premium no realizadas y el contenido
futuro del sótano fueron descartados; los efectos, música y balbuceos no verbales del Jardín sí están autorizados. Los documentos históricos y diseños no autorizan nuevas tareas.

Conservar las partidas y no subir credenciales. La versión de amigos se verifica con su filtro propio.
[Resultados y límites de la revisión general](docs/en-obra/verificacion-general-2026-10-15.md) y
[cierre de mejoras y limpieza](docs/en-obra/mejoras-y-limpieza-2026-10-16.md).
[Ampliación del patio, El Escudo y Desaparecidos](docs/en-obra/ampliacion-patio-2026-10-16.md): contenido, pruebas y estado del servicio de clasificación.
