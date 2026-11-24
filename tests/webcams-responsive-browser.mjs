/* Responsive regression: Samsung Android 3-button navigation, small Android,
 * narrow iPhone, large iPhone, landscape, and tablet viewport geometries.
 * Simulates CSS safe areas; not a substitute for physical OS/Browser tests. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,sep,extname} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve('public');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/api/health'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ok:true,version:'4.5.21-cf'}));return;}
  if(pathname==='/api/skimap.jpg')pathname='/Kaart 2026-2027.png';
  if(pathname==='/')pathname='/index.html';
  const target=resolve(root,'.'+pathname);
  if(!target.startsWith(root+sep))throw Error('bad path');
  const bytes=await fs.readFile(target);
  res.writeHead(200,{'content-type':types[extname(target)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Missing');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port+'/';
const chrome=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const variants=[
 {name:'Android-S21-3buttons',width:384,height:832,safe:48,ua:'Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-G991B) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'},
 {name:'S21-screenshot-edge-to-edge-no-inset',width:393,height:852,safe:56,topSafe:32,noInjectedSafe:true,ua:'Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-G991B) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'},
 {name:'Android-compact',width:320,height:568,safe:48,ua:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'},
 {name:'Android-360',width:360,height:740,safe:48,ua:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'},
 {name:'iPhone-SE',width:375,height:667,safe:20,ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 Version/17.6 Mobile/15E148 Safari/604.1'},
 {name:'iPhone-15',width:393,height:852,safe:34,ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 Version/18.2 Mobile Safari/604.1'},
 {name:'Phone-landscape',width:832,height:384,safe:24,ua:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'},
 {name:'iPad-portrait',width:768,height:1024,safe:20,ua:'Mozilla/5.0 (iPad; CPU OS 18_2 like Mac OS X) AppleWebKit/605.1.15 Version/18.2 Mobile Safari/604.1'}
];
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/NwAAAABJRU5ErkJggg==','base64');
await fs.mkdir('test-artifacts',{recursive:true});
try{
 for(const v of variants){
  const ctx=await chrome.newContext({viewport:{width:v.width,height:v.height},userAgent:v.ua,isMobile:v.width<600,hasTouch:true,locale:'nl-NL'});
  const page=await ctx.newPage();page.setDefaultTimeout(14000);
  const errors=[];page.on('pageerror',err=>errors.push(String(err)));
  await page.route('https://webtv.feratel.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Feratel test player</title>'}));
  await page.route('https://*.panomax.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Panomax test</title>'}));
  await page.route('https://webcams.skiwelt.at/**',route=>route.fulfill({status:200,contentType:'image/png',body:png}));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.addStyleTag({content:'#ski-intro,#legal-gate{display:none!important}'});
  await page.evaluate(({safe,noInjectedSafe,topSafe})=>{
   document.getElementById('ski-intro')?.setAttribute('hidden','');
   document.getElementById('legal-gate')?.setAttribute('hidden','');
   document.body.classList.remove('brand-arriving','legal-open');
   if(!noInjectedSafe){
    document.documentElement.style.setProperty('--skije-bottom-safe',safe+'px');
    document.documentElement.style.setProperty('--skije-panorama-bottom-safe',safe+'px');
    document.documentElement.style.setProperty('--skije-panorama-top-safe',topSafe+'px');
   }
   if(navigator.userAgent.includes('Android')){
    if(noInjectedSafe)document.documentElement.classList.remove('skije-android-standalone');
    else document.documentElement.classList.add('skije-android-standalone');
   }
  },{safe:v.safe,noInjectedSafe:!!v.noInjectedSafe,topSafe:v.topSafe??(v.ua.includes('Android')?32:v.name==='iPhone-15'?47:20)});
  // Injected safe-area emulator changes footer height after the app booted.
  // Allow the ResizeObserver to remeasure it, as on a real screen rotation.
  await page.waitForFunction(()=>{
   const h=document.querySelector('footer.bottom').getBoundingClientRect().height;
   const reserved=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--skije-nav-height'));
   return Number.isFinite(reserved)&&reserved>=h-1;
  },null,{timeout:8000});
  await page.locator('footer.bottom button[data-page="webcams"]').click();
  const tiles=page.locator('#camera-tiles button[data-cam]');
  assert.equal(await tiles.count(),20,'20 webcams should be available in '+v.name);
  assert.equal(await page.locator('#camera-area option').count(),8,'seven areas plus All');
  const dimensions=await page.evaluate(()=>{
   const bottom=document.querySelector('footer.bottom'),btn=[...bottom.querySelectorAll('button')].map(b=>b.getBoundingClientRect());
   const rect=bottom.getBoundingClientRect();
   return {width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,navHeight:rect.height,navTop:rect.top,
    buttonMax:Math.max(...btn.map(x=>x.bottom)),buttonMin:Math.min(...btn.map(x=>x.top)),pagePad:getComputedStyle(document.querySelector('.wrap')).paddingBottom};
  });
  assert.ok(dimensions.scroll<=v.width+1,v.name+' sideways page overflow '+JSON.stringify(dimensions));
  assert.ok(dimensions.buttonMax<=v.height-v.safe+8,v.name+' system nav overlaps the fixed footer '+JSON.stringify(dimensions));
  assert.ok(parseFloat(dimensions.pagePad)>=dimensions.navHeight+10,v.name+' final page content may hide behind app menu '+JSON.stringify(dimensions));
  await tiles.last().scrollIntoViewIfNeeded();
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  const visible=await page.evaluate(()=>{
   const last=document.querySelector('#camera-tiles [data-cam]:last-child').getBoundingClientRect();
   const nav=document.querySelector('footer.bottom').getBoundingClientRect();
   return {lastBottom:last.bottom,navTop:nav.top};
  });
  assert.ok(visible.lastBottom<=visible.navTop+5,v.name+' last camera tile behind menu '+JSON.stringify(visible));
  await page.locator('#camera-area').selectOption('Brixen im Thale');
  assert.equal(await tiles.count(),5,'Brixen should show five webcams');
  await page.locator('#camera-tiles [data-cam="brantlalmsee"]').click();
  assert.ok(await page.locator('#camera-modal').isVisible());
  assert.match(await page.locator('#camera-frame').getAttribute('src'),/cam=5523/);
  await page.locator('#camera-picks [data-cam="kreuzjoechlsee"]').click();
  assert.ok(await page.locator('#camera-still').isVisible());
  assert.ok(await page.locator('#camera-refresh').isVisible());
  assert.match(await page.locator('#camera-still').getAttribute('src'),/skije_refresh=/);
  await page.locator('#camera-picks [data-cam="holzalm"]').click();
  assert.match(await page.locator('#camera-source').getAttribute('href'),/skiwelt.at\/de\/webcam-holzalm-brixen/);
  const panel=await page.evaluate(()=>{
   const sheet=document.querySelector('#camera-modal').getBoundingClientRect();
   const modal=document.querySelector('.webcam-panel').getBoundingClientRect();
   const footer=document.querySelector('.cam-footer').getBoundingClientRect();
   const close=document.querySelector('#camera-close').getBoundingClientRect();
   const back=document.querySelector('#camera-back-bottom').getBoundingClientRect();
   const link=document.querySelector('#camera-source').getBoundingClientRect();
   const clickable=(box)=>{
     const el=document.elementFromPoint(box.left+box.width/2,box.top+box.height/2);
     return !!(el&&(el.closest('#camera-back-bottom,#camera-source')));
   };
   return {sheetTop:sheet.top,sheetBottom:sheet.bottom,modalTop:modal.top,modalBottom:modal.bottom,footerBottom:footer.bottom,closeTop:close.top,closeBottom:close.bottom,
    backBottom:back.bottom,linkBottom:link.bottom,backHittable:clickable(back),linkHittable:clickable(link),
    hasAndroidFallback:document.documentElement.classList.contains('skije-android-device')};
  });
  const topSafe=v.topSafe??(v.ua.includes('Android')?32:0);
  assert.ok(panel.sheetTop>=topSafe-2,v.name+' webcam header behind Android status bar '+JSON.stringify(panel));
  assert.ok(panel.footerBottom<=v.height-v.safe+4,v.name+' webcam bottom controls hidden by device navigation '+JSON.stringify(panel));
  assert.ok(panel.closeTop>=topSafe-2&&panel.closeBottom<=v.height-v.safe+3,v.name+' close button off-screen '+JSON.stringify(panel));
  assert.ok(panel.backBottom<=v.height-v.safe+4&&panel.linkBottom<=v.height-v.safe+4,v.name+' both bottom action buttons need to clear system nav '+JSON.stringify(panel));
  assert.ok(panel.backHittable&&panel.linkHittable,v.name+' Android webcam controls not clickable '+JSON.stringify(panel));
  if(v.noInjectedSafe)assert.equal(panel.hasAndroidFallback,true,'Android fallback needs to work without standalone mode or CSS insets');
  await page.locator('#camera-close').click();
  assert.ok(await page.locator('#camera-modal').isHidden());
  assert.equal(errors.length,0,v.name+' page errors: '+errors.join(' | '));
  if(v.name==='Android-S21-3buttons'||v.name==='S21-screenshot-edge-to-edge-no-inset'||v.name==='iPhone-15'||v.name==='Phone-landscape'){
    await page.screenshot({path:'test-artifacts/webcam-'+v.name+'.png'});
    await page.locator('#camera-area').selectOption('all');
    await page.locator('#camera-tiles [data-cam="hartkaiser"]').click();
    await page.screenshot({path:'test-artifacts/webcam-player-'+v.name+'.png'});
  }

  // Open the actual panoramic map with the device navigation bar present.
  // It must never shrink when hut/lift details or options are displayed.
  if(!(await page.locator('#camera-modal').isHidden()))await page.locator('#camera-close').click();
  await page.locator('#pano-open').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector('#pano-img')?.naturalWidth>0,{timeout:15000});
  const pano=await page.evaluate(()=>{
   const stage=document.getElementById('pano-viewport').getBoundingClientRect();
   const frame=document.getElementById('pano-modal').getBoundingClientRect();
   const img=document.getElementById('pano-img'),iw=img.naturalWidth,ih=img.naturalHeight;
   const drawnW=Math.min(stage.width,stage.height*iw/ih),drawnH=Math.min(stage.height,stage.width*ih/iw);
   return {stageTop:stage.top,stageBottom:stage.bottom,stageHeight:stage.height,
    frameTop:frame.top,frameBottom:frame.bottom,frameHeight:frame.height,
    initialZoom:window.SKIPanorama.getZoom(),cover:Math.max(stage.width/drawnW,stage.height/drawnH)};
  });
  const panoTop=v.topSafe??(v.ua.includes('Android')?32:v.name==='iPhone-15'?47:20);
  assert.ok(pano.frameTop>=panoTop-2,v.name+' panorama behind status bar '+JSON.stringify(pano));
  assert.ok(pano.frameBottom<=v.height-v.safe+4,v.name+' panorama behind navigation bar '+JSON.stringify(pano));
  assert.ok(pano.stageHeight>=pano.frameHeight-64,v.name+' fixed bars steal panorama height '+JSON.stringify(pano));
  assert.ok(pano.initialZoom>=pano.cover-.05,v.name+' map did not fill visible canvas '+JSON.stringify(pano));
  assert.ok(await page.locator('#pano-options').isHidden(),'options should be collapsed by default');
  assert.ok(await page.locator('.pano-tools').isVisible());
  await page.locator('#pano-options-toggle').click();
  assert.ok(await page.locator('#pano-options').isVisible());
  assert.equal(await page.locator('#pano-options-toggle').getAttribute('aria-expanded'),'true');
  await page.locator('#pano-lifts-visible').uncheck();
  await page.locator('#pano-restaurants-visible').uncheck();
  assert.ok(await page.locator('#pano-lifts').isHidden());
  assert.ok(await page.locator('#pano-huts').isHidden());
  await page.locator('#pano-lifts-visible').check();
  await page.locator('#pano-restaurants-visible').check();
  assert.ok(await page.locator('#pano-lifts').isVisible());
  assert.ok(await page.locator('#pano-huts').isVisible());
  const duringOptions=await page.locator('#pano-viewport').boundingBox();
  assert.ok(Math.abs(duringOptions.height-pano.stageHeight)<2,'Options should float over map, not resize it');
  await page.locator('#pano-fill').click();
  assert.ok(await page.locator('#pano-options').isHidden());
  for(let n=0;n<12;n++){
   if(!(await page.locator('#pano-plus').isEnabled()))break;
   await page.locator('#pano-plus').click();
  }
  const deep=await page.evaluate(()=>window.SKIPanorama.getZoom());
  assert.ok(deep>=45&&deep<=48,v.name+' max deep zoom not restored '+deep);
  await page.locator('#pano-reset').click();
  assert.equal(await page.evaluate(()=>window.SKIPanorama.getZoom()),1);
  await page.locator('#pano-viewport').dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',clientX:120,clientY:250});
  await page.locator('#pano-viewport').dispatchEvent('pointerdown',{pointerId:2,pointerType:'touch',clientX:180,clientY:250});
  await page.locator('#pano-viewport').dispatchEvent('pointermove',{pointerId:2,pointerType:'touch',clientX:300,clientY:250});
  assert.ok(await page.evaluate(()=>window.SKIPanorama.getZoom())>2,'Touch pinch must work on panorama');
  await page.locator('#pano-viewport').dispatchEvent('pointerup',{pointerId:1,pointerType:'touch',clientX:120,clientY:250});
  await page.locator('#pano-viewport').dispatchEvent('pointerup',{pointerId:2,pointerType:'touch',clientX:300,clientY:250});
  // Pop-up data is a bottom sheet OVER the image, not a stacked map-squeezer.
  await page.locator('.pano-lift-group').first().evaluate(el=>el.click());
  assert.ok(await page.locator('#pano-lift-info').isVisible());
  const afterLift=await page.locator('#pano-viewport').boundingBox();
  assert.ok(Math.abs(afterLift.height-pano.stageHeight)<2,'Lift detail may not reduce map height');
  await page.locator('#pano-lift-close').click();
  await page.locator('.pano-hut').first().evaluate(el=>el.click());
  assert.ok(await page.locator('#pano-hut-info').isVisible());
  const afterHut=await page.locator('#pano-viewport').boundingBox();
  assert.ok(Math.abs(afterHut.height-pano.stageHeight)<2,'Hut detail may not reduce map height');
  await page.locator('#pano-hut-close').click();
  if(v.name==='S21-screenshot-edge-to-edge-no-inset'||v.name==='iPhone-15'||v.name==='Phone-landscape'){
   await page.screenshot({path:'test-artifacts/panorama-immersive-'+v.name+'.png'});
  }
  await page.locator('[data-close="pano-modal"]').click();
  assert.ok(await page.locator('#pano-modal').isHidden());
  assert.equal(errors.length,0,v.name+' map errors: '+errors.join(' | '));
  console.log('PASS immersive panorama '+v.name+': full-height, 4800% zoom, pinch, options and overlay info');

  console.log('PASS '+v.name+' 20 cams, area filter, safe app nav, safe player controls, still image and fallback');
  await ctx.close();
 }
}finally{await chrome.close();await new Promise(ok=>server.close(ok));}
