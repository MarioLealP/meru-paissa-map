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

Local: `python -m http.server -d site 8000`, or the real image:

```sh
podman build -t paissa-map . && podman run --rm --read-only --tmpfs /tmp --user 10001 -p 8080:8080 paissa-map
```

## On Meru

A static site on Meru, made from the [Meru/nuwa-static](https://git.clockmost.com/Meru/nuwa-static) template: `site/`
served by unprivileged nginx on 8080 with this repo's `nginx.conf`. The pod may open no connections at all
(`networkPolicy.egress: none`) - PaissaDB is called by the visitor's browser, never by the server.

Edit `site/`, open a PR, merge. Merging to `main` builds the image, signs it with this app's key, pushes it to Zot and
rolls it out. `deploy/values.yaml` is the whole deployment (Meru's `nuwa-app` chart); `deploy/meru.yaml` makes Meru
deploy it into namespace `paissa-map`. Route: `paissa.clockmost.com`, SSO at Caddy, Mario only, LAN + VPN only.

History: this repo carries the commits of [MarioGLealP/paissa-map](https://git.clockmost.com/MarioGLealP/paissa-map),
the Docker Compose version, which stays public and archived as it was.

## License

Code: MIT (`LICENSE`). The district map images in `site/maps/` are FINAL FANTASY XIV assets, (c) SQUARE ENIX, used as
fan content - not covered by the license.
