import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/skiwelt-reference-tours.js';
import '../public/skiwelt-corridors.js';
import '../public/day-planner.js';
import '../public/route-detail.js';
import {readFileSync} from 'node:fs';
const source=globalThis.SKIOfficialTours,detail=globalThis.SKIRouteDetail,graph=globalThis.SKIWeltCorridors,plan=globalThis.SKI_DayPlanner;
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('official clockwise and counter-clockwise SkiWelt Tour lists preserve each published piste',()=>{
 assert.equal(source.tours.clockwise.length,31);
 assert.equal(source.tours.counter.length,33);
 const lift11=source.tours.clockwise.find(s=>s.liftNumber==='11'&&s.area==='Brixen');
 assert.deepEqual(lift11.pistes,['110','111','117']);
 const step=source.tours.clockwise.find(s=>s.liftNumber==='117'&&s.area==='Westendorf');
 assert.deepEqual(step.pistes,['118']);
 assert.deepEqual(source.tours.counter.find(s=>s.liftNumber==='2'&&s.area==='Brixen').pistes,[{alternatives:['51a','51b']}]);
 assert.ok(source.tours.counter.some(s=>s.liftNumber==='7'&&s.pistes.includes('6a')));
 assert.ok(source.tours.clockwise.some(s=>s.liftNumber==='18'&&s.area==='Brixen'));
 assert.ok(source.tours.clockwise.some(s=>s.liftNumber==='12'&&s.area==='Brixen'));
 assert.ok(source.tours.counter.some(s=>s.liftNumber==='40'&&s.liftName==='Hexenwasser'));
});
test('official stages never claim automatic point-to-point routing between two lifts',()=>{
 for(const direction of ['clockwise','counter']){
  const stages=source.tours[direction];
  assert.equal(new Set(stages.map(s=>s.id)).size,stages.length);
  assert.ok(stages.every(s=>s.continuousToNextVerified===false));
  for(const s of stages){
   assert.ok(s.source.startsWith('https://www.skiwelt.at/'));
   assert.ok(s.pistes.every(p=>typeof p==='string'||(Array.isArray(p.alternatives)&&p.alternatives.length>=2)));
  }
 }
 const path=source.closureFlags(source.tours.clockwise,[{kind:'lift',code:'18'},{kind:'piste',code:'111'}]);
 assert.ok(path.some(p=>p.stage.liftNumber==='18'));
 assert.ok(path.some(p=>p.stage.liftNumber==='11'));
});
test('time overflow must retain every named but skipped lift/piste as missing',()=>{
 const opts={start:'Brixen dalstation',finish:'Westendorf dalstation',departure:'11:00',returnTime:'15:00',lunchTime:'12:00',lunchDuration:60,useLunch:true};
 // A minimal route stub intentionally has a shorter window than published stages.
 const fake={ok:true,departure:'09:00',safeArrival:'09:20',returnTime:'10:00',sections:[
   {type:'ski',startMinute:540,endMinute:550,label:'Skiën'},
   {type:'return',startMinute:550,endMinute:560,label:'Terug'}]};
 const officialLeg={id:'brixen-westendorf',direction:'ba',from:'Westendorf',to:'Brixen',minutes:70,
  codes:['lift:18','lift:12','lift:1']};
 const result=detail.buildTimeline(fake,{steps:[officialLeg],phases:{preLunch:[],postLunch:[],return:[officialLeg]}},{skill:'red'});
 assert.ok(result.missingSteps.length>0);
 assert.ok(result.missingSteps.some(s=>s.code==='18'||s.code==='12'||s.code==='1'));
 assert.ok(result.warnings.some(w=>w.includes('Terugweg past niet')));
});
test('unproven lift-to-lift connections remain explicitly flagged',()=>{
 const settings={start:'Brixen dalstation',finish:'Westendorf dalstation',departure:'09:00',returnTime:'16:00',lunchTime:'12:30',lunchDuration:60,useLunch:true,style:'fast'};
 const route=graph.build(settings);
 const day=plan.compute({...settings,returnEstimate:route.returnEstimate});
 const timeline=detail.buildTimeline(day,route,settings);
 assert.ok(timeline.unverifiedTransitions.length>0);
 assert.ok(timeline.warnings.some(x=>/NIET aaneengesloten/.test(x)));
});
test('static resources and route UI include tour, gap audit, offline caching and pdf safety warnings',()=>{
 const html=read('public/index.html'),js=read('public/day-ui.js'),pdf=read('public/day-pdf.js'),sw=read('public/sw.js');
 for(const id of ['skiwelt-reference-tours.js','skiwelt-tour-ui.js']){assert.ok(html.includes(id));assert.ok(sw.includes("'./"+id+"'"));}
 assert.match(js,/SKIOfficialTourUI\?\.mount/);
 assert.match(js,/missingSteps/);
 assert.match(js,/unverifiedTransitions/);
 assert.match(pdf,/itinerary\?\.warnings/);
});
