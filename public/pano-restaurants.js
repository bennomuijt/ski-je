/* SKI-je: selectable individual numbered huts/restaurants on an artistic panorama.
 * No fake GPS positions; markers are approximate area clusters, individual huts
 * accessible as dedicated buttons and through a search field. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const layer=$('pano-huts'),view=$('pano-viewport'),img=$('pano-img'),data=window.SKIHutCatalogue;
 if(!layer||!view||!img||!data)return;
 const anchors=[
  {area:'going',x:.27,y:.38},{area:'ellmau',x:.27,y:.45},
  {area:'scheffau',x:.22,y:.55},{area:'soll',x:.35,y:.72},
  {area:'itter',x:.46,y:.86},{area:'hopfgarten',x:.54,y:.72},
  {area:'brixen',x:.67,y:.65},{area:'westendorf',x:.79,y:.67}
 ];
 const huts=data.huts;
 const printedData=window.SKIPrintedHutLabels;
 const printedPositions=(printedData?.labels||[]).map(([number,x,y])=>({number,x,y}));
 const officialImageSize=printedData?.image;
 const printedZoomThreshold=3.3;
 let verifiedImage=false,imageProofSerial=0;
 const normalize=s=>String(s||'').toLocaleLowerCase('nl-NL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
 const photos={
  'Kaiserlounge':{
    src:'https://sgm.skiwelt.at/media/facility/kaiser-loung-sun-downerfotogretter-014-1-retusche.webp',
    credit:'Binnenfoto: SkiWelt / Kaiserlounge',
    page:'https://www.skiwelt.at/de/info/kaiserlounge-ellmau-essen-einkehren-apres-ski-skiwelt/'
  },
  'Tanzbodenalm':{
    src:'https://tourism.skiwelt.at/media/event/detail/tanzbodenalm-soell-sommer-hr-013-1.jpg',
    credit:'Binnenfoto (zomer): SkiWelt / Tanzbodenalm',
    page:'https://www.skiwelt.at/nl/scheffau/events/live-muziek-in-de-tanzbodenalm.html'
  },
  'Jochstubn':{
    src:'https://www.kitzbueheler-alpen.com/feratel/info/large/ellmau-alpengasthof-jochstubn-innen-2.jpg',
    credit:'Binnenfoto: Kitzbüheler Alpen / Jochstubn',
    page:'https://www.kitzbueheler-alpen.com/de/bri/infra/a-z/bergrestaurant-jochstubn.html'
  },
  'Stöcklalm':{
    src:'https://sgm.skiwelt.at/media/facility/stoecklalm-innen-soell-6.webp',
    credit:'Binnenfoto: SkiWelt / Stöcklalm',
    page:'https://www.skiwelt.at/en/info/gasthof-stoecklalm-soell/'
  },
  'KRAFTalm':{
    src:'https://www.kitzbueheler-alpen.com/feratel/info/large/itter-kraftalm-itterkraftalmhohe-salvedefrancescophootographe.jpg',
    credit:'Binnenfoto: Kitzbüheler Alpen / KRAFTalm',
    page:'https://www.kitzbueheler-alpen.com/da/hosa/infra/a-z/kraftalm.html'
  },
  'Gipfelalm Hohe Salve':{
    src:'https://www.kitzbueheler-alpen.com/feratel/info/large/westendorf-gipfelrestaurant-hohe-salve-innen2.jpg',
    credit:'Binnenfoto: Kitzbüheler Alpen / accommodatieinformatie',
    page:'https://www.kitzbueheler-alpen.com/de/bri/infra/a-z/gipfelrestaurant-hohe-salve.html'
  }
 };
 const pages={
   'Bergrestaurant Brandstadl':'https://www.bergrestaurant-brandstadl.at/Bergrestaurant-Brandstadl-Impressionen_pid%2C65543%2Ctype%2Cgalerie.html',
   'Gipfelalm Hohe Salve':'https://www.skiwelt.at/nl/soell/info/gipfelrestaurant-hohe-salve.html'
 };

 const toggle=$('pano-restaurants-visible'),count=$('pano-restaurant-count');
 const select=$('pano-hut-select'),search=$('pano-hut-search'),buttons=$('pano-hut-buttons');
 const photo=$('pano-hut-photo'),photoStatus=$('pano-hut-photo-status'),link=$('pano-hut-link');
 const info=$('pano-hut-info'),areaInfo=$('pano-hut-area'),locationInfo=$('pano-hut-location');
 function findPhoto(name){
  if(photos[name])return photos[name];
  const aliases={'Bergrestaurant Jochstubn':'Jochstubn','Gasthof Gründlalm':'Gründlalm',
    'Berggasthaus Holzalm':'Holzalm','Berggasthaus Brechhornhaus':'Brechhornhaus'};
  return photos[aliases[name]]||null;
 }
 function showRestaurant(hut,fromPrinted=false){
  if(!hut)return;
  select.value=hut.id;
  $('pano-hut-name').textContent=(hut.number?'Hut '+hut.number+' · ':'')+hut.name;
  areaInfo.textContent='Skigebied: '+(anchors.find(a=>a.area===hut.areaKey)?.area||hut.areaKey)+'.';
  locationInfo.textContent=fromPrinted
   ? 'Groen hutnummer '+hut.number+' op de SkiWelt-panoramakaart. Dit is de positie van het gedrukte symbool, geen GPS-locatie.'
   : hut.number?'Officieel kaartnummer: '+hut.number+'. Exacte locatie op de panoramatekening niet via de zoeklijst vastgesteld.'
   : 'Naam uit de bestaande SKI-je-lijst; officieel kaartnummer nog niet bevestigd.';
  if(hut.number==='54')locationInfo.textContent+=' Naam volgens officiële SkiWelt-informatiebrochure 2026; controleer actuele openingstijden.';
  if(hut.number==='37')locationInfo.textContent+=' Naam volgens SkiWelt-gegevens 2026/27; controleer actuele openingstijden.';
  if(hut.number==='32')locationInfo.textContent+=' SkiWelt-bronnen noemen bij 32 zowel Salvenmoos als Marchental Skihütte.';
  const approved=window.SKIPublicPhotos?.getFor?.('restaurant',hut.name);
  const picture=approved?{src:approved.image,credit:'Goedgekeurde SKI-je foto'+(approved.gpsVerified?' · GPS gecontroleerd':''),page:data.source}:findPhoto(hut.name);
  photo.removeAttribute('src');
  if(picture?.src){photo.hidden=false;photo.src=picture.src;photo.alt='Restaurantfoto van '+hut.name;photoStatus.textContent=picture.credit;}
  else{photo.hidden=true;photoStatus.textContent='Nog geen gecontroleerde binnenfoto beschikbaar. Bekijk foto’s bij de bron.';}
  link.href=pages[hut.name]||picture?.page||data.source;
  link.textContent=pages[hut.name]||picture?.page?'Restaurantinformatie bij bron':'Bekijk hut op officiële SkiWelt-kaart';
  info.hidden=false;
  for(const b of buttons.querySelectorAll('button[data-hut-id]'))b.setAttribute('aria-pressed',String(b.dataset.hutId===hut.id));
 }
 function fillOptions(list){
  select.replaceChildren();buttons.replaceChildren();
  for(const hut of list){
   const title=(hut.number?hut.number+' · ':'')+hut.name;
   const opt=document.createElement('option');opt.value=hut.id;opt.textContent=title;select.append(opt);
   const b=document.createElement('button');b.type='button';b.className='pano-target-button';
   b.dataset.hutId=hut.id;b.textContent=title;b.setAttribute('aria-pressed','false');
   b.setAttribute('aria-label','Restaurant of hut '+title+' in '+hut.areaKey);
   b.addEventListener('click',()=>showRestaurant(hut));buttons.append(b);
  }
  return list;
 }
 photo?.addEventListener('error',()=>{
  photo.hidden=true;photoStatus.textContent='Foto momenteel niet beschikbaar. Bekijk de restaurantinformatie bij bron.';
 });
 select.addEventListener('change',()=>showRestaurant(huts.find(h=>h.id===select.value)));
 search.addEventListener('input',()=>{
  const term=normalize(search.value);
  const list=huts.filter(h=>!term||normalize([h.name,h.number||'',h.areaKey].join(' ')).includes(term));
  fillOptions(list);
  if(list.length)showRestaurant(list[0]);
  else{$('pano-hut-name').textContent='Geen restaurant gevonden';photo.hidden=true;photoStatus.textContent='Probeer een andere naam of een ander nummer.';info.hidden=false;}
 });
 $('pano-hut-close')?.addEventListener('click',()=>{info.hidden=true;});
 $('pano-hut-more-sources')?.addEventListener('click',()=>{
  const hut=huts.find(h=>h.id===select.value);
  if(!hut)return;
  document.querySelector('[data-close="pano-modal"]')?.click();
  window.SKIApi?.goPage('more');
  window.SKIPhotoSources?.open(hut.name);
 });
 const points=[];
 for(const anchor of anchors){
  const members=huts.filter(h=>h.areaKey===anchor.area);
  const b=document.createElement('button');b.type='button';b.className='pano-hut';
  b.textContent='🍽 '+members.length;b.title=members.map(x=>x.name).join(', ');
  b.setAttribute('aria-label',members.length+' restaurants en hutten rond '+anchor.area+', open individuele locaties');
  b.addEventListener('pointerdown',event=>event.stopPropagation());
  b.addEventListener('pointerup',event=>event.stopPropagation());
  b.addEventListener('click',event=>{
   event.stopPropagation();search.value='';fillOptions(members);
   if(members.length)showRestaurant(members[0]);$('pano-lift-info').hidden=true;
  });
  layer.append(b);points.push({button:b,anchor});
 }
 // White digits inside green huts are distinct from WHITE lift squares and
 // red/blue piste circles. The image hash must match the reviewed 26/27 map.
 const printed=printedPositions.map(anchor=>{
  const matches=huts.filter(h=>h.number===anchor.number);
  if(!matches.length)throw Error('Geen hutgegevens bij groen kaartnummer '+anchor.number);
  const button=document.createElement('button');button.type='button';
  button.className='pano-printed-hut';button.dataset.hutNumber=anchor.number;
  button.title='Hut '+anchor.number+' · '+matches.map(h=>h.name).join(' / ');
  button.setAttribute('aria-label','Open hutnummer '+anchor.number+' · '+matches.map(h=>h.name).join(' of '));
  // The overlay is a visual cue; pointer hit-testing is on the map itself
  // to distinguish adjacent green symbols (e.g. 88, 59, 61) correctly.
  button.addEventListener('click',event=>{event.stopPropagation();openPrintedHut(anchor);});
  button.hidden=true;layer.append(button);
  return {...anchor,button,matches};
 });
 function openPrintedHut(anchor){
  const matches=huts.filter(h=>h.number===anchor?.number);
  if(!matches.length)return;
  search.value='';
  if(matches.length===1){
   fillOptions(huts.filter(h=>h.areaKey===matches[0].areaKey));
   showRestaurant(matches[0],true);
  }else{
   // Two real restaurants share number 56: require a conscious selection.
   fillOptions(matches);
   const opt=document.createElement('option');opt.value='';
   opt.textContent='Kies één van de '+matches.length+' restaurants';
   select.insertBefore(opt,select.firstChild);
   select.value='';
   $('pano-hut-name').textContent='Groen hutnummer '+anchor.number+' · kies een restaurant';
   areaInfo.textContent='Skigebied: '+matches[0].areaKey+'.';
   locationInfo.textContent=printedData?.ambiguous?.[anchor.number]?.description||'Verschillende restaurants gebruiken hetzelfde kaartnummer.';
   photo.hidden=true;photo.removeAttribute('src');
   photoStatus.textContent='Kies eerst een restaurant uit de lijst.';
   link.href=data.source;link.textContent='Horecagelegenheden op de officiële kaart';
   info.hidden=false;
  }
  $('pano-lift-info').hidden=true;
 }
 function geometry(){
  const box=view.getBoundingClientRect(),iw=img.naturalWidth,ih=img.naturalHeight;
  const source=img.currentSrc||img.src;
  const fallback=/Kaart(?:%20| )2026-2027\.png(?:\?|$)/i.test(source);
  const official=/\/api\/skimap\.jpg(?:\?|$)|SkiWelt-Panorama-26-27-NL\.jpg(?:\?|$)/i.test(source);
  const exactRevision=official&&!fallback&&verifiedImage&&
   iw===officialImageSize?.width&&ih===officialImageSize?.height;
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
  const g=geometry(),enabled=toggle.checked&&!g.fallback&&g.iw&&g.ih;
  layer.hidden=!enabled;
  if(!enabled)return;
  for(const {button,anchor} of points){
   const {x,y}=locationFor(anchor,g);
   button.style.left=x+'px';button.style.top=y+'px';
   button.hidden=x<0||x>g.box.width||y<0||y>g.box.height;
  }
  for(const anchor of printed){
   const {x,y}=locationFor(anchor,g);
   anchor.button.style.left=x+'px';anchor.button.style.top=y+'px';
   anchor.button.hidden=!g.exactRevision||g.zoom<printedZoomThreshold||
    x<0||x>g.box.width||y<0||y>g.box.height;
   const size=g.zoom>=9?Math.min(48,Math.round(g.zoom*2.6)):26;
   anchor.button.style.width=anchor.button.style.height=size+'px';
  }
 }
 // Tapping the green printed label works even with optional markers OFF.
 // A strict nearest-centre check avoids accidentally opening another hut.
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
  const distanceTo=anchor=>{
   const p=locationFor(anchor,g);
   return Math.hypot(event.clientX-g.box.left-p.x,event.clientY-g.box.top-p.y);
  };
  const nearest=printed.map(anchor=>({anchor,distance:distanceTo(anchor)}))
   .sort((a,b)=>a.distance-b.distance)[0];
  if(!nearest)return;
  // Give the white lift label its own tap when it is actually closer.
  const liftDist=(window.SKILiftMap?.printedLabels?.()||[])
   .reduce((best,anchor)=>Math.min(best,distanceTo(anchor)),Infinity);
  const radius=Math.min(30,Math.max(17,g.zoom*2.3));
  if(nearest.distance<=radius&&nearest.distance<liftDist){
   event.stopImmediatePropagation();
   openPrintedHut(nearest.anchor);
  }
 });
 for(const name of ['pointercancel','lostpointercapture'])
  view.addEventListener(name,event=>starts.delete(event.pointerId));
 async function verifyMapImage(){
  const ticket=++imageProofSerial,source=img.currentSrc||img.src;
  verifiedImage=false;
  position();
  if(!officialImageSize||!/\/api\/skimap\.jpg(?:\?|$)|SkiWelt-Panorama-26-27-NL\.jpg(?:\?|$)/i.test(source))return;
  if(img.naturalWidth!==officialImageSize.width||img.naturalHeight!==officialImageSize.height)return;
  try{
   if(!crypto?.subtle)throw Error('SHA-256-bewijs niet beschikbaar');
   const response=await fetch(source,{cache:'force-cache'});
   if(!response.ok)throw Error('Kaart kan niet worden geverifieerd');
   const bytes=await response.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes);
   const hex=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
   if(ticket===imageProofSerial)verifiedImage=hex===officialImageSize.sha256;
  }catch{
   if(ticket===imageProofSerial)verifiedImage=false;
  }
  if(ticket!==imageProofSerial)return;
  if(!verifiedImage)count.textContent='Hutten via zoeklijst (kaartafbeelding is gewijzigd)';
  position();
 }
 function update(){
  layer.hidden=!toggle.checked;
  count.textContent=toggle.checked?printedPositions.length+' groene hutnummers · '+huts.length+' in lijst':'Markeringen uit · tik op een groen hutnummer';
  if(!toggle.checked)info.hidden=true;
  if(toggle.checked)requestAnimationFrame(position);
 }
 toggle?.addEventListener('change',update);
 img.addEventListener('load',verifyMapImage);
 new MutationObserver(position).observe(img,{attributes:true,attributeFilter:['style','src']});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(position).observe(view);
 $('pano-open')?.addEventListener('click',()=>requestAnimationFrame(position));
 document.addEventListener('skije-languagechange',position);
 document.addEventListener('skije-photo-list-updated',()=>{if(!info.hidden&&select.value)showRestaurant(huts.find(h=>h.id===select.value));});
 fillOptions(huts);update();
 window.SKIRestaurantMap={getAnchors:()=>anchors.map(a=>({area:a.area,restaurants:huts.filter(h=>h.areaKey===a.area).map(h=>h.name),precision:'area-only'})),
  printedLabels:()=>printedPositions.map(p=>({...p})),getHuts:()=>huts.map(x=>({...x})),precision:'area-only;visually-reviewed-2026-27-green-print-labels'};
})();