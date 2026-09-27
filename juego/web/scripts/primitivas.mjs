import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f);
  let prims = 0; for (const m of doc.getRoot().listMeshes()) prims += m.listPrimitives().length;
  console.log(f.split('/').pop(), 'mallas', doc.getRoot().listMeshes().length, 'primitivas', prims);
}
