# SKI-je - testplan Cloudflare, groepen en GPS

## Geautomatiseerde tests (uitgevoerd op de broncode, zonder live Cloudflare-account)

- De Worker kan de statische interface aanbieden en `GET /api/health` beantwoorden.
- Groepsaanmaak vereist de geheime code; een request vanaf een ander domein wordt geweigerd.
- Uitnodigingscodes en lidmaatschapstokens worden willekeurig aangemaakt; de server bewaart alleen hashes van lidmaatschapstokens.
- **20 gesimuleerde** leden openen WebSocket-verbindingen; één GPS-bericht komt bij andere leden aan.
- **50 gesimuleerde** leden ontvangen een bericht; een 51e lid wordt geweigerd.
- GPS wordt niet opgeslagen in de Durable Object-database, alleen tijdelijk aan de actieve verbinding.
- Alleen de beheerder kan de groep sluiten.
- De route-engine weigert een route wanneer gecontroleerde verbindingen ontbreken.
- De app cachet eigen basisbestanden offline, nooit groeps-API-gegevens.
- Mobiele UI op 320 px, 375 px en 832 px breed zonder horizontaal scrollen of JavaScript-paginafouten in de DOM-tests.

Let op: dit is **geen** bewijs van productiecapaciteit of fysieke GPS-nauwkeurigheid. Cloudflare-deployment en realistische duurtests zijn nog niet met jouw account gedaan.

## Na het deployen: 10 minuten basistest

[ ] Open de echte Worker-URL met HTTPS; app begint met het originele SKI-je-logo.
[ ] Check `https://<app-adres>/api/health`; `groups` en `createConfigured` zijn `true`.
[ ] Open Route, Kaart, Weer, Webcams, Dag, Meer en SOS zonder foutmelding.
[ ] Probeer een route zonder gecontroleerd netwerk: app mag GEEN verzonnen route presenteren.
[ ] Maak als beheerder groep aan met geheime code; kopieer uitnodigingslink.
[ ] Laat een tweede telefoon in een privévenster/andere browser aanmelden.
[ ] Zet GPS delen op slechts één telefoon AAN; geef locatietoestemming.
[ ] Controleer dat een andere telefoon de positie op de geografische kaart ziet, inclusief tijd en nauwkeurigheid.
[ ] Zet delen UIT; positie moet niet als actuele positie zichtbaar blijven.
[ ] Vergrendel het scherm; GPS-delen moet stoppen in plaats van onzichtbaar door te lopen.
[ ] Zet mobiele data uit; controleer dat de basisapp start nadat hij één keer geladen is; let op dat online maptegels/webcams niet offline hoeven te werken.
[ ] Test terugkeer naar wifi/4G/5G en automatische herverbinding (locatiedelen opnieuw expliciet AAN).
[ ] Test groepsbeheerder: groep sluiten, oude uitnodigingslink mag niet meer werken.

## Praktijktest (20 personen, desgewenst uitbreiden naar 50)

- Gebruik 20 echte toestellen (een combinatie van Android en iPhone).
- Gedurende minimaal zes uur groepslocaties delen, liefst met wisselende dekking.
- Meet voor elk type toestel procent batterijverbruik, schermtijd, totale mobiele data en GPS-nauwkeurigheid.
- Noteer elke 30 minuten de Cloudflare Worker/Durable Object metrics, vooral requestaantallen en fouten.
- Test splitsing van de groep over verschillende pistes/liften, offline telefoons, app herstart en toestelvergrendeling.
- Controleer dat GPS-kilometers en ijkpunten lokaal bewaard blijven zonder live groepsverbinding.
- Herhaal bij 50 *gesimuleerde* browserverbindingen om de belasting onder de gratis limieten te schatten; zet pas 50 echte deelnemers in als 20 goed zijn gegaan.
- Controleer kaart/weer/webcam dataverbruik afzonderlijk van groepslocaties.

## Acceptatiecriteria, nog te bewijzen

1. Basisschermen blijven openen bij tijdelijke uitval van de groepsserver.
2. Er wordt nooit een GPS-positie als actueel weergegeven wanneer deze ouder is dan twee minuten.
3. Geen dubbele achtergrond-GPS-volger, geen automatische locatiepublicatie.
4. De batterij loopt bij regulier gebruik niet onverwacht snel leeg; maak een vergelijking met gebruik zonder SKI-je.
5. Cloudflare-limieten blijven binnen het gratis quotum voor het beoogde gebruik.
6. Geen blokkering van onderste knoppen, ook op kleine telefoons.
7. De skirouteplanner blijft duidelijk aangeven welke piste- en liftverbindingen nog niet gecontroleerd zijn.

## Herstel als een test mislukt

- Cloudflare Worker gebruiken op een apart `workers.dev`-testadres; oude Netlify-app aanhouden.
- Download lokale back-up voordat je opslag wist of versies bijwerkt.
- Bij groepsuitval de serverfunctie herstellen of tijdelijk uitschakelen; routeplanner/SOS blijven eigen schermen.
- Wanneer de GPS-toestemming wordt geweigerd, uitleg tonen maar de app niet blokkeren.
