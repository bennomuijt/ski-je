/* SKI-je: interactive, clearly approximate restaurant anchors on an illustrative SkiWelt panorama.
   Restaurant names are sourced from the existing app; image positions are NOT GPS coordinates.
   Do not show unverified interior photos or fabricate precise map positions. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const layer=$('pano-huts'),view=$('pano-viewport'),img=$('pano-img');
 if(!layer||!view||!img)return;
 const groups=[
  {area:'going',x:.27,y:.38,restaurants:['Berggasthof Astberg']},
  {area:'ellmau',x:.27,y:.45,restaurants:['Kaiserlounge']},
  {area:'scheffau',x:.22,y:.55,restaurants:['Bergrestaurant Brandstadl','Tanzbodenalm','Jochstubn','Kummereralm','Au Alm']},
  {area:'soll',x:.35,y:.72,restaurants:['Gipfelalm Hohe Salve','Alpengasthof Hochsöll','Gründlalm','Stöcklalm']},
  {area:'itter',x:.46,y:.86,restaurants:['KRAFTalm']},
  {area:'westendorf',x:.79,y:.67,restaurants:['Bergrestaurant Talkaser','Panorama Restaurant Choralpe']}
 ];
 const points=[];
 for(const area of groups){
  const button=document.createElement('button');button.type='button';button.className='pano-hut';
  button.textContent='🍽';button.title=area.restaurants.join(', ');
  button.setAttribute('aria-label','Hutten in '+area.area+': '+area.restaurants.join(', '));
  button.addEventListener('pointerdown',event=>event.stopPropagation());
  button.addEventListener('pointerup',event=>event.stopPropagation());
  button.addEventListener('click',event=>{
   event.stopPropagation();
   $('pano-hut-name').textContent=area.restaurants.join(' · ');
   $('pano-hut-photo-status').textContent='Gebied indicatief gemarkeerd; een geverifieerde binnenfoto is nog niet beschikbaar.';
   const link=$('pano-hut-link');
   link.href='https://www.skiwelt.at/nl/';
   link.textContent='Officiële SkiWelt-website';
   $('pano-hut-info').hidden=false;
  });
  layer.append(button);points.push({button,area});
 }
 $('pano-hut-close')?.addEventListener('click',()=>{$('pano-hut-info').hidden=true;});
 function position(){
  if($('pano-modal')?.hidden)return;
  const box=view.getBoundingClientRect(),iw=img.naturalWidth,ih=img.naturalHeight;
  const fallback=/Kaart(?:%20| )2026-2027\.png(?:\?|$)/i.test(img.currentSrc||img.src);
  // Legacy cropped artwork has another layout: do not place misleading markers on it.
  layer.hidden=fallback||!iw||!ih;
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
 window.SKIRestaurantMap={getAnchors:()=>groups.map(({area,restaurants})=>({area,restaurants:restaurants.slice(),precision:'area-only'}))};
})();