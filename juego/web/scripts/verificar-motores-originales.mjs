import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const raiz=fileURLToPath(new URL('../public/jardin/motores/',import.meta.url));
const lock=JSON.parse(fs.readFileSync(path.join(raiz,'motores.lock.json'),'utf8'));
assert.equal(lock.pvz1.commit,'141c1476dd462ac3526f796e303177616f4de6bc');
assert.equal(lock.pvz2.commit,'53d2ebb3ec51d1f69e9f906a5c4f70a5864dbfc6');
for(const f of lock.files){
 assert.ok(f.path&&!path.isAbsolute(f.path)&&!f.path.split('/').includes('..'));
 const bytes=fs.readFileSync(path.join(raiz,f.path));
 assert.equal(bytes.length,f.bytes,f.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256,f.path);
}
for(const f of ['pvz1/LICENSE','pvz1/COPYING','pvz1/LICENSE-jszip.md','pvz1/fuentes-0.2.5.tar.gz','pvz2/LICENSE'])assert.ok(lock.files.some(x=>x.path===f),f);
assert.ok(!lock.files.some(f=>f.path.toLowerCase().endsWith('main.pak')));
console.log(`OK ${lock.files.length} archivos de los motores fijados por SHA-256, con licencias y fuentes de Portable; sin recursos GOTY del usuario`);
