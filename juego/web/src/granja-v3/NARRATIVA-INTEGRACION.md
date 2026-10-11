# Contrato de la biblia narrativa

Fuente: [docs/narrativa](../../../../docs/narrativa/README.md), encargo de Javier del 11 de octubre.
142 NPC, cinco figuras originales y Fuatia, 36 misiones principales, 142 arcos personales, doce secretos originales,
19 encuentros comunitarios y ocho secundarios elementales (T08 es un secreto nuevo): 217 misiones de autoría. Son documentos y datos, sin importación automática.
Conde, protagonistas y narrador se documentan aparte del roster de 147.

## Identidades y viviendas

`datos/reparto.json` conserva `REPARTO-MUNDOS.json`: ID, nombre de autoría y `hogar_planeado`.
No renombrar IDs funcionales del motor. Las biografías no conceden parentescos mediante un apellido
compartido ni convierten compañeros de vivienda en parejas. Tina vive con Dalia por acuerdo familiar;
Bastián sigue siendo su padre. Flora y Nina, Tomás y Leo, Rufina y Yago tienen vínculos explícitos.
Las seis figuras usan IDs `figura_*` y aliases de voz; no entran a tiendas o amistad ordinaria.

## Estado propuesto

Conservar V5 y economía. La futura subversión narrativa necesitará estado por misión, recibos de actos,
ramas elegidas, reservas con cantidad/calidad, permisos y premios ya concedidos. Crear una migración
aditiva cuando se implemente; esta entrega no añade claves de guardado. Un catálogo consultado no
equivale a misión aceptada ni prueba realizada. Guardar hito, gasto y premio en la misma transacción.

Las dependencias `P01…P24`, `V_<npc>`, `S01…S12`, `E01…E19` son IDs de autoría nuevos, no reemplazos
de los doce encargos permanentes, ofertas renovables, correo, cuadernos o colecciones existentes.
Los ejemplos antiguos de encargos del roster no se acreditan como estos arcos. Una partida avanzada
puede reconocer hallazgos que ya posee, sin simular ensayos que el guion exige después de aceptación.

## Recursos y premios

`datos/recompensas.json` registra familia, efecto concreto, tema, límite y origen. Los premios no son
objetos comerciales hasta implementar su ficha. Una variante de receta debe elegir un ID base real,
conservar entradas/salida y probar costo equivalente. Las técnicas no se acumulan con cobre/vidrio de
K07. Cero multiplicadores globales y cero monedas por leer. Ningún premio cambia genomas, crecimiento
al dormir, cuidado real, probabilidades de pesca o la voluntad de un alma.

Los textos de “rampa”, “alerta”, “comparador” y “plano” requieren interfaz y capacidad correspondientes;
una etiqueta no certifica esa función. Los textos y controles simples pueden servir de primera escena,
con arte final de Claude. No editar renderizadores para acreditar una acción económica.

## Sangre y la casa

Los cuatro sectores conservan `afueras`, `subsuelo`, `santuario`, `corte` y sus puertas. El adaptador
leerá `puerta_<sector>:fin`: los dos retos extra de cada lugar siguen opcionales para el argumento.
No basta desbloquear un menú o leer el prólogo. La Santa del diálogo vigente es Serena; su hablante
runtime `santa` se mapea por contexto, sin cambiar retroactivamente audios ya generados.

El prólogo vigente corresponde a P02/P03 y C02; las escenas de cuatro sectores se amplían con P04,
P06, P08 y P09. La frase antigua sobre hermanas de siglos se interpreta como archivo de generaciones
del oficio, no edad inmortal de Serena ni once siglos de Noche del Conde. Al adaptar se corrige el
texto explícitamente y se regenera solo el audio afectado, sin borrar las voces aprobadas de otro frente.

El puente de hitos no transfiere oro, mineral, almas o ganado. Los grifos de extracción no se vuelven
animales comprados. Repetir Noche después del final no saca al Conde de Nox. La campaña en la granja
permite copias autorizadas de los tres manuscritos para evitar bloqueo por genética muy rara.

## Viajes y producción

Las regiones tienen requisitos de visita y retorno además del precedente narrativo. Íñigo visita la
posada en P12 durante un relevo; no exige entrar al Bastión antes de P16 ni crea otro NPC. Las visitas
deben afectar horario de la misma identidad. Los seis trabajadores de Nox siguen vivos en su perímetro.

`audio/lineas.json` es catálogo de producción. `audio/lineas-mundo.json` contiene únicamente material
de contexto neutral, no una campaña completa de amigos. No copiarlos a `public/` ni al exportador de
voces actual por defecto. Antes de importar: reparto aprobado, texto vigente, archivos producidos,
duración, subtítulos, silencio/pausa, huellas y aislamiento de amigos. No se ha pagado ni generado audio.

## Verificación y siguiente implementación

`python docs/narrativa/herramientas/exportar.py` reproduce libros y guiones. Después ejecutar
`python docs/narrativa/herramientas/verificar.py`: compara roster, viviendas, relaciones, referencias,
dependencias, ramas, límites y capas de audio; también rechaza doce ejemplos deliberadamente inválidos.
No certifica jugabilidad, pronunciación ni equilibrio real.

Primer bloque ejecutable recomendado: P01–P05 y tres arcos del pueblo, con guardado y recibos, antes
de expandir mapas. Las pruebas del motor, builds y demo se hacen cuando ese bloque toque runtime.
La expansión narrativa modifica autoría y documentación. El usuario levantó la pausa de publicación con «has push a todo»; se conserva el trabajo remoto de Claude al integrar. Publicar la biblia no activa las misiones nuevas.

La ampliación incluye 284 conversaciones VID repetibles y 14 escenas cinematográficas. `vidas.json` conserva recuerdos y vida cotidiana por ID; `regiones-recursos.json` propone 24 territorios y su renovación por jornadas dormidas. No activa recursos ni portales. El primer motor de armas integrado se describe en [Armas y combate](../../../../docs/narrativa/11-armas-y-combate.md): es un avance distinto del diseño de misiones, compatible con V5 y disponible en las expediciones actuales.
