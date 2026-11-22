# SKI-je 2026/27 — alle gedrukte liftnummers aanklikbaar

## Bronnen en controles
- Officiële SkiWelt panoramakaart: https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.jpg
- Officiële liftstatus: https://www.skiwelt.at/nl/liftstatus-winter.html
- Officiële tourreferentie: `public/skiwelt-reference-tours.js` (met Hexenwasser nr. 40)
- Onderzoeks-PR #12: PDF-vectorcentra van liftnummerlabels.
- Afdrukpositiebeelden zijn op 22 november 2026 per label vergeleken met de originele JPG, 3537 × 2445 pixels (SHA-256 `f94ac4a7c2f7e78db17b49788cf543eab98508c3a87497dd97774584fa6e7c2c`). Zo zijn *80 gedrukte liftnummerposities, 78 verschillende nummers* gevonden.

De coördinaten zijn **uitsluitend 2D-tekstposities op de panoramatekening**, niet de werkelijke plek van een liftstation. Nummering van een piste in een rode of blauwe cirkel is nooit hetzelfde als een zwart liftetiket in een wit vierkant.

## Gevallen met verschillende nummers
- **22** Salvenbahn II en **23** Rigibahn zijn al eerder exact gecontroleerd en blijven direct aanklikbaar.
- **80** Hartkaiserbahn en **112** Choralmbahn worden ieder op twee plekken gedrukt. Beide klikvlakken openen dezelfde lift, niet twee aparte trajecten.
- **40** is het kaart-/tourlabel voor de Hexenwasser-gondel. De officiële actuele liftstatus noemt daarvoor nummer **26**. De app toont het bronverschil duidelijk en houdt de tourroute met nummer 40 intact; er wordt niet beweerd dat 26 op het panorama gedrukt staat.
- **59** hoort volgens de actuele officiële liftstatus bij *Hexenteppich 2*. De foutieve naam *Mühlbichl* bij nummer 59 en het niet-officiële 58a-label zijn uit de genummerde catalogus verwijderd. Mühlbichl staat op de statuspagina zonder officieel nummer.
- **89** staat één keer als wit vakje afgedrukt. De officiële lijst splitst het uit in **89a, 89b en 89c**. De app vraagt de gebruiker welke van deze drie bedoeld wordt en kiest niet blind de eerste.

## Niet als gedrukt wit nummer aangetroffen
36 (Förderband Kelchsau), 39 (Pfaringlift), 26 (Hexenwasser op actuele liftstatus) en 89a/b/c (alleen gezamenlijk kaartlabel 89). De bijbehorende officiële liften staan in de naam-/nummerlijst, maar krijgen geen fictief tikvlak op een andere plek. De witte kaartlabels 40 en 89 krijgen de hierboven beschreven bronvermelding of keuze.

## Test en vrijgave
- Zoom naar elk deelgebied. Bij voldoende zoom op een wit vierkant tikken opent het bijpassende liftpaneel.
- Rode en blauwe ronde pistenummers mogen nooit liftinformatie openen.
- Schakel 'Liften weergeven' uit en tik op het witte nummer; het werkt zonder gekleurde marker.
- Test 40, 59, 89, de dubbele 80 en 112, plus de bestaande 22 en 23.
- Bij een nieuwe JPG/PDF-revisie mag de positiecorrectie niet stilzwijgend als GPS of dezelfde afbeelding worden beschouwd: nieuwe bron en beeldafmetingen eerst vergelijken.
- Bij de groepstest GPS/routecorrecties in de feedbackmodule verzamelen; deze kaartlaag mag niet zelfstandig een onbekende pisteverbinding als bewezen opnemen.
