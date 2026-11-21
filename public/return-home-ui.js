/* SKI-je: opt-in GPS return guidance. Area inference only; no false piste-by-piste GPS claim. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const modal=$('return-home-modal'),output=$('return-home-output'),status=$('return-home-status'),select=$('return-area-override');
 const network=window.SKIWeltCorridors,detail=window.SKIRouteDetail,stations=window.SKIWeltStations;
 if(!modal||!network||!detail||!select||!output)return;
 let fix=null,opening=null,requesting=false;
 const t=source=>window.SKI_I18N_DATA?.translations?.[window.SKILanguage?.get?.()||'nl']?.[source]||source;
 const elem=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
 for(const area of network.areas){const opt=document.createElement('option');opt.value=area;opt.textContent=area;select.append(opt);}
 if(stations){
  const group=elem('optgroup','');group.label='Bekende stations · Brixen / Westendorf';
  for(const station of stations.selectable){
   const opt=elem('option','',station);opt.value=station;group.append(opt);
  }
  select.append(group);
 }
 const notes='⚠️ Dit is géén route vanaf de exacte GPS-pistepositie. Controleer welke lift en afdaling bereikbaar zijn en volg officiële pisteborden.';
 function reportedClosures(){return window.SKIDayUI?.getClosures?.()||[];}
 function finish(){return $('finish')?.value||$('start')?.value||'';}
 function close(){
  modal.hidden=true;
  if(![...document.querySelectorAll('.utility-modal')].some(x=>!x.hidden))document.body.classList.remove('utility-open');
  opening?.focus?.({preventScroll:true});
 }
 function renderSuggestion(suggestion,manual=false){
  output.replaceChildren();
  if(!suggestion.ok){status.textContent=suggestion.reason;return;}
  const distance=suggestion.candidates?.find(x=>x.area===suggestion.area)?.distanceKm;
  status.textContent=(manual?'Handmatig gekozen vertrekgebied: ':'GPS schat vertrekgebied: ')+suggestion.area+(distance!==undefined?' (± '+distance.toFixed(1)+' km tot referentiepunt)':'');
  output.append(elem('h3','',t('Snelste bekende gebiedsverbinding')+' · '+suggestion.area+' → '+suggestion.endArea));
  const time=elem('p','day-pill',suggestion.minutes+' '+t('minuten indicatief')+' · '+t('Niet live gecontroleerd'));
  output.append(time);
  if(!suggestion.legs.length){output.append(elem('p','hint','Je bent vermoedelijk al in het gekozen eindgebied. Zoek de juiste piste en het exacte eindstation met de officiële borden.'));}
  else {
   const now=new Date();let minute=now.getHours()*60+now.getMinutes();
   for(const leg of suggestion.legs){
    const row=elem('div','region-leg');
    const end=minute+leg.minutes;
    const fmt=m=>String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
    row.append(elem('b','',fmt(minute)+'–'+fmt(end)+' · '+leg.from+' → '+leg.to));
    row.append(elem('p','',leg.via));
    row.append(elem('small','',t('Niet live gecontroleerd')+' · '+leg.minutes+' '+t('minuten indicatief')));
    output.append(row);minute=end;
   }
  }
  output.append(elem('p','hint',notes));
  const pois=detail.placesFor(suggestion.legs);
  if(pois.length){
   const wc=elem('details','');wc.append(elem('summary','',t('WC-opties langs de gebiedsroute')+' (⚠)'));
   for(const p of pois){
    const row=elem('p','',p.title+' · '+p.location+' — '+p.status+' ');
    const link=elem('a','',t('Bron controleren'));link.href=p.source;link.rel='noopener noreferrer';link.target='_blank';
    row.append(link);wc.append(row);
   }output.append(wc);
  }
 }
 function calculate(manual=false){
  const override=select.value;
  if(manual&&stations?.selectable.includes(override)){
   output.replaceChildren();
   const destination=finish();
   if(override===destination){status.textContent='Vertrek- en eindstation zijn gelijk.';return;}
   const now=new Date();
   const timeZone='Europe/Vienna';
   const departure=new Intl.DateTimeFormat('en-GB',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
   const local=new Intl.DateTimeFormat('sv-SE',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
   const result=stations.plan({start:override,finish:destination,date:local,
    departure,returnTime:$('return-time')?.value||'16:00',useLunch:false,
    useSafety:$('use-safety')?.checked,safetyMarginMin:$('safety-duration')?.value,
    skill:$('skill')?.value,speed:$('speed')?.value,allowBlack:$('allow-black')?.checked===true},reportedClosures());
   if(!result?.plan.ok){
    status.textContent=result?.plan.reason||'Het geselecteerde eindstation ligt buiten dit stationsnetwerk.';
    for(const gap of result?.gaps||[])output.append(elem('p','hint',gap.reason));
    return;
   }
   status.textContent='Handmatig vertrekstation: '+override+' · verwachte aankomst '+result.plan.arrival;
   for(const step of result.itinerary.steps.filter(s=>s.id)){
    const row=elem('div','region-leg');
    row.append(elem('b','',step.start+'–'+step.end+' · '+step.label));
    row.append(elem('p','',step.detail));output.append(row);
   }
   for(const note of result.route.notes)output.append(elem('p','hint',note));
   return;
  }
  if(manual&&!fix){
   const end=network.areaOf(finish());
   if(!end){status.textContent='Selecteer eerst een eindpunt.';return;}
   const legs=network.shortest(override,end,reportedClosures());
   renderSuggestion(legs?{ok:true,area:override,endArea:end,legs,minutes:legs.reduce((n,s)=>n+s.minutes,0),candidates:[]}
     :{ok:false,reason:'Geen gedocumenteerde verbinding vanaf dit gebied.'},true);
   return;
  }
  if(!fix){status.textContent='Haal eerst je GPS op of kies handmatig een gebied.';return;}
  renderSuggestion(detail.homeSuggestion(fix,finish(),network,reportedClosures(),override),manual);
 }
 function fetchPosition(){
  if(requesting)return;
  if(!navigator.geolocation||!window.isSecureContext){status.textContent='GPS niet beschikbaar: controleer HTTPS en locatietoestemming.';return;}
  requesting=true;$('return-home-retry').disabled=true;
  status.textContent='GPS-positie bepalen…';
  navigator.geolocation.getCurrentPosition(position=>{
   requesting=false;$('return-home-retry').disabled=false;
   fix={latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy};
   const areas=detail.nearestAreas(fix);
   if(areas.length)select.value=areas[0].area;
   calculate(false);
  },()=>{
   requesting=false;$('return-home-retry').disabled=false;
   status.textContent='GPS niet beschikbaar. Je kunt zelf een vertrekgebied kiezen.';
  },{enableHighAccuracy:true,maximumAge:15000,timeout:15000});
 }
 function open(event){
  opening=event.currentTarget;modal.hidden=false;document.body.classList.add('utility-open');
  status.textContent='GPS-positie bepalen…';
  output.replaceChildren();
  fetchPosition();
 }
 ['return-home-planner','return-home-map'].map($).filter(Boolean).forEach(b=>b.addEventListener('click',open));
 $('return-home-close')?.addEventListener('click',close);
 $('return-home-retry')?.addEventListener('click',fetchPosition);
 $('return-home-manual')?.addEventListener('click',()=>calculate(true));
 select.addEventListener('change',()=>calculate(true));
 modal.addEventListener('click',event=>{if(event.target===modal)close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)close();});
 window.SKIReturnHome={open,calculate};
})();