import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read = name => readFileSync(new URL('../public/'+name, import.meta.url),'utf8');
const langs = ['en','de','fr','es','zh','pl','da'];
function context() {
 const document = {
  body: {nodeType:1, matches:()=>false, closest:()=>null, hasAttribute:()=>false},
  documentElement:{}, querySelectorAll:()=>[], getElementById:()=>null,
  createTreeWalker:()=>({nextNode:()=>null}), dispatchEvent:()=>{}
 };
 const sandbox={window:{},document,NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},
  CustomEvent:class{},MutationObserver:class{observe(){}},
  localStorage:{getItem:()=>null,setItem:()=>{}}};
 vm.createContext(sandbox);
 for(const file of ['i18n-data.js','i18n-extra.js','i18n.js'])vm.runInContext(read(file),sandbox);
 return sandbox.window;
}
test('both pages load the extra dictionary before the language engine',()=>{
 for(const file of ['index.html','install.html']){
  const html=read(file);
  const order=['i18n-data.js','i18n-extra.js','i18n.js'].map(name=>html.indexOf('src="'+name+'"'));
  assert.ok(order[0]>=0 && order[1]>order[0] && order[2]>order[1],file);
 }
});
test('all languages include added texts and preserve dynamic counts',()=>{
 const {SKILanguage:api,SKI_I18N_DATA:data}=context();
 assert.equal(api.get(),'nl');
 for(const lang of langs){
  const table=data.translations[lang];
  assert.ok(Object.keys(table).length>450,lang);
  assert.deepEqual(Object.keys(table).sort(),Object.keys(data.translations.en).sort(),lang);
  assert.equal(api.translate('Locatie delen AAN',lang),table['Locatie delen AAN']);
  assert.notEqual(api.translate('Locatie delen AAN',lang),'Locatie delen AAN');
  assert.equal(api.translate('17 van 20 webcams',lang),table['{0} van {1} webcams'].replace('{0}','17').replace('{1}','20'));
  assert.equal(api.translate('constructor',lang),'constructor');
  assert.equal(api.translate('Hohe Salve 20a',lang),'Hohe Salve 20a');
  api.set(lang);
  assert.equal(api.get(),lang);
  assert.equal(api.translate('Locatie delen AAN'),table['Locatie delen AAN']);
 }
 api.set('nl');
 assert.equal(api.translate('17 van 20 webcams'),'17 van 20 webcams');
});
