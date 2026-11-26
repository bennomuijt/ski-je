import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import '../public/day-pdf.js';

const pdf = globalThis.SKIPdf;

test('PDF preserves every detail row, route-index row, code and time across pages', () => {
  // Synthetic pagination fixture, not a claimed physical ski route.
  const codes = ['117','117a','117b','99','99a'];
  const steps = Array.from({length:83}, (_,i) => ({
    type: i===30 ? 'lunch' : i%3===0 ? 'lift' : i%3===1 ? 'piste' : 'transfer',
    code: i===30 || i%3===2 ? '' : codes[i%codes.length],
    start:'09:00', end:'09:05', label:'Fixture '+i
  }));
  const pois = Array.from({length:12},(_,i)=>({title:'Fixture WC '+i}));
  const warnings = Array.from({length:24},(_,i)=>'Fixture warning '+i);
  const pages = pdf.reportPages({plan:{notes:[]},route:{steps:[],notes:[]},
    itinerary:{steps,pois,warnings}});
  assert.deepEqual(pages.filter(p=>p.kind==='detail').flatMap(p=>p.rows), steps);
  const indexed = steps.filter(s=>['lift','piste','transfer'].includes(s.type));
  assert.deepEqual(pages.filter(p=>p.kind==='route-index').flatMap(p=>p.rows)
    .map(r=>[r.position,r.type,r.code,r.time,r.until,r.label]),
    indexed.map((s,i)=>[i+1,s.type,s.code,s.start,s.end,s.label]));
  assert.deepEqual(pages.filter(p=>p.kind==='wc').flatMap(p=>p.rows),pois);
  assert.deepEqual(pages.filter(p=>['regions','notes'].includes(p.kind)).flatMap(p=>p.notes),warnings);
  assert.equal(pages.at(-1).kind,'summary');
});

const source = readFileSync(new URL('../public/day-ui.js', import.meta.url),'utf8');
function shareHandler(canShare) {
  // Execute the actual registered callback with a minimal browser stub.
  const match = source.match(/sharePdf\.addEventListener\('click',async\(\)=>\{([\s\S]*?)\r?\n[ \t]*\}\);/);
  assert.ok(match,'PDF share callback found');
  const saves=[], shares=[];
  const plan={date:'2026-12-20',departure:'09:00',returnTime:'16:00'};
  const fileName='SKI-je-2026-12-20-0900-1600.pdf';
  const blob = new Blob(['fixture'],{type:'application/pdf'});
  const scope={
    getPdf:async()=>blob, plan,detail:{fileName:()=>fileName},
    File:class{constructor(parts,name){this.name=name;}},
    navigator:{canShare:()=>canShare,share:async data=>{shares.push(data);}},
    window:{SKIPdf:{save:(...args)=>saves.push(args)}},
    status:{textContent:''},t:v=>v
  };
  return {handler:runInNewContext('(async()=>{'+match[1]+'})',scope),saves,shares,fileName,blob};
}
test('native PDF share preserves the planned filename',async()=>{
  const s=shareHandler(true);await s.handler();
  assert.equal(s.shares.length,1);
  assert.equal(s.shares[0].files[0].name,s.fileName);
  assert.equal(s.saves.length,0);
});
test('PDF share fallback downloads with the same date and time filename',async()=>{
  const s=shareHandler(false);await s.handler();
  assert.equal(s.shares.length,0);
  assert.equal(s.saves.length,1);
  assert.equal(s.saves[0][0],s.blob);
  assert.equal(s.saves[0][1],s.fileName);
});

test('PDF overview title, date and route occupy distinct drawing areas in all eight languages', async()=>{
  const read = name=>readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
  const printed=[];
  const document={
    body:{nodeType:1,matches:()=>false,closest:()=>null,hasAttribute:()=>false},
    documentElement:{},querySelectorAll:()=>[],getElementById:()=>null,
    createTreeWalker:()=>({nextNode:()=>null}),dispatchEvent:()=>{},
    createElement:()=>{
      const rows=[];printed.push(rows);
      const ctx={font:'20px sans-serif',fillRect(){},
        fillText(text,x,y,maxWidth){rows.push({text:String(text),x,y,maxWidth,size:Number(this.font.match(/(\d+)px/)[1])});},
        measureText(text){return {width:String(text).length*Number(this.font.match(/(\d+)px/)[1])*0.65};},
        createLinearGradient(){return {addColorStop(){}};}
      };
      return {getContext:()=>ctx,toDataURL:()=>'data:image/jpeg;base64,/9j/2Q=='};
    }
  };
  const sandbox={window:{},document,Blob,TextEncoder,Uint8Array,atob,NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},
    CustomEvent:class{},MutationObserver:class{observe(){}},localStorage:{getItem:()=>null,setItem:()=>{}}};
  runInNewContext(['i18n-data.js','i18n-extra.js','i18n-pdf.js','i18n.js','day-pdf.js'].map(read).join('\n;\n'),sandbox);
  const plan={ok:true,date:'2026-12-20',startPoint:'Hopfgarten dalstation',endPoint:'Westendorf dalstation',
    departure:'09:00',safeArrival:'15:30',returnTime:'16:00',sections:[],notes:[]};
  const data={plan,route:{steps:[],notes:[]},itinerary:{steps:[],warnings:[]}};
  const overlaps=(a,b)=>a.x<b.x+b.maxWidth&&b.x<a.x+a.maxWidth&&
    a.y-a.size<b.y+3&&b.y-b.size<a.y+3;
  for(const lang of ['nl','en','de','fr','es','zh','pl','da']){
    printed.length=0;
    await sandbox.SKIPdf.generate(data,lang);
    const rows=printed[0],t=v=>sandbox.window.SKILanguage.translate(v,lang);
    const title=rows.find(r=>r.text===t('DAGOVERZICHT · ALLE TRAJECTEN OP VOLGENDE BLADEN'));
    const date=rows.find(r=>r.text===t('DATUM '+plan.date));
    const routeRows=rows.filter(r=>r.text.includes('Hopfgarten')||r.text.includes('Westendorf'));
    assert.ok(title&&date&&routeRows.length,lang+' overview fields');
    assert.ok(!overlaps(title,date),lang+' title/date overlap');
    for(const route of routeRows){
      assert.ok(!overlaps(route,date),lang+' route/date overlap');
      assert.ok(!overlaps(route,title),lang+' route/title overlap');
    }
  }
});
