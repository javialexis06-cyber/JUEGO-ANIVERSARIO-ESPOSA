import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();
const nodes = root.listNodes();
const marcados = nodes.filter(n => n.getExtras() && n.getExtras().producto);
console.log('nodos', nodes.length, 'con producto', marcados.length, marcados.slice(0, 4).map(n => n.getName() + ':' + n.getExtras().producto).join(', '));
const mats = root.listMaterials();
console.log('materiales', mats.length, 'con fieltro', mats.filter(m => (m.getExtras() || {}).fieltro).length);
let tris = 0; for (const m of root.listMeshes()) for (const p of m.listPrimitives()) { const idx = p.getIndices(); tris += (idx ? idx.getCount() : p.getAttribute('POSITION').getCount()) / 3; }
console.log('triangulos', Math.round(tris));
console.log('raices', doc.getRoot().listScenes()[0].listChildren().slice(0,6).map(n => n.getName()).join(', '));
