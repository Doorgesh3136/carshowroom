/* =========================================================
   V8 Motors — shared chrome, page transitions, smooth scroll, reveals
   Uses GSAP + ScrollTrigger + Lenis. If they fail to load,
   everything is simply shown without animation.
   ========================================================= */
window.V8 = window.V8 || {};
(function (V8) {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  V8.$ = $;
  V8.$$ = $$;
  const H = document.documentElement;
  const G = window.gsap, ST = window.ScrollTrigger;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FX = !!(G && ST) && !reduce;
  const page = document.body.dataset.page || "home";
  const A = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  V8.FX = FX;
  if (!FX) H.classList.remove("js");
  if (G && ST) G.registerPlugin(ST);

  V8.logo = '<svg class="logo" viewBox="0 0 164 46" role="img" aria-label="V8 Motors"><text class="lv" x="0" y="38">V<tspan class="l8">8</tspan></text><text class="lm" x="61" y="38">Motors</text></svg>';

  const PAGES = [
    ["home", "index.html", "Home", "V8 Motors"],
    ["cars", "cars.html", "Cars", "Cars in stock"],
    ["sell", "sell.html", "Sell & Exchange", "Sell &amp; exchange"],
    ["about", "about.html", "About", "About us"],
    ["contact", "contact.html", "Contact", "Contact"],
  ];

  /* ---------- shared chrome ---------- */
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div class="bgfx" aria-hidden="true"><div class="layer"><i></i><i></i><i></i><i></i></div><div class="brush"></div><div class="spot"></div><div class="vig"></div></div>
     <header class="nav" id="nav">
       <a class="brand" href="index.html" id="brand">${V8.logo}</a>
       <nav class="nav-links" aria-label="Main">${PAGES.map(([k, h, t]) => `<a href="${h}" class="${k === page || (page === "car" && k === "cars") ? "on" : ""}">${t}</a>`).join("")}</nav>
       <div class="nav-r">
         <a class="btn sm" href="tel:+23052590327">Call 5259 0327<span class="ar">${A}</span></a>
         <button class="menu-btn" aria-label="Menu" aria-expanded="false"><i></i><i></i></button>
       </div>
     </header>
     <div class="sheet" id="sheet" aria-hidden="true">
       <nav>${PAGES.map(([, h, t]) => `<a href="${h}">${t}</a>`).join("")}</nav>
       <div><p class="lb">59B Royal Road, Coromandel · Mauritius</p><p class="lb" style="margin-top:8px">5259 0327 · 5750 7912</p></div>
     </div>
     <div id="pt" aria-hidden="true"><div class="pb"></div><div class="pb"><div id="ptt"><span>V8 Motors</span></div></div></div>`
  );
  document.body.insertAdjacentHTML(
    "beforeend",
    `<footer class="foot">
       <div class="wrap">
         <div class="foot-g">
           <div><span class="brand">${V8.logo}</span><p>Buying, selling, exchanges and leasing through Rogers Capital. New stock every week.</p></div>
           <div><span class="lb">Visit</span><p>59B, Royal Road<br />Coromandel, Mauritius</p><p style="margin-top:10px">Mon–Fri · 9:00–17:00<br />Sat · 9:00–16:00</p></div>
           <div><span class="lb">Talk to us</span>
             <a href="tel:+23052590327">5259 0327</a> · <a href="tel:+23057507912">5750 7912</a><br />
             <a href="tel:+23055009527">5500 9527</a> · <a href="tel:+23055329727">5532 9727</a><br />
             <a href="mailto:veightmotorsv8@gmail.com">veightmotorsv8@gmail.com</a></div>
           <div><span class="lb">Pages</span>${PAGES.map(([, h, t]) => `<a href="${h}">${t}</a>`).join("<br />")}</div>
         </div>
         <div class="foot-b"><span class="lb">© ${new Date().getFullYear()} V8 Motors Ltd</span><span class="lb">Leasing subject to approval by Rogers Capital</span><a class="lb" href="#top" data-top>Back to top ↑</a></div>
       </div>
     </footer>`
  );

  /* ---------- smooth scroll (Lenis driven by GSAP's ticker) ---------- */
  let lenis = null;
  const desktop = matchMedia("(pointer: fine) and (min-width: 901px)").matches;
  const SNAP = FX && desktop && document.body.hasAttribute("data-snap");
  if (window.Lenis && FX && !SNAP) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ST.update);
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }
  V8.lenis = lenis;
  V8.scrollTo = (target, opts = {}) => {
    if (lenis) return lenis.scrollTo(target, { offset: -90, ...opts });
    if (typeof target === "number") return scrollTo({ top: target, behavior: "smooth" });
    target.scrollIntoView({ behavior: "smooth" });
  };
  V8.lock = (on) => { V8.snapPaused = on; if (lenis) on ? lenis.stop() : lenis.start(); };
  $$("[data-top]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); V8.scrollTo(0); }));

  /* ---------- nav ---------- */
  const nav = $("#nav"), sheet = $("#sheet"), menuBtn = $(".menu-btn");
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle("scrolled", y > 30);
    if (!sheet.classList.contains("open")) {
      if (y > 220 && y > lastY + 4) nav.classList.add("hide");
      else if (y < lastY - 4 || y < 220) nav.classList.remove("hide");
    }
    lastY = y;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  menuBtn.addEventListener("click", () => {
    const open = !sheet.classList.contains("open");
    sheet.classList.toggle("open", open);
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open);
    V8.lock(open);
  });

  /* ---------- split words ---------- */
  function split(el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = "1";
    const walk = (node, wrap) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(" ");
            const w = document.createElement("span");
            w.className = "sw";
            const inner = document.createElement("span");
            if (wrap) { const x = wrap.cloneNode(false); x.textContent = part; inner.append(x); }
            else inner.textContent = part;
            w.append(inner);
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          const holder = document.createElement("span");
          holder.innerHTML = n.innerHTML;
          walk(holder, n);
          n.replaceWith(...holder.childNodes);
        }
      });
    };
    walk(el, null);
    el.style.opacity = 1;
  }
  V8.split = split;

  /* ---------- scroll reveals ---------- */
  V8.observe = (root = document) => {
    if (!FX) { $$("[data-split]", root).forEach(split); return; }
    $$("[data-split]:not([data-hero])", root).forEach((h) => {
      if (h.dataset.rv) return;
      h.dataset.rv = 1;
      split(h);
      const w = $$(".sw > span", h);
      G.set(w, { yPercent: 118 });
      ST.create({ trigger: h, start: "top 90%", once: true, onEnter: () => G.to(w, { yPercent: 0, duration: 1.3, stagger: 0.06, ease: "expo.out" }) });
    });
    $$("[data-reveal]", root).forEach((el) => {
      if (el.dataset.rv) return;
      el.dataset.rv = 1;
      const d = parseFloat(getComputedStyle(el).getPropertyValue("--dl")) || 0;
      G.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, delay: d, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 94%", once: true } });
    });
    ST.refresh();
  };

  /* hero entrance: headline words rise, then the rest */
  let heroDone = false;
  V8.pageIn = (o = {}) => {
    if (heroDone) return;
    heroDone = true;
    V8.heroIn = true;
    setTimeout(() => document.dispatchEvent(new Event("v8:in")), 0);
    const hero = $("[data-hero]");
    if (hero) split(hero);
    if (!FX) { H.classList.remove("js"); return; }
    const tl = G.timeline();
    if (o.nav !== false) tl.fromTo(nav, { yPercent: -110 }, { yPercent: 0, duration: 1.1, ease: "expo.out", clearProps: "transform" }, 0);
    if (hero) tl.fromTo($$(".sw > span", hero), { yPercent: 118 }, { yPercent: 0, duration: 1.4, stagger: 0.07, ease: "expo.out" }, 0.05);
    tl.fromTo($$("[data-hi]"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09, ease: "expo.out", clearProps: "transform" }, 0.35);
    tl.fromTo($$("[data-hi-img]"), { clipPath: "inset(18% 12% 18% 12% round 30px)", scale: 1.15 }, { clipPath: "inset(0% 0% 0% 0% round 30px)", scale: 1, duration: 1.6, ease: "expo.out" }, 0.1);
    V8.observe();
  };

  /* ---------- page transitions ---------- */
  const pt = $("#pt"), pbs = $$("#pt .pb"), ptt = $("#ptt");
  if (G) G.set(pbs, { yPercent: 100 });
  const labelFor = (href) => {
    const p = PAGES.find(([, h]) => href.split("?")[0].split("#")[0].endsWith(h));
    if (p) return p[3];
    if (href.includes("car.html")) return "Car details";
    return "V8 Motors";
  };

  function leaveTo(href) {
    sessionStorage.setItem("v8-pt", labelFor(href));
    if (!FX) return (location.href = href);
    if (sheet.classList.contains("open")) menuBtn.click();
    const chs = setTitle(labelFor(href));
    pt.classList.add("on");
    G.timeline({ onComplete: () => (location.href = href) })
      .to("main", { scale: 0.96, yPercent: -2, opacity: 0.5, duration: 0.8, ease: "expo.inOut", transformOrigin: "50% 30%" }, 0)
      .fromTo(pbs, { yPercent: 100 }, { yPercent: 0, duration: 0.72, stagger: 0.08, ease: "expo.inOut" }, 0)
      .fromTo(chs, { yPercent: 110, rotationX: -70, opacity: 0 }, { yPercent: 0, rotationX: 0, opacity: 1, duration: 0.6, stagger: 0.02, ease: "expo.out" }, "-=0.35");
  }

  // page title split into letters for the transition
  function setTitle(text) {
    const box = ptt.firstElementChild;
    box.innerHTML = [...text.replace(/&amp;/g, "&")].map((c) => `<span class="ch">${c === " " ? "&nbsp;" : c === "&" ? "&amp;" : c}</span>`).join("");
    box.style.perspective = "600px";
    return $$(".ch", box);
  }

  function arrive() {
    const label = sessionStorage.getItem("v8-pt");
    sessionStorage.removeItem("v8-pt");
    if (!label || !FX) { H.classList.remove("pt-in"); return false; }
    const chs = setTitle(label);
    pt.classList.add("on");
    G.set(pbs, { yPercent: 0 });
    H.classList.remove("pt-in"); // panels now cover the page — drop the pre-paint cover
    G.timeline({ delay: 0.05, onComplete: () => { pt.classList.remove("on"); G.set(pbs, { yPercent: 100 }); } })
      .to(chs, { yPercent: -110, rotationX: 70, opacity: 0, duration: 0.4, stagger: 0.015, ease: "power3.in" })
      .to(pbs.slice().reverse(), { yPercent: -100, duration: 1, stagger: 0.1, ease: "expo.inOut" }, "-=0.1")
      .fromTo("main", { scale: 1.03, yPercent: 2 }, { scale: 1, yPercent: 0, duration: 1.3, ease: "expo.out", clearProps: "transform" }, "<")
      .add(() => V8.pageIn(), "-=0.75");
    return true;
  }
  V8.arrivedViaTransition = arrive();

  addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    H.classList.remove("pt-in");
    pt.classList.remove("on");
    if (G) G.set(pbs, { yPercent: 100 });
  });

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || /^(tel|mailto|https?):/i.test(href) || !/\.html/.test(href)) return;
    const here = location.pathname.split("/").pop() || "index.html";
    if (href === here) { e.preventDefault(); V8.scrollTo(0); return; }
    e.preventDefault();
    leaveTo(href);
  });

  if (page !== "home" && !V8.arrivedViaTransition) requestAnimationFrame(() => V8.pageIn());

  /* ---------- forms → pre-filled email ---------- */
  $$("form[data-mailto]").forEach((f) => {
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const lines = $$("[name]", f).filter((x) => x.value.trim()).map((x) => `${x.name}: ${x.value.trim()}`);
      const car = f.elements["Car"] && f.elements["Car"].value;
      const subj = f.dataset.subject + (car ? ` — ${car}` : "");
      location.href = `mailto:veightmotorsv8@gmail.com?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(lines.join("\n") + "\n\nSent from the V8 Motors website")}`;
      f.classList.add("sent");
    });
  });
  $$("input[type=date]").forEach((d) => (d.min = new Date().toISOString().split("T")[0]));

  /* ---------- Saturday countdown (Sat 9:00–16:00) ---------- */
  V8.countdown = (root) => {
    const pad = (n) => String(n).padStart(2, "0");
    const set = (k, v) => {
      const el = $(`[data-cd=${k}]`, root);
      if (!el || el.textContent === pad(v)) return;
      el.textContent = pad(v);
      if (FX) G.fromTo(el, { yPercent: -60, opacity: 0, filter: "blur(4px)" }, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "expo.out" });
    };
    const tick = () => {
      const now = new Date(), sat = now.getDay() === 6, h = now.getHours(), t = new Date(now);
      let label = "Doors open in";
      if (sat && h >= 9 && h < 16) { label = "Live now — ends in"; t.setHours(16, 0, 0, 0); }
      else { let add = (6 - now.getDay() + 7) % 7; if (sat && h >= 16) add = 7; t.setDate(now.getDate() + add); t.setHours(9, 0, 0, 0); }
      const l = $("[data-cd=label]", root); if (l) l.textContent = label;
      let s = Math.max(0, Math.floor((t - now) / 1000));
      set("d", Math.floor(s / 86400)); s %= 86400;
      set("h", Math.floor(s / 3600)); s %= 3600;
      set("m", Math.floor(s / 60)); set("s", s % 60);
    };
    tick();
    setInterval(tick, 1000);
  };

  /* ---------- video (click to load) ---------- */
  $$(".video[data-yt]").forEach((v) => v.addEventListener("click", () => {
    v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1" title="About V8 Motors" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }, { once: true }));

  /* =========================================================
     SECTION SNAP — one scroll = one full section (homepage, desktop)
     Tall sections are stepped through before moving on.
     ========================================================= */
  V8.snapPaused = false;
  if (SNAP) {
    const panels = () => [...$$("[data-snap-panel]"), $(".foot")].filter(Boolean);
    const maxY = () => document.documentElement.scrollHeight - innerHeight;
    const top = (el) => el.getBoundingClientRect().top + scrollY;
    const proxy = { y: scrollY };
    let busy = false, cool = 0;

    const goTo = (y, dur = 1.05) => {
      y = Math.max(0, Math.min(maxY(), Math.round(y)));
      if (Math.abs(y - scrollY) < 2) return;
      busy = true;
      proxy.y = scrollY;
      G.to(proxy, {
        y, duration: dur, ease: "power3.inOut", overwrite: true,
        onUpdate: () => scrollTo(0, proxy.y),
        onComplete: () => { busy = false; cool = performance.now() + 420; },
      });
    };
    V8.scrollTo = (target) => goTo(typeof target === "number" ? target : top(target) - (target.closest("[data-snap-panel]") === target ? 0 : 90));

    const step = (dir) => {
      const y = scrollY, vh = innerHeight, ps = panels();
      const idx = ps.findIndex((p) => top(p) <= y + 4 && top(p) + p.offsetHeight > y + 4);
      const cur = ps[idx];
      if (dir > 0) {
        if (cur && top(cur) + cur.offsetHeight - (y + vh) > 8) return goTo(Math.min(y + vh * 0.85, top(cur) + cur.offsetHeight - vh), 0.8);
        const next = ps[idx + 1];
        return goTo(next ? top(next) : maxY());
      }
      if (cur && y - top(cur) > 8) return goTo(Math.max(y - vh * 0.85, top(cur)), 0.8);
      const prev = ps[idx - 1];
      if (!prev) return goTo(0);
      return goTo(prev.offsetHeight > vh ? top(prev) + prev.offsetHeight - vh : top(prev));
    };

    addEventListener("wheel", (e) => {
      if (e.ctrlKey) return; // pinch-zoom
      const t = e.target.closest(".rail");
      if (t && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // sideways on the car rail
      e.preventDefault();
      if (busy || V8.snapPaused || performance.now() < cool || Math.abs(e.deltaY) < 6) return;
      step(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    addEventListener("keydown", (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || V8.snapPaused) return;
      const down = ["ArrowDown", "PageDown", " "].includes(e.key) && !e.shiftKey;
      const up = ["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey);
      if (e.key === "Home") { e.preventDefault(); goTo(0); }
      else if (e.key === "End") { e.preventDefault(); goTo(maxY()); }
      else if (down || up) { e.preventDefault(); if (!busy) step(down ? 1 : -1); }
    });

    // right-hand section indicator
    const ps = $$("[data-snap-panel]");
    const dots = document.createElement("nav");
    dots.className = "dots";
    dots.setAttribute("aria-label", "Sections");
    dots.innerHTML = ps.map((p, i) => `<button aria-label="${p.dataset.snapPanel}"><i></i><span>${p.dataset.snapPanel}</span></button>`).join("");
    document.body.appendChild(dots);
    const btns = $$("button", dots);
    btns.forEach((b, i) => b.addEventListener("click", () => goTo(top(ps[i]))));
    const mark = () => {
      const mid = scrollY + innerHeight * 0.5;
      let on = 0;
      ps.forEach((p, i) => { if (top(p) <= mid) on = i; });
      btns.forEach((b, i) => b.classList.toggle("on", i === on));
      dots.classList.toggle("dark", ps[on] && ps[on].classList.contains("band"));
    };
    addEventListener("scroll", mark, { passive: true });
    mark();
  }

  /* =========================================================
     CURSOR + MAGNETIC BUTTONS (desktop)
     ========================================================= */
  if (FX && desktop) {
    H.classList.add("has-cursor");
    const dot = document.createElement("div"), ring = document.createElement("div");
    dot.className = "cur";
    ring.className = "cur-ring";
    ring.innerHTML = "<b></b>";
    document.body.append(dot, ring);
    const dx = G.quickTo(dot, "x", { duration: 0.12, ease: "power3" }), dy = G.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    const rx = G.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), ry = G.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    addEventListener("pointermove", (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener("pointerleave", () => G.to([dot, ring], { opacity: 0, duration: 0.3 }));
    document.addEventListener("pointerenter", () => G.to([dot, ring], { opacity: 1, duration: 0.3 }));
    document.addEventListener("pointerover", (e) => {
      const lab = e.target.closest("[data-cursor]");
      const lnk = e.target.closest("a, button, .chip, label.search, select");
      ring.classList.toggle("label", !!lab);
      ring.classList.toggle("link", !lab && !!lnk);
      dot.classList.toggle("hide", !!lab);
      ring.firstChild.textContent = lab ? lab.dataset.cursor : "";
    });

    const magnet = (el, k = 0.3) => {
      const xTo = G.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = G.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * k);
        yTo((e.clientY - r.top - r.height / 2) * k);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    };
    V8.magnet = magnet;
    $$(".btn, .rc, .menu-btn").forEach((b) => magnet(b));
  }

  /* image wipe reveals */
  if (FX) {
    V8.wipe = (root = document) => $$("[data-wipe]", root).forEach((el) => {
      if (el.dataset.wiped) return;
      el.dataset.wiped = 1;
      G.fromTo(el, { clipPath: "inset(100% 0% 0% 0% round 20px)" }, { clipPath: "inset(0% 0% 0% 0% round 20px)", duration: 1.3, ease: "expo.out", delay: parseFloat(el.style.getPropertyValue("--dl")) || 0, scrollTrigger: { trigger: el, start: "top 92%", once: true } });
      const img = $("img", el);
      if (img) G.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%", once: true } });
    });
    V8.wipe();
  } else V8.wipe = () => {};

  // maps: let the page scroll over them; click to interact
  $$(".map").forEach((m) => {
    m.addEventListener("click", () => m.classList.add("live"));
    m.addEventListener("pointerleave", () => m.classList.remove("live"));
  });

  /* =========================================================
     MORE MOTION
     ========================================================= */
  // count a number up when it's set (used for live stats)
  V8.countUp = (el, value, fmt = (n) => String(n)) => {
    if (!el) return;
    if (!FX) { el.textContent = fmt(value); return; }
    const o = { v: 0 };
    G.to(o, { v: value, duration: 1.6, ease: "expo.out", onUpdate: () => (el.textContent = fmt(Math.round(o.v))) });
  };

  if (FX) {
    // thin red scroll-progress line
    const bar = document.createElement("div");
    bar.className = "progress";
    document.body.appendChild(bar);
    G.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

    // 3D tilt + light glare on cars and photo tiles (desktop)
    if (desktop) {
      const tilt = new WeakMap();
      const setup = (el) => {
        const o = {
          rx: G.quickTo(el, "rotationX", { duration: 0.6, ease: "power3" }),
          ry: G.quickTo(el, "rotationY", { duration: 0.6, ease: "power3" }),
          y: G.quickTo(el, "y", { duration: 0.6, ease: "power3" }),
        };
        G.set(el, { transformPerspective: 900 });
        tilt.set(el, o);
        return o;
      };
      document.addEventListener("pointermove", (e) => {
        const el = e.target.closest(".card, .type");
        if (!el) return;
        const o = tilt.get(el) || setup(el);
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        o.ry((px - 0.5) * 10);
        o.rx((0.5 - py) * 8);
        o.y(-6);
        el.style.setProperty("--gx", `${px * 100}%`);
        el.style.setProperty("--gy", `${py * 100}%`);
      }, { passive: true });
      document.addEventListener("pointerout", (e) => {
        const el = e.target.closest(".card, .type");
        if (!el || el.contains(e.relatedTarget)) return;
        const o = tilt.get(el);
        if (o) { o.rx(0); o.ry(0); o.y(0); }
      });
    }

    // sections gently recede as you scroll past them (explicit both ends, so
    // scrolling back always restores them fully)
    $$("[data-snap-panel]:not(.hero) > .wrap, [data-snap-panel].band > .wrap").forEach((w) => {
      G.fromTo(w, { opacity: 1, scale: 1, yPercent: 0 }, {
        opacity: 0.35, scale: 0.97, yPercent: -4, ease: "none", immediateRender: false,
        scrollTrigger: { trigger: w.parentElement, start: "bottom 85%", end: "bottom top", scrub: true },
      });
    });
  }

  /* =========================================================
     BACKGROUND INTERACTION + PHOTO FADE-INS
     ========================================================= */
  const bg = $(".bgfx");
  if (FX) {
    // light follows the cursor (eased)
    const spot = { x: innerWidth * 0.7, y: innerHeight * 0.3 };
    const tgt = { ...spot };
    addEventListener("pointermove", (e) => { tgt.x = e.clientX; tgt.y = e.clientY; }, { passive: true });
    G.ticker.add(() => {
      spot.x += (tgt.x - spot.x) * 0.08;
      spot.y += (tgt.y - spot.y) * 0.08;
      bg.style.setProperty("--mx", spot.x + "px");
      bg.style.setProperty("--my", spot.y + "px");
    });
    // the light layers drift and turn as you scroll down the page
    G.to(".bgfx .layer", { yPercent: -12, rotation: 14, scale: 1.08, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 1.2 } });
  }

  // photos fade in once loaded instead of popping in
  const markIn = (img) => img.classList.add("is-in");
  document.addEventListener("load", (e) => { if (e.target.tagName === "IMG") markIn(e.target); }, true);
  document.addEventListener("error", (e) => { if (e.target.tagName === "IMG") markIn(e.target); }, true);
  const sweepImgs = () => $$("img:not(.is-in)").forEach((i) => { if (i.complete) markIn(i); });
  sweepImgs();
  new MutationObserver(() => requestAnimationFrame(sweepImgs)).observe(document.body, { childList: true, subtree: true });
  setTimeout(() => $$("img").forEach(markIn), 5000); // never leave a photo hidden

  // safety net: never leave content hidden if something above throws later
  addEventListener("error", () => H.classList.remove("js"));
})(window.V8);
