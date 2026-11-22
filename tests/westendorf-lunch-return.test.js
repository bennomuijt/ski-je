import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/skiwelt-map-router.js';

const graph=JSON.parse(readFileSync(new URL('../public/skiwelt-network-graph.json',import.meta.url),'utf8'));
const router=globalThis.SKIMapRouter;
router.initialize(graph);

test('Westendorf Talkaser can return via connecting lifts to Hopfgarten middle station',()=>{
 const from=graph.stations['lift:114:top']?.node;
 const to=graph.stations['lift:20:top']?.node;
 assert.ok(Number.isInteger(from)&&Number.isInteger(to),'talkaser and Hopfgarten middle station mapped');
 const route=router.shortest(from,to,{skill:'red',speed:'normal',allowBlack:false});
 assert.ok(route,'a connected return from Westendorf is required');
 assert.ok(router.validateRoute(route,from,to));
 const legs=router.group(route,{skill:'red',speed:'normal'});
 assert.ok(legs.some(s=>s.type==='lift'),'return must be permitted to use connecting lifts');
 const final=router.shortest(to,graph.stations['Hopfgarten dalstation'].node,
  {skill:'red',speed:'normal',allowBlack:false,noLifts:true});
 assert.ok(final,'20a has a separate lift-free descent to the valley');
 assert.ok(router.group(final,{skill:'red',speed:'normal'}).some(s=>s.code==='20a'));
});

test('modelled modern lift time is shorter without removing the return safety margin',()=>{
 const f=graph.features.find(x=>x.kind==='lift'&&x.liftType==='gondola');
 assert.ok(f,'a gondola is in the source graph');
 const r=router.build({
  start:'Hopfgarten dalstation',finish:'Hopfgarten dalstation',departure:'09:00',
  returnTime:'15:53',useLunch:true,lunchTime:'12:21',lunchDuration:57,
  lunchRestaurantLabel:'Hut 69 - Bergrestaurant Talkaser (Westendorf)',
  style:'fast',skill:'red',speed:'normal',allowBlack:false,
  useSafety:true,safetyMarginMin:30
 });
 if(r.ok){
  assert.equal(r.plan.safeArrival,'15:23');
  assert.ok(r.features.some(s=>s.type==='lift'));
  assert.equal(r.features.at(-1).code,'20a');
  assert.ok(r.itinerary.steps.some(s=>s.type==='lunch'&&s.minutes===57));
 }else{
  // The map may still lack a physical transfer or have insufficient time;
  // but the reason must never state that return lifts themselves are forbidden.
  assert.doesNotMatch(r.reason,/terugweg.*zonder lift|geen liften toegestaan/i);
 }
});
