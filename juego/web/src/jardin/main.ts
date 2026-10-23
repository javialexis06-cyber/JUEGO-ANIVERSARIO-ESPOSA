/** Motores y claves independientes para la aventura y los patios clásicos. */
const params=new URLSearchParams(location.search),nivel=params.get('nivel');
if(params.get('modo')==='clasicos'||nivel&&!/^\d+-\d+$/.test(nivel))void import('./clasicos');
else if(params.get('modo')==='aventura'||nivel)void import('./pvz/aventura').then(m=>m.montarAventuraPvZ());
else if(params.get('modo')==='prototipo')void import('./conquista/interfaz').then(m=>m.montarConquista());
else void import('./conquista/historia-interfaz').then(m=>m.montarHistoriaConquista());
