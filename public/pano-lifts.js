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
 // Printed BLACK numbers in WHITE boxes, not red piste markers. Validated by
 // comparing PDF vector text centres to official 2026/27 JPG (3537x2445).
 // These coordinates locate the printed labels only, NEVER GPS/lift stations.
 const printedPositions=[
  {number:'23',x:.58060,y:.61025,type:'4-persoons stoeltjeslift',length:916,rise:319},
  {number:'22',x:.60433,y:.61557,type:'8-persoons gondel',length:1775,rise:651}
 ];
 const officialImageSize={width:3537,height:2445};
 const printedZoomThreshold=3.3;

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
  areaInfo.textContent=labelled
   ? 'Hopfgarten · '+labelled.type+' · '+labelled.length+' m lengte · '+labelled.rise+' hoogtemeters. De markering ligt op het gedrukte nummer, niet bij een GPS-liftstation.'
   : 'Skigebied: '+lift.area+'. De markering op de illustratie is indicatief.';
  const connection=connections[lift.number];
  linked.textContent=connection?'Gebiedsverbinding: '+connection.to+'. '+connection.details:'Verbindingen met andere gebieden: nog niet voor deze lift geverifieerd.';
  pistes.textContent=connection?'Genoemde pistes: '+connection.pistes.join(', ')+'. Aansluitende liften: '+connection.via+'.':'Aansluitende pistes: nog niet voor deze lift geverifieerd.';
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
 function fillOptions(areaKey){
  const list=areaKey?lifts.filter(l=>l.areaKey===areaKey):lifts;
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
 // A small transparent outline surrounds ONLY the proven printed lift labels.
 // They are separate from the approximate area-group pins above.
 const printed=printedPositions.map(anchor=>{
  const lift=lifts.find(item=>item.number===anchor.number);
  if(!lift)throw Error('Officieel liftnummer ontbreekt in SKI-je: '+anchor.number);
  const b=document.createElement('button');b.type='button';
  b.className='pano-printed-lift';b.dataset.liftNumber=lift.number;
  b.title='Lift '+lift.number+' · '+lift.name;
  b.setAttribute('aria-label','Info gedrukte lift '+lift.number+' · '+lift.name);
  b.addEventListener('pointerdown',event=>event.stopPropagation());
  b.addEventListener('pointerup',event=>event.stopPropagation());
  b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openPrinted(anchor);});
  b.hidden=true;layer.append(b);
  return {...anchor,b,lift};
 });
 function openPrinted(anchor){
  if(!anchor)return;
  const lift=lifts.find(item=>item.number===anchor.number);
  if(!lift)return;
  search.value='';fillOptions(lift.areaKey);setLift(lift,true);
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
  const exactRevision=official&&!fallback&&iw===officialImageSize.width&&ih===officialImageSize.height;
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
 // Tapping a printed number also works when "Liften weergeven" is OFF.
 // This transparent hit-test never matches red piste numbers: it only checks
 // the PDF-verified coordinates for WHITE lift-number boxes 22 and 23.
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
  if(hit?.distance<=Math.min(48,Math.max(26,g.zoom*2.8)))openPrinted(hit.anchor);
 });
 for(const name of ['pointercancel','lostpointercapture'])view.addEventListener(name,event=>starts.delete(event.pointerId));
 function update(){
  layer.hidden=!toggle.checked;
  count.textContent=toggle.checked?lifts.length+' liften in '+areas.length+' gebiedsgroepen':'Liftmarkeringen verborgen';
  if(!toggle.checked)info.hidden=true;
  if(toggle.checked)requestAnimationFrame(position);
 }
 toggle.addEventListener('change',update);
 img.addEventListener('load',position);
 new MutationObserver(position).observe(img,{attributes:true,attributeFilter:['style','src']});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(position).observe(view);
 $('pano-open')?.addEventListener('click',()=>requestAnimationFrame(position));
 document.addEventListener('skije-photo-list-updated',()=>{if(!info.hidden&&select.value)setLift(lifts.find(l=>l.number===select.value));});
 fillOptions(null);update();
 window.SKILiftMap={lifts:()=>lifts.map(l=>({...l})),printedLabels:()=>printedPositions.map(p=>({...p})),precision:'area-only;printed-label-22-23-only'};
})();