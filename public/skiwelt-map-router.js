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
 // Modelled moving speeds, not guaranteed or live lift-specific times.
 // Faster modern lifts get a smaller ride estimate; slow drag lifts do not.
 const liftMetresPerMinute=type=>{
  if(/gondola|cable_car|funicular/i.test(type||''))return 300;
  if(/chair/i.test(type||''))return 270;
  if(/drag|platter|t.bar|rope.tow/i.test(type||''))return 170;
  if(/magic.carpet|conveyor/i.test(type||''))return 55;
  return 240;
 };
 const metresToMin=(metres,kind,speed,liftType='')=>{
  if(kind==='lift')return metres/liftMetresPerMinute(liftType);
  if(kind==='transfer')return metres/65+0.5;
  const velocity={easy:145,normal:250,sporty:350}[speed]||250;
  return metres/velocity;
 };
 // Only researched, named lift-station complexes may get a short
 // walking/poling bridge. A generic nearby lift is NEVER connected on distance
 // alone (crossing lines, cliffs and blocked passages are not ski connections).
 const AUDITED_LOCAL_TRANSFERS=Object.freeze([
  {a:'lift:8:top',b:'lift:1:top',source:'SkiWelt Hochbrixen official lift map and local map station coordinates',status:'provisional'},
  {a:'lift:12:top',b:'lift:1:bottom',source:'SkiWelt official Brixen/Westendorf connection: Sonnenlift 12 to Hochbrixen gondola 1',status:'official-area-connection'},
  {a:'lift:12:top',b:'lift:11:bottom',source:'SkiWelt Hochbrixen station geometry; alternative SkiWeltbahn boarding',status:'provisional'},
  {a:'lift:1:bottom',b:'lift:11:bottom',source:'SkiWelt official Hochbrixen and SkiWeltbahn station positions',status:'provisional'}
 ]);
 function auditedWalkEdges(data){
  const out=[],rejected=[];
  for(const entry of AUDITED_LOCAL_TRANSFERS){
   const a=data.stations?.[entry.a],b=data.stations?.[entry.b];
   if(!a||!b){rejected.push({...entry,reason:'station missing'});continue;}
   const pointA=data.nodes[a.node],pointB=data.nodes[b.node];
   if(!pointA||!pointB){rejected.push({...entry,reason:'coordinates missing'});continue;}
   const lat=(pointA[1]+pointB[1])/2*Math.PI/180;
   const metres=Math.round(Math.hypot((pointA[0]-pointB[0])*111320*Math.cos(lat),(pointA[1]-pointB[1])*111320));
   const gain=Math.round(pointB[2]-pointA[2]);
   if(metres>130||metres<8||Math.abs(gain)>12){
    rejected.push({...entry,metres,gain,reason:'distance or terrain-height check failed'});continue;
   }
   const fwd=[a.node,b.node,-1,metres,'walk-pole'];
   const rev=[b.node,a.node,-1,metres,'walk-pole'];
   out.push({entry,metres,gain,edges:[fwd,rev]});
  }
  return{out,rejected};
 }
 function initialize(data){
  if(!data||data.version!==1||!Array.isArray(data.nodes)||!Array.isArray(data.edges)||
     data.nodes.length<1000||!data.stations)throw Error('SkiWelt-kaartnetwerk ontbreekt of is onjuist.');
  const audit=auditedWalkEdges(data);
  graph={...data,edges:[...data.edges,...audit.out.flatMap(pair=>pair.edges)],
   localTransferAudit:{accepted:audit.out.map(({entry,metres,gain})=>({
    from:entry.a,to:entry.b,metres,heightDelta:gain,source:entry.source,status:entry.status
   })),rejected:audit.rejected}};
  adj=Array.from({length:graph.nodes.length},()=>[]);
  for(let i=0;i<graph.edges.length;i++){
   const [a,b,f,m]=graph.edges[i];
   if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=adj.length||b>=adj.length||
      !Number.isInteger(f)||f>=graph.features.length||m<0||m>16000)throw Error('Kaartnetwerk heeft een ongeldige verbinding '+i);
   adj[a].push(i);
  }
  return{nodes:graph.nodes.length,edges:graph.edges.length,stations:Object.keys(graph.stations).length,localTransferAudit:graph.localTransferAudit};
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
  if(feature.kind==='lift')return opts.noLifts!==true;
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
    const feature=row[2]===-1?null:graph.features[row[2]];
    let distance=metresToMin(row[3],kind,opts.speed,feature?.liftType);
    // Boarding overhead is included in the first lift segment, not every vertex.
    if(kind==='lift')distance+=0.15;
    if(kind==='transfer')distance+=row[4]==='walk-pole'?Math.max(2,Math.ceil(row[3]/35)):row[3]<=3?0.015:row[4]==='station-walk'||row[4]==='village-walk'?1.7:0.35;
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
  if(!f)return{type:'transfer',code:'',name:row[4]==='walk-pole'?'Korte loop-/prikoverstap (kaartlocaties gecontroleerd)':row[4]==='village-walk'?'Loopoverstap tussen Going en Hartkaiserbahn':row[4]==='station-walk'?'Loopverbinding bij liftstation':'Pisteovergang op kaart',level:'unknown',confidence:row[4]};
  const level={novice:'blue',easy:'blue',intermediate:'red',advanced:'black',expert:'black'}[f.difficulty]||'unknown';
  return{type:f.kind,code:f.ref,name:f.name||(f.ref?'Piste '+f.ref:'nummer niet vastgelegd in kaartbron'),
   level,confidence:row[4],feature:row[2]};
 }
 function labelUnverifiedMapFragments(segments){
  for(let i=0;i<segments.length;i++){
   const step=segments[i];if(step.type!=='piste'||step.code)continue;
   const neighboring=direction=>{
    for(let j=i+direction;j>=0&&j<segments.length;j+=direction){
     const p=segments[j];
     if(p.type==='lift'||p.type==='transfer'&&p.metres>3)return null;
     if(p.type==='piste'&&p.code)return p;
    }
    return null;
   };
   const prev=neighboring(-1),next=neighboring(1);
   if(prev&&next&&prev.code===next.code&&step.metres<=180){
    step.displayCode=prev.code;
    step.numberStatus='inferred-neighbors';
    step.label='⛷️ Aansluitend deel piste '+prev.code+' (nummer controleren)';
    step.detail+=' Nummer gebaseerd op gelijk genummerde aangrenzende kaartdelen, nog niet onafhankelijk bevestigd.';
   }else{
    step.numberStatus='unverified';
    const neighbor=prev?.code||next?.code;
    step.label='⇄ Pisteverbinding'+(neighbor?' bij '+neighbor:'')+' (nummer te controleren)';
    step.detail+=' De afzonderlijke kaartlijn heeft geen eigen pistennummer; deze is niet verzonnen.';
   }
  }
  return segments;
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
    if(previous){previous.points.push(graph.nodes[e[1]].slice(0,2));previous.to=e[1];}
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
   s.heightDelta=Math.round((graph.nodes[s.to]?.[2]||0)-(graph.nodes[s.from]?.[2]||0));
   s.minutes=s.type==='lift'?Math.max(2,Math.ceil(metresToMin(s.metres,'lift',opts.speed,graph.features[s.feature]?.liftType)+2)):
    s.type==='piste'?Math.max(1,Math.ceil(metresToMin(s.metres,'piste',opts.speed)+0.5)):
    s.confidence==='walk-pole'?Math.max(3,Math.ceil(s.metres/30)+2):
    Math.max(1,Math.ceil(metresToMin(s.metres,'transfer',opts.speed)));
   // SkiWelt's official piste listing gives 20a as 3,293m. The OSM
   // way is shorter; do not underestimate a final red valley descent.
   if(s.type==='piste'&&s.code==='20a'&&s.metres>1500)s.minutes=Math.max(20,s.minutes);
   s.label=(s.type==='lift'?'🚡 Lift ':s.type==='piste'?'⛷️ Piste ':s.confidence==='walk-pole'?'🚶 Loop/prik ':'⇄ Overstap ')+
     (s.code?s.code+' · ':'')+s.name;
   s.detail=s.confidence==='walk-pole'?
    'Loop/prik '+s.metres+' m; hoogteverschil '+(s.heightDelta>=0?'+':'')+s.heightDelta+' m (hoogte geschat). Rustig rekenen: '+s.minutes+' min. Op kaart gecontroleerd, fysieke doorgang niet overal officieel bevestigd. Volg de borden.':
    s.type==='lift'?'Lift '+s.metres+' m · circa '+s.minutes+' min inclusief 2 min voor instappen en een korte wachtrij. Bij drukte langer; geen live wachttijd of sluitingscontrole.':
     s.type==='transfer'?'Verbinding '+s.metres+' meter op de kaart. Controleer of deze overgang geopend en fysiek bereikbaar is.':
     'Kaartlijn '+s.metres+' m · '+(s.level!=='unknown'?s.level:'kleur niet bevestigd')+
     ' · Bron: OpenSkiData/OSM; geen live lift-/pistestatus';
  }
  return labelUnverifiedMapFragments(result);
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
    {phase,code:step.code,displayCode:step.displayCode||step.code,numberStatus:step.numberStatus||'source',level:step.level,heightDelta:step.heightDelta,from:step.from,to:step.to,feature:step.feature,
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
 const hopfgartenPresets=Object.freeze({
  salve:{label:'Hohe Salve, Itter & Schernthann',morning:['Hohe Salve','lift:30:middle1','lift:24:top','Hohe Salve'],afternoon:['lift:24:top','lift:23:top'],lunch:'Hohe Salve'},
  foisching:{label:'Foisching, Brixen, Hochsöll & Rigi',morning:['lift:25:top','lift:7:top','lift:40:top'],afternoon:['lift:23:top','lift:25:top'],lunch:'lift:20:top'},
  itter:{label:'Itter, Brixen & KRAFTalm',morning:['lift:30:middle1','lift:1:top','lift:7:top'],afternoon:['Hohe Salve','lift:22:top'],lunch:'lift:30:middle1'}
 });
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
  // Each full-day choice reuses the same station-to-station Dijkstra results.
  // On mobile this avoids hundreds of redundant graph searches.
  const routeCache=new Map(),groupCache=new Map();
  const find=(a,b)=>{
   const key=a+'|'+b;
   if(!routeCache.has(key))routeCache.set(key,shortest(a,b,opts,closures));
   return routeCache.get(key);
  };
  const groupsFor=route=>{
   const key=route.edgeIds.join(',');
   if(!groupCache.has(key))groupCache.set(key,group(route,opts));
   return groupCache.get(key);
  };
  const start=graph.stations[options.start]?.node,finish=graph.stations[options.finish]?.node;
  const hopMid=graph.stations['lift:20:top']?.node,hopValley=graph.stations['Hopfgarten dalstation']?.node;
  const isHopfgarten=options.start==='Hopfgarten dalstation'&&
   (options.finish==='Hopfgarten dalstation'||options.finish==='Hopfgarten tussenstation'||options.finish==='lift:20:top');
  const explicitMiddle=isHopfgarten&&options.finish!=='Hopfgarten dalstation';
  const midRequested=explicitMiddle||options.hopfgartenEndMode==='middle';
  const endMode=isHopfgarten?(midRequested?'middle':'valley'):'normal';
  const preset=isHopfgarten?hopfgartenPresets[options.routePreset]||null:null;
  const descentOpts={...opts,noLifts:true};
  // Honour a manually chosen middle station exactly; Salvenbahn I upper and
  // Salvenbahn II lower stations are nearby but distinct physical coordinates.
  const routeFinish=isHopfgarten?(explicitMiddle?finish:hopMid):finish;
  const valleyDescent=isHopfgarten&&Number.isInteger(routeFinish)&&Number.isInteger(hopValley)?
   shortest(routeFinish,hopValley,descentOpts,closures):null;
  const descentLegs=valleyDescent?group(valleyDescent,opts):[];
  const descentIsValid=descentLegs.some(s=>s.type==='piste'&&s.code==='20a')&&
   descentLegs.every(s=>s.type!=='lift')&&
   descentLegs.at(-1)?.code==='20a';
  const validDescent=descentIsValid?valleyDescent:null;
  if(endMode==='valley'&&!validDescent)return {ok:false,
   reason:'De laatste afdaling via piste 20a is niet aantoonbaar bereikbaar of is als gesloten gemeld. Kies het middenstation als eindpunt en controleer het vervoer naar het dal.'};
  const optionalDescent={available:!!validDescent,required:endMode==='valley',
   departureStation:'Salvenbahn I middenstation',arrivalStation:'Hopfgarten dalstation',
   piste:'20a',minutes:validDescent?descentLegs.reduce((n,s)=>n+s.minutes,0):0,
   steps:validDescent?descentLegs:[],reason:validDescent?
   'Piste 20a is kaarttechnisch bereikbaar zonder een lift. Alleen mogelijk als de piste daadwerkelijk open en veilig is.':
   'Piste 20a is niet beschikbaar in de huidige kaart- en sluitingsgegevens; voor het dal is mogelijk nog een lift nodig.'};
  const endReserve=endMode==='middle'&&validDescent?Math.max(30,optionalDescent.minutes+10):0;
  const routeLimit=limit-endReserve;
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
  // Restaurant stops are paired with a nearby mapped lift station, not a
  // fabricated exact entrance; the user sees this uncertainty.
  const restaurantPairs=[
   [/kraftalm/i,'lift:30:middle1','KRAFTalm · Salvistabahn tussenstation'],
   [/tanzboden/i,'lift:99:top','Tanzbodenalm · bij Tanzbodenbahn'],
   [/brandstadl/i,'Brandstadl bergstation','Bergrestaurant Brandstadl'],
   [/kummereralm/i,'lift:69:top','Kummereralm · Kummereralmbahn'],
   [/jochstub/i,'lift:6:top','Jochstubn · Jochbahn'],
   [/au alm/i,'lift:71:top','Au Alm · Aualmbahn'],
   [/hohe salve|gipfelalm|gipfelrestaurant/i,'Hohe Salve','Gipfelrestaurant Hohe Salve'],
   [/kaiserlounge|hartkaiser|rübezahl/i,'Hartkaiser bergstation','Kaiserlounge · Hartkaiser'],
   [/filzalm|skiwelt hütte|brantlalm|hochbrixen/i,'lift:1:top','Hochbrixen · restaurantomgeving'],
   [/hochsöll|gründlalm|stöcklalm/i,'lift:40:top','Hochsöll · restaurantomgeving'],
   [/salvenalm/i,'lift:20:top','Salvenalm · Salvenbahn I'],
   [/talkaser/i,'lift:114:top','Bergrestaurant Talkaser'],
   [/choralpe/i,'lift:112:top','Panorama Restaurant Choralpe'],
   [/salvista/i,'lift:30:middle1','KRAFTalm · Salvistabahn tussenstation']
  ];
  let requestedLunch=null;
  if(rest){
   const mapped=restaurantPairs.find(([pattern])=>pattern.test(rest));
   if(!mapped)return{ok:false,reason:'De aansluiting naar '+rest+' is nog niet aan een passend liftstation gekoppeld.'};
   requestedLunch=graph.stations[mapped[1]]?.node;
   if(!Number.isInteger(requestedLunch))return{ok:false,reason:'Liftstation bij '+rest+' ontbreekt in de kaartgrafiek.'};
  }
  // No restaurant name is invented: automatic choices are sourced from huts
  // mentioned in the SkiWelt catalogue near mapped lift boarding points.
  const lunchLabels=new Map();
  for(const [,station,title] of restaurantPairs){
   const id=graph.stations[station]?.node;
   if(Number.isInteger(id)&&!lunchLabels.has(id))lunchLabels.set(id,title);
  }
  const autoStations=['Brandstadl bergstation','Hartkaiser bergstation','Hohe Salve',
   'lift:30:middle1','lift:40:top','lift:112:top','lift:114:top'];
  const autoLunch=autoStations.map(id=>graph.stations[id]?.node).filter(id=>Number.isInteger(id)&&lunchLabels.has(id));
  const presetLunch=preset?graph.stations[preset.lunch]?.node:null;
  const candidates=useLunch?(requestedLunch!==null?[requestedLunch]:
   Number.isInteger(presetLunch)?[presetLunch]:autoLunch):[start];
  const scenic=['Brandstadl bergstation','Hartkaiser bergstation','Hohe Salve','Hopfgarten tussenstation',
   'Brixen dalstation','Söll dalstation'].map(x=>graph.stations[x]?.node).filter(Number.isInteger);
  const breakMinutes=(options.morningBreak?Number(options.morningDuration??30):0)+(options.afternoonBreak?Number(options.afternoonDuration??30):0);
  const direct=isHopfgarten?find(start,routeFinish):find(start,finish);
  if(preset&&[...preset.morning,...preset.afternoon,preset.lunch].some(station=>!graph.stations[station]))
   return{ok:false,reason:'De gekozen dagroute heeft een niet gevonden liftstation in de kaart. De app mag dit niet overslaan.'};
  if(!direct)return{ok:false,reason:'Geen aaneengesloten kaartverbinding tussen deze stations. De planner verzint geen pistes of liften.'};
  const bestOptions=[];
  const firstStops=preset?[null]:
   selectedTarget!==null?[selectedTarget]:[null,...scenic];
  for(const lunch of candidates)for(const beforeTarget of firstStops){
   let before;
   if(preset){
    before={edgeIds:[],minutes:0,metres:0};
    let at=start;
    for(const stationName of preset.morning){
     const next=graph.stations[stationName].node,leg=find(at,next);
     if(!leg){before=null;break;}
     before=combine(before,leg);at=next;
    }
    if(before)before=combine(before,find(at,lunch));
   }else{
    before=find(start,beforeTarget??lunch);
    if(beforeTarget!==null&&before)before=combine(before,find(beforeTarget,lunch));
   }
   if(!before)continue;
   const beforeGroups=groupsFor(before,opts),beforeMin=beforeGroups.reduce((n,s)=>n+s.minutes,0);
   if(useLunch&&begin+beforeMin+Math.max(10,options.morningBreak?Number(options.morningDuration??30):0)>lunchClock)continue;
   const afterStops=preset?[null]:[null,...scenic];
   for(const afterTarget of afterStops){
    let post,back;
    if(isHopfgarten){
     // Preset tour legs are actual directed geometric segments, never shortcuts.
     if(preset){
      post={edgeIds:[],minutes:0,metres:0};
      let at=lunch;
      for(const stationName of preset.afternoon){
       const next=graph.stations[stationName].node,leg=find(at,next);
       if(!leg){post=null;break;}
       post=combine(post,leg);at=next;
      }
      // The return via Brixen may use lifts. Only the final piste 20a descent is lift-free.
       back=post?find(at,routeFinish):null;
     }else{
      post=afterTarget===null?{edgeIds:[],minutes:0,metres:0}:find(lunch,afterTarget);
      back=find(afterTarget===null?lunch:afterTarget,routeFinish);
     }
     if(!post||!back)continue;
     if(endMode==='valley')back=combine(back,validDescent);
    }else{
     post=find(lunch,afterTarget??finish);
     if(!post)continue;
     back={edgeIds:[],minutes:0,metres:0};
     if(afterTarget!==null){back=find(afterTarget,finish);if(!back)continue;}
    }
    const postMin=groupsFor(post,opts).reduce((n,s)=>n+s.minutes,0);
    const backMin=groupsFor(back,opts).reduce((n,s)=>n+s.minutes,0);
    const afterTime=(useLunch?lunchClock+Number(options.lunchDuration??60):begin+beforeMin)+postMin+backMin;
    if(afterTime+breakMinutes>routeLimit)continue;
    const all=[...before.edgeIds,...post.edgeIds,...back.edgeIds];
    if(!all.length)continue;
    const chain={edgeIds:all};
    if(!validateRoute(chain,start,endMode==='valley'?hopValley:routeFinish))continue;
    const grouped=groupsFor(chain,opts);
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
   'Lunch bij '+(lunchLabels.get(chosen.lunch)||'restaurantomgeving')+' (exacte toegang controleren)'):'';
  const planOptions=endMode==='middle'?{...options,finish:'Salvenbahn I middenstation (Hopfgarten)'}:options;
  const made=makePlan(planOptions,{pre:chosen.before,post:chosen.post,back:chosen.back},
   lunchName,begin,routeLimit,margin+endReserve);
  if(!made.plan.ok)return{ok:false,reason:made.plan.reason};
  const path={edgeIds:[...chosen.before.edgeIds,...chosen.post.edgeIds,...chosen.back.edgeIds]};
  // Store exact graph edges in output: generated local walk links are appended
  // to the in-memory graph and therefore are absent from the shipped JSON.
  // Consumers must validate against these edges, not raw JSON indexes.
  path.edgeSegments=path.edgeIds.map(id=>graph.edges[id].slice());
  const steps=chosen.grouped;
  const notes=[
   ...(isHopfgarten?['Hopfgarten: de volledige terugweg eindigt '+(endMode==='valley'?'na piste 20a in het dal.':'bij het middenstation van Salvenbahn I.'),
    'Piste 20a kan zonder lift worden geskied, mits de piste daadwerkelijk open is.']:[]),
   '⚠️ Geo-kaartverbindingen komen uit OpenSkiData/OpenStreetMap, niet uit GPS-ijkpunten of een door SkiWelt goedgekeurde kruisingentabel.',
   '⚠️ Lift- en pistestatus en sluitingstijden zijn nog niet live gecontroleerd. Volg altijd de officiële pisteborden.',
   '⚠️ Terreinhoogtes zijn afgeleid uit een 90 m hoogtemodel; voor kleine paden en kruisingen kan de richting afwijken.'
  ];
  if(steps.some(s=>s.type==='transfer'))notes.push('⚠️ '+steps.filter(s=>s.type==='transfer').length+' kaartovergangen zijn slechts op afstand gekoppeld. Controleer deze overstappen ter plaatse.');
  if(steps.some(s=>s.confidence==='walk-pole'))notes.push('Loop-/prikoverstappen zijn beperkt tot afzonderlijk gecontroleerde liftstationparen; ze volgen kaartgegevens, maar de exacte toegestane doorgang is niet voor elk paar officieel bevestigd.');
  if(steps.some(s=>s.confidence==='village-walk'))notes.push('⚠️ Going–Ellmau: circa 80 meter aparte loopoverstap. SkiWelt bevestigt de gebiedsroute, niet deze exacte looproute; oversteek ter plaatse controleren.');
  if(steps.some(s=>s.level==='unknown'&&s.type==='piste'))notes.push('⚠️ Een of meer pistekleuren zijn niet bevestigd. Controleer of het niveau geschikt is.');
  const unnamedPistes=steps.filter(s=>s.type==='piste'&&!s.code);
  const flatPistes=steps.filter(s=>s.type==='piste'&&s.confidence==='flat-possible');
  const uncertainTransfers=steps.map((step,index)=>({step,index})).filter(({step})=>
   step.type==='transfer'&&(step.metres>18||step.confidence==='village-walk'));
  if(unnamedPistes.length)notes.push('⚠️ '+unnamedPistes.length+' pisteonderdelen zonder bevestigd nummer in de kaartbron. Deze stukken volgen de lijngeometrie, maar zijn geen officieel gecontroleerde piste-identificatie.');
  if(flatPistes.length)notes.push('⚠️ '+flatPistes.length+' korte vlakke/hoogte-onzekere lijnstukken. Richting en kruisingen zijn hier niet onafhankelijk bevestigd.');
  if(uncertainTransfers.length)notes.push('⚠️ '+uncertainTransfers.length+' overstappen langer dan 18 meter vragen extra controle op de officiële pistekaart.');
  if(endMode==='valley')notes.push('Piste 20a is volgens SkiWelt een rode dalafdaling van 3.293 meter. De kaartgeometrie beschrijft slechts een deel van de lijn: tijd en afstand blijven indicatief.');

  const allItinerary=made.itinerary;
  const total=allItinerary.filter(x=>x.type==='lift'||x.type==='piste');
  const pisteKm=total.filter(x=>x.type==='piste').reduce((n,s)=>n+Number(s.lengthKm||0),0);
  const liftKm=total.filter(x=>x.type==='lift').reduce((n,s)=>n+Number(s.lengthKm||0),0);
  const itinerary={steps:allItinerary,pois:[],warnings:notes,missingSteps:[],
   unverifiedTransitions:uncertainTransfers.map(({step,index})=>({
    corridor:'Kaartovergang '+(index+1),
    from:steps[index-1]?.code||steps[index-1]?.name||'onbekend',
    to:steps[index+1]?.code||steps[index+1]?.name||'onbekend',
    reason:'De kaartlijnen liggen '+step.metres+' m uit elkaar (type '+step.confidence+'). Of deze doorgang geopend en ski-bereikbaar is, is niet officieel bevestigd.'
   })),
   routeMinutes:total.reduce((n,s)=>n+s.minutes,0),
   liftMinutes:total.filter(s=>s.type==='lift').reduce((n,s)=>n+s.minutes,0),
   pisteMinutes:total.filter(s=>s.type==='piste').reduce((n,s)=>n+s.minutes,0),
   pisteKm,liftKm,distanceFromGeometry:true};
  const route={ok:true,steps:[{from:options.start,to:planOptions.finish,via:'Volledige geografische route: '+steps.filter(x=>x.type==='lift').length+
    ' liften, '+steps.filter(x=>x.type==='piste').length+' pisteonderdelen en '+steps.filter(x=>x.type==='transfer').length+' overstappen',
   minutes:itinerary.routeMinutes}],notes,estimated:true,graphBased:true,
   phases:{preLunch:chosen.before,postLunch:chosen.post,return:chosen.back},
   coordinates:[graph.nodes[start].slice(0,2),...path.edgeIds.map(i=>graph.nodes[graph.edges[i][1]].slice(0,2))],
   returnEstimate:groupsFor(chosen.back,opts).reduce((n,s)=>n+s.minutes,0)};
  if(isHopfgarten&&endMode==='middle'){
   made.plan.notes.push('Optionele dalafdaling 20a: '+optionalDescent.reason+
    (validDescent?' Reken ongeveer '+optionalDescent.minutes+' minuten plus extra veiligheidsreserve.':''));
  }
  return{ok:true,plan:made.plan,itinerary,route,path,features:steps,
   graphBased:true,notes,options,endMode,routePreset:preset?.label||null,
   optionalDescent:isHopfgarten?optionalDescent:null};
 }
 return{initialize,load,build,shortest,validateRoute,group,clock,hhmm,closureSet,hopfgartenPresets,getEdge:id=>graph?.edges[id]?.slice()||null};
});
