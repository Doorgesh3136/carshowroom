/* ════════════════════ MOTION: GSAP + ScrollTrigger + smooth scroll ════════════════════
   build.py drops this file into app.js right after `const cur`.
   All of it is optional: if GSAP does not load, or the visitor asks for reduced motion,
   the site works the same, just without these effects. */
const G = window.gsap, ST = window.ScrollTrigger;
const MOTION = !!(G && ST) && !reduced;
const M = {ctx: null, mm: null, smooth: null, mount(){}, wipe: null, tabFx(){}, cardsIn: null};
if(MOTION){
  G.registerPlugin(ST);
  document.documentElement.classList.add('js-motion');
  ST.config({ignoreMobileResize: true});
}

/* ───────── split text ───────── */
function splitText(el, cls, inner){
  if(el.dataset.split) return; el.dataset.split = '1';
  const walk = n => [...n.childNodes].forEach(c => {
    if(c.nodeType === 3){
      const f = document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(t => {
        if(!t) return;
        if(/^\s+$/.test(t)){ f.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span'); w.className = cls;
        if(inner){ const i = document.createElement('span'); i.className = 'i'; i.textContent = t; w.appendChild(i); } else w.textContent = t;
        f.appendChild(w);
      });
      c.replaceWith(f);
    } else if(c.nodeType === 1 && !c.classList.contains(cls)) walk(c);
  });
  walk(el);
}
if(MOTION){
  // h2s on content pages become masked words; the catalogue's headings change text, so they stay whole
  $$('.view:not([data-view="inventory"]) h2').forEach(h => splitText(h, 'w', true));
  $$('[data-scrub]').forEach(p => splitText(p, 'sw', false));
}

/* ───────── smooth wheel scrolling (lerped, like Lenis) ───────── */
M.smooth = (function(){
  if(!MOTION || !fine) return null;
  const html = document.documentElement; html.classList.add('has-smooth');
  let target = scrollY, pos = scrollY, last = scrollY, raf = 0;
  const max = () => html.scrollHeight - innerHeight;
  const locked = () => document.body.classList.contains('lock') || document.querySelector('dialog[open]') || !$('#menu').hidden;
  // let inner scroll boxes (filters, compare table) scroll themselves
  const inner = (el, dy) => {
    for(let n = el; n && n.nodeType === 1 && n !== document.body; n = n.parentElement){
      const oy = getComputedStyle(n).overflowY;
      if((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1){
        if(dy > 0 ? n.scrollTop + n.clientHeight < n.scrollHeight - 1 : n.scrollTop > 0) return true;
      }
    }
    return false;
  };
  function tick(){
    pos += (target - pos) * .095;
    if(Math.abs(target - pos) < .35) pos = target;
    last = pos; scrollTo(0, pos);
    raf = pos === target ? 0 : requestAnimationFrame(tick);
  }
  addEventListener('wheel', e => {
    if(e.ctrlKey || e.defaultPrevented || locked()) return;
    if(Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if(inner(e.target, e.deltaY)) return;
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    if(!raf){ pos = target = scrollY; }
    target = Math.max(0, Math.min(max(), target + d));
    if(!raf) raf = requestAnimationFrame(tick);
  }, {passive: false});
  // keys, the scrollbar, links and the site's own scrollTo() calls: follow the real position
  addEventListener('scroll', () => {
    if(!raf){ pos = target = scrollY; return; }
    if(Math.abs(scrollY - last) > 3){ cancelAnimationFrame(raf); raf = 0; pos = target = scrollY; }
  }, {passive: true});
  return {stop(){ cancelAnimationFrame(raf); raf = 0; pos = target = scrollY; }};
})();

/* ───────── per page: build the scroll scenes, tear them down on leave ───────── */
function buildScenes(view, R){
  const home = R.r.v === 'home';

  // home: body types become a pinned, sideways scene on wide screens
  if(home){
    M.mm = G.matchMedia();
    M.mm.add('(min-width: 900px)', () => {
      const sec = $('#typesSec'), rail = $('#typeRail');
      document.documentElement.classList.add('js-pin');
      rail.scrollLeft = 0;
      const dist = () => Math.max(0, rail.scrollWidth - rail.clientWidth + 48);
      const tl = G.timeline({scrollTrigger: {trigger: sec, start: 'top top', end: () => '+=' + Math.round(dist() * 1.15), pin: true, scrub: .9, invalidateOnRefresh: true, anticipatePin: 1}});
      tl.to(rail, {x: () => -dist(), ease: 'none'}, 0).fromTo('#typesBar', {scaleX: 0}, {scaleX: 1, ease: 'none'}, 0);
      $$('.type-in > div', rail).forEach((t, i) => tl.fromTo(t, {x: 50 + i * 12}, {x: 0, ease: 'none'}, 0));
      $$('.type img', rail).forEach(im => tl.fromTo(im, {objectPosition: '20% 50%'}, {objectPosition: '80% 50%', ease: 'none'}, 0));
      return () => document.documentElement.classList.remove('js-pin');
    });
  }
  // (pins first: ScrollTrigger needs scenes created top to bottom so later ones include the pin's length)

  // headlines: words slide up out of their masks
  $$('h2', view).forEach(h => {
    const w = $$('.w > .i', h); if(!w.length) return;
    G.set(w, {yPercent: 115});
    ST.create({trigger: h, start: 'top 88%', once: true, onEnter: () => G.to(w, {yPercent: 0, duration: 1.3, stagger: .055, ease: 'expo.out'})});
  });

  // statement paragraph lights up word by word with the scroll
  $$('[data-scrub]', view).forEach(p => {
    G.fromTo($$('.sw', p), {opacity: .14}, {opacity: 1, stagger: .1, ease: 'none', scrollTrigger: {trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true}});
  });

  // cards, steps, facts and stats rise in, in batches as they arrive
  const rise = $$('.cars-rail .card, .steps li, .mani-facts > div, .stats > div, .team li, .rv, .c-item, .sales a, .about-cols > *', view);
  rise.forEach(el => { el.classList.add('m-rise'); el.classList.remove('in'); });
  if(rise.length){
    G.set(rise, {'--rise': 70, opacity: 0});
    ST.batch(rise, {start: 'top 92%', once: true, onEnter: b => {
      b.forEach(x => x.classList.add('in'));
      G.to(b, {'--rise': 0, opacity: 1, duration: 1.2, stagger: .08, ease: 'expo.out', overwrite: true});
    }});
  }
  // payment cards pop in with a little overshoot
  const pay = $$('.pay-list > div', view);
  pay.forEach(el => { el.classList.add('m-rise'); el.classList.remove('in'); });
  if(pay.length){
    G.set(pay, {'--rise': 50, '--rs': .86, opacity: 0});
    ST.batch(pay, {start: 'top 90%', once: true, onEnter: b => {
      b.forEach(x => x.classList.add('in'));
      G.to(b, {'--rise': 0, '--rs': 1, opacity: 1, duration: 1.1, stagger: .1, ease: 'back.out(1.7)', overwrite: true});
    }});
  }

  // photos drift inside their frames
  $$('.how-media img, .sell-pic img, .about-pic img, .pay-pic img, .mp img', view).forEach(img => {
    G.fromTo(img, {yPercent: -7, scale: 1.16}, {yPercent: 7, scale: 1.16, ease: 'none', scrollTrigger: {trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true}});
  });

  // marquees: drift on their own, race with your scroll, flip direction when you scroll back up
  $$('.brands-track, .bigline-track', view).forEach(tr => {
    tr.style.animation = 'none';
    const big = tr.classList.contains('bigline-track'), base = big ? 1 : -1;
    const tw = G.fromTo(tr, {xPercent: 0}, {xPercent: -50, duration: big ? 30 : 42, ease: 'none', repeat: -1});
    tw.totalTime(tw.duration() * 50);
    let dir = base, back = null;
    tw.timeScale(base);
    ST.create({trigger: tr, start: 'top bottom', end: 'bottom top',
      onToggle: s => s.isActive ? tw.resume() : tw.pause(),
      onUpdate: s => {
        const v = s.getVelocity(); if(!v) return;
        dir = (v > 0 ? 1 : -1) * base;
        G.to(tw, {timeScale: dir * (1 + Math.min(Math.abs(v) / 240, 8)), duration: .25, overwrite: true});
        if(back) back.kill();
        back = G.delayedCall(.2, () => G.to(tw, {timeScale: dir, duration: 1.2, ease: 'power2.out', overwrite: true}));
      }});
  });

  // hero: the photo sinks and the frame tucks into a rounded card as you scroll away
  if(home){
    const photoHero = !document.documentElement.classList.contains('can-3d');
    G.timeline({scrollTrigger: {trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true}})
      .fromTo('#hero', {clipPath: 'inset(0% 0% 0% 0% round 0px)'}, {clipPath: photoHero ? 'inset(0% 2.5% 6% 2.5% round 28px)' : 'inset(0% 0% 0% 0% round 0px)', ease: 'none'}, 0)
      .fromTo('#heroSlides', {'--hy': 0}, {'--hy': 220, ease: 'none'}, 0)
      .fromTo('.hero-in', {y: 0, opacity: 1}, {y: -140, opacity: 0, ease: 'none'}, 0)
      .fromTo('.hero-foot', {y: 0}, {y: -60, ease: 'none'}, 0);
  }

  // page header photos (sell, about, contact) drift behind the title
  $$('.phead-bg', view).forEach(bg => {
    G.fromTo(bg, {'--py': 0}, {'--py': 18, ease: 'none', scrollTrigger: {trigger: bg.parentElement, start: 'top top', end: 'bottom top', scrub: true}});
  });

  // car page: the gallery trails the page slightly
  $$('#viewer', view).forEach(v => {
    G.fromTo(v, {y: 0}, {y: 60, ease: 'none', scrollTrigger: {trigger: v, start: 'top 20%', end: 'bottom top', scrub: true}});
  });

  // the two statement photos drift at different speeds
  $$('.mp1', view).forEach(el => G.fromTo(el, {y: 60}, {y: -80, ease: 'none', scrollTrigger: {trigger: el, start: 'top bottom', end: 'bottom top', scrub: true}}));
  $$('.mp2', view).forEach(el => G.fromTo(el, {y: 140}, {y: -140, ease: 'none', scrollTrigger: {trigger: el, start: 'top bottom', end: 'bottom top', scrub: true}}));

  // statement band: big words drift apart as it passes
  $$('.mani-t', view).forEach(t => G.fromTo(t, {y: 60}, {y: -60, ease: 'none', scrollTrigger: {trigger: t, start: 'top bottom', end: 'bottom top', scrub: true}}));

  // photos: card pictures wipe up out of a mask and settle from a slight zoom
  const media = $$('.cars-rail .card-media, .grid .card-media', view);
  if(media.length){
    G.set(media, {clipPath: 'inset(100% 0% 0% 0% round 0px)'});
    G.set(media.map(m => $('img', m)).filter(Boolean), {'--iz': 1.35});
    ST.batch(media, {start: 'top 95%', once: true, onEnter: b => {
      G.to(b, {clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.2, stagger: .08, ease: 'expo.inOut', clearProps: 'clipPath'});
      G.to(b.map(m => $('img', m)).filter(Boolean), {'--iz': 1, duration: 1.8, stagger: .08, ease: 'expo.out'});
    }});
  }
  // body-type tiles rise out of a mask one after another
  const tiles = $$('.types .type', view);
  if(tiles.length){
    G.fromTo(tiles, {clipPath: 'inset(100% 0% 0% 0% round 18px)'}, {clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.3, stagger: .09, ease: 'expo.inOut', clearProps: 'clipPath',
      scrollTrigger: {trigger: '#typeRail', start: 'top 85%', once: true}});
  }
  // car gallery: the photo opens like a shutter, thumbnails follow
  if(R.r.v === 'car'){
    const pnl = $('#vRing .v-panel img'), th = $$('#vThumbs button', view);
    G.fromTo('#viewer', {clipPath: 'inset(0% 50% 0% 50% round 18px)'}, {clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.2, ease: 'expo.inOut', delay: .1, clearProps: 'clipPath'});
    if(pnl) G.fromTo(pnl, {scale: 1.3}, {scale: 1, duration: 1.8, ease: 'expo.out', delay: .1, clearProps: 'transform'});
    G.fromTo(th, {autoAlpha: 0, y: 20}, {autoAlpha: 1, y: 0, duration: .8, stagger: .05, ease: 'expo.out', delay: .5, clearProps: 'all'});
  }

  // journey chapters tip up out of depth as each one arrives (the camera does the rest)
  $$('.jr-step', view).forEach(stp => {
    const kids = [...stp.children].filter(k => !k.matches('h2'));
    G.fromTo(kids, {autoAlpha: 0, y: 70, rotationX: -38, transformPerspective: 900, transformOrigin: '50% 100%'},
      {autoAlpha: 1, y: 0, rotationX: 0, duration: 1.2, stagger: .08, ease: 'expo.out', clearProps: 'transform',
       scrollTrigger: {trigger: stp, start: 'top 62%', toggleActions: 'play none none reverse'}});
  });

  // catalogue: cards flip up out of depth as they arrive; the whole grid leans back with the scroll speed
  if(R.r.v === 'inventory'){
    const grid = $('#invGrid');
    M.cardsIn = () => {
      const cards = $$('.card:not(.in3d)', grid);
      cards.forEach(c => c.classList.add('in3d'));
      ST.batch(cards, {start: 'top 96%', once: true, onEnter: b => G.fromTo(b,
        {autoAlpha: 0, y: 120, z: -260, rotationX: 48, transformPerspective: 1100, transformOrigin: '50% 100%'},
        {autoAlpha: 1, y: 0, z: 0, rotationX: 0, duration: 1.3, stagger: .07, ease: 'expo.out', clearProps: 'transform,opacity,visibility'})});
    };
    M.cardsIn();
    G.set(grid, {transformPerspective: 1600, transformOrigin: '50% 30%'});
    const lean = G.quickTo(grid, 'rotationX', {duration: .6, ease: 'power3'}), sink = G.quickTo(grid, 'z', {duration: .6, ease: 'power3'});
    let back = null;
    ST.create({trigger: grid, start: 'top bottom', end: 'bottom top', onUpdate: s => {
      const v = Math.max(-1, Math.min(1, s.getVelocity() / 3000));
      lean(v * 9); sink(-Math.abs(v) * 140);
      if(back) back.kill();
      back = G.delayedCall(.12, () => { lean(0); sink(0); });
    }});
  }

  // body types: tiles curve round like a carousel as the row slides past (cover flow)
  if(home){
    const tiles = $$('.types .type', view);
    const flow = () => {
      const mid = innerWidth / 2;
      tiles.forEach(t => {
        const r = t.getBoundingClientRect(), d = Math.max(-1.4, Math.min(1.4, (r.left + r.width / 2 - mid) / mid));
        t.style.setProperty('--cy', (-d * 26).toFixed(2));
        t.style.setProperty('--cz', (-Math.abs(d) * 120).toFixed(1));
      });
    };
    ST.create({trigger: '#typesSec', start: 'top bottom', end: 'bottom top', onUpdate: flow, onRefresh: flow});
    $('#typeRail').addEventListener('scroll', flow, {passive: true});
  }

  // the car page: buy box steps in
  if(R.r.v === 'car'){
    const k = $$('.car-r > *', view);
    k.forEach(el => el.classList.add('m-rise'));
    G.fromTo(k, {'--rise': 36, opacity: 0}, {'--rise': 0, opacity: 1, duration: 1, stagger: .06, ease: 'expo.out', delay: .15});
  }

}

M.mount = function(view, R){
  if(!MOTION) return;
  if(M.mm){ M.mm.revert(); M.mm = null; }
  if(M.ctx){ M.ctx.revert(); M.ctx = null; }
  if(M.smooth) M.smooth.stop();
  $('#hdr').classList.remove('hide');
  M.ctx = G.context(() => buildScenes(view, R));
  requestAnimationFrame(() => ST.refresh());
};

/* ───────── page change in 3D: the page you are on swings away into depth while the studio dims, the next
   page's name passes in front, and the new page swings in out of the depth from the other side ───────── */
M.wipe = async function(R, doMount){
  const w = $('#wipe'), cols = $$('#wipe > i'), lab = $('.w-label'), bar = $('.w-bar'), name = $('#wipeName');
  const txt = R.key === 'car' ? `${R.car.make} ${R.car.model}` : R.r.n;
  name.innerHTML = [...txt].map(ch => `<span class="ch">${ch === ' ' ? ' ' : esc(ch)}</span>`).join('');
  $('#wipeIdx').textContent = R.key === 'car' ? `${R.car.year}, ${rs(R.car.price)}` : 'V8 Motors';
  let sk = $('.w-streaks', w);
  if(!sk){ sk = document.createElement('div'); sk.className = 'w-streaks'; sk.innerHTML = '<span></span>'.repeat(16); w.appendChild(sk); }
  const lines = $$('span', sk), chs = $$('.ch', name), old = $('.view.on'), main = $('#main');
  // the viewport is the stage: pages turn about a vertical axis in front of you
  const stage = () => G.set(main, {perspective: 1300, perspectiveOrigin: `50% ${scrollY + innerHeight / 2}px`});
  stage();
  w.classList.add('on');
  G.set(cols, {display: 'none'});
  G.set(w, {backgroundColor: 'rgba(8,17,12,0)'});
  G.set(lab, {opacity: 0}); G.set(chs, {x: 140, skewX: -20, opacity: 0}); G.set(bar, {scaleX: 0, transformOrigin: 'right center'});
  G.set(lines, {top: () => (8 + Math.random() * 84) + '%', x: () => innerWidth * (1.1 + Math.random() * .4), opacity: () => .35 + Math.random() * .65, scaleX: () => .5 + Math.random()});
  G.to(lines, {x: () => -innerWidth * (.5 + Math.random() * .4), duration: () => .5 + Math.random() * .35, ease: 'power2.in', stagger: {each: .02, from: 'random'}});
  await G.timeline()
    .to(w, {backgroundColor: 'rgba(8,17,12,.8)', duration: .55, ease: 'power2.in'}, 0)
    .to(old, {rotationY: 30, z: -760, x: -240, opacity: .3, transformOrigin: '0% 50%', duration: .62, ease: 'expo.in'}, 0)
    .to(lab, {opacity: 1, duration: .25}, .28)
    .to(chs, {x: 0, skewX: 0, opacity: 1, duration: .5, stagger: .018, ease: 'expo.out'}, '<')
    .to(bar, {scaleX: 1, duration: .45, ease: 'expo.out'}, '<')
    .then();
  G.set(old, {clearProps: 'transform,opacity'});
  doMount();
  // the new page swings in from the right (not awaited, so clicks work at once)
  stage();
  G.fromTo($('.view.on'), {rotationY: -26, z: -700, x: 260, opacity: .2, transformOrigin: '100% 50%'},
    {rotationY: 0, z: 0, x: 0, opacity: 1, duration: 1.2, ease: 'expo.out', delay: .1, clearProps: 'transform,opacity',
     onComplete: () => { G.set(main, {clearProps: 'perspective,perspectiveOrigin'}); ST.refresh(); }});
  await G.timeline()
    .to(chs, {x: -120, skewX: 20, opacity: 0, duration: .32, stagger: .012, ease: 'expo.in'})
    .to(bar, {scaleX: 0, transformOrigin: 'left center', duration: .28, ease: 'expo.in'}, '<')
    .to(lab, {opacity: 0, duration: .25}, '<')
    .to(w, {backgroundColor: 'rgba(8,17,12,0)', duration: .6, ease: 'power2.out'}, '-=.15')
    .then();
  w.classList.remove('on');
  G.set([...cols, lab, bar, ...lines, w], {clearProps: 'all'});
};

/* ───────── car tabs: what each tab does as it opens ───────── */
M.tabFx = function(name, pane){
  if(!MOTION) return;
  // anything a previous tab left half-animated goes back to normal
  if(M.touched) G.set(M.touched, {clearProps: 'opacity,visibility,transform,scale'});
  M.touched = $$('#carSpec > div, #carFeat li, .calc > *, .rc > *');
  if(name === 'sp'){
    // spec rows slide in from alternate sides; numbers count up
    const rows = $$('#carSpec > div', pane);
    G.fromTo(rows, {autoAlpha: 0, x: i => i % 2 ? 26 : -26}, {autoAlpha: 1, x: 0, duration: .7, stagger: .035, ease: 'expo.out', clearProps: 'all'});
    rows.forEach((r, i) => {
      const dd = $('dd', r), m = dd && /^([\d,]+)(\D*)$/.exec(dd.textContent.trim());
      if(!m) return;
      const to = +m[1].replace(/,/g, ''), year = to > 1900 && to < 2100 && !m[1].includes(','), o = {v: year ? to - 12 : 0};
      G.to(o, {v: to, duration: 1.1, delay: .15 + i * .035, ease: 'power3.out', onUpdate: () => dd.textContent = (year ? Math.round(o.v) : fmt(o.v)) + m[2]});
    });
  }
  if(name === 'ft'){
    // features tick in one by one
    const ul = $('#carFeat', pane), li = $$('li:not(.feat-note)', ul);
    li.forEach(x => x.classList.remove('in')); ul.classList.add('fx');
    G.fromTo(li, {autoAlpha: 0, x: -18}, {autoAlpha: 1, x: 0, duration: .6, ease: 'expo.out', clearProps: 'opacity,visibility,transform',
      stagger: {each: .045, onStart(){ this.targets()[0].classList.add('in'); }}, onComplete: () => ul.classList.remove('fx')});
  }
  if(name === 'fi' || name === 'rc'){
    G.fromTo($$('.calc > *, .rc > *', pane), {autoAlpha: 0, scale: .96}, {autoAlpha: 1, scale: 1, duration: .7, stagger: .06, ease: 'back.out(1.6)', clearProps: 'all'});
  }
};

/* ───────── always-on pieces (not tied to one page) ───────── */
if(MOTION){
  // header hides while you read downwards, returns when you scroll up
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY; if(Math.abs(y - lastY) < 6) return;
    $('#hdr').classList.toggle('hide', y > lastY && y > 420 && $('#menu').hidden && !document.body.classList.contains('lock'));
    lastY = y;
  }, {passive: true});

  // footer wordmark rises as you reach the end
  G.fromTo('.ftr-mark span', {yPercent: 75}, {yPercent: 0, ease: 'none', scrollTrigger: {trigger: '.ftr', start: 'top bottom', end: 'bottom bottom', scrub: true}});

  // monthly figure pops when the sliders move
  ['#cDep', '#cTerm', '#cTrade'].forEach(id => $(id) && $(id).addEventListener('input', () => G.fromTo('#cOut', {y: -8, color: '#8C6A2C'}, {y: 0, color: '', duration: .45, ease: 'back.out(2)', overwrite: true, clearProps: 'transform,color'})));

  // page height changes (show more, filters, images): keep every scene lined up
  let rt = 0;
  new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => ST.refresh(), 200); }).observe(document.body);
}

if(MOTION && fine){
  // depth: layers inside these blocks drift against the pointer (numbers are pixels at the edge)
  const DEPTH = {
    '#hero': [['#heroSlides', -26], ['.hero-h', 14], ['.hero-p', 8], ['.hero-foot', 5]],
    '.mani-pics': [['.mp1', -16], ['.mp2', 26]],
    '.how-media': [['img', -18]], '.sell-pic': [['img', -18]], '.about-pic': [['img', -18]], '.pay-pic': [['img', -18]],
    '.visit': [['h2', 12], ['.sales', -8]],
    '.deals-sec': [['.sec-head', 10]]
  };
  const qd = new Map();
  const mover = el => {
    let m = qd.get(el);
    if(!m){ el.classList.add('dp'); m = {x: G.quickTo(el, '--dx', {duration: 1, ease: 'power3'}), y: G.quickTo(el, '--dy', {duration: 1, ease: 'power3'})}; qd.set(el, m); }
    return m;
  };
  let act = null;
  document.addEventListener('pointermove', e => {
    const t = e.target; if(!t.closest) return;
    let host = null, key = null;
    for(const k in DEPTH){ const h = t.closest(k); if(h){ host = h; key = k; break; } }
    if(act && act.host !== host){ act.items.forEach(([el]) => { const m = mover(el); m.x(0); m.y(0); }); act = null; }
    if(!host) return;
    if(!act) act = {host, items: DEPTH[key].map(([sel, d]) => [host.querySelector(sel), d]).filter(x => x[0])};
    const r = host.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
    act.items.forEach(([el, d]) => { const m = mover(el); m.x(nx * d); m.y(ny * d); });
  }, {passive: true});

  // body-type tiles lean toward the pointer
  let tiltEl2 = null;
  document.addEventListener('pointermove', e => {
    const tile = e.target.closest ? e.target.closest('.types .type') : null;
    if(tile !== tiltEl2){ if(tiltEl2) G.to(tiltEl2, {'--trx': 0, '--try': 0, duration: .9, ease: 'power3'}); tiltEl2 = tile; }
    if(!tile) return;
    const r = tile.getBoundingClientRect();
    G.to(tile, {'--try': ((e.clientX - r.left) / r.width - .5) * 12, '--trx': (.5 - (e.clientY - r.top) / r.height) * 10, duration: .5, ease: 'power3', overwrite: true});
  }, {passive: true});

  // footer wordmark: letters near the pointer lift up
  const fm = $('.ftr-mark span');
  if(fm){
    fm.innerHTML = [...fm.textContent].map(ch => `<i class="fl">${ch === ' ' ? '&nbsp;' : esc(ch)}</i>`).join('');
    const fl = $$('.fl', fm).map(el => ({el, q: G.quickTo(el, '--ly', {duration: .7, ease: 'power3'})}));
    $('.ftr').addEventListener('pointermove', e => fl.forEach(({el, q}) => {
      const r = el.getBoundingClientRect(), d = Math.hypot(e.clientX - (r.left + r.width / 2), (e.clientY - (r.top + r.height / 2)) * .6);
      q(-Math.max(0, 1 - d / 320) * 46);
    }), {passive: true});
    $('.ftr').addEventListener('pointerleave', () => fl.forEach(({q}) => q(0)));
  }

  // magnetic buttons
  const MAG = '.btn-lg, .hdr-cta, .qs-go, .round-btn, .type-go, .fab, .totop';
  let magEl = null;
  document.addEventListener('pointermove', e => {
    const b = e.target.closest ? e.target.closest(MAG) : null;
    if(b !== magEl){
      if(magEl) G.to(magEl, {'--mx': 0, '--my': 0, duration: 1, ease: 'elastic.out(1,.4)', overwrite: true});
      magEl = b; if(b) b.classList.add('mag');
    }
    if(!b) return;
    const r = b.getBoundingClientRect();
    G.to(b, {'--mx': (e.clientX - r.left - r.width / 2) * .3, '--my': (e.clientY - r.top - r.height / 2) * .4, duration: .5, ease: 'power3.out', overwrite: true});
  }, {passive: true});

}

/* ───────── scroll speedometer: km/h from how fast you scroll, gear from how far down you are ───────── */
if(MOTION && fine){
  const sp = $('#speedo'), needle = $('#spNeedle'), fill = $('#spFill'), kmhEl = $('#spKmh'), gearEl = $('#spGear');
  const MAX = 240;
  let lastY = scrollY, lastT = performance.now(), vel = 0, shown = 0, raf = 0, lastGear = '';
  const paint = () => {
    const now = performance.now(), dt = Math.max(16, now - lastT), y = scrollY;
    const inst = Math.abs(y - lastY) / dt * 1000;          // px per second
    lastY = y; lastT = now;
    vel += (inst - vel) * .18;                              // smooth it
    const target = Math.min(MAX, vel * .07);                // 1000 px/s reads 70 km/h
    shown += (target - shown) * .2;
    if(shown < .4) shown = 0;
    needle.setAttribute('transform', `rotate(${(-90 + shown / MAX * 180).toFixed(1)} 60 64)`);
    fill.style.strokeDashoffset = (100 - shown / MAX * 100).toFixed(1);
    kmhEl.textContent = Math.round(shown);
    sp.classList.toggle('hot', shown > MAX * .75);
    const H = document.documentElement.scrollHeight - innerHeight;
    const g = y < 40 ? 'N' : String(Math.min(6, 1 + Math.floor((H > 0 ? y / H : 0) * 6)));
    if(g !== lastGear){ gearEl.textContent = g; if(lastGear) G.fromTo(gearEl, {yPercent: g > lastGear ? 60 : -60, opacity: 0}, {yPercent: 0, opacity: 1, duration: .35, ease: 'back.out(2)'}); lastGear = g; }
    sp.classList.toggle('on', y > innerHeight * .6 && !document.body.classList.contains('is-loading'));
    raf = (shown > 0 || vel > 1) ? requestAnimationFrame(paint) : 0;
  };
  addEventListener('scroll', () => { if(!raf){ lastT = performance.now() - 16; raf = requestAnimationFrame(paint); } }, {passive: true});
  paint();
}
