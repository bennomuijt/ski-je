/* SKI-je geographical SkiWelt route planner, offline first-party geometry.
 * NEVER inserts a piste/lift unless a path in the directed geometric graph
 * actually joins the previous step. Never uses user GPS for planning.
 * All source geometry estimated from OpenSkiData/OSM, terrain from Copernicus.
 */
(function(root,factory){
 const router=factory();
 if(typeof module==='object'&&module.exports)module.exports=router;
 if(root)root.SKIMapRouter=router;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 let graph=null,adj=null,loading=null;
 const clock=s=>/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(s||''))?Number(s.slice(0,2))*60+Number(s.slice(3)):null;
 const hhmm=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const metresToMin=(metres,kind,speed)=>{
  if(kind==='lift')return metres/(240);
  if(kind==='transfer')return metres/65+0.5;
  const velocity={easy:145,normal:250,sporty:350}[speed]||250;
  return metres/velocity;
 };
 function initialize(data){
  if(!data||data.version!==1||!Array.isArray(data.nodes)||!Array.isArray(data.edges)||
     data.nodes.length<1000||!data.stations)throw Error('SkiWelt-kaartnetwerk ontbreekt of is onjuist.');
  graph=data;adj=Array.from({length:graph.nodes.length},()=>[]);
  for(let i=0;i<graph.edges.length;i++){
   const [a,b,f,m]=graph.edges[i];
   if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=adj.length||b>=adj.length||
      !Number.isInteger(f)||f>=graph.features.length||m<0||m>16000)throw Error('Kaartnetwerk heeft een ongeldige verbinding '+i);
   adj[a].push(i);
  }
  return{nodes:data.nodes.length,edges:data.edges.length,stations:Object.keys(data.stations).length};
 }
 async function load(){
  if(graph)return graph;
  if(loading)return loading;
  loading=fetch('./skiwelt-network-graph.json',{cache:'force-cache'})
   .then(r=>{if(!r.ok)throw Error('Kaartnetwerk niet beschikbaar (HTTP '+r.status+').');return r.json();})
   .then(obj=>{initialize(obj);return graph;}).finally(()=>{loading=null;});
  return loading;
 }
 class Heap{
  constructor(){this.data=[];}
  push(entry){const a=this.data;a.push(entry);let i=a.length-1;
   while(i>0){const p=(i-1)>>1;if(a[p][0]<=entry[0])break;a[i]=a[p];i=p;}a[i]=entry;}
  pop(){const a=this.data,head=a[0],last=a.pop();if(a.length){
   let i=0;while(true){let k=i*2+1;if(k>=a.length)break;if(k+1<a.length&&a[k+1][0]<a[k][0])k++;
    if(a[k][0]>=last[0])break;a[i]=a[k];i=k;}a[i]=last;}return head;}
  get size(){return this.data.length;}
 }
 function edgeKind(row){
  if(row[2]===-1)return'transfer';
  return graph.features[row[2]]?.kind||'transfer';
 }
 function closureSet(rows=[]){
  return new Set((Array.isArray(rows)?rows:[]).filter(x=>x&&['lift','piste'].includes(x.kind))
   .map(x=>x.kind+':'+String(x.code||'').toLowerCase()));
 }
 function usable(row,opts,closed){
  const feature=row[2]===-1?null:graph.features[row[2]];
  if(!feature)return true;
  if(closed.has(feature.kind+':'+String(feature.ref||'').toLowerCase()))return false;
  if(feature.kind==='lift')return true;
  const difficulty=feature.difficulty;
  if(difficulty==='freeride'||difficulty==='extreme')return false; // Ski touring is not a groomed piste.
  if(['advanced','expert'].includes(difficulty))return opts.allowBlack===true&&opts.skill!=='blue';
  if(difficulty==='intermediate')return opts.skill!=='blue';
  return true; // Unknown piste colours remain explicitly flagged in each output.
 }
 function shortest(source,destination,opts={},closures=[]){
  if(!graph||!adj)return null;
  if(!Number.isInteger(source)||!Number.isInteger(destination)||source<0||destination<0||
   source>=adj.length||destination>=adj.length)return null;
  if(source===destination)return{edgeIds:[],minutes:0,metres:0};
  const closed=closureSet(closures),best=new Float64Array(adj.length),prior=new Int32Array(adj.length);
  best.fill(Infinity);prior.fill(-1);best[source]=0;
  const heap=new Heap();heap.push([0,source]);let explored=0;
  while(heap.size&&explored++<60000){
   const [cost,node]=heap.pop();if(cost>best[node]+1e-6)continue;
   if(node===destination)break;
   for(const eId of adj[node]){
    const row=graph.edges[eId],kind=edgeKind(row);
    if(!usable(row,opts,closed))continue;
    let distance=metresToMin(row[3],kind,opts.speed);
    // Boarding overhead is included in the first lift segment, not every vertex.
    if(kind==='lift')distance+=0.15;
    if(kind==='transfer')distance+=row[3]<=3?0.015:row[4]==='station-walk'||row[4]==='village-walk'?1.7:0.35;
    if(row[4]==='flat-possible')distance+=0.5;
    if(opts.avoid?.has(row[2]))distance+=1.4;
    const next=cost+distance;
    if(next+1e-6<best[row[1]]){best[row[1]]=next;prior[row[1]]=eId;heap.push([next,row[1]]);}
   }
  }
  if(!Number.isFinite(best[destination]))return null;
  const ids=[],seen=new Set();let pos=destination;
  while(pos!==source&&ids.length<graph.edges.length){
   if(seen.has(pos))return null;seen.add(pos);
   const edgeId=prior[pos];if(edgeId<0)return null;
   const row=graph.edges[edgeId];ids.push(edgeId);pos=row[0];
  }
  if(pos!==source)return null;
  ids.reverse();
  const route={edgeIds:ids,minutes:best[destination],metres:ids.reduce((n,id)=>n+graph.edges[id][3],0)};
  if(!validateRoute(route,source,destination))return null;
  return route;
 }
 function validateRoute(path,start,finish){
  if(!graph||!path||!Array.isArray(path.edgeIds))return false;
  let at=start;
  for(const id of path.edgeIds){
   const e=graph.edges[id];if(!e||e[0]!==at)return false;at=e[1];
  }
  return at===finish;
 }
 function combine(a,b){
  if(!a||!b)return null;
  const edgeIds=[...a.edgeIds,...b.edgeIds];
  return{edgeIds,minutes:a.minutes+b.minutes,metres:a.metres+b.metres};
 }
 function labelFeature(row){
  const f=row[2]<0?null:graph.features[row[2]];
  if(!f)return{type:'transfer',code:'',name:row[4]==='village-walk'?'Loopoverstap tussen Going en Hartkaiserbahn':row[4]==='station-walk'?'Loopverbinding bij liftstation':'Pisteovergang op kaart',level:'unknown',confidence:row[4]};
  const level={novice:'blue',easy:'blue',intermediate:'red',advanced:'black',expert:'black'}[f.difficulty]||'unknown';
  return{type:f.kind,code:f.ref,name:f.name||'Piste '+(f.ref||'zonder nummer'),
   level,confidence:row[4],feature:row[2]};
 }
 function group(path,opts){
  const result=[];let previous=null;
  for(const edgeId of path.edgeIds){
   const e=graph.edges[edgeId],info=labelFeature(e);
   // A mapped vertex-to-vertex junction of 1-3m is not a separate
   // walking leg. Preserve its geometry and continuous graph nodes,
   // but don't invent one minute of skiing/walking per intersection.
   if(info.type==='transfer'&&e[3]<=3&&
      ['map-junction','map-crossing','station-access'].includes(info.confidence)){
    if(previous)previous.points.push(graph.nodes[e[1]].slice(0,2));
    continue;
   }
   const same=previous&&previous.type===info.type&&previous.feature===info.feature&&previous.confidence===info.confidence;
   if(same){previous.metres+=e[3];previous.to=e[1];previous.points.push(graph.nodes[e[1]].slice(0,2));}
   else{
    previous={...info,from:e[0],to:e[1],metres:e[3],points:[graph.nodes[e[0]].slice(0,2),graph.nodes[e[1]].slice(0,2)]};
    result.push(previous);
   }
  }
  for(const s of result){
   s.lengthKm=Math.round(s.metres)/1000;
   s.minutes=s.type==='lift'?Math.max(2,Math.ceil(metresToMin(s.metres,'lift',opts.speed)+4)):
    s.type==='piste'?Math.max(1,Math.ceil(metresToMin(s.metres,'piste',opts.speed)+0.5)):
    Math.max(1,Math.ceil(metresToMin(s.metres,'transfer',opts.speed)));
   s.label=(s.type==='lift'?'🚡 Lift ':s.type==='piste'?'⛷️ Piste ':'⇄ Overstap ')+
     (s.code?s.code+' · ':'')+s.name;
   s.detail=s.type==='transfer'?'Verbinding '+s.metres+' meter op de kaart. Controleer of deze overgang geopend en fysiek bereikbaar is.':
     'Kaartlijn '+s.metres+' m · '+(s.level!=='unknown'?s.level:'kleur niet bevestigd')+
     ' · Bron: OpenSkiData/OSM; geen live lift-/pistestatus';
  }
  return result;
 }
 function routeSummary(groups){
  return groups.map(s=>({from:s.from,to:s.to,code:s.code,type:s.type,minutes:s.minutes,label:s.label,
   metres:s.metres,feature:s.feature,confidence:s.confidence}));
 }
 function makePlan(options,segments,lunchLabel,startTime,limit,margin){
  const plannedEnd=clock(options.returnTime||'16:00'),result={
   ok:false,reason:'',date:options.date||'',startPoint:options.start,endPoint:options.finish,
   departure:options.departure||'09:00',returnTime:options.returnTime||'16:00',
   safeArrival:hhmm(limit),margin,useLunch:options.useLunch!==false,
   lunchRestaurant:lunchLabel||'',lunchMinutes:options.useLunch!==false?Number(options.lunchDuration??60):0,
   sections:[],notes:[],wishes:options.wishes||[],morningBreak:!!options.morningBreak,afternoonBreak:!!options.afternoonBreak};
  let at=startTime;const itinerary=[];
  function insert(type,label,duration,detail='',rest={}){
   const minutes=Math.round(duration);if(minutes<=0)return;
   const row={type,label,start:hhmm(at),end:hhmm(at+minutes),startMinute:at,endMinute:at+minutes,minutes,detail,...rest};
   at+=minutes;itinerary.push(row);result.sections.push(row);
  }
  const addRoute=(path,phase)=>{
   for(const step of group(path,options)){insert(step.type,step.label,step.minutes,step.detail,
    {phase,code:step.code,level:step.level,from:step.from,to:step.to,feature:step.feature,
     lengthKm:step.lengthKm,coordinates:step.points,confidence:step.confidence});}
  };
  const lunchAt=clock(options.lunchTime||'12:30');
  addRoute(segments.pre,'Voor de lunch');
  if(options.morningBreak)insert('break','Ochtendpauze',clamp(Number(options.morningDuration??30),5,120),'Pauze bij het laatst bereikte punt van de route.');
  if(result.useLunch){
   if(at>lunchAt){result.reason='De aaneengesloten route bereikt de lunchlocatie te laat.';return{plan:result,itinerary};}
   insert('break','Reserve vóór lunch',lunchAt-at,'Geen fictieve pistes ingevuld; ruimte voor wachttijden en korte pauze.');
   insert('lunch',lunchLabel,Number(options.lunchDuration??60),'Controleer openingstijd en de exacte ligging van het restaurant.');
  }
  addRoute(segments.post,'Na de lunch');
  if(options.afternoonBreak)insert('break','Middagpauze',clamp(Number(options.afternoonDuration??30),5,120),'Pauze bij het laatst bereikte punt vóór de terugweg.');
  addRoute(segments.back,'Terugweg');
  if(at>limit){result.reason='De aaneengesloten piste- en liftroute past niet vóór de veilige terugkeertijd.';return{plan:result,itinerary};}
  insert('return','Reserve na aankomst',limit-at,'Werkelijke reistijden en liftwachtrijen kunnen afwijken; reserve is geen extra piste.');
  insert('buffer','Veiligheidsmarge',plannedEnd-at,'Zorg uiterlijk '+hhmm(limit)+' bij het eindpunt te zijn.');
  result.ok=true;
  result.notes.push('Route volgt aaneengesloten OpenSkiData/OSM-lijnen; de getekende knooppunten zijn geen door SkiWelt bevestigde overstappen.');
  return{plan:result,itinerary};
 }
 function build(options={},closures=[]){
  if(!graph)return{ok:false,reason:'Kaartnetwerk nog niet geladen. Probeer opnieuw.'};
  const begin=clock(options.departure||'09:00'),end=clock(options.returnTime||'16:00');
  const useLunch=options.useLunch!==false,lunchClock=clock(options.lunchTime||'12:30');
  const margin=options.useSafety===false?0:clamp(Number(options.safetyMarginMin??30),0,120);
  const limit=end-margin,opts={skill:options.skill||'red',speed:options.speed||'normal',allowBlack:options.allowBlack===true};
  if(begin===null||end===null||begin>=limit-45||useLunch&&
     (lunchClock===null||lunchClock<705||lunchClock>795||!Number.isInteger(Number(options.lunchDuration??60))||
      Number(options.lunchDuration??60)<30||Number(options.lunchDuration??60)>120))
   return{ok:false,reason:'Ongeldige vertrek-, lunch- of terugkeertijd.'};
  const start=graph.stations[options.start]?.node,finish=graph.stations[options.finish]?.node;
  if(!Number.isInteger(start)||!Number.isInteger(finish))return{ok:false,reason:'Start- of eindstation ontbreekt in het geografische liftnetwerk.'};
  const wanted=Array.isArray(options.wishes)?options.wishes.filter(Boolean):[];
  const peaks={'top:salve':'Hohe Salve','top:hartkaiser':'Hartkaiser bergstation','top:brandstadl':'Brandstadl bergstation'};
  const targetWishlist=wanted.filter(x=>x.startsWith('top:'));
  for(const wish of wanted)if(!peaks[wish]&&!/^(?:piste|lift):\d+[a-z]?$/.test(wish))
   return{ok:false,reason:'Gewenste piste of bergtop is nog niet als exact kaartknooppunt beschikbaar: '+wish};
  const selectedTarget=targetWishlist.length?graph.stations[peaks[targetWishlist[0]]]?.node:null;
  if(targetWishlist.length&&selectedTarget===undefined)return{ok:false,reason:'Gewenste bergtop heeft nog geen volledige aansluiting in het netwerk.'};
  // Candidate huts are near known lift stations. Without verified restaurant
  // coordinates, do NOT claim that the chosen lift station is the hut entrance.
  const rest=String(options.lunchRestaurantLabel||'');
  const restaurantPairs=[
   [/brandstadl|tanzboden|kummereralm|jochstub/i,'Brandstadl bergstation'],
   [/hohe salve|gipfelalm|gipfelrestaurant/i,'Hohe Salve'],
   [/kaiserlounge|hartkaiser|rübezahl/i,'Hartkaiser bergstation'],
   [/hochbrixen|brantlalm|filzalm|skiwelt hütte/i,'Brixen dalstation'],
   [/kraftalm|salvista/i,'Itter dalstation']
  ];
  let requestedLunch=null;
  if(rest){
   const mapped=restaurantPairs.find(([pattern])=>pattern.test(rest));
   if(!mapped)return{ok:false,reason:'De exacte aansluiting naar '+rest+' is nog niet bekend; ik geef geen verzonnen lunchroute.'};
   requestedLunch=graph.stations[mapped[1]]?.node;
  }
  const candidates=useLunch?(requestedLunch!==null?[requestedLunch]:
   ['Hartkaiser bergstation','Brandstadl bergstation','Hohe Salve',
    'Hopfgarten tussenstation','Brixen dalstation','Söll dalstation']
   .map(x=>graph.stations[x]?.node).filter(Number.isInteger)):[start];
  const scenic=['Brandstadl bergstation','Hartkaiser bergstation','Hohe Salve','Hopfgarten tussenstation',
   'Brixen dalstation','Söll dalstation'].map(x=>graph.stations[x]?.node).filter(Number.isInteger);
  const breakMinutes=(options.morningBreak?Number(options.morningDuration??30):0)+(options.afternoonBreak?Number(options.afternoonDuration??30):0);
  const direct=shortest(start,finish,opts,closures);
  if(!direct)return{ok:false,reason:'Geen aaneengesloten kaartverbinding tussen deze stations. De planner verzint geen pistes of liften.'};
  const bestOptions=[];
  const firstStops=selectedTarget!==null?[selectedTarget]:[null,...scenic];
  for(const lunch of candidates)for(const beforeTarget of firstStops){
   let before=shortest(start,beforeTarget??lunch,opts,closures);
   if(!before)continue;
   if(beforeTarget!==null){const a=shortest(beforeTarget,lunch,opts,closures);before=combine(before,a);}
   if(!before)continue;
   const beforeGroups=group(before,opts),beforeMin=beforeGroups.reduce((n,s)=>n+s.minutes,0);
   if(useLunch&&begin+beforeMin+Math.max(10,options.morningBreak?Number(options.morningDuration??30):0)>lunchClock)continue;
   for(const afterTarget of [null,...scenic]){
    let post=shortest(lunch,afterTarget??finish,opts,closures);
    if(!post)continue;
    let back={edgeIds:[],minutes:0,metres:0};
    if(afterTarget!==null){back=shortest(afterTarget,finish,opts,closures);if(!back)continue;}
    const postMin=group(post,opts).reduce((n,s)=>n+s.minutes,0);
    const backMin=group(back,opts).reduce((n,s)=>n+s.minutes,0);
    const afterTime=(useLunch?lunchClock+Number(options.lunchDuration??60):begin+beforeMin)+postMin+backMin;
    if(afterTime+breakMinutes>limit)continue;
    const all=[...before.edgeIds,...post.edgeIds,...back.edgeIds];
    if(!all.length)continue;
    const chain={edgeIds:all};
    if(!validateRoute(chain,start,finish))continue;
    const grouped=group(chain,opts);
    const distinctRuns=new Set(grouped.filter(x=>x.type==='piste').map(x=>x.code).filter(Boolean));
    const distinctLifts=new Set(grouped.filter(x=>x.type==='lift').map(x=>x.code).filter(Boolean));
    const duplicates=grouped.length-distinctRuns.size-distinctLifts.size;
    const skiMin=beforeMin+postMin+backMin;
    let score=options.style==='fast'?-skiMin:
      distinctRuns.size*5+distinctLifts.size*6+Math.min(240,skiMin)*.20-duplicates*2;
    if(beforeTarget!==null)score+=12;
    if(afterTarget!==null)score+=8;
    if(selectedTarget!==null&&beforeTarget===selectedTarget)score+=100;
    const ids=new Set(grouped.map(x=>x.type+':'+x.code));
    if(wanted.some(w=>/^(?:piste|lift):/.test(w)&&!ids.has(w)))continue;
    bestOptions.push({lunch,before,post,back,score,grouped,skiMin});
   }
  }
  bestOptions.sort((a,b)=>b.score-a.score||a.skiMin-b.skiMin);
  const chosen=bestOptions[0];
  if(!chosen)return{ok:false,reason:'Geen volledige route met alle gewenste pistes, lunch en terugweg binnen de beschikbare tijd. Er zijn geen aansluitingen overgeslagen.'};
  const lunchName=useLunch?(rest?'Lunch bij '+rest+' (exacte huttoegang controleren)':
   'Lunchstop bij liftstation (restaurant nog kiezen)'):'';
  const made=makePlan(options,{pre:chosen.before,post:chosen.post,back:chosen.back},lunchName,begin,limit,margin);
  if(!made.plan.ok)return{ok:false,reason:made.plan.reason};
  const path={edgeIds:[...chosen.before.edgeIds,...chosen.post.edgeIds,...chosen.back.edgeIds]};
  const steps=chosen.grouped;
  const notes=[
   '⚠️ Geo-kaartverbindingen komen uit OpenSkiData/OpenStreetMap, niet uit GPS-ijkpunten of een door SkiWelt goedgekeurde kruisingentabel.',
   '⚠️ Lift- en pistestatus en sluitingstijden zijn nog niet live gecontroleerd. Volg altijd de officiële pisteborden.',
   '⚠️ Terreinhoogtes zijn afgeleid uit een 90 m hoogtemodel; voor kleine paden en kruisingen kan de richting afwijken.'
  ];
  if(steps.some(s=>s.type==='transfer'))notes.push('⚠️ '+steps.filter(s=>s.type==='transfer').length+' kaartovergangen zijn slechts op afstand gekoppeld. Controleer deze overstappen ter plaatse.');
  if(steps.some(s=>s.confidence==='village-walk'))notes.push('⚠️ Going–Ellmau: circa 80 meter aparte loopoverstap. SkiWelt bevestigt de gebiedsroute, niet deze exacte looproute; oversteek ter plaatse controleren.');
  if(steps.some(s=>s.level==='unknown'&&s.type==='piste'))notes.push('⚠️ Een of meer pistekleuren zijn niet bevestigd. Controleer of het niveau geschikt is.');
  const allItinerary=made.itinerary;
  const total=allItinerary.filter(x=>x.type==='lift'||x.type==='piste');
  const pisteKm=total.filter(x=>x.type==='piste').reduce((n,s)=>n+Number(s.lengthKm||0),0);
  const liftKm=total.filter(x=>x.type==='lift').reduce((n,s)=>n+Number(s.lengthKm||0),0);
  const itinerary={steps:allItinerary,pois:[],warnings:notes,missingSteps:[],unverifiedTransitions:[],
   routeMinutes:total.reduce((n,s)=>n+s.minutes,0),
   liftMinutes:total.filter(s=>s.type==='lift').reduce((n,s)=>n+s.minutes,0),
   pisteMinutes:total.filter(s=>s.type==='piste').reduce((n,s)=>n+s.minutes,0),
   pisteKm,liftKm,distanceFromGeometry:true};
  const route={ok:true,steps:[{from:options.start,to:options.finish,via:'Volledige geografische route: '+steps.filter(x=>x.type==='lift').length+
    ' liften, '+steps.filter(x=>x.type==='piste').length+' pisteonderdelen en '+steps.filter(x=>x.type==='transfer').length+' overstappen',
   minutes:itinerary.routeMinutes}],notes,estimated:true,graphBased:true,
   phases:{preLunch:chosen.before,postLunch:chosen.post,return:chosen.back},
   coordinates:[graph.nodes[start].slice(0,2),...path.edgeIds.map(i=>graph.nodes[graph.edges[i][1]].slice(0,2))],
   returnEstimate:group(chosen.back,opts).reduce((n,s)=>n+s.minutes,0)};
  return{ok:true,plan:made.plan,itinerary,route,path,features:steps,
   graphBased:true,notes,options};
 }
 return{initialize,load,build,shortest,validateRoute,group,clock,hhmm,closureSet};
});
