/* Ski-highlights UI; all work is local and event-driven. No extra GPS, analytics or cloud account. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const core=window.SKIHighlightsCore;
 if(!core||!$('ski-highlights'))return;
 let overview=core.summarise([]),pickedPhoto=null;
 const fmt=n=>Number(n||0).toLocaleString('nl-NL',{minimumFractionDigits:1,maximumFractionDigits:1});
 const set=(id,value)=>{const el=$(id);if(el)el.textContent=value;};
 function render(days){
  overview=core.summarise(days);
  set('highlight-days',String(overview.days));
  set('highlight-total-km',fmt(overview.totalKm)+' km');
  set('highlight-best-day',overview.bestKm?fmt(overview.bestKm)+' km · '+overview.bestKmDate:'—');
  set('highlight-hours',fmt(overview.totalMinutes/60)+' uur');
  set('highlight-speed',overview.highestSpeed?fmt(overview.highestSpeed)+' km/u':'—');
  const badges=[
   {name:'🎿 Eerste skidag',got:overview.days>=1},
   {name:'🏔️ 3 skidagen',got:overview.days>=3},
   {name:'🌄 5 skidagen',got:overview.days>=5},
   {name:'☀️ 10 uur wintersport',got:overview.totalMinutes>=600}
  ];
  const holder=$('highlight-badges');holder.replaceChildren();
  for(const item of badges){const badge=document.createElement('span');badge.textContent=item.name+(item.got?' ✓':' · nog te ontdekken');badge.classList.toggle('earned',item.got);holder.append(badge);}
  $('highlight-empty').hidden=overview.days>0;
  $('highlight-share-image').disabled=overview.days===0;
  $('highlight-copy').disabled=overview.days===0;
 }
 document.addEventListener('skije:dayschanged',e=>render(e.detail?.days));
 render([]);
 $('my-highlights-quick')?.addEventListener('click',()=>{
  window.SKIApi?.goPage('day');
  requestAnimationFrame(()=>$('ski-highlights').scrollIntoView({block:'start',behavior:'smooth'}));
 });
 $('highlight-photo').addEventListener('change',e=>{
  const file=e.target.files?.[0];
  pickedPhoto=null;
  if(!file){set('highlight-photo-status','Geen foto geselecteerd.');return;}
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>12*1024*1024){
   e.target.value='';set('highlight-photo-status','Gebruik JPG, PNG of WebP, maximaal 12 MB.');return;
  }
  pickedPhoto=file;
  set('highlight-photo-status','Gekozen: '+file.name+' · alleen lokaal gebruikt voor je kaart.');
 });
 $('highlight-copy').addEventListener('click',async()=>{
  const content=core.shareText(overview);
  try{await navigator.clipboard.writeText(content);set('highlight-status','✓ Je persoonlijke hoogtepunten zijn gekopieerd. Plak ze in WhatsApp.');}
  catch{set('highlight-status','Kopiëren is niet toegestaan. Gebruik de deelkaart om de gegevens te delen.');}
 });
 const download=(blob,filename)=>{
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 };
 function rounded(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
 }
 async function photoInto(ctx,file,width,height){
  if(!file)return;
  let img;
  try{
   if('createImageBitmap' in window)img=await createImageBitmap(file);
   else img=await new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file),im=new Image();
    im.onload=()=>{URL.revokeObjectURL(url);resolve(im);};im.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Foto niet beschikbaar'));};im.src=url;
   });
   const iw=img.width||img.naturalWidth,ih=img.height||img.naturalHeight;
   if(!iw||!ih)return;
   const srcRatio=iw/ih,targetRatio=width/height;
   const sw=srcRatio>targetRatio?ih*targetRatio:iw,sh=srcRatio>targetRatio?ih:iw/targetRatio;
   const sx=(iw-sw)/2,sy=(ih-sh)/2;
   ctx.drawImage(img,sx,sy,sw,sh,0,0,width,height);
  } finally {img?.close?.();}
 }
 async function makeCard(){
  const w=900,h=1100,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Je browser kan geen afbeelding maken.');
  const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#0b477b');bg.addColorStop(.63,'#147da8');bg.addColorStop(1,'#97ddec');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.arc(740,160,190,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(0,490);ctx.lineTo(230,280);ctx.lineTo(405,435);ctx.lineTo(635,238);ctx.lineTo(900,480);ctx.lineTo(900,630);ctx.lineTo(0,630);ctx.closePath();ctx.fill();
  ctx.fillStyle='#fff';ctx.font='bold 80px system-ui,sans-serif';ctx.fillText('SKI-je',70,132);
  ctx.font='30px system-ui,sans-serif';ctx.fillText('MIJN WINTERSPORT-HIGHLIGHTS',74,192);
  if(pickedPhoto){
   ctx.save();rounded(ctx,70,255,760,330,26);ctx.clip();ctx.translate(70,255);
   try{await photoInto(ctx,pickedPhoto,760,330);}catch{
    ctx.fillStyle='#d2eaf3';ctx.fillRect(0,0,760,330);ctx.fillStyle='#0d4e72';ctx.font='26px system-ui';ctx.fillText('Foto niet beschikbaar',34,66);
   }
   ctx.restore();
  } else{
   ctx.fillStyle='rgba(255,255,255,.14)';rounded(ctx,70,255,760,330,26);ctx.fill();
   ctx.fillStyle='#fff';ctx.font='bold 54px system-ui';ctx.fillText('🏔️  SkiWelt',118,435);
   ctx.font='27px system-ui';ctx.fillText('Mijn mooiste momenten in de sneeuw',118,490);
  }
  const stats=[
   [String(overview.days),'Skidagen'],
   [fmt(overview.totalKm)+' km','Totale GPS-afstand*'],
   [fmt(overview.bestKm)+' km','Beste afstandsdag'],
   [fmt(overview.totalMinutes/60)+' uur','Geregistreerde tijd'],
   [fmt(overview.highestSpeed)+' km/u','Hoogste GPS-meting']
  ];
  for(let i=0;i<stats.length;i++){
   const col=i%2,row=Math.floor(i/2),x=70+col*392,y=612+row*119;
   ctx.fillStyle='rgba(255,255,255,.96)';rounded(ctx,x,y,370,103,16);ctx.fill();
   ctx.fillStyle='#07527c';ctx.font='bold 36px system-ui,sans-serif';ctx.fillText(stats[i][0],x+20,y+46,335);
   ctx.fillStyle='#566f85';ctx.font='21px system-ui,sans-serif';ctx.fillText(stats[i][1],x+20,y+79,335);
  }
  ctx.fillStyle='#fff';ctx.font='23px system-ui,sans-serif';
  ctx.fillText('*GPS-afstand kan liften omvatten; snelheid is een schatting.',70,1021);
  ctx.font='bold 24px system-ui,sans-serif';ctx.fillText('SKI-je · Geniet van de bergen!',70,1060);
  return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG kon niet worden opgeslagen.')),'image/png'));
 }
 $('highlight-share-image').addEventListener('click',async()=>{
  if(!overview.days)return;
  const button=$('highlight-share-image');button.disabled=true;
  set('highlight-status','Je kaart wordt gemaakt op je eigen telefoon, zonder upload…');
  try{
   const blob=await makeCard(),file=new File([blob],'SKI-je-mijn-highlights.png',{type:'image/png'});
   if(navigator.canShare?.({files:[file]})&&navigator.share){
    try{await navigator.share({files:[file],title:'Mijn SKI-je hoogtepunten'});set('highlight-status','Kaart gedeeld of klaar om te delen.');return;}
    catch(e){if(e?.name==='AbortError'){set('highlight-status','Delen geannuleerd.');return;}}
   }
   download(blob,'SKI-je-mijn-highlights.png');
   set('highlight-status','✓ Ski-kaart opgeslagen als afbeelding. Deel hem via WhatsApp of je galerij.');
  }catch(e){set('highlight-status','Deelkaart maken lukt niet: '+(e?.message||'onbekende fout'));}
  finally{button.disabled=false;}
 });
})();
