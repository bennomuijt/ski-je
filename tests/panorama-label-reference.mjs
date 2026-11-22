/* Render visual evidence that PDF lift-number labels 22/23 align with the JPG served in the app.
 * Output image is for human review, NOT a GPS or lift-station coordinate claim. */
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const origin='https://media.skiwelt.at/media/panorama/winter/SkiWelt-Panorama-26-27-NL.jpg';
mkdirSync('test-artifacts',{recursive:true});
const image='test-artifacts/skiwelt-official-26-27.jpg';
execFileSync('curl',['-fLsS','--retry','2','--max-time','45','-o',image,origin],{stdio:'inherit'});
const meta=await sharp(image).metadata();
const {width:w,height:h}=meta;
if(!w||!h||meta.format!=='jpeg')throw Error('Officiële kaart niet als JPG geladen');
const aspect=w/h,reference=1697.949951171875/1173.5400390625;
if(Math.abs(aspect-reference)/reference>0.06)throw Error('JPG-verhouding wijkt af van PDF-vectorcoördinaten; niet publiceren: '+aspect);
const markers=[{number:'23',x:.5806,y:.61025},{number:'22',x:.60433,y:.61557}];
const left=Math.max(0,Math.floor(w*.54)),top=Math.max(0,Math.floor(h*.55));
const right=Math.min(w,Math.ceil(w*.66)),bottom=Math.min(h,Math.ceil(h*.69));
const cw=right-left,ch=bottom-top;
const rings=markers.map(p=>{
 const cx=Math.round(w*p.x)-left,cy=Math.round(h*p.y)-top;
 return '<circle cx="'+cx+'" cy="'+cy+'" r="13" fill="none" stroke="#00db74" stroke-width="4"/><path d="M'+(cx+12)+' '+(cy-12)+' l25 -24" stroke="#00db74" stroke-width="3"/><text x="'+(cx+39)+'" y="'+(cy-34)+'" fill="#fff" stroke="#19436c" stroke-width="5" paint-order="stroke" font-size="26" font-weight="bold">LIFT '+p.number+'</text>';
}).join('');
const labels=Buffer.from('<svg width="'+cw+'" height="'+ch+'" xmlns="http://www.w3.org/2000/svg">'+rings+'</svg>');
await sharp(image).extract({left,top,width:cw,height:ch}).composite([{input:labels}]).png().toFile('test-artifacts/lifts-22-23-pdf-coordinates-on-official-jpg.png');
await sharp(image).extract({left,top,width:cw,height:ch}).png().toFile('test-artifacts/lifts-22-23-reference-only.png');
const sum=createHash('sha256').update(readFileSync(image)).digest('hex');
writeFileSync('test-artifacts/panorama-dimensions.json',JSON.stringify({source:origin,sha256:sum,width:w,height:h,ratio:aspect,markers,notes:'Numbers are printed lift-label positions from official PDF research; compare visually with 2026/27 JPG.'},null,2));
console.log(JSON.stringify({width:w,height:h,ratio:aspect,source:origin,sha256:sum,markers}));
