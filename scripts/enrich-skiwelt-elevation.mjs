/* One-time Open-Meteo Copernicus GLO-90 lookup: the app does not call this API.
 * Input is checked-in ODbL geometry; outputs are elevations and uncertainty labels.
 * https://open-meteo.com/en/docs/elevation-api  (up to 100 points per batch).
 */
import{readFileSync,writeFileSync}from'node:fs';
const path='public/skiwelt-geometry.json';
const data=JSON.parse(readFileSync(path,'utf8'));
const keys=[],lookup=new Map();
for(const f of data.features)if(f.kind==='piste')
 for(const p of [f.line[0],f.line.at(-1)]){const key=p[0].toFixed(5)+','+p[1].toFixed(5);if(!lookup.has(key)){lookup.set(key,keys.length);keys.push([p[0],p[1]]);}}
console.log('Open-Meteo GLO-90 points:',keys.length,'unique');
const elevations=new Array(keys.length);
let errors=0;
function sleep(ms){return new Promise(ok=>setTimeout(ok,ms));}
const jobs=[];for(let i=0;i<keys.length;i+=75)jobs.push([i,keys.slice(i,i+75)]);
let cursor=0;
async function worker(){
 while(cursor<jobs.length){
  const [start,coords]=jobs[cursor++];
  const url='https://api.open-meteo.com/v1/elevation?latitude='+coords.map(x=>x[1]).join(',')+
    '&longitude='+coords.map(x=>x[0]).join(',');
  let result=null;
  for(let attempt=0;attempt<4;attempt++){
   try{
    const res=await fetch(url,{signal:AbortSignal.timeout(25000)});
    if(!res.ok)throw new Error('Elevation API HTTP '+res.status);
    const json=await res.json();
    if(!Array.isArray(json.elevation)||json.elevation.length!==coords.length)throw new Error('Invalid elevation response');
    result=json.elevation;break;
   }catch(error){console.error('Elevation batch',start,'attempt',attempt+1,String(error));await sleep(700*(attempt+1)**2);}
  }
  if(!result){errors+=coords.length;continue;}
  result.forEach((v,i)=>{if(Number.isFinite(v))elevations[start+i]=Math.round(v);else errors++;});
 }
}
await Promise.all(Array.from({length:3},()=>worker()));
for(const f of data.features)if(f.kind==='piste'){
 const first=f.line[0],last=f.line.at(-1);
 const z0=elevations[lookup.get(first[0].toFixed(5)+','+first[1].toFixed(5))];
 const z1=elevations[lookup.get(last[0].toFixed(5)+','+last[1].toFixed(5))];
 if(!Number.isFinite(z0)||!Number.isFinite(z1))continue;
 let total=0;const d=[0];for(let i=1;i<f.line.length;i++){total+=Math.hypot((f.line[i][0]-f.line[i-1][0])*75000,(f.line[i][1]-f.line[i-1][1])*111320);d.push(total);}
 f.line.forEach((p,i)=>{p[2]=Math.round(z0+(z1-z0)*(total?d[i]/total:0));});
}
data.terrainElevation={source:'Open-Meteo API (Copernicus GLO-90)',url:'https://open-meteo.com/en/docs/elevation-api',
 resolutionMetres:90,interpolation:'Elevations at piste ends, linear intermediate vertex interpolation',licence:'Copernicus attribution',observations:keys.length-errors,missing:errors,
 disclaimer:'90 m terrain model, not measured piste gradient; intersections require extra review'};
writeFileSync(path,JSON.stringify(data));
console.log('Elevation samples',data.terrainElevation);
if(errors>keys.length*.2)throw new Error('Elevation API incomplete: '+errors+'/'+keys.length);
