# Sangre y Ceniza · propuesta para la versión 2 (para pulirla juntos)

Pedido de Javier: más misiones y que de verdad llenen la etapa; más dificultad (ganó la primera expedición en peligro
2 en 10 minutos sin sufrir y le sobraron 200 de sangre y 500 de oro); estudiar cómo lo hace **Deep Rock Galactic:
Survivor** (minería, varios minerales, mejoras que piden materiales distintos, tipos de misión, dificultad, modo
historia, minijuegos, logros de «tal mapa con tal personaje») y el **modo infinito** con el mapa que crece mientras
más se baja. Nada de esto se ha programado todavía: primero se pule aquí.

Fuente: la transcripción de la wiki oficial que hizo Javier (deeprockgalactic.wiki.gg, páginas «Survivor:», 134
páginas, octubre de 2026; guardada en [`docs/referencias/drg-survivor/wiki.md`](../referencias/drg-survivor/wiki.md)),
más las notas de la actualización del modo infinito (abril de 2026).

---

## 1. Lo que hace Deep Rock Galactic: Survivor (lo que nos sirve)

**La expedición («dive») y la etapa**
- Misión principal **Eliminación**: 5 etapas. Cada etapa trae un goteo de bichos y **oleadas** (1 en la etapa 1, 2 en
  la 2, 3 en la 3 y la 4); la etapa **no termina con un reloj: termina cuando matas al élite** que sale al final. Si te
  demoras con el élite, sube la **Amenaza alienígena** (+1 cada 60 s): los bichos se ponen más bravos.
- A mitad de cada etapa, Control de Misión marca una **zona de aterrizaje**: hay que **excavar** todo lo marcado y
  pararse ahí para que baje la **cápsula de suministros**, que da a escoger 1 de 3 **artefactos** (las reliquias de
  ellos: «+50 % cadencia, −15 % velocidad», «+1 % de daño por cada 5 de oro que tengas», «ganas 3 niveles»…).
- La última etapa: **4 capullos** con élites adentro (se rompen a mano o se abren solos si matas suficientes bichos)
  y después el **Acorazado** (el jefe, 50 % de las veces son dos gemelos).
- **Secundarios** opcionales que pagan oro y experiencia: 6 flores Apoca, 12 hongos Boolo o 20 de morkita. No hay
  secundario en la etapa final.

**Tres tipos de misión** (y cada uno con su propio camino de progreso)
- **Eliminación** (5 etapas, lo de arriba).
- **Escolta** (3 etapas): una perforadora avanza **solo si le llevas combustible** que se mina (esquisto) y te quedas
  en su radio; al final de cada etapa hay que **armar detonadores** a punta de pico; jefe final: un corazón de piedra
  al que la perforadora le pega mientras tú la defiendes de los «rayeros» que la apagan.
- **Cacería de huevos** (3 etapas): sacar huevos de las paredes y llevarlos al contenedor central en forma de estrella
  (ir y volver bajo fuego); al llegar a la cuota hay un **ratico extra para arriesgarse** por más botín; el último huevo
  despierta un jefe de varias fases que suelta brotes que hay que destruir para poder pegarle.

**La economía de una partida**
- **Oro**: mejoras del personaje y de etiquetas en la tienda entre etapas, curar 50 % (30 de oro), volver a tirar
  cartas. **Las tiradas suben de precio**: 5, 7, 10, 14, 20, 28, 39, 55, 77, 108…
- **Nitra**: mejoras de un arma (14 / 18 / 24 / 38 según la rareza) y volver a tirar artefactos.
- **Azúcar roja**: cura en el momento (vetas rojas en las paredes).
- Las armas suben de nivel con cartas; en los niveles **6 y 12** se escoge una sobrecarga balanceada y en el **18** una
  inestable (muy fuerte con contra).
- **Etiquetas**: cada arma tiene etiquetas (tipo de daño, familia, tipo, forma de disparo). Con **dos armas de la misma
  etiqueta** se abren cartas que mejoran a todas las de esa etiqueta. Eso arma «builds» de verdad.

**Lo permanente**
- **Seis minerales** que se excavan en las partidas (uno por veta, y cada bioma es rico en dos): cada uno compra
  **tres** mejoras permanentes. Bismor → vida, daño, recarga · Croppa → armadura, minería, cadencia · Perla Enor →
  radio de recoger, experiencia, potencia · Jadiz → nitra inicial, crítico, daño crítico · Magnita → oro inicial,
  daño de estados, regeneración · Umanita → suerte, velocidad, tirar artefactos. Cada nivel cuesta créditos **más** su
  mineral, y sube: 500 → 500 + 5 → 1 000 + 10 … → 16 000 + 160. Hay un **mercado** (comprar mineral a 400, vender a
  200) para no quedarse trabado por uno solo.
- **Créditos**: por todo lo recogido (aunque se gaste), por cada bicho, por cada nivel y más en peligro alto.
- **Equipo** (desde la 1.0): cae del jefe (seguro) y a veces de los bichos; 4 rarezas; 6 ranuras (armadura, bote,
  chip del dron, aparato, herramienta, mod del arma); estadísticas + **rarezas especiales** («cúrate 12 % al matar un
  élite», «+30 % velocidad 30 s al salir de la cápsula»). Su nivel sube con hitos de toda la cuenta.
- **Hitos**: todo se desbloquea con metas, no con dinero. Armas por rango de la clase (3, 6, 12, 15, 21, 24, 27).
  Artefactos con proezas raras: «llega a 300 de vida» → ración BLT; «esquiva 100 veces» → grasa de armadura; «muere 3
  veces» → el manual del buzo; «haz 1 337 de daño de un golpe» → nitra en vinagre. Subclases por rango.
- **Maestrías** (dan bonos permanentes y «puntos de maestría»):
  - de **arma**: 3 etapas con **una sola arma** → +12 % permanente a una estadística de esa arma;
  - de **subclase**: 5 etapas en mapa chico, **sin curación** (ni azúcar, ni regeneración, ni curar al subir), con
    descuento en la tienda;
  - de **bioma**: **10 etapas**, jefe en la 5 y en la 10, dos élites en la 6-9 → bono permanente del bioma.
- **Expediciones anómalas** (se abren con puntos de maestría): *Aprendiz sangriento* (te duele subir de nivel, +100 %
  XP), *Empleado del mes* (los bichos no dan XP, minar da +300 %), *Locura de mutadores*, *Sin moverse* (solo los
  primeros 5 s), *Hardcore* (−90 % de vida), *Vainilla* (sin equipo ni mejoras).
- **Contratos**: uno **diario** (1 mutador bueno y 2 malos, restricciones de clase, bioma o armas) y uno **semanal**
  más duro (1 bueno y 3 malos); la primera vez pagan doble y dan equipo épico/legendario seguro.

**El progreso por sectores (lo más parecido a una campaña)**
- No tienen modo historia con escenas: tienen un **mapa de sectores**. En el sector 1 están los 6 biomas; cada nodo
  bioma-misión tiene **3 metas** (terminarlo + 2 retos de ese lugar: «sube el GK2 a nivel 12», «recoge 200 de oro»,
  «revienta 35 plantas explosivas», «quédate quieto 45 s», «llega a nivel 60 con el Juggernaut»). Las metas dan
  puntos que abren los siguientes nodos. Al final del sector, una **misión-puerta** con reglas fijas (peligro mínimo,
  un artefacto de arranque, un mutador bueno y dos malos). Cada sector siguiente exige más peligro y trae mutadores.
- Los biomas tienen **reglas propias**: lava que quema y plantas que explotan (Núcleo de magma), enredaderas que
  vuelven a crecer y espinas que cortan (Rama hueca), estalactitas que caen si rompes los cristales rojos y piso que se
  hunde (Pozos de sal), saltadores y círculos de cristal que curan con oleadas a ráfagas (Bosque azul), hielo que
  resbala y carámbanos-trampa (Estratos glaciares). Y sube la dificultad base: +5 %, +10 %, +15 %…
- **Mutadores**: ~20 buenos («+20 % XP», «vetas enormes de oro y nitra», «+500 % vida pero nada cura») y ~60 malos
  («los bichos +20 % velocidad», «precios +50 %», «oleada al llamar la cápsula», «fantasma inmortal que te persigue»,
  «tus armas se encasquillan», «el minimapa falla», «cuevas oscuras», «cada 10 s pierdes 2,5 % de vida»).
- **Bichos pasivos**: el **bicho del botín** (no ataca; al reventarlo suelta oro y nitra), el **dorado** (raro, mucho
  oro) y el **Huuli** (huye, suelta un cofre que puede traer artefactos). **Mini-élites** morados mezclados en la horda
  y los **guardianes** que dan un escudo a los bichos alrededor hasta que te metes en su círculo.
- **Infinito** (abril de 2026): las **10 primeras etapas son más cortas y más densas** (subes de poder rapidísimo) y
  **desde la 11 la dificultad salta**; los artefactos tienen tope (15), así que cada uno pesa. Se puede guardar a
  mitad de partida.
- La armadura vale menos mientras más hondo: reducción = armadura / (armadura + 10 × (etapa + 1)).

**Lo que NO tienen**: modo historia con escenas ni minijuegos dentro de Survivor (los minijuegos —patear el barril, el
bar, la máquina de botas de salto— son de la nave del Deep Rock Galactic grande). Tienen retos semanales de la
comunidad en Discord.

---

## 2. Cómo está Sangre y Ceniza hoy (por qué se siente corto y fácil)

- **La etapa se acaba sola**: el objetivo se cumple en 2-3 minutos y el reloj salta a 1 minuto; la campana baja aunque
  no haya pasado nada más. Ganar no exige pelear con nada al final de la etapa (solo en la cuarta).
- **Poca variedad**: 6 objetivos principales y 3 secundarios, con metas fijas; 6 eventos.
- **Sobran recursos**: el yunque (4 + 2 × nivel), el altar de sangre (6 + 6 × sobrecargas) y renovar la Forja (3 + 3
  por vez) son baratos para lo que da la minería después del último ajuste, y las vetas pagan mucho. No hay nada en qué
  gastar el excedente ni nada que se pierda.
- **La minería solo sirve dentro de la partida**: hierro, oro y sangre se gastan en la Forja; lo permanente es solo la
  ceniza (Pozo de las Almas, 13 mejoras).
- **La dificultad sube por reloj, no por presión**: con buena build la horda nunca alcanza, y el peligro 2 se gana
  la primera vez.
- **Progreso permanente plano**: maestría por clase (15 niveles), 34 logros generales; no hay metas por bioma ni por
  clase en tal bioma, ni algo que «abra» el mundo de a poquito.

---

## 3. La propuesta (de la A a la K)

**A. Etapas que se ganan peleando (el cambio que más se va a sentir)**
- La etapa ya no tiene «campana en m:ss». Tiene una **barra de avance** con hitos (como DRG): goteo → 1.ª oleada →
  **Cofre de suministros** (ver C) → 2.ª oleada → **el Guardián** (un élite fuerte con su barra de vida y su música).
  Al matarlo, baja la campana. Oleadas por etapa: 1 / 2 / 3 / 3, y en la final los **4 sepulcros** (élites adentro)
  y el **jefe del bioma**.
- El objetivo principal ya no se «acaba temprano»: **es lo que hace avanzar la barra** (cada vena, altar o prisionero
  empuja la barra). Si no lo haces, la barra avanza sola pero mucho más despacio y sin botín.
- **La Noche se impacienta** (la amenaza de ellos): desde que sale el Guardián, cada 45-60 s sube un punto: la horda
  sale más rápida y más dura. Quien se demora, sufre.
- Duración esperada: 6-8 min por etapa, 30-40 min la expedición completa.

**B. Más misiones, con estructura propia**
- **Expedición** (la de hoy, 5 etapas en vez de 4 + jefe).
- **La Procesión** (como la escolta): la **carreta de reliquias** solo avanza con **aceite de lámpara** que se excava
  de vetas negras y se le lleva; al final de cada etapa hay que **romper los sellos** de una reja con el arma o el
  pico mientras te atacan; jefe: **el Relicario**, que hay que abrir protegiendo la carreta de los monjes que la
  apagan. 3 etapas.
- **La Cría** (como los huevos): **huevos de gárgola** en las paredes que hay que cargar (uno a la vez, te pone lento)
  hasta el **osario** del centro; al llegar a la cuota, 30 s para arriesgarse por más; el último huevo despierta a
  **la Madre de Piedra** (fases con brotes que la protegen). 3 etapas.
- Objetivos de etapa nuevos para todas: **Exorcismo** (purificar 3 campanas mientras se cargan, con espectros que las
  apagan), **Cosecha de sangre** (llevar cristales de sangre a un cáliz), **Rescate** (prisioneros que hay que escoltar
  hasta la campana, no solo liberar), **Cacería** (el élite huye y hay que acorralarlo).
- **Secundarios** (8, con metas que suben con el peligro): rosas negras, hongos de tumba, mercurio, campanitas de
  plata, huevos de dragón, frascos, cofres con llave, **ratas del tesoro** (ver E).

**C. El Cofre de suministros (reliquias a mitad de etapa)**
- A mitad de cada etapa se marca un **círculo con tierra encima**: hay que excavarlo entero y quedarse adentro mientras
  baja un **ataúd de suministros** con cadenas. Abre **1 de 3 reliquias** (las 18 de hoy + nuevas con contrapartida
  y de hitos). Tope de reliquias en el infinito: 15.

**D. Seis minerales y el Pozo con materiales (lo que pidió de la minería)**
- Seis minerales que se excavan (vetas sueltas, una por casilla, con su color y brillo en la visión astral) y que **no
  se gastan en la partida**: se llevan a casa. Cada bioma es rico en dos:

  | Mineral | Mejora del Pozo | Rico en |
  |---|---|---|
  | **Plata de luna** | vida máxima · daño · recarga | Cementerio, Castillo |
  | **Obsidiana** | armadura · excavar · cadencia | Minas, Abadía |
  | **Ámbar de cripta** | radio de recoger · experiencia · potencia | Catacumbas, Cementerio |
  | **Rubí de sangre** | oro inicial · crítico · daño crítico | Castillo, Minas |
  | **Azufre** | daño de estados · regeneración · bendiciones | Abadía, Minas |
  | **Hueso de santo** | suerte · velocidad · tirar reliquias | Catacumbas, Abadía |

- Cada nivel del Pozo cuesta **ceniza + su mineral**, y sube (como en DRG: 2, 5, 10, 10, 15, 15, 20…). Un **mercader**
  en el refugio cambia minerales (caro: 2 por 1) para no quedarse trabado.
- Dentro de la partida siguen el **oro** (mejoras generales, curar, tirar cartas), el **hierro negro** (mejorar
  armas) y la **sangre cristalizada** (sobrecargas), más **corazones de vela** que curan al momento (la azúcar roja).

**E. Dificultad y economía (que sea retador y que nada sobre)**
- **Todo lo que se repite sube de precio**: renovar la Forja 5, 7, 10, 14, 20, 28…; el yunque y el altar suben con el
  nivel del arma y con la etapa; curar 50 % en la Forja cuesta oro (y sube).
- **Vetas más pobres y más escondidas**; el botín grande viene de los **bichos del botín**: las **ratas del tesoro**
  (huyen, sueltan oro y hierro), la **rata dorada** (rara, mucho oro) y el **ladrón de tumbas** (huye; al caer suelta
  un cofre que puede traer reliquia).
- **Mini-élites** morados mezclados en la horda desde la etapa 2, y los **guardianes** (le dan escudo a la horda
  alrededor hasta que te metes en su círculo) desde el peligro 3.
- **Peligro** con números de verdad: 1 (aprender), 2 (la primera vez se pierde más o menos la mitad), 3-5 con más vida,
  daño y velocidad de la horda, menos curación y la armadura que rinde menos mientras más hondo.
- Meta medible con el bot: el bot «que empieza» gana el peligro 1 casi siempre, el peligro 2 un 40-50 % y el 3 un
  15-25 %; el bot bueno, el peligro 3 un 50 %.

**F. Reglas propias de cada bioma**
- **Cementerio**: tumbas que se abren solas y sueltan muertos; niebla que tapa (la linterna importa).
- **Catacumbas**: techos que se desploman si rompes las columnas de hueso (como las estalactitas); agua negra que
  frena.
- **Minas**: grisú: vetas de gas que explotan al picarlas; vagonetas sueltas que atropellan (a ti y a la horda).
- **Abadía**: piso en llamas, vitrales que caen; campanario que llama oleadas si lo golpeas.
- **Castillo**: trampas de pinchos, armaduras que despiertan, espejos que duplican vampiros.

**G. El mapa de la Noche (modo historia + logros por bioma y por clase)**
- Un **mapa de sectores** como el de DRG, pero con **historia**: el reino de Valdemora dividido en 4 sectores
  (Afueras, Subsuelo, Santuario, Corte del Conde). Cada nodo = bioma + tipo de misión, con **3 metas**: terminarlo + 2
  retos de ese lugar y de una clase («gana el Cementerio con el Sepulturero levantando 300 esqueletos», «recoge 40
  piedras de azufre en la Abadía», «revienta 30 vetas de grisú en las Minas», «llega a nivel 50 con la Bruja en el
  Castillo»). Las metas abren los nodos siguientes.
- Al final de cada sector, una **Puerta** (misión fija con reglas, un mutador bueno y dos malos) y una **escena corta**
  (diálogo del Conde Sangrevil y de los sobrevivientes, ilustración) que avanza la historia. El último sector termina
  en el Castillo con el Conde: el final de la historia.
- Cada sector exige un peligro mínimo (sector 2 = peligro 2+…).
- Estos retos son los **logros de «tal mapa con tal personaje»** que pidió Javier: quedan en la Sala de Trofeos.

**H. Maestrías, expediciones anómalas y contratos**
- **Maestría de arma** (3 etapas, una sola arma, +12 % permanente a esa arma), **de clase** (5 etapas, mapa chico,
  sin curación) y **de bioma** (10 etapas, jefe en la 5 y la 10). Dan **puntos de maestría**.
- **Expediciones anómalas** con los puntos: *Aprendiz sangriento*, *Solo minería* (los muertos no dan almas, excavar
  da el triple), *Locura de mutadores*, *Sin moverse*, *Un golpe y adiós* (−90 % vida), *A la antigua* (sin Pozo ni
  equipo).
- **Contrato del día** y **de la semana** con mutadores y restricciones; **el mismo para los dos** (Javier y Laura
  pueden comparar quién llegó más lejos), y para los amigos en su sala.
- **Mutadores**: pasar de 10 a ~30 (10 buenos y 20 malos), sacados de la lista de DRG en versión oscura (luna
  sangrienta, fantasma inmortal del Conde, armas que se oxidan, campana borracha que se va antes, niebla, peste…).

**I. Infinito que crece mientras más se baja**
- Las **primeras 10 etapas cortas y densas** (subes rápido de poder) y **desde la 11, el salto de dificultad**.
- **El mapa crece** con la profundidad: 68 × 68 al empezar, +6 por cada 4 etapas hasta 110 × 110, con más vetas y
  más secundarios; cada 4 etapas cambia de bioma y aparecen **capas mezcladas** (catacumbas debajo del cementerio,
  minas debajo de las catacumbas…).
- Tope de 15 reliquias; guardar a mitad de la partida (para el celular).

**J. Refugio con minijuegos (entre expediciones)**
- El menú entre partidas se vuelve un **refugio**: la Forja permanente, el Pozo, el mercader de minerales, el mapa de
  la Noche y **tres minijuegos chiquitos** para cuando se espera al otro en la sala: **patear el barril** (puntería con
  rebote), **la taberna** (un juego de dados de apuesta con ceniza de mentiras) y **la campana de práctica** (sin fin,
  esquivar con un tope de récord).

**K. Equipo con rarezas especiales**
- El equipo de hoy (36 piezas) pasa a tener **4 rarezas** y **1-2 rarezas especiales** al estilo DRG («cúrate 12 % al
  matar un élite», «+30 % de velocidad al salir de la campana», «10 % de que salga una rata dorada»), cae seguro del
  jefe y sube de nivel con los hitos de la cuenta.

---

## 4. En qué orden lo haría

1. **Fase 1 (lo que más se siente, ~1-2 sesiones)**: A (etapas que se ganan peleando, Guardián, la Noche se
   impacienta, 5 etapas), E (precios que suben, vetas más pobres, ratas del tesoro, mini-élites) y los secundarios
   nuevos. Medir con el bot hasta llegar a las metas de E.
2. **Fase 2**: D (seis minerales y el Pozo con materiales), C (cofre de suministros) y F (reglas de cada bioma).
3. **Fase 3**: G (mapa de la Noche con historia y los retos por bioma y clase) y los logros en la Sala de Trofeos.
4. **Fase 4**: B (La Procesión y La Cría), H (maestrías, anómalas, contratos y mutadores) e I (infinito que crece).
5. **Fase 5**: J (refugio con minijuegos) y K (equipo con rarezas especiales). Y los íconos más elaborados de las
   mejoras (pedido aparte, que va con esto porque llegan muchas cosas nuevas).

---

## 5. Preguntas para pulirla

1. ¿**5 etapas** como DRG (4 + la final con los sepulcros y el jefe) o dejamos 4? Con A, cada expedición dura 30-40
   minutos.
2. Los **seis minerales**: ¿te gustan esos nombres (plata de luna, obsidiana, ámbar de cripta, rubí de sangre, azufre,
   hueso de santo) o prefieres otros?
3. **Historia**: ¿escenas cortas con diálogos entre sectores (texto e ilustración) o solo el mapa con los retos?
4. **Contratos**: ¿el contrato del día igual para los dos, para competir por quién llega más lejos?
5. **Dificultad**: ¿la meta de E te parece bien (peligro 2 = la primera vez se pierde más o menos la mitad)?
6. **Refugio**: ¿esos tres minijuegos o tienes otros en mente?
7. ¿Algo de DRG que no esté aquí y quieras sí o sí (equipo con rarezas, el dron que acompaña, los gemelos jefes…)?
