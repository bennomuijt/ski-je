/* Real browser exercise of proposed panorama layers on a LOCAL version of
 * SKI-je, not the earlier deployed Worker. The image is a stand-in; tests
 * interaction and layout but makes NO claim of precise map coordinates. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('public');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
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
 await page.locator('#pano-open').evaluate(el=>el.click());
 await page.waitForFunction(()=>document.getElementById('pano-img')?.naturalWidth>0,{timeout:20000});
 await page.locator('#pano-lifts .pano-lift-group').first().waitFor();
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
 // Use an image with the exact printed PDF aspect to verify vector hotspots.
 assert.equal(await page.locator('.pano-numbered-lift').count(),79);
 await page.locator('#pano-img').evaluate(img=>{
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1698" height="1174"/>');
 });
 await page.waitForFunction(()=>document.querySelector('#pano-img').naturalWidth===1698);
 await page.locator('#pano-plus').evaluate(el=>el.click());
 await page.locator('#pano-plus').evaluate(el=>el.click());
 await page.waitForFunction(()=>document.querySelectorAll('.pano-numbered-lift:not([hidden])').length>0);
 assert.ok(await page.locator('.pano-numbered-lift:visible').count()>0,'PDF lift numbers are visible on exact image ratio');
 await page.locator('#pano-lifts-visible').uncheck();
 assert.equal(await page.locator('#pano-lifts').isHidden(),true);
 await page.locator('#pano-lifts-visible').check();
 assert.equal(await page.locator('#pano-lifts').isVisible(),true);
 await page.locator('#pano-restaurants-visible').uncheck();
 assert.equal(await page.locator('#pano-huts').isHidden(),true);
 await page.locator('#pano-restaurants-visible').check();
 assert.equal(await page.locator('#pano-huts').isVisible(),true);
 await mkdir('test-artifacts',{recursive:true});
 await page.screenshot({path:'test-artifacts/pano-huts-lifts-390.png'});
 console.log('PASS local mobile panorama: 8 groups per layer, numbered choices, search and toggles');
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
