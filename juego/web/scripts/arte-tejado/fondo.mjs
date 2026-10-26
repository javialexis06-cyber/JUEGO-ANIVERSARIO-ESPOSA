// Escenario propio del tejado, con la misma proporción y franjas que cada cuadrante de fondos-mundos (768×512):
// cielo y fachada arriba (0–27 %), tejas en el área de juego (27–98 %) y alero abajo. Variante de día.
const T='#2b1d12';
const filas=[...Array(9)].map((_,f)=>{
 const y=150+f*40;
 return [...Array(26)].map((_,c)=>{const x=-14+c*32+(f%2)*16;return`<path d="M${x} ${y} h30 v34 q-15 10 -30 0z" fill="url(#teja)" stroke="#7a2c1a" stroke-width="2"/>`;}).join('');
}).join('');
export const SVG_FONDO_TEJADO=`<svg xmlns="http://www.w3.org/2000/svg" width="768" height="512" viewBox="0 0 768 512">
<defs>
 <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb6f0"/><stop offset="1" stop-color="#cdeefc"/></linearGradient>
 <linearGradient id="teja" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9734d"/><stop offset=".7" stop-color="#c54a2c"/><stop offset="1" stop-color="#9c3520"/></linearGradient>
 <linearGradient id="sombraTejado" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgba(60,20,10,.35)"/><stop offset=".35" stop-color="rgba(60,20,10,0)"/></linearGradient>
</defs>
<rect width="768" height="512" fill="url(#cielo)"/>
${[[90,60,46],[250,40,34],[600,70,52],[700,30,30]].map(([x,y,r])=>`<g fill="#ffffff" opacity=".92"><circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x+r}" cy="${y+8}" r="${r*.8}"/><circle cx="${x-r}" cy="${y+10}" r="${r*.7}"/></g>`).join('')}
<path d="M0 120 C120 96 220 112 320 100 C430 88 560 112 768 96 L768 150 L0 150Z" fill="#4c8f3b"/>
<path d="M0 135 C150 118 320 132 480 120 C600 112 700 128 768 120 L768 150 L0 150Z" fill="#37702c"/>
<rect x="610" y="58" width="58" height="96" fill="#b2533a" stroke="${T}" stroke-width="5"/><rect x="600" y="50" width="78" height="18" fill="#8c3c28" stroke="${T}" stroke-width="5"/>
<g>${filas}</g>
<rect x="0" y="150" width="768" height="352" fill="url(#sombraTejado)"/>
<path d="M0 150 L768 150" stroke="#7a2c1a" stroke-width="6"/>
<rect x="0" y="500" width="768" height="12" fill="#6e4a2e"/>
</svg>`;
