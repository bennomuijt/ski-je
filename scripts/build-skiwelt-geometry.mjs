/* Offline SkiWelt linework snapshot from Liftradar's OpenSkiData tiles.
 * The upstream provider combines OSM/OpenSkiData and explicitly exposes the
 * /ski/v1/10/{x}/{y}.json interface for app use. Never use OpenSkiMap vector
 * tile service directly. Data licensing: ODbL 1.0, see public/SKIWELT-MAP-DATA.md.
 * This importer is a BUILD TOOL; the SKI-je PWA reads our own local JSON.
 */
import {writeFileSync} from 'node:fs';
const Z=10, tiles=[[546,357],[547,357],[546,358],[547,358]];
const B={west:12.075,east:12.48,south:47.37,north:47.58};
const round=n=>Math.round(n*1e6)/1e6;
const inBound=([lon,lat])=>lon>=B.west&&lon<=B.east&&lat>=B.south&&lat<=B.north;
const identify=f=>f?.lr==='at/skiwelt'||(f?.name||'').toLowerCase().includes('skiwelt');
const api='https://liftradar.eu/ski/v1';
const counts={};
const tilesData=[];
for(const [x,y] of tiles){
 const url=api+'/'+Z+'/'+x+'/'+y+'.json';
 const response=await fetch(url,{signal:AbortSignal.timeout(25000),headers:{Accept:'application/json'}});
 if(!response.ok)throw new Error('SkiWelt geometry source '+url+': HTTP '+response.status);
 const data=await response.json();
 if(!Array.isArray(data.areas)||!Array.isArray(data.lifts)||!Array.isArray(data.runs))throw new Error('Unexpected OpenSkiData tile schema '+url);
 counts[x+'-'+y]={areas:data.areas.length,lifts:data.lifts.length,runs:data.runs.length};
 tilesData.push({x,y,data});
}
const records=[],seen=new Set(),samples={lifts:[],runs:[]};let excluded=0,unknown=0;
for(const {x,y,data} of tilesData){
 const areaMatch=f=>(f?.areas||[]).some(i=>{
  const area=data.areas[i];return area?.lr?.id==='at/skiwelt'||(area?.name||'').toLowerCase().includes('skiwelt');
 });
 for(const [kind,list] of [['lift',data.lifts],['piste',data.runs]]){
  for(const f of list){
   if(!Array.isArray(f.c)||f.c.length<2||!f.c.some(inBound)){excluded++;continue;}
   if(f.lr&&f.lr!=='at/skiwelt'&&!areaMatch(f)){excluded++;continue;}
   if(!f.lr&&!areaMatch(f)){unknown++;continue;}
   if(kind==='piste'&&!Array.isArray(f.uses)){excluded++;continue;}
   if(kind==='piste'&&!f.uses.includes('downhill')&&!f.uses.includes('connection')){excluded++;continue;}
   if(kind==='lift'&&f.status&&f.status!=='operating'){excluded++;continue;}
   const line=f.c.map(p=>p.length>=3?[round(p[0]),round(p[1]),Math.round(p[2])]:[round(p[0]),round(p[1])]);
   // Split OpenSkiData ways are deliberately NOT deduplicated by OSM ID alone.
   const dedupe=kind+'|'+(f.osm||'')+'|'+String(f.ref||'')+'|'+line.length+'|'+line[0].join(',')+'|'+line.at(-1).join(',');
   if(seen.has(dedupe))continue;seen.add(dedupe);
   const value={id:kind+'-'+(records.length+1),kind,ref:String(f.ref||'').trim().slice(0,28),
     name:String(f.name||'').trim().slice(0,140),
     osm:String(f.osm||'').slice(0,55),difficulty:kind==='piste'?String(f.difficulty||'unknown'):'',
     uses:kind==='piste'?f.uses:[],oneway:kind==='piste'&&f.oneway===true,
     type:kind==='lift'?String(f.type||''):'',
     duration:kind==='lift'&&Number.isFinite(f.duration)?Math.round(f.duration):0,
     line};
   records.push(value);
   if(samples[kind==='lift'?'lifts':'runs'].length<45)samples[kind==='lift'?'lifts':'runs'].push({ref:value.ref,name:value.name,osm:value.osm,points:line.length,first:line[0],last:line.at(-1),difficulty:value.difficulty,type:value.type});
  }
 }
}
const source={version:1,source:'https://liftradar.eu/ski/v1/',upstream:'OpenSkiData / OpenSkiMap.org / OpenStreetMap',licence:'ODbL-1.0',
  attribution:'Data from OpenSkiData / OpenSkiMap.org, © OpenStreetMap contributors (ODbL), Skimap.org, Who’s On First, © Mapterhorn',
  generatedAt:new Date().toISOString(),geometryPrecision:'6 decimal places (latitude, longitude); not confirmed lift-piste junctions',
  bounds:B,features:records};
const summary={tiles:counts,features:records.length,lifts:records.filter(x=>x.kind==='lift').length,
 pistes:records.filter(x=>x.kind==='piste').length,excluded,unknown,
 namedLifts:records.filter(f=>f.kind==='lift'&&f.ref).length,
 numberedPistes:records.filter(f=>f.kind==='piste'&&f.ref).length,
 samples,matchedPiste7:records.filter(x=>x.kind==='piste'&&/^7(?:a|b)?$/.test(x.ref)).map(f=>({ref:f.ref,name:f.name,osm:f.osm})),
 sampleLiftHochbrixen:records.filter(f=>f.kind==='lift'&&/hochbrixen|filz|würstl|sonnenband|skischul/i.test(f.name)).map(f=>({ref:f.ref,name:f.name,osm:f.osm}))};
if(summary.lifts<40||summary.pistes<80)throw new Error('Insufficient SkiWelt coverage: '+JSON.stringify(summary).slice(0,1000));
writeFileSync('public/skiwelt-geometry.json',JSON.stringify(source));
writeFileSync('public/skiwelt-source-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log('Imported',summary.features,'features',summary.lifts,'lifts',summary.pistes,'pistes',summary.tiles);
