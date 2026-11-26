import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/skiwelt-map-router.js';
import '../public/day-pdf.js';

const graph=JSON.parse(readFileSync(new URL('../public/skiwelt-network-graph.json',import.meta.url),'utf8'));
const router=globalThis.SKIMapRouter;
const opts={skill:'red',speed:'normal',allowBlack:false};
const index=graph.features.findIndex(f=>f.osm==='way/765993194');

test('Höhninger Abfahrt is official piste 117b in route labels, PDF and closures',()=>{
 assert.ok(index>=0);
 assert.equal(graph.features[index].ref,'117','raw source is deliberately preserved');
 assert.equal(graph.features[index].name,'Höhninger Abfahrt');
 const edge=graph.edges.find(e=>e[2]===index);
 assert.ok(edge);
 router.initialize({...graph,stations:{},edges:[edge]});
 const [from,to]=edge;
 const path=router.shortest(from,to,opts);
 assert.ok(path);
 const [leg]=router.group(path,opts);
 assert.equal(leg.code,'117b');
 assert.equal(leg.level,'blue');
 assert.equal(globalThis.SKIPdf.routeIndexRows([{...leg,start:'10:00',end:'10:03'}])[0].code,'117b');
 assert.equal(router.shortest(from,to,opts,[{kind:'piste',code:'117b'}]),null);
 assert.ok(router.shortest(from,to,opts,[{kind:'piste',code:'117'}]));
});

test('Neuhögen 117 remains a separate piste, with independent closure',()=>{
 const i=graph.features.findIndex(f=>f.ref==='117'&&f.name==='Neuhögen Abfahrt');
 const edge=graph.edges.find(e=>e[2]===i);
 assert.ok(edge);
 router.initialize({...graph,stations:{},edges:[edge]});
 const [from,to]=edge;
 assert.equal(router.group(router.shortest(from,to,opts),opts)[0].code,'117');
 assert.equal(router.shortest(from,to,opts,[{kind:'piste',code:'117'}]),null);
 assert.ok(router.shortest(from,to,opts,[{kind:'piste',code:'117b'}]));
});
