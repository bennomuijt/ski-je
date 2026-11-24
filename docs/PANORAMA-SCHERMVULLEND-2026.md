# SKI-je 4.5.23 — panoramakaart schermvullend en diep inzoombaar

## Probleem

Bij de uitbreiding met individuele witte liftnummers en groene hutnummers namen het filtermenu, de uitleg, routechips, informatiepanelen en footer steeds meer plaats in. Op een Samsung S21 kon de echte kaart daardoor nauwelijks worden gelezen. De vorige panoramakern begrensde bovendien het schuiven op basis van de **volledige kaartcontainer**, terwijl de panoramafoto binnen deze container via `object-fit:contain` smaller kan zijn. Dit kon leiden tot lege stukken of lastig bereikbaar detail bij inzoomen.

## Nieuwe interface

- Bij het openen **vult de officiële panorama standaard het beschikbare scherm** (cover-zoom). Op een staande telefoon is dat een uitsnede uit de brede kaart. De knop **Hele kaart** (⌂) toont de complete panorama weer. Beide manieren blijven beschikbaar.
- De kaart is een zelfstandige, grote tekenlaag onder een smalle bovenbalk. De plaatskiezer, zoommin, zoomplus, zoompercentage en overzichtstoets zweven over de kaart en nemen dus geen verticale hoogte af.
- **⚙ Opties** opent een tijdelijk uitklapbaar paneel boven de kaart met zichtbaarheid van liften/restaurants, de legenda/uitleg, de indicatieve routevolgorde en knoppen voor schermvullende kaart en de officiële afbeelding opnieuw laden. Het paneel is bij openen standaard dicht.
- Tikken op een **wit liftnummer** of **groen hutnummer** opent de bestaande informatie, foto's, namen en bronlinks in een maximaal 47% hoge **onderste informatiekaart**. De grote kaart erachter blijft op exact dezelfde hoogte en zoomstand. Het paneel is weer te sluiten.
- Bij grote zoom verdwijnen de acht globale gebiedsclusters per categorie zodra de controleerbare individuele kaartlabels in beeld komen. Dit vermindert overlap met de nummers.
- Witte liftomrandingen krijgen bescheiden afmetingen en blokkeren de onderliggende aanraking niet meer; een tik wordt via de gecontroleerde dichtstbijzijnde kaartlabelpositie geïnterpreteerd. Bij zeer nabije hut-/liftnummers kan maximaal één van beide openen.
- **Zoom 100% tot 4800%** met zoomknoppen, dubbel tikken, trackpad/muiswiel of twee vingers. De bovengrens maakt grotere uitsneden mogelijk, maar voegt geen nieuwe pixels toe aan de oorspronkelijke JPG (3537×2445). Op het allerhoogste niveau kan de bron zichtbaar pixeleren.
- Verschuivingen worden begrensd op basis van de **werkelijk getekende** panoramabeeldmaat, niet de witte ruimte in het scherm. Extra bewerkingen aan de officieel gecontroleerde lift-/hutdata of GPS-kalibratie zijn niet nodig.
- Wanneer de app offline terugvalt op een oude kleine PNG-uitsnede, verschijnt duidelijk een waarschuwing. Via `⚙ Opties → ↻ Kaart opnieuw laden` kan de originele kaart opnieuw worden geprobeerd.
- Het modale scherm respecteert iPhone-safe-areas en op Android minimaal ruimte voor de statusbalk en de onderliggende systeemnavigatie, ook als de browser niet als standalone wordt herkend.

## Praktijktest op de telefoon

1. Open Kaart → **Panoramakaart groot**. De kaart moet het zichtbare gebied nagenoeg vullen, zonder rijen met uitleg en permanente info onder de kaart.
2. Tik op **+** en zoom met twee vingers door naar piste- en liftnummers. Het maximale zoomniveau is **4800%**.
3. Tik op wit 22 of 23 en op een groen hutnummer. De bestaande naam/foto-informatie opent als een paneel vóór de kaart; na sluiten blijft de kaart op dezelfde plek staan.
4. Test **⚙ Opties**: filters uit/aan, routechips en terug naar schermvullend. Druk op **⌂** voor de complete kaart.
5. Herhaal op een Android met drie navigatietoetsen, een Android met gebaren en een iPhone, in portrait en landscape. De knoppen mogen niet achter de systeembalk vallen.
6. Test ook offline (bewaar de originele volledige kaart vooraf) en let op de waarschuwing bij een oude lage-resolutie uitsnede.

Automatische tests simuleren verschillende mobiele viewportgroottes en controleren dat de kaart even hoog blijft bij het openen van labels of opties. Ze bevestigen niet iedere toestelvariant of de werkelijke GPS-locatie. **De SkiWelt-panorama blijft een artistieke kaart en is niet geografisch gekalibreerd.**
