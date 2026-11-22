import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/skiwelt-map-router.js';

const graph=JSON.parse(readFileSync(new URL('../public/skiwelt-network-graph.json',import.meta.url),'utf8'));
const router=globalThis.SKIMapRouter;
router.initialize(graph);
const defaults={start:'Hopfgarten dalstation',finish:'Hopfgarten dalstation',departure:'09:00',
 returnTime:'16:00',useLunch:true,lunchTime:'12:30',lunchDuration:60,style:'relaxed',
 skill:'red',speed:'normal',allowBlack:false,useSafety:true,safetyMarginMin:30};

function verifyChain(result,finish){
 assert.equal(result.ok,true,result.reason);
 assert.ok(result.path.edgeIds.length>0);
 const start=graph.stations[defaults.start].node;
 assert.ok(router.validateRoute(result.path,start,graph.stations[finish].node),'a disconnected map transition was included');
 assert.equal(result.itinerary.steps.at(-1).end,'16:00');
 const lunch=result.itinerary.steps.find(s=>s.type==='lunch');
 assert.ok(lunch);
 assert.equal(lunch.minutes,60);
 for(const edgeId of result.path.edgeIds){
  const edge=graph.edges[edgeId],feature=graph.features[edge[2]];
  assert.ok(!feature||!['freeride','extreme'].includes(feature.difficulty),'off-piste route selected');
 }
}
test('Hopfgarten valley is accessible from Salvenbahn I midpoint by a lift-free piste 20a',()=>{
 const a=graph.stations['lift:20:top'].node,b=graph.stations['Hopfgarten dalstation'].node;
 const path=router.shortest(a,b,{skill:'red',speed:'normal',noLifts:true,allowBlack:false});
 assert.ok(path);
 assert.ok(router.validateRoute(path,a,b));
 const steps=router.group(path,{skill:'red',speed:'normal'});
 assert.equal(steps.at(-1).code,'20a');
 assert.ok(steps.every(s=>s.type!=='lift'));
 assert.ok(steps.some(s=>s.type==='piste'&&s.code==='20a'));
});
for(const preset of Object.keys(router.hopfgartenPresets)){
 test('Hopfgarten '+preset+': return all the way to valley via piste 20a',()=>{
  const result=router.build({...defaults,routePreset:preset,hopfgartenEndMode:'valley'});
  verifyChain(result,'Hopfgarten dalstation');
  assert.equal(result.endMode,'valley');
  assert.equal(result.optionalDescent.required,true);
  assert.equal(result.features.at(-1).code,'20a');
  assert.ok(result.features.some(s=>s.type==='lift'&&s.code==='20'),'start gondola must be used');
  assert.ok(result.features.every(s=>!(s.type==='lift'&&s.confidence==='piste-descent')));
  const returnIDs=result.route.phases.return.edgeIds;
  assert.ok(returnIDs.every(id=>graph.edges[id][2]===-1||graph.features[graph.edges[id][2]].kind==='piste'),
   'return phase used lift; final return must work without lifts');
 });
 test('Hopfgarten '+preset+': midpoint finish keeps optional descent separate',()=>{
  const result=router.build({...defaults,routePreset:preset,hopfgartenEndMode:'middle'});
  verifyChain(result,'lift:20:top');
  assert.equal(result.optionalDescent.available,true);
  assert.equal(result.optionalDescent.required,false);
  assert.ok(result.plan.endPoint.includes('middenstation'));
  assert.equal(result.plan.safeArrival,'15:00');
  assert.ok(result.optionalDescent.steps.some(s=>s.code==='20a'));
  assert.ok(!result.features.some((s,i)=>i===result.features.length-1&&s.code==='20a'));
  assert.ok(result.optionalDescent.steps.every(s=>s.type!=='lift'));
 });
}
test('a reported closure of piste 20a blocks a planned valley descent, not midpoint end',()=>{
 const closure=[{kind:'piste',code:'20a'}];
 const valley=router.build({...defaults,routePreset:'salve',hopfgartenEndMode:'valley'},closure);
 assert.equal(valley.ok,false);
 assert.match(valley.reason,/20a/);
 const mid=router.build({...defaults,routePreset:'salve',hopfgartenEndMode:'middle'},closure);
 assert.equal(mid.ok,true,mid.reason);
 assert.equal(mid.optionalDescent.available,false);
 assert.ok(!mid.itinerary.steps.some(s=>s.type==='piste'&&s.code==='20a'));
});
test('Hopfgarten preset does not change another village route',()=>{
 const r=router.build({...defaults,start:'Ellmau dalstation',finish:'Ellmau dalstation',
  routePreset:'salve',hopfgartenEndMode:'middle'});
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.optionalDescent,null);
 assert.equal(r.endMode,'normal');
});
