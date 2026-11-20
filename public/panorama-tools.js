/* SKI-je 4.5.2: inspect route areas on the official illustrated map.
 * These are indicative area highlights, NOT a georeferenced GPS route.
 * No network requests, no coordinates, no local-storage changes. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const focus=$('pano-focus'),routeBox=$('pano-route-box'),routeList=$('pano-route-list');
 if(!focus||!routeBox||!routeList||!$('pano-open'))return;
 const areas={going:'going',ellmau:'ellmau',scheffau:'scheffau',
  'söll':'soll',soll:'soll',itter:'itter',hopfgarten:'hopfgarten',
  brixen:'brixen','brixen im thale':'brixen',westendorf:'westendorf'};
 let stages=[];
 const normalize=name=>areas[String(name||'').trim().toLocaleLowerCase('nl-NL')]||null;
 function select(area){
  const value=normalize(area);
  if(!value)return;
  focus.value=value;
  focus.dispatchEvent(new Event('change',{bubbles:true}));
  for(const b of routeList.querySelectorAll('button[data-area]'))
   b.setAttribute('aria-pressed',String(b.dataset.area===value));
 }
 function routeAreas(data){
  const legs=Array.isArray(data?.route?.steps)?data.route.steps:[];
  const result=[];
  for(const leg of legs){
   if(!leg)continue;
   for(const value of [leg.from,leg.to]){
    const area=normalize(value);
    if(area && (!result.length||result[result.length-1].area!==area))
     result.push({area,name:String(value)});
   }
  }
  if(!result.length){
   const net=window.SKIWeltCorridors;
   for(const name of [data?.options?.start,data?.options?.finish]){
    const area=normalize(net?.areaOf?.(name));
    if(area && (!result.length||result[result.length-1].area!==area))
     result.push({area,name:net.areaOf(name)});
   }
  }
  return result.slice(0,35);
 }
 function show(data){
  stages=routeAreas(data);
  routeList.replaceChildren();
  routeBox.hidden=!stages.length;
  if(!stages.length){$('pano-open').click();return;}
  stages.forEach((stage,index)=>{
   const b=document.createElement('button');
   b.type='button';b.className='pano-route-stop';b.dataset.area=stage.area;
   b.setAttribute('aria-label','Zoom naar '+stage.name);
   b.textContent=(index+1)+' · '+stage.name;
   b.addEventListener('click',()=>select(stage.name));
   routeList.append(b);
  });
  $('pano-open').click();
  select(stages[0].name);
 }
 focus.addEventListener('change',()=>{
  for(const b of routeList.querySelectorAll('button[data-area]'))
   b.setAttribute('aria-pressed',String(b.dataset.area===focus.value));
 });
 window.SKIMapRoute={show,areas:()=>stages.map(s=>s.name)};
})();