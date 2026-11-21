/* Map-derived SkiWelt route preview. Draws actual OSM line geometry, not
 * arbitrary markers on the artistic panorama. Interactive touch zoom/pan.
 * No GPS required, no third-party map tile requests. */
(()=>{
 'use strict';
 const NS='http://www.w3.org/2000/svg';
 const svg=(name,attrs={})=>{const n=document.createElementNS(NS,name);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));return n;};
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const colours={lift:'#7848ab',blue:'#087dc9',red:'#d43e3b',black:'#242424',transfer:'#757b80',unknown:'#a2b2bf'};
 function mount(parent,result){
  const features=result?.features||[];
  const coords=features.flatMap(x=>x.points||[]).filter(x=>Array.isArray(x)&&x.length>=2);
  if(!coords.length)return;
  const host=node('section','graph-track-map');
  host.append(node('h3','', '🗺️ De complete route op een geografische kaart'));
  host.append(node('p','hint','Deze lijnen volgen de kaartgegevens van OpenSkiData/OSM. Ze zijn niet geijkt op de getekende SkiWelt-panoramakaart. Paarse lijnen zijn liften; pistes volgen de bekende kleuren. Grijs gestippeld betekent overstap; deze altijd controleren.'));
  const toolbar=node('div','graph-track-tools');
  const zoomIn=node('button','btn secondary small-btn','＋ Zoom in');
  const zoomOut=node('button','btn secondary small-btn','－ Zoom uit');
  const reset=node('button','btn secondary small-btn','⟲ Hele route');
  for(const button of [zoomIn,zoomOut,reset])button.type='button';
  toolbar.append(zoomIn,zoomOut,reset);host.append(toolbar);
  const frame=node('div','graph-track-frame');
  const image=svg('svg',{viewBox:'0 0 960 500',role:'img','aria-label':'Geografische route met aaneengesloten liften en pistes'});
  const bg=svg('rect',{x:0,y:0,width:960,height:500,fill:'#e7f4fb'});
  image.append(bg);
  const left=Math.min(...coords.map(p=>p[0])),right=Math.max(...coords.map(p=>p[0]));
  const top=Math.max(...coords.map(p=>p[1])),bottom=Math.min(...coords.map(p=>p[1]));
  const centreLat=(top+bottom)/2;
  const dx=Math.max(.001,(right-left)*Math.cos(centreLat*Math.PI/180));
  const dy=Math.max(.001,top-bottom),scale=Math.min(845/dx,415/dy);
  const ex=(dx*scale),ey=dy*scale,offsetX=(960-ex)/2,offsetY=(500-ey)/2;
  const place=p=>[offsetX+(p[0]-left)*Math.cos(centreLat*Math.PI/180)*scale,
   offsetY+(top-p[1])*scale];
  const polyline=(points)=>points.map(p=>place(p).map(v=>v.toFixed(2)).join(',')).join(' ');
  for(let i=0;i<9;i++){
   image.append(svg('line',{x1:0,x2:960,y1:(i+1)*50,y2:(i+1)*50,stroke:'#cadfe8','stroke-width':1}));
  }
  const paths=[];
  features.forEach((s,i)=>{
   if(!s.points?.length)return;
   const colour=s.type==='piste'?(colours[s.level]||colours.unknown):colours[s.type]||colours.unknown;
   const line=svg('polyline',{points:polyline(s.points),fill:'none',stroke:colour,
    'stroke-width':s.type==='lift'?6:s.type==='transfer'?3.6:5,
    'stroke-linecap':'round','stroke-linejoin':'round',
    'stroke-dasharray':s.type==='transfer'?'8 7':'none',
    tabindex:0,role:'button','aria-label':s.label});
   line.dataset.feature=String(s.feature??'');
   const title=svg('title');title.textContent=s.label+' · '+Math.round(s.metres)+' m';line.append(title);
   line.addEventListener('click',()=>highlight(s.feature));
   image.append(line);paths.push({line,feature:s.feature});
  });
  function marker(p,title,fill){
   const [x,y]=place(p),c=svg('circle',{cx:x,cy:y,r:11,fill,stroke:'white','stroke-width':3});
   image.append(c);const tx=svg('text',{x:x+14,y:y-13,fill:'#123d55','font-size':18,'font-weight':700});
   tx.textContent=title;image.append(tx);
  }
  marker(coords[0],'START','#168c50');marker(coords.at(-1),'EIND','#f08523');
  const disclaimer=svg('text',{x:20,y:481,fill:'#274e65','font-size':15});
  disclaimer.textContent='OpenSkiData / OpenStreetMap (ODbL) · GLO-90 hoogte-inschatting · geen live status';
  image.append(disclaimer);
  let view={x:0,y:0,w:960,h:500};
  const set=()=>image.setAttribute('viewBox',[view.x,view.y,view.w,view.h].join(' '));
  function zoom(factor,x=view.x+view.w/2,y=view.y+view.h/2){
   const w=Math.max(95,Math.min(1200,view.w*factor)),h=w*500/960;
   const rx=(x-view.x)/view.w,ry=(y-view.y)/view.h;
   view={x:x-rx*w,y:y-ry*h,w,h};set();
  }
  zoomIn.addEventListener('click',()=>zoom(.72));zoomOut.addEventListener('click',()=>zoom(1.4));
  reset.addEventListener('click',()=>{view={x:0,y:0,w:960,h:500};set();});
  let gesture=null;
  const touchDist=([a,b])=>Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
  image.addEventListener('touchstart',ev=>{
   const t=[...ev.touches];
   gesture={touches:t.length,x:t[0]?.clientX,y:t[0]?.clientY,
    distance:t.length>1?touchDist(t):0,view:{...view}};
  },{passive:true});
  image.addEventListener('touchmove',ev=>{
   if(!gesture)return;
   ev.preventDefault();const t=[...ev.touches],rect=image.getBoundingClientRect();
   if(t.length>1&&gesture.touches>1){
    const ratio=gesture.distance/touchDist(t);
    view={...gesture.view};zoom(ratio);
   }else if(t.length===1&&gesture.touches===1){
    view={...gesture.view,x:gesture.view.x-(t[0].clientX-gesture.x)*gesture.view.w/rect.width,
     y:gesture.view.y-(t[0].clientY-gesture.y)*gesture.view.h/rect.height};set();
   }
  },{passive:false});
  image.addEventListener('touchend',()=>{gesture=null;},{passive:true});
  function highlight(feature){
   for(const {line,feature:f} of paths){
    line.style.opacity=feature===undefined||feature===null||feature===f?'1':'.20';
    line.setAttribute('stroke-width',String(feature===f?9:line.getAttribute('stroke-width')||5));
   }
  }
  frame.append(image);host.append(frame);parent.append(host);
  parent.addEventListener('click',event=>{
   const row=event.target.closest?.('.ski-route-step');
   if(!row)return;
   const i=Number(row.dataset.stepIndex),step=result.itinerary.steps[i];
   if(step?.feature!==undefined){highlight(step.feature);host.scrollIntoView({block:'nearest',behavior:'smooth'});}
  });
  window.SKIGeometryMapLast=image;
 }
 window.SKIGeometryView={mount};
})();
