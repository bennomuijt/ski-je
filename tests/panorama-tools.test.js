import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function app(){
 const listeners=new Map(),elements={};
 const element=tag=>({
  tag,dataset:{},attributes:{},listeners:{},textContent:'',hidden:false,value:'',
  setAttribute(key,value){this.attributes[key]=value;},
  addEventListener(type,fn){this.listeners[type]=fn;},
  click(){this.listeners.click?.();},
  dispatchEvent(event){this.listeners[event.type]?.(event);},
  append(child){(this.children??=[]).push(child);},
  replaceChildren(){this.children=[];},
  querySelectorAll(){return this.children??[];}
 });
 for(const id of ['pano-focus','pano-route-box','pano-route-list','pano-open'])
  elements[id]=element(id);
 elements['pano-route-box'].hidden=true;
 let opens=0;elements['pano-open'].click=()=>{opens++;};
 const document={
  getElementById:id=>elements[id]||null,
  createElement:element
 };
 const window={SKIWeltCorridors:{areaOf:label=>{
  if(String(label).includes('Ellmau'))return 'Ellmau';
  if(String(label).includes('Söll'))return 'Söll';
  return null;
 }}};
 const code=readFileSync(new URL('../public/panorama-tools.js',import.meta.url),'utf8');
 vm.runInNewContext(code,{document,window,Event:class{constructor(type){this.type=type;}}});
 return {elements,window,get opens(){return opens;}};
}

test('shows route area sequence and focuses schematic panorama on selected area',()=>{
 const ui=app();
 ui.window.SKIMapRoute.show({route:{steps:[
  {from:'Ellmau',to:'Scheffau'},{from:'Scheffau',to:'Söll'},
  {from:'Söll',to:'Ellmau'}
 ]}});
 assert.equal(ui.opens,1);
 assert.equal(ui.elements['pano-route-box'].hidden,false);
 assert.deepEqual(Array.from(ui.window.SKIMapRoute.areas()),['Ellmau','Scheffau','Söll','Ellmau']);
 assert.equal(ui.elements['pano-focus'].value,'ellmau');
 const buttons=ui.elements['pano-route-list'].children;
 assert.equal(buttons.length,4);
 buttons[2].click();
 assert.equal(ui.elements['pano-focus'].value,'soll');
 assert.equal(buttons[2].attributes['aria-pressed'],'true');
 assert.equal(buttons[0].attributes['aria-pressed'],'false');
});

test('handles a day plan without known area segments',()=>{
 const ui=app();
 ui.window.SKIMapRoute.show({route:{steps:[]},options:{start:'unknown',finish:'unknown'}});
 assert.equal(ui.opens,1);
 assert.equal(ui.elements['pano-route-box'].hidden,true);
 assert.equal(ui.elements['pano-route-list'].children.length,0);
});
