/* SKI-je: numbered clickable lifts on the drawn (non-georeferenced) panorama.
   Pins are deliberately clustered by AREA, not assigned fake lift coordinates. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const data=window.SKILiftCatalogue;
 const layer=$('pano-lifts'),view=$('pano-viewport'),img=$('pano-img');
 const toggle=$('pano-lifts-visible'),count=$('pano-lift-count');
 const select=$('pano-lift-select'),search=$('pano-lift-search'),info=$('pano-lift-info');
 const name=$('pano-lift-name'),status=$('pano-lift-photo-status'),photo=$('pano-lift-photo'),link=$('pano-lift-link');
 if(!data||!layer||!view||!img||!toggle||!select||!search||!info)return;
 const areas=data.areas, lifts=data.lifts,connections=window.SKILiftConnections?.byNumber||{};
 const buttons=$('pano-lift-buttons'),areaInfo=$('pano-lift-area'),linked=$('pano-lift-connections'),pistes=$('pano-lift-pistes');
 // The positions are independently reviewed printed WHITE lift boxes, never GPS.
 // Red/blue piste numbers are excluded by the 2026/27 vector-text style selection.
 const printedData=window.SKIPrintedLiftLabels;
 if(!printedData?.labels?.length)throw Error('SkiWelt gedrukte liftnummers ontbreken.');
 const verifiedSpecs={
  '22':{type:'8-persoons gondel',length:1775,rise:651},
  '23':{type:'4-persoons stoeltjeslift',length:916,rise:319},
  '26':{type:'10-persoons gondel',length:1900,rise:420}
 };
 const printedPositions=printedData.labels.map(([number,x,y])=>({number,x,y,...verifiedSpecs[number]}));
 const printedConflicts=printedData.conflicts||{};
 const officialImageSize=printedData.image;
 const printedZoomThreshold=3.3;
 let verifiedImage=false,imageProofSerial=0;

 const norm=s=>String(s||'').toLocaleLowerCase('nl-NL').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const srcMap={
  'Hartkaiserbahn':'Hartkaiserbahn','Brandstadlbahn I':'Brandstadlbahn I',
  'Brandstadlbahn II':'Brandstadlbahn II','Salvistabahn':'Salvistabahn Itter',
  'Salvenbahn I':'Salvenbahn I','Salvenbahn II':'Salvenbahn II',
  'Choralmbahn':'Choralmbahn','SkiWeltbahn':'SkiWeltbahn Brixen',
  'Alpenrosenbahn':'Alpenrosenbahn','Hohe Salve':'Hohe Salve Gondelbahn Söll'
 };
 function sourceSearch(lift){
  const text=lift.name.toLocaleLowerCase('nl-NL');
  if(text.includes('hartkaiser'))return srcMap.Hartkaiserbahn;
  if(text.includes('brandstadl')&&text.includes('ii'))return srcMap['Brandstadlbahn II'];
  if(text.includes('brandstadl')&&text.includes(' i'))return srcMap['Brandstadlbahn I'];
  if(text.includes('salvista'))return srcMap.Salvistabahn;
  if(text.includes('salvenbahn ii'))return srcMap['Salvenbahn II'];
  if(text.includes('salvenbahn i'))return srcMap['Salvenbahn I'];
  if(text.includes('choralm'))return srcMap.Choralmbahn;
  if(text.includes('skiweltbahn'))return srcMap.SkiWeltbahn;
  if(text.includes('alpenrosen'))return srcMap.Alpenrosenbahn;
  if(text.includes('hohe salve'))return srcMap['Hohe Salve'];
  return lift.name;
 }
 function setLift(lift,printedLabel=false){
  if(!lift)return;
  select.value=lift.number;
  name.textContent='Lift '+lift.number+' · '+lift.name;
  const labelled=printedLabel?printedPositions.find(p=>p.number===lift.number):null;
  const spec=verifiedSpecs[lift.number]||(lift.number==='40'?verifiedSpecs['26']:null);
  const parts=['Skigebied: '+lift.area];
  if(labelled&&spec){
   parts.push(spec.type+' · '+spec.length+' m lengte · '+spec.rise+' hoogtemeters');
  }else if(lift.number==='26'&&spec){
   parts.push(spec.type+' · '+spec.length+' m lengte · '+spec.rise+' hoogtemeters');
  }
  if(labelled)parts.push('Dit is een gedrukt kaartlabel, geen GPS-liftstation.');
  else parts.push('Gebiedsmarkeringen zijn indicatief, niet exact.');
  areaInfo.textContent=parts.join(' · ');
  const connection=connections[lift.number];
  const conflict=printedLabel?printedConflicts[lift.number]:null;
  linked.textContent=conflict?conflict.reason:
   connection?'Gebiedsverbinding: '+connection.to+'. '+connection.details:'Bekijk de actuele liftinformatie bij SkiWelt.';
  pistes.textContent=connection?'Genoemde pistes: '+connection.pistes.join(', ')+'. Aansluitende liften: '+connection.via+'.':conflict?'De nummering verschilt tussen officiële bronnen. Gebruik de naam op de borden.':'';
  const approved=window.SKIPublicPhotos?.getFor?.('lift',lift.name);
  photo.hidden=!approved;
  photo.removeAttribute('src');
  if(approved?.image){photo.src=approved.image;photo.alt='Goedgekeurde foto van '+lift.name;}
  status.textContent=approved?'Goedgekeurde SKI-je liftfoto'+(approved.gpsVerified?' · GPS gecontroleerd':''):'Nog geen goedgekeurde liftfoto. Bekijk fotobronnen op naam.';
  link.href=data.source;
  link.textContent='Officiële liftstatus bekijken';
  info.hidden=false;
  for(const b of buttons.querySelectorAll('button[data-lift-number]'))b.setAttribute('aria-pressed',String(b.dataset.liftNumber===lift.number));
 }
 function fillOptions(areaKey,choices=null){
  const list=choices|| (areaKey?lifts.filter(l=>l.areaKey===areaKey):lifts);
  select.replaceChildren();
  for(const lift of list){
   const opt=document.createElement('option');opt.value=lift.number;opt.textContent=lift.number+' · '+lift.name+' ('+lift.area+')';select.append(opt);
  }
  buttons.replaceChildren();
  for(const lift of list){
   const b=document.createElement('button');b.type='button';b.className='pano-target-button';
   b.dataset.liftNumber=lift.number;b.textContent=lift.number+' · '+lift.name;
   b.setAttribute('aria-label','Lift '+lift.number+' '+lift.name+', '+lift.area);
   b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>setLift(lift));buttons.append(b);
  }
  return list;
 }
 const points=[];
 for(const area of areas){
  const members=lifts.filter(l=>l.areaKey===area.key);
  // Never scatter invented positions per lift: all lift labels are accessible
  // after tapping this AREA marker and in the numbered search menu.
  const b=document.createElement('button');b.type='button';b.className='pano-lift-group';
  b.textContent='🚡 '+members.length;b.title=area.name+' · '+members.length+' liften';
  b.setAttribute('aria-label','Liften rond '+area.name+', '+members.length+' liften; open nummers en namen');
  b.addEventListener('pointerdown',e=>e.stopPropagation());
  b.addEventListener('pointerup',e=>e.stopPropagation());
  b.addEventListener('click',e=>{e.stopPropagation();search.value='';const first=fillOptions(area.key)[0];if(first)setLift(first);$('pano-hut-info').hidden=true;});
  layer.append(b);points.push({b,area});
 }
 // 80 printed labels (78 distinct numbers). Duplicated 80/112 positions both
 // show the same lift. The printed 89 opens a choice between 89a/b/c.
 const printed=printedPositions.map(anchor=>{
  const lift=lifts.find(item=>item.number===anchor.number);
  if(!lift&&anchor.number!=='89')throw Error('Gedrukt liftnummer ontbreekt in catalogus: '+anchor.number);
  const b=document.createElement('button');b.type='button';
  b.className='pano-printed-lift';b.dataset.liftNumber=anchor.number;
  b.title=lift?'Lift '+lift.number+' · '+lift.name:'Liften 89a, 89b en 89c kiezen';
  b.setAttribute('aria-label',lift?'Info gedrukte lift '+lift.number+' · '+lift.name:'Kies lift 89a, 89b of 89c');
  b.addEventListener('pointerdown',event=>event.stopPropagation());
  b.addEventListener('pointerup',event=>event.stopPropagation());
  b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openPrinted(anchor);});
  b.hidden=true;layer.append(b);
  return {...anchor,b,lift};
 });
 function openPrinted(anchor){
  if(!anchor)return;
  search.value='';
  if(anchor.number==='89'){
   const choices=(printedConflicts['89']?.choices||[]).map(n=>lifts.find(l=>l.number===n)).filter(Boolean);
   if(!choices.length)return;
   fillOptions(null,choices);
   name.textContent='Kaartnummer 89 · kies de juiste lift';
   areaInfo.textContent='Ellmau · de officiële liftstatus onderscheidt 89a, 89b en 89c.';
   linked.textContent=printedConflicts['89'].reason;
   pistes.textContent='Kies hieronder het gewenste nummer. Dit gedrukte kaartlabel is geen individueel liftstation.';
   photo.hidden=true;photo.removeAttribute('src');
   status.textContent='Kies eerst een van de drie liften.';
   link.href=data.source;link.textContent='Officiële liftstatus bekijken';
   info.hidden=false;
  }else{
   const lift=lifts.find(item=>item.number===anchor.number);
   if(!lift)return;
   fillOptions(lift.areaKey);setLift(lift,true);
  }
  if($('pano-hut-info'))$('pano-hut-info').hidden=true;
 }
 function searchLifts(){
  const needle=norm(search.value.trim());
  const matches=lifts.filter(l=>!needle||norm(l.number+' '+l.name+' '+l.area).includes(needle));
  fillOptions(null);
  if(needle){
   select.replaceChildren();
   buttons.replaceChildren();
   for(const lift of matches){const option=document.createElement('option');option.value=lift.number;option.textContent=lift.number+' · '+lift.name+' ('+lift.area+')';select.append(option);
    const b=document.createElement('button');b.type='button';b.className='pano-target-button';b.dataset.liftNumber=lift.number;
    b.textContent=lift.number+' · '+lift.name;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>setLift(lift));buttons.append(b);
   }
  }
  if(matches[0])setLift(matches[0]);
  else {name.textContent='Geen lift gevonden';info.hidden=false;status.textContent='Probeer een ander liftnummer of deel van de naam.';photo.hidden=true;linked.textContent='';pistes.textContent='';}
 }
 search.addEventListener('input',searchLifts);
 select.addEventListener('change',()=>setLift(lifts.find(l=>l.number===select.value)));
 photo?.addEventListener('error',()=>{photo.hidden=true;status.textContent='De foto is niet beschikbaar. Bekijk fotobronnen.';});
 $('pano-lift-close')?.addEventListener('click',()=>{info.hidden=true;});
 $('pano-lift-more-sources')?.addEventListener('click',()=>{
  const lift=lifts.find(l=>l.number===select.value);
  if(!lift)return;
  document.querySelector('[data-close="pano-modal"]')?.click();
  window.SKIApi?.goPage('more');
  window.SKIPhotoSources?.open(sourceSearch(lift));
 });
 function geometry(){
  const box=view.getBoundingClientRect(),iw=img.naturalWidth,ih=img.naturalHeight;
  const fallback=/Kaart(?:%20| )2026-2027\.png(?:\?|$)/i.test(img.currentSrc||img.src);
  const source=img.currentSrc||img.src;
  const official=/\/api\/skimap\.jpg(?:\?|$)|SkiWelt-Panorama-26-27-NL\.jpg(?:\?|$)/i.test(source);
  const exactRevision=official&&!fallback&&verifiedImage&&iw===officialImageSize.width&&ih===officialImageSize.height;
  const shape=img.style.transform.match(/translate3d\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*,\s*0(?:px)?\s*\)\s*scale\(\s*([\d.]+)\s*\)/);
  const panX=shape?Number(shape[1]):0,panY=shape?Number(shape[2]):0,zoom=shape?Number(shape[3]):1;
  const renderedWidth=iw&&ih?Math.min(box.width,box.height*iw/ih):0;
  const renderedHeight=iw&&ih?Math.min(box.height,box.width*ih/iw):0;
  return {box,iw,ih,fallback,exactRevision,panX,panY,zoom,renderedWidth,renderedHeight};
 }
 function locationFor(anchor,g){
  return {
   x:g.box.width/2+(anchor.x-.5)*g.renderedWidth*g.zoom+g.panX,
   y:g.box.height/2+(anchor.y-.5)*g.renderedHeight*g.zoom+g.panY
  };
 }
 function position(){
  if($('pano-modal')?.hidden)return;
  const g=geometry();
  const enabled=toggle.checked&&!g.fallback&&g.iw&&g.ih;
  layer.hidden=!enabled;
  if(!enabled)return;
  for(const {b,area} of points){
   const {x,y}=locationFor(area,g);
   b.style.left=x+'px';b.style.top=y+'px';
   b.hidden=x<0||x>g.box.width||y<0||y>g.box.height;
  }
  for(const anchor of printed){
   const {x,y}=locationFor(anchor,g);
   anchor.b.style.left=x+'px';anchor.b.style.top=y+'px';
   anchor.b.hidden=!g.exactRevision||g.zoom<printedZoomThreshold||x<0||x>g.box.width||y<0||y>g.box.height;
   anchor.b.style.width=anchor.b.style.height=g.zoom>=9?'62px':'48px';
  }
 }
 // Tapping a printed WHITE lift number works even when markers are hidden.
 // Never perform number-only matching across red/blue pistes or huts.
 const starts=new Map();
 view.addEventListener('pointerdown',event=>{
  if(event.target!==view)return;
  starts.set(event.pointerId,{x:event.clientX,y:event.clientY,moved:false});
  if(starts.size>1)for(const s of starts.values())s.moved=true;
 });
 view.addEventListener('pointermove',event=>{
  const s=starts.get(event.pointerId);
  if(s&&Math.hypot(event.clientX-s.x,event.clientY-s.y)>11)s.moved=true;
 });
 view.addEventListener('pointerup',event=>{
  const s=starts.get(event.pointerId);starts.delete(event.pointerId);
  if(!s||s.moved||starts.size||$('pano-modal')?.hidden)return;
  const g=geometry();if(!g.exactRevision||g.zoom<printedZoomThreshold)return;
  const hit=printed.map(anchor=>{
   const position=locationFor(anchor,g),dx=event.clientX-(g.box.left+position.x),dy=event.clientY-(g.box.top+position.y);
   return {anchor,distance:Math.hypot(dx,dy)};
  }).sort((a,b)=>a.distance-b.distance)[0];
  if(hit?.distance<=Math.min(35,Math.max(20,g.zoom*2.8)))openPrinted(hit.anchor);
 });
 for(const name of ['pointercancel','lostpointercapture'])view.addEventListener(name,event=>starts.delete(event.pointerId));
 function update(){
  layer.hidden=!toggle.checked;
  count.textContent=toggle.checked?printedPositions.length+' kaartlabels · '+lifts.length+' liften in lijst':'Markeringen uit · tik op een wit liftnummer';
  if(!toggle.checked)info.hidden=true;
  if(toggle.checked)requestAnimationFrame(position);
 }
 // Never place labels on a replaced or re-rendered panorama just because the
 // dimensions match. Check the original official image bytes once per load.
 async function verifyMapImage(){
  const ticket=++imageProofSerial,source=img.currentSrc||img.src;
  verifiedImage=false;
  position();
  if(!/\/api\/skimap\.jpg(?:\?|$)|SkiWelt-Panorama-26-27-NL\.jpg(?:\?|$)/i.test(source))return;
  if(img.naturalWidth!==officialImageSize.width||img.naturalHeight!==officialImageSize.height)return;
  try{
   if(!crypto?.subtle)throw Error('Geen SHA-256 browsercontrole');
   const response=await fetch(source,{cache:'force-cache'});
   if(!response.ok)throw Error('Kaart niet opnieuw bereikbaar');
   const buffer=await response.arrayBuffer();
   const digest=await crypto.subtle.digest('SHA-256',buffer);
   const hash=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
   if(ticket===imageProofSerial)verifiedImage=hash===officialImageSize.sha256;
  }catch{
   if(ticket===imageProofSerial)verifiedImage=false;
  }
  if(ticket!==imageProofSerial)return;
  if(!verifiedImage)count.textContent='Witte liftnummers via zoeklijst (kaartafbeelding wijkt af)';
  position();
 }
 toggle.addEventListener('change',update);
 img.addEventListener('load',verifyMapImage);
 new MutationObserver(position).observe(img,{attributes:true,attributeFilter:['style','src']});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(position).observe(view);
 $('pano-open')?.addEventListener('click',()=>requestAnimationFrame(position));
 document.addEventListener('skije-photo-list-updated',()=>{if(!info.hidden&&select.value)setLift(lifts.find(l=>l.number===select.value));});
 fillOptions(null);update();
 window.SKILiftMap={lifts:()=>lifts.map(l=>({...l})),printedLabels:()=>printedPositions.map(p=>({...p})),precision:'area-only;visually-checked-2026-27-print-labels'};
})();