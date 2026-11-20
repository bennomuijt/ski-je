/* SKI-je extension: route checks, GPS checkpoints, foreground tracking,
   local groups, diagnostics, weather comparison and battery/data controls.
   No server-side account or silent location upload is present. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const engine=window.SkiRouteEngine;
 if(!engine)throw new Error('Route-engine is niet beschikbaar.');
 const KEY='skije-extended-2026-v1';
 const now=()=>Date.now();
 const pad=n=>String(n).padStart(2,'0');
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const limit=(n,a,b)=>Math.min(b,Math.max(a,n));
 const num=(n,d=0)=>Number.isFinite(Number(n))?Number(n).toFixed(d):'--';
 const sizeLimit=950000;let store={checkpoints:[],issues:[],days:[],network:[],nodes:[],group:{},preferences:{power:'auto',motion:true,hints:false},photos:{}};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object'&&Array.isArray(saved.checkpoints)&&Array.isArray(saved.issues)&&Array.isArray(saved.days)&&Array.isArray(saved.network))store={...store,...saved,preferences:{...store.preferences,...saved.preferences},photos:saved.photos||{}};}catch{}
 let saveFailure=false;
 function persist(){
  try{localStorage.setItem(KEY,JSON.stringify(store));saveFailure=false;}
  catch(e){saveFailure=true;if(document.readyState==='complete')showToast('Opslag vol of geblokkeerd. Exporteer je gegevens.');}
  if($('storage-alert'))$('storage-alert').hidden=!saveFailure;return !saveFailure;
 }
 function showToast(message){
  let div=$('skije-toast');if(!div){div=document.createElement('div');div.id='skije-toast';div.className='skije-toast';div.setAttribute('role','status');document.body.append(div);}
  div.textContent=message;
  // No repeating timer: replace old timer only on a new user-triggered message.
  clearTimeout(showToast.t);showToast.t=setTimeout(()=>{div.textContent='';},5500);
 }
 function dateISO(t=now()){return new Date(t).toLocaleDateString('sv-SE',{timeZone:'Europe/Vienna'});}
 function localTime(t=now()){return new Date(t).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Vienna'});}
 function formatDate(t){return new Date(t).toLocaleDateString('nl-NL',{day:'2-digit',month:'short',year:'numeric',timeZone:'Europe/Vienna'});}
 const kmGeo=(a,b)=>{const rad=Math.PI/180,R=6371,dl=(b.lat-a.lat)*rad,dn=(b.lng-a.lng)*rad;const h=Math.sin(dl/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dn/2)**2;return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));};
 function exportFile(name,text,mime='text/plain;charset=utf-8'){
  const blob=new Blob([text],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }
 function downloadJSON(name,obj){exportFile(name,JSON.stringify(obj,null,2),'application/json;charset=utf-8');}
 async function copyText(text){try{await navigator.clipboard.writeText(text);showToast('Tekst gekopieerd.');return true;}catch{showToast('Kopieren niet toegestaan in deze browser.');return false;}}
 async function shareText(title,text){if(typeof navigator.share==='function'){try{await navigator.share({title,text});return;}catch(e){if(e?.name==='AbortError')return;}}copyText(text);}
 function ownModal(id){const modal=$(id);if(!modal)return;modal._priorFocus=document.activeElement;modal.hidden=false;document.body.classList.add('utility-open');const target=modal.querySelector('button,select,input');target?.focus({preventScroll:true});}
 function closeModal(id){const modal=$(id);if(!modal||modal.hidden)return;modal.hidden=true;document.body.classList.remove('utility-open');modal._priorFocus?.focus?.({preventScroll:true});}
 document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
 document.querySelectorAll('.utility-modal').forEach(modal=>{
  modal.addEventListener('click',e=>{if(e.target===modal)closeModal(modal.id);});
  modal.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const focusable=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')];if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){for(const m of document.querySelectorAll('.utility-modal:not([hidden])'))closeModal(m.id);}});
 // Runtime banner and toggles: all local, no background polling.
 function connectionLabel(){$('online-label').textContent=navigator.onLine?'● Online':'● Offline (bewaarde functies)';document.body.classList.toggle('pwa-offline',!navigator.onLine);}
 connectionLabel();addEventListener('online',connectionLabel);addEventListener('offline',connectionLabel);
 function setPower(mode){
  store.preferences.power=['auto','eco','full'].includes(mode)?mode:'auto';
  const saveData=navigator.connection?.saveData===true;
  const eco=store.preferences.power==='eco'||(store.preferences.power==='auto'&&saveData);
  document.body.classList.toggle('eco-mode',eco);
  document.body.classList.toggle('no-motion',!store.preferences.motion||eco);
  $('power-setting').value=store.preferences.power;
  $('motion-setting').checked=store.preferences.motion;
  $('hint-checkpoints').checked=!!store.preferences.hints;
  $('power-quick').textContent=eco?'\u26a1 Extra zuinig':'\u26a1 Zuinig';
  $('power-explanation').textContent=eco?'Extra zuinig: geen bewegend achtergrondbeeld, radar blijft handmatig en locatie wordt niet automatisch gevolgd.':'Kaarten, webcams en radar laden alleen wanneer je ze opent. GPS blijft op aanvraag.';
  persist();
 }
 setPower(store.preferences.power);
 $('power-setting').addEventListener('change',e=>setPower(e.target.value));
 $('motion-setting').addEventListener('change',e=>{store.preferences.motion=e.target.checked;setPower(store.preferences.power);showToast('Nieuwe introinstelling geldt bij de volgende start.');});
 $('hint-checkpoints').addEventListener('change',e=>{store.preferences.hints=e.target.checked;persist();});
 $('power-quick').addEventListener('click',()=>{window.SKIApi?.goPage('more');$('settings-section').open=true;$('power-setting').focus({preventScroll:true});});
 // Utility: ever-present SOS. GPS only on direct request.
 let latestPos=null;
 window.addEventListener('skije:gpsfix',e=>{latestPos=e.detail.position;});
 $('open-sos').addEventListener('click',()=>ownModal('sos-modal'));
 function oneGPS({accuracy=false,maxAge=0,timeout=15000}={}){return new Promise((resolve,reject)=>{
  if(!navigator.geolocation){reject(new Error('Geen GPS beschikbaar'));return;}
  if(!window.isSecureContext){reject(new Error('HTTPS is vereist'));return;}
  navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:accuracy,maximumAge:maxAge,timeout});
 });}
 $('sos-coordinate').addEventListener('click',async()=>{
  $('sos-position').textContent='GPS wordt opgevraagd; wacht bij nood niet op GPS.';
  try{const pos=await oneGPS({accuracy:true,timeout:12000});latestPos=pos; window.dispatchEvent(new CustomEvent('skije:gpsfix',{detail:{position:pos,source:'sos'}})); $('sos-position').textContent='Positie: '+pos.coords.latitude.toFixed(6)+', '+pos.coords.longitude.toFixed(6)+' (toestel meldt +/- '+Math.round(pos.coords.accuracy)+' m)';}
  catch(e){$('sos-position').textContent='GPS niet beschikbaar: '+(e.message||'controleer toestemming')+'. Bel de hulpdiensten.';}
 });
 $('sos-copy').addEventListener('click',()=>{if(!latestPos){showToast('Vraag eerst je GPS-positie op.');return;}copyText(latestPos.coords.latitude.toFixed(6)+', '+latestPos.coords.longitude.toFixed(6));});
 // Full-screen offline-compatible panorama; location is never placed on it.
 let zoom=1,panX=0,panY=0,panoDown=null;
 function updatePano(){const img=$('pano-img');img.style.transform=`translate3d(${panX}px,${panY}px,0) scale(${zoom})`;$('pano-zoom').textContent=Math.round(zoom*100)+'%';}
 $('pano-open').addEventListener('click',()=>{if(!$('pano-img').src||!$('pano-img').hasAttribute('src'))$('pano-img').src=$('pano-img').dataset.src;zoom=1;panX=panY=0;updatePano();ownModal('pano-modal');});
 $('pano-plus').addEventListener('click',()=>{zoom=limit(zoom+.4,1,4);updatePano();});
 $('pano-minus').addEventListener('click',()=>{zoom=limit(zoom-.4,1,4);if(zoom===1)panX=panY=0;updatePano();});
 $('pano-reset').addEventListener('click',()=>{zoom=1;panX=panY=0;updatePano();});
 $('pano-viewport').addEventListener('pointerdown',e=>{if(zoom<=1)return;panoDown={id:e.pointerId,x:e.clientX,y:e.clientY,startX:panX,startY:panY};$('pano-viewport').setPointerCapture(e.pointerId);});
 $('pano-viewport').addEventListener('pointermove',e=>{if(!panoDown||panoDown.id!==e.pointerId)return;panX=panoDown.startX+e.clientX-panoDown.x;panY=panoDown.startY+e.clientY-panoDown.y;updatePano();});
 const clearPan=()=>panoDown=null;$('pano-viewport').addEventListener('pointerup',clearPan);$('pano-viewport').addEventListener('pointercancel',clearPan);
 // Do not claim precise location on the drawn panorama: accurate pins live on OSM.
 let checkMap=null,checkMarkers=[],markerDirty=true;
 window.addEventListener('skije:mapready',e=>{checkMap=e.detail.map;markerDirty=true;renderCheckMarkers();});
 function renderCheckMarkers(){
  if(!checkMap||typeof L==='undefined'||!markerDirty||!$('page-map').classList.contains('active'))return;
  markerDirty=false;checkMarkers.forEach(marker=>checkMap.removeLayer(marker));checkMarkers=[];
  for(const point of store.checkpoints.slice(0,250)){
   if(!Number.isFinite(point.lat)||!Number.isFinite(point.lng))continue;
   const dot=L.circleMarker([point.lat,point.lng],{radius:7,color:point.verified?'#119061':'#f98a21',weight:2,fillColor:point.verified?'#27b77a':'#ffb164',fillOpacity:.7}).addTo(checkMap);
   dot.bindPopup(document.createTextNode((point.note||point.type)+' | toestel +/- '+Math.round(point.accuracy)+' m'));checkMarkers.push(dot);
  }
 }
 function weightedFixes(positions){
  let wSum=0,lat=0,lng=0;
  for(const pos of positions){const a=limit(Number(pos.coords.accuracy)||100,3,150);const w=1/(a*a);wSum+=w;lat+=pos.coords.latitude*w;lng+=pos.coords.longitude*w;}
  return {lat:lat/wSum,lng:lng/wSum,accuracy:positions.reduce((m,p)=>Math.max(m,p.coords.accuracy),0),samples:positions.length};
 }
 function showCheckpoints(){
  $('checkpoint-count').textContent=store.checkpoints.length+' opgeslagen';
  $('checkpoint-list').innerHTML=store.checkpoints.slice(0,18).map(cp=>`<div class="compact-item"><strong>${escape(cp.note||cp.type)}</strong><small>${escape(cp.type)} | ${formatDate(cp.createdAt)} ${localTime(cp.createdAt)} | ${cp.samples} meting(en) | GPS +/-${Math.round(cp.accuracy)} m | ${cp.verified?'Nagekeken':'Niet nagekeken'}</small><div class="toolbar"><button class="btn secondary" data-check-verify="${escape(cp.id)}">${cp.verified?'Markeer ongecontroleerd':'Markeer nagekeken'}</button><button class="btn clear" data-check-del="${escape(cp.id)}">Wissen</button></div></div>`).join('')||'<p class="hint">Nog geen GPS-ijkpunten. Meten kan ook zonder internet.</p>';
  markerDirty=true;renderCheckMarkers();
 }
 $('checkpoint-list').addEventListener('click',e=>{
  const verify=e.target.closest('[data-check-verify]'),del=e.target.closest('[data-check-del]');
  if(verify){const cp=store.checkpoints.find(c=>c.id===verify.dataset.checkVerify);if(cp){cp.verified=!cp.verified;persist();showCheckpoints();}}
  if(del&&confirm('Dit ijkpunt verwijderen?')){store.checkpoints=store.checkpoints.filter(c=>c.id!==del.dataset.checkDel);persist();showCheckpoints();}
 });
 $('checkpoint-map').addEventListener('click',()=>ownModal('checkpoint-modal'));
 $('checkpoint-main').addEventListener('click',()=>ownModal('checkpoint-modal'));
 $('day-to-checkpoint').addEventListener('click',()=>ownModal('checkpoint-modal'));
 let collecting=false;
 $('cp-save').addEventListener('click',async()=>{
  if(collecting)return;
  if(!navigator.geolocation||!window.isSecureContext){$('cp-status').textContent='GPS vereist HTTPS en toestemming op je telefoon.';return;}
  collecting=true;$('cp-save').disabled=true;
  const count=Number($('cp-measurements').value),positions=[];
  for(let i=0;i<count;i++){
   if(document.hidden){$('cp-status').textContent='Meten afgebroken: de app staat niet op de voorgrond.';break;}
   $('cp-status').textContent='GPS-meting '+(i+1)+' van '+count+' ...';
   try{const pos=await oneGPS({accuracy:true,maxAge:0,timeout:14000});if(pos.coords&&Number.isFinite(pos.coords.latitude)&&pos.coords.accuracy<150)positions.push(pos);}
   catch(e){$('cp-status').textContent='Meting '+(i+1)+' mislukt: '+(e.message||'GPS-fout');break;}
  }
  collecting=false;$('cp-save').disabled=false;
  if(!positions.length)return;
  const fix=weightedFixes(positions);
  const cp={id:'cp-'+Date.now()+'-'+Math.floor(Math.random()*9999),...fix,createdAt:Date.now(),type:$('cp-type').value,note:$('cp-note').value.trim().slice(0,90),verified:false};
  store.checkpoints.unshift(cp);store.checkpoints=store.checkpoints.slice(0,750);persist();showCheckpoints();
  $('cp-status').textContent=fix.samples+' meting(en) opgeslagen. Toestel nauwkeurigheid max +/- '+Math.round(fix.accuracy)+' m; controleer deze plek later.';
  showToast(saveFailure?'IJkpunt nog niet blijvend bewaard: exporteer je gegevens.':'IJkpunt lokaal opgeslagen.');
 });
 $('checkpoints-csv').addEventListener('click',()=>{
  const cols=['id','createdAt','type','note','lat','lng','accuracy','samples','verified'];
  const safe=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const rows=[cols.join(';'),...store.checkpoints.map(p=>cols.map(k=>safe(p[k])).join(';'))];
  exportFile('SKI-je-ijkpunten-'+dateISO()+'.csv','\ufeff'+rows.join('\r\n'),'text/csv;charset=utf-8');
 });
 $('checkpoints-geo').addEventListener('click',()=>downloadJSON('SKI-je-ijkpunten-'+dateISO()+'.geojson',{type:'FeatureCollection',features:store.checkpoints.map(p=>({type:'Feature',geometry:{type:'Point',coordinates:[p.lng,p.lat]},properties:{id:p.id,type:p.type,name:p.note,accuracy:p.accuracy,measurements:p.samples,verified:p.verified,createdAt:new Date(p.createdAt).toISOString()}}))}));
 showCheckpoints();
 // Controlled directed network: only verified edges can be routed.
 const STATIONS=[...$('start').options].map(o=>({value:o.value,label:o.textContent}));
 function updateNetworkNodeLists(){
  const all=new Map(STATIONS.map(s=>[s.value,s.label]));
  for(const n of store.nodes||[])if(n&&!all.has(n))all.set(n,n);
  for(const e of store.network)for(const node of [e.from,e.to])if(node&&!all.has(node))all.set(node,node);
  const html=[...all].map(([v,l])=>`<option value="${escape(v)}">${escape(l)}</option>`).join('');
  for(const id of ['edge-from','edge-to']){const old=$(id).value;$(id).innerHTML=html;if([...all].some(([v])=>v===old))$(id).value=old;}
  // Keep planner start/end in sync with imported checked stations without changing defaults.
  for(const id of ['start','finish']){
   const current=$(id).value,optionValues=new Set([...$(id).options].map(o=>o.value));
   for(const [v,l] of all)if(!optionValues.has(v)){$(id).add(new Option(l,v));}
   $(id).value=current;
  }
 }
 function networkRows(){
  $('network-count').textContent=store.network.filter(e=>e.verified).length+' gecontroleerde verbindingen / '+store.network.length+' totaal';
  $('network-list').innerHTML=store.network.slice(0,25).map(e=>`<div class="compact-item"><strong>${escape(e.name)}</strong><small>${escape(e.from)} &rarr; ${escape(e.to)} | ${escape(e.type)} | ${escape(e.code||'geen code')} | ${e.verified?'Eigen controle':'Niet gecontroleerd'} | ${escape(e.status)}</small><button class="btn clear" type="button" data-edge-delete="${escape(e.id)}">Verwijderen</button></div>`).join('')||'<p class="hint">Nog geen gecontroleerd netwerk. Dit is de belangrijkste voorwaarde voor echte routeberekening.</p>';
  updateNetworkNodeLists();
 }
 $('edge-node-add').addEventListener('click',()=>{
   const text=$('edge-node-new').value.trim().slice(0,90);
   if(text.length<4){$('network-result').textContent='Vul een herkenbaar controlepunt in (minimaal 4 tekens).';return;}
   store.nodes=Array.isArray(store.nodes)?store.nodes:[];
   if(store.nodes.includes(text)){$('network-result').textContent='Dit controlepunt staat al in de lijst.';return;}
   store.nodes.push(text);store.nodes=store.nodes.slice(0,800);persist();updateNetworkNodeLists();$('edge-node-new').value='';
   $('edge-from').value=text;$('network-result').textContent='Controlepunt toegevoegd aan de keuzelijst.';
 });
 $('network-list').addEventListener('click',e=>{const b=e.target.closest('[data-edge-delete]');if(!b)return;if(!confirm('Deze verbinding verwijderen?'))return;store.network=store.network.filter(v=>v.id!==b.dataset.edgeDelete);persist();networkRows();});
 $('network-add').addEventListener('click',()=>{
  if(!$('edge-verified').checked){$('network-result').textContent='Vink eerst aan dat je richting en aansluiting gecontroleerd hebt.';return;}
  const e=engine.normalizedEdge({id:'edge-'+now()+'-'+Math.floor(Math.random()*10000),name:$('edge-name').value,code:$('edge-code').value,from:$('edge-from').value,to:$('edge-to').value,type:$('edge-type').value,level:$('edge-level').value,lengthKm:$('edge-length').value,minutes:$('edge-minutes').value,waitMinutes:$('edge-type').value==='lift'?Number($('edge-wait').value):0,closingTime:$('edge-close').value,status:$('edge-status').value,verified:true,source:'Persoonlijke veldcontrole',updatedAt:new Date().toISOString()});
  if(!e||!$('edge-name').value.trim()){$('network-result').textContent='Controleer de naam, richting, lengte en tijden.';return;}
  store.network.push(e);store.network=store.network.slice(-2000);persist();networkRows();$('network-result').textContent='Gecontroleerde verbinding lokaal opgeslagen.';
 });
 $('network-json').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;if(file.size>500000){$('network-result').textContent='Bestand is te groot (maximaal 500 KB).';return;}
  try{
    const data=JSON.parse(await file.text());const result=engine.importNetwork(data);
    if(!confirm(result.edges.length+' verbindingen uit bestand toevoegen? Alleen aangevinkte, gecontroleerde verbindingen zijn routeerbaar.'))return;
    const ids=new Set(store.network.map(e=>e.id));for(const edge of result.edges){if(ids.has(edge.id))continue;store.network.push(edge);ids.add(edge.id);}
    store.network=store.network.slice(-2000);persist();networkRows();$('network-result').textContent=result.edges.length+' ingelezen; '+result.skipped+' ongeldig of dubbel. Controleer je bronnen.';
  }catch(err){$('network-result').textContent='Import mislukt: '+err.message;}finally{e.target.value='';}
 });
 $('network-export').addEventListener('click',()=>downloadJSON('SKI-je-gecontroleerd-netwerk-'+dateISO()+'.json',{version:1,source:'SKI-je veldcontrole',edges:store.network}));
 $('network-template').addEventListener('click',()=>downloadJSON('SKI-je-netwerk-sjabloon.json',{version:1,description:'VOORBEELD. Richtingen, status en tijden eerst zelf controleren.',edges:[{id:'voorbeeld-1',from:'Ellmau dalstation',to:'Hartkaiser bergstation',name:'Lift 80 - Hartkaiserbahn',code:'lift:80',type:'lift',lengthKm:2.3,minutes:15,waitMinutes:6,closingTime:'16:00',level:'blue',verified:false,status:'unknown',source:'Zelf controleren'}]}));
 $('network-demo').addEventListener('click',()=>{
  const sample=[{from:'TEST START',to:'TEST BERG',name:'DEMO gondel',type:'lift',code:'lift:demo',lengthKm:2,minutes:14,waitMinutes:5,verified:true,status:'unknown'},
    {from:'TEST BERG',to:'TEST START',name:'DEMO blauwe piste',type:'piste',code:'piste:demo',level:'blue',lengthKm:3,minutes:18,verified:true,status:'unknown'}];
  const result=engine.calculate({edges:sample,start:'TEST START',finish:'TEST START',departure:'09:00',returnTime:'16:00',useLunch:false,wishes:['piste:demo']});
  $('network-result').textContent='DEMO: '+(result.ok?result.steps.map(s=>s.edge.name).join(' -> ')+' | aankomst '+result.arrival:'geen route')+'. Dit zijn fictieve testknooppunten en worden NIET opgeslagen.';
 });
 $('network-clear').addEventListener('click',()=>{if(!confirm('Alle lokale netwerkverbindingen wissen? Exporteer eerst een backup.'))return;store.network=[];store.nodes=[];persist();networkRows();$('network-result').textContent='Netwerk gewist.';});
 networkRows();
 // Actual route computation (based only on user verified directed graph).
 function statusSafeEdges(){return store.network.map(edge=>{
   const e={...edge};if(e.status==='open'&&(!e.updatedAt||Date.now()-Date.parse(e.updatedAt)>24*3600*1000))e.status='unknown';
   return e;
 });}
 function routeSettings(){return {edges:statusSafeEdges(),start:$('start').value,finish:$('finish').value,departure:$('departure').value,returnTime:$('return-time').value,
   style:document.querySelector('[data-style][aria-pressed="true"]')?.dataset.style||'relaxed',skill:$('skill').value,speed:$('speed').value,
   wishes:[...$('wishes-list').querySelectorAll('select')].map(el=>el.value).filter(Boolean),useLunch:$('use-lunch').checked,lunchTime:$('lunch-time').value,
   lunchDuration:Number($('lunch-duration').value),lunchRestaurant:$('lunch-restaurant').value,
   morningBreak:$('early-break').checked,afternoonBreak:$('late-break').checked};}
 let lastRoute=null;
 function showComputedRoute(){
   const settings=routeSettings(),result=engine.calculate(settings);lastRoute=result;
   if(!result.ok){
     const missing=(result.missingWishes||[]).map(escape).join(', ');
     $('plan-output').innerHTML=`<strong>Route nog niet betrouwbaar berekend</strong><p class="route-errors">${escape(result.reason)}</p>${missing?'<p>Ontbrekend: '+missing+'</p>':''}<p class="hint">Je routewensen zijn wel opgeslagen. De routezoeker gebruikt alleen gecontroleerde, gerichte verbindingen en doet geen fictieve aannames.</p><button class="btn secondary" id="route-to-network" type="button">Verbindingen controleren</button>`;
     $('route-to-network').addEventListener('click',()=>{window.SKIApi?.goPage('more');$('network-section').open=true;});return;
   }
   const steps=result.steps.map(s=>{
      const color=s.edge.type==='piste'?'step-'+s.edge.level:s.edge.type==='lift'?'step-lift':'step-other';
      const savedPhoto=s.edge.type==='lift'?store.photos[s.edge.code]:null;
      const photoHTML=savedPhoto&&/^data:image\/(?:jpeg|webp|png);base64,/.test(savedPhoto)?'<img class="lift-thumb" alt="Eigen foto van de lift" loading="lazy" src="'+escape(savedPhoto)+'">':'';
      return `<div class="route-step ${color}"><b>${engine.hhmm(s.startAt)}</b><div><strong>${escape(s.edge.type==='lift'?'Lift':s.edge.type==='piste'?'Piste':'Overstap')} ${escape(s.edge.name)}</strong><br>${escape(s.edge.from)} &rarr; ${escape(s.edge.to)} | ${s.duration} min${s.edge.status==='unknown'?' | status onbekend':''}${photoHTML}</div></div>`;
   }).join('');
   const notes=result.warnings.map(w=>'<li>'+escape(w)+'</li>').join('');
   $('plan-output').innerHTML=`<strong>Route berekend op eigen controledata</strong><p><b>${result.edgeCount} verbindingen</b> | geschatte aankomst <b>${result.arrival}</b> | terugdoel <b>${result.latestArrival}</b> | reserve <b>${result.marginMinutes} min</b></p><div class="route-steps">${steps}</div>${notes?'<details><summary>Waarschuwingen ('+result.warnings.length+')</summary><ul>'+notes+'</ul></details>':''}<p class="hint">Niet-officieel gebruikersnetwerk; live liftstatus en alle pisterichtingen zijn niet onafhankelijk geverifieerd. Gebruik deze route niet als enige navigatie.</p>`;
 }
 // Replace the summary-only prototype action with a real conservative solver.
 $('create').addEventListener('click',e=>{e.stopImmediatePropagation();showComputedRoute();},true);
 $('quick-return').addEventListener('click',()=>{const same=$('same-end');same.checked=true;same.dispatchEvent(new Event('change',{bubbles:true}));showToast('Eindpunt teruggezet naar je startpunt.');});
 $('share-intent').addEventListener('click',()=>{
  const s=routeSettings();let message='SKI-je skiroute\n'+s.start+' -> '+s.finish+'\n'+s.departure+' tot '+s.returnTime+' (30 min veiligheidsmarge)';
  message+='\nNiveau: '+$('skill').selectedOptions[0].textContent+(s.useLunch?'\nLunch: '+s.lunchDuration+' min rond '+s.lunchTime:'');
  if(s.wishes.length)message+='\nWensen: '+s.wishes.join(', ');
  message+='\nRoutewensen, geen bevestigde navigatie.';shareText('SKI-je routewensen',message);
 });
 // Safe shortcut to route and personalised return reminder.
 $('day-to-route').addEventListener('click',()=>window.SKIApi?.goPage('plan'));
 function showTravelReminder(){
  const goal=$('finish').value,t=engine.clock($('return-time').value),reserve=t===null?'--:--':engine.hhmm(t-30);
  const caution='Streefaankomst '+reserve+' bij '+goal+'. Controleer liftstatus, routes en actuele sluitingstijden.';
  $('travel-note').textContent=caution;
 }
 for(const id of ['finish','start','return-time','same-end'])$(id).addEventListener('change',showTravelReminder);
 showTravelReminder();
 // Foreground-only tracking, with adaptive GPS accuracy and conservative filtering.
 let trackWatch=null,trackTicker=null,trackStartedAt=null,lastTrackPoint=null,stationaryFrom=null,lunchHintSent=false,trackAccuracy='high',lastTrackPersist=0,lastHintAt=0,lastReturnHintDay='';
 let session=store.activeSession||null;
 if(session){session.paused=true;session.pauseReason='App opnieuw geopend: hervat tracking bewust.';store.activeSession=session;persist();}
 function skiHour(t=now()){return Number(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hourCycle:'h23',timeZone:'Europe/Vienna'}).format(t));}
 function allowedToTrack(t=now()){const h=skiHour(t);return h>=8&&h<17;}
 function recordElapsed(){if(session&&!session.paused&&trackStartedAt!==null){session.elapsedMs=(session.elapsedMs||0)+now()-trackStartedAt;trackStartedAt=now();}}
 function updateTrackUI(){
  const active=!!session,paused=active&&session.paused;
  $('tracking-badge').textContent=!active?'Uit':paused?'Gepauzeerd':'Actief';
  $('tracking-badge').className='pill'+(!active?'':paused?' paused':' active');
  $('tracking-start').textContent=active?'\u25b6 Hervat tracking':'\u25b6 Start tracking';
  $('tracking-start').disabled=active&&!paused;
  $('tracking-pause').disabled=!active;$('tracking-stop').disabled=!active;
  $('tracking-pause').textContent=paused?'\u25b6 Hervat':'\u275a\u275a Pauze';
  $('track-distance').textContent=num(session?.distanceKm||0,2);
  $('track-speed').textContent=active&&!paused&&Number.isFinite(session?.speedNow)?num(session.speedNow,1):'--';
  $('track-max').textContent=Number.isFinite(session?.speedMax)&&session.speedMax>0?num(session.speedMax,1):'--';
  const elapsed=(session?.elapsedMs||0)+(!paused&&trackStartedAt?now()-trackStartedAt:0);
  $('track-elapsed').textContent=pad(Math.floor(elapsed/3600000))+':'+pad(Math.floor(elapsed/60000)%60);
  $('track-gpx').checked=!!session?.saveRoute;
  $('track-gpx').disabled=active&&!paused;
 }
 function trackingMessage(m){$('tracking-status').textContent=m;}
 function persistActive(){store.activeSession=session;persist();lastTrackPersist=now();}
 function clearTrackWatch(){
  if(trackWatch!==null&&navigator.geolocation){navigator.geolocation.clearWatch(trackWatch);trackWatch=null;}
  if(trackTicker!==null){clearInterval(trackTicker);trackTicker=null;}
 }
 function trackPause(reason){
  if(!session||session.paused)return;
  recordElapsed();session.paused=true;session.pauseReason=reason;
  clearTrackWatch();lastTrackPoint=null;stationaryFrom=null;
  persistActive();trackingMessage(reason);updateTrackUI();
 }
 function adaptiveAccuracy(level){
  if(!session||session.paused||!navigator.geolocation)return;
  if(trackAccuracy===level&&trackWatch!==null)return;
  if(trackWatch!==null){navigator.geolocation.clearWatch(trackWatch);trackWatch=null;}
  trackAccuracy=level;
  const high=level==='high'&&store.preferences.power!=='eco';
  trackWatch=navigator.geolocation.watchPosition(onTrackPosition,err=>{
    trackingMessage('GPS-probleem: '+(err?.message||'geen positie')+'. Controleer locatietoestemming.');
    if(err?.code===1)trackPause('GPS-toestemming geweigerd: tracking gepauzeerd.');
  },{enableHighAccuracy:high,maximumAge:high?5000:25000,timeout:20000});
 }
 function onTrackPosition(p){
  if(!session||session.paused||document.hidden)return;
  if(!allowedToTrack(p.timestamp)){trackPause('Registratie gepauzeerd buiten 08:00-17:00 (Oostenrijkse tijd).');return;}
  if(!p.coords||!Number.isFinite(p.coords.latitude)||!Number.isFinite(p.coords.longitude))return;
  if(!Number.isFinite(p.coords.accuracy)||p.coords.accuracy>45){trackingMessage('GPS nu onvoldoende nauwkeurig (> 45 m). Afstand niet meegeteld.');return;}
  latestPos=p;window.SKIApi?.acceptPosition(p);
  const point={lat:p.coords.latitude,lng:p.coords.longitude,time:p.timestamp,accuracy:p.coords.accuracy};
  let speed=Number.isFinite(p.coords.speed)&&p.coords.speed>=0?p.coords.speed*3.6:null;
  if(lastTrackPoint){
    const dt=(point.time-lastTrackPoint.time)/1000,dist=kmGeo(lastTrackPoint,point),computed=dt>0?dist/dt*3600:null;
    if(speed===null&&dt>=2&&dt<=50)speed=computed;
    if(dt>=2&&dt<=65&&computed<=90&&dist>0.004&&point.accuracy<=35&&lastTrackPoint.accuracy<=35){
      session.distanceKm+=dist;
    }
    if(dt>0&&dist<0.012){
      stationaryFrom??=point.time;
    }else if(dist>=0.012){stationaryFrom=null;lunchHintSent=false;}
    if(stationaryFrom&&point.time-stationaryFrom>20000){
      const idleFor=point.time-stationaryFrom;
      if(idleFor>120000&&store.preferences.power!=='full'&&trackAccuracy==='high'){
        adaptiveAccuracy('low');
      }
      if(idleFor>20*60000&&!lunchHintSent&&skiHour(point.time)>=11&&skiHour(point.time)<=14){
        lunchHintSent=true;$('lunch-detect').hidden=false;$('lunch-detect').textContent='Mogelijke lunchpauze: langdurig stilgestaan rond lunchtijd. Controleer zelf het restaurant in je dagnotities.';
      }
      if(store.preferences.hints&&idleFor>120000&&point.time-lastHintAt>90*60000&&checkMap){
        lastHintAt=point.time;showToast('Je staat stil. Eventueel kun je nu een GPS-ijkpunt opslaan.');
      }
    }
  }
  if(speed!==null&&Number.isFinite(speed)&&speed>=0&&speed<=90){
    session.speedNow=speed;session.speedMax=Math.max(session.speedMax||0,speed);
    const hour=dateISO(point.time)+' '+pad(skiHour(point.time));
    session.hourly[hour]=Math.max(session.hourly[hour]||0,speed);
    if(trackAccuracy==='low'&&speed>7&&store.preferences.power!=='eco')adaptiveAccuracy('high');
  }
  if(session.saveRoute&&(!session.points.length||point.time-session.points.at(-1).time>=15000)){
    session.points.push(point);if(session.points.length>1200)session.points.shift();
  }
  lastTrackPoint=point;
  if(now()-lastTrackPersist>30000)persistActive();
  updateTrackUI();
 }
 function startTracking(){
  if(document.hidden){trackingMessage('Open de app om GPS-tracking te starten.');return;}
  if(!navigator.geolocation||!window.isSecureContext){trackingMessage('Tracking vereist een HTTPS-adres en locatietoestemming.');return;}
  if(!allowedToTrack()){trackingMessage('Opname is ingesteld voor 08:00-17:00 in Oostenrijk. Test buiten die tijden met een GPS-ijkpunt.');return;}
  if(!session){session={id:'run-'+now(),date:dateISO(),startAt:now(),elapsedMs:0,distanceKm:0,speedNow:null,speedMax:0,hourly:{},points:[],saveRoute:$('track-gpx').checked,paused:false,notes:'',possibleLunch:false};}
  else{session.paused=false;session.pauseReason='';}
  window.SKIApi?.stopMapGps();trackStartedAt=now();lastTrackPoint=null;stationaryFrom=null;lunchHintSent=false;
  trackAccuracy='off';adaptiveAccuracy(store.preferences.power==='eco'?'low':'high');
  if(trackTicker)clearInterval(trackTicker);
  trackTicker=setInterval(()=>{
    if(!session||session.paused)return;
    if(!allowedToTrack()){trackPause('Na 17:00 stoppen we de GPS-registratie.');return;}
    const end=engine.clock($('return-time').value),t=engine.clock(localTime());
    if(end!==null&&t!==null&&t>=end-90&&lastReturnHintDay!==dateISO()){lastReturnHintDay=dateISO();showToast('Terugweg controleren: je streeft naar '+engine.hhmm(end-30)+' bij '+$('finish').value+'.');}
    updateTrackUI();if(now()-lastTrackPersist>60000)persistActive();
  },15000);
  persistActive();trackingMessage('Tracking gestart. Alleen voorgrond, GPS en afstand zijn schattingen.');updateTrackUI();
 }
 function saveDay(){
  if(!session)return;
  recordElapsed();clearTrackWatch();
  session.paused=true;session.endAt=now();delete session.speedNow;delete session.pauseReason;
  store.days.unshift(session);store.days=store.days.slice(0,80);session=null;
  store.activeSession=null;lastTrackPoint=null;trackStartedAt=null;stationaryFrom=null;
  persist();updateTrackUI();renderDays();trackingMessage('Sessie lokaal bewaard. De GPS staat uit.');
 }
 $('tracking-start').addEventListener('click',startTracking);
 $('tracking-pause').addEventListener('click',()=>{if(!session)return;if(session.paused)startTracking();else trackPause('Tracking handmatig gepauzeerd.');});
 $('tracking-stop').addEventListener('click',saveDay);
 $('track-gpx').addEventListener('change',()=>{if(session&&session.paused){session.saveRoute=$('track-gpx').checked;persistActive();}});
 function renderDays(){
  $('day-count').textContent=store.days.length+' dagen';
  $('saved-days').innerHTML=store.days.slice(0,40).map(d=>`<div class="compact-item"><strong>${formatDate(d.startAt)} | ${num(d.distanceKm,2)} km GPS</strong><small>Top ${num(d.speedMax,1)} km/u | ${Math.round((d.elapsedMs||0)/60000)} min | ${d.saveRoute&&d.points?.length?'GPX-punten bewaard':'Geen GPS-spoor bewaard'}</small><div class="toolbar"><button class="btn secondary" data-day-gpx="${escape(d.id)}" ${d.points?.length?'':'disabled'}>GPX</button><button class="btn clear" data-day-delete="${escape(d.id)}">Wissen</button></div></div>`).join('')||'<p class="hint">Nog geen skidagen opgeslagen.</p>';
 }
 function dayGPX(day){const points=(day.points||[]).map(p=>`<trkpt lat="${p.lat.toFixed(7)}" lon="${p.lng.toFixed(7)}"><time>${new Date(p.time).toISOString()}</time></trkpt>`).join('');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="SKI-je" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>SKI-je '+escape(day.date)+'</name><trkseg>'+points+'</trkseg></trk></gpx>';
 }
 $('saved-days').addEventListener('click',e=>{
  const g=e.target.closest('[data-day-gpx]'),d=e.target.closest('[data-day-delete]');
  if(g){const day=store.days.find(x=>x.id===g.dataset.dayGpx);if(day)exportFile('SKI-je-spoor-'+day.date+'.gpx',dayGPX(day),'application/gpx+xml');}
  if(d&&confirm('Deze skidag verwijderen?')){store.days=store.days.filter(x=>x.id!==d.dataset.dayDelete);persist();renderDays();}
 });
 $('export-days').addEventListener('click',()=>downloadJSON('SKI-je-skidagen-'+dateISO()+'.json',{days:store.days,exportedAt:new Date().toISOString(),note:'GPS-afstand kan liften omvatten; meetfouten mogelijk'}));
 $('print-days').addEventListener('click',()=>{window.SKIApi?.goPage('day');window.print();});
 if(session){trackingMessage('Vorige registratie teruggevonden en gepauzeerd. Tik op Hervat om GPS weer aan te zetten.');}else trackingMessage('Tracking uit. Start bewust tussen 08:00 en 17:00.');
 updateTrackUI();renderDays();
 // Never keep foreground tracking alive when the app is hidden or closed.
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){trackPause('Tracking automatisch gepauzeerd: app op achtergrond. Hervat als je terug bent.');}
 });
 window.addEventListener('pagehide',()=>{if(session&&!session.paused){recordElapsed();session.paused=true;store.activeSession=session;persist();}clearTrackWatch();});
 // Map follows tracking positions without opening a second GPS watcher.
 $('follow-location').addEventListener('click',e=>{
  if(session&&!session.paused){e.preventDefault();e.stopImmediatePropagation();showToast('Tracking gebruikt de GPS al. Er wordt geen tweede GPS-volger gestart.');}
 },true);
 // Mountain-vs-valley model comparison, loaded only after explicit tap.
 const AREAS={
  salve:[{name:'Hohe Salve (berg)',lat:47.46508,lng:12.20384,elevation:1829},{name:'S\u00f6ll (dal, benadering)',lat:47.503,lng:12.192,elevation:700}],
  hartkaiser:[{name:'Hartkaiser (berg)',lat:47.49194,lng:12.27167,elevation:1555},{name:'Ellmau (dal, benadering)',lat:47.514,lng:12.301,elevation:820}]
 };
 const compareCache=new Map(Object.entries(store.windComparison||{}).filter(([,entry])=>entry&&now()-entry.at<7*86400000));
 function compareHTML(items,note){
  $('wind-comparison').innerHTML=items.map(i=>{
   const high=Number(i.gust)>=60;
   return `<div class="compare-panel ${high?'warningwind':''}"><b>${escape(i.name)}</b><strong>${num(i.wind)} km/u</strong><small>Wind uit ${escape(i.direction)} | windstoten ${num(i.gust)} km/u</small><small>Temperatuur ${num(i.temp,1)} &deg;C | sneeuw ${num(i.snow,1)} cm</small></div>`;
  }).join('')+`<p class="hint">${escape(note)} | Open-Meteo modelverwachting, geen metingen ter plaatse of bevestigde liftstatus.</p>`;
 }
 $('compare-wind').addEventListener('click',async()=>{
  const key=$('compare-area').value,items=AREAS[key],cached=compareCache.get(key);
  if(cached&&now()-cached.at<30*60000){compareHTML(cached.items,'Bewaard (maximaal 30 minuten oud)');return;}
  if(!navigator.onLine){if(cached)compareHTML(cached.items,'Offline; ouder bewaard model');else $('wind-comparison').textContent='Offline, geen berg- en dalvoorspelling opgeslagen.';return;}
  $('compare-wind').disabled=true;$('wind-comparison').textContent='Berg- en dalverwachting ophalen...';
  try{
   const q=new URLSearchParams({latitude:items.map(i=>i.lat).join(','),longitude:items.map(i=>i.lng).join(','),elevation:items.map(i=>i.elevation).join(','),timezone:'Europe/Vienna',forecast_days:'1',current:'temperature_2m,snowfall,wind_speed_10m,wind_gusts_10m,wind_direction_10m'});
   const resp=await fetch('https://api.open-meteo.com/v1/forecast?'+q,{cache:'no-store'});if(!resp.ok)throw new Error('HTTP '+resp.status);
   const data=await resp.json(),arr=Array.isArray(data)?data:[data];if(arr.length!==items.length)throw new Error('onverwacht aantal locaties');
   const output=items.map((item,index)=>{const c=arr[index].current||{},dirs=['N','NO','O','ZO','Z','ZW','W','NW'];return {name:item.name,temp:c.temperature_2m,wind:c.wind_speed_10m,gust:c.wind_gusts_10m,snow:c.snowfall,direction:dirs[Math.round((Number(c.wind_direction_10m)||0)/45)%8]};});
   compareCache.set(key,{at:now(),items:output});store.windComparison=Object.fromEntries(compareCache);persist();compareHTML(output,'Actueel model opgehaald om '+localTime());
  }catch(e){$('wind-comparison').textContent='Vergelijking niet beschikbaar: '+(e.message||'netwerkfout');}
  finally{$('compare-wind').disabled=false;}
 });
 // Lift recognition photos: locally compressed and stripped of embedded EXIF metadata.
 const PHOTO_MAX=7000000;
 function renderPhotos(){
   const photoNames=new Map([...$('photo-code').options].map(o=>[o.value,o.textContent]));
   $('photo-list').innerHTML=Object.entries(store.photos).map(([code,img])=>{
     if(!/^data:image\/(?:jpeg|webp|png);base64,/.test(img))return '';
     return `<div class="compact-item photo-item"><img alt="Eigen liftfoto" class="lift-thumb" loading="lazy" src="${escape(img)}"><div><strong>${escape(photoNames.get(code)||code)}</strong><small>Alleen op dit apparaat</small><button class="btn clear" type="button" data-photo-del="${escape(code)}">Verwijder foto</button></div></div>`;
   }).join('')||'<p class="hint">Nog geen liftfoto opgeslagen.</p>';
 }
 $('photo-save').addEventListener('click',async()=>{
   const file=$('photo-file').files?.[0],code=$('photo-code').value;
   if(!file){$('photo-status').textContent='Kies eerst een foto.';return;}
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>PHOTO_MAX){$('photo-status').textContent='Gebruik JPG, PNG of WebP, kleiner dan 7 MB.';return;}
   $('photo-save').disabled=true;
   try{
     const url=URL.createObjectURL(file);const img=new Image();
     try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Afbeelding niet leesbaar'));img.src=url;});}
     finally{URL.revokeObjectURL(url);}
     const ratio=Math.min(1,520/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');
     canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
     const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Canvas niet beschikbaar');
     ctx.drawImage(img,0,0,canvas.width,canvas.height);
     let data=canvas.toDataURL('image/webp',.62);
     if(!data.startsWith('data:image/webp'))data=canvas.toDataURL('image/jpeg',.58);
     if(data.length>120000)throw new Error('Foto blijft te groot. Kies een kleinere afbeelding.');
     const old=store.photos[code];store.photos[code]=data;
     if(JSON.stringify(store).length>3400000){store.photos[code]=old;throw new Error("Lokale opslag bijna vol. Verwijder oude foto's.");}
     persist();if(saveFailure)throw new Error('Browseropslag is niet beschikbaar');
     $('photo-status').textContent='Liftfoto verkleind en lokaal opgeslagen. Eventuele GPS-EXIF is verwijderd.';
     $('photo-file').value='';renderPhotos();
   }catch(e){$('photo-status').textContent='Foto niet opgeslagen: '+e.message;}
   finally{$('photo-save').disabled=false;}
 });
 $('photo-list').addEventListener('click',e=>{const b=e.target.closest('[data-photo-del]');if(!b||!confirm('Deze liftfoto verwijderen?'))return;delete store.photos[b.dataset.photoDel];persist();renderPhotos();});
 renderPhotos();
 // A group invitation is deliberately a shareable MEETING, not fake live tracking.
 $('group-name').value=store.group?.name||'';$('meet-name').value=store.group?.place||'';$('meet-time').value=store.group?.time||'12:30';
 for(const id of ['group-name','meet-name','meet-time'])$(id).addEventListener('change',()=>{store.group={name:$('group-name').value.trim().slice(0,60),place:$('meet-name').value.trim().slice(0,90),time:$('meet-time').value};persist();});
 $('group-share').addEventListener('click',()=>{
  const name=$('group-name').value.trim(),place=$('meet-name').value.trim(),time=$('meet-time').value;
  if(!place){$('group-status').textContent='Vul eerst een ontmoetingsplek in.';return;}
  store.group={name,place,time};persist();
  const message='SKI-je groepsafspraak'+(name?' - '+name:'')+'\nWaar: '+place+'\nWanneer: '+time+'\nGeen realtime locatiedeling; spreek herkenbare punten af.';
  $('group-status').textContent='Afspraak bewaard op dit toestel; je kunt deze delen via je telefoon.';
  shareText('SKI-je skigroep',message);
 });
 // Field correction diary, with optional GPS only when user opts in.
 function renderIssues(){
  $('issue-list').innerHTML=store.issues.slice(0,15).map(i=>`<div class="compact-item"><strong>${escape(i.type)}</strong><small>${formatDate(i.at)} | ${escape(i.text)}${i.location?' | GPS bijgevoegd':''}</small></div>`).join('')||'<p class="hint">Nog geen correcties opgeslagen.</p>';
 }
 $('issue-add').addEventListener('click',()=>{
  const msg=$('issue-text').value.trim();if(msg.length<3){showToast('Beschrijf eerst welke afwijking je hebt gezien.');return;}
  const i={id:'issue-'+now(),type:$('issue-type').value,text:msg.slice(0,500),at:now()};
  if($('issue-gps').checked&&latestPos?.coords){i.location={lat:latestPos.coords.latitude,lng:latestPos.coords.longitude,accuracy:latestPos.coords.accuracy,at:latestPos.timestamp};}
  store.issues.unshift(i);store.issues=store.issues.slice(0,400);persist();$('issue-text').value='';renderIssues();showToast('Correctie offline opgeslagen.');
 });
 $('issues-export').addEventListener('click',()=>downloadJSON('SKI-je-veldcontroles-'+dateISO()+'.json',{issues:store.issues}));
 renderIssues();
 // Private exports and explicit reset. Nothing sent anywhere by default.
 $('export-all').addEventListener('click',()=>downloadJSON('SKI-je-volledige-backup-'+dateISO()+'.json',{version:1,exportedAt:new Date().toISOString(),extra:store,routePreferences:JSON.parse(localStorage.getItem('skije-preview-v1')||'null')}));
 $('clear-private').addEventListener('click',async()=>{
  if(!confirm('Alle lokale SKI-je route-instellingen, ijkpunten, skidagen, correcties en netwerkgegevens verwijderen? Maak eerst een backup.'))return;
  for(const key of [KEY,'skije-preview-v1','skije-cloudflare-room-v1']){try{localStorage.removeItem(key);}catch{}}
  if('caches' in window){for(const k of await caches.keys())if(k.startsWith('skije-shell-'))await caches.delete(k);}
  location.reload();
 });
 window.addEventListener('skije:page',e=>{
  if(e.detail.page==='day'){updateTrackUI();renderDays();showTravelReminder();}
  if(e.detail.page==='map')renderCheckMarkers();
  if(e.detail.page==='more'){showCheckpoints();networkRows();renderIssues();}
 });
 // Keep installation button hidden unless browser offers a supported prompt.
 let installPrompt=null;
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('install-app').hidden=false;});
 $('install-app').addEventListener('click',async()=>{if(!installPrompt)return;const prompt=installPrompt;installPrompt=null;$('install-app').hidden=true;
   await prompt.prompt();await prompt.userChoice;
 });
 window.addEventListener('appinstalled',()=>{$('install-app').hidden=true;$('install-help').textContent='SKI-je staat op je beginscherm.';});
 // Be transparent about what this installation does and does not do.
 window.SKIFeatures={version:'4.4.1-cf',routeAvailable:()=>store.network.some(e=>e.verified),getCounts:()=>({checkpoints:store.checkpoints.length,issues:store.issues.length,days:store.days.length,edges:store.network.length}),isTracking:()=>!!session&&!session.paused};
})();
