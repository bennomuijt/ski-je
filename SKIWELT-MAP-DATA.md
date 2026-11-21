# SKI-je SkiWelt kaartnetwerk — data en beperkingen

## Herkomst en gebruik
- Geometrieën van liften en pistes komen uit publiek ontsloten OpenSkiData-/OpenSkiMap-/OpenStreetMap-lijngegevens via `https://liftradar.eu/ski/v1/10/{x}/{y}.json`.
- Bron-/licentievermelding: **Data from OpenSkiData / OpenSkiMap.org, © OpenStreetMap contributors (Open Database License, ODbL 1.0)**. OSM-databaseaanpassingen en gedeelde afgeleide databases zijn aan de toepasselijke ODbL-voorwaarden onderworpen. Zie `https://www.openstreetmap.org/copyright`.
- Terreinhoogtes voor de pistelengtes zijn afkomstig van Open-Meteo's elevation API op basis van Copernicus GLO-90. Resolutie circa 90 m; tussenliggende punten zijn geïnterpoleerd.
- Het gebruikte statische kaartnetwerk wordt lokaal in de PWA opgeslagen. Tijdens het plannen wordt geen telefoon-GPS gebruikt.

## Wat expliciet wordt gecontroleerd
- Een lift begint bij een fysiek stationsknooppunt, loopt in stijgende richting en eindigt op het bovenstation.
- Pistegeometrieën hebben een afdalingsrichting die uit hoogtegegevens wordt afgeleid (kan door onnauwkeurige hoogtebron afwijken).
- Elke overgang, ook een kleine piste- of stationsoverstap, bestaat als expliciete boog in de grafiek. Zonder verbinding wordt geen route geretourneerd.
- Open/gesloten status, openingstijden, actuele wachtrijen, het toestaan van een kruising, bewegwijzering, beschikbare pistes en officiële liftinstaproutes zijn **niet** door deze 2D lijngegevens bewezen.
- Intersecties op dezelfde coördinaten kunnen in werkelijkheid ongelijkvloers liggen. Hoogteverschillen worden gefilterd, maar de 90m hoogtebron is onvoldoende om alle situaties hard te verifiëren.
- Vriendelijke UI verbergt alleen kruisingen van 1–3 meter als aparte loopstap; de onderliggende bogen blijven vereist voor de continuïteitscontrole.

## Bekende open punten, 2026/27
- De volledige SkiWelt-catalogus kan meer liften bevatten dan het huidige kaartnetwerk, bijvoorbeeld Kelchsau-, Schwoich- en kleine kinder-/transportbandliften. Een ontbrekende geo-lijn wordt niet op een verzonnen plek geplaatst.
- Sommige pistes hebben alleen een naam of een samengesteld nummer in OpenStreetMap, niet één eenduidig officieel nummer. De app toont de bronwaarde, of vermeldt dat het nummer ontbreekt.
- De Going–Ellmau-dalverbinding bevat een gemarkeerde kaartovergang van circa 81 m naar de Hartkaiserbahn. De SkiWelt Tour noemt de gebiedsroute; deze specifieke loopverbinding moet nog nader worden bevestigd.
- De exacte entree van een lunchrestaurant is niet automatisch gedocumenteerd door de lift-/pistegeometrie. Kies niet automatisch een onbewezen restaurantdeur.

## Bouw- en controleproces
1. `node scripts/build-skiwelt-geometry.mjs` leest alle SkiWelt-tegels.
2. `node scripts/enrich-skiwelt-elevation.mjs` voegt hoogtes toe. **Een ontbrekend hoogtepunt mag niet resulteren in een stilzwijgend weggelaten piste.**
3. `node scripts/build-skiwelt-network.mjs` bouwt gerichte grafiekverbindingen; de builder weigert een onvolledige hoogte-import.
4. `node --test tests/geometric-map-router.test.js` test fysieke aansluitingsketens en de aanwezige korte Hochbrixenliften.
5. `node tests/panorama-layers-browser.mjs` en `node tests/browser-smoke.mjs` controleren de daadwerkelijke telefoonweergave.

Dit is kaartgebaseerde routeplanning, **niet** een door SkiWelt gecertificeerde veilige bocht-voor-bocht-routering. Gebruik officiële pisteborden en actuele status als leidend.
