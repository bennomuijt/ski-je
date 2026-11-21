/* SKI-je panorama review: read numbers from the supplied image and position
 * annotations manually. Stored placements are USER-SUPPLIED 2D picture positions,
 * NEVER GPS calibration, official SkiWelt map geometry or route graph evidence.
 * No external images are copied; links to source pages open on request. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id), img=$('pano-img'),view=$('pano-viewport');
 const layer=$('pano-review-pins'),directory=$('pano-review-directory');
 if(!img||!view||!layer||!directory)return;
 const types=$('pano-review-type'),search=$('pano-review-search'),list=$('pano-review-items');
 const tally=$('pano-review-count'),results=$('pano-review-result'),message=$('pano-review-message');
 const place=$('pano-review-place'),remove=$('pano-review-remove');
 const keys={lift:'skije-panorama-lift-number-points-v1',restaurant:'skije-panorama-hut-number-points-v1'};
 const lifts=window.SKILiftCatalogue?.lifts||[],huts=window.SKIHutCatalogue?.huts||[];
 const dataset={lift:lifts.map(l=>({kind:'lift',id:l.number,name:l.name,area:l.area||l.areaKey})),
  restaurant:huts.map(h=>({kind:'restaurant',id:h.id,name:h.name,number:h.number,area:h.areaKey}))};
 const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const clamp=x=>Math.max(0,Math.min(1,x));
 let positions={lift:{},restaurant:{}},selected=null,mode=false;
 for(const kind of ['lift','restaurant']){
  try{const stored=JSON.parse(localStorage.getItem(keys[kind])||'{}');
   if(stored&&typeof stored==='object'&&!Array.isArray(stored)){
    for(const [id,p] of Object.entries(stored)){
     if(dataset[kind].some(e=>e.id===id)&&Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1)
      positions[kind][id]={x:p.x,y:p.y};
    }
   }
  }catch{}
 }
 const item=(kind,id)=>dataset[kind].find(x=>x.id===id);
 function save(kind){
  try{localStorage.setItem(keys[kind],JSON.stringify(positions[kind]));}
  catch{message.textContent='Kan de markering niet blijvend opslaan. Controleer de opslagruimte van je browser.';}
 }
 function bbox(){
  const rect=view.getBoundingClientRect();
  const iw=img.naturalWidth||1,ih=img.naturalHeight||1;
  const w=Math.min(rect.width,rect.height*iw/ih),h=Math.min(rect.height,rect.width*ih/iw);
  const transform=window.SKIPanorama;
  const z=transform?.getZoom?.()||1,pan=transform?.getPan?.()||{x:0,y:0};
  return {rect,w,h,z,pan};
 }
 function toViewport(x,y){
  const {rect,w,h,z,pan}=bbox();
  return {x:rect.width/2+(x-.5)*w*z+pan.x,y:rect.height/2+(y-.5)*h*z+pan.y};
 }
 function fromPointer(clientX,clientY){
  const {rect,w,h,z,pan}=bbox();
  if(!w||!h||!img.naturalWidth)return null;
  const nx=.5+((clientX-rect.left-rect.width/2-pan.x)/(w*z));
  const ny=.5+((clientY-rect.top-rect.height/2-pan.y)/(h*z));
  if(nx<0||nx>1||ny<0||ny>1)return null;
  return {x:Math.round(clamp(nx)*10000)/10000,y:Math.round(clamp(ny)*10000)/10000};
 }
 function show(kind,id){
  if(kind==='lift')return !!window.SKILiftMap?.openLift?.(id);
  return !!window.SKIRestaurantMap?.openHut?.(id);
 }
 function renderPins(){
  layer.replaceChildren();
  if($('pano-modal')?.hidden||!img.naturalWidth)return;
  for(const kind of ['lift','restaurant']){
   const enabled=$(kind==='lift'?'pano-lifts-visible':'pano-restaurants-visible')?.checked;
   if(!enabled)continue;
   for(const [id,p] of Object.entries(positions[kind])){
    const entry=item(kind,id);if(!entry)continue;
    const pos=toViewport(p.x,p.y);
    if(pos.x<0||pos.y<0||pos.x>view.clientWidth||pos.y>view.clientHeight)continue;
    const b=document.createElement('button');b.type='button';
    b.className='pano-reviewed-pin pano-reviewed-'+kind;
    b.style.left=pos.x+'px';b.style.top=pos.y+'px';
    b.textContent=(kind==='lift'?'🚡 ':'🍽️ ')+(kind==='lift'?id:(entry.number||'•'));
    b.title=(kind==='lift'?'Lift ':'Hut ')+(entry.number||id)+' · '+entry.name+' (zelf geplaatst)';
    b.setAttribute('aria-label',b.title);b.dataset.kind=kind;b.dataset.id=id;
    b.addEventListener('pointerdown',e=>e.stopPropagation());
    b.addEventListener('pointerup',e=>e.stopPropagation());
    b.addEventListener('click',e=>{e.stopPropagation();choose(kind,id,true);});
    layer.append(b);
   }
  }
 }
 function choose(kind,id,openInfo=false){
  const entry=item(kind,id);if(!entry)return;
  selected={kind,id};mode=false;
  place.disabled=false;remove.disabled=!positions[kind][id];
  place.textContent='📍 '+(positions[kind][id]?'Marker verplaatsen':'Marker op kaart plaatsen');
  message.textContent=(entry.number?entry.number+' · ':'')+entry.name+
   (positions[kind][id]?' heeft een zelf geplaatste kaartmarker.':' heeft nog geen exacte kaartmarker.');
  if(openInfo)show(kind,id);
  renderList();
 }
 function renderList(){
  const kind=types.value,term=normalize(search.value);
  const matches=dataset[kind].filter(e=>normalize([e.id,e.number,e.name,e.area].join(' ')).includes(term));
  list.replaceChildren();
  for(const entry of matches){
   const b=document.createElement('button');b.type='button';b.className='pano-review-entry';
   b.dataset.kind=kind;b.dataset.id=entry.id;
   const placed=!!positions[kind][entry.id];
   b.textContent=(placed?'📍 ':'')+(entry.number?entry.number+' · ':'')+entry.name+' · '+entry.area;
   b.setAttribute('aria-pressed',String(selected?.kind===kind&&selected?.id===entry.id));
   b.setAttribute('aria-label',(placed?'Zelf geplaatst: ':'')+b.textContent);
   b.addEventListener('click',()=>choose(kind,entry.id,true));
   list.append(b);
  }
  const placed=Object.keys(positions[kind]).length;
  tally.textContent='('+placed+' van '+dataset[kind].length+' geplaatst)';
  results.textContent=matches.length+' gevonden · '+placed+' zelf geplaatste nummers';
 }
 function updateMode(active){
  mode=active;
  directory.classList.toggle('pano-placement-active',mode);
  view.classList.toggle('pano-placement-active',mode);
  if(mode){
   const e=item(selected.kind,selected.id);
   message.textContent='Tik op het zichtbare nummer '+(e.number||e.name)+' op de panoramakaart. Met twee vingers kun je eerst inzoomen; aantikken plaatst één marker.';
   directory.open=false;
  }
 }
 let down=null;
 view.addEventListener('pointerdown',e=>{if(!mode)return;down={x:e.clientX,y:e.clientY,id:e.pointerId};},true);
 view.addEventListener('pointercancel',()=>{down=null;},true);
 view.addEventListener('pointerup',e=>{
  if(!mode||!selected||!down||down.id!==e.pointerId)return;
  const start=down;down=null;
  if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>13)return;
  if(e.target.closest('.pano-reviewed-pin,.pano-hut,.pano-lift-group'))return;
  const coords=fromPointer(e.clientX,e.clientY);
  if(!coords){message.textContent='Tik binnen de kaartafbeelding, niet buiten de rand.';return;}
  positions[selected.kind][selected.id]=coords;save(selected.kind);
  updateMode(false);directory.open=true;renderList();renderPins();
  remove.disabled=false;
  message.textContent='Marker opgeslagen op dit toestel. Het is een plaats op de illustratie, geen geverifieerd GPS-punt.';
 },true);
 place.addEventListener('click',()=>{
  if(!selected)return;
  updateMode(true);
  show(selected.kind,selected.id);
  // Keep existing detail available, but close it for a clear line of sight.
  $('pano-hut-info').hidden=true;$('pano-lift-info').hidden=true;
 });
 remove.addEventListener('click',()=>{
  if(!selected)return;
  delete positions[selected.kind][selected.id];save(selected.kind);
  remove.disabled=true;place.textContent='📍 Marker op kaart plaatsen';renderPins();renderList();
  message.textContent='Zelf geplaatste marker gewist. De oorspronkelijke kaart blijft ongewijzigd.';
 });
 types.addEventListener('change',()=>{selected=null;place.disabled=true;remove.disabled=true;renderList();});
 search.addEventListener('input',renderList);
 img.addEventListener('load',renderPins);
 const observer=new MutationObserver(renderPins);
 observer.observe(img,{attributes:true,attributeFilter:['style','src']});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(renderPins).observe(view);
 window.addEventListener('resize',renderPins,{passive:true});
 $('pano-open')?.addEventListener('click',()=>requestAnimationFrame(renderPins));
 for(const id of ['pano-lifts-visible','pano-restaurants-visible'])$(id)?.addEventListener('change',renderPins);
 directory.addEventListener('toggle',()=>{if(directory.open&&mode)updateMode(false);});
 document.addEventListener('skije-panorama-selection',e=>{
  const {kind,id,name}=e.detail||{};if(!kind||!id)return;
  // External photo pages are opened only by the user's explicit tap.
  updateSourceLinks(kind,name);
 });
 // Original media: show only links, not images with uncertain reuse rights.
 let sourceCache=null,loading=null,seq=0;
 function findSource(kind,name,catalogue){
  const normalizeSource=s=>normalize(s).replace(/\b(10er|8er|6er|4er|gondelbahn|sesselbahn)\b/g,'').trim();
  const target=normalizeSource(name);
  const sources=kind==='lift'?catalogue.lifts:catalogue.restaurants;
  return sources.find(r=>[r.name,...(r.aliases||[])].some(alias=>{
   const a=normalizeSource(alias);
   return a===target||(a.length>=6&&target.includes(a))||(target.length>=6&&a.includes(target));
  }));
 }
 async function updateSourceLinks(kind,name){
  const target=$(kind==='lift'?'pano-lift-source-links':'pano-hut-source-links');
  if(!target)return;
  const request=++seq;target.replaceChildren();
  target.textContent='Fotobronnen controleren…';
  try{
   if(!sourceCache)loading=loading||fetch('./skiwelt-fotobronnen-2026.json',{cache:'force-cache'}).then(r=>{
    if(!r.ok)throw Error('Bronregister niet beschikbaar');return r.json();
   }).then(x=>{sourceCache=x;return x;}).finally(()=>{loading=null;});
   const catalogue=sourceCache||await loading;
   if(request!==seq)return;
   target.replaceChildren();
   const record=findSource(kind,name,catalogue);
   if(!record){target.textContent='Voor dit item nog geen aanvullende foto- of websitebron vastgelegd.';return;}
   const sources=record.sources.filter(s=>typeof s.url==='string'&&s.url.startsWith('https://'));
   const label=document.createElement('strong');label.textContent='Foto’s & officiële bronpagina’s ('+sources.length+')';target.append(label);
   for(const source of sources.slice(0,7)){
    const a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';
    a.textContent=(source.type==='interieur'?'🏠 Binnenfoto • ':source.type==='foto'?'📷 Liftfoto • ':'🔗 ')+source.name;
    a.title=source.details||source.name;target.append(a);
   }
   const small=document.createElement('small');small.textContent='Foto’s staan bij hun eigenaar en worden niet zonder toestemming in SKI-je gekopieerd.';target.append(small);
  }catch{if(request===seq)target.textContent='Fotobronnen tijdelijk niet bereikbaar.';}
 }
 renderList();
 window.SKIPanoramaReview={
  list:()=>({lift:{...positions.lift},restaurant:{...positions.restaurant}}),
  precision:'user-picture-coordinate-only',toViewport,fromPointer
 };
})();