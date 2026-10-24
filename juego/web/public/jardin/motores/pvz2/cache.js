/* Solo recursos públicos de la revisión fijada. No intercepta partidas ni páginas del resto del juego. */
const CACHE='semilla-pvz2-53d2ebb3-recursos-v1';
const BASE='https://raw.githubusercontent.com/Gzh0821/pvzge_web/53d2ebb3ec51d1f69e9f906a5c4f70a5864dbfc6/docs/';
const pendientes=new Map();
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||!e.request.url.startsWith(BASE)||e.request.headers.has('range'))return;
 e.respondWith((async()=>{
  const cache=await caches.open(CACHE),anterior=await cache.match(e.request);if(anterior)return anterior;
  let pedido=pendientes.get(e.request.url);
  if(!pedido){
   pedido=(async()=>{
    const respuesta=await fetch(e.request);
    if(respuesta.ok||respuesta.type==='opaque')await cache.put(e.request,respuesta.clone()).catch(()=>{});
    return respuesta;
   })();
   pendientes.set(e.request.url,pedido);
   void pedido.finally(()=>{if(pendientes.get(e.request.url)===pedido)pendientes.delete(e.request.url);}).catch(()=>{});
  }
  return (await pedido).clone();
 })());
});
