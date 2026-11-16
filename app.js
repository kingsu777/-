import * as THREE from 'three';
import { CATS, MENU, MENU_BY_ID, formatPrice, CHAT_LINES, MANAGER_LINE, MANAGER_CHIRPS, MANAGER_REPLIES, GUEST_REPLIES, COOK_PERFECT_LINES, COOK_BURNT_LINES, MANAGER_BURNT_LINES, TOAST_COOK_LINES } from './menu.js';

const canvas = document.getElementById('c');
const hintEl = document.getElementById('hint');
const actionsEl = document.getElementById('actions');
const bubblesEl = document.getElementById('bubbles');
const exitEl = document.getElementById('exit');
const panelEl = document.getElementById('panel');
const menuEl = document.getElementById('menu');
const fadeEl = document.getElementById('fade');
const muteEl = document.getElementById('mute');
const talkEl = document.getElementById('talk');
const talkIn = document.getElementById('talk-in');
const tabsEl = menuEl.querySelector('.menu-tabs');
const listEl = menuEl.querySelector('.menu-list');
const sumEl = menuEl.querySelector('.menu-sum');
const okEl = menuEl.querySelector('.menu-ok');

const shot = new URLSearchParams(location.search).get('shot');

const state = {
  seated: false,
  sittingAt: null,
  walkTarget: null,
  pendingSeat: null,
  sessionSkewers: 0,
  managerWarned: false,
  managerTalking: false,
  exitShown: false,
  exitScheduled: false,
  muted: false,
  audioReady: false,
  playerChatting: false,
  shotCam: false,
  startedAt: performance.now(),
  seatedOnce: false,
  menuOpen: false,
  menuCat: '推荐',
  cookTipShown: false,
  cookReactAt: 0,
  flipHintAt: 0,
  managerBurntWarned: false,
  burntSession: 0,
};

const cart = new Map();
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const Y_AXIS = new THREE.Vector3(0, 1, 0);

const ROOM = { hx: 9.2, hz: 7.8, h: 4.35 };

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.autoUpdate = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x5a4a3e);
scene.fog = new THREE.Fog(0x5a4a3e, 22, 42);

const camera = new THREE.PerspectiveCamera(innerWidth < 700 ? 58 : 50, innerWidth / innerHeight, 0.12, 80);
camera.position.set(0.15, 2.72, 7.5);
camera.lookAt(-1.15, 0.95, 1.55);

const sun = new THREE.DirectionalLight(0xffe0b0, 0.72);
sun.position.set(5, 10, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 32;
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -12;
sun.shadow.bias = -0.0008;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xffe3c0, 0x5a4a3e, 0.7));
scene.add(new THREE.AmbientLight(0xffd2a0, 0.32));

const fillA = new THREE.PointLight(0xffc078, 1.55, 13);
fillA.position.set(-3.2, 3.15, 0.4);
scene.add(fillA);
const fillB = new THREE.PointLight(0xffc078, 1.55, 13);
fillB.position.set(3.2, 3.15, 0.4);
scene.add(fillB);

const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

function canvasTex(draw, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = aniso;
  return tex;
}

function makeWoodMap(base = '#c88836', w = 512, h = 512) {
  return canvasTex((ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) {
      const wave = Math.sin(y * 0.035) * 10 + Math.sin(y * 0.011 + 1.7) * 18;
      const t = (Math.sin(y * 0.08 + wave * 0.02) + 1) * 0.5;
      ctx.fillStyle = `rgba(90, 40, 8, ${0.04 + t * 0.12})`;
      ctx.fillRect(0, y, w, 1);
      ctx.fillStyle = `rgba(255, 200, 100, ${0.03 + (1 - t) * 0.08})`;
      ctx.fillRect(0, y, w, 1);
    }
    for (let i = 0; i < 30; i++) {
      let y = Math.random() * h;
      ctx.strokeStyle = `rgba(70, 30, 8, ${0.08 + Math.random() * 0.16})`;
      ctx.lineWidth = 1 + Math.random() * 2.2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 8) {
        y += Math.sin(x * 0.02 + i) * 0.55;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(60, 25, 5, ${Math.random() * 0.12})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1 + Math.random() * 2);
    }
  }, w, h);
}

function makeTerrazzoMap() {
  const tex = canvasTex((ctx, w, h) => {
    ctx.fillStyle = '#8c8e8c';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const g = 120 + Math.random() * 42;
      ctx.fillStyle = `rgba(${g},${g},${g - 2},0.16)`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 20 + Math.random() * 80, 16 + Math.random() * 60, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    const colors = ['#2a2a28', '#1a1a18', '#e8e6e0', '#d4d0c8', '#6a6864', '#c4b49a', '#8a7a68', '#4a4a48', '#f0eeea', '#5a5048'];
    const chip = (x, y, s, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      const n = 4 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
        const r = s * (0.5 + Math.random() * 0.6);
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    };
    for (let i = 0; i < 1800; i++) chip(Math.random() * 1024, Math.random() * 1024, 2 + Math.random() * 5, colors[i % colors.length]);
    for (let i = 0; i < 420; i++) chip(Math.random() * 1024, Math.random() * 1024, 5 + Math.random() * 10, colors[(i * 3) % colors.length]);
    for (let i = 0; i < 8000; i++) {
      const v = Math.random();
      ctx.fillStyle = v < 0.4 ? '#1c1c1a' : v < 0.7 ? '#f2f0ea' : '#7a6a58';
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
  }, 1024, 1024);
  tex.repeat.set(8, 6);
  return tex;
}

function makeWeaveMap() {
  const tex = canvasTex((ctx, w, h) => {
    const cell = 8;
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        const on = ((x + y) / cell) % 2 === 0;
        ctx.fillStyle = on ? '#4a3c32' : '#2e2824';
        ctx.fillRect(x, y, cell, cell);
        ctx.fillStyle = '#5c4c40';
        if (on) ctx.fillRect(x + 1, y + 1, cell - 3, 2);
        else ctx.fillRect(x + 1, y + 1, 2, cell - 3);
      }
    }
  }, 128, 128);
  tex.repeat.set(2, 2);
  return tex;
}

const woodMap = makeWoodMap('#c88836');
const chairMap = makeWoodMap('#c17a32', 384, 384);
const paleMap = makeWoodMap('#d4b896', 384, 384);
const darkMap = makeWoodMap('#7a4a28', 256, 256);
const terraMap = makeTerrazzoMap();
const weaveMap = makeWeaveMap();

const mats = {
  floor: new THREE.MeshStandardMaterial({ map: terraMap, roughness: 0.48, metalness: 0.08 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xefe4d4, roughness: 0.9 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.95 }),
  wood: new THREE.MeshStandardMaterial({ map: woodMap, roughness: 0.58, metalness: 0.04 }),
  woodTop: new THREE.MeshStandardMaterial({ map: woodMap, roughness: 0.55, metalness: 0.05 }),
  chairWood: new THREE.MeshStandardMaterial({ map: chairMap, roughness: 0.6, metalness: 0.04 }),
  woodLight: new THREE.MeshStandardMaterial({ map: paleMap, roughness: 0.62, metalness: 0.03 }),
  woodDark: new THREE.MeshStandardMaterial({ map: darkMap, roughness: 0.7, metalness: 0.04 }),
  weave: new THREE.MeshStandardMaterial({ map: weaveMap, roughness: 0.86, metalness: 0 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xb0b4b6, roughness: 0.32, metalness: 0.82 }),
  steelDark: new THREE.MeshStandardMaterial({ color: 0x5c5854, roughness: 0.42, metalness: 0.55 }),
  grate: new THREE.MeshStandardMaterial({ color: 0x2a2624, roughness: 0.45, metalness: 0.6 }),
  coal: new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.8, emissive: 0xc44a12, emissiveIntensity: 1.4 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xfff4dc, roughness: 0.22, metalness: 0, emissive: 0xffe9b8, emissiveIntensity: 0.35 }),
  dusk: new THREE.MeshStandardMaterial({ color: 0x4a4560, roughness: 0.28, metalness: 0.08, emissive: 0x2a1838, emissiveIntensity: 0.28 }),
  fridge: new THREE.MeshStandardMaterial({ color: 0xd9d4ce, roughness: 0.35, metalness: 0.55 }),
  bottleG: new THREE.MeshStandardMaterial({ color: 0x2f6b46, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.8 }),
  bottleA: new THREE.MeshStandardMaterial({ color: 0x8a5a22, roughness: 0.35, transparent: true, opacity: 0.82 }),
  bottleC: new THREE.MeshStandardMaterial({ color: 0xd8d4c6, roughness: 0.2, transparent: true, opacity: 0.55 }),
  bottleO: new THREE.MeshStandardMaterial({ color: 0xd87a28, roughness: 0.35, transparent: true, opacity: 0.85 }),
  bottleP: new THREE.MeshStandardMaterial({ color: 0xc45a6a, roughness: 0.35, transparent: true, opacity: 0.85 }),
  rust: new THREE.MeshStandardMaterial({ color: 0xb04a32, roughness: 0.7 }),
  apron: new THREE.MeshStandardMaterial({ color: 0x4a2d22, roughness: 0.8 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x1a1614, roughness: 0.9 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xe2b48a, roughness: 0.75 }),
  black: new THREE.MeshStandardMaterial({ color: 0x161412, roughness: 0.4, metalness: 0.3 }),
  mug: new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.35 }),
  beer: new THREE.MeshStandardMaterial({ color: 0xd7a33a, roughness: 0.3, transparent: true, opacity: 0.85 }),
  spiceA: new THREE.MeshStandardMaterial({ color: 0xb85a28, roughness: 0.35, transparent: true, opacity: 0.72 }),
  spiceB: new THREE.MeshStandardMaterial({ color: 0xc4a060, roughness: 0.4, transparent: true, opacity: 0.75 }),
  spiceC: new THREE.MeshStandardMaterial({ color: 0x8a3a22, roughness: 0.4, transparent: true, opacity: 0.75 }),
  spiceD: new THREE.MeshStandardMaterial({ color: 0xe8d8c0, roughness: 0.4, transparent: true, opacity: 0.7 }),
  tissue: new THREE.MeshStandardMaterial({ color: 0xf2efe4, roughness: 0.8 }),
  shade: new THREE.MeshStandardMaterial({ color: 0x6a4a32, roughness: 0.62, side: THREE.DoubleSide }),
  lampGlow: new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffc878, emissiveIntensity: 1.25, roughness: 0.4 }),
  plate: new THREE.MeshStandardMaterial({ color: 0xf0ebe3, roughness: 0.4 }),
  bowl: new THREE.MeshStandardMaterial({ color: 0xe8e0d2, roughness: 0.45 }),
  canRed: new THREE.MeshStandardMaterial({ color: 0xb01e1e, roughness: 0.35, metalness: 0.4 }),
  canGreen: new THREE.MeshStandardMaterial({ color: 0x1e8a4a, roughness: 0.35, metalness: 0.4 }),
  water: new THREE.MeshStandardMaterial({ color: 0xd4e8f0, roughness: 0.15, transparent: true, opacity: 0.45 }),
};

function box(w, h, d, mat, x, y, z, parent = scene, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function cyl(r, h, mat, x, y, z, parent = scene, segs = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segs), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function sph(r, mat, x, y, z, parent = scene, segs = 16) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, segs, segs), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

const interactives = [];
const seats = [];
const tables = [];
const npcs = [];
const grillLights = [];
const liveBubbles = [];
let player, atan, atanHome;
let plaque;
let chatWait = 6.2;
let pendingReply = null;
let atanAnim = null;

function makeBadge(num) {
  const tex = canvasTex((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#2a2420';
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.46, h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8d2a8';
    ctx.font = 'bold 70px "Noto Sans CJK SC","Noto Sans SC","sans-serif"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(num), w / 2, h / 2 + 4);
  }, 160, 96);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.15, transparent: true });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.084), mat);
  m.castShadow = false;
  return m;
}

function makeSign() {
  const tex = canvasTex((ctx, w, h) => {
    ctx.fillStyle = '#b04a32';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff4e8';
    ctx.font = 'bold 92px "Noto Sans CJK SC","Noto Sans SC","sans-serif"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('炭烤说', w / 2, h / 2 + 6);
  }, 512, 160);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
}

function hangPoster(url, x, y, z, w, h, rotY = 0) {
  const frame = new THREE.Group();
  frame.position.set(x, y, z);
  frame.rotation.y = rotY;
  scene.add(frame);
  box(w + 0.08, h + 0.08, 0.03, mats.woodDark, 0, 0, -0.01, frame, false);
  const mat = new THREE.MeshStandardMaterial({ color: 0xd8cbb8, roughness: 0.7 });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  plane.position.z = 0.012;
  frame.add(plane);
  new THREE.TextureLoader().load(url, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = aniso;
    mat.map = tex;
    mat.color.set(0xffffff);
    mat.needsUpdate = true;
  });
  return frame;
}

function makePendant(x, z) {
  const y = 2.62;
  cyl(0.012, ROOM.h - y, mats.steelDark, x, (ROOM.h + y) / 2, z, scene, 6).castShadow = false;
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.15, 16, 1, true), mats.shade);
  shade.position.set(x, y, z);
  shade.castShadow = false;
  scene.add(shade);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.18, 16), mats.lampGlow);
  glow.rotation.x = Math.PI / 2;
  glow.position.set(x, y - 0.075, z);
  scene.add(glow);
}

function buildHall() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 16.4), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = 'floor';
  scene.add(floor);
  interactives.push(floor);

  const W = mats.wall;
  box(20, ROOM.h, 0.24, W, 0, ROOM.h / 2, -ROOM.hz);
  box(20, ROOM.h, 0.24, W, 0, ROOM.h / 2, ROOM.hz);
  box(0.24, ROOM.h, 16.4, W, -ROOM.hx, ROOM.h / 2, 0);
  box(0.24, ROOM.h, 16.4, W, ROOM.hx, ROOM.h / 2, 0);
  box(20, 0.12, 16.4, mats.ceiling, 0, ROOM.h, 0, scene, false);

  // wooden beams
  for (let i = -3; i <= 3; i++) {
    box(18.6, 0.16, 0.28, mats.woodDark, 0, ROOM.h - 0.14, i * 2.05, scene, false);
  }
  box(0.28, 0.16, 15.2, mats.woodDark, 0, ROOM.h - 0.22, 0, scene, false);

  // modest dusk windows
  for (const x of [-ROOM.hx + 0.14, ROOM.hx - 0.14]) {
    for (const z of [-4.2, -1.4, 1.4, 4.2]) {
      const face = Math.sign(x) * 0.02;
      box(0.05, 1.7, 1.35, mats.dusk, x + face, 2.55, z, scene, false);
      box(0.06, 0.07, 1.48, mats.wood, x + face, 3.42, z, scene, false);
      box(0.06, 0.07, 1.48, mats.wood, x + face, 1.68, z, scene, false);
      box(0.06, 1.74, 0.07, mats.wood, x + face, 2.55, z - 0.68, scene, false);
      box(0.06, 1.74, 0.07, mats.wood, x + face, 2.55, z + 0.68, scene, false);
    }
  }

  // entrance doors behind the player
  box(1.16, 2.45, 0.07, mats.wood, -0.62, 1.22, ROOM.hz - 0.14);
  box(1.16, 2.45, 0.07, mats.wood, 0.62, 1.22, ROOM.hz - 0.14);
  box(0.7, 1.4, 0.03, mats.dusk, -0.62, 1.45, ROOM.hz - 0.18, scene, false);
  box(0.7, 1.4, 0.03, mats.dusk, 0.62, 1.45, ROOM.hz - 0.18, scene, false);

  // slim wooden pillars
  for (const x of [-6.6, 6.6]) {
    for (const z of [-4.6, 4.6]) {
      box(0.22, ROOM.h, 0.22, mats.woodLight, x, ROOM.h / 2, z);
    }
  }

  hangPoster('./assets/menu-grilled.jpg', -2.45, 2.15, -ROOM.hz + 0.15, 2.34, 1.66);
  hangPoster('./assets/menu-sides.jpg', 2.45, 2.15, -ROOM.hz + 0.15, 2.34, 1.66);
  const sign = box(1.35, 0.42, 0.04, makeSign(), 0, 3.28, -ROOM.hz + 0.14, scene, false);

  // pendants over tables and aisle
  for (const x of [-3.55, 3.55]) {
    for (const z of [3.35, 0.05, -3.25]) makePendant(x, z);
  }
  makePendant(0, 3.35);
  makePendant(0, 0.05);
  makePendant(0, -3.25);
}

function buildCounter() {
  const g = new THREE.Group();
  g.position.set(7.15, 0, -4.0);
  scene.add(g);
  box(0.86, 0.95, 3.15, mats.wood, 0, 0.475, 0, g);
  box(0.96, 0.07, 3.26, mats.woodTop, 0, 0.985, 0, g);
  box(0.03, 0.2, 3.0, mats.rust, -0.44, 0.72, 0, g, false);
  // a couple of mugs and a cloth
  cyl(0.05, 0.1, mats.mug, -0.25, 1.07, 0.7, g, 10);
  cyl(0.04, 0.07, mats.beer, -0.25, 1.08, 0.7, g, 10);
  box(0.36, 0.02, 0.22, mats.rust, -0.1, 1.03, -0.8, g, false);
  cyl(0.05, 0.1, mats.mug, -0.28, 1.07, -0.35, g, 10);

  // glass-door fridge beside the counter (further back)
  const fr = new THREE.Group();
  fr.position.set(7.15, 0, -6.45);
  scene.add(fr);
  box(0.86, 2.05, 1.35, mats.fridge, 0, 1.02, 0, fr);
  const door = box(0.05, 1.7, 1.12, mats.glass, -0.44, 1.1, 0, fr);
  door.castShadow = false;
  for (const y of [0.55, 1.05, 1.55]) {
    box(0.7, 0.03, 1.15, mats.steel, 0.02, y, 0, fr, false);
    for (let c = 0; c < 4; c++) {
      const mat = [mats.bottleG, mats.bottleA, mats.bottleO, mats.bottleC][c % 4];
      const z = -0.4 + c * 0.26;
      cyl(0.05, 0.28, mat, -0.12, y + 0.17, z, fr, 8);
      cyl(0.025, 0.08, mat, -0.12, y + 0.35, z, fr, 8);
    }
  }
}


const SKEWER_STYLE = {
  chicken: { a: 0xd4a07a, b: 0xa86b48, n: 5 },
  'beef-big': { a: 0x8d3f28, b: 0x5c2a1a, n: 4, scale: 1.15 },
  beef: { a: 0x8d3f28, b: 0x5c2a1a, n: 5 },
  lamb: { a: 0x7a3220, b: 0x9a4a30, n: 5 },
  'lamb-rib': { a: 0x7a3220, b: 0xc47848, n: 3, scale: 1.2 },
  fatty: { a: 0xc4a07a, b: 0x8d3f28, n: 5 },
  tendon: { a: 0xb08a70, b: 0x8a5a40, n: 4 },
  shrimp: { a: 0xe07a4a, b: 0xd06040, n: 2, shape: 'shrimp' },
  liver: { a: 0x5a3028, b: 0x3a1c18, n: 4 },
  intestine: { a: 0xc47a60, b: 0xa05040, n: 4 },
  skin: { a: 0xe8c8a0, b: 0xd0a070, n: 5 },
  cartilage: { a: 0xe0c8a8, b: 0xc4a07a, n: 4 },
  wing: { a: 0xc47840, b: 0x8a4020, n: 2, scale: 1.1 },
  sausage: { a: 0xb04a3a, b: 0x8a3028, n: 1, shape: 'sausage' },
  mushroom: { a: 0x6a5038, b: 0x4a3828, n: 3 },
  veg: { a: 0x5a8a48, b: 0xd8c8a8, n: 5 },
  pepper: { a: 0x3a8a3a, b: 0xc45a2a, n: 3 },
  bread: { a: 0xe0b060, b: 0xc49040, n: 3 },
  tofu: { a: 0xeee4c8, b: 0xd8d0b0, n: 4 },
  potato: { a: 0xe8d48a, b: 0xd8b858, n: 4 },
  baconenoki: { a: 0xc45a40, b: 0xe8d8a8, n: 5 },
  meat: { a: 0x8d3f28, b: 0x5c2a1a, n: 5 },
};

const meatCache = new Map();
function meatMat(color) {
  let m = meatCache.get(color);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.58 });
    meatCache.set(color, m);
  }
  return m;
}

const COOK_RATE = {
  chicken: 0.048,
  'beef-big': 0.028,
  beef: 0.034,
  lamb: 0.034,
  'lamb-rib': 0.028,
  fatty: 0.028,
  tendon: 0.028,
  shrimp: 0.050,
  liver: 0.034,
  intestine: 0.034,
  skin: 0.040,
  cartilage: 0.040,
  wing: 0.048,
  sausage: 0.040,
  mushroom: 0.050,
  baconenoki: 0.034,
  veg: 0.052,
  pepper: 0.052,
  bread: 0.042,
  tofu: 0.050,
  potato: 0.052,
  meat: 0.038,
};

function hexToRgb(hex) {
  const n = Number(hex);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function mixRgb(a, b, t) {
  const k = Math.min(1, Math.max(0, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * k),
    g: Math.round(a.g + (b.g - a.g) * k),
    b: Math.round(a.b + (b.b - a.b) * k),
  };
}

const COOK_BROWN = { r: 118, g: 64, b: 34 };
const COOK_DARK = { r: 42, g: 26, b: 16 };
const COOK_BLACK = { r: 16, g: 11, b: 8 };

function stageOf(d) {
  if (d < 0.18) return 'raw';
  if (d < 0.30) return 'tint';
  if (d < 0.58) return 'perfect';
  if (d < 0.80) return 'savory';
  if (d < 0.88) return 'over';
  return 'burnt';
}

function skewerGrade(s) {
  const a = s.userData.doneness[0];
  const b = s.userData.doneness[1];
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  if (hi >= 0.88) return 'burnt';
  if (lo >= 0.30 && hi < 0.80) return 'perfect';
  if (lo >= 0.30 && hi < 0.88) return 'over';
  if (hi >= 0.30 && lo < 0.30) return 'uneven';
  if (hi >= 0.18) return 'tint';
  return 'raw';
}

function downIndex(s) {
  const turns = Math.round((s.rotation.x || 0) / Math.PI);
  return ((turns % 2) + 2) % 2;
}

function cookColor(baseHex, stage) {
  const c = hexToRgb(baseHex);
  if (stage === 'raw') return mixRgb(c, { r: 232, g: 190, b: 168 }, 0.12);
  if (stage === 'tint') return mixRgb(c, COOK_BROWN, 0.34);
  if (stage === 'perfect') return mixRgb(c, COOK_BROWN, 0.60);
  if (stage === 'savory') return mixRgb(mixRgb(c, COOK_BROWN, 0.72), COOK_DARK, 0.22);
  if (stage === 'over') return mixRgb(COOK_BROWN, COOK_DARK, 0.58);
  return mixRgb(COOK_DARK, COOK_BLACK, 0.62);
}

const faceTexCache = new Map();
function getFaceTex(style, tone, stage, seed) {
  const key = `${style}|${tone}|${stage}|${seed}`;
  let tex = faceTexCache.get(key);
  if (tex) return tex;
  const st = SKEWER_STYLE[style] || SKEWER_STYLE.meat;
  const base = tone === 'b' ? st.b : st.a;
  const rgb = cookColor(base, stage);
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
  ctx.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y++) {
    const v = (Math.sin(y * 0.45 + seed * 1.7) * 0.5 + 0.5) * 0.10;
    ctx.fillStyle = `rgba(20,10,6,${v})`;
    ctx.fillRect(0, y, 64, 1);
  }
  const stripe = { raw: 0, tint: 0.14, perfect: 0.30, savory: 0.42, over: 0.58, burnt: 0.78 }[stage] || 0;
  if (stripe > 0) {
    for (let i = 0; i < 4; i++) {
      const x = 8 + i * 14 + (seed % 3);
      ctx.fillStyle = `rgba(18,10,6,${stripe})`;
      ctx.fillRect(x, 0, stage === 'burnt' ? 5 : 3, 64);
      if (stage === 'burnt' || stage === 'over') {
        ctx.fillStyle = `rgba(8,6,4,${stripe * 0.7})`;
        ctx.fillRect(x - 1, 0, 1, 64);
      }
    }
  }
  if (stage === 'savory' || stage === 'over' || stage === 'burnt') {
    const n = stage === 'burnt' ? 70 : stage === 'over' ? 36 : 16;
    for (let i = 0; i < n; i++) {
      const x = (seed * 17 + i * 31) % 64;
      const y = (seed * 13 + i * 47) % 64;
      const r = stage === 'burnt' ? 1.4 + (i % 4) : 1 + (i % 2) * 0.8;
      ctx.fillStyle = `rgba(8,6,4,${stage === 'burnt' ? 0.78 : 0.48})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (stage === 'burnt') {
    ctx.fillStyle = 'rgba(8,6,4,0.62)';
    ctx.fillRect(0, 0, 64, 7);
    ctx.fillRect(0, 57, 64, 7);
    ctx.fillRect(0, 0, 7, 64);
    ctx.fillRect(57, 0, 7, 64);
    ctx.fillStyle = 'rgba(12,8,6,0.35)';
    ctx.fillRect(0, 0, 64, 64);
  }
  if (stage === 'perfect' || stage === 'savory') {
    ctx.fillStyle = 'rgba(255,210,130,0.08)';
    ctx.fillRect(0, 0, 64, 64);
  }
  tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = Math.min(4, aniso);
  faceTexCache.set(key, tex);
  return tex;
}

function cookRoughness(stage) {
  if (stage === 'raw') return 0.72;
  if (stage === 'tint') return 0.6;
  if (stage === 'perfect') return 0.48;
  if (stage === 'savory') return 0.5;
  if (stage === 'over') return 0.7;
  return 0.88;
}

function applyCookVisual(s, force = false) {
  const d = s.userData.doneness;
  if (!d) return;
  const key = `${stageOf(d[0])}|${stageOf(d[1])}`;
  if (!force && s.userData.visualKey === key) return;
  s.userData.visualKey = key;
  const style = s.userData.style || 'meat';
  const seed = s.userData.cookSeed || 0;
  const stage0 = stageOf(d[0]);
  const stage1 = stageOf(d[1]);
  const up = 1 - downIndex(s);
  const upStage = stageOf(d[up]);
  for (const piece of (s.userData.pieces || [])) {
    if (piece.kind === 'faces') {
      piece.mat0.map = getFaceTex(style, piece.tone, stage0, seed);
      piece.mat1.map = getFaceTex(style, piece.tone, stage1, seed + 1);
      piece.mat0.roughness = cookRoughness(stage0);
      piece.mat1.roughness = cookRoughness(stage1);
      const rimStage = d[0] > d[1] ? stage0 : stage1;
      piece.rim.map = getFaceTex(style, piece.tone, rimStage, seed + 2);
      piece.rim.color.set(rimStage === 'burnt' ? 0x1a120c : 0xffffff);
      piece.rim.roughness = cookRoughness(rimStage);
      piece.mat0.needsUpdate = true;
      piece.mat1.needsUpdate = true;
      piece.rim.needsUpdate = true;
    } else if (piece.kind === 'up') {
      piece.mat.map = getFaceTex(style, piece.tone, upStage, seed);
      piece.mat.color.set(upStage === 'burnt' ? 0x2a1a12 : 0xffffff);
      piece.mat.roughness = cookRoughness(upStage);
      piece.mat.needsUpdate = true;
    }
  }
}

function makeFaceMats(style, tone, seed) {
  const mk = () => new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.58,
    metalness: 0.02,
    map: getFaceTex(style, tone, 'raw', seed),
  });
  const mat0 = mk();
  const mat1 = mk();
  const rim = mk();
  return { mat0, mat1, rim };
}

function makeSkewer(styleName = 'meat', cooked = true) {
  const st = SKEWER_STYLE[styleName] || SKEWER_STYLE.meat;
  const g = new THREE.Group();
  const stick = cyl(0.012, 0.62, mats.woodLight, 0, 0, 0, g, 6);
  stick.rotation.z = Math.PI / 2;
  stick.castShadow = false;
  const n = st.n || 5;
  const scale = (st.scale || 1) * (cooked ? 1 : 0.98);
  const seed = Math.floor(Math.random() * 8);
  const pieces = [];
  const addFacedCube = (w, h, d, x, y, z, tone) => {
    const { mat0, mat1, rim } = makeFaceMats(styleName, tone, seed);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [rim, rim, mat1, mat0, rim, rim]);
    mesh.position.set(x, y, z);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    g.add(mesh);
    pieces.push({ kind: 'faces', mesh, mat0, mat1, rim, tone });
    return mesh;
  };
  const addUpMesh = (mesh, tone) => {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.58,
      map: getFaceTex(styleName, tone, cooked ? 'perfect' : 'raw', seed),
    });
    mesh.material = mat;
    mesh.castShadow = false;
    pieces.push({ kind: 'up', mesh, mat, tone });
    return mesh;
  };
  if (st.shape === 'sausage') {
    const s = cyl(0.035 * scale, 0.28, mats.woodLight, 0, 0.01, 0, g, 10);
    s.rotation.z = Math.PI / 2;
    addUpMesh(s, 'a');
  } else if (st.shape === 'shrimp') {
    for (let i = 0; i < 2; i++) {
      const sh = sph(0.04 * scale, mats.woodLight, -0.06 + i * 0.12, 0.02, 0, g, 8);
      sh.scale.set(1.3, 0.7, 0.8);
      addUpMesh(sh, i ? 'b' : 'a');
    }
  } else {
    for (let i = 0; i < n; i++) {
      const cube = addFacedCube(
        0.07 * scale,
        0.055 * scale,
        0.055 * scale,
        -0.16 + i * (0.32 / Math.max(n - 1, 1)),
        0.01,
        0,
        i % 2 ? 'b' : 'a'
      );
      cube.rotation.y = 0.2;
    }
  }
  let doneness;
  if (cooked) {
    const mid = 0.36 + Math.random() * 0.26;
    doneness = [
      THREE.MathUtils.clamp(mid + (Math.random() - 0.5) * 0.14, 0.18, 0.72),
      THREE.MathUtils.clamp(mid + (Math.random() - 0.5) * 0.16, 0.16, 0.70),
    ];
    if (Math.random() < 0.42) g.rotation.x = Math.PI;
  } else {
    doneness = [0.02 + Math.random() * 0.05, 0.02 + Math.random() * 0.04];
  }
  g.userData.flipping = false;
  g.userData.style = styleName;
  g.userData.doneness = doneness;
  g.userData.cookRate = COOK_RATE[styleName] || COOK_RATE.meat;
  g.userData.cookSeed = seed;
  g.userData.pieces = pieces;
  g.userData.owner = cooked ? 'npc' : 'player';
  g.userData.needFlipHinted = false;
  g.userData.announcedPerfect = false;
  g.userData.announcedBurnt = false;
  g.userData.perfectAt = 0;
  applyCookVisual(g, true);
  return g;
}

function layoutSkewers(grill) {
  const list = grill.userData.skewers;
  const pitL = grill.userData.pitL || 0.7;
  const y = grill.userData.skewerY || 0.19;
  const n = list.length;
  list.forEach((s, i) => {
    const row = Math.floor(i / 10);
    const col = i % 10;
    const countInRow = Math.min(10, n - row * 10);
    const span = pitL * 0.78;
    const z = countInRow <= 1 ? 0 : -span / 2 + col * (span / Math.max(countInRow - 1, 1));
    const x = n <= 10 ? 0 : (row - 0.35) * 0.1;
    s.position.set(x, y, z);
    if (!s.userData.flipping) {
      const turns = Math.round((s.rotation.x || 0) / Math.PI);
      s.rotation.x = (((turns % 2) + 2) % 2) * Math.PI;
    }
  });
}


function makePit() {
  const g = new THREE.Group();
  const pw = 0.36, pl = 0.7, pd = 0.16, t = 0.018;
  box(pw, t, pl, mats.steel, 0, t / 2, 0, g);
  box(t, pd, pl, mats.steel, -pw / 2 + t / 2, pd / 2, 0, g);
  box(t, pd, pl, mats.steel, pw / 2 - t / 2, pd / 2, 0, g);
  box(pw, pd, t, mats.steel, 0, pd / 2, -pl / 2 + t / 2, g);
  box(pw, pd, t, mats.steel, 0, pd / 2, pl / 2 - t / 2, g);
  box(pw + 0.08, 0.012, 0.04, mats.steel, 0, pd + 0.002, pl / 2 + 0.02, g, false);
  box(pw + 0.08, 0.012, 0.04, mats.steel, 0, pd + 0.002, -pl / 2 - 0.02, g, false);
  box(0.04, 0.012, pl, mats.steel, pw / 2 + 0.02, pd + 0.002, 0, g, false);
  box(0.04, 0.012, pl, mats.steel, -pw / 2 - 0.02, pd + 0.002, 0, g, false);
  for (let i = 0; i < 16; i++) {
    const zx = (Math.random() - 0.5) * (pw - 0.1);
    const zz = (Math.random() - 0.5) * (pl - 0.1);
    sph(0.032 + Math.random() * 0.02, mats.coal, zx, 0.05, zz, g, 8);
  }
  for (let i = 0; i < 8; i++) {
    const z = -pl / 2 + 0.08 + i * ((pl - 0.16) / 7);
    box(pw - 0.05, 0.008, 0.01, mats.grate, 0, pd - 0.02, z, g, false);
  }
  const light = new THREE.PointLight(0xff6a22, 0.5, 2.7);
  light.position.set(0, pd + 0.12, 0);
  g.add(light);
  grillLights.push(light);
  g.userData.skewers = [];
  g.userData.pitW = pw;
  g.userData.pitL = pl;
  g.userData.skewerY = pd + 0.03;
  g.userData.fanHeat = 0;
  return g;
}

function makeChair() {
  const g = new THREE.Group();
  const wood = mats.chairWood;
  const weave = mats.weave;
  const legH = 0.44, legT = 0.045;
  const seatW = 0.44, seatD = 0.4;
  const lx = seatW / 2 - 0.02, lz = seatD / 2 - 0.02;
  for (const [x, z] of [[lx, lz], [lx, -lz], [-lx, lz], [-lx, -lz]]) {
    box(legT, legH, legT, wood, x, legH / 2, z, g);
  }
  box(seatW - 0.04, 0.025, 0.03, wood, 0, 0.12, lz, g);
  box(seatW - 0.04, 0.025, 0.03, wood, 0, 0.12, -lz, g);
  box(0.03, 0.025, seatD - 0.04, wood, lx, 0.12, 0, g);
  box(0.03, 0.025, seatD - 0.04, wood, -lx, 0.12, 0, g);
  box(seatW, 0.04, seatD, wood, 0, 0.45, 0, g);
  box(seatW - 0.04, 0.02, seatD - 0.04, weave, 0, 0.475, 0, g);
  box(legT, 0.52, legT, wood, lx, 0.7, -lz, g);
  box(legT, 0.52, legT, wood, -lx, 0.7, -lz, g);
  box(seatW + 0.02, 0.05, 0.05, wood, 0, 0.96, -lz, g);
  box(seatW - 0.04, 0.035, 0.04, wood, 0, 0.72, -lz, g);
  box(seatW - 0.08, 0.2, 0.018, weave, 0, 0.84, -lz + 0.01, g);
  for (const x of [-0.12, 0, 0.12]) box(0.03, 0.22, 0.02, wood, x, 0.58, -lz, g);
  for (const x of [-lx, lx]) {
    box(0.045, 0.035, seatD + 0.02, wood, x, 0.68, -0.01, g);
    box(0.04, 0.22, 0.04, wood, x, 0.56, lz - 0.02, g);
  }
  return g;
}

function makeRack() {
  const g = new THREE.Group();
  for (const x of [-0.16, 0.16]) {
    box(0.01, 0.22, 0.01, mats.steel, x, 0.11, -0.06, g, false);
    box(0.01, 0.22, 0.01, mats.steel, x, 0.11, 0.06, g, false);
  }
  box(0.34, 0.01, 0.01, mats.steel, 0, 0.22, -0.06, g, false);
  box(0.34, 0.01, 0.01, mats.steel, 0, 0.22, 0.06, g, false);
  box(0.34, 0.01, 0.16, mats.steel, 0, 0.02, 0, g, false);
  const jars = [mats.spiceA, mats.spiceB, mats.spiceC, mats.spiceD];
  for (let i = 0; i < 4; i++) {
    const x = -0.12 + i * 0.08;
    cyl(0.028, 0.08, jars[i], x, 0.07, 0, g, 10).castShadow = false;
    cyl(0.03, 0.015, mats.steel, x, 0.115, 0, g, 10).castShadow = false;
  }
  return g;
}

function makeTableItem(kind) {
  const g = new THREE.Group();
  const addBowl = (r = 0.09, h = 0.045) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.78, h, 14), mats.bowl);
    b.position.y = h / 2;
    b.castShadow = true;
    g.add(b);
    return b;
  };
  const addPlate = (r = 0.11) => cyl(r, 0.015, mats.plate, 0, 0.01, 0, g, 16);
  if (kind === 'plate-mix') {
    addPlate(0.12);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const col = [0x5a8a3a, 0x8a5a3a, 0xd8c8a0, 0x4a3a28][i % 4];
      box(0.035, 0.015, 0.02, meatMat(col), Math.cos(a) * 0.05, 0.025, Math.sin(a) * 0.05, g, false);
    }
  } else if (kind === 'bowl-clam') {
    addBowl(0.1, 0.05);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      sph(0.022, meatMat(0xc4b090), Math.cos(a) * 0.04, 0.05, Math.sin(a) * 0.04, g, 8).castShadow = false;
    }
  } else if (kind === 'bowl-edamame') {
    addBowl();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      sph(0.016, meatMat(i % 2 ? 0xd8b878 : 0x5a8a3a), Math.cos(a) * 0.04, 0.05, Math.sin(a) * 0.04, g, 8).castShadow = false;
    }
  } else if (kind === 'plate-cuke') {
    addPlate();
    for (let i = 0; i < 5; i++) box(0.07, 0.012, 0.022, meatMat(0x5a8a3a), (i - 2) * 0.025, 0.022, 0, g, false);
  } else if (kind === 'bowl-noodle' || kind === 'pot-ramen' || kind === 'pot-wonton') {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.08, 16), kind === 'pot-ramen' ? meatMat(0xc4a050) : mats.bowl);
    pot.position.y = 0.04;
    pot.castShadow = true;
    g.add(pot);
    for (let i = 0; i < 6; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 10), meatMat(0xd8c090));
      ring.position.set((Math.random() - 0.5) * 0.04, 0.08, (Math.random() - 0.5) * 0.04);
      ring.rotation.set(Math.random(), Math.random(), Math.random());
      ring.castShadow = false;
      g.add(ring);
    }
  } else if (kind === 'bowl-tofu') {
    addBowl();
    for (let i = 0; i < 4; i++) box(0.03, 0.025, 0.03, meatMat(0xf2eee0), (i % 2 ? 0.02 : -0.02), 0.055, (i < 2 ? 0.02 : -0.02), g, false);
  } else if (kind === 'bing') {
    cyl(0.08, 0.02, meatMat(0xe0b060), 0, 0.015, 0, g, 16).castShadow = false;
  } else if (kind === 'mug-beer' || kind === 'mug-fresh') {
    cyl(0.045, 0.11, mats.mug, 0, 0.055, 0, g, 12);
    cyl(0.035, 0.08, mats.beer, 0, 0.06, 0, g, 12).castShadow = false;
    box(0.02, 0.05, 0.04, mats.mug, 0.055, 0.055, 0, g, false);
  } else if (kind === 'pitcher-beer' || kind === 'pitcher-fresh' || kind === 'pitcher-tea') {
    cyl(0.06, 0.16, kind === 'pitcher-tea' ? meatMat(0xe8d48a) : mats.mug, 0, 0.08, 0, g, 14);
    cyl(0.05, 0.12, kind === 'pitcher-tea' ? meatMat(0xd8c050) : mats.beer, 0, 0.08, 0, g, 14).castShadow = false;
    box(0.02, 0.07, 0.05, mats.mug, 0.07, 0.08, 0, g, false);
  } else if (kind === 'bottle-green' || kind === 'bottle-u8') {
    cyl(0.03, 0.18, mats.bottleG, 0, 0.09, 0, g, 10);
    cyl(0.016, 0.06, mats.bottleG, 0, 0.2, 0, g, 8);
  } else if (kind === 'bottle-amber') {
    cyl(0.03, 0.18, mats.bottleA, 0, 0.09, 0, g, 10);
    cyl(0.016, 0.06, mats.bottleA, 0, 0.2, 0, g, 8);
  } else if (kind === 'bottle-orange') {
    cyl(0.03, 0.18, mats.bottleO, 0, 0.09, 0, g, 10);
    cyl(0.016, 0.06, mats.bottleO, 0, 0.2, 0, g, 8);
  } else if (kind === 'bottle-pink') {
    cyl(0.03, 0.18, mats.bottleP, 0, 0.09, 0, g, 10);
    cyl(0.016, 0.06, mats.bottleP, 0, 0.2, 0, g, 8);
  } else if (kind === 'bottle-water') {
    cyl(0.03, 0.16, mats.water, 0, 0.08, 0, g, 10);
    cyl(0.016, 0.05, mats.water, 0, 0.18, 0, g, 8);
  } else if (kind === 'can-red' || kind === 'can-green') {
    cyl(0.03, 0.1, kind === 'can-red' ? mats.canRed : mats.canGreen, 0, 0.05, 0, g, 12);
  } else {
    addBowl();
  }
  return g;
}

function nextDishSlot(table) {
  const used = table.userData.dishCount || 0;
  table.userData.dishCount = used + 1;
  const slots = table.userData.dishSlots;
  const slot = slots[used % slots.length].clone();
  const lap = Math.floor(used / slots.length);
  slot.x += lap * 0.03;
  slot.y += lap * 0.02;
  return slot;
}

function createTable(x, z, opts = {}) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);

  const tw = 1.1, tl = 2.16, th = 0.075;
  const pitOff = 0.12;
  const pitCutW = 0.44, pitCutL = 0.78;
  const topY = 0.722;
  const frontL = tl / 2 - (pitOff + pitCutL / 2);
  const backL = tl / 2 + pitOff - pitCutL / 2;
  // -Z strip (drawer end, longer), +Z strip (rack end)
  box(tw, th, backL, mats.woodTop, 0, topY, -tl / 2 + backL / 2, group);
  box(tw, th, frontL, mats.woodTop, 0, topY, tl / 2 - frontL / 2, group);
  box((tw - pitCutW) / 2, th, pitCutL, mats.woodTop, (tw + pitCutW) / 4, topY, pitOff, group);
  box((tw - pitCutW) / 2, th, pitCutL, mats.woodTop, -(tw + pitCutW) / 4, topY, pitOff, group);

  const legPos = [[0.46, 0.92], [0.46, -0.92], [-0.46, 0.92], [-0.46, -0.92]];
  for (const [lx, lz] of legPos) box(0.09, 0.7, 0.09, mats.wood, lx, 0.35, lz, group);

  // drawer unit at -Z end
  const dw = 0.72, dd = 0.32, dh = 0.34;
  box(dw, dh, dd, mats.woodLight, 0, 0.34, -tl / 2 + dd / 2 - 0.02, group);
  box(dw - 0.06, 0.13, 0.02, mats.woodLight, 0, 0.42, -tl / 2 - 0.01, group, false);
  box(dw - 0.06, 0.13, 0.02, mats.woodLight, 0, 0.26, -tl / 2 - 0.01, group, false);
  box(0.08, 0.015, 0.02, mats.steelDark, 0, 0.42, -tl / 2 - 0.03, group, false);
  box(0.08, 0.015, 0.02, mats.steelDark, 0, 0.26, -tl / 2 - 0.03, group, false);
  const badge = makeBadge(opts.number || 21);
  badge.position.set(0, 0.55, -tl / 2 - 0.02);
  badge.rotation.y = Math.PI;
  group.add(badge);

  const grill = makePit();
  grill.position.set(0, 0.76 - 0.16, pitOff);
  group.add(grill);

  const startN = opts.skewers ?? 0;
  const styles = opts.styles || ['lamb', 'beef', 'chicken', 'fatty', 'veg'];
  for (let i = 0; i < startN; i++) {
    const s = makeSkewer(styles[i % styles.length], true);
    grill.add(s);
    grill.userData.skewers.push(s);
  }
  layoutSkewers(grill);

  const rack = makeRack();
  rack.position.set(0, 0.76, 0.88);
  group.add(rack);
  box(0.12, 0.07, 0.08, mats.tissue, 0.28, 0.8, 0.88, group, false);

  const cupA = cyl(0.05, 0.1, mats.mug, -0.38, 0.83, -0.7, group, 10);
  cyl(0.04, 0.07, mats.beer, -0.38, 0.85, -0.7, group, 10).castShadow = false;
  const cupB = cyl(0.05, 0.1, mats.mug, 0.38, 0.83, -0.7, group, 10);
  cupA.userData.kind = 'cup';
  cupB.userData.kind = 'cup';

  const seatDefs = [
    { x: -0.8, z: -0.5, rot: Math.PI / 2 },
    { x: -0.8, z: 0.5, rot: Math.PI / 2 },
    { x: 0.8, z: -0.5, rot: -Math.PI / 2 },
    { x: 0.8, z: 0.5, rot: -Math.PI / 2 },
  ];
  const tableSeats = [];
  for (const s of seatDefs) {
    const chair = makeChair();
    chair.position.set(s.x, 0, s.z);
    chair.rotation.y = s.rot;
    group.add(chair);
    const seat = {
      table: group,
      grill,
      world: new THREE.Vector3(x + s.x, 0, z + s.z),
      sitPos: new THREE.Vector3(x + s.x * 0.72, 0, z + s.z * 0.72),
      rot: s.rot,
      occupied: false,
      mesh: chair,
    };
    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.5, 0.46),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.set(s.x, 0.5, s.z);
    hit.userData.kind = 'seat';
    hit.userData.seat = seat;
    group.add(hit);
    interactives.push(hit);
    tableSeats.push(seat);
    seats.push(seat);
  }

  group.userData = {
    grill,
    seats: tableSeats,
    cups: [cupA, cupB],
    x,
    z,
    dishCount: 0,
    dishSlots: [
      new THREE.Vector3(-0.38, 0.78, -0.55),
      new THREE.Vector3(0.38, 0.78, -0.55),
      new THREE.Vector3(-0.38, 0.78, 0.5),
      new THREE.Vector3(0.38, 0.78, 0.5),
      new THREE.Vector3(-0.38, 0.78, -0.2),
      new THREE.Vector3(0.38, 0.78, -0.2),
      new THREE.Vector3(-0.38, 0.78, 0.22),
      new THREE.Vector3(0.38, 0.78, 0.22),
    ],
  };
  tables.push(group);
  return group;
}

function makePerson(opts = {}) {
  const g = new THREE.Group();
  const skin = opts.skin || mats.skin;
  const shirt = opts.shirt || new THREE.MeshStandardMaterial({ color: opts.shirtColor || 0x3d5a4c, roughness: 0.8 });
  const pants = opts.pants || new THREE.MeshStandardMaterial({ color: opts.pantsColor || 0x3a322e, roughness: 0.85 });
  const fat = opts.fat || 1;
  const hs = opts.headScale || 1.1;

  const lleg = cyl(0.052, 0.36, pants, -0.09 * fat, 0.3, 0, g, 10);
  const rleg = cyl(0.052, 0.36, pants, 0.09 * fat, 0.3, 0, g, 10);
  const footL = sph(0.055, mats.black, -0.09 * fat, 0.07, 0.03, g, 10);
  footL.scale.set(1, 0.55, 1.25);
  const footR = sph(0.055, mats.black, 0.09 * fat, 0.07, 0.03, g, 10);
  footR.scale.set(1, 0.55, 1.25);

  const hips = sph(0.15 * fat, pants, 0, 0.56, 0, g, 14);
  hips.scale.set(1.05, 0.68, 0.86);

  const torso = sph(0.19 * fat, shirt, 0, 0.9, 0, g, 16);
  torso.scale.set(1.02, 1.12, 0.78);

  sph(0.065 * fat, shirt, -0.175 * fat, 1.05, 0, g, 10);
  sph(0.065 * fat, shirt, 0.175 * fat, 1.05, 0, g, 10);

  const larm = cyl(0.042, 0.33, shirt, -0.25 * fat, 0.85, 0, g, 8);
  const rarm = cyl(0.042, 0.33, shirt, 0.25 * fat, 0.85, 0, g, 8);
  larm.rotation.z = 0.16;
  rarm.rotation.z = -0.16;
  sph(0.046, skin, -0.31 * fat, 0.68, 0.02, g, 10);
  sph(0.046, skin, 0.31 * fat, 0.68, 0.02, g, 10);

  cyl(0.04, 0.07, skin, 0, 1.12, 0, g, 10);
  const head = sph(0.17 * hs, skin, 0, 1.32, 0, g, 16);
  sph(0.032, skin, -0.155 * hs, 1.31, 0, g, 8);
  sph(0.032, skin, 0.155 * hs, 1.31, 0, g, 8);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.175 * hs, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), mats.hair);
  hair.position.set(0, 1.36, -0.01);
  hair.castShadow = true;
  g.add(hair);

  const el = sph(0.02, mats.black, -0.05 * hs, 1.33, 0.15 * hs, g, 8);
  const er = sph(0.02, mats.black, 0.05 * hs, 1.33, 0.15 * hs, g, 8);
  el.castShadow = er.castShadow = false;

  if (opts.glasses) {
    const ringL = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.009, 8, 18), mats.black);
    const ringR = ringL.clone();
    ringL.position.set(-0.055, 1.33, 0.14);
    ringR.position.set(0.055, 1.33, 0.14);
    g.add(ringL, ringR);
    box(0.04, 0.01, 0.01, mats.black, 0, 1.33, 0.14, g, false);
  }

  if (opts.apron) {
    box(0.3 * fat, 0.46, 0.05, mats.apron, 0, 0.84, 0.13 * fat, g);
    box(0.035, 0.3, 0.02, mats.apron, -0.11, 1.06, 0.02, g, false);
    box(0.035, 0.3, 0.02, mats.apron, 0.11, 1.06, 0.02, g, false);
  }

  const role = opts.kind || 'npc';
  g.userData = {
    lleg, rleg, larm, rarm, torso, head,
    phase: Math.random() * Math.PI * 2,
    kind: role === 'player' ? 'player' : 'person',
    role,
    who: g,
  };
  g.scale.setScalar(opts.scale || 1);
  if (role !== 'player') interactives.push(g);
  return g;
}

function sitCharacter(person, seat) {
  person.position.copy(seat.sitPos);
  person.position.y = 0.18;
  person.rotation.y = seat.rot;
  person.userData.lleg.rotation.x = -1.15;
  person.userData.rleg.rotation.x = -1.15;
  person.userData.lleg.position.y = 0.42;
  person.userData.rleg.position.y = 0.42;
  seat.occupied = true;
  seat.who = person;
}

function layoutTables() {
  const coords = [
    [-3.55, 3.35], [-3.55, 0.05], [-3.55, -3.25],
    [3.55, 3.35], [3.55, 0.05], [3.55, -3.25],
  ];
  coords.forEach(([tx, tz], i) => {
    const n = i === 1 ? 0 : 4 + (i % 3);
    createTable(tx, tz, { number: 21 + i, skewers: n });
  });
}

function buildPeople() {
  player = makePerson({ shirtColor: 0x4a6748, pantsColor: 0x2e2a28, kind: 'player' });
  player.position.set(0.55, 0, 5.05);
  player.rotation.y = Math.PI + 0.22;
  scene.add(player);

  atanHome = new THREE.Vector3(6.2, 0, -3.2);
  atan = makePerson({
    fat: 1.28,
    headScale: 1.08,
    shirt: mats.rust,
    pantsColor: 0x3a322e,
    glasses: true,
    apron: true,
    kind: 'atan',
    scale: 0.98,
  });
  atan.position.copy(atanHome);
  atan.rotation.y = -Math.PI / 2;
  scene.add(atan);

  const palettes = [
    { shirtColor: 0x6a4a3a, pantsColor: 0x2c2a28 },
    { shirtColor: 0xd8c4a8, pantsColor: 0x4a4038 },
    { shirtColor: 0x3f5c6e, pantsColor: 0x2a2a2a },
    { shirtColor: 0x8a4a44, pantsColor: 0x35302c },
    { shirtColor: 0x4f5a38, pantsColor: 0x2c2824 },
    { shirtColor: 0xc4b49a, pantsColor: 0x3a342e },
    { shirtColor: 0x3d5a4c, pantsColor: 0x2e2a28 },
  ];
  // leave table 1 (left mid) empty for the player; sit guests at the others
  const used = [
    [0, 0], [0, 2],
    [2, 1],
    [3, 0],
    [4, 0], [4, 3],
    [5, 2],
  ];
  used.forEach((pair, i) => {
    const table = tables[pair[0]];
    if (!table) return;
    const seat = table.userData.seats[pair[1]];
    const p = makePerson(palettes[i % palettes.length]);
    scene.add(p);
    sitCharacter(p, seat);
    npcs.push(p);
  });


  // a couple of starter dishes on occupied tables
  for (const idx of [0, 4]) {
    const t = tables[idx];
    if (!t) continue;
    const dish = makeTableItem('plate-cuke');
    dish.position.copy(nextDishSlot(t));
    t.add(dish);
  }
}


buildHall();
buildCounter();
layoutTables();
buildPeople();

const plaqueTex = document.createElement('canvas');
plaqueTex.width = 1024;
plaqueTex.height = 256;
{
  const ctx = plaqueTex.getContext('2d');
  ctx.fillStyle = '#efe4d4';
  ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = '#c9b8a0';
  ctx.lineWidth = 10;
  ctx.strokeRect(16, 16, 992, 224);
  ctx.fillStyle = '#4a3c30';
  ctx.font = '64px "Noto Sans CJK SC","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('大直沽 · 江都路，有空来吃就行', 512, 128);
}
const plaqueMat = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(plaqueTex), roughness: 0.85 });
plaqueMat.map.colorSpace = THREE.SRGBColorSpace;
plaque = box(2.6, 0.55, 0.04, plaqueMat, -6.8, 1.65, -ROOM.hz + 0.14, scene, false);
plaque.visible = false;
plaque.userData.kind = 'plaque';
interactives.push(plaque);

function showHint(text, persist = false, ms = 3200) {
  hintEl.textContent = text;
  hintEl.classList.add('show');
  if (!persist) {
    clearTimeout(showHint._t);
    showHint._t = setTimeout(() => hintEl.classList.remove('show'), ms);
  }
}
function hideHint() { hintEl.classList.remove('show'); }

function setSeated(on, seat) {
  state.seated = on;
  state.sittingAt = on ? seat : null;
  actionsEl.classList.toggle('show', on && !state.menuOpen);
  if (on) {
    state.seatedOnce = true;
    sitCharacter(player, seat);
    showHint('滑动翻串，也可以点餐', false);
    if (!state.exitScheduled) {
      state.exitScheduled = true;
      setTimeout(() => {
        state.exitShown = true;
        plaque.visible = true;
        exitEl.classList.add('show');
      }, 8000);
    }
  } else {
    player.position.y = 0;
    player.userData.lleg.rotation.x = 0;
    player.userData.rleg.rotation.x = 0;
    player.userData.lleg.position.y = 0.3;
    player.userData.rleg.position.y = 0.3;
    if (seat) {
      seat.occupied = false;
      seat.who = null;
    }
    closeMenu();
    showHint('点地面走过去', true);
  }
}

function scheduleExitFallback() {
  setTimeout(() => {
    if (state.exitShown) return;
    state.exitShown = true;
    state.exitScheduled = true;
    plaque.visible = true;
    exitEl.classList.add('show');
  }, 22000);
}

// ——— menu ———
function renderTabs() {
  tabsEl.innerHTML = '';
  for (const cat of CATS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = cat;
    if (cat === state.menuCat) b.className = 'active';
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      state.menuCat = cat;
      renderTabs();
      renderList();
    });
    tabsEl.appendChild(b);
  }
}

function renderList() {
  const st = listEl.scrollTop;
  listEl.innerHTML = '';
  MENU.filter((item) => item.cat === state.menuCat).forEach((item) => {
    const qty = cart.get(item.id) || 0;
    const row = document.createElement('div');
    row.className = 'menu-item';
    const rec = item.rec ? '<span class="rec">荐</span>' : '';
    row.innerHTML = `<div class="info"><div class="name">${item.name}${rec}</div><div class="price">${formatPrice(item.price, item.unit)}</div></div>`;
    const qtyBox = document.createElement('div');
    qtyBox.className = 'menu-qty';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.disabled = qty <= 0;
    const nEl = document.createElement('span');
    nEl.className = 'n';
    nEl.textContent = String(qty);
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    const bump = (d) => {
      const n = Math.max(0, Math.min(99, (cart.get(item.id) || 0) + d));
      if (n === 0) cart.delete(item.id);
      else cart.set(item.id, n);
      renderList();
      renderSum();
    };
    minus.addEventListener('click', (e) => { e.stopPropagation(); bump(-1); });
    plus.addEventListener('click', (e) => { e.stopPropagation(); bump(1); });
    qtyBox.append(minus, nEl, plus);
    row.appendChild(qtyBox);
    listEl.appendChild(row);
  });
  listEl.scrollTop = st;
}

function renderSum() {
  let n = 0, skew = 0, yuan = 0;
  for (const [id, qty] of cart) {
    const item = MENU_BY_ID[id];
    if (!item) continue;
    n += qty;
    yuan += item.price * qty;
    if (item.skewer) skew += qty;
  }
  const yuanStr = Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(1);
  if (n === 0) {
    sumEl.textContent = '还没点';
    okEl.disabled = true;
  } else {
    sumEl.innerHTML = `一共 <strong>${n}</strong> 样` + (skew ? `，串 <strong>${skew}</strong>` : '') + `<br>约 <strong>${yuanStr}</strong> 元`;
    okEl.disabled = false;
  }
}

function openMenu() {
  if (!state.seated) return;
  state.menuOpen = true;
  renderTabs();
  renderList();
  renderSum();
  menuEl.classList.add('show');
  menuEl.setAttribute('aria-hidden', 'false');
  actionsEl.classList.remove('show');
  hideHint();
}
function closeMenu() {
  state.menuOpen = false;
  menuEl.classList.remove('show');
  menuEl.setAttribute('aria-hidden', 'true');
  if (state.seated) actionsEl.classList.add('show');
}

function serveOrder(seat, lines) {
  const table = seat.table;
  const grill = seat.grill;
  for (const { item, qty } of lines) {
    for (let i = 0; i < qty; i++) {
      if (item.skewer) {
        const s = makeSkewer(item.style || 'meat', false);
        s.userData.owner = 'player';
        grill.add(s);
        grill.userData.skewers.push(s);
      } else {
        const d = makeTableItem(item.kind || 'bowl');
        d.position.copy(nextDishSlot(table));
        table.add(d);
      }
    }
  }
  layoutSkewers(grill);
}

okEl.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!state.seated) return;
  const lines = [];
  for (const [id, qty] of cart) {
    const item = MENU_BY_ID[id];
    if (item && qty > 0) lines.push({ item, qty });
  }
  if (!lines.length) return;
  const skewThis = lines.reduce((s, l) => s + (l.item.skewer ? l.qty : 0), 0);
  serveOrder(state.sittingAt, lines);
  state.sessionSkewers += skewThis;
  cart.clear();
  renderSum();
  closeMenu();
  if (skewThis && !state.cookTipShown) {
    state.cookTipShown = true;
    showHint('看着火，该翻就翻，扇一下火会旺一点。', false, 4200);
  } else {
    showHint(skewThis ? '串来了，慢慢烤' : '好，先放桌上', false);
  }
  if ((skewThis >= 10 || state.sessionSkewers > 15) && !state.managerWarned) {
    state.managerWarned = true;
    startManager(MANAGER_LINE);
  }
});
menuEl.querySelector('.menu-x').addEventListener('click', (e) => { e.stopPropagation(); closeMenu(); });
menuEl.addEventListener('click', (e) => e.stopPropagation());
menuEl.addEventListener('pointerdown', (e) => e.stopPropagation());

// ——— speech bubbles ———
function hideBubble(person) {
  for (let i = liveBubbles.length - 1; i >= 0; i--) {
    if (liveBubbles[i].who === person) {
      liveBubbles[i].el.remove();
      liveBubbles.splice(i, 1);
    }
  }
}

function say(person, text, dur = 2.6, asManager = false) {
  if (!person || !text) return;
  hideBubble(person);
  const el = document.createElement('div');
  el.className = 'speech' + (asManager ? ' manager' : '') + (person === player ? ' me' : '');
  el.textContent = text;
  bubblesEl.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  liveBubbles.push({ el, who: person, until: performance.now() + dur * 1000 });
}

function updateBubbles() {
  const now = performance.now();
  for (let i = liveBubbles.length - 1; i >= 0; i--) {
    const b = liveBubbles[i];
    if (now >= b.until) {
      b.el.remove();
      liveBubbles.splice(i, 1);
      continue;
    }
    const head = b.who.userData.head;
    if (!head) { b.el.style.display = 'none'; continue; }
    b.who.updateMatrixWorld(true);
    head.updateMatrixWorld(true);
    head.getWorldPosition(tmp);
    tmp2.copy(tmp).applyMatrix4(camera.matrixWorldInverse);
    // Small world lift, scaled by distance so foreground heads don't throw
    // the bubble far into the background.
    const dist = Math.max(0.4, Math.abs(tmp2.z));
    tmp.y += Math.min(0.2, 0.06 + 0.04 * dist);
    tmp.project(camera);
    let x = (tmp.x * 0.5 + 0.5) * innerWidth;
    let y = (-tmp.y * 0.5 + 0.5) * innerHeight;
    const talkReserve = (state.seated && !document.body.classList.contains('talking') ? 150 : 78)
      + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--talk-h')) || 58);
    const maxY = innerHeight - talkReserve;
    const isMe = b.who === player;
    if (!isMe && tmp2.z > -0.35) { b.el.style.display = 'none'; continue; }
    if (!isMe && (x < -80 || x > innerWidth + 80 || y < -220 || y > innerHeight + 40)) {
      b.el.style.display = 'none';
      continue;
    }
    b.el.style.display = 'block';
    b.el.style.left = `${x}px`;
    b.el.style.top = `${y}px`;
    const pad = 12;
    const rect = b.el.getBoundingClientRect();
    let dx = 0;
    let dy = 0;
    if (rect.left < pad) dx += pad - rect.left;
    if (rect.right > innerWidth - pad) dx += (innerWidth - pad) - rect.right;
    if (rect.top < 8) dy += 8 - rect.top;
    if (rect.bottom > maxY) dy += maxY - rect.bottom;
    if (dx || dy) {
      b.el.style.left = `${x + dx}px`;
      b.el.style.top = `${y + dy}px`;
    }
  }
}

let playerPending = null;
let playerChatLock = 0;
let lastReplyText = '';

function classifyTalk(raw) {
  const t = String(raw || '').replace(/\s+/g, '');
  const has = (...words) => words.some((w) => w && t.includes(w));
  if (has('外卖', '打包', '送到', '配送', '外带', '送餐', '带走')) return 'delivery';
  if (has('优惠', '券', '会员', '打折', '折扣', '满减', '储值', '团购', '促销')) return 'promo';
  if (has('地址', '在哪', '在哪儿', '怎么走', '哪家', '位置', '路怎么')) return 'addr';
  if (has('太多', '太大', '少点', '再加', '够不够', '点多', '会不会多', '少一些')) return 'amount';
  if (has('点餐', '菜单', '吃什么', '推荐', '有什么', '点什么', '吃点', '想吃', '特色', '招牌', '来份', '来串', '点个')) return 'order';
  if (MENU.some((item) => t.includes(item.name))) return 'order';
  if (has('超鲜羊肉', '牛上脑', '青花椒', '羔羊', '西冷', '油边', '松板', '黑虎虾', '羊排', '肥肠', '鸡翅', '柠檬茶')) return 'order';
  if (has('火候', '炭火', '炉子', '火大', '火小', '焦了') || t.includes('烤')) return 'fire';
  if (has('谢谢', '多谢', '辛苦')) return 'thanks';
  if (has('啤酒', '喝酒', '来一杯', '碰杯', '喝点')) return 'drink';
  if (has('好吃', '真香', '好香', '不错')) return 'tasty';
  if (has('你好', '老板', '店长', '您好', '在吗', '哈喽', '嗨', '早上好', '晚上好')) return 'hi';
  return 'other';
}

function mentionedDish(raw) {
  const t = String(raw || '');
  return MENU.find((item) => t.includes(item.name)) || null;
}

function pickReply(lines, avoid) {
  const pool = lines.length > 1 ? lines.filter((l) => l !== avoid) : lines.slice();
  return pool[Math.floor(Math.random() * pool.length)] || lines[0];
}

function composeReply(text, asManager) {
  const key = classifyTalk(text);
  const bank = asManager ? MANAGER_REPLIES : GUEST_REPLIES;
  const dish = mentionedDish(text);
  if (dish && key === 'order') {
    const named = asManager
      ? [`${dish.name}有，坐下点就行。`, `要${dish.name}的话，坐下点。`]
      : [`这${dish.name}挺香的。`, `${dish.name}不错，可以点。`];
    lastReplyText = pickReply(named, lastReplyText);
    return lastReplyText;
  }
  const lines = bank[key] || bank.other;
  lastReplyText = pickReply(lines, lastReplyText);
  return lastReplyText;
}

function findChatPartner() {
  let bestGuest = null;
  let bestD = Infinity;
  const here = player.position;
  for (const who of npcs) {
    const d = who.position.distanceTo(here);
    if (d < bestD) {
      bestD = d;
      bestGuest = who;
    }
  }
  const dMgr = atan.position.distanceTo(here);
  const GUEST_NEAR = 4.6;
  const MGR_NEAR = 5.2;
  if (bestGuest && bestD <= GUEST_NEAR) return bestGuest;
  if (dMgr <= MGR_NEAR || state.seated) return atan;
  if (dMgr <= 6.5 && !(bestGuest && bestD < dMgr)) return atan;
  return null;
}

function updateChat(dt) {
  if (playerChatLock > 0) playerChatLock -= dt;
  if (playerPending) {
    playerPending.t -= dt;
    if (playerPending.t <= 0) {
      const { who, text, asManager } = playerPending;
      playerPending = null;
      if (who) say(who, text, 3.0, !!asManager);
      playerChatLock = Math.max(playerChatLock, 2.8);
    }
  }
  if (playerChatLock <= 0 && !playerPending) state.playerChatting = false;
  if (shot || state.managerTalking || atanAnim || state.playerChatting || playerPending || playerChatLock > 0) return;
  if (pendingReply) {
    pendingReply.t -= dt;
    if (pendingReply.t <= 0) {
      const { who, text } = pendingReply;
      pendingReply = null;
      if (who && !state.managerTalking && !state.playerChatting) say(who, text, 2.5);
    }
    return;
  }
  chatWait -= dt;
  if (chatWait > 0 || liveBubbles.length) return;
  chatWait = 4.5 + Math.random() * 3.5;
  if (!npcs.length) return;
  const who = npcs[Math.floor(Math.random() * npcs.length)];
  const line = CHAT_LINES[Math.floor(Math.random() * CHAT_LINES.length)];
  say(who, line, 2.5);
  if (Math.random() < 0.55) {
    const seat = seats.find((s) => s.who === who);
    if (!seat) return;
    const neigh = seat.table.userData.seats.find((s) => s.who && s.who !== who && s.who !== player);
    if (!neigh) return;
    let reply = CHAT_LINES[Math.floor(Math.random() * CHAT_LINES.length)];
    if (reply === line) reply = '不够再加就行';
    pendingReply = { who: neigh.who, text: reply, t: 2.7 };
  }
}

function aislePath(from, to) {
  const points = [];
  const ax = 0.15;
  if (Math.abs(from.x - to.x) > 1.2 && Math.abs(from.x) > 1.0) {
    points.push(new THREE.Vector3(ax, 0, from.z));
  }
  if (Math.abs(from.z - to.z) > 0.35) {
    points.push(new THREE.Vector3(ax, 0, to.z));
  }
  points.push(to.clone());
  return points.filter((p) => p.distanceTo(from) > 0.15);
}

function startManager(line) {
  if (state.managerTalking || atanAnim) return;
  const dest = player.position.clone();
  const side = new THREE.Vector3(1.15, 0, 0.2).applyAxisAngle(Y_AXIS, player.rotation.y);
  dest.add(side);
  dest.y = 0;
  atanAnim = { phase: 'walkin', dest, path: null, i: 0, t: 0, line: line || MANAGER_LINE };
}

function updateAtan(dt) {
  if (!atanAnim) return;
  const a = atanAnim;
  if (a.phase === 'walkin' || a.phase === 'walkout') {
    if (!a.path) {
      a.path = aislePath(atan.position, a.phase === 'walkin' ? a.dest : atanHome);
      a.i = 0;
    }
    const target = a.path[Math.min(a.i, a.path.length - 1)];
    tmp.copy(target).sub(atan.position);
    tmp.y = 0;
    const d = tmp.length();
    if (d < 0.08) {
      a.i += 1;
      if (a.i >= a.path.length) {
        if (a.phase === 'walkin') {
          a.phase = 'talk';
          a.t = 0;
          a.path = null;
          state.managerTalking = true;
          say(atan, a.line || MANAGER_LINE, 3.4, true);
          const look = player.position.clone().sub(atan.position);
          atan.rotation.y = Math.atan2(look.x, look.z);
          atan.userData.lleg.rotation.x = 0;
          atan.userData.rleg.rotation.x = 0;
        } else {
          atanAnim = null;
          atan.position.copy(atanHome);
          atan.rotation.y = -Math.PI / 2;
          atan.userData.lleg.rotation.x = 0;
          atan.userData.rleg.rotation.x = 0;
        }
      }
      return;
    }
    tmp.normalize();
    atan.position.add(tmp.multiplyScalar(1.6 * dt));
    atan.rotation.y = Math.atan2(tmp.x, tmp.z);
    const ph = (performance.now() / 180) % (Math.PI * 2);
    atan.userData.lleg.rotation.x = Math.sin(ph) * 0.45;
    atan.userData.rleg.rotation.x = Math.cos(ph) * 0.45;
  } else if (a.phase === 'talk') {
    a.t += dt;
    atan.userData.lleg.rotation.x = 0;
    atan.userData.rleg.rotation.x = 0;
    if (a.t > 3.5) {
      state.managerTalking = false;
      a.phase = 'walkout';
      a.path = null;
    }
  }
}

// audio
const audio = {
  fire: new Audio('./assets/fire.mp3'),
  clink: new Audio('./assets/clink.mp3'),
  woosh: new Audio('./assets/woosh.mp3'),
  music: new Audio('./assets/music.mp3'),
};
audio.fire.loop = true;
audio.music.loop = true;
audio.fire.volume = 0.42;
audio.music.volume = 0.18;
audio.clink.volume = 0.55;
audio.woosh.volume = 0.4;

function applyMute() {
  const m = state.muted;
  audio.fire.muted = audio.clink.muted = audio.woosh.muted = audio.music.muted = m;
}

async function unlockAudio() {
  if (state.audioReady || state.muted) return;
  applyMute();
  try {
    const plays = [audio.fire.play()];
    if (audio.music) plays.push(audio.music.play());
    await Promise.allSettled(plays);
    state.audioReady = true;
  } catch (e) { /* blocked until next gesture */ }
}

muteEl.addEventListener('click', (e) => {
  e.stopPropagation();
  state.muted = !state.muted;
  muteEl.textContent = state.muted ? '×' : '♪';
  applyMute();
  if (!state.muted) {
    if (state.audioReady) {
      audio.fire.play().catch(() => {});
      audio.music.play().catch(() => {});
    } else {
      unlockAudio();
    }
  }
});

function playSfx(name) {
  if (state.muted) return;
  const a = audio[name].cloneNode();
  a.volume = audio[name].volume;
  a.play().catch(() => {});
}

function fanGrill(grill) {
  if (!grill) return;
  playSfx('woosh');
  grill.userData.fanHeat = 1;
  const light = grill.children.find((c) => c.isLight);
  if (light) {
    light.userData.boost = 1;
    light.userData.boostT = 0.6;
  }
}

function tableNeighbor(seat) {
  if (!seat) return null;
  const same = seat.table.userData.seats.find((s) => s.who && s.who !== player);
  if (same) return same.who;
  let best = null;
  let bestD = 4.8;
  const here = (seat.sitPos || player.position);
  for (const who of npcs) {
    if (who === player) continue;
    const d = who.position.distanceTo(here);
    if (d < bestD) {
      bestD = d;
      best = who;
    }
  }
  return best;
}

function hasFreshPerfect(grill) {
  if (!grill) return false;
  const now = performance.now();
  return grill.userData.skewers.some((s) => {
    if (s.userData.owner !== 'player') return false;
    if (skewerGrade(s) === 'perfect') return true;
    return s.userData.perfectAt && now - s.userData.perfectAt < 20000;
  });
}

function canCookTalk() {
  if (shot) return false;
  if (state.playerChatting || playerPending || playerChatLock > 0) return false;
  if (state.managerTalking || atanAnim) return false;
  return true;
}

function flipSkewers(grill, all = true) {
  const list = grill.userData.skewers;
  list.forEach((s, i) => {
    if (!all && i % 2) return;
    if (s.userData.flipping) return;
    s.userData.flipping = true;
    s.userData.flipFrom = s.rotation.x;
    s.userData.flipT = 0;
  });
}

function openAddress() { panelEl.classList.add('show'); }
function closeAddress() { panelEl.classList.remove('show'); }
exitEl.addEventListener('click', (e) => { e.stopPropagation(); openAddress(); });
panelEl.querySelector('.close').addEventListener('click', (e) => { e.stopPropagation(); closeAddress(); });
panelEl.addEventListener('click', (e) => e.stopPropagation());

function getPointer(e) {
  const t = e.changedTouches ? e.changedTouches[0] : e;
  pointer.x = (t.clientX / innerWidth) * 2 - 1;
  pointer.y = -(t.clientY / innerHeight) * 2 + 1;
  return { x: t.clientX, y: t.clientY };
}

function uiBlock(target) {
  if (!target || !target.closest) return false;
  return !!(
    target.closest('#actions') ||
    target.closest('#mute') ||
    target.closest('#panel') ||
    target.closest('#menu') ||
    target.closest('#talk') ||
    target === exitEl
  );
}

let swipeStart = null;
function onDown(e) {
  if (uiBlock(e.target)) return;
  if (e.target === exitEl || (panelEl.classList.contains('show') && panelEl.contains(e.target))) return;
  if (state.menuOpen) return;
  unlockAudio();
  const p = getPointer(e);
  swipeStart = { ...p, t: performance.now() };
}

function onUp(e) {
  if (state.menuOpen) {
    if (!menuEl.contains(e.target)) closeMenu();
    swipeStart = null;
    return;
  }
  if (panelEl.classList.contains('show') && !panelEl.contains(e.target) && e.target !== exitEl) {
    closeAddress();
  }
  if (!swipeStart) return;
  const p = getPointer(e);
  const dx = p.x - swipeStart.x;
  const dy = p.y - swipeStart.y;
  const dt = performance.now() - swipeStart.t;
  swipeStart = null;
  if (uiBlock(e.target)) return;

  if (state.seated && Math.hypot(dx, dy) > 36 && dt < 800) {
    flipSkewers(state.sittingAt.grill);
    return;
  }
  if (Math.hypot(dx, dy) > 18 || dt > 500) {
    if (state.seated) return;
  }
  handleTap();
}

function handleTap() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactives, true);
  if (!hits.length) return;
  const hit = hits[0];
  const kind = (function findKind(o) {
    while (o) {
      if (o.userData && o.userData.kind) return o;
      o = o.parent;
    }
    return hit.object;
  })(hit.object);

  if (kind.userData.kind === 'plaque') { openAddress(); return; }

  if (kind.userData.kind === 'person') {
    const who = kind.userData.who || kind;
    if (who === player) return;
    if (who === atan) {
      if (!state.managerTalking) {
        say(atan, MANAGER_CHIRPS[Math.floor(Math.random() * MANAGER_CHIRPS.length)], 2.4, true);
      }
      return;
    }
    say(who, CHAT_LINES[Math.floor(Math.random() * CHAT_LINES.length)], 2.5);
    return;
  }

  if (state.seated) {
    if (kind.userData.kind === 'seat' && kind.userData.seat !== state.sittingAt) {
      const seat = kind.userData.seat;
      if (!seat.occupied) {
        const prev = state.sittingAt;
        setSeated(false, prev);
        walkTo(hit.point, seat);
      }
      return;
    }
    if (kind.name === 'floor') {
      setSeated(false, state.sittingAt);
      walkTo(hit.point);
    }
    return;
  }

  if (kind.userData.kind === 'seat') {
    const seat = kind.userData.seat;
    if (seat.occupied) return;
    walkTo(seat.world, seat);
    return;
  }
  if (kind.name === 'floor') walkTo(hit.point);
}

function walkTo(point, seatAfter = null) {
  const target = point.clone();
  target.y = 0;
  target.x = THREE.MathUtils.clamp(target.x, -8.6, 8.6);
  target.z = THREE.MathUtils.clamp(target.z, -7.1, 7.1);
  state.walkTarget = target;
  state.pendingSeat = seatAfter || null;
  hideHint();
}

function sendTalk() {
  const text = (talkIn.value || '').trim().slice(0, 24);
  if (!text) return;
  talkIn.value = '';
  talkIn.blur();
  document.body.classList.remove('talking');
  unlockAudio();
  pendingReply = null;
  state.playerChatting = true;
  playerChatLock = 6;
  say(player, text, 3.4);
  const partner = findChatPartner();
  if (!partner) {
    showHint('走近一点再说话', false);
    playerPending = null;
    playerChatLock = 2.2;
    return;
  }
  const reply = composeReply(text, partner === atan);
  playerPending = {
    who: partner,
    text: reply,
    asManager: partner === atan,
    t: 0.6 + Math.random() * 0.6,
  };
}

talkEl.addEventListener('submit', (e) => {
  e.preventDefault();
  e.stopPropagation();
  sendTalk();
});
talkEl.addEventListener('pointerdown', (e) => e.stopPropagation());
talkEl.addEventListener('pointerup', (e) => e.stopPropagation());
talkEl.addEventListener('click', (e) => e.stopPropagation());
talkIn.addEventListener('focus', () => {
  document.body.classList.add('talking');
  unlockAudio();
});
talkIn.addEventListener('blur', () => document.body.classList.remove('talking'));
talkIn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.isComposing || e.keyCode === 229)) e.stopPropagation();
});

function syncTalkDock() {
  const vv = window.visualViewport;
  if (!vv) return;
  const overlap = Math.max(0, innerHeight - (vv.height + vv.offsetTop));
  talkEl.style.bottom = overlap > 0 ? `${overlap}px` : '';
  document.body.classList.toggle('kb-open', overlap > 60);
}
if (window.visualViewport) {
  visualViewport.addEventListener('resize', syncTalkDock);
  visualViewport.addEventListener('scroll', syncTalkDock);
}

actionsEl.addEventListener('click', (e) => {
  const act = e.target.dataset.act;
  if (!act || !state.seated) return;
  e.stopPropagation();
  const grill = state.sittingAt.grill;
  if (act === 'order') openMenu();
  if (act === 'flip') flipSkewers(grill);
  if (act === 'fan') fanGrill(grill);
  if (act === 'toast') {
    playSfx('clink');
    const cups = state.sittingAt.table.userData.cups;
    cups.forEach((c, i) => {
      c.userData.toastT = 0;
      c.userData.toastDir = i === 0 ? 1 : -1;
    });
    const neigh = tableNeighbor(state.sittingAt);
    state.sittingAt.table.userData.seats.forEach((s) => {
      if (s.who && s.who !== player) s.who.userData.toast = 0.7;
    });
    if (neigh && hasFreshPerfect(grill) && canCookTalk()) {
      const line = TOAST_COOK_LINES[Math.floor(Math.random() * TOAST_COOK_LINES.length)];
      say(neigh, line, 2.4);
      state.cookReactAt = performance.now() + 7000;
    }
  }
});

function updatePlayer(dt) {
  if (state.seated) return;
  if (!state.walkTarget) {
    const ph = performance.now() / 700;
    player.userData.torso.scale.y = 1.15 + Math.sin(ph) * 0.015;
    return;
  }
  tmp.copy(state.walkTarget).sub(player.position);
  tmp.y = 0;
  const d = tmp.length();
  if (d < 0.1) {
    player.position.x = state.walkTarget.x;
    player.position.z = state.walkTarget.z;
    state.walkTarget = null;
    player.userData.lleg.rotation.x = 0;
    player.userData.rleg.rotation.x = 0;
    if (state.pendingSeat && !state.pendingSeat.occupied) setSeated(true, state.pendingSeat);
    else showHint('点地面走过去', true);
    state.pendingSeat = null;
    return;
  }
  tmp.normalize();
  player.position.addScaledVector(tmp, 2.35 * dt);
  player.rotation.y = Math.atan2(tmp.x, tmp.z);
  const ph = (performance.now() / 160) % (Math.PI * 2);
  player.userData.lleg.rotation.x = Math.sin(ph) * 0.55;
  player.userData.rleg.rotation.x = Math.cos(ph) * 0.55;
  if (state.pendingSeat && player.position.distanceTo(state.pendingSeat.world) < 0.28) {
    state.walkTarget = null;
    setSeated(true, state.pendingSeat);
    state.pendingSeat = null;
  }
}

function updateCamera(dt) {
  if (state.shotCam) return;
  if (state.seated && state.sittingAt) {
    const seat = state.sittingAt;
    const grill = seat.grill.getWorldPosition(tmp);
    const back = new THREE.Vector3(0, 1.35, 1.55).applyAxisAngle(Y_AXIS, seat.rot);
    tmp2.copy(seat.sitPos).add(back);
    // Don't park the camera inside a guest sitting across the table.
    for (const who of npcs) {
      const dx = tmp2.x - who.position.x;
      const dz = tmp2.z - who.position.z;
      if (dx * dx + dz * dz < 0.55 * 0.55) {
        const grillPos = seat.grill.getWorldPosition(tmp);
        const away = new THREE.Vector3(tmp2.x - grillPos.x, 0, tmp2.z - grillPos.z);
        if (away.lengthSq() < 0.01) away.set(-Math.sin(seat.rot), 0, -Math.cos(seat.rot));
        away.normalize();
        tmp2.add(away.multiplyScalar(0.9));
        tmp2.y += 0.2;
        break;
      }
    }
    camera.position.lerp(tmp2, 1 - Math.pow(0.001, dt));
    const look = grill.clone();
    look.y += 0.15;
    camera.lookAt(look);
  } else {
    const mobile = innerWidth < 700;
    const off = new THREE.Vector3(mobile ? 0.45 : 0.15, mobile ? 2.95 : 2.72, mobile ? -4.1 : -3.6);
    off.applyAxisAngle(Y_AXIS, player.rotation.y);
    tmp.copy(player.position).add(off);
    tmp.x = THREE.MathUtils.clamp(tmp.x, -8.5, 8.5);
    tmp.z = THREE.MathUtils.clamp(tmp.z, -6.9, 7.55);
    camera.position.lerp(tmp, 1 - Math.pow(0.008, dt));
    const ahead = new THREE.Vector3(1.15, 1.12, 3.35).applyAxisAngle(Y_AXIS, player.rotation.y);
    tmp2.copy(player.position).add(ahead);
    camera.lookAt(tmp2);
  }
}

function updateAnims(dt) {
  for (const table of tables) {
    const grill = table.userData.grill;
    const restY = grill.userData.skewerY || 0.19;
    for (const s of grill.userData.skewers) {
      if (!s.userData.flipping) continue;
      s.userData.flipT += dt * 2.6;
      const t = Math.min(1, s.userData.flipT);
      s.rotation.x = (s.userData.flipFrom || 0) + Math.PI * t;
      s.position.y = restY + Math.sin(t * Math.PI) * 0.1;
      if (t >= 1) {
        s.userData.flipping = false;
        s.position.y = restY;
        const turns = Math.round((s.rotation.x || 0) / Math.PI);
        s.rotation.x = (((turns % 2) + 2) % 2) * Math.PI;
        s.userData.needFlipHinted = false;
        applyCookVisual(s, true);
      }
    }
    const light = grill.children.find((c) => c.isLight);
    if (light && light.userData.boostT > 0) {
      light.userData.boostT -= dt;
      light.intensity = 0.5 + 1.1 * Math.max(0, light.userData.boostT);
    }
    table.userData.cups.forEach((c) => {
      if (c.userData.toastT == null) return;
      c.userData.toastT += dt;
      const t = c.userData.toastT;
      const dir = c.userData.toastDir || 1;
      c.rotation.z = Math.sin(Math.min(t, 0.5) / 0.5 * Math.PI) * 0.4 * dir;
      if (t > 0.8) { c.rotation.z = 0; c.userData.toastT = null; }
    });
  }
  for (const p of npcs) {
    const ph = performance.now() / 800 + p.userData.phase;
    p.userData.torso.scale.y = 1.15 + Math.sin(ph) * 0.02;
    if (p.userData.toast > 0) {
      p.userData.toast -= dt;
      p.userData.head.rotation.z = Math.sin(p.userData.toast * 8) * 0.08;
    }
    if (Math.random() < 0.0012) {
      const seat = seats.find((s) => s.who === p);
      if (seat) flipSkewers(seat.grill, false);
    }
  }
}

function updateCooking(dt) {
  const now = performance.now();
  for (const table of tables) {
    const grill = table.userData.grill;
    if (!grill) continue;
    if (grill.userData.fanHeat > 0) {
      grill.userData.fanHeat = Math.max(0, grill.userData.fanHeat - dt / 2.8);
    }
    const heat = 1 + 1.15 * (grill.userData.fanHeat || 0);
    const playerGrill = state.sittingAt && state.sittingAt.grill === grill;
    let needFlip = false;
    for (const s of grill.userData.skewers) {
      if (!state.cookPaused && !s.userData.flipping) {
        const down = downIndex(s);
        let rate = (s.userData.cookRate || 0.036) * heat;
        if (s.userData.owner !== 'player') rate *= 0.85;
        s.userData.doneness[down] = Math.min(1.25, s.userData.doneness[down] + rate * dt);
        if (s.userData.owner !== 'player' && s.userData.doneness[down] > 0.78) {
          s.userData.doneness[down] = 0.78;
        }
        applyCookVisual(s);
        if (s.userData.owner !== 'player' && !s.userData.flipping) {
          const up = 1 - down;
          if (s.userData.doneness[down] > 0.46 && s.userData.doneness[up] < s.userData.doneness[down] - 0.12) {
            if (Math.random() < 0.015) {
              if (!s.userData.flipping) {
                s.userData.flipping = true;
                s.userData.flipFrom = s.rotation.x;
                s.userData.flipT = 0;
              }
            }
          }
        }
      }
      if (s.userData.owner !== 'player') continue;
      const grade = skewerGrade(s);
      const down = downIndex(s);
      const up = 1 - down;
      const dd = s.userData.doneness;
      if (dd[down] >= 0.42 && dd[up] < dd[down] - 0.14 && dd[down] < 0.90) needFlip = true;
      if (grade === 'perfect' && !s.userData.announcedPerfect) {
        s.userData.announcedPerfect = true;
        s.userData.perfectAt = now;
        s.userData._justPerfect = true;
      }
      if (grade === 'burnt' && !s.userData.announcedBurnt) {
        s.userData.announcedBurnt = true;
        s.userData._justBurnt = true;
      }
    }

    if (playerGrill && !shot) {
      const justPerfect = grill.userData.skewers.filter((s) => s.userData._justPerfect);
      const justBurnt = grill.userData.skewers.filter((s) => s.userData._justBurnt);
      justPerfect.forEach((s) => { s.userData._justPerfect = false; });
      justBurnt.forEach((s) => { s.userData._justBurnt = false; });

      if (needFlip && now - (state.flipHintAt || 0) > 8000 && state.seated && !state.menuOpen && !state.playerChatting && !document.body.classList.contains('talking')) {
        const any = grill.userData.skewers.some((s) => {
          if (s.userData.owner !== 'player' || s.userData.needFlipHinted) return false;
          const down = downIndex(s);
          const up = 1 - down;
          const dd = s.userData.doneness;
          return dd[down] >= 0.42 && dd[up] < dd[down] - 0.14 && dd[down] < 0.90;
        });
        if (any) {
          showHint('该翻了', false, 2000);
          state.flipHintAt = now;
          grill.userData.skewers.forEach((s) => {
            const down = downIndex(s);
            const up = 1 - down;
            const dd = s.userData.doneness;
            if (s.userData.owner === 'player' && dd[down] >= 0.42 && dd[up] < dd[down] - 0.14) s.userData.needFlipHinted = true;
          });
        }
      }

      if (canCookTalk() && now >= (state.cookReactAt || 0)) {
        const speaker = tableNeighbor(state.sittingAt) || atan;
        if (justPerfect.length) {
          const line = COOK_PERFECT_LINES[Math.floor(Math.random() * COOK_PERFECT_LINES.length)];
          say(speaker, line, 2.6, speaker === atan);
          state.cookReactAt = now + 10000;
        } else if (justBurnt.length) {
          const line = COOK_BURNT_LINES[Math.floor(Math.random() * COOK_BURNT_LINES.length)];
          say(speaker, line, 2.6, speaker === atan);
          state.cookReactAt = now + 8000;
          if (now - (state.burntWindowAt || 0) > 12000) state.burntSession = 0;
          state.burntWindowAt = now;
          state.burntSession += justBurnt.length;
          if (state.burntSession >= 3 && !state.managerBurntWarned && !atanAnim && !state.managerTalking) {
            state.managerBurntWarned = true;
            const mline = MANAGER_BURNT_LINES[Math.floor(Math.random() * MANAGER_BURNT_LINES.length)];
            startManager(mline);
          }
        }
      } else if (justBurnt.length) {
        if (now - (state.burntWindowAt || 0) > 12000) state.burntSession = 0;
        state.burntWindowAt = now;
        state.burntSession += justBurnt.length;
        if (state.burntSession >= 3 && !state.managerBurntWarned && !atanAnim && !state.managerTalking && !state.playerChatting) {
          state.managerBurntWarned = true;
          const mline = MANAGER_BURNT_LINES[Math.floor(Math.random() * MANAGER_BURNT_LINES.length)];
          startManager(mline);
        }
      }
    }
  }
}

function onResize() {
  const vv = window.visualViewport;
  const kb = vv ? Math.max(0, innerHeight - (vv.height + vv.offsetTop)) : 0;
  if (kb > 80 || document.body.classList.contains('kb-open')) {
    syncTalkDock();
    return;
  }
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
  syncTalkDock();
}
addEventListener('resize', onResize);
addEventListener('orientationchange', () => setTimeout(onResize, 200));

canvas.addEventListener('pointerdown', onDown);
addEventListener('pointerup', onUp);
actionsEl.addEventListener('pointerdown', (e) => e.stopPropagation());

function tick() {
  const dt = Math.min(0.05, clock.getDelta());
  updatePlayer(dt);
  updateAtan(dt);
  updateCooking(dt);
  updateAnims(dt);
  updateChat(dt);
  updateBubbles();
  updateCamera(dt);
  mats.coal.emissiveIntensity = 1.15 + Math.sin(performance.now() / 280) * 0.2;
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

function runShot() {
  fadeEl.classList.add('off');
  fadeEl.style.display = 'none';
  if (shot === 'entry') {
    // keep the arrival camera as-is
  } else if (shot === 'menu') {
    const table = tables[1] || tables[0];
    const seat = table.userData.seats.find((s) => !s.occupied) || table.userData.seats[0];
    if (seat && !seat.occupied) setSeated(true, seat);
    cart.set('qjhj', 3);
    cart.set('nsn', 2);
    cart.set('qshg', 1);
    state.menuCat = '推荐';
    openMenu();
  } else if (shot === 'bubble') {
    const visible = npcs.find((who) => {
      who.userData.head.getWorldPosition(tmp);
      tmp.y += 0.28;
      tmp2.copy(tmp).applyMatrix4(camera.matrixWorldInverse);
      if (tmp2.z > -0.4) return false;
      tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * innerWidth;
      const y = (-tmp.y * 0.5 + 0.5) * innerHeight;
      return x > 48 && x < innerWidth - 48 && y > 48 && y < innerHeight - 90;
    }) || npcs[0];
    if (visible) say(visible, '这串够大', 12, false);
  } else if (shot === 'chat') {
    // Stand in the aisle by the left-front table so both heads stay in frame.
    hideHint();
    player.position.set(-1.55, 0, 3.15);
    player.rotation.y = -Math.PI / 2;
    player.updateMatrixWorld(true);
    const mobile = innerWidth < 700;
    if (mobile) {
      camera.position.set(0.55, 2.4, 6.15);
      camera.lookAt(-2.45, 0.82, 3.2);
    } else {
      camera.position.set(0.15, 2.15, 4.55);
      camera.lookAt(-3.35, 0.95, 3.05);
    }
    state.shotCam = true;
    say(player, '有什么推荐的', 20);
    const partner = findChatPartner() || npcs[0];
    if (partner) {
      const line = partner === atan ? '先坐下点，青花椒鸡也行。' : '超鲜羊肉不错，牛上脑也行。';
      say(partner, line, 20, partner === atan);
    }
  } else if (shot === 'seatedbar') {
    const table = tables[1] || tables[0];
    const seat = table.userData.seats.find((s) => !s.occupied) || table.userData.seats[0];
    if (seat && !seat.occupied) setSeated(true, seat);
    hideHint();
  } else if (shot === 'music') {
    // hall as arrived, mute stays on ♪
  } else if (shot === 'cook' || shot === 'perfect' || shot === 'burnt') {
    const table = tables[1] || tables[0];
    const seat = table.userData.seats.find((s) => !s.occupied) || table.userData.seats[0];
    if (seat && !seat.occupied) setSeated(true, seat);
    hideHint();
    // A dinner companion across the grill, only for these stills — not in the live camera path.
    const across = table.userData.seats[2];
    let shotBuddy = null;
    if (across && !across.occupied) {
      shotBuddy = makePerson({ shirtColor: 0x7a5a48, pantsColor: 0x2c2824 });
      scene.add(shotBuddy);
      sitCharacter(shotBuddy, across);
      npcs.push(shotBuddy);
    }
    const gp = seat.grill.getWorldPosition(new THREE.Vector3());
    camera.position.set(gp.x + 0.02, gp.y + 0.74, gp.z + 1.48);
    camera.lookAt(gp.x, gp.y + 0.08, gp.z - 0.02);
    state.shotCam = true;
    const grill = seat.grill;
    const put = (specs) => {
      for (const spec of specs) {
        const s = makeSkewer(spec.style, false);
        s.userData.owner = 'player';
        s.userData.doneness = [spec.d0, spec.d1];
        s.userData.announcedPerfect = true;
        s.userData.announcedBurnt = true;
        if (spec.flip) s.rotation.x = Math.PI;
        applyCookVisual(s, true);
        grill.add(s);
        grill.userData.skewers.push(s);
      }
      layoutSkewers(grill);
    };
    state.cookPaused = true;
    state.cookTipShown = true;
    if (shot === 'cook') {
      put([
        { style: 'beef-big', d0: 0.56, d1: 0.10 },
        { style: 'chicken', d0: 0.30, d1: 0.08 },
        { style: 'lamb', d0: 0.48, d1: 0.16 },
        { style: 'potato', d0: 0.36, d1: 0.10 },
        { style: 'fatty', d0: 0.22, d1: 0.05 },
        { style: 'shrimp', d0: 0.42, d1: 0.14 },
      ]);
      showHint('该翻了', false, 8000);
    } else if (shot === 'perfect') {
      put([
        { style: 'beef-big', d0: 0.56, d1: 0.52 },
        { style: 'lamb', d0: 0.64, d1: 0.58 },
        { style: 'chicken', d0: 0.50, d1: 0.48 },
        { style: 'fatty', d0: 0.58, d1: 0.50 },
        { style: 'potato', d0: 0.46, d1: 0.44 },
      ]);
      const buddy = shotBuddy || tableNeighbor(seat) || npcs[0];
      if (buddy) say(buddy, '火候刚好', 20, buddy === atan);
    } else if (shot === 'burnt') {
      put([
        { style: 'beef-big', d0: 1.08, d1: 0.28 },
        { style: 'chicken', d0: 1.00, d1: 0.92 },
        { style: 'potato', d0: 1.12, d1: 0.22 },
        { style: 'lamb', d0: 0.96, d1: 0.88 },
        { style: 'shrimp', d0: 1.02, d1: 0.48 },
      ]);
      const buddy = shotBuddy || tableNeighbor(seat) || npcs[0];
      if (buddy) say(buddy, '糊了，再点两串吧', 20, buddy === atan);
    }
  }
}

showHint('点地面走过去', true);
scheduleExitFallback();
renderTabs();
renderSum();
setTimeout(() => fadeEl.classList.add('off'), 200);
if (shot) {
  fadeEl.classList.add('off');
  fadeEl.style.display = 'none';
  setTimeout(runShot, 120);
}
requestAnimationFrame(tick);
addEventListener('pointerdown', unlockAudio, { once: false });

window.__yunshang = {
  state, tables, npcs, atan, player, openMenu, closeMenu, setSeated, say, startManager, cart,
  sendTalk, findChatPartner, composeReply, flipSkewers, fanGrill, serveOrder, layoutSkewers,
  updateCooking, updateAnims,
  makeSkewer, downIndex, skewerGrade, stageOf, applyCookVisual,
  setCookPaused(v) { state.cookPaused = !!v; },
  setDoneness(s, a, b) {
    s.userData.doneness[0] = a;
    s.userData.doneness[1] = b;
    applyCookVisual(s, true);
  },
  grillReport(grill) {
    const g = grill || (state.sittingAt && state.sittingAt.grill);
    if (!g) return [];
    return g.userData.skewers.map((s) => ({
      style: s.userData.style,
      doneness: s.userData.doneness.slice(),
      down: downIndex(s),
      grade: skewerGrade(s),
      rate: s.userData.cookRate,
      owner: s.userData.owner,
    }));
  },
};
