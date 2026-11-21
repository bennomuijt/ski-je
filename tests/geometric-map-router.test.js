import test from 'node:test';import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import '../public/skiwelt-map-router.js';
const graph=JSON.parse(readFileSync(new URL('../public/skiwelt-network-graph.json',import.meta.url),'utf8'));
const map=globalThis.SKIMapRouter;
map.initialize(graph);
const options={start:'Ellmau dalstation',finish:'Ellmau dalstation',
 departure:'09:00',returnTime:'16:00',useLunch:true,lunchTime:'12:30',lunchDuration:60,
 skill:'red',speed:'normal',allowBlack:false,style:'relaxed',useSafety:true,safetyMarginMin:30,wishes:[]};
test('SkiWelt has real directional geometry not synthetic area corridors',()=>{
 assert.ok(graph.nodes.length>=3000);assert.ok(graph.edges.length>=5000);
 assert.ok(Object.keys(graph.stations).length>=160,'mapped lifts should offer individual stations');
 for(const n of ['7','8','9','10','18','12','1','30'])for(const type of ['bottom','top'])assert.ok(graph.stations['lift:'+n+':'+type], 'missing lift station '+n+' '+type);
 assert.ok(graph.stations['lift:30:middle1'],'Salvistabahn midway station missing');
 for(const edge of graph.edges)assert.ok(edge[0]!==edge[1]);
 const lifts=graph.features.filter(f=>f.kind==='lift');
 assert.ok(lifts.some(f=>f.ref==='8'&&/Würste?lexpress/i.test(f.name)));
 assert.ok(lifts.some(f=>f.ref==='9'&&/Hochbrixen/i.test(f.name)));
 assert.ok(lifts.some(f=>f.ref==='10'&&/Skischullift/i.test(f.name)));
 assert.ok(graph.features.some(f=>f.kind==='piste'&&f.ref==='7'));
 assert.ok(graph.features.some(f=>f.kind==='piste'&&f.ref==='7a'));
});
test('path from lift lower station to lift upper station includes correct physical lift ascent',()=>{
 const from=graph.stations['Ellmau dalstation'].node,to=graph.stations['Hartkaiser bergstation'].node;
 const route=map.shortest(from,to,{skill:'red',speed:'normal',allowBlack:false});
 assert.ok(route,'Hartkaiser gondola must be reachable');
 assert.ok(map.validateRoute(route,from,to));
 const steps=map.group(route,{speed:'normal'});
 assert.ok(steps.some(x=>x.type==='lift'&&x.code==='80'));
 for(let i=1;i<route.edgeIds.length;i++){
  const last=graph.edges[route.edgeIds[i-1]],next=graph.edges[route.edgeIds[i]];
  assert.equal(last[1],next[0], 'No jump allowed between adjacent lift/piste segments');
 }
});
test('all returned plans have no missing station joins, no imaginary named missing slopes',()=>{
 let okay=0,failed=0;
 const publicStations=Object.keys(graph.stations).filter(name=>!name.startsWith('lift:'));
 let fullyConnected=0;
 for(const [si,start] of publicStations.entries())for(const [fi,finish] of publicStations.entries()){
  const first=graph.stations[start].node,last=graph.stations[finish].node;
  // Check all 144 start/end pairs without recomputing a full 7-hour
  // lunch & scenic search for every pair.
  const direct=map.shortest(first,last,{skill:'red',speed:'normal',allowBlack:false},[]);
  if(!direct){failed++;continue;}
  assert.ok(map.validateRoute(direct,first,last));
  fullyConnected++;
  if((si*publicStations.length+fi)%10!==0)continue;
  const result=map.build({...options,start,finish},[]);
  if(!result.ok){assert.ok(result.reason.length>10);continue;}
  okay++;const list=result.path.edgeIds;
  assert.ok(list.length>0);
  assert.ok(map.validateRoute(result.path,first,last));
  for(let i=1;i<list.length;i++)assert.equal(graph.edges[list[i-1]][1],graph.edges[list[i]][0]);
  assert.ok(result.itinerary.steps.some(x=>x.type==='lift'));
  assert.ok(result.itinerary.steps.some(x=>x.type==='piste'));
  assert.equal(result.plan.sections.at(-1).end,options.returnTime);
 }
 console.log('Directed shortest-path coverage',fullyConnected,'of',publicStations.length**2,'unreachable',failed,
  'full-day route samples',okay);
 assert.equal(fullyConnected,publicStations.length**2,'all known valley and mountain stations must be connected');
 assert.ok(okay>5,'full-day planners must succeed in several sampled station combinations');
});
test('terrain and piste colour prevent reversed black/freeride by default',()=>{
 const piste=graph.features.filter(f=>f.kind==='piste');
 assert.ok(piste.some(f=>f.direction==='forward'||f.direction==='reverse'));
 assert.ok(piste.some(f=>f.difficulty==='advanced'||f.difficulty==='freeride'));
 const from=graph.stations['Ellmau dalstation'].node,to=graph.stations['Hartkaiser bergstation'].node;
 const route=map.shortest(from,to,{skill:'red',speed:'normal',allowBlack:false});
 for(const id of route.edgeIds){
  const feature=graph.features[graph.edges[id][2]];
  if(feature?.kind==='piste')assert.ok(!['advanced','expert','freeride','extreme'].includes(feature.difficulty));
 }
});

test('every named lift has bottom and top stations mapped to its own ascent geometry',()=>{
 const named=graph.features.filter(x=>x.kind==='lift'&&x.ref);
 for(const lift of named){
  const bottom=graph.stations['lift:'+lift.ref.toLowerCase()+':bottom'],top=graph.stations['lift:'+lift.ref.toLowerCase()+':top'];
  assert.ok(bottom&&top,'no complete stations for lift '+lift.ref);
  assert.notEqual(bottom.node,top.node,'invalid lift '+lift.ref);
 }
});
