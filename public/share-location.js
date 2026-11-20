/* SKI-je 4.4.1: explicit, user-controlled sharing of GPS coordinates. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const modal=$('share-location-modal');
 const buttons=['share-location-hero','share-location-map','share-location-sos'].map($).filter(Boolean);
 const refresh=$('share-location-refresh'),native=$('share-location-native');
 const copy=$('share-location-copy'),whatsapp=$('share-location-whatsapp');
 const sms=$('share-location-sms'),preview=$('share-location-preview');
 const status=$('share-location-status'),closeButton=$('share-location-close');
 if(!modal||!buttons.length||!refresh||!native||!copy||!whatsapp||!sms||!preview||!status||!closeButton)return;
 let fix=null,requesting=false,returnFocus=null;
 const MAX_AGE=120000;
 const lang=()=>window.SKILanguage?.get?.()||'nl';
 const locale=()=>({nl:'nl-NL',en:'en-GB',de:'de-DE',fr:'fr-FR',es:'es-ES',zh:'zh-CN',pl:'pl-PL',da:'da-DK'})[lang()]||'nl-NL';
 const t=source=>window.SKI_I18N_DATA?.translations?.[lang()]?.[source]||source;
 const isFresh=()=>!!fix&&Date.now()-fix.at>=0&&Date.now()-fix.at<=MAX_AGE;
 function normalize(position){
  if(!position?.coords)return null;
  const latitude=Number(position.coords.latitude),longitude=Number(position.coords.longitude),accuracy=Number(position.coords.accuracy);
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude< -90||latitude>90||longitude< -180||longitude>180)return null;
  const at=Number(position.timestamp)||Date.now();
  return {latitude,longitude,accuracy:Number.isFinite(accuracy)&&accuracy>=0?accuracy:null,at};
 }
 function message(position){
  const latitude=position.latitude.toFixed(6),longitude=position.longitude.toFixed(6);
  const lines=[
   t('Mijn GPS-locatie via SKI-je'),
   t('Coördinaten')+': '+latitude+', '+longitude
  ];
  if(position.accuracy!==null)lines.push(t('Nauwkeurigheid volgens telefoon')+': ±'+Math.round(position.accuracy)+' m');
  lines.push(t('Tijd van GPS-meting')+': '+new Date(position.at).toLocaleString(locale(),{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'}));
  lines.push(t('Bekijk locatie op kaart')+': https://www.google.com/maps?q='+latitude+','+longitude);
  lines.push(t('GPS kan afwijken. Officiële aanwijzingen zijn altijd leidend.'));
  return lines.join('\n');
 }
 function render(){
  const ready=isFresh();
  native.disabled=!ready||requesting;
  copy.disabled=!ready||requesting;
  if(ready){
   const text=message(fix);
   preview.value=text;
   whatsapp.href='https://wa.me/?text='+encodeURIComponent(text);
   sms.href='sms:?body='+encodeURIComponent(text);
   whatsapp.hidden=false;sms.hidden=false;
   if(!requesting)status.textContent=fix.accuracy!==null&&fix.accuracy>100?
     t('GPS is niet nauwkeurig. Controleer je locatie voordat je deelt.'):
     t('GPS-locatie klaar om te delen.');
  }else{
   preview.value='';
   whatsapp.hidden=true;sms.hidden=true;
   whatsapp.removeAttribute('href');sms.removeAttribute('href');
   if(!requesting)status.textContent=t('Nog geen recente GPS-locatie.');
  }
 }
 function closeModal(){
  modal.hidden=true;
  const anyOpen=Array.from(document.querySelectorAll('.utility-modal')).some(el=>!el.hidden);
  if(!anyOpen)document.body.classList.remove('utility-open');
  returnFocus?.focus?.({preventScroll:true});
 }
 function requestGPS(){
  if(requesting)return;
  if(!window.isSecureContext||!navigator.geolocation){
   status.textContent=t('GPS niet beschikbaar. Controleer locatietoestemming.');
   return;
  }
  requesting=true;fix=null;render();
  refresh.disabled=true;
  status.textContent=t('GPS-locatie wordt opgevraagd…');
  navigator.geolocation.getCurrentPosition(position=>{
   requesting=false;refresh.disabled=false;
   fix=normalize(position);
   if(fix)window.dispatchEvent(new CustomEvent('skije:gpsfix',{detail:{position,source:'share'}}));
   render();
   if(!fix)status.textContent=t('GPS niet beschikbaar. Controleer locatietoestemming.');
  },()=>{
   requesting=false;refresh.disabled=false;
   render();
   status.textContent=t('GPS niet beschikbaar. Controleer locatietoestemming.');
  },{enableHighAccuracy:true,maximumAge:0,timeout:15000});
 }
 function openModal(event){
  returnFocus=event?.currentTarget||document.activeElement;
  modal.hidden=false;document.body.classList.add('utility-open');
  render();
  (isFresh()?native:refresh).focus({preventScroll:true});
  if(!isFresh())requestGPS();
 }
 function nativeShare(){
  if(!isFresh())return render();
  const text=message(fix);
  if(typeof navigator.share!=='function'){
   status.textContent=t('Deelmenu niet beschikbaar. Kies WhatsApp, sms of kopieer het bericht.');
   return;
  }
  // Must call directly from the button click: mobile browsers require user activation.
  try{
   const result=navigator.share({title:'SKI-je GPS',text});
   Promise.resolve(result).catch(error=>{
    if(error?.name==='AbortError')return;
    status.textContent=t('Deelmenu niet beschikbaar. Kies WhatsApp, sms of kopieer het bericht.');
   });
  }catch{
   status.textContent=t('Deelmenu niet beschikbaar. Kies WhatsApp, sms of kopieer het bericht.');
  }
 }
 async function copyMessage(){
  if(!isFresh())return render();
  const text=message(fix);
  try{
   await navigator.clipboard.writeText(text);
   status.textContent=t('Locatiebericht gekopieerd.');
  }catch{
   preview.focus();preview.select();
   status.textContent=t('Kopiëren niet gelukt. Selecteer de gegevens om te kopiëren.');
  }
 }
 buttons.forEach(b=>b.addEventListener('click',openModal));
 refresh.addEventListener('click',requestGPS);
 native.addEventListener('click',nativeShare);
 copy.addEventListener('click',copyMessage);
 closeButton.addEventListener('click',closeModal);
 modal.addEventListener('click',event=>{if(event.target===modal)closeModal();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden){event.stopPropagation();closeModal();}});
 window.addEventListener('skije:gpsfix',event=>{
  const fresh=normalize(event.detail?.position);
  if(!fresh)return;
  // Only use in-memory recent coordinates, never stale saved routes or group locations.
  if(fresh.at>=Date.now()-MAX_AGE){fix=fresh;if(!modal.hidden&&!requesting)render();}
 });
 document.addEventListener('skije-languagechange',()=>{if(!modal.hidden)render();});
 window.SKILocationShare={canShare:()=>isFresh()};
})();