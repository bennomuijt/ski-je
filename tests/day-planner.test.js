import test from 'node:test';import assert from 'node:assert/strict';import planner from '../public/day-planner.js';
const base={start:'Ellmau dalstation',finish:'Ellmau dalstation',departure:'09:00',returnTime:'16:00',useLunch:true,lunchTime:'12:30',lunchDuration:60};
const cases=[[{"departure":"09:00","returnTime":"16:00","start":"Ellmau dalstation","finish":"Ellmau dalstation","useLunch":true,"lunchTime":"12:30","lunchDuration":60},true],[{"departure":"08:00","returnTime":"16:30","start":"Scheffau dalstation","finish":"Söll dalstation","useLunch":true,"lunchTime":"11:45","lunchDuration":90,"morningBreak":true,"afternoonBreak":true},true],[{"departure":"10:30","returnTime":"17:00","start":"Hopfgarten dalstation","finish":"Hopfgarten dalstation","useLunch":true,"lunchTime":"13:15","lunchDuration":60},true],[{"departure":"09:00","returnTime":"12:30","start":"Itter dalstation","finish":"Itter dalstation","useLunch":true,"lunchTime":"12:30","lunchDuration":60},false],[{"departure":"12:00","returnTime":"16:00","start":"Ellmau","finish":"Ellmau","useLunch":true,"lunchTime":"11:45","lunchDuration":60},false],[{"departure":"08:15","returnTime":"17:00","start":"Ellmau","finish":"Söll","useLunch":false,"morningBreak":true,"afternoonBreak":true},true],[{"departure":"15:00","returnTime":"16:00","start":"Ellmau","finish":"Ellmau","useLunch":false},false],[{"departure":"09:00","returnTime":"16:00","start":"Ellmau","finish":"Ellmau","useLunch":true,"lunchTime":"13:15","lunchDuration":120},false]];
test('complete schedules: different start/end times, lunch length, breaks and finish stations',()=>{
 for(const [options,expected] of cases){const p=planner.compute(options);assert.equal(p.ok,expected,JSON.stringify(options)+' '+p.reason);if(p.ok){
  assert.equal(p.sections[0].start,p.departure);
  assert.equal(p.sections.at(-1).end,p.returnTime);
  assert.equal(p.sections.find(x=>x.type==='buffer').minutes,30);
  for(let i=1;i<p.sections.length;i++)assert.equal(p.sections[i].startMinute,p.sections[i-1].endMinute);
 }}
});
test('lunch choices persist, including preferred restaurant and correct 60-minute duration',()=>{
 const p=planner.compute({...base,lunchRestaurantLabel:'Bergrestaurant Brandstadl'});
 assert.equal(p.ok,true);
 const lunch=p.sections.find(x=>x.type==='lunch');
 assert.equal(lunch.minutes,60);assert.match(lunch.label,/Brandstadl/);
 assert.equal(lunch.start,'12:30');assert.equal(lunch.end,'13:30');
});
test('no imaginary piste or lift travel claims appear in the schedule',()=>{
 const p=planner.compute({...base,wishes:['piste:25','top:eiberg']});
 assert.equal(p.ok,true);assert.equal(p.wishes.length,2);
 assert.match(p.notes.join(' '),/geen geografisch berekende/);
 assert.equal(p.sections.filter(x=>x.type==='return').length,1);
});
