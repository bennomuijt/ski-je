/* SKI-je v4.3: online update of the existing PWA (without deleting local user data). */
(()=>{
 'use strict';
 const CURRENT='4.4.1-cf';
 const buttons=['app-update-now','check-update'].map(id=>document.getElementById(id)).filter(Boolean);
 const status=document.getElementById('app-update-status');
 let busy=false;
 const say=(message)=>{if(status)status.textContent=message;};
 const semver=(value)=>String(value||'').match(/^\s*v?(\d+)\.(\d+)\.(\d+)/)?.slice(1).map(Number)||null;
 function newer(a,b){
   const aa=semver(a),bb=semver(b);if(!aa||!bb)return false;
   return aa.some((number,i)=>number>bb[i]&&aa.slice(0,i).every((x,j)=>x===bb[j]));
 }
 async function withTimeout(promise,ms){
   let id;try{return await Promise.race([promise,new Promise((_,reject)=>{id=setTimeout(()=>reject(new Error('timeout')),ms);})]);}finally{clearTimeout(id);}
 }
 async function refresh(){
   if(busy)return;
   if(!navigator.onLine){say('Offline: internetverbinding nodig om SKI-je bij te werken.');return;}
   busy=true;for(const b of buttons){b.disabled=true;b.setAttribute('aria-busy','true');}
   say('Controleren of er een nieuwe SKI-je-versie is…');
   try{
     const response=await withTimeout(fetch('/api/health?versioncheck='+Date.now(),{cache:'no-store',headers:{Accept:'application/json'}}),10000);
     if(!response.ok)throw new Error('server bereikbaar, maar versiecontrole mislukt');
     const data=await response.json();
     const live=String(data.version||'');
     if(!semver(live))throw new Error('versienummer niet gevonden');
     const isNewer=newer(live,CURRENT);
     if('serviceWorker' in navigator){
       // Update the SW before reloading so HTML, scripts and images receive the new cache.
       const reg=await navigator.serviceWorker.getRegistration();
       if(reg){
         await withTimeout(reg.update(),12000);
         if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
       } else {
         navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});
       }
     }
     if(isNewer){
       say('Nieuwe versie '+live+' beschikbaar. SKI-je wordt nu vernieuwd…');
       // Navigation is network-first in our SW. Avoid touching localStorage/IndexedDB.
       const url=new URL(location.href);url.searchParams.set('skije-update',live);url.searchParams.set('t',String(Date.now()));
       location.replace(url.href);
     }else if(live===CURRENT||semver(live).join('.')===semver(CURRENT).join('.')){
       say('Je gebruikt de nieuwste versie '+CURRENT+'. Je routes, GPS-ijkpunten en groepen blijven bewaard.');
     }else{
       say('Cloudflare heeft versie '+live+'; deze app toont '+CURRENT+'. Probeer later opnieuw of ververs de pagina.');
     }
   }catch(error){
     say('Updatecontrole niet gelukt. Controleer je internetverbinding en probeer opnieuw.');
   }finally{
     busy=false;for(const b of buttons){b.disabled=false;b.removeAttribute('aria-busy');}
   }
 }
 buttons.forEach(b=>b.addEventListener('click',refresh));
 window.SKIUpdate={version:CURRENT,check:refresh,newer};
})();
