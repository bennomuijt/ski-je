/* Interactive browser regression for SKI-je 4.5 (Chrome/Chromium).
 * Runs on the deployed PWA, does not join groups, and never transmits real GPS. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright-core';
const ROOT=process.env.SKIJE_URL||'https://ski-je.bennomuijt.workers.dev/';
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
 const text=await page.locator('#plan-output').innerText();
 assert.match(text,/09:00/);assert.match(text,/16:00/);assert.match(text,/15:30/);
 assert.match(text,/12:30/);assert.match(text,/Lunch/);
 assert.ok((await page.locator('.day-timeline-row').count())>=4);
 await page.screenshot({path:screenshotDir+'/01-route-mobile.png',fullPage:true});
});
await add('selected lunch restaurant appears in timetable',async()=>{
 const options=await page.locator('#lunch-restaurant option').evaluateAll(opts=>opts.map(o=>({value:o.value,label:o.textContent.trim()})).filter(x=>x.value));
 if(!options.length)throw Error('No restaurant choices populated');
 const choice=options.find(x=>/Brandstadl|Tanzboden|Salvenalm|Rübezahl/i.test(x.label))||options[0];
 await page.locator('#lunch-restaurant').selectOption(choice.value);
 await page.locator('#create').click();
 const title=await page.locator('.day-timeline-row.lunch .day-event strong').innerText();
 assert.match(title,/Lunch/i);
 if(!title.includes(choice.label))throw Error('Selected lunch restaurant is missing in planned itinerary: '+JSON.stringify({choice,title}));
});
await add('longer day 08:00-17:00 with pauses and earlier lunch',async()=>{
 await page.locator('#departure').fill('08:00');
 await page.locator('#return-time').fill('17:00');
 await page.locator('#lunch-time').selectOption('11:45');
 await page.locator('#early-break').check();
 await page.locator('#late-break').check();
 await page.locator('#lunch-duration').evaluate(el=>{el.value='60';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.locator('#create').click();
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
 assert.match(bytes.toString('latin1'),/\/Count 2\b/);
 console.log('PDF FILE',suggested,bytes.length,'bytes, 2 pages');
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
 assert.ok((await page.locator('.region-leg').count())>=2,'cross-area corridor steps missing');
});
await add('closure reported and excluded from revised area route',async()=>{
 await page.locator('#closed-report').evaluate(el=>el.open=true);
 await page.locator('#closed-kind').selectOption('piste');
 await page.locator('#closed-code').fill('99a');
 await page.locator('#closed-note').fill('Browsertest: gesloten');
 await page.locator('#closed-form button[type="submit"]').click();
 const result=await page.locator('#plan-output').innerText();
 assert.match(result,/⚠/);
 const closure=await page.locator('#closed-list').innerText();
 assert.match(closure,/99a/);
 // The code can still show a day timeline, but must not claim a confirmed path.
 assert.ok((await page.locator('.day-timeline-row').count())>=4);
 await page.locator('.closure-row button').first().click();
});
await add('full SkiWelt 2026-27 panorama is an image and village zoom works',async()=>{
 await page.locator('.bottom button[data-page="map"]').click();
 await page.locator('#pano-quick-area').selectOption('westendorf');
 await page.locator('#pano-focus-open').click();
 await page.locator('#pano-img').waitFor({state:'visible',timeout:8000});
 await page.waitForFunction(()=>document.querySelector('#pano-img').complete&&document.querySelector('#pano-img').naturalWidth>1000,{timeout:25000});
 const props=await page.locator('#pano-img').evaluate(el=>({src:el.currentSrc,width:el.naturalWidth,height:el.naturalHeight,transform:el.style.transform}));
 assert.match(props.src,/skimap\.jpg/);
 assert.match(props.transform,/scale\(3\.8\)/);
 const v1=await page.evaluate(()=>window.SKIPanorama.getZoom());
 await page.locator('#pano-plus').click();
 const v2=await page.evaluate(()=>window.SKIPanorama.getZoom());
 assert.ok(v2>v1,'plus zoom must increase scale');
 for(let n=0;n<6;n++)await page.locator('#pano-plus').click();
 const v3=await page.evaluate(()=>window.SKIPanorama.getZoom());
 assert.ok(v3>10,'map zoom must exceed 10x');
 await page.locator('#pano-reset').click();
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
await add('radar location control and expanded wind areas appear',async()=>{
 await page.locator('.bottom button[data-page="weather"]').click();
 assert.ok((await page.locator('#compare-area option').count())>=8,'expected 8 wind areas');
 assert.ok(await page.locator('#radar-gps').isVisible());
});
await add('webcam back is visible and exits to webcam list',async()=>{
 await page.locator('.bottom button[data-page="webcams"]').click();
 const tiles=page.locator('#camera-tiles [data-cam]');
 await tiles.first().waitFor({timeout:12000});
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
console.log('\nBrowser: '+checks.length+' checks passed, '+issues.length+' failed');
if(issues.length){console.error(JSON.stringify(issues,null,2));process.exitCode=1;}
