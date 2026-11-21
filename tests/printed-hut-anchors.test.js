import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function c(p){const sandbox={module:{exports:{}},globalThis:{}};vm.runInNewContext(read(p),sandbox);return sandbox.module.exports;}
const map=c('public/skiwelt-printed-hut-anchors.js'),catalog=c('public/hut-catalogue.js');
test('alleen acht zekere groene hutnummers direct uit officiële PDF',()=>{
 assert.equal(map.precision,'pdf-vector-hut-label-center');
 assert.equal(map.huts.length,8);
 const numbers=map.huts.map(h=>h.number);
 assert.equal(new Set(numbers).size,numbers.length);
 for(const p of map.huts){
  assert.ok(p.x>0&&p.x<1&&p.y>0&&p.y<1);
  assert.equal(p.method,'pdf-vector-text');
  assert.equal(p.confidence,'verified');
  const match=catalog.huts.filter(h=>h.source==='official'&&h.number===p.number);
  assert.equal(match.length,1,'hutnummer moet exact één officiële naam hebben: '+p.number);
 }
});
test('hut-labeloverlay werkt uitsluitend bij overeenkomstige kaartverhouding en zoom',()=>{
 const html=read('public/index.html'),js=read('public/pano-restaurants.js'),css=read('public/extra.css'),sw=read('public/sw.js');
 assert.match(html,/skiwelt-printed-hut-anchors\.js\?v=4510/);
 assert.ok(html.indexOf('skiwelt-printed-hut-anchors.js')<html.indexOf('pano-restaurants.js'));
 assert.match(js,/pano-numbered-hut/);
 assert.match(js,/zoom>=1\.8/);
 assert.match(js,/precise=Number\.isFinite/);
 assert.match(css,/\.pano-numbered-hut/);
 assert.match(sw,/skiwelt-printed-hut-anchors\.js/);
});
