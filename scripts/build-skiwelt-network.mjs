/* Build a directionally constrained offline SkiWelt intersection graph.
 * Every outgoing edge has an explicit arrival node: never jump between area
 * labels or silently skip a lift/piste. Geometry: OpenSkiData/OpenStreetMap.
 * Heights: OpenSkiData lift 3D + Copernicus GLO-90 piste estimates.
 * Transfers are marked as approximate; they are not official piste junctions.
 */
import{readFileSync,writeFileSync}from'node:fs';
const src=JSON.parse(readFileSync('public/skiwelt-geometry.json','utf8'));
const METERS_LON=111320*Math.cos(47.47*Math.PI/180),METERS_LAT=111320;
const X=p=>p[0]*METERS_LON,Y=p=>p[1]*METERS_LAT;
const euclid=(a,b)=>Math.hypot(X(a)-X(b),Y(a)-Y(b));
const pt=(a)=>[Number(a[0].toFixed(6)),Number(a[1].toFixed(6)),Number(a[2]??0)];
const nodes=[],features=[],parts=[],segments=[],edges=[],connections=[];
const addNode=p=>{nodes.push(pt(p));return nodes.length-1;};
let missingElevation=0,flatRuns=0;
for(const f of src.features){
 const line=f.line;
 if(!Array.isArray(line)||line.length<2)continue;
 if(f.kind==='piste'&&(!Number.isFinite(line[0][2])||!Number.isFinite(line.at(-1)[2]))){missingElevation++;continue;}
 const isLift=f.kind==='lift';
 const delta=line[0][2]-line.at(-1)[2]; // positive means piste geometry is drawn downhill
 const direction=isLift?'up':delta>12?'forward':delta< -12?'reverse':'flat';
 if(!isLift&&direction==='flat')flatRuns++;
 const feature=features.length;features.push({
  kind:f.kind,ref:f.ref,name:f.name,difficulty:f.difficulty,
  liftType:f.type,osm:f.osm,oneway:f.oneway,direction,source:'OpenSkiData/OpenStreetMap',
  a:line[0].slice(0,3),b:line.at(-1).slice(0,3)});
 const pointIds=line.map(addNode);
 parts.push({feature,pointIds});
 for(let i=0;i<pointIds.length-1;i++){
  const a=pointIds[i],b=pointIds[i+1];
  if(euclid(nodes[a],nodes[b])<0.2)continue;
  segments.push({feature,i,a,b,split:[{t:0,node:a},{t:1,node:b}]});
 }
}
const nearby=45,cell=70,grid=new Map(),bucket=(x,y)=>Math.floor(x/cell)+':'+Math.floor(y/cell);
const segmentAtIndex=new Map();
function addSpatial(s,idx){
 const a=nodes[s.a],b=nodes[s.b];
 const x0=Math.floor((Math.min(X(a),X(b))-nearby)/cell),x1=Math.floor((Math.max(X(a),X(b))+nearby)/cell);
 const y0=Math.floor((Math.min(Y(a),Y(b))-nearby)/cell),y1=Math.floor((Math.max(Y(a),Y(b))+nearby)/cell);
 for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){
  const key=x+':'+y;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(idx);
 }
}
for(let i=0;i<segments.length;i++)addSpatial(segments[i],i);
function neighbors(p){
 const x=Math.floor(X(p)/cell),y=Math.floor(Y(p)/cell),set=new Set();
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)
  for(const id of grid.get((x+dx)+':'+(y+dy))||[])set.add(id);
 return [...set];
}
function project(p,a,b){
 const ax=X(a),ay=Y(a),bx=X(b),by=Y(b),px=X(p),py=Y(p);
 const den=(bx-ax)**2+(by-ay)**2;
 const t=den<.01?0:Math.max(0,Math.min(1,((px-ax)*(bx-ax)+(py-ay)*(by-ay))/den));
 const x=ax+(bx-ax)*t,y=ay+(by-ay)*t;
 const z=(a[2]||0)+((b[2]||0)-(a[2]||0))*t;
 return{t,distance:Math.hypot(px-x,py-y),point:[x/METERS_LON,y/METERS_LAT,z]};
}
function splitNode(segmentIndex,t,p){
 const seg=segments[segmentIndex];
 if(t<.015)return seg.a;
 if(t>.985)return seg.b;
 for(const item of seg.split)if(Math.abs(item.t-t)<.015)return item.node;
 const id=addNode(p);seg.split.push({t,node:id});return id;
}
const pairKeys=new Set();
function connect(u,v,distance,kind='mapped'){
 if(u===v)return;
 const key=Math.min(u,v)+'|'+Math.max(u,v);
 if(pairKeys.has(key))return;
 const height=Math.abs(nodes[u][2]-nodes[v][2]);
 if(height>(kind==='station-access'||kind==='station-walk'?60:35))return;
 pairKeys.add(key);
 connections.push({u,v,metres:Math.round(distance*10)/10,kind,height:Math.round(height)});
}
// Anchor intersections at every piste line vertex: explicitly split other runs
// if geometries pass nearby, instead of skipping small traverses.
let automaticJunctions=0,stationConnectors=0,wideConnectors=0;
for(const part of parts){
 const f=features[part.feature],lift=f.kind==='lift';
 const vertexIndices=[...part.pointIds.keys()]; // Include real middle stations, e.g. Salvistabahn
 for(const i of vertexIndices){
  const vertex=part.pointIds[i],p=nodes[vertex],candidate=[];
  for(const sId of neighbors(p)){
   const seg=segments[sId],other=features[seg.feature];
   if(seg.feature===part.feature||other.kind==='lift')continue;
   const q=project(p,nodes[seg.a],nodes[seg.b]);
   const max=lift?36:12;
   if(q.distance>max||Math.abs(p[2]-q.point[2])>(lift?60:25))continue;
   // Exclude contact of two lines where one is a freeride track and the
   // other ordinary pistes? These still form a junction but route filters level.
   candidate.push({...q,sId,other:seg.feature});
  }
  candidate.sort((a,b)=>a.distance-b.distance);
  const used=new Set();
  for(const q of candidate){
   if(used.has(q.other))continue;used.add(q.other);
   if(used.size>(lift?4:3))break;
   const target=splitNode(q.sId,q.t,q.point);
   connect(vertex,target,q.distance,lift?(q.distance>18?'station-walk':'station-access'):'map-junction');
   if(lift)stationConnectors++;else automaticJunctions++;
   if(q.distance>18)wideConnectors++;
  }
 }
}
// Exact two-dimensional line crossings between slopes whose vertices may be
// far apart: only connect if terrain model indicates same elevation.
function intersect(a,b,c,d){
 const ax=X(a),ay=Y(a),bx=X(b),by=Y(b),cx=X(c),cy=Y(c),dx=X(d),dy=Y(d);
 const den=(bx-ax)*(dy-cy)-(by-ay)*(dx-cx);
 if(Math.abs(den)<1e-7)return null;
 const t=((cx-ax)*(dy-cy)-(cy-ay)*(dx-cx))/den;
 const u=((cx-ax)*(by-ay)-(cy-ay)*(bx-ax))/den;
 if(t<.01||t>.99||u<.01||u>.99)return null;
 return{t,u,point:[(ax+(bx-ax)*t)/METERS_LON,(ay+(by-ay)*t)/METERS_LAT]};
}
let crossed=0;const crossedPairs=new Set();
for(let i=0;i<segments.length;i++){
 const a=segments[i],fa=features[a.feature];
 if(fa.kind!=='piste')continue;
 const p=nodes[a.a],q=nodes[a.b],mid=[(p[0]+q[0])/2,(p[1]+q[1])/2];
 for(const j of neighbors(mid)){
  if(j<=i)continue;
  const b=segments[j],fb=features[b.feature];
  if(b.feature===a.feature||fb.kind!=='piste')continue;
  const ix=intersect(p,q,nodes[b.a],nodes[b.b]);if(!ix)continue;
  const z1=p[2]+(q[2]-p[2])*ix.t,z2=nodes[b.a][2]+(nodes[b.b][2]-nodes[b.a][2])*ix.u;
  if(Math.abs(z1-z2)>22)continue;
  const key=i+'|'+j;if(crossedPairs.has(key))continue;crossedPairs.add(key);
  const na=splitNode(i,ix.t,[...ix.point,z1]);
  const nb=splitNode(j,ix.u,[...ix.point,z2]);
  connect(na,nb,0,'map-crossing');crossed++;
 }
}
// SkiWelt Tour explicitly lists Going → Ellmau via piste 90 / Hartkaiserbahn 80.
// The OSM line ends 80 m short of the gondola entrance at valley level.
// Model that distance as an UNKNOWN walking transfer, never as a ski piste.
// https://www.skiwelt.at/nl/skiwelt-tour.html
const lift80=parts.find(p=>features[p.feature].kind==='lift'&&features[p.feature].ref==='80');
const piste90=parts.filter(p=>features[p.feature].kind==='piste'&&features[p.feature].ref==='90');
if(lift80){
 const bottom=lift80.pointIds[0],p=nodes[bottom];
 const candidates=piste90.flatMap(piste=>[piste.pointIds[0],piste.pointIds.at(-1)])
  .map(node=>({node,d:euclid(nodes[node],p),dz:Math.abs(nodes[node][2]-p[2])}))
  .filter(x=>x.d>=35&&x.d<=110&&x.dz<=30)
  .sort((a,b)=>a.d-b.d);
 if(candidates.length){
  const best=candidates[0];
  connect(best.node,bottom,best.d,'village-walk');
 }
}
function addEdge(from,to,feature,metres,kind='mapped'){
 if(from===to)return;
 const m=Math.max(1,Math.round(metres));
 edges.push([from,to,feature,m,kind]);
}
for(const seg of segments){
 const feature=features[seg.feature],sorted=seg.split.sort((a,b)=>a.t-b.t);
 for(let i=1;i<sorted.length;i++){
  const a=sorted[i-1].node,b=sorted[i].node,d=euclid(nodes[a],nodes[b]);
  if(d<.2)continue;
  if(feature.kind==='lift')addEdge(a,b,seg.feature,d,'lift-ascent');
  else if(feature.direction==='reverse')addEdge(b,a,seg.feature,d,'piste-descent');
  else if(feature.direction==='forward')addEdge(a,b,seg.feature,d,'piste-descent');
  else {
   // Flat means no trustworthy downhill bearing at GLO-90 resolution.
   // Such paths are shown as an uncertain crossing, never as verified downhill.
   addEdge(a,b,seg.feature,d,'flat-possible');addEdge(b,a,seg.feature,d,'flat-possible');
  }
 }
}
for(const c of connections){
 const kind=c.kind==='station-walk'?'station-walk':c.kind;
 addEdge(c.u,c.v,-1,c.metres,kind);
 addEdge(c.v,c.u,-1,c.metres,kind);
}
const liftRefs=features.filter(x=>x.kind==='lift'&&x.ref).map(x=>x.ref);
const lifts=new Set(liftRefs);
const stationSpecs=[
 ['Ellmau dalstation','80','bottom'],['Going dalstation','100','bottom'],
 ['Scheffau dalstation','61','bottom'],['Söll dalstation','40','bottom'],
 ['Brixen dalstation','1','bottom'],['Westendorf dalstation','110','bottom'],
 ['Hopfgarten dalstation','20','bottom'],['Itter dalstation','30','bottom'],
 ['Hopfgarten tussenstation','22','bottom'],['Hartkaiser bergstation','80','top'],
 ['Brandstadl bergstation','62','top'],['Hohe Salve','42','top']
];
const stations={};
for(const[name,ref,side]of stationSpecs){
 const feature=features.findIndex(f=>f.kind==='lift'&&f.ref===ref);
 if(feature<0)continue;
 const part=parts.find(p=>p.feature===feature);
 const node=side==='top'?part.pointIds.at(-1):part.pointIds[0];
 stations[name]={node,ref,side,point:nodes[node],label:name};
}
// Every mapped lift can now be used as a distinct departure / arrival station.
// Keep well-known valley stations first; store stable ID separate from display label.
// Only map lift midpoints explicitly drawn with >=3 geometry vertices.
for(const part of parts){
 const f=features[part.feature];if(f.kind!=='lift'||!f.ref)continue;
 const number=String(f.ref).toLowerCase(),name=f.name||'Lift '+number;
 const kinds=[['bottom',part.pointIds[0],'dalstation'],['top',part.pointIds.at(-1),'bergstation']];
 if(part.pointIds.length>2)for(let k=1;k<part.pointIds.length-1;k++)
  kinds.push(['middle'+k,part.pointIds[k],'tussenstation '+k]);
 for(const [side,node,desc]of kinds){
  const id='lift:'+number+':'+side;
  stations[id]={node,ref:f.ref,side,point:nodes[node],label:'Lift '+f.ref+' · '+name+' · '+desc,source:'mapped-lift-station'};
 }
}
const report={
 sourceFeatures:features.length,sourceLiftCount:features.filter(x=>x.kind==='lift').length,
 sourcePisteCount:features.filter(x=>x.kind==='piste').length,
 stationCount:Object.keys(stations).length,nodes:nodes.length,segments:segments.length,
 directedEdges:edges.length,mapJunctions:automaticJunctions,stationConnectors,wideConnectors,
 segmentCrossings:crossed,flatPistes:flatRuns,skippedMissingElevation:missingElevation,
 liftRefs:[...lifts].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})),
 pisteCodes:[...new Set(features.filter(f=>f.kind==='piste'&&f.ref).map(f=>f.ref))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})),
 stations,geometryPrecision:'OpenSkiData 2D paths + interpolated GLO-90 terrain height; transfers <=36 metres remain estimated'};
if(missingElevation)throw new Error('Missing elevation for '+missingElevation+' pistes. Refuse an incomplete ski network; fetch complete source first.');
const output={version:1,source:src.source,geometryAt:src.generatedAt,stations,nodes,features,edges,
 disclaimer:'Map geometry and 90 m terrain approximations; official resort signage, status, closing times and correct lift boarding take precedence.',
 attribution:src.attribution+'; Copernicus DEM from Open-Meteo'};
writeFileSync('public/skiwelt-network-graph.json',JSON.stringify(output));
writeFileSync('public/skiwelt-graph-summary.json',JSON.stringify(report,null,2)+'\n');
console.log('Graph:',JSON.stringify({...report,liftRefs:undefined,pisteCodes:undefined,stations:undefined}));
if(Object.keys(stations).length<10||report.directedEdges<1000||report.stationConnectors<30)
 throw new Error('Incomplete graph; inspect source geometry and station connections.');
