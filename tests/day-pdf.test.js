import test from 'node:test';import assert from 'node:assert/strict';
import '../public/day-pdf.js';
const pdf=globalThis.SKIPdf;
test('PDF creates a structured A4 raster page with valid PDF xref',()=>{
 const bytes=pdf.encodePdf([new Uint8Array([255,216,255,217])]);
 const header=new TextDecoder().decode(bytes);
 assert.match(header,/%PDF-1\.4/);
 assert.match(header,/\/Type \/Catalog/);
 assert.match(header,/\/MediaBox \[0 0 595\.28 841\.89\]/);
 assert.match(header,/\/Filter \/DCTDecode/);
 assert.match(header,/xref/);assert.match(header,/%%EOF/);
});
test('PDF refuses empty page list',()=>assert.throws(()=>pdf.encodePdf([])));
test('PDF layout includes every safety warning, even with 21 area connections',()=>{
 const legs=Array.from({length:21},(_,i)=>({id:i}));
 const warnings=Array.from({length:24},(_,i)=>'Warning '+(i+1));
 const pages=pdf.layoutPages(legs,warnings);
 assert.equal(pages[0].kind,'schedule');
 assert.deepEqual(pages.slice(1).flatMap(p=>p.legs),legs);
 assert.deepEqual(pages.slice(1).flatMap(p=>p.notes),warnings);
 assert.ok(pages.some(p=>p.kind==='notes'));
});
test('short area route and two safety notes still fit a two-page document',()=>{
 const pages=pdf.layoutPages([{from:'Ellmau'},{from:'Scheffau'}],['Closed lift warning','Official status warning']);
 assert.equal(pages.length,2);
 assert.equal(pages[1].notes.length,2);
});
