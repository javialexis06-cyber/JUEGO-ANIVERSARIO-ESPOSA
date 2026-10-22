# Plantas contra Zombis · arquitectura y contrato de trabajo

La ampliación vigente es [motor completo, carriles por escenario y tipos exclusivos por zona](pvz-pendientes-2026-10-22.md).
El constructor actual aún infiere cinco/seis filas por área y Conquista tiene otro combate simplificado:
ambos requieren el diseño e integración señalados en ese seguimiento. Este contrato describe lo ya construido,
no declara terminada la ampliación ni fija cinco/seis carriles como límite para los escenarios futuros.

Avances del 19 de octubre: [base del motor](pvz-motor-2026-10-19.md) y
[abono, progreso y recuperación de guardado](pvz-abono-guardado-2026-10-19.md) y
[mundo nocturno](pvz-noche-2026-10-20.md), [piscina](pvz-piscina-2026-10-20.md) y
[niebla](pvz-niebla-2026-10-22.md).
El pedido del 22 de octubre encarga a Codex integrar también la dirección artística aprobada;
[entrega visual y comprobaciones](pvz-arte-2026-10-22.md).

Documento interno para construir la nueva aventura del Jardín ([plan](jardin-plan-2026-10-17.md)). Todo agente o
sesión que trabaje en `src/jardin/pvz/` sigue estas reglas. Si una regla estorba, se cambia aquí primero.

## Decisión de Javier (17 de octubre)

- Mismos nombres de Plants vs. Zombies (versión en español), diseño de PvZ adaptado, misma interfaz y misma
  jugabilidad. La sensación buscada es «estoy jugando PvZ», una combinación del 1 y el 2.
- Historia propia de apocalipsis zombi («La Semilla Madre», ver el plan), sin el lore de Astra ni la pareja. No es
  la suma de las historias de PvZ 1 y 2: se pueden cambiar escenarios y algunas plantas.
- El modo de fusiones (estilo PvZ Fusion chino) es una sección aparte, con sus reglas y su progreso.
- Libertad total de diseño. Los valores de PvZ (costos, recargas, vidas, daño, precios de la tienda) cuentan como
  aprobados porque Javier pidió la misma jugabilidad. Cualquier invento fuera de PvZ se anota en el plan.

El arte actual son atlas raster propios, fondos ilustrados y efectos en Canvas; los sonidos y la música
se sintetizan con WebAudio. No se incorporan imágenes, sonidos, música ni textos largos del juego original.

**Dirección artística aprobada el 22 de octubre:** Javier aprobó el render ilustrado y la muestra de ocho
plantas de este chat, y encargó a Codex plantas, escenarios y zombis con varias ropas. Este pedido sustituye
el reparto gráfico anterior y autoriza los recursos generados a partir de esa referencia. Se mantienen IDs,
reglas, costes y guardados. No requiere nuevas voces ni cambios de dificultad.

## Qué se conserva

- `src/jardin/datos.ts`, `motor.ts`, `vista.ts`, `duelo*.ts` y `public/jardin/figuras.glb` quedan intactos:
  - los 12 patios pasan a «Patios clásicos», con la clave `jardin-v1` / `amigo-jardin-v1` y sus estrellas;
  - el duelo para dos (`jardin-duelo.html`) no cambia.
- `jardin.html` abre ahora [Conquista](pvz-conquista-base-2026-10-22.md); `?modo=aventura` conserva la pantalla de PvZ, con accesos a la
  aventura, los modos, la fusión, los patios clásicos y el duelo.
- Las pruebas existentes (`probar-jardin-motor.mjs`, `probar-jardin-duelo.mjs`, `probar-jardin-interfaz.mjs`,
  `probar-jardin-duelo-interfaz.mjs`) deben seguir pasando. Si cambia el menú, se ajusta la prueba de interfaz, no
  la campaña clásica.

## Tecnología y archivos actuales

- **Canvas 2D** para el campo y una capa HTML para menús, selección y controles. La aventura no carga three.js.
- Atlas transparentes en `public/jardin/pvz/`, con cuatro columnas y dos filas salvo la Tripitidora individual.
  `arte/atlas.ts` recorta una vez el componente principal de cada celda, elimina restos desconectados de
  figuras vecinas y guarda texturas de hasta 384 px. No vuelve a procesar sus píxeles en cada cuadro.
- Animación procedural: respiración, retroceso al disparar, oscilación de marcha y mordida, vuelo, rebote,
  saltos, emergencia, sueño y tintes. Los sprites son bases ilustradas; todavía no hay articulación separada
  de cada brazo, mandíbula o pierna. Conos, cubos, puertas y periódicos están integrados en sus figuras:
  cuerpo y protección comparten el movimiento, y la ropa se conserva al perder la armadura.
- Motor determinista a 60 Hz, separado del dibujo, sin DOM ni `Math.random`. Las ocho ropas usan un hash
  estable de ID y nivel: no consumen azar ni cambian el combate. `estadoVisibilidad()` evita copiar todo el
  combate para consultar niebla y tormenta, y devuelve valores nuevos sin mutar el motor.

```
src/jardin/main.ts              entrada: aventura o patios clásicos por modo/ID anterior
src/jardin/clasicos.ts          controlador clásico conservado, con su CSS y clave anteriores
src/jardin/pvz/
  tipos.ts                     contratos de simulación
  motor/                       combate, terreno, oleadas, minijuegos y pilotos
  datos/                       índices y definiciones de los mundos 1–4
  comportamiento/              plantas y zombis por mundo; abono del día
  guardado.ts                  progreso, recibos, cuotas y conflictos
  arte/catalogo.ts             atlas, figuras, tamaños y hash de vestuario
  arte/atlas.ts                carga, normalización, caché y liberación de texturas
  vista/escena.ts               fondos, terreno, entidades, efectos, visibilidad y toque
  ui/retratos.ts                retratos derivados del mismo arte de partida
  ui/pvz.css                   interfaz horizontal, selección, mapa y almanaque
  sonido.ts                    efectos y ambiente sintetizados
  aventura.ts                  navegación, órdenes, bucle y persistencia
public/jardin/pvz/              once recursos propios; cuatro fondos en un atlas
```

Los doce patios conservan `datos.ts`, `motor.ts`, `vista.ts`, `jardin.css` y `jardin-v1`/`amigo-jardin-v1`.
El controlador anterior está en `clasicos.ts`; el duelo no cambia. `modo=clasicos` y los IDs antiguos de patio
abren esa campaña. El almanaque nuevo muestra las 32 plantas y 21 zombis registrados; no desbloquea sobres.
Los personajes narrativos, arte de mundos aún no construidos, tienda y modos posteriores siguen en el plan.

## Coordenadas y tiempo

- **Unidades del mundo:** píxeles de PvZ 1.
- **Columnas:** 9, de 80 de ancho. El césped empieza en x = 0. La columna `c` ocupa de `80c` a `80c + 80`.
- **Filas:** 5, de 100 de alto. En piscina y niebla son 6, de 85 de alto. La fila `f` tiene su centro en
  `y = 100f + 50`, o `85f + 42,5` en las de 6.
- **Zombis:**
  - aparecen en x ≈ 760 + azar(0..40);
  - se pueden atacar desde x < 800;
  - se pierde cuando uno pasa de x < -60 sin cortacésped en su fila.
- **Cortacéspedes:** en x = -40; recorren su fila hacia la derecha a 400 px/s.
- **Tiempo:**
  - el motor avanza con `paso()` de 1/60 s y acumula el tiempo en segundos;
  - la vista interpola entre pasos;
  - la velocidad ×2 simplemente llama a `paso()` el doble.

## Contrato del motor (resumen; el detalle vive en `tipos.ts`; las extensiones del tutorial, cinta y presupuesto se registran allí)

```ts
type Area = 'dia'|'noche'|'piscina'|'niebla'|'tejado'|'rio'|'vias'|'desierto'|'paramo'|'invernadero';
interface DefPlanta { id: string; nombre: string; sol: number; recarga: number; vida: number;
  familia: 'productora'|'tiradora'|'barrera'|'explosiva'|'lanzadora'|'hongo'|'apoyo'|'acuatica';
  nocturna?: boolean; agua?: 'solo'|'tambien'; soloTierra?: boolean; capa?: 'base'|'principal'|'cubierta'|'temporal';
  mejoraDe?: string; desbloqueo: string; descripcion: string; datos?: Record<string, number> }
interface DefZombi { id: string; nombre: string; vida: number; armadura?: {tipo:'casco'|'escudo'; vida: number;
  metal?: boolean}; velocidad: number /* px/s */; mordida: number /* daño/s */; area: Area;
  comestible?: boolean /* true por defecto; Zomboni y trineo se pueden devorar */; agua?: 'solo'|'tambien';
  desbloqueo: string; descripcion: string; datos?: Record<string, number> }
interface DefNivel { id: string /* '1-1' */; parte: 1|2; area: Area; filas: number[] /* activas */;
  zombis: string[]; banderas: number; tipo: 'normal'|'cinta'|'minijuego'|'jefe'; minijuego?: string;
  solInicial: number; premio?: {planta?: string; objeto?: string; nota?: string};
  lapidas?: number; materas?: [number,number][]; niebla?: number; plantasFijas?: string[];
  dialogoAntes?: string; dialogoDespues?: string }
```

- **Comportamientos.** `comportamiento/index.ts` registra un objeto por planta y otro por zombi que lo necesite:

  ```ts
  { iniciar?(m,p), paso(m,p,dt), puedeAbono?(m,p), abono?(m,p), alDanar?(m,p,cant,origen), alMorir?(m,p) }
  ```

  - El motor resuelve todo lo común: caminar, morder, armaduras, estados, colisiones, cortacésped,
    oleadas y sol.
  - Los comportamientos solo añaden lo propio de cada planta o zombi.
- **Daño:** `m.danarZombi(z, cantidad, tipo)` con `tipo`:
  - `'recto'`: guisante, tapado por los escudos;
  - `'lanzado'`: pasa por encima del escudo;
  - `'perforante'`: vapor; atraviesa y daña el escudo y el cuerpo;
  - `'explosion'`: deja ceniza;
  - `'fuego'`, `'hielo'` y `'aplastar'`.
- **Armaduras:** el casco (cono, cubo, casco de fútbol, casco de minero) se gasta antes que el cuerpo. El escudo
  (puerta, periódico, escalera) solo detiene el daño recto de frente.
- **Estados:**
  - lento: mitad de velocidad y de mordida, tinte azul;
  - congelado: quieto;
  - mantequilla: quieto 4 s;
  - hipnotizado: camina a la derecha, hacia la entrada de enemigos, y muerde zombis, tinte morado;
  - ceniza: muere sin animación normal.
- **Eventos:** `m.eventos` se vacía en cada paso. La vista y el sonido lo leen, y el motor nunca toca la vista.
  Ejemplos:
  - `{t:'disparo', ...}`, `{t:'impacto', ...}`, `{t:'muerde'}`;
  - `{t:'pierdeBrazo'}`, `{t:'pierdeCabeza'}`, `{t:'pierdeArmadura'}`;
  - `{t:'explosion'}`, `{t:'sol'}`, `{t:'oleadaEnorme'}`, `{t:'ultimaOleada'}`, `{t:'cortacesped'}`;
  - `{t:'fin', gano}`.
- **Abono:** `puedeUsarAbono(id)` valida sin consumir; `usarAbono(id)` consume una carga solo al aceptar.
  El comportamiento puede rechazarlo antes del cobro con `puedeAbono(m,p)` (p. ej., límite de soles).
  Las ráfagas activas bloquean daño, pala y otro abono; al finalizar curan la planta y reanudan la cadencia normal.
  `EstadoPvZ.zonas` es opcional para compatibilidad: contiene zonas de hielo con ID, origen, fila, `desde`,
  `hasta` y vida restante. El evento `zona` anuncia su duración; `siembra.origen` identifica copias de Patatapum;
  `disparo.cantidad` indica daño y `disparo.proyectil` distingue el guisante grande. `estado` con tipo
  `abono-fin` marca el fin de la ráfaga. La vista decide cómo representar esos datos.
- **Consumo de eventos:** `consumirEventos()` tras órdenes; `avanzar(n)` reúne los eventos de cada paso. No leer solo el último paso con ×2.
- **Determinismo:** misma semilla, mismo nivel y mismas órdenes dan el mismo resultado.
- **Terreno nocturno:** `DefNivel.distribucionLapidas` distribuye cantidades por columna cero-based; suma
  `lapidas`. `maximosCinta` limita sobres emitidos durante toda la partida, no solo los que están en la cinta.
  `EstadoPvZ.lapidas` y `crateres` son opcionales por compatibilidad; sus entidades tienen ID, fila, columna y x;
  el cráter añade vida restante. `lapidaEn`, `crearLapida`, `quitarLapida` y `crearCrater` son primitivas internas.
  El evento `terreno` usa tipos `lapida`, `lapida-quitada`, `crater` y `crater-fin`. La pala no retira lápidas
  ni un Comepiedras activo; el cráter bloquea todas las siembras.
- **Proyectiles y zombis de noche:** `disparar` admite un sexto argumento de alcance desde la planta;
  `ProyectilPvZ.hasta` marca su límite. El comportamiento de zombi puede devolver `false` para suspender
  movimiento y mordida en ese paso. `datos.emergeHasta` indica emergencia sin movimiento ni mordida;
  `enfadoPendiente`, `enfadado`, `faseBaile`, `senalando`, `esperaHasta`, `lider` y `hueco` describen estados
  del periódico y de la formación. `datos.asustada` y `crecida` describen los hongos.
- **Aplastazombis:** orden `{tipo:'golpear',id}` solo en el minijuego 2-5; emite `martillo`. No tiene coste
  ni recarga de sobre; 900 de daño al casco sin transferir excedente, o muerte si ya no hay casco.
  Usa ocho oleadas y su propio director, no el presupuesto común. La victoria espera su grupo final.
- **Progresión al ampliar áreas:** las diez victorias de una partida guardada con el antiguo final `1-10`
  pasan a `2-1` sin conceder una victoria nocturna ni escribir al leer. También se reconocen los finales publicados de veinte victorias con `2-10`, que pasa a `3-1`, y de treinta con `3-10`, que pasa a `4-1`. Solo se reconocen esas fronteras publicadas.
  El resto de estructuras incoherentes sigue bloqueado sin reescritura. Los consumidores del motor obtienen
  semillas previas desde `datos/niveles.ts`; la función de `datos/dia.ts` se conserva por compatibilidad.


- **Piscina:** `DefZombi.agua` restringe apariciones; ausente significa tierra, `solo` agua y `tambien` ambos.
  `DefPlanta.soloTierra` impide sembrar Patatapum y Pinchohierba sobre agua incluso con soporte.
  Al destruir un Nenúfar se retiran las plantas terrestres apoyadas, con su callback y evento una sola vez.
  `DefNivel.filasAgua` debe ser un subconjunto sin repetición de las filas activas.
- **Hielo de vehículo:** `EstadoPvZ.pistasHielo` es opcional por compatibilidad y contiene
  `{id,fila,desde,hasta,vida}`. Bloquea sembrar en el tramo; Zomboni renueva treinta segundos y Jalapeño lo
  elimina. `terreno` con tipo `pista-hielo` o `pista-hielo-fin` informa cambios; no son las zonas de abono.
  `esAgua`, `pistaHielo`, `crearPistaHielo`, `quitarHielo` y `aplastarPlantas` son primitivas internas.
- **Objetivos y estados acuáticos:** `puedeRecibirProyectil(z,tipo?)` omite arrastrados, pasajeros protegidos, saltos y el choque del trineo.
  Un buzo sumergido admite proyectiles lanzados y evita rectos; explosiones y habilidades conservan sus reglas. `datos.sumergido`,
  `zampalga`, `arrastrado`, `montado`, `delfinEnAgua`, `saltoPendiente`, `enTrineo`, `liderTrineo`,
  `huecoTrineo`, `choqueTrineoHasta`, `vehiculo` e `intocableTrineo` describen sus fases. Un vehículo activo
  no pierde cabeza ni recibe frío. `datos.enAire` impide morder Apisonaflor durante su salto.
- **Guisantes y barreras:** `ProyectilPvZ.antorchas` registra las plantas cruzadas: hielo pasa a guisante
  normal, y otro cruce puede calentarlo; guisante normal pasa a fuego con daño y salpicadura. No se recalienta
  cada paso dentro de la misma planta. `datos.bloqueaSalto` identifica la barrera alta y
  `datos.ignoraMordida` identifica suelo punzante que no detiene enemigos ni se aplasta por vehículos.
- **Nivel acuático:** `emboscadaAgua` programa la emboscada final y bloquea la victoria mientras está pendiente.
  `cortacespedAgua` habilita un limpiador que atraviesa el agua; por defecto el cortacésped se hunde al entrar.
  No se concede ninguna compra: el contrato de tienda sigue pendiente. `presionCinta` adapta el intervalo al
  número de sobres pendientes. `atenuarCinta` recibe `{cantidad,pesoFinal}` por semilla: interpola su peso
  según plantas vivas y sobres en espera, permitiendo reponer Nenúfares sin un tope total de emisiones.
- **Minizombis:** `minijuego:'minizombis'` divide entre cuatro cuerpo y armadura con truncado, mantiene
  mordida y velocidad y usa 7,5 s entre oleadas. `datos.vidaMaxima` conserva la vida reducida para sus
  umbrales; `datos.escala=0.5` permite a la vista representarlos. No escala las plantas ni sus costes.


## Contratos aditivos de niebla

- `DefNivel.tormenta` habilita el reloj de relámpagos y excluye la niebla. `EstadoPvZ.niebla` incluye
  `{desde,desplazamiento,retirada,claras}`: columna cero-based, desplazamiento horizontal, segundos hasta
  recuperar el terreno y pares `[fila,col]` iluminados. `tormenta` contiene `{variante,restante,claridad}`,
  con claridad entre 0 y 1. Consultar el estado no consume azar ni cambia los relojes.
- `explosion(fila,x,dano,radioFilas?,radioX?,aereo?)` alcanza objetivos subterráneos; el último parámetro
  permite excluir vuelo en Patatapum. Apisonaflor excluye vuelo y túnel en selección y daño colateral.
- `ProyectilPvZ.aereo` separa los pinchos altos de los terrestres. `dispararVector` recibe velocidades X/Y;
  las colisiones recorren el segmento en dos dimensiones y admiten velocidad negativa. Las estrellas no
  tienen un rayo frontal horizontal. `puedeRecibirProyectil(z,tipo?,aereo?)` omite el túnel y distingue vuelo.
- Los callbacks opcionales de zombi `quitarMetal` y `pincharGlobo` permiten retirar equipo funcional sin
  convertirlo en daño corporal. `destruirPlanta` retira físicamente una planta y sus dependientes; evita
  que una protección de daño vuelva inmune una planta a la caja sorpresa.
- Fases en `z.datos`: `volando`, `sinGlobo`, `soplado`; `caja`, `cajaAbriendo`, `temporizadorCaja`;
  `bajoTierra`, `pico`, `sinPico`, `pausaPicoHasta`, `emergiendoHasta`, `mareoHasta`, `reversa`;
  `pogo`, `reboteHasta`. `reversa` invierte el movimiento hostil; al hipnotizar se invierte su sentido actual.
  Los eventos `estado` anuncian los cambios. `p.datos.alto` identifica Cactus; los relojes de ráfaga y carga
  quedan en la planta y no se reconstruyen a partir del dibujo.
- `JarronPvZ` publica `{id,fila,col,x,verde,contenido?}`. `contenido` solo existe para verdes o los revelados
  por Planterna, no por Plantorcha ni por viento. `SobrePvZ` publica `{id,planta,fila,x,vida}`. Los getters
  y snapshots devuelven copias. `etapaJarrones` vale 1–3 durante el minijuego, cero fuera de él.
- Órdenes `{tipo:'romperJarron',id}` y `{tipo:'plantarSobre',id,fila,col}`: únicamente en Rompejarrones,
  ID válido, casilla legal y uso único. La siembra del sobre no cobra sol ni activa la recarga del banco.
  No puede plantarse sobre un jarrón cerrado. La primitiva de premio solo se autoriza dentro de esa orden.
- Eventos `jarron` con tipo `etapa`, `roto` o `transicion` y eventos `sobre` con la planta, `sembrado` o
  `expirado` informan a la vista. La transición limpia entidades y sobres pero conserva sol y cortacéspedes;
  la victoria espera la tercera etapa y la ausencia de hostiles. La selección normal del jugador sigue
  pasando por `abrirNivel`; los sobres del minijuego pertenecen a su director.

## Oleadas (PvZ 1)

- Cada nivel normal tiene `banderas × 10` oleadas; `oleadas`/`enormes` explicitan excepciones del tutorial y bolos. La décima de cada bandera es una oleada enorme: aviso, zombi
  bandera y más puntos.
- Cada oleada gasta un presupuesto de puntos que crece con el número de oleada. Cada tipo de zombi cuesta según
  su fuerza y solo salen los tipos del nivel.
- La siguiente oleada sale a los 25–31 s o antes, si la vida de la oleada actual baja de cerca de la mitad.
- La primera oleada sale a los ~18 s.
- Los valores exactos salen de la investigación y se anotan en `motor/oleadas.ts`.

## Arte e interfaz publicados

- [Catálogo de recursos, procedencia y límites](pvz-arte-2026-10-22.md). La referencia aprobada es ilustración
  2D con contornos oscuros, textura pintada, siluetas claras y caras expresivas.
- Hay cuatro fondos: día, noche, piscina y piscina nocturna. La vista ajusta las franjas a los carriles reales;
  la niebla, iluminación, relámpagos, hielo, lápidas y cráteres pertenecen al estado del motor.
- Ocho cuerpos comunes varían prendas y calzado: saco, chaqueta vaquera, sudadera, camisa de cuadros,
  overol, impermeable, pijama y chaqueta deportiva. Cono, cubo, puerta y periódico se retiran al perder su
  protección. Los enemigos especiales tienen sus diseños y estados propios.
- El banco muestra costes reales, recargas, selección y sobres temporales. Tocar un sol lo recoge antes de
  intentar sembrar. Pala, pausa, ×1/×2 y Escape conservan las reglas. Ocultar la página pausa la partida.
- Las plantas se colocan por toque tras elegir semilla. Los minijuegos de aventura tienen controles propios:
  sobres de cinta, martillo por toque y órdenes de jarrón/sobre. La selección y la victoria pasan por GuardadoPvZ.
- Pantallas actuales: título, mapa de cuatro mundos, selección con enemigos visibles, resultado y premio,
  almanaque con detalle y vestuario, y opciones. Accesos separados a patios clásicos y duelo.
- Efectos de sonido y música sintetizados, sin voces nuevas. Las cargas fallidas ofrecen reintento; se liberan
  lienzo, observadores, escuchas, texturas, audio y bucle al salir.
- Las pruebas se habilitan con `prueba=1`: piloto, avance fijo, escenarios preparados sin recibo y lecturas.
  La navegación normal no expone ese objeto. Las muestras del test no acreditan niveles ni premios.

## Guardado

- La clave es `pvz-v1`, o `amigo-pvz-v1` en la versión de amigos (como `esModoAmigo()` en el código actual).
- Guarda:
  - el nivel alcanzado, los niveles completados y las plantas desbloqueadas;
  - las monedas, las compras de la tienda y las ranuras;
  - los minijuegos, rompecabezas y supervivencia;
  - la fusión y los ajustes.
- Lecturas y escrituras protegidas con `try/catch`. Si falla la escritura, se muestra un aviso con
  «Reintentar» sin perder el resultado, como hacen los patios.
- Nunca se borra ni se migra `jardin-v1`.
- `GuardadoPvZ` recibe un almacén `{getItem,setItem}` y `{amigo}`; no accede al DOM ni al almacenamiento al
  importar. `abrirNivel` valida desbloqueo y selección, devuelve nivel, opciones y un recibo de partida.
  `confirmarResultado(recibo, estado)` acepta un final una vez; los premios se conceden al primer triunfo.
- `bloqueo`, `pendiente`, `guardado` y `reintentar()` permiten mostrar y resolver el aviso. Un fallo de escritura
  conserva el resultado en memoria y bloquea nuevas partidas. Un archivo roto, de versión futura o estructura
  desconocida se conserva y bloquea escrituras. Un cambio de otra pestaña produce conflicto sin sobrescribirlo.
- Se guardan premios, objetos y notas, incluidas semillas de áreas todavía no registradas. Compras, monedas,
  ranuras y los bloques de modos se conservan; todavía no se implementan tienda ni modos. La batalla activa no
  se restaura al recargar. El contrato completo y sus límites están en el registro de abono y guardado.

## Prohibiciones y cuidados

- Nada de la pareja ni de Astra. La versión de amigos incluye todo `src/jardin/`.
  - Los textos no pueden contener las palabras de `scripts/palabras-pareja.mjs`.
  - Ojo con «recuerdo», «propuesta», «protagonista», «panda», «directora», «aniversario» y «Halloween».
- Sin voces grabadas: Dave, Rosa y Zomboss hablan con globos de texto. Dave puede tener un «balbuceo»
  sintetizado.
- Liberar todo al salir: `requestAnimationFrame`, escuchas, `AudioContext` y lienzos.
- No tocar la granja, la casa ni otros juegos, salvo el texto del botón y la tarjeta del Jardín.

## Pruebas obligatorias

- `scripts/probar-pvz-motor.mjs` (Node + esbuild):
  - el piloto gana cada nivel construido con 3 semillas;
  - pierde sin defensa;
  - escenarios unitarios por planta y zombi especial;
  - costos, recargas, pala, sol recogido una vez, determinismo e inmutabilidad tras el fin.
- `scripts/probar-pvz-interfaz.mjs` (Playwright, Canvas 2D, 844 × 390 y 1280 × 720, toque):
  - título y aventura;
  - sembrar tocando y recoger sol;
  - nivel completo con el piloto;
  - planta nueva, guardado, recarga de página y fallo de guardado recuperado;
  - capturas en `test-results/pvz/`.
- El almanaque publicado permite revisar las plantas, zombis, ocho ropas y cuatro escenarios.
- `scripts/probar-pvz-arte.mjs`: cobertura de registros, recursos, hash visual y consultas puras.
- `scripts/probar-pvz-protecciones.mjs`: ocho variantes equipadas en movimiento, capturas y pérdida de armadura.
- `scripts/probar-pvz-abono.mjs` y `scripts/probar-pvz-guardado.mjs`: habilidades, progresión legal y fallos.
- `scripts/probar-pvz-persistencia-navegador.mjs`: contrato de motor y `localStorage` real, recarga, cuota,
  aislamiento de claves y archivos incompatibles. No sustituye la prueba visual de la aventura.
- Antes de publicar:
  - `npm run verificar:repo`, `npm run build` y `npm run build:amigos`, con su filtro;
  - las pruebas antiguas del Jardín y del duelo;
  - las pruebas nuevas.
