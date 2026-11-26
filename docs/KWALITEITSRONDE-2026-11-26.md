# Kwaliteitsronde 4.5.25 — 26 november 2026

Basis: main 43e1409fc28b1569994554082ce9bd655bc104a6; CI 45798221213 poging 2: 178/178 basistests geslaagd, browsersimulaties geslaagd, live 4.5.25-cf bevestigd om 11:30 CET. Geen fysieke terreincontrole.

## Pistesluitingen
De 518 kaartfeatures (438 piste, 80 lift) bevatten 3813 knopen en 6265 gerichte kanten. Acht pistefeatures met 65 kanten dragen samengestelde refs. De oude router matchte alleen de volledige ref, dus een sluiting 31a werd niet herkend op 31, 31a, 31b. Herstel: blokkeer samengestelde kaartlijn bij sluiting van een compleet componentnummer, niet op prefix; houd piste- en liftcodes gescheiden. Twee regressietests gebruiken echte bronkanten. Nieuwe CI nog vereist.

## Broncontrole en open punten
- Officiële terugweg Westendorf naar Brixen: piste 111, lift 112, piste 11, Sonnenband 18, Sonnenlift 12, gondel 1. Bron https://www.skiwelt.at/nl/verbindingen.html . Volgorde bevestigd, geen bewijs voor exacte fysieke overstappen.
- Officiële kaart bevat 24b, 25b en 25c. In bron heeft way/30681165 naam 25b en ref 25c. Niet automatisch omnummeren. https://skimap.skiwelt.at/ en https://www.skiwelt.at/nl/pistestatus.html .
- 182 pistefeatures zonder ref in onbewerkte bron, 13 way-specifieke correcties in router. Geen 182 unieke ontbrekende pistes.
- 294 bronconnectoren met DEM-stijging >12 m: 167 map-junction, 56 station-access, 48 station-walk, 23 map-crossing. Een connector toont +54 m over 1 m. Het grove DEM bewijst geen fysieke stijging of berijdbaarheid. Niet blind blokkeren of goedkeuren.
- De 111 naar 117 overgang blijft voorlopig wegens hoogteconflict, ondanks officiële routevolgorde.
- Sluitingsinvoer accepteert alleen losse codes. Samengestelde invoercodes en de optie gebiedsverbinding moeten afzonderlijk end-to-end worden gecontroleerd.
- Bestaande tests voor het vaste Talkaser-lunchscenario bevatten een voorwaardelijk succespad. Strengere succesassertie en daadwerkelijke aankomsttijden apart toetsen.
- Fysieke doorgang, actuele lift-/pistestatus, volledige vertaaldekking, werkelijke huttoegang en fysieke toesteltests blijven open.

Geen nieuwe functies, geen wijziging brongeometrie. Testbranch houdt versienummer 4.5.25 met nieuwe build-ID; niet publiceren zonder geslaagde controles.

## Vervolgcontrole 26 november — 56 verschillende dalstationroutes
- CI 45828719037: alle 64 standaarddagplannen (56 verschillende + 8 rondritten) haalbaar; 8/8 sluitingsproeven geslaagd. 14/56 kruisroutes bereiken 15:25 of later, vier precies 15:30. Veiligheidsmarge 30 minuten. Modeltijden, geen gemeten wachttijden.
- SkiWelt kaartcatalogus en Westendorf pisteoverzicht bevestigen Höhninger Abfahrt **117b**, blauw, 786 m / 164 m. Bronkaart way/765993194 heet exact Höhninger Abfahrt, code 117, blauw, 717 m / circa 150 m hoogteverschil. Corrigeer uitsluitend die specifieke bronfeature in de router; behoud 117 Neuhögen en fysieke geometrie. Bron https://skimap.skiwelt.at/ en https://www.skiwelt.at/westendorf/de/pistenstatus.html . Regressies voor code, PDF en onafhankelijke sluitingen.
- Ellmau: officiële verbindingspagina noemt 99a; officiële SkiWelt Tour 2026/27 noemt 99. Beide komen als afzonderlijke nummers in de kaartcatalogus voor. OSM bevat verscheidene features met ref 99 en uiteenlopende namen. Geen automatische omnummering zonder visuele lijnbevestiging. Bronnen https://www.skiwelt.at/nl/verbindingen.html , https://www.skiwelt.at/media/gruppen-info-busfolder/Infofolder-fuer-Reisebueros.pdf , https://skimap.skiwelt.at/ .
- Westendorf: officiële tour 11 → 110 → 111 → 117 → lift 117; model 11-top → 111 → 117 → lift 117. Code 110 bestaat in de bron op een aansluitende andere lijn. Ontbrekende 110 blijft open, niet invoegen zonder bewijs dat het deel werkelijk wordt gebruikt. De vergelijking meldt nu ook welke codes afzonderlijk ontbreken, niet slechts de eerste mismatch.
- De geplande audit krijgt een volledige PDF-indexcontrole per dagroute, plus alle 64 dalstationcombinaties onder een afzonderlijk voorzichtig tijdscenario (09:15, lager skitempo, 45 min marge); en indicatieve gevoeligheid voor 1 minuut extra wachttijd per lift op het oorspronkelijke plan. Geen wijziging van gebruikersinstellingen of fysiek bewijs van wachttijd.
- De panoramakaart-afbeelding en PDF-paginarender waren niet rechtstreeks toegankelijk in deze onderzoekssessie. Kaartcatalogus en officiële routebeschrijvingen zijn wel gelezen. Visuele lijnvergelijking blijft open.
