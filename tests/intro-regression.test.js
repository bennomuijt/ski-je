import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
test('original SKI-je logo remains on intro and header',()=>{
 assert.equal((html.match(/class="skije-mark"/g)||[]).length,2);
 assert.match(html,/Origineel SKI-je-logo met ski, skibril en zon/);
});
test('intro no longer disappears because of a sessionStorage seen flag',()=>{
 assert.doesNotMatch(html,/sessionStorage\.getItem\('skije-logo-intro-v2'\)/);
 assert.match(html,/function play\(force=false\)/);
 assert.match(html,/id="intro-replay"/);
});
test('intro background visibly pans and zooms for a finite duration',()=>{
 assert.match(html,/scale\(1\.21\) translate3d\(5\.5%,-1%,0\)/);
 assert.match(html,/skije-intro-photo 3\.6s/);
 assert.match(html,/clearTimeout\(cleanupTimer\)/);
});
test('respects motion preferences, and splash does not block UI forever',()=>{
 assert.match(html,/prefers-reduced-motion: reduce/);
 assert.match(html,/showByPreference=saved\?\.preferences\?\.motion!==false/);
 assert.match(html,/intro\.hidden=true/);
 assert.match(html,/document\.body\.classList\.remove\('brand-arriving'\)/);
});
