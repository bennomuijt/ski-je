import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read = name => readFileSync(new URL('../public/'+name, import.meta.url),'utf8');
const langs = ['en','de','fr','es','zh','pl','da'];
function context(nodes=[],printed=null) {
 const document = {
  body: {nodeType:1, matches:()=>false, closest:()=>null, hasAttribute:()=>false},
  documentElement:{}, querySelectorAll:()=>[], getElementById:()=>null,
  createTreeWalker:()=>{let i=0;return {nextNode:()=>nodes[i++]||null};}, dispatchEvent:()=>{}
 };
 const sandbox={window:{},document,Blob,TextEncoder,Uint8Array,atob,NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},
  CustomEvent:class{},MutationObserver:class{observe(){}},
  localStorage:{getItem:()=>null,setItem:()=>{}}};
 vm.createContext(sandbox);
 for(const file of ['i18n-data.js','i18n-extra.js','i18n-pdf.js','i18n.js'])vm.runInContext(read(file),sandbox);
 if(printed){
  const ctx={fillRect(){},fillText(value){printed.push(String(value));},measureText(value){return {width:String(value).length*8};},createLinearGradient(){return {addColorStop(){}};}};
  document.createElement=()=>({getContext:()=>ctx,toDataURL:()=>'data:image/jpeg;base64,/9j/2Q=='});
  vm.runInContext(read('day-pdf.js'),sandbox);
  sandbox.window.SKIPdf=sandbox.SKIPdf;
 }
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

test('PDF dictionary loads before the engine and both new dictionaries are cached',()=>{
 const html=read('index.html'),sw=read('sw.js');
 assert.ok(html.indexOf('src="i18n-pdf.js"')>html.indexOf('src="i18n-extra.js"'));
 assert.ok(html.indexOf('src="i18n.js"')>html.indexOf('src="i18n-pdf.js"'));
 assert.match(sw,/"\.\/i18n-extra\.js":"sha256-/);
 assert.match(sw,/"\.\/i18n-pdf\.js":"sha256-/);
});
test('changing language repeatedly restores original interface text and preserves user text',()=>{
 const visible={nodeType:3,nodeValue:'Locatie delen AAN',parentElement:{closest:()=>null}};
 const user={nodeType:3,nodeValue:'Locatie delen AAN',parentElement:{closest:()=>true}};
 const {SKILanguage:api,SKI_I18N_DATA:data}=context([visible,user]);
 for(const lang of langs){
  api.set(lang);
  assert.equal(visible.nodeValue,data.translations[lang]['Locatie delen AAN']);
  assert.equal(user.nodeValue,'Locatie delen AAN');
 }
 api.set('nl');
 assert.equal(visible.nodeValue,'Locatie delen AAN');
 assert.equal(api.translate('constructor','constructor'),'constructor');
});
test('all translated PDF headings, safety footer and original piste numbers survive export',async()=>{
 const printed=[];
 const {SKILanguage:api,SKI_I18N_DATA:data,SKIPdf:pdf}=context([],printed);
 const warning='SKI-je is alleen een hulpmiddel. Officiële borden en liftstatus zijn altijd leidend.';
 const plan={ok:true,date:'2026-12-20',startPoint:'Hopfgarten',endPoint:'Hopfgarten',departure:'09:00',returnTime:'16:00',safeArrival:'15:30',useLunch:false,sections:[],notes:[]};
 const step={type:'piste',code:'20a',label:'⛷️ Piste 20a · Salvenbahn',start:'15:00',end:'15:20',minutes:20,detail:'Verbinding 25 meter op de kaart. Controleer of deze overgang geopend en fysiek bereikbaar is.'};
 const route={plan,route:{steps:[],notes:[warning]},itinerary:{steps:[step],pois:[],warnings:[]}};
 api.set('en');
 for(const lang of ['nl',...langs]){
  printed.length=0;
  const table=data.translations[lang]||{},expected=source=>table[source]||source;
  const blob=await pdf.generate(route,lang);
  assert.equal(blob.type,'application/pdf',lang);
  assert.ok(printed.includes(expected('SKI-JE · MIJN SKIDAG')),lang+' title');
  assert.ok(printed.includes(expected('PISTES, LIFTEN EN OVERSTAPPEN')),lang+' index');
  assert.ok(printed.includes('20a'),lang+' piste number');
  assert.ok(printed.join('').replace(/\s/g,'').includes(expected(warning).replace(/\s/g,'')),lang+' safety warning');
  assert.ok(printed.includes('15:00-15:20'),lang+' times');
 }
});
test('registered route templates preserve distance and name',()=>{
 const {SKILanguage:api,SKI_I18N_DATA:data}=context();
 for(const lang of langs){
  const t=data.translations[lang];
  assert.equal(api.translate('⛷️ Piste 20a · Salvenbahn',lang),'⛷️ '+t['Piste {0}'].replace('{0}','20a · Salvenbahn'));
  assert.equal(api.translate('Verbinding 25 meter op de kaart. Controleer of deze overgang geopend en fysiek bereikbaar is.',lang),t['Verbinding {0} meter op de kaart. Controleer of deze overgang geopend en fysiek bereikbaar is.'].replace('{0}','25'));
 }
});
