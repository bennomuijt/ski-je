/* SKI-je route detail: official lift/piste identifiers, indicative ETA, WC evidence.
   Important: official area connections do not specify every junction, so these
   are NOT continuous turn-by-turn GPS navigation instructions.
   Official connections: https://www.skiwelt.at/nl/verbindingen.html */
(function(root,factory){
 const mod=factory();if(typeof module==='object'&&module.exports)module.exports=mod;
 if(root)root.SKIRouteDetail=mod;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SOURCE='https://www.skiwelt.at/nl/verbindingen.html';
 const item=(type,code,name,level='unknown')=>({type,code:String(code||''),name,level});
 // These steps are copied only from explicitly named connections; a gap is shown
 // as "follow signage", never silently filled with made-up runs.
 const catalog={
  'going-ellmau':{
   ab:[item('piste','90','Hausberg-afdaling'),item('lift','80','Hartkaiserbahn'),item('transfer','','Verbinding richting Ellmau volgen')],
   ba:[item('piste','80/80a','Dalafdaling Ellmau (keuze op borden)'),item('piste','90','Verbinding Hausberg naar Going')]
  },
  'ellmau-scheffau':{
   ab:[item('lift','97','Köglbahn'),item('piste','99a','Tanzboden-afdaling','blue'),item('lift','99','Tanzbodenbahn'),item('transfer','','Verder naar Scheffau: bewegwijzering controleren')],
   ba:[item('piste','96-99','Verbinding Eiberg naar Ellmau'),item('piste','96b','Aansluiting Kaiserexpress (alternatief; borden volgen)')]
  },
  'scheffau-brixen':{
   ab:[item('lift','71','Aualmbahn'),item('piste','2a','Hochbrixen-afdaling (of Joch 6)'),item('transfer','','Aansluiting richting Brixen controleren')],
   ba:[item('lift','6','Jochbahn'),item('piste','65a','Verbinding Aualm–Osthang (of 72/70)'),item('transfer','','Vervolg richting Scheffau controleren')]
  },
  'brixen-westendorf':{
   ab:[item('lift','1','Gondellift Hochbrixen'),item('lift','11','SkiWeltbahn richting Westendorf')],
   ba:[item('piste','111','Windau-afdaling'),item('lift','112','Choralmbahn'),item('piste','11','Kandleralm-afdaling'),item('lift','18','Sonnenband'),item('lift','12','Sonnenlift'),item('lift','1','Hochbrixen gondellift')]
  },
  'brixen-hopfgarten':{
   ab:[item('lift','2','Kälbersalvenbahn'),item('transfer','','Verdere verbinding richting Hopfgarten controleren')],
   ba:[item('lift','25','Foischingbahn'),item('piste','2/2b','Kälberalm-afdaling (keuze)')]
  },
  'brixen-soll':{
   ab:[item('lift','2','Kälbersalvenbahn'),item('lift','51','Siller-Keat stoeltjeslift'),item('transfer','','Vervolg naar Hochsöll controleren')],
   ba:[item('lift','43','Keat stoeltjeslift'),item('lift','51','Siller-Keat stoeltjeslift'),item('piste','51a','Verbindingsweg Filzboden'),item('lift','7','Filzbodenbahn')]
  },
  'soll-itter':{
   ab:[item('lift','42','Hohe Salve gondellift'),item('lift','22','Salvenbahn II / Rigi-route'),item('lift','30/31','Rigi–Kraftalm verbinding'),item('transfer','','Volg borden richting Itter')],
   ba:[item('piste','40','Hohe Salve–Kraftalm afdaling'),item('lift','45','Hexen6er'),item('piste','43','Keat-afdaling'),item('lift','42','Hohe Salve gondellift')]
  },
  'itter-hopfgarten':{
   ab:[item('lift','22','Salvenbahn II / Hohe Salve'),item('lift','30/31','Rigi–Kraftalm verbinding'),item('transfer','','Volg borden richting Hopfgarten')],
   ba:[item('lift','22','Salvenbahn II'),item('lift','30/31','Rigi–Kraftalm richting Itter')]
  }
 };
 const POIS=[
  {id:'wc-hohe-salve',area:'Söll',title:'WC bij Gipfelrestaurant Hohe Salve',location:'Hohe Salve, bij bergstation lift 22 / 42',codes:['lift:22','lift:42'],source:'https://www.skiwelt.at/nl/soell/info/gipfelrestaurant-hohe-salve.html',evidence:'Officiële restaurantbeschrijving noemt een WC',status:'Opening en bereikbaarheid controleren'},
  {id:'wc-brandstadl',area:'Scheffau',title:'WC bij KaiserWelt / Brandstadl',location:'Omgeving bergstation Brandstadl',codes:[],source:'https://resc.deskline.net/documents/1/SKI/9817756a-738a-439f-945b-a4b894a95432/file.pdf',evidence:'Toilet op officiële bergparkplattegrond; wintertoegankelijkheid onbekend',status:'Niet bevestigd als toegankelijk in de winter'},
  {id:'wc-scheffau-dorf',area:'Scheffau',title:'Openbaar WC gemeentehuis Scheffau',location:'Dorf 45, 6351 Scheffau',codes:[],source:'https://www.kaiserlodge.at/de/ortsplan.html',evidence:'Officiële toeristische dorpsinformatie',status:'In dal; mogelijk niet aan de skiroute'},
  {id:'wc-going',area:'Going',title:'Openbaar WC gemeentehuis Going',location:'Kirchplatz 1a, 6353 Going',codes:[],source:'https://www.kaiserlodge.at/de/ortsplan.html',evidence:'Officiële toeristische dorpsinformatie',status:'In dal; mogelijk niet aan de skiroute'}
 ];
 const regionAnchors=[
  {area:'Going',lat:47.527,long:12.329,label:'Going / Astberg'},
  {area:'Ellmau',lat:47.492,long:12.272,label:'Hartkaiser / Ellmau'},
  {area:'Scheffau',lat:47.491,long:12.254,label:'Brandstadl / Scheffau'},
  {area:'Söll',lat:47.465,long:12.204,label:'Hohe Salve / Söll'},
  {area:'Itter',lat:47.472,long:12.147,label:'Itter / Kleine Salve'},
  {area:'Hopfgarten',lat:47.451,long:12.156,label:'Hopfgarten / Salvenbahn'},
  {area:'Brixen',lat:47.457,long:12.240,label:'Hochbrixen / Brixen'},
  {area:'Westendorf',lat:47.413,long:12.235,label:'Choralpe / Westendorf'}
 ];
 const clock=text=>/^\d\d:\d\d$/.test(String(text||''))?Number(text.slice(0,2))*60+Number(text.slice(3)):null;
 const hh=minute=>String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');
 function split(leg){
  const steps=catalog[leg.id]?.[leg.direction]||[item('transfer','','Volg de aangegeven gebiedsverbinding')];
  const weight=steps.map(s=>s.type==='lift'?1.35:s.type==='piste'?1:0.55);
  const sum=weight.reduce((v,n)=>v+n,0);
  const minutes=Math.max(steps.length,Math.round(leg.minutes||0));
  let left=minutes;
  return steps.map((s,i)=>{
   const duration=i===steps.length-1?left:Math.max(1,Math.round(minutes*weight[i]/sum));
   left-=duration;
   return {...s,from:leg.from,to:leg.to,corridor:leg.id,minutes:duration,verified:false,mapListed:true,
    warning:'⚠ Niet live gecontroleerd. Aansluitingen en wachttijden controleren.'};
  });
 }
 function buildSegments(legs){return (legs||[]).flatMap(split);}
 function placesFor(legs){
  const visited=new Set();
  for(const leg of legs||[]){visited.add(leg.from);visited.add(leg.to);}
  const identifiers=new Set((legs||[]).flatMap(leg=>leg.codes||[]));
  return POIS.filter(x=>visited.has(x.area)).map(p=>({...p,onRouteConfirmed:false,
   nearNamedLift:p.codes.length>0&&p.codes.some(code=>identifiers.has(code)),
   extraTimeMinutes:10}));
 }
 function estimate(legs){return (legs||[]).reduce((sum,leg)=>sum+Number(leg.minutes||0),0);}
 function buildTimeline(plan,route){
  if(!plan?.ok)return {steps:[],warnings:['Ongeldige dagplanning'],pois:[]};
  const phases=route?.phases||{preLunch:route?.steps||[],postLunch:[],return:[]};
  const warnings=[],events=[];
  const add=(type,label,start,end,detail='',more={})=>{
   if(end<=start)return;
   events.push({type,label,start:hh(start),end:hh(end),startMinute:start,endMinute:end,minutes:end-start,detail,...more});
  };
  const duration=blocks=>blocks.reduce((n,b)=>n+(b.endMinute-b.startMinute),0);
  let from=clock(plan.departure),safe=clock(plan.safeArrival),end=clock(plan.returnTime);
  let lunch=plan.sections.find(s=>s.type==='lunch');
  let returnSlot=plan.sections.find(s=>s.type==='return');
  if(from===null||safe===null||end===null)return {steps:[],warnings:['Tijdnotatie onbekend'],pois:[]};
  function fillPhase(legs,slots,kind,location){
   const parts=buildSegments(legs);
   const capacity=duration(slots);
   if(estimate(legs)>capacity)warnings.push('⚠️ '+kind+': verbindingen duren naar schatting '+estimate(legs)+' min, beschikbare skitijd slechts '+capacity+' min.');
   let index=0;
   for(const slot of slots){
    let now=slot.startMinute;
    while(index<parts.length){
     const step=parts[index];
     if(now+step.minutes>slot.endMinute)break;
     add(step.type,(step.code?step.code+' · ':'')+step.name,now,now+step.minutes,
       step.from+' → '+step.to+' · '+step.warning,
       {code:step.code,area:step.to,level:step.level,phase:kind,corridor:step.corridor});
     now+=step.minutes;index++;
    }
    if(now<slot.endMinute){
     add('free',location||'Skiën en uitzicht',now,slot.endMinute,
       'Vrij skiën in verder gelegen gebied; kies een geopende piste en voorkom herhaalde rondjes bij je vertrekpunt.',
       {phase:kind});
    }
   }
   if(index<parts.length)warnings.push('⚠️ Niet alle '+kind+'-stappen passen in het opgegeven tijdvenster. Verander je lunch of eindtijd.');
  }
  const lunchStart=lunch?.startMinute??null,lunchEnd=lunch?.endMinute??null;
  const skiSections=plan.sections.filter(s=>s.type==='ski');
  const morning=lunch?skiSections.filter(s=>s.endMinute<=lunchStart):skiSections;
  const afternoon=lunch?skiSections.filter(s=>s.startMinute>=lunchEnd):[];
  fillPhase(phases.preLunch,morning,'Voor de lunch',route?.preLunchArea||'Ander skigebied');
  if(lunch)add('lunch',lunch.label,lunch.startMinute,lunch.endMinute,lunch.detail||'Locatie ter plaatse controleren.');
  fillPhase(phases.postLunch,afternoon,'Na de lunch',route?.scenicTarget||'Buiten het startgebied');
  if(returnSlot){
   const start=returnSlot.startMinute;
   const returnParts=buildSegments(phases.return);
   let now=start;
   for(const step of returnParts){
    if(now+step.minutes>safe){
     warnings.push('⚠️ Terugweg past niet binnen de beschikbare terugreistijd.');
     break;
    }
    add(step.type,(step.code?step.code+' · ':'')+step.name,now,now+step.minutes,
      step.from+' → '+step.to+' · '+step.warning,
      {code:step.code,area:step.to,level:step.level,phase:'Terugweg',corridor:step.corridor});
    now+=step.minutes;
   }
   if(now<safe)add('return','Reserve / overstaptijd',now,safe,'Controleer liftafsluitingen en aansluitingen op de route.');
  }
  for(const pause of plan.sections.filter(s=>s.type==='break')){
   add('break',pause.label,pause.startMinute,pause.endMinute,pause.detail);
  }
  add('buffer','Veiligheidsmarge – uiterlijk terug',safe,end,'Streef ernaar om '+plan.safeArrival+' bij het gekozen eindpunt te zijn.');
  events.sort((a,b)=>a.startMinute-b.startMinute||(a.type==='lunch'?-1:1));
  const pois=placesFor(route?.steps);
  if(!pois.length)warnings.push('Er zijn voor deze route nog geen officieel onderbouwde WC-locaties bekend; vraag ter plaatse.');
  else warnings.push('🚻 WC-locaties zijn mogelijke stops nabij de route, niet automatisch gegarandeerde toiletten op jouw piste.');
  return {steps:events,pois,warnings,routeMinutes:estimate(route?.steps),liftMinutes:events.filter(x=>x.type==='lift').reduce((sum,x)=>sum+x.minutes,0),
   pisteMinutes:events.filter(x=>x.type==='piste').reduce((sum,x)=>sum+x.minutes,0)};
 }
 function haversine(a,b){
  const rad=n=>n*Math.PI/180,R=6371,dLat=rad*(b.lat-a.lat),dLon=rad*(b.long-a.long);
  const x=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(Math.min(1,x)));
 }
 function nearestAreas(position){
  const lat=Number(position?.latitude??position?.lat),long=Number(position?.longitude??position?.lng);
  if(!Number.isFinite(lat)||!Number.isFinite(long)||lat<47.30||lat>47.62||long<12.01||long>12.43)return [];
  return regionAnchors.map(x=>({...x,distanceKm:haversine({lat,long},x)})).sort((a,b)=>a.distanceKm-b.distanceKm);
 }
 function homeSuggestion(position,finish,network,closures=[],areaOverride=''){
  const accuracy=Number(position?.accuracy);
  if(!Number.isFinite(Number(position?.latitude??position?.lat))||!Number.isFinite(Number(position?.longitude??position?.lng)))
   return {ok:false,reason:'Geen geldige GPS-coördinaten.'};
  if(Number.isFinite(accuracy)&&accuracy>500)return {ok:false,reason:'GPS is te onnauwkeurig (meer dan 500 m). Probeer een nieuwe meting.'};
  const candidates=nearestAreas(position);
  if(!candidates.length||candidates[0].distanceKm>11)return {ok:false,reason:'GPS niet binnen het verwachte SkiWelt-gebied. Er is geen betrouwbare skiroute berekend.'};
  const area=areaOverride||candidates[0].area;
  const endArea=network.areaOf(finish);
  if(!endArea)return {ok:false,reason:'Kies eerst een eindpunt in SkiWelt.'};
  if(!regionAnchors.some(x=>x.area===area))return {ok:false,reason:'Onbekend vertrekgebied.'};
  const legs=network.shortest(area,endArea,closures);
  if(!legs)return {ok:false,reason:'Geen beschreven beschikbare gebiedsverbinding. Vraag pistepersoneel om de veilige route.'};
  return {ok:true,area,endArea,legs,minutes:estimate(legs),candidates:candidates.slice(0,3),
   instructions:'⚠️ Dichtstbijzijnde gebied geschat vanaf GPS en berganker, geen exacte pisteherkenning. Dit is geen veilige bocht-voor-bocht-route; volg officiële borden, sluitingen en lifttijden.',
   name:finish,updatedAt:new Date().toISOString()};
 }
 function fileName(plan){
  const safe=s=>String(s||'').replace(/[^0-9A-Za-z_-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,48);
  const local=new Date(),pad=n=>String(n).padStart(2,'0');
  const day=/^\d{4}-\d{2}-\d{2}$/.test(plan?.date||'')?plan.date:local.getFullYear()+'-'+pad(local.getMonth()+1)+'-'+pad(local.getDate());
  const begin=safe((plan?.departure||'09:00').replace(':','-')),end=safe((plan?.returnTime||'16:00').replace(':','-'));
  return 'SKI-je_'+day+'_'+begin+'_tot_'+end+'.pdf';
 }
 return {SOURCE,catalog,POIS,regionAnchors,split,buildSegments,buildTimeline,nearestAreas,homeSuggestion,fileName,placesFor};
});