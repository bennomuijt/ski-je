# Test 5 — resterende lunchcombinatie Going–Talkaser–Going

26 november 2026. PR #41, commit d237d77c3223ddfb55a2401ccb7d8aacebd245a3. [CI 45858510565](https://github.com/bennomuijt/ski-je/actions/runs/45858510565): 185/185 softwaretests geslaagd; vaste lunchtijd 12:30: 88/104 haalbaar; afzonderlijk gekozen eerdere lunchtijden tussen 11:45 en 13:15: 103/104. Uitsluitend Going–Talkaser–Going blijft geweigerd. Opgeslagen restaurantkeuze bij lunch uitgeschakeld is hersteld.

## Randvoorwaarden en diagnose

09:00 vertrek Going, 16:00 terug, 30 minuten veiligheidsmarge, lunch 60 minuten, vroegste lunchstart 11:45, normaal niveau/snelheid, geen zwart. De beschikbare terugwegtijd na lunch is 165 minuten. De huidige beste onderzochte route vanaf bergstation 114 duurt 176 minuten volgens group(); vanaf 111 178. De officiële [Talkaser-pagina](https://www.skiwelt.at/en/info/bergrestaurant-talkaser/) bevestigt beide toegangen (114 en Alpenrosenbahn 110/111). De hutingang is nog niet als afzonderlijk GPS-knooppunt vastgesteld.

Onafhankelijke graafberekening van de 176-minutenroute: 43 gegroepeerde delen (8 lift, 26 piste, 9 transfer), waarvan 19 korter dan 100m. De ongeronde som met ongewijzigde modellen en minimumtijden is 160.914 minuten (ceil 161). Dit verklaart 15 minuten cumulatieve afronding, maar **is geen betrouwbare eindtijd**: individuele liftgegevens en de officiële verbinding ontbreken gedeeltelijk.

De officiële [verbindingsbeschrijving](https://www.skiwelt.at/nl/verbindingen.html) noemt 111 → 112 → 11 → 18 → 12 → 1. De huidige onderzochte 176-minutenroute gebruikt in plaats van 18 een bestaande 24m station-walk naar een knoop bij het boveneinde van Sonnenband. De echte passage is niet bevestigd. Reken voor deze audit met lift 18 en behoud de rest van de route. Geen nieuwe verbinding toevoegen.

## Individuele referentierijtijden

Nominale volledige rit, exclusief de bestaande 2 minuten instap/wachtopslag. Niet als gemeten actuele wachttijd beschouwen.

| Lift | Generieke rijtijd op graaflijn (min) | Referentie (min) | Bron |
| --- | ---: | ---: | --- |
| 112 Choralmbahn | 7.21 | 7.00 | [Lift-World](https://www.lift-world.info/nl/lifts/resort/skiwelt/index.htm) |
| 1 Hochbrixen | 5.71 | 6.67 | [Skiresort](https://www.skiresort.de/skigebiet/skiwelt-wilder-kaiser-brixental/liftebahnen/l1739/) |
| 3 Zinsbergbahn | 7.72 | 5.67 | [Skiresort](https://www.skiresort.de/skigebiet/skiwelt-wilder-kaiser-brixental/liftebahnen/l105641/) |
| 6 Jochbahn | 7.23 | 6.17 | [Skiresort](https://www.skiresort.de/skigebiet/skiwelt-wilder-kaiser-brixental/liftebahnen/l102405/) |
| 67 Eibergbahn | 1.77 | 1.67 | [Skiresort](https://www.skiresort.de/skigebiet/skiwelt-wilder-kaiser-brixental/liftebahnen/l113055/) |
| 96 Kaiserexpress | 2.12 | 5.30 | [Lift-World](https://www.lift-world.info/nl/lifts/resort/skiwelt/index.htm) |
| 90 Hausberg | 3.80 | 10.00 | [Skiresort](https://www.skiresort.de/skigebiet/skiwelt-wilder-kaiser-brixental/liftebahnen/l1760/) |

## Aanvullende berekening

Groepgebaseerde padzoekberekening op bestaande gerichte kanten, fractionele groepsminuten (zelfde minimumtijden), zeven gepubliceerde ritduurreferenties, overige liften nog generieke snelheid. De bestaande kant van lift 18 wordt expliciet opgenomen. Afronding pas op de totale fase. Uitkomst:
- Lift 114 top: heen ca.119.31 min (sommige heenliften nog generiek); terug 168.55 min, afgerond 169; aankomst na lunch 12:45 om 15:34.
- Lift 111 top: heen ca.118.01 min; terug 170.55 min, afgerond 171; aankomst 15:36.
- Terugweg 114: liften 112, 18, 12, 1, 3, 6, 67, 96, 90 in volgorde; 44 groepen, 11 ongenummerde pisteonderdelen. Geen fysieke validatie, wachtrijen of laatste liftinstap gegarandeerd. Piste-afstanden en aansluitingen nog te toetsen, onder andere bij 111, 11 en 96b.
- Een kortere lunch van 50 minuten zou in dit verbeterde **diagnostische model** 15:24 aankomst geven (36 minuten voor 16:00), maar niet automatisch wijzigen. Bij 60 minuten blijft de combinatie buiten de gekozen veiligheidsdeadline. Lunchduur, eindtijd, snelheid en zwarte-piste-toestemming nooit stilzwijgend aanpassen.

## Vervolg

Niet kunstmatig 104/104 halen. Verifieer individuele lifttechniek voor alle betrokken liften, inclusief 12/18, officiële kaartlijnen en 2026/27 lengte/hoogte. Implementeer consistente tijdrekening met behoud van afzonderlijke stappen, instapopslag, waarschuwingen en de 20a-minimumtijd, toets volledige routeplanner en PDF. Deze notitie wijzigt geen productiecode. De eerdere 103/104-appuitkomst en deze aanvullende modeldiagnose zijn verschillende resultaten. PR #41 nog niet samengevoegd. Volgende testcategorie alleen na akkoord.
