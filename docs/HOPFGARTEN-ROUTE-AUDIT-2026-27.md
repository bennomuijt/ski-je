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


## Aanvullende onafhankelijke data-audit - 22 november 2026

### Kruiscontrole officiele pistecodes versus de gebruikte OpenSkiData/OSM-grafiek

Dit is een **data-audit**, geen bevestiging dat alle hieronder genoemde aansluitingen ter plekke zonder lopen/klimmen begaanbaar zijn. Controlebronnen:
- https://skimap.skiwelt.at/ en https://www.skiwelt.at/nl/pistestatus.html
- Aangeleverde panorama 2026/27 (kaartnummering)
- \`public/skiwelt-network-graph.json\`, \`public/skiwelt-source-summary.json\` en \`scripts/build-skiwelt-network.mjs\`

De gecontroleerde netwerkstand (GitHub-main v4.5.13, commit e3951bc) heeft 518 geografische bronfeatures: **438 piste-features** (waarvan **182 zonder \`ref\`-pistenummer**) en **80 lift-features**. Een OSM-pistefeature is een *kaartlijn* en niet noodzakelijk een afzonderlijke officieel genummerde piste. De geometrie heeft 3813 knopen, 6265 gerichte kanten en 172 benoemde station-ID's.

| Officiele piste | Officieel / controle | Huidige grafiek | Uitkomst |
|---|---|---|---|
| 7 en 7a | Filzboden, Brixen | aanwezig | Nummer aanwezig, alle aansluitingen nog niet fysiek bewezen |
| **7b** | Niet gevonden als zelfstandige code in actuele officiele online pistelijst; aangeleverde PDF-tekst bevat wel \`27b\`, niet zelfstandig \`7b\` | niet aanwezig | **onbevestigd**: geen nummer verzinnen en geen conclusie dat piste niet bestaat zonder visuele seizoenskaartcontrole |
| **20a** | Rode Talabfahrt Hopfgarten, 3293 m / 632 m | hoofdlijn \`way/29979896\` intermediate + benedendeel \`way/391480825\` easy | **Kleurconflict:** officieel is 20a rood. Geometrische lengtes en officiële afdaling zijn niet exact gelijk |
| **20b** | Skiroute (geen normale geprepareerde rode piste) | freeride | Terecht uitgesloten als standaard veilige dalterugweg |
| 21a / **21b** / 21c | Rigi-Mittelstation; 21b officieel 1775 m / 446 m | 21a en 21c aanwezig, 21b ontbreekt als eigen ref | **Openstaande pistevariant** |
| 24a / **24b** | Schernthann; 24b officieel 727 m / 214 m | 24a aanwezig, 24b ontbreekt als eigen ref | **Openstaande pistevariant**; OSM \`way/399257453\` heet 24a maar heeft ref 24 |
| **24,25** | Officiele verbindings-skiweg van 750 m / 90 m | geen zelfstandige piste-ref 24,25 | **Ontbrekende apart gelabelde verbindingsweg**, niet zonder bewijs afleiden uit een andere ref |
| 25a / **25b** / 25c | Foisching; 25b 1040 m / 230 m, 25c 857 m / 112 m | 25a en 25c aanwezig; 25b niet als eigen ref | **Naamcodeconflict:** OSM \`way/30681165\` heet \`25b - Foischingabfahrt b\` maar ref = \`25c\`; het hoogteverschil in de bron is ~118 m. **Niet automatisch naar 25b omnummeren** |
| 31a / 31b | Kraftalm - Kasbichl | 31b apart, 31a alleen als onderdeel \`31, 31a, 31b\` en/of afwijkende deelgegevens | Samengestelde code is geen bewijs dat alle afzonderlijke varianten compleet zijn |

### Hoogteverschillen bij automatisch aangelegde overstappen

Afgezien van liftkanten bevatten de beschikbare kaartgegevens momenteel **294 gerichte verbindingskanten die >12 meter stijgen** volgens het 90m-terreinmodel:
- \`map-junction\`: 167
- \`station-access\`: 56
- \`station-walk\`: 48
- \`map-crossing\`: 23

Dit zijn niet 294 bewezen fysieke klimmen: het grove DEM kan bij op elkaar liggende lijnen tegenstrijdige hoogtes geven. De grafiekbouwer accepteert sommige stationscontacten met verschil tot 60 m en andere verbindingen tot 35 m; richtingsafhankelijkheid wordt op die korte connectoren niet altijd fysiek bewezen. Een proef waarbij alle stijgende verbindingen boven 12 m worden uitgesloten, laat vanuit Hopfgarten slechts 5 van de 12 benoemde hoofdstationpunten bereikbaar; **dus noch alles toestaan, noch blind alles blokkeren is voldoende**.

**Beslisregel voor volgende correctie:** onderscheid (1) een echte lift-opstap of geografisch samenvallend punt met conflicterende DEM-hoogtes, (2) een expliciet onderzochte korte prik-/loopoverstap met fysieke toegangscontrole, (3) een niet-bewezen sprong tussen twee lijnen. Val categorie 3 niet automatisch goed; bevestig via de officiele kaart, fijnere hoogtedata of veldmeting, en voorkom dat het algoritme deze als veilige skiverbinding presenteert. Ga niet willekeurig nummers aan lege OSM-features toekennen.

### Wat wel en niet is geverifieerd

- **Ja (codes/route-eisen):** officiele 20a is rood; 20b is een skiroute; 21b/24b/25b bestaan officieel; de 4 Hochbrixen-stationparen zijn apart gemodelleerd met afstand/hoogtecheck; de drie Hopfgarten-voorbeeldroutes en de PDF-volledige index hebben reeds geautomatiseerde regressietests.
- **Nee (nog te controleren):** exacte lijn van alle 182 niet-genummerde OSM-features, ontbrekende pistevarianten, correcte last-meter hoogte/aanloop van alle overstappen, alle fysieke doorgangen (ook bij Hochbrixen), actuele lift- en pisteopenstelling.
- De officiele SkiWelt-Tour noemt ten minste een overgang als enkel \`Verbindung\` zonder apart pistennummer; maak daarom geen fictief nummer om de PDF volledig te *laten lijken*.

**Werkvolgorde:** eerst officiele-codecrosswalk en bronnaamconflicten, dan controle van fysieke aansluitingen en hoogteovergangen, daarna aanpassen van routeberekening/zichtbare waarschuwingen. Pas hierna nieuwe routes als volledig gecontroleerd bestempelen. Er is op basis van deze data-audit nog geen brongeometrie of live versie gewijzigd.
