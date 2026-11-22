/* The app shell is installed as a unit. Only first-party app files go in it. */
const BUILD = "cb3927a097817106446cbe50";
const CORE = {"./Kaart 2026-2027.png":"sha256-Cc1ddmjmGPHX30wquvvzI9Kru2FlvIoGyTPO07FaGpg=","./app-update.js":"sha256-3djYMV1TBWUGgCqaA22akOW/Sabslig46zLZZIaC5B8=","./backup-migration.js":"sha256-Dv6eQcz9S+Ml00mnJI8IEKb4YEK3h01DiC/YDR7sG1o=","./brand-skije.svg":"sha256-kv7w2BICeGKf95GRztpFTt2Dc1lyNu0AjTLZf8ADpTg=","./day-pdf.js":"sha256-YBclpvTux3Q1edUj3Exm0hFpql5WYSZSUb2dJCjmX8U=","./day-planner.js":"sha256-IAh/70RU3/dRd9yfb8wPZrKt/zRwBq+9HqeOSE7W5Pg=","./day-ui.js":"sha256-/CbR6ViWwLpwd6UEOoXOGUULQZZq1bp43/DYkmgA1fU=","./extra.css":"sha256-6U91IlE7pplR+jlXL5Z3DL+MLwRIUDany6Imvm6lctc=","./extra.js":"sha256-YFzB7ZiHsSrGHivs9335D6thFhUXpX74Gz2P9Oc9X9Y=","./group-cloudflare.css":"sha256-fmlzrFpniBzaD9N+tLDPFEnt2GtoMJia0Xs3qaCVr18=","./group-cloudflare.js":"sha256-CkHn8I6D+jXqscK192R42dX7HwblwqI+rotoP/AaFDs=","./highlights-core.js":"sha256-M6DQFK+6Il/LuBAu9vNLjl2CsVv5LLor3fTqN/bw4D8=","./hut-catalogue.js":"sha256-Mtn4VE+7wyGImCc4OSAsOHQKpSgt4iOH/PrWA2Xsw7U=","./i18n-data.js":"sha256-J29/xWgsjkc/A4LH5JfOzn7dOMuvLqhS0z2XHEEMsck=","./i18n.css":"sha256-rJv1MrXHbxRBK38SCjh5M+RrSK3rtJaW+5B/jZ3F2do=","./i18n.js":"sha256-Y0oxuPPS6BE6A+GW236gXYIXuTKOw91XbNmEGIPKCTI=","./icons/icon-192-v43.png":"sha256-F/SylGia3mGHmdsLZdj2OHBAGu8AdM3Lb8Q9mlulraM=","./icons/icon-192.png":"sha256-yY61vsZhcJ1W13NM134bzq/2o0cZD2aMqjQhkHPSlcs=","./icons/icon-512-v43.png":"sha256-zDz7vNFQtaKDvtUWX22bnJPPHl+TQgkphqZUtQY8Op0=","./icons/icon-512.png":"sha256-e4TtCoVj8+8kA++km/zj+fDJYqLkh3SJgzSa3bxGlp0=","./icons/skije-logo-v454.svg":"sha256-FJoAJuOy2fCEyEZLYNEbCUdOZDMPOSTBcfrJrFRCTXY=","./icons/skije-logo-v455.svg":"sha256-FJoAJuOy2fCEyEZLYNEbCUdOZDMPOSTBcfrJrFRCTXY=","./index.html":"sha256-AX7u0QipzPRuF8Vfu5kHD/GyCK6pG4g/MqUMCOdZSsk=","./install.html":"sha256-z119xJo+Pu6/T4jFItRKv2MIWEK4iCJwFQSxoX154Pk=","./lift-catalogue.js":"sha256-l1/6I6JNqRa7iJ9fSPPjhSguGSudsF32AlPkqr+z/R0=","./lunch-minute.js":"sha256-t9213OdaH1+7AM387W/uIIyuxh6/YPLNMbiA0tpmpXI=","./manifest.webmanifest":"sha256-cAYNm68Wj40r2nl5Q1eSOHwiaoDMB5pTMgXvqg8Q2gA=","./pano-lifts.js":"sha256-NJhRWq0w1XCFCW3Pquk88lACS1L1jQLGAC1PuhUPWqA=","./pano-restaurants.js":"sha256-8YVj+NrbdLfTAeaWmXCN+Xkf/lh4/tDYCH3o8VwwVZM=","./panorama-tools.js":"sha256-U4G7/9L+dbJYTjMzRCCq3mfZh4Sn562mMxrPbHt0qFo=","./photo-community.js":"sha256-ylwcg/+WeG3TecwWvRDodQyZkhkW7Ff/0HnNKxB3r+4=","./return-home-ui.js":"sha256-5152pFiAYhZ6M4mCS8ip4e2+qdqzOrvOKDumJNkSesQ=","./route-detail.js":"sha256-7UT0FZlylOLVVxHxH7gOzwQke+v7QhTBKM8Pv2TnF2c=","./route-engine.js":"sha256-lXJEuKLoX4IZAC2SWZ3T84G11WV2r4VAbsWpL2BgJv4=","./share-location.js":"sha256-tX4mdlxadwRJE2D6gUg2jSHzAW2nfzhqp8IN5RwdHjg=","./ski-highlights.js":"sha256-gO+MoDjvdf/Asrr9vCoPbuQug9kpmiwaDQ6mTqESfHA=","./ski-intro-man-action-01.webp":"sha256-w9B06DTvLqXQkM7AGj0/DhK8j7ETUqwTkzixXK/jrNI=","./ski-intro-man-action-02.webp":"sha256-AYlzP/TP53lJP5+2eluPY9mThmNhExdNWSOQ8BihO3s=","./ski-intro-man-portrait-03.webp":"sha256-cP47z1qVNu44GdGudZ4d87j2GN4CMtSQsrId8hSIXl8=","./ski-intro-man-portrait-04.webp":"sha256-Ge4TIshmY6u87dSZbWAiUaITyI1v0cwFO8reAcOALqw=","./ski-intro-man-skis.webp":"sha256-yS6GGewtMvX9PfaXxSVIvi+8galzeAFBoOm+bYnjtkM=","./ski-intro-man-snowboard.webp":"sha256-KOa0D9prSMhbyXrmv8I7Cv+d+/OhPOwerTSPEKVODnA=","./ski-intro-woman-action-01.webp":"sha256-FHGWY4kflJ9iYSGDTVCCiyB0pQ+mivIBHXRpwxH4AwU=","./ski-intro-woman-action-02.webp":"sha256-m9wlmQ6COhx729Mn8wP4t/RYGkboLHBo5182mzh4i9M=","./ski-intro-woman-portrait-03.webp":"sha256-9ZTc5REPVOSZIpRrV24kwxCKLkrTYlBQ2xUcsOA7mB4=","./ski-intro-woman-portrait-04.webp":"sha256-P7CLy3Oh4Q0xLj9yoJ2SAOcP3s+QcvDQ2wW8+3l/UIg=","./ski-intro-woman-portrait-05.webp":"sha256-AOFU3abpEB/NCTyOJRKDm0G5SRLuPa6mz55bo60nLc8=","./ski-intro-woman-portrait-06.webp":"sha256-TieImvLEYh09mpVHxFv0B5t82ok/JvvjjgFBU5wf/oo=","./ski-intro-woman-skis.webp":"sha256-SWPDjP7VmlO8im9Z/u8Rw7vLYU3cYSvEcUakOdT1Zs0=","./ski-intro-woman-snowboard.webp":"sha256-7FwEHm7pLqdxfHR5AgLp+TugF23FhmM1PJuZ/Coim5g=","./ski-photo-sources.js":"sha256-dR9H9iYKo6/a2EdoZu7vbUG4sy5N0vsUZUBEwsHU0GE=","./ski-sfeer.webp":"sha256-J5HJ4STKdPJGxGe4Gk0oYcWWEmdnoy0klRxD+GlNRdI=","./skiwelt-corridors.js":"sha256-FIV2B7Vdgjv4/bMLihNbhuGUSJ+euICbvJzkX3+pE2I=","./skiwelt-fotobronnen-2026.json":"sha256-cJUFjNH8lOrMu6D8gov3lJjkMO+Su4XiuH8kqrd4ONo=","./skiwelt-geometry-view.css":"sha256-7DxVbozC5BJ5XlVHrvnIN0zMMxw48PqeB4AvPJtqZvM=","./skiwelt-geometry-view.js":"sha256-UIp3PpbFXRbF3za4SgpmEoLMaS6Cab7DBM86XkOqtTY=","./skiwelt-geometry.json":"sha256-a70RFM0IPfN0zKAPCd9BO99DHHy/5tr5/z1ktePd6AQ=","./skiwelt-graph-summary.json":"sha256-3NUQXNP8BcpTkBnlPxjyfTlkgUyKLh1DRrRB70HtuPQ=","./skiwelt-lift-connections.js":"sha256-hc8cJEQXFY1atP0b/NR7rIkRRf4OBunHFTuu4++PseA=","./skiwelt-map-router.js":"sha256-dWw2dYWdTpFgLu+4ll1kbmPHxdKte1Aeonyu0kamyYg=","./skiwelt-network-graph.json":"sha256-uXGaupSFalBdNgZicwkGsaovzDcqkrtJBzUTrOmidTM=","./skiwelt-reference-tours.js":"sha256-anSWRyvDpu2GRwTTRHYAVLl+45Rbx4SdRAJWf4WuvVw=","./skiwelt-source-summary.json":"sha256-qiyX/Uyc43ZR1Wz2zmd83pl1tl1290BQU8I/ofsOJ1E=","./skiwelt-tour-ui.js":"sha256-Xtdd4AGw1BR3LAtTJXoA2XSVQ1nBhnxdGDztXcnaw0E=","./icons/icon-192-v455.png":"","./icons/icon-512-v455.png":""};
const SHELL = 'skije-shell-' + BUILD;
const paths = new Map(Object.keys(CORE).map(path => [new URL(path, self.location.href).pathname, path]));
paths.set('/', './index.html');
paths.set('/install', './install.html');

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    try {
      await cache.addAll(Object.entries(CORE).map(([url, integrity]) =>
        new Request(new URL(url, self.location.href), { cache: 'no-store', integrity })));
    } catch (error) {
      await caches.delete(SHELL);
      throw error;
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('skije-shell-') && key !== SHELL)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIJE_GET_BUILD') event.ports[0]?.postMessage(BUILD);
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (url.pathname === '/api/skimap.jpg') {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) event.waitUntil(cache.put(request, response.clone()));
        return response;
      } catch {
        return new Response('Volledige panoramakaart tijdelijk niet bereikbaar', { status: 503 });
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/api/')) return;
  const path = paths.get(url.pathname);
  if (!path) return;
  event.respondWith((async () => {
    const cache = await caches.open(SHELL);
    // The existing query parameters select browser cache entries. The active
    // build already pins the bytes for each of these static paths.
    // Recover a missing cache entry only if the server still has these bytes.
    const response = await cache.match(path) || await fetch(
      new Request(new URL(path, self.location.href), { cache: 'no-store', integrity: CORE[path] }));
    // Cloudflare redirects /index.html to /. A navigation cannot reuse a
    // followed redirect directly because its redirect mode is "manual".
    if (request.mode === 'navigate' && response.redirected) {
      const headers = new Headers(response.headers);
      // Fetch decoded the body, so the wire encoding and length no longer apply.
      headers.delete('Content-Encoding');
      headers.delete('Content-Length');
      return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
    }
    return response;
  })());
});
