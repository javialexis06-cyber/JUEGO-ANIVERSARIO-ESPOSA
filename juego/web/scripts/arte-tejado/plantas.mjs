// Ilustraciones vectoriales propias de las ocho plantas del tejado (estilo pegatina de las hojas aprobadas).
// Cada figura ocupa una celda de 444×444 dentro de una hoja de 4×2; el fondo queda transparente.
const T='#2b1d12',G=7;
const ojo=(x,y,r=22,mira=4)=>`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*1.12}" fill="#fff" stroke="${T}" stroke-width="5"/><ellipse cx="${x+mira}" cy="${y+3}" rx="${r*.52}" ry="${r*.6}" fill="${T}"/><circle cx="${x+mira-r*.18}" cy="${y-r*.2}" r="${r*.2}" fill="#fff"/>`;
const ceja=(x1,y1,x2,y2)=>`<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${T}" stroke-width="8" stroke-linecap="round"/>`;
const sonrisa=(x,y,w=26)=>`<path d="M${x-w} ${y} Q${x} ${y+w*.9} ${x+w} ${y}" fill="#5c2b1d" stroke="${T}" stroke-width="5" stroke-linejoin="round"/>`;
const hojasBase=(cx=222,cy=392,c1='#4f9d2f',c2='#7cc94a')=>`
 <path d="M${cx} ${cy-6} C${cx-40} ${cy-44} ${cx-118} ${cy-36} ${cx-128} ${cy+4} C${cx-96} ${cy+30} ${cx-36} ${cy+24} ${cx} ${cy-6}Z" fill="url(#hoja)" stroke="${T}" stroke-width="${G}" stroke-linejoin="round"/>
 <path d="M${cx} ${cy-6} C${cx+40} ${cy-44} ${cx+118} ${cy-36} ${cx+128} ${cy+4} C${cx+96} ${cy+30} ${cx+36} ${cy+24} ${cx} ${cy-6}Z" fill="url(#hoja)" stroke="${T}" stroke-width="${G}" stroke-linejoin="round"/>
 <path d="M${cx-20} ${cy-6} Q${cx-70} ${cy-14} ${cx-108} ${cy+2}" stroke="${c1}" stroke-width="4" fill="none"/><path d="M${cx+20} ${cy-6} Q${cx+70} ${cy-14} ${cx+108} ${cy+2}" stroke="${c1}" stroke-width="4" fill="none"/>`;
const defs=`<defs>
 <linearGradient id="hoja" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd955"/><stop offset="1" stop-color="#3f8f2a"/></linearGradient>
 <radialGradient id="col" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#e3f7a8"/><stop offset=".6" stop-color="#9ad35a"/><stop offset="1" stop-color="#4f9a30"/></radialGradient>
 <radialGradient id="tallo" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#b6ec7a"/><stop offset="1" stop-color="#4b9a2f"/></radialGradient>
 <linearGradient id="barro" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b5532c"/><stop offset=".45" stop-color="#e48a54"/><stop offset="1" stop-color="#9c4322"/></linearGradient>
 <radialGradient id="maiz" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff3a0"/><stop offset="1" stop-color="#e7b52c"/></radialGradient>
 <radialGradient id="cafe" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#b9774a"/><stop offset="1" stop-color="#5d321a"/></radialGradient>
 <radialGradient id="ajo" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#efe6d6"/><stop offset="1" stop-color="#cbbca4"/></radialGradient>
 <radialGradient id="paraguas" cx=".4" cy=".25" r=".85"><stop offset="0" stop-color="#a8ea6c"/><stop offset="1" stop-color="#3c8a2b"/></radialGradient>
 <radialGradient id="petalo" cx=".5" cy=".2" r=".9"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#f07a1c"/></radialGradient>
 <radialGradient id="centro" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#d79a24"/></radialGradient>
 <radialGradient id="melon" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#9ee06a"/><stop offset="1" stop-color="#2e7a24"/></radialGradient>
 <linearGradient id="manteca" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset="1" stop-color="#f2c84a"/></linearGradient>
</defs>`;
const celda=(i,contenido)=>`<g transform="translate(${(i%4)*444},${Math.floor(i/4)*444})">${contenido}</g>`;
const brazo=(cuchara)=>`<path d="M250 268 C300 250 330 170 316 112" fill="none" stroke="${T}" stroke-width="22" stroke-linecap="round"/><path d="M250 268 C300 250 330 170 316 112" fill="none" stroke="#5aa636" stroke-width="12" stroke-linecap="round"/>${cuchara}`;

const coltapulta=`${hojasBase()}
 ${brazo(`<path d="M282 112 C282 70 352 64 356 104 C344 128 296 130 282 112Z" fill="url(#hoja)" stroke="${T}" stroke-width="${G}" stroke-linejoin="round"/>
 <circle cx="318" cy="76" r="44" fill="url(#col)" stroke="${T}" stroke-width="${G}"/><path d="M290 78 Q318 52 346 78 M300 98 Q318 70 336 98 M318 34 L318 118" stroke="#6aa83c" stroke-width="5" fill="none"/>`)}
 <path d="M150 384 C130 300 140 214 210 196 C270 182 300 240 290 300 C284 350 270 384 262 386Z" fill="url(#tallo)" stroke="${T}" stroke-width="${G}" stroke-linejoin="round"/>
 <path d="M168 230 C150 200 160 168 196 172 M232 196 C250 168 284 176 280 206" fill="#7cc94a" stroke="${T}" stroke-width="6"/>
 ${ojo(194,262)}${ojo(246,258)}${sonrisa(220,306,22)}`;

const maceta=`<ellipse cx="222" cy="398" rx="128" ry="20" fill="rgba(0,0,0,.18)"/>
 <path d="M112 236 L332 236 L304 392 Q222 410 140 392Z" fill="url(#barro)" stroke="${T}" stroke-width="${G}" stroke-linejoin="round"/>
 <rect x="96" y="200" width="252" height="54" rx="14" fill="url(#barro)" stroke="${T}" stroke-width="${G}"/>
 <ellipse cx="222" cy="212" rx="112" ry="18" fill="#5b3a22" stroke="${T}" stroke-width="5"/>
 <path d="M128 288 Q222 304 316 288" stroke="#8b3a1c" stroke-width="5" fill="none" opacity=".6"/><path d="M146 230 L166 380" stroke="#f3b087" stroke-width="10" opacity=".45" stroke-linecap="round"/>`;

const granos=[...Array(5)].flatMap((_,f)=>[...Array(4)].map((_,c)=>`<ellipse cx="${178+c*24+(f%2)*12}" cy="${206+f*30}" rx="10" ry="12" fill="#ffd94a" stroke="#c48d1d" stroke-width="3"/>`)).join('');
const lanzamaiz=`${hojasBase()}
 ${brazo(`<rect x="290" y="70" width="70" height="46" rx="12" fill="url(#manteca)" stroke="${T}" stroke-width="${G}" transform="rotate(-8 325 93)"/><path d="M300 86 L350 80" stroke="#fffbe0" stroke-width="6" stroke-linecap="round"/>`)}
 <path d="M222 150 C292 160 292 360 222 384 C152 360 152 160 222 150Z" fill="url(#maiz)" stroke="${T}" stroke-width="${G}"/>
 ${granos}
 <path d="M150 384 C150 300 170 250 196 236 C186 300 196 350 214 384Z M294 384 C294 300 274 250 248 236 C258 300 248 350 230 384Z" fill="url(#hoja)" stroke="${T}" stroke-width="6" stroke-linejoin="round"/>
 ${ojo(200,214,20)}${ojo(246,212,20)}${sonrisa(222,256,18)}`;

const cafe=`<path d="M222 154 C190 120 160 120 150 136 C170 156 200 160 222 154Z M222 154 C254 120 284 120 294 136 C274 156 244 160 222 154Z" fill="url(#hoja)" stroke="${T}" stroke-width="6" stroke-linejoin="round"/>
 <ellipse cx="222" cy="270" rx="102" ry="124" fill="url(#cafe)" stroke="${T}" stroke-width="${G}"/>
 <path d="M222 152 C196 220 248 300 222 392" stroke="#3c1f0e" stroke-width="9" fill="none" stroke-linecap="round"/>
 ${ojo(184,252,24,0)}${ojo(262,252,24,0)}<ellipse cx="222" cy="320" rx="14" ry="12" fill="#5c2b1d" stroke="${T}" stroke-width="5"/>
 <path d="M154 214 L196 226 M290 214 L248 226" stroke="${T}" stroke-width="7" stroke-linecap="round"/>`;

const ajo=`${hojasBase(222,398)}
 <path d="M222 118 C220 96 232 80 248 70" stroke="#6aa83c" stroke-width="12" fill="none" stroke-linecap="round"/>
 <path d="M222 120 C300 150 340 250 312 330 C292 384 152 384 132 330 C104 250 144 150 222 120Z" fill="url(#ajo)" stroke="${T}" stroke-width="${G}" stroke-linejoin="round"/>
 <path d="M222 124 C196 200 190 300 206 384 M222 124 C252 200 258 300 240 384 M180 150 C150 220 150 300 168 372 M266 150 C298 220 298 300 278 372" stroke="#cbbca4" stroke-width="5" fill="none"/>
 ${ojo(194,262,20)}${ojo(250,262,20)}${ceja(170,232,210,244)}${ceja(274,232,234,244)}
 <path d="M200 318 Q222 304 244 318" stroke="${T}" stroke-width="7" fill="none" stroke-linecap="round"/>`;

const paraplanta=`${hojasBase(222,400)}
 <path d="M222 396 L222 190" stroke="${T}" stroke-width="20" stroke-linecap="round"/><path d="M222 396 L222 190" stroke="#5aa636" stroke-width="10" stroke-linecap="round"/>
 <path d="M40 200 C60 70 384 70 404 200 C364 186 330 196 300 214 C270 192 246 190 222 210 C198 190 174 192 144 214 C114 196 80 186 40 200Z" fill="url(#paraguas)" stroke="${T}" stroke-width="${G}" stroke-linejoin="round"/>
 <path d="M222 92 L222 206 M222 96 C160 120 110 160 80 196 M222 96 C284 120 334 160 364 196 M222 96 C190 140 166 176 144 212 M222 96 C254 140 278 176 300 212" stroke="#3a7d27" stroke-width="5" fill="none"/>
 <circle cx="222" cy="318" r="56" fill="url(#tallo)" stroke="${T}" stroke-width="${G}"/>${ojo(202,312,15)}${ojo(242,312,15)}${sonrisa(222,340,13)}`;

const petalos=(r,n,c)=>[...Array(n)].map((_,i)=>{const a=i*360/n;return`<ellipse cx="222" cy="${222-r}" rx="34" ry="62" fill="${c}" stroke="${T}" stroke-width="6" transform="rotate(${a} 222 222)"/>`;}).join('');
const margarita=`${hojasBase(222,398)}<path d="M222 396 L222 290" stroke="${T}" stroke-width="18"/><path d="M222 396 L222 290" stroke="#5aa636" stroke-width="9"/>
 <g transform="translate(0,-10)">${petalos(70,12,'url(#petalo)')}${petalos(48,10,'#ffb14a')}
 <circle cx="222" cy="222" r="62" fill="url(#centro)" stroke="${T}" stroke-width="${G}"/>${ojo(200,214,16)}${ojo(244,214,16)}${sonrisa(222,246,18)}</g>`;

const rayas=[0,1,2,3,4].map(i=>`<path d="M${300+i*16} 34 C${284+i*16} 70 ${284+i*16} 110 ${300+i*16} 144" stroke="#235e1b" stroke-width="7" fill="none"/>`).join('');
const melonpulta=`${hojasBase()}
 ${brazo(`<path d="M262 132 C258 80 380 70 386 124 C370 156 280 160 262 132Z" fill="url(#hoja)" stroke="${T}" stroke-width="${G}" stroke-linejoin="round"/>
 <ellipse cx="330" cy="90" rx="62" ry="54" fill="url(#melon)" stroke="${T}" stroke-width="${G}"/><clipPath id="cm"><ellipse cx="330" cy="90" rx="58" ry="50"/></clipPath><g clip-path="url(#cm)">${rayas}</g>`)}
 <path d="M140 384 C120 300 132 220 206 204 C276 190 306 250 296 306 C290 352 274 384 266 386Z" fill="url(#tallo)" stroke="${T}" stroke-width="${G}" stroke-linejoin="round"/>
 <path d="M150 250 C120 220 140 186 180 196" fill="#7cc94a" stroke="${T}" stroke-width="6"/>
 ${ojo(190,270)}${ojo(244,266)}${ceja(166,238,206,250)}${ceja(268,234,228,248)}<path d="M196 318 Q218 308 244 318" stroke="${T}" stroke-width="7" fill="none" stroke-linecap="round"/>`;

export const SVG_PLANTAS_TEJADO=`<svg xmlns="http://www.w3.org/2000/svg" width="1776" height="888" viewBox="0 0 1776 888">${defs}
${[coltapulta,maceta,lanzamaiz,cafe,ajo,paraplanta,margarita,melonpulta].map((c,i)=>celda(i,c)).join('\n')}</svg>`;
