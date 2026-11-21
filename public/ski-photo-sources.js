/* SKI-je: source catalogue for hut interiors and gondola recognition photos.
   Opens third-party sources only via explicit user action. No images hotlinked. */
(()=>{
 'use strict';
 const panel=document.getElementById('ski-photo-sources');
 if(!panel)return;
 const $=id=>document.getElementById(id);
 let catalogue=null,loading=null,selectedQuery='';
 const normalize=s=>String(s||'').toLocaleLowerCase('nl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
 const link=(url,label)=>{
  if(typeof url!=='string'||!/^https:\/\//i.test(url))return null;
  const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;
  a.className='ski-source-link';return a;
 };
 async function load(){
  if(catalogue)return catalogue;
  if(loading)return loading;
  loading=fetch('./skiwelt-fotobronnen-2026.json',{cache:'force-cache'})
   .then(async r=>{if(!r.ok)throw Error('Bronnenlijst tijdelijk niet beschikbaar.');return r.json();})
   .then(json=>{if(!Array.isArray(json.restaurants)||!Array.isArray(json.lifts))throw Error('Onjuist bronnenbestand.');catalogue=json;return json;})
   .finally(()=>{loading=null;});
  return loading;
 }
 const title=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
 const list=$('ski-photo-sources-results'),query=$('ski-photo-sources-search'),kind=$('ski-photo-sources-kind'),info=$('ski-photo-sources-status');
 let lastRender=0;
 function render(){
  if(!catalogue)return;
  const needle=normalize(query.value),filter=kind.value;
  const all=[...catalogue.restaurants.map(r=>({...r,kind:'restaurant'})),...catalogue.lifts.map(r=>({...r,kind:'lift'}))];
  const matches=all.filter(r=>(filter==='all'||filter===r.kind)&&(!needle||normalize([r.name,r.area,...(r.aliases||[])].join(' ')).includes(needle)));
  list.replaceChildren();
  for(const item of matches.slice(0,35)){
   const article=document.createElement('article');article.className='ski-photo-source';
   article.append(title('h4',(item.kind==='restaurant'?'🍽️ ':'🚡 ')+item.name),title('small',item.area));
   const gallery=document.createElement('div');gallery.className='ski-source-buttons';
   for(const src of item.sources.slice(0,7)){
    const a=link(src.url,src.name+' · '+src.type);
    if(a)gallery.append(a);
   }
   if(!gallery.children.length)gallery.append(title('p','Nog geen bruikbare bronlink bekend.'));
   article.append(gallery);
   list.append(article);
  }
  info.textContent=matches.length+' bronnenvermeldingen gevonden. Externe foto’s openen pas na jouw tik en worden niet automatisch opgeslagen. '+(matches.length>35?'Eerste 35 getoond; zoek specifieker.':'');
  lastRender=Date.now();
 }
 async function open(needle=''){
  panel.open=true;
  if(needle){query.value=needle;kind.value='all';selectedQuery=needle;}
  info.textContent='Fotobronnen laden…';
  try{await load();render();}catch(e){info.textContent=e.message;}
  if(needle)requestAnimationFrame(()=>panel.scrollIntoView({block:'start',behavior:'smooth'}));
 }
 panel.addEventListener('toggle',()=>{if(panel.open)open();});
 query.addEventListener('input',()=>{if(catalogue)render();});
 kind.addEventListener('change',()=>{if(catalogue)render();});
 document.getElementById('ski-photo-sources-refresh')?.addEventListener('click',()=>{
  catalogue=null;open();
 });
 window.SKIPhotoSources={open};
})();
