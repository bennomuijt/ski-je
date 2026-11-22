import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function load(path){
 const sandbox={module:{exports:{}},globalThis:{}};
 vm.runInNewContext(read(path),sandbox,{filename:path});
 return sandbox.module.exports;
}
const printed=load('public/skiwelt-printed-hut-labels.js');
const catalogue=load('public/hut-catalogue.js');
test('69 individuele GROENE hutlabels zijn exact aan de officiële panoramaversie gekoppeld',()=>{
 assert.equal(printed.labels.length,69,'alle zichtbare genummerde groene daken');
 assert.equal(new Set(printed.labels.map(x=>x[0])).size,69,'geen onbedoelde dubbele groene symbolen');
 assert.equal(printed.image.width,3537);
 assert.equal(printed.image.height,2445);
 assert.match(printed.image.sha256,/^[0-9a-f]{64}$/);
 assert.match(printed.precision,/not-gps/);
 for(const [number,x,y] of printed.labels){
  assert.match(number,/^\d+$/,number);
  assert.ok(x>0&&x<1&&y>0&&y<1,number);
  assert.ok(catalogue.huts.some(h=>h.number===number),'Geen restaurantnaam voor groen kaartlabel '+number);
 }
});
test('8 exact in PDF gevonden groene nummers vallen op de JPEG-symbolen',()=>{
 const pdf={18:[.72142,.84198],61:[.34338,.42669],62:[.36120,.31124],66:[.83088,.52152],
  76:[.95606,.57278],79:[.78575,.58713],95:[.89827,.38934],99:[.49937,.69191]};
 for(const [num,[x,y]] of Object.entries(pdf)){
  const hut=printed.labels.find(item=>item[0]===num);
  assert.ok(hut,num);
  assert.ok(Math.abs(hut[1]-x)<.001&&Math.abs(hut[2]-y)<.001,'PDF/JPEG alignment '+num);
 }
});
test('56 toont een expliciete keuze; ontbrekende gedrukte nummers blijven in de lijst',()=>{
 const same=catalogue.huts.filter(h=>h.number==='56');
 assert.equal(same.length,2);
 assert.match(same.map(x=>x.name).join(' '),/Kaiserlounge/);
 assert.match(same.map(x=>x.name).join(' '),/Bergkaiser/);
 for(const num of ['37','54'])assert.ok(catalogue.huts.some(h=>h.number===num));
 for(const num of ['16','22','39','73','87']){
  assert.ok(catalogue.huts.some(h=>h.number===num),num);
  assert.equal(printed.labels.filter(h=>h[0]===num).length,0,num+' mag geen fictieve kaartpositie krijgen');
 }
 assert.equal(printed.labels.filter(x=>x[0]==='56').length,1);
});
test('offline shell bevat de groene kaartlaag; klik blijft mogelijk met markerlaag uit',()=>{
 const html=read('public/index.html'),sw=read('public/sw.js');
 const script=read('public/pano-restaurants.js'),css=read('public/extra.css');
 assert.ok(html.indexOf('skiwelt-printed-hut-labels.js')<html.indexOf('pano-restaurants.js'));
 assert.match(sw,/skiwelt-printed-hut-labels\.js/);
 assert.match(script,/printedPositions/);
 assert.match(script,/openPrintedHut\(nearest.anchor\)/);
 assert.match(script,/view.addEventListener\('pointerup'/);
 assert.match(script,/Math\.min\(30,Math\.max\(17,g\.zoom\*2\.3\)\)/);
 assert.match(css,/\.pano-printed-hut/);
 assert.doesNotMatch(script,/watchPosition|getCurrentPosition/);
});
