// Read-only scheduled QA. No publishing, editing source, or user data access.
// Connectivity and coarse elevation estimates are NOT physical verification.
import {readFileSync,writeFileSync,appendFileSync} from 'node:fs';
import {release} from '../src/release.js';
import '../public/skiwelt-map-router.js';
import '../public/day-pdf.js';

const graph=JSON.parse(readFileSync(new URL('../public/skiwelt-network-graph.json',import.meta.url),'utf8'));
const router=globalThis.SKIMapRouter;
const network=router.initialize(graph);
const stations=['Ellmau dalstation','Going dalstation','Scheffau dalstation','Söll dalstation','Brixen dalstation','Westendorf dalstation','Hopfgarten dalstation','Itter dalstation','Hopfgarten tussenstation','lift:112:middle1','lift:30:middle1'];
const hour=Math.floor(Date.now()/3600000);
const valleys=stations.slice(0,8);
const valleyCases=valleys.flatMap(start=>valleys.map(finish=>({start,finish})));
const cases=stations.flatMap(start=>stations.map(finish=>({start,finish}))).filter(({start,finish})=>!valleys.includes(start)||!valleys.includes(finish));
const batchSize=6;
const batches=Math.ceil(cases.length/batchSize);
const batch=hour%batches;
const defaults={departure:'09:00',returnTime:'16:00',useLunch:true,lunchTime:'12:30',lunchDuration:60,style:'relaxed',skill:'red',speed:'normal',allowBlack:false,useSafety:true,safetyMarginMin:30};
const report={time:new Date().toISOString(),commit:process.env.GITHUB_SHA||null,release,batch,batches,totalPairs:valleyCases.length+cases.length,valleyPairs:valleyCases.length,network,scope:'Model simulation, not verified physical skiing or current open status',routes:[],terrain:{},probes:{},failures:[]};
const fail=message=>report.failures.push(message);

for(const {start,finish} of [...valleyCases,...cases.slice(batch*batchSize,(batch+1)*batchSize)]){
 const row={start,finish};report.routes.push(row);
 try{
  const from=graph.stations[start]?.node,to=graph.stations[finish]?.node;
  const direct=router.shortest(from,to,defaults);
  row.directReachable=!!direct&&router.validateRoute(direct,from,to);
  if(!row.directReachable)fail(start+' to '+finish+': no directed core connection');
  const r=router.build({...defaults,start,finish});
  row.planned=r.ok;
  if(!r.ok){row.reason=r.reason;if(start===finish&&valleys.includes(start))fail(start+': standard return loop missing');continue;} // Different-valley time limits may legitimately make a plan infeasible.
  const steps=r.itinerary.steps;
  const active=steps.filter(s=>['lift','piste','transfer'].includes(s.type));
  const last=active.at(-1);
  row.actualModelArrival=last?.end;
  row.safeArrival=r.plan.safeArrival;
  row.routeMinutes=r.itinerary.routeMinutes;
  row.pisteKm=r.itinerary.pisteKm;
  row.liftKm=r.itinerary.liftKm;
  row.provisionalTransitions=r.itinerary.unverifiedTransitions.length;
  row.unnumbered=active.filter(s=>s.type==='piste'&&!s.code).length;
  row.lunch=r.plan.lunchRestaurant;
  row.minutesBeforeSafeArrival=router.clock(r.plan.safeArrival)-router.clock(last?.end);
  row.liftBoardings=active.filter(s=>s.type==='lift').length;
  row.transferLegs=active.filter(s=>s.type==='transfer').length;
  // Sensitivity scenario, not a measured wait prediction. Do not change the
  // user's timing defaults or assert that extra delay will actually occur.
  row.extraWaitScenarioMinutes=row.liftBoardings;
  row.extraWaitScenarioArrival=router.hhmm(router.clock(last?.end)+row.extraWaitScenarioMinutes);
  row.extraWaitScenarioWithinMargin=row.minutesBeforeSafeArrival>=row.extraWaitScenarioMinutes;
  const pdf=globalThis.SKIPdf;
  const index=pdf.routeIndexRows(steps);
  const pages=pdf.reportPages(r).filter(p=>p.kind==='route-index').flatMap(p=>p.rows);
  row.pdfIndexComplete=index.length===active.length&&index.every((p,i)=>p.position===i+1&&p.type===active[i].type&&p.code===String(active[i].code||'')&&p.time===active[i].start&&p.until===active[i].end)&&JSON.stringify(index)===JSON.stringify(pages);
  if(!row.pdfIndexComplete)fail(start+' to '+finish+': PDF route sequence or pages incomplete');
  row.trace=active.map(s=>({type:s.type,code:s.code||'',label:s.label,from:s.from,to:s.to,start:s.start,end:s.end,level:s.level,confidence:s.confidence,coordinates:s.coordinates}));
  row.edgeSegments=r.path.edgeSegments;
  row.heightConflicts=router.auditUphillJunctions(r.path);
  if(!router.validateRoute(r.path,from,to))fail(start+' to '+finish+': discontinuous plan');
  if(!last||router.clock(last.end)>router.clock(r.plan.safeArrival))fail(start+' to '+finish+': arrival outside margin');
  if(active.some(s=>s.type==='piste'&&s.level==='black'))fail(start+' to '+finish+': black piste without permission');
  const lunch=steps.filter(s=>s.type==='lunch');
  if(lunch.length!==1||lunch[0].start!==defaults.lunchTime||lunch[0].minutes!==60)fail(start+' to '+finish+': incorrect lunch');
 }catch(e){fail(start+' to '+finish+': '+e.message);row.error=e.message;}
}

// Recalculate every valley pair with a slower pace, later departure and
// larger reserve. Infeasible results are useful evidence, not automatically
// bugs. Every returned plan must satisfy the stricter scenario.
const cautious={...defaults,departure:'09:15',speed:'easy',safetyMarginMin:45};
report.cautiousRoutes=valleyCases.map(({start,finish})=>{
 const row={start,finish};
 try{
  const r=router.build({...cautious,start,finish});
  row.planned=r.ok;
  if(!r.ok)return {...row,reason:r.reason};
  const active=r.itinerary.steps.filter(s=>['lift','piste','transfer'].includes(s.type));
  const last=active.at(-1),lunch=r.itinerary.steps.filter(s=>s.type==='lunch');
  row.arrival=last?.end;row.safeArrival=r.plan.safeArrival;
  row.valid=!!last&&router.clock(last.end)<=router.clock(r.plan.safeArrival)&&
   router.validateRoute(r.path,graph.stations[start].node,graph.stations[finish].node)&&
   active.every(s=>s.type!=='piste'||s.level!=='black')&&
   lunch.length===1&&lunch[0].start===cautious.lunchTime&&lunch[0].minutes===cautious.lunchDuration;
  if(!row.valid)fail(start+' to '+finish+': cautious plan invariant failed');
  return row;
 }catch(e){fail(start+' to '+finish+': cautious check '+e.message);return {...row,error:e.message};}
});

// Compare exact route traces against published connection descriptions.
// A shorter alternate route may be valid; a sequence mismatch is a review
// finding, not automatically a wrong or unsafe connection.
const connectionSource='https://www.skiwelt.at/nl/verbindingen.html';
const tourSource='https://www.skiwelt.at/nl/skiwelt-tour.html';
const mapSource='https://skimap.skiwelt.at/';
const checkpoints=[
 {name:'Going – Ellmau',from:'lift:90:top',to:'lift:80:top',expected:['piste:90','lift:80'],source:connectionSource},
 {name:'Ellmau – Scheffau',from:'lift:97:top',to:'lift:99:top',expected:['piste:99a','lift:99'],source:connectionSource,alternateReference:['piste:99','lift:99'],alternateSource:'https://www.skiwelt.at/media/gruppen-info-busfolder/Infofolder-fuer-Reisebueros.pdf',sourceNote:'Operator connection page says 99a, official 2026/27 tour says 99; both codes exist. Keep exact map-line identity open.'},
 {name:'Scheffau – Brixen',from:'lift:71:top',to:'Brixen dalstation',expected:[['piste:2a','piste:6']],source:connectionSource},
 {name:'Brixen – Hochsöll',from:'lift:1:top',to:'lift:51:top',expected:['lift:2','lift:51'],source:connectionSource},
 {name:'Westendorf – Hochbrixen',from:'lift:112:top',to:'lift:1:top',expected:['piste:11','lift:18','lift:12','lift:1'],source:connectionSource},
 {name:'Westendorf – Fleiding',from:'lift:11:top',to:'lift:117:top',expected:['piste:110','piste:111','piste:117','lift:117'],source:tourSource},
 {name:'Hopfgarten – dalafdaling',from:'lift:20:top',to:'Hopfgarten dalstation',expected:['piste:20a'],noLifts:true,source:mapSource},
 {name:'Itter – Hochsöll',from:'lift:30:top',to:'lift:45:top',expected:['piste:40','lift:45'],source:connectionSource},
 {name:'Hopfgarten – Brixen',from:'lift:25:top',to:'lift:1:top',expected:[['piste:2','piste:2b']],source:connectionSource}
];
report.mapChecks=checkpoints.map(c=>{
 const from=graph.stations[c.from]?.node,to=graph.stations[c.to]?.node;
 const options={...defaults,noLifts:!!c.noLifts};
 const route=router.shortest(from,to,options);
 const trace=route?router.group(route,options).map(s=>({type:s.type,code:s.code||'',name:s.name,confidence:s.confidence,points:s.points})): [];
 let n=0;
 for(const s of trace){
  const actual=String(s.code||'').split(',').map(code=>s.type+':'+code.trim().toLowerCase());
  const expected=Array.isArray(c.expected[n])?c.expected[n]:[c.expected[n]];
  if(actual.some(code=>expected.includes(code)))n++;
  if(n===c.expected.length)break;
 }
 const reachable=!!route&&router.validateRoute(route,from,to);
 const tokens=trace.flatMap(s=>String(s.code||'').split(',').map(code=>s.type+':'+code.trim().toLowerCase()));
 const missing=c.expected.filter(expected=>!(Array.isArray(expected)?expected:[expected]).some(code=>tokens.includes(code)));
 let alt=0;
 for(const token of tokens)if(token===c.alternateReference?.[alt])alt++;
 return {...c,reachable,orderedReferenceMatch:reachable&&n===c.expected.length,matched:n,missingReferenceCodes:missing,alternateReferenceMatch:!!c.alternateReference&&alt===c.alternateReference.length,trace,
  heightConflicts:route?router.auditUphillJunctions(route):[],
  interpretation:'Reference sequence comparison only; alternate routes may be valid; exact map crossings require visual review.'};
});
// A named closure on an actually used lift must not be bypassed by the
// alternative route. Test each main valley with a destination one position on.
report.closureChecks=valleys.map((start,index)=>{
 const finish=valleys[(index+1)%valleys.length],from=graph.stations[start]?.node,to=graph.stations[finish]?.node;
 const direct=router.shortest(from,to,defaults);
 const code=direct&&router.group(direct,defaults).find(s=>s.type==='lift'&&s.code)?.code;
 if(!code){fail(start+': no testable lift in neighbouring-valley route');return{start,finish,error:'No named lift'};}
 const alt=router.shortest(from,to,defaults,[{kind:'lift',code}]);
 const avoidsClosure=!alt||router.group(alt,defaults).every(s=>s.type!=='lift'||s.code!==code);
 if(!avoidsClosure)fail(start+': closure bypassed '+code);
 return {start,finish,closedLift:code,alternativeReachable:!!alt,avoidsClosure};
});

const gap=(a,b)=>Math.hypot((a[0]-b[0])*111320*Math.cos((a[1]+b[1])*Math.PI/360),(a[1]-b[1])*111320);
const connectors=graph.edges.filter(e=>e[2]===-1).map(e=>({from:e[0],to:e[1],kind:e[4],distance:gap(graph.nodes[e[0]],graph.nodes[e[1]]),rise:graph.nodes[e[1]][2]-graph.nodes[e[0]][2]}));
const uphill=connectors.filter(x=>x.rise>12);
report.terrain={features:graph.features.length,edges:graph.edges.length,connectors:connectors.length,coarseDemRiseOver12:uphill.length,coincidentUnder1m:uphill.filter(x=>x.distance<1).length,within3m:uphill.filter(x=>x.distance<=3).length,positiveRiseUpTo12:connectors.filter(x=>x.rise>0&&x.rise<=12).length,highestConflicts:uphill.sort((a,b)=>b.rise-a.rise).slice(0,10),note:'Height differences alone are not a reason to add, remove or certify a connection.'};

async function probe(url,kind){
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(15000),redirect:'follow'});
  const result={status:response.status,contentType:response.headers.get('content-type')};
  if(kind==='health'&&response.ok){const data=await response.json();result.version=data.version;result.build=data.build;result.ok=data.ok;result.matchesRepository=data.version===release.version&&data.build===release.build;}
  else await response.body?.cancel();
  return result;
 }catch(e){return {error:e.message};}
}
const live='https://ski-je.bennomuijt.workers.dev';
const [health,panorama,official]=await Promise.all([probe(live+'/api/health','health'),probe(live+'/api/skimap.jpg','image'),probe('https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.jpg','image')]);
report.probes={health,panorama,official,officialMap:'https://skimap.skiwelt.at/',note:'Endpoint availability is not visual verification of the official map. A PR may legitimately differ from production.'};
writeFileSync('quality-audit.json',JSON.stringify(report,null,2)+'\n');
const summary=['## SKI-je scheduled quality audit','', 'UTC '+report.time+' — all '+valleyCases.length+' valley pairs, additional midstation batch '+(batch+1)+' / '+batches,'','Release: '+release.version+' / '+release.build,'Live: '+(health.version||'unverified')+' / '+(health.build||'unknown'),'Live build matches repository: '+(health.matchesRepository??'unknown'),'','| Start | Finish | Model plan | Arrival | Unverified transitions |','| --- | --- | --- | --- | --- |',...report.routes.map(r=>'| '+r.start+' | '+r.finish+' | '+(r.planned?'yes':r.reason||'failed')+' | '+(r.actualModelArrival||'-')+' | '+(r.provisionalTransitions??'-')+' |'),'','Valley day plans: '+report.routes.filter(r=>valleys.includes(r.start)&&valleys.includes(r.finish)&&r.planned).length+' / '+valleyCases.length,'','PDF index completeness: '+report.routes.filter(r=>r.planned&&r.pdfIndexComplete).length+' / '+report.routes.filter(r=>r.planned).length,'Cautious valley scenarios: '+report.cautiousRoutes.filter(r=>r.planned).length+' / '+valleyCases.length+' feasible; infeasible plans are reported, not invented.','Extra wait scenario (+1 minute per lift): '+report.routes.filter(r=>r.planned&&!r.extraWaitScenarioWithinMargin).length+' plans would reach the safety reserve.','','Official sequence checkpoints (not visual confirmation):',...report.mapChecks.map(c=>'- '+c.name+': '+(c.orderedReferenceMatch?'match':c.reachable?'different sequence — review':'no route — review')+' ('+c.matched+'/'+c.expected.length+')'+(c.missingReferenceCodes.length?'; missing '+JSON.stringify(c.missingReferenceCodes):'')+(c.alternateReferenceMatch?'; alternate official sequence matches (source conflict remains)':'')+' — '+c.trace.filter(s=>s.code).map(s=>s.type+':'+s.code).join(' > ')),'','Closure tests: '+report.closureChecks.filter(c=>c.avoidsClosure).length+' / '+valleys.length,'','Coarse DEM conflicts >12m: '+uphill.length+'; within 3m: '+report.terrain.within3m,'','Physical skiability, live closures and visual source comparison require separate validation.','', 'Invariant failures: '+report.failures.length,...report.failures.map(x=>'- '+x)];
console.log(summary.join('\n'));
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary.join('\n')+'\n');
if(report.failures.length)process.exitCode=1;
