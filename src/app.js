(function(){
'use strict';

/* ───────── settings you may want to change ───────── */
const CFG = {
  wa: '23054742683',
  gaId: '',            // Google Analytics 4 ID, e.g. 'G-XXXXXXX'. Loads only after the visitor accepts cookies.
  rate: 0.085,         // finance estimate, yearly
  pageSize: 12
};

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
const U = (id, w, h) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? '&h=' + h : ''}&q=${w > 1200 ? 72 : 70}`;
const ref = c => 'YDM-' + String(c.id).padStart(3, '0');
const carName = c => `${c.year} ${c.make} ${c.model}`;
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
const CARS = window.YDM_CARS;
const byId = new Map(CARS.map(c => [c.id, c]));
const MAKES = [...new Set(CARS.map(c => c.make))].sort();
const BODIES = ['SUV','Sedan','Hatchback','Pickup','Coupé'].filter(b => CARS.some(c => c.body === b));
const FUELS = ['Petrol','Diesel','Hybrid','Electric'].filter(f => CARS.some(c => c.fuel === f));
const TRANS = ['Automatic','Manual'].filter(t => CARS.some(c => c.trans === t));
const PRICE_STEPS = (() => { const a = []; for(let v = 500000; v < 3000000; v += 100000) a.push(v); for(let v = 3000000; v < 6000000; v += 250000) a.push(v); for(let v = 6000000; v <= 17000000; v += 1000000) a.push(v); return a; })();
const YMIN = Math.min(...CARS.map(c => c.year)), YMAX = Math.max(...CARS.map(c => c.year));
const YEAR_STEPS = Array.from({length: YMAX - YMIN + 1}, (_, i) => YMIN + i);
const KM_STEPS = [10000,20000,30000,40000,50000,60000,80000,100000,Infinity];

/* ───────── analytics + cookie consent ───────── */
let consent = store.get('ydm-consent', null), gaOn = false;
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
$('#ckYes').addEventListener('click', () => { consent = 'all'; store.set('ydm-consent', consent); hideCookie(); loadGA(); toast('Thanks, cookie choice saved'); });
$('#ckNo').addEventListener('click', () => { consent = 'essential'; store.set('ydm-consent', consent); hideCookie(); });
document.addEventListener('click', e => { if(e.target.closest('[data-cookie-settings]')) showCookie(); });
document.addEventListener('click', e => { const t = e.target.closest('[data-track]'); if(t) track(t.dataset.track + '_click', {page: location.hash || '#/'}); });
loadGA();

/* ───────── images: shimmer while loading, clean placeholder if offline ───────── */
const BOX = '.ph,.v-panel,.slide,.type,.how-media,.sell-pic,.about-pic,.phead-img,.v-thumbs button';
document.addEventListener('load', e => { if(e.target.tagName === 'IMG'){ const p = e.target.closest(BOX); if(p){ p.classList.add('ok'); p.classList.remove('noimg'); } e.target.classList.remove('bad'); } }, true);
document.addEventListener('error', e => { if(e.target.tagName === 'IMG'){ e.target.classList.add('bad'); const p = e.target.closest(BOX); if(p) p.classList.add('ok', 'noimg'); } }, true);
function settle(root){ $$('img', root).forEach(im => { if(im.complete){ const p = im.closest(BOX); if(!p) return; p.classList.add('ok'); if(!im.naturalWidth){ im.classList.add('bad'); p.classList.add('noimg'); } } }); }

/* ───────── favourites ───────── */
const favs = new Set(store.get('ydm-favs', []).filter(id => byId.has(id)));
function syncFavs(bump){
  store.set('ydm-favs', [...favs]);
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

/* ───────── car card ───────── */
function tagFor(c){
  if(c.was) return '<span class="card-tag red">Price drop</span>';
  if(c.added <= 3) return '<span class="card-tag red">Just arrived</span>';
  if(c.fuel === 'Electric') return '<span class="card-tag green">Electric</span>';
  if(c.km < 12000) return '<span class="card-tag">Low mileage</span>';
  return '';
}
function cardHTML(c, i, lazy){
  const p = c.photos[0];
  return `<article class="card${i != null ? ' enter' : ''}" data-id="${c.id}" style="--d:${Math.min((i||0) * 55, 440)}ms">
  <div class="card-media ph"><img src="${U(p, 640, 440)}" srcset="${U(p, 480, 330)} 480w, ${U(p, 640, 440)} 640w, ${U(p, 960, 660)} 960w" sizes="(max-width:640px) 92vw, 340px" alt="${esc(carName(c))} in ${esc(c.color.toLowerCase())}" width="640" height="440" ${lazy === false ? '' : 'loading="lazy"'} decoding="async"></div>
  ${tagFor(c)}
  <button class="fav${favs.has(c.id) ? ' on' : ''}" data-fav="${c.id}" aria-pressed="${favs.has(c.id)}" aria-label="Save ${esc(carName(c))}"><svg><use href="#i-heart"/></svg></button>
  <div class="card-body">
    <div class="card-top"><h3 class="card-t">${esc(c.make)} ${esc(c.model)}</h3><span class="card-y">${c.year}</span></div>
    <p class="card-v">${esc(c.variant)}</p>
    <p class="card-meta"><span>${fmt(c.km)} km</span><span>${c.fuel}</span><span>${c.trans === 'Automatic' ? 'Auto' : 'Manual'}</span></p>
    <div class="card-foot"><div class="card-price">${c.was ? `<s>${rs(c.was)}</s>` : ''}${rs(c.price)}</div><div class="card-mo">from<b>${rs(monthly(c.price))}/mo</b></div></div>
  </div>
  <a class="card-link" href="#/car/${c.id}" aria-label="View ${esc(carName(c))}, ${rs(c.price)}"></a>
</article>`;
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
  el.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
  el.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
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
  addEventListener('pointermove', e => { if(!down) return; const dx = e.clientX - sx; if(Math.abs(dx) > 6){ moved = true; rail.classList.add('drag'); } if(moved) rail.scrollLeft = sl - dx; });
  addEventListener('pointerup', () => { if(!down) return; down = false; setTimeout(() => rail.classList.remove('drag'), 0); });
}
$$('.rail').forEach(railify);
document.addEventListener('click', e => { const b = e.target.closest('[data-rail]'); if(!b) return; const r = document.getElementById(b.dataset.rail); r.scrollBy({left: +b.dataset.dir * r.clientWidth * .8, behavior: reduced ? 'auto' : 'smooth'}); });

/* ───────── opening hours (Mauritius time) ───────── */
const muNow = () => new Date(new Date().toLocaleString('en-US', {timeZone: 'Indian/Mauritius'}));
(function hours(){
  const n = muNow(), d = n.getDay(), m = n.getHours() * 60 + n.getMinutes();
  const row = d === 0 ? 'sun' : d === 6 ? 'sat' : 'wk';
  $$('[data-hours] [data-d="' + row + '"]').forEach(el => el.classList.add('today'));
  const open = (d >= 1 && d <= 5 && m >= 540 && m < 1020) || (d === 6 && m >= 540 && m < 720);
  const until = d === 6 ? '12:00' : '17:00';
  let next = 'Monday 09:00';
  if(d >= 1 && d <= 5 && m < 540) next = 'today 09:00';
  else if(d >= 1 && d <= 4) next = 'tomorrow 09:00';
  else if(d === 5) next = 'Saturday 09:00';
  else if(d === 6 && m < 540) next = 'today 09:00';
  $('#tbOpen').innerHTML = `<i class="open-dot${open ? '' : ' closed'}"></i>${open ? 'Open now, until ' + until : 'Closed, opens ' + next}`;
})();

/* ════════════════════ HOME ════════════════════ */
const HERO = ['911','Taycan 4S','G 63','Range Rover Sport'].map(m => CARS.find(c => c.model === m)).filter(Boolean);
let heroK = 0, heroT = 0, heroBusy = false;
const HDUR = 7000;
(function heroBuild(){
  $('#heroSlides').innerHTML = HERO.map((c, i) => `<div class="slide${i ? '' : ' on'}"><img src="${U(c.photos[0], 1920)}" srcset="${U(c.photos[0], 900)} 900w, ${U(c.photos[0], 1400)} 1400w, ${U(c.photos[0], 2200)} 2200w" sizes="100vw" alt="${esc(carName(c))}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></div>`).join('');
  $('#heroBars').innerHTML = HERO.map(() => '<i></i>').join('');
  $('#heroBars').style.setProperty('--dur', HDUR + 'ms');
  $('#heroTot').textContent = String(HERO.length).padStart(2, '0');
})();
function heroCap(c, anim){
  const set = () => { $('#heroCapName').textContent = `${c.year} ${c.make} ${c.model}`; $('#heroCapPrice').textContent = `${rs(c.price)}, ${fmt(c.km)} km`; $('#heroCap').href = '#/car/' + c.id; $('#heroCap').classList.remove('sw'); };
  if(anim){ $('#heroCap').classList.add('sw'); setTimeout(set, 330); } else set();
}
function heroBars(k){
  $$('#heroBars i').forEach((b, j) => { b.classList.remove('on', 'done'); if(j < k) b.classList.add('done'); });
  const b = $$('#heroBars i')[k]; void b.offsetWidth; b.classList.add('on');
  $('#heroIdx').textContent = String(k + 1).padStart(2, '0');
}
function heroGo(k){
  if(heroBusy) return; k = (k + HERO.length) % HERO.length;
  clearTimeout(heroT);
  if(k !== heroK){
    heroBusy = true;
    const S = $$('.slide'), old = S[heroK], nw = S[k];
    nw.classList.add('in');
    setTimeout(() => { old.classList.remove('on'); nw.classList.remove('in'); nw.classList.add('on'); heroBusy = false; }, reduced ? 0 : 1300);
    heroCap(HERO[k], true); heroK = k;
  }
  heroBars(k);
  if(!reduced) heroT = setTimeout(() => { if(cur.view === 'home') heroGo(heroK + 1); else heroT = 0; }, HDUR);
}
$('#heroPrev').addEventListener('click', () => heroGo(heroK - 1));
$('#heroNext').addEventListener('click', () => heroGo(heroK + 1));
heroCap(HERO[0]);

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
const TYPE_PIC = {SUV:'Range Rover Sport', Sedan:'C 200', Hatchback:'Golf GTI', Pickup:'Ranger', 'Coupé':'M4'};
$('#typeRail').innerHTML = BODIES.map(b => {
  const n = CARS.filter(c => c.body === b).length;
  const c = CARS.find(x => x.model === TYPE_PIC[b] && x.body === b) || CARS.find(x => x.body === b);
  return `<a class="type ph" href="#/inventory?body=${encodeURIComponent(b)}"><img src="${U(c.photos[0], 600, 800)}" alt="${b}: ${esc(carName(c))}" loading="lazy" decoding="async" width="600" height="800"><div class="type-in"><div><b>${b === 'Pickup' ? 'Pickups' : b === 'Coupé' ? 'Coupés' : b + 's'}</b><span>${n} in stock</span></div><span class="type-go"><svg><use href="#i-arrow"/></svg></span></div></a>`;
}).join('') + `<a class="type ph" href="#/inventory?fuel=Electric,Hybrid"><img src="${U((CARS.find(c => c.model === 'Model Y') || CARS.find(c => c.fuel === 'Electric')).photos[0], 600, 800)}" alt="Electric and hybrid cars" loading="lazy" decoding="async" width="600" height="800"><div class="type-in"><div><b>Electric &amp; hybrid</b><span>${CARS.filter(c => c.fuel === 'Electric' || c.fuel === 'Hybrid').length} in stock</span></div><span class="type-go"><svg><use href="#i-arrow"/></svg></span></div></a>`;

/* just arrived rail */
$('#newRail').innerHTML = [...CARS].sort((a, b) => a.added - b.added || b.id - a.id).slice(0, 10).map(c => cardHTML(c)).join('');

/* makes marquee */
(function(){
  const items = MAKES.map(m => `<a href="#/inventory?make=${encodeURIComponent(m)}">${esc(m)}<sup>${CARS.filter(c => c.make === m).length}</sup></a>`).join('');
  $('#brandTrack').innerHTML = items + items.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ');
})();

/* reviews */
const REVIEWS = [
  ['Rakesh D.','Quatre Bornes','Bought a BMW X1. They handled the registration and delivered it to my home in Quatre Bornes. Four days from first call to keys.'],
  ['Priya S.','Moka','Fair trade-in price for my old Swift and nobody pushed me toward something I didn\'t want. Refreshing.'],
  ['Jean-Marc L.','Curepipe','Any question after the sale, they answer the same day. I feel looked after, not like another number.'],
  ['Anisha R.','Flic en Flac','The car was exactly as described, down to the small scratch they had pointed out in the photos. Honest people.'],
  ['Kevin T.','Port Louis','Sorted the bank loan paperwork for me in two days. I only went to the showroom twice.'],
  ['Sophie M.','Grand Baie','Test drove three SUVs in one Saturday morning. No pressure at all. Bought the Tucson the week after.']
];
(function quotes(){
  const st = $('#quoteStage');
  st.innerHTML = REVIEWS.map(([n, t, q], i) => `<figure class="q${i ? '' : ' on'}" aria-hidden="${i ? 'true' : 'false'}"><div class="stars" aria-label="5 out of 5">★★★★★</div><blockquote>${q.split(' ').map((w, j) => `<span class="w" style="transition-delay:${j * 22}ms">${esc(w)}</span>`).join(' ')}</blockquote><figcaption class="q-who"><i>${n[0]}</i><div><b>${esc(n)}</b><span>${esc(t)}</span></div></figcaption></figure>`).join('');
  let k = 0, tm;
  const go = n => { const Q = $$('.q', st); Q[k].classList.remove('on'); Q[k].setAttribute('aria-hidden', 'true'); k = (n + Q.length) % Q.length; Q[k].classList.add('on'); Q[k].setAttribute('aria-hidden', 'false'); $('#qIdx').textContent = `${k + 1} / ${Q.length}`; clearTimeout(tm); if(!reduced) tm = setTimeout(() => go(k + 1), 8000); };
  $('#qPrev').addEventListener('click', () => go(k - 1));
  $('#qNext').addEventListener('click', () => go(k + 1));
  $('#qIdx').textContent = `1 / ${REVIEWS.length}`;
  if(!reduced) tm = setTimeout(() => go(1), 8000);
  $('#reviewsAll').innerHTML = REVIEWS.map(([n, t, q]) => `<figure class="rv"><div class="stars" aria-label="5 out of 5">★★★★★</div><p>${esc(q)}</p><figcaption class="q-who"><i>${n[0]}</i><div><b>${esc(n)}</b><span>${esc(t)}</span></div></figcaption></figure>`).join('');
})();

/* mini sell form on home */
bindForm($('#sellMini'), f => [
  ['car', v => v.trim().length > 3, 'Tell us the car'],
  ['phone', MU_PHONE, 'Enter a Mauritian number']
], f => `Hi Your Dream Motors, I'd like a price for my car.\nCar: ${f.car.value}\nPhone: ${f.phone.value}`, 'sell_quick');

/* ════════════════════ INVENTORY ════════════════════ */
const DEF = () => ({q:'', make:'', model:'', body:[], fuel:[], trans:[], pmin:PRICE_STEPS[0], pmax:PRICE_STEPS[PRICE_STEPS.length - 1], ymin:YMIN, ymax:YMAX, km:Infinity, saved:false, sort:'new', view:'grid'});
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
  if(F.sort !== 'new') p.set('sort', F.sort);
  if(F.view === 'list') p.set('view', 'list');
  return p.toString();
}
function syncURL(){ const q = toParams(); history.replaceState(null, '', '#/inventory' + (q ? '?' + q : '')); }

function match(c, skip){
  if(F.q){ const hay = `${c.year} ${c.make} ${c.model} ${c.variant} ${c.color} ${c.body} ${c.fuel} ${ref(c)}`.toLowerCase(); if(!F.q.toLowerCase().split(/\s+/).every(w => hay.includes(w))) return false; }
  if(skip !== 'make' && F.make && c.make !== F.make) return false;
  if(skip !== 'model' && F.model && c.model !== F.model) return false;
  if(skip !== 'body' && F.body.length && !F.body.includes(c.body)) return false;
  if(skip !== 'fuel' && F.fuel.length && !F.fuel.includes(c.fuel)) return false;
  if(skip !== 'trans' && F.trans.length && !F.trans.includes(c.trans)) return false;
  if(c.price < F.pmin || (F.pmax < PRICE_STEPS[PRICE_STEPS.length - 1] && c.price > F.pmax)) return false;
  if(c.year < F.ymin || c.year > F.ymax) return false;
  if(c.km > F.km) return false;
  if(F.saved && !favs.has(c.id)) return false;
  return true;
}
function sorted(list){
  const s = {
    'new': (a, b) => a.added - b.added || b.id - a.id,
    'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price,
    'year-desc': (a, b) => b.year - a.year || a.km - b.km, 'km-asc': (a, b) => a.km - b.km
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
  $('#fSaved').checked = F.saved; $('#fSort').value = F.sort;
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
    g.innerHTML = list.slice(0, shown).map((c, i) => cardHTML(c, i, i < 3 ? false : undefined)).join('');
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
  const title = F.saved ? 'Saved cars' : F.body.length === 1 && ACT.length === 1 ? ({Pickup:'Pickups','Coupé':'Coupés'}[F.body[0]] || F.body[0] + 's') : F.make && ACT.length === 1 ? F.make + ' cars' : 'Inventory';
  $('#invTitle').textContent = title; $('#invCrumb').textContent = title;
  if(cur.view === 'inventory') setMeta(`${title} | ${total} ${total === 1 ? 'car' : 'cars'} | Your Dream Motors, Moka`, `Browse ${total} inspected pre-owned ${title === 'Inventory' ? 'cars' : title.toLowerCase()} for sale in Mauritius. Prices, mileage and photos for every car.`);
  if(F.saved && !total) { $('#invEmpty h2').textContent = 'No saved cars yet'; $('#invEmpty p').innerHTML = 'Tap the heart on any car to keep it here. Saved cars stay on this device.'; }
  else { $('#invEmpty h2').textContent = 'No cars match those filters'; $('#invEmpty p').innerHTML = 'Try a wider price range, or clear a filter. New stock arrives every week, so you can also <a href="#/contact?topic=find">ask us to find one</a>.'; }
}
$('#moreBtn').addEventListener('click', () => { page++; renderInv(true); });

/* ════════════════════ CAR PAGE + 3D VIEWER ════════════════════ */
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
    vw.style.setProperty('--gx', (x * 100) + '%'); vw.style.setProperty('--gy', (y * 100) + '%');
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
  $$('#carTabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === name));
  $$('.tab-pane').forEach(p => p.classList.toggle('on', p.dataset.pane === name));
  tabInd();
}
$('#carTabs').addEventListener('click', e => { const b = e.target.closest('button'); if(b) tab(b.dataset.tab); });

/* finance calculator */
function calc(){
  const c = cur.car; if(!c) return;
  const dep = +$('#cDep').value, term = +$('#cTerm').value, m = monthly(c.price, dep, term);
  $('#cDepV').textContent = `${dep}% (${rs(c.price * dep / 100)})`;
  $('#cTermV').textContent = `${term} months`;
  $('#cOut').textContent = rs(m);
  $('#cNote').textContent = `Borrowing ${rs(c.price * (1 - dep / 100))} over ${term / 12} years`;
}
$('#cDep').addEventListener('input', calc); $('#cTerm').addEventListener('input', calc);

function renderCar(c){
  cur.car = c;
  const name = `${c.make} ${c.model}`;
  $('#carCrumb').textContent = name;
  $('#carEyebrow').textContent = `${c.year} · ${c.body} · Ref ${ref(c)}`;
  $('#carTitle').textContent = name;
  $('#carVar').textContent = c.variant;
  $('#carPrice').textContent = rs(c.price);
  $('#carWas').textContent = c.was ? rs(c.was) : '';
  $('#carMo').innerHTML = `About <b>${rs(monthly(c.price))}</b> a month with 20% down. <button type="button" id="toFin">Work it out</button>`;
  $('#toFin').onclick = () => { tab('fi'); $('#carTabs').scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'center'}); };
  $('#carFacts').innerHTML = [['Mileage', fmt(c.km) + ' km'], ['Year', c.year], ['Fuel', c.fuel], ['Gearbox', c.trans], ['Power', c.power], ['Colour', c.color]].map(([k, v]) => `<li><small>${k}</small><b>${esc(v)}</b></li>`).join('');
  $('#carBook').href = `#/contact?topic=test-drive&car=${c.id}`;
  $('#carWa').href = waLink(`Hi Your Dream Motors, is the ${carName(c)} ${c.variant} (${rs(c.price)}, ref ${ref(c)}) still available?`);
  $('#carDesc').textContent = c.desc;
  $('#carHigh').innerHTML = c.highlights.map(h => `<li>${esc(h)}</li>`).join('');
  $('#carSpec').innerHTML = [['Make', c.make], ['Model', c.model], ['Variant', c.variant], ['Year', c.year], ['Body', c.body], ['Mileage', fmt(c.km) + ' km'], ['Fuel', c.fuel], ['Gearbox', c.trans], ['Engine', c.engine], ['Power', c.power], ['Drive', c.drive], ['Colour', c.color], ['Doors', c.doors], ['Seats', c.seats], ['Owners', c.owners], ['Stock ref', ref(c)]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
  $('#carFeat').innerHTML = c.features.map(f => `<li>${esc(f)}</li>`).join('');
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
  ld.textContent = JSON.stringify({'@context':'https://schema.org','@type':'Car',name:`${carName(c)} ${c.variant}`,brand:{'@type':'Brand',name:c.make},model:c.model,vehicleModelDate:String(c.year),color:c.color,bodyType:c.body,fuelType:c.fuel,vehicleTransmission:c.trans,mileageFromOdometer:{'@type':'QuantitativeValue',value:c.km,unitCode:'KMT'},image:c.photos.map(p => U(p, 1200)),offers:{'@type':'Offer',price:c.price,priceCurrency:'MUR',availability:'https://schema.org/InStock',seller:{'@type':'AutoDealer',name:'Your Dream Motors'}}});
  setMeta(`${carName(c)} ${c.variant} for sale, ${rs(c.price)} | Your Dream Motors`, `${carName(c)} ${c.variant} in ${c.color.toLowerCase()}, ${fmt(c.km)} km, ${c.fuel.toLowerCase()}, ${c.trans.toLowerCase()}. ${rs(c.price)} at Your Dream Motors, Moka. Inspected and registered.`);
  requestAnimationFrame(tabInd);
}
$('#carSave').addEventListener('click', () => cur.car && toggleFav(cur.car.id));
$('#carShare').addEventListener('click', async () => {
  const c = cur.car, url = location.href, text = `${carName(c)}, ${rs(c.price)} at Your Dream Motors`;
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
    const last = store.get('ydm-last-send', 0);
    if(Date.now() - last < 20000){ msg.classList.add('err'); msg.textContent = 'You just sent one. Give it a few seconds before sending again.'; return; }
    store.set('ydm-last-send', Date.now());
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
  ['phone', MU_PHONE, 'Enter a Mauritian number, e.g. 5761 8275']
], f => `Hi Your Dream Motors, I'd like a valuation.\nCar: ${f.car.value} (${f.year.value})\nMileage: ${f.km.value} km\nCondition: ${f.cond.value}${f.trade.checked ? '\nI would like to trade it in.' : ''}\nName: ${f.name.value}\nPhone: ${f.phone.value}`, 'sell');
bindForm($('#contactForm'), () => [
  ['name', v => v.trim().length > 1, 'Enter your name'],
  ['phone', MU_PHONE, 'Enter a Mauritian number, e.g. 5761 8275']
], f => `Hi Your Dream Motors,\nAbout: ${f.topic.options[f.topic.selectedIndex].text}\nName: ${f.name.value}\nPhone: ${f.phone.value}${f.msg.value.trim() ? '\n\n' + f.msg.value.trim() : ''}`, 'contact');

/* ════════════════════ ROUTER + PAGE TRANSITIONS ════════════════════ */
const ROUTES = {
  '': {v:'home', n:'Home', i:'01', t:'Your Dream Motors | Quality Pre-Owned Cars in Moka, Mauritius', d:`${CARS.length} inspected pre-owned cars in stock at Your Dream Motors, Royal Road, Moka. Registration handled, free island-wide delivery, trade-ins welcome.`},
  inventory: {v:'inventory', n:'Inventory', i:'02'},
  saved: {v:'inventory', n:'Saved cars', i:'02'},
  car: {v:'car', n:'', i:'02'},
  sell: {v:'sell', n:'Sell your car', i:'03', t:'Sell or Trade Your Car in Mauritius | Your Dream Motors', d:'Free valuation, a firm offer the same day and no commission. Sell or trade in your car at Your Dream Motors, Moka.'},
  about: {v:'about', n:'About us', i:'04', t:'About Us | Your Dream Motors, Moka since 2012', d:'A Moka car dealership since 2012. Over 3,000 cars delivered, with inspection, paperwork and island-wide delivery included.'},
  contact: {v:'contact', n:'Contact', i:'05', t:'Contact and Opening Hours | Your Dream Motors, Moka', d:'Call +230 433 8026, WhatsApp 5474 2683 or visit us on Royal Road, Moka. Open Monday to Friday 09:00 to 17:00, Saturday 09:00 to 12:00.'},
  privacy: {v:'privacy', n:'Privacy', i:'06', t:'Privacy Policy | Your Dream Motors', d:'How Your Dream Motors handles your personal data under the Mauritius Data Protection Act 2017.'},
  terms: {v:'terms', n:'Terms', i:'07', t:'Terms and Conditions | Your Dream Motors', d:'Terms for listings, prices, finance estimates and valuations at Your Dream Motors.'},
  '404': {v:'404', n:'Not found', i:'00', t:'Page not found | Your Dream Motors', d:'This page does not exist.'}
};
const cur = {view: null, car: null, path: null};
let invScroll = 0, vtImg = null, routing = false, pending = false;

function parse(){
  const h = (location.hash || '#/').replace(/^#\/?/, '');
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
  settle(view);
  observe(view);
  sheet(false); menu(false);
  onScroll();
}

function anim(el, kf, o){ return el.animate(kf, Object.assign({fill: 'forwards', easing: 'cubic-bezier(.77,0,.18,1)'}, o)).finished; }
async function wipe(R, doMount){
  const w = $('#wipe'), bars = $$('#wipe i'), lab = $('.w-label'), bar = $('.w-bar');
  $('#wipeName').textContent = R.key === 'car' ? `${R.car.make} ${R.car.model}` : R.r.n;
  $('#wipeIdx').textContent = R.key === 'car' ? `${R.car.year} · ${rs(R.car.price)}` : 'Your Dream Motors';
  w.classList.add('on');
  const view = $('.view.on');
  if(view) view.animate([{transform: 'none', opacity: 1}, {transform: 'scale(.97) translateY(-14px)', opacity: .6}], {duration: 520, easing: 'cubic-bezier(.77,0,.18,1)', fill: 'forwards'});
  await Promise.all([
    ...bars.map((b, i) => anim(b, [{transform: 'translateX(160%) skewX(-14deg)'}, {transform: 'translateX(0) skewX(-14deg)'}], {duration: 540, delay: i * 55})),
    anim(lab, [{opacity: 0, transform: 'translateX(40px)'}, {opacity: 1, transform: 'none'}], {duration: 380, delay: 300, easing: 'cubic-bezier(.22,1,.36,1)'}),
    anim(bar, [{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}], {duration: 460, delay: 330, easing: 'cubic-bezier(.22,1,.36,1)'})
  ]);
  if(view) view.getAnimations().forEach(a => a.cancel());
  doMount();
  await new Promise(r => setTimeout(r, 70));
  await Promise.all([
    anim(lab, [{opacity: 1, transform: 'none'}, {opacity: 0, transform: 'translateX(-60px)'}], {duration: 320, easing: 'cubic-bezier(.55,0,.67,.2)'}),
    ...bars.slice().reverse().map((b, i) => anim(b, [{transform: 'translateX(0) skewX(-14deg)'}, {transform: 'translateX(-160%) skewX(-14deg)'}], {duration: 600, delay: 40 + i * 55}))
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
      // the clicked photo flies into the 3D viewer
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
function observe(root){ $$('.clip-in:not(.shown),[data-count]', root).forEach(el => io.observe(el)); }

/* ════════════════════ LOADER ════════════════════ */
document.getElementById('yr').textContent = muNow().getFullYear();
syncFavs();
route(true);
(function loader(){
  const L = $('#loader');
  const done = () => { document.body.classList.remove('is-loading'); if(!consent) setTimeout(showCookie, 1400); };
  if(reduced){ done(); return; }
  $('#ldWord').innerHTML = [...'Your Dream Motors'].map((ch, i) => `<span style="animation-delay:${.35 + i * .035}s">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  const hv = $('.view[data-view="home"]'); if(cur.view === 'home') hv.classList.remove('intro');
  let target = .15, shown = 0, fontsOk = false, imgOk = false;
  document.fonts && document.fonts.ready.then(() => fontsOk = true);
  const first = $('.view.on img'); if(!first || first.complete) imgOk = true; else { first.addEventListener('load', () => imgOk = true, {once: true}); first.addEventListener('error', () => imgOk = true, {once: true}); }
  const t0 = performance.now(), num = $('#ldNum'), fill = $('#ldFill');
  (function tick(t){
    const el = t - t0;
    target = Math.min(1, .2 + el / 2200 * .55 + (fontsOk ? .1 : 0) + (imgOk ? .15 : 0));
    if(el < 1900) target = Math.min(target, .92);
    if(el > 4500) target = 1;
    shown += (target - shown) * .08;
    if(target === 1 && shown > .985) shown = 1;
    fill.style.setProperty('--p', shown.toFixed(3)); num.textContent = String(Math.round(shown * 100)).padStart(2, '0');
    if(shown < 1){ requestAnimationFrame(tick); return; }
    exit();
  })(t0);
  async function exit(){
    const car = $('.ld-car'), stage = $('.ld-stage');
    // the car pulls away, then the screen opens like doors
    await Promise.all([
      car.animate([{transform: 'none'}, {transform: 'translateX(-12px)', offset: .25}, {transform: 'translateX(75vw) skewX(-10deg)'}], {duration: 750, easing: 'cubic-bezier(.6,0,.85,.4)', fill: 'forwards'}).finished,
      $('.ld-road').animate([{opacity: 1}, {opacity: 0}], {duration: 500, delay: 250, fill: 'forwards'}).finished,
      $('.ld-brand').animate([{opacity: 1, transform: 'none'}, {opacity: 0, transform: 'translateY(-14px)'}], {duration: 450, delay: 200, fill: 'forwards'}).finished
    ]);
    stage.style.visibility = 'hidden';
    if(cur.view === 'home'){ void hv.offsetWidth; hv.classList.add('intro'); }
    $$('.slide.on img').forEach(i => i.animate([{transform: 'scale(1.3)'}, {transform: 'scale(1.16) translateX(2%)'}], {duration: 1400, easing: 'cubic-bezier(.22,1,.36,1)'}));
    await Promise.all([
      $('.ld-top').animate([{transform: 'none'}, {transform: 'translateY(-101%)'}], {duration: 1000, easing: 'cubic-bezier(.77,0,.18,1)', fill: 'forwards'}).finished,
      $('.ld-bot').animate([{transform: 'none'}, {transform: 'translateY(101%)'}], {duration: 1000, easing: 'cubic-bezier(.77,0,.18,1)', fill: 'forwards'}).finished
    ]);
    done(); L.remove();
  }
})();
})();
