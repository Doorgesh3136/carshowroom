function V8_BOOT(DATA){
'use strict';

/* ───────── settings you may want to change ───────── */
const CFG = {
  wa: '23052590327',   // WhatsApp number (V8 Motors sales line)
  gaId: '',            // Google Analytics 4 ID, e.g. 'G-XXXXXXX'. Loads only after the visitor accepts cookies.
  rate: 0.085,         // finance estimate, yearly
  pageSize: 12
};

/* ───────── always HTTPS on the live site ───────── */
if(location.protocol === 'http:' && !/^(localhost|127\.|192\.168\.)/.test(location.hostname)) location.replace('https://' + location.host + location.pathname + location.search + location.hash);

/* ───────── helpers ───────── */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const fmt = n => Math.round(n).toLocaleString('en-US');
const rs = n => 'Rs ' + fmt(n);
const esc = s => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const U = (id, w, h) => !id ? 'data:image/gif;base64,AA==' : /^(https?:|images\/|data:|\/)/.test(id) ? id : `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? '&h=' + h : ''}&q=${w > 1200 ? 72 : 70}`;
const ref = c => 'V8-' + String(c.id).padStart(3, '0');
const carName = c => `${c.year} ${c.make} ${c.model}`;
const kmTxt = c => c.km == null ? 'Mileage on request' : fmt(c.km) + ' km';
const colTxt = c => c.color || 'Ask us';
const waLink = t => `https://wa.me/${CFG.wa}?text=${encodeURIComponent(t)}`;
function monthly(price, depPct=20, months=60){
  const P = price * (1 - depPct/100), r = CFG.rate / 12;
  return P * r / (1 - Math.pow(1 + r, -months));
}
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2600);
}
const MU_PHONE = v => /^(5\d{7}|[2-9]\d{6})$/.test(v.replace(/[\s\-().]/g, '').replace(/^(\+|00)?230(?=\d{7,8}$)/, ''));

/* ───────── data ───────── */
const CARS = DATA.filter(c => c.status !== 'sold');
CARS.forEach(c => { if(c.addedOn) c.added = Math.max(0, Math.round((Date.now() - Date.parse(c.addedOn)) / 864e5)); if(c.added == null) c.added = 30; c.photos = (c.photos || []).filter(Boolean); if(!c.photos.length) c.photos = ['']; if(!c.highlights) c.highlights = []; if(!c.features) c.features = []; });
const byId = new Map(CARS.map(c => [c.id, c]));
const MAKES = [...new Set(CARS.map(c => c.make))].sort();
const BODIES = [...new Set(['SUV','Sedan','Hatchback','Pickup','Coupé','MPV','Convertible','Van', ...CARS.map(c => c.body)])].filter(b => CARS.some(c => c.body === b));
const FUELS = [...new Set(['Petrol','Diesel','Hybrid','Electric', ...CARS.map(c => c.fuel)])].filter(f => CARS.some(c => c.fuel === f));
const TRANS = ['Automatic','Manual'].filter(t => CARS.some(c => c.trans === t));
const PRICE_STEPS = (() => { const a = []; for(let v = 500000; v < 3000000; v += 100000) a.push(v); for(let v = 3000000; v < 6000000; v += 250000) a.push(v); for(let v = 6000000; v <= 17000000; v += 1000000) a.push(v); return a; })();
const YMIN = Math.min(...CARS.map(c => c.year)), YMAX = Math.max(...CARS.map(c => c.year));
const YEAR_STEPS = Array.from({length: YMAX - YMIN + 1}, (_, i) => YMIN + i);
const KM_STEPS = [10000,20000,30000,40000,50000,60000,80000,100000,Infinity];

/* ───────── analytics + cookie consent ───────── */
let consent = store.get('v8-consent', null), gaOn = false;
function loadGA(){
  if(gaOn || !CFG.gaId || consent !== 'all') return;
  gaOn = true;
  const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CFG.gaId; document.head.appendChild(s);
  window.dataLayer = window.dataLayer || []; window.gtag = function(){ dataLayer.push(arguments); };
  gtag('js', new Date()); gtag('config', CFG.gaId, {anonymize_ip: true});
}
function track(name, params){ if(gaOn && window.gtag) gtag('event', name, params || {}); }
function showCookie(){ const c = $('#cookie'); c.hidden = false; requestAnimationFrame(() => c.classList.add('on')); }
function hideCookie(){ const c = $('#cookie'); c.classList.remove('on'); setTimeout(() => c.hidden = true, 500); }
$('#ckYes').addEventListener('click', () => { consent = 'all'; store.set('v8-consent', consent); hideCookie(); loadGA(); toast('Thanks, cookie choice saved'); });
$('#ckNo').addEventListener('click', () => { consent = 'essential'; store.set('v8-consent', consent); hideCookie(); });
document.addEventListener('click', e => { if(e.target.closest('[data-cookie-settings]')) showCookie(); });
document.addEventListener('click', e => { const t = e.target.closest('[data-track]'); if(t) track(t.dataset.track + '_click', {page: location.hash || '#/'}); });
loadGA();

/* ───────── images: shimmer while loading, clean placeholder if offline ───────── */
const BOX = '.ph,.v-panel,.slide,.type,.how-media,.sell-pic,.about-pic,.phead-img,.v-thumbs button';
document.addEventListener('load', e => { if(e.target.tagName === 'IMG'){ const p = e.target.closest(BOX); if(p){ p.classList.add('ok'); p.classList.remove('noimg'); } e.target.classList.remove('bad'); } }, true);
document.addEventListener('error', e => { if(e.target.tagName === 'IMG'){ e.target.classList.add('bad'); const p = e.target.closest(BOX); if(p) p.classList.add('ok', 'noimg'); } }, true);
function settle(root){ $$('img', root).forEach(im => { if(im.complete){ const p = im.closest(BOX); if(!p) return; p.classList.add('ok'); if(!im.naturalWidth){ im.classList.add('bad'); p.classList.add('noimg'); } } }); }

/* ───────── favourites ───────── */
const favs = new Set(store.get('v8-favs', []).filter(id => byId.has(id)));
function syncFavs(bump){
  store.set('v8-favs', [...favs]);
  ['#favN', '#favN2'].forEach(s => { const b = $(s); b.textContent = favs.size; b.classList.toggle('on', favs.size > 0); if(bump){ b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); } });
  $$('.fav').forEach(b => { const on = favs.has(+b.dataset.fav); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  const cs = $('#carSave'); if(cs && cur.car){ const on = favs.has(cur.car.id); cs.classList.toggle('on', on); cs.querySelector('span').textContent = on ? 'Saved' : 'Save'; }
}
function toggleFav(id, btn){
  const on = !favs.has(id); on ? favs.add(id) : favs.delete(id);
  if(btn){ btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
  syncFavs(true); toast(on ? 'Saved. Find it under the heart at the top.' : 'Removed from saved cars');
  if(cur.view === 'inventory' && F.saved) renderInv();
}
document.addEventListener('click', e => { const b = e.target.closest('.fav'); if(b){ e.preventDefault(); e.stopPropagation(); toggleFav(+b.dataset.fav, b); } });
/* safety net: a click anywhere on a card (except the heart) opens that car */
document.addEventListener('click', e => {
  if(e.defaultPrevented || e.target.closest('.fav,.card-link')) return;
  const card = e.target.closest('.card'); if(!card) return;
  if(card.closest('.rail.drag')) return;
  const im = card.querySelector('.card-media img'); if(im && im.complete && im.naturalWidth) vtImg = im;
  location.hash = '#/car/' + card.dataset.id;
});

/* ───────── car card ───────── */
function tagFor(c){
  if(c.status === 'reserved') return '<span class="card-tag navy">Reserved</span>';
  if(c.deal) return '<span class="card-tag amber">Saturday deal</span>';
  if(c.was) return '<span class="card-tag red">Price drop</span>';
  if(c.added <= 3) return '<span class="card-tag red">Just arrived</span>';
  if(c.fuel === 'Electric') return '<span class="card-tag green">Electric</span>';
  if(c.km != null && c.km < 12000) return '<span class="card-tag">Low mileage</span>';
  return '';
}
function cardHTML(c, i, lazy){
  const p = c.photos[0];
  return `<article class="card${i != null ? ' enter' : ''}" data-id="${c.id}" style="--d:${Math.min((i||0) * 55, 440)}ms">
  <div class="card-media ph" data-n="${c.photos.length}"><img src="${U(p, 640, 440)}" srcset="${U(p, 480, 330)} 480w, ${U(p, 640, 440)} 640w, ${U(p, 960, 660)} 960w" sizes="(max-width:640px) 92vw, 340px" alt="${esc(carName(c))}${c.color ? ' in ' + esc(c.color.toLowerCase()) : ''}" width="640" height="440" ${lazy === false ? '' : 'loading="lazy"'} decoding="async">${c.photos.length > 1 ? `<span class="card-dots">${c.photos.map((_, k) => `<i${k ? '' : ' class="on"'}></i>`).join('')}</span>` : ''}<span class="card-peek"><b>${esc(c.power)}</b><span>${esc(c.drive)}</span><span>${c.photos.length} photo${c.photos.length === 1 ? '' : 's'}</span></span></div>
  ${tagFor(c)}
  <button class="fav${favs.has(c.id) ? ' on' : ''}" data-fav="${c.id}" aria-pressed="${favs.has(c.id)}" aria-label="Save ${esc(carName(c))}"><svg><use href="#i-heart"/></svg></button>
  <div class="card-body">
    <div class="card-top"><h3 class="card-t">${esc(c.make)} ${esc(c.model)}</h3><span class="card-y">${c.year}</span></div>
    <p class="card-v">${esc(c.variant)}</p>
    <p class="card-meta"><span>${kmTxt(c)}</span><span>${c.fuel}</span><span>${c.trans === 'Automatic' ? 'Auto' : 'Manual'}</span></p>
    <div class="card-foot"><div class="card-price">${c.was ? `<s>${rs(c.was)}</s>` : ''}${rs(c.price)}</div><div class="card-mo">from<b>${rs(monthly(c.price))}/mo</b></div></div>
  </div>
  <a class="card-link" href="#/car/${c.id}" aria-label="View ${esc(carName(c))}, ${rs(c.price)}"></a>
</article>`;
}

/* ───────── move across a card's photo to flick through its pictures ───────── */
const preloaded = new Set();
function scrub(media, x){
  const card = media.closest('.card'), c = byId.get(+card.dataset.id); if(!c || c.photos.length < 2) return;
  const k = Math.min(c.photos.length - 1, Math.max(0, Math.floor(x * c.photos.length)));
  if(media._k === k) return; media._k = k;
  const img = media.querySelector('img'), p = c.photos[k];
  img.removeAttribute('srcset'); img.src = U(p, 640, 440);
  $$('.card-dots i', media).forEach((d, j) => d.classList.toggle('on', j === k));
}
if(fine){
  document.addEventListener('pointerover', e => {
    const m = e.target.closest && e.target.closest('.card'); if(!m) return;
    const c = byId.get(+m.dataset.id); if(!c || preloaded.has(c.id)) return; preloaded.add(c.id);
    c.photos.slice(1).forEach(p => { const im = new Image(); im.src = U(p, 640, 440); });
  });
  document.addEventListener('pointermove', e => {
    const card = e.target.closest && e.target.closest('.card'); if(!card) return;
    const media = card.querySelector('.card-media'), r = media.getBoundingClientRect();
    if(e.clientY > r.bottom){ return; }
    scrub(media, (e.clientX - r.left) / r.width);
  }, {passive: true});
  document.addEventListener('pointerout', e => {
    const card = e.target.closest && e.target.closest('.card'); if(!card || card.contains(e.relatedTarget)) return;
    const media = card.querySelector('.card-media'); if(media._k) scrub(media, 0);
  });
}

/* ───────── 3D tilt: cards follow the mouse ───────── */
let tiltEl = null, tiltRaf = 0, tiltEv = null;
function untilt(el){ el.classList.remove('tilting'); ['--rx','--ry','--px','--py'].forEach(k => el.style.removeProperty(k)); }
function applyTilt(){
  tiltRaf = 0; const el = tiltEl, e = tiltEv; if(!el || !e) return;
  const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  el.classList.add('tilting');
  el.style.setProperty('--ry', ((x - .5) * 14).toFixed(2) + 'deg');
  el.style.setProperty('--rx', ((.5 - y) * 11).toFixed(2) + 'deg');
  el.style.setProperty('--px', ((.5 - x) * 18).toFixed(1) + 'px');
  el.style.setProperty('--py', ((.5 - y) * 14).toFixed(1) + 'px');
}
if(fine && !reduced){
  document.addEventListener('pointermove', e => {
    const c = e.target.closest ? e.target.closest('.card') : null;
    if(c !== tiltEl){ if(tiltEl) untilt(tiltEl); tiltEl = c; }
    if(!c) return; tiltEv = e; if(!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
  }, {passive: true});
  document.addEventListener('pointerleave', () => { if(tiltEl){ untilt(tiltEl); tiltEl = null; } });
}

/* ───────── horizontal rails: drag with the mouse, arrow buttons ───────── */
function railify(rail){
  let down = false, sx = 0, sl = 0, moved = false;
  rail.addEventListener('dragstart', e => e.preventDefault());
  rail.addEventListener('pointerdown', e => { if(e.pointerType !== 'mouse' || e.target.closest('.fav')) return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
  addEventListener('pointermove', e => { if(!down) return; const dx = e.clientX - sx; if(Math.abs(dx) > 10){ moved = true; rail.classList.add('drag'); } if(moved) rail.scrollLeft = sl - dx; });
  addEventListener('pointerup', () => { if(!down) return; down = false; setTimeout(() => rail.classList.remove('drag'), 0); });
}
$$('.rail').forEach(railify);
document.addEventListener('click', e => { const b = e.target.closest('[data-rail]'); if(!b) return; const r = document.getElementById(b.dataset.rail); r.scrollBy({left: +b.dataset.dir * r.clientWidth * .8, behavior: reduced ? 'auto' : 'smooth'}); });

/* ───────── opening hours (Mauritius time) ───────── */
const muNow = () => new Date(new Date().toLocaleString('en-US', {timeZone: 'Indian/Mauritius'}));

/* ════════════════════ HOME ════════════════════ */
const FEAT = CARS.filter(c => c.featured && c.photos.length);
const HERO = (FEAT.length >= 2 ? FEAT : ['Panamera 4','Taycan 4S','CLS 53','E 200'].map(m => CARS.find(c => c.model === m)).filter(Boolean)).slice(0, 6);
let heroK = 0, heroT = 0, heroBusy = false;
const HDUR = 7000;
(function heroBuild(){
  $('#heroSlides').innerHTML = HERO.map((c, i) => `<div class="slide${i ? '' : ' on'}"><img src="${U(c.photos[0], 1920)}" srcset="${U(c.photos[0], 900)} 900w, ${U(c.photos[0], 1400)} 1400w, ${U(c.photos[0], 2200)} 2200w" sizes="100vw" alt="${esc(carName(c))}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></div>`).join('');
  $('#heroBars').innerHTML = HERO.map(() => '<i></i>').join('');
  $('#heroBars').style.setProperty('--dur', HDUR + 'ms');
  $('#heroTot').textContent = String(HERO.length).padStart(2, '0');
})();
function heroCap(c, anim){
  const set = () => { const im = $('#heroCapImg'); if(im && c.photos[0]) im.src = U(c.photos[0], 192, 144);
    $('#heroCapName').textContent = `${c.year} ${c.make} ${c.model}`; $('#heroCapPrice').textContent = `${rs(c.price)}, ${kmTxt(c)}`; $('#heroCap').href = '#/car/' + c.id; $('#heroCap').classList.remove('sw'); };
  if(anim){ $('#heroCap').classList.add('sw'); setTimeout(set, 330); } else set();
}
function heroBars(k){
  $$('#heroBars i').forEach((b, j) => { b.classList.remove('on', 'done'); if(j < k) b.classList.add('done'); });
  const b = $$('#heroBars i')[k]; void b.offsetWidth; b.classList.add('on');
  $('#heroIdx').textContent = String(k + 1).padStart(2, '0');
}
function heroGleam(){ const g = $('#heroGleam'); if(!g || $('#hero').classList.contains('has-3d')) return; g.classList.remove('go'); void g.offsetWidth; g.classList.add('go'); }
function heroGo(k){
  if(heroBusy) return; k = (k + HERO.length) % HERO.length;
  clearTimeout(heroT);
  if(k !== heroK){
    heroBusy = true;
    const S = $$('.slide'), old = S[heroK], nw = S[k];
    nw.classList.add('in');
    if(!reduced) setTimeout(heroGleam, 450);
    setTimeout(() => { old.classList.remove('on'); nw.classList.remove('in'); nw.classList.add('on'); heroBusy = false; }, reduced ? 0 : 1300);
    heroCap(HERO[k], true); heroK = k;
  }
  heroBars(k);
  if(!reduced) heroT = setTimeout(() => { if(cur.view === 'home') heroGo(heroK + 1); else heroT = 0; }, HDUR);
}
$('#heroPrev').addEventListener('click', () => heroGo(heroK - 1));
$('#heroNext').addEventListener('click', () => heroGo(heroK + 1));
heroCap(HERO[0]);

/* the 3D showroom takes over the hero once it is loaded (source: src/3d/showroom.js) */
const STAGE = window.V8_STAGE;
let stageLive = false;
function stageOn(quick){
  if(stageLive || !STAGE || !STAGE.stage || STAGE.failed) return;
  stageLive = true;
  const hero = $('#hero'), hint = $('#stageHint');
  hero.classList.add('has-3d'); document.documentElement.classList.add('has-3d');
  STAGE.stage.ignite(quick);
  STAGE.stage.pause(cur.view !== 'home');
  setTimeout(() => hint.classList.add('on'), quick ? 900 : 2200);
  STAGE.stage.onDrag = () => { hint.classList.remove('on'); hint.classList.add('done'); };
}
if(STAGE) STAGE.onLost = () => { stageLive = false; $('#hero').classList.remove('has-3d'); document.documentElement.classList.remove('has-3d', 'can-3d'); $('#stageHint').classList.remove('on'); };

/* quick search with a live count */
const qs = {make: $('#qsMake'), model: $('#qsModel'), body: $('#qsBody'), price: $('#qsPrice')};
MAKES.forEach(m => qs.make.insertAdjacentHTML('beforeend', `<option>${esc(m)}</option>`));
BODIES.forEach(b => qs.body.insertAdjacentHTML('beforeend', `<option>${b}</option>`));
function qsModels(){
  const v = qs.model.value; qs.model.innerHTML = '<option value="">Any model</option>';
  [...new Set(CARS.filter(c => !qs.make.value || c.make === qs.make.value).map(c => c.model))].sort().forEach(m => qs.model.insertAdjacentHTML('beforeend', `<option${m === v ? ' selected' : ''}>${esc(m)}</option>`));
}
function qsCount(){
  const n = CARS.filter(c => (!qs.make.value || c.make === qs.make.value) && (!qs.model.value || c.model === qs.model.value) && (!qs.body.value || c.body === qs.body.value) && (!qs.price.value || c.price <= +qs.price.value)).length;
  $('#qsCount').textContent = n ? `Show ${n} car${n === 1 ? '' : 's'}` : 'No matches, widen it';
}
qsModels(); qsCount();
qs.make.addEventListener('change', () => { qsModels(); qsCount(); });
[qs.model, qs.body, qs.price].forEach(s => s.addEventListener('change', qsCount));
$('#quickSearch').addEventListener('submit', e => {
  e.preventDefault();
  const p = new URLSearchParams();
  if(qs.make.value) p.set('make', qs.make.value);
  if(qs.model.value) p.set('model', qs.model.value);
  if(qs.body.value) p.set('body', qs.body.value);
  if(qs.price.value) p.set('pmax', qs.price.value);
  location.hash = '#/inventory' + (p.toString() ? '?' + p : '');
});

/* body type rail */
const TYPE_PIC = {SUV:'Sportage', Sedan:'Panamera 4', Hatchback:'Golf GTI', Pickup:'Ranger', 'Coupé':'M4'};
const EV_PIC = CARS.find(c => c.model === 'Model Y' && c.photos[0]) || CARS.find(c => (c.fuel === 'Electric' || c.fuel === 'Hybrid') && c.photos[0]);
$('#typeRail').innerHTML = BODIES.map(b => {
  const n = CARS.filter(c => c.body === b).length;
  const c = CARS.find(x => x.model === TYPE_PIC[b] && x.body === b && x.photos.length) || CARS.find(x => x.body === b && x.photos.length) || CARS.find(x => x.body === b);
  return `<a class="type ph" href="#/inventory?body=${encodeURIComponent(b)}"><img src="${U(c.photos[0], 600, 800)}" alt="${b}: ${esc(carName(c))}" loading="lazy" decoding="async" width="600" height="800"><div class="type-in"><div><b>${({Pickup:'Pickups','Coupé':'Coupés',MPV:'MPVs',Van:'Vans',Convertible:'Convertibles'})[b] || b + 's'}</b><span>${n} in stock</span></div><span class="type-go"><svg><use href="#i-arrow"/></svg></span></div></a>`;
}).join('') + (EV_PIC ? `<a class="type ph" href="#/inventory?fuel=Electric,Hybrid"><img src="${EV_PIC ? U(EV_PIC.photos[0], 600, 800) : ''}" alt="Electric and hybrid cars" loading="lazy" decoding="async" width="600" height="800"><div class="type-in"><div><b>Electric &amp; hybrid</b><span>${CARS.filter(c => c.fuel === 'Electric' || c.fuel === 'Hybrid').length} in stock</span></div><span class="type-go"><svg><use href="#i-arrow"/></svg></span></div></a>` : '');

/* just arrived rail */
$('#newRail').innerHTML = [...CARS].sort((a, b) => a.added - b.added || b.id - a.id).slice(0, 10).map(c => cardHTML(c)).join('');

/* Saturday deals */
(function(){ const d = CARS.filter(c => c.deal); if(d.length){ $('#dealsSec').hidden = false; $('#dealRail').innerHTML = d.map(c => cardHTML(c)).join(''); } })();

/* makes marquee */
(function(){
  const items = MAKES.map(m => `<a href="#/inventory?make=${encodeURIComponent(m)}">${esc(m)}<sup>${CARS.filter(c => c.make === m).length}</sup></a>`).join('');
  $('#brandTrack').innerHTML = items + items.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ');
})();


/* mini sell form on home */
bindForm($('#sellMini'), f => [
  ['car', v => v.trim().length > 3, 'Tell us the car'],
  ['phone', MU_PHONE, 'Enter a Mauritian number']
], f => `Hi V8 Motors, I'd like a price for my car.\nCar: ${f.car.value}\nPhone: ${f.phone.value}`, 'sell_quick');

/* ════════════════════ INVENTORY ════════════════════ */
const DEF = () => ({deals:false, q:'', make:'', model:'', body:[], fuel:[], trans:[], pmin:PRICE_STEPS[0], pmax:PRICE_STEPS[PRICE_STEPS.length - 1], ymin:YMIN, ymax:YMAX, km:Infinity, saved:false, sort:'new', view:'grid'});
let F = DEF(), page = 1;

function fromParams(p, saved){
  F = DEF();
  F.q = p.get('q') || '';
  F.make = p.get('make') || ''; F.model = p.get('model') || '';
  ['body','fuel','trans'].forEach(k => { F[k] = (p.get(k) || '').split(',').filter(Boolean); });
  const num = (k, d) => { const v = +p.get(k); return p.has(k) && !isNaN(v) ? v : d; };
  F.pmin = snap(PRICE_STEPS, num('pmin', F.pmin)); F.pmax = snap(PRICE_STEPS, num('pmax', F.pmax), true);
  F.ymin = num('ymin', F.ymin); F.ymax = num('ymax', F.ymax);
  F.km = p.has('km') ? +p.get('km') : Infinity;
  F.saved = saved || p.get('saved') === '1';
  F.deals = p.get('deals') === '1';
  F.sort = p.get('sort') || 'new'; F.view = p.get('view') === 'list' ? 'list' : 'grid';
}
function snap(arr, v, up){ if(up){ for(const s of arr) if(s >= v) return s; return arr[arr.length - 1]; } let r = arr[0]; for(const s of arr) if(s <= v) r = s; return r; }
function toParams(){
  const d = DEF(), p = new URLSearchParams();
  if(F.q) p.set('q', F.q);
  if(F.make) p.set('make', F.make); if(F.model) p.set('model', F.model);
  ['body','fuel','trans'].forEach(k => { if(F[k].length) p.set(k, F[k].join(',')); });
  if(F.pmin !== d.pmin) p.set('pmin', F.pmin); if(F.pmax !== d.pmax) p.set('pmax', F.pmax);
  if(F.ymin !== d.ymin) p.set('ymin', F.ymin); if(F.ymax !== d.ymax) p.set('ymax', F.ymax);
  if(F.km !== Infinity) p.set('km', F.km);
  if(F.saved) p.set('saved', '1');
  if(F.deals) p.set('deals', '1');
  if(F.sort !== 'new') p.set('sort', F.sort);
  if(F.view === 'list') p.set('view', 'list');
  return p.toString();
}
function syncURL(){ const q = toParams(); history.replaceState(null, '', '#/inventory' + (q ? '?' + q : '')); }

function match(c, skip){
  if(F.q){ const hay = `${c.year} ${c.make} ${c.model} ${c.variant} ${c.color || ''} ${c.body} ${c.fuel} ${ref(c)}`.toLowerCase(); if(!F.q.toLowerCase().split(/\s+/).every(w => hay.includes(w))) return false; }
  if(skip !== 'make' && F.make && c.make !== F.make) return false;
  if(skip !== 'model' && F.model && c.model !== F.model) return false;
  if(skip !== 'body' && F.body.length && !F.body.includes(c.body)) return false;
  if(skip !== 'fuel' && F.fuel.length && !F.fuel.includes(c.fuel)) return false;
  if(skip !== 'trans' && F.trans.length && !F.trans.includes(c.trans)) return false;
  if(c.price < F.pmin || (F.pmax < PRICE_STEPS[PRICE_STEPS.length - 1] && c.price > F.pmax)) return false;
  if(c.year < F.ymin || c.year > F.ymax) return false;
  if(F.km !== Infinity && (c.km == null || c.km > F.km)) return false;
  if(F.saved && !favs.has(c.id)) return false;
  if(F.deals && !c.deal) return false;
  return true;
}
function sorted(list){
  const s = {
    'new': (a, b) => a.added - b.added || b.id - a.id,
    'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price,
    'year-desc': (a, b) => b.year - a.year || (a.km ?? 1e9) - (b.km ?? 1e9), 'km-asc': (a, b) => (a.km ?? 1e9) - (b.km ?? 1e9)
  }[F.sort] || ((a, b) => 0);
  return list.sort(s);
}

/* range slider component (one or two thumbs, on a list of allowed values) */
function makeRange(el, steps, fmtV, single, onChange){
  el.innerHTML = `<div class="range-vals"><span class="rv-lo"></span><span class="rv-hi"></span></div><div class="range-track"><i class="range-fill"></i>${single ? '' : `<input type="range" class="lo" min="0" max="${steps.length - 1}" step="1" aria-label="Minimum">`}<input type="range" class="hi" min="0" max="${steps.length - 1}" step="1" aria-label="Maximum"></div>`;
  const lo = $('.lo', el), hi = $('.hi', el), fill = $('.range-fill', el);
  function paint(){
    const a = lo ? +lo.value : 0, b = +hi.value, n = steps.length - 1;
    fill.style.left = (a / n * 100) + '%'; fill.style.right = (100 - b / n * 100) + '%';
    $('.rv-lo', el).textContent = single ? '' : fmtV(steps[a], 'lo');
    $('.rv-hi', el).textContent = fmtV(steps[b], 'hi');
  }
  function input(e){
    if(lo && +lo.value > +hi.value - 1){ if(e.target === lo) lo.value = +hi.value - 1; else hi.value = +lo.value + 1; }
    paint(); onChange(lo ? steps[+lo.value] : null, steps[+hi.value]);
  }
  [lo, hi].forEach(i => i && i.addEventListener('input', input));
  return { set(a, b){ if(lo) lo.value = Math.max(0, steps.indexOf(a)); hi.value = Math.max(0, steps.indexOf(b)); paint(); } };
}
const shortRs = v => v >= 1e6 ? 'Rs ' + (v / 1e6).toFixed(v % 1e6 ? (v % 1e5 ? 2 : 1) : 0) + 'M' : 'Rs ' + Math.round(v / 1000) + 'k';
const rPrice = makeRange($('#rPrice'), PRICE_STEPS, (v, s) => s === 'hi' && v === PRICE_STEPS[PRICE_STEPS.length - 1] ? 'Any' : shortRs(v), false, (a, b) => { F.pmin = a; F.pmax = b; changed(true); });
const rYear = makeRange($('#rYear'), YEAR_STEPS, v => v, false, (a, b) => { F.ymin = a; F.ymax = b; changed(true); });
const rKm = makeRange($('#rKm'), KM_STEPS, v => v === Infinity ? 'Any mileage' : fmt(v) + ' km', true, (a, b) => { F.km = b; changed(true); });

/* filter controls */
const fMake = $('#fMake'), fModel = $('#fModel');
function chipGroup(el, key, values){
  el.innerHTML = values.map(v => `<button type="button" class="chip" data-k="${key}" data-v="${esc(v)}" aria-pressed="false">${esc(v)} <small></small></button>`).join('');
}
chipGroup($('#fBody'), 'body', BODIES); chipGroup($('#fFuel'), 'fuel', FUELS); chipGroup($('#fTrans'), 'trans', TRANS);
$('#filters').addEventListener('click', e => {
  const ch = e.target.closest('.chip'); if(!ch) return;
  const k = ch.dataset.k, v = ch.dataset.v, i = F[k].indexOf(v);
  i >= 0 ? F[k].splice(i, 1) : F[k].push(v);
  changed();
});
fMake.addEventListener('change', () => { F.make = fMake.value; F.model = ''; changed(); });
fModel.addEventListener('change', () => { F.model = fModel.value; changed(); });
$('#fSaved').addEventListener('change', e => { F.saved = e.target.checked; changed(); });
$('#fDeals').addEventListener('change', e => { F.deals = e.target.checked; changed(); });
$('#fSort').addEventListener('change', e => { F.sort = e.target.value; changed(); });
let qT; $('#fQ').addEventListener('input', e => { clearTimeout(qT); qT = setTimeout(() => { F.q = e.target.value.trim(); changed(); }, 180); });
function resetAll(){ const v = F.view; F = DEF(); F.view = v; $('#fQ').value = ''; changed(); toast('Filters cleared'); }
$('#fReset').addEventListener('click', resetAll);
$('#emptyReset').addEventListener('click', resetAll);
$('#vGrid').addEventListener('click', () => { F.view = 'grid'; syncView(); syncURL(); });
$('#vList').addEventListener('click', () => { F.view = 'list'; syncView(); syncURL(); });
function syncView(){ $('#invGrid').classList.toggle('list', F.view === 'list'); $('#vGrid').classList.toggle('on', F.view === 'grid'); $('#vList').classList.toggle('on', F.view === 'list'); $('#vGrid').setAttribute('aria-pressed', F.view === 'grid'); $('#vList').setAttribute('aria-pressed', F.view === 'list'); }

/* mobile: filters as a bottom sheet */
function sheet(open){
  $('#filters').classList.toggle('open', open);
  $('#scrim').hidden = !open; requestAnimationFrame(() => $('#scrim').classList.toggle('on', open));
  document.body.classList.toggle('lock', open);
  if(open) setTimeout(() => $('#fClose').focus(), 300);
}
$('#fOpen').addEventListener('click', () => sheet(true));
$('#fClose').addEventListener('click', () => sheet(false));
$('#fApply').addEventListener('click', () => { sheet(false); scrollTo({top: $('.results').getBoundingClientRect().top + scrollY - 90, behavior: reduced ? 'auto' : 'smooth'}); });

/* paint the filter panel to match F (with live counts on every option) */
function paintFilters(){
  fMake.innerHTML = '<option value="">All makes</option>' + MAKES.map(m => { const n = CARS.filter(c => c.make === m && match(c, 'make')).length; return `<option value="${esc(m)}"${m === F.make ? ' selected' : ''}${n ? '' : ' disabled'}>${esc(m)} (${n})</option>`; }).join('');
  const models = [...new Set(CARS.filter(c => !F.make || c.make === F.make).map(c => c.model))].sort();
  fModel.innerHTML = '<option value="">All models</option>' + models.map(m => { const n = CARS.filter(c => c.model === m && match(c, 'model')).length; return `<option value="${esc(m)}"${m === F.model ? ' selected' : ''}>${esc(m)} (${n})</option>`; }).join('');
  fModel.disabled = models.length < 2 && !F.make;
  $$('#filters .chip').forEach(ch => {
    const k = ch.dataset.k, v = ch.dataset.v, on = F[k].includes(v);
    const n = CARS.filter(c => c[k] === v && match(c, k)).length;
    ch.setAttribute('aria-pressed', on); ch.querySelector('small').textContent = n; ch.disabled = !n && !on;
  });
  rPrice.set(F.pmin, F.pmax); rYear.set(F.ymin, F.ymax); rKm.set(null, F.km);
  $('#fSaved').checked = F.saved; $('#fDeals').checked = F.deals; $('#fSort').value = F.sort;
  if($('#fQ').value.trim() !== F.q) $('#fQ').value = F.q;
  syncView();
}

/* active filter chips above the results */
function activeList(){
  const d = DEF(), a = [];
  if(F.q) a.push(['"' + F.q + '"', () => { F.q = ''; $('#fQ').value = ''; }]);
  if(F.make) a.push([F.make, () => { F.make = ''; F.model = ''; }]);
  if(F.model) a.push([F.model, () => { F.model = ''; }]);
  ['body','fuel','trans'].forEach(k => F[k].forEach(v => a.push([v, () => { F[k] = F[k].filter(x => x !== v); }])));
  if(F.pmin !== d.pmin || F.pmax !== d.pmax) a.push([`${shortRs(F.pmin)} to ${F.pmax === d.pmax ? 'any' : shortRs(F.pmax)}`, () => { F.pmin = d.pmin; F.pmax = d.pmax; }]);
  if(F.ymin !== d.ymin || F.ymax !== d.ymax) a.push([`${F.ymin} to ${F.ymax}`, () => { F.ymin = d.ymin; F.ymax = d.ymax; }]);
  if(F.km !== Infinity) a.push([`Under ${fmt(F.km)} km`, () => { F.km = Infinity; }]);
  if(F.saved) a.push(['Saved cars', () => { F.saved = false; }]);
  if(F.deals) a.push(['Deals only', () => { F.deals = false; }]);
  return a;
}
let ACT = [];
$('#activeChips').addEventListener('click', e => { const b = e.target.closest('.achip'); if(!b) return; ACT[+b.dataset.i][1](); changed(); });

let renderT;
function changed(slow){ page = 1; paintFilters(); syncURL(); clearTimeout(renderT); if(slow) renderT = setTimeout(renderInv, 140); else renderInv(); }

function renderInv(append){
  const list = sorted(CARS.filter(c => match(c)));
  const total = list.length, shown = Math.min(total, page * CFG.pageSize);
  const g = $('#invGrid');
  if(append){
    const from = (page - 1) * CFG.pageSize;
    g.insertAdjacentHTML('beforeend', list.slice(from, shown).map((c, i) => cardHTML(c, i)).join(''));
  } else {
    const had = new Set($$('.card', g).map(el => +el.dataset.id));
    let k = 0;
    g.innerHTML = list.slice(0, shown).map((c, i) => had.size && had.has(c.id) ? cardHTML(c, null, i < 3 ? false : undefined) : cardHTML(c, k++, i < 3 ? false : undefined)).join('');
  }
  settle(g);
  $('#invEmpty').hidden = total > 0;
  g.hidden = total === 0;
  $('#rCount').innerHTML = `<b>${total}</b> ${total === 1 ? 'car' : 'cars'}${total === CARS.length ? ' in stock' : ' match'}`;
  $('#moreWrap').hidden = shown >= total;
  $('#moreTxt').textContent = `Showing ${shown} of ${total}`;
  $('#moreBar').style.width = (shown / Math.max(total, 1) * 100) + '%';
  ACT = activeList();
  $('#activeChips').innerHTML = ACT.map(([t], i) => `<button type="button" class="achip" data-i="${i}" aria-label="Remove filter ${esc(t)}">${esc(t)}<svg><use href="#i-x"/></svg></button>`).join('') + (ACT.length > 1 ? '<button type="button" class="achip" data-i="clear" id="clearChips">Clear all</button>' : '');
  const cc = $('#clearChips'); if(cc){ cc.dataset.i = ''; cc.onclick = e => { e.stopPropagation(); resetAll(); }; }
  $('#fCount').textContent = ACT.length || '';
  $('#fApply').textContent = total ? `Show ${total} car${total === 1 ? '' : 's'}` : 'No matches';
  const title = F.saved ? 'Saved cars' : F.deals && ACT.length === 1 ? 'Saturday deals' : F.body.length === 1 && ACT.length === 1 ? ({Pickup:'Pickups','Coupé':'Coupés'}[F.body[0]] || F.body[0] + 's') : F.make && ACT.length === 1 ? F.make + ' cars' : 'Catalogue';
  $('#invTitle').textContent = title; $('#invCrumb').textContent = title;
  if(cur.view === 'inventory') setMeta(`${title} | ${total} ${total === 1 ? 'car' : 'cars'} | V8 Motors, Coromandel`, `Browse ${total} checked used ${title === 'Catalogue' ? 'cars' : title.toLowerCase()} for sale at V8 Motors, Coromandel. Prices, mileage and photos for every car.`);
  if(F.saved && !total) { $('#invEmpty h2').textContent = 'No saved cars yet'; $('#invEmpty p').innerHTML = 'Tap the heart on any car to keep it here. Saved cars stay on this device.'; }
  else { $('#invEmpty h2').textContent = 'No cars match those filters'; $('#invEmpty p').innerHTML = 'Try a wider price range, or clear a filter. New stock arrives every week, so you can also <a href="#/contact?topic=find">ask us to find one</a>.'; }
  if(M.cardsIn && cur.view === 'inventory') M.cardsIn();
}
$('#moreBtn').addEventListener('click', () => { page++; renderInv(true); });

/* ════════════════════ CAR PAGE + PHOTO VIEWER ════════════════════ */
const V = {n: 0, pos: 0, target: 0, raf: 0, panels: []};
function vLayout(){
  V.panels.forEach((p, i) => {
    const d = i - V.pos, ad = Math.abs(d);
    const x = d * 64, z = -ad * 280, ry = Math.max(-60, Math.min(60, -d * 42));
    p.style.transform = `translateX(${x}%) translateZ(${z}px) rotateY(${ry}deg)`;
    p.style.opacity = ad > 2.2 ? 0 : (1 - Math.max(0, ad - 1) * .8).toFixed(3);
    p.style.zIndex = 100 - Math.round(ad * 10);
    p.style.setProperty('--shade', Math.min(ad * .55, .7).toFixed(3));
  });
  const k = Math.round(V.pos);
  $('#vCount').textContent = `${k + 1} / ${V.n}`;
  $$('#vThumbs button').forEach((b, i) => { b.classList.toggle('on', i === k); b.setAttribute('aria-current', i === k); });
}
function vAnimate(){
  cancelAnimationFrame(V.raf);
  const step = () => { const diff = V.target - V.pos; if(Math.abs(diff) < .002){ V.pos = V.target; vLayout(); return; } V.pos += diff * (reduced ? 1 : .13); vLayout(); V.raf = requestAnimationFrame(step); };
  step();
}
function vGo(k){ V.target = Math.max(0, Math.min(V.n - 1, k)); vAnimate(); $('#vHint').classList.add('gone'); }
$('#vPrev').addEventListener('click', e => { e.stopPropagation(); vGo(Math.round(V.target) - 1 < 0 ? V.n - 1 : Math.round(V.target) - 1); });
$('#vNext').addEventListener('click', e => { e.stopPropagation(); vGo(Math.round(V.target) + 1 >= V.n ? 0 : Math.round(V.target) + 1); });
$('#vThumbs').addEventListener('click', e => { const b = e.target.closest('button'); if(b) vGo(+b.dataset.i); });
$('#viewer').addEventListener('keydown', e => { if(e.key === 'ArrowLeft'){ e.preventDefault(); vGo(Math.round(V.target) - 1); } if(e.key === 'ArrowRight'){ e.preventDefault(); vGo(Math.round(V.target) + 1); } });
(function viewerInput(){
  const vw = $('#viewer'); let drag = null;
  vw.addEventListener('dragstart', e => e.preventDefault());
  vw.addEventListener('pointerdown', e => { if(e.target.closest('button')) return; if(e.pointerType === 'mouse') e.preventDefault(); drag = {x: e.clientX, y: e.clientY, p: V.pos, w: vw.clientWidth, moved: false, id: e.pointerId}; });
  vw.addEventListener('pointermove', e => {
    const r = vw.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    if(drag){
      const dx = e.clientX - drag.x;
      if(!drag.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - drag.y)){ drag.moved = true; vw.classList.add('grab'); try{ vw.setPointerCapture(drag.id); }catch(_){} }
      if(drag.moved){
        let p = drag.p - dx / drag.w * 1.6;
        if(p < 0) p = p * .3; if(p > V.n - 1) p = V.n - 1 + (p - V.n + 1) * .3;
        V.pos = V.target = p; cancelAnimationFrame(V.raf); vLayout();
        vw.style.setProperty('--vy', (dx / drag.w * 18).toFixed(2) + 'deg');
      }
    } else if(e.pointerType === 'mouse' && !reduced){
      vw.classList.add('tilting');
      vw.style.setProperty('--vy', ((x - .5) * 10).toFixed(2) + 'deg');
      vw.style.setProperty('--vx', ((.5 - y) * 7).toFixed(2) + 'deg');
    }
  });
  const end = () => { if(!drag) return; if(drag.moved){ vGo(Math.round(V.pos)); } drag = null; vw.classList.remove('grab'); vw.style.setProperty('--vy', '0deg'); };
  vw.addEventListener('pointerup', end); vw.addEventListener('pointercancel', end);
  vw.addEventListener('pointerleave', () => { vw.classList.remove('tilting'); vw.style.setProperty('--vx', '0deg'); vw.style.setProperty('--vy', '0deg'); });
})();

/* tabs with sliding underline */
function tabInd(){ const t = $('#carTabs button[aria-selected=true]'), ind = $('#carTabs .tab-ind'); if(!t || !t.offsetWidth) return; ind.style.width = t.offsetWidth + 'px'; ind.style.transform = `translateX(${t.offsetLeft}px)`; }
function tab(name){
  const prev = $('.tab-pane.on'), next = $(`.tab-pane[data-pane="${name}"]`);
  $$('#carTabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === name));
  tabInd();
  if(prev && prev !== next){
    if(MOTION){
      // hold the old height while the new tab steps in, so the page never jumps
      const h = prev.offsetHeight;
      G.killTweensOf([prev, next, ...prev.querySelectorAll('*'), ...next.querySelectorAll('*')]);
      G.set([prev, ...prev.children], {clearProps: 'all'});
      prev.classList.remove('on'); next.classList.add('on');
      G.fromTo(next, {minHeight: h}, {minHeight: 0, duration: .7, ease: 'expo.out', clearProps: 'minHeight'});
      G.fromTo(next.children, {autoAlpha: 0, y: 18}, {autoAlpha: 1, y: 0, duration: .6, stagger: .07, ease: 'expo.out', clearProps: 'opacity,visibility,transform'});
      M.tabFx(name, next);
    } else { prev.classList.remove('on'); next.classList.add('on'); }
  }
  if(name === 'ov') runGauges();
}
$('#carTabs').addEventListener('click', e => { const b = e.target.closest('button'); if(b) tab(b.dataset.tab); });

/* finance calculator */
function calc(){
  const c = cur.car; if(!c) return;
  const dep = +$('#cDep').value, term = +$('#cTerm').value, trade = +$('#cTrade').value || 0;
  const P = Math.max(0, c.price * (1 - dep / 100) - trade), r_ = CFG.rate / 12, m = P ? P * r_ / (1 - Math.pow(1 + r_, -term)) : 0;
  $('#cTradeV').textContent = trade ? rs(trade) : 'None';
  $('#cDepV').textContent = `${dep}% (${rs(c.price * dep / 100)})`;
  $('#cTermV').textContent = `${term} months`;
  $('#cOut').textContent = rs(m);
  $('#cNote').textContent = P ? `Borrowing ${rs(P)} over ${term / 12} years` : 'Your deposit and trade-in cover the car';
}
$('#cDep').addEventListener('input', calc); $('#cTerm').addEventListener('input', calc); $('#cTrade').addEventListener('input', calc);

function renderCar(c){
  cur.car = c;
  carExtras(c);
  const name = `${c.make} ${c.model}`;
  $('#carCrumb').textContent = name;
  $('#carEyebrow').textContent = `${c.year} ${c.body}, ref ${ref(c)}`;
  $('#carTitle').textContent = name;
  $('#carVar').textContent = c.variant;
  countUp($('#carPrice'), c.price, v => rs(v));
  $('#carWas').textContent = c.was ? rs(c.was) : '';
  $('#carMo').innerHTML = `About <b>${rs(monthly(c.price))}</b> a month with 20% down. <button type="button" id="toFin">Work it out</button>`;
  $('#toFin').onclick = () => { tab('fi'); $('#carTabs').scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'center'}); };
  $('#carFacts').innerHTML = [['Mileage', kmTxt(c)], ['Year', c.year], ['Fuel', c.fuel], ['Gearbox', c.trans], ['Power', c.power], ['Colour', colTxt(c)]].map(([k, v]) => `<li><small>${k}</small><b>${esc(v)}</b></li>`).join('');
  $('#carBook').href = '#/car/' + c.id;
  $('#carReserved').hidden = c.status !== 'reserved';
  $('#carWa').href = waLink(`Hi V8 Motors, is the ${carName(c)} ${c.variant} (${rs(c.price)}, ref ${ref(c)}) still available?`);
  $('#carDesc').textContent = c.desc;
  $('#carHigh').innerHTML = c.highlights.map(h => `<li>${esc(h)}</li>`).join('');
  $('#carSpec').innerHTML = [['Make', c.make], ['Model', c.model], ['Variant', c.variant], ['Year', c.year], ['Body', c.body], ['Mileage', kmTxt(c)], ['Fuel', c.fuel], ['Gearbox', c.trans], ['Engine', c.engine], ['Power', c.power], ['Drive', c.drive], ['Colour', colTxt(c)], ['Doors', c.doors], ['Seats', c.seats], ['Stock ref', ref(c)]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
  $('#carFeat').innerHTML = c.features.map(f => `<li>${esc(f)}</li>`).join('') + '<li class="feat-note">Typical equipment for this model. Ask us to confirm what this exact car has.</li>';
  $('#cDep').value = 20; $('#cTerm').value = 60; calc();
  // viewer
  V.n = c.photos.length; V.pos = V.target = 0;
  $('#vRing').innerHTML = c.photos.map((p, i) => `<div class="v-panel"><img src="${U(p, 1400)}" srcset="${U(p, 800)} 800w, ${U(p, 1400)} 1400w, ${U(p, 2000)} 2000w" sizes="(max-width:1100px) 92vw, 760px" alt="${esc(carName(c))}, photo ${i + 1} of ${c.photos.length}" decoding="async" draggable="false"></div>`).join('');
  V.panels = $$('#vRing .v-panel');
  $('#vThumbs').innerHTML = c.photos.map((p, i) => `<button type="button" data-i="${i}" aria-label="Show photo ${i + 1}"><img src="${U(p, 240, 180)}" alt="" loading="lazy" decoding="async"></button>`).join('');
  $('#vHint').classList.toggle('gone', V.n < 2);
  $('#vPrev').hidden = $('#vNext').hidden = V.n < 2;
  vLayout(); settle($('#viewer'));
  tab('ov');
  syncFavs();
  // similar cars
  const sim = CARS.filter(x => x.id !== c.id).map(x => ({x, s: (x.body === c.body ? 3 : 0) + (x.make === c.make ? 2 : 0) - Math.abs(x.price - c.price) / Math.max(c.price, 1) * 4})).sort((a, b) => b.s - a.s).slice(0, 8).map(o => o.x);
  $('#simRail').innerHTML = sim.map(x => cardHTML(x)).join('');
  $('#simAll').href = '#/inventory?body=' + encodeURIComponent(c.body);
  // structured data for this car
  let ld = $('#carLd'); if(!ld){ ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'carLd'; document.head.appendChild(ld); }
  ld.textContent = JSON.stringify({'@context':'https://schema.org','@type':'Car',name:`${carName(c)} ${c.variant}`,brand:{'@type':'Brand',name:c.make},model:c.model,vehicleModelDate:String(c.year),...(c.color ? {color: c.color} : {}),bodyType:c.body,fuelType:c.fuel,vehicleTransmission:c.trans,...(c.km != null ? {mileageFromOdometer:{'@type':'QuantitativeValue',value:c.km,unitCode:'KMT'}} : {}),image:c.photos.map(p => U(p, 1200)),offers:{'@type':'Offer',price:c.price,priceCurrency:'MUR',availability:'https://schema.org/InStock',seller:{'@type':'AutoDealer',name:'V8 Motors'}}});
  setMeta(`${carName(c)} ${c.variant} for sale, ${rs(c.price)} | V8 Motors`, `${carName(c)} ${c.variant}, ${kmTxt(c)}, ${c.fuel.toLowerCase()}, ${c.trans.toLowerCase()}. ${rs(c.price)} at V8 Motors, Coromandel. Checked before sale.`);
  requestAnimationFrame(tabInd);
}
$('#carSave').addEventListener('click', () => cur.car && toggleFav(cur.car.id));
$('#carBook').addEventListener('click', e => { e.preventDefault(); $('#td').scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'center'}); $('#td').classList.remove('pulse'); void $('#td').offsetWidth; $('#td').classList.add('pulse'); });

function countUp(el, to, f){
  if(reduced){ el.textContent = f(to); return; }
  const from = to * .82, t0 = performance.now(), d = 800;
  (function s(t){ const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = f(Math.round((from + (to - from) * e) / 1000) * 1000 || to); if(p < 1) requestAnimationFrame(s); else el.textContent = f(to); })(t0);
}
const hp = c => parseInt(String(c.power).replace(/[^0-9]/g, '').slice(0, 4)) || 0;
const NOW_YEAR = new Date().getFullYear();

/* gauges: power, mileage and age at a glance */
function gauges(c){
  const kmR = c.km == null ? null : c.km;
  const items = [
    {v: hp(c), max: 600, unit: 'hp', label: 'Power', note: hp(c) > 300 ? 'Quick' : hp(c) > 150 ? 'Lively' : 'Easy-going'},
    {v: kmR, max: 160000, unit: 'km', label: 'Mileage', note: kmR == null ? 'On request' : kmR < 20000 ? 'Very low' : kmR < 60000 ? 'Low' : kmR < 110000 ? 'Average' : 'Well used', fmtV: v => v >= 1000 ? Math.round(v / 1000) + 'k' : v},
    {v: Math.max(0, NOW_YEAR - c.year), max: 14, unit: 'yrs', label: 'Age', note: c.year + ' model'}
  ];
  $('#carGauges').innerHTML = items.map((g, i) => {
    const p = g.v == null ? 0 : Math.min(1, g.v / g.max);
    return `<div class="gauge" style="--p:${p}"><svg viewBox="0 0 120 70" aria-hidden="true"><path class="g-bg" d="M10 62 A50 50 0 0 1 110 62"/><path class="g-fg" d="M10 62 A50 50 0 0 1 110 62" pathLength="100"/>${Array.from({length: 11}, (_, k) => { const a = Math.PI * (1 - k / 10), x1 = 60 + Math.cos(a) * 41, y1 = 62 - Math.sin(a) * 41, x2 = 60 + Math.cos(a) * 36, y2 = 62 - Math.sin(a) * 36; return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`; }).join('')}<g class="g-needle"><line x1="60" y1="62" x2="60" y2="22"/><circle cx="60" cy="62" r="4"/></g></svg><b data-v="${g.v == null ? '' : g.v}" data-f="${i === 1 ? 'k' : ''}">${g.v == null ? 'n/a' : 0}</b><span>${g.unit}</span><small>${g.label}: ${g.note}</small></div>`;
  }).join('');
  runGauges();
}
function runGauges(){
  const box = $('#carGauges'); if(!box || !box.offsetParent) return;
  box.classList.remove('go'); void box.offsetWidth; box.classList.add('go');
  $$('b[data-v]', box).forEach(b => { if(b.dataset.v === '') return; const to = +b.dataset.v, k = b.dataset.f === 'k', t0 = performance.now();
    (function s(t){ const p = Math.min(1, (t - t0) / 1200), e = 1 - Math.pow(1 - p, 3), v = to * e; b.textContent = k ? (v >= 1000 ? Math.round(v / 1000) + 'k' : Math.round(v)) : Math.round(v); if(p < 1 && !reduced) requestAnimationFrame(s); else b.textContent = k ? (to >= 1000 ? Math.round(to / 1000) + 'k' : to) : to; })(t0); });
}

/* running costs */
const FUEL_PRICE = {Petrol: 70.65, Diesel: 71.25, Hybrid: 70.65, Electric: 7.5};
function consumption(c){
  if(c.fuel === 'Electric') return 17;
  if(c.fuel === 'Hybrid') return 6;
  if(c.fuel === 'Diesel') return c.body === 'Pickup' ? 8.5 : 7;
  return Math.min(14, Math.max(5, Math.round((4.6 + hp(c) / 85 + (c.body === 'SUV' ? .8 : 0)) * 10) / 10));
}
function runCost(){
  const c = cur.car; if(!c) return;
  const km = +$('#rcKm').value, cons = +$('#rcCons').value || 0, price = +$('#rcPrice').value || 0;
  const unit = c.fuel === 'Electric' ? 'kWh' : 'L';
  const month = km / 100 * cons * price, ref = km / 100 * 5 * FUEL_PRICE.Petrol;
  $('#rcKmV').textContent = fmt(km) + ' km a month';
  $('#rcMonth').textContent = rs(month);
  $('#rcYear').textContent = rs(month * 12);
  $('#rcPerKm').textContent = 'Rs ' + (cons * price / 100).toFixed(2);
  const mx = Math.max(month, ref, 1);
  $('#rcBarThis').style.setProperty('--w', (month / mx * 100) + '%'); $('#rcBarRef').style.setProperty('--w', (ref / mx * 100) + '%');
  $('#rcThisV').textContent = rs(month); $('#rcRefV').textContent = rs(ref);
  $('#rcUnit').textContent = `${unit} per 100 km`; $('#rcPriceL').textContent = `Price per ${unit} (Rs)`;
}
['#rcKm','#rcCons','#rcPrice'].forEach(s => $(s).addEventListener('input', runCost));

/* test-drive slot picker (next open days, Mauritius time) */
function tdDays(){
  const out = [], n = muNow();
  for(let i = 0; out.length < 6 && i < 10; i++){
    const d = new Date(n); d.setDate(n.getDate() + i); const w = d.getDay(); if(w === 0) continue;
    let slots = w === 6 ? ['09:30','10:30','11:15'] : ['09:30','11:00','13:30','15:00','16:15'];
    if(i === 0) slots = slots.filter(s => { const [h, m] = s.split(':').map(Number); return h * 60 + m > n.getHours() * 60 + n.getMinutes() + 60; });
    if(slots.length) out.push({d, slots, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', {weekday: 'short'}), date: d.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})});
  }
  return out;
}
let TD = {day: 0, slot: null};
function renderTD(){
  const days = tdDays();
  $('#tdDays').innerHTML = days.map((x, i) => `<button type="button" class="td-day" role="radio" aria-checked="${i === TD.day}" data-i="${i}"><small>${x.label}</small><b>${x.date}</b></button>`).join('');
  const d = days[TD.day] || days[0];
  $('#tdSlots').innerHTML = d.slots.map(s => `<button type="button" class="chip" role="radio" aria-pressed="${s === TD.slot}" data-s="${s}">${s}</button>`).join('');
  const go = $('#tdGo');
  if(TD.slot){ go.disabled = false; go.innerHTML = `<svg><use href="#i-wa"/></svg>Book ${d.label === 'Today' || d.label === 'Tomorrow' ? d.label.toLowerCase() : d.label + ' ' + d.date} at ${TD.slot}`; }
  else { go.disabled = true; go.innerHTML = 'Pick a time'; }
  TD._d = d;
}
$('#tdDays').addEventListener('click', e => { const b = e.target.closest('.td-day'); if(!b) return; TD.day = +b.dataset.i; TD.slot = null; renderTD(); });
$('#tdSlots').addEventListener('click', e => { const b = e.target.closest('.chip'); if(!b) return; TD.slot = b.dataset.s; renderTD(); });
$('#tdGo').addEventListener('click', () => {
  const c = cur.car, d = TD._d; if(!c || !TD.slot) return;
  window.open(waLink(`Hi V8 Motors, I'd like to test drive the ${carName(c)} ${c.variant} (${rs(c.price)}, ref ${ref(c)}) on ${d.d.toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'long'})} at ${TD.slot}. Is that time free?`), '_blank', 'noopener');
  track('test_drive_request', {car: ref(c)}); toast('WhatsApp opened with your booking. Press send to confirm.');
});

/* compare up to 3 cars */
let cmp = store.get('v8-cmp', []).filter(id => byId.has(id));
function syncCmp(){
  store.set('v8-cmp', cmp);
  const tray = $('#cmpTray');
  tray.hidden = !cmp.length; tray.classList.toggle('on', cmp.length > 0);
  $('#cmpThumbs').innerHTML = cmp.map(id => { const c = byId.get(id); return `<span class="cmp-th"><img src="${U(c.photos[0], 160, 110)}" alt=""><button type="button" data-rm="${id}" aria-label="Remove ${esc(c.make + ' ' + c.model)} from compare"><svg><use href="#i-x"/></svg></button></span>`; }).join('') + (cmp.length < 3 ? `<span class="cmp-slot">${3 - cmp.length} more</span>` : '');
  $('#cmpGo').textContent = `Compare ${cmp.length}`; $('#cmpGo').disabled = cmp.length < 2;
  const b = $('#carCmp'); if(b && cur.car){ const on = cmp.includes(cur.car.id); b.classList.toggle('on', on); b.querySelector('span').textContent = on ? 'Comparing' : 'Compare'; }
}
function toggleCmp(id){
  const i = cmp.indexOf(id);
  if(i >= 0) cmp.splice(i, 1);
  else { if(cmp.length >= 3){ toast('You can compare up to 3 cars. Remove one first.'); return; } cmp.push(id); toast(cmp.length < 2 ? 'Added. Pick another car to compare.' : 'Added to compare'); }
  syncCmp();
}
$('#carCmp').addEventListener('click', () => cur.car && toggleCmp(cur.car.id));
$('#cmpThumbs').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if(b){ toggleCmp(+b.dataset.rm); } });
$('#cmpClear').addEventListener('click', () => { cmp = []; syncCmp(); });
$('#cmpGo').addEventListener('click', () => {
  const cs = cmp.map(id => byId.get(id));
  const rows = [
    ['Price', c => c.price, 'min', c => rs(c.price)],
    ['Monthly from', c => monthly(c.price), 'min', c => rs(monthly(c.price))],
    ['Year', c => c.year, 'max', c => c.year],
    ['Mileage', c => c.km ?? Infinity, 'min', c => kmTxt(c)],
    ['Power', c => hp(c), 'max', c => c.power],
    ['Fuel', null, '', c => c.fuel], ['Gearbox', null, '', c => c.trans], ['Body', null, '', c => c.body],
    ['Engine', null, '', c => c.engine], ['Drive', null, '', c => c.drive], ['Seats', c => c.seats, 'max', c => c.seats],
    ['Running cost a month', c => 1500 / 100 * consumption(c) * FUEL_PRICE[c.fuel], 'min', c => rs(1500 / 100 * consumption(c) * FUEL_PRICE[c.fuel])]
  ];
  $('#cmpTable').innerHTML = `<thead><tr><th></th>${cs.map(c => `<th><a href="#/car/${c.id}" class="cmp-car"><span class="cmp-pic" style="background-image:url('${U(c.photos[0], 400, 260)}')"></span><b>${esc(c.make)} ${esc(c.model)}</b><span>${esc(c.variant)}</span></a></th>`).join('')}</tr></thead><tbody>${rows.map(([k, val, best, show]) => {
    let win = null; if(val){ const vs = cs.map(val); const t = best === 'min' ? Math.min(...vs) : Math.max(...vs); if(vs.filter(v => v === t).length < vs.length) win = t; }
    return `<tr><th scope="row">${k}</th>${cs.map(c => `<td class="${win != null && val(c) === win ? 'best' : ''}">${esc(show(c))}</td>`).join('')}</tr>`; }).join('')}</tbody>`;
  $('#cmpNote').textContent = 'Best value in each row is marked. Running cost assumes 1,500 km a month at today\'s pump prices.';
  const d = $('#cmpDlg'); d.showModal ? d.showModal() : d.setAttribute('open', '');
});
$('#cmpClose').addEventListener('click', () => $('#cmpDlg').close());
$('#cmpDlg').addEventListener('click', e => { if(e.target === $('#cmpDlg')) $('#cmpDlg').close(); });
$('#cmpDlg').addEventListener('click', e => { if(e.target.closest('.cmp-car')) $('#cmpDlg').close(); });

/* spec sheet: copy or print */
$('#specCopy').addEventListener('click', async () => {
  const c = cur.car; const txt = `${carName(c)} ${c.variant}\n${rs(c.price)}\n` + $$('#carSpec div').map(d => d.children[0].textContent + ': ' + d.children[1].textContent).join('\n') + `\n\nV8 Motors, 59B Royal Road, Coromandel. 5259 0327\n${location.href}`;
  try{ await navigator.clipboard.writeText(txt); toast('Specs copied'); }catch(e){ toast('Copy not allowed in this browser'); }
});
$('#specPrint').addEventListener('click', () => {
  const c = cur.car;
  $('#printSheet').innerHTML = `<header><b>V8 Motors</b><span>59B Royal Road, Coromandel, Mauritius. 5259 0327. veightmotorsv8@gmail.com</span></header><h1>${esc(carName(c))}</h1><p class="ps-v">${esc(c.variant)}, ref ${ref(c)}</p><img src="${U(c.photos[0], 1200, 700)}" alt=""><p class="ps-price">${rs(c.price)} <span>or about ${rs(monthly(c.price))} a month with 20% down</span></p><div class="ps-cols"><dl>${$('#carSpec').innerHTML}</dl><div><h2>Equipment</h2><ul>${c.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div></div><footer>Printed ${new Date().toLocaleDateString('en-GB')}. Prices and details can change; please confirm with our sales team.</footer>`;
  const im = $('#printSheet img'); const p = () => window.print();
  if(im.complete) p(); else { im.onload = im.onerror = p; setTimeout(p, 2500); }
});

function carExtras(c){
  gauges(c);
  $('#rcKm').value = 1500; $('#rcCons').value = consumption(c); $('#rcPrice').value = FUEL_PRICE[c.fuel] || 70.65; runCost();
  $('#rcFuelNote').textContent = c.fuel === 'Electric' ? 'Home charging at about Rs 7.50 per kWh. Change it to match your CEB tariff.' : `Pump price set to Rs ${FUEL_PRICE[c.fuel]} a litre. Fuel prices in Mauritius change by decree, so edit it if it has moved.`;
  $('#cTrade').max = Math.round(c.price * .7 / 25000) * 25000; $('#cTrade').value = 0;
  TD = {day: 0, slot: null}; renderTD();
  syncCmp();
}
$('#carShare').addEventListener('click', async () => {
  const c = cur.car, url = location.href, text = `${carName(c)}, ${rs(c.price)} at V8 Motors`;
  if(navigator.share){ try{ await navigator.share({title: text, url}); }catch(e){} return; }
  try{ await navigator.clipboard.writeText(url); toast('Link copied'); }catch(e){ toast(url); }
});

/* ════════════════════ FORMS (validation, spam checks, WhatsApp) ════════════════════ */
function bindForm(form, rulesFn, msgFn, evt){
  form.addEventListener('input', e => { const l = e.target.closest('.fld,label'); if(l) l.classList.remove('bad'); const t = l && l.querySelector('.err-t'); if(t) t.remove(); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const msg = form.querySelector('.form-msg'); msg.classList.remove('err'); msg.textContent = '';
    if(form.website && form.website.value){ msg.textContent = 'Thanks, we will be in touch.'; form.reset(); return; }   // bot filled the hidden field
    if(performance.now() - (form._shown || 0) < 1500){ msg.classList.add('err'); msg.textContent = 'That was quick. Please check the form and press send again.'; form._shown = 0; return; }
    let first = null;
    rulesFn(form).forEach(([name, test, err]) => {
      const el = form.elements[name], wrap = el.closest('.fld,label'), bad = !test(el.value);
      wrap.classList.toggle('bad', bad);
      const old = wrap.querySelector('.err-t'); if(old) old.remove();
      if(bad){ wrap.insertAdjacentHTML('beforeend', `<span class="err-t">${err}</span>`); if(!first) first = el; }
    });
    if(first){ first.focus(); msg.classList.add('err'); msg.textContent = 'Please fix the highlighted fields.'; return; }
    const last = store.get('v8-last-send', 0);
    if(Date.now() - last < 20000){ msg.classList.add('err'); msg.textContent = 'You just sent one. Give it a few seconds before sending again.'; return; }
    store.set('v8-last-send', Date.now());
    window.open(waLink(msgFn(form.elements)), '_blank', 'noopener');
    track('generate_lead', {form: evt});
    msg.textContent = 'WhatsApp opened with your message. Press send there and we will reply during sales hours.';
    form.reset();
  });
  form._shown = 0;
}
bindForm($('#sellForm'), () => [
  ['car', v => v.trim().length > 2, 'Which car is it?'],
  ['year', v => /^(19[89]\d|20[0-2]\d)$/.test(v.trim()), 'Enter a year like 2019'],
  ['km', v => /^\d[\d,\s]*$/.test(v.trim()), 'Numbers only'],
  ['name', v => v.trim().length > 1, 'Enter your name'],
  ['phone', MU_PHONE, 'Enter a Mauritian number, e.g. 5xxx xxxx']
], f => `Hi V8 Motors, I'd like a valuation.\nCar: ${f.car.value} (${f.year.value})\nMileage: ${f.km.value} km\nCondition: ${f.cond.value}${f.trade.checked ? '\nI would like to trade it in.' : ''}\nName: ${f.name.value}\nPhone: ${f.phone.value}`, 'sell');
bindForm($('#contactForm'), () => [
  ['name', v => v.trim().length > 1, 'Enter your name'],
  ['phone', MU_PHONE, 'Enter a Mauritian number, e.g. 5xxx xxxx']
], f => `Hi V8 Motors,\nAbout: ${f.topic.options[f.topic.selectedIndex].text}\nName: ${f.name.value}\nPhone: ${f.phone.value}${f.msg.value.trim() ? '\n\n' + f.msg.value.trim() : ''}`, 'contact');

/* ════════════════════ ROUTER + PAGE TRANSITIONS ════════════════════ */
const ROUTES = {
  '': {v:'home', n:'Home', i:'01', t:'V8 Motors | Quality Used Cars in Coromandel, Mauritius', d:`${CARS.length} checked used cars at V8 Motors, 59B Royal Road, Coromandel. Buy, sell or exchange, leasing through Rogers Capital, new stock every week.`},
  inventory: {v:'inventory', n:'Catalogue', i:'02'},
  saved: {v:'inventory', n:'Saved cars', i:'02'},
  car: {v:'car', n:'', i:'02'},
  sell: {v:'sell', n:'Sell your car', i:'03', t:'Sell or Exchange Your Car | V8 Motors, Coromandel', d:'Sell your car to V8 Motors or exchange it against one of ours. Send the details on WhatsApp for a guide price.'},
  about: {v:'about', n:'About us', i:'04', t:'About Us | V8 Motors, Coromandel', d:'V8 Motors buys, sells and exchanges quality used cars at 59B Royal Road, Coromandel. Checked cars, new stock every week, leasing through Rogers Capital.'},
  contact: {v:'contact', n:'Contact', i:'05', t:'Contact | V8 Motors, 59B Royal Road, Coromandel', d:'Call 5259 0327, 5750 7912, 5500 9527 or 5532 9727, email veightmotorsv8@gmail.com, or visit 59B Royal Road, Coromandel.'},
  privacy: {v:'privacy', n:'Privacy', i:'06', t:'Privacy Policy | V8 Motors', d:'How V8 Motors handles your personal data under the Mauritius Data Protection Act 2017.'},
  terms: {v:'terms', n:'Terms', i:'07', t:'Terms and Conditions | V8 Motors', d:'Terms for listings, prices, finance estimates and valuations at V8 Motors.'},
  '404': {v:'404', n:'Not found', i:'00', t:'Page not found | V8 Motors', d:'This page does not exist.'}
};
const cur = {view: null, car: null, path: null};
/*@@MOTION@@*/
let invScroll = 0, vtImg = null, routing = false, pending = false;

function parse(){
  const h = (location.hash || (window.V8_START ? '#/' + window.V8_START : '#/')).replace(/^#\/?/, '');
  const [path, q] = h.split('?');
  const seg = path.split('/').filter(Boolean);
  const params = new URLSearchParams(q || '');
  let key = seg[0] || '';
  if(['top','home'].includes(key)) key = '';
  if(key === 'car'){ const c = byId.get(+seg[1]); return c ? {key, r: ROUTES.car, params, car: c} : {key:'404', r: ROUTES['404'], params}; }
  if(!(key in ROUTES)) return {key:'404', r: ROUTES['404'], params};
  return {key, r: ROUTES[key], params};
}
function setMeta(title, desc){
  document.title = title;
  const m = document.querySelector('meta[name=description]'); if(m && desc) m.setAttribute('content', desc);
}
function navInd(){
  const a = $('.nav a.on'), ind = $('.nav-ind');
  if(!a){ ind.style.opacity = 0; return; }
  ind.style.opacity = 1; ind.style.width = (a.offsetWidth - 32) + 'px'; ind.style.transform = `translateX(${a.offsetLeft + 16}px)`;
}
function mount(R){
  const prev = cur.view;
  if(prev === 'inventory') invScroll = scrollY;
  $$('.view').forEach(v => { v.classList.toggle('on', v.dataset.view === R.r.v); v.classList.remove('intro'); });
  cur.view = R.r.v; cur.path = R.key;
  const navKey = R.key === 'car' ? 'inventory' : R.key;
  $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === navKey));
  navInd();
  if(R.r.t) setMeta(R.r.t, R.r.d);
  const ld = $('#carLd'); if(ld && R.key !== 'car') ld.remove();
  if(R.key === 'car') renderCar(R.car); else cur.car = null;
  if(R.r.v === 'inventory'){ fromParams(R.params, R.key === 'saved'); page = 1; paintFilters(); renderInv(); }
  if(R.key === 'contact'){
    const t = R.params.get('topic'); if(t && $(`#cTopic option[value="${t}"]`)) $('#cTopic').value = t;
    const c = byId.get(+R.params.get('car'));
    if(c) $('#cMsg').value = `I'd like to ${t === 'test-drive' ? 'test drive' : 'ask about'} the ${carName(c)} ${c.variant} (${rs(c.price)}, ref ${ref(c)}). `;
  }
  $$('form.card-form, form.mini-form').forEach(f => f._shown = performance.now());
  const view = $(`.view[data-view="${R.r.v}"]`);
  scrollTo(0, R.r.v === 'inventory' && prev === 'car' ? invScroll : 0);
  if(!reduced){ void view.offsetWidth; view.classList.add('intro'); }
  if(R.r.v === 'home'){ heroGo(heroK); } else { clearTimeout(heroT); heroT = 0; }
  if(STAGE){
    if(STAGE.stage) STAGE.stage.pause(R.r.v !== 'home');
    if(R.r.v === 'home' && !document.body.classList.contains('is-loading')) STAGE.start().then(ok => ok && cur.view === 'home' && stageOn(true));
  }
  settle(view);
  observe(view);
  sheet(false); menu(false);
  onScroll();
  M.mount(view, R);
}

function anim(el, kf, o){ return el.animate(kf, Object.assign({fill: 'forwards', easing: 'cubic-bezier(.77,0,.18,1)'}, o)).finished; }
async function wipe(R, doMount){
  if(MOTION) return M.wipe(R, doMount);
  const w = $('#wipe'), bars = $$('#wipe i'), lab = $('.w-label'), bar = $('.w-bar');
  $('#wipeName').textContent = R.key === 'car' ? `${R.car.make} ${R.car.model}` : R.r.n;
  $('#wipeIdx').textContent = R.key === 'car' ? `${R.car.year}, ${rs(R.car.price)}` : 'V8 Motors';
  w.classList.add('on');
  const E = 'cubic-bezier(.65,0,.35,1)';
  anim(lab, [{opacity: 0, transform: 'translateX(30px)'}, {opacity: 1, transform: 'none'}], {duration: 200, delay: 110, easing: 'cubic-bezier(.22,1,.36,1)'});
  anim(bar, [{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}], {duration: 240, delay: 120, easing: 'cubic-bezier(.22,1,.36,1)'});
  await Promise.all(bars.map((b, i) => anim(b, [{transform: 'translateX(160%) skewX(-14deg)'}, {transform: 'translateX(0) skewX(-14deg)'}], {duration: 250, delay: i * 22, easing: E})));
  doMount();
  await Promise.all([
    anim(lab, [{opacity: 1, transform: 'none'}, {opacity: 0, transform: 'translateX(-40px)'}], {duration: 180, easing: 'ease-in'}),
    ...bars.slice().reverse().map((b, i) => anim(b, [{transform: 'translateX(0) skewX(-14deg)'}, {transform: 'translateX(-160%) skewX(-14deg)'}], {duration: 320, delay: 60 + i * 25, easing: E}))
  ]);
  w.classList.remove('on');
  [...bars, lab, bar].forEach(el => el.getAnimations().forEach(a => a.cancel()));
}
async function route(first){
  if(routing){ pending = true; return; }
  const R = parse();
  if(first || reduced){ mount(R); return; }
  // same page, new filters (e.g. a footer link to SUVs while on Inventory): no curtain
  if(R.r.v === 'inventory' && cur.view === 'inventory'){ fromParams(R.params, R.key === 'saved'); page = 1; paintFilters(); renderInv(); scrollTo({top: 0, behavior: 'smooth'}); return; }
  routing = true;
  try{
    if(R.key === 'car' && vtImg && document.startViewTransition){
      // the clicked photo flies into the photo viewer
      const img = vtImg; vtImg = null;
      img.style.viewTransitionName = 'carpic';
      const t = document.startViewTransition(() => { img.style.viewTransitionName = ''; mount(R); const f = $('#vRing .v-panel img'); if(f) f.style.viewTransitionName = 'carpic'; });
      await t.finished.catch(() => {});
      const f = $('#vRing .v-panel img'); if(f) f.style.viewTransitionName = '';
    } else {
      vtImg = null;
      await wipe(R, () => mount(R));
    }
  } finally {
    routing = false;
    if(pending){ pending = false; route(); }
  }
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#/"]'); if(!a) return;
  const rk = (a.getAttribute('href').replace(/^#\/?/, '').split(/[/?]/)[0]) || '';
  $$('[data-nav]').forEach(n => n.classList.toggle('on', n.dataset.nav === (rk === 'car' ? 'inventory' : rk))); navInd();
  if(a.classList.contains('card-link')){ const im = a.closest('.card').querySelector('.card-media img'); if(im && im.complete && im.naturalWidth) vtImg = im; }
  if(a.getAttribute('href') === location.hash || (a.getAttribute('href') === '#/' && (location.hash === '' || location.hash === '#/'))){ e.preventDefault(); menu(false); scrollTo({top: 0, behavior: reduced ? 'auto' : 'smooth'}); }
});
addEventListener('hashchange', () => route());

/* ───────── mobile menu ───────── */
function menu(open){
  const m = $('#menu'), b = $('#burger');
  if(open === (b.getAttribute('aria-expanded') === 'true')) return;
  b.setAttribute('aria-expanded', open); b.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if(open){ m.style.setProperty('--menu-top', $('#hdr').getBoundingClientRect().bottom + 'px'); m.hidden = false; requestAnimationFrame(() => m.classList.add('open')); }
  else { m.classList.remove('open'); setTimeout(() => { if(b.getAttribute('aria-expanded') === 'false') m.hidden = true; }, 400); }
}
$('#burger').addEventListener('click', () => menu($('#burger').getAttribute('aria-expanded') !== 'true'));
$('#scrim').addEventListener('click', () => sheet(false));
addEventListener('keydown', e => { if(e.key === 'Escape'){ menu(false); sheet(false); } });

/* ───────── scroll: progress bar, header shadow, back to top ───────── */
function onScroll(){
  const y = scrollY, H = document.documentElement.scrollHeight - innerHeight;
  if(!MOTION && cur.view === 'home' && !reduced && y < innerHeight * 1.2){ const hi = $('.hero-in'); hi.style.transform = `translateY(${(y * .28).toFixed(1)}px)`; hi.style.opacity = Math.max(0, 1 - y / (innerHeight * .75)).toFixed(3); $('#heroSlides').style.transform = `translateY(${(y * .35).toFixed(1)}px) scale(${1 + y / 6000})`; }
  $('#sprog').style.setProperty('--p', H > 0 ? (y / H).toFixed(4) : 0);
  $('#hdr').classList.toggle('up', y > 10);
  $('#toTop').classList.toggle('on', y > innerHeight * 1.2);
}
addEventListener('scroll', onScroll, {passive: true});
$('#toTop').addEventListener('click', () => scrollTo({top: 0, behavior: reduced ? 'auto' : 'smooth'}));
addEventListener('resize', () => { navInd(); tabInd(); }, {passive: true});

/* ───────── image wipes + number counters when they come into view ───────── */
const io = new IntersectionObserver(es => es.forEach(en => {
  if(!en.isIntersecting) return; const el = en.target; io.unobserve(el);
  if(el.classList.contains('clip-in')) el.classList.add('shown');
  if(el.dataset.count){
    const to = +el.dataset.count, t0 = performance.now(), dur = reduced ? 1 : 1600;
    (function step(t){ const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(to * e) + (p === 1 && to >= 1000 ? '+' : ''); if(p < 1) requestAnimationFrame(step); })(t0);
  }
}), {threshold: .25});
// clipped photos need their own observer: Chromium measures an element *after* its own clip-path,
// so a fully clipped photo always reports 0% visible and a 25% threshold would never fire
const ioClip = new IntersectionObserver(es => es.forEach(en => {
  if(!en.isIntersecting) return; ioClip.unobserve(en.target); en.target.classList.add('shown');
}), {threshold: 0, rootMargin: '0px 0px -12% 0px'});
function observe(root){
  $$('.clip-in:not(.shown)', root).forEach(el => ioClip.observe(el));
  $$('[data-count]', root).forEach(el => io.observe(el));
}

/* ════════════════════ LOADER ════════════════════ */
document.getElementById('yr').textContent = muNow().getFullYear();
syncFavs();
route(true);
(function loader(){
  const L = $('#loader'), hv = $('.view[data-view="home"]');
  const intro = () => { if(cur.view === 'home'){ hv.classList.remove('intro'); void hv.offsetWidth; hv.classList.add('intro'); } };
  let finished = false;
  const done = () => { if(finished) return; finished = true; document.body.classList.remove('is-loading'); L.remove(); if(!consent) setTimeout(showCookie, 1600); if(MOTION) ST.refresh(); };
  if(cur.view === 'home') hv.classList.remove('intro');
  if(!MOTION){ intro(); done(); if(STAGE && STAGE.ready) STAGE.ready.then(ok => ok && cur.view === 'home' && stageOn(true)); return; }

  /* ── build the rev counter: 0 to 8 (x1000 r/min) over 270 degrees, redline from 6.5 ── */
  const NS = 'http://www.w3.org/2000/svg', C = 200, MAXV = 8, RED = 6.5;
  const ang = v => -135 + v / MAXV * 270;
  const pt = (v, r) => { const a = ang(v) * Math.PI / 180; return [C + r * Math.sin(a), C - r * Math.cos(a)]; };
  const mk = (tag, at) => { const e = document.createElementNS(NS, tag); for(const k in at) e.setAttribute(k, at[k]); return e; };
  const ticksG = $('#ldTicks'), ticks = [];
  const [rx0, ry0] = pt(RED, 182), [rx1, ry1] = pt(MAXV, 182);
  ticksG.append(mk('circle', {cx: C, cy: C, r: 182, class: 'ld-ring'}));
  ticksG.append(mk('path', {d: `M${rx0} ${ry0} A182 182 0 0 1 ${rx1} ${ry1}`, class: 'ld-red'}));
  for(let v = 0; v <= MAXV + 1e-6; v += .5){
    const maj = v % 1 === 0, [x1, y1] = pt(v, maj ? 146 : 156), [x2, y2] = pt(v, 170);
    const t = mk('line', {x1, y1, x2, y2, class: 'ld-tick' + (maj ? ' maj' : '') + (v >= RED ? ' hot' : '')});
    ticksG.append(t); ticks.push([v, t]);
    if(maj){
      const [nx, ny] = pt(v, 120), n = mk('text', {x: nx, y: ny, class: 'ld-num' + (v >= RED ? ' hot' : '')});
      n.textContent = v; ticksG.append(n); ticks.push([v, n]);
    }
  }
  const needle = $('#ldNeedle'), rpm = $('#ldRpm'), shift = $('#ldShift'), gauge = $('#ldGauge');
  const rev = {v: 0};
  const paint = () => {
    const v = Math.max(0, Math.min(MAXV, rev.v));
    needle.setAttribute('transform', `rotate(${ang(v).toFixed(2)} ${C} ${C})`);
    rpm.textContent = fmt(Math.round(v * 1000 / 50) * 50);
    ticks.forEach(([tv, el]) => el.classList.toggle('lit', tv <= v + .01));
    gauge.style.setProperty('--heat', (v / MAXV).toFixed(3));
    shift.classList.toggle('on', v >= 7);
  };
  paint();

  $('#ldWord').innerHTML = [...'V8 Motors'].map(ch => `<span class="ch">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
  const pct = $('#ldPct'), prog = {v: 0};
  const paintPct = () => pct.textContent = String(Math.round(prog.v)).padStart(3, '0');

  let fontsOk = !document.fonts, imgOk = false;
  if(document.fonts) document.fonts.ready.then(() => fontsOk = true);
  const first = $('.view.on img'); if(!first || first.complete) imgOk = true; else { first.addEventListener('load', () => imgOk = true, {once: true}); first.addEventListener('error', () => imgOk = true, {once: true}); }

  // first visit this session: the full ignition sweep. After that, just a quick start.
  let quick = false;
  try { quick = !!sessionStorage.getItem('v8rev'); sessionStorage.setItem('v8rev', '1'); } catch(e){}

  let idle = null, introDone = false;
  const tl = G.timeline({onComplete: () => {
    introDone = true;
    // idling: the needle trembles a little around 900 r/min
    idle = G.to(rev, {v: 1.05, duration: .11, repeat: -1, yoyo: true, ease: 'sine.inOut', onUpdate: paint});
  }})
    .from(gauge, {scale: .85, autoAlpha: 0, duration: .7, ease: 'expo.out'})
    .from('#ldWord .ch', {yPercent: 115, duration: .9, stagger: .04, ease: 'expo.out'}, .1)
    .from('.ld-meta', {autoAlpha: 0, y: 10, duration: .6, ease: 'expo.out'}, .3);
  if(!quick) tl.to(rev, {v: MAXV, duration: .6, ease: 'power2.inOut', onUpdate: paint}, .3)
               .to(rev, {v: 0, duration: .65, ease: 'power2.inOut', onUpdate: paint});
  tl.to(rev, {v: .9, duration: .35, ease: 'power2.out', onUpdate: paint});

  // the percentage is real: fonts and the first photo, and on the home page the 3D car download
  const want3d = !!(STAGE && STAGE.ready);
  let stageOk = !want3d;
  if(want3d) STAGE.ready.then(() => stageOk = true);
  const t0 = performance.now();
  (function wait(){
    const el = performance.now() - t0;
    const base = (fontsOk ? 1 : 0) + (imgOk ? 1 : 0);
    const real = want3d ? base * 4 + STAGE.progress * 78 + (stageOk ? 6 : 0) : base * 46;
    const target = Math.min(94, Math.max(real, Math.min(24, el / 60)));
    if(target > prog.v + .5) G.to(prog, {v: target, duration: .45, ease: 'power2.out', overwrite: true, onUpdate: paintPct});
    if((fontsOk && imgOk && introDone && stageOk) || el > (want3d ? 9000 : 5000)) finish(); else setTimeout(wait, 60);
  })();

  function finish(){
    if(idle) idle.kill();
    tl.progress(1);
    // launch streaks: lines shoot out from the middle of the screen
    const box = $('#ldStreaks'), far = Math.max(innerWidth, innerHeight) * .9;
    box.innerHTML = '<i></i>'.repeat(42);
    const st = $$('i', box).map(el => { const a = Math.random() * Math.PI * 2; return {el, a, d: 60 + Math.random() * 120}; });
    st.forEach(s => G.set(s.el, {rotation: s.a * 180 / Math.PI, x: Math.cos(s.a) * s.d, y: Math.sin(s.a) * s.d, scaleX: .05, opacity: 0}));

    G.timeline()
      .to(prog, {v: 100, duration: .3, ease: 'power2.out', onUpdate: paintPct}, 0)
      // throttle blip, settle, then wind it up to the redline
      .to(rev, {v: 4.2, duration: .2, ease: 'power2.out', onUpdate: paint}, 0)
      .to(rev, {v: 2.1, duration: .28, ease: 'power2.in', onUpdate: paint})
      .to(rev, {v: 7.85, duration: .8, ease: 'power2.in', onUpdate: paint})
      .to(gauge, {x: 'random(-4,4)', y: 'random(-3,3)', duration: .035, repeat: 9, yoyo: true, repeatRefresh: true, ease: 'none'}, '-=.32')
      .addLabel('go')
      // the clutch drops: needle falls back a shift, the gauge rushes at you, streaks fly past
      .to(rev, {v: 5.4, duration: .16, ease: 'power3.out', onUpdate: paint}, 'go')
      .set(gauge, {x: 0, y: 0}, 'go')
      .to('.ld-in', {scale: 3.4, autoAlpha: 0, duration: .65, ease: 'expo.in'}, 'go')
      .to(st.map(s => s.el), {
        x: i => Math.cos(st[i].a) * far, y: i => Math.sin(st[i].a) * far,
        scaleX: 1, opacity: 1, duration: .7, ease: 'power3.in', stagger: {each: .006, from: 'random'}
      }, 'go+=.05')
      .to(L, {autoAlpha: 0, duration: .4, ease: 'power2.in'}, 'go+=.5')
      .add(intro, 'go+=.55')
      .fromTo('#heroSlides', {'--hz': 1.3, '--hb': 10}, {'--hz': 1, '--hb': 0, duration: 1.6, ease: 'expo.out'}, 'go+=.5')
      .add(() => {
        // the car starts as the gauge flies past; if it is still downloading, the photos show until it is ready
        if(!STAGE || !STAGE.ready) return;
        if(stageOk) stageOn(quick);
        else STAGE.ready.then(ok => ok && cur.view === 'home' && stageOn(true));
      }, 'go+=.42')
      .add(done, 'go+=.92')
      .add(heroGleam, 'go+=1.05');
  }
})();}

/* the 3D showroom (assets/showroom.bundle.js, built from src/3d). Starts downloading straight away when you
   land on the home page, so the loader can count it in; otherwise only once you go home. Plain scripts, so it
   also works when index.html is opened straight from disk. Never on reduced motion, Data Saver, low-memory
   devices or without WebGL2: those visitors keep the photo slideshow and the plain chapters. */
window.V8_STAGE = (function(){
  const host = document.getElementById('heroStage'), nc = navigator.connection;
  if(!host || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  if((nc && nc.saveData) || (navigator.deviceMemory && navigator.deviceMemory < 4)) return null;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if(!gl) return null;
    const lose = gl.getExtension('WEBGL_lose_context'); if(lose) lose.loseContext();
  } catch(e){ return null; }
  // phones reserve room for the car above the headline (if the 3D never arrives, the photo just shows more)
  document.documentElement.classList.add('can-3d');
  const S = {progress: 0, stage: null, failed: false, ready: null, onLost: null};
  const script = src => new Promise((res, rej) => { const el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = rej; document.head.appendChild(el); });
  S.start = () => S.ready || (S.ready = script('assets/showroom.bundle.js')
    .then(() => {
      S.stage = window.V8Showroom.createShowroom(host, {
        url: 'assets/showroom-car.glb', fileUrl: 'assets/showroom-car.js',
        dragEl: document.getElementById('hero'), heroEl: document.getElementById('hero'),
        journeyEl: document.getElementById('journey'), pinsEl: document.getElementById('stagePins'),
        mobile: !matchMedia('(min-width: 900px)').matches,
        onProgress: p => S.progress = p,
        onLost: () => { S.failed = true; if(S.onLost) S.onLost(); }
      });
      return S.stage.ready;
    })
    .catch(e => { S.failed = true; console.warn('3D showroom off:', e); return null; }));
  const h = location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  if(!window.V8_START && (h === '' || h === 'home' || h === 'top')) S.start();
  return S;
})();

/* load the live stock list (edited in admin.html); fall back to the copy built into this page */
(function(){
  // wait for the deferred animation libraries (they run before DOMContentLoaded)
  const ready = f => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', f, {once: true}) : f();
  const go = d => ready(() => V8_BOOT(Array.isArray(d) && d.length ? d : window.V8_CARS));
  if(location.protocol === 'file:'){ go(null); return; }
  fetch('data/cars.json?v=' + Date.now(), {cache: 'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null).then(go);
})();
