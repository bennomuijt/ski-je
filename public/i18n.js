/* SKI-je 4.4 UI localisation. No external translation service. */
(()=>{
 'use strict';
 const config=window.SKI_I18N_DATA;
 if(!config||!Array.isArray(config.languages)||!config.translations)return;
 const LANG_KEY='skije-ui-language-v1';
 const supported=new Set(config.languages.map(([id])=>id));
 const htmlLang={zh:'zh-CN'};
 const canonical=new WeakMap();
 const attributes=new WeakMap();
 const legalNotices={
  nl:'De Nederlandse tekst van de gebruiksvoorwaarden is juridisch leidend.',
  en:'The Dutch wording of these terms is legally authoritative. Other-language interface labels are provided for convenience.',
  de:'Der niederländische Wortlaut dieser Bedingungen ist rechtlich maßgebend. Übersetzte Bedienelemente dienen der Orientierung.',
  fr:'La version néerlandaise de ces conditions fait juridiquement foi. Les libellés traduits sont fournis à titre pratique.',
  es:'El texto neerlandés de estas condiciones es el jurídicamente válido. Las etiquetas traducidas son orientativas.',
  zh:'本使用条款以荷兰语原文为法律依据。其他语言的界面文字仅供理解和操作参考。',
  pl:'Prawnie wiążący jest niderlandzki tekst regulaminu. Przetłumaczone etykiety służą jedynie ułatwieniu obsługi.',
  da:'Den nederlandske tekst i vilkårene er juridisk gældende. Oversatte brugerfladetekster er kun vejledende.'
 };
 function getSaved(){
  try{const saved=localStorage.getItem(LANG_KEY);return supported.has(saved)?saved:'nl';}
  catch{return 'nl';}
 }
 let current=getSaved();
 const SELECTOR='[data-skije-language-select]';
 const SKIP='script,style,noscript,svg,code,pre,textarea,[contenteditable="true"],#legal-text,[data-skije-no-translate],.cf-chat-item,#skije-legal-translation-note';
 // Translate only registered message formats. Literal separators, not executable
 // regular expressions from translation data. Slots are copied as plain text.
 const templates=Object.keys(config.translations.en||{}).filter(key=>/\{\d+\}/.test(key))
  .sort((a,b)=>b.length-a.length).map(key=>({key,parts:key.split(/(\{\d+\})/)}));
 function fromTemplate(source,table){
  if(source.length>4096)return undefined;
  for(const {key,parts} of templates){
   if(!Object.hasOwn(table,key)||!source.startsWith(parts[0]))continue;
   let position=parts[0].length,valid=true;
   const values=Object.create(null);
   for(let i=1;i<parts.length;i+=2){
    const separator=parts[i+1],last=i===parts.length-2;
    const end=last?(source.endsWith(separator)?source.length-separator.length:-1):source.indexOf(separator,position);
    if(end<=position||(!last&&!separator)){valid=false;break;}
    values[parts[i].slice(1,-1)]=source.slice(position,end);
    position=end+separator.length;
   }
   if(valid&&position===source.length)return table[key].replace(/\{(\d+)\}/g,(slot,n)=>Object.hasOwn(values,n)?values[n]:slot);
  }
  return undefined;
 }
 function lookup(source,table){
  if(Object.hasOwn(table,source)&&typeof table[source]==='string')return table[source];
  return fromTemplate(source,table);
 }
 function translateValue(source,lang){
  if(typeof source!=='string')return source;
  if(lang==='nl'||!supported.has(lang))return source;
  const table=config.translations[lang];
  if(!table)return source;
  const exact=lookup(source.trim(),table);
  if(exact!==undefined)return source.replace(source.trim(),()=>exact);
  // Keep symbols and emoji before menu labels, including their spacing.
  const pieces=source.match(/^(\s*[^\p{L}\p{N}]*)([\s\S]*?)(\s*)$/u);
  if(!pieces)return source;
  const translated=lookup(pieces[2],table);
  return translated===undefined?source:pieces[1]+translated+pieces[3];
 }
 function textNode(node,lang){
  if(!node||node.nodeType!==3||!node.parentElement||node.parentElement.closest(SKIP))return;
  const value=node.nodeValue;
  const previous=canonical.get(node);
  const original=previous&&value===previous.shown?previous.original:value;
  const shown=translateValue(original,lang);
  if(shown!==value)node.nodeValue=shown;
  canonical.set(node,{original,shown});
 }
 function translateAttributes(element,lang){
  if(!element||element.nodeType!==1||element.closest(SKIP))return;
  const attrs=['aria-label','title','placeholder','alt'];
  let memo=attributes.get(element);if(!memo){memo={};attributes.set(element,memo);}
  for(const key of attrs){
   if(!element.hasAttribute(key))continue;
   const value=element.getAttribute(key);
   const previous=memo[key];
   const original=previous&&value===previous.shown?previous.original:value;
   const shown=translateValue(original,lang);
   if(shown!==value)element.setAttribute(key,shown);
   memo[key]={original,shown};
  }
 }
 function visit(root,lang){
  if(!root)return;
  if(root.nodeType===3){textNode(root,lang);return;}
  if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
  if(root.nodeType===1&&root.matches(SKIP))return;
  if(root.nodeType===1)translateAttributes(root,lang);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
   if(node.nodeType===3)textNode(node,lang);
   else translateAttributes(node,lang);
  }
 }
 function refreshLegalNote(){
  const note=document.getElementById('skije-legal-translation-note');
  if(note){note.hidden=current==='nl';note.textContent=legalNotices[current]||legalNotices.nl;}
 }
 function apply(lang,save){
  current=supported.has(lang)?lang:'nl';
  document.documentElement.lang=htmlLang[current]||current;
  document.querySelectorAll(SELECTOR).forEach(select=>{if(select.value!==current)select.value=current;});
  visit(document.body,current);
  refreshLegalNote();
  if(save){try{localStorage.setItem(LANG_KEY,current);}catch{}}
  document.dispatchEvent(new CustomEvent('skije-languagechange',{detail:{lang:current}}));
 }
 function buildSelectors(){
  document.querySelectorAll(SELECTOR).forEach(select=>{
   select.replaceChildren();
   for(const [code,flag,name] of config.languages){
    const option=document.createElement('option');option.value=code;option.textContent=flag+' '+name;select.append(option);
   }
   select.value=current;
   select.addEventListener('change',()=>apply(select.value,true));
  });
 }
 buildSelectors();
 apply(current,false);
 const observer=new MutationObserver(changes=>{
  for(const change of changes){
   if(change.type==='characterData')textNode(change.target,current);
   if(change.type==='attributes')translateAttributes(change.target,current);
   if(change.type==='childList'){
    for(const node of change.addedNodes)visit(node,current);
   }
  }
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']});
 window.SKILanguage={get:()=>current,set:(lang)=>apply(lang,true),available:config.languages.map(([id])=>id),translate:(source,lang=current)=>translateValue(source,lang)};
})();
