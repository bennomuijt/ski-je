# Hopfgarten-routecontrole 2026/27 — SKI-je 4.5.13
Datum van broncontrole: 22 november 2026

## Gecontroleerde officiële bronnen
- SkiWelt officiële pistekaart en interactieve lijst: https://skimap.skiwelt.at/
- Nederlandstalige SkiWelt pistestatus en pisteclassificaties: https://www.skiwelt.at/nl/pistestatus.html
- Regionale volledige pistecatalogus: https://www.hohe.salve.at/de/pistenstatus-der-region.html
- Officiële Hopfgarten gebiedsinformatie: https://www.skiwelt.at/de/skigebiet/skigebiet-hopfgarten.html
- Officiële SkiWelt-tour: https://www.skiwelt.at/media/gruppen-info-busfolder/Infofolder-fuer-Reisebueros.pdf

## Geverifieerde hoofdaansluitingen op kaartniveau
| Van | Naar | Gegevenscontrole |
|---|---|---|
| Hopfgarten dalstation | Salvenbahn I (lift 20), bergstation / middenstation | Lift 20, bottom en top, apart gekarteerd. |
| Salvenbahn I middenstation | Salvenbahn II (lift 22) | Twee afzonderlijke stations, lift 20 top en lift 22 bottom, nabij elkaar. Een korte overstap blijft expliciet in de netwerkgraph, niet als fictieve piste. |
| Hohe Salve/Rigi | Middenstation | Officiële afdalingsrichting op pistes 21a/21c; OpenSkiData bevat delen 21a en 21c. |
| Middenstation | Hopfgarten dalstation | Piste **20a**, officieel een **rode** Talabfahrt van **3293 m** en **632 m** hoogteverschil. OpenSkiData-route geeft ca. 2,6 km voor het hoofdsegment, dus **geen exacte afstand**. Er wordt minimaal 20 minuten voor de afsluitende afdaling gerekend. |
| Itter/KRAFTalm | Salvistabahn (lift 30), tussenstation | Liftgeometrie bevat twee delen en tussenstation; niet verwarren met Itter-dalstation. |
| Schernthann/Foisching | Pistes 24a en 25a/25c | De officiële catalogus bevat deze pistes en de verbindende skiweg 24,25. Kaartsegmenten hebben deels wisselende OSM-refs/namen. |

## Niet wegmoffelen: afwijkingen
De officiële pistecatalogus noemt de volgende pisteonderdelen die niet als afzonderlijke, exact genummerde lijn in de huidige OSM-kaartgrafiek staan:
- **21b** — Rigi–Mittelstation (alternatief naast 21a/21c)
- **24b** — Schernthannabfahrt-variant
- **25b** — Foischingabfahrt-variant
- **31a** — Kraftalm–Kasbichl; in OSM soms als samengesteld ref **31, 31a, 31b**
- De verbinding **24,25** en de afdalingen onder code **25** worden door OSM anders geëtiketteerd dan de officiële pistes 24a/25a/25b/25c.
- De officiële route **20b** is een *Skiroute/Umfahrung* (geen gewone rode geprepareerde piste). De standaardplanner gebruikt 20b niet als terugweg.
- Korte delen van de kaart hebben nog geen nummer. Op zulke stukken worden lijngeometrie en overgangshoogte berekend, maar het exacte piste- of kruispuntnummer is niet officieel gecontroleerd.
- Kaartovergangen van meer dan 18 meter en vlakke/hoogte-onzekere stukken worden in de planner als **onbevestigd** getoond. De app mag geen onzichtbare lift- of pistestap overslaan.

**Status:** Netwerkcontinuïteit is machine-testbaar; openingstijden, toegestane doorgangen, alle pistevertakkingen en officiële kruispuntkeuzes zijn nog niet volledig onafhankelijk bevestigd. Een geometrisch verbonden route is niet hetzelfde als een gecertificeerde veilige skiroute.

## Drie gecontroleerde routevoorstellen — vertrek 09:00, lunch 12:30–13:30
De schema's zijn berekend met standaardniveau rood, 30 minuten veiligheidsmarge en terrein/kaartschattingen. Ze zijn ontworpen om niet meer urenlang vlak voor de lunch te wachten. Werkelijke piste-openstelling, liftwachttijden en uitstaplocaties altijd eerst controleren.

1. **Hohe Salve panoramarondje, Itter en Schernthann.** Via lift 20 en het Hohe-Salve-gebied, KRAFTalm/Itter en Schernthann; middag via Schernthann en Rigi. Lunchomgeving: Gipfelrestaurant Hohe Salve. Laatste afdaling 20a.
2. **Foisching, Hochbrixen, Hochsöll en Rigi.** Via liften 20, 24 en 25, pistes richting Brixen/Hochsöll, en in de middag via Rigi terug. Lunchomgeving: Salvenalm (bij lift 20). Laatste afdaling 20a.
3. **Itter, Brixen en KRAFTalm.** Via Hopfgarten/Itter, de Brixen-kant en KRAFTalm (bij lift 30 tussenstation); middag via Hohe Salve en Rigi. Laatste afdaling 20a.

De routemotor controleert voor iedere variant de opeenvolging van **alle** geometrische segmenten inclusief de kleine overstappen. De dagroute mag niet doorlopen wanneer een geselecteerde verbinding ontbreekt of een vaste lunch/terugkeer niet past.

## Twee manieren om de dag af te sluiten
- **Dalstation (standaard):** route moet naar het Salvenbahn I middenstation teruggaan en daarna aantoonbaar via piste 20a naar het Hopfgarten dalstation. In de laatste terugkeerfase zijn **geen liften** toegestaan.
- **Middenstation met optionele afdaling:** de geplande route eindigt bij Salvenbahn I middenstation. Er wordt ongeveer 30 minuten extra gereserveerd zodat afdaling 20a optioneel blijft. De afdaling wordt apart weergegeven en niet ten onrechte opgenomen in de officiële route of pistekilometers. Wanneer 20a als gesloten is gemeld, verdwijnt de claim van een liftvrije dalafdaling.

Let op: een terugkeer naar het middenstation is **niet automatisch lift-onafhankelijk als 20a gesloten is**; dan kan nog gondelvervoer naar het dal nodig zijn. Verifieer vóór vertrek openingstijden en piste-openstelling. Nooit als gegarandeerde piste-open status tonen.

## Regressietests
- Controle volledige opeenvolgende grafiekranden begin→eind.
- Controle dat liften verboden zijn in de laatste terugkeerfase.
- Controle 20a verplicht bij dalstation en buiten de geplande route bij middenstation.
- Sluiting 20a blokkeert de dalroute maar laat een route naar het middenstation over, met een duidelijke waarschuwing.
- Controle dat de normale routeplanning vanuit andere dalstations onveranderd blijft.
- Controle van officiële codes versus aanwezige kaartgegevens; ontbrekende varianten blijven als openstaand in dit dossier.

**Bronvermelding kaartlijnbestand**: OpenSkiData/OpenStreetMap (ODbL); terreinrichting gebaseerd op Open-Meteo/Copernicus GLO-90. Alle kaartovergangen zijn voorlopig tot aanvullend gecontroleerd op de officiële SkiWelt kaart.

## Update 22 november — korte loop- en prikoverstappen
De routeplanner accepteert korte verplaatsingen tussen **vooraf benoemde liftstations** als aparte transfer. Een lijn wordt **niet** op basis van afstand alleen aan willekeurige andere pistes gekoppeld.

Controles in de geografische motor:
- Beide stations moeten al met coördinaten in de lokale kaartgrafiek staan.
- Horizontale afstand maximaal 130 m; geschat hoogteverschil maximaal 12 m, positief of negatief.
- Bron en stationspaar staan in de gecodeerde controlelijst; de lijst is niet generiek.
- Extra rekentijd minimaal drie minuten, oplopend met de afstand; afzonderlijk zichtbaar in skiroute en PDF.
- Als een gegevensbron ontoereikend is, wordt de overstap als voorlopig gelabeld en niet als officieel bevestigde piste- of looproute.

Hochbrixen voorbeelden:
- **8 Würstlexpress bergstation → 1 Hochbrixen gondel bergstation:** ca. 90 m, geschat 0 m verschil. Kartografisch dichtbij en technisch opgenomen als **voorlopige** prik-/loopoverstap. De exacte toegestane loopstrook is niet onafhankelijk bevestigd.
- **12 Sonnenlift bergstation → 1 Hochbrixen gondel dalstation:** ca. 111 m, geschat +1 m. De officiële SkiWelt-verbindingsbeschrijving bevestigt dat de verbinding via Sonnenband 18 en Sonnenlift 12 naar gondel 1 loopt; de laatste 111 m is kaartmatig benaderd.
- **12 Sonnenlift bergstation → 11 SkiWeltbahn dalstation:** ca. 93 m, geschat -1 m, voorlopig.
- **1 Hochbrixen gondel dalstation → 11 SkiWeltbahn dalstation:** ca. 74 m, geschat -2 m, voorlopig.

Officiële verbinding: https://www.skiwelt.at/nl/verbindingen.html; officiële liften: https://skimap.skiwelt.at/ .

**Belangrijk:** het 90-meter hoogtemodel bewijst géén kleine hoogteverschillen op de meter nauwkeurig. Dit zijn controlegrenzen en indicaties, geen veiligheidsvrijgave. Een gesloten weg, afgezette skischoolzone of ongelijkvloerse kruising mag nooit via een automatische afstandsregel worden overgeslagen.
