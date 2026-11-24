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
  await page.evaluate(safe=>{
   document.getElementById('ski-intro')?.setAttribute('hidden','');
   document.getElementById('legal-gate')?.setAttribute('hidden','');
   document.body.classList.remove('brand-arriving','legal-open');
   document.documentElement.style.setProperty('--skije-bottom-safe',safe+'px');
   if(navigator.userAgent.includes('Android'))document.documentElement.classList.add('skije-android-standalone');
  },v.safe);
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
   const modal=document.querySelector('.webcam-panel').getBoundingClientRect();
   const footer=document.querySelector('.cam-footer').getBoundingClientRect();
   const close=document.querySelector('#camera-close').getBoundingClientRect();
   return {modalTop:modal.top,modalBottom:modal.bottom,footerBottom:footer.bottom,closeTop:close.top,closeBottom:close.bottom};
  });
  assert.ok(panel.footerBottom<=v.height-v.safe+4,v.name+' webcam bottom controls hidden by device navigation '+JSON.stringify(panel));
  assert.ok(panel.closeTop>=-1&&panel.closeBottom<=v.height-v.safe+3,v.name+' close button off-screen '+JSON.stringify(panel));
  await page.locator('#camera-close').click();
  assert.ok(await page.locator('#camera-modal').isHidden());
  assert.equal(errors.length,0,v.name+' page errors: '+errors.join(' | '));
  if(v.name==='Android-S21-3buttons'||v.name==='iPhone-15'||v.name==='Phone-landscape'){
    await page.screenshot({path:'test-artifacts/webcam-'+v.name+'.png'});
    await page.locator('#camera-area').selectOption('all');
    await page.locator('#camera-tiles [data-cam="hartkaiser"]').click();
    await page.screenshot({path:'test-artifacts/webcam-player-'+v.name+'.png'});
  }
  console.log('PASS '+v.name+' 20 cams, area filter, safe app nav, safe player controls, still image and fallback');
  await ctx.close();
 }
}finally{await chrome.close();await new Promise(ok=>server.close(ok));}
