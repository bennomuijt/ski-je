/* SKI-je v4.5.4: online update; existing local user data remain untouched. */
(()=>{
 'use strict';
 const CURRENT='4.5.4-cf';
 const buttons=['app-update-now','check-update'].map(id=>document.getElementById(id)).filter(Boolean);
 const status=document.getElementById('app-update-status');
 let busy=false;
 const setState=state=>{for(const b of buttons){b.classList.remove('is-updating','is-current','is-failed');if(state)b.classList.add(state);if(b.id==='app-update-now')b.textContent=state==='is-updating'?'⏳ Controleren…':state==='is-current'?'✓ Bijgewerkt':state==='is-failed'?'⚠ Opnieuw':'↻ Update';}};
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
   setState('is-updating');
   if(!navigator.onLine){setState('is-failed');say('Offline: internetverbinding nodig om SKI-je bij te werken.');return;}
   busy=true;for(const b of buttons){b.disabled=true;b.setAttribute('aria-busy','true');}
   say('Controleren of er een nieuwe SKI-je-versie is…');
   try{
     const response=await withTimeout(fetch('/api/health?versioncheck='+Date.now(),{cache:'no-store',headers:{Accept:'application/json'}}),10000);
     if(!response.ok)throw new Error('server bereikbaar, maar versiecontrole mislukt');
     const data=await response.json();
     const live=String(data.version||'');
     if(!semver(live))throw new Error('versienummer niet gevonden');
     // The server and displayed version are both checked, avoiding a mixed old/new PWA.
     const displayed=document.querySelector('.app-version')?.textContent?.trim()||'';
     const needsRefresh=newer(live,CURRENT)||newer(live,displayed);
     let workerActivated=true;
     if('serviceWorker' in navigator){
       const reg=await navigator.serviceWorker.getRegistration();
       if(reg){
         await withTimeout(reg.update(),12000);
         if(reg.waiting){
           const waiting=reg.waiting;
           const activeChange=new Promise(resolve=>{
             if(navigator.serviceWorker.controller)navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true});
             else resolve();
           });
           waiting.postMessage({type:'SKIP_WAITING'});
           try{await withTimeout(activeChange,8000);}catch{workerActivated=false;}
         }
       }else{
         navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});
       }
     }
     if(needsRefresh){
       say('Nieuwe versie '+live+' beschikbaar. SKI-je wordt vernieuwd…');
       if(!workerActivated)say('Update is gedownload, maar de nieuwe cache is nog niet actief. Ververs zo nodig opnieuw.');
       const url=new URL(location.href);url.searchParams.set('skije-update',live);url.searchParams.set('t',String(Date.now()));
       location.replace(url.href);
     }else if(semver(live).join('.')===semver(CURRENT).join('.') && semver(displayed)?.join('.')===semver(CURRENT).join('.')){
       setState('is-current');say('Je gebruikt de nieuwste versie '+CURRENT+'. Je routes, GPS-ijkpunten en groepen blijven bewaard.');
     }else{
       setState('is-failed');say('De server meldt '+live+', maar deze pagina toont '+displayed+'. Vernieuw de pagina in Chrome.');
     }
   }catch(error){
     setState('is-failed');say('Updatecontrole niet gelukt. Controleer je internetverbinding en probeer opnieuw.');
   }finally{
     busy=false;for(const b of buttons){b.disabled=false;b.removeAttribute('aria-busy');}
   }
 }
 buttons.forEach(b=>b.addEventListener('click',refresh));
 window.SKIUpdate={version:CURRENT,check:refresh,newer};
})();
