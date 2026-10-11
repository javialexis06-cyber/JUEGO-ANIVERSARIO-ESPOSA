# Vida de los pueblos de Astra: guía para escribir vecinos y encargos

Javier pidió que los pueblos de Astra tengan vida: más vecinos con trasfondo y misiones secundarias, propias de cada
pueblo y entre pueblos. Esta carpeta guarda esa autoría; `integrar_motor.py` la compila junto con el reparto original
(los 142 personajes y sus IDs no se tocan).

Antes de escribir, leer:

- `docs/narrativa/01-mundo.md` (reglas del mundo y facciones).
- `docs/narrativa/09-regiones-y-recursos.md` (la sección de cada región).
- `docs/narrativa/03-reparto.md` (cómo están escritos los vecinos).
- `contexto-regiones.json` en esta carpeta (casas, recursos, conflicto y residentes actuales de cada pueblo).

## Tono (igual que el reparto existente)

- Personas adultas con errores reales y reparables. No hay villanos de pueblo.
- Nadie es humillado para que otro aprenda. El consentimiento importa y la fauna no es botín.
- Fuatia es neutral, y las almas de Verdia y Senda eligen.
- Español neutro y cálido, frases cortas, concretas y con humor suave. Nada de discursos grandilocuentes.
- **Prohibido:**
  - Nombres de personas reales, datos personales y referencias a la pareja real.
  - Romance entre Él y Ella: «lo romántico tiene dueño».
  - Violencia gráfica, salud mental tratada como chiste y política real.
- Él (`el`) y Ella (`ella`) son quienes juegan. Pueden decir una línea breve y práctica en un encargo, nunca algo romántico.
- Los vecinos nuevos no reemplazan ni contradicen a los existentes. Se vinculan con ellos (vínculos y encargos).

## Formato (un archivo JSON por grupo: `<grupo>.json`)

```json
{
  "residentes": [ {
    "id": "lirios_ramona",              // prefijo de la región como los existentes (lirios_, bruma_, piedra_, brasa_, nieve_, vigilia_, verdia_, eco_, senda_, hilos_, nox_, orbita_, aurelia_, nocturna_, esmeralda_, fragmentos_, ambar_, iris_) + nombre en minúsculas sin tildes; único
    "nombre": "Ramona",                  // nombre de pila que no se repita con ningún residente existente
    "asentamiento": "puerto_lirios",
    "funcion": "Oficio: qué hace en el pueblo (una línea, empieza con el oficio y dos puntos).",
    "pasado": "3-4 frases: edad, de dónde viene, un error o pérdida concreta y qué aprendió.",
    "presente": "2 frases: manías, gustos, cómo trata a los demás.",
    "arco": "1 frase: hacia dónde crece.",
    "vinculos": ["lirios_olga", "lirios_teo"],          // 2-3 IDs existentes o nuevos
    "naturaleza": "persona_viva",        // o "alma" en Verdia/Jardines del Eco y para las almas en purificación de Senda
    "voz": "Dirección de voz en una línea.",
    "hogar": "puerto_lirios_vivienda_05", // la casa nueva de la región (abajo) o una existente con espacio
    "memorias": [ {"etapa": "Primeros años y lo que aprendió a querer", "texto": "50-80 palabras"},
                  {"etapa": "Aprendizaje, decisiones y vínculos", "texto": "50-80 palabras"},
                  {"etapa": "Lo que cambia y lo que todavía pesa", "texto": "50-80 palabras"} ],
    "cotidiano": "1-2 frases de su día a día.",
    "postura_fuatia": "1 frase sobre Fuatia (neutral, curiosa, temerosa…).",
    "conversacion": [ {"hablante": "lirios_ramona", "texto": "..."}, {"hablante": "lirios_olga", "texto": "..."},
                      {"hablante": "lirios_ramona", "texto": "..."}, {"hablante": "el", "texto": "..."} ],  // 4 líneas: la primera charla
    "ropa": ["ella", 2, "#4a3226", "pelo_ondas", "sombrero_paja#e8c77a", "", "delantal#f6f2ea#2f6fa8", "falda#3e5a7a", "botas#3b2a22", "", "jarras"]
  } ],
  "viviendas": [ {"id": "puerto_lirios_vivienda_05", "asentamientoId": "puerto_lirios", "nombre": "Casa de las Redes Nuevas", "ocupantes": ["lirios_ramona", "lirios_tomas"]} ],
  "encargos": [ {
    "id": "E_puerto_lirios_1",            // E_<region>_<n> para los locales; EP_<n> para los de entre pueblos
    "titulo": "Título corto",
    "region": "puerto_lirios",            // donde se abre y se cierra
    "clase": "encargo",                  // o "encargo_entre_pueblos"
    "requiere": [],                       // IDs de encargos que deben cerrarse antes (opcional)
    "reparto": ["lirios_ramona", "lirios_olga"],
    "pasos": [                            // 2-4 pasos, solo de estos tipos:
      {"tipo": "testimonios", "texto": "Habla con Ramona y Olga.", "npc": ["lirios_ramona", "lirios_olga"]},
      {"tipo": "entrega", "texto": "Trae 3 maderas y 2 de sal de espejo.", "materiales": {"madera": 3, "puerto_lirios_mineral": 2}},
      {"tipo": "visitas", "texto": "Visita Brumaverde.", "regiones": ["brumaverde"]},
      {"tipo": "estadistica", "texto": "Pesca dos veces.", "clave": "pescar", "cantidad": 2},
      {"tipo": "jornadas", "texto": "Espera una noche a que seque.", "cantidad": 1},
      {"tipo": "archivo", "texto": "Consulta en el archivo público el registro de ..."}
    ],
    "inicio": [ {"hablante": "lirios_ramona", "texto": "..."} ],   // 3-4 líneas
    "giro":   [ {"hablante": "...", "texto": "..."} ],              // 2-3 líneas (aparece al cumplir los pasos)
    "decision": "Pregunta corta: A o B",
    "opciones": ["A: qué significa", "B: qué significa"],
    "ramas": [ [ {"hablante": "...", "texto": "..."}, {"hablante": "...", "texto": "..."} ],   // 2 líneas si elige A
               [ {"hablante": "...", "texto": "..."}, {"hablante": "...", "texto": "..."} ] ], // 2 líneas si elige B
    "cierre": [ {"hablante": "...", "texto": "..."} ],              // 2-3 líneas
    "recompensa": {"monedas": 120, "objetos": {"puerto_lirios_cosecha": 2}}   // modesta: 60-250 monedas y 1-3 objetos útiles
  } ]
}
```

## Reglas de los pasos

- **testimonios:** solo cuenta con quienes viven en la región del encargo (que el jugador ya les haya hablado).
- **entrega:** se hace en la región del encargo.
- **visitas:** cuenta si la región ya fue visitada alguna vez.
- **archivo:** se lee en el archivo público de la región del encargo.
- **Materiales válidos:**
  - De cada región: `<region>_mineral`, `<region>_madera`, `<region>_semilla`, `<region>_cosecha`.
  - Comunes: madera, piedra, fibra, heno, arcilla, arena, resina, cuero, sal, azucar, harina, aceite, tela, cuerda, vidrio,
    cobre, hierro, carbon, cuarzo, lingote_cobre, lingote_hierro, zanahoria, tomate, trigo, calabaza, fresa, maiz, patata,
    manzana, pan.
- **Estadísticas válidas:** cosechar, plantar, regar, alimentar, pescar, mineral, fabricar, construir, reparar, curar,
  comidas, expediciones, vender.
- **Encargos entre pueblos:** llevan cosas de un pueblo a otro (entrega de recursos de otra región), piden visitas y
  juntan a vecinos de lugares distintos. Las líneas pueden ser de residentes de cualquier región.
- **Hablantes válidos:** cualquier ID de residente (existente o nuevo), `el`, `ella`, `narrador`.

## Cuántos

Por cada región del grupo:
- 2 residentes nuevos.
- 1 vivienda nueva para los dos (salvo `rosal_eterno`, que ya tiene 6 casas: ahí van a casas existentes con poca gente).
- 2 encargos locales.

Además, 2 encargos entre pueblos por grupo.
