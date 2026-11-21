import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/route-engine.js';
import '../public/skiwelt-corridors.js';
import '../public/skiwelt-stations.js';
import '../public/day-pdf.js';

const graph=globalThis.SKIWeltStations;
const base={start:'Brixen dalstation',finish:'Westendorf dalstation',date:'2026-12-20',
 departure:'09:00',returnTime:'16:00',useLunch:false,skill:'red',speed:'normal'};
const compute=(options={},closures=[])=>graph.plan({...base,...options},closures);
const physical=result=>result.itinerary.steps.filter(s=>s.id);
const trace=result=>physical(result).map(s=>s.type+':'+(s.code||s.id));

test('same station graph separates both directions, the village and Fleiding',()=>{
 const west=compute();
 assert.equal(west.plan.arrival,'09:37');
 assert.deepEqual(trace(west),['transfer:bridge-out','lift:11','piste:110','piste:110b']);
 const fleiding=compute({finish:'Fleiding dalstation Westendorf'});
 assert.equal(fleiding.plan.arrival,'09:34');
 assert.deepEqual(trace(fleiding),['transfer:bridge-out','lift:11','piste:110','piste:111','piste:117']);
 const top=compute({finish:'Fleiding bergstation Westendorf'});
 assert.equal(trace(top).at(-1),'lift:117');
});

test('return reaches the selected Hochbrixen terminal via both small lifts and the bridge',()=>{
 const options={start:base.finish,finish:base.start};
 const valley=compute(options);
 assert.equal(valley.plan.arrival,'10:34');
 assert.deepEqual(trace(valley),['lift:110','lift:111','piste:111','piste:111','piste:111','lift:112','piste:11',
  'transfer:kandler-to-18','lift:18','transfer:18-to-12','lift:12','transfer:12-to-skiwelt','transfer:bridge-back']);
 const upper=compute({...options,finish:'Hochbrixen bergstation'});
 assert.equal(upper.plan.arrival,'10:46');
 assert.equal(trace(upper).at(-1),'lift:1');
 assert.equal(physical(upper).at(-1).to,'Hochbrixen bergstation');
 const redValley=compute({start:'Jochbahn dalstation Brixen'});
 assert.equal(trace(redValley)[0],'piste:1b');
 assert.equal(trace(redValley)[1],'transfer:bridge-out');
});

test('every traversable edge has evidence and paths are directed, continuous and timed',()=>{
 for(const edge of graph.edges){
  assert.ok(edge.evidence.length);
  assert.ok(edge.evidence.every(key=>graph.sources[key]?.startsWith('https://')));
  assert.equal(edge.status,'unknown');
 }
 const codes=new Set(graph.edges.map(s=>s.id));
 assert.equal(codes.size,graph.edges.length);
 for(const start of graph.selectable)for(const finish of graph.selectable){
  const result=compute({start,finish});
  if(!result.plan.ok)continue;
  const steps=physical(result);
  assert.equal(steps[0].from,start);
  assert.equal(steps.at(-1).to,finish);
  assert.ok(steps.every(s=>s.minutes>0&&s.sources.length>0));
  for(let i=1;i<steps.length;i++){
   assert.equal(steps[i-1].to,steps[i].from);
   assert.ok(steps[i-1].endMinute<=steps[i].startMinute);
  }
 }
});

test('unknown station transitions remain auditable and cannot become route edges',()=>{
 for(const start of ['Fleiding bergstation Westendorf','Hochbrixen bergstation']){
  const result=compute({start,finish:base.finish,skill:'pro',allowBlack:true});
  assert.equal(result.plan.ok,false);
  assert.ok(result.gaps.some(g=>g.from===start));
 }
 assert.equal(graph.edges.some(e=>graph.gaps.some(g=>g.from===e.from&&g.to===e.to)),false);
 assert.equal(compute({skill:'blue'}).plan.ok,false);
});

test('closures apply to the specific piste, lift and direction',()=>{
 for(const code of ['18','12','112']){
  const closure=[{kind:'lift',code}];
  assert.equal(compute({},closure).plan.ok,true,code);
  assert.equal(compute({start:base.finish,finish:base.start},closure).plan.ok,false,code);
 }
 assert.equal(compute({},[{kind:'piste',code:'11'}]).plan.ok,true);
 assert.equal(compute({},[{kind:'lift',code:'11'}]).plan.ok,false);
 assert.equal(compute({},[{kind:'piste',code:'110b'}]).plan.ok,false);
 assert.equal(compute({finish:'Fleiding dalstation Westendorf'},[{kind:'piste',code:'110b'}]).plan.ok,true);
 assert.equal(compute({},[{kind:'corridor',code:'brixen-westendorf'}]).plan.ok,false);
 const regions=globalThis.SKIWeltCorridors;
 assert.ok(regions.shortest('Brixen','Westendorf',[{kind:'lift',code:'18'}]));
 assert.equal(regions.shortest('Westendorf','Brixen',[{kind:'lift',code:'18'}]),null);
});

test('round trip reserves lunch, checks arrival and renders the same data for PDF',()=>{
 const trip=compute({finish:base.start,useLunch:true,lunchTime:'12:30',lunchDuration:60});
 assert.equal(trip.plan.arrival,'15:04');
 assert.equal(trip.plan.safeArrival,'15:30');
 assert.equal(trip.itinerary.steps.find(s=>s.type==='lunch').minutes,60);
 assert.equal(trip.itinerary.steps.find(s=>s.phase==='Terugweg').start,'13:30');
 assert.equal(trip.itinerary.steps.at(-1).end,'16:00');
 assert.ok(trip.route.notes.some(s=>/112.*18.*12/.test(s)));
 for(const rows of [trip.itinerary.steps,trip.plan.sections]){
  for(let i=1;i<rows.length;i++)assert.equal(rows[i-1].end,rows[i].start);
 }
 const pages=globalThis.SKIPdf.reportPages(trip);
 assert.deepEqual(pages.filter(page=>page.kind==='detail').flatMap(page=>page.rows),trip.itinerary.steps);
 assert.equal(compute({finish:base.start,useLunch:true,lunchTime:'13:10'}).plan.ok,false);
 assert.equal(compute({finish:base.start,useLunch:true,afternoonBreak:true}).plan.ok,false);
});

test('boarding is compared with official closing including the estimated queue',()=>{
 const late=compute({start:'SkiWeltbahn dalstation Brixen',finish:'Choralpe',
  departure:'16:10',returnTime:'17:00',useSafety:false});
 assert.match(late.plan.reason,/16:15.*16:15/);
 const first=compute({finish:'Hochbrixen bergstation',departure:'08:00'});
 assert.equal(first.plan.arrival,'08:42');
 assert.match(physical(first)[0].detail,/08:35.*30 min tot opening.*16:00/);
 const february=compute({start:'SkiWeltbahn dalstation Brixen',finish:'Choralpe',date:'2027-02-20',
  departure:'16:10',returnTime:'17:00',useSafety:false});
 assert.equal(february.plan.arrival,'16:25');
 const fast=compute({skill:'pro',speed:'sporty'});
 assert.ok(fast.plan.arrival<'09:37');
 assert.equal(physical(fast).find(s=>s.type==='lift').minutes,15);
});

test('station options, calculation and cache use the same offline module',()=>{
 const read=path=>readFileSync(new URL('../public/'+path,import.meta.url),'utf8');
 const html=read('index.html');
 for(const endpoint of graph.selectable)assert.ok(html.includes(endpoint));
 assert.ok(html.indexOf('src="route-engine.js"')<html.indexOf('src="skiwelt-stations.js"'));
 assert.ok(html.indexOf('src="skiwelt-stations.js"')<html.indexOf('src="day-ui.js"'));
 assert.ok(read('sw.js').includes("'./skiwelt-stations.js'"));
 assert.match(read('day-ui.js'),/SKIWeltStations\?\.plan/);
 assert.match(read('return-home-ui.js'),/Europe\/Vienna/);
});
