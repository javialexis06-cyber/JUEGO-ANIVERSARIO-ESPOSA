import * as THREE from 'three';

/** Comparte los dibujos de utilería idéntica sin tocar los modelos originales ni sus colisiones.
 * Las raíces originales siguen disponibles para rayos y golpes. Conserva el viento rígido del GLB;
 * animales, esqueletos y transparencias quedan fuera. Agrupa por sectores de 16 metros para poder ocultarlos. */
export class InstanciasEstaticas {
  readonly grupo = new THREE.Group();
  private lotes = new Map<string, THREE.InstancedMesh>();
  private fuentes = new Set<THREE.Object3D>();
  private matriz = new THREE.Matrix4();
  private inversa = new THREE.Matrix4();
  private animadas = new Set<THREE.Object3D>();
  private movimientos = new Map<string, { raiz: THREE.Object3D; malla: THREE.Mesh; indice: number }[]>();

  sincronizar(raices: THREE.Object3D[], animadas = new Set<THREE.Object3D>()) {
    for (const raiz of this.fuentes) raiz.visible = true;
    this.fuentes.clear();
    this.animadas = animadas; this.movimientos.clear();
    const dibujos = new Map<string, { malla: THREE.Mesh; matrices: THREE.Matrix4[] }>();
    this.grupo.updateWorldMatrix(true, false);
    this.inversa.copy(this.grupo.matrixWorld).invert();
    for (const raiz of raices) {
      // Solo se agrupan modelos rígidos y opacos. Conservar transparencia y orden de dibujo anteriores.
      let apta = true;
      raiz.updateWorldMatrix(true, true);
      raiz.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh && (m.matrixWorld.determinant() < 0 || (m as THREE.SkinnedMesh).isSkinnedMesh || (m as THREE.InstancedMesh).isInstancedMesh || ([] as THREE.Material[]).concat(m.material).some(v => v.transparent))) apta = false; });
      if (!apta) continue;
      raiz.updateWorldMatrix(true, true);
      raiz.traverseVisible(o => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const clave = Math.floor(raiz.position.x / 16) + ',' + Math.floor(raiz.position.z / 16) + ':' + m.geometry.uuid + ':' + ([] as THREE.Material[]).concat(m.material).map(v => v.uuid).join(',') + ':' + m.castShadow + ':' + m.receiveShadow;
        let lote = dibujos.get(clave);
        if (!lote) { lote = { malla: m, matrices: [] }; dibujos.set(clave, lote); }
        if (animadas.has(raiz)) { const movimiento = this.movimientos.get(clave) ?? []; movimiento.push({ raiz, malla: m, indice: lote.matrices.length }); this.movimientos.set(clave, movimiento); }
        lote.matrices.push(this.matriz.multiplyMatrices(this.inversa, m.matrixWorld).clone());
      });
      raiz.visible = false;
      this.fuentes.add(raiz);
    }
    for (const [clave, lote] of dibujos) {
      let m = this.lotes.get(clave);
      if (!m || m.instanceMatrix.count < lote.matrices.length) {
        m?.removeFromParent(); m?.dispose();
        const capacidad = 2 ** Math.ceil(Math.log2(Math.max(1, lote.matrices.length)));
        m = new THREE.InstancedMesh(lote.malla.geometry, lote.malla.material, capacidad);
        m.castShadow = lote.malla.castShadow; m.receiveShadow = lote.malla.receiveShadow;
        m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.lotes.set(clave, m); this.grupo.add(m);
      }
      m.count = lote.matrices.length;
      lote.matrices.forEach((matriz, i) => m!.setMatrixAt(i, matriz));
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
      if (this.movimientos.has(clave) && m.boundingSphere) m.boundingSphere.radius += .5;
    }
    for (const [clave, m] of this.lotes) if (!dibujos.has(clave)) { m.removeFromParent(); m.dispose(); this.lotes.delete(clave); }
  }

  actualizar() {
    for (const raiz of this.animadas) if (this.fuentes.has(raiz)) raiz.updateWorldMatrix(true, true);
    for (const [clave, fuentes] of this.movimientos) {
      const m = this.lotes.get(clave)!;
      for (const f of fuentes) m.setMatrixAt(f.indice, this.matriz.multiplyMatrices(this.inversa, f.malla.matrixWorld));
      m.instanceMatrix.needsUpdate = true;
    }
  }

  get stats() { return { raices: this.fuentes.size, dibujos: this.lotes.size }; }
  dispose() {
    for (const r of this.fuentes) r.visible = true;
    this.fuentes.clear();
    this.animadas.clear(); this.movimientos.clear();
    // La biblioteca es dueña de geometrías/materiales. Aquí solo se liberan los búferes de instancias.
    for (const m of this.lotes.values()) { m.removeFromParent(); m.dispose(); }
    this.lotes.clear();
  }
}
