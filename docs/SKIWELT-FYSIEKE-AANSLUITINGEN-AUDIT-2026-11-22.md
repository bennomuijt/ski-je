# SkiWelt audit: piste- en liftstationovergangen (22 november 2026)

## Bronnen en interpretatie
- Officiële 2026/27 SkiWelt-Tour: https://www.skiwelt.at/media/gruppen-info-busfolder/Infofolder-fuer-Reisebueros.pdf
- SkiWelt interactieve pistekaart: https://skimap.skiwelt.at/
- Officiële pistecatalogus: https://www.skiwelt.at/nl/pistestatus.html
- SkiWelt Going gebiedsinformatie: https://www.skiwelt.at/de/skigebiet/skigebiet-going.html
- Lokale 2D geometrie: `public/skiwelt-network-graph.json` (OpenSkiData/OSM, 90 m DEM)

**Technische graafbereikbaarheid is geen bewijs van een feitelijke berijdbare doorsteek.** Alle uit bronmateriaal afgeleide stationsovergangen moeten expliciet in de route en de PDF verschijnen. Sluitingen en echte openingsuren gaan voor elke modelroute.

## Direct gecorrigeerd

| Controle | Resultaat |
| --- | --- |
| Westendorf, `111 → 117 → lift 117` | De officiële SkiWelt Tour noemt deze exacte opeenvolging. De OSM-pistes missen een aansluitknoop. Daarom één **alleen voorwaartse**, als voorlopig gemarkeerde verbinding tussen vastgepinde punten bij 12.23968,47.40151 en 12.23993,47.40141, onder voorbehoud van fysieke controle. |
| OSM-kaartafstand | Circa 22 meter, dus geen nieuwe piste van honderden meters verzinnen. |
| Tegenstrijdig 90 m hoogtemodel | De bronhoogte geeft circa +52 meter tussen deze punten. **Niet** als fysiek skibare stijging of gegarandeerde toegestane oversteek presenteren. Bronstatus blijft voorlopig; ter plaatse ijken / met nauwkeuriger DEM opnieuw controleren. |
| Bij gewijzigde geometrie | Geen automatische verbinding: de audit weigert de regel buiten coördinaat- en hoogtegrenzen. |
| Sluiting 111 of 117 | De handmatig onderzochte, voorlopige overgang wordt óók geblokkeerd. |
| Hopfgarten-piste 20a | De officiële pistecatalogus classificeert de gehele afdaling **rood (middel)**, terwijl OpenSkiData één segment als licht heeft. Correctie in router, zonder brongeometrie te overschrijven. |

De gekozen overgang is **niet** onafhankelijk op de meter bevestigd. De SkiWelt Tour verifieert de pistevolgorde, niet de twee exacte GPS-punten. De resterende DEM-tegenspraak is een open fysieke controle.

## Overige stations / ontbrekende richtingen

Analyse van 90 stationlabels met graafbereikbaarheid vanaf Hopfgarten, vóór bovenstaande patch. De lijst bevat geen claim dat alle gevallen echte onjuiste verbindingen zijn.

| Stations | Uitkomst | Actie |
| --- | --- | --- |
| Westendorf: Fleidingbahn 117, Windauberg 118, Gampenkogel 119, KiWest 120 | Kernnetwerk kon deze dalstations niet als doel bereiken, maar de officiële SkiWelt Tour noemt een doorlopende piste/liftvolgorde. | Gerichte aansluiting 111 → 117 toegevoegd, testen van route naar deze liften. Alle andere lokale overgangen blijven voorlopig totdat met bronkaart/ijkpunten bevestigd. |
| Going: Maxilift 107, Zauberteppich Astberg 108 | Bij de dalstations ontbreekt de route *vanuit* het kernnetwerk. Officiële Going-site noemt aparte oefenliften voor beginners in het dorp. | Geen kunstmatige ski-verbinding forceren; onderzoek kaarttoegang, voetgangersroute en veilige overstap. |
| Brixen: Schusterbühellift 17 | Vanuit kernnetwerk wel, terug geen route; 17 ligt op de officiële kaart als afzonderlijke lichte piste. | Officiële borden en eventuele skibus/looproute controleren; geen teruglift of skipiste verzinnen. |
| Brixen/Scheffau: Übungslift Dorf 79 | Lokale oefenpiste geïsoleerd. | Alleen lokaal parcours tonen, geen generieke doorgaande verbinding. |
| Ellmau/Going: Bärenlift 85, Kirchbichl 86 | Lokaal geïsoleerde piste-/oefenliftclusters. | Reële aansluiting, indien aanwezig, fysiek bevestigen; anders lokaal markeren. |
| Hopfgarten: Förderband Högerfeld 27a, Bodnerschmied 27b | Lokale oefenterreinen, 128–189 m van de hoofdroute met veelal terreinverschil. | Geen kunstmatige vlakke overstap; als lokale oefenzone onderscheiden. |

## Vervolg: structurele verbeteringen
1. De OSM-hoogtes per afzonderlijke lijn overnemen uit een fijnmaziger hoogtebron of ter plekke GPS-ijkpunten verzamelen. Een +52 m oversteek over 22 m *niet* als bewezen skibaar beschouwen.
2. Elke ongenummerde piste-feature handmatig kruisverwijzen naar de actuele officiële 2026/27 SkiWelt-kaart; nooit een nummer op basis van een nabije piste verzinnen.
3. De ontbrekende officieel genummerde varianten 21b, 24b, 25b en samengestelde 31a op echte geometrie mappen voordat ze worden opgenomen.
4. De 294 automatisch gekoppelde stijgende DEM-verbindingen apart classificeren als: kaartknoop, gecontroleerde loop/prikoverstap, of onbewezen kruising. De laatste niet veilig verklaren.
5. Voor elke ski-dag de officiële live piste-/liftstatus en werkelijke sluitingstijden toetsen. Alleen gevalideerde routes als bruikbaar presenteren.
6. Tijdens praktijkmetingen bij geïsoleerde stations en de Westendorf-overgang GPS-ijkpunten verzamelen met plaats, tijd, meetnauwkeurigheid en een foto van pistebord.

**Vrijgavegrens:** de applicatie mag nog geen 'alle aansluitingen 100% gecontroleerd'-claim voeren. Ook een technisch geslaagde route kan een lokaal onmogelijke overstap bevatten.
