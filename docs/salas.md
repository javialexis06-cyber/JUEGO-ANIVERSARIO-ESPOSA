# Salas: jugar de 2 a 4 (Javier, Laura y amigos)

Las salas conectan hasta 4 celulares o computadores con un **código corto** para jugar juntos: Javier, Laura y
amigos. Las usan **Lavarse la cara** (ya) y **Sangre y Ceniza** (el juego nuevo). Código en `juego/web/src/salas/`.

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

- En «¿Quién eres?» (index.html) está **«Soy un amigo / una amiga»**: lleva a `amigos.html?perfil`, donde pone su
  nombre, escoge muñeco (el de Javier, «pelo corto», o el de Laura, «pelo largo») y colores de piel, pelo, camiseta,
  pantalón y zapatos, con el muñeco en 3D girando en un pedestal (`src/amigos/muneco.ts`). Se guarda en el aparato
  (`nuestro-hogar-amigo`) con un id propio (`amigo-…`) y se puede cambiar cuando quiera («✏️ Mi muñeco»).
- La **sala de juegos de amigos** (`amigos.html`, `src/amigos/`): su muñeco, **Sangre y Ceniza** (abre
  `./sangre.html`; si todavía no existe dice «Muy pronto»), **Lavarse la cara** en modo neutro (con su progreso
  guardado en el aparato, `amigo-lavado-progreso`) y **Unirme con un código** (averigua el juego y entra).
- **Nunca carga la casa**: index.html, puertas.html, mesa.html y super.html tienen una guardia en el `<head>` que
  manda a `amigos.html` mientras el perfil esté activo (también al recargar o con atrás). En Android, atrás desde su
  sala cierra la app. Si Javier o Laura tocaron el botón por error: «¿Eres Javier o Laura?» (abajo, pequeñito) pide
  confirmar y vuelve al inicio.

## Pruebas

- `node scripts/probar-salas.mjs <url>`: cinco celulares (Supabase de mentiras con pérdidas): crear, entrar tres, el
  quinto «llena», 60 fiables de cada uno a cada uno en orden, rápidos, cortes, segundo plano, empezar con la entrada
  cerrada y el anfitrión que se va.
- `node scripts/probar-lavado-salas.mjs <url>`: Lavarse la cara de a cuatro (ver docs/nuestro-hogar.md).
- `node scripts/probar-amigos.mjs <url>`: el modo amigo de punta a punta y que no vea nada personal.
- `scripts/supabase-falso.mjs` (el Supabase de mentiras reutilizable) y `scripts/palabras-pareja.mjs` (lo que un amigo
  nunca debe ver).
- En la máquina de pruebas, con cuatro navegadores a la vez, los celulares de atrás van muy lentos: las pruebas
  esperan a que las cosas pasen de verdad en vez de contar segundos fijos.
