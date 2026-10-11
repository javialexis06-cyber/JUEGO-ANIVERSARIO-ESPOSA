import type { EstadoGranja } from './estado';
import { pronostico, TIEMPOS, lluviaRiega, type Tiempo } from './clima';
import './clima-ui.css';
const tarjeta=(tipo:Tiempo,label:string)=>'<div class="clima-dia"><span class="clima-icono" aria-hidden="true">'+TIEMPOS[tipo].icono+'</span><div><span class="caps">'+label+'</span><strong>'+TIEMPOS[tipo].nombre+'</strong><p>'+TIEMPOS[tipo].texto+'</p></div></div>';
export function renderPronostico(s:EstadoGranja){const p=pronostico(s);return '<div class="card clima-pronostico"><h3>El tiempo en el valle</h3>'+tarjeta(p.hoy,'Hoy')+tarjeta(p.manana,'Mañana · Día '+p.fecha.dia)+'<p class="small-text">El pronóstico sigue tus jornadas, también al guardar y volver. En los hábitats polares cae nieve; en los volcánicos puede caer ceniza. Ninguna de las dos riega.</p></div>';}
export function ayudaRiego(t:Tiempo){return lluviaRiega(t)?'Hoy la lluvia puede encargarse del riego exterior. El crecimiento se aplica al dormir.':'Hoy necesitas regar o usar aspersores. El crecimiento se aplica al dormir.';}
