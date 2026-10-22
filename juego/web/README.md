# Aplicación web, Android y escritorio

Vite + TypeScript + three.js. El contenedor Android usa Capacitor; el de escritorio está en `../escritorio/`.
[Inicio del repositorio](../../README.md) · [Guía de trabajo](../../CLAUDE.md) · [Sistemas](../../docs/README.md).

## Páginas y código

| Página | Código principal | Función |
|---|---|---|
| `index.html` | `src/casa/` | Casa y cuidados de la pareja; los amigos usan su sala aparte. |
| `amigos.html` | `src/amigos/` | Perfil y Sala de Juegos para amigos. |
| `super.html` | `src/main.ts` | Súper Manía, 100 días, local y salas. |
| `puertas.html` | `src/puertas/` | Cien Puertas, historia y pareja. |
| `mesa.html` | `src/mesa/` | Dados, Mancala, Cajas, ambos Parchís, Clue y Show de Nosotros (solo pareja). |
| `sangre.html` | `src/sangre/` | Sangre y Ceniza. |
| `retrete.html` | `src/sueltos/retrete.ts` | Retrete espacial sin la casa, para amigos. |
| `cocina.html` | `src/sueltos/cocina.ts` | Wafles, Fresas y Frappés sin la casa. |
| `escudo.html` | `src/escudo/` | El Escudo de las Hermanas. |
| `carreras.html` | `src/carreras/` | Dieciséis pistas, copas, contrarreloj y cuatro desafíos locales o en sala. |
| `celular.html` | `src/celular/` | Los doce teléfonos de Desaparecidos de Astra. |
| `peleas.html` | `src/peleas/` | El Torneo del Despertar Dorado. |
| `mente.html` | `src/mente/` | Dieciséis juegos mentales del patio, reto diario y clasificación. |
| `jardin.html` | `src/jardin/` | Conquista: historia de 12 áreas y versus de 36; PvZ de 40 niveles, patios y duelo aparte. |
| `granja-v3.html` | `src/granja-v3/` | Granja V5 integrada; desarrollo pausado. |

Lavarse la cara se abre desde la casa y desde la sala de amigos mediante `src/casa/lavado.ts`.
Los transportes y perfiles compartidos están en `src/salas/`. El contenido de pareja usa módulos separados con
sustitutos neutros declarados en `vite.config.ts`.

## Desarrollo y verificación

Node.js 22 o posterior. Desde esta carpeta:

```sh
npm ci
npm run dev
npm run verificar:repo
npm run probar:motores
npm run probar:granja
npm run build
npm run build:amigos
```

`build` revisa tipos y produce `dist/`. `build:amigos` produce `dist-amigos/` y revisa que no contenga recursos o
textos personales. `npm run preview` sirve la compilación completa; un servidor estático también sirve ambos builds.

Los scripts de navegador están en `scripts/probar-*.mjs`. Usar un navegador instalado mediante `CHROME_PATH` y
seguir la URL indicada en cada cabecera. Los recorridos que importan módulos fuente requieren Vite sin HMR;
los demás pueden ejecutarse contra `dist`. Capturas, logs, perfiles y resultados van a `test-results/` (excluido).
No borrar las partidas del usuario para preparar una prueba; crear contextos aislados.

Las poses del Torneo se regeneran con `personajes/blender/peleas_poses.py` desde la raíz. Los modelos sin optimizar
van a `modelos-crudos/`; publicar únicamente los recursos usados por el juego. Las guías de cada sistema explican
sus exportadores y pruebas específicas.

## Empaquetado y configuración

- `android/` y `android-amigos/`: proyectos Capacitor. `../escritorio/`: Electron.
- En la raíz, `.github/workflows/apk.yml` define el empaquetado de ambas versiones. Su existencia no garantiza que haya un
  instalador de cada commit; la generación y el seguimiento de instaladores están fuera del encargo vigente.
- Supabase usa la URL y clave publicable configuradas en la aplicación o sus variables de compilación; nunca una clave privada.
- La orientación es horizontal. Los guardados y compras se conservan entre versiones compatibles.
- [Pedidos vigentes](../../docs/pedidos.md) registra la granja pausada y los trabajos descartados.

El Jardín incluye `jardin-duelo.html`: dos en una pantalla o sala para dos dispositivos, uno con plantas y otro
con zombis; pausa compartida y revancha con bandos invertidos. Se abre desde el botón del Jardín y desde las
opciones de sala de amigos. [Reglas y comprobaciones](../../docs/sistemas/jardin.md).

La nueva aventura de PvZ tiene su motor independiente en `src/jardin/pvz/`: cuarenta niveles de día, noche, piscina y niebla,
con guardado propio y pruebas mediante `npm run probar:pvz`. Su aventura Canvas, selección de semillas, almanaque y arte ilustrado están conectados;
se abre en `jardin.html?modo=aventura`. Sin modo se abre Conquista, documentado en
[su entrega](../../docs/en-obra/pvz-conquista-base-2026-10-22.md).
Ver [contratos y límites](../../docs/en-obra/pvz-arte-2026-10-22.md).

Los nuevos juegos del patio se describen en [juegos mentales](../../docs/sistemas/patio-mental.md) y
[Jardín de los Desvelados](../../docs/sistemas/jardin.md). La clasificación compartida necesita la migración
específica de Supabase documentada allí; la marca local funciona sin red.

El pedido posterior a probar Conquista se sigue en [la lista de pendientes](../../docs/en-obra/pvz-pendientes-2026-10-22.md)
y en [GitHub, issue #1](https://github.com/javialexis06-cyber/JUEGO-ANIVERSARIO-ESPOSA/issues/1). Defensas PvZ completas con carriles según escenario, tipos exclusivos por zona y catálogo
progresivo completo están pendientes; no confundir ese encargo con las funciones de la base publicada.
