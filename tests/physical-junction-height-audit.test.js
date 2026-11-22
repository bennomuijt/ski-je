import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/skiwelt-map-router.js';
const graph=JSON.parse(readFileSync(new URL('../public/skiwelt-network-graph.json',import.meta.url),'utf8'));
const map=globalThis.SKIMapRouter;
map.initialize(graph);

test('short 2D junctions with suspicious uphill DEM remain visible to route audit',()=>{
 const index=graph.edges.findIndex(e=>e[2]===-1 && e[3]<=3 &&
   graph.nodes[e[1]][2]-graph.nodes[e[0]][2]>12);
 assert.ok(index>=0,'expected a short uphill map junction from the source audit');
 const path={edgeIds:[index]};
 const audit=map.auditUphillJunctions(path);
 assert.equal(audit.length,1);
 assert.ok(audit[0].demRise>12);
 assert.match(audit[0].reason,/niet-ski-bare|DEM-fout/);
 // A map junction can disappear from the visual segment list but must not
 // disappear from the underlying elevation/physical-connection audit.
 const visuallyGrouped=map.group(path,{skill:'red',speed:'normal'});
 assert.ok(visuallyGrouped.length<=1);
 assert.equal(map.auditUphillJunctions(path).length,1);
});

test('ordinary downhill piste and lift edges never cause false uphill transfer warnings',()=>{
 const idx=graph.edges.findIndex(e=>graph.features[e[2]]?.kind==='piste');
 const lift=graph.edges.findIndex(e=>graph.features[e[2]]?.kind==='lift');
 assert.ok(idx>=0&&lift>=0);
 assert.deepEqual(map.auditUphillJunctions({edgeIds:[idx,lift]}),[]);
 assert.deepEqual(map.auditUphillJunctions({edgeIds:[]}),[]);
});
test('short flat station access not mislabeled as height conflict',()=>{
 const idx=graph.edges.findIndex(e=>e[2]===-1&&e[3]<=3 &&
   graph.nodes[e[1]][2]-graph.nodes[e[0]][2]<=12);
 assert.ok(idx>=0);
 assert.deepEqual(map.auditUphillJunctions({edgeIds:[idx]}),[]);
});
