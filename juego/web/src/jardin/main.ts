/** Motores y claves independientes para la aventura y los patios clásicos. */
const params=new URLSearchParams(location.search),nivel=params.get('nivel');
if(params.get('modo')==='prueba-frente')void import('./motores/prueba-frente').then(m=>m.montarPruebaFrente());
else if(params.get('modo')==='pvz1'||params.get('modo')==='pvz2')void import('./motores/minijuego').then(m=>m.montarMotorOriginal(params.get('modo') as 'pvz1'|'pvz2'));
else if(params.get('modo')==='clasicos'||nivel&&!/^\d+-\d+$/.test(nivel))void import('./clasicos');
else if(params.get('modo')==='aventura'||nivel)void import('./pvz/aventura').then(m=>m.montarAventuraPvZ());
else if(params.get('modo')==='prototipo')void import('./conquista/interfaz').then(m=>m.montarConquista());
else void import('./conquista/historia-interfaz').then(m=>m.montarHistoriaConquista());
