import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=load('public/index.html'),extra=load('public/extra.js'),css=load('public/extra.css'),api=load('src/index.js');
const sw=load('public/sw.js'),ui=load('public/day-ui.js'),pdf=load('public/day-pdf.js'),model=load('public/day-planner.js');
test('restore route planner full day, PDF and share with uncertainty label',()=>{
 for(const id of ['create','plan-output','closed-form','closed-code','closed-list','closed-kind','closed-status']){
  assert.match(html,new RegExp('id="'+id+'"'),id);
 }
 assert.match(html,/src="day-planner\.js"/);
 assert.match(html,/src="skiwelt-corridors\.js"/);
 assert.match(html,/src="day-ui\.js"/);
 assert.match(html,/src="day-pdf\.js"/);
 assert.match(extra,/window\.SKIDayUI\.render\(\)/);
 assert.match(ui,/window\.SKIPdf\.generate/);
 assert.match(ui,/navigator\.share/);
 assert.match(ui,/localStorage/);
 assert.match(ui,/Geen bevestigde gebiedsverbinding/);
 assert.match(pdf,/icon-512-v43\.png/);
 assert.match(pdf,/application\/pdf/);
 assert.match(model,/safeArrival/);
});
test('full SkiWelt panorama is embedded in-app, has villages and offline fallback',()=>{
 assert.match(html,/api\/skimap\.jpg/);
 assert.match(api,/SkiWelt-Panorama-26-27-NL\.jpg/);
 assert.match(html,/pano-focus/);
 assert.match(extra,/pano-focus/);
 assert.match(html,/Going.*Ellmau|Ellmau.*Scheffau/s);
 assert.match(sw,/skimap\.jpg/);
});
test('radar uses requested GPS, wind has more than two points, webcam has visible back',()=>{
 assert.match(html,/id="radar-gps"/);
 assert.match(html,/id="camera-back-bottom"/);
 assert.match(html,/← Terug/);assert.match(html,/camera-back-bottom'\)\.addEventListener\('click',closeCamera\)/);
 for(const key of ['salve','hartkaiser','brixen','westendorf','scheffau','going','itter','hopfgarten']){
  assert.ok(extra.includes(key+':['),key);
 }
 assert.match(html,/GPS voor radar/);assert.match(html,/radarMap\.setView\(\[lat,lng\],8\)/);
});
test('update button changes colour when clicked, without clearing local settings',()=>{
 assert.match(css,/is-updating/);assert.match(css,/is-current/);assert.match(css,/is-failed/);
 assert.match(load('public/app-update.js'),/b\.classList\.add\(state\)/);
 assert.doesNotMatch(load('public/app-update.js'),/localStorage\.clear/);
});