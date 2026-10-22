# Plantas contra Zombis · arquitectura y contrato de trabajo

Avances del 19 de octubre: [base del motor](pvz-motor-2026-10-19.md) y
[abono, progreso y recuperación de guardado](pvz-abono-guardado-2026-10-19.md) y
[mundo nocturno](pvz-noche-2026-10-20.md), [piscina](pvz-piscina-2026-10-20.md) y
[niebla](pvz-niebla-2026-10-22.md).
Claude tiene todos los gráficos; Codex desarrolla motor, mecánicas, datos de niveles y pruebas.

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

Todo el arte, el sonido y la música se hacen aquí, en código: dibujos SVG propios del estilo PvZ, efectos y música
sintetizados con WebAudio. No se descargan ni se copian imágenes, sonidos, música ni textos largos del juego original.

## Qué se conserva

- `src/jardin/datos.ts`, `motor.ts`, `vista.ts`, `duelo*.ts` y `public/jardin/figuras.glb` quedan intactos:
  - los 12 patios pasan a «Patios clásicos», con la clave `jardin-v1` / `amigo-jardin-v1` y sus estrellas;
  - el duelo para dos (`jardin-duelo.html`) no cambia.
- `jardin.html` sigue siendo la página. Su `main.ts` pasa a ser la pantalla de título de PvZ, con accesos a la
  aventura, los modos, la fusión, los patios clásicos y el duelo.
- Las pruebas existentes (`probar-jardin-motor.mjs`, `probar-jardin-duelo.mjs`, `probar-jardin-interfaz.mjs`,
  `probar-jardin-duelo-interfaz.mjs`) deben seguir pasando. Si cambia el menú, se ajusta la prueba de interfaz, no
  la campaña clásica.

## Tecnología

- **Canvas 2D**, no three.js. PvZ es 2D y así corre fluido en celulares.
  - Un `<canvas>` a pantalla completa en horizontal y una capa HTML encima para la interfaz.
- **Personajes por piezas** (como el «reanim» de PvZ): cada planta y zombi es un conjunto de piezas SVG, como
  cabeza, hojas, tallo, brazos, piernas, accesorios y armadura.
  - Al cargar, cada pieza se rasteriza una vez a un lienzo fuera de pantalla con la escala y el `devicePixelRatio`.
  - Cada cuadro se dibuja con `drawImage` y transformaciones: rotación alrededor de un pivote, traslación y escala.
  - Las animaciones son procedurales (funciones de tiempo y estado), rebotonas y vivas como en PvZ.
- **Motor determinista** de paso fijo, separado de la vista. Corre en Node para las pruebas (esbuild, como
  `probar-jardin-motor.mjs`). Sin `Math.random` en el motor: usa el generador con semilla.
- Sin `import.meta.glob`, porque las pruebas usan esbuild. Los registros se importan de forma explícita en
  archivos índice.

## Archivos y dueños

```
src/jardin/pvz/
  tipos.ts                 contratos compartidos (no cambiar sin actualizar este documento)
  motor/motor.ts           MotorPvZ: cuadrícula, entidades, paso, siembra, sol, cortacéspedes, fin
  motor/oleadas.ts         director de oleadas al estilo PvZ 1
  motor/azar.ts            generador con semilla
  motor/bot.ts             piloto de pruebas y selección de seis sobres
  motor/bot-noche.ts       decisiones del piloto para noche y Aplastazombis
  motor/bot-piscina.ts     selección y decisiones acuáticas con seis ranuras
  motor/bot-niebla.ts      selección y órdenes legales de niebla y Rompejarrones
  motor/niebla.ts          iluminación, desplazamiento de niebla y reloj de tormenta
  motor/rompejarrones.ts   director de tres etapas, contenidos privados y sobres temporales
  motor/bot-minizombis.ts  decisiones legales de cinta para 3-5
  motor/piscina.ts         emboscada de la última oleada acuática
  motor/terreno.ts         distribución inicial y alzamiento de lápidas
  motor/aplastazombis.ts   director de 2-5, grupos, lápidas y soles al derrotar
  datos/plantas.ts         índice: junta las definiciones de cada área
  datos/zombis.ts          índice
  datos/niveles.ts         índice de niveles de aventura
  datos/<area>.ts          definiciones de plantas, zombis y niveles de un área (dia, noche, piscina, niebla,
                           tejado, tienda, rio, vias, desierto, paramo, invernadero)
  comportamiento/index.ts  registro de comportamientos
  comportamiento/<area>.ts comportamiento de las plantas y zombis de esa área
  comportamiento/zombis-noche.ts periódico y formación del bailón
  arte/piezas.ts           motor de arte: definiciones, rasterizado, caché, dibujo, tintes, retratos
  arte/estilo.ts           paleta, contornos y ayudantes SVG comunes (ojos, hojas, degradados, zombi base)
  arte/<area>.ts           arte de las plantas y zombis de esa área
  arte/fondos/<area>.ts    escenario de cada área
  arte/personajes.ts       Dave el Loco, Dr. Zomboss, Rosa (radio), el Zombi Cartero, la Chiva y las Zombots
  vista/escena.ts          dibuja el mundo: fondo, sombras, entidades por fila, proyectiles, soles, efectos
  vista/efectos.ts         partículas, textos flotantes, sacudidas
  ui/hud.ts                banco de semillas, sol, pala, abono, menú, barra de progreso
  ui/seleccion.ts          elegir semillas (con la cámara en la calle)
  ui/dialogo.ts            globos de Dave, Rosa, el Cartero y Zomboss
  ui/pantallas.ts          título, mapa, planta nueva, nota, derrota, victoria, almanaque, tienda, opciones
  ui/pvz.css
  historia/<parte>.ts      diálogos, notas y escenas
  sonido.ts                efectos y música sintetizados
  guardado.ts              progreso y persistencia (Codex; la interfaz llama a este contrato)
  aventura.ts              une motor, vista, interfaz y guardado para jugar un nivel
src/jardin/main.ts         pantalla de título y navegación (reemplaza el menú de patios)
src/jardin/clasicos.ts     los 12 patios de antes, movidos tal cual desde main.ts
```

- Cada área se trabaja en sus propios archivos. Con el reparto del 19 de octubre, Codex mantiene los índices
  de datos y comportamientos e incorpora cada área al construirla. Claude mantiene los registros gráficos;
  ampliar una zona no requiere que ambos editen los índices del otro.
- Lo que falte de arte se dibuja con un marcador simple, como un círculo con el nombre. Nunca debe romper el juego.

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

## Arte

- **Marco local por personaje.** Unidades de mundo, con el punto de apoyo (los pies o la base de la maceta) en
  `ancla`. Las plantas miden unos 70–90 de alto y los zombis unos 110–130, como en PvZ 1.
- **Pieza:**

  ```ts
  { id, svg /* fragmento SVG en el marco local */, pivote: [x,y], padre?: string, z: number,
    estados?: Record<string,string> /* p. ej. cono intacto/abollado/roto */ }
  ```

  El motor de arte recorta cada pieza a su contenido después de rasterizarla.
- **Animación:**

  ```ts
  anim(ctx: {t, estado, fase, semilla}) => Record<idPieza, {rot?, x?, y?, sx?, sy?, alfa?, oculto?}>
  ```

  - Estados de planta: `quieto`, `ataca`, `dormida` y `herida`.
  - Estados de zombi: `camina`, `come`, `muere`, `ceniza`, `nada`, `vuela`, `cava` y `salta`.
  - Los brazos y cabezas que caen se desprenden como partículas con física simple.
- **Estilo PvZ:**
  - contornos oscuros de 2.5–3 px (`#1d1408` aprox.), colores saturados y degradados suaves;
  - brillos blancos en ojos y hojas;
  - zombis con piel gris verdosa (`#9aa58a` aprox.), saco café, corbata roja y ojos desiguales;
  - plantas con cara expresiva.
  - El estilo se adapta, no se calca: las formas reconocibles de cada personaje, dibujadas por nosotros.
- **Tintes:** congelado (azul), hipnotizado (morado), destello blanco al recibir golpe, ceniza negra y
  mantequilla (pieza extra encima de la cabeza).
- **Retratos:** cada sobre de semilla usa un retrato renderizado del propio arte en pose `quieto`.
- Fondos dibujados por código en un lienzo que se guarda en caché:
  - **día:** casa a la izquierda, porche, césped de 9 × 5 con franjas claras y oscuras, cerca y acera, calle a la
    derecha, arbustos;
  - **noche:** colores fríos, luna y lápidas;
  - **piscina:** filas 3 y 4 de agua animada, bordes de baldosa;
  - **niebla:** como la piscina de noche, con niebla que tapa las columnas de la derecha;
  - **tejado:** tejas inclinadas y chimenea.

## Interfaz (PvZ 1 con detalles de PvZ 2)

- **Arriba a la izquierda,** el banco de semillas de madera:
  - contador de sol con su ícono a la izquierda;
  - sobres de 6 a 10 con el retrato y el costo debajo;
  - recarga como sombra que sube, y el sobre gris si falta sol;
  - pala a la derecha del banco y, junto a ella, el abono de PvZ 2 (hasta 3).
- **Arriba a la derecha,** el botón «Menú» con pausa, ×2, sonido, reiniciar y salir.
- **Abajo a la derecha,** la barra de progreso con banderas y la cabeza de zombi, y el nombre del nivel.
- **Mensajes grandes:**
  - «¡Preparados...», «¡Listos...», «¡A PLANTAR!»;
  - «¡Se acerca una oleada enorme de zombis!» y «¡ÚLTIMA OLEADA!»;
  - «¡LOS ZOMBIS SE COMIERON TUS SESOS!»;
  - la pantalla de planta nueva.
- **Sembrar:** tocar el sobre y luego la casilla, o arrastrarlo. Se muestra la planta fantasma y la sombra antes
  de soltar.
- **Soles:**
  - el del cielo baja meciéndose;
  - el de la planta salta;
  - al tocarlo vuela al contador;
  - desaparece a los ~8 s de quedar quieto.
- **Selección de semillas:** la cámara se desliza a la calle para mostrar los zombis del nivel, y el selector
  ofrece las plantas desbloqueadas. Botón «¡A jugar!».
- **Pantallas:** título, mapa de la aventura con caminos al estilo PvZ 2, almanaque, tienda de Dave, minijuegos,
  rompecabezas, supervivencia, fusión, patios clásicos y dos jugadores.
- Todo en español colombiano neutro, en horizontal, con botones de al menos 44 px y textos legibles en un
  celular de 844 × 390.

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
- `scripts/probar-pvz-interfaz.mjs` (Playwright, SwiftShader, 844 × 390, toque):
  - título y aventura;
  - sembrar tocando y recoger sol;
  - nivel completo con el piloto;
  - planta nueva, guardado, recarga de página y fallo de guardado recuperado;
  - capturas en `test-results/pvz/`.
- Galería de desarrollo `herramientas/pvz-galeria.html`, que Vite sirve y no entra al build: muestra todo el arte
  en todos sus estados, para revisar capturas.
- `scripts/probar-pvz-abono.mjs` y `scripts/probar-pvz-guardado.mjs`: habilidades, progresión legal y fallos.
- `scripts/probar-pvz-persistencia-navegador.mjs`: contrato de motor y `localStorage` real, recarga, cuota,
  aislamiento de claves y archivos incompatibles. No sustituye la prueba visual de la aventura.
- Antes de publicar:
  - `npm run verificar:repo`, `npm run build` y `npm run build:amigos`, con su filtro;
  - las pruebas antiguas del Jardín y del duelo;
  - las pruebas nuevas.
