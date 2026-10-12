// El sonido de las diosas (Celia, Aura, Lara y Fuatia) en toda la granja: el «suave» que escogió Javier el 12 de octubre
// de 2026 (la catedral le pareció demasiado): un eco corto y discreto, un coro que casi no se nota y un poquito de
// brillo arriba. Lo usan voces-cine.mjs (las películas) y voces-astra.mjs (las escenas de la campaña).
export const FILTRO_CELESTIAL = 'highpass=f=90,chorus=0.8:0.9:25|35:0.09|0.07:0.3|0.4:1|1.3,aecho=0.9:0.85:70|130:0.13|0.07,equalizer=f=8500:t=q:w=1:g=1.5';
export const DIOSAS = new Set(['celia', 'aura', 'lara', 'fuatia']);
