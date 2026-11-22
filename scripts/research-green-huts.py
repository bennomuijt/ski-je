#!/usr/bin/env python3
"""Audit all numeric PDF text spans on the official SkiWelt 2026/27 map.

Purpose: locate printed GREEN hut numbers in official PDF without OCR or
invented GPS coordinates. This is a research tool; candidates need visual QA.
"""
from collections import Counter, defaultdict
from pathlib import Path
from urllib.request import urlopen
import json
import re

import fitz

OUT = Path("test-artifacts")
OUT.mkdir(exist_ok=True, parents=True)
URL = "https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.pdf"
FILE = OUT / "skiwelt-panorama-26-27-nl.pdf"
if not FILE.exists():
    import subprocess
    subprocess.run(["curl", "-fLsS", "--retry", "3", "--max-time", "70",
                    "-o", str(FILE), URL], check=True)
doc = fitz.open(FILE)
p = doc[0]
W, H = p.rect.width, p.rect.height
print("PDF page:", len(doc), round(W, 3), round(H, 3), flush=True)

def span_to_dict(sp):
    rect = sp["bbox"]
    color = f"#{int(sp['color']):06x}"
    return {
        "text": sp["text"],
        "x": round((rect[0] + rect[2]) / 2 / W, 6),
        "y": round((rect[1] + rect[3]) / 2 / H, 6),
        "w": round((rect[2] - rect[0]) / W, 6),
        "h": round((rect[3] - rect[1]) / H, 6),
        "font": sp.get("font", ""),
        "size": sp.get("size"),
        "color": color,
        "bbox": [round(x, 3) for x in rect],
    }
spans = []
for block in p.get_text("dict")["blocks"]:
    if block.get("type") != 0:
        continue
    for line in block.get("lines", []):
        for span in line.get("spans", []):
            if span.get("text", "").strip():
                spans.append(span_to_dict(span))
numeric = [s for s in spans if re.fullmatch(r"\s*\d{1,3}[a-zA-Z]?\s*", s["text"])]
summary = Counter((s["color"], s["font"], round(float(s["size"]),1)) for s in numeric)
print("NUMERIC_SPANS",len(numeric), flush=True)
for (color,font,size),count in summary.most_common(40):
    print(f"{count:4} | {color} | {font:30} | {size:5}", flush=True)
for color in ["#ffffff", "#fffffe", "#000000"]:
    nums=[s for s in numeric if s["color"] == color]
    print("COLOR", color, "COUNT",len(nums), "LABELS",",".join(s["text"].strip() for s in nums[:120]), flush=True)
result={"source":URL,"pdf_rect":[W,H],"total_numeric_spans":len(numeric),
        "all_numeric":numeric, "color_font_distribution":[{"color":c,"font":f,"size":z,"count":n} for (c,f,z),n in summary.most_common()]}
(OUT/"skiwelt-all-pdf-numbers.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf8")
# Extract all white digits in full because green hut symbols use white labels.
white=[s for s in numeric if s["color"].lower() in ("#ffffff","#fffffe","#fefefe") and s["font"].endswith("Regular")]
(OUT/"skiwelt-white-pdf-labels.json").write_text(json.dumps(white,ensure_ascii=False,indent=2),encoding="utf8")
print("WHITE REGULAR",len(white),flush=True)
