"""Catálogo de expansión: recursos persistentes, no un inventario del runtime."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
regiones = []


def zona(id, nombre, mundo, acceso, conflicto, mineral, uso, semilla, cultivo,
         madera, animal, cuidado, combate, dias):
    recursos = [
        dict(id=id+'_mineral', nombre=mineral, clase='mineral', obtencion='Depósito señalado y autorizado; cupo de seis unidades por ciclo.', usos=[uso, 'Catalizador de un lote de mantenimiento local: dura ocho expediciones, no se gasta por golpe.']),
        dict(id=id+'_semilla', nombre=semilla, clase='semilla', obtencion='Intercambio con banco local o cosecha autorizada; cultivar devuelve una semilla por planta adulta, no una multiplicación infinita.', usos=[cultivo, 'Reponer el banco de semillas en encargos renovables de cupo finito.']),
        dict(id=id+'_madera', nombre=madera, clase='madera', obtencion='Poda acordada, caída natural o recuperación de estructuras descartadas; cupo de ocho unidades por ciclo.', usos=['Carcasa reparable del utensilio de esta región; conserva su función en el tramo final.', 'Armazón de cuatro unidades de munición o un sello elemental, junto con un mineral común de Celia.']),
        dict(id=id+'_fauna', nombre=animal, clase='fauna', obtencion=cuidado, usos=['Observación y tareas de rescate que revelan rutas y cambios del ecosistema.', 'Producto de cuidado consentido si la especie lo admite; ninguna criatura ni alma se consume para fabricar armas.'])]
    regiones.append(dict(id=id,nombre=nombre,mundo=mundo,acceso=acceso,
        conflicto=conflicto,recursos=recursos,combate=combate,
        renovacion=dict(dias_dormidos=dias,cupo_mineral=6,cupo_madera=8,
            politica='Contador de jornadas dormidas y último ciclo reclamado por depósito en la partida. Reentrar, morir, cargar o ver una escena no renueva recursos. No exige fecha real.'),
        retorno='Una primera visita resuelve una pregunta; las siguientes abastecen ajustes, lotes de consumibles y encargos locales. El diario indica cupo y próximo ciclo; no es obligatorio visitar todos los destinos. Los materiales básicos de Celia siguen participando en las recetas tardías.',
        estado='diseno_no_integrado'))

zona('pueblo_sol','Pueblo del Sol','Celia','P01 y camino público',
 'La sequedad del canal permite descubrir a Fuatia sin culpar a quien perdió una cosecha.',
 'Calcita de surco','Filtro de retorno del canal y empuñadura que reduce vibración; también mezcla de sustrato para cultivos tardíos.',
 'Semilla de lino de ribera','Fibra para cuerdas de arco y vendas de trabajo; no reemplaza las 63 semillas actuales.',
 'Madera de sauce de acequia','Gallinas de ribera',
 'Cuidados de las especies existentes y observación en el canal; variantes futuras conservan las reglas de genética y bienestar.',
 'Pueblo sin combate; entrenamiento voluntario en patio y expediciones por la mina de Celia.',2)
zona('puerto_lirios','Puerto de los Lirios','Celia','Ruta pública; permisos de muelle',
 'El vivero de Nerina sostiene pesca y alimento; Fuatia exige protegerlo sin expulsar a familias pescadoras.',
 'Sal de espejo','Membrana de enfriamiento de bastón y filtro de agua de navegación; nunca da oxígeno infinito.',
 'Semilla de salicornia azul','Alimento de expedición y gel de sellado para filtros.',
 'Madera de deriva certificada','Nutrias de estuario',
 'Restaurar refugios y observar a distancia. No capturar fauna silvestre por un objeto ni alimentar con basura.',
 'Canales exteriores contra máquinas de arrastre abandonadas; muelles habitados pacíficos.',3)
zona('brumaverde','Brumaverde','Celia','Permiso de senda y visita al banco forestal',
 'Mara teme repetir un error de brigada; conservar un árbol puede exigir reforzar antes una vivienda.',
 'Jade de raíz','Guía de invocación que precisa el punto de aparición y protector de raíces del invernadero.',
 'Semilla de helecho de niebla','Ungüento de campamento y fibra de seguimiento de huellas.',
 'Madera de aliso caído','Ciervos de bruma',
 'Pasillos de paso y registro de crías; el beneficio es información de senderos, no domesticar todo el bosque.',
 'Ruinas apartadas con guardianes artificiales; animales del bosque no son enemigos.',3)
zona('piedralumbre','Piedralumbre','Celia','Mina habilitada y equipo ordinario',
 'El accidente de AV 281 dejó a Bruno y Darío con versiones distintas de la misma decisión.',
 'Estaño de junta','Aleación con cobre que mantiene arcos, bastones y mecanismos de aire incluso en el final.',
 'Semilla de liquen de lámpara','Aceite de señalización y marcador visible para galerías.',
 'Madera de apuntalamiento recuperada','Topillos de piedra',
 'Abrir pasos seguros lejos de las vetas; no usar animales como alarma desechable de derrumbes.',
 'Galerías y ruinas con enemigos; cooperativa y talleres sin combate.',2)
zona('brasaviva','Brasaviva','Celia','Registro de hornos y senda volcánica',
 'La reparación debe detener el daño de un horno sin abandonar a quienes dependen de su calor.',
 'Obsidiana porosa','Disipador de bastón de fuego y aislamiento de cocina; una alternativa cambia alcance por recuperación.',
 'Semilla de pimiento rescoldo','Comida de resistencia al entorno con duración finita; no inmunidad global.',
 'Madera de acacia carbonizada naturalmente','Lagartos de ceniza',
 'Sombra y abrevaderos; las escamas desprendidas pueden estudiarse, no arrancarse para un catalizador.',
 'Laderas con ascuas desprendidas y máquinas de extracción; casas pacíficas.',3)
zona('nieveclara','Nieveclara','Celia','Paso abierto y refugio equipado',
 'Sol y Renata discuten si advertir de un riesgo alcanza cuando faltan alternativas reales de alojamiento.',
 'Cuarzo de deshielo','Lente de precisión de arco y regulador de frío para semilleros de Aurelia.',
 'Semilla de mora de escarcha','Reserva alimentaria y pasta refrigerante de herramientas.',
 'Madera de pino de poda','Liebres de nieve',
 'Corredores de desplazamiento, refugios sin cercos y atención en rescates supervisados.',
 'Ventisqueros de salida señalada; lobos naturales se esquivan, no se convierten en botín.',4)
zona('vigilia','Vigilia de Ceniza','Celia','P10; investigación con documentos accesibles',
 'La Custodia usa ayuda real para fabricar obediencia; sus miembros pueden abandonar sin perder el derecho a comer.',
 'Hierro de campana','Detector mecánico de retorno y contrapeso de espada; sirve de repuesto de campanas en el final.',
 'Semilla de centeno de vigilia','Pan de provisiones y almohadilla de limpieza de filtros.',
 'Madera de olmo recuperada','Búhos de campanario',
 'Restaurar nidales fuera del humo y mantener rutas de descanso; no convertir sus plumas en impuesto ritual.',
 'Almacenes ocupados por guardianes y sectarios adultos hostiles; comedores y refugios fuera de combate.',3)
zona('rosal_eterno','Rosal Eterno','Verdia','P11; visita aceptada por sus habitantes',
 'Rosa y Lucio pueden conversar y disentir sin que su matrimonio exija que ella deje de vivir.',
 'Nácar de rocío','Memoria mecánica de respiración del bastón y lente de lectura de documentos; no almacena almas.',
 'Semilla de rosa de retorno','Aroma de recuerdo para descanso y sellado suave de una carcasa.',
 'Madera de rosal de poda voluntaria','Mariposas del recuerdo',
 'Jardinería consentida y observación; sus habitantes no trabajan obligados ni se recolectan sus recuerdos.',
 'Jardín pacífico. Combate opcional solo en una fisura exterior contra construcciones de Vael, nunca habitantes.',4)
zona('jardines_eco','Jardines del Eco','Verdia','P11; consentimiento de cada taller',
 'Isadora y Esteban contrastan su memoria anterior al Velo con archivos que llegaron después de su muerte.',
 'Vidrio de eco inerte','Lente de señales de aire y reparación de instrumentos; el material es físico y no un alma cristalizada.',
 'Semilla de campánula de eco','Tinte de señales accesibles y paño de calibración.',
 'Madera de ciprés de poda','Abejas de jardín',
 'Colmenas voluntariamente atendidas, cupo de miel con reserva para la colonia; ninguna alma paga en productos.',
 'Talleres pacíficos, fisura exterior compartida con Rosal Eterno.',4)
zona('travesia','Umbral de la Travesía','Senda','P13; acompañamiento aceptado',
 'Ofelia puede reparar un gesto sin comprar absolución; Fuatia debe aceptar que una respuesta no le pertenece.',
 'Pizarra de umbral','Placa de consulta de rutas y anclaje desmontable de invocación.',
 'Semilla de junco de paso','Cuerda de guía que vuelve a usarse; hojas para vendas ordinarias.',
 'Madera de pasarela descartada','Grullas de umbral',
 'Reponer agua y trayectos seguros. Ningún acompañante ni alma se obliga a producir materiales.',
 'Pasos ocupados por autómatas de Vael; áreas de reparación y conversación pacíficas.',3)
zona('refugio_hilos','Refugio de los Hilos','Senda','P14; entrevista de Elián con permiso',
 'Tecla debe permitir que un testigo contradiga el modelo que hizo para ayudarlo.',
 'Mica de hilo','Aislante de circuito y separador de resonancias para invocaciones que no confunden voces con órdenes.',
 'Semilla de algodón de niebla','Venda y bobina de arco; algodón cultivado, no hilo de alma.',
 'Madera de bastidor retirada','Polillas de telar',
 'Reducir lámparas dañinas y mantener plantas hospederas; seda solo de prácticas aceptadas, no extracción de criaturas.',
 'Corredores técnicos exteriores, refugio sin combates.',3)
zona('bastion_velo','Bastión del Velo','Perímetro de Nox','P17; autorización de guardia y baliza de regreso',
 'Dorian y sus colegas son personas vivas que custodian entidades corruptas. El Conde no es un preso inocente.',
 'Basalto de sello inerte','Carcasa de contención del arma y reparación de balizas; no se extrae del cierre de prisión.',
 'Semilla de cardo de guardia','Paño de descontaminación y alimento de huerto del personal vivo.',
 'Madera de caja de suministro reutilizada','Cuervos del perímetro',
 'Atención fuera del sello con equipo autorizado. No soltar entidades ni usar animales para probar corrupción.',
 'Exteriores autorizados contra emanaciones y construcciones; la prisión no se abre para farmear enemigos.',5)
zona('estacion_celia','Estación sobre Celia','Órbita','P20 y nave con reservas de viaje',
 'Helena recuerda que un buen dato necesita saber quién podrá usarlo y quién pagará el error.',
 'Titanio recuperado','Soporte liviano de bastón y reparación de sellos de nave; usa cobre de Celia como conductor.',
 'Semilla de albahaca orbital','Condimento y cultivo de hidroponía con agua contabilizada.',
 'Madera compuesta de fibra cultivada','Geckos del módulo botánico',
 'Hábitat cerrado supervisado, cupos de aire y agua; no soltar fauna al vacío ni crear comida de la nada.',
 'Módulos abandonados contra drones; hábitat y sala de encuentro pacíficos.',4)
zona('huerto_aurelia','Huerto de Aurelia','Luna Aurelia','P20; enlace de nave y cápsula de cultivo',
 'El crecimiento no vale si obliga a agotar la reserva de otro módulo.',
 'Topacio solar','Disipador de carga de bastón y regulador de luz del huerto; no aumenta todos los cultivos por tenerlo.',
 'Semilla de trigo aurelio','Alimento de expedición y aglutinante de lotes de munición.',
 'Madera de tallo lignificado de invernadero','Escarabajos polinizadores de cápsula',
 'Cúpula con refugios y cupo de polinización; productos permanecen ligados a cuidados, no a esperar fuera del juego.',
 'Cantera exterior presurizada contra mecanismos de cosecha defectuosos.',4)
zona('vigia_nocturna','Vigía de Nocturna','Luna Nocturna','P20; balizas de tránsito',
 'Conducir almas no permite quedarse con ellas para alimentar una máquina.',
 'Plata de tránsito','Marcador de retorno de arco y estabilización de baliza; es mineral físico, no energía de muertos.',
 'Semilla de lunaria oscura','Tinte de contraste y hoja de infusión de descanso.',
 'Madera de lunaria de poda de cúpula','Zorros de módulo nocturno',
 'Refugio con atención; observar rutas sin empujar animales a túneles para abrir el mapa.',
 'Tramos abandonados contra drones y sombras artificiales; ninguna alma es enemigo o botín.',4)
zona('cantera_esmeralda','Cantera de Esmeralda','Luna Esmeralda','P20; permisos de extracción y reserva de mana',
 'Un catalizador organiza energía finita; no debe disfrazarse de fuente inagotable.',
 'Esmeralda resonante','Afinador de bastón e invocación; su efecto sustituye el anterior, no acumula daño.',
 'Semilla de musgo esmeralda','Sustrato de disipación y gel de limpieza de catalizadores.',
 'Madera de bastidor de cultivo recuperada','Caracoles de cúpula húmeda',
 'Humedad y reserva de alimento; conchas vacías naturales pueden estudiarse sin matar fauna.',
 'Cantera contra centinelas; refugio presurizado para pausar y cambiar equipo.',5)
zona('fragmentos_cobre','Fragmento Cobrizo','Asteroides','P20; nave y campamento de los Fragmentos',
 'Recuperar material de una roca no autoriza apropiarse de una herramienta que otro dejó para volver.',
 'Cobre meteórico','Conductor de arco técnico y repuesto de bastón junto a estaño de Piedralumbre.',
 'Semilla de rábano de cápsula','Alimento rápido de campamento con sustrato y agua traídos.',
 'Madera de embalaje reutilizada','Ácaros de compost de módulo',
 'Solo fauna de hábitat de compost cerrado; la roca exterior no tiene animales que respiran en vacío.',
 'Roca exterior contra drones; reserva de oxígeno y salida segura existentes.',4)
zona('fragmentos_cristal','Fragmento Prismático','Asteroides','P20; nave y segunda baliza',
 'Un registro incompleto de reclamación no se resuelve dando el material al primero que llegue armado.',
 'Amatista de fractura','Lente de trayectoria de bastón y contador de desgaste de sellos.',
 'Semilla de berro de cápsula','Gel de limpieza y alimento de hidroponía contabilizada.',
 'Madera de soporte de laboratorio recuperada','Lombrices de compost de módulo',
 'Cuidados en el campamento cerrado; no fauna libre en el exterior del asteroide.',
 'Labores exteriores contra centinelas de reclamación; refugio compartido con Fragmento Cobrizo.',4)
zona('ambarina','Ambarina','Planeta Ámbar','P20; mapa de aterrizaje y acuerdo local',
 'Calista representa una comunidad que puede rechazar un plan de visitantes; no es reina de tierras por conquistar.',
 'Oro de ámbar','Contacto resistente a corrosión de armas y sensor de humedad; continúa útil junto al cobre básico.',
 'Semilla de frijol de reserva','Alimento y gel retenedor de agua para cultivos, sin crear lluvia.',
 'Madera de tamarisco de poda','Antílopes de sal',
 'Restaurar bebederos y rutas; el rendimiento no se paga cazando a los guardianes del agua.',
 'Ruinas de bombas contra guardianes; pueblos y reservas animales pacíficos.',5)
zona('iridalia','Iridalia','Planeta Iridalia','P20; convenio de observación y nave',
 'Un brillo bello puede ocultar una lectura falsa; escuchar música no exige aceptar toda su interpretación.',
 'Cristal iridiano','Afinación de bastón e invocación por timbre; señales simultáneas visibles para quien no oye.',
 'Semilla de lirio de prisma','Pigmentos de identificación y hojas de vendaje.',
 'Madera de sauce prismático de poda','Aves de prisma',
 'Zonas de canto y nidales sin trampas; plumas caídas con cupo, nunca capturar animales por un instrumento.',
 'Anfiteatros exteriores contra réplicas y centinelas artificiales.',5)
zona('confluencia_fuego','Caldera del Rescoldo','Confluencia elemental','F06; refugio de cuatro retornos',
 'Fuatia necesita distinguir apagar a un explotador de dejar sin calor a quienes dependían del horno.',
 'Ferrascua','Disipador que cambia ráfaga por recuperación de arma y válvula del retorno de fuego en F07.',
 'Semilla de amapola rescoldo','Aceite para lotes de fuego y ungüento de enfriamiento, cultivable solo en bandeja regulada.',
 'Madera de brasa caída','Salamandras de rescoldo',
 'Bebederos tibios y refugios de roca; invocación copia un patrón elemental, no encierra una salamandra.',
 'F07: ductos con ascuas y guardianes. Retirada antes de ventilación; ataque anunciado y rutas de cubierta.',4)
zona('confluencia_agua','Mar de los Retornos','Confluencia elemental','F06; embarcadero de refugio',
 'Una reserva cerrada puede proteger un vivero y también negar agua a otra orilla; la medida muestra ambas cosas.',
 'Hidrita','Membrana que cambia alcance por control y válvula del retorno de agua en F08.',
 'Semilla de nenúfar de retorno','Gel de filtros y munición de agua; no ahoga ni congela fauna natural.',
 'Juncovidrio de poda','Tortugas de remanso',
 'Despejar pasos y observar nidos desde fuera; cristales caídos no se arrancan del caparazón.',
 'F08: pasarelas inundables, drones de bombeo y guardianes de canal. Agua profunda es obstáculo, no muerte instantánea.',4)
zona('confluencia_tierra','Terraza de las Raíces','Confluencia elemental','F06; senda de refugio',
 'Extraer una veta puede sostener una casa o hundirla. La solución exige mostrar peso, permiso y restitución.',
 'Terralita','Anclaje que cambia movilidad por empuje y soporte del retorno de tierra en F09.',
 'Semilla de tubérculo raigal','Alimento y aglutinante de sellos de tierra; bandeja ventilada, no invasión de cultivos.',
 'Madera de raigal caída','Armadillos de terraza',
 'Restituir pasos y registrar madrigueras; perforar un refugio vivo no da un mineral exclusivo.',
 'F09: galerías con escarabajos pétreos artificiales y guardianes; anuncios de derrumbe y refugios estables.',4)
zona('confluencia_aire','Altura de las Corrientes','Confluencia elemental','F06; elevador de refugio',
 'Una ruta libre puede desviar el viento de otra vivienda; nadie debe demostrar fe saltando al vacío.',
 'Aeralita','Guía que cambia daño por velocidad de trayectoria y válvula del retorno de aire en F10.',
 'Semilla de velaria','Fibra de arco y tela de señales; cultivo protegido de ráfagas.',
 'Madera de velaria caída','Rayas de viento',
 'Observación en plataformas y rescate con anclajes; no convertir un animal en vehículo sin voluntad o en batería.',
 'F10: puentes con centinelas de presión y vientos anunciados. Caídas conducen a baliza segura y conservan hallazgos.',4)

datos=dict(version=1,estado='diseno_no_integrado',regiones=regiones,
    asentamientos_originales=19,territorios_recursos=24,
    nota='El campamento de los Fragmentos tiene dos rutas de recursos. Confluencia tiene cuatro territorios y un refugio, no cuatro nuevas aldeas de NPC.',
    invariantes=['No extraer núcleos de Fuatia ni almas.', 'No generar monedas o objetos al reproducir escenas.', 'Cupos ligados al sueño; no tiempo real.', 'Toda familia de arma tiene ruta de materiales comunes.', 'El final no exige todas las misiones ni todos los materiales.'])
(ROOT/'datos/regiones-recursos.json').write_text(json.dumps(datos,ensure_ascii=False,indent=2)+'\n')

texto=['# Confluencia y los recursos de los mundos','','**Estado: expansión diseñada; este catálogo no añade todavía estos materiales al inventario ni construye las regiones.**','','Confluencia es una región de encuentro de los cuatro elementos, abierta desde F06 después de P20. No es el cuerpo completo de Fuatia ni la fuente de su poder. Existe porque cuatro retornos naturales vuelven a cruzarse; Vael ha puesto medidores que atribuyen el mismo retorno a dos circuitos. Restaurarlos permite avanzar a F11 y F12 sin sustituir las puertas de la Noche.','','## Recorrido principal','','Un refugio central ofrece diario, taller, cambio de armas y regreso seguro. F07–F10 se completan en cualquier orden. Cada territorio tiene una ruta de combate y una ruta de intervención técnica de dificultad comparable; no hay obligación de usar un arma determinada. F11 contrasta las cuatro lecturas; F12 enfrenta a Vael con Fuatia como aliada que puede disentir. Los NPC existentes visitan por oficio: no aparecen cuatro pueblos nuevos que nadie haya conocido.','','Fuego reúne ductos, hornos y laderas; agua, pasarelas y viveros; tierra, terrazas y apuntalamientos; aire, puentes y válvulas. Cada retorno tiene una misión, un peligro visible y una prueba material. Abrir un cofre no prueba la reparación: la válvula debe funcionar y el diario debe registrar entrada, salida y reserva.','','## Economía y motivos para regresar','','Cada región conserva una aplicación de historia, dos aplicaciones de fabricación y un suministro renovable. Las mejoras tardías combinan un material local con cobre, hierro, madera o fibra de Celia: encontrar un metal nuevo no vuelve basura los antiguos. Un depósito ofrece seis minerales por ciclo; poda o recuperación, ocho unidades. Renovación tras jornadas dormidas registradas, jamás por reentrada, muerte, carga, reloj real o reproducción de escena. La extracción pagada queda persistida antes de entregar botín; mochila llena deja el hallazgo en el suelo o revierte la operación completa.','','El mantenimiento es optativo: un lote local de dos minerales y dos fibras estabiliza un ajuste durante ocho expediciones. Al vencer, el arma conserva sus estadísticas base; no se rompe ni bloquea la campaña. El ajuste se puede sustituir pagando otro lote; no se acumulan ajustes para multiplicar daño. Flechas y sellos tienen recetas por lotes y no requieren cada vez un viaje a cuatro regiones. El diario permite elegir un destino útil; no impone una ronda de todos los mundos.','','Ejemplos de recetas diseñadas: 2 ferrascuas + 2 fibras + 1 lingote de cobre → un ajuste térmico; 2 hidritas + 1 hierro + 2 juncovidrios → cuatro sellos de agua; 1 terralita + 2 maderas de Celia → anclaje desmontable; 1 aeralita + 2 fibras + 1 estaño → cuatro guías de proyectil. Ajustes son alternativas de función, no niveles superiores obligatorios. Las recetas definitivas y sus precios se validarán con el inventario del motor antes de activarse.','','## Ecosistemas y combate','','Las armas combaten enemigos hostiles, construcciones de Vael y mecanismos dañinos, no convierten toda fauna en botín. Verdia conserva jardines pacíficos; Senda, consentimiento y reparación; Nox, una prisión sellada con recuperación solo en su perímetro. Estación, lunas y asteroides contabilizan aire, agua y hábitat: plantas y fauna viven en módulos cuidados, no respiran libremente en el vacío. Cultivar una variante no modifica los IDs, las 63 semillas o las reglas genéticas existentes.','','## Catálogo por territorio','']
for z in regiones:
    texto += [f"### {z['nombre']} · `{z['id']}`",'',f"**Mundo y acceso:** {z['mundo']}; {z['acceso']}.",'',z['conflicto'],'','| Tipo | Recurso | Obtención y usos |','|---|---|---|']
    for r in z['recursos']:
        texto.append(f"| {r['clase']} | {r['nombre']} | {r['obtencion']} {'; '.join(r['usos'])} |")
    texto += ['',f"**Combate:** {z['combate']}",'',f"**Regreso:** ciclo de {z['renovacion']['dias_dormidos']} jornadas dormidas; {z['retorno']}",'']
(ROOT/'09-regiones-y-recursos.md').write_text('\n'.join(texto).rstrip()+'\n')
