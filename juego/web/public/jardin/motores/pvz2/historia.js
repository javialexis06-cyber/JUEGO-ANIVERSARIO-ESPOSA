/* Adaptación propia del primer sector. Solo se carga en instancias de historia, nunca en el minijuego.
 * Los puntos de descanso conservan defensas terminadas; no son instantáneas de combates activos. */
(() => {
    'use strict';
    if (!semillaMotor.frente || new URLSearchParams(location.search).get('historia') !== '1')
        return;
    const m=n=>System.get(`chunks:///_virtual/${n}.ts`), tipos=()=>[...new Set([...Object.values(semillaCatalogoHistoria.tipos),...semillaCatalogoNativo.plantas.map(p=>p.id),...semillaCatalogoNativo.derivadas.map(p=>p.id)])],
        zombisValidos=()=>new Set([...Object.values(semillaCatalogoHistoria.zombis),...semillaCatalogoNativo.zombis.map(z=>z.id)]);
    const camposTemporales=['busy','grown','activated','growthCountdown_','growthCountdown','growthStage','sunValue','lifeCD','resting','cds'];
    let cc, config = null, pausada = false, visible = true, reposo = false, preparada = false, preparando = false, render;
    const esperar = fn => new Promise((ok, mal) => { const inicio = performance.now(); const ver = () => { if (fn())
        ok();
    else if (performance.now() - inicio > 120000)
        mal(Error('No terminó de cargar la defensa.'));
    else
        setTimeout(ver, 50); }; ver(); });
    const plantas = () => m('CharacterManager').PlantPool.pool().filter(p => p.node?.isValid && p.health > 0);
    const nivel = () => m('levelController').LevelPlay.component;
    const dibujar = () => {
        const n = nivel(), iniciada = n.gameStarted, fps = cc.game.frameRate;
        // Pasar por el ciclo de Cocos prepara también cámaras y lotes de dibujo.
        // Delta cero y combate detenido: presentar la vista no mueve sus relojes.
        try {
            n.gameStarted = false;
            cc.game.frameRate = Infinity;
            cc.game.step();
        } finally {
            n.gameStarted = iniciada;
            cc.game.frameRate = fps;
            cc.game.pause();
        }
    };
    const objetos = c => {
        const local = n => `RTID(${n}@CurrentLevel)`, global = n => `RTID(${n}@LevelModules)`;
        // En versus no hay victoria por oleadas: termina un zombi en la casa o el reloj del coordinador.
        const modules = ['StandardIntro','DefaultZombieWinCondition',...(!c.noche?['DefaultSunDropper']:[]),...(c.versus?[]:['ZombiesDeadWinCon'])].map(global).concat([local('Semillas'), local('Cortacespedes'), local('Oleadas')]);
        return [{ objclass: 'LevelDefinition', objdata: { Name:c.nombre, Description: 'La Semilla Madre', StartingSun:c.punto?.soles??c.solInicial, StageModule:global(c.escenario??(c.noche?'ModernNightStage':'TutorialStage')), Loot: global('NoLoot'), Modules: modules } },
                { objclass: 'SeedBankProperties', aliases: ['Semillas'], objdata: { SelectionMethod: 'preset', SuppressObjectiveTip: true, PresetPlantList: c.semillas.map(PlantType => ({ PlantType })) } },
                { objclass: 'LawnMowerProperties', aliases: ['Cortacespedes'], objdata: { MowerType: 'mower_lawn', MowerEntryAnimDuration: 2.5, MowerRows: Array.from({ length: Math.max(5,c.filas) }, (_, i) => i < c.filas && (c.punto?.cortacespedes[i] ?? true)) } },
                { objclass: 'WaveManagerModuleProperties', aliases: ['Oleadas'], objdata: { WaveManagerProps: local('Director') } },
                { objclass: 'WaveManagerProperties', aliases: ['Director'], objdata: { ZombieCountdownFirstWaveSecs: 18, SpawnRows: Array.from({ length: c.filas }, (_, i) => i), SuppressFlagZombie: true, MinNextWaveHealthPercentage: .5, MaxNextWaveHealthPercentage: .5, FlagWaveInterval: c.versus ? 99 : c.oleadas.length, Waves: c.oleadas.map((_, i) => [local('O' + i)]) } },
                ...c.oleadas.map((o, i) => ({ objclass: 'SpawnZombiesJitteredWaveActionProps', aliases: ['O' + i], objdata: { Zombies: o.map(z => ({ Row: z.fila + 1, Type: `RTID(${z.tipo}@ZombieTypes)` })) } })),
                ...fusionesNivel(c)];
    };
    /** Fusión: los tipos nuevos y los padres con sus recetas de evolución viajan en los datos del nivel (CurrentLevel),
     * que el motor consulta antes que sus tablas. Plantar B sobre A (o A sobre B) forma la fusión. */
    const fusionesNivel = c => {
        const derivadas = semillaCatalogoNativo.derivadas.filter(d => c.semillas.includes(d.id));
        if (!c.fusiones?.length && !derivadas.length) return [];
        const o = m('JSONs').PvZ2ObjectContainer, porId = new Map(semillaCatalogoNativo.fusiones.map(f => [f.id, f]));
        const tipoNativo = a => o.PlantTypes.find(t => t.aliases?.[0] === a)?.objdata;
        const propsNativas = a => { const t = tipoNativo(a), rtid = t?.Properties ?? `RTID(${a}@PlantProps)`, id = rtid.slice(5, rtid.indexOf('@'));
            return structuredClone(o.PlantProps.find(x => x.aliases?.[0] === id)?.objdata ?? {}); };
        const salida = [], recetas = new Map();
        // Plantas de PvZ 1 que el motor no trae: tipo derivado de su base, sembrable desde la baraja.
        for (const d of derivadas)
            salida.push({ objclass: 'PlantType', aliases: [d.id], objdata: { PlantBasedOn: d.base, Properties: `RTID(${d.id}@CurrentLevel)` } },
                { objclass: 'PlantProperties', aliases: [d.id], objdata: { ...propsNativas(d.base), ...d.props } });
        for (const id of c.fusiones ?? []) {
            const f = porId.get(id);
            if (!f) continue;
            if (f.props) {
                salida.push({ objclass: 'PlantType', aliases: [f.id], objdata: { PlantBasedOn: f.base, Properties: `RTID(${f.id}@CurrentLevel)` } },
                    { objclass: 'PlantProperties', aliases: [f.id], objdata: { ...propsNativas(f.base), ...f.props } });
            }
            const [a, b] = f.padres;
            for (const [x, y] of [[a, b], [b, a]]) {
                if (!recetas.has(x)) recetas.set(x, []);
                if (!recetas.get(x).some(r => r.OtherPlantType === y)) recetas.get(x).push({ Name: 'fusion_' + f.id, OtherPlantType: y, TargetPlantType: f.id, MaxCount: 1 });
            }
        }
        for (const [padre, nuevas] of recetas) {
            const props = propsNativas(padre);
            props.EvolutionRecipes = [...(props.EvolutionRecipes ?? []), ...nuevas];
            salida.push({ objclass: 'PlantType', aliases: [padre], objdata: { ...structuredClone(tipoNativo(padre) ?? { PlantBasedOn: padre }), Properties: `RTID(fusion_${padre}@CurrentLevel)` } },
                { objclass: 'PlantProperties', aliases: ['fusion_' + padre], objdata: props });
        }
        return salida;
    };
    const base = c => JSON.stringify([c.zona,c.filas,c.agua,c.noche,c.lapidas,c.semillas,c.punto,c.escenario??null,c.fusiones??[]]);
    // Capa de una planta (las fusiones ocupan la de su planta base: calabaza encima, nenúfar debajo).
    const baseFusion = t => semillaCatalogoNativo.fusiones.find(f => f.id === t && f.props)?.base ?? semillaCatalogoNativo.derivadas.find(d => d.id === t)?.base ?? t;
    const fusionadas = c => new Set((c.fusiones ?? []).map(id => semillaCatalogoNativo.fusiones.find(f => f.id === id)?.id).filter(Boolean));
    const validar = c => {
            if (!c || !Number.isInteger(c.zona)||c.zona<0||c.zona>239||!Number.isInteger(c.filas)||c.filas<3||c.filas>7||!Array.isArray(c.agua)||c.agua.some(f=>!Number.isInteger(f)||f<0||f>=c.filas)||typeof c.noche!=='boolean'||![50,100,150].includes(c.solInicial) || !Array.isArray(c.semillas) || c.semillas.length > 8 || new Set(c.semillas).size !== c.semillas.length || c.semillas.some(t => !tipos().includes(t)))
                throw Error('Equipo o escenario incompatible.');
            if (c.escenario !== undefined && !Object.hasOwn(semillaCatalogoNativo.escenarios, c.escenario))
                throw Error('Escenario desconocido.');
            if (c.fusiones !== undefined && (!Array.isArray(c.fusiones) || c.fusiones.length > 200 || c.fusiones.some(f => !semillaCatalogoNativo.fusiones.some(x => x.id === f))))
                throw Error('Fusiones desconocidas.');
            if (c.versus !== undefined && typeof c.versus !== 'boolean')
                throw Error('Modo incompatible.');
            if (!Array.isArray(c.oleadas) || c.oleadas.length < 1 || c.oleadas.length > 20 || c.oleadas.some(o => !Array.isArray(o) || o.length > 40 || o.some(z => !zombisValidos().has(z.tipo) || !Number.isInteger(z.fila) || z.fila < 0 || z.fila >= c.filas)))
                throw Error('Oleadas incompatibles.');
            if (c.punto) {
                const p = c.punto;
                if (p.version !== 1 || !Number.isFinite(p.soles) || p.soles < 0 || p.soles > 9900 || !Array.isArray(p.plantas) || p.plantas.length > c.filas*9*3 || p.plantas.some(x => !(c.semillas.includes(x.tipo) || fusionadas(c).has(x.tipo)) || !Number.isInteger(x.fila) || x.fila < 0 || x.fila >= c.filas || !Number.isInteger(x.col) || x.col < 0 || x.col > 8 || !Number.isFinite(x.vida) || x.vida <= 0))
                    throw Error('Defensa conservada incompatible.');
            }
    };
    const api = window.semillaHistoriaMotor = {
        get activa() { return !!config && !preparada && !preparando; }, get preparada() { return preparada || reposo; }, get pausada() { return pausada || reposo; },
        async preparar(c) {
            if (config && !preparada && !reposo && !nivel().gameWon && !nivel().gameLost)
                throw Error('La defensa ya está creada.');
            validar(c);
            const reinicio=!!config;
            preparando = true;
            semillaMotor.sonido(false);
            config = c;
            reposo = false;
            preparada = false;
            cc = await System.import('cc');
            if (render) cc.director.root.frameMove = render;
            visible = true;
            semillaMotor.controlExterno = false;
            if(reinicio) {
                cc.Tween.stopAll();
                m('KeyListener').KeyListener.restartRelease();
            }
            cc.game.resume();
            // Impide que cambiar al mapa abra el menú de pausa propio de otra instancia.
            m('PauseScreen').PauseScreen.AutoPause = false;
            semillaTerrenoHistoria.instalar(cc,c);
            const datos = objetos(c);
            const lp = m('levelController').LevelPlay;
            lp.levelData = datos;
            lp.thisLevelsID = [];
            lp.nextLevelsID = [];
            // El reinicio nativo libera actores/sombras de la escena anterior y conserva
            // recursos. Sustituir la escena sin ese ciclo deja referencias a sombras destruidas.
            await m('KeyListener').KeyListener.GoToGame([datos],reinicio);
            if(reinicio) {
                m('NodePools').NodePools.clearAll();
                cc.Tween.stopAll();
            }
            const recursos=Promise.all(c.semillas.map(t=>m('Plants').plants.loadPlantsInCardByType(t)));
            void recursos.catch(()=>{});
            await esperar(() => nivel()?.gameStarted);
            cc.game.pause();
            cc.game.frameRate = 60;
            semillaMotor.controlExterno = true;
            // Descargar una semilla lenta no debe dejar correr la partida de precarga.
            await recursos;
            await semillaTerrenoHistoria.aplicar(c);
            const ui = m('UI').UIInGame.component;
            // Escape y el atajo de pausa deben detener el mundo completo, no solo este tablero.
            ui.pauseMenu = () => semillaMotor.avisar('pausa-solicitada');
            ui.speedUp = () => {};
            m('UI').UIInGame.oldTickReturn();
            if (ui.s2xButton) ui.s2xButton.node.active = false;
            if (ui.pauseButton)
                ui.pauseButton.node.active = false;
            for (const k of Object.keys(ui))
                if (/fast|speed/i.test(k) && ui[k]?.node)
                    ui[k].node.active = false;
            nivel().dropCoins = false;
            nivel().dropSprouts = false;
            if (c.punto) {
                const orden=t=>{const k=baseFusion(t);return k==='lilypad'?-1:k==='pumpkin'?1:0;};
                for (const foto of [...c.punto.plantas].sort((a,b)=>orden(a.tipo)-orden(b.tipo))) {
                    const p = await m('Square').Square.getLnC(foto.fila, foto.col).SpawnPlantByType(foto.tipo);
                    if (!p)
                        throw Error('No se pudo recuperar una planta.');
                    p.health = Math.min(p.toughness, foto.vida);
                    if(foto.tipo==='sunshroom'&&Number.isInteger(foto.temporales?.growthStage)) {
                        while(p.growthStage<foto.temporales.growthStage&&p.growthStage<2)p.grow();
                        p.currentScale=p.shouldScale;p.plantScale=p.shouldScale;
                    }
                    if (foto.temporales?.grown && typeof p.grow === 'function')
                        p.grow();
                    if(foto.armadura!==undefined&&'armorHealth' in p)p.armorHealth=foto.armadura;
                    for (const [k, v] of Object.entries(foto.temporales ?? {}))
                        if (camposTemporales.includes(k) && k in p)
                            p[k] = Array.isArray(v)?[...v]:v;
                    if(Array.isArray(p.cds))p.inMouthAmount=p.cds.length;
                    if(['wallnut','tallnut','pumpkin'].includes(baseFusion(foto.tipo))&&p.onDamaged)p.onDamaged(null,p.health,p.health);
                }
                const cards = m('Cards').Cards.component;
                for (const cu of cards.CUs) {
                    const cd = c.punto.recargas?.[cu.cf?.Type];
                    if (Number.isFinite(cd))
                        cu.CD = cd;
                }
            }
            render ??= cc.director.root.frameMove.bind(cc.director.root);
            cc.director.root.frameMove = dt => { if (visible)
                render(dt); };
            semillaMotor.puedeCerrar = () => preparando || preparada || reposo || nivel().gameWon || nivel().gameLost;
            semillaMotor.mensajeCierre = 'Vuelve al mapa para cambiar de frente. Termina los combates antes de cerrar la historia.';
            preparando = false;
            preparada = true;
            reposo = true;
            dibujar();
            // Completar también la preparación gráfica antes de anunciar el campo listo.
            // La lectura no se conserva ni se exporta; evita diferir trabajo gráfico al primer acceso.
            try { cc.game.canvas.toDataURL('image/webp',.01); } catch {}
            await api.pausa(true);
        },
        async iniciar(c) {
            validar(c);
            if ((!preparada && !reposo) || base(c) !== base(config)) throw Error('Espera a que se prepare esta formación.');
            config = c;
            const n = nivel(), datos = objetos(c);
            m('levelController').LevelPlay.levelData = datos;
            n.currentLevelObjects = structuredClone(datos);
            // Las cartas guardan los datos de su planta: se renuevan con la copia vigente del nivel para que las
            // recetas de Fusión (que comparan esos datos) reconozcan la carta al sembrarla sobre otra planta.
            for (const cu of m('Cards').Cards.component.CUs)
                if (cu.cf?.Type) cu.cf.TypeData = m('Plants').plants.getPlantType(cu.cf.Type);
            n.waveEventsStatisticed = false;
            n.module_SetWaveProperties(datos.find(o => o.objclass === 'WaveManagerProperties').objdata);
            n.currentWave = -1;
            n.gamedTime = 0;
            // Versus: las plantas no ganan por agotar oleadas; decide el reloj del coordinador.
            if (c.versus) n.judgeVictory = () => {};
            await n.nextWave();
            preparada = false;
            reposo = !!c.reposo;
            // La vista de una defensa terminada no deja un PLANT! congelado sobre sus plantas.
            if(reposo){n.gameWarnTween.forEach(t=>t.stop());n.inGameWarnLabel.string='';}
            await api.pausa(false);
        },
        paso(cantidad, mostrar) {
            if (!config || !Number.isInteger(cantidad) || cantidad < 0 || cantidad > 6 || preparada && cantidad!==0)
                throw Error('Paso de defensa incompatible.');
            visible = !!mostrar;
            semillaMotor.sonido(visible && !pausada && !reposo);
            // Abrir un frente debe presentar su imagen sin esperar otro paso del
            // coordinador: también funciona con el reloj detenido o fuera de vista.
            if (cantidad === 0 && visible) {
                dibujar();
                return;
            }
            if (!pausada && !reposo && !nivel().gameWon && !nivel().gameLost) {
                cc.game.frameRate = 60;
                for (let i = 0; i < cantidad; i++) {
                    visible = !!mostrar && i === cantidad - 1;
                    cc.director.gameSpeed = 1;
                    cc.game.step();
                }
                visible = !!mostrar;
            }
            else if (visible)
                dibujar();
        },
        async pausa(si) { pausada = !!si; await semillaMotor.pausa(si); cc.game.pause(); },
        /** Versus: el jugador de los zombis suelta uno en un carril, por el borde derecho, con sus reglas nativas. */
        async soltarZombi(tipo, fila) {
            if (!config?.versus || preparada || nivel().gameWon || nivel().gameLost)
                throw Error('No hay un versus en curso.');
            if (!zombisValidos().has(tipo) || !Number.isInteger(fila) || fila < 0 || fila >= config.filas)
                throw Error('Zombi o carril no válido.');
            const agua = config.agua.includes(fila), flota = tipo.startsWith('duckytube');
            if (agua !== flota)
                throw Error(agua ? 'En el agua solo entran zombis con flotador.' : 'Los zombis con flotador solo entran al agua.');
            const z = await m('Zombies').zombies.spawnZombieFromLaneByType(fila, tipo, {}, true, false, false);
            if (!z) throw Error('El motor no pudo soltar el zombi.');
            return true;
        },
        /** Versus: lo que ve el otro dispositivo (posiciones en casillas) y el estado del duelo. */
        estadoVersus() {
            const sq = m('Square').Square, a = sq.getSquareWorldPosition(0, 0).x, b = sq.getSquareWorldPosition(0, 8).x;
            const col = x => b !== a ? Math.round((x - a) / (b - a) * 8 * 100) / 100 : 0;
            const zs = m('CharacterManager').ZombiePool.pool().filter(z => z.node?.isValid && z.health > 0).map(z => ({ tipo: z.Zombie_Type, fila: z.inLane?.LaneIndex ?? z.lIndex ?? 0, x: col(z.node.worldPosition.x), vida: Math.round(z.health) }));
            const ps = plantas().map(p => ({ tipo: p.Plant_Type, fila: p.plantInLnC?.lIndex ?? 0, col: p.plantInLnC?.cIndex ?? 0, vida: Math.round(p.health) }));
            // Centro de cada carril y borde derecho del tablero, en fracciones de la ventana del motor, para
            // alinear los botones del jugador de los zombis con las filas reales.
            // La cámara que dibuja las casillas es la que comparte capa con sus nodos (la de personajes).
            const lienzo = cc.game.canvas, caja = lienzo.getBoundingClientRect(), capa = sq.getLnC(0, 0).node.layer;
            const cam = cc.director.getScene().getComponentsInChildren(cc.Camera).find(k => k.enabledInHierarchy && (k.visibility & capa));
            const pantalla = (f, k) => { const q = cam.worldToScreen(sq.getLnC(f, k).node.worldPosition); return { x: (caja.left + q.x / lienzo.width * caja.width) / innerWidth, y: (caja.top + (1 - q.y / lienzo.height) * caja.height) / innerHeight }; };
            const filas = cam ? Array.from({ length: config.filas }, (_, f) => pantalla(f, 8).y) : [];
            const derecha = cam ? pantalla(0, 8).x : .9, ancho = cam ? derecha - pantalla(0, 7).x : .07;
            return { soles: m('SunCount').SunCount.Value, zombis: zs, plantas: ps, cortacespedes: nivel().currentMowerLanes.slice(), ganaron: nivel().gameWon ? 'plantas' : nivel().gameLost ? 'zombis' : null, pantalla: { filas, derecha, ancho } };
        },
        punto() {
            if (!reposo && !nivel().gameWon)
                throw Error('El combate activo todavía no se puede guardar como defensa terminada.');
            const cells = new Set();
            // Plantas que no son de la formación (la plántula que deja la bomba atómica): no se guardan en el punto de
            // descanso, en vez de impedir guardar una victoria (prueba de balance, 30 de octubre).
            const propia = p => tipos().includes(p.Plant_Type) || fusionadas(config).has(p.Plant_Type);
            for (const p of plantas()) if (!propia(p)) console.warn('Planta del nivel fuera del punto de descanso: ' + p.Plant_Type);
            const ps = plantas().filter(propia).map(p => { const q = p.plantInLnC; if (!q)
                throw Error('Planta sin casilla en este tramo: ' + p.Plant_Type + '.'); const capa=baseFusion(p.Plant_Type),key=q.lIndex+':'+q.cIndex+':'+(capa==='lilypad'?'base':capa==='pumpkin'?'coraza':'planta'); if (cells.has(key))
                throw Error('Defensa con casillas superpuestas.'); cells.add(key); const temporales = {}; for (const k of camposTemporales)
                if (k==='cds'&&Array.isArray(p[k])||typeof p[k] === 'boolean' || typeof p[k] === 'number' && Number.isFinite(p[k]) && p[k] >= 0)
                    temporales[k] = p[k]; return { tipo: p.Plant_Type, fila: q.lIndex, col: q.cIndex, vida:p.health,...('armorHealth' in p?{armadura:Math.max(0,p.armorHealth)}:{}),temporales }; });
            const recargas = Object.fromEntries(m('Cards').Cards.component.CUs.filter(c => c.cf).map(c => [c.cf.Type, Math.max(0, c.CD)]));
            return { version: 1, soles: m('SunCount').SunCount.Value, plantas: ps, cortacespedes: nivel().currentMowerLanes.slice(), recargas,crateres:m('Square').Square.getAllLnC().filter(q=>q.crackleCountdown>0).map(q=>({fila:q.lIndex,col:q.cIndex,segundos:q.crackleCountdown})),lapidas:m('Square').Square.getAllLnC().filter(q=>q.tombstone?.node?.isValid&&q.tombstone.health>0&&q.tombstone.Tombstone_Type==='gravestone_tutorial').map(q=>({fila:q.lIndex,col:q.cIndex,vida:q.tombstone.health})) };
        },
    };
})();
