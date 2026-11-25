/* Localised PDF headings; plain text, no external services. */
(()=>{
 'use strict';
 const rows=[
 [
  "SKI-JE · MIJN SKIDAG",
  "SKI-JE · MY SKI DAY",
  "SKI-JE · MEIN SKITAG",
  "SKI-JE · MA JOURNÉE DE SKI",
  "SKI-JE · MI DÍA DE ESQUÍ",
  "SKI-JE · 我的滑雪日",
  "SKI-JE · MÓJ DZIEŃ NA STOKU",
  "SKI-JE · MIN SKIDAG"
 ],
 [
  "DAGOVERZICHT · ALLE TRAJECTEN OP VOLGENDE BLADEN",
  "DAY OVERVIEW · ALL LEGS ON FOLLOWING PAGES",
  "TAGESÜBERSICHT · ALLE ABSCHNITTE AUF DEN FOLGESEITEN",
  "APERÇU · TOUS LES TRAJETS AUX PAGES SUIVANTES",
  "RESUMEN · TODOS LOS TRAMOS EN LAS PÁGINAS SIGUIENTES",
  "日程概览 · 后续页面包含全部路段",
  "PLAN DNIA · WSZYSTKIE ODCINKI NA KOLEJNYCH STRONACH",
  "DAGSOVERSIGT · ALLE ETAPER PÅ DE FØLGENDE SIDER"
 ],
 [
  "DATUM {0}",
  "DATE {0}",
  "DATUM {0}",
  "DATE {0}",
  "FECHA {0}",
  "日期 {0}",
  "DATA {0}",
  "DATO {0}"
 ],
 [
  "VERTREK",
  "DEPARTURE",
  "ABFAHRT",
  "DÉPART",
  "SALIDA",
  "出发",
  "WYJAZD",
  "AFGANG"
 ],
 [
  "STREEFAANKOMST",
  "TARGET ARRIVAL",
  "ZIELANKUNFT",
  "ARRIVÉE PRÉVUE",
  "LLEGADA PREVISTA",
  "目标到达时间",
  "PLANOWANY PRZYJAZD",
  "PLANLAGT ANKOMST"
 ],
 [
  "UITERLIJK TERUG",
  "RETURN BY",
  "SPÄTESTENS ZURÜCK",
  "RETOUR AVANT",
  "REGRESO ANTES DE",
  "最迟返回",
  "POWRÓT NAJPÓŹNIEJ",
  "SENEST TILBAGE"
 ],
 [
  "VOORLOPIGE ROUTE – NIET LIVE GECONTROLEERD",
  "PROVISIONAL ROUTE – NOT LIVE VERIFIED",
  "VORLÄUFIGE ROUTE – NICHT LIVE GEPRÜFT",
  "ITINÉRAIRE PROVISOIRE – NON VÉRIFIÉ EN DIRECT",
  "RUTA PROVISIONAL – SIN VERIFICACIÓN EN DIRECTO",
  "临时路线 – 未实时核实",
  "TRASA WSTĘPNA – BEZ WERYFIKACJI NA ŻYWO",
  "FORELØBIG RUTE – IKKE LIVEKONTROLLERET"
 ],
 [
  "AANDACHTSPUNTEN – VERVOLG",
  "CAUTIONS – CONTINUED",
  "HINWEISE – FORTSETZUNG",
  "POINTS DE VIGILANCE – SUITE",
  "AVISOS – CONTINUACIÓN",
  "注意事项（续）",
  "UWAGI – CIĄG DALSZY",
  "BEMÆRKNINGER – FORTSAT"
 ],
 [
  "VERBINDINGEN & WAARSCHUWINGEN",
  "CONNECTIONS & WARNINGS",
  "VERBINDUNGEN & WARNHINWEISE",
  "LIAISONS ET AVERTISSEMENTS",
  "CONEXIONES Y ADVERTENCIAS",
  "连接与警告",
  "POŁĄCZENIA I OSTRZEŻENIA",
  "FORBINDELSER OG ADVARSLER"
 ],
 [
  "BELANGRIJK",
  "IMPORTANT",
  "WICHTIG",
  "IMPORTANT",
  "IMPORTANTE",
  "重要",
  "WAŻNE",
  "VIGTIGT"
 ],
 [
  "LIFT",
  "LIFT",
  "LIFT",
  "REMONTÉE",
  "REMONTES",
  "缆车",
  "WYCIĄG",
  "LIFT"
 ],
 [
  "PISTE",
  "SLOPE",
  "PISTE",
  "PISTE",
  "PISTA",
  "雪道",
  "TRASA",
  "PISTE"
 ],
 [
  "OVERSTAP",
  "TRANSFER",
  "ÜBERGANG",
  "LIAISON",
  "CONEXIÓN",
  "换乘",
  "PRZEJŚCIE",
  "OVERGANG"
 ],
 [
  "LUNCH",
  "LUNCH",
  "MITTAGESSEN",
  "DÉJEUNER",
  "ALMUERZO",
  "午餐",
  "LUNCH",
  "FROKOST"
 ],
 [
  "TERUG",
  "RETURN",
  "RÜCKWEG",
  "RETOUR",
  "REGRESO",
  "返回",
  "POWRÓT",
  "RETUR"
 ],
 [
  "MARGE",
  "BUFFER",
  "PUFFER",
  "MARGE",
  "MARGEN",
  "余量",
  "ZAPAS",
  "BUFFER"
 ],
 [
  "PISTE-, LIFT- EN TIJDSCHEMA",
  "SLOPE, LIFT & TIME SCHEDULE",
  "PISTEN-, LIFT- UND ZEITPLAN",
  "PISTES, REMONTÉES ET HORAIRES",
  "PISTAS, REMONTES Y HORARIOS",
  "雪道、缆车与时间表",
  "TRASY, WYCIĄGI I GODZINY",
  "PISTE-, LIFT- OG TIDSPLAN"
 ],
 [
  "WC-LOCATIES & AANDACHTSPUNTEN",
  "TOILETS & CAUTIONS",
  "WC-STANDORTE & HINWEISE",
  "TOILETTES ET POINTS DE VIGILANCE",
  "ASEOS Y AVISOS",
  "卫生间与注意事项",
  "TOALETY I UWAGI",
  "TOILETTER OG BEMÆRKNINGER"
 ],
 [
  "ROUTEVERSLAG & CONTROLE",
  "ROUTE REPORT & CHECKS",
  "ROUTENBERICHT & KONTROLLE",
  "RAPPORT D’ITINÉRAIRE ET CONTRÔLES",
  "INFORME DE RUTA Y COMPROBACIONES",
  "路线报告与核对",
  "RAPORT TRASY I KONTROLA",
  "RUTERAPPORT OG KONTROL"
 ],
 [
  "VOORGESTELDE REISTIJD",
  "SUGGESTED TRAVEL TIME",
  "VORGESCHLAGENE FAHRZEIT",
  "TEMPS DE TRAJET PROPOSÉ",
  "TIEMPO DE TRAYECTO PROPUESTO",
  "建议行程时间",
  "PROPONOWANY CZAS PRZEJAZDU",
  "FORESLÅET REJSETID"
 ],
 [
  "PISTEKILOMETERS",
  "SLOPE DISTANCE",
  "PISTENKILOMETER",
  "DISTANCE SUR PISTES",
  "DISTANCIA EN PISTAS",
  "雪道里程",
  "KILOMETRY TRAS",
  "PISTEKILOMETER"
 ],
 [
  "LIFTKILOMETERS",
  "LIFT DISTANCE",
  "LIFTKILOMETER",
  "DISTANCE EN REMONTÉES",
  "DISTANCIA EN REMONTES",
  "缆车里程",
  "KILOMETRY WYCIĄGÓW",
  "LIFTKILOMETER"
 ],
 [
  "IN LIFTEN (GESCHAT)",
  "ON LIFTS (EST.)",
  "IM LIFT (GESCHÄTZT)",
  "EN REMONTÉE (EST.)",
  "EN REMONTES (EST.)",
  "乘缆车时间（估计）",
  "W WYCIĄGACH (SZAC.)",
  "I LIFTE (EST.)"
 ],
 [
  "OP PISTES (GESCHAT)",
  "ON SLOPES (EST.)",
  "AUF PISTEN (GESCHÄTZT)",
  "SUR PISTES (EST.)",
  "EN PISTAS (EST.)",
  "雪道时间（估计）",
  "NA TRASACH (SZAC.)",
  "PÅ PISTER (EST.)"
 ],
 [
  "LUNCHLOCATIE",
  "LUNCH LOCATION",
  "MITTAGESSEN: ORT",
  "LIEU DU DÉJEUNER",
  "LUGAR DEL ALMUERZO",
  "午餐地点",
  "MIEJSCE LUNCHU",
  "FROKOSTSTED"
 ],
 [
  "WERKELIJKE SITUATIE CONTROLEREN",
  "CHECK ACTUAL CONDITIONS",
  "TATSÄCHLICHE LAGE PRÜFEN",
  "VÉRIFIER LES CONDITIONS RÉELLES",
  "COMPROBAR CONDICIONES REALES",
  "核实实际情况",
  "SPRAWDŹ RZECZYWISTE WARUNKI",
  "KONTROLLÉR DE FAKTISKE FORHOLD"
 ],
 [
  "OPTIONELE DALAFDALING HOPFGARTEN",
  "OPTIONAL HOPFGARTEN VALLEY DESCENT",
  "OPTIONALE TALABFAHRT HOPFGARTEN",
  "DESCENTE FACULTATIVE VERS HOPFGARTEN",
  "BAJADA OPCIONAL A HOPFGARTEN",
  "可选霍普夫加滕山谷下滑",
  "OPCJONALNY ZJAZD DO HOPFGARTEN",
  "VALGFRI DALNEDFART HOPFGARTEN"
 ],
 [
  "PISTES, LIFTEN EN OVERSTAPPEN",
  "SLOPES, LIFTS AND TRANSFERS",
  "PISTEN, LIFTE UND ÜBERGÄNGE",
  "PISTES, REMONTÉES ET LIAISONS",
  "PISTAS, REMONTES Y CONEXIONES",
  "雪道、缆车与换乘",
  "TRASY, WYCIĄGI I PRZEJŚCIA",
  "PISTER, LIFTE OG OVERGANGE"
 ],
 [
  "SKITRAJECT",
  "SKI LEG",
  "SKIABSCHNITT",
  "TRONÇON À SKI",
  "TRAMO DE ESQUÍ",
  "滑雪路段",
  "ODCINEK NARCIARSKI",
  "SKIETAPE"
 ],
 [
  "Compleet overzicht op volgorde · geen delen weggelaten",
  "Complete overview in order · no legs omitted",
  "Vollständige Übersicht in Reihenfolge · keine Abschnitte ausgelassen",
  "Aperçu complet dans l’ordre · aucun tronçon omis",
  "Resumen completo en orden · ningún tramo omitido",
  "完整顺序概览 · 无遗漏路段",
  "Pełny przegląd w kolejności · bez pominiętych odcinków",
  "Fuld oversigt i rækkefølge · ingen etaper udeladt"
 ],
 [
  "SKI-je is alleen een hulpmiddel. Officiële borden en liftstatus zijn altijd leidend.",
  "SKI-je is only an aid. Official signs and lift status always take precedence.",
  "SKI-je ist nur ein Hilfsmittel. Offizielle Schilder und der Liftstatus haben immer Vorrang.",
  "SKI-je est uniquement une aide. Les panneaux officiels et l'état des remontées priment toujours.",
  "SKI-je es solo una ayuda. Las señales oficiales y el estado de los remontes siempre prevalecen.",
  "SKI-je 仅为辅助工具。官方标志和缆车状态始终优先。",
  "SKI-je to jedynie pomoc. Oficjalne oznakowanie i status wyciągów zawsze mają pierwszeństwo.",
  "SKI-je er kun et hjælpemiddel. Officielle skilte og liftstatus har altid forrang."
 ],
 [
  "Pagina {0}/{1}  ·  Verwachte tijden zijn indicatief. Gecontroleer altijd ter plaatse.",
  "Page {0}/{1} · Times are estimates. Always check on site.",
  "Seite {0}/{1} · Zeitangaben sind Richtwerte. Immer vor Ort prüfen.",
  "Page {0}/{1} · Horaires indicatifs. Vérifiez toujours sur place.",
  "Página {0}/{1} · Horarios orientativos. Comprueba siempre in situ.",
  "第 {0}/{1} 页 · 时间仅供参考。请务必现场核实。",
  "Strona {0}/{1} · Czasy orientacyjne. Zawsze sprawdzaj na miejscu.",
  "Side {0}/{1} · Tiderne er vejledende. Kontrollér altid på stedet."
 ],
 [
  "Pistes op kaart voor planning aangenomen open; controleer actuele sluitingen.",
  "Mapped slopes are assumed open for planning; check current closures.",
  "Pisten werden für die Planung als offen angenommen; aktuelle Sperrungen prüfen.",
  "Les pistes de la carte sont supposées ouvertes ; vérifiez les fermetures actuelles.",
  "Se supone que las pistas del mapa están abiertas; comprueba los cierres actuales.",
  "规划时假定地图上的雪道开放；请核实当前关闭情况。",
  "Na potrzeby planu trasy uznano za otwarte; sprawdź aktualne zamknięcia.",
  "Pisterne på kortet antages åbne ved planlægning; tjek aktuelle lukninger."
 ],
 [
  "Alle pistes en liften met nummers, kloktijden en overgangen staan op het volledige detailoverzicht en de genummerde route-index.",
  "All slopes, lifts, numbers, times and transfers appear in the detailed schedule and numbered route index.",
  "Alle Pisten, Lifte, Nummern, Zeiten und Übergänge stehen im Detailplan und Routenindex.",
  "Toutes les pistes, remontées, numéros, horaires et liaisons figurent dans le détail et l'index numéroté.",
  "Todas las pistas, remontes, números, horarios y conexiones figuran en el detalle y el índice numerado.",
  "完整明细和编号路线索引列出全部雪道、缆车、编号、时间及换乘。",
  "Wszystkie trasy, wyciągi, numery, godziny i przejścia są w szczegółach i numerowanym indeksie.",
  "Alle pister, lifte, numre, tider og overgange findes i detaljeplanen og ruteindekset."
 ],
 [
  "Niet live gecontroleerd · {0} minuten indicatief",
  "Not live verified · about {0} minutes",
  "Nicht live geprüft · ca. {0} Minuten",
  "Non vérifié en direct · environ {0} minutes",
  "Sin verificación en directo · unos {0} minutos",
  "未实时核实 · 约 {0} 分钟",
  "Bez weryfikacji na żywo · około {0} minut",
  "Ikke livekontrolleret · ca. {0} minutter"
 ],
 [
  "Geen gedocumenteerde open verbinding beschikbaar. Het dagtijdschema blijft bruikbaar, maar is geen navigatieroute.",
  "No documented open connection available. The day schedule is not a navigation route.",
  "Keine dokumentierte offene Verbindung verfügbar. Der Tagesplan ist keine Navigationsroute.",
  "Aucune liaison ouverte documentée. Le programme n'est pas un itinéraire de navigation.",
  "No hay conexión abierta documentada. El horario no es una ruta de navegación.",
  "没有记录在案的开放连接。日程可参考，但不是导航路线。",
  "Brak udokumentowanego otwartego połączenia. Harmonogram nie jest trasą nawigacyjną.",
  "Ingen dokumenteret åben forbindelse. Dagsplanen er ikke en navigationsrute."
 ],
 [
  "Blad {0}/{1} · Controleer tijdens het skiën je verwachte doorkomsttijd.",
  "Sheet {0}/{1} · Check your expected passing time while skiing.",
  "Blatt {0}/{1} · Beim Skifahren die voraussichtliche Durchfahrtszeit prüfen.",
  "Feuille {0}/{1} · Vérifiez votre heure de passage prévue pendant le ski.",
  "Hoja {0}/{1} · Comprueba tu hora de paso prevista mientras esquías.",
  "第 {0}/{1} 张 · 滑雪时核对预计通过时间。",
  "Arkusz {0}/{1} · Sprawdzaj przewidywany czas przejazdu podczas jazdy.",
  "Ark {0}/{1} · Tjek din forventede passagetid under skiløbet."
 ],
 [
  "Alle toiletten optioneel; controleer toegankelijkheid en omweg.",
  "All toilets are optional; check access and detours.",
  "Alle Toiletten sind optional; Zugang und Umweg prüfen.",
  "Toutes les toilettes sont facultatives ; vérifiez l'accès et le détour.",
  "Todos los aseos son opcionales; comprueba el acceso y el desvío.",
  "所有卫生间均为可选；核实可达性和绕行。",
  "Wszystkie toalety są opcjonalne; sprawdź dostęp i objazd.",
  "Alle toiletter er valgfrie; tjek adgang og omvej."
 ],
 [
  "Geen officieel onderbouwde WC-plek langs deze gebiedsroute gevonden. Vraag bij liftstations of restaurants.",
  "No officially documented toilet found along this route. Ask at lift stations or restaurants.",
  "Keine offiziell belegte Toilette entlang dieser Route gefunden. An Liftstationen oder in Restaurants nachfragen.",
  "Aucune toilette officiellement documentée sur ce trajet. Renseignez-vous aux stations ou restaurants.",
  "No se ha encontrado un aseo documentado oficialmente. Pregunta en remontes o restaurantes.",
  "此路线未找到有官方依据的卫生间。请向缆车站或餐厅询问。",
  "Nie znaleziono oficjalnie udokumentowanej toalety. Zapytaj przy wyciągach lub w restauracjach.",
  "Intet officielt dokumenteret toilet fundet. Spørg ved liftstationer eller restauranter."
 ],
 [
  "Liftwachttijden, actuele afsluitingen, weer en pistecondities kunnen afwijken.",
  "Lift queues, closures, weather and slope conditions may differ.",
  "Liftwartezeiten, Sperrungen, Wetter und Pistenbedingungen können abweichen.",
  "Les files d'attente, fermetures, météo et conditions des pistes peuvent varier.",
  "Las colas, cierres, tiempo y condiciones de las pistas pueden variar.",
  "缆车排队、关闭、天气及雪道状况可能不同。",
  "Kolejki, zamknięcia, pogoda i warunki na trasach mogą się różnić.",
  "Liftkøer, lukninger, vejr og pisteforhold kan afvige."
 ],
 [
  "Terugweg eerst op tijd starten. GPS is op de panoramakaart niet exact.",
  "Start the return journey in good time. GPS is not exact on the panorama map.",
  "Rückweg rechtzeitig beginnen. GPS auf der Panoramakarte ist nicht exakt.",
  "Entamez le retour à temps. Le GPS n'est pas précis sur la carte panoramique.",
  "Inicia el regreso a tiempo. El GPS no es exacto en el mapa panorámico.",
  "请及时开始返回。全景地图上的 GPS 位置并不精确。",
  "Rozpocznij powrót odpowiednio wcześnie. GPS na mapie panoramicznej nie jest dokładny.",
  "Start returen i god tid. GPS er ikke præcis på panoramakortet."
 ],
 [
  "Kleurcode: liften paars; pistes blauw (tenzij moeilijkheid bekend is).",
  "Colour code: lifts purple; slopes blue unless difficulty is known.",
  "Farbcode: Lifte violett; Pisten blau, sofern Schwierigkeit unbekannt.",
  "Code couleur : remontées violettes, pistes bleues sauf difficulté connue.",
  "Código de color: remontes morados; pistas azules salvo dificultad conocida.",
  "颜色：缆车为紫色；难度未知的雪道为蓝色。",
  "Kolory: wyciągi fioletowe; trasy niebieskie, chyba że znana jest trudność.",
  "Farvekode: lifte lilla; pister blå, medmindre sværhedsgrad er kendt."
 ]
];
 const tables=window.SKI_I18N_DATA?.translations;
 if(!tables)return;
 for(const [i,lang] of ['en','de','fr','es','zh','pl','da'].entries()){
  for(const [key,...values] of rows)Object.defineProperty(tables[lang],key,{value:values[i],enumerable:true,configurable:true,writable:true});
 }
})();
