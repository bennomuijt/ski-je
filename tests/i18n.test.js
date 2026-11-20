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

test('translations remain in sync for all supported languages after future releases',()=>{
 const expectedLanguages=['en','de','fr','es','zh','pl','da'];
 const keys=Object.keys(data.translations.en);
 assert.ok(keys.length>=238,'The language list may have lost existing translations');
 for(const lang of expectedLanguages){
  const table=data.translations[lang];
  assert.deepEqual(Object.keys(table).sort(),keys.slice().sort(),lang+' keys differ from the other languages');
  for(const [source,value] of Object.entries(table)){
   assert.equal(typeof value,'string',lang+': '+source);
   assert.ok(value.trim().length>0,lang+': '+source);
  }
 }
});
test('critical route, group, safety, update and installation labels exist in every language',()=>{
 const mandatory=[
  'Mijn skiroute',
  'Mijn locatie & pistes',
  'Weer voor SkiWelt',
  'Live webcams SkiWelt',
  'Mijn skidag',
  'Skigroep & afspreken',
  'Groepsleden',
  'Deel mijn locatie',
  'Voorgestelde gebiedsroute',
  'Download mijn skidag als PDF',
  'Sluiting melden',
  'GPS voor radar',
  'Kies app om te delen',
  'GPS niet beschikbaar. Controleer locatietoestemming.',
  'Bij nood: bel eerst 112 of bergredding 140. Wacht niet op GPS.',
  'Officiële piste- en liftinformatie gaat altijd voor.',
  'GPS-delen staat altijd standaard uit.',
  'Disclaimer en gebruiksvoorwaarden',
  'Installeer SKI-je op dit toestel',
  'Update app naar nieuwste versie',
  'Blijft \'Download in behandeling\' staan?'
 ];
 for(const lang of ['en','de','fr','es','zh','pl','da']){
  for(const key of mandatory){
   assert.ok(data.translations[lang][key]?.trim(),lang+': missing '+key);
   assert.notEqual(data.translations[lang][key],key,lang+': untranslated '+key);
  }
 }
 assert.match(engine,/localStorage\.setItem\(LANG_KEY,current\)/);
 assert.match(engine,/#legal-text/);
 assert.match(engine,/legalNotices/);
});
