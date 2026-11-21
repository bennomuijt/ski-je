/* Official SkiWelt-Panorama-26-27-NL.pdf. These EIGHT restaurant numbers
 * were read directly as white vector text inside green badge backgrounds;
 * other green badges are graphic outlines and must NOT be guessed from OCR.
 * Normalized positions in the official PDF/JPG only, not GPS locations. */
(function(root){'use strict';
 const data={source:'https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.pdf',
  pageWidth:1697.949951171875,pageHeight:1173.5400390625,
  precision:'pdf-vector-hut-label-center',
  huts:[{"number":"62","x":0.36118,"y":0.31079,"method":"pdf-vector-text","confidence":"verified"},{"number":"95","x":0.89813,"y":0.38889,"method":"pdf-vector-text","confidence":"verified"},{"number":"61","x":0.34322,"y":0.42624,"method":"pdf-vector-text","confidence":"verified"},{"number":"66","x":0.83084,"y":0.52108,"method":"pdf-vector-text","confidence":"verified"},{"number":"76","x":0.95603,"y":0.57233,"method":"pdf-vector-text","confidence":"verified"},{"number":"79","x":0.78571,"y":0.58668,"method":"pdf-vector-text","confidence":"verified"},{"number":"99","x":0.49935,"y":0.69147,"method":"pdf-vector-text","confidence":"verified"},{"number":"18","x":0.72159,"y":0.84153,"method":"pdf-vector-text","confidence":"verified"}]};
 if(typeof module==='object'&&module.exports)module.exports=data;
 if(root)root.SKIPrintedHutAnchors=data;
})(typeof globalThis!=='undefined'?globalThis:this);
