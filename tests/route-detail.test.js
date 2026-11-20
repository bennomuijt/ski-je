import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/skiwelt-corridors.js';
import '../public/day-planner.js';
import '../public/route-detail.js';
import '../public/day-pdf.js';
const graph=globalThis.SKIWeltCorridors,planner=globalThis.SKI_DayPlanner,detail=globalThis.SKIRouteDetail,pdf=globalThis.SKIPdf;
const base={start:'Ellmau dalstation',finish:'Ellmau dalstation',departure:'09:00',returnTime:'16:00',date:'2026-12-20',lunchTime:'12:30',lunchDuration:60,useLunch:true,style:'relaxed'};
function sample(options={}){
 const opts={...base,...options};
 const route=graph.build(opts,[]);
 const plan=planner.compute({...opts,returnEstimate:route.returnEstimate});
 return {opts,plan,route,itinerary:detail.buildTimeline(plan,route)};
}
test('far scenic circuit avoids repeated rounds in home area and has home-return time',()=>{
 const p=sample();
 assert.equal(p.plan.ok,true);
 assert.ok(p.route.scenicTarget!=='Ellmau'&&p.route.scenicTarget!=='Going');
 assert.equal(p.route.steps[0].from,'Ellmau');
 assert.equal(p.route.steps.at(-1).to,'Ellmau');
 assert.ok(p.route.phases.return.length>=1);
 assert.ok(p.plan.sections.find(x=>x.type==='return').minutes>=p.route.returnEstimate+15);
});
test('official numbered lift and slope segments are distinct and have appropriate colours',()=>{
 const p=sample();
 const steps=p.itinerary.steps;
 assert.ok(steps.some(s=>s.type==='lift'));
 assert.ok(steps.some(s=>s.type==='piste'));
 assert.ok(steps.filter(s=>s.type==='lift').every(s=>/^\d/.test(s.label)));
 assert.ok(steps.filter(s=>s.type==='piste').every(s=>/^\d/.test(s.label)));
 assert.ok(steps.filter(s=>s.type==='lift'||s.type==='piste').every(s=>s.phase&&s.minutes>0));
 assert.ok(detail.catalog['ellmau-scheffau'].ab.some(x=>x.code==='99a'&&x.level==='blue'));
});
test('minute-perfect lunch and timed itinerary, 60 minute lunch',()=>{
 for(const lunchTime of ['11:46','12:07','12:37']){
  const p=sample({departure:'08:00',returnTime:'17:00',lunchTime});
  assert.equal(p.plan.ok,true,lunchTime+' '+p.plan.reason);
  const lunch=p.itinerary.steps.find(x=>x.type==='lunch');
  assert.equal(lunch.start,lunchTime);
  assert.equal(lunch.minutes,60);
  assert.equal(p.itinerary.steps.at(-1).end,'17:00');
  for(const step of p.itinerary.steps)assert.ok(step.startMinute<step.endMinute);
 }
 // A late lunch must not force an unsafe return when the scenic route needs more time.
 const late=sample({departure:'08:00',returnTime:'17:00',lunchTime:'13:14'});
 assert.equal(late.plan.ok,false);
 assert.match(late.plan.reason,/lunch en terugweg passen niet samen/);
});
test('early departure, afternoon break and restaurants retain end of day',()=>{
 const p=sample({departure:'08:00',returnTime:'17:00',morningBreak:true,afternoonBreak:true,lunchRestaurantLabel:'Gipfelrestaurant Hohe Salve Söll',date:'2026-12-22',lunchTime:'11:47',lunchDuration:55});
 assert.equal(p.plan.ok,true,p.plan.reason);
 assert.equal(p.itinerary.steps.at(-1).end,'17:00');
 assert.equal(p.itinerary.steps.find(x=>x.type==='lunch').minutes,55);
 assert.equal(p.itinerary.steps.filter(x=>x.type==='break').length,2);
});
test('all route pairs: no closure ignored and no travel time falsely marked as verified',()=>{
 for(const start of graph.areas)for(const finish of graph.areas){
  const options={...base,start,finish,style:'fast',useLunch:false};
  const route=graph.build(options,[]);
  assert.equal(route.ok,true,start+' -> '+finish);
  assert.ok(route.steps.every(s=>s.status==='unknown'));
  const parts=detail.buildSegments(route.steps);
  assert.ok(parts.every(s=>s.verified===false));
 }
});
test('toilets have cited evidence and indicative time, not a claim of exact on-route access',()=>{
 const p=sample();
 assert.ok(p.itinerary.pois.length>=1);
 assert.ok(p.itinerary.pois.every(x=>x.source.startsWith('https://')&&x.onRouteConfirmed===false));
 assert.ok(p.itinerary.pois.some(x=>x.area==='Scheffau'&&x.estimatedNearTime));
});
test('GPS area selection never claims precise slope position; reject poor GPS and non-SkiWelt areas',()=>{
 const atEllmau={latitude:47.492,longitude:12.272,accuracy:12};
 const guess=detail.homeSuggestion(atEllmau,'Söll dalstation',graph);
 assert.equal(guess.ok,true);
 assert.equal(guess.area,'Ellmau');
 assert.ok(guess.minutes>0);
 assert.match(guess.instructions,/geen exacte pisteherkenning/);
 assert.equal(detail.homeSuggestion({...atEllmau,accuracy:1200},'Ellmau dalstation',graph).ok,false);
 assert.equal(detail.homeSuggestion({latitude:52.08,longitude:4.74,accuracy:5},'Ellmau dalstation',graph).ok,false);
});
test('GPS return honours closure messages and manual area correction',()=>{
 const pos={latitude:47.492,longitude:12.272,accuracy:7};
 const blocked=detail.homeSuggestion(pos,'Scheffau dalstation',graph,[{kind:'piste',code:'99a'}]);
 assert.equal(blocked.ok,false);
 const manual=detail.homeSuggestion(pos,'Söll dalstation',graph,[],'Brixen');
 assert.equal(manual.ok,true);
 assert.equal(manual.area,'Brixen');
});
test('PDF filenames always contain ski date and both exact clock times',()=>{
 const p=sample({date:'2026-12-20',departure:'08:25',returnTime:'16:05'});
 assert.match(detail.fileName(p.plan),/^SKI-je_2026-12-20_08-25_tot_16-05\.pdf$/);
});
test('full PDF report retains all detailed steps, WC options, area legs and warnings',()=>{
 const p=sample({departure:'08:00',returnTime:'17:00',date:'2026-12-21'});
 const pages=pdf.reportPages(p);
 assert.equal(pages[0].kind,'schedule');
 assert.ok(pages.some(x=>x.kind==='detail'));
 assert.ok(pages.some(x=>x.kind==='wc'));
 assert.equal(pages.at(-1).kind,'summary');
 assert.deepEqual(pages.filter(x=>x.kind==='detail').flatMap(x=>x.rows),p.itinerary.steps);
 assert.deepEqual(pages.filter(x=>x.kind==='wc').flatMap(x=>x.rows),p.itinerary.pois);
});
test('conservative planner rejects impossible late lunch and long estimated return',()=>{
 const options={...base,departure:'11:00',returnTime:'15:00',lunchTime:'13:15',lunchDuration:90,returnEstimate:110};
 const plan=planner.compute(options);
 assert.equal(plan.ok,false);
 assert.ok(plan.reason.length>10);
});