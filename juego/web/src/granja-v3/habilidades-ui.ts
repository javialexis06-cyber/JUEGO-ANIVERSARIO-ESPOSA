import { HABILIDADES, NOMBRES_HABILIDAD, UMBRALES, PROFESIONES, progresoHabilidad, profesionesDisponibles, requisitoReceta, recetaAprendida, type EstadoHabilidades, type Habilidad, type Aprendizaje } from './habilidades';
import { RECETAS, obtenerReceta } from './objetos';
import { iconoInventario } from './inventario-ui';
import './habilidades-ui.css';
const esc=(s:unknown)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const ICONOS:Record<Habilidad,string>={agricultura:'herramienta_azada',mineria:'herramienta_pico',recoleccion:'herramienta_hacha',pesca:'herramienta_cana',combate:'herramienta_espada'};
const ACCIONES:Record<Habilidad,string>={agricultura:'Sube cosechando, recogiendo productos y cuidando animales.',mineria:'Sube rompiendo rocas y vetas.',recoleccion:'Sube derribando árboles y cortando maleza.',pesca:'Sube atrapando peces.',combate:'Sube venciendo criaturas.'};
const HERRAMIENTA:Record<Habilidad,string>={agricultura:'la azada y la regadera',mineria:'el pico',recoleccion:'el hacha',pesca:'la caña',combate:'la espada'};
/** Lo que mejora al alcanzar el nivel n de una habilidad (texto del globito de cada nivel). */
function mejorasNivel(e:EstadoHabilidades,h:Habilidad,n:number){
 const m=[`${HERRAMIENTA[h][0].toUpperCase()+HERRAMIENTA[h].slice(1)} ${h==='agricultura'?'gastan':'gasta'} ${4*n}% menos energía.`];
 if(h==='agricultura')m.push(`Cosecha de oro: ${(4+2.5*n).toLocaleString('es')}% de probabilidad base.`);
 if(h==='pesca')m.push(`+${n} de precisión al recoger la línea.`);
 if(h==='combate'&&n%2===0)m.push(`+${n/2} de ataque.`);
 if(n===5||n===10){const elegida=e.profesiones[h][n===5?'nivel5':'nivel10'],p=elegida&&PROFESIONES.find(p=>p.id===elegida);m.push(p?`${n===5?'Profesión':'Especialización'}: ${p.nombre}.`:n===5?'Eliges tu profesión.':'Eliges tu especialización.');}
 const recetas=RECETAS.filter(r=>{const q=requisitoReceta(r);return q.habilidad===h&&q.nivel===n;});
 if(recetas.length)m.push('Recetas: '+recetas.map(r=>r.nombre+(recetaAprendida(e,r)?'':r.requisito?' (y descubrirla)':'')).join(', ')+'.');
 return m;
}
export function renderHabilidades(e:EstadoHabilidades){return `<section class="habilidades hab-simple"><p class="hab-intro">Pasa el ratón o deja el dedo sobre un nivel para ver su mejora. <strong>F</strong> abre este cuaderno.</p>${HABILIDADES.map(h=>{
 const v=progresoHabilidad(e,h),elecciones=profesionesDisponibles(e,h),elegidas=Object.values(e.profesiones[h]).filter(Boolean).map(id=>PROFESIONES.find(p=>p.id===id)!),pendientes=v.nivel>e.reconocidos[h];
 const xp=`${v.xp.toLocaleString('es')} XP${v.nivel===10?' · nivel máximo':` · faltan ${v.faltan.toLocaleString('es')} para el ${v.nivel+1}`}`;
 const pips=Array.from({length:10},(_,i)=>{const n=i+1,tip=mejorasNivel(e,h,n);return `<button type="button" class="hab-pip${n<=v.nivel?' ganado':''}${n===v.nivel+1?' siguiente':''}${n===5||n===10?' especial':''}" aria-label="Nivel ${n}: ${esc(tip.join(' '))}">${n}<span class="hab-tip" role="tooltip"><b>Nivel ${n}</b> · ${UMBRALES[n].toLocaleString('es')} XP${tip.map(t=>`<br>${esc(t)}`).join('')}</span></button>`;}).join('');
 const chips=elegidas.map(p=>`<button type="button" class="hab-chip">✓ ${esc(p.nombre)}<span class="hab-tip" role="tooltip"><b>${esc(p.nombre)}</b><br>${esc(p.descripcion)}</span></button>`).join('');
 const elegir=elecciones.length?`<div class="hab-profesiones"><b>Elige tu ${elecciones[0].nivel===5?'profesión':'especialización'}:</b>${elecciones.map(p=>`<button type="button" data-hab-profesion="${p.id}" title="${esc(p.descripcion)}"><strong>${esc(p.nombre)}</strong><span>${esc(p.descripcion)}</span></button>`).join('')}</div>`:'';
 return `<article class="hab-fila hab-${h}" data-habilidad="${h}"><span class="hab-icono" title="${esc(ACCIONES[h])}">${iconoInventario(ICONOS[h])}</span><div class="hab-nombre"><b>${NOMBRES_HABILIDAD[h]}</b><span class="hab-nv"><strong data-hab-nivel>${v.nivel}</strong>${pendientes?'<i title="Lo que aprendiste se reconoce al dormir">🌙</i>':''}</span></div><div class="hab-pips" aria-label="Nivel ${v.nivel} de diez">${pips}</div><div class="hab-linea"><progress max="100" value="${v.porcentaje}" aria-label="Progreso de ${NOMBRES_HABILIDAD[h]}"></progress><small data-hab-xp>${xp}</small>${chips}</div>${elegir}</article>`;
 }).join('')}</section>`;}
export function renderAprendizajesNoche(aprendizajes:Aprendizaje[]=[]){if(!aprendizajes.length)return '';return `<section class="hab-noche"><h3>Lo que aprendiste hoy</h3>${aprendizajes.map(a=>`<div data-hab-noche="${a.habilidad}"><strong>${NOMBRES_HABILIDAD[a.habilidad]} · Nivel ${a.desde} → ${a.hasta}</strong>${a.recetas.length?`<p>Recetas: ${a.recetas.map(id=>esc(obtenerReceta(id)?.nombre??id)).join(', ')}.</p>`:''}${a.desde<5&&a.hasta>=5||a.desde<10&&a.hasta>=10?'<p>Al comenzar la mañana, abre Habilidades para elegir tu profesión.</p>':''}</div>`).join('')}</section>`;}
