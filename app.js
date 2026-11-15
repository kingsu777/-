import * as THREE from 'three';

const canvas = document.getElementById('c');
const hintEl = document.getElementById('hint');
const actionsEl = document.getElementById('actions');
const bubbleEl = document.getElementById('bubble');
const exitEl = document.getElementById('exit');
const panelEl = document.getElementById('panel');
const fadeEl = document.getElementById('fade');
const muteEl = document.getElementById('mute');

const state = {
  seated: false,
  sittingAt: null,
  walkTarget: null,
  skewerCount: 8,
  atanShown: false,
  atanTalking: false,
  exitShown: false,
  muted: false,
  audioReady: false,
  startedAt: performance.now(),
  seatedOnce: false,
  seatTime: 0,
  flipHintShown: false,
};

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9d8c2);
scene.fog = new THREE.Fog(0xe9d8c2, 16, 38);

const camera = new THREE.PerspectiveCamera(innerWidth < 700 ? 58 : 50, innerWidth / innerHeight, 0.12, 80);
camera.position.set(-0.2, 3.05, 8.5);
camera.lookAt(1.6, 1.15, 1.4);

const sun = new THREE.DirectionalLight(0xfff3d6, 1.25);
sun.position.set(-8, 14, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 2;
sun.shadow.camera.far = 40;
sun.shadow.camera.left = -16;
sun.shadow.camera.right = 16;
sun.shadow.camera.top = 16;
sun.shadow.camera.bottom = -16;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8d7a66, 0.85));
scene.add(new THREE.AmbientLight(0xffe8c8, 0.22));

const mats = {
  floor: new THREE.MeshStandardMaterial({ color: 0xcbb9a0, roughness: 0.92, metalness: 0.04 }),
  tileLine: new THREE.MeshStandardMaterial({ color: 0xb7a48c, roughness: 0.95 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xf3eadc, roughness: 0.9 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x8a8680, roughness: 0.4, metalness: 0.55 }),
  steelDark: new THREE.MeshStandardMaterial({ color: 0x5c5854, roughness: 0.42, metalness: 0.55 }),
  hood: new THREE.MeshStandardMaterial({ color: 0xd8d3cc, roughness: 0.32, metalness: 0.62 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8a5a38, roughness: 0.7 }),
  woodDark: new THREE.MeshStandardMaterial({ color: 0x5c3a24, roughness: 0.74 }),
  stool: new THREE.MeshStandardMaterial({ color: 0x6b4430, roughness: 0.7 }),
  coal: new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.8, emissive: 0xc44a12, emissiveIntensity: 1.4 }),
  grate: new THREE.MeshStandardMaterial({ color: 0x2a2624, roughness: 0.45, metalness: 0.6 }),
  meat: new THREE.MeshStandardMaterial({ color: 0x8d3f28, roughness: 0.55 }),
  meatDark: new THREE.MeshStandardMaterial({ color: 0x5c2a1a, roughness: 0.6 }),
  stick: new THREE.MeshStandardMaterial({ color: 0xd8c4a0, roughness: 0.7 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xfff4dc, roughness: 0.22, metalness: 0.0, emissive: 0xffe9b8, emissiveIntensity: 1.15 }),
  fridge: new THREE.MeshStandardMaterial({ color: 0xd9d4ce, roughness: 0.35, metalness: 0.55 }),
  bottleG: new THREE.MeshStandardMaterial({ color: 0x2f6b46, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.8 }),
  bottleA: new THREE.MeshStandardMaterial({ color: 0x8a5a22, roughness: 0.35, transparent: true, opacity: 0.82 }),
  bottleC: new THREE.MeshStandardMaterial({ color: 0xd8d4c6, roughness: 0.2, transparent: true, opacity: 0.55 }),
  rust: new THREE.MeshStandardMaterial({ color: 0xb04a32, roughness: 0.7 }),
  apron: new THREE.MeshStandardMaterial({ color: 0x4a2d22, roughness: 0.8 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x1a1614, roughness: 0.9 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xe2b48a, roughness: 0.75 }),
  black: new THREE.MeshStandardMaterial({ color: 0x161412, roughness: 0.4, metalness: 0.3 }),
  mug: new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.35 }),
  beer: new THREE.MeshStandardMaterial({ color: 0xd7a33a, roughness: 0.3, transparent: true, opacity: 0.85 }),
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
let player, atan, atanHome, beerBar;
const grillLights = [];

function buildHall() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 18), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = 'floor';
  scene.add(floor);
  interactives.push(floor);

  for (let i = -11; i <= 11; i++) {
    box(0.03, 0.01, 18, mats.tileLine, i, 0.01, 0, scene, false);
  }
  for (let j = -8; j <= 8; j++) {
    box(24, 0.01, 0.03, mats.tileLine, 0, 0.01, j, scene, false);
  }

  // walls
  box(24, 7.2, 0.28, mats.wall, 0, 3.6, -9);
  box(24, 7.2, 0.28, mats.wall, 0, 3.6, 9);
  box(0.28, 7.2, 18, mats.wall, -12, 3.6, 0);
  box(0.28, 7.2, 18, mats.wall, 12, 3.6, 0);

  // industrial windows on long walls (bright panes, thin frames, not solid dark slabs)
  for (const z of [-8.86, 8.86]) {
    for (let i = -3; i <= 3; i++) {
      const x = i * 3.1, y = 4.35;
      const face = z > 0 ? -0.02 : 0.02;
      const pane = box(2.05, 2.45, 0.04, mats.glass, x, y, z + face, scene, false);
      pane.castShadow = false;
      // slim frame
      box(2.22, 0.08, 0.08, mats.steel, x, y + 1.26, z + face, scene, false);
      box(2.22, 0.08, 0.08, mats.steel, x, y - 1.26, z + face, scene, false);
      box(0.08, 2.52, 0.08, mats.steel, x - 1.07, y, z + face, scene, false);
      box(0.08, 2.52, 0.08, mats.steel, x + 1.07, y, z + face, scene, false);
      // muntin
      box(0.05, 2.45, 0.05, mats.steel, x, y, z + face, scene, false);
    }
  }

  // steel columns
  for (const x of [-8, -2.5, 2.5, 8]) {
    for (const z of [-6.5, 6.5]) {
      box(0.28, 7.2, 0.28, mats.steel, x, 3.6, z);
    }
  }

  // ceiling beams
  for (let i = -4; i <= 4; i++) {
    box(23, 0.22, 0.38, mats.steel, 0, 6.85, i * 1.8);
    box(0.16, 0.55, 0.16, mats.steelDark, 0, 6.5, i * 1.8, scene, false);
  }
  // long spine beam
  box(0.4, 0.3, 17.5, mats.steelDark, 0, 6.95, 0);

  // large hoods over two table rows
  for (const x of [-3.6, 3.6]) {
    box(4.3, 0.14, 10.5, mats.hood, x, 4.55, 0);
    box(4.3, 0.62, 0.1, mats.hood, x, 4.26, -5.25);
    box(4.3, 0.62, 0.1, mats.hood, x, 4.26, 5.25);
    box(0.1, 0.62, 10.5, mats.hood, x - 2.15, 4.26, 0);
    box(0.1, 0.62, 10.5, mats.hood, x + 2.15, 4.26, 0);
    cyl(0.26, 2.3, mats.steel, x, 5.75, -3.2, scene, 12);
    cyl(0.26, 2.3, mats.steel, x, 5.75, 3.2, scene, 12);
  }
}

function buildBeerBar() {
  beerBar = new THREE.Group();
  beerBar.position.set(5.45, 0, 4.15);
  scene.add(beerBar);

  box(1.5, 1.05, 6.4, mats.fridge, 0, 0.52, 0, beerBar);
  box(1.55, 0.08, 6.5, mats.steel, 0, 1.08, 0, beerBar);

  // draft towers
  for (const z of [-1.5, -0.7, 0.1]) {
    cyl(0.07, 0.55, mats.steel, -0.35, 1.42, z, beerBar, 10);
    const handle = box(0.04, 0.28, 0.04, mats.rust, -0.52, 1.58, z, beerBar);
    handle.rotation.z = 0.5;
    sph(0.045, mats.rust, -0.62, 1.7, z, beerBar, 10);
  }

  // drip tray
  box(0.7, 0.05, 2.2, mats.steelDark, -0.45, 1.14, -0.7, beerBar);

  // glass-door fridge on the right of the bar
  const cabinet = box(1.3, 2.4, 2.6, mats.fridge, 0.05, 2.28, 1.85, beerBar);
  // glass doors
  const door1 = box(0.06, 2.1, 1.15, mats.glass, -0.62, 2.28, 1.25, beerBar);
  const door2 = box(0.06, 2.1, 1.15, mats.glass, -0.62, 2.28, 2.45, beerBar);
  door1.castShadow = door2.castShadow = false;
  // shelves + bottles
  for (const y of [1.55, 2.15, 2.75]) {
    box(1.0, 0.04, 2.3, mats.steel, 0.05, y, 1.85, beerBar, false);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 5; c++) {
        const mat = [mats.bottleG, mats.bottleA, mats.bottleC][(r + c) % 3];
        const b = cyl(0.07, 0.32, mat, -0.18 + r * 0.28, y + 0.2, 1.05 + c * 0.32, beerBar, 8);
        cyl(0.035, 0.1, mat, b.position.x, y + 0.4, b.position.z, beerBar, 8);
      }
    }
  }

  // small counter cups
  for (const z of [-2.4, -2.05]) {
    cyl(0.06, 0.12, mats.mug, -0.55, 1.2, z, beerBar, 10);
  }
}

function makeSkewer(cooked = true) {
  const g = new THREE.Group();
  const stick = cyl(0.012, 0.62, mats.stick, 0, 0, 0, g, 6);
  stick.rotation.z = Math.PI / 2;
  stick.castShadow = false;
  const meatMat = cooked ? mats.meat : new THREE.MeshStandardMaterial({ color: 0xc98b78, roughness: 0.7 });
  for (let i = 0; i < 5; i++) {
    const cube = box(0.07, 0.055, 0.055, i % 2 ? mats.meatDark : meatMat, -0.16 + i * 0.07, 0.01, 0, g, false);
    cube.rotation.y = 0.2;
  }
  g.userData.flipping = false;
  return g;
}

function makeGrill() {
  const g = new THREE.Group();
  cyl(0.42, 0.16, mats.steelDark, 0, 0.08, 0, g, 20);
  cyl(0.38, 0.08, mats.grate, 0, 0.16, 0, g, 20);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    sph(0.05, mats.coal, Math.cos(a) * 0.18, 0.14, Math.sin(a) * 0.18, g, 8);
  }
  sph(0.06, mats.coal, 0, 0.15, 0, g, 8);
  const light = new THREE.PointLight(0xff6a22, 0.55, 3.2);
  light.position.set(0, 0.32, 0);
  g.add(light);
  grillLights.push(light);
  g.userData.skewers = [];
  return g;
}

function makeStool() {
  const g = new THREE.Group();
  cyl(0.16, 0.05, mats.stool, 0, 0.48, 0, g, 12);
  cyl(0.03, 0.48, mats.woodDark, 0, 0.24, 0, g, 8);
  for (const [x, z] of [[0.1, 0.1], [-0.1, 0.1], [0.1, -0.1], [-0.1, -0.1]]) {
    cyl(0.015, 0.22, mats.woodDark, x, 0.1, z, g, 6);
  }
  return g;
}

function createTable(x, z, opts = {}) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);

  const top = box(1.55, 0.07, 1.55, mats.wood, 0, 0.72, 0, group);
  // hole ring under grill
  cyl(0.5, 0.06, mats.woodDark, 0, 0.74, 0, group, 20);
  const legPos = [[0.62, 0.62], [0.62, -0.62], [-0.62, 0.62], [-0.62, -0.62]];
  for (const [lx, lz] of legPos) box(0.08, 0.7, 0.08, mats.woodDark, lx, 0.35, lz, group);

  const grill = makeGrill();
  grill.position.set(0, 0.76, 0);
  group.add(grill);

  // starter skewers
  const startN = opts.skewers ?? 6;
  for (let i = 0; i < startN; i++) {
    const s = makeSkewer(true);
    const ang = (i / Math.max(startN, 1)) * Math.PI - 0.3;
    s.position.set(Math.cos(ang) * 0.16, 0.22, Math.sin(ang) * 0.16);
    s.rotation.y = ang;
    grill.add(s);
    grill.userData.skewers.push(s);
  }

  // raw plate for adding
  const plate = cyl(0.16, 0.02, mats.mug, 0.52, 0.78, 0.48, group, 16);
  plate.name = 'addPlate';
  plate.userData.kind = 'addPlate';
  const raw = makeSkewer(false);
  raw.position.set(0.52, 0.84, 0.48);
  raw.scale.setScalar(0.7);
  group.add(raw);
  interactives.push(plate);

  // cups
  const cupA = cyl(0.05, 0.1, mats.mug, -0.52, 0.83, 0.4, group, 10);
  const beerA = cyl(0.04, 0.07, mats.beer, -0.52, 0.85, 0.4, group, 10);
  const cupB = cyl(0.05, 0.1, mats.mug, 0.5, 0.83, -0.42, group, 10);
  cupA.userData.kind = 'cup';
  cupB.userData.kind = 'cup';

  const seatOffsets = [
    { x: 0, z: 0.95, rot: Math.PI, id: 's' },
    { x: 0, z: -0.95, rot: 0, id: 'n' },
    { x: 0.95, z: 0, rot: -Math.PI / 2, id: 'e' },
    { x: -0.95, z: 0, rot: Math.PI / 2, id: 'w' },
  ];
  const tableSeats = [];
  for (const s of seatOffsets) {
    const stool = makeStool();
    stool.position.set(s.x, 0, s.z);
    group.add(stool);
    const seat = {
      table: group,
      grill,
      world: new THREE.Vector3(x + s.x, 0, z + s.z),
      sitPos: new THREE.Vector3(x + s.x * 0.72, 0, z + s.z * 0.72),
      rot: s.rot,
      occupied: false,
      mesh: stool,
    };
    stool.userData.kind = 'seat';
    stool.userData.seat = seat;
    // clickable top
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.2, 10), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(s.x, 0.48, s.z);
    hit.userData.kind = 'seat';
    hit.userData.seat = seat;
    group.add(hit);
    interactives.push(hit);
    tableSeats.push(seat);
    seats.push(seat);
  }

  group.userData = { grill, seats: tableSeats, cups: [cupA, cupB], plate, x, z };
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

  // simple dark eyes
  const eyeM = mats.black;
  const el = sph(0.02, eyeM, -0.05 * hs, 1.33, 0.15 * hs, g, 8);
  const er = sph(0.02, eyeM, 0.05 * hs, 1.33, 0.15 * hs, g, 8);
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

  g.userData = { lleg, rleg, larm, rarm, torso, head, phase: Math.random() * Math.PI * 2, kind: opts.kind || 'npc' };
  g.scale.setScalar(opts.scale || 1);
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

function buildPeople() {
  player = makePerson({ shirtColor: 0x4a6748, pantsColor: 0x2e2a28, kind: 'player' });
  player.position.set(-0.35, 0, 5.2);
  player.rotation.y = Math.PI;
  scene.add(player);

  atanHome = new THREE.Vector3(7.4, 0, -6.2);
  // Atan's own grill station along the back-right, not a guest seat
  const atanTable = createTable(7.4, -6.2, { skewers: 8 });
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
  // stand at the grill, not sitting in a guest chair
  atan.position.set(7.4, 0, -5.15);
  atan.rotation.y = Math.PI;
  scene.add(atan);
  // keep one stool visually, but mark nearest seat occupied so player won't sit on Atan's working side
  const workSeat = atanTable.userData.seats.find((s) => s.rot === Math.PI) || atanTable.userData.seats[0];
  if (workSeat) {
    workSeat.occupied = true;
    workSeat.who = atan;
  }

  const palettes = [
    { shirtColor: 0x6a4a3a, pantsColor: 0x2c2a28 },
    { shirtColor: 0xd8c4a8, pantsColor: 0x4a4038 },
    { shirtColor: 0x3f5c6e, pantsColor: 0x2a2a2a },
    { shirtColor: 0x8a4a44, pantsColor: 0x35302c },
    { shirtColor: 0x4f5a38, pantsColor: 0x2c2824 },
  ];
  const placements = [
    { tx: -3.4, tz: 2.6, seat: 0 },
    { tx: -3.4, tz: 2.6, seat: 1 },
    { tx: 3.4, tz: 2.6, seat: 0 },
    { tx: -3.4, tz: -2.6, seat: 1 },
    { tx: 3.4, tz: -2.6, seat: 0 },
    { tx: 3.4, tz: -2.6, seat: 2 },
  ];
  // tables already include atan table; main hall tables created in layout
  return palettes;
}

function layoutTables() {
  const coords = [
    [-3.4, 2.6], [-3.4, 0], [-3.4, -2.6],
    [3.4, 2.6], [3.4, 0], [3.4, -2.6],
  ];
  for (const [x, z] of coords) createTable(x, z, { skewers: 5 + Math.floor(Math.random() * 3) });

  const palettes = [
    { shirtColor: 0x6a4a3a, pantsColor: 0x2c2a28 },
    { shirtColor: 0xd8c4a8, pantsColor: 0x4a4038 },
    { shirtColor: 0x3f5c6e, pantsColor: 0x2a2a2a },
    { shirtColor: 0x8a4a44, pantsColor: 0x35302c },
    { shirtColor: 0x4f5a38, pantsColor: 0x2c2824 },
    { shirtColor: 0xc4b49a, pantsColor: 0x3a342e },
  ];
  // sit some guests, leave several seats free
  const used = [
    [0, 0], [0, 1],
    [3, 0],
    [2, 1],
    [4, 0], [4, 2],
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
}

buildHall();
buildBeerBar();
layoutTables();
buildPeople();

// wall plaque (hidden until later)
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
  ctx.font = '64px "PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('大直沽 · 江都路，有空来吃就行', 512, 128);
}
const plaqueMat = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(plaqueTex), roughness: 0.85 });
const plaque = box(2.6, 0.55, 0.04, plaqueMat, -8.6, 1.7, -8.84, scene, false);
plaque.material = plaqueMat;
plaque.visible = false;
plaque.userData.kind = 'plaque';
interactives.push(plaque);

function showHint(text, persist = false) {
  hintEl.textContent = text;
  hintEl.classList.add('show');
  if (!persist) {
    clearTimeout(showHint._t);
    showHint._t = setTimeout(() => hintEl.classList.remove('show'), 3200);
  }
}
function hideHint() { hintEl.classList.remove('show'); }

function setSeated(on, seat) {
  state.seated = on;
  state.sittingAt = on ? seat : null;
  actionsEl.classList.toggle('show', on);
  if (on) {
    state.seatedOnce = true;
    sitCharacter(player, seat);
    showHint('滑动翻串', false);
    state.flipHintShown = true;
  } else {
    player.position.y = 0;
    player.userData.lleg.rotation.x = 0;
    player.userData.rleg.rotation.x = 0;
    player.userData.lleg.position.y = 0.28;
    player.userData.rleg.position.y = 0.28;
    if (seat) seat.occupied = false;
    showHint('点地面走过去', true);
  }
}

function nearestFreeSeat(from) {
  let best = null, bestD = 1.15;
  for (const s of seats) {
    if (s.occupied) continue;
    const d = from.distanceTo(s.world);
    if (d < bestD) { best = s; bestD = d; }
  }
  return best;
}

// audio
const audio = {
  fire: new Audio('./assets/fire.mp3'),
  clink: new Audio('./assets/clink.mp3'),
  woosh: new Audio('./assets/woosh.mp3'),
};
audio.fire.loop = true;
audio.fire.volume = 0.42;
audio.clink.volume = 0.55;
audio.woosh.volume = 0.4;

async function unlockAudio() {
  if (state.audioReady || state.muted) return;
  try {
    await audio.fire.play();
    state.audioReady = true;
  } catch (e) { /* autoplay blocked until next gesture */ }
}

muteEl.addEventListener('click', (e) => {
  e.stopPropagation();
  state.muted = !state.muted;
  muteEl.textContent = state.muted ? '×' : '♪';
  audio.fire.muted = audio.clink.muted = audio.woosh.muted = state.muted;
  if (!state.muted) unlockAudio();
});

function playSfx(name) {
  if (state.muted) return;
  const a = audio[name].cloneNode();
  a.volume = audio[name].volume;
  a.play().catch(() => {});
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

function addSkewer(grill) {
  const s = makeSkewer(false);
  const n = grill.userData.skewers.length;
  const ang = (n * 0.7) % Math.PI;
  s.position.set(Math.cos(ang) * 0.16, 0.22, Math.sin(ang) * 0.16);
  s.rotation.y = ang;
  grill.add(s);
  grill.userData.skewers.push(s);
  state.skewerCount += 1;
  maybeAtan();
}

function maybeAtan() {
  const elapsed = (performance.now() - state.startedAt) / 1000;
  if (state.atanShown) return;
  if (elapsed >= 150 || state.skewerCount >= 40) startAtan();
}

let atanAnim = null;
function startAtan() {
  if (state.atanShown) return;
  state.atanShown = true;
  const dest = player.position.clone();
  const side = new THREE.Vector3(1.1, 0, 0.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
  dest.add(side);
  dest.y = 0;
  atanAnim = { phase: 'walkin', dest, home: atan.position.clone(), t: 0 };
}

function updateAtan(dt) {
  if (!atanAnim) return;
  const a = atanAnim;
  if (a.phase === 'walkin' || a.phase === 'walkout') {
    const target = a.phase === 'walkin' ? a.dest : a.home;
    tmp.copy(target).sub(atan.position);
    tmp.y = 0;
    const d = tmp.length();
    if (d < 0.08) {
      if (a.phase === 'walkin') {
        a.phase = 'talk';
        a.t = 0;
        state.atanTalking = true;
        bubbleEl.classList.add('show');
        // face the player
        const look = player.position.clone().sub(atan.position);
        atan.rotation.y = Math.atan2(look.x, look.z);
      } else {
        atanAnim = null;
        atan.rotation.y = Math.PI;
        scheduleExit();
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
    if (a.t > 4.2) {
      bubbleEl.classList.remove('show');
      state.atanTalking = false;
      a.phase = 'walkout';
    }
  }
}

function scheduleExit() {
  if (state.exitShown) return;
  // appear a little later, after people have sat and warmed up
  const delay = state.seatedOnce ? 8000 : 14000;
  setTimeout(() => {
    state.exitShown = true;
    plaque.visible = true;
    exitEl.classList.add('show');
  }, delay);
}

function openAddress() {
  panelEl.classList.add('show');
}
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

let swipeStart = null;
function onDown(e) {
  if (e.target.closest && e.target.closest('#ui') && e.target.tagName === 'BUTTON') return;
  if (e.target === exitEl || panelEl.classList.contains('show') && panelEl.contains(e.target)) return;
  unlockAudio();
  const p = getPointer(e);
  swipeStart = { ...p, t: performance.now() };
}

function onUp(e) {
  if (!swipeStart) return;
  if (panelEl.classList.contains('show') && e.target !== panelEl && !panelEl.contains(e.target) && e.target !== exitEl) {
    if (e.target === panelEl.querySelector('.close')) return;
    if (!panelEl.contains(e.target) && e.target !== exitEl) closeAddress();
  }
  const p = getPointer(e);
  const dx = p.x - swipeStart.x;
  const dy = p.y - swipeStart.y;
  const dt = performance.now() - swipeStart.t;
  swipeStart = null;
  if (e.target.closest && (e.target.closest('#actions') || e.target.closest('#mute') || e.target.closest('#panel') || e.target === exitEl)) return;

  if (state.seated && Math.hypot(dx, dy) > 36 && dt < 800) {
    flipSkewers(state.sittingAt.grill);
    return;
  }
  if (Math.hypot(dx, dy) > 18 || dt > 500) {
    // treat as swipe only when seated; otherwise fall through if small
    if (state.seated) return;
  }
  handleTap();
}

function handleTap() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactives, true);
  if (!hits.length) return;
  const hit = hits[0];
  let obj = hit.object;
  const kind = (function findKind(o) {
    while (o) {
      if (o.userData && o.userData.kind) return o;
      o = o.parent;
    }
    return hit.object;
  })(obj);

  if (kind.userData.kind === 'plaque') { openAddress(); return; }

  if (state.seated) {
    if (kind.userData.kind === 'addPlate' && kind.parent === state.sittingAt.table) {
      addSkewer(state.sittingAt.grill);
      return;
    }
    // tap floor or far seat: stand up and maybe walk
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
  // clamp indoors
  target.x = THREE.MathUtils.clamp(target.x, -10.6, 10.6);
  target.z = THREE.MathUtils.clamp(target.z, -7.8, 7.8);
  state.walkTarget = target;
  state.pendingSeat = seatAfter || null;
  hideHint();
}

actionsEl.addEventListener('click', (e) => {
  const act = e.target.dataset.act;
  if (!act || !state.seated) return;
  e.stopPropagation();
  const grill = state.sittingAt.grill;
  if (act === 'flip') flipSkewers(grill);
  if (act === 'fan') {
    playSfx('woosh');
    grill.children.forEach((c) => {
      if (c.material === mats.coal) c.material = mats.coal; // keep
    });
    const light = grill.children.find((c) => c.isLight);
    if (light) {
      light.userData.boost = 1;
      light.userData.boostT = 0.6;
    }
  }
  if (act === 'toast') {
    playSfx('clink');
    const cups = state.sittingAt.table.userData.cups;
    cups.forEach((c, i) => {
      c.userData.toastT = 0;
      c.userData.toastDir = i === 0 ? 1 : -1;
    });
    // neighbor at same table nods
    state.sittingAt.table.userData.seats.forEach((s) => {
      if (s.who && s.who !== player) s.who.userData.toast = 0.7;
    });
  }
});

function updatePlayer(dt) {
  if (state.seated) return;
  if (!state.walkTarget) {
    // idle breathe
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
  // arrive at seat if close
  if (state.pendingSeat && player.position.distanceTo(state.pendingSeat.world) < 0.28) {
    state.walkTarget = null;
    setSeated(true, state.pendingSeat);
    state.pendingSeat = null;
  }
}

function updateCamera(dt) {
  if (state.seated && state.sittingAt) {
    const seat = state.sittingAt;
    const grill = seat.grill.getWorldPosition(tmp);
    const back = new THREE.Vector3(0, 1.35, 1.55).applyAxisAngle(new THREE.Vector3(0, 1, 0), seat.rot);
    tmp2.copy(seat.sitPos).add(back);
    camera.position.lerp(tmp2, 1 - Math.pow(0.001, dt));
    const look = grill.clone();
    look.y += 0.15;
    camera.lookAt(look);
  } else {
    const mobile = innerWidth < 700;
    const off = new THREE.Vector3(mobile ? 0.45 : 0.15, mobile ? 2.85 : 2.45, mobile ? -4.1 : -3.6);
    off.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
    tmp.copy(player.position).add(off);
    tmp.x = THREE.MathUtils.clamp(tmp.x, -10.5, 10.5);
    tmp.z = THREE.MathUtils.clamp(tmp.z, -7.6, 7.6);
    camera.position.lerp(tmp, 1 - Math.pow(0.008, dt));
    // model faces +Z, so look a few meters ahead of the player
    const ahead = new THREE.Vector3(1.15, 1.12, 3.35).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
    tmp2.copy(player.position).add(ahead);
    camera.lookAt(tmp2);
  }
}

function updateAnims(dt) {
  // skewer flips
  for (const table of tables) {
    const grill = table.userData.grill;
    for (const s of grill.userData.skewers) {
      if (!s.userData.flipping) continue;
      s.userData.flipT += dt * 2.6;
      const t = Math.min(1, s.userData.flipT);
      s.rotation.x = (s.userData.flipFrom || 0) + Math.PI * t;
      s.position.y = 0.22 + Math.sin(t * Math.PI) * 0.1;
      if (t >= 1) {
        s.userData.flipping = false;
        s.position.y = 0.22;
      }
    }
    const light = grill.children.find((c) => c.isLight);
    if (light && light.userData.boostT > 0) {
      light.userData.boostT -= dt;
      light.intensity = 0.55 + 1.1 * Math.max(0, light.userData.boostT);
    }
    const cups = table.userData.cups;
    cups.forEach((c) => {
      if (c.userData.toastT == null) return;
      c.userData.toastT += dt;
      const t = c.userData.toastT;
      const dir = c.userData.toastDir || 1;
      c.rotation.z = Math.sin(Math.min(t, 0.5) / 0.5 * Math.PI) * 0.4 * dir;
      if (t > 0.8) { c.rotation.z = 0; c.userData.toastT = null; }
    });
  }
  // npc idle
  for (const p of npcs) {
    const ph = performance.now() / 800 + p.userData.phase;
    p.userData.torso.scale.y = 1.15 + Math.sin(ph) * 0.02;
    if (p.userData.toast > 0) {
      p.userData.toast -= dt;
      p.userData.head.rotation.z = Math.sin(p.userData.toast * 8) * 0.08;
    }
    // occasional auto flip
    if (Math.random() < 0.0015) {
      const seat = seats.find((s) => s.who === p);
      if (seat) flipSkewers(seat.grill, false);
    }
  }
  if (state.atanTalking) {
    atan.userData.head.position.getWorldPosition(tmp);
    tmp.y += 0.28;
    tmp.project(camera);
    const x = (tmp.x * 0.5 + 0.5) * innerWidth;
    const y = (-tmp.y * 0.5 + 0.5) * innerHeight;
    bubbleEl.style.left = x + 'px';
    bubbleEl.style.top = y + 'px';
  }
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
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
  updateAnims(dt);
  updateCamera(dt);
  maybeAtan();
  // coals shimmer
  const pulse = 1.15 + Math.sin(performance.now() / 280) * 0.2;
  mats.coal.emissiveIntensity = pulse;
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

showHint('点地面走过去', true);
setTimeout(() => fadeEl.classList.add('off'), 200);
requestAnimationFrame(tick);
addEventListener('pointerdown', unlockAudio, { once: false });
