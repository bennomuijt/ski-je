import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/skiwelt-map-router.js';
import '../public/day-pdf.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const graph=JSON.parse(read('../public/skiwelt-network-graph.json'));
const map=globalThis.SKIMapRouter;
map.initialize(graph);
const valleys=['Ellmau','Going','Scheffau','Söll','Brixen','Westendorf','Hopfgarten','Itter'].map(x=>x+' dalstation');
const defaults={departure:'09:00',returnTime:'16:00',useLunch:true,lunchTime:'12:30',lunchDuration:60,style:'relaxed',skill:'red',speed:'normal',allowBlack:false,useSafety:true,safetyMarginMin:30};
const html=read('../public/index.html');
const list=html.match(/const restaurantChoices\s*=\s*\[([\s\S]*?)\];/);
assert.ok(list,'restaurant dropdown not found');
const decode=x=>x.replace(/\\u([0-9a-f]{4})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)));
const choices=[...list[1].matchAll(/\['([^']+)','([^']+)','([^']+)'\]/g)].map(m=>({number:m[1],name:decode(m[2]),area:decode(m[3]),label:'Hut '+m[1]+' - '+decode(m[2])+' ('+decode(m[3])+')'}));
const stationByNumber={
 '30':['Brandstadl bergstation'],'31':['lift:99:top'],'27':['Hohe Salve'],
 '56':['Hartkaiser bergstation'],'33':['lift:69:top'],'34':['lift:71:top'],
 '42':['lift:6:top'],'46':['lift:40:top'],'47':['lift:40:top'],'48':['lift:40:top'],
 '23':['lift:30:middle1'],'69':['lift:114:top','lift:111:top'],'67':['lift:112:top']
};
const node=s=>graph.stations[s]?.node;
function verify(r,options,choice){
 assert.ok(r.ok,r.reason);
 assert.ok(map.validateRoute(r.path,node(options.start),node(options.finish)),'continuous start to finish');
 const steps=r.itinerary.steps;
 const lunch=steps.filter(s=>s.type==='lunch');
 assert.equal(lunch.length,1);
 assert.equal(lunch[0].start,options.lunchTime);
 assert.equal(lunch[0].minutes,options.lunchDuration);
 assert.equal(map.clock(lunch[0].end),map.clock(options.lunchTime)+options.lunchDuration);
 const i=steps.indexOf(lunch[0]),legs=steps.filter(s=>['lift','piste','transfer'].includes(s.type));
 const actualArrival=legs.at(-1).end;
 assert.ok(map.clock(actualArrival)<=map.clock(r.plan.safeArrival),'arrival after safety deadline');
 assert.equal(r.plan.safeArrival,map.hhmm(map.clock(options.returnTime)-options.safetyMarginMin));
 assert.ok(legs.every(s=>s.type!=='piste'||s.level!=='black'));
 const pre=r.route.phases.preLunch,post=r.route.phases.postLunch,back=r.route.phases.return;
 const before=pre.edgeIds.at(-1),after=[...post.edgeIds,...back.edgeIds][0];
 const lunchNode=before===undefined?node(options.start):map.getEdge(before)[1];
 const nextNode=after===undefined?node(options.finish):map.getEdge(after)[0];
 assert.equal(lunchNode,nextNode,'lunch must join morning and afternoon at the same node');
 if(choice){
  assert.ok(lunch[0].label.includes(choice.label),'no silent restaurant substitution');
  assert.ok(stationByNumber[choice.number].map(node).includes(lunchNode),'expected restaurant-area station');
 }
 // The restaurant reference is a station approximation; no assertion about its actual entrance.
 assert.ok(i>=0);
 return {actualArrival,lunchNode,lunchLabel:lunch[0].label};
}

test('all eight valley round trips: automatic lunch plus every actual restaurant dropdown option',()=>{
 assert.equal(choices.length,13);
 let automatic=0,named=0,refused=0;
 const west=[];
 for(const start of valleys){
  const options={...defaults,start,finish:start};
  const auto=map.build(options);
  const a=verify(auto,options);
  automatic++;
  let yes=0,no=0;
  for(const choice of choices){
   const settings={...options,lunchRestaurantLabel:choice.label};
   const r=map.build(settings);
   if(r.ok){
    const x=verify(r,settings,choice);
    named++;yes++;
    if(choice.area==='Westendorf')west.push({start,restaurant:choice.name,ok:true,arrival:x.actualArrival});
   }else{
    refused++;no++;
    assert.ok(typeof r.reason==='string'&&r.reason.length>0);
    if(choice.area==='Westendorf')west.push({start,restaurant:choice.name,ok:false,reason:r.reason});
   }
  }
  console.log('LUNCH_MATRIX '+JSON.stringify({start,automatic:a.lunchLabel,autoArrival:a.actualArrival,namedFeasible:yes,namedRefused:no}));
 }
 assert.equal(automatic,8);assert.equal(named+refused,104);assert.ok(named>=88,'fixed-time coverage must improve over 87');
 console.log('LUNCH_TOTAL '+JSON.stringify({automatic,named,refused,west}));
});
test('automatic lunch is possible at both allowed time boundaries, or explicitly refused',()=>{
 let yes=0,no=0;
 for(const start of valleys)for(const lunchTime of ['11:45','13:15']){
  const settings={...defaults,start,finish:start,lunchTime};
  const r=map.build(settings);
  if(r.ok){verify(r,settings);yes++;}else{assert.ok(r.reason);no++;}
 }
 assert.equal(yes+no,16);
 console.log('LUNCH_BOUNDARIES '+JSON.stringify({yes,no}));
});
test('user Hopfgarten–Talkaser–Hopfgarten exact 57-minute lunch regression',()=>{
 const choice=choices.find(x=>x.number==='69');
 for(const style of ['fast','relaxed']){
  const options={...defaults,start:'Hopfgarten dalstation',finish:'Hopfgarten dalstation',returnTime:'15:53',lunchTime:'12:21',lunchDuration:57,style,lunchRestaurantLabel:choice.label};
  const r=map.build(options);
  assert.ok(r.ok,r.reason);
  const v=verify(r,options,choice);
  assert.equal(r.features.at(-1).code,'20a');
  console.log('LUNCH_TALKASER '+JSON.stringify({style,...v,safeArrival:r.plan.safeArrival}));
 }
});
test('saved restaurant selection cannot affect a route with lunch disabled',()=>{
 const options={...defaults,start:'Hopfgarten dalstation',finish:'Hopfgarten dalstation',useLunch:false};
 const baseline=map.build(options),stale=map.build({...options,lunchRestaurantLabel:'Previously selected unmapped restaurant'});
 assert.ok(baseline.ok,baseline.reason);
 assert.ok(!baseline.itinerary.steps.some(s=>s.type==='lunch'));
 assert.ok(stale.ok,stale.reason);
 assert.ok(!stale.itinerary.steps.some(s=>s.type==='lunch'));
 assert.deepEqual(stale.path.edgeSegments,baseline.path.edgeSegments);
 assert.equal(stale.plan.lunchRestaurant,'');
 console.log('LUNCH_DISABLED '+JSON.stringify({baseline:baseline.ok,stale:stale.ok}));
});

test('separately requested earlier lunch times improve coverage without changing duration or safety',()=>{
 const alternatives=[],unavailable=[];
 let fixed=0;
 for(const start of valleys)for(const choice of choices){
  const options={...defaults,start,finish:start,lunchRestaurantLabel:choice.label};
  const standard=map.build(options);
  if(standard.ok){fixed++;continue;}
  // These are NEW explicitly requested settings in a test, not an
  // automatic change to a user's lunch time.
  let found=false;
  for(const lunchTime of ['12:25','12:20','12:15','12:00','11:50','11:45']){
   const alternative={...options,lunchTime};
   const r=map.build(alternative);
   if(!r.ok)continue;
   const v=verify(r,alternative,choice);
   alternatives.push({start,restaurant:choice.name,lunchTime,actualArrival:v.actualArrival});
   found=true;break;
  }
  if(!found)unavailable.push({start,restaurant:choice.name});
 }
 console.log('LUNCH_FLEX '+JSON.stringify({fixed,total:fixed+alternatives.length,alternatives,unavailable}));
 assert.ok(fixed+alternatives.length>=102,'Expected improved lunch-window coverage');
});

test('Going–Talkaser–Going: explicit day-time alternatives, with unchanged lunch and reserve',()=>{
 const choice=choices.find(x=>x.number==='69');
 // 20–24 Dec 2026. Published operating windows, not live status.
 // The access-lift dated page takes precedence over the general tour table
 // where the two disagree. For this diagnostic only, do not invent windows
 // for unlisted lifts or call an incomplete schedule a verified route.
 // https://kitzskiwelttour.skiwelt.at/de/going/info/astbergbahn-going.html
 // https://kitzskiwelttour.skiwelt.at/de/ellmau/info/hartkaiserbahn.html
 // https://kitzskiwelttour.skiwelt.at/nl/westendorf/info/alpenrosenbahn-westendorf.html
 // https://www.skiwelt.at/nl/kitzskiwelt-tour-1.html
 const windows={
  '100':['08:00','16:00'],'80':['08:00','16:00'],
  '102':['08:15','16:00'],'97':['08:30','16:00'],'98':['08:15','16:00'],
  '99':['08:30','16:00'],'67':['08:30','16:30'],'71':['08:30','16:15'],
  '11':['08:30','15:45'],'112':['07:30','16:45'],
  '18':['08:30','16:00'],'12':['08:30','16:00'],
  '1':['08:45','16:15'],'3':['09:00','16:45'],
  '110':['08:00','16:15'],'111':['08:00','16:15'],
  '69':['08:30','16:30'],'90':['08:00','16:00']
 };
 const scenarios=[
  ['09:00','16:00'],['08:30','16:00'],['09:00','16:10'],
  ['08:30','16:10'],['09:00','16:15'],['08:30','16:15'],
  ['08:30','16:20'],['08:45','16:20']
 ];
 const results=[];
 for(const [departure,returnTime] of scenarios){
  const options={...defaults,start:'Going dalstation',finish:'Going dalstation',
   date:'2026-12-22',departure,returnTime,lunchTime:'11:45',
   lunchRestaurantLabel:choice.label,lunchDuration:60,safetyMarginMin:30};
  const r=map.build(options);
  if(!r.ok){results.push({departure,returnTime,ok:false,reason:r.reason});continue;}
  const v=verify(r,options,choice);
  const lifts=r.itinerary.steps.filter(s=>s.type==='lift').map(s=>({
   code:s.code,label:s.label,start:s.start,end:s.end,
   ...(windows[s.code]?{open:windows[s.code][0],close:windows[s.code][1]}:{})
  }));
  const outside=lifts.filter(s=>s.open&&
   (map.clock(s.start)<map.clock(s.open)||map.clock(s.end)>map.clock(s.close)));
  const unconfirmed=[...new Set(lifts.filter(s=>!s.open).map(s=>s.code))];
  const critical=lifts.filter(s=>['11','112','18','12','96','90'].includes(s.code));
  const returnLifts=lifts.filter(s=>map.clock(s.start)>=map.clock('12:45')).map(s=>s.code);
  const last=lifts.at(-1);
  const knownLastLiftReserve=last.close?map.clock(last.close)-map.clock(last.end):null;
  results.push({departure,returnTime,ok:true,actualArrival:v.actualArrival,
   safeArrival:r.plan.safeArrival,knownLastLiftReserve,critical,returnLifts,
   outside,unconfirmed,lifts,
   hasOfficialBand:returnLifts.includes('18'),
   pisteCodes:r.itinerary.steps.filter(s=>s.type==='piste').map(s=>s.code),
   unverifiedTransitions:r.itinerary.unverifiedTransitions.length});
 }
 console.log('LUNCH_EXTENDED_DAY '+JSON.stringify(results));
 assert.ok(results.some(x=>x.ok&&x.outside.length===0&&
   x.knownLastLiftReserve!==null&&x.knownLastLiftReserve>=10),
  'At least one explicit extended-day model must keep known lift windows and 30 minute end margin');
 // Report missing windows and the Sonnenband bypass separately, not as
 // successful physical/access certification. Never mutate user settings.
});
