# SKI-je — jaarlijkse SkiWelt-seizoenscontrole

## Vast ritme en startdatum
**Ieder jaar van 1 oktober tot en met 31 maart** worden de officiële SkiWelt-gegevens gedurende het wintersportseizoen gecontroleerd. De automatische controle start op **1 oktober 2027** (Europe/Amsterdam) en wordt op de **eerste dag van iedere maand in oktober, november, december, januari, februari en maart** herhaald. De reeks stopt na maart en begint ieder jaar opnieuw op 1 oktober. Als de nieuwe kaart of liftlijst dan nog niet gepubliceerd is: de status **'Nog niet beschikbaar'** laten staan en in oktober/november opnieuw controleren totdat de wijzigingen aantoonbaar zijn verwerkt. Een bericht op 1 oktober is **geen** bewijs dat alle onderdelen al bijgewerkt of geverifieerd zijn.

## Alleen officiële SkiWelt-bronnen als eerste uitgangspunt
1. Nederlandse panoramakaart voor het nieuwe winterseizoen: https://media.skiwelt.at/nl/skiwelt-panoramakaarten.html
2. Interactieve kaart met individuele liften, pistenummers en statussen: https://skimap.skiwelt.at/
3. Officiële routes/verbindingen tussen deelgebieden: https://www.skiwelt.at/nl/verbindingen.html
4. Officiële actuele liften/pistes: https://www.skiwelt.at/nl/liftstatus-winter.html
5. Gepubliceerde wijzigingen per dalstation, middelstation en bergstation, dorpen en toegangswegen. Raadpleeg evt. het SkiWelt-downloadcentrum, maar behandel een oude 25/26-brochure niet als vervanger van de actuele 26/27-kaart.

## Verplichte controle per item
- **Seizoen en kaart:** versienummer, jaartal, publicatiedatum, oorspronkelijke bron-URL, transparant over kaartrechten; volledige kaart in app én offline caching waar toegestaan
- **Alle liften:** ID/nummer inclusief suffix, naam, type, middenstations, dal- en bergstation, openings-/sluitingstijd en actuele toestand; verwijderde/nieuwe liften afzonderlijk markeren
- **Alle pistes:** nummer inclusief suffix (zoals 2a, 99a), naam, moeilijkheid/kleur, lengte, begin- en eindknooppunt, toegestane richting; skiroutes en rodelbanen niet verwarren met reguliere pistes
- **Aansluitingen:** alleen verbinden als piste- en liftgeometrie of officiële bron de verbinding bevestigt; overstappen, hoogteverschil, bochten en toegang tot andere dorpen apart vastleggen
- **Routeberekening:** verbindingsgrafiek zonder losse eindjes of onmogelijke overstappen; veilige terugweg met 30 min marge, actuele sluitingen, lunchvenster, pauzes, wisselende routes en maximale skitijden
- **Locatie:** locaties van WC's, liften, restaurants, middenstations; GPS-ijkpunten en onzekerheidsmarge afzonderlijk opslaan en valideren
- **Overige inhoud:** restaurants (menus, seizoenopening), webcams, weerslocaties, noodnummers, download-/deel-functies, talen en mobiel/PDF
- **Elke afwijking:** opslaan als 'nieuw', 'gewijzigd', 'verwijderd', 'onbevestigd' of 'gecontroleerd'; deelgebied, bron, datum en verantwoordelijke vastleggen

## Definitie van 'gecontroleerd'
Maak **drie verschillende indicatoren**:
1. **Kaartdekking:** piste/lift staat op officiële kaart
2. **Gegevensdekking:** piste/lift zit met juiste nummer, naam en kleur in SKI-je
3. **Route-/GPS-dekking:** fysieke aansluiting en stationsposities zijn gecontroleerd (meer dan alleen namen)

Een nummer in een routebeschrijving is geen bewijs dat de *volledige* SkiWelt-pistedatabase aanwezig is. Vergelijk de volledige officiële lijst bij voorkeur automatisch per ID en soort. Let op dat officiële publieke pagina's soms afwijkende marketingaantallen tonen; verschillen afzonderlijk documenteren en niet 'wegpoetsen'.

## Publicatie-/updatebeleid
- Bij **iedere app-update** seizoensnummer, laatst gecontroleerde officiële kaart, bekende gaten in de database, gewijzigde pistes/liften, taalcontrole en GPS-/route-regressietests vermelden
- Vanaf 1 oktober oude seizoensgegevens **niet automatisch** als actuele open status presenteren
- Nooit de nieuwe winterversie als 'volledig gecontroleerd' publiceren zolang geen bron- en connectiviteitstoets gedaan is
- Bij onvolledige data: toon ⚠️ *Kaartvermelding bevestigd / verbinding niet gecontroleerd* en laat officiële pisteborden en actuele meldingen voorgaan
- Volg voorkeuren van gebruikers: geen verlies van lokale routes, groepen, GPS-ijkpunten en privacygegevens door kaartupdate
- Na implementatie: voer `npm run check` uit, plus mobiele rooktest en PDF-controle, en controleer de gepubliceerde versie via `/api/health`

## Openstaande risico's bij start van deze checklist (20 november 2026)
De app bevat een beperkte selectie gedocumenteerde **gebiedscorridors**. Dat is **nog geen complete piste/lift-graaf** voor de hele SkiWelt. Losse nummers in corridorbeschrijvingen mogen niet als volledig ingemeten verbindingen worden aangeboden. Controleer op verschillende dagen praktijkroutes inclusief middelstation Hopfgarten.

**Referenties**
- https://skimap.skiwelt.at/
- https://media.skiwelt.at/nl/skiwelt-panoramakaarten.html
- https://www.skiwelt.at/nl/verbindingen.html
