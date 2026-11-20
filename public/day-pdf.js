/* SKI-je A4 PDF builder: complete day and provisional SkiWelt corridors.
   Native browser PDF, original logo on every page, no cloud upload. */
(function(root,factory){
 const lib=factory();if(typeof module==='object'&&module.exports)module.exports=lib;
 if(root)root.SKIPdf=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const W=1240,H=1754;
 function join(parts){const bytes=new Uint8Array(parts.reduce((n,x)=>n+x.length,0));let at=0;for(const x of parts){bytes.set(x,at);at+=x.length;}return bytes;}
 function jpegBytes(data){const raw=atob(data.split(',')[1]);const out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
 function encodePdf(jpegs){
  if(!jpegs?.length)throw Error('Geen PDF-pagina');
  const encoder=new TextEncoder(),ascii=x=>encoder.encode(x),objects=[];
  objects[1]=ascii('<< /Type /Catalog /Pages 2 0 R >>');
  objects[2]=ascii('<< /Type /Pages /Count '+jpegs.length+' /Kids ['+jpegs.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>');
  const stream=(head,bytes)=>join([ascii(head+'\nstream\n'),bytes,ascii('\nendstream')]);
  for(let i=0;i<jpegs.length;i++){
   const p=3+i*3,c=p+1,img=p+2,jpeg=jpegs[i];
   objects[p]=ascii('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 '+img+' 0 R >> >> /Contents '+c+' 0 R >>');
   const draw=ascii('q 595.28 0 0 841.89 0 0 cm /Im0 Do Q\n');
   objects[c]=stream('<< /Length '+draw.length+' >>',draw);
   objects[img]=stream('<< /Type /XObject /Subtype /Image /Width '+W+' /Height '+H+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>',jpeg);
  }
  const chunks=[],offsets=[0];let length=0;
  const add=x=>{chunks.push(x);length+=x.length;};
  add(ascii('%PDF-1.4\n%SKIje\n'));
  for(let i=1;i<objects.length;i++){offsets[i]=length;add(ascii(i+' 0 obj\n'));add(objects[i]);add(ascii('\nendobj\n'));}
  const xref=length;
  add(ascii('xref\n0 '+objects.length+'\n0000000000 65535 f \n'));
  for(let i=1;i<objects.length;i++)add(ascii(String(offsets[i]).padStart(10,'0')+' 00000 n \n'));
  add(ascii('trailer\n<< /Size '+objects.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n'));
  return join(chunks);
 }
 const COL={navy:'#0a3657',blue:'#0875ab',orange:'#f18424',green:'#128467',red:'#b44848',ink:'#183c55',gray:'#5f7889'};
 function label(ctx,txt,x,y,size=25,color=COL.ink,bold=false){
  ctx.font=(bold?'700 ':'400 ')+size+'px system-ui,"Segoe UI",sans-serif';ctx.fillStyle=color;
  ctx.fillText(String(txt||''),x,y);
 }
 function wrap(ctx,str,maxWidth,font=20,limit=3){
  ctx.font='400 '+font+'px system-ui,sans-serif';
  const words=String(str||'').split(/\s+/);const output=[];let current='';
  for(const w of words){
   const next=current?current+' '+w:w;
   if(ctx.measureText(next).width<=maxWidth||!current){current=next;continue;}
   output.push(current);current=w;
   if(output.length===limit-1)break;
  }
  if(current)output.push(current);return output.slice(0,limit);
 }
 function lines(ctx,text,x,y,width,size=20,limit=3,color=COL.ink){
  const content=wrap(ctx,text,width,size,limit);
  content.forEach((v,i)=>label(ctx,v,x,y+i*(size+5),size,color));return content.length;
 }
 async function loadWatermark(date){
  if(typeof Image==='undefined')return null;
  const sources=['ski-intro-woman-skis.webp','ski-intro-man-skis.webp','ski-intro-woman-snowboard.webp','ski-intro-man-snowboard.webp'];
  const key=String(date||'').replace(/\D/g,'').split('').reduce((n,c)=>n+Number(c),0);
  const photo=new Image();photo.src=sources[key%sources.length];
  try{await photo.decode();return photo;}catch{return null;}
 }
 async function loadLogo(){
  if(typeof Image==='undefined')return null;
  const image=new Image();image.src='icons/icon-512-v43.png'; // Original brand-skije.svg artwork rendered to a reliable PNG icon.
  try{await image.decode();return image;}catch{return null;}
 }
 function pageStart(ctx,logo,page,total,watermark){
  ctx.fillStyle='#f6fbfe';ctx.fillRect(0,0,W,H);
  if(watermark){
   ctx.save();ctx.globalAlpha=0.12; // Watermerk blijft licht, maar is beter zichtbaar in de PDF.
   const w=930,h=1430;
   const scale=Math.min(w/watermark.naturalWidth,h/watermark.naturalHeight);
   const width=watermark.naturalWidth*scale,height=watermark.naturalHeight*scale;
   ctx.drawImage(watermark,W-75-width,(H-height)/2,width,height);
   ctx.restore();
  }
  const gradient=ctx.createLinearGradient(0,0,1240,230);
  gradient.addColorStop(0,'#073454');gradient.addColorStop(1,'#087ab1');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,W,225);
  ctx.fillStyle='white';ctx.fillRect(52,40,195,132);
  if(logo)try{ctx.drawImage(logo,63,49,172,115);}catch{label(ctx,'SKI-je',70,121,44,COL.navy,true);}
  else label(ctx,'SKI-je',70,121,44,COL.navy,true);
  label(ctx,'SKI-JE · MIJN SKIDAG',286,106,43,'white',true);
  label(ctx,'SkiWelt 2026/27  ·  BenMu Development',288,155,23,'#d6f3ff');
  ctx.fillStyle=COL.orange;ctx.fillRect(0,224,W,6);
  ctx.fillStyle=COL.navy;ctx.fillRect(0,H-97,W,97);
  label(ctx,'⚠️ SKI-je is alleen een hulpmiddel. Officiële borden en liftstatus zijn altijd leidend.',52,H-59,19,'white');
  label(ctx,'Pagina '+page+'/'+total+'  ·  Verwachte tijden zijn indicatief. Gecontroleer altijd ter plaatse.',52,H-28,17,'#c3e4f3');
 }
 function box(ctx,x,y,w,h,bg){ctx.fillStyle=bg;ctx.fillRect(x,y,w,h);}
 function schedule(ctx,plan){
  label(ctx,'VOLLEDIGE DAGPLANNING',62,289,35,COL.navy,true);
  const localDate=plan.date||new Date().toLocaleDateString('nl-NL');
  label(ctx,'DATUM '+localDate,798,289,22,COL.blue,true);
  lines(ctx,plan.startPoint+'  →  '+plan.endPoint,62,328,1115,25,2,COL.blue);
  box(ctx,58,375,1120,102,'#e7f3fa');
  label(ctx,'VERTREK',81,412,17,COL.gray,true);label(ctx,plan.departure,81,459,31,COL.navy,true);
  label(ctx,'STREEFAANKOMST',426,412,17,COL.gray,true);label(ctx,plan.safeArrival,426,459,31,COL.navy,true);
  label(ctx,'UITERLIJK TERUG',812,412,17,COL.gray,true);label(ctx,plan.returnTime,812,459,31,COL.navy,true);
  box(ctx,58,494,1120,76,'#fff1dc');
  label(ctx,'⚠  VOORLOPIGE ROUTE – NIET LIVE GECONTROLEERD',82,529,23,'#9e5f1e',true);
  label(ctx,'Pistes op kaart voor planning aangenomen open; controleer actuele sluitingen.',82,557,19,'#835f3b');
  let y=591;
  for(const row of plan.sections){
   if(y>H-245)break;
   box(ctx,58,y,1120,95,'#ffffff');
   box(ctx,58,y,9,95,{ski:'#1585bd',lunch:'#f18b2a',break:'#8aa7b7',return:'#d85b4f',buffer:'#178d6c'}[row.type]||COL.blue);
   label(ctx,row.start+'–'+row.end,88,y+40,28,COL.navy,true);
   label(ctx,row.minutes+' min',88,y+80,20,COL.gray);
   // Shrink unusually long restaurant labels rather than running into the margin.
   let titleSize=24;
   do{ctx.font='700 '+titleSize+'px system-ui,"Segoe UI",sans-serif';if(ctx.measureText(row.label).width<=744||titleSize===17)break;titleSize--;}while(true);
   label(ctx,row.label,402,y+36,titleSize,COL.ink,true);
   // Keep both lines of longer safety notes. No more clipped last words.
   lines(ctx,row.detail,403,y+65,742,17,2,COL.gray);y+=103;
  }
 }
 function noteCapacity(legCount){
  // Leave enough room for three wrapped lines per notice and the page footer.
  const legHeight=legCount*166,emptyHelp=legCount===0?130:0;
  const noteStart=358+legHeight+emptyHelp+55;
  return Math.max(0,Math.floor((H-186-noteStart)/104));
 }
 function layoutPages(legs,notes){
  const pages=[{kind:'schedule',legs:[],notes:[]}];
  const paths=[];for(let i=0;i<legs.length;i+=7)paths.push(legs.slice(i,i+7));
  if(!paths.length)paths.push([]);
  const remaining=notes.slice();
  for(let i=0;i<paths.length;i++){
   const segment=paths[i];
   const take=i===paths.length-1?noteCapacity(segment.length):0;
   pages.push({kind:'regions',legs:segment,notes:remaining.splice(0,take)});
  }
  // Never discard safety warnings when a long itinerary fills the connection page.
  while(remaining.length)pages.push({kind:'notes',legs:[],notes:remaining.splice(0,10)});
  return pages;
 }
 function regionPage(ctx,legs,notes,notesOnly=false){
  label(ctx,notesOnly?'AANDACHTSPUNTEN – VERVOLG':'VERBINDINGEN & WAARSCHUWINGEN',62,291,35,COL.navy,true);
  if(!notesOnly)label(ctx,'Bron: skiwelt.at/nl/verbindingen.html',62,332,19,COL.gray);
  let y=358;
  if(!notesOnly){
   for(const leg of legs){
    box(ctx,58,y,1120,150,'#e9f5fc');box(ctx,58,y,9,150,COL.blue);
    label(ctx,leg.from+' → '+leg.to,81,y+40,28,COL.navy,true);
    lines(ctx,leg.via,81,y+74,1030,20,3,COL.ink);
    label(ctx,'⚠  Niet live gecontroleerd · '+leg.minutes+' minuten indicatief',81,y+140,17,'#945f23');
    y+=166;
   }
   if(!legs.length){lines(ctx,'Geen gedocumenteerde open verbinding beschikbaar. Het dagtijdschema blijft bruikbaar, maar is geen navigatieroute.',70,y+38,1080,23,3,COL.ink);y+=130;}
  }
  if(notes.length){
   label(ctx,'BELANGRIJK',65,y+38,27,COL.navy,true);y+=55;
   for(const note of notes){
    box(ctx,60,y,1120,94,'#fff3e4');
    lines(ctx,note,82,y+30,1050,18,3,'#8a5c32');
    y+=104;
   }
  }
 }
 const typeColors={lift:'#6348ae',piste:'#187cc0',transfer:'#6d8492',lunch:'#ef8b2c',free:'#7aaac3',
  return:'#b7584d',buffer:'#118569',break:'#899ca9'};
 function decorate(ctx,type,level){return type==='piste'&&['red','blue','black'].includes(level)?
   {red:'#c63638',blue:'#147bc3',black:'#27282c'}[level]:typeColors[type]||COL.blue;}
 function drawLegend(ctx,y){
  const labels=[['lift','LIFT'],['piste','PISTE'],['transfer','OVERSTAP'],['lunch','LUNCH'],['return','TERUG'],['buffer','MARGE']];
  let x=68;for(const [kind,name] of labels){
   box(ctx,x,y,18,18,decorate(ctx,kind));label(ctx,name,x+26,y+17,18,COL.navy,true);
   x+=name==='OVERSTAP'?196:158;
  }
 }
 function detailPage(ctx,items,which,total){
  label(ctx,'PISTE-, LIFT- EN TIJDSCHEMA',62,290,35,COL.navy,true);
  label(ctx,'Blad '+which+'/'+total+' · Controleer tijdens het skiën je verwachte doorkomsttijd.',62,329,20,COL.gray);
  drawLegend(ctx,354);
  let y=394;
  for(const s of items){
   const h=118;
   box(ctx,58,y,1120,h,'#ffffff');
   box(ctx,58,y,10,h,decorate(ctx,s.type,s.level));
   label(ctx,s.start+' – '+s.end,85,y+42,25,COL.navy,true);
   label(ctx,s.minutes+' min  ·  '+(s.phase||'planning'),85,y+74,15,COL.gray);
   let title=String(s.label||'');
   let font=23;do{ctx.font='700 '+font+'px system-ui,sans-serif';if(ctx.measureText(title).width<730||font===17)break;font--;}while(true);
   label(ctx,title,403,y+40,font,COL.ink,true);
   lines(ctx,s.detail||'',403,y+70,722,16,2,COL.gray);
   y+=129;
  }
 }
 function wcPage(ctx,items,route,data){
  label(ctx,'WC-LOCATIES & AANDACHTSPUNTEN',62,291,34,COL.navy,true);
  label(ctx,'Alle toiletten optioneel; controleer toegankelijkheid en omweg.',62,335,20,COL.gray);
  let y=366;
  for(const p of items){
   box(ctx,58,y,1120,185,'#ebf7f8');box(ctx,58,y,10,185,COL.green);
   label(ctx,'WC · '+p.title,85,y+39,24,COL.navy,true);
   lines(ctx,p.location,85,y+73,1050,19,2,COL.ink);
   lines(ctx,(p.estimatedNearTime?'Mogelijk rond '+p.estimatedNearTime+' · ':'')+'Status: '+p.status+'  ·  +'+p.extraTimeMinutes+' min (niet ingepland)',85,y+122,1050,17,2,COL.gray);
   lines(ctx,'Bron: '+p.source,85,y+157,1060,14,2,COL.gray);
   y+=202;
  }
  if(!items.length)lines(ctx,'Geen officieel onderbouwde WC-plek langs deze gebiedsroute gevonden. Vraag bij liftstations of restaurants.',68,y+50,1070,21,3,COL.ink);
 }
 function distanceText(itinerary,type){
   const data=window.SKIRouteDetail?.routeDistances?.(itinerary);
   if(!data)return 'Niet bekend';
   const km=type==='piste'?data.pisteKm:data.liftKm;
   const complete=type==='piste'?data.pisteComplete:data.liftComplete;
   return complete?km.toFixed(2)+' km':km>0?'Minimaal '+km.toFixed(2)+' km (onvolledig)':'Niet bekend';
  }
  function summaryPage(ctx,data){
  const {plan,route,itinerary}=data;
  label(ctx,'ROUTEVERSLAG & CONTROLE',62,293,36,COL.navy,true);
  label(ctx,'Vertrek: '+plan.startPoint,62,340,23,COL.ink,true);
  label(ctx,'Eindpunt: '+plan.endPoint,62,374,23,COL.ink,true);
  label(ctx,'Datum: '+(plan.date||'-')+'    '+plan.departure+' - '+plan.returnTime,62,408,22,COL.blue,true);
  const cards=[
   ['VOORGESTELDE REISTIJD',(itinerary?.routeMinutes||0)+' minuten'],
    ['PISTEKILOMETERS',distanceText(itinerary,'piste')],
    ['LIFTKILOMETERS',distanceText(itinerary,'lift')],
   ['IN LIFTEN (GESCHAT)',(itinerary?.liftMinutes||0)+' minuten'],
   ['OP PISTES (GESCHAT)',(itinerary?.pisteMinutes||0)+' minuten'],
   ['LUNCH',plan.useLunch?plan.lunchMinutes+' minuten':'Niet ingepland'],
   ['STREEFAANKOMST',plan.safeArrival],
   ['LUNCHLOCATIE',plan.lunchRestaurant||'Eigen keuze']
  ];
  let y=455;
  for(const [name,value] of cards){
   box(ctx,64,y,1110,70,'#e9f5fc');
   label(ctx,name,82,y+28,18,COL.gray,true);
   label(ctx,String(value).slice(0,62),447,y+44,22,COL.navy,true);
   y+=80;
  }
  y+=22;
  label(ctx,'WERKELIJKE SITUATIE CONTROLEREN',62,y,27,COL.navy,true);y+=37;
  const tips=[
   'Liftwachttijden, actuele afsluitingen, weer en pistecondities kunnen afwijken.',
   'Terugweg eerst op tijd starten. GPS is op de panoramakaart niet exact.',
   'Kleurcode: liften paars; pistes blauw (tenzij moeilijkheid bekend is).',
   'Ski-je berekent voorlopig gebiedsverbindingen, geen gegarandeerde GPS-afslagroute.',
   '© SkiWelt voor officiële verbindingsinformatie; gebruik op eigen risico.'
  ];
  for(const item of tips){lines(ctx,'• '+item,66,y,1080,18,2,COL.ink);y+=70;}
 }
 function reportPages(data){
  const events=data.itinerary?.steps||[],wc=data.itinerary?.pois||[];
  const pages=[{kind:'schedule'}];
  for(let i=0;i<events.length;i+=9)pages.push({kind:'detail',rows:events.slice(i,i+9)});
  // Keep area source and closure notes. Existing pagination handles longer notices.
  const regions=layoutPages(data.route?.steps||[],[...(data.route?.notes||[]),...(data.plan?.notes||[]),...(data.itinerary?.warnings||[])]);
  pages.push(...regions.slice(1));
  for(let i=0;i<wc.length;i+=5)pages.push({kind:'wc',rows:wc.slice(i,i+5)});
  pages.push({kind:'summary'});
  return pages;
 }
 async function generate(data){
  const {plan,route}=data||{};
  if(!plan?.ok)throw Error('Maak eerst een geldige dagplanning');
  if(typeof document==='undefined')throw Error('PDF vereist een browser');
  const [logo,watermark]=await Promise.all([loadLogo(),loadWatermark(plan.date)]);
  const pages=reportPages(data),jpegs=[];
  const detailTotal=pages.filter(p=>p.kind==='detail').length;
  let detailIndex=0;
  for(let page=0;page<pages.length;page++){
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Geen canvas');
   pageStart(ctx,logo,page+1,pages.length,watermark);
   const section=pages[page];
   if(section.kind==='schedule')schedule(ctx,plan);
   else if(section.kind==='detail')detailPage(ctx,section.rows,++detailIndex,detailTotal);
   else if(section.kind==='regions')regionPage(ctx,section.legs,section.notes,false);
   else if(section.kind==='notes')regionPage(ctx,[],section.notes,true);
   else if(section.kind==='wc')wcPage(ctx,section.rows,route,data);
   else if(section.kind==='summary')summaryPage(ctx,data);
   jpegs.push(jpegBytes(canvas.toDataURL('image/jpeg',0.88)));
   canvas.width=1;canvas.height=1;
  }
  return new Blob([encodePdf(jpegs)],{type:'application/pdf'});
 }
 function save(blob,name='SKI-je-ski-dagplanning.pdf'){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),45000);
 }
 return {generate,save,encodePdf,layoutPages,reportPages};
});