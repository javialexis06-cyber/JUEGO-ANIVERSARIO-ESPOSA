// jardin.html: la pantalla de título de «Plantas contra Zombis: La Semilla Madre» (src/jardin/pvz/). Los 12 patios
// de antes siguen en clasicos.ts y se abren con ?clasicos (o ?nivel=<patio>, como en sus pruebas).
const params = new URLSearchParams(location.search);
if (params.has('clasicos') || params.has('nivel')) void import('./clasicos');
else void import('./pvz/inicio').then((m) => m.iniciarPvZ());
