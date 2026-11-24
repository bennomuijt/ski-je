/* Interactive browser regression for SKI-je 4.5 (Chrome/Chromium).
 * Runs on the deployed PWA, does not join groups, and never transmits real GPS. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,sep,extname} from 'node:path';
import {chromium} from 'playwright-core';
import {release} from '../src/release.js';
// Test the actual proposed branch on localhost, NEVER an older deployed Worker.
const publicRoot=resolve('public');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
let localServer=null;
if(!process.env.SKIJE_URL){
 localServer=createServer(async(request,response)=>{
  try{
   let path=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
   if(path==='/api/health'){response.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});
    response.end(JSON.stringify({ok:true,service:'SKI-je Cloudflare',...release}));return;}
   if(path==='/api/skimap.jpg')path='/Kaart 2026-2027.png';
   if(path==='/')path='/index.html';
   const file=resolve(publicRoot,'.'+path);
   if(!file.startsWith(publicRoot+sep))throw Error('Unsafe path');
   const body=await fs.readFile(file);
   response.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
   response.end(body);
  }catch{response.writeHead(404);response.end('Not found');}
 });
 await new Promise(done=>localServer.listen(0,'127.0.0.1',done));
}
const ROOT=process.env.SKIJE_URL||'http://127.0.0.1:'+localServer.address().port+'/';
const screenshotDir='test-artifacts';
await fs.mkdir(screenshotDir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const issues=[],checks=[];
const add=async(name,fn)=>{try{await fn();checks.push('PASS '+name);console.log('PASS '+name);}catch(e){issues.push({name,error:String(e.stack||e)});console.error('FAIL '+name,String(e));}};
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,acceptDownloads:true,permissions:['geolocation'],geolocation:{latitude:47.47,longitude:12.245},locale:'nl-NL'});
const page=await context.newPage();
page.setDefaultTimeout(9000);
const errors=[];
page.on('pageerror',e=>{errors.push(String(e));console.error('PAGEERROR',String(e));});
await add('open real published app and load route UI',async()=>{
 await page.goto(ROOT,{waitUntil:'domcontentloaded',timeout:40000});
 await page.addStyleTag({content:'#ski-intro,#legal-gate{display:none!important}'});
 await page.waitForFunction(()=>Boolean(window.SKIDayUI&&window.SKIPdf&&window.SKIWeltCorridors),{timeout:25000});
 // The full-screen logo and first-use acknowledgement can block taps.
 await page.evaluate(()=>{
  const intro=document.getElementById('ski-intro');if(intro)intro.hidden=true;
  const gate=document.getElementById('legal-gate');if(gate)gate.hidden=true;
  document.body.classList.remove('brand-arriving','legal-open');
 });
 assert.ok(await page.locator('#create').isVisible());
});
await add('default 09:00-16:00 full day schedule and lunch',async()=>{
 await page.locator('#extra-options').evaluate(el=>el.open=true);
 await page.locator('#departure').fill('09:00');
 await page.locator('#return-time').fill('16:00');
 await page.locator('#create').click();
 await page.locator('#download-day-pdf').waitFor({timeout:8000});
 const itinerary=page.locator('#day-route-collapsible');
 assert.equal(await itinerary.evaluate(el=>el.open),false,'full itinerary should start collapsed');
 for(const id of ['#download-day-pdf','#share-day-plan','#share-day-pdf','#show-day-panorama'])assert.ok(await page.locator(id).isVisible(),id+' must be visible without expanding');
 await itinerary.evaluate(el=>el.open=true);
 const text=await page.locator('#plan-output').innerText();
 assert.match(text,/09:00/);assert.match(text,/16:00/);assert.match(text,/15:30/);
 assert.match(text,/12:30/);assert.match(text,/Lunch/);
 assert.ok((await page.locator('.day-timeline-row').count())>=4);
 assert.ok((await page.locator('.ski-route-step.lift').count())>=1,'lift time checkpoints missing');
 assert.ok((await page.locator('.ski-route-step.piste').count())>=1,'piste time checkpoints missing');
 assert.ok((await page.locator('.ski-route-clock').count())>=7,'time checkpoints missing');
 assert.ok((await page.locator('.graph-track-frame svg polyline').count())>=10,'continuous geographical piste/lift map must be drawn');
 await page.screenshot({path:screenshotDir+'/01-route-mobile.png',fullPage:true});
});
await add('selected lunch restaurant appears in timetable',async()=>{
 const options=await page.locator('#lunch-restaurant option').evaluateAll(opts=>opts.map(o=>({value:o.value,label:o.textContent.trim()})).filter(x=>x.value));
 if(!options.length)throw Error('No restaurant choices populated');
 const choice=options.find(x=>/Brandstadl|Tanzboden|Salvenalm|Rübezahl/i.test(x.label))||options[0];
 await page.locator('#lunch-restaurant').selectOption(choice.value);
 await page.locator('#create').click();
 await page.locator('#day-route-collapsible').evaluate(el=>el.open=true);
 const title=await page.locator('.day-timeline-row.lunch .day-event strong').innerText();
 assert.match(title,/Lunch/i);
 if(!title.includes(choice.label))throw Error('Selected lunch restaurant is missing in planned itinerary: '+JSON.stringify({choice,title}));
});
await add('lunch can be selected to any minute and the slider stays synchronised',async()=>{
 await page.locator('#lunch-time').fill('12:07');
 assert.equal(await page.locator('#lunch-time-slider').inputValue(),'727');
 await page.locator('#lunch-duration').evaluate(el=>{el.value='55';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.locator('#create').click();
 await page.locator('#day-route-collapsible').evaluate(el=>el.open=true);
 const output=await page.locator('#plan-output').innerText();
 assert.match(output,/12:07/);
 assert.ok(await page.locator('.ski-route-step.lunch').isVisible());
 await page.locator('#lunch-time-slider').evaluate(el=>{el.value='755';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(await page.locator('#lunch-time').inputValue(),'12:35');
});
await add('longer day 08:00-17:00 with pauses and earlier lunch',async()=>{
 await page.locator('#departure').fill('08:00');
 await page.locator('#return-time').fill('17:00');
 await page.locator('#lunch-time').fill('11:45');
 await page.locator('#early-break').check();
 await page.locator('#late-break').check();
 await page.locator('#lunch-duration').evaluate(el=>{el.value='60';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.locator('#create').click();
 await page.locator('#day-route-collapsible').evaluate(el=>el.open=true);
 const text=await page.locator('#plan-output').innerText();
 assert.match(text,/08:00/);assert.match(text,/17:00/);assert.match(text,/16:30/);
 assert.ok((await page.locator('.day-timeline-row.break').count())>=1,'expected break(s)');
});
await add('full day exported to actual downloadable multipage PDF',async()=>{
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:45000}),page.locator('#download-day-pdf').click()]);
 const suggested=download.suggestedFilename();
 assert.match(suggested,/\.pdf$/i);
 const dest=screenshotDir+'/SKI-je-browser-test.pdf';
 await download.saveAs(dest);
 const bytes=await fs.readFile(dest);
 assert.ok(bytes.length>30000,'PDF is unexpectedly small: '+bytes.length);
 assert.equal(bytes.subarray(0,8).toString('utf8'),'%PDF-1.4');
 const match=bytes.toString('latin1').match(/\/Count (\d+)\b/);
 assert.ok(match&&Number(match[1])>=4,'full report must have multiple pages');
 assert.match(suggested,/^SKI-je_\d{4}-\d\d-\d\d_08-00_tot_17-00\.pdf$/);
 console.log('PDF FILE',suggested,bytes.length,'bytes, '+match[1]+' pages');
});
await add('different starting and finishing villages: Ellmau to Söll',async()=>{
 await page.locator('#same-end').uncheck();
 const start=page.locator('#start'),end=page.locator('#finish');
 const getOption=(options,search)=>options.find(x=>x.label.toLowerCase().includes(search.toLowerCase())&&x.label.toLowerCase().includes('dalstation'));
 const starts=await start.locator('option').evaluateAll(opts=>opts.map(o=>({value:o.value,label:o.textContent.trim()})));
 const ends=await end.locator('option').evaluateAll(opts=>opts.map(o=>({value:o.value,label:o.textContent.trim()})));
 const a=getOption(starts,'Ellmau'),b=getOption(ends,'Söll');
 if(!a||!b)throw Error('Town options missing: '+JSON.stringify([a,b]));
 await start.selectOption(a.value);await end.selectOption(b.value);
 await page.locator('#create').click();
 const result=await page.locator('#plan-output').innerText();
 assert.match(result,/Ellmau/);assert.match(result,/Söll/);
 const actual=await page.evaluate(()=>window.SKIDayUI.getCurrent());
 assert.ok(actual?.graphBased,'route must be computed from geographic graph');
 assert.ok(actual.itinerary.steps.filter(x=>x.type==='lift').length>=2,'real lift numbers must be shown');
 assert.ok(actual.itinerary.steps.filter(x=>x.type==='piste').length>=2,'real piste parts must be shown');
 // The engine must preserve EVERY graph edge, even if a 1-3m mapped
 // junction is suppressed from the human-friendly route list.
 const graph=await page.evaluate(()=>fetch('./skiwelt-network-graph.json').then(r=>r.json()));
 const ids=actual.path.edgeIds,stations=graph.stations;
 let at=stations[a.value].node;
 for(const id of ids){const e=actual.path.edgeSegments[ids.indexOf(id)];assert.equal(e[0],at,'disconnected map edge');at=e[1];}
 assert.equal(at,stations[b.value].node,'route misses selected end station');
 const lines=actual.itinerary.steps.filter(x=>['lift','piste','transfer'].includes(x.type));
 for(let i=1;i<lines.length;i++){
  if(lines[i-1].to===lines[i].from)continue;
  const p=graph.nodes[lines[i-1].to],q=graph.nodes[lines[i].from];
  assert.ok(Math.hypot((p[0]-q[0])*75000,(p[1]-q[1])*111320)<=3.5,'a rendered route part skips an unmapped junction');
 }
});
await add('closure excludes selected piste from a connected geographic route',async()=>{
 await page.locator('#closed-report').evaluate(el=>el.open=true);
 await page.locator('#closed-kind').selectOption('piste');
 await page.locator('#closed-code').fill('99a');
 await page.locator('#closed-note').fill('Browsertest: gesloten');
 await page.locator('#closed-form button[type="submit"]').click();
 try{
  await page.waitForFunction(()=>document.querySelector('#plan-output .ski-route-step')||document.querySelector('#plan-output .route-errors'),{timeout:12000});
  const closure=await page.locator('#closed-list').innerText();
  assert.match(closure,/99a/);
  const result=await page.evaluate(()=>window.SKIDayUI.getCurrent());
  if(result){
   assert.ok(!result.itinerary.steps.some(step=>step.type==='piste'&&step.code==='99a'),'reported closure included in route');
   const graph=await page.evaluate(()=>fetch('./skiwelt-network-graph.json').then(r=>r.json()));
   const ids=result.path.edgeIds;
   for(let i=1;i<ids.length;i++)assert.equal(result.path.edgeSegments[i-1][1],result.path.edgeSegments[i][0],'closure creates unjoined map steps');
   assert.ok(!ids.some(i=>{const f=graph.features[result.path.edgeSegments[ids.indexOf(i)][2]];return f?.kind==='piste'&&f.ref==='99a';}));
  }else assert.match(await page.locator('#plan-output').innerText(),/geen|onmogelijk|controleer|niet/i);
 }finally{
  await page.locator('.closure-row button').first().click();
 }
});
await add('official panorama controls support zoom and local fallback without GPS',async()=>{
 await page.locator('.bottom button[data-page="map"]').click();
 await page.locator('#pano-quick-area').selectOption('westendorf');
 await page.locator('#pano-focus-open').click();
 await page.locator('#pano-img').waitFor({state:'visible',timeout:8000});
 await page.waitForFunction(()=>document.querySelector('#pano-img').complete&&document.querySelector('#pano-img').naturalWidth>400,{timeout:25000});
 const props=await page.locator('#pano-img').evaluate(el=>({src:el.currentSrc,width:el.naturalWidth,height:el.naturalHeight,transform:el.style.transform}));
 assert.ok(props.width>400,'fallback panorama is missing');
 assert.match(props.src,/skimap\.jpg/);
 assert.match(props.transform,/scale\(5\.2\)/);
 const dims=await page.evaluate(()=>{
   const map=document.querySelector('#pano-viewport').getBoundingClientRect();
   const modal=document.querySelector('#pano-modal').getBoundingClientRect();
   return {map:map.height,modal:modal.height};
  });
  assert.ok(dims.map>dims.modal*.76,'panorama should occupy most of phone screen');
 const v1=await page.evaluate(()=>window.SKIPanorama.getZoom());
 await page.locator('#pano-plus').click();
 const v2=await page.evaluate(()=>window.SKIPanorama.getZoom());
 assert.ok(v2>v1,'plus zoom must increase scale');
 for(let n=0;n<6;n++)if(await page.locator('#pano-plus').isEnabled())await page.locator('#pano-plus').click();
 const v3=await page.evaluate(()=>window.SKIPanorama.getZoom());
 assert.ok(v3>10,'map zoom must exceed 10x');
 await page.locator('#pano-reset').click();
 // Browser smoke targets the current *published* PWA, which may still be 4.5.3.
 // New restaurant markers are validated here only after 4.5.4 is published.
 if(await page.locator('#pano-huts').count()){
   assert.ok(await page.locator('.pano-hut').count()>=4,'restaurant area pins must exist');
   if(await page.locator('#pano-restaurants-visible').count()){
     // SKI-je 4.5.9 shows restaurant area markers by default; older releases did not.
      if(!(await page.locator('#pano-restaurants-visible').isChecked())){
       await page.locator('#pano-options-toggle').click();
       await page.locator('#pano-restaurants-visible').check();
       await page.locator('#pano-options-toggle').click();
      }
   }
   // On the published panorama the approximate lift/hut area markers overlap.
   // Verify the restaurant layer with lift markers off (a supported user control).
   const liftToggle=page.locator('#pano-lifts-visible');
   const restoreLifts=await liftToggle.count()&&await liftToggle.isChecked();
    if(restoreLifts){
     await page.locator('#pano-options-toggle').click();
     await liftToggle.uncheck();
     await page.locator('#pano-options-toggle').click();
    }
   try{
    await page.locator('.pano-hut:visible').first().click();
    assert.ok(await page.locator('#pano-hut-info').isVisible(),'restaurant detail must open in the app');
    await page.locator('#pano-hut-close').click();
   }finally{
     if(restoreLifts){
      await page.locator('#pano-options-toggle').click();
      await liftToggle.check();
      await page.locator('#pano-options-toggle').click();
     }
   }
 }else console.log('INFO: live 4.5.3 has not yet published the restaurant map.');
 assert.equal(await page.evaluate(()=>window.SKIPanorama.getZoom()),1);
 await page.locator('#pano-viewport').dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',clientX:150,clientY:320});
 await page.locator('#pano-viewport').dispatchEvent('pointerdown',{pointerId:2,pointerType:'touch',clientX:220,clientY:320});
 await page.locator('#pano-viewport').dispatchEvent('pointermove',{pointerId:2,pointerType:'touch',clientX:330,clientY:320});
 assert.ok((await page.evaluate(()=>window.SKIPanorama.getZoom()))>2,'two-finger pinch must zoom');
 await page.locator('#pano-viewport').dispatchEvent('pointerup',{pointerId:1,pointerType:'touch',clientX:150,clientY:320});
 await page.locator('#pano-viewport').dispatchEvent('pointerup',{pointerId:2,pointerType:'touch',clientX:330,clientY:320});
 console.log('FULL MAP',props);
 await page.screenshot({path:screenshotDir+'/02-map-mobile.png'});
 await page.locator('[data-close="pano-modal"]').click();
});
await add('GPS return provides area choice without claiming precise piste navigation',async()=>{
 await page.locator('#return-home-map').click();
 await page.locator('#return-home-modal').waitFor({state:'visible'});
 try{
  await page.waitForFunction(()=>document.getElementById('return-home-status').textContent.includes('vertrekgebied:'),{timeout:12000});
  await page.locator('#return-area-override').selectOption('Ellmau');
  await page.locator('#return-home-manual').click();
  await page.waitForFunction(()=>document.getElementById('return-home-status').textContent.includes('Ellmau'),{timeout:9000});
  assert.match(await page.locator('#return-home-status').innerText(),/Ellmau/);
  const output=await page.locator('#return-home-output').innerText();
  assert.match(output,/niet|Snelste|volg|route/i);
 }finally{
  await page.locator('#return-home-close').click();
 }
 assert.ok(await page.locator('#return-home-modal').isHidden());
});
await add('radar location control and expanded wind areas appear',async()=>{
 await page.locator('.bottom button[data-page="weather"]').click();
 assert.ok((await page.locator('#compare-area option').count())>=8,'expected 8 wind areas');
 assert.ok(await page.locator('#radar-gps').isVisible());
});
await add('webcam back is visible and exits to webcam list',async()=>{
 await page.locator('.bottom button[data-page="webcams"]').click();
 const tiles=page.locator('#camera-tiles [data-cam]');
 await tiles.first().waitFor({timeout:12000});
 assert.equal(await tiles.count(),20,'Alle 17 bergcams en 3 dalcams op camerapagina');
 await tiles.first().click();
 assert.ok(await page.locator('#camera-modal').isVisible());
 assert.ok(await page.locator('#camera-back-bottom').isVisible());
 await page.locator('#camera-back-bottom').click();
 assert.ok(await page.locator('#camera-modal').isHidden());
});
await add('update button changes color during version check and ends green',async()=>{
 let count=0;
 await page.route('**/api/health?versioncheck=*',async route=>{count++;await new Promise(resolve=>setTimeout(resolve,1100));await route.continue();});
 await page.locator('#app-update-now').click();
 await page.locator('#app-update-now.is-updating').waitFor({timeout:2500});
 await page.locator('#app-update-now.is-current').waitFor({timeout:12000});
 assert.ok(count>=1,'no health check requested');
});
await add('Hopfgarten three full-day routes and optional midstation piste 20a escape',async()=>{
 await page.locator('.bottom button[data-page="plan"]').click();
 await page.locator('#page-plan').waitFor({state:'visible',timeout:10000});
 const same=page.locator('#same-end');
 if(!(await same.isChecked()))await same.check();
 await page.locator('#start').selectOption('Hopfgarten dalstation');
 // With 'same-end' checked the finish picker is intentionally disabled and synced.
 await page.waitForFunction(()=>document.querySelector('#finish')?.value==='Hopfgarten dalstation');
 await page.locator('#departure').fill('09:00');
 await page.locator('#return-time').fill('16:00');
 await page.locator('#lunch-time').fill('12:30');
 await page.locator('#lunch-restaurant').selectOption('');
 await page.locator('#early-break').uncheck();
 await page.locator('#late-break').uncheck();
 await page.waitForFunction(()=>document.querySelector('#hopfgarten-route-settings')?.hidden===false,{timeout:10000});
 for(const preset of ['salve','foisching','itter']){
  await page.locator('#hopfgarten-route-preset').selectOption(preset);
  await page.locator('#hopfgarten-end-mode').selectOption('valley');
  await page.locator('#create').click();
  await page.waitForFunction(()=>document.querySelector('.hopfgarten-escape-panel')!==null,{timeout:15000});
  const data=await page.evaluate(()=>window.SKIDayUI.getCurrent());
  assert.ok(data?.graphBased);
  assert.equal(data.endMode,'valley');
  assert.equal(data.itinerary.steps.at(-3).code,'20a','last piste should be 20a before return/buffer');
  assert.equal(data.plan.startPoint,'Hopfgarten dalstation');
  assert.equal(data.plan.endPoint,'Hopfgarten dalstation');
  assert.equal(data.plan.safeArrival,'15:30');
  assert.ok(data.itinerary.steps.some(step=>step.type==='lunch'&&step.minutes===60));
  await page.locator('#day-route-collapsible').evaluate(el=>el.open=true);
  const lunch=await page.locator('.day-timeline-row.lunch .day-event strong').innerText();
  assert.match(lunch,/Lunch/i);
  const steps=await page.locator('.ski-route-step.piste').count();
  assert.ok(steps>=12,'route lacks complete pistes for '+preset);
 }
 await page.locator('#hopfgarten-end-mode').selectOption('middle');
 await page.locator('#create').click();
 await page.waitForFunction(()=>document.querySelector('.hopfgarten-descent-steps')!==null,{timeout:15000});
 const mid=await page.evaluate(()=>window.SKIDayUI.getCurrent());
 assert.equal(mid.endMode,'middle');
 assert.ok(Number(mid.plan.safeArrival.replace(':',''))<=1500);
 assert.ok(mid.optionalDescent.available);
 assert.equal(mid.optionalDescent.steps.at(-1).code,'20a');
 const pages=await page.evaluate(()=>window.SKIPdf.reportPages(window.SKIDayUI.getCurrent()));
 assert.ok(pages.some(p=>p.kind==='descent'),'optional descent not shown in the PDF');
 await page.locator('.hopfgarten-descent-steps').evaluate(el=>el.open=true);
 assert.match(await page.locator('.hopfgarten-descent-steps').innerText(),/20a/);
 await page.screenshot({path:screenshotDir+'/03-hopfgarten-midstation-mobile.png',fullPage:true});
});
await add('eight languages switch and persist',async()=>{
 const selector=page.locator('header [data-skije-language-select]');
 await selector.selectOption('pl');
 assert.equal(await page.locator('html').getAttribute('lang'),'pl');
 await selector.selectOption('da');
 assert.equal(await page.locator('html').getAttribute('lang'),'da');
 await selector.selectOption('zh');
 assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
 await selector.selectOption('nl');
});
await add('no uncaught browser errors',async()=>{
 assert.deepEqual(errors,[],errors.join('\n'));
});
await browser.close();
if(localServer)await new Promise(done=>localServer.close(done));
console.log('\nBrowser: '+checks.length+' checks passed, '+issues.length+' failed');
if(issues.length){console.error(JSON.stringify(issues,null,2));process.exitCode=1;}
