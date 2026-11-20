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