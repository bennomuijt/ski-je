import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/weather-dashboard.js',import.meta.url),'utf8');
const sandbox={URLSearchParams};vm.runInNewContext(source,sandbox);
const w=sandbox.SKIWeather;
test('14-day query includes hourly temperatures, precipitation, visibility, freezing level and daily totals',()=>{
 const q=w.query(w.point('hopfgarten','mountain'));
 assert.equal(q.get('forecast_days'),'14');
 assert.equal(q.get('elevation'),'1829');
 assert.equal(q.get('timezone'),'Europe/Vienna');
 for(const k of ['temperature_2m','apparent_temperature','precipitation_probability','snowfall','wind_gusts_10m','visibility','freezing_level_height'])assert.ok(q.get('hourly').split(',').includes(k),k);
 for(const k of ['temperature_2m_max','temperature_2m_min','snowfall_sum','sunshine_duration','sunrise','sunset'])assert.ok(q.get('daily').split(',').includes(k),k);
 assert.equal(w.query(w.point('hopfgarten','valley')).get('elevation'),'621');
 assert.equal(w.query({lat:1,lng:2,timezone:'auto'}).has('elevation'),false);
});
test('all eight area pairs use distinct point keys; GPS uses automatic timezone',()=>{
 for(const area of Object.keys(w.areas))assert.notEqual(w.key(w.point(area,'mountain')),w.key(w.point(area,'valley')));
 assert.equal(Object.keys(w.areas).length,8);
 assert.equal(w.query({lat:51,lng:4,timezone:'auto'}).get('timezone'),'auto');
});
test('hour groups include only the chosen local day and handle missing model values',()=>{
 const data={current:{},daily:{time:['2026-12-20','2026-12-21']},hourly:{time:['2026-12-20T23:00','2026-12-21T00:00','2026-12-21T01:00'],temperature_2m:[-3,-2,null]}};
 assert.equal(w.valid(data),true);
 assert.deepEqual(Array.from(w.indices(data,'2026-12-21')),[1,2]);
 assert.equal(w.valid({current:{},hourly:{time:['x']}}),false);
 assert.equal(w.fmt(null,1,' cm'),'—');
 assert.equal(w.fmt(0,1,' cm'),'0.0 cm');
 assert.equal(w.fmt(-4,0,'°C'),'-4°C');
 assert.equal(w.condition(73)[1],'Sneeuw');
 assert.equal(w.condition(null)[1],'Onbekend');
});
test('weather panel and serviceworker contain the new forecast and existing radar',()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
 for(const id of ['wx-area','wx-level','wx-days','wx-chart','wx-all-hours','wx-ski-hours','forecast-hours','radar-map','compare-wind','weather-gps'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(sw,/\.\/weather-dashboard\.js/);
 assert.match(html,/weather-dashboard\.js/);
 assert.match(html,/state\.lastLocation=\{lat,lng\};save\(\);/);
});
