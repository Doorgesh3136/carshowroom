/* ════════════════════ 3D 360° VIEW ════════════════════
   A real-time 3D model shaped by body type and painted in the car's colour,
   plus a true 360° spin when walk-around photos have been uploaded in the admin.
   three.js loads only when someone opens the 3D view. */
let T3 = null;
async function loadThree(){
  if(T3) return T3;
  const [THREE, oc, re] = await Promise.all([import('three'), import('three/addons/controls/OrbitControls.js'), import('three/addons/environments/RoomEnvironment.js')]);
  return T3 = {THREE, OrbitControls: oc.OrbitControls, RoomEnvironment: re.RoomEnvironment};
}
const PAINT = [
  [/white|pearl|glacier|alpine|snow|mineral/i, 0xEEF0F2], [/black|obsidian|onyx/i, 0x101318], [/silver|iridium|gt silver/i, 0xB8BEC6],
  [/grey|gray|titanium|bernina|selenite|graphite/i, 0x5E656E], [/blue|navy|storm/i, 0x1F4F8F], [/red|flame|misano|crimson/i, 0xB0121E],
  [/green|racing/i, 0x1C5A3A], [/yellow|gold/i, 0xE2B21C], [/orange/i, 0xE0661A], [/brown|bronze|beige/i, 0x7A5A3C]
];
const aBody = c => (/^(SUV|MPV)$/.test(c.body) ? 'an ' + c.body : 'a ' + c.body.toLowerCase());
const paintOf = c => { for(const [re, hex] of PAINT) if(re.test(c.color || '')) return hex; return 0x1B4266; };

/* side profiles (x: front to back in metres, y: up). Top outline only; arches are cut automatically. */
function profile(body){
  const P = {
    Sedan:     {L: 4.7, W: 1.84, r: .34, wb: [1.05, 3.85], nose: .66, tail: .78, top: [[.12,.78],[.9,.86],[1.6,.93],[3.95,.95],[4.55,.92]], cab: [[1.5,.92],[2.2,1.42],[3.3,1.43],[4.1,.95]]},
    Hatchback: {L: 4.05, W: 1.78, r: .33, wb: [.9, 3.35], nose: .68, tail: .9, top: [[.12,.8],[.8,.9],[1.3,.97],[3.8,.98],[3.98,.94]], cab: [[1.25,.96],[1.95,1.48],[3.45,1.5],[3.93,.98]]},
    SUV:       {L: 4.7, W: 1.9, r: .4, wb: [1.08, 3.85], nose: .9, tail: 1.0, top: [[.15,.98],[1.0,1.06],[1.5,1.1],[4.5,1.12],[4.66,1.08]], cab: [[1.45,1.08],[2.05,1.72],[4.25,1.73],[4.62,1.12]]},
    'Coupé':   {L: 4.6, W: 1.88, r: .35, wb: [1.1, 3.8], nose: .6, tail: .72, top: [[.12,.7],[1.0,.8],[1.7,.86],[3.95,.88],[4.48,.82]], cab: [[1.7,.85],[2.45,1.26],[3.15,1.27],[4.3,.86]]},
    Pickup:    {L: 5.3, W: 1.9, r: .4, wb: [1.15, 4.3], nose: .92, tail: 1.08, top: [[.15,1.02],[1.1,1.1],[3.1,1.12],[5.25,1.12]], cab: [[1.5,1.1],[2.08,1.8],[3.05,1.8],[3.15,1.12]], bed: [3.2, 5.28]},
    MPV:       {L: 4.8, W: 1.85, r: .36, wb: [1.0, 3.9], nose: .85, tail: 1.0, top: [[.15,.96],[1.0,1.04],[4.6,1.08],[4.78,1.04]], cab: [[1.3,1.04],[2.0,1.8],[4.55,1.8],[4.74,1.08]]}
  };
  return P[body] || (body === 'Van' ? P.MPV : body === 'Convertible' ? P['Coupé'] : P.Sedan);
}
function bodyGeometry(THREE, pr){
  const {L, r, wb, nose, tail, top} = pr, yc = r + .02, a = r + .07;
  const s = new THREE.Shape();
  s.moveTo(.28, yc);
  s.lineTo(.02, yc + .06);
  s.lineTo(0, nose);
  s.splineThru(top.map(([x, y]) => new THREE.Vector2(x, y)));
  s.lineTo(L, tail);
  s.lineTo(L - .02, yc + .06);
  s.lineTo(L - .28, yc);
  s.lineTo(wb[1] + a, yc); s.absarc(wb[1], yc, a, 0, Math.PI, false);
  s.lineTo(wb[0] + a, yc); s.absarc(wb[0], yc, a, 0, Math.PI, false);
  s.lineTo(.28, yc);
  const g = new THREE.ExtrudeGeometry(s, {depth: pr.W - .16, bevelEnabled: true, bevelThickness: .08, bevelSize: .07, bevelSegments: 6, curveSegments: 28});
  g.translate(-L / 2, 0, -(pr.W - .16) / 2);
  return g;
}
function cabinGeometry(THREE, pr){
  const c = pr.cab, s = new THREE.Shape();
  s.moveTo(c[0][0], c[0][1] - .04);
  s.splineThru(c.slice(1, -1).map(([x, y]) => new THREE.Vector2(x, y)));
  s.lineTo(c[c.length - 1][0], c[c.length - 1][1] - .04);
  s.lineTo(c[0][0], c[0][1] - .04);
  const d = pr.W * .78;
  const g = new THREE.ExtrudeGeometry(s, {depth: d, bevelEnabled: true, bevelThickness: .07, bevelSize: .06, bevelSegments: 6, curveSegments: 24});
  g.translate(-pr.L / 2, 0, -d / 2);
  return g;
}
function buildCar(THREE, c){
  const pr = profile(c.body), car = new THREE.Group(), M = [];
  const paint = new THREE.MeshPhysicalMaterial({color: paintOf(c), metalness: .55, roughness: .28, clearcoat: 1, clearcoatRoughness: .06});
  const glass = new THREE.MeshPhysicalMaterial({color: 0x22364d, metalness: .4, roughness: .04, clearcoat: 1, clearcoatRoughness: 0});
  const black = new THREE.MeshStandardMaterial({color: 0x0b0d10, roughness: .65});
  const tyre = new THREE.MeshStandardMaterial({color: 0x121314, roughness: .9});
  const rim = new THREE.MeshStandardMaterial({color: 0xc9ced6, metalness: 1, roughness: .22});
  const head = new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0xfff3d6, emissiveIntensity: .35});
  const tail = new THREE.MeshStandardMaterial({color: 0x550000, emissive: 0xff1e3c, emissiveIntensity: .6});
  M.push(paint, glass, black, tyre, rim, head, tail);
  const body = new THREE.Mesh(bodyGeometry(THREE, pr), paint); car.add(body);
  const cabin = new THREE.Mesh(cabinGeometry(THREE, pr), glass); car.add(cabin);
  if(pr.bed){ // pickup load bed: dark liner set into the deck, with a raised rim
    const bl = pr.bed[1] - pr.bed[0] - .2, bw = pr.W - .42, bx = -pr.L / 2 + pr.bed[0] + .1 + bl / 2;
    const liner = new THREE.Mesh(new THREE.BoxGeometry(bl, .03, bw), new THREE.MeshStandardMaterial({color: 0x1a1c20, roughness: .95})); liner.position.set(bx, 1.205, 0); car.add(liner);
    for(let k = 1; k < 7; k++){ const rib = new THREE.Mesh(new THREE.BoxGeometry(bl - .1, .02, .03), black); rib.position.set(bx, 1.225, -bw / 2 + k * bw / 7); car.add(rib); }
  }
  const z = pr.W / 2 - .02, belt = pr.top[0][1];
  // lights and grille
  [-1, 1].forEach(sd => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(.1, .09, .36), head); h.position.set(-pr.L / 2 - .04, pr.nose - .02, sd * (pr.W / 2 - .34)); car.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(.08, .08, .42), tail); t.position.set(pr.L / 2 + .04, pr.tail - .06, sd * (pr.W / 2 - .3)); car.add(t);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(.18, .1, .14), paint); mirror.position.set(-pr.L / 2 + pr.cab[0][0] + .22, belt + .06, sd * (pr.W / 2 + .03)); car.add(mirror);
  });
  const grille = new THREE.Mesh(new THREE.BoxGeometry(.06, .16, pr.W * .42), black); grille.position.set(-pr.L / 2 - .05, pr.nose - .14, 0); car.add(grille);
  // wheels
  const wheels = [];
  pr.wb.forEach(x => [-1, 1].forEach(sd => {
    const w = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(pr.r, pr.r, .25, 44), tyre); t.rotation.x = Math.PI / 2; w.add(t);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(pr.r * .66, pr.r * .66, .255, 40), rim); disc.rotation.x = Math.PI / 2; w.add(disc);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(pr.r * .16, pr.r * .16, .27, 20), black); hub.rotation.x = Math.PI / 2; w.add(hub);
    for(let k = 0; k < 5; k++){ const sp = new THREE.Mesh(new THREE.BoxGeometry(pr.r * 1.15, .06, .03), black); sp.rotation.z = k / 5 * Math.PI; sp.position.z = sd * .13; w.add(sp); }
    w.position.set(-pr.L / 2 + x, pr.r + .02, sd * (z - .1)); car.add(w); wheels.push(w);
  }));
  car.userData = {M, wheels, head, tail, pr};
  return car;
}
function shadowTex(THREE){
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(.55, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* one 3D stage per container; returns {dispose, lights(on), spin(on), reset()} */
async function stage3D(host, c, opts = {}){
  const {THREE, OrbitControls, RoomEnvironment} = await loadThree();
  const W = () => host.clientWidth, H = () => host.clientHeight;
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(W(), H());
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer), envTex = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environment = envTex;
  const cam = new THREE.PerspectiveCamera(30, W() / H(), .1, 100);
  cam.position.set(9, 4, 9);
  const ctl = new OrbitControls(cam, renderer.domElement);
  Object.assign(ctl, {enableDamping: true, dampingFactor: .08, enablePan: false, minDistance: 5.2, maxDistance: 12, maxPolarAngle: 1.42, minPolarAngle: .3, autoRotate: !reduced, autoRotateSpeed: 1.6});
  const D = () => 7.6 * Math.max(1, 1.12 / cam.aspect), TY = () => cam.aspect < .9 ? -.55 : .7;
  const fit = () => { ctl.maxDistance = D() * 1.6; ctl.target.set(0, TY(), 0); };
  fit();
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 7, 3); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x0a1f33, .35));
  // turntable
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4.3, 80), new THREE.MeshStandardMaterial({color: 0x0b1c2e, metalness: 0, roughness: .85, envMapIntensity: .25}));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const ring = new THREE.Mesh(new THREE.RingGeometry(4.12, 4.18, 96), new THREE.MeshBasicMaterial({color: 0xC8102E}));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .002; scene.add(ring);
  const car = buildCar(THREE, c); scene.add(car);
  const pr = car.userData.pr;
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(pr.L * 1.35, pr.W * 1.9), new THREE.MeshBasicMaterial({map: shadowTex(THREE), transparent: true, depthWrite: false}));
  sh.rotation.x = -Math.PI / 2; sh.position.y = .004; scene.add(sh);
  // headlight beams (off until switched on)
  const beams = [-1, 1].map(sd => { const s = new THREE.SpotLight(0xfff1d0, 0, 14, .42, .6, 1.2); s.position.set(-pr.L / 2 - .1, pr.nose, sd * (pr.W / 2 - .34)); s.target.position.set(-pr.L / 2 - 6, 0, sd * .8); scene.add(s, s.target); return s; });
  let lightsOn = false, alive = true, t0 = performance.now(), idleT = 0, raf = 0, visible = true;
  ctl.addEventListener('start', () => { ctl.autoRotate = false; clearTimeout(idleT); host.classList.add('touched'); });
  ctl.addEventListener('end', () => { clearTimeout(idleT); if(!reduced && opts.spinOn !== false) idleT = setTimeout(() => ctl.autoRotate = true, 3500); });
  const ro = new ResizeObserver(() => { if(!W() || !H()) return; renderer.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); fit(); dirty = true; });
  ro.observe(host);
  const io2 = new IntersectionObserver(es => { visible = es[0].isIntersecting; if(visible && !raf) loop(); }); io2.observe(host);
  const ease = x => 1 - Math.pow(1 - x, 3);
  let dirty = true, slow = 0, frames = 0, pr0 = renderer.getPixelRatio();
  ctl.addEventListener('change', () => dirty = true);
  function loop(){
    raf = 0; if(!alive || !visible) return;
    const t = Math.min(1, (performance.now() - t0) / 1600), f0 = performance.now();
    if(t < 1 && !reduced){ // intro: car drops onto the turntable while the camera swings in
      const e = ease(t);
      car.position.y = (1 - e) * .9 * Math.abs(Math.cos(t * 7)) * (1 - t);
      const ang = .8 + (1 - e) * 1.4, dist = D() + (1 - e) * 4;
      cam.position.set(Math.sin(ang) * dist, 2.2 + (1 - e) * 2, Math.cos(ang) * dist);
      dirty = true;
    } else car.position.y = 0;
    ctl.update();
    if(dirty || ctl.autoRotate){
      renderer.render(scene, cam); dirty = false;
      // weak GPU? drop the resolution rather than stutter
      if(++frames > 4 && frames < 60){ if(performance.now() - f0 > 34) slow++; if(slow > 6 && pr0 > .75){ pr0 = Math.max(.75, pr0 - .5); renderer.setPixelRatio(pr0); renderer.setSize(W(), H()); slow = 0; } }
    }
    raf = requestAnimationFrame(loop);
  }
  if(reduced){ cam.position.set(Math.sin(.8) * D(), 2.2, Math.cos(.8) * D()); }
  loop();
  return {
    lights(on){ lightsOn = on; car.userData.head.emissiveIntensity = on ? 4 : .35; car.userData.tail.emissiveIntensity = on ? 2.4 : .6; beams.forEach(b => b.intensity = on ? 60 : 0); key.intensity = on ? .35 : 1.6; scene.environmentIntensity = on ? .25 : 1; floor.material.color.set(on ? 0x07111c : 0x0b1c2e); dirty = true; },
    spin(on){ ctl.autoRotate = on; opts.spinOn = on; },
    reset(){ t0 = performance.now() - 1600; cam.position.set(Math.sin(.8) * D(), 2.2, Math.cos(.8) * D()); fit(); ctl.update(); dirty = true; },
    dispose(){
      alive = false; cancelAnimationFrame(raf); ro.disconnect(); io2.disconnect(); ctl.dispose(); clearTimeout(idleT);
      scene.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material){ [].concat(o.material).forEach(m => { if(m.map) m.map.dispose(); m.dispose(); }); } });
      envTex.dispose(); pm.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    }
  };
}

/* real 360° spin from walk-around photos */
function spinStage(host, frames){
  host.innerHTML = `<img class="spin-img" alt="" draggable="false"><div class="spin-bar"><i></i></div>`;
  const img = host.querySelector('img'), bar = host.querySelector('.spin-bar i');
  const n = frames.length; let k = 0, raf = 0, auto = !reduced, start = null, last = 0, alive = true;
  frames.forEach(f => { const im = new Image(); im.src = U(f, 1200); });
  const show = i => { k = ((Math.round(i) % n) + n) % n; img.src = U(frames[k], 1200); bar.style.width = ((k + 1) / n * 100) + '%'; };
  show(0);
  const intro = t => { if(!alive || !auto) return; if(!last) last = t; if(t - last > 70){ last = t; show(k + 1); if(k === 0){ auto = false; return; } } raf = requestAnimationFrame(intro); };
  raf = requestAnimationFrame(intro);
  host.addEventListener('pointerdown', e => { auto = false; start = {x: e.clientX, k}; host.setPointerCapture(e.pointerId); host.classList.add('touched'); });
  host.addEventListener('pointermove', e => { if(!start) return; show(start.k - (e.clientX - start.x) / (host.clientWidth / n / 1.2)); });
  const end = () => start = null; host.addEventListener('pointerup', end); host.addEventListener('pointercancel', end);
  return {dispose(){ alive = false; cancelAnimationFrame(raf); host.innerHTML = ''; }, lights(){}, spin(on){}, reset(){ show(0); }};
}

/* car page: Photos | 3D 360° | Real spin */
let S3 = null, S3mode = 'photos';
function setViewMode(mode){
  const c = cur.car; if(!c) return;
  if(S3){ S3.dispose(); S3 = null; }
  S3mode = mode;
  $$('#vModes button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === mode));
  const host = $('#v3dStage'), box = $('#v3d');
  $('#viewer').hidden = mode !== 'photos'; $('#vThumbs').hidden = mode !== 'photos'; box.hidden = mode === 'photos';
  box.classList.remove('touched'); host.classList.remove('touched');
  $('#v3dTools').hidden = mode !== '3d'; $('#v3dNote').hidden = mode === 'photos';
  if(mode === 'photos') return;
  if(mode === 'spin'){ $('#v3dNote').textContent = `Real photos of this car. Drag to turn it.`; S3 = spinStage(host, c.spin); return; }
  $('#v3dNote').textContent = `3D model of ${aBody(c)} in ${c.color ? c.color.toLowerCase() : 'V8 navy (colour on request)'}. The shape is representative; the photos show this exact car.`;
  box.classList.add('loading');
  const want = c.id;
  stage3D(host, c).then(s => { if(cur.car && cur.car.id === want && S3mode === '3d'){ S3 = s; box.classList.remove('loading'); $('#v3dLights').setAttribute('aria-pressed', 'false'); $('#v3dSpin').setAttribute('aria-pressed', String(!reduced)); } else s.dispose(); })
    .catch(err => { box.classList.remove('loading'); host.innerHTML = `<p class="v3d-err">The 3D view needs a browser with WebGL. Showing photos instead.</p>`; setTimeout(() => S3mode === '3d' && setViewMode('photos'), 2500); });
}
$('#vModes').addEventListener('click', e => { const b = e.target.closest('button[data-mode]'); if(b && b.dataset.mode !== S3mode) setViewMode(b.dataset.mode); });
$('#v3dLights').addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); S3 && S3.lights(on); });
$('#v3dSpin').addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); S3 && S3.spin(on); });
$('#v3dReset').addEventListener('click', () => S3 && S3.reset());

function reset3D(c){
  if(S3){ S3.dispose(); S3 = null; }
  S3mode = 'photos';
  $$('#vModes button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === 'photos'));
  $('#viewer').hidden = false; $('#vThumbs').hidden = false; $('#v3d').hidden = true; $('#v3dNote').hidden = true;
  $('#vModeSpin').hidden = !(c && c.spin && c.spin.length >= 8);
  if(c && !T3 && 'requestIdleCallback' in window) requestIdleCallback(() => loadThree().catch(() => {}), {timeout: 4000});
}
/* quick 3D view straight from the catalogue */
let QV = null;
async function openQuick3D(c){
  const d = $('#qv');
  $('#qvTitle').textContent = `${c.year} ${c.make} ${c.model}`;
  $('#qvMeta').textContent = `${c.variant}. ${kmTxt(c)}, ${c.fuel.toLowerCase()}, ${c.trans.toLowerCase()}.`;
  $('#qvPrice').textContent = rs(c.price);
  $('#qvGo').href = '#/car/' + c.id;
  $('#qvNote').textContent = c.spin && c.spin.length >= 8 ? 'Real photos of this car. Drag to turn it.' : `3D model of ${aBody(c)} in ${c.color ? c.color.toLowerCase() : 'V8 navy'}. Drag to turn, scroll or pinch to zoom.`;
  d.showModal ? d.showModal() : d.setAttribute('open', '');
  const host = $('#qvStage'); host.innerHTML = ''; host.classList.remove('touched');
  d.classList.add('loading');
  try{ QV = c.spin && c.spin.length >= 8 ? spinStage(host, c.spin) : await stage3D(host, c); }
  catch(e){ host.innerHTML = '<p class="v3d-err">The 3D view needs a browser with WebGL.</p>'; }
  d.classList.remove('loading');
  track('view_3d', {car: ref(c)});
}
function closeQuick3D(){ if(QV){ QV.dispose(); QV = null; } const d = $('#qv'); if(d.open) d.close(); }
$('#qvClose').addEventListener('click', closeQuick3D);
$('#qv').addEventListener('close', () => { if(QV){ QV.dispose(); QV = null; } });
$('#qv').addEventListener('click', e => { if(e.target === $('#qv')) closeQuick3D(); });
$('#qvGo').addEventListener('click', () => closeQuick3D());
document.addEventListener('click', e => { const b = e.target.closest('.card-3d'); if(!b) return; e.preventDefault(); e.stopPropagation(); const c = byId.get(+b.dataset.id); if(c) openQuick3D(c); }, true);
