import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
import {PALABRAS_PAREJA} from './palabras-pareja.mjs';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'filtro-pvz-'));
const archivo='jardin/motores/pvz2/assets/main/index.js',destino=path.join(tmp,archivo);
const correr=()=>spawnSync(process.execPath,['scripts/verificar-amigos.mjs',tmp],{encoding:'utf8'});
try{
 fs.mkdirSync(path.dirname(destino),{recursive:true});const original=fs.readFileSync(path.join('public',archivo));fs.writeFileSync(destino,original);
 assert.equal(correr().status,0,'La versión pública revisada debe pasar con el nombre Halloween');
 fs.appendFileSync(destino,'\n// '+PALABRAS_PAREJA[0]);assert.equal(correr().status,1,'Una frase privada añadida al distribuible debe ser rechazada');
 fs.writeFileSync(destino,original);const html=path.join(tmp,'jardin/motores/pvz2/oculto.html');fs.writeFileSync(html,'<!doctype html><title>Prueba</title>');
 assert.equal(correr().status,1,'Una página HTML adicional no está autorizada por permitir los tres arranques');
 console.log('OK El filtro admite el recurso público fijado y rechaza cambios privados y páginas auxiliares no declaradas');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
