import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/skiwelt-map-router.js';

const graph=JSON.parse(readFileSync(new URL('../public/skiwelt-network-graph.json',import.meta.url),'utf8'));
const router=globalThis.SKIMapRouter;
router.initialize(graph);

// All public valley access stations plus the two mapped lift mid-stations.
// An isolated beginners' drag lift is not automatically a through connection.
const core=[
 'Ellmau dalstation','Going dalstation','Scheffau dalstation','Söll dalstation',
 'Brixen dalstation','Westendorf dalstation','Hopfgarten dalstation','Itter dalstation',
 'Hopfgarten tussenstation','lift:112:middle1','lift:30:middle1'
];
const shortestOptions={skill:'red',speed:'normal',allowBlack:false};
const defaults={departure:'09:00',returnTime:'16:00',useLunch:true,lunchTime:'12:30',
 lunchDuration:60,style:'relaxed',skill:'red',speed:'normal',allowBlack:false,useSafety:true,safetyMarginMin:30};
const minutes=xs=>xs.reduce((n,x)=>n+x.minutes,0);

test('all 11 main valleys and middle stations are mutually reachable by directed groomed piste/lift paths',()=>{
 for(const from of core){
  assert.ok(graph.stations[from],from+' missing');
  for(const to of core){
   const first=graph.stations[from].node,last=graph.stations[to].node;
   const route=router.shortest(first,last,shortestOptions);
   assert.ok(route,'No connection '+from+' to '+to);
   assert.ok(router.validateRoute(route,first,last),'Disconnected legs '+from+' to '+to);
   const legs=router.group(route,shortestOptions);
   assert.ok(legs.every(x=>x.type!=='piste'||x.level!=='black'),from+' -> '+to+' black route');
  }
 }
});

test('all 11 access stations can generate a full safe-return itinerary with automatic lunch',()=>{
 const failures=[];
 for(const start of core){
  const r=router.build({...defaults,start,finish:start});
  if(!r.ok)failures.push(start+': '+r.reason);
  else{
   assert.ok(r.path.edgeIds.length,start+' empty');
   assert.equal(r.plan.safeArrival,'15:30',start+' safety buffer');
   assert.ok(r.itinerary.steps.some(s=>s.type==='lunch'&&s.minutes===60),start+' lunch');
   assert.ok(router.validateRoute(r.path,graph.stations[start].node,graph.stations[start].node),start+' not a loop');
   console.log('SKI-je return loop:',start,'ski minutes',r.itinerary.routeMinutes,
    'lunch station',r.plan.lunchRestaurant);
  }
 }
 assert.deepEqual(failures,[],'Some starting stations still need routing/validity repair');
});

test('Talkaser has two separately routed official lift approaches, not a synthetic direct path',()=>{
 const targets=['lift:114:top','lift:111:top'];
 for(const station of targets){
  assert.ok(graph.stations[station],'Missing official Talkaser alternative '+station);
  const to=graph.stations[station].node;
  for(const start of core){
   const from=graph.stations[start].node;
   const out=router.shortest(from,to,shortestOptions),back=router.shortest(to,from,shortestOptions);
   assert.ok(out&&back,'Talkaser '+station+' unreachable from/to '+start);
   assert.ok(router.validateRoute(out,from,to)&&router.validateRoute(back,to,from));
  }
 }
 const result=router.build({...defaults,start:'Hopfgarten dalstation',
  finish:'Hopfgarten dalstation',lunchRestaurantLabel:'Hut 69 - Bergrestaurant Talkaser (Westendorf)',
  lunchTime:'12:21',lunchDuration:57,returnTime:'15:53'});
 console.log('Talkaser Hopfgarten 09:00–15:53:',result.ok?result.plan.safeArrival:result.reason);
 if(result.ok){
  assert.ok(result.itinerary.steps.some(s=>s.type==='lunch'&&s.minutes===57));
  assert.equal(result.features.at(-1).code,'20a');
  assert.equal(result.plan.safeArrival,'15:23');
 }
});
