/* Puente propio hacia Gardendless 0.16.0. No modifica su código, reglas ni recursos.
 * Solo se activa con una zona y sesión válidas. Las observaciones NO son guardados restaurables. */
(() => {
  'use strict';
  const frente = window.semillaMotor.frente;
  if (!frente || parent === window) return;
  const canal = 'semilla-frente-v1', modulo = nombre => window.System?.get(`chunks:///_virtual/${nombre}.ts`);
  const capacidades = Object.freeze(window.semillaHistoriaMotor
    ? {nivel:'historia',instantaneas:false,carrilesVariables:true,pasoExterno:true,perfilTemporal:true,puntosDescanso:true}
    : {nivel: 'tutorial1', instantaneas: false, carrilesVariables: false, pasoExterno: false, perfilTemporal: true});
  let cc, iniciada = false, cargando = false, cerrada = false, resultado = '', secuencia = 0, ultimoPedido = 0;
  const enviar = datos => parent.postMessage({canal, zona: frente.zona, sesion: frente.sesion, ...datos}, location.origin);
  const esperar = (condicion, limite = 120000) => new Promise((ok, mal) => {
    const inicio = performance.now();
    const comprobar = () => {
      if (cerrada) return mal(new Error('El frente está cerrado.'));
      try { const valor = condicion(); if (valor) return ok(valor); } catch (e) { return mal(e); }
      if (performance.now() - inicio > limite) return mal(new Error('La carga del frente tardó demasiado. Revisa la conexión.'));
      setTimeout(comprobar, 100);
    };
    comprobar();
  });
  const observar = () => {
    const partida = modulo('levelController')?.LevelPlay, nivel = partida?.component;
    const historia=window.semillaHistoriaMotor?.activa;
    const valido = iniciada && nivel?.node?.isValid && (historia || partida.thisLevelsID?.length === 1 && partida.thisLevelsID[0] === 'tutorial1');
    const personajes = modulo('CharacterManager');
    const contar = tipo => valido && personajes?.[tipo]?.cm ? personajes[tipo].pool().filter(p => p.node?.isValid).length : 0;
    return {
      version: 1, zona: frente.zona, nivel: valido ? historia?'historia':'tutorial1' : null,
      fase: cerrada ? 'cerrado' : !valido ? 'preparando' : nivel.gameWon ? 'victoria' : nivel.gameLost ? 'derrota' : nivel.gameStarted ? 'combatiendo' : 'preparando',
      segundos: valido ? nivel.gamedTime : 0, oleada: valido ? nivel.currentWave : -1,
      soles: valido ? modulo('SunCount')?.SunCount?.Value ?? 0 : 0,
      plantas: contar('PlantPool'), zombis: contar('ZombiePool'), pausada: historia?window.semillaHistoriaMotor.pausada:!!cc?.game.isPaused(),
    };
  };
  const lista = esperar(() => modulo('KeyListener')?.KeyListener?.cp && modulo('PlayerProperties')?.AllPlayerProperties?.currentPlayer && modulo('mainScene')?.mainScene)
    .then(async () => {
      cc = await System.import('cc');
      if(window.semillaHistoriaMotor)cc.game.frameRate=60;
      await esperar(() => {
        const objetos=modulo('JSONs')?.PvZ2ObjectContainer;
        const jardin=modulo('FrontYard')?.FrontYard,plantas=modulo('Plants')?.plants;
        return cc.director.getScene()?.name === 'mainScene' && !modulo('KeyListener').KeyListener.screenColorTweening
          && ['LevelModules','LawnProps','PlantProps','PlantTypes','ZombieProps','ZombieTypes','GridItemTypes','TombstoneProps'].every(k=>objetos?.[k]?.length>0)
          && jardin?.getLawnFeature(jardin.getLawnEnumByTypeName('TutorialStage'))?.RESNAME==='Tutorial'
          && plantas?.getPlantFeatureByType('cherry_bomb')?.CODENAME==='cherry_bomb';
      });
      enviar({evento: 'listo', capacidades});
    });
  lista.catch(e => { if (!cerrada) enviar({evento: 'error', error: e.message}); });
  addEventListener('message', async e => {
    const p = e.data;
    if (e.origin !== location.origin || e.source !== parent || p?.canal !== canal || p.sesion !== frente.sesion || p.zona !== frente.zona) return;
    if (!Number.isSafeInteger(p.solicitud) || p.solicitud <= ultimoPedido || p.solicitud > 1000000000) return;
    ultimoPedido = p.solicitud;
    try {
      await lista;
      if (cerrada) throw new Error('El frente está cerrado.');
      if (cargando && p.orden !== 'observar' && p.orden !== 'cerrar') throw new Error('Espera a que termine la carga del nivel.');
      let valor;
      switch (p.orden) {
        case 'iniciar': {
          if (iniciada) throw new Error('Este frente ya se inició; no se reinicia para borrar daño.');
          if (p.nivel !== capacidades.nivel) throw new Error('El puente inicial solo admite tutorial1; no cambia los niveles de la historia.');
          if (cc.game.isPaused()) throw new Error('Reanuda antes de cargar el nivel.');
          iniciada = true; cargando = true;
          try {
            await modulo('KeyListener').KeyListener.goToLevel(['tutorial1'], [], false, false);
            await esperar(() => modulo('levelController')?.LevelPlay?.component?.gameStarted);
          } finally { cargando = false; }
          valor = observar();
          break;
        }
        case 'preparar-historia':
          if (!window.semillaHistoriaMotor) throw Error('Este frente no es de historia.');
          cargando=true;
          try { await semillaHistoriaMotor.preparar(p.config); iniciada=false; resultado=''; valor=observar(); } finally { cargando=false; }
          break;
        case 'iniciar-historia':
          if(!window.semillaHistoriaMotor?.preparada)throw Error('No se puede cargar otra defensa en esta instancia.');
          iniciada=true;cargando=true;
          try{await semillaHistoriaMotor.iniciar(p.config);valor=observar();}finally{cargando=false;}
          break;
        case 'paso-historia':
          if(!window.semillaHistoriaMotor?.activa)throw Error('No hay una defensa de historia.');
          semillaHistoriaMotor.paso(p.cantidad,p.visible);valor=observar();break;
        case 'punto-historia':valor=semillaHistoriaMotor.punto();break;
        case 'observar': valor = observar(); break;
        case 'pausa': await(window.semillaHistoriaMotor?.activa?semillaHistoriaMotor.pausa(true):semillaMotor.pausa(true)); valor = observar(); break;
        case 'reanudar': await(window.semillaHistoriaMotor?.activa?semillaHistoriaMotor.pausa(false):semillaMotor.pausa(false)); valor = observar(); break;
        case 'cerrar':
          await semillaMotor.cerrar(); cerrada = true; clearInterval(vigilar); valor = observar(); break;
        default: throw new Error('Orden no admitida por el puente.');
      }
      enviar({solicitud: p.solicitud, ok: true, valor});
    } catch (e) { enviar({solicitud: p.solicitud, ok: false, error: e.message}); }
  });
  const vigilar = setInterval(() => {
    if (cerrada || !iniciada) return;
    const estado = observar();
    if ((estado.fase === 'victoria' || estado.fase === 'derrota') && !resultado) {
      resultado = estado.fase; enviar({evento: 'resultado', secuencia: ++secuencia, estado});
    }
  }, 200);
  addEventListener('pagehide', () => { cerrada = true; clearInterval(vigilar); }, {once: true});
})();
