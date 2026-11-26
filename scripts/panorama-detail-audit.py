"""Render the official panorama as research evidence, never GPS.
Only reuse printed hut coordinates on the previously reviewed PDF version.
"""
import hashlib
import json
import re
import subprocess
from pathlib import Path
from PIL import Image

out = Path("panorama-detail-evidence")
out.mkdir(exist_ok=True)
pdf = out / "SkiWelt-Panorama-26-27-NL.pdf"
origins = [
    "https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.pdf",
    "https://ski-je.bennomuijt.workers.dev/api/skimap.pdf",
]
expected = "510e48bede247b856b9e8de5b0b0161d3f4182be468278bd231c3510b6a93798"
source = None
for url in origins:
    result = subprocess.run(["curl", "-fLsS", "--retry", "1",
                             "--max-time", "40", "-o", str(pdf), url])
    if result.returncode == 0 and pdf.exists() and pdf.read_bytes().startswith(b"%PDF-"):
        source = url
        break
    pdf.unlink(missing_ok=True)
if source is None:
    raise RuntimeError("Official PDF unavailable via both download routes")
digest = hashlib.sha256(pdf.read_bytes()).hexdigest()
info = subprocess.check_output(["pdfinfo", str(pdf)], text=True)
(out / "pdfinfo.txt").write_text(info, encoding="utf-8")
if not re.search(r"^Pages:\s+1\s*$", info, re.M):
    raise RuntimeError("Unexpected panorama page count")
subprocess.run(["pdftoppm", "-f", "1", "-l", "1", "-r", "432",
                "-png", "-singlefile", str(pdf), str(out / "full-432dpi")],
               check=True)
subprocess.run(["pdftotext", "-bbox-layout", str(pdf), str(out / "labels.html")],
               check=True)
with Image.open(out / "full-432dpi.png") as rendered:
    w, h = rendered.size
    meta = {"source": source, "sha256": digest, "expectedSha256": expected,
            "width": w, "height": h, "dpi": 432,
            "coordinatesAreGPS": False, "hutCrops": 0,
            "note": "Research images only; no physical route certification."}
    if digest != expected or abs(w/h - 3537/2445) > 0.01:
        (out / "metadata.json").write_text(json.dumps(meta, indent=2))
        raise RuntimeError("Map version or aspect ratio changed: visually realign before cropping")
    src = Path("public/skiwelt-printed-hut-labels.js").read_text(encoding="utf-8")
    match = re.search(r"labels:(\[\[[\s\S]*?\]\])\s*\n", src)
    labels = json.loads(match.group(1))
    assert len(labels) == 69 and len({row[0] for row in labels}) == 69
    for number, x, y in labels:
        if not (0 < x < 1 and 0 < y < 1 and number.isdigit()):
            raise ValueError("Invalid printed hut label")
        # A generous surrounding area shows piste numbers, branches and lifts.
        left, top = max(0, round((x-.08)*w)), max(0, round((y-.10)*h))
        right, bottom = min(w, round((x+.08)*w)), min(h, round((y+.10)*h))
        rendered.crop((left, top, right, bottom)).save(out / ("hut-" + number.zfill(3) + ".png"))
    meta["hutCrops"] = len(labels)
    (out / "metadata.json").write_text(json.dumps(meta, indent=2))
    print("PANORAMA_DETAIL " + json.dumps(meta))
