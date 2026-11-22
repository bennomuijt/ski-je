#!/usr/bin/env python3
"""Inspect official SkiWelt panorama PDF without OCR or made-up map positions.

Character boxes and text colors alone are NOT a verified lift/hut classification:
numeric piste labels and numeric lift labels may overlap. We print a structured
candidate report for cross-checking with official lift/hut lists and imagery.
"""
import collections
import hashlib
import json
import re
import urllib.request
import fitz

URL = "https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.pdf"
print("PDF_SOURCE:", URL, flush=True)
req = urllib.request.Request(URL, headers={"User-Agent": "SKI-je-MapResearch/1.0", "Accept": "application/pdf"})
with urllib.request.urlopen(req, timeout=45) as response:
    contents = response.read()
assert contents[:4] == b"%PDF", "Source is not a PDF"
print("PDF_SHA256", hashlib.sha256(contents).hexdigest(), flush=True)
doc = fitz.open(stream=contents, filetype="pdf")
print("PDF_INFO", json.dumps({"bytes":len(contents),"pages":len(doc),"dimensions":[[round(p.rect.width),round(p.rect.height)] for p in doc]}), flush=True)
page=doc[0]
number_candidates=[]
for block in page.get_text("dict", sort=False)["blocks"]:
    if "lines" not in block:
        continue
    for line in block["lines"]:
        for span in line["spans"]:
            txt=span["text"].strip()
            # Only isolated numeric labels, not word sequences.
            if not re.fullmatch(r"(?:[1-9][0-9]{0,2})(?:[a-z])?",txt,re.I):
                continue
            x0,y0,x1,y1=span["bbox"]
            number_candidates.append({
                "number":txt,"page":1,
                "bbox_pt":[round(x0,3),round(y0,3),round(x1,3),round(y1,3)],
                "center_pt":[round((x0+x1)/2,3),round((y0+y1)/2,3)],
                "x":round((x0+x1)/(2*page.rect.width),5),
                "y":round((y0+y1)/(2*page.rect.height),5),
                "color":f"#{span['color']:06x}","size":round(span["size"],1),
                "font":span["font"][:40],
            })
summary=collections.Counter((v["color"],v["font"],round(v["size"],1)) for v in number_candidates)
print("PDF_NUMERIC_SPAN_COUNT",len(number_candidates))
print("PDF_STYLES", json.dumps([{"color":c,"font":f,"size":s,"count":n} for (c,f,s),n in summary.most_common(25)],ensure_ascii=False))
print("PDF_EXTRACT_EXAMPLE",json.dumps(number_candidates[:70],ensure_ascii=False))
# Print grouped data for target lift numbers to compare with on-image labels.
for number in ["1","2","6","11","20","26","30","40","42","43","51","58","59","60","61","62","67","71","80","90","97","99","100","110","120"]:
    x=[v for v in number_candidates if v["number"]==number]
    print("PDF_NUMBER",json.dumps({"number":number,"candidates":x[:15],"total_occurrences":len(x)},ensure_ascii=False))
# PDF text may be flattened into a picture. Never assert that missing labels are absent on image.
print("PDF_TEXT_ONLY_NOT_VALIDATED",True)

# Candidate shape matches a characteristic typeface, but remains subject to
# comparing against official SkiWelt numbered entity lists and visual spot check.
for typ, pred in [
    ("LIFT_STYLE_DARK", lambda p: p["color"]=="#231f20" and p["font"]=="MyriadPro-BlackCond"),
    ("HUT_STYLE_WHITE_REGULAR", lambda p: p["color"]=="#ffffff" and p["font"]=="MyriadPro-Regular"),
]:
    entries=[p for p in number_candidates if pred(p)]
    print("PDF_CLASSIFIED",json.dumps({"type":typ,"count":len(entries),"entries":entries},ensure_ascii=False))
