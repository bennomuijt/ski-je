import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function catalogue(file){
 const context={module:{exports:{}},globalThis:{}};vm.runInNewContext(read(file),context);
 return context.module.exports;
}
const {huts,officialCount}=catalogue('public/hut-catalogue.js');
const {lifts}=catalogue('public/lift-catalogue.js');
const {byNumber}=catalogue('public/skiwelt-lift-connections.js');
test('catalogus heeft genummerde afzonderlijk selecteerbare liften en hutten',()=>{
 assert.ok(lifts.length>=80);
 assert.ok(huts.length>=80);
 assert.ok(officialCount>=70);
 assert.equal(new Set(huts.map(h=>h.id)).size,huts.length);
 assert.equal(new Set(lifts.map(l=>l.number)).size,lifts.length);
 assert.ok(huts.every(h=>typeof h.name==='string'&&h.name.length>2));
 assert.ok(huts.every(h=>h.precision==='area-only'));
 assert.ok(lifts.every(l=>l.precision==='area-only'));
});
test('piste- en gebiedsverbindingen uitsluitend waar uit officiële bron beschreven',()=>{
 assert.ok(Object.keys(byNumber).length>=20);
 for(const [number,data] of Object.entries(byNumber)){
  assert.ok(lifts.some(l=>l.number===number),'verbindingslift '+number+' ontbreekt');
  assert.ok(data.to&&data.details&&data.via);
  assert.ok(Array.isArray(data.pistes));
  assert.ok(data.pistes.every(p=>/^[0-9a-z-]+$/i.test(p)));
 }
});
test('interactieve kaart toont afzonderlijke items per gebied met een eigen popup',()=>{
 const html=read('public/index.html'),lift=read('public/pano-lifts.js'),hut=read('public/pano-restaurants.js');
 for(const id of ['pano-lift-buttons','pano-hut-buttons','pano-hut-search','pano-lift-search',
   'pano-lift-connections','pano-lift-pistes','pano-hut-location','pano-hut-photo','pano-lift-photo']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(lift,/buttons\.append\(b\)/);
 assert.match(lift,/pano-target-button/);
 assert.match(lift,/data\.areas/);
 assert.match(hut,/buttons\.append\(b\)/);
 assert.match(hut,/pano-target-button/);
 assert.match(hut,/data\.huts/);
 assert.match(html,/id="pano-lifts-visible" checked/);
 assert.match(html,/id="pano-restaurants-visible" checked/);
 assert.doesNotMatch(lift,/getCurrentPosition|watchPosition/);
 assert.doesNotMatch(hut,/getCurrentPosition|watchPosition/);
});
test('offline shell bevat alle nieuwe gegevensbestanden',()=>{
 const sw=read('public/sw.js');
 for(const file of ['hut-catalogue.js','lift-catalogue.js','skiwelt-lift-connections.js',
   'pano-lifts.js','pano-restaurants.js'])assert.ok(sw.includes("'./"+file+"'"),file);
});
