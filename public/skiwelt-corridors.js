/* SkiWelt 2026/27 officially described connections. Area suggestions are NOT
   turn-by-turn navigation and listed paths are assumed open only for planning.
   Source: https://www.skiwelt.at/nl/verbindingen.html */
(function(root,factory){
 const network=factory();
 if(typeof module==='object'&&module.exports)module.exports=network;
 if(root)root.SKIWeltCorridors=network;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SOURCE='https://www.skiwelt.at/nl/verbindingen.html';
 const areas=['Going','Ellmau','Scheffau','Brixen','Westendorf','Hopfgarten','Itter','Söll'];
 const corridors=[
  {id:'going-ellmau',a:'Going',b:'Ellmau',
    ab:'Hausberg-afdaling 90 en Hartkaiserbahn 80; volg de officiële borden naar Ellmau',
    ba:'Dalafdaling 80/80a en Hausberg 90; volg de borden naar Going',
    codes:['piste:90','lift:80','piste:80','piste:80a'],minutes:40},
  {id:'ellmau-scheffau',a:'Ellmau',b:'Scheffau',
    ab:'Köglbahn 97, Tanzboden-afdaling 99a en Tanzbodenbahn 99; controleer tussenaansluitingen',
    ba:'Via Eiberg 96-99 of Tanzboden 99 en aansluiting Kaiserexpress 96b',
    codes:['lift:97','piste:99a','lift:99','piste:96b'],minutes:45},
  {id:'scheffau-brixen',a:'Scheffau',b:'Brixen',
    ab:'Aualmbahn 71 en afdalingen Hochbrixen 2a of Joch 6; controleer niveau en vertakkingen',
    ba:'Jochbahn 6 via verbinding 65a/72 of Muldenabfahrt 70 richting Scheffau',
    codes:['lift:71','piste:2a','piste:6','lift:6','piste:65a','piste:72','piste:70'],minutes:45},
  {id:'brixen-westendorf',a:'Brixen',b:'Westendorf',
    ab:'Hochbrixen-gondel 1 en SkiWeltbahn 11 naar Westendorf',
    ba:'Windau-afdaling 111, Choralmbahn 112 en Kandleralm 11 richting Brixen',
    codes:['lift:1','lift:11','piste:111','lift:112','piste:11','piste:18','lift:12'],minutes:50},
  {id:'brixen-hopfgarten',a:'Brixen',b:'Hopfgarten',
    ab:'Via Kälbersalvenbahn 2 richting Hopfgarten; controleer vervolg op de pistekaart',
    ba:'Foischingbahn 25 en Kälberalm-afdalingen 2/2b richting Brixen',
    codes:['lift:2','lift:25','piste:2','piste:2b'],minutes:45},
  {id:'brixen-soll',a:'Brixen',b:'Söll',
    ab:'Kälbersalvenbahn 2 en Siller-Keat 51 richting Hochsöll',
    ba:'Via Hohe Salve 42 en piste 2c of via Keat 43/51a en Filzboden 7',
    codes:['lift:2','lift:51','lift:42','piste:2c','lift:43','piste:51a','lift:7'],minutes:50},
  {id:'soll-itter',a:'Söll',b:'Itter',
    ab:'Via Hohe Salve en Rigi-Kraftalm 30/31 naar Itter; controleer de gekozen afdaling',
    ba:'Via afdaling 40, Hexen6er 45 en Hohe Salve 42 richting Söll',
    codes:['piste:40','lift:45','lift:42','lift:30','lift:31'],minutes:55},
  {id:'itter-hopfgarten',a:'Itter',b:'Hopfgarten',
    ab:'Via Hohe Salve / Rigi 22 en verbindingen 30/31 richting Hopfgarten',
    ba:'Salvenbahn II 22 via Hohe Salve / Rigi 30/31 richting Itter',
    codes:['lift:22','lift:30','lift:31','piste:30','piste:31'],minutes:50}
 ];
 const wishAreas={
  'top:hartkaiser':'Ellmau','top:eiberg':'Scheffau','top:brandstadl':'Scheffau',
  'top:salve':'Söll','top:kleine-salve':'Itter','top:choralpe':'Westendorf',
  'top:talkaser':'Westendorf'
 };
 function areaOf(value){
  const text=String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if(text.includes('westendorf')||text.includes('choralpe')||text.includes('talkaser')||text.includes('alpenrosen'))return 'Westendorf';
  if(text.includes('brixen')||text.includes('hochbrixen')||text.includes('zinsberg'))return 'Brixen';
  if(text.includes('scheffau')||text.includes('brandstadl')||text.includes('eiberg'))return 'Scheffau';
  if(text.includes('ellmau')||text.includes('hartkaiser')||text.includes('kogl'))return 'Ellmau';
  if(text.includes('going')||text.includes('astberg'))return 'Going';
  if(text.includes('hopfgarten')||text.includes('salvenbahn'))return 'Hopfgarten';
  if(text.includes('itter')||text.includes('salvistabahn'))return 'Itter';
  if(text.includes('soll')||text.includes('hochsoll')||text.includes('hexenwasser')||text.includes('hexen6'))return 'Söll';
  return null;
 }
 function parseClosures(rows){
  if(!Array.isArray(rows))return [];
  return rows.filter(x=>x&&typeof x==='object'&&['lift','piste','corridor'].includes(x.kind))
   .map(x=>({kind:x.kind,code:String(x.code||'').trim().toLowerCase().slice(0,20),note:String(x.note||'').trim().slice(0,150),at:String(x.at||'')}))
   .filter(x=>/^[a-z0-9_-]{1,20}$/.test(x.code)).slice(-150);
 }
 function closedCorridor(edge,closures){
  const items=parseClosures(closures);
  return items.some(item=>(item.kind==='corridor'&&item.code===edge.id)||
   edge.codes.some(code=>code===item.kind+':'+item.code));
 }
 function shortest(start,finish,closures){
  if(!areas.includes(start)||!areas.includes(finish))return null;
  if(start===finish)return [];
  const queue=[start],parents=new Map([[start,null]]);
  while(queue.length){
   const current=queue.shift();
   for(const edge of corridors){
    if(closedCorridor(edge,closures))continue;
    const next=edge.a===current?edge.b:edge.b===current?edge.a:null;
    if(!next||parents.has(next))continue;
    parents.set(next,{previous:current,edge});queue.push(next);
    if(next===finish){
     const route=[];let node=finish;
     while(node!==start){
      const found=parents.get(node),e=found.edge;
      route.push({id:e.id,from:found.previous,to:node,via:found.previous===e.a?e.ab:e.ba,
       minutes:e.minutes,status:'unknown',mapListed:true,warning:'⚠️ Op SkiWelt-kaart / verbindingspagina; niet live gecontroleerd',
       codes:e.codes.slice(),source:SOURCE});
      node=found.previous;
     }
     return route.reverse();
    }
   }
  }
  return null;
 }
 function build(settings,closures=[]){
  const start=areaOf(settings?.start),finish=areaOf(settings?.finish);
  const blocked=parseClosures(closures),notes=[],unreachable=[];
  if(!start||!finish)return {ok:false,steps:[],reason:'Start- of eindstation nog niet aan een SkiWelt-gebied gekoppeld.',notes,source:SOURCE};
  let stops=[];
  if(Array.isArray(settings?.wishes))for(const wish of settings.wishes){
   const area=wishAreas[wish];if(area&&!stops.includes(area)&&area!==start&&area!==finish)stops.push(area);
  }
  const restaurantArea=areaOf(settings?.lunchRestaurantLabel||'');
  if(settings?.useLunch!==false&&restaurantArea&&restaurantArea!==start&&restaurantArea!==finish&&!stops.includes(restaurantArea)){
   stops.unshift(restaurantArea);
  }else if(settings?.useLunch!==false&&settings?.lunchRestaurantLabel&&!restaurantArea)
   notes.push('⚠️ Restaurantlocatie niet aan de officiële verbindingskaart gekoppeld; controleer bereikbaarheid.');
  // At identical start and end, make an optional circuit on known corridors for a full-day proposal.
  if(!stops.length&&start===finish){
   const loop=corridors.find(e=>(e.a===start||e.b===start)&&!closedCorridor(e,blocked));
   if(loop&&String(settings?.departure||'09:00')<'12:00')stops.push(loop.a===start?loop.b:loop.a);
  }
  const legs=[];let current=start;const targets=[...stops,finish];
  for(const target of targets){
   const path=shortest(current,target,blocked);
   if(path===null){unreachable.push(current+' → '+target);continue;}
   legs.push(...path);current=target;
  }
  if(unreachable.length){
   notes.push('⚠️ Geen gedocumenteerde open verbinding gevonden voor '+unreachable.join(', ')+'. Er wordt geen niet-bestaande verbinding verzonnen.');
  }
  if(blocked.length)notes.push('⚠️ '+blocked.length+' eigen sluitingsmelding(en) meegenomen. Deze zijn nog niet onafhankelijk bevestigd.');
  notes.push('⚠️ Alle kaartverbindingen zonder actuele status zijn voor de planning als beschikbaar aangenomen; controleer de officiële lift- en pistestatus voor vertrek.');
  return {ok:unreachable.length===0,startArea:start,endArea:finish,steps:legs,notes,unreachable,
   source:SOURCE,provisional:true,closuresApplied:blocked.length,
   durationEstimate:legs.reduce((sum,leg)=>sum+leg.minutes,0),
   reason:unreachable.length?'Niet alle gewenste gebieden hebben een beschikbare gedocumenteerde verbinding.':'Voorlopige gebiedsroute op officiële verbindingsinformatie (geen lift-voor-lift-navigatie).'};
 }
 return {SOURCE,areas,corridors,areaOf,parseClosures,closedCorridor,shortest,build};
});