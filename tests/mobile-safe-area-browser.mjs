/* Browser viewport regression with local SKI-je assets, not the published Worker.
 * CSS pixels, not physical screen pixels. Does NOT simulate actual OS navigation UI. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium} from 'playwright-core';
const base=resolve('public');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname.startsWith('/api/')){res.writeHead(503);res.end('not provided in local layout regression');return;}
  const file=resolve(base,'.'+(pathname==='/'?'/index.html':pathname));
  if(file!==base&&!file.startsWith(base+sep)){res.writeHead(403);res.end();return;}
  if(!(await stat(file)).isFile())throw Error('not a file');
  const content=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(content);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+'/';
let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.addStyleTag({content:'#ski-intro,#legal-gate{display:none!important}'});
 const dims=[
  [320,640,'small Android'],[360,740,'Android compact'],[375,812,'iPhone compact'],
  [390,844,'iPhone'],[393,873,'Pixel'],[412,915,'Samsung'],
  [430,932,'large iPhone'],[480,960,'large display'],
  [673,841,'foldable unfolded'],[768,1024,'tablet'],
  [844,390,'iPhone landscape'],[915,412,'Galaxy landscape']
 ];
 await mkdir('test-artifacts',{recursive:true});
 let ran=0;
 for(const [width,height,label] of dims){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>window.SKIScreenLayout?.recalculate());
  const result=await page.evaluate(()=>{
   const footer=document.querySelector('.bottom');
   const box=footer.getBoundingClientRect();
   const buttons=[...footer.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}});
   return {box:{top:box.top,bottom:box.bottom,height:box.height},buttons,width:innerWidth,height:innerHeight,
    padding:parseFloat(getComputedStyle(document.querySelector('.wrap')).paddingBottom),
    pageWidth:document.documentElement.scrollWidth};
  });
  assert.ok(result.box.top>=-1&&result.box.bottom<=height+1, label+' navigation clipped vertically: '+JSON.stringify(result));
  assert.ok(result.box.height>45, label+' navigation is missing');
  assert.ok(result.padding>=result.box.height+10,label+' content under fixed footer');
  assert.ok(result.pageWidth<=width+2,label+' horizontal overflow');
  for(const button of result.buttons){
   assert.ok(button.width>15&&button.left>=-1&&button.right<=width+1,label+' nav button clipped');
   assert.ok(button.bottom<=height+1&&button.top>=-1,label+' nav touch target off screen');
  }
  if(label==='Samsung'||label==='iPhone landscape')
   await page.screenshot({path:'test-artifacts/safe-area-'+width+'x'+height+'.png'});
  ran++;
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('#settings-section').evaluate(e=>e.open=true);
 await page.locator('#screen-bottom-clearance').evaluate(e=>{e.value='64';e.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.evaluate(()=>window.SKIScreenLayout?.recalculate());
 const adjusted=await page.evaluate(()=>{
  const footer=document.querySelector('.bottom');
  return {extra:window.SKIScreenLayout.getExtra(),value:localStorage.getItem('skije-screen-bottom-clearance-v1'),
    measured:footer.getBoundingClientRect().height,
    padding:parseFloat(getComputedStyle(document.querySelector('.wrap')).paddingBottom)}
 });
 assert.equal(adjusted.extra,64);
 assert.equal(adjusted.value,'64');
 assert.ok(adjusted.padding>adjusted.measured);
 await page.reload({waitUntil:'domcontentloaded'});
 assert.equal(await page.evaluate(()=>window.SKIScreenLayout.getExtra()),64,'fallback not retained after reload');
 console.log('PASS '+ran+' representative CSS viewport sizes and persistent bottom offset');
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
