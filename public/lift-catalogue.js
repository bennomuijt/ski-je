/* SKI-je 4.5.19 - genummerde SkiWelt-liften, bron: officiële SkiWelt-liftstatus en panorama 2026/27.
   De officiële liftstatus noemt Hexenwasser 26, maar SkiWelt Tour / gedrukte kaart tonen 40.
   Mühlbichl is officieel ongenummerd; 59 is Hexenteppich 2 (58a niet als lift nummer gebruiken).
   Geen exacte coördinaten: de panorama-tekening is niet gegeorefereerd.
   Officiële bron kan afwijken van de marketingtelling van 81 actieve liften. */
(function(root,factory){
 'use strict';
 const data=factory();
 if(typeof module==='object'&&module.exports)module.exports=data;
 if(root)root.SKILiftCatalogue=data;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const source='https://www.skiwelt.at/nl/liftstatus-winter.html';
 const regionalSource='https://www.hohe.salve.at/en/lift-status-in-the-region.html';
 const areas=[
  {key:'going',name:'Going',x:.27,y:.38},
  {key:'ellmau',name:'Ellmau',x:.27,y:.45},
  {key:'scheffau',name:'Scheffau',x:.22,y:.55},
  {key:'soll',name:'Söll',x:.35,y:.72},
  {key:'itter',name:'Itter / Kelchsau',x:.46,y:.86},
  {key:'hopfgarten',name:'Hopfgarten',x:.68,y:.84},
  {key:'brixen',name:'Brixen im Thale',x:.73,y:.46},
  {key:'westendorf',name:'Westendorf',x:.79,y:.67}
 ];
 const lifts=[
 {
  "number": "1",
  "name": "6er Gondelbahn Hochbrixen",
  "area": "Brixen",
  "areaKey": "brixen"
 },
 {
  "number": "2",
  "name": "Kälbersalvenbahn",
  "area": "Brixen",
  "areaKey": "brixen"
 },
 {
  "number": "3",
  "name": "Zinsbergbahn",
  "area": "Brixen",
  "areaKey": "brixen"
 },
 {
  "number": "4",
  "name": "Poldangerlift",
  "area": "Brixen",
  "areaKey": "brixen"
 },
 {
  "number": "6",
  "name": "Jochbahn",
  "area": "Brixen",
  "areaKey": "brixen"
 },
 {
  "number": "7",
  "name": "Filzbodenbahn",
  "area": "Brixen",
  "areaKey": "brixen"
 },
 {
  "number": "8",
  "name": "Würstlexpress",
  "area": "Brixen",
  "areaKey": "brixen"
 },
 {
  "number": "9",
  "name": "Übungslift Hochbrixen",
  "area": "Brixen",
  "areaKey": "brixen"
 },
 {
  "number": "10",
  "name": "Skischullift Hochbrixen",
  "area": "Brixen",
  "areaKey": "brixen"
 },
 {
  "number": "11",
  "name": "8er SkiWeltbahn",
  "area": "Brixen",
  "areaKey": "brixen"
 },
 {
  "number": "12",
  "name": "Sonnenlift",
  "area": "Brixen",
  "areaKey": "brixen"
 },
 {
  "number": "17",
  "name": "Schusterbühellift",
  "area": "Brixen",
  "areaKey": "brixen"
 },
 {
  "number": "18",
  "name": "Sonnenband",
  "area": "Brixen",
  "areaKey": "brixen"
 },
 {
  "number": "20",
  "name": "8er Gondelbahn Salvenbahn I",
  "area": "Hopfgarten",
  "areaKey": "hopfgarten"
 },
 {
  "number": "21",
  "name": "Hohe Salve I",
  "area": "Hopfgarten",
  "areaKey": "hopfgarten"
 },
 {
  "number": "22",
  "name": "8er Gondelbahn Salvenbahn II",
  "area": "Hopfgarten",
  "areaKey": "hopfgarten"
 },
 {
  "number": "23",
  "name": "Rigibahn",
  "area": "Hopfgarten",
  "areaKey": "hopfgarten"
 },
 {
  "number": "24",
  "name": "Schernthannbahn",
  "area": "Hopfgarten",
  "areaKey": "hopfgarten"
 },
 {
  "number": "25",
  "name": "Foischingbahn",
  "area": "Hopfgarten",
  "areaKey": "hopfgarten"
 },
 {
  "number": "26",
  "name": "10er Gondelbahn Hexenwasser",
  "area": "Söll",
  "areaKey": "soll"
 },
 {
  "number": "27a",
  "name": "Zauberteppich Högerfeld",
  "area": "Hopfgarten",
  "areaKey": "hopfgarten"
 },
 {
  "number": "27b",
  "name": "Zauberteppich Bodenschmied",
  "area": "Hopfgarten",
  "areaKey": "hopfgarten"
 },
 {
  "number": "31",
  "name": "Kasbichlbahn",
  "area": "Hopfgarten",
  "areaKey": "hopfgarten"
 },
 {
  "number": "30",
  "name": "10er Gondelbahn Salvistabahn",
  "area": "Itter",
  "areaKey": "itter"
 },
 {
  "number": "33",
  "name": "Tellerschlepplift Salvista",
  "area": "Itter",
  "areaKey": "itter"
 },
 {
  "number": "36",
  "name": "Förderband Kelchsau",
  "area": "Itter",
  "areaKey": "itter"
 },
 {
  "number": "39",
  "name": "Pfaringlift",
  "area": "Itter",
  "areaKey": "itter"
 },
 {
  "number": "40",
  "name": "Hexenwasser (kaartlabel 40; liftstatus nr. 26)",
  "area": "Söll",
  "areaKey": "soll"
 },
 {
  "number": "42",
  "name": "8er Gondelbahn Hohe Salve",
  "area": "Söll",
  "areaKey": "soll"
 },
 {
  "number": "43",
  "name": "4er Sesselbahn Keat",
  "area": "Söll",
  "areaKey": "soll"
 },
 {
  "number": "44",
  "name": "Stöckl",
  "area": "Söll",
  "areaKey": "soll"
 },
 {
  "number": "45",
  "name": "Hexen6er",
  "area": "Söll",
  "areaKey": "soll"
 },
 {
  "number": "46",
  "name": "Rinner",
  "area": "Söll",
  "areaKey": "soll"
 },
 {
  "number": "47",
  "name": "Hans im Glück",
  "area": "Söll",
  "areaKey": "soll"
 },
 {
  "number": "51",
  "name": "Siller-Keat",
  "area": "Söll",
  "areaKey": "soll"
 },
 {
  "number": "57",
  "name": "Knolln",
  "area": "Söll",
  "areaKey": "soll"
 },
 {
  "number": "58",
  "name": "Hexenteppich 1",
  "area": "Söll",
  "areaKey": "soll"
 },
 {
  "number": "59",
  "name": "Hexenteppich 2",
  "area": "Söll",
  "areaKey": "soll"
 },
 {
  "number": "80",
  "name": "10er Gondelbahn Hartkaiserbahn",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "81",
  "name": "Marcher",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "82",
  "name": "Vetterstätt Zauberteppich",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "84",
  "name": "Vetterstätt",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "86",
  "name": "Kirchbichl",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "88",
  "name": "Schmiedalm",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "89a",
  "name": "Ellmi's Zauberteppich I",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "89b",
  "name": "Ellmi's Zauberteppich II",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "89c",
  "name": "Ellmi's Zauberteppich III",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "90",
  "name": "Hausberg",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "91",
  "name": "Ellmi's 6er",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "96",
  "name": "Kaiserexpress",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "97",
  "name": "Köglbahn",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "98",
  "name": "Almbahn",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "99",
  "name": "Tanzbodenbahn",
  "area": "Ellmau",
  "areaKey": "ellmau"
 },
 {
  "number": "100",
  "name": "Astbergbahn",
  "area": "Going",
  "areaKey": "going"
 },
 {
  "number": "102",
  "name": "Sonnenlift",
  "area": "Going",
  "areaKey": "going"
 },
 {
  "number": "107",
  "name": "Maxilift",
  "area": "Going",
  "areaKey": "going"
 },
 {
  "number": "108",
  "name": "Zauberteppich Astberg",
  "area": "Going",
  "areaKey": "going"
 },
 {
  "number": "60",
  "name": "4EUB Brandstadl",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "61",
  "name": "8er Gondelbahn Brandstadl I",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "62",
  "name": "8er Gondelbahn Brandstadl II",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "64",
  "name": "Osthang",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "65",
  "name": "Ostlift",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "66",
  "name": "Südhang",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "67",
  "name": "Eiberg",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "69",
  "name": "Kummereralm-Lift",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "70",
  "name": "Muldenbahn",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "71",
  "name": "Aualm",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "73",
  "name": "Hochfeldlift-Schwoich",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "74",
  "name": "Babylift Schwoich",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "77",
  "name": "Babylift",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "78",
  "name": "Übungslift - Berg",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "79",
  "name": "Übungslift - Dorf",
  "area": "Scheffau",
  "areaKey": "scheffau"
 },
 {
  "number": "110",
  "name": "6er Gondelbahn Alpenrosenbahn I",
  "area": "Westendorf",
  "areaKey": "westendorf"
 },
 {
  "number": "111",
  "name": "6er Gondelbahn Alpenrosenbahn II",
  "area": "Westendorf",
  "areaKey": "westendorf"
 },
 {
  "number": "112",
  "name": "8er Gondelbahn Choralmbahn",
  "area": "Westendorf",
  "areaKey": "westendorf"
 },
 {
  "number": "114",
  "name": "Talkaser",
  "area": "Westendorf",
  "areaKey": "westendorf"
 },
 {
  "number": "115",
  "name": "Laubkogel",
  "area": "Westendorf",
  "areaKey": "westendorf"
 },
 {
  "number": "117",
  "name": "Fleiding",
  "area": "Westendorf",
  "areaKey": "westendorf"
 },
 {
  "number": "118",
  "name": "Windauberg",
  "area": "Westendorf",
  "areaKey": "westendorf"
 },
 {
  "number": "119",
  "name": "Gampenkogel",
  "area": "Westendorf",
  "areaKey": "westendorf"
 },
 {
  "number": "120",
  "name": "8er Gondelbahn KiWest",
  "area": "Westendorf",
  "areaKey": "westendorf"
 },
 {
  "number": "125",
  "name": "Sammer",
  "area": "Westendorf",
  "areaKey": "westendorf"
 },
 {
  "number": "126",
  "name": "Schneeberg",
  "area": "Westendorf",
  "areaKey": "westendorf"
 }
].map(lift=>({...lift,source,precision:'area-only'}));
 return {source,regionalSource,areas,lifts,precision:'area-only'};
});
