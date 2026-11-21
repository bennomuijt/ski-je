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
    codes:['lift:1','lift:11','piste:110','piste:111','piste:117','lift:117','lift:112','piste:11','lift:18','lift:12'],minutes:50},
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
  const dayStart=minutes(settings?.departure||'09:00');
  const end=minutes(settings?.returnTime||'16:00');
  const withLunch=settings?.useLunch!==false;
  const lunchStart=minutes(settings?.lunchTime||'12:30');
  const lunchMinutes=withLunch?Number(settings?.lunchDuration??60):0;
  const earlyBreak=settings?.morningBreak?Math.max(5,Math.min(120,Number(settings.morningDuration)||30)):0;
  const lateBreak=settings?.afternoonBreak?Math.max(5,Math.min(120,Number(settings.afternoonDuration)||30)):0;
  const margin=settings?.useSafety===false?0:Math.max(0,Math.min(120,Number.isFinite(Number(settings?.safetyMarginMin))?Number(settings.safetyMarginMin):30));
  const safe=end===null?null:end-margin;
  if(dayStart===null||safe===null||safe<=dayStart||
      (withLunch&&(lunchStart===null||lunchStart<705||lunchStart>795||!Number.isInteger(lunchMinutes)||lunchMinutes<30||lunchMinutes>120)))
   return {...empty,reason:'De opgegeven dag- of lunchtijden zijn ongeldig.'};
  const pace=settings?.skill==='blue'?1.45:settings?.skill==='pro'?0.86:1;
  const travel=legs=>(legs||[]).reduce((sum,leg)=>sum+Math.max(12,Math.ceil(leg.minutes*pace)),0);
  const adjust=legs=>legs.map(leg=>({...leg,minutes:Math.max(12,Math.ceil(leg.minutes*pace))}));
  const direct=shortest(start,finish,blocked);
  if(direct===null){
   unreachable.push(start+' → '+finish);
   return {...empty,unreachable,reason:'Geen gedocumenteerde verbinding tussen start en eindpunt. Controleer je gemelde sluitingen.'};
  }
  const baseline=travel(direct),breaks=earlyBreak+lateBreak;
  const baseReserve=Math.min(75,Math.max(35,Math.floor((safe-dayStart-lunchMinutes-breaks)*.20)));
  const restaurant=String(settings?.lunchRestaurantLabel||'');
  const assignedLunch=withLunch&&restaurant?areaOf(restaurant):null;
  // A chosen venue is a hard constraint; an automatic venue is not.
  if(withLunch&&restaurant&&!assignedLunch)
   return {...empty,reason:'Het gekozen restaurant heeft nog geen herkenbaar SkiWelt-gebied. Kies een andere lunchplek.'};
  const wishes=[];
  if(Array.isArray(settings?.wishes))for(const wish of settings.wishes){
   const area=wishAreas[wish];if(area&&!wishes.includes(area))wishes.push(area);
  }
  const explicit=wishes.find(area=>area!==start&&area!==finish)||null;
  const lunchAreas=withLunch?(assignedLunch?[assignedLunch]:areas):[start];
  const targets=explicit?[explicit]:(start===finish?areas:[finish]);
  const options=[];
  for(const lunchArea of lunchAreas){
   for(const target of targets){
    const pre=shortest(start,withLunch?lunchArea:target,blocked);
    const post=withLunch?shortest(lunchArea,target,blocked):[];
    const back=shortest(target,finish,blocked);
    if(pre===null||post===null||back===null)continue;
    const before=travel(pre),after=travel(post),returnCost=travel(back);
    const total=before+after+returnCost;
    const returnReserve=Math.max(baseReserve,returnCost?returnCost+15:baseReserve);
    if(withLunch){
     // Before lunch: reach the area with a small walking/wayfinding margin.
     if(dayStart+earlyBreak+before+15>lunchStart)continue;
     // After lunch: allow the day planner to reserve the entire return route.
     const finalReturnStart=safe-returnReserve;
     if(lunchStart+lunchMinutes+10>finalReturnStart)continue;
     if(lunchStart+lunchMinutes+lateBreak+after>finalReturnStart)continue;
    }else if(dayStart+breaks+total+15>safe)continue;
    if(total+breaks+lunchMinutes+15>safe-dayStart)continue;
    const steps=[...pre,...post,...back];
    if(!steps.length)continue;
    const nodes=[start,...steps.map(leg=>leg.to)];
    const repeated=nodes.slice(1,-1).filter((area,index)=>nodes.indexOf(area)<index+1).length;
    const distinct=new Set(nodes).size;
    const depth=Math.max(...nodes.map(area=>(shortest(start,area,blocked)||[]).length));
    // Reward different areas, never reward repeated backtracking around the base.
    let score=settings?.style==='fast'?-total-repeated*40:
      distinct*60+depth*(start===finish?40:12)-repeated*(start===finish?15:95)-Math.max(0,total-baseline)*(start===finish?.2:.75);
    if(start!==finish&&target===finish)score+=12;
    if(start===finish&&target===start)score-=70;
    if(withLunch&&lunchArea===start&&start!==finish)score-=15;
    if(withLunch&&lunchArea===finish&&start!==finish)score-=6;
    score+=Math.min(before,180)*.08;
    options.push({lunchArea,target,pre,post,back,score,total,returnCost,returnReserve});
   }
  }
  options.sort((a,b)=>b.score-a.score||a.total-b.total||a.lunchArea.localeCompare(b.lunchArea));
  const chosen=options[0];
  if(!chosen){
   const reason=withLunch?(assignedLunch?
    'Dit lunchrestaurant kan met de beschikbare tijd en de terugweg niet veilig worden ingepast. Kies een ander restaurant of pas de tijden aan.':
    'Ook na het doorrekenen van alternatieve lunchgebieden past geen gedocumenteerde route in deze dag. Kies een later eindtijdstip of een dichterbij gelegen bestemming.'):
    'Geen beschreven route past binnen de beschikbare skitijd en veiligheidsmarge.';
   return {...empty,reason};
  }
  const preLunch=adjust(chosen.pre),postLunch=adjust(chosen.post),returnSteps=adjust(chosen.back);
  const steps=[...preLunch,...postLunch,...returnSteps];
  if(withLunch&&assignedLunch)notes.push('Lunchgebied bij gekozen restaurant: '+chosen.lunchArea+'. Controleer de exacte hutlocatie en de piste-aansluiting.');
  else if(withLunch)notes.push('Lunchgebied automatisch gekozen: '+chosen.lunchArea+'. Restaurantnummer en bereikbaarheid ter plaatse controleren.');
  if(!explicit&&chosen.target!==start&&chosen.target!==finish)notes.push('Afwisselende route richting '+chosen.target+' gekozen binnen de lunch- en terugreistijd.');
  if(explicit)notes.push('Gezocht via het gewenste gebied '+explicit+'; de precieze piste-aansluitingen zijn niet bevestigd.');
  if(pace!==1)notes.push('Indicatieve verbindingstijden aangepast aan '+(settings?.skill==='blue'?'Beginner':'Professional')+' (factor '+pace+').');
  if(blocked.length)notes.push('⚠️ '+blocked.length+' zelf gemelde sluiting(en) meegenomen (niet onafhankelijk gecontroleerd).');
  notes.push('⚠️ Gebiedsverbindingen zijn geen volledige piste-voor-piste navigatie. De piste- en liftstatus is niet live gecontroleerd.');
  return {ok:true,startArea:start,endArea:finish,steps,notes,unreachable,phases:{preLunch,postLunch,return:returnSteps},
   scenicTarget:chosen.target,preLunchArea:withLunch?chosen.lunchArea:chosen.target,lunchArea:withLunch?chosen.lunchArea:null,
   lunchAutomaticallyChosen:withLunch&&!assignedLunch,
   source:SOURCE,provisional:true,closuresApplied:blocked.length,
   returnEstimate:chosen.returnCost,durationEstimate:chosen.total,minimumMinutes:chosen.total,
   reason:'Voorlopig gebiedsroutevoorstel; per piste en lift moeten aansluitingen nog worden gecontroleerd.'};
 }
 return {SOURCE,areas,corridors,areaOf,parseClosures,closedCorridor,shortest,build};
});