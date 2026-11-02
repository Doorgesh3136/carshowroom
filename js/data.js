/* =========================================================
   V8 Motors — live inventory (same API as v8motors.mu)
   Falls back to js/snapshot.js if the API can't be reached.
   ========================================================= */
window.V8 = window.V8 || {};
(function (V8) {
  const API = "https://v8.farhaan.info/api";
  const ORIGIN = "https://v8.farhaan.info";
  const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const SPECIAL = { KIA: "Kia", I10: "i10", "328I": "328i", CRV: "CR-V", FIT: "Fit", CIAZ: "Ciaz", XL6: "XL6" };

  const img = (u) => (!u ? "" : /^https?:/i.test(u) ? u : ORIGIN + u);
  const nice = (s) =>
    String(s ?? "").trim().split(/\s+/).filter(Boolean).map((w) => {
      const W = w.toUpperCase();
      if (SPECIAL[W]) return SPECIAL[W];
      if (["BMW", "AD", "NP", "VW", "SUV", "MPV"].includes(W) || /\d/.test(w)) return W;
      return W[0] + W.slice(1).toLowerCase();
    }).join(" ");
  const cat = (t = "") => {
    t = String(t).toUpperCase();
    if (t === "SUV") return "suv";
    if (t === "HATCHBACK") return "hatch";
    if (t === "SEDAN" || t === "SALOON") return "sedan";
    return "work";
  };

  V8.TYPES = { suv: "SUV", hatch: "Hatchback", sedan: "Sedan", work: "Pickup & Van" };
  V8.rs = (n) => "Rs " + Number(n).toLocaleString("en-US");
  V8.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function normalise(c) {
    let make = nice(c.make);
    let model = nice(c.model);
    if (make === "Range" && /^Rover/.test(model)) { make = "Range Rover"; model = model.replace(/^Rover\s*/, ""); }
    if (model.toLowerCase() === make.toLowerCase()) model = "";
    return {
      id: c.id,
      make,
      model,
      title: model ? `${make} ${model}` : make,
      year: c.year,
      reg: c.month ? `${MONTHS[c.month]} ${c.year}` : String(c.year || ""),
      mileage: c.mileage,
      type: cat(c.type),
      body: nice(c.type),
      trans: nice(c.transmission),
      fuel: nice(c.fuelType),
      cc: c.engineCc,
      doors: c.doors,
      seats: c.seats,
      colour: nice(c.colour),
      desc: c.description || "",
      price: Number(c.priceMur) || 0,
      deal: !!c.isDeal,
      created: c.createdAt || "",
      photos: (c.photos || c.images || [])
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((p) => img(typeof p === "string" ? p : p.url))
        .filter(Boolean),
    };
  }

  let cache;
  V8.loadCars = function () {
    if (cache) return cache;
    cache = (async () => {
      let raw;
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(`${API}/cars?page=1&pageSize=200&status=FOR_SALE&sortBy=createdAt&sortDir=desc`, { signal: ctrl.signal });
        clearTimeout(to);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        raw = Array.isArray(data) ? data : data.items || [];
        if (!raw.length) throw new Error("empty");
      } catch (e) {
        console.warn("V8: live catalogue unavailable, using saved snapshot.", e);
        raw = window.V8_SNAPSHOT || [];
      }
      return raw.map(normalise).filter((c) => c.price > 0).sort((a, b) => (b.created > a.created ? 1 : -1));
    })();
    return cache;
  };

  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  V8.arrow = arrow;

  V8.card = function (c, opts = {}) {
    const e = V8.esc;
    const specs = [c.year, c.trans, c.fuel, c.mileage ? `${Number(c.mileage).toLocaleString()} km` : c.cc ? `${c.cc} cc` : ""].filter(Boolean);
    const tag = c.deal ? '<span class="chip-t deal">Saturday deal</span>' : "";
    return `
    <a class="card" href="car.html?id=${c.id}" data-cursor="View">
      <div class="im">
        ${tag}
        <span class="nph">${c.photos.length} photos</span>
        <img src="${e(c.photos[0] || "")}" alt="${e(`${c.year} ${c.title}`)}" loading="${opts.eager ? "eager" : "lazy"}" decoding="async" />
      </div>
      <div class="bd">
        <p class="mk">${e(c.make)} · ${V8.TYPES[c.type]}</p>
        <h3>${e(c.model || c.make)}</h3>
        <div class="sp">${specs.map((s) => `<span>${e(s)}</span>`).join("")}</div>
        <div class="ft"><span class="pr">${V8.rs(c.price)}</span><span class="go">View ${arrow}</span></div>
      </div>
    </a>`;
  };
})(window.V8);
