#!/usr/bin/env python3
"""Diagnostic only: extract vector text positions from official 2026/27 SkiWelt PDF.
No marker positions are published until lift/restaurant/piste typography is verified.
"""
import collections, json, os, re, urllib.request
import fitz
URL="https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.pdf"
def main():
 request=urllib.request.Request(URL,headers={"User-Agent":"SKI-je-map-data-verification/1.0","Accept":"application/pdf"})
 try:
  with urllib.request.urlopen(request, timeout=40) as response:
   content=response.read()
 except Exception as exc:
  print("MAP_PDF_DOWNLOAD_FAILED",repr(exc));return
 if not content.startswith(b"%PDF"):
  print("MAP_NOT_PDF",len(content),repr(content[:70]));return
 doc=fitz.open(stream=content,filetype="pdf");page=doc[0]
 print("PDF_PAGE_GEOMETRY",json.dumps({"pages":len(doc),"width":page.rect.width,"height":page.rect.height,"bytes":len(content)}))
 try:
  jpg_url=URL[:-4]+'.jpg'
  with urllib.request.urlopen(urllib.request.Request(jpg_url,headers={"User-Agent":"SKI-je-map-data-verification/1.0","Accept":"image/jpeg"}),timeout=40) as jpeg:
   bitmap=jpeg.read()
  pic=fitz.Pixmap(bitmap)
  ratio=pic.width/pic.height
  pdf_ratio=page.rect.width/page.rect.height
  print("JPG_GEOMETRY",json.dumps({"width":pic.width,"height":pic.height,"ratio":ratio,"pdfRatio":pdf_ratio,"relativeDifference":round(abs(ratio/pdf_ratio-1),6),"bytes":len(bitmap)}))
 except Exception as exc:
  print("JPG_GEOMETRY_FAILED",repr(exc))

 spans=[]
 for block in page.get_text("dict",sort=False)["blocks"]:
  if "lines" not in block:continue
  for line in block["lines"]:
   for s in line["spans"]:
    v=s["text"].strip(); 
    if not v:continue
    spans.append(dict(text=v,x=round(s["bbox"][0],2),y=round(s["bbox"][1],2),w=round(s["bbox"][2]-s["bbox"][0],2),h=round(s["bbox"][3]-s["bbox"][1],2),size=round(s["size"],2),font=s["font"],color="%06x"%s["color"]))
 nums=[s for s in spans if re.fullmatch(r"\d{1,3}[a-e]?",s["text"])]
 styles=collections.Counter((s["font"],s["color"],s["size"]) for s in nums)
 print("PDF_STYLES",json.dumps([{"style":k,"count":v,"sample":[{"v":s["text"],"x":s["x"],"y":s["y"]} for s in nums if (s["font"],s["color"],s["size"])==k][:8]} for k,v in styles.most_common(24)],ensure_ascii=False))
 print("PDF_NUMERIC_COUNTS",json.dumps({"spans":len(spans),"numbers":len(nums),"unique":len(set(s["text"] for s in nums))}))
 black=[s for s in nums if s["font"]=="MyriadPro-BlackCond" and s["color"]=="231f20" and s["size"] in (6.34,7.93,7.05)]
 print("LIFT_STYLE_CANDIDATES",json.dumps(black,ensure_ascii=False,separators=(',',':')))
 print("LIFT_STYLE_COUNT",len(black),"UNIQUE",len(set(s["text"] for s in black)))
 for style,cnt in styles.most_common(8):
  if style[1]=="ffffff" and cnt>=8:
   values=[s for s in nums if (s["font"],s["color"],s["size"])==style]
   print("WHITE_STYLE_SAMPLE",json.dumps({"style":style,"numbers":values[:20]},ensure_ascii=False))

 for n in ["1","2","6","11","26","40","42","58","59","61","62","80","99","110","120"]:
  matches=[s for s in nums if s["text"]==n]
  print("NUMBER",n,json.dumps(matches[:20],ensure_ascii=False))
 print("SAMPLE_AREA_WORDS",json.dumps([s for s in spans if any(v in s["text"].lower() for v in ["ellmau","scheffau","hopfgarten","westendorf","brixen","going","söll","itter"])][:35],ensure_ascii=False))
 print("NOTE: these are raw PDF text placements, not verified lift/restaurant markers; pistes share numbers.")
if __name__=="__main__":main()
