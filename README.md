# paissa-map

FFXIV housing - PaissaDB's open plots on the district maps

A static site on Meru, made from the [Meru/nuwa-static](https://git.clockmost.com/Meru/nuwa-static) template: the files in
`site/` served by unprivileged nginx on port 8080. No backend - anything else a page needs, the visitor's browser fetches
itself, so the pod may open no connections at all.

## Change the site

Edit `site/`, open a PR, merge. Merging to `main` builds the image, signs it with this app's key, pushes it to Zot and
rolls it out. Locally: `python -m http.server -d site 8000`, or the real image:

```sh
podman build -t paissa-map . && podman run --rm --read-only --tmpfs /tmp --user 10001 -p 8080:8080 paissa-map
```

## What's fixed

- `Dockerfile`: nginx-unprivileged pinned to a digest (CI refuses anything else; an upgrade is a PR that changes it), this
  repo's `nginx.conf` and `site/`. It starts nginx directly: the base image's entrypoint scripts edit config files, and the
  root filesystem is read-only.
- `nginx.conf`: the whole config - one worker, pid and temp files in `/tmp` (the only writable path), logs to the pod's
  output, gzip, no version in headers, `GET /heartbeat` -> `ok` for Meru's probes.
- `deploy/values.yaml`: small limits, and a NetworkPolicy that lets in only Caddy and the node's probes and lets nothing
  out (`networkPolicy.egress: none`).

## Deploy

`deploy/meru.yaml` makes this repo a Meru app: [Meru/meru](https://git.clockmost.com/Meru/meru) finds it and deploys it into
namespace `paissa-map`. Shikigami adds it once the app's fence, signing key and build credentials exist, from
`deploy/meru.yaml.in` with the owner from the request. `deploy/values.yaml` is the app's whole deployment, rendered with the
`nuwa-app` chart from [Meru/nuwa](https://git.clockmost.com/Meru/nuwa). Builds run in namespace `paissa-map-build` on the
runner from [Meru/sindri](https://git.clockmost.com/Meru/sindri). No secrets live in this repo.
