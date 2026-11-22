import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/skiwelt-map-router.js';
import '../public/day-pdf.js';
const g=JSON.parse(readFileSync(new URL('../public/skiwelt-network-graph.json',import.meta.url),'utf8'));
const m=globalThis.SKIMapRouter,pdf=globalThis.SKIPdf;m.initialize(g);
const defaults={start:'Hopfgarten dalstation',finish:'Hopfgarten dalstation',departure:'09:00',
 returnTime:'16:00',useLunch:true,lunchTime:'12:30',lunchDuration:60,style:'relaxed',
 skill:'red',speed:'normal',useSafety:true,safetyMarginMin:30};
for(const preset of ['salve','foisching','itter']){
 test('PDF index preserves every route piste and lift number in order: '+preset,()=>{
  const route=m.build({...defaults,routePreset:preset,hopfgartenEndMode:'valley'});
  assert.ok(route.ok,route.reason);
  const rows=pdf.routeIndexRows(route.itinerary.steps);
  const allLegs=route.itinerary.steps.filter(x=>['piste','lift','transfer'].includes(x.type));
  assert.equal(rows.length,allLegs.length);
  assert.ok(rows.length>40);
  for(let i=0;i<rows.length;i++){
   assert.equal(rows[i].position,i+1);
   assert.equal(rows[i].code,allLegs[i].displayCode||allLegs[i].code||'');
   assert.equal(rows[i].time,allLegs[i].start);
   assert.ok(rows[i].code||rows[i].type==='transfer'||rows[i].numberStatus==='unverified');
   assert.doesNotMatch(rows[i].label,/Piste zonder nummer|Piste Piste zonder nummer/i);
  }
  assert.equal(rows.at(-1).code,'20a');
  const indexPages=pdf.reportPages(route).filter(x=>x.kind==='route-index');
  assert.deepEqual(indexPages.flatMap(x=>x.rows),rows);
  assert.ok(indexPages.every(x=>x.rows.length<=20));
 });
}
test('an undocumented short piste link stays flagged, never receives an invented code',()=>{
 const route=m.build({...defaults,routePreset:'salve'});
 assert.ok(route.ok);
 const uncertain=pdf.routeIndexRows(route.itinerary.steps).filter(x=>x.type==='piste'&&!x.code);
 assert.ok(uncertain.length>0);
 assert.ok(uncertain.every(x=>x.numberStatus==='unverified'));
 assert.ok(uncertain.every(x=>/nummer te controleren/i.test(x.label)));
});
