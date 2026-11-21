/* SkiWelt 2026/27: directed station and junction network, independent of live status. */
(function(root){
 'use strict';
 const engine=root.SkiRouteEngine;
 const sources={
  tour:'https://www.skiwelt.at/media/gruppen-info-busfolder/Infofolder-fuer-Reisebueros.pdf',
  panorama:'https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.pdf',
  map:'https://skimap.skiwelt.at/en/',
  connection:'https://www.skiwelt.at/en/connections.html',
  bridge:'https://www.skiwelt.at/de/neue-skiweltbahn-und-verbindung-nach-westendorf.html',
  skiWeltRide:'https://www.skiresort.de/skigebiet/skiwelt-wilder-kaiser-brixental/liftebahnen/l1734/',
  hochbrixenHours:'https://www.skiwelt.at/en/brixen-im-thale/info/gondola-hochbrixen.html',
  skiWeltHours:'https://www.skiwelt.at/en/brixen-im-thale/info/skiweltbahn.html',
  alpenrosenHours:'https://www.skiwelt.at/en/westendorf/info/alpenrosenbahn-westendorf.html',
  status:'https://www.skiwelt.at/nl/liftstatus-winter.html'
 };
 const brixen='Brixen dalstation', westendorf='Westendorf dalstation',
  hochbrixen='Hochbrixen bergstation', skiWeltBase='SkiWeltbahn dalstation Brixen',
  joch='Jochbahn dalstation Brixen', chor='Choralpe', talkaser='Talkaser',
  fleiding='Fleiding dalstation Westendorf', fleidingTop='Fleiding bergstation Westendorf',
  choralmbahn='Choralmbahn dalstation Westendorf', middle='Alpenrosenbahn tussenstation Westendorf',
  windauJunction='Aansluiting 110 → 111 bij Talkaser', fleidingJunction='Splitsing 111 → 117 Neuhögen',
  upperWindau='Aansluiting Talkaser → 111 Windau', ellmerer='Splitsing 110 → 110b bij Alpenrosenbahn',
  kandlerEnd='Uiteinde Kandleralm-afdaling', bandBase='Sonnenband dalzijde', bandTop='Sonnenband bovenzijde',
  dragBase='Sonnenlift dalzijde', dragTop='Sonnenlift bovenzijde', kaslach='Instap Kaslach-afdaling bij lift 2';
 const selectable=[brixen,westendorf,hochbrixen,skiWeltBase,joch,chor,talkaser,fleiding,fleidingTop,choralmbahn,middle];
 const areaOf=node=>[brixen,hochbrixen,skiWeltBase,joch,kandlerEnd,bandBase,bandTop,dragBase,dragTop,kaslach].includes(node)?'Brixen':'Westendorf';
 const edge=(id,from,to,type,code,name,minutes,evidence,extra={})=>({id,from,to,type,code,name,minutes,evidence,
  mapListed:true,status:'unknown',waitMinutes:0,...extra});
 const lift=(code,from,to,name,minutes,waitMinutes,lengthKm,evidence,hours)=>
  edge('lift-'+code,from,to,'lift','lift:'+code,name,minutes,[...evidence,'map',...(hours?[hours]:[])],{lengthKm,waitMinutes,hours});
 const piste=(id,code,from,to,name,minutes,level,evidence,lengthKm)=>
  edge(id,from,to,'piste','piste:'+code,name,minutes,[...evidence,'map'],{level,lengthKm});
 const transfer=(id,from,to,name,minutes,evidence,followSigns=false)=>
  edge(id,from,to,'overstap','',name,minutes,evidence,{followSigns});
 const edges=[
  transfer('bridge-out',brixen,skiWeltBase,'Loopbrug naar SkiWeltbahn 11',3,['bridge','panorama']),
  transfer('bridge-back',skiWeltBase,brixen,'Loopbrug naar dalstation Hochbrixen 1',3,['bridge','panorama']),
  lift('11',skiWeltBase,chor,'SkiWeltbahn',10,5,3.410,['panorama','skiWeltRide'],'skiWeltHours'),
  piste('110-to-111','110',chor,windauJunction,'Alpenrosenafdalingssectie naar 111',4,'red',['tour','panorama']),
  piste('111-to-117','111',windauJunction,fleidingJunction,'Windau tot de afslag naar 117',5,'blue',['tour','panorama']),
  piste('117-neuhoegen','117',fleidingJunction,fleiding,'Neuhögen naar Fleiding-dalstation',7,'blue',['tour','panorama']),
  lift('117',fleiding,fleidingTop,'Fleiding',7,5,1.540,['tour','panorama']),
  piste('110-to-110b','110',chor,ellmerer,'Alpenrosenafdalingssectie naar 110b',9,'red',['tour','panorama']),
  piste('110b-ellmerer','110b',ellmerer,westendorf,'Ellmerer naar dalstation Alpenrosenbahn I',10,'red',['tour','panorama'],2.325),
  lift('110',westendorf,middle,'Alpenrosenbahn I',6,5,1.485,['tour','panorama'],'alpenrosenHours'),
  lift('111',middle,talkaser,'Alpenrosenbahn II',7,5,1.618,['tour','panorama'],'alpenrosenHours'),
  piste('111-talkaser','111',talkaser,upperWindau,'Windau vanaf Talkaser',3,'blue',['tour','panorama']),
  piste('111-before-117','111',upperWindau,fleidingJunction,'Windau tot de splitsing met 117',4,'blue',['tour','panorama']),
  piste('111-to-112','111',fleidingJunction,choralmbahn,'Windau naar dalstation Choralmbahn',16,'blue',['connection','panorama']),
  lift('112',choralmbahn,chor,'Choralmbahn',8,5,2.200,['connection','panorama']),
  piste('11-kandleralm','11',chor,kandlerEnd,'Kandleralm richting Brixen',20,'red',['tour','connection','panorama'],5.237),
  transfer('kandler-to-18',kandlerEnd,bandBase,'Overstap naar Sonnenband 18',2,['tour','connection','bridge','panorama'],true),
  lift('18',bandBase,bandTop,'Sonnenband',1,1,0.023,['tour','connection','panorama']),
  transfer('18-to-12',bandTop,dragBase,'Overstap naar Sonnenlift 12',2,['tour','connection','bridge','panorama'],true),
  lift('12',dragBase,dragTop,'Sonnenlift',2,2,0.205,['tour','connection','panorama']),
  transfer('12-to-skiwelt',dragTop,skiWeltBase,'Overstap naar SkiWeltbahn-dalstation / loopbrug',2,['bridge','connection','panorama'],true),
  lift('1',brixen,hochbrixen,'Gondel Hochbrixen',7,5,1.800,['connection','panorama'],'hochbrixenHours'),
  piste('1b-brixen','1b',joch,brixen,'Brixen-afdaling tot dalstation Hochbrixen',12,'red',['tour','panorama'],2.604),
  piste('1-kaslach','1',kaslach,brixen,'Kaslach-afdalingssectie tot dalstation Hochbrixen',15,'black',['panorama'])
 ];
 // A candidate transition must never enter the pathfinder until it has usable evidence.
 const gaps=[
  {from:hochbrixen,to:kaslach,reason:'Exacte in- en uitstaprichting van de korte aansluiting vanaf bergstation 1 controleren.',evidence:['panorama']},
  {from:hochbrixen,to:joch,reason:'Vanuit Hochbrixen is geen doorgaande, onderbouwde afdaling naar de instap van 1b vastgesteld.',evidence:['panorama']},
  {from:fleidingTop,to:fleidingJunction,reason:'De exacte aansluiting vanaf Fleiding via 117a op 111 is nog niet gecontroleerd.',evidence:['panorama','tour']}
 ];
 const isEndpoint=name=>selectable.includes(name);
 function liftHours(edge,date){
  if(!edge.hours||date<'2026-12-05'||date>'2027-03-29')return null;
  const later=date>='2027-01-30';
  if(edge.hours==='hochbrixenHours')return {open:510,close:later?975:960};
  // Published early-bird exceptions differ per lift. Use regular opening throughout.
  return {open:480,close:later?1005:975};
 }
 function stationPath(start,finish,at,options={},closures=[]){
  const reported=new Set(root.SKIWeltCorridors.parseClosures(closures).map(row=>row.kind+':'+row.code));
  const pace={easy:12,normal:20,sporty:28}[options.speed]||{blue:12,pro:28}[options.skill]||20;
  const blocksCorridor=reported.has('corridor:brixen-westendorf');
  const usable=edges.filter(e=>!reported.has(e.code)&&(!blocksCorridor||areaOf(e.from)===areaOf(e.to))).map(e=>{
   const minutes=e.type==='piste'?Math.ceil(e.minutes*20/pace):e.minutes;
   return {...e,minutes};
  });
  const path=engine.shortest(usable,start,finish,at,{...options,style:'fast'});
  if(!path){
   const uncertain=gaps.filter(gap=>gap.from===start);
   return {ok:false,reason:'Geen onderbouwde route van '+start+' naar '+finish+' voor deze pistekeuze en gemelde sluitingen.',gaps:uncertain};
  }
  const steps=[];
  for(const edge of path.steps){
   const hours=liftHours(edge,options.date||'');
   const begin=hours?Math.max(at,hours.open):at;
   const boarding=begin+(edge.waitMinutes||0);
   if(hours&&boarding>=hours.close)return {ok:false,reason:'Lift '+edge.code.slice(5)+' '+edge.name+' sluit om '+engine.hhmm(hours.close)+'; verwachte instap '+engine.hhmm(boarding)+'.'};
   const end=begin+engine.segmentMinutes(edge);
   steps.push({edge,startAt:at,endAt:end,boarding,openingWait:begin-at,hours});
   at=end;
  }
  return {ok:true,steps,arrival:at};
 }
 function plan(input,closures=[]){
  if(!isEndpoint(input.start)||!isEndpoint(input.finish))return null;
  const start=engine.clock(input.departure),end=engine.clock(input.returnTime);
  const margin=input.useSafety===false?0:Math.max(0,Math.min(120,Number(input.safetyMarginMin??30)||0));
  const safe=end-margin;
  const fail=(reason,gaps=[])=>({plan:{ok:false,reason},gaps});
  if(start===null||end===null||start>=safe)return fail('Controleer vertrek, eindtijd en veiligheidsmarge.');
  const roundTrip=input.start===input.finish;
  const waypoint=roundTrip?(areaOf(input.start)==='Brixen'?westendorf:brixen):input.finish;
  const outward=stationPath(input.start,waypoint,start,input,closures);
  if(!outward.ok)return fail(outward.reason,outward.gaps);
  const events=[],sections=[],notes=[];
  const add=(type,label,from,to,detail='',more={})=>{
   if(to<=from)return;
   events.push({type,label,start:engine.hhmm(from),end:engine.hhmm(to),startMinute:from,endMinute:to,minutes:to-from,detail,...more});
  };
  function addLeg(leg,phase){
   for(const {edge,startAt,endAt,boarding,openingWait,hours} of leg.steps){
    const code=edge.code.split(':')[1];
    const type=edge.type==='overstap'?'transfer':edge.type;
    const timing=type==='lift'?' · instap ca. '+engine.hhmm(boarding)+' ('+edge.waitMinutes+' min wachtrij'+(openingWait?' + '+openingWait+' min tot opening':'')+') · '+(hours?'sluit '+engine.hhmm(hours.close):'sluittijd onbekend'):'';
    add(type,(code?code+' · ':'')+edge.name,startAt,endAt,edge.from+' → '+edge.to+timing+(edge.followSigns?' · exacte overstaplijn ter plaatse controleren':''),
     {id:edge.id,from:edge.from,to:edge.to,code,level:edge.level,lengthKm:edge.lengthKm,phase,area:areaOf(edge.to),sources:edge.evidence.map(key=>sources[key])});
   }
  }
  addLeg(outward,roundTrip?'Heenweg':'Naar eindstation');
  const block=(type,label,from,to,detail)=>{
   if(to<=from)return;
   sections.push({type,label,start:engine.hhmm(from),end:engine.hhmm(to),startMinute:from,endMinute:to,minutes:to-from,detail});
  };
  block('ski',roundTrip?'Heenweg':'Naar eindstation',start,outward.arrival,'Naar '+waypoint+'.');
  let at=outward.arrival;
  const pause=(type,label,duration,detail)=>{
   add(type,label,at,at+duration,detail);block(type,label,at,at+duration,detail);at+=duration;
  };
  const breakMinutes=value=>Math.round(Math.max(5,Math.min(120,Number(value)||30)));
  if(input.morningBreak)pause('break','Ochtendpauze',breakMinutes(input.morningDuration),'Bij '+waypoint+'.');
  const lunchMinutes=input.useLunch===false?0:Number(input.lunchDuration??60);
  if(input.useLunch!==false){
   const lunch=engine.clock(input.lunchTime||'12:30');
   if(lunch===null||lunch<705||lunch>795||!Number.isInteger(lunchMinutes)||lunchMinutes<30||lunchMinutes>120)return fail('Lunch start tussen 11:45 en 13:15 en duurt 30 tot 120 minuten.');
   if(at>lunch)return fail('Het halte- of eindpunt is niet bereikbaar vóór de gekozen lunchtijd.');
   const detail='Pauze bij '+waypoint+'. Bereikbaarheid van een specifiek restaurant is hier nog onbekend.';
   pause('free','Vrije tijd bij '+waypoint,lunch-at,'Vrij in te vullen.');
   pause('lunch','Lunchpauze',lunchMinutes,detail);
   if(input.lunchRestaurant)notes.push('Het gekozen restaurant is nog niet gekoppeld aan dit stationsnetwerk.');
  }
  if(input.afternoonBreak)pause('break','Middagpauze',breakMinutes(input.afternoonDuration),'Bij '+waypoint+'.');
  const back=roundTrip?stationPath(waypoint,input.finish,at,input,closures):{ok:true,steps:[],arrival:at};
  if(!back.ok)return fail('Terugweg: '+back.reason,back.gaps);
  addLeg(back,'Terugweg');
  block('return','Terugweg',at,back.arrival,'Naar '+input.finish+'.');
  if(back.arrival>safe)return fail('De route met de gekozen pauzes komt na de streefaankomst '+engine.hhmm(safe)+' uit.');
  const missingWishes=(input.wishes||[]).filter(wish=>![...outward.steps,...back.steps].some(({edge})=>edge.code===wish||
   (wish==='top:choralpe'&&edge.to===chor)||(wish==='top:talkaser'&&edge.to===talkaser)));
  if(missingWishes.length)notes.push('Niet opgenomen routewensen: '+missingWishes.join(', ')+'.');
  const arrival=roundTrip?back.arrival:outward.arrival;
  add('free','Vrije tijd bij '+input.finish,back.arrival,safe,'Vrij in te vullen.');
  block('free','Vrije tijd bij '+input.finish,back.arrival,safe,'Vrij in te vullen.');
  add('buffer','Veiligheidsmarge',safe,end,margin+' minuten.');
  block('buffer','Veiligheidsmarge',safe,end,margin+' minuten.');
  const used=[...outward.steps,...back.steps];
  const unknown=[...new Set(used.filter(s=>s.edge.type==='lift'&&!s.hours).map(s=>s.edge.code.slice(5)))];
  if(unknown.length)notes.push('Sluittijd nog onbekend voor lift '+unknown.join(', ')+'. Controleer de laatste instap ter plaatse.');
  if(used.some(s=>s.edge.followSigns))notes.push('SkiWelt bevestigt de volgorde via 18 en 12. Volg bij de korte overstappen de borden; exacte loop- of skilijn moet in het veld worden bevestigd.');
  notes.push('Reistijden zijn rekenwaarden. De geschatte wachtrij is per lift opgenomen.');
  notes.push('Verwachte aankomst '+engine.hhmm(arrival)+' · streefaankomst uiterlijk '+engine.hhmm(safe)+'.',
   'Winterkaart en tourbeschrijvingen 2026/27. Openstelling, aansluitdetails en reistijden blijven indicatief.');
  if(input.style==='relaxed')notes.push('Dit stationsnetwerk plant een directe route. Extra afdalingen en variatie zijn nog niet berekend.');
  const legs=[[outward,'Heenweg'],[back,'Terugweg']].filter(([leg])=>leg.steps.length).map(([leg,label])=>({
   from:areaOf(leg.steps[0].edge.from),to:areaOf(leg.steps.at(-1).edge.to),
   minutes:leg.arrival-leg.steps[0].startAt,via:label+' · '+leg.steps.map(s=>s.edge.code.replace(':',' ')||s.edge.name).join(' → ')
  }));
  return {plan:{ok:true,stationNetwork:true,date:input.date,startPoint:input.start,endPoint:input.finish,departure:input.departure,
   returnTime:input.returnTime,safeArrival:engine.hhmm(safe),arrival:engine.hhmm(arrival),margin,lunchMinutes,
   useLunch:lunchMinutes>0,lunchRestaurant:lunchMinutes>0?'Bij '+waypoint:'',sections,notes:[]},
   route:{steps:legs,notes},itinerary:{steps:events,pois:[],warnings:notes,missingSteps:[],unverifiedTransitions:[],
    routeMinutes:legs.reduce((sum,leg)=>sum+leg.minutes,0),
    liftMinutes:events.filter(s=>s.type==='lift').reduce((sum,s)=>sum+s.minutes,0),
    pisteMinutes:events.filter(s=>s.type==='piste').reduce((sum,s)=>sum+s.minutes,0)}};
 }
 root.SKIWeltStations={sources,edges,gaps,selectable,stationPath,plan};
})(globalThis);
