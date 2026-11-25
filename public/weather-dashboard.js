/* SKI-je mountain forecasts. All values are model predictions, not local measurements. */
(function(root){
'use strict';
const areas={
 salve:[['Hohe Salve',47.46508,12.20384,1829],['Söll',47.503,12.192,700]],
 hartkaiser:[['Hartkaiser',47.49194,12.27167,1555],['Ellmau',47.514,12.301,820]],
 scheffau:[['Brandstadl',47.490,12.258,1650],['Scheffau',47.529,12.251,745]],
 brixen:[['Hochbrixen',47.457,12.239,1300],['Brixen im Thale',47.449,12.251,790]],
 westendorf:[['Choralpe',47.413,12.235,1820],['Westendorf',47.436,12.213,790]],
 going:[['Astberg',47.505,12.337,1267],['Going',47.531,12.328,800]],
 itter:[['Kleine Salve',47.454,12.168,1565],['Itter',47.472,12.142,703]],
 hopfgarten:[['Hohe Salve',47.46508,12.20384,1829],['Hopfgarten',47.451,12.156,621]]
};
const current='temperature_2m,apparent_temperature,weather_code,is_day,precipitation,snowfall,wind_speed_10m,wind_direction_10m,wind_gusts_10m';
const hourly='temperature_2m,apparent_temperature,weather_code,is_day,precipitation_probability,precipitation,snowfall,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,cloud_cover,freezing_level_height';
const daily='weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,snowfall_sum,wind_gusts_10m_max,sunrise,sunset,sunshine_duration';
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const fmt=(v,n=0,unit='')=>finite(v)?v.toFixed(n)+unit:'—';
function point(area,level){const item=(areas[area]||areas.hopfgarten)[level==='valley'?1:0];return {name:item[0],lat:item[1],lng:item[2],elevation:item[3],timezone:'Europe/Vienna'};}
function query(p){const q=new URLSearchParams({latitude:String(p.lat),longitude:String(p.lng),timezone:p.timezone||'auto',forecast_days:'14',current,hourly,daily});if(finite(p.elevation))q.set('elevation',String(p.elevation));return q;}
function key(p){return [p.lat.toFixed(3),p.lng.toFixed(3),p.elevation??'auto',p.timezone||'auto'].join(':');}
function valid(data){return !!(data&&data.current&&Array.isArray(data.daily?.time)&&data.daily.time.length&&Array.isArray(data.hourly?.time)&&data.hourly.time.length&&Array.isArray(data.hourly.temperature_2m));}
function dateKey(t){return typeof t==='string'&&/^\d{4}-\d{2}-\d{2}/.test(t)?t.slice(0,10):'';}
function indices(data,day){return (data?.hourly?.time||[]).map((t,i)=>dateKey(t)===day?i:-1).filter(i=>i>=0);}
function val(group,k,i){return group?.[k]?.[i];}
function condition(code,day=1){
 if(!finite(code))return ['—','Onbekend'];
 if(code===0)return [day===0?'🌙':'☀️','Helder'];
 if(code===1||code===2)return [day===0?'☁️':'🌤️','Halfbewolkt'];
 if(code===3)return ['☁️','Bewolkt'];
 if(code===45||code===48)return ['🌫️','Mist'];
 if([51,53,55,56,57].includes(code))return ['🌦️','Motregen'];
 if([61,63,65,66,67,80,81,82].includes(code))return ['🌧️','Regen'];
 if([71,73,75,77,85,86].includes(code))return ['🌨️','Sneeuw'];
 if(code>=95)return ['⛈️','Onweer'];
 return ['—','Onbekend'];
}
const compass=v=>finite(v)?['N','NE','E','SE','S','SW','W','NW'][Math.round(((v%360)+360)%360/45)%8]:'—';
function node(tag,cls,t){const n=document.createElement(tag);if(cls)n.className=cls;if(t!==undefined)n.textContent=t;return n;}
function pair(parent,label,value){const n=node('div','wx-stat');n.append(node('small','',label),node('strong','',value));parent.append(n);}
function locale(){return document.documentElement.lang||'nl';}
function dateLabel(day,long=false){if(!dateKey(day))return '—';const d=new Date(day+'T12:00:00Z');return Number.isFinite(d.getTime())?new Intl.DateTimeFormat(locale(),{weekday:long?'long':'short',day:'numeric',month:'short',timeZone:'UTC'}).format(d):day;}
function svgEl(tag,attrs){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));return n;}
function chart(container,h,ix){
 container.replaceChildren();
 const all=ix.flatMap(i=>[val(h,'temperature_2m',i),val(h,'apparent_temperature',i)]).filter(finite);
 if(!all.length)return;
 const low=Math.floor(Math.min(...all)/5)*5,high=Math.max(low+5,Math.ceil(Math.max(...all)/5)*5);
 const W=640,H=158,x=j=>36+j*580/Math.max(1,ix.length-1),y=t=>14+(high-t)*116/(high-low);
 const s=svgEl('svg',{viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Temperatuur en gevoelstemperatuur per uur'});
 for(let j=0;j<=4;j++){const t=high-(high-low)*j/4,yy=y(t);s.append(svgEl('line',{x1:36,y1:yy,x2:616,y2:yy,stroke:'#d4e6f0','stroke-dasharray':'3 4'}));const l=svgEl('text',{x:31,y:yy+4,'text-anchor':'end',fill:'#55758c','font-size':12});l.textContent=Math.round(t)+'°';s.append(l);}
 for(let j=0;j<ix.length;j+=4){const l=svgEl('text',{x:x(j),y:150,'text-anchor':'middle',fill:'#55758c','font-size':12});l.textContent=h.time[ix[j]].slice(11,16);s.append(l);}
 for(const [field,color,dash] of [['apparent_temperature','#b46320','5 4'],['temperature_2m','#087fbe','']]){
  let segment=[];const draw=()=>{if(segment.length>1)s.append(svgEl('polyline',{points:segment.join(' '),fill:'none',stroke:color,'stroke-width':3,'stroke-dasharray':dash,'stroke-linejoin':'round'}));segment=[];};
  ix.forEach((i,j)=>{const t=val(h,field,i);if(!finite(t)){draw();return;}segment.push(x(j)+','+y(t));if(field==='temperature_2m')s.append(svgEl('circle',{cx:x(j),cy:y(t),r:2.4,fill:color}));});draw();
 }
 container.append(s);
}
let activeData=null,selectedDay='',activeKey='',skiHours=false;
function clear(){activeData=null;selectedDay='';activeKey='';for(const id of ['wx-days','wx-day-detail','wx-chart','forecast-hours'])document.getElementById(id)?.replaceChildren();const e=document.getElementById('wx-current-condition');if(e)e.textContent='—';}
function render(data,k){
 if(!valid(data)){clear();return;}
 if(k!==activeKey){selectedDay='';skiHours=false;activeKey=k;}
 activeData=data;
 const d=data.daily,h=data.hourly,c=data.current;
 if(!d.time.includes(selectedDay))selectedDay=d.time[0];
 const [ic,desc]=condition(c.weather_code,c.is_day);const cur=document.getElementById('wx-current-condition');cur.replaceChildren(node('span','wx-current-icon',ic),node('span','',desc));
 document.getElementById('wx-feels').textContent=fmt(c.apparent_temperature,0,'°C');
 const list=document.getElementById('wx-days'),oldScroll=list.scrollLeft;list.replaceChildren();
 d.time.forEach((day,i)=>{
  if(!dateKey(day))return;
  const b=node('button','wx-day');b.type='button';b.setAttribute('aria-pressed',String(day===selectedDay));b.setAttribute('aria-label',dateLabel(day,true));const [icon,label]=condition(val(d,'weather_code',i));
  b.append(node('b','',dateLabel(day)),node('span','wx-icon',icon),node('span','wx-condition',label),node('strong','',fmt(val(d,'temperature_2m_max',i),0,'°')+' / '+fmt(val(d,'temperature_2m_min',i),0,'°')),node('span','','❄ '+fmt(val(d,'snowfall_sum',i),1,' cm')),node('span','','☂ '+fmt(val(d,'precipitation_probability_max',i),0,'%')),node('span','','💨 '+fmt(val(d,'wind_gusts_10m_max',i),0,' km/u')));
  if(i>=7)b.append(node('small','wx-trend','Trend'));
  b.addEventListener('click',()=>{selectedDay=day;render(data,k);});list.append(b);
 });list.scrollLeft=oldScroll;
 const i=d.time.indexOf(selectedDay),detail=document.getElementById('wx-day-detail');detail.replaceChildren();
 const heading=node('div','wx-day-heading');heading.append(node('h3','',dateLabel(selectedDay,true)));if(i>=7)heading.append(node('small','wx-trend','Minder zekere trend'));detail.append(heading);
 const stats=node('div','wx-stats');pair(stats,'Sneeuwval',fmt(val(d,'snowfall_sum',i),1,' cm'));pair(stats,'Neerslag',fmt(val(d,'precipitation_sum',i),1,' mm'));pair(stats,'Zonneschijn',finite(val(d,'sunshine_duration',i))?fmt(val(d,'sunshine_duration',i)/3600,1,' h'):'—');pair(stats,'Windstoten max.',fmt(val(d,'wind_gusts_10m_max',i),0,' km/u'));
 const rise=val(d,'sunrise',i),set=val(d,'sunset',i);pair(stats,'Zonsopkomst',typeof rise==='string'?rise.slice(11,16):'—');pair(stats,'Zonsondergang',typeof set==='string'?set.slice(11,16):'—');detail.append(stats);
 const ix=indices(data,selectedDay).filter(j=>!skiHours||(h.time[j].slice(11,16)>='08:00'&&h.time[j].slice(11,16)<='17:00'));
 document.getElementById('wx-all-hours').setAttribute('aria-pressed',String(!skiHours));document.getElementById('wx-ski-hours').setAttribute('aria-pressed',String(skiHours));
 chart(document.getElementById('wx-chart'),h,ix);
 const hours=document.getElementById('forecast-hours');hours.replaceChildren();
 for(const j of ix){
  const [icon,label]=condition(val(h,'weather_code',j),val(h,'is_day',j)),a=node('div','hour wx-hour');
  a.append(node('b','',h.time[j].slice(11,16)),node('span','wx-icon',icon),node('small','wx-condition',label),node('strong','wx-hour-temp',fmt(val(h,'temperature_2m',j),0,'°C')),node('span','','↳ '+fmt(val(h,'apparent_temperature',j),0,'°C')));
  const metrics=node('dl','wx-hour-details');
  for(const [label,v] of [['Neerslagkans',fmt(val(h,'precipitation_probability',j),0,'%')],['Neerslag',fmt(val(h,'precipitation',j),1,' mm')],['Sneeuwval',fmt(val(h,'snowfall',j),1,' cm')],['Wind',fmt(val(h,'wind_speed_10m',j),0,' km/u')+' '+compass(val(h,'wind_direction_10m',j))],['Windstoten',fmt(val(h,'wind_gusts_10m',j),0,' km/u')],['Zicht',finite(val(h,'visibility',j))?fmt(val(h,'visibility',j)/1000,1,' km'):'—'],['Bewolking',fmt(val(h,'cloud_cover',j),0,'%')],['Vorstgrens',fmt(val(h,'freezing_level_height',j),0,' m')]]){metrics.append(node('dt','',label),node('dd','',v));}
  a.append(metrics);hours.append(a);
 }
 if(!ix.length)hours.append(node('p','hint','Geen uurverwachting beschikbaar.'));
}
function setHours(ski){skiHours=ski;if(activeData)render(activeData,activeKey);}
root.SKIWeather={areas,point,query,key,valid,fmt,indices,condition,render,clear,setHours};
})(globalThis);
