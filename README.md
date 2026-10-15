# paissa-map

FFXIV housing: open plots from [PaissaDB](https://zhu.codes/paissa) shown on the district maps instead of a list.
Static site, no build step, no backend of its own.

- `site/` - the page. `api.js` reads `paissadb.zhu.codes` from the browser and caches each world in localStorage
  for 12 h (Refresh button forces a fetch) - it is a free community service, keep requests rare.
- `site/districts.json`, `site/maps/` - generated game data (plot positions, sizes, cropped maps) from XIVAPI.
  Rebuild only if a housing district changes: `uv run tools/fetch_gamedata.py` (needs `vips`).
- Subdivision plots (31-60) share the main division's layout, so plot N+30 is drawn on plot N's marker.
- PaissaDB numbers wards and plots from 0; `purchase_system` is a bit flag (1 lottery, 2 FC, 4 personal);
  `lotto_phase` 1 entries open, 2 results, 3 unavailable.

Local: `python -m http.server -d site 8000`.
