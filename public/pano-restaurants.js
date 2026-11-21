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
 function showRestaurant(hut){
  if(!hut)return;
  select.value=hut.id;
  $('pano-hut-name').textContent=(hut.number?'Hut '+hut.number+' · ':'')+hut.name;
  areaInfo.textContent='Skigebied: '+(anchors.find(a=>a.area===hut.areaKey)?.area||hut.areaKey)+'.';
  locationInfo.textContent=hut.number?'Officieel kaartnummer: '+hut.number+'. Exacte locatie op de panoramatekening nog niet geijkt.':
   'Naam uit de bestaande SKI-je-lijst; officieel kaartnummer nog niet bevestigd.';
  const approved=window.SKIPublicPhotos?.getFor?.('restaurant',hut.name);
  const picture=approved?{src:approved.image,credit:'Goedgekeurde SKI-je foto'+(approved.gpsVerified?' · GPS gecontroleerd':''),page:data.source}:findPhoto(hut.name);
  photo.removeAttribute('src');
  if(picture?.src){photo.hidden=false;photo.src=picture.src;photo.alt='Restaurantfoto van '+hut.name;photoStatus.textContent=picture.credit;}
  else{photo.hidden=true;photoStatus.textContent='Nog geen gecontroleerde binnenfoto beschikbaar. Bekijk foto’s bij de bron.';}
  link.href=pages[hut.name]||picture?.page||data.source;
  link.textContent=pages[hut.name]||picture?.page?'Restaurantinformatie bij bron':'Bekijk hut op officiële SkiWelt-kaart';
  info.hidden=false;
  document.dispatchEvent(new CustomEvent('skije-panorama-selection',{detail:{kind:'restaurant',id:hut.id,name:hut.name,label:hut.name,areaKey:hut.areaKey}}));
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
 function position(){
  if($('pano-modal')?.hidden)return;
  const box=view.getBoundingClientRect(),iw=img.naturalWidth,ih=img.naturalHeight;
  const fallback=/Kaart(?:%20| )2026-2027\.png(?:\?|$)/i.test(img.currentSrc||img.src);
  layer.hidden=!toggle.checked||fallback||!iw||!ih;
  if(layer.hidden)return;
  const shape=img.style.transform.match(/translate3d\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*,\s*0(?:px)?\s*\)\s*scale\(\s*([\d.]+)\s*\)/);
  const panX=shape?Number(shape[1]):0,panY=shape?Number(shape[2]):0,zoom=shape?Number(shape[3]):1;
  const renderedWidth=Math.min(box.width,box.height*iw/ih);
  const renderedHeight=Math.min(box.height,box.width*ih/iw);
  for(const {button,anchor} of points){
   const x=box.width/2+(anchor.x-.5)*renderedWidth*zoom+panX;
   const y=box.height/2+(anchor.y-.5)*renderedHeight*zoom+panY;
   button.style.left=x+'px';button.style.top=y+'px';
   button.hidden=x<0||x>box.width||y<0||y>box.height;
  }
 }
 function update(){
  layer.hidden=!toggle.checked;
  count.textContent=toggle.checked?huts.length+' hutten / restaurants in '+anchors.length+' gebieden':'Restaurantmarkeringen verborgen';
  if(!toggle.checked)info.hidden=true;
  if(toggle.checked)requestAnimationFrame(position);
 }
 toggle?.addEventListener('change',update);
 img.addEventListener('load',position);
 new MutationObserver(position).observe(img,{attributes:true,attributeFilter:['style','src']});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(position).observe(view);
 $('pano-open')?.addEventListener('click',()=>requestAnimationFrame(position));
 document.addEventListener('skije-languagechange',position);
 document.addEventListener('skije-photo-list-updated',()=>{if(!info.hidden&&select.value)showRestaurant(huts.find(h=>h.id===select.value));});
 fillOptions(huts);update();
 window.SKIRestaurantMap={getAnchors:()=>anchors.map(a=>({area:a.area,restaurants:huts.filter(h=>h.areaKey===a.area).map(h=>h.name),precision:'area-only'})),
  getHuts:()=>huts.map(x=>({...x})),openHut:id=>{const hut=huts.find(h=>h.id===String(id));if(!hut)return false;search.value='';fillOptions(huts.filter(h=>h.areaKey===hut.areaKey));showRestaurant(hut);$('pano-lift-info').hidden=true;return true;},precision:'area-only'};
})();