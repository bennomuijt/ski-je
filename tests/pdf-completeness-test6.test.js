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
  const match = source.match(/sharePdf\.addEventListener\('click',async\(\)=>\{([\s\S]*?)\n   \}\);/);
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
