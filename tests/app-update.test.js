import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=(file)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const js=read('public/app-update.js'),html=read('public/index.html'),sw=read('public/sw.js'),manifest=read('public/manifest.webmanifest');
test('visible header version, manual update button and safe version-check route',()=>{
  assert.match(html,/v4\.5\.11/);assert.match(html,/id="app-update-now"/);assert.match(html,/id="check-update"/);
  assert.match(html,/app-update\.js/);assert.match(js,/\/api\/health\?versioncheck=/);assert.match(js,/cache:'no-store'/);
  assert.match(js,/reg\.update\(\)/);assert.match(js,/controllerchange/);assert.match(js,/needsRefresh/);assert.match(js,/location\.replace\(url\.href\)/);
  assert.doesNotMatch(js,/localStorage\.(clear|removeItem)/);assert.match(js,/setState\('is-updating'\)/);assert.match(js,/setState\('is-current'\)/);assert.match(js,/setState\('is-failed'\)/);
});
test('original image on intro, header and fresh app icons',()=>{
  assert.ok(existsSync(new URL('../public/brand-skije.svg',import.meta.url)));
  for(const name of ['skije-logo-v455.svg','icon-192-v455.png','icon-512-v455.png'])assert.ok(existsSync(new URL('../public/icons/'+name,import.meta.url)));
  assert.match(sw,/skije-logo-v455\.svg/);assert.match(sw,/brand-skije\.svg/);assert.match(sw,/app-update\.js/);
  assert.match(manifest,/skije-logo-v455\.svg/);
  assert.match(manifest,/icon-192-v455\.png/);
});

test('4.5.11 PWA update and PDF watermark are in sync',()=>{
 const pdf=read('public/day-pdf.js'),api=read('src/index.js'),pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'4.5.11');
 assert.match(html,/v4\.5\.11/);assert.match(js,/4\.5\.11-cf/);assert.match(api,/4\.5\.11-cf/);
 assert.match(sw,/v4-5-11-smart-lunch/);
 assert.match(html,/app-update\.js\?v=4511/);assert.match(html,/day-pdf\.js\?v=4511/);
 assert.match(pdf,/globalAlpha=0\.12/);
});
