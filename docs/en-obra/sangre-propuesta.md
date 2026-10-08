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

**L. Armas, sobrecargas, reliquias y el familiar (segunda lectura de la wiki, octubre de 2026)**

Lo que hay hoy en el código: 12 clases × 4 armas + 7 comunes = **55 armas**; **3 sobrecargas por arma** (en el nivel 6
se escoge 1 de 3, en el 12 1 de 2 y en el 18 sale la que queda: al final todas las tienen todas, sin escoger de
verdad); **14 evoluciones** (solo la primera arma de cada clase, las Dagas y la Bomba); 12 etiquetas, y las mejoras de
etiqueta salen aunque se tenga una sola arma de esa etiqueta (solo pesan más); 18 reliquias; ningún compañero.

Lo que hace Deep Rock Galactic: Survivor (páginas «Weapons», «Overclock», «Level-up improvements», «Artifacts», «Class
Mods», «Gear» y «Bosco»):
- ~50 armas con **cuatro grupos de etiquetas** (tipo de daño, familia, tipo y forma de disparo).
- Por arma, **4-6 sobrecargas balanceadas** (en el 6 y el 12 se escoge 1 de 3) y **2-3 inestables** (en el 18, 1 de 2-3):
  muy fuertes con contra, o cambian cómo dispara. Algunas **cambian el elemento** («Balas de batería»: la escopeta pasa
  a eléctrica).
- **Cuatro etiquetas especiales** que solo dan las sobrecargas: *Akimbo* (dispara también hacia atrás), *Sidearm* (el
  arma pega menos y las demás +25 %), *The Favourite* (+100 % a esta, −30 % a las demás) y *Thick Boy* (todos los
  proyectiles en uno solo enorme). Con dos armas de la misma etiqueta especial salen sus mejoras.
- Las **mejoras de etiqueta solo salen con dos armas de esa etiqueta**: eso es lo que arma las «builds».
- Las **subclases abren todas las armas de una etiqueta** («todas las de fuego y ácido», «todas las arrojadizas»).
- **Artefactos** que se abren con proezas («esquiva 100 veces», «muere 3 veces», «haz 1 337 de un golpe»).
- **Bosco**, el dron que acompaña y dispara solo; su ataque cambia con el «chip» del equipo.
- Torretas que se ponen **quedándose quieto**, minas, drones, granadas de racimo, rayos que rebotan en las paredes.

Propuesta:
1. **Seis sobrecargas por arma** (hoy 3): 4 **templadas** (en el 6 y el 12 se escoge 1 de 3) y 2 **malditas** (en el
   18, 1 de 2: muy fuertes con su contra). Las malditas traen las etiquetas especiales, en versión de Valdemora: **A dos
   manos** (Akimbo), **De cinto** (Sidearm), **La consentida** (The Favourite) y **Bala gorda** (Thick Boy), con sus
   mejoras cuando dos armas la comparten. Algunas templadas **cambian el elemento** (virotes de plata: la ballesta pasa
   a sagrada; hoja envenenada; martillo al rojo). Son ~165 sobrecargas nuevas, casi todas con las banderas que ya
   existen (`F.DETRAS`, `F.DOBLE`, `F.GIRA`…).
2. **Evoluciones para todas las armas** (hoy 14 de 55): cada arma con su objeto pareja en la Forja, más **uniones** de
   Vampire Survivors (dos armas al máximo se vuelven una sola y **liberan un espacio**, que con solo 4 espacios vale
   oro): Agua bendita + Cruz de plata, Estacas + Ballesta, Huesos + Campana fúnebre, Plumas negras + Bastón de
   cuervos… Cada evolución nueva lleva su ícono renderizado.
3. **Trece armas comunes nuevas** (hoy 7) para llegar a 20, lo de DRG en versión medieval: **Frasco de aceite
   hirviendo** (fuego en el piso), **Frasco de escarcha**, **Humo de azufre** (veneno en nube), **Bomba de racimo**,
   **Abrojos** y **Cepos** (minas), **Ballesta de pie** (torreta que se pone quedándose quieto), **Cuervos cazadores** y
   **Murciélagos guardianes** (drones), **Látigo de espinas** (hacia atrás, como la Subata), **Rayo de sangre** (un haz
   que rebota en las paredes, como el plasma), **Lanza de fuego giratoria** (como el lanzallamas) y **Perdigonera**
   (escopeta de cerca). Cada una con su modelo en `armas.glb` y su ícono.
4. **Potencia y daño de estados**: dos estadísticas nuevas (cuántas cargas de quema, veneno, sangrado o frío pone
   cada golpe, y cuánto pegan esas cargas), con sus mejoras de nivel, de la Forja y del Pozo (D), y la regla de DRG:
   las mejoras de etiqueta solo salen con **dos armas** de esa etiqueta.
5. **Especializaciones que abren armas**: además de lo que hacen hoy, cada especialización suma a lo que se encuentra
   todas las armas de una etiqueta (Pirómano → todas las de fuego; Nigromante → las de invocación; Ingeniero → las de
   construcción; Francotirador → las de distancia; Envenenador → las de veneno…).
6. **Reliquias por hitos**: de 18 a ~43, y las nuevas se abren con proezas de la cuenta (como los artefactos de DRG):

   | Reliquia | Qué hace | Se abre con |
   |---|---|---|
   | Libro de rencores | +10 % de experiencia y experiencia al recibir daño | desde el comienzo |
   | Corazón confitado | cada corazón de vela sube +3 la vida máxima | desde el comienzo |
   | Herradura vieja | +15 de suerte; al volver a tirar, +20 más por 5 s | escoger suerte 5 veces en una expedición |
   | Bandolera | +50 % de velocidad de ataque, −15 % de velocidad | llegar a +75 % de velocidad de ataque |
   | Grimorio olvidado | ganas 3 niveles | nivel 50 en una expedición |
   | Grasa de armadura | +5 % de velocidad; caminando, la esquiva sube | esquivar 100 golpes en una expedición |
   | Tasajo y pan duro | +80 de vida y +2 de vida por segundo | llegar a 300 de vida máxima |
   | Cinto de brasas / de escarcha | +15 % fuego / hielo; al recibir un golpe, anillo de fuego / de frío | 250 000 de daño de fuego / de hielo |
   | Estuche del boticario | +15 % de potencia y de daño de estados | 2,5 millones de daño de estados en una expedición |
   | Imán del gremio | al final de cada etapa recoge la mitad de las almas | recoger 25 imanes |
   | Diario del difunto | +10 % de daño y de cadencia, +5 % de crítico, +15 % de daño crítico | morir 3 veces |
   | Bula del obispo | la Forja cobra 20 % menos | gastar 2 500 de oro |
   | Varita de zahorí | a veces sale oro al picar roca | recoger 250 de oro |
   | Queso podrido | atrae ladrones de tumbas (bichos del botín) | tumbar 3 ladrones en una expedición |
   | Botas de salto | al recibir un golpe, das un salto para escapar (cada 20 s) | romper 200 rocas en una expedición |
   | Navaja multiusos | −25 % de cadencia, +5 % por cada etiqueta distinta | hacer 5 tipos de daño en una expedición |
   | Dado del tahúr | +2,5 % de daño cada vez que vuelves a tirar algo | gastar 20 000 de oro |
   | Pico largo | más alcance al excavar | excavar toda la roca de una etapa |
   | Hierro en salmuera | +2 % de daño y −0,5 % de velocidad por cada hierro en el bolsillo | hacer 1 337 de daño de un golpe |
   | Puntas de acero | +50 % de perforación | disparar 150 000 proyectiles |
   | Trípode | quieto, +2 % de cadencia por segundo (hasta 15) | 15 000 muertos sin moverse |
   | Costra | +1 de armadura por cada 2 % de vida que falta | llegar a 50 de armadura |
   | Monóculo | +30 % de crítico y +100 % de daño crítico, −30 % de daño | llegar a 75 % de crítico |
   | Galleta de monje | al bajar a la etapa siguiente te cura la mitad | curar 500 en una etapa |
   | Cicatriz | +1 % de daño por cada 1 % de vida que falta | matar al jefe con menos de 30 de vida |
   | Engranaje del relojero | +3 % de daño y de cadencia por cada sobrecarga | 10 sobrecargas en una expedición |

7. **El familiar** (el Bosco de DRG): un compañero que sigue al jugador y ataca solo. Una ranura nueva de equipo, el
   **familiar**, define cuál: cuervo (picotazos, el de siempre), linterna de ánimas (sombra; recoge almas cerca),
   sapo de la bruja (veneno; charcos), salamandra (fuego; tira brasas), lechuza de escarcha (hielo; frasco helado),
   perro de huesos (físico; excava lo que pisa) y campanita de plata (no pega, pero suma dos etiquetas al azar a lo que
   se encuentra, como el «Support Chip»). Cae de los jefes con rareza, como el resto del equipo (K).
8. **Forja con tres mostradores** (como la tienda de DRG): mejoras de un arma con hierro negro, de etiqueta con oro y
   del personaje con oro, con precio por rareza (común, poco común, rara, épica, legendaria), y **curar 50 %** con oro
   que sube cada vez.

---

## 4. En qué orden lo haría

1. **Fase 1 (lo que más se siente, ~1-2 sesiones)**: A (etapas que se ganan peleando, Guardián, la Noche se
   impacienta, 5 etapas), E (precios que suben, vetas más pobres, ratas del tesoro, mini-élites) y los secundarios
   nuevos. Medir con el bot hasta llegar a las metas de E.
2. **Fase 2**: D (seis minerales y el Pozo con materiales), C (cofre de suministros), F (reglas de cada bioma) y de L
   las sobrecargas nuevas, la potencia y la regla de las dos armas (L1 y L4).
3. **Fase 3**: G (mapa de la Noche con historia y los retos por bioma y clase) y los logros en la Sala de Trofeos; de
   L, las evoluciones y uniones, las armas comunes nuevas y las especializaciones que abren armas (L2, L3 y L5).
4. **Fase 4**: B (La Procesión y La Cría), H (maestrías, anómalas, contratos y mutadores), I (infinito que crece) y las
   reliquias por hitos (L6).
5. **Fase 5**: J (refugio con minijuegos), K (equipo con rarezas especiales), el familiar y la Forja con tres
   mostradores (L7 y L8). Y los íconos más elaborados de las mejoras (pedido aparte, que va con esto porque llegan
   muchas cosas nuevas).

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
8. **Armas** (L): ¿todo (6 sobrecargas por arma, evolución para todas, 13 comunes nuevas) o una parte?
9. **El familiar** (L7): ¿lo metemos?
