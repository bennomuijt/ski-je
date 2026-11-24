import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const sandbox={module:{exports:{}},globalThis:{}};
vm.runInNewContext(read('public/lift-catalogue.js'),sandbox);
const {lifts,areas,precision,source}=sandbox.module.exports;

test('genummerde liften zijn uniek, benoemd en per deelgebied bereikbaar',()=>{
 assert.ok(lifts.length>=80);
 assert.equal(new Set(lifts.map(x=>x.number)).size,lifts.length,'geen dubbele nummers');
 assert.equal(areas.length,8);
 assert.ok(source.startsWith('https://'));
 for(const lift of lifts){
  assert.match(lift.number,/^\d+[a-z]?$/);
  assert.ok(lift.name.length>=3,lift.number);
  assert.ok(areas.some(a=>a.key===lift.areaKey));
  assert.equal(lift.precision,'area-only');
 }
 assert.equal(precision,'area-only');
});
test('op panorama zelfstandige liftlaag, zoekveld, select en aparte schakelaar',()=>{
 const html=read('public/index.html'),css=read('public/extra.css'),script=read('public/pano-lifts.js');
 for(const id of ['pano-lifts','pano-lifts-visible','pano-lift-count','pano-lift-info','pano-lift-name','pano-lift-search','pano-lift-select','pano-lift-photo','pano-lift-more-sources'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/lift-catalogue\.js\?v=4514/);
 assert.match(html,/pano-lifts\.js\?v=4514/);
 assert.match(css,/\.pano-lift-group/);
 assert.match(script,/sourceSearch\(lift\)/);
 assert.match(script,/new MutationObserver\(schedulePosition\)/);
 assert.match(script,/toggle\.checked/);
 assert.doesNotMatch(script,/getCurrentPosition|watchPosition/);
});
test('PWA haalt liftcatalogus en liftlaag offline binnen',()=>{
 const sw=read('public/sw.js');
 assert.match(sw,/lift-catalogue\.js/);
 assert.match(sw,/pano-lifts\.js/);

});