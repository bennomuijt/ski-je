import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import '../public/day-planner.js';
const planner=globalThis.SKI_DayPlanner;
const base={start:'Ellmau dalstation',finish:'Ellmau dalstation',departure:'08:00',returnTime:'17:00',useLunch:false};
test('30-minute safety buffer remains default',()=>{
 const p=planner.compute(base);
 assert.equal(p.ok,true,p.reason);
 assert.equal(p.margin,30);
 assert.equal(p.safeArrival,'16:30');
 assert.equal(p.sections.find(x=>x.type==='buffer').minutes,30);
});
test('custom safety buffer adjusts target and PDF-ready schedule',()=>{
 for(const [margin,arrival] of [[10,'16:50'],[45,'16:15'],[90,'15:30']]){
  const p=planner.compute({...base,useSafety:true,safetyMarginMin:margin});
  assert.equal(p.ok,true,p.reason);
  assert.equal(p.margin,margin);
  assert.equal(p.safeArrival,arrival);
  assert.equal(p.sections.find(x=>x.type==='buffer').minutes,margin);
  assert.equal(p.sections.at(-1).end,'17:00');
 }
});
test('unchecked buffer is zero without hiding actual return time',()=>{
 const p=planner.compute({...base,useSafety:false,safetyMarginMin:80});
 assert.equal(p.ok,true,p.reason);
 assert.equal(p.margin,0);
 assert.equal(p.safeArrival,'17:00');
 assert.equal(p.sections.some(x=>x.type==='buffer'),false);
 assert.equal(p.sections.at(-1).end,'17:00');
 assert.match(p.notes.join(' '),/Geen veiligheidsmarge/);
});
test('each break defaults 30 but can be changed or switched off separately',()=>{
 const p=planner.compute({...base,morningBreak:true,morningDuration:15,afternoonBreak:true,afternoonDuration:45});
 assert.equal(p.ok,true,p.reason);
 assert.deepEqual(p.sections.filter(x=>x.type==='break').map(x=>x.minutes),[15,45]);
 const q=planner.compute({...base,morningBreak:false,afternoonBreak:true,afternoonDuration:25});
 assert.equal(q.ok,true,q.reason);
 assert.deepEqual(q.sections.filter(x=>x.type==='break').map(x=>x.minutes),[25]);
});
test('new logo exists and ServiceWorker does not reference files that are absent',()=>{
 const baseUrl=new URL('../',import.meta.url);
 for(const path of ['public/icons/skije-logo-v454.svg','public/icons/icon-192-v43.png','public/icons/icon-512-v43.png','public/pano-restaurants.js']){
  assert.ok(existsSync(new URL(path,baseUrl)),path);
 }
 const icon=readFileSync(new URL('public/icons/skije-logo-v454.svg',baseUrl),'utf8');
 assert.match(icon,/data:image\/webp;base64/); // The image inside the icon is our existing original SKI-je artwork.
 const sw=readFileSync(new URL('public/sw.js',baseUrl),'utf8');
 const core=sw.match(/const CORE=\[([^\]]+)\]/)?.[1]||'';
 for(const [,f] of core.matchAll(/'\.\/([^']+)'/g))assert.ok(existsSync(new URL('public/'+f,baseUrl)),f);
});
