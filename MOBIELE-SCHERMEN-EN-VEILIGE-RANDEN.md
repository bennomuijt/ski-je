# SKI-je: mobiele schermen, bediening en veilige randen

## Doel
De onderste zes navigatieknoppen moeten bereikbaar blijven boven de systeembediening van Android en iOS. Dit geldt ook voor panoramakaart, pop-ups, groepsscherm, webcam, toetsenbord en de installatiepagina. Geen afhankelijkheid van een vaste toestelnaam of fysieke schermresolutie.

## Gecontroleerde specificaties (fabrikanten, 21 november 2026)
| Fabrikant | Toestel / scherm | Fabrikant |
| --- | --- | --- |
| Apple | iPhone 17 Pro: 6,3 inch, 2622 × 1206 fysieke pixels, Dynamic Island | https://support.apple.com/nl-nl/125090 |
| Samsung | Galaxy S26: 6,2 inch, 2340 × 1080 fysieke pixels | https://www.samsung.com/nl/mobile-phone-buying-guide/introducing-samsung-galaxy-s26/ |
| Samsung | Galaxy S26+: 6,7 inch, 3120 × 1440 fysieke pixels | https://www.samsung.com/nl/mobile-phone-buying-guide/introducing-samsung-galaxy-s26/ |
| Samsung | Galaxy S26 Ultra: 6,9 inch, 3120 × 1440 fysieke pixels | https://www.samsung.com/nl/mobile-phone-buying-guide/introducing-samsung-galaxy-s26/ |
| Google | Pixel 10 Pro: 161 mm diagonaal, 1280 × 2856 fysieke pixels; Pixel 10 Pro XL: 171 mm, 1344 × 2992 | https://store.google.com/nl/product/pixel_10_pro_specs?hl=nl |

| OnePlus | OnePlus 15: 6,78 inch, 2772 × 1272 fysieke pixels | https://www.oneplus.com/global/15/specs |
| Motorola | Edge 60 Pro: 6,7 inch, 2712 × 1220 fysieke pixels | https://en-gb.support.motorola.com/app/answers/detail/a_id/185971/p/11090 |
| Samsung | Galaxy Z Fold7: 6,5 inch coverscherm (2520 × 1080), 8,0 inch hoofdscherm (2184 × 1968) | https://news.samsung.com/nl/samsung-galaxy-z-fold7-de-lat-hoger-leggen-voor-smartphones |

**LET OP:** fysieke schermpixels zijn niet hetzelfde als CSS-pixels. Door weergaveschaal, browserbalken, lettergrootte, zoom, PWA-standalone, split-screen en toestelrotatie kan dezelfde telefoon een andere bruikbare viewport hebben. Daarom geen hardcoded afmetingen per model.

## OS en webplatform
- Apple iOS/iPadOS: Home-indicator, Dynamic Island, safe areas en Safari-vs-startscherm-PWA. CSS `viewport-fit=cover` en `env(safe-area-inset-*)` zijn relevant.
- Android: verschil tussen 3-knopsnavigatie en gebarenbediening, met name bij Android 15+ edge-to-edge. Systembars en gesture-insets kunnen content overlappen: https://developer.android.com/develop/ui/views/layout/edge-to-edge
- Chrome Android, Samsung Internet, Firefox en iOS Safari kunnen verschillende insets rapporteren. CSS-insets en `visualViewport` benutten waar beschikbaar; anders optionele handmatige ondermarge in **Meer > Zuinigheid, opslag & privacy**.
- Landschap, inklapbaar/uitklapbaar, tablet, tekstvergroting (tot minimaal 200%) en softwaretoetsenbord moeten apart worden getest.

## Geïmplementeerd in testbranch
- `public/mobile-safe-area.css`: vier veilige randen, `dvh`-hoogte met fallback, onderbalk inclusief marge, modals en liggende schermen.
- `public/mobile-safe-area.js`: meet de werkelijke menubalkhoogte, reageert op rotatie en viewport-wijzigingen, lokale instelling 0–96 CSS-pixels, verschuift geen GPS/kaartcoördinaten.
- `public/index.html`: zichtbare optionele schuifregelaar; automatische stand standaard.
- `public/install.html`: veilige randen.
- `public/sw.js`: gewijzigde resources in de offline cache.
- `tests/mobile-safe-area-browser.mjs`: 12 **gesimuleerde CSS-viewportformaten**, waaronder kleine Android, iPhone, Galaxy, Pixel, landschap, tablet en foldable.
- `tests/mobile-safe-area.test.js`: component- en regressietests.

## Grenzen van tests
Een headless Chrome-test met viewport 390 × 844 bewijst **niet** dat de echte iPhone-systeemnavigatie of Samsung 3-knopsbalk juist wordt gerenderd; die worden door de emulator niet getoond. Vereist blijft een praktijkcontrole op echte iPhones, Samsung-toestellen (3 knoppen én gebaren), Pixel, inklapbare telefoon en Android/iOS-geïnstalleerde PWA. Verifieer daarbij:
1. Alle zes ondermenu-knoppen zichtbaar, aantikbaar en niet overlapt.
2. Laatste kaart- en formulierknop bereikbaar na scrollen; correcte bediening bij menu, toetsenbord en zoom.
3. SOS, terugknoppen en sluiten van modals zichtbaar.
4. Na wissel tussen staand/liggend, Safari/Chrome en startscherm geen extra onderbalk.
5. Bij toestel waarop systeembalk niet wordt doorgegeven: schuifregelaar verhoogt de afstand en bewaart die uitsluitend lokaal.

## Toekomstig onderhoud
Bij een nieuwe iPhone-, Samsung Galaxy-, Google Pixel-, OnePlus-, Xiaomi- of andere Android-serie: check de officiële fabrikant- en OS-documentatie, kijk naar gewijzigde beeldverhouding, safe-area gedrag, browser/PWA-weergave, camera-uitsparing, toetsenbord en systeemnavigatie. Update zo nodig het voorbeeldmatrix en de tests; voeg alleen modelspecifieke correcties toe bij aantoonbare platformbugs. Nooit een toestelnaam gebruiken als hoofdlogica. Publiceer na groene regressies en echte apparaatcontrole.
