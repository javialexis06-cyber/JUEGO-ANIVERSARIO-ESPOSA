// Sombras de contacto (oclusión ambiental N8AO), suavizado de bordes (SMAA) y el paso final de color: es lo más
// pesado del dibujo y se descarga aparte, mientras la casa o el súper cargan sus modelos (así la primera pantalla
// arranca antes). Se ve exactamente igual que antes.
import { N8AOPass } from 'n8ao';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';

export function crearComposer(renderer: THREE.WebGLRenderer, escena: THREE.Scene, camara: THREE.Camera, w: number, h: number) {
  const composer = new EffectComposer(renderer);
  const ao = new N8AOPass(escena, camara, w, h);
  const c = ao.configuration;
  c.gammaCorrection = false;
  c.aoRadius = 0.7;
  c.distanceFalloff = 0.35;
  c.intensity = 3;
  c.color = new THREE.Color('#2a1a14');
  c.halfRes = true;
  ao.setQualityMode('Medium');
  composer.addPass(ao);
  composer.addPass(new SMAAPass(w, h));
  composer.addPass(new OutputPass());
  return composer;
}
