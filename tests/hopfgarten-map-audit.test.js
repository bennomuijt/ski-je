import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/skiwelt-map-router.js';

const graph=JSON.parse(readFileSync(new URL('../public/skiwelt-network-graph.json',import.meta.url),'utf8'));
const router=globalThis.SKIMapRouter;
router.initialize(graph);
const piste=graph.features.filter(f=>f.kind==='piste');
const officialNumbers=['20a','20b','21a','21b','21c','22','24a','24b',
 '24,25','25a','25b','25c','26','30,31','31a','31b'];
const normalized=x=>String(x||'').replace(/\s+/g,'').toLowerCase();
const missing=officialNumbers.filter(code=>!piste.some(f=>normalized(f.ref).split(',').includes(normalized(code))));
test('official Hopfgarten piste crosscheck identifies unsupported branches instead of inventing them',()=>{
 assert.ok(piste.some(f=>f.ref==='20a'));
 assert.ok(piste.some(f=>f.ref==='20b'&&f.difficulty==='freeride'));
 for(const code of ['21b','24b','25b'])assert.ok(missing.includes(code),
  'change in source data requires rechecking the official piste crosswalk: '+code);
 assert.ok(missing.length>0,'source map is not complete; do not certify all branches');
});
test('Hopfgarten valley downhill route follows selected, prepared 20a, excludes 20b skiroute',()=>{
 const opts={start:'Hopfgarten dalstation',finish:'Hopfgarten dalstation',departure:'09:00',
  returnTime:'16:00',lunchTime:'12:30',lunchDuration:60,useLunch:true,
  skill:'red',speed:'normal',hopfgartenEndMode:'valley',routePreset:'foisching'};
 const r=router.build(opts);
 assert.equal(r.ok,true,r.reason);
 const used=new Set(r.features.filter(s=>s.type==='piste').map(s=>s.code));
 assert.ok(used.has('20a'));
 assert.ok(!used.has('20b'));
 assert.ok(r.notes.some(s=>s.includes('3.293')));
 assert.ok(r.itinerary.unverifiedTransitions.length>=1,'wide junctions must be visible');
 assert.ok(r.itinerary.steps.some(s=>s.type==='piste'&&!s.code&&s.label.includes('Skitraject')));
});
test('midpoint route reserves extra time for downhill and shows optional PDF page',()=>{
 const r=router.build({start:'Hopfgarten dalstation',finish:'Hopfgarten dalstation',
  departure:'09:00',returnTime:'16:00',lunchTime:'12:30',lunchDuration:60,
  useLunch:true,skill:'red',hopfgartenEndMode:'middle',routePreset:'salve'});
 assert.equal(r.ok,true,r.reason);
 assert.ok(r.plan.margin>=60);
 assert.ok(Number(r.plan.safeArrival.replace(':',''))<=1500);
 assert.equal(r.optionalDescent.available,true);
 assert.equal(r.optionalDescent.steps.at(-1).code,'20a');
});
