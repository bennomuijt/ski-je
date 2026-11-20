/* SKI-je: interactive, clearly approximate restaurant anchors on an illustrative SkiWelt panorama.
   Restaurant names are sourced from the existing app; image positions are NOT GPS coordinates.
   Do not show unverified interior photos or fabricate precise map positions. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const layer=$('pano-huts'),view=$('pano-viewport'),img=$('pano-img');
 if(!layer||!view||!img)return;
 const groups=[
  // Huts are drawn as indicative clusters per area: illustration is NOT georeferenced.
  {area:'going',x:.27,y:.38,restaurants:['Berggasthof Astberg','Blattlalm','Treichlhof','Brenneralm','Aschenwald']},
  {area:'ellmau',x:.27,y:.45,restaurants:['Kaiserlounge','Ellmauer Hex','Rübezahl-Alm','Bergkaiser','Jägerhütte','Kummereralm']},
  {area:'scheffau',x:.22,y:.55,restaurants:['Bergrestaurant Brandstadl','Tanzbodenalm','Jochstubn','Kummereralm','Au Alm','Marchental Skihütte','Neualm','Hochlechen']},
  {area:'soll',x:.35,y:.72,restaurants:['Gipfelalm Hohe Salve','Alpengasthof Hochsöll','Gründlalm','Stöcklalm','Salvenmoos','Bergrestaurant Gründlalm','Keat Alm','Alpengasthof Hochsöll']},
  {area:'itter',x:.46,y:.86,restaurants:['KRAFTalm','Salvistastadl','Alpengasthof Rigi','Stoagrub’n Hütte']},
  {area:'hopfgarten',x:.54,y:.72,restaurants:['Sunnseithütte','Salvenalm','Stoagrub’n Hütte','Alpengasthof Rigi','Salvistastadl']},
  {area:'brixen',x:.67,y:.65,restaurants:['SkiWelt Hütte','Brantlalm','Filzalm','Holzalm','Biwak','Glühbirnstadl','Berggasthof Nieding','Jausenstation Oberkaslach','Brixner Stadl','Jausenstation Frankalm']},
  {area:'westendorf',x:.79,y:.67,restaurants:['Bergrestaurant Talkaser','Panorama Restaurant Choralpe','Sonnalm','Gassnerwirt','Alpenrosenhütte','Brechhornhaus','Fleidingalm']}
 ];
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
 const select=$('pano-hut-select'),photo=$('pano-hut-photo'),photoStatus=$('pano-hut-photo-status'),link=$('pano-hut-link');
 function showRestaurant(name){
   $('pano-hut-name').textContent=name;
   const data=photos[name];
   if(data){
      photo.hidden=false;photo.src=data.src;photo.alt='Binnenfoto van '+name;
      photoStatus.textContent=data.credit;
   }else{
      photo.hidden=true;photo.removeAttribute('src');photoStatus.textContent='Geverifieerde binnenfoto volgt. Geen willekeurige foto getoond.';
   }
   link.href=pages[name]||data?.page||'https://skimap.skiwelt.at/en/';
   link.textContent='Restaurantinformatie bij bron';
 }
 photo?.addEventListener('error',()=>{
   photo.hidden=true;photoStatus.textContent='Binnenfoto is momenteel niet bereikbaar; open de restaurantinformatie.';
 });
 select.addEventListener('change',()=>showRestaurant(select.value));
 const points=[];
 function updateVisibility(){
  const enabled=toggle?.checked===true;
  if(layer)layer.hidden=!enabled;
  count.textContent=enabled?'Restaurantgroepen aan ('+groups.length+' gebieden)':'Markeringen verborgen';
  if(!enabled)$('pano-hut-info').hidden=true;
  if(enabled)requestAnimationFrame(position);
 }
 toggle?.addEventListener('change',updateVisibility);
 for(const area of groups){
  const button=document.createElement('button');button.type='button';button.className='pano-hut';
  button.textContent='🍽';button.title=area.restaurants.join(', ');
  button.setAttribute('aria-label','Hutten in '+area.area+': '+area.restaurants.join(', '));
  button.addEventListener('pointerdown',event=>event.stopPropagation());
  button.addEventListener('pointerup',event=>event.stopPropagation());
  button.addEventListener('click',event=>{
   event.stopPropagation();
   select.replaceChildren();
   for(const name of area.restaurants){const option=document.createElement('option');option.value=name;option.textContent=name;select.append(option);}
   $('pano-hut-info').hidden=false;
   showRestaurant(area.restaurants[0]);
  });
  layer.append(button);points.push({button,area});
 }
 $('pano-hut-close')?.addEventListener('click',()=>{$('pano-hut-info').hidden=true;});
 function position(){
  if($('pano-modal')?.hidden)return;
  const box=view.getBoundingClientRect(),iw=img.naturalWidth,ih=img.naturalHeight;
  const fallback=/Kaart(?:%20| )2026-2027\.png(?:\?|$)/i.test(img.currentSrc||img.src);
  // Legacy cropped artwork has another layout: do not place misleading markers on it.
  layer.hidden=!toggle?.checked||fallback||!iw||!ih;
  if(layer.hidden)return;
  const shape=img.style.transform.match(/translate3d\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*,\s*0(?:px)?\s*\)\s*scale\(\s*([\d.]+)\s*\)/);
  const panX=shape?Number(shape[1]):0,panY=shape?Number(shape[2]):0,zoom=shape?Number(shape[3]):1;
  const renderedWidth=Math.min(box.width,box.height*iw/ih);
  const renderedHeight=Math.min(box.height,box.width*ih/iw);
  for(const {button,area} of points){
   const x=box.width/2+(area.x-.5)*renderedWidth*zoom+panX;
   const y=box.height/2+(area.y-.5)*renderedHeight*zoom+panY;
   button.style.left=x+'px';button.style.top=y+'px';
   button.hidden=x < 0||x>box.width||y<0||y>box.height;
  }
 }
 img.addEventListener('load',position);
 new MutationObserver(position).observe(img,{attributes:true,attributeFilter:['style','src']});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(position).observe(view);
 $('pano-open')?.addEventListener('click',()=>requestAnimationFrame(position));
 document.addEventListener('skije-languagechange',position);
 updateVisibility();
 window.SKIRestaurantMap={getAnchors:()=>groups.map(({area,restaurants})=>({area,restaurants:restaurants.slice(),precision:'area-only'}))};
})();