/** Catálogo compartido con la wiki y el frente de arte. Nada depende de un modelo. */
export const ARTEFACTOS_COMUNIDAD=[
 ['fanal_portuario','Fanal de los primeros muelles','El vidrio estaba roto; la luz servía para volver, no para vigilar.'],
 ['vasija_riego','Vasija de riego remendada','Tres reparaciones explican por qué una familia no pudo reemplazarla.'],
 ['campana_turno','Campana de cambio de turno','Anunciaba el descanso de quienes mantenían las primeras galerías.'],
 ['placa_taller','Placa de un taller cerrado','Se conservaron los nombres de aprendices, además del dueño.'],
 ['aguja_camino','Aguja de orientación','Quien la llevó marcó también lugares donde debía pedir permiso.'],
 ['azulejo_cuenca','Azulejo de la cuenca compartida','Sus cuatro colores registran acuerdos humanos: no contienen poder divino.'],
] as const;
export const PESQUERIAS_REGIONALES=[
 {region:'puerto_lirios',id:'lisa_lirios',nombre:'Lisa de los lirios',cebo:'lombriz',rareza:1,valor:22,desde:6,hasta:20},
 {region:'brumaverde',id:'barbo_bruma',nombre:'Barbo de la bruma',cebo:'lombriz',rareza:2,valor:30,desde:5,hasta:18},
 {region:'piedralumbre',id:'locha_tibia',nombre:'Locha del estanque tibio',cebo:'lombriz',rareza:2,valor:30,desde:6,hasta:22},
 {region:'ambarina',id:'gobio_ambar',nombre:'Gobio de Ámbar',cebo:'pez_cebo',rareza:3,valor:50,desde:5,hasta:20},
 {region:'huerto_aurelia',id:'carpin_aurelia',nombre:'Carpín del vivero cerrado',cebo:'lombriz',rareza:1,valor:22,desde:0,hasta:24},
 {region:'estacion_celia',id:'siluro_celia',nombre:'Siluro del módulo acuícola',cebo:'pez_cebo',rareza:2,valor:38,desde:0,hasta:24},
 {region:'confluencia_agua',id:'perca_cuenca',nombre:'Perca de la cuenca acordada',cebo:'lombriz',rareza:2,valor:32,desde:6,hasta:20},
 {region:'fragmentos_cristal',id:'danio_cristal',nombre:'Danio del acuario cerrado',cebo:'cebo_magico',rareza:3,valor:60,desde:0,hasta:24},
] as const;
export const OBRAS_COMUNIDAD=[
 {id:'muelle',nombre:'Puesto de cuidado del lago',region:'lago',x:28,z:77,noches:2,materiales:{madera:24,piedra:12,fibra:8},efecto:'Dos trampas de cebo, un intento por noche dormida y salida que debe recogerse.'},
 {id:'galeria',nombre:'Galería de oficios y cuencas',region:'pueblo',x:0,z:1,noches:3,materiales:{madera:30,piedra:20,vidrio:4},efecto:'Donaciones físicas, colecciones regionales y seis vitrinas. Se reutiliza la Casa de Oficios.'},
 {id:'descanso',nombre:'Banco del sendero antiguo',region:'bosque_ancestral',x:-72,z:72,noches:2,materiales:{madera_ancestral:8,piedra:16,fibra:8},efecto:'Una pausa diaria con una ración recupera diez puntos de energía.'},
 {id:'terminal',nombre:'Terminal de carga acordada',region:'estacion_celia',x:0,z:-9.6,noches:3,materiales:{lingote_hierro:6,bateria:2,engranaje:2},efecto:'Hasta cuatro terminales y seis bultos pagados: entrega al dormir y retirada presencial.',permiso:'P16'},
] as const;
export const CUADERNOS_COMUNIDAD=[
 {id:'cuencas',titulo:'Cuencas que regresan',condicion:'tres capturas regionales distintas',texto:'Anota el cebo, la hora y el estanque. Una observación no autoriza capturar fauna protegida. Las trampas consumen cebo aunque el pez escape.'},
 {id:'vitrinas',titulo:'Devolver un nombre',condicion:'tres artefactos donados',texto:'Una pieza sin contexto cuenta menos que una reparación documentada. La donación transfiere el objeto; las vistas previas y los secretos reservados quedan fuera de la exposición.'},
 {id:'carga',titulo:'La distancia tiene un coste',condicion:'un bulto recogido en otra terminal',texto:'El registro permite acordar una quinta terminal, con sus materiales originales. Registra cada carga, batería y jornada. Un puerto no comparte mágicamente su cofre con otro; el contenido viaja una sola vez y mantiene su calidad.'},
] as const;
