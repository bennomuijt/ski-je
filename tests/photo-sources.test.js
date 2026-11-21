import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const data=JSON.parse(read('public/skiwelt-fotobronnen-2026.json'));
test('brononderzoek geeft gebieden, officiële media, VVV, sociale en boekingsbronnen',()=>{
 assert.ok(data.restaurants.length>=25);
 assert.ok(data.lifts.length>=10);
 assert.ok(data.meta.sourceCount>=60);
 const categories=new Set([...data.restaurants,...data.lifts].flatMap(r=>r.sources.map(s=>s.type)));
 for(const c of ['interieur','boeking','sociaal','vvv','foto'])assert.ok(categories.has(c),c);
 for(const target of ['Brantlalm','Sonnalm','KRAFTalm','Rübezahl-Alm','Bergrestaurant Brandstadl']){
  assert.ok(data.restaurants.some(r=>r.name===target),'restaurant ontbreekt: '+target);
 }
 for(const target of ['Hartkaiserbahn','Brandstadlbahn I','Brandstadlbahn II','Salvenbahn II']){
  assert.ok(data.lifts.some(r=>r.name===target),'lift ontbreekt: '+target);
 }
});
test('bronverwijzingen veilig en geen ongevraagde auteursrechtclaims',()=>{
 for(const item of [...data.restaurants,...data.lifts]){
  assert.ok(item.name.length>=3);
  assert.ok(Array.isArray(item.sources)&&item.sources.length>0,item.name);
  for(const source of item.sources){
   assert.match(source.url,/^https:\/\//);
   assert.ok(!source.url.includes('javascript:'));
   if(source.image)assert.match(source.image,/^https:\/\//);
  }
 }
 assert.match(data.meta.copyright,/toestemming/);
 assert.match(data.meta.battery,/aanvraag/);
});
test('bronzoeker laadt uitsluitend bij openen en geen externe afbeeldingen',()=>{
 const html=read('public/index.html'),script=read('public/ski-photo-sources.js'),sw=read('public/sw.js');
 for(const id of ['ski-photo-sources','ski-photo-sources-search','ski-photo-sources-kind','ski-photo-sources-results','ski-photo-sources-status'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/ski-photo-sources\.js\?v=459/);
 assert.match(html,/id="pano-hut-more-sources"/);
 assert.match(read('public/pano-restaurants.js'),/SKIPhotoSources\\?\\.open\\(hut\\.name\\)/);
 assert.match(script,/panel\.addEventListener\('toggle'/);
 assert.match(script,/fetch\('\.\/skiwelt-fotobronnen-2026\.json'/);
 assert.match(script,/rel='noopener noreferrer'/);
 assert.doesNotMatch(script,/createElement\('img'\)/);
 assert.match(sw,/ski-photo-sources\.js/);
 assert.match(sw,/skiwelt-fotobronnen-2026\.json/);
 assert.ok(existsSync(new URL('public/ski-photo-sources.js',root)));
});
