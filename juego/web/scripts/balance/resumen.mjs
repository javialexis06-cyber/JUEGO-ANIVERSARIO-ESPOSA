/** Resumen de una corrida de balance (scripts/balance/jugar.mjs): por país, victorias del piloto, podadoras gastadas,
 * duración y qué zombis cruzaron la casa; al final, las derrotas con su formación.
 *   node scripts/balance/resumen.mjs [carpeta=test-results/balance-campana] [archivo=resultados.jsonl] */
import fs from 'node:fs';
import path from 'node:path';
const dir = path.resolve(process.argv[2] ?? 'test-results/balance-campana'), archivo = process.argv[3] ?? 'resultados.jsonl';
const plan = JSON.parse(fs.readFileSync(path.join(dir, 'plan.json'), 'utf8'));
const pasos = new Map(plan.pasos.map(p => [p.area, p]));
const filas = fs.readFileSync(path.join(dir, archivo), 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
    .filter(r => ['victoria', 'derrota', 'captura-perdida'].includes(r.fase));
const PAISES = ['Verdalia', 'Arenaria', 'Marisma', 'Solaria', 'Coralia', 'Borealia', 'Altarruta', 'Forjaria', 'Neón', 'Sauria', 'Nubaria', 'Umbra'];
const porPais = new Map();
for (const r of filas) {
    const p = pasos.get(r.area), k = p.pais;
    if (!porPais.has(k)) porPais.set(k, { areas: 0, victorias: 0, dia: [0, 0], noche: [0, 0], podadoras: 0, segundos: 0, cruzaron: new Map() });
    const q = porPais.get(k), gano = r.fase === 'victoria';
    q.areas++; if (gano) { q.victorias++; q.podadoras += r.podadoras ?? 0; q.segundos += r.segundos; }
    q[p.noche ? 'noche' : 'dia'][0]++; if (gano) q[p.noche ? 'noche' : 'dia'][1]++;
    for (const z of r.llegaron ?? []) q.cruzaron.set(z, (q.cruzaron.get(z) ?? 0) + 1);
}
const lineas = ['| País | Áreas | Victorias | Día | Noche | Podadoras por victoria | Duración media | Zombis que más llegaron |', '|---|---|---|---|---|---|---|---|'];
let total = 0, ganadas = 0;
for (const [k, q] of [...porPais].sort((a, b) => a[0] - b[0])) {
    total += q.areas; ganadas += q.victorias;
    const top = [...q.cruzaron].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([z, n]) => `${z} (${n})`).join(', ') || '—';
    lineas.push(`| ${k + 1}. ${PAISES[k]} | ${q.areas} | ${q.victorias} (${Math.round(q.victorias / q.areas * 100)} %) | ${q.dia[1]}/${q.dia[0]} | ${q.noche[1]}/${q.noche[0]} | ${q.victorias ? (q.podadoras / q.victorias).toFixed(1) : '—'} | ${q.victorias ? Math.round(q.segundos / q.victorias) + ' s' : '—'} | ${top} |`);
}
lineas.push('', `Total: ${ganadas} de ${total} áreas (${Math.round(ganadas / Math.max(1, total) * 100)} %).`, '', 'Derrotas:', '');
for (const r of filas.filter(r => r.fase !== 'victoria')) {
    const p = pasos.get(r.area);
    lineas.push(`- ${r.area} ${p.nombre} (${PAISES[p.pais]}, ${p.tipo}, ${p.filas} carriles${p.agua ? ', agua' : ''}${p.noche ? ', noche' : ''}, cupo ${p.cupo}): ${p.nativos.join(', ')}. Llegaron: ${(r.llegaron ?? []).join(', ') || '—'}.`);
}
console.log(lineas.join('\n'));
