import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/skiwelt-map-router.js';

const graph=JSON.parse(readFileSync(new URL('../public/skiwelt-network-graph.json',import.meta.url),'utf8'));
const map=globalThis.SKIMapRouter;
const opts={skill:'red',speed:'normal',allowBlack:false};

test('real compound piste references respect closures of every component',()=>{
 const compound=graph.features.map((f,i)=>({f,i})).filter(({f})=>f.kind==='piste'&&f.ref?.includes(','));
 assert.ok(compound.length>0);
 for(const {f,i} of compound){
  const edge=graph.edges.find(e=>e[2]===i);
  assert.ok(edge,f.ref);
  const [from,to]=edge;
  // Isolate an existing directed map edge; alternate paths cannot mask a bug.
  map.initialize({...graph,stations:{},edges:[edge]});
  assert.ok(map.shortest(from,to,opts),f.ref+' open baseline');
  for(const code of f.ref.split(',').map(s=>s.trim())){
   assert.equal(map.shortest(from,to,opts,[{kind:'piste',code}]),null,f.ref+' closure '+code);
   assert.ok(map.shortest(from,to,opts,[{kind:'lift',code}]),'lift closure is not a piste closure');
  }
  assert.equal(map.shortest(from,to,opts,[{kind:'piste',code:f.ref}]),null);
 }
});

test('single piste suffix is not confused with a neighbouring number',()=>{
 const i=graph.features.findIndex(f=>f.kind==='piste'&&f.ref==='31b');
 assert.ok(i>=0);
 const edge=graph.edges.find(e=>e[2]===i);
 assert.ok(edge);
 const [from,to]=edge;
 map.initialize({...graph,stations:{},edges:[edge]});
 assert.ok(map.shortest(from,to,opts,[{kind:'piste',code:'31'}]));
 assert.ok(map.shortest(from,to,opts,[{kind:'piste',code:'31a'}]));
 assert.equal(map.shortest(from,to,opts,[{kind:'piste',code:'31b'}]),null);
});
