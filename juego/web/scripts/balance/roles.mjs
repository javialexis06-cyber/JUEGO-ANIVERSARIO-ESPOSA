/** Papel de cada planta para el jugador simulado de la prueba de balance (no cambia el juego).
 * sol: produce soles · ataque: dispara o lanza · muro: aguanta · instante: explota o congela una vez ·
 * mina: se arma en el suelo · agua: nenúfar · otro: no lo usa el piloto (apoyos, enredaderas, mentas…). */
const NO_USA = new Set(['pvine', 'gloomvine', 'pyrevine', 'shinevine', 'torchwood', 'spikeweed', 'spikerock', 'garlic', 'umbrellaleaf', 'marigold',
    'floawerPot', 'imitater', 'powerplant', 'goldleaf', 'pumpkin', 'tanglekelp', 'seashroom', 'goldbloom', 'magnifyinggrass', 'plantern', 'sunbean',
    'moonbean', 'toadstool', 'gravebuster', 'blover', 'escaperoot', 'grimrose', 'perfumeshroom', 'powerlily', 'thymewarp', 'bulbkekengi', 'hypnoshroom',
    'puffshroom', 'scaredyshroom', 'shadowshroom', 'empea', 'hotpotato', 'iceburg', 'explodeonut', 'aloe', 'peach', 'lychee', 'mirrornut', 'gumnut', 'hollyknight',
    // Alcance corto o apoyo: el piloto las sembraría atrás, donde no alcanzan a nadie.
    'fumeshroom', 'gloomshroom', 'wasabiwhip', 'snapdragon', 'coldsnapdragon', 'moonflower', 'nightshade', 'sporeshroom']);
const PREFERENCIA_SOL = ['twinsunflower', 'primalsunflower', 'sunflower', 'solarsage', 'sunshroom'];
export function papel(p) {
    if (!p) return 'otro';
    const n = p.id;
    if (n === 'lilypad') return 'agua';
    if (NO_USA.has(n) || p.recarga >= 60) return 'otro';
    if (p.familia === 'Sun') return PREFERENCIA_SOL.includes(n) ? 'sol' : 'otro';
    if (n === 'potatomine' || n === 'primalpotatomine') return 'mina';
    if (p.familia === 'Explosive' || ['jalapeno', 'icebloom', 'squash', 'chillypepper', 'doomshroom'].includes(n)) return p.recarga >= 15 ? 'instante' : 'otro';
    if (p.familia === 'Defence') return p.vida >= 2000 && p.coste > 0 ? 'muro' : 'otro';
    if (['Peashooter', 'Lobber', 'Fire', 'Cold', 'Electricity', 'Shadow', 'Sharp', 'Poison'].includes(p.familia)) return p.recarga <= 12 && p.coste > 0 ? 'ataque' : 'otro';
    return 'otro';
}
/** Cuánto vale una planta dentro de su papel (para elegir la mejor que se tenga). */
export function valor(p, rol) {
    if (!p) return 0;
    if (rol === 'sol') return 10 - PREFERENCIA_SOL.indexOf(p.id);
    if (rol === 'muro') return p.vida / 1000 - p.coste / 200;
    // Atacantes e instantáneos: más soles suelen ser más poder; un tope evita plantas que el combate no deja pagar al inicio.
    // Las carambolas disparan en estrella y rinden menos en su propio carril.
    return Math.min(p.coste, 350) * (/starfruit/.test(p.id) ? 0.6 : 1);
}
