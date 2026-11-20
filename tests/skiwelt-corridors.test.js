import test from 'node:test';import assert from 'node:assert/strict';
import '../public/skiwelt-corridors.js';
const graph=globalThis.SKIWeltCorridors;
test('official SkiWelt area connections provide a provisional path with warning',()=>{
 assert.equal(graph.areas.length,8);
 const p=graph.build({start:'Ellmau dalstation',finish:'Söll dalstation',departure:'09:00',returnTime:'16:00',wishes:[],useLunch:true});
 assert.equal(p.ok,true);
 assert.deepEqual(p.steps.map(s=>s.from+'->'+s.to),['Ellmau->Scheffau','Scheffau->Brixen','Brixen->Söll']);
 assert.ok(p.steps.every(s=>s.mapListed&&s.status==='unknown'));
 assert.match(p.notes.join(' '),/niet live|status|aanname|aangenomen/i);
 assert.match(p.source,/skiwelt.at/);
});
test('closure report for piste or lift blocks any corridor containing it',()=>{
 const closed=graph.build({start:'Ellmau dalstation',finish:'Scheffau dalstation',useLunch:false},[{kind:'piste',code:'99a',note:'Gesloten'}]);
 assert.equal(closed.ok,false);assert.ok(closed.unreachable.length>0);
 const reopened=graph.build({start:'Ellmau dalstation',finish:'Scheffau dalstation',useLunch:false},[]);
 assert.equal(reopened.ok,true);
});
test('same-area full-day tour uses a documented loop, never an invented connection',()=>{
 const p=graph.build({start:'Ellmau dalstation',finish:'Ellmau dalstation',departure:'09:00',returnTime:'16:00',useLunch:true},[]);
 assert.equal(p.ok,true);assert.ok(p.steps.length>=2);
 assert.equal(p.steps.at(-1).to,'Ellmau');
});
test('input closure data is sanitized and local only',()=>{
 const reports=graph.parseClosures([{kind:'piste',code:'99a',note:'Gesloten',at:'2026-12-21'}, {kind:'lift',code:'97'}, {kind:'piste',code:'<script>'}]);
 assert.equal(reports.length,2);
 assert.ok(reports.every(x=>/^[a-z0-9_-]{1,20}$/.test(x.code)));
});
test('stress: all 64 pairs of listed resorts have a provisional path',()=>{
 let count=0;
 for(const start of graph.areas)for(const finish of graph.areas){
  const route=graph.build({start,finish,departure:'09:00',returnTime:'16:00',useLunch:false},[]);
  assert.equal(route.ok,true,start+' -> '+finish);
  if(start!==finish)assert.ok(route.steps.length>0);
  count++;
 }
 assert.equal(count,64);
});
test('reported closure for connection 99a excludes corridor but not all day schedules',()=>{
 const rows=[{kind:'piste',code:'99a',note:'Sneeuwtekort'}];
 const route=graph.build({start:'Ellmau dalstation',finish:'Scheffau dalstation',useLunch:true},rows);
 assert.equal(route.ok,false);
 assert.ok(route.notes.some(n=>n.includes('verbinding')||n.includes('sluiting')));
});
