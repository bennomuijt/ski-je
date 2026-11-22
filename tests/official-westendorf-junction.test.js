import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/skiwelt-map-router.js';

const graph=JSON.parse(readFileSync(new URL('../public/skiwelt-network-graph.json',import.meta.url),'utf8'));
const map=globalThis.SKIMapRouter;
const defaults={skill:'red',speed:'normal',allowBlack:false};
const original=map.initialize(graph);

test('official SkiWelt 111 to 117 itinerary is an anchored ONE-WAY provisional junction',()=>{
 const audit=original.officialPisteJunctionAudit;
 assert.equal(audit.rejected.length,0,JSON.stringify(audit.rejected));
 assert.equal(audit.accepted.length,1);
 const item=audit.accepted[0];
 assert.equal(item.fromRef,'111');
 assert.equal(item.toRef,'117');
 assert.ok(item.metres>=8&&item.metres<=30);
 assert.ok(item.demHeightConflict>=35,'gross DEM disagreement must stay explicit');
 const edge=map.getEdge(graph.edges.length+original.localTransferAudit.accepted.length*2);
 assert.equal(edge[0],item.fromNode);
 assert.equal(edge[1],item.toNode);
 assert.equal(edge[4],'official-tour-provisional');
 assert.notEqual(edge[0],edge[1]);
});
test('Hopfgarten may reach Westendorf Fleiding and Ki-West only by complete traceable paths',()=>{
 for(const k of ['lift:117:bottom','lift:118:bottom','lift:119:bottom','lift:120:bottom']){
  const from=graph.stations['Hopfgarten dalstation'].node,to=graph.stations[k].node;
  const r=map.shortest(from,to,defaults);
  assert.ok(r,'unreachable '+k);
  assert.ok(map.validateRoute(r,from,to));
  const steps=map.group(r,defaults);
  assert.ok(steps.some(s=>s.confidence==='official-tour-provisional'),'missing source-qualified 111->117 link '+k);
  assert.ok(steps.some(s=>s.type==='lift'),'route should include actual lifts '+k);
  assert.ok(steps.some(s=>s.type==='piste'),'route should include pistes '+k);
  assert.ok(steps.some(s=>s.detail?.includes('hoogtemodel')),'must warn about uncertain connection '+k);
 }
});
test('official 111-117 link is not a generic bilateral walk shortcut',()=>{
 const item=original.officialPisteJunctionAudit.accepted[0];
 const row=map.getEdge(graph.edges.length+original.localTransferAudit.accepted.length*2);
 assert.deepEqual([row[0],row[1]],[item.fromNode,item.toNode]);
 assert.equal(row[4],'official-tour-provisional');
});
test('close either official piste and router refuses the provisional shortcut',()=>{
 const from=graph.stations['Hopfgarten dalstation'].node,to=graph.stations['lift:117:bottom'].node;
 for(const code of ['111','117']){
  const r=map.shortest(from,to,defaults,[{kind:'piste',code}]);
  if(!r)continue;
  assert.ok(!r.edgeIds.some(i=>map.getEdge(i)[4]==='official-tour-provisional'),code+' closure bypassed');
 }
});
test('wrong anchor geometry fails closed, no guessed shortcut',()=>{
 const a=original.officialPisteJunctionAudit.accepted[0];
 const altered={...graph,nodes:graph.nodes.map((n,i)=>i===a.toNode?[n[0]+0.005,n[1],n[2]]:n)};
 const check=map.initialize(altered).officialPisteJunctionAudit;
 assert.equal(check.accepted.length,0);
 assert.equal(check.rejected.length,1);
 map.initialize(graph);
});
test('official Hopfgarten piste 20a is classified red throughout the mapped geometry',()=>{
 const initial=graph.stations['lift:20:top'].node,last=graph.stations['Hopfgarten dalstation'].node;
 const p=map.shortest(initial,last,defaults);
 assert.ok(p);
 const segments=map.group(p,defaults).filter(x=>x.type==='piste'&&x.code==='20a');
 assert.ok(segments.length>0);
 assert.ok(segments.every(x=>x.level==='red'));
});
