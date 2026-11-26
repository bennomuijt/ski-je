import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/skiwelt-map-router.js';
import '../public/skiwelt-reference-tours.js';

const graph=JSON.parse(readFileSync(new URL('../public/skiwelt-network-graph.json',import.meta.url),'utf8'));
const map=globalThis.SKIMapRouter;
const opts={skill:'red',speed:'normal',allowBlack:false};
const valleys=['Ellmau','Going','Scheffau','Söll','Brixen','Westendorf','Hopfgarten','Itter'].map(x=>x+' dalstation');
const defaults={...opts,departure:'09:00',returnTime:'16:00',useLunch:true,lunchTime:'12:30',lunchDuration:60,style:'relaxed',useSafety:true,safetyMarginMin:30};
const node=name=>graph.stations[name].node;
function chosenClosures(path){
 const steps=map.group(path,opts);
 const lift=steps.find(s=>s.type==='lift'&&s.code);
 const piste=steps.find(s=>s.type==='piste'&&s.code);
 assert.ok(lift&&piste,'expected at least one named lift and piste');
 return [{kind:'lift',code:lift.code},{kind:'piste',code:piste.code.split(',')[0].trim()}];
}
function verify(path,from,to,closures){
 assert.ok(map.validateRoute(path,from,to),'continuous directed alternative');
 const closed=map.closureSet(closures);
 for(const s of map.group(path,opts)){
  assert.ok(!closed.has(s.type+':'+String(s.code||'').toLowerCase()),'closed leg '+s.code);
  if(s.type==='piste')for(const code of String(s.code||'').split(','))assert.ok(!closed.has('piste:'+code.trim().toLowerCase()),'closed component '+code);
  if(s.type==='piste')assert.notEqual(s.level,'black');
 }
 if(closures.some(x=>x.kind==='piste'&&['111','117'].includes(x.code)))assert.ok(path.edgeIds.every(id=>map.getEdge(id)[4]!=='official-tour-provisional'));
}
test('all 56 inter-valley paths under single lift, single piste and simultaneous closures',()=>{
 map.initialize(graph);
 let alternatives=0,unreachable=0,cases=0;
 for(const start of valleys)for(const finish of valleys){
  if(start===finish)continue;
  const a=node(start),b=node(finish),baseline=map.shortest(a,b,opts);
  assert.ok(baseline,start+' to '+finish);
  const [lift,piste]=chosenClosures(baseline);
  for(const closures of [[lift],[piste],[lift,piste]]){
   cases++;const p=map.shortest(a,b,opts,closures);
   if(!p){unreachable++;continue;}
   verify(p,a,b,closures);alternatives++;
  }
 }
 assert.equal(cases,168);assert.ok(alternatives>0);
 console.log('Closure matrix: '+cases+' cases; '+alternatives+' alternatives; '+unreachable+' no route');
});
test('full-day rerouting from every valley, with lunch and safe arrival retained',()=>{
 map.initialize(graph);
 let alternatives=0,noPlan=0;
 for(let i=0;i<valleys.length;i++){
  const start=valleys[i],finish=valleys[(i+1)%valleys.length];
  const base=map.build({...defaults,start,finish});
  assert.ok(base.ok,base.reason);
  // Use a lift and piste from the middle of the actual day, so a closure
  // is not always merely closure of the starting gondola.
  const legs=base.features,mid=Math.floor(legs.length/2);
  const ranked=[...legs.slice(mid),...legs.slice(0,mid)];
  const l=ranked.find(s=>s.type==='lift'&&s.code),p=ranked.find(s=>s.type==='piste'&&s.code);
  assert.ok(l&&p);
  const lift={kind:'lift',code:l.code},piste={kind:'piste',code:p.code.split(',')[0].trim()};
  for(const rows of [[lift],[piste],[lift,piste]]){
   const r=map.build({...defaults,start,finish},rows);
   if(!r.ok){assert.ok(r.reason);noPlan++;continue;}
   verify(r.path,node(start),node(finish),rows);
   const last=r.itinerary.steps.filter(s=>['lift','piste','transfer'].includes(s.type)).at(-1);
   assert.ok(last&&map.clock(last.end)<=map.clock('15:30'));
   const lunch=r.itinerary.steps.filter(s=>s.type==='lunch');
   assert.equal(lunch.length,1);assert.equal(lunch[0].minutes,60);
   alternatives++;
  }
 }
 assert.equal(alternatives+noPlan,24);
 console.log('Full-day closures: 24 cases; '+alternatives+' feasible alternatives; '+noPlan+' no plan');
});
test('Hexenwasser 26 and 40 refer to the same lift without closing a similarly numbered piste',()=>{
 const i=graph.features.findIndex(f=>f.kind==='lift'&&f.ref==='40'&&/Hexenwasser/i.test(f.name));
 assert.ok(i>=0);const edge=graph.edges.find(e=>e[2]===i);
 assert.ok(edge);map.initialize({...graph,stations:{},edges:[edge]});
 const [a,b]=edge;
 assert.ok(map.shortest(a,b,opts));
 for(const code of ['26','40']){
  assert.equal(map.shortest(a,b,opts,[{kind:'lift',code}]),null);
  assert.ok(map.shortest(a,b,opts,[{kind:'piste',code}]));
 }
 const j=graph.features.findIndex(f=>f.kind==='piste'&&f.ref==='40');
 const piste=graph.edges.find(e=>e[2]===j);assert.ok(piste);
 map.initialize({...graph,stations:{},edges:[piste]});
 assert.ok(map.shortest(piste[0],piste[1],opts,[{kind:'lift',code:'26'}]));
 assert.ok(map.shortest(piste[0],piste[1],opts,[{kind:'lift',code:'40'}]));
});
test('unresolved area and piste closures do not silently produce a successful day plan',()=>{
 map.initialize(graph);
 const settings={...defaults,start:valleys[0],finish:valleys[2]};
 assert.ok(map.build(settings).ok);
 const area=[{kind:'corridor',code:'ellmau-scheffau'}];
 const result=map.build(settings,area);
 assert.equal(result.ok,false);assert.match(result.reason,/gebiedsverbinding/);
 assert.equal(map.shortest(node(settings.start),node(settings.finish),opts,area),null);
 for(const row of [{kind:'piste',code:'99a'},{kind:'lift',code:'not-mapped'}]){
  const r=map.build(settings,[row]);
  assert.equal(r.ok,false);assert.deepEqual(r.unresolvedClosures,[row.kind+':'+row.code]);
 }
});
test('official tour stage displays both known Hexenwasser closure numbers',()=>{
 const tour=globalThis.SKIOfficialTours;
 // Also verify the exported reference helper without assuming a stage id.
 const synthetic=[{id:'40-stage',liftNumber:'40',pistes:[]},{id:'26-stage',liftNumber:'26',pistes:[]}];
 assert.ok(tour?.closureFlags,'reference-tour API');
 assert.equal(tour.closureFlags(synthetic,[{kind:'lift',code:'26'}]).length,2);
 assert.equal(tour.closureFlags(synthetic,[{kind:'lift',code:'40'}]).length,2);
 assert.equal(tour.closureFlags(synthetic,[{kind:'piste',code:'26'}]).length,0);
});
