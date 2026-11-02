/* =========================================================
   V8 Motors — homepage
   Loader: the makes in stock swap past on a red panel with a
   counter, then the V8 Motors logo flies into the nav as the
   panels lift to reveal the page.
   ========================================================= */
(function (V8) {
  const { $, $$ } = V8;
  const G = window.gsap;
  const H = document.documentElement;
  const ld = $("#ld");
  const skip = H.classList.contains("seen") || !V8.FX || !ld;

  function done() {
    V8.snapPaused = false;
    sessionStorage.setItem("v8-seen", "1");
    if (V8.lenis) { V8.lenis.scrollTo(0, { immediate: true, force: true }); V8.lenis.start(); }
  }

  if (skip) {
    if (ld) ld.remove();
    done();
    if (!V8.arrivedViaTransition) V8.pageIn();
  } else {
    runLoader();
  }

  function runLoader() {
    V8.snapPaused = true;
    if (V8.lenis) V8.lenis.stop();
    const NS = "http://www.w3.org/2000/svg";
    const brand = $("#brand"), lgf = $("#lgf"), cnt = $("#cnt"), lw = $("#lw");
    const flash = $(".flash", ld), glow = $(".ld-glow", ld);
    lgf.innerHTML = V8.logo;
    G.set(lgf, { xPercent: -50, yPercent: -50 });
    G.set(brand, { opacity: 0 });

    /* ---- build the tachometer (270° sweep, 135° → 405°) ---- */
    const C = 200, R = 168, A0 = 135, SWEEP = 270;
    const pt = (deg, r) => { const a = (deg * Math.PI) / 180; return [C + Math.cos(a) * r, C + Math.sin(a) * r]; };
    const arc = (d0, d1, r) => { const [x0, y0] = pt(d0, r), [x1, y1] = pt(d1, r); return `M${x0} ${y0} A${r} ${r} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1} ${y1}`; };
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 400 400");
    const mk = (tag, attrs, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
    const track = mk("path", { d: arc(A0, A0 + SWEEP, R), class: "track", pathLength: 1 });
    mk("path", { d: arc(A0 + SWEEP * 0.8, A0 + SWEEP, R - 14), class: "red-zone" });
    const fill = mk("path", { d: arc(A0, A0 + SWEEP, R), class: "fill", pathLength: 1 });
    const ticks = [];
    const NT = 36;
    for (let i = 0; i <= NT; i++) {
      const deg = A0 + (SWEEP * i) / NT, major = i % 4 === 0;
      const [x0, y0] = pt(deg, R - 22), [x1, y1] = pt(deg, R - (major ? 40 : 32));
      ticks.push(mk("line", { x1: x0, y1: y0, x2: x1, y2: y1, class: "tick" + (major ? " major" : "") }));
    }
    const needle = mk("line", { x1: C, y1: C, x2: C + R - 46, y2: C, class: "needle" });
    mk("circle", { cx: C, cy: C, r: 16, class: "hub-ring" });
    mk("circle", { cx: C, cy: C, r: 7, class: "hub" });
    $("#rev").appendChild(svg);
    const rev = $("#rev");

    /* ---- words, split into letters ---- */
    const words = ["Toyota", "BMW", "Range Rover", "Nissan", "Honda", "Hyundai", "Suzuki"];
    const wEls = words.map((w) => {
      const el = document.createElement("div");
      el.className = "w";
      el.innerHTML = [...w].map((ch) => `<span class="ch">${ch === " " ? "&nbsp;" : ch}</span>`).join("");
      lw.appendChild(el);
      return el;
    });
    G.set($$(".ch", lw), { yPercent: 110, rotationX: -85, opacity: 0 });

    /* ---- one value drives needle, arc, counter and ticks ---- */
    const s = { p: 0 };
    const render = () => {
      const p = s.p;
      G.set(needle, { rotation: A0 + SWEEP * p, svgOrigin: `${C} ${C}` });
      fill.style.strokeDasharray = `${p} 1`;
      cnt.textContent = Math.round(p * 100);
      const lit = Math.round(p * NT);
      ticks.forEach((t, i) => { t.classList.toggle("lit", i <= lit && i < NT * 0.8); t.classList.toggle("hot", i <= lit && i >= NT * 0.8); });
    };
    render();

    const tl = G.timeline({
      delay: 0.1,
      onComplete: () => {
        ld.remove();
        const fly = $("body > .lgf");
        if (fly) fly.remove();
        G.set(brand, { opacity: 1 });
      },
    });

    // act 1 — the dial draws itself on
    tl.fromTo(rev, { scale: 0.86, opacity: 0, rotation: -12 }, { scale: 1, opacity: 1, rotation: 0, duration: 1.1, ease: "expo.out" }, 0)
      .fromTo(track, { strokeDasharray: "0 1" }, { strokeDasharray: "1 0", duration: 1.1, ease: "power2.inOut" }, 0.05)
      .from(ticks, { opacity: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.5, stagger: 0.012, ease: "back.out(2)" }, 0.15)
      .fromTo([".rev-num", ".lbr"], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "expo.out" }, 0.35)
      .to(glow, { opacity: 1, duration: 2.6, ease: "power1.in" }, 0.4);

    // act 2 — rev up: needle accelerates while the makes flick past faster and faster
    const REV = 3.0;
    tl.to(s, { p: 0.9, duration: REV, ease: "power2.in", onUpdate: render }, 0.45);
    let t = 0.55;
    wEls.forEach((w, i) => {
      const ch = $$(".ch", w);
      const hold = Math.max(0.1, 0.32 * Math.pow(0.84, i));
      tl.to(ch, { yPercent: 0, rotationX: 0, opacity: 1, duration: 0.5, stagger: 0.018, ease: "expo.out" }, t);
      tl.to(ch, { yPercent: -110, rotationX: 85, opacity: 0, duration: 0.24, stagger: 0.01, ease: "power3.in", overwrite: "auto" }, t + hold);
      t += hold + 0.24;
    });

    // wait (briefly) for the hero image + fonts
    const heroImg = $(".hv img");
    const ready = Promise.race([
      Promise.all([document.fonts ? document.fonts.ready : 0, heroImg.decode ? heroImg.decode().catch(() => 0) : 0]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
    tl.addPause(Math.max(0.45 + REV, t) + 0.05, () => ready.then(() => tl.play()));

    // act 3 — redline kick, flash, logo resolves
    tl.addLabel("red")
      .to(s, { p: 1, duration: 0.35, ease: "power2.out", onUpdate: render }, "red")
      .to(rev, { scale: 1.05, duration: 0.18, ease: "power2.out", yoyo: true, repeat: 1 }, "red+=0.25")
      .to(needle, { rotation: A0 + SWEEP + 6, svgOrigin: `${C} ${C}`, duration: 0.6, ease: "elastic.out(1.4, 0.3)" }, "red+=0.3")
      .fromTo(flash, { opacity: 0 }, { opacity: 0.85, duration: 0.12, ease: "power2.out" }, "red+=0.42")
      .to(flash, { opacity: 0, duration: 0.7, ease: "power2.out" }, "red+=0.54")
      .to([".rev-num", ".ld-word", ".lbr"], { opacity: 0, y: -10, duration: 0.4, ease: "power2.in" }, "red+=0.4")
      .to(rev, { scale: 0.62, opacity: 0, rotation: 30, filter: "blur(6px)", duration: 0.75, ease: "expo.in" }, "red+=0.5")
      .fromTo(lgf, { opacity: 0, scale: 0.8, filter: "blur(14px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.9, ease: "expo.out" }, "red+=0.95")
      .to(glow, { scale: 1.3, opacity: 0.6, duration: 1, ease: "expo.out" }, "red+=0.95");

    // release — the iris opens from the dial centre, the logo flies into the nav
    tl.addLabel("open", "red+=1.75")
      .add(() => {
        const r = lgf.getBoundingClientRect();
        document.body.appendChild(lgf);
        G.set(lgf, { position: "fixed", zIndex: 320, left: r.left + r.width / 2, top: r.top + r.height / 2, width: r.width, xPercent: -50, yPercent: -50, scale: 1 });
      }, "open")
      .fromTo(ld, { "--r": "0px" }, { "--r": () => Math.hypot(innerWidth, innerHeight) + "px", duration: 1.35, ease: "expo.inOut" }, "open")
      .to(lgf, {
        left: () => { const b = brand.getBoundingClientRect(); return b.left + b.width / 2; },
        top: () => { const b = brand.getBoundingClientRect(); return b.top + b.height / 2; },
        width: () => brand.getBoundingClientRect().width,
        color: "#15181c",
        duration: 1.3,
        ease: "expo.inOut",
      }, "open+=0.05")
      .fromTo(".hv .ph-wrap img", { scale: 1.25 }, { scale: 1, duration: 1.8, ease: "expo.out", clearProps: "scale" }, "open+=0.2")
      .add(() => { done(); V8.pageIn({ nav: false }); }, "open+=0.35");

    // impatient? tap to fast-forward
    ld.addEventListener("pointerdown", () => tl.timeScale(3));
  }

  /* ---------- live data ---------- */
  V8.loadCars().then((cars) => {
    const makes = new Set(cars.map((c) => c.make));
    const min = Math.min(...cars.map((c) => c.price));
    const stats = () => {
      V8.countUp($("#mCars"), cars.length);
      V8.countUp($("#mMakes"), makes.size);
      V8.countUp($("#mFrom"), min, V8.rs);
    };
    if (V8.heroIn) setTimeout(stats, 400);
    else document.addEventListener("v8:in", () => setTimeout(stats, 500), { once: true });
    $("#allBtn").textContent = `All ${cars.length} cars`;

    $("#latest").innerHTML = cars.slice(0, 5).map((c) => V8.card(c, { eager: true })).join("");
    $$("#latest .card").forEach((el, i) => { el.setAttribute("data-wipe", ""); el.style.setProperty("--dl", i * 0.07); });
    V8.wipe($("#latest"));

    const order = ["suv", "hatch", "sedan", "work"];
    $("#types").innerHTML = order.map((t, i) => {
      const list = cars.filter((c) => c.type === t);
      const pic = (list.find((c) => c.photos.length) || {}).photos?.[0] || "";
      return `<a class="type" href="cars.html?type=${t}" data-wipe data-cursor="View" style="--dl:${i * 0.08}">
        ${pic ? `<img src="${V8.esc(pic)}" alt="" loading="lazy" />` : ""}
        <h3>${V8.TYPES[t]}</h3><span>${list.length} in stock</span>
      </a>`;
    }).join("");
    V8.wipe($("#types"));
    V8.observe($("#types"));

    // photos for the hover preview on the service rows
    const picks = [cars[0], cars.find((c) => c.type === "suv"), cars.find((c) => c.type === "sedan"), cars.find((c) => c.type === "hatch")]
      .filter(Boolean).map((c) => c.photos[0]);
    picks.unshift("images/home.jpeg");
    $("#peek").innerHTML = picks.slice(0, 4).map((p) => `<img src="${V8.esc(p)}" alt="" loading="lazy" />`).join("");
  });

  /* ---------- hover preview that follows the cursor (service rows) ---------- */
  const peek = $("#peek");
  if (V8.FX && matchMedia("(pointer: fine)").matches) {
    const px = G.quickTo(peek, "x", { duration: 0.6, ease: "power3" });
    const py = G.quickTo(peek, "y", { duration: 0.6, ease: "power3" });
    const rot = G.quickTo(peek, "rotation", { duration: 0.8, ease: "power3" });
    let lastX = 0;
    $("#rows").addEventListener("pointermove", (e) => {
      px(e.clientX + 30); py(e.clientY - 110);
      rot(Math.max(-8, Math.min(8, (e.clientX - lastX) * 0.4)));
      lastX = e.clientX;
    });
    $$(".row-l").forEach((row) => {
      row.addEventListener("pointerenter", () => {
        const imgs = $$("img", peek);
        imgs.forEach((im, k) => im.classList.toggle("on", k === +row.dataset.peek));
        G.to(peek, { opacity: 1, scale: 1, duration: 0.5, ease: "expo.out", overwrite: true });
      });
    });
    const hidePeek = () => G.to(peek, { opacity: 0, scale: 0.6, duration: 0.35, ease: "power3.in", overwrite: true });
    $("#rows").addEventListener("pointerleave", hidePeek);
    addEventListener("scroll", hidePeek, { passive: true });

    /* hero photo follows the mouse a little */
    const hv = $("#hv");
    const hx = G.quickTo(hv, "x", { duration: 1, ease: "power3" }), hy = G.quickTo(hv, "y", { duration: 1, ease: "power3" });
    $(".hero").addEventListener("pointermove", (e) => {
      hx((e.clientX / innerWidth - 0.5) * -24);
      hy((e.clientY / innerHeight - 0.5) * -18);
    });
  }

  /* ---------- scroll-linked depth ---------- */
  if (V8.FX) {
    // explicit start values + immediateRender:false so scrolling back always restores
    // the real state (the old version captured the headline while it was still hidden)
    const st = (trigger, start, end) => ({ trigger, start, end, scrub: true });
    G.fromTo(".hv .ph-wrap img", { yPercent: 0, scale: 1 }, { yPercent: 12, scale: 1.08, ease: "none", immediateRender: false, scrollTrigger: st(".hero", "top top", "bottom top") });
    G.fromTo(".hero h1", { yPercent: 0, opacity: 1 }, { yPercent: -30, opacity: 0.2, ease: "none", immediateRender: false, scrollTrigger: st(".hero", "top top", "bottom top") });
    G.fromTo(".band", { scale: 0.94, borderRadius: "48px" }, { scale: 1, borderRadius: "28px", ease: "none", scrollTrigger: st(".band", "top bottom", "top 20%") });
    $$(".row-l").forEach((r) => G.fromTo(r, { xPercent: 6 }, { xPercent: 0, ease: "none", scrollTrigger: st(r, "top bottom", "top 55%") }));
  }

  V8.countdown($("#cdRoot"));
})(window.V8);
