import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Cena da fundição, controlada por um único número "story":
 *   0→1  Origem   (câmera entra na fundição, em direção ao forno)
 *   1→2  Processo (aquecimento, metal líquido, vazamento, solidificação)
 *   2→3  Arte     (o molde se abre e a peça em bronze surge e esfria)
 *   3→4  Encerramento (a peça iluminada, câmera recua)
 */

export type Foundry = {
  setStory: (s: number) => void;
  setActive: (on: boolean) => void;
  resize: () => void;
  dispose: () => void;
};

const NOISE = /* glsl */ `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<4;i++){ v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }
vec3 heat(float t){
  vec3 c = mix(vec3(0.35,0.03,0.0), vec3(1.0,0.32,0.03), smoothstep(0.0,0.45,t));
  c = mix(c, vec3(1.0,0.72,0.2), smoothstep(0.4,0.75,t));
  return mix(c, vec3(1.0,0.95,0.75), smoothstep(0.75,1.0,t));
}`;

const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function moltenMaterial(power: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uHeat: { value: 1 }, uPower: { value: power }, uFlow: { value: 0 }, uLen: { value: 1 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uHeat, uPower, uFlow, uLen; varying vec2 vUv; ${NOISE}
      void main(){
        if (vUv.x > uLen) discard;
        vec2 p = vUv * vec2(6.0, 3.0); p.x -= uTime * uFlow;
        float n = fbm(p + fbm(p * 1.7 + uTime * 0.25));
        float t = clamp(0.35 + n * 0.75, 0.0, 1.0) * uHeat;
        vec3 c = heat(t) * uPower * (0.25 + uHeat);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

function softDot() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.4, "rgba(255,255,255,0.35)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createFoundry(canvas: HTMLCanvasElement, opts: { lite: boolean }): Foundry {
  const { lite } = opts;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1.25 : 1.6));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050403);
  scene.fog = new THREE.FogExp2(0x070504, 0.075);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.22;

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);

  /* ---------- Ambiente ---------- */
  const dark = new THREE.MeshStandardMaterial({ color: 0x14110e, roughness: 0.82, metalness: 0.35 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x1c1815, roughness: 0.6, metalness: 0.75 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x0d0b09, roughness: 0.55, metalness: 0.6 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), dark);
  wall.position.set(0, 7, -9.2);
  scene.add(wall);

  // colunas e vigas dão profundidade ao galpão
  const colGeo = new THREE.BoxGeometry(0.5, 9, 0.5);
  for (const [x, z] of [[-4.2, 4], [4.2, 4], [-4.6, -1], [4.6, -1], [-5, -6], [5, -6]] as const) {
    const c = new THREE.Mesh(colGeo, iron);
    c.position.set(x, 4.5, z);
    scene.add(c);
  }
  for (const z of [4, -1, -6]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(11, 0.35, 0.4), iron);
    b.position.set(0, 6.2, z);
    scene.add(b);
  }

  /* ---------- Forno ---------- */
  const furnace = new THREE.Group();
  furnace.position.set(0, 0, -7);
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 4.2, 2.4), dark);
  body.position.y = 2.1;
  furnace.add(body);
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 6, 16), dark);
  chimney.position.set(0, 7, -0.3);
  furnace.add(chimney);
  const fireMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; varying vec2 vUv; ${NOISE}
      void main(){
        vec2 p = vUv; float arch = 1.0 - smoothstep(0.34, 0.5, length(vec2((p.x-0.5)*1.15, max(p.y-0.45, 0.0))));
        arch *= step(abs(p.x-0.5), 0.44);
        float n = fbm(vec2(p.x*4.0, p.y*3.0 - uTime*0.9));
        float t = clamp((1.15 - p.y) * (0.55 + n*0.9), 0.0, 1.0);
        vec3 c = heat(t) * 1.15 * arch;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.7), fireMat);
  mouth.position.set(0, 1.55, 1.21);
  furnace.add(mouth);
  for (const x of [-1.1, 1.1]) {
    const j = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.2, 0.3), iron);
    j.position.set(x, 1.4, 1.3);
    furnace.add(j);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 0.3), iron);
  lintel.position.set(0, 2.6, 1.3);
  furnace.add(lintel);
  scene.add(furnace);
  const fireLight = new THREE.PointLight(0xff7a22, 60, 24, 1.7);
  fireLight.position.set(0, 1.7, -4.9);
  scene.add(fireLight);

  /* ---------- Cadinho ---------- */
  const LIP = new THREE.Vector3(-0.42, 1.72, 0);
  const pivot = new THREE.Group();
  pivot.position.copy(LIP);
  const crucible = new THREE.Group();
  crucible.position.set(-0.46, -0.62, 0); // o bico fica no pivô
  const prof = [[0.0, 0.0], [0.3, 0.0], [0.4, 0.12], [0.46, 0.62], [0.5, 0.66], [0.42, 0.66], [0.36, 0.14], [0.0, 0.1]].map(([x, y]) => new THREE.Vector2(x, y));
  const crucMat = new THREE.MeshStandardMaterial({ color: 0x17120e, roughness: 0.7, metalness: 0.55, emissive: 0xff3c05, emissiveIntensity: 0 });
  crucible.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 40), crucMat));
  const meltMat = moltenMaterial(1.5);
  const melt = new THREE.Mesh(new THREE.CircleGeometry(0.41, 40), meltMat);
  melt.rotation.x = -Math.PI / 2;
  melt.position.y = 0.56;
  crucible.add(melt);
  // garra que segura o cadinho
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 10, 40), iron);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.4;
  crucible.add(ring);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 8), iron);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(-1.75, 0.4, 0);
  crucible.add(arm);
  pivot.add(crucible);
  scene.add(pivot);
  const meltLight = new THREE.PointLight(0xff9a3c, 0, 9, 1.8);
  meltLight.position.set(-0.8, 2.3, 0.3);
  scene.add(meltLight);

  /* ---------- Molde ---------- */
  const MOLD = new THREE.Vector3(0.55, 0.72, 0);
  const sand = new THREE.MeshStandardMaterial({ color: 0x2a2219, roughness: 0.95, metalness: 0.05 });
  const stand = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.5, 1.7), iron);
  stand.position.set(MOLD.x, 0.25, 0);
  scene.add(stand);
  const drag = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.22, 1.4), sand);
  drag.position.set(MOLD.x, 0.61, 0);
  scene.add(drag);
  const copeMat = sand.clone();
  copeMat.transparent = true;
  const cope = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.22, 1.4), copeMat);
  cope.position.set(MOLD.x, 0.84, 0);
  scene.add(cope);
  for (const [mesh, y] of [[drag, 0], [cope, 0]] as const) {
    for (const dy of [-0.075, 0.075]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.035, 1.44), iron);
      band.position.y = y + dy;
      mesh.add(band);
    }
    for (const sx of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), iron);
      h.rotation.x = Math.PI / 2;
      h.position.set(sx * 1.1, 0, 0);
      mesh.add(h);
    }
  }
  const seamMat = moltenMaterial(1.6);
  seamMat.transparent = true;
  const seam = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.018, 1.42), seamMat);
  seam.position.set(MOLD.x, 0.725, 0);
  scene.add(seam);
  const SPRUE = new THREE.Vector3(-0.2, 0.955, 0);
  const sprueMat = moltenMaterial(2);
  const sprue = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24), sprueMat);
  sprue.rotation.x = -Math.PI / 2;
  sprue.position.copy(SPRUE);
  scene.add(sprue);

  /* ---------- Fio de metal ---------- */
  const curve = new THREE.QuadraticBezierCurve3(LIP.clone().add(new THREE.Vector3(0.02, -0.02, 0)), new THREE.Vector3(-0.2, 1.62, 0), SPRUE.clone());
  const streamMat = moltenMaterial(2.2);
  streamMat.uniforms.uFlow.value = 5;
  const stream = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.028, 10), streamMat);
  scene.add(stream);
  const pourLight = new THREE.PointLight(0xffb060, 0, 7, 2);
  pourLight.position.set(-0.2, 1.3, 0.5);
  scene.add(pourLight);

  /* ---------- A peça: cruz em bronze ---------- */
  const shape = new THREE.Shape();
  const w = 0.085, armY = 0.2, armW = 0.34, top = 0.62, bot = -0.62;
  shape.moveTo(-w, bot); shape.lineTo(w, bot); shape.lineTo(w, armY - w); shape.lineTo(armW, armY - w); shape.lineTo(armW, armY + w);
  shape.lineTo(w, armY + w); shape.lineTo(w, top); shape.lineTo(-w, top); shape.lineTo(-w, armY + w); shape.lineTo(-armW, armY + w);
  shape.lineTo(-armW, armY - w); shape.lineTo(-w, armY - w); shape.closePath();
  const crossGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.022, bevelSize: 0.022, bevelSegments: 5 });
  crossGeo.center();
  const bronze = new THREE.MeshStandardMaterial({ color: 0xb07a34, roughness: 0.3, metalness: 1, emissive: 0xff5a10, emissiveIntensity: 0, envMapIntensity: 3 });
  const piece = new THREE.Group();
  piece.add(new THREE.Mesh(crossGeo, bronze));
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 12, 48), bronze);
  halo.position.set(0, armY - 0.0, 0);
  piece.add(halo);
  const gem = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 20), bronze);
  gem.position.set(0, armY, 0.05);
  piece.add(gem);
  piece.visible = false;
  scene.add(piece);
  const PIECE_END = new THREE.Vector3(MOLD.x, 1.78, 0);

  const key = new THREE.SpotLight(0xfff0d8, 0, 14, 0.5, 0.6, 1.4);
  key.position.set(2.6, 4.6, 3.2);
  key.target.position.copy(PIECE_END);
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x6f8fd0, 0.55);
  rim.position.set(-5, 6, -4);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0x33405a, 0x1a0c04, 0.35));

  /* ---------- Partículas ---------- */
  const dot = softDot();
  const NS = lite ? 220 : 620;
  const sGeo = new THREE.BufferGeometry();
  const sSeed = new Float32Array(NS), sVel = new Float32Array(NS * 3), sPos = new Float32Array(NS * 3);
  for (let i = 0; i < NS; i++) {
    sSeed[i] = Math.random();
    const a = Math.random() * Math.PI * 2, r = 0.5 + Math.random() * 1.6;
    sVel[i * 3] = Math.cos(a) * r; sVel[i * 3 + 1] = 1.2 + Math.random() * 2.6; sVel[i * 3 + 2] = Math.sin(a) * r;
  }
  sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute("aSeed", new THREE.BufferAttribute(sSeed, 1));
  sGeo.setAttribute("aVel", new THREE.BufferAttribute(sVel, 3));
  sGeo.boundingSphere = new THREE.Sphere(SPRUE, 6);
  const sparkMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uBurst: { value: 0 }, uOrigin: { value: SPRUE.clone() }, uMap: { value: dot }, uScale: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aSeed; attribute vec3 aVel; uniform float uTime, uBurst, uScale; uniform vec3 uOrigin; varying float vA;
      void main(){
        float life = fract(uTime * (0.55 + aSeed * 0.5) + aSeed * 17.0);
        vec3 p = uOrigin + aVel * life * 0.9; p.y -= 3.4 * life * life;
        p.y = max(p.y, 0.02);
        vA = (1.0 - life) * step(aSeed, uBurst);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uScale * (5.0 + aSeed * 9.0) * (1.0 - life * 0.6) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; varying float vA;
      void main(){ float a = texture2D(uMap, gl_PointCoord).a * vA; if (a < 0.01) discard; gl_FragColor = vec4(vec3(1.0, 0.62, 0.22) * 2.4 * a, a); }`,
  });
  scene.add(new THREE.Points(sGeo, sparkMat));

  const NE = lite ? 160 : 420;
  const eGeo = new THREE.BufferGeometry();
  const ePos = new Float32Array(NE * 3), eSeed = new Float32Array(NE);
  for (let i = 0; i < NE; i++) {
    ePos[i * 3] = (Math.random() - 0.5) * 12; ePos[i * 3 + 1] = Math.random() * 6; ePos[i * 3 + 2] = -8 + Math.random() * 16;
    eSeed[i] = Math.random();
  }
  eGeo.setAttribute("position", new THREE.BufferAttribute(ePos, 3));
  eGeo.setAttribute("aSeed", new THREE.BufferAttribute(eSeed, 1));
  const emberMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uMap: { value: dot }, uScale: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aSeed; uniform float uTime, uScale; varying float vA;
      void main(){
        vec3 p = position;
        p.y = mod(p.y + uTime * (0.12 + aSeed * 0.3), 6.0);
        p.x += sin(uTime * 0.4 + aSeed * 40.0) * 0.35; p.z += cos(uTime * 0.3 + aSeed * 25.0) * 0.35;
        vA = (0.35 + 0.65 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 60.0)) * smoothstep(6.0, 4.0, p.y) * smoothstep(0.0, 0.6, p.y);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uScale * (2.5 + aSeed * 5.0) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; varying float vA;
      void main(){ float a = texture2D(uMap, gl_PointCoord).a * vA; if (a < 0.01) discard; gl_FragColor = vec4(vec3(1.0, 0.5, 0.16) * 1.6 * a, a); }`,
  });
  scene.add(new THREE.Points(eGeo, emberMat));

  // fumaça: poucos sprites grandes e suaves
  const smoke: THREE.Sprite[] = [];
  if (!lite) {
    for (let i = 0; i < 9; i++) {
      const m = new THREE.SpriteMaterial({ map: dot, color: 0x8a5a36, transparent: true, opacity: 0.05, depthWrite: false });
      const s = new THREE.Sprite(m);
      s.position.set((Math.random() - 0.5) * 6, 1 + Math.random() * 4, -6 + Math.random() * 5);
      s.scale.setScalar(4 + Math.random() * 4);
      s.userData.o = Math.random() * 10;
      smoke.push(s);
      scene.add(s);
    }
  }

  /* ---------- Pós-processamento ---------- */
  let composer: EffectComposer | null = null;
  if (!lite) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.65, 0.9));
    composer.addPass(new OutputPass());
  }

  /* ---------- Câmera ---------- */
  type K = { s: number; p: [number, number, number]; t: [number, number, number] };
  const wideKeys: K[] = [
    { s: 0, p: [0, 1.75, 11], t: [0, 1.7, -7] },
    { s: 1, p: [0.5, 1.7, 5.2], t: [0, 1.4, -2] },
    { s: 1.3, p: [1.3, 1.95, 4.3], t: [-0.9, 1.25, 0] },
    { s: 2, p: [1.1, 1.6, 3.6], t: [-0.7, 1.05, 0] },
    { s: 2.55, p: [1.0, 1.9, 3.3], t: [-0.45, 1.55, 0] },
    { s: 3, p: [1.0, 1.9, 1.55], t: [0.28, 1.84, 0] },
    { s: 4, p: [0.1, 1.75, 3.9], t: [-0.45, 1.7, 0] },
  ];
  const tallKeys: K[] = [
    { s: 0, p: [0, 1.9, 13], t: [0, 2.2, -7] },
    { s: 1, p: [0.2, 1.9, 7], t: [0, 2.3, -2] },
    { s: 1.3, p: [0.6, 2.3, 6.6], t: [0.05, 2.75, 0] },
    { s: 2, p: [0.5, 2.0, 6.0], t: [0.1, 2.6, 0] },
    { s: 2.55, p: [0.6, 2.2, 5.0], t: [0.45, 3.0, 0] },
    { s: 3, p: [0.75, 2.1, 3.1], t: [0.55, 2.75, 0] },
    { s: 4, p: [0.55, 2.0, 5.2], t: [0.55, 3.05, 0] },
  ];
  let keys = wideKeys;
  const camP = new THREE.Vector3(), camT = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  function camAt(s: number) {
    let i = 0;
    while (i < keys.length - 2 && s > keys[i + 1].s) i++;
    const a = keys[i], b = keys[i + 1];
    const u = ss(a.s, b.s, s);
    camP.set(...a.p).lerp(tmpA.set(...b.p), u);
    camT.set(...a.t).lerp(tmpB.set(...b.t), u);
  }

  /* ---------- Estado ---------- */
  let story = 0, shown = 0, active = true, raf = 0, disposed = false;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const onMouse = (e: PointerEvent) => {
    mouse.x = e.clientX / window.innerWidth - 0.5;
    mouse.y = e.clientY / window.innerHeight - 0.5;
  };
  if (!lite) window.addEventListener("pointermove", onMouse, { passive: true });
  const clock = new THREE.Clock();

  function update(s: number, time: number) {
    const u = Math.min(1, Math.max(0, s - 1)); // processo
    const v = Math.min(1, Math.max(0, s - 2)); // arte
    const f = Math.min(1, Math.max(0, s - 3)); // final

    const heatUp = ss(0.0, 0.34, u);
    const tilt = ss(0.4, 0.58, u) * (1 - ss(0.84, 0.95, u));
    const pour = ss(0.52, 0.6, u) * (1 - ss(0.8, 0.86, u));
    const fill = ss(0.56, 0.84, u);
    const cool = ss(0.88, 1, u);
    const lift = ss(0.02, 0.32, v);
    const rise = ss(0.22, 0.66, v);
    const pieceHeat = 1 - ss(0.15, 0.8, v);

    // cadinho
    crucMat.emissiveIntensity = Math.max(0, 0.03 + heatUp * 0.4 - cool * 0.15 - v * 0.3);
    meltMat.uniforms.uHeat.value = 0.25 + heatUp * 0.85;
    meltMat.uniforms.uFlow.value = 0.25;
    pivot.rotation.z = -tilt * 1.02;
    pivot.position.set(LIP.x - ss(0.0, 0.5, v) * 3.6, LIP.y + ss(0.0, 0.5, v) * 0.9, -ss(0.0, 0.5, v) * 1.2);
    meltLight.intensity = (1 + heatUp * 9) * (1 - v * 0.85) * (1 - f);

    // fio de metal
    stream.visible = pour > 0.01;
    streamMat.uniforms.uLen.value = Math.min(1, pour * 1.6);
    pourLight.intensity = pour * 9;
    sparkMat.uniforms.uBurst.value = pour * 0.95 + (1 - pour) * heatUp * 0.06 * (1 - v);
    sprue.visible = fill > 0.02 && lift < 0.9;
    sprueMat.uniforms.uHeat.value = (0.4 + pour * 0.7) * (1 - cool * 0.6) * (1 - lift);

    // molde
    seam.visible = fill > 0.02 && lift < 0.98;
    seamMat.uniforms.uHeat.value = fill * (1 - cool * 0.55) * (1 - lift * 0.9);
    cope.position.set(MOLD.x + lift * 1.3, 0.84 + lift * 0.9, -lift * 1.6);
    cope.rotation.z = -lift * 0.5;
    copeMat.opacity = 1 - ss(0.5, 1, lift);
    cope.visible = copeMat.opacity > 0.01;

    // peça
    piece.visible = lift > 0.05;
    const rot = time * 0.25 * (0.3 + ss(0.6, 1, v));
    piece.position.set(MOLD.x, lerp(0.76, PIECE_END.y, rise), 0);
    piece.rotation.set(lerp(-Math.PI / 2, 0, rise), rise * (0.5 + Math.sin(rot) * 0.55), 0);
    bronze.emissiveIntensity = pieceHeat * 1.25;
    bronze.roughness = lerp(0.55, 0.3, 1 - pieceHeat);
    key.intensity = ss(0.3, 0.9, v) * 48;
    scene.environmentIntensity = 0.22 + ss(0.4, 1, v) * 0.5;

    // forno
    fireLight.intensity = (34 + Math.sin(time * 9) * 4 + Math.sin(time * 23) * 2) * (1 - f * 0.55);

    camAt(s);
    mouse.sx += (mouse.x - mouse.sx) * 0.05;
    mouse.sy += (mouse.y - mouse.sy) * 0.05;
    camera.position.set(camP.x + mouse.sx * 0.35 + Math.sin(time * 0.3) * 0.04, camP.y - mouse.sy * 0.2 + Math.sin(time * 0.23) * 0.03, camP.z);
    camera.lookAt(camT);
  }

  function frame() {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (!active || document.hidden) return;
    const time = clock.getElapsedTime();
    shown += (story - shown) * 0.09;
    fireMat.uniforms.uTime.value = time;
    for (const m of [meltMat, seamMat, sprueMat, streamMat, sparkMat, emberMat]) m.uniforms.uTime.value = time;
    for (const s of smoke) {
      s.position.y = 1 + ((time * 0.12 + s.userData.o) % 5);
      (s.material as THREE.SpriteMaterial).opacity = 0.05 + Math.sin(time * 0.4 + s.userData.o) * 0.02;
    }
    update(shown, time);
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }

  function resize() {
    const wv = canvas.clientWidth || window.innerWidth, hv = canvas.clientHeight || window.innerHeight;
    renderer.setSize(wv, hv, false);
    composer?.setSize(wv, hv);
    camera.aspect = wv / hv;
    keys = camera.aspect < 0.85 ? tallKeys : wideKeys;
    camera.fov = camera.aspect < 0.85 ? 52 : 42;
    camera.updateProjectionMatrix();
    const sc = hv * renderer.getPixelRatio() * 0.9;
    sparkMat.uniforms.uScale.value = sc / 100;
    emberMat.uniforms.uScale.value = sc / 100;
  }
  resize();
  update(0, 0);
  frame();

  return {
    setStory: (s) => (story = s),
    setActive: (on) => (active = on),
    resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMouse);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      dot.dispose();
      envTex.dispose();
      pmrem.dispose();
      composer?.dispose();
      renderer.dispose();
    },
  };
}
