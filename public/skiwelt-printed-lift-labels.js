/* SkiWelt 2026/27: text-center positions of the printed lift numbers on the
 * official panorama, visibly reviewed against official 3537x2445 JPG.
 * These are NON-geographic print coordinates, not lift stations or GPS.
 * White-square labels were individually inspected in the official map crops.
 * Colours matter: red/blue circles are PISTES and must not open lift panels.
 * Official map byte SHA256 pinned in README/data notes for future seasons.
 */
(function(root,factory){
 'use strict';
 const data=factory();
 if(typeof module==='object'&&module.exports)module.exports=data;
 if(root)root.SKIPrintedLiftLabels=data;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const labels=[["1",0.66623,0.54966],["2",0.62692,0.5797],["3",0.62212,0.50874],["4",0.61389,0.53078],["6",0.61953,0.47293],["7",0.5935,0.53458],["8",0.6413,0.54915],["9",0.61993,0.54194],["10",0.62212,0.55964],["11",0.76622,0.51848],["12",0.72404,0.54673],["17",0.73278,0.49643],["18",0.72245,0.53345],["20",0.69153,0.76055],["21",0.61992,0.6649],["22",0.60433,0.61557],["23",0.5806,0.61025],["24",0.64602,0.65318],["25",0.65955,0.63005],["27a",0.70829,0.84904],["27b",0.73668,0.83617],["30",0.51155,0.77],["31",0.57046,0.67908],["33",0.44992,0.84108],["40",0.47452,0.69398],["42",0.56484,0.59364],["43",0.52984,0.63062],["44",0.52289,0.69398],["45",0.54853,0.65382],["46",0.53594,0.73935],["47",0.49846,0.71475],["51",0.49179,0.61271],["57",0.39773,0.74458],["58",0.375,0.74658],["59",0.38716,0.72734],["60",0.32442,0.54139],["61",0.35737,0.50467],["62",0.39613,0.48425],["64",0.46956,0.45978],["65",0.46744,0.4387],["66",0.44263,0.49741],["67",0.52221,0.44641],["69",0.55789,0.40856],["70",0.58964,0.41794],["71",0.51921,0.5067],["73",0.1523,0.76775],["74",0.1392,0.79909],["77",0.42312,0.49243],["78",0.49937,0.44033],["79",0.19211,0.54286],["80",0.38252,0.40802],["80",0.41206,0.37299],["81",0.28616,0.3683],["82",0.27385,0.38979],["84",0.29804,0.37774],["86",0.32282,0.42613],["88",0.38307,0.43515],["89",0.46865,0.37299],["90",0.35347,0.37149],["91",0.43985,0.38379],["96",0.45705,0.38224],["97",0.51334,0.39953],["98",0.49059,0.36225],["99",0.46076,0.41978],["100",0.30862,0.32729],["102",0.37763,0.31007],["107",0.25629,0.35257],["108",0.25338,0.33443],["110",0.83261,0.53087],["111",0.87226,0.46052],["112",0.86634,0.48509],["112",0.90432,0.53294],["114",0.85765,0.41725],["115",0.89319,0.42767],["117",0.92837,0.40332],["118",0.9148,0.39805],["119",0.86954,0.37583],["120",0.85371,0.36524],["125",0.79652,0.60395],["126",0.81023,0.57273]];
 return {
  source:'https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.jpg',
  sourcePdf:'https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.pdf',
  image:{width:3537,height:2445,sha256:'f94ac4a7c2f7e78db17b49788cf543eab98508c3a87497dd97774584fa6e7c2c'},
  precision:'visually-reviewed-printed-number-centers-not-gps',
  // 40 is labelled Hexenwasser in official SkiWelt Tour, but 26 in live lift status.
  // 59 is Hexenteppich 2 in current status (not Muehlbichl).
  // A printed 89 represents a teaching area; the lift list has 89a/89b/89c.
  conflicts:{
   '40':{statusNumber:'26',title:'Kaart 40 / liftstatus 26',reason:'De officiële SkiWelt Tour gebruikt 40 voor Hexenwasser; de actuele liftstatus gebruikt 26. Beide bronvermeldingen worden getoond.'},
   '59':{statusNumber:'59',title:'Hexenteppich 2',reason:'De officiële liftstatus noemt nummer 59 Hexenteppich 2. Mühlbichl staat zonder bevestigd nummer.'},
   '89':{choices:['89a','89b','89c'],title:'Ellmi\'s Zauberteppiche',reason:'Het kaartlabel 89 heeft in de officiële liftlijst drie afzonderlijke aanduidingen: 89a, 89b en 89c.'}
  },
  labels
 };
});
