/* ════════════════════ MOTION: GSAP + ScrollTrigger + smooth scroll ════════════════════
   build.py drops this file into app.js right after `const cur`.
   All of it is optional: if GSAP does not load, or the visitor asks for reduced motion,
   the site works the same, just without these effects. */
const G = window.gsap, ST = window.ScrollTrigger;
const MOTION = !!(G && ST) && !reduced;
const M = {ctx: null, mm: null, smooth: null, mount(){}, wipe: null};
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
  $$('.how-media img, .sell-pic img, .about-pic img', view).forEach(img => {
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
    G.timeline({scrollTrigger: {trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true}})
      .fromTo('#hero', {clipPath: 'inset(0% 0% 0% 0% round 0px)'}, {clipPath: 'inset(0% 2.5% 6% 2.5% round 28px)', ease: 'none'}, 0)
      .fromTo('#heroSlides', {'--hy': 0}, {'--hy': 220, ease: 'none'}, 0)
      .fromTo('.hero-in', {y: 0, opacity: 1}, {y: -140, opacity: 0, ease: 'none'}, 0)
      .fromTo('.hero-foot', {y: 0}, {y: -60, ease: 'none'}, 0);
  }

  // section titles float a little slower than the page
  $$('.sec-head, .phead .wrap > *:not(nav)', view).forEach(el => {
    G.fromTo(el, {y: 40}, {y: -40, ease: 'none', scrollTrigger: {trigger: el, start: 'top bottom', end: 'bottom top', scrub: true}});
  });

  // page header photos (sell, about, contact) drift behind the title
  $$('.phead-bg', view).forEach(bg => {
    G.fromTo(bg, {'--py': 0}, {'--py': 18, ease: 'none', scrollTrigger: {trigger: bg.parentElement, start: 'top top', end: 'bottom top', scrub: true}});
  });

  // car rails lean with the speed of your scroll
  const rails = $$('.cars-rail', view);
  if(rails.length){
    const lean = G.quickTo(rails, 'skewY', {duration: .6, ease: 'power3'});
    ST.create({trigger: view, start: 'top top', end: 'bottom bottom', onUpdate: s => lean(G.utils.clamp(-4, 4, s.getVelocity() / -320))});
  }

  // car page: the gallery trails the page slightly
  $$('#viewer', view).forEach(v => {
    G.fromTo(v, {y: 0}, {y: 60, ease: 'none', scrollTrigger: {trigger: v, start: 'top 20%', end: 'bottom top', scrub: true}});
  });

  // statement band: big words drift apart as it passes
  $$('.mani-t', view).forEach(t => G.fromTo(t, {y: 60}, {y: -60, ease: 'none', scrollTrigger: {trigger: t, start: 'top bottom', end: 'bottom top', scrub: true}}));

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

/* ───────── page change: forest curtain rises, the page name lifts in, the new page settles up ───────── */
M.wipe = async function(R, doMount){
  const w = $('#wipe'), cols = $$('#wipe i'), lab = $('.w-label'), bar = $('.w-bar'), name = $('#wipeName');
  const txt = R.key === 'car' ? `${R.car.make} ${R.car.model}` : R.r.n;
  name.innerHTML = [...txt].map(ch => `<span class="ch">${ch === ' ' ? ' ' : esc(ch)}</span>`).join('');
  $('#wipeIdx').textContent = R.key === 'car' ? `${R.car.year}, ${rs(R.car.price)}` : 'V8 Motors';
  const chs = $$('.ch', name), old = $('.view.on');
  w.classList.add('on');
  G.set(cols, {yPercent: 100}); G.set(lab, {opacity: 1}); G.set(chs, {yPercent: 120}); G.set(bar, {scaleX: 0, transformOrigin: 'left center'});
  await G.timeline()
    .to(old, {y: -90, opacity: .25, duration: .7, ease: 'expo.in'}, 0)
    .to(cols, {yPercent: 0, duration: .7, stagger: .06, ease: 'expo.inOut'}, 0)
    .to(chs, {yPercent: 0, duration: .6, stagger: .018, ease: 'expo.out'}, '-=.3')
    .to(bar, {scaleX: 1, duration: .5, ease: 'expo.out'}, '<')
    .then();
  G.set(old, {clearProps: 'transform,opacity'});
  doMount();
  const view = $('.view.on');
  await G.timeline()
    .to(chs, {yPercent: -120, duration: .4, stagger: .012, ease: 'expo.in'})
    .to(bar, {scaleX: 0, transformOrigin: 'right center', duration: .35, ease: 'expo.in'}, '<')
    .to(cols, {yPercent: -100, duration: .85, stagger: .06, ease: 'expo.inOut'}, '-=.1')
    .fromTo(view, {y: 120}, {y: 0, duration: 1.2, ease: 'expo.out', clearProps: 'transform'}, '-=.75')
    .then();
  w.classList.remove('on');
  G.set([...cols, lab, bar], {clearProps: 'all'});
  ST.refresh();
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

  // page height changes (show more, filters, images): keep every scene lined up
  let rt = 0;
  new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => ST.refresh(), 200); }).observe(document.body);
}

if(MOTION && fine){
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
