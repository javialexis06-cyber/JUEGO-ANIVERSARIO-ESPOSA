# Audio de La Semilla Madre · entrega de Claude (23 de octubre de 2026)

Ejecutada la [guía de ElevenLabs](pvz-elevenlabs-guia-claude.md). **Los 253 archivos del plan están producidos,
revisados y publicados** en `juego/web/public/jardin/pvz/audio/` con su `indice.json` (99 familias de efectos y
8 pistas de música). No hay pendientes del plan. Falta solo lo que corresponde a Codex: reproducirlos en el juego.

## Qué se hizo

- Producción con `scripts/pvz-audio/generar-elevenlabs.mjs` (efectos `eleven_text_to_sound_v2`, música
  `music_v1` instrumental de 60 s). Se le añadió espera y reintento ante HTTP 429, que ElevenLabs devuelve sin cobro.
- Saldo consultado: 36.882 créditos antes, **24.228 después** (≈12.650 gastados, sin compras ni sobrecostes).
- Preparación con `scripts/pvz-audio/normalizar.mjs` (nuevo): efectos sin silencio largo al inicio/final y
  ≈ −18 LUFS; música y ambientes enteros (bucles) y ≈ −23 LUFS; pico verdadero ≤ −1 dBTP en todos; MP3 44,1 kHz
  128 kb/s. Medición por archivo en [`produccion/pvz-audio/informe.json`](../../juego/web/produccion/pvz-audio/informe.json).
- `validar.mjs --desde produccion/pvz-audio/listos --publicar`: los 253 decodifican con ffmpeg y respetan duración.
  Lista revisada: `produccion/pvz-audio/revisados.json`.
- Dave: sus 10 balbuceos se pasaron por el transcriptor de ElevenLabs. Los dos de **aviso** decían «no, no, no»: se
  ajustó su prompt en `plan.json` y se regeneraron (ahora «[humming]» / «[making noises]»). Los demás transcriben
  como risas, balbuceos o ruidos, sin palabras. Ningún texto del tutorial se envió a voz.
- Versión de amigos: `verificar-amigos` admite `jardin/pvz/audio/` (efectos y música, nada de la pareja).

## Límites honestos

- La «escucha» fue con mediciones (duración, volumen, silencios, espectrograma) y transcripción, no con oído humano:
  conviene que Javier oiga una partida y diga si alguna identidad no encaja; se regenera solo esa familia.
- Licencia: los audios salen de una cuenta de pago (plan Creator) de ElevenLabs, que permite uso comercial de efectos
  y música generados; son originales, no descargas.
- Los originales y los marcadores de cada petición quedan fuera de Git (`generados/`, `listos/`).
