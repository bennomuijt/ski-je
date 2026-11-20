/* SKI-je day route UI: complete day plan and map-listed area connections.
   Reports of closed pistes/lifts stay on this device, never uploaded by default. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const planner=window.SKI_DayPlanner,network=window.SKIWeltCorridors;
 if(!planner||!network||!$('create')||!$('plan-output'))return;
 const KEY='skije-local-closures-2026-v1';
 let current=null,readyPdf=null;
 const t=source=>window.SKI_I18N_DATA?.translations?.[window.SKILanguage?.get?.()||'nl']?.[source]||source;
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
 function getClosures(){
  try{return network.parseClosures(JSON.parse(localStorage.getItem(KEY)||'[]'));}
  catch{return [];}
 }
 function saveClosures(rows){try{localStorage.setItem(KEY,JSON.stringify(network.parseClosures(rows)));return true;}catch{return false;}}
 function inputs(){
  const input=id=>$(id)?.value||'',checked=id=>$(id)?.checked===true;
  const option=$('lunch-restaurant')?.selectedOptions?.[0];
  return {start:input('start'),finish:input('finish'),departure:input('departure'),returnTime:input('return-time'),
   date:input('day'),style:document.querySelector('[data-style][aria-pressed="true"]')?.dataset.style||'relaxed',
   skill:input('skill')||'red',speed:input('speed')||'normal',
   wishes:[...document.querySelectorAll('#wishes-list select')].map(x=>x.value).filter(Boolean),
   useLunch:checked('use-lunch'),lunchTime:input('lunch-time'),lunchDuration:Number(input('lunch-duration')||60),
   lunchRestaurant:input('lunch-restaurant'),lunchRestaurantLabel:input('lunch-restaurant')?(option?.textContent||''):'',
   morningBreak:checked('early-break'),afternoonBreak:checked('late-break')};
 }
 function composeMessage(data){
  const p=data.plan,n=data.route;
  return [
   'SKI-je · '+t('Voorlopige skidagplanning'),
   p.date||'',p.startPoint+' → '+p.endPoint,
   p.departure+' – '+p.returnTime+'  ('+t('Streefaankomst')+': '+p.safeArrival+')',
   ...p.sections.map(s=>s.start+'–'+s.end+'  '+s.label),
   n.steps.length?t('Voorgestelde gebiedsverbindingen')+':':'',
   ...n.steps.map(s=>'⚠ '+s.from+' → '+s.to+': '+s.via),
   ...n.notes.slice(0,4),
   t('Geen live garantie. Officiële piste- en liftinformatie gaat altijd voor.')
  ].filter(Boolean).join('\n');
 }
 function addNotes(parent,notes){
  if(!notes?.length)return;
  const details=el('details','plan-warnings');const summary=el('summary','',t('Waarschuwingen')+' ('+notes.length+')');details.append(summary);
  const list=el('ul','');for(const note of [...new Set(notes)]){const li=el('li','',note);list.append(li);}details.append(list);parent.append(details);
 }
 function renderClosures(){
  const list=$('closed-list');if(!list)return;list.replaceChildren();
  const rows=getClosures();
  if(!rows.length){list.append(el('p','hint',t('Nog geen eigen sluitingen gemeld.')));return;}
  for(const [index,item] of rows.entries()){
   const row=el('div','closure-row');const label=el('span','',item.kind+' '+item.code+(item.note?' · '+item.note:''));const remove=el('button','btn secondary small-btn',t('Melding verwijderen'));remove.type='button';
   remove.addEventListener('click',()=>{const next=getClosures();next.splice(index,1);saveClosures(next);renderClosures();render();});
   row.append(label,remove);list.append(row);
  }
 }
 function render(){
  const options=inputs(),plan=planner.compute(options),output=$('plan-output');output.replaceChildren();readyPdf=null;
  if(!plan.ok){
   output.append(el('strong','',t('Controleer je planning')));
   output.append(el('p','route-errors',plan.reason));
   output.append(el('p','hint',t('Kies haalbare tijden; de officiële veiligheid en liftstatus blijven leidend.')));
   current=null;return;
  }
  const route=network.build(options,getClosures());current={plan,route,options};
  output.append(el('strong','plan-heading',t('Jouw volledige skidag')));
  const intro=el('div','day-intro');
  intro.append(el('span','day-pill',plan.departure+' – '+plan.returnTime));
  intro.append(el('span','day-pill',t('Streefaankomst')+' '+plan.safeArrival));
  intro.append(el('span','day-pill',plan.lunchMinutes+' '+t('minuten lunch')));
  output.append(intro);
  output.append(el('p','plan-locations',plan.startPoint+' → '+plan.endPoint));
  const timeline=el('div','day-timeline');
  for(const s of plan.sections){
   const row=el('div','day-timeline-row '+s.type);
   row.append(el('b','day-time',s.start+' – '+s.end));
   const box=el('div','day-event');box.append(el('strong','',s.label));box.append(el('p','',s.detail));
   row.append(box);timeline.append(row);
  }
  output.append(timeline);
  const routeWrap=el('section','plan-regions');
  routeWrap.append(el('h3','',t('Voorgestelde gebiedsroute')+' · ⚠'));
  if(route.steps.length){
   const chain=el('div','region-chain');
   for(const s of route.steps){
    const line=el('div','region-leg');
    line.append(el('b','',s.from+' → '+s.to));
    line.append(el('p','',s.via));
    line.append(el('small','',t('Niet live gecontroleerd')+' · '+s.minutes+' '+t('minuten indicatief')));
    chain.append(line);
   }routeWrap.append(chain);
  }else routeWrap.append(el('p','hint',route.ok?t('Blijf in het gekozen gebied; gebruik de officiële kaart voor de pistes.') :t('Geen bevestigde gebiedsverbinding beschikbaar. Er is wel een dagplanning gemaakt.')));
  const src=el('a','legal-inline-link',t('Officiële SkiWelt-verbindingen'));src.href=network.SOURCE;src.target='_blank';src.rel='noopener noreferrer';routeWrap.append(src);
  output.append(routeWrap);
  addNotes(output,[...plan.notes,...route.notes]);
  const actions=el('div','day-plan-actions');
  const pdf=el('button','btn',t('Download mijn skidag als PDF'));pdf.id='download-day-pdf';pdf.type='button';
  const share=el('button','btn secondary',t('Deel skidag via telefoon'));share.id='share-day-plan';share.type='button';
  const sharePdf=el('button','btn secondary',t('Deel PDF'));sharePdf.id='share-day-pdf';sharePdf.type='button';
  const status=el('p','hint');status.id='day-export-status';status.setAttribute('role','status');
  actions.append(pdf,share,sharePdf);output.append(actions,status);
  async function getPdf(){
   if(readyPdf)return readyPdf;
   if(!window.SKIPdf){throw Error('PDF-module nog niet beschikbaar');}
   readyPdf=await window.SKIPdf.generate(current);
   return readyPdf;
  }
  pdf.addEventListener('click',async()=>{
   pdf.disabled=true;status.textContent=t('PDF maken…');
   try{const blob=await getPdf();window.SKIPdf.save(blob,'SKI-je-'+(plan.date||'skidag')+'.pdf');
    status.textContent=t('PDF gereed. Ook delen via je telefoon is mogelijk.');
   }catch(err){status.textContent=t('PDF kon niet worden gemaakt. Gebruik de deelknop voor het tekstschema.');console.error(err);}
   finally{pdf.disabled=false;}
  });
  share.addEventListener('click',()=>{
   const text=composeMessage(current);
   if(navigator.share){Promise.resolve(navigator.share({title:'SKI-je skidag',text})).catch(err=>{if(err?.name!=='AbortError')status.textContent=t('Delen niet gelukt. Probeer kopiëren.');});}
   else if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>{status.textContent=t('Dagplanning gekopieerd.');}).catch(()=>{status.textContent=t('Delen niet beschikbaar op dit toestel.');});
   else status.textContent=t('Delen niet beschikbaar op dit toestel.');
  });
  sharePdf.addEventListener('click',async()=>{
   try{
    const blob=await getPdf();const file=new File([blob],'SKI-je-skidag.pdf',{type:'application/pdf'});
    if(navigator.share&&navigator.canShare?.({files:[file]})){
     await navigator.share({files:[file],title:'SKI-je skidag'});return;
    }
    window.SKIPdf.save(blob);
    status.textContent=t('Dit toestel ondersteunt PDF-bestanden delen niet direct; PDF is gedownload.');
   }catch(err){if(err?.name!=='AbortError')status.textContent=t('Delen van PDF is niet gelukt. Probeer eerst downloaden.');}
  });
 }
 function addClosure(event){
  event.preventDefault();
  const kind=$('closed-kind')?.value,code=$('closed-code')?.value.trim().toLowerCase(),note=$('closed-note')?.value.trim()||'';
  const message=$('closed-status');
  if(!['lift','piste','corridor'].includes(kind)||!/^[a-z0-9_-]{1,20}$/.test(code||'')){message.textContent=t('Vul een geldig piste- of liftnummer in.');return;}
  const rows=getClosures();const item={kind,code,note,at:new Date().toISOString()};
  if(!rows.some(x=>x.kind===kind&&x.code===code))rows.push(item);
  if(!saveClosures(rows)){message.textContent=t('Opslaan van melding mislukt.');return;}
  message.textContent=t('Sluiting lokaal gemeld. Je volgende routeberekening vermijdt deze verbinding.');
  $('closed-code').value='';$('closed-note').value='';
  renderClosures();render();
 }
 $('closed-form')?.addEventListener('submit',addClosure);
 renderClosures();
 window.SKIDayUI={render,getCurrent:()=>current,getClosures};
})();