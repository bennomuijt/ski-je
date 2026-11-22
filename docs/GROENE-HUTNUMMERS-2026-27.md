# SKI-je 4.5.20 – klikbare groene hutnummers op SkiWelt 2026/27

De officiële SkiWelt-panoramakaart toont genummerde **groene dakjes** voor berghutten, restaurants en bars. Ze zijn nadrukkelijk geen GPS-coördinaten.

## Gebruikte bronnen

- SkiWelt winterpanorama 2026/27: `https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.jpg`
- Bijbehorende vector-PDF: `https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.pdf`
- Interactieve officiële huttenlijst: `https://skimap.skiwelt.at/en/`
- SkiWelt-informatiebrochure zomer 2026 bevestigt nummer 54 Treichlhof en beide locaties bij nummer 56.
- Officieel SkiWelt-overzicht 2026/27 bevestigt nummer 37 Berggasthof Bavaria.

Het JPG-bestand waarop de posities zijn vastgesteld is 3537 × 2445 pixels, SHA-256:
`f94ac4a7c2f7e78db17b49788cf543eab98508c3a87497dd97774584fa6e7c2c`.

## Controle

- **69 verschillende genummerde groene daken** individueel op de officiële JPEG gemarkeerd en visueel beoordeeld, inclusief aaneengesloten groene symbolen 88/59/61 en 6/7.
- Exacte tekstmiddens van **8** groene nummers in de operator-PDF (18, 61, 62, 66, 76, 79, 95 en 99) komen tot ongeveer één pixel overeen met dezelfde symbolen in de JPEG.
- Het groene symbool in de legenda is uitgesloten. Witte liftvakken en rode/blauwe pistenummers zijn aparte categorieën.
- De app controleert de **werkelijke JPG-bestandsinhoud via SHA-256** voordat de groene tikvlakken werken. Alleen gelijke afmetingen zijn onvoldoende.
- Bij grote zoom kun je het groene nummer aanraken. Dit werkt ook als `Restaurants weergeven` uitstaat. Bij verschoven/gewijzigde kaart blijven de hutten bereikbaar via de zoekfunctie, maar worden de tikvlakken niet gebruikt.

## Nummering en uitzonderingen

- **56:** Kaiserlounge en Bergkaiser delen op de kaart één groen nummer. Bij aantikken toont de app beide als keuzes.
- **37:** Berggasthof Bavaria, toegevoegd uit de officiële SkiWelt-gegevens 2026/27.
- **54:** Treichlhof, nummer aangevuld op basis van de officiële SkiWelt-informatiebrochure 2026.
- **32:** In verschillende SkiWelt-bronnen komen de namen Salvenmoos en Marchental Skihütte voor. De app meldt dat bronverschil bij deze hut.
- **16, 22, 39, 73 en 87** staan wel in de zoeklijst, maar hebben op deze specifieke panoramakaart geen afzonderlijk groen nummer dat kon worden vastgesteld. De app maakt hiervoor geen verzonnen kaartpositie.
- Beschikbare foto's worden uit de bestaande gecontroleerde brongegevens gehaald. Een ontbrekende foto of openingstijd wordt nooit verzonnen.

## Testpunten voor de groepstest

1. Zoom op de panoramakaart naar groen 23, 37, 54, 56 en 61 en tik de nummers aan.
2. Bij 56: kies eerst Kaiserlounge en daarna Bergkaiser; de info moet verschillen.
3. Zet `Restaurants weergeven` uit. Tik opnieuw op nummer 61; het restaurant moet toch openen.
4. Tik op wit liftnummer 23; dit moet Rigibahn openen, niet KRAFTalm (groen 23).
5. Controleer de kaartnummers in andere dorpen. Onjuiste gegevens of ontbrekende namen via de bestaande feedbackmodule melden.

De kaart is een illustratieve panoramatekening en geen navigatiekaart met GPS-ijkpunten.
