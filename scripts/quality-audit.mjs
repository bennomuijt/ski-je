// Read-only scheduled QA. No publishing, editing source, or user data access.
// Connectivity and coarse elevation estimates are NOT physical verification.
import {readFileSync,writeFileSync,appendFileSync} from 'node:fs';
import {release} from '../src/release.js';
import '../public/skiwelt-map-router.js';

const graph=JSON.parse(readFileSync(new URL('../public/skiwelt-network-graph.json',import.meta.url),'utf8'));
const router=globalThis.SKIMapRouter;
const network=router.initialize(graph);
const stations=['Ellmau dalstation','Going dalstation','Scheffau dalstation','Söll dalstation','Brixen dalstation','Westendorf dalstation','Hopfgarten dalstation','Itter dalstation','Hopfgarten tussenstation','lift:112:middle1','lift:30:middle1'];
const hour=Math.floor(Date.now()/3600000);
const cases=stations.flatMap(start=>stations.map(finish=>({start,finish})));
const batchSize=6;
const batches=Math.ceil(cases.length/batchSize);
const batch=hour%batches;
const defaults={departure:'09:00',returnTime:'16:00',useLunch:true,lunchTime:'12:30',lunchDuration:60,style:'relaxed',skill:'red',speed:'normal',allowBlack:false,useSafety:true,safetyMarginMin:30};
const report={time:new Date().toISOString(),commit:process.env.GITHUB_SHA||null,release,batch,batches,totalPairs:cases.length,network,scope:'Model simulation, not verified physical skiing or current open status',routes:[],terrain:{},probes:{},failures:[]};
const fail=message=>report.failures.push(message);

for(const {start,finish} of cases.slice(batch*batchSize,(batch+1)*batchSize)){
 const row={start,finish};report.routes.push(row);
 try{
  const from=graph.stations[start]?.node,to=graph.stations[finish]?.node;
  const direct=router.shortest(from,to,defaults);
  row.directReachable=!!direct&&router.validateRoute(direct,from,to);
  if(!row.directReachable)fail(start+' to '+finish+': no directed core connection');
  const r=router.build({...defaults,start,finish});
  row.planned=r.ok;
  if(!r.ok){row.reason=r.reason;continue;} // Time-constrained plans may legitimately be infeasible.
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
  if(!router.validateRoute(r.path,from,to))fail(start+' to '+finish+': discontinuous plan');
  if(!last||router.clock(last.end)>router.clock(r.plan.safeArrival))fail(start+' to '+finish+': arrival outside margin');
  if(active.some(s=>s.type==='piste'&&s.level==='black'))fail(start+' to '+finish+': black piste without permission');
  const lunch=steps.filter(s=>s.type==='lunch');
  if(lunch.length!==1||lunch[0].start!==defaults.lunchTime||lunch[0].minutes!==60)fail(start+' to '+finish+': incorrect lunch');
 }catch(e){fail(start+' to '+finish+': '+e.message);row.error=e.message;}
}

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
const summary=['## SKI-je scheduled quality audit','', 'UTC '+report.time+' — batch '+(batch+1)+' / '+batches,'','Release: '+release.version+' / '+release.build,'Live: '+(health.version||'unverified')+' / '+(health.build||'unknown'),'Live build matches repository: '+(health.matchesRepository??'unknown'),'','| Start | Finish | Model plan | Arrival | Unverified transitions |','| --- | --- | --- | --- | --- |',...report.routes.map(r=>'| '+r.start+' | '+r.finish+' | '+(r.planned?'yes':r.reason||'failed')+' | '+(r.actualModelArrival||'-')+' | '+(r.provisionalTransitions??'-')+' |'),'','Coarse DEM conflicts >12m: '+uphill.length+'; within 3m: '+report.terrain.within3m,'','Physical skiability, live closures and visual source comparison require separate validation.','', 'Invariant failures: '+report.failures.length,...report.failures.map(x=>'- '+x)];
console.log(summary.join('\n'));
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary.join('\n')+'\n');
if(report.failures.length)process.exitCode=1;
