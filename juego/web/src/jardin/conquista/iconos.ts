const trazos:Record<string,string>={
 importar:'<path d="M12 16V3m-5 5 5-5 5 5M4 14v7h16v-7"/>',
 candado:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4m-4 4v2"/>',
 moneda:'<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.3 0-2.4-.5-3-1.5M12 6v2m0 8v2"/>',
 tienda:'<path d="M4 9h16l-1 12H5ZM8 9V7a4 4 0 0 1 8 0v2"/>',
 escudo:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
 alerta:'<path d="M12 3 2 20h20ZM12 9v5m0 3v.1"/>',
 mapa:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
 pais:'<path d="m3 17 5-11 4 7 3-9 6 13ZM3 20h18M7 9l2 3 2-1M14 7l2 4 2-1"/>',
 ciudad:'<path d="M3 21V9h5V3h8v9h5v9ZM10 6h1m2 0h1m-4 4h1m2 0h1M5 12h1m-1 4h1m4-2h1m2 0h1m4 1h1M11 21v-4h3v4"/>',
 pausa:'<path d="M8 5v14M16 5v14" stroke-width="4"/>',reanudar:'<path d="m8 4 12 8-12 8Z" fill="currentColor"/>',
 salir:'<path d="M10 4H4v16h6m5-13 5 5-5 5m-8-5h13"/>',ayuda:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 .3-1 1-1 2m0 3v.1"/>',
 sonido:'<path d="M3 9v6h4l5 4V5L7 9Zm12-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',pantalla:'<path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6"/>',
 historia:'<path d="m3 11 9-8 9 8M5 10v11h14V10m-9 11v-7h4v7"/>',continuar:'<path d="m8 4 12 8-12 8Z" fill="currentColor"/>',versus:'<path d="m4 3 15 16m-9-1 8-8M3 4l3 1-1 3m14 13-1-4 4 1M18 3l3 1-1 3M4 21l1-4-4 1"/>',minijuegos:'<path d="M8 7H6a5 5 0 0 0-5 5v3a3 3 0 0 0 5 2l2-2h8l2 2a3 3 0 0 0 5-2v-3a5 5 0 0 0-5-5Zm-3 3v5m-2-2h4m9-2h.1m3 3h.1"/>',
 atacar:'<path d="m5 20 4-7-5-4 16-6-6 16-4-5Zm3-6 8-7"/>',formacion:'<path d="M3 3h6v6H3Zm12 0h6v6h-6ZM3 15h6v6H3Zm12 0h6v6h-6ZM12 3v18M3 12h18"/>',fortificar:'<path d="M4 3v5h4V3h8v5h4V3m0 5v13H4V8m6 13v-6h4v6"/>',reparar:'<path d="M14 5a6 6 0 0 0-8 8l-4 4a3 3 0 0 0 4 4l4-4a6 6 0 0 0 9-8l-5 4-4-4Z"/>',reforzar:'<path d="m3 7 9-4 9 4v12l-9 3-9-3Zm0 0 9 5 9-5m-9 5v10M7 5l10 5"/>',retirarse:'<path d="M11 5 4 12l7 7m-7-7h11a6 6 0 0 1 6 6"/>',cerrar:'<path d="m5 5 14 14M5 19 19 5"/>',exportar:'<path d="M12 3v12m-5-5 5 5 5-5M4 14v7h16v-7"/>',equipo:'<path d="M12 21v-9C3 13 2 6 3 3c6 0 10 2 9 9m0 3c0-6 3-9 9-9 0 6-2 9-9 9"/>',bando:'<path d="m3 7 4-4 4 4m-4-4v14m6 0 4 4 4-4m-4 4V7"/>',
};
export const icono=(nombre:string)=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(trazos[nombre]??trazos.ayuda)+'</svg>';
export const botonRedondo=(accion:string,nombre:string,simbolo=accion)=>`<button class="cq-redondo" data-cq="${accion}" aria-label="${nombre}" title="${nombre}">${icono(simbolo)}</button>`;
