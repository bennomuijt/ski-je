/* SKI-je 4.0 test PWA shell.
   Cache first-party app files only. NEVER download/cache third-party map tiles,
   radar frames, wind, webcams or GPS data in service worker. */
const SHELL='skije-shell-20261121-cloudflare-v4-5-7-ski-highlights';
const CORE=['./index.html','./i18n-data.js','./i18n.js','./i18n.css','./share-location.js','./install.html','./extra.css','./extra.js','./highlights-core.js','./ski-highlights.js','./panorama-tools.js','./route-detail.js','./return-home-ui.js','./lunch-minute.js','./group-cloudflare.css','./group-cloudflare.js','./backup-migration.js','./route-engine.js','./day-planner.js','./skiwelt-corridors.js','./day-ui.js','./day-pdf.js','./app-update.js','./pano-restaurants.js','./photo-community.js','./icons/skije-logo-v455.svg','./brand-skije.svg','./manifest.webmanifest','./icons/icon-192-v455.png','./icons/icon-512-v455.png','./Kaart 2026-2027.png','./ski-sfeer.webp'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('skije-shell-')&&k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 if(url.pathname==='/api/skimap.jpg'){
  event.respondWith(caches.open(SHELL).then(async cache=>{
   const cached=await cache.match(request);if(cached)return cached;
   try{const response=await fetch(request);if(response.ok)event.waitUntil(cache.put(request,response.clone()));return response;}
   catch{return new Response('Volledige panoramakaart tijdelijk niet bereikbaar',{status:503});}
  }));return;
 }
 if(url.pathname.startsWith('/api/'))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{
   if(response.ok){const copy=response.clone();event.waitUntil(caches.open(SHELL).then(cache=>cache.put('./index.html',copy)));}
   return response;
  }).catch(async()=>{
   const cached=await caches.open(SHELL).then(cache=>cache.match('./index.html'));
   return cached||new Response('<h1>SKI-je is offline</h1><p>Open de app eerst eenmaal via internet.</p>',{headers:{'Content-Type':'text/html;charset=utf-8'},status:503});
  }));return;
 }
 event.respondWith(caches.open(SHELL).then(async cache=>{
  const found=await cache.match(request);if(found)return found;
  const response=await fetch(request);
  if(response.ok)event.waitUntil(cache.put(request,response.clone()));
  return response;
 }));
});

self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
