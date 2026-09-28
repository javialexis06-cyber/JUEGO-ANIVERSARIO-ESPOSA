# Reacciones de los muñequitos (Él y Ella)

Los dos personajes acompañan los minijuegos (juegos de mesa primero, luego el resto) y reaccionan a lo que pasa:
presumen una buena jugada, se enojan si el otro juega bien, hacen puchero si les va mal, etc.

Una reacción se arma en tres capas:

1. **Poses clave** (Blender → `el.glb` / `ella.glb`): una animación fija por pose, con el mismo esqueleto de siempre
   (`raiz, pelvis, torso, cabeza, brazo.L/R, mano.L/R, pierna.L/R, pie.L/R` + huesos de cara). Los brazos y las
   piernas son rígidos (no hay codo ni rodilla): el detalle sale de buenas siluetas, no de doblar articulaciones.
2. **Caras** (mallas de expresión ocultas que el juego muestra u oculta): ojos, cejas, bocas, lágrimas.
3. **Coreografía** (TypeScript, `src/reacciones/`): encadena poses con tiempos, alterna entre dos poses (vaivén),
   suma movimiento procedimental encima (salto con estirar y aplastar, temblor, cabeceo, zapateo, balanceo de cadera)
   y efectos 2D (confeti, gotita de sudor, venita de enojo, corazones, estrellas, lágrimas a chorro, «zzz», «?», «!»).

## Poses clave (nombre de la animación en el GLB)

Convención de lados: `.L` es la derecha del personaje cuando mira a la cámara. «Adelante» es hacia la cámara.

| Pose | Silueta |
|---|---|
| `presumir_a` | Mano derecha sobre el hombro izquierdo (se sacude el polvo), pecho afuera, mentón arriba, torso un poco atrás |
| `presumir_b` | La misma mano ya lanzada hacia afuera y abajo (terminó de sacudirse), cabeza ladeada con aires |
| `pulgares_a` | Los dos brazos al frente a la altura del pecho, manos arriba (pulgares arriba), sonrisa, torso adelante |
| `pulgares_b` | Igual pero brazos un poco más arriba y abiertos (bombeo) |
| `baile_a` | Brazos arriba en diagonal hacia un lado, cadera y torso inclinados al otro, un pie levantado |
| `baile_b` | Espejo de `baile_a` |
| `preparar_salto` | Anticipación: torso adelante, brazos atrás, cabeza abajo, raíz un poco abajo |
| `salto` | Brazos en V arriba, piernas hacia atrás (encogidas), cabeza arriba, raíz arriba |
| `puno_a` | Puño derecho arriba recto al cielo, mano izquierda en la cintura, cabeza arriba |
| `puno_b` | «¡Sí!»: el puño jalado hacia la cadera, torso encogido adelante, cabeza abajo, una pierna levantada |
| `musculo` | Los dos brazos abiertos a los lados a la altura de los hombros, manos hacia arriba (sacando músculo), pecho afuera |
| `jarras` | Manos en la cintura (brazos en ángulo hacia afuera), pecho afuera, mentón arriba (pose de poder) |
| `puchero` | Hombros arriba, brazos rectos pegados al cuerpo, cabeza abajo y ladeada, un pie pateando el piso |
| `facepalm` | Mano derecha tapando la cara, cabeza abajo, el otro brazo colgando |
| `rascarse` | Mano derecha detrás de la cabeza rascando, cabeza ladeada, torso ladeado |
| `triste_b` | Más encorvado que `triste`, brazos colgando adelante, cabeza muy abajo |
| `encogerse` | Encogerse de hombros: brazos abiertos abajo a los lados con las manos hacia arriba, cabeza ladeada |
| `llorar_a` | Los dos brazos arriba frotándose los ojos (manos a la cara), cabeza arriba (llanto a moco tendido) |
| `llorar_b` | Variante alterna de `llorar_a` (manos un poco corridas) para el vaivén |
| `rodillas_a` | De rodillas (piernas hacia atrás, raíz abajo), brazos al cielo, cabeza atrás («¿por qué?») |
| `rodillas_b` | De rodillas, torso adelante casi al piso, brazos apoyados abajo, cabeza abajo (derrotado) |
| `bandera` | Brazo derecho arriba ondeando (la bandera blanca va en la mano), el otro en el pecho, cabeza ladeada |
| `desmayo` | Dramático: dorso de la mano en la frente, torso hacia atrás, el otro brazo abierto |
| `tirado` | Estrella de mar: brazos y piernas abiertos (el juego lo acuesta en el piso) |
| `enojo_a` | Pisotón: brazos rectos abajo con puños apretados y separados, torso adelante, una pierna levantada |
| `enojo_b` | Espejo de `enojo_a` (la otra pierna) |
| `brazos_cruzados` | Brazos cruzados sobre el pecho, cabeza volteada a un lado y mentón arriba («de reojo») |
| `boca_abierta` | Sorpresa: manos a las mejillas, torso atrás, cabeza adelante |
| `aplauso_a` | Manos separadas al frente del pecho |
| `aplauso_b` | Manos juntas al frente del pecho |
| `senalar_a` | Señala al otro con el brazo derecho estirado, la otra mano en la barriga, torso atrás (riéndose) |
| `senalar_b` | Igual pero torso adelante (rebote de la risa) |
| `risita_a` | Mano derecha tapando la boca, hombros arriba, cabeza ladeada |
| `risita_b` | Variante de `risita_a` con la cabeza al otro lado |
| `beso_volado_a` | Mano derecha en la boca (el beso) |
| `beso_volado_b` | Brazo derecho estirado adelante y arriba soltando el beso, un pie atrás |
| `pensando_b` | Mano en la barbilla del otro lado, la otra cruzando la barriga, cabeza ladeada al otro lado |
| `reloj` | Brazo izquierdo al frente horizontal (mira el reloj de la muñeca), cabeza abajo hacia la muñeca |
| `impaciente_a` | Manos en la cintura, pie derecho arriba (zapateando) |
| `impaciente_b` | Manos en la cintura, pie derecho abajo |
| `bostezo` | Brazos estirados hacia arriba (desperezándose), torso atrás, cabeza atrás |
| `agitar_a` | Manos juntas ahuecadas al frente del pecho (agitando los dados), arriba |
| `agitar_b` | Igual, abajo |
| `soplar` | Manos juntas ahuecadas frente a la boca (soplándole a los dados) |
| `lanzar` | Brazo derecho estirado al frente, abajo, después del lanzamiento; torso adelante |
| `suplicar` | Manos juntas al frente de la cara (cruzar los dedos / rezar), cabeza arriba |
| `frotar_manos_a` | Manos juntas frente a la barriga (malvado), cabeza abajo |
| `frotar_manos_b` | Variante corrida para el vaivén |
| `contar_a` | Brazo derecho señalando abajo al frente (contando fichas), cabeza abajo |
| `contar_b` | Igual, un poco más a un lado |
| `inclinado` | Inclinado sobre el tablero: torso adelante, cabeza abajo, brazos un poco al frente |
| `trofeo` | Los dos brazos rectos arriba con las manos juntas (sosteniendo el trofeo sobre la cabeza) |
| `corona` | Las dos manos a los lados de la cabeza (acomodándose la corona), pecho afuera |
| `reverencia` | Torso adelante 45°, un brazo cruzando la barriga, el otro abierto atrás |
| `chocar_cinco` | Brazo derecho arriba y hacia el lado (hacia el otro personaje), torso ladeado hacia allá |
| `senalar_arriba` | «¡Otra!»: índice al cielo con el brazo derecho recto, el otro puño a la altura del pecho |

Se conservan las que ya existen (`reposo`, `feliz`, `triste`, `pensando`, `hablar_a/b`, `saludo_a/b`, `beso`,
`abrazo_izq/der`, `sentado`, `sentado_feliz`, ...).

## Caras

`Cara` en `src/personaje.ts`. Las piezas nuevas son mallas ocultas con el prefijo del personaje (`El | ...`).

| Cara | Ojos | Cejas | Boca | Extra |
|---|---|---|---|---|
| `normal` | abiertos | normales | sonrisa | |
| `feliz` | ^ ^ | normales | sonrisa | |
| `hablar`, `beso`, `triste`, `dormido` | (como antes) | | | |
| `enojado` | abiertos | `ceja enojo` (interior abajo) | `boca enojo` (apretada hacia abajo, dientes) | |
| `puchero` | abiertos | `ceja triste` (interior arriba) | `boca puchero` (labios hacia afuera, temblorosos) | |
| `sorprendido` | abiertos | `ceja arriba` | `boca o` | |
| `llorando` | `ojo apretado` (> <) | `ceja triste` | `boca llanto` (abierta, hacia abajo) | `lagrima` (chorros por las mejillas) |
| `carcajada` | `ojo apretado` (> <) | `ceja arriba` | `boca carcajada` (D grande con lengua) | |
| `concentrado` | `parpado medio` | `ceja enojo` suave | `boca recta` | |
| `aburrido` | `parpado medio` | normales | `boca recta` | |
| `guino` | uno abierto, el otro ^ | una arriba | `boca ladeada` | |
| `presumido` | `parpado medio` | una arriba | `boca ladeada` | |
| `nervioso` | abiertos | `ceja triste` | `boca ondulada` | |
| `bostezo` | cerrados (líneas) | normales | `boca o` grande | |

## Utilería (GLB aparte, se cuelga de un hueso en el juego)

`reaccion_trofeo.glb`, `reaccion_corona.glb`, `reaccion_bandera.glb`, `reaccion_panuelo.glb`, `reaccion_dados.glb`:
estilo plastilina de la casa, origen en el punto donde se agarra (o, en la corona, la base), Y arriba.
