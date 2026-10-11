# Publicación de la wiki

La wiki es un repositorio separado: <https://github.com/javialexis06-cyber/JUEGO-ANIVERSARIO-ESPOSA/wiki>.
El usuario autorizó completarla y después pidió «has push a todo» el 11 de octubre de 2026.
La pausa del código queda levantada; se integra primero el trabajo remoto de Claude y se publican el juego y la wiki.

Primera publicación completa: commit de wiki `537d04bdf186737746da98000703af57e81b42d4`.
Comprobado que el remoto coincide y responde HTTP 200 en inicio, una ficha de NPC, una misión secreta
y el catálogo descargable de recompensas. Las 585 páginas tienen enlaces internos resueltos;
se revisaron las referencias a documentos remotos, las 197 recompensas y la reproducibilidad del exportador.

`generar.py` convierte una revisión explícita de la documentación remota, la rama separada del Show
y la biblia local de Astra en páginas navegables. No modifica el motor ni usa ElevenLabs. No hace commits ni pushes.
La salida debe quedar fuera del repositorio del juego, normalmente en un clon de su wiki:

```bash
git clone https://github.com/javialexis06-cyber/JUEGO-ANIVERSARIO-ESPOSA.wiki.git /workspace/JUEGO-ANIVERSARIO-ESPOSA-wiki
python docs/wiki/generar.py \
  --salida /workspace/JUEGO-ANIVERSARIO-ESPOSA-wiki \
  --revision origin/claude/supermarket-mania-minigame-xn2it8 \
  --show ab7d01a9ff836b529526b33a54c06e7b50bf14ab
```

Para una actualización, traer primero los cambios de ambos repositorios sin sobrescribir trabajo paralelo.
Elegir los SHA nuevos de forma explícita y revisar estados: el generador conserva un resumen editorial
que debe actualizarse cuando avance la implementación. No convertir una propuesta antigua en contenido
terminado por el mero hecho de exportarla. Si una página fuente cambia de nombre, actualizar su mapa.

La exportación inicial contiene 585 páginas: guías de juegos y sistemas, 142 fichas de habitantes,
cinco figuras, tres protagonistas/antagonistas, 197 misiones, 19 lugares, 98 relaciones y 151 guiones por voz.
La ampliación de Fuatia exporta 638 páginas: seis figuras, 217 misiones, 284 conversaciones personales,
14 escenas cinematográficas, 24 territorios de recursos y 152 guiones con 2.750 líneas.
Las páginas Armas y combate distinguen el primer motor integrado de Confluencia y sus ajustes aún diseñados.
También copia los catálogos JSON y el CSV de tomas a rutas descargables del repositorio de la wiki.
`exportacion.json` registra revisiones y SHA-256 de las páginas; dos ejecuciones con las mismas fuentes
deben producir el mismo manifiesto. Las páginas nuevas de Astra tienen una advertencia de diseño no integrado.

La validación incorporada comprueba cardinalidades, correspondencia de misiones y recompensas,
enlaces internos, regiones y exclusión de algunas secciones privadas. La revisión editorial adicional
verifica referencias a archivos en Git, pasos, ramas, premios y estados de publicación.
No se copian `docs/la-pareja.md`, credenciales, los recuerdos reales de Cien Puertas ni datos de salud.

Revisar `git diff --cached --check` en la wiki antes de su commit y publicar sin push forzado.
La actualización documental va al remoto de la wiki; el código se publica por separado tras combinar el trabajo paralelo
y superar las pruebas. La fuente de la wiki debe ser el commit del juego efectivamente publicado.
No borrar páginas externas a la exportación: podrían ser contribuciones nuevas del usuario.
