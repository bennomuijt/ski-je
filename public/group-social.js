/* SKI-je group social hub: authenticated appointments and chat, separate from optional GPS sharing. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const localKey='skije-cloudflare-room-v1';
 const MAX_AGE=30*86400000;
 let meeting=null,messages=[],room=null,lastRoom='';
 const identity=()=>{
  try{
   const g=JSON.parse(localStorage.getItem(localKey)||'null');
   return g&&g.room&&g.memberId&&g.token?g:null;
  }catch{return null;}
 };
 const status=(id,text)=>{const el=$(id);if(el)el.textContent=text;};
 const time=t=>new Date(t).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});
 function clearUI(){
  meeting=null;messages=[];renderSocial();
 }
 function renderSocial(){
  const me=identity(),view=$('cf-meeting-view'),list=$('cf-chat-list');
  if(!view||!list)return;
  view.replaceChildren();list.replaceChildren();
  if(!me){
   view.textContent='Meld je aan bij een groep om afspraken te bekijken.';
   list.textContent='Meld je aan om het gesprek te openen.';
   $('cf-meeting-clear').hidden=true;
   return;
  }
  if(meeting){
   const heading=document.createElement('strong');heading.textContent='📍 '+meeting.place;
   const stamp=document.createElement('p');
   stamp.textContent=new Intl.DateTimeFormat('nl-NL',{dateStyle:'full',timeStyle:'short',timeZone:'Europe/Vienna'}).format(new Date(meeting.when))+' · door '+meeting.name+' (SkiWelt-tijd)';
   view.append(heading,stamp);
   if(meeting.note){const note=document.createElement('p');note.textContent=meeting.note;view.append(note);}
  }else view.textContent='Nog geen groepsafspraak gemaakt.';
  $('cf-meeting-clear').hidden=!meeting||meeting.by!==me.memberId&&!me.owner;
  const visible=messages.filter(m=>m&&m.id&&m.name&&Number.isFinite(m.at)&&Date.now()-m.at<MAX_AGE).slice(-100);
  if(!visible.length){const p=document.createElement('p');p.className='cf-small';p.textContent='Nog geen berichten. Begin het gesprek!';list.append(p);}
  for(const m of visible){
   const item=document.createElement('div');item.className='cf-chat-item'+(m.memberId===me.memberId?' cf-chat-own':'');
   const head=document.createElement('small');head.textContent=m.name+' · '+time(m.at);
   const text=document.createElement('div');text.className='cf-chat-text';text.textContent=m.text;
   item.append(head,text);list.append(item);
  }
  list.scrollTop=list.scrollHeight;
 }
 function addMessage(m){
  if(!m?.id||messages.some(x=>x.id===m.id))return;
  messages.push(m);if(messages.length>100)messages.splice(0,messages.length-100);
  renderSocial();
 }
 async function api(op,data={}){
  const me=identity();if(!me)throw Error('Meld je eerst aan bij een skigroep.');
  const response=await fetch('/api/group/'+op,{
   method:'POST',headers:{'content-type':'application/json'},cache:'no-store',
   body:JSON.stringify({room:me.room,memberId:me.memberId,token:me.token,...data})
  });
  const answer=await response.json().catch(()=>null);
  if(!response.ok||!answer?.ok)throw Error(answer?.error||'Groepsserver tijdelijk niet bereikbaar.');
  return answer;
 }
 window.addEventListener('skije:group-social',e=>{
  const data=e.detail||{};
  if(data.type==='reset'||data.type==='inactive'){clearUI();return;}
  if(data.type==='welcome'){meeting=data.meeting||null;messages=Array.isArray(data.messages)?data.messages.slice(-100):[];renderSocial();}
  if(data.type==='chat-message')addMessage(data.message);
  if(data.type==='meeting-updated'){meeting=data.meeting||null;renderSocial();}
 });
 $('cf-chat-form')?.addEventListener('submit',async e=>{
  e.preventDefault();const input=$('cf-chat-text'),text=input.value.trim();if(!text)return;
  const button=$('cf-chat-send');button.disabled=true;
  try{
   const out=await api('message',{text});addMessage(out.message);input.value='';
   status('cf-chat-status','Bericht verzonden.');
  }catch(error){status('cf-chat-status',error.message);}
  finally{button.disabled=false;}
 });
 $('cf-meeting-save')?.addEventListener('click',async()=>{
  const place=$('cf-meeting-place').value.trim(),note=$('cf-meeting-note').value.trim();
  const input=$('cf-meeting-when').value,when=input?new Date(input):null;
  if(!place||!when||!Number.isFinite(when.getTime())){status('cf-meeting-status','Vul een plek, datum en tijd in.');return;}
  const button=$('cf-meeting-save');button.disabled=true;
  try{
   const out=await api('meeting',{place,note,when:when.toISOString()});
   meeting=out.meeting;renderSocial();$('cf-meeting-editor').open=false;
   status('cf-meeting-status','Afspraak opgeslagen voor alle groepsleden.');
  }catch(error){status('cf-meeting-status',error.message);}
  finally{button.disabled=false;}
 });
 $('cf-meeting-clear')?.addEventListener('click',async()=>{
  if(!meeting||!confirm('De groepsafspraak voor iedereen verwijderen?'))return;
  const button=$('cf-meeting-clear');button.disabled=true;
  try{
   const out=await api('meeting',{action:'clear'});meeting=out.meeting;renderSocial();
   status('cf-meeting-status','Afspraak verwijderd.');
  }catch(error){status('cf-meeting-status',error.message);}
  finally{button.disabled=false;}
 });
 $('cf-meeting-editor')?.addEventListener('toggle',()=>{
  if(!$('cf-meeting-editor').open)return;
  $('cf-meeting-place').value=meeting?.place||'';
  $('cf-meeting-note').value=meeting?.note||'';
  const date=meeting?new Date(meeting.when):new Date(Date.now()+3600000);
  $('cf-meeting-when').value=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
 });
 $('group-section')?.addEventListener('toggle',async()=>{
  if(!$('group-section').open||!identity())return;
  try{
   const me=identity();
   if(!me||me.room!==lastRoom){lastRoom=me?.room||'';clearUI();}
   const out=await api('state');
   if(identity()?.room!==me.room)return;
   meeting=out.meeting;messages=out.messages||[];renderSocial();
  }catch(error){status('cf-chat-status','Chat synchroniseren: '+error.message);}
 });
 renderSocial();
})();