// El prólogo de la granja, como película: en el silencio de Astra nace un mundo y con él Celia; Aura y Lara la ven
// tan pequeña que tejen el Santuario (el escudo invisible) y, mucho después, Él y Ella llegan al valle al amanecer y
// Celia baja a recibirlos. Mitología: docs/mitologia.md (Celia, las Diosas Hermanas y el Santuario Protegido).
import * as THREE from 'three';
import { cargar } from '../recursos';
import { actorDiosa, actorPareja, actuar, halo, type Actor } from './cine-actores';
import type { ContextoToma, Escenario, Guion, Toma, V3 } from './cine-granja';
import { LINEAS_PROLOGO } from './cine-lineas';

// ------------------------------------------------------------------ utilidades

/** Azar con semilla (cada escena sale igual siempre, también al grabar). */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp;
const paso = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const bez = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, t: number) =>
  new THREE.Vector3().copy(a).multiplyScalar((1 - t) * (1 - t)).addScaledVector(b, 2 * (1 - t) * t).addScaledVector(c, t * t);

const RUIDO = /* glsl */ `
float hash3(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float ruido(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*ruido(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}
`;
// Los #include van en su propia línea (pegados a otra instrucción no compilan)
const FIN_FRAG = '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';

/** Partículas suaves (estrellas, chispas, polen) dibujadas como puntos con su núcleo brillante. */
function puntosSuaves(n: number, llenar: (i: number, pos: Float32Array, col: Float32Array, tam: Float32Array, fase: Float32Array) => void,
  vertice: string, uniforms: Record<string, THREE.IUniform>, ref = 10) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), tam = new Float32Array(n), fase = new Float32Array(n);
  for (let i = 0; i < n; i++) llenar(i, pos, col, tam, fase);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
  geo.setAttribute('aFase', new THREE.BufferAttribute(fase, 1));
  // Los uniformes propios de cada sistema se declaran solos según su tipo
  const propios = Object.entries(uniforms).map(([k, u]) => `uniform ${(u.value as THREE.Vector3).isVector3 ? 'vec3' : 'float'} ${k};`).join('');
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uEscala: { value: 1 }, uAlfa: { value: 1 }, uRef: { value: ref }, ...uniforms },
    vertexShader: `attribute vec3 aColor;attribute float aTam;attribute float aFase;uniform float uT;uniform float uEscala;uniform float uRef;${propios}
      varying vec3 vColor;varying float vBrillo;
      ${RUIDO}
      void main(){vec3 p=position;float brillo=1.;${vertice}
        vColor=aColor;vBrillo=brillo;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=aTam*uEscala*clamp(uRef/max(.1,-mv.z),.35,6.);}`,
    fragmentShader: `uniform float uAlfa;varying vec3 vColor;varying float vBrillo;
      void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=smoothstep(.5,0.,d);a=a*a+pow(a,8.)*1.5;
        gl_FragColor=vec4(vColor*a*uAlfa*vBrillo,1.);${FIN_FRAG}}`,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  });
  const p = new THREE.Points(geo, mat);
  p.frustumCulled = false;
  return p;
}

/** Hablar mientras dura la línea: boca y manos (vaivén), y vuelve a su pose al terminar. */
function hablar(a: Actor, c: ContextoToma, pose = 'reposo', cara: 'normal' | 'feliz' = 'feliz') {
  const l = c.toma.linea, desde = l?.desde ?? 0.4;
  const hasta = c.dur - 0.9;
  if (l && c.local > desde && c.local < hasta) {
    a.p.vaiven('hablar_a', 'hablar_b', 0.5 + 0.5 * Math.sin(c.t * 3.1));
    a.p.cara(Math.sin(c.t * 9.0) > -0.3 ? 'hablar' : cara);
  } else actuar(a, pose, cara);
}

/** Copia una pieza del kit muchas veces con instancias (pocas llamadas de dibujo). */
function instanciar(pieza: THREE.Object3D, lugares: [number, number, number, number, number?][]) {
  const g = new THREE.Group();
  if (!lugares.length) return g;
  pieza.updateMatrixWorld(true);
  const inv = pieza.matrixWorld.clone().invert(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), eje = new THREE.Vector3(0, 1, 0);
  pieza.traverse((o) => {
    const malla = o as THREE.Mesh;
    if (!malla.isMesh) return;
    const local = inv.clone().multiply(malla.matrixWorld);
    const im = new THREE.InstancedMesh(malla.geometry, malla.material, lugares.length);
    lugares.forEach(([x, y, z, giro, esc = 1], i) => { m.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(eje, giro), new THREE.Vector3(esc, esc, esc)); im.setMatrixAt(i, m.clone().multiply(local)); });
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = true;
    im.receiveShadow = true;
    im.computeBoundingSphere();
    im.userData.noLiberar = true;
    g.add(im);
  });
  return g;
}

/** Busca una pieza en un kit de la granja (un vacío «m_<clave>» por pieza) o devuelve el modelo entero. */
const piezaKit = (kit: THREE.Object3D, clave: string) => kit.getObjectByName('m_' + clave) ?? kit.getObjectByName(clave) ?? null;

// ------------------------------------------------------------------ cosmos: nace Celia y se teje el Santuario

function cosmos(): Escenario {
  const g = new THREE.Group();
  g.name = 'cosmos';
  // Estrellas lejanas (una banda más densa como vía láctea) y polvo cercano
  const r = azar(7);
  const estrellas = puntosSuaves(7000, (i, pos, col, tam, fase) => {
    let d = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize();
    if (i % 3 === 0) d = new THREE.Vector3(d.x, d.y * 0.18 + 0.1, d.z).normalize();
    d.multiplyScalar(420 + r() * 80);
    pos.set([d.x, d.y, d.z], i * 3);
    const tono = r();
    const c = tono < 0.6 ? [1, 0.97, 0.92] : tono < 0.8 ? [0.75, 0.85, 1] : [1, 0.85, 0.65];
    const b = 0.5 + r() * 0.9;
    col.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
    tam[i] = 0.7 + r() * r() * 3.2;
    fase[i] = r() * 6.28;
  }, 'brillo=.65+.35*sin(uT*1.7+aFase*3.);', {}, 460);
  g.add(estrellas);
  // Nebulosa: esfera por dentro con nubes de color
  const nebulosa = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 32), new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uAlfa: { value: 0 } },
    vertexShader: 'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform float uT;uniform float uAlfa;varying vec3 vDir;${RUIDO}
      void main(){vec3 d=normalize(vDir);float n=fbm(d*2.2+vec3(0.,uT*.004,0.)),n2=fbm(d*4.5+3.1),n3=fbm(d*1.3-7.);
        vec3 c=vec3(.006,.008,.03);
        c+=vec3(.20,.07,.32)*smoothstep(.42,.82,n)*.9;
        c+=vec3(.03,.22,.30)*smoothstep(.5,.86,n2)*.7;
        c+=vec3(.42,.12,.30)*smoothstep(.6,.9,n3)*.45;
        c+=vec3(.9,.7,.45)*pow(smoothstep(.62,.95,n*n2*1.6),3.)*.25;
        gl_FragColor=vec4(c*uAlfa,1.);${FIN_FRAG}}`,
    side: THREE.BackSide, depthWrite: false,
  }));
  g.add(nebulosa);
  // El planeta de Celia: nace de un corazón de luz (uNacer 0 → 1), con mares, tierra verde, nubes y atmósfera
  const sol = new THREE.Vector3(-0.55, 0.35, 0.75).normalize();
  const planetaMat = new THREE.ShaderMaterial({
    uniforms: { uNacer: { value: 0 }, uT: { value: 0 }, uSol: { value: sol } },
    vertexShader: 'varying vec3 vDir;varying vec3 vN;varying vec3 vVista;void main(){vDir=normalize(position);vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vVista=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: `uniform float uNacer;uniform float uT;uniform vec3 uSol;varying vec3 vDir;varying vec3 vN;varying vec3 vVista;${RUIDO}
      void main(){vec3 d=normalize(vDir);float h=fbm(d*2.4+1.3);float tierra=smoothstep(.5,.53,h);
        vec3 mar=mix(vec3(.04,.16,.36),vec3(.10,.40,.60),smoothstep(.36,.5,h));
        vec3 verde=mix(vec3(.22,.52,.2),vec3(.5,.6,.28),smoothstep(.55,.7,h));verde=mix(verde,vec3(.48,.38,.26),smoothstep(.7,.8,h));
        vec3 c=mix(mar,verde,tierra);c=mix(c,vec3(.95,.97,1.),smoothstep(.8,.9,abs(d.y)+(h-.5)*.4));
        float l=max(dot(normalize(vN),uSol),0.);vec3 luz=c*(.05+l*1.15)+vec3(1.,.6,.35)*pow(1.-abs(dot(normalize(vN),uSol)),14.)*.05*l;
        luz+=mar*pow(max(dot(reflect(-uSol,normalize(vN)),vVista),0.),40.)*(1.-tierra)*.8;
        float h2=fbm(d*3.1+5.);float aparece=smoothstep(h2-.05,h2+.05,uNacer*1.1-.05);
        vec3 magma=vec3(1.7,1.25,.65)*(1.1+.6*fbm(d*6.+uT*.4));
        vec3 col=mix(magma,luz,aparece);
        col+=vec3(1.6,1.1,.5)*smoothstep(.07,0.,abs(h2-(uNacer*1.1-.05)))*(1.-step(.999,uNacer))*2.;
        gl_FragColor=vec4(col,1.);${FIN_FRAG}}`,
  });
  const planeta = new THREE.Mesh(new THREE.SphereGeometry(4, 96, 64), planetaMat);
  g.add(planeta);
  const nubesMat = new THREE.ShaderMaterial({
    uniforms: { uNacer: { value: 0 }, uT: { value: 0 }, uSol: { value: sol } },
    vertexShader: 'varying vec3 vDir;varying vec3 vN;void main(){vDir=normalize(position);vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform float uNacer;uniform float uT;uniform vec3 uSol;varying vec3 vDir;varying vec3 vN;${RUIDO}
      void main(){vec3 d=normalize(vDir);float n=fbm(d*3.4+vec3(uT*.015,0.,0.));float a=smoothstep(.55,.78,n)*.85*smoothstep(.6,1.,uNacer);
        float l=max(dot(normalize(vN),uSol),0.);gl_FragColor=vec4(vec3(1.)*(.08+l*1.1),a);${FIN_FRAG}}`,
    transparent: true, depthWrite: false,
  });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(4.09, 96, 64), nubesMat));
  const atmosfera = new THREE.ShaderMaterial({
    uniforms: { uNacer: { value: 0 }, uSol: { value: sol } },
    vertexShader: 'varying vec3 vN;varying vec3 vVista;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vVista=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: `uniform float uNacer;uniform vec3 uSol;varying vec3 vN;varying vec3 vVista;
      void main(){float f=pow(1.-max(dot(normalize(vN),vVista),0.),5.5);float l=.15+.85*max(dot(normalize(vN),uSol),0.);
        gl_FragColor=vec4(vec3(.35,.7,1.)*f*l*1.3*uNacer,1.);${FIN_FRAG}}`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(4.32, 64, 48), atmosfera));
  // La chispa y el estallido del nacimiento
  const chispa = halo('#fff2c8', 1);
  g.add(chispa);
  const estallido = halo('#ffd98a', 1);
  g.add(estallido);
  // El Santuario: escudo de hexágonos que cierra desde Aura (oro) y desde Lara (violeta) hasta encontrarse
  const escudoMat = new THREE.ShaderMaterial({
    uniforms: { uCierre: { value: 0 }, uT: { value: 0 }, uDestello: { value: 0 }, uVisible: { value: 0 } },
    vertexShader: 'varying vec3 vDir;varying vec3 vN;varying vec3 vVista;void main(){vDir=normalize(position);vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vVista=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: `uniform float uCierre;uniform float uT;uniform float uDestello;uniform float uVisible;varying vec3 vDir;varying vec3 vN;varying vec3 vVista;
      float hexDist(vec2 p){p=abs(p);return max(dot(p,normalize(vec2(1.,1.732))),p.x);}
      void main(){vec3 d=normalize(vDir);
        float da=acos(clamp(dot(d,vec3(-1.,0.,0.)),-1.,1.))/3.14159,dl=1.-da,lim=uCierre*1.04;
        float cubre=max(smoothstep(lim+.02,lim-.02,da),smoothstep(lim+.02,lim-.02,dl));
        float frente=(smoothstep(.05,0.,abs(da-lim))+smoothstep(.05,0.,abs(dl-lim)))*step(uCierre,.999);
        vec2 uv=vec2(atan(d.z,d.x)/6.2832+.5,acos(d.y)/3.14159)*vec2(46.,23.);
        vec2 rr=vec2(1.,1.732),hh=rr*.5,a=mod(uv,rr)-hh,b=mod(uv-hh,rr)-hh,gv=dot(a,a)<dot(b,b)?a:b;
        float linea=smoothstep(.42,.5,hexDist(gv));
        float f=pow(1.-abs(dot(normalize(vN),vVista)),2.4);
        vec3 col=mix(vec3(1.,.72,.28),vec3(.62,.48,1.),smoothstep(-.35,.35,d.x));
        float brillo=cubre*(f*.75+linea*.32*(.55+.45*sin(uT*2.+d.y*9.+d.x*5.)))*uVisible+frente*1.8;
        gl_FragColor=vec4(col*brillo+vec3(1.,.95,.85)*uDestello*(f+.15),1.);${FIN_FRAG}}`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(6.3, 96, 64), escudoMat));
  // Luces de las diosas (llave cálida y contornos de color)
  const llave = new THREE.DirectionalLight('#fff0dc', 3.1);
  llave.position.set(-6, 8, 16);
  const contornoOro = new THREE.DirectionalLight('#ffbf6a', 2.2);
  contornoOro.position.set(-14, 6, -12);
  const contornoVioleta = new THREE.DirectionalLight('#a98cff', 2.2);
  contornoVioleta.position.set(14, 6, -12);
  g.add(new THREE.HemisphereLight('#4a5a9a', '#120a1e', 0.55), llave, contornoOro, contornoVioleta);
  // Estelas de llegada y flujos de energía hacia el escudo (uno por diosa)
  const estela = (color: [number, number, number]) => {
    const rr = azar(color[0] * 1000 + 3);
    return puntosSuaves(420, (i, pos, col, tam, fase) => {
      pos.set([rr() * 2 - 1, rr() * 2 - 1, rr() * 2 - 1], i * 3);
      const b = 0.6 + rr() * 0.8;
      col.set([color[0] * b, color[1] * b, color[2] * b], i * 3);
      tam[i] = 1.5 + rr() * 3;
      fase[i] = i / 420;
    }, `float nace=aFase*uViaje;float edad=uT-nace;if(edad<0.){brillo=0.;}
        vec3 a=uP0,b=uP1,c=uP2;float s=clamp(nace/uViaje,0.,1.);vec3 camino=a*(1.-s)*(1.-s)+b*2.*(1.-s)*s+c*s*s;
        p=camino+position*(.25+edad*.9);brillo*=exp(-edad*1.1)*step(0.,edad);`,
      { uViaje: { value: 4 }, uP0: { value: new THREE.Vector3() }, uP1: { value: new THREE.Vector3() }, uP2: { value: new THREE.Vector3() } });
  };
  const flujo = (color: [number, number, number]) => {
    const rr = azar(color[2] * 1000 + 11);
    return puntosSuaves(700, (i, pos, col, tam, fase) => {
      pos.set([rr() * 2 - 1, rr() * 2 - 1, rr() * 2 - 1], i * 3);
      const b = 0.7 + rr() * 0.8;
      col.set([color[0] * b, color[1] * b, color[2] * b], i * 3);
      tam[i] = 2.4 + rr() * 4.5;
      fase[i] = rr();
    }, `float s=fract(aFase+uT*.45);vec3 a=uP0,b=uP1,c=uP2;vec3 camino=a*(1.-s)*(1.-s)+b*2.*(1.-s)*s+c*s*s;
        p=camino+position*.22*sin(s*3.14159);brillo*=uFlujo*sin(s*3.14159);`,
      { uFlujo: { value: 0 }, uP0: { value: new THREE.Vector3() }, uP1: { value: new THREE.Vector3() }, uP2: { value: new THREE.Vector3() } });
  };
  const estelaAura = estela([1, 0.75, 0.32]), estelaLara = estela([0.68, 0.55, 1]);
  const flujoAura = flujo([1, 0.78, 0.35]), flujoLara = flujo([0.7, 0.58, 1]);
  g.add(estelaAura, estelaLara, flujoAura, flujoLara);
  let aura!: Actor, lara!: Actor;
  const llegadaAura = [new THREE.Vector3(-46, 12, -26), new THREE.Vector3(-22, 6, 6), new THREE.Vector3(-10.5, -1.2, 2.2)] as const;
  const llegadaLara = [new THREE.Vector3(46, -10, -26), new THREE.Vector3(22, -4, 6), new THREE.Vector3(10.5, -1.2, 2.2)] as const;
  const VIAJE = 4.2;
  const ubicarDiosa = (a: Actor, camino: readonly THREE.Vector3[], s: number, t: number, mira: number) => {
    const p = bez(camino[0], camino[1], camino[2], 1 - (1 - s) ** 2.4);
    a.raiz.position.copy(p);
    a.raiz.position.y += Math.sin(t * 1.3 + mira) * 0.12;
    a.raiz.rotation.y = lerp(mira * 2.2, mira, paso(0.5, 1, s));
    a.raiz.rotation.z = Math.sin(t * 0.9 + mira) * 0.03;
  };
  return {
    grupo: g, fondo: new THREE.Color('#010208'), exposicion: 1.0,
    async preparar() {
      [aura, lara] = await Promise.all([actorDiosa('aura'), actorDiosa('lara')]);
      for (const a of [aura, lara]) { a.raiz.scale.setScalar(2.3); g.add(a.raiz); actuar(a, 'reposo', 'feliz'); }
      lara.p.cara('normal');
    },
    actualizar(c) {
      const t = c.t;
      for (const m of [estrellas.material, nebulosa.material, planetaMat, nubesMat, escudoMat, estelaAura.material, estelaLara.material, flujoAura.material, flujoLara.material] as THREE.ShaderMaterial[]) {
        if (m.uniforms.uT) m.uniforms.uT.value = t;
        if (m.uniforms.uEscala) m.uniforms.uEscala.value = c.alto / 720;
      }
      // Fundido del cielo al empezar
      const inicio = c.desde('c_vacio');
      (estrellas.material as THREE.ShaderMaterial).uniforms.uAlfa.value = paso(0.3, 3.5, inicio);
      (nebulosa.material as THREE.ShaderMaterial).uniforms.uAlfa.value = paso(1.0, 6, inicio);
      // La chispa crece, estalla y nace el planeta
      const nace = c.desde('c_nace');
      const semilla = paso(2.6, 5.5, inicio) * (1 - paso(1.4, 2.2, nace));
      chispa.scale.setScalar(0.4 + semilla * 2.8 + Math.sin(t * 7) * 0.15 * semilla);
      chispa.material.opacity = semilla;
      const boom = paso(1.2, 1.9, nace) * (1 - paso(2.2, 5.5, nace));
      estallido.scale.setScalar(4 + paso(1.2, 4, nace) * 60);
      estallido.material.opacity = boom;
      const nacer = paso(1.6, 7.0, nace);
      planetaMat.uniforms.uNacer.value = nacer;
      nubesMat.uniforms.uNacer.value = nacer;
      atmosfera.uniforms.uNacer.value = nacer;
      planeta.visible = nace > 1.2;
      planeta.rotation.y = t * 0.03;
      // Aura y Lara llegan con su estela
      const sa = clamp(c.desde('c_aura') / VIAJE, 0, 1), sl = clamp(c.desde('c_lara') / VIAJE, 0, 1);
      aura.raiz.visible = c.desde('c_aura') > 0;
      lara.raiz.visible = c.desde('c_lara') > 0;
      ubicarDiosa(aura, llegadaAura, sa, t, 0.75);
      ubicarDiosa(lara, llegadaLara, sl, t, -0.75);
      for (const [e, camino, d] of [[estelaAura, llegadaAura, c.desde('c_aura')], [estelaLara, llegadaLara, c.desde('c_lara')]] as const) {
        const u = (e.material as THREE.ShaderMaterial).uniforms;
        u.uT.value = d;
        u.uViaje.value = VIAJE;
        u.uP0.value.copy(camino[0]); u.uP1.value.copy(camino[1]); u.uP2.value.copy(camino[2]).add(new THREE.Vector3(0, 3.2, 0));
        e.visible = d > 0 && d < VIAJE + 6;
      }
      // Hablan en su toma; en la del escudo levantan los brazos y tejen
      const escudo = c.desde('c_escudo');
      if (c.toma.id === 'c_aura') hablar(aura, c);
      else if (c.toma.id === 'c_lara') { hablar(lara, c, 'reposo', 'normal'); actuar(aura, 'reposo', 'feliz'); }
      else if (escudo > 0) { actuar(aura, escudo > 0.8 ? 'trofeo' : 'reposo', 'feliz'); actuar(lara, escudo > 1.1 ? 'trofeo' : 'reposo', 'feliz'); }
      const tejer = paso(1.4, 2.4, escudo) * (1 - paso(7.4, 8.6, escudo));
      for (const [f, a, lado] of [[flujoAura, aura, -1], [flujoLara, lara, 1]] as const) {
        const u = (f.material as THREE.ShaderMaterial).uniforms;
        u.uFlujo.value = tejer;
        const manos = a.raiz.position.clone().add(new THREE.Vector3(0, 5.4, 0.6));
        u.uP0.value.copy(manos);
        u.uP1.value.set(lado * 9, 9, 3);
        u.uP2.value.set(lado * 6.2, 0.6, 0.4);
        f.visible = tejer > 0.01;
      }
      escudoMat.uniforms.uVisible.value = paso(1.6, 2.6, escudo) * (1 - paso(9.5, 11.5, escudo) * 0.75);
      escudoMat.uniforms.uCierre.value = paso(2.0, 7.2, escudo);
      escudoMat.uniforms.uDestello.value = Math.max(0, 1 - Math.abs(escudo - 7.4) / 0.6) * 1.4;
      for (const a of [aura, lara]) a.p.update(c.dt);
    },
  };
}

// ------------------------------------------------------------------ valle: Él y Ella llegan y Celia los recibe

/** Caminito de tierra (una cinta sobre la curva del sendero). */
function sendero(curva: THREE.CatmullRomCurve3, ancho: number) {
  const n = 160, pos: number[] = [], col: number[] = [], idx: number[] = [];
  const c1 = new THREE.Color('#b9915f'), c2 = new THREE.Color('#9a7448');
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = curva.getPoint(t), d = curva.getTangent(t), lado = new THREE.Vector3(-d.z, 0, d.x).normalize();
    for (const s of [-1, -0.45, 0, 0.45, 1]) {
      const borde = Math.abs(s) > 0.9;
      const q = p.clone().addScaledVector(lado, s * ancho * 0.5 * (1 + Math.sin(t * 40 + s) * 0.06));
      pos.push(q.x, 0.025 - (borde ? 0.02 : 0), q.z);
      const cc = c1.clone().lerp(c2, borde ? 0.8 : Math.abs(Math.sin(t * 90 + s * 3)) * 0.35);
      col.push(cc.r, cc.g, cc.b);
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) { const a = i * 5 + j; idx.push(a, a + 5, a + 1, a + 1, a + 5, a + 6); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  m.receiveShadow = true;
  return m;
}

function valle(): Escenario {
  const g = new THREE.Group();
  g.name = 'valle';
  const sol = new THREE.Vector3(-0.62, 0.16, -0.77).normalize();
  // Cielo del amanecer
  const cielo = new THREE.ShaderMaterial({
    uniforms: { uSol: { value: sol }, uAmanecer: { value: 0 } },
    vertexShader: 'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform vec3 uSol;uniform float uAmanecer;varying vec3 vDir;${RUIDO}
      void main(){vec3 d=normalize(vDir);float y=d.y;
        vec3 cenit=mix(vec3(.12,.15,.42),vec3(.2,.44,.88),uAmanecer),hor=mix(vec3(.96,.56,.44),vec3(.98,.76,.55),uAmanecer);
        vec3 c=mix(hor,cenit,pow(clamp(y+.02,0.,1.),.42));
        float s=max(dot(d,uSol),0.);c+=vec3(1.,.7,.4)*pow(s,10.)*.28+vec3(1.,.9,.72)*pow(s,900.)*1.6;
        float nube=smoothstep(.55,.8,fbm(vec3(d.x*3.,d.y*9.,d.z*3.)+2.))*smoothstep(.02,.18,y)*(1.-smoothstep(.35,.6,y));
        c=mix(c,mix(vec3(1.,.78,.66),vec3(1.,.95,.9),uAmanecer)*(.75+s*.6),nube*.55);
        c=mix(c,hor*.85,smoothstep(0.,-.12,y));gl_FragColor=vec4(c,1.);${FIN_FRAG}}`,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(600, 48, 32), cielo));
  // Suelo con lomas a lo lejos y pasto con variaciones
  const suelo = new THREE.PlaneGeometry(320, 320, 160, 160);
  suelo.rotateX(-Math.PI / 2);
  {
    const p = suelo.attributes.position, col: number[] = [], r = azar(5);
    const verdes = [new THREE.Color('#6f9a45'), new THREE.Color('#8bb158'), new THREE.Color('#5d8a3c'), new THREE.Color('#a3b862')];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z);
      const loma = (Math.sin(x * 0.045) * Math.cos(z * 0.038) * 0.5 + 0.5) * 9 + Math.sin(x * 0.11 + z * 0.07) * 1.6;
      p.setY(i, loma * paso(28, 90, d));
      const c = verdes[Math.floor(r() * 4)].clone().lerp(verdes[(i * 7) % 4], 0.5).multiplyScalar(0.9 + Math.sin(x * 0.7) * Math.cos(z * 0.6) * 0.08);
      col.push(c.r, c.g, c.b);
    }
    suelo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    suelo.computeVertexNormals();
  }
  const sueloMalla = new THREE.Mesh(suelo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  sueloMalla.receiveShadow = true;
  g.add(sueloMalla);
  const curva = new THREE.CatmullRomCurve3([[9, 0, 46], [6, 0, 30], [4.5, 0, 20], [2, 0, 11], [0, 0, 4], [0, 0, -3]].map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  g.add(sendero(curva, 1.9));
  // Luz dorada del amanecer (el sol bajito por detrás: contornos de oro) y un relleno frío del lado de la cámara
  const luzSol = new THREE.DirectionalLight('#ffcf9a', 3.0);
  luzSol.position.copy(sol).multiplyScalar(60);
  luzSol.castShadow = true;
  luzSol.shadow.mapSize.set(2048, 2048);
  Object.assign(luzSol.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 160 });
  luzSol.shadow.bias = -0.0004;
  luzSol.shadow.normalBias = 0.03;
  const relleno = new THREE.DirectionalLight('#e2ebff', 1.35);
  relleno.position.set(10, 12, 30);
  const cielito = new THREE.HemisphereLight('#ffe7c4', '#58743c', 0.85);
  g.add(luzSol, luzSol.target, relleno, cielito);
  // Polen y luciérnagas del amanecer
  const rp = azar(19);
  const polen = puntosSuaves(520, (i, pos, col, tam, fase) => {
    pos.set([(rp() - 0.5) * 40, rp() * 6 + 0.3, (rp() - 0.5) * 40 + 6], i * 3);
    const c = rp() < 0.6 ? [1, 0.86, 0.55] : [0.95, 1, 0.75];
    col.set(c, i * 3);
    tam[i] = 1.2 + rp() * 2.2;
    fase[i] = rp() * 6.28;
  }, 'p+=vec3(sin(uT*.3+aFase)*.8,sin(uT*.5+aFase*2.)*.35,cos(uT*.27+aFase)*.8);brillo=.5+.5*sin(uT*2.3+aFase*5.);', {});
  g.add(polen);
  // La columna de luz por donde baja Celia, su anillo en el suelo y los pétalos
  const columnaMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uFuerza: { value: 0 } },
    vertexShader: 'varying vec2 vUv;varying float vFrente;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vec3 n=normalize(mat3(modelMatrix)*normal);vFrente=abs(dot(n,normalize(cameraPosition-w.xyz)));gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: `uniform float uT;uniform float uFuerza;varying vec2 vUv;varying float vFrente;${RUIDO}
      void main(){float bandas=fbm(vec3(vUv.x*8.,vUv.y*3.-uT*.8,0.));float a=pow(1.-vUv.y,1.4)*(.45+.55*bandas)*uFuerza;
        a*=smoothstep(0.,.08,vUv.y)*pow(vFrente,1.6);gl_FragColor=vec4(vec3(1.,.9,.66)*a*.32,1.);${FIN_FRAG}}`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const columna = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 44, 40, 1, true), columnaMat);
  columna.position.set(0, 22, 1.4);
  g.add(columna);
  const anillo = halo('#fff0c4', 1);
  anillo.position.set(0, 0.25, 1.4);
  g.add(anillo);
  const rr = azar(23);
  const petalos = puntosSuaves(260, (i, pos, col, tam, fase) => {
    pos.set([rr() * 6.28, rr() * 3.5, 0.6 + rr() * 2.4], i * 3);
    const c = rr() < 0.5 ? [1, 0.78, 0.86] : rr() < 0.5 ? [1, 0.96, 0.82] : [0.82, 1, 0.75];
    col.set(c, i * 3);
    tam[i] = 2 + rr() * 2.6;
    fase[i] = rr();
  }, `float a=position.x+uT*(.5+aFase*.6);float h=mod(position.y+uT*(.35+aFase*.3),4.2);
      p=vec3(cos(a)*position.z,h*.9,sin(a)*position.z)+uCentro;brillo*=uPetalos*smoothstep(0.,.4,h)*(1.-smoothstep(3.4,4.2,h));`,
    { uPetalos: { value: 0 }, uCentro: { value: new THREE.Vector3(0, 0, 1.4) } });
  g.add(petalos);
  // Destellos al irse Celia
  const rd = azar(29);
  const motas = puntosSuaves(380, (i, pos, col, tam, fase) => {
    pos.set([(rd() - 0.5) * 1.6, rd() * 2.6, (rd() - 0.5) * 1.6], i * 3);
    col.set(rd() < 0.5 ? [0.85, 1, 0.7] : [1, 0.92, 0.65], i * 3);
    tam[i] = 2 + rd() * 3;
    fase[i] = rd();
  }, `float e=max(0.,uSubir-aFase*.6);p=position*(1.+e*1.6)+uCentro+vec3(sin(aFase*40.+uT)*e*1.5,e*(3.+aFase*6.),cos(aFase*31.+uT)*e*1.5);
      brillo*=step(.001,uSubir)*smoothstep(0.,.3,e+.05)*(1.-smoothstep(1.6,2.6,e));`,
    { uSubir: { value: 0 }, uCentro: { value: new THREE.Vector3(0, 0.6, 1.4) } });
  g.add(motas);
  const flores: THREE.Object3D[] = [];
  let celia!: Actor, el!: Actor, ella!: Actor;
  const CELIA = new THREE.Vector3(0, 0.55, 1.4);
  // Él y Ella caminan por el sendero hasta pararse frente a Celia
  const caminoEl = [new THREE.Vector3(4.4, 0, 24), new THREE.Vector3(1.9, 0, 13), new THREE.Vector3(-0.85, 0, 6.3)];
  const caminoElla = [new THREE.Vector3(6.2, 0, 24.6), new THREE.Vector3(3.6, 0, 13.6), new THREE.Vector3(0.85, 0, 6.5)];
  const caminar = (a: Actor, camino: THREE.Vector3[], s: number, t: number) => {
    const k = s < 1 ? s : 1;
    const p = bez(camino[0], camino[1], camino[2], k), q = bez(camino[0], camino[1], camino[2], Math.min(1, k + 0.01));
    a.raiz.position.copy(p);
    if (s < 1) {
      a.raiz.rotation.y = Math.atan2(q.x - p.x, q.z - p.z);
      const fase = t * 7.2;
      a.p.vaiven('caminar_a', 'caminar_b', 0.5 + 0.5 * Math.sin(fase));
      a.p.cuerpo.position.y = Math.abs(Math.sin(fase)) * 0.035;
    }
    return s >= 1;
  };
  const mirarA = (a: Actor, x: number, z: number, k = 0.12) => {
    const meta = Math.atan2(x - a.raiz.position.x, z - a.raiz.position.z);
    let d = meta - a.raiz.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    a.raiz.rotation.y += d * k;
  };
  return {
    grupo: g, fondo: null, niebla: new THREE.Fog('#f2cfae', 70, 300), exposicion: 1.0,
    async preparar() {
      const [monte, cabana, cerca, hierba, matorral, dientes, praderas, arbusto, tocon, actores] = await Promise.all([
        cargar('granja_monte.glb'), cargar('granja-v2/casita_pueblo.glb'), cargar('granja-v2/cerca.glb'), cargar('granja-v2/maleza_hierba.glb'),
        cargar('granja-v2/maleza_matorral.glb'), cargar('granja-v2/maleza_flores.glb'), cargar('granja-v2/flores_pradera.glb'),
        cargar('granja-v2/arbusto_flores.glb'), cargar('granja-v2/tocon.glb'),
        Promise.all([actorDiosa('celia'), actorPareja('el'), actorPareja('ella')]),
      ]);
      [celia, el, ella] = actores;
      const r = azar(31);
      const libre = (x: number, z: number, margen = 0) => {
        if (Math.hypot(x - CELIA.x, z - CELIA.z) < 2.8 + margen) return false;
        if (Math.abs(x) < 4.6 + margen && z > -11 && z < -3.5) return false; // la cabaña
        let cerca = 99;
        for (let i = 0; i <= 40; i++) { const p = curva.getPoint(i / 40); cerca = Math.min(cerca, Math.hypot(x - p.x, z - p.z)); }
        return cerca > 1.6 + margen;
      };
      const lugares = (n: number, rmin: number, rmax: number, cx = 0, cz = 0, esc: [number, number] = [0.8, 1.3], margen = 0) => {
        const out: [number, number, number, number, number][] = [];
        for (let k = 0; out.length < n && k < n * 30; k++) {
          const a = r() * Math.PI * 2, d = rmin + (rmax - rmin) * Math.sqrt(r()), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
          if (libre(x, z, margen)) out.push([x, 0, z, r() * 6.28, esc[0] + r() * (esc[1] - esc[0])]);
        }
        return out;
      };
      const kit = (clave: string) => piezaKit(monte, clave);
      const roble = kit('roble'), pino = kit('pino');
      if (roble) g.add(instanciar(roble, lugares(70, 18, 70, 0, -6, [0.9, 1.5], 2)));
      if (pino) g.add(instanciar(pino, lugares(55, 24, 80, 0, -10, [0.9, 1.6], 2)));
      for (const [clave, n] of [['helecho', 50], ['mata', 70], ['hongo', 26]] as const) { const p = kit(clave); if (p) g.add(instanciar(p, lugares(n, 6, 26, 0, 0, [0.8, 1.4]))); }
      const roca = kit('roca_grande');
      if (roca) g.add(instanciar(roca, lugares(9, 8, 24, 0, 0, [0.5, 0.9], 1)));
      const tronco = kit('tronco_caido');
      if (tronco) g.add(instanciar(tronco, [[-6.5, 0, 9, 0.6, 1], [7.8, 0, -1, -0.4, 1.1]]));
      // La granja dormida: maleza por todas partes alrededor de la cabaña
      g.add(instanciar(hierba, lugares(210, 2.5, 17, 0, -1, [1.2, 2.0])));
      g.add(instanciar(matorral, lugares(110, 3, 16, 0, -1, [1.1, 1.8])));
      g.add(instanciar(dientes, lugares(90, 2.8, 15, 0, 0, [1.1, 1.6])));
      g.add(instanciar(tocon, lugares(10, 4, 14, 0, -2, [0.9, 1.3], 0.6)));
      g.add(instanciar(praderas, lugares(60, 8, 24, 0, 4, [1, 1.6])));
      const casa = cabana.clone(true);
      casa.scale.setScalar(1.8);
      casa.position.set(0, 0, -7.6);
      casa.userData.noLiberar = true;
      casa.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      g.add(casa);
      // La cerquita vieja (con tramos caídos) alrededor del patio
      const tramos: [number, number, number, number, number][] = [];
      for (let i = 0; i < 7; i++) if (i !== 3) tramos.push([-6.6 + i * 2.2, 0, -2.4, 0, 1]);
      for (let i = 0; i < 3; i++) { tramos.push([-7.7, 0, -3.6 - i * 2.2, Math.PI / 2, 1]); tramos.push([7.7, 0, -3.6 - i * 2.2, Math.PI / 2 + (i === 1 ? 0.35 : 0), 1]); }
      g.add(instanciar(cerca, tramos));
      // Las flores que brotan alrededor de Celia (crecen en su toma)
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2 + r() * 0.2, d = 1.5 + r() * 1.5;
        const f = (i % 3 === 0 ? arbusto : praderas).clone(true);
        f.position.set(CELIA.x + Math.cos(a) * d, 0, CELIA.z + Math.sin(a) * d * 0.8);
        f.rotation.y = r() * 6.28;
        f.userData.escala = (i % 3 === 0 ? 1.2 : 1.7) * (0.85 + r() * 0.4);
        f.userData.retraso = r() * 1.6;
        f.userData.noLiberar = true;
        f.scale.setScalar(0.001);
        flores.push(f);
        g.add(f);
      }
      celia.raiz.scale.setScalar(1.18);
      for (const a of [celia, el, ella]) g.add(a.raiz);
      actuar(celia, 'reposo', 'feliz');
    },
    actualizar(c) {
      const t = c.t;
      for (const m of [polen.material, columnaMat, petalos.material, motas.material] as THREE.ShaderMaterial[]) {
        if (m.uniforms.uT) m.uniforms.uT.value = t;
        if (m.uniforms.uEscala) m.uniforms.uEscala.value = c.alto / 720;
      }
      cielo.uniforms.uAmanecer.value = paso(0, 14, c.desde('v_amanecer'));
      // Él y Ella llegan por el sendero; se paran frente a donde cae la luz
      const llegan = c.desde('v_llegan');
      el.raiz.visible = ella.raiz.visible = llegan > -2.6;
      const s = clamp((llegan + 2.5) / 12, 0, 1);
      const llegoEl = caminar(el, caminoEl, s, t), llegoElla = caminar(ella, caminoElla, clamp((llegan + 2.3) / 12.1, 0, 1), t + 0.4);
      const quietos = llegoEl && llegoElla;
      const luz = c.desde('v_luz'), cel = c.desde('v_celia1');
      if (quietos || luz > 0) {
        for (const a of [el, ella]) mirarA(a, CELIA.x, CELIA.z, Math.min(1, c.dt * 4));
        if (luz > 0 && cel < 0) { actuar(el, 'boca_abierta', 'sorprendido'); actuar(ella, 'boca_abierta', 'sorprendido'); }
      }
      if (cel > 0) {
        const id = c.toma.id;
        if (id === 'v_celia2' || id === 'v_celia4') { actuar(el, 'pensando', 'normal'); actuar(ella, 'reposo', 'feliz'); }
        else if (id === 'v_celia3') { actuar(el, 'aplauso_a', 'feliz'); actuar(ella, 'feliz', 'feliz'); }
        else if (id === 'v_despedida' || id === 'v_titulo') { actuar(el, 'saludo', 'feliz'); actuar(ella, 'saludo_b', 'feliz'); }
        else { actuar(el, 'reposo', 'feliz'); actuar(ella, 'reposo', 'feliz'); }
      }
      // La luz cae, se abre y Celia aparece flotando entre pétalos
      const desp = c.desde('v_despedida');
      const fuerza = paso(0.2, 1.4, luz) * (1 - paso(2.6, 5.0, luz)) + paso(0, 1.4, desp) * (1 - paso(3.5, 6, desp)) * 0.35;
      columnaMat.uniforms.uFuerza.value = fuerza;
      columna.visible = fuerza > 0.01;
      anillo.scale.setScalar(2 + paso(0.6, 2.5, luz) * 5.5);
      anillo.material.opacity = paso(0.6, 1.8, luz) * 0.5 * (1 - paso(1.2, 3.5, c.desde('v_despedida')));
      (petalos.material as THREE.ShaderMaterial).uniforms.uPetalos.value = paso(1.6, 3.2, luz) * (1 - paso(2.5, 4.5, c.desde('v_despedida')));
      const aparece = paso(1.6, 3.6, luz);
      const sube = paso(0.6, 4.2, c.desde('v_despedida'));
      celia.raiz.visible = aparece > 0.01 && sube < 0.98;
      celia.raiz.position.copy(CELIA).add(new THREE.Vector3(0, (1 - aparece) * 3 + Math.sin(t * 1.4) * 0.1 + sube * sube * 6, 0));
      celia.raiz.scale.setScalar(1.18 * (0.3 + aparece * 0.7) * (1 - sube * 0.7));
      celia.raiz.rotation.y = Math.sin(t * 0.6) * 0.06;
      if (celia.halo) celia.halo.material.opacity = (0.12 + aparece * 0.18 + sube * 0.25) * (c.toma.id.startsWith('v_celia') ? 0.7 : 1);
      const motasU = (motas.material as THREE.ShaderMaterial).uniforms;
      motasU.uSubir.value = c.desde('v_despedida') > 0 ? paso(0.4, 5.5, c.desde('v_despedida')) * 3 : 0;
      motasU.uCentro.value.copy(celia.raiz.position);
      const id = c.toma.id;
      if (id === 'v_celia3') hablar(celia, c, 'regalo');
      else if (id === 'v_celia5') hablar(celia, c, 'corona');
      else if (id.startsWith('v_celia')) hablar(celia, c, id === 'v_celia4' ? 'senalar_b' : 'saludo');
      else if (id === 'v_despedida') actuar(celia, 'beso_volado_a', 'feliz');
      else actuar(celia, 'reposo', 'feliz');
      // Las flores brotan cuando aparece Celia y cuando habla de sembrar
      const brota = Math.max(paso(2.2, 4.0, luz) * 0.45, paso(1.0, 4.5, c.desde('v_celia3')));
      for (const f of flores) { const k = clamp((brota * 2.2 - f.userData.retraso * 0.5), 0, 1); f.scale.setScalar(Math.max(0.001, f.userData.escala * (1 - (1 - k) ** 3))); f.visible = k > 0.002; }
      for (const a of [celia, el, ella]) a.p.update(c.dt);
    },
  };
}

// ------------------------------------------------------------------ el guion

const p = (pos: V3, mira: V3, fov = 0): { pos: V3; mira: V3; fov: number } => ({ pos, mira, fov });
const L = LINEAS_PROLOGO;

const TOMAS: Toma[] = [
  { id: 'c_vacio', dur: 6, escena: 'cosmos', musica: 'M12', bloom: 0.9, entra: { color: '#000', dur: 2.5 }, cam: { de: p([0, 3, 82], [0, 0, 0], 34), a: p([0, 2.4, 50], [0, 0, 0], 34), curva: 'lineal' } },
  { id: 'c_nace', dur: 10, escena: 'cosmos', bloom: 1.25, linea: L.narrador1, cam: { de: p([0, 2.4, 50], [0, 0, 0], 34), a: p([4, 1.6, 21], [0, 0, 0], 38), curva: 'sale' } },
  { id: 'c_aura', dur: 9, escena: 'cosmos', bloom: 0.8, linea: L.aura, cam: { de: p([-1.5, 3.4, 19], [-16, 3.5, -3], 40), a: p([-4.4, 2.3, 10.2], [-10.5, 1.5, 2.2], 36), curva: 'sale' } },
  { id: 'c_lara', dur: 9, escena: 'cosmos', bloom: 0.8, linea: L.lara, cam: { de: p([1.5, 3.4, 19], [16, 0, -3], 40), a: p([4.4, 2.3, 10.2], [10.5, 1.5, 2.2], 36), curva: 'sale' } },
  { id: 'c_escudo', dur: 11, escena: 'cosmos', bloom: 1.15, linea: L.narrador2, cam: { de: p([0, 5, 34], [0, 1, 0], 40), a: p([0, 3, 26], [0, 1.2, 0], 42) } },
  { id: 'c_caida', dur: 4.8, escena: 'cosmos', bloom: 1.3, sale: { color: '#fff8ea', dur: 1.5 }, cam: { de: p([0, 3, 26], [0, 0.8, 0], 42), a: p([0.4, 1.4, 4.9], [0, 0.4, 0], 82), curva: 'entra' } },
  { id: 'v_amanecer', dur: 9, escena: 'valle', musica: 'M13', bloom: 0.75, entra: { color: '#fff8ea', dur: 2.2 }, linea: L.narrador3, cam: { de: p([30, 19, 52], [0, 2, 0], 36), a: p([11, 4.6, 22], [0, 1.6, 0], 38) } },
  { id: 'v_llegan', dur: 9, escena: 'valle', bloom: 0.55, cam: { de: p([-1.2, 2.3, 9.5], [4.6, 1.1, 19.5], 36), a: p([-3.8, 1.8, 3.4], [0.6, 1.0, 8.6], 38), curva: 'lineal' } },
  { id: 'v_luz', dur: 6.5, escena: 'valle', bloom: 0.5, cam: { de: p([0.6, 1.25, 11.5], [0, 1.6, 2], 42), a: p([0.2, 1.05, 10.2], [0, 3.6, 1.4], 46) } },
  { id: 'v_celia1', dur: 7, escena: 'valle', bloom: 0.55, linea: L.celia1, cam: { de: p([1.6, 1.25, 6.4], [0, 1.75, 1.4], 36), a: p([1.1, 1.3, 5.6], [0, 1.85, 1.4], 34) } },
  { id: 'v_celia2', dur: 7, escena: 'valle', bloom: 0.7, linea: L.celia2, cam: { de: p([-1.3, 1.9, 0.0], [0, 1.0, 6.4], 42), a: p([-2.3, 2.5, -0.8], [-4, 0.6, 9.5], 44) } },
  { id: 'v_celia3', dur: 7, escena: 'valle', bloom: 0.6, linea: L.celia3, cam: { de: p([7.6, 2.6, 5.2], [0, 1.1, 3.4], 40), a: p([6.0, 2.0, 7.6], [0, 1.1, 3.2], 40) } },
  { id: 'v_celia4', dur: 7, escena: 'valle', bloom: 0.7, linea: L.celia4, cam: { de: p([2.2, 3.3, -3.6], [0, 1.0, 8], 40), a: p([2.8, 3.7, -4.6], [2.5, 1.2, 20], 38) } },
  { id: 'v_celia5', dur: 8, escena: 'valle', bloom: 0.75, linea: L.celia5, cam: { de: p([0, 1.5, 6.6], [0, 1.9, 1.4], 38), a: p([0, 1.35, 5.6], [0, 2.1, 1.4], 36) } },
  { id: 'v_despedida', dur: 6.5, escena: 'valle', bloom: 0.8, cam: { de: p([3.4, 1.7, 9.8], [0, 2.4, 2], 42), a: p([4.2, 3.4, 12.5], [0, 6, 0.5], 44) } },
  { id: 'v_titulo', dur: 8, escena: 'valle', bloom: 0.8, titulo: { grande: 'Nuestra granjita', chico: 'El Vientre de Celia' }, sale: { color: '#000', dur: 2.2 }, cam: { de: p([7, 6.5, 17], [0, 1.6, 0], 40), a: p([15, 16, 35], [0, 2, -4], 40) } },
];

export const PROLOGO: Guion = { id: 'prologo', nombre: 'El prólogo de la granja', fov: 38, tomas: TOMAS, escenarios: { cosmos, valle } };
