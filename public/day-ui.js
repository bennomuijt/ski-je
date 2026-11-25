/* SKI-je day route UI: complete day plan and map-listed area connections.
   Reports of closed pistes/lifts stay on this device, never uploaded by default. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const planner=window.SKI_DayPlanner,network=window.SKIWeltCorridors,detail=window.SKIRouteDetail;
 if(!planner||!network||!detail||!$('create')||!$('plan-output'))return;
 const KEY='skije-local-closures-2026-v1';
 let current=null,readyPdf=null,readyPdfLang=null,renderRequest=0;
 // Keep original DOM text in Dutch so the language observer can switch repeatedly.
 const t=source=>source;
 const shareT=source=>window.SKILanguage?.translate?.(source)||source;
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
   routePreset:input('hopfgarten-route-preset'),hopfgartenEndMode:input('hopfgarten-end-mode')||'valley',
   date:input('day')||(()=>{const d=new Date();const pad=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());})(),style:document.querySelector('[data-style][aria-pressed="true"]')?.dataset.style||'relaxed',
   skill:input('skill')||'red',speed:input('speed')||'normal',allowBlack:checked('allow-black')&&input('skill')!=='blue',
   wishes:[...document.querySelectorAll('#wishes-list select')].map(x=>x.value).filter(Boolean),
   useLunch:checked('use-lunch'),lunchTime:input('lunch-time'),lunchDuration:Number(input('lunch-duration')||60),
   lunchRestaurant:input('lunch-restaurant'),lunchRestaurantLabel:input('lunch-restaurant')?(option?.textContent||''):'',
   morningBreak:checked('early-break'),morningDuration:Number(input('early-duration')||30),afternoonBreak:checked('late-break'),afternoonDuration:Number(input('late-duration')||30),useSafety:checked('use-safety'),safetyMarginMin:checked('use-safety')?Math.max(0,Math.min(120,Number(input('safety-duration')))):0};
 }
 function composeMessage(data){
  const p=data.plan,n=data.route,it=data.itinerary;
  return [
   'SKI-je · '+shareT('Voorlopige skidagplanning'),
   p.date||'',p.startPoint+' → '+p.endPoint,
   p.departure+' – '+p.returnTime+'  ('+shareT('Streefaankomst')+': '+p.safeArrival+')',
   ...it.steps.map(s=>s.start+'–'+s.end+'  '+(s.type==='lift'?'🚡 ':s.type==='piste'?'⛷️ ':'')+shareT(s.label)),
   n.steps.length?shareT('Voorgestelde gebiedsverbindingen')+':':'',
   ...n.steps.map(s=>'⚠ '+s.from+' → '+s.to+': '+shareT(s.via)),
   ...n.notes.slice(0,4).map(shareT),
   shareT('Geen live garantie. Officiële piste- en liftinformatie gaat altijd voor.')
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
   const row=el('div','closure-row');const label=el('span','',item.kind+' '+item.code+(item.note?' · '+item.note:''));label.dataset.skijeNoTranslate='';const remove=el('button','btn secondary small-btn',t('Melding verwijderen'));remove.type='button';
   remove.addEventListener('click',()=>{const next=getClosures();next.splice(index,1);saveClosures(next);renderClosures();render();});
   row.append(label,remove);list.append(row);
  }
 }
 async function render(){
  const serial=++renderRequest,options=inputs(),output=$('plan-output');output.replaceChildren();readyPdf=null;current=null;
  output.append(el('p','hint','Geografisch piste- en liftnetwerk laden; aansluitingen controleren…'));
  let routeResult;
  try{
   if(!window.SKIMapRouter)throw Error('Geografische routeplanner ontbreekt in deze appversie.');
   await window.SKIMapRouter.load();
   if(serial!==renderRequest)return;
   routeResult=window.SKIMapRouter.build(options,getClosures());
  }catch(error){
   if(serial!==renderRequest)return;
   output.replaceChildren(el('strong','','Kaartnetwerk niet beschikbaar'));
   output.append(el('p','route-errors',String(error?.message||error)));
   output.append(el('p','hint','Zonder aaneengesloten kaartgegevens geeft SKI-je geen verzonnen piste- of liftroute.'));
   return;
  }
  output.replaceChildren();
  if(!routeResult.ok){
   output.append(el('strong','',t('Controleer je planning')));
   output.append(el('p','route-errors',routeResult.reason));
   output.append(el('p','hint','Er is geen ononderbroken piste-/liftroute gevonden voor deze keuzes. Ontbrekende aansluitingen worden niet overgeslagen.'));
   return;
  }
  const {plan,route,itinerary}=routeResult;
  current={plan,route,options,itinerary,graphBased:true,path:routeResult.path,
   optionalDescent:routeResult.optionalDescent,endMode:routeResult.endMode,routePreset:routeResult.routePreset};

  const incomplete=itinerary.missingSteps?.length||itinerary.steps.some(step=>step.unplanned);
  const heading=incomplete?'⚠️ Voorlopige skidag':
   itinerary.unverifiedTransitions?.length?'Jouw skidag · aandachtspunten bij overstappen':t('Jouw volledige skidag');
  output.append(el('strong','plan-heading',heading));
  const intro=el('div','day-intro');
  intro.append(el('span','day-pill',plan.departure+' – '+plan.returnTime));
  intro.append(el('span','day-pill',t('Streefaankomst')+' '+plan.safeArrival+' · marge '+plan.margin+' min'));
  intro.append(el('span','day-pill',plan.lunchMinutes+' '+t('minuten lunch')));
  output.append(intro);
  output.append(el('p','plan-locations',plan.startPoint+' → '+plan.endPoint));
  if(routeResult.optionalDescent){
   const desc=routeResult.optionalDescent;
   const escape=el('section','hopfgarten-escape-panel');
   escape.append(el('h3','',routeResult.endMode==='middle'?
    '🏁 Middenstation bereikt — piste 20a optioneel':
    '🏁 Terug tot dalstation via piste 20a'));
   escape.append(el('p','',desc.reason));
   const condition=desc.available?
    'Gerekend zonder liften: '+desc.minutes+' min skiën/overstappen (indicatief). De officiële openstelling en sneeuwcondities blijven leidend.':
    'Geen controleerbare liftvrije dalafdaling. Controleer officiële piste- en gondelstatus.';
   escape.append(el('p','hint',condition));
   if(routeResult.endMode==='middle'){
    escape.append(el('p','hint','Je bent uiterlijk '+plan.safeArrival+' bij het middenstation; de planner heeft extra tijd voor piste 20a gereserveerd. Als 20a gesloten is, ben je mogelijk wél afhankelijk van de gondel.'));
    if(desc.available){
     const details=el('details','hopfgarten-descent-steps');
     details.append(el('summary','','⛷️ Toon de optionele afdaling naar het dal ('+desc.steps.length+' onderdelen)'));
     for(const [i,step] of desc.steps.entries()){
      details.append(el('p','',String(i+1)+'. '+step.label+' · ±'+step.minutes+' min'));
     }
     escape.append(details);
     const book=el('button','btn secondary small-btn','⛷️ Neem piste 20a op in mijn dagroute');
     book.type='button';book.addEventListener('click',()=>{
      $('hopfgarten-end-mode').value='valley';render();
     });
     escape.append(book);
    }
   }else{
    escape.append(el('p','hint','Piste 20a staat als laatste daadwerkelijke afdaling in het tijdschema en op de kaart. Er staat daarna geen lift meer.'));
    const middle=el('button','btn secondary small-btn','🏁 Liever eindigen bij het middenstation?');
    middle.type='button';middle.addEventListener('click',()=>{
     $('hopfgarten-end-mode').value='middle';render();
    });escape.append(middle);
   }
   output.append(escape);
  }
  const lengths=detail.routeDistances?.(itinerary,options)||{pisteKm:0,liftKm:0,pisteCount:0,liftCount:0};
  const kms=el('div','day-intro ski-distance-summary');
  for(const [title,km,count,estimated] of [['⛷️ Pistekilometers',lengths.pisteKm,lengths.pisteCount,lengths.pisteEstimated],['🚡 Liftkilometers',lengths.liftKm,lengths.liftCount,lengths.liftEstimated]]){
   kms.append(el('span','day-pill',title+': '+(count?(estimated?'ca. ':'')+km.toFixed(2)+' km'+(estimated?' (schatting)':''):'niet bekend')));
  }
  output.append(kms,el('p','hint',lengths.note||'Alleen getoonde onderdelen, geen volledige officiële dagafstand.'));
  // Keep downloads and sharing above the lengthy day route; users may open it on demand.
  const routeDetails=el('details','day-route-collapsible');
  routeDetails.id='day-route-collapsible';
  const routeSummary=el('summary','day-route-summary','🧭 Bekijk volledige route · '+itinerary.steps.length+' onderdelen');
  routeSummary.setAttribute('aria-label','Volledige route met '+itinerary.steps.length+' onderdelen tonen of verbergen');
  routeDetails.append(routeSummary);
  output.append(routeDetails);
  const timeline=el('div','day-timeline');
  for(const s of plan.sections){
   const row=el('div','day-timeline-row '+s.type);
   row.append(el('b','day-time',s.start+' – '+s.end));
   const box=el('div','day-event');box.append(el('strong','',s.label));box.append(el('p','',s.detail));
   row.append(box);timeline.append(row);
  }
  routeDetails.append(timeline);
  const routeWrap=el('section','plan-regions');
  routeWrap.append(el('h3','',t('Lift-piste-route met richttijden')+' · ⚠'));
  const guidance=el('p','hint',t('De tijden zijn schattingen vanaf vertrek. Controleer bij elke lift of je voor of achter op schema ligt. Onbekende verbindingen zijn geen exacte GPS-navigatie.'));
  routeWrap.append(guidance);
  const legend=el('div','ski-route-legend');
  for(const [kind,title] of [['lift','🚡 '+t('Lift')],['piste','⛷️ '+t('Piste')],['transfer','⇄ '+t('Overstap')],['lunch','🍽️ '+t('Lunchpauze')],['return','🏠 '+t('Terugweg')]]){
   legend.append(el('span','ski-route-tag '+kind,title));
  }
  routeWrap.append(legend);
  if(routeResult.graphBased&&window.SKIGeometryView?.mount)window.SKIGeometryView.mount(routeWrap,routeResult);
  window.SKIOfficialTourUI?.mount?.(routeWrap,getClosures());
  const detailed=el('div','ski-route-steps');
  for(const [i,step] of itinerary.steps.entries()){
   const row=el('div','ski-route-step '+step.type);
   row.setAttribute('data-step-index',String(i));
   const when=el('span','ski-route-clock',step.start+' → '+step.end);
   const info=el('div','ski-route-description');
   info.append(el('strong','',(step.type==='lift'?'🚡 ':step.type==='piste'?'⛷️ ':step.type==='lunch'?'🍽️ ':step.type==='buffer'?'✓ ':step.type==='break'?'☕ ':step.type==='return'?'🏠 ':step.type==='transfer'?'⇄ ':'⛷️ ')+step.label));
   info.append(el('small','',step.minutes+' '+t('minuten indicatief')+' · '+(step.phase||'planning')));
   if(step.detail)info.append(el('p','',step.detail));
   row.append(when,info);detailed.append(row);
  }
  routeWrap.append(detailed);
  if(itinerary.missingSteps?.length||itinerary.unverifiedTransitions?.length){
   const gaps=el('details','route-gap-audit');
   const count=(itinerary.missingSteps?.length||0)+(itinerary.unverifiedTransitions?.length||0);
   const title=itinerary.missingSteps?.length?'Ontbrekende routeonderdelen en overstappen':'Aandachtspunten bij overstappen';
   gaps.append(el('summary','','⚠️ '+title+' ('+count+')'));
   gaps.append(el('p','hint','Controleer de aangeduide overstappen op de pistekaart en volg de borden ter plaatse.'));
   for(const part of itinerary.missingSteps||[]){
    gaps.append(el('p','route-gap-line','⏳ '+part.phase+': '+(part.code?part.code+' · ':'')+part.name+' — '+part.reason));
   }
   for(const gap of itinerary.unverifiedTransitions||[]){
    gaps.append(el('p','route-gap-line','⇄ '+gap.corridor+': '+gap.from+' → '+gap.to+' — '+gap.reason));
   }
   routeWrap.append(gaps);
  }
  const checkpoints=el('p','hint','⚠️ '+t('Richttijden zijn geen garantie. Liftwachttijd, pauzes en weer kunnen het schema veranderen.'));
  routeWrap.append(checkpoints);
  const toilets=el('details','ski-route-wc');
  toilets.append(el('summary','',t('🚻 WC-opties langs de route')+' ('+itinerary.pois.length+')'));
  if(!itinerary.pois.length)toilets.append(el('p','hint',t('Voor deze route zijn nog geen betrouwbare WC-locaties vastgelegd.')));
  for(const poi of itinerary.pois){
   const item=el('div','ski-wc-point');
   item.append(el('strong','','🚻 '+poi.title));
   item.append(el('p','',(poi.estimatedNearTime?'Circa '+poi.estimatedNearTime+' · ':'')+poi.location+' · '+poi.status+' · ±'+poi.extraTimeMinutes+' min extra · '+t('Eventuele omweg, niet standaard ingepland')));
   const link=el('a','legal-inline-link',t('Officiële bron controleren'));link.href=poi.source;link.target='_blank';link.rel='noopener noreferrer';item.append(link);
   toilets.append(item);
  }
  routeWrap.append(toilets);
  const regional=el('details','ski-route-regions');
  regional.append(el('summary','',t('Gebiedsverbindingen volgens SkiWelt')+' (⚠)'));
  const regionalList=el('div','region-chain');
  if(route.steps.length){
   for(const leg of route.steps){
    const line=el('div','region-leg');
    line.append(el('b','',leg.from+' → '+leg.to));
    line.append(el('p','',leg.via));
    line.append(el('small','',t('Niet live gecontroleerd')+' · '+leg.minutes+' '+t('minuten indicatief')));
    regionalList.append(line);
   }
  }else regionalList.append(el('p','hint',t('Geen bevestigde gebiedsverbinding beschikbaar. Er is wel een dagplanning gemaakt.')));
  regional.append(regionalList);
  const src=el('a','legal-inline-link',t('Officiële SkiWelt-verbindingen'));src.href=network.SOURCE;src.target='_blank';src.rel='noopener noreferrer';regional.append(src);
  routeWrap.append(regional);
  routeDetails.append(routeWrap);
  addNotes(routeDetails,[...plan.notes,...route.notes,...itinerary.warnings]);
  const actions=el('div','day-plan-actions');
  const pdf=el('button','btn',t('Download mijn skidag als PDF'));pdf.id='download-day-pdf';pdf.type='button';
  const share=el('button','btn secondary',t('Deel skidag via telefoon'));share.id='share-day-plan';share.type='button';
  const sharePdf=el('button','btn secondary',t('Deel PDF'));sharePdf.id='share-day-pdf';sharePdf.type='button';
  const mapRoute=el('button','btn secondary',t('🗺️ Bekijk routegebieden op kaart'));mapRoute.id='show-day-panorama';mapRoute.type='button';
  mapRoute.addEventListener('click',()=>{routeDetails.open=true;requestAnimationFrame(()=>{if(routeResult.graphBased&&routeDetails.querySelector('.graph-track-map'))routeDetails.querySelector('.graph-track-map').scrollIntoView({behavior:'smooth',block:'center'});else if(window.SKIMapRoute?.show)window.SKIMapRoute.show(current);else $('pano-open')?.click();});});
  const status=el('p','hint');status.id='day-export-status';status.setAttribute('role','status');
  actions.append(pdf,share,sharePdf,mapRoute);output.insertBefore(actions,routeDetails);output.insertBefore(status,routeDetails);
  async function getPdf(){
   const language=window.SKILanguage?.get?.()||'nl';
   const route=current;
   if(readyPdf&&readyPdfLang===language)return readyPdf;
   if(!window.SKIPdf){throw Error('PDF-module nog niet beschikbaar');}
   const blob=await window.SKIPdf.generate(route,language);
   if(route===current){readyPdf=blob;readyPdfLang=language;}
   return blob;
  }
  pdf.addEventListener('click',async()=>{
   pdf.disabled=true;status.textContent=t('PDF maken…');
   try{const blob=await getPdf();window.SKIPdf.save(blob,detail.fileName(plan));
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
    const blob=await getPdf();const file=new File([blob],detail.fileName(plan),{type:'application/pdf'});
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
 // All real lift stations are selectable. Keep village/dalstation choices on top.
 // The route itself is always computed offline from map lines, never from GPS.
 function populateLiftStations(data){
  const mapped=Object.entries(data.stations||{}).filter(([id,v])=>id.startsWith('lift:')&&Number.isInteger(v?.node));
  mapped.sort((a,b)=>String(a[1].ref).localeCompare(String(b[1].ref),'nl',{numeric:true})||a[0].localeCompare(b[0]));
  let stored={};
  try{stored=JSON.parse(localStorage.getItem('skije-preview-v1')||'{}')?.form||{};}catch{}
  for(const id of ['start','finish']){
   const select=$(id);if(!select||select.querySelector('optgroup[data-skiwelt-lifts]'))continue;
   const value=select.value||stored[id];
   for(const [side,label] of [['bottom','Andere liften · dalstations'],['middle','Andere liften · tussenstations'],['top','Andere liften · bergstations']]){
    const optgroup=document.createElement('optgroup');optgroup.label=label;optgroup.dataset.skiweltLifts=side;
    for(const [key,station] of mapped){
     if(side==='middle'&&!station.side.startsWith('middle')||side!=='middle'&&station.side!==side)continue;
     const option=document.createElement('option');option.value=key;option.textContent=station.label;
     optgroup.append(option);
    }
    if(optgroup.childElementCount)select.append(optgroup);
   }
   const desired=stored[id]&&data.stations[stored[id]]?stored[id]:value;
   if(desired&&[...select.options].some(option=>option.value===desired))select.value=desired;
  }
  if($('same-end')?.checked&&$('start')?.value)$('finish').value=$('start').value;
  updateHopfgartenTools();
 }
 function updateHopfgartenTools(){
  const box=$('hopfgarten-route-settings');if(!box)return;
  const finish=$('finish')?.value||'',start=$('start')?.value||'';
  const enabled=start==='Hopfgarten dalstation'&&
    ['Hopfgarten dalstation','Hopfgarten tussenstation','lift:20:top'].includes(finish);
  box.hidden=!enabled;
  if(enabled&&finish!=='Hopfgarten dalstation')$('hopfgarten-end-mode').value='middle';
 }
 for(const id of ['start','finish','same-end']){
  $(id)?.addEventListener('change',()=>queueMicrotask(updateHopfgartenTools));
 }
 updateHopfgartenTools();
 // Load once in the foreground so choices are ready before route creation.
 window.SKIMapRouter?.load().then(populateLiftStations).catch(error=>{
  const hint=$('plan-output');
  if(hint&&!hint.textContent)hint.append(el('p','hint','De volledige liftstationslijst is offline nog niet geladen. Controleer je internetverbinding.'));
  console.warn('SkiWelt graph stations unavailable:',error);
 });
 $('closed-form')?.addEventListener('submit',addClosure);
 renderClosures();
 window.SKIDayUI={render,getCurrent:()=>current,getClosures};
})();