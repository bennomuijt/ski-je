/* SKI-je – Cloudflare skigroep: opt-in GPS, one WebSocket per open app, no location history. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const KEY='skije-cloudflare-room-v1',ROOM_RE=/^[A-Za-z0-9_-]{32}$/;
 const TTL=120000;
 const peers=new Map(),members=new Map(),pins=new Map();
 let pendingFocus=null,group=null,ws=null,sharing=false,fixTimer=null,reconnectTimer=null,ageTimer=null,reconnectCount=0,lastFix=null,lastSent=null,map=null,leaving=false,shareBusy=false;
 const status=(message,bad=false,mode='')=>{
  const el=$('cf-group-status');el.textContent=message;el.classList.toggle('cf-bad',bad);
  if(mode){const local=$(mode==='join'?'cf-join-status':'cf-create-status');if(local){local.textContent=message;local.classList.toggle('cf-bad',bad);}}
 };
 const online=()=>navigator.onLine&&document.visibilityState==='visible';
 const labelTime=t=>t?new Date(t).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):'–';
 const cleanName=s=>String(s||'').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,24);
 const invite=room=>location.origin+location.pathname+'#groep='+encodeURIComponent(room);
 const roomFrom=v=>{
  const text=String(v||'').trim();if(ROOM_RE.test(text))return text;
  try{const url=new URL(text);const code=new URLSearchParams(url.hash.slice(1)).get('groep');return ROOM_RE.test(code||'')?code:'';}catch{return ''}
 };
 function saveGroup(){try{if(group)localStorage.setItem(KEY,JSON.stringify(group));else localStorage.removeItem(KEY);}catch{status('Lokale opslag geblokkeerd. Bewaar je uitnodigingslink.',true);}}
 function loadGroup(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&ROOM_RE.test(s.room)&&s.memberId&&s.token&&s.memberName)return s;}catch{}return null;}
 function stopTimers(){clearTimeout(fixTimer);fixTimer=null;clearTimeout(reconnectTimer);reconnectTimer=null;}
 function removePins(){for(const m of pins.values())try{map?.removeLayer(m);}catch{}pins.clear();}
 function currentPeers(){return [...peers.values()].sort((a,b)=>(Number(b.at||0)-Number(a.at||0)));}
 function currentMembers(){return [...members.values()].sort((a,b)=>Number(b.online)-Number(a.online)||a.name.localeCompare(b.name,'nl'));}
 function syncMembers(list){members.clear();for(const m of list||[]){if(m?.id&&m.id!==group?.memberId)members.set(m.id,{id:m.id,name:cleanName(m.name),online:!!m.online});}}
 function focusMember(id){
  const peer=peers.get(id),pos=peer?.last;
  if(!peer?.online||!pos||Date.now()-pos.at>TTL){status('Dit groepslid deelt momenteel geen actuele GPS-locatie.',true);return;}
  window.SKIApi?.goPage('map');
  pendingFocus=id;
  const zoom=()=>{if(!map)return false;showPins();map.setView([pos.lat,pos.lng],Math.max(15,map.getZoom()));pins.get(id)?.openPopup();return true;};
  if(zoom())pendingFocus=null;
  else status('Kaart openen; de positie wordt zichtbaar zodra de kaart geladen is.');
 }
 function personColor(id){const colors=['#0b78c7','#fb7f1c','#009a84','#833fd4','#cc3657','#29763a','#9b6214','#1582a9'];let k=0;for(const c of id)k=(k*33+c.charCodeAt(0))>>>0;return colors[k%colors.length];}
 function showPins(){
  if(!map||typeof window.L==='undefined')return;
  const valid=new Set(),t=Date.now();
  for(const peer of currentPeers()){
   if(peer.id===group?.memberId||!peer.online||!peer.last||t-peer.last.at>TTL)continue;
   const pos=peer.last;if(!Number.isFinite(pos.lat)||!Number.isFinite(pos.lng))continue;
   valid.add(peer.id);
   let marker=pins.get(peer.id);
   if(!marker){marker=L.circleMarker([pos.lat,pos.lng],{radius:11,color:'#fff',weight:3,fillColor:personColor(peer.id),fillOpacity:1});marker.addTo(map);pins.set(peer.id,marker);}
   marker.setLatLng([pos.lat,pos.lng]);
   const content=document.createElement('div');const title=document.createElement('strong');title.dataset.skijeNoTranslate='';title.textContent=peer.name;content.append(title);
   const info=document.createElement('p');info.textContent=`GPS ±${pos.accuracy} m · laatste meting ${labelTime(pos.at)} (${Math.floor((t-pos.at)/1000)} sec geleden)`;content.append(info);
   marker.bindPopup(content);
   const tooltip=document.createElement('span');tooltip.dataset.skijeNoTranslate='';tooltip.textContent=peer.name;marker.bindTooltip(tooltip,{permanent:true,direction:'top',offset:[0,-10],className:'cf-map-name'});
  }
  for(const [id,m] of pins){if(!valid.has(id)){map.removeLayer(m);pins.delete(id);}}
 }
 function render(){
  const active=!!group;
  $('cf-group-active').hidden=!active;
  $('cf-group-before').hidden=active;
  if(!active){$('group-quick').textContent='👥 Groep';removePins();window.dispatchEvent(new CustomEvent('skije:group-social',{detail:{type:'inactive'}}));return;}
  $('cf-active-title').textContent=group.groupName||'SKI-je groep';
  $('cf-active-name').textContent='Je bent: '+group.memberName+(group.owner?' · beheerder':'');
  $('cf-close').hidden=!group.owner;
  $('group-quick').textContent='👥 Mijn groep';
  const list=$('cf-members');list.replaceChildren();
  const everyone=[{id:group.memberId,name:group.memberName,self:true,online:!!ws&&ws.readyState===WebSocket.OPEN},...currentMembers()];
  for(const member of everyone){
   const peer=peers.get(member.id),age=peer?.last?Date.now()-peer.last.at:null;
   const canShow=!member.self&&member.online&&age!==null&&age<TTL;
   const el=document.createElement('div');el.className='cf-member';
   const name=document.createElement('strong');name.dataset.skijeNoTranslate='';name.textContent=(member.online?'🟢 ':'⚪ ')+member.name+(member.self?' (jij)':'');
   const detail=document.createElement('small');
   const presence=member.online?'Online':'Offline';
   detail.textContent=member.self?presence+' · '+(sharing?'Locatie delen AAN':'Locatie delen UIT'):
    presence+(canShow?' · 📍 GPS '+Math.floor(age/1000)+' sec geleden · ±'+peer.last.accuracy+' m':' · Geen actuele gedeelde locatie');
   el.append(name,detail);
   if(canShow){const show=document.createElement('button');show.type='button';show.className='btn secondary small-btn cf-show-member';show.textContent='📍 Toon op kaart';show.addEventListener('click',()=>focusMember(member.id));el.append(show);}
   list.append(el);
  }
  const onlineCount=everyone.filter(p=>p.online).length;
  $('cf-group-count').textContent=`${everyone.length} leden · ${onlineCount} online`;
  showPins();
 }
 function setPeers(list){peers.clear();for(const p of list||[]){if(p&&p.id&&p.id!==group?.memberId){peers.set(p.id,{id:p.id,name:cleanName(p.name),last:p.last||null,at:p.at||0,online:true});const m=members.get(p.id);if(m)m.online=true;}}render();}
 function handleMessage(value){let data;try{data=JSON.parse(value);}catch{return;}
  if(!data||typeof data!=='object')return;
  if(data.type==='welcome'){
   reconnectCount=0;if(group){group.groupName=data.groupName||group.groupName;group.owner=!!data.owner;saveGroup();}
   syncMembers(data.members||data.peers);setPeers(data.peers);window.dispatchEvent(new CustomEvent('skije:group-social',{detail:{type:'welcome',meeting:data.meeting||null,messages:data.messages||[]}}));status('Verbonden. Groepslocaties alleen zichtbaar als iemand delen aanzet.');
   if(sharing)scheduleFix(0);
  }
  else if(data.type==='chat-message'||data.type==='meeting-updated'||data.type==='group-photo-updated'){window.dispatchEvent(new CustomEvent('skije:group-social',{detail:data}));}
  else if(data.type==='member-added'&&data.id!==group?.memberId){members.set(data.id,{id:data.id,name:cleanName(data.name),online:false});render();}
  else if(data.type==='member-removed'){members.delete(data.id);peers.delete(data.id);render();}
  else if(data.type==='group-closed'){stopSharing();endSocket();group=null;saveGroup();render();status('Deze groep is gesloten door de beheerder.');}
  else if(data.type==='joined'&&data.id!==group?.memberId){members.set(data.id,{id:data.id,name:cleanName(data.name),online:true});peers.set(data.id,{id:data.id,name:cleanName(data.name),last:null,at:0,online:true});render();}
  else if(data.type==='position'){
   if(data.id===group?.memberId)return;
   const p=peers.get(data.id)||{id:data.id,name:cleanName(data.name),last:null,at:0,online:true};
   if(!Number.isFinite(data.lat)||!Number.isFinite(data.lng)||!Number.isFinite(data.at))return;
   p.last={lat:data.lat,lng:data.lng,accuracy:Number(data.accuracy)||0,at:data.at};p.at=data.at;p.online=true;peers.set(p.id,p);
   const m=members.get(p.id);if(m)m.online=true;else members.set(p.id,{id:p.id,name:p.name,online:true});render();
  }
  else if(['stopped','left'].includes(data.type)){
   const p=peers.get(data.id);if(p){if(data.type==='left')peers.delete(data.id);else p.last=null;}
   const m=members.get(data.id);if(m&&data.type==='left')m.online=false;
   render();
  }
 }
 function connect(){
  if(!group||!online()||leaving)return;
  if(ws&&(ws.readyState===WebSocket.OPEN||ws.readyState===WebSocket.CONNECTING))return;
  if(typeof WebSocket==='undefined'){status('Je browser ondersteunt geen realtimeverbinding.',true);return;}
  const url=(location.protocol==='https:'?'wss://':'ws://')+location.host+'/api/group/socket?room='+encodeURIComponent(group.room)+'&member='+encodeURIComponent(group.memberId)+'&token='+encodeURIComponent(group.token);
  status('Verbinding met de skigroep maken…');
  try{ws=new WebSocket(url);}catch{status('Realtimeverbinding niet beschikbaar.',true);return;}
  const sock=ws;
  sock.onmessage=e=>{if(sock===ws)handleMessage(e.data);};
  sock.onerror=()=>{if(sock===ws)status('Groepsverbinding gestoord. Je route en GPS-opslag blijven lokaal werken.',true);};
  sock.onclose=()=>{
   if(sock!==ws)return;
   ws=null;peers.clear();for(const m of members.values())m.online=false;render();
   if(!group||leaving)return;
   if(!online()){status('Offline / op achtergrond. Geen locatie delen.');return;}
   const wait=Math.min(45000,2000*Math.pow(1.6,reconnectCount++));
   status('Verbinding verloren; automatische nieuwe poging over '+Math.ceil(wait/1000)+' sec…',true);
   reconnectTimer=setTimeout(connect,wait);
  };
 }
 function scheduleFix(delay){clearTimeout(fixTimer);fixTimer=null;if(!sharing||!group||!online())return;fixTimer=setTimeout(publishFix,delay);}
 function distance(a,b){const r=Math.PI/180,dy=(a.latitude-b.latitude)*r,dx=(a.longitude-b.longitude)*r;return 12742000*Math.asin(Math.min(1,Math.sqrt(Math.sin(dy/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dx/2)**2)));}
 async function publishFix(){
  if(shareBusy||!sharing||!online()||!group)return;
  if(!ws||ws.readyState!==WebSocket.OPEN){scheduleFix(15000);return;}
  shareBusy=true;
  try{
   let p=lastFix;
   const recent=p&&Date.now()-Number(p.timestamp||0)<24000&&Number(p.coords?.accuracy)<=1000;
   if(!recent){p=await new Promise((ok,bad)=>navigator.geolocation.getCurrentPosition(ok,bad,{enableHighAccuracy:false,maximumAge:20000,timeout:12000}));}
   if(!sharing||!online()||!group)return;
   const c=p.coords;if(!Number.isFinite(c.latitude)||!Number.isFinite(c.longitude)||!Number.isFinite(c.accuracy))throw Error('GPS-gegevens onvolledig');
   if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({type:'position',lat:c.latitude,lng:c.longitude,accuracy:Math.min(2000,Math.round(c.accuracy))}));}
   const moved=lastSent?distance(c,lastSent)>40:true;lastSent={latitude:c.latitude,longitude:c.longitude};
   $('cf-share-info').textContent='Laatste groepsupdate: '+labelTime(Date.now())+' · GPS ±'+Math.round(c.accuracy)+' m. '+(moved?'Volgende meting na ±30 sec.':'Stilstaan: volgende meting na ±60 sec.');
   scheduleFix(moved?30000:60000);
  }catch(e){$('cf-share-info').textContent='GPS niet beschikbaar: '+(e?.message||'controleer de locatietoestemming')+'. Nieuwe poging later.';scheduleFix(45000);}
  finally{shareBusy=false;render();}
 }
 function stopSharing(){sharing=false;clearTimeout(fixTimer);fixTimer=null;lastSent=null;$('cf-share-position').checked=false;
  if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'stop'}));
  $('cf-share-info').textContent='Uit. Je GPS-positie wordt niet naar groepsleden verzonden.';render();
 }
 function endSocket(){clearTimeout(reconnectTimer);reconnectTimer=null;if(ws){const old=ws;ws=null;try{old.close(1000,'App gepauzeerd');}catch{}}peers.clear();for(const m of members.values())m.online=false;render();}
 async function checkBackend(){
  let response;
  try{response=await fetch('/api/health?check='+Date.now(),{cache:'no-store',headers:{accept:'application/json'}});}
  catch{throw Error('De Cloudflare-server is niet bereikbaar. Controleer internet en het appadres.');}
  let data;try{data=await response.json();}catch{throw Error('Dit adres reageert niet als de SKI-je Cloudflare Worker. Controleer of je de workers.dev-versie gebruikt.');}
  if(!response.ok||data?.service!=='SKI-je Cloudflare')throw Error('SKI-je-groepsserver reageert niet correct. Controleer je Worker-publicatie.');
  if(!data.groups)throw Error('Cloudflare mist de GROUPS Durable Objects-binding. Publiceer de Worker met wrangler.jsonc.');
  if(!data.createConfigured)throw Error('Beheerderscode ontbreekt in de actieve Worker: stel het secret GROUP_CREATE_SECRET in bij Cloudflare → Workers & Pages → ski-je → Instellingen → Variabelen en geheimen (minimaal 16 tekens).');
  return data;
 }
 async function api(path,data){
  let response;try{response=await fetch('/api/group/'+path,{method:'POST',headers:{'content-type':'application/json'},cache:'no-store',body:JSON.stringify(data)});}
  catch{throw Error('Geen verbinding met Cloudflare. Controleer internet en appadres.');}
  let json;try{json=await response.json();}catch{throw Error('Geen geldig JSON-antwoord van de Worker (HTTP '+response.status+'). Controleer de Cloudflare-logs en Durable Objects.');}
  if(!response.ok||!json?.ok)throw Error(json?.error||'Cloudflare antwoordt niet.');return json;
 }
 function startSession(data,room,memberName){peers.clear();members.clear();removePins();window.dispatchEvent(new CustomEvent('skije:group-social',{detail:{type:'reset'}}));group={room,memberId:data.memberId,token:data.token,memberName,groupName:data.groupName,owner:!!data.owner};saveGroup();render();connect();}
 function openGroup(){window.SKIApi?.goPage('more');$('group-section').open=true;requestAnimationFrame(()=>$('group-section').scrollIntoView({behavior:'smooth',block:'start'}));if(group&&!ws&&online())connect();}
 $('group-quick').addEventListener('click',openGroup);
 $('cf-group-map').addEventListener('click',openGroup);
 $('cf-group-diagnose')?.addEventListener('click',async()=>{
  const button=$('cf-group-diagnose');button.disabled=true;status('Cloudflare-groepsserver en opslag controleren…',false,'create');
  try{
   const info=await checkBackend();
   const res=await fetch('/api/group/diagnose',{cache:'no-store',headers:{accept:'application/json'}});
   const check=await res.json();
   if(!res.ok||!check?.ok)throw Error(check?.error||'Cloudflare-groepsopslag reageert niet (HTTP '+res.status+').');
   status('✓ Server '+info.version+' en groepsopslag werken. De beheerderscode is ingesteld; of de ingevoerde code klopt wordt pas bij aanmaken gecontroleerd.',false,'create');
  }catch(error){status(error.message,true,'create');}finally{button.disabled=false;}
 });
 $('cf-group-create').addEventListener('click',async()=>{
  const adminCode=$('cf-admin-code').value,memberName=cleanName($('cf-display-name').value),name=$('cf-new-name').value.trim().slice(0,60);
  if(!memberName){status('Stap 1 ontbreekt: vul je eigen naam in.',true,'create');$('cf-display-name').focus();return;}
  if(!name){status('Stap 2 ontbreekt: kies zelf een groepsnaam.',true,'create');$('cf-new-name').focus();return;}
  if(!adminCode){status('Stap 3 ontbreekt: vul de code GROUP_CREATE_SECRET uit Cloudflare in.',true,'create');$('cf-admin-code').focus();return;}
  const button=$('cf-group-create');button.disabled=true;status('Groep “'+name+'” aanmaken op Cloudflare…',false,'create');
  try{
   await checkBackend();
   const data=await api('create',{adminCode,memberName,name});
   if(!data?.room||!data?.memberId||!data?.token)throw Error('De groepsserver gaf geen geldige groepsgegevens terug.');
   $('cf-admin-code').value='';startSession(data,data.room,memberName);
   status('✓ Nieuwe skigroep “'+data.groupName+'” aangemaakt. Je kunt nu de uitnodigingslink delen.',false,'create');
  }catch(e){status(e.message,true,'create');}finally{button.disabled=false;}
 });
 $('cf-group-join').addEventListener('click',async()=>{
  const room=roomFrom($('cf-room-invite').value),memberName=cleanName($('cf-join-name').value);
  if(!memberName){status('Vul eerst jouw naam in om deel te nemen.',true,'join');$('cf-join-name').focus();return;}
  if(!room){status('Plak een geldige uitnodigingslink of groepscode.',true,'join');$('cf-room-invite').focus();return;}
  const button=$('cf-group-join');button.disabled=true;status('Deelnemen aan de skigroep…',false,'join');
  try{const data=await api('join',{room,memberName});startSession(data,room,memberName);status('✓ Je bent aangemeld. GPS-delen staat standaard uit.',false,'join');}
  catch(e){status(e.message,true,'join');}finally{button.disabled=false;}
 });
 $('cf-group-invite').addEventListener('click',async()=>{
  if(!group)return;
  const link=invite(group.room),text=`SKI-je: ga mee in skigroep ${group.groupName}. Open ${link}. Deel je GPS alleen als je dat zelf wilt.`;
  try{if(navigator.share)await navigator.share({title:'SKI-je skigroep',text});else await navigator.clipboard.writeText(text);status('Uitnodigingslink gedeeld of gekopieerd.');}
  catch(e){if(e?.name==='AbortError')return;status('Delen lukte niet. Gebruik de kopieerknop.',true);}
 });
 $('cf-group-copy').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(invite(group.room));status('Uitnodigingslink gekopieerd.');}catch{status('Kopiëren niet toegestaan in deze browser.',true);}
 });
 $('cf-share-position').addEventListener('change',e=>{
  if(e.target.checked){if(!window.isSecureContext||!navigator.geolocation){e.target.checked=false;status('GPS-delen vereist HTTPS en locatietoestemming.',true);return;}
   sharing=true;lastSent=null;connect();status('GPS-delen ingeschakeld, alleen zolang de app op de voorgrond staat.');scheduleFix(0);
  }else stopSharing();
 });
 $('cf-group-leave').addEventListener('click',async()=>{
  if(!group||!confirm('Deze skigroep op dit toestel verlaten?'))return;
  leaving=true;stopSharing();stopTimers();endSocket();const old=group;group=null;saveGroup();render();
  try{await api('leave',{room:old.room,memberId:old.memberId,token:old.token});status('Groep verlaten; alle GPS-deling staat uit.');}
  catch{status('Lokaal afgemeld. De server kon nog niet worden bereikt; de groepssessie kan daar blijven bestaan.',true);}finally{leaving=false;}
 });
 $('cf-close').addEventListener('click',async()=>{
  if(!group||!group.owner||!confirm('De hele groep sluiten? De uitnodigingslink werkt daarna niet meer.'))return;
  const old=group;try{await api('close',{room:old.room,memberId:old.memberId,token:old.token});stopSharing();stopTimers();endSocket();group=null;saveGroup();render();status('De groep is definitief gesloten.');}
  catch(e){status(e.message,true);}
 });
 $('group-section').addEventListener('toggle',()=>{if($('group-section').open&&group&&online())connect();});
 window.addEventListener('skije:mapready',e=>{map=e.detail?.map;showPins();if(pendingFocus){const id=pendingFocus;pendingFocus=null;focusMember(id);}});
 window.addEventListener('skije:gpsfix',e=>{const p=e.detail?.position;if(p?.coords)lastFix=p;});
 window.addEventListener('skije:page',e=>{if(e.detail?.page==='map')showPins();});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){stopSharing();stopTimers();endSocket();status('App op de achtergrond: groeps-GPS gestopt.');}
  else if(group){connect();}
 });
 window.addEventListener('online',()=>{if(group&&online())connect();});
 window.addEventListener('offline',()=>{stopSharing();endSocket();status('Offline. Je lokale routes, SOS en ijkpunten blijven beschikbaar.');});
 window.addEventListener('pagehide',()=>{stopSharing();endSocket();});
 // Status labels only while the group is connected and the app is visible.
 // Membership ages refresh only when the group screen is visible.
 setInterval(()=>{if(group&&!document.hidden&&$('group-section').open)render();},60000);
 const found=roomFrom(location.hash?location.href:'');
 if(found){$('cf-room-invite').value=found;$('cf-group-create-panel').open=false;$('cf-group-join-panel').open=true;window.setTimeout(openGroup,700);}
 group=loadGroup();if(group){$('cf-display-name').value=group.memberName;$('cf-join-name').value=group.memberName;status('Vorige groep herkend. Open Mijn groep om opnieuw te verbinden.');}
 render();
})();
