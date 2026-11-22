import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');

test('Android PWA footer reserves system navigation clearance and body scroll space',()=>{
 assert.match(html,/--skije-bottom-safe:env\(safe-area-inset-bottom,0px\)/);
 assert.match(html,/html\.skije-android-standalone\{--skije-bottom-safe:max\(48px,env\(safe-area-inset-bottom,0px\)\)\}/);
 assert.match(html,/\.bottom\{[^}]*position:fixed;bottom:0;[^}]*padding:6px 10px calc\(8px \+ var\(--skije-bottom-safe\)\)/);
 assert.match(html,/\.wrap\{[^}]*padding-bottom:calc\(98px \+ var\(--skije-bottom-safe\)\)/);
 assert.match(html,/\.bottom button\{[^}]*min-height:59px/);
});

const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
test('Android footer clearance activates only in installed app display mode',()=>{
 assert.ok(script,'early Android detection script missing');
 function detect(userAgent,displayMode,referrer=''){
  const added=[];
  const sandbox={
   navigator:{userAgent,connection:{saveData:false}},
   window:{matchMedia:query=>({matches:query===`(display-mode: ${displayMode})`})},
   document:{referrer,documentElement:{classList:{add:name=>added.push(name)}}}
  };
  vm.runInNewContext(script,sandbox);
  return added;
 }
 assert.ok(detect('Mozilla Android','standalone').includes('skije-android-standalone'));
 assert.ok(detect('Mozilla Android','fullscreen').includes('skije-android-standalone'));
 assert.ok(detect('Mozilla Android','minimal-ui').includes('skije-android-standalone'));
 assert.ok(!detect('Mozilla Android','browser').includes('skije-android-standalone'));
 assert.ok(!detect('Mozilla iPhone','standalone').includes('skije-android-standalone'));
 assert.ok(detect('Mozilla Android','browser','android-app://com.android.chrome').includes('skije-android-standalone'));
});
