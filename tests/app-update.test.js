import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=(file)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const js=read('public/app-update.js'),html=read('public/index.html'),sw=read('public/sw.js'),manifest=read('public/manifest.webmanifest');
test('visible header version, manual update button and safe version-check route',()=>{
  assert.match(html,/v4\.4\.1/);assert.match(html,/id="app-update-now"/);assert.match(html,/id="check-update"/);
  assert.match(html,/app-update\.js/);assert.match(js,/\/api\/health\?versioncheck=/);assert.match(js,/cache:'no-store'/);
  assert.match(js,/reg\.update\(\)/);assert.match(js,/location\.replace\(url\.href\)/);
  assert.doesNotMatch(js,/localStorage\.(clear|removeItem)/);
});
test('original image on intro, header and fresh app icons',()=>{
  assert.ok(existsSync(new URL('../public/brand-skije.svg',import.meta.url)));
  for(const name of ['icon-192-v43.png','icon-512-v43.png'])assert.ok(existsSync(new URL('../public/icons/'+name,import.meta.url)));
  assert.match(sw,/brand-skije\.svg/);assert.match(sw,/app-update\.js/);
  assert.match(manifest,/icon-192-v43\.png/);
});
