# Salas: jugar de 2 a 4 (Javier, Laura y amigos)

Las salas conectan hasta 4 celulares o computadores con un **código corto** para jugar juntos: Javier, Laura y
amigos. Las usan **Lavarse la cara**, **Sangre y Ceniza** y la **cocina de chef** (juego `cocina`,
`src/casa/cocina/sala.ts`). Código en `juego/web/src/salas/`.

| Archivo | Qué es |
|---|---|
| `tipos.ts` | El contrato (`Sala`, `JugadorSala`, `ApiSalas`…): lo que los juegos pueden usar |
| `sala.ts` | La implementación: `crearSala`, `unirseSala`, `yoMismo`, `averiguarJuego`, `usarSalasLocales`, `COLOR_PUESTO` |
| `espera.ts` + `espera.css` | La sala de espera reutilizable (código, puestos, «Listo», «Empezar»), con tres temas |
| `perfil.ts` | El perfil del amigo en el aparato (nombre, cuerpo, colores) y si el aparato está en modo amigo |
| `carita.ts` | La carita SVG de cualquier jugador con sus colores (para salas y menús) |
| `tinte.ts` | Pone los colores del amigo sobre el muñeco 3D (copias de los materiales) |

## Cómo funciona por dentro

- **Canal**: Supabase Realtime (difusión + presencia) en el canal `sala-<CÓDIGO>`, con la clave publicable y un
  cliente **aparte, sin sesión** (los amigos no tienen casa; nada toca los datos de la pareja). Respeta el servidor
  escrito en Ajustes (`nuestro-hogar-supabase`).
- **Código**: 5 caracteres de `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (sin I, L, O, 0 ni 1). Al crear se revisa que nadie
  más esté en ese canal.
- **La lista la lleva el anfitrión** (puesto 0, quien creó la sala): recibe las entradas, reparte puestos (el más bajo
  libre), contesta «la sala está llena» al quinto, «esa partida ya empezó» si la entrada está cerrada y «es de otro
  juego» si el código es de otro juego. Quien ya estaba (mismo id) siempre puede volver, a su mismo puesto.
- **Mensajes fiables**: numerados por cada destinatario, con confirmación acumulada y reenvío cada ~0,45 s; llegan una
  sola vez y en orden (aunque la red se coma el 8 %). Si alguien recarga (sesión nueva), se empieza de cero con él.
- **Rápidos** (`{ rapido: true }`): sin número ni reenvío, para lo que se manda seguido (fotos, joystick).
- **Latido** cada segundo (si no se mandó otra cosa). Sin oír a alguien 3,5 s → `alCorte(true, quien)`; al volver,
  `alCorte(false, quien)`. Quien se va a **segundo plano** avisa al instante (también sale como corte). Sin oírlo
  **un minuto** (cuatro si avisó que se fue al fondo), se da por ido. Si el ido es el anfitrión: `alFin('anfitrion')`.
- **Modo local** para pruebas y la casa sin internet: `?salas=local` en la dirección o `usarSalasLocales(true)`
  (BroadcastChannel entre pestañas del mismo navegador; con `&red=mala` pierde y demora mensajes).

## Cómo lo usa un juego

```ts
import { crearSala, unirseSala, yoMismo, COLOR_PUESTO } from '../salas/sala';
import { esperarEnSala } from '../salas/espera';

const yo = yoMismo();                       // Javier, Laura o el amigo de este aparato (tipo 'el' | 'ella' | 'amigo')
const sala = await crearSala({ juego: 'sangre', max: 4 });          // o: await unirseSala(codigo, 'sangre')
//   (unirseSala lanza Error con un texto amable para mostrar tal cual: llena, ya empezó, no existe, otro juego)

sala.ponerDatos({ clase: 'monarca' });     // lo mío que ven los demás (en sala.jugadores[i].datos)
const e = esperarEnSala({
  sala, titulo: 'Sangre y Ceniza', tema: 'oscuro',             // 'casa' | 'burbujas' | 'oscuro'
  retrato: (j) => `<img src="./sangre/retratos/${j.datos?.clase}_${j.aspecto.cuerpo}.webp">`,  // opcional
  detalle: (j) => String(j.datos?.clase ?? ''),                  // opcional
  extras: [{ id: 'clase', texto: '⚔️ Clase', alTocar: () => abrirClases() }],
  alEmpezar: () => ({ semilla: Date.now(), jugadores: sala.jugadores }),   // lo que el anfitrión les manda a todos
});
const r = await e.resultado;                 // { que: 'empezar', datos } o { que: 'salir', motivo? }

// En la partida
sala.mandar('foto', datos, { rapido: true });            // anfitrión → todos, sin garantía
sala.mandar('accion', { a: 'escoger', k: 1 });            // fiable (a todos o { a: idJugador })
const quitar = sala.al('accion', (datos, de) => { ... }); // de: JugadorSala
sala.alCorte((cortado, quien) => pausarConAviso(cortado, quien));
sala.alCambiar((jugadores) => { ... });                   // entró, salió o cambió sus datos
sala.alFin((motivo, texto) => terminarConAviso(texto));   // el anfitrión se fue (si nadie escucha, aviso suelto)
sala.cerrarEntrada(true);                                 // (esperarEnSala ya la cierra al empezar y la abre al volver)
sala.salir();
```

Reglas para los juegos:

- `mandar` no se entrega a uno mismo (el que manda ya sabe lo que hizo).
- **Modo neutro**: si `sala.hayAmigos` (o el que juega es un amigo), nada personal de la pareja en pantalla, avisos ni
  sonidos (ni recuerdos, ni apodos, ni frases de amor). Javier y Laura sí se ven con su nombre: son jugadores.
- **Dificultad por jugador**: más vida y más enemigos por cada uno, élites más seguido y premios repartidos.
- Al empezar, poner `ponerDatos({ jugando: true, listo: false })`; la sala de espera muestra «Alistándose…» y el
  anfitrión no puede empezar otra hasta que todos vuelvan y toquen «Estoy listo».
- `averiguarJuego(codigo)` dice de qué juego es una sala sin entrar (la usa «Unirme con un código» de los amigos).
- Para volver: un amigo vuelve a `./amigos.html` (si `esModoAmigo()`, de `perfil.ts`), Javier y Laura a la casa.

## El modo amigo

- En «¿Quién eres?» (index.html) está **«Soy un amigo / una amiga»**: lleva a `amigos.html?perfil`, el **creador de
  personajes** (`src/amigos/creador.ts`): el muñeco grande en su **estudio de fotos** (`muneco.ts`: fondo curvo,
  pedestal de felpa, lámparas; se gira arrastrando, zoom con la rueda o pellizcando, poses, saluda y presume lo que
  estrena) y el **vestidor** con pestañas: cuerpo y piel (molde de Javier o de Laura), peinado y color, cara (ojos,
  cejas, rubor, medias), arriba, abajo, zapatos, gorros, complementos (gafas, espalda, colitas), **joyas** (aretes y
  collares) y **conjuntos** completos (`conjuntos.ts`), cada prenda con sus colores, «al azar» y deshacer. La vista
  previa enseña cómo se verá en la sala, en Lavarse la cara y en Sangre y Ceniza. Todo sale del **clóset genérico**
  (`src/salas/prendas.ts` y `vestir.ts`), nada de la pareja. El **perfil** se guarda en el aparato
  (`nuestro-hogar-amigo`, id propio `amigo-…`) y se cambia cuando quiera («Editar mi personaje»).
- La **sala de juegos de amigos** (`amigos.html`, `src/amigos/main.ts`): su muñeco, los juegos aptos (`juegos.ts`:
  solo los que tienen `<meta name="apto-amigos" content="si">`; los demás salen «Muy pronto»), «Crear sala» y
  «Unirme con un código». **Sangre y Ceniza** usa el muñeco del amigo tal cual lo vistió.
- **Nunca carga la casa**: index.html, puertas.html, mesa.html y super.html tienen una guardia en el `<head>` que
  manda a `amigos.html` mientras el perfil esté activo (también al recargar o con atrás). En Android, atrás desde su
  sala cierra la app. Si Javier o Laura tocaron el botón por error: «¿Eres Javier o Laura?» (abajo, pequeñito) pide
  confirmar y vuelve al inicio.
- Lo que llega de otro aparato por la sala se limpia antes de pintarlo (`jugadorSeguro` en `sala.ts`: nombre corto,
  colores de verdad, solo prendas que existen).

## Versión para amigos (app aparte «Sala de Juegos»)

Para pasarle el juego a amigos sin que se lleven nada de la pareja hay una **compilación aparte**:

- `npm run build:amigos` (`vite build --mode amigos`, carpeta `dist-amigos`): solo las páginas de `PAGINAS_AMIGOS`
  (`amigos.html`, `sangre.html`, `super.html`, `retrete.html`, `cocina.html` y `mesa.html`; un juego nuevo para amigos
  se agrega ahí y en `src/amigos/juegos.ts`, y su página lleva `<meta name="apto-amigos" content="si">`). De `src/`
  solo entra lo de `PERMITIDOS_AMIGOS` (si algo más se cuela, la compilación falla con el nombre del archivo) y lo
  personal se cambia por su versión vacía o neutra (`src/amigos/sin_pareja/`, la lista está en `SUSTITUTOS`):
  - el modelo, la sincronización y el catálogo de la casa;
  - lo personal del lavado (`src/casa/lavado/pareja.ts`);
  - lo del retrete (`src/casa/cohete/pareja.ts`: lo que dicen en el vuelo, el «¡Te pasé, mi amor!», las palabras de
    las figuras de rollitos y la galaxia del amor);
  - lo de la cocina (`src/casa/cocina/pareja.ts`: lo que dicen Él y Ella cuando llegan a comer y sus favoritos);
  - lo que dicen los muñequitos de la mesa (`src/reacciones/pareja.ts`; con amigos salen las frases neutras de
    `reacciones/frases.ts`);
  - las escenas premium de la mesa (`src/escenas/catalogo.ts` y `cine.ts`: un amigo no tiene ninguna).

  De `public/` solo se copia lo que usan esos juegos: `PUBLICOS_AMIGOS`, `MODELOS_SUPER`, los íconos de los
  productos, la ropa del clóset genérico, los cascos y modelos del retrete (`cohete_*`), la cocina sin
  `cocina/gente/pareja_*` (la pareja cuando llega a comer), la utilería de las reacciones (`reaccion_*.glb`) y las
  imágenes del Clue (`modelos/clue/`).
- **Súper Manía en la app de amigos**: `super.html` sale con sus textos neutros de una vez (el build cambia lo de cada
  `data-neutro` y quita lo `solo-pareja`), las cartas del súper (`src/recuerdos_super.ts`) se cambian por una lista
  vacía y el día 100 se llama «Gran final». El amigo guarda su partida aparte (`amigo-supermania`) y su local crece
  igual que el de la pareja. «Wafle» sí puede estar (es una sección del súper): lo que no puede estar es la anécdota
  (`PLATOS_DEL_JUEGO` en `verificar-amigos.mjs`).
- Después, `scripts/verificar-amigos.mjs` revisa **todo** `dist-amigos` (JavaScript, HTML, CSS, JSON, SVG y los
  nombres de mallas y materiales de los GLB) contra `scripts/palabras-pareja.mjs` (apodos, lugares, chistes) y los
  recuerdos de docs/sistemas/cien-puertas.md y del lavado. Si encuentra algo, falla y GitHub Actions no publica.
- **App de Android** «Sala de Juegos» (`com.javialexis.salajuegos`, se instala al lado de Nuestro Hogar): el job
  `apk-amigos` del workflow compila la versión para amigos, corre `scripts/android-amigos.mjs` (cambia id, nombre,
  ícono y pantalla de arranque con los de `android-amigos/res`, que dibuja `scripts/iconos-amigos.mjs`) y
  `NH_AMIGOS=1 npx cap sync android` (`capacitor.config.ts` toma `dist-amigos`). Publica
  **NuestroHogar-Amigos.apk** en la misma versión de Releases que la de la pareja.
- **Programa de computador**: el job `exe-amigos` arma el mismo Electron (`juego/escritorio`) con `dist-amigos`
  adentro, el ícono de `build-amigos`, el nombre «Sala de Juegos» y otros puertos (47625-47628: las dos apps pueden
  estar abiertas a la vez sin mezclar lo guardado) y publica **NuestroHogar-Amigos.exe**.
- Los dos jobs van después de la APK de la pareja (`needs: apk`) y no la tocan: si la versión para amigos falla,
  la de la pareja igual sale.
- **«Invitar amigos»** (menú de la casa, solo en la versión de la pareja; `src/amigos/invitar.ts`): comparte por
  WhatsApp (o copia, o muestra para copiar) un mensaje con los dos enlaces de descarga
  (`releases/latest/download/NuestroHogar-Amigos.apk` y `.exe`) y, si hay una sala abierta en el aparato, su código.
  Ojo: los enlaces llevan el nombre del repositorio, y el repositorio es público.

## Juegos de amigos sin la casa

Páginas propias que un amigo abre desde su sala de juegos (si el aparato no está en modo amigo, mandan a la casa):

| Juego | Dirección | Progreso en el aparato |
|---|---|---|
| Retrete espacial | `./retrete.html` (`?tienda`: solo la tienda) | `amigo-retrete-progreso` |
| Cocina de chef | `./cocina.html` (`?unirse=CÓDIGO`: entra a esa sala; `?receta=wafles`: abre ese restaurante) | `amigo-cocina-progreso` |
| Lavarse la cara | dentro de `amigos.html` | `amigo-lavado-progreso` |
| Juegos de mesa | `./mesa.html?amigo` (contra la máquina, dos en el mismo celular o sala con código) | `amigo-mesa-partida` |

«Unirme con un código» de la sala de juegos: si `averiguarJuego(código)` dice `cocina`, va a
`./cocina.html?unirse=CÓDIGO`. Lo común de estas páginas está en `src/sueltos/comun.ts` (quién juega, guardar en el
aparato, volver a `./amigos.html`, el botón atrás).

## Pruebas

- `node scripts/probar-salas.mjs <url>`: cinco celulares (Supabase de mentiras con pérdidas): crear, entrar tres, el
  quinto «llena», 60 fiables de cada uno a cada uno en orden, rápidos, cortes, segundo plano, empezar con la entrada
  cerrada y el anfitrión que se va.
- `node scripts/probar-lavado-salas.mjs <url>`: Lavarse la cara de a cuatro (ver docs/sistemas/nuestro-hogar.md).
- `node scripts/probar-amigos.mjs <url>`: el modo amigo de punta a punta (creador por pestañas, sala, guardias) y que
  no vea nada personal.
- `node scripts/probar-amigos-juegos.mjs <url>`: desde la sala de juegos (los seis dicen «Jugar»), el retrete y la
  cocina sin la casa (la cocina también en sala con otro amigo) y una partida de dados en la mesa, sin nada personal,
  ni en la pantalla ni en lo dibujado. Corre igual contra el servidor de desarrollo o contra la app de amigos
  compilada (`npm run build:amigos && npx vite preview --mode amigos --port 5181`): ahí la lista de lo que no se
  puede ver sale de los archivos de pareja. `node scripts/probar-mesa-salas.mjs <url>` prueba la mesa de los amigos
  (contra la máquina y en sala) y `node scripts/probar-cocina-linea.mjs` la cocina de Javier y Laura en sala.
- `npm run build:amigos`: compila la versión para amigos y la revisa con `verificar-amigos.mjs`.
- `scripts/supabase-falso.mjs` (el Supabase de mentiras reutilizable) y `scripts/palabras-pareja.mjs` (lo que un amigo
  nunca debe ver).
- En la máquina de pruebas, con cuatro navegadores a la vez, los celulares de atrás van muy lentos: las pruebas
  esperan a que las cosas pasen de verdad en vez de contar segundos fijos.
