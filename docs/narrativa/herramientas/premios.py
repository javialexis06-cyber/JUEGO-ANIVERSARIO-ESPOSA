"""Utilidad concreta de cada premio; IDs narrativos, no objetos implementados."""
EFECTOS = {}
def grupo(texto):
    for linea in texto.strip().splitlines():
        id,efecto=linea.split('|',1);EFECTOS['V_'+id]=efecto

grupo('''
mercader|Consulta de reservas comunitarias por especie y procedencia; no sustituye desbloqueos estacionales de colecciones.
cuidadora|Plan de relevo de cuidado con ración, responsable y reserva; no ejecuta cuidados ni adelanta 48 horas reales.
carpintera|Módulo de acceso reparable para entrada existente, con la misma huella y prueba de paso antes de integrarlo.
herrero|Ficha de control de fatiga y método de forja alternativo; no suma reducción a recetas mineras ya aprendidas.
veterinaria|Comparador de refugio, alimento y síntoma con límites de observación; deriva a consulta, no prescribe automáticamente.
posadera|Variante de presentación de menú de sopa con mismas entradas, porciones y energía que la receta base elegida.
archivero|Vista de original, corrección y procedencia de documentos autorizados; mantiene privadas las partes no consentidas.
canalizadora_aura|Participación o visita a rito pequeño, incluido descanso; ninguna rama da bendición estadística mayor.
canalizadora_lara|Espacio de recuerdo con lectura, silencio o ausencia; registra permiso y permite retirar una inscripción.
pescadora|Calendario de presión de pesca por puntos visitados; conserva horarios, probabilidades y cuotas reales.
minero|Mapa anotable de retirada con incertidumbres y balizas; no revela mineral, pisos ni tesoros sin recorrer.
exploradora|Comparador de distancia, sombra y obstáculos de rutas conocidas, con fecha y costo de regreso.
cocinero|Variante de emplatado del menú con mismas recetas y cupos; no transforma sobrantes en nuevos productos gratis.
botanica|Comparador de dos surcos con condiciones observadas, autoría y calendario sin modificar su crecimiento.
agricultor|Plan de acequia con consumos y turno acordado; no abastece parcelas ni fabrica agua al consultarlo.
maestra|Página de tutorial con ejemplo seguro y corrección consultable; no concede experiencia por releer.
musica|Recuerdo del concierto y acceso a su reproducción cuando exista pista producida; opción silenciosa equivalente.
guardabosques|Plan de poda y revisión en zona autorizada, sin aumentar madera disponible por día.
artesana|Patrón de cierre reparable o ajustable de prenda existente; sin aumento universal de defensa.
astronoma|Agenda de observación con intervalos de incertidumbre de tres jornadas lógicas, sin cambiar clima ni RNG.
veterano|Registro de actas y responsabilidades consultable con medidas de reparación; no equivale a perdón de terceros.
nina|Dibujo de maceta en álbum de hitos, con escena releíble y sin convertirlo en objeto de venta.
nino|Mapa infantil que distingue ruta conocida e imaginación; accesible en diario sin revelar zonas nuevas.
viajera|Manifiesto de ruta con remitente, tramo, capacidad y aviso de cambio; no deja leer cartas ajenas.
lirios_bastian|Plano de compartimiento de seguridad con capacidad de carga publicada y mismos materiales estructurales.
lirios_olga|Agenda de cuota, recepción y apelación del mercado; precios y límites esenciales siguen visibles sin premio.
lirios_maite|Variante de borde vegetal o sombra para estanque; cambia disposición, nunca duplica capacidad ni peces.
lirios_julian|Plan de relevo y revisión del faro con señales redundantes; no abre travesías inseguras.
lirios_belen|Variante de red o trampa selectiva con misma durabilidad y captura base; exige revisión y devolución reales.
lirios_teo|Horario de muelle y relevo con cupos, para preparar envío sin esperar una hora real.
lirios_dalia|Diseño de ribera modular con lote, recuperación y fecha de retiro; no crea suelo fértil instantáneo.
lirios_tina|Libreta de avistamientos con dibujos y escena de corrección; no concede animales capturados.
bruma_silvana|Plan comunitario de tala y restauración con representación de ribera; no elimina costos de madera.
bruma_felix|Ficha de lote fermentado, descarte y compostaje que conserva procedencia y contraindicaciones.
bruma_amira|Plan de floración y densidad de colmenas con advertencia de competencia, sin bonus acumulativo de miel.
bruma_roque|Módulo de rampa reparable o plegable con presupuesto equivalente, probado antes de cambiar colisión.
bruma_elio|Ficha de observación de pradera y manuscrito autorizado; sin mejorar probabilidades genéticas o exigir revelación.
bruma_zaira|Guía de dosis, fuentes y límites de preparación, consultable sin usar remedio en animal sano.
bruma_ada|Registro de hábitat, autores y recuperación que no revela ubicación sensible a visitantes.
bruma_benicio|Cuento reproducible marcado como ficción o memoria según permiso; no sustituye documentos canónicos.
piedra_eloy|Consulta de criterios y apelación de entrada; la autorización concreta siempre exige condiciones de seguridad.
piedra_ursula|Ficha de procedencia que separa observación, extracción y transferencia de una muestra.
piedra_gonzalo|Registro del accidente corregido y permisos de memorial, sin forzar perdón ni exponer a familiares.
piedra_petra|Montura protectora visible o pieza decorativa con misma calidad base y clasificación de uso.
piedra_santiago|Patrón de ajuste lateral de armadura: movilidad/carga contextual con presupuesto equivalente, sin más defensa global.
piedra_mireya|Plantilla de prioridades de máquina con reservas y parada; solo configura recursos existentes.
piedra_hugo|Plan de alertas redundantes de luz, texto y pulso; avisos de seguridad básicos no se cobran como recompensa.
piedra_ciro|Variante de sabor de ración existente con mismas porciones y efecto; incluye porción del cocinero en cupo.
brasa_tarek|Plano de refugio sombreado o intercambio térmico con consumo visible, sin producción animal adicional.
brasa_sol|Cuenco reparable o desmontable con idéntico costo material y capacidad, sin esencia divina dentro.
brasa_nadia|Comparador de calor y gasto de agua por parcela; el riego sigue consumiendo recursos y jornadas normales.
brasa_ramiro|Plano de recipiente inspectable y ficha de retirada de lote; no concede uso energético de reliquias.
brasa_idalia|Copia de estudio del manuscrito del dragón con guía de reserva, sin añadir criatura al inventario.
brasa_dante|Agenda de capacidad, cancelación y ruta alternativa, con costo y permiso explícitos.
brasa_rufina|Calendario cooperativo de baños con cupos de agua y relevo, sin exigir servicio cada jornada.
brasa_yago|Dibujo o figura fría en álbum de hitos; no se vende ni emplea como herramienta de adulto.
nieve_eira|Variante de manta modular con mismo costo de lana y abrigo base, sin exigir más producción animal.
nieve_anselmo|Recuerdo de créditos musicales y acceso instrumental si existe audio autorizado.
nieve_luz|Pantalla de reposo o plan de luz limitado, reversible y sin aumentar huevos por completar misión.
nieve_quirina|Calendario de puntos seguros observados, fechas y devolución de juveniles; no revela peces desconocidos.
nieve_severo|Pronóstico legible de tres jornadas con intervalo y contingencia; conserva semilla climática del motor.
nieve_milena|Cuaderno de ensayos de frío y humedad con resultados positivos y negativos, sin bonus de madurez.
nieve_otto|Plan de rescate con responsables, capacidad y demora; no concede extracción gratuita universal.
nieve_celeste|Variante de zona de retiro de criatura con hogar adecuado, sin cambiar genomas o obediencia.
vigilia_aldan|Sistema consultable de apelación de paso; mantiene validación de equipo y riesgos actuales.
vigilia_noemi|Guía de atención y diagnóstico provisional con fuentes anónimas; no convierte ceniza en juicio moral.
vigilia_ulises|Mapa con versiones fechadas, blancos y retirada; no marca tesoros sin prueba.
vigilia_kael|Plan de alerta territorial del escudo, sin recopilar conversaciones o datos de relaciones.
vigilia_azucena|Guía de llamada y manuscrito del grifo; no hace un grifo siempre disponible ni propiedad del jugador.
vigilia_telmo|Plantilla de correspondencia que etiqueta original, copia y resumen sin guardar el contenido privado.
verdia_amaranta|Recuerdo del jardín con o sin inscripción, retirables por permiso; misma recompensa en silencio.
verdia_nilo|Recorrido acompañado o descanso en umbral con opción clara de regreso; no obliga a decidir destino.
verdia_isadora|Vista paralela de dos relatos autorizados, conservando diferencias y contexto.
verdia_berenice|Agenda de entrega o custodia sin plazo real; destinatario puede rechazar carta sin perder utilidad.
verdia_lucio|Receta anotada de sopa con misma función que la base; no fuerza visita, matrimonio o espera eterna.
verdia_sarai|Panel de mural por capas con créditos y permiso de retirada; sin estadísticas de bendición.
verdia_eneas|Página de opciones de permanencia y reincarnación, sin diseñar identidad de una vida futura.
verdia_yara|Recuerdo de rito con canción o silencio; mismo desbloqueo sin obligar a dar voz.
verdia_tobias|Álbum de avistamientos acuáticos sin captura y con ubicación general no sensible.
verdia_celino|Visita por puente o sendero autorizado, con salida alternativa y mantenimiento; no invade otro jardín.
verdia_aina|Ficha privada de objeto o registro de devolución, sin transformar intimidad en trofeo público.
verdia_dimas|Cuaderno de viabilidad de semillas con lotes fallidos; no otorga semillas comerciales por lectura.
eco_sora|Partitura autorizada o recuerdo del ensayo con versión escrita y permisos separados de grabación.
eco_esteban|Comparador de relato y resumen con notas críticas que no interrumpen la voz original.
eco_violeta|Ficha de restauración que conserva cicatriz y riesgo de suelo, sin elevar rareza de criaturas.
eco_nazario|Guía crítica de contratos de secta, consultable sin difundir propaganda como premio.
eco_basilia|Recuerdo ceremonial con ofrenda compartida o manos vacías y misma utilidad.
eco_oriel|Guía de consentimiento en encuentros: información compartible, límites y retiro de permiso.
senda_iria|Registro de acompañamiento y decisión aplazada, que nunca acredita la prueba del alma por el jugador.
senda_mateo|Plan de revisión de puentes y prueba de regreso, sin fabricar material de ilusiones desmontadas.
senda_nora|Vista de dicho, inferencia y corrección con permisos distintos y términos preservados.
senda_fabian|Plan de carga con paquete de regreso separado de entrega; no duplica provisiones al cruzar plano.
senda_leire|Agenda de descanso y relevo de acompañantes, sin convertir ayuda en respuesta sustitutiva.
senda_anwar|Guía de reparación sin contacto y consentimiento de mensajes, sin exigir perdón para cerrar.
senda_ofelia|Página de responsabilidad y reparación elegida; ascenso requiere decisión del alma, no amistad máxima.
senda_pablo|Registro de restitución sin petición de gratitud; no autoriza contacto con víctima.
hilos_tecla|Cuaderno de pruebas refutables del laberinto, con variantes y excepciones conservadas.
hilos_hector|Plano de ancla reparable con mismas piezas y capacidad base; exige armado y prueba reales.
hilos_asha|Agenda de balizas y referencias revisables; crédito incierto se conserva como incierto.
hilos_elian|Ruta acompañada de salida autorizada, sin declarar reparación terminada ni abrir Verdia automáticamente.
nox_dorian|Consulta de permisos por función y riesgo, no llave de celdas ni juicio moral de visitantes.
nox_salma|Ficha clínica que distingue paciente, contaminación y entidad contenida, con privacidad médica.
nox_viggo|Modelo inerte de sello inspectable; no entrega sello operativo que permita abrir Nox.
nox_mirta|Registro de custodia con correcciones y notificaciones, sin exhibir información de celdas.
nox_inigo|Servicio de apoyo a salida voluntaria, con cupos y sin juramento; no otorga impunidad.
nox_tamara|Plan de balizas con prueba de redundancia, significado y protocolo de retorno.
orbita_helena|Acceso a preparación de vuelo autorizado con opción de abortar; no sustituye aire, nave o combustible.
orbita_dexo|Plan comparativo de ruta y puerto alterno con reserva mínima no negociable.
orbita_tessa|Plantilla de alertas o turnos humanos con insumos finitos y límites de observación visibles.
orbita_boris|Calculadora de reserva con consumo registrado y margen revisable, sin generar energía.
orbita_valentina|Balance hidropónico de producción e importación que conserva calendario al dormir.
orbita_ivo|Agenda voluntaria de noticias y observación conjunta, con carta íntima fuera del archivo.
orbita_said|Guía de relevo y doble control anonimizada, sin curar lesiones por leerla.
orbita_rita|Manifiesto por lote o ruta con transferencias distintas de nuevos hallazgos.
aurelia_aitana|Comparador de luz por especie y condiciones, sin elevar rendimiento de todas las plantas.
aurelia_oscar|Plano de soporte reparable de batería; capacidad depende de medición, no del plano.
aurelia_kiara|Guía de ensayo de polinización manual o cerrado, sin liberar fauna ni colonizar mundos.
aurelia_saul|Variante de receta de néctar con origen etiquetado y mismo efecto alimentario.
nocturna_matea|Plan de vuelta con referencias independientes, consumo y puerto alterno autorizado.
nocturna_elvira|Plano de exhibición reversible de planta con sombra y refugio; no altera su reposo.
nocturna_gaspar|Método de calibración de lente o ficha de uso limitado; no concede visión de todo el mapa.
nocturna_naim|Informe territorial anónimo sin identidades de almas ni mensajes de muertos no autorizados.
esmeralda_olmo|Ficha de veta, crédito y volumen de muestra, separada de precio de venta.
esmeralda_indira|Método de calibración de resonancia sin saturación; no llena baterías por medir maná.
esmeralda_duna|Cuaderno de restauración local y retiro de ensayo, sin terraformar ni crear cosechas.
esmeralda_raimundo|Boletín de tendencia sísmica por niveles con acción y fecha, sin modificar eventos aleatorios.
fragmentos_axel|Consulta de contratos y servicio de restitución o préstamo autorizado de restos.
fragmentos_pia|Método de clasificación de prismas por condición y tolerancia, sin rareza extra automática.
fragmentos_lazaro|Plano de pieza reparable o desmontable con devolución material menor que inversión.
fragmentos_uma|Agenda de puestos de rescate con capacidad y oxígeno de vuelta, no rescate infinito.
ambar_zora|Tratado pequeño revisable de suministro o intercambio técnico, con cupos y reserva local.
ambar_nestor|Variante de ajuste térmico de herramienta, con mismos materiales y rendimiento general.
ambar_alina|Ficha de riego mínimo e intervalos de cultivo resistente; no elimina agua ni estación.
ambar_baltasar|Módulo inspectable de domo con salida de emergencia y consumo de ventilación.
ambar_samira|Boletín de rutas de tres jornadas con refugios y alternativa de retorno, sin fecha real.
ambar_kenzo|Copia de plano de terraza con permisos de uso, sin extraer soporte ni objeto vendible.
iris_calista|Acuerdo de ubicación de baliza autorizado por asamblea, sin otorgar propiedad territorial.
iris_orin|Recuerdo del concierto o demostración que separa composición de consentimiento del planeta.
iris_liora|Ficha de banco local e intercambio reversible de semillas, sin productividad global añadida.
iris_edda|Ruta de observación a distancia o por huellas, sin captura, nido apropiado ni domesticación forzada.
iris_mauro|Mapa de convivencia con fauna, revisable y sin convertir indicios en permiso de caza.
iris_yuna|Comparador de variedades y criterios de banco con revisión, cupos y espacio para excepciones.
''')
