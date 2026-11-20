import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=readFileSync(new URL('../public/install.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
const main=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
test('SKI-je has one shareable install page for Android and iPhone',()=>{
 assert.match(html,/manifest.webmanifest/);
 assert.match(html,/beforeinstallprompt/);
 assert.match(html,/Zet op beginscherm/);
 assert.match(html,/bennomuijt\.workers\.dev\/install\.html/);
 assert.match(html,/brand-skije\.svg/);
 assert.match(html,/BenMu Development/);
});
test('Install link is visible in main app and cached for offline help',()=>{
 assert.match(main,/href="install\.html"/);
 assert.match(sw,/\.\/install\.html/);
});
