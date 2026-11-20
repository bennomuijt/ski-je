import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const dataSource=readFileSync(new URL('../public/i18n-data.js',import.meta.url),'utf8');
const engine=readFileSync(new URL('../public/i18n.js',import.meta.url),'utf8');
const index=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const install=readFileSync(new URL('../public/install.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
const target={window:{}};vm.runInNewContext(dataSource,target);
const data=target.window.SKI_I18N_DATA;
test('all eight choices including Chinese Polish Danish and Dutch default exist',()=>{
 assert.deepEqual(Array.from(data.languages,id=>id[0]),['nl','en','de','fr','es','zh','pl','da']);
 for(const lang of ['zh','pl','da','en','de','fr','es']){
  assert.ok(Object.keys(data.translations[lang]).length>=190,lang);
  assert.ok(data.translations[lang]['Mijn skiroute'].length>2,lang);
  assert.ok(data.translations[lang]['Officiële piste- en liftinformatie gaat altijd voor.'],lang);
 }
 assert.match(engine,/skije-ui-language-v1/);
 assert.match(engine,/return supported.has\(saved\)\?saved:'nl'/);
 assert.match(engine,/document\.documentElement\.lang/);
 assert.match(engine,/MutationObserver/);
});
test('language picker available from header and legal gate, installation page',()=>{
 assert.match(index,/data-skije-language-select/);
 assert.match(index,/i18n-data\.js/);
 assert.match(index,/i18n\.js/);
 assert.match(install,/data-skije-language-select/);
 assert.match(sw,/\.\/i18n-data\.js/);
 assert.match(sw,/\.\/i18n\.js/);
});
test('original SKI-je logo is the browser favicon on both pages',()=>{
 for(const html of [index,install])assert.match(html,/rel="icon" type="image\/svg\+xml" href="brand-skije\.svg\?v=440"/);
 assert.match(index,/apple-touch-icon/);
});
