# SKI-je 4.5.22 — Samsung S21: webcamknoppen achter systeemnavigatie

## Waarneming

Op een Samsung Galaxy S21 (Android met drie navigatieknoppen) staan de onderste SKI-je-webcamknoppen gedeeltelijk **achter de witte Android-systeembalk**. Ook lijkt de blauwe webcamkop dicht onder of achter de bovenste statusbalk te staan. Dit is gemeld met een schermafbeelding waarop de Feratel-camera **Hochbrixen** wel beeld geeft, maar de knoppen eronder worden afgekapt.

## Oorzaak en aanpassing

- SKI-je 4.5.21 reserveerde standaard extra Android-ruimte alleen wanneer `display-mode: standalone` werd herkend. Sommige Android-browserstarts, geïnstalleerde snelkoppelingen of WebViews melden dat niet, terwijl ze wél edge-to-edge worden getoond.
- Alle Android-startwijzen krijgen daarom een conservatieve bovenmarge van minimaal **32 CSS-pixels** en een ondermarge van minimaal **56 CSS-pixels** voor de schermvullende webcam. Eventuele echte CSS-safe-areas of beperkingen van `visualViewport` mogen die marges vergroten.
- Het webcamvenster wordt **tussen** die marges geplaatst, in plaats van helemaal schermvullend te worden en alleen op onbetrouwbare `env()`-waarden te vertrouwen.
- De terug- en aanbiederknop staan naast elkaar in een vaste, ingepaste werkbalk; het cambeeld krimpt wanneer dat nodig is.
- De eigen onderste SKI-je-navigatie reserveert ook onderruimte op Android wanneer de modus 'standalone' ontbreekt.
- iOS blijft de gemelde safe-area-insets gebruiken, zonder Android-marges.

## Regressie

`tests/webcams-responsive-browser.mjs` test acht scherm- en systeemrandvarianten. Nieuw is `S21-screenshot-edge-to-edge-no-inset`: 393 × 852, Android-UA, **zonder handmatig ingevulde CSS-safe-area en zonder standalone-klasse**, met gesimuleerde statusbalk (32 px) en systeemknoppen (56 px). De controle eist dat beide onderste knoppen zichtbaar **én klikbaar** blijven en dat de terugknop bovenaan niet onder de statusbalk terechtkomt.

De Chrome-simulatie controleert geometrie en klikbaarheid, maar kan geen werkelijke Android-systeemnavigatie tekenen. Controleer daarom ook op een echte Samsung S21 met drieknopsnavigatie en op minimaal één iPhone. Externe Feratel/Panomax-spelers bepalen zelf de knoppen binnen hun eigen beeld.
