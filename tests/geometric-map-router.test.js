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
 assert.ok(Object.keys(graph.stations).length>=12);
 for(const edge of graph.edges)assert.ok(edge[0]!==edge[1]);
 const lifts=graph.features.filter(f=>f.kind==='lift');
 assert.ok(lifts.some(f=>f.ref==='8'&&/Würstlexpress/i.test(f.name)));
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
 for(const start of Object.keys(graph.stations))for(const finish of Object.keys(graph.stations)){
  const result=map.build({...options,start,finish},[]);
  if(!result.ok){failed++;assert.ok(result.reason.length>10);continue;}
  okay++;const list=result.path.edgeIds,first=graph.stations[start].node,last=graph.stations[finish].node;
  assert.equal(list.length>0,true);
  assert.ok(map.validateRoute(result.path,first,last));
  for(let i=1;i<list.length;i++)assert.equal(graph.edges[list[i-1]][1],graph.edges[list[i]][0]);
  assert.ok(result.itinerary.steps.some(x=>x.type==='lift'));
  assert.ok(result.itinerary.steps.some(x=>x.type==='piste'));
  assert.ok(result.plan.sections.at(-1).end===options.returnTime);
 }
 console.log('Geometric route coverage',okay,'of',Object.keys(graph.stations).length**2, 'missing',failed);
 assert.ok(okay>5,'At least several connected skier routes must exist');
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
