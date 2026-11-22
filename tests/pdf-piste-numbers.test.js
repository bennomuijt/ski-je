import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
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
   assert.equal(rows[i].code,allLegs[i].code||'');
   assert.equal(rows[i].time,allLegs[i].start);
   if(rows[i].type==='piste'&&!rows[i].code)assert.match(rows[i].label,/Skitraject/);
   assert.doesNotMatch(rows[i].label,/nummer.*controleren|piste zonder nummer/i);
  }
  assert.equal(rows.at(-1).code,'20a');
  const indexPages=pdf.reportPages(route).filter(x=>x.kind==='route-index');
  assert.deepEqual(indexPages.flatMap(x=>x.rows),rows);
  assert.ok(indexPages.every(x=>x.rows.length<=20));
 });
}
test('confirmed piste numbers apply to routes, including closure checks',()=>{
 const feature=g.features.findIndex(f=>f.osm==='way/263312372');
 const edgeId=g.edges.findIndex(e=>e[2]===feature);
 assert.ok(edgeId>=0);
 assert.equal(g.features[feature].ref,'','the raw source lacks a reference');
 const [start,finish]=g.edges[edgeId];
 const [step]=m.group({edgeIds:[edgeId]},defaults);
 assert.equal(step.code,'22');
 assert.match(step.label,/Piste 22 · Hohe Salve - Rigi/);
 const alternative=m.shortest(start,finish,defaults,[{kind:'piste',code:'22'}]);
 assert.ok(!alternative||alternative.edgeIds.every(id=>m.getEdge(id)[2]!==feature));
});

test('the rendered PDF uses skitraject for unnumbered geometry and leaves transfer numbers empty',async()=>{
 const route=m.build({...defaults,routePreset:'salve'});
 assert.ok(route.ok,route.reason);
 const rows=pdf.routeIndexRows(route.itinerary.steps);
 assert.ok(rows.some(row=>row.type==='piste'&&!row.code));
 assert.ok(rows.some(row=>row.type==='transfer'&&!row.code));
 const printed=[];
 const ctx={
  fillRect(){},
  fillText(text){printed.push(text);},
  measureText(text){return {width:text.length*8};},
  createLinearGradient(){return {addColorStop(){}};}
 };
 const sandbox={Blob,TextEncoder,Uint8Array,atob,window:{},document:{createElement:()=>({
  getContext:()=>ctx,toDataURL:()=>'data:image/jpeg;base64,/9j/2Q=='
 })}};
 runInNewContext(readFileSync(new URL('../public/day-pdf.js',import.meta.url),'utf8'),sandbox);
 const report=await sandbox.SKIPdf.generate(route);
 assert.equal(report.type,'application/pdf');
 assert.ok(printed.includes('SKITRAJECT'));
 assert.ok(printed.includes('OVERSTAP'));
 assert.ok(printed.includes('22'));
 assert.ok(printed.every(text=>!/te controleren|nummer controleren|Bij ONBEVESTIGD/i.test(text)));
});
