/* V8 Motors — catalogue page */
(function (V8) {
  const { $, $$ } = V8;
  const PAGE = 12;
  const params = new URLSearchParams(location.search);
  const st = { cars: [], f: params.get("type") || "all", q: params.get("q") || "", sort: "new", shown: PAGE };

  const sorters = {
    new: (a, b) => (b.created > a.created ? 1 : -1),
    lo: (a, b) => a.price - b.price,
    hi: (a, b) => b.price - a.price,
    yr: (a, b) => b.year - a.year,
  };

  function list() {
    const q = st.q.trim().toLowerCase();
    return st.cars
      .filter((c) => (st.f === "all" ? true : st.f === "deal" ? c.deal : c.type === st.f))
      .filter((c) => !q || `${c.title} ${c.year} ${c.colour} ${c.fuel} ${c.body} ${c.trans}`.toLowerCase().includes(q))
      .sort(sorters[st.sort]);
  }

  function render() {
    const l = list();
    const grid = $("#grid");
    grid.innerHTML = l.slice(0, st.shown).map((c, i) => V8.card(c, { eager: i < 6 })).join("");
    $$(".card", grid).forEach((el, i) => { el.setAttribute("data-reveal", ""); el.style.setProperty("--dl", `${(i % 3) * 0.07}s`); });
    $("#empty").hidden = l.length > 0;
    $("#more").hidden = l.length <= st.shown;
    $("#count").textContent = `${l.length} car${l.length === 1 ? "" : "s"}${st.f !== "all" ? " · " + (st.f === "deal" ? "Deals" : V8.TYPES[st.f]) : ""}${st.q ? ` · “${st.q}”` : ""}`;
    V8.observe(grid);
    setTimeout(() => scrollBy(0, 0), 30);
    const u = new URL(location);
    st.f === "all" ? u.searchParams.delete("type") : u.searchParams.set("type", st.f);
    st.q ? u.searchParams.set("q", st.q) : u.searchParams.delete("q");
    history.replaceState(null, "", u);
  }

  V8.loadCars().then((cars) => {
    st.cars = cars;
    $("#n-all").textContent = cars.length;
    ["suv", "hatch", "sedan", "work"].forEach((t) => ($("#n-" + t).textContent = cars.filter((c) => c.type === t).length));
    const deals = cars.filter((c) => c.deal).length;
    $("#n-deal").textContent = deals;
    if (!deals) $('[data-f="deal"]').style.display = "none";
    $$(".chip").forEach((c) => c.classList.toggle("on", c.dataset.f === st.f));
    $("#q").value = st.q;
    render();
  });

  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    $$(".chip").forEach((c) => c.classList.toggle("on", c === b));
    st.f = b.dataset.f;
    st.shown = PAGE;
    render();
  });
  let t;
  $("#q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { st.q = e.target.value; st.shown = PAGE; render(); }, 180); });
  $("#sort").addEventListener("change", (e) => { st.sort = e.target.value; render(); });
  $("#more").addEventListener("click", () => { st.shown += PAGE; render(); });
})(window.V8);
