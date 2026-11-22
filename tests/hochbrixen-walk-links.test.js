import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/skiwelt-map-router.js';
const graph=JSON.parse(readFileSync(new URL('../public/skiwelt-network-graph.json',import.meta.url),'utf8'));
const r=globalThis.SKIMapRouter;
const audit=r.initialize(graph).localTransferAudit;
test('Hochbrixen short poling connectors are explicitly whitelisted and terrain checked',()=>{
 assert.equal(audit.rejected.length,0);
 assert.ok(audit.accepted.length>=3);
 assert.ok(audit.accepted.every(x=>x.metres<=130&&Math.abs(x.heightDelta)<=12));
 assert.ok(audit.accepted.some(x=>x.from==='lift:8:top'&&x.to==='lift:1:top'));
});
test('lift 8 to gondola 1 has an explicit walk/pole leg with travel minutes',()=>{
 const a=graph.stations['lift:8:top'].node,b=graph.stations['lift:1:top'].node;
 const path=r.shortest(a,b,{skill:'red',speed:'normal'});
 assert.ok(path);
 assert.ok(r.validateRoute(path,a,b));
 const steps=r.group(path,{skill:'red',speed:'normal'});
 assert.ok(steps.some(s=>s.confidence==='walk-pole'));
 const walk=steps.find(s=>s.confidence==='walk-pole');
 assert.match(walk.label,/Loop\/prik/);
 assert.ok(walk.minutes>=3&&walk.metres<=130);
 assert.match(walk.detail,/hoogteverschil/i);
});
test('unrelated nearby lift stations are never bridged without a listed transfer',()=>{
 const all=graph.edges.filter(e=>e[4]==='walk-pole');
 assert.equal(all.length,0,'transfers are injected only after whitelist validation, not guessed into source JSON');
 assert.equal(audit.accepted.length*2,8);
 const pairs=new Set(audit.accepted.map(x=>x.from+'>'+x.to));
 assert.ok(!pairs.has('lift:9:top>lift:10:top'));
});
test('route graph rejects hand-edited station coordinates outside safe walk limits',()=>{
 const altered={...graph,stations:{...graph.stations}};
 altered.stations['lift:8:top']={...graph.stations['lift:8:top'],
  point:[12.300,47.490,2100],node:graph.stations['lift:8:top'].node};
 // Source of truth is graph.nodes, not the display point.
 const original=graph.nodes[graph.stations['lift:8:top'].node];
 altered.nodes=graph.nodes.slice();
 altered.nodes[graph.stations['lift:8:top'].node]=[original[0]+0.01,original[1],original[2]+20];
 const check=r.initialize(altered).localTransferAudit;
 assert.ok(check.rejected.some(x=>x.a==='lift:8:top'));
 r.initialize(graph);
});
