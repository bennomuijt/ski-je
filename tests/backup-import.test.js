import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/backup-migration.js',import.meta.url),'utf8');
function harness(payload){
 const store=new Map(),button={click:null,addEventListener(type,cb){this.click=cb;}},input={files:[{size:2000,text:async()=>JSON.stringify(payload)}]},status={textContent:''};
 let reloads=0;
 const nodes={'backup-import-file':input,'backup-import-button':button,'backup-import-status':status};
 const ctx={document:{getElementById:key=>nodes[key]},localStorage:{setItem:(k,v)=>store.set(k,v)},window:{location:{reload:()=>reloads++}},confirm:()=>true,JSON,Object,Array};
 vm.runInNewContext(source,ctx);
 return {button,input,status,store,get reloads(){return reloads;}};
}
test('v4 JSON backup import is browser-only, preserves expected data and reloads',async()=>{
 const data={version:1,extra:{checkpoints:[{name:'Hartkaiser'}],days:[{km:12}],network:[],issues:[],preferences:{power:'eco'},photos:{}},routePreferences:{start:'Ellmau'}};
 const t=harness(data);await t.button.click();
 assert.equal(t.reloads,1);
 const st=JSON.parse(t.store.get('skije-extended-2026-v1'));
 assert.equal(st.checkpoints[0].name,'Hartkaiser');
 assert.equal(st.preferences.power,'eco');
 assert.equal(JSON.parse(t.store.get('skije-preview-v1')).start,'Ellmau');
 assert.match(t.status.textContent,/hersteld/i);
});
test('unknown backup format is rejected without changing saved SKI-je data',async()=>{
 const t=harness({version:0,extra:{}});await t.button.click();
 assert.equal(t.reloads,0);assert.equal(t.store.size,0);assert.match(t.status.textContent,/mislukt/i);
});
