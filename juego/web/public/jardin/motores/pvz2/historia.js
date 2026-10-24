/* Adaptación propia del primer sector. Solo se carga en instancias de historia, nunca en el minijuego.
 * Los puntos de descanso conservan defensas terminadas; no son instantáneas de combates activos. */
(() => {
    'use strict';
    if (!semillaMotor.frente || new URLSearchParams(location.search).get('historia') !== '1')
        return;
    const m = n => System.get(`chunks:///_virtual/${n}.ts`), tipos = ['peashooter', 'sunflower', 'wallnut', 'cherry_bomb', 'repeater', 'potatomine'];
    let cc, config = null, pausada = false, visible = true, reposo = false, render;
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
    const api = window.semillaHistoriaMotor = {
        get activa() { return !!config; }, get pausada() { return pausada || reposo; },
        async iniciar(c) {
            if (config)
                throw Error('La defensa ya está creada.');
            if (!c || ![8, 9].includes(c.zona) || c.filas !== (c.zona === 8 ? 5 : 4) || !Array.isArray(c.semillas) || c.semillas.length > 6 || new Set(c.semillas).size !== c.semillas.length || c.semillas.some(t => !tipos.includes(t)))
                throw Error('Equipo o escenario incompatible.');
            if (!Array.isArray(c.oleadas) || c.oleadas.length < 1 || c.oleadas.length > 20 || c.oleadas.some(o => !Array.isArray(o) || o.length > 40 || o.some(z => !['tutorial', 'tutorial_flag', 'tutorial_armor1'].includes(z.tipo) || !Number.isInteger(z.fila) || z.fila < 0 || z.fila >= c.filas)))
                throw Error('Oleadas incompatibles.');
            if (c.punto) {
                const p = c.punto;
                if (p.version !== 1 || !Number.isFinite(p.soles) || p.soles < 0 || p.soles > 9900 || !Array.isArray(p.plantas) || p.plantas.length > 45 || p.plantas.some(x => !c.semillas.includes(x.tipo) || !Number.isInteger(x.fila) || x.fila < 0 || x.fila >= c.filas || !Number.isInteger(x.col) || x.col < 0 || x.col > 8 || !Number.isFinite(x.vida) || x.vida <= 0))
                    throw Error('Defensa conservada incompatible.');
            }
            config = c;
            reposo = !!c.reposo;
            cc = await System.import('cc');
            // Impide que cambiar al mapa abra el menú de pausa propio de otra instancia.
            m('PauseScreen').PauseScreen.AutoPause = false;
            const local = n => `RTID(${n}@CurrentLevel)`, global = n => `RTID(${n}@LevelModules)`;
            const modules = ['StandardIntro', 'DefaultZombieWinCondition'].map(global).concat([local('Semillas'), local('Cortacespedes')]);
            if (!reposo)
                modules.push(global('DefaultSunDropper'), global('ZombiesDeadWinCon'), local('Oleadas'));
            const datos = [{ objclass: 'LevelDefinition', objdata: { Name: c.zona === 8 ? 'La casa' : 'Estación vieja', Description: 'La Semilla Madre', StartingSun: c.punto?.soles ?? 150, StageModule: global('TutorialStage'), Loot: global('NoLoot'), Modules: modules } },
                { objclass: 'SeedBankProperties', aliases: ['Semillas'], objdata: { SelectionMethod: 'preset', SuppressObjectiveTip: true, PresetPlantList: c.semillas.map(PlantType => ({ PlantType })) } },
                { objclass: 'LawnMowerProperties', aliases: ['Cortacespedes'], objdata: { MowerType: 'mower_lawn', MowerEntryAnimDuration: 2.5, MowerRows: Array.from({ length: 5 }, (_, i) => i < c.filas && (c.punto?.cortacespedes[i] ?? true)) } },
                { objclass: 'WaveManagerModuleProperties', aliases: ['Oleadas'], objdata: { WaveManagerProps: local('Director') } },
                { objclass: 'WaveManagerProperties', aliases: ['Director'], objdata: { ZombieCountdownFirstWaveSecs: 18, SpawnRows: Array.from({ length: c.filas }, (_, i) => i), SuppressFlagZombie: true, MinNextWaveHealthPercentage: .5, MaxNextWaveHealthPercentage: .5, FlagWaveInterval: c.oleadas.length, Waves: c.oleadas.map((_, i) => [local('O' + i)]) } },
                ...c.oleadas.map((o, i) => ({ objclass: 'SpawnZombiesJitteredWaveActionProps', aliases: ['O' + i], objdata: { Zombies: o.map(z => ({ Row: z.fila + 1, Type: `RTID(${z.tipo}@ZombieTypes)` })) } }))];
            const lp = m('levelController').LevelPlay;
            lp.levelData = datos;
            lp.thisLevelsID = [];
            lp.nextLevelsID = [];
            await m('KeyListener').KeyListener.GoToGame([datos]);
            await esperar(() => nivel()?.gameStarted);
            cc.game.pause();
            cc.game.frameRate = 60;
            semillaMotor.controlExterno = true;
            const lawn = m('FrontYard').FrontYard.CurrentLawn;
            Object.defineProperty(lawn, 'DisabledLanes', { configurable: true, get: () => Array.from({ length: 5 - c.filas }, (_, i) => c.filas + i) });
            // La quinta franja queda cerrada visual y mecánicamente en la estación.
            if (c.filas < 5) {
                const square = m('Square').Square, lane = square.getLane(4), n = new cc.Node('Obras');
                n.layer = lane.node.layer;
                n.parent = lane.tombLayer;
                const esquina = (col, x, y) => {
                    const p = square.getSquareWorldPosition(4, col, x, y);
                    return n.inverseTransformPoint(new cc.Vec3(), new cc.Vec3(p.x, p.y, 0));
                };
                const superior = esquina(0, 0, 0), inferior = esquina(8, 1, 1);
                const alto = superior.y - inferior.y;
                const g = n.addComponent(cc.Graphics);
                g.fillColor = new cc.Color(55, 54, 44, 245);
                g.rect(superior.x, inferior.y, inferior.x - superior.x, alto);
                g.fill();
                g.strokeColor = new cc.Color(235, 185, 65, 255);
                g.lineWidth = 8;
                for (let x = superior.x - alto; x < inferior.x; x += 100) {
                    g.moveTo(Math.max(x, superior.x), inferior.y + Math.max(0, superior.x - x));
                    g.lineTo(Math.min(x + alto, inferior.x), superior.y - Math.max(0, x + alto - inferior.x));
                }
                g.stroke();
            }
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
                for (const foto of c.punto.plantas) {
                    const p = await m('Square').Square.getLnC(foto.fila, foto.col).SpawnPlantByType(foto.tipo);
                    if (!p)
                        throw Error('No se pudo recuperar una planta.');
                    p.health = Math.min(p.toughness, foto.vida);
                    if (foto.temporales?.grown && typeof p.grow === 'function')
                        p.grow();
                    for (const [k, v] of Object.entries(foto.temporales ?? {}))
                        if (['busy', 'grown', 'activated', 'growthCountdown_'].includes(k) && k in p)
                            p[k] = v;
                }
                const cards = m('Cards').Cards.component;
                for (const cu of cards.CUs) {
                    const cd = c.punto.recargas?.[cu.cf?.Type];
                    if (Number.isFinite(cd))
                        cu.CD = cd;
                }
            }
            render = cc.director.root.frameMove.bind(cc.director.root);
            cc.director.root.frameMove = dt => { if (visible)
                render(dt); };
            semillaMotor.puedeCerrar = () => reposo || nivel().gameWon || nivel().gameLost;
            semillaMotor.mensajeCierre = 'Vuelve al mapa para cambiar de frente. Termina los combates antes de cerrar la historia.';
            // El coordinador avanza todos los frentes mediante game.step(), incluso fuera de vista.
            cc.game.step();
        },
        paso(cantidad, mostrar) {
            if (!config || !Number.isInteger(cantidad) || cantidad < 0 || cantidad > 6)
                throw Error('Paso de defensa incompatible.');
            visible = !!mostrar;
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
        punto() {
            if (!reposo && !nivel().gameWon)
                throw Error('El combate activo todavía no se puede guardar como defensa terminada.');
            const cells = new Set();
            const ps = plantas().map(p => { const q = p.plantInLnC; if (!q || !tipos.includes(p.Plant_Type))
                throw Error('Planta no compatible con este tramo.'); const key = q.lIndex + ':' + q.cIndex; if (cells.has(key))
                throw Error('Defensa con casillas superpuestas.'); cells.add(key); const temporales = {}; for (const k of ['busy', 'grown', 'activated', 'growthCountdown_'])
                if (typeof p[k] === 'boolean' || typeof p[k] === 'number' && Number.isFinite(p[k]) && p[k] >= 0)
                    temporales[k] = p[k]; return { tipo: p.Plant_Type, fila: q.lIndex, col: q.cIndex, vida: p.health, temporales }; });
            const recargas = Object.fromEntries(m('Cards').Cards.component.CUs.filter(c => c.cf).map(c => [c.cf.Type, Math.max(0, c.CD)]));
            return { version: 1, soles: m('SunCount').SunCount.Value, plantas: ps, cortacespedes: nivel().currentMowerLanes.slice(), recargas };
        },
    };
})();
