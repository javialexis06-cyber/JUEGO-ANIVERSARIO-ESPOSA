/** Preparación explícita para las regresiones posteriores al prólogo: órdenes legales, sin recursos extra. */
export async function completarCasaInicial(p){
 await p.waitForFunction(()=>!!window.__historiaPvZ?.mundo()||!!document.querySelector('.cq-modal')||!!document.querySelector('#cq-noticia:not(.cq-oculto)'));
 if(!await p.evaluate(()=>!!window.__historiaPvZ?.mundo()?.estado.inicioCasa))return;
 await p.evaluate(async()=>{const h=window.__historiaPvZ;await h.activarPilotoCasa();let n=0;while(h.mundo().estado.inicioCasa&&!h.mundo().estado.ganador&&n++<1000)h.avanzar(60);h.detenerPiloto();if(h.mundo().estado.ganador||h.mundo().estado.inicioCasa)throw Error('El piloto de preparación no completó la casa');});
 await p.locator('[data-cq="mapa"]').first().click();
}
