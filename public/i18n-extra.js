/* Local UI text only; no remote requests or executable translation strings. */
(()=>{
 'use strict';
 const rows=[
 [
  "Mooie dagroute vanuit Hopfgarten",
  "Scenic day route from Hopfgarten",
  "Schöne Tagestour ab Hopfgarten",
  "Belle journée de ski depuis Hopfgarten",
  "Ruta panorámica desde Hopfgarten",
  "从霍普夫加滕出发的风景滑雪路线",
  "Malownicza trasa z Hopfgarten",
  "Flot dagsrute fra Hopfgarten"
 ],
 [
  "Automatisch — zo veel mogelijk afwisseling",
  "Automatic — maximum variety",
  "Automatisch — möglichst abwechslungsreich",
  "Automatique — variété maximale",
  "Automático — máxima variedad",
  "自动选择，尽量丰富多样",
  "Automatycznie — jak największa różnorodność",
  "Automatisk — mest mulig variation"
 ],
 [
  "Hohe Salve panoramarondje & Schernthann",
  "Hohe Salve scenic loop & Schernthann",
  "Hohe Salve Panoramarunde & Schernthann",
  "Boucle panoramique Hohe Salve et Schernthann",
  "Circuito panorámico Hohe Salve y Schernthann",
  "Hohe Salve 全景环线和 Schernthann",
  "Pętla widokowa Hohe Salve i Schernthann",
  "Hohe Salve panoramarute & Schernthann"
 ],
 [
  "Laatste etappe naar Hopfgarten",
  "Final leg to Hopfgarten",
  "Letzte Etappe nach Hopfgarten",
  "Dernière étape vers Hopfgarten",
  "Último tramo hacia Hopfgarten",
  "返回 Hopfgarten 的最后一段",
  "Ostatni etap do Hopfgarten",
  "Sidste etape til Hopfgarten"
 ],
 [
  "Via piste 20a helemaal naar het dalstation",
  "Take slope 20a all the way to the valley station",
  "Über Piste 20a bis zur Talstation",
  "Par la piste 20a jusqu'à la station aval",
  "Por la pista 20a hasta la estación del valle",
  "经20a雪道滑至山谷站",
  "Trasą 20a do stacji dolnej",
  "Via piste 20a helt ned til dalstationen"
 ],
 [
  "Eindigen bij Salvenbahn I-middenstation — afdaling optioneel",
  "Finish at Salvenbahn I mid-station — descent optional",
  "Ende an der Mittelstation Salvenbahn I — Abfahrt optional",
  "Arrivée à la station intermédiaire Salvenbahn I — descente facultative",
  "Final en estación intermedia Salvenbahn I — descenso opcional",
  "在 Salvenbahn I 中间站结束，可选下山",
  "Koniec na stacji pośredniej Salvenbahn I — zjazd opcjonalny",
  "Slut ved Salvenbahn I mellemstation — valgfri nedfart"
 ],
 [
  "De planner controleert een liftvrije dalafdaling via 20a. Bij de middenstation-optie blijft de afdaling een afzonderlijke keuze. Alleen skiën als de officiële piste open is; er wordt extra tijd gereserveerd.",
  "The planner checks a lift-free valley descent via 20a. With the mid-station option, the descent is separate. Ski only when officially open; extra time is reserved.",
  "Der Planer prüft die Talabfahrt über 20a ohne Lift. Bei der Mittelstation bleibt sie optional. Nur bei offiziell geöffneter Piste fahren; zusätzliche Zeit ist eingeplant.",
  "Le planificateur vérifie une descente sans remontée par 20a. Depuis la station intermédiaire, elle reste facultative. Skiez uniquement si la piste est officiellement ouverte; du temps supplémentaire est prévu.",
  "El planificador comprueba el descenso por 20a sin remontes. Desde la estación intermedia es opcional. Esquía solo si la pista está oficialmente abierta; se reserva tiempo adicional.",
  "规划器检查经20a无需缆车的下山路线。中间站选项下可另选下山。仅在雪道正式开放时滑行，并预留额外时间。",
  "Planer sprawdza zjazd 20a bez wyciągu. Przy stacji pośredniej zjazd jest opcjonalny. Zjeżdżaj tylko po oficjalnie otwartej trasie; przewidziano dodatkowy czas.",
  "Planlæggeren kontrollerer nedfarten via 20a uden lift. Ved mellemstationen er nedfarten valgfri. Stå kun på ski på officielt åbne pister; ekstra tid er afsat."
 ],
 [
  "Veiligheidsmarge instellen",
  "Set safety buffer",
  "Sicherheitspuffer einstellen",
  "Définir la marge de sécurité",
  "Ajustar margen de seguridad",
  "设置安全时间余量",
  "Ustaw margines bezpieczeństwa",
  "Indstil sikkerhedsmargen"
 ],
 [
  "Veiligheidsmarge vóór de uiterlijke eindtijd",
  "Safety buffer before latest return",
  "Sicherheitspuffer vor spätester Rückkehr",
  "Marge avant l'heure limite de retour",
  "Margen antes del límite de regreso",
  "最晚返回时间前的安全余量",
  "Margines przed najpóźniejszym powrotem",
  "Sikkerhedsmargen før seneste hjemkomst"
 ],
 [
  "Veiligheidsmarge (minuten)",
  "Safety buffer (minutes)",
  "Sicherheitspuffer (Minuten)",
  "Marge de sécurité (minutes)",
  "Margen de seguridad (minutos)",
  "安全余量（分钟）",
  "Margines bezpieczeństwa (minuty)",
  "Sikkerhedsmargen (minutter)"
 ],
 [
  "Standaard 30 minuten. Mag worden gewijzigd of uitgevinkt. Zonder marge loop je extra risico om te laat bij een lift te zijn.",
  "Default 30 minutes. Adjustable or disabled. Without a buffer you risk missing a lift.",
  "Standard 30 Minuten. Änderbar oder abschaltbar. Ohne Puffer riskierst du, einen Lift zu verpassen.",
  "30 minutes par défaut. Modifiable ou désactivable. Sans marge, vous risquez de manquer une remontée.",
  "30 minutos por defecto. Ajustable o desactivable. Sin margen puedes perder un remonte.",
  "默认30分钟，可调整或关闭。无余量可能错过缆车。",
  "Domyślnie 30 minut. Można zmienić lub wyłączyć. Bez marginesu ryzykujesz spóźnienie na wyciąg.",
  "Standard 30 minutter. Kan ændres eller slås fra. Uden margen risikerer du at komme for sent til en lift."
 ],
 [
  "Skiniveau",
  "Ski level",
  "Skifahrniveau",
  "Niveau de ski",
  "Nivel de esquí",
  "滑雪水平",
  "Poziom narciarski",
  "Skiniveau"
 ],
 [
  "Beginner",
  "Beginner",
  "Anfänger",
  "Débutant",
  "Principiante",
  "初学者",
  "Początkujący",
  "Begynder"
 ],
 [
  "Gevorderd",
  "Advanced",
  "Fortgeschritten",
  "Avancé",
  "Avanzado",
  "进阶",
  "Zaawansowany",
  "Øvet"
 ],
 [
  "Professional",
  "Expert",
  "Experte",
  "Expert",
  "Experto",
  "专家",
  "Ekspert",
  "Ekspert"
 ],
 [
  "Je skiniveau bepaalt de indicatieve reistijden.",
  "Your ski level determines estimated travel times.",
  "Dein Skifahrniveau bestimmt die geschätzten Fahrzeiten.",
  "Votre niveau détermine les temps de trajet estimés.",
  "Tu nivel determina los tiempos estimados.",
  "滑雪水平决定预计用时。",
  "Twój poziom określa szacowane czasy przejazdu.",
  "Dit skiniveau bestemmer de anslåede køretider."
 ],
 [
  "Let op! Wil je ook zwarte pistes op je route?",
  "Caution! Include black slopes in your route?",
  "Achtung! Schwarze Pisten in die Route aufnehmen?",
  "Attention! Inclure des pistes noires?",
  "¡Atención! ¿Incluir pistas negras?",
  "注意！路线是否包含黑色雪道？",
  "Uwaga! Uwzględnić czarne trasy?",
  "Bemærk! Medtage sorte pister?"
 ],
 [
  "Nee, geen zwarte pistes",
  "No black slopes",
  "Nein, keine schwarzen Pisten",
  "Non, pas de pistes noires",
  "No, sin pistas negras",
  "否，不包含黑道",
  "Nie, bez czarnych tras",
  "Nej, ingen sorte pister"
 ],
 [
  "Ja, ik wil ook zwarte pistes",
  "Yes, include black slopes",
  "Ja, auch schwarze Pisten",
  "Oui, inclure les pistes noires",
  "Sí, incluir pistas negras",
  "是，包含黑道",
  "Tak, uwzględnij czarne trasy",
  "Ja, medtag sorte pister"
 ],
 [
  "Zwarte pistes staan altijd standaard uit, ook bij Professional. Bij Beginner zijn ze niet beschikbaar. Onbekende pistekleuren ter plaatse controleren.",
  "Black slopes are off by default, even for experts. Unavailable for beginners. Check unknown slope grades on site.",
  "Schwarze Pisten sind standardmäßig aus, auch für Experten. Für Anfänger nicht verfügbar. Unbekannte Schwierigkeitsgrade vor Ort prüfen.",
  "Les pistes noires sont désactivées par défaut, même pour les experts. Indisponibles aux débutants. Vérifier sur place les niveaux inconnus.",
  "Las pistas negras están desactivadas por defecto, incluso para expertos. No disponibles para principiantes. Comprueba allí los niveles desconocidos.",
  "黑道默认关闭，专家亦如此。初学者不可选择。现场核实未知雪道等级。",
  "Czarne trasy są domyślnie wyłączone, także dla ekspertów. Niedostępne dla początkujących. Sprawdź nieznane poziomy trudności na miejscu.",
  "Sorte pister er som standard slået fra, også for eksperter. Ikke tilgængelige for begyndere. Kontrollér ukendte sværhedsgrader på stedet."
 ],
 [
  "Ochtendpauze inplannen",
  "Schedule morning break",
  "Vormittagspause einplanen",
  "Prévoir une pause matinale",
  "Planificar pausa matinal",
  "安排上午休息",
  "Zaplanuj poranną przerwę",
  "Planlæg formiddagspause"
 ],
 [
  "Ochtendpauze (minuten, standaard 30)",
  "Morning break (minutes, default 30)",
  "Vormittagspause (Minuten, Standard 30)",
  "Pause matinale (minutes, 30 par défaut)",
  "Pausa matinal (minutos, 30 por defecto)",
  "上午休息（分钟，默认30）",
  "Poranna przerwa (minuty, domyślnie 30)",
  "Formiddagspause (minutter, standard 30)"
 ],
 [
  "Middagpauze inplannen",
  "Schedule afternoon break",
  "Nachmittagspause einplanen",
  "Prévoir une pause l'après-midi",
  "Planificar pausa de tarde",
  "安排下午休息",
  "Zaplanuj popołudniową przerwę",
  "Planlæg eftermiddagspause"
 ],
 [
  "Middagpauze (minuten, standaard 30)",
  "Afternoon break (minutes, default 30)",
  "Nachmittagspause (Minuten, Standard 30)",
  "Pause l'après-midi (minutes, 30 par défaut)",
  "Pausa de tarde (minutos, 30 por defecto)",
  "下午休息（分钟，默认30）",
  "Popołudniowa przerwa (minuty, domyślnie 30)",
  "Eftermiddagspause (minutter, standard 30)"
 ],
 [
  "Deel alleen wensen",
  "Share preferences only",
  "Nur Wünsche teilen",
  "Partager uniquement les préférences",
  "Compartir solo preferencias",
  "仅分享偏好",
  "Udostępnij tylko preferencje",
  "Del kun ønsker"
 ],
 [
  "Je keuzes worden op dit apparaat onthouden. Veiligheidsmarge standaard 30 minuten: direct onder de tijden aanpasbaar of uit te schakelen.",
  "Preferences are saved on this device. The default 30-minute safety buffer can be adjusted or disabled below the times.",
  "Deine Auswahl wird auf diesem Gerät gespeichert. Der Standardpuffer von 30 Minuten lässt sich unter den Zeiten ändern oder ausschalten.",
  "Vos choix restent sur cet appareil. La marge de 30 minutes peut être modifiée ou désactivée sous les horaires.",
  "Tus preferencias se guardan en este dispositivo. Ajusta o desactiva el margen de 30 minutos debajo de los horarios.",
  "偏好保存在本设备。可在时间下方调整或关闭默认30分钟的安全余量。",
  "Wybory są zapisywane na tym urządzeniu. Margines 30 minut można zmienić lub wyłączyć pod godzinami.",
  "Dine valg gemmes på enheden. Standardmargenen på 30 minutter kan ændres eller slås fra under tiderne."
 ],
 [
  "Kies start, eind en tijd; SKI-je maakt een volledige dagindeling.",
  "Choose start, finish and times; SKI-je plans the whole day.",
  "Start, Ziel und Zeiten wählen; SKI-je plant den gesamten Tag.",
  "Choisissez départ, arrivée et horaires; SKI-je planifie toute la journée.",
  "Elige inicio, final y horario; SKI-je organiza todo el día.",
  "选择起点、终点和时间，SKI-je 规划全天路线。",
  "Wybierz start, koniec i godziny; SKI-je zaplanuje cały dzień.",
  "Vælg start, slut og tid; SKI-je planlægger hele dagen."
 ],
 [
  "Meld zelf een afgesloten piste of lift. SKI-je vermijdt bekende gemelde verbindingen bij volgende berekeningen. Deze informatie blijft op jouw telefoon.",
  "Report a closed slope or lift. SKI-je avoids reported connections in future calculations. This stays on your phone.",
  "Melde eine gesperrte Piste oder einen Lift. SKI-je meidet gemeldete Verbindungen bei weiteren Berechnungen. Die Daten bleiben auf deinem Handy.",
  "Signalez une piste ou remontée fermée. SKI-je évite les connexions signalées lors des prochains calculs. Ces données restent sur votre téléphone.",
  "Comunica una pista o remonte cerrado. SKI-je evita esas conexiones en futuros cálculos. Los datos permanecen en tu teléfono.",
  "报告关闭的雪道或缆车。SKI-je 后续规划会避开已报告的连接。信息仅保存在手机。",
  "Zgłoś zamkniętą trasę lub wyciąg. SKI-je pominie zgłoszone połączenia w kolejnych obliczeniach. Dane pozostają w telefonie.",
  "Meld en lukket piste eller lift. SKI-je undgår meldte forbindelser ved næste beregning. Oplysningerne bliver på din telefon."
 ],
 [
  "Wat is gesloten?",
  "What is closed?",
  "Was ist gesperrt?",
  "Qu'est-ce qui est fermé?",
  "¿Qué está cerrado?",
  "什么已关闭？",
  "Co jest zamknięte?",
  "Hvad er lukket?"
 ],
 [
  "Gebiedsverbinding",
  "Area connection",
  "Gebietsverbindung",
  "Liaison entre secteurs",
  "Conexión entre zonas",
  "区域连接",
  "Połączenie obszarów",
  "Områdeforbindelse"
 ],
 [
  "Nummer of verbindingscode",
  "Number or connection code",
  "Nummer oder Verbindungscode",
  "Numéro ou code de liaison",
  "Número o código de conexión",
  "编号或连接代码",
  "Numer lub kod połączenia",
  "Nummer eller forbindelseskode"
 ],
 [
  "Toelichting (optioneel)",
  "Details (optional)",
  "Erläuterung (optional)",
  "Précision (facultative)",
  "Detalles (opcional)",
  "说明（可选）",
  "Opis (opcjonalnie)",
  "Forklaring (valgfri)"
 ],
 [
  "Foto lift/hut",
  "Lift/hut photo",
  "Lift-/Hüttenfoto",
  "Photo remontée/refuge",
  "Foto remonte/refugio",
  "缆车/山屋照片",
  "Zdjęcie wyciągu/schroniska",
  "Foto af lift/hytte"
 ],
 [
  "Waar ben je? Zoom naar:",
  "Where are you? Zoom to:",
  "Wo bist du? Zoomen zu:",
  "Où êtes-vous? Zoom sur:",
  "¿Dónde estás? Ampliar:",
  "你在哪里？缩放至：",
  "Gdzie jesteś? Przybliż:",
  "Hvor er du? Zoom til:"
 ],
 [
  "SkiWelt-panorama 2026–2027: rechtstreeks binnen SKI-je. Bij slecht bereik kan de lokale voorbeeldkaart verschijnen; deze is niet scherp genoeg voor exacte pistenummers.",
  "SkiWelt panorama 2026–2027 in SKI-je. Poor reception may show the local preview, which is not sharp enough for exact slope numbers.",
  "SkiWelt-Panorama 2026–2027 direkt in SKI-je. Bei schlechtem Empfang erscheint ggf. die lokale Vorschau, die für genaue Pistennummern zu unscharf ist.",
  "Panorama SkiWelt 2026–2027 dans SKI-je. Si le réseau est faible, l'aperçu local peut s'afficher, trop flou pour les numéros précis.",
  "Panorama SkiWelt 2026–2027 en SKI-je. Con mala cobertura puede aparecer una vista local sin suficiente nitidez para los números exactos.",
  "SKI-je 内的2026–2027全景图。信号差时可能显示本地预览，无法清晰辨认雪道编号。",
  "Panorama SkiWelt 2026–2027 w SKI-je. Przy słabym zasięgu może pojawić się podgląd, zbyt niewyraźny dla dokładnych numerów tras.",
  "SkiWelt-panorama 2026–2027 i SKI-je. Ved dårlig forbindelse kan den lokale oversigt vises, men den er for uskarp til præcise pistenumre."
 ],
 [
  "Op de panoramakaart zoom je naar een skidorp; dit is een illustratie en geen exacte GPS-ondergrond. De GPS-kaart hierboven toont je werkelijke locatie.",
  "Zoom to a ski village on the panorama. It is an illustration, not a precise GPS map. The GPS map above shows your actual location.",
  "Zoome auf der Panoramakarte zu einem Skiort. Sie ist eine Illustration, keine genaue GPS-Karte. Die GPS-Karte oben zeigt deinen Standort.",
  "Zoomez sur un village dans le panorama. C'est une illustration, pas une carte GPS précise. La carte GPS ci-dessus affiche votre position.",
  "Amplía un pueblo en el panorama. Es una ilustración, no un mapa GPS exacto. El mapa GPS superior muestra tu posición real.",
  "在全景图上缩放至滑雪村。这是示意图，不是精确GPS底图。上方GPS地图显示实际位置。",
  "Przybliż miejscowość na panoramie. To ilustracja, nie dokładna mapa GPS. Mapa GPS powyżej pokazuje rzeczywiste położenie.",
  "Zoom til en skilandsby på panoramaet. Det er en illustration, ikke et præcist GPS-kort. GPS-kortet ovenfor viser din position."
 ],
 [
  "Kaartlagen en uitleg",
  "Map layers and help",
  "Kartenebenen und Erklärung",
  "Couches et aide de la carte",
  "Capas y ayuda del mapa",
  "地图图层与说明",
  "Warstwy mapy i pomoc",
  "Kortlag og forklaring"
 ],
 [
  "Scherm vullen",
  "Fill screen",
  "Bildschirm ausfüllen",
  "Plein écran",
  "Pantalla completa",
  "全屏",
  "Wypełnij ekran",
  "Fyld skærmen"
 ],
 [
  "Kaart opnieuw laden",
  "Reload map",
  "Karte neu laden",
  "Recharger la carte",
  "Recargar mapa",
  "重新加载地图",
  "Wczytaj mapę ponownie",
  "Genindlæs kort"
 ],
 [
  "Liften weergeven",
  "Show lifts",
  "Lifte anzeigen",
  "Afficher les remontées",
  "Mostrar remontes",
  "显示缆车",
  "Pokaż wyciągi",
  "Vis lifte"
 ],
 [
  "Restaurants weergeven",
  "Show restaurants",
  "Restaurants anzeigen",
  "Afficher les restaurants",
  "Mostrar restaurantes",
  "显示餐厅",
  "Pokaż restauracje",
  "Vis restauranter"
 ],
 [
  "Liftmarkeringen verborgen",
  "Lift markers hidden",
  "Liftmarkierungen ausgeblendet",
  "Repères de remontées masqués",
  "Marcadores de remontes ocultos",
  "缆车标记已隐藏",
  "Znaczniki wyciągów ukryte",
  "Liftmarkeringer skjult"
 ],
 [
  "Markeringen verborgen",
  "Markers hidden",
  "Markierungen ausgeblendet",
  "Repères masqués",
  "Marcadores ocultos",
  "标记已隐藏",
  "Znaczniki ukryte",
  "Markeringer skjult"
 ],
 [
  "wit liftnummer",
  "white lift number",
  "weiße Liftnummer",
  "numéro de remontée blanc",
  "número de remonte blanco",
  "白色缆车编号",
  "biały numer wyciągu",
  "hvidt liftnummer"
 ],
 [
  "groen hutnummer",
  "green hut number",
  "grüne Hüttennummer",
  "numéro de refuge vert",
  "número de refugio verde",
  "绿色山屋编号",
  "zielony numer schroniska",
  "grønt hyttenummer"
 ],
 [
  "pistes",
  "slopes",
  "Pisten",
  "pistes",
  "pistas",
  "雪道",
  "trasy",
  "pister"
 ],
 [
  "Route door deelgebieden (indicatief, géén exacte piste/GPS-navigatie)",
  "Route between sectors (indicative, not precise slope/GPS navigation)",
  "Route durch Teilgebiete (Richtwert, keine exakte Pisten-/GPS-Navigation)",
  "Itinéraire entre secteurs (indicatif, sans navigation GPS précise)",
  "Ruta entre sectores (orientativa, sin navegación GPS exacta)",
  "区域间路线（仅供参考，非精确雪道/GPS导航）",
  "Trasa między obszarami (orientacyjna, bez dokładnej nawigacji GPS)",
  "Rute mellem delområder (vejledende, ikke præcis piste-/GPS-navigation)"
 ],
 [
  "Binnenfoto niet geverifieerd.",
  "Interior photo not verified.",
  "Innenfoto nicht verifiziert.",
  "Photo intérieure non vérifiée.",
  "Foto interior no verificada.",
  "室内照片未经验证。",
  "Zdjęcie wnętrza niezweryfikowane.",
  "Indendørsfoto ikke verificeret."
 ],
 [
  "Restaurantinformatie",
  "Restaurant information",
  "Restaurantinformationen",
  "Informations restaurant",
  "Información del restaurante",
  "餐厅信息",
  "Informacje o restauracji",
  "Restaurantinformation"
 ],
 [
  "Meer foto's & bronnen",
  "More photos & sources",
  "Weitere Fotos & Quellen",
  "Plus de photos et sources",
  "Más fotos y fuentes",
  "更多照片和来源",
  "Więcej zdjęć i źródeł",
  "Flere fotos og kilder"
 ],
 [
  "Kies een lift",
  "Choose a lift",
  "Lift auswählen",
  "Choisir une remontée",
  "Elige un remonte",
  "选择缆车",
  "Wybierz wyciąg",
  "Vælg en lift"
 ],
 [
  "De markering duidt een deelgebied aan, niet de exacte plek van de lift. Zoek hieronder op nummer of naam.",
  "The marker identifies a sector, not the precise lift location. Search by number or name below.",
  "Die Markierung zeigt ein Teilgebiet, nicht den genauen Liftstandort. Suche unten nach Nummer oder Name.",
  "Le repère indique un secteur, pas la position exacte. Cherchez par numéro ou nom ci-dessous.",
  "El marcador indica una zona, no la ubicación exacta. Busca por número o nombre.",
  "标记代表区域而非精确缆车位置。请按编号或名称搜索。",
  "Znacznik wskazuje obszar, nie dokładne położenie wyciągu. Szukaj według numeru lub nazwy.",
  "Markeringen viser et delområde, ikke liftens præcise position. Søg efter nummer eller navn."
 ],
 [
  "Foto volgt",
  "Photo pending",
  "Foto folgt",
  "Photo à venir",
  "Foto pendiente",
  "照片待补充",
  "Zdjęcie wkrótce",
  "Foto følger"
 ],
 [
  "Officiële liftstatus",
  "Official lift status",
  "Offizieller Liftstatus",
  "État officiel des remontées",
  "Estado oficial de remontes",
  "官方缆车状态",
  "Oficjalny status wyciągów",
  "Officiel liftstatus"
 ],
 [
  "Liftfoto's & bronnen",
  "Lift photos & sources",
  "Liftfotos & Quellen",
  "Photos de remontées et sources",
  "Fotos de remontes y fuentes",
  "缆车照片与来源",
  "Zdjęcia wyciągów i źródła",
  "Liftfotos og kilder"
 ],
 [
  "Bron:",
  "Source:",
  "Quelle:",
  "Source :",
  "Fuente:",
  "来源：",
  "Źródło:",
  "Kilde:"
 ],
 [
  "Radar:",
  "Radar:",
  "Radar:",
  "Radar :",
  "Radar:",
  "雷达：",
  "Radar:",
  "Radar:"
 ],
 [
  ". Geen garantie voor dekking op alle berglocaties.",
  ". Coverage at all mountain locations is not guaranteed.",
  ". Keine Garantie für Abdeckung an allen Bergstandorten.",
  ". Couverture non garantie partout en montagne.",
  ". No se garantiza cobertura en toda la montaña.",
  "。不保证覆盖所有山区。",
  ". Brak gwarancji pokrycia wszystkich lokalizacji górskich.",
  ". Dækning på alle bjerglokationer garanteres ikke."
 ],
 [
  "17 bergwebcams en 3 dalwebcams van SkiWelt op één plek. Kies een gebied en bekijk de beelden groot.",
  "17 mountain and 3 valley webcams in one place. Choose an area and view large images.",
  "17 Berg- und 3 Talwebcams an einem Ort. Wähle ein Gebiet und sieh die Bilder groß.",
  "17 webcams de montagne et 3 de vallée au même endroit. Choisissez un secteur et agrandissez les images.",
  "17 cámaras de montaña y 3 del valle en un sitio. Elige zona y amplía las imágenes.",
  "17个山上和3个山谷摄像头集中展示。选择区域并查看大图。",
  "17 kamer górskich i 3 dolinne w jednym miejscu. Wybierz obszar i oglądaj duże obrazy.",
  "17 bjergwebcams og 3 dalwebcams samlet. Vælg område og se billederne stort."
 ],
 [
  "Alle SkiWelt-webcams",
  "All SkiWelt webcams",
  "Alle SkiWelt-Webcams",
  "Toutes les webcams SkiWelt",
  "Todas las cámaras SkiWelt",
  "所有SkiWelt摄像头",
  "Wszystkie kamery SkiWelt",
  "Alle SkiWelt-webcams"
 ],
 [
  "Dalwebcams",
  "Valley webcams",
  "Talwebcams",
  "Webcams de vallée",
  "Cámaras del valle",
  "山谷摄像头",
  "Kamery w dolinie",
  "Dalwebcams"
 ],
 [
  "Livebeelden worden rechtstreeks bij de webcam-aanbieder geladen. Soms staat die geen weergave binnen een andere app toe; gebruik dan de knop naar de officiële livecam.",
  "Live images load directly from the provider. If embedding is blocked, use the official webcam button.",
  "Livebilder werden direkt vom Anbieter geladen. Bei blockierter Einbettung die offizielle Webcam öffnen.",
  "Les images sont chargées directement depuis le fournisseur. Si l'intégration est bloquée, ouvrez la webcam officielle.",
  "Las imágenes se cargan del proveedor. Si bloquea la inserción, abre la cámara oficial.",
  "实时图像直接来自提供方。如不允许嵌入，请打开官方摄像头。",
  "Obraz jest ładowany bezpośrednio od dostawcy. Jeśli osadzanie jest zablokowane, otwórz oficjalną kamerę.",
  "Livebilleder hentes direkte fra udbyderen. Hvis indlejring blokeres, åbnes den officielle webcam."
 ],
 [
  "De webcams zijn beelden van externe aanbieders, geen garantie voor pistecondities of liftopenstelling. Gebruik de officiële SkiWelt-liftstatus voor actuele beslissingen.",
  "Webcams are external images, not proof of slope conditions or lift operation. Use official SkiWelt lift status for decisions.",
  "Webcams zeigen externe Bilder, keine Garantie für Pistenbedingungen oder Liftbetrieb. Nutze den offiziellen SkiWelt-Liftstatus.",
  "Les webcams externes ne garantissent ni l'état des pistes ni l'ouverture des remontées. Consultez l'état officiel SkiWelt.",
  "Las cámaras externas no garantizan el estado de pistas ni la apertura de remontes. Consulta el estado oficial SkiWelt.",
  "外部摄像头图像不保证雪道状况或缆车开放。决策请参考SkiWelt官方状态。",
  "Kamery zewnętrzne nie gwarantują warunków na trasach ani pracy wyciągów. Sprawdzaj oficjalny status SkiWelt.",
  "Eksterne webcams garanterer ikke pisteforhold eller åbne lifte. Brug officiel SkiWelt-liftstatus."
 ],
 [
  "Beeld laden…",
  "Loading image…",
  "Bild wird geladen…",
  "Chargement de l'image…",
  "Cargando imagen…",
  "正在加载图像…",
  "Ładowanie obrazu…",
  "Indlæser billede…"
 ],
 [
  "Een externe livecam kan het insluiten blokkeren. Blijft het beeld leeg? Gebruik de officiële cameraknop hieronder.",
  "An external webcam may block embedding. If the image stays blank, use the official camera button below.",
  "Eine externe Webcam kann die Einbettung blockieren. Bleibt das Bild leer, nutze unten die offizielle Kamera.",
  "Une webcam externe peut bloquer l'intégration. Si l'image reste vide, utilisez le bouton officiel ci-dessous.",
  "Una cámara externa puede bloquear la inserción. Si no aparece imagen, usa el botón oficial inferior.",
  "外部摄像头可能禁止嵌入。若图像为空，请使用下方官方按钮。",
  "Kamera zewnętrzna może blokować osadzanie. Gdy obraz jest pusty, użyj oficjalnego przycisku poniżej.",
  "En ekstern webcam kan blokere indlejring. Hvis billedet er tomt, brug den officielle knap nedenfor."
 ],
 [
  "Terug naar webcams",
  "Back to webcams",
  "Zurück zu Webcams",
  "Retour aux webcams",
  "Volver a cámaras",
  "返回摄像头",
  "Wróć do kamer",
  "Tilbage til webcams"
 ],
 [
  "Ververs foto",
  "Refresh photo",
  "Foto aktualisieren",
  "Actualiser la photo",
  "Actualizar foto",
  "刷新照片",
  "Odśwież zdjęcie",
  "Opdater foto"
 ],
 [
  "Open bij aanbieder",
  "Open at provider",
  "Beim Anbieter öffnen",
  "Ouvrir chez le fournisseur",
  "Abrir en proveedor",
  "在提供方打开",
  "Otwórz u dostawcy",
  "Åbn hos udbyderen"
 ],
 [
  "Mijn highlights",
  "My highlights",
  "Meine Highlights",
  "Mes moments forts",
  "Mis destacados",
  "我的精彩时刻",
  "Moje najważniejsze chwile",
  "Mine højdepunkter"
 ],
 [
  "Mijn ski-highlights",
  "My ski highlights",
  "Meine Ski-Highlights",
  "Mes temps forts à ski",
  "Mis logros de esquí",
  "我的滑雪亮点",
  "Moje narciarskie osiągnięcia",
  "Mine skihøjdepunkter"
 ],
 [
  "Op dit toestel",
  "On this device",
  "Auf diesem Gerät",
  "Sur cet appareil",
  "En este dispositivo",
  "在本设备",
  "Na tym urządzeniu",
  "På denne enhed"
 ],
 [
  "Skidagen",
  "Ski days",
  "Skitage",
  "Journées de ski",
  "Días de esquí",
  "滑雪天数",
  "Dni na nartach",
  "Skidage"
 ],
 [
  "GPS-kilometers totaal",
  "Total GPS distance",
  "GPS-Kilometer gesamt",
  "Distance GPS totale",
  "Distancia GPS total",
  "GPS总里程",
  "Łączna odległość GPS",
  "GPS-kilometer i alt"
 ],
 [
  "Mooiste afstandsdag",
  "Longest ski day",
  "Längster Skitag",
  "Journée la plus longue",
  "Día de mayor distancia",
  "最长滑雪里程日",
  "Najdłuższy dzień",
  "Længste skidag"
 ],
 [
  "Tijd geregistreerd",
  "Time recorded",
  "Erfasste Zeit",
  "Temps enregistré",
  "Tiempo registrado",
  "记录时长",
  "Zarejestrowany czas",
  "Registreret tid"
 ],
 [
  "Hoogste GPS-meting",
  "Highest GPS reading",
  "Höchste GPS-Messung",
  "Altitude GPS maximale",
  "Mayor altitud GPS",
  "GPS最高海拔",
  "Najwyższy pomiar GPS",
  "Højeste GPS-måling"
 ],
 [
  "Mijn ski-paspoort",
  "My ski passport",
  "Mein Skipassbuch",
  "Mon passeport ski",
  "Mi pasaporte de esquí",
  "我的滑雪护照",
  "Mój paszport narciarski",
  "Mit skipas"
 ],
 [
  "Maak een skiherinnering met foto",
  "Create a ski memory with a photo",
  "Skierinnerung mit Foto erstellen",
  "Créer un souvenir avec photo",
  "Crear recuerdo con foto",
  "用照片制作滑雪回忆",
  "Utwórz pamiątkę ze zdjęciem",
  "Lav et skiminde med foto"
 ],
 [
  "Nog geen foto gekozen.",
  "No photo selected yet.",
  "Noch kein Foto ausgewählt.",
  "Aucune photo sélectionnée.",
  "Sin foto seleccionada.",
  "尚未选择照片。",
  "Nie wybrano zdjęcia.",
  "Intet foto valgt."
 ],
 [
  "Maak deelbare ski-kaart",
  "Create shareable ski card",
  "Teilbare Skikarte erstellen",
  "Créer une carte ski à partager",
  "Crear tarjeta de esquí para compartir",
  "制作可分享的滑雪卡片",
  "Utwórz kartę do udostępnienia",
  "Lav delbart skikort"
 ],
 [
  "Kopieer mijn highlights",
  "Copy my highlights",
  "Meine Highlights kopieren",
  "Copier mes moments forts",
  "Copiar mis destacados",
  "复制我的精彩记录",
  "Kopiuj osiągnięcia",
  "Kopiér mine højdepunkter"
 ],
 [
  "Jouw persoonlijke skiherinneringen, automatisch berekend uit opgeslagen skidagen. Geen extra GPS of internet nodig.",
  "Personal ski memories calculated from saved ski days. No extra GPS or internet needed.",
  "Persönliche Skierinnerungen aus gespeicherten Skitagen. Kein zusätzliches GPS oder Internet nötig.",
  "Souvenirs de ski calculés à partir des journées enregistrées. Sans GPS ni Internet supplémentaires.",
  "Recuerdos calculados a partir de días guardados. No hace falta GPS ni Internet adicional.",
  "根据已保存滑雪记录自动生成个人回忆，无需额外GPS或网络。",
  "Wspomnienia obliczone z zapisanych dni. Bez dodatkowego GPS lub internetu.",
  "Personlige skiminder beregnet ud fra gemte skidage. Intet ekstra GPS eller internet."
 ],
 [
  "Leuke mijlpalen zonder wedstrijd of extra metingen. Iedere mijlpaal komt uit je eigen opgeslagen daggegevens.",
  "Fun milestones without competition or extra measurements, based on your saved days.",
  "Meilensteine ohne Wettbewerb oder zusätzliche Messungen, aus deinen gespeicherten Tagen.",
  "Jalons ludiques sans compétition ni mesures supplémentaires, issus de vos journées enregistrées.",
  "Hitos sin competición ni mediciones adicionales, basados en tus días guardados.",
  "有趣的里程碑，不竞赛、不增加测量，来自已保存记录。",
  "Kamienie milowe bez rywalizacji i dodatkowych pomiarów, z zapisanych dni.",
  "Sjove milepæle uden konkurrence eller ekstra målinger fra gemte skidage."
 ],
 [
  "Nog geen opgeslagen skidag. Start je eerste GPS-registratie en bewaar de dag om highlights te zien.",
  "No saved ski day yet. Start GPS tracking and save your day to see highlights.",
  "Noch kein Skitag gespeichert. Starte GPS-Aufzeichnung und speichere den Tag für Highlights.",
  "Aucune journée enregistrée. Lancez le suivi GPS et enregistrez votre journée.",
  "Aún no hay días guardados. Inicia el GPS y guarda el día para ver destacados.",
  "尚无滑雪记录。开始GPS记录并保存当天，即可查看亮点。",
  "Brak zapisanych dni. Rozpocznij GPS i zapisz dzień, aby zobaczyć osiągnięcia.",
  "Ingen gemt skidag. Start GPS-registrering og gem dagen for at se højdepunkter."
 ],
 [
  "Kies optioneel een eigen foto van je telefoon. Die wordt alleen voor jouw deelkaart gebruikt en niet geüpload of opgeslagen.",
  "Optionally choose a photo from your phone. It is used only for your share card, not uploaded or saved.",
  "Optional ein Foto vom Handy wählen. Es wird nur für deine Teilkarte genutzt, nicht hochgeladen oder gespeichert.",
  "Choisissez éventuellement une photo du téléphone. Elle sert uniquement à la carte à partager, sans envoi ni stockage.",
  "Elige opcionalmente una foto del móvil. Solo se usa en la tarjeta, sin subirla ni guardarla.",
  "可选手机照片，仅用于分享卡片，不上传或保存。",
  "Opcjonalnie wybierz zdjęcie telefonu. Tylko do karty, bez wysyłania i zapisywania.",
  "Vælg eventuelt et foto fra telefonen. Bruges kun til delingskortet, ikke uploadet eller gemt."
 ],
 [
  "GPS-afstand kan liften omvatten; snelheid is een GPS-schatting, geen aanmoediging om harder te skiën.",
  "GPS distance may include lifts; speed is an estimate, not encouragement to ski faster.",
  "GPS-Distanz kann Lifte enthalten; Geschwindigkeit ist eine Schätzung, kein Anreiz schneller zu fahren.",
  "La distance GPS peut inclure les remontées; la vitesse est estimée et n'incite pas à skier plus vite.",
  "La distancia GPS puede incluir remontes; la velocidad es estimada, no invita a esquiar más rápido.",
  "GPS距离可能包含缆车，速度为估算，并非鼓励加速。",
  "Dystans GPS może obejmować wyciągi; prędkość jest szacunkiem, nie zachętą do szybszej jazdy.",
  "GPS-afstand kan omfatte lifte; hastighed er et skøn, ikke en opfordring til at køre hurtigere."
 ],
 [
  "Groepsfoto",
  "Group photo",
  "Gruppenfoto",
  "Photo de groupe",
  "Foto de grupo",
  "群组照片",
  "Zdjęcie grupowe",
  "Gruppefoto"
 ],
 [
  "Onze groepsfoto",
  "Our group photo",
  "Unser Gruppenfoto",
  "Notre photo de groupe",
  "Nuestra foto de grupo",
  "我们的群组照片",
  "Nasze zdjęcie grupowe",
  "Vores gruppefoto"
 ],
 [
  "Foto kiezen of vervangen",
  "Choose or replace photo",
  "Foto wählen oder ersetzen",
  "Choisir ou remplacer la photo",
  "Elegir o cambiar foto",
  "选择或替换照片",
  "Wybierz lub zmień zdjęcie",
  "Vælg eller erstat foto"
 ],
 [
  "Foto verwijderen",
  "Remove photo",
  "Foto entfernen",
  "Supprimer la photo",
  "Eliminar foto",
  "删除照片",
  "Usuń zdjęcie",
  "Fjern foto"
 ],
 [
  "Iedereen in je groep ziet dezelfde foto. De beheerder kan deze aanpassen.",
  "Everyone in your group sees the same photo. The admin can change it.",
  "Alle in deiner Gruppe sehen dasselbe Foto. Der Administrator kann es ändern.",
  "Tout le groupe voit la même photo. L'administrateur peut la modifier.",
  "Todo el grupo ve la misma foto. El administrador puede cambiarla.",
  "群组成员看到同一照片，管理员可修改。",
  "Wszyscy w grupie widzą to samo zdjęcie. Administrator może je zmienić.",
  "Alle i gruppen ser samme foto. Administratoren kan ændre det."
 ],
 [
  "Onze groepsafspraak",
  "Our group meeting",
  "Unser Gruppentreffen",
  "Notre rendez-vous de groupe",
  "Nuestro encuentro de grupo",
  "我们的群组约定",
  "Nasze spotkanie grupowe",
  "Vores gruppeaftale"
 ],
 [
  "Er is nog geen groepsafspraak.",
  "No group meeting yet.",
  "Noch kein Gruppentreffen vereinbart.",
  "Aucun rendez-vous de groupe prévu.",
  "Aún no hay encuentro de grupo.",
  "尚无群组约定。",
  "Brak spotkania grupowego.",
  "Ingen gruppeaftale endnu."
 ],
 [
  "Afspraak maken of wijzigen",
  "Create or edit meeting",
  "Treffen erstellen oder ändern",
  "Créer ou modifier le rendez-vous",
  "Crear o modificar encuentro",
  "创建或修改约定",
  "Utwórz lub zmień spotkanie",
  "Opret eller rediger aftale"
 ],
 [
  "Datum en tijd (lokale tijd)",
  "Date and time (local time)",
  "Datum und Uhrzeit (Ortszeit)",
  "Date et heure (heure locale)",
  "Fecha y hora (hora local)",
  "日期与时间（当地时间）",
  "Data i godzina (czas lokalny)",
  "Dato og tid (lokal tid)"
 ],
 [
  "Afspraak opslaan",
  "Save meeting",
  "Treffen speichern",
  "Enregistrer le rendez-vous",
  "Guardar encuentro",
  "保存约定",
  "Zapisz spotkanie",
  "Gem aftale"
 ],
 [
  "Afspraak verwijderen",
  "Delete meeting",
  "Treffen löschen",
  "Supprimer le rendez-vous",
  "Eliminar encuentro",
  "删除约定",
  "Usuń spotkanie",
  "Slet aftale"
 ],
 [
  "Groepsgesprek",
  "Group chat",
  "Gruppenchat",
  "Chat de groupe",
  "Chat de grupo",
  "群聊",
  "Czat grupowy",
  "Gruppechat"
 ],
 [
  "Nog geen berichten.",
  "No messages yet.",
  "Noch keine Nachrichten.",
  "Aucun message.",
  "Aún no hay mensajes.",
  "暂无消息。",
  "Brak wiadomości.",
  "Ingen beskeder endnu."
 ],
 [
  "Bericht aan de groep",
  "Message to the group",
  "Nachricht an die Gruppe",
  "Message au groupe",
  "Mensaje al grupo",
  "发送群组消息",
  "Wiadomość do grupy",
  "Besked til gruppen"
 ],
 [
  "Verstuur",
  "Send",
  "Senden",
  "Envoyer",
  "Enviar",
  "发送",
  "Wyślij",
  "Send"
 ],
 [
  "Skigroepen",
  "Ski groups",
  "Skigruppen",
  "Groupes de ski",
  "Grupos de esquí",
  "滑雪群组",
  "Grupy narciarskie",
  "Skigrupper"
 ],
 [
  "Begin zelf een groep of sluit je aan bij iemand anders. Je kiest zelf je groepsnaam.",
  "Create a group or join another. Choose your own group name.",
  "Erstelle eine Gruppe oder tritt einer bei. Wähle deinen Gruppennamen.",
  "Créez un groupe ou rejoignez-en un. Choisissez son nom.",
  "Crea un grupo o únete a otro. Elige tu nombre de grupo.",
  "创建或加入群组，自选群组名称。",
  "Utwórz grupę lub dołącz do innej. Wybierz własną nazwę.",
  "Opret en gruppe eller deltag i en anden. Vælg gruppenavn."
 ],
 [
  "Nieuwe groep aanmaken",
  "Create a new group",
  "Neue Gruppe erstellen",
  "Créer un nouveau groupe",
  "Crear nuevo grupo",
  "创建新群组",
  "Utwórz nową grupę",
  "Opret ny gruppe"
 ],
 [
  "1. Jouw naam",
  "1. Your name",
  "1. Dein Name",
  "1. Votre nom",
  "1. Tu nombre",
  "1. 你的姓名",
  "1. Twoje imię",
  "1. Dit navn"
 ],
 [
  "2. Groepsnaam",
  "2. Group name",
  "2. Gruppenname",
  "2. Nom du groupe",
  "2. Nombre del grupo",
  "2. 群组名称",
  "2. Nazwa grupy",
  "2. Gruppenavn"
 ],
 [
  "3. Beheerderscode",
  "3. Admin code",
  "3. Administratorcode",
  "3. Code administrateur",
  "3. Código administrador",
  "3. 管理员代码",
  "3. Kod administratora",
  "3. Administratorkode"
 ],
 [
  "(zichtbaar voor groepsleden)",
  "(visible to group members)",
  "(für Gruppenmitglieder sichtbar)",
  "(visible par les membres)",
  "(visible para los miembros)",
  "（群组成员可见）",
  "(widoczne dla członków)",
  "(synligt for gruppemedlemmer)"
 ],
 [
  "(vrij te kiezen)",
  "(your choice)",
  "(frei wählbar)",
  "(au choix)",
  "(a tu elección)",
  "（自由选择）",
  "(dowolna nazwa)",
  "(valgfrit)"
 ],
 [
  "(alleen voor aanmaken)",
  "(creation only)",
  "(nur zum Erstellen)",
  "(création uniquement)",
  "(solo para crear)",
  "（仅用于创建）",
  "(tylko do utworzenia)",
  "(kun ved oprettelse)"
 ],
 [
  "Beheerderscode",
  "Admin code",
  "Administratorcode",
  "Code administrateur",
  "Código administrador",
  "管理员代码",
  "Kod administratora",
  "Administratorkode"
 ],
 [
  "Groep aanmaken",
  "Create group",
  "Gruppe erstellen",
  "Créer le groupe",
  "Crear grupo",
  "创建群组",
  "Utwórz grupę",
  "Opret gruppe"
 ],
 [
  "Groep aanmaken lukt niet?",
  "Can't create a group?",
  "Gruppe lässt sich nicht erstellen?",
  "Impossible de créer un groupe?",
  "¿No puedes crear un grupo?",
  "无法创建群组？",
  "Nie można utworzyć grupy?",
  "Kan du ikke oprette en gruppe?"
 ],
 [
  "Controleer Cloudflare-groepsserver",
  "Check Cloudflare group server",
  "Cloudflare-Gruppenserver prüfen",
  "Vérifier le serveur Cloudflare",
  "Comprobar servidor Cloudflare",
  "检查Cloudflare群组服务器",
  "Sprawdź serwer Cloudflare",
  "Kontrollér Cloudflare-gruppeserver"
 ],
 [
  "Deelnemen aan bestaande groep",
  "Join existing group",
  "Bestehender Gruppe beitreten",
  "Rejoindre un groupe existant",
  "Unirse a un grupo existente",
  "加入现有群组",
  "Dołącz do istniejącej grupy",
  "Deltag i eksisterende gruppe"
 ],
 [
  "Jouw naam voor deze groep",
  "Your name for this group",
  "Dein Name für diese Gruppe",
  "Votre nom dans ce groupe",
  "Tu nombre para este grupo",
  "你在群组中的名称",
  "Twoje imię w tej grupie",
  "Dit navn i gruppen"
 ],
 [
  "Vraag de groepsbeheerder om een uitnodigingslink.",
  "Ask the group admin for an invitation link.",
  "Bitte den Gruppenadministrator um einen Einladungslink.",
  "Demandez un lien d'invitation à l'administrateur.",
  "Pide al administrador un enlace de invitación.",
  "向群组管理员索取邀请链接。",
  "Poproś administratora o link zaproszenia.",
  "Bed gruppeadministratoren om et invitationslink."
 ],
 [
  "Losse afspraak delen",
  "Share a standalone meeting",
  "Einzelnes Treffen teilen",
  "Partager un rendez-vous indépendant",
  "Compartir encuentro independiente",
  "分享独立约定",
  "Udostępnij osobne spotkanie",
  "Del en enkeltstående aftale"
 ],
 [
  "Naam bij de afspraak (optioneel)",
  "Meeting name (optional)",
  "Name des Treffens (optional)",
  "Nom du rendez-vous (facultatif)",
  "Nombre del encuentro (opcional)",
  "约定名称（可选）",
  "Nazwa spotkania (opcjonalnie)",
  "Aftalenavn (valgfrit)"
 ],
 [
  "Dit deelt alleen een afspraakbericht en maakt geen live skigroep aan.",
  "This shares a meeting message only and does not create a live ski group.",
  "Teilt nur eine Treffennachricht und erstellt keine Live-Skigruppe.",
  "Partage uniquement un rendez-vous sans créer de groupe en direct.",
  "Solo comparte un encuentro, sin crear grupo en directo.",
  "仅分享约定消息，不创建实时滑雪群组。",
  "Udostępnia tylko wiadomość, bez tworzenia grupy na żywo.",
  "Deler kun en aftalebesked og opretter ingen live-skigruppe."
 ],
 [
  "Groepstest: opmerkingen & correcties",
  "Group test: feedback & corrections",
  "Gruppentest: Hinweise & Korrekturen",
  "Test de groupe : remarques et corrections",
  "Prueba grupal: comentarios y correcciones",
  "群组测试：反馈与修正",
  "Test grupowy: uwagi i poprawki",
  "Gruppetest: bemærkninger og rettelser"
 ],
 [
  "Soort controle",
  "Check type",
  "Prüfart",
  "Type de vérification",
  "Tipo de comprobación",
  "检查类型",
  "Rodzaj kontroli",
  "Kontroltype"
 ],
 [
  "PDF en delen",
  "PDF and sharing",
  "PDF und Teilen",
  "PDF et partage",
  "PDF y compartir",
  "PDF与分享",
  "PDF i udostępnianie",
  "PDF og deling"
 ],
 [
  "Groepsleden en GPS",
  "Group members and GPS",
  "Gruppenmitglieder und GPS",
  "Membres et GPS",
  "Miembros y GPS",
  "群组成员与GPS",
  "Członkowie grupy i GPS",
  "Gruppemedlemmer og GPS"
 ],
 [
  "Groepsgesprek en afspraak",
  "Group chat and meeting",
  "Gruppenchat und Treffen",
  "Chat et rendez-vous",
  "Chat y encuentro",
  "群聊与约定",
  "Czat i spotkanie",
  "Gruppechat og aftale"
 ],
 [
  "Installeren en updaten",
  "Installation and updates",
  "Installation und Updates",
  "Installation et mises à jour",
  "Instalación y actualizaciones",
  "安装与更新",
  "Instalacja i aktualizacje",
  "Installation og opdatering"
 ],
 [
  "Weergave en bediening",
  "Display and controls",
  "Anzeige und Bedienung",
  "Affichage et commandes",
  "Vista y controles",
  "显示与操作",
  "Wyświetlanie i obsługa",
  "Visning og betjening"
 ],
 [
  "Huidige GPS-coördinaten toevoegen",
  "Add current GPS coordinates",
  "Aktuelle GPS-Koordinaten hinzufügen",
  "Ajouter les coordonnées GPS actuelles",
  "Añadir coordenadas GPS actuales",
  "添加当前GPS坐标",
  "Dodaj bieżące współrzędne GPS",
  "Tilføj aktuelle GPS-koordinater"
 ],
 [
  "Opmerking offline bewaren",
  "Save feedback offline",
  "Hinweis offline speichern",
  "Enregistrer la remarque hors ligne",
  "Guardar comentario sin conexión",
  "离线保存反馈",
  "Zapisz uwagę offline",
  "Gem bemærkning offline"
 ],
 [
  "Alle opmerkingen exporteren",
  "Export all feedback",
  "Alle Hinweise exportieren",
  "Exporter toutes les remarques",
  "Exportar todos los comentarios",
  "导出所有反馈",
  "Eksportuj wszystkie uwagi",
  "Eksportér alle bemærkninger"
 ],
 [
  "Kaart, radar en webcams laden alleen wanneer nodig.",
  "Map, radar and webcams load only as needed.",
  "Karte, Radar und Webcams werden nur bei Bedarf geladen.",
  "Carte, radar et webcams chargés au besoin.",
  "Mapa, radar y cámaras solo se cargan cuando hacen falta.",
  "地图、雷达和摄像头按需加载。",
  "Mapa, radar i kamery ładowane w razie potrzeby.",
  "Kort, radar og webcams indlæses kun efter behov."
 ],
 [
  "Controleer online op nieuwe updates.",
  "Check online for updates.",
  "Online nach Updates suchen.",
  "Rechercher les mises à jour en ligne.",
  "Buscar actualizaciones en línea.",
  "在线检查更新。",
  "Sprawdź aktualizacje online.",
  "Søg online efter opdateringer."
 ],
 [
  "Mijn SKI-je-back-up terugzetten",
  "Restore my SKI-je backup",
  "Mein SKI-je-Backup wiederherstellen",
  "Restaurer ma sauvegarde SKI-je",
  "Restaurar mi copia SKI-je",
  "恢复我的SKI-je备份",
  "Przywróć kopię SKI-je",
  "Gendan min SKI-je-backup"
 ],
 [
  "niet geüpload",
  "not uploaded",
  "nicht hochgeladen",
  "non envoyé",
  "no subido",
  "不上传",
  "bez wysyłania",
  "ikke uploadet"
 ],
 [
  "Wat meet je?",
  "What are you measuring?",
  "Was misst du?",
  "Que mesurez-vous?",
  "¿Qué estás midiendo?",
  "测量什么？",
  "Co mierzysz?",
  "Hvad måler du?"
 ],
 [
  "Liftstation",
  "Lift station",
  "Liftstation",
  "Station de remontée",
  "Estación de remonte",
  "缆车站",
  "Stacja wyciągu",
  "Liftstation"
 ],
 [
  "Pistekruising",
  "Slope junction",
  "Pistenkreuzung",
  "Intersection de pistes",
  "Cruce de pistas",
  "雪道交叉口",
  "Skrzyżowanie tras",
  "Pistekryds"
 ],
 [
  "Restaurant / berghut",
  "Restaurant / mountain hut",
  "Restaurant / Berghütte",
  "Restaurant / refuge",
  "Restaurante / refugio",
  "餐厅/山屋",
  "Restauracja / schronisko",
  "Restaurant / bjerghytte"
 ],
 [
  "Bergtop / uitzichtpunt",
  "Summit / viewpoint",
  "Gipfel / Aussichtspunkt",
  "Sommet / point de vue",
  "Cumbre / mirador",
  "山顶/观景点",
  "Szczyt / punkt widokowy",
  "Bjergtop / udsigtspunkt"
 ],
 [
  "Naam of nummer (optioneel)",
  "Name or number (optional)",
  "Name oder Nummer (optional)",
  "Nom ou numéro (facultatif)",
  "Nombre o número (opcional)",
  "名称或编号（可选）",
  "Nazwa lub numer (opcjonalnie)",
  "Navn eller nummer (valgfrit)"
 ],
 [
  "Aantal metingen",
  "Number of readings",
  "Anzahl Messungen",
  "Nombre de mesures",
  "Número de mediciones",
  "测量次数",
  "Liczba pomiarów",
  "Antal målinger"
 ],
 [
  "1 meting (snelst)",
  "1 reading (fastest)",
  "1 Messung (schnellste)",
  "1 mesure (rapide)",
  "1 medición (rápida)",
  "1次测量（最快）",
  "1 pomiar (najszybszy)",
  "1 måling (hurtigst)"
 ],
 [
  "3 metingen (aanbevolen)",
  "3 readings (recommended)",
  "3 Messungen (empfohlen)",
  "3 mesures (recommandé)",
  "3 mediciones (recomendado)",
  "3次测量（推荐）",
  "3 pomiary (zalecane)",
  "3 målinger (anbefalet)"
 ],
 [
  "5 metingen (extra controle)",
  "5 readings (extra check)",
  "5 Messungen (Zusatzprüfung)",
  "5 mesures (contrôle supplémentaire)",
  "5 mediciones (control extra)",
  "5次测量（额外检查）",
  "5 pomiarów (dodatkowa kontrola)",
  "5 målinger (ekstra kontrol)"
 ],
 [
  "Sta stil op een veilige plek. Meer metingen kunnen GPS-ruis helpen inschatten maar garanderen geen hogere nauwkeurigheid.",
  "Stand still in a safe place. More readings can help estimate GPS noise, but do not guarantee accuracy.",
  "Bleib an einem sicheren Ort stehen. Mehr Messungen helfen GPS-Rauschen einzuschätzen, garantieren aber keine höhere Genauigkeit.",
  "Arrêtez-vous en lieu sûr. Plus de mesures aident à estimer le bruit GPS sans garantir la précision.",
  "Detente en un lugar seguro. Más mediciones ayudan a estimar ruido GPS sin garantizar mayor precisión.",
  "在安全地点静止。增加测量有助于估计GPS噪声，但不保证更准确。",
  "Zatrzymaj się w bezpiecznym miejscu. Więcej pomiarów pomaga ocenić szum GPS, ale nie gwarantuje dokładności.",
  "Stå stille et sikkert sted. Flere målinger kan hjælpe med at vurdere GPS-støj, men garanterer ikke større nøjagtighed."
 ],
 [
  "Meet & bewaar ijkpunt",
  "Measure & save reference point",
  "Referenzpunkt messen & speichern",
  "Mesurer et enregistrer le point de référence",
  "Medir y guardar punto de referencia",
  "测量并保存参考点",
  "Zmierz i zapisz punkt odniesienia",
  "Mål og gem referencepunkt"
 ],
 [
  "Je locatie wordt pas opgevraagd na de knop.",
  "Your location is requested only after pressing the button.",
  "Dein Standort wird erst nach dem Tastendruck abgefragt.",
  "Votre position n'est demandée qu'après avoir appuyé.",
  "Solo se solicita tu ubicación al pulsar el botón.",
  "仅点击按钮后请求位置。",
  "Lokalizacja jest pobierana dopiero po naciśnięciu przycisku.",
  "Din placering hentes først efter tryk på knappen."
 ],
 [
  "Bij levensgevaar direct bellen. Noem het pistenummer, de locatie en het aantal gewonden.",
  "In life-threatening danger, call immediately. Give the slope number, location and number injured.",
  "Bei Lebensgefahr sofort anrufen. Pistennummer, Standort und Anzahl Verletzter nennen.",
  "En cas de danger vital, appelez immédiatement. Indiquez le numéro de piste, le lieu et le nombre de blessés.",
  "En peligro vital, llama de inmediato. Indica número de pista, ubicación y número de heridos.",
  "危及生命时立即呼救，告知雪道编号、位置及伤者人数。",
  "Przy zagrożeniu życia dzwoń natychmiast. Podaj numer trasy, położenie i liczbę rannych.",
  "Ring straks ved livsfare. Angiv pistenummer, placering og antal tilskadekomne."
 ],
 [
  "Wacht bij nood niet op GPS; bellen werkt ook zonder app.",
  "Do not wait for GPS in an emergency; calls work without the app.",
  "Im Notfall nicht auf GPS warten; Anrufen geht auch ohne App.",
  "En urgence, n'attendez pas le GPS; les appels fonctionnent sans l'application.",
  "En emergencia no esperes al GPS; puedes llamar sin la app.",
  "紧急情况不要等待GPS， 无需应用也可拨打电话。",
  "W nagłym wypadku nie czekaj na GPS; można dzwonić bez aplikacji.",
  "Vent ikke på GPS i en nødsituation; opkald virker uden appen."
 ],
 [
  "Coördinaten kopiëren",
  "Copy coordinates",
  "Koordinaten kopieren",
  "Copier les coordonnées",
  "Copiar coordenadas",
  "复制坐标",
  "Kopiuj współrzędne",
  "Kopiér koordinater"
 ],
 [
  "Tik op GPS ophalen.",
  "Tap to get GPS.",
  "Tippe auf GPS abrufen.",
  "Appuyez pour obtenir le GPS.",
  "Pulsa para obtener GPS.",
  "点击获取GPS。",
  "Dotknij, aby pobrać GPS.",
  "Tryk for at hente GPS."
 ],
 [
  "Terug",
  "Back",
  "Zurück",
  "Retour",
  "Volver",
  "返回",
  "Wstecz",
  "Tilbage"
 ],
 [
  "Mijn volledige spoor tijdelijk bewaren (GPX-export)",
  "Temporarily keep my full track (GPX export)",
  "Meine vollständige Spur vorübergehend speichern (GPX-Export)",
  "Conserver temporairement mon tracé complet (export GPX)",
  "Guardar temporalmente mi ruta completa (exportar GPX)",
  "暂存完整轨迹（GPX导出）",
  "Tymczasowo zachowaj pełny ślad (eksport GPX)",
  "Gem mit fulde spor midlertidigt (GPX-eksport)"
 ],
 [
  "km, inclusief eventuele liften",
  "km, possibly including lifts",
  "km, ggf. einschließlich Liften",
  "km, remontées éventuellement incluses",
  "km, incluidos posibles remontes",
  "公里，可能含缆车",
  "km, ewentualnie z wyciągami",
  "km, inkl. eventuelle lifte"
 ],
 [
  "uur:min",
  "h:min",
  "Std:Min",
  "h:min",
  "h:min",
  "小时:分钟",
  "godz:min",
  "time:min"
 ],
 [
  "km/u",
  "km/h",
  "km/h",
  "km/h",
  "km/h",
  "公里/小时",
  "km/h",
  "km/t"
 ],
 [
  "Lift/piste naam",
  "Lift/slope name",
  "Lift-/Pistenname",
  "Nom de remontée/piste",
  "Nombre de remonte/pista",
  "缆车/雪道名称",
  "Nazwa wyciągu/trasy",
  "Lift-/pistenavn"
 ],
 [
  "Code",
  "Code",
  "Code",
  "Code",
  "Código",
  "代码",
  "Kod",
  "Kode"
 ],
 [
  "Lengte (km)",
  "Length (km)",
  "Länge (km)",
  "Longueur (km)",
  "Longitud (km)",
  "长度（公里）",
  "Długość (km)",
  "Længde (km)"
 ],
 [
  "Minuten (0 = schatting)",
  "Minutes (0 = estimate)",
  "Minuten (0 = Schätzung)",
  "Minutes (0 = estimation)",
  "Minutos (0 = estimación)",
  "分钟（0=估算）",
  "Minuty (0 = szacunek)",
  "Minutter (0 = skøn)"
 ],
 [
  "Wachttijd lift (min)",
  "Lift waiting time (min)",
  "Liftwartezeit (Min)",
  "Attente remontée (min)",
  "Espera remonte (min)",
  "缆车等待（分钟）",
  "Czas oczekiwania (min)",
  "Liftventetid (min)"
 ],
 [
  "Laatste toegang (optioneel)",
  "Last access (optional)",
  "Letzter Zugang (optional)",
  "Dernier accès (facultatif)",
  "Último acceso (opcional)",
  "最晚进入（可选）",
  "Ostatni dostęp (opcjonalnie)",
  "Sidste adgang (valgfri)"
 ],
 [
  "Gecontroleerd open (tijdelijk)",
  "Verified open (temporary)",
  "Geprüft geöffnet (vorübergehend)",
  "Ouverture vérifiée (temporaire)",
  "Apertura comprobada (temporal)",
  "已核实开放（临时）",
  "Potwierdzone otwarcie (tymczasowe)",
  "Bekræftet åben (midlertidigt)"
 ],
 [
  "Ik heb de richting en verbinding zelf gecontroleerd",
  "I checked the direction and connection myself",
  "Ich habe Richtung und Verbindung selbst geprüft",
  "J'ai vérifié moi-même le sens et la liaison",
  "He verificado la dirección y conexión",
  "我已自行检查方向和连接",
  "Samodzielnie sprawdziłem kierunek i połączenie",
  "Jeg har selv kontrolleret retning og forbindelse"
 ],
 [
  "Nieuw controlepunt / kruising aanmaken",
  "Create new checkpoint / junction",
  "Neuen Kontrollpunkt / Kreuzung erstellen",
  "Créer un point de contrôle / croisement",
  "Crear punto de control / cruce",
  "创建新检查点/交叉口",
  "Utwórz punkt kontrolny / skrzyżowanie",
  "Opret kontrolpunkt / kryds"
 ],
 [
  "Controlepunt toevoegen aan keuzelijst",
  "Add checkpoint to list",
  "Kontrollpunkt zur Auswahlliste hinzufügen",
  "Ajouter le point de contrôle à la liste",
  "Añadir punto de control a la lista",
  "将检查点添加到列表",
  "Dodaj punkt kontrolny do listy",
  "Tilføj kontrolpunkt til liste"
 ],
 [
  "Toon rekenvoorbeeld",
  "Show calculation example",
  "Rechenbeispiel anzeigen",
  "Afficher un exemple de calcul",
  "Mostrar ejemplo de cálculo",
  "显示计算示例",
  "Pokaż przykład obliczeń",
  "Vis beregningseksempel"
 ],
 [
  "Netwerk wissen",
  "Clear network",
  "Netzwerk löschen",
  "Effacer le réseau",
  "Borrar red",
  "清除网络",
  "Wyczyść sieć",
  "Slet netværk"
 ],
 [
  "Liftfoto's herkennen",
  "Recognise lift photos",
  "Liftfotos erkennen",
  "Reconnaître les photos de remontées",
  "Reconocer fotos de remontes",
  "识别缆车照片",
  "Rozpoznaj zdjęcia wyciągów",
  "Genkend liftfotos"
 ],
 [
  "Kies een foto of maak er eentje",
  "Choose or take a photo",
  "Foto auswählen oder aufnehmen",
  "Choisir ou prendre une photo",
  "Elegir o tomar una foto",
  "选择或拍摄照片",
  "Wybierz lub zrób zdjęcie",
  "Vælg eller tag et foto"
 ],
 [
  "Liftfoto lokaal bewaren",
  "Save lift photo locally",
  "Liftfoto lokal speichern",
  "Enregistrer la photo localement",
  "Guardar foto localmente",
  "本地保存缆车照片",
  "Zapisz zdjęcie lokalnie",
  "Gem liftfoto lokalt"
 ],
 [
  "Beelden worden verkleind voor batterij- en opslagbesparing.",
  "Images are reduced to save battery and storage.",
  "Bilder werden verkleinert, um Akku und Speicher zu sparen.",
  "Les images sont réduites pour économiser batterie et stockage.",
  "Las imágenes se reducen para ahorrar batería y espacio.",
  "缩小图片以节省电量和存储。",
  "Zdjęcia są zmniejszane dla oszczędności baterii i pamięci.",
  "Billeder reduceres for at spare batteri og lagerplads."
 ],
 [
  "Zoek hut of lift",
  "Search hut or lift",
  "Hütte oder Lift suchen",
  "Rechercher refuge ou remontée",
  "Buscar refugio o remonte",
  "搜索山屋或缆车",
  "Szukaj schroniska lub wyciągu",
  "Søg hytte eller lift"
 ],
 [
  "Soort",
  "Type",
  "Typ",
  "Type",
  "Tipo",
  "类型",
  "Typ",
  "Type"
 ],
 [
  "Alle bronnen",
  "All sources",
  "Alle Quellen",
  "Toutes les sources",
  "Todas las fuentes",
  "所有来源",
  "Wszystkie źródła",
  "Alle kilder"
 ],
 [
  "Gondels & liften",
  "Gondolas & lifts",
  "Gondeln & Lifte",
  "Télécabines et remontées",
  "Telecabinas y remontes",
  "吊厢和缆车",
  "Gondole i wyciągi",
  "Gondoler og lifte"
 ],
 [
  "Tik om de bronnenlijst te openen.",
  "Tap to open the source list.",
  "Tippen, um die Quellenliste zu öffnen.",
  "Appuyez pour ouvrir les sources.",
  "Pulsa para abrir las fuentes.",
  "点击打开来源列表。",
  "Dotknij, aby otworzyć listę źródeł.",
  "Tryk for at åbne kildelisten."
 ],
 [
  "Foto's van liften en restaurants delen",
  "Share lift and restaurant photos",
  "Lift- und Restaurantfotos teilen",
  "Partager les photos de remontées et restaurants",
  "Compartir fotos de remontes y restaurantes",
  "分享缆车和餐厅照片",
  "Udostępniaj zdjęcia wyciągów i restauracji",
  "Del fotos af lifte og restauranter"
 ],
 [
  "Wat staat op de foto?",
  "What is in the photo?",
  "Was zeigt das Foto?",
  "Que montre la photo?",
  "¿Qué aparece en la foto?",
  "照片内容是什么？",
  "Co jest na zdjęciu?",
  "Hvad er på billedet?"
 ],
 [
  "Restaurant / hut",
  "Restaurant / hut",
  "Restaurant / Hütte",
  "Restaurant / refuge",
  "Restaurante / refugio",
  "餐厅/山屋",
  "Restauracja / schronisko",
  "Restaurant / hytte"
 ],
 [
  "Koppel aan",
  "Link to",
  "Verknüpfen mit",
  "Associer à",
  "Vincular a",
  "关联至",
  "Powiąż z",
  "Knyt til"
 ],
 [
  "Maak foto",
  "Take photo",
  "Foto aufnehmen",
  "Prendre une photo",
  "Tomar foto",
  "拍照",
  "Zrób zdjęcie",
  "Tag foto"
 ],
 [
  "Kies uit galerij",
  "Choose from gallery",
  "Aus Galerie wählen",
  "Choisir dans la galerie",
  "Elegir de galería",
  "从相册选择",
  "Wybierz z galerii",
  "Vælg fra galleri"
 ],
 [
  "Andere lift of restaurant (naam en nummer)",
  "Other lift or restaurant (name and number)",
  "Anderer Lift oder Restaurant (Name und Nummer)",
  "Autre remontée ou restaurant (nom et numéro)",
  "Otro remonte o restaurante (nombre y número)",
  "其他缆车或餐厅（名称及编号）",
  "Inny wyciąg lub restauracja (nazwa i numer)",
  "Anden lift eller restaurant (navn og nummer)"
 ],
 [
  "Opmerking (optioneel)",
  "Comment (optional)",
  "Hinweis (optional)",
  "Remarque (facultative)",
  "Comentario (opcional)",
  "备注（可选）",
  "Uwaga (opcjonalnie)",
  "Bemærkning (valgfri)"
 ],
 [
  "Controleer GPS op deze locatie",
  "Check GPS at this location",
  "GPS an diesem Ort prüfen",
  "Vérifier le GPS ici",
  "Comprobar GPS aquí",
  "检查此位置GPS",
  "Sprawdź GPS w tym miejscu",
  "Kontrollér GPS her"
 ],
 [
  "Locatie nog niet opgevraagd. GPS wordt alleen meegestuurd als je de foto indient.",
  "Location not requested. GPS is sent only when you submit the photo.",
  "Standort noch nicht abgefragt. GPS wird nur beim Einsenden des Fotos übertragen.",
  "Position non demandée. GPS transmis uniquement lors de l'envoi de la photo.",
  "Ubicación no solicitada. GPS solo se envía al entregar la foto.",
  "尚未请求位置。仅提交照片时发送GPS。",
  "Lokalizacja niepobrana. GPS wysyłany tylko przy przesłaniu zdjęcia.",
  "Placering ikke hentet. GPS sendes kun ved indsendelse af foto."
 ],
 [
  "Ik heb toestemming om deze foto te delen en zorg dat personen niet herkenbaar in beeld zijn zonder hun toestemming.",
  "I have permission to share this photo and ensure people are not identifiable without consent.",
  "Ich darf dieses Foto teilen und stelle sicher, dass Personen ohne Zustimmung nicht erkennbar sind.",
  "J'ai le droit de partager cette photo et veille à ce que personne ne soit identifiable sans accord.",
  "Tengo permiso para compartir esta foto y nadie es identificable sin consentimiento.",
  "我获准分享该照片，并确保未经同意者无法被识别。",
  "Mam zgodę na udostępnienie zdjęcia i dbam, aby osoby bez zgody nie były rozpoznawalne.",
  "Jeg har tilladelse til at dele fotoet og sikrer, at personer ikke kan genkendes uden samtykke."
 ],
 [
  "Ter goedkeuring insturen",
  "Submit for approval",
  "Zur Freigabe einsenden",
  "Envoyer pour validation",
  "Enviar para aprobación",
  "提交审核",
  "Wyślij do zatwierdzenia",
  "Indsend til godkendelse"
 ],
 [
  "Ingestuurde foto's zijn pas zichtbaar na handmatige goedkeuring.",
  "Submitted photos are visible only after manual approval.",
  "Eingesendete Fotos sind erst nach manueller Freigabe sichtbar.",
  "Photos visibles uniquement après validation manuelle.",
  "Fotos visibles solo tras aprobación manual.",
  "照片仅在人工审核通过后可见。",
  "Zdjęcia widoczne dopiero po ręcznym zatwierdzeniu.",
  "Indsendte fotos vises først efter manuel godkendelse."
 ],
 [
  "Foto's beoordelen (beheerder)",
  "Review photos (admin)",
  "Fotos prüfen (Administrator)",
  "Valider les photos (administrateur)",
  "Revisar fotos (administrador)",
  "审核照片（管理员）",
  "Oceń zdjęcia (administrator)",
  "Gennemgå fotos (administrator)"
 ],
 [
  "Inzendingen controleren",
  "Review submissions",
  "Einsendungen prüfen",
  "Vérifier les envois",
  "Revisar envíos",
  "检查提交",
  "Sprawdź zgłoszenia",
  "Kontrollér indsendelser"
 ],
 [
  "{0} van {1} webcams",
  "{0} of {1} webcams",
  "{0} von {1} Webcams",
  "{0} webcams sur {1}",
  "{0} de {1} cámaras",
  "{0} / {1} 个摄像头",
  "{0} z {1} kamer",
  "{0} af {1} webcams"
 ],
 [
  "{0} webcams",
  "{0} webcams",
  "{0} Webcams",
  "{0} webcams",
  "{0} cámaras",
  "{0} 个摄像头",
  "{0} kamer",
  "{0} webcams"
 ],
 [
  "{0} liften in lijst",
  "{0} lifts in list",
  "{0} Lifte in der Liste",
  "{0} remontées dans la liste",
  "{0} remontes en la lista",
  "列表中有 {0} 部缆车",
  "{0} wyciągów na liście",
  "{0} lifte på listen"
 ],
 [
  "{0} online",
  "{0} online",
  "{0} online",
  "{0} en ligne",
  "{0} en línea",
  "{0} 人在线",
  "{0} online",
  "{0} online"
 ],
 [
  "{0} opgeslagen",
  "{0} saved",
  "{0} gespeichert",
  "{0} enregistrés",
  "{0} guardados",
  "已保存 {0} 项",
  "{0} zapisanych",
  "{0} gemt"
 ],
 [
  "Nieuwe verwachting wordt opgehaald…",
  "Fetching forecast…",
  "Neue Vorhersage wird geladen…",
  "Chargement des prévisions…",
  "Cargando previsión…",
  "正在获取预报…",
  "Pobieranie prognozy…",
  "Henter ny vejrudsigt…"
 ],
 [
  "Weer tijdelijk niet beschikbaar. Probeer opnieuw.",
  "Weather temporarily unavailable. Try again.",
  "Wetter vorübergehend nicht verfügbar. Erneut versuchen.",
  "Météo temporairement indisponible. Réessayez.",
  "Tiempo no disponible temporalmente. Inténtalo de nuevo.",
  "天气暂不可用，请重试。",
  "Pogoda tymczasowo niedostępna. Spróbuj ponownie.",
  "Vejret er midlertidigt utilgængeligt. Prøv igen."
 ],
 [
  "Geen uurverwachting beschikbaar.",
  "No hourly forecast available.",
  "Keine stündliche Vorhersage verfügbar.",
  "Aucune prévision horaire disponible.",
  "Previsión horaria no disponible.",
  "暂无逐小时预报。",
  "Brak prognozy godzinowej.",
  "Ingen timeprognose tilgængelig."
 ],
 [
  "Sterke windstoten mogelijk; check liften",
  "Strong gusts possible; check lift status",
  "Starke Böen möglich; Liftstatus prüfen",
  "Rafales fortes possibles ; vérifiez les remontées",
  "Posibles rachas fuertes; consulta los remontes",
  "可能有强阵风；查看缆车状态",
  "Możliwe silne porywy; sprawdź wyciągi",
  "Kraftige vindstød mulige; tjek lifte"
 ],
 [
  "Verhoogde windstoten",
  "Elevated gusts",
  "Erhöhte Windböen",
  "Rafales renforcées",
  "Rachas elevadas",
  "阵风增强",
  "Silniejsze porywy",
  "Forhøjede vindstød"
 ],
 [
  "Modelverwachting",
  "Model forecast",
  "Modellvorhersage",
  "Prévision du modèle",
  "Previsión del modelo",
  "模型预报",
  "Prognoza modelowa",
  "Modelprognose"
 ],
 [
  "Locatie delen AAN",
  "Location sharing ON",
  "Standortfreigabe AN",
  "Partage de position ACTIVÉ",
  "Ubicación compartida ACTIVADA",
  "位置共享已开启",
  "Udostępnianie lokalizacji WŁ.",
  "Deling af placering TIL"
 ],
 [
  "Locatie delen UIT",
  "Location sharing OFF",
  "Standortfreigabe AUS",
  "Partage de position DÉSACTIVÉ",
  "Ubicación compartida DESACTIVADA",
  "位置共享已关闭",
  "Udostępnianie lokalizacji WYŁ.",
  "Deling af placering FRA"
 ],
 [
  "Verbinding met de skigroep maken…",
  "Connecting to ski group…",
  "Verbindung zur Skigruppe wird hergestellt…",
  "Connexion au groupe…",
  "Conectando al grupo…",
  "正在连接滑雪群组…",
  "Łączenie z grupą…",
  "Forbinder til skigruppen…"
 ],
 [
  "Geen lift gevonden",
  "No lift found",
  "Kein Lift gefunden",
  "Aucune remontée trouvée",
  "No se encontró ningún remonte",
  "未找到缆车",
  "Nie znaleziono wyciągu",
  "Ingen lift fundet"
 ],
 [
  "Geen restaurant gevonden",
  "No restaurant found",
  "Kein Restaurant gefunden",
  "Aucun restaurant trouvé",
  "No se encontró ningún restaurante",
  "未找到餐厅",
  "Nie znaleziono restauracji",
  "Ingen restaurant fundet"
 ]
];
 const config=window.SKI_I18N_DATA;
 if(!config?.translations)return;
 for(const [i,lang] of ['en','de','fr','es','zh','pl','da'].entries()){
  const table=config.translations[lang];
  if(!table)continue;
  for(const [key,...values] of rows){
   if(['__proto__','prototype','constructor'].includes(key)||typeof values[i]!=='string')continue;
   Object.defineProperty(table,key,{value:values[i],enumerable:true,configurable:true,writable:true});
  }
 }
})();
