import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import vm from 'node:vm';

function data(path){
 const code=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const scope={module:{exports:{}},globalThis:{}};
 vm.runInNewContext(code,scope,{filename:path});
 return scope.module.exports;
}
const catalogue=data('public/lift-catalogue.js');
const printed=data('public/skiwelt-printed-lift-labels.js');
const labels=printed.labels.map(([number,x,y])=>({number,x,y}));
const num=n=>labels.filter(x=>x.number===n);
test('alle visueel bekeken witte liftnummers staan in een datumvastgelegde kaartlaag',()=>{
 assert.equal(labels.length,80,'80 losse kaartlabels uit vector-PDF + visuele controle');
 assert.equal(new Set(labels.map(x=>x.number)).size,78,'78 unieke kaartnummers');
 assert.equal(printed.image.width,3537);
 assert.equal(printed.image.height,2445);
 assert.match(printed.image.sha256,/^[a-f0-9]{64}$/);
 assert.match(printed.precision,/not-gps/);
 for(const marker of labels){
  assert.ok(marker.number.match(/^\d+[a-z]?$/),marker.number);
  assert.ok(marker.x>0&&marker.x<1&&marker.y>0&&marker.y<1,marker.number);
  assert.ok(catalogue.lifts.some(l=>l.number===marker.number)||marker.number==='89',marker.number+' ontbreekt');
 }
 for(const n of ['80','112'])assert.equal(num(n).length,2,n+' heeft twee gedrukte posities voor dezelfde lift');
 for(const n of ['22','23'])assert.equal(num(n).length,1,n+' blijft aanklikbaar');
 for(const n of ['40','59','89'])assert.equal(num(n).length,1,n+' heeft een speciaal geval');
});
test('de kaart bevat geen automatische gok voor ambigu 89 of bronconflicten 40/59',()=>{
 assert.equal(printed.conflicts['40'].statusNumber,'26');
 assert.equal(printed.conflicts['59'].statusNumber,'59');
 assert.deepEqual(Array.from(printed.conflicts['89'].choices),['89a','89b','89c']);
 const lookup=Object.fromEntries(catalogue.lifts.map(l=>[l.number,l.name]));
 assert.match(lookup['59'],/Hexenteppich 2/);
 assert.match(lookup['26'],/Hexenwasser/);
 assert.match(lookup['40'],/liftstatus nr\. 26/);
 assert.equal(Object.hasOwn(lookup,'58a'),false,'58a niet automatisch als 59 of Mühlbichl behandelen');
});
test('alle gedrukte liftlabels zijn offline beschikbaar',()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const src=readFileSync(new URL('../public/pano-lifts.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
 assert.match(html,/skiwelt-printed-lift-labels\.js/);
 assert.ok(html.indexOf('skiwelt-printed-lift-labels.js')<html.indexOf('pano-lifts.js'));
 assert.match(src,/printedData\.labels/);
 assert.match(src,/if\(anchor\.number==='89'\)/);
 assert.match(sw,/skiwelt-printed-lift-labels\.js/);
});
