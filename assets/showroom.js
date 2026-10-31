/* V8 Motors: the 3D showroom behind the home page headline.
   A car on a turntable in a dark forest-green studio. It turns slowly, you can drag it round,
   the wheels roll when you scroll and the body squats and dips with the speed of the scroll.
   app.js loads this file only when WebGL and motion are welcome; otherwise the photo slideshow stays.

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
export function createShowroom(host, {url, dragEl = host, mobile = false, onProgress = () => {}, onLost = () => {}} = {}){
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
  const camera = new THREE.PerspectiveCamera(26, 1, .1, 120);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = studio();
  scene.environment = pmrem.fromScene(env, .03).texture;
  env.traverse(o => { if(o.isMesh){ o.geometry.dispose(); o.material.dispose(); } });
  pmrem.dispose();
  scene.environmentIntensity = 0;         // the studio is dark until the ignition

  /* floor, turntable, shadow */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), new THREE.MeshStandardMaterial({color: 0x0c1611, roughness: .5, metalness: .4, alphaMap: fadeTex(), transparent: true, depthWrite: false}));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.1; floor.renderOrder = -2;
  scene.add(floor);
  // a soft pool of light on the floor round the turntable
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), new THREE.MeshBasicMaterial({color: 0x3f7a5c, alphaMap: floor.material.alphaMap, transparent: true, opacity: 0, depthWrite: false}));
  pool.rotation.x = -Math.PI / 2; pool.position.y = -.098; pool.renderOrder = -1;
  scene.add(pool);

  const turn = new THREE.Group(); scene.add(turn);
  const R = 3.05;
  const side = new THREE.MeshStandardMaterial({color: 0x0a120e, roughness: .3, metalness: .85});
  const face = new THREE.MeshPhysicalMaterial({map: dialTex(), roughness: .42, metalness: .35, clearcoat: .5, clearcoatRoughness: .25});
  face.map.colorSpace = THREE.SRGBColorSpace;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R + .04, .1, 160, 1), [side, face, side]);
  disc.position.y = -.05; turn.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R + .025, .012, 8, 320), new THREE.MeshBasicMaterial({color: new THREE.Color(COL.brass).multiplyScalar(1.6), toneMapped: false}));
  ring.rotation.x = Math.PI / 2; ring.position.y = -.002; turn.add(ring);
  const ringMat = ring.material;

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 5.6), new THREE.MeshBasicMaterial({color: 0x000000, alphaMap: shadowTex(), transparent: true, opacity: .92, depthWrite: false}));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .004; turn.add(shadow);

  /* car */
  const pitch = new THREE.Group(); pitch.position.y = .42; turn.add(pitch);   // pivots near axle height
  const wheels = [], lamps = {head: [], tail: [], sig: []};
  let car = null, wheelAng = 0;
  const glow = new THREE.Group(); pitch.add(glow);

  const st = {
    yaw: -.55, spin: .16, dragV: 0,
    r: 1, polar: 1.36, az: .62, ty: .5,   // camera rig: distance multiplier, angle from straight up, angle round
    px: 0, py: 0, tpx: 0, tpy: 0,          // pointer, smoothed
    head: 0, tail: 0, sig: 0,
    vFast: 0, vSlow: 0, pitch: 0, pv: 0, lastY: scrollY,
    scroll: 0, dist: 10, live: false
  };

  function dressCar(root){
    const glass = new THREE.MeshPhysicalMaterial({color: 0x040706, roughness: .03, metalness: 0, transparent: true, opacity: .62, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: .02});
    const seen = new Set();
    root.traverse(o => {
      if(!o.isMesh) return;
      const m = o.material, n = m.name || '';
      if(n === 'Glass'){ o.material = glass; o.renderOrder = 2; return; }
      if(seen.has(m)) return; seen.add(m);
      if(/^Paint 1/.test(n)){ m.color.set(COL.body); m.metalness = .6; m.roughness = .3; m.clearcoat = 1; m.clearcoatRoughness = .025; m.envMapIntensity = 1.15; }
      else if(/^Paint 2/.test(n)){ m.color.set(COL.lower); m.metalness = .55; m.roughness = .28; m.clearcoat = 1; m.clearcoatRoughness = .03; }
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
    [[b.min.x + (b.max.x - b.min.x) * .16], [b.max.x - (b.max.x - b.min.x) * .16]].forEach(([x]) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: tex, color: 0xfff2dc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false}));
      sp.position.set(x, (b.min.y + b.max.y) / 2, b.max.z + .02).applyMatrix4(inv);
      sp.scale.setScalar(.42); glow.add(sp);
    });
  }

  /* ───────── load ───────── */
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const ready = loader.loadAsync(url, e => { if(e.total) onProgress(clamp(e.loaded / e.total, 0, 1)); }).then(async gltf => {
    car = gltf.scene;
    dressCar(car);
    // centre the car on the turntable, then lift the wheels out so the body can squat without them
    const box = new THREE.Box3().setFromObject(car), mid = box.getCenter(new THREE.Vector3());
    car.position.set(-mid.x, -.42 - box.min.y, -mid.z);
    pitch.add(car);
    turn.updateMatrixWorld(true);
    ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR'].forEach(n => {
      const w = car.getObjectByName(n); if(!w) return;
      turn.attach(w); wheels.push({w, q0: w.quaternion.clone()});
    });
    turn.updateMatrixWorld(true);
    addHalos(car);
    onProgress(1);
    frame();
    await renderer.compileAsync(scene, camera).catch(() => {});
    renderer.render(scene, camera);
    return api;
  });

  /* ───────── framing ─────────
     The stylesheet decides where the car goes: an invisible .stage-mark box inside the host
     (right of the headline on wide screens, above it on phones). The turntable is fitted into that box. */
  let W = 1, H = 1;
  const mark = host.querySelector('.stage-mark');
  function frame(){
    W = host.clientWidth || 1; H = host.clientHeight || 1;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const mw = mark ? mark.offsetWidth : W * .5, mh = mark ? mark.offsetHeight : H * .5;
    const cx = mark ? mark.offsetLeft + mw / 2 : W / 2, cy = mark ? mark.offsetTop + mh / 2 : H / 2;
    const vt = Math.tan(camera.fov * Math.PI / 360), ht = vt * camera.aspect;
    // far enough back that the turntable fits the box across, and the car fits it top to bottom
    st.dist = Math.max((R * 2.05 / 2) / (ht * mw / W), (2.4 / 2) / (vt * mh / H));
    camera.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(frame).observe(host);

  /* ───────── input: drag to turn it, the pointer leans the camera ───────── */
  let drag = null;
  const fineP = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const skip = t => t.closest('a,button,input,select,textarea,label,form,.hero-cap');
  dragEl.addEventListener('pointerdown', e => {
    if(!st.live || e.button > 0 || skip(e.target)) return;
    drag = {x: e.clientX, t: performance.now(), id: e.pointerId, moved: false};
  });
  addEventListener('pointermove', e => {
    if(fineP && dragEl.contains(e.target)){
      const r = dragEl.getBoundingClientRect();
      st.tpx = clamp((e.clientX - r.left) / r.width - .5, -.5, .5);
      st.tpy = clamp((e.clientY - r.top) / r.height - .5, -.5, .5);
    }
    if(!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, now = performance.now(), dt = Math.max(8, now - drag.t) / 1000;
    if(!drag.moved && Math.abs(dx) < 4) return;
    if(!drag.moved){ drag.moved = true; dragEl.classList.add('turning'); api.onDrag && api.onDrag(); }
    const d = dx * .0065;
    st.yaw += d; st.dragV = damp(st.dragV, d / dt, 18, dt);
    drag.x = e.clientX; drag.t = now;
  }, {passive: true});
  const up = () => { if(!drag) return; drag = null; dragEl.classList.remove('turning'); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  dragEl.addEventListener('pointerleave', () => { st.tpx = 0; st.tpy = 0; });

  /* ───────── every frame ───────── */
  const qx = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
  function update(dt){
    // scroll: how far through the hero, and how fast
    const y = scrollY, v = (y - st.lastY) / dt; st.lastY = y;
    st.vFast = damp(st.vFast, v, 10, dt); st.vSlow = damp(st.vSlow, v, 2.2, dt);
    st.scroll = clamp(y / (H || 1), 0, 1);

    // turntable: slow drive, plus whatever the drag threw
    if(!drag){ st.dragV = damp(st.dragV, 0, 2.6, dt); st.yaw += (st.spin * (1 + st.scroll * 1.5) + st.dragV) * dt; }
    turn.rotation.y = st.yaw;

    // wheels roll with the scroll (forward when you scroll down)
    wheelAng += st.vFast * .0042 * dt;
    wheels.forEach(({w, q0}) => w.quaternion.copy(q0).multiply(qx.setFromAxisAngle(X, wheelAng)));
    // the body squats as the scroll speeds up and dips when it stops: a spring chasing the acceleration
    const target = clamp(-(st.vFast - st.vSlow) * .000022, -.03, .03);
    st.pv += ((target - st.pitch) * 140 - st.pv * 15) * dt; st.pitch += st.pv * dt;
    pitch.rotation.x = st.pitch;

    // camera: settles lower and closer as you scroll away, leans toward the pointer
    st.px = damp(st.px, st.tpx, 3, dt); st.py = damp(st.py, st.tpy, 3, dt);
    const d = st.dist * st.r * (1 - st.scroll * .2), ph = st.polar + st.scroll * .1 + st.py * .07, th = st.az + st.px * .22;
    camera.position.set(d * Math.sin(ph) * Math.sin(th), st.ty + d * Math.cos(ph), d * Math.sin(ph) * Math.cos(th));
    camera.lookAt(0, st.ty - st.scroll * .2, 0);

    // lamps
    lamps.head.forEach(m => m.emissiveIntensity = st.head * 6);
    lamps.tail.forEach(m => m.emissiveIntensity = st.tail * 4);
    lamps.sig.forEach(m => m.emissiveIntensity = st.sig * 8);
    // halos only while the nose points at the camera
    const face = clamp((Math.sin(st.yaw) * camera.position.x + Math.cos(st.yaw) * camera.position.z) / Math.hypot(camera.position.x, camera.position.z), 0, 1);
    glow.children.forEach(s => s.material.opacity = st.head * .6 * face * face);
    pool.material.opacity = scene.environmentIntensity * .3;
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
