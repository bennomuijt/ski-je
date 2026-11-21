import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const context={module:{exports:{}},globalThis:{}};
vm.runInNewContext(read('public/skiwelt-printed-lift-anchors.js'),context);
const pdf=context.module.exports;
const liftSandbox={module:{exports:{}},globalThis:{}};
vm.runInNewContext(read('public/lift-catalogue.js'),liftSandbox);
const liftIds=new Set(liftSandbox.module.exports.lifts.map(x=>x.number));
test('gedrukte liftlabels zijn directe PDF-vectorlocaties en geen gebiedsschatting',()=>{
 assert.equal(pdf.precision,'pdf-vector-lift-label-center');
 assert.match(pdf.source,/SkiWelt-Panorama-26-27-NL\.pdf$/);
 assert.ok(pdf.lifts.length>=75);
 assert.ok(new Set(pdf.lifts.map(x=>x.number)).size>=75);
 for(const point of pdf.lifts){
  assert.ok(liftIds.has(point.number),point.number+' is geen officiële lift');
  assert.ok(point.x>0&&point.x<1&&point.y>0&&point.y<1);
  assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
 }
 assert.ok(pdf.pageWidth>1000&&pdf.pageHeight>1000);
});
test('onzekere PDF-liftnummers worden expliciet als ontbrekend geadministreerd',()=>{
 const mapped=new Set(pdf.lifts.map(x=>x.number));
 assert.equal(pdf.lifts.length,79);
 assert.equal(mapped.size,77);
 assert.equal(pdf.unresolved.length,6);
 for(const l of pdf.unresolved){assert.ok(liftIds.has(l.number));assert.ok(!mapped.has(l.number));}
});
test('overlays zijn optioneel, object-fit en zoomveilig en niet op OSM GPS geplaatst',()=>{
 const html=read('public/index.html'),js=read('public/pano-lifts.js'),css=read('public/extra.css'),sw=read('public/sw.js');
 assert.match(html,/skiwelt-printed-lift-anchors\.js\?v=4510/);
 assert.ok(html.indexOf('skiwelt-printed-lift-anchors.js')<html.indexOf('pano-lifts.js'));
 assert.match(js,/\.012/);
 assert.match(js,/zoom>=1\.8/);
 assert.match(js,/pano-numbered-lift/);
 assert.match(js,/printed\.lifts/);
 assert.match(css,/\.pano-numbered-lift/);
 assert.match(sw,/skiwelt-printed-lift-anchors\.js/);
 assert.doesNotMatch(js,/navigator\.geolocation\.watchPosition/);
});
