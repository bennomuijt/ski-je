# SKI-je v4.1 - Cloudflare installeren (gratis testproject)

**Wat zit in dit pakket?**

- De volledige SKI-je v4-testinterface met origineel logo en openingsanimatie.
- Routeplanner, pistes/kaart, offline panorama, weer en wind, webcams, SOS, lokale dagtracking en GPS-ijkpunten.
- Nieuw: skigroepen met realtime optionele GPS-locatiedeling via Cloudflare Durable Objects; ontwerpmaximum **50 deelnemers per groep**.
- Nieuw: oude v4-gegevens van Netlify als lokaal JSON-bestand importeren.
- Inclusief broncode, tests en eenvoudige Windows-installatiescripts.

**Wat zit er nog NIET in?**

- Een volledig gecontroleerd routenetwerk van SkiWelt, zodat uitkomsten niet als veiligheidsnavigatie mogen worden gebruikt.
- Een native Android/iOS-achtergrondservice. Een browser kan GPS pauzeren als het scherm vergrendelt.
- Een eigen server voor weer, webcams of OpenStreetMap-tegels. Die gegevens komen van bestaande externe aanbieders en kunnen een internetverbinding vereisen.
- Een garantie op 100% uptime of op altijd €0. Gratis Cloudflare-diensten hebben limieten.

## Vanaf een Windows-pc online zetten

**Dit is een Cloudflare Worker met statische bestanden, niet alleen een Pages-ZIP-upload.**
Je hoeft niet te programmeren, maar voor een eenmalige installatie is een Windows-pc met Node.js nodig. Upload dit ZIP-bestand NIET rechtstreeks naar de drag-and-drop van Pages; dan werkt de groepsserver niet.

1. Maak een gratis account aan op https://dash.cloudflare.com/sign-up of log in.
2. Installeer de recente Node.js LTS-versie via https://nodejs.org/en/download . Start na installatie desnoods de pc of verkenner opnieuw.
3. Pak dit gehele ZIP-bestand uit op je pc (bijvoorbeeld `Downloads/SKI-je-Cloudflare-compleet`).
4. Dubbelklik op `01-INSTALLATIE-EN-INLOGGEN.cmd`. Dit installeert de Cloudflare-tool (Wrangler) en opent de browser om je Cloudflare-account te koppelen.
5. Dubbelklik op `02-PUBLICEREN-NAAR-CLOUDFLARE.cmd`. Deze controleert de broncode en publiceert de app. Schrijf de weergegeven URL op. Die ziet er ongeveer zo uit: `https://ski-je.<jouw-account>.workers.dev` (werkelijke URL volgt na publiceren).
6. Dubbelklik op `03-GROEPSCODE-INSTELLEN.cmd`. Stel een **unieke geheime beheerderscode van minimaal 16 tekens** in. Niet delen met andere skiers en nooit in ChatGPT of een ZIP plakken. Alleen de groepsbeheerder gebruikt die code.
7. Open `https://<jouw-echte-URL>/api/health`. Je moet `"ok":true`, `"groups":true` en `"createConfigured":true` zien. Dit test de backendconfiguratie, nog niet de volledige mobiele werking.
8. Open de app via de HTTPS-URL op je Android-telefoon of iPhone. Kies in de app `Groep` en maak een skigroep aan. Deel de uitnodigingslink met de anderen. De anderen vullen alleen hun naam in en kiezen zelf of zij hun GPS delen.
9. Zet de nieuwe app als PWA op je startscherm. Android Chrome: menu > Installeren / Toevoegen aan startscherm. iPhone Safari: Deel > Zet op beginscherm.
10. Is alles goed getest? Pas DAN mag de oude Netlify-deployment uiteindelijk worden uitgezet. Bewaar tot die tijd de bestaande URL.

Je hoeft op andere telefoons GEEN Cloudflare-account aan te maken.

### Latere update

Pak een nieuw SKI-je-Cloudflare-pakket uit en start `04-LATERE-UPDATE.cmd` vanuit de nieuwe map. Gebruik dezelfde Cloudflare-account en dezelfde Worker-naam `ski-je`, zodat de URL blijft bestaan. De Cloudflare-beheerderscode blijft als secret opgeslagen en staat niet in de ZIP.

### Optioneel eigen domein

Via Cloudflare-dashboard > Workers & Pages > `ski-je` > Settings/Domains & Routes kun je later een eigen domein instellen. Het gratis `workers.dev`-adres is voldoende voor de praktijktest. Koppeling van een eigen domein vereist dat je domein/DNS correct beheerd wordt.

## Bestaande Netlify-gegevens meenemen

1. Open de huidige SKI-je **v4-testversie** op Netlify op hetzelfde toestel waarop je eerder routes/ijkpunten hebt opgeslagen.
2. Open `Meer` > `Mijn data exporteren` en bewaar het JSON-bestand.
3. Open de Cloudflare-versie > `Meer` > `Back-up terugzetten` en kies het JSON-bestand.
4. Controleer je routes, ijkpunten en skidagen op het nieuwe domein.

De back-up wordt uitsluitend lokaal in je browser ingelezen: hij wordt niet naar de groepsserver geupload. Een Netlify v3-back-up heeft mogelijk een ander formaat; import is voor v4 ingericht. Upload de nieuwe Cloudflare-versie niet over Netlify zolang deze nog dienstdoet.

## Kosten en limieten

Beoogde kosten: **€0/maand**, zolang het account op Workers Free blijft en het gebruik binnen de gratis Cloudflare-limieten blijft. Statische bestanden zijn binnen Workers Static Assets onbeperkt in verzoeken. Durable Objects met SQLite en hibernatable WebSockets zijn ook beschikbaar op Workers Free, maar daar gelden dagelijkse verzoek-, duur- en opslaglimieten. Zie https://developers.cloudflare.com/durable-objects/platform/pricing/ en https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ . Bij overschrijding van de gratis limieten kunnen functies tijdelijk fouten geven (niet plotseling automatisch onbeperkt capaciteit).

Voor de skigroep verzenden we locatie ongeveer elke 30 seconden tijdens beweging en 60 seconden bij stilstand, alleen bij een zichtbare app en met een ingeschakeld locatiedeel-vinkje. De server bewaart geen GPS-geschiedenis. Posities verdwijnen na maximaal 2 minuten uit de liveweergave. De server is voorbereid voor maximaal 50 leden per groep, maar dit is geen garantie van 50 fysiek geteste telefoons.

## Veiligheid en privacy

- Deel alleen de uitnodigingslink met vertrouwde personen. Iedereen met de link kan bij de groep aansluiten.
- Alleen de beheerder kan de hele groep sluiten.
- De GPS van groepsleden wordt nooit automatisch gedeeld. Je moet de schakelaar zelf aanzetten.
- Als de app wordt verborgen of internet verdwijnt, stopt het delen. Bij terugkeer moet je zelf opnieuw delen inschakelen.
- SKI-je toont de ouderdom en nauwkeurigheid van de laatst ontvangen GPS-positie en verwijdert verouderde posities.
- De skigroep is een hulpmiddel, geen veiligheids- of noodnavigatiesysteem. Volg officiële SkiWelt-informatie.

## Testen

Open `CLOUDFLARE-TESTPLAN.md` voor een uitgebreide zes-, twintig- en vijftig-personentest en de resultaten van de reeds uitgevoerde gesimuleerde tests.

Als een opdrachtvenster een fout geeft, stuur alleen de **foutmelding zonder wachtwoorden, codes of tokens**. Het pakket bevat geen Cloudflare-accounttoegang en is nog niet op jouw Cloudflare-account geplaatst.


## Alternatief: automatisch vanuit GitHub publiceren

Wil je later geen Node.js op iedere pc gebruiken? Lees dan `GITHUB-NAAR-CLOUDFLARE.md`. Na het eenmalig koppelen van een privé-GitHub-repository aan Cloudflare Workers Builds verschijnen updates automatisch na een goedgekeurde commit. Deze gewone ChatGPT-chat kan niet zelf naar jouw Cloudflare-account publiceren.
