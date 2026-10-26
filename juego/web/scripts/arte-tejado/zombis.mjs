// Accesorios propios de los zombis del tejado (hoja 4×2 de 384×512). Los cuerpos reutilizan la ropa ilustrada ya aprobada.
const T='#2b1d12',G=7;
const celda=(i,c)=>`<g transform="translate(${(i%4)*384},${Math.floor(i/4)*512})">${c}</g>`;
const defs=`<defs>
 <linearGradient id="madera" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a6435"/><stop offset=".5" stop-color="#d49a5c"/><stop offset="1" stop-color="#8a5328"/></linearGradient>
 <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6eef2"/><stop offset=".5" stop-color="#9fb0ba"/><stop offset="1" stop-color="#5e6d77"/></linearGradient>
 <linearGradient id="robot" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a7b6bf"/><stop offset=".55" stop-color="#6b7c87"/><stop offset="1" stop-color="#39454e"/></linearGradient>
 <radialGradient id="balon" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffb86a"/><stop offset="1" stop-color="#c85a14"/></radialGradient>
 <radialGradient id="fuego" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fff6b0"/><stop offset=".45" stop-color="#ffb02e"/><stop offset="1" stop-color="#d8361a"/></radialGradient>
 <radialGradient id="hielo" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#9fe6ff"/><stop offset="1" stop-color="#3a8fd0"/></radialGradient>
 <linearGradient id="carro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d14b3a"/><stop offset="1" stop-color="#86261c"/></linearGradient>
 <linearGradient id="caravana" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f1e2"/><stop offset="1" stop-color="#c9bfa6"/></linearGradient>
</defs>`;
const escalera=`<g transform="rotate(-6 192 270)">${[0,1].map(l=>`<rect x="${110+l*140}" y="40" width="24" height="440" rx="8" fill="url(#madera)" stroke="${T}" stroke-width="${G}"/>`).join('')}
 ${[...Array(8)].map((_,i)=>`<rect x="128" y="${76+i*52}" width="128" height="16" rx="6" fill="url(#madera)" stroke="${T}" stroke-width="5"/>`).join('')}</g>`;
const catapulta=`<rect x="40" y="300" width="300" height="110" rx="22" fill="url(#carro)" stroke="${T}" stroke-width="${G}"/>
 <path d="M70 320 L310 320" stroke="#f2a08f" stroke-width="8" opacity=".5" stroke-linecap="round"/>
 ${[90,290].map(x=>`<circle cx="${x}" cy="420" r="52" fill="#3a3a3a" stroke="${T}" stroke-width="${G}"/><circle cx="${x}" cy="420" r="22" fill="url(#metal)" stroke="${T}" stroke-width="5"/>`).join('')}
 <path d="M190 300 L120 110" stroke="${T}" stroke-width="26" stroke-linecap="round"/><path d="M190 300 L120 110" stroke="url(#madera)" stroke-width="14" stroke-linecap="round"/>
 <path d="M70 100 C70 60 170 60 170 100 C150 130 90 130 70 100Z" fill="url(#metal)" stroke="${T}" stroke-width="${G}"/>
 <circle cx="120" cy="70" r="40" fill="url(#balon)" stroke="${T}" stroke-width="${G}"/><path d="M80 70 L160 70 M120 30 L120 110 M92 42 C110 60 110 80 92 98 M148 42 C130 60 130 80 148 98" stroke="${T}" stroke-width="4" fill="none"/>
 <rect x="220" y="250" width="90" height="56" rx="10" fill="#5a6b4a" stroke="${T}" stroke-width="6"/>`;
const poste=`<rect x="170" y="20" width="44" height="470" rx="14" fill="url(#madera)" stroke="${T}" stroke-width="${G}"/>
 <rect x="110" y="70" width="164" height="24" rx="8" fill="url(#madera)" stroke="${T}" stroke-width="6"/>${[130,192,254].map(x=>`<rect x="${x-9}" y="50" width="18" height="24" rx="5" fill="#9fe0ff" stroke="${T}" stroke-width="4"/>`).join('')}
 <path d="M184 140 L184 470 M200 160 L200 450" stroke="#7a4a22" stroke-width="4"/>`;
const balon=`<circle cx="192" cy="256" r="150" fill="url(#balon)" stroke="${T}" stroke-width="10"/><path d="M42 256 L342 256 M192 106 L192 406 M86 150 C150 210 150 300 86 362 M298 150 C234 210 234 300 298 362" stroke="${T}" stroke-width="9" fill="none"/>`;
const robotCabeza=`<rect x="40" y="120" width="304" height="250" rx="60" fill="url(#robot)" stroke="${T}" stroke-width="9"/>
 <rect x="76" y="164" width="232" height="98" rx="40" fill="#20272c" stroke="${T}" stroke-width="7"/>
 <circle cx="140" cy="212" r="34" fill="#ff3b2b" stroke="#ffd2cc" stroke-width="6"/><circle cx="244" cy="212" r="34" fill="#ff3b2b" stroke="#ffd2cc" stroke-width="6"/>
 <circle cx="132" cy="202" r="10" fill="#ffe8e4"/><circle cx="236" cy="202" r="10" fill="#ffe8e4"/>
 <path d="M80 300 L304 300 L284 360 L100 360Z" fill="#59656d" stroke="${T}" stroke-width="7"/>${[0,1,2,3,4,5].map(i=>`<rect x="${104+i*30}" y="300" width="22" height="30" fill="#f4f1e6" stroke="${T}" stroke-width="4"/>`).join('')}
 <path d="M120 120 L104 60 L150 112 M264 120 L280 60 L234 112" fill="url(#metal)" stroke="${T}" stroke-width="7" stroke-linejoin="round"/>
 ${[70,314].map(x=>`<circle cx="${x}" cy="150" r="10" fill="url(#metal)" stroke="${T}" stroke-width="4"/>`).join('')}
 <rect x="150" y="380" width="84" height="110" rx="20" fill="url(#robot)" stroke="${T}" stroke-width="8"/>`;
const caravanaRV=`<rect x="30" y="150" width="324" height="200" rx="26" fill="url(#caravana)" stroke="${T}" stroke-width="${G}"/>
 <rect x="30" y="230" width="324" height="34" fill="#d77a3a" stroke="${T}" stroke-width="5"/>
 ${[70,160,250].map(x=>`<rect x="${x}" y="176" width="64" height="44" rx="8" fill="#9fd6ef" stroke="${T}" stroke-width="5"/>`).join('')}
 ${[100,290].map(x=>`<circle cx="${x}" cy="360" r="40" fill="#333" stroke="${T}" stroke-width="${G}"/><circle cx="${x}" cy="360" r="16" fill="url(#metal)"/>`).join('')}`;
const bola=(fill,extra)=>`<circle cx="192" cy="256" r="150" fill="url(#${fill})" stroke="${T}" stroke-width="8"/>${extra}`;
const fuego=bola('fuego',`<path d="M120 170 C140 120 180 130 192 90 C210 140 260 120 270 180" stroke="#fff3b0" stroke-width="12" fill="none" stroke-linecap="round"/>`);
const hielo=bola('hielo',`<path d="M110 200 L170 150 L230 180 L280 140 M130 300 L190 270 L250 310" stroke="#ffffff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".85"/>`);

export const SVG_ZOMBIS_TEJADO=`<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">${defs}
${[escalera,catapulta,poste,balon,robotCabeza,caravanaRV,fuego,hielo].map((c,i)=>celda(i,c)).join('\n')}</svg>`;
