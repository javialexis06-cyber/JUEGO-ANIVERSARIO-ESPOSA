/** Contrato del puente con Cocos preparado; no es una partida ni prueba sus habilidades. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const origen='https://juego.test',mensajes=[],escuchas={},zona='casa',sesion='12345678-abcd-1234-abcd-123456789012';
let intervalo,pausada=false;
const tablero={node:{isValid:true},gameStarted:true,gameWon:false,gameLost:false,gamedTime:3,currentWave:1};
const partida={component:tablero,thisLevelsID:[]};
const modulos={
 'KeyListener':{KeyListener:{cp:{},screenColorTweening:false,goToLevel:async ids=>{partida.thisLevelsID=ids;}}},
 'PlayerProperties':{AllPlayerProperties:{currentPlayer:{}}},'mainScene':{mainScene:{}},'levelController':{LevelPlay:partida},
 'CharacterManager':{PlantPool:{cm:{},pool:()=>[]},ZombiePool:{cm:{},pool:()=>[]}},'SunCount':{SunCount:{Value:100}},
 'JSONs':{PvZ2ObjectContainer:Object.fromEntries(['LevelModules','LawnProps','PlantProps','PlantTypes','ZombieProps','ZombieTypes','GridItemTypes','TombstoneProps'].map(k=>[k,[{}]]))},
 'FrontYard':{FrontYard:{getLawnEnumByTypeName:()=>48,getLawnFeature:()=>({RESNAME:'Tutorial'})}},'Plants':{plants:{getPlantFeatureByType:()=>({CODENAME:'cherry_bomb'})}},
};
const cc={director:{getScene:()=>({name:'mainScene'})},game:{isPaused:()=>pausada}};
const padre={postMessage:p=>mensajes.push(structuredClone(p))};
const contexto={location:{origin:origen},parent:padre,performance,setTimeout,clearTimeout,
 setInterval:fn=>{intervalo=fn;return 1;},clearInterval:()=>{intervalo=null;},
 addEventListener:(nombre,fn)=>{escuchas[nombre]=fn;},
 System:{get:ruta=>modulos[ruta.split('/').at(-1).replace('.ts','')],import:async()=>cc},
 semillaMotor:{frente:{zona,sesion},pausa:async si=>{pausada=si;},cerrar:async()=>{pausada=true;}},
};contexto.window=contexto;
vm.runInNewContext(fs.readFileSync(new URL('../public/jardin/motores/pvz2/frente.js',import.meta.url),'utf8'),contexto);
await new Promise(setImmediate);
assert.equal(mensajes[0].evento,'listo');assert.equal(mensajes[0].capacidades.instantaneas,false);
let contador=0;
const pedir=async(orden,datos={})=>{const solicitud=++contador;await escuchas.message({origin:origen,source:padre,data:{canal:'semilla-frente-v1',zona,sesion,solicitud,orden,...datos}});return mensajes.find(p=>p.solicitud===solicitud);};
for(const cambio of[{origin:'https://otra.test'},{source:{}},{data:{canal:'semilla-frente-v1',zona,sesion:'ajena',solicitud:500,orden:'pausa'}}]){
 await escuchas.message({origin:origen,source:padre,data:{canal:'semilla-frente-v1',zona,sesion,solicitud:500,orden:'pausa'},...cambio});
}assert.equal(pausada,false);assert.equal(mensajes.length,1);
assert.equal((await pedir('iniciar',{nivel:'otro'})).ok,false);assert.equal((await pedir('iniciar',{nivel:'tutorial1'})).valor.fase,'combatiendo');
assert.equal((await pedir('iniciar',{nivel:'tutorial1'})).ok,false);
assert.equal((await pedir('pausa')).valor.pausada,true);assert.equal((await pedir('reanudar')).valor.pausada,false);
// El nivel que abra después la interfaz nativa no se etiqueta como el frente solicitado.
partida.thisLevelsID=['tutorial2'];assert.equal((await pedir('observar')).valor.nivel,null);
partida.thisLevelsID=['tutorial1'];tablero.gameWon=true;intervalo();tablero.gameWon=false;tablero.gameLost=true;intervalo();
assert.equal(mensajes.filter(p=>p.evento==='resultado').length,1,'Una sesión no entrega dos resultados, aunque cambie el nivel nativo');
assert.equal(mensajes.find(p=>p.evento==='resultado').estado.fase,'victoria');
assert.equal((await pedir('guardar')).ok,false,'No fingir instantáneas mediante contadores');
assert.equal((await pedir('cerrar')).valor.fase,'cerrado');assert.equal(intervalo,null);
assert.equal((await pedir('observar')).ok,false);
console.log('OK protocolo preparado: identidad, nivel permitido, reinicio, pausa, resultado único, cierre y rechazo de guardados inexistentes');
