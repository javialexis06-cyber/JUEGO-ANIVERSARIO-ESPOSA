# Recursos visuales

Las fuentes están en [blender/](blender/). Los modelos optimizados usados por el juego se publican en
`juego/web/public/modelos/`; las salidas sin optimizar y capturas son locales y se excluyen del repositorio.
No mover modelos publicados sin actualizar sus consumidores y conservar los IDs de contenido adquirido.

## Fuentes por juego

| Prefijo | Recurso |
|---|---|
| `exportar_glb.py`, `el.py`, `ella.py`, `rig.py`, `poses.py` | Personajes, esqueleto compartido y exportación general. |
| `carreras_*.py` | Carros, circuitos, arenas e iconos de Carreras. |
| `patio_figuras.py` | Ocho plantas y cinco zombis originales, retratos y documentos de los cuatro expedientes nuevos. |
| `peleas_*.py` | Escenarios, efectos y poses propias de Torneo. |
| `granja_*.py` | Recursos de granja; desarrollo pausado. |
| `sangre_*.py`, `lavado_*.py` | Recursos de los juegos de supervivencia. |

Para las poses del Torneo, desde la raíz:

```sh
blender -b --threads 2 --python-exit-code 1 -P personajes/blender/peleas_poses.py
```

Genera `juego/web/src/peleas/poses-blender.json`, utilizado directamente por el juego. No reexporta cuerpos ni
modifica recursos de granja. Inspeccionar las poses por ambos lados y pasar la regresión de Torneo al cambiarlas.

Los demás exportadores describen sus argumentos en la cabecera. Las guías específicas están en
[Carreras](../docs/sistemas/carreras.md) y [Torneo](../docs/sistemas/peleas.md).

Figuras del patio (una malla/material por personaje):

```sh
blender -b --threads 2 --python-exit-code 1 -P personajes/blender/patio_figuras.py
cd juego/web
npx gltf-transform quantize public/jardin/figuras.glb /tmp/patio-figuras.glb --quantize-color 8
cp /tmp/patio-figuras.glb public/jardin/figuras.glb
```

`-- --solo-modelos` en el exportador omite los retratos y documentos. La cuantización no requiere decodificador
externo; conserva las trece raíces usadas por el juego. Revisar las figuras en navegador después de regenerarlas.
