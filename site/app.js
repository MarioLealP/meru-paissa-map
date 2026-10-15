import { getWorld, getWorlds } from "./api.js";
import { ago, bestStatus, describe, mainPlot, status } from "./listing.js";

const $ = (id) => document.getElementById(id);
const SIZE_NAMES = ["S", "M", "L"];

const state = {
  districts: [], // static: map + plot positions
  world: null, // cached PaissaDB entry {at, data}
  districtId: null,
  selected: null, // main-division plot number 1-30
};

function pref(key, fallback) {
  try {
    return localStorage.getItem(`pref:${key}`) ?? fallback;
  } catch {
    return fallback;
  }
}

function setPref(key, value) {
  try {
    localStorage.setItem(`pref:${key}`, value);
  } catch {}
}

function filtered(plots) {
  const sizes = [...document.querySelectorAll("[data-size]")].filter((c) => c.checked).map((c) => +c.dataset.size);
  const entryOnly = $("entry-only").checked;
  return plots.filter((p) => sizes.includes(p.size) && (!entryOnly || status(p) === "open"));
}

function openPlots(districtId) {
  const d = state.world?.data.districts.find((x) => x.id === districtId);
  return d ? filtered(d.open_plots) : [];
}

function renderTabs() {
  $("districts").replaceChildren(
    ...state.districts.map((d) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-pressed", d.id === state.districtId);
      b.append(`${d.name} `);
      const n = document.createElement("span");
      n.textContent = openPlots(d.id).length;
      b.append(n);
      b.onclick = () => {
        state.districtId = d.id;
        state.selected = null;
        setPref("district", d.id);
        render();
      };
      return b;
    }),
  );
}

function renderMap() {
  const district = state.districts.find((d) => d.id === state.districtId);
  $("map-img").src = `maps/${district.id}.webp`;
  const byPlot = Map.groupBy(openPlots(district.id), mainPlot);

  $("markers").replaceChildren(
    ...district.plots.map((spot) => {
      const here = byPlot.get(spot.n) ?? [];
      const m = document.createElement("button");
      m.type = "button";
      m.className = `plot size-${spot.size}`;
      if (here.length) m.classList.add(bestStatus(here));
      if (spot.n === state.selected) m.classList.add("selected");
      m.style.left = `${spot.x}%`;
      m.style.top = `${spot.y}%`;
      m.textContent = here.length > 1 ? `${spot.n}·${here.length}` : spot.n;
      m.title = `Plot ${spot.n} / ${spot.n + 30} (${SIZE_NAMES[spot.size]})`;
      m.onclick = () => {
        state.selected = spot.n;
        render();
      };
      return m;
    }),
  );
}

function renderDetail() {
  const box = $("detail");
  if (!state.selected) {
    box.innerHTML = '<p class="muted">Click a plot. Numbers like 4·3 mean plot 4 is open in 3 wards (main or subdivision).</p>';
    return;
  }
  const n = state.selected;
  const here = openPlots(state.districtId)
    .filter((p) => mainPlot(p) === n)
    .sort((a, b) => a.ward_number - b.ward_number || a.plot_number - b.plot_number);

  const h = document.createElement("h2");
  h.textContent = `Plot ${n} / Sub ${n + 30}`;
  const items = here.map((p) => {
    const { title, lines } = describe(p);
    const div = document.createElement("div");
    div.className = "listing";
    const t = document.createElement("strong");
    t.textContent = title;
    div.append(t, ...lines.flatMap((l) => [document.createElement("br"), l]));
    return div;
  });
  if (!items.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "Not open in any ward (with the current filters).";
    items.push(p);
  }
  box.replaceChildren(h, ...items);
}

function renderAge() {
  $("age").textContent = state.world ? `Data from ${ago(Date.now() - state.world.at)}` : "Loading...";
}

function render() {
  renderTabs();
  renderMap();
  renderDetail();
  renderAge();
}

async function loadWorld(id, force = false) {
  $("age").textContent = "Loading...";
  try {
    state.world = await getWorld(id, force);
  } catch (e) {
    $("age").textContent = `Failed: ${e.message}`;
    return;
  }
  render();
}

function fillWorlds(worlds, current) {
  const byDc = Map.groupBy(
    worlds.toSorted((a, b) => a.datacenter_name.localeCompare(b.datacenter_name) || a.name.localeCompare(b.name)),
    (w) => w.datacenter_name,
  );
  $("world").replaceChildren(
    ...[...byDc].map(([dc, ws]) => {
      const g = document.createElement("optgroup");
      g.label = dc;
      g.append(...ws.map((w) => new Option(w.name, w.id, false, w.id === current)));
      return g;
    }),
  );
}

async function init() {
  state.districts = await (await fetch("districts.json")).json();
  state.districtId = +pref("district", state.districts[0].id);

  const worldId = +(new URLSearchParams(location.search).get("world") ?? pref("world", 42));
  fillWorlds((await getWorlds()).data, worldId);

  $("world").onchange = (e) => {
    const id = +e.target.value;
    setPref("world", id);
    history.replaceState(null, "", `?world=${id}`);
    state.selected = null;
    loadWorld(id);
  };
  $("refresh").onclick = () => loadWorld(+$("world").value, true);
  $("filters").onchange = render;
  setInterval(renderAge, 60000);

  render();
  await loadWorld(worldId);
}

init();
