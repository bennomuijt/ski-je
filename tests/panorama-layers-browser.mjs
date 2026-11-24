/* Real browser exercise of proposed panorama layers on a LOCAL version of
 * SKI-je, not the earlier deployed Worker. The image is a stand-in; tests
 * interaction and layout but makes NO claim of precise map coordinates. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium} from 'playwright-core';
// In the immersive map, filter options are collapsed over the full-height map.
async function setPanoLayer(page,id,checked){
 const toggle=page.locator('#pano-options-toggle');
 if((await toggle.getAttribute('aria-expanded'))!=='true')await toggle.click();
 const input=page.locator(id);
 if(checked)await input.check();else await input.uncheck();
 if((await toggle.getAttribute('aria-expanded'))==='true')await toggle.click();
}
const root=resolve('public');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/api/skimap.jpg'){
   const official=resolve('test-artifacts/skiwelt-official-26-27.jpg');
   try{
    if((await stat(official)).isFile()){
     const raw=await readFile(official);
     res.writeHead(200,{'content-type':'image/jpeg','cache-control':'no-store'});res.end(raw);return;
    }
   }catch{}
  }
  const local=path==='/api/skimap.jpg'?'/Kaart 2026-2027.png':path==='/'?'/index.html':path;
  const file=resolve(root,'.'+local);
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  if(!(await stat(file)).isFile())throw Error('file missing');
  const raw=await readFile(file);res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(raw);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 await page.addStyleTag({content:'#ski-intro,#legal-gate{display:none!important}'});
 // Exercise the NEW route-reference UI on the actual proposed branch.
 await page.locator('#create').click();
 // The full itinerary is intentionally collapsed by default. Export and share
 // buttons stay visible above it; expand the route before checking its contents.
 const itinerary=page.locator('#day-route-collapsible');
 await itinerary.waitFor({state:'attached',timeout:25000});
 assert.equal(await itinerary.evaluate(el=>el.open),false,'the computed itinerary should start collapsed');
 for(const id of ['#download-day-pdf','#share-day-plan','#share-day-pdf','#show-day-panorama']){
  assert.ok(await page.locator(id).isVisible(),id+' must be available above the collapsed itinerary');
 }
 await itinerary.evaluate(el=>el.open=true);
 const refs=page.locator('.official-tour-reference');
 await refs.waitFor({state:'attached',timeout:25000});
 assert.equal(await refs.count(),1,'official tour is not rendered in day planner');
 await refs.evaluate(el=>el.open=true);
 assert.equal(await page.locator('.official-tour-stage').count(),31,'clockwise reference stages omitted');
 assert.match(await page.locator('.official-tour-rows').innerText(),/Sonnenband/);
 assert.match(await page.locator('.official-tour-rows').innerText(),/Sonnenlift/);
 await page.locator('#reference-tour-direction').selectOption('counter');
 assert.equal(await page.locator('.official-tour-stage').count(),33,'counter-clockwise reference stages omitted');
 await page.locator('#reference-tour-search').fill('Filzbodenbahn');
 assert.equal(await page.locator('.official-tour-stage').count(),1);
 assert.match(await page.locator('.official-tour-rows').innerText(),/6a/);
 await page.locator('#reference-tour-search').fill('');
 await refs.evaluate(el=>el.open=false);
 await mkdir('test-artifacts',{recursive:true});
 await page.screenshot({path:'test-artifacts/official-tour-390.png'});
 console.log('PASS local mobile day planner official tour 31+33 stages, Hochbrixen and search');
 await page.locator('#pano-open').evaluate(el=>el.click());
 await page.waitForFunction(()=>document.getElementById('pano-img')?.naturalWidth>0,{timeout:20000});
 await page.locator('#pano-lifts .pano-lift-group').first().waitFor();
 // In CI the official 3537x2445 JPG is provided by panorama-label-reference.mjs.
 // Project exact PDF text centres onto the panorama and verify each lift panel.
 if(await page.locator('#pano-img').evaluate(img=>img.naturalWidth===3537&&img.naturalHeight===2445)){
  assert.equal(await page.locator('#pano-lifts .pano-printed-lift').count(),80);
  await page.evaluate(()=>{
   const view=document.getElementById('pano-viewport'),img=document.getElementById('pano-img'),rect=view.getBoundingClientRect();
   const w=Math.min(rect.width,rect.height*img.naturalWidth/img.naturalHeight);
   const h=Math.min(rect.height,rect.width*img.naturalHeight/img.naturalWidth);
   const zoom=8;
   const px=(.5-.5925)*w*zoom,py=(.5-.6129)*h*zoom;
   img.style.transform='translate3d('+px+'px,'+py+'px,0) scale('+zoom+')';
  });
  await page.waitForFunction(()=>!document.querySelector('.pano-printed-lift[data-lift-number="22"]')?.hidden,{timeout:5000});
  await page.locator('.pano-printed-lift[data-lift-number="22"]').evaluate(el=>el.click());
  assert.match(await page.locator('#pano-lift-name').innerText(),/Lift 22 · 8er Gondelbahn Salvenbahn II/);
  assert.match(await page.locator('#pano-lift-area').innerText(),/1775 m/);
  assert.ok(await page.locator('.pano-printed-lift[data-lift-number="23"]').count());
  // Duplicated white labels show one physical lift. Ambiguous labels stay explicit.
  for(const [n,regex] of [['80',/Lift 80/],['112',/Lift 112/],['59',/Lift 59 · Hexenteppich 2/],['40',/Lift 40 · Hexenwasser/]]){
   const targets=page.locator('.pano-printed-lift[data-lift-number="'+n+'"]');
   assert.equal(await targets.count(),n==='80'||n==='112'?2:1);
   await targets.first().evaluate(el=>el.click());
   assert.match(await page.locator('#pano-lift-name').innerText(),regex);
  }
  assert.match(await page.locator('#pano-lift-connections').innerText(),/officiële SkiWelt Tour gebruikt 40|actuele liftstatus gebruikt 26/i);
  await page.locator('.pano-printed-lift[data-lift-number="89"]').evaluate(el=>el.click());
  assert.match(await page.locator('#pano-lift-name').innerText(),/Kaartnummer 89/);
  assert.equal(await page.locator('#pano-lift-select option').count(),3);
  assert.deepEqual(await page.locator('#pano-lift-select option').evaluateAll(options=>options.map(x=>x.value)),['89a','89b','89c']);
  await page.locator('#pano-lift-select').selectOption('89b');
  assert.match(await page.locator('#pano-lift-name').innerText(),/Lift 89b/);
  await page.evaluate(()=>{
   const data=window.SKILiftMap.printedLabels();
   if(data.length!==80)throw Error('Not all printed lift numbers registered');
   for(const anchor of data){
    const marker=[...document.querySelectorAll('.pano-printed-lift')].find(el=>el.dataset.liftNumber===anchor.number);
    if(!marker)throw Error('Missing lift '+anchor.number);
   }
  });
  await setPanoLayer(page,'#pano-lifts-visible',false);
  assert.equal(await page.locator('#pano-lifts').isHidden(),true);
  const point=await page.evaluate(()=>{
   const view=document.getElementById('pano-viewport'),img=document.getElementById('pano-img'),rect=view.getBoundingClientRect();
   const w=Math.min(rect.width,rect.height*img.naturalWidth/img.naturalHeight);
   const h=Math.min(rect.height,rect.width*img.naturalHeight/img.naturalWidth);
   const m=img.style.transform.match(/translate3d\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*,\s*0(?:px)?\s*\)\s*scale\(\s*([\d.]+)\s*\)/);
   return {x:rect.left+rect.width/2+(.5806-.5)*w*Number(m[3])+Number(m[1]),
           y:rect.top+rect.height/2+(.61025-.5)*h*Number(m[3])+Number(m[2])};
  });
  await page.locator('#pano-lift-close').click();
  await page.mouse.click(point.x,point.y);
  assert.match(await page.locator('#pano-lift-name').innerText(),/Lift 23 · Rigibahn/);
  assert.match(await page.locator('#pano-lift-area').innerText(),/916 m/);
  // The white printed 89 must also work without decorative layer;
  // it asks for 89a/89b/89c rather than guessing a single lift.
  const printed89=await page.evaluate(()=>{
   const view=document.getElementById('pano-viewport'),img=document.getElementById('pano-img'),rect=view.getBoundingClientRect();
   const w=Math.min(rect.width,rect.height*img.naturalWidth/img.naturalHeight);
   const h=Math.min(rect.height,rect.width*img.naturalHeight/img.naturalWidth);
   const zoom=8;
   img.style.transform='translate3d('+(.5-.46865)*w*zoom+'px,'+(.5-.37299)*h*zoom+'px,0) scale('+zoom+')';
   return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};
  });
  await page.locator('#pano-lift-close').click();
  await page.mouse.click(printed89.x,printed89.y);
  assert.match(await page.locator('#pano-lift-name').innerText(),/Kaartnummer 89/);
  await setPanoLayer(page,'#pano-lifts-visible',true);
  // Green roof symbols have their own reviewed positions, separate from lifts.
  assert.equal(await page.locator('.pano-printed-hut').count(),69);
  // Recenter on Ellmau green 61 so its button is inside the viewport.
  await page.evaluate(()=>{
   const view=document.getElementById('pano-viewport'),img=document.getElementById('pano-img'),rect=view.getBoundingClientRect();
   const w=Math.min(rect.width,rect.height*img.naturalWidth/img.naturalHeight);
   const h=Math.min(rect.height,rect.width*img.naturalHeight/img.naturalWidth);
   const zoom=8,x=.34338,y=.42669;
   img.style.transform='translate3d('+(.5-x)*w*zoom+'px,'+(.5-y)*h*zoom+'px,0) scale('+zoom+')';
  });
  await page.waitForFunction(()=>!document.querySelector('.pano-printed-hut[data-hut-number="61"]')?.hidden,{timeout:15000});
  await page.locator('.pano-printed-hut[data-hut-number="23"]').evaluate(el=>el.click());
  assert.match(await page.locator('#pano-hut-name').innerText(),/Hut 23 · KRAFTalm/);
  assert.match(await page.locator('#pano-hut-location').innerText(),/Groen hutnummer 23/);
  for(const [n,label] of [['37',/Berggasthof Bavaria/],['54',/Treichlhof/],['18',/Das Brixx/]]){
   await page.locator('.pano-printed-hut[data-hut-number="'+n+'"]').evaluate(el=>el.click());
   assert.match(await page.locator('#pano-hut-name').innerText(),label);
  }
  // Two restaurants use printed number 56: require user choice.
  await page.locator('.pano-printed-hut[data-hut-number="56"]').evaluate(el=>el.click());
  assert.match(await page.locator('#pano-hut-name').innerText(),/hutnummer 56/i);
  assert.equal(await page.locator('#pano-hut-select option').count(),3);
  await page.locator('#pano-hut-select').selectOption('h-15');
  assert.match(await page.locator('#pano-hut-name').innerText(),/Bergkaiser/);
  // Actual screen tap on GREEN 61 while decorative markers are disabled.
  await setPanoLayer(page,'#pano-restaurants-visible',false);
  assert.ok(await page.locator('#pano-huts').isHidden());
  const green61=await page.evaluate(()=>{
   const view=document.getElementById('pano-viewport'),img=document.getElementById('pano-img'),rect=view.getBoundingClientRect();
   const w=Math.min(rect.width,rect.height*img.naturalWidth/img.naturalHeight);
   const h=Math.min(rect.height,rect.width*img.naturalHeight/img.naturalWidth);
   const zoom=8,x=.34338,y=.42669;
   img.style.transform='translate3d('+(.5-x)*w*zoom+'px,'+(.5-y)*h*zoom+'px,0) scale('+zoom+')';
   return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};
  });
  await page.locator('#pano-hut-close').click();
  await page.mouse.click(green61.x,green61.y);
  assert.match(await page.locator('#pano-hut-name').innerText(),/Tirol Lodge Lieblingsplatzl/);
  assert.match(await page.locator('#pano-hut-location').innerText(),/Groen hutnummer 61/);
  await setPanoLayer(page,'#pano-restaurants-visible',true);
  console.log('PASS 69 printed GREEN hut numbers, venue choice 56 and overlay-disabled tap on 61');
  await page.screenshot({path:'test-artifacts/printed-green-huts-mobile.png'});
  console.log('PASS 80 printed labels including 22/23, 40/59/89 choices and overlay-off selection');
  await page.screenshot({path:'test-artifacts/printed-lifts-22-23-mobile.png'});
 }
 // Area cluster buttons intentionally disappear when individual printed numbers
 // are visible; reset first to return to the uncluttered overview.
 await page.locator('#pano-hut-close').evaluate(el=>el.click());
 await page.locator('#pano-lift-close').evaluate(el=>el.click());
 await page.locator('#pano-reset').click();
 await page.waitForFunction(()=>[...document.querySelectorAll('#pano-lifts .pano-lift-group')].some(b=>!b.hidden));
 assert.equal(await page.locator('#pano-lifts-visible').isChecked(),true);
 assert.equal(await page.locator('#pano-restaurants-visible').isChecked(),true);
 assert.equal(await page.locator('#pano-lifts .pano-lift-group').count(),8);
 assert.equal(await page.locator('#pano-huts .pano-hut').count(),8);
 await page.locator('#pano-lifts .pano-lift-group').first().evaluate(el=>el.click());
 assert.ok(await page.locator('#pano-lift-info').isVisible());
 assert.ok(await page.locator('#pano-lift-buttons button').count()>0);
 const first=page.locator('#pano-lift-buttons button').first();
 await first.evaluate(el=>el.click());
 assert.match(await page.locator('#pano-lift-name').innerText(),/Lift\s+\d+/);
 const number=await page.locator('#pano-lift-select').inputValue();
 assert.ok(number);
 await page.locator('#pano-huts .pano-hut').first().evaluate(el=>el.click());
 assert.ok(await page.locator('#pano-hut-info').isVisible());
 assert.ok(await page.locator('#pano-hut-buttons button').count()>0);
 await page.locator('#pano-hut-buttons button').first().evaluate(el=>el.click());
 assert.ok((await page.locator('#pano-hut-name').innerText()).length>2);
 await page.locator('#pano-hut-search').fill('KRAFTalm');
 assert.match(await page.locator('#pano-hut-name').innerText(),/KRAFTalm/i);
 await page.locator('#pano-hut-search').fill('');
 await setPanoLayer(page,'#pano-lifts-visible',false);
 assert.equal(await page.locator('#pano-lifts').isHidden(),true);
 await setPanoLayer(page,'#pano-lifts-visible',true);
 assert.equal(await page.locator('#pano-lifts').isVisible(),true);
 await setPanoLayer(page,'#pano-restaurants-visible',false);
 assert.equal(await page.locator('#pano-huts').isHidden(),true);
 await setPanoLayer(page,'#pano-restaurants-visible',true);
 assert.equal(await page.locator('#pano-huts').isVisible(),true);
 await mkdir('test-artifacts',{recursive:true});
 await page.screenshot({path:'test-artifacts/pano-huts-lifts-390.png'});
 console.log('PASS local mobile panorama: 8 groups per layer, numbered choices, search and toggles');
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
