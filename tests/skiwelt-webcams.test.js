import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import vm from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const module={exports:{}};vm.runInNewContext(read('public/skiwelt-webcams.js'),{module});
const data=module.exports,cams=data.webcams;
test('alle 17 winter-bergwebcams en 3 dalwebcams staan in de SkiWelt app',()=>{
 assert.equal(cams.length,20);
 assert.equal(cams.filter(x=>x.area==='Dalwebcams').length,3);
 assert.equal(new Set(cams.map(c=>c.id)).size,20);
 assert.equal(data.verifiedOn,'2026-11-24');
 assert.equal(data.areas.length,7);
 for(const c of cams){
  assert.ok(c.id&&c.name&&c.village&&c.area&&c.provider&&c.url&&c.official,c.id);
  assert.ok(['player','snapshot','website'].includes(c.kind),c.id);
  for(const u of [c.url,c.official]){const x=new URL(u);assert.equal(x.protocol,'https:');}
  assert.ok(c.official.includes('skiwelt.at'),c.id+' official page');
 }
});
test('gecontroleerde bronnen zijn echte individuele streams of transparant als momentopname aangeduid',()=>{
 assert.equal(cams.find(c=>c.id==='hartkaiser').url,'https://webtv.feratel.com/webtv/?cam=5525&design=v5');
 assert.equal(cams.find(c=>c.id==='brantlalmsee').url,'https://webtv.feratel.com/webtv/?cam=5523&design=v5');
 assert.equal(cams.find(c=>c.id==='jochbahn').url,'https://webtv.feratel.com/webtv/?cam=5521&design=v5');
 assert.equal(cams.find(c=>c.id==='kleine-salve').url,'https://webtv.feratel.com/webtv/?cam=5686&design=v5');
 assert.equal(cams.find(c=>c.id==='jochstubn').kind,'snapshot');
 assert.equal(cams.find(c=>c.id==='kreuzjoechlsee').kind,'snapshot');
 assert.equal(cams.find(c=>c.id==='holzalm').kind,'website');
 assert.equal(cams.filter(c=>c.kind==='player').length,17);
});
test('alle 20 webcams beschikbaar vanuit camerapagina; externe media alleen na selectie',()=>{
 const html=read('public/index.html'),css=read('public/extra.css'),sw=read('public/sw.js');
 assert.match(html,/<script src="skiwelt-webcams\.js"><\/script>/);
 assert.ok(html.indexOf('<script src="skiwelt-webcams.js">')<html.indexOf('const webcamSources=window.SKIWebcamCatalogue'));
 assert.match(html,/cameraArea\.addEventListener\('change',renderCameras\)/);
 assert.match(html,/cameraStill\.src=c\.url/);
 assert.match(html,/cameraFrame\.src=c\.url/);
 assert.match(html,/camera-refresh/);
 assert.match(html,/skije-nav-height/);
 assert.match(css,/--skije-bottom-safe/);
 assert.match(css,/\.webcam-modal\{padding-bottom:var\(--skije-bottom-safe\)\}/);
 assert.match(sw,/skiwelt-webcams\.js/);
});
