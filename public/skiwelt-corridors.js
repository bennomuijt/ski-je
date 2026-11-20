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
  // Dijkstra by stated approximate corridor minutes, not by number of area changes.
  const distances=new Map([[start,0]]),parents=new Map(),visited=new Set();
  while(visited.size<areas.length){
   let current=null,cost=Infinity;
   for(const [area,d] of distances){if(!visited.has(area)&&d<cost){current=area;cost=d;}}
   if(!current)break;
   if(current===finish)break;
   visited.add(current);
   for(const edge of corridors){
    if(closedCorridor(edge,closures))continue;
    const next=edge.a===current?edge.b:edge.b===current?edge.a:null;
    if(!next||visited.has(next))continue;
    const candidate=cost+edge.minutes;
    if(candidate<(distances.get(next)??Infinity)){
     distances.set(next,candidate);parents.set(next,{previous:current,edge});
    }
   }
  }
  if(!parents.has(finish))return null;
  const route=[];let node=finish;
  while(node!==start){
   const found=parents.get(node);if(!found)return null;
   const e=found.edge;
   route.push({id:e.id,from:found.previous,to:node,
    via:found.previous===e.a?e.ab:e.ba,
    direction:found.previous===e.a?'ab':'ba',minutes:e.minutes,
    status:'unknown',mapListed:true,
    warning:'⚠️ Op officiële verbindingspagina, niet live gecontroleerd',
    codes:e.codes.slice(),source:SOURCE});
   node=found.previous;
  }
  return route.reverse();
 }
 const cost=steps=>steps?.reduce((total,step)=>total+step.minutes,0)??Infinity;
 const minutes=x=>/^\d{2}:\d{2}$/.test(String(x||''))?Number(x.slice(0,2))*60+Number(x.slice(3)):null;
 function pickScenicTarget(start,finish,through,available,closures,date=''){
  const candidates=[];
  for(const area of areas){
   if(area===start||area===finish)continue;
   const first=shortest(start,through||area,closures);
   const toCandidate=through?shortest(through,area,closures):[];
   const last=shortest(area,finish,closures);
   if(!first||!toCandidate||!last)continue;
   const total=cost(first)+cost(toCandidate)+cost(last);
   if(total>available||total<65)continue;
   const hops=first.length+toCandidate.length+last.length;
   const depth=shortest(start,area,closures)?.length||0;
   // Longer scenic circuits score better; avoid a short first-neighbour loop at home.
   const score=Math.min(total,available*.9)+(depth>=2?85:0)+(hops>=4?28:0);
   candidates.push({area,total,score,depth});
  }
  if(!candidates.length)return null;
  candidates.sort((a,b)=>b.score-a.score||b.depth-a.depth||a.area.localeCompare(b.area));
  // Diversify similarly attractive outings by date without random behaviour.
  const tied=candidates.filter(x=>x.score>=candidates[0].score-8);
  const dayNumber=String(date||'').replace(/\D/g,'').split('').reduce((n,d)=>n+Number(d),0);
  return tied[dayNumber%tied.length].area;
 }
 function build(settings,closures=[]){
  const start=areaOf(settings?.start),finish=areaOf(settings?.finish);
  const blocked=parseClosures(closures),notes=[],unreachable=[];
  const empty={ok:false,startArea:start,endArea:finish,steps:[],phases:{preLunch:[],postLunch:[],return:[]},
   notes,unreachable,source:SOURCE,provisional:true,returnEstimate:0,durationEstimate:0};
  if(!start||!finish)return {...empty,reason:'Start- of eindstation nog niet aan een SkiWelt-gebied gekoppeld.'};
  const dayStart=minutes(settings?.departure||'09:00')??540;
  const end=minutes(settings?.returnTime||'16:00')??960;
  const lunchStart=minutes(settings?.lunchTime||'12:30')??750;
  const withLunch=settings?.useLunch!==false;
  const lunchMinutes=withLunch?Math.max(30,Math.min(120,Number(settings?.lunchDuration||60))):0;
  const breaks=(settings?.morningBreak?30:0)+(settings?.afternoonBreak?30:0);
  const available=Math.max(0,end-dayStart-30-lunchMinutes-breaks-15);
  const lunchRestaurant=String(settings?.lunchRestaurantLabel||'');
  const assignedLunch=withLunch?areaOf(lunchRestaurant):null;
  const wishes=[];
  if(Array.isArray(settings?.wishes))for(const wish of settings.wishes){
   const area=wishAreas[wish];if(area&&!wishes.includes(area))wishes.push(area);
  }
  let preLunchArea=assignedLunch||null,scenicTarget=null;
  const explicit=wishes.find(x=>x!==start&&x!==finish);
  // Prioritise explicit wishes, otherwise travel away from the often-skied home area.
  if(explicit)scenicTarget=explicit;
  else if(settings?.style==='relaxed'||start===finish){
   scenicTarget=pickScenicTarget(start,finish,preLunchArea,available*.78,blocked,settings?.date);
  }
  if(!scenicTarget&&start!==finish)scenicTarget=finish;
  if(!scenicTarget&&start===finish)scenicTarget=preLunchArea||start;
  if(!preLunchArea)preLunchArea=scenicTarget;
  // A requested lunch venue must be reachable before lunch, not after.
  let preLunch=shortest(start,preLunchArea,blocked);
  if(preLunch===null){unreachable.push(start+' → '+preLunchArea);preLunch=[];}
  let timeUntilLunch=withLunch?lunchStart-dayStart-15:Infinity;
  if(withLunch&&cost(preLunch)>timeUntilLunch){
   notes.push('⚠️ De gekozen lunchlocatie is mogelijk niet vóór '+settings.lunchTime+' bereikbaar. Wijzig vertrek of lunchtijd.');
  }
  let postLunch=[];
  if(scenicTarget!==preLunchArea){
   const path=shortest(preLunchArea,scenicTarget,blocked);
   if(path!==null)postLunch=path;else unreachable.push(preLunchArea+' → '+scenicTarget);
  }
  let latestArea=postLunch.length?postLunch.at(-1).to:preLunchArea;
  let returnSteps=shortest(latestArea,finish,blocked);
  if(returnSteps===null){unreachable.push(latestArea+' → '+finish);returnSteps=[];}
  if(withLunch){
   const afterLunchTime=end-30-(lunchStart+lunchMinutes)-15-(settings?.afternoonBreak?30:0);
   if(cost(postLunch)+cost(returnSteps)>afterLunchTime){
    if(!explicit&&postLunch.length){
     scenicTarget=preLunchArea;postLunch=[];
     latestArea=preLunchArea;returnSteps=shortest(latestArea,finish,blocked)||[];
     notes.push('Een te lange extra omweg na de lunch is geschrapt om tijdig terug te keren.');
    } else notes.push('⚠️ De gekozen route kan na de lunch niet binnen de opgegeven terugkeertijd passen.');
   }
  }
  const minCost=cost(preLunch)+cost(postLunch)+cost(returnSteps);
  if(minCost>available)notes.push('⚠️ Verwachte verbindingstijd is langer dan de beschikbare tijd. Kies minder stops of een latere eindtijd.');
  if(unreachable.length)notes.push('⚠️ Geen gedocumenteerde open verbinding voor '+unreachable.join(', ')+'. Er worden geen ontbrekende pistes verzonnen.');
  if(blocked.length)notes.push('⚠️ '+blocked.length+' zelf gemelde sluiting(en) meegenomen (niet onafhankelijk gecontroleerd).');
  if(assignedLunch&&assignedLunch!==scenicTarget)notes.push('Lunch in '+assignedLunch+' is als gewenste stop opgenomen. Exacte bereikbaarheid restaurant controleren.');
  if(!assignedLunch&&withLunch)notes.push('Lunchgebied: '+preLunchArea+'. Kies een bereikbaar restaurant ter plaatse.');
  notes.push('⚠️ Kaartverbindingen zijn voorlopig als geopend aangenomen. Liften, pistes, overstappen en wachttijden zijn niet live gecontroleerd.');
  // Existing times were calibrated only for an average skier. Scale them for
   // ski level; these are planning estimates, not surveyed piste times.
   const pace=settings?.skill==='blue'?1.45:settings?.skill==='pro'?0.86:1;
   for(const part of [...preLunch,...postLunch,...returnSteps])part.minutes=Math.max(12,Math.ceil(part.minutes*pace));
   if(pace!==1)notes.push('Indicatieve verbindingstijden aangepast aan '+(settings?.skill==='blue'?'Beginner':'Professional')+' (factor '+pace+'). Liftwachtrijen en condities kunnen afwijken.');
   const steps=[...preLunch,...postLunch,...returnSteps];
  return {ok:unreachable.length===0,startArea:start,endArea:finish,steps,notes,unreachable,
   phases:{preLunch,postLunch,return:returnSteps},scenicTarget,preLunchArea,lunchArea:preLunchArea,
   source:SOURCE,provisional:true,closuresApplied:blocked.length,
   returnEstimate:cost(returnSteps),durationEstimate:cost(steps),minimumMinutes:cost(steps),
   reason:unreachable.length?'Niet alle gebieden hebben een gedocumenteerde beschikbare verbinding.':'Voorlopig reisvoorstel via officiële gebiedsverbindingen, niet exact van liftstation tot liftstation.'};
 }
 return {SOURCE,areas,corridors,areaOf,parseClosures,closedCorridor,shortest,build};
});