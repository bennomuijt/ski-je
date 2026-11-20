import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
const source=readFileSync(new URL('../public/share-location.js',import.meta.url),'utf8');
test('share controls appear beside SOS, in SOS window and on GPS map',()=>{
 for(const id of ['share-location-hero','share-location-map','share-location-sos','share-location-modal','share-location-native','share-location-refresh','share-location-copy','share-location-whatsapp','share-location-sms']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.ok(html.indexOf('id="open-sos"')<html.indexOf('id="share-location-hero"'));
 assert.ok(html.indexOf('id="share-location-hero"')-html.indexOf('id="open-sos"')<180);
 assert.match(html,/src="share-location\.js"/);
 assert.match(sw,/\.\/share-location\.js/);
});
test('share menu opens only after choosing to share the GPS fix',()=>{
 const names=['share-location-hero','share-location-map','share-location-sos','share-location-modal','share-location-refresh','share-location-native','share-location-copy','share-location-whatsapp','share-location-sms','share-location-preview','share-location-status','share-location-close'];
 const elements={};
 for(const name of names){elements[name]={id:name,hidden:false,disabled:false,href:'',value:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},focus(){},setAttribute(k,v){this[k]=v;},removeAttribute(k){delete this[k];}};}
 elements['share-location-modal'].hidden=true;
 const winEvents={};let shared=0,shareData=null,gpsCalls=0,succeed=null;
 const win={isSecureContext:true,addEventListener(type,fn){winEvents[type]=fn;},dispatchEvent(event){winEvents[event.type]?.(event);},SKILanguage:{get:()=> 'nl'}};
 const nav={geolocation:{getCurrentPosition(onSuccess){gpsCalls++;succeed=onSuccess;}},share(data){shared++;shareData=data;return Promise.resolve();},clipboard:{writeText:()=>Promise.resolve()}};
 const doc={body:{classList:{add(){},remove(){}}},activeElement:elements['share-location-hero'],
   getElementById:id=>elements[id]||null,addEventListener(){},querySelectorAll:()=>[elements['share-location-modal']]};
 const sandbox={window:win,navigator:nav,document:doc,CustomEvent:class{constructor(type,data){this.type=type;this.detail=data.detail;}},Date,Math,Number,Promise};
 vm.runInNewContext(source,sandbox);
 elements['share-location-hero'].listeners.click({currentTarget:elements['share-location-hero']});
 assert.equal(gpsCalls,1);
 assert.equal(shared,0);
 assert.equal(elements['share-location-native'].disabled,true);
 succeed({coords:{latitude:47.4321,longitude:12.3456,accuracy:18},timestamp:Date.now()});
 assert.equal(elements['share-location-native'].disabled,false);
 assert.match(elements['share-location-preview'].value,/47\.432100, 12\.345600/);
 assert.match(elements['share-location-preview'].value,/maps\?q=47\.432100,12\.345600/);
 assert.match(elements['share-location-preview'].value,/18 m/);
 elements['share-location-native'].listeners.click();
 assert.equal(shared,1);
 assert.match(shareData.text,/47\.432100/);
 assert.match(elements['share-location-whatsapp'].href,/wa\.me\//);
 assert.match(elements['share-location-sms'].href,/sms:\?body=/);
});
test('GPS sharing does not automatically post coordinates or save a history',()=>{
 assert.doesNotMatch(source,/\bfetch\s*\(/);
 assert.doesNotMatch(source,/WebSocket/);
 assert.doesNotMatch(source,/localStorage\./);
 assert.match(source,/navigator\.share\(/);
 assert.match(source,/getCurrentPosition/);
 assert.match(source,/MAX_AGE=120000/);
});