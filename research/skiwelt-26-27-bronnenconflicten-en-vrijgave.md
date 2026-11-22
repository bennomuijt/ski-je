# SkiWelt 2026/27 - genummerde bronnen, conflicten en vrijgavegrenzen

Onderzoek op 2026-11-22, alleen voor de onderzoeks-PR; niet geschikt om automatisch routeverbindingen of kaartmarkers te publiceren.

## Primaire bronnen
- Officiele Nederlandstalige liftstatus: https://www.skiwelt.at/nl/liftstatus-winter.html (pagina meldt laatst bijgewerkt 2026-11-21 19:20).
- Officiele huttenindex: https://skimap.skiwelt.at/en/suche.html
- Panorama: https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.pdf
- Bestaande appdata: public/lift-catalogue.js en public/hut-catalogue.js op main.
- Onderzoekskandidaten: research/skiwelt-26-27-pdf-number-candidates.json (PDF-centra; niet visueel goedgekeurd).

## Met de officiele liftstatus bevestigde dataconflicten
| Entiteit | Officiele lijst | Bestaande lift-catalogue.js | Actie |
|---|---|---|---|
| 10er Gondelbahn Hexenwasser | 26 | 40 | Conflict. Geen marker voor 40 als Hexenwasser publiceren; actuele nummering met seizoenskaart visueel valideren. |
| Hexenteppich 2 | 59 | 58a | Conflict. Nummer 59 in PDF niet zonder meer als Muehlbichl behandelen. |
| Muehlbichl (Uebungsbereich im Dorf) | zonder nummer onderaan officiele lijst | 59 | Nummer is niet door officiele liftstatus bevestigd. |

Waarschuwing: de panorama bevat gedrukte nummers die ook pistes of hutten kunnen betekenen; vergelijk onafhankelijke piste- en liftlijsten voordat er kaartlabels aan een entiteit worden gekoppeld. Voorbeeld: 40 kan op het panorama een piste of een ander label zijn, niet automatisch Hexenwasser.

## Nummernaamruimten
- `lift:<nr>`, `hut:<nr>` en `piste:<nr>` zijn **verschillende identifiers**. De nummers 61, 62 en 99 kunnen voor verschillende categorieen voorkomen. Een gelijk getal vormt geen aansluiting.
- Officiele huttenindex vermeldt zowel Kaiserlounge als Panoramarestaurant Bergkaiser met nummer 56. Niet automatisch dedupliceren; twee bronvermeldingen moeten apart blijven totdat context is vastgesteld.
- Onderzoekskandidaten lift 80 en 112 hebben elk meerdere PDF-tekstposities; dat kan herhaling langs dezelfde lift zijn. Niet willekeurig een positie selecteren.
- Label 89 is niet exact een genummerde lift in de officiele liftstatus (die 89a/89b/89c noemt). Status: onbeslist.
- PDF-stijlen (zoals donker MyriadPro-BlackCond of wit MyriadPro-Regular) zijn aanwijzingen, geen op zichzelf voldoende bewijs van type. Visuele inspectie van render en legenda is verplicht.
- Het midden van een tekstkader is **niet** het dal-/bergstation, niet de locatie van een hut en niet een routeknooppunt.

## Verifieerbaarheid
`tools/extract_panorama_positions.py` logt sinds commit c7ad0e8 een SHA256 van de ontvangen PDF en per numeriek tekstspan de exacte `bbox_pt`, `center_pt`, `page`, lettertype, kleur en genormaliseerde centrumpositie. De JSON met oudere kandidaten bevat nog alleen genormaliseerde centra en mag niet als visueel gevalideerd worden gelabeld. Geen bewijs van overeenstemming tussen officiële PDF en `public/Kaart 2026-2027.png` op basis van bestandsnaam alleen.

## Openstaande controles
1. Zelfde PDF-revisie en SHA256 vastleggen; de download in de lokale controleomgeving mislukte door netwerk/DNS en het bibliotheek-PDF liet geen raw-byte export toe. Het GitHub CI-script heeft een eigen downloader; de aanwezigheid van code bewijst niet dat de workflow succesvol is uitgevoerd.
2. PDF op hoge resolutie renderen; representatieve zwarte, witte en piste-etiketten tegen visueel symbool en legenda inspecteren. Exacte bbox per nummer in CI-output terugzoeken.
3. Controlegevallen 26, 40, 58, 59, 80, 89, 112 en dubbele hut-56 expliciet aftekenen.
4. Mapafbeelding en PDF geometrisch vergelijken op identieke afbeelding/crop/verhouding voor markers kunnen worden geprojecteerd.
5. Piste/lift/hut koppelingen pas aan routinggraph toevoegen na bewezen aaneengesloten trajecten, richting en begin-/eindstations; onbekende segmenten als onbekend behandelen.

## Publicatiegrens
Alleen researchbranch, PR blijft draft. Geen updates aan `public/`, geen merge, geen automatische Cloudflare/Netlify publicatie op basis van deze gegevens.
