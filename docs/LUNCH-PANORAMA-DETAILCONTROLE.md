# Scherpe kaart als bron voor de huttencontrole

Gebruik de officiële [panoramakaarten 2026/27](https://media.skiwelt.at/de/skiwelt-winter-panorama.html) en het [downloadcentrum](https://www.skiwelt.at/nl/downloadcentrum.html). Het downloadcentrum vermeldt ook 25/26; gebruik de Nederlandse PDF 26/27 voor actuele kaartvergelijkingen.

De aparte QA-workflow downloadt de PDF (met de bestaande Worker-PDF-proxy als fallback), bewaart de bronversie en rendert de kaart op 432 dpi. Alleen bij exact dezelfde PDF-hash als de eerdere visuele kaartcontrole worden de 69 bestaande groene hutmarkeringen gebruikt voor ruime uitsneden. Bij een gewijzigde kaart is eerst opnieuw uitlijning nodig. Bekijk per uitsnede welke gekleurde piste, richting, aftakking en volgende lift bij de hut liggen; vergelijk met de wintertoegang van de exploitant en de geografische graaf.

Geen productiecode, kaartmarkeringen, GPS-coördinaten of routegeometrie gewijzigd. Een hoge renderresolutie maakt vectorinformatie leesbaarder maar creëert geen detail in ingebedde rasterbeelden. De uitsneden zijn onderzoeksmateriaal, geen automatische bevestiging van fysieke doorgang. Bewijsbestanden blijven zeven dagen in GitHub Actions beschikbaar.
