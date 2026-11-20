/* SKI-je local JSON backup import/export in Cloudflare.
 * The JSON file is processed only in the browser. Nothing is uploaded.
 */
(()=>{
 const input=document.getElementById('backup-import-file'),button=document.getElementById('backup-import-button'),status=document.getElementById('backup-import-status');
 if(!input||!button||!status)return;
 button.addEventListener('click',async()=>{
  const file=input.files?.[0];
  if(!file){status.textContent='Kies eerst je eerder geëxporteerde SKI-je-back-up.';return;}
  if(file.size>3*1024*1024){status.textContent='Bestand is te groot (maximaal 3 MB).';return;}
  try{
   const data=JSON.parse(await file.text());
   if(data?.version!==1||!data.extra||typeof data.extra!=='object'||!Array.isArray(data.extra.checkpoints)||!Array.isArray(data.extra.days)||!Array.isArray(data.extra.network)||!Array.isArray(data.extra.issues))throw Error('Geen volledige SKI-je v4-back-up.');
   if(data.extra.checkpoints.length>1000||data.extra.days.length>100||data.extra.network.length>2000||data.extra.issues.length>500)throw Error('Back-up bevat te veel gegevens.');
   if(!confirm('Deze back-up terugzetten? Bestaande lokale routegegevens en skidagen worden overschreven. Je Cloudflare-groep blijft behouden.'))return;
   const allowed=['checkpoints','issues','days','network','nodes','group','preferences','photos','activeSession','windComparison'];
   const clean={};for(const key of allowed)if(Object.hasOwn(data.extra,key))clean[key]=data.extra[key];
   localStorage.setItem('skije-extended-2026-v1',JSON.stringify(clean));
   if(data.routePreferences&&typeof data.routePreferences==='object'&&!Array.isArray(data.routePreferences))localStorage.setItem('skije-preview-v1',JSON.stringify(data.routePreferences));
   status.textContent='Back-up hersteld. SKI-je wordt opnieuw geopend.';
   window.location.reload();
  }catch(e){status.textContent='Import mislukt: '+(e?.message||'controleer het JSON-bestand');}
 });
})();
