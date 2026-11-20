/* SKI-je route-engine: calculations only, no network requests.
   Routes are NEVER invented: caller must supply explicitly checked edges.
   CommonJS export allows deterministic offline tests. */
(function(root,factory){
  const engine=factory();
  if(typeof module==='object'&&module.exports)module.exports=engine;
  if(root)root.SkiRouteEngine=engine;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const LEVELS={blue:1,red:2,black:3};
 const ID_LIMIT=120;
 const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
 function clock(value){
  if(typeof value!=='string'||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))return null;
  const [h,m]=value.split(':').map(Number);return h*60+m;
 }
 function hhmm(total){return String(Math.floor(total/60)%24).padStart(2,'0')+':'+String(total%60).padStart(2,'0');}
 function safeText(s,n=ID_LIMIT){return String(s??'').trim().slice(0,n).replace(/[<>\u0000-\u001f]/g,'');}
 function normalizedEdge(raw){
  if(!raw||typeof raw!=='object')return null;
  const from=safeText(raw.from),to=safeText(raw.to),name=safeText(raw.name||raw.label||raw.code||'Verbinding');
  const type=['lift','piste','overstap'].includes(raw.type)?raw.type:'overstap';
  const level=['blue','red','black'].includes(raw.level)?raw.level:'unknown'; // an unspecified colour is NOT assumed blue
  const lengthKm=Number(raw.lengthKm??raw.km??0);
  const minutes=Number(raw.minutes||0),waitMinutes=Number(raw.waitMinutes||0);
  const closingTime=safeText(raw.closingTime||'',5);
  if(!from||!to||from===to||!name||!Number.isFinite(lengthKm)||lengthKm<0||lengthKm>30)return null;
  if(!Number.isFinite(minutes)||minutes<0||minutes>180||!Number.isFinite(waitMinutes)||waitMinutes<0||waitMinutes>60)return null;
  if(closingTime&&clock(closingTime)===null)return null;
  return {
    id:safeText(raw.id||`${from}-${to}-${name}`),from,to,name,
    code:safeText(raw.code||'',32),type,level,lengthKm,
    minutes,waitMinutes,closingTime,
    verified:raw.verified===true,mapListed:raw.mapListed===true,
    status:['open','closed','unknown'].includes(raw.status)?raw.status:'unknown',
    updatedAt:safeText(raw.updatedAt||'',60),
    source:safeText(raw.source||'Lokale meting',100),
    scenic:raw.scenic===true
  };
 }
 function importNetwork(obj){
  if(!obj||typeof obj!=='object'||!Array.isArray(obj.edges)||obj.edges.length>2000)throw new Error('Ongeldig netwerkbestand of te veel verbindingen.');
  const edges=[];const ids=new Set();let skipped=0;
  for(const row of obj.edges){const edge=normalizedEdge(row);if(!edge||ids.has(edge.id)){skipped++;continue;}ids.add(edge.id);edges.push(edge);}
  return {edges,skipped};
 }
 function segmentMinutes(edge,skill='red',speed='normal'){
  // Explicit user-checked duration takes priority; otherwise show modelled estimate.
  if(edge.minutes>0)return edge.minutes+edge.waitMinutes;
  // Conservative planning values; measured spot speeds of 19.9/32.4/44.5 km/h are not whole-day averages.
   const speeds={easy:12,normal:20,sporty:28};const speedKmh=speeds[speed]||20;
  if(edge.type==='lift')return clamp(Math.ceil(edge.lengthKm/12*60)+6,4,35)+edge.waitMinutes;
  if(edge.type==='overstap')return clamp(Math.ceil(edge.lengthKm/4*60)+2,2,30);
  const difficultyFactor=edge.level==='black'?0.72:edge.level==='red'?0.90:1;
  return clamp(Math.ceil(edge.lengthKm/(speedKmh*difficultyFactor)*60)+2,3,60);
 }
 function canUsePiste(edge,opts={}){
   if(edge.type!=='piste')return true;
   const level=opts.skill==='pro'?'red':opts.skill||'red';
   if(edge.level==='unknown')return false; // No silent black or unclassified runs.
   if(edge.level==='black')return opts.allowBlack===true&&level!=='blue';
   return LEVELS[edge.level]<=LEVELS[level];
  }
  function shortest(edges,origin,target,atMinute,opts={}){
  if(origin===target)return {steps:[],finishAt:atMinute,weight:0};
  const usable=edges.filter(e=>(e.verified||e.mapListed)&&e.status!=='closed'&&
    canUsePiste(e,opts));
  const map=new Map();for(const e of usable){if(!map.has(e.from))map.set(e.from,[]);map.get(e.from).push(e);}
  const best=new Map([[origin,{weight:0,at:atMinute,prev:null,edge:null}]]);const waiting=new Set([origin]);
  let iter=0;
  while(waiting.size&&iter++<3000){
    let current=null,least=Infinity;
    for(const node of waiting){const w=best.get(node).weight;if(w<least){least=w;current=node;}}
    waiting.delete(current);if(current===target)break;
    const soFar=best.get(current);
    for(const edge of map.get(current)||[]){
      const duration=segmentMinutes(edge,opts.skill,opts.speed);
      const closing=clock(edge.closingTime);
      // Closing times apply to lift entry, not necessarily to the full lift ride.
      if(edge.type==='lift'&&closing!==null&&soFar.at>=closing)continue;
      const cost=duration+((opts.style==='relaxed'&&edge.type==='lift')?2:0)-((opts.style==='relaxed'&&edge.scenic)?Math.min(2,duration*.15):0);
      const candidate=soFar.weight+Math.max(0.1,cost);
      if(!best.has(edge.to)||candidate<best.get(edge.to).weight){
        best.set(edge.to,{weight:candidate,at:soFar.at+duration,prev:current,edge});waiting.add(edge.to);
      }
    }
  }
  if(!best.has(target))return null;
  const steps=[];let p=target;let safety=0;
  while(p!==origin&&safety++<3000){const rec=best.get(p);if(!rec?.edge)return null;steps.push(rec.edge);p=rec.prev;}
  return {steps:steps.reverse(),weight:best.get(target).weight,finishAt:best.get(target).at};
 }
 const TOPS={
  'top:salve':'Hohe Salve','top:hartkaiser':'Hartkaiser bergstation',
  'top:brandstadl':'Brandstadl bergstation','top:kleine-salve':'Kleine Salve',
  'top:choralpe':'Choralpe','top:talkaser':'Talkaser','top:eiberg':'Eiberg'
 };
 function requestedStops(wishes,edges){
  const result=[],missing=[];
  for(const want of wishes||[]){
   if(TOPS[want]){
     const node=TOPS[want];const available=edges.some(e=>e.from===node||e.to===node);
     if(available)result.push({type:'node',name:node,original:want});else missing.push(want);
   }else if(want.startsWith('piste:')||want.startsWith('lift:')){
     const candidates=edges.filter(e=>e.code===want&&(e.verified||e.mapListed));
     if(candidates.length)result.push({type:'edge',edge:candidates[0],original:want});else missing.push(want);
   }else{missing.push(want);}
  }
  return {result,missing};
 }
 function calculate({edges=[],start='',finish='',departure='09:00',returnTime='16:00',style='relaxed',skill='red',speed='normal',allowBlack=false,wishes=[],useLunch=true,lunchDuration=60,lunchTime='12:30',lunchRestaurant='',morningBreak=false,morningDuration=30,afternoonBreak=false,afternoonDuration=30,useSafety=true,safetyMarginMin=30}={}){
  const begin=clock(departure),end=clock(returnTime),lunchtime=clock(lunchTime);
  if(begin===null||end===null||end<=begin+90)return {ok:false,reason:'Controleer vertrek- en terugkeertijd.'};
  if(useLunch&&(!Number.isFinite(Number(lunchDuration))||Number(lunchDuration)<30||Number(lunchDuration)>120||lunchtime===null||lunchtime<clock('11:45')||lunchtime>clock('13:15')))
    return {ok:false,reason:'Lunch moet tussen 11:45 en 13:15 beginnen; duur 30 tot 120 minuten.'};
  const checked=edges.map(normalizedEdge).filter(e=>e&&(e.verified||e.mapListed));
  if(!checked.length)return {ok:false,reason:'Nog geen gecontroleerd piste-/liftnetwerk. Importeer eerst gecontroleerde verbindingen.',missingNetwork:true};
  if(!start||!finish)return {ok:false,reason:'Kies een startpunt en eindpunt.'};
  const via=requestedStops(wishes,checked);
  if(via.missing.length)return {ok:false,reason:'Deze gewenste piste(s) of plekken komen nog niet in je gecontroleerde netwerk voor.',missingWishes:via.missing};
  if(lunchRestaurant){
    // No guessing which graph node a named restaurant corresponds to.
    const restaurantName=lunchRestaurant.includes(':')?lunchRestaurant.slice(lunchRestaurant.indexOf(':')+1):lunchRestaurant;
    const restaurantNumber=lunchRestaurant.includes(':')?lunchRestaurant.slice(0,lunchRestaurant.indexOf(':')):'';
    const restaurantNode=checked.find(e=>e.code==='restaurant:'+restaurantNumber||e.to===restaurantName||e.from===restaurantName);
    if(!restaurantNode)return {ok:false,reason:'Het gekozen restaurant is nog niet aan een gecontroleerd routeknooppunt gekoppeld.',missingRestaurant:lunchRestaurant};
    const node=restaurantNode.code==='restaurant:'+restaurantNumber ? restaurantNode.to : restaurantName;
    via.result.push({type:'node',name:node,original:'lunch'});
  }
  const steps=[];let at=begin,current=start;const notes=[];
  const opts={style,skill,speed,allowBlack:allowBlack===true};
  function addPath(target){
    const p=shortest(checked,current,target,at,opts);if(!p)return false;
    for(const edge of p.steps){const duration=segmentMinutes(edge,skill,speed);
      const startAt=at;at+=duration;steps.push({edge,startAt,endAt:at,duration});
      if(edge.status==='unknown')notes.push('⚠ Niet live gecontroleerd; op kaart aangenomen open: '+edge.name);if(edge.mapListed&&!edge.verified)notes.push('⚠ Kaartverbinding niet met GPS gecontroleerd: '+edge.name);
      if(!edge.minutes)notes.push('Tijd geschat voor '+edge.name);
      current=edge.to;
    }
    return true;
  }
  for(const point of via.result){
    if(point.type==='edge'){
      if(!addPath(point.edge.from))return {ok:false,reason:'Geen gecontroleerde route naar de gewenste piste/lift: '+point.edge.name};
      const e=point.edge;
      if(e.status==='closed')return {ok:false,reason:'Gewenste verbinding is gesloten: '+e.name};
      if(!canUsePiste(e,opts))return {ok:false,reason:'Gewenste piste is niet toegestaan (kleur onbekend, te moeilijk of zwart zonder expliciete toestemming): '+e.name};
      const c=clock(e.closingTime);
      if(e.type==='lift'&&c!==null&&at>=c)return {ok:false,reason:'De gewenste lift sluit voor je die bereikt: '+e.name};
      const dur=segmentMinutes(e,skill,speed);steps.push({edge:e,startAt:at,endAt:at+dur,duration:dur});at+=dur;current=e.to;
    }else if(!addPath(point.name))return {ok:false,reason:'Geen gecontroleerde route naar '+point.name};
  }
  if(!addPath(finish))return {ok:false,reason:'Er bestaat geen gecontroleerde verbinding tussen start, wensen en eindpunt.'};
  if(!steps.length)return {ok:false,reason:'Nog geen skiroute: het start- en eindpunt zijn gelijk en er zijn geen gecontroleerde pistes of rondjes gekozen.'};
  const early=morningBreak?Math.max(5,Math.min(120,Number(morningDuration)||30)):0;
   const late=afternoonBreak?Math.max(5,Math.min(120,Number(afternoonDuration)||30)):0;
   const breakMinutes=early+late;
  const lunchMinutes=useLunch?Number(lunchDuration):0;
  const travelMinutes=steps.reduce((sum,s)=>sum+s.duration,0);
  const margin=useSafety===false?0:Math.max(0,Math.min(120,Number.isFinite(Number(safetyMarginMin))?Number(safetyMarginMin):30));
   const latestArrival=end-margin;
  const warnings=[...new Set(notes)];
  // Include pauses in the ACTUAL segment clock before checking lift deadlines.
  // The model is conservative: if a late lunch cannot be scheduled, fail instead
  // of hiding the discrepancy. The lunch location is only confirmed when in graph.
  const lunchNode=lunchRestaurant?(lunchRestaurant.includes(':')?lunchRestaurant.slice(lunchRestaurant.indexOf(':')+1):lunchRestaurant):null;
  let lunchIndex=useLunch?Math.max(0,Math.floor(steps.length/2)-1):-1;
  if(lunchNode){const idx=steps.findIndex(s=>s.edge.to===lunchNode);if(idx>=0)lunchIndex=idx;}
  let actualClock=begin,scheduledLunchAt=null;
  for(let i=0;i<steps.length;i++){
    if(morningBreak&&i===Math.max(0,Math.floor(steps.length/4)))actualClock+=early;
    if(afternoonBreak&&i===Math.max(0,Math.floor(steps.length*3/4)))actualClock+=late;
    const step=steps[i],closing=clock(step.edge.closingTime);
    if(step.edge.type==='lift'&&closing!==null&&actualClock>=closing)
      return {ok:false,reason:'Een lift zou al gesloten kunnen zijn na ingeplande pauzes: '+step.edge.name};
    step.startAt=actualClock;actualClock+=step.duration;step.endAt=actualClock;
    if(i===lunchIndex){
      scheduledLunchAt=Math.max(lunchtime,actualClock);
      if(scheduledLunchAt>clock('13:15'))return {ok:false,reason:'Lunch kan volgens deze route niet uiterlijk 13:15 beginnen. Pas de route aan.'};
      if(scheduledLunchAt>actualClock)warnings.push('Voor lunch is '+(scheduledLunchAt-actualClock)+' minuten wachttijd opgenomen; extra pistes kunnen handiger zijn.');
      actualClock=scheduledLunchAt+lunchMinutes;
      if(i===steps.length-1)warnings.push('Lunch valt pas bij het eindpunt; voeg gecontroleerde pistes toe voor een volledige skidag.');
    }
  }
  const realArrival=actualClock;
  if(useLunch&&!lunchRestaurant)warnings.push('De lunchduur is gereserveerd, maar de lunchlocatie is niet geografisch bevestigd.');
  if(morningBreak||afternoonBreak)warnings.push('Pauzes zijn gereserveerd, maar nog niet aan specifieke locaties gekoppeld.');
  // If the path includes any unknown status, never claim guaranteed access.
  if(realArrival>latestArrival)warnings.push('De geplande reistijd past niet binnen de veiligheidsmarge.');
  return {ok:realArrival<=latestArrival,reason:realArrival<=latestArrival?'Route berekend op door de gebruiker gecontroleerde verbindingen.':'De route is te lang voor de ingestelde terugkeertijd.',
    steps,pisteKm:steps.filter(s=>s.edge.type==='piste').reduce((n,s)=>n+s.edge.lengthKm,0),liftKm:steps.filter(s=>s.edge.type==='lift').reduce((n,s)=>n+s.edge.lengthKm,0),distanceSource:'Lengtes uit gecontroleerde netwerkgegevens',travelMinutes,lunchMinutes,breakMinutes,startTime:departure,arrival:hhmm(realArrival),arrivalMinute:realArrival,scheduledLunch:scheduledLunchAt===null?null:hhmm(scheduledLunchAt),
    latestArrival:hhmm(latestArrival),marginMinutes:latestArrival-realArrival,warnings,edgeCount:steps.length,
    statusVerified:steps.every(s=>s.edge.status==='open'),
    estimatesUsed:steps.some(s=>s.edge.minutes===0),model:steps.every(s=>s.edge.verified)?'User-verified, no official guarantee':'Map-listed provisional, not live verified'};
 }
 return {clock,hhmm,normalizedEdge,importNetwork,segmentMinutes,shortest,calculate,requestedStops};
});
