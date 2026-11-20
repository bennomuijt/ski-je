/* Community photo workflow for SKI-je: explicit camera/GPS consent, small JPEG without EXIF,
   admin review, public gallery only for approved photos. No third-party media uploader. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),status=$('community-photo-status');
 if(!$('community-photo-type')||!status)return;
 const type=$('community-photo-type'),target=$('community-photo-target'),preview=$('community-photo-preview');
 const gpsStatus=$('community-photo-gps-status'),adminStatus=$('community-photo-admin-status');
 const read=id=>$(id)?.value||'',message=(el,text)=>{if(el)el.textContent=String(text);};
 const catalog={
  lift:['80 - Hartkaiserbahn','61 - Brandstadl I','62 - Brandstadl II','67 - Eiberg','42 - Hohe Salve','20 - Salvenbahn I','22 - Salvenbahn II'],
  restaurant:[]
 };
 const groupNames=window.SKIRestaurantMap?.getAnchors?.()||[];
 catalog.restaurant=[...new Set(groupNames.flatMap(g=>g.restaurants))].sort((a,b)=>a.localeCompare(b,'nl'));
 try{
  const saved=JSON.parse(localStorage.getItem('skije-extended-2026-v1')||'{}');
  for(const edge of saved.network||[]){
   if(edge?.type==='lift'&&edge.name){
    const label=(edge.code?String(edge.code).replace(/^lift:/,'')+' - ':'')+String(edge.name);
    if(label.length<85&&!catalog.lift.includes(label))catalog.lift.push(label);
   }
  }
 }catch{}
 catalog.lift.sort((a,b)=>a.localeCompare(b,'nl'));
 let jpeg=null,gps=null,approved=[],busy=false,lastLoaded=0;
 function options(){
  target.replaceChildren();
  for(const name of catalog[type.value]||[]){
   const option=document.createElement('option');option.value=name;option.textContent=name;target.append(option);
  }
  const other=document.createElement('option');other.value='__other__';other.textContent='+ Andere lift / hut invullen';target.append(other);
  showOther();
 }
 function showOther(){$('community-photo-other-wrap').hidden=target.value!=='__other__';}
 target.addEventListener('change',showOther);
 type.addEventListener('change',options);options();
 const choose=file=>{
  if(!file)return;
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>10*1024*1024){
   message(status,'Kies een JPEG-, PNG- of WebP-foto onder 10 MB.');return;
  }
  message(status,'Foto verkleinen, een ogenblik…');
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=async()=>{
   URL.revokeObjectURL(url);
   try{
    let max=850,quality=.7,out='';
    for(let i=0;i<5;i++){
     const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
     const width=Math.max(1,Math.round(img.naturalWidth*scale)),height=Math.max(1,Math.round(img.naturalHeight*scale));
     const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
     const ctx=canvas.getContext('2d');if(!ctx)throw Error('Geen canvas beschikbaar.');
     ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(img,0,0,width,height);
     out=canvas.toDataURL('image/jpeg',quality);canvas.width=1;canvas.height=1;
     if(Math.ceil((out.length-'data:image/jpeg;base64,'.length)*.75)<76000)break;
     max=Math.max(350,Math.floor(max*.78));quality=Math.max(.43,quality-.06);
    }
    if(Math.ceil((out.length-'data:image/jpeg;base64,'.length)*.75)>=78000)throw Error('Foto blijft te groot om veilig te versturen.');
    jpeg=out;preview.src=out;preview.hidden=false;
    message(status,'Foto klaar, klein gemaakt zonder EXIF. Controleer de gekozen lift of hut en meet GPS.');
   }catch(e){jpeg=null;message(status,e.message);}
  };
  img.onerror=()=>{URL.revokeObjectURL(url);message(status,'Deze foto kon niet worden geopend.');};
  img.src=url;
 };
 const camera=$('community-photo-camera-input'),gallery=$('community-photo-gallery-input');
 $('community-photo-camera').addEventListener('click',()=>camera.click());
 $('community-photo-gallery').addEventListener('click',()=>gallery.click());
 for(const input of [camera,gallery])input.addEventListener('change',()=>{choose(input.files?.[0]);input.value='';});
 $('community-photo-open')?.addEventListener('click',()=>{
  window.SKIApi?.goPage('more');
  const section=$('community-photos-section');section.open=true;
  requestAnimationFrame(()=>{section.scrollIntoView({behavior:'smooth',block:'start'});type.focus();});
 });
 $('community-photo-gps').addEventListener('click',()=>{
  if(!navigator.geolocation||!window.isSecureContext){message(gpsStatus,'GPS vereist een beveiligde verbinding (HTTPS) en locatietoestemming.');return;}
  message(gpsStatus,'GPS ophalen; sta stil op een veilige plaats.');
  navigator.geolocation.getCurrentPosition(
   pos=>{
    gps={lat:Number(pos.coords.latitude.toFixed(6)),lng:Number(pos.coords.longitude.toFixed(6)),accuracy:Math.ceil(pos.coords.accuracy)};
    const inArea=gps.lat>=47.32&&gps.lat<=47.58&&gps.lng>=11.95&&gps.lng<=12.54;
    message(gpsStatus,(inArea?'GPS in SkiWelt-gebied':'⚠ GPS buiten SkiWelt')+' · nauwkeurigheid ±'+gps.accuracy+' m. Exacte lift-/hutlocatie wordt door de beheerder gecontroleerd.');
   },
   err=>{gps=null;message(gpsStatus,'GPS niet beschikbaar: '+err.message+'. De beheerder moet de locatie handmatig beoordelen.');},
   {enableHighAccuracy:true,maximumAge:0,timeout:15000}
  );
 });
 async function post(path,data){
  const r=await fetch('/api/photos/'+path,{method:'POST',headers:{'content-type':'application/json'},cache:'no-store',body:JSON.stringify(data)});
  let v;try{v=await r.json();}catch{throw Error('Cloudflare gaf geen geldig antwoord (HTTP '+r.status+').');}
  if(!r.ok||!v.ok)throw Error(v.error||'Cloudflare-fotofunctie is niet bereikbaar.');
  return v;
 }
 function itemCard(photo,admin=false){
  const card=document.createElement('article');card.className='community-photo-item';
  const img=document.createElement('img');img.loading='lazy';img.alt='Foto van '+photo.entity;
  img.src=admin?photo.imagePreview:photo.image;card.append(img);
  const title=document.createElement('strong');title.textContent=(photo.type==='lift'?'🚡 ':'🍽️ ')+photo.entity;
  const note=document.createElement('small');
  const gpsReview=photo.gpsReview||{};
  note.textContent=(photo.caption?photo.caption+' · ':'')+(admin?gpsReview.message||'GPS onbekend':photo.gpsVerified?'Locatie gecontroleerd door beheerder':'Locatie globaal gecontroleerd');
  card.append(title,note);
  if(admin){
   const accuracy=document.createElement('small');
   accuracy.textContent=photo.gps?'GPS: '+photo.gps.lat.toFixed(5)+', '+photo.gps.lng.toFixed(5)+' ±'+photo.gps.accuracy+' m · '+(gpsReview.distanceM===null?'geen eerder ijkpunt':'afstand t.o.v. referentie: '+gpsReview.distanceM+' m'):'Geen GPS-informatie.';
   card.append(accuracy);
   const manual=document.createElement('label');manual.className='verify';
   const manualCheck=document.createElement('input');manualCheck.type='checkbox';
   manual.append(manualCheck,document.createTextNode(' Ik heb de locatie zelf gecontroleerd, ook als GPS ontbreekt of afwijkt.'));
   const verified=document.createElement('label');verified.className='verify';
   const verifiedCheck=document.createElement('input');verifiedCheck.type='checkbox';
   verifiedCheck.disabled=!photo.gps||photo.gps.accuracy>50||gpsReview.state==='outside';
   verified.append(verifiedCheck,document.createTextNode(' Maak dit GPS-punt een door mij bevestigd ijkpunt'));
   card.append(manual,verified);
   const buttons=document.createElement('div');buttons.className='toolbar';
   for(const [decision,label] of [['approve','✓ Goedkeuren'],['reject','✕ Afwijzen']]){
    const btn=document.createElement('button');btn.type='button';btn.className='btn '+(decision==='reject'?'clear':'secondary');
    btn.textContent=label;
    btn.addEventListener('click',async()=>{
     const secret=read('community-photo-admin-code');
     if(!secret){message(adminStatus,'Vul eerst de beheerderscode in.');return;}
     btn.disabled=true;
     try{
      await post('review',{adminCode:secret,id:photo.id,decision,manualOverride:manualCheck.checked,verifyLocation:verifiedCheck.checked});
      message(adminStatus,'Beslissing opgeslagen: '+photo.entity+'.');await adminLoad();await refresh(true);
     }catch(e){message(adminStatus,e.message);}finally{btn.disabled=false;}
    });
    buttons.append(btn);
   }
   card.append(buttons);
  }
  return card;
 }
 function renderPublic(){
  const area=$('community-photo-public');area.replaceChildren();
  const title=document.createElement('p');title.className='hint';title.textContent='Goedgekeurde foto’s ('+approved.length+'): alleen na beoordeling zichtbaar.';
  area.append(title);
  for(const photo of approved.slice(0,12))area.append(itemCard(photo));
 }
 async function refresh(force=false){
  if(!force&&Date.now()-lastLoaded<120000)return approved;
  try{
   const r=await fetch('/api/photos/list',{cache:'no-store'});
   const data=await r.json();if(!data.ok)throw Error(data.error||'Galerij tijdelijk niet beschikbaar.');
   approved=Array.isArray(data.photos)?data.photos:[];
   lastLoaded=Date.now();renderPublic();
   document.dispatchEvent(new Event('skije-photo-list-updated'));
  }catch(e){message(status,'Goedgekeurde foto’s niet opgehaald: '+e.message);}
  return approved;
 }
 window.SKIPublicPhotos={refresh,getFor:(kind,name)=>approved.find(p=>p.type===kind&&p.entity===name)||null,all:()=>approved.slice()};
 $('community-photo-send').addEventListener('click',async()=>{
  if(busy)return;
  if(!jpeg){message(status,'Maak of selecteer eerst een foto.');return;}
  const entity=target.value==='__other__'?read('community-photo-other').trim():target.value;
  if(!entity||entity.length<2){message(status,'Kies of vul eerst een lift of restaurant in.');return;}
  if(!$('community-photo-consent').checked){message(status,'Bevestig dat je de foto mag delen.');return;}
  busy=true;const button=$('community-photo-send');button.disabled=true;
  message(status,'Versturen naar de privéwachtrij...');
  try{
   const v=await post('submit',{type:type.value,entity,caption:read('community-photo-note'),image:jpeg,gps});
   jpeg=null;preview.hidden=true;preview.removeAttribute('src');
   $('community-photo-note').value='';$('community-photo-consent').checked=false;gps=null;
   message(gpsStatus,'GPS voor volgende foto opnieuw ophalen.');
   message(status,'✓ Foto ontvangen, nog NIET openbaar. Beheerder moet goedkeuren. '+(v.gpsReview?.message||''));
  }catch(e){message(status,e.message);}finally{busy=false;button.disabled=false;}
 });
 async function adminLoad(){
  const secret=read('community-photo-admin-code');if(!secret){message(adminStatus,'Beheerderscode ontbreekt.');return;}
  message(adminStatus,'Inzendingen ophalen...');
  try{
   const data=await post('admin-list',{adminCode:secret});
   const pending=(data.photos||[]).filter(p=>p.status==='pending');
   const area=$('community-photo-admin-list');area.replaceChildren();
   for(const photo of pending)area.append(itemCard(photo,true));
   message(adminStatus,pending.length+' foto’s wachten op goedkeuring.');
  }catch(e){message(adminStatus,e.message);}
 }
 $('community-photo-admin-load').addEventListener('click',adminLoad);
 $('community-photos-section')?.addEventListener('toggle',()=>{if($('community-photos-section').open)refresh();});
 document.getElementById('pano-open')?.addEventListener('click',()=>refresh());
})();
