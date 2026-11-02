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
    const words = ["Toyota", "BMW", "Range Rover", "Nissan", "Honda", "Hyundai", "Suzuki", "Kia"];
    const N = words.length, T = 0.34;
    const lw = $("#lw"), cnt = $("#cnt"), lgf = $("#lgf");
    const lpA = $(".lp-a", ld), lpB = $(".lp-b", ld);
    const brand = $("#brand");
    lgf.innerHTML = V8.logo;
    words.forEach((w) => { const s = document.createElement("span"); s.textContent = w; lw.appendChild(s); });
    const ws = $$("span", lw);

    const c = { v: 0 };
    const setc = () => (cnt.textContent = Math.round(c.v));
    G.set(ws, { yPercent: 130 });
    G.set(lgf, { xPercent: -50, yPercent: -50 });
    G.set(brand, { opacity: 0 });

    const tl = G.timeline({
      delay: 0.15,
      onComplete: () => {
        ld.remove();
        const fly = $("body > .lgf");
        if (fly) fly.remove();
        G.set(brand, { opacity: 1 });
      },
    });

    tl.to(c, { v: 92, duration: N * T + 0.8, ease: "none", onUpdate: setc }, 0);
    ws.forEach((w, i) => {
      tl.to(w, { yPercent: 0, duration: 0.42, ease: "expo.out" }, i * T);
      tl.to(w, { yPercent: -130, duration: 0.16, ease: "power3.in", overwrite: "auto" }, i * T + 0.18);
    });
    tl.fromTo(lgf, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out" }, N * T + 0.1);

    // hold only for what the hero needs: fonts + the hero photo (max 2.5s)
    const heroImg = $(".hv img");
    const ready = Promise.race([
      Promise.all([document.fonts ? document.fonts.ready : 0, heroImg.decode ? heroImg.decode().catch(() => 0) : 0]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
    tl.addPause(N * T + 0.95, () => ready.then(() => tl.play()));

    tl.to(c, { v: 100, duration: 0.4, ease: "power2.out", onUpdate: setc })
      .to(lgf, { width: () => Math.min(innerWidth * 0.5, 640), duration: 0.9, ease: "expo.inOut" }, "<")
      .to(".lbr", { opacity: 0, y: 20, duration: 0.45, ease: "power2.in" }, "<")
      .add(() => {
        // detach the logo so it can fly into the nav as the panels lift
        const r = lgf.getBoundingClientRect();
        document.body.appendChild(lgf);
        G.set(lgf, { position: "fixed", zIndex: 320, left: r.left + r.width / 2, top: r.top + r.height / 2, width: r.width, xPercent: -50, yPercent: -50, y: 0 });
      }, "+=0.1")
      .addLabel("fly")
      .to(lgf, {
        left: () => { const b = brand.getBoundingClientRect(); return b.left + b.width / 2; },
        top: () => { const b = brand.getBoundingClientRect(); return b.top + b.height / 2; },
        width: () => brand.getBoundingClientRect().width,
        duration: 1.2,
        ease: "power3.inOut",
      }, "fly")
      .to(lpB, { yPercent: -100, duration: 1, ease: "expo.inOut" }, "fly+=0.05")
      .to(lpA, { yPercent: -100, duration: 1, ease: "expo.inOut" }, "fly+=0.17")
      .to(lgf, { color: "#1f1d1a", duration: 0.35 }, "fly+=0.75")
      .to($(".l8", lgf), { fill: "#c21f27", duration: 0.25 }, "fly+=0.22")
      .add(() => { done(); V8.pageIn({ nav: false }); }, "fly+=0.4");

    ld.addEventListener("pointerdown", () => tl.timeScale(3.5));
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
