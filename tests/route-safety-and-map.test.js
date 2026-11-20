import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sandbox={module:{exports:{}},globalThis:{}};
vm.runInNewContext(read('public/route-engine.js'),sandbox);
const engine=sandbox.module.exports;
const network=[
 {from:'Start',to:'Lift',name:'Lift A',type:'lift',level:'blue',lengthKm:1,verified:true},
 {from:'Lift',to:'Eind',name:'Zwarte piste',type:'piste',level:'black',lengthKm:3,verified:true},
 {from:'Lift',to:'Eind',name:'Rode piste',type:'piste',level:'red',lengthKm:4,verified:true},
 {from:'Lift',to:'Eind',name:'Piste onbekend',type:'piste',lengthKm:0,verified:true}
];
test('black runs are never silently included, even for professional',()=>{
 const e=network.map(engine.normalizedEdge);
 const a=engine.shortest(e,'Start','Eind',540,{skill:'pro',speed:'sporty',allowBlack:false});
 assert.ok(a);
 assert.equal(a.steps.at(-1).name,'Rode piste');
 assert.ok(a.steps.every(s=>s.level!=='black'));
});
test('explicit consent permits black on advanced/profile, but not beginner',()=>{
 const e=network.map(engine.normalizedEdge);
 assert.equal(engine.shortest(e,'Start','Eind',540,{skill:'red',allowBlack:true}).steps.at(-1).name,'Zwarte piste');
 assert.equal(engine.shortest(e,'Start','Eind',540,{skill:'blue',allowBlack:true}),null);
});
test('unknown piste classification is not silently treated as blue',()=>{
 assert.equal(engine.normalizedEdge(network.at(-1)).level,'unknown');
 const e=[network[0],network.at(-1)].map(engine.normalizedEdge);
 assert.equal(engine.shortest(e,'Start','Eind',540,{skill:'pro',allowBlack:true}),null);
});
test('planning speeds vary by selected level and type distances are explicit',()=>{
 const piste=engine.normalizedEdge({from:'A',to:'B',name:'Test',type:'piste',level:'blue',lengthKm:4,verified:true});
 assert.ok(engine.segmentMinutes(piste,'blue','easy')>engine.segmentMinutes(piste,'red','normal'));
 assert.ok(engine.segmentMinutes(piste,'red','normal')>engine.segmentMinutes(piste,'pro','sporty'));
 const html=read('public/index.html');
 assert.match(html,/Stel mijn route samen/);
 assert.match(html,/Wil je ook zwarte pistes op je route/);
 assert.match(html,/id="block-black" value="no" checked/);
 const ui=read('public/day-ui.js');
 assert.match(ui,/pisteKm/);assert.match(ui,/liftKm/);
});
test('restaurant pins clearly mark only approximate areas and never fake interior photos',()=>{
 const source=read('public/pano-restaurants.js');
 assert.match(source,/precision:'area-only'/);
 assert.match(source,/geverifieerde binnenfoto volgt/i);
 assert.match(source,/westendorf-gipfelrestaurant-hohe-salve-innen2\.jpg/);
 assert.match(source,/pano-hut/);
 const group=read('public/group-cloudflare.js');
 assert.match(group,/checkBackend/);
 assert.match(group,/GROUP_CREATE_SECRET/);
});
