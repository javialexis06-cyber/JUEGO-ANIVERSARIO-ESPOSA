# Voces con IA (ElevenLabs) para los recuerdos de Cien Puertas

Las frases de los 20 recuerdos y del final (177 frases, unos 8.400 caracteres) se generan con las voces
clonadas de Él y Ella. El juego ya sabe reproducirlas: si existe `juego/web/public/voces/<código>.mp3` y está en
`lista.json`, suena mientras sale su globo (ver `src/puertas/voces.ts`).

## Lo que hace la pareja (una sola vez)

1. En ElevenLabs, crear dos voces con «Instant Voice Clone», llamadas exactamente **Ella** y **Él**, con 1 a 3
   minutos de audio limpio de cada uno (notas de voz sin música ni otras voces).
2. Crear una clave de API en ElevenLabs.
3. En la configuración del entorno de Claude Code: permitir el dominio `api.elevenlabs.io` (Network access) y
   agregar la variable de entorno `ELEVENLABS_API_KEY` con la clave. Se activa en una sesión nueva.

## Lo que hace Claude en la sesión nueva

Rama de trabajo: `claude/supermarket-mania-minigame-xn2it8`.

```sh
cd juego/web
SECO=1 node scripts/voces-ia.mjs     # cuenta frases y caracteres, no gasta nada
node scripts/voces-ia.mjs            # genera lo que falte en public/voces y arma lista.json
```

- Si falla con 401/403: la clave no está o no tiene permiso de texto a voz y lectura de voces.
- Si no encuentra las voces: deben llamarse «Ella» y «Él» (o pasar sus códigos en `VOZ_ELLA` y `VOZ_EL`).
- Para rehacer una frase: borrar su mp3 (o `FORZAR=1 SOLO=r050 node scripts/voces-ia.mjs` para un recuerdo).
- Revisar que suene: `node scripts/_recuerdo.mjs <carpeta> 25` (con el servidor de Vite corriendo) muestra la
  tarjeta y el diálogo de la puerta 25; los audios quedan en `public/voces/`.
- Después: commit y push a la rama, y compilar la APK (GitHub Actions) para que la pareja la instale.
- La clave nunca va en el código ni en el chat: solo en la variable de entorno.
