/* V8 Motors — single car page */
(function (V8) {
  const { $, $$ } = V8;
  const id = Number(new URLSearchParams(location.search).get("id"));
  let car, idx = 0;

  function show(i) {
    const n = car.photos.length;
    if (!n) return;
    idx = (i + n) % n;
    const main = $("#galMain");
    const old = $("img", main);
    const im = new Image();
    im.alt = `${car.year} ${car.title} — photo ${idx + 1}`;
    im.className = "out";
    im.src = car.photos[idx];
    main.prepend(im);
    const reveal = () => requestAnimationFrame(() => {
      im.classList.remove("out");
      if (old) { old.classList.add("out"); setTimeout(() => old.remove(), 600); }
    });
    im.complete ? reveal() : (im.onload = im.onerror = reveal);
    $("#galN").textContent = `${String(idx + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
    $$("#thumbs button").forEach((b, k) => b.classList.toggle("on", k === idx));
  }

  V8.loadCars().then((cars) => {
    car = cars.find((c) => c.id === id) || cars[0];
    if (!car) return;
    const e = V8.esc;
    document.title = `${car.year} ${car.title} — ${V8.rs(car.price)} · V8 Motors`;
    $("#crumb").textContent = `${car.year} ${car.title}`;
    $("#cMake").textContent = `${car.make} · ${V8.TYPES[car.type]}`;
    $("#cTitle").innerHTML = `${e(car.model || car.make)} <span class="yr">${car.year}</span>`;
    $("#cPrice").innerHTML = `${V8.rs(car.price)}${car.deal ? '<span class="chip-t">Saturday deal</span>' : ""}`;
    const rows = [
      ["Registered", car.reg], ["Transmission", car.trans], ["Fuel", car.fuel], ["Engine", car.cc ? `${car.cc} cc` : ""],
      ["Mileage", car.mileage ? `${Number(car.mileage).toLocaleString()} km` : ""], ["Colour", car.colour],
      ["Body", car.body], ["Doors / seats", car.doors && car.seats ? `${car.doors} / ${car.seats}` : ""],
    ].filter(([, v]) => v);
    $("#cSpecs").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${e(v)}</dd></div>`).join("");
    $("#cDesc").textContent = car.desc;
    $("#fCar").value = `${car.year} ${car.title} (${V8.rs(car.price)})`;
    $("#thumbs").innerHTML = car.photos.map((p, k) => `<button aria-label="Photo ${k + 1}"><img src="${e(p)}" alt="" loading="lazy" /></button>`).join("");
    $$("#thumbs button").forEach((b, k) => b.addEventListener("click", () => show(k)));
    show(0);

    const sim = cars.filter((c) => c.id !== car.id && c.type === car.type).slice(0, 3);
    const fill = sim.length < 3 ? cars.filter((c) => c.id !== car.id && !sim.includes(c)).slice(0, 3 - sim.length) : [];
    $("#similar").innerHTML = [...sim, ...fill].map((c) => V8.card(c)).join("");
    $$("#similar .card").forEach((el, i) => { el.setAttribute("data-reveal", ""); el.style.setProperty("--dl", `${i * 0.07}s`); });
    V8.observe();
  });

  $("#gp").addEventListener("click", () => show(idx - 1));
  $("#gn").addEventListener("click", () => show(idx + 1));
  addEventListener("keydown", (ev) => {
    if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (ev.key === "ArrowLeft") show(idx - 1);
    if (ev.key === "ArrowRight") show(idx + 1);
  });
  let tx = null;
  $("#galMain").addEventListener("touchstart", (ev) => (tx = ev.touches[0].clientX), { passive: true });
  $("#galMain").addEventListener("touchend", (ev) => {
    if (tx === null) return;
    const dx = ev.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    tx = null;
  });
  $("#toForm").addEventListener("click", (ev) => { ev.preventDefault(); V8.scrollTo($("#enquire")); setTimeout(() => $("#n1").focus({ preventScroll: true }), 900); });
})(window.V8);
