import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/highlights-core.js',import.meta.url),'utf8');
const context={};context.globalThis=context;
vm.runInNewContext(source,context);
const {summarise,shareText}=context.SKIHighlightsCore;
const day=(date,km,speed,minutes)=>({date,startAt:Date.parse(date+'T08:00:00Z'),endAt:Date.parse(date+'T15:30:00Z'),distanceKm:km,speedMax:speed,elapsedMs:minutes*60000});
test('highlights are made from actual locally saved days only',()=>{
 const result=summarise([
  day('2026-12-20',34.1,45.2,290),
  day('2026-12-21',41.4,48.9,340),
  {date:'2026-12-22',startAt:Date.parse('2026-12-22T08:00:00Z'),distanceKm:999,speedMax:400},
 ]);
 assert.equal(result.days,2);
 assert.equal(result.totalKm,75.5);
 assert.equal(result.bestKm,41.4);
 assert.equal(result.bestKmDate,'2026-12-21');
 assert.equal(result.fastestDate,'2026-12-21');
 assert.equal(result.highestSpeed,48.9);
 assert.equal(result.totalMinutes,630);
 assert.match(shareText(result),/mogelijke liftritten/);
 assert.match(shareText(result),/GPS-schatting/);
});
test('invalid speed and distance are excluded without producing a fake record',()=>{
 const result=summarise([day('2026-12-20',-200,140,150),day('2026-12-21',400,400,120)]);
 assert.equal(result.totalKm,0);assert.equal(result.highestSpeed,0);
 assert.equal(result.days,2);
});
test('empty highlights do not invent ski statistics',()=>{
 assert.equal(summarise([]).days,0);
 assert.equal(summarise([]).bestKmDate,null);
 assert.match(shareText(summarise([])),/nog geen opgeslagen/);
});
test('app integrates day events, local PNG cards and low-cost rendering',()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const extra=readFileSync(new URL('../public/extra.js',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/ski-highlights.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
 for(const id of ['ski-highlights','my-highlights-quick','highlight-days','highlight-total-km','highlight-best-day','highlight-speed','highlight-share-image','highlight-copy','highlight-photo'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(extra,/skije:dayschanged/);
 assert.match(ui,/ski-highlights/);
 assert.match(ui,/canvas\.toBlob/);
 assert.doesNotMatch(ui,/navigator\.geolocation|watchPosition/);
 assert.doesNotMatch(ui,/fetch\(/);
 assert.match(sw,/highlights-core\.js/);
 assert.match(sw,/ski-highlights\.js/);
 assert.doesNotMatch(sw,/\[.*ski-intro-man-snowboard\.webp/);
});
