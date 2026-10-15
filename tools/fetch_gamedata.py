"""Build the static game data: district maps (cropped to the plots) and plot positions.

Run once (or after a housing district changes): `uv run tools/fetch_gamedata.py`.
Needs the `vips` CLI for the image crop/convert.
"""

import json
import subprocess
import tempfile
import urllib.request
from pathlib import Path

XIVAPI = "https://v2.xivapi.com/api"
OUT = Path(__file__).resolve().parent.parent / "site"
# PaissaDB district id -> HousingLandSet row (same order as the game's sheet)
DISTRICTS = {339: 0, 340: 1, 341: 2, 641: 3, 979: 4}
MAP_PX = 2048
PAD = 90  # px of map kept around the outermost plots
OUT_PX = 1400
UA = {"User-Agent": "paissa-map gamedata builder (personal, clockmost.com)"}


def get(path: str) -> dict:
    return json.loads(fetch(f"{XIVAPI}/{path}"))


def fetch(url: str) -> bytes:
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r:
        return r.read()


def to_px(pos: float, offset: int, size_factor: int) -> float:
    return (pos + offset) * size_factor / 100 + MAP_PX / 2


def build_district(district_id: int, land_row: int, tmp: Path) -> dict:
    terr = get(
        f"sheet/TerritoryType/{district_id}"
        "?fields=PlaceName.Name,Map.Id,Map.SizeFactor,Map.OffsetX,Map.OffsetY"
    )["fields"]
    m = terr["Map"]["fields"]
    sizes = get(f"sheet/HousingLandSet/{land_row}?fields=LandSet[].PlotSize")["fields"]["LandSet"]

    plots = []
    for n in range(1, 31):
        f = get(f"sheet/HousingMapMarkerInfo/{district_id}:{n}?fields=X,Z")["fields"]
        plots.append(
            {
                "n": n,
                "size": sizes[n - 1]["PlotSize"],
                "x": to_px(f["X"], m["OffsetX"], m["SizeFactor"]),
                "y": to_px(f["Z"], m["OffsetY"], m["SizeFactor"]),
            }
        )

    # square crop around the plots
    xs, ys = [p["x"] for p in plots], [p["y"] for p in plots]
    side = max(max(xs) - min(xs), max(ys) - min(ys)) + 2 * PAD
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    left = int(min(max(cx - side / 2, 0), MAP_PX - side))
    top = int(min(max(cy - side / 2, 0), MAP_PX - side))
    side = int(side)

    src = tmp / f"{district_id}.jpg"
    src.write_bytes(fetch(f"{XIVAPI}/asset/map/{m['Id']}"))
    cropped = tmp / f"{district_id}-crop.v"
    subprocess.run(["vips", "crop", src, cropped, str(left), str(top), str(side), str(side)], check=True)
    dest = OUT / "maps" / f"{district_id}.webp"
    subprocess.run(
        ["vips", "resize", cropped, f"{dest}[Q=80]", str(OUT_PX / side)], check=True
    )

    for p in plots:  # positions as % of the cropped image
        p["x"] = round((p["x"] - left) / side * 100, 2)
        p["y"] = round((p["y"] - top) / side * 100, 2)
    return {"id": district_id, "name": terr["PlaceName"]["fields"]["Name"], "plots": plots}


def main() -> None:
    (OUT / "maps").mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as t:
        districts = [build_district(d, row, Path(t)) for d, row in DISTRICTS.items()]
    (OUT / "districts.json").write_text(json.dumps(districts, indent=1) + "\n")
    print(f"wrote {len(districts)} districts")


if __name__ == "__main__":
    main()
