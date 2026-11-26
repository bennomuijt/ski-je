# Test 5: uitbreiding van haalbare lunchroutes

Baseline CI 45848517118: 184/184 tests groen, 87/104 vaste lunchcombinaties om 12:30, 8/8 automatisch en 16/16 tijdgrenzen. Onafhankelijke aanvullende graafberekening geeft 88/104 op dezelfde tijd, 103/104 met een afzonderlijk gekozen lunchtijd binnen 11:45–13:15. Dit is nog geen resultaat van deze patch.

Wijzigingen: alleen wanneer een vast gekozen restaurant niet binnen de opgegeven dag past, alternatieve padwegingen proberen, kiezen op werkelijke gegroepeerde modelduur, daarna de volledige dag opnieuw valideren. Geen andere rijsnelheden, nieuwe aansluitingen, wijziging van lunchduur/lunchtijd of marge. Ochtendpauze wordt niet dubbel in rekening gebracht; bij uitgeschakelde lunch oude restaurantkeuze negeren. Extra CI-tests controleren vaste lunchdekking en expliciet opnieuw gekozen eerdere lunchtijden. De timingprofielen zijn zoekheuristieken, geen gegarandeerd optimum. Bij een onhaalbare vaste keuze blijft de bestaande foutmelding.

De officiële PDF-render is geslaagd (run 45856335590): 10188 x 7042, 432 dpi, 69 hutuitsneden, bronhash 510e48bede247b856b9e8de5b0b0161d3f4182be468278bd231c3510b6a93798. Artifact 15135359547. Alleen onderzoeksbron. Visuele hut-pistekoppelingen nog open. Geen fysieke verificatie of live garantie.

Publicatie vereist geslaagde CI en integratie met sluitings-PR #40.
