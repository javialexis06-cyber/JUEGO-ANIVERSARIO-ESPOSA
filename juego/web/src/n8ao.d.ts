// Tipos mínimos de n8ao (el paquete no trae declaraciones).
declare module 'n8ao' {
  import type { Camera, Color, Scene } from 'three';
  import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
  export class N8AOPass extends Pass {
    constructor(scene: Scene, camera: Camera, width?: number, height?: number);
    configuration: {
      aoRadius: number;
      distanceFalloff: number;
      intensity: number;
      color: Color;
      halfRes: boolean;
      gammaCorrection: boolean;
      screenSpaceRadius: boolean;
      [clave: string]: unknown;
    };
    setQualityMode(modo: 'Performance' | 'Low' | 'Medium' | 'High' | 'Ultra'): void;
  }
}
