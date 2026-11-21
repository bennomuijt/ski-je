import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/skiwelt-corridors.js';
import '../public/day-planner.js';
import '../public/hut-catalogue.js';
const net=globalThis.SKIWeltCorridors;
const day=globalThis.SKI_DayPlanner;
const base={start:'Ellmau dalstation',finish:'Ellmau dalstation',departure:'09:00',returnTime:'16:00',lunchTime:'12:30',lunchDuration:60,useLunch:true,skill:'red',style:'relaxed',useSafety:true,safetyMarginMin:30};
const mins=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
test('automatische lunchlocatie en de terugweg worden gezamenlijk binnen het schema gekozen',()=>{
 const route=net.build(base);
 assert.equal(route.ok,true,route.reason);
 assert.equal(route.lunchAutomaticallyChosen,true);
 assert.ok(net.areas.includes(route.lunchArea));
 assert.ok(route.phases.preLunch.length>0);
 assert.equal(route.phases.preLunch.at(-1).to,route.lunchArea);
 assert.equal(route.phases.return.at(-1).to,'Ellmau');
 const p=day.compute({...base,returnEstimate:route.returnEstimate});
 assert.equal(p.ok,true,p.reason);
 const early=route.phases.preLunch.reduce((n,e)=>n+e.minutes,0);
 const after=route.phases.postLunch.reduce((n,e)=>n+e.minutes,0);
 const returnMinutes=route.phases.return.reduce((n,e)=>n+e.minutes,0);
 const lunch=p.sections.find(x=>x.type==='lunch');
 const back=p.sections.find(x=>x.type==='return');
 assert.ok(540+early+15<=mins(lunch.start));
 assert.ok(mins(lunch.end)+after+10<=mins(back.start));
 assert.ok(back.minutes>=returnMinutes);
 assert.equal(p.sections.at(-1).end,'16:00');
});
test('een gekozen restaurant blijft vast en wordt niet stilzwijgend vervangen',()=>{
 const result=net.build({...base,lunchRestaurantLabel:'Hut 30 - Bergrestaurant Brandstadl (Scheffau)'});
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.lunchArea,'Scheffau');
 assert.equal(result.lunchAutomaticallyChosen,false);
 const invalid=net.build({...base,lunchRestaurantLabel:'Een onbekende hut zonder gebied'});
 assert.equal(invalid.ok,false);
});
test('bij een onhaalbaar lunchscenario worden alternatieven gezocht of een duidelijke fout gegeven',()=>{
 const result=net.build({...base,departure:'12:00',lunchTime:'12:15',returnTime:'14:00'});
 assert.equal(result.ok,false);
 assert.match(result.reason,/lunch|tijd|route/i);
 assert.ok(result.steps.length===0);
});
test('een rit met verschillend begin- en eindpunt houdt de directe corridorvolgorde',()=>{
 const r=net.build({...base,finish:'Söll dalstation'});
 assert.equal(r.ok,true,r.reason);
 assert.deepEqual(r.steps.map(s=>s.from+'->'+s.to),['Ellmau->Scheffau','Scheffau->Brixen','Brixen->Söll']);
});
test('geen fictieve exacte restaurantpositie of real-time status',()=>{
 const route=net.build(base);
 assert.ok(route.steps.every(x=>x.status==='unknown'&&x.mapListed));
 assert.ok(route.notes.some(x=>/ter plaatse controleren|niet live gecontroleerd/i.test(x)));
 assert.equal(globalThis.SKIHutCatalogue.precision,'area-only');
});
