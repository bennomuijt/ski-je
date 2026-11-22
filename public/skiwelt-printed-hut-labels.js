/* Printed GREEN numbered SkiWelt huts, 2026/27 panorama: graphical 2D centres.
 * 69 symbols were visually checked on the official 3537x2445 JPEG using
 * constrained green-roof pixel regions; eight locations independently match
 * exact white-number text from the operator's vector PDF within ~1px.
 * Touching symbols (88/59/61 and 6/7) were split visually.
 * Excludes the green legend symbol and red/blue piste & white lift numbers.
 * NOT real-world GPS coordinates. Do not re-use on a changed panorama.
 */
(function(root,factory){
 'use strict';
 const data=factory();
 if(typeof module==='object'&&module.exports)module.exports=data;
 if(root)root.SKIPrintedHutLabels=data;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 return {
  source:'https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.jpg',
  sourcePdf:'https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.pdf',
  image:{width:3537,height:2445,sha256:'f94ac4a7c2f7e78db17b49788cf543eab98508c3a87497dd97774584fa6e7c2c'},
  precision:'visually-reviewed-green-hut-print-centres-not-gps',
  note:'De witte nummers zijn liften, de rode/blauwe cirkels zijn pistes; uitsluitend groene huttensymbolen komen in deze lijst voor.',
  ambiguous:{'56':{description:'Kaiserlounge en Bergkaiser delen het officiële kaartnummer 56; kies welke gelegenheid je zoekt.'}},
  missingFromPrintedPanorama:['16','22','39','73','87'],
  labels:[["1",0.64646,0.53582],["2",0.61106,0.51985],["3",0.61793,0.57539],["4",0.61512,0.48418],["5",0.64577,0.49231],["6",0.6562,0.5008],["7",0.6623,0.5048],["9",0.65726,0.55741],["10",0.7074,0.55572],["13",0.76084,0.48097],["14",0.59613,0.58083],["17",0.71868,0.74586],["18",0.72152,0.84164],["19",0.65799,0.69238],["20",0.6277,0.62581],["21",0.6007,0.64632],["23",0.57073,0.71376],["27",0.57175,0.5664],["29",0.66338,0.69889],["30",0.44611,0.45229],["31",0.46074,0.44281],["32",0.49948,0.47977],["33",0.54704,0.40351],["34",0.5209,0.51616],["35",0.38233,0.50213],["36",0.35953,0.51615],["37",0.3414,0.51769],["41",0.27489,0.53412],["42",0.56255,0.42904],["44",0.30077,0.52918],["46",0.49524,0.67767],["47",0.51012,0.67004],["48",0.51258,0.72576],["50",0.53352,0.60406],["51",0.38017,0.7307],["53",0.40908,0.72482],["54",0.37527,0.32592],["55",0.29212,0.3079],["56",0.45578,0.35155],["57",0.43759,0.37346],["58",0.40169,0.40619],["59",0.3363,0.4306],["60",0.25745,0.36539],["61",0.34338,0.42669],["62",0.36114,0.31088],["63",0.34867,0.28841],["64",0.26581,0.38867],["66",0.83082,0.52112],["67",0.83556,0.4483],["68",0.84957,0.47566],["69",0.88253,0.45355],["71",0.87947,0.53604],["72",0.94274,0.42091],["74",0.88929,0.36238],["75",0.96849,0.47362],["76",0.95596,0.57248],["79",0.78568,0.58666],["82",0.83809,0.54446],["83",0.80988,0.58541],["86",0.36145,0.41156],["88",0.33002,0.4317],["91",0.93251,0.5006],["92",0.9378,0.44328],["93",0.85742,0.37356],["94",0.83468,0.3624],["95",0.89812,0.38902],["96",0.81187,0.60419],["98",0.39423,0.72509],["99",0.49946,0.69157]]
 };
});
