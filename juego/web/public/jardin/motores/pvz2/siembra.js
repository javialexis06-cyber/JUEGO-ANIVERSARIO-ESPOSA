/* Entradas propias sobre las acciones nativas. No crea plantas ni cambia costes/recargas. */
(() => {
    'use strict';
    let cc;
    window.semillaSiembraNativa = {instalar(motor) {cc=motor;}};
    // Registrar antes de arrancar Cocos, también para sus eventos compatibles.
    (function registrar() {
            const canvas = document.getElementById('GameCanvas');
            const modulo = n => System.get(`chunks:///_virtual/${n}.ts`);
            let gesto = null, ratonCompatible = null;
            const contexto = () => {
                if(!cc) return null;
                const nivel = modulo('levelController')?.LevelPlay?.component;
                const ui = modulo('UI')?.UIInGame?.component;
                if (!nivel?.gameStarted || nivel.gameWon || nivel.gameLost || !ui || ui.paused
                    || window.semillaHistoriaMotor && (!semillaHistoriaMotor.activa || semillaHistoriaMotor.pausada)) return null;
                return {ui, cards: modulo('Cards').Cards.component, mouse: modulo('Mouse').Mouse, square: modulo('Square').Square};
            };
            function apuntar(c, e) {
                const r = canvas.getBoundingClientRect(), evento = new cc.EventMouse(cc.Input.EventType.MOUSE_MOVE);
                evento.setLocation((e.clientX-r.left)*canvas.width/r.width, (r.bottom-e.clientY)*canvas.height/r.height);
                const componente = c.ui.mouse?.getComponent?.(c.mouse)
                    ?? cc.director.getScene().getComponentInChildren(c.mouse);
                componente.onMouseMove(evento);
            }
            function casilla(c, e) {
                apuntar(c,e);
                const p=c.mouse.position, fila=c.square.judgeLIndex(p.y), col=c.square.judgeCIndex(p.x);
                if(fila<0 || fila>=c.square.LaneCount || col<0 || col>=c.square.ColumnCount) return null;
                const q=c.square.getLnC(fila,col);
                return q.isInLawn() ? q : null;
            }
            const detener = e => {e.preventDefault();e.stopImmediatePropagation();};
            const bloquearCompatible = e => {ratonCompatible={x:e.clientX,y:e.clientY,hasta:performance.now()+600};};
            // Cocos escucha también el ratón compatible que algunos navegadores emiten
            // después de pointerdown. Esa segunda entrada volvería a deseleccionar la carta.
            for(const tipo of ['mousedown','mouseup']) window.addEventListener(tipo,e=>{
                const r=ratonCompatible;
                if(e.target===canvas && e.button===0 && r && performance.now()<r.hasta
                    && Math.hypot(e.clientX-r.x,e.clientY-r.y)<3) detener(e);
            },true);
            // En táctil Cocos convierte además touchstart/end a ratón. Se deja
            // ese camino nativo para pala y otros botones; las semillas usan el mismo gesto único.
            for(const tipo of ['touchstart','touchmove','touchend','touchcancel']) window.addEventListener(tipo,e=>{
                const r=ratonCompatible, p=e.changedTouches[0];
                if(e.target===canvas && (gesto || p && r && performance.now()<r.hasta
                    && Math.hypot(p.clientX-r.x,p.clientY-r.y)<3)) detener(e);
            },{capture:true,passive:false});
            function cancelar() {
                if(!gesto) return;
                modulo('UI')?.UIInGame?.component?.tryChangingIndex(-1);
                if(canvas.hasPointerCapture?.(gesto.id)) canvas.releasePointerCapture(gesto.id);
                gesto=null;
            }
            window.addEventListener('pointerdown', e => {
                if(e.target!==canvas || !e.isPrimary || e.button!==0) return;
                const c=contexto(); if(!c) return;
                canvas.focus({preventScroll:true});
                apuntar(c,e);
                const i=c.cards.CFs.findIndex(cf=>cf.node.activeInHierarchy && c.mouse.judgeInUITransform(cf.node.getComponent(cc.UITransform)));
                if(i>=0) {
                    detener(e);
                    bloquearCompatible(e);
                    // Un único camino también en táctil: evita que el ratón compatible vuelva a seleccionar.
                    c.ui.tryChangingIndex(i);
                    gesto={id:e.pointerId,x:e.clientX,y:e.clientY,tipo:c.cards.CFs[i].Type,indice:i,arrastrando:false};
                    canvas.setPointerCapture(e.pointerId);
                } else if(c.ui.index>=0 && c.ui.index<8) {
                    const q=casilla(c,e);
                    if(q) {
                        detener(e);
                        bloquearCompatible(e);
                        if(c.cards.CUs[c.ui.index]?.selectable) q.PlaceUIPlant();
                    }
                }
            },true);
            window.addEventListener('pointermove', e => {
                if(!gesto || e.pointerId!==gesto.id) return;
                const c=contexto();if(!c) {cancelar();return;}
                apuntar(c,e);
                if(!gesto.arrastrando && Math.hypot(e.clientX-gesto.x,e.clientY-gesto.y)>=8) {
                    gesto.arrastrando=true;
                    if(c.ui.index!==gesto.indice && c.cards.CUs[gesto.indice]?.selectable) c.ui.tryChangingIndex(gesto.indice);
                }
                if(gesto.arrastrando) {
                    detener(e);
                    c.square.component.readIndex();
                }
            },true);
            window.addEventListener('pointerup', e => {
                if(!gesto || e.pointerId!==gesto.id) return;
                const g=gesto, c=contexto();
                detener(e);
                bloquearCompatible(e);
                if(c && g.arrastrando) {
                    const q=casilla(c,e), cu=c.cards.CUs[g.indice];
                    // Se comprueba otra vez al soltar: el estado pudo cambiar durante el gesto.
                    if(q && c.ui.index===g.indice && c.cards.CFs[g.indice]?.Type===g.tipo && cu.selectable)
                        q.PlaceUIPlant();
                    c.ui.tryChangingIndex(-1);
                }
                gesto=null;
                if(canvas.hasPointerCapture?.(g.id)) canvas.releasePointerCapture(g.id);
            },true);
            window.addEventListener('pointercancel',cancelar,true);
            canvas.addEventListener('lostpointercapture',()=>{if(gesto)cancelar();});
            window.addEventListener('blur',cancelar);
            document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelar();});
            window.addEventListener('keydown',e=>{if(e.key==='Escape' && gesto){detener(e);cancelar();}},true);
            // Marco visible sobre la semilla elegida (1 de noviembre): el contorno nativo es un trazo verde muy fino y no
            // se distinguía qué planta estaba en la mano. Solo dibuja por encima; no cambia la selección ni el juego.
            const marco=document.createElement('div');
            marco.id='marco-semilla';marco.setAttribute('aria-hidden','true');
            const estilo=document.createElement('style');
            estilo.textContent='#marco-semilla{position:fixed;display:none;pointer-events:none;z-index:5;box-sizing:border-box;border:4px solid #ffe14a;border-radius:9px;box-shadow:0 0 0 2px #3a2405,0 0 14px 4px rgba(255,225,74,.85);animation:marco-semilla .7s ease-in-out infinite alternate}'
                +'@keyframes marco-semilla{from{transform:scale(1);box-shadow:0 0 0 2px #3a2405,0 0 8px 2px rgba(255,225,74,.6)}to{transform:scale(1.06);box-shadow:0 0 0 2px #3a2405,0 0 18px 6px rgba(255,225,74,1)}}'
                +'@media (prefers-reduced-motion:reduce){#marco-semilla{animation:none}}';
            document.head.append(estilo);document.body.append(marco);
            let ultimoMarco='';
            setInterval(()=>{
                let firma='';
                const c=document.hidden?null:contexto(), i=c?.ui.index ?? -1, cf=i>=0 && i<8 ? c.cards.CFs[i] : null;
                const t=cf?.node.activeInHierarchy && (cf.node._uiProps?.uiTransformComp ?? cf.node.getComponent('cc.UITransform'));
                if(t) {
                    const b=t.getBoundingBoxToWorld(), r=canvas.getBoundingClientRect(), v=cc.view.getVisibleSize(), o=cc.view.getVisibleOrigin(),
                        sx=r.width/v.width, sy=r.height/v.height;
                    firma=[r.left+(b.x-o.x)*sx, r.bottom-(b.y-o.y+b.height)*sy, b.width*sx, b.height*sy].map(n=>Math.round(n)).join(',');
                }
                if(firma===ultimoMarco) return;
                ultimoMarco=firma;
                if(!firma) {marco.style.display='none';return;}
                const [x,y,w,h]=firma.split(',');
                Object.assign(marco.style,{display:'block',left:(x-3)+'px',top:(y-3)+'px',width:(+w+6)+'px',height:(+h+6)+'px'});
            },80);
    })();
})();
