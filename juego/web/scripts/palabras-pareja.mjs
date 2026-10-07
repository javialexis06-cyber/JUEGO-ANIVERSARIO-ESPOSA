// Las palabras que un amigo NUNCA debe ver: apodos, lugares, recuerdos y chistes de la pareja (docs/la-pareja.md,
// los recuerdos de docs/sistemas/cien-puertas.md y las cartas de amor del lavado). Las pruebas de amigos buscan esto en la
// pantalla y en los avisos. (Los nombres Javier y Laura sí se ven: son jugadores como cualquiera.)
export const PALABRAS_PAREJA = [
  'esposa', 'esposo', 'pulga aventurera', 'protagonista', 'guerrera de Dios', 'panda', 'perro lanudo', 'liefje', 'liefte', 'mi amor',
  'Sopetrán', 'Bucaramanga', 'wafle', 'frappé', 'fresas con crema', 'Yanbal', 'directora', 'iPhone', 'pulelo', 'Transformice', 'Cartagena',
  'videollamada', 'Medellín', 'Halloween', 'propuesta', 'planetario', 'Parque Explora', 'Katherine', 'Lexy', '25 de octubre', 'aniversario',
  'carta de amor', 'cartas de amor', 'recuerdo', '💌', '💞',
  // (de su chat: cómo se dicen)
  'mimilona', 'cotita', 'betito', 'betitos', 'esposha', 'amodoro', 'Duolingo',
  // (la anécdota de los wafles: el plato solo no delata nada, la promesa sí)
  'wafles cada vez', 'mis wafles',
];

const plano = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Qué palabras de la lista aparecen en el texto (sin importar tildes ni mayúsculas; las cortas, como palabra entera). */
export function buscarPersonal(texto, lista) {
  const t = plano(texto);
  const hallado = new Set();
  for (const p of lista) {
    if (!p || p.length < 3) continue;
    const q = plano(p.replace(/[«»"“”]/g, '').trim());
    if (!q) continue;
    if (q.length <= 8 && /^[a-z0-9 ]+$/.test(q)) {
      if (new RegExp(`\\b${q.replace(/ /g, '\\s+')}\\b`).test(t)) hallado.add(p);
    } else if (t.includes(q)) hallado.add(p);
  }
  return [...hallado];
}
