/* V8 Motors: the 3D showroom that runs down the home page.
   Hero: a car on a turntable in a dark forest-green studio. It turns slowly, you can drag it round,
   the wheels roll when you scroll and the body squats and dips with the speed of the scroll.
   Journey (#journey): scroll on and the camera walks round the car, chapter by chapter (tyres, brakes,
   bonnet, cabin), with labels pinned to the parts, and at the end the car drives off.
   Source file: build with `npm run build` in this folder (see build.mjs). app.js loads the bundle only
   when WebGL and motion are welcome; otherwise the photo slideshow and plain chapters stay.

   The model is "Car Concept" by Eric Chadwick, Darmstadt Graphics Group (CC BY 4.0), built from a
   public-domain model by Unity Fan. For this site the logos were removed, a V8 Motors plate added and
   the file compressed (assets/showroom-car.glb). */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

const COL = {
  body: '#1b5639',      // forest green metallic
  lower: '#0a0d0b',     // sills, roof and mirror caps: gloss black
  caliper: '#C9A55C',   // brass brake calipers
  leather: '#4a3423',
  brass: '#D4B46A',
  disc: '#0e1813'
};
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

/* ───────── the studio the paint reflects: long softboxes and a brass rim light ───────── */
function studio(){
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: 0x0f1a14, side: THREE.BackSide}));
  room.scale.set(34, 16, 34); room.position.y = 7; s.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), new THREE.MeshBasicMaterial({color: 0x18201b}));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.9; s.add(floor);
  const box = (w, h, color, k, pos, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide}));
    m.position.set(...pos); m.rotation.set(...rot); s.add(m);
  };
  box(2.6, 18, 0xffffff, 11, [0, 9, 0], [Math.PI / 2, 0, 0]);            // overhead strip, the long line down the bonnet and roof
  box(1.2, 18, 0xffffff, 5, [-3.4, 8.6, 0], [Math.PI / 2, 0, 0]);        // two thinner strips either side
  box(1.2, 18, 0xffffff, 5, [3.4, 8.6, 0], [Math.PI / 2, 0, 0]);
  box(12, 3.6, 0xfff0d8, 5.5, [-14, 3.4, 2], [0, Math.PI / 2, 0]);       // warm softbox, left
  box(12, 2.6, 0xe8f4ec, 3, [14, 3, -2], [0, -Math.PI / 2, 0]);        // cooler, weaker, right
  box(20, 1.2, COL.brass, 1.3, [0, 1.6, -15], [0, 0, 0]);                // brass rim light behind
  box(16, 1.4, 0xffffff, 2.2, [0, 1.4, 15], [0, Math.PI, 0]);              // low front fill
  return s;
}

/* ───────── canvas textures ───────── */
function canvasTex(size, draw){
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
}
// the turntable face: fine grooves and a ring of brass ticks, like the rev counter in the loader
const dialTex = () => canvasTex(2048, (g, S) => {
  const c = S / 2;
  g.fillStyle = COL.disc; g.fillRect(0, 0, S, S);
  g.lineWidth = 1;
  for(let r = 40; r < c * .9; r += 7){ g.strokeStyle = `rgba(255,255,255,${r % 28 ? .018 : .04})`; g.beginPath(); g.arc(c, c, r, 0, TAU); g.stroke(); }
  for(let i = 0; i < 120; i++){
    const a = i / 120 * TAU, maj = i % 10 === 0, r0 = c * (maj ? .885 : .915), r1 = c * .955;
    g.strokeStyle = maj ? COL.brass : 'rgba(212,180,106,.45)'; g.lineWidth = maj ? 7 : 3;
    g.beginPath(); g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); g.lineTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1); g.stroke();
  }
  g.strokeStyle = 'rgba(212,180,106,.55)'; g.lineWidth = 3;
  g.beginPath(); g.arc(c, c, c * .975, 0, TAU); g.stroke();
});
// soft contact shadow, longer than it is wide
const shadowTex = () => canvasTex(512, (g, S) => {
  g.save(); g.translate(S / 2, S / 2); g.scale(.56, 1);
  const r = g.createRadialGradient(0, 0, 0, 0, 0, S / 2);
  r.addColorStop(0, '#fff'); r.addColorStop(.55, 'rgba(255,255,255,.78)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.beginPath(); g.arc(0, 0, S / 2, 0, TAU); g.fill(); g.restore();
});
// the floor fades out into the page
const fadeTex = () => canvasTex(512, (g, S) => {
  const r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  r.addColorStop(0, '#fff'); r.addColorStop(.35, '#bbb'); r.addColorStop(1, '#000');
  g.fillStyle = r; g.fillRect(0, 0, S, S);
});
// a soft halo for each headlight
const glowTex = () => canvasTex(256, (g, S) => {
  const r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  r.addColorStop(0, 'rgba(255,246,226,1)'); r.addColorStop(.18, 'rgba(255,236,200,.55)'); r.addColorStop(1, 'rgba(255,230,190,0)');
  g.fillStyle = r; g.fillRect(0, 0, S, S);
});

/* ════════════════════ the stage ════════════════════ */
const smooth = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

/* Journey shots, in the car's own frame (front of the car is +z, its left side is +x).
   t: what the camera looks at; d: distance; ph: angle down from straight above; th: angle round from the front. */
const SHOTS = [
  null,                                                     // 0 is the hero turntable shot, worked out live
  {t: [0, .55, 0],      d: 14,   ph: 1.42, th: 1.57},      // 1 side profile, the walk-round starts
  {t: [1.02, .4, 1.22], d: 3.3,  ph: 1.42, th: .98},       // 2 tyres and wheels
  {t: [1.0, .46, 1.12], d: 2.9,  ph: 1.5,  th: 1.4},       // 3 brakes, through the spokes
  {t: [0, .72, 1.5],    d: 6.4,  ph: 1.0,  th: .95},       // 4 the front clamshell lifts
  {t: [.35, .7, .05],   d: 4.9,  ph: 1.16, th: 1.92},      // 5 door open, into the cabin
  {t: [0, .6, 5],       d: 12,   ph: 1.42, th: .5}         // 6 drives off, toward you and out of frame
];

export function createShowroom(host, {url, fileUrl, dragEl = host, heroEl = null, journeyEl = null, pinsEl = null,
  mobile = false, onProgress = () => {}, onLost = () => {}} = {}){
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.setClearColor(0x000000, 0);
  const cv = renderer.domElement;
  cv.setAttribute('aria-hidden', 'true');
  host.appendChild(cv);
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); onLost(); });

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b1510, 18, 46);
  const camera = new THREE.PerspectiveCamera(26, 1, .05, 140);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = studio();
  scene.environment = pmrem.fromScene(env, .03).texture;
  env.traverse(o => { if(o.isMesh){ o.geometry.dispose(); o.material.dispose(); } });
  pmrem.dispose();
  scene.environmentIntensity = 0;         // the studio is dark until the ignition

  /* floor, turntable, shadow */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({color: 0x0c1611, roughness: .5, metalness: .4, alphaMap: fadeTex(), transparent: true, depthWrite: false}));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.1; floor.renderOrder = -2;
  scene.add(floor);
  // a soft pool of light on the floor round the turntable
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), new THREE.MeshBasicMaterial({color: 0x3f7a5c, alphaMap: floor.material.alphaMap, transparent: true, opacity: 0, depthWrite: false}));
  pool.rotation.x = -Math.PI / 2; pool.position.y = -.098; pool.renderOrder = -1;
  scene.add(pool);

  const turn = new THREE.Group(); scene.add(turn);
  const R = 3.05;
  const side = new THREE.MeshStandardMaterial({color: 0x0a120e, roughness: .3, metalness: .85});
  const face = new THREE.MeshStandardMaterial({map: dialTex(), roughness: .78, metalness: .2, envMapIntensity: .3});
  face.map.colorSpace = THREE.SRGBColorSpace;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R + .04, .1, 160, 1), [side, face, side]);
  disc.position.y = -.05; turn.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R + .025, .012, 8, 320), new THREE.MeshBasicMaterial({color: new THREE.Color(COL.brass).multiplyScalar(1.6), toneMapped: false}));
  ring.rotation.x = Math.PI / 2; ring.position.y = -.002; turn.add(ring);
  const ringMat = ring.material;

  // everything that drives away together: body, wheels, shadow
  const drive = new THREE.Group(); turn.add(drive);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 5.6), new THREE.MeshBasicMaterial({color: 0x000000, alphaMap: shadowTex(), transparent: true, opacity: .92, depthWrite: false}));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .004; drive.add(shadow);

  /* car */
  const pitch = new THREE.Group(); pitch.position.y = .42; drive.add(pitch);   // pivots near axle height
  const wheels = [], lamps = {head: [], tail: [], sig: []};
  let car = null, wheelAng = 0, hood = null, door = null;
  const glow = new THREE.Group(); pitch.add(glow);

  const st = {
    yaw: -.55, spin: .16, dragV: 0, alignTo: null,
    r: 1, polar: 1.36, az: .62, ty: .5,   // hero camera rig: distance multiplier, angle from straight up, angle round
    px: 0, py: 0, tpx: 0, tpy: 0,          // pointer, smoothed
    head: 0, tail: 0, sig: 0,
    vFast: 0, vSlow: 0, pitch: 0, pv: 0, lastY: scrollY,
    dist: 10, live: false, driveZ: 0
  };

  function dressCar(root){
    const glass = new THREE.MeshPhysicalMaterial({color: 0x040706, roughness: .03, metalness: 0, transparent: true, opacity: .55, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: .02});
    const seen = new Set();
    root.traverse(o => {
      if(!o.isMesh) return;
      const m = o.material, n = m.name || '';
      if(n === 'Glass'){ o.material = glass; o.renderOrder = 2; return; }
      if(seen.has(m)) return; seen.add(m);
      if(/^Paint 1/.test(n)){ m.color.set(COL.body); m.metalness = .6; m.roughness = .3; m.clearcoat = 1; m.clearcoatRoughness = .025; m.envMapIntensity = 1.15; }
      else if(/^Paint 2/.test(n)){ m.color.set(COL.lower); m.metalness = .5; m.roughness = .42; m.envMapIntensity = .5; m.clearcoat = 1; m.clearcoatRoughness = .03; }
      else if(n === 'Brake'){ m.color.set(COL.caliper); m.metalness = 1; m.roughness = .32; }
      else if(/^Interior 3/.test(n)){ m.color.set(COL.leather); }
      else if(n === 'Headlight'){ m.emissive.set(0xfff3dc); m.emissiveIntensity = 0; lamps.head.push(m); }
      else if(n === 'Brakelight'){ m.emissive.set(0xff2414); m.emissiveIntensity = 0; lamps.tail.push(m); }
      else if(n === 'Signallight'){ m.emissive.set(0xffa21c); m.emissiveIntensity = 0; lamps.sig.push(m); }
      else if(n === 'Rim2'){ m.roughness = .12; }
    });
  }

  // halos in front of the two headlights (placed from the lamp mesh's own bounds)
  function addHalos(root){
    let lampMesh = null; root.traverse(o => { if(o.isMesh && o.material.name === 'Headlight') lampMesh = o; });
    if(!lampMesh) return;
    const b = new THREE.Box3().setFromObject(lampMesh), inv = new THREE.Matrix4().copy(pitch.matrixWorld).invert();
    const tex = glowTex();
    [b.min.x + (b.max.x - b.min.x) * .16, b.max.x - (b.max.x - b.min.x) * .16].forEach(x => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: tex, color: 0xfff2dc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false}));
      sp.position.set(x, (b.min.y + b.max.y) / 2, b.max.z + .02).applyMatrix4(inv);
      sp.scale.setScalar(.42); glow.add(sp);
    });
  }

  // hinge a set of parts (the bonnet, the left door) on a pivot so they can open
  function hinge(test, where){
    const parts = []; car.traverse(o => { if(o !== car && test(o.name || '') && !parts.some(p => p.getObjectById(o.id))) parts.push(o); });
    if(!parts.length) return null;
    const box = new THREE.Box3(); parts.forEach(p => box.expandByObject(p));
    const pv = new THREE.Group(); pv.position.copy(pitch.worldToLocal(where(box))); pitch.add(pv); pv.updateMatrixWorld(true);
    parts.forEach(p => pv.attach(p));
    return pv;
  }

  /* ───────── load ─────────
     Online: fetch the .glb (the loader counts the bytes). Opened from disk: browsers block fetch on file://,
     so the same model comes in as a script (assets/showroom-car.js) and is decoded here. */
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const fromFile = () => new Promise((res, rej) => {
    if(window.V8_CAR_GLB) return res();
    const s = document.createElement('script'); s.src = fileUrl; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  }).then(() => {
    const bin = atob(window.V8_CAR_GLB), buf = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    window.V8_CAR_GLB = null;
    return loader.parseAsync(buf.buffer, '');
  });
  let fake = 0;
  const tick = location.protocol === 'file:' ? setInterval(() => onProgress(fake = Math.min(.9, fake + .06)), 60) : 0;
  const load = location.protocol === 'file:' ? fromFile() : loader.loadAsync(url, e => { if(e.total) onProgress(clamp(e.loaded / e.total, 0, 1)); });

  const ready = load.then(async gltf => {
    clearInterval(tick);
    car = gltf.scene;
    dressCar(car);
    // centre the car on the turntable, then lift the wheels out so the body can squat without them
    const box = new THREE.Box3().setFromObject(car), mid = box.getCenter(new THREE.Vector3());
    car.position.set(-mid.x, -.42 - box.min.y, -mid.z);
    pitch.add(car);
    turn.updateMatrixWorld(true);
    ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR'].forEach(n => {
      const w = car.getObjectByName(n); if(!w) return;
      drive.attach(w); wheels.push({w, q0: w.quaternion.clone()});
    });
    turn.updateMatrixWorld(true);
    // bonnet hinges at its back edge, the left door at its front edge
    hood = hinge(n => /^BodyHood($|Interior|Topgrill)/.test(n), b => new THREE.Vector3(0, b.max.y - .02, b.min.z + .02));
    door = hinge(n => /Door[L]/.test(n) && !/R/.test(n.replace('Door', '')), b => new THREE.Vector3(b.min.x + .05, (b.min.y + b.max.y) / 2, b.max.z - .04));
    addHalos(car);
    onProgress(1);
    frame();
    await renderer.compileAsync(scene, camera).catch(() => {});
    renderer.render(scene, camera);
    return api;
  });
  ready.catch(() => clearInterval(tick));

  /* ───────── framing ─────────
     The stylesheet decides where the car goes: invisible boxes inside the host. .stage-mark is the hero
     (right of the headline on wide screens, above it on phones); .stage-mark-j is the journey. */
  let W = 1, H = 1;
  const mk = {hero: {x: 0, y: 0}, jr: {x: 0, y: 0}};
  function frame(){
    W = host.clientWidth || 1; H = host.clientHeight || 1;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const read = (sel, fb) => {
      const m = host.querySelector(sel);
      return m ? {w: m.offsetWidth, h: m.offsetHeight, cx: m.offsetLeft + m.offsetWidth / 2, cy: m.offsetTop + m.offsetHeight / 2} : fb;
    };
    const a = read('.stage-mark', {w: W * .5, h: H * .5, cx: W / 2, cy: H / 2});
    const b = read('.stage-mark-j', {w: W * .6, h: H * .6, cx: W * .65, cy: H / 2});
    const vt = Math.tan(camera.fov * Math.PI / 360), ht = vt * camera.aspect;
    // far enough back that the turntable fits the box across, and the car fits it top to bottom
    st.dist = Math.max((R * 2.05 / 2) / (ht * a.w / W), (2.4 / 2) / (vt * a.h / H));
    mk.hero = {x: W / 2 - a.cx, y: H / 2 - a.cy};
    mk.jr = {x: W / 2 - b.cx, y: H / 2 - b.cy};
    // the journey shots are framed for a landscape screen: on a narrow one, step back a little
    mk.jrScale = Math.max(1, Math.pow((W / H < 1 ? 1.5 : 1.05) / Math.max(.3, b.w / b.h), .85));
  }
  new ResizeObserver(frame).observe(host);

  /* ───────── input: drag to turn it, the pointer leans the camera ───────── */
  let drag = null, inJourney = 0;
  const fineP = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const skip = t => t.closest('a,button,input,select,textarea,label,form,.hero-cap');
  dragEl.addEventListener('pointerdown', e => {
    if(!st.live || inJourney > .05 || e.button > 0 || skip(e.target)) return;
    drag = {x: e.clientX, t: performance.now(), id: e.pointerId, moved: false};
  });
  addEventListener('pointermove', e => {
    if(fineP){
      st.tpx = clamp(e.clientX / innerWidth - .5, -.5, .5);
      st.tpy = clamp(e.clientY / innerHeight - .5, -.5, .5);
    }
    if(!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, now = performance.now(), dt = Math.max(8, now - drag.t) / 1000;
    if(!drag.moved && Math.abs(dx) < 4) return;
    if(!drag.moved){ drag.moved = true; dragEl.classList.add('turning'); if(api.onDrag) api.onDrag(); }
    const d = dx * .0065;
    st.yaw += d; st.dragV = damp(st.dragV, d / dt, 18, dt);
    drag.x = e.clientX; drag.t = now;
  }, {passive: true});
  const up = () => { if(!drag) return; drag = null; dragEl.classList.remove('turning'); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);

  /* ───────── pinned labels: HTML elements that follow points on the car ───────── */
  const pins = pinsEl ? [...pinsEl.querySelectorAll('[data-p]')].map(el => ({
    el, p: new THREE.Vector3(...el.dataset.p.split(',').map(Number)), shot: +el.dataset.shot, on: false
  })) : [];
  const pv = new THREE.Vector3();

  /* ───────── every frame ───────── */
  const qx = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
  const camPos = new THREE.Vector3(), look = new THREE.Vector3();
  const sph = (o, t, d, ph, th) => o.set(t[0] + d * Math.sin(ph) * Math.sin(th), t[1] + d * Math.cos(ph), t[2] + d * Math.sin(ph) * Math.cos(th));

  function update(dt){
    // scroll: speed, how far through the hero, how far into the journey
    const y = scrollY, v = (y - st.lastY) / dt; st.lastY = y;
    st.vFast = damp(st.vFast, v, 10, dt); st.vSlow = damp(st.vSlow, v, 2.2, dt);
    const hr = heroEl ? heroEl.getBoundingClientRect() : {top: -y, height: H};
    const heroP = clamp(-hr.top / Math.max(1, hr.height), 0, 1);
    let k = 0, jpos = 1;
    if(journeyEl){
      const jr = journeyEl.getBoundingClientRect(), vh = innerHeight;
      k = smooth(clamp(1 - jr.top / vh, 0, 1));                                   // 0 in the hero, 1 once the journey fills the screen
      jpos = 1 + clamp(-jr.top / Math.max(1, jr.height - vh), 0, 1) * (SHOTS.length - 2);
    }
    inJourney = k;

    // turntable: slow drive plus whatever the drag threw; in the journey it lines the car up square
    if(!drag){ st.dragV = damp(st.dragV, 0, 2.6, dt); st.yaw += (st.spin * (1 + heroP * 1.5) * (1 - k) + st.dragV * (1 - k)) * dt; }
    if(k > 0 && st.alignTo === null) st.alignTo = Math.round(st.yaw / TAU) * TAU;
    if(k === 0) st.alignTo = null;
    turn.rotation.y = k > 0 ? lerp(st.yaw, st.alignTo, k) : st.yaw;

    // the last chapter: the car drives off the turntable and away
    const go = clamp((jpos - 5.35) / .65, 0, 1), z = go * go * 26;
    const dz = z - st.driveZ; st.driveZ = z;
    drive.position.z = z;
    drive.position.y = -.1 * smooth(clamp((z - R + .6) / 1.6, 0, 1));

    // wheels: roll with the scroll in the hero, with the road when it drives off
    wheelAng += st.vFast * .0042 * dt * (1 - k) + dz / .38;
    wheels.forEach(({w, q0}) => w.quaternion.copy(q0).multiply(qx.setFromAxisAngle(X, wheelAng)));
    // the body squats as the scroll speeds up and dips when it stops: a spring chasing the acceleration
    const target = clamp(-(st.vFast - st.vSlow) * .000022 * (1 - k), -.03, .03) - go * (1 - go) * .06;
    st.pv += ((target - st.pitch) * 140 - st.pv * 15) * dt; st.pitch += st.pv * dt;
    pitch.rotation.x = st.pitch;

    // bonnet and door open for their chapters
    const bump = (c, w) => smooth(clamp(1 - Math.abs(jpos - c) / w, 0, 1)) * k;
    if(hood) hood.rotation.x = -.45 * bump(4, .75);
    if(door) door.rotation.y = -1.05 * bump(5, .75);

    // camera: hero rig, blended into the journey shots
    st.px = damp(st.px, st.tpx, 3, dt); st.py = damp(st.py, st.tpy, 3, dt);
    const hd = st.dist * st.r * (1 - heroP * .2);
    let t = [0, st.ty - heroP * .2, 0], d = hd, ph = st.polar + heroP * .1 + st.py * .07, th = st.az + st.px * .22;
    if(k > 0){
      const i = clamp(Math.floor(jpos), 1, SHOTS.length - 2), f = smooth(clamp(jpos - i, 0, 1));
      const A = SHOTS[i], B = SHOTS[i + 1], js = mk.jrScale || 1;
      const jt = [0, 1, 2].map(n => lerp(A.t[n], B.t[n], f));
      const jd = lerp(A.d, B.d, f) * js, jph = lerp(A.ph, B.ph, f) + st.py * .04, jth = lerp(A.th, B.th, f) + st.px * .12;
      t = t.map((x, n) => lerp(x, jt[n], k)); d = lerp(d, jd, k); ph = lerp(ph, jph, k); th = lerp(th, jth, k);
    }
    sph(camPos, t, d, ph, th);
    camera.position.copy(camPos);
    camera.lookAt(look.set(t[0], t[1], t[2]));
    camera.setViewOffset(W, H, lerp(mk.hero.x, mk.jr.x, k), lerp(mk.hero.y, mk.jr.y, k), W, H);

    // lamps; the brake lights flare as it pulls away
    lamps.head.forEach(m => m.emissiveIntensity = st.head * 6);
    lamps.tail.forEach(m => m.emissiveIntensity = st.tail * (4 + go * 6));
    lamps.sig.forEach(m => m.emissiveIntensity = st.sig * 8);
    // halos only while the nose points at the camera
    const fx = Math.sin(turn.rotation.y), fz = Math.cos(turn.rotation.y);
    const face = clamp((fx * (camPos.x - drive.position.x * fx) + fz * (camPos.z - z * fz)) / Math.hypot(camPos.x, camPos.z - z), 0, 1);
    glow.children.forEach(s => s.material.opacity = st.head * .6 * face * face);
    pool.material.opacity = scene.environmentIntensity * .3;

    // labels follow their points; each shows during its own chapter
    if(pins.length){
      turn.updateMatrixWorld();
      pins.forEach(p => {
        const w = k > .9 ? smooth(clamp(1 - Math.abs(jpos - p.shot) / .45, 0, 1)) : 0;
        if(w < .01){ if(p.on){ p.el.style.opacity = 0; p.el.classList.remove('on'); p.on = false; } return; }
        drive.localToWorld(pv.copy(p.p)).project(camera);
        if(pv.z > 1){ p.el.style.opacity = 0; return; }
        const sx = (pv.x + 1) / 2 * W;
        p.el.style.transform = `translate3d(${sx.toFixed(1)}px, ${((1 - pv.y) / 2 * H).toFixed(1)}px, 0)`;
        p.el.classList.toggle('pin-l', sx > W * .56);       // the label opens toward the side with more room
        p.el.style.opacity = w.toFixed(3);
        if(!p.on){ p.el.classList.add('on'); p.on = true; }
      });
    }
  }

  let raf = 0, last = 0, want = false, seen = true, hidden = document.hidden;
  function loop(t){
    raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, Math.max(.001, (t - last) / 1000)); last = t;
    update(dt);
    renderer.render(scene, camera);
  }
  function sync(){
    const on = want && seen && !hidden && !!car;
    if(on && !raf){ last = performance.now(); st.lastY = scrollY; raf = requestAnimationFrame(loop); }
    if(!on && raf){ cancelAnimationFrame(raf); raf = 0; }
  }
  function stop(){ want = false; sync(); }
  new IntersectionObserver(es => { seen = es[0].isIntersecting; sync(); }).observe(host);
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; sync(); });

  /* ───────── the ignition: studio lights flicker up, lamps come on, hazards flash twice, camera drives in ───────── */
  function ignite(quick){
    const G = window.gsap;
    st.live = true; want = true; sync();
    host.classList.add('live');
    if(!G){ scene.environmentIntensity = 1; st.head = 1; st.tail = 1; return; }
    G.killTweensOf([scene, st]);
    if(quick){
      G.fromTo(scene, {environmentIntensity: 0}, {environmentIntensity: 1, duration: 1.2, ease: 'power2.out'});
      G.fromTo(st, {r: 1.35}, {r: 1, duration: 2, ease: 'expo.out'});
      G.to(st, {head: 1, tail: 1, duration: .6, delay: .3});
      return;
    }
    st.r = 2.3; st.polar = 1.0; st.az = .62 - .9;
    G.timeline()
      .to(scene, {keyframes: [{environmentIntensity: .35, duration: .06}, {environmentIntensity: .05, duration: .08}, {environmentIntensity: .6, duration: .07}, {environmentIntensity: .3, duration: .1}, {environmentIntensity: 1, duration: .9, ease: 'power2.out'}]}, 0)
      .to(st, {r: 1, polar: 1.36, az: .62, duration: 2.6, ease: 'expo.out'}, 0)
      .to(st, {keyframes: [{head: 1, duration: .05}, {head: .2, duration: .07}, {head: 1, duration: .08}]}, .45)
      .to(st, {tail: 1, duration: .4}, .5)
      .to(st, {keyframes: [{sig: 1, duration: .02}, {sig: 1, duration: .3}, {sig: 0, duration: .02}, {sig: 0, duration: .3}, {sig: 1, duration: .02}, {sig: 1, duration: .3}, {sig: 0, duration: .02}]}, .7)
      .fromTo(ringMat.color, {r: 0, g: 0, b: 0}, {r: ringMat.color.r, g: ringMat.color.g, b: ringMat.color.b, duration: 1.2, ease: 'power2.inOut'}, .2);
  }

  const api = {
    ready, ignite,
    pause(p){ want = !p && st.live; sync(); },
    onDrag: null
  };
  return api;
}
