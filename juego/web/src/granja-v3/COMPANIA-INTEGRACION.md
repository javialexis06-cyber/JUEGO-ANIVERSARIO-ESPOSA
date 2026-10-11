# Compañeros y monturas: integración en el motor existente

Fase integrada el **9 de octubre de 2026**, sobre `granja-v3`, guardado V5. No inicia un motor nuevo. Este documento registra una fase funcional; no certifica paridad con Stardew Valley, Expanded o Automate.

## Colección y adquisición

| Familia | Variedades iniciales | Coste de adopción | Hogar | Alimento manual |
|---|---|---:|---|---|
| Gato | Canela, negro, gris, blanco | 120 | `hogar_mascota` | `alimento_mascota` |
| Perro | Dorado, negro, gris, crema | 150 | `hogar_mascota` | `alimento_mascota` |
| Tortuga | Oliva, bosque, pizarra, arena | 220 | `hogar_mascota` | `alimento_mascota` |
| Caballo | Castaño, negro, gris, palomino | 320 | `establo` | `heno` |

Las tres mascotas se descubren con **Un hogar entre la maleza**; el establo y el caballo con **El primer surco**. Las variedades gris y clara requieren **Manos que cuidan**. La disponibilidad deriva también de las misiones ya completadas, para no bloquear partidas anteriores que carecen de las nuevas banderas. La compra requiere visitar el servicio `animales` del pueblo, nombre válido, monedas, un hogar compatible libre y patio despejado.

Cada compañero tiene su propio hogar: máximo ocho mascotas y dos caballos por granja. El hogar de mascota ocupa 2 × 2, cuesta 80 y se fabrica con 10 maderas, 4 fibras y 2 piedras. El establo ocupa 4 × 4 más un corral de 4 × 4, cuesta 420 y se fabrica con 40 maderas, 16 piedras y 4 hierros. Es un edificio de carpintería con interior accesible. Los costes son reglas de este proyecto, no precios de la referencia.

No se agregan estas familias a `ESPECIES`: las doce familias de ganado productivo conservan sus sistemas, genética, refugios, incubación y productos. Los compañeros no producen huevos, lana o leche. Cada compañero posee `Genome`; A/a y B/b determinan las cuatro apariencias mediante dominancia. La reproducción de mascotas y caballos **no está habilitada** en esta fase; la presencia del genoma no debe presentarse como crianza funcional.

## Cuidados, vínculo y relojes

Se reutiliza `AnimalCare`. Tras 24 horas reales aparece necesidad de comida/cariño y tras 48 horas enfermedad/depresión. No hay muerte animal. Alimentar o consentir no borra una enfermedad ya iniciada; necesita visita veterinaria, cuyo precio base de 60 respeta la profesión que reduce ese coste. Las acciones de cuidado requieren cercanía física, zona correcta y estar al aire libre, con el jugador desmontado.

El vínculo está entre 0 y 1000. Acariciar, música, cuento o cepillado restauran el cuidado real y conceden **12 puntos una vez por jornada de juego**, compartiendo la misma marca entre métodos. Los clics adicionales no multiplican esos puntos. Llenar el cuenco con la regadera concede **6 puntos al dormir**, una vez en esa jornada. El cuenco conserva su marca al guardar y aparece seco la jornada siguiente. La lluvia activa de la granja llena cuencos según su clima; no se simula lluvia por ausencia.

El alimento de mascotas se compra en la tienda de animales por 20 monedas y consume una ración por acción, conservando el resto de las pilas. El caballo también puede comer pasto del establo: cuatro semillas o jardinero por 25 monedas rellenan hasta 64 raciones. Consume una cada ocho horas reales **solo mientras está en su patio**. Irse al pueblo o al bosque no consume remotamente ese pasto. La animación de pastoreo no descuenta raciones extra. El contrato avanzado del mayordomo atiende a los compañeros cada seis horas reales consumiendo alimento de mascota o heno finitos; cuenta cuentos, pero no concede vínculo por ausencia ni cura automáticamente enfermedad ya iniciada.

Ni el tiempo ausente ni caminar incrementan jornadas, crecimiento de cultivos, edad de crías o incubación. El crecimiento existente continúa exclusivamente al dormir. Dormir conserva el vínculo y los cuidados reales y retorna los compañeros junto a sus hogares. Busca un punto vecino si el patio se ha obstruido; si tampoco hay espacio, conserva al animal en su último lugar en vez de colocarlo dentro de una pared.

## Movimiento y controles

- **Mascota:** clic para acariciar; alimento seleccionado para alimentar; clic derecho para abrir Mascotas. El cuenco tiene selección propia y se llena con regadera. En la tarjeta se activa acompañar o volver al hogar. Pasea por la granja hacia el jugador con rutas acotadas, evitando edificios, árboles, rocas, agua, huecos, enrejados y dispositivos sólidos. Por la noche regresa junto al hogar y descansa. No sigue al jugador a otras regiones en esta fase.
- **Caballo:** clic cercano para montar; heno seleccionado para alimentar. WASD/flechas y pad táctil mueven jinete y montura juntos. Velocidad de paseo 4,8 m/s, frente a 3,4 del personaje; carrera 6,1 frente a 5,1, antes de bonos existentes. El personaje usa su pose sentada, oculta la herramienta y conserva dirección y posición de la montura.
- **Desmontar:** botón visible con texto completo en escritorio/celular, clic en el caballo montado o tarjeta de Mascotas. El motor busca una posición vecina libre para el personaje y deja al caballo esperando donde se bajó. Si no hay lugar, rechaza la acción sin perder la montura.
- **Senderos:** viajar por las conexiones caminables lleva al caballo a la llegada de la otra zona. El guardado conserva quién va montado, región, posición y dirección. Hay que desmontar para entrar en casa, servicios, minas o expediciones y para trabajar con herramientas. Una montura hambrienta, enferma o deprimida deja de avanzar; permite desmontar, atender y volver a montar.
- **Establo:** clic en su puerta para entrar; tarjeta interior para abrir cuidados o salir. El caballo espera en el patio. No se representa como un animal productivo ni usa las puertas/comedero del ganado.

`transito.ts` reúne la colisión exterior usada por personaje y compañeros; los datos/colisiones del pueblo están en `pueblo-datos.ts`, sin dependencias de render. La búsqueda de rutas de mascotas visita como máximo 512 celdas, conserva una caché de colisión por revisión y estado, y se pausa al abrir paneles, interiores, servicios, atlas o resumen nocturno. No reconstruye el mundo en cada fotograma. Las vallas decorativas colocables y sus portones aún necesitan colisión propia; este módulo conserva ese pendiente del motor general.

## Estado y API para Claude

```ts
estado.compania = {
  version: 1,
  animales: Companero[],
  montada: string | null,
};
```

`Companero` conserva id, familia, nombre, genoma, hogar por id, cuidado, vínculo, marcas diarias, seguimiento, región/posición, dirección y actividad. Al mover/girar un hogar siguen su id y se conservan cuidado, genes, agua y vínculo. El motor comprueba que el patio de destino esté libre. No se puede guardar un hogar ocupado como plano; se puede trasladar al compañero a otro hogar compatible libre para liberar el anterior.

Una partida V5 con `compania` ausente obtiene la colección vacía, sin añadir mascotas, cobrar monedas o reiniciar su granja. Si el campo existe pero está corrupto, se rechaza. El validador comprueba límites, ids duplicados, hogares compatibles/ocupación, nombres, genomas, fechas, marcas diarias, posiciones y coherencia de montura/jinete. Las rutas temporales no se guardan y se limpian al cargar. Un fallo de acción conserva el estado completo y la vista vuelve a enlazar al estado restaurado.

```ts
motor.actuar({tipo:'compania', xJugador, zJugador, accion:{
  tipo:'adoptar', animal:'gato', variante:0, nombre:'Michi', edificioId,
}});
motor.actuar({tipo:'compania', xJugador, zJugador,
  accion:{tipo:'cuidar', id, metodo:'acariciar'}});
// cuidar: alimentar | acariciar | musica | cuento | cepillar | medico
// Otras acciones: agua | seguir | montar | desmontar | trasladar
// trasladar añade edificioId; todas las acciones salvo adoptar incluyen id.
motor.pasoCompania(dt, xJugador, zJugador, direccionJugador);
```

`modeloCompania(tipo, variante, calidad)` exporta los modelos procedimentales originales; `hogarMascotaVista` el hogar y el cuenco. No requieren imágenes o GLB nuevos. Cada variedad admite reposo, caminar, comer, cariño y descanso. Presupuesto medido por ejemplar: 3.696–5.676 triángulos en detalle ligero; máximo 15.660 en alto y 15–22 llamadas de dibujo. Solo se mantienen ejemplares dentro de la zona y del radio visible. Estas cifras no sustituyen una medición física en S21 FE o S24 Ultra.

## Evidencia y pendientes

`probar-compania.mjs`: **46 casos** de adquisición, variedad, economía, límites, cuidados, vínculo, cuencos, pasto, rutas, traslado, montaje, viaje y guardado. `probar-arte-compania.mjs`: **34 casos** de geometría finita, animaciones y presupuesto de los 32 modelos familia/variedad/LOD y cuencos. Junto con las 17 suites existentes: **392 comprobaciones en 19 suites**, sin fallos.

`work/qa-compania.cjs`: trece flujos de navegador con puntero, teclado, recarga, establo, veterinario y viewport táctil 412 × 915. Informes `work/qa-motor/compania-{regresion,navegador}.json`, logs `work/qa-motor/compania/`, capturas `work/qa-motor/renders/compania-*.png`. Los escenarios preparan monedas, misiones y terreno para aislar los mecanismos; no prueban toda la campaña, equilibrio ni rendimiento en dispositivos físicos. Compilación TypeScript/Vite correcta; el aviso previo de importación mixta de `coreografias.ts` pertenece al proyecto principal.

Pendiente: más apariencias, regalos/efectos del vínculo, entrada de mascotas a casas, reproducción/equipamiento de compañeros, monturas fantásticas y llamada de montura. El caballo retorna al patio, no tiene aún una rutina de entrada/descanso en el interior del establo. También siguen navegación completa del ganado, colisiones entre animales, portones de vallas colocadas, ampliaciones de establo y hogar; comunidad con horarios/eventos y balance del conjunto.

Referencia para contrastar los roles de ganado, mascotas y caballo: [Animales](https://es.stardewvalleywiki.com/Animales). La implementación, arte, costes, herencia y cuidado descritos son propios del proyecto.

Los encargos de construcción por jornadas se integraron después de esta fase; ver [CARPINTERIA-INTEGRACION.md](./CARPINTERIA-INTEGRACION.md). Los establos nuevos ya utilizan el ciclo de encargo/emplazamiento/obra.
