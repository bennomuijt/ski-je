# Ski-je webcams 4.5.21 — overzicht, bronnen en mobiel scherm

## Bronlijst

De officiële SkiWelt-winterwebcam-pagina toont **17 bergwebcams** en verwijst daarnaast naar **3 webcams in het dal**. Deze **20 locaties** staan op de Webcams-pagina van SKI-je, met selecteerbare deelgebieden. Bron: https://www.skiwelt.at/de/webcams-im-winter.html (gecontroleerd 24 november 2026).

**Brixen im Thale (5):** Hochbrixen, Brantlalmsee, Filzalmsee, Jochbahn/Aualm en Holzalm.

**Ellmau/Going (3):** Hartkaiserbahn, Panorama Ellmau en Astberg Going.

**Hopfgarten/Itter (2):** Gipfel Hohe Salve en Kleine Salve.

**Scheffau (2):** Brandstadl Restaurant en Jochstubn-See.

**Söll (1):** Bergstation Hochsöll.

**Westendorf (4):** Bergstation Choralpe, Talkaser, Kreuzjöchlsee en Fleiding.

**Dalwebcams (3):** Ellmau, Going en Westendorf.

### Verificatie en beperkingen

- Feratel-locaties hebben op de officiële SkiWelt-detailpagina een unieke Feratel-cam-ID. In SKI-je gebruiken ze die bestaande aanbieders-URL.
- Astberg, Fleiding en de drie dorpscamera's zijn aan de expliciete Panomax-URL's op de SkiWelt-website gekoppeld.
- Jochstubn-See en Kreuzjöchlsee worden door SkiWelt als **JPEG-momentopname** aangeboden; daarom toont SKI-je een verversbare foto, geen nep-livestream. De afbeelding kan gedateerd zijn.
- De officiële Holzalm-detailpagina heeft geen afzonderlijk geverifieerde stream-URL: SKI-je toont die officiële pagina, met een knop om hem rechtstreeks te openen. Er wordt geen webcam van een andere locatie onder de naam Holzalm ingeladen.
- Aanbieders kunnen iframe-weergave blokkeren of streams tijdelijk offline zetten. De knop **Open bij aanbieder** blijft beschikbaar. Er wordt niets als live of beschikbaar gegarandeerd.
- Externe media laden pas na een expliciete tik; niet tijdens het openen van de app of scrollen door de twintig kaarten.

## Mobiel onderste menu

De navigatie wordt als vast menu gerenderd. CSS `env(safe-area-inset-bottom)` beschermt de home-indicator op moderne iPhones. Een bestaande Android-PWA-klasse reserveert extra ruimte voor drieknops systeemnavigatie wanneer `env()` nul is. SKI-je meet nu ook de werkelijke hoogte van de eigen menubalk en voegt die toe aan de scrollruimte onder elke pagina. De webcamspeler en overige schermvullende panelen gebruiken dezelfde veilige onderruimte.

Bij een geopend telefoon-toetsenbord wordt de eigen menubalk tijdelijk verborgen als dat nodig is om de tekstinvoer niet te blokkeren.

## Teststrategie

Geautomatiseerde Chromium/Playwright-regressie in `tests/webcams-responsive-browser.mjs` simuleert zeven scherm-/safe-area-combinaties:
- Android Samsung S21 met 48px drieknopsbalk: 384 × 832
- Compact Android: 320 × 568
- Android: 360 × 740
- iPhone SE: 375 × 667
- Grotere iPhone: 393 × 852
- Android liggend: 832 × 384
- iPad staand: 768 × 1024

Controlepunten: geen horizontale overflow, laatste camera bereikbaar boven appnavigatie, tappunten niet achter systeemnavigatie, 20 camera's, filter met 7 deelgebieden, unieke Feratel-ID, echte JPEG-momentopname, officiële Holzalm-fallback en sluit-/terugknop binnen het zichtbare scherm.

**Belangrijk:** browsertests emuleren venstergrootte, user-agent en veiligheidsruimte. Ze bewijzen niet dat ieder fysiek Android- of iPhone-model of iedere externe aanbieder een stream daadwerkelijk kan afspelen. Laat tijdens de groepstest ook een fysiek iPhone- en een Android-toestel met vaste navigatietoetsen testen. Bij een problemen graag toestel, OS-versie, liggend/staand en welke knop niet bereikbaar is vastleggen.
