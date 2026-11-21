#!/usr/bin/env python3
"""OCR last resort ONLY for tiny green hut-number badges drawn as vector outlines.
PDF vector text extraction recovers 8 of 69 numbers, the other 61 are shapes.
This diagnostic does not generate unverified live coordinates.
"""
import io,json,re,subprocess,urllib.request,collections
import fitz
from PIL import Image,ImageOps,ImageFilter
URL='https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.pdf'
request=urllib.request.Request(URL,headers={'User-Agent':'SKI-je-map-verify/1.0'})
try:
 with urllib.request.urlopen(request,timeout=50) as response:data=response.read()
 doc=fitz.open(stream=data,filetype='pdf');page=doc[0]
except Exception as e:print('HUT_PDF_UNAVAILABLE',repr(e));raise SystemExit(0)
numbers=[]
for b in page.get_text('dict')['blocks']:
 for line in b.get('lines',[]):
  for s in line['spans']:
   if re.fullmatch(r'\d{1,3}',s['text'].strip()):
    bb=s['bbox'];numbers.append((s['text'].strip(),(bb[0]+bb[2])/2,(bb[1]+bb[3])/2,s['font'],s['color']))
green=[]
for d in page.get_drawings():
 r=d.get('rect');fill=d.get('fill')
 if r is None or fill is None:continue
 rgb=tuple(round(v*255) for v in fill[:3])
 if rgb==(130,187,65) and 10.5<=r.width<=13 and 5.5<=r.height<=8:
  green.append(r)
green.sort(key=lambda r:(r.y0,r.x0))
result=[]
for i,r in enumerate(green):
 direct=[str(n) for n,x,y,font,color in numbers if font=='MyriadPro-Regular' and color==0xffffff and r.x0-1<=x<=r.x1+1 and r.y0-1<=y<=r.y1+1]
 if direct:
  result.append({'index':i,'number':direct[0],'method':'vector-text','confidence':100,'x':round((r.x0+r.x1)/2/page.rect.width,5),'y':round((r.y0+r.y1)/2/page.rect.height,5)})
  continue
 # High-resolution crop of the EXACT green hut badge; does not OCR the map.
 clip=fitz.Rect(r.x0-1,r.y0-1,r.x1+1,r.y1+1)
 pix=page.get_pixmap(matrix=fitz.Matrix(14,14),clip=clip,alpha=False)
 image=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
 # Threshold white digits against the filled green badge; enlarge and pad.
 image=image.convert('L').point(lambda p:0 if p>190 else 255)
 expanded=Image.new('L',(image.width+70,image.height+45),255);expanded.paste(image,(35,20))
 buf=io.BytesIO();expanded.save(buf,format='PNG')
 try:
  run=subprocess.run(['tesseract','stdin','stdout','--psm','7','-l','eng','-c','tessedit_char_whitelist=0123456789','tsv'],
   input=buf.getvalue(),stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=8)
  rows=run.stdout.decode('utf-8','replace').splitlines()[1:];words=[]
  for row in rows:
   a=row.split('\t')
   if len(a)>=12 and a[11].strip():
    try:confidence=float(a[10])
    except:confidence=-1
    words.append((a[11].strip(),confidence))
  match=max(words,key=lambda p:p[1]) if words else ('',-1)
  value=match[0].strip()
 except Exception as e:value='';match=('ERROR',-1)
 if not re.fullmatch(r'\d{1,3}',value):value=None
 result.append({'index':i,'number':value,'method':'ocr','confidence':round(match[1],1),
  'x':round((r.x0+r.x1)/2/page.rect.width,5),'y':round((r.y0+r.y1)/2/page.rect.height,5)})
print('HUT_BADGE_COUNT',len(result))
print('HUT_RECOGNITION',json.dumps(result,ensure_ascii=False,separators=(',',':')))
conf=collections.Counter(x['method']+(':valid' if x['number'] else ':missing') for x in result)
print('HUT_RECOGNITION_SUMMARY',dict(conf))
