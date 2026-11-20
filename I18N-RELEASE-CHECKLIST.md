# SKI-je – vaste taalcontrole bij iedere update

## Ondersteunde talen (v4.4.0)
- Nederlands (nl) – **altijd standaard**, onafhankelijk van de telefoontaal
- Engels (en)
- Duits (de)
- Frans (fr)
- Spaans (es)
- Vereenvoudigd Chinees (zh / zh-CN)
- Pools (pl)
- Deens (da)

De gebruiker kiest één taal via het compacte vlaggetje. De selectie wordt lokaal bewaard onder `skije-ui-language-v1` en geldt voor de app en installatiepagina.

## Verplicht bij ELKE volgende release
1. Loop **alle nieuwe teksten** na in de routeplanner, kaart, weer, webcams, SOS, GPS-ijkpunten, groepen, tracking, foutmeldingen, pop-ups, deel- en installatiepagina. Voeg bij nieuwe vaste Nederlandstalige labels steeds de zeven vertalingen toe aan `public/i18n-data.js`.
2. Vertaal ook **dynamische statusberichten**, in JavaScript opgebouwde meldingen, placeholders, knoppen, aria-labels en foutteksten. Controleer tekst die eerst na een klik, GPS-meting, groepsactie of mislukte verbinding verschijnt. De bestaande woordenlijst vertaalt alleen bekende teksten; nieuwe teksten worden niet vanzelf vertaald.
3. Behoud Nederlandse fallback en de bewaarde gebruikerskeuze. Laat piste-, lift-, restaurant-, persoonsnamen, GPS-coördinaten, alarmnummers, codes en technische identifiers intact.
4. Test op kleine Android- en iPhone-schermen of Poolse/Deense woorden en Chinese tekens leesbaar blijven en geen knoppen of menu's afsnijden.
5. De officiële informatie van het skigebied moet in elke taal duidelijk voorrang houden. De **Nederlandstalige juridische voorwaarden blijven de juridische uitgangstekst**; bij een andere taal moet de gebruiker dit expliciet kunnen zien. Bied niet aan dat juridische tekst volledig juridisch vertaald is zolang dat niet afzonderlijk is gecontroleerd.
6. Versienummers `package.json`, `src/index.js`, `public/app-update.js` en gebruikersinterface consistent verhogen. De automatische PWA-cache verversen door de cache-id in `public/sw.js` te wijzigen. De icoon/favicons moeten het oorspronkelijke aangeleverde SKI-je-logo blijven.
7. Draai **`npm run check`** voordat er gepubliceerd wordt. `tests/i18n.test.js` controleert de acht keuzes, consistente woordenlijsten, sleutelteksten, Nederlandse fallback, de installatielink en het favicon.
8. Na publicatie op Cloudflare: `/api/health` versienummer controleren, de app met vers gewiste *testbrowsercache* openen en op een testtelefoon **elke taal** kort nalopen. Verwijder nooit echte gebruikersopslag of GPS-ijkpunten om de cache te controleren.

## Bestandsoverzicht
- `public/i18n-data.js`: Nederlandse bronteksten met zeven vertalingen
- `public/i18n.js`: gebruikerskeuze, lokaal onthouden en bekende teksten in de DOM vertalen
- `public/i18n.css`: compact selectiemenu met vlag
- `public/index.html` en `public/install.html`: zichtbare taalkeuzes
- `tests/i18n.test.js`: release-regressietests

Let op: dit is een eerste meertalige laag. Niet alle historisch bestaande of dynamisch gegenereerde teksten zijn al vertaald. Dat moet bij verdere uitbreiding en veldtests worden gecontroleerd, in plaats van volledige vertaling te claimen.
